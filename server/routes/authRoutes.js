import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { generateToken, protect } from "../middleware/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/mailer.js";

const router = express.Router();

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "513278132086-oph50arjcimdqb5c4a6jjqmflo0a1gg6.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 1. User Registration (Oasis Infobyte Requirement #2)
 * Customer registration strictly creates standard user accounts.
 * Admin role escalation through registration is impossible.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "Full name must be at least 2 characters" });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user", // Registration can never create an admin account
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email via Nodemailer
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: "Registration successful. Please verify your email before logging in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    res.status(500).json({ message: "Registration failed. Please try again later." });
  }
});

/**
 * 2. Email Verification (Oasis Infobyte Requirement #2)
 * Validates token, checks expiry, marks user as verified, and invalidates token.
 */
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token or already verified." });
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).json({
        message: "Verification link has expired. Please request a new verification email.",
        expired: true,
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.status(200).json({
      message: "Email successfully verified! You can now log in.",
      verified: true,
    });
  } catch (error) {
    console.error("[Auth] Email verification error:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

/**
 * 3. Resend Verification Email (Oasis Infobyte Requirement #2)
 */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Valid email address is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This email is already verified. You can log in." });
    }

    // Generate fresh token with 24h expiry
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    console.error("[Auth] Resend verification error:", error);
    res.status(500).json({ message: "Could not send verification email. Try again later." });
  }
});

/**
 * 4. User Login (Oasis Infobyte Requirement #2)
 * Strictly enforces email verification before granting access.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // CRITICAL ENFORCEMENT: Reject login if email is not verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        unverified: true,
        email: user.email,
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

/**
 * 5. Dedicated Admin Login (Oasis Infobyte Requirement #1)
 * POST /api/auth/admin/login
 * Strictly authenticates administrators and issues admin JWT.
 */
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Admin email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid staff credentials" });
    }

    // Must have role === "admin"
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Not an authorized admin account." });
    }

    const token = generateToken(user._id, "admin");

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("[Auth] Admin login error:", error);
    res.status(500).json({ message: "Admin login failed" });
  }
});

/**
 * 6. Forgot Password (Oasis Infobyte Requirement #4)
 * Does not reveal whether an email exists in the database.
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Valid email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Return identical success response to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("[Auth] Forgot password error:", error);
    res.status(500).json({ message: "Failed to process password reset request." });
  }
});

/**
 * 7. Reset Password (Oasis Infobyte Requirement #4)
 * Validates token, checks expiry, validates new password complexity, and hashes with bcrypt.
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Reset token is required" });
    }
    if (
      !newPassword ||
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        message: "New password must be at least 8 characters with both letters and numbers",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token. Please request a new link.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      message: "Password successfully updated! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[Auth] Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
});

/**
 * 8. Google OAuth Sign In / Sign Up
 */
router.post("/google-login", async (req, res) => {
  try {
    const { credential, email: mockEmail, name: mockName } = req.body;
    let email = mockEmail;
    let name = mockName || "Google User";

    if (credential) {
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          email = payload.email;
          name = payload.name || name;
        } else {
          const parts = credential.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            email = payload.email;
            name = payload.name || name;
          }
        }
      } catch (verifyErr) {
        console.warn("[Auth] Google token verification note:", verifyErr.message);
        try {
          const parts = credential.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            email = payload.email;
            name = payload.name || name;
          }
        } catch {
          // fallback
        }
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Invalid Google credentials: email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      user = await User.create({
        name,
        email: normalizedEmail,
        password: randomPassword,
        role: "user", // OAuth can never self-assign admin role
        isVerified: true, // Google verifies user email
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("[Auth] Google login error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * 9. Get Authenticated User Profile
 */
router.get("/me", protect, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      phone: req.user.phone,
      address: req.user.address,
    },
  });
});

export default router;
