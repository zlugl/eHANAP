import React from 'react';
import { Home, Search, FileCheck2, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface SeekerNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isSeekerIncomplete?: boolean;
}

export const SeekerNav: React.FC<SeekerNavProps> = ({
  currentView,
  onNavigate,
  isSeekerIncomplete = false
}) => {
  const { currentSeekerProfile, interviews } = useApp();

  if (isSeekerIncomplete) return null;

  const upcomingCount = interviews.filter(
    i =>
      (i.jobSeekerId === currentSeekerProfile?.id || i.seekerId === currentSeekerProfile?.id) &&
      (i.status === 'scheduled' || i.status === 'rescheduled' || i.status === 'accepted')
  ).length;

  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate('seeker-dashboard')}
        className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'seeker-dashboard'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Home"
      >
        <Home
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'seeker-dashboard'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('jobs')}
        className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'jobs'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Search Jobs"
      >
        <Search
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'jobs'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Vacancies</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('seeker-applications')}
        className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'seeker-applications'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Applications"
      >
        <FileCheck2
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'seeker-applications'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Applications</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('seeker-interviews')}
        className={`relative h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'seeker-interviews'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Built-In Calendar & Interviews"
      >
        <div className="relative flex items-center justify-center">
          <Calendar
            className={`w-4 h-4 mb-0.5 ${
              currentView === 'seeker-interviews'
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
            }`}
            aria-hidden="true"
          />
          {upcomingCount > 0 && (
            <span className=" -top-1.5 -right-3 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight ml-1">
              {upcomingCount}
            </span>
          )}
        </div>
        <span>Calendar</span>
      </button>
    </>
  );
};
