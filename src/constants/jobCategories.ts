/**
 * eHANAP — Job Category & Industry Domain Constants
 * Municipality of Roxas, Oriental Mindoro | PESO
 */

export const JOB_CATEGORIES = [
  "Information Technology & Software",
  "Business, Accounting & Finance",
  "Agriculture & Agribusiness",
  "Tourism, Hotel & Restaurant",
  "Engineering & Construction",
  "Healthcare, Nursing & Medical",
  "Education & Academic Services",
  "Customer Service & Retail",
  "Government & Public Administration",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
