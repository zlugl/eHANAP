import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-07: Centralize Decision Tree Match Resolver      ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

async function runVerification() {
  const rootDir = path.resolve(__dirname, '..');

  // -------------------------------------------------------------
  // Suite 1: Domain Match Resolver & In-Memory Caching (matchResolver.ts)
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] Domain Match Resolver & Caching (src/utils/matchResolver.ts)');

  const matchResolverPath = path.join(rootDir, 'src/utils/matchResolver.ts');
  assert(fs.existsSync(matchResolverPath), 'src/utils/matchResolver.ts exists on disk');

  if (fs.existsSync(matchResolverPath)) {
    const resolverContent = fs.readFileSync(matchResolverPath, 'utf-8');
    assert(resolverContent.includes('export function getOrCalculateMatch'), 'getOrCalculateMatch is exported');
    assert(resolverContent.includes('export function resolveRosterMatches'), 'resolveRosterMatches is exported');
    assert(resolverContent.includes('export function getMatchScoreCategory'), 'getMatchScoreCategory is exported');
    assert(resolverContent.includes('export function clearMatchCache'), 'clearMatchCache is exported');
    assert(resolverContent.includes('export function invalidateMatchCache'), 'invalidateMatchCache is exported');
    assert(resolverContent.includes('export function getMatchCacheStats'), 'getMatchCacheStats is exported');

    // Dynamic import to test execution behavior
    const matchResolver = await import('../src/utils/matchResolver.js').catch(() =>
      import('../src/utils/matchResolver.ts')
    );

    // Mock seeker profile and job post
    const mockSeeker: any = {
      id: 'seeker-test-01',
      userId: 'user-seeker-01',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      educationalAttainment: "Bachelor's Degree",
      primaryDegree: 'BS Information Technology',
      yearsOfExperience: 3,
      technicalSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      municipality: 'Roxas',
      updatedAt: '2026-11-10T10:00:00Z',
    };

    const mockJob: any = {
      id: 'job-test-01',
      employerId: 'emp-test-01',
      companyName: 'Mindoro Tech Solutions',
      title: 'Full Stack Web Developer',
      category: 'Information Technology & Software Development',
      minEducationalAttainment: "Bachelor's Degree",
      preferredDegree: 'BS Information Technology / Computer Science',
      requiredSkills: ['TypeScript', 'React', 'PostgreSQL'],
      minExperienceYears: 2,
      municipality: 'Roxas',
      status: 'active',
      updatedAt: '2026-11-10T10:00:00Z',
    };

    matchResolver.clearMatchCache();
    const stats0 = matchResolver.getMatchCacheStats();
    assert(stats0.size === 0, 'clearMatchCache empties the cache');

    // 1. Initial calculate & cache insertion
    const match1 = matchResolver.getOrCalculateMatch(mockSeeker, mockJob);
    assert(typeof match1.overallMatch === 'number' && match1.overallMatch > 0, 'Calculates initial match score');
    assert(Boolean(match1.outcome), 'Determines outcome (e.g. HIGHLY QUALIFIED or QUALIFIED)');
    assert(Array.isArray(match1.matchedReasons), 'Provides matched reasons array');
    assert(Boolean(match1.decisionReason), 'Provides human-readable decision reason');

    const stats1 = matchResolver.getMatchCacheStats();
    assert(stats1.size === 1, 'Cache size is 1 after initial calculation');
    assert(stats1.misses >= 1, 'Records cache miss on first computation');

    // 2. Repeat lookup - cache hit
    const match2 = matchResolver.getOrCalculateMatch(mockSeeker, mockJob);
    assert(match2.overallMatch === match1.overallMatch, 'Repeat lookup returns identical score');
    const stats2 = matchResolver.getMatchCacheStats();
    assert(stats2.hits >= 1, 'Records cache hit on repeat lookup');

    // 3. Pre-computed match priority (from candidate_matches table)
    const precomputedMatch: any = {
      id: 'match-precomputed-01',
      jobId: mockJob.id,
      jobSeekerId: mockSeeker.id,
      overallMatch: 99,
      outcome: 'HIGHLY QUALIFIED',
      educationMatchScore: 100,
      degreeAlignmentScore: 100,
      skillsMatchScore: 98,
      experienceMatchScore: 95,
      certificationsMatchScore: 90,
      matchedReasons: ['Pre-computed database match from candidate_matches table'],
      missingQualifications: [],
      decisionReason: 'Pre-computed by eHANAP backend',
      calculatedAt: '2026-11-09T00:00:00Z',
    };

    matchResolver.clearMatchCache();
    const matchFromPrecomputed = matchResolver.getOrCalculateMatch(mockSeeker, mockJob, {
      cachedMatches: [precomputedMatch],
    });
    assert(matchFromPrecomputed.overallMatch === 99, 'Prioritizes pre-computed match over on-the-fly calculation');
    assert(
      matchFromPrecomputed.decisionReason === 'Pre-computed by eHANAP backend',
      'Preserves pre-computed decision reason'
    );

    // 4. Pre-evaluated Application snapshot priority
    const mockAppWithSnapshot: any = {
      id: 'app-snapshot-01',
      jobId: mockJob.id,
      jobSeekerId: mockSeeker.id,
      matchResult: {
        jobId: mockJob.id,
        jobSeekerId: mockSeeker.id,
        overallMatch: 92,
        outcome: 'HIGHLY QUALIFIED',
        educationMatchScore: 100,
        degreeAlignmentScore: 90,
        skillsMatchScore: 90,
        experienceMatchScore: 90,
        certificationsMatchScore: 80,
        matchedReasons: ['Historical snapshot at application time'],
        missingQualifications: [],
        decisionReason: 'Snapshot from submitted application',
      },
    };

    matchResolver.clearMatchCache();
    const matchFromAppSnapshot = matchResolver.getOrCalculateMatch(mockSeeker, mockJob, {
      application: mockAppWithSnapshot,
    });
    assert(matchFromAppSnapshot.overallMatch === 92, 'Prioritizes application matchResult snapshot');
    assert(
      matchFromAppSnapshot.decisionReason === 'Snapshot from submitted application',
      'Preserves application snapshot decision reason'
    );

    // 5. Invalidate specific seeker/job cache
    matchResolver.clearMatchCache();
    matchResolver.getOrCalculateMatch(mockSeeker, mockJob);
    assert(matchResolver.getMatchCacheStats().size === 1, 'Cache populated');
    matchResolver.invalidateMatchCache(mockSeeker.id, mockJob.id);
    assert(matchResolver.getMatchCacheStats().size === 0, 'invalidateMatchCache evicts targeted match entry');

    // 6. Null safety fallback
    const nullResult = matchResolver.getOrCalculateMatch(null, null);
    assert(nullResult.overallMatch === 0, 'Returns 0 score for null seeker and job');
    assert(nullResult.outcome === 'NOT QUALIFIED', 'Returns NOT QUALIFIED outcome for null input');

    // 7. Score category helper
    const cat95 = matchResolver.getMatchScoreCategory(95);
    assert(cat95.label === 'Highly Qualified' && cat95.badgeVariant === 'highly', 'Categorizes >=85 as Highly Qualified');
    const cat75 = matchResolver.getMatchScoreCategory(75);
    assert(cat75.label === 'Qualified' && cat75.badgeVariant === 'qualified', 'Categorizes 70-84 as Qualified');
    const cat60 = matchResolver.getMatchScoreCategory(60);
    assert(cat60.label === 'Potential Match' && cat60.badgeVariant === 'potential', 'Categorizes 55-69 as Potential Match');
    const cat40 = matchResolver.getMatchScoreCategory(40);
    assert(cat40.label === 'General Match' && cat40.badgeVariant === 'general', 'Categorizes <55 as General Match');

    // 8. Roster resolution helper
    const roster = matchResolver.resolveRosterMatches([mockSeeker], mockJob);
    assert(Array.isArray(roster) && roster.length === 1, 'resolveRosterMatches returns mapped candidates array');
    assert(roster[0].seeker.id === mockSeeker.id, 'Roster item preserves seeker');
    assert(typeof roster[0].score === 'number', 'Roster item includes numeric score');
  }

  // -------------------------------------------------------------
  // Suite 2: AppContext Candidate Matches & Match Resolver Integration
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] AppContext Candidate Matches & State Integration');

  const appContextPath = path.join(rootDir, 'src/context/AppContext.tsx');
  assert(fs.existsSync(appContextPath), 'src/context/AppContext.tsx exists on disk');

  if (fs.existsSync(appContextPath)) {
    const appContextContent = fs.readFileSync(appContextPath, 'utf-8');
    assert(
      appContextContent.includes('import { getOrCalculateMatch') ||
      appContextContent.includes('getOrCalculateMatch,'),
      'AppContext imports getOrCalculateMatch from matchResolver'
    );
    assert(
      appContextContent.includes('invalidateMatchCache'),
      'AppContext imports invalidateMatchCache from matchResolver'
    );
    assert(
      appContextContent.includes('candidateMatches: CandidateMatch[];'),
      'AppContextType defines candidateMatches: CandidateMatch[]'
    );
    assert(
      appContextContent.includes('getMatch:') || appContextContent.includes('getMatch('),
      'AppContextType defines getMatch resolver function'
    );
    assert(
      appContextContent.includes('SUPABASE_TABLES.CANDIDATE_MATCHES') &&
      appContextContent.includes('subscribeToSupabaseTable<CandidateMatch>'),
      'AppContext subscribes to SUPABASE_TABLES.CANDIDATE_MATCHES via Realtime listener'
    );
    assert(
      appContextContent.includes('setCandidateMatches'),
      'AppContext manages candidateMatches state via setCandidateMatches'
    );
    assert(
      appContextContent.includes('candidateMatches,') || appContextContent.includes('candidateMatches:'),
      'AppContext exposes candidateMatches in provider value'
    );
    assert(
      appContextContent.includes('getMatch,') || appContextContent.includes('getMatch:'),
      'AppContext exposes getMatch in provider value'
    );
    assert(
      appContextContent.includes('invalidateMatchCache(seekerId)'),
      'updateJobSeekerProfile invalidates match cache on profile change'
    );
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log(`\n================================================================`);
  console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed`);
  console.log(`================================================================`);

  if (passedTests === totalTests && totalTests > 0) {
    console.log('🎉 ARCH-07 Suite 1 Verification Passed!');
  } else {
    console.error('❌ Some tests failed.');
    process.exitCode = 1;
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exitCode = 1;
});
