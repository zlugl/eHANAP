# eHANAP — Specification: Supabase Native Authentication, Email OTP Verification & Google OAuth (Apple Sign In Removed)

**Target System:** eHANAP — Public Employment Service Office (PESO) Employment Facilitation Platform  
**Jurisdiction:** Municipality of Roxas, Oriental Mindoro, Philippines  
**Date:** 2026-11-16  
**Status:** DRAFT / APPROVED FOR IMPLEMENTATION  

---

## 1. Executive Summary & Problem Statement

During user testing and registration audits of eHANAP, key authentication and identity verification flows were identified as either simulated or incomplete:
1. **Account Registration Email OTP**: During account creation, users are routed to an email verification step requesting a 6-digit code. Currently, this uses an in-memory/sessionStorage simulation (`AuthContext.tsx`) with a pop-up toast revealing the generated code or accepting `123456`.
2. **Password Recovery OTP**: The "Forgot Password" workflow similarly requires a 6-digit verification code sent to the user's email, relying on the same simulation.
3. **Social Authentication (Google OAuth & Apple Sign In Removal)**: The landing modal previously presented social login buttons for Google and Apple. Because the project does not have an Apple Developer Program license (required for Apple Services IDs and `.p8` private keys), **Apple Sign In is removed**. Social authentication is consolidated strictly to **Google OAuth**.

### Core Strategic Directive
Rather than introducing third-party SaaS identity or SMS providers (such as Twilio, SendGrid, or Firebase Auth), **Supabase** will natively shoulder full responsibility for:
- Email sign-up and secure credential storage.
- 6-digit Email OTP confirmation (`verifyOtp`) for account verification and password resets.
- OAuth 2.0 social authentication for **Google** (Apple Sign In removed due to lack of an Apple Developer license).
- Offline / Academic Demo resilience: Retaining instant 1-click persona switching for thesis defense and offline evaluation.

---

## 2. System Architecture & Verification Boundaries

```text
[ Browser Client - eHANAP UI ]
  │
  ├──► AuthModal.tsx (Sign In, Create Account, 6-Digit OTP Screen, Forgot Password)
  │      │
  │      ▼
  ├──► AuthContext.tsx (Sliced Auth Store & Session Lifecycle)
  │      │
  │      ├── (Online / Configured) ─────────────┐
  │      │                                      ▼
  │      │                             [ supabaseService.ts ]
  │      │                                      │
  │      │                                      ▼
  │      │                             [ @supabase/supabase-js ]
  │      │                                      │
  │      │           ┌──────────────────────────┴──────────────────────────┐
  │      │           ▼                                                     ▼
  │      │  [ Supabase Auth API ]                                [ Supabase PostgreSQL ]
  │      │   ├── Native Email OTP Dispatcher                       ├── public.users
  │      │   │   (Inbuilt SMTP / Custom SMTP)                      ├── public.job_seekers
  │      │   ├── Token Verification (type: 'signup' | 'recovery')  ├── public.employers
  │      │   └── Google OAuth 2.0 Provider (Apple OAuth Removed)   └── RLS Security Policies
  │      │
  │      └── (Offline / Demo Fallback) ─────────► [ storageAdapter.ts + In-Memory Store ]
  │                                               (Preserves 1-click thesis defense demo personas)
```

### Boundary Clarification: Institutional Accreditation vs. Auth OTP
| Boundary | Scope | Target Users | Implementation Layer |
| :--- | :--- | :--- | :--- |
| **Auth Email OTP** | Identity & email ownership validation | Job Seekers, Employers | `AuthModal.tsx` ➔ `AuthContext.tsx` ➔ Supabase Auth (`verifyOtp`) |
| **Password Reset OTP** | Account credential recovery | Registered Users | `AuthModal.tsx` ➔ Supabase Auth (`resetPasswordForEmail` + `verifyOtp`) |
| **Social OAuth** | One-tap federated sign-in (Google) | Job Seekers, Employers | `AuthModal.tsx` ➔ Supabase Auth (`signInWithOAuth({ provider: 'google' })`) *(Apple Sign In removed)* |
| **PESO Accreditation** | Municipal legal compliance (DTI, Mayor's Permit, BIR 2303) | Registered Employers only | `EmployerProfilePage.tsx` ➔ `AdminVerificationsPage.tsx` ➔ PostgreSQL |

---

## 3. Flow Specifications

### Flow 1: Account Creation with 6-Digit Email OTP
- **Entry Points**: 
  - `AuthModal.tsx` (mode: `'register'`, role: `'job_seeker'` or `'employer'`).
- **User Steps**:
  1. User enters Full Name, Email, Password, and selects Role.
  2. Submitting triggers `supabase.auth.signUp`:
     ```typescript
     const { data, error } = await supabase.auth.signUp({
       email: regEmail,
       password: regPassword,
       options: {
         data: {
           full_name: name,
           role: role,
           municipality: 'Roxas'
         }
       }
     });
     ```
  3. Supabase issues an automated 6-digit confirmation token via its built-in email service.
  4. Modal transitions to `isOtpStep = true` ("Verify Email" screen).
  5. User enters the 6-digit code received in their inbox.
  6. Front-end verifies token via Supabase Auth:
     ```typescript
     const { data, error } = await supabase.auth.verifyOtp({
       email: regEmail,
       token: otpCode,
       type: 'signup'
     });
     ```
  7. Upon successful verification:
     - Supabase establishes an authenticated session (`access_token`, `refresh_token`).
     - Corresponding record in `public.users` is marked with `isAccountVerified: true`.
     - User is immediately routed to their designated profile wizard (`SeekerProfileSetupWizard` or `EmployerProfileSetupWizard`).
- **Resend Token**:
  - Clicking "Resend Code" executes `supabase.auth.resend({ type: 'signup', email: regEmail })` with a 60-second cooldown timer.

---

### Flow 2: Password Reset via Email OTP
- **Entry Points**:
  - `AuthModal.tsx` (link: "Forgot Password?").
- **User Steps**:
  1. **Request Code**: User enters their registered email address.
  2. Front-end invokes:
     ```typescript
     const { data, error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
     ```
  3. Modal transitions to `forgotStep: 'verify'`.
  4. **Verify & Reset**: User enters the 6-digit OTP code and their desired new password.
  5. Front-end verifies recovery token and updates password in a single atomic flow:
     ```typescript
     const { data, error } = await supabase.auth.verifyOtp({
       email: forgotEmail,
       token: forgotOtp,
       type: 'recovery'
     });
     if (!error) {
       await supabase.auth.updateUser({ password: newPassword });
     }
     ```
  6. Modal displays a success confirmation and directs user to log in with their updated password.

---

### Flow 3: Google Social OAuth Authentication (Apple Sign In Removed)

#### A. Google OAuth Flow
1. User clicks the **Google** icon button in `AuthModal.tsx`.
2. Front-end calls `signInWithSupabaseOAuth('google')`:
   ```typescript
   await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${window.location.origin}`,
       queryParams: { prompt: 'select_account' }
     }
   });
   ```
3. Storage stores the user's selected role preference (`ehanap_oauth_intended_role`).
4. Google authenticates the user and redirects back to the eHANAP origin with PKCE code exchange handled automatically by `@supabase/supabase-js`.
5. `onSupabaseAuthStateChange` captures `SIGNED_IN` event:
   - If user is new: Creates matching `public.users` and profile records (`job_seekers` or `employers`) and forwards to setup wizard.
   - If user exists: Hydrates profile and routes to appropriate dashboard.

#### B. Apple Sign In Removal Justification & Decommissioning
- **Reason for Removal**: Sign in with Apple mandates an active Apple Developer Program membership ($99/year license) to provision an App ID, configure Services IDs, and issue `.p8` private keys for token exchange. Because no Apple Developer license is held for this municipal thesis project, Apple Sign In cannot be registered or verified in production.
- **Decommissioning Actions**:
  - Remove the Apple sign-in button and its mock timeout simulation from `AuthModal.tsx`.
  - Simplify the social login UI in `AuthModal.tsx` to feature Google OAuth exclusively.
  - Remove `'apple'` provider handling and references from `supabaseService.ts` and auth types.

---

## 4. Supabase Configuration & Provider Setup Requirements

### 4.1 Built-in SMTP & Email Templates
1. In the Supabase Dashboard under **Authentication > Email Templates > Confirm Signup**:
   - Change template subject to: `eHANAP Roxas - Your 6-Digit Verification Code`
   - Use token macro:
     ```html
     <h2>Welcome to eHANAP Roxas</h2>
     <p>Your 6-digit account verification code is:</p>
     <h1 style="font-size: 32px; letter-spacing: 4px; font-family: monospace;">{{ .Token }}</h1>
     <p>This code will expire in 10 minutes.</p>
     ```
2. Under **Authentication > Email Templates > Reset Password**:
   - Provide `{{ .Token }}` for 6-digit recovery OTP input.
3. **Environment Credentials** (`.env`):
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

### 4.2 Google Cloud Console Configuration
1. Open [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2. Create **OAuth Client ID** > **Web application**.
3. Set **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://ehanap.roxas.gov.ph` (production)
4. Set **Authorized redirect URIs**:
   - `https://<your-project-id>.supabase.co/auth/v1/callback`
5. Save **Client ID** and **Client Secret** into Supabase under **Authentication > Providers > Google**.

### 4.3 Apple Sign In: Excluded / Not Applicable
- **Status:** **REMOVED / OUT OF SCOPE**
- Apple Developer Program requires an active paid developer account ($99/year). Because this project does not possess an Apple Developer license, Apple OAuth cannot be registered in the Apple Developer Member Center and is formally removed from Supabase provider configuration and frontend UI.

---

## 5. Offline Fallback & Academic Defense Invariant

To guarantee 100% reliability during local academic thesis defense, connectivity drops, or unconfigured offline environments:
1. `isSupabaseConfigured()` checks if credentials are non-placeholder and valid URL format.
2. When offline or not configured:
   - `sendOtp` falls back cleanly to generating a local code displayed in an accessible banner/toast.
   - Master code `'123456'` remains valid for seamless evaluative testing.
   - Google login cleanly mounts demo personas (`Maria Santos` for Seeker, `Mindoro Harvest` for Employer) with zero crashes or hanging states. (Apple login button is removed from UI).
   - Demo Persona Switcher pill (`DemoPersonaPill.tsx`) remains directly accessible for 1-click evaluation.

---

## 6. Implementation Work Packages

| Work Package | ID | Scope & Objectives | Target Deliverables |
| :--- | :--- | :--- | :--- |
| **WP-01** | `AUTH-OTP-SIGNUP` | **Native Supabase Sign-Up & 6-Digit OTP**<br>Replace simulated OTP in registration with `supabase.auth.signUp` and `verifyOtp(type: 'signup')`. Add resend timer. | [AuthContext.tsx](file:///home/keil/eHANAP/src/context/AuthContext.tsx), [AuthModal.tsx](file:///home/keil/eHANAP/src/views/AuthModal.tsx), [supabaseService.ts](file:///home/keil/eHANAP/src/services/supabaseService.ts) |
| **WP-02** | `AUTH-OTP-RECOVERY` | **Native Supabase Password Recovery OTP**<br>Replace simulated recovery with `supabase.auth.resetPasswordForEmail` and `verifyOtp(type: 'recovery')`. | [AuthContext.tsx](file:///home/keil/eHANAP/src/context/AuthContext.tsx), [AuthModal.tsx](file:///home/keil/eHANAP/src/views/AuthModal.tsx) |
| **WP-03** | `AUTH-OAUTH-PROVIDERS` | **Google OAuth Live Pipeline & Apple Removal**<br>Wire Google OAuth via `signInWithSupabaseOAuth('google')`. Remove the Apple login button and its mock logic from `AuthModal.tsx`. Handle post-auth role routing and profile completion. | [supabaseService.ts](file:///home/keil/eHANAP/src/services/supabaseService.ts), [AuthModal.tsx](file:///home/keil/eHANAP/src/views/AuthModal.tsx), [AuthContext.tsx](file:///home/keil/eHANAP/src/context/AuthContext.tsx) |
| **WP-04** | `AUTH-VERIFY-SUITE` | **Verification Test Suite & Offline Safeguards**<br>Automated verification script asserting live and offline behavior across all 3 flows, ensuring zero lint/build regressions. | `scripts/verify-auth-otp-oauth.ts` |

---

## 7. Definition of Done

1. Registration form sends a genuine 6-digit OTP code to the registrant's email via Supabase Auth when configured.
2. Entering the 6-digit code in `AuthModal.tsx` verifies the token with Supabase and sets `isAccountVerified: true`.
3. Password reset dispatches recovery OTP and updates user password in Supabase.
4. Clicking **Google** initiates standard Supabase OAuth redirect flow. Apple Sign In button is completely removed from `AuthModal.tsx`.
5. Offline / demo fallback operates without network errors if Supabase keys are absent or unreachable.
6. `npm run lint` (`tsc --noEmit`) passes with 0 errors.
7. `npm test` passes with 0 regressions.
8. `npm run build` bundles cleanly.
