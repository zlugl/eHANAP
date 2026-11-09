import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ORIENTAL_MINDORO_MUNICIPALITIES, JOB_CATEGORIES } from '../../data/mockData';
import { PESO_EMPLOYER_REQUIREMENTS } from '../../data/pesoEmployerRequirements';
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Save, 
  Check, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  Camera,
  Info
} from 'lucide-react';

interface EmployerProfilePageProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const EmployerProfilePage: React.FC<EmployerProfilePageProps> = ({ onNavigate }) => {
  const { currentEmployerProfile, updateEmployerProfile, verifyEmployer, showToast } = useApp();

  if (!currentEmployerProfile) return null;

  const [companyName, setCompanyName] = useState(currentEmployerProfile.companyName || '');
  const [representativeName, setRepresentativeName] = useState(currentEmployerProfile.representativeName || '');
  const [industry, setIndustry] = useState(currentEmployerProfile.industry || JOB_CATEGORIES[0]);
  const [municipality, setMunicipality] = useState(currentEmployerProfile.municipality || 'Roxas');
  const [address, setAddress] = useState(currentEmployerProfile.address || '');
  const [contactNumber, setContactNumber] = useState(currentEmployerProfile.contactNumber || '');
  const [email, setEmail] = useState(currentEmployerProfile.email || '');
  const [website, setWebsite] = useState(currentEmployerProfile.website || '');
  const [companyDescription, setCompanyDescription] = useState(currentEmployerProfile.companyDescription || currentEmployerProfile.description || '');
  const [logoUrl, setLogoUrl] = useState(currentEmployerProfile.logoUrl || '');
  const [isSaved, setIsSaved] = useState(false);

  const employerLogoInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'alert',
        title: 'Image File Too Large',
        message: 'Please choose an image file under 5MB.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      updateEmployerProfile({ logoUrl: dataUrl });
      showToast({
        type: 'success',
        title: 'Company Logo Updated! 🏢',
        message: 'Your company profile photo has been saved successfully.'
      });
    };
    reader.readAsDataURL(file);
  };
  
  // PESO Regulatory Requirements State
  const [mayorsPermitFile, setMayorsPermitFile] = useState(currentEmployerProfile.mayorsPermitFile || currentEmployerProfile.businessPermitFile || '');
  const [dtiSecFile, setDtiSecFile] = useState(currentEmployerProfile.dtiSecFile || '');
  const [sanitaryPermitFile, setSanitaryPermitFile] = useState(currentEmployerProfile.sanitaryPermitFile || '');
  const [letterOfIntentFile, setLetterOfIntentFile] = useState(currentEmployerProfile.letterOfIntentFile || '');
  const [aitrFile, setAitrFile] = useState(currentEmployerProfile.aitrFile || '');
  const [sedulaFile, setSedulaFile] = useState(currentEmployerProfile.sedulaFile || '');
  const [barangayClearanceFile, setBarangayClearanceFile] = useState(currentEmployerProfile.barangayClearanceFile || '');
  const [esoCertFile, setEsoCertFile] = useState(currentEmployerProfile.esoCertFile || '');
  const [zoningCertFile, setZoningCertFile] = useState(currentEmployerProfile.zoningCertFile || '');
  const [buildingPermitFile, setBuildingPermitFile] = useState(currentEmployerProfile.buildingPermitFile || '');
  const [tourismClearanceFile, setTourismClearanceFile] = useState(currentEmployerProfile.tourismClearanceFile || '');
  const [mtoReceiptFile, setMtoReceiptFile] = useState(currentEmployerProfile.mtoReceiptFile || '');
  const [fireSafetyClearanceFile, setFireSafetyClearanceFile] = useState(currentEmployerProfile.fireSafetyClearanceFile || '');

  const [businessPermitNo, setBusinessPermitNo] = useState(currentEmployerProfile.businessPermitNo || '');
  const [dtiSecRegistration, setDtiSecRegistration] = useState(currentEmployerProfile.dtiSecRegistration || '');
  const [bir2303No, setBir2303No] = useState(currentEmployerProfile.bir2303No || '');

  const isForCompliance = currentEmployerProfile.status === 'for_compliance';

  const docStateMap: Record<string, { value: string; setter: (val: string) => void }> = {
    mayorsPermitFile: { value: mayorsPermitFile, setter: setMayorsPermitFile },
    dtiSecFile: { value: dtiSecFile, setter: setDtiSecFile },
    sanitaryPermitFile: { value: sanitaryPermitFile, setter: setSanitaryPermitFile },
    letterOfIntentFile: { value: letterOfIntentFile, setter: setLetterOfIntentFile },
    aitrFile: { value: aitrFile, setter: setAitrFile },
    sedulaFile: { value: sedulaFile, setter: setSedulaFile },
    barangayClearanceFile: { value: barangayClearanceFile, setter: setBarangayClearanceFile },
    esoCertFile: { value: esoCertFile, setter: setEsoCertFile },
    zoningCertFile: { value: zoningCertFile, setter: setZoningCertFile },
    buildingPermitFile: { value: buildingPermitFile, setter: setBuildingPermitFile },
    tourismClearanceFile: { value: tourismClearanceFile, setter: setTourismClearanceFile },
    mtoReceiptFile: { value: mtoReceiptFile, setter: setMtoReceiptFile },
    fireSafetyClearanceFile: { value: fireSafetyClearanceFile, setter: setFireSafetyClearanceFile },
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // If employer was for_compliance, submitting updates moves them to pending (In Review)
    const newStatus = isForCompliance ? 'pending' : currentEmployerProfile.status;

    updateEmployerProfile({
      companyName,
      representativeName,
      industry,
      municipality,
      address,
      contactNumber,
      email,
      website,
      companyDescription,
      description: companyDescription,
      businessPermitNo,
      businessPermitFile: mayorsPermitFile,
      mayorsPermitFile,
      dtiSecRegistration,
      bir2303No,
      dtiSecFile,
      sanitaryPermitFile,
      letterOfIntentFile,
      aitrFile,
      sedulaFile,
      barangayClearanceFile,
      esoCertFile,
      zoningCertFile,
      buildingPermitFile,
      tourismClearanceFile,
      mtoReceiptFile,
      fireSafetyClearanceFile,
      logoUrl,
      status: newStatus,
      isProfileCompleted: true,
      complianceRemarks: isForCompliance ? undefined : currentEmployerProfile.complianceRemarks
    });

    setIsSaved(true);
    showToast({
      title: isForCompliance ? 'Compliance Documents Resubmitted' : 'Company Profile Updated',
      message: isForCompliance 
        ? 'Your compliance documents have been submitted to PESO-LGU for review.'
        : 'Your employer profile information has been saved successfully.',
      type: 'status'
    });
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 font-body">
      
      {/* Setup Incomplete Notice Banner */}
      {!currentEmployerProfile.isProfileCompleted && onNavigate && (
        <div className="bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-rule)] p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm sm:text-base">Step-by-Step Onboarding Incomplete</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Finish the 4-step Employer Onboarding Wizard to complete your company background, contact points, and required PESO accreditation documents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('employer-profile-setup')}
            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
          >
            <span>Resume Setup Wizard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => employerLogoInputRef.current?.click()}
            className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-500/20 hover:ring-indigo-500 transition-colors shadow-xs shrink-0 cursor-pointer group/logo"
            title="Click to upload company logo or profile photo"
          >
            <img
              src={logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80'}
              alt={companyName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[10px] font-semibold text-white mt-0.5">Edit</span>
            </div>
          </div>

          <input
            ref={employerLogoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileUpload}
          />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{companyName || 'Company Profile'}</h1>
              {currentEmployerProfile.status === 'verified' ? (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PESO Verified
                </span>
              ) : currentEmployerProfile.status === 'for_compliance' ? (
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 motion-safe:animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Action Required: For Compliance
                </span>
              ) : currentEmployerProfile.status === 'suspended' ? (
                <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Account Suspended
                </span>
              ) : (
                <span className="text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" /> Pending Review
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">{industry} • {municipality}, Oriental Mindoro</p>
              <span className="text-slate-300 text-xs">•</span>
              <button
                type="button"
                onClick={() => employerLogoInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Upload Logo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('employer-profile-setup')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Rerun Setup Wizard
            </button>
          )}

          {currentEmployerProfile.status !== 'verified' && (
            <button
              type="button"
              onClick={() => {
                verifyEmployer(currentEmployerProfile.id, 'verified', 'PESO Accreditation Verified.');
                showToast({
                  type: 'match',
                  title: 'Account Verified by PESO! 🏛️',
                  message: `${currentEmployerProfile.companyName} is now fully verified. You can post job vacancies!`
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simulate PESO Approval</span>
            </button>
          )}

          {isSaved && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Changes Saved
            </span>
          )}
        </div>
      </div>



      {/* For Compliance Alert Banner */}
      {isForCompliance && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-black text-amber-950">
                PESO Compliance Notice: Document Resubmission Required
              </h2>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {currentEmployerProfile.complianceRemarks ||
                  'Your registration documents require update or clarification. Please ensure your applicable documents are uploaded and clear.'}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 bg-white/80 p-3 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Update your compliance document details below and click <strong>“Submit Compliance Documents”</strong>. Your profile will return to <em>“Under Review”</em> for immediate validation by the PESO verification team.</span>
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          Company & Business Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Company / Business Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Authorized Representative *</label>
            <input
              type="text"
              required
              value={representativeName}
              onChange={e => setRepresentativeName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Industry Sector *</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              {JOB_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Municipality (Oriental Mindoro) *</label>
            <select
              value={municipality}
              onChange={e => setMunicipality(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              {ORIENTAL_MINDORO_MUNICIPALITIES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Complete Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Building, Street, Barangay, Municipality"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Telephone / Mobile *</label>
            <input
              type="text"
              required
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Contact Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Company Website URL</label>
            <input
              type="text"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://yourcompany.ph"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden ring-2 ring-indigo-500/20 shadow-xs flex items-center justify-center">
                  <img
                    src={logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80'}
                    alt="Company Logo Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Company Brand Logo & Profile Photo</span>
                </h4>
                <p className="text-[11px] text-slate-500">Upload your establishment's official logo or choose an image template</p>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                  <button
                    type="button"
                    onClick={() => employerLogoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        updateEmployerProfile({ logoUrl: '' });
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 text-left">Or Image URL:</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Quick Logo Templates */}
            <div className="mt-3 pt-3 border-t border-slate-200/80">
              <p className="text-xs font-semibold text-slate-500 mb-2">Or select a business template:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Modern Office', url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80' },
                  { label: 'Resort & Hotel', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=150&auto=format&fit=crop&q=80' },
                  { label: 'Tech & Trade', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=80' },
                  { label: 'Retail & Store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=80' }
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setLogoUrl(tpl.url);
                      updateEmployerProfile({ logoUrl: tpl.url });
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer active:scale-95 disabled:opacity-50 ${
                      logoUrl === tpl.url 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-500/20' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-600'
                    }`}
                  >
                    <img src={tpl.url} alt={tpl.label} className="w-4 h-4 rounded-md object-cover" />
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Company Description */}
        <div className="pt-4 border-t border-slate-100 text-xs">
          <label className="block font-bold text-slate-700 mb-1">Company Overview / Description *</label>
          <textarea
            rows={4}
            required
            value={companyDescription}
            onChange={e => setCompanyDescription(e.target.value)}
            placeholder="Describe your company's mission, background, and hiring standards..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        {/* PESO Accreditation Document Numbers */}
        <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <FileText className="w-4 h-4 text-amber-600" />
              LGU Business Registration & TIN Numbers
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Official registration and tax identification credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Permit No.</label>
              <input
                type="text"
                value={businessPermitNo}
                onChange={e => setBusinessPermitNo(e.target.value)}
                placeholder="BP-2026-ROX-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">DTI or SEC Registration No.</label>
              <input
                type="text"
                value={dtiSecRegistration}
                onChange={e => setDtiSecRegistration(e.target.value)}
                placeholder="DTI-XXXXX or SEC-XXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">BIR Form 2303 (TIN)</label>
              <input
                type="text"
                value={bir2303No}
                onChange={e => setBir2303No(e.target.value)}
                placeholder="000-000-000-000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 11 PESO Requirements Document Manager */}
        <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4 text-indigo-600" />
                Mga Requirements ng Employer/Establishment (PESO Verification)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Alinsunod sa pamantayan ng PESO Oriental Mindoro, i-upload ang mga kaukulang dokumento para sa akreditasyon.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Only applicable documents are required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PESO_EMPLOYER_REQUIREMENTS.map((req, idx) => {
              const docState = docStateMap[req.fieldKey];
              const val = docState?.value || '';
              const hasFile = Boolean(val.trim());

              return (
                <div 
                  key={req.id} 
                  className={`p-3.5 rounded-xl border transition-colors ${
                    hasFile 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{req.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-7">{req.issuingAgency}</p>
                      {req.applicableEstablishments && (
                        <p className="text-[10px] text-amber-700 italic pl-7">{req.applicableEstablishments}</p>
                      )}
                    </div>

                    {hasFile ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Attached
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pl-7 flex items-center gap-2">
                    <input
                      type="text"
                      value={val}
                      onChange={e => docState?.setter(e.target.value)}
                      placeholder={`e.g. ${req.title.split(' ')[0]}_Document.pdf`}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => docState?.setter(`${req.id}_Verified_Document.pdf`)}
                      className="text-[10px] font-bold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {hasFile ? 'Replace' : '+ Sample PDF'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer ${
              isForCompliance
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isForCompliance ? 'Submit Compliance Documents for Review' : 'Save Profile Updates'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

