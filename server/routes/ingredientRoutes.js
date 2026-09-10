import express from "express";
import { Ingredient } from "../models/Ingredient.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { triggerManualLowStockCheck } from "../services/cron.js";

const router = express.Router();

// Get all ingredients (public for Custom Builder & Menu)
router.get("/", async (req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({ category: 1, sort_order: 1 });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update Stock & Low-Stock Threshold
router.patch("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { stock_qty, low_stock_threshold } = req.body;
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    if (typeof stock_qty === "number") ingredient.stock_qty = Math.max(0, stock_qty);
    if (typeof low_stock_threshold === "number")
      ingredient.low_stock_threshold = Math.max(0, low_stock_threshold);

    await ingredient.save();

    // Check if updating this ingredient triggers a low stock alert
    if (ingredient.stock_qty <= ingredient.low_stock_threshold) {
      await triggerManualLowStockCheck();
    }

    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
