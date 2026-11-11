import React from 'react';
import { Plus, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { WorkExperienceRecord } from '../../../../types';

export interface ExperienceSectionProps {
  experienceList: any[];
  onOpenAddExp: () => void;
  onOpenEditExp: (record: any) => void;
  onDeleteExp: (id: string) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experienceList = [],
  onOpenAddExp,
  onOpenEditExp,
  onDeleteExp
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Work Experience History</h4>
          <p className="text-xs text-slate-500">Employment records evaluated by employer scoring</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddExp}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>

      {experienceList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No work experience listed</p>
          <p className="text-[11px] text-slate-400 mt-1">Include previous roles, internships, or contractual jobs.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {experienceList.map(exp => (
            <div
              key={exp.id}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{exp.position}</p>
                <p className="text-xs text-slate-600">
                  {exp.company} • {exp.startDate} to {exp.endDate || (exp.isCurrent ? 'Present' : '')}
                </p>
                {exp.responsibilities && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{exp.responsibilities}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenEditExp(exp)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-white cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteExp(exp.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
