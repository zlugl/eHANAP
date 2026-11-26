# eHANAP — Audit Remediation Progress

Tracking remediation of the production and code quality findings documented in [SPEC.md](SPEC.md).

---

## Baseline Verification
- **TypeScript Check**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Automated Verification Suite**: `npm test` (`npx tsx scripts/verify-milestone07.ts`) reports 424/424 assertions passing (note: auth, data-flow, and server checks currently test simulated helpers rather than live `AuthContext`/`AppContext`/HTTP handlers — tracked in WP-06).
- **Production Audit**: 19 findings logged in [SPEC.md](SPEC.md) (11 Must Fix, 6 Should Fix, 2 Nice to Have).

---

## Remediation Roadmap (from SPEC.md)

| Work Package | Findings | Title & Scope | Status | Verification |
| :--- | :---: | :--- | :---: | :--- |
| **WP-01** | #1, #3, #17 | **Database Security & Schema Alignment** | **DONE** | `npm run lint`, `npm test` (424/424), `npm run build`, SQL RLS parity check |
| **WP-02** | #2, #7, #13 | **Auth Hardening, Google OAuth Redirect & Employer Profile Recovery** | **DONE** | `npm run lint`, `npm test` (424/424), `npm run build`, storageAdapter/signIn checks |
| **WP-03** | #4, #5, #6, #16 | **Decision Tree Accuracy & Admin Matching Consistency** | **DONE** | `npm run lint`, `npm test` (8 suites; Suite 4: 39/39), `npm run build` |
| **WP-04** | #8, #10, #14, #18 | **Notifications, Status Constraints, Admin Metrics & Demo Reset** | **DONE** | `npm run lint`, `npm test` (8 suites), `npx tsx scripts/verify-wp04.ts` (19/19), `npm run build` |
| **WP-05** | #9, #11, #19 | **Server Hardening, OCR Fix & Batch Persistence** | **DONE** | `npm run lint`, `npm test` (8 suites), `npx tsx scripts/verify-wp05.ts` (29/29), `npm run build` |
| **WP-06** | #12 | **Real Auth, Context & API Integration Tests** | **DONE** | `npm run lint`, `npm test` (592/592 across 11 suites), `npm run build` |
| **WP-07** | #15 | **Remaining God-Module Decomposition (`AppContext` & Wizard)** | **DONE** | `npm run lint`, `npm test` (630/630 across 12 suites), `npx tsx scripts/verify-wp07.ts` (38/38), `npm run build` |

---

## Work Package Checklists

### WP-01: Database Security & Schema Alignment
- **Status:** [x] **DONE**
- **Targets:** `supabase_schema.sql`, `supabase/migrations/20261109000001_initial_ehanap_schema.sql`, `src/context/AuthContext.tsx`, `src/services/supabaseService.ts`, `package.json`, `bun.lock`
- **Deliverables:**
  - [x] Replace permissive `FOR ALL USING (true)` RLS policies with role- and `auth.uid()`-scoped policies across all 13 tables.
  - [x] Register credentials via `signUpWithSupabase` and omit `password` from `users` table upserts.
  - [x] Sync `supabase/migrations/20261109000001_initial_ehanap_schema.sql` with `supabase_schema.sql`.
  - [x] Remove unused `autoprefixer` from `package.json` and delete redundant `bun.lock`.

### WP-02: Auth Hardening, Google OAuth Redirect & Employer Profile Recovery
- **Status:** [x] **DONE**
- **Targets:** `src/context/AuthContext.tsx`, `src/views/AuthModal.tsx`, `src/lib/storageAdapter.ts`, `src/context/AppContext.tsx`, `src/views/employer/EmployerProfileSetupWizard.tsx`, `src/views/employer/EmployerProfilePage.tsx`, `src/services/supabaseService.ts`, `src/components/Navbar.tsx`
- **Deliverables:**
  - [x] Await `signInWithSupabase` in `loginAs` when Supabase is configured and reject invalid passwords (keep demo fallback strictly offline).
  - [x] Remove hardcoded `'123456'` OTP bypass in `verifyOtp`.
  - [x] Fix swapped `(code, newPassword)` arguments in `AuthModal.tsx` and persist the new password in `recoverPassword`.
  - [x] Read `ehanap_oauth_intended_role` inside `onSupabaseAuthStateChange` after Google OAuth redirect to create/hydrate missing `User` and `EmployerProfile` / `JobSeekerProfile` records.
  - [x] Persist newly registered employers in `storageAdapter`, match `currentEmployerProfile` by `userId`/`id`/`email` with a fallback object in `AppContext`, and replace `if (!currentEmployerProfile) return null` in `EmployerProfileSetupWizard` and `EmployerProfilePage`.
  - [x] Point Apple/Facebook quick sign-in to valid demo accounts or remove stubbed buttons (removed stubbed Apple/Facebook buttons; kept Google OAuth).

### WP-03: Decision Tree Accuracy & Admin Matching Consistency
- **Status:** [x] **DONE**
- **Targets:** `src/utils/decisionTree.ts`, `src/utils/matchResolver.ts`, `src/views/admin/AdminJobMatchingPage.tsx`, `src/components/admin/PesoReferralSlipModal.tsx`, `src/views/LandingPage.tsx`, `scripts/verify-decision-tree.ts`
- **Deliverables:**
  - [x] Add all wizard/extractor attainment values (`College Graduate`, `High School Graduate`, `Senior High School`, `Vocational / TVET`, `College Undergraduate`, `Doctorate Degree`) to `EDUCATION_LEVELS`.
  - [x] Match short degree codes (`is`, `it`, `cs`) using word-boundary regexes in `evaluateDegreeAlignment`.
  - [x] Replace custom scoring in `AdminJobMatchingPage` and hardcoded `94`/`88` in `PesoReferralSlipModal` with `getOrCalculateMatch`, and use `vacanciesCount`.
  - [x] Update `LandingPage` FAQ weights to match `decisionTree.ts` (35% skills, 25% degree, 20% experience, 12% education, 8% certifications).

### WP-04: Notifications, Status Constraints, Admin Metrics & Demo Reset
- **Status:** [x] **DONE**
- **Targets:** `src/context/AppContext.tsx`, `src/views/admin/AdminDashboard.tsx`, `src/views/admin/AdminUsersPage.tsx`, `src/views/employer/EmployerJobsPage.tsx`, `scripts/verify-wp04.ts`
- **Deliverables:**
  - [x] Route `reviewJobVacancy` notifications to `emp.userId` instead of `job.employerId`.
  - [x] Fix `establishmentType === 'local_established'` and `vacanciesCount` checks in `AdminDashboard` and `AdminUsersPage`.
  - [x] Remove unsupported `'paused'` status and `job.department` references in `EmployerJobsPage`.
  - [x] Restore `INITIAL_JOB_SUBSCRIPTIONS`, `INITIAL_REFERRAL_SLIPS`, and `INITIAL_LRA_EVENTS` in `resetToDemoData`.

### WP-05: Server Hardening, OCR Fix & Batch Persistence
- **Status:** [x] **DONE**
- **Targets:** `server/app.ts`, `server/services/aiResumeService.ts`, `src/utils/resumeParser.ts`, `src/context/AppContext.tsx`, `src/services/supabaseService.ts`, `src/views/employer/EmployerApplicantsPage.tsx`, `scripts/verify-wp05.ts`, `scripts/verify-arch08-modular-server.ts`
- **Deliverables:**
  - [x] Require Supabase auth token verification and per-IP rate limiting on `/api/parse-resume` and `/api/extract-resume`, and forward the Supabase session Bearer token from `src/utils/resumeParser.ts`.
  - [x] Skip `rawDocText` DOB/sex stripping when `rawDocText` is empty (image/scanned PDF OCR mode).
  - [x] Replace `Date.now()` loop/generated IDs with `crypto.randomUUID()` and batch-upsert `candidate_matches`, notifications, and demo seed records via `saveRecords`.
  - [x] Memoize `hasInvitedCandidate` in `AppContext` to stop recomputing ATS scores on every render in `EmployerApplicantsPage`.

### WP-06: Real Auth, Context & API Integration Tests
- **Status:** [x] **DONE**
- **Targets:** `scripts/testContextHarness.ts`, `scripts/verify-milestone02-auth.ts`, `scripts/verify-milestone03-data-flow.ts`, `scripts/verify-arch08-modular-server.ts`, `scripts/verify-decision-tree.ts`, `scripts/verify-milestone07.ts`
- **Deliverables:**
  - [x] Add tests exercising real `AuthContext`, `AppContext`, and `createApp()` HTTP endpoints instead of local `simulate*` helpers.
  - [x] Add regression tests covering RLS/schema column alignment, `EDUCATION_LEVELS` mappings, degree word-boundary checks, and OCR sanitization.

### WP-07: Remaining God-Module Decomposition
- **Status:** [x] **DONE**
- **Targets:** `src/context/AppContext.tsx`, `src/context/DirectoryContext.tsx`, `src/context/JobsContext.tsx`, `src/context/PesoLraContext.tsx`, `src/context/ChatSocialContext.tsx`, `src/context/persistence.ts`, `src/context/index.ts`, `src/views/seeker/SeekerProfileSetupWizard.tsx`, `src/views/seeker/wizard/*`, `scripts/verify-wp07.ts`, `scripts/verify-wp04.ts`, `scripts/verify-wp05.ts`, `scripts/verify-milestone07.ts`
- **Deliverables:**
  - [x] Slice `AppContext.tsx` (2,267 → 567 lines) into focused domain contexts (`DirectoryContext`, `JobsContext`, `PesoLraContext`, `ChatSocialContext`) and shared `persistence.ts`, preserving `useApp()` compatibility.
  - [x] Decompose `SeekerProfileSetupWizard.tsx` (1,780 → 602 lines) into isolated step components under `src/views/seeker/wizard/` (`WizardStepResumeUpload`, `WizardStepPersonalEducation`, `WizardStepSkillsInventory`, `WizardStepJobPreferences`, `WizardStepValidation`, `wizardConstants`).
