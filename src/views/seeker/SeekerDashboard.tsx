import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationDrawer } from '../../components/NotificationDrawer';
import { getFilteredUserNotifications } from '../../utils/notificationUtils';
import { JobOfferView } from '../../components/JobOfferView';
import { ApplyForJobWindow } from '../../components/ApplyForJobWindow';
import { ResumeUploadModal } from './ResumeUploadModal';
import { ResumePDFExportModal } from '../../components/ResumePDFExportModal';
import { ResumeBuilderModal } from '../../components/ResumeBuilderModal';
import { JobFilterModal, FilterState } from '../../components/JobFilterModal';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  Bell, 
  SlidersHorizontal, 
  Bookmark, 
  Share2, 
  Check, 
  ArrowRight, 
  X, 
  Sparkles, 
  Briefcase, 
  Home, 
  Compass, 
  MessageSquare, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Send,
  PhoneCall
} from 'lucide-react';
import { getOrCalculateMatch, getMatchScoreCategory } from '../../utils/matchResolver';

interface SeekerDashboardProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenSubscriptions?: () => void;
  initialJobId?: string;
}

interface DisplayJob {
  id: string;
  title: string;
  companyName: string;
  logoLetter: string;
  logoBg: string;
  logoUrl?: string;
  location: string;
  tags: string[];
  applicantCount: number;
  salary: string;
  period: string;
  category: string;
  subCategory?: string;
  description: string;
  type: string;
  workSetup: 'Remote' | 'On-site' | 'Hybrid' | 'Fieldwork';
  workSchedule?: string;
  isUrgent?: boolean;
  openToFreshGraduates?: boolean;
  experienceLevel: string;
}

const DEFAULT_REGISTERED_JOBS: DisplayJob[] = [];

const CATEGORY_TABS = [
  'All',
  'Customer Service & Retail',
  'IT & Software',
  'Agriculture & Farming',
  'Accounting & Finance',
  'Logistics & Engineering',
  'Healthcare & Medical'
];

const LOCATIONS = [
  'Roxas, Oriental Mindoro'
];

export const SeekerDashboard: React.FC<SeekerDashboardProps> = ({ onNavigate, onOpenSubscriptions, initialJobId }) => {
  const { 
    currentUser,
    currentSeekerProfile, 
    applyForJob, 
    showToast, 
    notifications,
    jobPosts,
    employers,
    applications,
    interviews,
    referralSlips,
    bookmarkedJobIds,
    toggleBookmarkJob,
    isJobBookmarked,
    candidateMatches,
    invitations,
    respondToInvitation,
  } = useApp();

  // State
  const [currentLocation] = useState('Roxas, Oriental Mindoro');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    location: '',
    minSalary: 10000,
    maxSalary: 100000,
    workModel: 'All',
    experienceLevel: 'All',
    jobTitle: 'All',
    category: 'All'
  });
  const [viewingJob, setViewingJob] = useState<DisplayJob | null>(null);

  // Filter criteria
  const [filterWorkSetup, setFilterWorkSetup] = useState<'all' | 'Remote' | 'On-site' | 'Hybrid'>('all');
  const [filterJobType, setFilterJobType] = useState<'all' | 'Full-Time' | 'Part-Time' | 'Contract'>('all');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'vacancies' | 'scouted' | 'applications'>('vacancies');
  const [applyingForJob, setApplyingForJob] = useState<DisplayJob | null>(null);

  // Scout Invitations for Current Job Seeker
  const myScoutInvitations = useMemo(() => {
    if (!currentSeekerProfile) return [];
    return (invitations || []).filter(
      inv => inv.jobSeekerId === currentSeekerProfile.id || inv.seekerId === currentSeekerProfile.id
    );
  }, [invitations, currentSeekerProfile]);

  const pendingScoutCount = myScoutInvitations.filter(inv => inv.status === 'pending').length;

  // Upcoming interviews within 24 hours for reminder banner
  const upcomingInterviewsWithin24h = useMemo(() => {
    if (!currentSeekerProfile) return [];
    const todayIso = new Date().toISOString().split('T')[0];
    const tomorrowIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return (interviews || []).filter(inv => {
      const isMine = inv.jobSeekerId === currentSeekerProfile.id || inv.seekerId === currentSeekerProfile.id;
      const isActive = inv.status === 'scheduled' || inv.status === 'rescheduled' || inv.status === 'accepted';
      const dStr = inv.date || (inv as any).scheduledDate;
      return isMine && isActive && (dStr === todayIso || dStr === tomorrowIso);
    });
  }, [interviews, currentSeekerProfile]);

  // Memoized Decision Tree match score evaluator for Seeker Job Feed
  const jobMatchScoreMap = useMemo(() => {
    const map = new Map<
      string,
      {
        score: number;
        label: string;
        skillsScore: number;
        educationScore: number;
        degreeScore: number;
        experienceScore: number;
        certsScore: number;
      }
    >();
    if (!currentSeekerProfile || !jobPosts || jobPosts.length === 0) return map;

    jobPosts.forEach(targetJob => {
      const matchRes = getOrCalculateMatch(currentSeekerProfile, targetJob, { cachedMatches: candidateMatches });
      const cat = getMatchScoreCategory(matchRes.overallMatch);
      map.set(targetJob.id, {
        score: cat.score,
        label: cat.label,
        skillsScore: Math.round(matchRes.skillsMatchScore ?? 0),
        educationScore: Math.round(matchRes.educationMatchScore ?? 0),
        degreeScore: Math.round(matchRes.degreeAlignmentScore ?? 0),
        experienceScore: Math.round(matchRes.experienceMatchScore ?? 0),
        certsScore: Math.round(matchRes.certificationsMatchScore ?? 0),
      });
    });
    return map;
  }, [currentSeekerProfile, jobPosts, candidateMatches]);

  const getJobMatchScore = (jobId: string) => {
    return (
      jobMatchScoreMap.get(jobId) || {
        score: 75,
        label: 'Qualified',
        skillsScore: 75,
        educationScore: 80,
        degreeScore: 75,
        experienceScore: 70,
        certsScore: 70,
      }
    );
  };

  const myApplicationsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!currentSeekerProfile || !applications) return map;
    applications
      .filter(a => a.jobSeekerId === currentSeekerProfile.id)
      .forEach(app => {
        map.set(app.jobId, app);
      });
    return map;
  }, [applications, currentSeekerProfile]);

  const formatStageLabel = (status: string) => {
    if (['applied', 'submitted'].includes(status)) return 'Pending';
    if (['ats_screened', 'under_review', 'reviewed', 'qualified'].includes(status)) return 'Under Review';
    if (['shortlisted', 'for_final_review'].includes(status)) return 'Shortlisted';
    if (['for_interview', 'interview_scheduled', 'interview_completed'].includes(status)) return 'Interview Scheduled';
    if (status === 'hired') return 'Hired';
    if (['rejected', 'not_selected'].includes(status)) return 'Rejected';
    if (status === 'withdrawn') return 'Withdrawn';
    return status.replace(/_/g, ' ');
  };

  const getStageIndex = (status: string) => {
    if (['rejected', 'not_selected', 'withdrawn'].includes(status)) return -1;
    if (['applied', 'submitted'].includes(status)) return 0;
    if (['ats_screened', 'under_review', 'reviewed', 'qualified'].includes(status)) return 1;
    if (['shortlisted', 'for_final_review', 'for_interview', 'interview_scheduled', 'interview_completed'].includes(status)) return 2;
    if (status === 'hired') return 3;
    return 0;
  };

  // Transform real registered employer jobs from AppContext into DisplayJob
  const registeredDisplayJobs: DisplayJob[] = useMemo(() => {
    if (!jobPosts || jobPosts.length === 0) {
      return [];
    }

    const colorPalettes = [
      'bg-[#43464b] text-white',
      'bg-[#525252] text-white',
      'bg-[#3f3f46] text-white',
      'bg-[#27272a] text-white',
      'bg-[#404040] text-white'
    ];

    return jobPosts
      .filter(j => j.status === 'active')
      .map((job, idx) => {
        const emp = employers?.find(e => e.id === job.employerId);
        const appCount = (applications || []).filter(a => a.jobId === job.id).length;
        const compName = job.companyName || emp?.companyName || 'Registered Employer';
        const initial = compName.charAt(0).toUpperCase();

        const isRemote = job.workLocation?.toLowerCase().includes('remote');
        const isHybrid = job.workLocation?.toLowerCase().includes('hybrid');
        const workSetup: 'Remote' | 'On-site' | 'Hybrid' | 'Fieldwork' =
          job.workSetup || (isRemote ? 'Remote' : isHybrid ? 'Hybrid' : 'On-site');

        const eduTag =
          job.acceptedEducationLevels && job.acceptedEducationLevels.length > 0
            ? job.acceptedEducationLevels.length > 1
              ? `${job.acceptedEducationLevels[0]} +${job.acceptedEducationLevels.length - 1}`
              : job.acceptedEducationLevels[0]
            : job.preferredCourses && job.preferredCourses.length > 0
            ? job.preferredCourses[0]
            : job.preferredDegree?.split('/')[0]?.trim() || job.minEducationalAttainment || 'Open to All';

        const tags: string[] = [
          job.employmentType || 'Full-Time',
          workSetup,
          ...(job.workSchedule ? [job.workSchedule] : []),
          eduTag
        ];

        const scheduleLabel = job.paySchedule || job.payFrequency || '';
        const payPeriod = scheduleLabel ? `• ${scheduleLabel}` : '/month';

        let sal = (job.salaryRange || 'Negotiable')
          .replace(/\s*•\s*.+$/, '')
          .replace(/\s*\/\s*(month|day|hour|project)\b/i, '')
          .trim();

        const numMatches = sal.match(/₱?(\d{1,3}),?(\d{3})/g);
        if (numMatches && numMatches.length >= 2) {
          const first = parseInt(numMatches[0].replace(/[^0-9]/g, ''), 10);
          const second = parseInt(numMatches[1].replace(/[^0-9]/g, ''), 10);
          if (!isNaN(first) && !isNaN(second) && first >= 1000 && second >= 1000) {
            sal = `₱${Math.round(first / 1000)}k – ₱${Math.round(second / 1000)}k`;
          }
        }

        let expLevel: string = job.careerLevel || 'Entry Level';
        if (!job.careerLevel) {
          if (job.minExperienceYears >= 5) expLevel = 'Senior Level';
          else if (job.minExperienceYears >= 3) expLevel = 'Mid-Senior Level';
          else if (job.minExperienceYears >= 1) expLevel = 'Mid Level';
        }

        return {
          id: job.id,
          title: job.title,
          companyName: compName,
          logoLetter: `${initial}.`,
          logoBg: colorPalettes[idx % colorPalettes.length],
          logoUrl: job.companyLogo || emp?.logoUrl,
          location: job.workLocation || 'Roxas, Oriental Mindoro',
          tags,
          applicantCount: appCount,
          salary: sal,
          period:
            (job.salaryNegotiable ?? job.isSalaryNegotiable) && !job.minSalary && !job.maxSalary && !scheduleLabel
              ? ''
              : payPeriod,
          category: job.category,
          subCategory: job.subCategory,
          description: job.description,
          type: job.employmentType || 'Full-Time',
          workSetup,
          workSchedule: job.workSchedule,
          isUrgent: job.isUrgent,
          openToFreshGraduates: job.openToFreshGraduates,
          experienceLevel: expLevel
        };
      });
  }, [jobPosts, employers, applications]);

  // Suggested Jobs: prioritized vacancies matching seeker preferences / qualifications
  const suggestedJobs = useMemo(() => {
    if (currentSeekerProfile && jobPosts && jobPosts.length > 0) {
      return [...registeredDisplayJobs].sort((a, b) => {
        const scoreA = jobMatchScoreMap.get(a.id)?.score ?? 88;
        const scoreB = jobMatchScoreMap.get(b.id)?.score ?? 88;
        return scoreB - scoreA;
      });
    }

    return registeredDisplayJobs;
  }, [registeredDisplayJobs, currentSeekerProfile, jobPosts, jobMatchScoreMap]);

  const toggleBookmark = (jobId: string, jobTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const wasBookmarked = isJobBookmarked(jobId);
    toggleBookmarkJob(jobId);
    showToast({
      title: wasBookmarked ? 'Removed from Bookmarks' : 'Saved to Bookmarks',
      message: wasBookmarked ? `"${jobTitle}" was removed from your saved list.` : `"${jobTitle}" has been saved to your bookmarks.`,
      type: wasBookmarked ? 'info' : 'success'
    });
  };

  // Open Application Confirmation Modal (Attaches Resume & Submits Application)
  const handleQuickApply = (job: DisplayJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentSeekerProfile) {
      showToast({
        title: 'Authentication Required',
        message: 'Please log in to submit your job application.',
        type: 'alert'
      });
      return;
    }
    setApplyingForJob(job);
  };

  // Sync initialJobId with viewingJob
  useEffect(() => {
    if (initialJobId && registeredDisplayJobs.length > 0) {
      const match = registeredDisplayJobs.find(j => j.id === initialJobId);
      if (match) setViewingJob(match);
    }
  }, [initialJobId, registeredDisplayJobs]);

  // Filtered lists
  const filteredSuggested = suggestedJobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSetup = filterWorkSetup === 'all' || job.workSetup === filterWorkSetup;
    const matchesType = filterJobType === 'all' || job.type === filterJobType;
    return matchesSearch && matchesSetup && matchesType;
  });

  const filteredRecent = registeredDisplayJobs.filter(job => {
    let matchesCategory = selectedCategory === 'All';
    if (!matchesCategory) {
      if (selectedCategory === 'IT & Software' && job.category.includes('Information Technology')) matchesCategory = true;
      else if (selectedCategory === 'Agriculture & Farming' && job.category.includes('Agriculture')) matchesCategory = true;
      else if (selectedCategory === 'Accounting & Finance' && job.category.includes('Accounting')) matchesCategory = true;
      else if (selectedCategory === 'Logistics & Engineering' && job.category.includes('Engineering')) matchesCategory = true;
      else if (selectedCategory === 'Healthcare & Medical' && job.category.includes('Healthcare')) matchesCategory = true;
      else if (selectedCategory === 'Customer Service & Retail' && job.category.includes('Customer Service')) matchesCategory = true;
      else if (job.category.toLowerCase().includes(selectedCategory.toLowerCase())) matchesCategory = true;
    }

    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSetup = filterWorkSetup === 'all' || job.workSetup === filterWorkSetup;
    const matchesType = filterJobType === 'all' || job.type === filterJobType;
    return matchesCategory && matchesSearch && matchesSetup && matchesType;
  });

  const userNotifs = getFilteredUserNotifications(
    notifications,
    currentUser,
    currentSeekerProfile,
    applications,
    interviews,
    referralSlips
  );
  const unreadNotifCount = userNotifs.filter(n => !n.read).length;

  // If the application submission confirmation modal is open (for Recommended Jobs or accepting a Scout Invitation)
  if (applyingForJob) {
    return (
      <ApplyForJobWindow
        job={{
          id: applyingForJob.id,
          title: applyingForJob.title,
          companyName: applyingForJob.companyName,
          location: applyingForJob.location,
          salary: `${applyingForJob.salary} ${applyingForJob.period}`.trim(),
          type: applyingForJob.type,
        }}
        onClose={() => setApplyingForJob(null)}
        onSuccess={() => {
          setApplyingForJob(null);
          setActiveDashboardTab('applications');
        }}
      />
    );
  }

  // If a job offer is selected to view, show it as a tabbed view instead of a floating div
  if (viewingJob) {
    return (
      <JobOfferView
        job={viewingJob}
        onBack={() => setViewingJob(null)}
        onNavigate={onNavigate}
        isBookmarked={isJobBookmarked(viewingJob.id)}
        onToggleBookmark={toggleBookmark}
        onSelectOtherJob={(ojId) => {
          const nextJob = registeredDisplayJobs.find(j => j.id === ojId);
          if (nextJob) setViewingJob(nextJob);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body pb-12 select-none">
      
      {/* Centered App Container */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-3 sm:px-4 pt-3 sm:pt-5 space-y-6">

        {/* TOP CONTOURED HEADER BANNER */}
        <div className="relative rounded-2xl overflow-hidden bg-[var(--color-ink)] text-[var(--color-paper)] p-5 sm:p-6 border border-[var(--color-rule)]">
          
          {/* Subtle Organic Topographical Contour Curves */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none opacity-20" 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 500 240"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M-20,40 Q150,-10 280,60 T520,30" fill="none" stroke="#ffffff" strokeWidth="1.6" />
            <path d="M-20,80 Q140,20 290,100 T520,60" fill="none" stroke="#ffffff" strokeWidth="1.6" />
            <path d="M-20,120 Q160,50 310,140 T520,90" fill="none" stroke="#ffffff" strokeWidth="1.6" />
            <path d="M-20,160 Q180,80 330,180 T520,130" fill="none" stroke="#ffffff" strokeWidth="1.6" />
            <path d="M-20,200 Q200,120 350,220 T520,170" fill="none" stroke="#ffffff" strokeWidth="1.6" />
          </svg>

          <div className="relative z-10 space-y-4">
            
            {/* Top Row: Location & Notification Bell */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[var(--color-paper)]/70 font-medium">
                  Location
                </p>
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-[var(--color-paper)] mt-0.5 cursor-default"
                  >
                    <MapPin className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    <span>{currentLocation}</span>
                  </button>
                </div>
              </div>

              {/* Notification Bell Button */}
              <button
                onClick={() => setIsNotifDrawerOpen(true)}
                className="relative p-2.5 bg-[var(--color-paper)]/10 hover:bg-[var(--color-paper)]/20 active:opacity-85 text-[var(--color-paper)] rounded-xl border border-[var(--color-paper)]/20 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5 text-[var(--color-paper)]" aria-hidden="true" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[var(--color-ink)]" />
                )}
              </button>
            </div>

            {/* Bottom Row: Search Bar & Filter Button */}
            <div className="flex items-center gap-2.5 pt-1">
              {/* Search Input Card */}
              <div className="flex-1 bg-[var(--color-paper)] rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 border border-[var(--color-rule)] text-[var(--color-ink)]">
                <Search className="w-4.5 h-4.5 text-[var(--color-ink-muted)] shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search jobs, categories or companies"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-lg cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="p-3 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] active:opacity-85 text-[var(--color-ink)] rounded-xl border border-[var(--color-rule)] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                title="Filter preferences"
                aria-label="Filter preferences"
              >
                <SlidersHorizontal className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />
              </button>
            </div>

          </div>
        </div>

        {/* UPCOMING INTERVIEW REMINDER BANNER (Within 24 Hours) */}
        {upcomingInterviewsWithin24h.length > 0 && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-indigo-950 text-sm">
                  Upcoming Interview Reminder ({upcomingInterviewsWithin24h.length} Within 24 Hours)
                </p>
                <p className="text-indigo-800 mt-0.5 font-medium">
                  Next: <strong className="uppercase">{upcomingInterviewsWithin24h[0].companyName}</strong> for{' '}
                  <strong>{upcomingInterviewsWithin24h[0].jobTitle}</strong> on{' '}
                  <strong>{upcomingInterviewsWithin24h[0].date || (upcomingInterviewsWithin24h[0] as any).scheduledDate}</strong> at{' '}
                  <strong>{upcomingInterviewsWithin24h[0].time || (upcomingInterviewsWithin24h[0] as any).scheduledTime}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('seeker-interviews')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Open Calendar Tab
            </button>
          </div>
        )}

        {/* DASHBOARD NAVIGATION TABS: 1. Recommended Jobs vs 2. Scouted / Employer Invitations vs 3. My Applied Jobs & Status */}
        <div className="bg-[var(--color-paper)] p-1.5 rounded-2xl border border-[var(--color-rule)] grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveDashboardTab('vacancies')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeDashboardTab === 'vacancies'
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Recommended Jobs ({registeredDisplayJobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardTab('scouted')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeDashboardTab === 'scouted'
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span>Scouted / Invitations</span>
            {pendingScoutCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {pendingScoutCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardTab('applications')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeDashboardTab === 'applications'
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>My Applied Jobs ({myApplicationsMap.size})</span>
          </button>
        </div>

        {activeDashboardTab === 'scouted' ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                  Scouted / Employer Invitations
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Employers who reviewed your AI match profile and invited you to apply. Accept an invitation to attach your resume and officially submit your application.
                </p>
              </div>
            </div>

            {myScoutInvitations.length === 0 ? (
              <div className="bg-[var(--color-paper)] rounded-2xl p-8 text-center border border-[var(--color-rule)] space-y-3">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-ink)]">No Employer Scout Invitations Yet</p>
                  <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">
                    When an employer scouts your profile from their Recommended Talent list, their invitation will appear here so you can accept and submit your resume.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab('vacancies')}
                  className="btn btn--primary text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Browse Recommended Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myScoutInvitations.map(inv => {
                  const jobId = inv.jobId || inv.vacancyId || '';
                  const displayJob = registeredDisplayJobs.find(j => j.id === jobId);
                  const rawJob = jobPosts.find(j => j.id === jobId);
                  const alreadyApplied = myApplicationsMap.has(jobId);

                  return (
                    <div
                      key={inv.id}
                      className="bg-[var(--color-paper)] rounded-2xl p-4 sm:p-5 border border-[var(--color-rule)] space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Scouted by Employer • {Math.round(inv.matchScore || 85)}% Match</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                inv.status === 'accepted' || alreadyApplied
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : inv.status === 'declined'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {alreadyApplied ? 'Accepted & Applied' : inv.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-[var(--color-ink)] text-sm sm:text-base mt-1.5">
                            {inv.jobTitle || rawJob?.title || 'Job Vacancy'}
                          </h3>
                          <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase mt-0.5">
                            {inv.companyName || rawJob?.companyName} • {rawJob?.municipality || 'Oriental Mindoro'}
                          </p>
                        </div>

                        {displayJob && (
                          <button
                            type="button"
                            onClick={() => setViewingJob(displayJob)}
                            className="text-xs font-bold text-[var(--color-accent)] hover:underline shrink-0 cursor-pointer"
                          >
                            View Vacancy
                          </button>
                        )}
                      </div>

                      {(inv.note || inv.message) && (
                        <div className="p-3 bg-[var(--color-paper-warm)] rounded-xl border border-[var(--color-rule)] text-xs text-[var(--color-ink)]">
                          <span className="text-[10px] font-bold uppercase text-[var(--color-ink-muted)] block mb-0.5">
                            Message from {inv.companyName}:
                          </span>
                          <p className="italic">&ldquo;{inv.note || inv.message}&rdquo;</p>
                        </div>
                      )}

                      {inv.status === 'pending' && !alreadyApplied && (
                        <div className="pt-2 border-t border-[var(--color-rule)] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => respondToInvitation(inv.id, 'declined')}
                            className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (displayJob) {
                                setApplyingForJob(displayJob);
                              } else if (rawJob) {
                                setApplyingForJob({
                                  id: rawJob.id,
                                  title: rawJob.title,
                                  companyName: rawJob.companyName,
                                  logoLetter: rawJob.companyName.charAt(0).toUpperCase(),
                                  logoBg: 'bg-slate-800 text-white',
                                  location: rawJob.workLocation || rawJob.municipality,
                                  tags: [rawJob.employmentType],
                                  applicantCount: 0,
                                  salary: rawJob.salaryRange || 'Negotiable',
                                  period: '',
                                  category: rawJob.category,
                                  description: rawJob.description,
                                  type: rawJob.employmentType,
                                  workSetup: rawJob.workSetup || 'On-site',
                                  experienceLevel: rawJob.careerLevel || 'Entry Level',
                                });
                              }
                            }}
                            className="btn btn--primary px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Accept &amp; Submit Application</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeDashboardTab === 'applications' ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                  Application Status Tracking
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Real-time stage progression for every vacancy you have applied to
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('seeker-applications')}
                className="text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer"
              >
                Full Applications View →
              </button>
            </div>

            {myApplicationsMap.size === 0 ? (
              <div className="bg-[var(--color-paper)] rounded-2xl p-8 text-center border border-[var(--color-rule)] space-y-3">
                <Briefcase className="w-8 h-8 text-[var(--color-ink-muted)] mx-auto" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-ink)]">No Applications Submitted Yet</p>
                  <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">
                    Switch to the Matched Job Vacancies tab and click "Apply Now" on any vacancy matching your profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab('vacancies')}
                  className="btn btn--primary text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Browse Matched Job Vacancies
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(myApplicationsMap.values()).map((app: any) => {
                  const job = jobPosts.find(j => j.id === app.jobId);
                  const stageLabel = formatStageLabel(app.currentStatus);
                  const stageIdx = getStageIndex(app.currentStatus);
                  const isRejected = ['rejected', 'not_selected'].includes(app.currentStatus);
                  const isHired = app.currentStatus === 'hired';
                  const stages = ['Pending', 'Under Review', 'Shortlisted', 'Hired'];

                  return (
                    <div
                      key={app.id}
                      className="bg-[var(--color-paper)] rounded-2xl p-4 sm:p-5 border border-[var(--color-rule)] space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[var(--color-ink)] text-sm sm:text-base">
                              {job?.title || 'Job Vacancy'}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>{Math.round(app.matchScore || app.matchResult?.overallMatch || 80)}% Match</span>
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                            {job?.companyName || 'Employer'} • {job?.municipality || 'Roxas'}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isHired
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isRejected
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {stageLabel}
                        </span>
                      </div>

                      {/* Real-time 4-Stage Visual Progress Tracker */}
                      <div className="pt-2 border-t border-[var(--color-rule)] space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {stages.map((st, idx) => {
                            const isDone = !isRejected && stageIdx >= idx;
                            const isCurrent = !isRejected && stageIdx === idx;
                            return (
                              <div key={st} className="space-y-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    isRejected
                                      ? idx === 0
                                        ? 'bg-rose-500'
                                        : 'bg-rose-100'
                                      : isDone
                                      ? isHired
                                        ? 'bg-emerald-600'
                                        : 'bg-[var(--color-ink)]'
                                      : 'bg-[var(--color-paper-warm)] border border-[var(--color-rule)]'
                                  }`}
                                />
                                <span
                                  className={`block text-[10px] text-center ${
                                    isCurrent
                                      ? 'font-bold text-[var(--color-ink)]'
                                      : isDone
                                      ? 'font-semibold text-[var(--color-ink-muted)]'
                                      : 'text-[var(--color-ink-muted)]/60'
                                  }`}
                                >
                                  {st}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {isRejected && (
                          <p className="text-[11px] font-semibold text-rose-700">
                            Status: Application was marked as Rejected by the employer.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
        {/* SECTION 1: SUGGESTED JOBS */}
        <div className="space-y-3">
          
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                Recommended For You
              </h2>
              {currentSeekerProfile && (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                  <span>Aligned with your Profile</span>
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
            >
              See all
            </button>
          </div>

          {/* Horizontal Carousel Cards */}
          <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {filteredSuggested.length === 0 ? (
              <div className="w-full bg-[var(--color-paper)] rounded-2xl p-8 text-center border border-[var(--color-rule)]">
                <Briefcase className="w-8 h-8 text-[var(--color-ink-muted)] mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-bold text-[var(--color-ink)]">No Job Offers Available Yet</p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">There are no job vacancies posted yet in Roxas. Newly registered employers will publish openings here.</p>
              </div>
            ) : (
              filteredSuggested.map((job) => {
                const isBookmarked = isJobBookmarked(job.id);
                const match = getJobMatchScore(job.id);
                return (
                  <div
                    key={job.id}
                    onClick={() => setViewingJob(job)}
                    className="min-w-[280px] sm:min-w-[320px] max-w-[340px] bg-[var(--color-paper)] rounded-2xl p-4 sm:p-5 border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors cursor-pointer flex flex-col justify-between space-y-3.5 snap-start shrink-0 relative group focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    <div>
                      {/* Decision Tree Match Score Badge & Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 motion-safe:animate-pulse" aria-hidden="true" />
                          <span className="tabular-nums font-bold">{match.score}% Match</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {job.isUrgent && (
                            <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                              ⚡ Urgent
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-[var(--color-ink)] bg-[var(--color-paper-warm)] px-2 py-0.5 rounded-md border border-[var(--color-rule)]">
                            {match.label}
                          </span>
                        </div>
                      </div>

                      {/* Top Row: Logo, Title & Bookmark */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Company Logo (Blank container when no logo uploaded) */}
                          <div className="relative w-12 h-12 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                            {job.logoUrl ? (
                              <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--color-ink)] text-sm sm:text-base leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-xs text-[var(--color-ink-muted)] font-medium">{job.companyName}</span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-[var(--color-ink)] text-[10px] font-medium">
                                <CheckCircle2 className="w-3 h-3 text-[var(--color-accent)] stroke-[2.5]" aria-hidden="true" />
                                <span>PESO-Verified</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bookmark Ribbon */}
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(job.id, job.title, e)}
                          className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] rounded"
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
                          aria-label="Bookmark job"
                        >
                          <Bookmark 
                            className={`w-5 h-5 transition-colors ${
                              isBookmarked 
                                ? 'fill-[var(--color-ink)] text-[var(--color-ink)]' 
                                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                            }`} 
                            aria-hidden="true"
                          />
                        </button>
                      </div>

                      {/* Location Row */}
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] mt-3 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                        <span className="truncate">{job.location}</span>
                      </div>

                      {/* Tags Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-[var(--color-paper-warm)] text-[var(--color-ink)] text-[11px] font-medium px-2.5 py-1 rounded-lg border border-[var(--color-rule)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row: Experience Level, Work Setup & Salary */}
                    <div className="pt-2.5 flex items-center justify-between border-t border-[var(--color-rule)]">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[var(--color-paper-warm)] text-[var(--color-ink)] text-[11px] font-medium border border-[var(--color-rule)]">
                          {job.experienceLevel}
                        </span>
                        <span className="text-[11px] text-[var(--color-ink-muted)] font-medium hidden sm:inline">
                          • {job.workSetup}
                        </span>
                      </div>

                      {/* Salary */}
                      <div className="text-right">
                        <span className="font-bold text-[var(--color-ink)] text-xs sm:text-sm font-mono tabular-nums">
                          {job.salary}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink-muted)] ml-1">
                          {job.period}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: RECENT JOBS */}
        <div className="space-y-3.5">
          
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display tracking-tight">
              Recent Jobs
            </h2>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
            >
              See all
            </button>
          </div>

          {/* Category Filter Pills (Horizontal Scroll Row) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                    isActive
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-xs'
                      : 'bg-[var(--color-paper)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Recent Jobs Vertical List */}
          <div className="space-y-3">
            {filteredRecent.length === 0 ? (
              <div className="bg-[var(--color-paper)] rounded-2xl p-8 text-center border border-[var(--color-rule)]">
                <Briefcase className="w-8 h-8 text-[var(--color-ink-muted)] mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-bold text-[var(--color-ink)]">No Recent Job Vacancies</p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">No employers have posted job openings yet. Check back once local businesses in Roxas register.</p>
              </div>
            ) : (
              filteredRecent.map((job) => {
                const isBookmarked = isJobBookmarked(job.id);
                const match = getJobMatchScore(job.id);
                const existingApp = myApplicationsMap.get(job.id);
                const stageLabel = existingApp ? formatStageLabel(existingApp.currentStatus) : null;
                const stageIdx = existingApp ? getStageIndex(existingApp.currentStatus) : -1;
                const isRejected = existingApp && ['rejected', 'not_selected'].includes(existingApp.currentStatus);
                const isHired = existingApp && existingApp.currentStatus === 'hired';
                return (
                  <div
                    key={job.id}
                    onClick={() => setViewingJob(job)}
                    className="bg-[var(--color-paper)] rounded-2xl p-4 sm:p-5 border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors cursor-pointer relative group space-y-3 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {/* Decision Tree Match Badge Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span className="tabular-nums font-bold">{match.score}% Match</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {existingApp && (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isHired
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : isRejected
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            Status: {stageLabel}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-[var(--color-ink)] bg-[var(--color-paper-warm)] px-2 py-0.5 rounded-md border border-[var(--color-rule)]">
                          {match.label}
                        </span>
                      </div>
                    </div>

                    {/* Top Row: Logo, Title & Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Company Logo (Blank container when no logo uploaded) */}
                        <div className="relative w-12 h-12 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--color-ink)] text-sm sm:text-base leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="text-xs text-[var(--color-ink-muted)] font-medium">{job.companyName}</span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-[var(--color-ink)] text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-[var(--color-accent)] stroke-[2.5]" aria-hidden="true" />
                              <span>PESO-Verified</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bookmark Ribbon */}
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(job.id, job.title, e)}
                        className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] rounded"
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
                        aria-label="Bookmark job"
                      >
                        <Bookmark 
                          className={`w-5 h-5 transition-colors ${
                            isBookmarked 
                              ? 'fill-[var(--color-ink)] text-[var(--color-ink)]' 
                              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                          }`} 
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    {/* Category Match Breakdown Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Skills: {match.skillsScore}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Education: {match.educationScore}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Experience: {match.experienceScore}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Eligibility: {match.certsScore}%
                      </span>
                      {job.isUrgent && (
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold border border-orange-200">
                          ⚡ Urgent Hiring
                        </span>
                      )}
                      {job.openToFreshGraduates && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                          Fresh Grad Friendly
                        </span>
                      )}
                    </div>

                    {/* Inline Application Status Tracker if Applied */}
                    {existingApp && (
                      <div className="p-3 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[var(--color-ink)]">Application Stage Tracker:</span>
                          <span className="font-bold text-[var(--color-accent)]">{stageLabel}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['Pending', 'Under Review', 'Shortlisted', 'Hired'].map((st, idx) => {
                            const isDone = !isRejected && stageIdx >= idx;
                            return (
                              <div key={st} className="space-y-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    isRejected
                                      ? idx === 0
                                        ? 'bg-rose-500'
                                        : 'bg-rose-100'
                                      : isDone
                                      ? isHired
                                        ? 'bg-emerald-600'
                                        : 'bg-[var(--color-ink)]'
                                      : 'bg-slate-200'
                                  }`}
                                />
                                <span className="block text-[9px] text-center font-semibold text-[var(--color-ink-muted)]">
                                  {st}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Experience Level, Salary & Direct Apply Action */}
                    <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-[var(--color-rule)]">
                      <div>
                        <span className="font-bold text-[var(--color-ink)] text-xs sm:text-sm font-mono tabular-nums">
                          {job.salary}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink-muted)] ml-1">
                          {job.period}
                        </span>
                      </div>

                      {existingApp ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('seeker-applications');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Track Status ({stageLabel})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleQuickApply(job, e)}
                          className="btn btn--primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Apply Now</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
          </>
        )}

      </div>

      {/* FILTER DRAWER / MODAL */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 motion-safe:animate-in motion-safe:fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFilterModalOpen(false);
          }}
        >
          <div className="bg-[var(--color-paper)] rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-xl border border-[var(--color-rule)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />
                <h3 className="font-bold text-[var(--color-ink)] text-base font-display">Filter Vacancies</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-xl transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Work Setup Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-ink)] block">
                Work Setup
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['all', 'Remote', 'On-site', 'Hybrid'] as const).map((setup) => (
                  <button
                    key={setup}
                    onClick={() => setFilterWorkSetup(setup)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                      filterWorkSetup === setup
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]'
                        : 'bg-[var(--color-paper-warm)] text-[var(--color-ink)] border-[var(--color-rule)] hover:border-[var(--color-ink-muted)]'
                    }`}
                  >
                    {setup === 'all' ? 'All' : setup}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-ink)] block">
                Employment Type
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['all', 'Full-Time', 'Part-Time', 'Contract'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterJobType(type)}
                    className={`py-2 text-[11px] font-semibold rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                      filterJobType === type
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]'
                        : 'bg-[var(--color-paper-warm)] text-[var(--color-ink)] border-[var(--color-rule)] hover:border-[var(--color-ink-muted)]'
                    }`}
                  >
                    {type === 'all' ? 'All' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterWorkSetup('all');
                  setFilterJobType('all');
                  setIsFilterModalOpen(false);
                }}
                className="btn btn--quiet w-1/2 py-2.5 text-xs font-medium rounded-xl border border-[var(--color-rule)] cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="btn btn--primary w-1/2 py-2.5 text-xs font-bold rounded-xl cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION DRAWER / MODAL */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigate={onNavigate}
      />

      {/* ADVANCED JOB FILTER MODAL */}
      <JobFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filterState}
        onApplyFilters={(newFilters) => {
          setFilterState(newFilters);
          if (newFilters.workModel !== 'All') {
            setFilterWorkSetup(newFilters.workModel as any);
          }
        }}
        onResetFilters={() => {
          setFilterWorkSetup('all');
          setFilterJobType('all');
        }}
      />

    </div>
  );
};
