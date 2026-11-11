import React from 'react';
import { Home, Search, Building2, HelpCircle } from 'lucide-react';

export interface GuestNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const GuestNav: React.FC<GuestNavProps> = ({ currentView, onNavigate }) => {
  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate('landing')}
        className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'landing'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Home"
      >
        <Home
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'landing'
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
        title="Find Jobs"
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
        onClick={() => onNavigate('employers')}
        className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'employers'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Employers"
      >
        <Building2
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'employers'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Employers</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onNavigate('landing');
          setTimeout(() => {
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        className="h-full flex flex-col items-center justify-center px-3 border-b-2 border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule)] transition-colors text-xs font-medium cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85"
      >
        <HelpCircle
          className="w-4 h-4 mb-0.5 text-[var(--color-muted)] group-hover:text-[var(--color-ink)]"
          aria-hidden="true"
        />
        <span>How it works</span>
      </button>
    </>
  );
};
