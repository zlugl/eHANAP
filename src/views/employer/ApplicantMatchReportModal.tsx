import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getOrCalculateMatch } from '../../utils/matchResolver';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Briefcase,
  GraduationCap,
  Award,
  Send,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';

interface ApplicantMatchReportModalProps {
  applicationId?: string;
  seekerId?: string;
  jobId?: string;
  onClose: () => void;
  onScheduleInterview?: (appId: string) => void;
  onInviteCandidate?: (seekerId: string, jobId: string) => void;
}

export const ApplicantMatchReportModal: React.FC<ApplicantMatchReportModalProps> = ({
  applicationId,
  seekerId,
  jobId,
  onClose,
  onScheduleInterview,
  onInviteCandidate,
}) => {
  const { 
    applications, 
    jobSeekers, 
    jobPosts, 
    candidateMatches,
    inviteCandidateToApply, 
    hasInvitedCandidate 
  } = useApp();

  const [isInviting, setIsInviting] = useState(false);

  // Resolve application, seeker, and job
  const application = applicationId ? applications.find(a => a.id === applicationId) : null;
  const effectiveSeekerId = seekerId || application?.jobSeekerId;
  const effectiveJobId = jobId || application?.jobId;

  const seeker = jobSeekers.find(s => s.id === effectiveSeekerId);
  const job = jobPosts.find(j => j.id === effectiveJobId);

  if (!seeker || !job) return null;

  // Resolve match result & scores
  const matchResult = getOrCalculateMatch(seeker, job, { cachedMatches: candidateMatches, application });
  const matchScore = application?.matchScore ?? matchResult.overallMatch;
  const outcome = application?.decisionTreeOutcome || matchResult.outcome;

  // Check if candidate already has an application for this job
  const existingApp = application || applications.find(a => a.jobId === job.id && a.jobSeekerId === seeker.id);
  const alreadyInvited = hasInvitedCandidate(job.id, seeker.id);

  const subScores = [
    {
      key: 'skills',
      label: 'Skills Competency Overlap',
      weight: '35%',
      description: 'Technical, vocational & domain skills matching vacancy requirements',
      score: matchResult.skillsMatchScore,
    },
    {
      key: 'degree',
      label: 'Degree & Academic Field Alignment',
      weight: '25%',
      description: 'Course relevance (Exact match: 100%, Related field: 80%, General: 40%)',
      score: matchResult.degreeAlignmentScore,
    },
    {
      key: 'experience',
      label: 'Years of Work Experience',
      weight: '20%',
      description: 'Verifiable background compared to vacancy minimum requirement',
      score: matchResult.experienceMatchScore,
    },
    {
      key: 'education',
      label: 'Educational Attainment Level',
      weight: '12%',
      description: 'Minimum educational level (College, Associate, TVET, High School)',
      score: matchResult.educationMatchScore,
    },
    {
      key: 'certifications',
      label: 'TESDA & Skill Assessments',
      weight: '8%',
      description: 'Verified PESO skill badges, TESDA NC credentials & licensures',
      score: matchResult.certificationsMatchScore,
    },
  ];

  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-700',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        tier: 'High Alignment (>80%)',
      };
    }
    if (score >= 50) {
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-700',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        tier: 'Moderate (50-79%)',
      };
    }
    return {
      bar: 'bg-rose-500',
      text: 'text-rose-700',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      tier: 'Qualification Gap (<50%)',
    };
  };

  const handleInvite = () => {
    setIsInviting(true);
    if (onInviteCandidate) {
      onInviteCandidate(seeker.id, job.id);
    } else {
      inviteCandidateToApply(job.id, seeker.id);
    }
    setTimeout(() => setIsInviting(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  AI Decision Tree Match Evaluation
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Roxas PESO
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                Detailed qualification audit for {seeker.firstName} {seeker.lastName} • {job.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Seeker Summary Card */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={seeker.profilePicture || seeker.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={`${seeker.firstName} ${seeker.lastName}`}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-base text-slate-900">{seeker.firstName} {seeker.lastName}</h4>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    outcome === 'HIGHLY_QUALIFIED' || outcome === 'HIGHLY QUALIFIED'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : outcome === 'QUALIFIED'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : outcome === 'MODERATELY_QUALIFIED' || outcome === 'MODERATELY QUALIFIED'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {outcome.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {seeker.primaryDegree || seeker.educationalAttainment || 'Qualified Candidate'} • {seeker.municipality || 'Roxas'}, Oriental Mindoro
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Target: {job.title}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    {existingApp ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Status: {existingApp.currentStatus.replace(/_/g, ' ')}
                      </span>
                    ) : alreadyInvited ? (
                      <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        Invited to Apply
                      </span>
                    ) : (
                      <span className="text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">
                        Talent Pool Candidate
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Callout */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Overall Match</span>
              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-2xl shadow-inner mt-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xl sm:text-2xl font-black tabular-nums">{matchScore}%</span>
              </div>
            </div>
          </div>

          {/* 5 Core Decision Tree Sub-Scores Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-black text-slate-900 tracking-wide uppercase">
                  Decision Tree Sub-Score Breakdown (5 Nodes)
                </h5>
                <p className="text-[11px] text-slate-500">
                  Deterministic mathematical weighting across academic, competency, and experience criteria
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                100% Total Model Weight
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subScores.map(item => {
                const theme = getScoreTheme(item.score);
                return (
                  <div key={item.key} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.weight}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black border shrink-0 tabular-nums ${theme.badge}`}>
                        {item.score}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`${theme.bar} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(4, item.score))}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Composite explanation card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-3.5 rounded-2xl border border-indigo-950 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">Composite Score</span>
                    <span className="text-sm font-black text-emerald-400 tabular-nums">{matchScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Evaluated deterministically by eHANAP for Roxas LGU. Zero black-box bias.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-200 font-semibold pt-2 border-t border-indigo-800/60 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Decision: {matchResult.outcome}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Satisfied Criteria Rationale */}
          <div className="space-y-2">
            <h5 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Satisfied Criteria & Candidate Strengths ({matchResult.matchedReasons?.length || 0})
            </h5>
            <div className="space-y-1.5">
              {matchResult.matchedReasons && matchResult.matchedReasons.length > 0 ? (
                matchResult.matchedReasons.map((reason, idx) => (
                  <div key={`match-${idx}`} className="p-3 rounded-xl border border-emerald-200/90 bg-emerald-50/50 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-950">{reason}</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">Verified qualification satisfying job requirement criteria.</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                  Baseline qualifications satisfy job requirements.
                </p>
              )}
            </div>
          </div>

          {/* Qualification Gaps Callout */}
          {matchResult.missingQualifications && matchResult.missingQualifications.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Qualification Gaps & Growth Areas ({matchResult.missingQualifications.length})
              </h5>
              <div className="space-y-1.5">
                {matchResult.missingQualifications.map((gap, idx) => (
                  <div key={`gap-${idx}`} className="p-3 rounded-xl border border-amber-200/90 bg-amber-50/50 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">{gap}</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">Applicant qualification variance noted by automated decision tree assessment.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Decision Tree Recommendation Note */}
          <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 text-xs text-indigo-950 space-y-1.5">
            <p className="font-black flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              PESO Roxas Automated Recommendation Note
            </p>
            <p className="text-xs leading-relaxed text-indigo-900 font-medium">
              {matchResult.decisionReason || 'Candidate profile satisfies critical decision path criteria. Recommended for interview evaluation.'}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors text-center focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer"
          >
            Close Report
          </button>

          <div className="flex items-center gap-2">
            {existingApp ? (
              <button
                onClick={() => {
                  onClose();
                  if (onScheduleInterview) {
                    onScheduleInterview(existingApp.id);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-indigo-500 whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Interview</span>
              </button>
            ) : alreadyInvited ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invitation Already Sent</span>
              </span>
            ) : (
              <button
                onClick={handleInvite}
                disabled={isInviting}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-emerald-500 whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isInviting ? 'Sending Invite...' : 'Invite to Apply'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
