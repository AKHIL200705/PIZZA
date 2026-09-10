import nodemailer from "nodemailer";

/**
 * Setup Nodemailer transporter supporting both EMAIL_USER/EMAIL_PASSWORD and SMTP_USER/SMTP_PASS.
 * Oasis Infobyte Requirement #3: Consistent email configuration with useful configuration diagnostics.
 */
const getEmailConfig = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
  const host =
    process.env.SMTP_HOST || (user && user.includes("@gmail.com") ? "smtp.gmail.com" : null);
  const port = Number(process.env.SMTP_PORT) || 587;

  return { user, pass, host, port };
};

const createTransporter = () => {
  const { user, pass, host, port } = getEmailConfig();

  if (user && pass && host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Helpful configuration warning when credentials are not yet configured
  console.warn(
    "\n⚠️  [Email Service] EMAIL_USER / EMAIL_PASSWORD (or SMTP_USER / SMTP_PASS) not configured in environment.",
  );
  console.warn(
    "ℹ️  Outgoing emails (verification, password reset, low-stock alerts) will be logged to the server console.\n",
  );

  // Safe fallback simulator for local development / testing without live SMTP credentials
  return {
    sendMail: async (mailOptions) => {
      console.log("\n================ [EMAIL NOTIFICATION SIMULATION] ================");
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body (HTML):\n${mailOptions.html || mailOptions.text}`);
      console.log("=================================================================\n");
      return { messageId: `simulated_${Date.now()}` };
    },
  };
};

const transporter = createTransporter();

/**
 * 1. Send Email Verification Link
 * Oasis Infobyte Requirement #2
 */
export const sendVerificationEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
  const verifyUrl = `${frontendUrl}/auth?token=${token}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; max-width: 580px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #e11d48; margin: 0; font-size: 26px;">PizzaHub 🍕</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Level 3 Pizza Delivery &amp; Kitchen Platform</p>
      </div>
      <h2 style="color: #111827; font-size: 20px;">Verify your email address</h2>
      <p style="font-size: 15px; line-height: 1.6;">Thank you for registering at PizzaHub. Please click the button below to verify your email address and activate your account:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}" style="background-color: #e11d48; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Verify Email</a>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link into your browser:<br/><a href="${verifyUrl}" style="color: #e11d48;">${verifyUrl}</a></p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">This verification link expires in 24 hours.</p>
    </div>
  `;

  const { user } = getEmailConfig();
  return transporter.sendMail({
    from: `"PizzaHub Accounts" <${user || "noreply@pizzahub.com"}>`,
    to: email,
    subject: "🍕 Verify your PizzaHub account email",
    html,
  });
};

/**
 * 2. Send Password Reset Link
 * Oasis Infobyte Requirement #4
 */
export const sendPasswordResetEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; max-width: 580px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #e11d48; margin: 0; font-size: 26px;">PizzaHub 🍕</h1>
      </div>
      <h2 style="color: #111827; font-size: 20px;">Password Reset Request</h2>
      <p style="font-size: 15px; line-height: 1.6;">We received a request to reset your PizzaHub account password. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #e11d48; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color: #e11d48;">${resetUrl}</a></p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  const { user } = getEmailConfig();
  return transporter.sendMail({
    from: `"PizzaHub Security" <${user || "security@pizzahub.com"}>`,
    to: email,
    subject: "🔒 Reset your PizzaHub password",
    html,
  });
};

/**
 * 3. Send Automated Low-Stock Inventory Alert
 * Oasis Infobyte Requirement #10
 */
export const sendLowStockAlertEmail = async (adminEmail, items) => {
  const rows = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: 600; color: #111827;">${item.name}</td>
        <td style="padding: 10px; text-transform: capitalize; color: #4b5563;">${item.category}</td>
        <td style="padding: 10px; color: #dc2626; font-weight: 700;">${item.stock_qty} units</td>
        <td style="padding: 10px; color: #6b7280;">${item.low_stock_threshold} units</td>
      </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; max-width: 620px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px;">
      <div style="border-left: 4px solid #dc2626; padding-left: 12px; margin-bottom: 16px;">
        <h2 style="color: #dc2626; margin: 0; font-size: 20px;">⚠️ Automated Low-Stock Alert</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">PizzaHub Kitchen Inventory Scheduled Audit</p>
      </div>
      <p style="font-size: 14px; line-height: 1.5; color: #374151;">The following ingredients have fallen to or below their configured minimum threshold:</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 16px; font-size: 14px;">
        <thead>
          <tr style="background-color: #f9fafb; text-align: left; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 10px; color: #4b5563;">Item</th>
            <th style="padding: 10px; color: #4b5563;">Category</th>
            <th style="padding: 10px; color: #4b5563;">Current Stock</th>
            <th style="padding: 10px; color: #4b5563;">Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">Please sign in to the <a href="${process.env.FRONTEND_URL || "http://localhost:8080"}/admin/inventory" style="color: #e11d48; font-weight: 600;">Admin Inventory Console</a> to replenish stock.</p>
    </div>
  `;

  const { user } = getEmailConfig();
  const targetEmail = adminEmail || process.env.ADMIN_EMAIL || "admin@pizzahub.com";

  return transporter.sendMail({
    from: `"PizzaHub Inventory Monitor" <${user || "inventory@pizzahub.com"}>`,
    to: targetEmail,
    subject: `🚨 [Low Stock Alert] ${items.length} ingredient(s) need replenishment`,
    html,
  });
};
