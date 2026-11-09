import fs from 'fs';
import path from 'path';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase';
import { 
  SUPABASE_TABLES, 
  toSnakeCase, 
  toCamelCase, 
  testSupabaseConnection 
} from '../src/services/supabaseService';
import { INITIAL_USERS, INITIAL_EMPLOYERS, INITIAL_JOB_POSTS, INITIAL_JOB_SEEKERS } from '../src/data/mockData';

console.log('--- eHANAP Phase 1 Verification Suite ---');

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

// 1. Verify SQL Migration File
const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261109000001_initial_ehanap_schema.sql');
assert(fs.existsSync(migrationPath), 'SQL Migration file exists on disk');

const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
const requiredTables = [
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
  'audit_logs'
];

for (const table of requiredTables) {
  assert(migrationSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `SQL Migration defines table: ${table}`);
}

assert(migrationSql.includes('ENABLE ROW LEVEL SECURITY'), 'SQL Migration enables Row Level Security (RLS)');
assert(migrationSql.includes('update_updated_at_column'), 'SQL Migration creates updated_at trigger function');
assert(migrationSql.includes('ALTER PUBLICATION supabase_realtime'), 'SQL Migration configures Supabase Realtime');

// 2. Verify SQL Seed File
const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql');
assert(fs.existsSync(seedPath), 'SQL Seed file exists on disk');
const seedSql = fs.readFileSync(seedPath, 'utf-8');
assert(seedSql.includes('user-peso-admin-01'), 'SQL Seed provisions PESO Admin account');
assert(seedSql.includes('emp-puregold-01'), 'SQL Seed provisions Puregold employer profile');
assert(seedSql.includes('job-puregold-cashier'), 'SQL Seed provisions Supermarket Cashier vacancy');
assert(seedSql.includes('seeker-juan-01'), 'SQL Seed provisions Juan Dela Cruz seeker profile');

// 3. Verify Supabase Client & Configuration Guards
assert(typeof isSupabaseConfigured === 'function', 'isSupabaseConfigured is exported');
assert(typeof supabase === 'object' && supabase !== null, 'Supabase client instance is instantiated');

// 4. Verify SUPABASE_TABLES Dictionary
const tableKeys = Object.keys(SUPABASE_TABLES);
assert(tableKeys.length >= 11, `SUPABASE_TABLES contains at least 11 tables (found ${tableKeys.length})`);
for (const table of requiredTables) {
  const matches = Object.values(SUPABASE_TABLES).includes(table as any);
  assert(matches, `SUPABASE_TABLES dictionary maps to: ${table}`);
}

// 5. Verify toSnakeCase and toCamelCase Bidirectional Transformers
const testEmployer = INITIAL_EMPLOYERS[0];
const snakeEmployer = toSnakeCase(testEmployer);
assert(snakeEmployer.company_name === testEmployer.companyName, 'toSnakeCase converts companyName to company_name');
assert(snakeEmployer.business_permit_no === testEmployer.businessPermitNo, 'toSnakeCase converts businessPermitNo to business_permit_no');

const roundTripEmployer = toCamelCase(snakeEmployer);
assert(roundTripEmployer.companyName === testEmployer.companyName, 'toCamelCase restores companyName');
assert(roundTripEmployer.businessPermitNo === testEmployer.businessPermitNo, 'toCamelCase restores businessPermitNo');
assert(Array.isArray(roundTripEmployer.submittedRequirements), 'toCamelCase preserves array fields');

// Test Seeker Profile with nested JSON
const testSeeker = INITIAL_JOB_SEEKERS[0];
const snakeSeeker = toSnakeCase(testSeeker);
assert(snakeSeeker.first_name === testSeeker.firstName, 'toSnakeCase converts firstName to first_name');
assert(Array.isArray(snakeSeeker.technical_skills), 'toSnakeCase preserves technical_skills array');

const roundTripSeeker = toCamelCase(snakeSeeker);
assert(roundTripSeeker.firstName === testSeeker.firstName, 'toCamelCase restores firstName');
assert(roundTripSeeker.primaryDegree === testSeeker.primaryDegree, 'toCamelCase restores primaryDegree');

// 6. Verify Offline Fallback Health Check
async function runAsyncChecks() {
  const connResult = await testSupabaseConnection();
  console.log(`[INFO] testSupabaseConnection() result:`, connResult);
  assert(typeof connResult.connected === 'boolean', 'testSupabaseConnection returns boolean connected status');
  
  console.log(`\n--- Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
  if (passedTests === totalTests) {
    console.log('Phase 1 Supabase Architecture & Client Layer VERIFIED successfully!');
  } else {
    console.error('Some tests failed. Please review.');
  }
}

runAsyncChecks().catch(err => {
  console.error('Error during async verification:', err);
  process.exit(1);
});
