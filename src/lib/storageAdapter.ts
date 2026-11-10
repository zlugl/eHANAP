import { User, JobSeekerProfile, EmployerInvitation } from '../types';

/**
 * eHANAP Centralized Storage Keys
 */
export const STORAGE_KEYS = {
  BOOKMARKS: 'ehanap_bookmarks',
  LEGACY_BOOKMARKS: 'seeker_bookmarked_jobs',
  USERS: 'ehanap_users',
  JOB_SEEKERS: 'ehanap_job_seekers',
  INVITATIONS: 'ehanap_invitations',
  PROFILE_COMPLETED_PREFIX: 'ehanap_profile_completed_',
  EMPLOYER_COMPLETED_PREFIX: 'ehanap_employer_completed_',
} as const;

// In-memory fallback map for non-browser / headless test / SSR environments
const memoryStore = new Map<string, string>();

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function normalizeKeyIdentifier(idOrEmail: string): string {
  return (idOrEmail || '').trim().toLowerCase();
}

/**
 * Centralized typed Storage Adapter
 * Encapsulates browser localStorage with safe JSON serialization,
 * error boundary fallback, and namespace prefixing.
 */
export const storageAdapter = {
  isAvailable(): boolean {
    return isStorageAvailable();
  },

  getItem<T>(key: string, fallback: T): T {
    try {
      if (isStorageAvailable()) {
        const item = window.localStorage.getItem(key);
        if (item === null) return fallback;
        try {
          return JSON.parse(item) as T;
        } catch {
          // If stored value is a plain string
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
  },

  setItem<T>(key: string, value: T): void {
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
  },

  removeItem(key: string): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.removeItem(key);
      } else {
        memoryStore.delete(key);
      }
    } catch (e) {
      console.warn(`[storageAdapter] Failed to remove item for key: ${key}`, e);
    }
  },

  // --------------------------------------------------------------------------
  // Bookmark Domain Operations & Legacy Migration
  // --------------------------------------------------------------------------

  getBookmarks(fallback: string[] = []): string[] {
    try {
      let bookmarks = this.getItem<string[]>(STORAGE_KEYS.BOOKMARKS, fallback);
      if (!Array.isArray(bookmarks)) bookmarks = fallback;

      // Migrate legacy 'seeker_bookmarked_jobs' if present
      const legacyRaw = this.getItem<string[] | null>(STORAGE_KEYS.LEGACY_BOOKMARKS, null);
      if (legacyRaw && Array.isArray(legacyRaw) && legacyRaw.length > 0) {
        const combined = Array.from(new Set([...bookmarks, ...legacyRaw]));
        this.setItem(STORAGE_KEYS.BOOKMARKS, combined);
        this.removeItem(STORAGE_KEYS.LEGACY_BOOKMARKS);
        return combined;
      }

      return bookmarks;
    } catch {
      return fallback;
    }
  },

  setBookmarks(jobIds: string[]): void {
    this.setItem(STORAGE_KEYS.BOOKMARKS, Array.from(new Set(jobIds)));
  },

  // --------------------------------------------------------------------------
  // Profile Completion Invariants (Job Seeker)
  // --------------------------------------------------------------------------

  isProfileCompletedInStorage(idOrEmail: string): boolean {
    if (!idOrEmail) return false;
    const clean = normalizeKeyIdentifier(idOrEmail);
    const key = `${STORAGE_KEYS.PROFILE_COMPLETED_PREFIX}${clean}`;
    const val = this.getItem<string | boolean | null>(key, null);
    return val === 'true' || val === true;
  },

  setProfileCompletedInStorage(idOrEmail: string, completed = true): void {
    if (!idOrEmail) return;
    const clean = normalizeKeyIdentifier(idOrEmail);
    const key = `${STORAGE_KEYS.PROFILE_COMPLETED_PREFIX}${clean}`;
    if (completed) {
      this.setItem(key, 'true');
    } else {
      this.removeItem(key);
    }
  },

  removeProfileCompletedFromStorage(idOrEmail: string): void {
    if (!idOrEmail) return;
    const clean = normalizeKeyIdentifier(idOrEmail);
    const key = `${STORAGE_KEYS.PROFILE_COMPLETED_PREFIX}${clean}`;
    this.removeItem(key);
  },

  // --------------------------------------------------------------------------
  // Employer Completion Invariants
  // --------------------------------------------------------------------------

  isEmployerCompletedInStorage(idOrEmail: string): boolean {
    if (!idOrEmail) return false;
    const clean = normalizeKeyIdentifier(idOrEmail);
    const key = `${STORAGE_KEYS.EMPLOYER_COMPLETED_PREFIX}${clean}`;
    const val = this.getItem<string | boolean | null>(key, null);
    return val === 'true' || val === true;
  },

  setEmployerCompletedInStorage(idOrEmail: string, completed = true): void {
    if (!idOrEmail) return;
    const clean = normalizeKeyIdentifier(idOrEmail);
    const key = `${STORAGE_KEYS.EMPLOYER_COMPLETED_PREFIX}${clean}`;
    if (completed) {
      this.setItem(key, 'true');
    } else {
      this.removeItem(key);
    }
  },

  removeEmployerCompletedFromStorage(idOrEmail: string): void {
    if (!idOrEmail) return;
    const clean = normalizeKeyIdentifier(idOrEmail);
    const key = `${STORAGE_KEYS.EMPLOYER_COMPLETED_PREFIX}${clean}`;
    this.removeItem(key);
  },

  // --------------------------------------------------------------------------
  // Entity Collections Storage (Users, Seekers, Invitations)
  // --------------------------------------------------------------------------

  getStoredUsers(fallback: User[] = []): User[] {
    const data = this.getItem<User[]>(STORAGE_KEYS.USERS, fallback);
    return Array.isArray(data) ? data : fallback;
  },

  setStoredUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  },

  getStoredJobSeekers(fallback: JobSeekerProfile[] = []): JobSeekerProfile[] {
    const data = this.getItem<JobSeekerProfile[]>(STORAGE_KEYS.JOB_SEEKERS, fallback);
    return Array.isArray(data) ? data : fallback;
  },

  setStoredJobSeekers(seekers: JobSeekerProfile[]): void {
    this.setItem(STORAGE_KEYS.JOB_SEEKERS, seekers);
  },

  getStoredInvitations(fallback: EmployerInvitation[] = []): EmployerInvitation[] {
    const data = this.getItem<EmployerInvitation[]>(STORAGE_KEYS.INVITATIONS, fallback);
    return Array.isArray(data) ? data : fallback;
  },

  setStoredInvitations(invitations: EmployerInvitation[]): void {
    this.setItem(STORAGE_KEYS.INVITATIONS, invitations);
  },
};
