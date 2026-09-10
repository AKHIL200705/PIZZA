import express from "express";
import mongoose from "mongoose";
import { Ingredient } from "../models/Ingredient.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { triggerManualLowStockCheck } from "../services/cron.js";

const router = express.Router();

/**
 * 1. Get All Ingredients (Public for Menu and Custom Pizza Builder)
 * GET /api/ingredients
 */
router.get("/", async (req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({ category: 1, sort_order: 1 });
    res.json(ingredients);
  } catch (error) {
    console.error("[Ingredients] Get error:", error);
    res.status(500).json({ message: "Failed to fetch ingredients" });
  }
});

/**
 * 2. Admin: Update Stock & Low-Stock Threshold
 * PATCH /api/ingredients/:id
 * Oasis Infobyte Requirement #9: Admin Inventory Dashboard operations
 * Supports setting exact stock, delta adjustments, threshold adjustments, and never allows negative stock.
 */
router.patch("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ingredient ID" });
    }

    const { stock_qty, delta_qty, low_stock_threshold } = req.body;
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    // 1. Handle exact stock quantity update
    if (typeof stock_qty === "number") {
      if (isNaN(stock_qty) || stock_qty < 0) {
        return res.status(400).json({ message: "Stock quantity cannot be negative" });
      }
      ingredient.stock_qty = Math.round(stock_qty);
    }

    // 2. Handle delta increment/decrement (+1, -1, +10)
    if (typeof delta_qty === "number") {
      ingredient.stock_qty = Math.max(0, Math.round(ingredient.stock_qty + delta_qty));
    }

    // 3. Handle low stock threshold update
    if (typeof low_stock_threshold === "number") {
      if (isNaN(low_stock_threshold) || low_stock_threshold < 0) {
        return res.status(400).json({ message: "Threshold cannot be negative" });
      }
      ingredient.low_stock_threshold = Math.round(low_stock_threshold);
    }

    // 4. Stateful low stock alert tracking:
    // If replenished above threshold, reset alert state so future drops will trigger alert
    if (ingredient.stock_qty > ingredient.low_stock_threshold) {
      ingredient.lowStockAlertSent = false;
    }

    await ingredient.save();

    // If stock dropped to or below threshold, run audit check to notify admin
    if (ingredient.stock_qty <= ingredient.low_stock_threshold && !ingredient.lowStockAlertSent) {
      triggerManualLowStockCheck().catch((err) =>
        console.error("[Inventory] Audit trigger error:", err.message)
      );
    }

    res.json(ingredient);
  } catch (error) {
    console.error("[Ingredients] Update error:", error);
    res.status(500).json({ message: "Failed to update ingredient" });
  }
});

export default router;
