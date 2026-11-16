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
| **3** | **WP-03** | **Google & Apple OAuth Live Pipeline**<br>- Extend `signInWithSupabaseOAuth` to support `'apple'` and `'google'`.<br>- Wire Apple button in `AuthModal.tsx` to live OAuth flow.<br>- Handle OAuth redirect callback, role hydration, and profile wizard routing. | **READY** | `src/services/supabaseService.ts`<br>`src/views/AuthModal.tsx`<br>`src/context/AuthContext.tsx` | OAuth initiation for Google & Apple |
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

### Work Package 3: WP-03 — Google & Apple OAuth Live Pipeline
- **Status:** [ ] **NOT STARTED**
- **Tasks**:
  - [ ] Update `signInWithSupabaseOAuth` in `src/services/supabaseService.ts` to type and support `provider: 'google' | 'apple'`.
  - [ ] Wire the Apple sign-in button in `src/views/AuthModal.tsx` to call `signInWithSupabaseOAuth('apple')`.
  - [ ] Ensure role selection (`job_seeker` vs `employer`) is respected upon return from OAuth provider.
- **Verification Evidence**: Pending implementation.

---

### Work Package 4: WP-04 — Verification Test Suite & Defense Safeguards
- **Status:** [ ] **NOT STARTED**
- **Tasks**:
  - [ ] Create `scripts/verify-auth-otp-oauth.ts`.
  - [ ] Verify `npm run lint` with 0 errors.
  - [ ] Verify `npm test` with 0 regressions across all 424 test assertions.
  - [ ] Verify `npm run build` succeeds.
- **Verification Evidence**: Pending implementation.
