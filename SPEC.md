# Post-Merge Production & Code Quality Audit — eHANAP
**Audited date:** 2026-11-26 (updated post-commit for `445cca2` vs `2d128a4` reconciliation)
**Git baseline:** Local `faye-updates` and `main` sit at `2d128a4` (`WP-08`–`WP-11` complete over `d630aef`); `origin/main` diverged at `445cca2` (also parented by `d630aef`, authored by Faye Margarette after `84070e6` and `d630aef`).
**Verification snapshot:** On `2d128a4`, `npm run lint` (`tsc --noEmit`) passes with 0 errors (and the identical pre-commit tree passed `npm run build` + `npm test` 667/667 across 14 suites in the `WP-11` session). On `origin/main` (`445cca2`), `npm run lint` (0 errors) and `npm run build` pass, **but `npm test` fails (`270/329` across 12 suites — 2 passed, 10 failed)**.

**What this repo does:** eHANAP is a web job-matching platform built for the Public Employment Service Office (PESO) in Roxas, Oriental Mindoro. Job seekers upload resumes or Philippine Bio-Data sheets, employers post vacancies and review ranked candidates, and PESO administrators verify business permits, run recruitment drives, and issue referral slips. **Assumed load:** a municipal pilot with hundreds to a few thousand local users, a few dozen employers, and one or two PESO staff online at the same time on a single Node/Express server backed by Supabase.

---

## Audit Findings

### Must fix

1. **Employer onboarding sends statuses and columns that PostgreSQL rejects** (`supabase_schema.sql:L52-102, L680-703`, `src/context/AuthContext.tsx:L127-128, L804-805`, `src/context/DirectoryContext.tsx:L305-306`, `src/views/employer/EmployerProfileSetupWizard.tsx:L242-245, L297-315`, `src/views/employer/EmployerProfilePage.tsx:L141, L162, L268-273`, `src/services/supabaseService.ts:L206-213`)
   - **What this is:** Saving new or updated employer company profiles and uploaded business permits into Supabase.
   - **Problem:** The `employer_profiles.status` `CHECK` constraint only allows `'pending'`, `'verified'`, `'for_compliance'`, `'rejected'`, or `'suspended'`, Row Level Security (RLS) requires `status = 'pending'` on new non-admin inserts, and the table has no `documents` column. The merged app writes `status: 'incomplete'`, `status: 'pending_verification'`, and `documents: [...]`, and `sanitizeForTable` only strips `password` on `users`.
   - **Fix:** Strip frontend-only keys like `documents` in `sanitizeForTable` (`src/services/supabaseService.ts:L206-L213`), and normalize `'incomplete'` / `'pending_verification'` to `'pending'` before calling Supabase (or add a matching SQL migration updating the `CHECK` constraint and RLS policies, synced in `supabase_schema.sql` and `supabase/migrations/20261109000001_initial_ehanap_schema.sql`).
   - **If we skip it:** Clean-slate employers appear saved in React memory during one session while PostgreSQL rejects every save and loses their record on refresh.

2. **Employer job creation breaks Supabase RLS rules and writes non-existent columns** (`src/context/JobsContext.tsx:L305-314`, `src/views/employer/CreateJobModal.tsx:L1783-1841`, `supabase_schema.sql:L203-L242, L746-754`)
   - **What this is:** Publishing a new job vacancy from an employer's job modal to the `job_posts` table.
   - **Problem:** `createJobPost` hardcodes `status: 'active'` (`JobsContext.tsx:L309`), which fails the RLS insert rule requiring non-admin employers to insert `status = 'pending_approval'` (`supabase_schema.sql:L751`) and bypasses PESO vacancy approval (`AGENT.md`). `CreateJobModal.tsx:L1783-1841` also passes unmapped fields (`subCategory`, `department`, `workSetup`, `workSchedule`, `vacancies`, `positionsAvailable`, `minSalary`, `maxSalary`, `payFrequency`, `paySchedule`, `isSalaryNegotiable`, `salaryNegotiable`, `isUrgent`, `deadline`, `requiredEducationLevel`, `acceptedEducationLevels`, `preferredCourses`, `preferredTesdaQualifications`, `anyCourseAllowed`, `careerLevel`, `experienceLevel`, `openToFreshGraduates`, `requiredLicenses`, `skills`, `evaluatedSkills`, `skillsRequired`, `matchWeights`, `benefits`) that are absent from `job_posts` and not stripped by `sanitizeForTable`.
   - **Fix:** Allow PESO-verified employers (`public.get_employer_status(employer_id) = 'verified'`) to insert `'active'` job postings directly in `job_posts` RLS (while blocking unverified employers) and update `AGENT.md`, and migrate or strip the unmapped `CreateJobModal` fields before upserting.
   - **If we skip it:** Every vacancy created by an employer fails to persist to Supabase and disappears after page reload.

3. **Interview scheduling and rescheduling fail PostgreSQL `CHECK` and column rules** (`src/context/JobsContext.tsx:L871-L890, L950-L965, L1319-L1320`, `supabase_schema.sql:L331-L352`)
   - **What this is:** Saving scheduled interviews, reschedules, and reminder tracking into the `interviews` table.
   - **Problem:** `rescheduleInterview` sets `status: 'rescheduled'` (`JobsContext.tsx:L959`), violating `interviews.status CHECK` (`'scheduled'`, `'accepted'`, `'reschedule_requested'`, `'declined'`, `'completed'`, `'cancelled'`), and `scheduleInterview`, `rescheduleInterview`, and the reminder interval write `vacancyId`, `seekerId`, `format`, `notes`, and `remindersSent` (`JobsContext.tsx:L874-884, L955-960, L1319`), which do not exist on `interviews`.
   - **Fix:** Keep `status: 'scheduled'` on reschedule (storing details in `rescheduleNotes`) and strip UI alias keys (`vacancyId`, `seekerId`, `format`, `notes`, `remindersSent`) in `sanitizeForTable` — or add a SQL migration defining them.
   - **If we skip it:** Rescheduled interviews and reminder updates error out in Supabase, leaving seeker calendars out of sync on reload.

4. **Missing employer profiles trap accounts in an onboarding loop, and saves run inside React state updaters** (`src/context/DirectoryContext.tsx:L175-L178, L286-L332`, `src/App.tsx:L186-L190`, `src/views/employer/EmployerProfileSetupWizard.tsx:L100-L119`, `src/views/employer/EmployerProfilePage.tsx:L141, L162`)
   - **What this is:** Resolving `currentEmployerProfile` and persisting profile updates.
   - **Problem:** `currentEmployerProfile` returns `null` when no matching profile row exists in memory or `localStorage` (`DirectoryContext.tsx:L175-178`). Because `App.tsx:L186-L190` forces incomplete employers onto `'employer-profile-setup'` while `EmployerProfileSetupWizard.tsx:L100-L119` renders `"Loading Employer Profile"` with only `"Return to Home"` (`'landing'`), affected accounts loop back to onboarding endlessly. Additionally, `updateEmployerProfile` (`DirectoryContext.tsx:L314, L327`) calls `saveDocument` inside `setEmployers(prev => ...)`, and `EmployerProfilePage.tsx:L141, L162` calls `updateEmployerProfile` inside `setUploadedDocs(prev => ...)`.
   - **Fix:** Synthesize a fallback `EmployerProfile` in `DirectoryContext` when `currentUser.role === 'employer'` (matching `currentSeekerProfile`), and move `saveDocument` / `updateEmployerProfile` side effects out of state-updater callbacks.
   - **If we skip it:** Employers whose profile record hasn't hydrated yet get stuck on a loading card, and React Strict Mode fires duplicate persistence writes.

5. **Forgot-password reset updates only local React state, so Supabase Auth login stays broken** (`src/context/AuthContext.tsx:L367-L371, L680-L713`)
   - **What this is:** Resetting a forgotten password via `recoverPassword` and signing in again via `loginAs`.
   - **Problem:** When Supabase is configured, `loginAs` requires `signInWithSupabase(cleanEmail, password)` to pass (`AuthContext.tsx:L367-L371`). `recoverPassword` (`L680-L713`) only assigns `password: newPassword` on the in-memory `User` object and calls `saveRecord('users', updatedUser)` — where `sanitizeForTable` strips `password` — without calling Supabase Auth to update the real credential.
   - **Fix:** Wire forgot-password reset to Supabase Auth (`supabase.auth.resetPasswordForEmail(...)` and `supabase.auth.updateUser({ password })` on recovery session) when Supabase is configured instead of writing a stripped local `password` property.
   - **If we skip it:** Users who reset a forgotten password see a success message, then fail to log in with their new password.

6. **PESO Admin never sees employer verification alert notifications** (`src/views/employer/EmployerProfileSetupWizard.tsx:L337-L344`, `src/views/employer/EmployerProfilePage.tsx:L285-L292`, `src/utils/notificationUtils.ts:L25-L41`)
   - **What this is:** Alerting the Admin notification bell and drawer ([Navbar.tsx](file:///home/keil/eHANAP/src/components/Navbar.tsx#L61-L71), [NotificationDrawer.tsx](file:///home/keil/eHANAP/src/components/NotificationDrawer.tsx#L56-L63)) when an employer submits verification documents.
   - **Problem:** Both onboarding and profile edits send admin alerts with `recipientId: 'admin'` and `recipientRole: 'admin'`. Although `NotificationContext.tsx:L131, L175` was patched for `recipientRole === 'admin'`, `isNotificationValidForUser` (`notificationUtils.ts:L32`) still rejects any notification with a non-empty `recipientId` that does not match the signed-in admin's generated `user-...` ID, email, or `'all'`/`'*'`/`'broadcast'`.
   - **Fix:** Allow `notif.recipientRole === 'admin' && currentUser.role === 'admin'` in `isNotificationValidForUser`, or look up the admin user's real `id` like `createJobPost` (`JobsContext.tsx:L317-L321`).
   - **If we skip it:** Employers submit permits for accreditation while the PESO admin sees zero bell alerts.

---

### Should fix

7. **Passwordless `switchDemoRole` impersonation helper is still exported and wired into `Navbar`** (`src/context/AuthContext.tsx:L478-L512`, `src/components/Navbar.tsx:L84-L91, L252, L263, L320`)
   - **What this is:** The legacy quick-role switcher in `AuthContext` and its callback wiring in `Navbar`.
   - **Problem:** Post-merge `switchDemoRole` sets `currentUser` to any registered `'admin'`, `'employer'`, or `'job_seeker'` without checking a password or Supabase Auth session; even though dropdown buttons were removed, the passwordless helper stays live on context and `Navbar`.
   - **Fix:** Delete `switchDemoRole` from `AuthContext` / `AppContext` and remove `handleQuickRoleSwitch` + `onSwitchRole` props from `Navbar`.
   - **If we skip it:** Any caller or regression touching `switchDemoRole('admin')` bypasses authentication.

8. **Landing page shows two conflicting Decision Tree weight breakdowns** (`src/views/LandingPage.tsx:L27-L32, L57, L295-L315`)
   - **What this is:** The homepage sections explaining how candidate compatibility percentages are calculated.
   - **Problem:** Hero cards (`L27-32`) and FAQ (`L57`) state `12%` education, `25%` degree, `35%` skills, `20%` experience, and `8%` certifications, while the Stage 2.0 distribution table (`L295-315`) still displays `25% / 20% / 30% / 15% / 10%`.
   - **Fix:** Update `LandingPage.tsx:L295-L315` so all sections match `12% / 25% / 35% / 20% / 8%`.
   - **If we skip it:** Stakeholders and thesis reviewers see conflicting scoring weights on the landing page.

9. **Verification suites are broken (`271/329`), leaving clean-slate, auth, and Decision Tree code unverified** (`scripts/verify-milestone07.ts`, `scripts/verify-decision-tree.ts`, `scripts/verify-arch07-match-resolver.ts`, `scripts/verify-wp04.ts`, `scripts/verify-wp07.ts`)
   - **What this is:** The repository's automated verification runner (`npm test`) and unit/integration check scripts.
   - **Problem:** While `npm run lint` (exit 0), `npm run build` (exit 0), `verify-wp05.ts` (`29/29`), `verify-ats-engine.ts` (`29/29`), and `verify-arch08-modular-server.ts` (`82/82`) pass, `verify-milestone07.ts` fails 9 of 12 suites (`271/329`): seed-dependent suites crash on empty clean-slate arrays (`verify-phase1-supabase.ts` 30/34, `verify-milestone02-auth.ts` 63/99, `verify-milestone03-data-flow.ts` 0/2, `verify-milestone04-candidate-ranking.ts` 4/5, `verify-milestone05-peso-lra-analytics.ts` 0/1, `verify-e2e-scenarios.ts` 0/1, `verify-wp04.ts` crash at `L38`, `verify-wp07.ts` crash at `L58`); `verify-decision-tree.ts` fails `12/46` assertions (`34/46`); and `verify-arch07-match-resolver.ts` (`58/62`) greps `AppContext.tsx` for code moved to `JobsContext.tsx` (`invalidateMatchCache` IS called at `JobsContext.tsx:L522`).
   - **Fix:** Supply explicit local test fixtures in those scripts instead of assuming pre-populated global seed arrays, update `verify-arch07-match-resolver.ts` to inspect `JobsContext.tsx`, align `verify-decision-tree.ts` with confirmed Decision Tree rules, and add regression tests covering findings #1–#6.
   - **If we skip it:** Automated test runs remain permanently red and hide future regressions.

10. **Notification recipient matching is duplicated and out of sync** (`src/utils/notificationUtils.ts:L25-L41`, `src/context/NotificationContext.tsx:L128-L190`)
    - **What this is:** Duplicate recipient checks in `isNotificationValidForUser` and `NotificationContext` (`markAllNotificationsRead` / `clearAllNotifications`).
    - **Problem:** Both re-implement the same `id` / `email` / `seekerId` / `seekerUserId` / `admin` logic, and an earlier admin fix landed in `NotificationContext.tsx:L131, L175` while missing `notificationUtils.ts` (causing finding #6).
    - **Fix:** Extract one `isNotificationRecipient` helper in `src/utils/notificationUtils.ts` and reuse it in `NotificationContext.tsx`.
    - **If we skip it:** Display and mark-read/clear behavior drift apart when recipient formats change.

11. **Dead celebration modal in Seeker Wizard and unused `Navbar` quick-switch props** (`src/views/seeker/SeekerProfileSetupWizard.tsx:L47, L558-L609`, `src/components/Navbar.tsx:L84-L91, L252, L263, L320`)
    - **What this is:** Unreachable modal JSX and leftover role-switcher callbacks.
    - **Problem:** `setIsCelebrationOpen` is only ever called as `setIsCelebrationOpen(false)` (`L585, L597`), leaving lines `47` and `558–609` (53 lines) unreachable; `Navbar.tsx` also wires `handleQuickRoleSwitch` at `L252`, `L263`, and `L320` with no active dropdown buttons calling it.
    - **Fix:** Delete `isCelebrationOpen` and the `AnimatePresence` modal block in `SeekerProfileSetupWizard.tsx`, and remove `handleQuickRoleSwitch` + `onSwitchRole` wiring in `Navbar.tsx`.
    - **If we skip it:** Unreachable code stays around to confuse future maintenance.

---

## Upstream Reconciliation Findings (`origin/main` `445cca2` vs `faye-updates` `2d128a4`)

12. **`PesoLraContext` referral status string bug and LRA `NOT NULL` defaults fixed in `445cca2`, missing in `2d128a4`** (`src/context/PesoLraContext.tsx:L27, L30, L128-141, L315-350`, `src/views/admin/AdminJobMatchingPage.tsx:L548-L556`, `src/views/admin/AdminLraPage.tsx:L109-L128`, `src/types.ts:L467-L505`, `supabase_schema.sql:L395-L408, L477`)
    - **What this is:** Updating PESO referral slip statuses from `AdminJobMatchingPage`, creating LRA events from `AdminLraPage`, and keeping referral/LRA statuses aligned with `supabase_schema.sql`.
    - **Problem:** In `2d128a4`, `AdminJobMatchingPage.tsx:L548` calls `updateReferralSlipStatus(slip.id, e.target.value as any, 'Status updated by PESO officer.')`, passing a truthy string into `isHots?: boolean` and erroneously tagging every status change as `[Hired On The Spot]`. `AdminLraPage.tsx:L109-L128` also calls `createLraEvent` without `industry`, `letterOfIntentStatus`, or `mayorsApprovalVerified`, which are `NOT NULL` in `lra_events` (`supabase_schema.sql:L395-L400`). Additionally, `AdminJobMatchingPage.tsx:L552-L556` renders `<option>` values (`presented_to_employer`, `interviewed`, `declined`) that `445cca2` added to `src/types.ts` (`PesoReferralSlip['status']`) and that are missing from `peso_referral_slips.status CHECK` (`supabase_schema.sql:L477`).
    - **Fix:** Port `445cca2`'s `updateReferralSlipStatus(..., isHotsOrRemarks?: boolean | string)` and `createLraEvent` relaxed signature + `companyOrigin`/`industry`/`letterOfIntentStatus`/`mayorsApprovalVerified` defaults into `PesoLraContext.tsx` and `AppContext.tsx`; align `src/types.ts` compatibility fields (`PesoReferralSlip['status']`, `LocalRecruitmentActivity['status']`, `ResumeFile.isDefault`, `JobSeekerProfile`/`JobPost`/`Interview` aliases) and update `peso_referral_slips.status CHECK` / `sanitizeForTable` identically in `supabase_schema.sql` and `supabase/migrations/20261109000001_initial_ehanap_schema.sql`.
    - **If we skip it:** Every referral status update in the Admin UI appends a false HOTS tag, LRA creations fail `lra_events` `NOT NULL` inserts in Supabase, and new referral statuses fail PostgreSQL `CHECK` constraints.

13. **Diverged `origin/main` (`445cca2`) vs `faye-updates` (`2d128a4`) blocks fast-forward push** (`origin/main` at `445cca2`, local `faye-updates` & `main` at `2d128a4`, 15 overlapping files over `d630aef`)
    - **What this is:** Reconciling Faye's conflict-resolution commit (`445cca2`) with `WP-08`–`WP-11` (`2d128a4`) so `main` can push to `origin/main` cleanly.
    - **Problem:** `445cca2` cleared `d630aef`'s conflict markers across 16 files, **but** left `npm test` broken (`270/329`, 10/12 suites failing), omitted `WP-08` schema/RLS/sanitization, retained passwordless `switchDemoRole` and `Date.now()` IDs, lacked `WP-09` Supabase password recovery / pure state updaters / admin alert routing, and did not repair clean-slate tests (`WP-11`).
    - **Fix:** After porting Finding #12 (and optionally `445cca2`'s Register-tab `Continue with Google` button in `src/views/AuthModal.tsx`), merge or rebase `faye-updates` onto `origin/main` (`445cca2`) while preserving all `WP-08`–`WP-11` changes on the 15 overlapping files; verify `npm run lint`, `npm run build`, and `npm test`, then fast-forward `main` and push to `origin/main`.
    - **If we skip it:** `git push origin main` stays rejected, while overwriting `2d128a4` with `445cca2` would regress `WP-08`–`WP-11` and re-break 10 of 12 test suites.

---

## Audit Summary
- **Verdict:** `WP-08` through `WP-12` are complete; `origin/main` (`445cca2`) is reconciled with `2d128a4` on `faye-updates` and `main`.
- **Not checked:** Live Supabase writes/reads against a real project (`.env` credentials and live RLS evaluation), running `npm run dev` in a browser, and manual interactive UI flows.

---

## Remediation Work Packages

| Work Package | Audit Findings | Scope Summary | Priority |
| :--- | :---: | :--- | :---: |
| **WP-08: Supabase Schema, RLS & Payload Alignment** | #1, #2, #3 | Normalize or migrate employer statuses/documents, enforce/align `job_posts` RLS & `CreateJobModal` columns, and fix `interviews` `CHECK`/column writes; keep `supabase_schema.sql` and `supabase/migrations/` identical. | ✅ Done |
| **WP-09: Auth Recovery, Employer Profile Fallback & Admin Alerts** | #4, #5, #6, #10 | Synthesize fallback `EmployerProfile` in `DirectoryContext`, move persistence side effects out of state updaters, wire `recoverPassword` to Supabase Auth, and unify admin notification filtering (`isNotificationRecipient`). | ✅ Done |
| **WP-10: Auth Surface Cleanup, Homepage Consistency & Dead Code Removal** | #7, #8, #11 | Remove passwordless `switchDemoRole` & `Navbar` switch props, align `LandingPage` Stage 2.0 weight table (`12/25/35/20/8`), and delete dead `SeekerProfileSetupWizard` celebration modal (`-53` lines). | ✅ Done |
| **WP-11: Test Suite & Verification Repair for Clean-Slate + Sliced Architecture** | #9 | Update seed-dependent scripts with explicit fixtures, point `verify-arch07-match-resolver.ts` at `JobsContext.tsx`, align `verify-decision-tree.ts`, add regression tests for #1–#6, and restore passing `npm test`. | ✅ Done |
| **WP-12: Upstream Reconciliation & `origin/main` Sync (`445cca2` ↔ `2d128a4`)** | #12, #13 | Port `445cca2`'s `PesoLraContext` referral/LRA fixes + `types.ts`/schema status parity (and optional Register Google button), reconcile `faye-updates` onto `origin/main` preserving `WP-08`–`WP-11`, verify green gates, fast-forward `main`, and push. | ✅ Done |

---

## Prior Remediation Baseline (Completed Pre-Merge)
Phase 1 remediation packages `WP-01` through `WP-07` (2026-11-25 audit, 19 findings) were completed up to commit `55d3e7d` before upstream owner commits `84070e6` and `d630aef` introduced clean-slate state, `CreateJobModal`/interview extensions, and merge conflicts. `PROGRESS.md` tracks the active post-merge packages `WP-08` through `WP-11`.
