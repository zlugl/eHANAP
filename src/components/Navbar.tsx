import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationDrawer } from './NotificationDrawer';
import { getFilteredUserNotifications } from '../utils/notificationUtils';
import { isSeekerProfileComplete, isEmployerProfileComplete } from '../utils/routeGuards';
import { 
  Briefcase, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Building2, 
  ShieldCheck, 
  Menu, 
  X, 
  Sparkles,
  FileText,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  PlusCircle,
  Users,
  FileCheck2,
  BarChart3,
  FileSpreadsheet,
  Megaphone,
  History,
  Settings,
  HelpCircle,
  Home,
  CheckCircle,
  UserCheck,
  Clock,
  Database,
  LogIn,
  Send,
  Play,
  MessageCircle,
  Key,
  Lock,
  MapPin
} from 'lucide-react';

interface NavbarProps {
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
    isFirestoreConnected, 
    isSyncing, 
    jobPosts, 
    currentEmployerProfile, 
    currentSeekerProfile 
  } = useApp();

  const isSeekerIncomplete = currentUser?.role === 'job_seeker' && !isSeekerProfileComplete(currentUser, currentSeekerProfile);
  const isEmployerIncomplete = currentUser?.role === 'employer' && !isEmployerProfileComplete(currentUser, currentEmployerProfile);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
    setIsProfileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    onNavigate('landing');
  };

  const handleQuickRoleSwitch = (role: 'job_seeker' | 'employer' | 'admin') => {
    const res = switchDemoRole(role);
    if (res.success && res.role) {
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
      const targetView = res.role === 'admin' ? 'admin-dashboard' : res.role === 'employer' ? 'employer-dashboard' : 'seeker-dashboard';
      onNavigate(targetView);
    }
  };

  // Dynamically resolve displayed user name depending on resume name or registered profile name
  const userDisplayName = (() => {
    if (!currentUser) return '';

    if (currentUser.role === 'job_seeker') {
      // 1. Check if candidate name is available in active resume or uploaded resumes
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

      // 2. Check registered name from Job Seeker Profile (firstName, middleName, lastName)
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

    // 3. Fallback to registered account name
    return currentUser.name || 'User';
  })();

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
                  {isFirestoreConnected && (
                    <span 
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-green)] bg-[var(--color-green-soft)] px-2 py-0.5 rounded-full border border-[var(--color-green)]"
                      title="Real-time Firebase Firestore database active"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-[var(--color-accent)] motion-safe:animate-spin' : 'bg-[var(--color-green)] motion-safe:animate-pulse'}`}></span>
                      <span>Firestore</span>
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
            
            {/* GUEST (NOT LOGGED IN) NAVIGATION */}
            {!currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('landing')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'landing'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Home"
                >
                  <Home className={`w-4 h-4 mb-0.5 ${currentView === 'landing' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('jobs')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'jobs'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Find Jobs"
                >
                  <Search className={`w-4 h-4 mb-0.5 ${currentView === 'jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Vacancies</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('employers')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employers'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Employers"
                >
                  <Building2 className={`w-4 h-4 mb-0.5 ${currentView === 'employers' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Employers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleNav('landing');
                    setTimeout(() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="h-full flex flex-col items-center justify-center px-3 border-b-2 border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule)] transition-colors text-xs font-medium cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85"
                >
                  <HelpCircle className="w-4 h-4 mb-0.5 text-[var(--color-muted)] group-hover:text-[var(--color-ink)]" aria-hidden="true" />
                  <span>How it works</span>
                </button>
              </>
            )}

            {/* JOB SEEKER NAVIGATION */}
            {currentUser?.role === 'job_seeker' && !isSeekerIncomplete && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('seeker-dashboard')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'seeker-dashboard'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Home"
                >
                  <Home className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('jobs')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'jobs'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Search Jobs"
                >
                  <Search className={`w-4 h-4 mb-0.5 ${currentView === 'jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Vacancies</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('seeker-applications')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'seeker-applications'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Applications"
                >
                  <FileCheck2 className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-applications' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Applications</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('seeker-interviews')}
                  className={`h-full flex flex-col items-center justify-center px-3.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'seeker-interviews'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Interviews"
                >
                  <Calendar className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-interviews' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Interviews</span>
                </button>
              </>
            )}

            {/* EMPLOYER NAVIGATION */}
            {currentUser?.role === 'employer' && !isEmployerIncomplete && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('employer-dashboard')}
                  className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employer-dashboard'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Employer Home"
                >
                  <Home className={`w-4 h-4 mb-0.5 ${currentView === 'employer-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('employer-jobs')}
                  className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employer-jobs'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Job Vacancies"
                >
                  <Briefcase className={`w-4 h-4 mb-0.5 ${currentView === 'employer-jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Vacancies</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('employer-applicants')}
                  className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employer-applicants'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Candidates & Ranking"
                >
                  <Users className={`w-4 h-4 mb-0.5 ${currentView === 'employer-applicants' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Candidates</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('employer-interviews')}
                  className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employer-interviews'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Interview Schedule"
                >
                  <Calendar className={`w-4 h-4 mb-0.5 ${currentView === 'employer-interviews' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Interviews</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('employer-analytics')}
                  className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employer-analytics'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Recruitment Analytics"
                >
                  <BarChart3 className={`w-4 h-4 mb-0.5 ${currentView === 'employer-analytics' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Analytics</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('employer-profile')}
                  className={`h-full flex flex-col items-center justify-center px-3 sm:px-3.5 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'employer-profile'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Company Profile"
                >
                  <Building2 className={`w-4 h-4 mb-0.5 ${currentView === 'employer-profile' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
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
            )}

            {/* PESO/LGU ADMIN NAVIGATION */}
            {currentUser?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('admin-dashboard')}
                  className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'admin-dashboard'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Admin Home"
                >
                  <Home className={`w-4 h-4 mb-0.5 ${currentView === 'admin-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('admin-verifications')}
                  className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'admin-verifications'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Verify Employers"
                >
                  <ShieldCheck className={`w-4 h-4 mb-0.5 ${currentView === 'admin-verifications' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Verify</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('admin-jobs')}
                  className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'admin-jobs'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Monitor Jobs"
                >
                  <Briefcase className={`w-4 h-4 mb-0.5 ${currentView === 'admin-jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Vacancies</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('admin-users')}
                  className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'admin-users'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="User Registry"
                >
                  <Users className={`w-4 h-4 mb-0.5 ${currentView === 'admin-users' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Registry</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('admin-reports')}
                  className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'admin-reports'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Labor Reports"
                >
                  <FileSpreadsheet className={`w-4 h-4 mb-0.5 ${currentView === 'admin-reports' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Reports</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('admin-audit-logs')}
                  className={`h-full flex flex-col items-center justify-center px-3 border-b-2 transition-colors cursor-pointer text-xs group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50 ${
                    currentView === 'admin-audit-logs'
                      ? 'border-[var(--color-accent)] font-semibold text-[var(--color-ink)]'
                      : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-rule)] hover:text-[var(--color-ink)] font-medium'
                  }`}
                  title="Audit Logs"
                >
                  <Clock className={`w-4 h-4 mb-0.5 ${currentView === 'admin-audit-logs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'}`} aria-hidden="true" />
                  <span>Logs</span>
                </button>
              </>
            )}
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
                  onNavigate={(path) => {
                    handleNav(path);
                  }}
                />
              </div>
            )}

            {/* 1-Click Role Switcher Pill for Thesis Defense */}
            <div className="hidden lg:flex items-center gap-1 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-full px-2 py-1 text-xs" aria-label="Quick Demo Persona Switcher">
              <span className="text-[10px] font-semibold text-[var(--color-muted)] px-1 uppercase tracking-wider">Demo:</span>
              <button
                type="button"
                onClick={() => handleQuickRoleSwitch('job_seeker')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  currentUser?.role === 'job_seeker'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                }`}
                title="1-Click switch to Job Seeker (Juan Dela Cruz)"
              >
                Seeker
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSwitch('employer')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  currentUser?.role === 'employer'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                }`}
                title="1-Click switch to Roxas Employer (Puregold Price Club)"
              >
                Employer
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSwitch('admin')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                }`}
                title="1-Click switch to Municipal PESO Admin"
              >
                PESO
              </button>
            </div>

            {/* Authenticated User Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-md hover:bg-[var(--color-paper-3)] transition-colors border border-[var(--color-rule)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
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

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
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
                          onClick={() => handleNav('seeker-profile')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-[var(--color-green)]" aria-hidden="true" />
                          <span>My profile & resume</span>
                        </button>
                        {onOpenSubscriptions && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
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
                          onClick={() => handleNav('seeker-profile')}
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
                          onClick={() => handleNav('employer-dashboard')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Dashboard overview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('employer-jobs')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Vacancies ({jobPosts?.filter(j => j.employerId === currentEmployerProfile?.id).length || 0})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('employer-applicants')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Candidates & ranking</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('employer-interviews')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Interview calendar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('employer-analytics')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Recruitment analytics</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('employer-profile')}
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
                          onClick={() => handleNav('admin-dashboard')}
                          className="w-full text-left px-4 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>PESO admin center</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('admin-reports')}
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
                      onClick={() => handleQuickRoleSwitch('job_seeker')}
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
                      onClick={() => handleQuickRoleSwitch('employer')}
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
                      onClick={() => handleQuickRoleSwitch('admin')}
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
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-[var(--color-error)] hover:bg-[var(--color-paper-3)] flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="btn btn--quiet text-xs min-h-[36px] py-1.5 px-3"
                  title="Demo accounts for employers and PESO admin"
                >
                  <Key className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                  <span className="hidden sm:inline">Demo logins</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="btn btn--quiet text-xs min-h-[36px] py-1.5 px-3.5"
                >
                  <span>Log in</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="btn btn--primary text-xs min-h-[36px] py-1.5 px-4"
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
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Quick Navigation Bar (Only appears when logged in with completed profile) */}
      {currentUser && !isSeekerIncomplete && !isEmployerIncomplete && currentView !== 'seeker-profile-setup' && currentView !== 'employer-profile-setup' && (
        <div 
          aria-label="Mobile and Tablet Quick Navigation"
          className="lg:hidden w-full bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] select-none"
        >
          <div className="max-w-md sm:max-w-xl mx-auto px-2 sm:px-4 py-1.5">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
              {currentUser.role === 'job_seeker' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNav('seeker-dashboard')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'seeker-dashboard'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Home className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('jobs')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'jobs'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Search className={`w-4 h-4 mb-0.5 ${currentView === 'jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Jobs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('seeker-applications')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'seeker-applications'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <FileCheck2 className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-applications' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Applications</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('seeker-interviews')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'seeker-interviews'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Calendar className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-interviews' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Interviews</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('seeker-profile')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'seeker-profile'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <User className={`w-4 h-4 mb-0.5 ${currentView === 'seeker-profile' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Profile</span>
                  </button>
                </>
              )}

              {currentUser.role === 'employer' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNav('employer-dashboard')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'employer-dashboard'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Home className={`w-4 h-4 mb-0.5 ${currentView === 'employer-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('employer-jobs')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'employer-jobs'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 mb-0.5 ${currentView === 'employer-jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Vacancies</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('employer-applicants')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'employer-applicants'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Users className={`w-4 h-4 mb-0.5 ${currentView === 'employer-applicants' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Candidates</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('employer-interviews')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'employer-interviews'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Calendar className={`w-4 h-4 mb-0.5 ${currentView === 'employer-interviews' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Interviews</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('employer-profile')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'employer-profile'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 mb-0.5 ${currentView === 'employer-profile' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Profile</span>
                  </button>
                </>
              )}

              {currentUser.role === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNav('admin-dashboard')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'admin-dashboard'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Home className={`w-4 h-4 mb-0.5 ${currentView === 'admin-dashboard' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('admin-verifications')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'admin-verifications'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 mb-0.5 ${currentView === 'admin-verifications' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Verify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('admin-jobs')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'admin-jobs'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 mb-0.5 ${currentView === 'admin-jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Vacancies</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('admin-users')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'admin-users'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <Users className={`w-4 h-4 mb-0.5 ${currentView === 'admin-users' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Registry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('admin-reports')}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                      currentView === 'admin-reports'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)] border border-transparent font-medium'
                    }`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 mb-0.5 ${currentView === 'admin-reports' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                    <span className="text-[10px] leading-tight">Reports</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] px-4 pt-3 pb-5 space-y-3 shadow-[var(--shadow-lift)] max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Mobile 1-Click Demo Persona Switcher */}
          <div className="bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-md p-2.5 mb-2">
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">
              Thesis 1-Click Persona Switcher:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickRoleSwitch('job_seeker')}
                className={`py-1.5 px-2 rounded text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  currentUser?.role === 'job_seeker'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[var(--color-paper-1)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] border border-[var(--color-rule)]'
                }`}
              >
                Seeker
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSwitch('employer')}
                className={`py-1.5 px-2 rounded text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  currentUser?.role === 'employer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[var(--color-paper-1)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] border border-[var(--color-rule)]'
                }`}
              >
                Employer
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSwitch('admin')}
                className={`py-1.5 px-2 rounded text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[var(--color-paper-1)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] border border-[var(--color-rule)]'
                }`}
              >
                PESO
              </button>
            </div>
          </div>

          {/* Detailed Navigation Item Rows with Icons */}
          <div className="space-y-1">
            {!currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('landing')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'landing' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Home className={`w-4 h-4 ${currentView === 'landing' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                  <span>Welcome overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('jobs')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'jobs' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Search className={`w-4 h-4 ${currentView === 'jobs' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                  <span>Find vacancies in Roxas</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('employers')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                    currentView === 'employers' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${currentView === 'employers' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} aria-hidden="true" />
                  <span>Registered employers</span>
                </button>
                <div className="pt-2 border-t border-[var(--color-rule)] flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    className="btn btn--quiet text-xs min-h-[40px] w-full"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>Sign in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                    className="btn btn--primary text-xs min-h-[40px] w-full"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Register account</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {currentUser?.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-dashboard')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-dashboard' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Admin overview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-verifications')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-verifications' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Verify employers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-jobs')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-jobs' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Monitor job postings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-job-matching')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-job-matching' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Decision tree matching</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-lra')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-lra' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Visiting companies (LRA)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-users')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-users' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Users className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>User registry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-reports')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-reports' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Labor reports</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('admin-audit-logs')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'admin-audit-logs' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>System audit logs</span>
                    </button>
                  </>
                )}

                {currentUser?.role === 'employer' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNav('employer-dashboard')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'employer-dashboard' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Employer overview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('employer-jobs')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'employer-jobs' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Job vacancies</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('employer-applicants')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'employer-applicants' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Users className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Candidates & ranking</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('employer-interviews')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'employer-interviews' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Interview schedule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('employer-analytics')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'employer-analytics' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Recruitment analytics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('employer-profile')}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                        currentView === 'employer-profile' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                      <span>Company profile</span>
                    </button>
                    {onOpenPostJobModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenPostJobModal();
                        }}
                        className="btn btn--primary text-xs min-h-[40px] w-full mt-1"
                      >
                        <PlusCircle className="w-4 h-4" aria-hidden="true" />
                        <span>Post vacancy</span>
                      </button>
                    )}
                  </>
                )}

                {currentUser?.role === 'job_seeker' && (
                  <>
                    {isSeekerIncomplete ? (
                      <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-md space-y-2 mb-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
                          <Lock className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                          <span>Candidate profile setup required</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-muted)] leading-normal">
                          Complete your profile and skills inventory first to access the dashboard and local job vacancies.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleNav('seeker-profile-setup')}
                          className="btn btn--primary text-xs min-h-[38px] w-full"
                        >
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Start profile setup</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleNav('seeker-dashboard')}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                            currentView === 'seeker-dashboard' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                          }`}
                        >
                          <Home className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Seeker dashboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('jobs')}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                            currentView === 'jobs' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                          }`}
                        >
                          <Search className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Search vacancies</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('seeker-applications')}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                            currentView === 'seeker-applications' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                          }`}
                        >
                          <FileCheck2 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Applications</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('seeker-interviews')}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                            currentView === 'seeker-interviews' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Interviews</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNav('seeker-profile')}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 ${
                            currentView === 'seeker-profile' ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)] font-semibold border border-[var(--color-rule)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                          }`}
                        >
                          <User className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                          <span>Profile & resume</span>
                        </button>
                      </>
                    )}
                  </>
                )}

                <div className="pt-2 border-t border-[var(--color-rule)]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 text-[var(--color-error)] hover:bg-[var(--color-paper-3)] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </header>
  );
};
