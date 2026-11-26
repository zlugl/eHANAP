import React from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  PRESET_CATEGORIES,
  PRESET_LOCATIONS,
  PRESET_EMPLOYMENT_TYPES,
  PRESET_SALARIES,
} from './wizardConstants';

export interface WizardStepJobPreferencesProps {
  selectedCategories: string[];
  selectedLocations: string[];
  selectedEmpTypes: string[];
  selectedSalary: string;
  onToggleCategory: (label: string) => void;
  onToggleLocation: (label: string) => void;
  onToggleEmpType: (label: string) => void;
  onSalaryChange: (salary: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WizardStepJobPreferences: React.FC<WizardStepJobPreferencesProps> = ({
  selectedCategories,
  selectedLocations,
  selectedEmpTypes,
  selectedSalary,
  onToggleCategory,
  onToggleLocation,
  onToggleEmpType,
  onSalaryChange,
  onBack,
  onNext,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 space-y-8"
    >
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display">
          Select Your Preferred Career Directions
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1">
          Job preferences are manually chosen here rather than extracted from your resume. Select your target industries, locations, and employment types.
        </p>
      </div>

      {/* 1. Preferred Job Category */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[var(--color-ink)]">
          1. Preferred Job Categories & Vocational Tracks <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Select all categories and tracks you are willing to work in:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {PRESET_CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat.label);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleCategory(cat.label)}
                className={`p-3 rounded-xl text-left border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                  isSelected
                    ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]'
                }`}
              >
                <div>
                  <div className="leading-snug">{cat.label}</div>
                  <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">{cat.group}</span>
                </div>
                <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)]'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Preferred Location */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-rule)]">
        <label className="block text-xs font-semibold text-[var(--color-ink)]">
          2. Preferred Working Locations <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Select municipalities, specific barangays, provincial, or flexible arrangements:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {PRESET_LOCATIONS.map(loc => {
            const isSelected = selectedLocations.includes(loc.label);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onToggleLocation(loc.label)}
                className={`p-3 rounded-xl text-left border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                  isSelected
                    ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]'
                }`}
              >
                <div>
                  <div className="leading-snug">{loc.label}</div>
                  <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">{loc.group}</span>
                </div>
                <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)]'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferred Employment Type */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-rule)]">
        <label className="block text-xs font-semibold text-[var(--color-ink)]">
          3. Preferred Employment Types & Working Arrangements <span className="text-rose-500">*</span>
        </label>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Choose your preferred terms of employment:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESET_EMPLOYMENT_TYPES.map(emp => {
            const isSelected = selectedEmpTypes.includes(emp.label);
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => onToggleEmpType(emp.label)}
                className={`p-3.5 rounded-xl text-left border text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                  isSelected
                    ? 'bg-[var(--color-paper-warm)] border-[var(--color-accent)] text-[var(--color-ink)] font-bold ring-1 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-paper)] border-[var(--color-rule)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{emp.label}</div>
                  <span className="text-[11px] text-[var(--color-ink-muted)] font-normal mt-0.5 block">{emp.desc}</span>
                </div>
                <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)]'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Salary Expectations */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-rule)]">
        <label className="block text-xs font-semibold text-[var(--color-ink)]">
          4. Expected Monthly Compensation Bracket
        </label>
        <select
          value={selectedSalary}
          onChange={e => onSalaryChange(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
        >
          <option value="">-- Select Expected Salary Bracket --</option>
          {PRESET_SALARIES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Skills</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <span>Proceed to Profile Validation</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
};
