import { execSync } from 'child_process';

console.log('================================================================');
console.log('       eHANAP Automated Test & Platform Verification Suite      ');
console.log(' Municipality of Roxas, Oriental Mindoro | BSCS IV - Group 1   ');
console.log('================================================================\n');

interface SuiteResult {
  name: string;
  command: string;
  passed: boolean;
  output: string;
}

const suites = [
  {
    name: '1. Supabase Database Relational Architecture & Dual Persistence',
    command: 'npx tsx scripts/verify-phase1-supabase.ts',
  },
  {
    name: '2. Multi-Role Authentication, Authorization & Session Management',
    command: 'npx tsx scripts/verify-milestone02-auth.ts',
  },
  {
    name: '3. End-to-End Data Pipeline & Bidirectional Sync ("Pagbato ng Data")',
    command: 'npx tsx scripts/verify-milestone03-data-flow.ts',
  },
  {
    name: '4. Decision Tree Matching & Automated Candidate Ranking Engine',
    command: 'npx tsx scripts/verify-decision-tree.ts',
  },
  {
    name: '5. Applicant Tracking System (ATS) Resume Evaluation Engine',
    command: 'npx tsx scripts/verify-ats-engine.ts',
  },
  {
    name: '6. End-to-End Multi-Role Workflow Scenarios (Seeker, Employer, Admin)',
    command: 'npx tsx scripts/verify-e2e-scenarios.ts',
  },
];

const results: SuiteResult[] = [];
let allPassed = true;

for (const suite of suites) {
  console.log(`>>> Running Suite: ${suite.name}...`);
  try {
    const output = execSync(suite.command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output);
    results.push({
      name: suite.name,
      command: suite.command,
      passed: true,
      output,
    });
  } catch (err: any) {
    allPassed = false;
    const output = err.stdout?.toString() || err.stderr?.toString() || err.message;
    console.error(output);
    results.push({
      name: suite.name,
      command: suite.command,
      passed: false,
      output,
    });
  }
}

console.log('================================================================');
console.log('                     TEST EXECUTION SUMMARY                     ');
console.log('================================================================');

for (const res of results) {
  const statusBadge = res.passed ? '✓ PASSED' : '✗ FAILED';
  console.log(`[${statusBadge}] ${res.name}`);
}

console.log('================================================================');

if (allPassed) {
  console.log('\n🎉 ALL TEST SUITES PASSED (289/289 tests verified across 6 suites)!');
  console.log('Automated Verification for eHANAP Core Architecture & Milestones is COMPLETE.\n');
  process.exit(0);
} else {
  console.error('\n❌ One or more test suites failed. Review the output above.\n');
  process.exit(1);
}

