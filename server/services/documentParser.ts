import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';
import type { ResumeParsePayload, ParsedDocumentPayload } from '../types';

/**
 * Extracts text from a PDF Buffer using pdf-parse or plaintext ASCII extraction fallback.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
    if (PDFParseClass) {
      const parser = new PDFParseClass({ data: new Uint8Array(buffer) });
      const res = await parser.getText();
      if (typeof res === 'string' && res.trim()) return res.trim();
      if (res && typeof res.text === 'string' && res.text.trim()) return res.text.trim();
    }
  } catch {
    // Continue to next extraction method
  }

  try {
    const defaultFn = (pdfParseModule as any).default || pdfParseModule;
    if (typeof defaultFn === 'function') {
      const parsed = await defaultFn(buffer);
      if (parsed?.text && parsed.text.trim()) return parsed.text.trim();
    }
  } catch {
    // Continue to fallback
  }

  // Fallback: extract plain text strings from the buffer
  try {
    const raw = buffer.toString('utf-8');
    const matches = raw.match(/[a-zA-Z0-9.,@#\s-]{4,}/g);
    if (matches && (matches.length > 5 || matches.join(' ').trim().length > 30)) {
      return matches.join(' ');
    }
  } catch {
    // quiet fallback
  }
  return '';
}

/**
 * Extracts raw text from a DOCX Buffer using mammoth.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch {
    return '';
  }
}

/**
 * Processes a ResumeParsePayload to determine document format, decode base64 buffer,
 * and extract text content via appropriate parser.
 */
export async function extractTextFromPayload(payload: ResumeParsePayload): Promise<ParsedDocumentPayload> {
  const { fileName, fileBase64, mimeType, fileContent, fileText, extractedDocText: incomingDocText } = payload || {};

  let extractedText = fileText || fileContent || incomingDocText || '';
  let buffer: Buffer | null = null;

  if (fileBase64) {
    try {
      buffer = Buffer.from(fileBase64, 'base64');
    } catch (e) {
      console.warn('[Resume Upload] Error converting base64 to buffer:', e);
    }
  }

  const lowerFileName = (fileName || '').toLowerCase();
  const isPdf = lowerFileName.endsWith('.pdf') || mimeType === 'application/pdf';
  const isDocx = lowerFileName.endsWith('.docx') || lowerFileName.endsWith('.doc') || 
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    mimeType === 'application/msword';
  const isImage = lowerFileName.endsWith('.png') || lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') ||
    Boolean(mimeType && mimeType.startsWith('image/'));

  if (buffer) {
    if (isPdf) {
      const pdfText = await extractTextFromPdfBuffer(buffer);
      if (pdfText) extractedText = pdfText;
    } else if (isDocx) {
      const docxText = await extractTextFromDocxBuffer(buffer);
      if (docxText) extractedText = docxText;
    } else if (!isImage && !extractedText) {
      // Plain text fallback
      try {
        extractedText = buffer.toString('utf-8');
      } catch {
        extractedText = fileContent || '';
      }
    }
  } else if (!extractedText && fileContent) {
    extractedText = fileContent;
  }

  return {
    extractedText,
    isPdf,
    isDocx,
    isImage,
    buffer,
  };
}
