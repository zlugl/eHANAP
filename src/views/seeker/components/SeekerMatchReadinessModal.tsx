import React from 'react';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';

export interface ValidationCriterion {
  id: string;
  label: string;
  detail: string;
  isComplete: boolean;
  action: () => void;
}

export interface SeekerMatchReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileCompleteness: number;
  validationCriteria: ValidationCriterion[];
  onCompleteMissing?: () => void;
}

export const SeekerMatchReadinessModal: React.FC<SeekerMatchReadinessModalProps> = ({
  isOpen,
  onClose,
  profileCompleteness,
  validationCriteria,
  onCompleteMissing
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Profile Analytics & Readiness</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Score Indicator */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">Profile Completeness</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">{profileCompleteness}%</p>
              <p className="text-[11px] text-slate-500 mt-1">High completeness boosts your Decision Tree Match ranking.</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center tabular-nums">
              {profileCompleteness}%
            </div>
          </div>

          {/* Step 9 Validation Checklist */}
          <div>
            <p className="font-bold text-slate-800 mb-2">Decision Tree Match Validation (Step 9)</p>
            <div className="space-y-2">
              {validationCriteria.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onClose();
                    item.action();
                  }}
                  className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.detail}</p>
                  </div>
                  {item.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Missing</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {onCompleteMissing && (
            <button
              onClick={() => {
                onClose();
                onCompleteMissing();
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Complete Missing Information
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
