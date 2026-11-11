/**
 * eHANAP Backend Architecture - Server Types
 * Decoupled type contracts for document parsing, Gemini AI extraction, and HTTP endpoints.
 */

export interface ResumeParsePayload {
  fileName?: string;
  fileBase64?: string;
  mimeType?: string;
  fileContent?: string;
  fileText?: string;
  extractedDocText?: string;
}

export interface ParsedDocumentPayload {
  extractedText: string;
  isPdf: boolean;
  isDocx: boolean;
  isImage: boolean;
  buffer: Buffer | null;
}

export interface EducationRecord {
  id?: string;
  degreeCourse: string;
  school: string;
  yearGraduated?: number;
  educationalAttainment?: string;
}

export interface ExtractedResumeData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  dateOfBirth: string;
  age?: number;
  civilStatus: string;
  sex: string;
  address: string;
  barangay: string;
  municipality: string;
  professionalSummary: string;
  educationalAttainment: string;
  primaryDegree: string;
  school: string;
  yearGraduated: number;
  education?: EducationRecord[];
  workExperience?: any[];
  tradeSkills: string[];
  administrativeSkills: string[];
  serviceHospitalitySkills: string[];
  salesCustomerSkills: string[];
  itCreativeSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  extractedSkills: string[];
  extractedExperienceYears?: number;
  certifications: string[];
  rawTextPreview?: string;
}

export interface ResumeApiResponse {
  success: boolean;
  source: string;
  extracted: ExtractedResumeData;
  error?: string;
}

export interface CircuitBreakerStatus {
  isQuotaDepleted: boolean;
  cooldownUntil: number;
  remainingCooldownMs: number;
}
