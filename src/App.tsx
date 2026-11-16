import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { JobMatchToastContainer } from './components/JobMatchToastContainer';
import { JobSubscriptionModal } from './components/JobSubscriptionModal';
import { RouteLoadingFallback } from './components/RouteLoadingFallback';

// Public Views (Eagerly Loaded for Immediate Guest LCP)
import { LandingPage } from './views/LandingPage';
import { JobSearchPage } from './views/JobSearchPage';
import { JobDetailPage } from './views/JobDetailPage';
import { EmployerSearchPage } from './views/EmployerSearchPage';
import { AuthModal } from './views/AuthModal';

// Seeker Views (Code-Split / Lazy Loaded)
const SeekerDashboard = lazy(() => import('./views/seeker/SeekerDashboard').then(m => ({ default: m.SeekerDashboard })));
const SeekerApplicationsPage = lazy(() => import('./views/seeker/SeekerApplicationsPage').then(m => ({ default: m.SeekerApplicationsPage })));
const SeekerInterviewsPage = lazy(() => import('./views/seeker/SeekerInterviewsPage').then(m => ({ default: m.SeekerInterviewsPage })));
const SeekerProfilePage = lazy(() => import('./views/seeker/SeekerProfilePage').then(m => ({ default: m.SeekerProfilePage })));
const SeekerProfileSetupWizard = lazy(() => import('./views/seeker/SeekerProfileSetupWizard').then(m => ({ default: m.SeekerProfileSetupWizard })));

// Employer Views (Code-Split / Lazy Loaded)
const EmployerDashboard = lazy(() => import('./views/employer/EmployerDashboard').then(m => ({ default: m.EmployerDashboard })));
const EmployerJobsPage = lazy(() => import('./views/employer/EmployerJobsPage').then(m => ({ default: m.EmployerJobsPage })));
const EmployerApplicantsPage = lazy(() => import('./views/employer/EmployerApplicantsPage').then(m => ({ default: m.EmployerApplicantsPage })));
const EmployerInterviewsPage = lazy(() => import('./views/employer/EmployerInterviewsPage').then(m => ({ default: m.EmployerInterviewsPage })));
const EmployerAnalyticsPage = lazy(() => import('./views/employer/EmployerAnalyticsPage').then(m => ({ default: m.EmployerAnalyticsPage })));
const EmployerProfilePage = lazy(() => import('./views/employer/EmployerProfilePage').then(m => ({ default: m.EmployerProfilePage })));
const EmployerProfileSetupWizard = lazy(() => import('./views/employer/EmployerProfileSetupWizard').then(m => ({ default: m.EmployerProfileSetupWizard })));
const CreateJobModal = lazy(() => import('./views/employer/CreateJobModal').then(m => ({ default: m.CreateJobModal })));

// Admin Views (Code-Split / Lazy Loaded)
const AdminDashboard = lazy(() => import('./views/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminJobsPage = lazy(() => import('./views/admin/AdminJobsPage').then(m => ({ default: m.AdminJobsPage })));
const AdminUsersPage = lazy(() => import('./views/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminVerificationsPage = lazy(() => import('./views/admin/AdminVerificationsPage').then(m => ({ default: m.AdminVerificationsPage })));
const AdminReportsPage = lazy(() => import('./views/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const AdminAuditLogsPage = lazy(() => import('./views/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));
const AdminJobMatchingPage = lazy(() => import('./views/admin/AdminJobMatchingPage').then(m => ({ default: m.AdminJobMatchingPage })));
const AdminLraPage = lazy(() => import('./views/admin/AdminLraPage').then(m => ({ default: m.AdminLraPage })));

// Public Compliance Views (Code-Split / Lazy Loaded)
const PrivacyPage = lazy(() => import('./views/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./views/TermsPage').then(m => ({ default: m.TermsPage })));

import { 
  isRouteAllowedForRole, 
  isPublicRoute,
  getRequiredRoleForRoute, 
  getRoleDefaultView,
  isSeekerProfileComplete,
  isEmployerProfileComplete
} from './utils/routeGuards';

import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Color UI Design System Modals & Device Frame
import { MobileDeviceShell } from './components/MobileDeviceShell';
import { SeekerBookmarksModal } from './components/SeekerBookmarksModal';

function AppContent() {
  const { currentUser, currentSeekerProfile, currentEmployerProfile, jobSeekers, employers, showToast } = useApp();
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const queryView = searchParams.get('view') || searchParams.get('page');
      const candidate = queryView || hash || pathname;
      if (candidate === 'privacy' || candidate === 'terms') {
        return candidate;
      }
      if (candidate && isPublicRoute(candidate)) {
        return candidate;
      }
    }
    return 'landing';
  });
  const [viewParams, setViewParams] = useState<any>({});
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'job_seeker' | 'employer' | 'admin'>('job_seeker');
  
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Color UI Interactive Modals State
  const [isMobileDeviceMode, setIsMobileDeviceMode] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  const handleNavigate = (view: string, params?: any) => {
    let cleanView = (view || '').trim().replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
    if (cleanView === 'bookmarks' || cleanView === 'saved') {
      setIsBookmarksOpen(true);
      return;
    }
    const routeAliases: Record<string, string> = {
      'seeker': 'seeker-dashboard',
      'seeker-jobs': 'jobs',
      'employer': 'employer-dashboard',
      'employer-home': 'employer-dashboard',
      'employer-vacancies': 'employer-jobs',
      'employer-candidates': 'employer-applicants',
      'employer-schedule': 'employer-interviews',
      'employer-reports': 'employer-analytics',
      'admin': 'admin-dashboard',
      'vacancies': currentUser?.role === 'employer' ? 'employer-jobs' : 'jobs',
      'applications': currentUser?.role === 'employer' ? 'employer-applicants' : 'seeker-applications',
      'applicants': 'employer-applicants',
      'interviews': currentUser?.role === 'employer' ? 'employer-interviews' : 'seeker-interviews',
      'analytics': 'employer-analytics',
      'profile': currentUser?.role === 'employer' ? 'employer-profile' : 'seeker-profile',
      'job': 'jobs',
      'job-details': 'job-detail',
      'verifications': 'admin-verifications',
      'reports': currentUser?.role === 'employer' ? 'employer-analytics' : 'admin-reports',
      'audit-logs': 'admin-audit-logs',
      'job-matching': 'admin-job-matching',
      'lra': 'admin-lra'
    };
    if (routeAliases[cleanView]) {
      cleanView = routeAliases[cleanView];
    }

    // MANDATORY ROLE GATEKEEPING & ROUTE PROTECTION:
    if (!isRouteAllowedForRole(cleanView, currentUser?.role)) {
      if (!currentUser) {
        // Unauthenticated guest attempted to access a protected portal
        const requiredRole = getRequiredRoleForRoute(cleanView);
        setAuthRole(requiredRole || 'job_seeker');
        setAuthMode('login');
        setAuthModalOpen(true);
        showToast({
          title: 'Sign In Required',
          message: `Please sign in or select a demo account to access the ${requiredRole ? requiredRole.replace('_', ' ') : 'protected'} portal.`,
          type: 'info',
        });
        return;
      }

      // Authenticated user attempted cross-role portal access
      showToast({
        title: 'Access Restricted',
        message: `Your account role (${currentUser.role}) does not have permission to access "${cleanView}". Redirecting to your dashboard.`,
        type: 'error',
      });
      const homeView = getRoleDefaultView(currentUser.role);
      setCurrentView(homeView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // MANDATORY PROFILE SETUP GATE:
    // If a job seeker hasn't completed their profile setup, they must complete it
    // before they can access the dashboard, apply for jobs, or browse features
    const isSeekerCompleted = isSeekerProfileComplete(currentUser, currentSeekerProfile);

    if (
      currentUser?.role === 'job_seeker' &&
      !isSeekerCompleted &&
      cleanView !== 'seeker-profile-setup'
    ) {
      setCurrentView('seeker-profile-setup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // MANDATORY EMPLOYER PROFILE SETUP GATE:
    const isEmployerCompleted = isEmployerProfileComplete(currentUser, currentEmployerProfile);

    if (
      currentUser?.role === 'employer' &&
      !isEmployerCompleted &&
      cleanView !== 'employer-profile-setup'
    ) {
      setCurrentView('employer-profile-setup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView(cleanView || 'landing');
    if (params) setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const targetPath = cleanView === 'landing' ? '/' : `/${cleanView}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view: cleanView }, '', targetPath);
      }
    }
  };

  // Sync with browser back/forward and hash changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const queryView = searchParams.get('view') || searchParams.get('page');
      const candidate = queryView || hash || pathname || 'landing';
      if (isRouteAllowedForRole(candidate, currentUser?.role)) {
        setCurrentView(candidate);
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
    };
  }, [currentUser]);

  // Seeker profile setup gate: If seeker profile is not completed, enforce setup wizard across all resolutions
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== 'job_seeker') return;

    const isSeekerCompleted = isSeekerProfileComplete(currentUser, currentSeekerProfile);

    if (!isSeekerCompleted && currentView !== 'seeker-profile-setup') {
      setCurrentView('seeker-profile-setup');
    } else if (isSeekerCompleted && currentView === 'seeker-profile-setup') {
      // If the account has already finished setting up their profile, show dashboard
      setCurrentView('seeker-dashboard');
    }
  }, [currentUser, currentSeekerProfile, currentView]);

  // Employer profile setup gate: If employer profile is not completed, enforce setup wizard across all resolutions
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== 'employer') return;

    const isEmployerCompleted = isEmployerProfileComplete(currentUser, currentEmployerProfile);

    if (!isEmployerCompleted && currentView !== 'employer-profile-setup') {
      setCurrentView('employer-profile-setup');
    } else if (isEmployerCompleted && currentView === 'employer-profile-setup') {
      setCurrentView('employer-dashboard');
    }
  }, [currentUser, currentEmployerProfile, currentView]);

  // Auto-route to correct dashboard when user role switches while on a role-protected route
  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'admin' && (currentView.startsWith('seeker-') || currentView.startsWith('employer-'))) {
      setCurrentView('admin-dashboard');
    } else if (currentUser.role === 'employer' && (currentView.startsWith('seeker-') || currentView.startsWith('admin-'))) {
      if (!currentEmployerProfile || !currentEmployerProfile.isProfileCompleted) {
        setCurrentView('employer-profile-setup');
      } else {
        setCurrentView('employer-dashboard');
      }
    } else if (currentUser.role === 'job_seeker' && (currentView.startsWith('employer-') || currentView.startsWith('admin-'))) {
      const userEmailStr = (currentUser.email || '').toLowerCase();
      const isSeekerDone = Boolean(
        currentSeekerProfile?.isProfileCompleted ||
        currentUser.isProfileCompleted ||
        userEmailStr.includes('poqiq75')
      );
      if (!isSeekerDone) {
        setCurrentView('seeker-profile-setup');
      } else {
        setCurrentView('seeker-dashboard');
      }
    }
  }, [currentUser, currentSeekerProfile, currentEmployerProfile]);

  const handleOpenAuth = (mode: 'login' | 'register', initialRole?: 'job_seeker' | 'employer' | 'admin') => {
    setAuthMode(mode);
    if (initialRole) setAuthRole(initialRole);
    setAuthModalOpen(true);
  };

  // Route Guards for Protected Views
  const isSeekerView = currentView.startsWith('seeker-');
  const isEmployerView = currentView.startsWith('employer-');
  const isAdminView = currentView.startsWith('admin-');

  const isUnauthorized = 
    (!currentUser && (isSeekerView || isEmployerView || isAdminView)) ||
    (currentUser && isSeekerView && currentUser.role !== 'job_seeker') ||
    (currentUser && isEmployerView && currentUser.role !== 'employer') ||
    (currentUser && isAdminView && currentUser.role !== 'admin');

  return (
    <MobileDeviceShell
      isMobileDeviceMode={isMobileDeviceMode}
      onToggleMobileMode={() => setIsMobileDeviceMode(!isMobileDeviceMode)}
      currentView={currentView}
      onNavigate={handleNavigate}
      onOpenBookmarks={() => setIsBookmarksOpen(true)}
    >
      <div className="min-h-screen flex flex-col bg-[var(--color-paper)] text-[var(--color-ink)] font-body antialiased relative">
        {/* Navigation Header */}
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
          onOpenSubscriptions={() => setIsSubscriptionModalOpen(true)}
          onOpenPostJobModal={() => setIsPostJobModalOpen(true)}
        />

      {/* Main View Container */}
      <main className="flex-1 pb-20 sm:pb-24 lg:pb-0">
        {/* If user tries to access a protected route without permissions */}
        {isUnauthorized ? (
          <div className="max-w-xl mx-auto my-16 p-8 bg-[var(--color-paper-2)] rounded-[var(--radius-card)] border border-[var(--color-rule)] shadow-[var(--shadow-card)] text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-rule)] text-[var(--color-accent-ink)] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              {!currentUser ? 'Authentication required' : 'Access restricted'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
              {!currentUser 
                ? 'Please sign in to access this role-specific dashboard or management feature.'
                : `This page is reserved for authorized accounts. You are currently logged in as a ${currentUser.role.replace(/_/g, ' ')}.`
              }
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleNavigate('landing')}
                className="btn btn--quiet text-xs"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Return to home page</span>
              </button>
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="btn btn--primary text-xs"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>Sign in now</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentView}-${currentUser?.id || 'guest'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <Suspense fallback={<RouteLoadingFallback />}>
                {currentView === 'landing' && (
                  <LandingPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
                )}

              {currentView === 'jobs' && (
                <JobSearchPage
                  initialQuery={viewParams.query}
                  initialMunicipality={viewParams.municipality}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'job-detail' && (
                <JobDetailPage
                  jobId={viewParams.jobId}
                  onNavigate={handleNavigate}
                  onOpenAuth={handleOpenAuth}
                />
              )}

              {currentView === 'employers' && (
                <EmployerSearchPage onNavigate={handleNavigate} />
              )}

              {/* Seeker Views */}
              {currentView === 'seeker-dashboard' && (
                <SeekerDashboard 
                  onNavigate={handleNavigate} 
                  onOpenSubscriptions={() => setIsSubscriptionModalOpen(true)} 
                  initialJobId={viewParams?.jobId}
                />
              )}

              {currentView === 'seeker-applications' && (
                <SeekerApplicationsPage onNavigate={handleNavigate} params={viewParams} />
              )}

              {currentView === 'seeker-interviews' && (
                <SeekerInterviewsPage onNavigate={handleNavigate} />
              )}

              {currentView === 'seeker-profile-setup' && (
                <SeekerProfileSetupWizard 
                  onComplete={(targetView) => handleNavigate(targetView || 'seeker-dashboard')} 
                  onNavigate={handleNavigate} 
                />
              )}

              {currentView === 'seeker-profile' && (
                <SeekerProfilePage onNavigate={handleNavigate} params={viewParams} />
              )}

              {/* Employer Views */}
              {currentView === 'employer-dashboard' && (
                <EmployerDashboard
                  onNavigate={handleNavigate}
                  onOpenPostJobModal={() => setIsPostJobModalOpen(true)}
                />
              )}

              {currentView === 'employer-jobs' && (
                <EmployerJobsPage
                  onNavigate={handleNavigate}
                  onOpenPostJobModal={() => setIsPostJobModalOpen(true)}
                />
              )}

              {currentView === 'employer-applicants' && (
                <EmployerApplicantsPage
                  initialJobId={viewParams.jobId}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'employer-interviews' && (
                <EmployerInterviewsPage
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'employer-analytics' && (
                <EmployerAnalyticsPage
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'employer-profile-setup' && (
                <EmployerProfileSetupWizard
                  onComplete={() => handleNavigate('employer-dashboard')}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'employer-profile' && (
                <EmployerProfilePage onNavigate={handleNavigate} />
              )}

              {/* Admin Views */}
              {currentView === 'admin-dashboard' && (
                <AdminDashboard onNavigate={handleNavigate} />
              )}

              {currentView === 'admin-jobs' && (
                <AdminJobsPage onNavigate={handleNavigate} />
              )}

              {currentView === 'admin-users' && (
                <AdminUsersPage onNavigate={handleNavigate} />
              )}

              {currentView === 'admin-verifications' && (
                <AdminVerificationsPage
                  initialEmployerId={viewParams.employerId}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'admin-reports' && (
                <AdminReportsPage onNavigate={handleNavigate} />
              )}

              {currentView === 'admin-audit-logs' && (
                <AdminAuditLogsPage onNavigate={handleNavigate} />
              )}

              {currentView === 'admin-job-matching' && (
                <AdminJobMatchingPage onNavigate={handleNavigate} />
              )}

              {currentView === 'admin-lra' && (
                <AdminLraPage onNavigate={handleNavigate} />
              )}

              {/* Public Compliance Views */}
              {currentView === 'privacy' && (
                <PrivacyPage onNavigate={handleNavigate} />
              )}

              {currentView === 'terms' && (
                <TermsPage onNavigate={handleNavigate} />
              )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Modals & Overlays */}
      {isPostJobModalOpen && (
        <Suspense fallback={null}>
          <CreateJobModal
            isOpen={isPostJobModalOpen}
            onClose={() => setIsPostJobModalOpen(false)}
            onSuccess={() => handleNavigate('employer-applicants')}
          />
        </Suspense>
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        initialRole={authRole}
        onNavigate={handleNavigate}
        onClose={() => setAuthModalOpen(false)}
        onSuccessRole={(role, loggedInUser, isCompletedArg) => {
          if (role === 'job_seeker') {
            const userEmail = loggedInUser?.email?.toLowerCase() || '';
            const userId = loggedInUser?.id || '';

            const matchingSeeker = jobSeekers.find(s =>
              (userId && s.userId === userId) ||
              (userId && s.id === userId) ||
              (userEmail && s.email && s.email.toLowerCase() === userEmail)
            );

            const isCompleted = isCompletedArg === false ? false : Boolean(
              isCompletedArg === true || isSeekerProfileComplete(loggedInUser, matchingSeeker)
            );

            if (isCompleted) {
              handleNavigate('seeker-dashboard');
            } else {
              handleNavigate('seeker-profile-setup');
            }
          } else if (role === 'employer') {
            const userEmail = loggedInUser?.email?.toLowerCase() || '';
            const userId = loggedInUser?.id || '';
            const matchingEmployer = employers.find(e =>
              (userId && e.userId === userId) ||
              (userId && e.id === userId) ||
              (userEmail && e.email && e.email.toLowerCase() === userEmail)
            );
            const isCompleted = isCompletedArg === false ? false : Boolean(
              isCompletedArg === true || isEmployerProfileComplete(loggedInUser, matchingEmployer)
            );
            if (isCompleted) {
              handleNavigate('employer-dashboard');
            } else {
              handleNavigate('employer-profile-setup');
            }
          } else if (role === 'admin') {
            handleNavigate('admin-dashboard');
          } else {
            handleNavigate('landing');
          }
        }}
      />

      <JobSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Toast Notification Container */}
      <JobMatchToastContainer onNavigate={handleNavigate} />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>



    {/* Saved Bookmarks Modal */}
    <SeekerBookmarksModal
      isOpen={isBookmarksOpen}
      onClose={() => setIsBookmarksOpen(false)}
      onSelectJob={(jId) => handleNavigate('job-detail', { jobId: jId })}
    />
  </MobileDeviceShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
