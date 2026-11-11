import React from 'react';
import { Home, ShieldCheck, Briefcase, Users, FileSpreadsheet, Clock } from 'lucide-react';

export interface AdminNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const AdminNav: React.FC<AdminNavProps> = ({ currentView, onNavigate }) => {
  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate('admin-dashboard')}
        className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'admin-dashboard'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Admin Home"
      >
        <Home
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'admin-dashboard'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('admin-verifications')}
        className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'admin-verifications'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Verify Employers"
      >
        <ShieldCheck
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'admin-verifications'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Verify</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('admin-jobs')}
        className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'admin-jobs'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Monitor Jobs"
      >
        <Briefcase
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'admin-jobs'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Vacancies</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('admin-users')}
        className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'admin-users'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="User Registry"
      >
        <Users
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'admin-users'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Registry</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('admin-reports')}
        className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'admin-reports'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Labor Reports"
      >
        <FileSpreadsheet
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'admin-reports'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Reports</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('admin-audit-logs')}
        className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
          currentView === 'admin-audit-logs'
            ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
            : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
        }`}
        title="Audit Logs"
      >
        <Clock
          className={`w-4 h-4 mb-0.5 ${
            currentView === 'admin-audit-logs'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
          }`}
          aria-hidden="true"
        />
        <span>Logs</span>
      </button>
    </>
  );
};
