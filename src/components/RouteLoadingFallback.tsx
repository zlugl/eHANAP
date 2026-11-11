import React from 'react';
import { Loader2 } from 'lucide-react';

export interface RouteLoadingFallbackProps {
  label?: string;
  sublabel?: string;
}

export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  label = 'Loading view...',
  sublabel = 'Connecting Roxas opportunities'
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-12"
    >
      <div className="w-full max-w-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-[var(--color-rule)] rounded-md" />
            <div className="h-3 w-32 bg-[var(--color-rule)]/60 rounded-md" />
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          </div>
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] space-y-2">
            <div className="h-3 w-16 bg-[var(--color-rule)]/60 rounded" />
            <div className="h-6 w-20 bg-[var(--color-rule)] rounded" />
          </div>
          <div className="p-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] space-y-2">
            <div className="h-3 w-20 bg-[var(--color-rule)]/60 rounded" />
            <div className="h-6 w-16 bg-[var(--color-rule)] rounded" />
          </div>
          <div className="p-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] space-y-2">
            <div className="h-3 w-24 bg-[var(--color-rule)]/60 rounded" />
            <div className="h-6 w-24 bg-[var(--color-rule)] rounded" />
          </div>
        </div>

        {/* Content Rows Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-12 w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg" />
          <div className="h-12 w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg" />
          <div className="h-12 w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg" />
        </div>

        {/* Status text for screen readers and reassuring visual hint */}
        <div className="text-center pt-2">
          <p className="text-xs font-semibold text-[var(--color-ink)] tracking-wide">
            {label}
          </p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
            {sublabel}
          </p>
          <span className="sr-only">Please wait while the page modules are loaded.</span>
        </div>
      </div>
    </div>
  );
};
