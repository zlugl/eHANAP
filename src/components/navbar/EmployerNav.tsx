import React from 'react';
import { Home, Briefcase, Users, Calendar, BarChart3, Building2, PlusCircle } from 'lucide-react';

export interface EmployerNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isEmployerIncomplete?: boolean;
  onOpenPostJobModal?: () => void;
}

export const EmployerNav: React.FC<EmployerNavProps> = ({
  currentView,
  onNavigate,
  isEmployerIncomplete = false,
  onOpenPostJobModal
}) => {
  if (isEmployerIncomplete) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate('employer-dashboard')}
        className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employer-dashboard'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Employer Home"
      >
        <Home
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employer-dashboard'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('employer-jobs')}
        className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employer-jobs'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Job Vacancies"
      >
        <Briefcase
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employer-jobs'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Vacancies</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('employer-applicants')}
        className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employer-applicants'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Candidates & Ranking"
      >
        <Users
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employer-applicants'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Candidates</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('employer-interviews')}
        className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employer-interviews'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Interview Schedule"
      >
        <Calendar
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employer-interviews'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Interviews</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('employer-analytics')}
        className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employer-analytics'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Recruitment Analytics"
      >
        <BarChart3
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employer-analytics'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Analytics</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('employer-profile')}
        className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employer-profile'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Company Profile"
      >
        <Building2
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employer-profile'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Profile</span>
      </button>

      {onOpenPostJobModal && (
        <div className="flex items-center pl-1.5">
          <button
            type="button"
            onClick={onOpenPostJobModal}
            className="btn btn--primary text-xs min-h-[36px] py-1.5 px-3"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Post vacancy</span>
          </button>
        </div>
      )}
    </>
  );
};
