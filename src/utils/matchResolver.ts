import { calculateDecisionTreeMatch } from './decisionTree';
import {
  JobSeekerProfile,
  JobPost,
  MatchResult,
  CandidateMatch,
  MatchResolverOptions,
  DecisionTreeOutcome,
} from '../types';

interface CacheEntry {
  result: MatchResult;
  versionKey: string;
  cachedAt: number;
}

const matchCache = new Map<string, CacheEntry>();
const cacheMetrics = {
  hits: 0,
  misses: 0,
};

/**
 * Creates a unique lookup key for a seeker and job pair.
 */
export function buildMatchCacheKey(seekerId: string, jobId: string): string {
  return `${seekerId}::${jobId}`;
}

/**
 * Creates a version fingerprint to detect when underlying seeker or job data has mutated.
 */
export function buildVersionKey(seeker: JobSeekerProfile | null | undefined, job: JobPost | null | undefined): string {
  const seekerVersion = seeker?.updatedAt || seeker?.id || 'unknown_seeker';
  const jobVersion = (job as any)?.updatedAt || job?.postedDate || job?.id || 'unknown_job';
  return `${seekerVersion}__${jobVersion}`;
}

/**
 * Default fallback MatchResult returned when inputs are invalid or incomplete.
 */
function createFallbackMatchResult(jobId: string = '', jobSeekerId: string = ''): MatchResult {
  return {
    jobId,
    jobSeekerId,
    overallMatch: 0,
    outcome: 'NOT QUALIFIED' as DecisionTreeOutcome,
    educationMatchScore: 0,
    degreeAlignmentScore: 0,
    skillsMatchScore: 0,
    experienceMatchScore: 0,
    certificationsMatchScore: 0,
    matchedReasons: [],
    missingQualifications: ['Missing profile or job posting details for evaluation'],
    decisionReason: 'Insufficient seeker or job vacancy data for Decision Tree evaluation.',
  };
}

/**
 * Resolves a pre-computed or memoized Decision Tree match for a candidate and job.
 * 
 * Order of resolution:
 * 1. Application snapshot (if provided and has matchResult)
 * 2. Pre-computed candidate matches from Supabase or storage cache (if provided)
 * 3. In-memory session cache (if version matches)
 * 4. Pure Decision Tree calculation (calculateDecisionTreeMatch) on cache miss
 */
export function getOrCalculateMatch(
  seeker: JobSeekerProfile | null | undefined,
  job: JobPost | null | undefined,
  options?: MatchResolverOptions
): MatchResult {
  if (!seeker || !job) {
    return createFallbackMatchResult(job?.id || '', seeker?.id || '');
  }

  const seekerId = seeker.id;
  const jobId = job.id;

  if (!seekerId || !jobId) {
    return createFallbackMatchResult(jobId, seekerId);
  }

  // 1. Prioritize application snapshot if candidate already applied
  if (options?.application?.matchResult) {
    return options.application.matchResult;
  }

  // 2. Prioritize pre-computed database match from candidate_matches table
  if (options?.cachedMatches) {
    const cached = options.cachedMatches;
    let foundMatch: any = null;

    if (Array.isArray(cached)) {
      foundMatch = cached.find((m: any) => {
        const mJobId = m.jobId || m.job_id;
        const mSeekerId = m.jobSeekerId || m.job_seeker_id;
        return mJobId === jobId && mSeekerId === seekerId;
      });
    } else if (cached instanceof Map) {
      foundMatch = cached.get(buildMatchCacheKey(seekerId, jobId)) || cached.get(`${jobId}:${seekerId}`);
    } else if (typeof cached === 'object') {
      foundMatch = (cached as any)[buildMatchCacheKey(seekerId, jobId)] || (cached as any)[`${jobId}:${seekerId}`];
    }

    if (foundMatch) {
      // Normalize to MatchResult interface
      const normalizedResult: MatchResult = {
        jobId,
        jobSeekerId: seekerId,
        overallMatch: Number(foundMatch.overallMatch ?? foundMatch.overall_match ?? 0),
        outcome: (foundMatch.outcome || 'QUALIFIED') as DecisionTreeOutcome,
        educationMatchScore: Number(foundMatch.educationMatchScore ?? foundMatch.education_match_score ?? 0),
        degreeAlignmentScore: Number(foundMatch.degreeAlignmentScore ?? foundMatch.degree_alignment_score ?? 0),
        skillsMatchScore: Number(foundMatch.skillsMatchScore ?? foundMatch.skills_match_score ?? 0),
        experienceMatchScore: Number(foundMatch.experienceMatchScore ?? foundMatch.experience_match_score ?? 0),
        certificationsMatchScore: Number(foundMatch.certificationsMatchScore ?? foundMatch.certifications_match_score ?? 0),
        matchedReasons: Array.isArray(foundMatch.matchedReasons || foundMatch.matched_reasons)
          ? foundMatch.matchedReasons || foundMatch.matched_reasons
          : [],
        missingQualifications: Array.isArray(foundMatch.missingQualifications || foundMatch.missing_qualifications)
          ? foundMatch.missingQualifications || foundMatch.missing_qualifications
          : [],
        decisionReason: foundMatch.decisionReason || foundMatch.decision_reason || 'Pre-computed candidate match',
      };
      return normalizedResult;
    }
  }

  const cacheKey = buildMatchCacheKey(seekerId, jobId);
  const currentVersion = buildVersionKey(seeker, job);

  // 3. Consult in-memory cache if recalculation is not forced
  if (!options?.forceRecalculate) {
    const cachedEntry = matchCache.get(cacheKey);
    if (cachedEntry && cachedEntry.versionKey === currentVersion) {
      cacheMetrics.hits++;
      return cachedEntry.result;
    }
  }

  // If computation is explicitly disabled, return fallback
  if (options?.allowCompute === false) {
    return createFallbackMatchResult(jobId, seekerId);
  }

  // 4. Compute via pure Decision Tree algorithm on cache miss
  cacheMetrics.misses++;
  const computedResult = calculateDecisionTreeMatch(seeker, job);

  // Store in cache with version fingerprint
  matchCache.set(cacheKey, {
    result: computedResult,
    versionKey: currentVersion,
    cachedAt: Date.now(),
  });

  return computedResult;
}

/**
 * Resolves matches for an entire roster of candidates against a target job vacancy.
 */
export function resolveRosterMatches(
  seekers: JobSeekerProfile[],
  job: JobPost,
  options?: MatchResolverOptions
): Array<{
  seeker: JobSeekerProfile;
  job: JobPost;
  matchResult: MatchResult;
  score: number;
  outcome: DecisionTreeOutcome;
}> {
  if (!seekers || seekers.length === 0 || !job) {
    return [];
  }

  return seekers.map(seeker => {
    const matchResult = getOrCalculateMatch(seeker, job, options);
    return {
      seeker,
      job,
      matchResult,
      score: matchResult.overallMatch,
      outcome: matchResult.outcome,
    };
  });
}

/**
 * Categorizes a numeric match score into standard eHANAP qualification tiers.
 */
export function getMatchScoreCategory(score: number): {
  score: number;
  label: string;
  badgeVariant: 'highly' | 'qualified' | 'potential' | 'general';
} {
  const rounded = Math.min(100, Math.max(0, Math.round(score)));

  if (rounded >= 85) {
    return { score: rounded, label: 'Highly Qualified', badgeVariant: 'highly' };
  }
  if (rounded >= 70) {
    return { score: rounded, label: 'Qualified', badgeVariant: 'qualified' };
  }
  if (rounded >= 55) {
    return { score: rounded, label: 'Potential Match', badgeVariant: 'potential' };
  }
  return { score: rounded, label: 'General Match', badgeVariant: 'general' };
}

/**
 * Maps a DecisionTreeOutcome to the official PESO Referral Slip tier label.
 */
export function outcomeToReferralTier(
  outcome: DecisionTreeOutcome
): 'Highly Qualified' | 'Qualified' | 'Moderately Qualified' | 'Low Match' {
  if (outcome === 'HIGHLY QUALIFIED') return 'Highly Qualified';
  if (outcome === 'QUALIFIED') return 'Qualified';
  if (outcome === 'MODERATELY QUALIFIED') return 'Moderately Qualified';
  return 'Low Match';
}

/**
 * Clears the entire in-memory match cache and resets metrics.
 */
export function clearMatchCache(): void {
  matchCache.clear();
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
}

/**
 * Evicts match cache entries for a specific seeker, job, or pair.
 */
export function invalidateMatchCache(seekerId?: string, jobId?: string): void {
  if (!seekerId && !jobId) {
    clearMatchCache();
    return;
  }

  for (const [key] of matchCache.entries()) {
    const [entrySeekerId, entryJobId] = key.split('::');
    const matchesSeeker = !seekerId || entrySeekerId === seekerId;
    const matchesJob = !jobId || entryJobId === jobId;

    if (matchesSeeker && matchesJob) {
      matchCache.delete(key);
    }
  }
}

/**
 * Returns current cache statistics for monitoring and testing.
 */
export function getMatchCacheStats(): { size: number; hits: number; misses: number } {
  return {
    size: matchCache.size,
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
  };
}
