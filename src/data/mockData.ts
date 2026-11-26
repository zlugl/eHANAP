import { 
  User, 
  EmployerProfile, 
  JobSeekerProfile, 
  JobPost, 
  Application, 
  Interview, 
  NotificationItem, 
  AuditLog, 
  SystemAnnouncement,
  JobAlertSubscription,
  ChatConversation,
  ChatMessage,
  ProfileViewEvent,
  CompanyReview
} from '../types';

// Re-export municipal and job category constants from centralized constants layer
export {
  ROXAS_MUNICIPALITY,
  ROXAS_BARANGAYS,
  ORIENTAL_MINDORO_MUNICIPALITIES,
  JOB_CATEGORIES
} from '../constants';

// Clean-slate initial state: all accounts, profiles, documents, and job listings are created dynamically
export const INITIAL_USERS: User[] = [];
export const INITIAL_EMPLOYERS: EmployerProfile[] = [];
export const INITIAL_JOB_SEEKERS: JobSeekerProfile[] = [];
export const INITIAL_JOB_POSTS: JobPost[] = [];
export const INITIAL_APPLICATIONS: Application[] = [];
export const INITIAL_INTERVIEWS: Interview[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [];
export const INITIAL_JOB_SUBSCRIPTIONS: JobAlertSubscription[] = [];
export const INITIAL_BOOKMARKED_JOB_IDS: string[] = [];
export const INITIAL_CONVERSATIONS: ChatConversation[] = [];
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];
export const INITIAL_COMPANY_REVIEWS: CompanyReview[] = [];
export const INITIAL_PROFILE_VIEWS: ProfileViewEvent[] = [];
