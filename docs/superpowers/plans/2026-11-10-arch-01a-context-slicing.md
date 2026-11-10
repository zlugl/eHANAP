# ARCH-01a: Context Slicing (UI Feedback & Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slice `ToastContext`, `NotificationContext`, and `AuthContext` out of monolithic `AppContext.tsx`, stop re-render cascades on toast/notification updates, eliminate ~1,000 lines of technical debt from `AppContext.tsx`, and preserve full backwards compatibility via composite provider composition.

**Architecture:** 
1. Create `src/context/ToastContext.tsx` providing `activeToast`, `showToast`, and `dismissToast`. Connect `JobMatchToastContainer` to `useToast()`, so toast updates only re-render the toast UI.
2. Create `src/context/NotificationContext.tsx` providing `notifications`, `addNotification`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification`, and `clearAllNotifications`. Connect `NotificationDrawer` to `useNotification()`.
3. Create `src/context/AuthContext.tsx` managing user session, demo accounts, Google OAuth, OTP verification, password recovery, and multi-role switching (`currentUser`, `currentRole`, `switchDemoRole`, `loginAs`, `continueWithGoogle`, `logout`, `registerUser`, `sendOtp`, `verifyOtp`, `recoverPassword`). Connect `AuthModal` to `useAuth()`.
4. Compose providers inside `AppProvider` in `src/context/AppContext.tsx` and provide backwards-compatible `useApp()` re-exporting all methods, and barrel export all contexts via `src/context/index.ts`.
5. Verify isolated contexts and full regression safety across all 424 tests with a dedicated `scripts/verify-arch01-context-slicing.ts` suite.

**Tech Stack:** TypeScript, React 19, Supabase Client (`@supabase/supabase-js`), Node.js TSX test runner, Vite.

**Spec:** [SPEC.md](file:///home/keil/eHANAP/SPEC.md#L42-L52) (ARCH-01: Monolithic Global Context as Universal State & Business Hub, Priority 4: ARCH-01a).

## Global Constraints

- **Scope Limit**: Implement only ARCH-01a (Priority 4). Do not alter ATS scoring, Decision Tree algorithms, or unrelated views.
- **Backwards Compatibility**: All 48 existing presentation components importing `useApp()` must continue to work without breaking changes or missing properties.
- **Re-render Isolation**: `activeToast` updates must not re-render data views (e.g. `JobSearchPage`, `SeekerDashboard`, `AdminDashboard`).
- **Verification Rule**: Pass `npm run lint` (`tsc --noEmit`) with 0 errors.
- **Regression Invariant**: All 424 existing automated test assertions across 8 suites (`npm test`) plus all prior architecture verification suites (`verify-arch02`, `verify-arch03`, `verify-arch06`) must pass with 0 regressions.
- **Lines of Code Reduction**: Reduce `src/context/AppContext.tsx` size by ~800 to 1,000 lines.

## Review Focus

1. **Dual Signature `showToast` Compatibility**: Some callers pass an object `{ title, message, type }` while legacy callers pass `(message: string, type?: string)`. `ToastContext` must safely handle both formats without runtime errors.
2. **Session & Profile Synchronization**: When `loginAs` or `switchDemoRole` executes, the current seeker and employer profiles must correctly hydrate alongside `currentUser`.
3. **Demo Account Case-Insensitivity**: Demo account email lookup and role aliases (`seeker`, `job_seeker`, `employer`, `admin`) must resolve identically across `AuthContext` and `AppContext`.
4. **Clean Provider Hierarchy**: Providers must nest deterministically: `<ToastProvider>` -> `<NotificationProvider>` -> `<AuthProvider>` -> `<AppContext.Provider>` -> `{children}` so inner contexts have access to toast and notification actions.
5. **Real-time Listener Isolation**: Table listeners for `notifications` and `users` must be isolated to their respective context providers with clean unsubscription handles on unmount.

---

### Task 1: UI Feedback Context (`src/context/ToastContext.tsx`)

**Files:**
- Create: `src/context/ToastContext.tsx`
- Modify: `src/components/JobMatchToastContainer.tsx`
- Test: `scripts/verify-arch01-context-slicing.ts`

**Interfaces:**
- Produces:
  - `ToastContext`: React Context
  - `ToastProvider`: React Component
  - `useToast()`: Hook returning `{ activeToast, showToast, dismissToast }`
  - Types: `ToastNotification`, `ToastContextType`

- [ ] **Step 1: Write verification test for ToastContext**
Create `scripts/verify-arch01-context-slicing.ts` asserting:
- `src/context/ToastContext.tsx` exists and exports `ToastContext`, `ToastProvider`, `useToast`.
- `showToast` accepts both object payload `{ title, message, type }` and string `(message, type)`.
- `JobMatchToastContainer.tsx` imports and consumes `useToast` directly.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: FAIL due to missing `ToastContext.tsx`.

- [ ] **Step 3: Implement `src/context/ToastContext.tsx` and update `JobMatchToastContainer.tsx`**
- Implement `ToastContext`, `ToastProvider`, `useToast()`.
- Add auto-dismiss timer logic or clean dispatching.
- Update `JobMatchToastContainer.tsx` to consume `useToast()`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: PASS Task 1 assertions.

- [ ] **Step 5: Commit**
```bash
git add src/context/ToastContext.tsx src/components/JobMatchToastContainer.tsx scripts/verify-arch01-context-slicing.ts
git commit -m "feat(context): extract ToastContext and isolate toast re-renders from global state (ARCH-01a Task 1)"
```

---

### Task 2: Notification Context (`src/context/NotificationContext.tsx`)

**Files:**
- Create: `src/context/NotificationContext.tsx`
- Modify: `src/components/NotificationDrawer.tsx`
- Test: `scripts/verify-arch01-context-slicing.ts`

**Interfaces:**
- Produces:
  - `NotificationContext`: React Context
  - `NotificationProvider`: React Component
  - `useNotification()`: Hook returning `{ notifications, unreadCount, addNotification, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, setNotifications }`
  - Types: `NotificationItem`, `NotificationContextType`

- [ ] **Step 1: Add NotificationContext tests to `scripts/verify-arch01-context-slicing.ts`**
Verify:
- `src/context/NotificationContext.tsx` exists and exports `NotificationContext`, `NotificationProvider`, `useNotification`.
- `addNotification` adds item and resolves type fallback.
- `markNotificationRead` and `markAllNotificationsRead` update read status.
- `deleteNotification` and `clearAllNotifications` remove targets.
- `NotificationDrawer.tsx` consumes `useNotification`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: FAIL due to missing `NotificationContext.tsx`.

- [ ] **Step 3: Implement `src/context/NotificationContext.tsx` and update `NotificationDrawer.tsx`**
- Implement `NotificationProvider` with Supabase table subscription, local fallback state, and action handlers.
- Update `NotificationDrawer.tsx` to consume `useNotification()`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: PASS Task 2 assertions.

- [ ] **Step 5: Commit**
```bash
git add src/context/NotificationContext.tsx src/components/NotificationDrawer.tsx scripts/verify-arch01-context-slicing.ts
git commit -m "feat(context): extract NotificationContext and decouple notification mutations (ARCH-01a Task 2)"
```

---

### Task 3: Auth & Session Context (`src/context/AuthContext.tsx`)

**Files:**
- Create: `src/context/AuthContext.tsx`
- Modify: `src/views/AuthModal.tsx`
- Test: `scripts/verify-arch01-context-slicing.ts`

**Interfaces:**
- Produces:
  - `AuthContext`: React Context
  - `AuthProvider`: React Component
  - `useAuth()`: Hook returning `{ currentUser, currentRole, isAuthenticated, switchUserRole, switchDemoRole, loginAs, continueWithGoogle, logout, registerUser, sendOtp, verifyOtp, recoverPassword, users, setUsers, isSupabaseConnected, isSyncing }`
  - Types: `User`, `UserRole`, `AuthContextType`

- [ ] **Step 1: Add AuthContext tests to `scripts/verify-arch01-context-slicing.ts`**
Verify:
- `src/context/AuthContext.tsx` exists and exports `AuthContext`, `AuthProvider`, `useAuth`.
- Demo accounts resolution (`switchDemoRole`) returns valid persona and role.
- OTP generation and verification flows.
- `AuthModal.tsx` consumes `useAuth` and `useToast`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: FAIL due to missing `AuthContext.tsx`.

- [ ] **Step 3: Implement `src/context/AuthContext.tsx` and update `AuthModal.tsx`**
- Implement `AuthProvider` with Supabase Auth listener, demo switcher, OTP handling, user persistence, and role switching.
- Update `AuthModal.tsx` to consume `useAuth` and `useToast`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: PASS Task 3 assertions.

- [ ] **Step 5: Commit**
```bash
git add src/context/AuthContext.tsx src/views/AuthModal.tsx scripts/verify-arch01-context-slicing.ts
git commit -m "feat(context): extract AuthContext for multi-role session and credential lifecycle (ARCH-01a Task 3)"
```

---

### Task 4: Modular Composite Provider & AppContext Refactoring (`src/context/AppContext.tsx`, `src/context/index.ts`, `src/App.tsx`)

**Files:**
- Modify: `src/context/AppContext.tsx`
- Create: `src/context/index.ts`
- Modify: `src/App.tsx`
- Test: `scripts/verify-arch01-context-slicing.ts`

**Interfaces:**
- Consumes: `ToastContext`, `NotificationContext`, `AuthContext`
- Produces:
  - Pruned `AppContext.tsx` (reduced by ~800 to 1,000 lines).
  - Clean composite provider tree in `AppProvider`.
  - Fully backwards-compatible `useApp()` exposing unified API.
  - Barrel exports in `src/context/index.ts`.

- [ ] **Step 1: Add provider composition and line count tests to `scripts/verify-arch01-context-slicing.ts`**
Verify:
- `AppContext.tsx` line count is reduced by at least 600 lines from baseline (target: ~1,000 lines pruned).
- `src/context/index.ts` exports all contexts, providers, and hooks.
- `useApp()` provides all legacy methods with zero missing fields.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: FAIL due to missing barrel export and AppContext not yet pruned.

- [ ] **Step 3: Refactor `AppContext.tsx` and create `src/context/index.ts`**
- Remove extracted toast, notification, and auth implementations from `AppContext.tsx`.
- Wrap child context with `ToastProvider`, `NotificationProvider`, `AuthProvider`.
- Re-export methods through `useApp()` to ensure complete backwards compatibility.
- Create `src/context/index.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
Expected: PASS Task 4 assertions.

- [ ] **Step 5: Commit**
```bash
git add src/context/AppContext.tsx src/context/index.ts src/App.tsx scripts/verify-arch01-context-slicing.ts
git commit -m "refactor(context): compose sliced providers and prune 800+ lines from AppContext (ARCH-01a Task 4)"
```

---

### Task 5: Full Regression Testing & Architecture Progress Documentation

**Files:**
- Modify: `PROGRESS.md`
- Test: Full verification suite (`npm test`, `npm run lint`, `npm run build`, and all `scripts/verify-arch*`)

- [ ] **Step 1: Run comprehensive verification suite**
Run:
- `npx tsx scripts/verify-arch01-context-slicing.ts`
- `npx tsx scripts/verify-arch02-retire-firebase.ts`
- `npx tsx scripts/verify-arch03-storage-unification.ts`
- `npx tsx scripts/verify-arch06-constants-extraction.ts`
- `npm test`
- `npm run lint`
- `npm run build`

- [ ] **Step 2: Update `PROGRESS.md`**
Mark Priority 4 (ARCH-01a) as **COMPLETED** with:
- Detailed scope delivered (ToastContext, NotificationContext, AuthContext, line reduction, re-render protection).
- Verification metrics and test pass counts.

- [ ] **Step 3: Commit**
```bash
git add PROGRESS.md
git commit -m "docs: complete ARCH-01a context slicing refactoring milestone"
```
