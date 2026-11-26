import { JobPost, JobSeekerProfile, MatchResult, DecisionTreeOutcome, DegreeAlignmentType } from '../types';

/**
 * Educational Attainment Rank Mapping (supports both legacy and multi-select modal options)
 */
const EDUCATION_LEVELS: Record<string, number> = {
  "No Formal Requirement": 0,
  "No Formal Requirement / Open to All": 0,
  "Out-of-School Youth": 1,
  "High School": 1,
  "High School / Junior High": 1,
  "High School Graduate": 1,
  "Senior High School": 2,
  "TVET / Vocational": 3,
  "Vocational / TVET": 3,
  "TVET / Technical Vocational": 3,
  "Vocational / TESDA Certificate": 3,
  "College Undergraduate": 3.5,
  "Associate Degree": 3.5,
  "Bachelor's Degree": 4,
  "College Graduate": 4,
  "Postgraduate Diploma": 5,
  "Master's Degree": 6,
  "Master's / Doctorate": 6,
  "Doctorate / PhD": 7,
  "Doctorate Degree": 7,
};

/**
 * Normalizes text string for case-insensitive matching
 */
function normalize(str: string): string {
  return (str || '').toLowerCase().trim();
}

function getEducationRank(label: string | undefined, fallback: number): number {
  if (!label) return fallback;
  if (EDUCATION_LEVELS[label] !== undefined) return EDUCATION_LEVELS[label];
  const norm = normalize(label);
  const exactKey = Object.keys(EDUCATION_LEVELS).find(k => normalize(k) === norm);
  if (exactKey) return EDUCATION_LEVELS[exactKey];
  if (norm.includes('doctor') || norm.includes('phd')) return 7;
  if (norm.includes('master') || norm.includes('mba')) return 6;
  if (norm.includes('postgraduate')) return 5;
  if (norm.includes('bachelor') || norm.includes('college graduate')) return 4;
  if (norm.includes('associate') || norm.includes('undergrad') || norm.includes('college level')) return 3;
  if (norm.includes('tvet') || norm.includes('vocational') || norm.includes('tesda')) return 2;
  if (norm.includes('high school') || norm.includes('senior high') || norm.includes('out-of-school') || norm.includes('osy')) return 1;
  return fallback;
}

function containsDegreeToken(text: string, token: string): boolean {
  if (!token) return false;
  if (token.length <= 3) {
    return new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text);
  }
  return text.includes(token);
}

/**
 * Common Philippine Course & Degree Abbreviation Synonym Groups
 */
const COURSE_SYNONYM_GROUPS: string[][] = [
  ['bscs', 'bs computer science', 'bachelor of science in computer science', 'computer science', 'comsci'],
  ['bsit', 'bs information technology', 'bachelor of science in information technology', 'information technology'],
  ['bscpe', 'bs computer engineering', 'bachelor of science in computer engineering', 'computer engineering', 'cpe'],
  ['bsis', 'bs information systems', 'bachelor of science in information systems', 'information systems'],
  ['bshm', 'bs hospitality management', 'bachelor of science in hospitality management', 'hospitality management', 'bshrm', 'hotel and restaurant management', 'hrm'],
  ['bstm', 'bs tourism management', 'bachelor of science in tourism management', 'tourism management', 'bs tourism', 'tourism'],
  ['bsa', 'bs accountancy', 'bachelor of science in accountancy', 'accountancy', 'accounting', 'bsais', 'accounting information system'],
  ['bsba', 'bs business administration', 'bachelor of science in business administration', 'business administration', 'business management', 'marketing management', 'financial management', 'human resource management'],
  ['bsn', 'bs nursing', 'bachelor of science in nursing', 'nursing'],
  ['bsce', 'bs civil engineering', 'bachelor of science in civil engineering', 'civil engineering'],
  ['bsee', 'bs electrical engineering', 'bachelor of science in electrical engineering', 'electrical engineering'],
  ['bsme', 'bs mechanical engineering', 'bachelor of science in mechanical engineering', 'mechanical engineering'],
  ['bsie', 'bs industrial engineering', 'bachelor of science in industrial engineering', 'industrial engineering'],
  ['bsed', 'bachelor of secondary education', 'secondary education', 'beed', 'bachelor of elementary education', 'elementary education', 'teacher education'],
  ['bsagri', 'bs agriculture', 'bachelor of science in agriculture', 'agriculture', 'bs agribusiness', 'agribusiness'],
  ['bscrim', 'bs criminology', 'bachelor of science in criminology', 'criminology'],
  ['bspsych', 'bs psychology', 'bachelor of science in psychology', 'psychology'],
  ['bspharm', 'bs pharmacy', 'bachelor of science in pharmacy', 'pharmacy'],
  ['bsmt', 'bs medical technology', 'bachelor of science in medical technology', 'medical technology', 'medtech'],
];

/**
 * Broad Related Field Clusters
 */
const RELATED_FIELD_CLUSTERS: string[][] = [
  ['computer science', 'information technology', 'software engineering', 'computer engineering', 'information systems', 'computer systems', 'bscs', 'bsit', 'bscpe', 'bsis'],
  ['accountancy', 'business administration', 'finance', 'management', 'marketing', 'entrepreneurship', 'economics', 'bookkeeping', 'office administration', 'bsa', 'bsba'],
  ['tourism', 'hospitality management', 'hotel and restaurant management', 'hrm', 'cookery', 'food and beverage', 'culinary', 'bshm', 'bstm'],
  ['agriculture', 'agribusiness', 'agronomy', 'crop science', 'agricultural engineering', 'forestry', 'fisheries'],
  ['civil engineering', 'electrical engineering', 'mechanical engineering', 'industrial engineering', 'architecture', 'electrical installation', 'smaw', 'rac', 'bsce', 'bsee', 'bsme', 'bsie'],
  ['nursing', 'medical technology', 'pharmacy', 'midwifery', 'physical therapy', 'radiologic technology', 'health', 'bsn'],
  ['secondary education', 'elementary education', 'education', 'teaching', 'bsed', 'beed'],
];

/**
 * Checks if a candidate's course/degree or TESDA cert matches a target course string
 * using abbreviation-aware and case-insensitive matching.
 */
function isDirectCourseOrCertMatch(candidateText: string, targetCourse: string): boolean {
  const normCand = normalize(candidateText);
  const normTarget = normalize(targetCourse);
  if (!normCand || !normTarget) return false;

  if (normCand === normTarget || normCand.includes(normTarget) || normTarget.includes(normCand)) {
    return true;
  }

  // Check abbreviation / synonym equivalence (e.g. BSCS <-> Bachelor of Science in Computer Science)
  for (const synGroup of COURSE_SYNONYM_GROUPS) {
    const candInGroup = synGroup.some(alias => {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return normCand === alias || normCand.includes(alias) || regex.test(normCand);
    });
    const targetInGroup = synGroup.some(alias => {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return normTarget === alias || normTarget.includes(alias) || regex.test(normTarget);
    });
    if (candInGroup && targetInGroup) {
      return true;
    }
  }

  return false;
}

/**
 * Computes multi-course / degree or TESDA specialization alignment between seeker and job
 */
function evaluateMultiCourseAlignment(
  seekerDegree: string,
  preferredCourses: string[],
  seekerCerts: string[] = [],
  acceptedEduLevels: string[] = [],
  anyCourseAllowed = false
): {
  score: number;
  type: DegreeAlignmentType;
  reason: string;
} {
  // Check if only non-degree / non-TESDA education tiers are required
  const hasDegreeOrTesdaTier =
    acceptedEduLevels.length === 0 ||
    acceptedEduLevels.some(lvl =>
      [
        "Bachelor's Degree",
        "Master's / Doctorate",
        'College Undergraduate',
        'Vocational / TESDA Certificate',
        'TVET / Vocational',
        'College Graduate',
      ].includes(lvl)
    );

  const normalizedCourses = (preferredCourses || [])
    .map(c => c.trim())
    .filter(Boolean);

  const hasWildcardCourse = normalizedCourses.some(c => {
    const lc = c.toLowerCase();
    return (
      lc.includes('any course') ||
      lc.includes('any related') ||
      lc.includes('open to all') ||
      lc.includes('not required')
    );
  });

  if (
    anyCourseAllowed ||
    !hasDegreeOrTesdaTier ||
    normalizedCourses.length === 0 ||
    hasWildcardCourse
  ) {
    return {
      score: 100,
      type: 'exact',
      reason: 'Job accepts any course/specialization or has no specific course restriction.',
    };
  }

  const candidateTexts = [seekerDegree, ...seekerCerts].filter(Boolean);

  // 1. Check direct or abbreviation-aware match against ANY course in preferredCourses
  for (const targetCourse of normalizedCourses) {
    for (const candText of candidateTexts) {
      if (isDirectCourseOrCertMatch(candText, targetCourse)) {
        return {
          score: 100,
          type: 'exact',
          reason: `Course/Qualification "${candText}" matches accepted specialization "${targetCourse}".`,
        };
      }
    }
  }

  // 2. Check if candidate's course is in a closely related field to ANY course in preferredCourses
  const combinedCandidateText = candidateTexts.map(normalize).join(' ');
  for (const targetCourse of normalizedCourses) {
    const normTarget = normalize(targetCourse);
    const isRelated = RELATED_FIELD_CLUSTERS.some(
      cluster =>
        cluster.some(kw => combinedCandidateText.includes(kw)) &&
        cluster.some(kw => normTarget.includes(kw))
    );
    if (isRelated) {
      return {
        score: 84,
        type: 'related',
        reason: `Background "${seekerDegree || candidateTexts[0] || 'Qualification'}" is in a closely related field to "${targetCourse}".`,
      };
    }
  }

  return {
    score: 40,
    type: 'unrelated',
    reason: `Specialization "${seekerDegree || 'Unspecified'}" differs from accepted courses (${normalizedCourses.slice(0, 3).join(', ')}).`,
  };
}

/**
 * Decision Tree Engine for eHANAP
 */
export function calculateDecisionTreeMatch(
  seeker: JobSeekerProfile | null | undefined,
  job: JobPost | null | undefined
): MatchResult {
  if (!seeker || !job) {
    return {
      jobId: job?.id || '',
      jobSeekerId: seeker?.id || '',
      overallMatch: 50,
      outcome: 'NOT QUALIFIED',
      educationMatchScore: 50,
      degreeAlignmentScore: 50,
      skillsMatchScore: 50,
      experienceMatchScore: 50,
      certificationsMatchScore: 50,
      matchedReasons: [],
      missingQualifications: ['Profile or job details missing'],
      decisionReason: 'Insufficient profile or job information to compute Decision Tree evaluation.',
    };
  }

  const matchedReasons: string[] = [];
  const missingQualifications: string[] = [];

  // 1. Profile Completeness check
  const isProfileComplete = Boolean(seeker.educationalAttainment);
  if (!isProfileComplete) {
    missingQualifications.push('Profile is incomplete (missing educational attainment details).');
  }

  // 2. Evaluate Educational Attainment Level (Supports multi-select acceptedEducationLevels + backward fallback)
  const acceptedEduLevels: string[] =
    job.acceptedEducationLevels && job.acceptedEducationLevels.length > 0
      ? job.acceptedEducationLevels
      : job.requiredEducationLevel
      ? [job.requiredEducationLevel]
      : job.minEducationalAttainment
      ? job.minEducationalAttainment
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [];

  const seekerEduRank = getEducationRank(seeker.educationalAttainment, 3);
  const acceptsAllEdu =
    acceptedEduLevels.length === 0 ||
    acceptedEduLevels.some(
      lvl =>
        lvl === 'No Formal Requirement' ||
        lvl === 'No Formal Requirement / Open to All' ||
        getEducationRank(lvl, 4) === 0
    );

  // Direct match against any selected education tier OR meeting the minimum accepted tier rank
  const directEduLevelMatch = acceptedEduLevels.some(
    lvl =>
      normalize(lvl) === normalize(seeker.educationalAttainment) ||
      (EDUCATION_LEVELS[lvl] !== undefined && EDUCATION_LEVELS[lvl] === seekerEduRank)
  );

  const minAcceptedEduRank =
    acceptedEduLevels.length > 0
      ? Math.min(...acceptedEduLevels.map(lvl => getEducationRank(lvl, 4)))
      : 0;

  let educationMatchScore = 100;
  if (acceptsAllEdu || directEduLevelMatch || seekerEduRank >= minAcceptedEduRank) {
    educationMatchScore = 100;
    matchedReasons.push(
      acceptsAllEdu
        ? `Open to all educational levels (${seeker.educationalAttainment || 'Any'}).`
        : `Educational level (${seeker.educationalAttainment}) matches accepted levels (${acceptedEduLevels.join(', ')}).`
    );
  } else {
    const diff = minAcceptedEduRank - seekerEduRank;
    educationMatchScore = Math.max(30, Math.round(100 - diff * 30));
    missingQualifications.push(
      `Accepted educational level is ${acceptedEduLevels.join(' / ')}, but profile has ${
        seeker.educationalAttainment || 'unspecified'
      }.`
    );
  }

  // 3. Evaluate Course / Degree / TESDA Specialization Alignment (Multi-select preferredCourses + fallback)
  const seekerAllCertNames = [
    ...(seeker.certifications || []).map(c => c.name),
    ...(seeker.tradeCertifications || []),
    ...(seeker.education || []).map(e => e.degreeCourse).filter(Boolean),
  ];

  const preferredCoursesList: string[] =
    job.preferredCourses && job.preferredCourses.length > 0
      ? job.preferredCourses
      : job.preferredDegree
      ? job.preferredDegree
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [];

  const combinedPreferredCourses = Array.from(
    new Set([...preferredCoursesList, ...(job.preferredTesdaQualifications || [])])
  );

  const degreeEval = evaluateMultiCourseAlignment(
    seeker.primaryDegree || '',
    combinedPreferredCourses,
    seekerAllCertNames,
    acceptedEduLevels,
    Boolean(job.anyCourseAllowed)
  );

  const degreeAlignmentScore = degreeEval.score;
  if (degreeEval.score >= 80) {
    matchedReasons.push(degreeEval.reason);
  } else if (combinedPreferredCourses.length > 0) {
    missingQualifications.push(degreeEval.reason);
  }

  // 4. Skills Match Evaluation across Must-Have (Required) vs Preferred
  const assessmentVerifiedSkills = (seeker.assessments || [])
    .filter(a => a.passed)
    .flatMap(a => a.verifiedSkills || [])
    .map(s => normalize(s));

  const seekerSkills = [
    ...(seeker.tradeSkills || []),
    ...(seeker.administrativeSkills || []),
    ...(seeker.serviceHospitalitySkills || []),
    ...(seeker.salesCustomerSkills || []),
    ...(seeker.itCreativeSkills || []),
    ...(seeker.technicalSkills || []),
    ...(seeker.softSkills || []),
    ...(seeker.practicalSkills || []),
    ...assessmentVerifiedSkills,
    ...(seeker.resumes?.find(r => r.id === seeker.activeResumeId)?.extractedSkills || []),
  ]
    .map(s => normalize(s))
    .filter(Boolean);

  // Derive Must-Have & Preferred skills from job.skills, job.evaluatedSkills, or legacy requiredSkills/preferredSkills
  let reqSkills: string[] = [];
  let prefSkills: string[] = [];

  if (job.skills && job.skills.length > 0) {
    reqSkills = job.skills.filter(s => s.priority === 'required').map(s => s.name);
    prefSkills = job.skills.filter(s => s.priority === 'preferred').map(s => s.name);
  } else if (job.evaluatedSkills && job.evaluatedSkills.length > 0) {
    reqSkills = job.evaluatedSkills.filter(s => s.required).map(s => s.name);
    prefSkills = job.evaluatedSkills.filter(s => !s.required).map(s => s.name);
  } else {
    reqSkills = job.requiredSkills || [];
    prefSkills = job.preferredSkills || [];
  }

  let reqMatchedCount = 0;
  reqSkills.forEach(reqSkill => {
    const normReq = normalize(reqSkill);
    const hasSkill = seekerSkills.some(s => s.includes(normReq) || normReq.includes(s));
    if (hasSkill) {
      reqMatchedCount++;
    } else {
      missingQualifications.push(`Missing must-have skill: ${reqSkill}`);
    }
  });

  const reqSkillsScore = reqSkills.length > 0 ? (reqMatchedCount / reqSkills.length) * 100 : 100;

  let prefMatchedCount = 0;
  prefSkills.forEach(prefSkill => {
    const normPref = normalize(prefSkill);
    const hasSkill = seekerSkills.some(s => s.includes(normPref) || normPref.includes(s));
    if (hasSkill) {
      prefMatchedCount++;
    } else {
      missingQualifications.push(`Missing preferred skill: ${prefSkill}`);
    }
  });

  const prefSkillsScore = prefSkills.length > 0 ? (prefMatchedCount / prefSkills.length) * 100 : 100;

  // Skill Assessment verification bonus
  const passedAssessments = (seeker.assessments || []).filter(a => a.passed);
  const assessmentBonus = Math.min(15, passedAssessments.length * 5);

  let baseSkillsScore = 100;
  if (reqSkills.length > 0 && prefSkills.length > 0) {
    baseSkillsScore = reqSkillsScore * 0.75 + prefSkillsScore * 0.25;
  } else if (reqSkills.length > 0) {
    baseSkillsScore = reqSkillsScore;
  } else if (prefSkills.length > 0) {
    baseSkillsScore = prefSkillsScore;
  }
  const skillsMatchScore = Math.min(100, Math.round(baseSkillsScore + assessmentBonus));

  if (reqSkills.length > 0) {
    matchedReasons.push(`Possesses ${reqMatchedCount} of ${reqSkills.length} must-have skills.`);
  }
  if (prefSkills.length > 0 && prefMatchedCount > 0) {
    matchedReasons.push(`Matches ${prefMatchedCount} of ${prefSkills.length} preferred skills.`);
  }
  if (passedAssessments.length > 0) {
    matchedReasons.push(
      `Verified competency: Earned ${passedAssessments.length} verified PESO skill assessment badge(s) (+${assessmentBonus}% matching boost).`
    );
  }

  // 5. Work Experience & Fresh Graduate Eligibility Evaluation
  let totalSeekerExperienceYears = 0;
  if (seeker.workExperience && seeker.workExperience.length > 0) {
    totalSeekerExperienceYears = seeker.workExperience.reduce(
      (sum, exp) => sum + (exp.yearsOfExperience || 1),
      0
    );
  } else {
    const activeResume = seeker.resumes?.find(r => r.id === seeker.activeResumeId);
    if (activeResume) {
      totalSeekerExperienceYears = activeResume.extractedExperienceYears || 0;
    }
  }

  const reqExperience = job.openToFreshGraduates ? 0 : job.minExperienceYears || 0;
  let experienceMatchScore = 100;

  if (job.openToFreshGraduates || totalSeekerExperienceYears >= reqExperience) {
    experienceMatchScore = 100;
    if (job.openToFreshGraduates && totalSeekerExperienceYears === 0) {
      matchedReasons.push('Role is open to Fresh Graduates (0 years required).');
    } else if (reqExperience > 0) {
      matchedReasons.push(
        `Has ${totalSeekerExperienceYears} yr(s) of work experience (meets required ${reqExperience} yr(s)).`
      );
    } else {
      matchedReasons.push(
        `Has ${totalSeekerExperienceYears} yr(s) experience (entry-level / fresh graduates welcome).`
      );
    }
  } else if (reqExperience > 0) {
    const ratio = totalSeekerExperienceYears / reqExperience;
    experienceMatchScore = Math.round(Math.max(25, ratio * 100));
    missingQualifications.push(
      `Requires ${reqExperience} year(s) experience, candidate currently has ${totalSeekerExperienceYears} year(s).`
    );
  }

  // 6. Licenses, Certifications & Location Eligibility Evaluation
  // When requiredLicenses is empty ([]), treat as "No License Required" and award full 100% license credit
  const seekerCertsPool = [
    ...seekerAllCertNames,
    ...seekerSkills,
    seeker.professionalSummary || '',
  ].map(c => normalize(c));

  const reqCerts = Array.from(
    new Set([...(job.requiredLicenses || []), ...(job.requiredCertifications || [])])
  ).filter(Boolean);

  let certsMatchedCount = 0;
  reqCerts.forEach(cert => {
    const normCert = normalize(cert);
    const hasCert =
      seekerCertsPool.some(c => c.includes(normCert) || normCert.includes(c)) ||
      (normCert.includes('tesda') &&
        (seeker.tradeCertifications?.length ||
          seeker.educationalAttainment?.toLowerCase().includes('vocational') ||
          seeker.educationalAttainment?.toLowerCase().includes('tvet'))) ||
      (normCert.includes('driver') &&
        seekerCertsPool.some(c => c.includes('driving') || c.includes('driver'))) ||
      (normCert.includes('prc') &&
        seekerCertsPool.some(
          c =>
            c.includes('registered') ||
            c.includes('licensed') ||
            c.includes('prc') ||
            c.includes('board')
        ));
    if (hasCert) {
      certsMatchedCount++;
    } else {
      missingQualifications.push(`Missing required license/eligibility: ${cert}`);
    }
  });

  // If no licenses are required ([]), do not penalize candidates — award 100% eligibility score
  let certificationsMatchScore = 100;
  if (reqCerts.length === 0) {
    certificationsMatchScore = 100;
    matchedReasons.push('No formal license required for this vacancy.');
  } else {
    const licenseScore = Math.round((certsMatchedCount / reqCerts.length) * 100);
    const locationScore =
      job.workSetup === 'Remote' ||
      !job.municipality ||
      !seeker.municipality ||
      normalize(seeker.municipality) === normalize(job.municipality) ||
      seeker.geographicMobility === 'provincial' ||
      seeker.geographicMobility === 'willing_to_relocate'
        ? 100
        : 85;

    certificationsMatchScore = Math.round(licenseScore * 0.8 + locationScore * 0.2);
    if (certsMatchedCount > 0) {
      matchedReasons.push(
        `Holds ${certsMatchedCount} of ${reqCerts.length} requested licenses/eligibilities.`
      );
    }
  }

  // 7. DECISION TREE WEIGHTED AGGREGATION (Supports 4-Factor Custom Weights or Legacy Weights)
  const combinedEducationAndDegreeScore = Math.round(
    educationMatchScore * 0.45 + degreeAlignmentScore * 0.55
  );

  let overallMatch: number;
  if (job.matchWeights) {
    const wEdu = (job.matchWeights.education ?? 30) / 100;
    const wSkills = (job.matchWeights.skills ?? 40) / 100;
    const wExp = (job.matchWeights.experience ?? 20) / 100;
    const wElig = (job.matchWeights.eligibility ?? 10) / 100;

    overallMatch = Math.round(
      combinedEducationAndDegreeScore * wEdu +
        skillsMatchScore * wSkills +
        experienceMatchScore * wExp +
        certificationsMatchScore * wElig
    );
  } else {
    overallMatch = Math.round(
      skillsMatchScore * 0.35 +
        degreeAlignmentScore * 0.25 +
        experienceMatchScore * 0.2 +
        educationMatchScore * 0.12 +
        certificationsMatchScore * 0.08
    );
  }

  // Decision Tree Node Classification
  let outcome: DecisionTreeOutcome;

  const eduWeightActive = !job.matchWeights || job.matchWeights.education > 0;
  const missingMandatoryEdu = eduWeightActive && !acceptsAllEdu && educationMatchScore < 50;
  const missingCriticalSkills = reqSkills.length > 0 && reqMatchedCount / reqSkills.length < 0.4;

  if (missingMandatoryEdu && missingCriticalSkills) {
    outcome = 'NOT QUALIFIED';
    overallMatch = Math.min(overallMatch, 38);
  } else if (overallMatch >= 85) {
    outcome = 'HIGHLY QUALIFIED';
  } else if (overallMatch >= 70) {
    outcome = 'QUALIFIED';
  } else if (overallMatch >= 55) {
    outcome = 'MODERATELY QUALIFIED';
  } else if (overallMatch >= 40) {
    outcome = 'LOW MATCH';
  } else {
    outcome = 'NOT QUALIFIED';
  }

  // Generate Decision Reason Summary
  let decisionReason = '';
  switch (outcome) {
    case 'HIGHLY QUALIFIED':
      decisionReason = `Candidate strongly aligns with ${job.title} at ${job.companyName}. Education (${seeker.primaryDegree || seeker.educationalAttainment || 'qualified'}) and skill competencies exceed key position benchmarks.`;
      break;
    case 'QUALIFIED':
      decisionReason = `Candidate satisfies mandatory qualifications for ${job.title}. Educational background and skill competencies align well with position requirements.`;
      break;
    case 'MODERATELY QUALIFIED':
      decisionReason = `Candidate meets baseline criteria for ${job.title}, but has slight skill or experience gaps compared to ideal candidate requirements.`;
      break;
    case 'LOW MATCH':
      decisionReason = `Candidate profile exhibits notable qualification differences or missing required skills for ${job.title}.`;
      break;
    case 'NOT QUALIFIED':
      decisionReason = `Candidate does not currently meet mandatory educational or technical skill prerequisites for this job posting.`;
      break;
  }

  return {
    jobId: job.id,
    jobSeekerId: seeker.id,
    overallMatch,
    outcome,
    educationMatchScore,
    degreeAlignmentScore,
    skillsMatchScore,
    experienceMatchScore,
    certificationsMatchScore,
    matchedReasons,
    missingQualifications,
    decisionReason,
  };
}
