# eHANAP — Audit Remediation Progress

Tracking remediation of the post-merge production and code quality findings documented in [SPEC.md](SPEC.md).

---

## Baseline Verification (2026-11-26)
- **Git State**: Branch `faye-updates` sits on `d630aef` with 18 uncommitted conflict-resolution files (0 conflict markers); local `main` sits at `55d3e7d`.
- **TypeScript Check**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Build**: `npm run build` (`vite build` + `esbuild server.ts`) passes (`dist/server.cjs` 65.0kb).
- **Standalone Passing Suites**: `npx tsx scripts/verify-wp05.ts` (29/29), `npx tsx scripts/verify-ats-engine.ts` (29/29), `npx tsx scripts/verify-arch08-modular-server.ts` (82/82).
- **Failing Verification Suite**: `npm test` (`npx tsx scripts/verify-milestone07.ts`) reports **271/329** tests passing across 12 suites (3 passed, 9 failed: clean-slate empty arrays break seed-dependent suites; `verify-decision-tree.ts` 34/46; `verify-arch07-match-resolver.ts` 58/62).
- **Post-Merge Audit**: 11 findings logged in [SPEC.md](SPEC.md) (6 Must Fix, 5 Should Fix).

---

## Remediation Roadmap (from SPEC.md)

| Work Package | Findings | Title & Scope | Status | Verification Target |
| :--- | :---: | :--- | :---: | :--- |
| **WP-08** | #1, #2, #3 | **Supabase Schema, RLS & Payload Alignment** | **DONE** | `npm run lint`, `npm run build`, `scripts/verify-wp08.ts` (29/29) |
| **WP-09** | #4, #5, #6, #10 | **Auth Recovery, Employer Profile Fallback & Admin Alerts** | **DONE** | `npm run lint`, `npm run build`, `scripts/verify-wp09.ts` (25/25) |
| **WP-10** | #7, #8, #11 | **Auth Surface Cleanup, Homepage Consistency & Dead Code Removal** | **DONE** | `npm run lint`, `npm run build`, auth/grep checks, `verify-arch01-context-slicing.ts` (57/57) |
| **WP-11** | #9 | **Test Suite & Verification Repair (Clean-Slate + Sliced Contexts)** | **DONE** | `npm run lint`, `npm run build`, `npm test` (14/14, 665/665), `verify-arch07-match-resolver.ts` (93/93) |

---

## Work Package Checklists

### WP-08: Supabase Schema, RLS & Payload Alignment
- **Status:** [x] **DONE** (2026-11-26)
- **Targets:** `supabase_schema.sql`, `supabase/migrations/20261109000001_initial_ehanap_schema.sql`, `src/services/supabaseService.ts`, `src/context/JobsContext.tsx`, `src/views/employer/EmployerProfilePage.tsx`, `src/views/employer/CreateJobModal.tsx`, `scripts/verify-wp08.ts`
- **Deliverables:**
  - [x] Aligned `employer_profiles` schema, `CHECK` constraints, and RLS (`'incomplete'` / `'pending_verification'` / `'pending'`, `documents JSONB`, non-admin self-verification blocked), mapped `bir2303No`/`bir2303File`, and cleared `complianceRemarks` (`''`) on resubmission.
  - [x] Allowed PESO-verified employers to publish `JobsContext.createJobPost` directly to `status: 'active'` with immediate candidate matching and Admin alerts (aligned with `job_posts` RLS checking `get_employer_status(employer_id) = 'verified'`), kept non-admin `updateJobVacancyStatus` moderation guards, updated `CreateJobModal` publication toast, expanded `job_posts` `employment_type` `CHECK` + feature columns, and stripped duplicate aliases/unmapped fields via `sanitizeForTable`.
  - [x] Added `'rescheduled'` status `CHECK` and `reminders_sent JSONB` to `interviews`, stopped emitting duplicate UI aliases (`vacancyId`, `seekerId`, `format`, `notes`) in `scheduleInterview` / `rescheduleInterview`, and enforced `sanitizeForTable` column allowlists.
  - [x] Kept `supabase_schema.sql` and `supabase/migrations/20261109000001_initial_ehanap_schema.sql` DDL, idempotent upgrade statements, and RLS policies strictly identical.
  - [x] Verified with `npm run lint`, `npm run build`, `npx tsx scripts/verify-wp08.ts` (29/29), `npx tsx scripts/verify-wp05.ts` (29/29), `npx tsx scripts/verify-ats-engine.ts` (29/29), and `npx tsx scripts/verify-arch08-modular-server.ts` (82/82).

### WP-09: Auth Recovery, Employer Profile Fallback & Admin Alerts
- **Status:** [x] **DONE** (2026-11-26)
- **Targets:** `src/context/DirectoryContext.tsx`, `src/views/employer/EmployerProfilePage.tsx`, `src/context/AuthContext.tsx`, `src/context/AppContext.tsx`, `src/services/supabaseService.ts`, `src/views/AuthModal.tsx`, `src/App.tsx`, `src/utils/notificationUtils.ts`, `src/context/NotificationContext.tsx`, `src/components/NotificationDrawer.tsx`, `scripts/verify-milestone02-auth.ts`, `scripts/verify-wp09.ts`
- **Deliverables:**
  - [x] Returned a synthesized fallback `EmployerProfile` in `DirectoryContext` when `currentUser.role === 'employer'` and no row is loaded yet (and respected `isEmployerProfileComplete` storage flags), eliminating the `EmployerProfileSetupWizard` redirect loop.
  - [x] Moved `saveDocument`, `updateEmployerProfile`, `updateRecord`, and `deleteRecord` side effects out of React `setState(prev => ...)` updater callbacks across `DirectoryContext.tsx`, `EmployerProfilePage.tsx`, and `NotificationContext.tsx`.
  - [x] Wired `requestPasswordReset` and `recoverPassword` in `AuthContext.tsx`, `supabaseService.ts`, `AuthModal.tsx`, and `App.tsx` to real Supabase Auth (`resetPasswordForEmail`, `PASSWORD_RECOVERY` listener, `verifyOtp` recovery token, and `updateUser({ password })`), removing stripped local `users.password` writes in Supabase mode while keeping offline OTP recovery parity.
  - [x] Extracted `isNotificationRecipient` in `src/utils/notificationUtils.ts`, reused it in `NotificationContext.tsx` (`markAllNotificationsRead` and `clearAllNotifications`), updated `NotificationDrawer.tsx` to pass role context, and verified `recipientRole === 'admin'` alerts reach clean-slate PESO admins.
  - [x] Verified with `npm run lint`, `npm run build`, `npx tsx scripts/verify-wp09.ts` (25/25), `npx tsx scripts/verify-wp08.ts` (29/29), `npx tsx scripts/verify-wp05.ts` (29/29), `npx tsx scripts/verify-ats-engine.ts` (29/29), `npx tsx scripts/verify-arch08-modular-server.ts` (82/82), and `npx tsx scripts/verify-arch01-context-slicing.ts` (57/57).

### WP-10: Auth Surface Cleanup, Homepage Consistency & Dead Code Removal
- **Status:** [x] **DONE** (2026-11-26)
- **Targets:** `src/context/AuthContext.tsx`, `src/context/AppContext.tsx`, `src/components/Navbar.tsx`, `src/components/navbar/DemoPersonaPill.tsx`, `src/components/navbar/UserProfileDropdown.tsx`, `src/components/navbar/MobileNavDrawer.tsx`, `src/views/LandingPage.tsx`, `src/views/seeker/SeekerProfileSetupWizard.tsx`, `scripts/verify-arch01-context-slicing.ts`, `scripts/verify-milestone02-auth.ts`
- **Deliverables:**
  - [x] Deleted passwordless `switchDemoRole` from `AuthContext` / `AppContext`, removed `handleQuickRoleSwitch`, unused `Key` import, and `onSwitchRole` wiring from `Navbar.tsx` plus `onSwitchRole` / dead `handleRoleSwitch` handlers in `DemoPersonaPill.tsx`, `UserProfileDropdown.tsx`, and `MobileNavDrawer.tsx`, and updated `verify-arch01-context-slicing.ts` and `verify-milestone02-auth.ts` to verify removal.
  - [x] Updated the Stage 2.0 weight breakdown table in `LandingPage.tsx:L295-315` to match `12%` education, `25%` degree, `35%` skills, `20%` experience, and `8%` certifications.
  - [x] Deleted dead `isCelebrationOpen` state, `AnimatePresence` celebration modal JSX, and unused imports (`User`, `PartyPopper`, `motion`, `AnimatePresence`) in `SeekerProfileSetupWizard.tsx`.
  - [x] Verified with `npm run lint` (0 errors), `npm run build`, grep cleanliness checks across `src/`, `npx tsx scripts/verify-wp09.ts` (25/25), `npx tsx scripts/verify-wp08.ts` (29/29), `npx tsx scripts/verify-wp05.ts` (29/29), `npx tsx scripts/verify-ats-engine.ts` (29/29), `npx tsx scripts/verify-arch08-modular-server.ts` (82/82), `npx tsx scripts/verify-arch01-context-slicing.ts` (57/57), and `npx tsx scripts/verify-arch05-code-splitting.ts` (60/60).

### WP-11: Test Suite & Verification Repair for Clean-Slate + Sliced Architecture
- **Status:** [x] **DONE** (2026-11-26)
- **Targets:** `scripts/testFixtures.ts`, `scripts/verify-milestone07.ts`, `scripts/verify-phase1-supabase.ts`, `scripts/verify-milestone02-auth.ts`, `scripts/verify-milestone03-data-flow.ts`, `scripts/verify-decision-tree.ts`, `scripts/verify-milestone04-candidate-ranking.ts`, `scripts/verify-milestone05-peso-lra-analytics.ts`, `scripts/verify-e2e-scenarios.ts`, `scripts/verify-arch07-match-resolver.ts`, `scripts/verify-wp04.ts`, `scripts/verify-wp07.ts`, `scripts/verify-wp08.ts`, `scripts/verify-wp09.ts`
- **Deliverables:**
  - [x] Extracted shared clean-slate test fixtures (`scripts/testFixtures.ts`, non-legacy IDs avoiding `storageAdapter.filterOutLegacyDemoRecords`) and updated `verify-phase1-supabase.ts`, `verify-milestone02-auth.ts`, `verify-milestone03-data-flow.ts`, `verify-milestone04-candidate-ranking.ts`, `verify-milestone05-peso-lra-analytics.ts`, `verify-e2e-scenarios.ts`, `verify-wp04.ts`, and `verify-wp07.ts` to inject local fixtures and assert clean-slate defaults (`seed.sql`, `demoAccounts.ts`, `resetToDemoData`).
  - [x] Updated `verify-arch07-match-resolver.ts` to inspect `JobsContext.tsx` for `SUPABASE_TABLES.CANDIDATE_MATCHES`, `subscribeToSupabaseTable`, `setCandidateMatches`, and `updateJobPost` cache invalidation, and verify 15 pairwise score-parity calculations against `TEST_JOB_SEEKERS` and `TEST_JOB_POSTS`.
  - [x] Aligned `verify-decision-tree.ts` with confirmed `src/utils/decisionTree.ts` scoring rules (`College Undergraduate` rank `3.5` -> `85%`, `BS IT` synonym `100%` vs `BS CS`/`BS IS` related `84%`, 80/20 license/location weighting `20%`, updated rationale strings) and added `verify-wp08.ts` (#1–#3) + `verify-wp09.ts` (#4–#6, #10) as Suites 13–14 in `scripts/verify-milestone07.ts`.
  - [x] Verified with `npm run lint` (0 errors), `npm run build`, `npm test` (**14/14 suites, 665/665 assertions passed**), `npx tsx scripts/verify-arch07-match-resolver.ts` (**93/93**), `npx tsx scripts/verify-arch01-context-slicing.ts` (**57/57**), and `npx tsx scripts/verify-arch05-code-splitting.ts` (**60/60**).
