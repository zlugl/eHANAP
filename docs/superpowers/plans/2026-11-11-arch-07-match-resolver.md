# ARCH-07: Centralize Decision Tree Match Resolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize Decision Tree matching behind a high-performance resolver (`src/utils/matchResolver.ts`) that prioritizes pre-computed database matches from `candidate_matches`, eliminates redundant pairwise loops in presentation render cycles, and memoizes candidate ranking rosters across employer and seeker views.

**Architecture:**
1. Create `src/utils/matchResolver.ts` with `getOrCalculateMatch(seeker, job, options)` which checks pre-computed matches (from Supabase `candidate_matches` or `Application.matchResult`), consults an in-memory TTL/versioned cache, and falls back to `calculateDecisionTreeMatch` only on cache misses.
2. Introduce typed `CandidateMatch` in `src/types.ts` and add `candidateMatches` state with real-time Supabase synchronization (`subscribeToSupabaseTable(SUPABASE_TABLES.CANDIDATE_MATCHES)`) in `src/context/AppContext.tsx`.
3. Refactor all 5 presentation touchpoints (`JobSearchPage.tsx`, `SeekerDashboard.tsx`, `EmployerApplicantsPage.tsx`, `ApplicantMatchReportModal.tsx`, `JobOfferView.tsx`) to eliminate ad-hoc render loops, memoize match lookups, and reuse candidate ranking pools instead of recalculating $O(N \times M)$ pairs.
4. Implement an automated verification test suite `scripts/verify-arch07-match-resolver.ts` to assert cache behavior, pre-computed match priority, elimination of redundant presentation loops, and regression parity.

**Tech Stack:** TypeScript 5.8, React 19, Supabase PostgreSQL, Vitest / TSX test runner.

**Spec:** [SPEC.md](file:///home/keil/eHANAP/SPEC.md#L147-L160) (Section 7: Ad-Hoc Pairwise Decision Tree Matching in Presentation Render Loops) and [PROGRESS.md](file:///home/keil/eHANAP/PROGRESS.md#L24).

---

## Global Constraints

- Preserve all 424 automated test assertions in `scripts/verify-milestone07.ts` (`npm test`).
- Preserve all prior architectural refactoring verification suites (`verify-arch03-storage-unification.ts`, `verify-arch06-constants-extraction.ts`, `verify-arch02-retire-firebase.ts`, `verify-arch01-context-slicing.ts`, `verify-arch05-code-splitting.ts`).
- `npm run lint` (`tsc --noEmit`) must pass with 0 errors.
- `npm run build` must succeed cleanly with all chunks intact.
- Deterministic score parity: `getOrCalculateMatch` must produce identical numerical scores and decision outcomes as pure `calculateDecisionTreeMatch`.
- Zero render lag: presentation components must never execute unmemoized pairwise matching loops during render passes.

## Review Focus

1. **Missing / Undefined Seeker or Job Entities**: When `seeker` or `job` is null/undefined or missing an ID, `getOrCalculateMatch` must return a safe fallback `MatchResult` with 0 score without throwing.
2. **Snapshot Integrity for Applications**: If an application record already contains a pre-evaluated `matchResult`, the resolver must honor the application snapshot rather than mutating historical score records.
3. **Cache Invalidation on Mutation**: When a seeker updates skills/education or a job requirement changes, the in-memory cache must detect updated timestamps or provide explicit invalidation so stale scores are never displayed.
4. **Duplicate Map Elimination in EmployerApplicantsPage**: `poolCounts` must not re-map `jobSeekers` with a second pairwise calculation; it must reuse the memoized `candidateRankingPool`.
5. **Backwards Compatibility of `useApp()`**: Existing consumers calling `useApp()` must not suffer breaking changes; `candidateMatches` and `getMatch` are additive.

---

### Task 1: Create Domain Match Resolver & Types (`src/utils/matchResolver.ts`, `src/types.ts`)

**Files:**
- Create: `src/utils/matchResolver.ts`
- Modify: `src/types.ts:460-485`
- Test: `scripts/verify-arch07-match-resolver.ts`

**Interfaces:**
- Consumes: `calculateDecisionTreeMatch` from `src/utils/decisionTree.ts`, `JobSeekerProfile`, `JobPost`, `MatchResult`, `DecisionTreeOutcome` from `src/types.ts`.
- Produces: `CandidateMatch`, `MatchResolverOptions`, `getOrCalculateMatch`, `resolveRosterMatches`, `getMatchScoreCategory`, `clearMatchCache`, `invalidateMatchCache` in `src/utils/matchResolver.ts`.

- [ ] **Step 1: Write the failing test for Match Resolver module and caching logic**

In `scripts/verify-arch07-match-resolver.ts`, create Suite 1 testing `getOrCalculateMatch`:
```typescript
// Test that getOrCalculateMatch resolves cached match without recalculation
// Test that getOrCalculateMatch falls back to calculateDecisionTreeMatch on cache miss
// Test that repeat queries return cached result
// Test that application snapshot is prioritized
// Test getMatchScoreCategory helper
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: FAIL with "Cannot find module '../src/utils/matchResolver'"

- [ ] **Step 3: Define `CandidateMatch` and `MatchResolverOptions` in `src/types.ts`**

Export `CandidateMatch`:
```typescript
export interface CandidateMatch extends MatchResult {
  id?: string;
  calculatedAt?: string;
}
```

- [ ] **Step 4: Implement `src/utils/matchResolver.ts`**

Implement:
- `buildMatchCacheKey(seekerId: string, jobId: string, seekerVersion?: string, jobVersion?: string): string`
- `getOrCalculateMatch(seeker, job, options?: MatchResolverOptions): MatchResult`
- `resolveRosterMatches(seekers, job, options?): CandidateRosterItem[]`
- `getMatchScoreCategory(score: number): { score: number; label: string; badgeVariant: 'highly' | 'qualified' | 'potential' | 'general' }`
- `clearMatchCache(): void`
- `invalidateMatchCache(seekerId?: string, jobId?: string): void`

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: Suite 1 PASSES.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/utils/matchResolver.ts scripts/verify-arch07-match-resolver.ts
git commit -m "feat(arch-07): create centralized match resolver and candidate match types"
```

---

### Task 2: Integrate Candidate Matches in `src/context/AppContext.tsx`

**Files:**
- Modify: `src/context/AppContext.tsx`
- Modify: `src/context/index.ts`
- Test: `scripts/verify-arch07-match-resolver.ts`

**Interfaces:**
- Consumes: `CandidateMatch` from `src/types.ts`, `getOrCalculateMatch` from `src/utils/matchResolver.ts`, `SUPABASE_TABLES.CANDIDATE_MATCHES` from `src/services/supabaseService.ts`.
- Produces: `candidateMatches` state slice, `getMatch(seeker, job)` helper on `AppContextType` and `useApp()`.

- [ ] **Step 1: Add verification assertions for AppContext candidate match integration**

In `scripts/verify-arch07-match-resolver.ts`, add Suite 2 verifying:
- `AppContextType` exports `candidateMatches: CandidateMatch[]`
- `AppContextType` exports `getMatch` resolver helper
- AppContext subscribes to `SUPABASE_TABLES.CANDIDATE_MATCHES`
- `notifyAndCacheCandidateMatches` updates local `candidateMatches` state

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: FAIL with missing `candidateMatches` on AppContext.

- [ ] **Step 3: Update `AppContext.tsx`**

- Add `candidateMatches: CandidateMatch[]` to `AppContextType` and state.
- In `useEffect` database initialization, subscribe to `SUPABASE_TABLES.CANDIDATE_MATCHES`:
  ```typescript
  unsubs.push(
    subscribeToSupabaseTable<CandidateMatch>(SUPABASE_TABLES.CANDIDATE_MATCHES, (data) => {
      if (data && data.length > 0) setCandidateMatches(data);
    })
  );
  ```
- Expose `getMatch: (seeker: JobSeekerProfile, job: JobPost) => MatchResult` in context value.
- Update `notifyAndCacheCandidateMatches(job)` to update local `candidateMatches` state and warm resolver cache.
- Update `updateJobSeekerProfile` to invalidate match cache for the updated seeker.
- Route internal match calls in `AppContext.tsx` through `getOrCalculateMatch`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: Suite 1 and Suite 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.tsx src/context/index.ts scripts/verify-arch07-match-resolver.ts
git commit -m "feat(arch-07): expose candidateMatches and real-time subscription in AppContext"
```

---

### Task 3: Refactor Presentation Views to Use Match Resolver & Memoized Rosters

**Files:**
- Modify: `src/views/JobSearchPage.tsx`
- Modify: `src/views/seeker/SeekerDashboard.tsx`
- Modify: `src/views/employer/EmployerApplicantsPage.tsx`
- Modify: `src/views/employer/ApplicantMatchReportModal.tsx`
- Modify: `src/components/JobOfferView.tsx`
- Test: `scripts/verify-arch07-match-resolver.ts`

**Interfaces:**
- Consumes: `getOrCalculateMatch`, `getMatchScoreCategory` from `src/utils/matchResolver.ts`, `candidateMatches`, `getMatch` from `useApp()`.
- Produces: Memoized match calculations and zero redundant render loops in presentation layer.

- [ ] **Step 1: Add verification assertions for presentation view refactoring**

In `scripts/verify-arch07-match-resolver.ts`, add Suite 3 verifying:
- `JobSearchPage.tsx` uses `getOrCalculateMatch` or `getMatch` with cached matches
- `SeekerDashboard.tsx` uses `getOrCalculateMatch` and memoized job match map instead of unmemoized render loop
- `EmployerApplicantsPage.tsx` derives `poolCounts` directly from `candidateRankingPool` without a second `calculateDecisionTreeMatch` loop
- `ApplicantMatchReportModal.tsx` routes through `getOrCalculateMatch`
- `JobOfferView.tsx` routes through `getOrCalculateMatch`
- Zero unmemoized pairwise matching loops remain in presentation layer

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: FAIL on presentation view checks.

- [ ] **Step 3: Refactor `JobSearchPage.tsx`**

Replace line 197 `calculateDecisionTreeMatch(currentSeekerProfile, job)` with `getOrCalculateMatch(currentSeekerProfile, job, { cachedMatches: candidateMatches })`.

- [ ] **Step 4: Refactor `SeekerDashboard.tsx`**

- In `SeekerDashboard.tsx`, memoize job match scores into a `Map<string, { score: number; label: string }>`:
  ```typescript
  const jobMatchScoreMap = useMemo(() => {
    const map = new Map<string, { score: number; label: string }>();
    if (!currentSeekerProfile || !jobPosts) return map;
    jobPosts.forEach(job => {
      const match = getOrCalculateMatch(currentSeekerProfile, job, { cachedMatches: candidateMatches });
      const cat = getMatchScoreCategory(match.overallMatch);
      map.set(job.id, { score: cat.score, label: cat.label });
    });
    return map;
  }, [currentSeekerProfile, jobPosts, candidateMatches]);
  ```
- Use `jobMatchScoreMap.get(job.id)` in `suggestedJobs` sort and feed rendering, eliminating repetitive recalculations during sorting.

- [ ] **Step 5: Refactor `EmployerApplicantsPage.tsx`**

- In `candidateRankingPool`, resolve matches with `getOrCalculateMatch(seeker, activeJob, { cachedMatches: candidateMatches, application: existingApp })`.
- In `poolCounts`, eliminate `const all = jobSeekers.map(s => calculateDecisionTreeMatch(s, activeJob));`:
  ```typescript
  const poolCounts = useMemo(() => {
    if (!activeJob) return { total: 0, highly: 0, qualified: 0, applied: 0, unapplied: 0, invited: 0 };
    return {
      total: candidateRankingPool.length,
      highly: candidateRankingPool.filter(item => item.score >= 85).length,
      qualified: candidateRankingPool.filter(item => item.score >= 70).length,
      applied: applications.filter(a => a.jobId === activeJob.id).length,
      unapplied: candidateRankingPool.filter(item => !item.existingApp).length,
      invited: candidateRankingPool.filter(item => item.isInvited).length,
    };
  }, [activeJob, candidateRankingPool, applications]);
  ```

- [ ] **Step 6: Refactor `ApplicantMatchReportModal.tsx` and `JobOfferView.tsx`**

- In `ApplicantMatchReportModal.tsx:59`, replace with `getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches, application })`.
- In `JobOfferView.tsx:95`, replace with `getOrCalculateMatch(currentSeekerProfile, fullJobPost || (job as any), { cachedMatches: candidateMatches })`.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: Suite 1, 2, and 3 PASS.

- [ ] **Step 8: Commit**

```bash
git add src/views/JobSearchPage.tsx src/views/seeker/SeekerDashboard.tsx src/views/employer/EmployerApplicantsPage.tsx src/views/employer/ApplicantMatchReportModal.tsx src/components/JobOfferView.tsx scripts/verify-arch07-match-resolver.ts
git commit -m "refactor(arch-07): decouple presentation views from ad-hoc pairwise match loops"
```

---

### Task 4: Complete Automated Verification Suite, Regressions & Progress Updates

**Files:**
- Modify: `scripts/verify-arch07-match-resolver.ts`
- Modify: `PROGRESS.md`
- Modify: `SPEC.md`

**Interfaces:**
- Consumes: All verification suites and project build tools.
- Produces: 100% pass across all verification suites, updated documentation and status tables.

- [ ] **Step 1: Complete and execute `scripts/verify-arch07-match-resolver.ts`**

Run: `npx tsx scripts/verify-arch07-match-resolver.ts`
Expected: All suites PASS.

- [ ] **Step 2: Run all architectural regression suites and `npm test`**

Run:
```bash
npx tsx scripts/verify-arch01-context-slicing.ts
npx tsx scripts/verify-arch02-retire-firebase.ts
npx tsx scripts/verify-arch03-storage-unification.ts
npx tsx scripts/verify-arch05-code-splitting.ts
npx tsx scripts/verify-arch06-constants-extraction.ts
npx tsx scripts/verify-arch07-match-resolver.ts
npm test
npm run lint
npm run build
```
Expected: All tests PASS, 0 lint errors, build succeeds.

- [ ] **Step 3: Update `PROGRESS.md` and `SPEC.md`**

- In `PROGRESS.md`: Mark ARCH-07 as **COMPLETED**, add detailed work package report with verified metrics.
- In `SPEC.md`: Update Status of ARCH-07 to `REMEDIATED (Work Package 6)`.

- [ ] **Step 4: Commit**

```bash
git add PROGRESS.md SPEC.md scripts/verify-arch07-match-resolver.ts
git commit -m "docs(arch-07): update PROGRESS.md and SPEC.md with match resolver deliverables"
```
