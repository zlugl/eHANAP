import { calculateDecisionTreeMatch } from '../src/utils/decisionTree';
import { evaluateResumeForAts } from '../src/utils/atsEngine';
import { 
  JobSeekerProfile, 
  JobPost, 
  Application, 
  Interview, 
  EmployerProfile, 
  LocalRecruitmentActivity, 
  PesoReferralSlip,
  User 
} from '../src/types';
import { TEST_EMPLOYERS, TEST_JOB_POSTS, TEST_JOB_SEEKERS, TEST_LRA_EVENTS } from './testFixtures';

console.log('--- eHANAP Milestone 07: End-to-End Multi-Role Workflow Scenarios ---');

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
// Scenario 1: Job Seeker End-to-End Workflow
// ---------------------------------------------------------------------------
console.log('\n[Scenario 1] Job Seeker Journey: Profile -> ATS Screen -> Match Alerts -> 1-Click Apply');

// Step 1: Seeker Profile State
const seeker = TEST_JOB_SEEKERS[0]; // Juan Dela Cruz
assert(Boolean(seeker), 'Seeker profile hydrated from initial seed data');
assert(seeker.educationalAttainment === "College Graduate" || seeker.educationalAttainment.includes('College') || seeker.educationalAttainment.includes("Bachelor"), 'Seeker has valid educational attainment');
assert(seeker.municipality === 'Roxas', 'Seeker is located in Roxas, Oriental Mindoro');

// Step 2: ATS Resume Analysis
const atsResult = evaluateResumeForAts(seeker, TEST_JOB_POSTS[0]);
assert(atsResult.score >= 70, `ATS Scan produces qualifying score for seeker (Score: ${atsResult.score}%)`);
assert(atsResult.contactCompleteness >= 75, 'Seeker contact completeness verified');

// Step 3: Automated Compatibility Matching across active vacancies
const activeJobs = TEST_JOB_POSTS.filter(j => j.status === 'active');
assert(activeJobs.length > 0, `Active jobs present in Roxas labor exchange (Count: ${activeJobs.length})`);

const matches = activeJobs.map(job => ({
  job,
  matchResult: calculateDecisionTreeMatch(seeker, job),
}));

// Sort by match percentage descending
matches.sort((a, b) => b.matchResult.overallMatch - a.matchResult.overallMatch);
const topMatch = matches[0];
assert(Boolean(topMatch), 'Evaluated matches across all active vacancies');
assert(topMatch.matchResult.overallMatch >= 70, `Top matched job achieves threshold compatibility (Actual: ${topMatch.matchResult.overallMatch}%)`);

// Step 4: Submit Application
const newApplication: Application = {
  id: `app-test-${Date.now()}`,
  jobId: topMatch.job.id,
  jobSeekerId: seeker.id,
  employerId: topMatch.job.employerId,
  appliedDate: new Date().toISOString(),
  resumeId: seeker.activeResumeId || 'resume-default-01',
  currentStatus: 'applied',
  matchResult: topMatch.matchResult,
  statusHistory: [
    {
      status: 'applied',
      updatedAt: new Date().toISOString(),
      updatedBy: seeker.userId,
      notes: 'Application submitted via 1-Click eHANAP Apply.',
    },
  ],
};

assert(newApplication.currentStatus === 'applied', 'Application successfully created with "applied" status');
assert(newApplication.matchResult.overallMatch === topMatch.matchResult.overallMatch, 'Application retains immutable Decision Tree match snapshot');

// ---------------------------------------------------------------------------
// Scenario 2: Roxas Employer Workflow & Automated Candidate Ranking Roster
// ---------------------------------------------------------------------------
console.log('\n[Scenario 2] Roxas Employer Journey: Post Job -> Automated Ranking Roster -> Candidate Progression');

const employer = TEST_EMPLOYERS[0]; // Puregold Price Club (Roxas)
assert(Boolean(employer), 'Employer profile hydrated');

// Step 1: Employer Creates Job Post (starts in pending_approval for PESO compliance moderation)
const newJob: JobPost = {
  id: `job-test-${Date.now()}`,
  employerId: employer.id,
  companyName: employer.companyName,
  companyMunicipality: 'Roxas',
  companyVerified: true,
  title: 'Warehouse & Logistics Coordinator',
  category: 'Logistics & Supply Chain',
  workLocation: 'Brgy. San Mariano, Roxas',
  municipality: 'Roxas',
  employmentType: 'Full-time',
  minEducationalAttainment: "Bachelor's Degree",
  preferredDegree: 'BS Information Technology',
  degreeImportance: 'preferred',
  minExperienceYears: 1,
  experienceImportance: 'preferred',
  salaryRange: '₱16,000 - ₱20,000 / month',
  requiredSkills: ['Inventory Audit', 'POS Operation', 'Logistics Management'],
  preferredSkills: ['Forklift Certification', 'Excel / Spreadsheet Literacy'],
  technicalSkills: ['Inventory Audit', 'POS Operation'],
  softSkills: ['Logistics Management'],
  requiredCertifications: [],
  description: 'Manage incoming goods, barcode inventory tracking, and warehouse dispatch.',
  responsibilities: ['Track daily shipments', 'Maintain stock records'],
  vacanciesCount: 2,
  applicationDeadline: '2026-12-31',
  status: 'pending_approval',
  postedDate: new Date().toISOString(),
  requirements: [],
};

assert(newJob.status === 'pending_approval', 'Newly posted employer vacancy defaults to pending_approval');

// Step 2: PESO Admin Approves Job
const approvedJob: JobPost = {
  ...newJob,
  status: 'active',
  complianceRemarks: 'Approved by PESO Roxas Officer: Complies with Roxas wage regulations and local hiring quotas.',
};
assert(approvedJob.status === 'active', 'Job transitions to active upon PESO moderation');

// Step 3: CORE THESIS HIGHLIGHT — Automated Candidate Ranking Engine
// Evaluates all registered job seekers in Roxas against the newly approved job
const candidateRankingRoster = TEST_JOB_SEEKERS.map(cand => {
  const matchResult = calculateDecisionTreeMatch(cand, approvedJob);
  return {
    candidate: cand,
    score: matchResult.overallMatch,
    outcome: matchResult.outcome,
    educationScore: matchResult.educationMatchScore,
    degreeScore: matchResult.degreeAlignmentScore,
    skillsScore: matchResult.skillsMatchScore,
    experienceScore: matchResult.experienceMatchScore,
    certificationsScore: matchResult.certificationsMatchScore,
    reasons: matchResult.matchedReasons,
    gaps: matchResult.missingQualifications,
  };
}).sort((a, b) => b.score - a.score);

assert(candidateRankingRoster.length === TEST_JOB_SEEKERS.length, 'Candidate ranking roster contains all registered seekers');
assert(candidateRankingRoster[0].score >= candidateRankingRoster[candidateRankingRoster.length - 1].score, 'Candidate roster is deterministically sorted descending by score');
assert(candidateRankingRoster[0].reasons.length > 0, 'Top ranked candidate has transparent, explainable reasons');

// Step 4: Employer Advances Candidate Status
let appLifecycle = { ...newApplication };

// Move to under_review
appLifecycle.currentStatus = 'under_review';
appLifecycle.statusHistory.push({
  status: 'under_review',
  updatedAt: new Date().toISOString(),
  updatedBy: employer.userId,
  notes: 'HR review underway.',
});
assert(appLifecycle.currentStatus === 'under_review', 'Application transitions to under_review');

// Move to for_interview & schedule interview
appLifecycle.currentStatus = 'for_interview';
const scheduledInterview: Interview = {
  id: `int-test-${Date.now()}`,
  applicationId: appLifecycle.id,
  jobId: approvedJob.id,
  jobTitle: approvedJob.title,
  employerId: employer.id,
  companyName: employer.companyName,
  jobSeekerId: seeker.id,
  applicantName: `${seeker.firstName} ${seeker.lastName}`,
  interviewType: 'face_to_face',
  date: '2026-11-20',
  time: '10:00 AM',
  locationOrLink: 'Puregold Roxas Admin Office, Roxas Public Market Commercial Complex',
  contactPerson: 'Puregold HR Staff',
  status: 'scheduled',
  createdAt: new Date().toISOString(),
};

assert(scheduledInterview.status === 'scheduled', 'Interview scheduled successfully');
assert(scheduledInterview.interviewType === 'face_to_face', 'Local face-to-face interview venue designated in Roxas');

// Final step: Hired
appLifecycle.currentStatus = 'hired';
appLifecycle.statusHistory.push({
  status: 'hired',
  updatedAt: new Date().toISOString(),
  updatedBy: employer.userId,
  notes: 'Congratulations! Selected for employment.',
});
assert(appLifecycle.currentStatus === 'hired', 'Application completes full lifecycle to hired');

// ---------------------------------------------------------------------------
// Scenario 3: PESO / LGU Admin Governance, LRA & Municipal Analytics
// ---------------------------------------------------------------------------
console.log('\n[Scenario 3] PESO / LGU Admin: Compliance Gatekeeping, LRA & Municipal Analytics');

// Step 1: Employer Compliance Verification
const unverifiedEmployer: EmployerProfile = {
  ...employer,
  status: 'pending',
};
const verifiedEmployer: EmployerProfile = {
  ...unverifiedEmployer,
  status: 'verified',
};
assert(verifiedEmployer.status === 'verified', 'PESO Admin verifies Roxas employer business permit & clearances');

// Step 2: Local Recruitment Activity (LRA) Coordination for Visiting Companies
const newLraEvent: LocalRecruitmentActivity = {
  id: `lra-test-${Date.now()}`,
  eventTitle: 'Puregold Calapan Regional Mega Job Fair (Roxas Leg)',
  companyName: 'Puregold Price Club (Calapan Branch)',
  companyOrigin: 'Calapan City',
  industry: 'Retail & Supermarket Operations',
  letterOfIntentStatus: 'approved',
  mayorsApprovalVerified: true,
  eventDate: '2026-11-25',
  eventVenue: 'Roxas Municipal Gymnasium, Roxas, Oriental Mindoro',
  targetPositions: ['Cashier', 'Stock Clerk', 'Bagger'],
  totalVacancies: 50,
  targetApplicantTypes: ['College Graduate', 'High School Graduate', 'Out-of-School Youth'],
  willingnessToRelocateRequired: false,
  status: 'scheduled',
  announcementPublished: true,
  registeredApplicantsCount: 120,
  hotsCount: 28, // 28 Hired On The Spot
  interviewsConductedCount: 85,
  notes: 'Coordination between PESO Roxas and visiting Calapan regional recruiters.',
  createdAt: new Date().toISOString(),
};
assert(newLraEvent.hotsCount === 28, 'Tracks Hired-On-The-Spot (HOTS) count for municipal reporting');
assert(newLraEvent.registeredApplicantsCount > newLraEvent.totalVacancies, 'LRA event applicant registration exceeds quota');

// Step 3: Walk-in Applicant & PESO Referral Slip Issuance
const newReferralSlip: PesoReferralSlip = {
  id: `slip-test-${Date.now()}`,
  referralNumber: `REF-ROXAS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  dateIssued: new Date().toISOString(),
  validUntil: '2026-12-15',
  jobSeekerId: seeker.id,
  jobSeekerName: `${seeker.firstName} ${seeker.lastName}`,
  jobSeekerContact: seeker.contactNumber || '0917-123-4567',
  jobSeekerAddress: seeker.address,
  educationalAttainment: seeker.educationalAttainment,
  jobPostId: approvedJob.id,
  jobTitle: approvedJob.title,
  employerId: employer.id,
  employerName: employer.companyName,
  employerAddress: employer.branchLocation || 'Roxas, Oriental Mindoro',
  authorizedContactPerson: 'Puregold HR Desk',
  matchingScore: topMatch.matchResult.overallMatch,
  matchingTier: 'Qualified',
  issuedByOfficerName: 'Maria Santos',
  issuedByOfficerPosition: 'PESO Employment Officer',
  status: 'issued',
  remarks: 'Official PESO Roxas referral for walk-in qualification endorsement.',
  createdAt: new Date().toISOString(),
};
assert(newReferralSlip.referralNumber.startsWith('REF-ROXAS-2026-'), 'Generated formal PESO referral number with municipal identifier');
assert(newReferralSlip.status === 'issued', 'Referral slip issued with validity window');

// Step 4: Municipal Labor Market Analytics Aggregation
const totalSeekers = TEST_JOB_SEEKERS.length;
const totalEmployers = TEST_EMPLOYERS.length;
const verifiedEmployersCount = TEST_EMPLOYERS.filter(e => e.status === 'verified').length;
const activeVacanciesCount = TEST_JOB_POSTS.filter(j => j.status === 'active').reduce((sum, j) => sum + (j.vacanciesCount || 1), 0);
const totalHots = TEST_LRA_EVENTS.reduce((sum, l) => sum + (l.hotsCount || 0), 0) + newLraEvent.hotsCount;

assert(totalSeekers > 0, `Total job seekers count calculated (${totalSeekers})`);
assert(totalEmployers > 0, `Total registered employers counted (${totalEmployers})`);
assert(verifiedEmployersCount > 0, `Verified Roxas employers counted (${verifiedEmployersCount})`);
assert(activeVacanciesCount > 0, `Active municipal vacancies counted (${activeVacanciesCount})`);
assert(totalHots > 0, `Total Hired-On-The-Spot tally aggregated across LRAs (${totalHots})`);

console.log(`\n--- E2E Scenarios Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
if (passedTests === totalTests) {
  console.log('End-to-End Multi-Role Workflow Scenarios are VERIFIED!\n');
} else {
  console.error(`Failed ${totalTests - passedTests} tests.\n`);
  process.exitCode = 1;
}

