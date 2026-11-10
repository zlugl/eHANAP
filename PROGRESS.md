# eHANAP — Refactoring & Architecture Progress

Tracking technical debt remediation, modularity extraction, and architectural hardening based on the production audit in [SPEC.md](SPEC.md).

---

## Baseline Verification
- **Automated Test Suite**: 424/424 tests passing across 8 verification suites (`npm test`).
- **Static Analysis**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Build**: `npm run build` bundles successfully.
- **Milestones 00–07 Status**: **COMPLETED** (Baseline, Supabase Schema, Multi-Role Auth, Data Pipeline, Candidate Ranking, PESO LRA/Analytics, UI Polish, Thesis Defense Readiness).

---

## Modularity & Structural Refactoring Roadmap (from SPEC.md)

| Priority | ID | Refactoring Work Package | Status | Target Branch | Verification |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **1** | **ARCH-03** | **Storage Unification & Profile Invariant Encapsulation**<br>- Resolve `'seeker_bookmarked_jobs'` vs `'ehanap_bookmarks'` desync bug in `JobDetailPage.tsx` and `SeekerDashboard.tsx`.<br>- Encapsulate `isProfileComplete()` predicate in `src/utils/routeGuards.ts` replacing 26+ raw callsites.<br>- Introduce typed `storageAdapter.ts`. | **COMPLETED** | `refactor/arch-03-storage-unification` | 77/77 ARCH-03 tests + 424/424 regression tests passing; 0 lint errors; clean build |
| **2** | **ARCH-06** | **Domain & Municipal Constants Extraction**<br>- Create `src/constants/municipal.ts` and `src/constants/jobCategories.ts`.<br>- Move `ROXAS_MUNICIPALITY`, `ROXAS_BARANGAYS`, and `JOB_CATEGORIES` out of `src/data/mockData.ts`.<br>- Update all 16 consumer view imports. | **COMPLETED** | `refactor/arch-06-constants-extraction` | 95/95 ARCH-06 tests + 77/77 ARCH-03 tests + 424/424 regression tests passing; 0 lint errors; clean build |
| **3** | **ARCH-02** | **Retire Dual Persistence & Eliminate Firebase**<br>- Migrate Google OAuth in `AppContext.tsx` to `supabase.auth.signInWithOAuth`.<br>- Direct all persistence operations exclusively to `supabaseService.ts`.<br>- Remove `firestoreService.ts`, `lib/firebase.ts`, and prune `firebase` package. | **PENDING** | `refactor/arch-02-retire-firebase` | Exclusive Supabase persistence; clean build without Firebase |
| **4** | **ARCH-01a**| **Context Slicing: UI Feedback & Auth**<br>- Extract `ToastContext` and `NotificationContext` from `AppContext.tsx`.<br>- Extract `AuthContext` (session, demo role switcher, login/logout).<br>- Prevent full-app re-renders on toast/notification updates. | **PENDING** | `refactor/arch-01-context-slicing` | `AppContext.tsx` reduced; isolated toast/auth testing |
| **5** | **ARCH-05** | **Route-Level Code-Splitting & Lazy Loading**<br>- Convert Admin and Employer routes to `React.lazy()` with Suspense fallbacks.<br>- Dynamic `import()` for `jspdf` and `html2canvas` in export modals. | **PENDING** | `refactor/arch-05-code-splitting` | Initial bundle size reduction; fast LCP |
| **6** | **ARCH-07** | **Centralize Decision Tree Match Resolver**<br>- Implement `getOrCalculateMatch(seeker, job, cachedMatches)`.<br>- Memoize candidate ranking rosters; eliminate pairwise loops during render. | **PENDING** | `refactor/arch-07-match-resolver` | Deterministic score consistency; 0 render lag |
| **7** | **ARCH-04** | **Mega-Component Decomposition**<br>- Split `Navbar.tsx` (1,456 lines) into role-specific navigation bars.<br>- Decompose `SeekerProfilePage.tsx` (2,905 lines) into child section tabs. | **PENDING** | `refactor/arch-04-component-decomposition` | High cohesion; zero merge-conflict hotspots |
| **8** | **ARCH-08** | **Server Controller & Service Separation**<br>- Extract PDF/DOCX extractors to `server/services/documentParser.ts`.<br>- Extract Gemini resume parser to `server/services/aiResumeService.ts`. | **PENDING** | `refactor/arch-08-server-modularization` | Standalone unit testability of prompt schemas |

---

## Refactoring Work Package Details

### Work Package 1: ARCH-03 — Storage Unification & Profile Invariant Encapsulation
- **Status:** [x] **COMPLETED**
- **Branch:** `refactor/arch-03-storage-unification`
- **Scope & Objectives Delivered:**
  1. **Centralized Storage Adapter (`src/lib/storageAdapter.ts`)**:
     - Introduced typed storage operations with namespace prefixing (`ehanap_`), safe JSON parsing/serialization, and in-memory SSR fallback.
     - Implemented automatic migration of legacy `seeker_bookmarked_jobs` bookmarks into `ehanap_bookmarks` on retrieval.
     - Exposed domain storage helpers: `getBookmarks`, `setBookmarks`, `isProfileCompletedInStorage`, `setProfileCompletedInStorage`, `removeProfileCompletedFromStorage`, `isEmployerCompletedInStorage`, `setEmployerCompletedInStorage`, `removeEmployerCompletedFromStorage`, `getStoredUsers`, `setStoredUsers`, `getStoredJobSeekers`, `setStoredJobSeekers`, `getStoredInvitations`, `setStoredInvitations`.
  2. **Profile Completion Domain Predicates (`src/utils/routeGuards.ts`)**:
     - Encapsulated `isSeekerProfileComplete(user, profile)`, `isEmployerProfileComplete(user, profile)`, and `isProfileComplete(user, profile)`.
     - Added `markProfileCompletedInStorage` and `clearProfileCompletedInStorage` to batch update and purge cached storage flags.
     - Centralized demo account rules (`poqiq75`) and admin bypass logic into pure domain predicates.
  3. **Bookmark State Synchronization**:
     - Connected `src/views/JobDetailPage.tsx` directly to `useApp()` (`bookmarkedJobIds`, `toggleBookmarkJob`, `isJobBookmarked`), retiring local component state and the conflicting `'seeker_bookmarked_jobs'` key.
     - Connected `src/views/seeker/SeekerDashboard.tsx` to `useApp()` bookmark methods, ensuring bookmarks instantly sync between job search, detail view, seeker dashboard, and bookmarks drawer.
     - Updated `src/context/AppContext.tsx` to route all bookmark hydration and persistence through `storageAdapter`.
  4. **Elimination of Leaked Storage Primitives Across Presentation Views**:
     - Migrated all raw `localStorage` calls across `src/App.tsx`, `src/components/Navbar.tsx`, `src/views/AuthModal.tsx`, `src/views/seeker/SeekerProfilePage.tsx`, `src/views/seeker/SeekerProfileSetupWizard.tsx`, `src/views/employer/EmployerProfileSetupWizard.tsx`, `src/utils/notificationUtils.ts`, and `src/context/AppContext.tsx`.
     - Zero raw `localStorage` calls remain in the presentation layer. `src/lib/storageAdapter.ts` is the single source of truth for browser storage access.
- **Verification Evidence:**
  - `npx tsx scripts/verify-arch03-storage-unification.ts`: **77/77 tests passed** across 7 test suites.
  - `npm test`: **424/424 automated test assertions passed** across 8 regression suites (501 total verified assertions).
  - `npm run lint` (`tsc --noEmit`): **0 errors**.
  - `npm run build`: **Clean production bundle created**.

---

### Work Package 2: ARCH-06 — Domain & Municipal Constants Extraction
- **Status:** [x] **COMPLETED**
- **Branch:** `refactor/arch-06-constants-extraction`
- **Scope & Objectives Delivered:**
  1. **Centralized Domain Constants Modules**:
     - Created `src/constants/municipal.ts`: Extracted `ROXAS_MUNICIPALITY`, `ROXAS_BARANGAYS` (16 official barangays), `ORIENTAL_MINDORO_MUNICIPALITIES`, `ALL_ORIENTAL_MINDORO_MUNICIPALITIES`, and `MINDORO_MUNICIPALITIES` with strongly typed TypeScript literal unions (`RoxasBarangay`, `OrientalMindoroMunicipality`).
     - Created `src/constants/jobCategories.ts`: Extracted `JOB_CATEGORIES` (9 standard industries) and typed literal union `JobCategory`.
     - Created `src/constants/index.ts`: Barrel export providing a single clean import surface for all domain and municipal invariants.
  2. **Deduplication & Mock Data Isolation**:
     - Updated `src/data/mockData.ts` to re-export `ROXAS_MUNICIPALITY`, `ROXAS_BARANGAYS`, `ORIENTAL_MINDORO_MUNICIPALITIES`, and `JOB_CATEGORIES` from `../constants` for backwards compatibility.
     - Updated `src/utils/resumeExtractorCore.ts` to import `ROXAS_BARANGAYS` and `MINDORO_MUNICIPALITIES` from `../constants`, eliminating duplicate hardcoded geographic arrays.
  3. **Presentation & View Layer Decoupling**:
     - Migrated all 16 consumer views and components away from `../data/mockData` to `src/constants`:
       - `src/views/EmployerSearchPage.tsx`
       - `src/views/JobSearchPage.tsx`
       - `src/views/seeker/SeekerProfileSetupWizard.tsx`
       - `src/views/seeker/ResumeUploadModal.tsx`
       - `src/views/seeker/SeekerProfilePage.tsx`
       - `src/views/employer/EmployerProfilePage.tsx`
       - `src/views/employer/CreateJobModal.tsx`
       - `src/views/employer/EmployerProfileSetupWizard.tsx`
       - `src/views/admin/AdminUsersPage.tsx`
       - `src/views/admin/AdminJobsPage.tsx`
       - `src/views/admin/AdminDashboard.tsx`
       - `src/views/admin/AdminReportsPage.tsx`
       - `src/components/JobSubscriptionModal.tsx`
       - `src/components/JobFilterModal.tsx`
       - `src/components/Footer.tsx`
       - `src/components/admin/EncodeWalkInModal.tsx`
     - Exactly **zero** presentation views or components import from `mockData.ts`. `mockData.ts` is now isolated strictly to seed fixtures used by offline service fallbacks.
- **Verification Evidence:**
  - `npx tsx scripts/verify-arch06-constants-extraction.ts`: **95/95 tests passed** across 6 verification suites.
  - `npx tsx scripts/verify-arch03-storage-unification.ts`: **77/77 tests passed** across 7 test suites.
  - `npm test`: **424/424 automated test assertions passed** across 8 regression suites (596 total verified assertions across suites).
  - `npm run lint` (`tsc --noEmit`): **0 errors**.
  - `npm run build`: **Clean production bundle created**.


