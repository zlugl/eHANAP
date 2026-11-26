import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { markProfileCompletedInStorage } from '../../utils/routeGuards';
import {
  ExtractedResumePayload,
  formatProperName,
  normalizeCivilStatus,
  normalizeSex,
  normalizeEducationalAttainment,
  normalizeBarangay,
  computeAgeFromDob,
} from '../../utils/resumeExtractorCore';
import { parseResumeFile } from '../../utils/resumeParser';
import { JobSeekerProfile } from '../../types';
import {
  Sparkles,
  ArrowRight,
  User,
  PartyPopper,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  distributeExtractedSkills,
  WizardStepResumeUpload,
  WizardStepPersonalEducation,
  WizardStepSkillsInventory,
  WizardStepJobPreferences,
  WizardStepValidation,
  SkillCategoryKey,
} from './wizard';

interface SeekerProfileSetupWizardProps {
  onComplete: (view: string, params?: any) => void;
  onNavigate: (view: string, params?: any) => void;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Upload Resume / Bio-data',
  2: 'Review & Edit Personal Info & Education',
  3: 'Skills Inventory',
  4: 'Job Preferences',
  5: 'Profile Validation & Done',
};

export const SeekerProfileSetupWizard: React.FC<SeekerProfileSetupWizardProps> = ({ onComplete }) => {
  const { currentUser, currentSeekerProfile, updateJobSeekerProfile, addNotification, showToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [extractionSuccess, setExtractionSuccess] = useState<boolean>(false);
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);

<<<<<<< HEAD
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form state initialized from current seeker profile (completely blank until user enters or auto-fills via resume)
  const [profilePicture, setProfilePicture] = useState(currentSeekerProfile?.profilePicture || currentUser?.avatar || '');
  const [photoSkippedForNow, setPhotoSkippedForNow] = useState(false);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'alert',
        title: 'Image File Too Large',
        message: 'Please choose an image file under 5MB.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfilePicture(dataUrl);
      setPhotoSkippedForNow(false);
      showToast({
        type: 'success',
        title: 'Profile Photo Uploaded',
        message: 'Your custom profile picture preview has been updated.'
      });
    };
    reader.readAsDataURL(file);
  };
=======
  // Personal & Contact state
  const [profilePicture, setProfilePicture] = useState(currentSeekerProfile?.profilePicture || currentUser?.avatar || '');
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
  const [firstName, setFirstName] = useState(currentSeekerProfile?.firstName || '');
  const [middleName, setMiddleName] = useState(currentSeekerProfile?.middleName || '');
  const [lastName, setLastName] = useState(currentSeekerProfile?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentSeekerProfile?.dateOfBirth || '');
  const [age, setAge] = useState<string>(currentSeekerProfile?.age ? String(currentSeekerProfile.age) : '');
  const [civilStatus, setCivilStatus] = useState<string>(currentSeekerProfile?.civilStatus || '');
  const [sex, setSex] = useState<string>(currentSeekerProfile?.sex || '');
  const [contactNumber, setContactNumber] = useState(currentSeekerProfile?.contactNumber || '');
  const [email, setEmail] = useState(currentSeekerProfile?.email || '');
  const [address, setAddress] = useState(currentSeekerProfile?.address || '');
  const [barangay, setBarangay] = useState(currentSeekerProfile?.barangay || '');
  const [municipality, setMunicipality] = useState(currentSeekerProfile?.municipality || '');

  // Education state
<<<<<<< HEAD
  const [educationalAttainment, setEducationalAttainment] = useState(currentSeekerProfile?.educationalAttainment || '');
=======
  const [educationalAttainment, setEducationalAttainment] = useState(currentSeekerProfile?.educationalAttainment || 'College Graduate');
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
  const [primaryDegree, setPrimaryDegree] = useState(currentSeekerProfile?.primaryDegree || '');
  const [school, setSchool] = useState(currentSeekerProfile?.education?.[0]?.school || '');
  const [yearGraduated, setYearGraduated] = useState<string>(
    currentSeekerProfile?.education?.[0]?.yearGraduated ? String(currentSeekerProfile.education[0].yearGraduated) : ''
  );

  // Work Experience & Summary state (auto-filled from resume)
  const [professionalSummary, setProfessionalSummary] = useState(currentSeekerProfile?.professionalSummary || '');
  const [workExperience, setWorkExperience] = useState<any[]>(currentSeekerProfile?.workExperience || []);
  const [extractedCertifications, setExtractedCertifications] = useState<any[]>(currentSeekerProfile?.certifications || []);
  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpPosition, setNewExpPosition] = useState('');
  const [newExpYears, setNewExpYears] = useState('1');
  const [newExpResponsibilities, setNewExpResponsibilities] = useState('');

  // 6 Skill categories state
  const [tradeSkills, setTradeSkills] = useState<string[]>(currentSeekerProfile?.tradeSkills || []);
  const [adminSkills, setAdminSkills] = useState<string[]>(currentSeekerProfile?.administrativeSkills || []);
  const [serviceSkills, setServiceSkills] = useState<string[]>(currentSeekerProfile?.serviceHospitalitySkills || []);
  const [salesSkills, setSalesSkills] = useState<string[]>(currentSeekerProfile?.salesCustomerSkills || []);
  const [itSkills, setItSkills] = useState<string[]>(currentSeekerProfile?.itCreativeSkills || currentSeekerProfile?.technicalSkills || []);
  const [softSkills, setSoftSkills] = useState<string[]>(currentSeekerProfile?.softSkills || []);

<<<<<<< HEAD
  // Temporary skill inputs for adding new ones
  const [inputSkillTrade, setInputSkillTrade] = useState('');
  const [inputSkillAdmin, setInputSkillAdmin] = useState('');
  const [inputSkillService, setInputSkillService] = useState('');
  const [inputSkillSales, setInputSkillSales] = useState('');
  const [inputSkillIt, setInputSkillIt] = useState('');
  const [inputSkillSoft, setInputSkillSoft] = useState('');

  // Step 3: Job Preferences state (starts blank until user selects)
=======
  // Step 4: Job Preferences state
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentSeekerProfile?.jobPreferences?.categories || []
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    currentSeekerProfile?.jobPreferences?.locations || []
  );
  const [selectedEmpTypes, setSelectedEmpTypes] = useState<string[]>(
    currentSeekerProfile?.jobPreferences?.employmentTypes || []
  );
  const [selectedSalary, setSelectedSalary] = useState<string>(
    currentSeekerProfile?.jobPreferences?.minSalary || ''
  );

  // Resume File details for active document storage
  const [uploadedResumeObj, setUploadedResumeObj] = useState<any>(null);

  const skillSetters: Record<SkillCategoryKey, React.Dispatch<React.SetStateAction<string[]>>> = {
    trade: setTradeSkills,
    admin: setAdminSkills,
    service: setServiceSkills,
    sales: setSalesSkills,
    it: setItSkills,
    soft: setSoftSkills,
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'alert',
        title: 'Image File Too Large',
        message: 'Please choose an image file under 5MB.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result as string);
      showToast({
        type: 'success',
        title: 'Profile Photo Uploaded! 📸',
        message: 'Photo preview updated.',
      });
    };
    reader.readAsDataURL(file);
  };

  const processUploadedFile = async (file: File) => {
    setIsProcessingFile(true);
    setActiveFileName(file.name);

    try {
      const extractedData: ExtractedResumePayload = await parseResumeFile(file);

      const cleanFirst = formatProperName(extractedData.firstName);
      const cleanMiddle = formatProperName(extractedData.middleName);
      const cleanLast = formatProperName(extractedData.lastName);
      const normalizedCivil = normalizeCivilStatus(extractedData.civilStatus);
      const normalizedSexVal = normalizeSex(extractedData.sex);
      const normalizedBrgy = normalizeBarangay(extractedData.barangay, extractedData.address);
      const normalizedAttainment = normalizeEducationalAttainment(extractedData.educationalAttainment, extractedData.primaryDegree);
      const resolvedAge = (typeof extractedData.age === 'number' && extractedData.age > 0)
        ? String(extractedData.age)
        : computeAgeFromDob(extractedData.dateOfBirth);

      if (cleanFirst) setFirstName(cleanFirst);
      if (cleanMiddle) setMiddleName(cleanMiddle);
      if (cleanLast) setLastName(cleanLast);
      if (extractedData.email) setEmail(extractedData.email);
      if (extractedData.contactNumber) setContactNumber(extractedData.contactNumber);

      setDateOfBirth(extractedData.dateOfBirth ? extractedData.dateOfBirth.trim() : '');
      setAge(resolvedAge || '');
      setCivilStatus(normalizedCivil || 'Single');
      setSex(normalizedSexVal || '');
      if (extractedData.address) {
        setAddress(extractedData.address);
      } else if (normalizedBrgy) {
        setAddress(`Brgy. ${normalizedBrgy}, Roxas, Oriental Mindoro`);
      }
      if (normalizedBrgy) setBarangay(normalizedBrgy);
      if (extractedData.municipality) setMunicipality(extractedData.municipality);

<<<<<<< HEAD
      // 4. Auto-populate Education & Work Experience details
=======
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
      setEducationalAttainment(normalizedAttainment);
      if (extractedData.primaryDegree) setPrimaryDegree(extractedData.primaryDegree);
      if (extractedData.school) setSchool(extractedData.school);
      if (extractedData.yearGraduated) setYearGraduated(String(extractedData.yearGraduated));
      if (extractedData.professionalSummary) setProfessionalSummary(extractedData.professionalSummary);

      if (extractedData.workExperience && Array.isArray(extractedData.workExperience) && extractedData.workExperience.length > 0) {
        setWorkExperience(extractedData.workExperience);
      } else if (typeof extractedData.extractedExperienceYears === 'number' && extractedData.extractedExperienceYears > 0) {
        setWorkExperience([
          {
            id: `exp-${Date.now()}`,
            company: 'Previous Employer (Extracted from Resume)',
            position: extractedData.primaryDegree ? `${extractedData.primaryDegree} Specialist` : 'Experienced Professional',
            startDate: String(new Date().getFullYear() - Math.max(1, Math.round(extractedData.extractedExperienceYears))),
            endDate: 'Present',
            isCurrent: false,
            responsibilities: extractedData.professionalSummary || 'Work experience extracted from uploaded resume.',
            yearsOfExperience: extractedData.extractedExperienceYears,
          },
        ]);
      }

      if (extractedData.certifications && Array.isArray(extractedData.certifications) && extractedData.certifications.length > 0) {
        setExtractedCertifications(
          extractedData.certifications.map((c: any, idx: number) =>
            typeof c === 'string'
              ? { id: `cert-${Date.now()}-${idx}`, name: c, issuingOrganization: 'Verified Certification', dateObtained: new Date().toISOString().split('T')[0] }
              : c
          )
        );
      }

      const skills = distributeExtractedSkills(extractedData);
      setTradeSkills(skills.tradeSkills);
      setAdminSkills(skills.adminSkills);
      setServiceSkills(skills.serviceSkills);
      setSalesSkills(skills.salesSkills);
      setItSkills(skills.itSkills);
      setSoftSkills(skills.softSkills);

      const parsedCandidateName = [extractedData.firstName, extractedData.middleName, extractedData.lastName]
        .filter(Boolean)
        .map(s => (s || '').trim())
        .filter(Boolean)
        .join(' ');

<<<<<<< HEAD
      for (const rawSkill of generalSkills) {
        const s = rawSkill.trim();
        if (!s) continue;
        const lower = s.toLowerCase();

        if (SOFT_SKILLS_LIST.some(soft => lower.includes(soft))) {
          newSoft.add(s);
        } else if (TRADE_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
          newTrade.add(s);
        } else if (ADMIN_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
          newAdmin.add(s);
        } else if (SERVICE_HOSPITALITY_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
          newService.add(s);
        } else if (SALES_COMMERCE_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
          newSales.add(s);
        } else if (IT_CREATIVE_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
          newIt.add(s);
        }
      }

      setTradeSkills(Array.from(newTrade));
      setAdminSkills(Array.from(newAdmin));
      setServiceSkills(Array.from(newService));
      setSalesSkills(Array.from(newSales));
      setItSkills(Array.from(newIt));
      setSoftSkills(Array.from(newSoft));

      const parsedCandidateName = [extractedData.firstName, extractedData.middleName, extractedData.lastName].filter(Boolean).map(s => (s || '').trim()).filter(Boolean).join(' ');
      // Resume document metadata
      const newResumeRecord = {
=======
      setUploadedResumeObj({
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
        id: `resume-${Date.now()}`,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size || 102400,
        uploadedAt: new Date().toISOString(),
        parsedDegree: extractedData.primaryDegree || 'Educational Attainment',
        parsedSkills: Array.from(new Set([
          ...skills.tradeSkills,
          ...skills.adminSkills,
          ...skills.serviceSkills,
          ...skills.salesSkills,
          ...skills.itSkills,
          ...skills.softSkills,
        ])),
        parsedAttainment: normalizedAttainment,
        candidateName: parsedCandidateName || undefined,
        firstName: extractedData.firstName || undefined,
        middleName: extractedData.middleName || undefined,
        lastName: extractedData.lastName || undefined,
        isPrimary: true,
      });

      setExtractionSuccess(true);
<<<<<<< HEAD
      showToast({
        title: 'Resume Extracted Successfully',
        message: 'Personal details, education, skills, and work experience have been auto-filled into your profile.',
        type: 'success',
      });
      
      // Advance smoothly to Step 2: Information Review & Confirmation
=======
      showToast('Resume data extracted into your profile fields! Reviewing details...', 'success');

>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
      setTimeout(() => {
        setCurrentStep(2);
      }, 700);
    } catch (err: any) {
      console.error('Error processing resume:', err);
      showToast({
        title: 'Resume Uploaded',
        message: 'Please verify and complete your details in the review step.',
        type: 'info',
      });
      setCurrentStep(2);
    } finally {
      setIsProcessingFile(false);
    }
  };

<<<<<<< HEAD
  // Skill Add / Delete helpers (Enforces ALL CAPS)
  const handleAddSkill = (
    skill: string, 
    setList: React.Dispatch<React.SetStateAction<string[]>>, 
    clearInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = skill.trim().toUpperCase();
    if (!trimmed) return;
    setList(prev => Array.from(new Set([...prev, trimmed])));
    clearInput('');
=======
  const handleAddSkill = (category: SkillCategoryKey, skill: string) => {
    skillSetters[category](prev => Array.from(new Set([...prev, skill])));
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
  };

  const handleRemoveSkill = (category: SkillCategoryKey, skillToRemove: string) => {
    skillSetters[category](prev => prev.filter(s => s !== skillToRemove));
  };

  const toggleSelection = (item: string, currentList: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentList.includes(item)) {
      if (currentList.length > 1) {
        setList(currentList.filter(i => i !== item));
      } else {
        showToast('Please keep at least one preference selected.', 'info');
      }
    } else {
      setList([...currentList, item]);
    }
  };

  const technicalSkillsCount = tradeSkills.length + adminSkills.length + serviceSkills.length + salesSkills.length + itSkills.length;
  const totalEnteredSkills = technicalSkillsCount + softSkills.length;

  const validationResults = {
    hasName: Boolean(firstName.trim() && lastName.trim()),
    hasContact: Boolean(contactNumber.trim() && email.trim()),
    hasAddress: Boolean(address.trim() || municipality.trim()),
    hasEducation: Boolean(educationalAttainment.trim() && primaryDegree.trim()),
    hasSkills: true,
    hasPreferences: selectedCategories.length > 0 && selectedLocations.length > 0 && selectedEmpTypes.length > 0,
  };

  const isProfileValid = Object.values(validationResults).every(Boolean);

  const handleCompleteSetup = () => {
    const seekerId = currentSeekerProfile?.id || (currentUser ? `seeker-${currentUser.id}` : `seeker-${Date.now()}`);
    const userId = currentUser?.id || currentSeekerProfile?.userId || `user-${Date.now()}`;

    const allTechCombined = Array.from(new Set([
      ...tradeSkills,
      ...adminSkills,
      ...serviceSkills,
      ...salesSkills,
      ...itSkills,
    ]));

    const eduRecord = (primaryDegree.trim() || school.trim() || educationalAttainment.trim()) ? [{
      id: `edu-${Date.now()}`,
      degreeCourse: primaryDegree.trim(),
      school: school.trim(),
      yearGraduated: yearGraduated ? (parseInt(yearGraduated, 10) || undefined) : undefined,
      educationalAttainment,
    }] : [];

    const userFullName = [firstName, middleName, lastName].filter(Boolean).map(s => s.trim()).filter(Boolean).join(' ');
    const activeResumeRecord = uploadedResumeObj ? {
      ...uploadedResumeObj,
      candidateName: userFullName || uploadedResumeObj.candidateName,
      firstName: firstName.trim() || uploadedResumeObj.firstName,
      middleName: middleName.trim() || uploadedResumeObj.middleName,
      lastName: lastName.trim() || uploadedResumeObj.lastName,
    } : null;

    const existingResumes = currentSeekerProfile?.resumes || [];
    const updatedResumes = activeResumeRecord
      ? [activeResumeRecord, ...existingResumes.filter(r => r.fileName !== activeResumeRecord.fileName)]
      : existingResumes;

    const updatedProfile: Partial<JobSeekerProfile> = {
      userId,
      profilePicture: profilePicture || '',
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth ? dateOfBirth.trim() : undefined,
      age: age ? parseInt(age, 10) : undefined,
      civilStatus: civilStatus || undefined,
      sex: sex || undefined,
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      address: address.trim(),
      barangay: barangay.trim() || undefined,
      municipality: municipality.trim() || 'Roxas',
      educationalAttainment,
      primaryDegree: primaryDegree.trim(),
      professionalSummary: professionalSummary.trim(),
      education: eduRecord as any,
      workExperience,
      certifications: extractedCertifications,
      tradeSkills,
      administrativeSkills: adminSkills,
      serviceHospitalitySkills: serviceSkills,
      salesCustomerSkills: salesSkills,
      itCreativeSkills: itSkills,
      technicalSkills: allTechCombined,
      softSkills,
      resumes: updatedResumes,
      activeResumeId: updatedResumes[0]?.id,
      jobPreferences: {
        categories: selectedCategories,
        municipalities: municipality.trim() ? [municipality.trim()] : [],
        locations: selectedLocations,
        employmentTypes: selectedEmpTypes,
        minSalary: selectedSalary,
      },
      isProfileCompleted: true,
      profileSetupCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateJobSeekerProfile(seekerId, updatedProfile);
    markProfileCompletedInStorage([currentUser?.id, currentUser?.email, email, seekerId], 'job_seeker');

    if (typeof addNotification === 'function') {
      addNotification({
        recipientId: userId,
        recipientRole: 'job_seeker',
        title: 'Profile Setup Completed & Saved! 🎉',
        message: 'Your qualifications and resume have been saved to your profile. The Decision Tree has unlocked personalized job recommendations aligned with your profile.',
        type: 'success',
        actionUrl: 'seeker-dashboard',
      });
    }

    if (typeof showToast === 'function') {
      showToast({
        type: 'success',
        title: 'Profile Saved & Setup Complete!',
        message: 'Loading personalized job recommendations matching your profile...',
      });
    }

    onComplete('seeker-dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Wizard Header & Stepper */}
      <div className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-paper-warm)] text-[var(--color-ink)] border border-[var(--color-rule)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Job Seeker Onboarding</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-paper-warm)] text-[var(--color-ink)] border border-[var(--color-rule)]">
                <Lock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span>Profile Setup</span>
              </span>
              <button
                type="button"
                onClick={() => onComplete('seeker-dashboard')}
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] bg-[var(--color-paper-warm)] px-3 py-1 rounded-full border border-[var(--color-rule)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                title="View Job Recommendations"
              >
                <span>View Job Recommendations</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] font-display tracking-tight">
              Job Seeker Profile Setup
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1.5 max-w-xl leading-relaxed">
              Please complete your profile and skills inventory first. You must first set up your profile before you can access the dashboard and view local job postings.
            </p>
          </div>

          <div className="text-left sm:text-right bg-[var(--color-paper-warm)] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[var(--color-rule)] w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-xs font-medium text-[var(--color-ink-muted)]">Step {currentStep} of 5</span>
              <span className="text-[11px] font-bold text-[var(--color-ink)] bg-[var(--color-paper-warm)] px-2 py-0.5 rounded-md border border-[var(--color-rule)] tabular-nums">
                {Math.round((currentStep / 5) * 100)}% Complete
              </span>
            </div>
            <div className="text-sm font-semibold text-[var(--color-accent)] mt-1">
              {STEP_TITLES[currentStep]}
            </div>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="mt-4 p-3 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl flex items-center gap-2.5 text-xs text-[var(--color-ink)] font-medium">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>
            <strong>Requirement Notice:</strong> Your personalized job matching dashboard and employer job postings will become available as soon as you complete the steps below.
          </span>
        </div>

        {/* Linear progress bar */}
        <div className="mt-5 pt-4 border-t border-[var(--color-rule)]">
          <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)] mb-1.5 font-medium">
            <span>Onboarding Progress: Step {currentStep} of 5</span>
            <span className="font-bold text-[var(--color-ink)] tabular-nums">{Math.round((currentStep / 5) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <WizardStepResumeUpload
          isProcessingFile={isProcessingFile}
          extractionSuccess={extractionSuccess}
          activeFileName={activeFileName}
          onFileSelected={processUploadedFile}
          onProceedManual={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
<<<<<<< HEAD
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 space-y-8"
        >
          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-2 font-display">
              <User className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
              <span>Personal & Contact Information</span>
            </div>

            {/* Profile Picture Uploader (Custom Photo Only + Skip for now / Continue later + Blank Fallback) */}
            <div className="bg-[var(--color-paper-warm)] p-4 rounded-2xl border border-[var(--color-rule)]">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-16 h-16 rounded-full bg-[var(--color-paper)] flex items-center justify-center overflow-hidden border-2 border-dashed border-[var(--color-rule)] cursor-pointer"
                    title="Click to upload your profile picture"
                  >
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <h4 className="text-xs font-bold text-[var(--color-ink)] flex items-center justify-center sm:justify-start gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                    <span>Upload Your Profile Picture (Optional)</span>
                  </h4>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Upload your own profile picture or 2x2 ID photo. If you don't have a photo ready, click "Skip for now / Continue later" — your profile picture space will remain completely blank until you upload one in Profile Settings.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="btn btn--primary px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{profilePicture ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
                    </button>

                    {!profilePicture && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicture('');
                          setPhotoSkippedForNow(true);
                          showToast({
                            type: 'info',
                            title: 'Profile Picture Skipped for Now',
                            message: 'Your profile picture area will remain blank. You can upload one anytime in Profile Settings.'
                          });
                        }}
                        className="btn btn--quiet px-3 py-1.5 rounded-xl font-medium text-xs border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                      >
                        Skip for now / Continue later
                      </button>
                    )}

                    {profilePicture && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicture('');
                          setPhotoSkippedForNow(false);
                        }}
                        className="btn btn--quiet px-3 py-1.5 rounded-xl font-medium text-xs border border-[var(--color-rule)] text-rose-600 transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {photoSkippedForNow && !profilePicture && (
                    <p className="text-[11px] font-medium text-emerald-700 pt-1">
                      ✓ Skipped for now — profile picture space left blank. You can upload a photo anytime in Profile Settings.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value.toUpperCase())}
                  placeholder="E.G. MARIA JADE"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <span className="text-[10px] text-[var(--color-ink-muted)]">Auto-formatted in ALL CAPS</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Middle Name or Initial
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value.toUpperCase())}
                  placeholder="E.G. RAMOS OR R."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value.toUpperCase())}
                  placeholder="E.G. SANTOS"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Date of Birth</span>
                </label>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={toDateInputValue(dateOfBirth)}
                  onChange={e => {
                    const val = e.target.value;
                    setDateOfBirth(val);
                    const calculated = computeAgeFromDob(val);
                    if (calculated) setAge(calculated);
                  }}
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker?.();
                    } catch {
                      // Fallback for browsers without showPicker
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  min="1940-01-01"
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors cursor-pointer ${
                    !dateOfBirth
                      ? 'border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-[var(--color-ink-muted)]'
                      : 'border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] font-medium'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Civil Status
                </label>
                <select
                  value={civilStatus ? normalizeCivilStatus(civilStatus) : ''}
                  onChange={e => setCivilStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                >
                  <option value="">-- Select Civil Status --</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated (Sep.)</option>
                  <option value="Solo Parent">Solo Parent</option>
                  <option value="Common-Law">Common-Law</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Sex / Gender
                </label>
                <select
                  value={sex}
                  onChange={e => setSex(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors ${
                    !sex
                      ? 'border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-[var(--color-ink-muted)]'
                      : 'border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] font-medium'
                  }`}
                >
                  <option value="">-- Select Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder="09171234567, +63 917 123 4567, or (043) 288-1234"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="mariajade.santos@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Complete Home Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value.toUpperCase())}
                  placeholder="HOUSE/LOT NO., STREET, BARANGAY, MUNICIPALITY, PROVINCE"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Barangay
                </label>
                <select
                  value={normalizeBarangay(barangay, address)}
                  onChange={e => setBarangay(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                >
                  <option value="">Select Barangay (Roxas)</option>
                  {ROXAS_BARANGAYS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Education Background */}
          <div className="space-y-4 pt-4 border-t border-[var(--color-rule)]">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-2 font-display">
              <GraduationCap className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
              <span>Educational Attainment & Degree</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Highest Educational Attainment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={educationalAttainment ? normalizeEducationalAttainment(educationalAttainment, primaryDegree) : ''}
                  onChange={e => setEducationalAttainment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                >
                  <option value="">-- Select Educational Attainment --</option>
                  <option value="College Graduate">College Graduate (Bachelor’s Degree)</option>
                  <option value="College Undergraduate">College Undergraduate</option>
                  <option value="High School Graduate">High School Graduate</option>
                  <option value="Senior High School">Senior High School (SHS Grad)</option>
                  <option value="Vocational / TVET">Vocational / TVET (Tech-Voc)</option>
                  <option value="Master's Degree">Master’s Degree</option>
                  <option value="Doctorate Degree">Doctorate Degree</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Course / Degree Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={primaryDegree}
                  onChange={e => setPrimaryDegree(e.target.value.toUpperCase())}
                  placeholder="E.G. BACHELOR OF SCIENCE IN COMPUTER SCIENCE, BSIT, BSBA"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <span className="text-[10px] text-[var(--color-ink-muted)]">Accurately preserved in ALL CAPS</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  School / University
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={e => setSchool(e.target.value.toUpperCase())}
                  placeholder="E.G. JOHN PAUL COLLEGE, MINDORO STATE UNIVERSITY, EMC"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Year Graduated / Status
                </label>
                <input
                  type="text"
                  value={yearGraduated}
                  onChange={e => setYearGraduated(e.target.value)}
                  placeholder="2024, 2020-2024, or Expected 2025"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Work Experience & Professional Summary (Auto-Filled from Resume) */}
          <div className="space-y-4 pt-4 border-t border-[var(--color-rule)]">
            <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] font-display">
                <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Work Experience & Professional Summary</span>
              </div>
              <span className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                Auto-extracted from resume • Review or edit below
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                Professional Summary / Bio
              </label>
              <textarea
                rows={2}
                value={professionalSummary}
                onChange={e => setProfessionalSummary(e.target.value.toUpperCase())}
                placeholder="BRIEF SUMMARY OF YOUR BACKGROUND, STRENGTHS, AND CAREER GOALS..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            {/* Existing / Extracted Work Experience List */}
            {workExperience.length > 0 && (
              <div className="space-y-2.5">
                {workExperience.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="p-3.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setWorkExperience(prev => prev.map((item, i) => i === idx ? { ...item, position: val } : item));
                          }}
                          placeholder="POSITION / JOB TITLE"
                          className="font-bold text-[var(--color-ink)] uppercase bg-[var(--color-paper)] px-2.5 py-1 rounded-lg border border-[var(--color-rule)]"
                        />
                        <span className="text-[var(--color-ink-muted)]">at</span>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setWorkExperience(prev => prev.map((item, i) => i === idx ? { ...item, company: val } : item));
                          }}
                          placeholder="COMPANY / ESTABLISHMENT"
                          className="font-semibold text-[var(--color-ink)] uppercase bg-[var(--color-paper)] px-2.5 py-1 rounded-lg border border-[var(--color-rule)]"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={exp.yearsOfExperience ?? 1}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setWorkExperience(prev => prev.map((item, i) => i === idx ? { ...item, yearsOfExperience: val } : item));
                            }}
                            className="w-16 text-center font-bold bg-[var(--color-paper)] px-2 py-1 rounded-lg border border-[var(--color-rule)]"
                          />
                          <span className="text-[11px] text-[var(--color-ink-muted)]">yr(s)</span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={exp.responsibilities || ''}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setWorkExperience(prev => prev.map((item, i) => i === idx ? { ...item, responsibilities: val } : item));
                        }}
                        placeholder="KEY DUTIES AND ACCOMPLISHMENTS..."
                        className="w-full text-[11px] text-[var(--color-ink-muted)] uppercase bg-[var(--color-paper)] px-2.5 py-1 rounded-lg border border-[var(--color-rule)] mt-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkExperience(prev => prev.filter((_, i) => i !== idx))}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 self-end sm:self-center cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Work Experience Form */}
            <div className="p-3.5 rounded-xl border border-dashed border-[var(--color-rule)] bg-[var(--color-paper)] space-y-2.5">
              <p className="text-xs font-semibold text-[var(--color-ink)]">Add Work Experience (Optional for Fresh Graduates)</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  value={newExpPosition}
                  onChange={e => setNewExpPosition(e.target.value.toUpperCase())}
                  placeholder="JOB TITLE (E.G. CASHIER)"
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] uppercase"
                />
                <input
                  type="text"
                  value={newExpCompany}
                  onChange={e => setNewExpCompany(e.target.value.toUpperCase())}
                  placeholder="COMPANY / EMPLOYER"
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] uppercase"
                />
                <input
                  type="number"
                  min="0"
                  value={newExpYears}
                  onChange={e => setNewExpYears(e.target.value)}
                  placeholder="Years (e.g. 2)"
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newExpPosition.trim() && !newExpCompany.trim()) return;
                    setWorkExperience(prev => [
                      ...prev,
                      {
                        id: `exp-${Date.now()}`,
                        position: newExpPosition.trim() || 'Staff',
                        company: newExpCompany.trim() || 'Previous Employer',
                        yearsOfExperience: Number(newExpYears) || 1,
                        startDate: String(new Date().getFullYear() - (Number(newExpYears) || 1)),
                        endDate: 'Present',
                        isCurrent: false,
                        responsibilities: newExpResponsibilities.trim() || 'Relevant professional work experience.',
                      },
                    ]);
                    setNewExpPosition('');
                    setNewExpCompany('');
                    setNewExpYears('1');
                    setNewExpResponsibilities('');
                  }}
                  className="btn btn--quiet text-xs font-semibold py-1.5 px-3 rounded-lg border border-[var(--color-rule)] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls for Step 2 */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Resume Upload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!firstName.trim() || !lastName.trim()) {
                  showToast({ title: 'Required Field', message: 'Please provide your First Name and Last Name.', type: 'alert' });
                  return;
                }
                if (!primaryDegree.trim() && !educationalAttainment.trim()) {
                  showToast({ title: 'Required Field', message: 'Please specify your Educational Attainment or Degree.', type: 'alert' });
                  return;
                }
                setCurrentStep(3);
              }}
              className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
            >
              <span>Proceed to Skills Inventory</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
=======
        <WizardStepPersonalEducation
          profilePicture={profilePicture}
          setProfilePicture={setProfilePicture}
          onAvatarFileUpload={handleAvatarFileUpload}
          firstName={firstName}
          setFirstName={setFirstName}
          middleName={middleName}
          setMiddleName={setMiddleName}
          lastName={lastName}
          setLastName={setLastName}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          age={age}
          setAge={setAge}
          civilStatus={civilStatus}
          setCivilStatus={setCivilStatus}
          sex={sex}
          setSex={setSex}
          contactNumber={contactNumber}
          setContactNumber={setContactNumber}
          email={email}
          setEmail={setEmail}
          address={address}
          setAddress={setAddress}
          barangay={barangay}
          setBarangay={setBarangay}
          educationalAttainment={educationalAttainment}
          setEducationalAttainment={setEducationalAttainment}
          primaryDegree={primaryDegree}
          setPrimaryDegree={setPrimaryDegree}
          school={school}
          setSchool={setSchool}
          yearGraduated={yearGraduated}
          setYearGraduated={setYearGraduated}
          onBack={() => setCurrentStep(1)}
          onNext={() => {
            if (!firstName.trim() || !lastName.trim()) {
              showToast('Please provide your First Name and Last Name.', 'error');
              return;
            }
            if (!primaryDegree.trim()) {
              showToast('Please specify your Course or Degree.', 'error');
              return;
            }
            setCurrentStep(3);
          }}
        />
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
      )}

      {currentStep === 3 && (
<<<<<<< HEAD
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 space-y-6"
        >
          {/* Header Banner */}
          <div className="p-4 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] flex items-start gap-3">
            <Award className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--color-ink)] font-display">
                    Skills Inventory across Categories
                  </h3>
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Optional • Not All Required
                  </span>
                </div>
                <span className="text-xs tabular-nums text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-rule)] px-2.5 py-1 rounded-lg">
                  {totalEnteredSkills} skill{totalEnteredSkills === 1 ? '' : 's'} recorded
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Review skills extracted from your resume or add additional competencies across the 6 PESO skill categories below.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">

            {/* Category A: Technical & Trade */}
            <div className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">A. Technical & Trade Skills</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">Automotive, Electrical, Welding (SMAW), RAC, Carpentry</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {tradeSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s, setTradeSkills)} className="text-amber-600 hover:text-amber-800 cursor-pointer" aria-label={`Remove ${s}`}>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {tradeSkills.length === 0 && <span className="text-xs text-[var(--color-ink-muted)] italic">No trade skills added (Optional — leave blank if not applicable).</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSkillTrade}
                  onChange={e => setInputSkillTrade(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(inputSkillTrade, setTradeSkills, setInputSkillTrade))}
                  placeholder="Add trade skill (e.g. Electrical Wiring, SMAW Welding)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(inputSkillTrade, setTradeSkills, setInputSkillTrade)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Category B: Administrative & Office */}
            <div className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">B. Administrative & Office Skills</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">Bookkeeping, Records, Data Entry, Billing, Spreadsheets</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {adminSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-rule)] font-medium">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s, setAdminSkills)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer" aria-label={`Remove ${s}`}>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {adminSkills.length === 0 && <span className="text-xs text-[var(--color-ink-muted)] italic">No administrative skills added (Optional — leave blank if not applicable).</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSkillAdmin}
                  onChange={e => setInputSkillAdmin(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(inputSkillAdmin, setAdminSkills, setInputSkillAdmin))}
                  placeholder="Add admin skill (e.g. Bookkeeping, Data Entry)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(inputSkillAdmin, setAdminSkills, setInputSkillAdmin)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Category C: Service, Hospitality & Culinary */}
            <div className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">C. Service, Hospitality & Culinary Skills</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">Cooking, Baking, Food & Beverage, Housekeeping, Barista</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {serviceSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s, setServiceSkills)} className="text-rose-600 hover:text-rose-800 cursor-pointer" aria-label={`Remove ${s}`}>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {serviceSkills.length === 0 && <span className="text-xs text-[var(--color-ink-muted)] italic">No service skills added (Optional — leave blank if not applicable).</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSkillService}
                  onChange={e => setInputSkillService(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(inputSkillService, setServiceSkills, setInputSkillService))}
                  placeholder="Add service skill (e.g. Commercial Cooking, Barista Craft)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(inputSkillService, setServiceSkills, setInputSkillService)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Category D: Sales, Commerce & Customer Facing */}
            <div className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">D. Sales, Commerce & Customer Facing Skills</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">Cashiering, Inventory Stocking, POS Operation, Customer Care</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {salesSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s, setSalesSkills)} className="text-teal-600 hover:text-teal-800 cursor-pointer" aria-label={`Remove ${s}`}>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {salesSkills.length === 0 && <span className="text-xs text-[var(--color-ink-muted)] italic">No sales skills added (Optional — leave blank if not applicable).</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSkillSales}
                  onChange={e => setInputSkillSales(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(inputSkillSales, setSalesSkills, setInputSkillSales))}
                  placeholder="Add sales skill (e.g. Cashiering, Inventory Management)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(inputSkillSales, setSalesSkills, setInputSkillSales)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Category E: IT & Creative Skills */}
            <div className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">E. Information Technology & Creative Skills</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">React, JavaScript, Node.js, AutoCAD, Photoshop, IT Support</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {itSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-rule)] font-medium">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s, setItSkills)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer" aria-label={`Remove ${s}`}>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {itSkills.length === 0 && <span className="text-xs text-[var(--color-ink-muted)] italic">No IT skills added (Optional — leave blank if not applicable).</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSkillIt}
                  onChange={e => setInputSkillIt(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(inputSkillIt, setItSkills, setInputSkillIt))}
                  placeholder="Add IT skill (e.g. React.js, Python, AutoCAD)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(inputSkillIt, setItSkills, setInputSkillIt)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Category F: Soft Skills & Foundational Competencies */}
            <div className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">F. Soft Skills & Foundational Competencies</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">Clear Communication, Teamwork, Leadership, Time Management</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {softSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {s}
                    <button type="button" onClick={() => handleRemoveSkill(s, setSoftSkills)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer" aria-label={`Remove ${s}`}>
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {softSkills.length === 0 && <span className="text-xs text-[var(--color-ink-muted)] italic">No soft skills added (Optional — leave blank if not applicable).</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSkillSoft}
                  onChange={e => setInputSkillSoft(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(inputSkillSoft, setSoftSkills, setInputSkillSoft))}
                  placeholder="Add soft skill (e.g. Critical Thinking, Work Ethic)"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(inputSkillSoft, setSoftSkills, setInputSkillSoft)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls for Step 3 */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Review & Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
            >
              <span>Proceed to Job Preferences</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
=======
        <WizardStepSkillsInventory
          skillsByCategory={{
            trade: tradeSkills,
            admin: adminSkills,
            service: serviceSkills,
            sales: salesSkills,
            it: itSkills,
            soft: softSkills,
          }}
          totalEnteredSkills={totalEnteredSkills}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
          onBack={() => setCurrentStep(2)}
          onNext={() => setCurrentStep(4)}
        />
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
      )}

      {currentStep === 4 && (
<<<<<<< HEAD
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 space-y-8"
        >
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display">
              Select Your Preferred Career Directions
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1">
              Job preferences are manually chosen here rather than extracted from your resume. Select your target industries, locations, and employment types.
            </p>
          </div>

          {/* 1. Preferred Job Category */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--color-ink)]">
              1. Preferred Job Categories & Vocational Tracks <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Select all categories and tracks you are willing to work in:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {PRESET_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat.label);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSelection(cat.label, selectedCategories, setSelectedCategories)}
                    className={`p-3 rounded-xl text-left border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                      isSelected
                        ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                        : 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]'
                    }`}
                  >
                    <div>
                      <div className="leading-snug">{cat.label}</div>
                      <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">{cat.group}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${
                      isSelected ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Preferred Location */}
          <div className="space-y-3 pt-4 border-t border-[var(--color-rule)]">
            <label className="block text-xs font-semibold text-[var(--color-ink)]">
              2. Preferred Working Locations <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Select municipalities, specific barangays, provincial, or flexible arrangements:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {PRESET_LOCATIONS.map(loc => {
                const isSelected = selectedLocations.includes(loc.label);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleSelection(loc.label, selectedLocations, setSelectedLocations)}
                    className={`p-3 rounded-xl text-left border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                      isSelected
                        ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                        : 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]'
                    }`}
                  >
                    <div>
                      <div className="leading-snug">{loc.label}</div>
                      <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">{loc.group}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${
                      isSelected ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Preferred Employment Type */}
          <div className="space-y-3 pt-4 border-t border-[var(--color-rule)]">
            <label className="block text-xs font-semibold text-[var(--color-ink)]">
              3. Preferred Employment Types & Working Arrangements <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Choose your preferred terms of employment:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_EMPLOYMENT_TYPES.map(emp => {
                const isSelected = selectedEmpTypes.includes(emp.label);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleSelection(emp.label, selectedEmpTypes, setSelectedEmpTypes)}
                    className={`p-3.5 rounded-xl text-left border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                      isSelected
                        ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                        : 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{emp.label}</div>
                      <span className="text-[11px] text-[var(--color-ink-muted)] font-normal mt-0.5 block">{emp.desc}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${
                      isSelected ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Salary Expectations */}
          <div className="space-y-3 pt-4 border-t border-[var(--color-rule)]">
            <label className="block text-xs font-semibold text-[var(--color-ink)]">
              4. Expected Monthly Compensation Bracket
            </label>
            <select
              value={selectedSalary}
              onChange={e => setSelectedSalary(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
            >
              <option value="">-- Select Expected Salary Bracket --</option>
              {PRESET_SALARIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Skills</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
            >
              <span>Proceed to Profile Validation</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
=======
        <WizardStepJobPreferences
          selectedCategories={selectedCategories}
          selectedLocations={selectedLocations}
          selectedEmpTypes={selectedEmpTypes}
          selectedSalary={selectedSalary}
          onToggleCategory={label => toggleSelection(label, selectedCategories, setSelectedCategories)}
          onToggleLocation={label => toggleSelection(label, selectedLocations, setSelectedLocations)}
          onToggleEmpType={label => toggleSelection(label, selectedEmpTypes, setSelectedEmpTypes)}
          onSalaryChange={setSelectedSalary}
          onBack={() => setCurrentStep(3)}
          onNext={() => setCurrentStep(5)}
        />
>>>>>>> 55d3e7db88e819bd118d64945937a3d53702b502
      )}

      {currentStep === 5 && (
        <WizardStepValidation
          firstName={firstName}
          middleName={middleName}
          lastName={lastName}
          contactNumber={contactNumber}
          email={email}
          address={address}
          barangay={barangay}
          municipality={municipality}
          educationalAttainment={educationalAttainment}
          primaryDegree={primaryDegree}
          technicalSkillsCount={technicalSkillsCount}
          softSkillsCount={softSkills.length}
          totalEnteredSkills={totalEnteredSkills}
          selectedCategoriesCount={selectedCategories.length}
          selectedLocationsCount={selectedLocations.length}
          selectedEmpTypesCount={selectedEmpTypes.length}
          validationResults={validationResults}
          isProfileValid={isProfileValid}
          onBack={() => setCurrentStep(4)}
          onComplete={handleCompleteSetup}
        />
      )}

      {/* Step 5 Completion Pop-up Modal */}
      <AnimatePresence>
        {isCelebrationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] shadow-md p-6 sm:p-8 max-w-md w-full text-center space-y-5"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
                <PartyPopper className="w-8 h-8" aria-hidden="true" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[var(--color-ink)] font-display">
                  Profile Setup Completed!
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                  Your profile and qualifications have been saved. Your personalized Decision Tree recommendations matching your degree, skills, and preferences are now ready.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCelebrationOpen(false);
                    onComplete('seeker-dashboard');
                  }}
                  className="btn btn--primary w-full py-3 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Show My Matched Job Recommendations</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCelebrationOpen(false);
                    onComplete('seeker-profile');
                  }}
                  className="btn btn--quiet w-full py-2.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-xl border border-[var(--color-rule)] transition-colors flex items-center justify-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>View My Profile & Settings</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
