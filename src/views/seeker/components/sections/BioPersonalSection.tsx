import React, { useRef } from 'react';
import { Camera, Upload, User, Save } from 'lucide-react';
import { ORIENTAL_MINDORO_MUNICIPALITIES, ROXAS_BARANGAYS } from '../../../../constants';

export interface BioPersonalSectionProps {
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
  municipality: string;
  setMunicipality: (val: string) => void;
  barangay: string;
  setBarangay: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  primaryDegree: string;
  setPrimaryDegree: (val: string) => void;
  summary: string;
  setSummary: (val: string) => void;
  profilePicture: string;
  setProfilePicture: (val: string) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BioPersonalSection: React.FC<BioPersonalSectionProps> = ({
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
  municipality,
  setMunicipality,
  barangay,
  setBarangay,
  address,
  setAddress,
  primaryDegree,
  setPrimaryDegree,
  summary,
  setSummary,
  profilePicture,
  setProfilePicture,
  onAvatarUpload,
  onRemoveAvatar,
  onSubmit
}) => {
  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      {/* Profile Picture Uploader Card (Custom Photo Only — Blank Fallback State) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group/modalAvatar shrink-0">
            <div
              onClick={() => modalAvatarInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 cursor-pointer"
              title="Click to upload profile picture"
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : null}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom Profile Picture / 2x2 Photo</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Upload your own profile picture. If left empty, your profile picture space remains completely blank.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <input
                ref={modalAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarUpload}
              />
              <button
                type="button"
                onClick={() => modalAvatarInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{profilePicture ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {profilePicture && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  Remove (Leave Blank)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block font-bold text-slate-700 mb-1">First Name *</label>
          <input
            type="text"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Middle Name</label>
          <input
            type="text"
            value={middleName}
            onChange={e => setMiddleName(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={lastName}
            onChange={e => setLastName(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
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
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Civil Status</label>
          <select
            value={civilStatus}
            onChange={e => setCivilStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Sex / Gender</label>
          <select
            value={sex}
            onChange={e => setSex(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Contact Number *</label>
          <input
            type="text"
            required
            value={contactNumber}
            onChange={e => setContactNumber(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Municipality (Oriental Mindoro) *</label>
          <select
            value={municipality}
            onChange={e => setMunicipality(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {ORIENTAL_MINDORO_MUNICIPALITIES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Barangay</label>
          {municipality === 'Roxas' ? (
            <select
              value={barangay}
              onChange={e => setBarangay(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              onChange={e => setBarangay(e.target.value.toUpperCase())}
              placeholder="E.G. BARANGAY POBLACION"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Street Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value.toUpperCase())}
            placeholder="HOUSE NO., STREET, PUROK"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Professional Degree / Headline</label>
        <input
          type="text"
          value={primaryDegree}
          onChange={e => setPrimaryDegree(e.target.value.toUpperCase())}
          placeholder="E.G. BS INFORMATION TECHNOLOGY, TESDA CERTIFIED ELECTRICIAN"
          className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Professional Summary & Bio</label>
        <textarea
          rows={3}
          value={summary}
          onChange={e => setSummary(e.target.value.toUpperCase())}
          placeholder="BRIEF OVERVIEW OF YOUR QUALIFICATIONS, GOALS, AND BACKGROUND..."
          className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Personal Info</span>
        </button>
      </div>
    </form>
  );
};
