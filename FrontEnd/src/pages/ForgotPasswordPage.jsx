import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api.js';
import Logo from '../components/Logo.jsx';
import OtpInput from '../components/OtpInput.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function PasswordInput({ id, value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} className="input pr-12" placeholder={placeholder} autoComplete="new-password" disabled={disabled} required />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 text-xs font-semibold hover:text-slate-600 focus-ring" aria-label={show ? 'Hide password' : 'Show password'} tabIndex={-1}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const t = window.setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendSeconds]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return setError('Please enter your email');
    setLoading(true);
    setError('');
    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res._devOtp) setDevOtp(res._devOtp);
      setStep('otp');
      setResendSeconds(res.resendAvailableIn || 60);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Enter the 6-digit code');
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp({ email: email.trim(), otp, purpose: 'reset' });
      setResetToken(res.resetToken);
      setStep('password');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = useCallback(async () => {
    if (resendSeconds > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.resendOtp({ email: email.trim(), purpose: 'reset' });
      if (res._devOtp) setDevOtp(res._devOtp);
      setResendSeconds(res.resendAvailableIn || 60);
    } catch (err) {
      setError(err.message || 'Failed to resend');
      if (err.retryAfter) setResendSeconds(err.retryAfter);
    } finally {
      setLoading(false);
    }
  }, [email, resendSeconds]);

  const savePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({
        resetToken,
        newPassword: password,
        confirmPassword,
        email: email.trim(),
      });
      setStep('success');
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    email: ['Forgot password', 'Enter your email and we will send a verification code'],
    otp: ['Verify OTP', `Enter the code sent to ${email}`],
    password: ['Create new password', 'Choose a strong password for your account'],
    success: ['Password updated', 'You can now sign in with your new password'],
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-8 safe-area-pt safe-area-pb">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#dbeafe_0%,_#f8fafc_45%,_#ffffff_100%)]" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.08)] px-5 py-7 sm:px-8 sm:py-9">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 inline-flex"><Logo size={44} /></div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{titles[step][0]}</h1>
            <p className="text-slate-500 text-sm mt-1.5">{titles[step][1]}</p>
          </div>

          {step === 'email' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="label" htmlFor="fp-email">Email address</label>
                <input id="fp-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@pharmacy.com" disabled={loading} required />
              </div>
              <button type="submit" disabled={loading} className="btn w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Sending...</span> : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verify} className="space-y-5">
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              {devOtp && <p className="text-center text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">Dev OTP: <strong>{devOtp}</strong></p>}
              <button type="submit" disabled={loading || otp.length !== 6} className="btn w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Verifying...</span> : 'Verify OTP'}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => setStep('email')} className="text-slate-500">Back</button>
                <button type="button" onClick={resend} disabled={loading || resendSeconds > 0} className="text-primary-600 font-semibold disabled:text-slate-500">
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={savePassword} className="space-y-4">
              <div>
                <label className="label" htmlFor="np">New password</label>
                <PasswordInput id="np" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" disabled={loading} />
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="label" htmlFor="cp">Confirm password</label>
                <PasswordInput id="cp" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={loading} />
              </div>
              <button type="submit" disabled={loading} className="btn w-full">
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Saving...</span> : 'Reset password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-2xl" aria-hidden="true">✓</div>
              <p className="text-sm text-slate-600">Redirecting to sign in…</p>
              <Link to="/login" className="btn w-full">Back to Sign In</Link>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</div>
          )}

          {step !== 'success' && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Remembered it? <Link to="/login" className="text-primary-600 font-semibold">Sign In</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
