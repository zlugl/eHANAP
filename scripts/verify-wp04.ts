import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFilteredUserNotifications } from '../src/utils/notificationUtils';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYERS,
  INITIAL_JOB_POSTS,
  INITIAL_JOB_SUBSCRIPTIONS,
} from '../src/data/mockData';
import { INITIAL_LRA_EVENTS, INITIAL_REFERRAL_SLIPS } from '../src/data/pesoLguData';
import { EmployerProfile, NotificationItem } from '../src/types';

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

console.log('--- eHANAP WP-04: Notifications, Status Constraints, Admin Metrics & Demo Reset ---');

// 1. Finding #8: Employer notification routing
const puregoldEmp = INITIAL_EMPLOYERS[0];
const puregoldUser = INITIAL_USERS.find(u => u.id === puregoldEmp.userId)!;
assert(Boolean(puregoldEmp && puregoldUser), 'Puregold employer and user records exist in seed data');
assert(puregoldEmp.id !== puregoldUser.id, 'Employer profile ID differs from User ID');

const baseNotif: Omit<NotificationItem, 'id' | 'recipientId'> = {
  recipientRole: 'employer',
  title: 'Job Vacancy Approved & Published!',
  message: 'Your vacancy has been approved by PESO-LGU.',
  type: 'success',
  read: false,
  createdAt: new Date().toISOString(),
  link: '/employer/dashboard',
};

const wrongRecipientNotif: NotificationItem = { ...baseNotif, id: 'n-wrong', recipientId: puregoldEmp.id };
const rightRecipientNotif: NotificationItem = { ...baseNotif, id: 'n-right', recipientId: puregoldEmp.userId };

const visible = getFilteredUserNotifications([wrongRecipientNotif, rightRecipientNotif], puregoldUser);
assert(!visible.some(n => n.id === 'n-wrong'), 'Notification sent to employerProfile.id is hidden from employer user');
assert(visible.some(n => n.id === 'n-right'), 'Notification sent to emp.userId is visible to employer user');

const jobsContextSrc = fs.readFileSync(path.join(rootDir, 'src/context/JobsContext.tsx'), 'utf-8');
const reviewBlock = jobsContextSrc.match(/const reviewJobVacancy =[\s\S]*?const notifyAndCacheCandidateMatches/)?.[0] || '';
assert(
  reviewBlock.includes('employers.find(e => e.id === job.employerId)') &&
    reviewBlock.includes('recipientId: emp?.userId || job.employerId'),
  'reviewJobVacancy resolves employer userId for recipientId'
);

// 2. Finding #10: Admin establishmentType & vacanciesCount checks
const externalLegacyEmp: EmployerProfile = {
  ...puregoldEmp,
  id: 'emp-ext-01',
  industry: 'Retail / Supermarket',
  establishmentType: 'new_external',
};
const mixedEmployers = [...INITIAL_EMPLOYERS, externalLegacyEmp];
const establishedCount = mixedEmployers.filter(e => e.establishmentType === 'local_established').length;
assert(establishedCount === INITIAL_EMPLOYERS.length, 'establishmentType === "local_established" excludes new_external regardless of industry');

const activeVacancies = INITIAL_JOB_POSTS.filter(j => j.status === 'active');
const totalOpenings = activeVacancies.reduce((a, b) => a + (b.vacanciesCount || 1), 0);
assert(totalOpenings > activeVacancies.length, `vacanciesCount sums multi-slot openings (${totalOpenings} > ${activeVacancies.length})`);

const adminDashboardSrc = fs.readFileSync(path.join(rootDir, 'src/views/admin/AdminDashboard.tsx'), 'utf-8');
const adminUsersSrc = fs.readFileSync(path.join(rootDir, 'src/views/admin/AdminUsersPage.tsx'), 'utf-8');
assert(!adminDashboardSrc.includes('isEstablishedLocal') && !adminDashboardSrc.includes('openingsCount'), 'AdminDashboard removed isEstablishedLocal and openingsCount');
assert(adminDashboardSrc.includes("establishmentType === 'local_established'") && adminDashboardSrc.includes('b.vacanciesCount || 1'), 'AdminDashboard uses establishmentType and vacanciesCount');
assert(!adminUsersSrc.includes('isEstablishedLocal'), 'AdminUsersPage removed isEstablishedLocal');
assert(adminUsersSrc.includes("establishmentType === 'local_established'"), 'AdminUsersPage uses establishmentType');

// 3. Finding #14: EmployerJobsPage status constraint & removed job.department
const schemaSrc = fs.readFileSync(path.join(rootDir, 'supabase_schema.sql'), 'utf-8');
const statusCheck = schemaSrc.match(/status TEXT NOT NULL DEFAULT 'pending_approval' CHECK \(status IN \(([^)]+)\)\)/)?.[1] || '';
assert(!statusCheck.includes("'paused'") && statusCheck.includes("'archived'"), 'SQL job_posts.status CHECK excludes paused and allows archived');

const employerJobsSrc = fs.readFileSync(path.join(rootDir, 'src/views/employer/EmployerJobsPage.tsx'), 'utf-8');
assert(!employerJobsSrc.includes("'paused'") && !employerJobsSrc.includes('"paused"'), 'EmployerJobsPage contains no paused status references');
assert(employerJobsSrc.includes("'archived'") || employerJobsSrc.includes('"archived"'), 'EmployerJobsPage supports archived status');
assert(!employerJobsSrc.includes('department'), 'EmployerJobsPage contains no job.department references');

// 4. Finding #18: resetToDemoData restores INITIAL_* constants
assert(INITIAL_LRA_EVENTS.length >= 2, 'INITIAL_LRA_EVENTS seed constant is non-empty');
assert(INITIAL_REFERRAL_SLIPS.length >= 2, 'INITIAL_REFERRAL_SLIPS seed constant is non-empty');
assert(Array.isArray(INITIAL_JOB_SUBSCRIPTIONS), 'INITIAL_JOB_SUBSCRIPTIONS constant is exported');

const appContextSrc = fs.readFileSync(path.join(rootDir, 'src/context/AppContext.tsx'), 'utf-8');
const pesoLraContextSrc = fs.readFileSync(path.join(rootDir, 'src/context/PesoLraContext.tsx'), 'utf-8');
const resetBlock = appContextSrc.match(/const resetToDemoData = async \(\) => \{[\s\S]*?showToast\(/)?.[0] || '';
assert(
  jobsContextSrc.includes('setJobSubscriptions(INITIAL_JOB_SUBSCRIPTIONS)') &&
    pesoLraContextSrc.includes('setReferralSlips(INITIAL_REFERRAL_SLIPS)') &&
    pesoLraContextSrc.includes('setLocalRecruitmentActivities(INITIAL_LRA_EVENTS)') &&
    resetBlock.includes('jobs.resetJobsState()') &&
    resetBlock.includes('pesoLra.resetPesoLraState()'),
  'resetToDemoData restores INITIAL_JOB_SUBSCRIPTIONS, INITIAL_REFERRAL_SLIPS, and INITIAL_LRA_EVENTS'
);

console.log(`\n--- WP-04 Verification Summary: ${passed}/${total} tests passed ---`);
