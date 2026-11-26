import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ORIENTAL_MINDORO_MUNICIPALITIES } from '../../constants';
import { isEmployerVerifiedToPostJobs } from '../../utils/routeGuards';
import { EvaluatedSkillItem, JobMatchWeights, JobPostRequirement, JobSkillItem } from '../../types';
import {
  X,
  AlertCircle,
  Sparkles,
  Building2,
  Search,
  ChevronDown,
  Check,
  Zap,
  Eye,
  ArrowRight,
  Star,
  Gift,
  GraduationCap,
} from 'lucide-react';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/* =====================================================================
 * 1. STRUCTURED TAXONOMY & SMART JOB TITLE KNOWLEDGE BASE
 * ===================================================================== */

export const INDUSTRY_CATEGORIES: Record<
  string,
  {
    short: string;
    subCategories: string[];
    suggestedSkills: string[];
    suggestedCourses: string[];
  }
> = {
  'Information & Communication Technology (ICT)': {
    short: 'ICT',
    subCategories: [
      'Software Development',
      'Web & Mobile Development',
      'IT Support & Helpdesk',
      'Networking & Infrastructure',
      'Data & Analytics',
      'Cybersecurity',
    ],
    suggestedSkills: [
      'JavaScript',
      'React',
      'TypeScript',
      'SQL',
      'Troubleshooting',
      'Networking',
      'Git',
      'Cloud Basics',
      'Python',
      'Technical Support',
      'System Administration',
    ],
    suggestedCourses: [
      'BS Computer Science',
      'BS Information Technology',
      'BS Computer Engineering',
      'BS Information Systems',
    ],
  },
  'Retail, E-Commerce & Consumer Goods': {
    short: 'Retail & E-Commerce',
    subCategories: [
      'Store Operations & Cashiering',
      'Merchandising & Sales',
      'E-Commerce & Marketplace',
      'Inventory & Stock Control',
      'Branch Supervision',
    ],
    suggestedSkills: [
      'POS Operation',
      'Cash Handling',
      'Customer Service',
      'Inventory Control',
      'Product Display & Merchandising',
      'Sales Reporting',
      'Basic Math',
      'Stock Replenishment',
    ],
    suggestedCourses: [
      'BS Business Administration',
      'BS Entrepreneurship',
      'BS Accountancy',
      'BS Hospitality Management',
    ],
  },
  'Manufacturing, Transport & Logistics': {
    short: 'Logistics & Transport',
    subCategories: [
      'Delivery & Fleet Driving',
      'Warehousing & Dispatch',
      'Supply Chain & Procurement',
      'Production & Quality Control',
      'Maintenance',
    ],
    suggestedSkills: [
      'Route Navigation',
      'Defensive Driving',
      'Inventory Management',
      'Dispatch Coordination',
      'Forklift / Loading',
      'Safety Compliance',
      'Excel / Sheets',
      'Quality Inspection',
    ],
    suggestedCourses: [
      'BS Industrial Engineering',
      'BS Business Administration',
      'BS Mechanical Engineering',
      'BS Customs Administration',
    ],
  },
  'BPO & Customer Support': {
    short: 'BPO',
    subCategories: [
      'Voice Customer Support',
      'Non-Voice / Chat Support',
      'Technical Helpdesk',
      'Back-Office & Data Entry',
      'Virtual Assistance',
    ],
    suggestedSkills: [
      'English Communication',
      'Active Listening',
      'CRM Tools',
      'Typing Speed (45+ WPM)',
      'Conflict Resolution',
      'Ticket Handling',
      'Time Management',
      'Email Etiquette',
    ],
    suggestedCourses: [
      'BS Business Administration',
      'BS Information Technology',
      'AB Communication',
      'BS Psychology',
    ],
  },
  'Banking, Financial Services & Insurance (BFSI)': {
    short: 'BFSI',
    subCategories: [
      'Accounting & Bookkeeping',
      'Audit & Tax Compliance',
      'Banking Operations & Teller',
      'Loans & Credit Processing',
      'Financial Analysis',
    ],
    suggestedSkills: [
      'Bookkeeping',
      'Microsoft Excel',
      'Financial Reporting',
      'BIR / Tax Filing',
      'QuickBooks / ERP',
      'Reconciliation',
      'Attention to Detail',
      'Credit Assessment',
    ],
    suggestedCourses: [
      'BS Accountancy',
      'BS Accounting Information System',
      'BS Business Administration',
      'BS Economics',
    ],
  },
  'Healthcare & Life Sciences': {
    short: 'Healthcare',
    subCategories: [
      'Nursing & Clinical Care',
      'Pharmacy & Dispensary',
      'Medical Technology & Lab',
      'Allied Health & Therapy',
      'Clinic Support',
    ],
    suggestedSkills: [
      'Patient Care',
      'Vital Signs Monitoring',
      'Medication Administration',
      'Medical Records (EMR)',
      'Infection Control',
      'First Aid / BLS',
      'Triage',
      'Laboratory Procedures',
    ],
    suggestedCourses: [
      'BS Nursing',
      'BS Medical Technology',
      'BS Pharmacy',
      'BS Midwifery',
      'BS Physical Therapy',
    ],
  },
  'Engineering, Construction & Real Estate': {
    short: 'Engineering & Construction',
    subCategories: [
      'Civil & Structural Engineering',
      'Electrical & Mechanical Engineering',
      'Site Supervision & Foremanship',
      'CAD & Quantity Surveying',
      'Property & Leasing',
    ],
    suggestedSkills: [
      'AutoCAD',
      'Site Supervision',
      'Cost Estimation',
      'Project Scheduling',
      'Structural Analysis',
      'Safety Standards (COSH)',
      'Blueprint Reading',
      'Quality Assurance',
    ],
    suggestedCourses: [
      'BS Civil Engineering',
      'BS Electrical Engineering',
      'BS Mechanical Engineering',
      'BS Architecture',
      'BS Industrial Engineering',
    ],
  },
  'Hospitality, Tourism & Food Service': {
    short: 'Hospitality & Food Service',
    subCategories: [
      'Food & Beverage Service',
      'Kitchen & Culinary',
      'Hotel Front Desk & Guest Relations',
      'Housekeeping',
      'Tour & Events Operations',
    ],
    suggestedSkills: [
      'Food Safety & Hygiene',
      'Customer Service',
      'Order Taking / POS',
      'Beverage Preparation',
      'Multitasking',
      'Hospitality Etiquette',
      'Teamwork',
      'Front Desk Operations',
    ],
    suggestedCourses: [
      'BS Hospitality Management',
      'BS Tourism Management',
      'BS Business Administration',
      'BS Accountancy',
    ],
  },
  'Administration, HR & Corporate Support': {
    short: 'Admin & HR',
    subCategories: [
      'Office Administration & Clerical',
      'Human Resources & Recruitment',
      'Payroll & Benefits',
      'Executive Assistance',
      'Records & Documentation',
    ],
    suggestedSkills: [
      'Microsoft Office',
      'Document Filing',
      'Scheduling',
      'Data Entry',
      'Written Communication',
      'Payroll Assistance',
      'Confidentiality',
      'Recruitment Coordination',
    ],
    suggestedCourses: [
      'BS Business Administration',
      'BS Office Administration',
      'BS Psychology',
      'BS Accountancy',
    ],
  },
  'Education & Training': {
    short: 'Education',
    subCategories: [
      'Basic Education (K-12)',
      'Higher Education & College',
      'Tutoring & Review Centers',
      'ESL & Language Instruction',
      'Corporate / Technical Training',
    ],
    suggestedSkills: [
      'Lesson Planning',
      'Classroom Management',
      'Curriculum Delivery',
      'Student Assessment',
      'Public Speaking',
      'EdTech Tools',
      'Mentoring',
    ],
    suggestedCourses: [
      'Bachelor of Secondary Education',
      'Bachelor of Elementary Education',
      'BS Psychology',
      'AB English / Communication',
    ],
  },
  'Sales, Marketing & Communications': {
    short: 'Sales & Marketing',
    subCategories: [
      'Digital & Social Media Marketing',
      'Field & B2B Sales',
      'Graphic Design & Content',
      'Brand & Events Marketing',
      'Account Management',
    ],
    suggestedSkills: [
      'Social Media Management',
      'Digital Marketing',
      'Sales Negotiation',
      'Canva / Graphic Design',
      'Copywriting',
      'Lead Generation',
      'Client Relations',
      'Brand Strategy',
      'Market Research',
    ],
    suggestedCourses: [
      'BS Business Administration',
      'BS Hospitality Management',
      'BS Tourism Management',
      'BS Accountancy',
      'AB Communication',
    ],
  },
  'Skilled Trades, Agriculture & Energy': {
    short: 'Skilled Trades',
    subCategories: [
      'Electrical & HVAC',
      'Automotive & Diesel Mechanics',
      'Welding & Fabrication',
      'Carpentry & Plumbing',
      'Agribusiness & Field Operations',
    ],
    suggestedSkills: [
      'Electrical Wiring',
      'HVAC Troubleshooting',
      'Preventive Maintenance',
      'Schematic Reading',
      'Safety Procedures',
      'Hand & Power Tools',
      'Equipment Repair',
      'Crop & Farm Management',
    ],
    suggestedCourses: [
      'BS Agriculture',
      'BS Agribusiness',
      'BS Agricultural & Biosystems Engineering',
      'BS Electrical Engineering',
    ],
  },
};

const EDUCATION_LEVEL_OPTIONS = [
  'No Formal Requirement',
  'High School / Junior High',
  'Senior High School',
  'Vocational / TESDA Certificate',
  'College Undergraduate',
  "Bachelor's Degree",
  "Master's / Doctorate",
];

const DEGREE_OPTIONS = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Computer Engineering',
  'BS Information Systems',
  'BS Hospitality Management',
  'BS Tourism Management',
  'BS Accountancy',
  'BS Accounting Information System',
  'BS Business Administration',
  'BS Office Administration',
  'BS Entrepreneurship',
  'BS Nursing',
  'BS Medical Technology',
  'BS Pharmacy',
  'BS Midwifery',
  'BS Civil Engineering',
  'BS Electrical Engineering',
  'BS Mechanical Engineering',
  'BS Industrial Engineering',
  'BS Architecture',
  'Bachelor of Secondary Education',
  'Bachelor of Elementary Education',
  'BS Agriculture',
  'BS Agribusiness',
  'BS Criminology',
  'BS Psychology',
  'AB Communication',
];

const TESDA_OPTIONS = [
  'Electrical Installation & Maintenance NC II',
  'Cookery NC II',
  'Driving NC II',
  'Computer Systems Servicing NC II',
  'Bookkeeping NC III',
  'RAC Servicing (DomRAC) NC II',
  'Food and Beverage Services NC II',
  'Shielded Metal Arc Welding (SMAW) NC II',
  'Automotive Servicing NC II',
  'Bread and Pastry Production NC II',
  'Housekeeping NC II',
  'Caregiving NC II',
];

const LICENSE_OPTIONS = [
  'PRC License',
  'TESDA NC II / III',
  'Civil Service Eligible',
  "Driver's License",
  "Health / Food Handler's Cert",
];

const BENEFIT_OPTIONS = [
  'Statutory Benefits (SSS, PhilHealth, Pag-IBIG)',
  '13th Month Pay',
  'HMO / Health Insurance',
  'Meal / Transport Allowance',
  'Paid Leave / SIL',
  'Commission / Incentives',
  'Overtime Pay',
];

const WEIGHT_PRESETS: Record<'degree' | 'skills' | 'trades', JobMatchWeights> = {
  degree: { education: 40, skills: 30, experience: 20, eligibility: 10 },
  skills: { education: 15, skills: 50, experience: 25, eligibility: 10 },
  trades: { education: 10, skills: 45, experience: 15, eligibility: 30 },
};

interface JobTitlePreset {
  title: string;
  category: string;
  subCategory: string;
  employmentType: string;
  workSetup: 'On-site' | 'Hybrid' | 'Remote' | 'Fieldwork';
  schedule: string;
  salaryMin: number;
  salaryMax: number;
  payFrequency: string;
  acceptedEducationLevels: string[];
  preferredCourses: string[];
  preferredTesda: string[];
  careerLevel: string;
  minExp: number;
  freshGrad: boolean;
  preset: 'degree' | 'skills' | 'trades';
  description: string;
  responsibilities: string[];
}

const JOB_TITLE_PRESETS: JobTitlePreset[] = [
  {
    title: 'Software Engineer',
    category: 'Information & Communication Technology (ICT)',
    subCategory: 'Software Development',
    employmentType: 'Full-time',
    workSetup: 'Hybrid',
    schedule: 'Day Shift',
    salaryMin: 28000,
    salaryMax: 45000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ["Bachelor's Degree", "Master's / Doctorate"],
    preferredCourses: ['BS Computer Science', 'BS Information Technology', 'BS Computer Engineering'],
    preferredTesda: [],
    careerLevel: 'Mid-Level',
    minExp: 2,
    freshGrad: false,
    preset: 'skills',
    description:
      'Design, build, and maintain reliable web and cloud software applications supporting business operations and local clients across Oriental Mindoro.',
    responsibilities: [
      'Develop clean, maintainable full-stack features and REST APIs',
      'Collaborate with product leads to gather requirements and refine workflows',
      'Write automated tests, troubleshoot bugs, and optimize database queries',
      'Participate in code reviews and maintain clear technical documentation',
    ],
  },
  {
    title: 'Junior Web Developer',
    category: 'Information & Communication Technology (ICT)',
    subCategory: 'Web & Mobile Development',
    employmentType: 'Full-time',
    workSetup: 'Hybrid',
    schedule: 'Day Shift',
    salaryMin: 18000,
    salaryMax: 26000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['College Undergraduate', "Bachelor's Degree"],
    preferredCourses: ['BS Information Technology', 'BS Computer Science', 'BS Computer Engineering'],
    preferredTesda: [],
    careerLevel: 'Entry-Level',
    minExp: 0,
    freshGrad: true,
    preset: 'skills',
    description:
      'Assist in building responsive websites, user interfaces, and web portal modules with guidance from senior engineers.',
    responsibilities: [
      'Convert UI designs into responsive, mobile-friendly web pages',
      'Integrate frontend components with backend APIs and databases',
      'Debug layout and cross-browser issues across desktop and mobile devices',
      'Maintain existing web portals and implement content updates',
    ],
  },
  {
    title: 'IT Support Specialist',
    category: 'Information & Communication Technology (ICT)',
    subCategory: 'IT Support & Helpdesk',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Day Shift',
    salaryMin: 16000,
    salaryMax: 23000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['Vocational / TESDA Certificate', 'College Undergraduate', "Bachelor's Degree"],
    preferredCourses: ['BS Information Technology', 'BS Computer Science', 'BS Computer Engineering'],
    preferredTesda: ['Computer Systems Servicing NC II'],
    careerLevel: 'Junior',
    minExp: 1,
    freshGrad: true,
    preset: 'skills',
    description:
      'Provide day-to-day technical support for office workstations, network connectivity, printers, and software systems.',
    responsibilities: [
      'Diagnose and resolve hardware, software, and LAN/Wi-Fi issues promptly',
      'Set up new employee computers, user accounts, and security updates',
      'Perform routine preventive maintenance on workstations and peripherals',
      'Document support tickets and escalate complex network incidents',
    ],
  },
  {
    title: 'Store Cashier',
    category: 'Retail, E-Commerce & Consumer Goods',
    subCategory: 'Store Operations & Cashiering',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Shifting / Rotating',
    salaryMin: 12500,
    salaryMax: 15500,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['High School / Junior High', 'Senior High School', 'College Undergraduate'],
    preferredCourses: [],
    preferredTesda: [],
    careerLevel: 'Entry-Level',
    minExp: 0,
    freshGrad: true,
    preset: 'trades',
    description:
      'Deliver friendly, fast, and accurate checkout transactions for shoppers while maintaining clean counters and accurate daily cash reconciliation.',
    responsibilities: [
      'Operate POS cash register to scan merchandise and process cash/e-wallet payments',
      'Issue receipts, verify discounts/senior IDs, and give accurate change',
      'Reconcile cash drawer totals at the start and end of each shift',
      'Assist customers with product inquiries and maintain a tidy checkout lane',
    ],
  },
  {
    title: 'Merchandiser / Sales Associate',
    category: 'Retail, E-Commerce & Consumer Goods',
    subCategory: 'Merchandising & Sales',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Shifting / Rotating',
    salaryMin: 12500,
    salaryMax: 16000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['High School / Junior High', 'Senior High School', 'College Undergraduate'],
    preferredCourses: [],
    preferredTesda: [],
    careerLevel: 'Entry-Level',
    minExp: 0,
    freshGrad: true,
    preset: 'trades',
    description:
      'Keep retail shelves stocked, organized, and visually appealing while helping customers locate products and hit monthly store sales targets.',
    responsibilities: [
      'Replenish shelves, check product expiry dates, and maintain neat displays',
      'Assist shoppers with product recommendations and promotions',
      'Conduct regular stock counts and report low-inventory items to supervisors',
      'Ensure accurate price tagging and promotional signage across aisles',
    ],
  },
  {
    title: 'Registered Nurse',
    category: 'Healthcare & Life Sciences',
    subCategory: 'Nursing & Clinical Care',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Shifting / Rotating',
    salaryMin: 22000,
    salaryMax: 32000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ["Bachelor's Degree"],
    preferredCourses: ['BS Nursing'],
    preferredTesda: [],
    careerLevel: 'Junior',
    minExp: 1,
    freshGrad: true,
    preset: 'degree',
    description:
      'Provide compassionate, safe clinical nursing care, patient monitoring, and health education in accordance with Philippine healthcare standards.',
    responsibilities: [
      'Assess patients, record vital signs, and update electronic medical charts accurately',
      'Administer prescribed medications and assist physicians during procedures',
      'Monitor patient recovery and promptly escalate critical changes',
      'Educate patients and families on discharge care and preventive wellness',
    ],
  },
  {
    title: 'Delivery Driver / Rider',
    category: 'Manufacturing, Transport & Logistics',
    subCategory: 'Delivery & Fleet Driving',
    employmentType: 'Full-time',
    workSetup: 'Fieldwork',
    schedule: 'Day Shift',
    salaryMin: 520,
    salaryMax: 750,
    payFrequency: 'Per Day',
    acceptedEducationLevels: ['High School / Junior High', 'Senior High School', 'Vocational / TESDA Certificate'],
    preferredCourses: [],
    preferredTesda: ['Driving NC II'],
    careerLevel: 'Entry-Level',
    minExp: 1,
    freshGrad: false,
    preset: 'trades',
    description:
      'Transport parcels, goods, and supplies safely and on schedule across Roxas and neighboring municipalities in Oriental Mindoro.',
    responsibilities: [
      'Load, secure, and deliver goods to designated branches and customer addresses',
      'Plan efficient delivery routes and confirm recipient proof-of-delivery',
      'Perform daily pre-trip vehicle checks and report maintenance needs immediately',
      'Follow traffic laws, company safety protocols, and cash-on-delivery remittance rules',
    ],
  },
  {
    title: 'Warehouse Coordinator',
    category: 'Manufacturing, Transport & Logistics',
    subCategory: 'Warehousing & Dispatch',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Day Shift',
    salaryMin: 16000,
    salaryMax: 22000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['College Undergraduate', "Bachelor's Degree"],
    preferredCourses: ['BS Business Administration', 'BS Industrial Engineering'],
    preferredTesda: [],
    careerLevel: 'Junior',
    minExp: 1,
    freshGrad: false,
    preset: 'skills',
    description:
      'Oversee incoming shipments, warehouse stock accuracy, and outbound dispatch schedules to keep local supply chains running smoothly.',
    responsibilities: [
      'Receive, inspect, and log incoming goods against purchase orders',
      'Track inventory balances and conduct weekly cycle counts',
      'Coordinate outbound dispatch schedules with drivers and store branches',
      'Maintain organized warehouse zones and enforce workplace safety standards',
    ],
  },
  {
    title: 'Accounting Associate',
    category: 'Banking, Financial Services & Insurance (BFSI)',
    subCategory: 'Accounting & Bookkeeping',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Day Shift',
    salaryMin: 17000,
    salaryMax: 24000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ["Bachelor's Degree"],
    preferredCourses: ['BS Accountancy', 'BS Accounting Information System', 'BS Business Administration'],
    preferredTesda: [],
    careerLevel: 'Junior',
    minExp: 1,
    freshGrad: true,
    preset: 'degree',
    description:
      'Support daily bookkeeping, accounts payable/receivable processing, bank reconciliations, and timely government tax filings.',
    responsibilities: [
      'Record daily financial transactions, invoices, and official receipts accurately',
      'Prepare monthly bank reconciliations and assist with financial statements',
      'Process supplier payments, payroll remittances, and BIR/LGU tax reports',
      'Organize vouchers and audit trails for internal and external reviews',
    ],
  },
  {
    title: 'Customer Service Representative',
    category: 'BPO & Customer Support',
    subCategory: 'Voice Customer Support',
    employmentType: 'Full-time',
    workSetup: 'Remote',
    schedule: 'Shifting / Rotating',
    salaryMin: 18000,
    salaryMax: 25000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['Senior High School', 'College Undergraduate', "Bachelor's Degree"],
    preferredCourses: [],
    preferredTesda: [],
    careerLevel: 'Entry-Level',
    minExp: 0,
    freshGrad: true,
    preset: 'skills',
    description:
      'Handle customer inquiries, resolve account or order concerns via phone/chat/email, and maintain high customer satisfaction scores.',
    responsibilities: [
      'Respond politely and accurately to inbound customer calls, chats, and emails',
      'Troubleshoot order, billing, or service issues within target response times',
      'Log all customer interactions and follow-up actions cleanly in the CRM',
      'Escalate complex account issues while maintaining empathy and professionalism',
    ],
  },
  {
    title: 'Electrician / HVAC Technician',
    category: 'Skilled Trades, Agriculture & Energy',
    subCategory: 'Electrical & HVAC',
    employmentType: 'Full-time',
    workSetup: 'Fieldwork',
    schedule: 'Day Shift',
    salaryMin: 600,
    salaryMax: 900,
    payFrequency: 'Per Day',
    acceptedEducationLevels: ['Vocational / TESDA Certificate', 'College Undergraduate'],
    preferredCourses: [],
    preferredTesda: ['Electrical Installation & Maintenance NC II', 'RAC Servicing (DomRAC) NC II'],
    careerLevel: 'Mid-Level',
    minExp: 2,
    freshGrad: false,
    preset: 'trades',
    description:
      'Install, inspect, repair, and maintain commercial electrical wiring, panels, and air-conditioning systems with strict adherence to safety codes.',
    responsibilities: [
      'Inspect electrical circuits, breakers, and HVAC units to diagnose faults',
      'Install and repair wiring, lighting fixtures, and split/central air-conditioning units',
      'Conduct scheduled preventive maintenance and cleaning for client facilities',
      'Follow electrical safety standards, lockout procedures, and schematic blueprints',
    ],
  },
  {
    title: 'Barista / Service Crew',
    category: 'Hospitality, Tourism & Food Service',
    subCategory: 'Food & Beverage Service',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Shifting / Rotating',
    salaryMin: 12000,
    salaryMax: 15000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['Senior High School', 'Vocational / TESDA Certificate', 'College Undergraduate', "Bachelor's Degree"],
    preferredCourses: ['BS Hospitality Management', 'BS Tourism Management'],
    preferredTesda: ['Food and Beverage Services NC II', 'Cookery NC II'],
    careerLevel: 'Entry-Level',
    minExp: 0,
    freshGrad: true,
    preset: 'trades',
    description:
      'Welcome guests warmly, craft quality beverages, serve food orders promptly, and uphold spotless sanitation standards.',
    responsibilities: [
      'Greet customers, take orders accurately, and handle POS payments',
      'Prepare espresso drinks, cold beverages, and light menu items to recipe standards',
      'Keep counters, espresso equipment, and dining areas clean and sanitized',
      'Restock supplies and assist with opening and closing store routines',
    ],
  },
  {
    title: 'Administrative Assistant',
    category: 'Administration, HR & Corporate Support',
    subCategory: 'Office Administration & Clerical',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Day Shift',
    salaryMin: 14500,
    salaryMax: 19500,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ['College Undergraduate', "Bachelor's Degree"],
    preferredCourses: ['BS Business Administration', 'BS Office Administration', 'BS Accountancy'],
    preferredTesda: [],
    careerLevel: 'Entry-Level',
    minExp: 0,
    freshGrad: true,
    preset: 'degree',
    description:
      'Provide organized administrative, clerical, and coordination support to ensure smooth daily office workflows and documentation.',
    responsibilities: [
      'Manage incoming correspondence, phone inquiries, and office schedules',
      'Prepare memos, reports, spreadsheets, and official filing records',
      'Monitor office supplies inventory and coordinate vendor requests',
      'Assist management with meetings, permits, and staff coordination',
    ],
  },
  {
    title: 'Civil Engineer',
    category: 'Engineering, Construction & Real Estate',
    subCategory: 'Civil & Structural Engineering',
    employmentType: 'Full-time',
    workSetup: 'Fieldwork',
    schedule: 'Day Shift',
    salaryMin: 26000,
    salaryMax: 42000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ["Bachelor's Degree"],
    preferredCourses: ['BS Civil Engineering'],
    preferredTesda: [],
    careerLevel: 'Mid-Level',
    minExp: 2,
    freshGrad: false,
    preset: 'degree',
    description:
      'Plan, supervise, and inspect residential, commercial, or infrastructure construction projects to meet engineering specs, timelines, and budgets.',
    responsibilities: [
      'Supervise on-site construction activities and verify structural plan compliance',
      'Prepare bill of quantities (BOQ), cost estimates, and progress billings',
      'Coordinate with contractors, architects, and local permitting offices',
      'Enforce workplace quality control and occupational safety standards',
    ],
  },
  {
    title: 'Licensed Teacher',
    category: 'Education & Training',
    subCategory: 'Basic Education (K-12)',
    employmentType: 'Full-time',
    workSetup: 'On-site',
    schedule: 'Day Shift',
    salaryMin: 18000,
    salaryMax: 27000,
    payFrequency: 'Per Month',
    acceptedEducationLevels: ["Bachelor's Degree", "Master's / Doctorate"],
    preferredCourses: ['Bachelor of Secondary Education', 'Bachelor of Elementary Education'],
    preferredTesda: [],
    careerLevel: 'Junior',
    minExp: 1,
    freshGrad: true,
    preset: 'degree',
    description:
      'Deliver engaging, student-centered instruction, guide learner growth, and foster an inclusive, well-managed classroom environment.',
    responsibilities: [
      'Prepare curriculum-aligned lesson plans and interactive learning materials',
      'Deliver classroom instruction and evaluate student assignments and exams',
      'Maintain accurate attendance, grading records, and parent communication',
      'Participate in faculty development, school events, and student mentoring',
    ],
  },
];

const PAY_SCHEDULE_OPTIONS = [
  'Daily',
  'Weekly',
  'Bi-Weekly (Every 2 Weeks)',
  'Semi-Monthly (15th & 30th)',
  'Monthly (Every 15th)',
  'Monthly (End of Month)',
  'Hourly',
  'Per Project / Commission-Based',
  'Other (Specify)',
];

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCurrency(val: string | number): string {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return '';
  return '₱' + num.toLocaleString('en-PH');
}

function formatDateReadable(isoDate: string): string {
  if (!isoDate) return 'Not set yet';
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentEmployerProfile, createJobPost, showToast } = useApp();

  const categoryKeys = useMemo(() => Object.keys(INDUSTRY_CATEGORIES), []);

  // View Mode: 'form' | 'preview'
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');

  // Inline Banner Toast
  const [inlineBanner, setInlineBanner] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Section 1: Smart Job Title Combobox
  const [title, setTitle] = useState('');
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);
  const [titleError, setTitleError] = useState(false);

  // Section 2: Clean Blank Default State for Job Category & Sub-Category
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [categoryError, setCategoryError] = useState(false);
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [workSetup, setWorkSetup] = useState<'On-site' | 'Hybrid' | 'Remote' | 'Fieldwork'>('On-site');
  const [municipality, setMunicipality] = useState(
    currentEmployerProfile?.municipality || ORIENTAL_MINDORO_MUNICIPALITIES[0] || 'Roxas'
  );
  const [barangay, setBarangay] = useState('');
  const [savedBarangayBeforeRemote, setSavedBarangayBeforeRemote] = useState('');
  const [workSchedule, setWorkSchedule] = useState('Day Shift');

  // Section 3: Structured Compensation, Headcount & Urgency (All Blank Defaults on Open)
  const [isSalaryNegotiable, setIsSalaryNegotiable] = useState(false);
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [savedSalaryBeforeNeg, setSavedSalaryBeforeNeg] = useState<{ min: string; max: string }>({
    min: '',
    max: '',
  });
  const [paySchedule, setPaySchedule] = useState<string>('');
  const [customPaySchedule, setCustomPaySchedule] = useState<string>('');
  const [salaryError, setSalaryError] = useState(false);
  const [payScheduleError, setPayScheduleError] = useState(false);

  const [vacanciesInput, setVacanciesInput] = useState<string>('');
  const [vacanciesError, setVacanciesError] = useState(false);

  const [deadline, setDeadline] = useState<string>('');
  const [deadlineError, setDeadlineError] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const todayIsoDate = useMemo(() => getTodayIsoDate(), []);

  // Section 4: Role Overview
  const [description, setDescription] = useState('');
  const [descError, setDescError] = useState(false);
  const [responsibilitiesInput, setResponsibilitiesInput] = useState('');

  // Section 5: AI Decision Tree Qualification Logic Parameters
  // 5A. Accepted Educational Levels (Multi-Select, starts empty [])
  const [acceptedEducationLevels, setAcceptedEducationLevels] = useState<string[]>([]);
  const [eduError, setEduError] = useState(false);

  // 5B. Accepted / Preferred Courses & Specializations (Multi-Select, starts empty [])
  const [preferredCourses, setPreferredCourses] = useState<string[]>([]);
  const [anyCourseAllowed, setAnyCourseAllowed] = useState<boolean>(false);
  const [courseSearchInput, setCourseSearchInput] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  // 5C. TESDA / Vocational Qualifications (Multi-Select when Vocational / TESDA is chosen, starts empty [])
  const [preferredTesdaQualifications, setPreferredTesdaQualifications] = useState<string[]>([]);
  const [tesdaSearchInput, setTesdaSearchInput] = useState('');
  const [isTesdaDropdownOpen, setIsTesdaDropdownOpen] = useState(false);

  // 5D. Career Level, Experience & Fresh Grad Toggle
  const [careerLevel, setCareerLevel] = useState<string>('Entry-Level');
  const [minExpYears, setMinExpYears] = useState<number>(0);
  const [openToFreshGraduates, setOpenToFreshGraduates] = useState<boolean>(true);

  // 5E. Required Licenses & Eligibility (Strictly opt-in, starts empty [])
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);

  // 5F. Key Relevant Skills (Must-Have vs Preferred — starts completely empty [])
  const [activeSkills, setActiveSkills] = useState<EvaluatedSkillItem[]>([]);
  const [skillSearchInput, setSkillSearchInput] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  // 4-Factor Auto-Balancing Match Engine Weights (Always 100%)
  const [weights, setWeights] = useState<JobMatchWeights>({
    education: 30,
    skills: 40,
    experience: 20,
    eligibility: 10,
  });

  // Section 6: Benefits & Perks Multi-Select Checkboxes + Custom Perks (Unchecked / Empty by Default)
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [customBenefitInput, setCustomBenefitInput] = useState<string>('');

  // Refs for outside click closing & scrolling
  const titleComboboxRef = useRef<HTMLDivElement>(null);
  const courseComboboxRef = useRef<HTMLDivElement>(null);
  const tesdaComboboxRef = useRef<HTMLDivElement>(null);
  const skillComboboxRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const compensationSectionRef = useRef<HTMLElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const eduSectionRef = useRef<HTMLDivElement>(null);

  // Reset form to clean blank defaults whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('form');
      setInlineBanner(null);
      setTitle('');
      setIsTitleDropdownOpen(false);
      setAutoFillNotice(null);
      setTitleError(false);
      setCategory('');
      setSubCategory('');
      setCategoryError(false);
      setEmploymentType('Full-time');
      setWorkSetup('On-site');
      setMunicipality(currentEmployerProfile?.municipality || ORIENTAL_MINDORO_MUNICIPALITIES[0] || 'Roxas');
      setBarangay('');
      setSavedBarangayBeforeRemote('');
      setWorkSchedule('Day Shift');
      setIsSalaryNegotiable(false);
      setSalaryMin('');
      setSalaryMax('');
      setSavedSalaryBeforeNeg({ min: '', max: '' });
      setPaySchedule('');
      setCustomPaySchedule('');
      setSalaryError(false);
      setPayScheduleError(false);
      setVacanciesInput('');
      setVacanciesError(false);
      setDeadline('');
      setDeadlineError(false);
      setIsUrgent(false);
      setDescription('');
      setDescError(false);
      setResponsibilitiesInput('');
      setAcceptedEducationLevels([]);
      setEduError(false);
      setPreferredCourses([]);
      setAnyCourseAllowed(false);
      setCourseSearchInput('');
      setIsCourseDropdownOpen(false);
      setPreferredTesdaQualifications([]);
      setTesdaSearchInput('');
      setIsTesdaDropdownOpen(false);
      setCareerLevel('Entry-Level');
      setMinExpYears(0);
      setOpenToFreshGraduates(true);
      setSelectedLicenses([]);
      setActiveSkills([]);
      setSkillSearchInput('');
      setIsSkillDropdownOpen(false);
      setWeights({ education: 30, skills: 40, experience: 20, eligibility: 10 });
      setSelectedBenefits([]);
      setCustomBenefitInput('');
    }
  }, [isOpen, currentEmployerProfile?.municipality]);

  // Close combobox dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (titleComboboxRef.current && !titleComboboxRef.current.contains(target)) {
        setIsTitleDropdownOpen(false);
      }
      if (courseComboboxRef.current && !courseComboboxRef.current.contains(target)) {
        setIsCourseDropdownOpen(false);
      }
      if (tesdaComboboxRef.current && !tesdaComboboxRef.current.contains(target)) {
        setIsTesdaDropdownOpen(false);
      }
      if (skillComboboxRef.current && !skillComboboxRef.current.contains(target)) {
        setIsSkillDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-dismiss inline banner after 4.2s
  useEffect(() => {
    if (!inlineBanner) return;
    const t = setTimeout(() => setInlineBanner(null), 4200);
    return () => clearTimeout(t);
  }, [inlineBanner]);

  // Auto-dismiss autoFillNotice after 5.5s
  useEffect(() => {
    if (!autoFillNotice) return;
    const t = setTimeout(() => setAutoFillNotice(null), 5500);
    return () => clearTimeout(t);
  }, [autoFillNotice]);

  // Check if College/Degree or Vocational/TESDA tiers are selected in acceptedEducationLevels
  const hasDegreeLevelSelected = useMemo(() => {
    return acceptedEducationLevels.some(lvl =>
      ['College Undergraduate', "Bachelor's Degree", "Master's / Doctorate"].includes(lvl)
    );
  }, [acceptedEducationLevels]);

  const hasTesdaLevelSelected = useMemo(() => {
    return acceptedEducationLevels.includes('Vocational / TESDA Certificate');
  }, [acceptedEducationLevels]);

  // All known skills across all categories for typeahead search
  const allKnownSkills = useMemo(() => {
    const set = new Set<string>();
    Object.values(INDUSTRY_CATEGORIES).forEach(cat => {
      cat.suggestedSkills.forEach(s => set.add(s));
    });
    return Array.from(set).sort();
  }, []);

  // Filtered job title presets based on query
  const filteredJobTitlePresets = useMemo(() => {
    const q = title.trim().toLowerCase();
    return JOB_TITLE_PRESETS.filter(item => {
      const catShort = (INDUSTRY_CATEGORIES[item.category]?.short || '').toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        catShort.includes(q)
      );
    });
  }, [title]);

  const hasExactPresetTitleMatch = useMemo(() => {
    const q = title.trim().toLowerCase();
    return JOB_TITLE_PRESETS.some(item => item.title.toLowerCase() === q);
  }, [title]);

  // Category-suggested courses not yet selected
  const categorySuggestedCourses = useMemo(() => {
    if (!category || !INDUSTRY_CATEGORIES[category]) return [];
    const selectedLower = new Set(preferredCourses.map(c => c.toLowerCase()));
    return (INDUSTRY_CATEGORIES[category].suggestedCourses || []).filter(
      c => !selectedLower.has(c.toLowerCase())
    );
  }, [category, preferredCourses]);

  // Filtered course options for multi-select combobox
  const filteredCourseOptions = useMemo(() => {
    const q = courseSearchInput.trim().toLowerCase();
    const selectedLower = new Set(preferredCourses.map(c => c.toLowerCase()));
    const pool = Array.from(
      new Set([...(INDUSTRY_CATEGORIES[category]?.suggestedCourses || []), ...DEGREE_OPTIONS])
    );
    return pool.filter(opt => !selectedLower.has(opt.toLowerCase()) && opt.toLowerCase().includes(q));
  }, [courseSearchInput, preferredCourses, category]);

  // Filtered TESDA options for multi-select combobox
  const filteredTesdaOptions = useMemo(() => {
    const q = tesdaSearchInput.trim().toLowerCase();
    const selectedLower = new Set(preferredTesdaQualifications.map(t => t.toLowerCase()));
    return TESDA_OPTIONS.filter(
      opt => !selectedLower.has(opt.toLowerCase()) && opt.toLowerCase().includes(q)
    );
  }, [tesdaSearchInput, preferredTesdaQualifications]);

  // Remaining suggested skills for current category (only when a category is selected!)
  const remainingSuggestedSkills = useMemo(() => {
    if (!category || !INDUSTRY_CATEGORIES[category]) return [];
    const pool = INDUSTRY_CATEGORIES[category].suggestedSkills || [];
    const activeLower = new Set(activeSkills.map(s => s.name.toLowerCase()));
    return pool.filter(s => !activeLower.has(s.toLowerCase()));
  }, [category, activeSkills]);

  // Filtered skill search dropdown matches
  const filteredSkillSearchMatches = useMemo(() => {
    const q = skillSearchInput.trim().toLowerCase();
    if (!q) return [];
    const activeLower = new Set(activeSkills.map(s => s.name.toLowerCase()));
    return allKnownSkills
      .filter(s => s.toLowerCase().includes(q) && !activeLower.has(s.toLowerCase()))
      .slice(0, 8);
  }, [skillSearchInput, activeSkills, allKnownSkills]);

  // Active weight preset detection
  const matchedWeightPreset = useMemo<'degree' | 'skills' | 'trades' | null>(() => {
    for (const [key, preset] of Object.entries(WEIGHT_PRESETS) as [
      'degree' | 'skills' | 'trades',
      JobMatchWeights
    ][]) {
      if (
        preset.education === weights.education &&
        preset.skills === weights.skills &&
        preset.experience === weights.experience &&
        preset.eligibility === weights.eligibility
      ) {
        return key;
      }
    }
    return null;
  }, [weights]);

  if (!isOpen || !currentEmployerProfile) return null;

  // STRICT 3-POINT VERIFICATION CHECK:
  // 1. Employer profile setup is complete
  // 2. Required verification documents are uploaded
  // 3. Employer account status is officially 'verified' by PESO/LGU
  if (!isEmployerVerifiedToPostJobs(currentEmployerProfile)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[3px] motion-safe:animate-in motion-safe:fade-in duration-200 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto ring-8 ring-amber-50">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Cannot Post Job Vacancies Yet</h2>
            <div className="mt-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                PESO Verification Required
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Bago makapag-post ng trabaho sa eHANAP portal, kailangan munang ma-verify ang inyong establisyimento ng{' '}
              <strong>PESO Oriental Mindoro</strong>. Ang kasalukuyang accreditation status ng{' '}
              <strong>{currentEmployerProfile.companyName}</strong> ay:{' '}
              <span className="font-bold text-amber-700 capitalize">
                {currentEmployerProfile.status.replace(/_/g, ' ')}
              </span>
              .
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-slate-700 space-y-2">
            <p className="font-bold text-slate-900">Mga Kailangang Hakbang ng Establisyimento:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>
                Siguraduhing nai-upload ang mga kaukulang dokumento (AITR, DTI/SEC, Sedula, Barangay Clearance, FSIC,
                atbp.) sa inyong profile.
              </li>
              <li>Hintayin ang pagsusuri at kumpirmasyon mula sa PESO Admin Officer.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================================
   * 2. INTERACTION HANDLERS
   * ===================================================================== */

  // When category changes manually, always reset subCategory to "" so the employer explicitly picks one
  const handleCategoryChange = (newCategory: string, presetSubCategory = '') => {
    setCategory(newCategory);
    if (newCategory) setCategoryError(false);
    const subs = INDUSTRY_CATEGORIES[newCategory]?.subCategories || [];
    if (presetSubCategory && subs.includes(presetSubCategory)) {
      setSubCategory(presetSubCategory);
    } else {
      setSubCategory('');
    }
  };

  const handleWorkSetupChange = (setup: 'On-site' | 'Hybrid' | 'Remote' | 'Fieldwork') => {
    if (setup === 'Remote' && workSetup !== 'Remote') {
      setSavedBarangayBeforeRemote(barangay);
      setBarangay('');
    } else if (setup !== 'Remote' && workSetup === 'Remote' && !barangay && savedBarangayBeforeRemote) {
      setBarangay(savedBarangayBeforeRemote);
    }
    setWorkSetup(setup);
  };

  const handleToggleNegotiable = (checked: boolean) => {
    setIsSalaryNegotiable(checked);
    if (checked) {
      setSalaryError(false);
      setSavedSalaryBeforeNeg({ min: salaryMin, max: salaryMax });
    } else if (!salaryMin && !salaryMax && (savedSalaryBeforeNeg.min || savedSalaryBeforeNeg.max)) {
      setSalaryMin(savedSalaryBeforeNeg.min);
      setSalaryMax(savedSalaryBeforeNeg.max);
    }
  };

  // Toggle an educational level in acceptedEducationLevels (Multi-Select)
  const handleToggleEducationLevel = (level: string) => {
    setEduError(false);
    setAcceptedEducationLevels(prev => {
      if (level === 'No Formal Requirement') {
        // Clicking "No Formal Requirement" toggles it or clears restrictive tiers
        return prev.includes('No Formal Requirement') ? prev.filter(l => l !== 'No Formal Requirement') : ['No Formal Requirement'];
      }
      // Removing 'No Formal Requirement' if selecting specific education tiers
      const withoutNoFormal = prev.filter(l => l !== 'No Formal Requirement');
      if (withoutNoFormal.includes(level)) {
        return withoutNoFormal.filter(l => l !== level);
      }
      return [...withoutNoFormal, level];
    });
  };

  // Multi-select Courses handlers
  const handleAddPreferredCourse = (courseName: string) => {
    const cleaned = courseName.trim();
    if (!cleaned) return;
    if (preferredCourses.some(c => c.toLowerCase() === cleaned.toLowerCase())) {
      setCourseSearchInput('');
      setIsCourseDropdownOpen(false);
      return;
    }
    setAnyCourseAllowed(false);
    setPreferredCourses(prev => [...prev, cleaned]);
    setCourseSearchInput('');
    setIsCourseDropdownOpen(false);
  };

  const handleRemovePreferredCourse = (courseName: string) => {
    setPreferredCourses(prev => prev.filter(c => c !== courseName));
  };

  // Multi-select TESDA Qualification handlers
  const handleAddTesdaQualification = (tesdaName: string) => {
    const cleaned = tesdaName.trim();
    if (!cleaned) return;
    if (preferredTesdaQualifications.some(t => t.toLowerCase() === cleaned.toLowerCase())) {
      setTesdaSearchInput('');
      setIsTesdaDropdownOpen(false);
      return;
    }
    setPreferredTesdaQualifications(prev => [...prev, cleaned]);
    setTesdaSearchInput('');
    setIsTesdaDropdownOpen(false);
  };

  const handleRemoveTesdaQualification = (tesdaName: string) => {
    setPreferredTesdaQualifications(prev => prev.filter(t => t !== tesdaName));
  };

  const handleFreshGradToggle = (checked: boolean) => {
    setOpenToFreshGraduates(checked);
    if (checked) {
      setMinExpYears(0);
    } else if (minExpYears === 0) {
      setMinExpYears(1);
    }
  };

  // Selecting a suggested Job Title populates Category, filters Sub-Category, suggests Education Levels,
  // updates the category Suggested Skill Chips pool, and enables "Insert Suggested Responsibilities".
  // NOTE: Keeps Salary, Pay Schedule, Vacancies, Application Deadline, Required Licenses, and Selected Skills untouched/blank!
  const handleApplyJobTitlePreset = (presetTitle: string) => {
    const preset = JOB_TITLE_PRESETS.find(p => p.title === presetTitle);
    if (!preset) return;

    setTitle(preset.title);
    setTitleError(false);
    handleCategoryChange(preset.category, preset.subCategory);
    setEmploymentType(preset.employmentType);
    handleWorkSetupChange(preset.workSetup);
    setWorkSchedule(preset.schedule);

    setDescription(preset.description);
    setDescError(false);
    setResponsibilitiesInput(preset.responsibilities.join('\n'));

    setAcceptedEducationLevels([...preset.acceptedEducationLevels]);
    setEduError(false);
    setPreferredCourses([...preset.preferredCourses]);
    setPreferredTesdaQualifications([...preset.preferredTesda]);
    setAnyCourseAllowed(false);

    setCareerLevel(preset.careerLevel);
    setOpenToFreshGraduates(preset.freshGrad);
    setMinExpYears(preset.freshGrad ? 0 : preset.minExp);

    // Keep Required Licenses, Selected Skills, Salary, Pay Schedule, Vacancies, and Deadline strictly opt-in
    setWeights({ ...WEIGHT_PRESETS[preset.preset] });

    setAutoFillNotice(`Auto-filled category & role parameters for ${preset.title}`);
    setIsTitleDropdownOpen(false);
  };

  const handleInsertSuggestedResponsibilities = () => {
    const typedTitle = title.trim().toLowerCase();
    const presetMatch = JOB_TITLE_PRESETS.find(p => p.title.toLowerCase() === typedTitle);

    let lines: string[] = [];
    if (presetMatch) {
      lines = presetMatch.responsibilities;
    } else {
      const catMatch = JOB_TITLE_PRESETS.find(p => p.category === category);
      if (catMatch) {
        lines = catMatch.responsibilities;
      } else {
        lines = [
          'Execute daily role deliverables accurately and on schedule',
          'Collaborate effectively with team members and department leads',
          'Maintain clear documentation, reports, and service quality standards',
          'Ensure compliance with company policies and workplace safety guidelines',
        ];
      }
    }

    setResponsibilitiesInput(lines.join('\n'));
    setInlineBanner({
      message: 'Inserted tailored responsibilities based on your selected role.',
      type: 'success',
    });
  };

  const handleToggleLicense = (lic: string) => {
    setSelectedLicenses(prev => (prev.includes(lic) ? prev.filter(item => item !== lic) : [...prev, lic]));
  };

  const handleToggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev =>
      prev.some(item => item.toLowerCase() === benefit.toLowerCase())
        ? prev.filter(item => item.toLowerCase() !== benefit.toLowerCase())
        : [...prev, benefit]
    );
  };

  const handleAddCustomBenefit = () => {
    const cleaned = customBenefitInput.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;

    // Case-insensitive duplicate check across both preset options and selectedBenefits
    const matchingPreset = BENEFIT_OPTIONS.find(b => b.toLowerCase() === cleaned.toLowerCase());
    const canonicalName = matchingPreset || cleaned;

    const alreadySelected = selectedBenefits.some(
      b => b.toLowerCase() === canonicalName.toLowerCase()
    );

    if (alreadySelected) {
      setInlineBanner({
        message: `"${canonicalName}" is already selected in Benefits & Perks.`,
        type: 'info',
      });
      setCustomBenefitInput('');
      return;
    }

    setSelectedBenefits(prev => [...prev, canonicalName]);
    setCustomBenefitInput('');
  };

  const handleRemoveCustomBenefit = (benefitToRemove: string) => {
    setSelectedBenefits(prev => prev.filter(item => item !== benefitToRemove));
  };

  const handleAddSkill = (skillName: string, isRequired = false) => {
    const cleaned = skillName.trim();
    if (!cleaned) return;
    const exists = activeSkills.some(s => s.name.toLowerCase() === cleaned.toLowerCase());
    if (exists) {
      setInlineBanner({ message: `"${cleaned}" is already in your selected skills.`, type: 'info' });
      return;
    }
    setActiveSkills(prev => [...prev, { name: cleaned, required: isRequired }]);
    setSkillSearchInput('');
    setIsSkillDropdownOpen(false);
  };

  const handleRemoveSkill = (idx: number) => {
    setActiveSkills(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleSkillPriority = (idx: number) => {
    setActiveSkills(prev =>
      prev.map((item, i) => (i === idx ? { ...item, required: !item.required } : item))
    );
  };

  // Auto-balancing 4-slider weight distribution (Always totals 100%)
  const handleWeightSliderChange = (changedKey: keyof JobMatchWeights, rawValue: string) => {
    const newVal = Math.max(0, Math.min(100, Math.round(Number(rawValue))));
    const keys: (keyof JobMatchWeights)[] = ['education', 'skills', 'experience', 'eligibility'];
    const otherKeys = keys.filter(k => k !== changedKey);
    const remaining = 100 - newVal;

    const currentOtherSum = otherKeys.reduce((acc, k) => acc + weights[k], 0);
    const updated: JobMatchWeights = { ...weights, [changedKey]: newVal };

    if (currentOtherSum === 0) {
      const base = Math.floor(remaining / 3);
      let leftover = remaining - base * 3;
      otherKeys.forEach(k => {
        updated[k] = base + (leftover > 0 ? 1 : 0);
        if (leftover > 0) leftover--;
      });
    } else {
      let assignedSum = 0;
      otherKeys.forEach(k => {
        const scaled = Math.round((weights[k] / currentOtherSum) * remaining);
        updated[k] = Math.max(0, Math.min(100, scaled));
        assignedSum += updated[k];
      });

      let diff = remaining - assignedSum;
      const sortedOthers = [...otherKeys].sort((a, b) => updated[b] - updated[a]);
      let guard = 0;
      while (diff !== 0 && guard < 20) {
        for (const k of sortedOthers) {
          if (diff === 0) break;
          if (diff > 0 && updated[k] < 100) {
            updated[k] += 1;
            diff -= 1;
          } else if (diff < 0 && updated[k] > 0) {
            updated[k] -= 1;
            diff += 1;
          }
        }
        guard++;
      }
    }

    setWeights(updated);
  };

  // Resolved pay schedule string (handles "Other (Specify)" custom text)
  const effectivePaySchedule = useMemo(() => {
    if (paySchedule === 'Other (Specify)') {
      return customPaySchedule.trim() || 'Custom Schedule';
    }
    return paySchedule.trim();
  }, [paySchedule, customPaySchedule]);

  // Formatted salary + pay schedule string for backward compatibility with all vacancy cards
  const formattedSalaryDisplay = useMemo(() => {
    const minStr = formatCurrency(salaryMin);
    const maxStr = formatCurrency(salaryMax);
    let basePart = '';

    if (minStr && maxStr) {
      basePart = `${minStr} – ${maxStr}`;
    } else if (minStr) {
      basePart = `${minStr}`;
    } else if (maxStr) {
      basePart = `Up to ${maxStr}`;
    }

    if (isSalaryNegotiable) {
      if (basePart && effectivePaySchedule) {
        return `${basePart} (Negotiable) • ${effectivePaySchedule}`;
      }
      if (basePart) {
        return `${basePart} (Negotiable)`;
      }
      if (effectivePaySchedule) {
        return `Negotiable • ${effectivePaySchedule}`;
      }
      return 'Negotiable';
    }

    if (basePart && effectivePaySchedule) {
      return `${basePart} • ${effectivePaySchedule}`;
    }
    if (basePart) {
      return basePart;
    }
    if (effectivePaySchedule) {
      return `Negotiable • ${effectivePaySchedule}`;
    }
    return 'Not specified yet';
  }, [isSalaryNegotiable, salaryMin, salaryMax, effectivePaySchedule]);

  // Formatted location label
  const formattedLocationLabel = useMemo(() => {
    if (workSetup === 'Remote') {
      return `Remote (Oriental Mindoro — ${municipality})`;
    }
    if (barangay.trim()) {
      return `${barangay.trim()}, ${municipality}, Oriental Mindoro`;
    }
    return `${municipality}, Oriental Mindoro`;
  }, [workSetup, barangay, municipality]);

  // Parsed responsibility lines
  const parsedResponsibilities = useMemo(() => {
    return responsibilitiesInput
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  }, [responsibilitiesInput]);

  // Switch between Form and Preview
  const handleSwitchView = (target: 'form' | 'preview') => {
    setViewMode(target);
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  };

  // Publish Job Vacancy -> Saves to AppContext / Database & Triggers Decision Tree Matching Engine
  const handlePublish = () => {
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    let hasErr = false;

    if (!cleanTitle) {
      setTitleError(true);
      hasErr = true;
    } else {
      setTitleError(false);
    }

    if (!category) {
      setCategoryError(true);
      hasErr = true;
    } else {
      setCategoryError(false);
    }

    // Validate Vacancies: must be a whole number >= 1
    const trimmedVacancies = vacanciesInput.trim();
    const parsedVacancies = Number(trimmedVacancies);
    const isValidVacancies =
      trimmedVacancies !== '' &&
      Number.isInteger(parsedVacancies) &&
      parsedVacancies >= 1;

    if (!isValidVacancies) {
      setVacanciesError(true);
      hasErr = true;
    } else {
      setVacanciesError(false);
    }

    // Validate Application Deadline: must be explicitly selected and >= today
    const isValidDeadline = Boolean(deadline) && deadline >= todayIsoDate;
    if (!isValidDeadline) {
      setDeadlineError(true);
      hasErr = true;
    } else {
      setDeadlineError(false);
    }

    // Validate Salary Offer: if not negotiable, require at least Min or Max salary > 0 (and max >= min if both set)
    const numMin = salaryMin.trim() !== '' ? Number(salaryMin) : null;
    const numMax = salaryMax.trim() !== '' ? Number(salaryMax) : null;
    const hasPositiveSalary =
      (numMin !== null && Number.isFinite(numMin) && numMin > 0) ||
      (numMax !== null && Number.isFinite(numMax) && numMax > 0);
    const hasValidRange =
      numMin !== null && numMax !== null && numMin > 0 && numMax > 0
        ? numMax >= numMin
        : true;

    if ((!isSalaryNegotiable && !hasPositiveSalary) || !hasValidRange) {
      setSalaryError(true);
      hasErr = true;
    } else {
      setSalaryError(false);
    }

    // Validate Pay Schedule: required unless Negotiable is toggled on without a schedule, or if "Other (Specify)" is empty
    const isCustomScheduleMissing =
      paySchedule === 'Other (Specify)' && !customPaySchedule.trim();
    const isScheduleMissing = (!isSalaryNegotiable && !paySchedule) || isCustomScheduleMissing;

    if (isScheduleMissing) {
      setPayScheduleError(true);
      hasErr = true;
    } else {
      setPayScheduleError(false);
    }

    if (!cleanDesc) {
      setDescError(true);
      hasErr = true;
    } else {
      setDescError(false);
    }

    if (acceptedEducationLevels.length === 0) {
      setEduError(true);
      hasErr = true;
    } else {
      setEduError(false);
    }

    if (hasErr) {
      if (viewMode !== 'form') setViewMode('form');
      setInlineBanner({
        message:
          'Please complete all required fields: Job Title, Job Category, Salary / Pay Schedule, Vacancies (whole number ≥ 1), Application Deadline, Job Description, and Accepted Educational Level.',
        type: 'error',
      });
      setTimeout(() => {
        if (!cleanTitle) titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (!category) categorySelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (!isValidVacancies || !isValidDeadline || (!isSalaryNegotiable && !hasPositiveSalary) || !hasValidRange || isScheduleMissing)
          compensationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (!cleanDesc) descInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else eduSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    const reqSkillsList = activeSkills.filter(s => s.required).map(s => s.name);
    const prefSkillsList = activeSkills.filter(s => !s.required).map(s => s.name);
    const structuredSkillsPayload: JobSkillItem[] = activeSkills.map(s => ({
      name: s.name,
      priority: s.required ? 'required' : 'preferred',
    }));

    const effectiveCourses: string[] = [];
    if (hasDegreeLevelSelected) {
      if (anyCourseAllowed || preferredCourses.length === 0) {
        effectiveCourses.push('Any Course / Open to All Graduates');
      } else {
        effectiveCourses.push(...preferredCourses);
      }
    }
    if (hasTesdaLevelSelected && preferredTesdaQualifications.length > 0) {
      effectiveCourses.push(...preferredTesdaQualifications);
    }

    const formattedEduString = acceptedEducationLevels.join(', ');
    const formattedCourseString =
      effectiveCourses.length > 0 ? effectiveCourses.join(', ') : 'Any Course / Open to All';
    const effectiveMinExp = openToFreshGraduates ? 0 : Math.max(0, Number(minExpYears) || 0);

    // Build structured requirements array for detail views & ATS engine
    const structuredRequirements: JobPostRequirement[] = [
      {
        id: `req-edu-${Date.now()}`,
        category: 'education',
        title: formattedEduString,
        importance:
          weights.education > 0 && !acceptedEducationLevels.includes('No Formal Requirement')
            ? 'required'
            : 'optional',
        value: formattedEduString,
      },
    ];

    if (effectiveCourses.length > 0) {
      structuredRequirements.push({
        id: `req-deg-${Date.now()}`,
        category: 'degree',
        title: effectiveCourses.join(' / '),
        importance: weights.education >= 25 && !anyCourseAllowed ? 'required' : 'preferred',
        value: effectiveCourses.join(', '),
      });
    }

    structuredRequirements.push({
      id: `req-exp-${Date.now()}`,
      category: 'experience',
      title: openToFreshGraduates
        ? `${careerLevel} • Open to Fresh Graduates (0 yrs)`
        : `${careerLevel} • ${effectiveMinExp}+ year(s) experience`,
      importance: openToFreshGraduates ? 'optional' : 'required',
      value: `${effectiveMinExp} years`,
    });

    selectedLicenses.forEach((lic, i) => {
      structuredRequirements.push({
        id: `req-lic-${Date.now()}-${i}`,
        category: 'certification',
        title: lic,
        importance: 'required',
        value: lic,
      });
    });

    const effectiveSubCategory = subCategory || INDUSTRY_CATEGORIES[category]?.subCategories?.[0] || 'General';

    const parsedMinSalary =
      salaryMin.trim() !== '' && Number.isFinite(Number(salaryMin)) && Number(salaryMin) > 0
        ? Number(salaryMin)
        : null;
    const parsedMaxSalary =
      salaryMax.trim() !== '' && Number.isFinite(Number(salaryMax)) && Number(salaryMax) > 0
        ? Number(salaryMax)
        : null;

    const createdJob = createJobPost({
      title: cleanTitle,
      employerId: currentEmployerProfile.id,
      companyName: currentEmployerProfile.companyName,
      companyLogo: currentEmployerProfile.logoUrl,
      companyMunicipality: currentEmployerProfile.municipality,
      category,
      subCategory: effectiveSubCategory,
      department: effectiveSubCategory,
      municipality,
      barangay: workSetup === 'Remote' ? undefined : barangay.trim() || undefined,
      workLocation: formattedLocationLabel,
      workSetup,
      workSchedule,
      employmentType,
      salaryRange: formattedSalaryDisplay,
      minSalary: parsedMinSalary,
      maxSalary: parsedMaxSalary,
      payFrequency: effectivePaySchedule || undefined,
      paySchedule: effectivePaySchedule,
      isSalaryNegotiable,
      salaryNegotiable: isSalaryNegotiable,
      isUrgent,
      description: cleanDesc,
      responsibilities:
        parsedResponsibilities.length > 0
          ? parsedResponsibilities
          : ['Perform core role responsibilities efficiently.'],
      minEducationalAttainment: formattedEduString,
      requiredEducationLevel: acceptedEducationLevels[0] || 'No Formal Requirement',
      acceptedEducationLevels: [...acceptedEducationLevels],
      preferredDegree: formattedCourseString,
      preferredCourses: hasDegreeLevelSelected ? [...preferredCourses] : [],
      preferredTesdaQualifications: hasTesdaLevelSelected ? [...preferredTesdaQualifications] : [],
      anyCourseAllowed,
      degreeImportance: weights.education >= 25 ? 'required' : 'preferred',
      careerLevel,
      experienceLevel: careerLevel,
      minExperienceYears: effectiveMinExp,
      openToFreshGraduates,
      experienceImportance: openToFreshGraduates ? 'optional' : 'required',
      requiredLicenses: [...selectedLicenses],
      requiredCertifications: [...selectedLicenses],
      requiredSkills: reqSkillsList,
      preferredSkills: prefSkillsList,
      skills: structuredSkillsPayload,
      evaluatedSkills: activeSkills,
      skillsRequired: [...reqSkillsList, ...prefSkillsList],
      technicalSkills: [...reqSkillsList, ...prefSkillsList],
      softSkills: [],
      matchWeights: { ...weights },
      benefits: selectedBenefits,
      vacanciesCount: parsedVacancies,
      vacancies: parsedVacancies,
      positionsAvailable: parsedVacancies,
      applicationDeadline: deadline,
      deadline,
      requirements: structuredRequirements,
    });

    if (!createdJob) {
      return;
    }

    showToast({
      type: 'success',
      title: 'Job Vacancy Published & Matching Engine Executed! 🎉',
      message: `"${cleanTitle}" is now live. The Decision Tree matching engine has evaluated and ranked eligible applicants.`,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  const totalWeights = weights.education + weights.skills + weights.experience + weights.eligibility;
  const reqSkillsForPreview = activeSkills.filter(s => s.required);
  const prefSkillsForPreview = activeSkills.filter(s => !s.required);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/75 backdrop-blur-[3px] font-sans antialiased text-slate-800">
      {/* Centered Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-job-modal-title"
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[94vh] overflow-hidden"
      >
        {/* MODAL HEADER (#111827) */}
        <header className="bg-[#111827] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1
                id="create-job-modal-title"
                className="text-white font-semibold text-sm sm:text-base tracking-tight truncate"
              >
                Post New Job Vacancy (Oriental Mindoro)
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                <Star className="w-3 h-3 fill-current" />
                <span>Smart Auto-Fill</span>
              </span>
            </div>
          </div>

          {/* Header Right: View Toggle + Close */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div
              className="inline-flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80"
              role="tablist"
              aria-label="Modal View Mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'form'}
                onClick={() => handleSwitchView('form')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'form'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Post Form
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'preview'}
                onClick={() => handleSwitchView('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Preview Listing
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* INLINE TOAST / NOTIFICATION BANNER */}
        {inlineBanner && (
          <div
            className={`px-4 sm:px-6 py-2.5 text-xs font-medium flex items-center justify-between gap-2 border-b animate-fade-slide ${
              inlineBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : inlineBanner.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {inlineBanner.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle
                  className={`w-4 h-4 shrink-0 ${
                    inlineBanner.type === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`}
                />
              )}
              <span>{inlineBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setInlineBanner(null)}
              className="opacity-70 hover:opacity-100 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCROLLABLE MODAL BODY */}
        <div ref={modalBodyRef} className="flex-1 overflow-y-auto custom-scroll bg-white">
          {viewMode === 'form' ? (
            /* ================= VIEW 1: POST FORM ================= */
            <form
              onSubmit={e => {
                e.preventDefault();
                handlePublish();
              }}
              className="p-4 sm:p-6 space-y-6"
              noValidate
            >
              {/* SECTION 1: SMART JOB TITLE COMBOBOX */}
              <section className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="jobTitleInput" className="block text-sm font-semibold text-slate-800">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  {autoFillNotice && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-slide">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{autoFillNotice}</span>
                    </span>
                  )}
                </div>

                {/* Combobox Wrapper */}
                <div className="relative" ref={titleComboboxRef}>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      ref={titleInputRef}
                      id="jobTitleInput"
                      type="text"
                      autoComplete="off"
                      value={title}
                      onFocus={() => setIsTitleDropdownOpen(true)}
                      onChange={e => {
                        setTitle(e.target.value);
                        if (e.target.value.trim()) setTitleError(false);
                        setIsTitleDropdownOpen(true);
                      }}
                      placeholder="Type or select a job title (e.g. Cashier, Web Developer, Registered Nurse)..."
                      className={`w-full pl-10 pr-16 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        titleError ? 'border-red-400' : 'border-slate-300'
                      }`}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      {title.length > 0 && (
                        <button
                          type="button"
                          title="Clear job title"
                          onClick={() => {
                            setTitle('');
                            setAutoFillNotice(null);
                            setIsTitleDropdownOpen(true);
                            titleInputRef.current?.focus();
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Toggle job title suggestions"
                        onClick={() => {
                          setIsTitleDropdownOpen(prev => !prev);
                          if (!isTitleDropdownOpen) titleInputRef.current?.focus();
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Live Filtered Suggestions Dropdown */}
                  {isTitleDropdownOpen && (
                    <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <span>Suggested Job Titles (Populates category, education suggestions &amp; skill pool)</span>
                        <span className="text-slate-400">
                          {filteredJobTitlePresets.length} role{filteredJobTitlePresets.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <ul className="max-h-60 overflow-y-auto custom-scroll divide-y divide-slate-100">
                        {filteredJobTitlePresets.map(item => {
                          const badge = INDUSTRY_CATEGORIES[item.category]?.short || item.category;
                          return (
                            <li key={item.title}>
                              <button
                                type="button"
                                onClick={() => handleApplyJobTitlePreset(item.title)}
                                className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/80 flex items-center justify-between gap-2 transition cursor-pointer"
                              >
                                <span className="text-sm font-medium text-slate-800">{item.title}</span>
                                <span className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                                  {badge}
                                </span>
                              </button>
                            </li>
                          );
                        })}

                        {title.trim().length > 0 && !hasExactPresetTitleMatch && (
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setIsTitleDropdownOpen(false);
                                setInlineBanner({
                                  message: `Using custom title "${title.trim()}". Select a Job Category below.`,
                                  type: 'info',
                                });
                              }}
                              className="w-full px-3.5 py-2.5 text-left bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                            >
                              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                +
                              </span>
                              <span>Use custom title: &quot;{title.trim()}&quot;</span>
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {titleError && (
                  <p className="text-xs text-red-600 font-medium">
                    Please enter or select a job title before publishing.
                  </p>
                )}
              </section>

              {/* SECTION 2: CASCADING JOB CLASSIFICATION & WORK TYPE CONTROLS */}
              <section className="space-y-4">
                {/* Row 1: Clean Blank Default State for Category & Sub-Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="jobCategory" className="block text-sm font-semibold text-slate-800">
                      Job Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      ref={categorySelectRef}
                      id="jobCategory"
                      value={category}
                      onChange={e => handleCategoryChange(e.target.value, '')}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        categoryError
                          ? 'border-red-400 text-slate-900'
                          : category
                          ? 'border-slate-300 text-slate-800'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      <option value="">Select a Job Category...</option>
                      {categoryKeys.map(cat => (
                        <option key={cat} value={cat} className="text-slate-800">
                          {cat}
                        </option>
                      ))}
                    </select>
                    {categoryError && (
                      <p className="text-xs text-red-600 font-medium">Please select a Job Category.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="jobSubCategory" className="block text-sm font-semibold text-slate-800">
                        Job Sub-Category
                      </label>
                      {!category && (
                        <span className="text-[11px] font-medium text-amber-600">
                          Select a Job Category first
                        </span>
                      )}
                    </div>
                    <select
                      id="jobSubCategory"
                      disabled={!category}
                      value={subCategory}
                      onChange={e => setSubCategory(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition ${
                        subCategory ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      <option value="">
                        {category ? 'Select a Sub-Category...' : 'Select a Job Category first'}
                      </option>
                      {category &&
                        (INDUSTRY_CATEGORIES[category]?.subCategories || []).map(sub => (
                          <option key={sub} value={sub} className="text-slate-800">
                            {sub}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Employment Type & Work Setup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="employmentType" className="block text-sm font-semibold text-slate-800">
                      Employment Type
                    </label>
                    <select
                      id="employmentType"
                      value={employmentType}
                      onChange={e => setEmploymentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contractual / Project-Based">Contractual / Project-Based</option>
                      <option value="Probationary">Probationary</option>
                      <option value="Seasonal / Temporary">Seasonal / Temporary</option>
                      <option value="Internship / OJT">Internship / OJT</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Work Setup</label>
                    <div
                      className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200"
                      role="radiogroup"
                      aria-label="Work Setup"
                    >
                      {(['On-site', 'Hybrid', 'Remote', 'Fieldwork'] as const).map(setup => {
                        const isActive = workSetup === setup;
                        return (
                          <button
                            key={setup}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => handleWorkSetupChange(setup)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isActive
                                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {setup}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Row 3: Municipality, Barangay/Branch, Work Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="municipality" className="block text-sm font-semibold text-slate-800">
                      Municipality Location
                    </label>
                    <select
                      id="municipality"
                      value={municipality}
                      onChange={e => setMunicipality(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                    >
                      {ORIENTAL_MINDORO_MUNICIPALITIES.map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="barangayInput" className="block text-sm font-semibold text-slate-800">
                        Barangay / Landmark
                      </label>
                      <span
                        className={`text-[11px] ${
                          workSetup === 'Remote' ? 'font-medium text-blue-600' : 'text-slate-400'
                        }`}
                      >
                        {workSetup === 'Remote' ? 'Disabled (Remote)' : 'Optional'}
                      </span>
                    </div>
                    <input
                      id="barangayInput"
                      type="text"
                      disabled={workSetup === 'Remote'}
                      value={barangay}
                      onChange={e => setBarangay(e.target.value)}
                      placeholder={
                        workSetup === 'Remote'
                          ? 'Not required for remote work'
                          : 'e.g. Brgy. Bagumbayan / Main'
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="workSchedule" className="block text-sm font-semibold text-slate-800">
                      Work Schedule / Shift
                    </label>
                    <select
                      id="workSchedule"
                      value={workSchedule}
                      onChange={e => setWorkSchedule(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                    >
                      <option value="Day Shift">Day Shift</option>
                      <option value="Mid Shift">Mid Shift</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="Shifting / Rotating">Shifting / Rotating</option>
                      <option value="Flexible">Flexible</option>
                      <option value="Weekends Included">Weekends Included</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* SECTION 3: STRUCTURED COMPENSATION, HEADCOUNT & URGENCY */}
              <section
                ref={compensationSectionRef}
                className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-800">
                      Salary Offer &amp; Pay Schedule{' '}
                      {!isSalaryNegotiable && <span className="text-red-500">*</span>}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {isSalaryNegotiable
                        ? 'Min and Max salary inputs are optional while Negotiable is active.'
                        : 'Enter a salary range and select the payout schedule.'}
                    </p>
                  </div>
                  {/* Negotiable / Competitive Toggle Switch */}
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-medium text-slate-600">Negotiable / Competitive</span>
                    <span className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={isSalaryNegotiable}
                        onChange={e => handleToggleNegotiable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                      ₱
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={salaryMin}
                      onChange={e => {
                        setSalaryMin(e.target.value);
                        if (e.target.value.trim()) setSalaryError(false);
                      }}
                      placeholder={isSalaryNegotiable ? 'Min (Optional)' : 'e.g. 15000'}
                      className={`w-full pl-8 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        salaryError ? 'border-red-400' : 'border-slate-300'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                      Min
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                      ₱
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={salaryMax}
                      onChange={e => {
                        setSalaryMax(e.target.value);
                        if (e.target.value.trim()) setSalaryError(false);
                      }}
                      placeholder={isSalaryNegotiable ? 'Max (Optional)' : 'e.g. 20000'}
                      className={`w-full pl-8 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        salaryError ? 'border-red-400' : 'border-slate-300'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                      Max
                    </span>
                  </div>

                  <select
                    aria-label="Pay Schedule / Frequency"
                    value={paySchedule}
                    onChange={e => {
                      setPaySchedule(e.target.value);
                      if (e.target.value) setPayScheduleError(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                      payScheduleError
                        ? 'border-red-400 text-slate-900'
                        : paySchedule
                        ? 'border-slate-300 text-slate-800'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    <option value="">Select pay schedule...</option>
                    {PAY_SCHEDULE_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="text-slate-800">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Custom Pay Schedule Input when "Other (Specify)" is selected */}
                {paySchedule === 'Other (Specify)' && (
                  <div className="space-y-1 animate-fade-slide">
                    <label htmlFor="customPayScheduleInput" className="block text-xs font-semibold text-slate-700">
                      Specify Custom Pay Schedule <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customPayScheduleInput"
                      type="text"
                      value={customPaySchedule}
                      onChange={e => {
                        setCustomPaySchedule(e.target.value);
                        if (e.target.value.trim()) setPayScheduleError(false);
                      }}
                      placeholder="e.g. Every 5th & 20th, Every Saturday, Upon Milestone Completion..."
                      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        payScheduleError ? 'border-red-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                )}

                {(salaryError || payScheduleError) && (
                  <p className="text-xs text-red-600 font-medium">
                    {salaryError &&
                      'Please enter a valid salary amount (Max must be ≥ Min) or enable Negotiable / Competitive. '}
                    {payScheduleError &&
                      (paySchedule === 'Other (Specify)'
                        ? 'Please specify your custom pay schedule.'
                        : 'Please select a Pay Schedule / Frequency.')}
                  </p>
                )}

                {/* Vacancies, Deadline, Urgent Hiring */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <label htmlFor="vacanciesCount" className="block text-xs font-semibold text-slate-700">
                      Vacancies <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="vacanciesCount"
                      type="number"
                      min="1"
                      max="500"
                      step="1"
                      value={vacanciesInput}
                      onChange={e => {
                        setVacanciesInput(e.target.value);
                        if (e.target.value.trim()) setVacanciesError(false);
                      }}
                      placeholder="e.g. 2"
                      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        vacanciesError ? 'border-red-400' : 'border-slate-300'
                      }`}
                    />
                    {vacanciesError && (
                      <p className="text-[11px] text-red-600 font-medium">
                        Enter a whole number of at least 1.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="deadlineDate" className="block text-xs font-semibold text-slate-700">
                      Application Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="deadlineDate"
                      type="date"
                      min={todayIsoDate}
                      value={deadline}
                      onChange={e => {
                        setDeadline(e.target.value);
                        if (e.target.value) setDeadlineError(false);
                      }}
                      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition ${
                        deadlineError
                          ? 'border-red-400 text-slate-900'
                          : deadline
                          ? 'border-slate-300 text-slate-800'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    />
                    {deadlineError && (
                      <p className="text-[11px] text-red-600 font-medium">
                        Please select a valid deadline (today or later).
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <span className="block text-xs font-semibold text-slate-700">Hiring Priority</span>
                    <button
                      type="button"
                      aria-pressed={isUrgent}
                      onClick={() => setIsUrgent(prev => !prev)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isUrgent
                          ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 font-bold shadow-xs'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Urgent Hiring: {isUrgent ? 'ON' : 'Off'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* SECTION 4: ROLE OVERVIEW WITH SMART STARTER TEMPLATES */}
              <section className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="jobDescription" className="block text-sm font-semibold text-slate-800">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={descInputRef}
                    id="jobDescription"
                    rows={3}
                    value={description}
                    onChange={e => {
                      setDescription(e.target.value);
                      if (e.target.value.trim()) setDescError(false);
                    }}
                    placeholder="Describe role objectives, daily collaboration, and workplace environment..."
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition resize-y ${
                      descError ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                  {descError && (
                    <p className="text-xs text-red-600 font-medium">Please provide a short job description.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="responsibilitiesInput" className="block text-sm font-semibold text-slate-800">
                      Responsibilities <span className="font-normal text-slate-500">(One per line)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleInsertSuggestedResponsibilities}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                    >
                      <span>✨</span>
                      <span>Insert Suggested Responsibilities</span>
                    </button>
                  </div>
                  <textarea
                    id="responsibilitiesInput"
                    rows={4}
                    value={responsibilitiesInput}
                    onChange={e => setResponsibilitiesInput(e.target.value)}
                    placeholder={`Design and develop scalable applications\nCollaborate with local Mindoro clients...`}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition resize-y"
                  />
                </div>
              </section>

              {/* SECTION 5: AI DECISION TREE QUALIFICATION LOGIC PARAMETERS (WARM PEACH CONTAINER) */}
              <section
                ref={eduSectionRef}
                className="rounded-2xl bg-[#FFF4EA] border border-[#D8E4F5] p-4 sm:p-5 space-y-5 shadow-sm"
              >
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#EA580C] shrink-0" />
                    <h2 className="text-sm sm:text-base font-bold text-[#1E40AF]">
                      AI Decision Tree Qualification Logic Parameters
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Used for Candidate Ranking
                  </span>
                </div>

                {/* 5A. ACCEPTED EDUCATIONAL LEVELS (MULTI-SELECT CHIPS) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Accepted Educational Levels <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Select one or more education tiers accepted for this vacancy
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {EDUCATION_LEVEL_OPTIONS.map(level => {
                      const isSelected = acceptedEducationLevels.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleToggleEducationLevel(level)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                              : eduError
                              ? 'bg-white text-slate-700 border-red-300 hover:border-orange-400'
                              : 'bg-white text-slate-700 border-amber-200 hover:border-orange-400 hover:bg-orange-50/50'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{level}</span>
                        </button>
                      );
                    })}
                  </div>

                  {eduError && (
                    <p className="text-xs text-red-600 font-medium">
                      Please select at least one Accepted Educational Level (or &quot;No Formal Requirement&quot;).
                    </p>
                  )}
                </div>

                {/* 5B. ACCEPTED / PREFERRED COURSES & SPECIALIZATIONS (MULTI-SELECT COMBOBOX) */}
                {hasDegreeLevelSelected && (
                  <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200/90 space-y-3 animate-fade-slide">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label htmlFor="courseSearchInput" className="block text-xs font-bold text-slate-800">
                          Accepted / Preferred Courses &amp; Degree Specializations
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Select multiple courses accepted for this vacancy (e.g. BSCS, BSIT, BSCpE or BSHM, BSTM, BSA).
                        </p>
                      </div>

                      {/* Any Course / Open to All Graduates Toggle */}
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200">
                        <input
                          type="checkbox"
                          checked={anyCourseAllowed}
                          onChange={e => {
                            setAnyCourseAllowed(e.target.checked);
                            if (e.target.checked) setPreferredCourses([]);
                          }}
                          className="w-3.5 h-3.5 rounded border-amber-300 text-orange-600 focus:ring-orange-500 accent-[#EA580C]"
                        />
                        <span className="text-[11px] font-semibold text-amber-900">
                          Any Course / Open to All Graduates
                        </span>
                      </label>
                    </div>

                    {!anyCourseAllowed && (
                      <>
                        {/* Multi-Select Course Search Combobox */}
                        <div className="relative" ref={courseComboboxRef}>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                id="courseSearchInput"
                                type="text"
                                autoComplete="off"
                                value={courseSearchInput}
                                onFocus={() => setIsCourseDropdownOpen(true)}
                                onChange={e => {
                                  setCourseSearchInput(e.target.value);
                                  setIsCourseDropdownOpen(true);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddPreferredCourse(courseSearchInput);
                                  }
                                }}
                                placeholder="Search or type courses (e.g. BS Computer Science, BS Hospitality Management)..."
                                className="w-full pl-3.5 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition"
                              />
                              <button
                                type="button"
                                aria-label="Toggle course suggestions"
                                onClick={() => setIsCourseDropdownOpen(prev => !prev)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddPreferredCourse(courseSearchInput)}
                              className="px-3.5 py-2 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                            >
                              + Add Course
                            </button>
                          </div>

                          {isCourseDropdownOpen && (
                            <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto custom-scroll bg-white rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-100 text-xs sm:text-sm">
                              {filteredCourseOptions.map(opt => (
                                <li key={opt}>
                                  <button
                                    type="button"
                                    onClick={() => handleAddPreferredCourse(opt)}
                                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition flex items-center justify-between cursor-pointer"
                                  >
                                    <span>{opt}</span>
                                    <span className="text-[10px] font-semibold text-blue-600">+ Select</span>
                                  </button>
                                </li>
                              ))}
                              {courseSearchInput.trim() &&
                                !filteredCourseOptions.some(
                                  o => o.toLowerCase() === courseSearchInput.trim().toLowerCase()
                                ) && (
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => handleAddPreferredCourse(courseSearchInput)}
                                      className="w-full px-3.5 py-2 text-left font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100/70 transition cursor-pointer"
                                    >
                                      + Add custom course: &quot;{courseSearchInput.trim()}&quot;
                                    </button>
                                  </li>
                                )}
                            </ul>
                          )}
                        </div>

                        {/* Selected Courses Chips */}
                        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                          {preferredCourses.length === 0 ? (
                            <span className="text-xs italic text-slate-400">
                              No specific courses selected yet (leave empty or toggle &quot;Any Course&quot; to accept all degrees).
                            </span>
                          ) : (
                            preferredCourses.map(course => (
                              <span
                                key={course}
                                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold"
                              >
                                <span>{course}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${course}`}
                                  onClick={() => handleRemovePreferredCourse(course)}
                                  className="p-0.5 text-blue-500 hover:text-blue-900 rounded-full hover:bg-blue-100 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Category-Relevant Course Quick Suggestions */}
                        {categorySuggestedCourses.length > 0 && (
                          <div className="pt-1">
                            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                              Suggested Courses for {INDUSTRY_CATEGORIES[category]?.short || category}:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {categorySuggestedCourses.map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleAddPreferredCourse(c)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50/70 text-slate-700 border border-dashed border-amber-300 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                                >
                                  <span>+</span>
                                  <span>{c}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 5C. MULTI-SELECT TESDA / VOCATIONAL QUALIFICATIONS (Shown when Vocational / TESDA is selected) */}
                {hasTesdaLevelSelected && (
                  <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200/90 space-y-2.5 animate-fade-slide">
                    <div>
                      <label htmlFor="tesdaSearchInput" className="block text-xs font-bold text-slate-800">
                        Accepted TESDA / Vocational Qualifications (NC Level)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Select one or more TESDA National Certificates relevant to this role (optional).
                      </p>
                    </div>

                    <div className="relative" ref={tesdaComboboxRef}>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            id="tesdaSearchInput"
                            type="text"
                            autoComplete="off"
                            value={tesdaSearchInput}
                            onFocus={() => setIsTesdaDropdownOpen(true)}
                            onChange={e => {
                              setTesdaSearchInput(e.target.value);
                              setIsTesdaDropdownOpen(true);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTesdaQualification(tesdaSearchInput);
                              }
                            }}
                            placeholder="Search or type TESDA NC II / III qualification..."
                            className="w-full pl-3.5 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition"
                          />
                          <button
                            type="button"
                            aria-label="Toggle TESDA options"
                            onClick={() => setIsTesdaDropdownOpen(prev => !prev)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTesdaQualification(tesdaSearchInput)}
                          className="px-3.5 py-2 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                        >
                          + Add NC
                        </button>
                      </div>

                      {isTesdaDropdownOpen && (
                        <ul className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto custom-scroll bg-white rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-100 text-xs sm:text-sm">
                          {filteredTesdaOptions.map(opt => (
                            <li key={opt}>
                              <button
                                type="button"
                                onClick={() => handleAddTesdaQualification(opt)}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition flex items-center justify-between cursor-pointer"
                              >
                                <span>{opt}</span>
                                <span className="text-[10px] font-semibold text-orange-600">+ Select</span>
                              </button>
                            </li>
                          ))}
                          {tesdaSearchInput.trim() &&
                            !filteredTesdaOptions.some(
                              o => o.toLowerCase() === tesdaSearchInput.trim().toLowerCase()
                            ) && (
                              <li>
                                <button
                                  type="button"
                                  onClick={() => handleAddTesdaQualification(tesdaSearchInput)}
                                  className="w-full px-3.5 py-2 text-left font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100/70 transition cursor-pointer"
                                >
                                  + Add custom TESDA qualification: &quot;{tesdaSearchInput.trim()}&quot;
                                </button>
                              </li>
                            )}
                        </ul>
                      )}
                    </div>

                    {/* Selected TESDA Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {preferredTesdaQualifications.map(tesda => (
                        <span
                          key={tesda}
                          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold"
                        >
                          <span>{tesda}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${tesda}`}
                            onClick={() => handleRemoveTesdaQualification(tesda)}
                            className="p-0.5 text-amber-700 hover:text-amber-950 rounded-full hover:bg-amber-200 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Career Level, Min Experience, Open to Fresh Graduates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label htmlFor="careerLevel" className="block text-xs font-bold text-slate-800">
                      Career Level
                    </label>
                    <select
                      id="careerLevel"
                      value={careerLevel}
                      onChange={e => setCareerLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition"
                    >
                      <option value="Entry-Level">Entry-Level</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid-Level">Mid-Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Supervisory">Supervisory</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="minExpYears" className="block text-xs font-bold text-slate-800">
                      Min. Experience Years
                    </label>
                    <input
                      id="minExpYears"
                      type="number"
                      min="0"
                      max="30"
                      disabled={openToFreshGraduates}
                      value={openToFreshGraduates ? 0 : minExpYears}
                      onChange={e => setMinExpYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 disabled:bg-amber-50/60 disabled:text-slate-500 transition"
                    />
                  </div>

                  <div className="pb-0.5">
                    <label className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-amber-200/90 cursor-pointer select-none">
                      <span className="text-xs font-semibold text-slate-700">Open to Fresh Grads</span>
                      <span className="relative inline-flex items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={openToFreshGraduates}
                          onChange={e => handleFreshGradToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-400/40 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EA580C]"></div>
                      </span>
                    </label>
                  </div>
                </div>

                {/* 5E. REQUIRED LICENSES & ELIGIBILITY (Unchecked / Empty by Default, Strictly Opt-In) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Required Licenses / Eligibility{' '}
                      <span className="font-normal text-slate-500">(Optional — leave unchecked if none required)</span>
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {selectedLicenses.length === 0
                        ? 'No License Required (Open)'
                        : `${selectedLicenses.length} required`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LICENSE_OPTIONS.map(lic => {
                      const active = selectedLicenses.includes(lic);
                      return (
                        <button
                          key={lic}
                          type="button"
                          onClick={() => handleToggleLicense(lic)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-xs'
                              : 'bg-white text-slate-700 border-amber-200 hover:border-blue-400 hover:bg-blue-50/50'
                          }`}
                        >
                          {active ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          )}
                          <span>{lic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5F. KEY RELEVANT SKILLS (Empty by Default + Category-Aware Suggestions Only) */}
                <div className="space-y-2.5 pt-2 border-t border-amber-200/70">
                  <div>
                    <label htmlFor="skillSearchInput" className="block text-xs font-bold text-slate-800">
                      Key Relevant Skills{' '}
                      <span className="font-medium text-slate-600">(Preferred &amp; Evaluated)</span>
                    </label>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Click any selected skill below to toggle between{' '}
                      <strong className="text-orange-700">Must-Have (Required)</strong> and{' '}
                      <strong className="text-blue-700">Preferred</strong>.
                    </p>
                  </div>

                  {/* Search / Add Skill Input */}
                  <div className="relative" ref={skillComboboxRef}>
                    <div className="flex gap-2">
                      <input
                        id="skillSearchInput"
                        type="text"
                        autoComplete="off"
                        value={skillSearchInput}
                        onFocus={() => {
                          if (skillSearchInput.trim()) setIsSkillDropdownOpen(true);
                        }}
                        onChange={e => {
                          setSkillSearchInput(e.target.value);
                          setIsSkillDropdownOpen(Boolean(e.target.value.trim()));
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill(skillSearchInput, false);
                          }
                        }}
                        placeholder="Type a skill manually and press Enter (e.g. React, Cash Handling, SQL)..."
                        className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-amber-200/90 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkill(skillSearchInput, false)}
                        className="px-3.5 py-2 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                      >
                        + Add Skill
                      </button>
                    </div>

                    {isSkillDropdownOpen && skillSearchInput.trim() && (
                      <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto custom-scroll bg-white rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-100 text-sm">
                        {filteredSkillSearchMatches.map(s => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => handleAddSkill(s, false)}
                              className="w-full px-3.5 py-2 text-left text-xs sm:text-sm text-slate-700 hover:bg-orange-50 transition cursor-pointer"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                        {!filteredSkillSearchMatches.some(
                          s => s.toLowerCase() === skillSearchInput.trim().toLowerCase()
                        ) && (
                          <li>
                            <button
                              type="button"
                              onClick={() => handleAddSkill(skillSearchInput, false)}
                              className="w-full px-3.5 py-2 text-left text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100/70 transition cursor-pointer"
                            >
                              + Add custom skill: &quot;{skillSearchInput.trim()}&quot;
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Active Selected Skill Chips (Starts Empty []) */}
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Selected Skills ({activeSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-xl bg-white/80 border border-amber-200/80">
                      {activeSkills.length === 0 ? (
                        <span className="text-xs italic text-slate-400 py-0.5">
                          No skills selected yet — click a suggested skill chip below or type a custom skill above.
                        </span>
                      ) : (
                        activeSkills.map((skill, idx) =>
                          skill.required ? (
                            <div
                              key={skill.name}
                              className="inline-flex items-center rounded-full bg-[#EA580C] text-white text-xs font-semibold shadow-xs overflow-hidden border border-orange-600"
                            >
                              <button
                                type="button"
                                title="Click to switch to Preferred"
                                onClick={() => handleToggleSkillPriority(idx)}
                                className="pl-2.5 pr-1.5 py-1 flex items-center gap-1.5 hover:bg-orange-700 transition cursor-pointer"
                              >
                                <Star className="w-3 h-3 text-amber-200 fill-current" />
                                <span>{skill.name}</span>
                                <span className="text-[9px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-full">
                                  Must-Have
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={`Remove ${skill.name}`}
                                onClick={() => handleRemoveSkill(idx)}
                                className="pr-2 pl-1 py-1 hover:bg-orange-800/80 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              key={skill.name}
                              className="inline-flex items-center rounded-full bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200 overflow-hidden"
                            >
                              <button
                                type="button"
                                title="Click to mark as Must-Have (Required)"
                                onClick={() => handleToggleSkillPriority(idx)}
                                className="pl-2.5 pr-1.5 py-1 flex items-center gap-1.5 hover:bg-blue-100 transition cursor-pointer"
                              >
                                <span>{skill.name}</span>
                                <span className="text-[9px] uppercase tracking-wider bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded-full">
                                  Preferred
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={`Remove ${skill.name}`}
                                onClick={() => handleRemoveSkill(idx)}
                                className="pr-2 pl-1 py-1 text-blue-500 hover:text-blue-900 hover:bg-blue-100 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  {/* Dynamic Category-Aware Suggested Skills Pool */}
                  <div className="pt-1">
                    <span className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      {category
                        ? `Suggested Skills for ${INDUSTRY_CATEGORIES[category]?.short || category}:`
                        : 'Suggested Skills:'}
                    </span>
                    {!category ? (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-dashed border-amber-300 text-xs text-slate-500 italic">
                        Choose a Job Category to see suggested skills, or type a skill manually.
                      </div>
                    ) : remainingSuggestedSkills.length === 0 ? (
                      <span className="text-[11px] text-slate-400">
                        All suggested skills for this category have been added to Selected Skills.
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {remainingSuggestedSkills.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleAddSkill(skill, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-slate-700 border border-dashed border-amber-300 hover:border-orange-500 hover:text-orange-700 hover:bg-orange-50 transition cursor-pointer"
                          >
                            <span>+</span>
                            <span>{skill}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Engine Weight Distribution (100% Total) */}
                <div className="space-y-3.5 pt-3 border-t border-amber-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Match Engine Weight Distribution</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {totalWeights}% Total
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Sliders automatically stay balanced at 100%.</p>
                    </div>

                    {/* 3 Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { key: 'degree', label: 'Corporate / Degree-Focused' },
                          { key: 'skills', label: 'Skills-First' },
                          { key: 'trades', label: 'Entry-Level / Trades' },
                        ] as const
                      ).map(preset => {
                        const isMatch = matchedWeightPreset === preset.key;
                        return (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => setWeights({ ...WEIGHT_PRESETS[preset.key] })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                              isMatch
                                ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                                : 'bg-white text-slate-700 border-amber-200 hover:border-orange-400 hover:text-orange-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stacked Color Bar Visualization */}
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200/80 shadow-inner">
                    <div
                      className="bg-[#EA580C] transition-all duration-150"
                      style={{ width: `${weights.education}%` }}
                      title="Education / Degree"
                    />
                    <div
                      className="bg-[#2563EB] transition-all duration-150"
                      style={{ width: `${weights.skills}%` }}
                      title="Key Skills"
                    />
                    <div
                      className="bg-[#0D9488] transition-all duration-150"
                      style={{ width: `${weights.experience}%` }}
                      title="Work Experience"
                    />
                    <div
                      className="bg-[#7C3AED] transition-all duration-150"
                      style={{ width: `${weights.eligibility}%` }}
                      title="Location & Eligibility"
                    />
                  </div>

                  {/* Four Linked Orange Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-white/85 rounded-xl p-3.5 border border-amber-200/70">
                    {/* Slider 1: Education */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                          <span>Education / Courses</span>
                        </span>
                        <span className="font-bold text-[#EA580C] tabular-nums">{weights.education}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.education}
                        onChange={e => handleWeightSliderChange('education', e.target.value)}
                        className="dt-slider"
                      />
                    </div>

                    {/* Slider 2: Key Skills */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                          <span>Key Skills</span>
                        </span>
                        <span className="font-bold text-[#2563EB] tabular-nums">{weights.skills}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.skills}
                        onChange={e => handleWeightSliderChange('skills', e.target.value)}
                        className="dt-slider"
                      />
                    </div>

                    {/* Slider 3: Work Experience */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                          <span>Work Experience</span>
                        </span>
                        <span className="font-bold text-[#0D9488] tabular-nums">{weights.experience}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.experience}
                        onChange={e => handleWeightSliderChange('experience', e.target.value)}
                        className="dt-slider"
                      />
                    </div>

                    {/* Slider 4: Location & Eligibility */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                          <span>Licenses &amp; Location</span>
                        </span>
                        <span className="font-bold text-[#7C3AED] tabular-nums">{weights.eligibility}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.eligibility}
                        onChange={e => handleWeightSliderChange('eligibility', e.target.value)}
                        className="dt-slider"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 6: BENEFITS & PERKS MULTI-SELECT CHECKBOXES + CUSTOM PERK ENTRY */}
              <section className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-800">
                      Benefits &amp; Perks{' '}
                      <span className="font-normal text-xs text-slate-500">(Optional)</span>
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {selectedBenefits.length === 0
                      ? 'None selected'
                      : `${selectedBenefits.length} benefit${selectedBenefits.length === 1 ? '' : 's'} selected`}
                  </span>
                </div>

                {/* Preset Benefit Checkboxes (All Unchecked by Default) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BENEFIT_OPTIONS.map(benefit => {
                    const checked = selectedBenefits.some(
                      b => b.toLowerCase() === benefit.toLowerCase()
                    );
                    return (
                      <label
                        key={benefit}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer select-none transition ${
                          checked
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleBenefit(benefit)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                        <span>{benefit}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Inline "Add Other Benefit / Perk" Input + Add Button */}
                <div className="pt-1 space-y-2">
                  <label htmlFor="customBenefitInput" className="block text-xs font-semibold text-slate-700">
                    Add Other Benefit / Perk
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="customBenefitInput"
                      type="text"
                      value={customBenefitInput}
                      onChange={e => setCustomBenefitInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomBenefit();
                        }
                      }}
                      placeholder="e.g. Free Rice Subsidy, Staff Lodging, Performance Bonus, Free Uniform..."
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomBenefit}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Custom-Added Perks Removable Chips */}
                  {selectedBenefits.filter(
                    b => !BENEFIT_OPTIONS.some(preset => preset.toLowerCase() === b.toLowerCase())
                  ).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">Custom Perks:</span>
                      {selectedBenefits
                        .filter(
                          b => !BENEFIT_OPTIONS.some(preset => preset.toLowerCase() === b.toLowerCase())
                        )
                        .map(customPerk => (
                          <span
                            key={customPerk}
                            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold"
                          >
                            <span>✓ {customPerk}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${customPerk}`}
                              onClick={() => handleRemoveCustomBenefit(customPerk)}
                              className="p-0.5 text-emerald-600 hover:text-emerald-950 rounded-full hover:bg-emerald-200/70 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            </form>
          ) : (
            /* ================= VIEW 2: LIVE PREVIEW LISTING ================= */
            <div className="p-4 sm:p-6 bg-slate-50/70 min-h-full">
              <div className="max-w-2xl mx-auto space-y-5 animate-fade-slide">
                {/* Preview Mode Indicator */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-medium">
                    Applicant-Facing Preview • {currentEmployerProfile.companyName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    Live Sync
                  </span>
                </div>

                {/* Main Applicant Job Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Top Header Banner */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                            {category ? INDUSTRY_CATEGORIES[category]?.short || category : 'Uncategorized'}
                          </span>
                          {subCategory && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs font-medium text-slate-500">{subCategory}</span>
                            </>
                          )}
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                              ⚡ URGENT HIRING
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                          {title.trim() || 'Untitled Job Vacancy'}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{currentEmployerProfile.companyName} • Verified Oriental Mindoro Employer</span>
                        </p>
                      </div>

                      {/* Salary Pill */}
                      <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Offered Salary
                        </div>
                        <div className="text-sm sm:text-base font-bold text-emerald-900">
                          {formattedSalaryDisplay}
                        </div>
                      </div>
                    </div>

                    {/* Key Metadata Chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        📍 {formattedLocationLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        💼 {employmentType}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                        🏢 {workSetup}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        🕒 {workSchedule}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        👥{' '}
                        {vacanciesInput.trim() && Number(vacanciesInput) >= 1
                          ? `${Number(vacanciesInput)} Vacanc${Number(vacanciesInput) === 1 ? 'y' : 'ies'}`
                          : 'Vacancies not set yet'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                        📅 {deadline ? `Apply by ${formatDateReadable(deadline)}` : 'Deadline not set yet'}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900">About the Role</h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {description.trim() || 'No job description entered yet.'}
                      </p>
                    </div>

                    {/* Responsibilities */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900">Key Responsibilities</h3>
                      {parsedResponsibilities.length > 0 ? (
                        <ul className="space-y-1.5 text-sm text-slate-600 list-disc pl-5">
                          {parsedResponsibilities.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-slate-400">
                          No specific responsibilities listed yet.
                        </p>
                      )}
                    </div>

                    {/* Qualifications Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                      <div className="space-y-1.5">
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">
                          Accepted Educational Levels
                        </span>
                        {acceptedEducationLevels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {acceptedEducationLevels.map(lvl => (
                              <span
                                key={lvl}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-semibold text-[11px]"
                              >
                                {lvl}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Not selected yet</p>
                        )}

                        {hasDegreeLevelSelected && (
                          <div className="pt-1">
                            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                              Accepted Courses / Degrees
                            </span>
                            {anyCourseAllowed || preferredCourses.length === 0 ? (
                              <p className="text-slate-700 font-medium mt-0.5">
                                Any Course / Open to All Graduates
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {preferredCourses.map(c => (
                                  <span
                                    key={c}
                                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {hasTesdaLevelSelected && preferredTesdaQualifications.length > 0 && (
                          <div className="pt-1">
                            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                              TESDA / Vocational Certificates
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {preferredTesdaQualifications.map(t => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">
                            Experience &amp; Career Level
                          </span>
                          <p className="text-slate-800 font-semibold mt-0.5">
                            {careerLevel} •{' '}
                            {openToFreshGraduates
                              ? 'Open to Fresh Graduates (0 yrs)'
                              : `${minExpYears}+ year${minExpYears === 1 ? '' : 's'} experience`}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">
                            Required Licenses / Eligibility
                          </span>
                          {selectedLicenses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedLicenses.map(l => (
                                <span
                                  key={l}
                                  className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[11px]"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-emerald-700 font-semibold mt-0.5">None required</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills Required vs Preferred */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">Evaluated Skills</h3>
                      <div className="space-y-2">
                        {reqSkillsForPreview.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-orange-700 mr-1">Must-Have:</span>
                            {reqSkillsForPreview.map(s => (
                              <span
                                key={s.name}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EA580C] text-white"
                              >
                                ★ {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {prefSkillsForPreview.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-blue-700 mr-1">Preferred:</span>
                            {prefSkillsForPreview.map(s => (
                              <span
                                key={s.name}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {activeSkills.length === 0 && (
                          <p className="text-xs italic text-slate-400">No specific skill tags added.</p>
                        )}
                      </div>
                    </div>

                    {/* Benefits & Perks */}
                    {selectedBenefits.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-900">Benefits &amp; Perks</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedBenefits.map(b => (
                            <span
                              key={b}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                            >
                              ✓ {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compact Decision Tree Weight Summary */}
                    <div className="rounded-xl bg-[#FFF4EA] border border-[#D8E4F5] p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E40AF]">
                          ✨ AI Decision Tree Ranking Weights
                        </span>
                        <span className="text-[11px] font-semibold text-amber-800">
                          {totalWeights}% Match Score Basis
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
                        <div className="bg-[#EA580C]" style={{ width: `${weights.education}%` }} />
                        <div className="bg-[#2563EB]" style={{ width: `${weights.skills}%` }} />
                        <div className="bg-[#0D9488]" style={{ width: `${weights.experience}%` }} />
                        <div className="bg-[#7C3AED]" style={{ width: `${weights.eligibility}%` }} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold pt-0.5">
                        <span className="text-[#EA580C]">Education: {weights.education}%</span>
                        <span className="text-[#2563EB]">Skills: {weights.skills}%</span>
                        <span className="text-[#0D9488]">Experience: {weights.experience}%</span>
                        <span className="text-[#7C3AED]">Eligibility: {weights.eligibility}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STICKY MODAL FOOTER */}
        <footer className="bg-slate-50 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => handleSwitchView(viewMode === 'preview' ? 'form' : 'preview')}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>{viewMode === 'preview' ? 'Back to Form' : 'Preview Vacancy'}</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Publish Job Vacancy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
