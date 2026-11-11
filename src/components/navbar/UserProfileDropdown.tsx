import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  ChevronDown,
  Building2,
  ShieldCheck,
  Settings,
  Bell,
  Home,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';

export interface UserProfileDropdownProps {
  currentUser: any;
  userDisplayName: string;
  jobPostsCount?: number;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onSwitchRole: (role: 'job_seeker' | 'employer' | 'admin') => void;
  onOpenSubscriptions?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  currentUser,
  userDisplayName,
  jobPostsCount = 0,
  onNavigate,
  onLogout,
  onSwitchRole,
  onOpenSubscriptions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (view?: string) => {
    setIsOpen(false);
    if (view) {
      onNavigate(view);
    }
  };

  const handleRoleSwitch = (role: 'job_seeker' | 'employer' | 'admin') => {
    setIsOpen(false);
    onSwitchRole(role);
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-md hover:bg-[var(--color-paper-3)] transition-colors border border-[var(--color-rule)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar}
            alt={userDisplayName || currentUser.name}
            className="w-7 h-7 rounded-sm object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-sm bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-muted)] font-medium text-xs">
            <User className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
        <div className="hidden sm:block text-left pr-1">
          <p className="text-xs font-medium text-[var(--color-ink)] line-clamp-1">{userDisplayName}</p>
          <p className="text-[10px] text-[var(--color-muted)] capitalize">
            {currentUser.role === 'admin' ? 'PESO/LGU Admin' : (currentUser?.role || '').replace(/_/g, ' ')}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted)]" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-56 bg-[var(--color-paper-2)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] border border-[var(--color-rule)] py-1 z-50">
          <div className="px-4 py-2.5 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
            <p className="text-xs font-semibold text-[var(--color-ink)]">{userDisplayName}</p>
            <p className="text-[11px] text-[var(--color-muted)]">{currentUser.email}</p>
            <span className="inline-block mt-1 text-[10px] font-medium bg-[var(--color-paper-3)] text-[var(--color-ink)] px-2 py-0.5 rounded-full border border-[var(--color-rule)]">
              {currentUser.role === 'admin' ? 'PESO/LGU Admin' : currentUser.role.replace(/_/g, ' ')}
            </span>
          </div>

          {currentUser.role === 'job_seeker' && (
            <>
              <button
                type="button"
                onClick={() => handleItemClick('seeker-profile')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <User className="w-4 h-4 text-[var(--color-green)]" aria-hidden="true" />
                <span>My profile & resume</span>
              </button>
              {onOpenSubscriptions && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSubscriptions();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                >
                  <Bell className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Job alert preferences</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleItemClick('seeker-profile')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-[var(--color-muted)]" aria-hidden="true" />
                <span>Settings</span>
              </button>
            </>
          )}

          {currentUser.role === 'employer' && (
            <>
              <button
                type="button"
                onClick={() => handleItemClick('employer-dashboard')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Dashboard overview</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick('employer-jobs')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Vacancies ({jobPostsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick('employer-applicants')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Candidates & ranking</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick('employer-interviews')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Interview calendar</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick('employer-analytics')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Recruitment analytics</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick('employer-profile')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Company profile</span>
              </button>
            </>
          )}

          {currentUser.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => handleItemClick('admin-dashboard')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>PESO admin center</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick('admin-reports')}
                className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Generate reports</span>
              </button>
            </>
          )}

          <div className="border-t border-[var(--color-rule)] my-1"></div>

          {/* Instant 1-Click Demo Persona Switcher */}
          <div className="px-4 py-1 text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">
            1-Click Demo Switcher
          </div>
          <button
            type="button"
            onClick={() => handleRoleSwitch('job_seeker')}
            className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between hover:bg-[var(--color-paper-3)] transition-colors ${
              currentUser.role === 'job_seeker' ? 'text-blue-700 font-semibold bg-blue-50/50' : 'text-[var(--color-ink)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Job Seeker (Juan)</span>
            </span>
            {currentUser.role === 'job_seeker' && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm font-semibold">Active</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('employer')}
            className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between hover:bg-[var(--color-paper-3)] transition-colors ${
              currentUser.role === 'employer' ? 'text-emerald-700 font-semibold bg-emerald-50/50' : 'text-[var(--color-ink)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Employer (Puregold)</span>
            </span>
            {currentUser.role === 'employer' && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold">Active</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between hover:bg-[var(--color-paper-3)] transition-colors ${
              currentUser.role === 'admin' ? 'text-amber-700 font-semibold bg-amber-50/50' : 'text-[var(--color-ink)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>PESO Admin (LGU)</span>
            </span>
            {currentUser.role === 'admin' && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-semibold">Active</span>
            )}
          </button>

          <div className="border-t border-[var(--color-rule)] my-1"></div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-2 text-xs text-[var(--color-error)] hover:bg-[var(--color-paper-3)] flex items-center gap-2 font-medium"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
};
