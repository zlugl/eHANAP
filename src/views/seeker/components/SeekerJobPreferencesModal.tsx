import React from 'react';
import { X, Eye } from 'lucide-react';
import { JOB_CATEGORIES } from '../../../constants';

export interface SeekerJobPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  availability: 'actively_looking' | 'open_to_offers' | 'not_looking';
  onAvailabilityChange: (status: 'actively_looking' | 'open_to_offers' | 'not_looking') => void;
  categories: string[];
  onCategoriesChange: React.Dispatch<React.SetStateAction<string[]>>;
  minSalary: string;
  onMinSalaryChange: (val: string) => void;
  onSave: () => void;
}

export const SeekerJobPreferencesModal: React.FC<SeekerJobPreferencesModalProps> = ({
  isOpen,
  onClose,
  availability,
  onAvailabilityChange,
  categories,
  onCategoriesChange,
  minSalary,
  onMinSalaryChange,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Job Seeking Status & Preferences</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Availability Toggle */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Employment Availability</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'actively_looking', label: 'Actively Looking' },
                { id: 'open_to_offers', label: 'Open to Offers' },
                { id: 'not_looking', label: 'Not Available' }
              ].map(status => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => onAvailabilityChange(status.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer font-bold active:scale-95 disabled:opacity-50 ${
                    availability === status.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Categories */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Target Categories ({categories.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {JOB_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onCategoriesChange(prev =>
                      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-50 ${
                    categories.includes(cat)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Salary */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Minimum Expected Salary</label>
            <input
              type="text"
              value={minSalary}
              onChange={e => onMinSalaryChange(e.target.value)}
              placeholder="e.g. ₱20,000 - ₱30,000 / month"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onSave();
              onClose();
            }}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
