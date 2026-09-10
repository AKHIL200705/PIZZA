import cron from "node-cron";
import { Ingredient } from "../models/Ingredient.js";
import { User } from "../models/User.js";
import { sendLowStockAlertEmail } from "./mailer.js";

/**
 * Scheduled Inventory Low Stock Monitor using node-cron.
 * Oasis Infobyte Requirement #10: Low-Stock Email Notification with stateful de-duplication.
 *
 * Logic:
 * 1. Stock becomes low (stock_qty <= low_stock_threshold) AND lowStockAlertSent !== true
 * 2. Send email notification to ADMIN_EMAIL
 * 3. Mark lowStockAlertSent = true (prevents duplicate spam emails on each cron run)
 * 4. When stock is replenished above threshold, reset lowStockAlertSent = false
 */
export const runLowStockAudit = async () => {
  try {
    // 1. Reset alert state for items that have been replenished above threshold
    await Ingredient.updateMany(
      {
        $expr: { $gt: ["$stock_qty", "$low_stock_threshold"] },
        lowStockAlertSent: true,
      },
      { $set: { lowStockAlertSent: false } }
    );

    // 2. Find low-stock items that have NOT had an alert sent yet
    const itemsNeedingAlert = await Ingredient.find({
      $expr: { $lte: ["$stock_qty", "$low_stock_threshold"] },
      $or: [{ lowStockAlertSent: false }, { lowStockAlertSent: { $exists: false } }],
    });

    if (itemsNeedingAlert.length > 0) {
      console.log(
        `[node-cron] Found ${itemsNeedingAlert.length} low-stock item(s) needing alert. Sending email...`
      );

      const adminUser = await User.findOne({ role: "admin" });
      const adminEmail =
        process.env.ADMIN_EMAIL || (adminUser ? adminUser.email : "admin@pizzahub.com");

      await sendLowStockAlertEmail(adminEmail, itemsNeedingAlert);

      // Mark these items as alert sent
      const itemIds = itemsNeedingAlert.map((item) => item._id);
      await Ingredient.updateMany({ _id: { $in: itemIds } }, { $set: { lowStockAlertSent: true } });

      console.log(`[node-cron] Low-stock alert sent for: ${itemsNeedingAlert.map((i) => i.name).join(", ")}`);
    } else {
      console.log("[node-cron] Inventory check complete: No new low-stock items need alerts.");
    }
  } catch (err) {
    console.error("[node-cron] Low-stock audit error:", err.message);
  }
};

export const initLowStockCron = () => {
  // Run scheduled inventory audit every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("[node-cron] Running scheduled low-stock inventory check...");
    await runLowStockAudit();
  });

  console.log("[node-cron] Scheduled inventory monitoring job initialized.");
};

export const triggerManualLowStockCheck = async () => {
  return runLowStockAudit();
};
