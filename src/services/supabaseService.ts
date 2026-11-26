import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storageAdapter } from '../lib/storageAdapter';
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
    const mapped = (data || []).map((row) => toCamelCase<T>(row));
    return storageAdapter.filterOutLegacyDemoRecords(mapped);
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

export async function fetchUserByEmail(email: string): Promise<User | null> {
  if (!isSupabaseConfigured() || !email) return null;

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.USERS)
      .select('*')
      .ilike('email', email.trim())
      .maybeSingle();
    if (error) {
      console.warn(`[Supabase] Error fetching user by email:`, error.message);
      return null;
    }
    return data ? toCamelCase<User>(data) : null;
  } catch (err) {
    console.warn(`[Supabase] Exception in fetchUserByEmail:`, err);
    return null;
  }
}

function sanitizeForTable<T>(table: SupabaseTableName, record: T): T {
  // The PostgreSQL `users` table does not store passwords (Supabase Auth owns credentials).
  if (table === SUPABASE_TABLES.USERS && record && typeof record === 'object') {
    const { password: _password, ...rest } = record as Record<string, any>;
    return rest as T;
  }
  return record;
}

/**
 * Upserts (inserts or updates on conflict of id) a record in Supabase.
 */
export async function saveRecord<T extends { id: string }>(table: SupabaseTableName, record: T): Promise<T | null> {
  if (!isSupabaseConfigured()) return record;

  try {
    const snakeRecord = toSnakeCase(sanitizeForTable(table, record));
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
 * Batch upserts (inserts or updates on conflict of id) multiple records in Supabase.
 */
export async function saveRecords<T extends { id: string }>(table: SupabaseTableName, records: T[]): Promise<T[]> {
  if (!records || records.length === 0) return [];
  if (!isSupabaseConfigured()) return records;

  try {
    const dedupedById = Array.from(
      new Map<string, Record<string, any>>(
        records.map((record) => [record.id, toSnakeCase<Record<string, any>>(sanitizeForTable(table, record))])
      ).values()
    );
    const { data, error } = await supabase
      .from(table)
      .upsert(dedupedById, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn(`[Supabase] Error batch saving records to ${table}:`, error.message, error.details);
      return [];
    }
    return (data || []).map((row) => toCamelCase<T>(row));
  } catch (err) {
    console.warn(`[Supabase] Exception in saveRecords for ${table}:`, err);
    return [];
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
    const snakeUpdates = toSnakeCase(sanitizeForTable(table, updates));
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
 * Clean-slate mode: does not auto-seed hardcoded demo accounts.
 */
export async function ensureAdminAccountExistsInSupabase(): Promise<boolean> {
  return true;
}

/**
 * Clean-slate mode: does not auto-seed demo accounts; all records are created dynamically.
 */
export async function ensureDemoAccountsExistInSupabase(): Promise<boolean> {
  return true;
}

/**
 * Clean-slate mode: no demo data is seeded.
 */
export async function seedDemoDataToSupabase(): Promise<boolean> {
  return true;
}

/**
 * Purges all records and resets the Supabase database to a clean zero-data initial state.
 */
export async function resetSupabaseDatabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
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
 * Supabase Auth: Sign in user with email and password
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

  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
 */
export async function signInWithSupabaseOAuth(
  provider: 'google' = 'google',
  options?: { redirectTo?: string; queryParams?: Record<string, string> }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: {
        provider,
        url: null,
        user: {
          id: `offline-oauth-${Date.now()}`,
          email: 'google.user@example.com',
          user_metadata: {
            full_name: 'Google User',
            avatar_url: '',
          },
        },
      },
    };
  }

  try {
    const redirectTo = options?.redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
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


