# eHANAP — Agent Rules

## Before any task

Read [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md) in full. If they conflict with any chat message, the files win — flag the conflict and stop.

## Core Purpose

**eHANAP** is the official localized job placement, candidate ranking, and labor market monitoring system for the **Municipality of Roxas, Oriental Mindoro**, operating under the supervision of the **Public Employment Service Office (PESO)** and the Local Government Unit (LGU).

The system serves three primary user roles:
1. **Job Seekers**: Local residents searching for work, receiving automated compatibility notifications, and applying with parsed resumes.
2. **Employers**: Roxas-based businesses posting vacancies, undergoing PESO compliance verification, and accessing the **Automated Candidate Ranking Engine** to discover and recruit top-matching candidates.
3. **PESO / LGU Admin**: Municipal employment monitors approving job posts, managing Local Recruitment Activities (LRA), verifying business compliance, and monitoring municipal employment growth metrics.

## Active Phase: Upstream Reconciliation & Sync (`WP-12`)

Initial milestones (`01`–`07`), `ARCH-01`–`ARCH-08`, Phase 1 (`WP-01`–`WP-07` at `55d3e7d`), and post-merge remediation (`WP-08`–`WP-11` at `2d128a4`) are complete on local `faye-updates` and `main`. Meanwhile `origin/main` moved to `445cca2` (Faye Margarette's conflict resolution over `d630aef`, which omits `WP-08`–`WP-11` and fails 10/12 `npm test` suites, but includes two real `PesoLraContext.tsx` fixes and `types.ts` aliases). The active work package **`WP-12`** reconciles `faye-updates` with `origin/main` (`445cca2`) and lands the combined verified state into `main` / `origin/main` as tracked in [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md).

## Hard Rules

- **Work Package Scope**: Implement exactly one remediation work package per session (from [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md)). Stop cleanly at its boundary.
- **Git Baseline Awareness**: Local `faye-updates` and `main` sit at `2d128a4`, while `origin/main` sits at `445cca2` (both branched from `d630aef` across 15 overlapping files). Check `git status` and `git branch -vv` before and after edits; never overwrite `2d128a4`'s `WP-08`–`WP-11` fixes with `445cca2` when merging/rebasing `origin/main` — keep `2d128a4` as the authoritative base and port only the `WP-12` fixes from `445cca2`.
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
  - Pass `npm run lint` (`tsc --noEmit`) with 0 errors, `npm run build`, `npm test` (`verify-milestone07.ts`, all suites passing), and `verify-arch07-match-resolver.ts` before concluding any work package.
  - Never claim a work package is complete without verifiable runtime evidence.

## Definition of Done for a Remediation Work Package

1. `npm run lint` (`tsc --noEmit`) passes with 0 errors.
2. `npm run build` bundles successfully without missing modules or circular dependencies.
3. All applicable verification suites (`npm test` and `WP-12` regression checks) pass with 0 regressions.
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
