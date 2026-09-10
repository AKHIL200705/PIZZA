import cron from "node-cron";
import { Ingredient } from "../models/Ingredient.js";
import { User } from "../models/User.js";
import { sendLowStockAlertEmail } from "./mailer.js";

/**
 * Scheduled Inventory Low Stock Monitor using node-cron.
 * Oasis Infobyte Requirement #10: Low-Stock Email Notification via scheduled node-cron job.
 */
export const initLowStockCron = () => {
  // Run every 15 minutes (or adjust expression e.g. '0 * * * *' for hourly)
  // In dev environment, runs check periodically to ensure low stock items are caught.
  cron.schedule("*/15 * * * *", async () => {
    console.log("[node-cron] Running scheduled low-stock inventory check...");
    try {
      // Find ingredients where stock_qty <= low_stock_threshold
      const lowStockItems = await Ingredient.find({
        $expr: { $lte: ["$stock_qty", "$low_stock_threshold"] },
      });

      if (lowStockItems.length > 0) {
        console.log(`[node-cron] Found ${lowStockItems.length} low-stock items. Triggering admin email alert...`);
        const adminUser = await User.findOne({ role: "admin" });
        const adminEmail = adminUser ? adminUser.email : process.env.ADMIN_EMAIL || "admin@pizzahub.com";
        await sendLowStockAlertEmail(adminEmail, lowStockItems);
      } else {
        console.log("[node-cron] All inventory stock levels are healthy.");
      }
    } catch (err) {
      console.error("[node-cron] Low-stock audit error:", err.message);
    }
  });

  console.log("[node-cron] Scheduled inventory monitoring job initialized.");
};

export const triggerManualLowStockCheck = async () => {
  const lowStockItems = await Ingredient.find({
    $expr: { $lte: ["$stock_qty", "$low_stock_threshold"] },
  });
  if (lowStockItems.length > 0) {
    const adminUser = await User.findOne({ role: "admin" });
    const adminEmail = adminUser ? adminUser.email : process.env.ADMIN_EMAIL || "admin@pizzahub.com";
    await sendLowStockAlertEmail(adminEmail, lowStockItems);
  }
  return lowStockItems;
};
