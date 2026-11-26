import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ApplicantMatchReportModal } from './ApplicantMatchReportModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { AtsResumeModal } from '../../components/AtsResumeModal';
import { evaluateResumeForAts } from '../../utils/atsEngine';
import { getOrCalculateMatch } from '../../utils/matchResolver';
import { EmployerStatusUpdateModal } from '../../components/EmployerStatusUpdateModal';
import { ApplicationStatusTracker } from '../../components/ApplicationStatusTracker';
import { ApplicationStatus, Application, JobSeekerProfile } from '../../types';
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  AlertTriangle, 
  Search, 
  Filter, 
  Award, 
  Layers, 
  ArrowUpDown, 
  Cpu, 
  Star, 
  MessageSquare, 
  UserCheck, 
  Clock, 
  Building2, 
  Briefcase, 
  BarChart3,
  Send,
  Check,
  Compass
} from 'lucide-react';

interface EmployerApplicantsPageProps {
  initialJobId?: string;
  onNavigate: (view: string, params?: any) => void;
}

export const EmployerApplicantsPage: React.FC<EmployerApplicantsPageProps> = ({ initialJobId, onNavigate }) => {
  const { 
    currentEmployerProfile, 
    jobPosts, 
    applications, 
    jobSeekers, 
    updateApplicationStatus, 
    upsertCandidateApplicationStatus,
    submitApplicationFeedback,
    inviteCandidateToApply,
    hasInvitedCandidate,
    candidateMatches,
    showToast
  } = useApp();

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [activeViewTab, setActiveViewTab] = useState<'pipeline' | 'ranking_roster'>('pipeline');
  const [scoutTargetSeekerId, setScoutTargetSeekerId] = useState<string | null>(null);
  const [scoutMessage, setScoutMessage] = useState<string>('');
  
  // Modals state
  const [selectedReportTarget, setSelectedReportTarget] = useState<{
    applicationId?: string;
    seekerId?: string;
    jobId?: string;
  } | null>(null);
  const [selectedInterviewAppId, setSelectedInterviewAppId] = useState<string | null>(null);
  const [selectedAtsApplicant, setSelectedAtsApplicant] = useState<{ app?: any; seeker: any; atsResult?: any; atsScore: number } | null>(null);
  const [selectedStatusModalApp, setSelectedStatusModalApp] = useState<Application | null>(null);
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState<'match' | 'ats'>('match');
  const [statusFilter, setStatusFilter] = useState<'all' | 'applied' | 'reviewed' | 'interview' | 'hired' | 'rejected'>('all');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'highly_qualified' | 'qualified' | 'moderate' | 'invited'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Candidate Feedback & Rating Modal State
  const [feedbackApp, setFeedbackApp] = useState<Application | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  if (!currentEmployerProfile) return null;

  const myJobs = jobPosts.filter(j => j.employerId === currentEmployerProfile.id);
  const effectiveJobId = selectedJobId || (myJobs.length > 0 ? myJobs[0].id : '');
  const activeJob = myJobs.find(j => j.id === effectiveJobId);

  // 1. AUTOMATED CANDIDATE RANKING ROSTER (Core Thesis Invariant: Evaluates ALL registered seekers in Roxas)
  const allCandidateEvaluations = useMemo(() => {
    if (!activeJob) return [];

    return jobSeekers.map(seeker => {
      const existingApp = applications.find(a => a.jobId === activeJob.id && a.jobSeekerId === seeker.id);
      const matchResult = getOrCalculateMatch(seeker, activeJob, {
        cachedMatches: candidateMatches,
        application: existingApp,
      });
      const isInvited = hasInvitedCandidate(activeJob.id, seeker.id);
      const atsResult = existingApp?.atsResult || evaluateResumeForAts(seeker, activeJob);
      const atsScore = existingApp?.atsScore || atsResult?.score || 85;

      return {
        seeker,
        job: activeJob,
        matchResult,
        score: matchResult.overallMatch,
        outcome: matchResult.outcome,
        existingApp,
        isInvited,
        atsResult,
        atsScore,
      };
    });
  }, [activeJob, jobSeekers, applications, candidateMatches, hasInvitedCandidate]);

  const candidateRankingPool = useMemo(() => {
    if (!activeJob || allCandidateEvaluations.length === 0) return [];

    // Strictly show ONLY job seekers who have NOT applied yet under "Recommended Talent (AI Matches)"
    let filtered = allCandidateEvaluations.filter(item => !item.existingApp);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const fullName = `${item.seeker.firstName} ${item.seeker.lastName}`.toLowerCase();
        const degree = (item.seeker.primaryDegree || '').toLowerCase();
        const municipality = (item.seeker.municipality || '').toLowerCase();
        const skills = [
          ...(item.seeker.technicalSkills || []),
          ...(item.seeker.tradeSkills || []),
          ...(item.seeker.salesCustomerSkills || []),
          ...(item.seeker.serviceHospitalitySkills || [])
        ].map(s => s.toLowerCase());
        return (
          fullName.includes(q) ||
          degree.includes(q) ||
          municipality.includes(q) ||
          skills.some(s => s.includes(q))
        );
      });
    }

    // Qualification / Roster Filter
    filtered = filtered.filter(item => {
      if (rosterFilter === 'all') return true;
      if (rosterFilter === 'highly_qualified') return item.score >= 85;
      if (rosterFilter === 'qualified') return item.score >= 70;
      if (rosterFilter === 'moderate') return item.score >= 55 && item.score < 70;
      if (rosterFilter === 'invited') return item.isInvited;
      return true;
    });

    // Deterministic sort: descending by Decision Tree score (or ATS)
    return [...filtered].sort((a, b) => {
      if (sortBy === 'ats') {
        return b.atsScore - a.atsScore;
      }
      return b.score - a.score;
    });
  }, [activeJob, allCandidateEvaluations, searchQuery, rosterFilter, sortBy]);

  // Pool summary counts - derived directly from unapplied recommended pool & actual applications
  const poolCounts = useMemo(() => {
    if (!activeJob) return { total: 0, highly: 0, qualified: 0, applied: 0, unapplied: 0, invited: 0 };
    const unappliedList = allCandidateEvaluations.filter(item => !item.existingApp);
    return {
      total: unappliedList.length,
      highly: unappliedList.filter(m => m.score >= 85).length,
      qualified: unappliedList.filter(m => m.score >= 70).length,
      applied: applications.filter(a => a.jobId === activeJob.id).length,
      unapplied: unappliedList.length,
      invited: unappliedList.filter(item => item.isInvited).length,
    };
  }, [activeJob, allCandidateEvaluations, applications]);

  // 2. ACTIVE APPLICANTS PIPELINE (Applied Candidates Only)
  const rankedApplicants = useMemo(() => {
    if (!effectiveJobId) return [];

    const rawApps = applications.filter(a => a.jobId === effectiveJobId);

    const mapped = rawApps.map(app => {
      const seeker = jobSeekers.find(s => s.id === app.jobSeekerId);
      const atsResult = app.atsResult || (seeker && activeJob ? evaluateResumeForAts(seeker, activeJob) : undefined);
      const atsScore = app.atsScore || atsResult?.score || 90;
      return { app, seeker, atsResult, atsScore };
    });

    const filtered = mapped.filter(item => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'applied' || (statusFilter as string) === 'submitted') {
        return ['applied', 'submitted'].includes(item.app.currentStatus);
      }
      if (statusFilter === 'reviewed' || (statusFilter as string) === 'under_review' || (statusFilter as string) === 'qualified' || (statusFilter as string) === 'shortlisted') {
        return ['under_review', 'ats_screened', 'reviewed', 'qualified', 'shortlisted', 'for_final_review'].includes(item.app.currentStatus);
      }
      if (statusFilter === 'interview' || (statusFilter as string) === 'interview_scheduled') {
        return ['for_interview', 'interview_scheduled', 'interview_completed'].includes(item.app.currentStatus);
      }
      if (statusFilter === 'hired') {
        return item.app.currentStatus === 'hired';
      }
      if (statusFilter === 'rejected') {
        return ['rejected', 'not_selected'].includes(item.app.currentStatus);
      }
      return item.app.currentStatus === statusFilter;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'ats') {
        return b.atsScore - a.atsScore;
      }
      return (b.app.matchScore || 0) - (a.app.matchScore || 0);
    });
  }, [applications, effectiveJobId, jobSeekers, activeJob, statusFilter, sortBy]);

  const allJobApps = applications.filter(a => a.jobId === effectiveJobId);
  const statusCounts = {
    all: allJobApps.length,
    applied: allJobApps.filter(a => ['applied', 'submitted'].includes(a.currentStatus)).length,
    reviewed: allJobApps.filter(a => ['under_review', 'ats_screened', 'reviewed', 'qualified', 'shortlisted', 'for_final_review'].includes(a.currentStatus)).length,
    interview: allJobApps.filter(a => ['for_interview', 'interview_scheduled', 'interview_completed'].includes(a.currentStatus)).length,
    hired: allJobApps.filter(a => a.currentStatus === 'hired').length,
    rejected: allJobApps.filter(a => ['rejected', 'not_selected'].includes(a.currentStatus)).length,
  };

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    updateApplicationStatus(appId, newStatus);
  };

  const handleInvite = (seekerId: string, customNote?: string) => {
    if (!activeJob) return;
    inviteCandidateToApply(activeJob.id, seekerId, customNote);
    setScoutTargetSeekerId(null);
    setScoutMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              Automated Candidate Ranking Engine
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Roxas, Oriental Mindoro
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Candidate Ranking & Evaluation Center
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Roxas job seekers automatically classified and ranked by E-Hanap's 5-Node Decision Tree algorithm against verified vacancy requirements.
          </p>
        </div>

        {/* Job Selection Dropdown */}
        <div className="w-full sm:w-auto min-w-[280px]">
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Job Posting</label>
          <select
            value={effectiveJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-900 shadow-2xs focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer"
          >
            {myJobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.status === 'active' ? 'Active' : 'Pending'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Metrics Summary */}
      {activeJob && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Registered Pool</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1.5 tabular-nums">{poolCounts.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Candidates in Roxas pool</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Highly Qualified</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-1.5 tabular-nums">{poolCounts.highly}</p>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Score &ge; 85% match</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Applications Received</span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-blue-600 mt-1.5 tabular-nums">{poolCounts.applied}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">In recruitment pipeline</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Proactive Invites</span>
              <Send className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1.5 tabular-nums">{poolCounts.invited}</p>
            <p className="text-[11px] text-amber-700 font-bold mt-0.5">Sent to unapplied talent</p>
          </div>
        </div>
      )}

      {/* Main View Mode Switcher Tabs: 1. Applicants (Actual Applied) vs 2. Recommended Talent (AI Matches - Unapplied) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveViewTab('pipeline')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeViewTab === 'pipeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeViewTab === 'pipeline' ? 'text-indigo-400' : 'text-slate-500'}`} />
          <span>Applicants ({allJobApps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('ranking_roster')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeViewTab === 'ranking_roster'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeViewTab === 'ranking_roster' ? 'text-emerald-400' : 'text-blue-600'}`} />
          <span>Recommended Talent (AI Matches) ({poolCounts.unapplied})</span>
        </button>
      </div>

      {/* Content depending on Active Tab */}
      {!activeJob ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Job Vacancy Selected</h3>
          <p className="text-xs text-slate-500 mt-1">Select an active job vacancy to view ranked candidates and applicants.</p>
        </div>
      ) : activeViewTab === 'ranking_roster' ? (

        /* =============================================================== */
        /* TAB 1: AUTOMATED CANDIDATE RANKING ROSTER (ALL REGISTERED POOL) */
        /* =============================================================== */
        <div className="space-y-4">
          
          {/* Controls Strip: Search, Filter Chips & Sort Selector */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate by name, degree, skills, or barangay..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-xs font-semibold text-slate-500">Sort By:</span>
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setSortBy('match')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-50 ${
                      sortBy === 'match' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Decision Tree Match
                  </button>
                  <button
                    onClick={() => setSortBy('ats')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 ${
                      sortBy === 'ats' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Cpu className="w-3 h-3 text-emerald-600" />
                    <span>ATS Grade</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setRosterFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  rosterFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Unapplied Matches ({poolCounts.unapplied})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('highly_qualified')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  rosterFilter === 'highly_qualified' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Highly Qualified ≥85% ({poolCounts.highly})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('qualified')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  rosterFilter === 'qualified' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Qualified ≥70% ({poolCounts.qualified})
              </button>
              <button
                type="button"
                onClick={() => setRosterFilter('invited')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  rosterFilter === 'invited' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Scouted (Awaiting Seeker) ({poolCounts.invited})
              </button>
            </div>
          </div>

          {/* Table / Cards List */}
          {candidateRankingPool.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Candidates Match Filter Criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting the filter chips or clearing your search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                <span>Displaying <strong className="text-slate-900">{candidateRankingPool.length}</strong> ranked candidates</span>
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sorted Descending by {sortBy === 'ats' ? 'ATS Resume Score' : 'Decision Tree Compatibility'}
                </span>
              </div>

              {candidateRankingPool.map(({ seeker, matchResult, score, outcome, existingApp, isInvited, atsResult, atsScore }, index) => {
                const rank = index + 1;
                const isExpanded = expandedApplicantId === seeker.id;

                const subScores = [
                  { label: 'Skills Overlap', weight: '35%', score: matchResult.skillsMatchScore },
                  { label: 'Degree Alignment', weight: '25%', score: matchResult.degreeAlignmentScore },
                  { label: 'Work Experience', weight: '20%', score: matchResult.experienceMatchScore },
                  { label: 'Educational Attainment', weight: '12%', score: matchResult.educationMatchScore },
                  { label: 'TESDA & Certifications', weight: '8%', score: matchResult.certificationsMatchScore },
                ];

                return (
                  <div
                    key={seeker.id}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      
                      {/* Candidate info & rank */}
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        {/* Rank Badge */}
                        <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-2xs tabular-nums ${
                          rank === 1 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200' :
                          rank === 2 ? 'bg-slate-300 text-slate-900' :
                          rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          #{rank}
                        </div>

                        {(seeker.profilePicture || seeker.avatarUrl) ? (
                          <img
                            src={seeker.profilePicture || seeker.avatarUrl}
                            alt={`${seeker.firstName} ${seeker.lastName}`}
                            className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 shrink-0" />
                        )}

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-slate-900 uppercase">
                                {seeker.firstName} {seeker.lastName}
                              </h3>
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

                              {isInvited ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  Scouted (Awaiting Seeker)
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  Not Yet Applied
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 mt-0.5 font-medium uppercase">
                              {seeker.primaryDegree || seeker.educationalAttainment || 'QUALIFIED CANDIDATE'} • {seeker.educationalAttainment || 'REGISTERED SEEKER'} • {seeker.municipality || 'ROXAS'}, ORIENTAL MINDORO
                            </p>
                          </div>
                        </div>

                        {/* Scores & Quick Trigger Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap self-stretch lg:self-center justify-between lg:justify-end">
                          
                          {/* Score badges */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-slate-900 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-xl font-black text-xs shadow-inner">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="tabular-nums font-bold">{score}% Match</span>
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedApplicantId(isExpanded ? null : seeker.id)}
                              className={`inline-flex items-center gap-1 border px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer ${
                                isExpanded 
                                  ? 'bg-indigo-600 text-white border-indigo-700' 
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                              }`}
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${isExpanded ? 'text-indigo-200' : 'text-indigo-600'}`} />
                              <span>{isExpanded ? 'Hide Sub-Scores' : 'Explain Match (AI)'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedReportTarget({
                                seekerId: seeker.id,
                                jobId: activeJob.id,
                              })}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-300" />
                              <span>Preview Profile</span>
                            </button>

                            {/* Scout / Invite to Apply Action (Strictly no Hiring Status or Schedule Interview until seeker applies) */}
                            {isInvited ? (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl inline-flex items-center gap-1 cursor-not-allowed opacity-90"
                              >
                                <Check className="w-3.5 h-3.5 text-amber-600" />
                                <span>Scouted (Awaiting Seeker)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (scoutTargetSeekerId === seeker.id) {
                                    setScoutTargetSeekerId(null);
                                  } else {
                                    setScoutTargetSeekerId(seeker.id);
                                    setScoutMessage('');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Scout / Invite to Apply</span>
                              </button>
                            )}
                          </div>

                        </div>

                      </div>

                      {/* Optional Short Message Input Drawer for Scouting */}
                      {scoutTargetSeekerId === seeker.id && !isInvited && (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950">
                              Send Scout Invitation to {(seeker.firstName + ' ' + seeker.lastName).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              Seeker will be notified to accept &amp; submit their resume
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={scoutMessage}
                              onChange={e => setScoutMessage(e.target.value)}
                              placeholder={`Optional short message (e.g. "Your ${seeker.primaryDegree || 'profile'} is a strong fit for our ${activeJob.title} role! Please apply.")`}
                              className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setScoutTargetSeekerId(null)}
                                className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInvite(seeker.id, scoutMessage)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Invitation</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Category-Level Match Percentages & Profile Preview Details (No Hiring Status dropdown for unapplied talent) */}
                      <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {subScores.map(sub => (
                            <div key={sub.label} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-slate-500 truncate">{sub.label}</span>
                                <span className="font-black text-slate-900 tabular-nums">{Math.round(sub.score)}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    sub.score >= 80 ? 'bg-emerald-500' : sub.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(4, sub.score))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-500 mr-1">Skills:</span>
                            {(seeker.technicalSkills || []).slice(0, 6).map(skill => (
                              <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-semibold text-[11px] uppercase">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">
                            Experience: {seeker.workExperience?.length || 0} Record(s)
                          </span>
                        </div>
                      </div>

                    {/* Inline Explainable AI Sub-Scores Drawer */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 rounded-2xl border border-indigo-100 shadow-inner space-y-4 motion-safe:animate-in motion-safe:fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2.5">
                          <div>
                            <h4 className="text-xs font-black text-slate-900">
                              Decision Tree Node Scoring Evaluation
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Five-factor mathematical decomposition according to municipal labor requirements
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            Overall Fit: {score}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {subScores.map(sub => (
                            <div key={sub.label} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">{sub.label} ({sub.weight})</span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  sub.score >= 80 ? 'bg-emerald-50 text-emerald-800' :
                                  sub.score >= 50 ? 'bg-amber-50 text-amber-800' :
                                  'bg-rose-50 text-rose-800'
                                }`}>
                                  {sub.score}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    sub.score >= 80 ? 'bg-emerald-500' :
                                    sub.score >= 50 ? 'bg-amber-500' :
                                    'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(4, sub.score))}%` }}
                                />
                              </div>
                            </div>
                          ))}

                          <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col justify-between">
                            <span className="text-xs font-bold text-indigo-300">PESO Roxas Summary</span>
                            <p className="text-[11px] text-slate-200 mt-1 line-clamp-2">
                              {matchResult.decisionReason}
                            </p>
                          </div>
                        </div>

                        {/* Strengths & Missing Quals */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start gap-3 text-xs">
                          <div className="flex-1 space-y-1">
                            <span className="font-bold text-emerald-800 block">Satisfied Criteria:</span>
                            <div className="flex flex-wrap gap-1">
                              {(matchResult.matchedReasons || []).slice(0, 3).map((r, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{r}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {(matchResult.missingQualifications || []).length > 0 && (
                            <div className="flex-1 space-y-1">
                              <span className="font-bold text-amber-800 block">Qualification Gaps:</span>
                              <div className="flex flex-wrap gap-1">
                                {matchResult.missingQualifications.slice(0, 2).map((m, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{m}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>

      ) : (

        /* =============================================================== */
        /* TAB 2: ACTIVE APPLICANTS PIPELINE (APPLIED RESUMES)            */
        /* =============================================================== */
        <div className="space-y-4">
          
          {/* Controls Strip: Filter Chips & Sort Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            
            {/* Status Tabs: 1. Applied ↓ 2. Reviewed ↓ 3. Interview Scheduled ↓ 4a. Accepted/Hired / 4b. Rejected */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50 ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setStatusFilter('applied')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50 ${
                  statusFilter === 'applied' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Applied ({statusCounts.applied})
              </button>
              <button
                onClick={() => setStatusFilter('reviewed')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50 ${
                  statusFilter === 'reviewed' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Reviewed ({statusCounts.reviewed})
              </button>
              <button
                onClick={() => setStatusFilter('interview')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50 ${
                  statusFilter === 'interview' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Interview Scheduled ({statusCounts.interview})
              </button>
              <button
                onClick={() => setStatusFilter('hired')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50 ${
                  statusFilter === 'hired' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Accepted / Hired ({statusCounts.hired})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50 ${
                  statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Rejected ({statusCounts.rejected})
              </button>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-xs font-semibold text-slate-500">Sort By:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                <button
                  onClick={() => setSortBy('match')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-50 ${
                    sortBy === 'match' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Decision Tree Match
                </button>
                <button
                  onClick={() => setSortBy('ats')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 ${
                    sortBy === 'ats' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Cpu className="w-3 h-3 text-emerald-600" />
                  <span>ATS Resume Score</span>
                </button>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
            <span>Showing <strong className="text-slate-900">{rankedApplicants.length}</strong> applicants</span>
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortBy === 'ats' ? 'Ranked by Resume ATS Grade' : 'Ranked by Decision Tree Match'}
            </span>
          </div>

          {rankedApplicants.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Applicants in This Pipeline Stage</h3>
              <p className="text-xs text-slate-500 mt-1">Review the Candidate Ranking Roster to invite qualified candidates from the Roxas pool.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rankedApplicants.map(({ app, seeker, atsResult, atsScore }, index) => {
                const rank = index + 1;

                return (
                  <div
                    key={app.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs tabular-nums ${
                          rank === 1 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200' :
                          rank === 2 ? 'bg-slate-300 text-slate-900' :
                          rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          #{rank}
                        </div>

                        {seeker?.profilePicture ? (
                          <img
                            src={seeker.profilePicture}
                            alt={app.applicantName}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 shrink-0" />
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{app.applicantName}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                              (app.decisionTreeOutcome || app.matchResult?.outcome || '') === 'HIGHLY_QUALIFIED' || (app.decisionTreeOutcome || app.matchResult?.outcome || '') === 'HIGHLY QUALIFIED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                              (app.decisionTreeOutcome || app.matchResult?.outcome || '') === 'QUALIFIED' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                              'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {(app.decisionTreeOutcome || app.matchResult?.outcome || 'QUALIFIED').replace(/_/g, ' ')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {seeker?.primaryDegree || seeker?.educationalAttainment || 'Qualified Candidate'} • {seeker?.municipality || 'Oriental Mindoro'}
                          </p>
                        </div>
                      </div>

                      {/* Match & ATS Scores + Action Triggers */}
                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-900 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-xl font-black text-xs shadow-inner">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="tabular-nums font-bold">{app.matchScore}% Match</span>
                        </span>

                        <button
                          onClick={() => setSelectedAtsApplicant({ app, seeker, atsResult, atsScore })}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl font-black text-xs transition-colors shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Open Applicant Tracking System (ATS) Audit & Resume Screening"
                        >
                          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="tabular-nums font-bold">ATS: {atsScore}% ({atsResult?.grade || 'A'})</span>
                        </button>

                        <button
                          onClick={() => setSelectedReportTarget({ applicationId: app.id })}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                          <span>Match Report</span>
                        </button>
                      </div>

                    </div>

                    {/* Category-Level Qualification Breakdown */}
                    {app.matchResult && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
                        {[
                          { label: 'Skills', score: app.matchResult.skillsMatchScore ?? 80 },
                          { label: 'Education', score: app.matchResult.educationMatchScore ?? 85 },
                          { label: 'Degree', score: app.matchResult.degreeAlignmentScore ?? 80 },
                          { label: 'Experience', score: app.matchResult.experienceMatchScore ?? 75 },
                          { label: 'Certifications', score: app.matchResult.certificationsMatchScore ?? 75 },
                        ].map((catItem) => (
                          <div key={catItem.label} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-slate-500">{catItem.label}</span>
                              <span className="font-black text-slate-900 tabular-nums">{Math.round(catItem.score)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  catItem.score >= 80 ? 'bg-emerald-500' : catItem.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(4, catItem.score))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Candidate Recruitment Pipeline Flowchart */}
                    <ApplicationStatusTracker
                      application={app}
                      jobTitle={activeJob?.title}
                      candidateName={app.applicantName}
                      appliedDate={app.appliedDate}
                      matchScore={app.matchScore}
                      isEmployer={true}
                      onUpdateStatus={(newStatus) => handleStatusChange(app.id, newStatus)}
                      onScheduleInterview={() => setSelectedInterviewAppId(app.id)}
                    />

                    {/* Actions Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-600">Current Status:</span>
                        <select
                          value={
                            ['applied', 'submitted'].includes(app.currentStatus) ? 'applied' :
                            ['under_review', 'ats_screened', 'reviewed', 'qualified', 'shortlisted', 'for_final_review'].includes(app.currentStatus) ? 'reviewed' :
                            ['for_interview', 'interview_scheduled', 'interview_completed'].includes(app.currentStatus) ? 'interview_scheduled' :
                            app.currentStatus === 'hired' ? 'hired' : 'rejected'
                          }
                          onChange={e => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className={`px-2.5 py-1 border rounded-lg font-bold text-xs transition-colors ${
                            app.currentStatus === 'rejected' || app.currentStatus === 'not_selected'
                              ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                              : app.currentStatus === 'hired'
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        >
                          <option value="applied">Applied</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="interview_scheduled">Interview Scheduled</option>
                          <option value="hired">Accepted / Hired</option>
                          <option value="rejected" className="text-rose-700 font-bold bg-rose-50">Rejected (Finished)</option>
                        </select>

                        {(app.currentStatus === 'rejected' || app.currentStatus === 'not_selected') && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Finished • Rejected
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedInterviewAppId(app.id)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Schedule Interview</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(app.id, 'hired')}
                          className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors cursor-pointer active:scale-95 disabled:opacity-50 ${
                            app.currentStatus === 'hired'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          Accept / Hire
                        </button>

                        <button
                          onClick={() => handleStatusChange(app.id, 'rejected')}
                          className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors cursor-pointer active:scale-95 disabled:opacity-50 ${
                            app.currentStatus === 'rejected' || app.currentStatus === 'not_selected'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {app.currentStatus === 'rejected' || app.currentStatus === 'not_selected' ? 'Rejected (Finished)' : 'Reject'}
                        </button>

                        <button
                          onClick={() => {
                            setFeedbackApp(app);
                            setFeedbackRating(app.feedback?.rating || 5);
                            setFeedbackComment(app.feedback?.comment || '');
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>{app.feedback ? `Feedback (${app.feedback.rating}★)` : 'Rate & Feedback'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Status History Trail Preview */}
                    {app.statusHistory && app.statusHistory.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Last status change: <strong className="text-slate-800 capitalize">{app.statusHistory[app.statusHistory.length - 1].status.replace(/_/g, ' ')}</strong>
                            {app.statusHistory[app.statusHistory.length - 1].notes ? ` — "${app.statusHistory[app.statusHistory.length - 1].notes}"` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStatusModalApp(app)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                        >
                          View Full Log ({app.statusHistory.length})
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>

      )}

      {/* Match Report Modal */}
      {selectedReportTarget && (
        <ApplicantMatchReportModal
          applicationId={selectedReportTarget.applicationId}
          seekerId={selectedReportTarget.seekerId}
          jobId={selectedReportTarget.jobId}
          onClose={() => setSelectedReportTarget(null)}
          onScheduleInterview={(appId) => {
            setSelectedReportTarget(null);
            setSelectedInterviewAppId(appId);
          }}
          onInviteCandidate={(sId, jId) => {
            inviteCandidateToApply(jId, sId);
          }}
        />
      )}

      {/* Schedule Interview Modal */}
      {selectedInterviewAppId && (
        <ScheduleInterviewModal
          applicationId={selectedInterviewAppId}
          onClose={() => setSelectedInterviewAppId(null)}
        />
      )}

      {/* ATS Resume Audit & Screening Modal */}
      {selectedAtsApplicant && (
        <AtsResumeModal
          isOpen={Boolean(selectedAtsApplicant)}
          onClose={() => setSelectedAtsApplicant(null)}
          candidateName={selectedAtsApplicant.app?.applicantName || `${selectedAtsApplicant.seeker.firstName} ${selectedAtsApplicant.seeker.lastName}`}
          jobTitle={activeJob?.title}
          companyName={activeJob?.companyName}
          resumeFileName={selectedAtsApplicant.seeker?.resumes?.[0]?.fileName || 'Candidate_Resume.pdf'}
          atsResult={
            selectedAtsApplicant.atsResult ||
            evaluateResumeForAts(
              selectedAtsApplicant.seeker,
              activeJob
            )
          }
          isEmployer={true}
          onAdvanceStatus={() => {
            if (selectedAtsApplicant.app) {
              handleStatusChange(selectedAtsApplicant.app.id, 'shortlisted');
            }
            setSelectedAtsApplicant(null);
          }}
        />
      )}

      {/* Candidate Feedback & Rating Modal */}
      {feedbackApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Candidate Evaluation & Rating</h3>
                <p className="text-[11px] text-slate-500">Candidate: {feedbackApp.applicantName}</p>
              </div>
              <button
                onClick={() => setFeedbackApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Overall Interview Score</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-amber-700 ml-2">{feedbackRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualitative Remarks & Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="Record interview notes, technical readiness, soft skills, or hiring recommendation..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFeedbackApp(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  submitApplicationFeedback(feedbackApp.id, {
                    rating: feedbackRating,
                    comment: feedbackComment || 'Good overall candidate interview performance.',
                    submittedBy: currentEmployerProfile.companyName,
                  });
                  setFeedbackApp(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Evaluation & Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employer Candidate Status Update & Remarks Modal */}
      {selectedStatusModalApp && (
        <EmployerStatusUpdateModal
          isOpen={Boolean(selectedStatusModalApp)}
          onClose={() => setSelectedStatusModalApp(null)}
          application={selectedStatusModalApp}
          candidateName={selectedStatusModalApp.applicantName}
          jobTitle={activeJob?.title}
          onOpenScheduleInterview={() => {
            const appId = selectedStatusModalApp.id;
            setSelectedStatusModalApp(null);
            setSelectedInterviewAppId(appId);
          }}
        />
      )}

    </div>
  );
};
