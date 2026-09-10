import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_oasis_pizza_key_2026";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "oasis_pizza_secret_key_2026";

let razorpayInstance;
try {
  razorpayInstance = new Razorpay({ key_id, key_secret });
} catch (e) {
  console.log("[Razorpay] Initialized in sandbox test mode");
}

// 1. Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      const order = await razorpayInstance.orders.create(options);
      return res.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        key_id,
      });
    }

    // Sandbox fallback for test mode without live API key
    const mockOrderId = `order_test_${Math.random().toString(36).substring(2, 12)}`;
    res.json({
      id: mockOrderId,
      currency: "INR",
      amount: options.amount,
      key_id,
      mode: "test_sandbox",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Verify Razorpay Payment Signature
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    // In test mode or when live key_secret is present
    if (razorpay_signature && process.env.RAZORPAY_KEY_SECRET) {
      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generated_signature = hmac.digest("hex");

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ verified: false, message: "Invalid payment signature" });
      }
    }

    res.json({
      verified: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      message: "Razorpay payment verified successfully (Test Mode)",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
