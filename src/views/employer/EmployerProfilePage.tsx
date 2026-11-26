import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ORIENTAL_MINDORO_MUNICIPALITIES, JOB_CATEGORIES } from '../../constants';
import { PESO_EMPLOYER_REQUIREMENTS } from '../../data/pesoEmployerRequirements';
import { EmployerProfile, EmployerVerificationDocument } from '../../types';
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Save, 
  Check, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Camera,
  Info,
  Eye,
  Trash2,
  X,
  Download,
  FileCheck
} from 'lucide-react';

interface EmployerProfilePageProps {
  onNavigate?: (view: string, params?: any) => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const EmployerProfilePage: React.FC<EmployerProfilePageProps> = ({ onNavigate }) => {
  const { currentEmployerProfile, updateEmployerProfile, addNotification, showToast, currentUser } = useApp();

  const [companyName, setCompanyName] = useState(currentEmployerProfile?.companyName || '');
  const [representativeName, setRepresentativeName] = useState(currentEmployerProfile?.representativeName || '');
  const [industry, setIndustry] = useState(currentEmployerProfile?.industry || '');
  const [municipality, setMunicipality] = useState(currentEmployerProfile?.municipality || '');
  const [address, setAddress] = useState(currentEmployerProfile?.address || '');
  const [contactNumber, setContactNumber] = useState(currentEmployerProfile?.contactNumber || '');
  const [email, setEmail] = useState(currentEmployerProfile?.email || '');
  const [website, setWebsite] = useState(currentEmployerProfile?.website || '');
  const [companyDescription, setCompanyDescription] = useState(currentEmployerProfile?.companyDescription || currentEmployerProfile?.description || '');
  const [logoUrl, setLogoUrl] = useState(currentEmployerProfile?.logoUrl || '');
  const [isSaved, setIsSaved] = useState(false);

  const employerLogoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const additionalDocInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadedDocs, setUploadedDocs] = useState<EmployerVerificationDocument[]>(
    currentEmployerProfile?.documents || []
  );
  const uploadedDocsRef = useRef<EmployerVerificationDocument[]>(uploadedDocs);
  uploadedDocsRef.current = uploadedDocs;
  const [previewDoc, setPreviewDoc] = useState<EmployerVerificationDocument | null>(null);

  const [businessPermitNo, setBusinessPermitNo] = useState(currentEmployerProfile?.businessPermitNo || '');
  const [dtiSecRegistration, setDtiSecRegistration] = useState(currentEmployerProfile?.dtiSecRegistration || '');
  const [bir2303No, setBir2303No] = useState(currentEmployerProfile?.bir2303No || '');

  if (!currentEmployerProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-2xl p-6 text-center space-y-3">
          <Building2 className="w-8 h-8 text-[var(--color-accent)] mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[var(--color-ink)]">Employer Profile Unavailable</h2>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Your establishment profile is still loading or needs initial setup.
          </p>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('employer-profile-setup')}
              className="btn btn--primary text-xs px-4 py-2 rounded-xl cursor-pointer"
            >
              Go to Profile Setup
            </button>
          )}
        </div>
      </div>
    );
  }

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

  const handleRealDocumentUpload = (reqId: string, reqTitle: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'alert',
        title: 'File Too Large',
        message: 'Please select a document smaller than 10MB.'
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

      const next =
        reqId === 'additional'
          ? [...uploadedDocsRef.current, newDoc]
          : [...uploadedDocsRef.current.filter(d => d.requirementId !== reqId), newDoc];
      uploadedDocsRef.current = next;
      setUploadedDocs(next);
      updateEmployerProfile({ documents: next });

      showToast({
        type: 'success',
        title: 'Verification Document Uploaded',
        message: `"${file.name}" has been attached to your verification record.`
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveDocument = (docId: string) => {
    const next = uploadedDocsRef.current.filter(d => d.id !== docId);
    const nextStatus =
      next.length === 0 && currentEmployerProfile.status !== 'verified'
        ? 'incomplete'
        : currentEmployerProfile.status;
    uploadedDocsRef.current = next;
    setUploadedDocs(next);
    updateEmployerProfile({ documents: next, status: nextStatus });
    showToast({
      type: 'info',
      title: 'Document Removed',
      message: 'Verification document removed from your profile.'
    });
  };

  const isProfileDetailsComplete = Boolean(
    companyName.trim() &&
    representativeName.trim() &&
    industry.trim() &&
    municipality.trim() &&
    address.trim() &&
    contactNumber.trim() &&
    email.trim() &&
    companyDescription.trim()
  );

  const hasVerificationDocuments = uploadedDocs.length > 0;
  const canSubmitForVerification = isProfileDetailsComplete && hasVerificationDocuments;

  const isForCompliance = currentEmployerProfile.status === 'for_compliance';
  const isRejected = currentEmployerProfile.status === 'rejected';
  const isIncomplete = currentEmployerProfile.status === 'incomplete' || !hasVerificationDocuments || !isProfileDetailsComplete;
  const isPendingVerification =
    (currentEmployerProfile.status === 'pending_verification' || currentEmployerProfile.status === 'pending') &&
    hasVerificationDocuments &&
    isProfileDetailsComplete;
  const isVerified = currentEmployerProfile.status === 'verified';

  const buildProfilePayload = (overrideStatus?: EmployerProfile['status']) => {
    const findFileName = (reqId: string) => uploadedDocs.find(d => d.requirementId === reqId)?.fileName || '';
    const submittedList = uploadedDocs.map(d => d.requirementId || d.id);

    return {
      companyName: companyName.trim().toUpperCase(),
      representativeName: representativeName.trim().toUpperCase(),
      industry,
      municipality,
      address: address.trim().toUpperCase(),
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      website: website.trim(),
      companyDescription: companyDescription.trim().toUpperCase(),
      description: companyDescription.trim().toUpperCase(),
      businessPermitNo: businessPermitNo.trim().toUpperCase(),
      dtiSecRegistration: dtiSecRegistration.trim().toUpperCase(),
      bir2303No: bir2303No.trim().toUpperCase(),
      documents: uploadedDocs,
      businessPermitFile: findFileName('mayors_permit'),
      mayorsPermitFile: findFileName('mayors_permit'),
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
      requirementsSubmitted: uploadedDocs.length > 0,
      logoUrl,
      status: overrideStatus || (uploadedDocs.length === 0 && !isVerified ? 'incomplete' : currentEmployerProfile.status),
      isProfileCompleted: true,
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildProfilePayload();
    updateEmployerProfile(payload);

    setIsSaved(true);
    showToast({
      title: 'Company Profile Saved',
      message: 'Your employer profile details and uploaded documents have been saved.',
      type: 'status'
    });
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSubmitForPesoVerification = () => {
    if (!isProfileDetailsComplete) {
      showToast({
        type: 'alert',
        title: 'Incomplete Profile Details',
        message: 'Please complete all required Company & Business Details (Company Name, Representative, Industry, Municipality, Address, Contact Number, Email, and Description) before submitting for verification.'
      });
      return;
    }
    if (!hasVerificationDocuments) {
      showToast({
        type: 'alert',
        title: 'Missing Verification Documents',
        message: 'Please upload at least one official business verification document before submitting for PESO/LGU verification.'
      });
      return;
    }

    const payload = {
      ...buildProfilePayload('pending_verification'),
      accreditationSubmittedAt: new Date().toISOString(),
      complianceRemarks: '',
    };
    updateEmployerProfile(payload);

    if (typeof addNotification === 'function') {
      addNotification({
        recipientId: currentUser?.id || currentEmployerProfile.userId || currentEmployerProfile.id,
        recipientRole: 'employer',
        title: 'Submitted for PESO/LGU Verification! 📋',
        message: `Your company profile and ${uploadedDocs.length} verification document(s) have been submitted to PESO-LGU Oriental Mindoro for accreditation review.`,
        type: 'info',
        actionUrl: 'employer-dashboard',
      });

      addNotification({
        recipientId: 'admin',
        recipientRole: 'admin',
        title: `Employer Verification Submitted: ${companyName.trim().toUpperCase()}`,
        message: `${companyName.trim().toUpperCase()} (${representativeName.trim().toUpperCase()}) uploaded ${uploadedDocs.length} business verification document(s) and requested PESO/LGU verification.`,
        type: 'action',
        actionUrl: 'admin-verifications',
      });
    }

    setIsSaved(true);
    showToast({
      title: 'Submitted for PESO/LGU Verification',
      message: 'Your profile and uploaded documents are now queued for PESO/LGU verification.',
      type: 'success'
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
            className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors shrink-0 cursor-pointer"
            title="Click to upload company logo or profile photo"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>

          <input
            ref={employerLogoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileUpload}
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{companyName || 'Company Profile'}</h1>
              {isVerified ? (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                </span>
              ) : isRejected || isForCompliance ? (
                <span className="text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected — Action Required
                </span>
              ) : isIncomplete ? (
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> Incomplete Profile / Missing Documents
                </span>
              ) : isPendingVerification ? (
                <span className="text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" /> Pending PESO/LGU Verification
                </span>
              ) : (
                <span className="text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-600" /> {currentEmployerProfile.status}
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

          {isSaved && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Changes Saved
            </span>
          )}
        </div>
      </div>

      {/* Prominent Verification & Completion Status Card */}
      <div
        className={`rounded-2xl p-5 border-2 shadow-2xs space-y-3 ${
          isVerified
            ? 'bg-emerald-50/70 border-emerald-300'
            : isRejected || isForCompliance
            ? 'bg-rose-50/80 border-rose-300'
            : isIncomplete
            ? 'bg-amber-50/80 border-amber-300'
            : 'bg-blue-50/80 border-blue-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isVerified
                  ? 'bg-emerald-600 text-white'
                  : isRejected || isForCompliance
                  ? 'bg-rose-600 text-white'
                  : isIncomplete
                  ? 'bg-amber-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">
                  {isVerified
                    ? 'PESO/LGU Verification Status: Verified'
                    : isRejected || isForCompliance
                    ? 'PESO/LGU Verification Status: Rejected — Action Required'
                    : isIncomplete
                    ? 'PESO/LGU Verification Status: Incomplete Profile / Missing Documents'
                    : 'PESO/LGU Verification Status: Pending PESO/LGU Verification'}
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700">
                  {uploadedDocs.length} Document{uploadedDocs.length === 1 ? '' : 's'} Uploaded
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isVerified
                  ? 'Your company profile and business verification documents have been officially verified by PESO/LGU. Job vacancy posting is unlocked.'
                  : isRejected || isForCompliance
                  ? currentEmployerProfile.complianceRemarks ||
                    currentEmployerProfile.verificationNotes ||
                    'Your submitted verification documents require correction or replacement. Review the PESO/LGU feedback below, upload updated files, and click "Submit for PESO/LGU Verification".'
                  : isIncomplete
                  ? 'Your account is not queued for PESO/LGU verification yet. Complete all required company details and upload your business verification documents below, then click "Submit for PESO/LGU Verification".'
                  : 'Your company profile and uploaded documents are currently in the PESO/LGU verification queue. Job posting will unlock automatically once approved.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                isProfileDetailsComplete
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {isProfileDetailsComplete ? '✓ Profile Details Complete' : '• Profile Details Incomplete'}
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                hasVerificationDocuments
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {hasVerificationDocuments ? '✓ Documents Uploaded' : '• Missing Documents'}
            </span>
          </div>
        </div>
      </div>

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
              onChange={e => setCompanyName(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Authorized Representative *</label>
            <input
              type="text"
              required
              value={representativeName}
              onChange={e => setRepresentativeName(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold uppercase"
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
              onChange={e => setAddress(e.target.value.toUpperCase())}
              placeholder="BUILDING, STREET, BARANGAY, MUNICIPALITY"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium uppercase"
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
                <div
                  onClick={() => employerLogoInputRef.current?.click()}
                  className="w-16 h-16 rounded-2xl bg-white overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer"
                  title="Click to upload company logo"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                <h4 className="text-xs font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Custom Company Brand Logo & Profile Photo</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Upload your establishment's official logo. If left empty, your logo area remains completely blank.
                </p>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                  <button
                    type="button"
                    onClick={() => employerLogoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? 'Change Company Logo' : 'Upload Logo File'}</span>
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
                      Remove Logo (Leave Blank)
                    </button>
                  )}
                </div>
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
            onChange={e => setCompanyDescription(e.target.value.toUpperCase())}
            placeholder="DESCRIBE YOUR COMPANY'S MISSION, BACKGROUND, AND HIRING STANDARDS..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 uppercase"
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
                onChange={e => setBusinessPermitNo(e.target.value.toUpperCase())}
                placeholder="BP-2026-ROX-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">DTI or SEC Registration No.</label>
              <input
                type="text"
                value={dtiSecRegistration}
                onChange={e => setDtiSecRegistration(e.target.value.toUpperCase())}
                placeholder="DTI-XXXXX OR SEC-XXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">BIR Form 2303 (TIN)</label>
              <input
                type="text"
                value={bir2303No}
                onChange={e => setBir2303No(e.target.value.toUpperCase())}
                placeholder="000-000-000-000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Business Verification & Documents Section (Real File Upload) */}
        <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4 text-indigo-600" />
                Business Verification &amp; Documents (PESO/LGU Accreditation)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload your real business verification files (supports <strong>.png, .jpg, .jpeg, .pdf, .doc, .docx</strong> up to 10MB). Every uploaded file is visible and inspectable by the PESO/LGU Admin.
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              {uploadedDocs.length} Document{uploadedDocs.length === 1 ? '' : 's'} Attached
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PESO_EMPLOYER_REQUIREMENTS.map((req, idx) => {
              const attachedDoc = uploadedDocs.find(d => d.requirementId === req.id);
              const hasFile = Boolean(attachedDoc);

              return (
                <div
                  key={req.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    hasFile
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    ref={el => {
                      docInputRefs.current[req.id] = el;
                    }}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => handleRealDocumentUpload(req.id, req.title, e)}
                  />

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
                        <Check className="w-3 h-3 text-emerald-600" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                        Not Uploaded
                      </span>
                    )}
                  </div>

                  {attachedDoc ? (
                    <div className="mt-2.5 pl-7 space-y-2">
                      <div className="p-2 bg-white border border-emerald-200 rounded-lg flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 truncate">{attachedDoc.fileName}</p>
                          <p className="text-[10px] text-slate-500">{attachedDoc.fileSize}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(attachedDoc)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => docInputRefs.current[req.id]?.click()}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(attachedDoc.id)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 pl-7">
                      <button
                        type="button"
                        onClick={() => docInputRefs.current[req.id]?.click()}
                        className="text-[11px] font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File (.pdf, .jpg, .png, .docx)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Additional / Other Supporting Verification Documents */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Additional Supporting Business Documents</h4>
                <p className="text-[11px] text-slate-500">
                  Upload any additional permits, BIR 2303, DOLE certificates, or LGU clearances.
                </p>
              </div>
              <input
                ref={additionalDocInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                className="hidden"
                onChange={e => handleRealDocumentUpload('additional', 'Supporting Business Document', e)}
              />
              <button
                type="button"
                onClick={() => additionalDocInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ Upload Additional Document</span>
              </button>
            </div>

            {uploadedDocs.filter(d => d.requirementId === 'additional').length > 0 && (
              <div className="space-y-2 pt-1">
                {uploadedDocs
                  .filter(d => d.requirementId === 'additional')
                  .map(doc => (
                    <div
                      key={doc.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-500">{doc.fileSize}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md cursor-pointer"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Profile & Submit for PESO/LGU Verification Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-600">
            {!canSubmitForVerification ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  To submit for PESO/LGU verification, complete all required Company &amp; Business Details (*) and upload at least 1 verification document.
                </span>
              </span>
            ) : isVerified ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your employer profile and documents are officially verified by PESO/LGU.</span>
              </span>
            ) : (
              <span className="text-indigo-700 font-semibold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Ready for PESO/LGU verification review.</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>

            {!isVerified && (
              <button
                type="button"
                disabled={!canSubmitForVerification}
                onClick={handleSubmitForPesoVerification}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit for PESO/LGU Verification</span>
              </button>
            )}
          </div>
        </div>

      </form>

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {previewDoc.requirementTitle || 'Verification Document Preview'}
                </p>
                <h3 className="text-sm font-bold truncate">{previewDoc.fileName}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-slate-100 flex items-center justify-center min-h-[320px]">
              {previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.fileName}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md bg-white"
                />
              ) : previewDoc.mimeType === 'application/pdf' || previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[70vh] rounded-lg border border-slate-300 bg-white"
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 max-w-md">
                  <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">{previewDoc.fileName}</h4>
                  <p className="text-xs text-slate-500">
                    File Size: {previewDoc.fileSize} • Format: {previewDoc.mimeType || 'Document'}
                  </p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File to Inspect</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

