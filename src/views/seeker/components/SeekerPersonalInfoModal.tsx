import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  FileText,
  CheckCircle2
} from 'lucide-react';
import {
  BioPersonalSection,
  BioPersonalSectionProps
} from './sections/BioPersonalSection';
import { EducationSection } from './sections/EducationSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { SkillsSection } from './sections/SkillsSection';
import { CertificationsSection } from './sections/CertificationsSection';
import { ResumesSection } from './sections/ResumesSection';

export type PersonalTabType =
  | 'personal'
  | 'education'
  | 'experience'
  | 'skills'
  | 'certifications'
  | 'resumes';

export interface SeekerPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: PersonalTabType;
  onTabChange?: (tab: PersonalTabType) => void;
  saveSuccessMsg?: string;

  // Bio Props
  bioProps: BioPersonalSectionProps;

  // Education Props
  educationList: any[];
  onOpenAddEdu: () => void;
  onOpenEditEdu: (record: any) => void;
  onDeleteEdu: (id: string) => void;

  // Experience Props
  experienceList: any[];
  onOpenAddExp: () => void;
  onOpenEditExp: (record: any) => void;
  onDeleteExp: (id: string) => void;

  // Skills Props
  technicalSkills?: string[];
  softSkills?: string[];
  onAddTechnicalSkill: (skill: string) => void;
  onRemoveTechnicalSkill: (skill: string) => void;
  onRemoveSoftSkill: (skill: string) => void;

  // Certifications Props
  certificationsList: any[];
  onOpenAddCert: () => void;
  onOpenEditCert: (record: any) => void;
  onPreviewProof: (proof: { name: string; url: string; issuer: string; date?: string }) => void;

  // Resumes Props
  resumesList: any[];
  activeResumeId?: string;
  onOpenResumeBuilder: () => void;
  onOpenUploadCV: () => void;
  onOpenAtsAudit: (resume: any) => void;
  onSetActiveResume: (resumeId: string) => void;
}

export const SeekerPersonalInfoModal: React.FC<SeekerPersonalInfoModalProps> = ({
  isOpen,
  onClose,
  activeTab: externalTab,
  onTabChange,
  saveSuccessMsg,
  bioProps,
  educationList,
  onOpenAddEdu,
  onOpenEditEdu,
  onDeleteEdu,
  experienceList,
  onOpenAddExp,
  onOpenEditExp,
  onDeleteExp,
  technicalSkills,
  softSkills,
  onAddTechnicalSkill,
  onRemoveTechnicalSkill,
  onRemoveSoftSkill,
  certificationsList,
  onOpenAddCert,
  onOpenEditCert,
  onPreviewProof,
  resumesList,
  activeResumeId,
  onOpenResumeBuilder,
  onOpenUploadCV,
  onOpenAtsAudit,
  onSetActiveResume
}) => {
  const [internalTab, setInternalTab] = useState<PersonalTabType>('personal');
  const activeTab = externalTab || internalTab;

  const handleTabClick = (tab: PersonalTabType) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Personal Information & Profile Records</h3>
              <p className="text-xs text-slate-400">Manage your bio, education, experience, skills, and certifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs for Personal Section */}
        <div className="px-4 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabClick('personal')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              activeTab === 'personal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Bio & Personal</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('education')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              activeTab === 'education' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Education ({educationList?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('experience')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              activeTab === 'experience' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work Experience ({experienceList?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('skills')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              activeTab === 'skills' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Skills</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('certifications')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              activeTab === 'certifications' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certifications ({certificationsList?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('resumes')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              activeTab === 'resumes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resumes & CVs ({resumesList?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {activeTab === 'personal' && <BioPersonalSection {...bioProps} />}
          {activeTab === 'education' && (
            <EducationSection
              educationList={educationList}
              onOpenAddEdu={onOpenAddEdu}
              onOpenEditEdu={onOpenEditEdu}
              onDeleteEdu={onDeleteEdu}
            />
          )}
          {activeTab === 'experience' && (
            <ExperienceSection
              experienceList={experienceList}
              onOpenAddExp={onOpenAddExp}
              onOpenEditExp={onOpenEditExp}
              onDeleteExp={onDeleteExp}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsSection
              technicalSkills={technicalSkills}
              softSkills={softSkills}
              onAddTechnicalSkill={onAddTechnicalSkill}
              onRemoveTechnicalSkill={onRemoveTechnicalSkill}
              onRemoveSoftSkill={onRemoveSoftSkill}
            />
          )}
          {activeTab === 'certifications' && (
            <CertificationsSection
              certificationsList={certificationsList}
              onOpenAddCert={onOpenAddCert}
              onOpenEditCert={onOpenEditCert}
              onPreviewProof={onPreviewProof}
            />
          )}
          {activeTab === 'resumes' && (
            <ResumesSection
              resumesList={resumesList}
              activeResumeId={activeResumeId}
              onOpenResumeBuilder={onOpenResumeBuilder}
              onOpenUploadCV={onOpenUploadCV}
              onOpenAtsAudit={onOpenAtsAudit}
              onSetActiveResume={onSetActiveResume}
            />
          )}
        </div>
      </div>
    </div>
  );
};
