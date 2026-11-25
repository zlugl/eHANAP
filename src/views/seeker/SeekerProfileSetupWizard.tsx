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

  // Personal & Contact state
  const [profilePicture, setProfilePicture] = useState(currentSeekerProfile?.profilePicture || currentUser?.avatar || '');
  const [firstName, setFirstName] = useState(currentSeekerProfile?.firstName || '');
  const [middleName, setMiddleName] = useState(currentSeekerProfile?.middleName || '');
  const [lastName, setLastName] = useState(currentSeekerProfile?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentSeekerProfile?.dateOfBirth || '');
  const [age, setAge] = useState<string>(currentSeekerProfile?.age ? String(currentSeekerProfile.age) : '');
  const [civilStatus, setCivilStatus] = useState<string>(currentSeekerProfile?.civilStatus || 'Single');
  const [sex, setSex] = useState<string>(currentSeekerProfile?.sex || '');
  const [contactNumber, setContactNumber] = useState(currentSeekerProfile?.contactNumber || '');
  const [email, setEmail] = useState(currentSeekerProfile?.email || '');
  const [address, setAddress] = useState(currentSeekerProfile?.address || '');
  const [barangay, setBarangay] = useState(currentSeekerProfile?.barangay || '');
  const [municipality, setMunicipality] = useState(currentSeekerProfile?.municipality || 'Roxas');

  // Education state
  const [educationalAttainment, setEducationalAttainment] = useState(currentSeekerProfile?.educationalAttainment || 'College Graduate');
  const [primaryDegree, setPrimaryDegree] = useState(currentSeekerProfile?.primaryDegree || '');
  const [school, setSchool] = useState(currentSeekerProfile?.education?.[0]?.school || '');
  const [yearGraduated, setYearGraduated] = useState<string>(
    currentSeekerProfile?.education?.[0]?.yearGraduated ? String(currentSeekerProfile.education[0].yearGraduated) : '2024'
  );

  // 6 Skill categories state
  const [tradeSkills, setTradeSkills] = useState<string[]>(currentSeekerProfile?.tradeSkills || []);
  const [adminSkills, setAdminSkills] = useState<string[]>(currentSeekerProfile?.administrativeSkills || []);
  const [serviceSkills, setServiceSkills] = useState<string[]>(currentSeekerProfile?.serviceHospitalitySkills || []);
  const [salesSkills, setSalesSkills] = useState<string[]>(currentSeekerProfile?.salesCustomerSkills || []);
  const [itSkills, setItSkills] = useState<string[]>(currentSeekerProfile?.itCreativeSkills || currentSeekerProfile?.technicalSkills || []);
  const [softSkills, setSoftSkills] = useState<string[]>(currentSeekerProfile?.softSkills || ['Clear Communication', 'Teamwork']);

  // Step 4: Job Preferences state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentSeekerProfile?.jobPreferences?.categories || ['Information Technology & Software']
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    currentSeekerProfile?.jobPreferences?.locations || ['Roxas, Oriental Mindoro']
  );
  const [selectedEmpTypes, setSelectedEmpTypes] = useState<string[]>(
    currentSeekerProfile?.jobPreferences?.employmentTypes || ['Full-Time', 'Permanent / Regular']
  );
  const [selectedSalary, setSelectedSalary] = useState<string>(
    currentSeekerProfile?.jobPreferences?.minSalary || '₱18,000 - ₱25,000 (Mid Level)'
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

      setEducationalAttainment(normalizedAttainment);
      if (extractedData.primaryDegree) setPrimaryDegree(extractedData.primaryDegree);
      if (extractedData.school) setSchool(extractedData.school);
      if (extractedData.yearGraduated) setYearGraduated(String(extractedData.yearGraduated));

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

      setUploadedResumeObj({
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
      showToast('Resume data extracted into your profile fields! Reviewing details...', 'success');

      setTimeout(() => {
        setCurrentStep(2);
      }, 700);
    } catch (err: any) {
      console.error('Error processing resume:', err);
      showToast('Resume uploaded. Please verify and complete details in the review step.', 'info');
      setCurrentStep(2);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleAddSkill = (category: SkillCategoryKey, skill: string) => {
    skillSetters[category](prev => Array.from(new Set([...prev, skill])));
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

    const eduRecord = {
      id: `edu-${Date.now()}`,
      degreeCourse: primaryDegree.trim() || 'College Degree',
      school: school.trim() || 'Educational Institution',
      yearGraduated: parseInt(yearGraduated, 10) || new Date().getFullYear(),
      educationalAttainment,
    };

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
      profilePicture: profilePicture || undefined,
      firstName: firstName.trim() || (currentUser?.name?.split(' ')[0] || 'Candidate'),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || (currentUser?.name?.split(' ').slice(1).join(' ') || 'Applicant'),
      dateOfBirth: dateOfBirth ? dateOfBirth.trim() : undefined,
      age: age ? parseInt(age, 10) : undefined,
      civilStatus,
      sex: sex || undefined,
      contactNumber: contactNumber.trim() || (currentUser?.phone || ''),
      email: email.trim() || (currentUser?.email || ''),
      address: address.trim() || (barangay ? `Brgy. ${barangay}, ${municipality}, Oriental Mindoro` : `${municipality}, Oriental Mindoro`),
      barangay: barangay.trim() || undefined,
      municipality: municipality.trim() || 'Roxas',
      educationalAttainment,
      primaryDegree: primaryDegree.trim(),
      education: [eduRecord],
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
        municipalities: [municipality],
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
      )}

      {currentStep === 3 && (
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
      )}

      {currentStep === 4 && (
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
