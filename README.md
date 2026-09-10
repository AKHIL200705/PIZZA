# 🍕 PizzaHub — Full-Stack Pizza Delivery & Inventory Platform

> **Oasis Infobyte Web Development & Designing Internship**  
> **Level**: Level 3 — Task 1: Pizza Delivery Full-Stack Application  
> **Author**: Akhil Sai  
> **Live Demo URL**: [https://pizza-seven-virid.vercel.app](https://pizza-seven-virid.vercel.app)  
> **GitHub Repository**: [https://github.com/AKHIL200705/PIZZA](https://github.com/AKHIL200705/PIZZA)

---

## 📌 Project Overview

**PizzaHub** is a production-ready, full-stack pizza ordering, customization, and kitchen inventory management application designed and built specifically for the **Oasis Infobyte Level 3 Web Development & Designing Internship**.

The platform provides an engaging customer storefront with interactive 3D visual pizza customization, secure JWT authentication with mandatory email verification, Google OAuth 2.0 single sign-on, official **Razorpay Test Mode** payment gateway integration with HMAC-SHA256 signature verification, and real-time Socket.IO order status tracking.

For kitchen managers and administrators, PizzaHub provides a **strictly separated admin portal** (`/admin-login`), real-time stock management with atomic transaction-safe inventory deduction, automated email alerts for low-stock ingredients, and scheduled cron inventory audits (`node-cron`).

---

## 🎯 Problem Statement

Traditional online food ordering platforms frequently encounter challenges around:

1. **Inventory Race Conditions**: Multiple users ordering custom items containing the same finite ingredients concurrently, causing negative stock.
2. **Privilege Escalation**: Administrative interfaces sharing authentication endpoints with customer signups, allowing unauthorized role escalation.
3. **Payment Security**: Reliance on frontend payment success callbacks without cryptographic backend HMAC signature verification.
4. **Kitchen Bottlenecks**: Lack of automated low-stock notifications leading to mid-service ingredient shortages and cancelled orders.

**PizzaHub solves these challenges** through atomic MongoDB transactions, isolated staff authentication routes, cryptographic Razorpay payment verification, and automated background stock monitoring.

---

## 🔑 Demo Credentials for Internship Evaluation

### 👨‍🍳 Admin Kitchen Console

- **Login URL**: [https://pizza-seven-virid.vercel.app/admin-login](https://pizza-seven-virid.vercel.app/admin-login)
- **Admin Email**: `admin@pizzahub.com`
- **Admin Password**: `Admin@123456`
- **Role**: `admin` (Full access to inventory, stock adjustments, thresholds, and kitchen order processing)

### 👤 Customer Account

- **Option 1 (Instant)**: Click **"Sign in with Google"** on the [Sign In page](https://pizza-seven-virid.vercel.app/auth).
- **Option 2 (Standard)**: Register with any email (or use demo: `user@pizzahub.com` / `User@123456`).

### 💳 Razorpay Test Mode Payment Details

- **Test Card Number**: `4111 1111 1111 1111`
- **Cardholder**: Any name (e.g. `Test Customer`)
- **Expiry**: Any future date (e.g. `12/28`)
- **CVV**: `123`
- **OTP**: Any 6 digits (e.g. `123456`)

---

## 🚀 Key Features

### 👤 Customer Experience

- **Interactive Visual Pizza Canvas**: 4-step custom builder layering crust, rich tomato/pesto sauces, melted cheese, and fresh vegetable toppings dynamically.
- **Pre-Configured Signature Menu**: Classic Margherita, Farmhouse Veggie, Fiery Jalapeno & Corn, and Smokey BBQ Paneer.
- **Mandatory Email Verification**: Tokenized verification links with 24-hour expiration dispatched via Nodemailer. Unverified logins are strictly blocked.
- **Resend Verification & Password Reset**: Dedicated rate-limited verification resend and opaque forgot-password recovery.
- **Dynamic Cart & Checkout**: Real-time total calculation, delivery fees, and discount promo codes (`OASIS10`, `PIZZA20`, `FREEDEL`).
- **Cryptographic Payment Gateway**: Razorpay Test Mode Checkout with backend HMAC-SHA256 signature verification.
- **Real-Time Order Tracking**: Multi-stage delivery tracker (_Order Received_ → _In Kitchen_ → _Sent to Delivery_ → _Delivered_) powered by Socket.IO and polling fallbacks with printable thermal invoices.

### 👨‍💼 Kitchen Manager & Admin Features

- **Strictly Separated Admin Login**: Isolated `/admin-login` route backed by `POST /api/auth/admin/login`; normal customer registration can never grant admin access.
- **Real-Time Inventory Dashboard**: Categorized live audit of all Pizza Bases, Sauces, Cheeses, and Vegetables with stock counters and status pills (`IN STOCK`, `LOW STOCK`, `OUT OF STOCK`).
- **Atomic Stock Deduction**: Automatically deducts all component ingredients when an order is created, rejecting orders if any ingredient quantity is insufficient (`stock_qty < requiredQty`).
- **Manual Stock & Threshold Controls**: Quick +1, -1, +10, +50 restock controls, direct exact stock editing, and custom low-stock threshold configuration.
- **Automated Low-Stock Email Alerts**: Dispatches alert emails to `ADMIN_EMAIL` with stateful deduplication (`lowStockAlertSent`) to prevent duplicate notification spam.
- **Scheduled Inventory Audits**: Automated cron job (`node-cron`) evaluating ingredient stock every 15 minutes.
- **Kitchen Order Management**: Searchable and filterable order queue with details modal showing customer phone, address, payment ID, and custom pizza ingredients.

---

## 🧩 4-Step Custom Pizza Customization

| Category                       | Available Ingredients (Oasis Infobyte Compliant)                                          |
| :----------------------------- | :---------------------------------------------------------------------------------------- |
| **1. Pizza Bases (5 Options)** | Thin Crust, Cheese Burst, Pan Crust, Wheat Thin Crust, Fresh Pan                          |
| **2. Sauces (5 Options)**      | Classic Tomato, Spicy Marinara, Creamy Garlic, BBQ Sauce, Basil Pesto                     |
| **3. Cheese Options**          | Mozzarella, Cheddar, Parmesan, Gouda, Vegan Cheese                                        |
| **4. Vegetables**              | Red Onion, Capsicum, Button Mushroom, Black Olives, Sweet Corn, Jalapenos, Fresh Tomatoes |

---

## 🛠 Technology Stack

| Layer                | Technology                                                 | Purpose                                          |
| :------------------- | :--------------------------------------------------------- | :----------------------------------------------- |
| **Frontend**         | React 19, TypeScript, TanStack Router, TanStack Query      | Reactive SPA with route-level safety             |
| **Styling**          | Tailwind CSS v4, Custom CSS Design System                  | PizzaHub fire & stone-oven aesthetic             |
| **Backend API**      | Node.js, Express.js                                        | Modular RESTful API and WebSocket engine         |
| **Real-Time Engine** | Socket.IO                                                  | Instant push updates from kitchen to customer    |
| **Database**         | MongoDB Atlas, Mongoose ODM                                | Multi-document transactions & atomic decrement   |
| **Authentication**   | JWT (`jsonwebtoken`), `bcryptjs`, Google Identity Services | Secure authentication & role-based authorization |
| **Payments**         | Razorpay Node.js SDK & Razorpay Checkout JS                | Test mode payment orders and HMAC verification   |
| **Task Scheduling**  | `node-cron`                                                | Periodic low-stock inventory audits              |
| **Email Service**    | Nodemailer                                                 | Transactional verification, reset & alert emails |

---

## 🏗 Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Frontend                        │
│   (React 19 + TanStack Router + Tailwind CSS v4 on Vercel)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express Backend                   │
│  ├── Auth Routes (POST /login, POST /admin/login, verify)   │
│  ├── Ingredient Routes (GET /ingredients, PATCH /:id)       │
│  ├── Order Routes (Atomic Stock Deduction & Tracking)       │
│  ├── Payment Routes (Create Order, Verify HMAC Signature)   │
│  └── Real-Time Socket.IO Server Engine                      │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────────┐ ┌───────────┐ ┌──────────────────────┐
│    MongoDB Atlas     │ │ Razorpay  │ │  Background Workers  │
│  (Users, Orders,     │ │ Test Mode │ │  ├── node-cron (15m) │
│   Ingredients, Stock)│ │ Gateway   │ │  └── Nodemailer SMTP │
└──────────────────────┘ └───────────┘ └──────────────────────┘
```

---

## 🗄 Database Models

### `User`

- `name` (String, required)
- `email` (String, required, unique, lowercase)
- `password` (String, bcrypt hashed)
- `role` (String, enum: `["user", "admin"]`, default: `"user"`)
- `isVerified` (Boolean, default: `false`)
- `verificationToken` (String, nullable)
- `verificationTokenExpires` (Date, nullable)
- `resetPasswordToken` (String, nullable)
- `resetPasswordExpires` (Date, nullable)
- `phone` (String)
- `address` (String)

### `Ingredient`

- `name` (String, required)
- `category` (String, enum: `["base", "sauce", "cheese", "veggie"]`)
- `price` (Number, required)
- `stock_qty` (Number, required, minimum: 0)
- `low_stock_threshold` (Number, required)
- `lowStockAlertSent` (Boolean, default: `false` — prevents duplicate email spam)
- `sort_order` (Number)

### `Order`

- `user` (ObjectId referencing User, nullable)
- `customer_name` (String, required)
- `phone` (String, required)
- `address` (String, required)
- `items` (Array of pizza objects with details, quantities, unit prices)
- `subtotal` (Number)
- `delivery_fee` (Number, default: 49)
- `total` (Number)
- `payment_id` (String, required)
- `razorpay_order_id` (String)
- `payment_status` (String, default: `"paid"`)
- `status` (String, enum: `["Order Received", "In Kitchen", "Sent to Delivery", "Delivered", "Cancelled"]`)

---

## 📡 API Endpoint Reference

| Method  | Endpoint                        | Description                                                    | Auth Required      |
| :------ | :------------------------------ | :------------------------------------------------------------- | :----------------- |
| `POST`  | `/api/auth/register`            | Register new customer account & send verification email        | Public             |
| `GET`   | `/api/auth/verify-email`        | Validate verification token & activate account                 | Public             |
| `POST`  | `/api/auth/resend-verification` | Request a fresh verification link                              | Public             |
| `POST`  | `/api/auth/login`               | Authenticate customer (enforces `isVerified`)                  | Public             |
| `POST`  | `/api/auth/admin/login`         | Dedicated staff sign-in (strictly enforces `role === 'admin'`) | Public             |
| `POST`  | `/api/auth/forgot-password`     | Opaque password reset email dispatcher                         | Public             |
| `POST`  | `/api/auth/reset-password`      | Set new password with secure token                             | Public             |
| `GET`   | `/api/auth/me`                  | Fetch authenticated user profile                               | Customer / Admin   |
| `GET`   | `/api/ingredients`              | List all ingredients with live stock counts                    | Public             |
| `PATCH` | `/api/ingredients/:id`          | Adjust ingredient stock quantity or low-stock threshold        | Admin Only         |
| `GET`   | `/api/pizzas`                   | List signature menu pizzas                                     | Public             |
| `POST`  | `/api/payment/create-order`     | Create Razorpay order (Test Mode)                              | Public / Protected |
| `POST`  | `/api/payment/verify-payment`   | Verify Razorpay HMAC-SHA256 signature                          | Public / Protected |
| `POST`  | `/api/orders`                   | Place order with atomic ingredient stock deduction             | Customer / Guest   |
| `GET`   | `/api/orders/:id`               | Get single order details for live tracking                     | Public / Protected |
| `GET`   | `/api/orders/user/:userId`      | Customer order history (ownership verified)                    | Customer / Admin   |
| `GET`   | `/api/orders/admin/all`         | Kitchen order queue                                            | Admin Only         |
| `PATCH` | `/api/orders/admin/:id/status`  | Update order status & broadcast via Socket.IO                  | Admin Only         |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory (see `.env.example`):

```env
# Server & Port
PORT=5000
FRONTEND_URL=http://localhost:8080
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pizzahub?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_EMAIL=admin@pizzahub.com

# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id

# Nodemailer Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend Backend API Target
VITE_API_URL=http://localhost:5000
```

---

## 💻 Local Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/AKHIL200705/PIZZA.git
cd PIZZA
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string and credentials
```

### 3. Start Backend API & Database Seeder

```bash
npm run server
```

_Seeds 22 ingredients (5 bases, 5 sauces, cheeses, multiple vegetables), menu pizzas, and demo accounts automatically._

### 4. Start Frontend Client (in a second terminal)

```bash
npm run dev
```

Open **`http://localhost:8080`** in your browser.

---

## 📸 Application Highlights

- **Luxury Stone-Oven Homepage**: High-impact branding, interactive statistics, and direct action prompts.
- **Visual Pizza Builder**: Live canvas rendering each crust, sauce, cheese melt, and veggie selection with interactive cost tracking.
- **Dedicated Kitchen Console**: Real-time order progression queue with customer contact info and printable invoices.
- **Stock Audit Center**: Instant visual flags for low stock and automated Nodemailer notification triggers.

---

## 🔮 Future Enhancements

- Delivery partner GPS geolocation tracking via WebSockets.
- Customer loyalty points & referral rewards program.
- SMS OTP notifications via Twilio gateway.
