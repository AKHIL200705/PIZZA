import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image_key: { type: String, default: "custom" },
  unit_price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  ingredient_ids: [{ type: String }],
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: String, required: false },
    customer_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    delivery_fee: { type: Number, required: true, default: 49 },
    total: { type: Number, required: true },
    payment_id: { type: String, required: true },
    razorpay_order_id: { type: String, default: "" },
    payment_status: { type: String, enum: ["pending", "paid", "failed"], default: "paid" },
    status: {
      type: String,
      enum: ["Order Received", "In Kitchen", "Sent to Delivery", "Delivered", "Cancelled"],
      default: "Order Received",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
