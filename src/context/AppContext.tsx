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
  createJobPost: (jobData: Omit<JobPost, 'id' | 'postedDate' | 'status' | 'companyVerified'>) => JobPost;
  reviewJobVacancy: (jobId: string, status: 'active' | 'for_compliance' | 'rejected' | 'closed', remarks?: string) => void;
  updateJobVacancyStatus: (jobId: string, status: JobStatus) => void;
  updateJobPost: (jobId: string, updates: Partial<JobPost>) => void;
  deleteJobPost: (jobId: string) => void;
  applyForJob: (jobId: string, seekerId: string, resumeId: string, coverNote?: string) => { success: boolean; message: string; application?: Application };
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => void;
  submitApplicationFeedback: (applicationId: string, feedback: { rating: number; comment: string; submittedBy: string }) => void;
  scheduleInterview: (interviewData: Omit<Interview, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; interview?: Interview };
  respondToInterview: (interviewId: string, status: 'accepted' | 'declined' | 'reschedule_requested', notes?: string) => void;
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
  hasInvitedCandidate: (jobId: string, seekerId: string) => boolean;
}

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
    continueWithGoogle, // Routes Google OAuth via signInWithSupabaseOAuth in AuthContext
    logout,
    registerUser,
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

  // Cross-domain: verifying an employer updates employer profile, sends notification, and updates their job posts
  const verifyEmployer = (employerId: string, status: EmployerStatus, notes?: string) => {
    const emp = employers.find(e => e.id === employerId);
    if (emp) {
      const updated: EmployerProfile = {
        ...emp,
        status,
        verificationNotes: notes || emp.verificationNotes,
        complianceRemarks: status === 'for_compliance' ? (notes || 'Additional requirements needed.') : emp.complianceRemarks,
      };

      setEmployers(prev => prev.map(e => e.id === employerId ? updated : e));
      saveDocument(COLLECTIONS.EMPLOYERS, updated);

      const notifItem: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: emp.userId,
        recipientRole: 'employer',
        title: status === 'verified'
          ? 'Employer Verification Approved!'
          : status === 'for_compliance'
          ? 'Employer Verification: Additional Compliance Required'
          : `Employer Status Updated to ${status.toUpperCase()}`,
        message: status === 'verified'
          ? 'Your business requirements have been verified by PESO Oriental Mindoro. You may now create and submit job vacancies.'
          : status === 'for_compliance'
          ? `PESO Oriental Mindoro requested compliance updates: ${notes || 'Please provide required business permits and accreditation documents.'}`
          : `Your employer account status was updated: ${notes || status}`,
        type: status === 'verified' ? 'success' : 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/employer/dashboard',
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

  // Cross-domain: updating a seeker profile recalculates application match scores and syncs Auth user metadata
  const updateJobSeekerProfile = (seekerId: string, profileData: Partial<JobSeekerProfile>) => {
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
