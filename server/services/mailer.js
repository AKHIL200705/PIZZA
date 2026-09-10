import nodemailer from "nodemailer";

// Setup Nodemailer transporter (Fallback to Ethereal/Console if SMTP host is missing)
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Console output fallback for development / test mode
  return {
    sendMail: async (mailOptions) => {
      console.log("\n================ [EMAIL NOTIFICATION SIMULATION] ================");
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body (HTML):\n${mailOptions.html || mailOptions.text}`);
      console.log("=================================================================\n");
      return { messageId: `mock_${Date.now()}` };
    },
  };
};

const transporter = createTransporter();

export const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/auth?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #e11d48;">Welcome to PizzaHub! 🍕</h2>
      <p>Thank you for registering. Please click the button below to verify your email address:</p>
      <a href="${verifyUrl}" style="background-color: #e11d48; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">Verify Email Address</a>
      <p style="margin-top: 20px; text-color: #666; font-size: 12px;">Link: ${verifyUrl}</p>
    </div>
  `;
  return transporter.sendMail({
    from: `"PizzaHub Alerts" <${process.env.SMTP_USER || "noreply@pizzahub.com"}>`,
    to: email,
    subject: "PizzaHub — Please Verify Your Email Address",
    html,
  });
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #e11d48;">Password Reset Request</h2>
      <p>You requested a password reset for your PizzaHub account. Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #e11d48; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">Reset Password</a>
      <p style="margin-top: 20px; text-color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
    </div>
  `;
  return transporter.sendMail({
    from: `"PizzaHub Support" <${process.env.SMTP_USER || "noreply@pizzahub.com"}>`,
    to: email,
    subject: "PizzaHub — Password Reset Request",
    html,
  });
};

export const sendLowStockAlertEmail = async (adminEmail, items) => {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-transform: capitalize;">${item.category}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #dc2626; font-weight: bold;">${item.stock_qty}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.low_stock_threshold}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #dc2626;">⚠️ Low Stock Inventory Alert — PizzaHub Kitchen</h2>
      <p>The following ingredient items are below their configured low-stock thresholds:</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            <th style="padding: 8px; border: 1px solid #ddd;">Ingredient</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Category</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Current Stock</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin-top: 20px;">Please restock these items in the admin inventory console.</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"PizzaHub Inventory Cron" <${process.env.SMTP_USER || "cron@pizzahub.com"}>`,
    to: adminEmail || process.env.ADMIN_EMAIL || "admin@pizzahub.com",
    subject: "🚨 [Low Stock Alert] PizzaHub Kitchen Inventory Needs Restock",
    html,
  });
};
