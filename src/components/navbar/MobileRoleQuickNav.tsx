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
  FileSpreadsheet,
  LogIn
} from 'lucide-react';

export interface MobileRoleQuickNavProps {
  currentView: string;
  currentUser: any;
  isSeekerIncomplete: boolean;
  isEmployerIncomplete: boolean;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const MobileRoleQuickNav: React.FC<MobileRoleQuickNavProps> = ({
  currentView,
  currentUser,
  isSeekerIncomplete,
  isEmployerIncomplete,
  onNavigate,
  onOpenAuth
}) => {
  // Do not render bottom tab bar on setup wizards or detail views that have their own floating action bars
  if (
    isSeekerIncomplete ||
    isEmployerIncomplete ||
    currentView === 'seeker-profile-setup' ||
    currentView === 'employer-profile-setup' ||
    currentView === 'job-detail'
  ) {
    return null;
  }

  const renderTabButton = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onClick: () => void
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`min-h-[48px] py-1 px-1 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
        isActive
          ? 'text-[var(--color-ink)] font-bold'
          : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] font-medium'
      }`}
    >
      <div className={`transition-transform ${isActive ? 'scale-110 text-[var(--color-accent)]' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] leading-tight tracking-tight mt-0.5">{label}</span>
      {isActive && (
        <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] mt-0.5 motion-safe:animate-pulse" />
      )}
    </button>
  );

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-paper-2)]/95 backdrop-blur-md border-t border-[var(--color-rule)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[max(0.35rem,env(safe-area-inset-bottom))] select-none"
    >
      <div className="max-w-md sm:max-w-xl mx-auto px-2 pt-1">
        {/* 1. GUEST NAVIGATION */}
        {!currentUser && (
          <div className="grid grid-cols-4 items-center">
            {renderTabButton(
              'Home',
              <Home className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'landing',
              () => onNavigate('landing')
            )}
            {renderTabButton(
              'Vacancies',
              <Search className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'jobs',
              () => onNavigate('jobs')
            )}
            {renderTabButton(
              'Employers',
              <Building2 className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'employers',
              () => onNavigate('employers')
            )}
            {renderTabButton(
              'Sign In',
              <LogIn className="w-4.5 h-4.5" aria-hidden="true" />,
              false,
              () => (onOpenAuth ? onOpenAuth('login') : onNavigate('landing'))
            )}
          </div>
        )}

        {/* 2. JOB SEEKER NAVIGATION */}
        {currentUser?.role === 'job_seeker' && (
          <div className="grid grid-cols-5 items-center">
            {renderTabButton(
              'Home',
              <Home className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'seeker-dashboard',
              () => onNavigate('seeker-dashboard')
            )}
            {renderTabButton(
              'Jobs',
              <Search className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'jobs',
              () => onNavigate('jobs')
            )}
            {renderTabButton(
              'Applications',
              <FileCheck2 className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'seeker-applications',
              () => onNavigate('seeker-applications')
            )}
            {renderTabButton(
              'Interviews',
              <Calendar className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'seeker-interviews',
              () => onNavigate('seeker-interviews')
            )}
            {renderTabButton(
              'Profile',
              <User className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'seeker-profile',
              () => onNavigate('seeker-profile')
            )}
          </div>
        )}

        {/* 3. EMPLOYER NAVIGATION */}
        {currentUser?.role === 'employer' && (
          <div className="grid grid-cols-5 items-center">
            {renderTabButton(
              'Home',
              <Home className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'employer-dashboard',
              () => onNavigate('employer-dashboard')
            )}
            {renderTabButton(
              'Vacancies',
              <Briefcase className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'employer-jobs',
              () => onNavigate('employer-jobs')
            )}
            {renderTabButton(
              'Candidates',
              <Users className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'employer-applicants',
              () => onNavigate('employer-applicants')
            )}
            {renderTabButton(
              'Interviews',
              <Calendar className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'employer-interviews',
              () => onNavigate('employer-interviews')
            )}
            {renderTabButton(
              'Company',
              <Building2 className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'employer-profile',
              () => onNavigate('employer-profile')
            )}
          </div>
        )}

        {/* 4. ADMIN NAVIGATION */}
        {currentUser?.role === 'admin' && (
          <div className="grid grid-cols-5 items-center">
            {renderTabButton(
              'Home',
              <Home className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'admin-dashboard',
              () => onNavigate('admin-dashboard')
            )}
            {renderTabButton(
              'Verify',
              <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'admin-verifications',
              () => onNavigate('admin-verifications')
            )}
            {renderTabButton(
              'Vacancies',
              <Briefcase className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'admin-jobs',
              () => onNavigate('admin-jobs')
            )}
            {renderTabButton(
              'Registry',
              <Users className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'admin-users',
              () => onNavigate('admin-users')
            )}
            {renderTabButton(
              'Reports',
              <FileSpreadsheet className="w-4.5 h-4.5" aria-hidden="true" />,
              currentView === 'admin-reports',
              () => onNavigate('admin-reports')
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
