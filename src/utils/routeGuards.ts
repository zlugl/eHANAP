import { UserRole, User, JobSeekerProfile, EmployerProfile } from '../types';
import { storageAdapter } from '../lib/storageAdapter';

export const PUBLIC_ROUTES = [
  'landing',
  'jobs',
  'job-detail',
  'employers',
  'privacy',
  'terms',
  'about',
  'contact',
  'bookmarks',
  'saved',
] as const;

export const SEEKER_ROUTES = [
  'seeker-dashboard',
  'seeker-profile-setup',
  'seeker-profile',
  'seeker-applications',
  'seeker-interviews',
  'seeker-settings',
] as const;

export const EMPLOYER_ROUTES = [
  'employer-dashboard',
  'employer-profile-setup',
  'employer-profile',
  'employer-jobs',
  'employer-applicants',
  'employer-interviews',
  'employer-analytics',
  'employer-settings',
] as const;

export const ADMIN_ROUTES = [
  'admin-dashboard',
  'admin-jobs',
  'admin-users',
  'admin-verifications',
  'admin-reports',
  'admin-audit-logs',
  'admin-job-matching',
  'admin-lra',
  'admin-settings',
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
export type SeekerRoute = (typeof SEEKER_ROUTES)[number];
export type EmployerRoute = (typeof EMPLOYER_ROUTES)[number];
export type AdminRoute = (typeof ADMIN_ROUTES)[number];

/**
 * Returns true if a route is publicly accessible without authentication.
 */
export function isPublicRoute(route: string): boolean {
  const clean = (route || '').trim().toLowerCase();
  return PUBLIC_ROUTES.some((p) => p === clean);
}

/**
 * Checks if a specific route is allowed for a user role.
 * If role is undefined/null (guest), only public routes are allowed.
 */
export function isRouteAllowedForRole(route: string, role?: UserRole | null): boolean {
  const clean = (route || '').trim().toLowerCase();
  if (isPublicRoute(clean)) return true;
  if (!role) return false;

  if (role === 'admin') {
    return ADMIN_ROUTES.some((r) => r === clean);
  }

  if (role === 'employer') {
    return EMPLOYER_ROUTES.some((r) => r === clean);
  }

  if (role === 'job_seeker') {
    return SEEKER_ROUTES.some((r) => r === clean);
  }

  return false;
}

/**
 * Returns the default dashboard/home view for a given role.
 */
export function getRoleDefaultView(role?: UserRole | null): string {
  if (role === 'admin') return 'admin-dashboard';
  if (role === 'employer') return 'employer-dashboard';
  if (role === 'job_seeker') return 'seeker-dashboard';
  return 'landing';
}

/**
 * Maps a target unauthorized route to the expected role needed to access it.
 */
export function getRequiredRoleForRoute(route: string): UserRole | null {
  const clean = (route || '').trim().toLowerCase();
  if (ADMIN_ROUTES.some((r) => r === clean)) return 'admin';
  if (EMPLOYER_ROUTES.some((r) => r === clean)) return 'employer';
  if (SEEKER_ROUTES.some((r) => r === clean)) return 'job_seeker';
  return null;
}

/**
 * Determines whether a job seeker has completed their profile setup.
 * Evaluates in order:
 * 1. Explicit user.isProfileCompleted flag
 * 2. Explicit profile.isProfileCompleted flag
 * 3. Verified demo account exception ('poqiq75')
 * 4. Storage fallback (by user ID, profile ID, or normalized email)
 */
export function isSeekerProfileComplete(
  user?: Partial<User> | null,
  profile?: Partial<JobSeekerProfile> | null
): boolean {
  if (user?.isProfileCompleted === true) return true;
  if (profile?.isProfileCompleted === true) return true;

  const userEmail = (user?.email || '').toLowerCase().trim();
  const profileEmail = (profile?.email || '').toLowerCase().trim();

  // Demo persona exception for thesis presentation stability
  if (userEmail.includes('poqiq75') || profileEmail.includes('poqiq75')) {
    return true;
  }

  // Storage fallback lookups
  if (user?.id && storageAdapter.isProfileCompletedInStorage(user.id)) return true;
  if (profile?.id && storageAdapter.isProfileCompletedInStorage(profile.id)) return true;
  if (profile?.userId && storageAdapter.isProfileCompletedInStorage(profile.userId)) return true;
  if (userEmail && storageAdapter.isProfileCompletedInStorage(userEmail)) return true;
  if (profileEmail && storageAdapter.isProfileCompletedInStorage(profileEmail)) return true;

  return false;
}

/**
 * Determines whether an employer has completed their company profile setup.
 * Evaluates in order:
 * 1. Explicit user.isProfileCompleted flag
 * 2. Explicit profile.isProfileCompleted flag
 * 3. Verified demo account exception ('poqiq75')
 * 4. Storage fallback (by user ID, profile ID, or normalized email)
 */
export function isEmployerProfileComplete(
  user?: Partial<User> | null,
  profile?: Partial<EmployerProfile> | null
): boolean {
  if (user?.isProfileCompleted === true) return true;
  if (profile?.isProfileCompleted === true) return true;

  const userEmail = (user?.email || '').toLowerCase().trim();
  const profileEmail = (profile?.email || '').toLowerCase().trim();

  if (userEmail.includes('poqiq75') || profileEmail.includes('poqiq75')) {
    return true;
  }

  if (user?.id && storageAdapter.isEmployerCompletedInStorage(user.id)) return true;
  if (profile?.id && storageAdapter.isEmployerCompletedInStorage(profile.id)) return true;
  if (profile?.userId && storageAdapter.isEmployerCompletedInStorage(profile.userId)) return true;
  if (userEmail && storageAdapter.isEmployerCompletedInStorage(userEmail)) return true;
  if (profileEmail && storageAdapter.isEmployerCompletedInStorage(profileEmail)) return true;

  return false;
}

/**
 * Universal profile completion domain predicate.
 * - Admin users bypass profile setup entirely.
 * - Dispatches to role-specific predicates for employers and job seekers.
 */
export function isProfileComplete(
  user?: Partial<User> | null,
  profile?: Partial<JobSeekerProfile | EmployerProfile> | null
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'employer') {
    return isEmployerProfileComplete(user, profile as Partial<EmployerProfile> | null);
  }
  if (user.role === 'job_seeker') {
    return isSeekerProfileComplete(user, profile as Partial<JobSeekerProfile> | null);
  }
  return false;
}

/**
 * Persists profile completion state across multiple identifiers (ID, email, profile ID) in storage.
 */
export function markProfileCompletedInStorage(
  identifiers: (string | undefined | null)[],
  role: 'job_seeker' | 'employer'
): void {
  for (const id of identifiers) {
    if (!id || typeof id !== 'string') continue;
    if (role === 'job_seeker') {
      storageAdapter.setProfileCompletedInStorage(id, true);
    } else {
      storageAdapter.setEmployerCompletedInStorage(id, true);
    }
  }
}

/**
 * Clears profile completion flags for specified identifiers from storage.
 */
export function clearProfileCompletedInStorage(
  identifiers: (string | undefined | null)[],
  role: 'job_seeker' | 'employer'
): void {
  for (const id of identifiers) {
    if (!id || typeof id !== 'string') continue;
    if (role === 'job_seeker') {
      storageAdapter.removeProfileCompletedFromStorage(id);
    } else {
      storageAdapter.removeEmployerCompletedFromStorage(id);
    }
  }
}


