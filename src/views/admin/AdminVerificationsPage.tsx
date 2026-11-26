import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployerStatus, EmployerVerificationDocument } from '../../types';
import { PESO_EMPLOYER_REQUIREMENTS } from '../../data/pesoEmployerRequirements';
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Check,
  X,
  FileCheck,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';

interface AdminVerificationsPageProps {
  initialEmployerId?: string;
  onNavigate: (view: string, params?: any) => void;
}

export const AdminVerificationsPage: React.FC<AdminVerificationsPageProps> = ({ initialEmployerId }) => {
  const { employers, verifyEmployer, showToast } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'for_compliance' | 'verified' | 'rejected' | 'incomplete'>('all');
  const [selectedEmployerId, setSelectedEmployerId] = useState<string | null>(initialEmployerId || null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [previewDoc, setPreviewDoc] = useState<EmployerVerificationDocument | null>(null);

  const filteredEmployers = employers.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'pending_verification') {
      return e.status === 'pending_verification' || e.status === 'pending';
    }
    return e.status === filter;
  });

  const selectedEmployer = employers.find(e => e.id === selectedEmployerId) || filteredEmployers[0];

  const selectedEmployerDocs: EmployerVerificationDocument[] = selectedEmployer?.documents || [];

  const isSelectedEmployerProfileComplete = Boolean(
    selectedEmployer &&
    selectedEmployer.isProfileCompleted &&
    selectedEmployer.companyName?.trim() &&
    selectedEmployer.representativeName?.trim() &&
    selectedEmployer.contactNumber?.trim() &&
    selectedEmployer.address?.trim()
  );

  const canVerifySelectedEmployer = Boolean(
    isSelectedEmployerProfileComplete && selectedEmployerDocs.length > 0
  );

  const handleStatusUpdate = (status: EmployerStatus) => {
    if (!selectedEmployer) return;
    if (status === 'verified' && !canVerifySelectedEmployer) {
      showToast({
        type: 'alert',
        title: 'Cannot Verify Employer Yet',
        message: 'This employer cannot be verified because their company profile is incomplete or they have zero uploaded verification documents.'
      });
      return;
    }
    verifyEmployer(selectedEmployer.id, status, verificationNotes);
    setVerificationNotes('');
  };

  const pendingCount = employers.filter(e => e.status === 'pending_verification' || e.status === 'pending').length;
  const incompleteCount = employers.filter(e => e.status === 'incomplete').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Employer Business Verification Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspect real uploaded employer verification documents (DTI/SEC, Mayor&apos;s Permit, BIR 2303, Clearances) before approving PESO accreditation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${filter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All (<span className="tabular-nums">{employers.length}</span>)
          </button>
          <button
            onClick={() => setFilter('pending_verification')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${filter === 'pending_verification' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Pending Review (<span className="tabular-nums">{pendingCount}</span>)
          </button>
          <button
            onClick={() => setFilter('incomplete')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${filter === 'incomplete' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Incomplete (<span className="tabular-nums">{incompleteCount}</span>)
          </button>
          <button
            onClick={() => setFilter('for_compliance')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${filter === 'for_compliance' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            For Compliance (<span className="tabular-nums">{employers.filter(e => e.status === 'for_compliance').length}</span>)
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${filter === 'verified' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Verified (<span className="tabular-nums">{employers.filter(e => e.status === 'verified').length}</span>)
          </button>
        </div>
      </div>

      {/* Main Grid: List + Detail Inspector */}
      {filteredEmployers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Employer Records</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter !== 'all' 
              ? `There are currently no employers with "${filter.replace(/_/g, ' ')}" status.`
              : 'There are currently no employers registered in the system.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredEmployers.map(emp => {
              const isSelected = selectedEmployer?.id === emp.id;
              const docCount = emp.documents?.length || 0;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployerId(emp.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50/60 border-indigo-400 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {emp.logoUrl ? (
                        <img
                          src={emp.logoUrl}
                          alt={emp.companyName}
                          className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{emp.companyName || 'Unnamed Employer'}</h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {emp.municipality} • {docCount} file{docCount === 1 ? '' : 's'} uploaded
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 border ${
                      emp.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      emp.status === 'pending_verification' || emp.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      emp.status === 'incomplete' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                      emp.status === 'for_compliance' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {emp.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        {/* Right Detail Inspector */}
        <div className="lg:col-span-7">
          {selectedEmployer ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  {selectedEmployer.logoUrl ? (
                    <img
                      src={selectedEmployer.logoUrl}
                      alt={selectedEmployer.companyName}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 shrink-0" />
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedEmployer.companyName || 'Unnamed Employer'}</h2>
                    <p className="text-xs text-slate-500">{selectedEmployer.industry || 'Industry not specified'} • {selectedEmployer.municipality}, Oriental Mindoro</p>
                  </div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase border ${
                  selectedEmployer.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  selectedEmployer.status === 'for_compliance' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  selectedEmployer.status === 'pending_verification' || selectedEmployer.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  selectedEmployer.status === 'incomplete' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                  selectedEmployer.status === 'suspended' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {selectedEmployer.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Company Details & Compliance Grid (Zero Fake Fallback Numbers) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Representative</p>
                  <p className="font-semibold text-slate-800">{selectedEmployer.representativeName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</p>
                  <p className="font-semibold text-slate-800">{selectedEmployer.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</p>
                  <p className="font-semibold text-slate-800">{selectedEmployer.contactNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Business Permit No.</p>
                  <p className="font-mono font-semibold text-slate-800">{selectedEmployer.businessPermitNo || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">DTI / SEC Registration</p>
                  <p className="font-mono font-semibold text-slate-800">{selectedEmployer.dtiSecRegistration || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">BIR Form 2303 (TIN)</p>
                  <p className="font-mono font-semibold text-slate-800">{selectedEmployer.bir2303No || 'Not provided'}</p>
                </div>
              </div>

              {/* Employer-Uploaded Verification Documents (Clickable & Inspectable) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    <span>Employer-Uploaded Verification Documents ({selectedEmployerDocs.length})</span>
                  </p>
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-bold">
                    Click any file to view or download
                  </span>
                </div>

                {selectedEmployerDocs.length === 0 ? (
                  <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-1.5">
                    <ShieldAlert className="w-7 h-7 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold text-amber-950">No documents uploaded yet</p>
                    <p className="text-[11px] text-amber-800 max-w-md mx-auto">
                      This employer has not uploaded any business verification documents yet. Approval is locked until the employer uploads their documents and completes their profile.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {selectedEmployerDocs.map((doc, idx) => {
                      const reqMeta = PESO_EMPLOYER_REQUIREMENTS.find(r => r.id === doc.requirementId);
                      return (
                        <div
                          key={doc.id || idx}
                          onClick={() => setPreviewDoc(doc)}
                          className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 hover:border-emerald-400 transition-all cursor-pointer flex items-start justify-between gap-2.5 group"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {doc.requirementTitle || reqMeta?.title || 'Business Verification Document'}
                              </p>
                            </div>
                            <p className="text-[11px] font-mono font-semibold text-indigo-700 group-hover:underline truncate pl-6">
                              📄 {doc.fileName}
                            </p>
                            <p className="text-[10px] text-slate-500 pl-6">
                              {doc.fileSize} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setPreviewDoc(doc);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View File</span>
                            </button>
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName}
                              onClick={e => e.stopPropagation()}
                              className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] rounded-md flex items-center gap-1"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remarks History if any */}
              {(selectedEmployer.complianceRemarks || selectedEmployer.verificationNotes) && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                  <p className="font-bold text-amber-900">Current PESO Remarks / Requirements:</p>
                  <p className="text-amber-800">{selectedEmployer.complianceRemarks || selectedEmployer.verificationNotes}</p>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">Company Profile Description</p>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                  {selectedEmployer.companyDescription || 'No company description provided yet.'}
                </p>
              </div>

              {/* Verification Decision Controls */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">PESO Officer Verification Action</p>
                  {!canVerifySelectedEmployer && (
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        Approval disabled: {!isSelectedEmployerProfileComplete ? 'Incomplete profile details' : 'Zero documents uploaded'}
                      </span>
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  placeholder="Enter specific verification notes or compliance instructions for the employer..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={!canVerifySelectedEmployer}
                    title={
                      !canVerifySelectedEmployer
                        ? 'Cannot approve: Employer must complete profile details and upload at least 1 verification document.'
                        : 'Approve & Verify Employer'
                    }
                    onClick={() => handleStatusUpdate('verified')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Approve &amp; Verify Employer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedEmployer) return;
                      const notes = verificationNotes || "Please submit a clear copy of your updated Mayor's Business Permit and valid BIR 2303 Certificate.";
                      verifyEmployer(selectedEmployer.id, 'for_compliance', notes);
                      setVerificationNotes('');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Return for Compliance
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('rejected')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Reject Registration
                  </button>

                  {selectedEmployer.status === 'verified' && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate('suspended')}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-700 cursor-pointer"
                    >
                      Suspend Account
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Select an employer record to inspect</p>
            </div>
          )}
        </div>

      </div>
      )}

      {/* In-App Document Preview Modal for PESO/LGU Admin */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {previewDoc.requirementTitle || 'Employer Verification Document'}
                </p>
                <h3 className="text-sm font-bold truncate">{previewDoc.fileName}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
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

            <div className="p-5 flex-1 overflow-y-auto bg-slate-100 flex items-center justify-center min-h-[380px]">
              {previewDoc.mimeType.startsWith('image/') ||
              /\.(png|jpe?g|gif|webp)$/i.test(previewDoc.fileName) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.fileName}
                  className="max-h-[74vh] w-auto object-contain rounded-lg shadow-md bg-white"
                />
              ) : previewDoc.mimeType === 'application/pdf' ||
                previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[74vh] rounded-lg border border-slate-300 bg-white"
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 max-w-md">
                  <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">{previewDoc.fileName}</h4>
                  <p className="text-xs text-slate-500">
                    File Size: {previewDoc.fileSize} • Format: {previewDoc.mimeType || 'Office Document'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click the button below to download and inspect this document on your device.
                  </p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {previewDoc.fileName}</span>
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
