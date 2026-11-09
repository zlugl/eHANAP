import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Building2,
  AlertCircle
} from 'lucide-react';

export const SeekerInterviewsPage: React.FC = () => {
  const { currentSeekerProfile, interviews, respondToInterview } = useApp();
  const [rescheduleNotes, setRescheduleNotes] = useState<{ [id: string]: string }>({});
  const [rescheduleDate, setRescheduleDate] = useState<{ [id: string]: string }>({});
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);

  if (!currentSeekerProfile) return null;

  const myInterviews = interviews.filter(i => i.jobSeekerId === currentSeekerProfile.id);

  const handleRespond = (interviewId: string, response: 'accept' | 'decline' | 'reschedule') => {
    let note = '';
    if (response === 'reschedule') {
      note = `Requested new date: ${rescheduleDate[interviewId] || 'TBD'}. ${rescheduleNotes[interviewId] || ''}`;
    }
    respondToInterview(interviewId, response, note);
    setActiveRescheduleId(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 select-none">
      
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)] font-display tracking-tight">Interview Schedule</h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          Respond to interview invites, view video call links, or request reschedule with Mindoro employers.
        </p>
      </div>

      {myInterviews.length === 0 ? (
        <div className="bg-[var(--color-paper)] p-12 text-center rounded-2xl border border-[var(--color-rule)]">
          <Calendar className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-sm font-bold text-[var(--color-ink)]">No Scheduled Interviews</h2>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">Interview invitations from employers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myInterviews.map(inv => (
            <div key={inv.id} className="bg-[var(--color-paper)] p-6 rounded-2xl border border-[var(--color-rule)] space-y-4">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-rule)] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-ink)] font-display">{inv.jobTitle}</h2>
                  <p className="text-xs font-medium text-[var(--color-ink-muted)]">{inv.companyName}</p>
                  <span className="inline-block text-[11px] font-medium bg-[var(--color-paper-warm)] text-[var(--color-ink)] border border-[var(--color-rule)] px-2 py-0.5 rounded capitalize mt-1.5">
                    {(inv.interviewType || 'interview').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto">
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg capitalize border ${
                    inv.status === 'accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    inv.status === 'declined' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                    inv.status === 'reschedule_requested' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-[var(--color-paper-warm)] border-[var(--color-rule)] text-[var(--color-ink)]'
                  }`}>
                    Status: {(inv.status || 'scheduled').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Schedule Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-[10px] text-[var(--color-ink-muted)] block font-medium">Date</span>
                    <span className="font-semibold text-[var(--color-ink)] tabular-nums">{inv.date || (inv as any).scheduledDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-[10px] text-[var(--color-ink-muted)] block font-medium">Time</span>
                    <span className="font-semibold text-[var(--color-ink)] tabular-nums">{inv.time || (inv as any).scheduledTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {inv.interviewType === 'video' || (inv.interviewType as string) === 'video_call' ? (
                    <Video className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                  ) : (
                    <MapPin className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[var(--color-ink-muted)] block font-medium">Location / Link</span>
                    <span className="font-semibold text-[var(--color-ink)] truncate block max-w-full">{inv.locationOrLink}</span>
                  </div>
                </div>
              </div>

              {(inv.instructions || inv.rescheduleNotes || (inv as any).notes) && (
                <div className="p-3 bg-[var(--color-paper-warm)] rounded-xl text-xs text-[var(--color-ink)] border border-[var(--color-rule)]">
                  <strong className="text-[var(--color-ink)]">Employer Instructions:</strong> {inv.instructions || inv.rescheduleNotes || (inv as any).notes}
                </div>
              )}

              {/* Action Buttons */}
              {inv.status === 'scheduled' && (
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleRespond(inv.id, 'accept')}
                    className="btn btn--primary px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Accept Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRescheduleId(activeRescheduleId === inv.id ? null : inv.id)}
                    className="btn btn--quiet px-4 py-2 text-xs font-medium rounded-xl border border-[var(--color-rule)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>Request Reschedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRespond(inv.id, 'decline')}
                    className="btn btn--quiet px-4 py-2 text-xs font-medium text-rose-700 hover:text-rose-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Decline</span>
                  </button>
                </div>
              )}

              {/* Reschedule Input Drawer */}
              {activeRescheduleId === inv.id && (
                <div className="p-4 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl space-y-3 text-xs motion-safe:animate-in motion-safe:fade-in">
                  <h3 className="font-bold text-[var(--color-ink)]">Propose New Date & Reason for Reschedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={rescheduleDate[inv.id] || ''}
                        onChange={e => setRescheduleDate({ ...rescheduleDate, [inv.id]: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Reason / Notes</label>
                      <input
                        type="text"
                        placeholder="Reason for reschedule request..."
                        value={rescheduleNotes[inv.id] || ''}
                        onChange={e => setRescheduleNotes({ ...rescheduleNotes, [inv.id]: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => handleRespond(inv.id, 'reschedule')}
                      className="btn btn--primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                    >
                      Send Reschedule Request
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
