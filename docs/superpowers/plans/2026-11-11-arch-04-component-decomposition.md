# ARCH-04: Mega-Component Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the two largest God Views in the presentation layer — `src/components/Navbar.tsx` (1,440 lines) and `src/views/seeker/SeekerProfilePage.tsx` (2,894 lines) — into role-specific navigation subcomponents, modular tab/modal components, and a shared `useSeekerProfileForm` hook, eliminating merge-conflict bottlenecks and reducing each orchestrator file below 450 lines.

**Architecture:**
1. **Navbar Decomposition (`src/components/navbar/`)**:
   - Split persona navigation links into dedicated subcomponents: `GuestNav.tsx`, `SeekerNav.tsx`, `EmployerNav.tsx`, `AdminNav.tsx`.
   - Isolate action controls into `DemoPersonaPill.tsx` (1-click thesis persona switcher), `UserProfileDropdown.tsx` (avatar, profile links, logout, and demo switcher), `MobileRoleQuickNav.tsx` (tablet/mobile quick tab strip), and `MobileNavDrawer.tsx` (full mobile drawer menu).
   - Export a barrel `src/components/navbar/index.ts` and refactor `src/components/Navbar.tsx` into a lean (< 250 lines) orchestrator that composes these modules while keeping `NavbarProps` 100% backwards-compatible.
2. **Shared Seeker Profile Hook (`src/hooks/useSeekerProfileForm.ts`)**:
   - Extract form state, avatar file reader with size validation, personal bio fields, address/barangay selection, and profile mutation handlers into a strongly typed, reusable hook.
3. **SeekerProfilePage Decomposition (`src/views/seeker/components/`)**:
   - Extract presentation cards: `SeekerProfileHeader.tsx` (photo, name, social links, advocacy narrative, contact details) and `SeekerCareerToolsGrid.tsx` (action cards for career tools and profile sections).
   - Extract tabbed modal sections: `BioPersonalSection.tsx`, `EducationSection.tsx`, `ExperienceSection.tsx`, `SkillsSection.tsx`, `CertificationsSection.tsx`, `ResumesSection.tsx` inside `SeekerPersonalInfoModal.tsx`.
   - Extract specialized modals: `SeekerRecordModals.tsx` (Education, Experience, and Certification modals with certificate proof preview), `SeekerMatchReadinessModal.tsx`, `SeekerJobPreferencesModal.tsx`, `SeekerFullProfileOverviewModal.tsx`, `SeekerUtilityModals.tsx` (Language, Help, Privacy, Invite), and `SeekerBottomNav.tsx`.
   - Export a barrel `src/views/seeker/components/index.ts` and refactor `src/views/seeker/SeekerProfilePage.tsx` into an orchestrator (< 450 lines) preserving all props (`onNavigate`, `params`) and route behavior.
4. **Automated Verification Harness (`scripts/verify-arch04-component-decomposition.ts`)**:
   - Validate line count reductions, file structure, exports, prop contracts, hook hydration, and zero regressions across all 424 core tests and prior arch suites.

**Tech Stack:** TypeScript 5.8, React 19, Lucide React, Framer Motion (`motion/react`), Vitest / TSX test runner.

**Spec:** [SPEC.md](file:///home/keil/eHANAP/SPEC.md#L93-L111) (Section 4: Mega-Component God Views) and [PROGRESS.md](file:///home/keil/eHANAP/PROGRESS.md#L25).

---

## Global Constraints

- Preserve all 424 automated test assertions in `scripts/verify-milestone07.ts` (`npm test`).
- Preserve all prior architectural refactoring verification suites (`verify-arch01-context-slicing.ts`, `verify-arch02-retire-firebase.ts`, `verify-arch03-storage-unification.ts`, `verify-arch05-code-splitting.ts`, `verify-arch06-constants-extraction.ts`, `verify-arch07-match-resolver.ts`).
- `npm run lint` (`tsc --noEmit`) must pass with 0 errors.
- `npm run build` must succeed cleanly with all chunks intact.
- Zero breaking changes to `Navbar` props (`currentView`, `onNavigate`, `onOpenAuth`, `onOpenSubscriptions`, `onOpenPostJobModal`) or `SeekerProfilePage` props (`onNavigate`, `params`).
- Line count gates:
  - `src/components/Navbar.tsx` must be reduced from 1,440 lines down to **<= 350 lines** (target < 250 lines).
  - `src/views/seeker/SeekerProfilePage.tsx` must be reduced from 2,894 lines down to **<= 450 lines** (target < 380 lines).
- Every newly created component must have explicit TypeScript interface props and maintain Hallmark design styling (`--color-paper`, `--color-rule`, `--color-ink`, `--color-accent`).

## Review Focus

1. **Role Navigation Separation**: Switching demo roles via `DemoPersonaPill` or `UserProfileDropdown` must seamlessly update the visible navigation tabs and mobile drawer without stale role states.
2. **Avatar Image Upload & Compression**: Avatar upload in `SeekerProfileHeader` and `useSeekerProfileForm` must enforce the 5MB file size limit, convert to DataURL safely, and notify user via `showToast`.
3. **Modal State & Accordion Isolation**: Adding/editing an education, work experience, or certification record must immediately reflect in both the modal lists and profile summary without re-rendering unrelated tabs.
4. **Mobile Navigation Responsiveness**: The bottom mobile bar (`SeekerBottomNav`) and quick role nav strip (`MobileRoleQuickNav`) must maintain proper viewport breakpoints (`lg:hidden`) and active route highlight tokens.
5. **Backwards Compatibility of Root Exports**: Any existing imports of `Navbar` from `src/components/Navbar` and `SeekerProfilePage` from `src/views/seeker/SeekerProfilePage` must remain identical drop-in replacements.

---

### Task 1: Create ARCH-04 Automated Verification Test Suite (`scripts/verify-arch04-component-decomposition.ts`)

**Files:**
- Create: `scripts/verify-arch04-component-decomposition.ts`

**Interfaces:**
- Consumes: `fs`, `path`, `child_process`.
- Produces: 5 verification suites testing:
  1. Navbar decomposition architecture (file existence, role separation, line count reduction <= 350 lines).
  2. `useSeekerProfileForm` hook contract (state hydration, fields, handlers).
  3. SeekerProfilePage decomposition architecture (modular sections, record modals, line count reduction <= 450 lines).
  4. Static analysis, clean barrel exports, and zero duplicate definitions.
  5. System regression check and build validation.

- [ ] **Step 1: Write the failing verification test harness**

Create `scripts/verify-arch04-component-decomposition.ts` with assertions for all required files, modular component exports, and line count boundaries:
```typescript
// scripts/verify-arch04-component-decomposition.ts
import fs from 'fs';
import path from 'path';

// Suite 1: Navbar Decomposition & Line Count Reduction
// Suite 2: Seeker Profile Hook & State Encapsulation
// Suite 3: Seeker Profile Page Decomposition & Modularity
// Suite 4: Barrel Exports & Static Type Integrity
// Suite 5: Full Regression Parity
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch04-component-decomposition.ts`
Expected: FAIL with missing subcomponents (`src/components/navbar/GuestNav.tsx` not found).

- [ ] **Step 3: Commit initial verification harness**

```bash
git add scripts/verify-arch04-component-decomposition.ts
git commit -m "test(arch-04): add automated verification suite for mega-component decomposition"
```

---

### Task 2: Decompose `Navbar.tsx` into Role-Specific Components (`src/components/navbar/`)

**Files:**
- Create: `src/components/navbar/GuestNav.tsx`
- Create: `src/components/navbar/SeekerNav.tsx`
- Create: `src/components/navbar/EmployerNav.tsx`
- Create: `src/components/navbar/AdminNav.tsx`
- Create: `src/components/navbar/DemoPersonaPill.tsx`
- Create: `src/components/navbar/UserProfileDropdown.tsx`
- Create: `src/components/navbar/MobileRoleQuickNav.tsx`
- Create: `src/components/navbar/MobileNavDrawer.tsx`
- Create: `src/components/navbar/index.ts`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `useApp` from `src/context/AppContext`, `isSeekerProfileComplete`, `isEmployerProfileComplete` from `src/utils/routeGuards`, `getFilteredUserNotifications` from `src/utils/notificationUtils`.
- Produces:
  - `GuestNav: React.FC<{ currentView: string; onNavigate: (v: string) => void }>`
  - `SeekerNav: React.FC<{ currentView: string; onNavigate: (v: string) => void; isSeekerIncomplete: boolean }>`
  - `EmployerNav: React.FC<{ currentView: string; onNavigate: (v: string) => void; isEmployerIncomplete: boolean; onOpenPostJobModal?: () => void }>`
  - `AdminNav: React.FC<{ currentView: string; onNavigate: (v: string) => void }>`
  - `DemoPersonaPill: React.FC<{ currentRole?: string; onSwitchRole: (role: 'job_seeker' | 'employer' | 'admin') => void; className?: string }>`
  - `UserProfileDropdown: React.FC<{ userDisplayName: string; onNavigate: (v: string) => void; onLogout: () => void; onSwitchRole: (role: any) => void; onOpenSubscriptions?: () => void }>`
  - `MobileRoleQuickNav: React.FC<{ currentView: string; currentUser: any; isSeekerIncomplete: boolean; isEmployerIncomplete: boolean; onNavigate: (v: string) => void }>`
  - `MobileNavDrawer: React.FC<{ isOpen: boolean; onClose: () => void; currentView: string; currentUser: any; userDisplayName: string; unreadNotifs: number; onNavigate: (v: string) => void; onLogout: () => void; onSwitchRole: (role: any) => void; onOpenAuth: (mode: 'login' | 'register', role?: any) => void; onOpenSubscriptions?: () => void; onOpenPostJobModal?: () => void }>`
  - `Navbar: React.FC<NavbarProps>` (< 250 lines)

- [ ] **Step 1: Create `src/components/navbar/DemoPersonaPill.tsx`**

Extract 1-click thesis defense persona switcher pill with Seeker, Employer, and PESO buttons with active role styling.

- [ ] **Step 2: Create desktop role navigation components**

Create:
- `src/components/navbar/GuestNav.tsx` (Home, Vacancies, Employers, How it works)
- `src/components/navbar/SeekerNav.tsx` (Home, Vacancies, Applications, Interviews)
- `src/components/navbar/EmployerNav.tsx` (Home, Vacancies, Candidates & Ranking, Interviews, Analytics, Company Profile, Post Vacancy button)
- `src/components/navbar/AdminNav.tsx` (Home, Verify Employers, Vacancies, Registry, Reports, Audit Logs)

- [ ] **Step 3: Create `src/components/navbar/UserProfileDropdown.tsx`**

Extract authenticated user dropdown: avatar, name, email, role badge, role-specific quick links (My profile, Vacancies count, PESO center), 1-click demo switcher buttons, and Sign Out button.

- [ ] **Step 4: Create mobile navigation components**

Create:
- `src/components/navbar/MobileRoleQuickNav.tsx` (responsive 4/5-column tab bar for logged in seekers, employers, and admins).
- `src/components/navbar/MobileNavDrawer.tsx` (slide-out/dropdown mobile navigation with auth buttons, demo switcher, and navigation items).

- [ ] **Step 5: Create barrel export `src/components/navbar/index.ts`**

Export all subcomponents from `src/components/navbar/index.ts`.

- [ ] **Step 6: Refactor `src/components/Navbar.tsx`**

Re-implement `Navbar.tsx` as an orchestrator importing from `./navbar`:
- Renders header, logo, LGU seal, Supabase connection indicator.
- Renders the appropriate role navigation component (`GuestNav`, `SeekerNav`, `EmployerNav`, `AdminNav`).
- Renders action controls: Job alerts button, notification bell with `NotificationDrawer`, `DemoPersonaPill`, `UserProfileDropdown`, mobile hamburger toggle.
- Renders `MobileRoleQuickNav` and `MobileNavDrawer`.
- Line count target: <= 250 lines (must pass <= 350 lines check).

- [ ] **Step 7: Run verification test suite for Suite 1**

Run: `npx tsx scripts/verify-arch04-component-decomposition.ts`
Expected: Suite 1 (Navbar decomposition) passes.

- [ ] **Step 8: Commit Navbar decomposition**

```bash
git add src/components/navbar/ src/components/Navbar.tsx
git commit -m "refactor(arch-04): decompose Navbar into role-specific navigation modules"
```

---

### Task 3: Create Reusable Seeker Profile Form Hook (`src/hooks/useSeekerProfileForm.ts`)

**Files:**
- Create: `src/hooks/useSeekerProfileForm.ts`

**Interfaces:**
- Consumes: `useApp` from `src/context/AppContext`, `JobSeekerProfile`, `User` from `src/types.ts`.
- Produces: `useSeekerProfileForm(seekerProfile, options)` returning:
  - Form state: `firstName`, `middleName`, `lastName`, `dateOfBirth`, `age`, `civilStatus`, `sex`, `barangay`, `municipality`, `address`, `contactNumber`, `summary`, `primaryDegree`, `educationalAttainment`, `profilePicture`.
  - Setters for all fields.
  - Job preference state: `prefCategories`, `prefMunicipalities`, `prefEmploymentTypes`, `prefMinSalary`, and their setters.
  - Handlers: `handleAvatarFileUpload`, `handleSavePersonalInfo`, `handleSavePreferences`, `resetForm`.

- [ ] **Step 1: Write failing test assertion for `useSeekerProfileForm`**

In `scripts/verify-arch04-component-decomposition.ts`, implement Suite 2 checking export and return contract of `useSeekerProfileForm`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch04-component-decomposition.ts`
Expected: FAIL with "Cannot find module '../src/hooks/useSeekerProfileForm'".

- [ ] **Step 3: Implement `src/hooks/useSeekerProfileForm.ts`**

Implement hook with full state management, hydration on profile changes, avatar upload validation (5MB max), and profile update helpers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch04-component-decomposition.ts`
Expected: Suite 2 PASSES.

- [ ] **Step 5: Commit profile form hook**

```bash
git add src/hooks/useSeekerProfileForm.ts
git commit -m "feat(arch-04): extract reusable useSeekerProfileForm hook"
```

---

### Task 4: Extract Seeker Profile Sub-Modals (`src/views/seeker/components/`)

**Files:**
- Create: `src/views/seeker/components/SeekerRecordModals.tsx`
- Create: `src/views/seeker/components/SeekerMatchReadinessModal.tsx`
- Create: `src/views/seeker/components/SeekerJobPreferencesModal.tsx`
- Create: `src/views/seeker/components/SeekerFullProfileOverviewModal.tsx`
- Create: `src/views/seeker/components/SeekerUtilityModals.tsx`

**Interfaces:**
- Consumes: `EducationRecord`, `WorkExperienceRecord`, `CertificationRecord`, `JobSeekerProfile` from `src/types.ts`, `useApp` from `src/context/AppContext`.
- Produces:
  - `EducationModal`, `ExperienceModal`, `CertificationModal`, `CertificateLightbox` in `SeekerRecordModals.tsx`.
  - `SeekerMatchReadinessModal` in `SeekerMatchReadinessModal.tsx`.
  - `SeekerJobPreferencesModal` in `SeekerJobPreferencesModal.tsx`.
  - `SeekerFullProfileOverviewModal` in `SeekerFullProfileOverviewModal.tsx`.
  - `SeekerLanguageModal`, `SeekerHelpModal`, `SeekerPrivacyModal`, `SeekerInviteModal` in `SeekerUtilityModals.tsx`.

- [ ] **Step 1: Implement `src/views/seeker/components/SeekerRecordModals.tsx`**

Extract `EducationModal` (school, degree, field, start/end year, current checkbox), `ExperienceModal` (company, position, description, start/end date, current checkbox), `CertificationModal` (title, issuer, issue date, credential ID, certificate image upload), and `CertificateLightbox` preview.

- [ ] **Step 2: Implement `src/views/seeker/components/SeekerMatchReadinessModal.tsx`**

Extract Modal 2 (Analytics & Decision Tree Match Readiness with score indicator, Decision Tree node factors, and profile completeness checklist).

- [ ] **Step 3: Implement `src/views/seeker/components/SeekerJobPreferencesModal.tsx`**

Extract Modal 3 (Job Seeking Status & Preferences: availability status, industry category pills, target municipalities in Oriental Mindoro, salary expectation).

- [ ] **Step 4: Implement `src/views/seeker/components/SeekerFullProfileOverviewModal.tsx`**

Extract Modal 9 (Full Profile Overview modal with printable/shareable resume review cards for Contact, About Me, Work History, Education, Projects, Volunteer, Awards, and Skills).

- [ ] **Step 5: Implement `src/views/seeker/components/SeekerUtilityModals.tsx`**

Extract utility modals: Language selection, Help Center with FAQ accordions, Privacy Policy with Roxas data protection terms, and Invite Friends modal with copy link.

- [ ] **Step 6: Run verification test suite**

Run: `npx tsx scripts/verify-arch04-component-decomposition.ts`
Expected: Modals verified.

- [ ] **Step 7: Commit extracted profile modals**

```bash
git add src/views/seeker/components/SeekerRecordModals.tsx src/views/seeker/components/SeekerMatchReadinessModal.tsx src/views/seeker/components/SeekerJobPreferencesModal.tsx src/views/seeker/components/SeekerFullProfileOverviewModal.tsx src/views/seeker/components/SeekerUtilityModals.tsx
git commit -m "refactor(arch-04): extract specialized seeker profile modals"
```

---

### Task 5: Decompose Profile Hero Card, Career Tools, Sections & Tab Modals

**Files:**
- Create: `src/views/seeker/components/SeekerProfileHeader.tsx`
- Create: `src/views/seeker/components/SeekerCareerToolsGrid.tsx`
- Create: `src/views/seeker/components/sections/BioPersonalSection.tsx`
- Create: `src/views/seeker/components/sections/EducationSection.tsx`
- Create: `src/views/seeker/components/sections/ExperienceSection.tsx`
- Create: `src/views/seeker/components/sections/SkillsSection.tsx`
- Create: `src/views/seeker/components/sections/CertificationsSection.tsx`
- Create: `src/views/seeker/components/sections/ResumesSection.tsx`
- Create: `src/views/seeker/components/SeekerPersonalInfoModal.tsx`
- Create: `src/views/seeker/components/SeekerBottomNav.tsx`
- Create: `src/views/seeker/components/index.ts`

**Interfaces:**
- Consumes: `useApp`, `useSeekerProfileForm`, domain types.
- Produces:
  - `SeekerProfileHeader: React.FC<...>`
  - `SeekerCareerToolsGrid: React.FC<...>`
  - `SeekerPersonalInfoModal: React.FC<...>`
  - `SeekerBottomNav: React.FC<...>`
  - Barrel exports in `src/views/seeker/components/index.ts`.

- [ ] **Step 1: Implement `SeekerProfileHeader.tsx`**

Extract the top portrait card: avatar with camera trigger, full name, profession badge, social link icons, edit info button, bio narrative, skills tags, contact details, and advocacy statement.

- [ ] **Step 2: Implement `SeekerCareerToolsGrid.tsx`**

Extract the 6 management cards: Personal Information & Portfolio, Match Readiness, Job Seeking Preferences, My Resumes & Documents, Settings & Account, Saved Bookmarks.

- [ ] **Step 3: Implement individual tab sections under `src/views/seeker/components/sections/`**

Create:
- `BioPersonalSection.tsx`: Personal details form (name, birthday, civil status, sex, address, barangay, degree, summary, avatar presets).
- `EducationSection.tsx`: Education history list, add education button, edit/delete actions.
- `ExperienceSection.tsx`: Work history list, add work experience button, edit/delete actions.
- `SkillsSection.tsx`: Skill taxonomy pills, custom skill entry, category grouping.
- `CertificationsSection.tsx`: Certifications list, certificate proof preview, add/edit/delete actions.
- `ResumesSection.tsx`: Uploaded resumes list, active resume toggle, ATS audit button, interactive builder trigger.

- [ ] **Step 4: Implement `SeekerPersonalInfoModal.tsx`**

Modal 1 container rendering the tab strip (Bio, Education, Experience, Skills, Certifications, Resumes) and displaying the corresponding section component.

- [ ] **Step 5: Implement `SeekerBottomNav.tsx` and barrel export `index.ts`**

Extract mobile bottom floating bar with Home, Vacancies, Bookmarks, Applications, Profile icons.
Create `src/views/seeker/components/index.ts` cleanly re-exporting all components.

- [ ] **Step 6: Commit modular profile components**

```bash
git add src/views/seeker/components/
git commit -m "refactor(arch-04): extract seeker profile header, career grid, and tabbed sections"
```

---

### Task 6: Refactor `SeekerProfilePage.tsx` Orchestrator

**Files:**
- Modify: `src/views/seeker/SeekerProfilePage.tsx`

**Interfaces:**
- Consumes: All modular components from `src/views/seeker/components`, `useSeekerProfileForm` from `src/hooks/useSeekerProfileForm`, `useApp` from `src/context/AppContext`.
- Produces: `SeekerProfilePage: React.FC<SeekerProfilePageProps>` reduced from 2,894 lines down to **<= 450 lines**.

- [ ] **Step 1: Refactor `SeekerProfilePage.tsx` to compose modular subcomponents**

Replace inlined modals and section markup with:
- `SeekerProfileHeader`
- `SeekerCareerToolsGrid`
- `SeekerPersonalInfoModal`
- `SeekerMatchReadinessModal`
- `SeekerJobPreferencesModal`
- `SeekerFullProfileOverviewModal`
- `SeekerRecordModals` (`EducationModal`, `ExperienceModal`, `CertificationModal`, `CertificateLightbox`)
- `SeekerUtilityModals` (`SeekerLanguageModal`, `SeekerHelpModal`, `SeekerPrivacyModal`, `SeekerInviteModal`)
- `SeekerBottomNav`
- External modals (`ResumeUploadModal`, `ResumePDFExportModal`, `ResumeBuilderModal`, `AtsResumeModal`, `SettingsModal`, `SeekerBookmarksModal`, `ContactInfoModal`, `AboutMeModal`, `ProjectsModal`, `VolunteerModal`, `AwardsModal`, `SkillsModal`).

- [ ] **Step 2: Verify line count and static types**

Run: `wc -l src/views/seeker/SeekerProfilePage.tsx`
Expected: Line count <= 450 lines.
Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Run `scripts/verify-arch04-component-decomposition.ts`**

Run: `npx tsx scripts/verify-arch04-component-decomposition.ts`
Expected: All suites PASS.

- [ ] **Step 4: Commit refactored SeekerProfilePage orchestrator**

```bash
git add src/views/seeker/SeekerProfilePage.tsx
git commit -m "refactor(arch-04): assemble SeekerProfilePage orchestrator from modular subcomponents"
```

---

### Task 7: Full Regression Verification, Build & Documentation Update

**Files:**
- Modify: `PROGRESS.md`
- Modify: `SPEC.md`
- Test: `npm test`
- Test: All arch verification suites (`verify-arch01`, `verify-arch02`, `verify-arch03`, `verify-arch04`, `verify-arch05`, `verify-arch06`, `verify-arch07`)
- Test: `npm run lint`
- Test: `npm run build`

**Interfaces:**
- Consumes: All tests and builds.
- Produces: Verified branch ready for integration.

- [ ] **Step 1: Run full regression test suite**

Run: `npm test`
Expected: 424/424 tests pass.

- [ ] **Step 2: Run all architectural verification suites**

Run:
```bash
npx tsx scripts/verify-arch01-context-slicing.ts && \
npx tsx scripts/verify-arch02-retire-firebase.ts && \
npx tsx scripts/verify-arch03-storage-unification.ts && \
npx tsx scripts/verify-arch04-component-decomposition.ts && \
npx tsx scripts/verify-arch05-code-splitting.ts && \
npx tsx scripts/verify-arch06-constants-extraction.ts && \
npx tsx scripts/verify-arch07-match-resolver.ts
```
Expected: All verification suites pass.

- [ ] **Step 3: Run linter and production build**

Run: `npm run lint && npm run build`
Expected: 0 lint errors, clean production bundle.

- [ ] **Step 4: Update `PROGRESS.md` and `SPEC.md`**

Mark ARCH-04 as COMPLETED with verification evidence and line reduction metrics.

- [ ] **Step 5: Commit documentation updates**

```bash
git add PROGRESS.md SPEC.md
git commit -m "docs(arch-04): update PROGRESS.md and SPEC.md with component decomposition deliverables"
```
