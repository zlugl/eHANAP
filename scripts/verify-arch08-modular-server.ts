import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-08: Modularize Server Architecture Verification  ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

async function runVerification() {
  const rootDir = path.resolve(__dirname, '..');

  // -------------------------------------------------------------
  // Suite 1: Document Parser Service & Buffer Extraction
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] Document Parser Service & Buffer Extraction (server/services/documentParser.ts)');

  const typesPath = path.join(rootDir, 'server/types.ts');
  const parserPath = path.join(rootDir, 'server/services/documentParser.ts');

  assert(fs.existsSync(typesPath), 'server/types.ts exists on disk');
  assert(fs.existsSync(parserPath), 'server/services/documentParser.ts exists on disk');

  if (fs.existsSync(parserPath)) {
    const parserContent = fs.readFileSync(parserPath, 'utf-8');
    assert(parserContent.includes('export async function extractTextFromPdfBuffer') || parserContent.includes('export const extractTextFromPdfBuffer'), 'extractTextFromPdfBuffer is exported');
    assert(parserContent.includes('export async function extractTextFromDocxBuffer') || parserContent.includes('export const extractTextFromDocxBuffer'), 'extractTextFromDocxBuffer is exported');
    assert(parserContent.includes('export async function extractTextFromPayload') || parserContent.includes('export const extractTextFromPayload'), 'extractTextFromPayload is exported');

    // Dynamic import to test execution behavior
    const docParser = await import('../server/services/documentParser.ts');

    // 1. DOCX buffer extraction with corrupt/empty buffer returns empty string without crashing
    const emptyDocxRes = await docParser.extractTextFromDocxBuffer(Buffer.from('not-a-valid-docx'));
    assert(typeof emptyDocxRes === 'string', 'extractTextFromDocxBuffer returns string');
    assert(emptyDocxRes === '', 'corrupt DOCX buffer returns empty string gracefully');

    // 2. PDF buffer extraction with plain text fallback
    const mockPdfBuffer = Buffer.from('%PDF-1.4\x00Juan Dela Cruz\x00Roxas Mindoro\x00Software Engineer\x00React TypeScript\x00BS Computer Science\x00%%EOF');
    const pdfRes = await docParser.extractTextFromPdfBuffer(mockPdfBuffer);
    assert(typeof pdfRes === 'string', 'extractTextFromPdfBuffer returns string');
    assert(pdfRes.includes('Juan Dela Cruz') || pdfRes.includes('Software Engineer'), 'extractTextFromPdfBuffer extracts text via fallback/parser');

    // 3. Payload with direct fileContent
    const textPayloadResult = await docParser.extractTextFromPayload({
      fileName: 'resume.txt',
      fileContent: 'Juan Dela Cruz, Roxas Oriental Mindoro. Skills: React, TypeScript',
    });
    assert(textPayloadResult.extractedText.includes('Juan Dela Cruz'), 'extractTextFromPayload extracts direct text content');
    assert(textPayloadResult.isPdf === false, 'plain text is not classified as PDF');
    assert(textPayloadResult.isDocx === false, 'plain text is not classified as DOCX');
    assert(textPayloadResult.isImage === false, 'plain text is not classified as image');

    // 4. Payload with PDF base64 detection
    const samplePdfBase64 = Buffer.from('%PDF-1.5\x00PESO Roxas\x00Resume File\x00Oriental Mindoro\x00Technical Skills\x00Education\x00Experience').toString('base64');
    const pdfPayloadResult = await docParser.extractTextFromPayload({
      fileName: 'MyResume.PDF',
      fileBase64: samplePdfBase64,
      mimeType: 'application/pdf',
    });
    assert(pdfPayloadResult.isPdf === true, 'PDF filename and mimeType detected correctly');
    assert(pdfPayloadResult.isDocx === false, 'PDF is not classified as DOCX');
    assert(pdfPayloadResult.buffer instanceof Buffer, 'Decodes base64 payload into Buffer instance');

    // 5. Payload with DOCX mime/filename detection
    const sampleDocxBase64 = Buffer.from('mock docx bytes').toString('base64');
    const docxPayloadResult = await docParser.extractTextFromPayload({
      fileName: 'Biodata.docx',
      fileBase64: sampleDocxBase64,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    assert(docxPayloadResult.isDocx === true, 'DOCX filename and mimeType detected correctly');
    assert(docxPayloadResult.isPdf === false, 'DOCX is not classified as PDF');

    // 6. Payload with Image mime/filename detection
    const sampleImgBase64 = Buffer.from('mock image bytes').toString('base64');
    const imgPayloadResult = await docParser.extractTextFromPayload({
      fileName: 'Biodata_Sheet.PNG',
      fileBase64: sampleImgBase64,
      mimeType: 'image/png',
    });
    assert(imgPayloadResult.isImage === true, 'PNG image detected correctly');
  }

  // -------------------------------------------------------------
  // Suite 2: AI Resume Service, Circuit Breaker & Heuristics
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] AI Resume Service & Heuristics (server/services/aiResumeService.ts)');

  const aiServicePath = path.join(rootDir, 'server/services/aiResumeService.ts');
  assert(fs.existsSync(aiServicePath), 'server/services/aiResumeService.ts exists on disk');

  if (fs.existsSync(aiServicePath)) {
    const aiContent = fs.readFileSync(aiServicePath, 'utf-8');
    assert(aiContent.includes('getCircuitBreakerStatus'), 'getCircuitBreakerStatus is exported');
    assert(aiContent.includes('tripCircuitBreaker'), 'tripCircuitBreaker is exported');
    assert(aiContent.includes('resetCircuitBreaker'), 'resetCircuitBreaker is exported');
    assert(aiContent.includes('buildResumeExtractionPrompt'), 'buildResumeExtractionPrompt is exported');
    assert(aiContent.includes('sanitizeExtractedResumeData'), 'sanitizeExtractedResumeData is exported');
    assert(aiContent.includes('parseResumeWithAi'), 'parseResumeWithAi is exported');

    const aiService = await import('../server/services/aiResumeService.ts');

    // 1. Circuit breaker test: trip and reset
    aiService.resetCircuitBreaker();
    assert(aiService.getCircuitBreakerStatus().isQuotaDepleted === false, 'circuit breaker is initially inactive');
    aiService.tripCircuitBreaker(30000); // 30 sec cooldown
    const statusTripped = aiService.getCircuitBreakerStatus();
    assert(statusTripped.isQuotaDepleted === true, 'circuit breaker reports quota depleted after trip');
    assert(statusTripped.remainingCooldownMs > 0, 'circuit breaker records positive cooldown remaining');
    aiService.resetCircuitBreaker();
    assert(aiService.getCircuitBreakerStatus().isQuotaDepleted === false, 'circuit breaker successfully resets');

    // 2. Prompt builder: includes required PESO Oriental Mindoro mandates and 6 skill taxonomy
    const prompt = aiService.buildResumeExtractionPrompt({
      fileName: 'Juan_Dela_Cruz_BioData.pdf',
      extractedDocText: 'Personal Data: Juan Dela Cruz, Roxas, Oriental Mindoro',
    });
    assert(prompt.includes('PESO Oriental Mindoro'), 'Prompt mentions PESO Oriental Mindoro');
    assert(prompt.includes('CRITICAL INCLUSIVITY & EXTRACTION MANDATES'), 'Prompt includes inclusivity mandates');
    assert(prompt.includes('tradeSkills'), 'Prompt defines tradeSkills category');
    assert(prompt.includes('administrativeSkills'), 'Prompt defines administrativeSkills category');
    assert(prompt.includes('serviceHospitalitySkills'), 'Prompt defines serviceHospitalitySkills category');
    assert(prompt.includes('salesCustomerSkills'), 'Prompt defines salesCustomerSkills category');
    assert(prompt.includes('itCreativeSkills'), 'Prompt defines itCreativeSkills category');
    assert(prompt.includes('softSkills'), 'Prompt defines softSkills category');

    // 3. Heuristic Sanitizer: Anti-hallucination verification for DOB and Sex
    const hallucinatedData = {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      dateOfBirth: '1995-04-12',
      age: 29,
      sex: 'Male',
      primaryDegree: 'BS Information Technology',
      school: 'Mindoro State University',
    };
    const rawTextWithoutDobOrSex = 'Juan Dela Cruz. Software Developer from Roxas Oriental Mindoro. Skills: React, Node.js.';
    const sanitized = aiService.sanitizeExtractedResumeData(hallucinatedData, {}, rawTextWithoutDobOrSex);
    assert(sanitized.dateOfBirth === '', 'Date of birth is blanked when raw text has no DOB mention');
    assert(sanitized.age === undefined, 'Age is undefined when raw text has no DOB mention');
    assert(sanitized.sex === '', 'Sex is blanked when raw text has no sex mention');

    const rawTextWithDobAndSex = 'Name: Maria Santos. Birthday: October 24, 2000. Age: 24. Gender: Female. Roxas.';
    const validData = {
      firstName: 'Maria',
      lastName: 'Santos',
      dateOfBirth: 'October 24, 2000',
      age: 24,
      sex: 'Female',
      primaryDegree: 'BS Tourism',
      school: 'John Paul College',
    };
    const sanitizedWithMentions = aiService.sanitizeExtractedResumeData(validData, {}, rawTextWithDobAndSex);
    assert(sanitizedWithMentions.dateOfBirth === 'October 24, 2000', 'Date of birth is preserved when mentioned');
    assert(sanitizedWithMentions.age === 24, 'Age is preserved when mentioned');
    assert(sanitizedWithMentions.sex === 'Female', 'Sex is normalized to Female when mentioned');

    // 3b. OCR image/scanned PDF mode: empty rawDocText preserves Gemini OCR DOB, age, and sex
    const ocrSanitized = aiService.sanitizeExtractedResumeData(validData, {}, '');
    assert(ocrSanitized.dateOfBirth === 'October 24, 2000', 'OCR mode (empty rawDocText) preserves dateOfBirth');
    assert(ocrSanitized.age === 24, 'OCR mode (empty rawDocText) preserves age');
    assert(ocrSanitized.sex === 'Female', 'OCR mode (empty rawDocText) preserves sex');

    // 4. Fallback execution: parseResumeWithAi returns extracted data using heuristic fallback
    const fallbackParse = await aiService.parseResumeWithAi(
      { fileName: 'Sample.pdf' },
      'Juan Dela Cruz\nEmail: juan@example.com\nPhone: 09171234567\nRoxas Oriental Mindoro\nSkills: TypeScript, TailwindCSS',
      null
    );
    assert(fallbackParse.success === true, 'parseResumeWithAi succeeds with fallback');
    assert(typeof fallbackParse.source === 'string', 'parseResumeWithAi returns source identifier');
    assert(fallbackParse.extracted.contactNumber.length > 0 || fallbackParse.extracted.email.length > 0, 'parseResumeWithAi extracts contact details');
  }

  // -------------------------------------------------------------
  // Suite 3: Controller & Express Application Factory
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 3] Controller & Express App Factory (server/controllers/resumeController.ts, server/app.ts)');

  const controllerPath = path.join(rootDir, 'server/controllers/resumeController.ts');
  const appPath = path.join(rootDir, 'server/app.ts');

  assert(fs.existsSync(controllerPath), 'server/controllers/resumeController.ts exists on disk');
  assert(fs.existsSync(appPath), 'server/app.ts exists on disk');

  if (fs.existsSync(controllerPath) && fs.existsSync(appPath)) {
    const controllerContent = fs.readFileSync(controllerPath, 'utf-8');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    assert(controllerContent.includes('handleResumeParsing'), 'handleResumeParsing is exported');
    assert(controllerContent.includes('handleHealthCheck'), 'handleHealthCheck is exported');
    assert(appContent.includes('createApp'), 'createApp is exported from server/app.ts');

    const { createApp } = await import('../server/app.ts');
    const testToken = 'arch08-test-token';
    const app = createApp({ verifyToken: async (token) => token === testToken });
    assert(typeof app === 'function', 'createApp returns Express application instance');

    // Start ephemeral server on random port to test HTTP request/response handling
    const serverInstance = await new Promise<any>((resolve) => {
      const server = app.listen(0, '127.0.0.1', () => resolve(server));
    });
    const port = serverInstance.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testToken}`,
    };

    try {
      // 1. Test GET /api/health
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert(healthRes.status === 200, 'GET /api/health returns status 200');
      const healthData = await healthRes.json();
      assert(healthData.status === 'ok', 'health status is ok');
      assert(healthData.system.includes('eHANAP'), 'health response identifies eHANAP system');

      // 1b. Test unauthenticated and invalid-token POST requests are rejected
      const unauthRes = await fetch(`${baseUrl}/api/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: 'unauth.txt', fileContent: 'test' }),
      });
      assert(unauthRes.status === 401, 'unauthenticated POST /api/parse-resume returns status 401');

      const unauthExtractRes = await fetch(`${baseUrl}/api/extract-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: 'unauth.txt', fileContent: 'test' }),
      });
      assert(unauthExtractRes.status === 401, 'unauthenticated POST /api/extract-resume returns status 401');

      const badTokenRes = await fetch(`${baseUrl}/api/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong-token' },
        body: JSON.stringify({ fileName: 'unauth.txt', fileContent: 'test' }),
      });
      assert(badTokenRes.status === 401, 'invalid Bearer token on POST /api/parse-resume returns status 401');

      // 2. Test POST /api/parse-resume
      const parseRes = await fetch(`${baseUrl}/api/parse-resume`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fileName: 'Juan_Resume.txt',
          fileContent: 'Juan Dela Cruz\nEmail: juan.delacruz@gmail.com\nPhone: 09181234567\nRoxas, Oriental Mindoro\nBS Information Technology\nSkills: React, Node.js',
        }),
      });
      assert(parseRes.status === 200, 'POST /api/parse-resume returns status 200');
      const parseData = await parseRes.json();
      assert(parseData.success === true, 'parse-resume response success is true');
      assert(Boolean(parseData.extracted), 'parse-resume returns extracted resume data');
      assert(parseData.extracted.municipality === 'Roxas', 'extracted municipality matches Roxas');

      // 3. Test POST /api/extract-resume (endpoint alias)
      const extractRes = await fetch(`${baseUrl}/api/extract-resume`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fileName: 'Maria_Resume.txt',
          fileContent: 'Maria Santos\nBarangay Dangay, Roxas Oriental Mindoro\nSkills: Cashiering, Customer Service',
        }),
      });
      assert(extractRes.status === 200, 'POST /api/extract-resume alias returns status 200');
      const extractData = await extractRes.json();
      assert(extractData.success === true, 'extract-resume alias success is true');

      // 4. Test error resilience with corrupt/empty body
      const errorRes = await fetch(`${baseUrl}/api/parse-resume`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ fileBase64: 'corrupted!!!base64' }),
      });
      assert(errorRes.status === 200, 'corrupt input returns status 200 with safe fallback');
      const errorData = await errorRes.json();
      assert(errorData.success === true, 'corrupt input safely handled without server crash');
    } finally {
      serverInstance.closeAllConnections?.();
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  }

  // -------------------------------------------------------------
  // Suite 4: Structural Architecture, Line Counts & Module Decomposition
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 4] Structural Architecture & server.ts Line-Count Decomposition');

  const serverTsPath = path.join(rootDir, 'server.ts');
  assert(fs.existsSync(serverTsPath), 'server.ts exists on disk');

  if (fs.existsSync(serverTsPath)) {
    const serverTsContent = fs.readFileSync(serverTsPath, 'utf-8');
    const lineCount = serverTsContent.split('\n').length;
    console.log(`[INFO] Current server.ts line count: ${lineCount}`);

    assert(lineCount <= 60, `server.ts is reduced to <= 60 lines (Actual: ${lineCount})`);
    assert(serverTsContent.includes("from './server/app'") || serverTsContent.includes('from "./server/app"'), 'server.ts delegates to ./server/app');
    assert(!serverTsContent.includes('GoogleGenAI'), 'server.ts contains zero direct GoogleGenAI imports');
    assert(!serverTsContent.includes('mammoth'), 'server.ts contains zero direct mammoth imports');
    assert(!serverTsContent.includes('pdf-parse'), 'server.ts contains zero direct pdf-parse imports');
    assert(!serverTsContent.includes('CRITICAL INCLUSIVITY'), 'server.ts contains zero inlined prompt strings');
  }

  // -------------------------------------------------------------
  // Suite 5: Modular Isolation & Standalone Testability
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 5] Modular Isolation & Backend Clean Architecture');

  const requiredModules = [
    'server/types.ts',
    'server/services/documentParser.ts',
    'server/services/aiResumeService.ts',
    'server/controllers/resumeController.ts',
    'server/app.ts',
  ];

  for (const mod of requiredModules) {
    const fullModPath = path.join(rootDir, mod);
    assert(fs.existsSync(fullModPath), `Modular component ${mod} exists in repository structure`);
  }

  console.log(`\n--- ARCH-08 Modular Server Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
  if (passedTests === totalTests && totalTests > 0) {
    console.log('🎉 ARCH-08 Modular Server is VERIFIED successfully!\n');
  } else {
    console.error(`❌ Verification FAILED: ${totalTests - passedTests} failing assertions.\n`);
    process.exitCode = 1;
  }
}

runVerification().catch((err) => {
  console.error('[CRITICAL] Unhandled verification error:', err);
  process.exit(1);
});
