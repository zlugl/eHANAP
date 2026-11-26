import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Interview, InterviewType } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video, 
  MapPin, 
  Phone,
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Plus, 
  Send, 
  CalendarCheck,
  ExternalLink,
  FileText
} from 'lucide-react';

interface InterviewCalendarViewProps {
  userRole: 'employer' | 'job_seeker';
  onEditOrReschedule?: (interview: Interview) => void;
}

export const InterviewCalendarView: React.FC<InterviewCalendarViewProps> = ({
  userRole,
  onEditOrReschedule,
}) => {
  const { 
    currentEmployerProfile, 
    currentSeekerProfile, 
    interviews, 
    scheduleInterview, 
    rescheduleInterview,
    cancelInterview,
    respondToInterview,
    applications,
    jobPosts,
    jobSeekers
  } = useApp();

  const todayIso = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(todayIso);
  const [isProposingSlotModal, setIsProposingSlotModal] = useState(false);

  // Slot proposing form state for employers (strictly blank by default)
  const [selectedAppId, setSelectedAppId] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [slotMode, setSlotMode] = useState<InterviewType>('video');
  const [slotLocation, setSlotLocation] = useState('');
  const [slotInstructions, setSlotInstructions] = useState('');

  // Employer inline reschedule / cancel state
  const [employerRescheduleId, setEmployerRescheduleId] = useState<string | null>(null);
  const [empReschedDate, setEmpReschedDate] = useState('');
  const [empReschedTime, setEmpReschedTime] = useState('');
  const [empReschedFormat, setEmpReschedFormat] = useState<InterviewType>('video');
  const [empReschedLocation, setEmpReschedLocation] = useState('');
  const [empReschedNotes, setEmpReschedNotes] = useState('');

  // Seeker reschedule request state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [activeRescheduleInterviewId, setActiveRescheduleInterviewId] = useState<string | null>(null);

  // Get relevant interviews (strictly real interviews belonging to current user — zero mock fallback)
  const relevantInterviews = userRole === 'employer'
    ? interviews.filter(i => i.employerId === currentEmployerProfile?.id)
    : interviews.filter(
        i =>
          i.jobSeekerId === currentSeekerProfile?.id ||
          i.seekerId === currentSeekerProfile?.id
      );

  // Employer's actual applicants list for scheduling new interviews
  const myEmployerJobs = jobPosts.filter(j => j.employerId === currentEmployerProfile?.id);
  const myEmployerJobIds = myEmployerJobs.map(j => j.id);
  const myEmployerApps = applications.filter(a => myEmployerJobIds.includes(a.jobId));

  const getDefaultEmployerVenue = () => {
    const parts = [
      currentEmployerProfile?.address,
      currentEmployerProfile?.barangay ? `BRGY. ${currentEmployerProfile.barangay}` : '',
      currentEmployerProfile?.municipality,
      'ORIENTAL MINDORO',
    ]
      .filter(Boolean)
      .map(s => String(s).trim())
      .filter(Boolean);
    return parts.join(', ').toUpperCase();
  };

  const getDefaultEmployerPhone = () => currentEmployerProfile?.contactNumber || '';

  // Calendar logic calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateKey = (dayNum: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = dayNum.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Group interviews by date string "YYYY-MM-DD"
  const interviewsByDate: { [dateStr: string]: Interview[] } = {};
  relevantInterviews.forEach(inv => {
    const dateKey = inv.date || (inv as any).scheduledDate;
    if (!dateKey) return;
    if (!interviewsByDate[dateKey]) interviewsByDate[dateKey] = [];
    interviewsByDate[dateKey].push(inv);
  });

  const handleSlotModeChange = (nextMode: InterviewType) => {
    setSlotMode(nextMode);
    if (nextMode === 'video') {
      setSlotLocation('');
    } else if (nextMode === 'face_to_face') {
      setSlotLocation(getDefaultEmployerVenue());
    } else {
      setSlotLocation(getDefaultEmployerPhone());
    }
  };

  const handleEmployerProposeSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !slotDate || !slotTime || !slotLocation.trim()) return;

    const app = myEmployerApps.find(a => a.id === selectedAppId);
    if (!app) return;

    const job = jobPosts.find(j => j.id === app.jobId);
    const seeker = jobSeekers.find(s => s.id === app.jobSeekerId);
    if (!job || !seeker) return;

    scheduleInterview({
      applicationId: app.id,
      jobId: job.id,
      vacancyId: job.id,
      jobTitle: job.title,
      employerId: job.employerId || currentEmployerProfile?.id || '',
      companyName: (job.companyName || currentEmployerProfile?.companyName || '').toUpperCase(),
      jobSeekerId: seeker.id,
      seekerId: seeker.id,
      applicantName: `${seeker.firstName} ${seeker.lastName}`.trim().toUpperCase(),
      interviewType: slotMode,
      format: slotMode,
      date: slotDate,
      time: slotTime,
      locationOrLink: slotMode === 'face_to_face' ? slotLocation.toUpperCase() : slotLocation,
      instructions: slotInstructions.toUpperCase(),
      notes: slotInstructions.toUpperCase(),
      contactPerson: (currentEmployerProfile?.representativeName || job.companyName).toUpperCase(),
    });

    setSelectedDay(slotDate);
    setIsProposingSlotModal(false);
    setSelectedAppId('');
    setSlotDate('');
    setSlotTime('');
    setSlotLocation('');
    setSlotInstructions('');
  };

  const handleOpenEmployerReschedule = (inv: Interview) => {
    if (onEditOrReschedule) {
      onEditOrReschedule(inv);
      return;
    }
    if (employerRescheduleId === inv.id) {
      setEmployerRescheduleId(null);
      return;
    }
    setEmployerRescheduleId(inv.id);
    setEmpReschedDate(inv.date || '');
    setEmpReschedTime(inv.time || '');
    setEmpReschedFormat(inv.interviewType || inv.format || 'video');
    setEmpReschedLocation(inv.locationOrLink || '');
    setEmpReschedNotes((inv.instructions || inv.notes || '').toUpperCase());
  };

  const handleEmployerSaveReschedule = (interviewId: string) => {
    if (!empReschedDate || !empReschedTime || !empReschedLocation.trim()) return;
    rescheduleInterview(interviewId, {
      date: empReschedDate,
      time: empReschedTime,
      interviewType: empReschedFormat,
      locationOrLink: empReschedFormat === 'face_to_face' ? empReschedLocation.toUpperCase() : empReschedLocation,
      instructions: empReschedNotes.toUpperCase(),
    });
    setSelectedDay(empReschedDate);
    setEmployerRescheduleId(null);
  };

  const handleSeekerReschedule = (interviewId: string) => {
    if (!rescheduleDate || !rescheduleTime) return;
    respondToInterview(
      interviewId, 
      'reschedule_requested', 
      `REQUESTED RESCHEDULE TO ${rescheduleDate} AT ${rescheduleTime}. ${rescheduleNotes.toUpperCase()}`
    );
    setActiveRescheduleInterviewId(null);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleNotes('');
  };

  const selectedDayInterviews = selectedDay ? (interviewsByDate[selectedDay] || []) : [];

  const formatLabel = (fmt?: InterviewType) => {
    if (fmt === 'video') return 'Online / Video (Meet / Zoom)';
    if (fmt === 'face_to_face') return 'On-Site / Office Interview';
    return 'Phone Interview';
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Built-In Interview Calendar
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {userRole === 'employer' 
              ? 'Click any date to inspect scheduled interviews, view applicant details, or reschedule and cancel appointments.' 
              : 'Click any highlighted date to inspect your scheduled interviews, meeting links, venue addresses, and preparation instructions.'}
          </p>
        </div>

        {/* Action Button for Employer */}
        {userRole === 'employer' && myEmployerApps.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSlotDate('');
              setSlotTime('');
              setSlotMode('video');
              setSlotLocation('');
              setSlotInstructions('');
              setIsProposingSlotModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Interview</span>
          </button>
        )}
      </div>

      {/* Main Grid: Calendar Grid & Day Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Left Column */}
        <div className="lg:col-span-7 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 font-mono">
                {monthNames[month]} {year}
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                {relevantInterviews.length} Scheduled
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDay(now.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-18 sm:h-20 bg-slate-100/50 rounded-xl" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = formatDateKey(dayNum);
              const dayInterviews = interviewsByDate[dateKey] || [];
              const isSelected = selectedDay === dateKey;
              const isToday = dateKey === todayIso;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDay(dateKey)}
                  className={`h-18 sm:h-20 p-1.5 rounded-xl border text-left transition-all flex flex-col justify-between relative overflow-hidden ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-400' 
                      : dayInterviews.length > 0 
                      ? 'bg-white border-indigo-300 hover:border-indigo-500 text-slate-900 shadow-2xs' 
                      : isToday
                      ? 'bg-indigo-50/60 border-indigo-200 text-slate-900'
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : isToday ? 'text-indigo-600 font-black' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </div>

                  {/* Day Badges */}
                  {dayInterviews.length > 0 && (
                    <div className="space-y-1 w-full">
                      {dayInterviews.slice(0, 2).map((inv, iIdx) => (
                        <div 
                          key={iIdx} 
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate uppercase ${
                            isSelected 
                              ? 'bg-indigo-800 text-white' 
                              : inv.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : inv.status === 'cancelled' || inv.status === 'declined'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 line-through'
                              : inv.status === 'rescheduled' || inv.status === 'reschedule_requested'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {inv.time} • {userRole === 'employer' ? (inv.applicantName || '').split(' ')[0] : (inv.companyName || '').split(' ')[0]}
                        </div>
                      ))}
                      {dayInterviews.length > 2 && (
                        <span className={`text-[8px] font-extrabold block text-right ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          +{dayInterviews.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmed / Accepted</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Rescheduled</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cancelled</span>
          </div>

        </div>

        {/* Selected Day Agenda & Details Right Column */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Selected Date Agenda</span>
              <h3 className="text-sm font-bold text-white font-mono">
                {selectedDay
                  ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select a date'}
              </h3>
            </div>
            <span className="text-xs font-bold bg-indigo-600 px-2.5 py-1 rounded-lg">
              {selectedDayInterviews.length} Interview(s)
            </span>
          </div>

          {selectedDayInterviews.length === 0 ? (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No Interviews Scheduled on This Date</p>
              <p className="text-[11px] text-slate-500">
                {relevantInterviews.length === 0
                  ? 'Your built-in calendar is currently empty. Scheduled interviews will automatically appear here.'
                  : 'Select a highlighted date on the calendar to inspect scheduled interviews.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
              {selectedDayInterviews.map(inv => {
                const fmt = inv.interviewType || inv.format || 'video';
                const prepNotes = (inv.instructions || inv.notes || '').toUpperCase();
                const isUrl = typeof inv.locationOrLink === 'string' && /^https?:\/\//i.test(inv.locationOrLink.trim());

                return (
                  <div key={inv.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 text-xs">
                    
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{inv.jobTitle}</h4>
                        <p className="text-slate-600 font-bold uppercase mt-0.5">
                          {userRole === 'employer'
                            ? `APPLICANT: ${(inv.applicantName || '').toUpperCase()}`
                            : `EMPLOYER: ${(inv.companyName || '').toUpperCase()}`}
                        </p>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border shrink-0 ${
                        inv.status === 'accepted' || inv.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : inv.status === 'cancelled' || inv.status === 'declined'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : inv.status === 'rescheduled' || inv.status === 'reschedule_requested'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Time & Format Details */}
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-bold font-mono">{inv.date} • {inv.time}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                          {formatLabel(fmt)}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-slate-700 pt-1 border-t border-slate-200/60">
                        {fmt === 'video' ? (
                          <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        ) : fmt === 'face_to_face' ? (
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            {fmt === 'video' ? 'Meeting Link' : fmt === 'face_to_face' ? 'Venue / Address' : 'Contact Number'}
                          </span>
                          {isUrl ? (
                            <a
                              href={inv.locationOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 break-all"
                            >
                              <span>{inv.locationOrLink}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="font-semibold text-slate-800 break-words uppercase">
                              {inv.locationOrLink}
                            </span>
                          )}
                        </div>
                      </div>

                      {prepNotes && (
                        <div className="pt-1.5 border-t border-slate-200/60 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Preparation Notes &amp; Instructions
                            </span>
                            <p className="text-[11px] font-semibold text-slate-700 whitespace-pre-line uppercase">
                              {prepNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Employer Quick Actions: Reschedule or Cancel */}
                    {userRole === 'employer' && inv.status !== 'cancelled' && inv.status !== 'completed' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEmployerReschedule(inv)}
                          className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelInterview(inv.id, 'CANCELLED BY EMPLOYER')}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}

                    {/* Employer Inline Reschedule Form */}
                    {userRole === 'employer' && employerRescheduleId === inv.id && (
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5 text-xs">
                        <p className="font-bold text-indigo-950">Reschedule Interview (Syncs to Seeker Calendar)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block">New Date</label>
                            <input
                              type="date"
                              min={todayIso}
                              value={empReschedDate}
                              onChange={e => setEmpReschedDate(e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block">New Time</label>
                            <input
                              type="text"
                              placeholder="e.g. 10:30 AM"
                              value={empReschedTime}
                              onChange={e => setEmpReschedTime(e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block">Venue / Link / Contact</label>
                          <input
                            type="text"
                            value={empReschedLocation}
                            onChange={e =>
                              setEmpReschedLocation(
                                empReschedFormat === 'face_to_face' ? e.target.value.toUpperCase() : e.target.value
                              )
                            }
                            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block">Preparation Notes (ALL CAPS)</label>
                          <textarea
                            rows={2}
                            value={empReschedNotes}
                            onChange={e => setEmpReschedNotes(e.target.value.toUpperCase())}
                            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs uppercase"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEmployerRescheduleId(null)}
                            className="px-3 py-1 text-slate-600 font-bold"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEmployerSaveReschedule(inv.id)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg"
                          >
                            Save New Schedule
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Job Seeker Actions */}
                    {userRole === 'job_seeker' && (inv.status === 'scheduled' || inv.status === 'rescheduled') && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => respondToInterview(inv.id, 'accepted', 'CONFIRMED ATTENDANCE')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Attendance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveRescheduleInterviewId(activeRescheduleInterviewId === inv.id ? null : inv.id)}
                          className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request Reschedule</span>
                        </button>
                      </div>
                    )}

                    {/* Seeker Reschedule Drawer */}
                    {userRole === 'job_seeker' && activeRescheduleInterviewId === inv.id && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                        <p className="font-bold text-amber-900">Propose New Date &amp; Reason (ALL CAPS)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block">Preferred Date</label>
                            <input 
                              type="date" 
                              min={todayIso}
                              value={rescheduleDate} 
                              onChange={e => setRescheduleDate(e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block">Preferred Time</label>
                            <input 
                              type="time" 
                              value={rescheduleTime} 
                              onChange={e => setRescheduleTime(e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs" 
                            />
                          </div>
                        </div>
                        <input 
                          type="text" 
                          placeholder="REASON FOR RESCHEDULE REQUEST..." 
                          value={rescheduleNotes}
                          onChange={e => setRescheduleNotes(e.target.value.toUpperCase())}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => handleSeekerReschedule(inv.id)}
                          className="w-full py-1.5 bg-amber-700 text-white font-bold rounded-lg"
                        >
                          Send Reschedule Request
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Schedule Interview Modal from Calendar for Employer */}
      {isProposingSlotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Schedule Candidate Interview</h3>
              <button type="button" onClick={() => setIsProposingSlotModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEmployerProposeSlot} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Applicant <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={selectedAppId}
                  onChange={e => setSelectedAppId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="">-- Choose Applicant --</option>
                  {myEmployerApps.map(app => {
                    const job = jobPosts.find(j => j.id === app.jobId);
                    const seeker = jobSeekers.find(s => s.id === app.jobSeekerId);
                    return (
                      <option key={app.id} value={app.id}>
                        {(seeker ? `${seeker.firstName} ${seeker.lastName}` : app.applicantName).toUpperCase()} — {job?.title} ({Math.round(app.matchScore || 0)}% Match)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interview Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    min={todayIso}
                    value={slotDate}
                    onChange={e => setSlotDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interview Time <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={slotTime}
                    onChange={e => setSlotTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Format <span className="text-rose-500">*</span></label>
                <select
                  value={slotMode}
                  onChange={e => handleSlotModeChange(e.target.value as InterviewType)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="video">Online / Video Interview (Google Meet / Zoom / Teams)</option>
                  <option value="face_to_face">On-Site / Office Interview</option>
                  <option value="phone">Phone Interview</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {slotMode === 'video'
                    ? 'Meeting Link (Google Meet / Zoom)'
                    : slotMode === 'face_to_face'
                    ? 'On-Site Venue / Business Address (ALL CAPS)'
                    : 'Contact Phone Number'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slotLocation}
                  onChange={e =>
                    setSlotLocation(
                      slotMode === 'face_to_face' ? e.target.value.toUpperCase() : e.target.value
                    )
                  }
                  placeholder={
                    slotMode === 'video'
                      ? 'Paste your Google Meet or Zoom link here...'
                      : slotMode === 'face_to_face'
                      ? 'ENTER OFFICE VENUE OR BUSINESS ADDRESS...'
                      : 'Enter contact phone number...'
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Candidate Preparation Notes (ALL CAPS)</label>
                <textarea
                  rows={2}
                  value={slotInstructions}
                  onChange={e => setSlotInstructions(e.target.value.toUpperCase())}
                  placeholder="ENTER PREPARATION INSTRUCTIONS..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposingSlotModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm &amp; Save to Calendar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
