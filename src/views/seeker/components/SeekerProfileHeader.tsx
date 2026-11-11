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
        {/* Left Column: Portrait Profile Picture Area */}
        <div className="w-56 sm:w-64 flex flex-col items-center shrink-0">
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative shadow-md border border-slate-200 bg-slate-50 flex items-center justify-center group">
            {profilePicture ? (
              <>
                <img
                  src={profilePicture}
                  alt={fullName}
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
                className="w-full h-full border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-colors group/box"
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 group-hover/box:bg-blue-50 flex items-center justify-center text-slate-400 group-hover/box:text-blue-600 transition-colors mb-3 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold text-slate-700 group-hover/box:text-blue-600">No Profile Picture</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click to add photo</p>
              </div>
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
                Remove Photo
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
                <span>Add Profile Picture</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Personal Information */}
        <div className="flex-1 min-w-0 w-full text-left">
          {/* Full Name */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
            {fullName}
          </h2>

          {/* Category / Profession Label */}
          <p className="text-sm font-medium text-slate-600 mb-3">
            {categoryHeadline}
          </p>

          {/* Social Icons & Edit Info Button */}
          <div className="flex items-center gap-2.5 mb-4">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="X (Twitter)"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onEditInfo}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Info</span>
            </button>
          </div>

          <hr className="my-5 border-slate-200" />

          {/* Bio Narrative */}
          <div className="text-slate-600 text-sm leading-relaxed space-y-3 font-normal">
            <p>{bioNarrative}</p>
          </div>

          {/* Areas of Expertise */}
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Areas of Expertise:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              {displayedExpertise.map((exp, idx) => (
                <li key={idx} className="leading-snug">{exp}</li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            Through personalized coaching sessions, structured workshops, and continuous guidance, {displayFirstName} guides clients to overcome organizational bottlenecks, secure funding, and drive sustainable growth.
          </p>

          {/* Contact Information */}
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Contact Information:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong className="text-slate-800 font-semibold">Phone:</strong> {phoneText}</li>
              <li><strong className="text-slate-800 font-semibold">Email:</strong> {emailText}</li>
              <li><strong className="text-slate-800 font-semibold">Location:</strong> {locationText}</li>
            </ul>
          </div>

          {/* Closing Advocacy Statement */}
          <p className="mt-5 text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
            {displayFirstName}'s ultimate goal is to foster resilient businesses and strong local communities. Whether launching a new venture or scaling operations, she is committed to guiding your journey every step of the way.
          </p>
        </div>
      </div>
    </div>
  );
};
