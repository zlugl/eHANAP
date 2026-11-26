import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Interview } from '../../types';
import { InterviewCalendarView } from '../../components/InterviewCalendarView';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { ApplicantMatchReportModal } from './ApplicantMatchReportModal';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  ExternalLink, 
  RotateCcw,
  Building2, 
  UserCheck, 
  AlertCircle,
  Copy,
  Check,
  FileText
} from 'lucide-react';

interface EmployerInterviewsPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const EmployerInterviewsPage: React.FC<EmployerInterviewsPageProps> = ({ onNavigate }) => {
  const { 
    currentEmployerProfile, 
    interviews, 
    jobSeekers, 
    cancelInterview,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [selectedMatchReportAppId, setSelectedMatchReportAppId] = useState<string | null>(null);
  const [selectedInterviewModalAppId, setSelectedInterviewModalAppId] = useState<string | null>(null);
  const [reschedulingInterview, setReschedulingInterview] = useState<Interview | null>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  if (!currentEmployerProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <Building2 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Employer Account Required</h2>
          <p className="text-xs text-slate-500 mt-1">Please log in with an Employer account to view and manage candidate interviews.</p>
        </div>
      </div>
    );
  }

  // Get interviews belonging to current employer
  const myInterviews = interviews.filter(i => i.employerId === currentEmployerProfile.id);

  const upcomingInterviews = myInterviews.filter(
    i => i.status === 'scheduled' || i.status === 'rescheduled' || i.status === 'accepted'
  );
  const acceptedInterviews = myInterviews.filter(i => i.status === 'accepted');
  const rescheduledInterviews = myInterviews.filter(
    i => i.status === 'reschedule_requested' || i.status === 'rescheduled'
  );
  const cancelledInterviews = myInterviews.filter(i => i.status === 'cancelled' || i.status === 'declined');

  const handleCopyMeetLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkIndex(index);
    showToast({
      title: 'Link Copied',
      message: 'Meeting link copied to clipboard.',
      type: 'info'
    });
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 font-body">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
              Built-In Calendar &amp; Schedule
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase">
              {currentEmployerProfile.companyName}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Employer Calendar &amp; Scheduled Interviews
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect scheduled interviews, view applicant details and preparation instructions, or reschedule and cancel appointments directly in-app.
          </p>
        </div>

        {/* View Toggle (Calendar Grid vs Agenda List View) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
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

          <button
            type="button"
            onClick={() => onNavigate('employer-applicants')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Select Applicant to Interview</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Upcoming Interviews</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{upcomingInterviews.length}</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Active scheduled sessions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Candidate Confirmed</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600 tabular-nums">{acceptedInterviews.length}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Confirmed attendance</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Rescheduled</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600 tabular-nums">{rescheduledInterviews.length}</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Updated schedule</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Cancelled / Declined</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-700 tabular-nums">{cancelledInterviews.length}</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Closed appointments</p>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'calendar' ? (
        <InterviewCalendarView
          userRole="employer"
          onEditOrReschedule={(inv) => {
            setReschedulingInterview(inv);
            setSelectedInterviewModalAppId(inv.applicationId);
          }}
        />
      ) : (
        <div className="space-y-4">
          {myInterviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Interviews Scheduled Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Open your Applicants tab and click &ldquo;Schedule Interview&rdquo; on any shortlisted applicant to save an interview directly to your built-in calendar.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('employer-applicants')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Go to Applicants Tab</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInterviews.map((inv, idx) => {
                const seeker = jobSeekers.find(s => s.id === inv.jobSeekerId || s.id === inv.seekerId);
                const fmt = inv.interviewType || inv.format || 'video';
                const dateVal = inv.date || (inv as any).scheduledDate || '';
                const timeVal = inv.time || (inv as any).scheduledTime || '';
                const locVal = inv.locationOrLink || (inv as any).location || '';
                const notesVal = (inv.instructions || inv.notes || '').toUpperCase();
                const isUrl = typeof locVal === 'string' && /^https?:\/\//i.test(locVal.trim());

                return (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors p-5 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {seeker?.profilePicture ? (
                          <img
                            src={seeker.profilePicture}
                            alt={inv.applicantName}
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 shrink-0" />
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 uppercase">{inv.applicantName}</h3>
                          <p className="text-xs text-slate-600 font-semibold">{inv.jobTitle}</p>
                          <p className="text-[11px] text-slate-400 uppercase">{seeker?.municipality || 'ORIENTAL MINDORO'}</p>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        inv.status === 'accepted' || inv.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : inv.status === 'scheduled'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : inv.status === 'rescheduled' || inv.status === 'reschedule_requested'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Schedule Time & Mode */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Date &amp; Time: {dateVal} at {timeVal}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        {fmt === 'video' ? (
                          <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : fmt === 'face_to_face' ? (
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span>
                          {fmt === 'video'
                            ? 'Online / Video Interview (Meet / Zoom)'
                            : fmt === 'face_to_face'
                            ? 'On-Site / Office Interview'
                            : 'Phone Interview'}
                        </span>
                      </div>

                      {locVal && (
                        <div className="text-[11px] text-slate-600 break-all">
                          <strong>{fmt === 'video' ? 'Meeting Link:' : fmt === 'face_to_face' ? 'Venue / Address:' : 'Contact Number:'}</strong>{' '}
                          {isUrl ? (
                            <a
                              href={locVal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              {locVal}
                            </a>
                          ) : (
                            <span className="uppercase font-semibold">{locVal}</span>
                          )}
                        </div>
                      )}

                      {notesVal && (
                        <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="uppercase">
                            <strong>Preparation Notes:</strong> {notesVal}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {isUrl && (
                          <>
                            <a
                              href={locVal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meeting</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleCopyMeetLink(locVal, idx)}
                              title="Copy Meet Link"
                              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200"
                            >
                              {copiedLinkIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}

                        {inv.applicationId && (
                          <button
                            type="button"
                            onClick={() => setSelectedMatchReportAppId(inv.applicationId)}
                            className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                          >
                            View Candidate
                          </button>
                        )}
                      </div>

                      {inv.status !== 'cancelled' && inv.status !== 'completed' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingInterview(inv);
                              setSelectedInterviewModalAppId(inv.applicationId);
                            }}
                            className="px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-100 bg-indigo-50 border border-indigo-200 rounded-lg font-bold inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reschedule</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelInterview(inv.id, 'CANCELLED BY EMPLOYER')}
                            className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded-lg font-bold inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Match Report Modal */}
      {selectedMatchReportAppId && (
        <ApplicantMatchReportModal
          applicationId={selectedMatchReportAppId}
          onClose={() => setSelectedMatchReportAppId(null)}
          onScheduleInterview={(appId) => {
            setReschedulingInterview(null);
            setSelectedInterviewModalAppId(appId);
          }}
        />
      )}

      {/* Schedule / Reschedule Interview Modal */}
      {selectedInterviewModalAppId && (
        <ScheduleInterviewModal
          applicationId={selectedInterviewModalAppId}
          existingInterview={reschedulingInterview}
          onClose={() => {
            setSelectedInterviewModalAppId(null);
            setReschedulingInterview(null);
          }}
        />
      )}

    </div>
  );
};
