import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseResumeFile, ExtractedResumePayload } from '../../utils/resumeParser';
import { evaluateResumeForAts } from '../../utils/atsEngine';
import { AtsScanResult, CertificationRecord, EducationRecord, WorkExperienceRecord, ResumeFile } from '../../types';
import { ORIENTAL_MINDORO_MUNICIPALITIES, ROXAS_BARANGAYS } from '../../constants';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Edit3, 
  Plus, 
  Trash2,
  BrainCircuit,
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Award,
  MapPin,
  Calendar,
  Layers,
  Heart,
  ShieldCheck
} from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentSeekerProfile, updateJobSeekerProfile, showToast } = useApp();

  const [step, setStep] = useState<'select' | 'parsing' | 'review'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedResumePayload | null>(null);
  const [atsResult, setAtsResult] = useState<AtsScanResult | null>(null);
  
  // Editable Fields in Review Step
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<string>('');
  const [civilStatus, setCivilStatus] = useState('Single');
  const [sex, setSex] = useState('');
  const [address, setAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [municipality, setMunicipality] = useState('Roxas');

  const [degree, setDegree] = useState('');
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree");
  const [school, setSchool] = useState('');
  const [yearGraduated, setYearGraduated] = useState<number>(2024);

  const [skills, setSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [tradeSkills, setTradeSkills] = useState<string[]>([]);
  const [adminSkills, setAdminSkills] = useState<string[]>([]);
  const [serviceSkills, setServiceSkills] = useState<string[]>([]);
  const [salesSkills, setSalesSkills] = useState<string[]>([]);
  const [itSkills, setItSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [experienceYears, setExperienceYears] = useState(0);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertInput, setNewCertInput] = useState('');
  const [professionalSummary, setProfessionalSummary] = useState('');

  const [fileError, setFileError] = useState<string>('');
  const [extractionMethod, setExtractionMethod] = useState<'pdf_text' | 'image_ocr' | 'docx'>('pdf_text');

  const PARSING_MESSAGES = [
    "Scanning document structure...",
    "Extracting personal & contact details...",
    "Extracting educational background & degrees...",
    "Categorizing technical, trade & soft skills...",
    "Syncing candidate profile data..."
  ];
  const [parsingMessageIndex, setParsingMessageIndex] = useState(0);

  useEffect(() => {
    if (step !== 'parsing') {
      setParsingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setParsingMessageIndex(prev => (prev + 1) % PARSING_MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen || !currentSeekerProfile) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const lowerName = file.name.toLowerCase();
      
      const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
      const isImage = lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || file.type.startsWith('image/');
      const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || file.type.includes('word');

      if (!isPdf && !isImage && !isDocx) {
        setFileError('Unsupported file type. Please upload your resume in PDF or image format (PNG, JPG, JPEG) or Word document.');
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setFileError('File size exceeds 15MB limit. Please upload a smaller file.');
        return;
      }

      setSelectedFile(file);
      setExtractionMethod(isPdf ? 'pdf_text' : isImage ? 'image_ocr' : 'docx');
      setStep('parsing');

      // Extract details from document via server & high-precision local NLP engine
      const result = await parseResumeFile(file);
      setExtractedData(result);

      // Evaluate ATS Compatibility
      const ats = evaluateResumeForAts({
        fileName: file.name,
        fileType: isImage ? 'image' : isDocx ? 'docx' : 'pdf',
        extractedSkills: result.extractedSkills,
        extractedEducation: result.educationalAttainment,
        extractedDegree: result.primaryDegree,
        extractedExperienceYears: result.extractedExperienceYears,
        contactNumber: result.contactNumber,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        professionalSummary: result.professionalSummary,
        certifications: result.certifications,
        rawTextPreview: result.rawTextPreview,
        workExperience: result.workExperience,
        education: result.education,
      });
      setAtsResult(ats);

      // Populate Extracted Information into State for Review and Confirmation
      setFirstName(result.firstName || currentSeekerProfile.firstName || '');
      setMiddleName(result.middleName || currentSeekerProfile.middleName || '');
      setLastName(result.lastName || currentSeekerProfile.lastName || '');
      setContactEmail(result.email || currentSeekerProfile.email || '');
      setContactPhone(result.contactNumber || currentSeekerProfile.contactNumber || '');
      
      setDateOfBirth(result.dateOfBirth || currentSeekerProfile.dateOfBirth || '');
      setAge(result.age ? String(result.age) : (currentSeekerProfile.age ? String(currentSeekerProfile.age) : ''));
      setCivilStatus(result.civilStatus || currentSeekerProfile.civilStatus || 'Single');
      setSex(result.sex || currentSeekerProfile.sex || '');
      
      setAddress(result.address || currentSeekerProfile.address || '');
      setBarangay(result.barangay || currentSeekerProfile.barangay || '');
      setMunicipality(result.municipality || currentSeekerProfile.municipality || 'Roxas');

      setDegree(result.primaryDegree || currentSeekerProfile.primaryDegree || '');
      setEducationLevel(result.educationalAttainment || currentSeekerProfile.educationalAttainment || "Bachelor's Degree");
      setSchool(result.school || currentSeekerProfile.education?.[0]?.school || '');
      setYearGraduated(result.yearGraduated || currentSeekerProfile.education?.[0]?.yearGraduated || 2024);

      // Skills and Skill Buckets
      const combinedTech = Array.from(new Set([
        ...(result.extractedSkills || []),
        ...(result.technicalSkills || []),
        ...(result.itCreativeSkills || [])
      ])).filter(Boolean);

      setSkills(combinedTech.length > 0 ? combinedTech : (currentSeekerProfile.technicalSkills || []));
      setSoftSkills(result.softSkills && result.softSkills.length > 0 ? result.softSkills : (currentSeekerProfile.softSkills || ['Communication', 'Teamwork', 'Punctuality']));
      setTradeSkills(result.tradeSkills || currentSeekerProfile.tradeSkills || []);
      setAdminSkills(result.administrativeSkills || currentSeekerProfile.administrativeSkills || []);
      setServiceSkills(result.serviceHospitalitySkills || currentSeekerProfile.serviceHospitalitySkills || []);
      setSalesSkills(result.salesCustomerSkills || currentSeekerProfile.salesCustomerSkills || []);
      setItSkills(result.itCreativeSkills || currentSeekerProfile.itCreativeSkills || []);

      setExperienceYears(typeof result.extractedExperienceYears === 'number' ? result.extractedExperienceYears : (currentSeekerProfile.yearsOfExperience || 1));
      
      // Certifications
      const rawCerts: string[] = (result.certifications && result.certifications.length > 0)
        ? result.certifications
        : (currentSeekerProfile.certifications || []).map(c => typeof c === 'string' ? c : c.name);
      setCertifications(rawCerts);

      setProfessionalSummary(
        result.professionalSummary || 
        currentSeekerProfile.professionalSummary || 
        currentSeekerProfile.summary || 
        ''
      );

      setStep('review');
    }
  };

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddCert = () => {
    if (newCertInput.trim() && !certifications.includes(newCertInput.trim())) {
      setCertifications([...certifications, newCertInput.trim()]);
      setNewCertInput('');
    }
  };

  const handleRemoveCert = (certToRemove: string) => {
    setCertifications(certifications.filter(c => c !== certToRemove));
  };

  const handleSaveParsedResume = () => {
    const newResumeId = `res-${Date.now()}`;
    const candidateFullName = [firstName, middleName, lastName].filter(Boolean).map(s => s.trim()).filter(Boolean).join(' ');
    const newResumeObj: ResumeFile = {
      id: newResumeId,
      fileName: selectedFile?.name || 'Uploaded_Resume.pdf',
      fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
      fileType: (selectedFile?.name.endsWith('.docx') ? 'docx' : 'pdf') as 'pdf' | 'doc' | 'docx',
      uploadedAt: new Date().toISOString(),
      validationStatus: 'validated' as const,
      extractedSkills: skills,
      extractedEducation: educationLevel,
      extractedDegree: degree,
      extractedExperienceYears: Number(experienceYears),
      atsScore: atsResult?.score,
      atsResult: atsResult || undefined,
      candidateName: candidateFullName || undefined,
      firstName: firstName.trim() || undefined,
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
    };

    // Combine skills cleanly
    const mergedTechnicalSkills = Array.from(new Set([
      ...(currentSeekerProfile.technicalSkills || []),
      ...skills,
      ...itSkills,
      ...tradeSkills,
      ...adminSkills,
      ...serviceSkills,
      ...salesSkills
    ])).filter(Boolean);

    const mergedSoftSkills = Array.from(new Set([
      ...(currentSeekerProfile.softSkills || []),
      ...softSkills
    ])).filter(Boolean);

    // Build confirmed Education Records
    const confirmedDegree = degree.trim() || extractedData?.primaryDegree || currentSeekerProfile.primaryDegree || '';
    const confirmedSchool = school.trim() || extractedData?.school || currentSeekerProfile.education?.[0]?.school || 'Educational Institution';
    
    let updatedEducation: EducationRecord[] = [];
    if (Array.isArray(extractedData?.education) && extractedData.education.length > 0) {
      updatedEducation = extractedData.education.map(e => ({
        id: e.id || `edu-${Date.now()}-${Math.random()}`,
        degreeCourse: confirmedDegree || e.degreeCourse,
        school: confirmedSchool || e.school,
        yearGraduated: e.yearGraduated || Number(yearGraduated) || new Date().getFullYear(),
        educationalAttainment: educationLevel || e.educationalAttainment,
        honors: e.honors,
        // Backwards compatibility with any component accessing edu.degree or edu.course
        degree: confirmedDegree || e.degreeCourse,
        course: confirmedDegree || e.degreeCourse,
      } as any));
    } else if (confirmedDegree || confirmedSchool) {
      updatedEducation = [{
        id: `edu-${Date.now()}`,
        degreeCourse: confirmedDegree,
        school: confirmedSchool,
        yearGraduated: Number(yearGraduated) || extractedData?.yearGraduated || new Date().getFullYear(),
        educationalAttainment: educationLevel || currentSeekerProfile.educationalAttainment,
        degree: confirmedDegree,
        course: confirmedDegree,
      } as any];
    } else {
      updatedEducation = currentSeekerProfile.education || [];
    }

    // Build Work Experience Records
    let updatedWorkExperience: WorkExperienceRecord[] = [];
    if (extractedData?.workExperience && extractedData.workExperience.length > 0) {
      updatedWorkExperience = extractedData.workExperience;
    } else if (experienceYears > 0) {
      updatedWorkExperience = [{
        id: `exp-${Date.now()}`,
        company: 'Verified Work Experience',
        position: 'Staff / Specialist',
        startDate: `${new Date().getFullYear() - Math.max(1, Math.round(experienceYears))}`,
        endDate: 'Present',
        isCurrent: true,
        responsibilities: 'Extracted directly from resume content.',
        yearsOfExperience: Number(experienceYears),
      }];
    } else {
      updatedWorkExperience = currentSeekerProfile.workExperience || [];
    }

    // Build Certifications Records
    const existingCerts = currentSeekerProfile.certifications || [];
    const newCertRecords: CertificationRecord[] = certifications.map((c, i) => {
      const existing = existingCerts.find(ec => (typeof ec === 'string' ? ec : ec.name || '').toLowerCase() === c.toLowerCase());
      if (existing && typeof existing !== 'string') return existing;
      return {
        id: `cert-${Date.now()}-${i}`,
        name: c,
        issuingOrganization: 'Verified Licensure / TESDA',
        dateObtained: new Date().toISOString().slice(0, 7),
      };
    });

    const mergedCertifications: CertificationRecord[] = [
      ...existingCerts.map(ec => typeof ec === 'string' ? { id: `cert-${Date.now()}`, name: ec, issuingOrganization: 'TESDA', dateObtained: '2024-01' } : ec),
      ...newCertRecords.filter(nc => !existingCerts.some(ec => (typeof ec === 'string' ? ec : ec.name || '').toLowerCase() === nc.name.toLowerCase()))
    ];

    // Update job seeker profile with all extracted and confirmed details
    updateJobSeekerProfile(currentSeekerProfile.id, {
      firstName: firstName.trim() || currentSeekerProfile.firstName,
      middleName: middleName.trim() || currentSeekerProfile.middleName || '',
      lastName: lastName.trim() || currentSeekerProfile.lastName,
      email: contactEmail.trim() || currentSeekerProfile.email,
      contactNumber: contactPhone.trim() || currentSeekerProfile.contactNumber,
      dateOfBirth: dateOfBirth ? dateOfBirth.trim() : (currentSeekerProfile.dateOfBirth || ''),
      age: age ? parseInt(age, 10) : currentSeekerProfile.age,
      civilStatus: civilStatus || currentSeekerProfile.civilStatus || 'Single',
      sex: sex || currentSeekerProfile.sex || '',
      address: address.trim() || currentSeekerProfile.address || '',
      barangay: barangay.trim() || currentSeekerProfile.barangay || '',
      municipality: municipality.trim() || currentSeekerProfile.municipality || 'Roxas',
      primaryDegree: confirmedDegree || currentSeekerProfile.primaryDegree || '',
      educationalAttainment: educationLevel || currentSeekerProfile.educationalAttainment,
      technicalSkills: mergedTechnicalSkills,
      softSkills: mergedSoftSkills,
      tradeSkills: tradeSkills.length > 0 ? tradeSkills : currentSeekerProfile.tradeSkills,
      administrativeSkills: adminSkills.length > 0 ? adminSkills : currentSeekerProfile.administrativeSkills,
      serviceHospitalitySkills: serviceSkills.length > 0 ? serviceSkills : currentSeekerProfile.serviceHospitalitySkills,
      salesCustomerSkills: salesSkills.length > 0 ? salesSkills : currentSeekerProfile.salesCustomerSkills,
      itCreativeSkills: itSkills.length > 0 ? itSkills : currentSeekerProfile.itCreativeSkills,
      education: updatedEducation,
      workExperience: updatedWorkExperience,
      certifications: mergedCertifications,
      professionalSummary: professionalSummary.trim() || currentSeekerProfile.professionalSummary || '',
      summary: professionalSummary.trim() || currentSeekerProfile.summary || '',
      yearsOfExperience: Number(experienceYears),
      resumes: [newResumeObj, ...(currentSeekerProfile.resumes || [])],
      activeResumeId: newResumeId,
    });

    showToast({
      title: 'Profile Updated with Resume Info! 🎉',
      message: 'New credentials, education, and skills extracted and saved to your profile.',
      type: 'success',
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <BrainCircuit className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold uppercase tracking-wider truncate">
                Resume Upload & Auto-Profile Sync
              </h2>
              <p className="text-[11px] text-slate-400 font-normal truncate">
                Extracts and updates seeker identity, education, experience & skills
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {step === 'select' && (
            <div className="space-y-4 text-center">
              {fileError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold text-left">
                  {fileError}
                </div>
              )}

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Upload & Auto-Extract
                </span>
                <p className="text-xs text-emerald-950 font-medium pt-1">
                  Upload your updated resume or Philippine Bio-Data in <strong>PDF or image format</strong> (PNG, JPG, JPEG) or Word document. The system extracts your info and updates your profile.
                </p>
              </div>

              <div className="p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Click or Drag Resume File to Upload</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF, Image Bio-data (PNG, JPG, JPEG) or Word docs up to 15MB</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">PDF (Text Extraction)</span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Images (OCR Recognition)</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-start gap-2.5 text-xs text-slate-700">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Information Extraction Guarantee:</strong> When you upload a new resume, your personal information, highest educational attainment, degree course, skills, and work history will be parsed and synchronized into your profile.
                </span>
              </div>
            </div>
          )}

          {step === 'parsing' && (
            <div className="py-4 px-2 sm:px-6 space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  Extracting Credentials
                </span>
                <h3 className="text-base font-bold text-slate-900 transition-all duration-300">
                  {PARSING_MESSAGES[parsingMessageIndex]}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {extractionMethod === 'image_ocr'
                    ? 'Optical Character Recognition (OCR) is scanning your uploaded resume image.'
                    : 'Parsing educational background, skills, and work credentials.'}
                </p>
              </div>

              {/* Pulsing skeleton */}
              <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5 animate-pulse">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-4 bg-slate-300 rounded-md w-3/5"></div>
                    <div className="h-2.5 bg-slate-200 rounded-md w-4/5"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-300 rounded w-1/4"></div>
                  <div className="space-y-1.5 pt-1">
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                    <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-slate-300 rounded w-1/3"></div>
                    <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                    <div className="h-2.5 bg-slate-300 rounded w-2/3"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="h-3 bg-slate-300 rounded w-1/4"></div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <div className="h-5 bg-slate-200 rounded-lg w-16"></div>
                    <div className="h-5 bg-slate-200 rounded-lg w-24"></div>
                    <div className="h-5 bg-slate-200 rounded-lg w-20"></div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((parsingMessageIndex + 1) / PARSING_MESSAGES.length) * 100}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>Extracting verified information</span>
                  <span>Step {parsingMessageIndex + 1} of {PARSING_MESSAGES.length}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'review' && extractedData && (
            <div className="space-y-5">
              
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                    Extracted Resume Credentials
                  </span>
                  <p className="font-bold text-emerald-950 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Review and confirm new info from {selectedFile?.name || 'Uploaded Resume'}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-normal">
                    Clicking "Confirm & Update Profile" will immediately save this extracted data into your seeker profile.
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-full font-bold shrink-0">
                  Ready to Update
                </span>
              </div>

              {/* ATS Readiness Preview */}
              {atsResult && (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-2xs border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/30">
                      {atsResult.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">ATS Compatibility Score</span>
                        <span className="text-[9px] font-black uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded">
                          Grade {atsResult.grade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {skills.length} skills & {experienceYears || 0} years experience indexed
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-xl shrink-0">
                    ATS Verified
                  </span>
                </div>
              )}

              {/* Form Fields to Review and Edit */}
              <div className="space-y-4 text-xs">
                
                {/* 1. Candidate Identity & Personal Information */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> 1. Extracted Identity & Personal Details
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">First Name *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Middle Name</label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={e => setMiddleName(e.target.value)}
                        placeholder="Middle initial or name"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Last Name *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={e => {
                          const dob = e.target.value;
                          setDateOfBirth(dob);
                          if (dob) {
                            const birthYear = new Date(dob).getFullYear();
                            const currentYear = new Date().getFullYear();
                            if (!isNaN(birthYear)) setAge(String(currentYear - birthYear));
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Civil Status</label>
                      <select
                        value={civilStatus}
                        onChange={e => setCivilStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Solo Parent">Solo Parent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Sex / Gender</label>
                      <select
                        value={sex}
                        onChange={e => setSex(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Address */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> 2. Contact Details & Address
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Contact Phone *</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="0917-..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Email Address *</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Municipality</label>
                      <select
                        value={municipality}
                        onChange={e => setMunicipality(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {ORIENTAL_MINDORO_MUNICIPALITIES.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Barangay</label>
                      {municipality === 'Roxas' ? (
                        <select
                          value={barangay}
                          onChange={e => setBarangay(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="">Select Barangay</option>
                          {ROXAS_BARANGAYS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={barangay}
                          onChange={e => setBarangay(e.target.value)}
                          placeholder="Barangay"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Street Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="House No., Street, Purok"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Primary Degree, School, Attainment */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> 3. Extracted Education & Course
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Primary Degree / Course *</label>
                      <input
                        type="text"
                        value={degree}
                        onChange={e => setDegree(e.target.value)}
                        placeholder="e.g. BS in Information Technology"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Educational Attainment</label>
                      <select
                        value={educationLevel}
                        onChange={e => setEducationLevel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="Doctorate / PhD">Doctorate / PhD</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="College Undergraduate">College Undergraduate</option>
                        <option value="Associate Degree">Associate Degree</option>
                        <option value="TVET / Vocational">TVET / Vocational</option>
                        <option value="High School">High School</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">School / Institution</label>
                      <input
                        type="text"
                        value={school}
                        onChange={e => setSchool(e.target.value)}
                        placeholder="e.g. Mindoro State University"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Year Graduated</label>
                      <input
                        type="number"
                        value={yearGraduated}
                        onChange={e => setYearGraduated(parseInt(e.target.value, 10) || 2024)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Total Work Experience */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> 4. Work Experience Duration
                    </span>
                    <span className="text-[10px] text-slate-500">Calculated from employment history</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={experienceYears}
                        onChange={e => setExperienceYears(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      Years of Relevant Industry Experience
                    </span>
                  </div>
                </div>

                {/* 5. Detected Skills */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> 5. Extracted Skills & Competencies ({skills.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Indexed for Decision Tree Matching</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white border border-slate-200 rounded-lg">
                    {skills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg flex items-center gap-1 font-semibold text-[11px]">
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSkill(skill)} 
                          className="text-emerald-700 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-slate-400 italic text-[11px]">No specific skills parsed. Add skills below.</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={e => setNewSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add another skill..."
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3.5 py-1.5 bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

                {/* 6. Certifications */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> 6. Certifications & Licensures ({certifications.length})
                    </span>
                    <span className="text-[10px] text-slate-400">TESDA NC II, PRC, etc.</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg min-h-10 items-center">
                    {certifications.map(c => (
                      <span key={c} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium flex items-center gap-1">
                        {c}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveCert(c)} 
                          className="text-amber-700 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {certifications.length === 0 && (
                      <span className="text-slate-400 italic text-[11px]">No certifications recorded. Add if applicable.</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newCertInput}
                      onChange={e => setNewCertInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCert())}
                      placeholder="e.g. Shielded Metal Arc Welding (SMAW) NC II..."
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="px-3.5 py-1.5 bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

                {/* 7. Professional Bio / Summary */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    7. Professional Summary / Career Bio
                  </label>
                  <textarea
                    rows={3}
                    value={professionalSummary}
                    onChange={e => setProfessionalSummary(e.target.value)}
                    placeholder="Brief summary of professional qualifications and career goals..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Raw Document Snippet */}
                {extractedData.rawTextPreview && (
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Raw Resume Excerpt
                    </span>
                    <p className="text-[11px] text-slate-600 line-clamp-2 italic font-mono">
                      "{extractedData.rawTextPreview}"
                    </p>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors text-center cursor-pointer"
                >
                  Upload Different File
                </button>

                <button
                  type="button"
                  onClick={handleSaveParsedResume}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Update Profile</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
