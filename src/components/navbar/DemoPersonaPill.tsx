import React from 'react';

export interface DemoPersonaPillProps {
  currentRole?: string;
  onSwitchRole: (role: 'job_seeker' | 'employer' | 'admin') => void;
  className?: string;
}

export const DemoPersonaPill: React.FC<DemoPersonaPillProps> = ({
  currentRole,
  onSwitchRole,
  className = 'hidden lg:flex'
}) => {
  return (
    <div
      className={`${className} items-center gap-1 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-full px-2 py-1 text-xs`}
      aria-label="Quick Demo Persona Switcher"
    >
      <span className="text-[10px] font-semibold text-[var(--color-muted)] px-1 uppercase tracking-wider">
        Demo:
      </span>
      <button
        type="button"
        onClick={() => onSwitchRole('job_seeker')}
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
          currentRole === 'job_seeker'
            ? 'bg-blue-600 text-white shadow-xs font-semibold'
            : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
        }`}
        title="1-Click switch to Job Seeker (Juan Dela Cruz)"
      >
        Seeker
      </button>
      <button
        type="button"
        onClick={() => onSwitchRole('employer')}
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
          currentRole === 'employer'
            ? 'bg-emerald-600 text-white shadow-xs font-semibold'
            : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
        }`}
        title="1-Click switch to Roxas Employer (Puregold Price Club)"
      >
        Employer
      </button>
      <button
        type="button"
        onClick={() => onSwitchRole('admin')}
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
          currentRole === 'admin'
            ? 'bg-amber-600 text-white shadow-xs font-semibold'
            : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
        }`}
        title="1-Click switch to Municipal PESO Admin"
      >
        PESO
      </button>
    </div>
  );
};
