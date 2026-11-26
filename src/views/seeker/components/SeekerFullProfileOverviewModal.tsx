import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit2,
  Briefcase,
  Plus,
  GraduationCap,
  Layers,
  HeartHandshake,
  Award,
  Sparkles,
  Upload
} from 'lucide-react';

export interface SeekerFullProfileOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  seekerProfile: any;
  profilePicture?: string;
  onEditContact: () => void;
  onEditAboutMe: () => void;
  onAddExperience: () => void;
  onEditExperience: (exp: any) => void;
  onAddEducation: () => void;
  onEditEducation: (edu: any) => void;
  onManageProjects: () => void;
  onManageVolunteer: () => void;
  onManageAwards: () => void;
  onEditSkills: () => void;
  onRemoveSkill: (skill: string) => void;
  onUploadResume: () => void;
  onEditDetails: () => void;
}

export const SeekerFullProfileOverviewModal: React.FC<SeekerFullProfileOverviewModalProps> = ({
  isOpen,
  onClose,
  seekerProfile,
  profilePicture,
  onEditContact,
  onEditAboutMe,
  onAddExperience,
  onEditExperience,
  onAddEducation,
  onEditEducation,
  onManageProjects,
  onManageVolunteer,
  onManageAwards,
  onEditSkills,
  onRemoveSkill,
  onUploadResume,
  onEditDetails
}) => {
  if (!isOpen || !seekerProfile) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {seekerProfile.firstName} {seekerProfile.lastName}
              </h3>
              <p className="text-xs text-slate-400">
                {seekerProfile.primaryDegree || 'Job Seeker'} • {seekerProfile.municipality || 'Roxas'}, Oriental Mindoro
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* 1. Contact Information Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Contact Info</span>
              </h5>
              <button
                type="button"
                onClick={onEditContact}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{seekerProfile.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{seekerProfile.contactNumber || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {seekerProfile.address || `${seekerProfile.municipality || 'Roxas'}, Oriental Mindoro`}
                </span>
              </div>
              {seekerProfile.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a
                    href={seekerProfile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {seekerProfile.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 2. About Me */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>About Me</span>
              </h5>
              <button
                type="button"
                onClick={onEditAboutMe}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {seekerProfile.professionalSummary ||
                seekerProfile.summary ||
                'Add a concise summary highlighting your core skills, experiences, and career goals in Oriental Mindoro.'}
            </p>
          </div>

          {/* 3. Work Experience */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Work Experience ({(seekerProfile.workExperience || []).length})</span>
              </h5>
              <button
                type="button"
                onClick={onAddExperience}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            {(seekerProfile.workExperience || []).length === 0 ? (
              <p className="text-slate-400 italic">No work experience recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {(seekerProfile.workExperience || []).map((exp: any) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{exp.position}</p>
                      <p className="text-slate-500 text-[11px]">
                        {exp.company} • {exp.startDate} - {exp.endDate || (exp.isCurrent ? 'Present' : '')}
                      </p>
                      {exp.responsibilities && (
                        <p className="text-slate-600 text-[11px] mt-1 leading-snug">{exp.responsibilities}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditExperience(exp)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Education */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Education ({(seekerProfile.education || []).length})</span>
              </h5>
              <button
                type="button"
                onClick={onAddEducation}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            {(seekerProfile.education || []).length === 0 ? (
              <p className="text-slate-400 italic">No educational records added yet.</p>
            ) : (
              <div className="space-y-2">
                {(seekerProfile.education || []).map((edu: any) => (
                  <div
                    key={edu.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{edu.degreeCourse || edu.degree}</p>
                      <p className="text-slate-500 text-[11px]">
                        {edu.school} • Graduated {edu.yearGraduated}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditEducation(edu)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Projects */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Projects & Portfolio ({(seekerProfile.projects || []).length})</span>
              </h5>
              <button
                type="button"
                onClick={onManageProjects}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Manage</span>
              </button>
            </div>
            {(seekerProfile.projects || []).length === 0 ? (
              <p className="text-slate-400 italic">No portfolio projects listed yet.</p>
            ) : (
              <div className="space-y-2">
                {(seekerProfile.projects || []).map((proj: any) => (
                  <div key={proj.id} className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{proj.name}</p>
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 text-[10px] font-bold hover:underline"
                        >
                          Visit
                        </a>
                      )}
                    </div>
                    {proj.client && <p className="text-slate-500 text-[11px]">{proj.client}</p>}
                    {proj.description && <p className="text-slate-600 text-[11px] mt-1">{proj.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Volunteer Experience */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
                <span>Volunteer Experience ({(seekerProfile.volunteerExperience || []).length})</span>
              </h5>
              <button
                type="button"
                onClick={onManageVolunteer}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Manage</span>
              </button>
            </div>
            {(seekerProfile.volunteerExperience || []).length === 0 ? (
              <p className="text-slate-400 italic">No volunteer initiatives added yet.</p>
            ) : (
              <div className="space-y-2">
                {(seekerProfile.volunteerExperience || []).map((vol: any) => (
                  <div key={vol.id} className="p-3 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">{vol.role}</p>
                    <p className="text-slate-500 text-[11px]">{vol.organization}</p>
                    {vol.description && <p className="text-slate-600 text-[11px] mt-1">{vol.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Awards & Achievements */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Awards & Achievements ({(seekerProfile.awards || []).length})</span>
              </h5>
              <button
                type="button"
                onClick={onManageAwards}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Manage</span>
              </button>
            </div>
            {(seekerProfile.awards || []).length === 0 ? (
              <p className="text-slate-400 italic">No awards listed yet.</p>
            ) : (
              <div className="space-y-2">
                {(seekerProfile.awards || []).map((award: any) => (
                  <div key={award.id} className="p-3 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">{award.title}</p>
                    <p className="text-slate-500 text-[11px]">
                      {award.organization} • {award.dateAwarded}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 8. Skills Inventory */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Skills ({(seekerProfile.technicalSkills || []).length})</span>
              </h5>
              <button
                type="button"
                onClick={onEditSkills}
                className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Edit Skills</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(seekerProfile.technicalSkills || []).map((s: string) => (
                <span
                  key={s}
                  className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(s)}
                    className="text-blue-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadResume();
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Replace Resume</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditDetails();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Edit Profile Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
