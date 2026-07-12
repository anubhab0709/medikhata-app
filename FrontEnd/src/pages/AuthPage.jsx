import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, setAuthToken } from '../utils/api.js';
import Logo from '../components/Logo.jsx';
import OtpInput from '../components/OtpInput.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';

function PasswordInput({ id, value, onChange, placeholder, disabled, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className="input pr-12"
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:text-slate-600 focus-ring"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <label className="label" htmlFor={htmlFor}>
      {children} <span className="text-red-500" aria-hidden="true">*</span>
    </label>
  );
}

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="relative min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-8 sm:px-6 safe-area-pt safe-area-pb">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#dbeafe_0%,_#f8fafc_45%,_#ffffff_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary-200/30 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.08)] px-5 py-7 sm:px-8 sm:py-9">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 inline-flex"><Logo size={44} /></div>
            <h1 className="text-[1.35rem] sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-500 text-[0.8125rem] sm:text-sm mt-1.5 leading-relaxed px-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function useResendTimer(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);
  return [seconds, setSeconds];
}

function OtpStep({ email, purpose, onVerified, onBack, loading, setLoading, setError }) {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  const [resendSeconds, setResendSeconds] = useResendTimer(60);
  const [devOtp, setDevOtp] = useState('');

  const verify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setLocalError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    setLocalError('');
    setError('');
    try {
      const result = await authApi.verifyOtp({ email, otp, purpose });
      onVerified(result);
    } catch (err) {
      setLocalError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendSeconds > 0) return;
    setLoading(true);
    setLocalError('');
    try {
      const result = await authApi.resendOtp({ email, purpose });
      setResendSeconds(result.resendAvailableIn || 60);
      if (result._devOtp) setDevOtp(result._devOtp);
    } catch (err) {
      setLocalError(err.message || 'Failed to resend');
      if (err.retryAfter) setResendSeconds(err.retryAfter);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={verify} className="space-y-5">
      <p className="text-center text-sm text-slate-500">
        We sent a 6-digit code to<br />
        <span className="font-semibold text-slate-800">{email}</span>
      </p>
      <OtpInput value={otp} onChange={setOtp} disabled={loading} />
      {devOtp && (
        <p className="text-center text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
          Dev OTP: <strong>{devOtp}</strong>
        </p>
      )}
      {(localError) && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">{localError}</p>
      )}
      <button type="submit" disabled={loading || otp.length !== 6} className="btn w-full">
        {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Verifying...</span> : 'Verify OTP'}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-700 focus-ring rounded px-1">Back</button>
        <button
          type="button"
          onClick={resend}
          disabled={loading || resendSeconds > 0}
          className="text-primary-600 font-semibold disabled:text-slate-500 focus-ring rounded px-1"
        >
          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
        </button>
      </div>
    </form>
  );
}

export default function AuthPage({ mode = 'login', onAuthSuccess }) {
  const navigate = useNavigate();
  const isLogin = mode === 'login';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | otp
  const [pendingEmail, setPendingEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const finishAuth = (user, token) => {
    setAuthToken(token);
    onAuthSuccess?.(token || null, user);
    navigate('/app/dashboard', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login({
        email: email.trim(),
        password,
        rememberMe,
      });
      finishAuth(result.user, result.token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.signup({
        fullName: fullName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        confirmPassword,
      });
      setPendingEmail(result.email || signupEmail.trim().toLowerCase());
      if (result._devOtp) setDevOtp(result._devOtp);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isLogin && step === 'otp') {
    return (
      <AuthShell title="Verify your email" subtitle="Enter the OTP we sent to finish creating your account">
        {devOtp && (
          <p className="mb-4 text-center text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
            Dev OTP: <strong>{devOtp}</strong>
          </p>
        )}
        <OtpStep
          email={pendingEmail}
          purpose="signup"
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          onBack={() => setStep('form')}
          onVerified={(result) => finishAuth(result.user, result.token)}
        />
        {error && <p role="alert" className="mt-4 text-xs text-red-600 text-center">{error}</p>}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="MediKhata"
      subtitle={isLogin ? 'Welcome back — sign in to your medicine shop ledger' : 'Create your account and start managing customer dues'}
    >
      <div className="segmented grid-cols-2 mb-6" role="tablist" aria-label="Authentication mode">
        <span
          className="segmented-thumb"
          style={{ left: isLogin ? '0.25rem' : 'calc(50% + 0.125rem)', width: 'calc(50% - 0.375rem)' }}
          aria-hidden="true"
        />
        <Link to="/login" role="tab" aria-selected={isLogin} className={`segmented-btn focus-ring text-center no-underline ${isLogin ? 'is-active' : ''}`}>Sign In</Link>
        <Link to="/signup" role="tab" aria-selected={!isLogin} className={`segmented-btn focus-ring text-center no-underline ${!isLogin ? 'is-active' : ''}`}>Sign Up</Link>
      </div>

      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <RequiredLabel htmlFor="login-email">Email</RequiredLabel>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@pharmacy.com"
              disabled={loading}
              required
            />
          </div>
          <div>
            <RequiredLabel htmlFor="login-password">Password</RequiredLabel>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-ring rounded">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Signing in...</span> : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-3.5" noValidate>
          <div>
            <RequiredLabel htmlFor="signup-name">Full name</RequiredLabel>
            <input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Your full name" autoComplete="name" disabled={loading} required />
          </div>
          <div>
            <RequiredLabel htmlFor="signup-email">Email address</RequiredLabel>
            <input id="signup-email" type="email" inputMode="email" autoComplete="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="input" placeholder="you@pharmacy.com" disabled={loading} required />
          </div>
          <div>
            <RequiredLabel htmlFor="signup-password">Password</RequiredLabel>
            <PasswordInput id="signup-password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" disabled={loading} />
            <PasswordStrength password={signupPassword} />
          </div>
          <div>
            <RequiredLabel htmlFor="signup-confirm">Confirm password</RequiredLabel>
            <PasswordInput id="signup-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="btn w-full mt-1">
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Creating...</span> : 'Create Account'}
          </button>
        </form>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 animate-[fadeUpIn_0.25s_ease-out]">
          {error}
        </div>
      )}

      <div className="mt-6 text-center text-[0.8125rem] text-slate-500">
        {isLogin ? (
          <p>New shop? <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">Sign Up</Link></p>
        ) : (
          <p>Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign In</Link></p>
        )}
      </div>
    </AuthShell>
  );
}
