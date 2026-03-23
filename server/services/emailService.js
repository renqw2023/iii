const nodemailer = require('nodemailer');
const config = require('../config');
const { generateInvoicePDF } = require('./pdfService');

// ─── Shared design tokens ─────────────────────────────────────────────────────
const BRAND = {
  name: 'III.PICS',
  tagline: 'AI ART DISCOVERY',
  url: 'https://iii.pics',
  accent: '#7c3aed',
  accentDark: '#4f46e5',
  headerBg: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 60%, #2d1b69 100%)',
};

// ─── Base layout wrapper ──────────────────────────────────────────────────────
const wrap = (title, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d14;padding:48px 20px 40px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND.headerBg};padding:36px 48px 32px;border-radius:20px 20px 0 0;text-align:center;border-bottom:1px solid rgba(124,58,237,0.3);">
              <div style="display:inline-block;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.4);border-radius:10px;padding:6px 14px;margin-bottom:16px;">
                <span style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:3px;font-weight:600;text-transform:uppercase;">${BRAND.tagline}</span>
              </div>
              <div>
                <span style="color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-1.5px;font-style:italic;">III</span><span style="color:${BRAND.accent};font-size:30px;font-weight:800;letter-spacing:-1px;">.PICS</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:44px 48px 40px;border-radius:0 0 20px 20px;">
              ${bodyHtml}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" style="max-width:560px;margin-top:28px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding:0 20px;">
              <p style="color:#3f3f5a;font-size:12px;line-height:1.8;margin:0;">
                © 2026 III.PICS — All rights reserved.<br>
                You received this because you have an account on
                <a href="${BRAND.url}" style="color:#7c3aed;text-decoration:none;">III.PICS</a>.
                If this wasn't you, ignore this email.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Reusable UI blocks ────────────────────────────────────────────────────────
const divider = `<div style="border-top:1px solid #f0f0f8;margin:28px 0;"></div>`;

const badge = (icon, text) =>
  `<table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr>
      <td style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:8px;padding:6px 12px;">
        <span style="font-size:14px;vertical-align:middle;">${icon}</span>
        <span style="color:${BRAND.accent};font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;vertical-align:middle;margin-left:6px;">${text}</span>
      </td>
    </tr>
  </table>`;

const heading = (text) =>
  `<h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;line-height:1.3;">${text}</h1>`;

const subtext = (text) =>
  `<p style="margin:0 0 28px;font-size:15px;color:#71717a;line-height:1.6;">${text}</p>`;

const ctaButton = (href, label) =>
  `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;box-shadow:0 4px 20px rgba(124,58,237,0.35);">${label} →</a>
  </div>`;

const urlFallback = (url) =>
  `<div style="background:#f8f8fc;border:1px solid #e4e4f0;border-radius:10px;padding:14px 18px;margin-top:16px;">
    <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;font-weight:500;">Can't click the button? Copy this link:</p>
    <p style="margin:0;font-size:12px;color:${BRAND.accent};font-family:'Courier New',monospace;word-break:break-all;">${url}</p>
  </div>`;

const expiryNotice = (text) =>
  `<table cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;">
    <tr>
      <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;">
        <span style="font-size:14px;vertical-align:middle;">⏱</span>
        <span style="font-size:13px;color:#92400e;font-weight:500;vertical-align:middle;margin-left:8px;">${text}</span>
      </td>
    </tr>
  </table>`;

const securityNotice = (text) =>
  `<table cellpadding="0" cellspacing="0" width="100%" style="margin-top:12px;">
    <tr>
      <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;">
        <span style="font-size:14px;vertical-align:middle;">🔒</span>
        <span style="font-size:13px;color:#166534;font-weight:500;vertical-align:middle;margin-left:8px;">${text}</span>
      </td>
    </tr>
  </table>`;

// ─── Email Service ─────────────────────────────────────────────────────────────
class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (!config.email.enabled) {
      console.log('Email service disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
      tls: { rejectUnauthorized: false },
    });

    console.log('✅ Email service initialized');
  }

  // ── 1. Email Verification Code ─────────────────────────────────────────────
  async sendVerificationCode(email, code) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const body = `
      ${badge('✉️', 'Email Verification')}
      ${heading('Verify your email address')}
      ${subtext('Enter the code below to activate your III.PICS account. It expires in <strong>10 minutes</strong>.')}

      <div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:2px dashed #c4b5fd;border-radius:14px;padding:28px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:12px;color:#8b5cf6;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
        <span style="font-size:42px;font-weight:800;color:#4c1d95;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</span>
      </div>

      ${expiryNotice('This code expires in <strong>10 minutes</strong>. Do not share it with anyone.')}
      ${divider}
      <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">Didn't create an account? You can safely ignore this email.</p>
    `;

    return this._send(email, 'Your III.PICS verification code', wrap('Email Verification', body));
  }

  // ── 2. Welcome Email ───────────────────────────────────────────────────────
  async sendWelcomeEmail(email, username) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const body = `
      ${badge('🎉', 'Welcome')}
      ${heading(`You're in, ${username}.`)}
      ${subtext(`Your III.PICS account is ready. Start discovering AI art styles, community prompts, and video generations.`)}

      <div style="background:#f8f8fc;border-radius:14px;padding:20px 24px;margin:20px 0;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#71717a;letter-spacing:1px;text-transform:uppercase;">What's inside</p>
        <p style="margin:0 0 8px;font-size:14px;color:#09090b;">🎨 <strong>Sref Styles</strong> — Midjourney style reference library</p>
        <p style="margin:0 0 8px;font-size:14px;color:#09090b;">💡 <strong>Prompt Gallery</strong> — Community-crafted AI prompts</p>
        <p style="margin:0 0 8px;font-size:14px;color:#09090b;">🎬 <strong>AI Video</strong> — Seedance motion prompt explorer</p>
        <p style="margin:0;font-size:14px;color:#09090b;">⭐ <strong>Favorites</strong> — Save and organize anything</p>
      </div>

      ${ctaButton(BRAND.url, 'Start Exploring')}
      ${divider}
      <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">Check your dashboard for new member rewards.</p>
    `;

    return this._send(email, 'Welcome to III.PICS', wrap('Welcome to III.PICS', body));
  }

  async sendInviteRewardEmail(email, username, invitedUsername, credits) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const body = `
      ${badge('🎉', 'Referral Reward')}
      ${heading(`${credits} credits just landed in your wallet.`)}
      ${subtext(`Hi ${username}, ${invitedUsername} completed their first generation with your referral code, so your reward is now available in III.PICS.`)}

      <div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:1px solid #ddd6fe;border-radius:14px;padding:22px 24px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:12px;color:#8b5cf6;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Reward Summary</p>
        <p style="margin:0 0 10px;font-size:28px;font-weight:800;color:#4c1d95;">+${credits} permanent credits</p>
        <p style="margin:0;font-size:14px;color:#5b21b6;">Qualified referral: <strong>${invitedUsername}</strong></p>
      </div>

      ${ctaButton(`${config.server.clientUrl}/credits`, 'View Credits History')}
      ${divider}
      <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">You can track referral rewards anytime from your credits page and notification center.</p>
    `;

    return this._send(email, 'Your III.PICS referral reward is here', wrap('Referral Reward', body));
  }

  // ── 3. Password Reset ──────────────────────────────────────────────────────
  async sendPasswordResetEmail(email, username, resetToken) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const resetUrl = `${config.server.clientUrl}/reset-password?token=${resetToken}`;

    const body = `
      ${badge('🔑', 'Password Reset')}
      ${heading('Reset your password')}
      ${subtext(`Hi ${username}, we received a request to reset the password for your III.PICS account. Click the button below to choose a new one.`)}

      ${ctaButton(resetUrl, 'Reset Password')}
      ${urlFallback(resetUrl)}
      ${expiryNotice('This link is valid for <strong>1 hour</strong> and can only be used once.')}
      ${securityNotice('If you didn\'t request a password reset, your account is safe — you can ignore this email.')}
    `;

    return this._send(email, 'Reset your III.PICS password', wrap('Password Reset', body));
  }

  // ── 4. Password Reset Success ──────────────────────────────────────────────
  async sendPasswordResetSuccessEmail(email, username) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const body = `
      ${badge('✅', 'Password Updated')}
      ${heading('Your password has been changed')}
      ${subtext(`Hi ${username}, your III.PICS password was successfully updated. You can now sign in with your new password.`)}

      ${ctaButton(`${config.server.clientUrl}/login`, 'Sign In Now')}
      ${divider}
      ${securityNotice('Wasn\'t you? <a href="mailto:support@iii.pics" style="color:#166534;font-weight:600;">Contact support immediately</a> to secure your account.')}
    `;

    return this._send(email, 'Your III.PICS password has been changed', wrap('Password Updated', body));
  }

  // ── 5. Magic Link ──────────────────────────────────────────────────────────
  async sendMagicLinkEmail(email, magicUrl) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const body = `
      ${badge('⚡', 'Magic Link')}
      ${heading('Your sign-in link is ready')}
      ${subtext('Click the button below to sign in to III.PICS instantly — no password needed.')}

      ${ctaButton(magicUrl, 'Sign In to III.PICS')}
      ${urlFallback(magicUrl)}
      ${expiryNotice('This link expires in <strong>15 minutes</strong> and can only be used once.')}
      ${divider}
      <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">Didn't request this link? No action needed — it will expire automatically.</p>
    `;

    return this._send(email, 'Sign in to III.PICS', wrap('Sign In', body));
  }

  // ── 6. Purchase Receipt ────────────────────────────────────────────────────
  async sendPurchaseReceiptEmail(email, username, opts = {}) {
    if (!this.transporter) throw new Error('Email service not enabled');

    const {
      planName = 'Credits Pack',
      amountUSD = 0,
      currency = 'usd',
      credits = 0,
      orderId = '—',
      fullOrderId = '',
      purchasedAt = new Date(),
    } = opts;

    const invoiceNum = `INV-${orderId}`;
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(purchasedAt));

    const subject = `Receipt from III.PICS — $${Number(amountUSD).toFixed(2)}`;

    // Generate PDF attachment
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoicePDF({
        invoiceNum,
        planName,
        amountUSD,
        currency,
        credits,
        purchasedAt,
        username,
        email,
      });
    } catch (e) {
      console.error('PDF generation failed, sending email without attachment:', e);
    }

    // Clean Stripe-style receipt — white background, no gradient strip
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:4px;border:1px solid #e5e7eb;">

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 44px 36px;">
                <tr>
                  <td>

                    <!-- Logo + label row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td>
                          <span style="font-size:20px;font-weight:800;letter-spacing:-0.8px;font-style:italic;color:#111827;">III</span><span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#7c3aed;">.PICS</span>
                        </td>
                        <td style="text-align:right;vertical-align:middle;">
                          <span style="font-size:11px;color:#9ca3af;letter-spacing:0.06em;text-transform:uppercase;">Receipt</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Big amount -->
                    <p style="margin:0 0 4px;font-size:36px;font-weight:800;color:#111827;letter-spacing:-1px;">$${Number(amountUSD).toFixed(2)}</p>
                    <p style="margin:0 0 28px;font-size:13px;color:#16a34a;font-weight:600;">✓ Paid on ${formattedDate}</p>

                    <!-- Divider -->
                    <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>

                    <!-- Meta rows -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px;">
                      <tr>
                        <td style="color:#6b7280;padding:5px 0;">Receipt number</td>
                        <td style="text-align:right;color:#111827;font-family:'Courier New',monospace;font-weight:600;font-size:12px;">${invoiceNum}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:5px 0;">Date</td>
                        <td style="text-align:right;color:#111827;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;padding:5px 0;">Payment method</td>
                        <td style="text-align:right;color:#111827;">Credit card</td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <div style="border-top:1px solid #e5e7eb;margin-bottom:20px;"></div>

                    <!-- Line item -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:16px;">
                      <tr>
                        <td style="padding:10px 0;color:#111827;font-weight:500;vertical-align:top;">
                          ${planName} Credit Pack
                          <br/><span style="font-size:12px;color:#9ca3af;">${Number(credits).toLocaleString()} permanent credits · Never expire</span>
                        </td>
                        <td style="padding:10px 0;text-align:right;color:#111827;font-weight:600;vertical-align:top;">$${Number(amountUSD).toFixed(2)}</td>
                      </tr>
                    </table>

                    <!-- Totals -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                      <tr>
                        <td style="padding:3px 0;color:#6b7280;">Subtotal</td>
                        <td style="text-align:right;color:#374151;">$${Number(amountUSD).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;color:#6b7280;">Tax</td>
                        <td style="text-align:right;color:#374151;">$0.00</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 0;font-weight:700;color:#111827;font-size:14px;border-top:1px solid #e5e7eb;">Total</td>
                        <td style="text-align:right;padding:10px 0 0;font-weight:800;color:#111827;font-size:14px;border-top:1px solid #e5e7eb;">$${Number(amountUSD).toFixed(2)} ${currency.toUpperCase()}</td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <div style="border-top:1px solid #e5e7eb;margin:24px 0 28px;"></div>

                    <!-- Note about attachment -->
                    <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">Your invoice is attached to this email as a PDF. You can also view your full order history at any time.</p>

                    <!-- CTA -->
                    <div style="text-align:center;">
                      <a href="${config.server.clientUrl}/orders" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:6px;letter-spacing:0.1px;">View Order History →</a>
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">
                © 2026 III.PICS · <a href="${BRAND.url}" style="color:#9ca3af;text-decoration:none;">iii.pics</a> · <a href="mailto:support@iii.pics" style="color:#9ca3af;text-decoration:none;">support@iii.pics</a>
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">
                You're receiving this because you made a purchase on III.PICS.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const attachments = pdfBuffer
      ? [{ filename: `${invoiceNum}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      : [];

    return this._send(email, subject, html, attachments);
  }

  // ── Internal send helper ───────────────────────────────────────────────────
  async _send(to, subject, html, attachments = []) {
    const mailOptions = {
      from: { name: config.email.from.name, address: config.email.from.address },
      to,
      subject,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    };
    const result = await this.transporter.sendMail(mailOptions);
    console.log(`📧 Email sent [${subject}] → ${to} (${result.messageId})`);
    return result;
  }

  // ── Connection test ────────────────────────────────────────────────────────
  async testConnection() {
    if (!this.transporter) return { success: false, error: 'Email service not enabled' };
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection OK' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
