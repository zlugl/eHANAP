import {
  SupabaseTableName,
  saveRecord as saveSupabaseRecord,
  saveRecords as saveSupabaseRecords,
  updateRecord as updateSupabaseRecord,
  deleteRecord as deleteSupabaseRecord,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { JobSeekerProfile, EmployerProfile } from '../types';

// Supabase-exclusive persistence wrappers used across domain contexts
export const saveDocument = <T extends { id: string }>(table: SupabaseTableName | string, item: T) => {
  if (isSupabaseConfigured()) {
    saveSupabaseRecord(table as SupabaseTableName, item).catch((err) => {
      console.warn(`[Supabase] Persistence sync warning for ${table}:`, err);
    });
  }
};

export const saveDocuments = <T extends { id: string }>(table: SupabaseTableName | string, items: T[]) => {
  if (items.length > 0 && isSupabaseConfigured()) {
    saveSupabaseRecords(table as SupabaseTableName, items).catch((err) => {
      console.warn(`[Supabase] Batch persistence sync warning for ${table}:`, err);
    });
  }
};

export const deleteDocument = (table: SupabaseTableName | string, id: string) => {
  if (isSupabaseConfigured()) {
    deleteSupabaseRecord(table as SupabaseTableName, id).catch((err) => {
      console.warn(`[Supabase] Persistence delete warning for ${table}:`, err);
    });
  }
};

export const updateDocument = (table: SupabaseTableName | string, id: string, updates: Record<string, any>) => {
  if (isSupabaseConfigured()) {
    updateSupabaseRecord(table as SupabaseTableName, id, updates).catch((err) => {
      console.warn(`[Supabase] Persistence update warning for ${table}:`, err);
    });
  }
};

const toUpperSafe = (val?: string): string | undefined => (typeof val === 'string' ? val.toUpperCase() : val);
const toUpperArraySafe = (arr?: string[]): string[] | undefined =>
  Array.isArray(arr) ? arr.map((s) => (typeof s === 'string' ? s.toUpperCase() : s)) : arr;

export const normalizeSeekerProfileToUpperCase = (data: Partial<JobSeekerProfile>): Partial<JobSeekerProfile> => {
  const next: Partial<JobSeekerProfile> = { ...data };
  if (next.firstName !== undefined) next.firstName = toUpperSafe(next.firstName)!;
  if (next.middleName !== undefined) next.middleName = toUpperSafe(next.middleName);
  if (next.lastName !== undefined) next.lastName = toUpperSafe(next.lastName)!;
  if (next.address !== undefined) next.address = toUpperSafe(next.address)!;
  if (next.barangay !== undefined) next.barangay = toUpperSafe(next.barangay);
  if (next.primaryDegree !== undefined) next.primaryDegree = toUpperSafe(next.primaryDegree);
  if (next.professionalSummary !== undefined) next.professionalSummary = toUpperSafe(next.professionalSummary);
  if (next.summary !== undefined) next.summary = toUpperSafe(next.summary);
  if (next.bioDataDetails !== undefined) next.bioDataDetails = toUpperSafe(next.bioDataDetails);
  if (next.walkInAssessmentNotes !== undefined) next.walkInAssessmentNotes = toUpperSafe(next.walkInAssessmentNotes);
  if (next.technicalSkills !== undefined) next.technicalSkills = toUpperArraySafe(next.technicalSkills)!;
  if (next.softSkills !== undefined) next.softSkills = toUpperArraySafe(next.softSkills)!;
  if (next.tradeSkills !== undefined) next.tradeSkills = toUpperArraySafe(next.tradeSkills);
  if (next.administrativeSkills !== undefined) next.administrativeSkills = toUpperArraySafe(next.administrativeSkills);
  if (next.serviceHospitalitySkills !== undefined) next.serviceHospitalitySkills = toUpperArraySafe(next.serviceHospitalitySkills);
  if (next.salesCustomerSkills !== undefined) next.salesCustomerSkills = toUpperArraySafe(next.salesCustomerSkills);
  if (next.itCreativeSkills !== undefined) next.itCreativeSkills = toUpperArraySafe(next.itCreativeSkills);
  if (next.practicalSkills !== undefined) next.practicalSkills = toUpperArraySafe(next.practicalSkills);
  if (next.tradeCertifications !== undefined) next.tradeCertifications = toUpperArraySafe(next.tradeCertifications);

  if (Array.isArray(next.education)) {
    next.education = next.education.map((edu) => ({
      ...edu,
      degreeCourse: toUpperSafe(edu.degreeCourse) || '',
      school: toUpperSafe(edu.school) || '',
      honors: toUpperSafe(edu.honors),
    }));
  }
  if (Array.isArray(next.workExperience)) {
    next.workExperience = next.workExperience.map((exp) => ({
      ...exp,
      company: toUpperSafe(exp.company) || '',
      position: toUpperSafe(exp.position) || '',
      responsibilities: toUpperSafe(exp.responsibilities) || '',
    }));
  }
  if (Array.isArray(next.certifications)) {
    next.certifications = next.certifications.map((cert) => ({
      ...cert,
      name: toUpperSafe(cert.name) || '',
      issuingOrganization: toUpperSafe(cert.issuingOrganization) || '',
    }));
  }
  if (Array.isArray(next.projects)) {
    next.projects = next.projects.map((proj) => ({
      ...proj,
      name: toUpperSafe(proj.name) || '',
      client: toUpperSafe(proj.client),
      description: toUpperSafe(proj.description) || '',
      // Note: projectUrl is intentionally NOT uppercased
    }));
  }
  if (Array.isArray(next.volunteerExperience)) {
    next.volunteerExperience = next.volunteerExperience.map((vol) => ({
      ...vol,
      role: toUpperSafe(vol.role) || '',
      organization: toUpperSafe(vol.organization) || '',
      description: toUpperSafe(vol.description) || '',
    }));
  }
  if (Array.isArray(next.awards)) {
    next.awards = next.awards.map((awd) => ({
      ...awd,
      title: toUpperSafe(awd.title) || '',
      organization: toUpperSafe(awd.organization) || '',
      description: toUpperSafe(awd.description),
    }));
  }
  return next;
};

export const normalizeEmployerProfileToUpperCase = (data: Partial<EmployerProfile>): Partial<EmployerProfile> => {
  const next: Partial<EmployerProfile> = { ...data };
  if (next.companyName !== undefined) next.companyName = toUpperSafe(next.companyName)!;
  if (next.representativeName !== undefined) next.representativeName = toUpperSafe(next.representativeName)!;
  if (next.address !== undefined) next.address = toUpperSafe(next.address)!;
  if (next.barangay !== undefined) next.barangay = toUpperSafe(next.barangay);
  if (next.companyDescription !== undefined) next.companyDescription = toUpperSafe(next.companyDescription)!;
  if (next.description !== undefined) next.description = toUpperSafe(next.description);
  if (next.businessPermitNo !== undefined) next.businessPermitNo = toUpperSafe(next.businessPermitNo)!;
  if (next.dtiSecRegistration !== undefined) next.dtiSecRegistration = toUpperSafe(next.dtiSecRegistration)!;
  if (next.bir2303No !== undefined) next.bir2303No = toUpperSafe(next.bir2303No);
  // Note: email, website, logoUrl, userId, id are intentionally NOT uppercased
  return next;
};
