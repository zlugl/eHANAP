import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationDrawer } from './NotificationDrawer';
import { getFilteredUserNotifications } from '../utils/notificationUtils';
import { isSeekerProfileComplete, isEmployerProfileComplete } from '../utils/routeGuards';
import {
  FileText,
  MapPin,
  Bell,
  Key,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import {
  GuestNav,
  SeekerNav,
  EmployerNav,
  AdminNav,
  DemoPersonaPill,
  UserProfileDropdown,
  MobileRoleQuickNav,
  MobileNavDrawer
} from './navbar/index';

export interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register', initialRole?: 'job_seeker' | 'employer') => void;
  onOpenSubscriptions?: () => void;
  onOpenPostJobModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenSubscriptions,
  onOpenPostJobModal
}) => {
  const {
    currentUser,
    logout,
    switchDemoRole,
    notifications,
    applications,
    interviews,
    referralSlips,
    isSupabaseConnected,
    isSyncing,
    jobPosts,
    currentEmployerProfile,
    currentSeekerProfile
  } = useApp();

  const isSeekerIncomplete = currentUser?.role === 'job_seeker' && !isSeekerProfileComplete(currentUser, currentSeekerProfile);
  const isEmployerIncomplete = currentUser?.role === 'employer' && !isEmployerProfileComplete(currentUser, currentEmployerProfile);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userNotifs = currentUser
    ? getFilteredUserNotifications(
        notifications,
        currentUser,
        currentSeekerProfile,
        applications,
        interviews,
        referralSlips
      )
    : [];
  const unreadNotifs = userNotifs.filter(n => !n.read).length;

  const handleNav = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    onNavigate('landing');
  };

  const handleQuickRoleSwitch = (role: 'job_seeker' | 'employer' | 'admin') => {
    const res = switchDemoRole(role);
    if (res.success && res.role) {
      setIsMobileMenuOpen(false);
      const targetView = res.role === 'admin' ? 'admin-dashboard' : res.role === 'employer' ? 'employer-dashboard' : 'seeker-dashboard';
      onNavigate(targetView);
    }
  };

  // Dynamically resolve displayed user name depending on resume name or registered profile name
  const userDisplayName = (() => {
    if (!currentUser) return '';

    if (currentUser.role === 'job_seeker') {
      const resumes = currentSeekerProfile?.resumes || [];
      const activeResume = (currentSeekerProfile?.activeResumeId
        ? resumes.find(r => r.id === currentSeekerProfile.activeResumeId)
        : null) || resumes[0];

      const resumeCandidateName = (
        (activeResume as any)?.candidateName ||
        ((activeResume as any)?.firstName && (activeResume as any)?.lastName
          ? `${(activeResume as any).firstName} ${(activeResume as any).lastName}`
          : '')
      )?.trim();

      if (resumeCandidateName && resumeCandidateName !== 'Job Seeker' && resumeCandidateName !== 'Candidate Applicant') {
        return resumeCandidateName;
      }

      if (currentSeekerProfile) {
        const profileParts = [
          currentSeekerProfile.firstName,
          currentSeekerProfile.middleName,
          currentSeekerProfile.lastName
        ].filter(Boolean).map(s => (s || '').trim()).filter(Boolean);

        const profileFullName = profileParts.join(' ').trim();
        if (
          profileFullName &&
          profileFullName !== 'User Roxas' &&
          profileFullName !== 'Candidate Applicant' &&
          profileFullName !== 'New Seeker'
        ) {
          return profileFullName;
        }
      }
    } else if (currentUser.role === 'employer') {
      if (currentEmployerProfile) {
        if (currentEmployerProfile.representativeName?.trim()) {
          return currentEmployerProfile.representativeName.trim();
        }
        if (currentEmployerProfile.companyName?.trim()) {
          return currentEmployerProfile.companyName.trim();
        }
      }
    }

    return currentUser.name || 'User';
  })();

  const employerJobCount = jobPosts?.filter(j => j.employerId === currentEmployerProfile?.id).length || 0;

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-paper-2)] border-b border-[var(--color-rule)]">
      <div className="max-w-[var(--container)] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & LGU Oriental Mindoro Seal */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNav(
                currentUser?.role === 'job_seeker' ? (isSeekerIncomplete ? 'seeker-profile-setup' : 'seeker-dashboard') :
                currentUser?.role === 'employer' ? (isEmployerIncomplete ? 'employer-profile-setup' : 'employer-dashboard') :
                currentUser?.role === 'admin' ? 'admin-dashboard' : 'landing'
              )}
              className="flex items-center gap-2.5 group text-left focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] rounded-md whitespace-nowrap"
            >
              <div className="w-8 h-8 rounded-md bg-[var(--color-ink)] flex items-center justify-center text-[var(--color-paper)] font-bold">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                    eHANAP
                  </span>
                  <span className="text-[11px] font-medium bg-[var(--color-paper-3)] text-[var(--color-ink)] px-2 py-0.5 rounded-full border border-[var(--color-rule)]">
                    PESO Roxas
                  </span>
                  {isSupabaseConnected && (
                    <span
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-green)] bg-[var(--color-green-soft)] px-2 py-0.5 rounded-full border border-[var(--color-green)]"
                      title="Real-time Supabase PostgreSQL database active"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-[var(--color-accent)] motion-safe:animate-spin' : 'bg-[var(--color-green)] motion-safe:animate-pulse'}`}></span>
                      <span>Supabase</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-muted)] font-normal">
                  <MapPin className="w-3 h-3 text-[var(--color-muted)]" aria-hidden="true" />
                  <span>Roxas, Oriental Mindoro</span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-stretch h-16 gap-1 sm:gap-2 text-xs" aria-label="Main navigation">
            {!currentUser && <GuestNav currentView={currentView} onNavigate={handleNav} />}
            {currentUser?.role === 'job_seeker' && (
              <SeekerNav currentView={currentView} onNavigate={handleNav} isSeekerIncomplete={isSeekerIncomplete} />
            )}
            {currentUser?.role === 'employer' && (
              <EmployerNav
                currentView={currentView}
                onNavigate={handleNav}
                isEmployerIncomplete={isEmployerIncomplete}
                onOpenPostJobModal={onOpenPostJobModal}
              />
            )}
            {currentUser?.role === 'admin' && <AdminNav currentView={currentView} onNavigate={handleNav} />}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Job Alerts Quick Access Button (Seekers) */}
            {currentUser?.role === 'job_seeker' && onOpenSubscriptions && (
              <button
                type="button"
                onClick={onOpenSubscriptions}
                className="btn btn--quiet text-xs min-h-[36px] py-1.5 px-3"
                title="Manage job alert subscriptions"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                <span className="hidden sm:inline">Job alerts</span>
              </button>
            )}

            {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-md text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadNotifs > 0 && (
                    <span className="num absolute top-1 right-1 w-4 h-4 bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-medium text-[10px] rounded-full flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                <NotificationDrawer
                  isOpen={isNotifOpen}
                  onClose={() => setIsNotifOpen(false)}
                  onNavigate={(path) => handleNav(path)}
                />
              </div>
            )}

            {/* 1-Click Role Switcher Pill for Thesis Defense */}
            <DemoPersonaPill
              currentRole={currentUser?.role}
              onSwitchRole={handleQuickRoleSwitch}
            />

            {/* Authenticated User Profile Dropdown or Guest Auth Action */}
            {currentUser ? (
              <UserProfileDropdown
                currentUser={currentUser}
                userDisplayName={userDisplayName}
                jobPostsCount={employerJobCount}
                onNavigate={handleNav}
                onLogout={handleLogout}
                onSwitchRole={handleQuickRoleSwitch}
                onOpenSubscriptions={onOpenSubscriptions}
              />
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="hidden md:inline-flex btn btn--quiet text-xs min-h-[36px] py-1.5 px-3"
                  title="Demo accounts for employers and PESO admin"
                >
                  <Key className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                  <span className="hidden lg:inline">Demo logins</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="btn btn--quiet text-xs min-h-[36px] py-1.5 px-3 sm:px-3.5"
                >
                  <span>Log in</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex btn btn--primary text-xs min-h-[36px] py-1.5 px-4"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Create account</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Quick Navigation Bar */}
      <MobileRoleQuickNav
        currentView={currentView}
        currentUser={currentUser}
        isSeekerIncomplete={isSeekerIncomplete}
        isEmployerIncomplete={isEmployerIncomplete}
        onNavigate={handleNav}
        onOpenAuth={onOpenAuth}
      />

      {/* Mobile Drawer Menu */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentView={currentView}
        currentUser={currentUser}
        userDisplayName={userDisplayName}
        unreadNotifs={unreadNotifs}
        isSeekerIncomplete={isSeekerIncomplete}
        isEmployerIncomplete={isEmployerIncomplete}
        onNavigate={handleNav}
        onLogout={handleLogout}
        onSwitchRole={handleQuickRoleSwitch}
        onOpenAuth={onOpenAuth}
        onOpenSubscriptions={onOpenSubscriptions}
        onOpenPostJobModal={onOpenPostJobModal}
      />
    </header>
  );
};
