import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Ingredient } from "../models/Ingredient.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { triggerManualLowStockCheck } from "../services/cron.js";

const router = express.Router();

// 1. Place New Order with Automatic Stock Deduction
router.post("/", async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      address,
      items,
      payment_id,
      razorpay_order_id,
      user_id,
    } = req.body;

    if (!customer_name || !phone || !address || !items || !items.length || !payment_id) {
      return res.status(400).json({ message: "Missing required order details or payment ID" });
    }

    // Collect all ingredient IDs or names used across all ordered items
    const validIngredientObjectIds = [];
    const ingredientNames = [];

    items.forEach((item) => {
      if (item.ingredient_ids && Array.isArray(item.ingredient_ids)) {
        item.ingredient_ids.forEach((id) => {
          if (mongoose.Types.ObjectId.isValid(id)) {
            validIngredientObjectIds.push(id);
          }
        });
      }
      if (item.details) {
        if (item.details.base) ingredientNames.push(item.details.base);
        if (item.details.sauce) ingredientNames.push(item.details.sauce);
        if (item.details.cheese) ingredientNames.push(item.details.cheese);
        if (Array.isArray(item.details.veggies)) {
          item.details.veggies.forEach((v) => ingredientNames.push(v));
        }
      }
    });

    const queryFilters = [];
    if (validIngredientObjectIds.length > 0) {
      queryFilters.push({ _id: { $in: validIngredientObjectIds } });
    }
    if (ingredientNames.length > 0) {
      queryFilters.push({ name: { $in: ingredientNames } });
    }

    // Verify ingredient stock levels in MongoDB
    if (queryFilters.length > 0) {
      const ingredients = await Ingredient.find({ $or: queryFilters });
      const outOfStock = ingredients.filter((ing) => ing.stock_qty <= 0);

      if (outOfStock.length > 0) {
        return res.status(400).json({
          message: `OUT_OF_STOCK: ${outOfStock.map((i) => i.name).join(", ")} is out of stock. Please adjust your custom pizza.`,
        });
      }

      // Automatically deduct stock quantity (Oasis Infobyte Requirement #9)
      for (const ing of ingredients) {
        ing.stock_qty = Math.max(0, ing.stock_qty - 1);
        await ing.save();
      }

      // Trigger background low stock check if any item drops below threshold
      await triggerManualLowStockCheck();
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * (i.quantity || 1), 0);
    const delivery_fee = 49;
    const total = subtotal + delivery_fee;

    const order = await Order.create({
      user: user_id || null,
      customer_name,
      phone,
      address,
      items,
      subtotal,
      delivery_fee,
      total,
      payment_id,
      razorpay_order_id: razorpay_order_id || "",
      payment_status: "paid",
      status: "Order Received",
    });

    res.status(201).json({
      message: "Order placed successfully!",
      orderId: order._id,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Get Single Order Details (for live user order tracking)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. User Order History
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Admin: View All Orders
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Admin: Update Order Status (Order Received -> In Kitchen -> Sent to Delivery -> Delivered)
router.patch("/admin/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "Order Received",
      "In Kitchen",
      "Sent to Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json({ message: `Order status updated to "${status}"`, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
