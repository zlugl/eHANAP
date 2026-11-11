import React from 'react';
import {
  Sparkles,
  Upload,
  Printer,
  Settings,
  Edit2,
  Cpu,
  FileText
} from 'lucide-react';

export interface SeekerCareerToolsGridProps {
  profileCompleteness: number;
  onOpenResumeBuilder: () => void;
  onOpenResumeUpload: () => void;
  onOpenPDFExport: () => void;
  onOpenSettings: () => void;
  onOpenEditPersonalInfo: () => void;
  onRunAtsAudit: () => void;
  onViewFullProfile: () => void;
}

export const SeekerCareerToolsGrid: React.FC<SeekerCareerToolsGridProps> = ({
  profileCompleteness,
  onOpenResumeBuilder,
  onOpenResumeUpload,
  onOpenPDFExport,
  onOpenSettings,
  onOpenEditPersonalInfo,
  onRunAtsAudit,
  onViewFullProfile
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Profile Tools & Document Actions
          </h3>
          <p className="text-[11px] text-slate-500">Quick actions to customize, manage, and download your profile</p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 tabular-nums">
          {profileCompleteness}% Complete
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onOpenResumeBuilder}
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 text-left transition-colors cursor-pointer group hover:shadow-2xs active:scale-95 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Resume Builder</p>
            <p className="text-[10px] text-slate-500 truncate">Create & tailor</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenResumeUpload}
          className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 text-left transition-colors cursor-pointer group hover:shadow-2xs active:scale-95 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Upload className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Upload Bio-Data</p>
            <p className="text-[10px] text-slate-500 truncate">PDF / Word CV</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenPDFExport}
          className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 text-left transition-colors cursor-pointer group hover:shadow-2xs active:scale-95 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Printer className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Export PDF</p>
            <p className="text-[10px] text-slate-500 truncate">Print / Download</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer group hover:shadow-2xs active:scale-95 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
            <Settings className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Settings</p>
            <p className="text-[10px] text-slate-500 truncate">Preferences</p>
          </div>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onOpenEditPersonalInfo}
          className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Personal Information</span>
        </button>
        <button
          type="button"
          onClick={onRunAtsAudit}
          className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>ATS Hygiene Check</span>
        </button>
        <button
          type="button"
          onClick={onViewFullProfile}
          className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Full Bio-Data Modal</span>
        </button>
      </div>
    </div>
  );
};
