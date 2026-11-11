import type express from 'express';
import { extractTextFromPayload } from '../services/documentParser';
import { parseResumeWithAi } from '../services/aiResumeService';
import { extractResumeInfoFromText } from '../../src/utils/resumeExtractorCore';

/**
 * Health check handler returning eHANAP Oriental Mindoro PESO cloud status.
 */
export const handleHealthCheck: express.RequestHandler = (req, res) => {
  res.json({ status: 'ok', system: 'eHANAP Oriental Mindoro PESO Cloud Backend' });
};

/**
 * Resume parsing controller handler.
 * Decodes uploaded resume/bio-data documents, orchestrates Gemini extraction,
 * and seamlessly provides deterministic fallback.
 */
export const handleResumeParsing: express.RequestHandler = async (req, res) => {
  try {
    const payload = req.body || {};
    const parsed = await extractTextFromPayload(payload);
    const result = await parseResumeWithAi(
      payload,
      parsed.extractedText,
      parsed.buffer,
      { isPdf: parsed.isPdf, isDocx: parsed.isDocx, isImage: parsed.isImage }
    );
    return res.json(result);
  } catch {
    // Safe fallback extraction even in exceptional circumstances
    const fallback = extractResumeInfoFromText(
      req.body?.fileText || req.body?.fileContent || '',
      req.body?.fileName
    );
    return res.json({
      success: true,
      source: 'fallback-safe',
      extracted: fallback,
    });
  }
};
