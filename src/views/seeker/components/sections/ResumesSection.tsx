import React from 'react';
import { Sparkles, Upload, FileText, Cpu } from 'lucide-react';

export interface ResumesSectionProps {
  resumesList: any[];
  activeResumeId?: string;
  onOpenResumeBuilder: () => void;
  onOpenUploadCV: () => void;
  onOpenAtsAudit: (resume: any) => void;
  onSetActiveResume: (resumeId: string) => void;
}

export const ResumesSection: React.FC<ResumesSectionProps> = ({
  resumesList = [],
  activeResumeId,
  onOpenResumeBuilder,
  onOpenUploadCV,
  onOpenAtsAudit,
  onSetActiveResume
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Uploaded CVs & Resumes</h4>
          <p className="text-xs text-slate-500">Manage your active resume document and inspect ATS score</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenResumeBuilder}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Build Resume</span>
          </button>
          <button
            type="button"
            onClick={onOpenUploadCV}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CV</span>
          </button>
        </div>
      </div>

      {resumesList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No resumes uploaded yet</p>
          <p className="text-[11px] text-slate-400 mt-1">Upload a PDF or generate a resume with the AI Resume Builder.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {resumesList.map(res => (
            <div
              key={res.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{res.fileName}</p>
                    {res.id === activeResumeId && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {res.fileSize} • Uploaded {res.uploadedAt ? new Date(res.uploadedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAtsAudit(res)}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ATS Check ({res.atsScore || 92}%)</span>
                </button>
                {res.id !== activeResumeId && (
                  <button
                    type="button"
                    onClick={() => onSetActiveResume(res.id)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
