# eHANAP — Authentication, OTP & Social OAuth Progress

Tracking implementation, verification, and hardening of Supabase native authentication, 6-digit email OTP verification, password recovery, and Google/Apple OAuth based on [SPEC.md](SPEC.md).

---

## Baseline Verification
- **Automated Test Suite**: 424/424 regression tests passing (`npm test`).
- **Static Analysis**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Build**: `npm run build` bundles successfully.
- **Architecture Refactoring (ARCH 01–08)**: **COMPLETED** (549/549 architectural assertions passing).

---

## Work Package Roadmap (from SPEC.md)

| Priority | ID | Work Package | Status | Target Deliverables | Verification Target |
| :---: | :---: | :--- | :---: | :--- | :--- |
| **1** | **WP-01** | **Native Supabase Sign-Up & 6-Digit Email OTP**<br>- Wire `supabase.auth.signUp` with user metadata.<br>- Replace simulated OTP with `supabase.auth.verifyOtp({ type: 'signup' })`.<br>- Add resend OTP with cooldown timer.<br>- Maintain offline demo code fallback. | **COMPLETED** | `src/context/AuthContext.tsx`<br>`src/views/AuthModal.tsx`<br>`src/services/supabaseService.ts` | 84/84 tests passed in Milestone 02 Auth Suite |
| **2** | **WP-02** | **Native Supabase Password Recovery OTP**<br>- Replace simulated reset with `supabase.auth.resetPasswordForEmail`.<br>- Implement atomic token verification & password update via `verifyOtp({ type: 'recovery' })` and `updateUser`.<br>- Retain demo account recovery fallback. | **COMPLETED** | `src/context/AuthContext.tsx`<br>`src/views/AuthModal.tsx`<br>`src/services/supabaseService.ts` | 89/89 tests passed in Milestone 02 Auth Suite |
| **3** | **WP-03** | **Google OAuth Live Pipeline & Apple Removal**<br>- Wire Google OAuth via `signInWithSupabaseOAuth('google')`.<br>- Remove the Apple login button and its mock logic from `AuthModal.tsx`.<br>- Handle post-auth role routing and profile completion.<br>- Decommission Apple Sign In due to lack of Apple Developer license. | **COMPLETED** | `src/services/supabaseService.ts`<br>`src/views/AuthModal.tsx`<br>`src/context/AuthContext.tsx` | 93/93 tests passed in Milestone 02 Auth Suite |
| **4** | **WP-04** | **Verification Test Suite & Defense Safeguards**<br>- Create automated test script `scripts/verify-auth-otp-oauth.ts`.<br>- Assert both live Supabase branch and offline fallback branch.<br>- Validate zero TypeScript errors and clean production build. | **READY** | `scripts/verify-auth-otp-oauth.ts` | 100% pass on new auth verification assertions |

---

## Detailed Work Package Status

### Work Package 1: WP-01 — Native Supabase Sign-Up & 6-Digit Email OTP
- **Status:** [x] **COMPLETED**
- **Tasks**:
  - [x] Add `signUpWithSupabase(email, password, metadata)` and `verifySupabaseOtp(email, token, type)` helpers to `src/services/supabaseService.ts`.
  - [x] Add `resendSupabaseOtp(email, type)` helper to `src/services/supabaseService.ts`.
  - [x] Update `registerUser` in `src/context/AuthContext.tsx` to invoke Supabase sign-up with `full_name`, `role`, and `municipality: 'Roxas'`.
  - [x] Update `verifyOtp` in `src/context/AuthContext.tsx` to verify live Supabase OTP tokens with offline fallback & academic defense master code `123456`.
  - [x] Add `resendOtp` to `AuthContext.tsx` and `AppContext.tsx`.
  - [x] Update `isOtpStep` UI in `src/views/AuthModal.tsx` with 60-second resend cooldown timer and clean error messaging.
- **Verification Evidence**:
  - `npx tsx scripts/verify-milestone02-auth.ts`: 84/84 tests passed (including master demo code acceptance, invalid token rejection, and clean resend dispatch).
  - `npm test`: 428/428 tests passed across all 8 verification suites.
  - `npm run lint`: 0 TypeScript compiler errors.
  - `npm run build`: Production client and server bundles built cleanly.

---

### Work Package 2: WP-02 — Native Supabase Password Recovery OTP
- **Status:** [x] **COMPLETED**
- **Tasks**:
  - [x] Add `sendPasswordResetEmail(email)` and `resetPasswordWithOtp(email, token, newPassword)` helpers to `src/services/supabaseService.ts`.
  - [x] Connect `handleRequestPasswordOtp` and `handleResetPassword` in `src/views/AuthModal.tsx` to live recovery methods.
  - [x] Add `requestPasswordReset` and update `recoverPassword` in `src/context/AuthContext.tsx` and `src/context/AppContext.tsx`.
  - [x] Preserve offline fallback for demo account password changes with master demo code `123456`.
- **Verification Evidence**:
  - `npx tsx scripts/verify-milestone02-auth.ts`: 89/89 tests passed (including master recovery OTP verification, invalid token rejection, empty email rejection, and password length checks).
  - `npm test`: 424/424 tests passed across all 8 verification suites with 0 regressions.
  - `npm run lint`: 0 TypeScript compiler errors.
  - `npm run build`: Production client and server bundles built cleanly.

---

### Work Package 3: WP-03 — Google OAuth Live Pipeline & Apple Removal
- **Status:** [x] **COMPLETED**
- **Tasks**:
  - [x] Enforce Google OAuth provider in `signInWithSupabaseOAuth` in `src/services/supabaseService.ts` and reject decommissioned Apple provider with clear informative error message.
  - [x] Decommission Apple Sign In and mock timeout simulation from `src/views/AuthModal.tsx`; simplify social login UI to feature Google OAuth exclusively for both sign-in and sign-up.
  - [x] Wire `handleGoogleAuth` in `src/views/AuthModal.tsx` to handle both live redirect and offline demo evaluation without hanging states.
  - [x] Implement post-OAuth redirect session handling in `src/context/AuthContext.tsx` via `onSupabaseAuthStateChange`, honoring `ehanap_oauth_intended_role` for new user creation, profile provisioning (`job_seekers` or `employers`), and routing to setup wizards.
  - [x] Set `isAccountVerified: true` on Google OAuth users and retain offline demo fallback.
- **Verification Evidence**:
  - `npx tsx scripts/verify-milestone02-auth.ts`: 93/93 tests passed (including Google OAuth initiation, data return, and Apple decommissioning rejection).
  - `npm test`: 424/424 tests passed across all 8 verification suites with 0 regressions.
  - `npm run lint`: 0 TypeScript compiler errors (`tsc --noEmit`).
  - `npm run build`: Production client and server bundles built cleanly.

---

### Work Package 4: WP-04 — Verification Test Suite & Defense Safeguards
- **Status:** [ ] **NOT STARTED**
- **Tasks**:
  - [ ] Create `scripts/verify-auth-otp-oauth.ts`.
  - [ ] Verify `npm run lint` with 0 errors.
  - [ ] Verify `npm test` with 0 regressions across all 424 test assertions.
  - [ ] Verify `npm run build` succeeds.
- **Verification Evidence**: Pending implementation.
