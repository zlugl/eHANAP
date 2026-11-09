import { UserRole } from '../types';

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

