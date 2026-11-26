import React, { useRef } from 'react';
import { Camera, Edit2, Linkedin, Instagram } from 'lucide-react';

export interface SeekerProfileHeaderProps {
  fullName: string;
  categoryHeadline: string;
  displayFirstName: string;
  bioNarrative: string;
  displayedExpertise: string[];
  phoneText: string;
  emailText: string;
  locationText: string;
  profilePicture?: string;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onEditInfo: () => void;
}

export const SeekerProfileHeader: React.FC<SeekerProfileHeaderProps> = ({
  fullName,
  categoryHeadline,
  displayFirstName,
  bioNarrative,
  displayedExpertise,
  phoneText,
  emailText,
  locationText,
  profilePicture,
  onAvatarUpload,
  onRemovePhoto,
  onEditInfo
}) => {
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80">
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        onChange={onAvatarUpload}
        className="hidden"
        aria-label="Upload Profile Photo"
      />

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
        {/* Left Column: Portrait Profile Picture Area (Blank Fallback State when no photo uploaded) */}
        <div className="w-56 sm:w-64 flex flex-col items-center shrink-0">
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative shadow-xs border border-slate-200 bg-slate-50 flex items-center justify-center group">
            {profilePicture ? (
              <>
                <img
                  src={profilePicture}
                  alt={fullName || 'Profile Photo'}
                  className="w-full h-full object-cover"
                />
                <div
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Change Photo</span>
                </div>
              </>
            ) : (
              <div
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-full h-full border-2 border-dashed border-slate-300 rounded-2xl bg-white cursor-pointer hover:border-blue-500 transition-colors"
                title="Click to upload your profile picture"
              />
            )}
          </div>

          {/* Action Button: Add or Change Profile Picture */}
          {profilePicture ? (
            <div className="w-full mt-3 space-y-1.5 text-center">
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Change Profile Picture</span>
              </button>
              <button
                type="button"
                onClick={onRemovePhoto}
                className="text-[11px] text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                Remove Photo (Leave Blank)
              </button>
            </div>
          ) : (
            <div className="w-full mt-3">
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Upload Profile Picture</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Personal Information */}
        <div className="flex-1 min-w-0 w-full text-left">
          {/* Full Name */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                {fullName || 'Unconfigured Profile'}
              </h2>
              {categoryHeadline && (
                <p className="text-sm font-medium text-slate-600 mb-3">
                  {categoryHeadline}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onEditInfo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Info</span>
            </button>
          </div>

          <hr className="my-5 border-slate-200" />

          {/* Bio Narrative */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Professional Summary:</h3>
            {bioNarrative ? (
              <p className="text-slate-600 text-sm leading-relaxed font-normal whitespace-pre-line">
                {bioNarrative}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No professional summary added yet. Click "Edit Info" to write your bio or upload your resume to auto-fill.
              </p>
            )}
          </div>

          {/* Areas of Expertise */}
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Skills & Competencies:</h3>
            {displayedExpertise.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {displayedExpertise.map((exp, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                    {exp}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No skills listed yet. Click "Edit Info" to add your technical or trade skills.
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="mt-5 space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Contact Information:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong className="text-slate-800 font-semibold">Phone:</strong> {phoneText || 'Not provided'}</li>
              <li><strong className="text-slate-800 font-semibold">Email:</strong> {emailText || 'Not provided'}</li>
              <li><strong className="text-slate-800 font-semibold">Location:</strong> {locationText || 'Not provided'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
