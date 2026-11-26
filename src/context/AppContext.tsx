import React, { createContext, useContext } from 'react';
import { ToastProvider, useToast, ToastInput } from './ToastContext';
import { NotificationProvider, useNotification } from './NotificationContext';
import { AuthProvider, useAuth } from './AuthContext';
import { DirectoryProvider, useDirectory } from './DirectoryContext';
import { ChatSocialProvider, useChatSocial } from './ChatSocialContext';
import { JobsProvider, useJobs } from './JobsContext';
import { PesoLraProvider, usePesoLra } from './PesoLraContext';
import {
  User,
  UserRole,
  EmployerProfile,
  JobSeekerProfile,
  JobPost,
  Application,
  Interview,
  NotificationItem,
  AuditLog,
  SystemAnnouncement,
  ApplicationStatus,
  EmployerStatus,
  MatchResult,
  JobAlertSubscription,
  ToastNotification,
  AssessmentResult,
  JobStatus,
  PesoReferralSlip,
  LocalRecruitmentActivity,
  LraCandidate,
  ChatMessage,
  ChatConversation,
  CompanyReview,
  ProfileViewEvent,
  CandidateInvitation,
  CandidateMatch,
  MatchResolverOptions,
} from '../types';
import { INITIAL_USERS, INITIAL_NOTIFICATIONS } from '../data/mockData';
import { getOrCalculateMatch, invalidateMatchCache } from '../utils/matchResolver';
import { COLLECTIONS, seedDemoDataToSupabase } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { markProfileCompletedInStorage } from '../utils/routeGuards';
import { saveDocument, saveDocuments } from './persistence';

export interface AppContextType {
  currentUser: User | null;
  currentEmployerProfile: EmployerProfile | null;
  currentSeekerProfile: JobSeekerProfile | null;
  users: User[];
  employers: EmployerProfile[];
  jobSeekers: JobSeekerProfile[];
  jobPosts: JobPost[];
  applications: Application[];
  interviews: Interview[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  announcements: SystemAnnouncement[];
  jobSubscriptions: JobAlertSubscription[];
  referralSlips: PesoReferralSlip[];
  localRecruitmentActivities: LocalRecruitmentActivity[];
  candidateMatches: CandidateMatch[];
  activeToast: ToastNotification | null;
  isSupabaseConnected: boolean;
  isSyncing: boolean;

  // Actions
  getMatch: (seeker: JobSeekerProfile | null | undefined, job: JobPost | null | undefined, options?: MatchResolverOptions) => MatchResult;
  switchUserRole: (userId: string | null) => void;
  switchDemoRole: (target: 'job_seeker' | 'employer' | 'admin' | string) => Promise<{ success: boolean; user?: User; role?: UserRole; error?: string }>;
  loginAs: (email: string, password?: string) => Promise<{ success: boolean; user?: User; isProfileCompleted?: boolean; seekerProfile?: JobSeekerProfile | null; employerProfile?: EmployerProfile | null; error?: string }>;
  continueWithGoogle: (intendedRole?: UserRole) => Promise<{ success: boolean; isNewUser?: boolean; user?: User; seekerProfile?: JobSeekerProfile; employerProfile?: EmployerProfile; error?: string }>;
  logout: () => void;
  sendOtp: (identifier: string) => { success: boolean; code?: string; error?: string };
  verifyOtp: (identifier: string, code: string) => { success: boolean; error?: string };
  recoverPassword: (identifier: string, code: string, newPassword: string) => { success: boolean; error?: string };
  verifyEmployer: (employerId: string, status: EmployerStatus, notes?: string) => void;
  createJobPost: (jobData: Omit<JobPost, 'id' | 'postedDate' | 'status' | 'companyVerified'>) => JobPost | null;
  reviewJobVacancy: (jobId: string, status: 'active' | 'for_compliance' | 'rejected' | 'closed', remarks?: string) => void;
  updateJobVacancyStatus: (jobId: string, status: JobStatus) => void;
  updateJobPost: (jobId: string, updates: Partial<JobPost>) => void;
  deleteJobPost: (jobId: string) => void;
  applyForJob: (jobId: string, seekerId: string, resumeId: string, coverNote?: string) => { success: boolean; message: string; application?: Application };
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => void;
  upsertCandidateApplicationStatus: (jobId: string, seekerId: string, status: ApplicationStatus, notes?: string) => Application | null;
  submitApplicationFeedback: (applicationId: string, feedback: { rating: number; comment: string; submittedBy: string }) => void;
  scheduleInterview: (interviewData: Omit<Interview, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; interview?: Interview };
  rescheduleInterview: (interviewId: string, updates: { date: string; time: string; interviewType?: Interview['interviewType']; locationOrLink?: string; instructions?: string }) => { success: boolean; message: string };
  cancelInterview: (interviewId: string, reason?: string) => void;
  respondToInterview: (interviewId: string, status: 'accepted' | 'declined' | 'reschedule_requested' | 'accept' | 'decline' | 'reschedule', notes?: string) => void;
  updateJobSeekerProfile: (seekerId: string, profileData: Partial<JobSeekerProfile>) => void;
  saveAssessmentResult: (seekerId: string, result: AssessmentResult) => void;
  updateEmployerProfile: (employerIdOrData: string | Partial<EmployerProfile>, profileData?: Partial<EmployerProfile>) => void;

  // PESO-LGU Walk-in, Referrals & LRA
  issueReferralSlip: (slipData: Omit<PesoReferralSlip, 'id' | 'createdAt' | 'referralNumber'> & { referralNumber?: string }) => PesoReferralSlip;
  updateReferralSlipStatus: (slipId: string, status: PesoReferralSlip['status'], isHots?: boolean) => void;
  encodeWalkInJobSeeker: (seekerData: Partial<JobSeekerProfile> & { firstName: string; lastName: string; contactNumber: string }) => JobSeekerProfile;
  assessJobSeekerWalkIn: (seekerId: string, assessmentData: { practicalSkills?: string[]; tradeCertifications?: string[]; geographicMobility?: 'local_only' | 'provincial' | 'willing_to_relocate'; willingToRelocateForVisitingCompanies?: boolean; walkInAssessmentNotes?: string; assessedByOfficer?: string }) => void;
  createLraEvent: (eventData: Omit<LocalRecruitmentActivity, 'id' | 'createdAt' | 'registeredApplicantsCount' | 'hotsCount' | 'interviewsConductedCount'> & Partial<LocalRecruitmentActivity>) => LocalRecruitmentActivity;
  updateLraEvent: (eventId: string, updates: Partial<LocalRecruitmentActivity>) => void;
  logHotsApplicant: (lraId: string, applicantName: string, position: string, employerId?: string, notes?: string) => void;
  nominateCandidateToLra: (lraId: string, seekerId: string, targetPosition?: string, notes?: string) => void;
  removeCandidateFromLra: (lraId: string, seekerId: string) => void;
  updateLraCandidateStatus: (lraId: string, seekerId: string, status: LraCandidate['status'], notes?: string) => void;

  addNotification: (notifData: {
    recipientId: string;
    recipientRole?: UserRole;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'action' | string;
    link?: string;
    actionUrl?: string;
  }) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (recipientId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: (recipientId: string) => void;
  registerUser: (userData: Omit<User, 'id' | 'createdAt'>, extraProfile: any) => { success: boolean; user?: User; error?: string };
  resetToDemoData: () => Promise<void>;

  // Subscription & Toast Actions
  addJobSubscription: (subData: Omit<JobAlertSubscription, 'id' | 'createdAt'>) => JobAlertSubscription;
  updateJobSubscription: (id: string, updates: Partial<JobAlertSubscription>) => void;
  deleteJobSubscription: (id: string) => void;
  showToast: (toast: ToastInput, typeOrTitle?: string) => void;
  dismissToast: () => void;
  simulateJobMatch: (subscriptionId?: string) => void;

  // Bookmarks, Chat, Reviews, Analytics
  bookmarkedJobIds: string[];
  toggleBookmarkJob: (jobId: string) => void;
  isJobBookmarked: (jobId: string) => boolean;
  conversations: ChatConversation[];
  chatMessages: ChatMessage[];
  sendChatMessage: (conversationId: string, text: string, audioUrl?: string, attachmentName?: string) => void;
  markConversationRead: (conversationId: string) => void;
  companyReviews: CompanyReview[];
  addCompanyReview: (review: Omit<CompanyReview, 'id' | 'createdAt'>) => void;
  profileViews: ProfileViewEvent[];
  withdrawApplication: (applicationId: string, notes?: string) => void;
  updateJobSeekingStatus: (seekerId: string, status: 'actively_looking' | 'passively_looking' | 'not_looking') => void;
  updateNotificationPreferences: (seekerId: string, prefs: any) => void;

  // Automated Candidate Ranking & Proactive Invitation Engine
  invitations: CandidateInvitation[];
  inviteCandidateToApply: (jobId: string, seekerId: string, customMessage?: string) => { success: boolean; message: string; invitation?: CandidateInvitation };
  respondToInvitation: (invitationId: string, status: 'accepted' | 'declined') => void;
  hasInvitedCandidate: (jobId: string, seekerId: string) => boolean;
}

const toUpperSafe = (val?: string): string | undefined => (typeof val === 'string' ? val.toUpperCase() : val);
const toUpperArraySafe = (arr?: string[]): string[] | undefined => (Array.isArray(arr) ? arr.map(s => (typeof s === 'string' ? s.toUpperCase() : s)) : arr);

export const normalizeSeekerProfileToUpperCase = (data: Partial<JobSeekerProfile>): Partial<JobSeekerProfile> => {
  const next: Partial<JobSeekerProfile> = { ...data };
  if (next.firstName !== undefined) next.firstName = toUpperSafe(next.firstName)!;
  if (next.middleName !== undefined) next.middleName = toUpperSafe(next.middleName);
  if (next.lastName !== undefined) next.lastName = toUpperSafe(next.lastName)!;
  if (next.address !== undefined) next.address = toUpperSafe(next.address)!;
  if (next.barangay !== undefined) next.barangay = toUpperSafe(next.barangay);
  if (next.primaryDegree !== undefined) next.primaryDegree = toUpperSafe(next.primaryDegree);
  if (next.professionalSummary !== undefined) next.professionalSummary = toUpperSafe(next.professionalSummary);
  if (next.summary !== undefined) next.summary = toUpperSafe(next.summary);
  if (next.bioDataDetails !== undefined) next.bioDataDetails = toUpperSafe(next.bioDataDetails);
  if (next.walkInAssessmentNotes !== undefined) next.walkInAssessmentNotes = toUpperSafe(next.walkInAssessmentNotes);
  if (next.technicalSkills !== undefined) next.technicalSkills = toUpperArraySafe(next.technicalSkills)!;
  if (next.softSkills !== undefined) next.softSkills = toUpperArraySafe(next.softSkills)!;
  if (next.tradeSkills !== undefined) next.tradeSkills = toUpperArraySafe(next.tradeSkills);
  if (next.administrativeSkills !== undefined) next.administrativeSkills = toUpperArraySafe(next.administrativeSkills);
  if (next.serviceHospitalitySkills !== undefined) next.serviceHospitalitySkills = toUpperArraySafe(next.serviceHospitalitySkills);
  if (next.salesCustomerSkills !== undefined) next.salesCustomerSkills = toUpperArraySafe(next.salesCustomerSkills);
  if (next.itCreativeSkills !== undefined) next.itCreativeSkills = toUpperArraySafe(next.itCreativeSkills);
  if (next.practicalSkills !== undefined) next.practicalSkills = toUpperArraySafe(next.practicalSkills);
  if (next.tradeCertifications !== undefined) next.tradeCertifications = toUpperArraySafe(next.tradeCertifications);

  if (Array.isArray(next.education)) {
    next.education = next.education.map(edu => ({
      ...edu,
      degreeCourse: toUpperSafe(edu.degreeCourse) || '',
      school: toUpperSafe(edu.school) || '',
      honors: toUpperSafe(edu.honors),
    }));
  }
  if (Array.isArray(next.workExperience)) {
    next.workExperience = next.workExperience.map(exp => ({
      ...exp,
      company: toUpperSafe(exp.company) || '',
      position: toUpperSafe(exp.position) || '',
      responsibilities: toUpperSafe(exp.responsibilities) || '',
    }));
  }
  if (Array.isArray(next.certifications)) {
    next.certifications = next.certifications.map(cert => ({
      ...cert,
      name: toUpperSafe(cert.name) || '',
      issuingOrganization: toUpperSafe(cert.issuingOrganization) || '',
    }));
  }
  if (Array.isArray(next.projects)) {
    next.projects = next.projects.map(proj => ({
      ...proj,
      name: toUpperSafe(proj.name) || '',
      client: toUpperSafe(proj.client),
      description: toUpperSafe(proj.description) || '',
      // Note: projectUrl is intentionally NOT uppercased
    }));
  }
  if (Array.isArray(next.volunteerExperience)) {
    next.volunteerExperience = next.volunteerExperience.map(vol => ({
      ...vol,
      role: toUpperSafe(vol.role) || '',
      organization: toUpperSafe(vol.organization) || '',
      description: toUpperSafe(vol.description) || '',
    }));
  }
  if (Array.isArray(next.awards)) {
    next.awards = next.awards.map(awd => ({
      ...awd,
      title: toUpperSafe(awd.title) || '',
      organization: toUpperSafe(awd.organization) || '',
      description: toUpperSafe(awd.description),
    }));
  }
  return next;
};

export const normalizeEmployerProfileToUpperCase = (data: Partial<EmployerProfile>): Partial<EmployerProfile> => {
  const next: Partial<EmployerProfile> = { ...data };
  if (next.companyName !== undefined) next.companyName = toUpperSafe(next.companyName)!;
  if (next.representativeName !== undefined) next.representativeName = toUpperSafe(next.representativeName)!;
  if (next.address !== undefined) next.address = toUpperSafe(next.address)!;
  if (next.barangay !== undefined) next.barangay = toUpperSafe(next.barangay);
  if (next.companyDescription !== undefined) next.companyDescription = toUpperSafe(next.companyDescription)!;
  if (next.description !== undefined) next.description = toUpperSafe(next.description);
  if (next.businessPermitNo !== undefined) next.businessPermitNo = toUpperSafe(next.businessPermitNo)!;
  if (next.dtiSecRegistration !== undefined) next.dtiSecRegistration = toUpperSafe(next.dtiSecRegistration)!;
  if (next.bir2303No !== undefined) next.bir2303No = toUpperSafe(next.bir2303No);
  // Note: email, website, logoUrl, userId, id are intentionally NOT uppercased
  return next;
};

const AppCoreContext = createContext<AppContextType | undefined>(undefined);

const AppCoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const notif = useNotification();
  const toast = useToast();
  const directory = useDirectory();
  const jobs = useJobs();
  const pesoLra = usePesoLra();
  const chatSocial = useChatSocial();

  const {
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    switchUserRole,
    switchDemoRole,
    loginAs,
    continueWithGoogle,
    logout,
    registerUser: authRegisterUser,
    sendOtp,
    verifyOtp,
    recoverPassword,
  } = auth;

  const {
    notifications,
    setNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  } = notif;

  const { activeToast, showToast, dismissToast } = toast;

  const {
    employers,
    setEmployers,
    jobSeekers,
    setJobSeekers,
    auditLogs,
    announcements,
    isSupabaseConnected,
    isSyncing,
    currentEmployerProfile,
    currentSeekerProfile,
    logAudit,
    updateEmployerProfile,
    resetDirectoryState,
  } = directory;

<<<<<<< HEAD
  const [employers, setEmployers] = useState<EmployerProfile[]>(() =>
    storageAdapter.getStoredEmployers(INITIAL_EMPLOYERS)
  );
  const [jobSeekers, setJobSeekers] = useState<JobSeekerProfile[]>(() =>
    storageAdapter.getStoredJobSeekers(INITIAL_JOB_SEEKERS)
  );
  const [jobPosts, setJobPosts] = useState<JobPost[]>(() =>
    storageAdapter.getStoredJobPosts(INITIAL_JOB_POSTS)
  );
  const [applications, setApplications] = useState<Application[]>(() =>
    storageAdapter.getStoredApplications(INITIAL_APPLICATIONS)
  );
  const [interviews, setInterviews] = useState<Interview[]>(() =>
    storageAdapter.getStoredInterviews(INITIAL_INTERVIEWS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    storageAdapter.getStoredAuditLogs(INITIAL_AUDIT_LOGS)
  );
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(() =>
    storageAdapter.getStoredAnnouncements(INITIAL_ANNOUNCEMENTS)
  );
  const [jobSubscriptions, setJobSubscriptions] = useState<JobAlertSubscription[]>(INITIAL_JOB_SUBSCRIPTIONS);
  const [referralSlips, setReferralSlips] = useState<PesoReferralSlip[]>(() =>
    storageAdapter.getStoredReferralSlips(INITIAL_REFERRAL_SLIPS)
  );
  const [localRecruitmentActivities, setLocalRecruitmentActivities] = useState<LocalRecruitmentActivity[]>(() =>
    storageAdapter.getStoredLraEvents(INITIAL_LRA_EVENTS)
  );
  const [candidateMatches, setCandidateMatches] = useState<CandidateMatch[]>(() =>
    storageAdapter.getStoredCandidateMatches([])
  );
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // Color UI State
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>(() => {
    return storageAdapter.getBookmarks(INITIAL_BOOKMARKED_JOB_IDS);
  });
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [companyReviews, setCompanyReviews] = useState<CompanyReview[]>(INITIAL_COMPANY_REVIEWS);
  const [profileViews, setProfileViews] = useState<ProfileViewEvent[]>(INITIAL_PROFILE_VIEWS);
  const [invitations, setInvitations] = useState<CandidateInvitation[]>(() => {
    return storageAdapter.getStoredInvitations([]);
  });

  useEffect(() => {
    storageAdapter.setStoredInvitations(invitations);
  }, [invitations]);

  useEffect(() => {
    storageAdapter.setBookmarks(bookmarkedJobIds);
  }, [bookmarkedJobIds]);

  useEffect(() => {
    storageAdapter.setStoredEmployers(employers);
  }, [employers]);

  useEffect(() => {
    storageAdapter.setStoredJobSeekers(jobSeekers);
  }, [jobSeekers]);

  useEffect(() => {
    storageAdapter.setStoredJobPosts(jobPosts);
  }, [jobPosts]);

  useEffect(() => {
    storageAdapter.setStoredApplications(applications);
  }, [applications]);

  useEffect(() => {
    storageAdapter.setStoredInterviews(interviews);
  }, [interviews]);

  useEffect(() => {
    storageAdapter.setStoredAuditLogs(auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    storageAdapter.setStoredAnnouncements(announcements);
  }, [announcements]);

  useEffect(() => {
    storageAdapter.setStoredReferralSlips(referralSlips);
  }, [referralSlips]);

  useEffect(() => {
    storageAdapter.setStoredLraEvents(localRecruitmentActivities);
  }, [localRecruitmentActivities]);

  useEffect(() => {
    storageAdapter.setStoredCandidateMatches(candidateMatches);
  }, [candidateMatches]);

  // Wrap registerUser so newly registered seeker/employer profiles sync immediately into AppContext (normalized to ALL CAPS)
  const registerUser = useCallback(
    (userData: Omit<User, 'id' | 'createdAt'>, extraProfile: any) => {
      const normalizedUserData = {
        ...userData,
        name: (userData.name || '').toUpperCase(),
      };
      const normalizedExtra = userData.role === 'job_seeker'
        ? normalizeSeekerProfileToUpperCase(extraProfile || {})
        : userData.role === 'employer'
        ? normalizeEmployerProfileToUpperCase(extraProfile || {})
        : extraProfile;

      const res = authRegisterUser(normalizedUserData, normalizedExtra);
      if (res.success) {
        if (res.seekerProfile) {
          const upperSeeker = { ...res.seekerProfile, ...normalizeSeekerProfileToUpperCase(res.seekerProfile) };
          setJobSeekers((prev) => {
            if (prev.some((s) => s.id === upperSeeker.id)) return prev;
            return [...prev, upperSeeker];
          });
        }
        if (res.employerProfile) {
          const upperEmployer = { ...res.employerProfile, ...normalizeEmployerProfileToUpperCase(res.employerProfile) };
          setEmployers((prev) => {
            if (prev.some((e) => e.id === upperEmployer.id)) return prev;
            return [...prev, upperEmployer];
          });
        }
      }
      return res;
    },
    [authRegisterUser]
  );

  const isInitialMount = useRef(true);

  // Initialize Supabase listeners and seed initial data
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    async function initDatabases() {
      setIsSyncing(true);

      // 1. Initialize Supabase if configured with credentials
      if (isSupabaseConfigured()) {
        try {
          const conn = await testSupabaseConnection();
          if (conn.connected) {
            console.log(`[Supabase] Connected to Roxas PostgreSQL database (${conn.latencyMs}ms). Initializing real-time listeners...`);
            setIsSupabaseConnected(true);
            await ensureDemoAccountsExistInSupabase();

            unsubs.push(
              subscribeToSupabaseTable<EmployerProfile>(SUPABASE_TABLES.EMPLOYERS, (data) => {
                if (data && data.length > 0) {
                  setEmployers(prev => {
                    const map = new Map<string, EmployerProfile>();
                    prev.forEach(e => map.set(e.id, e));
                    data.forEach(e => map.set(e.id, e));
                    return Array.from(map.values());
                  });
                }
              })
            );

            unsubs.push(
              subscribeToSupabaseTable<JobSeekerProfile>(SUPABASE_TABLES.JOB_SEEKERS, (data) => {
                if (data && data.length > 0) {
                  setJobSeekers(prev => {
                    const map = new Map<string, JobSeekerProfile>();
                    prev.forEach(s => map.set(s.id, s));
                    data.forEach(s => {
                      const existing = map.get(s.id);
                      const isCompleted = Boolean(
                        s.isProfileCompleted || 
                        existing?.isProfileCompleted || 
                        storageAdapter.isProfileCompletedInStorage(s.id) ||
                        (s.userId && storageAdapter.isProfileCompletedInStorage(s.userId)) ||
                        (s.email && storageAdapter.isProfileCompletedInStorage(s.email))
                      );
                      map.set(s.id, { ...s, isProfileCompleted: isCompleted });
                    });
                    return Array.from(map.values());
                  });
                }
              })
            );

            unsubs.push(
              subscribeToSupabaseTable<JobPost>(SUPABASE_TABLES.JOB_POSTS, (data) => {
                if (data && data.length > 0) setJobPosts(data);
              }),
              subscribeToSupabaseTable<Application>(SUPABASE_TABLES.APPLICATIONS, (data) => {
                if (data && data.length > 0) setApplications(data);
              }),
              subscribeToSupabaseTable<Interview>(SUPABASE_TABLES.INTERVIEWS, (data) => {
                if (data && data.length > 0) setInterviews(data);
              })
            );

            unsubs.push(
              subscribeToSupabaseTable<AuditLog>(SUPABASE_TABLES.AUDIT_LOGS, (data) => {
                if (data && data.length > 0) {
                  const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  setAuditLogs(sorted);
                }
              })
            );

            unsubs.push(
              subscribeToSupabaseTable<SystemAnnouncement>(SUPABASE_TABLES.ANNOUNCEMENTS, (data) => {
                if (data && data.length > 0) setAnnouncements(data);
              }),
              subscribeToSupabaseTable<JobAlertSubscription>(SUPABASE_TABLES.JOB_SUBSCRIPTIONS, (data) => {
                if (data && data.length > 0) setJobSubscriptions(data);
              }),
              subscribeToSupabaseTable<PesoReferralSlip>(SUPABASE_TABLES.REFERRAL_SLIPS, (data) => {
                if (data && data.length > 0) setReferralSlips(data);
              }),
              subscribeToSupabaseTable<LocalRecruitmentActivity>(SUPABASE_TABLES.LRA_EVENTS, (data) => {
                if (data && data.length > 0) setLocalRecruitmentActivities(data);
              }),
              subscribeToSupabaseTable<CandidateMatch>(SUPABASE_TABLES.CANDIDATE_MATCHES, (data) => {
                if (data && data.length > 0) setCandidateMatches(data);
              })
            );
          }
        } catch (sbErr) {
          console.warn('[Supabase] Initialization warning, continuing with local store:', sbErr);
        }
      } else {
        console.log('[Supabase] Running in local offline state mode with seed fixtures.');
      }

      setIsSyncing(false);
    }

    initDatabases();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Derived current profiles for logged-in user
  const currentEmployerProfile = currentUser?.role === 'employer' 
    ? employers.find(e => e.userId === currentUser.id || e.id === currentUser.id) || null
    : null;

  const currentSeekerProfile = currentUser?.role === 'job_seeker' 
    ? (() => {
        const found = jobSeekers.find(s => 
          s.userId === currentUser.id || 
          s.id === currentUser.id || 
          (s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        const isLocallyCompleted = isSeekerProfileComplete(currentUser, found);

        if (!found) {
          if (isLocallyCompleted) {
            const synthesized: JobSeekerProfile = {
              id: `seeker-${currentUser.id}`,
              userId: currentUser.id,
              firstName: currentUser.name.split(' ')[0] || 'User',
              lastName: currentUser.name.split(' ').slice(1).join(' ') || 'Roxas',
              email: currentUser.email,
              contactNumber: currentUser.phone || '',
              dateOfBirth: '2000-01-01',
              address: 'Brgy. Bagumbayan, Roxas, Oriental Mindoro',
              municipality: 'Roxas',
              professionalSummary: 'Registered job seeker on eHANAP Roxas.',
              educationalAttainment: "College Graduate",
              primaryDegree: 'BS Information Technology',
              technicalSkills: ['Computer Literacy', 'Cash Handling', 'POS Operation', 'Customer Service'],
              softSkills: ['Communication', 'Teamwork', 'Problem Solving'],
              tradeSkills: ['Computer Hardware Servicing'],
              practicalSkills: ['POS Terminal Operation', 'Customer Assistance'],
              education: [],
              workExperience: [],
              certifications: [],
              resumes: [],
              jobPreferences: {
                categories: ['Customer Service & Retail', 'Information Technology & Software'],
                municipalities: ['Roxas'],
                employmentTypes: ['Full-time'],
                minSalary: '12000'
              },
              isProfileCompleted: true,
              updatedAt: new Date().toISOString()
            };
            return synthesized;
          }
          // If not completed, return basic uncompleted profile so seeker must complete setup wizard
          const uncompletedBase: JobSeekerProfile = {
            id: `seeker-${currentUser.id}`,
            userId: currentUser.id,
            firstName: currentUser.name.split(' ')[0] || 'User',
            lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
            dateOfBirth: '2000-01-01',
            email: currentUser.email,
            contactNumber: currentUser.phone || '',
            address: 'Roxas, Oriental Mindoro',
            municipality: 'Roxas',
            professionalSummary: 'Registered job seeker on eHANAP Roxas.',
            educationalAttainment: "College Graduate",
            primaryDegree: '',
            technicalSkills: [],
            softSkills: [],
            education: [],
            workExperience: [],
            certifications: [],
            resumes: [],
            isProfileCompleted: false,
            updatedAt: new Date().toISOString()
          };
          return uncompletedBase;
        }

        if (isLocallyCompleted && !found.isProfileCompleted) {
          return { ...found, isProfileCompleted: true };
        }
        return found;
      })()
    : null;

  // Audit Logger Helper
  const logAudit = (action: string, entity: string, entityId: string | undefined, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveDocument(COLLECTIONS.AUDIT_LOGS, newLog);
  };

  // Verify Employer (Admin Action - Enforces Profile & Uploaded Document Completeness Gate)
  const verifyEmployer = (employerId: string, status: EmployerStatus, notes?: string) => {
    const emp = employers.find(e => e.id === employerId);
    if (emp) {
      const hasProfileDetails = Boolean(
        emp.isProfileCompleted &&
        emp.companyName?.trim() &&
        emp.representativeName?.trim() &&
        emp.contactNumber?.trim() &&
        emp.address?.trim()
      );
      const hasUploadedDocs = Boolean(
        (emp.documents && emp.documents.length > 0) ||
        emp.dtiSecFile?.trim() ||
        emp.mayorsPermitFile?.trim() ||
        emp.businessPermitFile?.trim() ||
        emp.barangayClearanceFile?.trim()
      );

      if (status === 'verified' && (!hasProfileDetails || !hasUploadedDocs)) {
        showToast({
          title: 'Verification Blocked: Incomplete Requirements',
          message: 'Cannot verify an employer whose profile is incomplete or who has zero uploaded verification documents.',
          type: 'alert',
        });
        return;
      }

      const updated: EmployerProfile = { 
        ...emp, 
        status, 
=======
  // Cross-domain: verifying an employer updates employer profile, sends notification, and updates their job posts
  const verifyEmployer = (employerId: string, status: EmployerStatus, notes?: string) => {
    const emp = employers.find(e => e.id === employerId);
    if (emp) {
      const updated: EmployerProfile = {
        ...emp,
        status,
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
        verificationNotes: notes || emp.verificationNotes,
        complianceRemarks: (status === 'for_compliance' || status === 'rejected') ? (notes || 'Additional requirements needed.') : emp.complianceRemarks,
      };

      setEmployers(prev => prev.map(e => e.id === employerId ? updated : e));
      saveDocument(COLLECTIONS.EMPLOYERS, updated);

      const notifItem: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: emp.userId,
        recipientRole: 'employer',
<<<<<<< HEAD
        title: status === 'verified' 
          ? 'Employer Verification Approved!' 
          : status === 'for_compliance' 
          ? 'Employer Verification: Additional Compliance Required' 
          : status === 'rejected'
          ? 'Employer Verification Not Approved — Action Required'
          : `Employer Status Updated to ${status.replace(/_/g, ' ').toUpperCase()}`,
        message: status === 'verified' 
          ? 'Your business requirements have been verified by PESO Oriental Mindoro. You may now create and publish job vacancies.'
          : status === 'for_compliance' || status === 'rejected'
          ? `PESO Oriental Mindoro reviewed your documents: ${notes || 'Please re-upload clear copies of your business verification documents in the Profile tab.'}`
=======
        title: status === 'verified'
          ? 'Employer Verification Approved!'
          : status === 'for_compliance'
          ? 'Employer Verification: Additional Compliance Required'
          : `Employer Status Updated to ${status.toUpperCase()}`,
        message: status === 'verified'
          ? 'Your business requirements have been verified by PESO Oriental Mindoro. You may now create and submit job vacancies.'
          : status === 'for_compliance'
          ? `PESO Oriental Mindoro requested compliance updates: ${notes || 'Please provide required business permits and accreditation documents.'}`
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
          : `Your employer account status was updated: ${notes || status}`,
        type: status === 'verified' ? 'success' : 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        link: status === 'verified' ? 'employer-dashboard' : 'employer-profile',
      };
      setNotifications(n => [notifItem, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notifItem);

      const updatedJobs = jobs.jobPosts
        .filter(j => j.employerId === employerId)
        .map(job => ({ ...job, companyVerified: status === 'verified' }));
      if (updatedJobs.length > 0) {
        saveDocuments(COLLECTIONS.JOB_POSTS, updatedJobs);
        jobs.setJobPosts(prev => prev.map(job =>
          job.employerId === employerId ? { ...job, companyVerified: status === 'verified' } : job
        ));
      }

      logAudit('EMPLOYER_STATUS_CHANGED', 'EmployerProfile', employerId, `Status updated to ${status}. Notes: ${notes || 'N/A'}`);
    }
  };

<<<<<<< HEAD
  // Create Job Post (Verified Employer Action - Strictly Enforces 3-Point Verification Gate)
  const createJobPost = (jobData: Omit<JobPost, 'id' | 'postedDate' | 'status' | 'companyVerified'>): JobPost | null => {
    const emp = employers.find(e => e.id === jobData.employerId) || currentEmployerProfile;
    const isProfileCompleteFlag = Boolean(
      emp?.isProfileCompleted &&
      emp?.companyName?.trim() &&
      emp?.representativeName?.trim() &&
      emp?.contactNumber?.trim() &&
      emp?.address?.trim()
    );
    const hasUploadedDocs = Boolean(
      (emp?.documents && emp.documents.length > 0) ||
      emp?.dtiSecFile?.trim() ||
      emp?.mayorsPermitFile?.trim() ||
      emp?.businessPermitFile?.trim() ||
      emp?.barangayClearanceFile?.trim()
    );
    const isVerified = emp?.status === 'verified';

    if (!isProfileCompleteFlag || !hasUploadedDocs || !isVerified) {
      showToast({
        title: 'Job Posting Locked — Verification Required',
        message: 'You must complete your employer profile, upload your business verification documents, and be officially verified by PESO/LGU before posting a job vacancy.',
        type: 'alert',
      });
      return null;
    }

    const newJob: JobPost = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      companyVerified: true,
    };

    setJobPosts(prev => [newJob, ...prev]);
    saveDocument(COLLECTIONS.JOB_POSTS, newJob);

    // Notify Admin of the new job vacancy
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientId: adminUser.id,
        recipientRole: 'admin',
        title: isVerified
          ? `New Verified Job Vacancy Published: ${newJob.title}`
          : 'New Job Vacancy Pending PESO Review',
        message: isVerified
          ? `${newJob.companyName} published "${newJob.title}" (${newJob.municipality}). Automated matching engine has evaluated registered and walk-in applicants.`
          : `${newJob.companyName} submitted "${newJob.title}" (${newJob.municipality}) for vacancy review & publication approval.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: isVerified ? '/admin/job-matching' : '/admin/jobs',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    // Automatically run matching engine when a verified employer posts a job
    if (newJob.status === 'active') {
      checkJobSubscriptionsAndNotify(newJob);
      notifyAndCacheCandidateMatches(newJob);
    }

    logAudit('JOB_CREATED', 'JobPost', newJob.id, `Created job posting: "${newJob.title}" in ${newJob.municipality} (Status: ${newJob.status})`);
    return newJob;
  };

  // Review Job Vacancy (PESO-LGU Admin Action)
  const reviewJobVacancy = (jobId: string, status: 'active' | 'for_compliance' | 'rejected' | 'closed', remarks?: string) => {
    const job = jobPosts.find(j => j.id === jobId);
    if (job) {
      const updated: JobPost = {
        ...job,
        status: status as JobStatus,
        reviewNotes: remarks || job.reviewNotes,
        complianceRemarks: status === 'for_compliance' ? remarks : job.complianceRemarks,
      };
      setJobPosts(prev => prev.map(j => j.id === jobId ? updated : j));
      saveDocument(COLLECTIONS.JOB_POSTS, updated);

      // Notify Employer
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientId: job.employerId,
        recipientRole: 'employer',
        title: status === 'active' 
          ? 'Job Vacancy Approved & Published!' 
          : status === 'for_compliance' 
          ? 'Job Vacancy Returned for Compliance' 
          : status === 'closed'
          ? 'Job Vacancy Closed'
          : 'Job Vacancy Review: Not Approved',
        message: status === 'active'
          ? `Your job vacancy "${job.title}" has been approved by PESO-LGU and is now published and open for applicant matching.`
          : status === 'closed'
          ? `Your job vacancy "${job.title}" has been marked as closed.`
          : `PESO-LGU reviewed "${job.title}": ${remarks || status}`,
        type: status === 'active' ? 'success' : status === 'for_compliance' ? 'warning' : 'action',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/employer/dashboard',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);

      if (status === 'active') {
        checkJobSubscriptionsAndNotify(updated);
        notifyAndCacheCandidateMatches(updated);
      }

      logAudit('JOB_REVIEWED', 'JobPost', jobId, `PESO-LGU reviewed vacancy. Status: ${status}. Remarks: ${remarks || 'None'}`);
    }
  };

  // Automatically evaluate and notify matching job seekers AND LGU/PESO Admin (for walk-in applicants) when a job vacancy is published
  const notifyAndCacheCandidateMatches = (job: JobPost, seekersToEvaluate: JobSeekerProfile[] = jobSeekers) => {
    const newMatches: CandidateMatch[] = [];
    const adminUser = users.find(u => u.role === 'admin');

    seekersToEvaluate.forEach(seeker => {
      const matchResult = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });
      const overallPct = Math.round(matchResult.overallMatch);

      const candidateMatchRecord: CandidateMatch = {
        id: `match-${job.id}-${seeker.id}`,
        jobId: job.id,
        jobSeekerId: seeker.id,
        overallMatch: matchResult.overallMatch,
        outcome: matchResult.outcome,
        educationMatchScore: matchResult.educationMatchScore,
        degreeAlignmentScore: matchResult.degreeAlignmentScore,
        skillsMatchScore: matchResult.skillsMatchScore,
        experienceMatchScore: matchResult.experienceMatchScore,
        certificationsMatchScore: matchResult.certificationsMatchScore,
        matchedReasons: matchResult.matchedReasons,
        missingQualifications: matchResult.missingQualifications,
        decisionReason: matchResult.matchedReasons.slice(0, 3).join('; ') || 'Decision Tree evaluation',
        calculatedAt: new Date().toISOString(),
      };

      newMatches.push(candidateMatchRecord);

      // Cache candidate match in Supabase
      if (isSupabaseConfigured()) {
        saveSupabaseRecord(SUPABASE_TABLES.CANDIDATE_MATCHES, candidateMatchRecord).catch(err => {
          console.warn('[Supabase] Candidate match cache warning:', err);
        });
      }

      // 1. If Walk-In Applicant matches the job (overallMatch >= 50%), automatically notify LGU/PESO Admin with full contact & match breakdown
      const isWalkInApplicant = Boolean(seeker.isWalkIn || seeker.registrationType === 'walk_in');
      if (isWalkInApplicant && overallPct >= 50) {
        const seekerFullName = `${seeker.firstName} ${seeker.lastName}`.trim();
        const contactSummary = [
          seeker.contactNumber ? `Phone: ${seeker.contactNumber}` : null,
          seeker.email ? `Email: ${seeker.email}` : null,
          seeker.barangay ? `Brgy. ${seeker.barangay}, ${seeker.municipality || 'Roxas'}` : seeker.address,
        ].filter(Boolean).join(' • ');

        const breakdownSummary = `Skills: ${Math.round(matchResult.skillsMatchScore)}% | Education: ${Math.round(matchResult.educationMatchScore)}% | Degree: ${Math.round(matchResult.degreeAlignmentScore)}% | Experience: ${Math.round(matchResult.experienceMatchScore)}% | Certs: ${Math.round(matchResult.certificationsMatchScore)}%`;

        const walkInAdminNotif: NotificationItem = {
          id: `notif-walkin-match-${Date.now()}-${job.id}-${seeker.id}`,
          recipientId: adminUser?.id || 'admin',
          recipientRole: 'admin',
          title: `📞 Walk-In Match Outreach Required: ${seekerFullName} → ${job.title} (${overallPct}% Match)`,
          message: `Walk-in applicant ${seekerFullName} (${contactSummary}) matched "${job.title}" at ${job.companyName} with ${overallPct}% compatibility (${matchResult.outcome}). Breakdown: [${breakdownSummary}]. Please contact the applicant to confirm if they want to proceed and update their hiring status.`,
          type: 'action',
          read: false,
          createdAt: new Date().toISOString(),
          link: 'admin-job-matching',
        };
        setNotifications(prev => [walkInAdminNotif, ...prev]);
        saveDocument(COLLECTIONS.NOTIFICATIONS, walkInAdminNotif);
      }

      // 2. If qualification threshold >= 60%, dispatch real-time Match Alert notification to the Job Seeker
      if (overallPct >= 60) {
        const matchNotif: NotificationItem = {
          id: `notif-match-${Date.now()}-${seeker.id}`,
          recipientId: seeker.userId,
          recipientRole: 'job_seeker',
          title: `Job Match Found: ${job.title} (${overallPct}%)`,
          message: `${job.companyName} has published "${job.title}" in ${job.municipality}, which aligns with your profile (${overallPct}% Decision Tree compatibility)!`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/seeker/dashboard',
        };
        setNotifications(prev => [matchNotif, ...prev]);
        saveDocument(COLLECTIONS.NOTIFICATIONS, matchNotif);

        if (currentUser?.id === seeker.userId) {
          showToast({
            title: `High Match Vacancy Available!`,
            message: `${job.companyName} posted "${job.title}" (${overallPct}% Match). Apply now!`,
            jobId: job.id,
            companyName: job.companyName,
            municipality: job.municipality,
            category: job.category,
          });
        }
      }
    });

    if (newMatches.length > 0) {
      setCandidateMatches(prev => {
        const map = new Map<string, CandidateMatch>();
        prev.forEach(m => map.set(`${m.jobId}:${m.jobSeekerId}`, m));
        newMatches.forEach(m => map.set(`${m.jobId}:${m.jobSeekerId}`, m));
        return Array.from(map.values());
      });
    }
  };

  // Update Job Vacancy Status (Employer Action: Close / Reopen)
  const updateJobVacancyStatus = (jobId: string, status: JobStatus) => {
    updateJobPost(jobId, { status });
  };

  // Submit Application Feedback / Rating
  const submitApplicationFeedback = (applicationId: string, feedback: { rating: number; comment: string; submittedBy: string }) => {
    const app = applications.find(a => a.id === applicationId);
    if (app) {
      const updated: Application = {
        ...app,
        feedback: {
          ...feedback,
          submittedAt: new Date().toISOString(),
        }
      };
      setApplications(prev => prev.map(a => a.id === applicationId ? updated : a));
      saveDocument(COLLECTIONS.APPLICATIONS, updated);
      logAudit('APPLICATION_FEEDBACK_SUBMITTED', 'Application', applicationId, `Feedback rating: ${feedback.rating}/5`);
    }
  };

  // Update Job Post
  const updateJobPost = (jobId: string, updates: Partial<JobPost>) => {
    setJobPosts(prev => prev.map(j => {
      if (j.id === jobId) {
        const updated = { ...j, ...updates, updatedAt: new Date().toISOString() };
        saveDocument(COLLECTIONS.JOB_POSTS, updated);
        return updated;
      }
      return j;
    }));
    invalidateMatchCache(undefined, jobId);
    logAudit('JOB_UPDATED', 'JobPost', jobId, `Updated job details`);
  };

  // Delete Job Post
  const deleteJobPost = (jobId: string) => {
    setJobPosts(prev => prev.filter(j => j.id !== jobId));
    deleteDocument(COLLECTIONS.JOB_POSTS, jobId);
    logAudit('JOB_DELETED', 'JobPost', jobId, `Deleted job vacancy`);
  };

  // Apply for Job (Job Seeker Action)
  const applyForJob = (jobId: string, seekerId: string, resumeId: string, coverNote?: string) => {
    const job = jobPosts.find(j => j.id === jobId);
    const seeker = jobSeekers.find(s => s.id === seekerId);

    if (!job || !seeker) {
      return { success: false, message: 'Job posting or applicant record not found.' };
    }

    // Check if already applied
    const existing = applications.find(a => a.jobId === jobId && a.jobSeekerId === seekerId);
    if (existing) {
      return { success: false, message: 'You have already submitted an application for this position.' };
    }

    // Check if job active
    if (job.status !== 'active') {
      return { success: false, message: 'This job vacancy is no longer accepting applications.' };
    }

    // Calculate Decision Tree Match Score (prioritizes pre-computed candidate match)
    const matchResult: MatchResult = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });

    // Run ATS Resume Evaluation & Tracking Scanner
    const selectedResume = seeker.resumes?.find(r => r.id === resumeId);
    const atsResult = evaluateResumeForAts(
      {
        ...seeker,
        fileName: selectedResume?.fileName,
        extractedSkills: selectedResume?.extractedSkills || seeker.technicalSkills,
        extractedDegree: selectedResume?.extractedDegree || seeker.primaryDegree,
        extractedEducation: selectedResume?.extractedEducation || seeker.educationalAttainment,
        extractedExperienceYears: selectedResume?.extractedExperienceYears,
      },
      job
    );

    const initialHistory: Application['statusHistory'] = [
      {
        status: 'submitted',
        updatedAt: new Date().toISOString(),
        updatedBy: `${seeker.firstName} ${seeker.lastName}`,
        notes: coverNote
          ? `Application submitted with note: "${coverNote.slice(0, 100)}${coverNote.length > 100 ? '...' : ''}"`
          : 'Application submitted via eHANAP platform.',
      }
    ];

    // Automatically record ATS screening verification
    if (atsResult.score >= 50) {
      initialHistory.push({
        status: 'ats_screened',
        updatedAt: new Date().toISOString(),
        updatedBy: 'eHANAP ATS Engine',
        notes: `ATS Audit passed with score ${atsResult.score}/100 (Grade ${atsResult.grade}, ${atsResult.matchedKeywords.length} matching job keywords).`,
      });
    }

    const newApp: Application = {
      id: `app-${Date.now()}`,
      jobId,
      jobSeekerId: seekerId,
      employerId: job.employerId,
      appliedDate: new Date().toISOString(),
      resumeId,
      coverNote: coverNote?.trim() || undefined,
      currentStatus: atsResult.score >= 60 ? 'ats_screened' : 'submitted',
      matchResult,
      matchScore: matchResult.overallMatch,
      applicantName: `${seeker.firstName} ${seeker.lastName}`,
      decisionTreeOutcome: matchResult.outcome,
      atsScore: atsResult.score,
      atsResult,
      statusHistory: initialHistory,
    };

    setApplications(prev => [newApp, ...prev]);
    saveDocument(COLLECTIONS.APPLICATIONS, newApp);

    // Check if there was a pending Scout / Invitation for this job & seeker and mark it accepted
    const pendingInvite = invitations.find(
      inv => (inv.jobId === jobId || inv.vacancyId === jobId) && (inv.jobSeekerId === seekerId || inv.seekerId === seekerId) && inv.status === 'pending'
    );
    if (pendingInvite) {
      const nowIso = new Date().toISOString();
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === pendingInvite.id
            ? { ...inv, status: 'accepted', respondedAt: nowIso }
            : inv
        )
      );
    }

    // Notify Employer
    const employerUser = users.find(u => u.role === 'employer' && employers.some(e => e.id === job.employerId && e.userId === u.id));
    const employerRecipientId = employerUser?.id || employers.find(e => e.id === job.employerId)?.userId || job.employerId;
    if (employerRecipientId) {
      const seekerUpperName = `${seeker.firstName} ${seeker.lastName}`.trim().toUpperCase();
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientId: employerRecipientId,
        recipientRole: 'employer',
        title: pendingInvite
          ? `Scouted Candidate Accepted & Applied: ${seekerUpperName}`
          : 'New Job Application Received',
        message: pendingInvite
          ? `${seekerUpperName} accepted your scout invitation and submitted an official application for "${job.title}" (${Math.round(matchResult.overallMatch)}% AI Match).`
          : `${seekerUpperName} applied for "${job.title}" (${Math.round(matchResult.overallMatch)}% Decision Tree Match).`,
        type: pendingInvite ? 'success' : 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: 'employer-applicants',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('APPLICATION_SUBMITTED', 'Application', newApp.id, `Applied for "${job.title}" with match score ${matchResult.overallMatch}%`);

    return { success: true, message: 'Application submitted successfully!', application: newApp };
  };

  // Update Application Status (Employer)
  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus, notes?: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        const job = jobPosts.find(j => j.id === app.jobId);
        const seeker = jobSeekers.find(s => s.id === app.jobSeekerId);

        const newHistory = [
          ...app.statusHistory,
          {
            status,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'System',
            notes,
          }
        ];

        const updatedApp = { ...app, currentStatus: status, statusHistory: newHistory, notes };
        saveDocument(COLLECTIONS.APPLICATIONS, updatedApp);

        // Notify Seeker
        if (seeker) {
          const seekerUser = users.find(u => u.id === seeker.userId);
          if (seekerUser) {
            const notif: NotificationItem = {
              id: `notif-${Date.now()}`,
              recipientId: seekerUser.id,
              recipientRole: 'job_seeker',
              title: status === 'hired' 
                ? `🎉 Congratulations! You are HIRED by ${job?.companyName || 'Employer'}!`
                : `Application Status: ${(status || '').replace(/_/g, ' ').toUpperCase()}`,
              message: status === 'hired'
                ? `Congratulations ${seeker.firstName}! ${job?.companyName || 'Your employer'} has officially hired you for "${job?.title}". Please check your application dashboard for onboarding instructions.`
                : `Your application for "${job?.title || 'Position'}" at ${job?.companyName || 'Company'} is now: ${(status || '').replace(/_/g, ' ').toUpperCase()}.`,
              type: status === 'hired' ? 'success' : 'info',
              read: false,
              createdAt: new Date().toISOString(),
              link: '/seeker/applications',
            };
            setNotifications(n => [notif, ...n]);
            saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
          }

          // If hired, update seeker's employment status and current employer
          if (status === 'hired') {
            const updatedSeeker: JobSeekerProfile = {
              ...seeker,
              employmentStatus: 'hired',
              currentEmployer: job?.companyName || 'Registered Employer',
              hiredPosition: job?.title || 'Job Opening',
              hiredAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setJobSeekers(prev => prev.map(s => s.id === seeker.id ? updatedSeeker : s));
            saveDocument(COLLECTIONS.JOB_SEEKERS, updatedSeeker);
          }
        }

        return updatedApp;
      }
      return app;
    }));

    logAudit('APPLICATION_STATUS_UPDATED', 'Application', applicationId, `Status changed to ${status}`);
  };

  // Upsert Candidate Application Status (allows Employers & PESO Admin to update status directly from ranked match lists or walk-in outreach)
  const upsertCandidateApplicationStatus = (
    jobId: string,
    seekerId: string,
    status: ApplicationStatus,
    notes?: string
  ): Application | null => {
    const existingApp = applications.find(a => a.jobId === jobId && a.jobSeekerId === seekerId);
    if (existingApp) {
      updateApplicationStatus(existingApp.id, status, notes);
      return { ...existingApp, currentStatus: status };
    }

    const job = jobPosts.find(j => j.id === jobId);
    const seeker = jobSeekers.find(s => s.id === seekerId);
    if (!job || !seeker) return null;

    const matchResult = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });
    const selectedResume = seeker.resumes?.[0];
    const atsResult = evaluateResumeForAts(
      {
        ...seeker,
        fileName: selectedResume?.fileName,
        extractedSkills: selectedResume?.extractedSkills || seeker.technicalSkills,
        extractedDegree: selectedResume?.extractedDegree || seeker.primaryDegree,
        extractedEducation: selectedResume?.extractedEducation || seeker.educationalAttainment,
        extractedExperienceYears: selectedResume?.extractedExperienceYears,
      },
      job
    );

    const actorName = currentUser?.name || (currentUser?.role === 'admin' ? 'LGU/PESO Admin' : job.companyName);
    const newApp: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      jobId,
      jobSeekerId: seekerId,
      employerId: job.employerId,
      appliedDate: new Date().toISOString(),
      resumeId: seeker.activeResumeId || selectedResume?.id || 'walk-in-biodata',
      currentStatus: status,
      matchResult,
      matchScore: matchResult.overallMatch,
      applicantName: `${seeker.firstName} ${seeker.lastName}`.trim(),
      decisionTreeOutcome: matchResult.outcome,
      atsScore: atsResult.score,
      atsResult,
      notes,
      statusHistory: [
        {
          status,
          updatedAt: new Date().toISOString(),
          updatedBy: actorName,
          notes: notes || (seeker.isWalkIn ? 'Walk-in applicant confirmed via PESO outreach.' : `Application status set to ${status.replace(/_/g, ' ')}.`),
        },
      ],
    };

    setApplications(prev => [newApp, ...prev]);
    saveDocument(COLLECTIONS.APPLICATIONS, newApp);

    // Notify Seeker
    if (seeker.userId) {
      const notifItem: NotificationItem = {
        id: `notif-${Date.now()}-seeker`,
        recipientId: seeker.userId,
        recipientRole: 'job_seeker',
        title: status === 'hired'
          ? `🎉 Congratulations! You are HIRED by ${job.companyName}!`
          : `Application Status Updated: ${status.replace(/_/g, ' ').toUpperCase()}`,
        message: status === 'hired'
          ? `Congratulations ${seeker.firstName}! ${job.companyName} has officially hired you for "${job.title}".`
          : `Your application status for "${job.title}" at ${job.companyName} is now: ${status.replace(/_/g, ' ').toUpperCase()}.${notes ? ` Remarks: ${notes}` : ''}`,
        type: status === 'hired' ? 'success' : 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/seeker/applications',
      };
      setNotifications(n => [notifItem, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notifItem);
    }

    // Notify Employer if updated by PESO Admin
    if (currentUser?.role === 'admin') {
      const emp = employers.find(e => e.id === job.employerId);
      if (emp) {
        const empNotif: NotificationItem = {
          id: `notif-${Date.now()}-emp`,
          recipientId: emp.userId,
          recipientRole: 'employer',
          title: `PESO Walk-In Applicant Confirmed: ${seeker.firstName} ${seeker.lastName}`,
          message: `LGU/PESO confirmed walk-in applicant ${seeker.firstName} ${seeker.lastName} (${Math.round(matchResult.overallMatch)}% Match) for "${job.title}" with status: ${status.replace(/_/g, ' ').toUpperCase()}.`,
          type: 'action',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/employer/applicants',
        };
        setNotifications(n => [empNotif, ...n]);
        saveDocument(COLLECTIONS.NOTIFICATIONS, empNotif);
      }
    }

    if (status === 'hired') {
      const updatedSeeker: JobSeekerProfile = {
        ...seeker,
        employmentStatus: 'hired',
        currentEmployer: job.companyName,
        hiredPosition: job.title,
        hiredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setJobSeekers(prev => prev.map(s => s.id === seeker.id ? updatedSeeker : s));
      saveDocument(COLLECTIONS.JOB_SEEKERS, updatedSeeker);
    }

    logAudit('APPLICATION_UPSERTED', 'Application', newApp.id, `Set candidate ${seeker.firstName} ${seeker.lastName} status for "${job.title}" to ${status}`);
    return newApp;
  };

  // Schedule Interview (with Schedule Validation & Direct Built-In Calendar Sync)
  const scheduleInterview = (interviewData: Omit<Interview, 'id' | 'createdAt' | 'status'>) => {
    // Validation checks:
    // 1. Check if applicant already has a confirmed/scheduled interview at the same date & time
    const seekerConflict = interviews.find(i => 
      (i.jobSeekerId === interviewData.jobSeekerId || i.seekerId === interviewData.jobSeekerId) &&
      i.date === interviewData.date &&
      i.time === interviewData.time &&
      (i.status === 'scheduled' || i.status === 'rescheduled' || i.status === 'accepted')
    );

    if (seekerConflict) {
      return {
        success: false,
        message: `Conflict detected: Applicant ${interviewData.applicantName} already has another interview scheduled on ${interviewData.date} at ${interviewData.time}.`
      };
    }

    // 2. Check if employer has conflicting interview
    const employerConflict = interviews.find(i => 
      i.employerId === interviewData.employerId &&
      i.date === interviewData.date &&
      i.time === interviewData.time &&
      (i.status === 'scheduled' || i.status === 'rescheduled' || i.status === 'accepted')
    );

    if (employerConflict) {
      return {
        success: false,
        message: `Conflict detected: Employer already has another interview booked on ${interviewData.date} at ${interviewData.time}.`
      };
    }

    const normalizedFormat = interviewData.interviewType || interviewData.format || 'video';
    const normalizedLocation =
      normalizedFormat === 'face_to_face'
        ? (interviewData.locationOrLink || '').toUpperCase()
        : interviewData.locationOrLink;
    const normalizedNotes = (interviewData.instructions || interviewData.notes || '').toUpperCase();

    const newInterview: Interview = {
      ...interviewData,
      id: `int-${Date.now()}`,
      vacancyId: interviewData.jobId || interviewData.vacancyId,
      seekerId: interviewData.jobSeekerId || interviewData.seekerId,
      applicantName: (interviewData.applicantName || '').toUpperCase(),
      companyName: (interviewData.companyName || '').toUpperCase(),
      interviewType: normalizedFormat,
      format: normalizedFormat,
      locationOrLink: normalizedLocation,
      instructions: normalizedNotes,
      notes: normalizedNotes,
      status: 'scheduled',
      remindersSent: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInterviews(prev => [newInterview, ...prev]);
    saveDocument(COLLECTIONS.INTERVIEWS, newInterview);

    // Update application status to for_interview / interview_scheduled
    updateApplicationStatus(interviewData.applicationId, 'interview_scheduled', `Interview scheduled for ${interviewData.date} at ${interviewData.time}`);

    // Notify Job Seeker immediately in-app with link to Calendar tab
    const seeker = jobSeekers.find(s => s.id === interviewData.jobSeekerId);
    if (seeker) {
      const formatLabel =
        normalizedFormat === 'video'
          ? 'Online / Video'
          : normalizedFormat === 'face_to_face'
          ? 'On-Site / Office'
          : 'Phone';
      const notif: NotificationItem = {
        id: `notif-int-${Date.now()}`,
        recipientId: seeker.userId || seeker.id,
        recipientRole: 'job_seeker',
        title: `📅 Interview Scheduled: ${interviewData.jobTitle}`,
        message: `${interviewData.companyName.toUpperCase()} scheduled a ${formatLabel} interview for "${interviewData.jobTitle}" on ${interviewData.date} at ${interviewData.time}. Open your Calendar tab to view full details.`,
        type: 'action',
        read: false,
        createdAt: new Date().toISOString(),
        link: 'seeker-interviews',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('INTERVIEW_SCHEDULED', 'Interview', newInterview.id, `Scheduled interview with ${newInterview.applicantName} on ${interviewData.date} at ${interviewData.time}`);

    return { success: true, message: 'Interview successfully scheduled and synced to built-in calendars!', interview: newInterview };
  };

  // Reschedule Interview (Employer Action - Syncs Both Calendars & Notifies Job Seeker)
  const rescheduleInterview = (
    interviewId: string,
    updates: {
      date: string;
      time: string;
      interviewType?: Interview['interviewType'];
      locationOrLink?: string;
      instructions?: string;
    }
  ): { success: boolean; message: string } => {
    const existing = interviews.find(i => i.id === interviewId);
    if (!existing) {
      return { success: false, message: 'Interview record not found.' };
    }

    const nextFormat = updates.interviewType || existing.interviewType || existing.format || 'video';
    const nextLocation =
      updates.locationOrLink !== undefined
        ? nextFormat === 'face_to_face'
          ? updates.locationOrLink.toUpperCase()
          : updates.locationOrLink
        : existing.locationOrLink;
    const nextNotes =
      updates.instructions !== undefined
        ? updates.instructions.toUpperCase()
        : (existing.instructions || existing.notes || '').toUpperCase();

    const updatedInterview: Interview = {
      ...existing,
      date: updates.date,
      time: updates.time,
      interviewType: nextFormat,
      format: nextFormat,
      locationOrLink: nextLocation,
      instructions: nextNotes,
      notes: nextNotes,
      status: 'rescheduled',
      remindersSent: {},
      updatedAt: new Date().toISOString(),
    };

    setInterviews(prev => prev.map(i => (i.id === interviewId ? updatedInterview : i)));
    saveDocument(COLLECTIONS.INTERVIEWS, updatedInterview);

    const seeker = jobSeekers.find(s => s.id === existing.jobSeekerId || s.id === existing.seekerId);
    if (seeker) {
      const notif: NotificationItem = {
        id: `notif-resched-${Date.now()}`,
        recipientId: seeker.userId || seeker.id,
        recipientRole: 'job_seeker',
        title: `🔄 Interview Rescheduled: ${existing.jobTitle}`,
        message: `${existing.companyName.toUpperCase()} rescheduled your interview for "${existing.jobTitle}" to ${updates.date} at ${updates.time}. Check your Calendar tab for updated details.`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        link: 'seeker-interviews',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('INTERVIEW_RESCHEDULED', 'Interview', interviewId, `Rescheduled interview with ${existing.applicantName} to ${updates.date} at ${updates.time}`);
    return { success: true, message: 'Interview rescheduled and synced to both calendars.' };
  };

  // Cancel Interview (Employer Action - Syncs Both Calendars & Notifies Job Seeker)
  const cancelInterview = (interviewId: string, reason?: string) => {
    const existing = interviews.find(i => i.id === interviewId);
    if (!existing) return;

    const updatedInterview: Interview = {
      ...existing,
      status: 'cancelled',
      rescheduleNotes: reason ? reason.toUpperCase() : existing.rescheduleNotes,
      updatedAt: new Date().toISOString(),
    };

    setInterviews(prev => prev.map(i => (i.id === interviewId ? updatedInterview : i)));
    saveDocument(COLLECTIONS.INTERVIEWS, updatedInterview);

    const seeker = jobSeekers.find(s => s.id === existing.jobSeekerId || s.id === existing.seekerId);
    if (seeker) {
      const notif: NotificationItem = {
        id: `notif-cancel-${Date.now()}`,
        recipientId: seeker.userId || seeker.id,
        recipientRole: 'job_seeker',
        title: `❌ Interview Cancelled: ${existing.jobTitle}`,
        message: `${existing.companyName.toUpperCase()} cancelled the scheduled interview for "${existing.jobTitle}" (${existing.date} at ${existing.time}).${reason ? ` Note: ${reason.toUpperCase()}` : ''}`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        link: 'seeker-interviews',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    showToast({
      title: 'Interview Cancelled',
      message: `Cancelled interview with ${existing.applicantName} and updated both calendars.`,
      type: 'status',
    });

    logAudit('INTERVIEW_CANCELLED', 'Interview', interviewId, `Cancelled interview with ${existing.applicantName}`);
  };

  // Respond to Interview (Accept / Decline / Reschedule)
  const respondToInterview = (
    interviewId: string,
    rawStatus: 'accepted' | 'declined' | 'reschedule_requested' | 'accept' | 'decline' | 'reschedule',
    notes?: string
  ) => {
    const status: 'accepted' | 'declined' | 'reschedule_requested' =
      rawStatus === 'accept'
        ? 'accepted'
        : rawStatus === 'decline'
        ? 'declined'
        : rawStatus === 'reschedule'
        ? 'reschedule_requested'
        : rawStatus;

    setInterviews(prev => prev.map(i => {
      if (i.id === interviewId) {
        const updated = {
          ...i,
          status,
          rescheduleNotes: notes ? notes.toUpperCase() : i.rescheduleNotes,
          updatedAt: new Date().toISOString(),
        };
        saveDocument(COLLECTIONS.INTERVIEWS, updated);

        // Notify Employer
        const emp = employers.find(e => e.id === i.employerId);
        if (emp) {
          const notif: NotificationItem = {
            id: `notif-${Date.now()}`,
            recipientId: emp.userId,
            recipientRole: 'employer',
            title: `Interview ${(status || '').replace(/_/g, ' ').toUpperCase()}`,
            message: `${i.applicantName.toUpperCase()} has ${(status || '').replace(/_/g, ' ')} the interview for "${i.jobTitle}". ${notes ? `Notes: ${notes.toUpperCase()}` : ''}`,
            type: status === 'accepted' ? 'success' : 'warning',
            read: false,
            createdAt: new Date().toISOString(),
            link: 'employer-interviews',
          };
          setNotifications(n => [notif, ...n]);
          saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
        }
        return updated;
      }
      return i;
    }));

    logAudit('INTERVIEW_RESPONSE', 'Interview', interviewId, `Applicant responded: ${status}`);
  };

  // Update Seeker Profile (Normalized to ALL CAPS while keeping email, URLs, and IDs intact)
  const updateJobSeekerProfile = (seekerId: string, rawProfileData: Partial<JobSeekerProfile>) => {
    const profileData = normalizeSeekerProfileToUpperCase(rawProfileData);
=======
  // Cross-domain: updating a seeker profile recalculates application match scores and syncs Auth user metadata
  const updateJobSeekerProfile = (seekerId: string, profileData: Partial<JobSeekerProfile>) => {
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
    const emailToMatch = (profileData.email || currentUser?.email || '').toLowerCase().trim();
    const matchesSeeker = (s: JobSeekerProfile) =>
      s.id === seekerId ||
      s.userId === seekerId ||
      (currentUser && s.userId === currentUser.id) ||
      (emailToMatch && s.email && s.email.toLowerCase() === emailToMatch);

    const matchedSeekers = jobSeekers.filter(matchesSeeker);

    if (matchedSeekers.length === 0 && currentUser) {
      const newRecord: JobSeekerProfile = {
        id: seekerId || `seeker-${crypto.randomUUID()}`,
        userId: currentUser.id,
        firstName: currentUser.name.split(' ')[0] || 'User',
        lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
        email: currentUser.email,
        contactNumber: currentUser.phone || '',
        address: 'Roxas, Oriental Mindoro',
        municipality: 'Roxas',
        educationalAttainment: "College Graduate",
        primaryDegree: '',
        technicalSkills: [],
        softSkills: [],
        education: [],
        workExperience: [],
        certifications: [],
        resumes: [],
        isProfileCompleted: true,
        ...profileData,
        updatedAt: new Date().toISOString(),
      } as JobSeekerProfile;
      setJobSeekers(prev => [...prev, newRecord]);
      saveDocument(COLLECTIONS.JOB_SEEKERS, newRecord);
    } else if (matchedSeekers.length > 0) {
      const updatedById = new Map<string, JobSeekerProfile>();
      for (const s of matchedSeekers) {
        const updated = {
          ...s,
          ...profileData,
          isProfileCompleted: profileData.isProfileCompleted ?? true,
          updatedAt: new Date().toISOString()
        };
        updatedById.set(s.id, updated);
        saveDocument(COLLECTIONS.JOB_SEEKERS, updated);
        invalidateMatchCache(s.id);
      }

      setJobSeekers(prev => prev.map(s => updatedById.get(s.id) || s));

      jobs.setApplications(apps => apps.map(app => {
        const updated = matchedSeekers.find(s => app.jobSeekerId === seekerId || app.jobSeekerId === s.id);
        const updatedProfile = updated ? updatedById.get(updated.id) : undefined;
        if (updatedProfile) {
          const job = jobs.jobPosts.find(j => j.id === app.jobId);
          if (job) {
            const recalculated = getOrCalculateMatch(updatedProfile, job, { forceRecalculate: true });
            const updatedApp = {
              ...app,
              matchResult: recalculated,
              matchScore: recalculated.overallMatch,
              decisionTreeOutcome: recalculated.outcome
            };
            saveDocument(COLLECTIONS.APPLICATIONS, updatedApp);
            return updatedApp;
          }
        }
        return app;
      }));
    }

    if (currentUser) {
      const activeResumeCandidateName = profileData.resumes?.find(r => r.id === profileData.activeResumeId)?.candidateName
        || profileData.resumes?.[0]?.candidateName;

      const parts = [
        profileData.firstName ?? currentSeekerProfile?.firstName,
        profileData.middleName ?? currentSeekerProfile?.middleName,
        profileData.lastName ?? currentSeekerProfile?.lastName
      ].filter(Boolean).map(s => (s || '').trim()).filter(Boolean);

      const candidateProfileName = parts.length > 0 ? parts.join(' ') : '';
      const resolvedName = activeResumeCandidateName || candidateProfileName;
      const shouldUpdateName = Boolean(
        resolvedName &&
        resolvedName !== 'User' &&
        resolvedName !== 'User Roxas' &&
        resolvedName !== 'Candidate Applicant' &&
        resolvedName !== 'New Seeker'
      );

      setCurrentUser(prev => prev ? ({
        ...prev,
        isProfileCompleted: true,
        ...(shouldUpdateName ? { name: resolvedName } : {}),
        ...(profileData.profilePicture !== undefined ? { avatar: profileData.profilePicture } : {})
      } as any) : null);

      setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id || (emailToMatch && u.email && u.email.toLowerCase() === emailToMatch)) {
          const updatedUser = {
            ...u,
            isProfileCompleted: true,
            ...(shouldUpdateName ? { name: resolvedName } : {}),
            ...(profileData.profilePicture !== undefined ? { avatar: profileData.profilePicture } : {})
          };
          saveDocument(COLLECTIONS.USERS, updatedUser);
          return updatedUser;
        }
        return u;
      }));
    }

    markProfileCompletedInStorage([currentUser?.id, currentUser?.email, emailToMatch, seekerId], 'job_seeker');
    logAudit('PROFILE_UPDATED', 'JobSeekerProfile', seekerId, 'Updated job seeker profile credentials.');
  };

  const saveAssessmentResult = (seekerId: string, result: AssessmentResult) => {
    const seeker = jobSeekers.find(s => s.id === seekerId);
    if (!seeker) return;

    const existingAssessments = seeker.assessments || [];
    const filtered = existingAssessments.filter(a => a.assessmentId !== result.assessmentId);
    const updatedAssessments = [result, ...filtered];

    const currentSkills = new Set([...seeker.technicalSkills, ...seeker.softSkills]);
    const newSkillsToAdd = result.verifiedSkills.filter(s => !currentSkills.has(s));

    const updatedTechnicalSkills = [...seeker.technicalSkills, ...newSkillsToAdd];

    updateJobSeekerProfile(seekerId, {
      assessments: updatedAssessments,
      technicalSkills: updatedTechnicalSkills
    });

    if (result.passed) {
      showToast({
        title: `🏆 Assessment Passed: ${result.score}%!`,
        message: `You earned the "${result.badge}" for ${result.assessmentTitle}. Your job matching probability has been boosted!`,
      });

      const seekerUser = users.find(u => u.id === seeker.userId);
      if (seekerUser) {
        const notifItem: NotificationItem = {
          id: `notif-${crypto.randomUUID()}`,
          recipientId: seekerUser.id,
          recipientRole: 'job_seeker',
          title: `Verified Skill Badge Earned: ${result.badge}`,
          message: `Congratulations! You scored ${result.score}% on ${result.assessmentTitle}. Your profile strength has increased!`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/seeker/profile',
        };
        setNotifications(n => [notifItem, ...n]);
        saveDocument(COLLECTIONS.NOTIFICATIONS, notifItem);
      }
    }

    logAudit('ASSESSMENT_COMPLETED', 'SkillAssessment', result.assessmentId, `Completed "${result.assessmentTitle}" with score ${result.score}% (${result.passed ? 'PASSED' : 'RETRY'})`);
  };

<<<<<<< HEAD
  // Update Employer Profile (Normalized to ALL CAPS while keeping email, website URLs, and IDs intact)
  const updateEmployerProfile = (employerIdOrData: string | Partial<EmployerProfile>, maybeData?: Partial<EmployerProfile>) => {
    const targetId = typeof employerIdOrData === 'string' ? employerIdOrData : (currentEmployerProfile?.id || '');
    const rawProfileData = typeof employerIdOrData === 'string' ? (maybeData || {}) : employerIdOrData;
    const profileData = normalizeEmployerProfileToUpperCase(rawProfileData);

    setEmployers(prev => prev.map(e => {
      if (e.id === targetId || (!targetId && e.userId === currentUser?.id)) {
        const isCompletedNow = profileData.isProfileCompleted ?? e.isProfileCompleted ?? true;
        const updated = { 
          ...e, 
          ...profileData, 
          isProfileCompleted: isCompletedNow,
          updatedAt: new Date().toISOString() 
        };
        saveDocument(COLLECTIONS.EMPLOYERS, updated);
        return updated;
      }
      return e;
    }));

    if (currentUser) {
      const isCompletedFlag = profileData.isProfileCompleted ?? true;
      const repName = (profileData.representativeName || profileData.companyName || '').trim();
      const shouldUpdateName = repName.length > 0;

      if (isCompletedFlag) {
        setCurrentUser(prev => prev ? ({ 
          ...prev, 
          isProfileCompleted: true,
          ...(shouldUpdateName ? { name: repName } : {}),
          ...(profileData.logoUrl !== undefined ? { avatar: profileData.logoUrl } : {})
        } as any) : null);
        setUsers(prev => prev.map(u => {
          if (u.id === currentUser.id || (currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())) {
            const updatedUser = { 
              ...u, 
              isProfileCompleted: true,
              ...(shouldUpdateName ? { name: repName } : {}),
              ...(profileData.logoUrl !== undefined ? { avatar: profileData.logoUrl } : {})
            };
            saveDocument(COLLECTIONS.USERS, updatedUser);
            return updatedUser;
          }
          return u;
        }));

        markProfileCompletedInStorage([currentUser.id, currentUser.email, typeof employerIdOrData === 'string' ? employerIdOrData : undefined], 'employer');
      }
    }

    logAudit('PROFILE_UPDATED', 'EmployerProfile', targetId || 'current', 'Updated employer company details.');
  };

  // PESO-LGU Referral Slip Issuance
  const issueReferralSlip = (slipData: Omit<PesoReferralSlip, 'id' | 'createdAt' | 'referralNumber'> & { referralNumber?: string }): PesoReferralSlip => {
    const nextRefNum = slipData.referralNumber || `PESO-RXS-REF-${new Date().getFullYear()}-${String(referralSlips.length + 1).padStart(4, '0')}`;
    const newSlip: PesoReferralSlip = {
      ...slipData,
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      referralNumber: nextRefNum,
      createdAt: new Date().toISOString()
    };

    setReferralSlips(prev => [newSlip, ...prev]);
    saveDocument(COLLECTIONS.REFERRAL_SLIPS, newSlip);

    // Notify Employer of the official PESO Referral
    const employer = employers.find(e => e.id === slipData.employerId);
    if (employer) {
      addNotification({
        recipientId: employer.userId,
        recipientRole: 'employer',
        title: `Official PESO Referral Slip Issued: ${slipData.jobSeekerName}`,
        message: `PESO Roxas has officially endorsed ${slipData.jobSeekerName} for the vacancy "${slipData.jobTitle}". Referral No: ${newSlip.referralNumber}.`,
        type: 'action',
        link: '/employer/applications'
      });
    }

    // Notify Job Seeker
    const seeker = jobSeekers.find(s => s.id === slipData.jobSeekerId);
    if (seeker && seeker.userId) {
      addNotification({
        recipientId: seeker.userId,
        recipientRole: 'job_seeker',
        title: `PESO Referral Slip Ready: ${slipData.jobTitle}`,
        message: `You have been officially endorsed to ${slipData.employerName} with Referral No. ${newSlip.referralNumber}. Please check your referral slip details.`,
        type: 'success',
        link: '/seeker/applications'
      });
    }

    logAudit('ISSUE_REFERRAL_SLIP', 'PesoReferralSlip', newSlip.id, `Issued official referral slip ${newSlip.referralNumber} for ${slipData.jobSeekerName} to ${slipData.employerName}.`);

    showToast({
      title: 'PESO Referral Slip Issued',
      message: `Referral Slip ${newSlip.referralNumber} generated and endorsed to ${slipData.employerName}.`,
      type: 'success'
    });

    return newSlip;
  };

  const updateReferralSlipStatus = (slipId: string, status: PesoReferralSlip['status'], isHots?: boolean) => {
    setReferralSlips(prev => prev.map(s => {
      if (s.id === slipId) {
        const updated: PesoReferralSlip = { 
          ...s, 
          status, 
          remarks: isHots ? (s.remarks ? `${s.remarks} [Hired On The Spot]` : 'Hired On The Spot (HOTS)') : s.remarks 
        };
        saveDocument(COLLECTIONS.REFERRAL_SLIPS, updated);

        // If hired or hired on the spot, update Job Seeker profile employmentStatus
        if (status === 'hired' || status === 'hired_on_the_spot') {
          setJobSeekers(seekers => seekers.map(sk => {
            if (sk.id === s.jobSeekerId) {
              const updatedSk: JobSeekerProfile = {
                ...sk,
                employmentStatus: status === 'hired_on_the_spot' ? 'hired_on_the_spot' : 'hired',
                currentEmployer: s.employerName,
                hiredPosition: s.jobTitle,
                hiredAt: new Date().toISOString()
              };
              saveDocument(COLLECTIONS.JOB_SEEKERS, updatedSk);
              return updatedSk;
            }
            return sk;
          }));
        }

        return updated;
      }
      return s;
    }));

    logAudit('UPDATE_REFERRAL_STATUS', 'PesoReferralSlip', slipId, `Updated referral slip status to ${status}${isHots ? ' (HOTS)' : ''}.`);
  };

  // Encode Walk-In Job Seeker (Physical Bio-Data encoding by PESO staff - Normalized to ALL CAPS)
  const encodeWalkInJobSeeker = (rawSeekerData: Partial<JobSeekerProfile> & { firstName: string; lastName: string; contactNumber: string }): JobSeekerProfile => {
    const seekerData = { ...rawSeekerData, ...normalizeSeekerProfileToUpperCase(rawSeekerData) };
    const walkInUserId = `user-walkin-${Date.now()}`;
    const walkInSeekerId = `seeker-walkin-${Date.now()}`;
    const fullName = `${seekerData.firstName} ${seekerData.lastName}`.trim().toUpperCase();
    const generatedEmail = seekerData.email || `${seekerData.firstName.toLowerCase().replace(/\s+/g, '')}.${seekerData.lastName.toLowerCase().replace(/\s+/g, '')}.walkin@pesoroxas.gov.ph`;

    // Calculate initial profile completeness
    let completeness = 50;
    if (seekerData.educationCategory) completeness += 15;
    if (seekerData.practicalSkills && seekerData.practicalSkills.length > 0) completeness += 15;
    if (seekerData.tradeCertifications && seekerData.tradeCertifications.length > 0) completeness += 10;
    if (seekerData.geographicMobility) completeness += 10;

    const allTechSkills = Array.from(new Set([
      ...(seekerData.technicalSkills || []),
      ...(seekerData.practicalSkills || []),
      ...(seekerData.tradeSkills || []),
      ...(seekerData.administrativeSkills || []),
      ...(seekerData.serviceHospitalitySkills || []),
      ...(seekerData.salesCustomerSkills || []),
      ...(seekerData.itCreativeSkills || []),
    ]));

    const newSeeker: JobSeekerProfile = {
      id: walkInSeekerId,
      userId: walkInUserId,
      firstName: seekerData.firstName,
      middleName: seekerData.middleName || '',
      lastName: seekerData.lastName,
      dateOfBirth: seekerData.dateOfBirth || '2000-01-01',
      email: generatedEmail,
      contactNumber: seekerData.contactNumber,
      address: seekerData.address || 'Roxas, Oriental Mindoro',
      barangay: seekerData.barangay || 'Bagumbayan',
      municipality: seekerData.municipality || 'Roxas',
      civilStatus: seekerData.civilStatus || 'Single',
      sex: seekerData.sex || 'Male',
      age: seekerData.age || 24,
      professionalSummary: seekerData.professionalSummary || `Walk-in job seeker registered at PESO-LGU Roxas. Registered education: ${seekerData.educationalAttainment || 'High School'}.`,
      educationalAttainment: seekerData.educationalAttainment || (seekerData.educationCategory || 'High School Graduate'),
      primaryDegree: seekerData.primaryDegree || '',
      technicalSkills: allTechSkills,
      softSkills: seekerData.softSkills || ['Punctual', 'Hardworking', 'Team Player'],
      tradeSkills: seekerData.tradeSkills || seekerData.practicalSkills || [],
      administrativeSkills: seekerData.administrativeSkills || [],
      serviceHospitalitySkills: seekerData.serviceHospitalitySkills || [],
      salesCustomerSkills: seekerData.salesCustomerSkills || [],
      itCreativeSkills: seekerData.itCreativeSkills || [],
      education: seekerData.education && seekerData.education.length > 0 ? seekerData.education : [{
        id: `edu-${Date.now()}`,
        school: 'Roxas Local School / Institution',
        degreeCourse: seekerData.primaryDegree || seekerData.educationalAttainment || 'General Secondary Course',
        yearGraduated: 2022,
        educationalAttainment: seekerData.educationalAttainment || (seekerData.educationCategory || 'High School')
      }],
      workExperience: seekerData.workExperience || [],
      certifications: seekerData.certifications && seekerData.certifications.length > 0
        ? seekerData.certifications
        : (seekerData.tradeCertifications || []).map((cert, idx) => ({
            id: `cert-${Date.now()}-${idx}`,
            name: cert,
            issuingOrganization: 'TESDA',
            dateObtained: '2024-01-15'
          })),
      resumes: seekerData.resumes || [],
      activeResumeId: seekerData.activeResumeId,
      isAccountVerified: true, // Walk-in is verified physically by PESO officer
      isProfileCompleted: true,
      employmentStatus: 'unemployed',
      isWalkIn: true,
      registrationType: 'walk_in',
      educationCategory: seekerData.educationCategory || 'High School Graduate',
      practicalSkills: seekerData.practicalSkills || allTechSkills,
      tradeCertifications: seekerData.tradeCertifications || [],
      geographicMobility: seekerData.geographicMobility || 'local_only',
      willingToRelocateForVisitingCompanies: seekerData.willingToRelocateForVisitingCompanies ?? false,
      bioDataDetails: seekerData.bioDataDetails || 'Physical bio-data form received and filed in PESO Archives.',
      walkInAssessmentNotes: seekerData.walkInAssessmentNotes || 'Initial interview and assessment conducted by PESO Personnel.',
      assessedByOfficer: seekerData.assessedByOfficer || (currentUser?.name || 'PESO Officer'),
      assessedAt: new Date().toISOString(),
      profileCompleteness: Math.min(completeness, 100),
      updatedAt: new Date().toISOString()
    };

    const newUser: User = {
      id: walkInUserId,
      name: fullName,
      email: generatedEmail,
      role: 'job_seeker',
      phone: seekerData.contactNumber,
      isAccountVerified: true,
      isProfileCompleted: true,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setJobSeekers(prev => [newSeeker, ...prev]);

    saveDocument(COLLECTIONS.USERS, newUser);
    saveDocument(COLLECTIONS.JOB_SEEKERS, newSeeker);

    // Automatically run matching engine for this newly uploaded walk-in applicant against all active job posts
    const activeVacancies = jobPosts.filter(j => j.status === 'active');
    activeVacancies.forEach(activeJob => {
      notifyAndCacheCandidateMatches(activeJob, [newSeeker]);
    });

    logAudit('ENCODE_WALK_IN_SEEKER', 'JobSeekerProfile', newSeeker.id, `Encoded walk-in applicant ${fullName} (${newSeeker.educationCategory}) with physical bio-data.`);

    showToast({
      title: 'Walk-In Seeker Encoded',
      message: `Applicant ${fullName} registered into PESO Roxas database.`,
      type: 'success'
    });

    return newSeeker;
  };

  // Walk-In Assessment & Relocation Profiling
  const assessJobSeekerWalkIn = (seekerId: string, assessmentData: {
    practicalSkills?: string[];
    tradeCertifications?: string[];
    geographicMobility?: 'local_only' | 'provincial' | 'willing_to_relocate';
    willingToRelocateForVisitingCompanies?: boolean;
    walkInAssessmentNotes?: string;
    assessedByOfficer?: string;
  }) => {
    setJobSeekers(prev => prev.map(sk => {
      if (sk.id === seekerId) {
        const updated: JobSeekerProfile = {
          ...sk,
          practicalSkills: assessmentData.practicalSkills || sk.practicalSkills || [],
          tradeCertifications: assessmentData.tradeCertifications || sk.tradeCertifications || [],
          geographicMobility: assessmentData.geographicMobility || sk.geographicMobility || 'local_only',
          willingToRelocateForVisitingCompanies: assessmentData.willingToRelocateForVisitingCompanies ?? sk.willingToRelocateForVisitingCompanies ?? false,
          walkInAssessmentNotes: assessmentData.walkInAssessmentNotes || sk.walkInAssessmentNotes,
          assessedByOfficer: assessmentData.assessedByOfficer || currentUser?.name || 'PESO Officer',
          assessedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        saveDocument(COLLECTIONS.JOB_SEEKERS, updated);
        return updated;
      }
      return sk;
    }));

    logAudit('WALK_IN_ASSESSMENT', 'JobSeekerProfile', seekerId, `Assessed practical skills and relocation mobility for applicant.`);
    
    showToast({
      title: 'Walk-In Assessment Saved',
      message: 'Practical capabilities and relocation profile updated.',
      type: 'success'
    });
  };

  // Local Recruitment Activity (LRA) Coordination
  const createLraEvent = (eventData: Omit<LocalRecruitmentActivity, 'id' | 'createdAt' | 'registeredApplicantsCount' | 'hotsCount' | 'interviewsConductedCount'> & Partial<LocalRecruitmentActivity>): LocalRecruitmentActivity => {
    const defaultPositions = eventData.targetPositions || eventData.vacancies || ['General Staff'];
    const defaultVenue = eventData.eventVenue || eventData.venue || 'Roxas Municipal Gymnasium, Bagumbayan, Roxas';
    const defaultDate = eventData.eventDate || eventData.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const defaultSlots = eventData.totalVacancies || eventData.totalSlotsAvailable || 50;
    const defaultApplicantTypes = eventData.targetApplicantTypes || (eventData.targetApplicantType ? eventData.targetApplicantType : ['High School Graduate', 'College Graduate']);

    const newLra: LocalRecruitmentActivity = {
      ...eventData,
      id: `lra-${Date.now()}`,
      eventTitle: eventData.eventTitle || eventData.eventName || `LRA: ${eventData.companyName}`,
      eventName: eventData.eventName || eventData.eventTitle || `LRA: ${eventData.companyName}`,
      eventVenue: defaultVenue,
      venue: defaultVenue,
      eventDate: defaultDate,
      startDate: eventData.startDate || defaultDate,
      endDate: eventData.endDate || defaultDate,
      targetPositions: defaultPositions,
      vacancies: defaultPositions,
      totalVacancies: defaultSlots,
      totalSlotsAvailable: defaultSlots,
      targetApplicantTypes: defaultApplicantTypes,
      targetApplicantType: defaultApplicantTypes,
      willingnessToRelocateRequired: eventData.willingnessToRelocateRequired ?? false,
      status: eventData.status || 'scheduled',
      announcementPublished: eventData.announcementPublished ?? true,
      isPubliclyAnnounced: eventData.isPubliclyAnnounced ?? true,
      registeredApplicantsCount: eventData.nominatedCandidates?.length || 0,
      hotsCount: 0,
      hotsApplicantsCount: 0,
      interviewsConductedCount: 0,
      nominatedCandidateIds: eventData.nominatedCandidateIds || [],
      nominatedCandidates: eventData.nominatedCandidates || [],
      createdAt: new Date().toISOString()
    };

    setLocalRecruitmentActivities(prev => [newLra, ...prev]);
    saveDocument(COLLECTIONS.LRA_EVENTS, newLra);

    if (newLra.announcementPublished || newLra.isPubliclyAnnounced) {
      const announcement: SystemAnnouncement = {
        id: `ann-${Date.now()}`,
        title: `📢 Upcoming Local Recruitment Activity: ${newLra.companyName}`,
        content: `PESO Roxas invites qualified job seekers to the Local Recruitment Activity by ${newLra.companyName} on ${new Date(defaultDate).toLocaleDateString()} at ${defaultVenue}. Positions: ${defaultPositions.join(', ')}.`,
        targetRole: 'job_seeker',
        datePosted: new Date().toISOString(),
        isImportant: true
      };
      setAnnouncements(prev => [announcement, ...prev]);
      saveDocument(COLLECTIONS.ANNOUNCEMENTS, announcement);
    }

    logAudit('CREATE_LRA_EVENT', 'LocalRecruitmentActivity', newLra.id, `Scheduled LRA for ${newLra.companyName} on ${defaultDate}.`);

    showToast({
      title: 'LRA Event Scheduled',
      message: `Recruitment activity for ${newLra.companyName} created and announced.`,
      type: 'success'
    });

    return newLra;
  };

  const updateLraEvent = (eventId: string, updates: Partial<LocalRecruitmentActivity>) => {
    setLocalRecruitmentActivities(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const updated = { ...ev, ...updates };
        saveDocument(COLLECTIONS.LRA_EVENTS, updated);
        return updated;
      }
      return ev;
    }));

    logAudit('UPDATE_LRA_EVENT', 'LocalRecruitmentActivity', eventId, `Updated LRA parameters.`);
  };

  const nominateCandidateToLra = (lraId: string, seekerId: string, targetPosition?: string, notes?: string) => {
    const seeker = jobSeekers.find(s => s.id === seekerId);
    if (!seeker) {
      showToast({
        title: 'Seeker Not Found',
        message: 'Could not find candidate profile to nominate.',
        type: 'alert'
      });
      return;
    }

    setLocalRecruitmentActivities(prev => prev.map(ev => {
      if (ev.id === lraId) {
        const existingCandidateIds = ev.nominatedCandidateIds || (ev.nominatedCandidates?.map(c => c.seekerId) || []);
        if (existingCandidateIds.includes(seekerId)) {
          showToast({
            title: 'Candidate Already Nominated',
            message: `${seeker.firstName} ${seeker.lastName} is already in the candidate pool for this LRA drive.`,
            type: 'alert'
          });
          return ev;
        }

        const candidateEntry: LraCandidate = {
          seekerId,
          seekerName: `${seeker.firstName} ${seeker.lastName}`,
          seekerContact: seeker.contactNumber,
          seekerBarangay: seeker.barangay || seeker.municipality || 'Roxas',
          educationalAttainment: seeker.educationalAttainment,
          targetPosition: targetPosition || ev.targetPositions?.[0] || ev.vacancies?.[0] || 'Applicant',
          nominatedAt: new Date().toISOString(),
          status: 'nominated',
          notes: notes || 'Nominated by PESO Roxas for LRA candidate pool.'
        };

        const updatedNominatedCandidates = [...(ev.nominatedCandidates || []), candidateEntry];
        const updatedNominatedIds = [...existingCandidateIds, seekerId];
        const newCount = updatedNominatedCandidates.length;

        const updated: LocalRecruitmentActivity = {
          ...ev,
          nominatedCandidateIds: updatedNominatedIds,
          nominatedCandidates: updatedNominatedCandidates,
          registeredApplicantsCount: newCount
        };

        saveDocument(COLLECTIONS.LRA_EVENTS, updated);

        // Notify seeker of nomination
        addNotification({
          recipientId: seeker.userId || seeker.id,
          recipientRole: 'job_seeker',
          title: `📢 PESO Nomination: ${ev.companyName} Recruitment Drive`,
          message: `PESO Roxas has officially nominated your profile for the Local Recruitment Activity with ${ev.companyName} for position "${candidateEntry.targetPosition}".`,
          type: 'action',
          link: 'lra'
        });

        logAudit('NOMINATE_LRA_CANDIDATE', 'LocalRecruitmentActivity', lraId, `Nominated candidate ${seeker.firstName} ${seeker.lastName} to ${ev.companyName} LRA pool.`);

        showToast({
          title: 'Candidate Nominated to LRA Pool',
          message: `${seeker.firstName} ${seeker.lastName} added to candidate pool for ${ev.companyName}.`,
          type: 'success'
        });

        return updated;
      }
      return ev;
    }));
  };

  const removeCandidateFromLra = (lraId: string, seekerId: string) => {
    setLocalRecruitmentActivities(prev => prev.map(ev => {
      if (ev.id === lraId) {
        const updatedCandidates = (ev.nominatedCandidates || []).filter(c => c.seekerId !== seekerId);
        const updatedIds = (ev.nominatedCandidateIds || []).filter(id => id !== seekerId);
        const updated: LocalRecruitmentActivity = {
          ...ev,
          nominatedCandidateIds: updatedIds,
          nominatedCandidates: updatedCandidates,
          registeredApplicantsCount: updatedCandidates.length
        };
        saveDocument(COLLECTIONS.LRA_EVENTS, updated);
        logAudit('REMOVE_LRA_CANDIDATE', 'LocalRecruitmentActivity', lraId, `Removed candidate ${seekerId} from LRA pool.`);
        showToast({
          title: 'Candidate Removed',
          message: 'Candidate was removed from the LRA pool.',
          type: 'status'
        });
        return updated;
      }
      return ev;
    }));
  };

  const updateLraCandidateStatus = (lraId: string, seekerId: string, status: LraCandidate['status'], notes?: string) => {
    setLocalRecruitmentActivities(prev => prev.map(ev => {
      if (ev.id === lraId) {
        let isNowHots = false;
        let position = '';
        const updatedCandidates = (ev.nominatedCandidates || []).map(c => {
          if (c.seekerId === seekerId) {
            if (status === 'hired_on_the_spot' && c.status !== 'hired_on_the_spot') {
              isNowHots = true;
              position = c.targetPosition || 'Hired Candidate';
            }
            return {
              ...c,
              status,
              notes: notes || c.notes
            };
          }
          return c;
        });

        const newHotsCount = isNowHots ? (ev.hotsCount || 0) + 1 : (ev.hotsCount || 0);

        const updated: LocalRecruitmentActivity = {
          ...ev,
          nominatedCandidates: updatedCandidates,
          hotsCount: newHotsCount,
          hotsApplicantsCount: newHotsCount,
          interviewsConductedCount: status === 'for_interview' 
            ? (ev.interviewsConductedCount || 0) + 1 
            : ev.interviewsConductedCount
        };

        saveDocument(COLLECTIONS.LRA_EVENTS, updated);

        // If HOTS, update job seeker employment status
        if (isNowHots) {
          const seeker = jobSeekers.find(s => s.id === seekerId);
          if (seeker) {
            setJobSeekers(prevSeekers => prevSeekers.map(sk => {
              if (sk.id === seekerId) {
                const updatedSeeker: JobSeekerProfile = {
                  ...sk,
                  employmentStatus: 'hired_on_the_spot',
                  currentEmployer: ev.companyName,
                  hiredPosition: position,
                  hiredAt: new Date().toISOString()
                };
                saveDocument(COLLECTIONS.JOB_SEEKERS, updatedSeeker);
                return updatedSeeker;
              }
              return sk;
            }));

            addNotification({
              recipientId: seeker.userId || seeker.id,
              recipientRole: 'job_seeker',
              title: `🎉 Congratulations! Hired-On-The-Spot: ${ev.companyName}`,
              message: `You were officially recorded as Hired-On-The-Spot for the position "${position}" during the ${ev.companyName} Local Recruitment Activity.`,
              type: 'success'
            });
          }
        }

        logAudit('UPDATE_LRA_CANDIDATE_STATUS', 'LocalRecruitmentActivity', lraId, `Candidate ${seekerId} status updated to ${status}.`);

        showToast({
          title: 'Candidate Status Updated',
          message: `LRA Candidate status changed to ${status.replace(/_/g, ' ')}.`,
          type: 'success'
        });

        return updated;
      }
      return ev;
    }));
  };

  const logHotsApplicant = (lraId: string, applicantName: string, position: string, employerId?: string, notes?: string) => {
    // 1. Increment HOTS in LRA event
    setLocalRecruitmentActivities(prev => prev.map(ev => {
      if (ev.id === lraId) {
        const updated = {
          ...ev,
          hotsCount: (ev.hotsCount || 0) + 1,
          hotsApplicantsCount: (ev.hotsCount || 0) + 1,
          interviewsConductedCount: Math.max(ev.interviewsConductedCount || 0, (ev.hotsCount || 0) + 1)
        };
        saveDocument(COLLECTIONS.LRA_EVENTS, updated);
        return updated;
      }
      return ev;
    }));

    // 2. Find matching applicant by name to update status if exists
    const matchingSeeker = jobSeekers.find(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(applicantName.toLowerCase()) ||
      applicantName.toLowerCase().includes(`${s.firstName} ${s.lastName}`.toLowerCase())
    );

    if (matchingSeeker) {
      setJobSeekers(prev => prev.map(sk => {
        if (sk.id === matchingSeeker.id) {
          const updated: JobSeekerProfile = {
            ...sk,
            employmentStatus: 'hired_on_the_spot',
            hiredPosition: position,
            hiredAt: new Date().toISOString()
          };
          saveDocument(COLLECTIONS.JOB_SEEKERS, updated);
          return updated;
        }
        return sk;
      }));
    }

    logAudit('LRA_HOTS_PLACEMENT', 'LocalRecruitmentActivity', lraId, `Hired-On-The-Spot: ${applicantName} for position "${position}".`);

    showToast({
      title: 'Hired-On-The-Spot (HOTS) Logged',
      message: `${applicantName} marked as Hired-On-The-Spot for ${position}!`,
      type: 'success'
    });
  };

  // Check job subscriptions and notify matching job seekers
  const checkJobSubscriptionsAndNotify = (newJob: JobPost) => {
    jobSubscriptions.filter(s => s.isActive).forEach(sub => {
      const categoryMatch = sub.categories.length === 0 || sub.categories.includes(newJob.category);
      const municipalityMatch = sub.municipalities.length === 0 || sub.municipalities.includes(newJob.municipality);
      const keywordsMatch = sub.keywords.length === 0 || sub.keywords.some(kw => 
        newJob.title.toLowerCase().includes(kw.toLowerCase()) ||
        newJob.category.toLowerCase().includes(kw.toLowerCase()) ||
        newJob.description.toLowerCase().includes(kw.toLowerCase()) ||
        newJob.requiredSkills.some(s => s.toLowerCase().includes(kw.toLowerCase()))
      );
      const empTypeMatch = sub.employmentTypes.length === 0 || sub.employmentTypes.includes(newJob.employmentType);

      if (categoryMatch && municipalityMatch && (keywordsMatch || empTypeMatch)) {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          recipientId: sub.userId,
          recipientRole: 'job_seeker',
          title: `New Job Vacancy Alert: ${newJob.title}`,
          message: `${newJob.companyName} posted "${newJob.title}" in ${newJob.municipality} matching your "${sub.title}" subscription alert.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/seeker/jobs',
        };

        setNotifications(prev => [notif, ...prev]);
        saveDocument(COLLECTIONS.NOTIFICATIONS, notif);

        if (sub.isToastAlertEnabled) {
          showToast({
            title: `Matching Job Vacancy Opened!`,
            message: `${newJob.companyName} published "${newJob.title}" in ${newJob.municipality} matching your "${sub.title}" criteria.`,
            jobId: newJob.id,
            companyName: newJob.companyName,
            municipality: newJob.municipality,
            category: newJob.category,
          });
        }
      }
    });
  };

  const addJobSubscription = (subData: Omit<JobAlertSubscription, 'id' | 'createdAt'>): JobAlertSubscription => {
    const newSub: JobAlertSubscription = {
      ...subData,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setJobSubscriptions(prev => [newSub, ...prev]);
    saveDocument(COLLECTIONS.JOB_SUBSCRIPTIONS, newSub);
    logAudit('SUBSCRIPTION_CREATED', 'JobAlertSubscription', newSub.id, `Created job alert rule: "${newSub.title}"`);
    return newSub;
  };

  const updateJobSubscription = (id: string, updates: Partial<JobAlertSubscription>) => {
    setJobSubscriptions(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        saveDocument(COLLECTIONS.JOB_SUBSCRIPTIONS, updated);
        return updated;
      }
      return s;
    }));
    logAudit('SUBSCRIPTION_UPDATED', 'JobAlertSubscription', id, `Updated alert preferences`);
  };

  const deleteJobSubscription = (id: string) => {
    setJobSubscriptions(prev => prev.filter(s => s.id !== id));
    deleteDocument(COLLECTIONS.JOB_SUBSCRIPTIONS, id);
    logAudit('SUBSCRIPTION_DELETED', 'JobAlertSubscription', id, `Removed alert rule`);
  };

  const simulateJobMatch = (subscriptionId?: string) => {
    const targetSub = jobSubscriptions.find(s => s.id === subscriptionId) || jobSubscriptions[0];
    const category = targetSub?.categories[0] || "Information Technology & Software";
    const municipality = targetSub?.municipalities[0] || "Calapan City";
    const keyword = targetSub?.keywords[0] || "Developer";

    const simJob: JobPost = {
      id: `job-sim-${Date.now()}`,
      employerId: 'emp-1',
      companyName: 'Mindoro Digital Solutions Inc.',
      companyLogo: '',
      companyMunicipality: municipality,
      companyVerified: true,
      title: `Senior ${keyword} Specialist`,
      category,
      description: `Immediate opening for ${keyword} specialist in ${municipality}. Matches your alert criteria for "${targetSub?.title || 'Job Preference'}".`,
      responsibilities: ['Architect local IT services', 'Lead digital transformation initiatives', 'Coordinate with PESO job matchers'],
      employmentType: 'Full-time',
      workLocation: `${municipality}, Oriental Mindoro`,
      municipality,
      vacanciesCount: 2,
      salaryRange: '₱35,000 - ₱55,000 / month',
      applicationDeadline: '2026-09-30',
      postedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      minEducationalAttainment: "Bachelor's Degree",
      preferredDegree: 'BS Computer Science / Information Technology / Related',
      degreeImportance: 'required',
      requiredSkills: [keyword, 'Problem Solving', 'Teamwork'],
      preferredSkills: ['SQL', 'Git', 'System Design'],
      minExperienceYears: 2,
      experienceImportance: 'preferred',
      requiredCertifications: [],
      technicalSkills: [keyword, 'React', 'Node.js'],
      softSkills: ['Communication', 'Critical Thinking'],
      requirements: [
        { id: 'req-1', category: 'education', title: "Bachelor's Degree", importance: 'required', value: "Bachelor's Degree" },
        { id: 'req-2', category: 'degree', title: 'BS Information Technology', importance: 'required', value: 'BS Information Technology' },
        { id: 'req-3', category: 'experience', title: '2+ Years Experience', importance: 'preferred', value: '2 years' }
      ]
    };

    setJobPosts(prev => [simJob, ...prev]);
    saveDocument(COLLECTIONS.JOB_POSTS, simJob);
    checkJobSubscriptionsAndNotify(simJob);
    logAudit('SIMULATED_JOB_MATCH', 'JobPost', simJob.id, `Simulated job match for "${targetSub?.title || 'Alert'}"`);
  };

  // Reset database to clean zero-data state
  const resetToDemoData = async () => {
    storageAdapter.clearAllStoredData();
    setUsers([]);
    setCurrentUser(null);
    setEmployers([]);
    setJobSeekers([]);
    setJobPosts([]);
    setApplications([]);
    setInterviews([]);
    setNotifications([]);
    setAuditLogs([]);
    setAnnouncements([]);
    setJobSubscriptions([]);
    setReferralSlips([]);
    setLocalRecruitmentActivities([]);
    setCandidateMatches([]);
    setBookmarkedJobIds([]);
    setConversations([]);
    setChatMessages([]);
    setCompanyReviews([]);
    setProfileViews([]);
    showToast({
      title: 'Clean Slate Reset Complete',
      message: 'All data has been reset to a clean empty database state.',
      type: 'success',
    });
  };

  // Color UI Handlers
  const toggleBookmarkJob = (jobId: string) => {
    setBookmarkedJobIds(prev => {
      const exists = prev.includes(jobId);
      const updated = exists ? prev.filter(id => id !== jobId) : [jobId, ...prev];
      return updated;
    });
  };

  const isJobBookmarked = (jobId: string) => bookmarkedJobIds.includes(jobId);

  const sendChatMessage = (conversationId: string, text: string, audioUrl?: string, attachmentName?: string) => {
    if (!currentUser) return;
    const targetConv = conversations.find(c => c.id === conversationId);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      recipientId: targetConv?.participantId || 'unknown',
      text,
      audioUrl,
      attachmentName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };
    setChatMessages(prev => [...prev, newMsg]);
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: text || (audioUrl ? '🎤 Voice message' : '📎 Attachment'),
          lastMessageTime: newMsg.timestamp,
        };
      }
      return conv;
    }));

    if (currentUser.role === 'job_seeker') {
      setTimeout(() => {
        const autoReplies = [
          "Thank you for your update! I am checking your credentials with our hiring committee.",
          "Noted on this! Let's schedule an interview slot on our calendar.",
          "Received! Your profile has high alignment with our department requirements."
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        const replyMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          conversationId,
          senderId: targetConv?.participantId || 'user-emp-1',
          senderName: targetConv?.participantName || 'Jenny Wilson',
          senderAvatar: targetConv?.participantAvatar,
          senderRole: 'employer',
          recipientId: currentUser.id,
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        };
        setChatMessages(msgs => [...msgs, replyMsg]);
        setConversations(convs => convs.map(c => c.id === conversationId ? {
          ...c,
          lastMessage: randomReply,
          lastMessageTime: replyMsg.timestamp,
          unreadCount: c.unreadCount + 1,
        } : c));
      }, 1500);
    }
  };

  const markConversationRead = (conversationId: string) => {
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    setChatMessages(prev => prev.map(m => m.conversationId === conversationId ? { ...m, isRead: true } : m));
  };

  const addCompanyReview = (review: Omit<CompanyReview, 'id' | 'createdAt'>) => {
    const newRev: CompanyReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCompanyReviews(prev => [newRev, ...prev]);
  };

  const withdrawApplication = (applicationId: string, notes: string = 'Application withdrawn by applicant') => {
    updateApplicationStatus(applicationId, 'withdrawn', notes);
  };

=======
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
  const updateJobSeekingStatus = (seekerId: string, status: 'actively_looking' | 'passively_looking' | 'not_looking') => {
    updateJobSeekerProfile(seekerId, { jobSeekingStatus: status });
  };

  const updateNotificationPreferences = (seekerId: string, prefs: any) => {
    updateJobSeekerProfile(seekerId, { notificationPreferences: prefs });
  };

  // Reset all domain stores to complete demo state
  const resetToDemoData = async () => {
    if (isSupabaseConfigured()) {
      await seedDemoDataToSupabase().catch((err) => {
        console.warn('[Supabase] Warning during demo reset:', err);
      });
    }
<<<<<<< HEAD
    const seeker = jobSeekers.find(s => s.id === seekerId);
    if (!seeker) {
      return { success: false, message: 'Candidate profile not found.' };
    }

    const alreadyInvited = invitations.some(
      inv => (inv.jobId === jobId || inv.vacancyId === jobId) && (inv.jobSeekerId === seekerId || inv.seekerId === seekerId)
    );
    if (alreadyInvited) {
      return { 
        success: false, 
        message: `${seeker.firstName} ${seeker.lastName} has already been invited to apply for this vacancy.` 
      };
    }

    const match = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });
    const score = Math.round(match.overallMatch);
    const nowIso = new Date().toISOString();
    const seekerDisplayName = `${seeker.firstName} ${seeker.lastName}`.trim().toUpperCase();
    const finalMessage =
      customMessage?.trim() ||
      `You have been scouted as a top-matching candidate (${score}% AI Match) for "${job.title}". We invite you to review the vacancy and submit your application!`;

    const newInvitation: CandidateInvitation = {
      id: `inv-${Date.now()}-${seeker.id}`,
      jobId: job.id,
      vacancyId: job.id,
      employerId: job.employerId,
      companyName: job.companyName.toUpperCase(),
      jobTitle: job.title,
      jobSeekerId: seeker.id,
      seekerId: seeker.id,
      seekerName: seekerDisplayName,
      matchScore: score,
      message: finalMessage,
      note: finalMessage,
      status: 'pending',
      sentAt: nowIso,
      createdAt: nowIso,
    };

    setInvitations(prev => [newInvitation, ...prev]);

    const inviteNotif: NotificationItem = {
      id: `notif-invite-${Date.now()}-${seeker.id}`,
      recipientId: seeker.userId || seeker.id,
      recipientRole: 'job_seeker',
      title: `🎯 You Were Scouted: ${job.title} (${score}% Match)`,
      message: `${job.companyName.toUpperCase()} scouted your profile and invited you to apply for "${job.title}" in ${job.municipality || 'Oriental Mindoro'} (${score}% AI Match)!`,
      type: 'action',
      read: false,
      createdAt: nowIso,
      link: 'seeker-dashboard',
    };

    setNotifications(prev => [inviteNotif, ...prev]);
    saveDocument(COLLECTIONS.NOTIFICATIONS, inviteNotif);

    logAudit(
      'CANDIDATE_INVITED', 
      'JobPost', 
      job.id, 
      `Employer ${job.companyName} scouted ${seekerDisplayName} (${seeker.id}) to apply for ${job.title} (Match: ${score}%)`
    );

    showToast({
      title: 'Candidate Scouted & Invited',
      message: `Scout invitation sent to ${seekerDisplayName} (${score}% Match).`,
      type: 'success',
    });

    return {
      success: true,
      message: `Invitation successfully sent to ${seekerDisplayName}.`,
      invitation: newInvitation,
    };
  };

  const respondToInvitation = (invitationId: string, status: 'accepted' | 'declined') => {
    const existing = invitations.find(inv => inv.id === invitationId);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === invitationId
          ? { ...inv, status, respondedAt: nowIso }
          : inv
      )
    );

    if (status === 'declined') {
      const emp = employers.find(e => e.id === existing.employerId);
      const recipientId = emp?.userId || existing.employerId;
      if (recipientId) {
        const declineNotif: NotificationItem = {
          id: `notif-inv-decline-${Date.now()}`,
          recipientId,
          recipientRole: 'employer',
          title: `Scout Invitation Declined: ${existing.seekerName}`,
          message: `${existing.seekerName} declined the scout invitation for "${existing.jobTitle}".`,
          type: 'warning',
          read: false,
          createdAt: nowIso,
          link: 'employer-applicants',
        };
        setNotifications(prev => [declineNotif, ...prev]);
        saveDocument(COLLECTIONS.NOTIFICATIONS, declineNotif);
      }
      showToast({
        title: 'Invitation Declined',
        message: `You declined the invitation for "${existing.jobTitle}" at ${existing.companyName}.`,
        type: 'status',
      });
    }
  };

  const hasInvitedCandidate = (jobId: string, seekerId: string): boolean => {
    return invitations.some(
      inv => (inv.jobId === jobId || inv.vacancyId === jobId) && (inv.jobSeekerId === seekerId || inv.seekerId === seekerId)
    );
  };

  // Automatic Upcoming Interview Reminders (24h, 1h, and 15m before start) for both Employer & Job Seeker
  useEffect(() => {
    if (!currentUser) return;

    const parseInterviewTimestamp = (dateStr?: string, timeStr?: string): number | null => {
      if (!dateStr || !timeStr) return null;
      const cleanDate = dateStr.trim();
      const cleanTime = timeStr.trim();
      const [year, month, day] = cleanDate.split('-').map(Number);
      if (!year || !month || !day) return null;

      let hours = 9;
      let minutes = 0;
      const amPmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (amPmMatch) {
        hours = parseInt(amPmMatch[1], 10);
        minutes = parseInt(amPmMatch[2], 10);
        const mod = amPmMatch[3].toUpperCase();
        if (mod === 'PM' && hours < 12) hours += 12;
        if (mod === 'AM' && hours === 12) hours = 0;
      } else {
        const parts24 = cleanTime.split(':').map(Number);
        if (!isNaN(parts24[0])) {
          hours = parts24[0];
          minutes = !isNaN(parts24[1]) ? parts24[1] : 0;
        }
      }
      const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
      return isNaN(d.getTime()) ? null : d.getTime();
    };

    const checkUpcomingReminders = () => {
      const nowMs = Date.now();
      let anyUpdated = false;
      const newReminderNotifs: NotificationItem[] = [];

      const nextInterviews = interviews.map(inv => {
        if (inv.status !== 'scheduled' && inv.status !== 'rescheduled' && inv.status !== 'accepted') {
          return inv;
        }

        const isMyEmployerInterview =
          currentUser.role === 'employer' &&
          (inv.employerId === currentEmployerProfile?.id || inv.employerId === currentUser.id);
        const isMySeekerInterview =
          currentUser.role === 'job_seeker' &&
          (inv.jobSeekerId === currentSeekerProfile?.id ||
            inv.seekerId === currentSeekerProfile?.id ||
            inv.jobSeekerId === currentUser.id);

        if (!isMyEmployerInterview && !isMySeekerInterview) {
          return inv;
        }

        const targetMs = parseInterviewTimestamp(inv.date, inv.time);
        if (!targetMs) return inv;

        const diffMinutes = (targetMs - nowMs) / (1000 * 60);
        // Only trigger for interviews starting within 24 hours and not more than 30 mins in the past
        if (diffMinutes < -30 || diffMinutes > 24 * 60) {
          return inv;
        }

        const sent = { ...(inv.remindersSent || {}) };
        const roleKey = currentUser.role === 'employer' ? 'emp' : 'skr';
        const m15Key = `${roleKey}_m15` as keyof typeof sent;
        const h1Key = `${roleKey}_h1` as keyof typeof sent;
        const h24Key = `${roleKey}_h24` as keyof typeof sent;

        let thresholdTitle = '';
        let thresholdMsg = '';

        if (diffMinutes <= 15 && !sent.m15 && !(sent as any)[m15Key]) {
          sent.m15 = true;
          (sent as any)[m15Key] = true;
          thresholdTitle = `⏰ Interview Starting Soon (In ${Math.max(1, Math.round(diffMinutes))} Mins)`;
          thresholdMsg = isMyEmployerInterview
            ? `Your interview with ${inv.applicantName.toUpperCase()} for "${inv.jobTitle}" starts at ${inv.time} today. Open your Calendar tab now.`
            : `Your interview with ${inv.companyName.toUpperCase()} for "${inv.jobTitle}" starts at ${inv.time} today. Open your Calendar tab to join or review instructions.`;
        } else if (diffMinutes <= 60 && diffMinutes > 15 && !sent.h1 && !(sent as any)[h1Key]) {
          sent.h1 = true;
          (sent as any)[h1Key] = true;
          thresholdTitle = `🔔 Upcoming Interview Within 1 Hour`;
          thresholdMsg = isMyEmployerInterview
            ? `Reminder: Interview with ${inv.applicantName.toUpperCase()} for "${inv.jobTitle}" is today at ${inv.time}.`
            : `Reminder: Your interview with ${inv.companyName.toUpperCase()} for "${inv.jobTitle}" is today at ${inv.time}.`;
        } else if (diffMinutes <= 24 * 60 && diffMinutes > 60 && !sent.h24 && !(sent as any)[h24Key]) {
          sent.h24 = true;
          (sent as any)[h24Key] = true;
          thresholdTitle = `📅 Upcoming Interview Reminder (Within 24 Hours)`;
          thresholdMsg = isMyEmployerInterview
            ? `You have an upcoming interview with ${inv.applicantName.toUpperCase()} for "${inv.jobTitle}" on ${inv.date} at ${inv.time}.`
            : `You have an upcoming interview with ${inv.companyName.toUpperCase()} for "${inv.jobTitle}" on ${inv.date} at ${inv.time}.`;
        }

        if (thresholdTitle) {
          anyUpdated = true;
          const notifItem: NotificationItem = {
            id: `notif-rem-${inv.id}-${roleKey}-${Date.now()}`,
            recipientId: currentUser.id,
            recipientRole: currentUser.role,
            title: thresholdTitle,
            message: thresholdMsg,
            type: 'action',
            read: false,
            createdAt: new Date().toISOString(),
            link: currentUser.role === 'employer' ? 'employer-interviews' : 'seeker-interviews',
          };
          newReminderNotifs.push(notifItem);
          const updatedInv = { ...inv, remindersSent: sent };
          saveDocument(COLLECTIONS.INTERVIEWS, updatedInv);
          return updatedInv;
        }

        return inv;
      });

      if (anyUpdated) {
        setInterviews(nextInterviews);
        if (newReminderNotifs.length > 0) {
          setNotifications(prev => [...newReminderNotifs, ...prev]);
          newReminderNotifs.forEach(n => saveDocument(COLLECTIONS.NOTIFICATIONS, n));
        }
      }
    };

    checkUpcomingReminders();
    const timer = setInterval(checkUpcomingReminders, 60000);
    return () => clearInterval(timer);
  }, [currentUser, currentEmployerProfile?.id, currentSeekerProfile?.id, interviews]);

  // Centralized Decision Tree match resolver bound to candidateMatches state
  const getMatch = useCallback((
    seeker: JobSeekerProfile | null | undefined, 
    job: JobPost | null | undefined, 
    options?: MatchResolverOptions
  ): MatchResult => {
    return getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches, ...options });
  }, [candidateMatches]);

=======
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setNotifications(INITIAL_NOTIFICATIONS);
    resetDirectoryState();
    jobs.resetJobsState();
    pesoLra.resetPesoLraState();
    chatSocial.resetChatSocialState();
    showToast({
      title: 'Demo Accounts Loaded',
      message: 'Active demo accounts for PESO Admin, Puregold, Tech, Agriculture, and Retail Saleslady ready.',
      type: 'success',
    });
  };

>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
  return (
    <AppCoreContext.Provider
      value={{
        currentUser,
        currentEmployerProfile,
        currentSeekerProfile,
        users,
        employers,
        jobSeekers,
        jobPosts: jobs.jobPosts,
        applications: jobs.applications,
        interviews: jobs.interviews,
        notifications,
        auditLogs,
        announcements,
        jobSubscriptions: jobs.jobSubscriptions,
        referralSlips: pesoLra.referralSlips,
        localRecruitmentActivities: pesoLra.localRecruitmentActivities,
        candidateMatches: jobs.candidateMatches,
        activeToast,
        isSupabaseConnected,
        isSyncing,
<<<<<<< HEAD
        getMatch,
        switchUserRole, switchDemoRole, loginAs, continueWithGoogle, logout,
        sendOtp, verifyOtp, recoverPassword, verifyEmployer, createJobPost,
        reviewJobVacancy, updateJobVacancyStatus, updateJobPost, deleteJobPost,
        applyForJob, updateApplicationStatus, upsertCandidateApplicationStatus, submitApplicationFeedback,
        scheduleInterview, rescheduleInterview, cancelInterview, respondToInterview, updateJobSeekerProfile,
        saveAssessmentResult, updateEmployerProfile, issueReferralSlip,
        updateReferralSlipStatus, encodeWalkInJobSeeker, assessJobSeekerWalkIn,
        createLraEvent, updateLraEvent, logHotsApplicant, nominateCandidateToLra,
        removeCandidateFromLra, updateLraCandidateStatus,
        addNotification, markNotificationRead, markAllNotificationsRead,
        deleteNotification, clearAllNotifications, registerUser, resetToDemoData,
        addJobSubscription, updateJobSubscription, deleteJobSubscription,
        showToast, dismissToast, simulateJobMatch,
        bookmarkedJobIds, toggleBookmarkJob, isJobBookmarked,
        conversations, chatMessages, sendChatMessage, markConversationRead,
        companyReviews, addCompanyReview, profileViews, withdrawApplication,
        updateJobSeekingStatus, updateNotificationPreferences,
        invitations, inviteCandidateToApply, respondToInvitation, hasInvitedCandidate,
=======
        getMatch: jobs.getMatch,
        switchUserRole,
        switchDemoRole,
        loginAs,
        continueWithGoogle,
        logout,
        sendOtp,
        verifyOtp,
        recoverPassword,
        verifyEmployer,
        createJobPost: jobs.createJobPost,
        reviewJobVacancy: jobs.reviewJobVacancy,
        updateJobVacancyStatus: jobs.updateJobVacancyStatus,
        updateJobPost: jobs.updateJobPost,
        deleteJobPost: jobs.deleteJobPost,
        applyForJob: jobs.applyForJob,
        updateApplicationStatus: jobs.updateApplicationStatus,
        submitApplicationFeedback: jobs.submitApplicationFeedback,
        scheduleInterview: jobs.scheduleInterview,
        respondToInterview: jobs.respondToInterview,
        updateJobSeekerProfile,
        saveAssessmentResult,
        updateEmployerProfile,
        issueReferralSlip: pesoLra.issueReferralSlip,
        updateReferralSlipStatus: pesoLra.updateReferralSlipStatus,
        encodeWalkInJobSeeker: pesoLra.encodeWalkInJobSeeker,
        assessJobSeekerWalkIn: pesoLra.assessJobSeekerWalkIn,
        createLraEvent: pesoLra.createLraEvent,
        updateLraEvent: pesoLra.updateLraEvent,
        logHotsApplicant: pesoLra.logHotsApplicant,
        nominateCandidateToLra: pesoLra.nominateCandidateToLra,
        removeCandidateFromLra: pesoLra.removeCandidateFromLra,
        updateLraCandidateStatus: pesoLra.updateLraCandidateStatus,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        registerUser,
        resetToDemoData,
        addJobSubscription: jobs.addJobSubscription,
        updateJobSubscription: jobs.updateJobSubscription,
        deleteJobSubscription: jobs.deleteJobSubscription,
        showToast,
        dismissToast,
        simulateJobMatch: jobs.simulateJobMatch,
        bookmarkedJobIds: chatSocial.bookmarkedJobIds,
        toggleBookmarkJob: chatSocial.toggleBookmarkJob,
        isJobBookmarked: chatSocial.isJobBookmarked,
        conversations: chatSocial.conversations,
        chatMessages: chatSocial.chatMessages,
        sendChatMessage: chatSocial.sendChatMessage,
        markConversationRead: chatSocial.markConversationRead,
        companyReviews: chatSocial.companyReviews,
        addCompanyReview: chatSocial.addCompanyReview,
        profileViews: chatSocial.profileViews,
        withdrawApplication: jobs.withdrawApplication,
        updateJobSeekingStatus,
        updateNotificationPreferences,
        invitations: jobs.invitations,
        inviteCandidateToApply: jobs.inviteCandidateToApply,
        hasInvitedCandidate: jobs.hasInvitedCandidate,
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
      }}
    >
      {children}
    </AppCoreContext.Provider>
  );
};

export const AppContext = AppCoreContext;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <NotificationProvider>
        <AuthProvider>
          <DirectoryProvider>
            <ChatSocialProvider>
              <JobsProvider>
                <PesoLraProvider>
                  <AppCoreProvider>
                    {children}
                  </AppCoreProvider>
                </PesoLraProvider>
              </JobsProvider>
            </ChatSocialProvider>
          </DirectoryProvider>
        </AuthProvider>
      </NotificationProvider>
    </ToastProvider>
  );
};

export const useApp = () => {
  const context = useContext(AppCoreContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
