export type UserRole = 'admin' | 'employer' | 'job_seeker';

export type EmployerStatus = 'incomplete' | 'pending_verification' | 'pending' | 'verified' | 'for_compliance' | 'rejected' | 'suspended';

export interface EmployerVerificationDocument {
  id: string;
  requirementId?: string;
  requirementTitle?: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  fileUrl: string; // data URL or object URL for in-app preview & download
  uploadedAt: string;
}

export type JobStatus = 'active' | 'closed' | 'paused' | 'pending_approval' | 'for_compliance' | 'rejected' | 'archived';

export type ApplicationStatus = 
  | 'applied'
  | 'submitted'
  | 'ats_screened'
  | 'under_review'
  | 'reviewed'
  | 'qualified'
  | 'shortlisted'
  | 'for_interview'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'for_final_review'
  | 'hired'
  | 'rejected'
  | 'not_selected'
  | 'withdrawn';

export type DecisionTreeOutcome = 
  | 'HIGHLY QUALIFIED'
  | 'HIGHLY_QUALIFIED'
  | 'QUALIFIED'
  | 'MODERATELY QUALIFIED'
  | 'MODERATELY_QUALIFIED'
  | 'LOW MATCH'
  | 'LOW_MATCH'
  | 'NOT QUALIFIED'
  | 'NOT_QUALIFIED';

export type RequirementImportance = 'required' | 'preferred' | 'optional';

export type DegreeAlignmentType = 'exact' | 'related' | 'unrelated';

export type InterviewType = 'face_to_face' | 'in_person' | 'phone' | 'video';

export type InterviewStatus = 'scheduled' | 'rescheduled' | 'accepted' | 'reschedule_requested' | 'declined' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  phone?: string;
  isAccountVerified?: boolean;
  isProfileCompleted?: boolean;
  createdAt: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  representativeName: string;
  contactNumber: string;
  email: string;
  address: string;
  municipality: string;
  barangay?: string;
  industry: string;
  companyDescription: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  status: EmployerStatus;
  isProfileCompleted?: boolean;
  profileSetupCompletedAt?: string;

  // Establishment Classification (PESO-LGU)
  establishmentType?: 'local_established' | 'new_external'; // Established Local (Puregold, Jollibee, ORMECO, Ricemill) vs External/New
  authorizedBranchManager?: string;
  hrContactPerson?: string;
  hrContactNumber?: string;
  branchLocation?: string;

  // PESO Oriental Mindoro Regulatory Requirements (Mandatory Gatekeeping)
  mayorsPermitFile?: string; // Mayor's Business Permit (BPLO Roxas)
  dtiSecFile?: string; // DTI Certificate / SEC / CDA Registration
  dtiSecRegistration?: string;
  sanitaryPermitFile?: string; // Sanitary Permit / Health Clearance (RHU / MHO)
  letterOfIntentFile?: string; // Letter of Intent for Local Recruitment Activity / Placement (PESO)
  aitrFile?: string; // Annual Income Tax Return (BIR)
  sedulaFile?: string; // Community Tax Certificate (Sedula)
  barangayClearanceFile?: string; // Barangay Business Clearance
  environmentCertFile?: string; // Environment and Sanitation Certification (ESO)
  zoningClearanceFile?: string; // Zoning Compliance Certificate / Locational Clearance (MPDO)
  buildingPermitFile?: string; // Building Permit / Occupational Permit (MEO)
  tourismClearanceFile?: string; // Tourism Clearance (Municipal Tourism Office - resorts/hotels/restaurants)
  paymentReceiptFile?: string; // Payment Receipt (MTO)
  fireSafetyFile?: string; // Fire Safety Inspection Clearance (BFP)
  
  businessPermitNo?: string;
  businessPermitFile?: string;
  bir2303No?: string;
  bir2303File?: string;
  documentUrl?: string;
  documents?: EmployerVerificationDocument[];
  submittedRequirements?: string[];
  requirementsSubmitted?: boolean;
  complianceRemarks?: string;
  verificationNotes?: string;
  accreditationSubmittedAt?: string;
  dataPrivacyConsent?: {
    agreed: boolean;
    timestamp: string;
  };
  createdAt: string;
}

export interface EducationRecord {
  id: string;
  degreeCourse: string;
  school: string;
  yearGraduated: number;
  educationalAttainment: string; // e.g., "Bachelor's Degree", "Master's Degree", "Doctorate", "TVET / Vocational", "High School"
  honors?: string;
}

export interface WorkExperienceRecord {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
  yearsOfExperience: number;
}

export interface CertificationRecord {
  id: string;
  name: string;
  issuingOrganization: string;
  dateObtained: string;
  documentUrl?: string;
  imageUrl?: string;
}

export interface AtsSectionScore {
  name: string;
  status: 'pass' | 'warning' | 'missing';
  score: number; // 0 to 100
  details: string;
}

export interface AtsScanResult {
  score: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  formatStatus: 'ats_optimized' | 'needs_improvement' | 'warning';
  sectionsDetected: string[];
  missingSections: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordDensityPercent: number;
  sectionScores: AtsSectionScore[];
  recommendations: string[];
  readabilityScore: number;
  contactCompleteness: number;
  skillsCount: number;
  experienceContinuity: boolean;
  rawTextPreview?: string;
  scannedAt: string;
}

export interface ResumeFile {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'png' | 'jpg' | 'jpeg' | 'image' | string;
  uploadedAt: string;
  validationStatus: 'validated' | 'pending' | 'failed';
  extractedSkills: string[];
  extractedEducation: string;
  extractedDegree: string;
  extractedExperienceYears: number;
  atsScore?: number;
  atsResult?: AtsScanResult;
  fileUrl?: string;
  candidateName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  parsedDegree?: string;
  parsedSkills?: string[];
  parsedAttainment?: string;
  isPrimary?: boolean;
  isDefault?: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skillTag: string;
}

export interface SkillAssessment {
  id: string;
  title: string;
  category: string;
  industry?: string;
  description: string;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  questions: AssessmentQuestion[];
  skillsCovered: string[];
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  category: string;
  score: number; // 0-100
  passed: boolean;
  badge: string;
  completedAt: string;
  verifiedSkills: string[];
  correctCount: number;
  totalCount: number;
}

export interface JobSeekerProfile {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  contactNumber: string;
  address: string;
  barangay?: string;
  municipality: string;
  civilStatus?: string;
  sex?: string;
  age?: number;
  profilePicture?: string;
  avatarUrl?: string;
  jobTitle?: string;
  preferredJobTitle?: string;
  phone?: string;
  cityMunicipality?: string;
  province?: string;
  bio?: string;
  yearsOfExperience?: number;
  professionalSummary: string;
  summary?: string;
  educationalAttainment: string;
  primaryDegree: string;
  technicalSkills: string[];
  softSkills: string[];
  tradeSkills?: string[];
  administrativeSkills?: string[];
  serviceHospitalitySkills?: string[];
  salesCustomerSkills?: string[];
  itCreativeSkills?: string[];
  education: EducationRecord[];
  workExperience: WorkExperienceRecord[];
  certifications: CertificationRecord[];
  resumes: ResumeFile[];
  activeResumeId?: string;
  isAccountVerified?: boolean;
  isProfileCompleted?: boolean;
  profileSetupCompletedAt?: string;
  jobPreferences?: {
    categories: string[];
    municipalities: string[];
    locations?: string[];
    employmentTypes: string[];
    minSalary?: string;
  };
  dataPrivacyConsent?: {
    agreed: boolean;
    timestamp: string;
  };
  skillProficiencies?: { skill: string; level: number; category: 'technical' | 'soft' | 'domain' }[];
  assessments?: AssessmentResult[];
  employmentStatus?: 'unemployed' | 'employed' | 'hired' | 'underemployed' | 'hired_on_the_spot';
  currentEmployer?: string;
  hiredPosition?: string;
  hiredAt?: string;

  // PESO-LGU Walk-in & Relocation Assessment
  isWalkIn?: boolean;
  registrationType?: 'online' | 'walk_in';
  educationCategory?: 'College Graduate' | 'High School Graduate' | 'Out-of-School Youth';
  practicalSkills?: string[]; // Practical skills and physical capabilities
  tradeCertifications?: string[]; // TESDA certifications (e.g. SMAW NC II, Driving NC II)
  geographicMobility?: 'local_only' | 'provincial' | 'willing_to_relocate';
  willingToRelocateForVisitingCompanies?: boolean;
  bioDataDetails?: string;
  walkInAssessmentNotes?: string;
  assessedByOfficer?: string;
  assessedAt?: string;
  profileCompleteness?: number;

  // Color UI Design Modular Additions
  website?: string;
  projects?: ProjectRecord[];
  volunteerExperience?: VolunteerExperienceRecord[];
  awards?: AwardRecord[];
  jobSeekingStatus?: 'actively_looking' | 'passively_looking' | 'not_looking';
  bookmarkedJobIds?: string[];
  notificationPreferences?: {
    generalNotification: boolean;
    notifyWhenJobAvailable: boolean;
    notifyWhenJobIsApplication: boolean;
    appUpdates: boolean;
    jobStatusUpdate: boolean;
  };
  languagePreference?: string;

  updatedAt: string;
}

export interface JobPostRequirement {
  id: string;
  category: 'education' | 'degree' | 'skill' | 'experience' | 'certification';
  title: string;
  importance: RequirementImportance;
  value: string; // e.g. "Bachelor's Degree", "BS Computer Science", "React.js", "2 years"
}

export interface EvaluatedSkillItem {
  name: string;
  required: boolean;
}

export interface JobSkillItem {
  name: string;
  priority: 'required' | 'preferred';
}

export interface JobMatchWeights {
  education: number;
  skills: number;
  experience: number;
  eligibility: number;
}

export interface JobPost {
  id: string;
  employerId: string;
  companyName: string;
  companyLogo?: string;
  companyMunicipality: string;
  companyVerified: boolean;
  title: string;
  category: string;
  subCategory?: string;
  department?: string;
  industry?: string;
  description: string;
  responsibilities: string[];
  employmentType:
    | 'Full-time'
    | 'Part-time'
    | 'Contract'
    | 'Contractual / Project-Based'
    | 'Probationary'
    | 'Seasonal'
    | 'Seasonal / Temporary'
    | 'Temporary'
    | 'Internship'
    | 'Internship / OJT'
    | 'Freelance'
    | string;
  workSetup?: 'On-site' | 'Hybrid' | 'Remote' | 'Fieldwork';
  workSchedule?: 'Day Shift' | 'Mid Shift' | 'Night Shift' | 'Shifting / Rotating' | 'Flexible' | 'Weekends Included' | string;
  workLocation?: string;
  municipality: string;
  barangay?: string;
  vacanciesCount: number;
  vacancies?: number;
  positionsAvailable?: number;
  salaryRange?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  payFrequency?: string;
  paySchedule?: string;
  isSalaryNegotiable?: boolean;
  salaryNegotiable?: boolean;
  isUrgent?: boolean;
  applicationDeadline: string;
  deadline?: string;
  postedDate: string;
  updatedAt?: string;
  status: JobStatus;
  reviewNotes?: string;
  complianceRemarks?: string;

  // PESO-LGU Targeting & Deployment
  targetApplicantType?: 'College Graduate' | 'High School Graduate' | 'Out-of-School Youth' | 'Any';
  deploymentLocationType?: 'local' | 'out_of_town'; // Local in Roxas/Oriental Mindoro or Out-of-town deployment
  lraEventId?: string; // Linked Local Recruitment Activity (if external visiting company)
  
  // Structured Requirements & Conditional Decision Tree Parameters
  minEducationalAttainment: string;
  requiredEducationLevel?: string;
  acceptedEducationLevels?: string[];
  preferredDegree: string;
  preferredCourses?: string[];
  preferredTesdaQualifications?: string[];
  anyCourseAllowed?: boolean;
  degreeImportance?: RequirementImportance | number;
  degreeWeight?: number;
  careerLevel?: 'Entry-Level' | 'Junior' | 'Mid-Level' | 'Senior' | 'Supervisory' | string;
  experienceLevel?: string;
  minExperienceYears: number;
  openToFreshGraduates?: boolean;
  experienceImportance?: RequirementImportance;
  requiredLicenses?: string[];
  requiredCertifications?: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  skills?: JobSkillItem[];
  evaluatedSkills?: EvaluatedSkillItem[];
  skillsRequired?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  matchWeights?: JobMatchWeights;
  benefits?: string[];
  otherQualifications?: string;
  
  requirements?: JobPostRequirement[];
}

export interface PesoReferralSlip {
  id: string; // Unique ID
  referralNumber: string; // e.g. PESO-RXS-REF-2026-0042
  slipNumber?: string; // Compatibility alias for referralNumber
  dateIssued: string;
  validUntil: string;
  
  // Seeker Info
  jobSeekerId: string;
  jobSeekerName: string;
  jobSeekerContact: string;
  jobSeekerAddress: string;
  educationalAttainment: string;
  educationCategory?: 'College Graduate' | 'High School Graduate' | 'Out-of-School Youth';
  tradeCertifications?: string[];
  geographicMobility?: string;
  
  // Employer & Vacancy
  jobPostId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  employerAddress: string;
  authorizedContactPerson: string;
  authorizedContactNumber?: string;
  
  // Matching & Decision Tree Qualification
  matchingScore: number;
  matchingTier: 'Highly Qualified' | 'Qualified' | 'Moderately Qualified' | 'Low Match';
  decisionTreeRationale?: string;
  interviewDate?: string;
  interviewVenue?: string;
  
  // PESO Officer Endorsement
  issuedByOfficerName: string;
  issuedByOfficerPosition: string;
  status: 'issued' | 'presented_to_employer' | 'interview_scheduled' | 'interviewed' | 'under_review' | 'hired' | 'hired_on_the_spot' | 'not_hired' | 'declined' | 'expired';
  remarks?: string;
  createdAt: string;
}

export interface LraCandidate {
  seekerId: string;
  seekerName: string;
  seekerContact?: string;
  seekerBarangay?: string;
  educationalAttainment?: string;
  targetPosition?: string;
  nominatedAt: string;
  status: 'nominated' | 'screened' | 'for_interview' | 'hired_on_the_spot' | 'not_hired';
  notes?: string;
}

export interface LocalRecruitmentActivity {
  id: string;
  companyName: string;
  companyOrigin: string; // e.g., "Calapan City", "Batangas", "Metro Manila"
  industry: string;
  letterOfIntentStatus: 'received' | 'under_review' | 'approved' | 'rejected';
  letterOfIntentDate?: string;
  mayorsApprovalVerified: boolean;
  mayorsPermitNo?: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  targetPositions: string[];
  totalVacancies: number;
  targetApplicantTypes: ('College Graduate' | 'High School Graduate' | 'Out-of-School Youth' | 'Skilled/TESDA')[];
  willingnessToRelocateRequired: boolean;
  status: 'pending_review' | 'approved' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  announcementPublished: boolean;
  registeredApplicantsCount: number;
  hotsCount: number; // Hired-On-The-Spot count
  interviewsConductedCount: number;
  notes?: string;
  createdAt: string;

  // Candidate Nomination & Pool Allocation
  nominatedCandidateIds?: string[];
  nominatedCandidates?: LraCandidate[];

  // Form & View Compatibility Aliases
  eventName?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  vacancies?: string[];
  totalSlotsAvailable?: number;
  targetApplicantType?: ('College Graduate' | 'High School Graduate' | 'Out-of-School Youth' | 'Skilled/TESDA')[];
  coordinatorName?: string;
  coordinatorContact?: string;
  hasLetterOfIntent?: boolean;
  hasMayorsPermit?: boolean;
  hasDoleRegistration?: boolean;
  isDmwPoeaLicensed?: boolean;
  isPubliclyAnnounced?: boolean;
  remarks?: string;
  hotsApplicantsCount?: number;
}

export interface MatchResult {
  jobId: string;
  jobSeekerId: string;
  overallMatch: number; // 0 to 100
  outcome: DecisionTreeOutcome;
  
  // Sub-scores
  educationMatchScore: number;
  degreeAlignmentScore: number;
  skillsMatchScore: number;
  experienceMatchScore: number;
  certificationsMatchScore: number;
  
  // Explainability
  matchedReasons: string[];
  missingQualifications: string[];
  decisionReason: string;
}

export interface CandidateMatch extends MatchResult {
  id: string;
  calculatedAt?: string;
}

export interface MatchResolverOptions {
  cachedMatches?: CandidateMatch[] | MatchResult[] | Map<string, MatchResult> | Record<string, any>;
  application?: Partial<Application> | null;
  forceRecalculate?: boolean;
  allowCompute?: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle?: string;
  jobSeekerId: string;
  employerId: string;
  appliedDate: string;
  resumeId: string;
  currentStatus: ApplicationStatus;
  matchResult: MatchResult;
  statusHistory: {
    status: ApplicationStatus;
    updatedAt: string;
    updatedBy: string;
    notes?: string;
  }[];
  notes?: string;
  coverNote?: string;
  matchScore?: number;
  applicantName?: string;
  decisionTreeOutcome?: DecisionTreeOutcome;
  atsScore?: number;
  atsResult?: AtsScanResult;
  feedback?: {
    rating: number; // 1 to 5
    comment: string;
    submittedBy: string;
    submittedAt: string;
  };
}

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  vacancyId?: string;
  jobTitle: string;
  employerId: string;
  companyName: string;
  jobSeekerId: string;
  seekerId?: string;
  applicantName: string;
  interviewType: InterviewType;
  format?: InterviewType;
  date: string;
  time: string;
  scheduledDate?: string;
  scheduledTime?: string;
  locationOrLink: string;
  instructions?: string;
  notes?: string;
  contactPerson: string;
  contactPhone?: string;
  status: InterviewStatus;
  proposedSlots?: { id: string; date: string; time: string; status?: 'proposed' | 'accepted' | 'declined' }[];
  rescheduleNotes?: string;
  remindersSent?: {
    h24?: boolean;
    h1?: boolean;
    m15?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CandidateInvitation {
  id: string;
  jobId: string;
  vacancyId?: string;
  employerId: string;
  companyName: string;
  jobTitle: string;
  jobSeekerId: string;
  seekerId?: string;
  seekerName: string;
  matchScore: number;
  message?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  createdAt?: string;
  respondedAt?: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'employer' | 'job_seeker';
  datePosted: string;
  isImportant: boolean;
}

export interface JobAlertSubscription {
  id: string;
  userId: string;
  title: string;
  keywords: string[];
  categories: string[];
  municipalities: string[];
  employmentTypes: string[];
  minSalary?: number;
  isEmailAlertEnabled: boolean;
  isToastAlertEnabled: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  jobId?: string;
  companyName?: string;
  municipality?: string;
  category?: string;
  type?: 'status' | 'alert' | 'success' | 'info' | string;
  createdAt: string;
  link?: string;
  actionLabel?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  client?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  projectUrl?: string;
  description: string;
}

export interface VolunteerExperienceRecord {
  id: string;
  role: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface AwardRecord {
  id: string;
  title: string;
  organization: string;
  dateAwarded: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: UserRole;
  recipientId: string;
  text: string;
  audioUrl?: string;
  audioDuration?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: UserRole;
  participantAvatar?: string;
  participantCompany?: string;
  participantTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface CompanyReview {
  id: string;
  employerId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1-5
  comment: string;
  photoUrl?: string;
  createdAt: string;
}

export interface ProfileViewEvent {
  id: string;
  seekerId: string;
  viewerName: string;
  viewerCompany: string;
  viewerAvatar?: string;
  timeAgo: string;
  viewedAt: string;
}

