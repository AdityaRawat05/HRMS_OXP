import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, ShieldCheck, KeyRound, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Client-side validation
  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setAuthError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Work email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid work email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      await login(email.trim(), password);
      // Redirect to target destination or /dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      setAuthError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailError(null);
    setPasswordError(null);
    setAuthError(null);
  };

  return (
    <div className="max-w-md w-full mx-auto py-8 sm:py-14 px-4">
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HR Portal Branding */}
        <div className="text-center space-y-2.5 mb-8">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-cyan-500/25 p-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to your <span className="text-cyan-400 font-semibold">PeoplePay360</span> account
            </p>
          </div>
        </div>

        {/* Authentication Error Banner */}
        {authError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-700/50 text-rose-300 text-xs flex items-start space-x-3 transition-all animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Authentication Error</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Work Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="name@company.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`w-full bg-slate-950 border ${
                  emailError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition`}
              />
            </div>
            {emailError && (
              <p id="email-error" className="text-xs text-rose-400 flex items-center space-x-1 mt-1">
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="••••••••••••"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`w-full bg-slate-950 border ${
                  passwordError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition`}
              />
            </div>
            {passwordError && (
              <p id="password-error" className="text-xs text-rose-400 flex items-center space-x-1 mt-1">
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          {/* Sign In Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm transition duration-200 shadow-lg shadow-cyan-600/25 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Helper */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Development Demo Access:</span>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoCredentials('admin@peoplepay360.com', 'Password123!')}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition group"
            >
              <div>
                <span className="font-semibold text-slate-200 block group-hover:text-cyan-400">Admin Account</span>
                <span className="text-slate-500 font-mono text-[11px]">admin@peoplepay360.com</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Active
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoCredentials('inactive@peoplepay360.com', 'Password123!')}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition group"
            >
              <div>
                <span className="font-semibold text-slate-200 block group-hover:text-cyan-400">Inactive Account (Test)</span>
                <span className="text-slate-500 font-mono text-[11px]">inactive@peoplepay360.com</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/60">
                Inactive
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
              <Info className="w-5 h-5" />
              <span>Password Recovery</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              For security reasons, password recovery in PeoplePay360 is managed by your organization's HR / System Administrator. Please contact your system administrator at <span className="font-mono text-cyan-300">admin@peoplepay360.com</span> to reset your work credentials.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
