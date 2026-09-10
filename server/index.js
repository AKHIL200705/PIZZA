import express from "express";
import http from "http";
import { Server } from "socket.io";
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

// Create HTTP server for Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

// Socket.IO Room Management for Real-time Order Tracking
io.on("connection", (socket) => {
  socket.on("join_order", (orderId) => {
    socket.join(`order:${orderId}`);
  });

  socket.on("leave_order", (orderId) => {
    socket.leave(`order:${orderId}`);
  });
});

// Expose Socket.IO instance to Express routes via req.app.get("io")
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PizzaHub Express Backend",
    timestamp: new Date(),
    stack: "Node/Express + MongoDB + Razorpay + Socket.IO + JWT + node-cron",
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n===============================================================`);
    console.log(`🚀 PizzaHub Express Backend Server running on http://localhost:${PORT}`);
    console.log(`🍕 Health check: http://localhost:${PORT}/api/health`);
    console.log(`⚡ Socket.IO real-time engine active`);
    console.log(`===============================================================\n`);
  });
}

startServer();

export default app;
