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
  notifyAndCacheCandidateMatches: (job: JobPost, seekersToEvaluate?: JobSeekerProfile[]) => void;
  createJobPost: (jobData: Omit<JobPost, 'id' | 'postedDate' | 'status' | 'companyVerified'>) => JobPost | null;
  reviewJobVacancy: (jobId: string, status: 'active' | 'for_compliance' | 'rejected' | 'closed', remarks?: string) => void;
  updateJobVacancyStatus: (jobId: string, status: JobStatus) => void;
  updateJobPost: (jobId: string, updates: Partial<JobPost>) => void;
  deleteJobPost: (jobId: string) => void;
  applyForJob: (jobId: string, seekerId: string, resumeId: string, coverNote?: string) => { success: boolean; message: string; application?: Application };
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string) => void;
  upsertCandidateApplicationStatus: (jobId: string, seekerId: string, status: ApplicationStatus, notes?: string) => Application | null;
  withdrawApplication: (applicationId: string, notes?: string) => void;
  submitApplicationFeedback: (applicationId: string, feedback: { rating: number; comment: string; submittedBy: string }) => void;
  scheduleInterview: (interviewData: Omit<Interview, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; interview?: Interview };
  rescheduleInterview: (interviewId: string, updates: { date: string; time: string; interviewType?: Interview['interviewType']; locationOrLink?: string; instructions?: string }) => { success: boolean; message: string };
  cancelInterview: (interviewId: string, reason?: string) => void;
  respondToInterview: (interviewId: string, status: 'accepted' | 'declined' | 'reschedule_requested' | 'accept' | 'decline' | 'reschedule', notes?: string) => void;
  addJobSubscription: (subData: Omit<JobAlertSubscription, 'id' | 'createdAt'>) => JobAlertSubscription;
  updateJobSubscription: (id: string, updates: Partial<JobAlertSubscription>) => void;
  deleteJobSubscription: (id: string) => void;
  simulateJobMatch: (subscriptionId?: string) => void;
  inviteCandidateToApply: (jobId: string, seekerId: string, customMessage?: string) => { success: boolean; message: string; invitation?: CandidateInvitation };
  respondToInvitation: (invitationId: string, status: 'accepted' | 'declined') => void;
  hasInvitedCandidate: (jobId: string, seekerId: string) => boolean;
  resetJobsState: () => void;
}

export const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const { setNotifications } = useNotification();
  const { showToast } = useToast();
  const {
    employers,
    jobSeekers,
    setJobSeekers,
    currentEmployerProfile,
    currentSeekerProfile,
    logAudit,
    isSupabaseConnected,
  } = useDirectory();

  const [jobPosts, setJobPosts] = useState<JobPost[]>(() =>
    storageAdapter.getStoredJobPosts(INITIAL_JOB_POSTS)
  );
  const [applications, setApplications] = useState<Application[]>(() =>
    storageAdapter.getStoredApplications(INITIAL_APPLICATIONS)
  );
  const [interviews, setInterviews] = useState<Interview[]>(() =>
    storageAdapter.getStoredInterviews(INITIAL_INTERVIEWS)
  );
  const [jobSubscriptions, setJobSubscriptions] = useState<JobAlertSubscription[]>(INITIAL_JOB_SUBSCRIPTIONS);
  const [candidateMatches, setCandidateMatches] = useState<CandidateMatch[]>(() =>
    storageAdapter.getStoredCandidateMatches([])
  );
  const [invitations, setInvitations] = useState<CandidateInvitation[]>(() => {
    return storageAdapter.getStoredInvitations([]);
  });

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
    storageAdapter.setStoredCandidateMatches(candidateMatches);
  }, [candidateMatches]);

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
      id: `job-${crypto.randomUUID()}`,
      postedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      companyVerified: true,
    };

    setJobPosts(prev => [newJob, ...prev]);
    saveDocument(COLLECTIONS.JOB_POSTS, newJob);

    // Notify Admin of the newly published verified job vacancy
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: adminUser.id,
        recipientRole: 'admin',
        title: `New Verified Job Vacancy Published: ${newJob.title}`,
        message: `${newJob.companyName} published "${newJob.title}" (${newJob.municipality}). Automated matching engine has evaluated registered and walk-in applicants.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/admin/job-matching',
      };
      setNotifications(n => [notif, ...n]);
      saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

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

  // Automatically evaluate and notify matching job seekers AND LGU/PESO Admin (for walk-in applicants) when a job vacancy is published
  const notifyAndCacheCandidateMatches = (job: JobPost, seekersToEvaluate: JobSeekerProfile[] = jobSeekers) => {
    const newMatches: CandidateMatch[] = [];
    const matchNotifications: NotificationItem[] = [];
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

      // 1. If Walk-In Applicant matches the job (overallMatch >= 50%), automatically notify LGU/PESO Admin
      const isWalkInApplicant = Boolean(seeker.isWalkIn || seeker.registrationType === 'walk_in');
      if (isWalkInApplicant && overallPct >= 50) {
        const seekerFullName = `${seeker.firstName} ${seeker.lastName}`.trim();
        const contactSummary = [
          seeker.contactNumber ? `Phone: ${seeker.contactNumber}` : null,
          seeker.email ? `Email: ${seeker.email}` : null,
          seeker.barangay ? `Brgy. ${seeker.barangay}, ${seeker.municipality || 'Roxas'}` : seeker.address,
        ].filter(Boolean).join(' • ');

        const breakdownSummary = `Skills: ${Math.round(matchResult.skillsMatchScore)}% | Education: ${Math.round(matchResult.educationMatchScore)}% | Degree: ${Math.round(matchResult.degreeAlignmentScore)}% | Experience: ${Math.round(matchResult.experienceMatchScore)}% | Certs: ${Math.round(matchResult.certificationsMatchScore)}%`;

        matchNotifications.push({
          id: `notif-walkin-match-${crypto.randomUUID()}`,
          recipientId: adminUser?.id || 'admin',
          recipientRole: 'admin',
          title: `📞 Walk-In Match Outreach Required: ${seekerFullName} → ${job.title} (${overallPct}% Match)`,
          message: `Walk-in applicant ${seekerFullName} (${contactSummary}) matched "${job.title}" at ${job.companyName} with ${overallPct}% compatibility (${matchResult.outcome}). Breakdown: [${breakdownSummary}]. Please contact the applicant to confirm if they want to proceed and update their hiring status.`,
          type: 'action',
          read: false,
          createdAt: new Date().toISOString(),
          link: 'admin-job-matching',
        });
      }

      // 2. If qualification threshold >= 60%, dispatch real-time Match Alert notification to the Job Seeker
      if (overallPct >= 60) {
        const matchNotif: NotificationItem = {
          id: `notif-match-${crypto.randomUUID()}`,
          recipientId: seeker.userId,
          recipientRole: 'job_seeker',
          title: `Job Match Found: ${job.title} (${overallPct}%)`,
          message: `${job.companyName} has published "${job.title}" in ${job.municipality}, which aligns with your profile (${overallPct}% Decision Tree compatibility)!`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/seeker/dashboard',
        };
        matchNotifications.push(matchNotif);

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

  // Update Job Vacancy Status (Employer Action: Close / Archive; PESO Admin owns approval to Active)
  const updateJobVacancyStatus = (jobId: string, status: JobStatus) => {
    const existing = jobPosts.find(j => j.id === jobId);
    if (
      status === 'active' &&
      currentUser?.role !== 'admin' &&
      existing &&
      existing.status !== 'active'
    ) {
      showToast({
        title: 'PESO Approval Required',
        message: 'Only PESO/LGU Admin can approve or reactivate a vacancy to Active.',
        type: 'alert',
      });
      return;
    }
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

    const employerUser = users.find(u => u.role === 'employer' && employers.some(e => e.id === job.employerId && e.userId === u.id));
    const employerRecipientId = employerUser?.id || employers.find(e => e.id === job.employerId)?.userId || job.employerId;
    if (employerRecipientId) {
      const seekerUpperName = `${seeker.firstName} ${seeker.lastName}`.trim().toUpperCase();
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
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
      id: `app-${crypto.randomUUID()}`,
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

    if (seeker.userId) {
      const notifItem: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
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

    if (currentUser?.role === 'admin') {
      const emp = employers.find(e => e.id === job.employerId);
      if (emp) {
        const empNotif: NotificationItem = {
          id: `notif-${crypto.randomUUID()}`,
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

    const {
      vacancyId: _vacancyId,
      seekerId: _seekerId,
      format: _format,
      notes: _notes,
      ...canonicalInterviewData
    } = interviewData;

    const newInterview: Interview = {
      ...canonicalInterviewData,
      id: `int-${crypto.randomUUID()}`,
      jobId: interviewData.jobId || interviewData.vacancyId || '',
      jobSeekerId: interviewData.jobSeekerId || interviewData.seekerId || '',
      applicantName: (interviewData.applicantName || '').toUpperCase(),
      companyName: (interviewData.companyName || '').toUpperCase(),
      interviewType: normalizedFormat,
      locationOrLink: normalizedLocation,
      instructions: normalizedNotes,
      status: 'scheduled',
      remindersSent: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInterviews(prev => [newInterview, ...prev]);
    saveDocument(COLLECTIONS.INTERVIEWS, newInterview);

    updateApplicationStatus(interviewData.applicationId, 'interview_scheduled', `Interview scheduled for ${interviewData.date} at ${interviewData.time}`);

    const seeker = jobSeekers.find(s => s.id === interviewData.jobSeekerId);
    if (seeker) {
      const formatLabel =
        normalizedFormat === 'video'
          ? 'Online / Video'
          : normalizedFormat === 'face_to_face'
          ? 'On-Site / Office'
          : 'Phone';
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
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
      locationOrLink: nextLocation,
      instructions: nextNotes,
      status: 'rescheduled',
      rescheduleNotes: `RESCHEDULED TO ${updates.date} AT ${updates.time}`.toUpperCase(),
      remindersSent: {},
      updatedAt: new Date().toISOString(),
    };

    setInterviews(prev => prev.map(i => (i.id === interviewId ? updatedInterview : i)));
    saveDocument(COLLECTIONS.INTERVIEWS, updatedInterview);

    const seeker = jobSeekers.find(s => s.id === existing.jobSeekerId || s.id === existing.seekerId);
    if (seeker) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
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
        id: `notif-${crypto.randomUUID()}`,
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

    const interview = interviews.find(i => i.id === interviewId);
    if (!interview) {
      logAudit('INTERVIEW_RESPONSE', 'Interview', interviewId, `Applicant responded: ${status}`);
      return;
    }

    const updated = {
      ...interview,
      status,
      rescheduleNotes: notes ? notes.toUpperCase() : interview.rescheduleNotes,
      updatedAt: new Date().toISOString(),
    };
    setInterviews(prev => prev.map(i => i.id === interviewId ? updated : i));
    saveDocument(COLLECTIONS.INTERVIEWS, updated);

    const emp = employers.find(e => e.id === interview.employerId);
    if (emp) {
      const notif: NotificationItem = {
        id: `notif-${crypto.randomUUID()}`,
        recipientId: emp.userId,
        recipientRole: 'employer',
        title: `Interview ${(status || '').replace(/_/g, ' ').toUpperCase()}`,
        message: `${interview.applicantName.toUpperCase()} has ${(status || '').replace(/_/g, ' ')} the interview for "${interview.jobTitle}". ${notes ? `Notes: ${notes.toUpperCase()}` : ''}`,
        type: status === 'accepted' ? 'success' : 'warning',
        read: false,
        createdAt: new Date().toISOString(),
        link: 'employer-interviews',
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
      id: `inv-${crypto.randomUUID()}`,
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
      id: `notif-invite-${crypto.randomUUID()}`,
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
          id: `notif-inv-decline-${crypto.randomUUID()}`,
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

  const hasInvitedCandidate = useCallback((jobId: string, seekerId: string): boolean => {
    return invitations.some(
      inv => (inv.jobId === jobId || inv.vacancyId === jobId) && (inv.jobSeekerId === seekerId || inv.seekerId === seekerId)
    );
  }, [invitations]);

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
            id: `notif-rem-${inv.id}-${roleKey}-${crypto.randomUUID()}`,
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

  const getMatch = useCallback((
    seeker: JobSeekerProfile | null | undefined,
    job: JobPost | null | undefined,
    options?: MatchResolverOptions
  ): MatchResult => {
    return getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches, ...options });
  }, [candidateMatches]);

  const resetJobsState = () => {
    setJobPosts([]);
    setApplications([]);
    setInterviews([]);
    setJobSubscriptions([]);
    setCandidateMatches([]);
    setInvitations([]);
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
        notifyAndCacheCandidateMatches,
        createJobPost,
        reviewJobVacancy,
        updateJobVacancyStatus,
        updateJobPost,
        deleteJobPost,
        applyForJob,
        updateApplicationStatus,
        upsertCandidateApplicationStatus,
        withdrawApplication,
        submitApplicationFeedback,
        scheduleInterview,
        rescheduleInterview,
        cancelInterview,
        respondToInterview,
        addJobSubscription,
        updateJobSubscription,
        deleteJobSubscription,
        simulateJobMatch,
        inviteCandidateToApply,
        respondToInvitation,
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
