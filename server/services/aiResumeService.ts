import { GoogleGenAI, Type } from '@google/genai';
import { extractResumeInfoFromText } from '../../src/utils/resumeExtractorCore';
import type { ResumeParsePayload, ExtractedResumeData, ResumeApiResponse, CircuitBreakerStatus } from '../types';

/**
 * Circuit breaker state for Gemini API quota
 */
let isGeminiQuotaDepleted = false;
let geminiCooldownUntil = 0;

export function getCircuitBreakerStatus(): CircuitBreakerStatus {
  const now = Date.now();
  const isDepleted = isGeminiQuotaDepleted && now < geminiCooldownUntil;
  return {
    isQuotaDepleted: isDepleted,
    cooldownUntil: geminiCooldownUntil,
    remainingCooldownMs: Math.max(0, geminiCooldownUntil - now),
  };
}

export function isCircuitBreakerTripped(): boolean {
  return isGeminiQuotaDepleted && Date.now() < geminiCooldownUntil;
}

export function tripCircuitBreaker(cooldownMs: number = 60 * 60 * 1000): void {
  isGeminiQuotaDepleted = true;
  geminiCooldownUntil = Date.now() + cooldownMs;
}

export function resetCircuitBreaker(): void {
  isGeminiQuotaDepleted = false;
  geminiCooldownUntil = 0;
}

/**
 * Lazily initializes the GoogleGenAI client if API key is present and circuit breaker is inactive.
 */
export function getAiClient(): GoogleGenAI | null {
  if (isCircuitBreakerTripped()) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Builds the comprehensive prompt for candidate bio-data and resume parsing.
 */
export function buildResumeExtractionPrompt(options: {
  fileName?: string;
  isImage?: boolean;
  extractedDocText?: string;
}): string {
  const { fileName, isImage, extractedDocText } = options;
  const prompt = `You are an expert HR Resume & Bio-Data Parser for the PESO Oriental Mindoro job matching system (eHANAP Roxas).
Extract all candidate information from the following resume or standard Philippine Bio-Data ${isImage ? 'image using OCR' : 'text'}.

CRITICAL INCLUSIVITY & EXTRACTION MANDATES:
E-Hanap is designed to be highly inclusive, catering not only to college graduates but also to High School graduates and Out-of-School Youth (OSY) who rely on traditional Filipino bio-data sheets rather than formal corporate resumes.

1. TRADITIONAL BIO-DATA & FORMAL RESUME SUPPORT:
   - Identify whether the document is a standard corporate resume, CV, or a traditional Philippine Bio-Data sheet.
   - For Bio-Data sheets, carefully extract from standard tabular sections: Personal Data, Educational Background (Elementary, High School/Secondary, College/Vocational), Special Skills / Practical Skills, and Employment History.
2. NAMES:
   - Handle compound first names (e.g. "Maria Jade", "John Paul"), middle names/initials (e.g. "Ramos", "R."), and last names (e.g. "Santos", "Dela Cruz").
   - Also handle "Last Name, First Name Middle Name" or standard bio-data "NAME:" labels.
3. DATE OF BIRTH & AGE:
   - Support Month Day, Year (e.g. October 24, 2001), Day/Month/Year or Month/Day/Year (e.g. 24/10/2001), Year-Month-Day, or explicit age statements (e.g. "Age: 24").
   - CRITICAL: If date of birth (birthday) is NOT explicitly stated in the document, return dateOfBirth as empty string "" and age as null. Do NOT infer or guess birthday from graduation years, certification dates, or work history.
4. CONTACT DETAILS:
   - 11-digit Philippine mobile prefixes (0917..., 0998..., 0912...), international formats (+639...), or landlines.
   - Email addresses (if present on bio-data or resume).
5. COMPLETE HOME ADDRESS:
   - Extract Barangay, Municipality, and Province (especially within Oriental Mindoro municipalities such as Roxas, Mansalay, Bongabong, Calapan, Pinamalayan, etc.).
6. CIVIL STATUS & SEX:
   - Single, Married, Widowed, Separated, Solo Parent; Male or Female.
   - CRITICAL: If sex / gender is NOT explicitly stated in the document, return sex as empty string "". Do NOT assume, infer, or guess Male or Female from the person's name.
7. EDUCATION & ATTAINMENT (High School & OSY Friendly):
   - Highest Educational Attainment: High School Graduate, Senior High School, College Graduate, College Undergraduate, TVET / Vocational, Out-of-School Youth (if indicated), Master's, etc.
   - Course / Degree: exact full program title (e.g. Bachelor of Science in Information Technology, High School Diploma, TVL - SMAW NC II). NEVER change Computer Science to IT or vice versa.
   - School / Institution: High school names (e.g. Roxas National Comprehensive High School, Dangay National High School) or colleges (MinSU, JPC, EMC, etc.).
8. SKILLS CLASSIFICATION (Categorize all detected technical, trade, practical, and soft skills into 6 categories):
   - tradeSkills: Technical, Trade & Practical Skills (Automotive, Electrical Wiring, Plumbing, Welding/SMAW, Carpentry, Heavy Equipment, Driving, Masonry, TESDA NC II competencies, etc.)
   - administrativeSkills: Office & Clerical Skills (Data Entry, Records, Bookkeeping, Filing, Spreadsheets, Typing, Reception, Scheduling, etc.)
   - serviceHospitalitySkills: Service, Culinary & Caregiving (Cooking, Food Preparation, Waitstaff, Dishwashing, Housekeeping, Barista, Caregiving, Laundry, etc.)
   - salesCustomerSkills: Sales, Retail & Commerce (Cashiering, Store Keeping, Merchandising, Customer Service, Inventory, POS operation, Selling, etc.)
   - itCreativeSkills: IT & Digital Skills (Web Development, React, JavaScript, Python, AutoCAD, Graphic Design, Social Media, Computer Troubleshooting, etc.)
   - softSkills: Interpersonal & Workplace Competencies (Punctuality, Diligence, Hardworking, Honest, Teamwork, Communication, Fast Learner, etc.)

Resume / Bio-Data File Name: ${fileName || (isImage ? 'BioData_Image.png' : 'BioData.pdf')}
${extractedDocText ? `Document Content:\n${extractedDocText.slice(0, 12000)}` : ''}
`;
  return prompt;
}

/**
 * Builds Gemini contents payload for text, PDF inline data, or OCR images.
 */
export function buildGeminiContents(
  prompt: string,
  options: {
    extractedDocText?: string;
    buffer?: Buffer | null;
    fileBase64?: string;
    isPdf?: boolean;
    isImage?: boolean;
    mimeType?: string;
    fileName?: string;
  }
): any {
  const { extractedDocText, buffer, fileBase64, isPdf, isImage, mimeType, fileName } = options;
  const lowerFileName = (fileName || '').toLowerCase();
  const imageMime = (mimeType && mimeType.startsWith('image/')) 
    ? mimeType 
    : (lowerFileName.endsWith('.png') ? 'image/png' : 'image/jpeg');

  if (extractedDocText) {
    return prompt;
  }

  if (buffer && isPdf && fileBase64) {
    return {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBase64,
          },
        },
        { text: prompt },
      ],
    };
  }

  if (buffer && isImage && fileBase64) {
    return {
      parts: [
        {
          inlineData: {
            mimeType: imageMime,
            data: fileBase64,
          },
        },
        { text: `Perform OCR on this resume image and extract all candidate information strictly as written:\n` + prompt },
      ],
    };
  }

  return prompt;
}

export const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export const RESUME_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    firstName: { type: Type.STRING },
    middleName: { type: Type.STRING },
    lastName: { type: Type.STRING },
    email: { type: Type.STRING },
    contactNumber: { type: Type.STRING },
    dateOfBirth: { type: Type.STRING },
    age: { type: Type.NUMBER },
    civilStatus: { type: Type.STRING },
    sex: { type: Type.STRING },
    address: { type: Type.STRING },
    barangay: { type: Type.STRING },
    municipality: { type: Type.STRING },
    professionalSummary: { type: Type.STRING },
    educationalAttainment: { type: Type.STRING },
    primaryDegree: { type: Type.STRING },
    school: { type: Type.STRING },
    yearGraduated: { type: Type.NUMBER },
    tradeSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    administrativeSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    serviceHospitalitySkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    salesCustomerSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    itCreativeSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    softSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    technicalSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    extractedSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    extractedExperienceYears: { type: Type.NUMBER },
    certifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['primaryDegree', 'extractedSkills'],
};

/**
 * Sanitizes Gemini extracted data with anti-hallucination guards against birthday/sex inference
 * and normalizes educational and skills collections against heuristic fallback.
 */
export function sanitizeExtractedResumeData(
  geminiData: any,
  fallbackInfo: any,
  rawDocText: string
): ExtractedResumeData {
  const resolvedDegree = geminiData.primaryDegree?.trim() || fallbackInfo?.primaryDegree || '';
  const resolvedSchool = geminiData.school?.trim() || fallbackInfo?.school || '';
  const resolvedAttainment = geminiData.educationalAttainment?.trim() || fallbackInfo?.educationalAttainment || "Bachelor's Degree";

  // Ensure education records reflect the accurate degree
  const resolvedEducation = (fallbackInfo?.education && fallbackInfo.education.length > 0)
    ? fallbackInfo.education.map((e: any) => ({
        ...e,
        degreeCourse: resolvedDegree || e.degreeCourse,
        school: resolvedSchool || e.school,
        educationalAttainment: resolvedAttainment || e.educationalAttainment,
      }))
    : (resolvedDegree || resolvedSchool)
      ? [{
          id: `edu-${Date.now()}-1`,
          degreeCourse: resolvedDegree,
          school: resolvedSchool || 'Educational Institution',
          yearGraduated: geminiData.yearGraduated || fallbackInfo?.yearGraduated || new Date().getFullYear(),
          educationalAttainment: resolvedAttainment,
        }]
      : [];

  // Verify if document actually mentions birthday or sex to prevent LLM guessing
  const rawText = (rawDocText || '').toLowerCase();
  const hasDobMention = /\b(birth|dob|birthday|born)\b/i.test(rawText);
  const resolvedDob = hasDobMention ? (geminiData.dateOfBirth || fallbackInfo?.dateOfBirth || '') : '';
  const resolvedAge = hasDobMention ? (typeof geminiData.age === 'number' ? geminiData.age : fallbackInfo?.age) : undefined;

  const hasSexMention = /\b(sex|gender|female|male)\b/i.test(rawText);
  let resolvedSex = '';
  if (hasSexMention) {
    const candidateSex = String(geminiData.sex || fallbackInfo?.sex || '').toLowerCase();
    if (candidateSex.includes('female') || candidateSex.startsWith('f')) {
      resolvedSex = 'Female';
    } else if (candidateSex.includes('male') || candidateSex.startsWith('m')) {
      resolvedSex = 'Male';
    }
  }

  return {
    firstName: geminiData.firstName || fallbackInfo?.firstName || 'Applicant',
    middleName: geminiData.middleName || fallbackInfo?.middleName || '',
    lastName: geminiData.lastName || fallbackInfo?.lastName || '',
    email: geminiData.email || fallbackInfo?.email || '',
    contactNumber: geminiData.contactNumber || fallbackInfo?.contactNumber || '',
    dateOfBirth: resolvedDob,
    age: (typeof resolvedAge === 'number' && resolvedAge > 0) ? resolvedAge : undefined,
    civilStatus: geminiData.civilStatus || fallbackInfo?.civilStatus || 'Single',
    sex: resolvedSex,
    address: geminiData.address || fallbackInfo?.address || '',
    barangay: geminiData.barangay || fallbackInfo?.barangay || '',
    municipality: geminiData.municipality || fallbackInfo?.municipality || 'Roxas',
    professionalSummary: geminiData.professionalSummary || fallbackInfo?.professionalSummary || '',
    educationalAttainment: resolvedAttainment,
    primaryDegree: resolvedDegree,
    school: resolvedSchool,
    yearGraduated: geminiData.yearGraduated || fallbackInfo?.yearGraduated || new Date().getFullYear(),
    education: resolvedEducation,
    workExperience: fallbackInfo?.workExperience || [],
    tradeSkills: (geminiData.tradeSkills && geminiData.tradeSkills.length > 0)
      ? geminiData.tradeSkills
      : fallbackInfo?.tradeSkills || [],
    administrativeSkills: (geminiData.administrativeSkills && geminiData.administrativeSkills.length > 0)
      ? geminiData.administrativeSkills
      : fallbackInfo?.administrativeSkills || [],
    serviceHospitalitySkills: (geminiData.serviceHospitalitySkills && geminiData.serviceHospitalitySkills.length > 0)
      ? geminiData.serviceHospitalitySkills
      : fallbackInfo?.serviceHospitalitySkills || [],
    salesCustomerSkills: (geminiData.salesCustomerSkills && geminiData.salesCustomerSkills.length > 0)
      ? geminiData.salesCustomerSkills
      : fallbackInfo?.salesCustomerSkills || [],
    itCreativeSkills: (geminiData.itCreativeSkills && geminiData.itCreativeSkills.length > 0)
      ? geminiData.itCreativeSkills
      : fallbackInfo?.itCreativeSkills || [],
    technicalSkills: (geminiData.technicalSkills && geminiData.technicalSkills.length > 0)
      ? geminiData.technicalSkills
      : fallbackInfo?.technicalSkills || [],
    softSkills: (geminiData.softSkills && geminiData.softSkills.length > 0)
      ? geminiData.softSkills
      : fallbackInfo?.softSkills || [],
    extractedSkills: (geminiData.extractedSkills && geminiData.extractedSkills.length > 0)
      ? geminiData.extractedSkills
      : fallbackInfo?.extractedSkills || [],
    extractedExperienceYears: typeof geminiData.extractedExperienceYears === 'number'
      ? geminiData.extractedExperienceYears
      : fallbackInfo?.extractedExperienceYears,
    certifications: (geminiData.certifications && geminiData.certifications.length > 0)
      ? geminiData.certifications
      : fallbackInfo?.certifications || [],
    rawTextPreview: (rawDocText && rawDocText.slice(0, 350)) || fallbackInfo?.rawTextPreview || '',
  };
}

/**
 * Orchestrates LLM resume parsing with model failover and circuit breaker protection,
 * falling back seamlessly to deterministic heuristic extraction.
 */
export async function parseResumeWithAi(
  payload: ResumeParsePayload,
  extractedDocText: string,
  buffer: Buffer | null,
  options?: { isPdf?: boolean; isDocx?: boolean; isImage?: boolean }
): Promise<ResumeApiResponse> {
  const { fileName, fileBase64, mimeType } = payload;
  const lowerFileName = (fileName || '').toLowerCase();
  const isPdf = options?.isPdf ?? (lowerFileName.endsWith('.pdf') || mimeType === 'application/pdf');
  const isImage = options?.isImage ?? (
    lowerFileName.endsWith('.png') || lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') ||
    Boolean(mimeType && mimeType.startsWith('image/'))
  );

  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = buildResumeExtractionPrompt({ fileName, isImage, extractedDocText });
      const geminiContents = buildGeminiContents(prompt, {
        extractedDocText,
        buffer,
        fileBase64,
        isPdf,
        isImage,
        mimeType,
        fileName,
      });

      let geminiResponse: any = null;
      let usedModel = CANDIDATE_MODELS[0];

      for (const m of CANDIDATE_MODELS) {
        try {
          geminiResponse = await ai.models.generateContent({
            model: m,
            contents: geminiContents,
            config: {
              responseMimeType: 'application/json',
              responseSchema: RESUME_RESPONSE_SCHEMA,
            },
          });
          usedModel = m;
          if (geminiResponse?.text) break;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('prepayment') || errMsg.includes('credits')) {
            tripCircuitBreaker();
            break;
          }
          // continue to next candidate model
        }
      }

      const parsedText = geminiResponse?.text?.trim();
      if (parsedText) {
        const geminiData = JSON.parse(parsedText);
        const fallbackInfo = extractResumeInfoFromText(extractedDocText, fileName);
        const sanitized = sanitizeExtractedResumeData(geminiData, fallbackInfo, extractedDocText);

        return {
          success: true,
          source: usedModel,
          extracted: sanitized,
        };
      }
    } catch (geminiError: any) {
      const errString = String(geminiError?.message || geminiError || '');
      if (
        errString.includes('429') ||
        errString.includes('RESOURCE_EXHAUSTED') ||
        errString.includes('prepayment') ||
        errString.includes('credits') ||
        errString.includes('quota')
      ) {
        tripCircuitBreaker();
      }
    }
  }

  // Deterministic local document parser fallback
  const extracted = extractResumeInfoFromText(extractedDocText, fileName);
  return {
    success: true,
    source: 'document-text-extractor',
    extracted: extracted as any,
  };
}
