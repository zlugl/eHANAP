import React from 'react';
import { Plus, Award, Eye, Edit2 } from 'lucide-react';
import { CertificationRecord } from '../../../../types';

export interface CertificationsSectionProps {
  certificationsList: any[];
  onOpenAddCert: () => void;
  onOpenEditCert: (record: any) => void;
  onPreviewProof: (proof: { name: string; url: string; issuer: string; date?: string }) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  certificationsList = [],
  onOpenAddCert,
  onOpenEditCert,
  onPreviewProof
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Certifications & Licenses</h4>
          <p className="text-xs text-slate-500">TESDA NC, PRC licenses, and training certificates</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddCert}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certificate</span>
        </button>
      </div>

      {certificationsList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No certifications recorded</p>
          <p className="text-[11px] text-slate-400 mt-1">Upload your TESDA NC or PRC certificates to increase hiring chances.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {certificationsList.map(cert => (
            <div
              key={cert.id}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{cert.name}</p>
                <p className="text-xs text-slate-600">
                  {cert.issuingOrganization || cert.issuer} • {cert.dateObtained || cert.date}
                </p>
                {(cert.documentUrl || cert.imageUrl) && (
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewProof({
                        name: cert.name,
                        url: (cert.documentUrl || cert.imageUrl)!,
                        issuer: cert.issuingOrganization || cert.issuer || '',
                        date: cert.dateObtained || cert.date
                      })
                    }
                    className="mt-1.5 text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> View Certificate Proof
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenEditCert(cert)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-white cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
