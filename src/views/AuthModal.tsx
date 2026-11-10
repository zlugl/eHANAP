import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { isProfileComplete } from '../utils/routeGuards';
import { 
  X, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  UserCheck,
  Sparkles,
  Building2,
  Users,
  Shield,
  Briefcase,
  Layers,
  GraduationCap,
  Store,
  ShoppingBag,
  Sprout,
  Cpu,
  Zap,
  Key
} from 'lucide-react';
import { DEMO_ACCOUNTS, DemoAccountMeta } from '../data/demoAccounts';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  initialRole?: 'job_seeker' | 'employer' | 'admin';
  initialShowSplash?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSuccessRole?: (role: string, user?: any, isProfileCompleted?: boolean) => void;
}

// 1. Apple Icon
const AppleIcon = () => (
  <svg className="w-5 h-5 fill-current text-[var(--color-ink)]" viewBox="0 0 170 170" aria-hidden="true">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.44-6.1-9.35-10.82-20.02-14.15-32.01-3.33-11.99-5-23.49-5-34.5 0-14.36 3.75-26.68 11.24-36.96 7.5-10.29 17.2-15.52 29.11-15.71 4.58 0 9.87 1.25 15.87 3.75 6 2.5 10.15 3.79 12.46 3.87 1.91-.12 6.16-1.42 12.76-3.88 6.6-2.46 12.01-3.6 16.24-3.43 13.43.51 24.23 5.43 32.4 14.76-11.75 7.12-17.51 16.9-17.29 29.34.22 9.68 4.04 17.84 11.47 24.49 7.42 6.65 16.14 10.51 26.15 11.58-2.24 6.74-4.82 13.53-7.75 20.36zM119.22 31.84c0-7.72 2.76-14.99 8.28-21.81 5.53-6.82 12.39-10.74 20.59-11.76.13 1.01.2 1.91.2 2.7 0 7.6-2.85 15.01-8.56 22.23-5.71 7.22-12.82 11.29-21.32 12.2-.14-1.22-.2-2.41-.2-3.56z" />
  </svg>
);

// 2. Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// 3. Facebook Icon
const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current text-[var(--color-ink)]" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  initialRole = 'job_seeker',
  initialShowSplash = false,
  onClose,
  onSuccess,
  onSuccessRole
}) => {
  const { 
    loginAs, 
    registerUser, 
    continueWithGoogle, 
    showToast,
    sendOtp,
    verifyOtp,
    recoverPassword 
  } = useApp();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'job_seeker' | 'employer' | 'admin'>(initialRole);
  const [isSplashScreen, setIsSplashScreen] = useState<boolean>(initialShowSplash ?? false);

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Create Account State
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'done'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

  const handleSelectRole = (newRole: 'job_seeker' | 'employer' | 'admin') => {
    setRole(newRole);
    setErrorMessage('');
    if (newRole === 'admin') {
      setLoginEmail('peso.admin@roxas.gov.ph');
      setLoginPassword('password123');
    }
  };

  const handleFillDemoAccount = (account: DemoAccountMeta) => {
    setSelectedDemoId(account.id);
    setRole(account.role);
    setLoginEmail(account.email);
    setLoginPassword(account.password);
    setErrorMessage('');
    showToast({
      title: `${account.roleLabel} Selected`,
      message: `Credentials loaded for ${account.name} (${account.email}).`,
      type: 'info'
    });
  };

  const handleDirectDemoSignIn = (account: DemoAccountMeta) => {
    setSelectedDemoId(account.id);
    setRole(account.role);
    setLoginEmail(account.email);
    setLoginPassword(account.password);
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginAs(account.email, account.password);
      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Failed to sign in with demo credentials.');
        return;
      }

      if (onSuccessRole) onSuccessRole(res.user.role, res.user, res.isProfileCompleted);
      if (onSuccess) onSuccess();
      onClose();
    }, 200);
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole(initialRole);
      setIsSplashScreen(initialShowSplash ?? false);
      setErrorMessage('');
      setSuccessMessage('');
      setShowPassword(false);
      setShowForgotPassword(false);
      setIsOtpStep(false);
      setIsLoading(false);
      setLoginEmail('');
      setLoginPassword('');
    }
  }, [isOpen, initialMode, initialRole, initialShowSplash]);

  // Lock root document and body scroll when AuthModal is open so the background window doesn't scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Submit Sign In
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your registered email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginAs(loginEmail.trim().toLowerCase(), loginPassword);
      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Invalid email or password. Please try again.');
        return;
      }

      onClose();
      if (onSuccessRole) onSuccessRole(res.user.role, res.user, res.isProfileCompleted);
      else if (onSuccess) onSuccess();
    }, 350);
  };

  // 2. Submit Create Account (Sign Up)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree with the Terms & Conditions to proceed.');
      return;
    }
    if (role === 'admin') {
      setErrorMessage('The LGU/PESO municipal oversight is operated by a single designated administrator account (peso.admin@roxas.gov.ph). Public creation of additional administrative accounts is disabled.');
      return;
    }

    setIsLoading(true);

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Roxas';

    const userData = {
      email: regEmail.trim().toLowerCase(),
      name: name.trim(),
      role: role
    };

    const extraProfile = role === 'employer' ? {
      companyName: name.trim(),
      representativeName: 'HR Representative',
      contactNumber: '0917-000-0000',
      municipality: 'Roxas',
      barangay: 'Bagumbayan',
      industry: 'General Enterprise',
      password: regPassword
    } : role === 'admin' ? {
      department: 'PESO Roxas Employment Facilitation',
      designation: 'PESO Officer / Municipal Staff',
      office: 'Municipal Hall, Roxas, Oriental Mindoro',
      password: regPassword
    } : {
      firstName,
      lastName,
      dateOfBirth: '2000-01-01',
      contactNumber: '0917-000-0000',
      municipality: 'Roxas',
      barangay: 'Bagumbayan',
      password: regPassword
    };

    const result = registerUser(userData, extraProfile);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Registration failed. Please check your information.');
      return;
    }

    // Dispatch verification OTP
    const otpRes = sendOtp(regEmail.trim().toLowerCase(), 'email');
    if (otpRes.code) setDemoOtpCode(otpRes.code);
    setIsOtpStep(true);

    showToast({
      title: 'Verification Code Dispatched',
      message: `A 6-digit OTP code was sent to ${regEmail.trim()}.`,
      type: 'status'
    });
  };

  // 3. Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    const res = verifyOtp(regEmail.trim().toLowerCase(), otpCode.trim());
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid verification code.');
      return;
    }

    const loginRes = loginAs(regEmail.trim().toLowerCase(), regPassword);

    onClose();
    // Every newly registered account must complete profile setup
    if (onSuccessRole) onSuccessRole(role, loginRes?.user, false);
    else if (onSuccess) onSuccess();
  };

  // 4. Social Auth (Google / Apple / Facebook)
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await continueWithGoogle(role === 'admin' ? 'job_seeker' : role);
      setIsLoading(false);
      if (!res.success || !res.user) {
        if (res.error && !res.error.includes('closed') && !res.error.includes('cancelled')) {
          setErrorMessage(res.error);
        }
        return;
      }
      onClose();
      // If brand new Google account, they must set up their profile
      const isCompleted = res.isNewUser ? false : Boolean(
        res.isProfileCompleted ?? isProfileComplete(res.user, res.user.role === 'job_seeker' ? res.seekerProfile : res.employerProfile)
      );
      if (onSuccessRole) onSuccessRole(res.user.role, res.user, isCompleted);
      else if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google authentication failed.');
    }
  };

  const handleSocialQuickSignIn = (provider: 'Apple' | 'Facebook') => {
    showToast({
      title: `${provider} Sign In`,
      message: `Connecting via ${provider}... Authenticating account.`,
      type: 'info'
    });
    // Log in with role-appropriate default verified account
    setTimeout(() => {
      if (role === 'admin') {
        loginAs('peso.admin@roxas.gov.ph');
        onClose();
        if (onSuccessRole) onSuccessRole('admin');
        else if (onSuccess) onSuccess();
      } else if (role === 'employer') {
        loginAs('hr@mindoroharvest.ph');
        onClose();
        if (onSuccessRole) onSuccessRole('employer');
        else if (onSuccess) onSuccess();
      } else {
        loginAs('maria.santos@gmail.com');
        onClose();
        if (onSuccessRole) onSuccessRole('job_seeker');
        else if (onSuccess) onSuccess();
      }
    }, 400);
  };

  // 5. Password Recovery
  const handleRequestPasswordOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email.');
      return;
    }
    const res = sendOtp(forgotEmail.trim().toLowerCase(), 'email');
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to dispatch recovery code.');
      return;
    }
    if (res.code) setDemoOtpCode(res.code);
    setForgotStep('verify');
    showToast({
      title: 'Recovery Code Dispatched',
      message: `Verification code dispatched to ${forgotEmail.trim()}.`,
      type: 'status'
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    const res = recoverPassword(forgotEmail.trim().toLowerCase(), newPassword, forgotOtp.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Password reset failed. Please check your OTP code.');
      return;
    }
    setForgotStep('done');
    showToast({
      title: 'Password Updated',
      message: 'Your password has been changed. You can now sign in.',
      type: 'match'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-paper)] text-[var(--color-ink)] overflow-y-auto [scrollbar-color:var(--color-muted)_var(--color-paper)] motion-safe:animate-in motion-safe:fade-in duration-150 select-none">
      <div className="min-h-screen bg-[var(--color-paper)] flex flex-col justify-start py-4 sm:py-8 px-4">
        
        {/* Full Window Container */}
        <div className="max-w-sm sm:max-w-md mx-auto w-full space-y-6">

          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between py-1">
            {isSplashScreen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] text-[var(--color-ink)] text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                <span>PESO Roxas, Oriental Mindoro</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsSplashScreen(true)}
                className="btn btn--quiet text-xs font-medium px-3 py-1.5 rounded-xl border border-[var(--color-rule)] transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85 disabled:opacity-50"
                title="View E-Hanap Splash Intro"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>About E-Hanap</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper)] flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

        {/* ======================================================== */}
        {/* CASE 0: SPLASH SCREEN                                    */}
        {/* ======================================================== */}
        {isSplashScreen ? (
          <div className="space-y-6 text-center motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* E-Hanap Brand Emblem & Animated Logo */}
            <div className="pt-2 flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-2xl bg-[var(--color-ink)] text-[var(--color-paper)] p-1.5 ring-4 ring-[var(--color-rule)] flex items-center justify-center mb-4">
                <div className="w-full h-full rounded-xl border border-[var(--color-rule)]/40 flex flex-col items-center justify-center">
                  <Briefcase className="w-7 h-7 text-[var(--color-paper)] stroke-[2]" aria-hidden="true" />
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                    <span className="text-[10px] text-[var(--color-accent)] font-semibold">PESO</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] font-display">
                    eHANAP
                  </h1>
                  <span className="bg-[var(--color-accent)] text-[var(--color-paper-contrast)] text-[10px] font-medium px-2 py-0.5 rounded">
                    Cloud
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  Municipal Public Employment Service Office
                </p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Roxas, Oriental Mindoro • Region IV-B MIMAROPA
                </p>
              </div>

              <p className="text-xs text-[var(--color-ink-muted)] max-w-xs mt-3 leading-relaxed">
                Localized, Decision Tree-based cloud system for intelligent employment matching & facilitation.
              </p>
            </div>

            {/* Core Badges */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="bg-[var(--color-paper-warm)] p-2.5 rounded-xl border border-[var(--color-rule)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--color-ink)] block leading-tight">RA 8759 Compliant</span>
                <span className="text-[9px] text-[var(--color-ink-muted)]">PESO Act of 1999</span>
              </div>
              <div className="bg-[var(--color-paper-warm)] p-2.5 rounded-xl border border-[var(--color-rule)]">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)] mx-auto mb-1" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--color-ink)] block leading-tight">Decision Tree</span>
                <span className="text-[9px] text-[var(--color-ink-muted)]">Match Engine</span>
              </div>
              <div className="bg-[var(--color-paper-warm)] p-2.5 rounded-xl border border-[var(--color-rule)]">
                <Building2 className="w-4 h-4 text-[var(--color-ink-muted)] mx-auto mb-1" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--color-ink)] block leading-tight">Zero Fees</span>
                <span className="text-[9px] text-[var(--color-ink-muted)]">Free LGU Service</span>
              </div>
            </div>

            {/* Role Selection on Splash Screen */}
            <div className="space-y-2.5 text-left pt-1">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] text-center">
                Select your user role to enter:
              </p>

              {/* 1. Job Seeker Option */}
              <button
                type="button"
                onClick={() => {
                  handleSelectRole('job_seeker');
                  setIsSplashScreen(false);
                  setMode('login');
                }}
                className="w-full p-3.5 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] active:opacity-85 rounded-xl border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-paper-warm)] text-[var(--color-accent)] flex items-center justify-center font-bold shrink-0">
                    <Users className="w-5 h-5 text-[var(--color-accent)]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                      Job Seeker
                    </h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-tight">
                      College Graduates, High School Graduates & OSY
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>

              {/* 2. Employer Option */}
              <button
                type="button"
                onClick={() => {
                  handleSelectRole('employer');
                  setIsSplashScreen(false);
                  setMode('login');
                }}
                className="w-full p-3.5 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] active:opacity-85 rounded-xl border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-paper-warm)] text-[var(--color-ink)] flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5 text-[var(--color-ink)]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                      Local Employer
                    </h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-tight">
                      Establishments, Recruiters & Business Owners
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>

              {/* 3. PESO Admin Option */}
              <button
                type="button"
                onClick={() => {
                  handleSelectRole('admin');
                  setIsSplashScreen(false);
                  setMode('login');
                }}
                className="w-full p-3.5 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] active:opacity-85 rounded-xl border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-paper-warm)] text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                      PESO Administrator
                    </h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-tight">
                      Municipal Public Employment Service Office Staff
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>
            </div>

            {/* General Primary Transition Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSplashScreen(false)}
                className="btn btn--primary w-full py-3.5 text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50"
              >
                <span>Continue to Role-Based Sign In</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : showForgotPassword ? (
          <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setForgotStep('request'); setErrorMessage(''); }}
                className="w-9 h-9 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <h2 className="text-xl font-bold text-[var(--color-ink)] font-display">Forgot Password</h2>
            </div>

            {forgotStep === 'request' && (
              <form onSubmit={handleRequestPasswordOtp} className="space-y-4">
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Enter your registered email address to receive a secure password recovery code.
                </p>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Send Recovery Code
                </button>
              </form>
            )}

            {forgotStep === 'verify' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Enter the 6-digit code sent to <strong className="text-[var(--color-ink)]">{forgotEmail}</strong> and your new password.
                </p>
                {demoOtpCode && (
                  <div className="p-2.5 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl text-[11px] text-[var(--color-ink)]">
                    Test Code: <strong className="font-mono tabular-nums">{demoOtpCode}</strong>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-center text-base font-mono tabular-nums font-bold text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Update Password
                </button>
              </form>
            )}

            {forgotStep === 'done' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-ink)] font-display">Password Reset Successful</h3>
                <p className="text-xs text-[var(--color-ink-muted)]">You can now sign in using your new credentials.</p>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setMode('login'); }}
                  className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold cursor-pointer transition-colors active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        ) : isOtpStep ? (

        /* ======================================================== */
        /* CASE 2: REGISTRATION OTP VERIFICATION                   */
        /* ======================================================== */
          <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-[var(--color-ink)] font-display tracking-tight">Verify Email</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                A verification code was sent to <strong className="text-[var(--color-ink)]">{regEmail}</strong>
              </p>
            </div>

            {demoOtpCode && (
              <div className="p-3 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl text-center text-xs text-[var(--color-ink)]">
                <span>Verification Code: </span>
                <strong className="font-mono tabular-nums font-bold">{demoOtpCode}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1.5 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl py-3 text-center text-xl font-bold font-mono tabular-nums text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold transition-colors cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <p className="text-center text-xs text-[var(--color-ink-muted)]">
              Didn’t receive code?{' '}
              <button
                type="button"
                onClick={() => {
                  const res = sendOtp(regEmail, 'email');
                  if (res.code) setDemoOtpCode(res.code);
                  showToast({ title: 'New Code Sent', message: 'Check your email inbox.', type: 'info' });
                }}
                className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                Resend Code
              </button>
            </p>
          </div>
        ) : mode === 'login' ? (

        /* ======================================================== */
        /* CASE 3: SIGN IN SCREEN WITH ROLE TOGGLE                  */
        /* ======================================================== */
          <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
            
            {/* Header: Title + Subtitle */}
            <div className="text-center space-y-1 pt-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                Sign In
              </h1>
              <p className="text-xs text-[var(--color-ink-muted)] font-normal">
                Municipal PESO Roxas • Select your user role to proceed
              </p>
            </div>

            {/* Clear toggle / selection for user role */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-[var(--color-ink)]">Choose User Role:</span>
                <span className="text-[11px] font-medium text-[var(--color-accent)]">
                  {role === 'job_seeker' ? 'Candidate Access' : role === 'employer' ? 'Recruiter Access' : 'LGU Office Access'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[var(--color-paper-warm)] p-1.5 rounded-xl border border-[var(--color-rule)]">
                {/* 1. Job Seeker */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('job_seeker')}
                  className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                    role === 'job_seeker'
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold leading-tight">Job Seeker</span>
                  <span className={`text-[9px] font-normal leading-none ${role === 'job_seeker' ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'}`}>
                    College/HS/OSY
                  </span>
                </button>

                {/* 2. Employer */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('employer')}
                  className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                    role === 'employer'
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold leading-tight">Employer</span>
                  <span className={`text-[9px] font-normal leading-none ${role === 'employer' ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'}`}>
                    Local Hiring
                  </span>
                </button>

                {/* 3. PESO Admin */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('admin')}
                  className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                    role === 'admin'
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold leading-tight">PESO Admin</span>
                  <span className={`text-[9px] font-normal leading-none ${role === 'admin' ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'}`}>
                    Single Account
                  </span>
                </button>
              </div>

              {/* Dynamic Role Mission Helper */}
              <div className="p-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-xs flex items-start gap-2.5 text-[var(--color-ink)]">
                {role === 'job_seeker' && <GraduationCap className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden="true" />}
                {role === 'employer' && <Building2 className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden="true" />}
                {role === 'admin' && <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />}
                <div className="leading-snug">
                  <p className="font-semibold text-[11px]">
                    {role === 'job_seeker'
                      ? 'Accessible for College Grads, High School Grads & OSY'
                      : role === 'employer'
                      ? 'Roxas Accredited Establishment Portal'
                      : 'Single Designated LGU/PESO Administrator Account'}
                  </p>
                  <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
                    {role === 'job_seeker'
                      ? 'Access Decision Tree match badges, PESO verified vacancies, and ATS resume audits.'
                      : role === 'employer'
                      ? 'Post open vacancies, review ranked candidate profiles, and submit compliance files.'
                      : 'Dedicated municipal oversight portal for Roxas: Monitor vacancies, audit employer accreditations, and issue official Referral Slips.'}
                  </p>
                </div>
              </div>
            </div>

            {/* PRE-CONFIGURED DEMO ACCOUNTS PICKER */}
            <div className="bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink)]">
                  <Key className="w-3.5 h-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                  <span>Demo Accounts for Testing</span>
                </div>
                <span className="text-[10px] text-[var(--color-ink-muted)] font-medium bg-[var(--color-paper)] border border-[var(--color-rule)] px-2 py-0.5 rounded-md">
                  Password: <code className="text-[var(--color-accent)] font-semibold font-mono">password123</code>
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-ink-muted)] leading-normal">
                Select a job seeker, local Roxas employer, or the PESO municipal admin to auto-fill credentials and test role features:
              </p>

              {/* 1-Column List of Demo Accounts */}
              <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = selectedDemoId === acc.id || loginEmail === acc.email;
                  const isMatchRole = acc.role === role;

                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border text-left transition-colors relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[var(--color-paper)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                          : isMatchRole
                          ? 'bg-[var(--color-paper)] border-[var(--color-rule)] hover:border-[var(--color-ink-muted)]'
                          : 'bg-[var(--color-paper)]/70 border-[var(--color-rule)]/80 opacity-90 hover:opacity-100 hover:bg-[var(--color-paper)]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                            acc.badgeColor === 'amber'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : acc.badgeColor === 'emerald'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : acc.badgeColor === 'purple'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-[var(--color-paper-warm)] text-[var(--color-ink)] border-[var(--color-rule)]'
                          }`}>
                            {acc.badge}
                          </span>
                          <span className="text-[10px] font-medium text-[var(--color-ink-muted)] capitalize">
                            {acc.role === 'admin' ? 'PESO Admin' : 'Employer'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[var(--color-ink)] mt-1 truncate">
                          {acc.name}
                        </h4>
                        <p className="text-[10px] text-[var(--color-ink-muted)] truncate font-mono">
                          {acc.email}
                        </p>

                        {/* Sample Vacancies / Focus */}
                        {acc.sampleVacancies && acc.sampleVacancies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {acc.sampleVacancies.map((v, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-medium bg-[var(--color-paper-warm)] text-[var(--color-ink)] px-1.5 py-0.5 rounded border border-[var(--color-rule)] truncate max-w-full"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[var(--color-rule)] sm:pl-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFillDemoAccount(acc)}
                          className="flex-1 sm:w-28 py-1.5 px-2 text-[10px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-lg transition-colors cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                        >
                          Fill Form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirectDemoSignIn(acc)}
                          className="btn btn--primary flex-1 sm:w-28 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                        >
                          <Zap className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                          <span>1-Click Sign In</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              
              {/* Field 1: Email */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotStep('request'); setForgotEmail(loginEmail); }}
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Action Button: Sign In as Role */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn--primary w-full py-3.5 text-sm sm:text-base rounded-xl font-bold transition-colors text-center cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {isLoading
                    ? 'Authenticating...'
                    : `Sign In as ${role === 'job_seeker' ? 'Job Seeker' : role === 'employer' ? 'Employer' : 'PESO Admin'}`}
                </button>
              </div>

            </form>

            {/* Divider: Or sign in with */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-[var(--color-rule)] w-full" />
              <span className="bg-[var(--color-paper)] px-3 text-xs text-[var(--color-ink-muted)] font-normal absolute">
                Or sign in with
              </span>
            </div>

            {/* Social Logins: Apple, Google, Facebook */}
            <div className="flex items-center justify-center gap-4 pt-1">
              {/* Apple */}
              <button
                type="button"
                onClick={() => handleSocialQuickSignIn('Apple')}
                className="w-12 h-12 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] transition-colors active:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                title="Sign in with Apple"
              >
                <AppleIcon />
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-12 h-12 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] transition-colors active:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                title="Sign in with Google"
              >
                <GoogleIcon />
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleSocialQuickSignIn('Facebook')}
                className="w-12 h-12 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] transition-colors active:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                title="Sign in with Facebook"
              >
                <FacebookIcon />
              </button>
            </div>

            {/* Footer Switch Link: Don't have an account? Sign Up */}
            <p className="text-center text-xs sm:text-sm text-[var(--color-ink-muted)] font-normal pt-2">
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); }}
                className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer ml-0.5 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                Sign Up
              </button>
            </p>

          </div>
        ) : (

        /* ======================================================== */
        /* CASE 4: CREATE ACCOUNT SCREEN                            */
        /* ======================================================== */
          <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
            
            {/* Header: Title + Subtitle */}
            <div className="text-center space-y-1.5 pt-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] font-normal max-w-xs mx-auto leading-normal">
                Fill your information below or register with your social account.
              </p>
            </div>

            {/* Role selector (Job Seeker vs Employer) */}
            <div className="bg-[var(--color-paper-warm)] p-1 rounded-xl flex gap-1 border border-[var(--color-rule)]">
              <button
                type="button"
                onClick={() => setRole('job_seeker')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                  role === 'job_seeker' ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                  role === 'employer' ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                Employer
              </button>
            </div>

            {/* Official LGU Single Admin Notice */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="leading-tight">
                <span className="font-bold">LGU/PESO Official Notice:</span>
                <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
                  Municipal employment monitoring is restricted to a single designated administrator account (<code className="text-amber-800 font-bold font-mono">peso.admin@roxas.gov.ph</code>). Additional administrative registrations are disabled.
                </p>
              </div>
            </div>

            {/* Create Account Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                  Name
                </label>
                <input
                  type="text"
                  placeholder={
                    role === 'employer' 
                      ? 'Company Name (e.g. Roxas Tech Corp)' 
                      : 'John Doe'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              {/* Field 2: Email */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                />
              </div>

              {/* Field 3: Password */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] ${
                    agreeTerms ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]' : 'border border-[var(--color-rule)] bg-[var(--color-paper)]'
                  }`}
                  aria-label="Agree with Terms & Condition"
                >
                  {agreeTerms && <Check className="w-3.5 h-3.5 text-white stroke-[3]" aria-hidden="true" />}
                </button>
                <span className="text-xs sm:text-sm text-[var(--color-ink-muted)]">
                  Agree with{' '}
                  <span className="text-[var(--color-accent)] font-medium underline cursor-pointer">
                    Terms & Condition
                  </span>
                </span>
              </div>

              {/* Primary Action Button: Sign Up */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn--primary w-full py-3.5 text-sm sm:text-base rounded-xl font-bold transition-colors text-center cursor-pointer active:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>

            </form>

            {/* Divider: Or sign up with */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-[var(--color-rule)] w-full" />
              <span className="bg-[var(--color-paper)] px-3 text-xs text-[var(--color-ink-muted)] font-normal absolute">
                Or sign up with
              </span>
            </div>

            {/* Social Logins: Apple, Google, Facebook */}
            <div className="flex items-center justify-center gap-4 pt-1">
              {/* Apple */}
              <button
                type="button"
                onClick={() => handleSocialQuickSignIn('Apple')}
                className="w-12 h-12 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] transition-colors active:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                title="Sign up with Apple"
              >
                <AppleIcon />
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-12 h-12 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] transition-colors active:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                title="Sign up with Google"
              >
                <GoogleIcon />
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleSocialQuickSignIn('Facebook')}
                className="w-12 h-12 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] transition-colors active:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                title="Sign up with Facebook"
              >
                <FacebookIcon />
              </button>
            </div>

            {/* Footer Switch Link: Already have an account? Sign In */}
            <p className="text-center text-xs sm:text-sm text-[var(--color-ink-muted)] font-normal pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(''); }}
                className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer ml-0.5 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              >
                Sign In
              </button>
            </p>

          </div>
        )}

      </div>

    </div>
  </div>
  );
};
