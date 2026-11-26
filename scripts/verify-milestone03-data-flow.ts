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
} from '../src/context';
import { storageAdapter } from '../src/lib/storageAdapter';
import { outcomeToReferralTier } from '../src/utils/matchResolver';
import { getFilteredUserNotifications } from '../src/utils/notificationUtils';
import {
  toSnakeCase,
  toCamelCase,
  SUPABASE_TABLES,
  COLLECTIONS,
} from '../src/services/supabaseService';
import { Application, CandidateMatch, JobPost } from '../src/types';
import { INITIAL_JOB_SUBSCRIPTIONS } from '../src/data/mockData';
import { INITIAL_REFERRAL_SLIPS, INITIAL_LRA_EVENTS } from '../src/data/pesoLguData';
import { mountWithProvider } from './testContextHarness';
import {
  TEST_ANNOUNCEMENTS,
  TEST_APPLICATIONS,
  TEST_AUDIT_LOGS,
  TEST_EMPLOYERS,
  TEST_INTERVIEWS,
  TEST_JOB_POSTS,
  TEST_JOB_SEEKERS,
  TEST_JOB_SUBSCRIPTIONS,
  TEST_LRA_EVENTS,
  TEST_NOTIFICATIONS,
  TEST_REFERRAL_SLIPS,
  TEST_USERS,
} from './testFixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- eHANAP Milestone 03: End-to-End Data Pipeline & Real AppContext Verification ---');

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

type AppApi = ReturnType<typeof useApp>;

function extractSqlTableColumns(sql: string): Record<string, string[]> {
  const tables: Record<string, string[]> = {};
  const tableRegex = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\n\);/g;
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(sql)) !== null) {
    const columns = match[2]
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          /^[a-z][a-z0-9_]*\s+[A-Z]/.test(line) &&
          !/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)\b/i.test(line)
      )
      .map((line) => line.split(/\s+/)[0]);
    tables[match[1]] = columns;
  }
  return tables;
}

function useCombinedContexts() {
  return {
    app: useApp(),
    auth: useAuth(),
    dir: useDirectory(),
    jobs: useJobs(),
    lra: usePesoLra(),
  };
}

async function runMilestone03Tests() {
  const mounted = await mountWithProvider(AppProvider, useCombinedContexts);
  const appApi = () => mounted.getApi().app;

  try {
    await mounted.act(async () => {
      mounted.getApi().auth.setUsers(TEST_USERS);
      mounted.getApi().dir.setEmployers(TEST_EMPLOYERS);
      mounted.getApi().dir.setJobSeekers(TEST_JOB_SEEKERS);
      storageAdapter.setStoredEmployers(TEST_EMPLOYERS);
      storageAdapter.setStoredJobSeekers(TEST_JOB_SEEKERS);
    });

    // ---------------------------------------------------------------------------
    // Suite 1: Job Post Creation, PESO Moderation & Notification Routing (Real AppContext)
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 1] Real AppContext Job Post Approval Pipeline & Notification Routing');

    const puregoldEmployer = TEST_EMPLOYERS[0];
    const puregoldUser = TEST_USERS.find((u) => u.id === puregoldEmployer.userId)!;
    const adminUser = TEST_USERS.find((u) => u.role === 'admin')!;
    assert(Boolean(puregoldEmployer && puregoldUser), 'Employer profile and user loaded for job creation');
    assert(Boolean(adminUser), 'PESO Municipal Admin account identified');

    await mounted.act(async () => {
      await appApi().loginAs(puregoldUser.email, 'password123');
    });
    assert(appApi().currentEmployerProfile?.id === puregoldEmployer.id, 'AppContext resolves currentEmployerProfile on login');

    let submittedJob!: JobPost;
    await mounted.act(async () => {
      submittedJob = appApi().createJobPost({
        employerId: puregoldEmployer.id,
        companyName: puregoldEmployer.companyName,
        companyLogo: puregoldEmployer.logoUrl,
        companyMunicipality: 'Roxas',
        title: 'IT & Store Systems Specialist',
        category: 'Information Technology & Software',
        workLocation: 'Brgy. Bagumbayan, Roxas',
        municipality: 'Roxas',
        employmentType: 'Full-time',
        salaryRange: '₱22,000 - ₱28,000 / month',
        description: 'Manage store IT terminals, web inventory systems, and SQL databases in Roxas.',
        responsibilities: ['Maintain POS systems', 'Support SQL inventory queries'],
        minEducationalAttainment: "Bachelor's Degree",
        preferredDegree: 'BS Information Technology',
        degreeImportance: 'preferred',
        minExperienceYears: 1,
        experienceImportance: 'preferred',
        requirements: [],
        requiredSkills: ['Cash Handling', 'POS Operation', 'React.js'],
        preferredSkills: ['Hardware Troubleshooting', 'Customer Service'],
        technicalSkills: ['Cash Handling', 'POS Operation', 'React.js'],
        softSkills: ['Problem Solving'],
        requiredCertifications: [],
        vacanciesCount: 3,
        applicationDeadline: '2026-12-31',
      })!;
    });

    assert(submittedJob.status === 'active', 'AppContext.createJobPost publishes verified employer vacancy directly to "active"');
    assert(submittedJob.companyVerified === true, 'createJobPost propagates verified employer status');
    assert(submittedJob.vacanciesCount === 3, 'createJobPost preserves vacanciesCount');
    assert(
      appApi().jobPosts.filter((j) => j.status === 'active').some((j) => j.id === submittedJob.id),
      'Published verified vacancy is immediately visible in active Seeker job feed'
    );
    assert(
      appApi().notifications.some(
        (n) => n.recipientId === adminUser.id && n.recipientRole === 'admin' && n.message.includes(submittedJob.title)
      ),
      'AppContext.createJobPost notifies PESO Admin of newly published verified vacancy'
    );

    // Switch to Admin and verify PESO moderation review notification routing
    await mounted.act(async () => {
      await appApi().loginAs(adminUser.email, 'password123');
    });

    const complianceRemarks = 'Compliant with Region IV-B DOLE minimum wage and municipal hiring guidelines.';
    await mounted.act(async () => {
      appApi().reviewJobVacancy(submittedJob.id, 'active', complianceRemarks);
    });

    const approvedJob = appApi().jobPosts.find((j) => j.id === submittedJob.id)!;
    assert(approvedJob?.status === 'active', 'AppContext.reviewJobVacancy keeps reviewed job "active"');
    assert(approvedJob?.complianceRemarks === undefined && approvedJob?.reviewNotes === complianceRemarks, 'reviewJobVacancy records compliance review notes');

    const approvalNotif = appApi().notifications.find(
      (n) => n.title === 'Job Vacancy Approved & Published!' && n.message.includes(submittedJob.title)
    );
    assert(Boolean(approvalNotif), 'reviewJobVacancy creates employer approval notification');
    assert(
      approvalNotif?.recipientId === puregoldEmployer.userId,
      'Approval notification targets employer userId (not employerProfile.id)'
    );
    assert(
      getFilteredUserNotifications(appApi().notifications, puregoldUser).some((n) => n.id === approvalNotif?.id),
      'Approval notification passes getFilteredUserNotifications for employer user'
    );

    // ---------------------------------------------------------------------------
    // Suite 2: Automated Candidate Matching & Match Alert Notifications (Real AppContext)
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 2] Real AppContext Automated Candidate Matching & Match Alert Notifications');

    const cachedForJob = appApi().candidateMatches.filter((m) => m.jobId === approvedJob.id);
    assert(
      cachedForJob.length === appApi().jobSeekers.length,
      `reviewJobVacancy caches Decision Tree matches for all seekers (${cachedForJob.length}/${appApi().jobSeekers.length})`
    );

    const juanSeeker = TEST_JOB_SEEKERS[0];
    const juanMatch = appApi().getMatch(juanSeeker, approvedJob);
    assert(juanMatch.overallMatch >= 85, `Juan Dela Cruz scores >= 85% via AppContext.getMatch (${juanMatch.overallMatch}%)`);
    assert(
      outcomeToReferralTier(juanMatch.outcome) === 'Highly Qualified',
      'outcomeToReferralTier maps HIGHLY QUALIFIED to Highly Qualified'
    );

    const matchAlertNotifs = appApi().notifications.filter(
      (n) => n.recipientRole === 'job_seeker' && n.title.includes(approvedJob.title)
    );
    assert(matchAlertNotifs.length >= 1, `Generated ${matchAlertNotifs.length} high-match notification(s) (>= 70%)`);
    assert(
      matchAlertNotifs.some((n) => n.recipientId === juanSeeker.userId),
      'High-match alert notification targets matching seeker userId'
    );

    // ---------------------------------------------------------------------------
    // Suite 3: Application Submission, ATS Screening & Duplicate Guard (Real AppContext)
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 3] Real AppContext Job Seeker Application Submission & Duplicate Guard');

    await mounted.act(async () => {
      await appApi().loginAs(juanSeeker.email, 'password123');
    });

    const coverNote = 'Experienced with React.js, SQL databases, and store POS systems in Roxas.';
    let applyRes!: ReturnType<AppApi['applyForJob']>;
    await mounted.act(async () => {
      applyRes = appApi().applyForJob(approvedJob.id, juanSeeker.id, 'resume-juan-01', coverNote);
    });

    assert(applyRes.success === true && Boolean(applyRes.application), 'AppContext.applyForJob succeeds for active vacancy');
    const createdApp = applyRes.application!;
    assert(createdApp.jobId === approvedJob.id, 'Created application references target job');
    assert(createdApp.jobSeekerId === juanSeeker.id, 'Created application references seeker');
    assert(createdApp.employerId === approvedJob.employerId, 'Created application references employer');
    assert(createdApp.coverNote === coverNote, 'Created application preserves coverNote');
    assert((createdApp.atsScore ?? 0) >= 50, `ATS evaluation computes valid score (${createdApp.atsScore}%)`);
    assert(createdApp.statusHistory.length >= 2, 'Status history records submission and ATS screening');
    assert(
      appApi().notifications.some(
        (n) => n.recipientId === puregoldEmployer.userId && n.title === 'New Job Application Received' && n.message.includes(approvedJob.title)
      ),
      'AppContext.applyForJob notifies employer user of new application'
    );

    let duplicateApplyRes!: ReturnType<AppApi['applyForJob']>;
    await mounted.act(async () => {
      duplicateApplyRes = appApi().applyForJob(approvedJob.id, juanSeeker.id, 'resume-juan-01', 'Duplicate attempt');
    });
    assert(duplicateApplyRes.success === false, 'AppContext.applyForJob rejects duplicate applications for the same job');

    // ---------------------------------------------------------------------------
    // Suite 4: Employer Candidate Progression Lifecycle (under_review -> hired)
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 4] Real AppContext Application Progression Lifecycle');

    await mounted.act(async () => {
      await appApi().loginAs(puregoldUser.email, 'password123');
    });

    const reviewNote = 'Applicant credentials verified; shortlisted for interview.';
    await mounted.act(async () => {
      appApi().updateApplicationStatus(createdApp.id, 'under_review', reviewNote);
    });

    const reviewedApp = appApi().applications.find((a) => a.id === createdApp.id)!;
    assert(reviewedApp.currentStatus === 'under_review', 'updateApplicationStatus transitions application to "under_review"');
    assert(reviewedApp.statusHistory.some((h) => h.notes === reviewNote), 'Status history records review notes');
    assert(
      appApi().notifications.some(
        (n) => n.recipientId === juanSeeker.userId && n.title === 'Application Status: UNDER REVIEW'
      ),
      'Seeker receives under_review status notification'
    );

    const hiredNote = 'Selected for employment at Puregold Roxas.';
    await mounted.act(async () => {
      appApi().updateApplicationStatus(createdApp.id, 'hired', hiredNote);
    });

    const hiredApp = appApi().applications.find((a) => a.id === createdApp.id)!;
    const hiredSeeker = appApi().jobSeekers.find((s) => s.id === juanSeeker.id)!;
    assert(hiredApp.currentStatus === 'hired', 'updateApplicationStatus transitions application to "hired"');
    assert(hiredSeeker.employmentStatus === 'hired', 'Hiring updates seeker employmentStatus to "hired"');
    assert(hiredSeeker.currentEmployer === approvedJob.companyName, 'Hiring records currentEmployer on seeker profile');
    assert(hiredSeeker.hiredPosition === approvedJob.title, 'Hiring records hiredPosition on seeker profile');
    assert(Boolean(hiredSeeker.hiredAt), 'Hiring records hiredAt timestamp');
    assert(
      appApi().notifications.some(
        (n) => n.recipientId === juanSeeker.userId && n.title.includes('Congratulations! You are HIRED')
      ),
      'Seeker receives celebratory hired notification'
    );

    // ---------------------------------------------------------------------------
    // Suite 5: Interview Scheduling, Conflict Prevention & Response Sync
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 5] Real AppContext Interview Scheduling & Response Synchronization');

    let scheduleRes!: ReturnType<AppApi['scheduleInterview']>;
    await mounted.act(async () => {
      scheduleRes = appApi().scheduleInterview({
        applicationId: createdApp.id,
        jobId: approvedJob.id,
        jobTitle: approvedJob.title,
        employerId: puregoldEmployer.id,
        companyName: puregoldEmployer.companyName,
        jobSeekerId: juanSeeker.id,
        applicantName: `${juanSeeker.firstName} ${juanSeeker.lastName}`,
        interviewType: 'face_to_face',
        date: '2026-11-28',
        time: '10:00 AM',
        locationOrLink: 'Puregold Roxas Admin Office, Brgy. Bagumbayan, Roxas, Oriental Mindoro',
        contactPerson: 'Liza Santos',
      });
    });

    assert(scheduleRes.success === true && Boolean(scheduleRes.interview), 'AppContext.scheduleInterview creates scheduled interview');
    const createdInterview = scheduleRes.interview!;
    assert(createdInterview.status === 'scheduled', 'Scheduled interview starts with "scheduled" status');
    assert(
      appApi().applications.find((a) => a.id === createdApp.id)?.currentStatus === 'interview_scheduled',
      'scheduleInterview updates linked application status to "interview_scheduled"'
    );
    assert(
      appApi().notifications.some(
        (n) => n.recipientId === juanSeeker.userId && n.title.includes('Interview Scheduled')
      ),
      'Seeker receives interview invitation notification'
    );

    let conflictRes!: ReturnType<AppApi['scheduleInterview']>;
    await mounted.act(async () => {
      conflictRes = appApi().scheduleInterview({
        applicationId: createdApp.id,
        jobId: approvedJob.id,
        jobTitle: approvedJob.title,
        employerId: 'emp-tech-01',
        companyName: 'Mindoro Tech Innovations',
        jobSeekerId: juanSeeker.id,
        applicantName: `${juanSeeker.firstName} ${juanSeeker.lastName}`,
        interviewType: 'video',
        date: '2026-11-28',
        time: '10:00 AM',
        locationOrLink: 'https://meet.example.com/roxas',
        contactPerson: 'Katrina Gomez',
      });
    });
    assert(conflictRes.success === false && conflictRes.message.includes('Conflict detected'), 'scheduleInterview rejects double-booked seeker time slot');

    await mounted.act(async () => {
      await appApi().loginAs(juanSeeker.email, 'password123');
    });
    await mounted.act(async () => {
      appApi().respondToInterview(createdInterview.id, 'accepted', 'Confirmed availability.');
    });

    const acceptedInterview = appApi().interviews.find((i) => i.id === createdInterview.id)!;
    assert(acceptedInterview.status === 'accepted', 'respondToInterview transitions interview to "accepted"');
    assert(
      appApi().notifications.some(
        (n) => n.recipientId === puregoldEmployer.userId && n.title === 'Interview ACCEPTED'
      ),
      'respondToInterview notifies employer userId of acceptance'
    );

    // ---------------------------------------------------------------------------
    // Suite 6: Employer Fallback Recovery, Demo Reset & Serialization Integrity
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 6] Employer Profile Recovery, Demo Reset & Dual-Persistence Serialization');

    await mounted.act(async () => {
      appApi().registerUser(
        {
          email: 'onboarding.emp@roxas.ph',
          name: 'Lorna Diaz',
          role: 'employer',
          isAccountVerified: false,
        },
        {
          password: 'password123',
          companyName: 'Roxas Trading Post',
          representativeName: 'Lorna Diaz',
        }
      );
    });
    assert(
      appApi().currentEmployerProfile !== null &&
        appApi().currentEmployerProfile?.companyName === 'ROXAS TRADING POST',
      'AppContext provides non-null currentEmployerProfile immediately after employer signup'
    );

    await mounted.act(async () => {
      appApi().updateEmployerProfile({
        companyName: 'Roxas Trading Post Inc.',
        isProfileCompleted: true,
      });
    });
    assert(
      appApi().currentEmployerProfile?.isProfileCompleted === true &&
        appApi().currentEmployerProfile?.companyName === 'ROXAS TRADING POST INC.',
      'updateEmployerProfile persists employer onboarding completion'
    );

    await mounted.act(async () => {
      appApi().addJobSubscription({
        userId: juanSeeker.userId,
        title: 'Reset Check Alert',
        categories: ['Customer Service & Retail'],
        municipalities: ['Roxas'],
        keywords: ['Cashier'],
        employmentTypes: ['Full-time'],
        isActive: true,
        isEmailAlertEnabled: true,
        isToastAlertEnabled: false,
      });
    });

    await mounted.act(async () => {
      await appApi().resetToDemoData();
    });
    assert(appApi().currentUser === null, 'resetToDemoData clears active user session');
    assert(
      appApi().jobSubscriptions.length === INITIAL_JOB_SUBSCRIPTIONS.length &&
        appApi().referralSlips.length === INITIAL_REFERRAL_SLIPS.length &&
        appApi().localRecruitmentActivities.length === INITIAL_LRA_EVENTS.length,
      'resetToDemoData restores clean-slate INITIAL_JOB_SUBSCRIPTIONS, INITIAL_REFERRAL_SLIPS, and INITIAL_LRA_EVENTS'
    );

    // Table mappings and snake_case / camelCase transformers
    assert(Boolean(SUPABASE_TABLES.JOB_POSTS), 'SUPABASE_TABLES maps job_posts');
    assert(Boolean(SUPABASE_TABLES.APPLICATIONS), 'SUPABASE_TABLES maps applications');
    assert(Boolean(SUPABASE_TABLES.CANDIDATE_MATCHES), 'SUPABASE_TABLES maps candidate_matches');
    assert(Boolean(SUPABASE_TABLES.INTERVIEWS), 'SUPABASE_TABLES maps interviews');
    assert(Boolean(SUPABASE_TABLES.NOTIFICATIONS), 'SUPABASE_TABLES maps notifications');
    assert(Boolean(COLLECTIONS.CANDIDATE_MATCHES), 'COLLECTIONS maps candidateMatches');

    const snakeApp = toSnakeCase(createdApp);
    assert(snakeApp.job_id === createdApp.jobId, 'toSnakeCase converts jobId to job_id');
    assert(snakeApp.job_seeker_id === createdApp.jobSeekerId, 'toSnakeCase converts jobSeekerId to job_seeker_id');
    assert(snakeApp.employer_id === createdApp.employerId, 'toSnakeCase converts employerId to employer_id');
    assert(snakeApp.current_status === createdApp.currentStatus, 'toSnakeCase converts currentStatus to current_status');
    assert(snakeApp.match_score === createdApp.matchScore, 'toSnakeCase converts matchScore to match_score');
    assert(Array.isArray(snakeApp.status_history), 'toSnakeCase preserves JSON status_history array');
    assert(
      snakeApp.status_history[0].updated_at === createdApp.statusHistory[0].updatedAt,
      'toSnakeCase recurses into nested status history objects'
    );

    const restoredApp = toCamelCase<Application>(snakeApp);
    assert(restoredApp.jobId === createdApp.jobId, 'toCamelCase restores jobId');
    assert(restoredApp.jobSeekerId === createdApp.jobSeekerId, 'toCamelCase restores jobSeekerId');
    assert(restoredApp.currentStatus === createdApp.currentStatus, 'toCamelCase restores currentStatus');
    assert(Array.isArray(restoredApp.statusHistory), 'toCamelCase restores statusHistory array');
    assert(
      restoredApp.statusHistory[0].updatedAt === createdApp.statusHistory[0].updatedAt,
      'toCamelCase restores nested status history objects'
    );
    assert(toSnakeCase(null) === null, 'toSnakeCase safely handles null');
    assert(toCamelCase(undefined) === undefined, 'toCamelCase safely handles undefined');

    // ---------------------------------------------------------------------------
    // Suite 7: Regression — RLS Policies & Schema Column Alignment
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 7] Regression — RLS Policies & Schema Column Alignment');

    const schemaSql = fs.readFileSync(path.join(rootDir, 'supabase_schema.sql'), 'utf-8');
    const migrationSql = fs.readFileSync(
      path.join(rootDir, 'supabase/migrations/20261109000001_initial_ehanap_schema.sql'),
      'utf-8'
    );

    const schemaTables = extractSqlTableColumns(schemaSql);
    const migrationTables = extractSqlTableColumns(migrationSql);
    const tableNames = Object.keys(schemaTables);

    assert(tableNames.length === 13, `supabase_schema.sql defines all 13 tables (found ${tableNames.length})`);
    assert(
      Object.keys(migrationTables).length === 13,
      `Migration SQL defines all 13 tables (found ${Object.keys(migrationTables).length})`
    );

    let allColumnsAligned = true;
    for (const table of tableNames) {
      const sCols = schemaTables[table] || [];
      const mCols = migrationTables[table] || [];
      if (sCols.some((c) => !mCols.includes(c)) || mCols.some((c) => !sCols.includes(c))) {
        allColumnsAligned = false;
      }
    }
    assert(allColumnsAligned, 'All 13 table columns are aligned between supabase_schema.sql and initial migration');

    assert(
      !schemaTables.users?.includes('password') && !migrationTables.users?.includes('password'),
      'SQL users table intentionally excludes password column (Supabase Auth owns credentials)'
    );

    const jobStatusCheck =
      schemaSql.match(/status TEXT NOT NULL DEFAULT 'pending_approval' CHECK \(status IN \(([^)]+)\)\)/)?.[1] || '';
    assert(
      jobStatusCheck.includes("'archived'") && !jobStatusCheck.includes("'paused'"),
      'SQL job_posts.status CHECK allows archived and rejects paused'
    );

    for (const sqlLabel of [
      { name: 'supabase_schema.sql', text: schemaSql },
      { name: 'migration SQL', text: migrationSql },
    ]) {
      const permissiveAll = /FOR ALL\s+USING\s*\(\s*true\s*\)/i.test(sqlLabel.text);
      const permissiveCheck = /WITH CHECK\s*\(\s*true\s*\)/i.test(sqlLabel.text);
      assert(!permissiveAll && !permissiveCheck, `${sqlLabel.name} contains zero permissive USING(true)/WITH CHECK(true) write policies`);

      const rlsCount = (sqlLabel.text.match(/ENABLE ROW LEVEL SECURITY;/g) || []).length;
      assert(rlsCount === 13, `${sqlLabel.name} enables RLS on all 13 tables (found ${rlsCount})`);

      const policyCount = (sqlLabel.text.match(/CREATE POLICY\s+/g) || []).length;
      assert(policyCount >= 38, `${sqlLabel.name} defines scoped RLS policies across tables (found ${policyCount})`);
    }

    const seedTablePairs: Array<{ table: string; rows: any[]; ignored?: string[] }> = [
      { table: 'users', rows: TEST_USERS, ignored: ['password'] },
      { table: 'employer_profiles', rows: TEST_EMPLOYERS },
      { table: 'seeker_profiles', rows: TEST_JOB_SEEKERS },
      { table: 'job_posts', rows: TEST_JOB_POSTS },
      { table: 'applications', rows: TEST_APPLICATIONS },
      { table: 'interviews', rows: TEST_INTERVIEWS },
      { table: 'notifications', rows: TEST_NOTIFICATIONS },
      { table: 'audit_logs', rows: TEST_AUDIT_LOGS },
      { table: 'system_announcements', rows: TEST_ANNOUNCEMENTS },
      { table: 'job_alert_subscriptions', rows: TEST_JOB_SUBSCRIPTIONS },
      { table: 'peso_referral_slips', rows: TEST_REFERRAL_SLIPS },
      { table: 'lra_events', rows: TEST_LRA_EVENTS },
      {
        table: 'candidate_matches',
        rows: [
          {
            id: 'match-sample',
            jobId: approvedJob.id,
            jobSeekerId: juanSeeker.id,
            overallMatch: juanMatch.overallMatch,
            outcome: juanMatch.outcome,
            educationMatchScore: juanMatch.educationMatchScore,
            degreeAlignmentScore: juanMatch.degreeAlignmentScore,
            skillsMatchScore: juanMatch.skillsMatchScore,
            experienceMatchScore: juanMatch.experienceMatchScore,
            certificationsMatchScore: juanMatch.certificationsMatchScore,
            matchedReasons: juanMatch.matchedReasons,
            missingQualifications: juanMatch.missingQualifications,
            decisionReason: juanMatch.decisionReason,
            calculatedAt: new Date().toISOString(),
          } satisfies CandidateMatch,
        ],
      },
    ];

    const missingColumnPairs: string[] = [];
    for (const pair of seedTablePairs) {
      const validCols = new Set(schemaTables[pair.table] || []);
      const ignored = new Set(pair.ignored || []);
      for (const row of pair.rows) {
        for (const col of Object.keys(toSnakeCase(row))) {
          if (!ignored.has(col) && !validCols.has(col)) {
            missingColumnPairs.push(`${pair.table}.${col}`);
          }
        }
      }
    }
    assert(
      missingColumnPairs.length === 0,
      'All toSnakeCase model keys align with SQL table columns',
      missingColumnPairs.join(', ')
    );
  } finally {
    await mounted.unmount();
  }
}

runMilestone03Tests()
  .then(() => {
    console.log('\n================================================================');
    console.log(`Milestone 03 Verification Summary: ${passedTests}/${totalTests} tests passed`);
    console.log('================================================================');
    if (passedTests === totalTests) {
      console.log('🎉 Milestone 03 End-to-End Data Pipeline & Real AppContext Sync is VERIFIED!\n');
      process.exit(0);
    } else {
      console.error(`❌ Failed ${totalTests - passedTests} tests.\n`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
