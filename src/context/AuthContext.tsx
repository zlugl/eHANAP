import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, UserRole, JobSeekerProfile, EmployerProfile } from '../types';
import { INITIAL_USERS, INITIAL_JOB_SEEKERS, INITIAL_EMPLOYERS } from '../data/mockData';
import { DEMO_ACCOUNTS, getDemoAccountByEmail } from '../data/demoAccounts';
import { storageAdapter } from '../lib/storageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  testSupabaseConnection,
  signUpWithSupabase,
  verifySupabaseOtp,
  resendSupabaseOtp,
  sendPasswordResetEmail,
  resetPasswordWithOtp,
  signInWithSupabase,
  signOutWithSupabase,
  signInWithSupabaseOAuth,
  onSupabaseAuthStateChange,
  subscribeToSupabaseTable,
  saveRecord,
  updateRecord,
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
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> | {
    success: boolean;
    user?: User;
    error?: string;
  };
  sendOtp: (
    identifier: string,
    channel?: 'email' | 'mobile' | string
  ) => Promise<{ success: boolean; code?: string; error?: string }> | { success: boolean; code?: string; error?: string };
  verifyOtp: (
    identifier: string,
    code: string,
    type?: 'signup' | 'recovery'
  ) => Promise<{ success: boolean; error?: string }>;
  resendOtp?: (
    identifier: string,
    type?: 'signup' | 'recovery'
  ) => Promise<{ success: boolean; code?: string; error?: string }>;
  requestPasswordReset?: (
    email: string
  ) => Promise<{ success: boolean; code?: string; error?: string }>;
  recoverPassword: (
    identifier: string,
    code: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
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
    const saved = storageAdapter.getStoredUsers([]);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const map = new Map<string, User>();
      INITIAL_USERS.forEach((u) => map.set(u.id, u));
      saved.forEach((u: User) => {
        if (
          u.role === 'admin' &&
          u.id !== 'user-peso-admin-01' &&
          u.email?.toLowerCase() !== 'peso.admin@roxas.gov.ph'
        ) {
          return;
        }
        map.set(u.id, u);
      });
      return Array.from(map.values());
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync users state to storageAdapter
  useEffect(() => {
    if (users && users.length > 0) {
      storageAdapter.setStoredUsers(users);
    }
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
                  storageAdapter.removeItem('ehanap_oauth_intended_role');
                  return latestUsers;
                }

                // If no matching user exists in local state, provision newly authenticated OAuth user:
                const rawIntended = storageAdapter.getItem<UserRole>('ehanap_oauth_intended_role', 'job_seeker');
                const intendedRole: UserRole = (rawIntended === 'employer' || rawIntended === 'job_seeker') ? rawIntended : 'job_seeker';
                storageAdapter.removeItem('ehanap_oauth_intended_role');

                const metadata = session.user.user_metadata || {};
                const name = metadata.full_name || metadata.name || sessionEmail.split('@')[0];
                const newUserId = `user-${Date.now()}`;
                const avatarUrl = metadata.avatar_url || undefined;

                if (intendedRole === 'employer') {
                  clearProfileCompletedInStorage([newUserId, sessionEmail], 'employer');
                  const newUser: User = {
                    id: newUserId,
                    email: sessionEmail,
                    name,
                    role: 'employer',
                    isProfileCompleted: false,
                    isAccountVerified: true,
                    createdAt: new Date().toISOString(),
                    avatar: avatarUrl,
                  };
                  const newEmp: EmployerProfile = {
                    id: `emp-${Date.now()}`,
                    userId: newUserId,
                    companyName: name || 'Business Establishment',
                    representativeName: name || 'Authorized Representative',
                    contactNumber: '',
                    email: sessionEmail,
                    address: 'Roxas, Oriental Mindoro',
                    municipality: 'Roxas',
                    industry: 'Information Technology',
                    companyDescription: '',
                    status: 'pending',
                    isProfileCompleted: false,
                    logoUrl: avatarUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
                    createdAt: new Date().toISOString(),
                  };
                  setCurrentUser(newUser);
                  if (isSupabaseConfigured()) {
                    saveRecord(SUPABASE_TABLES.USERS, newUser).catch(() => {});
                    saveRecord(SUPABASE_TABLES.EMPLOYERS, newEmp).catch(() => {});
                  }
                  return [...latestUsers, newUser];
                } else {
                  clearProfileCompletedInStorage([newUserId, sessionEmail], 'job_seeker');
                  const nameParts = name.trim().split(/\s+/);
                  const firstName = nameParts[0] || 'Job';
                  const lastName = nameParts.slice(1).join(' ') || 'Seeker';
                  const newUser: User = {
                    id: newUserId,
                    email: sessionEmail,
                    name,
                    role: 'job_seeker',
                    isProfileCompleted: false,
                    isAccountVerified: true,
                    createdAt: new Date().toISOString(),
                    avatar: avatarUrl,
                  };
                  const newSeeker: JobSeekerProfile = {
                    id: `seeker-${Date.now()}`,
                    userId: newUserId,
                    firstName,
                    lastName,
                    dateOfBirth: '2000-01-01',
                    email: sessionEmail,
                    contactNumber: '',
                    address: 'Bagumbayan, Roxas',
                    municipality: 'Roxas',
                    profilePicture: avatarUrl,
                    professionalSummary: 'Job seeker registered via Google OAuth on eHANAP Roxas.',
                    educationalAttainment: "Bachelor's Degree",
                    primaryDegree: '',
                    technicalSkills: [],
                    softSkills: ['Communication', 'Teamwork'],
                    education: [],
                    workExperience: [],
                    certifications: [],
                    resumes: [],
                    isProfileCompleted: false,
                    employmentStatus: 'unemployed',
                    updatedAt: new Date().toISOString(),
                  };
                  setCurrentUser(newUser);
                  if (isSupabaseConfigured()) {
                    saveRecord(SUPABASE_TABLES.USERS, newUser).catch(() => {});
                    saveRecord(SUPABASE_TABLES.JOB_SEEKERS, newSeeker).catch(() => {});
                  }
                  return [...latestUsers, newUser];
                }
              });
            }
          });
          unsubs.push(authSub.unsubscribe);

          const usersUnsub = subscribeToSupabaseTable<User>(SUPABASE_TABLES.USERS, (data) => {
            if (data && data.length > 0) {
              setUsers((prev) => {
                const map = new Map<string, User>();
                prev.forEach((u) => map.set(u.id, u));
                data.forEach((u) => {
                  if (
                    u.role === 'admin' &&
                    u.id !== 'user-peso-admin-01' &&
                    u.email?.toLowerCase() !== 'peso.admin@roxas.gov.ph'
                  ) {
                    return;
                  }
                  const existing = map.get(u.id);
                  const isCompleted =
                    u.isProfileCompleted ||
                    existing?.isProfileCompleted ||
                    storageAdapter.isProfileCompletedInStorage(u.id) ||
                    (u.email ? storageAdapter.isProfileCompletedInStorage(u.email) : false);
                  map.set(u.id, { ...u, isProfileCompleted: Boolean(isCompleted) });
                });
                return Array.from(map.values());
              });

              setCurrentUser((prev) => {
                if (!prev) return null;
                const match = data.find((u) => u.id === prev.id);
                if (!match) return prev;
                const completed =
                  prev.isProfileCompleted ||
                  match.isProfileCompleted ||
                  storageAdapter.isProfileCompletedInStorage(prev.id) ||
                  (prev.email ? storageAdapter.isProfileCompletedInStorage(prev.email) : false);
                return { ...match, isProfileCompleted: Boolean(completed) };
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
      if (targetUser) {
        setCurrentUser(targetUser);
      } else {
        setCurrentUser(null);
      }
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
        const demo = getDemoAccountByEmail(cleanEmail);
        if (demo) {
          found = {
            id: demo.userId,
            email: demo.email,
            name: demo.name,
            role: demo.role,
            avatar: demo.avatar,
            isAccountVerified: true,
            createdAt: new Date().toISOString(),
            password: demo.password,
          } as any;
          setUsers((prev) => [found!, ...prev]);
          if (isSupabaseConfigured()) {
            saveRecord(SUPABASE_TABLES.USERS, found!).catch(() => {});
          }
        }
      }

      if (!found) {
        return {
          success: false,
          error: 'No account found with this email address. Please register for an account.',
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

      const storedEmployers = INITIAL_EMPLOYERS;
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
      let email = '';
      const cleanTarget = (target || '').trim().toLowerCase();

      if (cleanTarget === 'job_seeker' || cleanTarget === 'seeker') {
        email = 'juan.delacruz@jobseeker.ph';
      } else if (cleanTarget === 'employer') {
        email = 'puregold.roxas@employer.ph';
      } else if (cleanTarget === 'admin') {
        email = 'peso.admin@roxas.gov.ph';
      } else {
        const demo = DEMO_ACCOUNTS.find(
          (a) =>
            a.id.toLowerCase() === cleanTarget ||
            a.email.toLowerCase() === cleanTarget ||
            a.userId.toLowerCase() === cleanTarget
        );
        if (demo) {
          email = demo.email;
        } else {
          email = target;
        }
      }

      const res = loginAs(email, 'password123');
      if (res.success && res.user) {
        if (toastContext) {
          toastContext.showToast({
            title: `Persona: ${
              res.user.role === 'admin'
                ? 'PESO Admin'
                : res.user.role === 'employer'
                ? 'Employer'
                : 'Job Seeker'
            }`,
            message: `Switched to ${res.user.name} (${res.user.email}).`,
            type: 'status',
          });
        }
        return { success: true, user: res.user, role: res.user.role };
      }

      return { success: false, error: res.error || 'Failed to switch demo account.' };
    },
    [loginAs, toastContext]
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
          const matchingEmployer = INITIAL_EMPLOYERS.find(
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
              isAccountVerified: true,
              createdAt: new Date().toISOString(),
              avatar: avatarUrl,
            };

            const newEmpId = `emp-${Date.now()}`;
            const newEmp: EmployerProfile = {
              id: newEmpId,
              userId: newUserId,
              companyName: name || 'Business Establishment',
              representativeName: name || 'Authorized Representative',
              contactNumber: '',
              email,
              address: 'Roxas, Oriental Mindoro',
              municipality: 'Roxas',
              industry: 'Information Technology',
              companyDescription: '',
              status: 'pending',
              isProfileCompleted: false,
              logoUrl:
                avatarUrl ||
                'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
              createdAt: new Date().toISOString(),
            };

            setUsers((prev) => [...prev, newUser]);
            setCurrentUser(newUser);

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
            const firstName = nameParts[0] || 'Job';
            const lastName = nameParts.slice(1).join(' ') || 'Seeker';

            const newUser: User = {
              id: newUserId,
              email,
              name,
              role: 'job_seeker',
              isProfileCompleted: false,
              isAccountVerified: true,
              createdAt: new Date().toISOString(),
              avatar: avatarUrl,
            };

            const newSeekerId = `seeker-${Date.now()}`;
            const newSeeker: JobSeekerProfile = {
              id: newSeekerId,
              userId: newUserId,
              firstName,
              lastName,
              dateOfBirth: '2000-01-01',
              email,
              contactNumber: '',
              address: 'Bagumbayan, Roxas',
              municipality: 'Roxas',
              profilePicture: avatarUrl,
              professionalSummary: 'Job seeker registered via Google on eHANAP Roxas.',
              educationalAttainment: "Bachelor's Degree",
              primaryDegree: '',
              technicalSkills: [],
              softSkills: ['Communication', 'Teamwork'],
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
    (identifier: string, channel?: 'email' | 'mobile' | string) => {
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
    async (
      identifier: string,
      code: string,
      type: 'signup' | 'recovery' = 'signup'
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanId = identifier.trim().toLowerCase();
      const trimmedCode = code.trim();

      // Master demo code fallback for academic thesis defense and offline evaluation
      const isMasterCode = trimmedCode === '123456';

      let stored = otpStore.current.get(cleanId);
      if (!stored) {
        try {
          const raw = sessionStorage.getItem(`otp_${cleanId}`);
          if (raw) stored = JSON.parse(raw);
        } catch {
          // quiet fallback
        }
      }

      const isLocalValid = Boolean(
        stored && stored.code === trimmedCode && Date.now() <= stored.expiresAt
      );

      // If Supabase is configured and not master demo code / local fallback
      if (isSupabaseConfigured() && !isMasterCode && !isLocalValid) {
        const supabaseRes = await verifySupabaseOtp(cleanId, trimmedCode, type);
        if (!supabaseRes.success) {
          return {
            success: false,
            error: supabaseRes.error || 'Invalid or expired verification code.',
          };
        }
      } else if (!isMasterCode && !isLocalValid) {
        if (stored && Date.now() > stored.expiresAt) {
          return {
            success: false,
            error: 'Verification code has expired. Please request a new code.',
          };
        }
        return {
          success: false,
          error: 'Invalid verification code. Please check the code sent to your email/mobile.',
        };
      }

      // Cleanup local state
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
    },
    [users]
  );

  const resendOtp = useCallback(
    async (
      identifier: string,
      type: 'signup' | 'recovery' = 'signup'
    ): Promise<{ success: boolean; code?: string; error?: string }> => {
      const cleanId = (identifier || '').trim().toLowerCase();
      if (!cleanId) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (isSupabaseConfigured()) {
        const res = await resendSupabaseOtp(cleanId, 'signup');
        if (!res.success) {
          return { success: false, error: res.error };
        }
        return { success: true };
      }

      // Offline / Demo fallback
      return sendOtp(cleanId, 'email');
    },
    [sendOtp]
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; code?: string; error?: string }> => {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid registered email.' };
      }

      if (isSupabaseConfigured()) {
        const res = await sendPasswordResetEmail(cleanEmail);
        if (!res.success) {
          return { success: false, error: res.error || 'Failed to dispatch password recovery email.' };
        }
        return { success: true };
      }

      // Offline / Demo fallback
      return sendOtp(cleanEmail, 'email');
    },
    [sendOtp]
  );

  const recoverPassword = useCallback(
    async (identifier: string, code: string, newPassword: string) => {
      const cleanId = identifier.trim().toLowerCase();
      const trimmedCode = code.trim();

      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      // Master demo code fallback for academic thesis defense and offline evaluation
      const isMasterCode = trimmedCode === '123456';

      let stored = otpStore.current.get(cleanId);
      if (!stored) {
        try {
          const raw = sessionStorage.getItem(`otp_${cleanId}`);
          if (raw) stored = JSON.parse(raw);
        } catch {}
      }
      const isLocalValid = Boolean(
        stored && stored.code === trimmedCode && Date.now() <= stored.expiresAt
      );

      // If Supabase is configured and not master demo code / local token
      if (isSupabaseConfigured() && !isMasterCode && !isLocalValid) {
        const resetRes = await resetPasswordWithOtp(cleanId, trimmedCode, newPassword);
        if (!resetRes.success) {
          return {
            success: false,
            error: resetRes.error || 'Password reset failed. Please check your OTP code.',
          };
        }
      } else if (!isMasterCode && !isLocalValid) {
        if (stored && Date.now() > stored.expiresAt) {
          return {
            success: false,
            error: 'Verification code has expired. Please request a new code.',
          };
        }
        return {
          success: false,
          error: 'Invalid verification code. Please check the code sent to your email.',
        };
      }

      // Cleanup local OTP token
      otpStore.current.delete(cleanId);
      try {
        sessionStorage.removeItem(`otp_${cleanId}`);
      } catch {}

      // Update password in local memory & storage so loginAs succeeds immediately
      const user = users.find(
        (u) => u.email.toLowerCase() === cleanId || (u.phone && u.phone.includes(cleanId))
      );
      if (user) {
        const updatedUser = { ...user, password: newPassword, isAccountVerified: true };
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
        if (isSupabaseConfigured()) {
          saveRecord(SUPABASE_TABLES.USERS, updatedUser).catch(() => {});
        }
      }

      return { success: true };
    },
    [users]
  );

  const registerUser = useCallback(
    (userData: Omit<User, 'id' | 'createdAt'>, extraProfile: any) => {
      if (userData.role === 'admin') {
        return {
          success: false,
          error:
            'The LGU/PESO municipal oversight is restricted to a single authorized administrator account (peso.admin@roxas.gov.ph). Registering additional administrative accounts is disabled.',
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
        isProfileCompleted: false,
        createdAt: new Date().toISOString(),
        ...(extraProfile?.password ? { password: extraProfile.password } : {}),
      };

      setUsers((prev) => [...prev, newUser]);
      if (isSupabaseConfigured()) {
        const regPassword = extraProfile?.password || 'eHANAP@2026';
        signUpWithSupabase(cleanRegEmail, regPassword, {
          name: userData.name,
          full_name: userData.name,
          role: userData.role,
          municipality: 'Roxas',
        }).catch((err) => {
          console.warn('[Supabase Auth] Background signup warning:', err);
        });

        saveRecord(SUPABASE_TABLES.USERS, newUser).catch((err) => {
          console.warn('[Supabase] Failed to save user record:', err);
        });
      }

      if (userData.role === 'job_seeker') {
        const newSeeker: JobSeekerProfile = {
          id: `seeker-${Date.now()}`,
          userId: newUserId,
          firstName: extraProfile.firstName || 'New',
          lastName: extraProfile.lastName || 'Seeker',
          dateOfBirth: extraProfile.dateOfBirth || '2000-01-01',
          email: userData.email,
          contactNumber: extraProfile.contactNumber || '',
          address:
            extraProfile.address ||
            (extraProfile.barangay ? `Brgy. ${extraProfile.barangay}, Roxas, Oriental Mindoro` : ''),
          municipality: extraProfile.municipality || 'Roxas',
          professionalSummary:
            extraProfile.professionalSummary || 'Job seeker registered on eHANAP Oriental Mindoro.',
          educationalAttainment: extraProfile.educationalAttainment || "Bachelor's Degree",
          primaryDegree: extraProfile.primaryDegree || '',
          technicalSkills: extraProfile.technicalSkills || [],
          softSkills: extraProfile.softSkills || ['Communication'],
          education:
            extraProfile.education ||
            (extraProfile.school || extraProfile.primaryDegree
              ? [
                  {
                    id: `edu-${Date.now()}`,
                    degreeCourse: extraProfile.primaryDegree || '',
                    school: extraProfile.school || 'Higher Education Institution',
                    yearGraduated: new Date().getFullYear(),
                    educationalAttainment: extraProfile.educationalAttainment || "Bachelor's Degree",
                  },
                ]
              : []),
          workExperience:
            extraProfile.workExperience ||
            (extraProfile.workExperienceYears > 0
              ? [
                  {
                    id: `exp-${Date.now()}`,
                    company: 'Previous Employer',
                    position: 'Staff / Specialist',
                    startDate: `${
                      new Date().getFullYear() -
                      Math.max(1, Math.round(extraProfile.workExperienceYears))
                    }`,
                    endDate: 'Present',
                    isCurrent: true,
                    responsibilities: 'Relevant vocational and professional experience.',
                    yearsOfExperience: Number(extraProfile.workExperienceYears),
                  },
                ]
              : []),
          certifications: extraProfile.certifications || [],
          resumes: extraProfile.resumes || [],
          activeResumeId: extraProfile.activeResumeId || undefined,
          isProfileCompleted: false,
          updatedAt: new Date().toISOString(),
        };

        const existingSeekers = storageAdapter.getStoredJobSeekers(INITIAL_JOB_SEEKERS);
        storageAdapter.setStoredJobSeekers([...existingSeekers, newSeeker]);

        if (isSupabaseConfigured()) {
          saveRecord(SUPABASE_TABLES.JOB_SEEKERS, newSeeker).catch(() => {});
        }
      } else if (userData.role === 'employer') {
        const newEmp: EmployerProfile = {
          id: `emp-${Date.now()}`,
          userId: newUserId,
          companyName: extraProfile.companyName || userData.name,
          representativeName: extraProfile.representativeName || userData.name,
          contactNumber: extraProfile.contactNumber || '',
          email: userData.email,
          address: extraProfile.address || '',
          municipality: extraProfile.municipality || 'Calapan City',
          industry: extraProfile.industry || 'Business Services',
          companyDescription:
            extraProfile.companyDescription || 'Registered Employer in Oriental Mindoro.',
          status: 'pending',
          isProfileCompleted: false,
          businessPermitNo: extraProfile.businessPermitNo || '',
          dtiSecRegistration: extraProfile.dtiSecRegistration || '',
          createdAt: new Date().toISOString(),
        };

        if (isSupabaseConfigured()) {
          saveRecord(SUPABASE_TABLES.EMPLOYERS, newEmp).catch(() => {});
        }
      }

      setCurrentUser(newUser);

      return { success: true, user: newUser };
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
        resendOtp,
        requestPasswordReset,
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
