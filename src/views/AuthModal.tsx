import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isProfileComplete } from '../utils/routeGuards';
import {
  X,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Shield,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  initialRole?: 'job_seeker' | 'employer' | 'admin';
  initialShowSplash?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSuccessRole?: (role: string, user?: any, isProfileCompleted?: boolean) => void;
}

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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  initialRole = 'job_seeker',
  initialShowSplash = false,
  onClose,
  onSuccess,
  onSuccessRole,
}) => {
  const {
    loginAs,
    registerUser,
    continueWithGoogle,
    sendOtp,
    verifyOtp,
    recoverPassword,
    hasAdminAccount,
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'job_seeker' | 'employer' | 'admin'>(initialRole);
  const [isSplashScreen, setIsSplashScreen] = useState<boolean>(initialShowSplash ?? false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
  const [generatedOtpCode, setGeneratedOtpCode] = useState('');

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'done'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSelectRole = (newRole: 'job_seeker' | 'employer' | 'admin') => {
    setRole(newRole);
    setErrorMessage('');
    if (newRole === 'admin' && !hasAdminAccount) {
      setMode('register');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialRole === 'admin' && !hasAdminAccount ? 'register' : initialMode);
      setRole(initialRole);
      setIsSplashScreen(initialShowSplash ?? false);
      setErrorMessage('');
      setShowPassword(false);
      setShowForgotPassword(false);
      setIsOtpStep(false);
      setIsLoading(false);
      setLoginEmail('');
      setLoginPassword('');
      setName('');
      setRegEmail('');
      setRegPassword('');
      setOtpCode('');
      setGeneratedOtpCode('');
    }
  }, [isOpen, initialMode, initialRole, initialShowSplash, hasAdminAccount]);

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
    }, 200);
  };

  // 2. Submit Create Account (Sign Up)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(
        role === 'employer'
          ? 'Please enter your company or establishment name.'
          : role === 'admin'
          ? 'Please enter the LGU/PESO Administrator name.'
          : 'Please enter your full name.'
      );
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
    if (role === 'admin' && hasAdminAccount) {
      setErrorMessage(
        'The official LGU/PESO Administrator account has already been initialized. Please sign in instead.'
      );
      return;
    }

    setIsLoading(true);

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData = {
      email: regEmail.trim().toLowerCase(),
      name: name.trim(),
      role: role,
      isAccountVerified: true,
    };

    const extraProfile =
      role === 'employer'
        ? {
            companyName: name.trim(),
            representativeName: '',
            contactNumber: '',
            municipality: '',
            barangay: '',
            industry: '',
            companyDescription: '',
            logoUrl: '',
            password: regPassword,
          }
        : role === 'admin'
        ? {
            department: 'PESO Roxas Employment Facilitation',
            designation: 'PESO Administrator / Municipal Staff',
            office: 'Municipal Hall, Roxas, Oriental Mindoro',
            password: regPassword,
          }
        : {
            firstName,
            lastName,
            dateOfBirth: '',
            contactNumber: '',
            municipality: '',
            barangay: '',
            educationalAttainment: '',
            primaryDegree: '',
            professionalSummary: '',
            profilePicture: '',
            password: regPassword,
          };

    const result = registerUser(userData, extraProfile);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Registration failed. Please check your information.');
      return;
    }

    // If LGU/PESO Admin initial setup, log straight into the Admin Dashboard
    if (role === 'admin') {
      showToast({
        title: 'LGU/PESO Admin Account Initialized',
        message: `Welcome ${result.user.name}! You can now manage employer verifications, walk-in applicants, and job matching.`,
        type: 'success',
      });
      onClose();
      if (onSuccessRole) onSuccessRole('admin', result.user, true);
      else if (onSuccess) onSuccess();
      return;
    }

    // For Job Seeker & Employer, proceed to profile setup wizard directly
    showToast({
      title: 'Account Created Successfully',
      message:
        role === 'job_seeker'
          ? 'Please upload your resume or complete your job seeker profile to begin matching.'
          : 'Please complete your establishment profile and upload verification documents for LGU/PESO review.',
      type: 'success',
    });

    onClose();
    if (onSuccessRole) onSuccessRole(role, result.user, false);
    else if (onSuccess) onSuccess();
  };

  // 3. Verify OTP (if OTP flow used)
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
    if (onSuccessRole) onSuccessRole(role, loginRes?.user, role === 'admin');
    else if (onSuccess) onSuccess();
  };

  // 4. Google Auth
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
      const isCompleted = res.isNewUser
        ? false
        : Boolean(
            res.isProfileCompleted ??
              isProfileComplete(
                res.user,
                res.user.role === 'job_seeker' ? res.seekerProfile : res.employerProfile
              )
          );
      if (onSuccessRole) onSuccessRole(res.user.role, res.user, isCompleted);
      else if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google authentication failed.');
    }
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
    if (res.code) setGeneratedOtpCode(res.code);
    setForgotStep('verify');
    showToast({
      title: 'Recovery Code Dispatched',
      message: `Verification code dispatched to ${forgotEmail.trim()}.`,
      type: 'status',
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
    const res = recoverPassword(forgotEmail.trim().toLowerCase(), forgotOtp.trim(), newPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Password reset failed. Please check your OTP code.');
      return;
    }
    setForgotStep('done');
    showToast({
      title: 'Password Updated',
      message: 'Your password has been changed. You can now sign in.',
      type: 'match',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-paper)] text-[var(--color-ink)] overflow-y-auto [scrollbar-color:var(--color-muted)_var(--color-paper)] motion-safe:animate-in motion-safe:fade-in duration-150 select-none">
      <div className="min-h-screen bg-[var(--color-paper)] flex flex-col justify-start py-4 sm:py-8 px-4">
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
                className="btn btn--quiet text-xs font-medium px-3 py-1.5 rounded-xl border border-[var(--color-rule)] transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] active:opacity-85"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>About eHANAP</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper)] flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors cursor-pointer"
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

              <div className="space-y-2.5 text-left pt-1">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] text-center">
                  Select your user role to enter:
                </p>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectRole('job_seeker');
                    setIsSplashScreen(false);
                    setMode('login');
                  }}
                  className="w-full p-3.5 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] rounded-xl border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group cursor-pointer"
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
                        Upload resume, auto-fill profile & apply to matched vacancies
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectRole('employer');
                    setIsSplashScreen(false);
                    setMode('login');
                  }}
                  className="w-full p-3.5 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] rounded-xl border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group cursor-pointer"
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
                        Submit PESO verification documents, post jobs & view ranked applicants
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectRole('admin');
                    setIsSplashScreen(false);
                    setMode(hasAdminAccount ? 'login' : 'register');
                  }}
                  className="w-full p-3.5 bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] rounded-xl border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-paper-warm)] text-amber-600 flex items-center justify-center font-bold shrink-0">
                      <ShieldCheck className="w-5 h-5 text-amber-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                        LGU / PESO Administrator
                      </h3>
                      <p className="text-[11px] text-[var(--color-ink-muted)] leading-tight">
                        {hasAdminAccount
                          ? 'Sign in to verify employers & manage walk-in bio-data'
                          : 'Initial setup: Register the official LGU/PESO Admin account'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : showForgotPassword ? (
            <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotStep('request');
                    setErrorMessage('');
                  }}
                  className="w-9 h-9 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center text-[var(--color-ink)] cursor-pointer"
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
                    Enter your registered email address to receive a password recovery code.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold cursor-pointer"
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
                  {generatedOtpCode && (
                    <div className="p-2.5 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl text-[11px] text-[var(--color-ink)]">
                      Verification Code: <strong className="font-mono tabular-nums">{generatedOtpCode}</strong>
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
                      className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-center text-base font-mono tabular-nums font-bold text-[var(--color-ink)]"
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
                      className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
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
                      className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold cursor-pointer"
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
                    onClick={() => {
                      setShowForgotPassword(false);
                      setMode('login');
                    }}
                    className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          ) : isOtpStep ? (
            <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-[var(--color-ink)] font-display tracking-tight">Verify Email</h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  A verification code was sent to <strong className="text-[var(--color-ink)]">{regEmail}</strong>
                </p>
              </div>

              {generatedOtpCode && (
                <div className="p-3 bg-[var(--color-paper-warm)] border border-[var(--color-rule)] rounded-xl text-center text-xs text-[var(--color-ink)]">
                  <span>Verification Code: </span>
                  <strong className="font-mono tabular-nums font-bold">{generatedOtpCode}</strong>
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
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl py-3 text-center text-xl font-bold font-mono tabular-nums text-[var(--color-ink)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn--primary w-full py-3.5 text-sm rounded-xl font-bold cursor-pointer"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            </div>
          ) : mode === 'login' ? (
            /* ======================================================== */
            /* SIGN IN SCREEN WITH ROLE TOGGLE                          */
            /* ======================================================== */
            <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
              <div className="text-center space-y-1 pt-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                  Sign In
                </h1>
                <p className="text-xs text-[var(--color-ink-muted)] font-normal">
                  Municipal PESO Roxas • Select your user role to proceed
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-[var(--color-ink)]">Choose User Role:</span>
                  <span className="text-[11px] font-medium text-[var(--color-accent)]">
                    {role === 'job_seeker'
                      ? 'Candidate Access'
                      : role === 'employer'
                      ? 'Employer Access'
                      : 'LGU / PESO Admin Access'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[var(--color-paper-warm)] p-1.5 rounded-xl border border-[var(--color-rule)]">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('job_seeker')}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      role === 'job_seeker'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold leading-tight">Job Seeker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('employer')}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      role === 'employer'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold leading-tight">Employer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('admin')}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      role === 'admin'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold leading-tight">PESO Admin</span>
                  </button>
                </div>

                {/* Role Helper Notice */}
                <div className="p-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] text-xs flex items-start gap-2.5 text-[var(--color-ink)]">
                  {role === 'job_seeker' && (
                    <GraduationCap className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  {role === 'employer' && (
                    <Building2 className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  {role === 'admin' && (
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="leading-snug flex-1">
                    <p className="font-semibold text-[11px]">
                      {role === 'job_seeker'
                        ? 'Job Seeker Portal'
                        : role === 'employer'
                        ? 'Employer Portal'
                        : 'LGU / PESO Municipal Administrator Portal'}
                    </p>
                    <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
                      {role === 'job_seeker'
                        ? 'Sign in to view matched job vacancies and track your application status.'
                        : role === 'employer'
                        ? 'Sign in to upload verification documents, publish vacancies, and review ranked applicants.'
                        : hasAdminAccount
                        ? 'Sign in with your registered LGU/PESO Administrator credentials.'
                        : 'No LGU/PESO Admin account has been set up yet. Click below to complete initial administrator registration.'}
                    </p>
                    {role === 'admin' && !hasAdminAccount && (
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        <span>Set Up Initial LGU/PESO Admin Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
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
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                  />
                </div>

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
                      className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 cursor-pointer rounded"
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

                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotStep('request');
                      setForgotEmail(loginEmail);
                    }}
                    className="text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn--primary w-full py-3.5 text-sm sm:text-base rounded-xl font-bold transition-colors text-center cursor-pointer"
                  >
                    {isLoading
                      ? 'Authenticating...'
                      : `Sign In as ${
                          role === 'job_seeker'
                            ? 'Job Seeker'
                            : role === 'employer'
                            ? 'Employer'
                            : 'PESO Admin'
                        }`}
                  </button>
                </div>
              </form>

              {role !== 'admin' && (
                <>
                  <div className="relative flex items-center justify-center my-6">
                    <div className="border-t border-[var(--color-rule)] w-full" />
                    <span className="bg-[var(--color-paper)] px-3 text-xs text-[var(--color-ink-muted)] font-normal absolute">
                      Or continue with
                    </span>
                  </div>

                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      className="w-full py-2.5 px-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-warm)] flex items-center justify-center gap-2.5 text-xs font-semibold text-[var(--color-ink)] transition-colors cursor-pointer"
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </button>
                  </div>
                </>
              )}

              <p className="text-center text-xs sm:text-sm text-[var(--color-ink-muted)] font-normal pt-2">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer ml-0.5"
                >
                  Create Account
                </button>
              </p>
            </div>
          ) : (
            /* ======================================================== */
            /* CREATE ACCOUNT / INITIAL PESO ADMIN SETUP SCREEN         */
            /* ======================================================== */
            <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in">
              <div className="text-center space-y-1.5 pt-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] font-display tracking-tight">
                  {role === 'admin' ? 'Initial LGU/PESO Admin Setup' : 'Create Account'}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] font-normal max-w-xs mx-auto leading-normal">
                  {role === 'admin'
                    ? 'Register the primary LGU/PESO Administrator account to manage employer verifications and walk-in applicants.'
                    : 'Register your account below to get started.'}
                </p>
              </div>

              {/* Role selector */}
              <div className="bg-[var(--color-paper-warm)] p-1 rounded-xl flex gap-1 border border-[var(--color-rule)]">
                <button
                  type="button"
                  onClick={() => setRole('job_seeker')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    role === 'job_seeker'
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    role === 'employer'
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-bold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Employer
                </button>
                {!hasAdminAccount && (
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      role === 'admin'
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    PESO Admin Setup
                  </button>
                )}
              </div>

              {role === 'admin' && !hasAdminAccount && (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="leading-tight">
                    <span className="font-bold">Initial LGU/PESO Administrator Setup:</span>
                    <p className="text-[10px] text-amber-900 mt-0.5">
                      No administrator account exists yet in this clean-slate database. Create the official LGU/PESO Admin account below to unlock employer accreditation review and walk-in applicant management.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                    {role === 'employer'
                      ? 'Company / Establishment Name'
                      : role === 'admin'
                      ? 'PESO Administrator Full Name'
                      : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      role === 'employer'
                        ? 'e.g. Roxas Commercial Enterprise'
                        : role === 'admin'
                        ? 'e.g. PESO Municipal Administrator'
                        : 'e.g. Juan Dela Cruz'
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder={
                      role === 'admin' ? 'peso.admin@roxas.gov.ph' : 'name@example.com'
                    }
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-[var(--color-ink)] block">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="w-full bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm font-medium text-[var(--color-ink)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 cursor-pointer rounded"
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

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      agreeTerms
                        ? 'bg-[var(--color-accent)] text-[var(--color-paper-contrast)]'
                        : 'border border-[var(--color-rule)] bg-[var(--color-paper)]'
                    }`}
                    aria-label="Agree with Terms & Conditions"
                  >
                    {agreeTerms && <Check className="w-3.5 h-3.5 text-white stroke-[3]" aria-hidden="true" />}
                  </button>
                  <span className="text-xs sm:text-sm text-[var(--color-ink-muted)]">
                    Agree with{' '}
                    <span className="text-[var(--color-accent)] font-medium underline">
                      Terms & Conditions
                    </span>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn--primary w-full py-3.5 text-sm sm:text-base rounded-xl font-bold transition-colors text-center cursor-pointer"
                  >
                    {isLoading
                      ? 'Creating Account...'
                      : role === 'admin'
                      ? 'Initialize LGU/PESO Admin Account'
                      : role === 'employer'
                      ? 'Register Employer Account'
                      : 'Register Job Seeker Account'}
                  </button>
                </div>
              </form>

              <p className="text-center text-xs sm:text-sm text-[var(--color-ink-muted)] font-normal pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer ml-0.5"
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
