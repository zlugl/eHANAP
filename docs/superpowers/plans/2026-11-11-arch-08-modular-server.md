# ARCH-08: Modularize Server Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the monolithic 459-line `server.ts` into isolated, testable backend modules (`server/services/documentParser.ts`, `server/services/aiResumeService.ts`, `server/controllers/resumeController.ts`, and `server/app.ts`), reducing `server.ts` to a lean bootstrap file ($\le 60$ lines) while preserving 100% API behavior, dev/prod Vite middleware, and esbuild bundling.

**Architecture:**
1. **Document Parser Service (`server/services/documentParser.ts`)**: Encapsulates binary buffer extraction (`pdf-parse`, `mammoth`), character encodings, and mime-type detection without any Express or HTTP coupling.
2. **AI Resume Service (`server/services/aiResumeService.ts`)**: Encapsulates Google GenAI SDK lifecycle, model cascade failover (`gemini-3.8-flash` -> `gemini-3.5-flash-lite` -> etc.), circuit breaker cooldown state, prompt definitions, response schemas, and domain heuristic sanitization (DOB and sex anti-hallucination guards).
3. **Resume Controller (`server/controllers/resumeController.ts`)**: Bridges Express HTTP request/response handling to the domain services, with resilient fallbacks to `extractResumeInfoFromText` (`src/utils/resumeExtractorCore.ts`).
4. **Express Application Factory (`server/app.ts`)**: Configures Express middleware, routes (`/api/health`, `/api/parse-resume`, `/api/extract-resume`), and decoupling server composition from socket listening for fast unit/integration testing.
5. **Lean Server Bootstrap (`server.ts`)**: Manages environment loading, port binding, and Vite dev middleware / static asset serving in under 60 lines.
6. **Automated Verification Suite (`scripts/verify-arch08-modular-server.ts`)**: Comprehensive unit and integration test suite asserting document parsing, circuit breaker states, prompt and heuristic integrity, controller responses, and line-count constraints.

**Tech Stack:** TypeScript 5.8, Express 4.21, @google/genai 2.4, mammoth 1.12, pdf-parse 2.4, Vite 6.2, esbuild 0.25.

**Spec:** [SPEC.md](file:///home/keil/eHANAP/SPEC.md#L165-L178) (Section 8: Mixed Server Lifecycle, AI Orchestration, and Document Heuristics in `server.ts`) and [PROGRESS.md](file:///home/keil/eHANAP/PROGRESS.md#L25).

---

## Global Constraints

- Preserve all 424 automated test assertions in `scripts/verify-milestone07.ts` (`npm test`).
- Preserve all prior architectural verification test suites (`arch01`, `arch02`, `arch03`, `arch04`, `arch05`, `arch06`, `arch07`).
- `npm run lint` (`tsc --noEmit`) must pass with 0 errors.
- `npm run build` must succeed cleanly: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` must bundle the new modular architecture without failure.
- Zero API regression: `POST /api/parse-resume` and `POST /api/extract-resume` must maintain identical request and response schemas.
- High resilience: if Gemini API is unreachable, invalid, or quota-depleted (429 / RESOURCE_EXHAUSTED), requests must fall back seamlessly to high-precision heuristic extraction (`extractResumeInfoFromText`).

## Review Focus

1. **Anti-Hallucination Heuristics for Bio-Data**: If the raw document text lacks explicit mentions of date of birth or sex, the AI service must blank them out (`dateOfBirth: ''`, `age: undefined`, `sex: ''`) even if the LLM hallucinated values.
2. **Circuit Breaker Quota Management**: When receiving 429/quota exhaustion, the circuit breaker must trip for 1 hour, skipping unnecessary outbound LLM network requests and providing instant local extraction.
3. **Corrupted or Binary Payload Handling**: Non-PDF/non-DOCX binary data or malformed base64 must not throw unhandled exceptions or crash Express; safe fallback must return.
4. **Vite Middleware and Static Route Compatibility**: Development mode (`createViteServer`) and production mode (`express.static(dist)`) must continue functioning identically.
5. **esbuild CJS Bundling Compatibility**: External packages (`@google/genai`, `pdf-parse`, `mammoth`, `express`, `dotenv`, `vite`) must bundle cleanly with Node CJS target without import errors.

---

### Task 1: Create Backend Types & Document Parser Service (`server/types.ts`, `server/services/documentParser.ts`)

**Files:**
- Create: `server/types.ts`
- Create: `server/services/documentParser.ts`
- Test: `scripts/verify-arch08-modular-server.ts` (Suite 1)

**Interfaces:**
- Consumes: `pdf-parse`, `mammoth`, `Buffer` (Node.js).
- Produces: `ResumeParsePayload`, `ResumeApiResponse`, `CircuitBreakerStatus`, `extractTextFromPdfBuffer`, `extractTextFromDocxBuffer`, `extractTextFromPayload` in `server/services/documentParser.ts`.

- [ ] **Step 1: Write the failing test for Document Parser service**

In `scripts/verify-arch08-modular-server.ts`, define Suite 1 asserting:
- `server/services/documentParser.ts` exists and exports `extractTextFromPdfBuffer`, `extractTextFromDocxBuffer`, `extractTextFromPayload`.
- `extractTextFromDocxBuffer` handles valid buffer or returns empty string gracefully on invalid buffer.
- `extractTextFromPdfBuffer` handles fallback and text extraction.
- `extractTextFromPayload` handles plain text payloads, base64 buffers, and detects MIME/extensions for PDF, DOCX, and images.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch08-modular-server.ts`
Expected: FAIL with "Cannot find module '../server/services/documentParser'".

- [ ] **Step 3: Define types in `server/types.ts`**

Export:
- `ResumeParsePayload` (`fileName?`, `fileBase64?`, `mimeType?`, `fileContent?`, `fileText?`, `extractedDocText?`)
- `ExtractedResumeData` (matching full eHANAP resume schema)
- `ResumeApiResponse` (`success: boolean`, `source: string`, `extracted: ExtractedResumeData`, `error?: string`)
- `CircuitBreakerStatus` (`isQuotaDepleted: boolean`, `cooldownUntil: number`, `remainingCooldownMs: number`)
- `ParsedDocumentPayload` (`extractedText: string`, `isPdf: boolean`, `isDocx: boolean`, `isImage: boolean`, `buffer: Buffer | null`)

- [ ] **Step 4: Implement `server/services/documentParser.ts`**

Implement pure text extraction methods decoupled from HTTP:
- `extractTextFromPdfBuffer(buffer: Buffer): Promise<string>`
- `extractTextFromDocxBuffer(buffer: Buffer): Promise<string>`
- `extractTextFromPayload(payload: ResumeParsePayload): Promise<ParsedDocumentPayload>`

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch08-modular-server.ts`
Expected: Suite 1 passes.

- [ ] **Step 6: Commit**

```bash
git add server/types.ts server/services/documentParser.ts scripts/verify-arch08-modular-server.ts
git commit -m "feat(arch-08): extract document parser service and backend types"
```

---

### Task 2: Create AI Resume Service & Heuristics Engine (`server/services/aiResumeService.ts`)

**Files:**
- Create: `server/services/aiResumeService.ts`
- Test: `scripts/verify-arch08-modular-server.ts` (Suite 2)

**Interfaces:**
- Consumes: `@google/genai`, `server/types.ts`, `extractResumeInfoFromText` from `src/utils/resumeExtractorCore.ts`.
- Produces: `getCircuitBreakerStatus`, `tripCircuitBreaker`, `resetCircuitBreaker`, `buildResumeExtractionPrompt`, `sanitizeExtractedResumeData`, `parseResumeWithAi`.

- [ ] **Step 1: Write the failing test for AI Resume Service**

In `scripts/verify-arch08-modular-server.ts`, add Suite 2 asserting:
- `server/services/aiResumeService.ts` exists and exports circuit breaker helpers, prompt builder, sanitizer, and `parseResumeWithAi`.
- Circuit breaker trips and respects 1-hour cooldown window; reset helper clears cooldown.
- `buildResumeExtractionPrompt` embeds PESO Oriental Mindoro mandates, 6 skill taxonomies, and bio-data rules.
- `sanitizeExtractedResumeData` enforces:
  - If raw text doesn't contain birthday keywords (`birth`, `dob`, `birthday`, `born`), blank out `dateOfBirth` and `age`.
  - If raw text doesn't contain sex keywords (`sex`, `gender`, `female`, `male`), blank out `sex`.
  - Normalizes educational attainment and degree reconciliation with `extractResumeInfoFromText`.
- `parseResumeWithAi` safely returns structured data using local heuristic fallback when Gemini API key is absent or trips.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch08-modular-server.ts`
Expected: FAIL with "Cannot find module '../server/services/aiResumeService'".

- [ ] **Step 3: Implement `server/services/aiResumeService.ts`**

Extract from `server.ts`:
- Circuit breaker state variables and control functions (`getCircuitBreakerStatus`, `tripCircuitBreaker`, `resetCircuitBreaker`, `isCircuitBreakerTripped`).
- Gemini AI client factory (`getAiClient`).
- Inclusivity system prompt builder (`buildResumeExtractionPrompt`).
- Gemini contents payload builder (`getGeminiContents`).
- Schema definition (`RESUME_RESPONSE_SCHEMA`) and candidate model failover cascade (`CANDIDATE_MODELS`).
- Post-processing heuristic sanitization (`sanitizeExtractedResumeData`).
- Primary AI orchestrator (`parseResumeWithAi(payload, extractedDocText, buffer)`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch08-modular-server.ts`
Expected: Suite 1 and Suite 2 pass.

- [ ] **Step 5: Commit**

```bash
git add server/services/aiResumeService.ts scripts/verify-arch08-modular-server.ts
git commit -m "feat(arch-08): extract gemini ai resume service and domain heuristics"
```

---

### Task 3: Create Resume Controller & Express Application Factory (`server/controllers/resumeController.ts`, `server/app.ts`)

**Files:**
- Create: `server/controllers/resumeController.ts`
- Create: `server/app.ts`
- Test: `scripts/verify-arch08-modular-server.ts` (Suite 3)

**Interfaces:**
- Consumes: `express`, `server/services/documentParser.ts`, `server/services/aiResumeService.ts`, `src/utils/resumeExtractorCore.ts`.
- Produces: `handleResumeParsing`, `handleHealthCheck` in `server/controllers/resumeController.ts`; `createApp` in `server/app.ts`.

- [ ] **Step 1: Write the failing test for Controller and Express App Factory**

In `scripts/verify-arch08-modular-server.ts`, add Suite 3 asserting:
- `server/controllers/resumeController.ts` exports `handleResumeParsing` and `handleHealthCheck`.
- `server/app.ts` exports `createApp()`.
- Express app responds to `GET /api/health` with `{ status: 'ok', system: 'eHANAP Oriental Mindoro PESO Cloud Backend' }`.
- Express app responds to `POST /api/parse-resume` and `POST /api/extract-resume` with extracted candidate resume information.
- Controller gracefully catches corrupt input and returns safe fallback data with status 200 and `success: true`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/verify-arch08-modular-server.ts`
Expected: FAIL with "Cannot find module '../server/controllers/resumeController'".

- [ ] **Step 3: Implement `server/controllers/resumeController.ts`**

Implement:
- `handleHealthCheck(req, res)`: sends standard eHANAP system health status.
- `handleResumeParsing(req, res)`: invokes `extractTextFromPayload` and `parseResumeWithAi`, safely falling back to `extractResumeInfoFromText` upon any exceptional event.

- [ ] **Step 4: Implement `server/app.ts`**

Implement:
- `createApp(options?: { vite?: any }): express.Express`:
  - Registers `express.json({ limit: '15mb' })`.
  - Registers `GET /api/health`.
  - Registers `POST /api/parse-resume` and `POST /api/extract-resume`.
  - Decoupled from `app.listen` to permit direct supertest / test runner invocation.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx scripts/verify-arch08-modular-server.ts`
Expected: Suites 1, 2, and 3 pass.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/resumeController.ts server/app.ts scripts/verify-arch08-modular-server.ts
git commit -m "feat(arch-08): create resume controller and express app factory"
```

---

### Task 4: Streamline `server.ts` Bootstrap & Verify Build & Regression Parity

**Files:**
- Modify: `server.ts` (reduce from 459 lines to $\le 60$ lines)
- Modify: `scripts/verify-arch08-modular-server.ts` (Suite 4 & 5)
- Modify: `PROGRESS.md`
- Modify: `SPEC.md`

**Interfaces:**
- Consumes: `createApp` from `./server/app`, `dotenv`, `vite`, `path`, `express`.
- Produces: executable Node entrypoint compatible with `npm run dev` and `npm run build`.

- [ ] **Step 1: Write verification assertions for modularity, line count, and build integrity**

In `scripts/verify-arch08-modular-server.ts`:
- Assert `server.ts` line count is $\le 60$ lines (reduced from 459 lines by $>85\%$).
- Assert `server.ts` contains no direct GenAI prompt strings, schema definitions, or mammoth/pdfParse direct imports.
- Assert all 5 backend modules exist under `server/`.

- [ ] **Step 2: Refactor `server.ts` to use `createApp`**

Rewrite `server.ts`:
```typescript
import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

dotenv.config();

async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[eHANAP Oriental Mindoro Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
```

- [ ] **Step 3: Run comprehensive verification**

Run:
- `npx tsx scripts/verify-arch08-modular-server.ts` (all 5 suites pass)
- `npm run lint` (`tsc --noEmit` returns 0 errors)
- `npm run build` (`vite build && esbuild server.ts ...` bundles cleanly)
- `npm test` (all 424 regression tests pass across 8 milestone test suites)
- Run all prior architectural verification test scripts (`arch01`, `arch02`, `arch03`, `arch04`, `arch05`, `arch06`, `arch07`).

- [ ] **Step 4: Update Documentation**

- Update `SPEC.md`: Mark ARCH-08 as `REMEDIATED` (Work Package 8) with remediation details and line count metrics.
- Update `PROGRESS.md`: Record Work Package 8 deliverables, test counts, line reductions, and commit references.

- [ ] **Step 5: Commit**

```bash
git add server.ts scripts/verify-arch08-modular-server.ts SPEC.md PROGRESS.md
git commit -m "refactor(arch-08): streamline server.ts bootstrap and complete modular backend architecture"
```
