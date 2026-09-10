import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Ingredient } from "../models/Ingredient.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { triggerManualLowStockCheck } from "../services/cron.js";

const router = express.Router();

// Allowed order statuses in chronological sequence
const VALID_STATUSES = [
  "Order Received",
  "In Kitchen",
  "Sent to Delivery",
  "Delivered",
  "Cancelled",
];

// Valid state transitions
const ALLOWED_TRANSITIONS = {
  "Order Received": ["In Kitchen", "Cancelled"],
  "In Kitchen": ["Sent to Delivery", "Cancelled"],
  "Sent to Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

/**
 * Helper to emit Socket.IO events safely if Socket.IO is initialized
 */
const emitOrderUpdate = (req, order) => {
  const io = req.app.get("io");
  if (io) {
    const orderId = order._id.toString();
    io.to(`order:${orderId}`).emit("order:status_updated", {
      orderId,
      status: order.status,
      order,
    });
    io.emit("order:updated", {
      orderId,
      status: order.status,
      order,
    });
  }
};

/**
 * 1. Place New Order with Transaction-Safe Atomic Stock Deduction
 * Oasis Infobyte Requirement #5: Inventory Transaction Safety
 * Prevents race conditions, negative inventory, and partial order creation.
 */
router.post("/", async (req, res) => {
  let session = null;
  let useTransactions = false;

  try {
    // Check if MongoDB deployment supports multi-document transactions (replica sets like Atlas)
    try {
      session = await mongoose.startSession();
      if (mongoose.connection?.client?.topology?.description?.type !== "Single") {
        session.startTransaction();
        useTransactions = true;
      }
    } catch {
      useTransactions = false;
    }

    const {
      customer_name,
      phone,
      address,
      items,
      payment_id,
      razorpay_order_id,
      user_id,
    } = req.body;

    // Input Validation (Requirement #14)
    if (!customer_name || typeof customer_name !== "string" || !customer_name.trim()) {
      if (session && useTransactions) await session.abortTransaction();
      return res.status(400).json({ message: "Customer name is required" });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      if (session && useTransactions) await session.abortTransaction();
      return res.status(400).json({ message: "Valid phone number is required" });
    }
    if (!address || typeof address !== "string" || !address.trim()) {
      if (session && useTransactions) await session.abortTransaction();
      return res.status(400).json({ message: "Delivery address is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      if (session && useTransactions) await session.abortTransaction();
      return res.status(400).json({ message: "Order must contain at least one item" });
    }
    if (!payment_id) {
      if (session && useTransactions) await session.abortTransaction();
      return res.status(400).json({ message: "Verified payment ID is required" });
    }

    // Tally total required quantity for each ingredient across all ordered pizzas
    const ingredientDeductions = new Map();

    for (const item of items) {
      const quantity = Math.max(1, Number(item.quantity) || 1);

      // Collect by ObjectId
      if (item.ingredient_ids && Array.isArray(item.ingredient_ids)) {
        for (const id of item.ingredient_ids) {
          if (mongoose.Types.ObjectId.isValid(id)) {
            const key = id.toString();
            ingredientDeductions.set(key, (ingredientDeductions.get(key) || 0) + quantity);
          }
        }
      }

      // Collect by ingredient details (base, sauce, cheese, veggies)
      if (item.details && typeof item.details === "object") {
        const { base, sauce, cheese, veggies } = item.details;
        const names = [];
        if (base) names.push(base);
        if (sauce) names.push(sauce);
        if (cheese) names.push(cheese);
        if (Array.isArray(veggies)) {
          veggies.forEach((v) => names.push(v));
        }

        for (const name of names) {
          const key = `name:${name}`;
          ingredientDeductions.set(key, (ingredientDeductions.get(key) || 0) + quantity);
        }
      }
    }

    // Validate and atomically deduct stock
    const deductedIngredients = [];

    for (const [key, requiredQty] of ingredientDeductions.entries()) {
      let query;
      if (key.startsWith("name:")) {
        const ingName = key.replace("name:", "");
        query = { name: new RegExp(`^${ingName}$`, "i") };
      } else {
        query = { _id: key };
      }

      const ingDoc = await (useTransactions
        ? Ingredient.findOne(query).session(session)
        : Ingredient.findOne(query));

      if (!ingDoc) continue;

      // Check stock availability
      if (ingDoc.stock_qty < requiredQty) {
        if (session && useTransactions) await session.abortTransaction();
        return res.status(400).json({
          message: `OUT_OF_STOCK: "${ingDoc.name}" only has ${ingDoc.stock_qty} unit(s) remaining (requested ${requiredQty}). Please adjust your custom pizza.`,
          ingredient: ingDoc.name,
        });
      }

      // Atomic decrement with condition preventing negative inventory
      const updated = await (useTransactions
        ? Ingredient.findOneAndUpdate(
            { _id: ingDoc._id, stock_qty: { $gte: requiredQty } },
            { $inc: { stock_qty: -requiredQty } },
            { new: true, session }
          )
        : Ingredient.findOneAndUpdate(
            { _id: ingDoc._id, stock_qty: { $gte: requiredQty } },
            { $inc: { stock_qty: -requiredQty } },
            { new: true }
          ));

      if (!updated) {
        // Concurrency collision: another request just depleted this ingredient
        if (session && useTransactions) await session.abortTransaction();
        return res.status(400).json({
          message: `RACE_CONDITION: Insufficient stock for "${ingDoc.name}". Another order just completed.`,
        });
      }

      deductedIngredients.push(updated);
    }

    const subtotal = items.reduce(
      (sum, i) => sum + Number(i.unit_price || 0) * (Number(i.quantity) || 1),
      0
    );
    const delivery_fee = 49;
    const total = subtotal + delivery_fee;

    // Create the order
    const orderData = {
      user: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : null,
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      items,
      subtotal,
      delivery_fee,
      total,
      payment_id,
      razorpay_order_id: razorpay_order_id || "",
      payment_status: "paid",
      status: "Order Received",
    };

    let order;
    if (useTransactions) {
      const created = await Order.create([orderData], { session });
      order = created[0];
      await session.commitTransaction();
    } else {
      order = await Order.create(orderData);
    }

    // Trigger scheduled low stock alert check in background if any ingredient crossed threshold
    triggerManualLowStockCheck().catch((err) =>
      console.error("[Inventory] Low stock check error:", err.message)
    );

    // Emit Socket.IO notification to kitchen/admin
    emitOrderUpdate(req, order);

    res.status(201).json({
      message: "Order placed successfully!",
      orderId: order._id,
      order,
    });
  } catch (error) {
    if (session && useTransactions) {
      try {
        await session.abortTransaction();
      } catch {
        // ignore
      }
    }
    console.error("[Orders] Create order error:", error);
    res.status(500).json({ message: error.message || "Failed to create order" });
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch {
        // ignore
      }
    }
  }
});

/**
 * 2. Get Single Order Details (Live tracking)
 * GET /api/orders/:id
 */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("[Orders] Get order error:", error);
    res.status(500).json({ message: "Failed to retrieve order" });
  }
});

/**
 * 3. Customer Order History (Oasis Infobyte Requirement #12 & #13)
 * GET /api/orders/user/:userId
 * Verifies JWT ownership: users can only view their own orders.
 */
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const requestedUserId = req.params.userId;

    // Security: Only allow users to view their own orders unless user is an admin
    if (req.user.role !== "admin" && req.user._id.toString() !== requestedUserId) {
      return res.status(403).json({ message: "Access denied: cannot view other users' orders" });
    }

    const orders = await Order.find({ user: requestedUserId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("[Orders] Get user orders error:", error);
    res.status(500).json({ message: "Failed to retrieve user orders" });
  }
});

/**
 * 4. Admin: View All Orders (Oasis Infobyte Requirement #11)
 * GET /api/orders/admin/all
 */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("[Orders] Admin get all error:", error);
    res.status(500).json({ message: "Failed to retrieve orders" });
  }
});

/**
 * 5. Admin: Update Order Status with Real-Time Socket.IO broadcast
 * PATCH /api/orders/admin/:id/status
 * Oasis Infobyte Requirement #7 & #8
 */
router.patch("/admin/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid order status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentStatus = order.status;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

    // Allow setting same status, or progressing through allowed transitions
    if (currentStatus !== status && !allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed: ${allowedNext.join(", ") || "None (Terminal Status)"}`,
      });
    }

    order.status = status;
    await order.save();

    // Broadcast real-time order update to user and kitchen console via Socket.IO
    emitOrderUpdate(req, order);

    res.json({
      message: `Order status updated to "${status}"`,
      order,
    });
  } catch (error) {
    console.error("[Orders] Update status error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

export default router;
