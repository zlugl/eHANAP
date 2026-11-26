import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppProvider, useApp, useAuth, useDirectory, useJobs, useNotification } from '../src/context';
import { sanitizeForTable, SUPABASE_TABLES, toSnakeCase } from '../src/services/supabaseService';
import { EmployerProfile, JobSeekerProfile, User } from '../src/types';
import { mountWithProvider } from './testContextHarness';

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

function useCombined() {
  return {
    app: useApp(),
    auth: useAuth(),
    dir: useDirectory(),
    jobs: useJobs(),
    notif: useNotification(),
  };
}

async function run() {
  console.log('--- eHANAP WP-08: Supabase Schema, RLS & Payload Alignment ---');

  const schemaSql = fs.readFileSync(path.join(rootDir, 'supabase_schema.sql'), 'utf-8');
  const migrationSql = fs.readFileSync(
    path.join(rootDir, 'supabase/migrations/20261109000001_initial_ehanap_schema.sql'),
    'utf-8'
  );

  // 1. SQL schema & migration parity + CHECK / RLS assertions
  const schemaTables = extractSqlTableColumns(schemaSql);
  const migrationTables = extractSqlTableColumns(migrationSql);

  assert(
    JSON.stringify(schemaTables) === JSON.stringify(migrationTables),
    'supabase_schema.sql and initial migration have identical table columns'
  );

  const empCols = new Set(schemaTables.employer_profiles || []);
  const jobCols = new Set(schemaTables.job_posts || []);
  const intCols = new Set(schemaTables.interviews || []);

  assert(empCols.has('documents'), 'employer_profiles SQL includes documents JSONB column');
  assert(
    schemaSql.includes("'incomplete', 'pending_verification', 'pending', 'verified', 'for_compliance', 'rejected', 'suspended'") &&
      migrationSql.includes("'incomplete', 'pending_verification', 'pending', 'verified', 'for_compliance', 'rejected', 'suspended'"),
    'employer_profiles.status CHECK accepts incomplete and pending_verification in both SQL files'
  );
  assert(
    schemaSql.includes("AND status IN ('incomplete', 'pending_verification', 'pending')") &&
      schemaSql.includes("COALESCE(public.get_employer_status(id), 'incomplete') IN ('incomplete', 'pending_verification', 'pending', 'for_compliance')"),
    'employer_profiles RLS permits incomplete/pending_verification transitions without self-verification'
  );

  assert(
    schemaSql.includes("status = 'active'") &&
      schemaSql.includes("public.get_employer_status(employer_id) = 'verified'") &&
      migrationSql.includes("status = 'active'") &&
      migrationSql.includes("public.get_employer_status(employer_id) = 'verified'"),
    'job_posts INSERT RLS allows verified employers to publish active vacancies directly'
  );
  assert(
    jobCols.has('sub_category') &&
      jobCols.has('work_setup') &&
      jobCols.has('min_salary') &&
      jobCols.has('accepted_education_levels') &&
      jobCols.has('evaluated_skills') &&
      jobCols.has('match_weights') &&
      jobCols.has('benefits'),
    'job_posts SQL includes CreateJobModal feature columns'
  );
  assert(
    schemaSql.includes("'Contractual / Project-Based'") &&
      schemaSql.includes("'Internship / OJT'") &&
      schemaSql.includes("'Freelance'"),
    'job_posts.employment_type CHECK includes all CreateJobModal employment types'
  );
  assert(
    intCols.has('reminders_sent') &&
      schemaSql.includes("'scheduled', 'rescheduled', 'accepted', 'reschedule_requested', 'declined', 'completed', 'cancelled'"),
    'interviews SQL includes reminders_sent column and rescheduled status'
  );
  assert(
    !/FOR ALL\s+USING\s*\(\s*true\s*\)/i.test(schemaSql) && !/WITH CHECK\s*\(\s*true\s*\)/i.test(schemaSql),
    'supabase_schema.sql contains zero permissive USING(true)/WITH CHECK(true) write policies'
  );

  // 2. sanitizeForTable + toSnakeCase alignment
  const empPayload = sanitizeForTable(SUPABASE_TABLES.EMPLOYERS, {
    id: 'emp-1',
    userId: 'user-1',
    companyName: 'ROXAS STORE',
    representativeName: 'ANA CRUZ',
    contactNumber: '09171234567',
    email: 'hr@roxas.ph',
    address: 'POBLACION',
    municipality: 'Roxas',
    industry: 'Retail',
    bir2303No: '123-456-789',
    bir2303File: 'bir.pdf',
    status: 'pending_verification',
    documents: [{ id: 'd1', fileName: 'permit.pdf', fileSize: '10 KB', mimeType: 'application/pdf', fileUrl: 'data:', uploadedAt: '2026-11-26' }],
    extraFrontendOnlyFlag: true,
  } as any);
  const empSnake = toSnakeCase<Record<string, any>>(empPayload);
  assert(empSnake.bir_2303_no === '123-456-789' && empSnake.bir_2303_file === 'bir.pdf', 'toSnakeCase maps bir2303No/bir2303File to bir_2303_no/bir_2303_file');
  assert(!('extra_frontend_only_flag' in empSnake), 'sanitizeForTable strips unknown keys on employer_profiles');
  assert(Array.isArray(empSnake.documents) && empSnake.documents.length === 1, 'sanitizeForTable preserves employer documents');
  assert(Object.keys(empSnake).every((col) => empCols.has(col)), 'All sanitized employer_profiles keys match SQL columns');

  const invalidEmpStatus = sanitizeForTable(SUPABASE_TABLES.EMPLOYERS, { id: 'emp-2', status: 'bogus_status' } as any);
  assert(invalidEmpStatus.status === 'pending', 'sanitizeForTable normalizes invalid employer status to pending');

  const jobPayload = sanitizeForTable(SUPABASE_TABLES.JOB_POSTS, {
    id: 'job-1',
    employerId: 'emp-1',
    companyName: 'ROXAS STORE',
    companyMunicipality: 'Roxas',
    companyVerified: true,
    title: 'Cashier',
    category: 'Retail',
    department: 'Store Operations',
    description: 'Handle POS',
    employmentType: 'Contractual / Project-Based',
    workSetup: 'On-site',
    workLocation: 'Roxas',
    municipality: 'Roxas',
    vacancies: 2,
    positionsAvailable: 2,
    deadline: '2026-12-31',
    payFrequency: 'Monthly',
    salaryNegotiable: true,
    experienceLevel: 'Entry-Level',
    skillsRequired: ['POS Operation'],
    postedDate: '2026-11-26',
    status: 'paused',
    minEducationalAttainment: 'High School',
    preferredDegree: 'Any',
    matchWeights: { education: 25, skills: 40, experience: 20, eligibility: 15 },
    unmappedUiField: 'drop-me',
  } as any);
  const jobSnake = toSnakeCase<Record<string, any>>(jobPayload);
  assert(jobSnake.sub_category === 'Store Operations' && jobSnake.vacancies_count === 2 && jobSnake.application_deadline === '2026-12-31', 'sanitizeForTable maps job_posts UI aliases to canonical columns');
  assert(jobSnake.status === 'archived', 'sanitizeForTable normalizes legacy paused job status to archived');
  assert(!('department' in jobSnake) && !('vacancies' in jobSnake) && !('deadline' in jobSnake) && !('unmapped_ui_field' in jobSnake), 'sanitizeForTable strips duplicate aliases and unknown keys on job_posts');
  assert(Object.keys(jobSnake).every((col) => jobCols.has(col)), 'All sanitized job_posts keys match SQL columns');

  const interviewPayload = sanitizeForTable(SUPABASE_TABLES.INTERVIEWS, {
    id: 'int-1',
    applicationId: 'app-1',
    vacancyId: 'job-1',
    jobTitle: 'Cashier',
    employerId: 'emp-1',
    companyName: 'ROXAS STORE',
    seekerId: 'seeker-1',
    applicantName: 'JUAN DELA CRUZ',
    format: 'video',
    date: '2026-12-01',
    time: '09:00',
    locationOrLink: 'https://meet.google.com/abc',
    notes: 'Bring ID',
    contactPerson: 'ANA CRUZ',
    status: 'rescheduled',
    remindersSent: { h24: true },
    strayKey: 123,
  } as any);
  const intSnake = toSnakeCase<Record<string, any>>(interviewPayload);
  assert(intSnake.job_id === 'job-1' && intSnake.job_seeker_id === 'seeker-1' && intSnake.interview_type === 'video' && intSnake.instructions === 'Bring ID', 'sanitizeForTable maps interview aliases to canonical columns');
  assert(!('vacancy_id' in intSnake) && !('seeker_id' in intSnake) && !('format' in intSnake) && !('notes' in intSnake) && !('stray_key' in intSnake), 'sanitizeForTable strips interview aliases and unknown keys');
  assert(Object.keys(intSnake).every((col) => intCols.has(col)), 'All sanitized interviews keys match SQL columns');

  // 3. Runtime context verification (clean-slate explicit fixtures)
  const mounted = await mountWithProvider(AppProvider, useCombined);
  try {
    const adminUser: User = {
      id: 'user-admin-wp08',
      email: 'peso.admin@roxas.gov.ph',
      role: 'admin',
      name: 'PESO Admin',
      isAccountVerified: true,
      isProfileCompleted: true,
      createdAt: '2026-11-26T00:00:00.000Z',
    };
    const empUser: User = {
      id: 'user-emp-wp08',
      email: 'hr@roxasstore.ph',
      role: 'employer',
      name: 'ROXAS STORE',
      isAccountVerified: true,
      isProfileCompleted: true,
      createdAt: '2026-11-26T00:00:00.000Z',
    };
    const seekerUser: User = {
      id: 'user-seeker-wp08',
      email: 'juan@gmail.com',
      role: 'job_seeker',
      name: 'JUAN DELA CRUZ',
      isAccountVerified: true,
      isProfileCompleted: true,
      createdAt: '2026-11-26T00:00:00.000Z',
    };
    const empProfile: EmployerProfile = {
      id: 'emp-wp08',
      userId: empUser.id,
      companyName: 'ROXAS STORE',
      representativeName: 'ANA CRUZ',
      contactNumber: '09171234567',
      email: empUser.email,
      address: 'POBLACION, ROXAS',
      municipality: 'Roxas',
      industry: 'Retail',
      companyDescription: 'Local store',
      status: 'verified',
      isProfileCompleted: true,
      documents: [
        {
          id: 'doc-1',
          requirementId: 'mayors_permit',
          fileName: 'mayors_permit.pdf',
          fileSize: '12 KB',
          mimeType: 'application/pdf',
          fileUrl: 'data:application/pdf;base64,AA==',
          uploadedAt: '2026-11-26T00:00:00.000Z',
        },
      ],
      createdAt: '2026-11-26T00:00:00.000Z',
    };
    const seekerProfile: JobSeekerProfile = {
      id: 'seeker-wp08',
      userId: seekerUser.id,
      firstName: 'JUAN',
      lastName: 'DELA CRUZ',
      dateOfBirth: '2000-01-01',
      email: seekerUser.email,
      contactNumber: '09170000001',
      address: 'BAGUMBAYAN, ROXAS',
      municipality: 'Roxas',
      professionalSummary: 'Cashier',
      educationalAttainment: "Bachelor's Degree",
      primaryDegree: 'BS Business Administration',
      technicalSkills: ['POS Operation', 'Cash Handling'],
      softSkills: ['Customer Service'],
      education: [],
      workExperience: [],
      certifications: [],
      resumes: [],
      isProfileCompleted: true,
      updatedAt: '2026-11-26T00:00:00.000Z',
    };

    const pendingEmpProfile: EmployerProfile = {
      ...empProfile,
      id: 'emp-wp08-unverified',
      userId: 'user-emp-wp08-unverified',
      status: 'pending',
    };

    await mounted.act(async () => {
      mounted.getApi().auth.setUsers([adminUser, empUser, seekerUser]);
      mounted.getApi().dir.setEmployers([pendingEmpProfile]);
      mounted.getApi().dir.setJobSeekers([seekerProfile]);
      mounted.getApi().auth.setCurrentUser({
        ...empUser,
        id: pendingEmpProfile.userId,
      });
    });

    let blockedJob: any = null;
    await mounted.act(async () => {
      blockedJob = mounted.getApi().jobs.createJobPost({
        employerId: pendingEmpProfile.id,
        companyName: pendingEmpProfile.companyName,
        companyMunicipality: 'Roxas',
        title: 'Blocked Unverified Job',
        category: 'Retail, E-Commerce & Consumer Goods',
        description: 'Should be blocked until PESO verifies employer',
        responsibilities: ['None'],
        employmentType: 'Full-time',
        workLocation: 'Roxas, Oriental Mindoro',
        municipality: 'Roxas',
        vacanciesCount: 1,
        applicationDeadline: '2026-12-31',
        minEducationalAttainment: "Bachelor's Degree",
        preferredDegree: 'BS Business Administration',
        requiredSkills: ['POS Operation'],
        preferredSkills: [],
        minExperienceYears: 0,
      });
    });
    assert(blockedJob === null, 'Unverified employer is blocked from creating job posts');

    await mounted.act(async () => {
      mounted.getApi().dir.setEmployers([empProfile]);
      mounted.getApi().auth.setCurrentUser(empUser);
    });

    let createdJob: any = null;
    await mounted.act(async () => {
      createdJob = mounted.getApi().jobs.createJobPost({
        employerId: empProfile.id,
        companyName: empProfile.companyName,
        companyMunicipality: 'Roxas',
        title: 'Store Cashier',
        category: 'Retail, E-Commerce & Consumer Goods',
        subCategory: 'Store Operations & Cashiering',
        description: 'Handle checkout and inventory',
        responsibilities: ['Operate POS'],
        employmentType: 'Contractual / Project-Based',
        workSetup: 'On-site',
        workLocation: 'Roxas, Oriental Mindoro',
        municipality: 'Roxas',
        vacanciesCount: 2,
        applicationDeadline: '2026-12-31',
        minEducationalAttainment: "Bachelor's Degree",
        preferredDegree: 'BS Business Administration',
        requiredSkills: ['POS Operation'],
        preferredSkills: ['Customer Service'],
        minExperienceYears: 0,
        openToFreshGraduates: true,
      });
    });

    assert(Boolean(createdJob) && createdJob.status === 'active', 'Verified employer createJobPost publishes straight to active');
    assert(
      mounted.getApi().notif.notifications.some(
        (n) => n.recipientId === adminUser.id && n.recipientRole === 'admin' && n.message.includes('Store Cashier')
      ),
      'createJobPost notifies PESO Admin of newly published verified vacancy'
    );
    assert(
      mounted.getApi().notif.notifications.some((n) => n.recipientId === seekerUser.id),
      'Verified active vacancy immediately notifies matching seekers'
    );
    assert(
      mounted.getApi().jobs.candidateMatches.some((m) => m.jobId === createdJob.id && m.jobSeekerId === seekerProfile.id),
      'Verified active vacancy immediately triggers candidateMatches evaluation'
    );

    await mounted.act(async () => {
      mounted.getApi().jobs.updateJobVacancyStatus(createdJob.id, 'closed');
    });
    assert(
      mounted.getApi().jobs.jobPosts.find((j) => j.id === createdJob.id)?.status === 'closed',
      'Employer can close their own active vacancy'
    );

    await mounted.act(async () => {
      mounted.getApi().auth.setCurrentUser(adminUser);
    });
    await mounted.act(async () => {
      mounted.getApi().jobs.reviewJobVacancy(createdJob.id, 'for_compliance', 'Update wage info');
    });
    await mounted.act(async () => {
      mounted.getApi().auth.setCurrentUser(empUser);
    });
    await mounted.act(async () => {
      mounted.getApi().jobs.updateJobVacancyStatus(createdJob.id, 'active');
    });
    assert(
      mounted.getApi().jobs.jobPosts.find((j) => j.id === createdJob.id)?.status === 'for_compliance',
      'Employer cannot self-approve a for_compliance job via updateJobVacancyStatus'
    );

    await mounted.act(async () => {
      mounted.getApi().auth.setCurrentUser(adminUser);
    });
    await mounted.act(async () => {
      mounted.getApi().jobs.reviewJobVacancy(createdJob.id, 'active', 'Approved by PESO');
    });
    assert(
      mounted.getApi().jobs.jobPosts.find((j) => j.id === createdJob.id)?.status === 'active',
      'PESO Admin reviewJobVacancy republishes moderated job to active'
    );

    await mounted.act(async () => {
      mounted.getApi().auth.setCurrentUser(empUser);
    });
    let schedRes: any;
    await mounted.act(async () => {
      schedRes = mounted.getApi().jobs.scheduleInterview({
        applicationId: 'app-wp08',
        jobId: createdJob.id,
        jobTitle: createdJob.title,
        employerId: empProfile.id,
        companyName: empProfile.companyName,
        jobSeekerId: seekerProfile.id,
        applicantName: 'JUAN DELA CRUZ',
        interviewType: 'video',
        date: '2026-12-05',
        time: '10:00',
        locationOrLink: 'https://meet.google.com/roxas',
        instructions: 'Prepare ID',
        contactPerson: 'ANA CRUZ',
      });
    });
    assert(
      schedRes.success === true &&
        !('vacancyId' in schedRes.interview) &&
        !('seekerId' in schedRes.interview) &&
        !('format' in schedRes.interview) &&
        !('notes' in schedRes.interview),
      'scheduleInterview produces canonical interview fields without UI alias keys'
    );

    await mounted.act(async () => {
      mounted.getApi().jobs.rescheduleInterview(schedRes.interview.id, {
        date: '2026-12-06',
        time: '14:00',
        instructions: 'Updated slot',
      });
    });
    const resched = mounted.getApi().jobs.interviews.find((i) => i.id === schedRes.interview.id)!;
    assert(
      resched.status === 'rescheduled' &&
        !('format' in resched) &&
        !('notes' in resched) &&
        Boolean(resched.rescheduleNotes),
      'rescheduleInterview sets status rescheduled and rescheduleNotes without alias keys'
    );
  } finally {
    await mounted.unmount();
  }

  console.log(`\n--- WP-08 Verification Summary: ${passed}/${total} tests passed ---`);
}

run();
