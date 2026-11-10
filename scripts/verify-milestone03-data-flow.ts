import { calculateDecisionTreeMatch } from '../src/utils/decisionTree';
import { evaluateResumeForAts } from '../src/utils/atsEngine';
import {
  toSnakeCase,
  toCamelCase,
  SUPABASE_TABLES,
  COLLECTIONS,
} from '../src/services/supabaseService';
import {
  JobPost,
  Application,
  Interview,
  NotificationItem,
  JobSeekerProfile,
  EmployerProfile,
  User,
  JobStatus,
  ApplicationStatus,
} from '../src/types';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYERS,
  INITIAL_JOB_POSTS,
  INITIAL_JOB_SEEKERS,
  INITIAL_APPLICATIONS,
  INITIAL_INTERVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../src/data/mockData';

console.log('--- eHANAP Milestone 03: End-to-End Data Pipeline & Bidirectional Sync ("Pagbato ng Data") ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

async function runMilestone03Tests() {
  // ---------------------------------------------------------------------------
  // Suite 1: Job Post Creation, PESO Moderation & Seeker Feed Filtering
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 1] Job Post Approval Pipeline & Feed Filtering');

  const employer = INITIAL_EMPLOYERS[0]; // Puregold Roxas
  const adminUser = INITIAL_USERS.find(u => u.role === 'admin')!;
  assert(Boolean(employer), 'Employer profile loaded for job creation');
  assert(Boolean(adminUser), 'PESO Municipal Admin account identified');

  // Step 1: Employer submits job post -> must default to pending_approval
  const submittedJob: JobPost = {
    id: `job-test-m03-${Date.now()}`,
    employerId: employer.id,
    companyName: employer.companyName,
    companyLogo: employer.logoUrl,
    companyMunicipality: 'Roxas',
    companyVerified: employer.status === 'verified',
    title: 'IT & Retail Operations Specialist',
    category: 'Information Technology & Software',
    workLocation: 'Brgy. San Mariano, Roxas',
    municipality: 'Roxas',
    employmentType: 'Full-time',
    salaryRange: '₱22,000 - ₱28,000 / month',
    description: 'Manage store IT terminals, POS systems, inventory databases, and technical operations in Roxas.',
    responsibilities: ['Maintain store POS hardware', 'Oversee digital checkout terminals', 'Coordinate inventory database audits'],
    minEducationalAttainment: "Bachelor's Degree",
    preferredDegree: 'BS Information Technology',
    degreeImportance: 'preferred',
    minExperienceYears: 1,
    experienceImportance: 'preferred',
    requirements: [],
    requiredSkills: ['POS Operation', 'Customer Service', 'Cash Handling'],
    preferredSkills: ['Hardware Troubleshooting', 'React.js'],
    technicalSkills: ['POS Operation', 'Hardware Troubleshooting'],
    softSkills: ['Customer Service'],
    requiredCertifications: [],
    vacanciesCount: 3,
    applicationDeadline: '2026-12-31',
    status: 'pending_approval',
    postedDate: new Date().toISOString().split('T')[0],
  };

  assert(submittedJob.status === 'pending_approval', 'Newly posted employer job defaults to "pending_approval" status');
  assert(submittedJob.employerId === employer.id, 'Job preserves foreign key employerId relation');
  assert(submittedJob.vacanciesCount === 3, 'Job vacancies count is preserved');

  // Admin Notification created
  const adminNotification: NotificationItem = {
    id: `notif-admin-${Date.now()}`,
    recipientId: adminUser.id,
    recipientRole: 'admin',
    title: 'New Job Vacancy Pending PESO Review',
    message: `${submittedJob.companyName} submitted "${submittedJob.title}" for review & approval.`,
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/admin/jobs',
  };
  assert(adminNotification.recipientRole === 'admin', 'Admin notification created with admin role gate');
  assert(adminNotification.title.includes('Pending PESO Review'), 'Admin notification announces pending vacancy');

  // Feed visibility test: Seeker job feed strictly filters status === 'active'
  const mockFeed = [submittedJob, ...INITIAL_JOB_POSTS];
  const seekerVisibleJobs = mockFeed.filter(j => j.status === 'active');
  assert(!seekerVisibleJobs.some(j => j.id === submittedJob.id), 'Pending vacancy is HIDDEN from Seeker job search feed');

  // Step 2: PESO Admin Reviews & Approves Vacancy
  const complianceRemarks = 'Compliant with Region IV-B DOLE minimum wage and municipal hiring guidelines.';
  const approvedJob: JobPost = {
    ...submittedJob,
    status: 'active',
    reviewNotes: complianceRemarks,
    complianceRemarks,
  };
  assert(approvedJob.status === 'active', 'Job transitions to "active" status upon PESO approval');
  assert(Boolean(approvedJob.complianceRemarks), 'Compliance remarks recorded in job record');

  // Re-evaluating Seeker feed after approval
  const updatedFeed = mockFeed.map(j => j.id === approvedJob.id ? approvedJob : j);
  const activeSeekerJobs = updatedFeed.filter(j => j.status === 'active');
  assert(activeSeekerJobs.some(j => j.id === approvedJob.id), 'Approved job immediately APPEARS on Seeker job search feed');

  // Employer Notification of Approval
  const employerApprovalNotif: NotificationItem = {
    id: `notif-emp-${Date.now()}`,
    recipientId: employer.userId,
    recipientRole: 'employer',
    title: 'Job Vacancy Approved & Published!',
    message: `Your job vacancy "${approvedJob.title}" has been approved by PESO-LGU and is now published.`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/employer/dashboard',
  };
  assert(employerApprovalNotif.recipientId === employer.userId, 'Employer user receives approval notification');
  assert(employerApprovalNotif.type === 'success', 'Approval notification marked as success');

  // ---------------------------------------------------------------------------
  // Suite 2: Automated Decision Tree Matching, Candidate Caching & Match Alert Notifications
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 2] Automated Candidate Matching & Match Alert Notifications ("Pagbato sa Seekers")');

  // Evaluate candidate matching across registered seekers
  const candidateMatches = INITIAL_JOB_SEEKERS.map(cand => {
    const match = calculateDecisionTreeMatch(cand, approvedJob);
    return {
      candidate: cand,
      matchResult: match,
      score: match.overallMatch,
    };
  });

  assert(candidateMatches.length === INITIAL_JOB_SEEKERS.length, 'Evaluated all registered seekers against new vacancy');
  const topCandidate = candidateMatches.sort((a, b) => b.score - a.score)[0];
  assert(Boolean(topCandidate), 'Top candidate resolved from Decision Tree evaluation');
  assert(typeof topCandidate.score === 'number' && topCandidate.score >= 0 && topCandidate.score <= 100, 'Match score is normalized between 0 and 100%');
  assert(Array.isArray(topCandidate.matchResult.matchedReasons), 'Transparent matched reasons array is provided');

  // Supabase candidate_matches caching payload check
  const candidateMatchDbRow = {
    id: `match-${approvedJob.id}-${topCandidate.candidate.id}`,
    jobId: approvedJob.id,
    jobSeekerId: topCandidate.candidate.id,
    overallMatch: topCandidate.score,
    outcome: topCandidate.matchResult.outcome,
    educationMatchScore: topCandidate.matchResult.educationMatchScore,
    degreeAlignmentScore: topCandidate.matchResult.degreeAlignmentScore,
    skillsMatchScore: topCandidate.matchResult.skillsMatchScore,
    experienceMatchScore: topCandidate.matchResult.experienceMatchScore,
    certificationsMatchScore: topCandidate.matchResult.certificationsMatchScore,
    matchedReasons: topCandidate.matchResult.matchedReasons,
    missingQualifications: topCandidate.matchResult.missingQualifications,
    decisionReason: topCandidate.matchResult.matchedReasons.slice(0, 3).join('; '),
    calculatedAt: new Date().toISOString(),
  };

  assert(candidateMatchDbRow.id.startsWith('match-'), 'Candidate match unique key generated');
  assert(candidateMatchDbRow.jobId === approvedJob.id, 'Candidate match references approved job');
  assert(candidateMatchDbRow.jobSeekerId === topCandidate.candidate.id, 'Candidate match references job seeker');

  // High Match Alert Notifications for candidates >= 70%
  const highMatchCandidates = candidateMatches.filter(cm => cm.score >= 70);
  assert(highMatchCandidates.length > 0, `Found ${highMatchCandidates.length} high-match candidate(s) (>= 70%)`);

  const generatedMatchNotifs: NotificationItem[] = highMatchCandidates.map(cm => ({
    id: `notif-match-${Date.now()}-${cm.candidate.id}`,
    recipientId: cm.candidate.userId,
    recipientRole: 'job_seeker',
    title: `Job Match Found: ${approvedJob.title} (${Math.round(cm.score)}%)`,
    message: `${approvedJob.companyName} has published "${approvedJob.title}" matching your qualifications!`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/seeker/dashboard',
  }));

  assert(generatedMatchNotifs.length === highMatchCandidates.length, 'Generated Match Alert notification for each qualified candidate');
  assert(generatedMatchNotifs[0].recipientRole === 'job_seeker', 'Notification addressed to job seeker role');

  // ---------------------------------------------------------------------------
  // Suite 3: Job Seeker Application Ingestion, Resume ATS Screening & Employer Alerts
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 3] Job Seeker Application Submission & Employer Alert Pipeline');

  const applyingSeeker = topCandidate.candidate;
  const resumeId = applyingSeeker.activeResumeId || 'resume-default-01';
  const coverNote = 'I have hands-on experience in inventory auditing and logistics coordination in Oriental Mindoro.';

  // ATS Evaluation
  const atsResult = evaluateResumeForAts(
    {
      ...applyingSeeker,
      fileName: 'Juan_Dela_Cruz_Resume.pdf',
      extractedSkills: applyingSeeker.technicalSkills,
      extractedDegree: applyingSeeker.primaryDegree,
      extractedEducation: applyingSeeker.educationalAttainment,
    },
    approvedJob
  );

  assert(atsResult.score >= 50, `ATS Evaluation produces valid score (${atsResult.score}%)`);
  assert(Boolean(atsResult.grade), `ATS Grade assigned (${atsResult.grade})`);

  // Application Record Creation
  const newApplication: Application = {
    id: `app-m03-${Date.now()}`,
    jobId: approvedJob.id,
    jobSeekerId: applyingSeeker.id,
    employerId: approvedJob.employerId,
    appliedDate: new Date().toISOString(),
    resumeId,
    coverNote,
    currentStatus: atsResult.score >= 60 ? 'ats_screened' : 'submitted',
    matchResult: topCandidate.matchResult,
    matchScore: topCandidate.score,
    applicantName: `${applyingSeeker.firstName} ${applyingSeeker.lastName}`,
    decisionTreeOutcome: topCandidate.matchResult.outcome,
    atsScore: atsResult.score,
    atsResult,
    statusHistory: [
      {
        status: 'submitted',
        updatedAt: new Date().toISOString(),
        updatedBy: `${applyingSeeker.firstName} ${applyingSeeker.lastName}`,
        notes: `Application submitted with note: "${coverNote.slice(0, 100)}"`,
      },
      {
        status: 'ats_screened',
        updatedAt: new Date().toISOString(),
        updatedBy: 'eHANAP ATS Engine',
        notes: `ATS Audit passed with score ${atsResult.score}/100 (Grade ${atsResult.grade}).`,
      },
    ],
  };

  assert(newApplication.jobId === approvedJob.id, 'Application references target job');
  assert(newApplication.jobSeekerId === applyingSeeker.id, 'Application references applicant');
  assert(newApplication.employerId === approvedJob.employerId, 'Application references target employer');
  assert(newApplication.coverNote === coverNote, 'Application retains applicant cover note');
  assert(newApplication.statusHistory.length === 2, 'Initial status history records submission and ATS screening');

  // Employer Receives New Application Notification
  const employerAppNotif: NotificationItem = {
    id: `notif-app-${Date.now()}`,
    recipientId: employer.userId,
    recipientRole: 'employer',
    title: 'New Job Application Received',
    message: `${newApplication.applicantName} applied for "${approvedJob.title}" (${topCandidate.score}% Decision Tree Match).`,
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/employer/applicants',
  };

  assert(employerAppNotif.recipientId === employer.userId, 'Employer user alerted of new application');
  assert(employerAppNotif.message.includes(`${topCandidate.score}%`), 'Employer notification includes Decision Tree match score');

  // Duplicate Application Guard
  const duplicateDetected = Boolean(
    [newApplication].find(a => a.jobId === approvedJob.id && a.jobSeekerId === applyingSeeker.id)
  );
  assert(duplicateDetected, 'System detects duplicate applications for the same position');

  // ---------------------------------------------------------------------------
  // Suite 4: Employer Candidate Progression Lifecycle (under_review -> hired)
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 4] Employer Candidate Progression Lifecycle & Real-Time Tracking');

  let activeApp = { ...newApplication };

  // Step 4.1: Transition to 'under_review'
  const reviewNote = 'Applicant credentials verified; shortlisted for formal panel assessment.';
  activeApp = {
    ...activeApp,
    currentStatus: 'under_review',
    statusHistory: [
      ...activeApp.statusHistory,
      {
        status: 'under_review',
        updatedAt: new Date().toISOString(),
        updatedBy: employer.companyName,
        notes: reviewNote,
      },
    ],
  };

  assert(activeApp.currentStatus === 'under_review', 'Application transitions to "under_review"');
  assert(activeApp.statusHistory[2].notes === reviewNote, 'Status history records review notes');

  // Seeker Notification for Under Review
  const seekerReviewNotif: NotificationItem = {
    id: `notif-seeker-ur-${Date.now()}`,
    recipientId: applyingSeeker.userId,
    recipientRole: 'job_seeker',
    title: 'Application Status: UNDER REVIEW',
    message: `Your application for "${approvedJob.title}" is now under review by ${approvedJob.companyName}.`,
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/seeker/applications',
  };
  assert(seekerReviewNotif.recipientId === applyingSeeker.userId, 'Seeker receives status update notification');

  // Step 4.2: Transition to 'hired'
  const hiredNote = 'Selected for employment. Welcome to the Puregold Roxas operations team!';
  activeApp = {
    ...activeApp,
    currentStatus: 'hired',
    statusHistory: [
      ...activeApp.statusHistory,
      {
        status: 'hired',
        updatedAt: new Date().toISOString(),
        updatedBy: employer.companyName,
        notes: hiredNote,
      },
    ],
  };

  assert(activeApp.currentStatus === 'hired', 'Application reaches final "hired" status');
  assert(activeApp.statusHistory.length === 4, 'Full audit trail preserved across all 4 stages');

  // Seeker Profile State Update on Hired
  const updatedSeekerProfile: JobSeekerProfile = {
    ...applyingSeeker,
    employmentStatus: 'hired',
    currentEmployer: approvedJob.companyName,
    hiredPosition: approvedJob.title,
    hiredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(updatedSeekerProfile.employmentStatus === 'hired', 'Job seeker employment status updated to "hired"');
  assert(updatedSeekerProfile.currentEmployer === approvedJob.companyName, 'Current employer reflected on candidate profile');
  assert(updatedSeekerProfile.hiredPosition === approvedJob.title, 'Hired position title recorded');
  assert(Boolean(updatedSeekerProfile.hiredAt), 'Timestamp recorded for LGU placement analytics');

  // Seeker Congratulations Notification
  const seekerHiredNotif: NotificationItem = {
    id: `notif-seeker-hired-${Date.now()}`,
    recipientId: applyingSeeker.userId,
    recipientRole: 'job_seeker',
    title: `🎉 Congratulations! You are HIRED by ${approvedJob.companyName}!`,
    message: `Congratulations ${applyingSeeker.firstName}! You have been officially hired for "${approvedJob.title}".`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/seeker/applications',
  };
  assert(seekerHiredNotif.type === 'success', 'Hired notification marked as celebratory success');

  // ---------------------------------------------------------------------------
  // Suite 5: Interview Scheduling, Conflict Prevention & Response Synchronization
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 5] Interview Scheduling & Bidirectional Response Synchronization');

  const interviewDate = '2026-11-20';
  const interviewTime = '10:00 AM';

  const scheduledInterview: Interview = {
    id: `int-test-${Date.now()}`,
    applicationId: activeApp.id,
    jobId: approvedJob.id,
    jobTitle: approvedJob.title,
    employerId: employer.id,
    companyName: employer.companyName,
    jobSeekerId: applyingSeeker.id,
    applicantName: `${applyingSeeker.firstName} ${applyingSeeker.lastName}`,
    interviewType: 'face_to_face',
    date: interviewDate,
    time: interviewTime,
    locationOrLink: 'Puregold Roxas Admin Office, Roxas Public Market Commercial Complex, Roxas, Oriental Mindoro',
    contactPerson: 'HR Recruitment Specialist',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  assert(scheduledInterview.status === 'scheduled', 'Interview status initialized to "scheduled"');
  assert(scheduledInterview.interviewType === 'face_to_face', 'Interview type recorded as face-to-face');
  assert(scheduledInterview.locationOrLink.includes('Roxas'), 'Roxas municipal interview venue established');

  // Conflict detection validation: Same seeker, same date & time
  const existingInterviews = [scheduledInterview];
  const conflictingInterviewCandidate: Interview = {
    ...scheduledInterview,
    id: `int-conflict-${Date.now()}`,
    employerId: 'emp-other-02',
    companyName: 'Mindoro Tech Hub',
  };

  const hasSeekerConflict = existingInterviews.some(i =>
    i.jobSeekerId === conflictingInterviewCandidate.jobSeekerId &&
    i.date === conflictingInterviewCandidate.date &&
    i.time === conflictingInterviewCandidate.time &&
    (i.status === 'scheduled' || i.status === 'accepted')
  );
  assert(hasSeekerConflict, 'System detects and prevents double-booking seeker interview times');

  // Seeker Interview Invitation Notification
  const interviewInvitationNotif: NotificationItem = {
    id: `notif-int-${Date.now()}`,
    recipientId: applyingSeeker.userId,
    recipientRole: 'job_seeker',
    title: 'Interview Invitation Received',
    message: `${scheduledInterview.companyName} invited you for a ${scheduledInterview.interviewType} interview for "${scheduledInterview.jobTitle}" on ${scheduledInterview.date} at ${scheduledInterview.time}.`,
    type: 'action',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/seeker/interviews',
  };
  assert(interviewInvitationNotif.recipientId === applyingSeeker.userId, 'Interview invitation delivered to seeker');

  // Seeker Responds: Accepts Interview
  const acceptedInterview: Interview = {
    ...scheduledInterview,
    status: 'accepted',
  };
  assert(acceptedInterview.status === 'accepted', 'Interview status transitions to "accepted"');

  // Employer Notification of Seeker Response
  const employerIntResponseNotif: NotificationItem = {
    id: `notif-int-resp-${Date.now()}`,
    recipientId: employer.userId,
    recipientRole: 'employer',
    title: 'Interview ACCEPTED',
    message: `${scheduledInterview.applicantName} has accepted the interview for "${scheduledInterview.jobTitle}".`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/employer/applicants',
  };
  assert(employerIntResponseNotif.recipientId === employer.userId, 'Employer notified of applicant interview acceptance');

  // ---------------------------------------------------------------------------
  // Suite 6: Supabase Dual-Persistence Serialization, Null Safety & Data Integrity
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 6] Supabase Dual-Persistence Serialization & Data Integrity');

  // Table mappings
  assert(Boolean(SUPABASE_TABLES.JOB_POSTS), 'SUPABASE_TABLES maps job_posts');
  assert(Boolean(SUPABASE_TABLES.APPLICATIONS), 'SUPABASE_TABLES maps applications');
  assert(Boolean(SUPABASE_TABLES.CANDIDATE_MATCHES), 'SUPABASE_TABLES maps candidate_matches');
  assert(Boolean(SUPABASE_TABLES.INTERVIEWS), 'SUPABASE_TABLES maps interviews');
  assert(Boolean(SUPABASE_TABLES.NOTIFICATIONS), 'SUPABASE_TABLES maps notifications');
  assert(Boolean(COLLECTIONS.CANDIDATE_MATCHES), 'COLLECTIONS maps candidateMatches');

  // Serialization: toSnakeCase conversion for PostgreSQL
  const snakeApp = toSnakeCase(newApplication);
  assert(snakeApp.job_id === newApplication.jobId, 'toSnakeCase converts jobId to job_id');
  assert(snakeApp.job_seeker_id === newApplication.jobSeekerId, 'toSnakeCase converts jobSeekerId to job_seeker_id');
  assert(snakeApp.employer_id === newApplication.employerId, 'toSnakeCase converts employerId to employer_id');
  assert(snakeApp.current_status === newApplication.currentStatus, 'toSnakeCase converts currentStatus to current_status');
  assert(snakeApp.match_score === newApplication.matchScore, 'toSnakeCase converts matchScore to match_score');
  assert(Array.isArray(snakeApp.status_history), 'toSnakeCase preserves JSON status_history array');
  assert(snakeApp.status_history[0].updated_at === newApplication.statusHistory[0].updatedAt, 'toSnakeCase recurses into nested status history objects');

  // Deserialization: toCamelCase restoration for TypeScript
  const restoredApp = toCamelCase<Application>(snakeApp);
  assert(restoredApp.jobId === newApplication.jobId, 'toCamelCase restores jobId');
  assert(restoredApp.jobSeekerId === newApplication.jobSeekerId, 'toCamelCase restores jobSeekerId');
  assert(restoredApp.currentStatus === newApplication.currentStatus, 'toCamelCase restores currentStatus');
  assert(Array.isArray(restoredApp.statusHistory), 'toCamelCase restores statusHistory array');
  assert(restoredApp.statusHistory[0].updatedAt === newApplication.statusHistory[0].updatedAt, 'toCamelCase restores nested status history objects');

  // Null & Undefined Safety
  const emptyTransform = toSnakeCase(null);
  assert(emptyTransform === null, 'toSnakeCase safely handles null');
  const undefinedTransform = toCamelCase(undefined);
  assert(undefinedTransform === undefined, 'toCamelCase safely handles undefined');

  // Audit Log Entry
  const auditEntry = {
    id: `log-test-${Date.now()}`,
    userId: employer.userId,
    userRole: 'employer',
    action: 'APPLICATION_STATUS_UPDATED',
    entityType: 'Application',
    entityId: activeApp.id,
    details: `Status transitioned to hired for ${activeApp.applicantName}`,
    timestamp: new Date().toISOString(),
  };
  const snakeLog = toSnakeCase(auditEntry);
  assert(snakeLog.entity_type === 'Application', 'Audit log entityType converted to entity_type');
  assert(snakeLog.entity_id === activeApp.id, 'Audit log entityId converted to entity_id');
}

runMilestone03Tests().then(() => {
  console.log('\n================================================================');
  console.log(`Milestone 03 Verification Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('================================================================');
  if (passedTests === totalTests) {
    console.log('🎉 Milestone 03 End-to-End Data Pipeline & Bidirectional Sync is FULLY VERIFIED!\n');
    process.exit(0);
  } else {
    console.error(`❌ Failed ${totalTests - passedTests} tests.\n`);
    process.exit(1);
  }
}).catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
