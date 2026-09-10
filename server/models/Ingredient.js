import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["base", "sauce", "cheese", "veggie"],
    },
    price: { type: Number, required: true, default: 0 },
    stock_qty: { type: Number, required: true, default: 50 },
    low_stock_threshold: { type: Number, required: true, default: 20 },
    lowStockAlertSent: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Ingredient = mongoose.model("Ingredient", ingredientSchema);
