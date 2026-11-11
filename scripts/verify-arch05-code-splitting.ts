import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-05: Route-Level Code-Splitting & Lazy Loading    ');
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
  // Suite 1: Static Route-Level Code Splitting in src/App.tsx
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] Static Route-Level Code Splitting in src/App.tsx');

  const appPath = path.join(rootDir, 'src/App.tsx');
  assert(fs.existsSync(appPath), 'src/App.tsx exists on disk');

  const appCode = fs.readFileSync(appPath, 'utf-8');
  assert(appCode.includes('Suspense') && appCode.includes('lazy'), 'App.tsx imports Suspense and lazy from React');
  assert(appCode.includes('RouteLoadingFallback'), 'App.tsx imports RouteLoadingFallback component');
  assert(appCode.includes('<Suspense fallback={<RouteLoadingFallback />}>'), 'App.tsx wraps views in Suspense with RouteLoadingFallback');
  assert(appCode.includes('<Suspense fallback={null}>'), 'App.tsx wraps lazy modals with Suspense fallback');

  // Admin Views Lazy Check
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
    const isLazy = new RegExp(`const\\s+${view}\\s*=\\s*(React\\.)?lazy\\(`).test(appCode);
    assert(isLazy, `Admin view ${view} is lazy-loaded with React.lazy()`);
  }

  // Employer Views Lazy Check
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
    const isLazy = new RegExp(`const\\s+${view}\\s*=\\s*(React\\.)?lazy\\(`).test(appCode);
    assert(isLazy, `Employer view ${view} is lazy-loaded with React.lazy()`);
  }

  // Seeker Views Lazy Check
  const seekerViews = [
    'SeekerDashboard',
    'SeekerApplicationsPage',
    'SeekerInterviewsPage',
    'SeekerProfilePage',
    'SeekerProfileSetupWizard'
  ];
  for (const view of seekerViews) {
    const isLazy = new RegExp(`const\\s+${view}\\s*=\\s*(React\\.)?lazy\\(`).test(appCode);
    assert(isLazy, `Seeker view ${view} is lazy-loaded with React.lazy()`);
  }

  // Public Views Eager Check
  const publicViews = ['LandingPage', 'JobSearchPage', 'JobDetailPage', 'EmployerSearchPage', 'AuthModal'];
  for (const view of publicViews) {
    assert(
      new RegExp(`import\\s+\\{[^}]*\\b${view}\\b[^}]*\\}\\s+from`).test(appCode),
      `Public view ${view} remains eagerly imported for immediate LCP`
    );
  }

  // -------------------------------------------------------------
  // Suite 2: Elimination of Static jspdf & html2canvas Imports
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] Elimination of Static jspdf & html2canvas Imports');

  function checkDirForStaticImports(dir: string): string[] {
    const violations: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        violations.push(...checkDirForStaticImports(fullPath));
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const staticImportMatch = /^import\s+.*from\s+['"](jspdf|html2canvas)['"]/m.test(fileContent);
        if (staticImportMatch) {
          violations.push(fullPath);
        }
      }
    }
    return violations;
  }

  const staticPdfViolations = checkDirForStaticImports(path.join(rootDir, 'src'));
  assert(
    staticPdfViolations.length === 0,
    'Zero static imports of jspdf or html2canvas across entire src/ directory',
    staticPdfViolations.join(', ')
  );

  const resumeExportModalPath = path.join(rootDir, 'src/components/ResumePDFExportModal.tsx');
  const resumeExportContent = fs.readFileSync(resumeExportModalPath, 'utf-8');
  assert(resumeExportContent.includes('exportElementToPdf'), 'ResumePDFExportModal delegates to exportElementToPdf');

  const resumeBuilderModalPath = path.join(rootDir, 'src/components/ResumeBuilderModal.tsx');
  const resumeBuilderContent = fs.readFileSync(resumeBuilderModalPath, 'utf-8');
  assert(resumeBuilderContent.includes('exportElementToPdf'), 'ResumeBuilderModal delegates to exportElementToPdf');

  // -------------------------------------------------------------
  // Suite 3: Lazy PDF Export Utility (src/utils/pdfExport.ts)
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 3] Lazy PDF Export Utility (src/utils/pdfExport.ts)');

  const pdfExportPath = path.join(rootDir, 'src/utils/pdfExport.ts');
  assert(fs.existsSync(pdfExportPath), 'src/utils/pdfExport.ts exists');

  const pdfExportCode = fs.readFileSync(pdfExportPath, 'utf-8');
  assert(pdfExportCode.includes('import(\'html2canvas\')'), 'pdfExport dynamically imports html2canvas');
  assert(pdfExportCode.includes('import(\'jspdf\')'), 'pdfExport dynamically imports jspdf');
  assert(pdfExportCode.includes('export async function exportElementToPdf'), 'pdfExport exports exportElementToPdf function');

  const pdfModule = await import('../src/utils/pdfExport.js').catch(() =>
    import('../src/utils/pdfExport.ts')
  );
  assert(typeof pdfModule.exportElementToPdf === 'function', 'exportElementToPdf is an async callable function');

  // Test null-element fallback without crash
  const nullResult = await pdfModule.exportElementToPdf(null as any, 'sample.pdf', { fallbackToPrint: false });
  assert(nullResult === false, 'exportElementToPdf handles missing element gracefully by returning false');

  // -------------------------------------------------------------
  // Suite 4: Route Loading Fallback Shell
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 4] Route Loading Fallback Shell (src/components/RouteLoadingFallback.tsx)');

  const fallbackPath = path.join(rootDir, 'src/components/RouteLoadingFallback.tsx');
  assert(fs.existsSync(fallbackPath), 'RouteLoadingFallback.tsx exists');

  const fallbackCode = fs.readFileSync(fallbackPath, 'utf-8');
  assert(fallbackCode.includes('role="status"'), 'RouteLoadingFallback declares role="status"');
  assert(fallbackCode.includes('aria-live="polite"'), 'RouteLoadingFallback declares aria-live="polite"');
  assert(fallbackCode.includes('sr-only'), 'RouteLoadingFallback includes screen-reader accessible announcement');
  assert(fallbackCode.includes('--color-paper-2') && fallbackCode.includes('--color-rule'), 'RouteLoadingFallback uses Hallmark paper tokens');

  const fallbackModule = await import('../src/components/RouteLoadingFallback.js').catch(() =>
    import('../src/components/RouteLoadingFallback.tsx')
  );
  assert(typeof fallbackModule.RouteLoadingFallback === 'function', 'RouteLoadingFallback is a valid React component');

  // -------------------------------------------------------------
  // Suite 5: Vite Chunk Distribution & Bundle Reduction
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 5] Vite Chunk Distribution & Bundle Reduction');

  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  const viteConfigCode = fs.readFileSync(viteConfigPath, 'utf-8');
  assert(viteConfigCode.includes('manualChunks'), 'vite.config.ts configures manualChunks');
  assert(viteConfigCode.includes('vendor-pdf'), 'vite.config.ts defines vendor-pdf chunk');
  assert(viteConfigCode.includes('vendor-charts'), 'vite.config.ts defines vendor-charts chunk');
  assert(viteConfigCode.includes('vendor-motion'), 'vite.config.ts defines vendor-motion chunk');
  assert(viteConfigCode.includes('vendor-supabase'), 'vite.config.ts defines vendor-supabase chunk');

  const distAssetsDir = path.join(rootDir, 'dist/assets');
  if (fs.existsSync(distAssetsDir)) {
    const assetFiles = fs.readdirSync(distAssetsDir);
    const hasVendorPdf = assetFiles.some(f => f.startsWith('vendor-pdf-') && f.endsWith('.js'));
    const hasVendorCharts = assetFiles.some(f => f.startsWith('vendor-charts-') && f.endsWith('.js'));
    const hasVendorMotion = assetFiles.some(f => f.startsWith('vendor-motion-') && f.endsWith('.js'));
    const hasVendorSupabase = assetFiles.some(f => f.startsWith('vendor-supabase-') && f.endsWith('.js'));
    const hasVendorReact = assetFiles.some(f => f.startsWith('vendor-react-') && f.endsWith('.js'));

    assert(hasVendorPdf, 'Production build generated dedicated vendor-pdf chunk');
    assert(hasVendorCharts, 'Production build generated dedicated vendor-charts chunk');
    assert(hasVendorMotion, 'Production build generated dedicated vendor-motion chunk');
    assert(hasVendorSupabase, 'Production build generated dedicated vendor-supabase chunk');
    assert(hasVendorReact, 'Production build generated dedicated vendor-react chunk');

    const entryChunkFile = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
    assert(Boolean(entryChunkFile), 'Entry chunk index-*.js exists in dist/assets');

    if (entryChunkFile) {
      const entryStats = fs.statSync(path.join(distAssetsDir, entryChunkFile));
      const entrySizeKb = Math.round(entryStats.size / 1024);
      console.log(`[METRICS] Initial entry bundle size: ${entrySizeKb} kB (Baseline was 2,972 kB)`);
      assert(
        entrySizeKb < 600,
        `Initial entry bundle is under 600 kB budget (actual: ${entrySizeKb} kB, >80% reduction)`
      );
    }
  } else {
    console.warn('[WARN] dist/assets directory not found; run npm run build to verify bundle sizes');
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   ARCH-05 Verification Summary: ${passedTests}/${totalTests} Passed`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Unexpected verification error:', err);
  process.exit(1);
});
