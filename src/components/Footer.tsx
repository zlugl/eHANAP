import React from 'react';
import { FileText, MapPin, Mail, Phone, Shield } from 'lucide-react';
import { ROXAS_BARANGAYS } from '../constants';

export const Footer: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-[var(--color-paper-2)] text-[var(--color-ink)] border-t border-[var(--color-rule)] font-body">
      <div className="max-w-[var(--container)] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand & Mandate */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[var(--color-ink)] flex items-center justify-center text-[var(--color-paper)]">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                eHANAP
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Localized job and skills matching marketplace designed for the Public Employment Service Office (PESO) of Roxas, Oriental Mindoro.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('privacy')}
              className="flex items-center gap-2 text-xs text-[var(--color-green)] font-medium hover:underline cursor-pointer text-left"
            >
              <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Compliant with Data Privacy Act (RA 10173)</span>
            </button>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
              System navigation
            </h4>
            <ul className="space-y-2 text-xs text-[var(--color-muted)]">
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('jobs')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  Vacancies in Roxas
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('landing')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  Candidate ranking
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('seeker-dashboard')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  Seeker workspace
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('employer-dashboard')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  Employer portal
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('admin-dashboard')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  PESO administration
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('privacy')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate?.('terms')} 
                  className="hover:text-[var(--color-ink)] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Roxas Barangays Coverage */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
              Municipal coverage
            </h4>
            <p className="text-[11px] text-[var(--color-muted)] mb-2">Covering all 20 barangays in Roxas:</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[var(--color-muted)]">
              {ROXAS_BARANGAYS.slice(0, 10).map(b => (
                <span key={b}>Barangay {b}</span>
              ))}
              <span className="text-[var(--color-accent-ink)] font-medium">+10 additional barangays</span>
            </div>
          </div>

          {/* PESO Roxas Office Contact Info */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
              PESO Roxas office
            </h4>
            <ul className="space-y-2 text-xs text-[var(--color-muted)]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Municipal Hall Compound, Roxas, Oriental Mindoro 5212</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--color-muted)] shrink-0" aria-hidden="true" />
                <span>peso.roxas@ormindoro.gov.ph</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--color-muted)] shrink-0" aria-hidden="true" />
                <span className="num">(043) 289-ROXAS · 0917-PESO-RXS</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Colophon Bar */}
        <div className="mt-10 pt-6 border-t border-[var(--color-rule)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[var(--color-muted)] text-left">
          <div className="space-y-1">
            <p>© 2026 eHANAP · Public Employment Service Office, Municipality of Roxas, Oriental Mindoro.</p>
            <p className="text-[11px] text-[var(--color-muted)]">
              BSCS research project by M. F. Lomboy, L. J. Escalona, and R. M. Sacapaño · Advised by Dr. John Edgar S. Anthony.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('privacy')}
              className="hover:text-[var(--color-ink)] transition-colors underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onNavigate?.('terms')}
              className="hover:text-[var(--color-ink)] transition-colors underline cursor-pointer"
            >
              Terms of Service
            </button>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-muted)]" aria-hidden="true" />
              <span>Roxas, Oriental Mindoro</span>
            </span>
            <span>·</span>
            <span>DOLE-PESO Accredited</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
