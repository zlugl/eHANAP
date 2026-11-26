<<<<<<< HEAD
import {
  User,
  EmployerProfile,
  JobSeekerProfile,
  JobPost,
  Application,
  Interview,
  NotificationItem,
  AuditLog,
  SystemAnnouncement,
  PesoReferralSlip,
  LocalRecruitmentActivity,
  CandidateMatch,
  CandidateInvitation,
} from '../types';
=======
import { User, JobSeekerProfile, EmployerProfile, CandidateInvitation } from '../types';
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502

/**
 * eHANAP Centralized Storage Keys
 */
export const STORAGE_KEYS = {
  CLEAN_SLATE_VERSION: 'ehanap_clean_slate_v2',
  BOOKMARKS: 'ehanap_bookmarks',
  LEGACY_BOOKMARKS: 'seeker_bookmarked_jobs',
  USERS: 'ehanap_users',
  EMPLOYERS: 'ehanap_employers',
  JOB_SEEKERS: 'ehanap_job_seekers',
  JOB_POSTS: 'ehanap_job_posts',
  APPLICATIONS: 'ehanap_applications',
  INTERVIEWS: 'ehanap_interviews',
  NOTIFICATIONS: 'ehanap_notifications',
  AUDIT_LOGS: 'ehanap_audit_logs',
  ANNOUNCEMENTS: 'ehanap_announcements',
  REFERRAL_SLIPS: 'ehanap_referral_slips',
  LRA_EVENTS: 'ehanap_lra_events',
  CANDIDATE_MATCHES: 'ehanap_candidate_matches',
  INVITATIONS: 'ehanap_invitations',
  PROFILE_COMPLETED_PREFIX: 'ehanap_profile_completed_',
  EMPLOYER_COMPLETED_PREFIX: 'ehanap_employer_completed_',
} as const;

const LEGACY_DEMO_IDS = new Set([
  'user-peso-admin-01',
  'user-emp-puregold-01',
  'user-emp-tech-01',
  'user-emp-agri-01',
  'user-emp-sales-01',
  'user-seeker-juan-01',
  'user-seeker-poqiq-75',
  'user-seeker-poqiq-01',
  'user-seeker-maria-02',
  'user-seeker-mark-03',
  'emp-puregold-01',
  'emp-tech-01',
  'emp-agri-01',
  'emp-sales-01',
  'seeker-juan-01',
  'seeker-poqiq-75',
  'seeker-poqiq-01',
  'seeker-maria-02',
  'seeker-mark-03',
  'job-puregold-cashier',
  'job-puregold-bagger',
  'job-tech-dev-01',
  'job-agri-supervisor',
  'job-sales-lady',
]);

// In-memory fallback map for non-browser / headless test / SSR environments
const memoryStore = new Map<string, string>();

export function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

/**
 * Ensures any legacy pre-populated demo data in browser localStorage is cleared once
 * when upgrading to the clean-slate production workflow.
 */
export function ensureCleanSlateInitialized(): void {
  try {
    if (!isStorageAvailable()) return;
    const version = window.localStorage.getItem(STORAGE_KEYS.CLEAN_SLATE_VERSION);
    if (version !== 'true') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('ehanap_') || k === STORAGE_KEYS.LEGACY_BOOKMARKS)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      window.localStorage.setItem(STORAGE_KEYS.CLEAN_SLATE_VERSION, 'true');
    }
  } catch {
    // ignore storage access errors
  }
}

// Execute clean-slate migration immediately on module load
ensureCleanSlateInitialized();

function normalizeKeyIdentifier(idOrEmail: string): string {
  return (idOrEmail || '').trim().toLowerCase();
}

export function isLegacyDemoRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  if (item.id && LEGACY_DEMO_IDS.has(item.id)) return true;
  if (item.userId && LEGACY_DEMO_IDS.has(item.userId)) return true;
  if (item.employerId && LEGACY_DEMO_IDS.has(item.employerId)) return true;
  if (item.jobSeekerId && LEGACY_DEMO_IDS.has(item.jobSeekerId)) return true;
  if (item.jobId && LEGACY_DEMO_IDS.has(item.jobId)) return true;
  return false;
}

export function filterOutLegacyDemoRecords<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isLegacyDemoRecord(item));
}

export function getItem<T>(key: string, fallback: T): T {
  try {
    if (isStorageAvailable()) {
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } else {
      const item = memoryStore.get(key);
      if (item === undefined) return fallback;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    }
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (isStorageAvailable()) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (e) {
    console.warn(`[storageAdapter] Failed to set item for key: ${key}`, e);
  }
}

export function removeItem(key: string): void {
  try {
    if (isStorageAvailable()) {
      window.localStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
  } catch (e) {
    console.warn(`[storageAdapter] Failed to remove item for key: ${key}`, e);
  }
}

// --------------------------------------------------------------------------
// Bookmark Domain Operations & Legacy Migration
// --------------------------------------------------------------------------

export function getBookmarks(fallback: string[] = []): string[] {
  try {
    let bookmarks = getItem<string[]>(STORAGE_KEYS.BOOKMARKS, fallback);
    if (!Array.isArray(bookmarks)) bookmarks = fallback;

    const legacyRaw = getItem<string[] | null>(STORAGE_KEYS.LEGACY_BOOKMARKS, null);
    if (legacyRaw && Array.isArray(legacyRaw) && legacyRaw.length > 0) {
      const combined = Array.from(new Set([...bookmarks, ...legacyRaw])).filter(
        (id) => !LEGACY_DEMO_IDS.has(id)
      );
      setItem(STORAGE_KEYS.BOOKMARKS, combined);
      removeItem(STORAGE_KEYS.LEGACY_BOOKMARKS);
      return combined;
    }

    return bookmarks.filter((id) => !LEGACY_DEMO_IDS.has(id));
  } catch {
    return fallback;
  }
}

export function setBookmarks(jobIds: string[]): void {
  setItem(STORAGE_KEYS.BOOKMARKS, Array.from(new Set(jobIds)));
}

// --------------------------------------------------------------------------
// Profile Completion Invariants (Job Seeker)
// --------------------------------------------------------------------------

export function isProfileCompletedInStorage(idOrEmail: string): boolean {
  if (!idOrEmail) return false;
  const clean = normalizeKeyIdentifier(idOrEmail);
  const key = `${STORAGE_KEYS.PROFILE_COMPLETED_PREFIX}${clean}`;
  const val = getItem<string | boolean | null>(key, null);
  return val === 'true' || val === true;
}

export function setProfileCompletedInStorage(idOrEmail: string, completed = true): void {
  if (!idOrEmail) return;
  const clean = normalizeKeyIdentifier(idOrEmail);
  const key = `${STORAGE_KEYS.PROFILE_COMPLETED_PREFIX}${clean}`;
  if (completed) {
    setItem(key, 'true');
  } else {
    removeItem(key);
  }
}

export function removeProfileCompletedFromStorage(idOrEmail: string): void {
  if (!idOrEmail) return;
  const clean = normalizeKeyIdentifier(idOrEmail);
  const key = `${STORAGE_KEYS.PROFILE_COMPLETED_PREFIX}${clean}`;
  removeItem(key);
}

// --------------------------------------------------------------------------
// Employer Completion Invariants
// --------------------------------------------------------------------------

export function isEmployerCompletedInStorage(idOrEmail: string): boolean {
  if (!idOrEmail) return false;
  const clean = normalizeKeyIdentifier(idOrEmail);
  const key = `${STORAGE_KEYS.EMPLOYER_COMPLETED_PREFIX}${clean}`;
  const val = getItem<string | boolean | null>(key, null);
  return val === 'true' || val === true;
}

export function setEmployerCompletedInStorage(idOrEmail: string, completed = true): void {
  if (!idOrEmail) return;
  const clean = normalizeKeyIdentifier(idOrEmail);
  const key = `${STORAGE_KEYS.EMPLOYER_COMPLETED_PREFIX}${clean}`;
  if (completed) {
    setItem(key, 'true');
  } else {
    removeItem(key);
  }
}

export function removeEmployerCompletedFromStorage(idOrEmail: string): void {
  if (!idOrEmail) return;
  const clean = normalizeKeyIdentifier(idOrEmail);
  const key = `${STORAGE_KEYS.EMPLOYER_COMPLETED_PREFIX}${clean}`;
  removeItem(key);
}

// --------------------------------------------------------------------------
// Entity Collections Storage
// --------------------------------------------------------------------------

export function getStoredUsers(fallback: User[] = []): User[] {
  const data = getItem<User[]>(STORAGE_KEYS.USERS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, filterOutLegacyDemoRecords(users));
}

export function getStoredEmployers(fallback: EmployerProfile[] = []): EmployerProfile[] {
  const data = getItem<EmployerProfile[]>(STORAGE_KEYS.EMPLOYERS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredEmployers(employers: EmployerProfile[]): void {
  setItem(STORAGE_KEYS.EMPLOYERS, filterOutLegacyDemoRecords(employers));
}

export function getStoredJobSeekers(fallback: JobSeekerProfile[] = []): JobSeekerProfile[] {
  const data = getItem<JobSeekerProfile[]>(STORAGE_KEYS.JOB_SEEKERS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredJobSeekers(seekers: JobSeekerProfile[]): void {
  setItem(STORAGE_KEYS.JOB_SEEKERS, filterOutLegacyDemoRecords(seekers));
}

export function getStoredJobPosts(fallback: JobPost[] = []): JobPost[] {
  const data = getItem<JobPost[]>(STORAGE_KEYS.JOB_POSTS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredJobPosts(jobs: JobPost[]): void {
  setItem(STORAGE_KEYS.JOB_POSTS, filterOutLegacyDemoRecords(jobs));
}

export function getStoredApplications(fallback: Application[] = []): Application[] {
  const data = getItem<Application[]>(STORAGE_KEYS.APPLICATIONS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredApplications(apps: Application[]): void {
  setItem(STORAGE_KEYS.APPLICATIONS, filterOutLegacyDemoRecords(apps));
}

export function getStoredInterviews(fallback: Interview[] = []): Interview[] {
  const data = getItem<Interview[]>(STORAGE_KEYS.INTERVIEWS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredInterviews(interviews: Interview[]): void {
  setItem(STORAGE_KEYS.INTERVIEWS, filterOutLegacyDemoRecords(interviews));
}

export function getStoredNotifications(fallback: NotificationItem[] = []): NotificationItem[] {
  const data = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredNotifications(notifs: NotificationItem[]): void {
  setItem(STORAGE_KEYS.NOTIFICATIONS, filterOutLegacyDemoRecords(notifs));
}

export function getStoredAuditLogs(fallback: AuditLog[] = []): AuditLog[] {
  const data = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredAuditLogs(logs: AuditLog[]): void {
  setItem(STORAGE_KEYS.AUDIT_LOGS, filterOutLegacyDemoRecords(logs));
}

export function getStoredAnnouncements(fallback: SystemAnnouncement[] = []): SystemAnnouncement[] {
  const data = getItem<SystemAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredAnnouncements(items: SystemAnnouncement[]): void {
  setItem(STORAGE_KEYS.ANNOUNCEMENTS, filterOutLegacyDemoRecords(items));
}

export function getStoredReferralSlips(fallback: PesoReferralSlip[] = []): PesoReferralSlip[] {
  const data = getItem<PesoReferralSlip[]>(STORAGE_KEYS.REFERRAL_SLIPS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredReferralSlips(slips: PesoReferralSlip[]): void {
  setItem(STORAGE_KEYS.REFERRAL_SLIPS, filterOutLegacyDemoRecords(slips));
}

export function getStoredLraEvents(fallback: LocalRecruitmentActivity[] = []): LocalRecruitmentActivity[] {
  const data = getItem<LocalRecruitmentActivity[]>(STORAGE_KEYS.LRA_EVENTS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredLraEvents(events: LocalRecruitmentActivity[]): void {
  setItem(STORAGE_KEYS.LRA_EVENTS, filterOutLegacyDemoRecords(events));
}

export function getStoredCandidateMatches(fallback: CandidateMatch[] = []): CandidateMatch[] {
  const data = getItem<CandidateMatch[]>(STORAGE_KEYS.CANDIDATE_MATCHES, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredCandidateMatches(matches: CandidateMatch[]): void {
  setItem(STORAGE_KEYS.CANDIDATE_MATCHES, filterOutLegacyDemoRecords(matches));
}

export function getStoredEmployers(fallback: EmployerProfile[] = []): EmployerProfile[] {
  const data = getItem<EmployerProfile[]>(STORAGE_KEYS.EMPLOYERS, fallback);
  return Array.isArray(data) ? data : fallback;
}

export function setStoredEmployers(employers: EmployerProfile[]): void {
  setItem(STORAGE_KEYS.EMPLOYERS, employers);
}

export function getStoredInvitations(fallback: CandidateInvitation[] = []): CandidateInvitation[] {
  const data = getItem<CandidateInvitation[]>(STORAGE_KEYS.INVITATIONS, fallback);
  return Array.isArray(data) ? filterOutLegacyDemoRecords(data) : fallback;
}

export function setStoredInvitations(invitations: CandidateInvitation[]): void {
  setItem(STORAGE_KEYS.INVITATIONS, filterOutLegacyDemoRecords(invitations));
}

export function clearAllStoredData(): void {
  try {
    if (isStorageAvailable()) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('ehanap_') && k !== STORAGE_KEYS.CLEAN_SLATE_VERSION) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
    memoryStore.clear();
  } catch {
    // ignore
  }
}

export const storageAdapter = {
  isAvailable: isStorageAvailable,
  getItem,
  setItem,
  removeItem,
  isLegacyDemoRecord,
  filterOutLegacyDemoRecords,
  clearAllStoredData,
  getBookmarks,
  setBookmarks,
  isProfileCompletedInStorage,
  setProfileCompletedInStorage,
  removeProfileCompletedFromStorage,
  isEmployerCompletedInStorage,
  setEmployerCompletedInStorage,
  removeEmployerCompletedFromStorage,
  getStoredUsers,
  setStoredUsers,
  getStoredEmployers,
  setStoredEmployers,
  getStoredJobSeekers,
  setStoredJobSeekers,
  getStoredJobPosts,
  setStoredJobPosts,
  getStoredApplications,
  setStoredApplications,
  getStoredInterviews,
  setStoredInterviews,
  getStoredNotifications,
  setStoredNotifications,
  getStoredAuditLogs,
  setStoredAuditLogs,
  getStoredAnnouncements,
  setStoredAnnouncements,
  getStoredReferralSlips,
  setStoredReferralSlips,
  getStoredLraEvents,
  setStoredLraEvents,
  getStoredCandidateMatches,
  setStoredCandidateMatches,
  getStoredInvitations,
  setStoredInvitations,
};
