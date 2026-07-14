/** Shared HTML chrome for KhataApp transactional emails */
export function emailLayout({ title, preheader, bodyHtml, quoteHtml }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  const supportEmail =
    process.env.SUPPORT_CONTACT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    'khata.app2026@gmail.com';
  const appUrl = process.env.APP_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'https://medikhata-app.vercel.app';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
    .preheader { display:none!important; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden; }
    .wrap { width:100%; background:#f1f5f9; padding:28px 12px; }
    .card { max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg,#2563eb,#1d4ed8); padding:12px 18px; }
    .header-table { width:100%; border-collapse:collapse; }
    .header-table td { vertical-align:middle; }
    .brand-left { padding:0; text-align:left; }
    .brand-right { padding:0; text-align:right; }
    .brand { margin:0; color:#fff; font-size:17px; font-weight:700; letter-spacing:-0.02em; line-height:1.2; }
    .brand-sub { margin:0; color:rgba(255,255,255,0.8); font-size:11px; font-weight:500; line-height:1.2; }
    .body { padding:24px 22px 20px; }
    h1 { margin:0 0 10px; font-size:18px; font-weight:700; color:#0f172a; text-align:center; }
    p { margin:0 0 12px; font-size:14px; line-height:1.55; color:#475569; }
    .quote {
      margin:18px auto;
      max-width:360px;
      text-align:center;
      background:#f8fafc;
      border-left:3px solid #2563eb;
      border-radius:0 12px 12px 0;
      padding:16px 18px;
    }
    .quote-label { margin:0 0 8px; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; }
    .otp { letter-spacing:0.4em; font-size:30px; font-weight:800; color:#1d4ed8; margin:0; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
    .note { font-size:12px; color:#94a3b8; text-align:center; margin:0; }
    .footer { padding:14px 22px 18px; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #f1f5f9; }
    a { color:#2563eb; text-decoration:none; }
  </style>
</head>
<body>
  <span class="preheader">${preheader || ''}</span>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <table class="header-table" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td class="brand-left" align="left">
              <p class="brand">${appName}</p>
            </td>
            <td class="brand-right" align="right">
              <p class="brand-sub">Universal shop ledger</p>
            </td>
          </tr>
        </table>
      </div>
      <div class="body">
        ${bodyHtml}
        ${quoteHtml || ''}
      </div>
      <div class="footer">
        Need help? <a href="mailto:${supportEmail}">${supportEmail}</a><br/>
        <a href="${appUrl}">${appUrl.replace(/^https?:\/\//, '')}</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function otpQuoteBlock(otp, label = 'Your one-time code') {
  return `
    <div class="quote">
      <p class="quote-label">${label}</p>
      <p class="otp">${otp}</p>
    </div>
  `;
}

export function verificationOtpEmail({ name, otp }) {
  const minutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  return {
    subject: 'Verify your KhataApp account',
    html: emailLayout({
      title: 'Verify your email',
      preheader: `Your KhataApp verification code is ${otp}`,
      bodyHtml: `
        <h1>Verify your email</h1>
        <p style="text-align:center">Hi ${escapeHtml(name || 'there')}, use the code below to verify your email and finish creating your KhataApp account.</p>
      `,
      quoteHtml: `
        ${otpQuoteBlock(otp, 'Verification code')}
        <p class="note">This code expires in ${minutes} minutes. If you did not request this, you can ignore this email.</p>
      `,
    }),
  };
}

export function resetOtpEmail({ name, otp }) {
  const minutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  return {
    subject: 'Reset your KhataApp password',
    html: emailLayout({
      title: 'Password reset code',
      preheader: `Your KhataApp password reset code is ${otp}`,
      bodyHtml: `
        <h1>Reset your password</h1>
        <p style="text-align:center">Hi ${escapeHtml(name || 'there')}, we received a request to reset your KhataApp password. Enter this code to continue:</p>
      `,
      quoteHtml: `
        ${otpQuoteBlock(otp, 'Password reset code')}
        <p class="note">This code expires in ${minutes} minutes. If you did not request a reset, please ignore this email.</p>
      `,
    }),
  };
}

export function welcomeEmail({ name }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  return {
    subject: `Welcome to ${appName}`,
    html: emailLayout({
      title: 'Welcome',
      preheader: `Welcome to ${appName} — your shop ledger is ready.`,
      bodyHtml: `
        <h1>Welcome aboard</h1>
        <p style="text-align:center">Hi ${escapeHtml(name || 'there')}, your email is verified and your ${appName} account is ready.</p>
      `,
      quoteHtml: `
        <div class="quote">
          <p class="quote-label">Getting started</p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#334155">Add customers, track dues, and send reminders — all from one place.</p>
        </div>
      `,
    }),
  };
}

export function supportMessageEmail({ name, email, message, shopName = '' }) {
  const safeName = escapeHtml(name || 'Unknown');
  const safeEmail = escapeHtml(email || 'Not provided');
  const safeShop = escapeHtml(shopName || '');
  const safeMessage = escapeHtml(message || '').replace(/\n/g, '<br/>');

  return {
    subject: `KhataApp support — ${name || 'New message'}`,
    html: emailLayout({
      title: 'Support message',
      preheader: `New support message from ${name || 'a user'}`,
      bodyHtml: `
        <h1>New support message</h1>
        <p style="text-align:center">Someone sent a message from KhataApp Settings.</p>
      `,
      quoteHtml: `
        <div class="quote" style="text-align:left;max-width:420px">
          <p class="quote-label">From</p>
          <p style="margin:0 0 10px;font-size:14px;color:#0f172a;font-weight:700">${safeName}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#64748b"><strong>Email:</strong> ${safeEmail}</p>
          ${safeShop ? `<p style="margin:0 0 12px;font-size:12px;color:#64748b"><strong>Shop:</strong> ${safeShop}</p>` : '<p style="margin:0 0 12px"></p>'}
          <p class="quote-label">Message</p>
          <p style="margin:0;font-size:14px;line-height:1.55;color:#334155">${safeMessage}</p>
        </div>
      `,
    }),
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
