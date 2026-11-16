import React from 'react';
import { 
  Shield, 
  Lock, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  ExternalLink,
  UserCheck,
  Database,
  Clock
} from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Navigation Breadcrumb & Back Action */}
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-4">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Return to eHANAP Home</span>
          </button>
          <span className="text-xs text-[var(--color-muted)] font-mono">
            RA 10173 / NPC Compliant
          </span>
        </div>

        {/* Page Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs font-medium text-[var(--color-accent-ink)]">
            <Shield className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
            <span>Public Employment Service Office (PESO) · Municipality of Roxas, Oriental Mindoro</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)] font-display">
            Data Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
            This Data Privacy Policy details how the <strong>eHANAP</strong> Municipal Employment Facilitation Platform 
            collects, protects, processes, and safeguards the personal data of constituents, job seekers, and registered 
            employers in the Municipality of Roxas, Province of Oriental Mindoro, Philippines.
          </p>

          {/* Applicable Domains Banner */}
          <div className="p-4 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
              <Globe className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
              <span>Scope & Applicable Service Domains</span>
            </div>
            <p className="text-[var(--color-muted)] leading-relaxed">
              This policy governs all services accessible via the primary deployment web application at{' '}
              <a 
                href="https://e-hanap.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-[var(--color-accent-ink)] underline hover:opacity-80"
              >
                https://e-hanap.vercel.app/
              </a>{' '}
              as well as the designated municipal institutional domain{' '}
              <span className="font-mono text-[var(--color-accent-ink)]">https://ehanap.roxas.gov.ph</span>.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)] pt-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Effective Date: November 16, 2026 · Version 2.1 (Supabase Auth & Google OAuth Update)</span>
            </div>
          </div>
        </div>

        {/* Section 1: Statutory & Legal Framework */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              1. Statutory & Legal Mandate
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            eHANAP operates in strict adherence to <strong>Republic Act No. 10173</strong>, otherwise known as the{' '}
            <em>Data Privacy Act of 2012 (DPA)</em>, its Implementing Rules and Regulations (IRR), and all pertinent 
            circulars issued by the National Privacy Commission (NPC) of the Republic of the Philippines.
          </p>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Our data processing operations are also conducted pursuant to <strong>Republic Act No. 8759</strong> (The Public 
            Employment Service Office Act of 2000), as amended by <strong>Republic Act No. 10691</strong>, which mandates 
            free public employment facilitation and institutional labor market information (LMI) aggregation for municipal socio-economic development.
          </p>
        </section>

        {/* Section 2: Personal Information We Collect */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              2. Personal Information We Collect
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Job Seekers */}
            <div className="p-5 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-2.5">
              <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Job Seeker Data</span>
              </h3>
              <ul className="space-y-1.5 text-[var(--color-muted)] list-disc pl-4 leading-relaxed">
                <li>Full name, date of birth, gender, and civil status.</li>
                <li>Contact number, email address, and barangay residency in Roxas.</li>
                <li>Educational background, degrees, certifications, and technical/soft skills.</li>
                <li>Work experience history and uploaded resume documents (PDF, DOCX).</li>
                <li>Employment status and job preferences (preferred barangay, shift, terms).</li>
              </ul>
            </div>

            {/* Employers */}
            <div className="p-5 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-2.5">
              <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Employer / Business Data</span>
              </h3>
              <ul className="space-y-1.5 text-[var(--color-muted)] list-disc pl-4 leading-relaxed">
                <li>Registered business name, trade name, and industry classification.</li>
                <li>Authorized representative name, official email, and corporate contact details.</li>
                <li>Municipal business address within or operating in Roxas, Oriental Mindoro.</li>
                <li>Accreditation compliance documents: Mayor's Permit, DTI/SEC registration, BIR Form 2303.</li>
                <li>Job vacancy listings, salary ranges, and job qualification requirements.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Google OAuth 2.0 User Data Usage */}
        <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-ink)] flex items-center justify-center text-[var(--color-paper)]">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              3. Google OAuth 2.0 User Data Policy
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            When you select <strong>"Continue with Google"</strong> to register or sign in to eHANAP:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-[var(--color-muted)] list-disc pl-5 leading-relaxed">
            <li>
              <strong>Requested Scopes:</strong> eHANAP requests access only to standard, non-sensitive identity scopes: 
              your verified email address (<code className="font-mono bg-[var(--color-paper)] px-1 py-0.5 rounded">userinfo.email</code>) 
              and basic public profile (<code className="font-mono bg-[var(--color-paper)] px-1 py-0.5 rounded">userinfo.profile</code>).
            </li>
            <li>
              <strong>Purpose of Use:</strong> Google account data is utilized strictly for identity authentication, secure account creation, 
              email verification bypass (since the email is pre-verified by Google), and hydrating your default display name and profile avatar.
            </li>
            <li>
              <strong>Limited Use Compliance:</strong> eHANAP's use and transfer of information received from Google APIs adhere to the 
              <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
            </li>
            <li>
              <strong>No Third-Party Sale:</strong> We never sell, rent, commercialize, or share your Google user data with any advertisers, 
              data brokers, or non-affiliated third parties.
            </li>
          </ul>
        </section>

        {/* Section 4: Purpose of Data Processing */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              4. Purposes of Data Processing
            </h2>
          </div>
          <div className="space-y-2 text-sm text-[var(--color-muted)] leading-relaxed">
            <p>Your personal information is collected and processed solely for the following legitimate public purposes:</p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Facilitating direct job matching between Roxas job seekers and accredited employers using an objective, explainable Decision Tree algorithm.</li>
              <li>Generating official DOLE-PESO Referral Slips for shortlisted candidates.</li>
              <li>Managing attendance, qualifications, and placement records for Local Recruitment Activities (LRA) and municipal job fairs.</li>
              <li>Compiling anonymized, aggregated municipal employment statistics for submission to DOLE and the Local Chief Executive of Roxas.</li>
              <li>Preventing fraudulent job advertisements, illegal recruitment, and unauthorized credential impersonation.</li>
            </ol>
          </div>
        </section>

        {/* Section 5: Data Security & Dual Storage */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              5. Data Protection & Security Architecture
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            eHANAP enforces enterprise-grade security controls to protect constituent data:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[var(--color-muted)]">
            <li className="p-3.5 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="block text-[var(--color-ink)] mb-1">PostgreSQL Row Level Security (RLS)</strong>
              All database records in Supabase are governed by strict RLS policies restricting read/write operations to authenticated owners and PESO administrators.
            </li>
            <li className="p-3.5 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="block text-[var(--color-ink)] mb-1">End-to-End Encryption</strong>
              All data transmitted between the client browser and Supabase servers is protected via Transport Layer Security (TLS 1.3).
            </li>
            <li className="p-3.5 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="block text-[var(--color-ink)] mb-1">Immutable Audit Logging</strong>
              All administrative approvals, document verifications, candidate status updates, and employer clearances are recorded in a permanent municipal audit trail.
            </li>
            <li className="p-3.5 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="block text-[var(--color-ink)] mb-1">Academic & Offline Safeguards</strong>
              Offline thesis defense runs operate strictly in client-side memory and sandboxed local storage without transmitting sensitive credentials over public internet.
            </li>
          </ul>
        </section>

        {/* Section 6: Constituent Rights under RA 10173 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              6. Your Rights as a Data Subject
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Under Republic Act No. 10173, every registered constituent possesses the following enforceable rights:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="text-[var(--color-ink)] block mb-1">Right to Access</strong>
              You may view, review, and export all personal information and resume records associated with your account at any time.
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="text-[var(--color-ink)] block mb-1">Right to Rectify</strong>
              You can correct, update, or modify inaccurate profile, skills, education, or contact details directly via your profile wizard.
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <strong className="text-[var(--color-ink)] block mb-1">Right to Erasure</strong>
              You have the right to request the deletion or deactivation of your account and resume files by contacting the PESO Roxas DPO.
            </div>
          </div>
        </section>

        {/* Section 7: Data Protection Officer (DPO) Contact */}
        <section className="p-6 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              7. Contact Our Data Protection Officer (DPO)
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            For inquiries, clarification, or requests regarding your data rights under Republic Act No. 10173, please contact 
            the Public Employment Service Office of Roxas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-ink)] block">Office Address:</strong>
                <span className="text-[var(--color-muted)]">Municipal Hall Compound, Roxas, Oriental Mindoro 5212</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-ink)] block">Official Email:</strong>
                <a href="mailto:peso.roxas@ormindoro.gov.ph" className="text-[var(--color-accent-ink)] underline">
                  peso.roxas@ormindoro.gov.ph
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-ink)] block">Hotline:</strong>
                <span className="text-[var(--color-muted)]">(043) 289-ROXAS · 0917-PESO-RXS</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-[var(--color-rule)]">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="btn btn--primary text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to eHANAP Home</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className="btn btn--quiet text-xs sm:text-sm"
          >
            <span>View Terms of Service</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
};
