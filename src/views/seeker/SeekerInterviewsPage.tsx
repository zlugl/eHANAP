import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InterviewCalendarView } from '../../components/InterviewCalendarView';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ExternalLink,
  FileText
} from 'lucide-react';

export const SeekerInterviewsPage: React.FC = () => {
  const { currentSeekerProfile, interviews, respondToInterview } = useApp();
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [rescheduleNotes, setRescheduleNotes] = useState<{ [id: string]: string }>({});
  const [rescheduleDate, setRescheduleDate] = useState<{ [id: string]: string }>({});
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);

  if (!currentSeekerProfile) return null;

  const myInterviews = interviews.filter(
    i => i.jobSeekerId === currentSeekerProfile.id || i.seekerId === currentSeekerProfile.id
  );

  const handleRespond = (interviewId: string, response: 'accepted' | 'declined' | 'reschedule_requested') => {
    let note = '';
    if (response === 'reschedule_requested') {
      note = `REQUESTED NEW DATE: ${rescheduleDate[interviewId] || 'TBD'}. ${(rescheduleNotes[interviewId] || '').toUpperCase()}`;
    } else if (response === 'accepted') {
      note = 'CONFIRMED ATTENDANCE';
    }
    respondToInterview(interviewId, response, note);
    setActiveRescheduleId(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 select-none">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
            Built-In Interview Calendar
          </span>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] font-display tracking-tight mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            My Calendar &amp; Scheduled Interviews
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Inspect your scheduled interviews on the built-in calendar, open video meeting links, review employer preparation instructions, or confirm attendance.
          </p>
        </div>

        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming Agenda ({myInterviews.length})
          </button>
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <InterviewCalendarView userRole="job_seeker" />
      ) : myInterviews.length === 0 ? (
        <div className="bg-[var(--color-paper)] p-12 text-center rounded-2xl border border-[var(--color-rule)]">
          <Calendar className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-sm font-bold text-[var(--color-ink)]">No Scheduled Interviews</h2>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            When an employer schedules an interview for your job application, it will automatically sync to your built-in calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myInterviews.map(inv => {
            const fmt = inv.interviewType || inv.format || 'video';
            const dateVal = inv.date || (inv as any).scheduledDate || '';
            const timeVal = inv.time || (inv as any).scheduledTime || '';
            const locVal = inv.locationOrLink || (inv as any).location || '';
            const prepNotes = (inv.instructions || inv.notes || inv.rescheduleNotes || '').toUpperCase();
            const isUrl = typeof locVal === 'string' && /^https?:\/\//i.test(locVal.trim());

            return (
              <div key={inv.id} className="bg-[var(--color-paper)] p-5 sm:p-6 rounded-2xl border border-[var(--color-rule)] space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-rule)] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-ink)] font-display">{inv.jobTitle}</h2>
                    <p className="text-xs font-bold text-[var(--color-ink-muted)] uppercase">{inv.companyName}</p>
                    <span className="inline-block text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-md mt-1.5">
                      {fmt === 'video'
                        ? 'Online / Video Interview (Meet / Zoom)'
                        : fmt === 'face_to_face'
                        ? 'On-Site / Office Interview'
                        : 'Phone Interview'}
                    </span>
                  </div>

                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                      inv.status === 'accepted' || inv.status === 'completed'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : inv.status === 'declined' || inv.status === 'cancelled'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : inv.status === 'reschedule_requested' || inv.status === 'rescheduled'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    }`}>
                      {(inv.status || 'scheduled').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Schedule Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-[10px] text-[var(--color-ink-muted)] block font-medium">Date</span>
                      <span className="font-bold text-[var(--color-ink)] tabular-nums">{dateVal}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-[10px] text-[var(--color-ink-muted)] block font-medium">Time</span>
                      <span className="font-bold text-[var(--color-ink)] tabular-nums">{timeVal}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {fmt === 'video' ? (
                      <Video className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    ) : fmt === 'face_to_face' ? (
                      <MapPin className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    ) : (
                      <Phone className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-[var(--color-ink-muted)] block font-medium">
                        {fmt === 'video' ? 'Meeting Link' : fmt === 'face_to_face' ? 'Venue / Address' : 'Contact Number'}
                      </span>
                      {isUrl ? (
                        <a
                          href={locVal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 break-all"
                        >
                          <span>{locVal}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="font-bold text-[var(--color-ink)] uppercase break-words block">{locVal}</span>
                      )}
                    </div>
                  </div>
                </div>

                {prepNotes && (
                  <div className="p-3 bg-[var(--color-paper-warm)] rounded-xl text-xs text-[var(--color-ink)] border border-[var(--color-rule)] flex items-start gap-2">
                    <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="uppercase whitespace-pre-line">
                      <strong className="text-[var(--color-ink)] block mb-0.5">Preparation Notes &amp; Instructions:</strong>
                      {prepNotes}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(inv.status === 'scheduled' || inv.status === 'rescheduled') && (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleRespond(inv.id, 'accepted')}
                      className="btn btn--primary px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Confirm Attendance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveRescheduleId(activeRescheduleId === inv.id ? null : inv.id)}
                      className="btn btn--quiet px-4 py-2 text-xs font-medium rounded-xl border border-[var(--color-rule)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>Request Reschedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRespond(inv.id, 'declined')}
                      className="btn btn--quiet px-4 py-2 text-xs font-medium text-rose-700 hover:text-rose-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}

                {/* Reschedule Input Drawer */}
                {activeRescheduleId === inv.id && (
                  <div className="p-4 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl space-y-3 text-xs">
                    <h3 className="font-bold text-[var(--color-ink)]">Propose New Date &amp; Reason for Reschedule (ALL CAPS)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Preferred Date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={rescheduleDate[inv.id] || ''}
                          onChange={e => setRescheduleDate({ ...rescheduleDate, [inv.id]: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper)] text-[var(--color-ink)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Reason / Notes (ALL CAPS)</label>
                        <input
                          type="text"
                          placeholder="REASON FOR RESCHEDULE REQUEST..."
                          value={rescheduleNotes[inv.id] || ''}
                          onChange={e => setRescheduleNotes({ ...rescheduleNotes, [inv.id]: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-1.5 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper)] text-[var(--color-ink)] uppercase"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleRespond(inv.id, 'reschedule_requested')}
                        className="btn btn--primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Send Reschedule Request
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
