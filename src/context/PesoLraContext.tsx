import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  JobSeekerProfile,
  PesoReferralSlip,
  LocalRecruitmentActivity,
  LraCandidate,
  SystemAnnouncement,
} from '../types';
import { INITIAL_REFERRAL_SLIPS, INITIAL_LRA_EVENTS } from '../data/pesoLguData';
import {
  SUPABASE_TABLES,
  COLLECTIONS,
  subscribeToSupabaseTable,
} from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useToast } from './ToastContext';
import { useDirectory } from './DirectoryContext';
import { saveDocument } from './persistence';

export interface PesoLraContextType {
  referralSlips: PesoReferralSlip[];
  localRecruitmentActivities: LocalRecruitmentActivity[];
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
  resetPesoLraState: () => void;
}

export const PesoLraContext = createContext<PesoLraContextType | undefined>(undefined);

export const PesoLraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setUsers } = useAuth();
  const { addNotification } = useNotification();
  const { showToast } = useToast();
  const { employers, jobSeekers, setJobSeekers, setAnnouncements, logAudit, isSupabaseConnected } = useDirectory();

  const [referralSlips, setReferralSlips] = useState<PesoReferralSlip[]>(INITIAL_REFERRAL_SLIPS);
  const [localRecruitmentActivities, setLocalRecruitmentActivities] = useState<LocalRecruitmentActivity[]>(INITIAL_LRA_EVENTS);

  // Subscribe to PESO referral slips and LRA events once Supabase connection is established
  useEffect(() => {
    if (!isSupabaseConnected) return;

    const unsubs = [
      subscribeToSupabaseTable<PesoReferralSlip>(SUPABASE_TABLES.REFERRAL_SLIPS, (data) => {
        if (data && data.length > 0) setReferralSlips(data);
      }),
      subscribeToSupabaseTable<LocalRecruitmentActivity>(SUPABASE_TABLES.LRA_EVENTS, (data) => {
        if (data && data.length > 0) setLocalRecruitmentActivities(data);
      }),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [isSupabaseConnected]);

  // PESO-LGU Referral Slip Issuance
  const issueReferralSlip = (slipData: Omit<PesoReferralSlip, 'id' | 'createdAt' | 'referralNumber'> & { referralNumber?: string }): PesoReferralSlip => {
    const nextRefNum = slipData.referralNumber || `PESO-RXS-REF-${new Date().getFullYear()}-${String(referralSlips.length + 1).padStart(4, '0')}`;
    const newSlip: PesoReferralSlip = {
      ...slipData,
      id: `ref-${crypto.randomUUID()}`,
      referralNumber: nextRefNum,
      createdAt: new Date().toISOString()
    };

    setReferralSlips(prev => [newSlip, ...prev]);
    saveDocument(COLLECTIONS.REFERRAL_SLIPS, newSlip);

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

  const updateReferralSlipStatus = (slipId: string, status: PesoReferralSlip['status'], isHotsOrRemarks?: boolean | string) => {
    const isHots = typeof isHotsOrRemarks === 'boolean' ? isHotsOrRemarks : status === 'hired_on_the_spot';
    const slip = referralSlips.find(s => s.id === slipId);
    if (!slip) {
      logAudit('UPDATE_REFERRAL_STATUS', 'PesoReferralSlip', slipId, `Updated referral slip status to ${status}${isHots ? ' (HOTS)' : ''}.`);
      return;
    }

    const updated: PesoReferralSlip = {
      ...slip,
      status,
      remarks: typeof isHotsOrRemarks === 'string'
        ? isHotsOrRemarks
        : isHots
        ? (slip.remarks ? `${slip.remarks} [Hired On The Spot]` : 'Hired On The Spot (HOTS)')
        : slip.remarks
    };
    setReferralSlips(prev => prev.map(s => s.id === slipId ? updated : s));
    saveDocument(COLLECTIONS.REFERRAL_SLIPS, updated);

    if (status === 'hired' || status === 'hired_on_the_spot') {
      setJobSeekers(seekers => seekers.map(sk => {
        if (sk.id === slip.jobSeekerId) {
          const updatedSk: JobSeekerProfile = {
            ...sk,
            employmentStatus: status === 'hired_on_the_spot' ? 'hired_on_the_spot' : 'hired',
            currentEmployer: slip.employerName,
            hiredPosition: slip.jobTitle,
            hiredAt: new Date().toISOString()
          };
          saveDocument(COLLECTIONS.JOB_SEEKERS, updatedSk);
          return updatedSk;
        }
        return sk;
      }));
    }

    logAudit('UPDATE_REFERRAL_STATUS', 'PesoReferralSlip', slipId, `Updated referral slip status to ${status}${isHots ? ' (HOTS)' : ''}.`);
  };

  // Encode Walk-In Job Seeker (Physical Bio-Data encoding by PESO staff)
  const encodeWalkInJobSeeker = (seekerData: Partial<JobSeekerProfile> & { firstName: string; lastName: string; contactNumber: string }): JobSeekerProfile => {
    const walkInUserId = `user-walkin-${crypto.randomUUID()}`;
    const walkInSeekerId = `seeker-walkin-${crypto.randomUUID()}`;
    const fullName = `${seekerData.firstName} ${seekerData.lastName}`.trim();
    const generatedEmail = seekerData.email || `${seekerData.firstName.toLowerCase().replace(/\s+/g, '')}.${seekerData.lastName.toLowerCase().replace(/\s+/g, '')}.walkin@pesoroxas.gov.ph`;

    let completeness = 50;
    if (seekerData.educationCategory) completeness += 15;
    if (seekerData.practicalSkills && seekerData.practicalSkills.length > 0) completeness += 15;
    if (seekerData.tradeCertifications && seekerData.tradeCertifications.length > 0) completeness += 10;
    if (seekerData.geographicMobility) completeness += 10;

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
      municipality: 'Roxas',
      civilStatus: seekerData.civilStatus || 'Single',
      sex: seekerData.sex || 'Male',
      age: seekerData.age || 24,
      professionalSummary: seekerData.professionalSummary || `Walk-in job seeker registered at PESO-LGU Roxas. Registered education: ${seekerData.educationalAttainment || 'High School'}.`,
      educationalAttainment: seekerData.educationalAttainment || (seekerData.educationCategory || 'High School Graduate'),
      primaryDegree: seekerData.primaryDegree || '',
      technicalSkills: seekerData.technicalSkills || [],
      softSkills: seekerData.softSkills || ['Punctual', 'Hardworking', 'Team Player'],
      tradeSkills: seekerData.practicalSkills || [],
      education: seekerData.education || [{
        id: `edu-${crypto.randomUUID()}`,
        school: 'Roxas Local School / Institution',
        degreeCourse: seekerData.primaryDegree || seekerData.educationalAttainment || 'General Secondary Course',
        yearGraduated: 2022,
        educationalAttainment: seekerData.educationalAttainment || (seekerData.educationCategory || 'High School')
      }],
      workExperience: seekerData.workExperience || [],
      certifications: (seekerData.tradeCertifications || []).map((cert) => ({
        id: `cert-${crypto.randomUUID()}`,
        name: cert,
        issuingOrganization: 'TESDA',
        dateObtained: '2024-01-15'
      })),
      resumes: [],
      isAccountVerified: true,
      isProfileCompleted: true,
      employmentStatus: 'unemployed',
      isWalkIn: true,
      registrationType: 'walk_in',
      educationCategory: seekerData.educationCategory || 'High School Graduate',
      practicalSkills: seekerData.practicalSkills || [],
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
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setJobSeekers(prev => [newSeeker, ...prev]);

    saveDocument(COLLECTIONS.USERS, newUser);
    saveDocument(COLLECTIONS.JOB_SEEKERS, newSeeker);

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
  const createLraEvent = (eventData: Partial<LocalRecruitmentActivity> & { companyName: string }): LocalRecruitmentActivity => {
    const defaultPositions = eventData.targetPositions || eventData.vacancies || ['General Staff'];
    const defaultVenue = eventData.eventVenue || eventData.venue || 'Roxas Municipal Gymnasium, Bagumbayan, Roxas';
    const defaultDate = eventData.eventDate || eventData.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const defaultSlots = eventData.totalVacancies || eventData.totalSlotsAvailable || 50;
    const defaultApplicantTypes = eventData.targetApplicantTypes || (eventData.targetApplicantType ? eventData.targetApplicantType : ['High School Graduate', 'College Graduate']);

    const newLra: LocalRecruitmentActivity = {
      ...eventData,
      id: `lra-${crypto.randomUUID()}`,
      companyName: eventData.companyName,
      companyOrigin: eventData.companyOrigin || 'Calapan City',
      industry: eventData.industry || 'General Commerce',
      letterOfIntentStatus: eventData.letterOfIntentStatus || (eventData.hasLetterOfIntent ? 'approved' : 'received'),
      mayorsApprovalVerified: eventData.mayorsApprovalVerified ?? Boolean(eventData.hasMayorsPermit ?? true),
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
        id: `ann-${crypto.randomUUID()}`,
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

    const ev = localRecruitmentActivities.find(item => item.id === lraId);
    if (!ev) return;

    const existingCandidateIds = ev.nominatedCandidateIds || (ev.nominatedCandidates?.map(c => c.seekerId) || []);
    if (existingCandidateIds.includes(seekerId)) {
      showToast({
        title: 'Candidate Already Nominated',
        message: `${seeker.firstName} ${seeker.lastName} is already in the candidate pool for this LRA drive.`,
        type: 'alert'
      });
      return;
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
    const updated: LocalRecruitmentActivity = {
      ...ev,
      nominatedCandidateIds: updatedNominatedIds,
      nominatedCandidates: updatedNominatedCandidates,
      registeredApplicantsCount: updatedNominatedCandidates.length
    };

    setLocalRecruitmentActivities(prev => prev.map(item => item.id === lraId ? updated : item));
    saveDocument(COLLECTIONS.LRA_EVENTS, updated);

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
  };

  const removeCandidateFromLra = (lraId: string, seekerId: string) => {
    const ev = localRecruitmentActivities.find(item => item.id === lraId);
    if (!ev) return;

    const updatedCandidates = (ev.nominatedCandidates || []).filter(c => c.seekerId !== seekerId);
    const updatedIds = (ev.nominatedCandidateIds || []).filter(id => id !== seekerId);
    const updated: LocalRecruitmentActivity = {
      ...ev,
      nominatedCandidateIds: updatedIds,
      nominatedCandidates: updatedCandidates,
      registeredApplicantsCount: updatedCandidates.length
    };

    setLocalRecruitmentActivities(prev => prev.map(item => item.id === lraId ? updated : item));
    saveDocument(COLLECTIONS.LRA_EVENTS, updated);
    logAudit('REMOVE_LRA_CANDIDATE', 'LocalRecruitmentActivity', lraId, `Removed candidate ${seekerId} from LRA pool.`);
    showToast({
      title: 'Candidate Removed',
      message: 'Candidate was removed from the LRA pool.',
      type: 'status'
    });
  };

  const updateLraCandidateStatus = (lraId: string, seekerId: string, status: LraCandidate['status'], notes?: string) => {
    const ev = localRecruitmentActivities.find(item => item.id === lraId);
    if (!ev) return;

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

    setLocalRecruitmentActivities(prev => prev.map(item => item.id === lraId ? updated : item));
    saveDocument(COLLECTIONS.LRA_EVENTS, updated);

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
  };

  const logHotsApplicant = (lraId: string, applicantName: string, position: string, employerId?: string, notes?: string) => {
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

  const resetPesoLraState = () => {
    setReferralSlips(INITIAL_REFERRAL_SLIPS);
    setLocalRecruitmentActivities(INITIAL_LRA_EVENTS);
  };

  return (
    <PesoLraContext.Provider
      value={{
        referralSlips,
        localRecruitmentActivities,
        issueReferralSlip,
        updateReferralSlipStatus,
        encodeWalkInJobSeeker,
        assessJobSeekerWalkIn,
        createLraEvent,
        updateLraEvent,
        logHotsApplicant,
        nominateCandidateToLra,
        removeCandidateFromLra,
        updateLraCandidateStatus,
        resetPesoLraState,
      }}
    >
      {children}
    </PesoLraContext.Provider>
  );
};

export const usePesoLra = (): PesoLraContextType => {
  const context = useContext(PesoLraContext);
  if (!context) {
    throw new Error('usePesoLra must be used within a PesoLraProvider');
  }
  return context;
};
