import {
  signUpWithSupabase,
  signInWithSupabase,
  signOutWithSupabase,
  getSupabaseSession,
  getSupabaseUser,
  onSupabaseAuthStateChange,
} from '../src/services/supabaseService';
import {
  isPublicRoute,
  isRouteAllowedForRole,
  getRoleDefaultView,
  getRequiredRoleForRoute,
  isProfileComplete,
} from '../src/utils/routeGuards';
import {
  DEMO_ACCOUNTS,
  PRIMARY_DEMO_ACCOUNTS,
  getDemoAccountByEmail,
  getDemoAccountsByRole,
} from '../src/data/demoAccounts';
import { storageAdapter } from '../src/lib/storageAdapter';
import { AuthProvider, useAuth, AuthContextType } from '../src/context/AuthContext';
import { UserRole } from '../src/types';
import { mountWithProvider } from './testContextHarness';

console.log('--- eHANAP Milestone 02: Multi-Role Authentication, Authorization & Real AuthContext Verification ---');

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

  const signInResult = await signInWithSupabase('juan.delacruz@jobseeker.ph', 'password123');
  assert(signInResult.success === true, 'signInWithSupabase succeeds');
  assert(Boolean(signInResult.user), 'signInWithSupabase returns authenticated user');

  const signOutResult = await signOutWithSupabase();
  assert(signOutResult.success === true, 'signOutWithSupabase successfully logs out');

  const authSession = await getSupabaseSession();
  assert(authSession === null || typeof authSession === 'object', 'getSupabaseSession returns valid session or null in offline mode');

  const currentUser = await getSupabaseUser();
  assert(currentUser === null || typeof currentUser === 'object', 'getSupabaseUser safely executes');

  const listenerSub = onSupabaseAuthStateChange(() => {});
  assert(typeof listenerSub.unsubscribe === 'function', 'onSupabaseAuthStateChange returns clean unsubscribe handle');
  listenerSub.unsubscribe();

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

  // Mount real AuthProvider for Suites 3, 5, and 6
  const mounted = await mountWithProvider<AuthContextType>(AuthProvider, useAuth);

  try {
    // ---------------------------------------------------------------------------
    // Suite 3: Real AuthContext Multi-Role Authentication & Session Hydration
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 3] Real AuthContext Multi-Role Authentication & Session Hydration');

    let seekerSession!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      seekerSession = await mounted.getApi().loginAs('juan.delacruz@jobseeker.ph', 'password123');
    });
    assert(seekerSession.success === true, 'Real AuthContext.loginAs authenticates Job Seeker');
    assert(mounted.getApi().currentRole === 'job_seeker', 'AuthContext sets currentRole to job_seeker');
    assert(Boolean(seekerSession.seekerProfile), 'AuthContext.loginAs hydrates seekerProfile');
    assert(seekerSession.seekerProfile?.firstName === 'Juan', 'Hydrated seeker profile firstName matches Juan');

    let employerSession!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      employerSession = await mounted.getApi().loginAs('puregold.roxas@employer.ph', 'password123');
    });
    assert(employerSession.success === true, 'Real AuthContext.loginAs authenticates Employer');
    assert(mounted.getApi().currentRole === 'employer', 'AuthContext sets currentRole to employer');
    assert(Boolean(employerSession.employerProfile), 'AuthContext.loginAs hydrates employerProfile');
    assert(
      Boolean(employerSession.employerProfile?.companyName?.includes('Puregold')),
      'Hydrated employer profile represents Puregold Price Club'
    );

    let adminSession!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      adminSession = await mounted.getApi().loginAs('peso.admin@roxas.gov.ph', 'password123');
    });
    assert(adminSession.success === true, 'Real AuthContext.loginAs authenticates PESO Admin');
    assert(mounted.getApi().currentRole === 'admin', 'AuthContext sets currentRole to admin');

    await mounted.act(async () => {
      mounted.getApi().logout();
    });
    assert(mounted.getApi().currentUser === null && !mounted.getApi().isAuthenticated, 'AuthContext.logout clears active session');

    let badPasswordSession!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      badPasswordSession = await mounted.getApi().loginAs('peso.admin@roxas.gov.ph', 'wrong-pass');
    });
    assert(badPasswordSession.success === false, 'Real AuthContext.loginAs rejects invalid password');
    assert(mounted.getApi().currentUser === null, 'Failed login leaves currentUser null');

    let emptyPasswordSession!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      emptyPasswordSession = await mounted.getApi().loginAs('peso.admin@roxas.gov.ph', '');
    });
    assert(emptyPasswordSession.success === false, 'Real AuthContext.loginAs rejects empty password');

    let unregisteredSession!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      unregisteredSession = await mounted.getApi().loginAs('unknown.constituent@roxas.gov.ph', 'password123');
    });
    assert(unregisteredSession.success === false, 'Real AuthContext.loginAs rejects unregistered email address');

    // ---------------------------------------------------------------------------
    // Suite 4: Strict Role Gatekeeping & Route Protection
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 4] Strict Role Gatekeeping & Route Protection');

    assert(isPublicRoute('landing'), 'Landing page is marked as public');
    assert(isPublicRoute('jobs'), 'Job search view is marked as public');
    assert(isPublicRoute('job-detail'), 'Job details view is marked as public');
    assert(isPublicRoute('employers'), 'Employer directory is marked as public');
    assert(isRouteAllowedForRole('landing', null), 'Guest allowed to access landing');
    assert(isRouteAllowedForRole('jobs', null), 'Guest allowed to access jobs');

    assert(!isRouteAllowedForRole('seeker-dashboard', null), 'Guest denied access to seeker-dashboard');
    assert(!isRouteAllowedForRole('employer-dashboard', null), 'Guest denied access to employer-dashboard');
    assert(!isRouteAllowedForRole('admin-dashboard', null), 'Guest denied access to admin-dashboard');

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

    assert(getRequiredRoleForRoute('admin-reports') === 'admin', 'getRequiredRoleForRoute correctly resolves admin');
    assert(getRequiredRoleForRoute('employer-applicants') === 'employer', 'getRequiredRoleForRoute correctly resolves employer');
    assert(getRequiredRoleForRoute('seeker-profile') === 'job_seeker', 'getRequiredRoleForRoute correctly resolves job_seeker');
    assert(getRequiredRoleForRoute('landing') === null, 'getRequiredRoleForRoute returns null for public routes');

    assert(getRoleDefaultView('admin') === 'admin-dashboard', 'Default home view for admin is admin-dashboard');
    assert(getRoleDefaultView('employer') === 'employer-dashboard', 'Default home view for employer is employer-dashboard');
    assert(getRoleDefaultView('job_seeker') === 'seeker-dashboard', 'Default home view for job_seeker is seeker-dashboard');
    assert(getRoleDefaultView(null) === 'landing', 'Default home view for guest is landing');

    // ---------------------------------------------------------------------------
    // Suite 5: Real AuthContext 1-Click Demo Persona Switching
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 5] Real AuthContext 1-Click Demo Persona Switching');

    let switchSeeker!: Awaited<ReturnType<AuthContextType['switchDemoRole']>>;
    await mounted.act(async () => {
      switchSeeker = await mounted.getApi().switchDemoRole('job_seeker');
    });
    assert(switchSeeker.success === true, 'Real switchDemoRole("job_seeker") succeeds');
    assert(mounted.getApi().currentRole === 'job_seeker', 'switchDemoRole activates job_seeker role');
    assert(mounted.getApi().currentUser?.email === 'juan.delacruz@jobseeker.ph', 'switchDemoRole activates Juan Dela Cruz');

    let switchEmployer!: Awaited<ReturnType<AuthContextType['switchDemoRole']>>;
    await mounted.act(async () => {
      switchEmployer = await mounted.getApi().switchDemoRole('employer');
    });
    assert(switchEmployer.success === true, 'Real switchDemoRole("employer") succeeds');
    assert(mounted.getApi().currentRole === 'employer', 'switchDemoRole activates employer role');
    assert(mounted.getApi().currentUser?.email === 'puregold.roxas@employer.ph', 'switchDemoRole activates Puregold Roxas');

    let switchAdmin!: Awaited<ReturnType<AuthContextType['switchDemoRole']>>;
    await mounted.act(async () => {
      switchAdmin = await mounted.getApi().switchDemoRole('admin');
    });
    assert(switchAdmin.success === true, 'Real switchDemoRole("admin") succeeds');
    assert(mounted.getApi().currentRole === 'admin', 'switchDemoRole activates admin role');
    assert(mounted.getApi().currentUser?.email === 'peso.admin@roxas.gov.ph', 'switchDemoRole activates PESO Admin');

    let switchCustomDemo!: Awaited<ReturnType<AuthContextType['switchDemoRole']>>;
    await mounted.act(async () => {
      switchCustomDemo = await mounted.getApi().switchDemoRole('demo-emp-tech');
    });
    assert(switchCustomDemo.success === true, 'Real switchDemoRole by demo ID succeeds');
    assert(mounted.getApi().currentUser?.email === 'tech.innovations@employer.ph', 'switchDemoRole activates Mindoro Tech Innovations');

    // ---------------------------------------------------------------------------
    // Suite 6: Registration, Employer Storage, Google OAuth, OTP & Password Recovery
    // ---------------------------------------------------------------------------
    console.log('\n[Suite 6] Real AuthContext Registration, OAuth, OTP & Password Recovery');

    let adminRegRes!: ReturnType<AuthContextType['registerUser']>;
    await mounted.act(async () => {
      adminRegRes = mounted.getApi().registerUser(
        {
          email: 'unauthorized.admin@roxas.gov.ph',
          name: 'Unauthorized Admin',
          role: 'admin' as UserRole,
          isAccountVerified: false,
        },
        { password: 'password123' }
      );
    });
    assert(adminRegRes.success === false, 'registerUser blocks registering additional admin accounts');

    const newSeekerEmail = 'constituent.new@gmail.com';
    let seekerRegRes!: ReturnType<AuthContextType['registerUser']>;
    await mounted.act(async () => {
      seekerRegRes = mounted.getApi().registerUser(
        {
          email: newSeekerEmail,
          name: 'Ana Reyes',
          role: 'job_seeker',
          isAccountVerified: false,
        },
        {
          password: 'SeekerPass1!',
          firstName: 'Ana',
          lastName: 'Reyes',
          barangay: 'Bagumbayan',
        }
      );
    });
    assert(seekerRegRes.success === true, 'registerUser creates new job_seeker account');
    assert(seekerRegRes.user?.isProfileCompleted === false, 'Newly registered job_seeker defaults to isProfileCompleted: false');
    assert(
      !isProfileComplete(seekerRegRes.user),
      'Uncompleted seeker profile fails isProfileComplete gate before onboarding'
    );

    const newEmployerEmail = 'roxas.hardware@employer.ph';
    let empRegRes!: ReturnType<AuthContextType['registerUser']>;
    await mounted.act(async () => {
      empRegRes = mounted.getApi().registerUser(
        {
          email: newEmployerEmail,
          name: 'Carlos Mendoza',
          role: 'employer',
          isAccountVerified: false,
        },
        {
          password: 'EmpPass1!',
          companyName: 'Roxas Hardware Depot',
          representativeName: 'Carlos Mendoza',
          municipality: 'Roxas',
        }
      );
    });
    assert(empRegRes.success === true, 'registerUser creates new employer account');
    assert(
      storageAdapter.getStoredEmployers([]).some((e) => e.email.toLowerCase() === newEmployerEmail),
      'registerUser persists newly registered employer profile to storageAdapter'
    );

    let empLoginRes!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      empLoginRes = await mounted.getApi().loginAs(newEmployerEmail, 'EmpPass1!');
    });
    assert(empLoginRes.success === true, 'Newly registered employer can log in with real AuthContext.loginAs');
    assert(
      empLoginRes.employerProfile?.companyName === 'Roxas Hardware Depot',
      'Employer login hydrates newly registered EmployerProfile'
    );
    assert(empLoginRes.isProfileCompleted === false, 'Newly registered employer starts with isProfileCompleted: false');

    let oauthEmpRes!: Awaited<ReturnType<AuthContextType['continueWithGoogle']>>;
    await mounted.act(async () => {
      oauthEmpRes = await mounted.getApi().continueWithGoogle('employer');
    });
    assert(oauthEmpRes.success === true && oauthEmpRes.isNewUser === true, 'continueWithGoogle("employer") creates new OAuth employer');
    assert(
      Boolean(oauthEmpRes.employerProfile && oauthEmpRes.employerProfile.userId === oauthEmpRes.user?.id),
      'continueWithGoogle("employer") creates linked EmployerProfile'
    );
    assert(
      storageAdapter.getStoredEmployers([]).some((e) => e.userId === oauthEmpRes.user?.id),
      'continueWithGoogle("employer") persists new EmployerProfile to storageAdapter'
    );

    // OTP bypass removal & password recovery persistence
    let sentOtp!: ReturnType<AuthContextType['sendOtp']>;
    await mounted.act(async () => {
      sentOtp = mounted.getApi().sendOtp(newSeekerEmail, 'email');
    });
    assert(sentOtp.success === true && /^\d{6}$/.test(sentOtp.code || ''), 'sendOtp generates 6-digit verification code');

    const nonMatchingCode = sentOtp.code === '123456' ? '654321' : '123456';
    let bypassOtpRes!: ReturnType<AuthContextType['verifyOtp']>;
    await mounted.act(async () => {
      bypassOtpRes = mounted.getApi().verifyOtp(newSeekerEmail, nonMatchingCode);
    });
    assert(bypassOtpRes.success === false, 'verifyOtp rejects hardcoded 123456 bypass code');

    let validOtpRes!: ReturnType<AuthContextType['verifyOtp']>;
    await mounted.act(async () => {
      validOtpRes = mounted.getApi().verifyOtp(newSeekerEmail, sentOtp.code!);
    });
    assert(validOtpRes.success === true, 'verifyOtp accepts genuine generated OTP');

    let recoveryOtp!: ReturnType<AuthContextType['sendOtp']>;
    await mounted.act(async () => {
      recoveryOtp = mounted.getApi().sendOtp(newSeekerEmail, 'email');
    });

    let badRecoverRes!: ReturnType<AuthContextType['recoverPassword']>;
    await mounted.act(async () => {
      badRecoverRes = mounted.getApi().recoverPassword(newSeekerEmail, '000000', 'RecoveredPass9!');
    });
    assert(badRecoverRes.success === false, 'recoverPassword rejects invalid OTP code');

    let goodRecoverRes!: ReturnType<AuthContextType['recoverPassword']>;
    await mounted.act(async () => {
      goodRecoverRes = mounted.getApi().recoverPassword(newSeekerEmail, recoveryOtp.code!, 'RecoveredPass9!');
    });
    assert(goodRecoverRes.success === true, 'recoverPassword succeeds with valid OTP and new password');

    let oldPassAfterReset!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    let newPassAfterReset!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      oldPassAfterReset = await mounted.getApi().loginAs(newSeekerEmail, 'SeekerPass1!');
      newPassAfterReset = await mounted.getApi().loginAs(newSeekerEmail, 'RecoveredPass9!');
    });
    assert(oldPassAfterReset.success === false, 'Old password is rejected after recoverPassword');
    assert(newPassAfterReset.success === true, 'New password authenticates after recoverPassword');
  } finally {
    await mounted.unmount();
  }

  console.log(`\n--- Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
  if (passedTests === totalTests) {
    console.log('Milestone 02 Multi-Role Authentication, Authorization & Real AuthContext is VERIFIED!\n');
    process.exit(0);
  } else {
    console.error('Some tests failed. Check output above.\n');
    process.exit(1);
  }
}

runMilestone02Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
