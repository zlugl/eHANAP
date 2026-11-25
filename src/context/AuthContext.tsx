import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, UserRole, JobSeekerProfile, EmployerProfile } from '../types';
import { INITIAL_USERS, INITIAL_JOB_SEEKERS, INITIAL_EMPLOYERS } from '../data/mockData';
import { DEMO_ACCOUNTS, getDemoAccountByEmail } from '../data/demoAccounts';
import { storageAdapter } from '../lib/storageAdapter';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  testSupabaseConnection,
  fetchUserByEmail,
  signUpWithSupabase,
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
  users: User[];
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  switchUserRole: (userId: string | null) => void;
  switchDemoRole: (target: 'job_seeker' | 'employer' | 'admin' | string) => Promise<{
    success: boolean;
    user?: User;
    role?: UserRole;
    error?: string;
  }>;
  loginAs: (
    email: string,
    password?: string
  ) => Promise<{
    success: boolean;
    user?: User;
    isProfileCompleted?: boolean;
    seekerProfile?: JobSeekerProfile | null;
    employerProfile?: EmployerProfile | null;
    error?: string;
  }>;
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
    error?: string;
  };
  sendOtp: (identifier: string, channel?: 'email' | 'mobile' | string) => { success: boolean; code?: string; error?: string };
  verifyOtp: (identifier: string, code: string) => { success: boolean; error?: string };
  recoverPassword: (identifier: string, code: string, newPassword: string) => { success: boolean; error?: string };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OAUTH_INTENDED_ROLE_KEY = 'ehanap_oauth_intended_role';

function buildOAuthUserAndProfile(
  oauthUser: any,
  intendedRole: UserRole
): {
  newUser: User;
  employerProfile?: EmployerProfile;
  seekerProfile?: JobSeekerProfile;
  profileTable: typeof SUPABASE_TABLES.EMPLOYERS | typeof SUPABASE_TABLES.JOB_SEEKERS;
} {
  const email = (oauthUser.email || '').toLowerCase().trim();
  const metadata = oauthUser.user_metadata || {};
  const name = metadata.full_name || metadata.name || oauthUser.displayName || email.split('@')[0];
  const rawId = oauthUser.id ? String(oauthUser.id) : '';
  const newUserId = rawId && !rawId.startsWith('offline-') ? rawId : `user-${Date.now()}`;
  const avatarUrl = metadata.avatar_url || oauthUser.photoURL || undefined;
  const resolvedRole: 'employer' | 'job_seeker' = intendedRole === 'employer' ? 'employer' : 'job_seeker';

  clearProfileCompletedInStorage([newUserId, email], resolvedRole);

  const newUser: User = {
    id: newUserId,
    email,
    name,
    role: resolvedRole,
    isAccountVerified: true,
    isProfileCompleted: false,
    createdAt: new Date().toISOString(),
    avatar: avatarUrl,
  };

  if (resolvedRole === 'employer') {
    const employerProfile: EmployerProfile = {
      id: `emp-${Date.now()}`,
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

    const existingEmployers = storageAdapter.getStoredEmployers(INITIAL_EMPLOYERS);
    if (!existingEmployers.some((e) => e.userId === newUserId || e.email?.toLowerCase() === email)) {
      storageAdapter.setStoredEmployers([...existingEmployers, employerProfile]);
    }

    return { newUser, employerProfile, profileTable: SUPABASE_TABLES.EMPLOYERS };
  }

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Job';
  const lastName = nameParts.slice(1).join(' ') || 'Seeker';

  const seekerProfile: JobSeekerProfile = {
    id: `seeker-${Date.now()}`,
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

  const existingSeekers = storageAdapter.getStoredJobSeekers(INITIAL_JOB_SEEKERS);
  if (!existingSeekers.some((s) => s.userId === newUserId || s.email?.toLowerCase() === email)) {
    storageAdapter.setStoredJobSeekers([...existingSeekers, seekerProfile]);
  }

  return { newUser, seekerProfile, profileTable: SUPABASE_TABLES.JOB_SEEKERS };
}

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
  const usersRef = useRef<User[]>(users);
  usersRef.current = users;

  // Sync users state to storageAdapter
  useEffect(() => {
    if (users && users.length > 0) {
      storageAdapter.setStoredUsers(users);
    }
  }, [users]);

  // Realtime Supabase auth state listener & users table subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    let unsubs: Array<() => void> = [];

    async function initSupabaseAuth() {
      try {
        const conn = await testSupabaseConnection();
        if (conn.connected && isMounted) {
          setIsSupabaseConnected(true);

          const authSub = onSupabaseAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            if (event === 'SIGNED_OUT' || !session?.user?.email) {
              if (event === 'SIGNED_OUT') setCurrentUser(null);
              return;
            }

            const sessionEmail = session.user.email.toLowerCase().trim();
            const storedUsers = storageAdapter.getStoredUsers([]);
            let match =
              usersRef.current.find((u) => u.email.toLowerCase() === sessionEmail) ||
              storedUsers.find((u) => u.email?.toLowerCase() === sessionEmail) ||
              null;

            if (!match) {
              match = await fetchUserByEmail(sessionEmail);
            }

            const intendedRoleRaw = storageAdapter.getItem<string | null>(OAUTH_INTENDED_ROLE_KEY, null);
            if (intendedRoleRaw) {
              storageAdapter.removeItem(OAUTH_INTENDED_ROLE_KEY);
            }

            if (!isMounted) return;

            if (match) {
              const completed = Boolean(
                match.isProfileCompleted ||
                  (match.role === 'employer'
                    ? storageAdapter.isEmployerCompletedInStorage(match.id) ||
                      storageAdapter.isEmployerCompletedInStorage(sessionEmail)
                    : storageAdapter.isProfileCompletedInStorage(match.id) ||
                      storageAdapter.isProfileCompletedInStorage(sessionEmail))
              );
              const hydratedUser: User = { ...match, isProfileCompleted: completed };
              setUsers((prev) => {
                const map = new Map<string, User>();
                prev.forEach((u) => map.set(u.id, u));
                map.set(hydratedUser.id, hydratedUser);
                return Array.from(map.values());
              });
              setCurrentUser(hydratedUser);
              return;
            }

            // Brand-new OAuth user after Google redirect: provision User + profile using intended role
            const intendedRole: UserRole = intendedRoleRaw === 'employer' ? 'employer' : 'job_seeker';
            const { newUser, employerProfile, seekerProfile, profileTable } = buildOAuthUserAndProfile(
              session.user,
              intendedRole
            );

            setUsers((prev) => {
              if (prev.some((u) => u.email.toLowerCase() === sessionEmail)) return prev;
              return [...prev, newUser];
            });
            setCurrentUser(newUser);

            // Insert users row before profile row so RLS current_app_user_id() resolves
            await saveRecord(SUPABASE_TABLES.USERS, newUser);
            const profileRecord = employerProfile || seekerProfile;
            if (profileRecord) {
              await saveRecord(profileTable, profileRecord);
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
      isMounted = false;
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
    async (email: string, password?: string) => {
      const cleanEmail = email.toLowerCase().trim();
      const supabaseConfigured = isSupabaseConfigured();

      if (!password) {
        return { success: false, error: 'Please enter your password.' };
      }

      let found: (User & { password?: string }) | undefined = users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

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

      if (supabaseConfigured) {
        const authRes = await signInWithSupabase(cleanEmail, password);
        if (!authRes.success) {
          return { success: false, error: authRes.error || 'Incorrect email or password. Please try again.' };
        }

        if (!found) {
          const dbUser = await fetchUserByEmail(cleanEmail);
          if (dbUser) {
            found = dbUser;
          } else if (authRes.user) {
            const meta = authRes.user.user_metadata || {};
            const resolvedRole: UserRole =
              meta.role === 'employer' || meta.role === 'admin' ? meta.role : 'job_seeker';
            found = {
              id: authRes.user.id || `user-${Date.now()}`,
              email: cleanEmail,
              name: meta.full_name || meta.name || cleanEmail.split('@')[0],
              role: resolvedRole,
              avatar: meta.avatar_url,
              isAccountVerified: true,
              createdAt: authRes.user.created_at || new Date().toISOString(),
            };
          }
          if (found) {
            const hydrated = found;
            setUsers((prev) => {
              const map = new Map<string, User>();
              prev.forEach((u) => map.set(u.id, u));
              map.set(hydrated.id, hydrated);
              return Array.from(map.values());
            });
          }
        }

        if (!found) {
          return {
            success: false,
            error: 'No account found with this email address. Please register for an account.',
          };
        }
      } else {
        // Offline-only demo fallback
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
            };
            setUsers((prev) => [found!, ...prev]);
          }
        }

        if (!found) {
          return {
            success: false,
            error: 'No account found with this email address. Please register for an account.',
          };
        }

        if (!found.password || found.password !== password) {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
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

      const authenticatedUser: User = {
        ...found,
        isProfileCompleted:
          found.role === 'job_seeker'
            ? isSeekerProfileCompleted
            : found.role === 'employer'
            ? isEmployerProfileCompleted
            : found.isProfileCompleted,
      };

      if (authenticatedUser.role === 'job_seeker' && isSeekerProfileCompleted) {
        markProfileCompletedInStorage([authenticatedUser.id, cleanEmail], 'job_seeker');
      } else if (authenticatedUser.role === 'employer' && isEmployerProfileCompleted) {
        markProfileCompletedInStorage([authenticatedUser.id, cleanEmail], 'employer');
      }

      setCurrentUser(authenticatedUser);

      return {
        success: true,
        user: authenticatedUser,
        isProfileCompleted:
          authenticatedUser.role === 'job_seeker'
            ? isSeekerProfileCompleted
            : authenticatedUser.role === 'employer'
            ? isEmployerProfileCompleted
            : true,
        seekerProfile: matchingSeeker,
        employerProfile: matchingEmployer,
      };
    },
    [users]
  );

  const switchDemoRole = useCallback(
    async (target: 'job_seeker' | 'employer' | 'admin' | string) => {
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

      const res = await loginAs(email, 'password123');
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
          storageAdapter.setItem(OAUTH_INTENDED_ROLE_KEY, intendedRole);
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
          const { newUser, employerProfile, seekerProfile, profileTable } = buildOAuthUserAndProfile(
            googleUser,
            intendedRole
          );

          setUsers((prev) => [...prev, newUser]);
          setCurrentUser(newUser);

          if (isSupabaseConfigured()) {
            await saveRecord(SUPABASE_TABLES.USERS, newUser);
            const profileRecord = employerProfile || seekerProfile;
            if (profileRecord) {
              await saveRecord(profileTable, profileRecord);
            }
          }

          return {
            success: true,
            isNewUser: true,
            isProfileCompleted: false,
            user: newUser,
            employerProfile,
            seekerProfile,
          };
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

      if (stored && stored.code === code.trim() && Date.now() <= stored.expiresAt) {
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
            const { password: _pw, ...userForDb } = updatedUser as User & { password?: string };
            saveRecord(SUPABASE_TABLES.USERS, userForDb).catch(() => {});
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
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const cleanId = identifier.trim().toLowerCase();
      const user = users.find(
        (u) => u.email.toLowerCase() === cleanId || (u.phone && u.phone.includes(cleanId))
      );
      if (!user) {
        return { success: false, error: 'No account found with this email or mobile number.' };
      }

      const verification = verifyOtp(identifier, code);
      if (!verification.success) {
        return verification;
      }

      const updatedUser = {
        ...user,
        password: newPassword,
        isAccountVerified: true,
      } as User & { password?: string };

      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

      return { success: true };
    },
    [users, verifyOtp]
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

      const { password: _pw, ...userForDb } = newUser as User & { password?: string };
      setUsers((prev) => [...prev, newUser]);

      let profileToSave: JobSeekerProfile | EmployerProfile | null = null;
      let profileTable: typeof SUPABASE_TABLES.JOB_SEEKERS | typeof SUPABASE_TABLES.EMPLOYERS | null = null;

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
        profileToSave = newSeeker;
        profileTable = SUPABASE_TABLES.JOB_SEEKERS;
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

        const existingEmployers = storageAdapter.getStoredEmployers(INITIAL_EMPLOYERS);
        storageAdapter.setStoredEmployers([...existingEmployers, newEmp]);
        profileToSave = newEmp;
        profileTable = SUPABASE_TABLES.EMPLOYERS;
      }

      if (isSupabaseConfigured()) {
        signUpWithSupabase(cleanRegEmail, extraProfile?.password, {
          name: userData.name,
          role: userData.role,
        })
          .then(async (authRes) => {
            if (!authRes.success) {
              console.warn('[AuthContext] Supabase Auth signUp warning:', authRes.error);
              return;
            }
            await saveRecord(SUPABASE_TABLES.USERS, userForDb);
            if (profileToSave && profileTable) {
              await saveRecord(profileTable, profileToSave);
            }
          })
          .catch((err) => {
            console.warn('[AuthContext] Supabase registration sync warning:', err);
          });
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
