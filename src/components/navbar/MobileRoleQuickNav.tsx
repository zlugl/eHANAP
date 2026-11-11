import React from 'react';
import {
  Home,
  Search,
  FileCheck2,
  Calendar,
  User,
  Briefcase,
  Users,
  Building2,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export interface MobileRoleQuickNavProps {
  currentView: string;
  currentUser: any;
  isSeekerIncomplete: boolean;
  isEmployerIncomplete: boolean;
  onNavigate: (view: string) => void;
}

export const MobileRoleQuickNav: React.FC<MobileRoleQuickNavProps> = ({
  currentView,
  currentUser,
  isSeekerIncomplete,
  isEmployerIncomplete,
  onNavigate
}) => {
  if (
    !currentUser ||
    isSeekerIncomplete ||
    isEmployerIncomplete ||
    currentView === 'seeker-profile-setup' ||
    currentView === 'employer-profile-setup'
  ) {
    return null;
  }

  return (
    <div
      aria-label="Mobile and Tablet Quick Navigation"
      className="lg:hidden w-full bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] select-none"
    >
      <div className="max-w-md sm:max-w-xl mx-auto px-2 sm:px-4 py-1.5">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
          {currentUser.role === 'job_seeker' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('seeker-dashboard')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'seeker-dashboard'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Home
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'seeker-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Home</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('jobs')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'jobs'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Search
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Jobs</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('seeker-applications')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'seeker-applications'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <FileCheck2
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'seeker-applications' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Applications</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('seeker-interviews')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'seeker-interviews'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Calendar
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'seeker-interviews' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Interviews</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('seeker-profile')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'seeker-profile'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <User
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'seeker-profile' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Profile</span>
              </button>
            </>
          )}

          {currentUser.role === 'employer' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('employer-dashboard')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'employer-dashboard'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Home
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'employer-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Home</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('employer-jobs')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'employer-jobs'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Briefcase
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'employer-jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Vacancies</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('employer-applicants')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'employer-applicants'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Users
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'employer-applicants' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Candidates</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('employer-interviews')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'employer-interviews'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Calendar
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'employer-interviews' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Interviews</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('employer-profile')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'employer-profile'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Building2
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'employer-profile' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Profile</span>
              </button>
            </>
          )}

          {currentUser.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('admin-dashboard')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'admin-dashboard'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Home
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'admin-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Home</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-verifications')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'admin-verifications'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <ShieldCheck
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'admin-verifications' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Verify</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-jobs')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'admin-jobs'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Briefcase
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'admin-jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Vacancies</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-users')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'admin-users'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <Users
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'admin-users' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Registry</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-reports')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                  currentView === 'admin-reports'
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                }`}
              >
                <FileSpreadsheet
                  className={`w-4 h-4 mb-0.5 ${
                    currentView === 'admin-reports' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] leading-tight">Reports</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
