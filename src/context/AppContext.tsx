import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { ToastProvider, useToast, ToastInput } from './ToastContext';
import { NotificationProvider, useNotification } from './NotificationContext';
import { AuthProvider, useAuth } from './AuthContext';
import { DirectoryProvider, useDirectory, normalizeEmployerProfileToUpperCase } from './DirectoryContext';
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
  switchDemoRole: (target: 'job_seeker' | 'employer' | 'admin' | string) => { success: boolean; user?: User; role?: UserRole; error?: string };
  loginAs: (email: string, password?: string) => { success: boolean; user?: User; isProfileCompleted?: boolean; seekerProfile?: JobSeekerProfile | null; employerProfile?: EmployerProfile | null; error?: string } | Promise<{ success: boolean; user?: User; isProfileCompleted?: boolean; seekerProfile?: JobSeekerProfile | null; employerProfile?: EmployerProfile | null; error?: string }>;
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
  updateReferralSlipStatus: (slipId: string, status: PesoReferralSlip['status'], isHotsOrRemarks?: boolean | string) => void;
  encodeWalkInJobSeeker: (seekerData: Partial<JobSeekerProfile> & { firstName: string; lastName: string; contactNumber: string }) => JobSeekerProfile;
  assessJobSeekerWalkIn: (seekerId: string, assessmentData: { practicalSkills?: string[]; tradeCertifications?: string[]; geographicMobility?: 'local_only' | 'provincial' | 'willing_to_relocate'; willingToRelocateForVisitingCompanies?: boolean; walkInAssessmentNotes?: string; assessedByOfficer?: string }) => void;
  createLraEvent: (eventData: Partial<LocalRecruitmentActivity> & { companyName: string }) => LocalRecruitmentActivity;
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
  return next;
};

export { normalizeEmployerProfileToUpperCase };

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
    [authRegisterUser, setJobSeekers, setEmployers]
  );

  // Cross-domain: verifying an employer enforces document/profile check, updates employer profile, sends notification, and updates their job posts
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
        verificationNotes: notes || emp.verificationNotes,
        complianceRemarks: (status === 'for_compliance' || status === 'rejected') ? (notes || 'Additional requirements needed.') : emp.complianceRemarks,
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
          : status === 'rejected'
          ? 'Employer Verification Not Approved — Action Required'
          : `Employer Status Updated to ${status.replace(/_/g, ' ').toUpperCase()}`,
        message: status === 'verified'
          ? 'Your business requirements have been verified by PESO Oriental Mindoro. You may now create and publish job vacancies.'
          : status === 'for_compliance' || status === 'rejected'
          ? `PESO Oriental Mindoro reviewed your documents: ${notes || 'Please re-upload clear copies of your business verification documents in the Profile tab.'}`
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

  // Cross-domain: updating a seeker profile normalizes to ALL CAPS, recalculates application match scores, and syncs Auth user metadata
  const updateJobSeekerProfile = (seekerId: string, rawProfileData: Partial<JobSeekerProfile>) => {
    const profileData = normalizeSeekerProfileToUpperCase(rawProfileData);
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
        firstName: (currentUser.name.split(' ')[0] || 'USER').toUpperCase(),
        lastName: (currentUser.name.split(' ').slice(1).join(' ') || '').toUpperCase(),
        email: currentUser.email,
        contactNumber: currentUser.phone || '',
        address: 'ROXAS, ORIENTAL MINDORO',
        municipality: 'Roxas',
        educationalAttainment: 'College Graduate',
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

  // Automatic Upcoming Interview Reminders (24h, 1h, and 15m before start)
  useEffect(() => {
    if (!currentUser) return;

    const parseInterviewTimestamp = (dateStr?: string, timeStr?: string): number | null => {
      if (!dateStr || !timeStr) return null;
      const [year, month, day] = dateStr.trim().split('-').map(Number);
      if (!year || !month || !day) return null;

      let hours = 9;
      let minutes = 0;
      const amPmMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (amPmMatch) {
        hours = parseInt(amPmMatch[1], 10);
        minutes = parseInt(amPmMatch[2], 10);
        const mod = amPmMatch[3].toUpperCase();
        if (mod === 'PM' && hours < 12) hours += 12;
        if (mod === 'AM' && hours === 12) hours = 0;
      } else {
        const parts24 = timeStr.trim().split(':').map(Number);
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

      const nextInterviews = jobs.interviews.map(inv => {
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

        if (!isMyEmployerInterview && !isMySeekerInterview) return inv;

        const targetMs = parseInterviewTimestamp(inv.date, inv.time);
        if (!targetMs) return inv;

        const diffMinutes = (targetMs - nowMs) / (1000 * 60);
        if (diffMinutes < -30 || diffMinutes > 24 * 60) return inv;

        const sent = { ...(inv.remindersSent || {}) };
        const roleKey = currentUser.role === 'employer' ? 'emp' : 'skr';
        const m15Key = `${roleKey}_m15`;
        const h1Key = `${roleKey}_h1`;
        const h24Key = `${roleKey}_h24`;

        let thresholdTitle = '';
        let thresholdMsg = '';

        if (diffMinutes <= 15 && !sent.m15 && !(sent as any)[m15Key]) {
          sent.m15 = true;
          (sent as any)[m15Key] = true;
          thresholdTitle = `⏰ Interview Starting Soon (In ${Math.max(1, Math.round(diffMinutes))} Mins)`;
          thresholdMsg = isMyEmployerInterview
            ? `Your interview with ${inv.applicantName.toUpperCase()} for "${inv.jobTitle}" starts at ${inv.time} today.`
            : `Your interview with ${inv.companyName.toUpperCase()} for "${inv.jobTitle}" starts at ${inv.time} today.`;
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
          newReminderNotifs.push({
            id: `notif-rem-${inv.id}-${roleKey}-${Date.now()}`,
            recipientId: currentUser.id,
            recipientRole: currentUser.role,
            title: thresholdTitle,
            message: thresholdMsg,
            type: 'action',
            read: false,
            createdAt: new Date().toISOString(),
            link: currentUser.role === 'employer' ? 'employer-interviews' : 'seeker-interviews',
          });
          const updatedInv = { ...inv, remindersSent: sent };
          saveDocument(COLLECTIONS.INTERVIEWS, updatedInv);
          return updatedInv;
        }
        return inv;
      });

      if (anyUpdated) {
        jobs.setInterviews(nextInterviews);
        if (newReminderNotifs.length > 0) {
          setNotifications(prev => [...newReminderNotifs, ...prev]);
          newReminderNotifs.forEach(n => saveDocument(COLLECTIONS.NOTIFICATIONS, n));
        }
      }
    };

    checkUpcomingReminders();
    const timer = setInterval(checkUpcomingReminders, 60000);
    return () => clearInterval(timer);
  }, [currentUser, currentEmployerProfile?.id, currentSeekerProfile?.id, jobs.interviews]);

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
      title: 'Clean Slate Reset Complete',
      message: 'All data has been reset to a clean empty database state.',
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
        upsertCandidateApplicationStatus: jobs.upsertCandidateApplicationStatus,
        submitApplicationFeedback: jobs.submitApplicationFeedback,
        scheduleInterview: jobs.scheduleInterview,
        rescheduleInterview: jobs.rescheduleInterview,
        cancelInterview: jobs.cancelInterview,
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
        respondToInvitation: jobs.respondToInvitation,
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

export const useApp = (): AppContextType => {
  const context = useContext(AppCoreContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
