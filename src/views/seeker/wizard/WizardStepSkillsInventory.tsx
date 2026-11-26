import React, { useState } from 'react';
import { Award, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export type SkillCategoryKey = 'trade' | 'admin' | 'service' | 'sales' | 'it' | 'soft';

interface SkillCategoryConfig {
  key: SkillCategoryKey;
  title: string;
  examples: string;
  emptyLabel: string;
  placeholder: string;
  chipClass: string;
  removeBtnClass: string;
}

const SKILL_CATEGORIES: SkillCategoryConfig[] = [
  {
    key: 'trade',
    title: 'A. Technical & Trade Skills',
    examples: 'Automotive, Electrical, Welding (SMAW), RAC, Carpentry',
    emptyLabel: 'No trade skills added (Optional — leave blank if not applicable).',
    placeholder: 'Add trade skill (e.g. Electrical Wiring, SMAW Welding)',
    chipClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    removeBtnClass: 'text-amber-600 hover:text-amber-800',
  },
  {
    key: 'admin',
    title: 'B. Administrative & Office Skills',
    examples: 'Bookkeeping, Records, Data Entry, Billing, Spreadsheets',
    emptyLabel: 'No administrative skills added (Optional — leave blank if not applicable).',
    placeholder: 'Add admin skill (e.g. Bookkeeping, Data Entry)',
    chipClass: 'bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-rule)]',
    removeBtnClass: 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
  },
  {
    key: 'service',
    title: 'C. Service, Hospitality & Culinary Skills',
    examples: 'Cooking, Baking, Food & Beverage, Housekeeping, Barista',
    emptyLabel: 'No service skills added (Optional — leave blank if not applicable).',
    placeholder: 'Add service skill (e.g. Commercial Cooking, Barista Craft)',
    chipClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    removeBtnClass: 'text-rose-600 hover:text-rose-800',
  },
  {
    key: 'sales',
    title: 'D. Sales, Commerce & Customer Facing Skills',
    examples: 'Cashiering, Inventory Stocking, POS Operation, Customer Care',
    emptyLabel: 'No sales skills added (Optional — leave blank if not applicable).',
    placeholder: 'Add sales skill (e.g. Cashiering, Inventory Management)',
    chipClass: 'bg-teal-50 text-teal-800 border border-teal-200',
    removeBtnClass: 'text-teal-600 hover:text-teal-800',
  },
  {
    key: 'it',
    title: 'E. Information Technology & Creative Skills',
    examples: 'React, JavaScript, Node.js, AutoCAD, Photoshop, IT Support',
    emptyLabel: 'No IT skills added (Optional — leave blank if not applicable).',
    placeholder: 'Add IT skill (e.g. React.js, Python, AutoCAD)',
    chipClass: 'bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-rule)]',
    removeBtnClass: 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
  },
  {
    key: 'soft',
    title: 'F. Soft Skills & Foundational Competencies',
    examples: 'Clear Communication, Teamwork, Leadership, Time Management',
    emptyLabel: 'No soft skills added (Optional — leave blank if not applicable).',
    placeholder: 'Add soft skill (e.g. Critical Thinking, Work Ethic)',
    chipClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    removeBtnClass: 'text-emerald-600 hover:text-emerald-800',
  },
];

export interface WizardStepSkillsInventoryProps {
  skillsByCategory: Record<SkillCategoryKey, string[]>;
  totalEnteredSkills: number;
  onAddSkill: (category: SkillCategoryKey, skill: string) => void;
  onRemoveSkill: (category: SkillCategoryKey, skill: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WizardStepSkillsInventory: React.FC<WizardStepSkillsInventoryProps> = ({
  skillsByCategory,
  totalEnteredSkills,
  onAddSkill,
  onRemoveSkill,
  onBack,
  onNext,
}) => {
  const [inputs, setInputs] = useState<Record<SkillCategoryKey, string>>({
    trade: '',
    admin: '',
    service: '',
    sales: '',
    it: '',
    soft: '',
  });

  const handleSubmitSkill = (key: SkillCategoryKey) => {
    const trimmed = inputs[key].trim();
    if (!trimmed) return;
    onAddSkill(key, trimmed);
    setInputs(prev => ({ ...prev, [key]: '' }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8 space-y-6"
    >
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] flex items-start gap-3">
        <Award className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[var(--color-ink)] font-display">
                Skills Inventory across Categories
              </h3>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Optional • Not All Required
              </span>
            </div>
            <span className="text-xs tabular-nums text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-rule)] px-2.5 py-1 rounded-lg">
              {totalEnteredSkills} skill{totalEnteredSkills === 1 ? '' : 's'} recorded
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
            Review skills extracted from your resume or add additional competencies across the 6 PESO skill categories below.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {SKILL_CATEGORIES.map((cat) => {
          const list = skillsByCategory[cat.key];
          return (
            <div key={cat.key} className="bg-[var(--color-paper-warm)] p-3.5 rounded-xl border border-[var(--color-rule)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--color-ink)]">{cat.title}</span>
                  <span className="text-[10px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-rule)]">Optional</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)]">{cat.examples}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {list.map(s => (
                  <span key={s} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cat.chipClass}`}>
                    {s}
                    <button
                      type="button"
                      onClick={() => onRemoveSkill(cat.key, s)}
                      className={`${cat.removeBtnClass} cursor-pointer`}
                      aria-label={`Remove ${s}`}
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {list.length === 0 && (
                  <span className="text-xs text-[var(--color-ink-muted)] italic">{cat.emptyLabel}</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputs[cat.key]}
                  onChange={e => setInputs(prev => ({ ...prev, [cat.key]: e.target.value.toUpperCase() }))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSubmitSkill(cat.key))}
                  placeholder={cat.placeholder}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleSubmitSkill(cat.key)}
                  className="btn btn--quiet px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--color-rule)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls for Step 3 */}
      <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--quiet px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Review & Edit</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn btn--primary px-6 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
        >
          <span>Proceed to Job Preferences</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
};
