import React from 'react';
import { Plus, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { EducationRecord } from '../../../../types';

export interface EducationSectionProps {
  educationList: any[];
  onOpenAddEdu: () => void;
  onOpenEditEdu: (record: any) => void;
  onDeleteEdu: (id: string) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  educationList = [],
  onOpenAddEdu,
  onOpenEditEdu,
  onDeleteEdu
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Educational Background</h4>
          <p className="text-xs text-slate-500">Record your degrees, college, or TVET programs</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddEdu}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>

      {educationList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No education records yet</p>
          <p className="text-[11px] text-slate-400 mt-1">Click "Add Education" to record your academic qualifications.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {educationList.map(edu => (
            <div
              key={edu.id}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{edu.degreeCourse || edu.degree}</p>
                <p className="text-xs text-slate-600">
                  {edu.school} • Class of {edu.yearGraduated}
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {edu.educationalAttainment || edu.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenEditEdu(edu)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-white cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEdu(edu.id)}
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
