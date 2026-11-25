import React, { useRef } from 'react';
import {
  User,
  Camera,
  Upload,
  Calendar,
  GraduationCap,
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
import { AVATAR_PRESETS, toDateInputValue } from './wizardConstants';

export interface WizardStepPersonalEducationProps {
  profilePicture: string;
  setProfilePicture: (val: string) => void;
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
  onBack: () => void;
  onNext: () => void;
}

export const WizardStepPersonalEducation: React.FC<WizardStepPersonalEducationProps> = ({
  profilePicture,
  setProfilePicture,
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
  onBack,
  onNext,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
          <span>Personal & Contact Information</span>
        </div>

        {/* Profile Picture Uploader */}
        <div className="bg-[var(--color-paper-warm)] p-4 rounded-2xl border border-[var(--color-rule)]">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full bg-[var(--color-paper)] text-[var(--color-ink)] flex items-center justify-center overflow-hidden border-2 border-[var(--color-rule)] shadow-inner">
                {profilePicture ? (
                  <img src={profilePicture} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-[var(--color-ink-muted)]" aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h4 className="text-xs font-bold text-[var(--color-ink)] flex items-center justify-center sm:justify-start gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Profile Photo / 2x2 ID Picture</span>
              </h4>
              <p className="text-[11px] text-[var(--color-ink-muted)]">Upload your professional photo or pick an avatar to personalize your profile</p>

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
                  <span>Upload Photo</span>
                </button>
                {profilePicture && (
                  <button
                    type="button"
                    onClick={() => setProfilePicture('')}
                    className="btn btn--quiet px-3 py-1.5 rounded-xl font-medium text-xs border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Avatar Presets */}
          <div className="mt-3 pt-3 border-t border-[var(--color-rule)]">
            <p className="text-[11px] font-medium text-[var(--color-ink-muted)] mb-2">Or choose an avatar preset:</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setProfilePicture(preset.url)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50 ${
                    profilePicture === preset.url
                      ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                      : 'bg-[var(--color-paper)] border-[var(--color-rule)] hover:border-[var(--color-ink-muted)] text-[var(--color-ink-muted)]'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded-full object-cover" />
                  <span>{preset.label}</span>
                </button>
              ))}
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
              onChange={e => setFirstName(e.target.value)}
              placeholder="e.g. Maria Jade"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
            />
            <span className="text-[10px] text-[var(--color-ink-muted)]">Supports 2 or more names (e.g. Maria Jade)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
              Middle Name or Initial
            </label>
            <input
              type="text"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              placeholder="e.g. Ramos or R."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="e.g. Santos"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
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
              value={normalizeCivilStatus(civilStatus)}
              onChange={e => setCivilStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
            >
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
              onChange={e => setAddress(e.target.value)}
              placeholder="House/Lot No., Street, Barangay, Municipality, Province"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
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
              value={normalizeEducationalAttainment(educationalAttainment, primaryDegree)}
              onChange={e => setEducationalAttainment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
            >
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
              onChange={e => setPrimaryDegree(e.target.value)}
              placeholder="e.g. Bachelor of Science in Computer Science, BSIT, BSBA"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
            />
            <span className="text-[10px] text-[var(--color-ink-muted)]">Accurately preserved without defaulting to general IT</span>
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
              onChange={e => setSchool(e.target.value)}
              placeholder="e.g. John Paul College, Mindoro State University, EMC"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
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
