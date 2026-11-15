import React from 'react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Sparkles,
  MapPin,
  Bookmark,
  Home,
  User,
  ChevronLeft,
  Search,
  FileText,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MobileDeviceShellProps {
  isMobileDeviceMode: boolean;
  onToggleMobileMode: () => void;
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenBookmarks?: () => void;
  children: React.ReactNode;
}

export const MobileDeviceShell: React.FC<MobileDeviceShellProps> = ({
  isMobileDeviceMode,
  onToggleMobileMode,
  currentView,
  onNavigate,
  onOpenBookmarks,
  children
}) => {
  const { currentUser } = useApp();

  return (
    <div className="relative min-h-screen">
      {isMobileDeviceMode ? (
        /* ================= MOBILE DEVICE SHELL CONTAINER ================= */
        <div className="min-h-screen bg-slate-900/95 py-6 px-2 sm:px-6 flex flex-col items-center justify-center">
          
          {/* Header indicator & exit button */}
          <div className="flex items-center gap-3 mb-4 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-semibold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Mobile Smartphone Preview • eHANAP PESO Roxas</span>
            </div>
            <button
              type="button"
              onClick={onToggleMobileMode}
              className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Return to full browser view"
            >
              Exit Mobile Frame
            </button>
          </div>

          {/* Realistic Smartphone Chassis Frame */}
          <div className="relative w-full max-w-[412px] bg-slate-950 rounded-[50px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-600/50">
            
            {/* Phone Outer Speaker & Camera Bezel Notch */}
            <div className="relative bg-slate-50 rounded-[40px] overflow-hidden flex flex-col h-[844px] shadow-inner">
              
              {/* iOS / Android Status Bar (Matching design) */}
              <div className="h-10 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between text-slate-900 text-xs font-bold shrink-0 z-30 select-none border-b border-slate-100/50">
                <span>9:41</span>
                
                {/* Dynamic Island / Speaker Pill */}
                <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-end pr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700">
                  <Signal className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-4 h-4" />
                </div>
              </div>

              {/* Scrollable Viewport Content */}
              <div className="flex-1 overflow-y-auto scrollbar-none relative pb-16">
                {children}
              </div>

              {/* Bottom Mobile Tab Bar (Strict 4 Primary Modules: Home, Search, Applications, Profile) */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 grid grid-cols-4 items-center justify-items-center z-30 shadow-lg">
                {/* 1. Home */}
                <button
                  onClick={() => onNavigate(
                    currentUser?.role === 'job_seeker' ? 'seeker-dashboard' :
                    currentUser?.role === 'employer' ? 'employer-dashboard' :
                    currentUser?.role === 'admin' ? 'admin-dashboard' : 'landing'
                  )}
                  className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    currentView === 'seeker-dashboard' || currentView === 'employer-dashboard' || currentView === 'admin-dashboard' || currentView === 'landing' 
                      ? 'text-blue-600 font-bold' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="text-[10px]">Home</span>
                </button>

                {/* 2. Search */}
                <button
                  onClick={() => onNavigate('jobs')}
                  className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    currentView === 'jobs' || currentView === 'job-detail' 
                      ? 'text-blue-600 font-bold' 
                      : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  <Search className="w-5 h-5" />
                  <span className="text-[10px]">Search</span>
                </button>

                {/* 3. Applications */}
                <button
                  onClick={() => onNavigate(
                    currentUser?.role === 'employer' ? 'employer-applicants' :
                    currentUser?.role === 'admin' ? 'admin-verifications' :
                    'seeker-applications'
                  )}
                  className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    currentView === 'seeker-applications' || currentView === 'employer-applicants' || currentView === 'admin-verifications' 
                      ? 'text-blue-600 font-bold' 
                      : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[10px]">
                    {currentUser?.role === 'employer' ? 'Candidates' : 'Applications'}
                  </span>
                </button>

                {/* 4. Profile */}
                <button
                  onClick={() => onNavigate(
                    currentUser?.role === 'employer' ? 'employer-profile' :
                    currentUser?.role === 'admin' ? 'admin-dashboard' :
                    'seeker-profile'
                  )}
                  className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    currentView === 'seeker-profile' || currentView === 'employer-profile' || currentView === 'admin-users' 
                      ? 'text-blue-600 font-bold' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[10px]">Profile</span>
                </button>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/30 rounded-full z-40 pointer-events-none"></div>
            </div>
          </div>
        </div>
      ) : (
        /* Normal Responsive Mode */
        <div>
          {children}
          {/* Desktop/Tablet Mobile Preview Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobileMode}
            className="hidden lg:inline-flex fixed bottom-5 right-5 z-40 items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-semibold shadow-xl border border-[var(--color-rule)] hover:opacity-90 transition-all cursor-pointer active:scale-95 group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
            title="Preview app inside smartphone chassis"
          >
            <Smartphone className="w-4 h-4 text-[var(--color-accent)] group-hover:scale-110 transition-transform" />
            <span>Mobile Device Frame</span>
          </button>
        </div>
      )}
    </div>
  );
};
