import React, { useState } from 'react';
import {
  X,
  Globe,
  Check,
  HelpCircle,
  Phone,
  Lock,
  Shield,
  UserPlus,
  Share2,
  Copy
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

// ==========================================
// 1. Language Modal
// ==========================================

export interface SeekerLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

export const SeekerLanguageModal: React.FC<SeekerLanguageModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage
}) => {
  const { showToast } = useToast();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Select Language</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 text-xs">
          {[
            { name: 'English (US)', desc: 'Official PESO Portal English' },
            { name: 'Filipino (Tagalog)', desc: 'Wikang Pambansa' },
            { name: 'Oriental Mindoro Localized', desc: 'Regional Dialect Support' }
          ].map(lang => (
            <button
              key={lang.name}
              type="button"
              onClick={() => {
                onSelectLanguage(lang.name);
                showToast({
                  title: 'Language Updated',
                  message: `Interface language set to ${lang.name}.`,
                  type: 'info'
                });
                onClose();
              }}
              className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between cursor-pointer transition-colors ${
                selectedLanguage === lang.name
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div>
                <p className="font-bold">{lang.name}</p>
                <p className="text-[10px] text-slate-500">{lang.desc}</p>
              </div>
              {selectedLanguage === lang.name && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. Help Center Modal
// ==========================================

export interface SeekerHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeekerHelpModal: React.FC<SeekerHelpModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">eHANAP PESO Help Center</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
            <p className="font-bold text-indigo-950">PESO Roxas Municipal Office</p>
            <p className="text-indigo-800 text-[11px] mt-0.5">Municipal Hall Compound, Roxas, Oriental Mindoro</p>
            <p className="text-indigo-700 text-[11px] mt-1 font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 inline shrink-0" />
              <span>Hotline: (043) 289-5022 • peso.roxas@orientalmindoro.gov.ph</span>
            </p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5">Frequently Asked Questions</p>
            <div className="space-y-1.5">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-[11px]">How does the Decision Tree match my resume?</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  The system cross-checks your degrees, skills, and municipality against employer vacancy qualifications.
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-[11px]">Can I get a physical PESO Referral Slip?</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Yes! Once shortlisted, visit the PESO office to receive your printed DOLE referral document.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/60 text-xs text-blue-900 flex items-center justify-between">
            <div>
              <p className="font-bold text-[11px] text-blue-950">PESO Roxas Helpdesk Desk</p>
              <p className="text-[10px] text-blue-700">Municipal Hall, Roxas, Oriental Mindoro • (043) 289-2041</p>
            </div>
            <button
              type="button"
              onClick={() => {
                showToast({
                  title: 'PESO Roxas Contact Info',
                  message: 'PESO Office hours: Monday–Friday, 8:00 AM – 5:00 PM at Municipal Hall.',
                  type: 'info'
                });
                onClose();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Office Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Privacy Policy Modal
// ==========================================

export interface SeekerPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeekerPrivacyModal: React.FC<SeekerPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Data Privacy Policy</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs leading-relaxed text-slate-600">
          <p>
            The <strong>eHANAP PESO Roxas Employment Portal</strong> adheres strictly to Republic Act No. 10173, otherwise known as the <em>Data Privacy Act of 2012</em> of the Republic of the Philippines.
          </p>
          <p>
            Your personal details, contact information, education, and resume files are stored securely and only made visible to verified PESO employers with active job vacancies matching your qualifications.
          </p>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-700 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All employer accesses are logged in the PESO LGU Immutable Audit Trail.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. Invite Friends Modal
// ==========================================

export interface SeekerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeekerInviteModal: React.FC<SeekerInviteModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText('https://ehanap.orientalmindoro.gov.ph?ref=seeker');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 motion-safe:animate-in motion-safe:fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Invite Friends</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Help fellow job seekers in Oriental Mindoro</h4>
            <p className="text-slate-500 mt-1">Share the official LGU employment portal with your friends.</p>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between font-bold text-slate-800 text-xs">
            <code className="font-mono text-xs">PESO-ROXAS-JOBSEEKER</code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {copied && (
            <p className="text-emerald-600 font-bold text-[11px]">Portal link copied to clipboard!</p>
          )}
        </div>
      </div>
    </div>
  );
};
