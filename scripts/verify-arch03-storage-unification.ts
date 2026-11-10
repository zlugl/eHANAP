import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { storageAdapter } from '../src/lib/storageAdapter';

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

// Print summary
console.log('\n================================================================');
console.log(`ARCH-03 Task 1 Verification Summary: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
