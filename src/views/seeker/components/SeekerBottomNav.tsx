import React from 'react';
import { Home, Compass, Bookmark, Briefcase, User } from 'lucide-react';

export interface SeekerBottomNavProps {
  onNavigate?: (view: string) => void;
  onScrollToTop?: () => void;
}

export const SeekerBottomNav: React.FC<SeekerBottomNavProps> = ({
  onNavigate,
  onScrollToTop
}) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl z-30 py-2 px-4 max-w-md sm:max-w-lg mx-auto rounded-t-3xl">
      <div className="grid grid-cols-5 items-center justify-items-center text-center">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onNavigate?.('seeker-dashboard')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 cursor-pointer group text-slate-400 hover:text-slate-700"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* 2. Explore */}
        <button
          type="button"
          onClick={() => onNavigate?.('jobs')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 cursor-pointer group text-slate-400 hover:text-slate-700"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </button>

        {/* 3. Bookmark */}
        <button
          type="button"
          onClick={() => onNavigate?.('seeker-dashboard')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 cursor-pointer group text-slate-400 hover:text-slate-700"
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] font-medium">Bookmark</span>
        </button>

        {/* 4. Applications */}
        <button
          type="button"
          onClick={() => onNavigate?.('seeker-applications')}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 cursor-pointer group text-slate-400 hover:text-slate-700"
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-medium">Applied</span>
        </button>

        {/* 5. Profile (Active) */}
        <button
          type="button"
          onClick={() => {
            if (onScrollToTop) {
              onScrollToTop();
            } else if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 cursor-pointer text-slate-900 group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mb-0.5" />
          <User className="w-5 h-5 text-slate-900" />
          <span className="text-[10px] font-bold text-slate-900">Profile</span>
        </button>
      </div>
    </div>
  );
};
