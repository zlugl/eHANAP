import React, { useState, useEffect } from 'react';
import { X, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { EducationRecord, WorkExperienceRecord, CertificationRecord } from '../../../types';

// ==========================================
// 1. Education Modal
// ==========================================

export interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecord?: EducationRecord | null;
  onSave: (record: Omit<EducationRecord, 'id'>, id?: string) => void;
}

export const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  initialRecord,
  onSave
}) => {
  const [degree, setDegree] = useState(initialRecord?.degree || '');
  const [school, setSchool] = useState(initialRecord?.school || '');
  const [attainment, setAttainment] = useState(initialRecord?.level || "Bachelor's Degree");
  const [year, setYear] = useState<number>(initialRecord?.yearGraduated || 2024);
  const [honors, setHonors] = useState(initialRecord?.honors || '');

  useEffect(() => {
    if (initialRecord) {
      setDegree(initialRecord.degree || '');
      setSchool(initialRecord.school || '');
      setAttainment(initialRecord.level || "Bachelor's Degree");
      setYear(initialRecord.yearGraduated || 2024);
      setHonors(initialRecord.honors || '');
    } else {
      setDegree('');
      setSchool('');
      setAttainment("Bachelor's Degree");
      setYear(2024);
      setHonors('');
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        degree,
        school,
        level: attainment,
        yearGraduated: year,
        honors: honors || undefined
      },
      initialRecord?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold">{initialRecord ? 'Edit Education Record' : 'Add Education Record'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Degree / Course Name *</label>
            <input
              type="text"
              required
              value={degree}
              onChange={e => setDegree(e.target.value)}
              placeholder="e.g. BS Information Technology, TESDA Computer Systems Servicing"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">School / University / Training Center *</label>
            <input
              type="text"
              required
              value={school}
              onChange={e => setSchool(e.target.value)}
              placeholder="e.g. Mindoro State University (MinSU), Divine Word College of Calapan"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Attainment Level</label>
              <select
                value={attainment}
                onChange={e => setAttainment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Doctorate Degree">Doctorate Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="TVET / Technical Vocational">TVET / Vocational</option>
                <option value="Senior High School">Senior High School</option>
                <option value="Junior High School">Junior High School</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Year Graduated</label>
              <input
                type="number"
                min="1970"
                max="2030"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academic Honors / Awards (Optional)</label>
            <input
              type="text"
              value={honors}
              onChange={e => setHonors(e.target.value)}
              placeholder="e.g. Cum Laude, Dean's Lister, Best in Thesis"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
            >
              Save Education
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ==========================================
// 2. Experience Modal
// ==========================================

export interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecord?: WorkExperienceRecord | null;
  onSave: (record: Omit<WorkExperienceRecord, 'id'>, id?: string) => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  initialRecord,
  onSave
}) => {
  const [position, setPosition] = useState(initialRecord?.position || '');
  const [company, setCompany] = useState(initialRecord?.company || '');
  const [startDate, setStartDate] = useState(initialRecord?.startDate || '');
  const [endDate, setEndDate] = useState(initialRecord?.endDate || '');
  const [isCurrent, setIsCurrent] = useState(Boolean(initialRecord?.isCurrent));
  const [years, setYears] = useState<number>(initialRecord?.years || 1);
  const [responsibilities, setResponsibilities] = useState(initialRecord?.responsibilities || '');

  useEffect(() => {
    if (initialRecord) {
      setPosition(initialRecord.position || '');
      setCompany(initialRecord.company || '');
      setStartDate(initialRecord.startDate || '');
      setEndDate(initialRecord.endDate || '');
      setIsCurrent(Boolean(initialRecord.isCurrent));
      setYears(initialRecord.years || 1);
      setResponsibilities(initialRecord.responsibilities || '');
    } else {
      setPosition('');
      setCompany('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setYears(1);
      setResponsibilities('');
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        position,
        company,
        startDate: startDate || undefined,
        endDate: isCurrent ? undefined : (endDate || undefined),
        isCurrent,
        years,
        responsibilities: responsibilities || undefined
      },
      initialRecord?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold">{initialRecord ? 'Edit Work Experience' : 'Add Work Experience'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Job Title / Position *</label>
            <input
              type="text"
              required
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="e.g. Junior Bookkeeper, Farm Operations Assistant"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Company / Organization *</label>
            <input
              type="text"
              required
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Mindoro Agri-Ventures, Roxas Commercial Center"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="month"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="month"
                disabled={isCurrent}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-xl ${isCurrent ? 'bg-slate-100 text-slate-400' : ''}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="expIsCurrentModal"
              checked={isCurrent}
              onChange={e => setIsCurrent(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="expIsCurrentModal" className="font-semibold text-slate-700 cursor-pointer">
              I currently work here
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Key Responsibilities / Achievements</label>
            <textarea
              rows={3}
              value={responsibilities}
              onChange={e => setResponsibilities(e.target.value)}
              placeholder="Describe your day-to-day duties, accomplishments, tools used..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
            >
              Save Experience
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ==========================================
// 3. Certification Modal
// ==========================================

export interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecord?: CertificationRecord | null;
  onSave: (record: Omit<CertificationRecord, 'id'>, id?: string) => void;
}

export const CertificationModal: React.FC<CertificationModalProps> = ({
  isOpen,
  onClose,
  initialRecord,
  onSave
}) => {
  const [name, setName] = useState(initialRecord?.name || '');
  const [issuer, setIssuer] = useState(initialRecord?.issuer || '');
  const [date, setDate] = useState(initialRecord?.date || '');
  const [imageUrl, setImageUrl] = useState(initialRecord?.imageUrl || '');
  const [imageFileName, setImageFileName] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setName(initialRecord.name || '');
      setIssuer(initialRecord.issuer || '');
      setDate(initialRecord.date || '');
      setImageUrl(initialRecord.imageUrl || '');
      setImageFileName('');
    } else {
      setName('');
      setIssuer('');
      setDate('');
      setImageUrl('');
      setImageFileName('');
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        name,
        issuer,
        date: date || undefined,
        imageUrl: imageUrl || undefined
      },
      initialRecord?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold">{initialRecord ? 'Edit Certificate' : 'Add Certificate Record'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Certificate / License Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. TESDA NC II Shielded Metal Arc Welding, PRC Civil Engineering License"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Issuing Authority *</label>
              <input
                type="text"
                required
                value={issuer}
                onChange={e => setIssuer(e.target.value)}
                placeholder="e.g. TESDA, PRC, DOLE, Red Cross"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date Acquired</label>
              <input
                type="month"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Certificate Photo / Scan Proof</label>
            {!imageUrl ? (
              <label className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors text-center">
                <Award className="w-8 h-8 text-slate-400 mb-1" />
                <span className="font-bold text-slate-700 text-xs">Click to Upload Certificate Image</span>
                <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or PDF proof document</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="border border-amber-200 bg-amber-50/60 rounded-2xl p-3 flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Certificate Proof"
                  className="w-16 h-16 object-cover rounded-xl border border-amber-300 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{imageFileName || 'Certificate Attached'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageFileName('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline mt-1 cursor-pointer"
                  >
                    Remove Document
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs cursor-pointer"
            >
              Save Certificate
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ==========================================
// 4. Certificate Lightbox
// ==========================================

export interface CertificateLightboxProps {
  proof: { url: string; name: string; issuer: string } | null;
  onClose: () => void;
}

export const CertificateLightbox: React.FC<CertificateLightboxProps> = ({ proof, onClose }) => {
  if (!proof) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold">{proof.name}</h4>
            <p className="text-xs text-slate-400">{proof.issuer}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
          <img src={proof.url} alt="Proof" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
        </div>
      </div>
    </div>
  );
};
