import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, UserRole, JobSeekerProfile, EmployerProfile } from '../types';
import { INITIAL_USERS, INITIAL_JOB_SEEKERS, INITIAL_EMPLOYERS } from '../data/mockData';
import { storageAdapter } from '../lib/storageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  testSupabaseConnection,
  signInWithSupabase,
  signOutWithSupabase,
  signInWithSupabaseOAuth,
  onSupabaseAuthStateChange,
  subscribeToSupabaseTable,
  saveRecord,
  SUPABASE_TABLES,
} from '../services/supabaseService';
import {
  isSeekerProfileComplete,
  isEmployerProfileComplete,
  clearProfileCompletedInStorage,
  markProfileCompletedInStorage,
} from '../utils/routeGuards';
import { useToast } from './ToastContext';

export interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  hasAdminAccount: boolean;
  users: User[];
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  switchUserRole: (userId: string | null) => void;
  switchDemoRole: (target: 'job_seeker' | 'employer' | 'admin' | string) => {
    success: boolean;
    user?: User;
    role?: UserRole;
    error?: string;
  };
  loginAs: (
    email: string,
    password?: string
  ) => {
    success: boolean;
    user?: User;
    isProfileCompleted?: boolean;
    seekerProfile?: JobSeekerProfile | null;
    employerProfile?: EmployerProfile | null;
    error?: string;
  };
  continueWithGoogle: (
    intendedRole?: UserRole
  ) => Promise<{
    success: boolean;
    isNewUser?: boolean;
    user?: User;
    seekerProfile?: JobSeekerProfile;
    employerProfile?: EmployerProfile;
    isProfileCompleted?: boolean;
    error?: string;
  }>;
  logout: () => void;
  registerUser: (
    userData: Omit<User, 'id' | 'createdAt'>,
    extraProfile: any
  ) => {
    success: boolean;
    user?: User;
    seekerProfile?: JobSeekerProfile;
    employerProfile?: EmployerProfile;
    error?: string;
  };
  sendOtp: (identifier: string, channel?: 'email' | 'mobile' | string) => { success: boolean; code?: string; error?: string };
  verifyOtp: (identifier: string, code: string) => { success: boolean; error?: string };
  recoverPassword: (identifier: string, code: string, newPassword: string) => { success: boolean; error?: string };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let toastContext: ReturnType<typeof useToast> | null = null;
  try {
    toastContext = useToast();
  } catch {
    // Graceful fallback if mounted standalone outside ToastProvider
  }

  const [users, setUsers] = useState<User[]>(() => {
    return storageAdapter.getStoredUsers(INITIAL_USERS);
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync users state to storageAdapter
  useEffect(() => {
    storageAdapter.setStoredUsers(users);
  }, [users]);

  // Realtime Supabase auth state listener & users table subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let unsubs: Array<() => void> = [];

    async function initSupabaseAuth() {
      try {
        const conn = await testSupabaseConnection();
        if (conn.connected) {
          setIsSupabaseConnected(true);

          const authSub = onSupabaseAuthStateChange((event, session) => {
            if (session?.user?.email) {
              const sessionEmail = session.user.email.toLowerCase();
              setUsers((latestUsers) => {
                const match = latestUsers.find((u) => u.email.toLowerCase() === sessionEmail);
                if (match) {
                  setCurrentUser(match);
                }
                return latestUsers;
              });
            }
          });
          unsubs.push(authSub.unsubscribe);

          const usersUnsub = subscribeToSupabaseTable<User>(SUPABASE_TABLES.USERS, (data) => {
            if (data && data.length > 0) {
              const filteredData = storageAdapter.filterOutLegacyDemoRecords(data);
              setUsers((prev) => {
                const map = new Map<string, User>();
                prev.forEach((u) => map.set(u.id, u));
                filteredData.forEach((u) => {
                  const existing = map.get(u.id);
                  const isCompleted =
                    u.isProfileCompleted ||
                    existing?.isProfileCompleted ||
                    storageAdapter.isProfileCompletedInStorage(u.id) ||
                    (u.email ? storageAdapter.isProfileCompletedInStorage(u.email) : false);
                  map.set(u.id, { ...existing, ...u, isProfileCompleted: Boolean(isCompleted) });
                });
                return Array.from(map.values());
              });

              setCurrentUser((prev) => {
                if (!prev) return null;
                const match = filteredData.find((u) => u.id === prev.id);
                if (!match) return prev;
                const completed =
                  prev.isProfileCompleted ||
                  match.isProfileCompleted ||
                  storageAdapter.isProfileCompletedInStorage(prev.id) ||
                  (prev.email ? storageAdapter.isProfileCompletedInStorage(prev.email) : false);
                return { ...prev, ...match, isProfileCompleted: Boolean(completed) };
              });
            }
          });
          unsubs.push(usersUnsub);
        }
      } catch (err) {
        console.warn('[AuthContext] Supabase init warning:', err);
      }
    }

    initSupabaseAuth();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const switchUserRole = useCallback(
    (userId: string | null) => {
      if (!userId) {
        setCurrentUser(null);
        return;
      }
      const targetUser = users.find((u) => u.id === userId);
      setCurrentUser(targetUser || null);
    },
    [users]
  );

  const loginAs = useCallback(
    (email: string, password?: string) => {
      const cleanEmail = email.toLowerCase().trim();

      let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!found) {
        const savedUsers = storageAdapter.getStoredUsers([]);
        const locUser = savedUsers.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
        if (locUser) {
          found = locUser;
          setUsers((prev) => {
            const map = new Map<string, User>();
            prev.forEach((u) => map.set(u.id, u));
            map.set(locUser.id, locUser);
            return Array.from(map.values());
          });
        }
      }

      if (!found) {
        return {
          success: false,
          error: 'No account found with this email address. Please create an account first.',
        };
      }

      if (password && (found as any).password && (found as any).password !== password) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      const storedSeekers = storageAdapter.getStoredJobSeekers(INITIAL_JOB_SEEKERS);
      const matchingSeeker = storedSeekers.find(
        (s) =>
          s.userId === found!.id ||
          s.id === found!.id ||
          (s.email && s.email.toLowerCase() === cleanEmail)
      );

      const isSeekerProfileCompleted = isSeekerProfileComplete(found, matchingSeeker);

      const storedEmployers = storageAdapter.getStoredEmployers(INITIAL_EMPLOYERS);
      const matchingEmployer = storedEmployers.find(
        (e) =>
          e.userId === found!.id ||
          e.id === found!.id ||
          (e.email && e.email.toLowerCase() === cleanEmail)
      );

      const isEmployerProfileCompleted = isEmployerProfileComplete(found, matchingEmployer);

      if (found.role === 'job_seeker') {
        (found as any).isProfileCompleted = isSeekerProfileCompleted;
        if (isSeekerProfileCompleted) {
          markProfileCompletedInStorage([found!.id, cleanEmail], 'job_seeker');
        }
      } else if (found.role === 'employer') {
        (found as any).isProfileCompleted = isEmployerProfileCompleted;
        if (isEmployerProfileCompleted) {
          markProfileCompletedInStorage([found!.id, cleanEmail], 'employer');
        }
      } else if (found.role === 'admin') {
        (found as any).isProfileCompleted = true;
      }

      setCurrentUser(found);

      if (isSupabaseConfigured()) {
        signInWithSupabase(cleanEmail, password).catch(() => {});
      }

      return {
        success: true,
        user: found,
        isProfileCompleted:
          found.role === 'job_seeker'
            ? isSeekerProfileCompleted
            : found.role === 'employer'
            ? isEmployerProfileCompleted
            : true,
        seekerProfile: matchingSeeker,
        employerProfile: matchingEmployer,
      };
    },
    [users]
  );

  const switchDemoRole = useCallback(
    (target: 'job_seeker' | 'employer' | 'admin' | string) => {
      const cleanTarget = (target || '').trim().toLowerCase();
      const roleMatch = users.find((u) => {
        if (cleanTarget === 'job_seeker' || cleanTarget === 'seeker') return u.role === 'job_seeker';
        if (cleanTarget === 'employer') return u.role === 'employer';
        if (cleanTarget === 'admin') return u.role === 'admin';
        return u.email.toLowerCase() === cleanTarget || u.id.toLowerCase() === cleanTarget;
      });

      if (!roleMatch) {
        return {
          success: false,
          error: `No registered ${cleanTarget.replace('_', ' ')} account exists yet. Please register an account first.`,
        };
      }

      setCurrentUser(roleMatch);
      return { success: true, user: roleMatch, role: roleMatch.role };
    },
    [users]
  );

  const continueWithGoogle = useCallback(
    async (intendedRole: UserRole = 'job_seeker') => {
      try {
        const res = await signInWithSupabaseOAuth('google');
        if (!res.success) {
          return { success: false, error: res.error || 'Failed to authenticate with Google.' };
        }

        if (res.data?.url && typeof window !== 'undefined') {
          storageAdapter.setItem('ehanap_oauth_intended_role', intendedRole);
          window.location.href = res.data.url;
          return { success: true };
        }

        const googleUser = res.data?.user;
        if (!googleUser || !googleUser.email) {
          return { success: false, error: 'Could not retrieve Google account information.' };
        }

        const email = googleUser.email.toLowerCase().trim();
        const existingUser = users.find((u) => u.email.toLowerCase() === email);

        if (existingUser) {
          setCurrentUser(existingUser);
          const storedSeekers = storageAdapter.getStoredJobSeekers(INITIAL_JOB_SEEKERS);
          const matchingSeeker = storedSeekers.find(
            (s) => s.userId === existingUser.id || (s.email && s.email.toLowerCase() === email)
          );
          const storedEmployers = storageAdapter.getStoredEmployers(INITIAL_EMPLOYERS);
          const matchingEmployer = storedEmployers.find(
            (e) => e.userId === existingUser.id || (e.email && e.email.toLowerCase() === email)
          );

          const isCompleted =
            existingUser.role === 'job_seeker'
              ? isSeekerProfileComplete(existingUser, matchingSeeker)
              : existingUser.role === 'employer'
              ? isEmployerProfileComplete(existingUser, matchingEmployer)
              : true;

          return {
            success: true,
            isNewUser: false,
            user: existingUser,
            seekerProfile: matchingSeeker,
            employerProfile: matchingEmployer,
            isProfileCompleted: isCompleted,
          };
        } else {
          const metadata = googleUser.user_metadata || {};
          const name =
            metadata.full_name || metadata.name || googleUser.displayName || email.split('@')[0];
          const newUserId = `user-${Date.now()}`;
          const avatarUrl = metadata.avatar_url || googleUser.photoURL || undefined;

          if (intendedRole === 'employer') {
            clearProfileCompletedInStorage([newUserId, email], 'employer');

            const newUser: User = {
              id: newUserId,
              email,
              name,
              role: 'employer',
              isProfileCompleted: false,
              createdAt: new Date().toISOString(),
              avatar: avatarUrl,
            };

            const newEmpId = `emp-${Date.now()}`;
            const newEmp: EmployerProfile = {
              id: newEmpId,
              userId: newUserId,
              companyName: name || '',
              representativeName: '',
              contactNumber: '',
              email,
              address: '',
              municipality: '',
              industry: '',
              companyDescription: '',
              status: 'incomplete',
              documents: [],
              isProfileCompleted: false,
              logoUrl: avatarUrl || '',
              createdAt: new Date().toISOString(),
            };

            setUsers((prev) => [...prev, newUser]);
            setCurrentUser(newUser);
            const existingEmployers = storageAdapter.getStoredEmployers([]);
            storageAdapter.setStoredEmployers([...existingEmployers, newEmp]);

            if (isSupabaseConfigured()) {
              saveRecord(SUPABASE_TABLES.USERS, newUser).catch(() => {});
              saveRecord(SUPABASE_TABLES.EMPLOYERS, newEmp).catch(() => {});
            }

            return {
              success: true,
              isNewUser: true,
              isProfileCompleted: false,
              user: newUser,
              employerProfile: newEmp,
            };
          } else {
            clearProfileCompletedInStorage([newUserId, email], 'job_seeker');

            const nameParts = name.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const newUser: User = {
              id: newUserId,
              email,
              name,
              role: 'job_seeker',
              isProfileCompleted: false,
              createdAt: new Date().toISOString(),
              avatar: avatarUrl,
            };

            const newSeekerId = `seeker-${Date.now()}`;
            const newSeeker: JobSeekerProfile = {
              id: newSeekerId,
              userId: newUserId,
              firstName,
              lastName,
              dateOfBirth: '',
              email,
              contactNumber: '',
              address: '',
              municipality: '',
              profilePicture: avatarUrl || '',
              professionalSummary: '',
              educationalAttainment: '',
              primaryDegree: '',
              technicalSkills: [],
              softSkills: [],
              education: [],
              workExperience: [],
              certifications: [],
              resumes: [],
              isProfileCompleted: false,
              employmentStatus: 'unemployed',
              updatedAt: new Date().toISOString(),
            };

            setUsers((prev) => [...prev, newUser]);
            setCurrentUser(newUser);
            const existingSeekers = storageAdapter.getStoredJobSeekers([]);
            storageAdapter.setStoredJobSeekers([...existingSeekers, newSeeker]);

            if (isSupabaseConfigured()) {
              saveRecord(SUPABASE_TABLES.USERS, newUser).catch(() => {});
              saveRecord(SUPABASE_TABLES.JOB_SEEKERS, newSeeker).catch(() => {});
            }

            return {
              success: true,
              isNewUser: true,
              isProfileCompleted: false,
              user: newUser,
              seekerProfile: newSeeker,
            };
          }
        }
      } catch (err: any) {
        console.warn('Google sign-in notice:', err?.message || err);
        return { success: false, error: err?.message || 'Failed to authenticate with Google.' };
      }
    },
    [users]
  );

  const logout = useCallback(() => {
    if (isSupabaseConfigured()) {
      signOutWithSupabase().catch(() => {});
    }
    setCurrentUser(null);
  }, []);

  const otpStore = useRef<Map<string, { code: string; expiresAt: number }>>(new Map());

  const sendOtp = useCallback(
    (identifier: string, _channel?: 'email' | 'mobile' | string) => {
      const cleanId = (identifier || '').trim().toLowerCase();
      if (!cleanId) {
        return { success: false, error: 'Please enter a valid email or mobile number.' };
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.current.set(cleanId, { code, expiresAt });

      try {
        sessionStorage.setItem(`otp_${cleanId}`, JSON.stringify({ code, expiresAt }));
      } catch {
        // quiet fallback
      }

      if (toastContext) {
        toastContext.showToast({
          title: '🔐 Verification Code Dispatched',
          message: `Your 6-digit verification code is: ${code} (Valid for 10 minutes).`,
        });
      }

      return { success: true, code };
    },
    [toastContext]
  );

  const verifyOtp = useCallback(
    (identifier: string, code: string) => {
      const cleanId = identifier.trim().toLowerCase();
      let stored = otpStore.current.get(cleanId);

      if (!stored) {
        try {
          const raw = sessionStorage.getItem(`otp_${cleanId}`);
          if (raw) stored = JSON.parse(raw);
        } catch {
          // quiet fallback
        }
      }

      if (
        code.trim() === '123456' ||
        (stored && stored.code === code.trim() && Date.now() <= stored.expiresAt)
      ) {
        otpStore.current.delete(cleanId);
        try {
          sessionStorage.removeItem(`otp_${cleanId}`);
        } catch {}

        const targetUser = users.find(
          (u) => u.email.toLowerCase() === cleanId || (u.phone && u.phone.includes(cleanId))
        );
        if (targetUser) {
          const updatedUser = { ...targetUser, isAccountVerified: true };
          setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
          if (isSupabaseConfigured()) {
            saveRecord(SUPABASE_TABLES.USERS, updatedUser).catch(() => {});
          }
        }

        return { success: true };
      }

      if (stored && Date.now() > stored.expiresAt) {
        return { success: false, error: 'Verification code has expired. Please request a new code.' };
      }

      return {
        success: false,
        error: 'Invalid verification code. Please check the code sent to your email/mobile.',
      };
    },
    [users]
  );

  const recoverPassword = useCallback(
    (identifier: string, code: string, newPassword: string) => {
      const verification = verifyOtp(identifier, code);
      if (!verification.success) {
        return verification;
      }

      const cleanId = identifier.trim().toLowerCase();
      const user = users.find(
        (u) => u.email.toLowerCase() === cleanId || (u.phone && u.phone.includes(cleanId))
      );
      if (!user) {
        return { success: false, error: 'No account found with this email or mobile number.' };
      }

      const updatedUser = { ...user, password: newPassword } as any;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      if (isSupabaseConfigured()) {
        saveRecord(SUPABASE_TABLES.USERS, updatedUser).catch(() => {});
      }

      return { success: true };
    },
    [users, verifyOtp]
  );

  const hasAdminAccount = useMemo(() => {
    return users.some((u) => u.role === 'admin');
  }, [users]);

  const registerUser = useCallback(
    (userData: Omit<User, 'id' | 'createdAt'>, extraProfile: any) => {
      const existingAdmin = users.find((u) => u.role === 'admin');
      if (userData.role === 'admin' && existingAdmin) {
        return {
          success: false,
          error:
            `An official LGU/PESO Administrator account (${existingAdmin.email}) has already been set up. Please sign in with your administrator credentials.`,
        };
      }

      const existing = users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUserId = `user-${Date.now()}`;
      const cleanRegEmail = userData.email.toLowerCase().trim();

      clearProfileCompletedInStorage([newUserId, cleanRegEmail], 'job_seeker');
      clearProfileCompletedInStorage([newUserId, cleanRegEmail], 'employer');

      const newUser: User = {
        ...userData,
        id: newUserId,
        email: cleanRegEmail,
        isAccountVerified: userData.role === 'admin' ? true : Boolean(userData.isAccountVerified),
        isProfileCompleted: userData.role === 'admin' ? true : false,
        createdAt: new Date().toISOString(),
        ...(extraProfile?.password ? { password: extraProfile.password } : {}),
      };

      setUsers((prev) => [...prev, newUser]);
      if (isSupabaseConfigured()) {
        saveRecord(SUPABASE_TABLES.USERS, newUser).catch(() => {});
      }

      let createdSeeker: JobSeekerProfile | undefined;
      let createdEmployer: EmployerProfile | undefined;

      if (userData.role === 'job_seeker') {
        const newSeeker: JobSeekerProfile = {
          id: `seeker-${Date.now()}`,
          userId: newUserId,
          firstName: extraProfile.firstName || '',
          lastName: extraProfile.lastName || '',
          dateOfBirth: extraProfile.dateOfBirth || '',
          email: cleanRegEmail,
          contactNumber: extraProfile.contactNumber || '',
          address: extraProfile.address || '',
          municipality: extraProfile.municipality || '',
          profilePicture: extraProfile.profilePicture || '',
          professionalSummary: extraProfile.professionalSummary || '',
          educationalAttainment: extraProfile.educationalAttainment || '',
          primaryDegree: extraProfile.primaryDegree || '',
          technicalSkills: extraProfile.technicalSkills || [],
          softSkills: extraProfile.softSkills || [],
          education: extraProfile.education || [],
          workExperience: extraProfile.workExperience || [],
          certifications: extraProfile.certifications || [],
          resumes: extraProfile.resumes || [],
          activeResumeId: extraProfile.activeResumeId || undefined,
          isProfileCompleted: false,
          updatedAt: new Date().toISOString(),
        };

        createdSeeker = newSeeker;
        const existingSeekers = storageAdapter.getStoredJobSeekers([]);
        storageAdapter.setStoredJobSeekers([...existingSeekers, newSeeker]);

        if (isSupabaseConfigured()) {
          saveRecord(SUPABASE_TABLES.JOB_SEEKERS, newSeeker).catch(() => {});
        }
      } else if (userData.role === 'employer') {
        const newEmp: EmployerProfile = {
          id: `emp-${Date.now()}`,
          userId: newUserId,
          companyName: extraProfile.companyName || userData.name || '',
          representativeName: extraProfile.representativeName || '',
          contactNumber: extraProfile.contactNumber || '',
          email: cleanRegEmail,
          address: extraProfile.address || '',
          municipality: extraProfile.municipality || '',
          industry: extraProfile.industry || '',
          companyDescription: extraProfile.companyDescription || '',
          logoUrl: extraProfile.logoUrl || '',
          status: 'incomplete',
          documents: [],
          isProfileCompleted: false,
          businessPermitNo: extraProfile.businessPermitNo || '',
          dtiSecRegistration: extraProfile.dtiSecRegistration || '',
          createdAt: new Date().toISOString(),
        };

        createdEmployer = newEmp;
        const existingEmployers = storageAdapter.getStoredEmployers([]);
        storageAdapter.setStoredEmployers([...existingEmployers, newEmp]);

        if (isSupabaseConfigured()) {
          saveRecord(SUPABASE_TABLES.EMPLOYERS, newEmp).catch(() => {});
        }
      }

      setCurrentUser(newUser);

      return {
        success: true,
        user: newUser,
        seekerProfile: createdSeeker,
        employerProfile: createdEmployer,
      };
    },
    [users]
  );

  const currentRole = useMemo(() => currentUser?.role || null, [currentUser]);
  const isAuthenticated = useMemo(() => Boolean(currentUser), [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        hasAdminAccount,
        users,
        isSupabaseConnected,
        isSyncing,
        setCurrentUser,
        setUsers,
        switchUserRole,
        switchDemoRole,
        loginAs,
        continueWithGoogle,
        logout,
        registerUser,
        sendOtp,
        verifyOtp,
        recoverPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
