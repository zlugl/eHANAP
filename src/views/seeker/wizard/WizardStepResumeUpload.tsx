import React, { useRef, useState } from 'react';
import { Upload, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export interface WizardStepResumeUploadProps {
  isProcessingFile: boolean;
  extractionSuccess: boolean;
  activeFileName: string;
  onFileSelected: (file: File) => Promise<void>;
  onProceedManual: () => void;
}

export const WizardStepResumeUpload: React.FC<WizardStepResumeUploadProps> = ({
  isProcessingFile,
  extractionSuccess,
  activeFileName,
  onFileSelected,
  onProceedManual,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onFileSelected(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-6 sm:p-8"
    >
      <div className="text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-[var(--color-accent)] rounded-2xl flex items-center justify-center mx-auto">
          <Upload className="w-7 h-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] font-display">
            Upload your Resume or Bio-data
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1">
            Upload your resume, CV, or bio-data. Our AI-driven parser will automatically extract your personal details, education, degree, and skills so you don’t have to type them from scratch.
          </p>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onClick={() => !isProcessingFile && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessingFile) setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessingFile) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (isProcessingFile) return;
            const file = e.dataTransfer.files?.[0];
            if (file) {
              await onFileSelected(file);
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 cursor-pointer transition-colors duration-200 overflow-hidden focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
            isProcessingFile
              ? 'border-[var(--color-accent)] bg-[var(--color-paper-warm)] cursor-wait ring-2 ring-[var(--color-accent)]/20'
              : isDragging
                ? 'border-[var(--color-accent)] bg-[var(--color-paper-warm)] ring-2 ring-[var(--color-accent)]/30'
                : 'border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isProcessingFile ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-10 h-10 text-[var(--color-accent)] motion-safe:animate-spin" aria-hidden="true" />
              <div className="text-sm font-bold text-[var(--color-ink)]">
                Extracting data from <span className="text-[var(--color-accent)] font-mono">{activeFileName}</span>…
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] max-w-md text-center">
                Accurately identifying full name, education, course, university, and 6 skill categories. Unstated fields will remain blank for your manual review.
              </p>
            </div>
          ) : extractionSuccess ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" aria-hidden="true" />
              <div className="text-sm font-bold text-[var(--color-ink)]">Resume Extracted Successfully!</div>
              <p className="text-xs text-[var(--color-ink-muted)] font-mono">{activeFileName}</p>
              <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Redirecting to Step 2 review…
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent)]">
                <FileText className="w-7 h-7" aria-hidden="true" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[var(--color-ink)]">
                  Click to browse or drag and drop your file here
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  Supported formats: PDF, DOCX, DOC, TXT, or Image Bio-data (PNG, JPG)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="text-[10px] font-medium text-[var(--color-ink)] bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2.5 py-0.5 rounded-md">
                  Smart Bio-Data & Resume Parser
                </span>
                <span className="text-[10px] font-medium text-[var(--color-ink)] bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2.5 py-0.5 rounded-md">
                  Unstated Gender & Birthday Remain Blank
                </span>
              </div>

              <button
                type="button"
                className="btn btn--primary mt-1 px-5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
              >
                Select Resume File
              </button>
            </div>
          )}
        </div>

        {/* Manual entry alternative */}
        <div className="pt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-[var(--color-ink-muted)]">Don’t have a resume right now?</span>
          <button
            type="button"
            onClick={onProceedManual}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
          >
            Proceed to Manual Information Entry
          </button>
        </div>
      </div>
    </motion.div>
  );
};
