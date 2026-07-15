/** Shared HTML chrome for KhataApp transactional emails */
export function emailLayout({ title, preheader, bodyHtml, quoteHtml }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  const supportEmail =
    process.env.SUPPORT_CONTACT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    'khata.app2026@gmail.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
    .preheader { display:none!important; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden; mso-hide:all; }
    .wrap { width:100%; background:#f8fafc; padding:24px 12px; }
    .card { max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; }
    .header { padding:16px 20px; border-bottom:1px solid #e2e8f0; }
    .brand { margin:0; color:#0f172a; font-size:16px; font-weight:700; }
    .body { padding:22px 20px 18px; }
    h1 { margin:0 0 10px; font-size:18px; font-weight:700; color:#0f172a; }
    p { margin:0 0 12px; font-size:14px; line-height:1.55; color:#475569; }
    .code-box {
      margin:18px 0;
      text-align:center;
      background:#f1f5f9;
      border:1px solid #e2e8f0;
      border-radius:10px;
      padding:16px 14px;
    }
    .code-label { margin:0 0 8px; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#64748b; }
    .otp { letter-spacing:0.35em; font-size:28px; font-weight:700; color:#0f172a; margin:0; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
    .note { font-size:12px; color:#64748b; margin:0; }
    .footer { padding:14px 20px 16px; text-align:left; font-size:12px; color:#94a3b8; border-top:1px solid #f1f5f9; }
    a { color:#2563eb; text-decoration:none; }
  </style>
</head>
<body>
  <span class="preheader">${preheader || ''}</span>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <p class="brand">${escapeHtml(appName)}</p>
      </div>
      <div class="body">
        ${bodyHtml}
        ${quoteHtml || ''}
      </div>
      <div class="footer">
        This is an automated message from ${escapeHtml(appName)}.<br/>
        Need help? <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function otpQuoteBlock(otp, label = 'Your one-time code') {
  return `
    <div class="code-box">
      <p class="code-label">${label}</p>
      <p class="otp">${otp}</p>
    </div>
  `;
}

function otpPlainText({ greeting, intro, otp, minutes, supportEmail, appName }) {
  return [
    `${appName}`,
    '',
    greeting,
    '',
    intro,
    '',
    `Your code: ${otp}`,
    '',
    `This code expires in ${minutes} minutes.`,
    'If you did not request this, you can ignore this email.',
    '',
    `Need help? ${supportEmail}`,
  ].join('\n');
}

export function verificationOtpEmail({ name, otp }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  const minutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const supportEmail =
    process.env.SUPPORT_CONTACT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    'khata.app2026@gmail.com';
  const safeName = name || 'there';

  return {
    subject: `${otp} is your ${appName} verification code`,
    html: emailLayout({
      title: 'Email verification code',
      preheader: `${otp} is your ${appName} verification code. It expires in ${minutes} minutes.`,
      bodyHtml: `
        <h1>Verify your email</h1>
        <p>Hi ${escapeHtml(safeName)}, use this code to finish creating your ${escapeHtml(appName)} account:</p>
      `,
      quoteHtml: `
        ${otpQuoteBlock(otp, 'Verification code')}
        <p class="note">This code expires in ${minutes} minutes. If you did not request this, ignore this email.</p>
      `,
    }),
    text: otpPlainText({
      greeting: `Hi ${safeName},`,
      intro: `Use this code to finish creating your ${appName} account.`,
      otp,
      minutes,
      supportEmail,
      appName,
    }),
  };
}

export function resetOtpEmail({ name, otp }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  const minutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const supportEmail =
    process.env.SUPPORT_CONTACT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    'khata.app2026@gmail.com';
  const safeName = name || 'there';

  return {
    subject: `${otp} is your ${appName} password reset code`,
    html: emailLayout({
      title: 'Password reset code',
      preheader: `${otp} is your ${appName} password reset code. It expires in ${minutes} minutes.`,
      bodyHtml: `
        <h1>Reset your password</h1>
        <p>Hi ${escapeHtml(safeName)}, we received a request to reset your ${escapeHtml(appName)} password. Enter this code to continue:</p>
      `,
      quoteHtml: `
        ${otpQuoteBlock(otp, 'Password reset code')}
        <p class="note">This code expires in ${minutes} minutes. If you did not request a reset, ignore this email.</p>
      `,
    }),
    text: otpPlainText({
      greeting: `Hi ${safeName},`,
      intro: `Use this code to reset your ${appName} password.`,
      otp,
      minutes,
      supportEmail,
      appName,
    }),
  };
}

export function welcomeEmail({ name }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  const supportEmail =
    process.env.SUPPORT_CONTACT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    'khata.app2026@gmail.com';
  const safeName = name || 'there';

  return {
    subject: `Welcome to ${appName}`,
    html: emailLayout({
      title: 'Welcome',
      preheader: `Welcome to ${appName}. Your account is ready.`,
      bodyHtml: `
        <h1>Welcome aboard</h1>
        <p>Hi ${escapeHtml(safeName)}, your email is verified and your ${escapeHtml(appName)} account is ready.</p>
        <p>You can sign in and start adding customers, tracking dues, and sending reminders.</p>
      `,
    }),
    text: [
      `Welcome to ${appName}`,
      '',
      `Hi ${safeName},`,
      '',
      `Your email is verified and your ${appName} account is ready.`,
      '',
      `Need help? ${supportEmail}`,
    ].join('\n'),
  };
}

export function supportMessageEmail({ name, email, message, shopName = '' }) {
  const appName = process.env.APP_NAME || 'KhataApp';
  const safeName = escapeHtml(name || 'Unknown');
  const safeEmail = escapeHtml(email || 'Not provided');
  const safeShop = escapeHtml(shopName || '');
  const safeMessage = escapeHtml(message || '').replace(/\n/g, '<br/>');

  return {
    subject: `${appName} support — ${name || 'New message'}`,
    html: emailLayout({
      title: 'Support message',
      preheader: `New support message from ${name || 'a user'}`,
      bodyHtml: `
        <h1>New support message</h1>
        <p>Someone sent a message from ${escapeHtml(appName)} Settings.</p>
      `,
      quoteHtml: `
        <div class="code-box" style="text-align:left">
          <p class="code-label">From</p>
          <p style="margin:0 0 10px;font-size:14px;color:#0f172a;font-weight:700">${safeName}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#64748b"><strong>Email:</strong> ${safeEmail}</p>
          ${safeShop ? `<p style="margin:0 0 12px;font-size:12px;color:#64748b"><strong>Shop:</strong> ${safeShop}</p>` : '<p style="margin:0 0 12px"></p>'}
          <p class="code-label">Message</p>
          <p style="margin:0;font-size:14px;line-height:1.55;color:#334155">${safeMessage}</p>
        </div>
      `,
    }),
    text: [
      `${appName} support message`,
      '',
      `From: ${name || 'Unknown'}`,
      `Email: ${email || 'Not provided'}`,
      shopName ? `Shop: ${shopName}` : '',
      '',
      String(message || ''),
    ].filter(Boolean).join('\n'),
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
