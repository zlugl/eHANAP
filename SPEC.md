# Production Architecture & Code Smell Audit - eHANAP
**Audited commit/date:** 2026-11-10 (Commit: `cf9cabf`)
**Overall Architectural Health:** 🟠 Significant Architectural Problems

## Executive Summary
eHANAP possesses well-isolated, deterministic domain logic (`decisionTree.ts`, `atsEngine.ts`) with 424 automated verification tests passing, but suffers from severe architectural concentration in its application and presentation layers. The central bottleneck is a 3,156-line monolithic `AppContext.tsx` on which 48 of 55 source files (87%) directly depend, coupling UI components to 25 distinct state slices, dual-database writes, and demo switching. A high-risk split-brain persistence mechanism writes concurrently to both Supabase PostgreSQL and Firebase Firestore with leaked infrastructure primitives, while over 65 uncoordinated `localStorage` calls cause active state desynchronization (notably between job detail bookmarks and seeker dashboard bookmarks). Furthermore, massive God Views (e.g., `SeekerProfilePage.tsx` at 2,905 lines and `Navbar.tsx` at 1,456 lines) and zero route-level code splitting create significant merge-conflict bottlenecks and runtime overhead. The highest-value refactoring is slicing `AppContext` into focused domain contexts (Auth, Notifications/Toasts, Jobs, Seekers) alongside unifying browser storage behind a centralized adapter.

---

## Architecture & Boundaries at a Glance
```text
[ CODE MODULE STRUCTURE ]                         [ ACTUAL RUNTIME TOPOLOGY ]
src/App.tsx (25 views bundled statically)         Browser Client (Single Monolithic Bundle)
  │                                                  │
  ├──► src/context/AppContext.tsx (God Context)      ├──► React Virtual DOM (48 files re-render on any state tick)
  │      ├── Auth, OTP, Demo Switcher                ├──► localStorage (65+ scattered calls, desynced keys)
  │      ├── Dual-Persistence Sync Logic             ├──► Supabase Cloud API (PostgreSQL + RLS + Realtime)
  │      ├── 25 Entity State Slices                  ├──► Firebase Firestore API (Dual-write split brain)
  │      └── Decision Tree / ATS Orchestration       └──► Firebase Auth (Google OAuth popup bypass)
  │                                                  │
  ├──► src/views/ & src/components/                  │ (HTTP JSON POST /api/resume/parse)
  │      └── Pairwise Decision Tree (Render Loop)    ▼
  │                                               Node.js Backend (server.ts - 459 lines)
  └──► src/utils/ (Pure Domain Core)                 ├── Express HTTP Server + Vite Dev Middleware
         ├── decisionTree.ts (Pure node scoring)     ├── Mammoth DOCX & pdf-parse Buffer Extractors
         └── atsEngine.ts (Keyword / layout rules)   └── Google GenAI SDK (Gemini 3.8 Flash + Circuit Breaker)
```

| Architectural Boundary | Current Responsibility | Boundary Quality | Main Structural Concern |
| :--- | :--- | :--- | :--- |
| **Presentation / Views** (`src/views/*`, `src/components/*`) | Multi-role dashboards, forms, editorial Hallmark UI | **Leaky / Bloated** | Mega-views (`SeekerProfilePage` 2,905 lines, `Navbar` 1,456 lines); re-evaluates pairwise Decision Tree in render loops |
| **Routing & Shell** (`src/App.tsx`) | Role guards, profile completion gates, navigation | **Leaky** | Static imports of all 25 views; directly inspects raw `localStorage` for profile completion flags |
| **Application / State** (`src/context/AppContext.tsx`) | Global state, auth, data sync, domain orchestration | **Absent (God Context)** | 3,156 lines, 25 state slices, 40+ methods; 48 of 55 source files (87%) depend directly upon it |
| **Domain Core** (`src/utils/decisionTree.ts`, `atsEngine.ts`) | Decision Tree classification, ATS evaluation | **Clear** | Well-isolated pure functions, deterministic, zero DOM/network coupling, 100% testable |
| **Data Access** (`src/services/*`, `src/lib/*`) | Supabase & Firestore persistence, transformers | **Leaky / Split-Brain** | Dual persistence writes simultaneously to Supabase and Firestore; auth and database primitives mixed in single files |
| **Infrastructure / Server** (`server.ts`) | Express API, Vite middleware, document parsing, AI | **Leaky** | Single 459-line server file mixes HTTP lifecycle, Vite middleware, binary document parsing, and Gemini prompt templates |

---

## 🔥 Top Architecture Smells

### 1. Monolithic Global Context as Universal State & Business Hub
- **ID:** ARCH-01 | **Class:** `GOD_MODULE` / `LOW_COHESION` / `HIGH_COUPLING` | **Severity:** 🔴 Critical | **Status:** `CURRENT`
- **Blast Radius:** High | **Confidence:** High
- **Location & Evidence:** `src/context/AppContext.tsx` (Lines 1–3,156; 3,156 lines total). Consumed directly by 48 out of 55 source files (87% of repository files import `useApp`).
- **Responsibility Analysis:** `AppContext` currently owns 25 state variables (`users`, `employers`, `jobSeekers`, `jobPosts`, `applications`, `interviews`, `notifications`, `auditLogs`, `announcements`, `jobSubscriptions`, `referralSlips`, `localRecruitmentActivities`, `activeToast`, `conversations`, `chatMessages`, `companyReviews`, `profileViews`, `invitations`, etc.), multi-backend database dual-persistence, Supabase/Firebase authentication, OTP generation, demo persona switching, ATS resume scoring, Decision Tree recalculation, and UI toast timers.
- **Why This Is a Smell & Consequence:**
  - *Re-render cascade:* Any state change in the application (e.g., dismissing a toast, marking a single notification as read, typing into a chat message input) triggers context updates that force re-rendering across 48 consumer components.
  - *Zero isolation & high blast radius:* Modifying logic for chat or referral slips risks introducing unintended regressions into candidate ranking, job application workflows, or employer verification.
  - *Blocks isolated testing:* Independent views cannot be mounted or tested in isolation without mocking the entire 3,156-line context state interface.
- **Incremental Refactoring Plan:**
  1. *Step 1: Extract UI Feedback Context:* Move `activeToast`, `showToast`, `dismissToast`, and notification read/unread handlers into an isolated `ToastContext` and `NotificationContext`.
  2. *Step 2: Extract Auth & Session Context:* Move user session, demo switcher, and login/logout methods into a dedicated `AuthContext` (`currentUser`, `currentRole`, `switchDemoRole`).
  3. *Step 3: Extract Domain State Stores:* Split entity collections into domain-specific contexts (`JobPostContext`, `ApplicationContext`, `EmployerContext`, `SeekerContext`).
- **Trade-off:** Requires wrapping the application root with composite/nested providers and updating consumer import statements.

---

### 2. Split-Brain Dual Persistence & Leaked Firebase Dependencies
- **ID:** ARCH-02 | **Class:** `DEPLOYMENT_COUPLING` / `LEAKED_INFRASTRUCTURE` / `SHARED_STATE` | **Severity:** 🔴 Critical | **Status:** `REMEDIATED` (Work Package 3)
- **Blast Radius:** High | **Confidence:** High
- **Location & Evidence:** `src/context/AppContext.tsx:98-118`, `src/services/firestoreService.ts` (Lines 1–265), `src/lib/firebase.ts` (Lines 1–25), `package.json:28` (`firebase: ^12.17.1`).
- **Responsibility Analysis:** While the academic thesis directive mandated migrating cleanly to Supabase (PostgreSQL), `saveDocument` and `deleteDocument` in `AppContext.tsx` execute dual-writes to both Supabase and Firestore simultaneously. In addition, Google OAuth in `AppContext.tsx:947-1139` authenticates against Firebase (`firebase/auth`) rather than Supabase Auth.
- **Why This Is a Smell & Consequence:**
  - *Silent data divergence (split brain):* Writes to Supabase and Firestore occur without distributed transaction guarantees. If network connectivity fails intermittently, records diverge between databases.
  - *Bundle bloat & deployment friction:* Production bundles retain the full Firebase client library (~250KB minified/gzipped) alongside `@supabase/supabase-js`.
  - *Direct thesis violation:* Exposes the project to panel critique regarding incomplete database migration.
- **Incremental Refactoring Plan:**
  1. *Step 1: Migrate Google OAuth to Supabase:* Replace `signInWithPopup(auth, GoogleAuthProvider)` with `supabase.auth.signInWithOAuth({ provider: 'google' })`.
  2. *Step 2: Isolate and Deprecate Dual-Persistence Writes:* Transition `saveDocument` to write exclusively to `supabaseService.ts`, isolating Firestore writes behind an explicit opt-in legacy flag.
  3. *Step 3: Remove Firebase SDK:* Delete `src/services/firestoreService.ts`, `src/lib/firebase.ts`, and prune `firebase` from `package.json`.
- **Trade-off:** Requires establishing the Google OAuth client credentials in the Supabase Cloud dashboard.

---

### 3. Fragmented & Desynchronized LocalStorage State (Leaked Infrastructure)
- **ID:** ARCH-03 | **Class:** `SHARED_STATE` / `LEAKED_INFRASTRUCTURE` / `CHANGE_AMPLIFICATION` | **Severity:** 🟠 High | **Status:** `CURRENT`
- **Blast Radius:** High | **Confidence:** High
- **Location & Evidence:** Over 65 uncoordinated `localStorage.getItem` / `localStorage.setItem` calls across 11 files (`src/App.tsx:136, 156, 186, 206, 492, 515`, `src/context/AppContext.tsx:231, 254, 284, 544, 578, 679, 853, 976, 1866, 1978, 2607`, `src/views/JobDetailPage.tsx:16, 28`, `src/views/seeker/SeekerDashboard.tsx:114, 225`, `src/views/seeker/SeekerProfilePage.tsx:275-278`, `src/views/seeker/SeekerProfileSetupWizard.tsx:520-529`, `src/views/employer/EmployerProfileSetupWizard.tsx:254-263`, `src/views/AuthModal.tsx:363-364`, `src/components/Navbar.tsx:80-90`, `src/utils/notificationUtils.ts:95-96`).
- **Responsibility Analysis:** Presentation components directly mutate browser storage using hardcoded strings, bypassing state synchronization layers.
- **Why This Is a Smell & Consequence:**
  - *Active data desynchronization:* In `JobDetailPage.tsx:16-28`, bookmarking reads and writes `'seeker_bookmarked_jobs'`, while `AppContext.tsx:284` uses `'ehanap_bookmarks'`. Jobs bookmarked on the detail page never show up in the Navbar drawer, Seeker Dashboard, or Bookmarks modal.
  - *Change amplification on profile completion:* Checking whether a profile is complete requires testing four separate conditions across 8 files (`localStorage.getItem('ehanap_profile_completed_' + id)`, `'...completed_' + email`, hardcoded `'poqiq75'`, `profile.isProfileCompleted`). Changing the completion invariant forces edits in 8 files and over 25 call sites.
  - *SSR / Headless test vulnerability:* Direct `localStorage` access without abstraction breaks when rendered in node or headless test environments.
- **Incremental Refactoring Plan:**
  1. *Step 1: Unify Bookmark State Keys:* Route `JobDetailPage.tsx` and `SeekerDashboard.tsx` through `AppContext.toggleBookmarkJob` and retire the rogue `'seeker_bookmarked_jobs'` key.
  2. *Step 2: Encapsulate Profile Completion Invariant:* Create a pure domain predicate `isProfileComplete(user, profile)` in `src/utils/routeGuards.ts` and replace all 25+ raw localStorage invocations.
  3. *Step 3: Centralize Storage Adapter:* Introduce `src/lib/storageAdapter.ts` with typed keys, namespace prefixing, and automated serialization/deserialization.
- **Trade-off:** Minimal; fixes an active user-facing bookmarking bug and consolidates redundant code.

---

### 4. Mega-Component God Views (UI Layer Low Cohesion)
- **ID:** ARCH-04 | **Class:** `GOD_COMPONENT` / `LOW_COHESION` | **Severity:** 🟠 High | **Status:** `REMEDIATED`
- **Blast Radius:** Medium | **Confidence:** High
- **Remediation Delivered:**
  - `src/components/Navbar.tsx`: Reduced from 1,440 lines down to 336 lines (76.7% reduction). Split into persona navigation components under `src/components/navbar/` (`GuestNav`, `SeekerNav`, `EmployerNav`, `AdminNav`, `DemoPersonaPill`, `UserProfileDropdown`, `MobileRoleQuickNav`, `MobileNavDrawer`).
  - `src/hooks/useSeekerProfileForm.ts`: Created reusable form management hook encapsulating all personal details, job preferences, 5MB avatar validation, and profile save mutations.
  - `src/views/seeker/SeekerProfilePage.tsx`: Reduced from 2,894 lines down to 435 lines (85.0% reduction). Decomposed into modular presentation components and specialized modals under `src/views/seeker/components/` (`SeekerProfileHeader`, `SeekerCareerToolsGrid`, `SeekerBottomNav`, `SeekerPersonalInfoModal`, `sections/*`, `SeekerRecordModals`, `SeekerMatchReadinessModal`, `SeekerJobPreferencesModal`, `SeekerFullProfileOverviewModal`, `SeekerUtilityModals`).
  - Automated verification: 79/79 ARCH-04 tests passing (`scripts/verify-arch04-component-decomposition.ts`), 482/482 total architectural assertions passing, and 424/424 regression tests passing. Zero lint errors.
- **Location & Evidence:**
  - `src/views/seeker/SeekerProfilePage.tsx`: Previously 2,905 lines, now 435 modular lines.
  - `src/components/Navbar.tsx`: Previously 1,456 lines, now 336 modular lines.
- **Responsibility Analysis:** These UI views mix responsive markup, modal state management, complex form validation, image base64 conversions, PDF preview generation, and direct domain computations in single massive files.
- **Why This Is a Smell & Consequence:**
  - *Merge conflict bottleneck:* In a multi-developer team (e.g., thesis partners Lomboy, Escalona, Sacapaño), simultaneous work on profile fields, navigation items, or authentication triggers constant merge conflicts.
  - *Cognitive overhead & code duplication:* `SeekerProfilePage.tsx` and `SeekerProfileSetupWizard.tsx` maintain duplicated implementations of education schemas, work experience lists, and skill arrays.
- **Incremental Refactoring Plan:**
  1. *Step 1: Decompose Navbar by Role:* Split `Navbar.tsx` into `GuestNav.tsx`, `SeekerNav.tsx`, `EmployerNav.tsx`, `AdminNav.tsx`, and `DemoPersonaPill.tsx`.
  2. *Step 2: Extract Seeker Profile Section Components:* Decompose `SeekerProfilePage.tsx` into modular child components (`ProfileHeader`, `EducationSection`, `ExperienceSection`, `SkillsSection`, `CertificationsSection`).
  3. *Step 3: Share Profile Form Hooks:* Extract common field management and validation into a `useSeekerProfileForm` hook shared between the profile page and the setup wizard.
- **Trade-off:** Increases total file count and requires explicit prop contracts between parent and child components.

---

### 5. Monolithic Bundle & Total Lack of Route Code-Splitting
- **ID:** ARCH-05 | **Class:** `POOR_MODULARIZATION` / `DEPLOYMENT_COUPLING` | **Severity:** 🟡 Medium | **Status:** `SCALING RISK`
- **Blast Radius:** Medium | **Confidence:** High
- **Location & Evidence:** `src/App.tsx:9-40`. Statically imports 25 distinct view components, including heavy admin dashboards (`AdminReportsPage.tsx`, 1,303 lines), employer rosters (`EmployerApplicantsPage.tsx`, 1,174 lines), and libraries like Recharts, jsPDF, and html2canvas.
- **Responsibility Analysis:** The application routing layer bundles all user roles into a single initial JavaScript artifact.
- **Why This Is a Smell & Consequence:**
  - *Poor mobile performance:* A job seeker browsing vacancies on a mobile network in Roxas must download the complete administrative portal, charting engines, and PDF compilers before rendering the home page.
  - Degrades Core Web Vitals (Largest Contentful Paint and Interaction to Next Paint).
- **Incremental Refactoring Plan:**
  1. *Step 1: Lazy-Load Admin and Employer Routes:* Wrap `AdminDashboard`, `AdminReportsPage`, `EmployerApplicantsPage`, and `ResumeBuilderModal` in `React.lazy()` with a `<Suspense fallback={<RouteLoadingSpinner />}>` boundary.
  2. *Step 2: Dynamic Import of Export Utilities:* Load `jspdf` and `html2canvas` on demand via dynamic `await import()` only when a user triggers PDF generation.
- **Trade-off:** Introduces brief loading states when transitioning between major role portals.

---

### 6. Leaked Geographic & Domain Constants into Test Mock Fixtures
- **ID:** ARCH-06 | **Class:** `BOUNDARY_VIOLATION` / `DUPLICATED_LOGIC` | **Severity:** 🟡 Medium | **Status:** `CURRENT`
- **Blast Radius:** Medium | **Confidence:** High
- **Location & Evidence:**
  - `src/data/mockData.ts:18-45` exports production constants `ROXAS_MUNICIPALITY`, `ROXAS_BARANGAYS`, `ORIENTAL_MINDORO_MUNICIPALITIES`, `JOB_CATEGORIES`.
  - `src/utils/resumeExtractorCore.ts:74` duplicates `ROXAS_BARANGAYS`.
  - 16 production UI components import geographic constants directly from `src/data/mockData.ts`.
- **Responsibility Analysis:** Domain constants describing municipal jurisdiction and job categories belong to the domain layer, not test fixture datasets.
- **Why This Is a Smell & Consequence:**
  - Couples production application code to test mock datasets, hindering tree-shaking and creating confusion about source of truth.
  - Adding or modifying a Roxas barangay requires updating both `mockData.ts` and `resumeExtractorCore.ts`.
- **Incremental Refactoring Plan:**
  1. *Step 1: Isolate Domain Constants:* Create `src/constants/municipal.ts` and `src/constants/jobCategories.ts`.
  2. *Step 2: Point Dependencies to Domain Constants:* Re-export from the new constant modules in `mockData.ts` and `resumeExtractorCore.ts`.
  3. *Step 3: Update View Imports:* Replace all 16 imports from `../data/mockData` with the centralized constants module.
- **Trade-off:** None; clean organization of geographic invariants.

---

### 7. Ad-Hoc Pairwise Decision Tree Matching in Presentation Render Loops
- **ID:** ARCH-07 | **Class:** `RESPONSIBILITY_MIXING` / `UNCLEAR_OWNERSHIP` | **Severity:** 🟡 Medium | **Status:** `REMEDIATED` (Work Package 6)
- **Blast Radius:** Medium | **Confidence:** High
- **Location & Evidence:** `src/views/JobSearchPage.tsx:197`, `src/views/seeker/SeekerDashboard.tsx:126`, `src/views/employer/EmployerApplicantsPage.tsx:93, 159`, `src/views/employer/ApplicantMatchReportModal.tsx:59`, `src/components/JobOfferView.tsx:95`.
- **Responsibility Analysis:** The automated candidate ranking engine calculates compatibility scores. However, individual UI components bypass stored database matches and re-run pairwise `calculateDecisionTreeMatch(seeker, job)` loops on every render pass.
- **Why This Is a Smell & Consequence:**
  - *Algorithmic scaling bottleneck:* In `EmployerApplicantsPage.tsx:159`, selecting a vacancy forces an $O(N \text{ seekers} \times M \text{ jobs})$ pairwise calculation across all candidates during the component render cycle.
  - *Score divergence:* Pre-calculated scores stored in `candidate_matches` or referral slips may disagree with ad-hoc scores computed on the fly if profile snapshots differ.
- **Incremental Refactoring Plan:**
  1. *Step 1: Centralize Candidate Match Resolver:* Implement `getOrCalculateMatch(seeker, job, cachedMatches)` that prioritizes pre-computed database matches.
  2. *Step 2: Memoize Candidate Ranking Rosters:* Isolate roster ranking into a memoized selector or worker instead of running loops in the render tree.
- **Trade-off:** Requires passing cached matches or querying the pre-computed match table.

---

### 8. Mixed Server Lifecycle, AI Orchestration, and Document Heuristics in `server.ts`
- **ID:** ARCH-08 | **Class:** `GOD_SERVICE` / `LOW_COHESION` | **Severity:** 🟡 Medium | **Status:** `REMEDIATED` (Work Package 8)
- **Blast Radius:** Low | **Confidence:** High
- **Remediation Delivered:**
  - `server.ts`: Reduced from 459 lines down to 34 lines (92.6% reduction). Retains clean bootstrap, port binding, and Vite dev / static asset middleware.
  - `server/services/documentParser.ts`: Extracted pure binary document parsing (`pdf-parse`, `mammoth`, plain text fallbacks) with zero HTTP/Express coupling.
  - `server/services/aiResumeService.ts`: Extracted Google GenAI client lifecycle, 4-model failover cascade, 1-hour circuit breaker cooldown state, prompt building with Philippine bio-data & OSY mandates, response schema, and anti-hallucination domain sanitization.
  - `server/controllers/resumeController.ts`: Extracted Express route handlers for `/api/health`, `/api/parse-resume`, and `/api/extract-resume` with resilient fallbacks.
  - `server/app.ts`: Extracted Express application factory decoupled from socket listeners for standalone testing.
  - Automated verification: 76/76 ARCH-08 tests passing (`scripts/verify-arch08-modular-server.ts`), 549/549 total architectural assertions passing, and 424/424 regression tests passing. Zero lint errors. Production bundle verified with esbuild.
- **Location & Evidence:**
  - `server.ts`: Previously 459 lines, now 34 clean bootstrap lines.
  - `server/services/documentParser.ts`: 105 lines of focused document parsing.
  - `server/services/aiResumeService.ts`: 320 lines of isolated AI orchestration & heuristic guards.
  - `server/controllers/resumeController.ts`: 40 lines of clean HTTP controllers.
  - `server/app.ts`: 25 lines of Express app configuration.
- **Responsibility Analysis:** `server.ts` mixes Express HTTP server startup, Vite development middleware, binary document parsing (`pdf-parse`, `mammoth`), Google GenAI prompt construction and model failover, and domain heuristic sanitization (birthday and sex detection).
- **Why This Is a Smell & Consequence:**
  - The Gemini prompt, schema, and binary parsers cannot be unit tested without booting the entire Express/Vite server.
  - Changes to LLM prompt engineering require modifying the server bootstrap file.
- **Incremental Refactoring Plan:**
  1. *Step 1: Extract Document Parsers:* Move buffer text extraction to `server/services/documentParser.ts`.
  2. *Step 2: Extract Gemini Resume Service:* Move LLM client lifecycle, circuit breakers, and prompts into `server/services/aiResumeService.ts`.
  3. *Step 3: Decouple Express Handler:* Retain a clean route declaration in `server.ts` delegating to `server/controllers/resumeController.ts`.
- **Trade-off:** Adds a lightweight controller/service folder structure to the backend.

---

## Structural Diagnostic Tables

### 🧠 God Components & Low-Cohesion Modules
| ID | Component / File | Distinct Responsibilities | Unrelated Concerns Mixed | Reasons to Change | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCH-01** | `src/context/AppContext.tsx` (3,156 lines) | 7 (State, Auth, Supabase/Firestore sync, ATS, Decision Tree, Notifications, Toasts) | Entity stores, OAuth popup, OTP ref, dual-persistence, UI timers | New state slice, auth change, sync change, match rule change | 🔴 Critical |
| **ARCH-04a** | `src/views/seeker/SeekerProfilePage.tsx` (2,905 lines) | 6 (Profile display, tab navigation, 8 sub-modals, inlined CRUD, photo upload, ATS score) | Accordion layout, modal lifecycle, localStorage checks, validation, PDF preview | Tab layout, form validation, bio-data field addition | 🟠 High |
| **ARCH-04b** | `src/components/Navbar.tsx` (1,456 lines) | 5 (Guest nav, seeker nav, employer nav, admin nav, demo switcher, DB indicators) | 4 persona viewports, mobile drawers, unread badges, role switcher pill | Route addition, badge rule change, nav link update | 🟠 High |
| **ARCH-04c** | `src/views/AuthModal.tsx` (1,354 lines) | 4 (Login, multi-role registration, OTP verification, password reset) | Password recovery timers, role selection tabs, Google login, form inputs | Auth requirement, OTP expiration rule, role onboarding | 🟠 High |
| **ARCH-04d** | `src/views/seeker/SeekerProfileSetupWizard.tsx` (1,792 lines) | 5 (Multi-step wizard, resume upload, photo capture, skill classification, bio-data) | File reading, OCR normalization, validation, confetti, step management | Wizard steps, validation rules, skill taxonomy | 🟠 High |
| **ARCH-08** | `server.ts` (34 lines - Remediated) | 1 (Express bootstrap & Vite lifecycle; delegates to `server/`) | None (parsers, AI, and controllers extracted) | Server port or static serving configuration | ✅ Remediated |

### 🕸️ Coupling, Dependency Graph & Cycles
```text
[High Fan-In Hotspots]
  context/AppContext.tsx ◄──── [48 dependent modules]
  types.ts               ◄──── [35 dependent modules]
  data/mockData.ts       ◄──── [16 dependent modules]
  utils/decisionTree.ts  ◄──── [6 dependent modules]
  utils/atsEngine.ts     ◄──── [6 dependent modules]

[High Fan-Out Hotspots]
  App.tsx                            ────► [Imports 34 local modules]
  views/seeker/SeekerProfilePage.tsx ────► [Imports 11 local modules]
  views/employer/EmployerApplicants  ────► [Imports 9 local modules]
  views/seeker/SeekerDashboard.tsx   ────► [Imports 9 local modules]
```

| Component / Cycle | Fan-Out (Deps) | Fan-In (Dependents) | Structural / Runtime Consequence | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `src/context/AppContext.tsx` | 5 | **48** | Universal coupling; 87% of files depend on it; re-renders entire app on any state mutation | 🔴 Critical |
| `src/App.tsx` | **34** | 0 | Root bundle contains all views; zero route-level code splitting | 🟠 High |
| `src/data/mockData.ts` | 1 | **16** | Production UI views depend directly on mock fixture file for municipal constants | 🟡 Medium |
| `src/views/seeker/SeekerProfilePage.tsx` | **11** | 2 | Massive view imports 8 modals, export tools, ATS engine, and setup wizards | 🟠 High |

### 🔄 Change Amplification (Blast Radius)
| Business Concept / Rule | Duplicated Across Locations | Total Change Surface | Why Boundaries Failed | Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Profile Completion Check** (`isProfileCompleted`) | `App.tsx` (6 sites), `AppContext.tsx` (14 sites), `Navbar.tsx` (2 sites), `AuthModal.tsx` (2 sites), `SeekerProfilePage.tsx`, `SeekerProfileSetupWizard.tsx`, `notificationUtils.ts` | **8 files, 26+ call sites** | No single domain predicate; raw checks of 4 localStorage keys & hardcoded string `'poqiq75'` | 🟠 High |
| **Municipal Barangays** (`ROXAS_BARANGAYS`) | `src/data/mockData.ts:21` and `src/utils/resumeExtractorCore.ts:74` | **2 files, 16 consumer imports** | Geographic constant defined in mock seed data and duplicated in extractor | 🟡 Medium |
| **Job Bookmarking** | `src/context/AppContext.tsx` (`ehanap_bookmarks`) and `src/views/JobDetailPage.tsx` (`seeker_bookmarked_jobs`) | **2 storage keys, 4 files** | Presentation component bypassed state context and invented conflicting localStorage key | 🟠 High |
| **Decision Tree Node Matching** | `AppContext.tsx` (4 functions) and UI pages (`JobSearchPage`, `EmployerApplicantsPage`, `JobOfferView`, `ApplicantMatchReportModal`) | **5 files** | Lack of centralized match selector forces UI to compute pairwise matches | 🟡 Medium |

### 🏗️ Boundary Violations & Leaky Abstractions
| ID | Source Layer | Target Layer / Leak | Concrete Evidence | Consequence | Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LEAK-01** | Presentation (`JobDetailPage.tsx:16, 28`) | Raw LocalStorage | Directly reads/writes `'seeker_bookmarked_jobs'` | Desynchronizes bookmarks from AppContext (`'ehanap_bookmarks'`) | Route through `AppContext.toggleBookmarkJob` |
| **LEAK-02** | Presentation (16 view files) | Test Mock Data (`src/data/mockData.ts`) | Imports `ROXAS_BARANGAYS`, `JOB_CATEGORIES` from mock fixtures | Production bundle includes seed arrays; mixes test fixtures with domain constants | Extract `src/constants/municipal.ts` |
| **LEAK-03** | Application (`AppContext.tsx:98-118`) | Dual-Persistence Infrastructure | Simultaneously writes to Supabase and Firestore in `saveDocument` | Split-brain risk; retains dead Firebase dependency | Direct writes exclusively to `supabaseService.ts` |
| **LEAK-04** | Application (`AppContext.tsx:947-1139`) | Firebase Auth | Imports `GoogleAuthProvider` and `signInWithPopup` from `firebase/auth` | Firebase auth dependency persists despite Supabase migration | Replace with `supabase.auth.signInWithOAuth` |
| **LEAK-05** | Server Bootstrap (`server.ts:136-285`) | Domain & Heuristics | Inlines Gemini prompt, schemas, and birthday regex in server entrypoint | Server file cannot be modified without risking prompt behavior | Extract `aiResumeService.ts` |

### 🧪 Testability & Failure Isolation Gaps
| Component | Testing or Failure-Boundary Problem | Forced Dependencies | Architectural Fix |
| :--- | :--- | :--- | :--- |
| `src/views/*` (All UI Views) | Zero UI component tests exist; components cannot mount in Vitest/Jest without full browser DOM | Coupling to `window.scrollTo`, `localStorage`, `html2canvas`, and 3,100-line context | Decouple side-effects behind custom hooks; isolate pure sub-components |
| `server.ts` (Resume Parsing) | Gemini LLM parsing and DOCX/PDF extractors cannot be tested in isolation | Forced boot of Express and Vite development server | Extract pure text extractors and Gemini service into standalone testable modules |
| `AppContext.tsx` (State Logic) | Dual-persistence catch blocks log warnings but hide failed writes | Silent persistence failures allow client state to drift from database | Add explicit transaction status reporting and error boundaries |

---

## 📈 Architecture Under Complexity & Team Growth
- **At 2x Feature/Codebase Complexity:**
  - `AppContext.tsx` will exceed 5,000 lines, causing extreme re-render lag and frequent developer collisions.
  - Adding new user roles (e.g., TESDA Assessment Officer, Barangay Employment Desk Officer) will bloat `Navbar.tsx` and `App.tsx` beyond maintainability.
- **At 5x Feature/Codebase Complexity:**
  - Pairwise Decision Tree execution during render loops in `EmployerApplicantsPage.tsx` will freeze the browser tab when Roxas registered candidates reach 1,000+.
  - Merge conflicts in `SeekerProfilePage.tsx` will stall multi-member team development cycles.
- **At 10x Feature/Codebase Complexity:**
  - Dual-persistence split-brain issues will lead to unrecoverable data inconsistencies between Supabase and Firebase.
  - Initial bundle size (>3MB without code-splitting) will render the application unusable on standard provincial mobile data connections in Oriental Mindoro.

---

## 🧩 Suggested Target Architecture
- **CURRENT:**
  `UI Component ──► AppContext (3,156 lines) ──► (Supabase + Firestore Dual Write) + (Ad-hoc LocalStorage)`
- **TARGET:**
  ```text
  UI Views (Code-split with React.lazy)
     │
     ├──► Sub-Contexts (AuthContext, ToastContext, SeekerContext, EmployerContext, JobContext)
     │       │
     │       ├──► Domain Core (Pure Decision Tree & ATS Engine)
     │       │
     │       ├──► Centralized Storage Adapter (Typed LocalStorage)
     │       │
     │       └──► Supabase Client Layer (Exclusive PostgreSQL Persistence)
  ```
- **What Moves vs Stays:**
  - *Stays:* `src/utils/decisionTree.ts`, `src/utils/atsEngine.ts`, `supabase/migrations/` (clean and isolated).
  - *Moves:* `AppContext.tsx` splits into 4 focused contexts; `mockData.ts` constants move to `src/constants/`; `Navbar.tsx` and `SeekerProfilePage.tsx` decompose into role-specific sub-components; `server.ts` delegates to dedicated controller/service modules.
- **Problem Solved vs New Complexity:** Eliminates re-render cascades, split-brain persistence, and desynchronized local storage. Introduces a manageable multi-provider tree and clean file separation.

---

## 🛠️ Prioritized Refactoring Roadmap
Order by blast-radius and coupling reduction:

| Priority | Finding ID | Incremental Refactoring Action | Architectural Impact | Effort (S/M/L) |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **ARCH-03** | **Unify Storage & Profile Invariant**: Fix `'seeker_bookmarked_jobs'` bug in `JobDetailPage.tsx` and encapsulate `isProfileComplete()` in `routeGuards.ts`. | Eliminates active bookmark desync bug and prunes 26 redundant call sites across 8 files. | **S** |
| **2** | **ARCH-06** | **Extract Municipal & Job Constants**: Move `ROXAS_BARANGAYS`, `JOB_CATEGORIES`, and Mindoro municipalities to `src/constants/municipal.ts`. | Decouples 16 production views from test mock fixture data. | **S** |
| **3** | **ARCH-02** | **Retire Dual-Persistence & Firebase**: Route Google Auth through Supabase Auth; direct all persistence to Supabase and prune Firebase dependencies. | Eliminates split-brain persistence risk and reduces bundle size by ~250KB. | **M** |
| **4** | **ARCH-01a**| **Extract UI Feedback & Auth Contexts**: Slice `ToastContext`, `NotificationContext`, and `AuthContext` out of `AppContext.tsx`. | Reduces `AppContext.tsx` size by ~1,000 lines; stops global re-renders on toast/notification updates. | **M** |
| **5** | **ARCH-05** | **Implement Route Code-Splitting**: Wrap Admin, Employer, and modal components in `React.lazy()` with Suspense fallbacks. | Slashes initial bundle size and drastically improves mobile LCP in Roxas. | **S** |
| **6** | **ARCH-07** | **Centralize Decision Tree Match Resolver**: Memoize candidate ranking and prioritize cached matches over render-loop calculations. | Prevents $O(N \times M)$ client calculation freezes in employer candidate rosters. | **M** |
| **7** | **ARCH-04** | **Decompose Mega-Components**: Split `Navbar.tsx` by role and modularize `SeekerProfilePage.tsx` into child section tabs. | Resolves team merge-conflict bottlenecks and lowers cognitive load. | **L** |
| **8** | **ARCH-08** | **Modularize Server Architecture**: Extract document parsers and Gemini resume service from `server.ts` into `server/services/`. | Enables isolated unit testing for document parsing and AI prompt schemas. | **M** |

---

## 📚 Architecture Lessons (Top 3 Findings)

- **Finding ARCH-01 - Context Segregation vs Monolithic State:**
  - *What the code shows:* Storing 25 state slices and 40+ methods in a single React context forces 48 consumer components to re-render whenever any unrelated field (like an alert toast) changes.
  - *Why it matters in production:* A single high-frequency state update creates perceptible UI jank across unrelated views.
  - *Transferable principle:* Segregate contexts by volatility and domain boundary (e.g., static auth sessions vs high-frequency toast notifications).

- **Finding ARCH-02 - Dual-Persistence Split Brain:**
  - *What the code shows:* During a database migration, maintaining dual writes without distributed consensus leads to divergent state and lingering legacy dependencies.
  - *Why it matters in production:* Users see data appear in one interface while failing in another, destroying audit integrity.
  - *Transferable principle:* Cut over cleanly to the target database; use one-way background replication or explicit fallback gates instead of synchronous dual writes.

- **Finding ARCH-03 - Leaked Infrastructure Primitives:**
  - *What the code shows:* Directly invoking `localStorage.getItem` with ad-hoc string keys in presentation views caused two different keys (`ehanap_bookmarks` vs `seeker_bookmarked_jobs`) to desynchronize features.
  - *Why it matters in production:* Localized workarounds create subtle bugs that elude unit tests and fracture application state.
  - *Transferable principle:* Encapsulate browser storage behind a single typed repository adapter with clear domain ownership.

---

## ⚠️ Needs Verification & Final Verdict

- **Unverified Assumptions:**
  - *Assumption:* Supabase Cloud project has Google OAuth provider enabled. -> *Why it matters:* Required before deprecating Firebase Google Auth. -> *How to verify:* Inspect Supabase project auth settings dashboard or `.env` provider credentials.
- **Final Verdict:**
  1. **Biggest Smell:** Monolithic `AppContext.tsx` (3,156 lines, 25 state slices, 48 consumer files).
  2. **Biggest Modularity Flaw:** Direct coupling of 87% of all frontend files to a single state hub and 16 views to test mock fixtures.
  3. **Biggest Change-Blast-Radius Hotspot:** Profile completion checking logic spread across 8 files and 26+ call sites with raw `localStorage` calls.
  4. **Biggest Deployment/Runtime Coupling Risk:** Split-brain dual persistence (Supabase + Firebase) and monolithic bundle with zero route-level code splitting.
  5. **Highest-Value First Refactoring:** Unifying browser storage & profile invariants (ARCH-03) and extracting domain constants from mock data (ARCH-06).
  6. **Health Rating Justification:** Rated 🟠 *Significant Architectural Problems* because while domain algorithms (`decisionTree.ts`, `atsEngine.ts`) are healthy and 424 tests pass, the application state and persistence layers suffer from high coupling, leaky abstractions, and active state desynchronization.
