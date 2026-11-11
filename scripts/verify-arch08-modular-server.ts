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
