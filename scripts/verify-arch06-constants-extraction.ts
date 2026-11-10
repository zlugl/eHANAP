import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-06: Municipal & Job Constants Extraction Suite   ');
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
  // Suite 1: src/constants/municipal.ts Exports & Values
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] Municipal Constants Module (src/constants/municipal.ts)');
  const municipalPath = path.join(rootDir, 'src/constants/municipal.ts');
  assert(fs.existsSync(municipalPath), 'src/constants/municipal.ts exists on disk');

  let municipalModule: any = {};
  try {
    municipalModule = await import('../src/constants/municipal');
  } catch (err: any) {
    console.error('Failed to import src/constants/municipal:', err.message);
  }

  assert(
    municipalModule.ROXAS_MUNICIPALITY === 'Roxas, Oriental Mindoro',
    'ROXAS_MUNICIPALITY matches "Roxas, Oriental Mindoro"'
  );

  const expectedBarangays = [
    'Bagumbayan', 'Cantil', 'Dangay', 'Happy Valley', 'Libertad',
    'Mabuhay', 'Marugdug', 'Odiong', 'Paclasan', 'San Aquilino',
    'San Isidro', 'San Jose', 'San Mariano', 'San Rafael',
    'San Vicente', 'Victoria'
  ];

  assert(
    Array.isArray(municipalModule.ROXAS_BARANGAYS),
    'ROXAS_BARANGAYS is exported as an array'
  );
  assert(
    municipalModule.ROXAS_BARANGAYS?.length === 16,
    `ROXAS_BARANGAYS contains exactly 16 barangays (found: ${municipalModule.ROXAS_BARANGAYS?.length})`
  );
  for (const brgy of expectedBarangays) {
    assert(
      municipalModule.ROXAS_BARANGAYS?.includes(brgy),
      `ROXAS_BARANGAYS includes "${brgy}"`
    );
  }

  assert(
    Array.isArray(municipalModule.ORIENTAL_MINDORO_MUNICIPALITIES),
    'ORIENTAL_MINDORO_MUNICIPALITIES is exported as an array'
  );
  assert(
    municipalModule.ORIENTAL_MINDORO_MUNICIPALITIES?.includes('Roxas'),
    'ORIENTAL_MINDORO_MUNICIPALITIES includes "Roxas"'
  );

  // -------------------------------------------------------------
  // Suite 2: src/constants/jobCategories.ts Exports & Values
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] Job Categories Module (src/constants/jobCategories.ts)');
  const jobCategoriesPath = path.join(rootDir, 'src/constants/jobCategories.ts');
  assert(fs.existsSync(jobCategoriesPath), 'src/constants/jobCategories.ts exists on disk');

  let jobCategoriesModule: any = {};
  try {
    jobCategoriesModule = await import('../src/constants/jobCategories');
  } catch (err: any) {
    console.error('Failed to import src/constants/jobCategories:', err.message);
  }

  const expectedCategories = [
    'Information Technology & Software',
    'Business, Accounting & Finance',
    'Agriculture & Agribusiness',
    'Tourism, Hotel & Restaurant',
    'Engineering & Construction',
    'Healthcare, Nursing & Medical',
    'Education & Academic Services',
    'Customer Service & Retail',
    'Government & Public Administration',
  ];

  assert(
    Array.isArray(jobCategoriesModule.JOB_CATEGORIES),
    'JOB_CATEGORIES is exported as an array'
  );
  assert(
    jobCategoriesModule.JOB_CATEGORIES?.length === 9,
    `JOB_CATEGORIES contains exactly 9 categories (found: ${jobCategoriesModule.JOB_CATEGORIES?.length})`
  );
  for (const cat of expectedCategories) {
    assert(
      jobCategoriesModule.JOB_CATEGORIES?.includes(cat),
      `JOB_CATEGORIES includes "${cat}"`
    );
  }

  // -------------------------------------------------------------
  // Suite 3: src/constants/index.ts Barrel Exports
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 3] Constants Index Barrel (src/constants/index.ts)');
  const indexPath = path.join(rootDir, 'src/constants/index.ts');
  assert(fs.existsSync(indexPath), 'src/constants/index.ts exists on disk');

  let indexModule: any = {};
  try {
    indexModule = await import('../src/constants');
  } catch (err: any) {
    console.error('Failed to import src/constants:', err.message);
  }

  assert(
    indexModule.ROXAS_MUNICIPALITY === 'Roxas, Oriental Mindoro',
    'src/constants re-exports ROXAS_MUNICIPALITY'
  );
  assert(
    Array.isArray(indexModule.ROXAS_BARANGAYS) && indexModule.ROXAS_BARANGAYS.length === 16,
    'src/constants re-exports ROXAS_BARANGAYS (16 barangays)'
  );
  assert(
    Array.isArray(indexModule.ORIENTAL_MINDORO_MUNICIPALITIES),
    'src/constants re-exports ORIENTAL_MINDORO_MUNICIPALITIES'
  );
  assert(
    Array.isArray(indexModule.JOB_CATEGORIES) && indexModule.JOB_CATEGORIES.length === 9,
    'src/constants re-exports JOB_CATEGORIES (9 categories)'
  );

  // -------------------------------------------------------------
  // Suite 4: mockData.ts Backwards-Compatibility Re-exports
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 4] mockData.ts Backwards-Compatibility Re-exports');
  const mockDataContent = fs.readFileSync(path.join(rootDir, 'src/data/mockData.ts'), 'utf-8');
  assert(
    /from\s+['"]\.\.\/constants/.test(mockDataContent),
    'src/data/mockData.ts imports constants from src/constants'
  );

  let mockDataModule: any = {};
  try {
    mockDataModule = await import('../src/data/mockData');
  } catch (err: any) {
    console.error('Failed to import src/data/mockData:', err.message);
  }

  assert(
    mockDataModule.ROXAS_MUNICIPALITY === 'Roxas, Oriental Mindoro',
    'mockData.ts preserves ROXAS_MUNICIPALITY export'
  );
  assert(
    Array.isArray(mockDataModule.ROXAS_BARANGAYS) && mockDataModule.ROXAS_BARANGAYS.length === 16,
    'mockData.ts preserves ROXAS_BARANGAYS export (16 barangays)'
  );
  assert(
    Array.isArray(mockDataModule.ORIENTAL_MINDORO_MUNICIPALITIES),
    'mockData.ts preserves ORIENTAL_MINDORO_MUNICIPALITIES export'
  );
  assert(
    Array.isArray(mockDataModule.JOB_CATEGORIES) && mockDataModule.JOB_CATEGORIES.length === 9,
    'mockData.ts preserves JOB_CATEGORIES export (9 categories)'
  );

  // -------------------------------------------------------------
  // Suite 5: resumeExtractorCore.ts Constant Deduplication
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 5] resumeExtractorCore.ts Constant Deduplication');
  const extractorContent = fs.readFileSync(path.join(rootDir, 'src/utils/resumeExtractorCore.ts'), 'utf-8');
  assert(
    /from\s+['"]\.\.\/constants/.test(extractorContent),
    'src/utils/resumeExtractorCore.ts imports ROXAS_BARANGAYS from src/constants'
  );
  assert(
    !/export\s+const\s+ROXAS_BARANGAYS\s*=\s*\[\s*['"]Bagumbayan['"]/.test(extractorContent),
    'src/utils/resumeExtractorCore.ts does not declare redundant inline ROXAS_BARANGAYS array'
  );

  // -------------------------------------------------------------
  // Suite 6: Consumer Views Decoupling & Isolation
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 6] Consumer Presentation Views & Components Decoupling');

  const consumerFiles = [
    'src/views/EmployerSearchPage.tsx',
    'src/views/JobSearchPage.tsx',
    'src/views/seeker/SeekerProfileSetupWizard.tsx',
    'src/views/seeker/ResumeUploadModal.tsx',
    'src/views/seeker/SeekerProfilePage.tsx',
    'src/views/employer/EmployerProfilePage.tsx',
    'src/views/employer/CreateJobModal.tsx',
    'src/views/employer/EmployerProfileSetupWizard.tsx',
    'src/views/admin/AdminUsersPage.tsx',
    'src/views/admin/AdminJobsPage.tsx',
    'src/views/admin/AdminDashboard.tsx',
    'src/views/admin/AdminReportsPage.tsx',
    'src/components/JobSubscriptionModal.tsx',
    'src/components/JobFilterModal.tsx',
    'src/components/Footer.tsx',
    'src/components/admin/EncodeWalkInModal.tsx',
  ];

  for (const relativePath of consumerFiles) {
    const filePath = path.join(rootDir, relativePath);
    assert(fs.existsSync(filePath), `${relativePath} exists`);
    const content = fs.readFileSync(filePath, 'utf-8');

    const importsMockData = /from\s+['"][^'"]*\/data\/mockData['"]/.test(content);
    assert(
      !importsMockData,
      `${relativePath} does NOT import from mockData`
    );

    const importsConstants = /from\s+['"][^'"]*\/constants(\/[a-zA-Z]+)?['"]/.test(content);
    assert(
      importsConstants,
      `${relativePath} imports from src/constants`
    );
  }

  // Verify that NO view files in src/views or src/components import mockData
  function scanDirForMockDataImports(dir: string): string[] {
    const violations: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        violations.push(...scanDirForMockDataImports(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        if (/from\s+['"][^'"]*\/data\/mockData['"]/.test(fileContent)) {
          violations.push(path.relative(rootDir, fullPath));
        }
      }
    }
    return violations;
  }

  const viewViolations = [
    ...scanDirForMockDataImports(path.join(rootDir, 'src/views')),
    ...scanDirForMockDataImports(path.join(rootDir, 'src/components'))
  ];

  assert(
    viewViolations.length === 0,
    `Zero presentation views or components import from mockData (found ${viewViolations.length}: ${viewViolations.join(', ')})`
  );

  console.log(`\n================================================================`);
  console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed`);
  console.log(`================================================================`);

  if (passedTests === totalTests) {
    console.log('🎉 ARCH-06 Domain & Municipal Constants Extraction is VERIFIED!\n');
  } else {
    console.error(`❌ Verification FAILED: ${totalTests - passedTests} tests did not pass.\n`);
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Unhandled error in verification suite:', err);
  process.exit(1);
});
