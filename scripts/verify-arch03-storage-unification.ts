import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { storageAdapter } from '../src/lib/storageAdapter';
import {
  isProfileComplete,
  isSeekerProfileComplete,
  isEmployerProfileComplete,
  markProfileCompletedInStorage,
  clearProfileCompletedInStorage,
} from '../src/utils/routeGuards';

console.log('================================================================');
console.log('   eHANAP ARCH-03: Storage Unification & Profile Invariant Suite ');
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

// -------------------------------------------------------------
// Suite 1: Storage Adapter Core & In-Memory Fallback
// -------------------------------------------------------------
console.log('>>> [Suite 1] Storage Adapter Core & In-Memory Fallback');

assert(typeof storageAdapter === 'object' && storageAdapter !== null, 'storageAdapter is exported as an object');
assert(typeof storageAdapter.getItem === 'function', 'storageAdapter.getItem is a function');
assert(typeof storageAdapter.setItem === 'function', 'storageAdapter.setItem is a function');
assert(typeof storageAdapter.removeItem === 'function', 'storageAdapter.removeItem is a function');

// Test getItem with fallback
const randomKey = `ehanap_test_key_${Date.now()}`;
assert(storageAdapter.getItem(randomKey, 'default_val') === 'default_val', 'getItem returns fallback value for non-existent key');

// Test setItem and getItem
storageAdapter.setItem(randomKey, { foo: 'bar', count: 42 });
const retrieved = storageAdapter.getItem(randomKey, null);
assert(Boolean(retrieved && typeof retrieved === 'object' && (retrieved as any).foo === 'bar' && (retrieved as any).count === 42), 'setItem stores and getItem retrieves JSON object correctly');

// Test removeItem
storageAdapter.removeItem(randomKey);
assert(storageAdapter.getItem(randomKey, null) === null, 'removeItem deletes stored item');

// -------------------------------------------------------------
// Suite 2: Bookmarks Storage & Legacy Migration
// -------------------------------------------------------------
console.log('\n>>> [Suite 2] Bookmarks Storage & Legacy Key Migration');

assert(typeof storageAdapter.getBookmarks === 'function', 'storageAdapter.getBookmarks is a function');
assert(typeof storageAdapter.setBookmarks === 'function', 'storageAdapter.setBookmarks is a function');

// Initial getBookmarks should return an array
const initialBookmarks = storageAdapter.getBookmarks();
assert(Array.isArray(initialBookmarks), 'getBookmarks returns an array');

// Setting bookmarks
storageAdapter.setBookmarks(['job-001', 'job-002']);
const savedBookmarks = storageAdapter.getBookmarks();
assert(savedBookmarks.includes('job-001') && savedBookmarks.includes('job-002'), 'setBookmarks persists bookmark IDs');

// Legacy migration simulation:
// If 'seeker_bookmarked_jobs' was previously in storage, getBookmarks should ingest it, merge with ehanap_bookmarks, and prune legacy key
storageAdapter.setItem('seeker_bookmarked_jobs', ['job-legacy-99', 'job-001']);
const migratedBookmarks = storageAdapter.getBookmarks();
assert(migratedBookmarks.includes('job-legacy-99') && migratedBookmarks.includes('job-001'), 'getBookmarks merges legacy seeker_bookmarked_jobs into bookmarks');
assert(storageAdapter.getItem('seeker_bookmarked_jobs', null) === null, 'Legacy seeker_bookmarked_jobs key is purged after migration');

// -------------------------------------------------------------
// Suite 3: Profile Completion Storage & Case-Insensitive Normalization
// -------------------------------------------------------------
console.log('\n>>> [Suite 3] Profile Completion Storage & Case-Insensitive Normalization');

assert(typeof storageAdapter.isProfileCompletedInStorage === 'function', 'storageAdapter.isProfileCompletedInStorage is a function');
assert(typeof storageAdapter.setProfileCompletedInStorage === 'function', 'storageAdapter.setProfileCompletedInStorage is a function');
assert(typeof storageAdapter.removeProfileCompletedFromStorage === 'function', 'storageAdapter.removeProfileCompletedFromStorage is a function');

assert(typeof storageAdapter.isEmployerCompletedInStorage === 'function', 'storageAdapter.isEmployerCompletedInStorage is a function');
assert(typeof storageAdapter.setEmployerCompletedInStorage === 'function', 'storageAdapter.setEmployerCompletedInStorage is a function');
assert(typeof storageAdapter.removeEmployerCompletedFromStorage === 'function', 'storageAdapter.removeEmployerCompletedFromStorage is a function');

// Test seeker profile completion set / check / remove
const testSeekerEmail = 'Test.Seeker@example.com';
const testSeekerId = 'seeker-test-123';

assert(!storageAdapter.isProfileCompletedInStorage(testSeekerEmail), 'Initially uncompleted seeker returns false');
storageAdapter.setProfileCompletedInStorage(testSeekerEmail, true);
assert(storageAdapter.isProfileCompletedInStorage(testSeekerEmail.toLowerCase()), 'Case-insensitive lookup for seeker email returns true');
assert(storageAdapter.isProfileCompletedInStorage(testSeekerEmail.toUpperCase()), 'Uppercase lookup for seeker email returns true');

storageAdapter.setProfileCompletedInStorage(testSeekerId, true);
assert(storageAdapter.isProfileCompletedInStorage(testSeekerId), 'Seeker ID lookup returns true');

storageAdapter.removeProfileCompletedFromStorage(testSeekerEmail);
assert(!storageAdapter.isProfileCompletedInStorage(testSeekerEmail), 'Removed seeker email returns false');

// Test employer profile completion set / check / remove
const testEmployerEmail = 'Employer.Corp@example.com';
const testEmployerId = 'employer-test-456';

assert(!storageAdapter.isEmployerCompletedInStorage(testEmployerEmail), 'Initially uncompleted employer returns false');
storageAdapter.setEmployerCompletedInStorage(testEmployerEmail, true);
assert(storageAdapter.isEmployerCompletedInStorage(testEmployerEmail.toLowerCase()), 'Case-insensitive lookup for employer email returns true');

storageAdapter.setEmployerCompletedInStorage(testEmployerId, true);
assert(storageAdapter.isEmployerCompletedInStorage(testEmployerId), 'Employer ID lookup returns true');

storageAdapter.removeEmployerCompletedFromStorage(testEmployerEmail);
assert(!storageAdapter.isEmployerCompletedInStorage(testEmployerEmail), 'Removed employer email returns false');

// -------------------------------------------------------------
// Suite 4: Entity Collections Storage (Users, JobSeekers)
// -------------------------------------------------------------
console.log('\n>>> [Suite 4] Entity Collections Storage (Users, JobSeekers)');

assert(typeof storageAdapter.getStoredUsers === 'function', 'storageAdapter.getStoredUsers is a function');
assert(typeof storageAdapter.setStoredUsers === 'function', 'storageAdapter.setStoredUsers is a function');
assert(typeof storageAdapter.getStoredJobSeekers === 'function', 'storageAdapter.getStoredJobSeekers is a function');
assert(typeof storageAdapter.setStoredJobSeekers === 'function', 'storageAdapter.setStoredJobSeekers is a function');

const dummyUsers = [{ id: 'user-01', email: 'user01@example.com', role: 'job_seeker' as const }];
storageAdapter.setStoredUsers(dummyUsers as any);
const retrievedUsers = storageAdapter.getStoredUsers([]);
assert(retrievedUsers.length === 1 && retrievedUsers[0].id === 'user-01', 'setStoredUsers and getStoredUsers round-trip successfully');

// -------------------------------------------------------------
// Suite 5: RouteGuards Profile Invariants & Predicates
// -------------------------------------------------------------
console.log('\n>>> [Suite 5] RouteGuards Profile Invariants & Predicates');

assert(typeof isProfileComplete === 'function', 'isProfileComplete is a function');
assert(typeof isSeekerProfileComplete === 'function', 'isSeekerProfileComplete is a function');
assert(typeof isEmployerProfileComplete === 'function', 'isEmployerProfileComplete is a function');
assert(typeof markProfileCompletedInStorage === 'function', 'markProfileCompletedInStorage is a function');
assert(typeof clearProfileCompletedInStorage === 'function', 'clearProfileCompletedInStorage is a function');

// Null and empty checks
assert(isProfileComplete(null, null) === false, 'isProfileComplete(null, null) is false');
assert(isSeekerProfileComplete(null, null) === false, 'isSeekerProfileComplete(null, null) is false');
assert(isEmployerProfileComplete(null, null) === false, 'isEmployerProfileComplete(null, null) is false');

// Admin users bypass profile completion requirements
const adminUser = { id: 'admin-01', role: 'admin' as const, email: 'peso.admin@roxas.gov.ph' };
assert(isProfileComplete(adminUser as any, null) === true, 'Admin users always evaluate as profile complete');

// Seeker with direct property flags
const seekerWithUserFlag = { id: 'user-seeker-01', role: 'job_seeker' as const, email: 'seeker1@gmail.com', isProfileCompleted: true };
assert(isSeekerProfileComplete(seekerWithUserFlag as any, null) === true, 'Seeker with user.isProfileCompleted evaluates as true');
assert(isProfileComplete(seekerWithUserFlag as any, null) === true, 'isProfileComplete routes seeker with user flag correctly');

const seekerWithProfileFlag = { id: 'user-seeker-02', role: 'job_seeker' as const, email: 'seeker2@gmail.com', isProfileCompleted: false };
const seekerProfileWithFlag = { id: 'seeker-prof-02', userId: 'user-seeker-02', email: 'seeker2@gmail.com', isProfileCompleted: true };
assert(isSeekerProfileComplete(seekerWithProfileFlag as any, seekerProfileWithFlag as any) === true, 'Seeker with profile.isProfileCompleted evaluates as true');

// Demo persona check (poqiq75)
const demoSeeker = { id: 'user-poqiq', role: 'job_seeker' as const, email: 'poqiq75@gmail.com' };
assert(isSeekerProfileComplete(demoSeeker as any, null) === true, 'Demo persona poqiq75 always evaluates as profile complete');

// Incomplete seeker without storage flag
const incompleteSeeker = { id: 'user-inc-01', role: 'job_seeker' as const, email: 'inc.seeker@gmail.com', isProfileCompleted: false };
const incompleteSeekerProf = { id: 'prof-inc-01', userId: 'user-inc-01', email: 'inc.seeker@gmail.com', isProfileCompleted: false };
assert(isSeekerProfileComplete(incompleteSeeker as any, incompleteSeekerProf as any) === false, 'Incomplete seeker without flags evaluates as false');

// Marking profile completed in storage
markProfileCompletedInStorage([incompleteSeeker.id, incompleteSeeker.email], 'job_seeker');
assert(isSeekerProfileComplete(incompleteSeeker as any, incompleteSeekerProf as any) === true, 'Seeker evaluates as complete after markProfileCompletedInStorage');

// Clearing profile completion from storage
clearProfileCompletedInStorage([incompleteSeeker.id, incompleteSeeker.email], 'job_seeker');
assert(isSeekerProfileComplete(incompleteSeeker as any, incompleteSeekerProf as any) === false, 'Seeker evaluates as false after clearProfileCompletedInStorage');

// Employer checks
const employerWithUserFlag = { id: 'user-emp-01', role: 'employer' as const, email: 'hr@puregold.com', isProfileCompleted: true };
assert(isEmployerProfileComplete(employerWithUserFlag as any, null) === true, 'Employer with user.isProfileCompleted evaluates as true');
assert(isProfileComplete(employerWithUserFlag as any, null) === true, 'isProfileComplete routes employer with user flag correctly');

const incompleteEmployer = { id: 'user-emp-inc', role: 'employer' as const, email: 'hr@newstore.com', isProfileCompleted: false };
const incompleteEmployerProf = { id: 'emp-prof-inc', userId: 'user-emp-inc', email: 'hr@newstore.com', isProfileCompleted: false };
assert(isEmployerProfileComplete(incompleteEmployer as any, incompleteEmployerProf as any) === false, 'Incomplete employer evaluates as false');

markProfileCompletedInStorage([incompleteEmployer.id, incompleteEmployer.email], 'employer');
assert(isEmployerProfileComplete(incompleteEmployer as any, incompleteEmployerProf as any) === true, 'Employer evaluates as complete after markProfileCompletedInStorage');

clearProfileCompletedInStorage([incompleteEmployer.id, incompleteEmployer.email], 'employer');
assert(isEmployerProfileComplete(incompleteEmployer as any, incompleteEmployerProf as any) === false, 'Employer evaluates as false after clearProfileCompletedInStorage');

// -------------------------------------------------------------
// Suite 6: Cross-Component Bookmark Synchronization
// -------------------------------------------------------------
console.log('\n>>> [Suite 6] Cross-Component Bookmark Synchronization');

const jobDetailContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/JobDetailPage.tsx'), 'utf-8');
const seekerDashboardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/seeker/SeekerDashboard.tsx'), 'utf-8');
const appContextContent = fs.readFileSync(path.resolve(process.cwd(), 'src/context/AppContext.tsx'), 'utf-8');

assert(!jobDetailContent.includes('seeker_bookmarked_jobs'), 'JobDetailPage.tsx does not use rogue seeker_bookmarked_jobs key');
assert(!jobDetailContent.includes('const [bookmarkedIds, setBookmarkedIds]'), 'JobDetailPage.tsx has retired local bookmarkedIds state in favor of AppContext');
assert(jobDetailContent.includes('toggleBookmarkJob'), 'JobDetailPage.tsx routes bookmark actions through AppContext.toggleBookmarkJob');

assert(!seekerDashboardContent.includes('seeker_bookmarked_jobs'), 'SeekerDashboard.tsx does not use rogue seeker_bookmarked_jobs key');
assert(!seekerDashboardContent.includes('const [bookmarkedIds, setBookmarkedIds]'), 'SeekerDashboard.tsx has retired local bookmarkedIds state in favor of AppContext');

assert(appContextContent.includes('storageAdapter.getBookmarks'), 'AppContext.tsx hydrates bookmarks via storageAdapter.getBookmarks');
assert(appContextContent.includes('storageAdapter.setBookmarks'), 'AppContext.tsx persists bookmarks via storageAdapter.setBookmarks');

// -------------------------------------------------------------
// Suite 7: Static Elimination of Leaked Storage Primitives in Presentation Views
// -------------------------------------------------------------
console.log('\n>>> [Suite 7] Static Elimination of Leaked Storage Primitives');

const appContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
const navbarContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Navbar.tsx'), 'utf-8');
const seekerProfileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/seeker/SeekerProfilePage.tsx'), 'utf-8');
const authModalContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/AuthModal.tsx'), 'utf-8');
const notificationUtilsContent = fs.readFileSync(path.resolve(process.cwd(), 'src/utils/notificationUtils.ts'), 'utf-8');
const seekerWizardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/seeker/SeekerProfileSetupWizard.tsx'), 'utf-8');
const employerWizardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/views/employer/EmployerProfileSetupWizard.tsx'), 'utf-8');

assert(!appContent.includes('localStorage.getItem'), 'App.tsx contains 0 raw localStorage.getItem calls');
assert(appContent.includes('isSeekerProfileComplete') && appContent.includes('isEmployerProfileComplete'), 'App.tsx uses routeGuards predicates');

assert(!navbarContent.includes('localStorage.getItem'), 'Navbar.tsx contains 0 raw localStorage.getItem calls');
assert(navbarContent.includes('isSeekerProfileComplete') && navbarContent.includes('isEmployerProfileComplete'), 'Navbar.tsx uses routeGuards predicates');

assert(!seekerProfileContent.includes('localStorage.getItem'), 'SeekerProfilePage.tsx contains 0 raw localStorage.getItem calls');
assert(seekerProfileContent.includes('isSeekerProfileComplete'), 'SeekerProfilePage.tsx uses isSeekerProfileComplete');

assert(!authModalContent.includes('localStorage.getItem'), 'AuthModal.tsx contains 0 raw localStorage.getItem calls');
assert(authModalContent.includes('isProfileComplete'), 'AuthModal.tsx uses isProfileComplete');

assert(!notificationUtilsContent.includes('localStorage.getItem'), 'notificationUtils.ts contains 0 raw localStorage.getItem calls');
assert(notificationUtilsContent.includes('isSeekerProfileComplete'), 'notificationUtils.ts uses isSeekerProfileComplete');

assert(seekerWizardContent.includes('markProfileCompletedInStorage'), 'SeekerProfileSetupWizard.tsx uses markProfileCompletedInStorage');
assert(!seekerWizardContent.includes('localStorage.setItem'), 'SeekerProfileSetupWizard.tsx has 0 raw localStorage.setItem calls');

assert(employerWizardContent.includes('markProfileCompletedInStorage'), 'EmployerProfileSetupWizard.tsx uses markProfileCompletedInStorage');
assert(!employerWizardContent.includes('localStorage.setItem'), 'EmployerProfileSetupWizard.tsx has 0 raw localStorage.setItem calls');

assert(!appContextContent.includes("localStorage.getItem('ehanap_users')"), 'AppContext.tsx hydrates users via storageAdapter');
assert(!appContextContent.includes("localStorage.getItem('ehanap_job_seekers')"), 'AppContext.tsx hydrates job seekers via storageAdapter');

// Print summary
console.log('\n================================================================');
console.log(`ARCH-03 Verification Summary: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
