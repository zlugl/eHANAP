import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from '../server/app';
import { sanitizeExtractedResumeData } from '../server/services/aiResumeService';
import { saveRecords, SUPABASE_TABLES } from '../src/services/supabaseService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition: boolean, label: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('--- eHANAP WP-05: Server Hardening, OCR Fix & Batch Persistence ---');

  // 1. Finding #9a: Auth verification and per-IP rate limiting on resume endpoints
  const validToken = 'wp05-valid-session-token';
  const authApp = createApp({
    verifyToken: async (token) => token === validToken,
    rateLimitMax: 20,
    rateLimitWindowMs: 60_000,
  });

  const authServer = await new Promise<any>((resolve) => {
    const s = authApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  const authBaseUrl = `http://127.0.0.1:${authServer.address().port}`;

  try {
    const healthRes = await fetch(`${authBaseUrl}/api/health`);
    assert(healthRes.status === 200, 'GET /api/health remains public without auth (200)');

    const parseNoAuth = await fetch(`${authBaseUrl}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'resume.txt', fileContent: 'Juan Dela Cruz' }),
    });
    assert(parseNoAuth.status === 401, 'POST /api/parse-resume rejects missing Authorization header (401)');

    const extractNoAuth = await fetch(`${authBaseUrl}/api/extract-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'resume.txt', fileContent: 'Juan Dela Cruz' }),
    });
    assert(extractNoAuth.status === 401, 'POST /api/extract-resume rejects missing Authorization header (401)');

    const badScheme = await fetch(`${authBaseUrl}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic dXNlcjpwYXNz' },
      body: JSON.stringify({ fileName: 'resume.txt', fileContent: 'Juan Dela Cruz' }),
    });
    assert(badScheme.status === 401, 'POST /api/parse-resume rejects non-Bearer scheme (401)');

    const badToken = await fetch(`${authBaseUrl}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong-token' },
      body: JSON.stringify({ fileName: 'resume.txt', fileContent: 'Juan Dela Cruz' }),
    });
    assert(badToken.status === 401, 'POST /api/parse-resume rejects invalid Bearer token (401)');

    const parseAuthed = await fetch(`${authBaseUrl}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        fileName: 'juan.txt',
        fileContent: 'Juan Dela Cruz\nRoxas, Oriental Mindoro\nBS Information Technology\nSkills: React',
      }),
    });
    assert(parseAuthed.status === 200, 'POST /api/parse-resume allows valid Bearer token (200)');
    const parseBody = await parseAuthed.json();
    assert(parseBody.success === true && parseBody.extracted?.municipality === 'Roxas', 'POST /api/parse-resume returns extracted payload');

    const extractAuthed = await fetch(`${authBaseUrl}/api/extract-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        fileName: 'maria.txt',
        fileContent: 'Maria Santos\nRoxas, Oriental Mindoro\nSkills: Cashiering',
      }),
    });
    assert(extractAuthed.status === 200, 'POST /api/extract-resume allows valid Bearer token (200)');
  } finally {
    authServer.closeAllConnections?.();
    await new Promise<void>((resolve) => authServer.close(() => resolve()));
  }

  // Real default Supabase verifier rejects bogus JWT
  const defaultApp = createApp();
  const defaultServer = await new Promise<any>((resolve) => {
    const s = defaultApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const defaultPort = defaultServer.address().port;
    const bogusRes = await fetch(`http://127.0.0.1:${defaultPort}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invalid.jwt.token' },
      body: JSON.stringify({ fileName: 'test.txt', fileContent: 'test' }),
    });
    assert(bogusRes.status === 401, 'Default Supabase token verifier rejects bogus JWT (401)');
  } finally {
    defaultServer.closeAllConnections?.();
    await new Promise<void>((resolve) => defaultServer.close(() => resolve()));
  }

  // Per-IP rate limiting across both resume endpoints
  const rateApp = createApp({
    verifyToken: async (token) => token === validToken,
    rateLimitMax: 2,
    rateLimitWindowMs: 60_000,
  });
  const rateServer = await new Promise<any>((resolve) => {
    const s = rateApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const rateUrl = `http://127.0.0.1:${rateServer.address().port}`;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken}` };
    const payload = JSON.stringify({ fileName: 'a.txt', fileContent: 'Roxas' });

    const r1 = await fetch(`${rateUrl}/api/parse-resume`, { method: 'POST', headers, body: payload });
    const r2 = await fetch(`${rateUrl}/api/extract-resume`, { method: 'POST', headers, body: payload });
    const r3 = await fetch(`${rateUrl}/api/parse-resume`, { method: 'POST', headers, body: payload });

    assert(r1.status === 200 && r2.status === 200, 'First 2 requests within rate limit succeed (200)');
    assert(r3.status === 429, '3rd request from same IP returns 429 Too Many Requests');
    assert(Boolean(r3.headers.get('retry-after')), '429 response includes Retry-After header');
  } finally {
    rateServer.closeAllConnections?.();
    await new Promise<void>((resolve) => rateServer.close(() => resolve()));
  }

  const resumeParserSrc = fs.readFileSync(path.join(rootDir, 'src/utils/resumeParser.ts'), 'utf-8');
  assert(
    resumeParserSrc.includes('getSupabaseSession') && resumeParserSrc.includes('Bearer ${session.access_token}'),
    'Client resumeParser forwards Supabase Bearer token'
  );

  // 2. Finding #9b: Image/OCR sanitization preserves DOB, age, and sex when rawDocText is empty
  const ocrResult = sanitizeExtractedResumeData(
    {
      firstName: 'Maria',
      lastName: 'Santos',
      dateOfBirth: '1999-05-14',
      age: 27,
      sex: 'Female',
      primaryDegree: 'BS Tourism Management',
    },
    {},
    ''
  );
  assert(ocrResult.dateOfBirth === '1999-05-14', 'Empty rawDocText (OCR mode) preserves dateOfBirth');
  assert(ocrResult.age === 27, 'Empty rawDocText (OCR mode) preserves age');
  assert(ocrResult.sex === 'Female', 'Empty rawDocText (OCR mode) preserves sex');

  const ocrWhitespace = sanitizeExtractedResumeData(
    { firstName: 'Jose', lastName: 'Rizal', dateOfBirth: '2001-11-02', age: 24, sex: 'Male', primaryDegree: 'BSIT' },
    {},
    '   \n\t '
  );
  assert(
    ocrWhitespace.dateOfBirth === '2001-11-02' && ocrWhitespace.age === 24 && ocrWhitespace.sex === 'Male',
    'Whitespace-only rawDocText preserves OCR dateOfBirth, age, and sex'
  );

  const ocrBlankFields = sanitizeExtractedResumeData(
    { firstName: 'Ana', lastName: 'Cruz', dateOfBirth: '', age: null, sex: '', primaryDegree: 'BSBA' },
    {},
    ''
  );
  assert(
    ocrBlankFields.dateOfBirth === '' && ocrBlankFields.age === undefined && ocrBlankFields.sex === '',
    'Empty Gemini OCR fields remain blank instead of fabricated'
  );

  const textHallucination = sanitizeExtractedResumeData(
    { firstName: 'Juan', lastName: 'Dela Cruz', dateOfBirth: '1995-04-12', age: 29, sex: 'Male', primaryDegree: 'BSIT' },
    {},
    'Juan Dela Cruz. Software Developer in Roxas, Oriental Mindoro.'
  );
  assert(
    textHallucination.dateOfBirth === '' && textHallucination.age === undefined && textHallucination.sex === '',
    'Non-empty text without DOB/sex mention still strips hallucinated DOB, age, and sex'
  );

  // 3. Finding #11: Batch upsert & crypto.randomUUID() IDs
  assert(typeof saveRecords === 'function', 'saveRecords batch upsert helper is exported');
  const emptyBatch = await saveRecords(SUPABASE_TABLES.NOTIFICATIONS, []);
  assert(Array.isArray(emptyBatch) && emptyBatch.length === 0, 'saveRecords returns [] cleanly for empty input');

  const supabaseServiceSrc = fs.readFileSync(path.join(rootDir, 'src/services/supabaseService.ts'), 'utf-8');
  assert(
    supabaseServiceSrc.includes('.upsert(dedupedById, { onConflict:') &&
      !supabaseServiceSrc.match(/export async function seedDemoDataToSupabase[\s\S]*?for\s*\([^)]*\)\s*\{\s*await saveRecord/),
    'seedDemoDataToSupabase uses batch saveRecords instead of sequential per-row saveRecord loops'
  );

  const jobsContextSrc = fs.readFileSync(path.join(rootDir, 'src/context/JobsContext.tsx'), 'utf-8');
  const notifyBlock = jobsContextSrc.match(/const notifyAndCacheCandidateMatches =[\s\S]*?const updateJobVacancyStatus/)?.[0] || '';
  assert(
    !notifyBlock.includes('saveSupabaseRecord(') &&
      notifyBlock.includes('saveDocuments(SUPABASE_TABLES.CANDIDATE_MATCHES, newMatches)') &&
      notifyBlock.includes('saveDocuments(COLLECTIONS.NOTIFICATIONS, matchNotifications)'),
    'notifyAndCacheCandidateMatches batch-upserts candidate_matches and notifications'
  );

  const subNotifyBlock = jobsContextSrc.match(/const checkJobSubscriptionsAndNotify =[\s\S]*?const addJobSubscription/)?.[0] || '';
  assert(
    subNotifyBlock.includes('saveDocuments(COLLECTIONS.NOTIFICATIONS, subNotifications)') &&
      !subNotifyBlock.match(/\.forEach\([\s\S]*?saveDocument\(/),
    'checkJobSubscriptionsAndNotify batch-upserts notifications outside forEach'
  );

  const domainContextFiles = [
    'AppContext.tsx',
    'DirectoryContext.tsx',
    'JobsContext.tsx',
    'PesoLraContext.tsx',
    'ChatSocialContext.tsx',
  ];
  const domainContextCombined = domainContextFiles
    .map((f) => fs.readFileSync(path.join(rootDir, 'src/context', f), 'utf-8'))
    .join('\n');
  const dateNowIdMatches = domainContextCombined.match(/id:\s*`[^`]*\$\{[^}]*Date\.now\(\)/g) || [];
  assert(dateNowIdMatches.length === 0, `Domain contexts contain zero Date.now()-based IDs (found ${dateNowIdMatches.length})`);
  assert(domainContextCombined.includes('crypto.randomUUID()'), 'Domain contexts use crypto.randomUUID() for generated IDs');

  const uuids = new Set(Array.from({ length: 100 }, () => crypto.randomUUID()));
  assert(uuids.size === 100, 'crypto.randomUUID() produces 100 unique IDs in rapid tight loop');

  // 4. Finding #19: Memoize hasInvitedCandidate
  assert(
    /const hasInvitedCandidate = useCallback\([\s\S]*?,\s*\[invitations\]\s*\)/.test(jobsContextSrc),
    'hasInvitedCandidate is memoized with useCallback(..., [invitations]) in JobsContext'
  );
  const applicantsPageSrc = fs.readFileSync(path.join(rootDir, 'src/views/employer/EmployerApplicantsPage.tsx'), 'utf-8');
  assert(
    applicantsPageSrc.includes('hasInvitedCandidate') &&
      applicantsPageSrc.includes('[activeJob, jobSeekers, applications, candidateMatches, hasInvitedCandidate]'),
    'EmployerApplicantsPage depends on memoized hasInvitedCandidate in allCandidateEvaluations useMemo'
  );

  console.log(`\n--- WP-05 Verification Summary: ${passed}/${total} tests passed ---`);
}

run().catch((err) => {
  console.error('[CRITICAL] WP-05 verification error:', err);
  process.exit(1);
});
