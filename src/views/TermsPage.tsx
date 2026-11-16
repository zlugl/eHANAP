import React from 'react';
import { 
  FileCheck, 
  ShieldAlert, 
  ArrowLeft, 
  Building2, 
  UserCheck, 
  Scale, 
  Ban, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';

interface TermsPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
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
            RA 8759 / RA 10691 Compliant
          </span>
        </div>

        {/* Page Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs font-medium text-[var(--color-accent-ink)]">
            <Scale className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
            <span>Public Employment Service Office (PESO) · Municipality of Roxas, Oriental Mindoro</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)] font-display">
            Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
            Welcome to <strong>eHANAP</strong>, the official localized employment facilitation marketplace developed 
            for the Public Employment Service Office (PESO) of the Municipality of Roxas, Oriental Mindoro. 
            By registering, logging in, or browsing this platform, you agree to comply with and be bound by the following terms.
          </p>

          {/* Applicable Domains Banner */}
          <div className="p-4 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
              <Globe className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
              <span>Scope & Active Application Domains</span>
            </div>
            <p className="text-[var(--color-muted)] leading-relaxed">
              These Terms of Service govern usage across our deployment environments, currently hosted at{' '}
              <a 
                href="https://e-hanap.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-[var(--color-accent-ink)] underline hover:opacity-80"
              >
                https://e-hanap.vercel.app/
              </a>{' '}
              and the designated municipal production portal{' '}
              <span className="font-mono text-[var(--color-accent-ink)]">https://ehanap.roxas.gov.ph</span>.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)] pt-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Effective Date: November 16, 2026 · Version 2.1</span>
            </div>
          </div>
        </div>

        {/* Section 1: Non-Fee Charging Public Mandate */}
        <section className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-950 dark:text-emerald-100">
              1. Non-Fee Charging Guarantee (Free Public Service)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200/90 leading-relaxed">
            In accordance with <strong>Republic Act No. 8759</strong> (The PESO Act of 2000) and <strong>Republic Act No. 10691</strong>, 
            eHANAP is a public employment service funded and administered for public welfare. 
            <strong> Under no circumstances will job seekers ever be charged placement fees, application fees, referral fees, 
            or administrative charges.</strong> Any employer or recruiter attempting to collect fees from job seekers will face 
            immediate blacklisting, license revocation, and referral to DOLE for prosecution.
          </p>
        </section>

        {/* Section 2: User Roles & Eligibility */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              2. User Accounts & Registration Eligibility
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Job Seekers */}
            <div className="p-5 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-2">
              <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Job Seekers (Constituents)</span>
              </h3>
              <p className="text-[var(--color-muted)] leading-relaxed">
                Must be at least 15 years old (subject to Philippine child labor regulations for specific employment types) 
                and residing or seeking employment within the Municipality of Roxas, Oriental Mindoro, or neighboring areas. 
                Users agree to provide truthful education, technical skill, and employment history data.
              </p>
            </div>

            {/* Employers */}
            <div className="p-5 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-2">
              <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Employers & Establishments</span>
              </h3>
              <p className="text-[var(--color-muted)] leading-relaxed">
                Must be duly registered business enterprises operating in Roxas or authorized to conduct recruitment 
                in the municipality. Employers must upload verifiable government credentials (Mayor's Business Permit, 
                DTI/SEC Certificate, and BIR 2303) before vacancy listings can be published.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Authentication & Account Security */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              3. Authentication & Account Security
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            All users authenticate through Supabase Native Authentication or Google OAuth 2.0:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
            <li><strong>6-Digit Email OTP Verification:</strong> Email verification codes dispatched during sign-up and password reset expire within 10 minutes and must not be shared.</li>
            <li><strong>Single Active Identity:</strong> Users may not register duplicate accounts under simulated credentials or alternate email aliases.</li>
            <li><strong>Credential Confidentiality:</strong> Users are solely responsible for maintaining the confidentiality of their passwords and for all activities occurring under their authenticated accounts.</li>
          </ul>
        </section>

        {/* Section 4: Algorithmic Candidate Matching & Ranking */}
        <section className="p-5 sm:p-6 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-ink)] text-[var(--color-paper)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              4. Algorithmic Candidate Ranking Disclosure
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
            eHANAP incorporates an explainable, deterministic <strong>Decision Tree Compatibility Engine</strong> and 
            Applicant Tracking System (ATS) to assist employers and PESO officers in ranking job applicants:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
            <li>Scores evaluate educational attainment, required technical skills, soft skills, and Roxas barangay residency.</li>
            <li>Evaluation criteria are objective, transparent, and strictly non-discriminatory regarding gender, civil status, or non-work factors.</li>
            <li>Final hiring, interview scheduling, and placement decisions remain exclusively at the discretion of the employer and candidate.</li>
          </ul>
        </section>

        {/* Section 5: Prohibited Activities */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              5. Prohibited Conduct & Penalties
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            The following actions constitute severe violations and will result in immediate permanent account termination 
            and civil/criminal reporting to law enforcement:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
            <li><strong>Illegal Recruitment:</strong> Engaging in illegal recruitment or human trafficking as defined under Republic Act No. 8042 and Republic Act No. 10022.</li>
            <li><strong>Discriminatory Postings:</strong> Specifying age, religious, gender, or disability preferences not reasonably required by the nature of the job.</li>
            <li><strong>Falsified Credentials:</strong> Submitting fake educational diplomas, fraudulent government permits, or altered tax documents.</li>
            <li><strong>System Exploitation:</strong> Attempting to reverse engineer, scrape, bypass Row Level Security, or inject malicious payloads into eHANAP.</li>
          </ul>
        </section>

        {/* Section 6: Governing Law */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-ink)]">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              6. Governing Law & Jurisdiction
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            These Terms of Service are governed by and construed in accordance with the laws of the 
            <strong> Republic of the Philippines</strong>, including the Labor Code of the Philippines, the Data Privacy Act of 2012, 
            and applicable municipal ordinances of Roxas, Oriental Mindoro. 
            Any dispute arising from these terms shall be submitted to the exclusive jurisdiction of the competent courts of 
            Roxas, Oriental Mindoro, Philippines.
          </p>
        </section>

        {/* Section 7: Contact Information */}
        <section className="p-6 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              7. Inquiries & Institutional Administration
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            For questions regarding these Terms of Service or to report suspected employment fraud:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-ink)] block">Office:</strong>
                <span className="text-[var(--color-muted)]">PESO Roxas, Municipal Hall Compound, Roxas, Oriental Mindoro</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-ink)] block">Email:</strong>
                <a href="mailto:peso.roxas@ormindoro.gov.ph" className="text-[var(--color-accent-ink)] underline">
                  peso.roxas@ormindoro.gov.ph
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--color-ink)] block">Telephone:</strong>
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
            onClick={() => onNavigate('privacy')}
            className="btn btn--quiet text-xs sm:text-sm"
          >
            <span>View Privacy Policy</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
};
