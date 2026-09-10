import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// Read Razorpay credentials from environment
const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_oasis_pizza_key_2026";
const key_secret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;
if (key_id && key_secret) {
  try {
    razorpayInstance = new Razorpay({ key_id, key_secret });
  } catch (e) {
    console.warn("[Razorpay] Failed to instantiate SDK:", e.message);
  }
}

/**
 * 1. Create Razorpay Order (TEST MODE)
 * POST /api/payment/create-order
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid positive amount is required" });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    if (razorpayInstance && process.env.RAZORPAY_KEY_SECRET) {
      const order = await razorpayInstance.orders.create(options);
      return res.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        key_id,
        mode: "live_test_keys",
      });
    }

    // Sandbox test mode mock order (when live API keys are not provided in development)
    const mockOrderId = `order_test_${Math.random().toString(36).substring(2, 12)}`;
    res.json({
      id: mockOrderId,
      currency: "INR",
      amount: options.amount,
      key_id,
      mode: "test_sandbox",
    });
  } catch (error) {
    console.error("[Payment] Create order error:", error);
    res.status(500).json({ message: "Could not create payment order" });
  }
});

/**
 * 2. Verify Razorpay Payment Signature
 * POST /api/payment/verify-payment
 * Strictly validates the HMAC SHA-256 signature using RAZORPAY_KEY_SECRET.
 * Client-controlled demo bypass is strictly rejected in production.
 */
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, demo } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ verified: false, message: "Payment ID is required" });
    }

    const isProduction = process.env.NODE_ENV === "production";

    // Disallow client-controlled demo bypass in production
    if (demo && isProduction) {
      return res.status(403).json({
        verified: false,
        message: "Demo payment bypass is strictly disabled in production mode.",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (secret) {
      if (!razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
          verified: false,
          message: "Both order ID and signature are required for cryptographic verification.",
        });
      }

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const expectedSignature = hmac.digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          verified: false,
          message: "Cryptographic signature mismatch. Payment verification failed.",
        });
      }
    } else if (isProduction) {
      return res.status(500).json({
        verified: false,
        message: "RAZORPAY_KEY_SECRET must be configured in production environment.",
      });
    }

    res.json({
      verified: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id || `test_order_${Date.now()}`,
      message: "Razorpay payment verified successfully (Test Mode)",
    });
  } catch (error) {
    console.error("[Payment] Verify payment error:", error);
    res.status(500).json({ verified: false, message: "Payment verification error" });
  }
});

export default router;
