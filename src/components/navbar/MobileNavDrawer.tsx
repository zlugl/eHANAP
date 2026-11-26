import React from 'react';
import {
  Home,
  Search,
  Building2,
  LogIn,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Users,
  FileSpreadsheet,
  Clock,
  Calendar,
  BarChart3,
  PlusCircle,
  Lock,
  FileCheck2,
  User,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isEmployerVerifiedToPostJobs } from '../../utils/routeGuards';

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  currentUser: any;
  userDisplayName?: string;
  unreadNotifs?: number;
  isSeekerIncomplete: boolean;
  isEmployerIncomplete?: boolean;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onSwitchRole: (role: 'job_seeker' | 'employer' | 'admin') => void;
  onOpenAuth: (mode: 'login' | 'register', initialRole?: 'job_seeker' | 'employer') => void;
  onOpenSubscriptions?: () => void;
  onOpenPostJobModal?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  currentUser,
  userDisplayName,
  unreadNotifs = 0,
  isSeekerIncomplete,
  isEmployerIncomplete,
  onNavigate,
  onLogout,
  onSwitchRole,
  onOpenAuth,
  onOpenSubscriptions,
  onOpenPostJobModal
}) => {
  const { currentEmployerProfile } = useApp();
  if (!isOpen) return null;

  const canPostJobs = isEmployerVerifiedToPostJobs(currentEmployerProfile);

  const handleNav = (view: string) => {
    onClose();
    onNavigate(view);
  };

  const handleRoleSwitch = (role: 'job_seeker' | 'employer' | 'admin') => {
    onClose();
    onSwitchRole(role);
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <div
      className="lg:hidden fixed inset-0 top-16 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] px-4 pt-3 pb-6 space-y-3 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Detailed Navigation Item Rows with Icons */}
      <div className="space-y-1">
        {!currentUser ? (
          <>
            <button
              type="button"
              onClick={() => handleNav('landing')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                currentView === 'landing'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
              }`}
            >
              <Home
                className={`w-4 h-4 ${currentView === 'landing' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
                aria-hidden="true"
              />
              <span>Welcome overview</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('jobs')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                currentView === 'jobs'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
              }`}
            >
              <Search
                className={`w-4 h-4 ${currentView === 'jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
                aria-hidden="true"
              />
              <span>Find vacancies in Roxas</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('employers')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                currentView === 'employers'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
              }`}
            >
              <Building2
                className={`w-4 h-4 ${currentView === 'employers' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
                aria-hidden="true"
              />
              <span>Registered employers</span>
            </button>
            <div className="pt-2 border-t border-[var(--color-rule)] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="btn btn--quiet text-xs min-h-[40px] w-full"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Sign in</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('register');
                }}
                className="btn btn--primary text-xs min-h-[40px] w-full"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Register account</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {currentUser?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('admin-dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-dashboard'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Admin overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-verifications')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-verifications'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Verify employers</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-jobs')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-jobs'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Monitor job postings</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-job-matching')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-job-matching'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Decision tree matching</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-lra')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-lra'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Visiting companies (LRA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-users')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-users'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Users className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>User registry</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-reports')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-reports'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Labor reports</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('admin-audit-logs')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'admin-audit-logs'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>System audit logs</span>
                </button>
              </>
            )}

            {currentUser?.role === 'employer' && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('employer-dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employer-dashboard'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Employer overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('employer-jobs')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employer-jobs'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Job vacancies</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('employer-applicants')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employer-applicants'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Users className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Candidates & ranking</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('employer-interviews')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employer-interviews'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Calendar &amp; interviews</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('employer-analytics')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employer-analytics'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Recruitment analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('employer-profile')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employer-profile'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Company profile</span>
                </button>
                {onOpenPostJobModal && (
                  <button
                    type="button"
                    disabled={!canPostJobs}
                    onClick={() => {
                      if (!canPostJobs) return;
                      onClose();
                      onOpenPostJobModal();
                    }}
                    className="btn btn--primary text-xs min-h-[40px] w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {canPostJobs ? (
                      <PlusCircle className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>{canPostJobs ? 'Post vacancy' : 'Post vacancy (Verification Required)'}</span>
                  </button>
                )}
              </>
            )}

            {currentUser?.role === 'job_seeker' && (
              <>
                {isSeekerIncomplete ? (
                  <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-md space-y-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
                      <Lock className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                      <span>Candidate profile setup required</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-muted)] leading-normal">
                      Complete your profile and skills inventory first to access the dashboard and local job vacancies.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleNav('seeker-profile-setup')}
                      className="btn btn--primary text-xs min-h-[38px] w-full"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Start profile setup</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNav('seeker-dashboard')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'seeker-dashboard'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Seeker dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('jobs')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'jobs'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Search className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Search vacancies</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('seeker-applications')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'seeker-applications'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <FileCheck2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Applications</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('seeker-interviews')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'seeker-interviews'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Calendar &amp; interviews</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('seeker-profile')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'seeker-profile'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <User className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Profile & resume</span>
                    </button>
                  </>
                )}
              </>
            )}

            <div className="pt-2 border-t border-[var(--color-rule)]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 text-[var(--color-error)] hover:bg-[var(--color-paper-3)] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
  );
};
