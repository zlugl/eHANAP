import { NotificationItem, User, UserRole, JobSeekerProfile, Application, Interview, PesoReferralSlip } from '../types';
import { isSeekerProfileComplete } from './routeGuards';

export interface NotificationRecipientContext {
  id?: string | null;
  userId?: string | null;
  email?: string | null;
  userEmail?: string | null;
  role?: UserRole | null;
  currentUserRole?: UserRole | null;
  seekerId?: string | null;
  seekerUserId?: string | null;
}

/**
 * Single source of truth for notification recipient matching across display filtering,
 * mark-all-read, and clear-all operations (including PESO admin role alerts).
 */
export function isNotificationRecipient(
  notif: Pick<NotificationItem, 'recipientId' | 'recipientRole'>,
  recipient: User | NotificationRecipientContext | null | undefined,
  seekerProfile?: Pick<JobSeekerProfile, 'id' | 'userId'> | null,
  options?: { includeBroadcasts?: boolean }
): boolean {
  if (!recipient) return false;

  const userId =
    (('id' in recipient ? recipient.id : undefined) ||
      ('userId' in recipient ? recipient.userId : undefined) ||
      '').trim();
  const userEmailStr = (
    ('email' in recipient ? recipient.email : undefined) ||
    ('userEmail' in recipient ? recipient.userEmail : undefined) ||
    ''
  )
    .trim()
    .toLowerCase();
  const role =
    ('role' in recipient ? recipient.role : undefined) ||
    ('currentUserRole' in recipient ? recipient.currentUserRole : undefined) ||
    (userId === 'admin' ? 'admin' : undefined);
  const seekerId = seekerProfile?.id ?? ('seekerId' in recipient ? recipient.seekerId : undefined);
  const seekerUserId = seekerProfile?.userId ?? ('seekerUserId' in recipient ? recipient.seekerUserId : undefined);

  const rawRecipientId = (notif.recipientId || '').trim();
  const lowerRecipientId = rawRecipientId.toLowerCase();
  const includeBroadcasts = options?.includeBroadcasts ?? true;

  const isDirectRecipient =
    Boolean(userId && rawRecipientId === userId) ||
    Boolean(userEmailStr && lowerRecipientId === userEmailStr) ||
    Boolean(seekerId && rawRecipientId === seekerId) ||
    Boolean(seekerUserId && rawRecipientId === seekerUserId);

  if (isDirectRecipient) return true;

  if (role === 'admin' && notif.recipientRole === 'admin') {
    return true;
  }

  const isBroadcastId =
    lowerRecipientId === 'all' ||
    rawRecipientId === '*' ||
    lowerRecipientId === 'broadcast';

  if (rawRecipientId && (!includeBroadcasts || !isBroadcastId)) {
    return false;
  }

  if (!rawRecipientId && !role) {
    return false;
  }

  if (notif.recipientRole && role && notif.recipientRole !== role && notif.recipientRole !== ('all' as any)) {
    return false;
  }

  return includeBroadcasts || !rawRecipientId;
}

/**
 * Validates whether a notification is relevant and authorized for the given user,
 * removing unnecessary notifications when a job seeker has not performed or reached
 * that activity yet (e.g., interviews, applications, referrals, profile completion, skill badges).
 */
function isNotificationValidForUser(
  notif: NotificationItem,
  currentUser: User | null | undefined,
  seekerProfile?: JobSeekerProfile | null,
  applications: Application[] = [],
  interviews: Interview[] = [],
  referralSlips: PesoReferralSlip[] = []
): boolean {
  if (!currentUser) return false;
  if (!isNotificationRecipient(notif, currentUser, seekerProfile)) {
    return false;
  }

  const userNameStr = (currentUser.name || '').toLowerCase();
  const seekerId = seekerProfile?.id;

  // 2. For Job Seekers: remove unnecessary notifications when the seeker hasn't done the underlying activity yet
  if (currentUser.role === 'job_seeker') {
    const titleLower = (notif.title || '').toLowerCase();
    const messageLower = (notif.message || '').toLowerCase();
    const combined = `${titleLower} ${messageLower}`;

    // A) Interview notifications ("Interview Scheduled", "Interview Invitation", etc.)
    if (combined.includes('interview')) {
      const hasInterview = interviews.some(i => 
        i.jobSeekerId === seekerId ||
        (userNameStr && i.applicantName?.toLowerCase() === userNameStr) ||
        (seekerProfile && `${seekerProfile.firstName} ${seekerProfile.lastName}`.toLowerCase() === i.applicantName?.toLowerCase())
      );
      const hasInterviewApp = applications.some(a => 
        a.jobSeekerId === seekerId &&
        (a.currentStatus === 'interview_completed' || a.currentStatus === 'shortlisted')
      );
      if (!hasInterview && !hasInterviewApp) {
        return false; // Seeker hasn't had an interview scheduled yet
      }
    }

    // B) Application status update / Hired / Shortlisted notifications
    if (combined.includes('application') || combined.includes('applied') || combined.includes('hired') || combined.includes('shortlisted')) {
      const hasApplication = applications.some(a => 
        a.jobSeekerId === seekerId ||
        (userNameStr && a.applicantName?.toLowerCase() === userNameStr)
      );
      if (!hasApplication) {
        return false; // Seeker hasn't applied for this or any job yet
      }
    }

    // C) Referral slip notifications ("Referral Slip Issued" / "Referral Slip Ready")
    if (combined.includes('referral') || combined.includes('endorse')) {
      const hasReferral = referralSlips.some(r => 
        r.jobSeekerId === seekerId ||
        (seekerProfile && `${seekerProfile.firstName} ${seekerProfile.lastName}`.toLowerCase() === r.jobSeekerName.toLowerCase()) ||
        (userNameStr && userNameStr === r.jobSeekerName.toLowerCase())
      );
      if (!hasReferral) {
        return false; // Seeker hasn't received a referral slip yet
      }
    }

    // D) Profile setup completed notification ("Profile Setup Completed & Saved")
    if (combined.includes('profile setup completed') || combined.includes('profile setup complete') || combined.includes('profile set up')) {
      const isDone = isSeekerProfileComplete(currentUser, seekerProfile) ||
        Boolean(seekerProfile && ((seekerProfile.technicalSkills && seekerProfile.technicalSkills.length > 0) || (seekerProfile.softSkills && seekerProfile.softSkills.length > 0)));
      if (!isDone) {
        return false; // Seeker hasn't completed profile setup yet
      }
    }

    // E) Skill badge earned notification
    if (combined.includes('verified skill badge') || combined.includes('badge earned') || combined.includes('assessment passed')) {
      const hasBadge = Boolean(
        seekerProfile?.assessments && seekerProfile.assessments.length > 0
      );
      if (!hasBadge) {
        return false; // Seeker hasn't taken/passed an assessment yet
      }
    }
  }

  return true;
}

export function getFilteredUserNotifications(
  notifications: NotificationItem[],
  currentUser: User | null | undefined,
  seekerProfile?: JobSeekerProfile | null,
  applications: Application[] = [],
  interviews: Interview[] = [],
  referralSlips: PesoReferralSlip[] = []
): NotificationItem[] {
  if (!currentUser) return [];
  return notifications.filter(n =>
    isNotificationValidForUser(n, currentUser, seekerProfile, applications, interviews, referralSlips)
  );
}
