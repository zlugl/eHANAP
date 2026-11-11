import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-04: Mega-Component Decomposition Verification   ');
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
  // Suite 1: Navbar Decomposition & Line Count Reduction
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] Navbar Decomposition & Modular Persona Subcomponents');

  const navbarDir = path.join(rootDir, 'src/components/navbar');
  assert(fs.existsSync(navbarDir), 'src/components/navbar directory exists on disk');

  const navbarFiles = [
    'GuestNav.tsx',
    'SeekerNav.tsx',
    'EmployerNav.tsx',
    'AdminNav.tsx',
    'DemoPersonaPill.tsx',
    'UserProfileDropdown.tsx',
    'MobileRoleQuickNav.tsx',
    'MobileNavDrawer.tsx',
    'index.ts'
  ];

  for (const file of navbarFiles) {
    const filePath = path.join(navbarDir, file);
    assert(fs.existsSync(filePath), `src/components/navbar/${file} exists on disk`);
  }

  // Inspect Navbar.tsx
  const navbarPath = path.join(rootDir, 'src/components/Navbar.tsx');
  assert(fs.existsSync(navbarPath), 'src/components/Navbar.tsx exists on disk');

  const navbarCode = fs.readFileSync(navbarPath, 'utf-8');
  const navbarLines = navbarCode.split('\n').length;
  console.log(`[INFO] Current Navbar.tsx line count: ${navbarLines} (Baseline: 1,440 lines)`);
  assert(navbarLines <= 350, `Navbar.tsx line count is reduced to <= 350 lines (Current: ${navbarLines})`);

  // Verify Navbar delegates to decomposed modules
  assert(navbarCode.includes('./navbar') || navbarCode.includes('./navbar/'), 'Navbar.tsx imports from ./navbar modular directory');
  assert(navbarCode.includes('GuestNav'), 'Navbar.tsx composes GuestNav');
  assert(navbarCode.includes('SeekerNav'), 'Navbar.tsx composes SeekerNav');
  assert(navbarCode.includes('EmployerNav'), 'Navbar.tsx composes EmployerNav');
  assert(navbarCode.includes('AdminNav'), 'Navbar.tsx composes AdminNav');
  assert(navbarCode.includes('DemoPersonaPill'), 'Navbar.tsx composes DemoPersonaPill');
  assert(navbarCode.includes('UserProfileDropdown'), 'Navbar.tsx composes UserProfileDropdown');
  assert(navbarCode.includes('MobileRoleQuickNav'), 'Navbar.tsx composes MobileRoleQuickNav');
  assert(navbarCode.includes('MobileNavDrawer'), 'Navbar.tsx composes MobileNavDrawer');

  // -------------------------------------------------------------
  // Suite 2: Seeker Profile Hook & State Encapsulation
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] Reusable Seeker Profile Form Hook');

  const hookPath = path.join(rootDir, 'src/hooks/useSeekerProfileForm.ts');
  assert(fs.existsSync(hookPath), 'src/hooks/useSeekerProfileForm.ts exists on disk');

  if (fs.existsSync(hookPath)) {
    const hookCode = fs.readFileSync(hookPath, 'utf-8');
    assert(hookCode.includes('export function useSeekerProfileForm') || hookCode.includes('export const useSeekerProfileForm'), 'useSeekerProfileForm hook is exported');
    assert(hookCode.includes('firstName') && hookCode.includes('lastName'), 'Hook manages firstName and lastName state');
    assert(hookCode.includes('dateOfBirth') && hookCode.includes('civilStatus'), 'Hook manages dateOfBirth and civilStatus');
    assert(hookCode.includes('barangay') && hookCode.includes('municipality'), 'Hook manages geographic location fields');
    assert(hookCode.includes('handleAvatarFileUpload'), 'Hook exposes handleAvatarFileUpload handler');
    assert(hookCode.includes('5 * 1024 * 1024') || hookCode.includes('5MB'), 'Hook validates 5MB avatar file size constraint');
    assert(hookCode.includes('prefCategories') && hookCode.includes('prefMunicipalities'), 'Hook manages job preference states');
    assert(hookCode.includes('handleSavePersonalInfo') || hookCode.includes('savePersonalInfo'), 'Hook exposes personal info save handler');
  }

  // -------------------------------------------------------------
  // Suite 3: SeekerProfilePage Decomposition & Modularity
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 3] SeekerProfilePage Modular Sections & Specialized Modals');

  const seekerCompDir = path.join(rootDir, 'src/views/seeker/components');
  assert(fs.existsSync(seekerCompDir), 'src/views/seeker/components directory exists on disk');

  const seekerModals = [
    'SeekerProfileHeader.tsx',
    'SeekerCareerToolsGrid.tsx',
    'SeekerPersonalInfoModal.tsx',
    'SeekerRecordModals.tsx',
    'SeekerMatchReadinessModal.tsx',
    'SeekerJobPreferencesModal.tsx',
    'SeekerFullProfileOverviewModal.tsx',
    'SeekerUtilityModals.tsx',
    'SeekerBottomNav.tsx',
    'index.ts'
  ];

  for (const modalFile of seekerModals) {
    const filePath = path.join(seekerCompDir, modalFile);
    assert(fs.existsSync(filePath), `src/views/seeker/components/${modalFile} exists on disk`);
  }

  // Check section tabs under sections/
  const sectionsDir = path.join(seekerCompDir, 'sections');
  assert(fs.existsSync(sectionsDir), 'src/views/seeker/components/sections directory exists on disk');

  const tabSections = [
    'BioPersonalSection.tsx',
    'EducationSection.tsx',
    'ExperienceSection.tsx',
    'SkillsSection.tsx',
    'CertificationsSection.tsx',
    'ResumesSection.tsx'
  ];

  for (const sectionFile of tabSections) {
    const filePath = path.join(sectionsDir, sectionFile);
    assert(fs.existsSync(filePath), `src/views/seeker/components/sections/${sectionFile} exists on disk`);
  }

  // Inspect SeekerProfilePage.tsx
  const profilePagePath = path.join(rootDir, 'src/views/seeker/SeekerProfilePage.tsx');
  assert(fs.existsSync(profilePagePath), 'src/views/seeker/SeekerProfilePage.tsx exists on disk');

  const profilePageCode = fs.readFileSync(profilePagePath, 'utf-8');
  const profileLines = profilePageCode.split('\n').length;
  console.log(`[INFO] Current SeekerProfilePage.tsx line count: ${profileLines} (Baseline: 2,894 lines)`);
  assert(profileLines <= 450, `SeekerProfilePage.tsx line count is reduced to <= 450 lines (Current: ${profileLines})`);

  // Verify SeekerProfilePage delegates to decomposed modules
  assert(profilePageCode.includes('./components'), 'SeekerProfilePage.tsx imports from ./components');
  assert(profilePageCode.includes('SeekerProfileHeader'), 'SeekerProfilePage.tsx composes SeekerProfileHeader');
  assert(profilePageCode.includes('SeekerCareerToolsGrid'), 'SeekerProfilePage.tsx composes SeekerCareerToolsGrid');
  assert(profilePageCode.includes('SeekerPersonalInfoModal'), 'SeekerProfilePage.tsx composes SeekerPersonalInfoModal');
  assert(profilePageCode.includes('SeekerMatchReadinessModal'), 'SeekerProfilePage.tsx composes SeekerMatchReadinessModal');
  assert(profilePageCode.includes('SeekerJobPreferencesModal'), 'SeekerProfilePage.tsx composes SeekerJobPreferencesModal');
  assert(profilePageCode.includes('SeekerFullProfileOverviewModal'), 'SeekerProfilePage.tsx composes SeekerFullProfileOverviewModal');
  assert(profilePageCode.includes('SeekerBottomNav'), 'SeekerProfilePage.tsx composes SeekerBottomNav');

  // -------------------------------------------------------------
  // Suite 4: Barrel Exports & Static Type Integrity
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 4] Barrel Exports & Static Type Integrity');

  const navbarIndexPath = path.join(navbarDir, 'index.ts');
  if (fs.existsSync(navbarIndexPath)) {
    const navbarIndexCode = fs.readFileSync(navbarIndexPath, 'utf-8');
    assert(navbarIndexCode.includes('GuestNav'), 'Navbar barrel re-exports GuestNav');
    assert(navbarIndexCode.includes('SeekerNav'), 'Navbar barrel re-exports SeekerNav');
    assert(navbarIndexCode.includes('EmployerNav'), 'Navbar barrel re-exports EmployerNav');
    assert(navbarIndexCode.includes('AdminNav'), 'Navbar barrel re-exports AdminNav');
    assert(navbarIndexCode.includes('DemoPersonaPill'), 'Navbar barrel re-exports DemoPersonaPill');
    assert(navbarIndexCode.includes('UserProfileDropdown'), 'Navbar barrel re-exports UserProfileDropdown');
    assert(navbarIndexCode.includes('MobileRoleQuickNav'), 'Navbar barrel re-exports MobileRoleQuickNav');
    assert(navbarIndexCode.includes('MobileNavDrawer'), 'Navbar barrel re-exports MobileNavDrawer');
  }

  const seekerIndexPath = path.join(seekerCompDir, 'index.ts');
  if (fs.existsSync(seekerIndexPath)) {
    const seekerIndexCode = fs.readFileSync(seekerIndexPath, 'utf-8');
    assert(seekerIndexCode.includes('SeekerProfileHeader'), 'Seeker components barrel re-exports SeekerProfileHeader');
    assert(seekerIndexCode.includes('SeekerCareerToolsGrid'), 'Seeker components barrel re-exports SeekerCareerToolsGrid');
    assert(seekerIndexCode.includes('SeekerPersonalInfoModal'), 'Seeker components barrel re-exports SeekerPersonalInfoModal');
    assert(seekerIndexCode.includes('SeekerRecordModals') || seekerIndexCode.includes('EducationModal'), 'Seeker components barrel re-exports record modals');
    assert(seekerIndexCode.includes('SeekerMatchReadinessModal'), 'Seeker components barrel re-exports SeekerMatchReadinessModal');
    assert(seekerIndexCode.includes('SeekerJobPreferencesModal'), 'Seeker components barrel re-exports SeekerJobPreferencesModal');
    assert(seekerIndexCode.includes('SeekerFullProfileOverviewModal'), 'Seeker components barrel re-exports SeekerFullProfileOverviewModal');
    assert(seekerIndexCode.includes('SeekerBottomNav'), 'Seeker components barrel re-exports SeekerBottomNav');
  }

  // -------------------------------------------------------------
  // Suite 5: Backwards-Compatible Public Interface Preservation
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 5] Backwards-Compatible Public Interface Preservation');

  assert(navbarCode.includes('export const Navbar') || navbarCode.includes('export default Navbar'), 'Navbar exports Navbar component');
  assert(navbarCode.includes('interface NavbarProps') || navbarCode.includes('type NavbarProps'), 'Navbar defines NavbarProps contract');
  assert(navbarCode.includes('currentView') && navbarCode.includes('onNavigate') && navbarCode.includes('onOpenAuth'), 'NavbarProps retains all standard props');

  assert(profilePageCode.includes('export const SeekerProfilePage'), 'SeekerProfilePage exports SeekerProfilePage component');
  assert(profilePageCode.includes('SeekerProfilePageProps'), 'SeekerProfilePage defines SeekerProfilePageProps');

  console.log('\n================================================================');
  console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ARCH-04 Mega-Component Decomposition is VERIFIED!\n');
  } else {
    process.exitCode = 1;
  }
}

runVerification().catch(err => {
  console.error('Verification failed with uncaught exception:', err);
  process.exit(1);
});
