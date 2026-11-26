import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AppProvider,
  useApp,
  useAuth,
  useDirectory,
  useJobs,
  usePesoLra,
  useChatSocial,
} from '../src/context';
import { storageAdapter } from '../src/lib/storageAdapter';
import { distributeExtractedSkills, toDateInputValue } from '../src/views/seeker/wizard/wizardConstants';
import { mountWithProvider } from './testContextHarness';
import { TEST_EMPLOYERS, TEST_JOB_POSTS, TEST_JOB_SEEKERS, TEST_USERS } from './testFixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition: boolean, label: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

function useCombinedContexts() {
  return {
    app: useApp(),
    auth: useAuth(),
    dir: useDirectory(),
    jobs: useJobs(),
    lra: usePesoLra(),
    social: useChatSocial(),
  };
}

async function run() {
  console.log('--- eHANAP WP-07: Domain Context Slicing & Wizard Decomposition ---');

  // 1. Real Sliced Context Hooks via AppProvider
  const mounted = await mountWithProvider(AppProvider, useCombinedContexts);

  try {
    const adminUser = TEST_USERS.find((u) => u.role === 'admin')!;
    const puregoldEmployer = TEST_EMPLOYERS[0];
    const juanSeeker = TEST_JOB_SEEKERS[0];

    await mounted.act(async () => {
      mounted.getApi().auth.setUsers(TEST_USERS);
      mounted.getApi().dir.setEmployers(TEST_EMPLOYERS);
      mounted.getApi().dir.setJobSeekers(TEST_JOB_SEEKERS);
      mounted.getApi().jobs.setJobPosts(TEST_JOB_POSTS);
      storageAdapter.setStoredEmployers(TEST_EMPLOYERS);
      storageAdapter.setStoredJobSeekers(TEST_JOB_SEEKERS);
    });

    await mounted.act(async () => {
      await mounted.getApi().auth.loginAs(adminUser.email, 'password123');
    });

    assert(
      mounted.getApi().dir.employers.length === TEST_EMPLOYERS.length &&
        mounted.getApi().dir.jobSeekers.length === TEST_JOB_SEEKERS.length,
      'useDirectory exposes employers and jobSeekers state'
    );

    // JobsContext: subscription CRUD + cross-domain verifyEmployer
    let createdSubId = '';
    await mounted.act(async () => {
      const sub = mounted.getApi().jobs.addJobSubscription({
        userId: juanSeeker.userId,
        title: 'IT Alerts Roxas',
        categories: ['Information Technology & Software'],
        municipalities: ['Roxas'],
        keywords: ['React'],
        employmentTypes: ['Full-time'],
        isActive: true,
        isEmailAlertEnabled: true,
        isToastAlertEnabled: true,
      });
      createdSubId = sub.id;
    });
    assert(
      mounted.getApi().jobs.jobSubscriptions.some((s) => s.id === createdSubId),
      'useJobs.addJobSubscription persists subscription in JobsContext'
    );
    assert(
      mounted.getApi().app.jobSubscriptions.some((s) => s.id === createdSubId),
      'useApp mirrors JobsContext subscription state'
    );

    await mounted.act(async () => {
      mounted.getApi().jobs.deleteJobSubscription(createdSubId);
    });
    assert(
      !mounted.getApi().jobs.jobSubscriptions.some((s) => s.id === createdSubId),
      'useJobs.deleteJobSubscription removes subscription cleanly'
    );

    await mounted.act(async () => {
      mounted.getApi().app.verifyEmployer(puregoldEmployer.id, 'for_compliance', 'Update permit copy');
    });
    const updatedEmp = mounted.getApi().dir.employers.find((e) => e.id === puregoldEmployer.id);
    const empJobs = mounted.getApi().jobs.jobPosts.filter((j) => j.employerId === puregoldEmployer.id);
    assert(updatedEmp?.status === 'for_compliance', 'verifyEmployer updates employer status in DirectoryContext');
    assert(
      empJobs.length > 0 && empJobs.every((j) => j.companyVerified === false),
      'verifyEmployer propagates companyVerified across JobsContext jobPosts'
    );

    // PesoLraContext: LRA creation, nomination, HOTS placement, referral slip
    let newLraId = '';
    await mounted.act(async () => {
      const lra = mounted.getApi().lra.createLraEvent({
        companyName: 'Roxas Agri Expo Partner',
        companyOrigin: 'Calapan City',
        industry: 'Agriculture & Agribusiness',
        letterOfIntentStatus: 'approved',
        mayorsApprovalVerified: true,
        eventTitle: 'Roxas LRA Hiring Fair',
        eventDate: '2026-12-10',
        eventVenue: 'Roxas Municipal Gymnasium',
        targetPositions: ['Field Technician'],
        totalVacancies: 10,
        targetApplicantTypes: ['College Graduate', 'High School Graduate'],
        willingnessToRelocateRequired: false,
        status: 'scheduled',
        announcementPublished: true,
      });
      newLraId = lra.id;
    });
    assert(
      mounted.getApi().lra.localRecruitmentActivities.some((ev) => ev.id === newLraId),
      'usePesoLra.createLraEvent stores new LRA event'
    );
    assert(
      mounted.getApi().dir.announcements.some((a) => a.title.includes('Roxas Agri Expo Partner')),
      'usePesoLra.createLraEvent publishes announcement in DirectoryContext'
    );

    await mounted.act(async () => {
      mounted.getApi().lra.nominateCandidateToLra(newLraId, juanSeeker.id, 'Field Technician');
    });
    await mounted.act(async () => {
      mounted.getApi().lra.updateLraCandidateStatus(newLraId, juanSeeker.id, 'hired_on_the_spot');
    });
    const hotsSeeker = mounted.getApi().dir.jobSeekers.find((s) => s.id === juanSeeker.id);
    assert(
      hotsSeeker?.employmentStatus === 'hired_on_the_spot',
      'usePesoLra.updateLraCandidateStatus updates seeker employmentStatus to hired_on_the_spot'
    );

    // ChatSocialContext: bookmarks, reviews, conversation read state
    const targetJobId = TEST_JOB_POSTS[0].id;
    const wasBookmarked = mounted.getApi().social.isJobBookmarked(targetJobId);
    await mounted.act(async () => {
      mounted.getApi().social.toggleBookmarkJob(targetJobId);
    });
    assert(
      mounted.getApi().social.isJobBookmarked(targetJobId) === !wasBookmarked,
      'useChatSocial.toggleBookmarkJob flips bookmark state'
    );

    const beforeReviews = mounted.getApi().social.companyReviews.length;
    await mounted.act(async () => {
      mounted.getApi().social.addCompanyReview({
        employerId: puregoldEmployer.id,
        reviewerId: juanSeeker.userId,
        reviewerName: 'Juan Dela Cruz',
        rating: 5,
        comment: 'Clear interview schedule in Roxas.',
      });
    });
    assert(
      mounted.getApi().social.companyReviews.length === beforeReviews + 1,
      'useChatSocial.addCompanyReview appends company review'
    );

    await mounted.act(async () => {
      await mounted.getApi().app.resetToDemoData();
    });
    assert(
      mounted.getApi().app.currentUser === null &&
        mounted.getApi().dir.employers.length === 0 &&
        mounted.getApi().dir.jobSeekers.length === 0 &&
        mounted.getApi().jobs.jobPosts.length === 0 &&
        mounted.getApi().lra.localRecruitmentActivities.length === 0 &&
        mounted.getApi().social.companyReviews.length === 0,
      'resetToDemoData resets Auth, Directory, Jobs, PesoLra, and ChatSocial slices to clean slate'
    );
  } finally {
    await mounted.unmount();
  }

  // 2. Wizard Helpers: Date Normalization & 6-Category Skill Distribution
  assert(toDateInputValue('2001-04-15') === '2001-04-15', 'toDateInputValue preserves ISO YYYY-MM-DD');
  assert(toDateInputValue('May 14, 1999') === '1999-05-14', 'toDateInputValue parses natural month date');
  assert(toDateInputValue('not-a-date') === '', 'toDateInputValue returns empty string for invalid date');

  const distributed = distributeExtractedSkills({
    extractedSkills: ['SMAW Welding', 'Bookkeeping', 'Barista', 'POS Operation', 'React.js', 'Teamwork'],
  } as any);
  assert(distributed.tradeSkills.includes('SMAW Welding'), 'distributeExtractedSkills routes trade skill');
  assert(distributed.adminSkills.includes('Bookkeeping'), 'distributeExtractedSkills routes admin skill');
  assert(distributed.serviceSkills.includes('Barista'), 'distributeExtractedSkills routes service skill');
  assert(distributed.salesSkills.includes('POS Operation'), 'distributeExtractedSkills routes sales skill');
  assert(distributed.itSkills.includes('React.js'), 'distributeExtractedSkills routes IT skill');
  assert(distributed.softSkills.includes('Teamwork'), 'distributeExtractedSkills routes soft skill');

  const defaultSoft = distributeExtractedSkills({ extractedSkills: [] } as any);
  assert(defaultSoft.softSkills.length >= 4, 'distributeExtractedSkills populates default foundational soft skills when empty');

  // 3. Structural Line Counts, Exports & Acyclic Boundaries
  const appCtxLines = fs.readFileSync(path.join(rootDir, 'src/context/AppContext.tsx'), 'utf-8').split('\n').length;
  assert(appCtxLines <= 650, `AppContext.tsx line count reduced to <= 650 lines (actual: ${appCtxLines})`);

  const contextFiles = [
    'src/context/persistence.ts',
    'src/context/DirectoryContext.tsx',
    'src/context/JobsContext.tsx',
    'src/context/PesoLraContext.tsx',
    'src/context/ChatSocialContext.tsx',
  ];
  for (const rel of contextFiles) {
    assert(fs.existsSync(path.join(rootDir, rel)), `${rel} exists`);
  }

  const dirSrc = fs.readFileSync(path.join(rootDir, 'src/context/DirectoryContext.tsx'), 'utf-8');
  const jobsSrc = fs.readFileSync(path.join(rootDir, 'src/context/JobsContext.tsx'), 'utf-8');
  const lraSrc = fs.readFileSync(path.join(rootDir, 'src/context/PesoLraContext.tsx'), 'utf-8');
  const socialSrc = fs.readFileSync(path.join(rootDir, 'src/context/ChatSocialContext.tsx'), 'utf-8');
  assert(
    !dirSrc.includes('./JobsContext') &&
      !dirSrc.includes('./PesoLraContext') &&
      !dirSrc.includes('./AppContext') &&
      !jobsSrc.includes('./AppContext') &&
      !lraSrc.includes('./AppContext') &&
      !socialSrc.includes('./AppContext'),
    'Domain contexts have zero circular imports back to AppContext or downstream slices'
  );

  const wizardSrc = fs.readFileSync(path.join(rootDir, 'src/views/seeker/SeekerProfileSetupWizard.tsx'), 'utf-8');
  const wizardLines = wizardSrc.split('\n').length;
  assert(wizardLines <= 650, `SeekerProfileSetupWizard.tsx line count reduced to <= 650 lines (actual: ${wizardLines})`);

  const wizardFiles = [
    'src/views/seeker/wizard/index.ts',
    'src/views/seeker/wizard/wizardConstants.ts',
    'src/views/seeker/wizard/WizardStepResumeUpload.tsx',
    'src/views/seeker/wizard/WizardStepPersonalEducation.tsx',
    'src/views/seeker/wizard/WizardStepSkillsInventory.tsx',
    'src/views/seeker/wizard/WizardStepJobPreferences.tsx',
    'src/views/seeker/wizard/WizardStepValidation.tsx',
  ];
  for (const rel of wizardFiles) {
    assert(fs.existsSync(path.join(rootDir, rel)), `${rel} exists`);
  }
  assert(
    wizardSrc.includes('WizardStepResumeUpload') &&
      wizardSrc.includes('WizardStepPersonalEducation') &&
      wizardSrc.includes('WizardStepSkillsInventory') &&
      wizardSrc.includes('WizardStepJobPreferences') &&
      wizardSrc.includes('WizardStepValidation'),
    'SeekerProfileSetupWizard composes all 5 extracted step components'
  );

  console.log(`\n--- WP-07 Verification Summary: ${passed}/${total} tests passed ---`);
}

run().catch((err) => {
  console.error('[CRITICAL] WP-07 verification error:', err);
  process.exit(1);
});
