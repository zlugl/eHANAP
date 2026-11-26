# eHANAP — Agent Rules

## Before any task

Read [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md) in full. If they conflict with any chat message, the files win — flag the conflict and stop.

## Core Purpose

**eHANAP** is the official localized job placement, candidate ranking, and labor market monitoring system for the **Municipality of Roxas, Oriental Mindoro**, operating under the supervision of the **Public Employment Service Office (PESO)** and the Local Government Unit (LGU).

The system serves three primary user roles:
1. **Job Seekers**: Local residents searching for work, receiving automated compatibility notifications, and applying with parsed resumes.
2. **Employers**: Roxas-based businesses posting vacancies, undergoing PESO compliance verification, and accessing the **Automated Candidate Ranking Engine** to discover and recruit top-matching candidates.
3. **PESO / LGU Admin**: Municipal employment monitors approving job posts, managing Local Recruitment Activities (LRA), verifying business compliance, and monitoring municipal employment growth metrics.

## Active Phase: Post-Merge Audit Remediation (`WP-08` through `WP-11`)

Initial milestones (`01`–`07`), `ARCH-01`–`ARCH-08`, and Phase 1 remediation packages `WP-01`–`WP-07` (`55d3e7d`) concluded before two upstream owner commits (`84070e6`, `d630aef`) and subsequent merge-conflict resolution left branch `faye-updates` with 18 uncommitted files over `d630aef`. The active phase resolves the **11 post-merge audit findings** (Supabase schema/RLS/payload mismatches, employer profile fallback & state-updater side effects, Supabase password recovery, admin verification notification routing, passwordless quick-switcher removal, landing page copy parity, dead UI removal, and clean-slate test repair) organized into Work Packages **`WP-08` through `WP-11`** in [SPEC.md](SPEC.md) and tracked in [PROGRESS.md](PROGRESS.md).

## Hard Rules

- **Work Package Scope**: Implement exactly one remediation work package per session (from [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md)). Stop cleanly at its boundary.
- **Git Baseline Awareness**: `faye-updates` currently holds uncommitted conflict-resolution edits on top of `d630aef` (while local `main` sits at `55d3e7d`). Check `git status` before and after edits; never discard or overwrite unrelated clean-slate/merge fixes unless required by the active work package.
- **Approved Tech Stack**:
  - **Frontend**: React 19, Vite, Tailwind CSS v4, Motion, Lucide React, Recharts.
  - **Backend**: Express + Node.js (`server.ts` with TypeScript execution via TSX).
  - **Database & Auth Target**: **Supabase** (PostgreSQL, Supabase Auth, Row Level Security, Supabase Storage).
  - **AI / Parsing Utilities**: `@google/genai` (Google GenAI SDK), `pdf-parse`, `mammoth`.
- **Database Architecture & Clean-Slate Directive**:
  - Use exclusive **Supabase** persistence per academic thesis panel directive (Firebase remains retired per `ARCH-02`).
  - Keep `supabase_schema.sql` and `supabase/migrations/20261109000001_initial_ehanap_schema.sql` strictly in sync on every schema or RLS change.
  - Never emit frontend-only fields (e.g., `documents`, `remindersSent`, unmapped `CreateJobModal` keys) or unsupported `CHECK` status values (`'incomplete'`, `'pending_verification'`, `'rescheduled'`) to Supabase without matching schema/RLS/sanitization.
  - Preserve **clean-slate empty initial state** in `src/data/mockData.ts` (do not re-seed dummy demo arrays into runtime defaults); place synthetic test records exclusively inside verification scripts.
- **React State Purity**:
  - Never trigger network persistence (`saveDocument`, `saveRecord`, `updateEmployerProfile`) inside React `setState(prev => ...)` updater callbacks.
- **Core Thesis Invariant — Automated Candidate Ranking**:
  - When a PESO-verified employer posts a job (or upon PESO review/publication), the system must automatically evaluate registered seekers and display a **Ranked Candidate List** ordered by compatibility score percentage (0–100%).
  - Matching evaluation must be explainable (education level, degree alignment, required vs preferred skills, verified assessment credentials, years of experience).
- **LGU / PESO Gatekeeping**:
  - Employers must be verified Roxas-based entities or accredited through PESO Local Recruitment Activity (LRA) channels.
  - Only PESO-verified employers with completed profiles and uploaded documents may publish job postings directly to `'active'` (enforced by both `createJobPost` and PostgreSQL `job_posts` RLS); unverified employers remain blocked until PESO verifies them.
- **Verification Standards**:
  - Pass `npm run lint` (`tsc --noEmit`) with 0 errors and `npm run build` before concluding any work package.
  - Until `WP-11` repairs clean-slate test fixtures (`npm test` / `verify-milestone07.ts` currently reports 271/329), verify `WP-08`–`WP-10` using `npm run lint`, `npm run build`, the passing regression suites (`verify-wp05.ts`, `verify-ats-engine.ts`, `verify-arch08-modular-server.ts`), and targeted runtime/unit checks proving every deliverable without regressing other suites; starting with `WP-11`, require `npm test` (`verify-milestone07.ts`) and `verify-arch07-match-resolver.ts` to pass completely.
  - Never claim a work package is complete without verifiable runtime evidence.

## Definition of Done for a Remediation Work Package

1. `npm run lint` (`tsc --noEmit`) passes with 0 errors.
2. `npm run build` bundles successfully without missing modules or circular dependencies.
3. All applicable verification suites pass with 0 regressions, plus targeted tests proving the work package fixes (`npm test` 12/12 required from `WP-11` onward).
4. Deliverables specified for the work package in [SPEC.md](SPEC.md) are fully implemented and verified.
5. [PROGRESS.md](PROGRESS.md) is updated with deliverable summaries and checked-off checklists (`[x]`).
6. Git changes are reviewed carefully before committing (do not commit automatically unless requested).

## Do Not

- Refactor or alter components outside the designated work package scope.
- Introduce arbitrary heavy dependencies when existing utilities or native web standards suffice.
- Hardcode Supabase service role keys, passwords, or sensitive credentials in client-facing bundles.
- Leave permissive RLS policies (`USING (true)` / `WITH CHECK (true)`) or passwordless auth/OTP/role-switch bypasses in production schemas or auth contexts.
- Duplicate Decision Tree scoring logic outside `src/utils/decisionTree.ts` and `src/utils/matchResolver.ts`, or change mathematical weightings without explicit instruction.
- Mark work complete that has not been executed and verified.
