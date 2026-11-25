import {
  ExtractedResumePayload,
  TRADE_SKILLS,
  ADMIN_SKILLS,
  SERVICE_HOSPITALITY_SKILLS,
  SALES_COMMERCE_SKILLS,
  IT_CREATIVE_SKILLS,
  SOFT_SKILLS_LIST,
} from '../../../utils/resumeExtractorCore';

export interface WizardValidationResults {
  hasName: boolean;
  hasContact: boolean;
  hasAddress: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasPreferences: boolean;
}

export interface CategorizedSkills {
  tradeSkills: string[];
  adminSkills: string[];
  serviceSkills: string[];
  salesSkills: string[];
  itSkills: string[];
  softSkills: string[];
}

export function toDateInputValue(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    if (y >= 1930 && y <= new Date().getFullYear()) {
      return `${y}-${m}-${d}`;
    }
  }
  return '';
}

export function distributeExtractedSkills(extractedData: ExtractedResumePayload): CategorizedSkills {
  const newTrade = new Set<string>(extractedData.tradeSkills || []);
  const newAdmin = new Set<string>(extractedData.administrativeSkills || []);
  const newService = new Set<string>(extractedData.serviceHospitalitySkills || []);
  const newSales = new Set<string>(extractedData.salesCustomerSkills || []);
  const newIt = new Set<string>(extractedData.itCreativeSkills || extractedData.technicalSkills || []);
  const newSoft = new Set<string>(extractedData.softSkills || []);

  const generalSkills = [
    ...(extractedData.extractedSkills || []),
    ...(extractedData.technicalSkills || []),
  ];

  for (const rawSkill of generalSkills) {
    const s = rawSkill.trim();
    if (!s) continue;
    const lower = s.toLowerCase();

    if (SOFT_SKILLS_LIST.some(soft => lower.includes(soft))) {
      newSoft.add(s);
    } else if (TRADE_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
      newTrade.add(s);
    } else if (ADMIN_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
      newAdmin.add(s);
    } else if (SERVICE_HOSPITALITY_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
      newService.add(s);
    } else if (SALES_COMMERCE_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
      newSales.add(s);
    } else if (IT_CREATIVE_SKILLS.some(item => lower.includes(item.toLowerCase()))) {
      newIt.add(s);
    }
  }

  // Ensure foundational soft skills exist for validation & PESO readiness
  if (newSoft.size === 0) {
    newSoft.add('Clear Communication');
    newSoft.add('Teamwork');
    newSoft.add('Punctuality');
    newSoft.add('Adaptability');
  }

  return {
    tradeSkills: Array.from(newTrade),
    adminSkills: Array.from(newAdmin),
    serviceSkills: Array.from(newService),
    salesSkills: Array.from(newSales),
    itSkills: Array.from(newIt),
    softSkills: Array.from(newSoft),
  };
}

export const AVATAR_PRESETS = [
  { label: 'Corporate A', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Corporate B', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Professional C', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Professional D', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

export const PRESET_CATEGORIES = [
  { id: 'it', label: 'Information Technology & Software', group: 'Industry Sectors' },
  { id: 'business', label: 'Business, Accounting & Finance', group: 'Industry Sectors' },
  { id: 'agri', label: 'Agriculture & Agribusiness', group: 'Industry Sectors' },
  { id: 'tourism', label: 'Tourism, Hotel & Restaurant', group: 'Industry Sectors' },
  { id: 'engineering', label: 'Engineering & Construction', group: 'Industry Sectors' },
  { id: 'healthcare', label: 'Healthcare, Nursing & Medical', group: 'Industry Sectors' },
  { id: 'education', label: 'Education & Academic Services', group: 'Industry Sectors' },
  { id: 'retail', label: 'Customer Service & Retail', group: 'Industry Sectors' },
  { id: 'govt', label: 'Government & Public Administration', group: 'Industry Sectors' },
  { id: 'admin_office', label: 'Administration & Office Management', group: 'Department Tracks' },
  { id: 'accounting_track', label: 'Accounting, Auditing & Bookkeeping', group: 'Department Tracks' },
  { id: 'customer_ops', label: 'Customer Support & Operations', group: 'Department Tracks' },
  { id: 'marketing_sales', label: 'Marketing, Sales & Advertising', group: 'Department Tracks' },
  { id: 'human_resources', label: 'Human Resources & Recruitment', group: 'Department Tracks' },
  { id: 'auto_trade', label: 'Automotive & Mechanical Servicing', group: 'Technical & Trade' },
  { id: 'electric_trade', label: 'Electrical Wiring & Electronics', group: 'Technical & Trade' },
  { id: 'weld_trade', label: 'Welding & Metal Fabrication (SMAW)', group: 'Technical & Trade' },
  { id: 'carpentry_trade', label: 'Carpentry & Construction Trade', group: 'Technical & Trade' },
  { id: 'rac_trade', label: 'Refrigeration & Air Conditioning (RAC)', group: 'Technical & Trade' },
];

export const PRESET_LOCATIONS = [
  { id: 'roxas', label: 'Roxas, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'mansalay', label: 'Mansalay, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'bongabong', label: 'Bongabong, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'calapan', label: 'Calapan City, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'puerto_galera', label: 'Puerto Galera, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'pinamalayan', label: 'Pinamalayan, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'gloria', label: 'Gloria, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'bansud', label: 'Bansud, Oriental Mindoro', group: 'Municipalities & Cities' },
  { id: 'brgy_dangay', label: 'Brgy. Dangay, Roxas', group: 'Specific Barangays' },
  { id: 'brgy_bagumbayan', label: 'Brgy. Bagumbayan, Roxas', group: 'Specific Barangays' },
  { id: 'brgy_poblacion', label: 'Brgy. Poblacion, Roxas', group: 'Specific Barangays' },
  { id: 'brgy_san_mariano', label: 'Brgy. San Mariano, Roxas', group: 'Specific Barangays' },
  { id: 'brgy_paclasan', label: 'Brgy. Paclasan, Roxas', group: 'Specific Barangays' },
  { id: 'brgy_cantil', label: 'Brgy. Cantil, Roxas', group: 'Specific Barangays' },
  { id: 'within_mindoro', label: 'Within Oriental Mindoro', group: 'Regional & Flexible' },
  { id: 'outside_province', label: 'Outside Province (Nationwide)', group: 'Regional & Flexible' },
  { id: 'remote_wfh', label: 'Remote / Work From Home', group: 'Regional & Flexible' },
  { id: 'any_location', label: 'Any Location (Open to Relocation)', group: 'Regional & Flexible' },
];

export const PRESET_EMPLOYMENT_TYPES = [
  { id: 'full_time', label: 'Full-Time', desc: 'Standard 40+ hours regular schedule' },
  { id: 'part_time', label: 'Part-Time', desc: 'Flexible reduced hours' },
  { id: 'flexible', label: 'Flexible Schedule', desc: 'Self-paced or shifting hours' },
  { id: 'permanent', label: 'Permanent / Regular', desc: 'Long-term job security with benefits' },
  { id: 'contractual', label: 'Contractual / Fixed-Term', desc: 'Defined contract period' },
  { id: 'project_based', label: 'Project-Based', desc: 'Specific milestone duration' },
  { id: 'freelance', label: 'Freelance / Consultant', desc: 'Independent service arrangement' },
  { id: 'seasonal', label: 'Seasonal / On-Call', desc: 'Peak-season demand' },
  { id: 'internship', label: 'Internship / OJT', desc: 'Academic or on-the-job training' },
  { id: 'apprenticeship', label: 'Apprenticeship', desc: 'Hands-on trade qualification' },
];

export const PRESET_SALARIES = [
  '₱12,000 - ₱18,000 (Entry Level)',
  '₱18,000 - ₱25,000 (Mid Level)',
  '₱25,000 - ₱40,000 (Professional)',
  '₱40,000 - ₱60,000 (Senior / Supervisory)',
  '₱60,000+ (Executive / Highly Specialized)',
  'Negotiable based on standard rate',
];
