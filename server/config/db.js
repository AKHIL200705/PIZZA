import mongoose from "mongoose";
import dns from "dns";

// Use Google Public DNS to handle Windows local DNS SRV resolution for MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pizza_hub";
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log(`[MongoDB] Local DB notice: ${error.message}. Running in memory fallback mode.`);
    return null;
  }
};
