import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

async function run() {
  console.log('======================================================');
  console.log('        eHANAP Supabase Configuration Check           ');
  console.log('======================================================\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim() || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

  // 1. Check URL
  if (!supabaseUrl) {
    results.push({
      step: '1. VITE_SUPABASE_URL',
      status: 'FAIL',
      message: 'VITE_SUPABASE_URL is missing or blank in .env',
    });
  } else if (supabaseUrl.includes('your-project-id')) {
    results.push({
      step: '1. VITE_SUPABASE_URL',
      status: 'FAIL',
      message: 'VITE_SUPABASE_URL contains placeholder value ("your-project-id")',
    });
  } else {
    try {
      const parsed = new URL(supabaseUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        results.push({
          step: '1. VITE_SUPABASE_URL',
          status: 'PASS',
          message: `Configured (${parsed.origin})`,
        });
      } else {
        results.push({
          step: '1. VITE_SUPABASE_URL',
          status: 'FAIL',
          message: `Invalid URL protocol: ${parsed.protocol}`,
        });
      }
    } catch (e: any) {
      results.push({
        step: '1. VITE_SUPABASE_URL',
        status: 'FAIL',
        message: `Malformed URL: ${e.message}`,
      });
    }
  }

  // 2. Check Key
  if (!supabaseKey) {
    results.push({
      step: '2. VITE_SUPABASE_ANON_KEY',
      status: 'FAIL',
      message: 'VITE_SUPABASE_ANON_KEY is missing or blank in .env',
    });
  } else if (supabaseKey.includes('your-supabase-anon-key')) {
    results.push({
      step: '2. VITE_SUPABASE_ANON_KEY',
      status: 'FAIL',
      message: 'VITE_SUPABASE_ANON_KEY contains placeholder text ("your-supabase-anon-key")',
    });
  } else {
    const parts = supabaseKey.split('.');
    if (parts.length === 3) {
      try {
        const payloadBuf = Buffer.from(parts[1], 'base64');
        const payload = JSON.parse(payloadBuf.toString('utf-8'));
        const role = payload.role || payload.iss || 'unknown';
        const exp = payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none';
        const isExpired = payload.exp ? Date.now() >= payload.exp * 1000 : false;

        results.push({
          step: '2. VITE_SUPABASE_ANON_KEY',
          status: isExpired ? 'FAIL' : 'PASS',
          message: isExpired
            ? `JWT token is expired (Expired at: ${exp})`
            : `Valid JWT format (Role: "${role}", Expires: ${exp})`,
        });
      } catch (err: any) {
        results.push({
          step: '2. VITE_SUPABASE_ANON_KEY',
          status: 'WARN',
          message: `Present (length: ${supabaseKey.length}), but payload parse error: ${err.message}`,
        });
      }
    } else {
      results.push({
        step: '2. VITE_SUPABASE_ANON_KEY',
        status: 'WARN',
        message: `Present (length: ${supabaseKey.length}), but not standard 3-part JWT.`,
      });
    }
  }

  const hasFatalEnv = results.some((r) => r.status === 'FAIL');
  if (hasFatalEnv) {
    printSummary();
    return;
  }

  // 3. Connect Client
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 4. Test Auth Ping
  const t0Auth = Date.now();
  try {
    const { data: authData, error: authError } = await client.auth.getSession();
    const duration = Date.now() - t0Auth;
    if (authError) {
      results.push({
        step: '3. Supabase Auth Service',
        status: 'FAIL',
        message: `Auth returned error: ${authError.message}`,
      });
    } else {
      results.push({
        step: '3. Supabase Auth Service',
        status: 'PASS',
        message: `Auth endpoint responsive (${duration}ms)`,
      });
    }
  } catch (err: any) {
    results.push({
      step: '3. Supabase Auth Service',
      status: 'FAIL',
      message: `Auth connection error: ${err?.message || err}`,
    });
  }

  // 5. Test Tables
  const expectedTables = [
    'users',
    'employer_profiles',
    'seeker_profiles',
    'job_posts',
    'applications',
    'candidate_matches',
    'interviews',
    'lra_events',
    'peso_referral_slips',
    'notifications',
    'audit_logs',
  ];

  console.log('Testing Database Schema & Tables queryability...\n');
  const tableSummary: Record<string, any> = {};

  for (const table of expectedTables) {
    const t0 = Date.now();
    try {
      const { data, count, error, status } = await client
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      const duration = Date.now() - t0;
      if (error) {
        tableSummary[table] = {
          exists: false,
          status,
          code: error.code,
          message: error.message,
        };
      } else {
        tableSummary[table] = {
          exists: true,
          status,
          count: count ?? data?.length ?? 0,
          latencyMs: duration,
        };
      }
    } catch (err: any) {
      tableSummary[table] = {
        exists: false,
        error: err?.message || 'Network exception',
      };
    }
  }

  const existing = Object.entries(tableSummary).filter(([_, v]) => v.exists);
  const missing = Object.entries(tableSummary).filter(([_, v]) => !v.exists);

  if (existing.length === expectedTables.length) {
    results.push({
      step: '4. Database Tables & Schema',
      status: 'PASS',
      message: `All ${expectedTables.length} application tables exist and are queryable.`,
      details: Object.fromEntries(existing.map(([k, v]) => [k, `${v.count} rows (${v.latencyMs}ms)`])),
    });
  } else if (existing.length > 0) {
    results.push({
      step: '4. Database Tables & Schema',
      status: 'WARN',
      message: `${existing.length}/${expectedTables.length} tables found. Some tables missing or restricted.`,
      details: {
        accessible: Object.fromEntries(existing.map(([k, v]) => [k, `${v.count} rows`])),
        issues: Object.fromEntries(missing.map(([k, v]) => [k, v.message || v.error || 'Missing'])),
      },
    });
  } else {
    results.push({
      step: '4. Database Tables & Schema',
      status: 'FAIL',
      message: `None of the ${expectedTables.length} tables were found in the database.`,
      details: Object.fromEntries(missing.map(([k, v]) => [k, v.message || v.error || 'Failed'])),
    });
  }

  printSummary();
}

function printSummary() {
  console.log('\n--- DIAGNOSTIC SUMMARY ---');
  for (const r of results) {
    const symbol = r.status === 'PASS' ? '✅ [PASS]' : r.status === 'FAIL' ? '❌ [FAIL]' : '⚠️ [WARN]';
    console.log(`${symbol} ${r.step}: ${r.message}`);
    if (r.details) {
      console.log('   Details:', JSON.stringify(r.details, null, 2).replace(/\n/g, '\n   '));
    }
  }
  console.log('\n======================================================\n');
}

run().catch((e) => {
  console.error('Diagnostic crashed:', e);
  process.exit(1);
});
