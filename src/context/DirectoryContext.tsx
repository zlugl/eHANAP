import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EmployerProfile,
  EmployerStatus,
  JobSeekerProfile,
  AuditLog,
  SystemAnnouncement,
} from '../types';
import {
  INITIAL_EMPLOYERS,
  INITIAL_JOB_SEEKERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ANNOUNCEMENTS,
} from '../data/mockData';
import {
  SUPABASE_TABLES,
  COLLECTIONS,
  subscribeToSupabaseTable,
  ensureDemoAccountsExistInSupabase,
  testSupabaseConnection,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { storageAdapter } from '../lib/storageAdapter';
import {
  isSeekerProfileComplete,
  isEmployerProfileComplete,
  markProfileCompletedInStorage,
} from '../utils/routeGuards';
import { useAuth } from './AuthContext';
import { saveDocument } from './persistence';

const toUpperSafe = (val?: string): string | undefined => (typeof val === 'string' ? val.toUpperCase() : val);

export const normalizeEmployerProfileToUpperCase = (data: Partial<EmployerProfile>): Partial<EmployerProfile> => {
  const next: Partial<EmployerProfile> = { ...data };
  if (next.companyName !== undefined) next.companyName = toUpperSafe(next.companyName)!;
  if (next.representativeName !== undefined) next.representativeName = toUpperSafe(next.representativeName)!;
  if (next.address !== undefined) next.address = toUpperSafe(next.address)!;
  if (next.barangay !== undefined) next.barangay = toUpperSafe(next.barangay);
  if (next.companyDescription !== undefined) next.companyDescription = toUpperSafe(next.companyDescription)!;
  if (next.description !== undefined) next.description = toUpperSafe(next.description);
  if (next.businessPermitNo !== undefined) next.businessPermitNo = toUpperSafe(next.businessPermitNo)!;
  if (next.dtiSecRegistration !== undefined) next.dtiSecRegistration = toUpperSafe(next.dtiSecRegistration)!;
  if (next.bir2303No !== undefined) next.bir2303No = toUpperSafe(next.bir2303No);
  return next;
};

export interface DirectoryContextType {
  employers: EmployerProfile[];
  setEmployers: React.Dispatch<React.SetStateAction<EmployerProfile[]>>;
  jobSeekers: JobSeekerProfile[];
  setJobSeekers: React.Dispatch<React.SetStateAction<JobSeekerProfile[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  announcements: SystemAnnouncement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<SystemAnnouncement[]>>;
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  currentEmployerProfile: EmployerProfile | null;
  currentSeekerProfile: JobSeekerProfile | null;
  logAudit: (action: string, entity: string, entityId: string | undefined, details: string) => void;
  updateEmployerProfile: (employerIdOrData: string | Partial<EmployerProfile>, profileData?: Partial<EmployerProfile>) => void;
  resetDirectoryState: () => void;
}

export const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, setUsers } = useAuth();

  const [employers, setEmployers] = useState<EmployerProfile[]>(() => {
    const saved = storageAdapter.getStoredEmployers([]);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const map = new Map<string, EmployerProfile>();
      INITIAL_EMPLOYERS.forEach(e => map.set(e.id, e));
      saved.forEach((e: EmployerProfile) => map.set(e.id, e));
      return Array.from(map.values());
    }
    return INITIAL_EMPLOYERS;
  });

  const [jobSeekers, setJobSeekers] = useState<JobSeekerProfile[]>(() => {
    const saved = storageAdapter.getStoredJobSeekers([]);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const map = new Map<string, JobSeekerProfile>();
      INITIAL_JOB_SEEKERS.forEach(s => map.set(s.id, s));
      saved.forEach((s: JobSeekerProfile) => map.set(s.id, s));
      return Array.from(map.values());
    }
    return INITIAL_JOB_SEEKERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  useEffect(() => {
    if (employers && employers.length > 0) {
      storageAdapter.setStoredEmployers(employers);
    }
  }, [employers]);

  useEffect(() => {
    if (jobSeekers && jobSeekers.length > 0) {
      storageAdapter.setStoredJobSeekers(jobSeekers);
    }
  }, [jobSeekers]);

  // Initialize Supabase connection and directory/system table subscriptions
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    async function initDatabases() {
      setIsSyncing(true);

      if (isSupabaseConfigured()) {
        try {
          const conn = await testSupabaseConnection();
          if (conn.connected) {
            console.log(`[Supabase] Connected to Roxas PostgreSQL database (${conn.latencyMs}ms). Initializing real-time listeners...`);
            setIsSupabaseConnected(true);
            await ensureDemoAccountsExistInSupabase();

            unsubs.push(
              subscribeToSupabaseTable<EmployerProfile>(SUPABASE_TABLES.EMPLOYERS, (data) => {
                if (data && data.length > 0) {
                  setEmployers(prev => {
                    const map = new Map<string, EmployerProfile>();
                    prev.forEach(e => map.set(e.id, e));
                    data.forEach(e => map.set(e.id, e));
                    return Array.from(map.values());
                  });
                }
              }),
              subscribeToSupabaseTable<JobSeekerProfile>(SUPABASE_TABLES.JOB_SEEKERS, (data) => {
                if (data && data.length > 0) {
                  setJobSeekers(prev => {
                    const map = new Map<string, JobSeekerProfile>();
                    prev.forEach(s => map.set(s.id, s));
                    data.forEach(s => {
                      const existing = map.get(s.id);
                      const isCompleted = Boolean(
                        s.isProfileCompleted ||
                        existing?.isProfileCompleted ||
                        storageAdapter.isProfileCompletedInStorage(s.id) ||
                        (s.userId && storageAdapter.isProfileCompletedInStorage(s.userId)) ||
                        (s.email && storageAdapter.isProfileCompletedInStorage(s.email))
                      );
                      map.set(s.id, { ...s, isProfileCompleted: isCompleted });
                    });
                    return Array.from(map.values());
                  });
                }
              }),
              subscribeToSupabaseTable<AuditLog>(SUPABASE_TABLES.AUDIT_LOGS, (data) => {
                if (data && data.length > 0) {
                  const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  setAuditLogs(sorted);
                }
              }),
              subscribeToSupabaseTable<SystemAnnouncement>(SUPABASE_TABLES.ANNOUNCEMENTS, (data) => {
                if (data && data.length > 0) setAnnouncements(data);
              })
            );
          }
        } catch (sbErr) {
          console.warn('[Supabase] Initialization warning, continuing with local store:', sbErr);
        }
      } else {
        console.log('[Supabase] Running in local offline state mode with seed fixtures.');
      }

      setIsSyncing(false);
    }

    initDatabases();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Derived current profiles for logged-in user
  const currentEmployerProfile = currentUser?.role === 'employer'
    ? (() => {
        const cleanEmail = (currentUser.email || '').toLowerCase();
        const matchFn = (e: EmployerProfile) =>
          e.userId === currentUser.id ||
          e.id === currentUser.id ||
          (Boolean(cleanEmail) && Boolean(e.email) && e.email.toLowerCase() === cleanEmail);

        const found = employers.find(matchFn) || storageAdapter.getStoredEmployers([]).find(matchFn);
        const isLocallyCompleted = isEmployerProfileComplete(currentUser, found);

        if (!found) {
          return {
            id: `emp-${currentUser.id}`,
            userId: currentUser.id,
            companyName: currentUser.name || 'Business Establishment',
            representativeName: currentUser.name || 'Authorized Representative',
            contactNumber: currentUser.phone || '',
            email: currentUser.email,
            address: 'Roxas, Oriental Mindoro',
            municipality: 'Roxas',
            industry: 'Information Technology',
            companyDescription: '',
            status: 'pending' as EmployerStatus,
            isProfileCompleted: isLocallyCompleted,
            logoUrl: currentUser.avatar,
            createdAt: currentUser.createdAt || new Date().toISOString(),
          } satisfies EmployerProfile;
        }

        if (isLocallyCompleted && !found.isProfileCompleted) {
          return { ...found, isProfileCompleted: true };
        }
        return found;
      })()
    : null;

  const currentSeekerProfile = currentUser?.role === 'job_seeker'
    ? (() => {
        const found = jobSeekers.find(s =>
          s.userId === currentUser.id ||
          s.id === currentUser.id ||
          (s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        const isLocallyCompleted = isSeekerProfileComplete(currentUser, found);

        if (!found) {
          if (isLocallyCompleted) {
            const synthesized: JobSeekerProfile = {
              id: `seeker-${currentUser.id}`,
              userId: currentUser.id,
              firstName: currentUser.name.split(' ')[0] || 'User',
              lastName: currentUser.name.split(' ').slice(1).join(' ') || 'Roxas',
              email: currentUser.email,
              contactNumber: currentUser.phone || '',
              dateOfBirth: '2000-01-01',
              address: 'Brgy. Bagumbayan, Roxas, Oriental Mindoro',
              municipality: 'Roxas',
              professionalSummary: 'Registered job seeker on eHANAP Roxas.',
              educationalAttainment: "College Graduate",
              primaryDegree: 'BS Information Technology',
              technicalSkills: ['Computer Literacy', 'Cash Handling', 'POS Operation', 'Customer Service'],
              softSkills: ['Communication', 'Teamwork', 'Problem Solving'],
              tradeSkills: ['Computer Hardware Servicing'],
              practicalSkills: ['POS Terminal Operation', 'Customer Assistance'],
              education: [],
              workExperience: [],
              certifications: [],
              resumes: [],
              jobPreferences: {
                categories: ['Customer Service & Retail', 'Information Technology & Software'],
                municipalities: ['Roxas'],
                employmentTypes: ['Full-time'],
                minSalary: '12000'
              },
              isProfileCompleted: true,
              updatedAt: new Date().toISOString()
            };
            return synthesized;
          }
          const uncompletedBase: JobSeekerProfile = {
            id: `seeker-${currentUser.id}`,
            userId: currentUser.id,
            firstName: currentUser.name.split(' ')[0] || 'User',
            lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
            dateOfBirth: '2000-01-01',
            email: currentUser.email,
            contactNumber: currentUser.phone || '',
            address: 'Roxas, Oriental Mindoro',
            municipality: 'Roxas',
            professionalSummary: 'Registered job seeker on eHANAP Roxas.',
            educationalAttainment: "College Graduate",
            primaryDegree: '',
            technicalSkills: [],
            softSkills: [],
            education: [],
            workExperience: [],
            certifications: [],
            resumes: [],
            isProfileCompleted: false,
            updatedAt: new Date().toISOString()
          };
          return uncompletedBase;
        }

        if (isLocallyCompleted && !found.isProfileCompleted) {
          return { ...found, isProfileCompleted: true };
        }
        return found;
      })()
    : null;

  const logAudit = (action: string, entity: string, entityId: string | undefined, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `audit-${crypto.randomUUID()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveDocument(COLLECTIONS.AUDIT_LOGS, newLog);
  };

  const updateEmployerProfile = (employerIdOrData: string | Partial<EmployerProfile>, maybeData?: Partial<EmployerProfile>) => {
    const targetId = typeof employerIdOrData === 'string' ? employerIdOrData : (currentEmployerProfile?.id || '');
    const rawProfileData = typeof employerIdOrData === 'string' ? (maybeData || {}) : employerIdOrData;
    const profileData = normalizeEmployerProfileToUpperCase(rawProfileData);
    const emailToMatch = (profileData.email || currentUser?.email || '').toLowerCase().trim();

    setEmployers(prev => {
      const matchesEmployer = (e: EmployerProfile) =>
        (Boolean(targetId) && e.id === targetId) ||
        (Boolean(currentUser?.id) && e.userId === currentUser!.id) ||
        (Boolean(emailToMatch) && Boolean(e.email) && e.email.toLowerCase() === emailToMatch);

      const exists = prev.some(matchesEmployer);
      if (!exists && (currentEmployerProfile || currentUser)) {
        const base = currentEmployerProfile || {
          id: targetId || `emp-${currentUser?.id || crypto.randomUUID()}`,
          userId: currentUser?.id || '',
          companyName: currentUser?.name || 'Business Establishment',
          representativeName: currentUser?.name || 'Authorized Representative',
          contactNumber: currentUser?.phone || '',
          email: currentUser?.email || '',
          address: 'Roxas, Oriental Mindoro',
          municipality: 'Roxas',
          industry: 'Information Technology',
          companyDescription: '',
          status: 'pending' as EmployerStatus,
          createdAt: new Date().toISOString(),
        };
        const newRecord: EmployerProfile = {
          ...base,
          ...profileData,
          isProfileCompleted: profileData.isProfileCompleted ?? base.isProfileCompleted ?? true,
        };
        saveDocument(COLLECTIONS.EMPLOYERS, newRecord);
        return [...prev, newRecord];
      }

      return prev.map(e => {
        if (matchesEmployer(e)) {
          const isCompletedNow = profileData.isProfileCompleted ?? e.isProfileCompleted ?? true;
          const updated = {
            ...e,
            ...profileData,
            isProfileCompleted: isCompletedNow,
            updatedAt: new Date().toISOString()
          };
          saveDocument(COLLECTIONS.EMPLOYERS, updated);
          return updated;
        }
        return e;
      });
    });

    if (currentUser) {
      const isCompletedFlag = profileData.isProfileCompleted ?? true;
      const repName = (profileData.representativeName || profileData.companyName || '').trim();
      const shouldUpdateName = repName.length > 0;

      if (isCompletedFlag) {
        setCurrentUser(prev => prev ? ({
          ...prev,
          isProfileCompleted: true,
          ...(shouldUpdateName ? { name: repName } : {}),
          ...(profileData.logoUrl !== undefined ? { avatar: profileData.logoUrl } : {})
        } as any) : null);
        setUsers(prev => prev.map(u => {
          if (u.id === currentUser.id || (currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())) {
            const updatedUser = {
              ...u,
              isProfileCompleted: true,
              ...(shouldUpdateName ? { name: repName } : {}),
              ...(profileData.logoUrl !== undefined ? { avatar: profileData.logoUrl } : {})
            };
            saveDocument(COLLECTIONS.USERS, updatedUser);
            return updatedUser;
          }
          return u;
        }));

        markProfileCompletedInStorage([currentUser.id, currentUser.email, typeof employerIdOrData === 'string' ? employerIdOrData : undefined], 'employer');
      }
    }

    logAudit('PROFILE_UPDATED', 'EmployerProfile', targetId || 'current', 'Updated employer company details.');
  };

  const resetDirectoryState = () => {
    setEmployers(INITIAL_EMPLOYERS);
    setJobSeekers(INITIAL_JOB_SEEKERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
  };

  return (
    <DirectoryContext.Provider
      value={{
        employers,
        setEmployers,
        jobSeekers,
        setJobSeekers,
        auditLogs,
        setAuditLogs,
        announcements,
        setAnnouncements,
        isSupabaseConnected,
        isSyncing,
        currentEmployerProfile,
        currentSeekerProfile,
        logAudit,
        updateEmployerProfile,
        resetDirectoryState,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
};

export const useDirectory = (): DirectoryContextType => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
};
