import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { markProfileCompletedInStorage } from '../../utils/routeGuards';
import { ORIENTAL_MINDORO_MUNICIPALITIES, JOB_CATEGORIES, ROXAS_BARANGAYS } from '../../constants';
import { PESO_EMPLOYER_REQUIREMENTS } from '../../data/pesoEmployerRequirements';
import { EmployerVerificationDocument } from '../../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Info,
  Check,
  FileCheck,
  Eye,
  Trash2,
  X,
  Download
} from 'lucide-react';

interface EmployerProfileSetupWizardProps {
  onComplete: () => void;
  onNavigate: (view: string, params?: any) => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const EmployerProfileSetupWizard: React.FC<EmployerProfileSetupWizardProps> = ({ onComplete, onNavigate }) => {
  const { currentEmployerProfile, updateEmployerProfile, addNotification, showToast, currentUser } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [wasSkippedDocs, setWasSkippedDocs] = useState<boolean>(false);

  // Step 1: Company Information (starts completely blank without pre-filled templates or stock images)
  const [companyName, setCompanyName] = useState(currentEmployerProfile?.companyName || '');
  const [industry, setIndustry] = useState(currentEmployerProfile?.industry || '');
  const [companyDescription, setCompanyDescription] = useState(currentEmployerProfile?.companyDescription || currentEmployerProfile?.description || '');
  const [website, setWebsite] = useState(currentEmployerProfile?.website || '');
  const [logoUrl, setLogoUrl] = useState(currentEmployerProfile?.logoUrl || '');
  const [logoSkippedForNow, setLogoSkippedForNow] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const docFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      setLogoSkippedForNow(false);
      showToast({
        type: 'success',
        title: 'Company Logo Uploaded',
        message: 'Your custom company logo preview has been updated.'
      });
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Contact Details & Location
  const [representativeName, setRepresentativeName] = useState(currentEmployerProfile?.representativeName || '');
  const [contactNumber, setContactNumber] = useState(currentEmployerProfile?.contactNumber || '');
  const [email, setEmail] = useState(currentEmployerProfile?.email || currentUser?.email || '');
  const [municipality, setMunicipality] = useState(currentEmployerProfile?.municipality || '');
  const [barangay, setBarangay] = useState(currentEmployerProfile?.barangay || '');
  const [address, setAddress] = useState(currentEmployerProfile?.address || '');

  // Step 3: Real Employer Verification Documents (Strictly empty by default — zero mock/simulated files)
  const [uploadedDocs, setUploadedDocs] = useState<EmployerVerificationDocument[]>(
    currentEmployerProfile?.documents || []
  );
  const [previewDoc, setPreviewDoc] = useState<EmployerVerificationDocument | null>(null);
  const [declarationAgreed, setDeclarationAgreed] = useState<boolean>(true);
  const [stepError, setStepError] = useState<string>('');

  if (!currentEmployerProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-2xl p-6 text-center space-y-3">
          <Building2 className="w-8 h-8 text-[var(--color-accent)] mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[var(--color-ink)]">Loading Employer Profile</h2>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Preparing your establishment onboarding workspace. If this persists, sign in again as an employer.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="btn btn--quiet text-xs px-4 py-2 rounded-xl border border-[var(--color-rule)] cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handleRealDocumentUpload = (reqId: string, reqTitle: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'alert',
        title: 'Document File Too Large',
        message: 'Please upload a verification file smaller than 10MB.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newDoc: EmployerVerificationDocument = {
        id: `doc-${reqId}-${Date.now()}`,
        requirementId: reqId,
        requirementTitle: reqTitle,
        fileName: file.name,
        fileSize: formatBytes(file.size),
        mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        fileUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedDocs(prev => {
        const filtered = prev.filter(d => d.requirementId !== reqId);
        return [...filtered, newDoc];
      });
      setStepError('');

      showToast({
        title: 'Verification Document Uploaded',
        message: `"${file.name}" attached for ${reqTitle}.`,
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveFile = (reqId: string) => {
    setUploadedDocs(prev => prev.filter(d => d.requirementId !== reqId));
  };

  const getDocForRequirement = (reqId: string): EmployerVerificationDocument | undefined => {
    return uploadedDocs.find(d => d.requirementId === reqId);
  };

  const hasRequiredDocumentsUploaded = uploadedDocs.length > 0;

  const handleNextStep = () => {
    setStepError('');
    if (currentStep === 1) {
      if (!companyName.trim()) {
        setStepError('Company Name is required to proceed.');
        return;
      }
      if (!industry) {
        setStepError('Please select your business industry category.');
        return;
      }
      if (!companyDescription.trim()) {
        setStepError('Please write a brief description about your company and business operations.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!representativeName.trim()) {
        setStepError('Please enter the name of the official company representative.');
        return;
      }
      if (!contactNumber.trim()) {
        setStepError('Please enter an active contact number or hotline for job seekers and PESO verification.');
        return;
      }
      if (!email.trim()) {
        setStepError('Please enter a valid business email address.');
        return;
      }
      if (!municipality) {
        setStepError('Please select your municipality in Oriental Mindoro.');
        return;
      }
      if (!address.trim()) {
        setStepError('Please provide the physical street / building address of your business establishment.');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      if (!hasRequiredDocumentsUploaded) {
        setStepError('Please upload at least one official business verification document (e.g., Mayor\'s Permit, DTI/SEC Registration, or Barangay Clearance), or click "Skip for now / Continue later" to upload them later in your Profile tab.');
        return;
      }
      setWasSkippedDocs(false);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipDocumentUploadForNow = () => {
    setStepError('');
    setWasSkippedDocs(true);

    const updatedProfile = {
      companyName: companyName.trim().toUpperCase(),
      representativeName: representativeName.trim().toUpperCase(),
      industry,
      companyDescription: companyDescription.trim().toUpperCase(),
      description: companyDescription.trim().toUpperCase(),
      website: website.trim(),
      logoUrl,
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      municipality,
      barangay: municipality === 'Roxas' ? barangay : undefined,
      address: address.trim().toUpperCase(),
      documents: [],
      submittedRequirements: [],
      requirementsSubmitted: false,
      status: 'incomplete' as const,
      isProfileCompleted: true,
      profileSetupCompletedAt: new Date().toISOString(),
    };

    updateEmployerProfile(updatedProfile);
    markProfileCompletedInStorage([currentUser?.id, currentUser?.email, email, currentEmployerProfile?.id], 'employer');

    showToast({
      type: 'info',
      title: 'Document Upload Skipped for Now',
      message: 'Your account status is set to Incomplete. Upload your business verification documents anytime in your Profile tab to apply for PESO/LGU verification.',
    });

    onComplete();
  };

  const handlePreviousStep = () => {
    setStepError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = () => {
    if (!declarationAgreed) {
      setStepError('Please check the affirmation statement before submitting your profile for PESO accreditation.');
      return;
    }

    if (uploadedDocs.length === 0) {
      setStepError('Please upload at least one required business verification document before submitting for PESO/LGU verification.');
      return;
    }

    const submittedList = uploadedDocs.map(d => d.requirementId || d.id);
    const findFileName = (reqId: string) => uploadedDocs.find(d => d.requirementId === reqId)?.fileName;

    const updatedProfile = {
      companyName: companyName.trim().toUpperCase(),
      representativeName: representativeName.trim().toUpperCase(),
      industry,
      companyDescription: companyDescription.trim().toUpperCase(),
      description: companyDescription.trim().toUpperCase(),
      website: website.trim(),
      logoUrl,
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      municipality,
      barangay: municipality === 'Roxas' ? barangay : undefined,
      address: address.trim().toUpperCase(),
      documents: uploadedDocs,
      mayorsPermitFile: findFileName('mayors_permit'),
      businessPermitFile: findFileName('mayors_permit'),
      dtiSecFile: findFileName('dti_sec'),
      sanitaryPermitFile: findFileName('sanitary_permit'),
      letterOfIntentFile: findFileName('letter_of_intent'),
      aitrFile: findFileName('aitr'),
      sedulaFile: findFileName('sedula'),
      barangayClearanceFile: findFileName('brgy_clearance'),
      environmentCertFile: findFileName('environment_cert'),
      zoningClearanceFile: findFileName('zoning_clearance'),
      buildingPermitFile: findFileName('building_permit'),
      tourismClearanceFile: findFileName('tourism_clearance'),
      paymentReceiptFile: findFileName('payment_receipt'),
      fireSafetyFile: findFileName('fire_safety'),
      submittedRequirements: submittedList,
      requirementsSubmitted: true,
      accreditationSubmittedAt: new Date().toISOString(),
      status: 'pending_verification' as const,
      isProfileCompleted: true,
      profileSetupCompletedAt: new Date().toISOString(),
      dataPrivacyConsent: {
        agreed: true,
        timestamp: new Date().toISOString()
      }
    };

    updateEmployerProfile(updatedProfile);
    markProfileCompletedInStorage([currentUser?.id, currentUser?.email, email, currentEmployerProfile?.id], 'employer');

    if (typeof addNotification === 'function') {
      addNotification({
        recipientId: currentUser?.id || currentEmployerProfile?.userId || currentEmployerProfile?.id || '',
        recipientRole: 'employer',
        title: 'Profile & Documents Submitted for PESO/LGU Verification! 📋',
        message: 'Your company profile and uploaded verification documents are now under review by PESO-LGU Oriental Mindoro. Job posting will unlock once your account is verified.',
        type: 'info',
        actionUrl: 'employer-dashboard',
      });

      addNotification({
        recipientId: 'admin',
        recipientRole: 'admin',
        title: `New Employer Verification Pending: ${companyName.trim().toUpperCase()}`,
        message: `${companyName.trim().toUpperCase()} (${representativeName.trim().toUpperCase()}) uploaded ${uploadedDocs.length} verification document(s) for LGU/PESO accreditation review.`,
        type: 'action',
        actionUrl: 'admin-verifications',
      });
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Submitted for PESO/LGU Verification',
        message: 'Your employer profile and verification documents have been submitted to PESO-LGU!',
      });
    }

    setIsSubmitted(true);
  };

  const countAttached = uploadedDocs.length;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-body">
      
      {/* Wizard Header & Progress Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Company Profile Setup & PESO Verification
            </h1>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3.5 h-3.5" />
                Employer Onboarding & Accreditation
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 pt-1">
              Please complete these initial setup steps before accessing your employer recruitment dashboard.
            </p>
          </div>

          <div className="text-right sm:text-left bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shrink-0">
            <p className="text-xs font-semibold text-slate-500">Current Step</p>
            <p className="text-sm font-black text-blue-600">Step {currentStep} of 4</p>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          {[
            { step: 1, title: 'Company Info', desc: 'Name & Industry' },
            { step: 2, title: 'Contacts & Location', desc: 'Mindoro Address' },
            { step: 3, title: 'PESO Requirements', desc: '11 Documents' },
            { step: 4, title: 'Review & Submit', desc: 'Accreditation' }
          ].map(s => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div 
                key={s.step} 
                className={`p-3 rounded-2xl border transition-colors ${
                  isCurrent 
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs' 
                    : isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800' 
                    : 'border-slate-200 bg-slate-50/60 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isCurrent 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-blue-900' : isCompleted ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {stepError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-semibold shadow-xs motion-safe:animate-in motion-safe:fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        
        {/* STEP 1: Company Information */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Step 1: Company Information & Overview
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide core details about your registered establishment or business enterprise.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Registered Company / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value.toUpperCase())}
                  placeholder="E.G. ROXAS TECH SOLUTIONS & TRADING INC."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900 uppercase text-sm bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Must match your official DTI, SEC, or Mayor's Business Permit.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Industry / Business Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-800 text-xs bg-white"
                >
                  <option value="">-- Select Business Industry --</option>
                  {JOB_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Agriculture & Fishery">Agriculture & Fishery</option>
                  <option value="Manufacturing & Processing">Manufacturing & Processing</option>
                  <option value="Wholesale & Retail Trade">Wholesale & Retail Trade</option>
                  <option value="Food & Beverage Services">Food & Beverage Services</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used by PESO to classify your postings and matches.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Company Website or Facebook Page <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://www.facebook.com/yourbusiness"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Company Description & Business Background <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value.toUpperCase())}
                  placeholder="PROVIDE AN OVERVIEW OF YOUR ESTABLISHMENT, CORE PRODUCTS/SERVICES, COMPANY CULTURE, AND WORKPLACE ENVIRONMENT IN ORIENTAL MINDORO..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-normal text-slate-800 uppercase text-xs bg-white leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Job seekers will view this summary when reviewing your job postings.
                </p>
              </div>

              <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-2">
                  Upload Your Company Brand Logo / Photo (Optional)
                </label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div 
                    onClick={() => logoFileInputRef.current?.click()}
                    className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors shrink-0 cursor-pointer"
                    title="Click to upload your company logo"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Company Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileUpload}
                  />

                  <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                    <p className="text-xs text-slate-600">
                      Upload your own company logo or establishment photo. If you don't have one ready, click <strong>"Skip for now / Continue later"</strong> — your logo area will remain completely blank until you upload one in Profile Settings.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoUrl ? 'Change Company Logo' : 'Upload Company Logo'}</span>
                      </button>

                      {!logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            setLogoSkippedForNow(true);
                            showToast({
                              type: 'info',
                              title: 'Company Logo Skipped for Now',
                              message: 'Your company logo area will remain blank. You can upload one anytime in Profile Settings.'
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-slate-700 cursor-pointer"
                        >
                          Skip for now / Continue later
                        </button>
                      )}

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            setLogoSkippedForNow(false);
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-rose-200 hover:bg-rose-50 rounded-xl text-rose-600 cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    {logoSkippedForNow && !logoUrl && (
                      <p className="text-[11px] font-semibold text-emerald-700 pt-1">
                        ✓ Skipped for now — company logo space left blank. You can upload a logo anytime in Profile Settings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Contact Details & Location */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Step 2: Official Contact Details & Establishment Location
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Designate the authorized contact person and location within Oriental Mindoro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Authorized Company Representative <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={representativeName}
                  onChange={e => setRepresentativeName(e.target.value.toUpperCase())}
                  placeholder="E.G. ENGR. JUAN DELA CRUZ (HR MANAGER)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900 uppercase text-xs bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Point person coordinating with PESO Roxas and applicants.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Official Business Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="careers@company.com.ph"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900 text-xs bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Receives interview responses and PESO verification notices.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Contact Number / Mobile / Hotline <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="+63 917 123 4567 / (043) 288-0000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Municipality in Oriental Mindoro <span className="text-rose-500">*</span>
                </label>
                <select
                  value={municipality}
                  onChange={e => setMunicipality(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-800 text-xs bg-white"
                >
                  <option value="">-- Select Municipality --</option>
                  {ORIENTAL_MINDORO_MUNICIPALITIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {municipality === 'Roxas' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Barangay in Roxas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={barangay}
                    onChange={e => setBarangay(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-800 text-xs bg-white"
                  >
                    <option value="">-- Select Barangay --</option>
                    {ROXAS_BARANGAYS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={municipality === 'Roxas' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Complete Physical Address / Street / Bldg <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value.toUpperCase())}
                  placeholder="E.G. UNIT 2B, RIZAL STREET CORNER BONIFACIO AVENUE"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-900 uppercase text-xs bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PESO Establishment Requirements (Real File Uploads + Optional Skip for Now) */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Step 3: Upload Business Verification Documents
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your real business verification files (`.png`, `.jpg`, `.jpeg`, `.pdf`, `.doc`, `.docx`) for PESO/LGU Oriental Mindoro verification.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 shrink-0 self-start sm:self-auto">
                  {countAttached} Document(s) Uploaded
                </span>
              </div>
            </div>

            {/* Prominent PESO Verification Policy Warning & Optional Skip Explanation */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-sm">
                  Verification Required Before Posting Job Vacancies
                </p>
                <p className="text-amber-800 leading-relaxed">
                  <strong>PESO-LGU Oriental Mindoro</strong> reviews your uploaded business documents before unlocking job vacancy posting. If you do not have your files ready right now, you may click <strong>&ldquo;Skip for now / Continue later&rdquo;</strong> to access your Employer Dashboard with an <strong>Incomplete</strong> status and upload your documents later in the <strong>Profile</strong> tab.
                </p>
              </div>
            </div>

            {/* List of Requirements with Real Native File Inputs */}
            <div className="space-y-3">
              {PESO_EMPLOYER_REQUIREMENTS.map((req, idx) => {
                const attachedDoc = getDocForRequirement(req.id);

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-colors ${
                      attachedDoc 
                        ? 'border-emerald-300 bg-emerald-50/40' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      ref={el => { docFileInputRefs.current[req.id] = el; }}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={e => handleRealDocumentUpload(req.id, req.title, e)}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            #{idx + 1}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900">
                            {req.title}
                          </h3>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {req.issuingAgency}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {req.description}
                        </p>

                        {attachedDoc && (
                          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-emerald-800 font-bold text-xs">
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-xs">{attachedDoc.fileName}</span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              ({attachedDoc.fileSize})
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Uploaded
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {attachedDoc ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(attachedDoc)}
                              className="px-2.5 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => docFileInputRefs.current[req.id]?.click()}
                              className="px-2.5 py-1.5 text-slate-700 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(req.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => docFileInputRefs.current[req.id]?.click()}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Final Submit */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Step 4: Review Summary &amp; Submit for PESO/LGU Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review your company details and uploaded verification documents before submitting for PESO/LGU accreditation.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={companyName}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-dashed border-slate-300 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm uppercase">{companyName}</h3>
                    <p className="text-slate-500">{industry}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <p><strong className="text-slate-700">Representative:</strong> <span className="uppercase">{representativeName}</span></p>
                  <p><strong className="text-slate-700">Email:</strong> {email}</p>
                  <p><strong className="text-slate-700">Phone:</strong> {contactNumber}</p>
                  <p><strong className="text-slate-700">Location:</strong> <span className="uppercase">{address}, {municipality === 'Roxas' && barangay ? `BRGY. ${barangay}, ` : ''}{municipality}, ORIENTAL MINDORO</span></p>
                </div>
              </div>

              <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-blue-950 text-sm">Uploaded Verification Documents</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                    {countAttached} Document(s)
                  </span>
                </div>

                <ul className="space-y-1.5 text-[11px] text-blue-900">
                  {uploadedDocs.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold truncate">{doc.requirementTitle || doc.fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="text-[10px] font-bold text-blue-700 hover:underline shrink-0"
                      >
                        View ({doc.fileSize})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Declaration & Privacy Consent */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={e => setDeclarationAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="leading-relaxed font-medium">
                  I hereby certify that all company information and business verification documents uploaded are authentic, valid, and compliant with the standards of the <strong>Public Employment Service Office (PESO) - Oriental Mindoro</strong>. I understand that job vacancy posting will unlock once my employer account is officially verified.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Step 3 Optional "Skip for now / Continue later" button — shown ONLY when no documents have been uploaded yet */}
            {currentStep === 3 && !hasRequiredDocumentsUploaded && (
              <button
                type="button"
                onClick={handleSkipDocumentUploadForNow}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Skip for now / Continue later
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Save &amp; Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit for PESO/LGU Verification</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-bold truncate">{previewDoc.requirementTitle || previewDoc.fileName}</h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {previewDoc.fileName} • {previewDoc.fileSize}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[360px]">
              {previewDoc.mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(previewDoc.fileName) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md"
                />
              ) : previewDoc.mimeType === 'application/pdf' || /\.pdf$/i.test(previewDoc.fileName) ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[70vh] rounded-xl bg-white border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <h5 className="text-sm font-bold text-slate-900">{previewDoc.fileName}</h5>
                  <p className="text-xs text-slate-500">
                    Office document ({previewDoc.fileSize}). Click the button below to download and inspect this file.
                  </p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Celebration & Confirmation Modal */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 text-center space-y-5 motion-safe:animate-in motion-safe:zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                Company Profile Submitted for PESO Review!
              </h2>
              <div className="pt-1">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Setup Complete & Accreditation Pending
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Naitakda na ang profile ng <strong>{companyName}</strong>. Kasalukuyang susuriin ng <strong>PESO Oriental Mindoro</strong> ang inyong mga nakalakip na dokumento para sa akreditasyon.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Info className="w-4 h-4 text-amber-600" />
                Ano ang susunod na hakbang?
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
                <li>Aabisuhan kayo sa eHANAP notifications kapag na-verify na ang inyong account.</li>
                <li>Kapag verified na, magkakaroon na kayo ng buong access para makapag-post ng job vacancies.</li>
                <li>Maaari na ninyong i-explore ang inyong employer dashboard.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  onComplete();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Proceed to Employer Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  onNavigate('employer-profile');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                View Profile Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
