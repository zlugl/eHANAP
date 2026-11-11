import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('Testing Task 3: Route-Level Code Splitting in App.tsx...');

  const appPath = path.resolve('src/App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf8');

  // Verify Suspense import
  assert.match(appCode, /Suspense/, 'App.tsx must import and use Suspense');

  // Verify RouteLoadingFallback import
  assert.match(appCode, /RouteLoadingFallback/, 'App.tsx must import RouteLoadingFallback');

  // Verify Suspense boundary exists
  assert.match(appCode, /<Suspense\s+fallback=\{<RouteLoadingFallback/, 'App.tsx must wrap views in Suspense with RouteLoadingFallback');

  // Verify Admin views are lazy loaded
  const adminViews = [
    'AdminDashboard',
    'AdminJobsPage',
    'AdminUsersPage',
    'AdminVerificationsPage',
    'AdminReportsPage',
    'AdminAuditLogsPage',
    'AdminJobMatchingPage',
    'AdminLraPage'
  ];
  for (const view of adminViews) {
    const isLazy = new RegExp(`const\\s+${view}\\s*=\\s*(React\\.)?lazy(Named)?\\(`).test(appCode);
    assert.ok(isLazy, `Admin view ${view} must be lazy-loaded with React.lazy()`);
  }

  // Verify Employer views are lazy loaded
  const employerViews = [
    'EmployerDashboard',
    'EmployerJobsPage',
    'EmployerApplicantsPage',
    'EmployerInterviewsPage',
    'EmployerAnalyticsPage',
    'EmployerProfilePage',
    'EmployerProfileSetupWizard',
    'CreateJobModal'
  ];
  for (const view of employerViews) {
    const isLazy = new RegExp(`const\\s+${view}\\s*=\\s*(React\\.)?lazy(Named)?\\(`).test(appCode);
    assert.ok(isLazy, `Employer view ${view} must be lazy-loaded with React.lazy()`);
  }

  // Verify Seeker views are lazy loaded
  const seekerViews = [
    'SeekerDashboard',
    'SeekerApplicationsPage',
    'SeekerInterviewsPage',
    'SeekerProfilePage',
    'SeekerProfileSetupWizard'
  ];
  for (const view of seekerViews) {
    const isLazy = new RegExp(`const\\s+${view}\\s*=\\s*(React\\.)?lazy(Named)?\\(`).test(appCode);
    assert.ok(isLazy, `Seeker view ${view} must be lazy-loaded with React.lazy()`);
  }

  // Verify public views remain eagerly imported
  const publicViews = ['LandingPage', 'JobSearchPage', 'JobDetailPage', 'EmployerSearchPage'];
  for (const view of publicViews) {
    assert.match(appCode, new RegExp(`import\\s+\\{[^}]*\\b${view}\\b[^}]*\\}\\s+from`), `Public view ${view} must remain statically imported for instant guest LCP`);
  }

  console.log('Task 3 test passed!');
}

run().catch((err) => {
  console.error('Task 3 test failed as expected (RED):', err.message);
  process.exit(1);
});
