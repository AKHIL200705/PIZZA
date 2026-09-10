import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";

// Use Google Public DNS to handle Windows local DNS SRV queries for MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { connectDB } from "./config/db.js";
import { seedDatabase } from "./seed.js";
import { initLowStockCron } from "./services/cron.js";

import authRoutes from "./routes/authRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";
import pizzaRoutes from "./routes/pizzaRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PizzaHub Express Backend",
    timestamp: new Date(),
    stack: "Node/Express + MongoDB + Razorpay + JWT + node-cron",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/pizzas", pizzaRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);

// Start Server & Connect MongoDB
async function startServer() {
  await connectDB();
  await seedDatabase();
  initLowStockCron();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n===============================================================`);
    console.log(`🚀 PizzaHub Express Backend Server running on http://localhost:${PORT}`);
    console.log(`🍕 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================================\n`);
  });
}

startServer();

export default app;
