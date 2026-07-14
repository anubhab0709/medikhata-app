import { Resend } from 'resend';
import { verificationOtpEmail, resetOtpEmail, welcomeEmail, supportMessageEmail } from './templates.js';

let resendClient = null;

function cleanEnv(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '');
}

function getFromAddress() {
  return cleanEnv(process.env.RESEND_FROM) || 'KhataApp <onboarding@resend.dev>';
}

function getApiKey() {
  return cleanEnv(process.env.RESEND_API_KEY);
}

/** Inbox where support form messages are delivered (Resend-verified mailbox). */
export function getSupportInbox() {
  return cleanEnv(process.env.SUPPORT_EMAIL) || 'heyanubhab@gmail.com';
}

export function getSupportContactEmail() {
  return cleanEnv(process.env.SUPPORT_CONTACT_EMAIL) || 'khata.app2026@gmail.com';
}

export function getSupportPhone() {
  return cleanEnv(process.env.SUPPORT_PHONE) || '8617569139';
}

function getResend() {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 're_xxxxxxxx') return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export function isEmailConfigured() {
  return Boolean(getResend());
}

function logDevMail({ to, subject, html }) {
  console.log(`[email:dev] To: ${to}\nSubject: ${subject}`);
  const otpMatch = html.match(/class="otp">(\d{6})</);
  if (otpMatch) console.log(`[email:dev] OTP: ${otpMatch[1]}`);
  return { id: `dev-${Date.now()}`, provider: 'dev' };
}

async function sendMail({ to, subject, html, replyTo }) {
  const from = getFromAddress();
  const resend = getResend();
  const allowDevFallback = process.env.EMAIL_DEV_FALLBACK === 'true' && process.env.NODE_ENV !== 'production';

  if (!resend) {
    if (allowDevFallback) {
      console.warn('[email] RESEND_API_KEY missing — using console fallback. Add your key to BackEnd/.env');
      return logDevMail({ to, subject, html });
    }
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY in BackEnd/.env and restart the server.'
    );
  }

  try {
    const payload = {
      from,
      to: [to],
      subject,
      html,
    };
    if (replyTo) payload.replyTo = replyTo;

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('[email:resend] send failed:', error);
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    console.log(`[email:resend] sent to ${to} id=${data?.id || 'unknown'}`);
    return { id: data?.id, provider: 'resend' };
  } catch (err) {
    console.error('[email:resend] exception:', err?.message || err);
    throw new Error(err?.message || 'Failed to send email via Resend');
  }
}

export const emailService = {
  async sendVerificationOtp({ to, name, otp }) {
    const { subject, html } = verificationOtpEmail({ name, otp });
    return sendMail({ to, subject, html });
  },

  async sendResetOtp({ to, name, otp }) {
    const { subject, html } = resetOtpEmail({ name, otp });
    return sendMail({ to, subject, html });
  },

  async sendWelcome({ to, name }) {
    const { subject, html } = welcomeEmail({ name });
    return sendMail({ to, subject, html });
  },

  async sendSupportMessage({ name, email, message, shopName }) {
    const { subject, html } = supportMessageEmail({ name, email, message, shopName });
    return sendMail({
      to: getSupportInbox(),
      subject,
      html,
      replyTo: email || undefined,
    });
  },
};
