import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  JobPost,
  JobStatus,
  Application,
  ApplicationStatus,
  Interview,
  NotificationItem,
  JobAlertSubscription,
  JobSeekerProfile,
  CandidateMatch,
  CandidateInvitation,
  MatchResult,
  MatchResolverOptions,
} from '../types';
import {
  INITIAL_JOB_POSTS,
  INITIAL_APPLICATIONS,
  INITIAL_INTERVIEWS,
  INITIAL_JOB_SUBSCRIPTIONS,
} from '../data/mockData';
import { getOrCalculateMatch, invalidateMatchCache } from '../utils/matchResolver';
import { evaluateResumeForAts } from '../utils/atsEngine';
import {
  SUPABASE_TABLES,
  COLLECTIONS,
  subscribeToSupabaseTable,
} from '../services/supabaseService';
import { storageAdapter } from '../lib/storageAdapter';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useToast } from './ToastContext';
import { useDirectory } from './DirectoryContext';
import { saveDocument, saveDocuments, deleteDocument } from './persistence';

export interface JobsContextType {
  jobPosts: JobPost[];
  setJobPosts: React.Dispatch<React.SetStateAction<JobPost[]>>;
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  interviews: Interview[];
  jobSubscriptions: JobAlertSubscription[];
  candidateMatches: CandidateMatch[];
  invitations: CandidateInvitation[];
  getMatch: (seeker: JobSeekerProfile | null | undefined, job: JobPost | null | undefined, options?: MatchResolverOptions) => MatchResult;
  createJobPost: (jobData: Omit<JobPost, 'id' | 'postedDate' | 'status' | 'companyVerified'>) => JobPost;
  reviewJobVacancy: (jobId: string, status: 'active' | 'for_compliance' | 'rejected' | 'closed', remarks?: string) => void;
  updateJobVacancyStatus: (jobId: string, status: JobStatus) => void;
  updateJobPost: (jobId: string, updates: Partial<JobPost>) => void;
  deleteJobPost: (jobId: string) => void;
  applyForJob: (jobId: string, seekerId: string, resumeId: string, coverNote?: string) => { success: boolean; message: string; application?: Application };
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => void;
  withdrawApplication: (applicationId: string, notes?: string) => void;
  submitApplicationFeedback: (applicationId: string, feedback: { rating: number; comment: string; submittedBy: string }) => void;
  scheduleInterview: (interviewData: Omit<Interview, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; interview?: Interview };
  respondToInterview: (interviewId: string, status: 'accepted' | 'declined' | 'reschedule_requested', notes?: string) => void;
  addJobSubscription: (subData: Omit<JobAlertSubscription, 'id' | 'createdAt'>) => JobAlertSubscription;
  updateJobSubscription: (id: string, updates: Partial<JobAlertSubscription>) => void;
  deleteJobSubscription: (id: string) => void;
  simulateJobMatch: (subscriptionId?: string) => void;
  inviteCandidateToApply: (jobId: string, seekerId: string, customMessage?: string) => { success: boolean; message: string; invitation?: CandidateInvitation };
  hasInvitedCandidate: (jobId: string, seekerId: string) => boolean;
  resetJobsState: () => void;
}

export const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const { setNotifications } = useNotification();
  const { showToast } = useToast();
  const { employers, jobSeekers, setJobSeekers, logAudit, isSupabaseConnected } = useDirectory();

  const [jobPosts, setJobPosts] = useState<JobPost[]>(INITIAL_JOB_POSTS);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [interviews, setInterviews] = useState<Interview[]>(INITIAL_INTERVIEWS);
  const [jobSubscriptions, setJobSubscriptions] = useState<JobAlertSubscription[]>(INITIAL_JOB_SUBSCRIPTIONS);
  const [candidateMatches, setCandidateMatches] = useState<CandidateMatch[]>([]);
  const [invitations, setInvitations] = useState<CandidateInvitation[]>(() => {
    return storageAdapter.getStoredInvitations([]);
  });

  useEffect(() => {
    storageAdapter.setStoredInvitations(invitations);
  }, [invitations]);

  // Subscribe to Jobs/Applications tables once Supabase connection is established
  useEffect(() => {
    if (!isSupabaseConnected) return;

    const unsubs = [
      subscribeToSupabaseTable<JobPost>(SUPABASE_TABLES.JOB_POSTS, (data) => {
        if (data && data.length > 0) setJobPosts(data);
      }),
      subscribeToSupabaseTable<Application>(SUPABASE_TABLES.APPLICATIONS, (data) => {
        if (data && data.length > 0) setApplications(data);
      }),
      subscribeToSupabaseTable<Interview>(SUPABASE_TABLES.INTERVIEWS, (data) => {
        if (data && data.length > 0) setInterviews(data);
      }),
      subscribeToSupabaseTable<JobAlertSubscription>(SUPABASE_TABLES.JOB_SUBSCRIPTIONS, (data) => {
        if (data && data.length > 0) setJobSubscriptions(data);
      }),
      subscribeToSupabaseTable<CandidateMatch>(SUPABASE_TABLES.CANDIDATE_MATCHES, (data) => {
        if (data && data.length > 0) setCandidateMatches(data);
      }),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [isSupabaseConnected]);

  // Check job subscriptions and notify matching job seekers
  const checkJobSubscriptionsAndNotify = (newJob: JobPost) => {
    const subNotifications: NotificationItem[] = [];

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
          id: `notif-${crypto.randomUUID()}`,
          recipientId: sub.userId,
          recipientRole: 'job_seeker',
          title: `New Job Vacancy Alert: ${newJob.title}`,
          message: `${newJob.companyName} posted "${newJob.title}" in ${newJob.municipality} matching your "${sub.title}" subscription alert.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/seeker/jobs',
        };
        subNotifications.push(notif);

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

    if (subNotifications.length > 0) {
      setNotifications(prev => [...subNotifications, ...prev]);
      saveDocuments(COLLECTIONS.NOTIFICATIONS, subNotifications);
    }
  };

  const addJobSubscription = (subData: Omit<JobAlertSubscription, 'id' | 'createdAt'>): JobAlertSubscription => {
    const newSub: JobAlertSubscription = {
      ...subData,
      id: `sub-${crypto.randomUUID()}`,
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
      id: `job-sim-${crypto.randomUUID()}`,
      employerId: 'emp-1',
      companyName: 'Mindoro Digital Solutions Inc.',
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150',
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

  // Create Job Post (Employer Action - Submits for PESO Review)
  const createJobPost = (jobData: Omit<JobPost, 'id' | 'postedDate' | 'status' | 'companyVerified'>): JobPost => {
    const emp = employers.find(e => e.id === jobData.employerId);
    const isVerified = emp?.status === 'verified';

    const newJob: JobPost = {
      ...jobData,
      id: `job-${crypto.randomUUID()}`,
      postedDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
      companyVerified: isVerified,
    };

    setJobPosts(prev => [newJob, ...prev]);
    saveDocument(COLLECTIONS.JOB_POSTS, newJob);

    // Notify Admin of pending job vacancy
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: adminUser.id,
        recipientRole: 'admin',
        title: 'New Job Vacancy Pending PESO Review',
        message: `${newJob.companyName} submitted "${newJob.title}" (${newJob.municipality}) for vacancy review & publication approval.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/admin/jobs',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('JOB_CREATED', 'JobPost', newJob.id, `Submitted job posting for PESO review: "${newJob.title}" in ${newJob.municipality}`);
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

      const emp = employers.find(e => e.id === job.employerId);

      // Notify Employer
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: emp?.userId || job.employerId,
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

  // Automatically evaluate and notify matching job seekers when a job vacancy is approved & published
  const notifyAndCacheCandidateMatches = (job: JobPost) => {
    const newMatches: CandidateMatch[] = [];
    const matchNotifications: NotificationItem[] = [];

    jobSeekers.forEach(seeker => {
      const matchResult = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });

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

      if (matchResult.overallMatch >= 70) {
        const matchNotif: NotificationItem = {
          id: `notif-match-${crypto.randomUUID()}`,
          recipientId: seeker.userId,
          recipientRole: 'job_seeker',
          title: `Job Match Found: ${job.title} (${Math.round(matchResult.overallMatch)}%)`,
          message: `${job.companyName} has published "${job.title}" in ${job.municipality}, which aligns with your qualifications (${Math.round(matchResult.overallMatch)}% Decision Tree compatibility)!`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/seeker/dashboard',
        };
        matchNotifications.push(matchNotif);

        if (currentUser?.id === seeker.userId) {
          showToast({
            title: `High Match Vacancy Available!`,
            message: `${job.companyName} posted "${job.title}" (${Math.round(matchResult.overallMatch)}% Match). Apply now!`,
            jobId: job.id,
            companyName: job.companyName,
            municipality: job.municipality,
            category: job.category,
          });
        }
      }
    });

    if (newMatches.length > 0) {
      saveDocuments(SUPABASE_TABLES.CANDIDATE_MATCHES, newMatches);
      setCandidateMatches(prev => {
        const map = new Map<string, CandidateMatch>();
        prev.forEach(m => map.set(`${m.jobId}:${m.jobSeekerId}`, m));
        newMatches.forEach(m => map.set(`${m.jobId}:${m.jobSeekerId}`, m));
        return Array.from(map.values());
      });
    }

    if (matchNotifications.length > 0) {
      setNotifications(prev => [...matchNotifications, ...prev]);
      saveDocuments(COLLECTIONS.NOTIFICATIONS, matchNotifications);
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

    const existing = applications.find(a => a.jobId === jobId && a.jobSeekerId === seekerId);
    if (existing) {
      return { success: false, message: 'You have already submitted an application for this position.' };
    }

    if (job.status !== 'active') {
      return { success: false, message: 'This job vacancy is no longer accepting applications.' };
    }

    const matchResult: MatchResult = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });

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

    if (atsResult.score >= 50) {
      initialHistory.push({
        status: 'ats_screened',
        updatedAt: new Date().toISOString(),
        updatedBy: 'eHANAP ATS Engine',
        notes: `ATS Audit passed with score ${atsResult.score}/100 (Grade ${atsResult.grade}, ${atsResult.matchedKeywords.length} matching job keywords).`,
      });
    }

    const newApp: Application = {
      id: `app-${crypto.randomUUID()}`,
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

    const employerUser = users.find(u => u.role === 'employer' && employers.some(e => e.id === job.employerId && e.userId === u.id));
    if (employerUser) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: employerUser.id,
        recipientRole: 'employer',
        title: 'New Job Application Received',
        message: `${seeker.firstName} ${seeker.lastName} applied for "${job.title}" (${matchResult.overallMatch}% Decision Tree Match).`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/employer/applicants',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('APPLICATION_SUBMITTED', 'Application', newApp.id, `Applied for "${job.title}" with match score ${matchResult.overallMatch}%`);

    return { success: true, message: 'Application submitted successfully!', application: newApp };
  };

  // Update Application Status (Employer)
  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus, notes?: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) {
      logAudit('APPLICATION_STATUS_UPDATED', 'Application', applicationId, `Status changed to ${status}`);
      return;
    }

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
    setApplications(prev => prev.map(a => a.id === applicationId ? updatedApp : a));
    saveDocument(COLLECTIONS.APPLICATIONS, updatedApp);

    if (seeker) {
      const seekerUser = users.find(u => u.id === seeker.userId);
      if (seekerUser) {
        const notif: NotificationItem = {
          id: `notif-${crypto.randomUUID()}`,
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

    logAudit('APPLICATION_STATUS_UPDATED', 'Application', applicationId, `Status changed to ${status}`);
  };

  const withdrawApplication = (applicationId: string, notes: string = 'Application withdrawn by applicant') => {
    updateApplicationStatus(applicationId, 'withdrawn', notes);
  };

  // Schedule Interview (with Schedule Validation)
  const scheduleInterview = (interviewData: Omit<Interview, 'id' | 'createdAt' | 'status'>) => {
    const seekerConflict = interviews.find(i =>
      i.jobSeekerId === interviewData.jobSeekerId &&
      i.date === interviewData.date &&
      i.time === interviewData.time &&
      (i.status === 'scheduled' || i.status === 'accepted')
    );

    if (seekerConflict) {
      return {
        success: false,
        message: `Conflict detected: Applicant ${interviewData.applicantName} already has another interview scheduled on ${interviewData.date} at ${interviewData.time}.`
      };
    }

    const employerConflict = interviews.find(i =>
      i.employerId === interviewData.employerId &&
      i.date === interviewData.date &&
      i.time === interviewData.time &&
      (i.status === 'scheduled' || i.status === 'accepted')
    );

    if (employerConflict) {
      return {
        success: false,
        message: `Conflict detected: Employer already has another interview booked on ${interviewData.date} at ${interviewData.time}.`
      };
    }

    const newInterview: Interview = {
      ...interviewData,
      id: `int-${crypto.randomUUID()}`,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    setInterviews(prev => [newInterview, ...prev]);
    saveDocument(COLLECTIONS.INTERVIEWS, newInterview);

    updateApplicationStatus(interviewData.applicationId, 'interview_scheduled', `Interview scheduled for ${interviewData.date} at ${interviewData.time}`);

    const seeker = jobSeekers.find(s => s.id === interviewData.jobSeekerId);
    if (seeker) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: seeker.userId,
        recipientRole: 'job_seeker',
        title: 'Interview Invitation Received',
        message: `${interviewData.companyName} invited you for a ${interviewData.interviewType} interview for "${interviewData.jobTitle}" on ${interviewData.date} at ${interviewData.time}.`,
        type: 'action',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/seeker/interviews',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('INTERVIEW_SCHEDULED', 'Interview', newInterview.id, `Scheduled interview with ${interviewData.applicantName} on ${interviewData.date}`);

    return { success: true, message: 'Interview successfully scheduled!', interview: newInterview };
  };

  // Respond to Interview (Accept / Decline / Reschedule)
  const respondToInterview = (interviewId: string, status: 'accepted' | 'declined' | 'reschedule_requested', notes?: string) => {
    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) {
      logAudit('INTERVIEW_RESPONSE', 'Interview', interviewId, `Applicant responded: ${status}`);
      return;
    }

    const updated = { ...interview, status, rescheduleNotes: notes || interview.rescheduleNotes };
    setInterviews(prev => prev.map(i => i.id === interviewId ? updated : i));
    saveDocument(COLLECTIONS.INTERVIEWS, updated);

    const emp = employers.find(e => e.id === interview.employerId);
    if (emp) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: emp.userId,
        recipientRole: 'employer',
        title: `Interview ${(status || '').replace(/_/g, ' ').toUpperCase()}`,
        message: `${interview.applicantName} has ${(status || '').replace(/_/g, ' ')} the interview for "${interview.jobTitle}". ${notes ? `Notes: ${notes}` : ''}`,
        type: status === 'accepted' ? 'success' : 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/employer/applicants',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    logAudit('INTERVIEW_RESPONSE', 'Interview', interviewId, `Applicant responded: ${status}`);
  };

  const inviteCandidateToApply = (
    jobId: string,
    seekerId: string,
    customMessage?: string
  ): { success: boolean; message: string; invitation?: CandidateInvitation } => {
    const job = jobPosts.find(j => j.id === jobId);
    if (!job) {
      return { success: false, message: 'Job posting not found.' };
    }
    const seeker = jobSeekers.find(s => s.id === seekerId);
    if (!seeker) {
      return { success: false, message: 'Candidate profile not found.' };
    }

    const alreadyInvited = invitations.some(inv => inv.jobId === jobId && inv.jobSeekerId === seekerId);
    if (alreadyInvited) {
      return {
        success: false,
        message: `${seeker.firstName} ${seeker.lastName} has already been invited to apply for this vacancy.`
      };
    }

    const match = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches });
    const score = Math.round(match.overallMatch);

    const newInvitation: CandidateInvitation = {
      id: `inv-${crypto.randomUUID()}`,
      jobId: job.id,
      employerId: job.employerId,
      companyName: job.companyName,
      jobTitle: job.title,
      jobSeekerId: seeker.id,
      seekerName: `${seeker.firstName} ${seeker.lastName}`,
      matchScore: score,
      message: customMessage || `You have been selected as a top-matching candidate (${score}% compatibility) for "${job.title}". We invite you to apply!`,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };

    setInvitations(prev => [newInvitation, ...prev]);

    const inviteNotif: NotificationItem = {
      id: `notif-invite-${crypto.randomUUID()}`,
      recipientId: seeker.userId,
      recipientRole: 'job_seeker',
      title: `Job Opportunity Invitation: ${job.title} (${score}% Match)`,
      message: `${job.companyName} reviewed your credentials and invites you to apply for "${job.title}" in ${job.municipality || 'Roxas'} (${score}% Decision Tree compatibility)!`,
      type: 'action',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/seeker/dashboard',
    };

    setNotifications(prev => [inviteNotif, ...prev]);
    saveDocument(COLLECTIONS.NOTIFICATIONS, inviteNotif);

    logAudit(
      'CANDIDATE_INVITED',
      'JobPost',
      job.id,
      `Employer ${job.companyName} invited ${seeker.firstName} ${seeker.lastName} (${seeker.id}) to apply for ${job.title} (Match: ${score}%)`
    );

    showToast({
      title: 'Candidate Invited',
      message: `Direct job invitation dispatched to ${seeker.firstName} ${seeker.lastName} (${score}% Match).`,
      type: 'success',
    });

    return {
      success: true,
      message: `Invitation successfully sent to ${seeker.firstName} ${seeker.lastName}.`,
      invitation: newInvitation,
    };
  };

  const hasInvitedCandidate = useCallback((jobId: string, seekerId: string): boolean => {
    return invitations.some(inv => inv.jobId === jobId && inv.jobSeekerId === seekerId);
  }, [invitations]);

  const getMatch = useCallback((
    seeker: JobSeekerProfile | null | undefined,
    job: JobPost | null | undefined,
    options?: MatchResolverOptions
  ): MatchResult => {
    return getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches, ...options });
  }, [candidateMatches]);

  const resetJobsState = () => {
    setJobPosts(INITIAL_JOB_POSTS);
    setApplications(INITIAL_APPLICATIONS);
    setInterviews(INITIAL_INTERVIEWS);
    setJobSubscriptions(INITIAL_JOB_SUBSCRIPTIONS);
  };

  return (
    <JobsContext.Provider
      value={{
        jobPosts,
        setJobPosts,
        applications,
        setApplications,
        interviews,
        jobSubscriptions,
        candidateMatches,
        invitations,
        getMatch,
        createJobPost,
        reviewJobVacancy,
        updateJobVacancyStatus,
        updateJobPost,
        deleteJobPost,
        applyForJob,
        updateApplicationStatus,
        withdrawApplication,
        submitApplicationFeedback,
        scheduleInterview,
        respondToInterview,
        addJobSubscription,
        updateJobSubscription,
        deleteJobSubscription,
        simulateJobMatch,
        inviteCandidateToApply,
        hasInvitedCandidate,
        resetJobsState,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export const useJobs = (): JobsContextType => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};
