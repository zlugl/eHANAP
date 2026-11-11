import React, { useState } from 'react';

export interface SkillsSectionProps {
  technicalSkills?: string[];
  softSkills?: string[];
  onAddTechnicalSkill: (skill: string) => void;
  onRemoveTechnicalSkill: (skill: string) => void;
  onRemoveSoftSkill: (skill: string) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  technicalSkills = [],
  softSkills = [],
  onAddTechnicalSkill,
  onRemoveTechnicalSkill,
  onRemoveSoftSkill
}) => {
  const [newSkill, setNewSkill] = useState('');

  const handleAdd = () => {
    if (!newSkill.trim()) return;
    onAddTechnicalSkill(newSkill.trim());
    setNewSkill('');
  };

  return (
    <div className="space-y-5 text-xs">
      <div>
        <h4 className="font-bold text-slate-900 text-sm">Skills & Competencies</h4>
        <p className="text-xs text-slate-500">Skills are parsed for Decision Tree keyword match scoring</p>
      </div>

      {/* Add Skill Form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add technical or practical skill (e.g. QuickBooks, Welding)..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
        >
          Add Skill
        </button>
      </div>

      {/* Current Technical Skills Tags */}
      <div>
        <label className="block font-bold text-slate-700 mb-1.5">
          Technical & Hard Skills ({technicalSkills.length})
        </label>
        <div className="flex flex-wrap gap-1.5">
          {technicalSkills.length === 0 ? (
            <p className="text-slate-400 italic">No technical skills recorded yet.</p>
          ) : (
            technicalSkills.map(s => (
              <span
                key={s}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTechnicalSkill(s)}
                  className="text-indigo-400 hover:text-rose-600 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Soft Skills Tags */}
      <div>
        <label className="block font-bold text-slate-700 mb-1.5">
          Soft & Leadership Skills ({softSkills.length})
        </label>
        <div className="flex flex-wrap gap-1.5">
          {softSkills.length === 0 ? (
            <p className="text-slate-400 italic">No soft skills recorded yet.</p>
          ) : (
            softSkills.map(s => (
              <span
                key={s}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSoftSkill(s)}
                  className="text-emerald-400 hover:text-rose-600 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
