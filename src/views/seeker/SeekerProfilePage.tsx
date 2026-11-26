import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isSeekerProfileComplete } from '../../utils/routeGuards';
import { evaluateResumeForAts } from '../../utils/atsEngine';
import { JOB_CATEGORIES } from '../../constants';
import { EducationRecord, WorkExperienceRecord, CertificationRecord } from '../../types';
import { useSeekerProfileForm } from '../../hooks/useSeekerProfileForm';
import {
  SeekerProfileHeader,
  SeekerCareerToolsGrid,
  SeekerBottomNav,
  SeekerPersonalInfoModal,
  SeekerMatchReadinessModal,
  SeekerJobPreferencesModal,
  SeekerFullProfileOverviewModal,
  EducationModal,
  ExperienceModal,
  CertificationModal,
  CertificateLightbox,
  SeekerLanguageModal,
  SeekerHelpModal,
  SeekerPrivacyModal,
  SeekerInviteModal
} from './components';
import { SeekerProfileSetupWizard } from './SeekerProfileSetupWizard';
import { ResumeUploadModal } from './ResumeUploadModal';
import { ResumePDFExportModal } from '../../components/ResumePDFExportModal';
import { ResumeBuilderModal } from '../../components/ResumeBuilderModal';
import { AtsResumeModal } from '../../components/AtsResumeModal';
import { SettingsModal } from '../../components/SettingsModal';
import { SeekerBookmarksModal } from '../../components/SeekerBookmarksModal';
import {
  ContactInfoModal,
  AboutMeModal,
  ProjectsModal,
  VolunteerModal,
  AwardsModal,
  SkillsModal
} from '../../components/seeker/SeekerModularProfileModals';

export interface SeekerProfilePageProps {
  onNavigate?: (view: string, params?: any) => void;
  params?: any;
}

export const SeekerProfilePage: React.FC<SeekerProfilePageProps> = ({ onNavigate, params }) => {
  const { currentUser, currentSeekerProfile, updateJobSeekerProfile, showToast, bookmarkedJobIds } = useApp();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const form = useSeekerProfileForm(currentSeekerProfile);

  // Section modals & utility state
  const [activeSectionModal, setActiveSectionModal] = useState<
    'personal' | 'analytics' | 'seekingStatus' | 'settings' | 'bookmarks' | 'language' | 'help' | 'privacy' | 'invite' | 'viewProfile' | null
  >(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [seekingAvailability, setSeekingAvailability] = useState<'actively_looking' | 'open_to_offers' | 'not_looking'>('actively_looking');

  // Document & builder modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isResumeBuilderOpen, setIsResumeBuilderOpen] = useState(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [selectedAtsData, setSelectedAtsData] = useState<{ resume: any; atsResult: any } | null>(null);

  // Modular profile detail modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAboutMeModalOpen, setIsAboutMeModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  // Record CRUD state
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationRecord | null>(null);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<WorkExperienceRecord | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationRecord | null>(null);
  const [previewCertProof, setPreviewCertProof] = useState<{ name: string; url: string; issuer?: string; date?: string } | null>(null);

  // Active tab in personal info modal
  const [personalTab, setPersonalTab] = useState<'personal' | 'education' | 'experience' | 'skills' | 'certifications' | 'resumes'>(
    params?.tab && ['personal', 'education', 'experience', 'skills', 'certifications', 'preferences'].includes(params.tab)
      ? (params.tab === 'preferences' ? 'personal' : params.tab)
      : 'personal'
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (params?.tab === 'settings' || params?.section === 'settings') setActiveSectionModal('settings');
    else if (params?.tab === 'bookmarks' || params?.section === 'bookmarks') setActiveSectionModal('bookmarks');
  }, [params]);

  if (!currentSeekerProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-800">Job Seeker Profile Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">Please log in with a job seeker account to manage your profile.</p>
        </div>
      </div>
    );
  }

  const isProfileSetupFinished = isSeekerProfileComplete(currentUser, currentSeekerProfile);
  if (!isProfileSetupFinished || showSetupWizard) {
    return (
      <SeekerProfileSetupWizard
        onComplete={(view) => { setShowSetupWizard(false); onNavigate?.(view || 'seeker-dashboard'); }}
        onNavigate={(view) => { setShowSetupWizard(false); onNavigate?.(view); }}
      />
    );
  }

  // Profile Completeness
  const calculateCompleteness = () => {
    let score = 0;
    if (currentSeekerProfile.firstName && currentSeekerProfile.lastName) score += 15;
    if (currentSeekerProfile.contactNumber && currentSeekerProfile.municipality) score += 15;
    if (currentSeekerProfile.professionalSummary || currentSeekerProfile.summary) score += 15;
    if (currentSeekerProfile.education?.length) score += 20;
    if (currentSeekerProfile.workExperience?.length) score += 15;
    if (currentSeekerProfile.technicalSkills && currentSeekerProfile.technicalSkills.length >= 3) score += 10;
    if (currentSeekerProfile.resumes?.length) score += 10;
    return Math.min(score, 100);
  };
  const profileCompleteness = calculateCompleteness();

  // Match Readiness Criteria
  const validationCriteria = [
    {
      id: 'personal',
      label: 'Personal & Contact Details',
      detail: 'Complete name, contact phone, and municipality',
      isComplete: Boolean(currentSeekerProfile.firstName && currentSeekerProfile.lastName && currentSeekerProfile.contactNumber && currentSeekerProfile.municipality),
      action: () => { setActiveSectionModal('personal'); setPersonalTab('personal'); }
    },
    {
      id: 'education',
      label: 'Educational Attainment & Degree',
      detail: 'Degree or educational qualification recorded',
      isComplete: Boolean(currentSeekerProfile.educationalAttainment && (currentSeekerProfile.primaryDegree || currentSeekerProfile.education?.length)),
      action: () => { setActiveSectionModal('personal'); setPersonalTab('education'); }
    },
    {
      id: 'skills',
      label: 'Skills Inventory',
      detail: 'At least one technical or soft skill recorded',
      isComplete: Boolean(currentSeekerProfile.technicalSkills?.length || currentSeekerProfile.softSkills?.length),
      action: () => { setActiveSectionModal('personal'); setPersonalTab('skills'); }
    },
    {
      id: 'resume',
      label: 'Uploaded Resume (PDF or Image OCR)',
      detail: 'Active resume document uploaded & indexed',
      isComplete: Boolean(currentSeekerProfile.resumes?.length),
      action: () => setIsUploadModalOpen(true)
    },
    {
      id: 'preferences',
      label: 'Job Preferences',
      detail: 'Target job category & employment type configured',
      isComplete: Boolean(form.prefCategories.length > 0 && form.prefEmploymentTypes.length > 0),
      action: () => setActiveSectionModal('seekingStatus')
    }
  ];

  // Record CRUD Handlers
  const handleSaveEducation = (record: any, id?: string) => {
    let list = [...(currentSeekerProfile.education || [])];
    list = id ? list.map(item => item.id === id ? { ...item, ...record } : item) : [...list, { id: `edu-${Date.now()}`, ...record }];
    updateJobSeekerProfile(currentSeekerProfile.id, {
      education: list,
      primaryDegree: list[0]?.degreeCourse || currentSeekerProfile.primaryDegree,
      educationalAttainment: list[0]?.educationalAttainment || currentSeekerProfile.educationalAttainment
    });
    setIsEduModalOpen(false);
    showToast({ title: 'Education Saved', message: 'Educational qualification added.', type: 'success' });
  };

  const handleSaveExperience = (record: any, id?: string) => {
    let list = [...(currentSeekerProfile.workExperience || [])];
    list = id ? list.map(item => item.id === id ? { ...item, ...record } : item) : [...list, { id: `exp-${Date.now()}`, ...record }];
    updateJobSeekerProfile(currentSeekerProfile.id, { workExperience: list });
    setIsExpModalOpen(false);
    showToast({ title: 'Experience Saved', message: 'Work history updated.', type: 'success' });
  };

  const handleSaveCertification = (record: any, id?: string) => {
    let list = [...(currentSeekerProfile.certifications || [])];
    list = id ? list.map(item => item.id === id ? { ...item, ...record } : item) : [...list, { id: `cert-${Date.now()}`, ...record }];
    updateJobSeekerProfile(currentSeekerProfile.id, { certifications: list });
    setIsCertModalOpen(false);
    showToast({ title: 'Certificate Recorded', message: 'Certificate saved.', type: 'success' });
  };

  const handleOpenAtsAudit = (res: any) => {
    const atsResult = res.atsResult || evaluateResumeForAts({
      ...currentSeekerProfile,
      fileName: res.fileName,
      extractedSkills: res.extractedSkills || currentSeekerProfile.technicalSkills,
      extractedDegree: res.extractedDegree || currentSeekerProfile.primaryDegree,
      extractedEducation: res.extractedEducation || currentSeekerProfile.educationalAttainment,
      extractedExperienceYears: res.extractedExperienceYears
    });
    setSelectedAtsData({ resume: res, atsResult });
    setIsAtsModalOpen(true);
  };

  // Profile Display Strings (strictly from real user profile data — no pre-filled templates or dummy bios)
  const candidateFirstName = (currentSeekerProfile.firstName || form.firstName || '').trim();
  const candidateLastName = (currentSeekerProfile.lastName || form.lastName || '').trim();
  const rawMiddle = (currentSeekerProfile.middleName || form.middleName || (currentSeekerProfile as any).middleInitial || '').trim();
  const fullName = [
    candidateFirstName,
    rawMiddle ? `${rawMiddle[0].toUpperCase()}.` : '',
    candidateLastName
  ].filter(Boolean).join(' ').trim();
  const categoryHeadline = (
    currentSeekerProfile.primaryDegree ||
    currentSeekerProfile.jobTitle ||
    currentSeekerProfile.preferredJobTitle ||
    currentSeekerProfile.educationalAttainment ||
    ''
  ).toUpperCase();
  const phoneText = currentSeekerProfile.phone || currentSeekerProfile.contactNumber || '';
  const emailText = currentSeekerProfile.email || '';
  const locationText = [
    currentSeekerProfile.barangay ? `Brgy. ${currentSeekerProfile.barangay}` : '',
    currentSeekerProfile.cityMunicipality || currentSeekerProfile.municipality || '',
    currentSeekerProfile.province || (currentSeekerProfile.municipality ? 'Oriental Mindoro' : '')
  ].filter(Boolean).join(', ');
  const bioNarrative = (
    currentSeekerProfile.bio ||
    currentSeekerProfile.professionalSummary ||
    currentSeekerProfile.summary ||
    ''
  ).trim();

  const expertiseList = [
    ...(currentSeekerProfile.technicalSkills || []),
    ...(currentSeekerProfile.softSkills || [])
  ].filter((v, i, a) => Boolean(v && v.trim()) && a.indexOf(v) === i);
  const displayedExpertise = expertiseList;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body pb-28 md:pb-12 select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-28 md:pb-12 space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-1">
          <button
            onClick={() => onNavigate?.('seeker-dashboard')}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Back to Dashboard"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-center">Profile</h1>
          <button
            onClick={() => setActiveSectionModal('personal')}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* 1. Profile Header Card */}
        <SeekerProfileHeader
          fullName={fullName}
          categoryHeadline={categoryHeadline}
          displayFirstName={candidateFirstName}
          bioNarrative={bioNarrative}
          displayedExpertise={displayedExpertise}
          phoneText={phoneText}
          emailText={emailText}
          locationText={locationText}
          profilePicture={form.profilePicture}
          onAvatarUpload={form.handleAvatarFileUpload}
          onRemovePhoto={() => { form.setProfilePicture(''); updateJobSeekerProfile(currentSeekerProfile.id, { profilePicture: '' }); }}
          onEditInfo={() => setActiveSectionModal('personal')}
        />

        {/* 2. Career Tools & Actions Grid */}
        <SeekerCareerToolsGrid
          profileCompleteness={profileCompleteness}
          onOpenResumeBuilder={() => setIsResumeBuilderOpen(true)}
          onOpenResumeUpload={() => setIsUploadModalOpen(true)}
          onOpenPDFExport={() => setIsPDFModalOpen(true)}
          onOpenSettings={() => setActiveSectionModal('settings')}
          onOpenEditPersonalInfo={() => setActiveSectionModal('personal')}
          onRunAtsAudit={() => currentSeekerProfile.resumes?.length ? handleOpenAtsAudit(currentSeekerProfile.resumes[0]) : setIsUploadModalOpen(true)}
          onViewFullProfile={() => setActiveSectionModal('viewProfile')}
        />

        {/* 3. Floating Bottom Navigation Bar */}
        <SeekerBottomNav onNavigate={onNavigate} onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      </div>

      {/* ================= MODAL ORCHESTRATION ================= */}
      <SeekerPersonalInfoModal
        isOpen={activeSectionModal === 'personal'}
        onClose={() => setActiveSectionModal(null)}
        activeTab={personalTab}
        onTabChange={setPersonalTab}
        saveSuccessMsg={saveSuccessMsg}
        bioProps={{
          firstName: form.firstName, setFirstName: form.setFirstName,
          middleName: form.middleName, setMiddleName: form.setMiddleName,
          lastName: form.lastName, setLastName: form.setLastName,
          dateOfBirth: form.dateOfBirth, setDateOfBirth: form.setDateOfBirth,
          age: form.age, setAge: form.setAge,
          civilStatus: form.civilStatus, setCivilStatus: form.setCivilStatus,
          sex: form.sex, setSex: form.setSex,
          barangay: form.barangay, setBarangay: form.setBarangay,
          municipality: form.municipality, setMunicipality: form.setMunicipality,
          address: form.address, setAddress: form.setAddress,
          contactNumber: form.contactNumber, setContactNumber: form.setContactNumber,
          primaryDegree: form.primaryDegree, setPrimaryDegree: form.setPrimaryDegree,
          summary: form.summary, setSummary: form.setSummary,
          profilePicture: form.profilePicture, setProfilePicture: form.setProfilePicture,
          onAvatarUpload: form.handleAvatarFileUpload,
          onRemoveAvatar: () => { form.setProfilePicture(''); updateJobSeekerProfile(currentSeekerProfile.id, { profilePicture: '' }); },
          onSubmit: (e) => {
            e.preventDefault();
            form.handleSavePersonalInfo();
            setSaveSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSaveSuccessMsg(''), 3500);
          }
        }}
        educationList={currentSeekerProfile.education || []}
        onOpenAddEdu={() => { setEditingEdu(null); setIsEduModalOpen(true); }}
        onOpenEditEdu={(edu) => { setEditingEdu(edu); setIsEduModalOpen(true); }}
        onDeleteEdu={(id) => updateJobSeekerProfile(currentSeekerProfile.id, { education: (currentSeekerProfile.education || []).filter(e => e.id !== id) })}
        experienceList={currentSeekerProfile.workExperience || []}
        onOpenAddExp={() => { setEditingExp(null); setIsExpModalOpen(true); }}
        onOpenEditExp={(exp) => { setEditingExp(exp); setIsExpModalOpen(true); }}
        onDeleteExp={(id) => updateJobSeekerProfile(currentSeekerProfile.id, { workExperience: (currentSeekerProfile.workExperience || []).filter(e => e.id !== id) })}
        technicalSkills={currentSeekerProfile.technicalSkills || []}
        softSkills={currentSeekerProfile.softSkills || []}
        onAddTechnicalSkill={(skill) => {
          if (skill && !(currentSeekerProfile.technicalSkills || []).includes(skill)) {
            updateJobSeekerProfile(currentSeekerProfile.id, { technicalSkills: [...(currentSeekerProfile.technicalSkills || []), skill] });
          }
        }}
        onRemoveTechnicalSkill={(skill) => updateJobSeekerProfile(currentSeekerProfile.id, { technicalSkills: (currentSeekerProfile.technicalSkills || []).filter(s => s !== skill) })}
        onRemoveSoftSkill={(skill) => updateJobSeekerProfile(currentSeekerProfile.id, { softSkills: (currentSeekerProfile.softSkills || []).filter(s => s !== skill) })}
        certificationsList={currentSeekerProfile.certifications || []}
        onOpenAddCert={() => { setEditingCert(null); setIsCertModalOpen(true); }}
        onOpenEditCert={(cert) => { setEditingCert(cert); setIsCertModalOpen(true); }}
        onPreviewProof={setPreviewCertProof}
        resumesList={currentSeekerProfile.resumes || []}
        activeResumeId={currentSeekerProfile.resumes?.find(r => r.isDefault)?.id}
        onOpenResumeBuilder={() => setIsResumeBuilderOpen(true)}
        onOpenUploadCV={() => setIsUploadModalOpen(true)}
        onOpenAtsAudit={handleOpenAtsAudit}
        onSetActiveResume={(resId) => updateJobSeekerProfile(currentSeekerProfile.id, {
          resumes: (currentSeekerProfile.resumes || []).map(r => ({ ...r, isDefault: r.id === resId }))
        })}
      />

      {/* Analytics & Readiness Modal */}
      <SeekerMatchReadinessModal
        isOpen={activeSectionModal === 'analytics'}
        onClose={() => setActiveSectionModal(null)}
        profileCompleteness={profileCompleteness}
        validationCriteria={validationCriteria}
      />

      {/* Job Preferences Modal */}
      <SeekerJobPreferencesModal
        isOpen={activeSectionModal === 'seekingStatus'}
        onClose={() => setActiveSectionModal(null)}
        availability={seekingAvailability}
        onAvailabilityChange={setSeekingAvailability}
        categories={form.prefCategories}
        onCategoriesChange={form.setPrefCategories}
        minSalary={form.prefMinSalary}
        onMinSalaryChange={form.setPrefMinSalary}
        onSave={() => { form.handleSavePreferences(); setActiveSectionModal(null); }}
      />

      {/* Full Profile Overview Modal */}
      <SeekerFullProfileOverviewModal
        isOpen={activeSectionModal === 'viewProfile'}
        onClose={() => setActiveSectionModal(null)}
        seekerProfile={currentSeekerProfile}
        profilePicture={form.profilePicture}
        onEditContact={() => setIsContactModalOpen(true)}
        onEditAboutMe={() => setIsAboutMeModalOpen(true)}
        onAddExperience={() => { setEditingExp(null); setIsExpModalOpen(true); }}
        onEditExperience={(exp) => { setEditingExp(exp); setIsExpModalOpen(true); }}
        onAddEducation={() => { setEditingEdu(null); setIsEduModalOpen(true); }}
        onEditEducation={(edu) => { setEditingEdu(edu); setIsEduModalOpen(true); }}
        onManageProjects={() => setIsProjectsModalOpen(true)}
        onManageVolunteer={() => setIsVolunteerModalOpen(true)}
        onManageAwards={() => setIsAwardsModalOpen(true)}
        onEditSkills={() => setIsSkillsModalOpen(true)}
        onRemoveSkill={(s) => updateJobSeekerProfile(currentSeekerProfile.id, { technicalSkills: (currentSeekerProfile.technicalSkills || []).filter(item => item !== s) })}
        onUploadResume={() => setIsUploadModalOpen(true)}
        onEditDetails={() => { setActiveSectionModal('personal'); setPersonalTab('personal'); }}
      />

      {/* Record CRUD Modals */}
      <EducationModal isOpen={isEduModalOpen} onClose={() => setIsEduModalOpen(false)} initialRecord={editingEdu} onSave={handleSaveEducation} />
      <ExperienceModal isOpen={isExpModalOpen} onClose={() => setIsExpModalOpen(false)} initialRecord={editingExp} onSave={handleSaveExperience} />
      <CertificationModal isOpen={isCertModalOpen} onClose={() => setIsCertModalOpen(false)} initialRecord={editingCert} onSave={handleSaveCertification} />
      <CertificateLightbox proof={previewCertProof} onClose={() => setPreviewCertProof(null)} />

      {/* Utility Modals */}
      <SeekerLanguageModal isOpen={activeSectionModal === 'language'} onClose={() => setActiveSectionModal(null)} selectedLanguage={selectedLanguage} onSelectLanguage={setSelectedLanguage} />
      <SeekerHelpModal isOpen={activeSectionModal === 'help'} onClose={() => setActiveSectionModal(null)} />
      <SeekerPrivacyModal isOpen={activeSectionModal === 'privacy'} onClose={() => setActiveSectionModal(null)} />
      <SeekerInviteModal isOpen={activeSectionModal === 'invite'} onClose={() => setActiveSectionModal(null)} />

      {/* External Modals */}
      {isUploadModalOpen && <ResumeUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSuccess={() => {}} />}
      {isPDFModalOpen && <ResumePDFExportModal isOpen={isPDFModalOpen} onClose={() => setIsPDFModalOpen(false)} profile={currentSeekerProfile} />}
      {isResumeBuilderOpen && <ResumeBuilderModal isOpen={isResumeBuilderOpen} onClose={() => setIsResumeBuilderOpen(false)} onSaved={() => {}} />}
      {isAtsModalOpen && selectedAtsData && (
        <AtsResumeModal
          isOpen={isAtsModalOpen}
          onClose={() => { setIsAtsModalOpen(false); setSelectedAtsData(null); }}
          resume={selectedAtsData.resume}
          atsResult={selectedAtsData.atsResult}
          onUpdateResume={() => {}}
        />
      )}
      {activeSectionModal === 'settings' && <SettingsModal isOpen={true} onClose={() => setActiveSectionModal(null)} />}
      {activeSectionModal === 'bookmarks' && (
        <SeekerBookmarksModal
          isOpen={true}
          onClose={() => setActiveSectionModal(null)}
          bookmarkedJobIds={bookmarkedJobIds || []}
          onNavigate={(view, p) => { setActiveSectionModal(null); onNavigate?.(view, p); }}
        />
      )}

      {/* Modular Profile Modals */}
      <ContactInfoModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} seeker={currentSeekerProfile} />
      <AboutMeModal isOpen={isAboutMeModalOpen} onClose={() => setIsAboutMeModalOpen(false)} seeker={currentSeekerProfile} />
      <ProjectsModal isOpen={isProjectsModalOpen} onClose={() => setIsProjectsModalOpen(false)} seeker={currentSeekerProfile} />
      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} seeker={currentSeekerProfile} />
      <AwardsModal isOpen={isAwardsModalOpen} onClose={() => setIsAwardsModalOpen(false)} seeker={currentSeekerProfile} />
      <SkillsModal isOpen={isSkillsModalOpen} onClose={() => setIsSkillsModalOpen(false)} seeker={currentSeekerProfile} />
    </div>
  );
};
