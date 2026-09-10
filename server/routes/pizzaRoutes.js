import express from "express";
import { Pizza } from "../models/Pizza.js";

const router = express.Router();

// Get all menu pizzas
router.get("/", async (req, res) => {
  try {
    const pizzas = await Pizza.find().populate("ingredients").sort({ price: 1 });
    res.json(pizzas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
