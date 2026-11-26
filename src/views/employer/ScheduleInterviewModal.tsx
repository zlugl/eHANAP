import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Interview } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Send,
  FileText,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface ScheduleInterviewModalProps {
  applicationId: string;
  existingInterview?: Interview | null;
  onClose: () => void;
}

const PREPARATION_SUGGESTIONS = [
  'BRING PRINTED RESUME AND VALID ID',
  'ARRIVE 15 MINUTES BEFORE SCHEDULE',
  'BRING COPIES OF CERTIFICATES / TRANSCRIPT',
  'TEST MICROPHONE AND CAMERA BEFORE JOINING',
];

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  applicationId,
  existingInterview,
  onClose,
}) => {
  const {
    applications,
    jobSeekers,
    jobPosts,
    currentEmployerProfile,
    employers,
    scheduleInterview,
    rescheduleInterview,
    showToast,
  } = useApp();

  const application = applications.find(a => a.id === applicationId);
  const seeker = application ? jobSeekers.find(s => s.id === application.jobSeekerId) : null;
  const job = application ? jobPosts.find(j => j.id === application.jobId) : null;
  const employerProfile =
    currentEmployerProfile ||
    (job ? employers.find(e => e.id === job.employerId) : null);

  const getDefaultEmployerVenue = () => {
    const parts = [
      employerProfile?.address,
      employerProfile?.barangay ? `BRGY. ${employerProfile.barangay}` : '',
      employerProfile?.municipality || job?.municipality,
      'ORIENTAL MINDORO',
    ]
      .filter(Boolean)
      .map(s => String(s).trim())
      .filter(Boolean);
    return parts.join(', ').toUpperCase();
  };

  const getDefaultEmployerPhone = () => {
    return employerProfile?.contactNumber || '';
  };

  // Start Date, Time, and Notes completely blank ("") on modal open unless rescheduling an existing interview
  const [date, setDate] = useState(existingInterview?.date || '');
  const [selectedSlot, setSelectedSlot] = useState(existingInterview?.time || '');
  const [customTime, setCustomTime] = useState(existingInterview?.time || '');
  const [isCustomSlot, setIsCustomSlot] = useState(false);
  const [mode, setMode] = useState<'video' | 'face_to_face' | 'phone'>(
    existingInterview?.interviewType || existingInterview?.format || 'video'
  );
  const [locationOrLink, setLocationOrLink] = useState(
    existingInterview?.locationOrLink || ''
  );
  const [notes, setNotes] = useState(
    (existingInterview?.instructions || existingInterview?.notes || '').toUpperCase()
  );
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Available Time Slot Presets
  const morningSlots = ['08:30 AM', '09:30 AM', '10:30 AM', '11:15 AM'];
  const afternoonSlots = ['01:30 PM', '02:30 PM', '03:45 PM', '04:30 PM'];

  if (!application || !seeker || !job) return null;

  const handleSelectPresetSlot = (slot: string) => {
    setSelectedSlot(slot);
    setIsCustomSlot(false);
    setFormError('');
  };

  const handleModeChange = (nextMode: 'video' | 'face_to_face' | 'phone') => {
    setMode(nextMode);
    setFormError('');
    if (nextMode === 'video') {
      setLocationOrLink('');
    } else if (nextMode === 'face_to_face') {
      setLocationOrLink(getDefaultEmployerVenue());
    } else if (nextMode === 'phone') {
      setLocationOrLink(getDefaultEmployerPhone());
    }
  };

  const handleAppendSuggestion = (chipText: string) => {
    const upperChip = chipText.toUpperCase();
    setNotes(prev => {
      const current = prev.trim();
      if (!current) return upperChip;
      if (current.includes(upperChip)) return current;
      return `${current}\n• ${upperChip}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalTime = (isCustomSlot ? customTime : selectedSlot).trim();
    if (!date.trim()) {
      setFormError('Please select an interview date.');
      return;
    }
    if (!finalTime) {
      setFormError('Please select or enter an interview time.');
      return;
    }
    if (!locationOrLink.trim()) {
      setFormError(
        mode === 'video'
          ? 'Please paste your Google Meet or Zoom link.'
          : mode === 'face_to_face'
          ? 'Please enter the on-site interview venue / address.'
          : 'Please enter the contact phone number for the interview.'
      );
      return;
    }

    const formattedLocationOrLink =
      mode === 'face_to_face'
        ? locationOrLink.trim().toUpperCase()
        : locationOrLink.trim();
    const formattedNotes = notes.trim().toUpperCase();
    const applicantFullName = `${seeker.firstName} ${seeker.lastName}`.trim().toUpperCase();

    if (existingInterview) {
      const res = rescheduleInterview(existingInterview.id, {
        date: date.trim(),
        time: finalTime,
        interviewType: mode,
        locationOrLink: formattedLocationOrLink,
        instructions: formattedNotes,
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setIsSuccess(true);
      showToast({
        title: '📅 Interview Rescheduled & Saved to Calendar',
        message: `Updated schedule for ${applicantFullName} on ${date} at ${finalTime}.`,
        type: 'success',
      });
      setTimeout(() => {
        onClose();
      }, 1500);
      return;
    }

    const result = scheduleInterview({
      applicationId: application.id,
      jobId: job.id,
      vacancyId: job.id,
      jobTitle: job.title,
      employerId: job.employerId,
      companyName: job.companyName.toUpperCase(),
      jobSeekerId: seeker.id,
      seekerId: seeker.id,
      applicantName: applicantFullName,
      interviewType: mode,
      format: mode,
      date: date.trim(),
      time: finalTime,
      locationOrLink: formattedLocationOrLink,
      instructions: formattedNotes,
      notes: formattedNotes,
      contactPerson: (employerProfile?.representativeName || job.companyName).toUpperCase(),
    });

    if (result.success) {
      setIsSuccess(true);
      showToast({
        title: '📅 Interview Saved to Built-In Calendar',
        message: `Interview scheduled with ${applicantFullName} for ${date} at ${finalTime}.`,
        type: 'success',
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFormError(result.message);
    }
  };

  const seekerDisplayName = `${seeker.firstName} ${seeker.lastName}`.trim().toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-slate-200 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200 my-auto flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {existingInterview ? 'Reschedule Interview' : 'Schedule Interview'}
                </h3>
                <span className="text-[10px] bg-emerald-900 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Built-In Calendar Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{seekerDisplayName} • {job.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                {existingInterview ? 'Interview Rescheduled!' : 'Interview Saved to Calendar!'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The interview has been synchronized directly to both your Employer Calendar and <span className="font-semibold text-slate-700">{seekerDisplayName}</span>&apos;s Calendar tab with immediate in-app notifications.
              </p>
            </div>
          </div>
        ) : (
          /* Scheduling Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs">
                {formError}
              </div>
            )}

            {/* Candidate Match Pill */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-indigo-950">
              <div className="flex items-center gap-2.5">
                {seeker.profilePicture ? (
                  <img
                    src={seeker.profilePicture}
                    alt={seekerDisplayName}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-white border border-indigo-200 shrink-0" />
                )}
                <div>
                  <p className="font-bold uppercase">{seekerDisplayName} ({(seeker?.municipality || 'ORIENTAL MINDORO').toUpperCase()})</p>
                  <p className="text-[11px] text-indigo-700 uppercase">{(seeker?.primaryDegree || seeker?.educationalAttainment || 'QUALIFIED CANDIDATE').toUpperCase()}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[11px] rounded-xl shadow-2xs shrink-0 self-end sm:self-auto">
                {Math.round(application.matchResult?.overallMatch || application.matchScore || 85)}% Match
              </span>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Interview Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  setFormError('');
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Available Time Slots Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Select Interview Time <span className="text-rose-500">*</span></label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSlot(!isCustomSlot);
                    setFormError('');
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                >
                  {isCustomSlot ? 'Pick Standard Slots' : 'Enter Custom Time...'}
                </button>
              </div>

              {!isCustomSlot ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Morning slots</span>
                    <div className="grid grid-cols-4 gap-2">
                      {morningSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSelectPresetSlot(slot)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors ${
                            selectedSlot === slot && !isCustomSlot
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Afternoon slots</span>
                    <div className="grid grid-cols-4 gap-2">
                      {afternoonSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSelectPresetSlot(slot)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors ${
                            selectedSlot === slot && !isCustomSlot
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="time"
                    required
                    value={customTime}
                    onChange={e => {
                      setCustomTime(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Interview Format <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleModeChange('video')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-semibold transition-colors ${
                    mode === 'video' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Video className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] text-center">Online / Video (Meet / Zoom)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('face_to_face')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-semibold transition-colors ${
                    mode === 'face_to_face' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] text-center">On-Site / Office</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('phone')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-semibold transition-colors ${
                    mode === 'phone' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Phone className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] text-center">Phone Interview</span>
                </button>
              </div>
            </div>

            {/* Dynamic Location / Meeting URL / Contact Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {mode === 'video'
                  ? 'Online Meeting Link (Google Meet / Zoom / Teams)'
                  : mode === 'face_to_face'
                  ? 'On-Site Office Venue / Business Address (ALL CAPS)'
                  : 'Employer / Interview Contact Number'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={locationOrLink}
                onChange={e =>
                  setLocationOrLink(
                    mode === 'face_to_face' ? e.target.value.toUpperCase() : e.target.value
                  )
                }
                placeholder={
                  mode === 'video'
                    ? 'Paste your Google Meet or Zoom link here...'
                    : mode === 'face_to_face'
                    ? 'ENTER OFFICE VENUE OR BUSINESS ADDRESS...'
                    : 'Enter contact number for the phone interview...'
                }
                className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs ${
                  mode === 'video' ? 'font-mono' : mode === 'face_to_face' ? 'uppercase font-semibold' : 'font-semibold'
                }`}
              />
              {mode === 'face_to_face' && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Pre-filled from your registered business address. You can edit this venue if the interview takes place at another branch or office.
                </p>
              )}
              {mode === 'phone' && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Pre-filled from your registered employer contact number. Fully editable.
                </p>
              )}
            </div>

            {/* Instructions / Notes with Quick-Insert Suggestion Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  Candidate Preparation Notes &amp; Instructions (ALL CAPS)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">Auto-formatted in ALL CAPS</span>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value.toUpperCase())}
                placeholder="TYPE PREPARATION INSTRUCTIONS OR CLICK QUICK-INSERT CHIPS BELOW..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs uppercase"
              />
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick-Insert Instructions (Click to Append):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PREPARATION_SUGGESTIONS.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAppendSuggestion(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 text-[10px] font-bold transition-colors text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>{existingInterview ? 'Save Rescheduled Interview' : 'Confirm & Save to Calendar'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
