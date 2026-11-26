import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import { saveDocument, normalizeEmployerProfileToUpperCase } from './persistence';

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
  const { currentUser, setCurrentUser, users, setUsers } = useAuth();

  const [employers, setEmployers] = useState<EmployerProfile[]>(() =>
    storageAdapter.getStoredEmployers(INITIAL_EMPLOYERS)
  );
  const employersRef = useRef<EmployerProfile[]>(employers);
  employersRef.current = employers;
  const usersRef = useRef(users);
  usersRef.current = users;
  const [jobSeekers, setJobSeekers] = useState<JobSeekerProfile[]>(() =>
    storageAdapter.getStoredJobSeekers(INITIAL_JOB_SEEKERS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    storageAdapter.getStoredAuditLogs(INITIAL_AUDIT_LOGS)
  );
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(() =>
    storageAdapter.getStoredAnnouncements(INITIAL_ANNOUNCEMENTS)
  );
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  useEffect(() => {
    storageAdapter.setStoredEmployers(employers);
  }, [employers]);

  useEffect(() => {
    storageAdapter.setStoredJobSeekers(jobSeekers);
  }, [jobSeekers]);

  useEffect(() => {
    storageAdapter.setStoredAuditLogs(auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    storageAdapter.setStoredAnnouncements(announcements);
  }, [announcements]);

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
                  const filteredData = storageAdapter.filterOutLegacyDemoRecords(data);
                  if (filteredData.length > 0) {
                    setEmployers(prev => {
                      const map = new Map<string, EmployerProfile>();
                      prev.forEach(e => map.set(e.id, e));
                      filteredData.forEach(e => map.set(e.id, e));
                      return Array.from(map.values());
                    });
                  }
                }
              }),
              subscribeToSupabaseTable<JobSeekerProfile>(SUPABASE_TABLES.JOB_SEEKERS, (data) => {
                if (data && data.length > 0) {
                  const filteredData = storageAdapter.filterOutLegacyDemoRecords(data);
                  if (filteredData.length > 0) {
                    setJobSeekers(prev => {
                      const map = new Map<string, JobSeekerProfile>();
                      prev.forEach(s => map.set(s.id, s));
                      filteredData.forEach(s => {
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
          const fallback: EmployerProfile = {
            id: `emp-${currentUser.id}`,
            userId: currentUser.id,
            companyName: (currentUser.name || '').toUpperCase(),
            representativeName: '',
            contactNumber: currentUser.phone || '',
            email: currentUser.email || '',
            address: '',
            municipality: '',
            industry: '',
            companyDescription: '',
            status: 'incomplete',
            documents: [],
            isProfileCompleted: isLocallyCompleted,
            logoUrl: currentUser.avatar || '',
            createdAt: currentUser.createdAt || new Date().toISOString(),
          };
          return fallback;
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
    const nowIso = new Date().toISOString();

    const matchesEmployer = (e: EmployerProfile) =>
      (Boolean(targetId) && e.id === targetId) ||
      (Boolean(currentUser?.id) && e.userId === currentUser!.id) ||
      (Boolean(emailToMatch) && Boolean(e.email) && e.email.toLowerCase() === emailToMatch);

    const buildNextEmployers = (list: EmployerProfile[]): { nextList: EmployerProfile[]; recordsToSave: EmployerProfile[] } => {
      const exists = list.some(matchesEmployer);
      if (!exists && (currentEmployerProfile || currentUser)) {
        const base: EmployerProfile = currentEmployerProfile || {
          id: targetId || `emp-${currentUser?.id || crypto.randomUUID()}`,
          userId: currentUser?.id || '',
          companyName: (currentUser?.name || '').toUpperCase(),
          representativeName: '',
          contactNumber: currentUser?.phone || '',
          email: currentUser?.email || '',
          address: '',
          municipality: '',
          industry: '',
          companyDescription: '',
          status: 'incomplete' as EmployerStatus,
          documents: [],
          createdAt: nowIso,
        };
        const newRecord: EmployerProfile = {
          ...base,
          ...profileData,
          isProfileCompleted: profileData.isProfileCompleted ?? base.isProfileCompleted ?? true,
        };
        return { nextList: [...list, newRecord], recordsToSave: [newRecord] };
      }

      const recordsToSave: EmployerProfile[] = [];
      const nextList = list.map(e => {
        if (matchesEmployer(e)) {
          const isCompletedNow = profileData.isProfileCompleted ?? e.isProfileCompleted ?? true;
          const updated = {
            ...e,
            ...profileData,
            isProfileCompleted: isCompletedNow,
            updatedAt: nowIso,
          };
          recordsToSave.push(updated);
          return updated;
        }
        return e;
      });
      return { nextList, recordsToSave };
    };

    const { nextList: nextEmployers, recordsToSave } = buildNextEmployers(employersRef.current);
    employersRef.current = nextEmployers;
    setEmployers(prev => buildNextEmployers(prev).nextList);
    recordsToSave.forEach(record => saveDocument(COLLECTIONS.EMPLOYERS, record));

    if (currentUser) {
      const isCompletedFlag = profileData.isProfileCompleted ?? true;
      const repName = (profileData.representativeName || profileData.companyName || '').trim();
      const shouldUpdateName = repName.length > 0;

      if (isCompletedFlag) {
        const userPatch = {
          isProfileCompleted: true,
          ...(shouldUpdateName ? { name: repName } : {}),
          ...(profileData.logoUrl !== undefined ? { avatar: profileData.logoUrl } : {}),
        };
        const matchesCurrentUser = (u: { id: string; email: string }) =>
          u.id === currentUser.id ||
          (Boolean(currentUser.email) && u.email.toLowerCase() === currentUser.email.toLowerCase());

        const usersToSave = usersRef.current
          .filter(matchesCurrentUser)
          .map(u => ({ ...u, ...userPatch }));

        setCurrentUser(prev => (prev ? ({ ...prev, ...userPatch } as any) : null));
        setUsers(prev => prev.map(u => (matchesCurrentUser(u) ? { ...u, ...userPatch } : u)));
        usersToSave.forEach(updatedUser => saveDocument(COLLECTIONS.USERS, updatedUser));

        markProfileCompletedInStorage([currentUser.id, currentUser.email, typeof employerIdOrData === 'string' ? employerIdOrData : undefined], 'employer');
      }
    }

    logAudit('PROFILE_UPDATED', 'EmployerProfile', targetId || 'current', 'Updated employer company details.');
  };

  const resetDirectoryState = () => {
    setEmployers([]);
    setJobSeekers([]);
    setAuditLogs([]);
    setAnnouncements([]);
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
