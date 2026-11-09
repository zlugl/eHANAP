import { evaluateResumeForAts } from '../src/utils/atsEngine';
import { JobPost } from '../src/types';

console.log('--- eHANAP Milestone 07: ATS Resume Evaluation Engine Verification ---');

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

// ---------------------------------------------------------------------------
// Mock Entities
// ---------------------------------------------------------------------------
const mockJob: JobPost = {
  id: 'job-ats-01',
  employerId: 'emp-01',
  companyName: 'Mindoro Tech Solutions',
  companyMunicipality: 'Roxas',
  companyVerified: true,
  title: 'Junior Web Developer',
  category: 'Information Technology & Software',
  workLocation: 'Roxas, Oriental Mindoro',
  municipality: 'Roxas',
  employmentType: 'Full-time',
  minEducationalAttainment: "Bachelor's Degree",
  preferredDegree: 'BS Information Technology',
  degreeImportance: 'required',
  minExperienceYears: 1,
  experienceImportance: 'preferred',
  salaryRange: '₱18,000 - ₱25,000 / month',
  requiredSkills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'REST API'],
  preferredSkills: ['TypeScript', 'Tailwind CSS', 'Node.js'],
  technicalSkills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
  softSkills: ['Teamwork', 'Communication'],
  requiredCertifications: [],
  description: 'Frontend and web application development for local business systems.',
  responsibilities: ['Build responsive web interfaces', 'Collaborate with team'],
  vacanciesCount: 2,
  applicationDeadline: '2026-12-31',
  status: 'active',
  postedDate: '2026-11-01T00:00:00.000Z',
  requirements: [],
};

// ---------------------------------------------------------------------------
// Test Suite 1: Full High-Quality Resume Profile
// ---------------------------------------------------------------------------
console.log('\n[Suite 1] Complete ATS-Ready Profile');
const completeResume = {
  firstName: 'Maria',
  lastName: 'Santos',
  email: 'maria.santos@email.com',
  contactNumber: '0918-765-4321',
  municipality: 'Roxas',
  professionalSummary: 'Dedicated web developer with experience creating modern, responsive web applications in React and TypeScript for Roxas MSMEs.',
  primaryDegree: 'BS Information Technology',
  educationalAttainment: "Bachelor's Degree",
  extractedExperienceYears: 2,
  workExperience: [
    {
      company: 'Mindoro Web Studio',
      position: 'Junior Frontend Developer',
      yearsOfExperience: 2,
    },
  ],
  education: [
    {
      school: 'Mindoro State University - Bongabong Campus',
      degree: 'BS Information Technology',
      yearGraduated: '2024',
    },
  ],
  technicalSkills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'REST API', 'TypeScript', 'Tailwind CSS'],
  softSkills: ['Teamwork', 'Communication'],
  certifications: [{ name: 'Certified React Developer' }],
  rawTextPreview: 'Maria Santos Roxas Oriental Mindoro maria.santos@email.com 0918-765-4321 Education BS Information Technology Experience Skills React JavaScript HTML CSS Git',
};

const fullScan = evaluateResumeForAts(completeResume, mockJob);
assert(fullScan.score >= 80, `Complete profile scores high ATS score (Actual: ${fullScan.score}%)`);
assert(fullScan.grade === 'A+' || fullScan.grade === 'A', `High grade assigned (Actual: ${fullScan.grade})`);
assert(fullScan.formatStatus === 'ats_optimized', 'Clean structured resume achieves ats_optimized format status');
assert(fullScan.sectionsDetected.includes('Education & Credentials'), 'Education section correctly detected');
assert(fullScan.sectionsDetected.includes('Work History & Experience'), 'Work History section correctly detected');
assert(fullScan.sectionsDetected.includes('Skills & Core Competencies'), 'Skills section correctly detected');
assert(fullScan.sectionsDetected.includes('Professional Summary'), 'Professional Summary section correctly detected');
assert(fullScan.matchedKeywords.length >= 4, `Finds matched keywords with target job (Found: ${fullScan.matchedKeywords.length})`);

// ---------------------------------------------------------------------------
// Test Suite 2: Contact Information Validation
// ---------------------------------------------------------------------------
console.log('\n[Suite 2] Contact Information Transparency');
const contactSection = fullScan.sectionScores.find(s => s.name === 'Contact Information');
assert(Boolean(contactSection), 'Contact Information section score is computed');
assert(contactSection?.score === 100, `Full contact details achieve 100% contact score (Actual: ${contactSection?.score}%)`);
assert(fullScan.contactCompleteness === 100, 'contactCompleteness property equals 100');

// Resume with missing email and invalid phone
const badContactResume = {
  ...completeResume,
  email: '',
  contactNumber: '123',
  municipality: '',
};
const badContactScan = evaluateResumeForAts(badContactResume, mockJob);
const badContactSec = badContactScan.sectionScores.find(s => s.name === 'Contact Information');
assert((badContactSec?.score || 0) < 50, 'Missing email, short phone, and missing municipality drop contact score');
assert(
  badContactScan.recommendations.some(r => r.includes('email address')),
  'Provides actionable recommendation to add verified email'
);
assert(
  badContactScan.recommendations.some(r => r.includes('mobile contact number')),
  'Provides actionable recommendation to format Philippine mobile number'
);
assert(
  badContactScan.recommendations.some(r => r.includes('municipality in Oriental Mindoro')),
  'Provides recommendation for Oriental Mindoro municipality specification'
);

// ---------------------------------------------------------------------------
// Test Suite 3: Section Detection & Completeness
// ---------------------------------------------------------------------------
console.log('\n[Suite 3] Section Detection & Missing Component Advice');
const barebonesResume = {
  firstName: 'Juan',
  lastName: 'Roxas',
  email: 'juan@test.com',
  contactNumber: '0917-111-2222',
  municipality: 'Roxas',
  professionalSummary: '', // missing
  primaryDegree: '', // missing
  educationalAttainment: '',
  education: [],
  workExperience: [], // missing
  technicalSkills: [], // missing
};
const barebonesScan = evaluateResumeForAts(barebonesResume, mockJob);
assert(barebonesScan.missingSections.includes('Professional Summary'), 'Identifies missing Professional Summary');
assert(barebonesScan.missingSections.includes('Education & Credentials'), 'Identifies missing Education section');
assert(barebonesScan.missingSections.includes('Work History'), 'Identifies missing Work History');
assert(barebonesScan.missingSections.includes('Skills & Core Competencies'), 'Identifies missing Skills section');
assert(barebonesScan.score <= 55, `Incomplete resume receives low score (Actual: ${barebonesScan.score}%)`);
assert(barebonesScan.grade === 'C' || barebonesScan.grade === 'D', `Low grade assigned for incomplete resume (Actual: ${barebonesScan.grade})`);

// ---------------------------------------------------------------------------
// Test Suite 4: Keyword Density & Target Job Alignment
// ---------------------------------------------------------------------------
console.log('\n[Suite 4] Keyword Density & Job Vacancy Keyword Alignment');
// Full resume contains React, JavaScript, HTML, CSS, Git, REST API
assert(
  fullScan.matchedKeywords.some(k => k.toLowerCase().includes('react')),
  'Matches React keyword against vacancy'
);
assert(
  fullScan.matchedKeywords.some(k => k.toLowerCase().includes('javascript')),
  'Matches JavaScript keyword against vacancy'
);
assert(fullScan.keywordDensityPercent > 0, `Keyword density is calculated (Actual: ${fullScan.keywordDensityPercent}%)`);

// Resume without target job evaluates with general PESO ATS benchmarks
const generalScan = evaluateResumeForAts(completeResume, null);
assert(generalScan.score >= 70, 'ATS evaluation succeeds gracefully without specific job vacancy');
const keywordSec = generalScan.sectionScores.find(s => s.name === 'ATS Keyword & Skill Density');
assert(Boolean(keywordSec), 'General ATS scan provides baseline Keyword Density metrics');

// ---------------------------------------------------------------------------
// Test Suite 5: Machine Readability & Format Detection
// ---------------------------------------------------------------------------
console.log('\n[Suite 5] Machine-Readability & Format Inspection');
const pdfResume = {
  ...completeResume,
  fileName: 'Maria_Santos_Resume.pdf',
  fileType: 'application/pdf',
};
const pdfScan = evaluateResumeForAts(pdfResume, mockJob);
const formatSec = pdfScan.sectionScores.find(s => s.name === 'Document Readability & Layout');
assert(Boolean(formatSec), 'Format & Document Readability section is computed');
assert(formatSec?.score ? formatSec.score >= 80 : false, 'Standard PDF format passes machine readability checks');
assert(pdfScan.readabilityScore >= 80, `Overall readability score is high (Actual: ${pdfScan.readabilityScore})`);

console.log(`\n--- ATS Resume Engine Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
if (passedTests === totalTests) {
  console.log('Applicant Tracking System (ATS) Engine is VERIFIED!\n');
} else {
  console.error(`Failed ${totalTests - passedTests} tests.\n`);
  process.exitCode = 1;
}
