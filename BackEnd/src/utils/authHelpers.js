import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const otpMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
export const OTP_TTL_MS = (Number.isFinite(otpMinutes) && otpMinutes > 0 ? otpMinutes : 10) * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_RESENDS = 5;
export const MIN_PASSWORD_LENGTH = 8;
export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
export const BCRYPT_ROUNDS = Math.min(15, Math.max(10, Number(process.env.BCRYPT_ROUNDS || 12) || 12));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function isStrongPassword(password) {
  const p = String(password || '');
  if (p.length < MIN_PASSWORD_LENGTH) return false;
  return /[A-Za-z]/.test(p) && /\d/.test(p);
}

export function generateOtp() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

export async function hashOtp(otp) {
  return bcrypt.hash(String(otp), BCRYPT_ROUNDS);
}

export async function verifyOtpHash(otp, hash) {
  if (!otp || !hash) return false;
  return bcrypt.compare(String(otp), hash);
}

export function hashPassword(password) {
  return bcrypt.hash(String(password), BCRYPT_ROUNDS);
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function clearOtpFields(user) {
  user.otpCode = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.lastOtpSentAt = null;
  user.otpPurpose = null;
  user.otpResendCount = 0;
}

export function cookieOptions(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  // Cross-site FE/BE (Vercel + Render) needs SameSite=None; Secure
  // Prefer same-origin /api proxy on Vercel so Safari treats cookies as first-party.
  const defaultSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
  const sameSiteRaw = String(process.env.COOKIE_SAMESITE || defaultSameSite).toLowerCase();
  const sameSite = ['strict', 'lax', 'none'].includes(sameSiteRaw) ? sameSiteRaw : defaultSameSite;
  const secure = process.env.NODE_ENV === 'production' || sameSite === 'none';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: maxAgeMs,
  };
}
