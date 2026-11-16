import { User, JobSeekerProfile, EmployerProfile, CandidateInvitation } from '../types';

/**
 * eHANAP Centralized Storage Keys
 */
export const STORAGE_KEYS = {
  BOOKMARKS: 'ehanap_bookmarks',
  LEGACY_BOOKMARKS: 'seeker_bookmarked_jobs',
  USERS: 'ehanap_users',
  JOB_SEEKERS: 'ehanap_job_seekers',
  EMPLOYERS: 'ehanap_employers',
  INVITATIONS: 'ehanap_invitations',
  PROFILE_COMPLETED_PREFIX: 'ehanap_profile_completed_',
  EMPLOYER_COMPLETED_PREFIX: 'ehanap_employer_completed_',
} as const;

// In-memory fallback map for non-browser / headless test / SSR environments
const memoryStore = new Map<string, string>();

export function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function normalizeKeyIdentifier(idOrEmail: string): string {
  return (idOrEmail || '').trim().toLowerCase();
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

    // Migrate legacy 'seeker_bookmarked_jobs' if present
    const legacyRaw = getItem<string[] | null>(STORAGE_KEYS.LEGACY_BOOKMARKS, null);
    if (legacyRaw && Array.isArray(legacyRaw) && legacyRaw.length > 0) {
      const combined = Array.from(new Set([...bookmarks, ...legacyRaw]));
      setItem(STORAGE_KEYS.BOOKMARKS, combined);
      removeItem(STORAGE_KEYS.LEGACY_BOOKMARKS);
      return combined;
    }

    return bookmarks;
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
// Entity Collections Storage (Users, Seekers, Invitations)
// --------------------------------------------------------------------------

export function getStoredUsers(fallback: User[] = []): User[] {
  const data = getItem<User[]>(STORAGE_KEYS.USERS, fallback);
  return Array.isArray(data) ? data : fallback;
}

export function setStoredUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, users);
}

export function getStoredJobSeekers(fallback: JobSeekerProfile[] = []): JobSeekerProfile[] {
  const data = getItem<JobSeekerProfile[]>(STORAGE_KEYS.JOB_SEEKERS, fallback);
  return Array.isArray(data) ? data : fallback;
}

export function setStoredJobSeekers(seekers: JobSeekerProfile[]): void {
  setItem(STORAGE_KEYS.JOB_SEEKERS, seekers);
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
  return Array.isArray(data) ? data : fallback;
}

export function setStoredInvitations(invitations: CandidateInvitation[]): void {
  setItem(STORAGE_KEYS.INVITATIONS, invitations);
}

/**
 * Centralized typed Storage Adapter
 * Encapsulates browser localStorage with safe JSON serialization,
 * error boundary fallback, and namespace prefixing.
 */
export const storageAdapter = {
  isAvailable: isStorageAvailable,
  getItem,
  setItem,
  removeItem,
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
  getStoredJobSeekers,
  setStoredJobSeekers,
  getStoredEmployers,
  setStoredEmployers,
  getStoredInvitations,
  setStoredInvitations,
};
