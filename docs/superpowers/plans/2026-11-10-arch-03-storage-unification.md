# ARCH-03: Storage Unification & Profile Invariant Encapsulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the split-key bookmark desynchronization bug and encapsulate profile completion checks across the application into a typed storage adapter and pure domain predicate.

**Architecture:** Create a centralized `storageAdapter` in `src/lib/storageAdapter.ts` with typed keys, namespace prefixing, safe serialization, and SSR resilience. Encapsulate profile completion invariants in `src/utils/routeGuards.ts` (`isProfileComplete`, `isSeekerProfileComplete`, `isEmployerProfileComplete`), and connect `JobDetailPage` and `SeekerDashboard` directly to `AppContext` bookmark state while retiring rogue `seeker_bookmarked_jobs` storage keys.

**Tech Stack:** TypeScript, React 19, Vitest / TSX test verification script, Web Storage API.

**Spec:** [SPEC.md](file:///home/keil/eHANAP/SPEC.md#L76-L91) (ARCH-03: Fragmented & Desynchronized LocalStorage State)

## Global Constraints

- **Scope Limit**: Implement only ARCH-03 (Work Package 1). Do not touch unrelated features or modify mathematical decision-tree weightings.
- **Verification Rule**: Pass `npm run lint` (`tsc --noEmit`) with 0 errors.
- **Regression Invariant**: All 424 existing automated test assertions across 8 suites (`npm test`) must pass with 0 regressions.
- **Bookmark Source of Truth**: Job bookmark state must be unified behind `ehanap_bookmarks` (`string[]`), accessible across `JobSearchPage`, `JobDetailPage`, `SeekerDashboard`, `SeekerBookmarksModal`, and `SettingsModal`.
- **SSR / Headless Resilience**: Any storage operation must safely handle `typeof window === 'undefined'` or storage quota / privacy exceptions without throwing.

## Review Focus

1. **Rogue key backward compatibility / migration**: Users who previously saved bookmarks under `seeker_bookmarked_jobs` must have their bookmarks migrated automatically into `ehanap_bookmarks` on first load rather than lost.
2. **Case-insensitive email resolution**: Profile completion lookups by email (e.g. `poqiq75@gmail.com` vs `POQIQ75@GMAIL.COM`) must normalize casing consistently before checking storage or identifiers.
3. **Admin role bypass**: Administrative accounts (`role === 'admin'`) must always evaluate as profile-complete without checking seeker/employer profile completion flags or localStorage.
4. **New user registration purity**: Newly registered accounts must have `isProfileCompleted === false` and any stale cached completion keys for their identifier pruned immediately.
5. **Storage quota or privacy mode exception handling**: In environments where `localStorage` throws (e.g. private browsing or disabled cookies), fallback gracefully in-memory without throwing unhandled exceptions.

---

### Task 1: Centralized Storage Adapter (`src/lib/storageAdapter.ts`)

**Files:**
- Create: `src/lib/storageAdapter.ts`
- Test: `scripts/verify-arch03-storage-unification.ts`

**Interfaces:**
- Consumes: `User`, `JobSeeker`, `Employer`, `EmployerInvitation` from `src/types.ts`
- Produces: `storageAdapter` singleton and helper methods:
  - `storageAdapter.getItem<T>(key: string, fallback: T): T`
  - `storageAdapter.setItem<T>(key: string, value: T): void`
  - `storageAdapter.removeItem(key: string): void`
  - `storageAdapter.getBookmarks(): string[]`
  - `storageAdapter.setBookmarks(ids: string[]): void`
  - `storageAdapter.isProfileCompletedInStorage(idOrEmail: string): boolean`
  - `storageAdapter.setProfileCompletedInStorage(idOrEmail: string, completed?: boolean): void`
  - `storageAdapter.removeProfileCompletedFromStorage(idOrEmail: string): void`
  - `storageAdapter.isEmployerCompletedInStorage(idOrEmail: string): boolean`
  - `storageAdapter.setEmployerCompletedInStorage(idOrEmail: string, completed?: boolean): void`
  - `storageAdapter.removeEmployerCompletedFromStorage(idOrEmail: string): void`
  - `storageAdapter.getStoredUsers(fallback?: User[]): User[]`
  - `storageAdapter.setStoredUsers(users: User[]): void`
  - `storageAdapter.getStoredJobSeekers(fallback?: JobSeeker[]): JobSeeker[]`
  - `storageAdapter.setStoredJobSeekers(seekers: JobSeeker[]): void`

- [ ] **Step 1: Write the failing test for `storageAdapter`**

Create `scripts/verify-arch03-storage-unification.ts` with test suites verifying:
1. `storageAdapter` safe fallback when localStorage is unavailable or empty.
2. `getBookmarks()` retrieves `ehanap_bookmarks` and automatically migrates legacy `seeker_bookmarked_jobs` if present.
3. `setBookmarks()` safely saves string array without throwing.
4. `isProfileCompletedInStorage` and `isEmployerCompletedInStorage` normalize identifiers and read boolean values.
5. `setProfileCompletedInStorage` and `removeProfileCompletedFromStorage` properly update/remove storage entries.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: FAIL with "Cannot find module '../src/lib/storageAdapter'"

- [ ] **Step 3: Implement `src/lib/storageAdapter.ts`**

Implement `storageAdapter` object with:
- `isAvailable()` checking `typeof window !== 'undefined' && Boolean(window.localStorage)`.
- In-memory memory-map fallback for non-browser / test / SSR environments.
- Typed constants for keys: `ehanap_bookmarks`, `ehanap_users`, `ehanap_job_seekers`, `ehanap_invitations`.
- Prefix builders: `ehanap_profile_completed_${id.toLowerCase()}` and `ehanap_employer_completed_${id.toLowerCase()}`.
- Legacy migration: in `getBookmarks()`, if `seeker_bookmarked_jobs` is present, parse it, merge unique IDs with `ehanap_bookmarks`, persist to `ehanap_bookmarks`, and remove `seeker_bookmarked_jobs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: PASS Task 1 test assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storageAdapter.ts scripts/verify-arch03-storage-unification.ts
git commit -m "feat(storage): implement centralized typed storage adapter with legacy bookmark migration"
```

---

### Task 2: Profile Completion Domain Predicate (`src/utils/routeGuards.ts`)

**Files:**
- Modify: `src/utils/routeGuards.ts`
- Test: `scripts/verify-arch03-storage-unification.ts`

**Interfaces:**
- Consumes: `storageAdapter` from `src/lib/storageAdapter.ts`, `User`, `JobSeeker`, `Employer` from `src/types.ts`
- Produces:
  - `isSeekerProfileComplete(user?: User | null, profile?: JobSeeker | null): boolean`
  - `isEmployerProfileComplete(user?: User | null, profile?: Employer | null): boolean`
  - `isProfileComplete(user?: User | null, profile?: JobSeeker | Employer | null): boolean`
  - `markProfileCompletedInStorage(identifiers: (string | undefined | null)[], role: 'job_seeker' | 'employer'): void`
  - `clearProfileCompletedInStorage(identifiers: (string | undefined | null)[], role: 'job_seeker' | 'employer'): void`

- [ ] **Step 1: Write the failing test for `routeGuards.ts` profile completion predicates**

Add assertions to `scripts/verify-arch03-storage-unification.ts`:
1. `isProfileComplete(null, null)` returns `false`.
2. Admin user (`role === 'admin'`) always returns `true`.
3. Job seeker with `user.isProfileCompleted === true` returns `true`.
4. Job seeker with `profile.isProfileCompleted === true` returns `true`.
5. Seeker with demo email `poqiq75@gmail.com` returns `true`.
6. Seeker with storage key set via `markProfileCompletedInStorage` returns `true`.
7. Incomplete seeker with no flags returns `false`.
8. Employer with `user.isProfileCompleted === true` returns `true`.
9. Employer with `profile.isProfileCompleted === true` returns `true`.
10. Employer with storage key set returns `true`.
11. `clearProfileCompletedInStorage` removes flags and subsequent check returns `false`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: FAIL with "isProfileComplete is not a function"

- [ ] **Step 3: Implement profile completion predicates in `src/utils/routeGuards.ts`**

Export `isSeekerProfileComplete`, `isEmployerProfileComplete`, `isProfileComplete`, `markProfileCompletedInStorage`, and `clearProfileCompletedInStorage` in `src/utils/routeGuards.ts`:
- Check direct object property `isProfileCompleted === true`.
- Check demo persona identity (`poqiq75`).
- Query `storageAdapter.isProfileCompletedInStorage` / `storageAdapter.isEmployerCompletedInStorage` using user id, profile id, user email, and profile email.
- Batch multiple identifiers in `markProfileCompletedInStorage` and `clearProfileCompletedInStorage`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: PASS Task 2 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/utils/routeGuards.ts scripts/verify-arch03-storage-unification.ts
git commit -m "feat(auth): encapsulate profile completion predicates and storage sync in routeGuards"
```

---

### Task 3: Unify Bookmark State Across JobDetailPage & SeekerDashboard

**Files:**
- Modify: `src/views/JobDetailPage.tsx`
- Modify: `src/views/seeker/SeekerDashboard.tsx`
- Modify: `src/context/AppContext.tsx`
- Test: `scripts/verify-arch03-storage-unification.ts`

**Interfaces:**
- Consumes: `useApp()` (`bookmarkedJobIds`, `toggleBookmarkJob`, `isJobBookmarked`, `showToast`)
- Produces: Fully synchronized bookmark state across `JobDetailPage`, `SeekerDashboard`, `JobSearchPage`, and `SeekerBookmarksModal`.

- [ ] **Step 1: Write verification test for cross-component bookmark synchronization**

Add verification in `scripts/verify-arch03-storage-unification.ts` asserting:
1. `JobDetailPage.tsx` has 0 occurrences of `'seeker_bookmarked_jobs'`.
2. `SeekerDashboard.tsx` has 0 occurrences of `'seeker_bookmarked_jobs'`.
3. `AppContext.tsx` bookmarks persistence uses `storageAdapter.getBookmarks()` and `storageAdapter.setBookmarks()`.
4. Bookmarking a job in one view immediately reflects in `bookmarkedJobIds` and `isJobBookmarked`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: FAIL indicating rogue key still exists in presentation components.

- [ ] **Step 3: Refactor `JobDetailPage.tsx` and `SeekerDashboard.tsx`**

1. In `src/views/JobDetailPage.tsx`:
   - Remove local `useState` for `bookmarkedIds` and direct `localStorage` read/write.
   - Destructure `bookmarkedJobIds`, `toggleBookmarkJob`, `isJobBookmarked` from `useApp()`.
   - Update `toggleBookmark`: call `toggleBookmarkJob(jobId)` and `showToast`.
   - Update bookmark icon/state checks to use `isJobBookmarked(jobId)` or `bookmarkedJobIds.includes(jobId)`.
2. In `src/views/seeker/SeekerDashboard.tsx`:
   - Destructure `bookmarkedJobIds`, `toggleBookmarkJob`, `isJobBookmarked` from `useApp()`.
   - Remove local `useState` for `bookmarkedIds` (lines 111–119) and `localStorage` writes (line 225).
   - In `toggleBookmark(jobId, jobTitle, e)`: call `toggleBookmarkJob(jobId)` and `showToast`.
   - Update cards and modal to use `isJobBookmarked(job.id)` or `bookmarkedJobIds.includes(...)`.
3. In `src/context/AppContext.tsx`:
   - Replace direct `localStorage.getItem('ehanap_bookmarks')` with `storageAdapter.getBookmarks()`.
   - Replace direct `localStorage.setItem('ehanap_bookmarks')` with `storageAdapter.setBookmarks(bookmarkedJobIds)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: PASS Task 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/views/JobDetailPage.tsx src/views/seeker/SeekerDashboard.tsx src/context/AppContext.tsx scripts/verify-arch03-storage-unification.ts
git commit -m "refactor(bookmarks): unify job bookmarking through AppContext and retire rogue storage keys"
```

---

### Task 4: Migrate Profile Completion Callsites to `isProfileComplete` & `storageAdapter`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/views/AuthModal.tsx`
- Modify: `src/views/seeker/SeekerProfilePage.tsx`
- Modify: `src/views/seeker/SeekerProfileSetupWizard.tsx`
- Modify: `src/views/employer/EmployerProfileSetupWizard.tsx`
- Modify: `src/utils/notificationUtils.ts`
- Modify: `src/context/AppContext.tsx`
- Test: `scripts/verify-arch03-storage-unification.ts`

**Interfaces:**
- Consumes: `isProfileComplete`, `isSeekerProfileComplete`, `isEmployerProfileComplete`, `markProfileCompletedInStorage`, `clearProfileCompletedInStorage` from `src/utils/routeGuards.ts`, and `storageAdapter` from `src/lib/storageAdapter.ts`.
- Produces: 0 raw `localStorage.getItem` / `setItem` calls in presentation views; single source of truth for profile completion.

- [ ] **Step 1: Write static assertion test scanning for unencapsulated profile completion checks**

Add a static check in `scripts/verify-arch03-storage-unification.ts` verifying:
1. `src/App.tsx` contains 0 raw `localStorage.getItem('ehanap_profile_completed_` calls.
2. `src/components/Navbar.tsx` contains 0 raw `localStorage.getItem` calls.
3. `src/views/seeker/SeekerProfilePage.tsx` contains 0 raw `localStorage.getItem` calls.
4. `src/views/AuthModal.tsx` contains 0 raw `localStorage.getItem` calls.
5. `src/utils/notificationUtils.ts` contains 0 raw `localStorage.getItem` calls.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: FAIL with list of unencapsulated call sites.

- [ ] **Step 3: Replace call sites with domain predicates and storage adapter**

1. In `src/App.tsx`:
   - Replace lines 130–165 with `isSeekerProfileComplete(currentUser, currentSeekerProfile)` and `isEmployerProfileComplete(currentUser, currentEmployerProfile)`.
   - Replace lines 180–215 with `isSeekerProfileComplete` and `isEmployerProfileComplete`.
   - Replace lines 486–520 with `isSeekerProfileComplete` and `isEmployerProfileComplete`.
2. In `src/components/Navbar.tsx`:
   - Replace lines 75–92 with `isSeekerProfileComplete(currentUser, currentSeekerProfile)` and `isEmployerProfileComplete(currentUser, currentEmployerProfile)`.
3. In `src/views/AuthModal.tsx`:
   - Replace lines 360–366 with `isProfileComplete(res.user, res.user.role === 'job_seeker' ? res.seekerProfile : res.employerProfile)`.
4. In `src/views/seeker/SeekerProfilePage.tsx`:
   - Replace lines 270–281 with `isSeekerProfileComplete(currentUser, currentSeekerProfile)`.
5. In `src/views/seeker/SeekerProfileSetupWizard.tsx`:
   - Replace lines 518–531 with `markProfileCompletedInStorage([currentUser?.id, currentUser?.email, email, seekerId], 'job_seeker')`.
6. In `src/views/employer/EmployerProfileSetupWizard.tsx`:
   - Replace lines 252–265 with `markProfileCompletedInStorage([currentUser?.id, currentUser?.email, email, currentEmployerProfile?.id], 'employer')`.
7. In `src/utils/notificationUtils.ts`:
   - Replace lines 89–98 with `isSeekerProfileComplete(currentUser, seekerProfile)`.
8. In `src/context/AppContext.tsx`:
   - Replace raw storage calls for `ehanap_users`, `ehanap_job_seekers` with `storageAdapter`.
   - Replace profile completion checks and saves in `login`, `register`, `updateJobSeekerProfile`, and `updateEmployerProfile` with `isProfileComplete`, `markProfileCompletedInStorage`, and `clearProfileCompletedInStorage`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: PASS Task 4 static and unit assertions.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Navbar.tsx src/views/AuthModal.tsx src/views/seeker/SeekerProfilePage.tsx src/views/seeker/SeekerProfileSetupWizard.tsx src/views/employer/EmployerProfileSetupWizard.tsx src/utils/notificationUtils.ts src/context/AppContext.tsx scripts/verify-arch03-storage-unification.ts
git commit -m "refactor(auth): migrate all profile completion checks to routeGuards and storageAdapter"
```

---

### Task 5: Full Regression & Static Analysis Verification

**Files:**
- Modify: `PROGRESS.md`
- Test: `npm test`, `npm run lint`, `npm run build`

**Interfaces:**
- Consumes: Complete project codebase
- Produces: Verified technical debt remediation for ARCH-03 with updated progress documentation.

- [ ] **Step 1: Run dedicated ARCH-03 verification script**

Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
Expected: ALL assertions pass.

- [ ] **Step 2: Run full regression test suite**

Run: `npm test`
Expected: 424/424 existing automated test assertions pass across all 8 suites with 0 regressions.

- [ ] **Step 3: Run TypeScript static analysis**

Run: `npm run lint` (`tsc --noEmit`)
Expected: 0 errors.

- [ ] **Step 4: Run production Vite build**

Run: `npm run build`
Expected: Clean production bundle build with 0 missing imports or circular dependencies.

- [ ] **Step 5: Update PROGRESS.md and Commit**

Update `PROGRESS.md` marking Priority 1 (ARCH-03) as **COMPLETED** with deliverable verification evidence.
```bash
git add PROGRESS.md
git commit -m "docs: mark ARCH-03 storage unification and profile invariant encapsulation as completed"
```
