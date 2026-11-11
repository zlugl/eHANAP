# ARCH-05: Route-Level Code-Splitting & Dynamic Export Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate monolithic bundle bloat by lazy-loading protected role views (Admin, Employer, Seeker) with React Suspense and dynamically importing heavy export utilities (`jspdf`, `html2canvas`), dramatically reducing the initial bundle size and accelerating Largest Contentful Paint (LCP) for mobile job seekers.

**Architecture:** 
1. Isolate PDF export operations into a lazy-loaded dynamic utility (`src/utils/pdfExport.ts`) that imports `jspdf` and `html2canvas` only upon user invocation.
2. Implement a branded, flicker-free Suspense fallback (`src/components/RouteLoadingFallback.tsx`) adhering to the Paper & Ink Hallmark design system.
3. Convert all protected role-specific views (Admin, Employer, Seeker) and heavy modals in `src/App.tsx` to `React.lazy()`, preserving public routes (`LandingPage`, `JobSearchPage`, `JobDetailPage`, `EmployerSearchPage`) for instant first-paint performance.
4. Configure Rollup chunk splitting in `vite.config.ts` to isolate charting engines (`recharts`) and animation primitives into separate on-demand chunks.
5. Create an automated verification suite `scripts/verify-arch05-code-splitting.ts` to enforce code-splitting boundaries, bundle size budgets, and zero static export imports.

**Tech Stack:** React 19 (`React.lazy`, `Suspense`), TypeScript 5.8, Vite 6.2 (Rollup code-splitting), Motion, Tailwind CSS v4, jsPDF, html2canvas.

**Spec:** [SPEC.md](file:///home/keil/eHANAP/SPEC.md#L113-L126) (Section 5: Monolithic Bundle & Total Lack of Route Code-Splitting) and [PROGRESS.md](file:///home/keil/eHANAP/PROGRESS.md#L23).

---

## Global Constraints

- Preserve all 424 automated test assertions in `scripts/verify-milestone07.ts` (`npm test`).
- Preserve all prior architectural refactoring verification suites (`verify-arch03-storage-unification.ts`, `verify-arch06-constants-extraction.ts`, `verify-arch02-retire-firebase.ts`, `verify-arch01-context-slicing.ts`).
- `npm run lint` (`tsc --noEmit`) must pass with 0 errors.
- `npm run build` must succeed cleanly and produce split chunks without chunk bloat warnings.
- Public views (`LandingPage`, `JobSearchPage`, `JobDetailPage`, `EmployerSearchPage`) must remain synchronously accessible without flash of empty screen on first landing.
- Navigation contract in `App.tsx` (route aliases, role gatekeeping, profile setup gates, view parameters) must remain 100% functional and backwards-compatible.

## Review Focus

1. **Named Export Interop in `React.lazy`**: Modules exporting named components (`export const AdminDashboard = ...`) must be wrapped with `.then(m => ({ default: m.ComponentName }))` so `React.lazy` does not encounter undefined default exports at runtime.
2. **Dynamic PDF Generation in Headless/Browser Fallback**: When `html2canvas` or `jspdf` fails or is cancelled, `exportElementToPdf` must safely handle errors and fall back gracefully to `window.print()` without throwing unhandled promise rejections.
3. **Suspense Boundary Placement**: `<Suspense>` must wrap lazy routes without breaking `AnimatePresence` route transition animations or causing whole-page layout shift.
4. **Deep-linking and URL / View Param Continuity**: Passing `viewParams` (e.g. `jobId`, `query`, `employerId`) to lazy-loaded views must preserve props across async chunk resolution.
5. **No Regressions in Admin / Employer / Seeker Modals**: Modals opened from navigation (`CreateJobModal`, `JobSubscriptionModal`, `SeekerBookmarksModal`, `AuthModal`) must function seamlessly regardless of lazy loading state.

---

### Task 1: Dynamic PDF & Canvas Export Utility

**Files:**
- Create: `src/utils/pdfExport.ts`
- Modify: `src/components/ResumePDFExportModal.tsx:1-80`
- Modify: `src/components/ResumeBuilderModal.tsx:1-190`
- Test: `scripts/verify-arch05-code-splitting.ts`

**Interfaces:**
- Consumes: `jspdf`, `html2canvas` (dynamically via `import()`)
- Produces: `exportElementToPdf(element: HTMLElement, fileName: string, options?: PdfExportOptions): Promise<boolean>`

- [ ] **Step 1: Write `src/utils/pdfExport.ts` with on-demand dynamic imports**
  - Define `PdfExportOptions` (`scale?: number`, `format?: string`, `orientation?: 'portrait' | 'landscape'`).
  - Implement `exportElementToPdf` using `await Promise.all([import('html2canvas'), import('jspdf')])`.
  - Handle default export unwrapping (`const html2canvas = html2canvasMod.default || html2canvasMod; const jsPDF = jspdfMod.default || jspdfMod.jsPDF || jspdfMod;`).
  - Gracefully catch errors, log to console, and call `window.print()`.

- [ ] **Step 2: Refactor `src/components/ResumePDFExportModal.tsx`**
  - Remove top-level static `import jsPDF from 'jspdf';` and `import html2canvas from 'html2canvas';`.
  - Replace the inlined canvas and PDF code in `handleDownloadPdf` with `await exportElementToPdf(resumeEl, fileName)`.

- [ ] **Step 3: Refactor `src/components/ResumeBuilderModal.tsx`**
  - Remove top-level static `import jsPDF from 'jspdf';` and `import html2canvas from 'html2canvas';`.
  - Replace inlined canvas and PDF logic in `handleDownloadPdf` with `await exportElementToPdf(resumeEl, fileName)`.

- [ ] **Step 4: Verify static absence of `jspdf` and `html2canvas` in component layer**
  - Run: `grep -rnE "^import.*(jspdf|html2canvas)" src/`
  - Expected: No occurrences found.

- [ ] **Step 5: Verify types and compilation**
  - Run: `npm run lint`
  - Expected: Clean compilation, 0 errors.

---

### Task 2: Branded Route Loading Fallback Shell

**Files:**
- Create: `src/components/RouteLoadingFallback.tsx`
- Test: `scripts/verify-arch05-code-splitting.ts`

**Interfaces:**
- Consumes: React, `lucide-react`
- Produces: `RouteLoadingFallback: React.FC<{ label?: string }>`

- [ ] **Step 1: Implement `src/components/RouteLoadingFallback.tsx`**
  - Create accessible loading container with `role="status"` and `aria-live="polite"`.
  - Style with Hallmark theme variables (`--color-paper`, `--color-paper-2`, `--color-rule`, `--color-accent-ink`).
  - Render a lightweight pulsing skeleton card with municipal seal / eHANAP branding and animated shimmer placeholder lines.
  - Include an accessible screen-reader announcement: `Loading portal content...`.

- [ ] **Step 2: Verify component exports and type check**
  - Run: `npm run lint`
  - Expected: Clean compilation, 0 errors.

---

### Task 3: Route-Level Code-Splitting in `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Test: `scripts/verify-arch05-code-splitting.ts`

**Interfaces:**
- Consumes: `React.lazy`, `Suspense`, `RouteLoadingFallback`
- Produces: Lazy-loaded route views for Admin, Employer, and Seeker roles with seamless suspense fallback.

- [ ] **Step 1: Create a type-safe lazy named helper in `src/utils/lazyImport.ts` (or in `src/App.tsx`)**
  - Helper: `const lazyNamed = <T extends Record<string, any>, K extends keyof T>(importer: () => Promise<T>, exportName: K) => React.lazy(() => importer().then(mod => ({ default: mod[exportName] })));`

- [ ] **Step 2: Convert Admin views in `src/App.tsx` to `React.lazy()`**
  - `AdminDashboard`
  - `AdminJobsPage`
  - `AdminUsersPage`
  - `AdminVerificationsPage`
  - `AdminReportsPage`
  - `AdminAuditLogsPage`
  - `AdminJobMatchingPage`
  - `AdminLraPage`

- [ ] **Step 3: Convert Employer views in `src/App.tsx` to `React.lazy()`**
  - `EmployerDashboard`
  - `EmployerJobsPage`
  - `EmployerApplicantsPage`
  - `EmployerInterviewsPage`
  - `EmployerAnalyticsPage`
  - `EmployerProfilePage`
  - `EmployerProfileSetupWizard`
  - `CreateJobModal`

- [ ] **Step 4: Convert Seeker views in `src/App.tsx` to `React.lazy()`**
  - `SeekerDashboard`
  - `SeekerApplicationsPage`
  - `SeekerInterviewsPage`
  - `SeekerProfilePage`
  - `SeekerProfileSetupWizard`

- [ ] **Step 5: Retain public views statically**
  - Retain `LandingPage`, `JobSearchPage`, `JobDetailPage`, `EmployerSearchPage`, `AuthModal` to ensure guest job seeker experience remains instant without additional network hops.

- [ ] **Step 6: Integrate `<Suspense fallback={<RouteLoadingFallback />}>`**
  - Wrap the conditional view render block inside the `<AnimatePresence>` container with `<Suspense fallback={<RouteLoadingFallback />}>`.
  - Wrap lazy modal (`CreateJobModal`) with Suspense as well.

- [ ] **Step 7: Verify compilation**
  - Run: `npm run lint`
  - Expected: Clean compilation, 0 errors.

---

### Task 4: Rollup Manual Chunk Optimization in `vite.config.ts`

**Files:**
- Modify: `vite.config.ts`
- Test: `scripts/verify-arch05-code-splitting.ts`

**Interfaces:**
- Consumes: Vite Rollup build options
- Produces: Granular chunk output isolating heavy third-party vendor dependencies (`vendor-recharts`, `vendor-pdf`, `vendor-motion`, `vendor-supabase`).

- [ ] **Step 1: Configure `manualChunks` in `vite.config.ts`**
  - Add `build.rollupOptions.output.manualChunks(id)`:
    - Route `jspdf` and `html2canvas` into chunk `vendor-pdf`.
    - Route `recharts` into chunk `vendor-charts`.
    - Route `motion` and `framer-motion` into chunk `vendor-motion`.
    - Route `@supabase/` into chunk `vendor-supabase`.
  - Adjust `build.chunkSizeWarningLimit` if needed once vendor chunks are split cleanly.

- [ ] **Step 2: Run production build and verify chunk distribution**
  - Run: `npm run build`
  - Expected: Clean build, `index.js` initial entry chunk significantly reduced from ~2,972 kB down to <1,000 kB (with charts, pdf, and role views in dedicated split chunks).

---

### Task 5: Automated Verification Suite & End-to-End Regression Testing

**Files:**
- Create: `scripts/verify-arch05-code-splitting.ts`
- Modify: `PROGRESS.md`
- Test: Full regression suite (`npm test`, all `verify-arch*.ts` scripts, `npm run lint`, `npm run build`)

**Interfaces:**
- Consumes: Source files, build outputs in `dist/assets`
- Produces: 5 verification suites with comprehensive assertion checks.

- [ ] **Step 1: Implement `scripts/verify-arch05-code-splitting.ts`**
  - Suite 1: Static Code Splitting in `App.tsx` (validates `React.lazy` on all Admin, Employer, and Seeker views; confirms `<Suspense>` boundary presence).
  - Suite 2: Elimination of Static `jspdf` / `html2canvas` imports across entire `src/` tree.
  - Suite 3: Validation of `src/utils/pdfExport.ts` helper and dynamic import contract.
  - Suite 4: Route Loading Fallback component accessibility and Hallmark styling.
  - Suite 5: Bundle distribution verification (inspects `dist/assets` to verify split chunks for vendor-charts, vendor-pdf, and views).

- [ ] **Step 2: Execute ARCH-05 verification script**
  - Run: `npx tsx scripts/verify-arch05-code-splitting.ts`
  - Expected: 100% assertions pass.

- [ ] **Step 3: Execute all prior refactoring verification scripts**
  - Run: `npx tsx scripts/verify-arch01-context-slicing.ts`
  - Run: `npx tsx scripts/verify-arch02-retire-firebase.ts`
  - Run: `npx tsx scripts/verify-arch03-storage-unification.ts`
  - Run: `npx tsx scripts/verify-arch06-constants-extraction.ts`
  - Expected: All pass with 0 failures.

- [ ] **Step 4: Execute full regression test suite**
  - Run: `npm test`
  - Expected: 424/424 tests passing.

- [ ] **Step 5: Run lint and production build**
  - Run: `npm run lint && npm run build`
  - Expected: 0 lint errors, clean build.

- [ ] **Step 6: Update `PROGRESS.md`**
  - Mark ARCH-05 as COMPLETED with full metrics and verification details.
