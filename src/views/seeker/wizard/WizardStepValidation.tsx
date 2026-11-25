import React from 'react';
import {
  Check,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { WizardValidationResults } from './wizardConstants';

export interface WizardStepValidationProps {
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  address: string;
  barangay: string;
  municipality: string;
  educationalAttainment: string;
  primaryDegree: string;
  technicalSkillsCount: number;
  softSkillsCount: number;
  totalEnteredSkills: number;
  selectedCategoriesCount: number;
  selectedLocationsCount: number;
  selectedEmpTypesCount: number;
  validationResults: WizardValidationResults;
  isProfileValid: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export const WizardStepValidation: React.FC<WizardStepValidationProps> = ({
  firstName,
  middleName,
  lastName,
  contactNumber,
  email,
  address,
  barangay,
  municipality,
  educationalAttainment,
  primaryDegree,
  technicalSkillsCount,
  softSkillsCount,
  totalEnteredSkills,
  selectedCategoriesCount,
  selectedLocationsCount,
  selectedEmpTypesCount,
  validationResults,
  isProfileValid,
  onBack,
  onComplete,
}) => {
  const checklist = [
    {
      id: 'name',
      title: 'Full Candidate Name & Identity',
      detail: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`,
      valid: validationResults.hasName,
    },
    {
      id: 'contact',
      title: 'Contact Information & Email Verification',
      detail: `${contactNumber} • ${email}`,
      valid: validationResults.hasContact,
    },
    {
      id: 'address',
      title: 'Residential Address & Municipality',
      detail: address || `${barangay ? 'Brgy. ' + barangay + ', ' : ''}${municipality}, Oriental Mindoro`,
      valid: validationResults.hasAddress,
    },
    {
      id: 'education',
      title: 'Educational Attainment & Program / Degree',
      detail: `${educationalAttainment} in ${primaryDegree || 'Field of Study'}`,
      valid: validationResults.hasEducation,
    },
    {
      id: 'skills',
      title: 'Skills & Competencies Inventory (Optional)',
      detail: totalEnteredSkills > 0
        ? `${technicalSkillsCount} Technical/Trade skills • ${softSkillsCount} Soft competencies recorded`
        : 'No skills entered (Optional — not required to complete profile)',
      valid: true,
    },
    {
      id: 'preferences',
      title: 'Selected Career & Job Preferences',
      detail: `${selectedCategoriesCount} Categories • ${selectedLocationsCount} Locations • ${selectedEmpTypesCount} Employment Types`,
      valid: validationResults.hasPreferences,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 space-y-6"
    >
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display">
          System Qualification Check
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1">
          eHANAP Roxas verifies that your profile contains all necessary qualification parameters required for our mathematical Decision Tree matching algorithm.
        </p>
      </div>

      {/* Validation Checklist */}
      <div className="space-y-3 bg-[var(--color-paper-warm)] p-4 sm:p-5 rounded-2xl border border-[var(--color-rule)]">
        {checklist.map(item => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 p-3 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)]"
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                item.id === 'skills' && totalEnteredSkills === 0
                  ? 'bg-[var(--color-paper-warm)] text-[var(--color-ink-muted)]'
                  : item.valid
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
              }`}>
                {item.valid ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--color-ink)]">{item.title}</div>
                <div className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{item.detail}</div>
              </div>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 border ${
              item.id === 'skills'
                ? (totalEnteredSkills > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-[var(--color-paper-warm)] text-[var(--color-ink-muted)] border-[var(--color-rule)]')
                : item.valid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {item.id === 'skills'
                ? (totalEnteredSkills > 0 ? 'Recorded' : 'Optional (Skipped)')
                : item.valid ? 'Qualified' : 'Pending Info'}
            </span>
          </div>
        ))}
      </div>

      {/* Validation Status Summary */}
      {isProfileValid ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <div className="text-xs text-emerald-800">
            <span className="font-bold">All qualification criteria passed!</span> Your profile is fully prepared to execute the Decision Tree matching engine.
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Missing required information:</span> Please go back to previous steps (Step 2, 3, or 4) to fill in missing fields before proceeding.
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Preferences</span>
        </button>

        <button
          type="button"
          disabled={!isProfileValid}
          onClick={onComplete}
          className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>Complete Profile Setup & View Matching Jobs</span>
        </button>
      </div>
    </motion.div>
  );
};
