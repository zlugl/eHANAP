import { calculateDecisionTreeMatch } from '../src/utils/decisionTree';
import { JobPost, JobSeekerProfile } from '../src/types';

console.log('--- eHANAP Milestone 07: Decision Tree Scoring Engine Verification ---');

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

// ---------------------------------------------------------------------------
// Mock Base Entities
// ---------------------------------------------------------------------------
const baseJob: JobPost = {
  id: 'job-test-01',
  employerId: 'emp-puregold-01',
  companyName: 'Puregold Price Club (Roxas)',
  companyMunicipality: 'Roxas',
  companyVerified: true,
  title: 'Inventory & Cashier Specialist',
  category: 'Customer Service & Retail',
  workLocation: 'Brgy. Bagumbayan, Roxas',
  municipality: 'Roxas',
  employmentType: 'Full-time',
  minEducationalAttainment: "Bachelor's Degree",
  preferredDegree: 'BS Information Technology',
  degreeImportance: 'preferred',
  minExperienceYears: 2,
  experienceImportance: 'preferred',
  salaryRange: '₱14,000 - ₱18,000 / month',
  requiredSkills: ['Cash Handling', 'POS Operation', 'Inventory Audit', 'Customer Service'],
  preferredSkills: ['Barcode Scanning', 'Excel / Spreadsheet Literacy'],
  technicalSkills: ['Cash Handling', 'POS Operation'],
  softSkills: ['Customer Service'],
  requiredCertifications: ['TESDA National Certificate (NC II) in Retail Services'],
  description: 'Manage store inventory and point of sale cashiering.',
  responsibilities: ['Reconcile cash registers', 'Perform stock counting'],
  vacanciesCount: 3,
  applicationDeadline: '2026-12-31',
  status: 'active',
  postedDate: '2026-11-01T08:00:00.000Z',
  requirements: [],
};

const baseSeeker: JobSeekerProfile = {
  id: 'seeker-juan-01',
  userId: 'user-juan-01',
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  dateOfBirth: '2000-01-01',
  email: 'juan.delacruz@example.com',
  contactNumber: '0917-123-4567',
  address: 'Brgy. Paclasan, Roxas, Oriental Mindoro',
  municipality: 'Roxas',
  educationalAttainment: "Bachelor's Degree",
  primaryDegree: 'BS Information Technology',
  professionalSummary: 'Experienced retail cashier and customer service specialist in Roxas.',
  education: [],
  resumes: [],
  technicalSkills: ['Cash Handling', 'POS Operation', 'Inventory Audit', 'Customer Service'],
  softSkills: ['Punctual', 'Honest', 'Team Player'],
  tradeSkills: ['Barcode Scanning', 'Excel / Spreadsheet Literacy'],
  workExperience: [
    {
      id: 'exp-01',
      company: 'Roxas Commercial Center',
      position: 'Cashier Staff',
      startDate: '2024-01-01',
      endDate: '2026-01-01',
      isCurrent: false,
      yearsOfExperience: 2,
      responsibilities: 'Handled daily till balancing and barcode checkout.',
    },
  ],
  certifications: [
    {
      id: 'cert-01',
      name: 'TESDA National Certificate (NC II) in Retail Services',
      issuingOrganization: 'TESDA Oriental Mindoro',
      dateObtained: '2023-06-15',
    },
  ],
  assessments: [
    {
      id: 'asm-res-01',
      assessmentId: 'asm-retail-01',
      assessmentTitle: 'PESO Roxas Retail & POS Competency Exam',
      category: 'Trade & Technical',
      badge: 'PESO Verified',
      score: 95,
      passed: true,
      completedAt: '2026-02-10T10:00:00.000Z',
      verifiedSkills: ['POS Operation', 'Cash Handling'],
      correctCount: 19,
      totalCount: 20,
    },
  ],
  isProfileCompleted: true,
  updatedAt: '2026-11-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Test Suite 1: Null & Guard Handling
// ---------------------------------------------------------------------------
console.log('\n[Suite 1] Null, Undefined & Incomplete Inputs');
const nullResult = calculateDecisionTreeMatch(null, null);
assert(nullResult.outcome === 'NOT QUALIFIED', 'Null inputs produce NOT QUALIFIED outcome');
assert(nullResult.overallMatch === 50, 'Null inputs return default 50 score');
assert(nullResult.missingQualifications.length > 0, 'Null inputs record missing qualification reason');

const incompleteSeeker: JobSeekerProfile = {
  ...baseSeeker,
  primaryDegree: '',
  educationalAttainment: '' as any,
};
const incompleteResult = calculateDecisionTreeMatch(incompleteSeeker, baseJob);
assert(
  incompleteResult.missingQualifications.some(m => m.includes('Profile is incomplete')),
  'Incomplete seeker profile flags missing educational attainment or degree'
);

// ---------------------------------------------------------------------------
// Test Suite 2: Node 1 — Educational Attainment Rank (W_edu)
// ---------------------------------------------------------------------------
console.log('\n[Suite 2] Node 1 — Educational Attainment Rank Evaluation');

// Exactly meets
const exactEduResult = calculateDecisionTreeMatch(baseSeeker, baseJob);
assert(exactEduResult.educationMatchScore === 100, 'Exact educational level scores 100%');
assert(
  exactEduResult.matchedReasons.some(r => r.includes('matches accepted levels')),
  'Matched reasons record educational attainment success'
);

// Exceeds requirement (Master\'s Degree vs Bachelor\'s Degree)
const higherEduSeeker: JobSeekerProfile = {
  ...baseSeeker,
  educationalAttainment: "Master's Degree",
};
const higherEduResult = calculateDecisionTreeMatch(higherEduSeeker, baseJob);
assert(higherEduResult.educationMatchScore === 100, 'Exceeding educational attainment scores 100%');

// Deficit: High School vs Bachelor\'s Degree (Diff of 3 ranks)
const highSchoolSeeker: JobSeekerProfile = {
  ...baseSeeker,
  educationalAttainment: 'High School',
};
const deficitEduResult = calculateDecisionTreeMatch(highSchoolSeeker, baseJob);
assert(deficitEduResult.educationMatchScore <= 35, '3-rank deficit in educational attainment receives heavy penalty');
assert(
  deficitEduResult.missingQualifications.some(m => m.includes('Accepted educational level is')),
  'Deficit in educational level recorded in missing qualifications'
);

// Wizard / Extractor education labels map accurately
const collegeGradResult = calculateDecisionTreeMatch(
  { ...baseSeeker, educationalAttainment: 'College Graduate' },
  baseJob
);
assert(collegeGradResult.educationMatchScore === 100, "College Graduate meets Bachelor's Degree requirement (100%)");

const hsJobResult = calculateDecisionTreeMatch(
  { ...baseSeeker, educationalAttainment: 'High School Graduate' },
  { ...baseJob, minEducationalAttainment: 'High School Graduate' }
);
assert(hsJobResult.educationMatchScore === 100, 'High School Graduate meets High School Graduate job (100%)');

// Full EDUCATION_LEVELS parity across onboarding wizard & resume extractor labels
const shsJobResult = calculateDecisionTreeMatch(
  { ...baseSeeker, educationalAttainment: 'Senior High School' },
  { ...baseJob, minEducationalAttainment: 'High School Graduate' }
);
assert(shsJobResult.educationMatchScore === 100, 'Senior High School matches High School Graduate tier (100%)');

const vocResult = calculateDecisionTreeMatch(
  { ...baseSeeker, educationalAttainment: 'Vocational / TVET' },
  { ...baseJob, minEducationalAttainment: 'TVET / Vocational' }
);
assert(vocResult.educationMatchScore === 100, 'Vocational / TVET matches TVET / Vocational tier (100%)');

const undergradVsBachelor = calculateDecisionTreeMatch(
  { ...baseSeeker, educationalAttainment: 'College Undergraduate' },
  { ...baseJob, minEducationalAttainment: "Bachelor's Degree" }
);
assert(undergradVsBachelor.educationMatchScore === 85, 'College Undergraduate (rank 3.5) vs Bachelor (rank 4) scores 85%');

const docVsMasters = calculateDecisionTreeMatch(
  { ...baseSeeker, educationalAttainment: 'Doctorate Degree' },
  { ...baseJob, minEducationalAttainment: "Master's Degree" }
);
assert(docVsMasters.educationMatchScore === 100, "Doctorate Degree exceeds Master's Degree requirement (100%)");

// ---------------------------------------------------------------------------
// Test Suite 3: Node 2 — Primary Degree Alignment (W_deg)
// ---------------------------------------------------------------------------
console.log('\n[Suite 3] Node 2 — Primary Degree Alignment Evaluation');

// Exact degree match
assert(exactEduResult.degreeAlignmentScore === 100, 'Exact degree match receives 100%');

// Related field match: Computer Science for BS Information Technology job
const relatedDegreeSeeker: JobSeekerProfile = {
  ...baseSeeker,
  primaryDegree: 'BS Computer Science',
};
const relatedDegreeResult = calculateDecisionTreeMatch(relatedDegreeSeeker, baseJob);
assert(relatedDegreeResult.degreeAlignmentScore === 84, 'Related degree (CS <-> IT) scores 84%');
assert(
  relatedDegreeResult.matchedReasons.some(r => r.includes('closely related field')),
  'Related degree records rationale in matchedReasons'
);

// Unrelated field match: BS Hotel and Restaurant Management for IT job
const unrelatedDegreeSeeker: JobSeekerProfile = {
  ...baseSeeker,
  primaryDegree: 'BS Hotel and Restaurant Management',
};
const unrelatedDegreeResult = calculateDecisionTreeMatch(unrelatedDegreeSeeker, baseJob);
assert(unrelatedDegreeResult.degreeAlignmentScore === 40, 'Unrelated degree receives 40%');
assert(
  unrelatedDegreeResult.missingQualifications.some(m => m.includes('differs from accepted courses')),
  'Unrelated degree records discrepancy in missingQualifications'
);

// Word-boundary check: Hospitality, Fisheries, Economics do NOT match Tech abbreviations ('it', 'is', 'cs')
for (const nonTechDegree of ['BS Hospitality Management', 'BS Fisheries', 'BS Economics']) {
  const res = calculateDecisionTreeMatch({ ...baseSeeker, primaryDegree: nonTechDegree }, baseJob);
  assert(res.degreeAlignmentScore === 40, `${nonTechDegree} is not misclassified as Tech (40%, got ${res.degreeAlignmentScore}%)`);
}

// Standalone short degree codes: BS IT is a direct synonym (100%); BS CS and BS IS resolve as related Tech degrees (84%)
const bsItRes = calculateDecisionTreeMatch({ ...baseSeeker, primaryDegree: 'BS IT' }, baseJob);
assert(bsItRes.degreeAlignmentScore === 100, `BS IT matches BS Information Technology synonym group (100%, got ${bsItRes.degreeAlignmentScore}%)`);
for (const shortTechDegree of ['BS CS', 'BS IS']) {
  const res = calculateDecisionTreeMatch({ ...baseSeeker, primaryDegree: shortTechDegree }, baseJob);
  assert(res.degreeAlignmentScore === 84, `${shortTechDegree} matches related Tech degrees via word boundary (84%, got ${res.degreeAlignmentScore}%)`);
}

// Job accepting "Any Bachelor Degree"
const openDegreeJob: JobPost = {
  ...baseJob,
  preferredDegree: 'Any Bachelor Degree / Open to All Courses',
};
const openDegreeResult = calculateDecisionTreeMatch(unrelatedDegreeSeeker, openDegreeJob);
assert(openDegreeResult.degreeAlignmentScore === 100, 'Job accepting Any Degree grants 100% score');

// ---------------------------------------------------------------------------
// Test Suite 4: Node 3 — 6-Category Skills Competency Overlap (W_skills)
// ---------------------------------------------------------------------------
console.log('\n[Suite 4] Node 3 — Skills Competency Overlap Evaluation');

// Perfect match: All required + preferred + assessment bonus
const perfectSkillsResult = calculateDecisionTreeMatch(baseSeeker, baseJob);
assert(perfectSkillsResult.skillsMatchScore === 100, 'Complete required skills + assessment bonus achieves 100% skills score');

// Partial skills: Only 2 of 4 required skills (50% req, 0% pref => base 37.5% rounded to 38%)
const partialSkillsSeeker: JobSeekerProfile = {
  ...baseSeeker,
  technicalSkills: ['Cash Handling', 'POS Operation'],
  softSkills: [],
  tradeSkills: [],
  assessments: [],
};
const partialSkillsResult = calculateDecisionTreeMatch(partialSkillsSeeker, baseJob);
assert(partialSkillsResult.skillsMatchScore >= 35 && partialSkillsResult.skillsMatchScore <= 70, 'Partial required skills (2/4) scores proportionally');
assert(
  partialSkillsResult.missingQualifications.some(m => m.includes('Missing must-have skill: Inventory Audit')),
  'Missing required skills are explicitly itemized'
);

// Assessment verification bonus boost (+5% per passed exam up to 15%)
const unassessedSeeker: JobSeekerProfile = {
  ...baseSeeker,
  assessments: [],
};
const unassessedResult = calculateDecisionTreeMatch(unassessedSeeker, baseJob);
assert(
  perfectSkillsResult.skillsMatchScore >= unassessedResult.skillsMatchScore,
  'Verified PESO assessments provide a positive matching boost'
);

// ---------------------------------------------------------------------------
// Test Suite 5: Node 4 — Work Experience Delta (W_exp)
// ---------------------------------------------------------------------------
console.log('\n[Suite 5] Node 4 — Work Experience Delta Evaluation');

// Exactly meets requirement (2 years >= 2 years)
assert(exactEduResult.experienceMatchScore === 100, 'Meeting required work experience achieves 100% score');

// Exceeds requirement (5 years >= 2 years)
const seniorSeeker: JobSeekerProfile = {
  ...baseSeeker,
  workExperience: [
    {
      id: 'exp-02',
      company: 'Calapan Hypermarket',
      position: 'Senior Cashier',
      startDate: '2020-01-01',
      endDate: '2025-01-01',
      isCurrent: false,
      yearsOfExperience: 5,
      responsibilities: 'Store operations oversight',
    },
  ],
};
const seniorResult = calculateDecisionTreeMatch(seniorSeeker, baseJob);
assert(seniorResult.experienceMatchScore === 100, 'Exceeding required experience achieves 100% score');

// Fresh graduate job (0 years required)
const freshGradJob: JobPost = {
  ...baseJob,
  minExperienceYears: 0,
};
const freshGradResult = calculateDecisionTreeMatch(baseSeeker, freshGradJob);
assert(freshGradResult.experienceMatchScore === 100, 'Fresh graduate job grants 100% experience score');

// Deficit in experience: 1 year vs 4 years required
const demandingJob: JobPost = {
  ...baseJob,
  minExperienceYears: 4,
};
const underExpSeeker: JobSeekerProfile = {
  ...baseSeeker,
  workExperience: [
    {
      id: 'exp-03',
      company: 'Local Store',
      position: 'Assistant',
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      isCurrent: false,
      yearsOfExperience: 1,
      responsibilities: 'Retail support',
    },
  ],
};
const deficitExpResult = calculateDecisionTreeMatch(underExpSeeker, demandingJob);
assert(deficitExpResult.experienceMatchScore <= 40, 'Deficit in required experience receives proportional penalty');
assert(
  deficitExpResult.missingQualifications.some(m => m.includes('Requires 4 year(s) experience, candidate currently has 1 year(s).')),
  'Experience deficit recorded in missing qualifications'
);

// ---------------------------------------------------------------------------
// Test Suite 6: Node 5 — Certifications Verification (W_cert)
// ---------------------------------------------------------------------------
console.log('\n[Suite 6] Node 5 — Certifications Evaluation');

// Has required TESDA NC II
assert(exactEduResult.certificationsMatchScore === 100, 'Possessing required TESDA NC II scores 100%');

// Missing required certification (80% cert weight = 0, 20% local municipality weight = 100 => 20%)
const noCertSeeker: JobSeekerProfile = {
  ...baseSeeker,
  certifications: [],
};
const noCertResult = calculateDecisionTreeMatch(noCertSeeker, baseJob);
assert(noCertResult.certificationsMatchScore === 20, 'Missing required certifications with local residency scores 20%');
assert(
  noCertResult.missingQualifications.some(m => m.includes('Missing required license/eligibility:')),
  'Missing certification explicitly flagged'
);

// ---------------------------------------------------------------------------
// Test Suite 7: Heuristic Aggregation & Decision Tree Outcome
// ---------------------------------------------------------------------------
console.log('\n[Suite 7] Heuristic Aggregation & Classification Outcomes');

// Highly Qualified (Score >= 85%)
const topCandidateResult = calculateDecisionTreeMatch(baseSeeker, baseJob);
assert(topCandidateResult.overallMatch >= 85, `Top candidate overall match is ${topCandidateResult.overallMatch}% (>= 85%)`);
assert(topCandidateResult.outcome === 'HIGHLY QUALIFIED', 'Score >= 85% classifies as HIGHLY QUALIFIED');
assert(topCandidateResult.decisionReason.includes('strongly aligns'), 'Explainable decision reason provided for HIGHLY QUALIFIED');

// Qualified / Moderately Qualified (Score between 55% and 84%)
const qualifiedSeeker: JobSeekerProfile = {
  ...baseSeeker,
  primaryDegree: 'BS Hospitality Management', // 40% degree
  technicalSkills: ['Cash Handling', 'POS Operation', 'Customer Service'], // 3 of 4 req skills
  tradeSkills: [],
  certifications: [], // 0% cert
  assessments: [],
};
const qualifiedResult = calculateDecisionTreeMatch(qualifiedSeeker, baseJob);
assert(
  qualifiedResult.outcome === 'QUALIFIED' || qualifiedResult.outcome === 'MODERATELY QUALIFIED',
  `Mid-tier alignment produces QUALIFIED or MODERATELY QUALIFIED (Actual: ${qualifiedResult.outcome}, ${qualifiedResult.overallMatch}%)`
);

// Not Qualified (Under-qualified candidate fails both education and core skills)
const unqualifiedSeeker: JobSeekerProfile = {
  ...baseSeeker,
  educationalAttainment: 'High School',
  primaryDegree: 'General Secondary',
  technicalSkills: ['Gardening'],
  tradeSkills: [],
  softSkills: [],
  workExperience: [],
  certifications: [],
  assessments: [],
};
const unqualifiedResult = calculateDecisionTreeMatch(unqualifiedSeeker, baseJob);
assert(unqualifiedResult.overallMatch <= 40, `Unqualified candidate match is ${unqualifiedResult.overallMatch}% (<= 40%)`);
assert(unqualifiedResult.outcome === 'NOT QUALIFIED', 'Severely deficient candidate classifies as NOT QUALIFIED');
assert(unqualifiedResult.decisionReason.includes('does not currently meet mandatory'), 'Appropriate explanation for NOT QUALIFIED');

console.log(`\n--- Decision Tree Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
if (passedTests === totalTests) {
  console.log('Automated Candidate Ranking Decision Tree Engine is VERIFIED!\n');
} else {
  console.error(`Failed ${totalTests - passedTests} tests.\n`);
  process.exitCode = 1;
}
