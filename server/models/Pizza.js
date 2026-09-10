import mongoose from "mongoose";

const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image_key: { type: String, default: "margherita" },
    is_available: { type: Boolean, default: true },
    ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ingredient" }],
  },
  { timestamps: true },
);

export const Pizza = mongoose.model("Pizza", pizzaSchema);
