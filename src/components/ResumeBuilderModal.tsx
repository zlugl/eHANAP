import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { JobSeekerProfile, ResumeFile } from '../types';
import { useApp } from '../context/AppContext';
import { evaluateResumeForAts } from '../utils/atsEngine';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  Award, 
  ShieldCheck, 
  FileText,
  Palette,
  Sliders,
  Eye,
  CheckCircle2,
  Loader2,
  Laptop,
  Landmark,
  LayoutGrid
} from 'lucide-react';

interface ResumeBuilderModalProps {
  isOpen: boolean;
  seeker: JobSeekerProfile;
  onClose: () => void;
}

type TemplateType = 'modern' | 'executive' | 'classic' | 'creative';
type ColorScheme = 'emerald' | 'indigo' | 'slate' | 'crimson' | 'teal';

export const ResumeBuilderModal: React.FC<ResumeBuilderModalProps> = ({ isOpen, seeker, onClose }) => {
  const [template, setTemplate] = useState<TemplateType>('modern');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('emerald');
  const [copied, setCopied] = useState(false);

  const { updateJobSeekerProfile, showToast } = useApp();
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Section Toggles
  const [showPhoto, setShowPhoto] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showCertifications, setShowCertifications] = useState(true);
  const [showReferences, setShowReferences] = useState(true);

  // Editable customization overrides
  const [customTitle, setCustomTitle] = useState(seeker?.primaryDegree || 'Professional Specialist');
  const [customSummary, setCustomSummary] = useState(seeker?.professionalSummary || seeker?.summary || 'Dedicated professional with extensive background in delivering high-impact solutions in Oriental Mindoro.');

  React.useEffect(() => {
    if (seeker) {
      setCustomTitle(seeker.primaryDegree || 'Professional Specialist');
      setCustomSummary(seeker.professionalSummary || seeker.summary || 'Dedicated professional with extensive background in delivering high-impact solutions in Oriental Mindoro.');
    }
  }, [seeker]);

  if (!isOpen || !seeker) return null;

  const handleSaveGeneratedResume = () => {
    setIsSavingResume(true);
    try {
      const genId = `res-gen-${Date.now()}`;
      const templateTitle = template.charAt(0).toUpperCase() + template.slice(1);
      const generatedFileName = `${seeker.firstName}_${seeker.lastName}_Resume_${templateTitle}.pdf`;

      const evaluationData = {
        fileName: generatedFileName,
        fileType: 'pdf',
        extractedSkills: seeker.technicalSkills || [],
        extractedEducation: seeker.educationalAttainment || "Bachelor's Degree",
        extractedDegree: customTitle || seeker.primaryDegree || '',
        extractedExperienceYears: (seeker.workExperience || []).reduce((acc, exp) => acc + (exp.yearsOfExperience || 1), 0),
        contactNumber: seeker.contactNumber,
        email: seeker.email,
        firstName: seeker.firstName,
        lastName: seeker.lastName,
        municipality: seeker.municipality,
        professionalSummary: customSummary,
        certifications: seeker.certifications || [],
        workExperience: seeker.workExperience || [],
        education: seeker.education || []
      };

      const atsResult = evaluateResumeForAts(evaluationData);

      const newResume: ResumeFile = {
        id: genId,
        fileName: generatedFileName,
        fileSize: '156 KB',
        fileType: 'pdf',
        uploadedAt: new Date().toISOString(),
        validationStatus: 'validated',
        extractedSkills: seeker.technicalSkills || [],
        extractedEducation: seeker.educationalAttainment || "Bachelor's Degree",
        extractedDegree: customTitle || seeker.primaryDegree || '',
        extractedExperienceYears: evaluationData.extractedExperienceYears,
        atsScore: atsResult.score || 95,
        atsResult: atsResult
      };

      const existing = seeker.resumes || [];
      const updatedResumes = [newResume, ...existing];

      updateJobSeekerProfile(seeker.id, {
        resumes: updatedResumes,
        activeResumeId: genId,
        professionalSummary: customSummary,
        primaryDegree: customTitle || seeker.primaryDegree
      });

      showToast({
        title: 'Resume Generated Successfully',
        message: `"${generatedFileName}" was generated with an ATS score of ${newResume.atsScore}% and set as your active system resume.`,
        type: 'status'
      });

      setTimeout(() => {
        setIsSavingResume(false);
        onClose();
      }, 500);
    } catch (e) {
      console.error('Error generating resume:', e);
      setIsSavingResume(false);
    }
  };

  const handleDownloadPdf = async () => {
    const resumeEl = document.getElementById('builder-printable-resume');
    if (!resumeEl) {
      window.print();
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const templateTitle = template.charAt(0).toUpperCase() + template.slice(1);
      const safeFirstName = seeker.firstName || 'Candidate';
      const safeLastName = seeker.lastName || 'Resume';
      const fileName = `${safeFirstName}_${safeLastName}_Resume_${templateTitle}.pdf`;

      // Render high-resolution canvas
      const canvas = await html2canvas(resumeEl, {
        scale: 2, // 2x retina crispness for PDF rendering
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Standard A4: 210 x 297 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);

      if (showToast) {
        showToast('Resume PDF downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('PDF generation error, falling back to window.print():', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textContent = `
${seeker.firstName} ${seeker.lastName}
${customTitle} • ${seeker.municipality}, Oriental Mindoro
Email: ${seeker.email} | Phone: ${seeker.contactNumber}

PROFESSIONAL SUMMARY
${customSummary}

WORK EXPERIENCE
${(seeker.workExperience || []).map(exp => `
- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate})
  ${exp.responsibilities}
`).join('')}

EDUCATION
${(seeker.education || []).map(edu => `
- ${edu.degreeCourse}
  ${edu.school} (${edu.yearGraduated}) - ${edu.educationalAttainment} ${edu.honors ? `[${edu.honors}]` : ''}
`).join('')}

SKILLS & COMPETENCIES
Technical Skills: ${(seeker.technicalSkills || []).join(', ')}
Soft Skills: ${seeker.softSkills?.join(', ') || 'Teamwork, Problem Solving'}

CERTIFICATIONS & ELIGIBILITY
${(seeker.certifications || []).map(c => `- ${c.name} (${c.issuingOrganization}, ${c.dateObtained})`).join('\n')}

REFERENCES
Available upon request from PESO Oriental Mindoro.
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color Mapping
  const colorMap = {
    emerald: {
      primary: 'text-emerald-700',
      bg: 'bg-emerald-600',
      border: 'border-emerald-600',
      lightBg: 'bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
    indigo: {
      primary: 'text-indigo-700',
      bg: 'bg-indigo-600',
      border: 'border-indigo-600',
      lightBg: 'bg-indigo-50',
      badgeBg: 'bg-indigo-100 text-indigo-800',
    },
    slate: {
      primary: 'text-slate-900',
      bg: 'bg-slate-900',
      border: 'border-slate-800',
      lightBg: 'bg-slate-100',
      badgeBg: 'bg-slate-200 text-slate-800',
    },
    crimson: {
      primary: 'text-rose-700',
      bg: 'bg-rose-600',
      border: 'border-rose-600',
      lightBg: 'bg-rose-50',
      badgeBg: 'bg-rose-100 text-rose-800',
    },
    teal: {
      primary: 'text-teal-700',
      bg: 'bg-teal-600',
      border: 'border-teal-600',
      lightBg: 'bg-teal-50',
      badgeBg: 'bg-teal-100 text-teal-800',
    },
  };

  const currentTheme = colorMap[colorScheme];

  // Full Name formatting with Middle Initial
  const middleInitial = seeker.middleName 
    ? `${seeker.middleName.trim()[0].toUpperCase()}.` 
    : ((seeker as any).middleInitial ? `${(seeker as any).middleInitial.trim()[0].toUpperCase()}.` : '');
  const candidateFullName = middleInitial 
    ? `${seeker.firstName} ${middleInitial} ${seeker.lastName}` 
    : `${seeker.firstName} ${seeker.lastName}`;

  // 1. MODERN TECH TEMPLATE
  const renderModernTemplate = () => (
    <div className="space-y-6">
      {/* Top Accent Gradient Bar */}
      <div className={`h-2.5 rounded-full ${currentTheme.bg} w-full opacity-90`} />

      {/* Top Resume Header */}
      <div className={`pb-5 border-b-2 ${currentTheme.border} flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6`}>
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {candidateFullName}
            </h1>
            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${currentTheme.badgeBg} ${currentTheme.border}`}>
              PESO Oriental Mindoro Registered
            </span>
          </div>

          <p className={`text-sm font-bold tracking-wide ${currentTheme.primary}`}>
            {customTitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{seeker.municipality || 'Roxas'}, Oriental Mindoro</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{seeker.email}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{seeker.contactNumber || seeker.phone || '0917-123-4567'}</span>
            </span>
          </div>
        </div>

        {showPhoto && (
          <div className="relative shrink-0">
            <img
              src={seeker.profilePicture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={seeker.firstName}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-slate-200 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Verified Active" />
          </div>
        )}
      </div>

      {/* Summary Section */}
      {showSummary && (
        <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-slate-300 space-y-1.5">
          <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5`}>
            <FileText className="w-3.5 h-3.5" />
            <span>Professional Profile Summary</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            {customSummary}
          </p>
        </div>
      )}

      {/* Modern Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Work Experience (Main) */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-3">
            <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-200 pb-1.5`}>
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Experience & Roles</span>
            </h3>

            {seeker.workExperience && seeker.workExperience.length > 0 ? (
              <div className="space-y-3.5 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {seeker.workExperience.map((exp) => (
                  <div key={exp.id} className="relative pl-6 text-xs space-y-1">
                    <span className={`absolute left-1 top-1 w-2.5 h-2.5 rounded-full ${currentTheme.bg} ring-4 ring-white`} />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0.5 font-bold text-slate-900">
                      <span>{exp.position}</span>
                      <span className="text-[10px] text-slate-500 font-medium shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600">{exp.company}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {exp.responsibilities}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Registered for immediate local and regional job placement.</p>
            )}
          </div>
        </div>

        {/* Right Column: Skills & Education */}
        <div className="md:col-span-5 space-y-5">
          {/* Skills & Stack */}
          <div className="space-y-2.5">
            <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-200 pb-1.5`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Competencies</span>
            </h3>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Technical:</span>
              <div className="flex flex-wrap gap-1">
                {(seeker.technicalSkills || []).map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Professional:</span>
              <div className="flex flex-wrap gap-1">
                {(seeker.softSkills || ['Communication', 'Teamwork', 'Critical Thinking']).map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="space-y-2.5">
            <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-200 pb-1.5`}>
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education</span>
            </h3>

            {seeker.education && seeker.education.length > 0 ? (
              seeker.education.map((edu) => (
                <div key={edu.id} className="text-xs space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <p className="font-bold text-slate-900 leading-snug">{edu.degreeCourse}</p>
                  <p className="text-[11px] text-slate-600">{edu.school}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Graduated: {edu.yearGraduated}</span>
                    {edu.honors && <span className="font-bold text-emerald-700">{edu.honors}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                <p className="font-bold">{seeker.primaryDegree}</p>
                <p className="text-[11px] text-slate-500">{seeker.educationalAttainment}</p>
              </div>
            )}
          </div>

          {/* Certifications */}
          {showCertifications && seeker.certifications && seeker.certifications.length > 0 && (
            <div className="space-y-2">
              <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-200 pb-1.5`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Certifications</span>
              </h3>
              <div className="space-y-1.5 text-xs">
                {seeker.certifications.map((c) => (
                  <div key={c.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                    <p className="font-semibold text-slate-900 text-[11px]">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.issuingOrganization} • {c.dateObtained}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer References */}
      {showReferences && (
        <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-500">
          <p className="font-bold text-slate-700">Official Candidate Profile — Public Employment Service Office (PESO)</p>
          <p>Province of Oriental Mindoro • Document verified through the eHANAP matching database</p>
        </div>
      )}
    </div>
  );

  // 2. EXECUTIVE TEMPLATE
  const renderExecutiveTemplate = () => (
    <div className="space-y-0">
      {/* High-Impact Executive Header Block */}
      <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-t-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b-4 border-amber-500">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Executive Curriculum Vitae
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
              CONFIDENTIAL
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
            {candidateFullName}
          </h1>

          <p className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
            {customTitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{seeker.municipality || 'Calapan City'}, Oriental Mindoro</span>
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>{seeker.email}</span>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{seeker.contactNumber || seeker.phone || '0917-555-0192'}</span>
            </span>
          </div>
        </div>

        {showPhoto && (
          <div className="shrink-0 p-1 rounded-2xl bg-gradient-to-tr from-amber-500 to-slate-700 shadow-lg">
            <img
              src={seeker.profilePicture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={seeker.firstName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
            />
          </div>
        )}
      </div>

      {/* Executive Body Layout */}
      <div className="p-6 sm:p-8 space-y-6 bg-white rounded-b-2xl">
        {/* Executive Summary */}
        {showSummary && (
          <div className="space-y-1.5 pb-5 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-xs" />
              <span>Executive Brief & Leadership Profile</span>
            </h3>
            <p className="text-xs font-serif text-slate-700 leading-relaxed text-justify italic">
              "{customSummary}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-7">
          {/* Left Column: Core Competencies & Credentials */}
          <div className="md:col-span-4 space-y-6 border-r border-slate-100 pr-4">
            {/* Strategic Competencies */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">
                Core Competencies
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {(seeker.technicalSkills || ['Strategic Planning', 'Operations Governance', 'Risk Management']).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
                {(seeker.softSkills || ['Executive Leadership', 'Stakeholder Management']).map((s, idx) => (
                  <li key={`soft-${idx}`} className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Academic Credentials */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">
                Education & Credentials
              </h4>
              {(seeker.education && seeker.education.length > 0) ? (
                seeker.education.map((edu) => (
                  <div key={edu.id} className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">{edu.degreeCourse}</p>
                    <p className="text-[11px] text-slate-600 font-serif">{edu.school}</p>
                    <p className="text-[10px] text-slate-400">Class of {edu.yearGraduated}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-700">
                  <p className="font-bold">{seeker.primaryDegree}</p>
                  <p className="text-[11px] text-slate-500">{seeker.educationalAttainment}</p>
                </div>
              )}
            </div>

            {/* Accreditations */}
            {showCertifications && seeker.certifications && seeker.certifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">
                  Accreditations
                </h4>
                <div className="space-y-1.5 text-xs">
                  {seeker.certifications.map((c) => (
                    <div key={c.id} className="text-[11px] text-slate-700">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.issuingOrganization}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Leadership & Employment History */}
          <div className="md:col-span-8 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">
              Executive Appointments & Career Trajectory
            </h4>

            {seeker.workExperience && seeker.workExperience.length > 0 ? (
              <div className="space-y-4">
                {seeker.workExperience.map((exp) => (
                  <div key={exp.id} className="space-y-1 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between font-serif font-bold text-slate-900 text-sm">
                      <span>{exp.position}</span>
                      <span className="text-xs text-slate-500 font-sans font-normal">
                        {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-amber-700 tracking-wide uppercase">
                      {exp.company}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                      {exp.responsibilities}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Senior candidate credentials verified for regional administrative and executive appointment.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        {showReferences && (
          <div className="pt-5 border-t border-slate-200 text-center space-y-0.5 text-[10px] text-slate-400">
            <p className="font-bold text-slate-700 uppercase tracking-widest">
              PUBLIC EMPLOYMENT SERVICE OFFICE (PESO) EXECUTIVE REGISTRY
            </p>
            <p>Provincial Capitol Complex, Oriental Mindoro • DOLE PhilJobNet Verified Profile</p>
          </div>
        )}
      </div>
    </div>
  );

  // 3. CLASSIC PESO TEMPLATE
  const renderClassicTemplate = () => (
    <div className="font-serif text-slate-900 space-y-4 p-2 sm:p-4 text-xs">
      {/* Official Government PESO Header */}
      <div className="text-center space-y-0.5 pb-2">
        <p className="text-[10px] tracking-widest uppercase font-sans text-slate-600">
          Republic of the Philippines
        </p>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Province of Oriental Mindoro
        </p>
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
          PUBLIC EMPLOYMENT SERVICE OFFICE (PESO)
        </p>
        <div className="py-1">
          <span className="inline-block border-y-2 border-slate-900 px-6 py-0.5 font-sans font-black text-sm uppercase tracking-wider">
            PESO PERSONAL DATA SHEET & BIO-DATA
          </span>
        </div>
        <p className="text-[9px] font-sans text-slate-500">
          Registration Control No: OM-PESO-{seeker.id ? seeker.id.slice(0, 8).toUpperCase() : '2026-REG'}
        </p>
      </div>

      {/* Personal Information Grid with 2x2 Photo Box */}
      <div className="border border-slate-900 p-3 space-y-3">
        <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4">
          {/* Details Table */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Full Name:</span>
              <span className="font-bold uppercase">{seeker.lastName}, {seeker.firstName} {seeker.middleName || ''}</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Position Applied For:</span>
              <span className="font-bold">{customTitle}</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Civil Status:</span>
              <span>{seeker.civilStatus || 'Single'}</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Residential Address:</span>
              <span>{seeker.barangay ? `${seeker.barangay}, ` : ''}{seeker.municipality || 'Roxas'}, Oriental Mindoro</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Contact Number:</span>
              <span>{seeker.contactNumber || seeker.phone || '0917-123-4567'}</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Email Address:</span>
              <span>{seeker.email}</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">Highest Attainment:</span>
              <span className="font-bold">{seeker.educationalAttainment || "College Graduate"}</span>
            </div>
            <div>
              <span className="font-sans text-[9px] font-bold uppercase text-slate-500 block">DOLE Registry Status:</span>
              <span className="text-emerald-800 font-bold">Active & Verified</span>
            </div>
          </div>

          {/* 2x2 Photo Box */}
          <div className="shrink-0 flex flex-col items-center">
            {showPhoto && seeker.profilePicture ? (
              <img
                src={seeker.profilePicture}
                alt={seeker.firstName}
                className="w-24 h-24 border-2 border-slate-900 object-cover"
              />
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center p-1 text-center bg-slate-50">
                <span className="text-[9px] font-sans font-bold uppercase text-slate-500">2x2 ID Photo</span>
                <span className="text-[8px] font-sans text-slate-400">Attach here</span>
              </div>
            )}
            <span className="text-[8px] font-sans text-slate-500 uppercase mt-1">Official ID Specimen</span>
          </div>
        </div>
      </div>

      {/* I. Career Objective */}
      {showSummary && (
        <div className="space-y-1">
          <div className="bg-slate-100 border border-slate-900 px-2 py-0.5 font-sans font-bold text-[10px] uppercase tracking-wider">
            I. STATEMENT OF OBJECTIVE & PROFESSIONAL QUALIFICATIONS
          </div>
          <p className="text-[11px] text-justify leading-relaxed px-1">
            {customSummary}
          </p>
        </div>
      )}

      {/* II. Educational Background Table */}
      <div className="space-y-1">
        <div className="bg-slate-100 border border-slate-900 px-2 py-0.5 font-sans font-bold text-[10px] uppercase tracking-wider">
          II. EDUCATIONAL BACKGROUND
        </div>
        <table className="w-full border-collapse border border-slate-900 text-[10px]">
          <thead>
            <tr className="bg-slate-50 font-sans font-bold">
              <th className="border border-slate-900 p-1 text-left">Level</th>
              <th className="border border-slate-900 p-1 text-left">Name of School / Institution</th>
              <th className="border border-slate-900 p-1 text-left">Degree / Course Earned</th>
              <th className="border border-slate-900 p-1 text-center w-20">Year Graduated</th>
            </tr>
          </thead>
          <tbody>
            {(seeker.education && seeker.education.length > 0) ? (
              seeker.education.map((edu, idx) => (
                <tr key={edu.id || idx}>
                  <td className="border border-slate-900 p-1 font-semibold">{idx === 0 ? 'Tertiary' : 'Vocational'}</td>
                  <td className="border border-slate-900 p-1">{edu.school}</td>
                  <td className="border border-slate-900 p-1 font-bold">{edu.degreeCourse} {edu.honors ? `(${edu.honors})` : ''}</td>
                  <td className="border border-slate-900 p-1 text-center">{edu.yearGraduated}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-slate-900 p-1 font-semibold">College</td>
                <td className="border border-slate-900 p-1">Provincial University / College</td>
                <td className="border border-slate-900 p-1 font-bold">{seeker.primaryDegree}</td>
                <td className="border border-slate-900 p-1 text-center">Completed</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* III. Work Experience Table */}
      <div className="space-y-1">
        <div className="bg-slate-100 border border-slate-900 px-2 py-0.5 font-sans font-bold text-[10px] uppercase tracking-wider">
          III. RECORD OF EMPLOYMENT & WORK EXPERIENCE
        </div>
        <table className="w-full border-collapse border border-slate-900 text-[10px]">
          <thead>
            <tr className="bg-slate-50 font-sans font-bold">
              <th className="border border-slate-900 p-1 text-left w-28">Inclusive Dates</th>
              <th className="border border-slate-900 p-1 text-left">Position Title</th>
              <th className="border border-slate-900 p-1 text-left">Department / Agency / Office</th>
              <th className="border border-slate-900 p-1 text-left">Status of Appointment</th>
            </tr>
          </thead>
          <tbody>
            {(seeker.workExperience && seeker.workExperience.length > 0) ? (
              seeker.workExperience.map((exp, idx) => (
                <tr key={exp.id || idx}>
                  <td className="border border-slate-900 p-1 font-sans">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</td>
                  <td className="border border-slate-900 p-1 font-bold">{exp.position}</td>
                  <td className="border border-slate-900 p-1">{exp.company}</td>
                  <td className="border border-slate-900 p-1 font-sans">{exp.isCurrent ? 'Active Employee' : 'Permanent / Regular'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-slate-900 p-1 text-center font-sans italic" colSpan={4}>
                  No prior formal employment history recorded. Candidate registered for PESO job matching.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* IV. Skills & Certifications */}
      <div className="space-y-1">
        <div className="bg-slate-100 border border-slate-900 px-2 py-0.5 font-sans font-bold text-[10px] uppercase tracking-wider">
          IV. TECHNICAL SKILLS, SPECIALIZATIONS & LICENSURES
        </div>
        <div className="border border-slate-900 p-2 text-[10px] space-y-1">
          <p>
            <strong className="font-sans">Technical Competencies:</strong> {(seeker.technicalSkills || []).join(', ') || 'Computer Literacy, Data Management, Office Applications'}
          </p>
          <p>
            <strong className="font-sans">Soft Skills:</strong> {(seeker.softSkills || ['Communication', 'Teamwork', 'Work Ethics']).join(', ')}
          </p>
          {showCertifications && seeker.certifications && seeker.certifications.length > 0 && (
            <p>
              <strong className="font-sans">Certificates & Licenses:</strong> {seeker.certifications.map(c => `${c.name} (${c.issuingOrganization}, ${c.dateObtained})`).join('; ')}
            </p>
          )}
        </div>
      </div>

      {/* V. Oath & Certification */}
      {showReferences && (
        <div className="pt-2 space-y-4">
          <p className="text-[9px] text-justify font-sans leading-tight text-slate-700">
            I hereby certify that all information contained in this PESO Bio-Data sheet is true, correct, and complete to the best of my personal knowledge and belief. I authorize the Public Employment Service Office (PESO) Oriental Mindoro to disclose relevant employment data to prospective licensed employers.
          </p>
          <div className="flex items-end justify-between pt-4">
            <div className="text-[9px] font-sans">
              <p>Date Accomplished: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>Place: Provincial Capitol Complex, Oriental Mindoro</p>
            </div>
            <div className="text-center font-sans">
              <div className="w-48 border-b border-slate-900 mb-1" />
              <p className="text-[9px] font-bold uppercase">{candidateFullName}</p>
              <p className="text-[8px] text-slate-500">Applicant Signature over Printed Name</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 4. CREATIVE BENTO TEMPLATE
  const renderCreativeTemplate = () => (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Bento Box 1: Hero Identity Card (Spans 2 cols) */}
        <div className={`md:col-span-2 ${currentTheme.lightBg} border-2 ${currentTheme.border} p-5 rounded-2xl flex flex-col justify-between shadow-2xs`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${currentTheme.badgeBg}`}>
                eHANAP Creative Bento
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">• Mindoro Talent</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {candidateFullName}
            </h1>

            <p className={`text-sm font-extrabold ${currentTheme.primary}`}>
              {customTitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{seeker.municipality || 'Roxas'}, Oriental Mindoro</span>
            </span>
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs border border-slate-200">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{seeker.email}</span>
            </span>
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs border border-slate-200">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{seeker.contactNumber || seeker.phone || '0917-123-4567'}</span>
            </span>
          </div>
        </div>

        {/* Bento Box 2: Photo & Availability Box (Spans 1 col) */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs relative">
          {showPhoto ? (
            <img
              src={seeker.profilePicture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={seeker.firstName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-200 mb-2"
            />
          ) : (
            <div className={`w-16 h-16 rounded-2xl ${currentTheme.lightBg} ${currentTheme.primary} flex items-center justify-center mb-2 font-black text-xl`}>
              {seeker.firstName?.charAt(0)}{seeker.lastName?.charAt(0)}
            </div>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Available for Hire</span>
          </span>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Verified by PESO Mindoro</span>
        </div>

        {/* Bento Box 3: Professional Narrative (Spans 3 cols) */}
        {showSummary && (
          <div className="md:col-span-3 bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-2xs">
            <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creative Statement & Vision</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              {customSummary}
            </p>
          </div>
        )}

        {/* Bento Box 4: Experience Timeline (Spans 2 cols) */}
        <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-2xs">
          <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-100 pb-2`}>
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employment Journey & Roles</span>
          </h3>

          {seeker.workExperience && seeker.workExperience.length > 0 ? (
            <div className="space-y-3">
              {seeker.workExperience.map((exp) => (
                <div key={exp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{exp.position}</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">{exp.company}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                    {exp.responsibilities}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Fresh graduate candidate ready for immediate placement.</p>
          )}
        </div>

        {/* Bento Box 5: Skills Stack (Spans 1 col) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5`}>
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Skill Bento</span>
            </h3>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase block">Tech Toolkit:</span>
              <div className="flex flex-wrap gap-1">
                {(seeker.technicalSkills || []).map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                    {s}
                  </span>
                ))}
              </div>

              <span className="text-[10px] font-black text-slate-500 uppercase block pt-1">Soft Strengths:</span>
              <div className="flex flex-wrap gap-1">
                {(seeker.softSkills || ['Leadership', 'Adaptability']).map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-lg border border-purple-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-900 block">ATS Friendly</span>
            <span className="text-[9px] text-slate-400">Optimized for job matching</span>
          </div>
        </div>

        {/* Bento Box 6: Education Card (Spans 1 col) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-2xs">
          <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-100 pb-2`}>
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Alma Mater</span>
          </h3>

          {(seeker.education && seeker.education.length > 0) ? (
            seeker.education.map((edu) => (
              <div key={edu.id} className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900 leading-snug">{edu.degreeCourse}</p>
                <p className="text-[11px] text-slate-600">{edu.school}</p>
                <p className="text-[10px] text-slate-400">{edu.yearGraduated}</p>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-700">
              <p className="font-bold">{seeker.primaryDegree}</p>
              <p className="text-[11px] text-slate-500">{seeker.educationalAttainment}</p>
            </div>
          )}
        </div>

        {/* Bento Box 7: Certifications & Verification (Spans 2 cols) */}
        <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl space-y-2.5 shadow-2xs">
          <h3 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary} flex items-center gap-1.5 border-b border-slate-100 pb-2`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Certifications & PESO Registry Seal</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {showCertifications && seeker.certifications && seeker.certifications.length > 0 ? (
              seeker.certifications.map((c) => (
                <div key={c.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                  <p className="font-bold text-slate-900 text-[11px] truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{c.issuingOrganization} ({c.dateObtained})</p>
                </div>
              ))
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-500 text-[11px]">
                PRC / TESDA verified through official Oriental Mindoro portal.
              </div>
            )}

            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200/80 text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-[11px]">PESO Verified Seal</p>
                <p className="text-[9px] text-emerald-700">Official candidate bio-data verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {showReferences && (
        <div className="pt-2 text-center text-[10px] text-slate-400">
          <p className="font-bold text-slate-600">PESO Oriental Mindoro • Creative Bento CV</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #builder-printable-resume, #builder-printable-resume * {
            visibility: visible !important;
          }
          #builder-printable-resume {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">Interactive Dynamic Resume Builder</h3>
                <span className="text-[10px] bg-emerald-900 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Live PDF Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">{candidateFullName} • Customize templates, styles & export</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSaveGeneratedResume}
              disabled={isSavingResume}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSavingResume ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Save as Active Resume</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Download PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Builder Main Body (Controls Left + Live A4 Canvas Right) */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-100">
          
          {/* Controls & Configuration Sidebar */}
          <div className="no-print lg:col-span-4 bg-white p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto space-y-6 lg:max-h-[calc(94vh-80px)]">
            
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span>Resume Template Style</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'modern', label: 'Modern Tech', subtitle: 'Tech & Digital', icon: Laptop },
                  { id: 'executive', label: 'Executive', subtitle: 'C-Suite & Board', icon: Briefcase },
                  { id: 'classic', label: 'Classic PESO', subtitle: 'Civil Service PDS', icon: Landmark },
                  { id: 'creative', label: 'Creative Bento', subtitle: 'Bento Grid Cards', icon: LayoutGrid },
                ].map(t => {
                  const Icon = t.icon;
                  const isSelected = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id as TemplateType)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 w-full">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-white/25 text-white rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {t.label}
                        </p>
                        <p className={`text-[10px] leading-tight mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {t.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Accent Color Palette</span>
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'emerald', bg: 'bg-emerald-600', name: 'Emerald' },
                  { id: 'indigo', bg: 'bg-indigo-600', name: 'Indigo' },
                  { id: 'slate', bg: 'bg-slate-900', name: 'Slate' },
                  { id: 'crimson', bg: 'bg-rose-600', name: 'Crimson' },
                  { id: 'teal', bg: 'bg-teal-600', name: 'Teal' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setColorScheme(c.id as ColorScheme)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                      colorScheme === c.id ? 'ring-4 ring-slate-300 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {colorScheme === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Include / Exclude Sections
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <span className="font-semibold text-slate-700">Profile Photo</span>
                  <input
                    type="checkbox"
                    checked={showPhoto}
                    onChange={e => setShowPhoto(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <span className="font-semibold text-slate-700">Professional Summary</span>
                  <input
                    type="checkbox"
                    checked={showSummary}
                    onChange={e => setShowSummary(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <span className="font-semibold text-slate-700">Certifications & Civil Service</span>
                  <input
                    type="checkbox"
                    checked={showCertifications}
                    onChange={e => setShowCertifications(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                  <span className="font-semibold text-slate-700">PESO Verified Endorsement</span>
                  <input
                    type="checkbox"
                    checked={showReferences}
                    onChange={e => setShowReferences(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </label>
              </div>
            </div>

            {/* Quick Text Overrides */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Custom Headline & Objective
              </label>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Headline / Target Role</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tailored Bio</label>
                <textarea
                  rows={3}
                  value={customSummary}
                  onChange={e => setCustomSummary(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

          </div>

          {/* Live A4 Sheet Preview Canvas */}
          <div className="lg:col-span-8 p-3 sm:p-6 lg:p-8 overflow-y-auto lg:max-h-[calc(94vh-80px)] flex justify-center">
            
            <div
              id="builder-printable-resume"
              className={`w-full max-w-[760px] min-h-[980px] shadow-xl border border-slate-200 text-slate-800 relative overflow-x-hidden transition-all ${
                template === 'classic'
                  ? 'bg-white p-5 sm:p-8 font-serif'
                  : template === 'executive'
                  ? 'bg-white p-0 rounded-2xl overflow-hidden'
                  : template === 'creative'
                  ? 'bg-slate-100/90 p-4 sm:p-6 rounded-3xl'
                  : 'bg-white p-4 sm:p-8 md:p-10 rounded-2xl space-y-6'
              }`}
            >
              {template === 'modern' && renderModernTemplate()}
              {template === 'executive' && renderExecutiveTemplate()}
              {template === 'classic' && renderClassicTemplate()}
              {template === 'creative' && renderCreativeTemplate()}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
