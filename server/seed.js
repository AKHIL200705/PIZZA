import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Ingredient } from "./models/Ingredient.js";
import { Pizza } from "./models/Pizza.js";

export const seedDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log("[Seed] Skipping DB seed (MongoDB service not connected locally).");
    return;
  }

  try {
    console.log("[Seed] Checking MongoDB seed state...");

    // Seed Ingredients if empty
    const ingCount = await Ingredient.countDocuments();
    if (ingCount === 0) {
      console.log("[Seed] Seeding ingredients...");
      const ingredientsData = [
        // 5 Pizza Bases (Oasis Infobyte Requirement #3)
        { name: "Thin Crust", category: "base", price: 0, stock_qty: 50, low_stock_threshold: 20, sort_order: 1 },
        { name: "Cheese Burst", category: "base", price: 60, stock_qty: 45, low_stock_threshold: 15, sort_order: 2 },
        { name: "Pan Crust", category: "base", price: 30, stock_qty: 50, low_stock_threshold: 20, sort_order: 3 },
        { name: "Wheat Thin Crust", category: "base", price: 40, stock_qty: 35, low_stock_threshold: 15, sort_order: 4 },
        { name: "Fresh Pan", category: "base", price: 20, stock_qty: 50, low_stock_threshold: 20, sort_order: 5 },

        // 5 Sauces (Oasis Infobyte Requirement #3)
        { name: "Classic Tomato", category: "sauce", price: 0, stock_qty: 50, low_stock_threshold: 20, sort_order: 1 },
        { name: "Spicy Marinara", category: "sauce", price: 20, stock_qty: 40, low_stock_threshold: 15, sort_order: 2 },
        { name: "Creamy Garlic", category: "sauce", price: 30, stock_qty: 30, low_stock_threshold: 10, sort_order: 3 },
        { name: "BBQ Sauce", category: "sauce", price: 30, stock_qty: 45, low_stock_threshold: 15, sort_order: 4 },
        { name: "Basil Pesto", category: "sauce", price: 40, stock_qty: 25, low_stock_threshold: 10, sort_order: 5 },

        // Cheese Options
        { name: "Mozzarella", category: "cheese", price: 50, stock_qty: 60, low_stock_threshold: 20, sort_order: 1 },
        { name: "Cheddar", category: "cheese", price: 60, stock_qty: 50, low_stock_threshold: 15, sort_order: 2 },
        { name: "Parmesan", category: "cheese", price: 70, stock_qty: 40, low_stock_threshold: 10, sort_order: 3 },
        { name: "Gouda", category: "cheese", price: 80, stock_qty: 30, low_stock_threshold: 10, sort_order: 4 },
        { name: "Vegan Cheese", category: "cheese", price: 75, stock_qty: 25, low_stock_threshold: 10, sort_order: 5 },

        // Vegetables (Multiple selection)
        { name: "Red Onion", category: "veggie", price: 30, stock_qty: 80, low_stock_threshold: 25, sort_order: 1 },
        { name: "Capsicum", category: "veggie", price: 30, stock_qty: 75, low_stock_threshold: 25, sort_order: 2 },
        { name: "Button Mushroom", category: "veggie", price: 45, stock_qty: 60, low_stock_threshold: 20, sort_order: 3 },
        { name: "Black Olives", category: "veggie", price: 40, stock_qty: 50, low_stock_threshold: 15, sort_order: 4 },
        { name: "Sweet Corn", category: "veggie", price: 35, stock_qty: 70, low_stock_threshold: 20, sort_order: 5 },
        { name: "Jalapenos", category: "veggie", price: 40, stock_qty: 55, low_stock_threshold: 15, sort_order: 6 },
        { name: "Fresh Tomatoes", category: "veggie", price: 25, stock_qty: 90, low_stock_threshold: 30, sort_order: 7 },
      ];
      await Ingredient.insertMany(ingredientsData);
      console.log("[Seed] Ingredients seeded successfully.");
    }

    // Seed Pizzas if empty
    const pizzaCount = await Pizza.countDocuments();
    if (pizzaCount === 0) {
      console.log("[Seed] Seeding menu pizzas...");
      const pizzasData = [
        {
          name: "Classic Margherita",
          description: "Classic blend of ripe tomatoes, creamy mozzarella & fresh basil herbs.",
          price: 299,
          image_key: "margherita",
          is_available: true,
        },
        {
          name: "Farmhouse Veggie",
          description: "Crisp capsicum, juicy tomatoes, red onions & succulent mushrooms.",
          price: 399,
          image_key: "farmhouse",
          is_available: true,
        },
        {
          name: "Fiery Jalapeno & Corn",
          description: "Spicy jalapenos, golden sweet corn, chili flakes & extra cheddar melt.",
          price: 449,
          image_key: "supreme",
          is_available: true,
        },
        {
          name: "Smokey BBQ Paneer",
          description: "Tender paneer cubes smothered in rich BBQ sauce with crunchy onions.",
          price: 479,
          image_key: "bbq",
          is_available: true,
        },
      ];
      await Pizza.insertMany(pizzasData);
      console.log("[Seed] Pizzas seeded successfully.");
    }

    // Seed Admin Account
    const adminUser = await User.findOne({ email: "admin@pizzahub.com" });
    if (!adminUser) {
      const hashedAdminPassword = await bcrypt.hash("AdminPass123", 10);
      await User.create({
        name: "Kitchen Manager",
        email: "admin@pizzahub.com",
        password: hashedAdminPassword,
        role: "admin",
        isVerified: true,
      });
      console.log("[Seed] Admin user created: admin@pizzahub.com / AdminPass123");
    }

    // Seed Test User Account
    const demoUser = await User.findOne({ email: "user@pizzahub.com" });
    if (!demoUser) {
      const hashedUserPassword = await bcrypt.hash("UserPass123", 10);
      await User.create({
        name: "Demo Customer",
        email: "user@pizzahub.com",
        password: hashedUserPassword,
        role: "user",
        isVerified: true,
      });
      console.log("[Seed] Demo user created: user@pizzahub.com / UserPass123");
    }
  } catch (err) {
    console.error("[Seed] Error seeding database:", err.message);
  }
};
