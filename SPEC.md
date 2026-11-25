# Production & Code Quality Audit — eHANAP
**Audited date:** 2026-11-25
**Baseline checks:** `npx tsc --noEmit` (0 errors), `npx tsx scripts/verify-milestone07.ts` (424/424 tests passing)

**What this repo does:** eHANAP is a web job-matching platform built for the Public Employment Service Office (PESO) in Roxas, Oriental Mindoro. Job seekers upload resumes or Philippine Bio-Data sheets, employers post vacancies and review ranked candidates, and PESO administrators verify business permits, run recruitment drives, and issue referral slips. **Assumed load:** a municipal pilot with hundreds to a few thousand local users, a few dozen employers, and one or two PESO staff online at the same time on a single Node/Express server backed by Supabase.

---

## Audit Findings

### Must fix

1. **Open database access lets anyone read or delete all data** (`supabase_schema.sql:L578-591`, `supabase/migrations/20261109000001_initial_ehanap_schema.sql:L538-550`)
   - **What this is:** Row Level Security (RLS — database rules that decide which user can read or change each row) policies across all 13 Supabase tables.
   - **Problem:** Every table has `FOR ALL USING (true) WITH CHECK (true)` for `anon` (unauthenticated visitors) and `authenticated` users. Since the public Supabase anon key ships in the browser bundle, any visitor can read all seekers' birthdays, addresses, and phone numbers, approve their own company, or wipe all tables via `resetSupabaseDatabase()`.
   - **Fix:** Replace `USING (true)` with owner- and role-scoped policies using `auth.uid()`, restricting `employer_profiles.status`, `job_posts.status`, and `audit_logs` writes to PESO admin accounts.
   - **If we skip it:** Anyone with browser DevTools can steal personal constituent data or erase the live municipal database.

2. **Sign-in skips password checks, accepts `123456` as OTP, and password reset is broken** (`src/context/AuthContext.tsx:L259-299, L586-589, L621-638`, `src/views/AuthModal.tsx:L433`)
   - **What this is:** User login, 6-digit one-time passcode (OTP) verification, and password recovery.
   - **Problem:** `loginAs` only checks `found.password` if that field exists and ignores errors from `signInWithSupabase`, so any user loaded from Supabase (where `users` has no `password` column) can be logged into with any random password—including the PESO admin account. `verifyOtp` also accepts `'123456'` for everyone, and `AuthModal.tsx` passes `(email, newPassword, forgotOtp)` into `recoverPassword(identifier, code, newPassword)` with the code and password swapped, while `recoverPassword` never updates the password.
   - **Fix:** Await `signInWithSupabase` when Supabase is configured and reject login if it fails, remove the `'123456'` backdoor in `src/context/AuthContext.tsx:L586-589`, fix the argument order in `src/views/AuthModal.tsx:L433`, and update the password on reset.
   - **If we skip it:** Anyone can log in as the PESO administrator with a bogus password, bypass OTP checks, and never reset a forgotten password.

3. **Saving users to Supabase fails silently because `password` is not a table column** (`src/context/AuthContext.tsx:L662-674`, `src/services/supabaseService.ts:L198-218`, `supabase_schema.sql:L26-37`)
   - **What this is:** Persisting newly registered and demo accounts into the Supabase `users` table.
   - **Problem:** `registerUser` attaches `password` to `newUser` and calls `saveRecord('users', newUser)`, which sends `{ ..., password }` to PostgreSQL. Because the `users` table has no `password` column, Supabase rejects the insert and `saveRecord` swallows the error.
   - **Fix:** Register credentials through `signUpWithSupabase(email, password)` and omit `password` from the object passed to `saveRecord(SUPABASE_TABLES.USERS, ...)`.
   - **If we skip it:** New users are never saved to the Supabase `users` table, causing linked `seeker_profiles` and `employer_profiles` inserts to fail foreign-key checks.

4. **Decision Tree education check penalizes almost every seeker and High School job** (`src/utils/decisionTree.ts:L6-14, L113-125`, `src/views/seeker/SeekerProfileSetupWizard.tsx:L1045-1051`)
   - **What this is:** The lookup table (`EDUCATION_LEVELS`) that ranks a seeker's schooling against a job's minimum education requirement.
   - **Problem:** `EDUCATION_LEVELS` only lists `"High School"`, `"TVET / Vocational"`, `"Bachelor's Degree"`, etc., while the seed data, onboarding wizard, and resume extractor save `"College Graduate"`, `"College Undergraduate"`, `"High School Graduate"`, `"Senior High School"`, `"Vocational / TVET"`, and `"Doctorate Degree"`. Unmatched strings fall back to `|| 3` for seekers and `|| 4` for jobs, so a `"College Graduate"` is penalized against a `"Bachelor's Degree"` job (score 65 instead of 100), and a `"High School Graduate"` job defaults to requiring a Bachelor's degree.
   - **Fix:** Add all wizard/extractor labels to `EDUCATION_LEVELS` in `src/utils/decisionTree.ts:L6-14` or normalize both sides through one shared mapping.
   - **If we skip it:** Compatibility scores and "missing qualification" warnings are wrong for nearly all registered seekers and entry-level jobs.

5. **Degree alignment treats "Hospitality", "Fisheries", and "Economics" as Tech degrees** (`src/utils/decisionTree.ts:L52-64`)
   - **What this is:** `evaluateDegreeAlignment`, which checks if a candidate's degree is in a closely related field.
   - **Problem:** `techDegrees` includes short codes `'is'`, `'it'`, and `'cs'` checked with `.includes()`. Because `'hospitality'` contains `'it'`, `'fisheries'` contains `'is'`, and `'economics'` contains `'cs'`, those degrees match `techDegrees` and score 80/100 against `"BS Computer Science"`.
   - **Fix:** Match short abbreviations (`is`, `it`, `cs`) with word-boundary regexes (`/\b(is|it|cs)\b/`) instead of `.includes()`.
   - **If we skip it:** Unrelated graduates receive inflated 80% degree scores on IT jobs and rank higher than they should.

6. **Admin matching page reads missing fields, and Referral Slips hardcode scores** (`src/views/admin/AdminJobMatchingPage.tsx:L56-197`, `src/components/admin/PesoReferralSlipModal.tsx:L75-78`)
   - **What this is:** The PESO Admin candidate matching console and printable Referral Slip generator.
   - **Problem:** `AdminJobMatchingPage` does not call `calculateDecisionTreeMatch`; it runs its own formula that reads `selectedJob.educationalRequirement`, `selectedJob.skills`, and `selectedJob.openingsCount`, all of which are `undefined` on `JobPost` (`minEducationalAttainment`, `requiredSkills`, `vacanciesCount`), giving every candidate 25/25 for education and 0 matched skills. Meanwhile `PesoReferralSlipModal` ignores the real match score and hardcodes `94` for college graduates or `88` otherwise.
   - **Fix:** Replace both custom calculations with `getOrCalculateMatch(seeker, job, { cachedMatches })` from `src/utils/matchResolver.ts` and read `selectedJob.vacanciesCount`.
   - **If we skip it:** PESO staff print official referral slips with fake scores that disagree with employer and seeker views.

7. **New or Google OAuth employers lose their profile and land on a blank page (`/#`)** (`src/context/AuthContext.tsx:L131-143, L273-281, L373-377, L740-763`, `src/context/AppContext.tsx:L396-398`, `src/views/employer/EmployerProfileSetupWizard.tsx:L117`)
   - **What this is:** Linking a signed-in or Google OAuth user to their `EmployerProfile` record and showing the setup wizard.
   - **Problem:** Three gaps combine to break both local sign-up and live Google OAuth for employers: (1) On Supabase Google OAuth, `continueWithGoogle('employer')` writes `'ehanap_oauth_intended_role'` and redirects to Google (`res.data.url`) before lines `379–525` run, and after redirecting back to `/#`, `'ehanap_oauth_intended_role'` is never read and `onSupabaseAuthStateChange` never creates the missing `User` or `EmployerProfile`. (2) `loginAs` only searches `INITIAL_EMPLOYERS` and `registerUser` never saves new employers to `storageAdapter` or `AppContext`. (3) `currentEmployerProfile` returns `null` when missing (unlike `currentSeekerProfile`, which builds a fallback), so `App.tsx` sends the user to `employer-profile-setup` where `EmployerProfileSetupWizard` (`L117`) and `EmployerProfilePage` (`L37`) do `if (!currentEmployerProfile) return null;` — rendering a blank screen with only the navbar and footer.
   - **Fix:** Read `'ehanap_oauth_intended_role'` inside `onSupabaseAuthStateChange` to create missing OAuth `User` + `EmployerProfile` rows (and persist them in `storageAdapter` and `AppContext`), match `currentEmployerProfile` by `userId`/`id`/`email` with a synthesized fallback object, and render a safe loading/fallback state instead of `return null` in `EmployerProfileSetupWizard` and `EmployerProfilePage`.
   - **If we skip it:** Employers who sign in with Google OAuth on Vercel land on a blank `/#` page with only the footer, and newly registered offline employers cannot complete onboarding.

8. **Job review notifications go to the employer profile ID instead of the user ID** (`src/context/AppContext.tsx:L599-620`, `src/utils/notificationUtils.ts:L25-34`)
   - **What this is:** Notifications sent when PESO approves, rejects, or returns a job vacancy for compliance.
   - **Problem:** `reviewJobVacancy` sets `recipientId: job.employerId` (like `emp-puregold-01`), whereas `isNotificationValidForUser` checks against `currentUser.id` (`user-emp-puregold-01`) and hides any notification with a different `recipientId`.
   - **Fix:** Look up `const emp = employers.find(e => e.id === job.employerId)` and set `recipientId: emp?.userId || job.employerId`.
   - **If we skip it:** Employers never see notifications when PESO approves or rejects their job posts.

9. **Resume AI endpoint is open to the public, and image OCR wipes out extracted birthday and sex** (`server/app.ts:L19-21`, `server/services/aiResumeService.ts:L259-274`)
   - **What this is:** The `POST /api/parse-resume` server endpoint and its Gemini output sanitizer.
   - **Problem:** Anyone on the internet can POST up to 15 MB to `/api/parse-resume` with no login check or rate limit, draining the server's `GEMINI_API_KEY` quota. Also, for uploaded resume images or scanned PDFs, `extractedDocText` is empty, so `sanitizeExtractedResumeData` tests `hasDobMention` and `hasSexMention` against `""` and erases the birthday, age, and sex that Gemini OCR just read.
   - **Fix:** Verify the caller's Supabase session token and add a simple per-IP rate limit on `/api/parse-resume`; skip the `rawDocText` regex check when `rawDocText` is empty (image/OCR mode).
   - **If we skip it:** Automated callers can burn through Gemini API credits, and photo bio-data uploads always discard date of birth, age, and sex.

10. **Admin analytics misclassify local employers and undercount job openings** (`src/views/admin/AdminDashboard.tsx:L90-93, L448`, `src/views/admin/AdminUsersPage.tsx:L88-91, L437`)
    - **What this is:** PESO Admin dashboard counters for established Roxas employers and total open slots.
    - **Problem:** Both files check `e.isEstablishedLocal` and outdated industry strings (`'Retail / Supermarket'`, `'Agriculture & Trading'`), whereas `EmployerProfile` uses `establishmentType === 'local_established'` and industries like `'Customer Service & Retail'`. `AdminDashboard.tsx:L448` also sums `b.openingsCount || 1` instead of `b.vacanciesCount || 1`.
    - **Fix:** Check `e.establishmentType === 'local_established'` and sum `b.vacanciesCount || 1`.
    - **If we skip it:** Municipal PESO reports count established local businesses as new/external and undercount multi-slot vacancies.

11. **Job approval sends N+1 database requests and creates colliding `Date.now()` IDs** (`src/context/AppContext.tsx:L510-680`, `src/services/supabaseService.ts:L368-423`)
    - **What this is:** Saving candidate match records and notifications when a job is approved, and seeding demo data.
    - **Problem:** `notifyAndCacheCandidateMatches` fires individual `saveSupabaseRecord` calls per seeker inside a `forEach` loop (`2 * N` HTTP requests), while `verifyEmployer` and `checkJobSubscriptionsAndNotify` build `notif-${Date.now()}` IDs inside loops where multiple items share the same millisecond and overwrite each other. `seedDemoDataToSupabase` similarly runs ~30 sequential `await saveRecord` calls.
    - **Fix:** Generate IDs with `crypto.randomUUID()` and batch-upsert arrays (`supabase.from(table).upsert(rows, { onConflict: 'id' })`).
    - **If we skip it:** Approving a job with hundreds of registered seekers floods the browser with requests and drops notifications.

---

### Should fix

12. **Test suite simulates fake functions instead of testing real auth, context, and API routes** (`scripts/verify-milestone02-auth.ts:L121-145`, `scripts/verify-milestone03-data-flow.ts`, `scripts/verify-arch08-modular-server.ts`)
    - **What this is:** The 424-assertion `npm test` suite (`scripts/verify-milestone07.ts`).
    - **Problem:** `verify-milestone02-auth.ts` defines local `simulateLogin()` and `simulateDemoSwitch()` instead of running `AuthContext`, `verify-milestone03-data-flow.ts` skips `AppContext`, and `verify-arch08-modular-server.ts` never sends an HTTP request to `createApp()`. That is why bugs #2, #3, #6, and #8 all passed 424/424 checks.
    - **Fix:** Add integration tests that invoke the real `AuthProvider`/`AppProvider` logic and hit `createApp()` HTTP routes directly.
    - **If we skip it:** Future regressions in login, persistence, and server routes will keep passing `npm test`.

13. **Apple and Facebook quick sign-in buttons log in with emails that do not exist** (`src/views/AuthModal.tsx:L386-396`)
    - **What this is:** Quick social login buttons in the sign-in modal.
    - **Problem:** `handleSocialQuickSignIn` calls `loginAs('hr@mindoroharvest.ph')` and `loginAs('maria.santos@gmail.com')`, neither of which exists in `INITIAL_USERS` or `DEMO_ACCOUNTS` (which use `puregold.roxas@employer.ph` and `maria.santos@jobseeker.ph`).
    - **Fix:** Point them to `PRIMARY_DEMO_ACCOUNTS.employer.email` and `PRIMARY_DEMO_ACCOUNTS.seeker.email` from `src/data/demoAccounts.ts`, or remove the stubbed Apple/Facebook buttons.
    - **If we skip it:** Clicking Apple or Facebook sign-in fails silently without logging the user in.

14. **`EmployerJobsPage` uses a `'paused'` status rejected by the database** (`src/views/employer/EmployerJobsPage.tsx:L47-82, L353`, `supabase_schema.sql:L222`)
    - **What this is:** Job status filter and status dropdown on the Employer Jobs page.
    - **Problem:** The UI lets employers filter by or set `status: 'paused'` and searches `job.department`, but neither `JobStatus` nor the PostgreSQL `CHECK` constraint on `job_posts.status` allows `'paused'`.
    - **Fix:** Change `'paused'` to `'closed'` or `'archived'` (or add `'paused'` to `JobStatus` and `supabase_schema.sql`), and remove `job.department`.
    - **If we skip it:** Pausing a job fails to save in Supabase and reverts on page reload.

15. **Oversized `AppContext` (2,172 lines) and `SeekerProfileSetupWizard` (1,780 lines) mix unrelated jobs** (`src/context/AppContext.tsx:L1-2172`, `src/views/seeker/SeekerProfileSetupWizard.tsx:L1-1780`)
    - **What this is:** The global state provider and the 4-step seeker onboarding wizard.
    - **Problem:** `AppContext` mixes 15 state collections, Supabase realtime listeners, matching, LRA management, referral slips, chat auto-replies, and audit logging in one provider, re-rendering consumers on unrelated changes. `SeekerProfileSetupWizard` mixes file upload/OCR calls, validation, and all 4 UI steps in one file.
    - **Fix:** Split `AppContext` by domain (Jobs/Applications, PESO LRA/Referrals, Chat/Social) and extract each wizard step into its own view component.
    - **If we skip it:** Small edits in one role's workflow remain risky and hard to test in isolation.

16. **Landing page FAQ states wrong Decision Tree weights** (`src/views/LandingPage.tsx:L57`, `src/utils/decisionTree.ts:L251-255`)
    - **What this is:** The public FAQ explaining how the matching percentage is calculated.
    - **Problem:** `LandingPage.tsx` claims weights of 25% education, 20% degree, 30% skills, 15% experience, and 10% certifications, whereas `decisionTree.ts` actually uses 12% education, 25% degree, 35% skills, 20% experience, and 8% certifications.
    - **Fix:** Update the FAQ string in `LandingPage.tsx` to match the real weights in `decisionTree.ts`.
    - **If we skip it:** Users and reviewers see conflicting formulas for the core matching engine.

17. **SQL migration lags behind `supabase_schema.sql`, plus unused `autoprefixer` and duplicate lockfile** (`supabase/migrations/20261109000001_initial_ehanap_schema.sql`, `supabase_schema.sql`, `package.json:L35`)
    - **What this is:** Database DDL files and build configuration.
    - **Problem:** The migration file is missing columns present in `supabase_schema.sql` (`nominated_candidates`, `slip_number`, `summary`, `description`, `industry`). Also `autoprefixer` in `package.json` is unused alongside `@tailwindcss/vite`, and both `bun.lock` and `package-lock.json` are committed.
    - **Fix:** Sync the migration file with `supabase_schema.sql` (or keep one canonical file), remove `autoprefixer` from `package.json`, and delete the unused `bun.lock`.
    - **If we skip it:** Running Supabase CLI migrations creates a schema missing columns that the app expects.

---

### Nice to have

18. **`resetToDemoData` wipes LRA events, referral slips, and alerts to empty arrays** (`src/context/AppContext.tsx:L1885-1908`)
    - **What this is:** The demo-reset helper function.
    - **Problem:** It resets `jobSubscriptions`, `referralSlips`, and `localRecruitmentActivities` to `[]` instead of `INITIAL_JOB_SUBSCRIPTIONS`, `INITIAL_REFERRAL_SLIPS`, and `INITIAL_LRA_EVENTS`, and upserts seed data without deleting user-added rows first.
    - **Fix:** Reset those three states to their `INITIAL_*` constants.
    - **If we skip it:** Resetting demo data leaves PESO LRA and Referral Slip pages empty until a hard refresh.

19. **`EmployerApplicantsPage` recalculates ATS scores for every seeker on each render** (`src/views/employer/EmployerApplicantsPage.tsx:L90-115`, `src/context/AppContext.tsx:L2089-2144`)
    - **What this is:** The `allCandidateEvaluations` memoized list for the Candidate Ranking Roster.
    - **Problem:** Its `useMemo` depends on `hasInvitedCandidate`, which `AppContext` recreates as a new function on every render, causing `evaluateResumeForAts(seeker, activeJob)` to rerun for all seekers whenever search text or filters change.
    - **Fix:** Memoize `hasInvitedCandidate` with `useCallback` in `AppContext` (or pass `invitations` directly).
    - **If we skip it:** Typing in the applicant search bar becomes sluggish as the seeker list grows.

---

## Audit Summary
- **Verdict:** Fix items 1–11 before any live deployment or evaluation — open Supabase RLS policies, unverified passwords, silent user-write failures, and broken Decision Tree education/Admin matching undermine both security and core matching accuracy.
- **Lean:** `-150 lines, -1 dependencies possible.`
- **Not checked:** Live Supabase database queries (`VITE_SUPABASE_URL` / `.env` values were not inspected or hit), running the Express server (`npm run dev` / `npm run build`), full line-by-line UI markup of `SeekerProfilePage.tsx`, `SeekerApplicationsPage.tsx`, `SeekerInterviewsPage.tsx`, `EmployerInterviewsPage.tsx`, `EmployerProfilePage.tsx`, `JobOfferView.tsx`, and `ResumeBuilderModal.tsx`; `npx tsc --noEmit` exited `0` and `npx tsx scripts/verify-milestone07.ts` reported `424/424` passing tests.

---

## Remediation Work Packages

| Work Package | Audit Findings | Scope Summary | Priority |
| :--- | :---: | :--- | :---: |
| **WP-01: Database Security & Schema Alignment** | #1, #3, #17 | Replace permissive RLS (`USING (true)`) with role/owner-scoped policies; register via Supabase Auth and strip `password` from `users` upserts; sync `supabase/migrations/` with `supabase_schema.sql`; remove unused `autoprefixer` and `bun.lock`. | 🔴 Must Fix |
| **WP-02: Auth Hardening, Google OAuth Redirect & Employer Profile Recovery** | #2, #7, #13 | Enforce real password checks (`signInWithSupabase`), remove `'123456'` OTP bypass, fix `recoverPassword` arg order & password update, handle `'ehanap_oauth_intended_role'` after OAuth redirect, synthesize/persist `EmployerProfile` and fix blank `return null` in `EmployerProfileSetupWizard`/`EmployerProfilePage`, fix/remove dead Apple/Facebook emails. | 🔴 Must Fix |
| **WP-03: Decision Tree Accuracy & Admin Matching Consistency** | #4, #5, #6, #16 | Map all education labels in `EDUCATION_LEVELS`; use word-boundary matching for `'is'|'it'|'cs'`; replace custom/hardcoded scoring in `AdminJobMatchingPage` and `PesoReferralSlipModal` with `getOrCalculateMatch`; sync `LandingPage` FAQ weights. | 🔴 Must Fix |
| **WP-04: Notifications, Status Constraints, Admin Metrics & Demo Reset** | #8, #10, #14, #18 | Send `reviewJobVacancy` notifications to `emp.userId`; fix `establishmentType` and `vacanciesCount` checks in Admin views; remove invalid `'paused'`/`department` in `EmployerJobsPage`; fix `resetToDemoData` arrays. | 🔴 Must Fix |
| **WP-05: Server Hardening, OCR Fix & Batch Persistence** | #9, #11, #19 | Authenticate and rate-limit `/api/parse-resume`; preserve Gemini OCR `dateOfBirth`/`age`/`sex` when `rawDocText` is empty; use `crypto.randomUUID()` and batch `.upsert()`; memoize `hasInvitedCandidate`. | 🔴 Must Fix |
| **WP-06: Real Auth, Context & API Integration Tests** | #12 | Replace local mock simulations in `verify-milestone02-auth.ts` / `verify-milestone03-data-flow.ts` / `verify-arch08-modular-server.ts` with tests against real `AuthContext`, `AppContext`, and `createApp()` HTTP endpoints. | 🟠 Should Fix |
| **WP-07: Remaining God-Module Decomposition** | #15 | Slice remaining domain stores out of `AppContext.tsx` (Jobs/Applications, PESO LRA/Referrals, Chat/Social) and split `SeekerProfileSetupWizard.tsx` into step components. | 🟠 Should Fix |
