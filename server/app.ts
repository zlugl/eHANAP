import express from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { handleHealthCheck, handleResumeParsing } from './controllers/resumeController';

export interface AppOptions {
  jsonLimit?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  verifyToken?: (token: string) => Promise<boolean>;
}

let cachedServerSupabase: { url: string; key: string; client: SupabaseClient } | null = null;

function getServerSupabaseClient(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key || url.includes('your-project-id') || key.includes('your-supabase-anon-key')) {
    return null;
  }
  if (cachedServerSupabase && cachedServerSupabase.url === url && cachedServerSupabase.key === key) {
    return cachedServerSupabase.client;
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedServerSupabase = { url, key, client };
  return client;
}

/**
 * Verifies a Supabase access token against Supabase Auth without mutating session state.
 */
export async function verifySupabaseToken(token: string): Promise<boolean> {
  const client = getServerSupabaseClient();
  if (!client || !token) return false;
  try {
    const { data, error } = await client.auth.getUser(token);
    return Boolean(!error && data?.user);
  } catch {
    return false;
  }
}

function createIpRateLimiter(maxRequests: number, windowMs: number): express.RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      if (hits.size > 1000) {
        for (const [k, v] of hits) {
          if (now >= v.resetAt) hits.delete(k);
        }
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: 'Too many resume parsing requests. Please wait a minute and try again.',
      });
    }

    return next();
  };
}

function createAuthMiddleware(verifyToken: (token: string) => Promise<boolean>): express.RequestHandler {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
    const token = match?.[1]?.trim() || '';

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to parse resumes.',
      });
    }

    const isValid = await verifyToken(token).catch(() => false);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: invalid or expired session token.',
      });
    }

    return next();
  };
}

/**
 * Creates and configures the Express application with API routes and middleware.
 * Decoupled from HTTP listener to enable isolated unit and integration testing.
 */
export function createApp(options?: AppOptions): express.Express {
  const app = express();
  const limit = options?.jsonLimit || '15mb';
  const rateLimitMiddleware = createIpRateLimiter(
    options?.rateLimitMax ?? 20,
    options?.rateLimitWindowMs ?? 60_000
  );
  const authMiddleware = createAuthMiddleware(options?.verifyToken ?? verifySupabaseToken);

  app.use(express.json({ limit }));

  // API Routes
  app.get('/api/health', handleHealthCheck);
  app.post('/api/parse-resume', rateLimitMiddleware, authMiddleware, handleResumeParsing);
  app.post('/api/extract-resume', rateLimitMiddleware, authMiddleware, handleResumeParsing);

  return app;
}
