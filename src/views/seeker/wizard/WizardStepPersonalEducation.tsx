import React, { useRef, useState } from 'react';
import {
  User,
  Camera,
  Upload,
  Calendar,
  GraduationCap,
  Briefcase,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  normalizeCivilStatus,
  normalizeEducationalAttainment,
  normalizeBarangay,
  computeAgeFromDob,
} from '../../../utils/resumeExtractorCore';
import { ROXAS_BARANGAYS } from '../../../constants';
import { toDateInputValue } from './wizardConstants';

export interface WizardStepPersonalEducationProps {
  profilePicture: string;
  setProfilePicture: (val: string) => void;
  photoSkippedForNow?: boolean;
  setPhotoSkippedForNow?: (val: boolean) => void;
  onAvatarFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  middleName: string;
  setMiddleName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (val: string) => void;
  age: string;
  setAge: (val: string) => void;
  civilStatus: string;
  setCivilStatus: (val: string) => void;
  sex: string;
  setSex: (val: string) => void;
  contactNumber: string;
  setContactNumber: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  barangay: string;
  setBarangay: (val: string) => void;
  educationalAttainment: string;
  setEducationalAttainment: (val: string) => void;
  primaryDegree: string;
  setPrimaryDegree: (val: string) => void;
  school: string;
  setSchool: (val: string) => void;
  yearGraduated: string;
  setYearGraduated: (val: string) => void;
  professionalSummary?: string;
  setProfessionalSummary?: (val: string) => void;
  workExperience?: any[];
  setWorkExperience?: React.Dispatch<React.SetStateAction<any[]>>;
  onBack: () => void;
  onNext: () => void;
}

export const WizardStepPersonalEducation: React.FC<WizardStepPersonalEducationProps> = ({
  profilePicture,
  setProfilePicture,
  photoSkippedForNow = false,
  setPhotoSkippedForNow,
  onAvatarFileUpload,
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  dateOfBirth,
  setDateOfBirth,
  age,
  setAge,
  civilStatus,
  setCivilStatus,
  sex,
  setSex,
  contactNumber,
  setContactNumber,
  email,
  setEmail,
  address,
  setAddress,
  barangay,
  setBarangay,
  educationalAttainment,
  setEducationalAttainment,
  primaryDegree,
  setPrimaryDegree,
  school,
  setSchool,
  yearGraduated,
  setYearGraduated,
  professionalSummary = '',
  setProfessionalSummary,
  workExperience = [],
  setWorkExperience,
  onBack,
  onNext,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpPosition, setNewExpPosition] = useState('');
  const [newExpYears, setNewExpYears] = useState('1');
  const [newExpResponsibilities, setNewExpResponsibilities] = useState('');

  return (
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
          <span>Personal &amp; Contact Information</span>
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
                Upload your own profile picture or 2x2 ID photo. If you don&apos;t have a photo ready, click &ldquo;Skip for now / Continue later&rdquo; — your profile picture space will remain completely blank until you upload one in Profile Settings.
              </p>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarFileUpload}
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
                      setPhotoSkippedForNow?.(true);
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
                      setPhotoSkippedForNow?.(false);
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
          <span>Educational Attainment &amp; Degree</span>
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

      {/* Section 3: Work Experience & Professional Summary */}
      {setProfessionalSummary && setWorkExperience && (
        <div className="space-y-4 pt-4 border-t border-[var(--color-rule)]">
          <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] font-display">
              <Briefcase className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
              <span>Work Experience &amp; Professional Summary</span>
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
                      position: newExpPosition.trim() || 'STAFF',
                      company: newExpCompany.trim() || 'PREVIOUS EMPLOYER',
                      yearsOfExperience: Number(newExpYears) || 1,
                      startDate: String(new Date().getFullYear() - (Number(newExpYears) || 1)),
                      endDate: 'Present',
                      isCurrent: false,
                      responsibilities: newExpResponsibilities.trim() || 'RELEVANT PROFESSIONAL WORK EXPERIENCE.',
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
      )}

      {/* Navigation Controls for Step 2 */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Resume Upload</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <span>Proceed to Skills Inventory</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
};
