import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  PesoReferralSlip,
  LocalRecruitmentActivity,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EMPLOYERS,
  INITIAL_JOB_POSTS,
  INITIAL_JOB_SEEKERS,
  INITIAL_APPLICATIONS,
  INITIAL_INTERVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ANNOUNCEMENTS,
} from '../data/mockData';

export const SUPABASE_TABLES = {
  USERS: 'users',
  EMPLOYERS: 'employer_profiles',
  JOB_SEEKERS: 'seeker_profiles',
  JOB_POSTS: 'job_posts',
  APPLICATIONS: 'applications',
  CANDIDATE_MATCHES: 'candidate_matches',
  INTERVIEWS: 'interviews',
  LRA_EVENTS: 'lra_events',
  REFERRAL_SLIPS: 'peso_referral_slips',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  ANNOUNCEMENTS: 'system_announcements',
  JOB_SUBSCRIPTIONS: 'job_alert_subscriptions',
} as const;

export type SupabaseTableName = (typeof SUPABASE_TABLES)[keyof typeof SUPABASE_TABLES];

/**
 * Backwards compatibility alias mapping legacy collection keys to Supabase tables.
 */
export const COLLECTIONS = {
  USERS: SUPABASE_TABLES.USERS,
  EMPLOYERS: SUPABASE_TABLES.EMPLOYERS,
  JOB_SEEKERS: SUPABASE_TABLES.JOB_SEEKERS,
  JOB_POSTS: SUPABASE_TABLES.JOB_POSTS,
  APPLICATIONS: SUPABASE_TABLES.APPLICATIONS,
  INTERVIEWS: SUPABASE_TABLES.INTERVIEWS,
  NOTIFICATIONS: SUPABASE_TABLES.NOTIFICATIONS,
  AUDIT_LOGS: SUPABASE_TABLES.AUDIT_LOGS,
  ANNOUNCEMENTS: SUPABASE_TABLES.ANNOUNCEMENTS,
  JOB_SUBSCRIPTIONS: SUPABASE_TABLES.JOB_SUBSCRIPTIONS,
  REFERRAL_SLIPS: SUPABASE_TABLES.REFERRAL_SLIPS,
  LRA_EVENTS: SUPABASE_TABLES.LRA_EVENTS,
  CANDIDATE_MATCHES: SUPABASE_TABLES.CANDIDATE_MATCHES,
} as const;

/**
 * Utility: Converts a camelCase string to snake_case.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Utility: Converts a snake_case string to camelCase.
 */
function snakeToCamel(str: string): string {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
}

/**
 * Recursively converts object keys from camelCase to snake_case for PostgreSQL insertion.
 * Preserves arrays of primitives and JSON-structured nested objects (like education, workExperience).
 */
export function toSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      // If array item is an object with primitive id/name, keep JSON objects intact or convert if appropriate
      if (typeof item === 'object' && item !== null) {
        return toSnakeCase(item);
      }
      return item;
    }) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[snakeKey] = toSnakeCase(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) => (typeof item === 'object' && item !== null ? toSnakeCase(item) : item));
    } else {
      result[snakeKey] = value;
    }
  }
  return result as T;
}

/**
 * Recursively converts object keys from snake_case to camelCase for TypeScript consumption.
 */
export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === 'object' && item !== null ? toCamelCase(item) : item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = toCamelCase(value);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) => (typeof item === 'object' && item !== null ? toCamelCase(item) : item));
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

/**
 * Tests connection health against the Supabase backend.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { connected: false, error: 'Supabase credentials are not configured or are placeholder values.' };
  }

  const startTime = Date.now();
  try {
    const { error } = await supabase.from(SUPABASE_TABLES.USERS).select('id').limit(1);
    const latencyMs = Date.now() - startTime;
    if (error) {
      return { connected: false, latencyMs, error: error.message };
    }
    return { connected: true, latencyMs };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Unknown network error' };
  }
}

/**
 * Fetches all records from a specified Supabase table with automatic camelCase transformation.
 */
export async function fetchAll<T = any>(table: SupabaseTableName): Promise<T[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`[Supabase] Error fetching all from ${table}:`, error.message);
      return [];
    }
    return (data || []).map((row) => toCamelCase<T>(row));
  } catch (err) {
    console.warn(`[Supabase] Exception in fetchAll for ${table}:`, err);
    return [];
  }
}

/**
 * Fetches a single record by primary key ID.
 */
export async function fetchById<T = any>(table: SupabaseTableName, id: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) {
      console.warn(`[Supabase] Error fetching ${id} from ${table}:`, error.message);
      return null;
    }
    return data ? toCamelCase<T>(data) : null;
  } catch (err) {
    console.warn(`[Supabase] Exception in fetchById for ${table} (${id}):`, err);
    return null;
  }
}

/**
 * Upserts (inserts or updates on conflict of id) a record in Supabase.
 * Automatically resolves ID/unique key conflicts on users, seeker_profiles, employer_profiles, and applications.
 */
export async function saveRecord<T extends { id: string }>(table: SupabaseTableName, record: T): Promise<T | null> {
  if (!isSupabaseConfigured()) return record;

  try {
    let snakeRecord = toSnakeCase(record);
    if (table === SUPABASE_TABLES.USERS && typeof snakeRecord === 'object' && snakeRecord !== null) {
      const { password, ...cleanUser } = snakeRecord as any;
      snakeRecord = cleanUser;

      // Handle duplicate email constraint by reusing the canonical ID already committed to PostgreSQL
      if (snakeRecord.email) {
        const cleanEmail = (snakeRecord.email as string).trim().toLowerCase();
        snakeRecord.email = cleanEmail;
        const { data: existingUser } = await supabase
          .from(SUPABASE_TABLES.USERS)
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingUser && existingUser.id !== snakeRecord.id) {
          snakeRecord.id = existingUser.id;
          (record as any).id = existingUser.id;
        }
      }
    } else if (table === SUPABASE_TABLES.JOB_SEEKERS && typeof snakeRecord === 'object' && snakeRecord !== null) {
      // Re-use existing seeker profile ID if one already exists for this user_id or email
      if (snakeRecord.user_id) {
        const { data: existingSeeker } = await supabase
          .from(SUPABASE_TABLES.JOB_SEEKERS)
          .select('id')
          .eq('user_id', snakeRecord.user_id)
          .maybeSingle();

        if (existingSeeker && existingSeeker.id !== snakeRecord.id) {
          snakeRecord.id = existingSeeker.id;
          (record as any).id = existingSeeker.id;
        }
      } else if (snakeRecord.email) {
        const cleanEmail = (snakeRecord.email as string).trim().toLowerCase();
        const { data: existingSeeker } = await supabase
          .from(SUPABASE_TABLES.JOB_SEEKERS)
          .select('id, user_id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingSeeker) {
          snakeRecord.id = existingSeeker.id;
          if (existingSeeker.user_id) snakeRecord.user_id = existingSeeker.user_id;
          (record as any).id = existingSeeker.id;
          if (existingSeeker.user_id) (record as any).userId = existingSeeker.user_id;
        }
      }
    } else if (table === SUPABASE_TABLES.EMPLOYERS && typeof snakeRecord === 'object' && snakeRecord !== null) {
      if (snakeRecord.user_id) {
        const { data: existingEmp } = await supabase
          .from(SUPABASE_TABLES.EMPLOYERS)
          .select('id')
          .eq('user_id', snakeRecord.user_id)
          .maybeSingle();

        if (existingEmp && existingEmp.id !== snakeRecord.id) {
          snakeRecord.id = existingEmp.id;
          (record as any).id = existingEmp.id;
        }
      }
    } else if (table === SUPABASE_TABLES.APPLICATIONS && typeof snakeRecord === 'object' && snakeRecord !== null) {
      // If an application record for this job & seeker already exists, upsert on its existing ID
      if (snakeRecord.job_id && snakeRecord.job_seeker_id) {
        const { data: existingApp } = await supabase
          .from(SUPABASE_TABLES.APPLICATIONS)
          .select('id')
          .eq('job_id', snakeRecord.job_id)
          .eq('job_seeker_id', snakeRecord.job_seeker_id)
          .maybeSingle();

        if (existingApp && existingApp.id !== snakeRecord.id) {
          snakeRecord.id = existingApp.id;
          (record as any).id = existingApp.id;
        }
      }
    }

    const { data, error } = await supabase
      .from(table)
      .upsert(snakeRecord, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase] Error saving record to ${table}:`, error.message, error.details);
      return null;
    }
    return data ? toCamelCase<T>(data) : record;
  } catch (err) {
    console.warn(`[Supabase] Exception in saveRecord for ${table}:`, err);
    return null;
  }
}

/**
 * Defense-in-depth helper: Ensures both user and seeker profile rows are committed in Supabase PostgreSQL
 * before dependent child records (such as job applications) attempt foreign key attachment.
 */
export async function ensureSeekerAndUserInSupabase(
  seeker: JobSeekerProfile,
  user?: User | null
): Promise<{ success: boolean; seeker?: JobSeekerProfile; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, seeker };
  }

  try {
    // 1. Ensure user row exists first in Supabase users table
    let verifiedUserId = seeker.userId;
    if (user) {
      const savedUser = await saveRecord(SUPABASE_TABLES.USERS, user);
      if (savedUser?.id) {
        verifiedUserId = savedUser.id;
        seeker.userId = savedUser.id;
      }
    } else if (seeker.userId) {
      const existingUser = await fetchById<User>(SUPABASE_TABLES.USERS, seeker.userId);
      if (!existingUser) {
        const fallbackUser: User = {
          id: seeker.userId,
          email: seeker.email || `${seeker.id}@jobseeker.ehanap.local`,
          name: `${seeker.firstName || 'Job'} ${seeker.lastName || 'Seeker'}`.trim(),
          role: 'job_seeker',
          isAccountVerified: true,
          isProfileCompleted: Boolean(seeker.isProfileCompleted),
          createdAt: new Date().toISOString(),
        };
        const savedUser = await saveRecord(SUPABASE_TABLES.USERS, fallbackUser);
        if (savedUser?.id) {
          verifiedUserId = savedUser.id;
          seeker.userId = savedUser.id;
        }
      }
    }

    // 2. Ensure seeker profile row exists in Supabase seeker_profiles table
    const seekerToSave: JobSeekerProfile = {
      ...seeker,
      userId: verifiedUserId,
    };
    const savedSeeker = await saveRecord(SUPABASE_TABLES.JOB_SEEKERS, seekerToSave);
    if (!savedSeeker) {
      return { success: false, error: 'Failed to persist seeker profile to Supabase.' };
    }

    return { success: true, seeker: savedSeeker };
  } catch (err: any) {
    console.warn('[Supabase] Error ensuring seeker in Supabase:', err);
    return { success: false, error: err?.message || 'Database sync error' };
  }
}

/**
 * Updates specific fields on an existing record.
 */
export async function updateRecord(
  table: SupabaseTableName,
  id: string,
  updates: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    let snakeUpdates = toSnakeCase(updates);
    if (table === SUPABASE_TABLES.USERS && typeof snakeUpdates === 'object' && snakeUpdates !== null) {
      const { password, ...cleanUpdates } = snakeUpdates as any;
      snakeUpdates = cleanUpdates;
    }
    const { error } = await supabase.from(table).update(snakeUpdates).eq('id', id);

    if (error) {
      console.warn(`[Supabase] Error updating record in ${table} (${id}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Exception in updateRecord for ${table} (${id}):`, err);
    return false;
  }
}

/**
 * Deletes a record by primary key ID.
 */
export async function deleteRecord(table: SupabaseTableName, id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.warn(`[Supabase] Error deleting record in ${table} (${id}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Exception in deleteRecord for ${table} (${id}):`, err);
    return false;
  }
}

/**
 * Subscribes to real-time changes on a specified Supabase table.
 * Fetches the initial snapshot, emits it, and subsequently applies real-time row mutations.
 */
export function subscribeToSupabaseTable<T extends { id: string }>(
  table: SupabaseTableName,
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  let isSubscribed = true;
  let localCache: T[] = [];

  // Initial fetch
  fetchAll<T>(table)
    .then((initialData) => {
      if (isSubscribed) {
        localCache = initialData;
        onData(localCache);
      }
    })
    .catch((err) => {
      if (onError) onError(err);
    });

  // Subscribe to postgres_changes
  const channel = supabase
    .channel(`realtime_${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      (payload) => {
        if (!isSubscribed) return;

        const eventType = payload.eventType;
        const newRow = payload.new ? toCamelCase<T>(payload.new) : null;
        const oldRow = payload.old ? toCamelCase<T>(payload.old) : null;

        if (eventType === 'INSERT' && newRow) {
          const index = localCache.findIndex((item) => item.id === newRow.id);
          if (index >= 0) {
            localCache[index] = newRow;
          } else {
            localCache = [...localCache, newRow];
          }
          onData(localCache);
        } else if (eventType === 'UPDATE' && newRow) {
          localCache = localCache.map((item) => (item.id === newRow.id ? { ...item, ...newRow } : item));
          onData(localCache);
        } else if (eventType === 'DELETE' && oldRow) {
          localCache = localCache.filter((item) => item.id !== oldRow.id);
          onData(localCache);
        }
      }
    )
    .subscribe((status, err) => {
      if (err && onError) {
        onError(new Error(`Realtime subscription error for ${table}: ${err.message}`));
      }
    });

  return () => {
    isSubscribed = false;
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Verifies if the official Roxas PESO Admin account exists in Supabase.
 * If not present, automatically provisions initial demo accounts.
 */
export async function ensureAdminAccountExistsInSupabase(): Promise<boolean> {
  return ensureDemoAccountsExistInSupabase();
}

/**
 * Checks if demo accounts exist in Supabase; seeds them if missing.
 * Also ensures primary demo personas exist in Supabase auth.users so password logins don't trigger 400 Bad Request.
 */
export async function ensureDemoAccountsExistInSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const adminUser = await fetchById<User>(SUPABASE_TABLES.USERS, 'user-peso-admin-01');
    if (!adminUser) {
      console.log('[Supabase] Seeding initial Roxas demo accounts and vacancies into Supabase...');
      await seedDemoDataToSupabase();
    }

    // Ensure primary demo personas exist in Supabase auth.users with their official demo credentials
    const primaryDemoAuths = [
      { email: 'peso.admin@roxas.gov.ph', password: 'password123', role: 'admin', name: 'Hon. Roberto D. Alvarez' },
      { email: 'puregold.roxas@employer.ph', password: 'password123', role: 'employer', name: 'Puregold Price Club Inc. (Roxas)' },
      { email: 'juan.delacruz@jobseeker.ph', password: 'password123', role: 'job_seeker', name: 'Juan Dela Cruz' },
    ];

    for (const demo of primaryDemoAuths) {
      try {
        await supabase.auth.signUp({
          email: demo.email,
          password: demo.password,
          options: {
            data: {
              role: demo.role,
              name: demo.name,
              full_name: demo.name,
              municipality: 'Roxas',
            },
          },
        });
      } catch {
        // Quiet fallback if user already registered in Supabase auth
      }
    }

    return true;
  } catch (error) {
    console.warn('[Supabase] Error verifying demo accounts in Supabase:', error);
    return false;
  }
}

/**
 * Seeds complete Roxas demo data (Users, Employers, Job Seekers, Job Posts, Announcements, Audit Logs) into Supabase.
 */
export async function seedDemoDataToSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 1. Users
    for (const u of INITIAL_USERS) {
      await saveRecord(SUPABASE_TABLES.USERS, u);
    }

    // 2. Employers
    for (const e of INITIAL_EMPLOYERS) {
      await saveRecord(SUPABASE_TABLES.EMPLOYERS, e);
    }

    // 3. Job Seekers
    for (const s of INITIAL_JOB_SEEKERS) {
      await saveRecord(SUPABASE_TABLES.JOB_SEEKERS, s);
    }

    // 4. Job Posts
    for (const j of INITIAL_JOB_POSTS) {
      await saveRecord(SUPABASE_TABLES.JOB_POSTS, j);
    }

    // 5. Applications
    for (const a of INITIAL_APPLICATIONS) {
      await saveRecord(SUPABASE_TABLES.APPLICATIONS, a);
    }

    // 6. Interviews
    for (const i of INITIAL_INTERVIEWS) {
      await saveRecord(SUPABASE_TABLES.INTERVIEWS, i);
    }

    // 7. Notifications
    for (const n of INITIAL_NOTIFICATIONS) {
      await saveRecord(SUPABASE_TABLES.NOTIFICATIONS, n);
    }

    // 8. Audit Logs
    for (const l of INITIAL_AUDIT_LOGS) {
      await saveRecord(SUPABASE_TABLES.AUDIT_LOGS, l);
    }

    // 9. Announcements
    for (const an of INITIAL_ANNOUNCEMENTS) {
      await saveRecord(SUPABASE_TABLES.ANNOUNCEMENTS, an);
    }

    console.log('[Supabase] Successfully seeded initial Roxas demo accounts and records.');
    return true;
  } catch (error) {
    console.warn('[Supabase] Error seeding demo data to Supabase:', error);
    return false;
  }
}

/**
 * Purges demo records and resets the Supabase database to a clean zero-data initial state.
 */
export async function resetSupabaseDatabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    console.log('[Supabase] Purging legacy test records for clean zero-data state...');
    const tablesToClean: SupabaseTableName[] = [
      SUPABASE_TABLES.AUDIT_LOGS,
      SUPABASE_TABLES.NOTIFICATIONS,
      SUPABASE_TABLES.INTERVIEWS,
      SUPABASE_TABLES.CANDIDATE_MATCHES,
      SUPABASE_TABLES.APPLICATIONS,
      SUPABASE_TABLES.REFERRAL_SLIPS,
      SUPABASE_TABLES.JOB_POSTS,
      SUPABASE_TABLES.JOB_SEEKERS,
      SUPABASE_TABLES.EMPLOYERS,
      SUPABASE_TABLES.LRA_EVENTS,
      SUPABASE_TABLES.ANNOUNCEMENTS,
      SUPABASE_TABLES.JOB_SUBSCRIPTIONS,
      SUPABASE_TABLES.USERS,
    ];

    for (const table of tablesToClean) {
      const { error } = await supabase.from(table).delete().neq('id', '');
      if (error) {
        console.warn(`[Supabase] Error cleaning ${table}:`, error.message);
      }
    }

    // Re-seed essential PESO administrator
    const adminUser = INITIAL_USERS.find((u) => u.id === 'user-peso-admin-01');
    if (adminUser) {
      await saveRecord(SUPABASE_TABLES.USERS, adminUser);
    }

    console.log('[Supabase] Clean zero-data initial state established.');
    return true;
  } catch (error) {
    console.warn('[Supabase] Error resetting database:', error);
    return false;
  }
}

/**
 * Supabase Auth: Register new user with email and password
 */
export async function signUpWithSupabase(
  email: string,
  password?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      user: { id: `offline-${Date.now()}`, email, user_metadata: metadata },
      session: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || 'eHANAP@2026',
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase authentication failed.' };
  }
}

/**
 * Supabase Auth: Verify 6-digit email OTP for signup confirmation or password recovery.
 */
export async function verifySupabaseOtp(
  email: string,
  token: string,
  type: 'signup' | 'recovery' = 'signup'
): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanToken = (token || '').trim();

  // Master demo code fallback for academic thesis defense and offline evaluation
  if (cleanToken === '123456') {
    return {
      success: true,
      user: { id: `demo-verified-${Date.now()}`, email: cleanEmail },
      session: null,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Invalid verification code in offline mode. Use master demo code 123456.',
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to verify verification code.' };
  }
}

/**
 * Supabase Auth: Resend 6-digit verification OTP email
 */
export async function resendSupabaseOtp(
  email: string,
  type: 'signup' | 'email_change' = 'signup'
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.resend({
      type,
      email: cleanEmail,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to resend verification code.' };
  }
}

/**
 * Supabase Auth: Request password recovery OTP email
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to dispatch password recovery email.' };
  }
}

/**
 * Supabase Auth: Verify recovery OTP and atomically update user password
 */
export async function resetPasswordWithOtp(
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanToken = (token || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!cleanToken || cleanToken.length < 6) {
    return { success: false, error: 'Please enter the 6-digit verification code.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  // Master demo code fallback for academic thesis defense and offline evaluation
  if (cleanToken === '123456') {
    return { success: true };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Invalid verification code in offline mode. Use master demo code 123456.',
    };
  }

  try {
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    if (verifyError) {
      return { success: false, error: verifyError.message };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update password.' };
  }
}

/**
 * Supabase Auth: Sign in user with email and password.
 * Includes graceful recovery for demo accounts and newly provisioned offline users.
 */
export async function signInWithSupabase(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      user: { id: `offline-${Date.now()}`, email },
      session: null,
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || 'password123';

  try {
    let { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    // If invalid credentials on a demo account or fallback user, provision and retry once
    if (error && (cleanEmail.endsWith('@jobseeker.ph') || cleanEmail.endsWith('@employer.ph') || cleanEmail.endsWith('@roxas.gov.ph') || cleanEmail.endsWith('@example.com'))) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: { data: { email: cleanEmail } },
        });
        const retry = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      } catch {
        // Fall through to returning initial error
      }
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase login failed.' };
  }
}

/**
 * Supabase Auth: Sign out active user
 */
export async function signOutWithSupabase(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase logout failed.' };
  }
}

/**
 * Supabase Auth: Retrieve active session
 */
export async function getSupabaseSession(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Supabase Auth: Retrieve active user
 */
export async function getSupabaseUser(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Supabase Auth: Subscribe to auth state changes
 */
export function onSupabaseAuthStateChange(
  callback: (event: string, session: any | null) => void
): { unsubscribe: () => void } {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  try {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return {
      unsubscribe: () => {
        data.subscription.unsubscribe();
      },
    };
  } catch {
    return { unsubscribe: () => {} };
  }
}

/**
 * Supabase Auth: Sign in or register via OAuth provider (Google)
 * Note: Apple Sign In has been decommissioned due to lack of an Apple Developer Program license.
 */
export async function signInWithSupabaseOAuth(
  provider: 'google' = 'google',
  options?: { redirectTo?: string; queryParams?: Record<string, string> }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if ((provider as string) !== 'google') {
    return {
      success: false,
      error: `Unsupported OAuth provider: "${provider}". Apple Sign In has been decommissioned. Only Google OAuth is supported.`,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: {
        provider: 'google',
        url: null,
        user: {
          id: `offline-oauth-${Date.now()}`,
          email: 'google.user@example.com',
          user_metadata: {
            full_name: 'Demo Google User',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
        },
      },
    };
  }

  try {
    const redirectTo = options?.redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: options?.queryParams || { prompt: 'select_account' },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase OAuth authentication failed.' };
  }
}


