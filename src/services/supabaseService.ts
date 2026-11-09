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
 */
export async function saveRecord<T extends { id: string }>(table: SupabaseTableName, record: T): Promise<T | null> {
  if (!isSupabaseConfigured()) return record;

  try {
    const snakeRecord = toSnakeCase(record);
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
 * Updates specific fields on an existing record.
 */
export async function updateRecord(
  table: SupabaseTableName,
  id: string,
  updates: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const snakeUpdates = toSnakeCase(updates);
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
 */
export async function ensureDemoAccountsExistInSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const adminUser = await fetchById<User>(SUPABASE_TABLES.USERS, 'user-peso-admin-01');
    if (!adminUser) {
      console.log('[Supabase] Seeding initial Roxas demo accounts and vacancies into Supabase...');
      return seedDemoDataToSupabase();
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
