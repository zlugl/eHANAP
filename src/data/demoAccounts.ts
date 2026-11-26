import { UserRole } from '../types';

export interface DemoAccountMeta {
  id: string;
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  password: string;
  roleLabel: string;
  badge: string;
  badgeColor: 'amber' | 'blue' | 'emerald' | 'indigo' | 'purple';
  subtitle: string;
  description: string;
  avatar: string;
  industryCategory?: string;
  companyName?: string;
  sampleVacancies?: string[];
  highlights: string[];
  flowSteps: string[];
}

// Clean slate: no hardcoded demo accounts
export const DEMO_ACCOUNTS: DemoAccountMeta[] = [];

export const PRIMARY_DEMO_ACCOUNTS: Record<string, DemoAccountMeta | undefined> = {
  admin: undefined,
  employer: undefined,
  seeker: undefined
};

export function getDemoAccountByEmail(_email: string): DemoAccountMeta | undefined {
  return undefined;
}

export function getDemoAccountsByRole(_role: UserRole): DemoAccountMeta[] {
  return [];
}
