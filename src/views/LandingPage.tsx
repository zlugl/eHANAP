import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, CheckCircle2, UserCheck, ShieldCheck, MapPin, Building2, Briefcase } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenAuth: (mode: 'login' | 'register', initialRole?: 'job_seeker' | 'employer') => void;
}

interface CandidateSample {
  name: string;
  barangay: string;
  role: string;
  education: string;
  score: number;
  nodes: { label: string; weight: string; score: string; status: string }[];
}

const CANDIDATES: CandidateSample[] = [
  {
    name: 'Maria Elena Santos',
    barangay: 'Dangay, Roxas',
    role: 'Junior Systems Assistant',
    education: 'BS Information Technology',
    score: 94,
    nodes: [
      { label: 'Educational attainment', weight: '25%', score: '25%', status: 'meets requirement' },
      { label: 'Degree alignment', weight: '20%', score: '20%', status: 'exact alignment' },
      { label: 'Skills competency', weight: '30%', score: '25%', status: '5 of 6 matched domains' },
      { label: 'Work experience', weight: '15%', score: '14%', status: '2 verifiable years' },
      { label: 'Verified credentials', weight: '10%', score: '10%', status: 'civil service passer' },
    ],
  },
  {
    name: 'Roberto D. Alcantara',
    barangay: 'Bagumbayan, Roxas',
    role: 'Warehouse Assistant',
    education: 'TVET Automotive & Logistics',
    score: 88,
    nodes: [
      { label: 'Educational attainment', weight: '25%', score: '25%', status: 'meets requirement' },
      { label: 'Degree alignment', weight: '20%', score: '16%', status: 'related technical trade' },
      { label: 'Skills competency', weight: '30%', score: '24%', status: '4 of 6 matched domains' },
      { label: 'Work experience', weight: '15%', score: '13%', status: '3 verifiable years' },
      { label: 'Verified credentials', weight: '10%', score: '10%', status: 'tesda national certificate' },
    ],
  },
];

const FAQS = [
  {
    question: 'What credentials do job seekers need to register?',
    answer: 'College graduates provide resumes in PDF or DOCX format. High school graduates and vocational youth complete the standardized municipal bio-data record.',
  },
  {
    question: 'How does the automated candidate ranking engine calculate compatibility?',
    answer: 'The system evaluates five deterministic nodes: educational attainment (25%), degree alignment (20%), skills overlap (30%), experience (15%), and verified certifications (10%).',
  },
  {
    question: 'What documentation must local Roxas employers submit for vacancy verification?',
    answer: 'Accredited businesses submit an active Mayor’s Permit from the BPLO, DTI or SEC registration, and valid sanitary and fire safety clearances.',
  },
  {
    question: 'How are regional Local Recruitment Activities coordinated?',
    answer: 'External employers accredited by PESO run scheduled hiring sessions in Roxas, issuing municipal referral slips to prescreened residents.',
  },
];

const TIERS = [
  {
    role: 'Job seeker registration',
    scope: 'Roxas residents and youth',
    proof: 'Resume or municipal bio-data',
    service: 'Automated ranking alerts and one-click application',
  },
  {
    role: 'Local employer accreditation',
    scope: 'Verified Roxas businesses',
    proof: 'Mayor’s permit and DTI/SEC',
    service: 'Ranked candidate rosters and direct interview scheduling',
  },
  {
    role: 'Regional LRA partner',
    scope: 'External provincial employers',
    proof: 'PESO accreditation certificate',
    service: 'Municipal recruitment venue and prescreened referral slips',
  },
  {
    role: 'PESO municipal monitoring',
    scope: 'LGU administration',
    proof: 'Municipal charter authority',
    service: 'Barangay labor statistics and employment placement tracking',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { jobPosts, employers } = useApp();
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);

  const activeCandidate = CANDIDATES[activeCandidateIndex];

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans antialiased">
      {/* Hero Section · Posture: Stage */}
      <section className="pt-12 pb-20 border-b border-[var(--color-rule)]">
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Columns 1 to 5: Headline, Lede, Actions */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.08] text-[var(--color-ink)]">
                Municipal employment matched by verified credentials.
              </h1>

              <p className="text-lg text-[var(--color-muted)] leading-relaxed max-w-[50ch]">
                Public employment service matching engine for job seekers and employers in Roxas.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('jobs')}
                  className="btn btn--primary"
                >
                  Find local vacancies
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register', 'employer')}
                  className="btn btn--quiet"
                >
                  Employer portal
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--color-rule)] text-sm text-[var(--color-muted)] flex items-center gap-4">
                <span>20 Roxas barangays covered</span>
                <span className="text-[var(--color-rule)]">/</span>
                <span>Deterministic ranking</span>
              </div>
            </div>

            {/* Columns 6 to 12: Live Decision Tree Matching Engine Visual */}
            <div className="lg:col-span-7">
              <div
                data-slot="hero"
                data-kind="product"
                className="entry notebook p-6 border border-[var(--color-ink)] shadow-[var(--shadow-lift)]"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--color-ink)]">
                  <div>
                    <span className="text-xs text-[var(--color-muted)] block">Decision tree matching engine</span>
                    <span className="font-display text-lg font-semibold text-[var(--color-ink)]">
                      {activeCandidate.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--color-muted)] block">Rank compatibility</span>
                    <span className="num font-display text-2xl font-semibold text-[var(--color-accent)]">
                      {activeCandidate.score}%
                    </span>
                  </div>
                </div>

                {/* Candidate Selector Switcher */}
                <div className="py-3 flex items-center gap-2 border-b border-[var(--color-rule)]" role="tablist" aria-label="Sample candidate evaluation">
                  {CANDIDATES.map((cand, idx) => (
                    <button
                      key={cand.name}
                      type="button"
                      role="tab"
                      aria-selected={activeCandidateIndex === idx}
                      onClick={() => setActiveCandidateIndex(idx)}
                      className={`btn btn--quiet text-xs py-1 px-3 min-h-[36px] ${
                        activeCandidateIndex === idx
                          ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]'
                          : ''
                      }`}
                    >
                      {cand.name} ({cand.barangay})
                    </button>
                  ))}
                </div>

                {/* Candidate Overview */}
                <div className="py-3 text-xs text-[var(--color-muted)] flex items-center justify-between border-b border-[var(--color-rule)]">
                  <span>Educational attainment: <strong className="text-[var(--color-ink)] font-medium">{activeCandidate.education}</strong></span>
                  <span className="text-[var(--color-green)] font-medium">PESO verified profile</span>
                </div>

                {/* Five Evaluation Nodes Table */}
                <div className="divide-y divide-[var(--color-rule)] text-sm">
                  {activeCandidate.nodes.map((node) => (
                    <div key={node.label} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-[var(--color-ink)]">{node.label}</span>
                        <span className="num text-xs text-[var(--color-muted)]">(weight {node.weight})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--color-muted)]">{node.status}</span>
                        <span className="num font-medium text-[var(--color-ink)] w-12 text-right">
                          {node.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footnote */}
                <div className="mt-4 pt-3 border-t border-[var(--color-ink)] flex items-center justify-between text-xs text-[var(--color-muted)]">
                  <span>Evaluation complexity: O(log n)</span>
                  <span>Roxas PESO thesis implementation</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Narrative Workflow Stage 1.0 */}
      <section className="py-24 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
                1.0 Credentials intake and verification
              </h2>
              <p className="text-[var(--color-muted)] leading-relaxed">
                Dual credential ingestion accommodates diverse backgrounds across Roxas. Resumes are parsed for university graduates, and structured bio-data registers vocational seekers and youth.
              </p>

              <figure className="mt-6 border border-[var(--color-rule)] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-paper-2)]">
                <div data-slot="municipal-hall" data-alt="Municipality of Roxas Municipal Hall">
                  <img
                    src="/assets/images/Municipal.jpeg"
                    alt="Municipality of Roxas Municipal Hall, Oriental Mindoro"
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="p-3 text-xs text-[var(--color-muted)] border-t border-[var(--color-rule)] flex items-center justify-between">
                  <span>Roxas Municipal Hall</span>
                  <span>PESO Operations Desk</span>
                </figcaption>
              </figure>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-6 rounded-[var(--radius-card)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
                  <span className="font-medium text-sm text-[var(--color-ink)]">Standardized municipal intake format</span>
                  <span className="text-xs text-[var(--color-green)] font-medium">BPLO & PESO compliant</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 border border-[var(--color-rule)] rounded-[var(--radius-pill)] bg-[var(--color-paper)]">
                    <span className="font-medium block text-[var(--color-ink)]">Formal resume ingestion</span>
                    <span className="text-xs text-[var(--color-muted)] mt-1 block">
                      PDF and DOCX extraction parses degree alignment, verified years, and vocational skill keywords.
                    </span>
                  </div>
                  <div className="p-4 border border-[var(--color-rule)] rounded-[var(--radius-pill)] bg-[var(--color-paper)]">
                    <span className="font-medium block text-[var(--color-ink)]">Structured bio-data intake</span>
                    <span className="text-xs text-[var(--color-muted)] mt-1 block">
                      Standard form captures high-school attainment, TVET trade skills, and barangay residence.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Workflow Stage 2.0 */}
      <section className="py-24 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)]">
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
                2.0 Deterministic decision tree scoring
              </h2>
              <p className="text-[var(--color-muted)] leading-relaxed">
                Applicants are evaluated across five objective nodes. Scores calculate deterministically to produce transparent matching rankings across all 20 Roxas barangays.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-[var(--color-rule)] bg-[var(--color-paper)] p-6 rounded-[var(--radius-card)]">
                <div className="pb-3 border-b border-[var(--color-rule)] mb-3">
                  <span className="font-medium text-sm text-[var(--color-ink)]">Five-node scoring distribution</span>
                </div>
                <div className="divide-y divide-[var(--color-rule)] text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span>Node 1: Educational attainment level</span>
                    <span className="num font-medium text-[var(--color-ink)]">25% weight</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span>Node 2: Degree and course alignment</span>
                    <span className="num font-medium text-[var(--color-ink)]">20% weight</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span>Node 3: Six-domain technical skills overlap</span>
                    <span className="num font-medium text-[var(--color-ink)]">30% weight</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span>Node 4: Verifiable experience delta</span>
                    <span className="num font-medium text-[var(--color-ink)]">15% weight</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span>Node 5: Government and TESDA certifications</span>
                    <span className="num font-medium text-[var(--color-ink)]">10% weight</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Workflow Stage 3.0 */}
      <section className="py-24 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
                3.0 PESO referral and recruitment facilitation
              </h2>
              <p className="text-[var(--color-muted)] leading-relaxed">
                Vacancies publish only after PESO compliance approval. Qualified candidates receive automated match alerts and official municipal referral slips for direct interview scheduling.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-6 rounded-[var(--radius-card)] space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
                  <span className="font-medium text-sm text-[var(--color-ink)]">Municipal placement pipeline</span>
                  <span className="text-xs text-[var(--color-accent)] font-medium">Official PESO authorization</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-3 border border-[var(--color-rule)] rounded-[var(--radius-pill)] bg-[var(--color-paper)] flex items-start gap-3">
                    <span className="num font-semibold text-[var(--color-ink)]">A.</span>
                    <div>
                      <span className="font-medium block text-[var(--color-ink)]">Employer compliance audit</span>
                      <span className="text-xs text-[var(--color-muted)]">Verification of Mayor’s Permit, DTI/SEC registrations, and fire safety clearances.</span>
                    </div>
                  </div>
                  <div className="p-3 border border-[var(--color-rule)] rounded-[var(--radius-pill)] bg-[var(--color-paper)] flex items-start gap-3">
                    <span className="num font-semibold text-[var(--color-ink)]">B.</span>
                    <div>
                      <span className="font-medium block text-[var(--color-ink)]">Automated candidate ranking roster</span>
                      <span className="text-xs text-[var(--color-muted)]">Live sortable candidate table with transparent match reasoning for employers.</span>
                    </div>
                  </div>
                  <div className="p-3 border border-[var(--color-rule)] rounded-[var(--radius-pill)] bg-[var(--color-paper)] flex items-start gap-3">
                    <span className="num font-semibold text-[var(--color-ink)]">C.</span>
                    <div>
                      <span className="font-medium block text-[var(--color-ink)]">Local Recruitment Activity coordination</span>
                      <span className="text-xs text-[var(--color-muted)]">Facilitation of regional mass-hiring activities for partners like Puregold Calapan.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Municipal Inquiries (FAQ) */}
      <section className="py-24 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)]">
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
              Municipal employment inquiries
            </h2>
            <p className="text-[var(--color-muted)] mt-2">
              Common questions on seeker registration, employer accreditation, and candidate matching in Roxas.
            </p>
          </div>

          <div className="border-t border-[var(--color-ink)] divide-y divide-[var(--color-rule)]">
            {FAQS.map((faq) => (
              <div key={faq.question} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <h3 className="font-medium text-base text-[var(--color-ink)] leading-snug">
                    {faq.question}
                  </h3>
                </div>
                <div className="md:col-span-7">
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Municipal Facilitation Tiers (Table) */}
      <section className="py-24 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
        <div className="max-w-[var(--container)] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
              Accreditation and service criteria
            </h2>
            <p className="text-[var(--color-muted)] mt-2">
              Statutory requirements and system capabilities across each municipal user tier.
            </p>
          </div>

          <div className="overflow-x-auto border-t border-[var(--color-ink)]">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-rule)] text-[var(--color-muted)]">
                  <th className="py-3 pr-4 font-medium">Participant role</th>
                  <th className="py-3 px-4 font-medium">Municipal scope</th>
                  <th className="py-3 px-4 font-medium">Required proof</th>
                  <th className="py-3 pl-4 font-medium">System capability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-rule)]">
                {TIERS.map((tier) => (
                  <tr key={tier.role} className="hover:bg-[var(--color-paper-2)]">
                    <td className="py-4 pr-4 font-medium text-[var(--color-ink)]">{tier.role}</td>
                    <td className="py-4 px-4 text-[var(--color-muted)]">{tier.scope}</td>
                    <td className="py-4 px-4 text-[var(--color-muted)]">{tier.proof}</td>
                    <td className="py-4 pl-4 text-[var(--color-muted)]">{tier.service}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
