import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PendingAuth } from '../models/PendingAuth.js';
import { emailService } from '../services/email/index.js';
import {
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_RESENDS,
  MIN_PASSWORD_LENGTH,
  RESET_TOKEN_TTL_MS,
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
  generateOtp,
  hashOtp,
  verifyOtpHash,
  generateResetToken,
  hashToken,
  clearOtpFields,
  cookieOptions,
  hashPassword,
} from '../utils/authHelpers.js';

const SETTINGS_KEYS = [
  'shopName', 'ownerName', 'shopPhone', 'shopEmail', 'shopAddress',
  'brandName', 'quickSignature', 'whatsappCountryCode', 'defaultTemplateLang',
  'firstReminderAfterDays', 'secondReminderAfterDays', 'markOverdueAfterDays',
  'messageLanguage', 'messageEn', 'messageBn', 'appLanguage',
];

const SETTINGS_MAX = {
  shopName: 200,
  ownerName: 200,
  shopPhone: 50,
  shopEmail: 200,
  shopAddress: 500,
  brandName: 200,
  quickSignature: 200,
  whatsappCountryCode: 10,
  messageEn: 2000,
  messageBn: 2000,
};

function sanitizeSettings(input = {}) {
  const next = {};
  for (const key of SETTINGS_KEYS) {
    if (!(key in input)) continue;
    const value = input[key];
    if (['firstReminderAfterDays', 'secondReminderAfterDays', 'markOverdueAfterDays'].includes(key)) {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 1) next[key] = Math.min(365, Math.floor(n));
      continue;
    }
    if (key === 'defaultTemplateLang' || key === 'messageLanguage' || key === 'appLanguage') {
      next[key] = value === 'bn' ? 'bn' : 'en';
      continue;
    }
    const max = SETTINGS_MAX[key] || 200;
    next[key] = String(value ?? '').trim().slice(0, max);
  }
  return next;
}

function signToken(userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT secret is not configured');
  return jwt.sign(
    { userId: String(userId) },
    jwtSecret,
    { expiresIn, algorithm: 'HS256' }
  );
}

function toPublicUser(user) {
  return {
    id: String(user._id),
    shopName: user.shopName,
    ownerName: user.ownerName,
    email: user.email,
    phone: user.phone || '',
    emailVerified: Boolean(user.emailVerified),
    settings: user.settings || {},
  };
}

function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie('token', token, cookieOptions());
  return token;
}

function resendCooldownSeconds(lastSentAt) {
  if (!lastSentAt) return 0;
  const remaining = OTP_RESEND_COOLDOWN_MS - (Date.now() - new Date(lastSentAt).getTime());
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

async function issueOtpChallenge({ email, purpose, ownerName = '', passwordHash = null, existingPending = null }) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const now = new Date();
  const expires = new Date(now.getTime() + OTP_TTL_MS);

  let pending = existingPending;
  if (pending) {
    const cooldown = resendCooldownSeconds(pending.lastOtpSentAt);
    if (cooldown > 0) {
      const err = new Error(`Please wait ${cooldown}s before requesting another code`);
      err.status = 429;
      err.retryAfter = cooldown;
      throw err;
    }
    if ((pending.resendCount || 0) >= OTP_MAX_RESENDS) {
      const err = new Error('Maximum OTP resend attempts reached. Please start again later.');
      err.status = 429;
      throw err;
    }
    pending.otpHash = otpHash;
    pending.otpExpiresAt = expires;
    pending.otpAttempts = 0;
    pending.lastOtpSentAt = now;
    pending.resendCount = (pending.resendCount || 0) + 1;
    if (ownerName) pending.ownerName = ownerName;
    if (passwordHash) pending.passwordHash = passwordHash;
    await pending.save();
  } else {
    pending = await PendingAuth.create({
      email,
      purpose,
      ownerName,
      passwordHash,
      otpHash,
      otpExpiresAt: expires,
      otpAttempts: 0,
      lastOtpSentAt: now,
      resendCount: 0,
    });
  }

  if (purpose === 'signup') {
    await emailService.sendVerificationOtp({ to: email, name: ownerName, otp });
  } else {
    await emailService.sendResetOtp({ to: email, name: ownerName, otp });
  }

  const payload = {
    success: true,
    message: 'OTP sent to your email',
    email,
    purpose,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    resendAvailableIn: OTP_RESEND_COOLDOWN_MS / 1000,
  };

  if (process.env.ALLOW_DEV_OTP === 'true' && process.env.NODE_ENV !== 'production') {
    payload._devOtp = otp;
  }

  return payload;
}

/** Start signup — stores pending registration and emails OTP. Account is created only after verify. */
export async function signup(req, res) {
  try {
    const { fullName, ownerName, email, password, confirmPassword } = req.body || {};
    const name = String(fullName || ownerName || '').trim();
    const cleanEmail = normalizeEmail(email);

    if (!name || !cleanEmail || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required' });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include a letter and a number`,
      });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing?.emailVerified) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    // Remove incomplete/unverified leftover user if any
    if (existing && !existing.emailVerified) {
      await User.deleteOne({ _id: existing._id });
    }

    const passwordHash = await hashPassword(password);
    const pending = await PendingAuth.findOne({ email: cleanEmail, purpose: 'signup' });

    const result = await issueOtpChallenge({
      email: cleanEmail,
      purpose: 'signup',
      ownerName: name,
      passwordHash,
      existingPending: pending,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ message: error.message, retryAfter: error.retryAfter });
    }
    console.error('signup error:', error);
    return res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body || {};
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.emailVerified) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(401).json({ message: 'Invalid email or password' });

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
    const token = signToken(user._id, expiresIn);
    res.cookie('token', token, cookieOptions(maxAge));

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp, purpose } = req.body || {};
    const cleanEmail = normalizeEmail(email);
    const code = String(otp || '').trim();
    const intent = purpose === 'reset' ? 'reset' : 'signup';

    if (!cleanEmail || !code) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit code' });
    }

    const pending = await PendingAuth.findOne({ email: cleanEmail, purpose: intent });
    if (!pending) {
      return res.status(400).json({ message: 'No pending verification found. Please request a new code.' });
    }

    if (new Date(pending.otpExpiresAt).getTime() < Date.now()) {
      await PendingAuth.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    if ((pending.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      await PendingAuth.deleteOne({ _id: pending._id });
      return res.status(429).json({ message: 'Too many invalid attempts. Please request a new code.' });
    }

    const ok = await verifyOtpHash(code, pending.otpHash);
    if (!ok) {
      pending.otpAttempts = (pending.otpAttempts || 0) + 1;
      await pending.save();
      const left = OTP_MAX_ATTEMPTS - pending.otpAttempts;
      return res.status(400).json({
        message: left > 0 ? `Invalid OTP. ${left} attempt${left === 1 ? '' : 's'} remaining.` : 'Invalid OTP.',
      });
    }

    if (intent === 'signup') {
      if (!pending.passwordHash || !pending.ownerName) {
        await PendingAuth.deleteOne({ _id: pending._id });
        return res.status(400).json({ message: 'Signup session incomplete. Please start again.' });
      }

      const shopName = `${pending.ownerName}'s Shop`;
      let user = await User.findOne({ email: cleanEmail });
      if (user?.emailVerified) {
        await PendingAuth.deleteOne({ _id: pending._id });
        return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
      }

      if (user) {
        user.ownerName = pending.ownerName;
        user.shopName = shopName;
        user.passwordHash = pending.passwordHash;
        user.emailVerified = true;
        clearOtpFields(user);
        user.pendingPasswordHash = null;
        user.settings = {
          ...(user.settings?.toObject?.() || {}),
          shopName,
          ownerName: pending.ownerName,
          shopEmail: cleanEmail,
        };
        await user.save();
      } else {
        user = await User.create({
          email: cleanEmail,
          ownerName: pending.ownerName,
          shopName,
          passwordHash: pending.passwordHash,
          emailVerified: true,
          phone: '',
          settings: {
            shopName,
            ownerName: pending.ownerName,
            shopEmail: cleanEmail,
          },
        });
      }

      await PendingAuth.deleteOne({ _id: pending._id });
      setAuthCookie(res, user._id);

      emailService.sendWelcome({ to: cleanEmail, name: user.ownerName }).catch(() => {});

      return res.status(201).json({
        success: true,
        message: 'Account verified successfully',
        user: toPublicUser(user),
      });
    }

    // Reset purpose — issue short-lived reset token
    const user = await User.findOne({ email: cleanEmail, emailVerified: true });
    if (!user) {
      await PendingAuth.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'Account not found' });
    }

    const rawToken = generateResetToken();
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    clearOtpFields(user);
    await user.save();
    await PendingAuth.deleteOne({ _id: pending._id });

    return res.json({
      success: true,
      message: 'OTP verified. You can now set a new password.',
      resetToken: rawToken,
      expiresInSeconds: Math.floor(RESET_TOKEN_TTL_MS / 1000),
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
}

export async function resendOtp(req, res) {
  try {
    const { email, purpose } = req.body || {};
    const cleanEmail = normalizeEmail(email);
    const intent = purpose === 'reset' ? 'reset' : 'signup';

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const pending = await PendingAuth.findOne({ email: cleanEmail, purpose: intent });
    if (!pending) {
      return res.status(400).json({ message: 'No pending verification found. Please start again.' });
    }

    const result = await issueOtpChallenge({
      email: cleanEmail,
      purpose: intent,
      ownerName: pending.ownerName,
      passwordHash: pending.passwordHash,
      existingPending: pending,
    });

    return res.json(result);
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ message: error.message, retryAfter: error.retryAfter });
    }
    console.error('resendOtp error:', error);
    return res.status(500).json({ message: 'Failed to resend OTP' });
  }
}

export async function sendOtp(req, res) {
  // Alias for starting reset or re-triggering — prefers purpose from body
  try {
    const { email, purpose } = req.body || {};
    const cleanEmail = normalizeEmail(email);
    const intent = purpose === 'signup' ? 'signup' : 'reset';

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    if (intent === 'signup') {
      return res.status(400).json({ message: 'Use /auth/signup to start registration' });
    }

    const user = await User.findOne({ email: cleanEmail, emailVerified: true });
    // Anti-enumeration: always look successful
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, an OTP has been sent.',
        email: cleanEmail,
        purpose: 'reset',
        expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
        resendAvailableIn: OTP_RESEND_COOLDOWN_MS / 1000,
      });
    }

    const pending = await PendingAuth.findOne({ email: cleanEmail, purpose: 'reset' });
    const result = await issueOtpChallenge({
      email: cleanEmail,
      purpose: 'reset',
      ownerName: user.ownerName,
      existingPending: pending,
    });

    return res.json({
      ...result,
      message: 'If an account exists, an OTP has been sent.',
    });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ message: error.message, retryAfter: error.retryAfter });
    }
    console.error('sendOtp error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
}

export async function forgotPassword(req, res) {
  return sendOtp({ ...req, body: { ...(req.body || {}), purpose: 'reset' } }, res);
}

export async function resetPassword(req, res) {
  try {
    const { token, resetToken, newPassword, confirmPassword, email } = req.body || {};
    const raw = String(resetToken || token || '').trim();
    const cleanEmail = normalizeEmail(email);

    if (!raw || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include a letter and a number`,
      });
    }

    const query = {
      resetPasswordToken: hashToken(raw),
      resetPasswordExpires: { $gt: new Date() },
    };
    if (cleanEmail) query.email = cleanEmail;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    clearOtpFields(user);
    await user.save();

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('shopName ownerName email phone emailVerified settings');
    if (!user) {
      const { maxAge: _maxAge, ...opts } = cookieOptions();
      res.clearCookie('token', opts);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.json({ user: toPublicUser(user) });
  } catch {
    return res.status(500).json({ message: 'Failed to load profile' });
  }
}

export async function updateSettings(req, res) {
  try {
    const payload = sanitizeSettings(req.body || {});
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.settings = {
      ...(user.settings?.toObject?.() || user.settings || {}),
      ...payload,
    };

    if (payload.shopName) user.shopName = payload.shopName;
    if (payload.ownerName) user.ownerName = payload.ownerName;

    await user.save();
    return res.json({ settings: user.settings || {} });
  } catch {
    return res.status(500).json({ message: 'Failed to update settings' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include a letter and a number`,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matched = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matched) return res.status(401).json({ message: 'Incorrect current password' });

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to change password' });
  }
}

export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.json({ success: true });
}
