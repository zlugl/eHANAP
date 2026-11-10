import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-02: Retire Dual Persistence & Eliminate Firebase ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

async function runVerification() {
  const rootDir = path.resolve(__dirname, '..');

  // -------------------------------------------------------------
  // Suite 1: Firebase & Firestore Static Elimination
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] Firebase & Firestore Static Elimination');
  
  const firestoreServicePath = path.join(rootDir, 'src/services/firestoreService.ts');
  assert(!fs.existsSync(firestoreServicePath), 'src/services/firestoreService.ts is removed from disk');

  const firebaseLibPath = path.join(rootDir, 'src/lib/firebase.ts');
  assert(!fs.existsSync(firebaseLibPath), 'src/lib/firebase.ts is removed from disk');

  const firebaseConfigPath = path.join(rootDir, 'firebase-applet-config.json');
  assert(!fs.existsSync(firebaseConfigPath), 'firebase-applet-config.json is removed from disk');

  const firebaseBlueprintPath = path.join(rootDir, 'firebase-blueprint.json');
  assert(!fs.existsSync(firebaseBlueprintPath), 'firebase-blueprint.json is removed from disk');

  const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
  assert(!fs.existsSync(firestoreRulesPath), 'firestore.rules is removed from disk');

  // Package.json check
  const pkgJsonPath = path.join(rootDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const hasFirebaseDep = Boolean(
    (pkgJson.dependencies && pkgJson.dependencies.firebase) ||
    (pkgJson.devDependencies && pkgJson.devDependencies.firebase)
  );
  assert(!hasFirebaseDep, 'firebase package is pruned from package.json');

  // Scan src/ for any remaining firebase imports
  const srcDir = path.join(rootDir, 'src');
  function findFiles(dir: string, ext: string = '.ts'): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findFiles(fullPath, ext));
      } else if (file.endsWith(ext) || file.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allSrcFiles = findFiles(srcDir);
  let filesWithFirebaseImport: string[] = [];
  let filesWithFirestoreImport: string[] = [];

  for (const f of allSrcFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    if (/from\s+['"]firebase(\/.*)?['"]/.test(content)) {
      filesWithFirebaseImport.push(path.relative(rootDir, f));
    }
    if (/from\s+['"].*firestoreService.*['"]/.test(content)) {
      filesWithFirestoreImport.push(path.relative(rootDir, f));
    }
  }

  assert(
    filesWithFirebaseImport.length === 0,
    `Zero files in src/ import from firebase (found ${filesWithFirebaseImport.length}: ${filesWithFirebaseImport.join(', ')})`
  );
  assert(
    filesWithFirestoreImport.length === 0,
    `Zero files in src/ import from firestoreService (found ${filesWithFirestoreImport.length}: ${filesWithFirestoreImport.join(', ')})`
  );

  // -------------------------------------------------------------
  // Suite 2: Supabase OAuth & Auth Service Layer
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] Supabase OAuth & Auth Service Layer');

  let supabaseService: any = {};
  try {
    supabaseService = await import('../src/services/supabaseService');
  } catch (err: any) {
    console.error('Failed to import supabaseService:', err.message);
  }

  assert(
    typeof supabaseService.signInWithSupabaseOAuth === 'function',
    'signInWithSupabaseOAuth is exported from src/services/supabaseService.ts'
  );

  if (typeof supabaseService.signInWithSupabaseOAuth === 'function') {
    const oauthRes = await supabaseService.signInWithSupabaseOAuth('google');
    assert(oauthRes && typeof oauthRes === 'object', 'signInWithSupabaseOAuth returns an object');
    assert(Boolean(oauthRes.success), 'signInWithSupabaseOAuth succeeds in test environment');
  }

  const appContextPath = path.join(rootDir, 'src/context/AppContext.tsx');
  const appContextContent = fs.readFileSync(appContextPath, 'utf-8');

  assert(
    !appContextContent.includes("from 'firebase/auth'"),
    'AppContext.tsx does not import from firebase/auth'
  );
  assert(
    !appContextContent.includes("signInWithPopup"),
    'AppContext.tsx does not use Firebase signInWithPopup'
  );
  assert(
    appContextContent.includes('signInWithSupabaseOAuth'),
    'AppContext.tsx routes Google OAuth via signInWithSupabaseOAuth'
  );

  // -------------------------------------------------------------
  // Suite 3: Unified Supabase Persistence Architecture
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 3] Unified Supabase Persistence Architecture');

  assert(
    typeof supabaseService.COLLECTIONS === 'object' && supabaseService.COLLECTIONS !== null,
    'COLLECTIONS dictionary is exported from supabaseService.ts for backwards compatibility'
  );
  assert(
    supabaseService.COLLECTIONS?.USERS === supabaseService.SUPABASE_TABLES.USERS,
    'COLLECTIONS.USERS maps to SUPABASE_TABLES.USERS'
  );
  assert(
    supabaseService.COLLECTIONS?.JOB_POSTS === supabaseService.SUPABASE_TABLES.JOB_POSTS,
    'COLLECTIONS.JOB_POSTS maps to SUPABASE_TABLES.JOB_POSTS'
  );
  assert(
    supabaseService.COLLECTIONS?.APPLICATIONS === supabaseService.SUPABASE_TABLES.APPLICATIONS,
    'COLLECTIONS.APPLICATIONS maps to SUPABASE_TABLES.APPLICATIONS'
  );
  assert(
    supabaseService.COLLECTIONS?.EMPLOYERS === supabaseService.SUPABASE_TABLES.EMPLOYERS,
    'COLLECTIONS.EMPLOYERS maps to SUPABASE_TABLES.EMPLOYERS'
  );
  assert(
    supabaseService.COLLECTIONS?.JOB_SEEKERS === supabaseService.SUPABASE_TABLES.JOB_SEEKERS,
    'COLLECTIONS.JOB_SEEKERS maps to SUPABASE_TABLES.JOB_SEEKERS'
  );
  assert(
    supabaseService.COLLECTIONS?.CANDIDATE_MATCHES === supabaseService.SUPABASE_TABLES.CANDIDATE_MATCHES,
    'COLLECTIONS.CANDIDATE_MATCHES maps to SUPABASE_TABLES.CANDIDATE_MATCHES'
  );

  assert(
    typeof supabaseService.saveRecord === 'function',
    'saveRecord is exported from supabaseService.ts'
  );
  assert(
    typeof supabaseService.updateRecord === 'function',
    'updateRecord is exported from supabaseService.ts'
  );
  assert(
    typeof supabaseService.deleteRecord === 'function',
    'deleteRecord is exported from supabaseService.ts'
  );
  assert(
    typeof supabaseService.subscribeToSupabaseTable === 'function',
    'subscribeToSupabaseTable is exported from supabaseService.ts'
  );

  // Persistence callsites in AppContext
  assert(
    !appContextContent.includes('saveFirestoreDocument'),
    'AppContext.tsx does not call saveFirestoreDocument'
  );
  assert(
    !appContextContent.includes('deleteFirestoreDocument'),
    'AppContext.tsx does not call deleteFirestoreDocument'
  );
  assert(
    !appContextContent.includes('seedDemoDataToFirestore'),
    'AppContext.tsx does not call seedDemoDataToFirestore'
  );
  assert(
    !appContextContent.includes('subscribeToCollection'),
    'AppContext.tsx does not subscribe to Firestore collections'
  );

  // -------------------------------------------------------------
  // Suite 4: Presentation & UI Layer Decoupling
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 4] Presentation & UI Layer Decoupling');

  const navbarPath = path.join(rootDir, 'src/components/Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

  assert(
    !navbarContent.includes('isFirestoreConnected'),
    'Navbar.tsx contains 0 references to isFirestoreConnected'
  );
  assert(
    !navbarContent.includes('>Firestore<'),
    'Navbar.tsx does not render legacy Firestore badge'
  );
  assert(
    navbarContent.includes('isSupabaseConnected'),
    'Navbar.tsx checks isSupabaseConnected for active database status'
  );
  assert(
    navbarContent.includes('>Supabase<'),
    'Navbar.tsx renders Supabase status badge'
  );

  // -------------------------------------------------------------
  // Suite 5: Data Flow & Test Suite Compatibility
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 5] Data Flow & Test Suite Compatibility');

  const m3ScriptPath = path.join(rootDir, 'scripts/verify-milestone03-data-flow.ts');
  const m3Content = fs.readFileSync(m3ScriptPath, 'utf-8');

  assert(
    !m3Content.includes("from '../src/services/firestoreService'"),
    'verify-milestone03-data-flow.ts does not import from firestoreService'
  );
  assert(
    /import\s+{[^}]*COLLECTIONS[^}]*}\s+from\s+['"].*supabaseService['"]/.test(m3Content),
    'verify-milestone03-data-flow.ts imports COLLECTIONS from supabaseService'
  );

  console.log('\n================================================================');
  console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ARCH-02 Retire Dual Persistence & Eliminate Firebase is VERIFIED!\n');
    process.exit(0);
  } else {
    console.error(`❌ Verification failed: ${totalTests - passedTests} tests did not pass.\n`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
