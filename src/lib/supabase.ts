import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Polyfill WebSocket constructor in Node.js environments lacking native WebSocket (Node < 22)
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  class WebSocketPolyfill {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  }
  (globalThis as any).WebSocket = WebSocketPolyfill;
}

// Retrieve environment variables with fallback support for both Vite and Node environments
const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) 
  || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) 
  || '';

const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) 
  || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) 
  || '';

/**
 * Checks if the Supabase client has valid, non-placeholder configuration credentials.
 */
export function isSupabaseConfigured(): boolean {
  if (!envUrl || !envAnonKey) return false;
  if (envUrl.includes('your-project-id') || envAnonKey.includes('your-supabase-anon-key')) return false;
  try {
    const parsed = new URL(envUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Safe fallback URL and key for offline demonstration / development when credentials are not yet set
const FALLBACK_URL = 'https://placeholder-offline-ehanap.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.offline-fallback-token-ehanap-defense';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? envUrl : FALLBACK_URL,
  isSupabaseConfigured() ? envAnonKey : FALLBACK_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export default supabase;
