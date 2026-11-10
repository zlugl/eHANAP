# eHANAP — Agent Rules

## Before any task

Read [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md) in full. If they conflict with any chat message, the files win — flag the conflict and stop.

## Core Purpose

**eHANAP** is the official localized job placement, candidate ranking, and labor market monitoring system for the **Municipality of Roxas, Oriental Mindoro**, operating under the supervision of the **Public Employment Service Office (PESO)** and the Local Government Unit (LGU).

The system serves three primary user roles:
1. **Job Seekers**: Local residents searching for work, receiving automated compatibility notifications, and applying with parsed resumes.
2. **Employers**: Roxas-based businesses posting vacancies, undergoing PESO compliance verification, and accessing the **Automated Candidate Ranking Engine** to discover and recruit top-matching candidates.
3. **PESO / LGU Admin**: Municipal employment monitors approving job posts, managing Local Recruitment Activities (LRA for regional partners like Puregold Calapan), verifying business compliance, and monitoring municipal employment growth metrics.

## Active Phase: Modularity & Architecture Debt Remediation

The initial 7 implementation milestones are complete, verified by 424 automated test assertions. The active phase focuses on technical debt reduction, modular context slicing, and architectural boundary enforcement as prioritized in the Modularity Audit in [SPEC.md](SPEC.md).

## Hard Rules

- **Work Package Scope**: Implement exactly one refactoring work package per session (from [SPEC.md](SPEC.md) and [PROGRESS.md](PROGRESS.md)). Stop cleanly at its boundary.
- **Approved Tech Stack**:
  - **Frontend**: React 19, Vite, Tailwind CSS v4, Motion, Lucide React, Recharts.
  - **Backend**: Express + Node.js (`server.ts` with TypeScript execution via TSX).
  - **Database & Auth Target**: **Supabase** (PostgreSQL, Supabase Auth, Row Level Security, Supabase Storage).
  - **AI / Parsing Utilities**: `@google/genai` (Google GenAI SDK), `pdf-parse`, `mammoth`.
- **Database Architecture Directive**:
  - Transition cleanly to exclusive **Supabase** persistence per academic thesis panel directive (retire Firebase Firestore and Firebase Auth per ARCH-02).
  - Never leave half-migrated ghost references or conflicting dual writes.
  - Retain backwards-compatible mock fallback loaders for rapid offline demonstration and thesis defense stability.
- **Core Thesis Invariant — Automated Candidate Ranking**:
  - When an employer posts a job (and upon PESO approval), the system must automatically evaluate registered seekers and display a **Ranked Candidate List** ordered by compatibility score percentage (0–100%).
  - Matching evaluation must be explainable (education level, degree alignment, required vs preferred skills, verified assessment credentials, years of experience).
- **LGU / PESO Gatekeeping**:
  - Employers must be verified Roxas-based entities or accredited through PESO Local Recruitment Activity (LRA) channels.
  - Job postings must pass PESO approval before appearing publicly on seeker boards.
- **Verification Standards**:
  - Pass `npm run lint` (`tsc --noEmit`) with 0 errors before concluding any work package.
  - Pass `npm test` (all 424 test assertions) before and after any structural modification.
  - Never claim a refactoring is complete without verifiable runtime evidence.

## Definition of Done for a Refactoring Work Package

1. `npm run lint` (`tsc --noEmit`) passes with 0 errors.
2. `npm test` passes all verification suites with 0 regressions.
3. `npm run build` bundles successfully without missing modules or circular dependencies.
4. Deliverables specified in [SPEC.md](SPEC.md) are fully implemented and verified.
5. [PROGRESS.md](PROGRESS.md) is updated with deliverable summaries and checked-off checklists (`[x]`).
6. Git changes are reviewed and staged cleanly with a descriptive conventional commit message.

## Do Not

- Refactor or alter components outside the designated work package scope.
- Introduce arbitrary heavy dependencies when existing utilities or native web standards suffice.
- Hardcode Supabase service role keys or sensitive credentials in client-facing bundles.
- Modify the mathematical weightings of the decision-tree matching algorithm without explicit instruction.
- Mark work complete that has not been executed and verified.
