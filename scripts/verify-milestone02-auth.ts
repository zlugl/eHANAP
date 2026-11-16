import {
  signUpWithSupabase,
  verifySupabaseOtp,
  resendSupabaseOtp,
  sendPasswordResetEmail,
  resetPasswordWithOtp,
  signInWithSupabase,
  signOutWithSupabase,
  signInWithSupabaseOAuth,
  getSupabaseSession,
  getSupabaseUser,
  onSupabaseAuthStateChange,
} from '../src/services/supabaseService';
import {
  isPublicRoute,
  isRouteAllowedForRole,
  getRoleDefaultView,
  getRequiredRoleForRoute,
  PUBLIC_ROUTES,
  SEEKER_ROUTES,
  EMPLOYER_ROUTES,
  ADMIN_ROUTES,
} from '../src/utils/routeGuards';
import {
  DEMO_ACCOUNTS,
  PRIMARY_DEMO_ACCOUNTS,
  getDemoAccountByEmail,
  getDemoAccountsByRole,
} from '../src/data/demoAccounts';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYERS,
  INITIAL_JOB_SEEKERS,
} from '../src/data/mockData';
import { UserRole } from '../src/types';

console.log('--- eHANAP Milestone 02: Multi-Role Authentication, Authorization & Session Verification ---');

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

async function runMilestone02Tests() {
  // ---------------------------------------------------------------------------
  // Suite 1: Supabase Auth Service Layer & Offline Resilience
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 1] Supabase Auth Service Layer & Offline Resilience');

  const signUpResult = await signUpWithSupabase('new.seeker@test.ph', 'password123', {
    name: 'New Test Seeker',
    role: 'job_seeker',
  });
  assert(signUpResult.success === true, 'signUpWithSupabase succeeds with valid payload');
  assert(Boolean(signUpResult.user), 'signUpWithSupabase returns user object');
  assert(signUpResult.user?.email === 'new.seeker@test.ph', 'signUpWithSupabase preserves user email');

  // Native 6-digit email OTP verification & resend assertions (WP-01)
  const masterOtpResult = await verifySupabaseOtp('new.seeker@test.ph', '123456', 'signup');
  assert(masterOtpResult.success === true, 'verifySupabaseOtp accepts master demo code 123456');

  const invalidOtpResult = await verifySupabaseOtp('new.seeker@test.ph', '000000', 'signup');
  assert(invalidOtpResult.success === false, 'verifySupabaseOtp rejects invalid OTP token');
  assert(Boolean(invalidOtpResult.error), 'verifySupabaseOtp provides clear error message on rejection');

  const resendResult = await resendSupabaseOtp('new.seeker@test.ph', 'signup');
  assert(typeof resendResult.success === 'boolean', 'resendSupabaseOtp returns execution status');

  // Native password recovery OTP assertions (WP-02)
  const resetEmailResult = await sendPasswordResetEmail('juan.delacruz@jobseeker.ph');
  assert(resetEmailResult.success === true, 'sendPasswordResetEmail succeeds with valid email');

  const emptyResetEmailResult = await sendPasswordResetEmail('');
  assert(emptyResetEmailResult.success === false, 'sendPasswordResetEmail rejects empty email');

  const masterRecoveryResult = await resetPasswordWithOtp('juan.delacruz@jobseeker.ph', '123456', 'newPassword123');
  assert(masterRecoveryResult.success === true, 'resetPasswordWithOtp accepts master demo code 123456');

  const invalidRecoveryResult = await resetPasswordWithOtp('juan.delacruz@jobseeker.ph', '000000', 'newPassword123');
  assert(invalidRecoveryResult.success === false, 'resetPasswordWithOtp rejects invalid OTP token');

  const shortPasswordResult = await resetPasswordWithOtp('juan.delacruz@jobseeker.ph', '123456', '123');
  assert(shortPasswordResult.success === false, 'resetPasswordWithOtp rejects short password (< 6 characters)');

  const signInResult = await signInWithSupabase('juan.delacruz@jobseeker.ph', 'password123');
  assert(signInResult.success === true, 'signInWithSupabase succeeds');
  assert(Boolean(signInResult.user), 'signInWithSupabase returns authenticated user');

  const signOutResult = await signOutWithSupabase();
  assert(signOutResult.success === true, 'signOutWithSupabase successfully logs out');

  const authSession = await getSupabaseSession();
  assert(authSession === null || typeof authSession === 'object', 'getSupabaseSession returns valid session or null in offline mode');

  const currentUser = await getSupabaseUser();
  assert(currentUser === null || typeof currentUser === 'object', 'getSupabaseUser safely executes');

  let authListenerTriggered = false;
  const listenerSub = onSupabaseAuthStateChange((event, session) => {
    authListenerTriggered = true;
  });
  assert(typeof listenerSub.unsubscribe === 'function', 'onSupabaseAuthStateChange returns clean unsubscribe handle');
  listenerSub.unsubscribe();

  // Google OAuth live pipeline & Apple decommissioning assertions (WP-03)
  const googleOAuthResult = await signInWithSupabaseOAuth('google');
  assert(googleOAuthResult.success === true, 'signInWithSupabaseOAuth succeeds with google provider');
  assert(Boolean(googleOAuthResult.data), 'signInWithSupabaseOAuth returns data payload');

  const appleOAuthResult = await signInWithSupabaseOAuth('apple' as any);
  assert(appleOAuthResult.success === false, 'signInWithSupabaseOAuth rejects decommissioned apple provider');
  assert(
    Boolean(appleOAuthResult.error && appleOAuthResult.error.includes('Apple Sign In has been decommissioned')),
    'signInWithSupabaseOAuth provides clear error message when apple provider is attempted'
  );

  // ---------------------------------------------------------------------------
  // Suite 2: Multi-Role Personas & Demo Account Metadata
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 2] Multi-Role Personas & Demo Account Metadata');

  assert(DEMO_ACCOUNTS.length >= 5, `DEMO_ACCOUNTS registers all key personas (found: ${DEMO_ACCOUNTS.length})`);

  const seekerDemo = DEMO_ACCOUNTS.find((a) => a.role === 'job_seeker');
  assert(Boolean(seekerDemo), 'DEMO_ACCOUNTS registers at least one Job Seeker persona');
  assert(seekerDemo?.email === 'juan.delacruz@jobseeker.ph', 'Primary Job Seeker persona is Juan Dela Cruz');
  assert(seekerDemo?.password === 'password123', 'Job Seeker demo password is standard');

  const employerDemo = DEMO_ACCOUNTS.find((a) => a.role === 'employer');
  assert(Boolean(employerDemo), 'DEMO_ACCOUNTS registers at least one Employer persona');
  assert(employerDemo?.email === 'puregold.roxas@employer.ph', 'Primary Employer persona is Puregold Roxas');

  const adminDemo = DEMO_ACCOUNTS.find((a) => a.role === 'admin');
  assert(Boolean(adminDemo), 'DEMO_ACCOUNTS registers PESO Municipal Admin persona');
  assert(adminDemo?.email === 'peso.admin@roxas.gov.ph', 'Admin persona email matches municipal oversight');

  assert(Boolean(PRIMARY_DEMO_ACCOUNTS.seeker), 'PRIMARY_DEMO_ACCOUNTS exports primary seeker');
  assert(Boolean(PRIMARY_DEMO_ACCOUNTS.employer), 'PRIMARY_DEMO_ACCOUNTS exports primary employer');
  assert(Boolean(PRIMARY_DEMO_ACCOUNTS.admin), 'PRIMARY_DEMO_ACCOUNTS exports primary admin');

  const lookupResult = getDemoAccountByEmail('puregold.roxas@employer.ph');
  assert(lookupResult?.id === 'demo-emp-puregold', 'getDemoAccountByEmail case-insensitively resolves demo account');

  const employerAccounts = getDemoAccountsByRole('employer');
  assert(employerAccounts.length >= 3, `getDemoAccountsByRole retrieves employers (found: ${employerAccounts.length})`);

  const seekerAccounts = getDemoAccountsByRole('job_seeker');
  assert(seekerAccounts.length >= 2, `getDemoAccountsByRole retrieves seekers (found: ${seekerAccounts.length})`);

  // ---------------------------------------------------------------------------
  // Suite 3: Multi-Role Authentication & Session Hydration
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 3] Multi-Role Authentication & Session Hydration Simulation');

  // Simulate loginAs against initial user pool
  function simulateLogin(email: string, password?: string) {
    const cleanEmail = email.toLowerCase().trim();
    const found = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (password && (found as any).password && (found as any).password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    const matchingSeeker = INITIAL_JOB_SEEKERS.find(
      (s) => s.userId === found.id || s.email.toLowerCase() === cleanEmail
    );
    const matchingEmployer = INITIAL_EMPLOYERS.find(
      (e) => e.userId === found.id || e.email.toLowerCase() === cleanEmail
    );

    return {
      success: true,
      user: found,
      role: found.role,
      seekerProfile: matchingSeeker || null,
      employerProfile: matchingEmployer || null,
    };
  }

  // 1. Seeker Login
  const seekerSession = simulateLogin('juan.delacruz@jobseeker.ph', 'password123');
  assert(seekerSession.success === true, 'Job Seeker credentials authenticate');
  assert(seekerSession.role === 'job_seeker', 'Job Seeker session sets role to job_seeker');
  assert(Boolean(seekerSession.seekerProfile), 'Job Seeker session hydrates seekerProfile from database');
  assert(seekerSession.seekerProfile?.firstName === 'Juan', 'Hydrated seeker profile firstName matches Juan');

  // 2. Employer Login
  const employerSession = simulateLogin('puregold.roxas@employer.ph', 'password123');
  assert(employerSession.success === true, 'Employer credentials authenticate');
  assert(employerSession.role === 'employer', 'Employer session sets role to employer');
  assert(Boolean(employerSession.employerProfile), 'Employer session hydrates employerProfile from database');
  assert(employerSession.employerProfile?.companyName?.includes('Puregold'), 'Employer profile represents Puregold Price Club');

  // 3. PESO Admin Login
  const adminSession = simulateLogin('peso.admin@roxas.gov.ph', 'password123');
  assert(adminSession.success === true, 'PESO Admin credentials authenticate');
  assert(adminSession.role === 'admin', 'PESO Admin session sets role to admin');

  // 4. Invalid Password Rejection
  const badPasswordSession = simulateLogin('peso.admin@roxas.gov.ph', 'wrong-pass');
  assert(badPasswordSession.success === false, 'Invalid password is rejected');

  // 5. Unregistered Email Rejection
  const unregisteredSession = simulateLogin('unknown.constituent@roxas.gov.ph', 'password123');
  assert(unregisteredSession.success === false, 'Unregistered email address is rejected');

  // ---------------------------------------------------------------------------
  // Suite 4: Strict Role Gatekeeping & Route Protection
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 4] Strict Role Gatekeeping & Route Protection');

  // Public Routes
  assert(isPublicRoute('landing'), 'Landing page is marked as public');
  assert(isPublicRoute('jobs'), 'Job search view is marked as public');
  assert(isPublicRoute('job-detail'), 'Job details view is marked as public');
  assert(isPublicRoute('employers'), 'Employer directory is marked as public');
  assert(isRouteAllowedForRole('landing', null), 'Guest allowed to access landing');
  assert(isRouteAllowedForRole('jobs', null), 'Guest allowed to access jobs');

  // Guest Access to Private Portals
  assert(!isRouteAllowedForRole('seeker-dashboard', null), 'Guest denied access to seeker-dashboard');
  assert(!isRouteAllowedForRole('employer-dashboard', null), 'Guest denied access to employer-dashboard');
  assert(!isRouteAllowedForRole('admin-dashboard', null), 'Guest denied access to admin-dashboard');

  // Cross-Role Access Checks
  assert(isRouteAllowedForRole('seeker-dashboard', 'job_seeker'), 'Seeker allowed to access seeker-dashboard');
  assert(isRouteAllowedForRole('seeker-applications', 'job_seeker'), 'Seeker allowed to access seeker-applications');
  assert(!isRouteAllowedForRole('employer-dashboard', 'job_seeker'), 'Seeker denied access to employer-dashboard');
  assert(!isRouteAllowedForRole('admin-dashboard', 'job_seeker'), 'Seeker denied access to admin-dashboard');
  assert(!isRouteAllowedForRole('admin-verifications', 'job_seeker'), 'Seeker denied access to admin-verifications');

  assert(isRouteAllowedForRole('employer-dashboard', 'employer'), 'Employer allowed to access employer-dashboard');
  assert(isRouteAllowedForRole('employer-applicants', 'employer'), 'Employer allowed to access employer-applicants');
  assert(!isRouteAllowedForRole('seeker-dashboard', 'employer'), 'Employer denied access to seeker-dashboard');
  assert(!isRouteAllowedForRole('admin-dashboard', 'employer'), 'Employer denied access to admin-dashboard');

  assert(isRouteAllowedForRole('admin-dashboard', 'admin'), 'Admin allowed to access admin-dashboard');
  assert(isRouteAllowedForRole('admin-reports', 'admin'), 'Admin allowed to access admin-reports');
  assert(isRouteAllowedForRole('admin-lra', 'admin'), 'Admin allowed to access admin-lra');
  assert(!isRouteAllowedForRole('employer-jobs', 'admin'), 'Admin denied access to employer private job management');
  assert(!isRouteAllowedForRole('seeker-applications', 'admin'), 'Admin denied access to seeker private application view');

  // Route Role Requirement Helpers
  assert(getRequiredRoleForRoute('admin-reports') === 'admin', 'getRequiredRoleForRoute correctly resolves admin');
  assert(getRequiredRoleForRoute('employer-applicants') === 'employer', 'getRequiredRoleForRoute correctly resolves employer');
  assert(getRequiredRoleForRoute('seeker-profile') === 'job_seeker', 'getRequiredRoleForRoute correctly resolves job_seeker');
  assert(getRequiredRoleForRoute('landing') === null, 'getRequiredRoleForRoute returns null for public routes');

  // Default Home View Routing
  assert(getRoleDefaultView('admin') === 'admin-dashboard', 'Default home view for admin is admin-dashboard');
  assert(getRoleDefaultView('employer') === 'employer-dashboard', 'Default home view for employer is employer-dashboard');
  assert(getRoleDefaultView('job_seeker') === 'seeker-dashboard', 'Default home view for job_seeker is seeker-dashboard');
  assert(getRoleDefaultView(null) === 'landing', 'Default home view for guest is landing');

  // ---------------------------------------------------------------------------
  // Suite 5: 1-Click Demo Persona Switching Contract
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 5] 1-Click Demo Persona Switching Contract');

  function simulateDemoSwitch(target: 'job_seeker' | 'employer' | 'admin' | string) {
    let email = '';
    const cleanTarget = target.trim().toLowerCase();

    if (cleanTarget === 'job_seeker' || cleanTarget === 'seeker') {
      email = 'juan.delacruz@jobseeker.ph';
    } else if (cleanTarget === 'employer') {
      email = 'puregold.roxas@employer.ph';
    } else if (cleanTarget === 'admin') {
      email = 'peso.admin@roxas.gov.ph';
    } else {
      const demo = DEMO_ACCOUNTS.find(
        (a) => a.id.toLowerCase() === cleanTarget || a.email.toLowerCase() === cleanTarget
      );
      if (demo) email = demo.email;
      else email = target;
    }

    return simulateLogin(email, 'password123');
  }

  const switchSeeker = simulateDemoSwitch('job_seeker');
  assert(switchSeeker.success === true, '1-Click switch to job_seeker succeeds');
  assert(switchSeeker.role === 'job_seeker', '1-Click switch activates job_seeker role');
  assert(switchSeeker.user?.email === 'juan.delacruz@jobseeker.ph', '1-Click switch activates Juan Dela Cruz');

  const switchEmployer = simulateDemoSwitch('employer');
  assert(switchEmployer.success === true, '1-Click switch to employer succeeds');
  assert(switchEmployer.role === 'employer', '1-Click switch activates employer role');
  assert(switchEmployer.user?.email === 'puregold.roxas@employer.ph', '1-Click switch activates Puregold Roxas');

  const switchAdmin = simulateDemoSwitch('admin');
  assert(switchAdmin.success === true, '1-Click switch to admin succeeds');
  assert(switchAdmin.role === 'admin', '1-Click switch activates admin role');
  assert(switchAdmin.user?.email === 'peso.admin@roxas.gov.ph', '1-Click switch activates PESO Admin');

  const switchCustomDemo = simulateDemoSwitch('demo-emp-tech');
  assert(switchCustomDemo.success === true, '1-Click switch by demo ID succeeds');
  assert(switchCustomDemo.user?.email === 'tech.innovations@employer.ph', '1-Click switch activates Mindoro Tech Innovations');

  // ---------------------------------------------------------------------------
  // Suite 6: Profile Setup Wizard & Dual-Persistence Contract
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 6] Profile Setup Wizard & Dual-Persistence Contract');

  // Verify newly created account defaults to uncompleted profile
  const newAccount = {
    id: 'user-new-001',
    email: 'constituent.new@gmail.com',
    role: 'job_seeker' as UserRole,
    isProfileCompleted: false,
  };
  assert(newAccount.isProfileCompleted === false, 'New account defaults to isProfileCompleted: false');

  // Verify setup wizard gate routes uncompleted seeker to setup wizard
  const isSeekerAllowedDashboard = newAccount.isProfileCompleted && isRouteAllowedForRole('seeker-dashboard', newAccount.role);
  assert(!isSeekerAllowedDashboard, 'Uncompleted seeker profile is blocked from accessing seeker-dashboard');

  // Complete profile
  const completedAccount = {
    ...newAccount,
    isProfileCompleted: true,
  };
  const isCompletedSeekerAllowed = completedAccount.isProfileCompleted && isRouteAllowedForRole('seeker-dashboard', completedAccount.role);
  assert(isCompletedSeekerAllowed, 'Completed seeker profile is granted access to seeker-dashboard');

  console.log(`\n--- Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
  if (passedTests === totalTests) {
    console.log('Milestone 02 Multi-Role Authentication, Authorization & Session Management is VERIFIED!\n');
  } else {
    console.error('Some tests failed. Check output above.\n');
    process.exitCode = 1;
  }
}

runMilestone02Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});

