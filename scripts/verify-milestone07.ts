import { execSync } from 'child_process';

console.log('================================================================');
console.log('       eHANAP Automated Test & Platform Verification Suite      ');
console.log(' Municipality of Roxas, Oriental Mindoro | BSCS IV - Group 1   ');
console.log('================================================================\n');

interface SuiteResult {
  name: string;
  command: string;
  passed: boolean;
  passedCount: number;
  totalCount: number;
  output: string;
}

function parseAssertionCounts(output: string): { passedCount: number; totalCount: number } {
  const summaryMatch = output.match(/(\d+)\s*\/\s*(\d+)\s+tests passed/i);
  if (summaryMatch) {
    return {
      passedCount: Number(summaryMatch[1]),
      totalCount: Number(summaryMatch[2]),
    };
  }
  const passLines = (output.match(/^\[PASS\]/gm) || []).length;
  const failLines = (output.match(/^\[FAIL\]/gm) || []).length;
  return { passedCount: passLines, totalCount: passLines + failLines };
}

const suites = [
  {
    name: '1. Supabase Database Relational Architecture & Dual Persistence',
    command: 'npx tsx scripts/verify-phase1-supabase.ts',
  },
  {
    name: '2. Multi-Role Authentication, Authorization & Session Management (Real AuthContext)',
    command: 'npx tsx scripts/verify-milestone02-auth.ts',
  },
  {
    name: '3. End-to-End Data Pipeline, Schema Alignment & Sync (Real AppContext)',
    command: 'npx tsx scripts/verify-milestone03-data-flow.ts',
  },
  {
    name: '4. Decision Tree Matching & Algorithm Node Evaluation',
    command: 'npx tsx scripts/verify-decision-tree.ts',
  },
  {
    name: '5. Automated Candidate Ranking & Two-Way Matching Engine (Milestone 04)',
    command: 'npx tsx scripts/verify-milestone04-candidate-ranking.ts',
  },
  {
    name: '6. PESO / LGU Admin Portal: LRA Management & Municipal Analytics (Milestone 05)',
    command: 'npx tsx scripts/verify-milestone05-peso-lra-analytics.ts',
  },
  {
    name: '7. Applicant Tracking System (ATS) Resume Evaluation Engine',
    command: 'npx tsx scripts/verify-ats-engine.ts',
  },
  {
    name: '8. End-to-End Multi-Role Workflow Scenarios (Seeker, Employer, Admin)',
    command: 'npx tsx scripts/verify-e2e-scenarios.ts',
  },
  {
    name: '9. Modular Server HTTP Routes & Resume OCR Pipeline (ARCH-08)',
    command: 'npx tsx scripts/verify-arch08-modular-server.ts',
  },
  {
    name: '10. Notifications, Status Constraints, Admin Metrics & Demo Reset (WP-04)',
    command: 'npx tsx scripts/verify-wp04.ts',
  },
  {
    name: '11. Server Hardening, OCR Fix & Batch Persistence (WP-05)',
    command: 'npx tsx scripts/verify-wp05.ts',
  },
  {
    name: '12. Domain Context Slicing & Seeker Wizard Decomposition (WP-07)',
    command: 'npx tsx scripts/verify-wp07.ts',
  },
  {
    name: '13. Supabase Schema, RLS & Payload Alignment (WP-08)',
    command: 'npx tsx scripts/verify-wp08.ts',
  },
  {
    name: '14. Auth Recovery, Employer Profile Fallback & Admin Alerts (WP-09)',
    command: 'npx tsx scripts/verify-wp09.ts',
  },
];

const results: SuiteResult[] = [];
let allPassed = true;

for (const suite of suites) {
  console.log(`>>> Running Suite: ${suite.name}...`);
  try {
    const output = execSync(suite.command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output);
    const counts = parseAssertionCounts(output);
    results.push({
      name: suite.name,
      command: suite.command,
      passed: true,
      ...counts,
      output,
    });
  } catch (err: any) {
    allPassed = false;
    const output = [err.stdout?.toString(), err.stderr?.toString()].filter(Boolean).join('\n') || err.message;
    console.error(output);
    const counts = parseAssertionCounts(output);
    results.push({
      name: suite.name,
      command: suite.command,
      passed: false,
      ...counts,
      output,
    });
  }
}

console.log('================================================================');
console.log('                     TEST EXECUTION SUMMARY                     ');
console.log('================================================================');

for (const res of results) {
  const statusBadge = res.passed ? '✓ PASSED' : '✗ FAILED';
  const countLabel = res.totalCount > 0 ? ` (${res.passedCount}/${res.totalCount})` : '';
  console.log(`[${statusBadge}] ${res.name}${countLabel}`);
}

const totalPassedCount = results.reduce((sum, r) => sum + r.passedCount, 0);
const totalTestCount = results.reduce((sum, r) => sum + r.totalCount, 0);

console.log('================================================================');

if (allPassed) {
  console.log(`\n🎉 ALL TEST SUITES PASSED (${totalPassedCount}/${totalTestCount} tests verified across ${results.length} suites)!`);
  console.log('Automated Verification for eHANAP Core Architecture & Milestones is COMPLETE.\n');
  process.exit(0);
} else {
  console.error(`\n❌ One or more test suites failed (${totalPassedCount}/${totalTestCount} tests passed across ${results.length} suites). Review the output above.\n`);
  process.exit(1);
}
