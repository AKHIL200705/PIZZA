# 🍕 PizzaHub — Full-Stack Pizza Delivery & Inventory Platform

> **Oasis Infobyte Web Development & Designing Internship — Level 3, Task 1**  
> **Author**: Akhil Sai  
> **Live Demo**: [https://pizza-seven-virid.vercel.app](https://pizza-seven-virid.vercel.app)  
> **GitHub Repository**: [https://github.com/AKHIL200705/PIZZA](https://github.com/AKHIL200705/PIZZA)

---

## 📌 Project Overview

**PizzaHub** is an end-to-end, production-grade pizza ordering and inventory management platform built according to the Oasis Infobyte Level 3 specifications. It features a modern customer storefront, a 4-step custom pizza builder, Google OAuth & JWT authentication, official Razorpay Test Mode payment gateway integration, live order status tracking, and a dedicated admin kitchen dashboard with automated inventory monitoring via `node-cron` and `nodemailer`.

---

## ✅ Oasis Infobyte Level 3 Requirements Audit

### 👤 Customer Features
- [x] **User Registration & Login**: Secure password hashing (`bcryptjs`) and JWT token authentication.
- [x] **Email Verification & Password Reset**: Tokenized verification and recovery links via Nodemailer.
- [x] **Google Sign-In**: Official Google Identity Services OAuth 2.0 integration with automatic user onboarding.
- [x] **Signature Pizza Catalogue**: Menu of specialty pizzas with high-resolution imagery, pricing, and stock status.
- [x] **4-Step Custom Pizza Builder**:
  1. **Step 1 — Pizza Base**: Thin Crust, Cheese Burst, Pan Crust, Wheat Thin Crust, Fresh Pan.
  2. **Step 2 — Sauce**: Classic Tomato, Spicy Marinara, Creamy Garlic, BBQ Sauce, Basil Pesto.
  3. **Step 3 — Cheese**: Mozzarella, Cheddar, Parmesan, Gouda, Vegan Cheese.
  4. **Step 4 — Veggies**: Red Onion, Capsicum, Button Mushroom, Black Olives, Sweet Corn, Jalapenos, Fresh Tomatoes.
- [x] **Dynamic Pricing Cart**: Real-time pricing calculations, quantity updates, and promo codes.
- [x] **Razorpay Test Payment Gateway**: Official Razorpay Checkout JS modal (`rzp_test_TaEOgKzOb6ODmx`) supporting test cards.
- [x] **Live Order Status Tracking**: Real-time tracking pipeline (*Order Received* → *In Kitchen* → *Sent to Delivery* → *Delivered*).
- [x] **Order History & Profile**: Customer order history with detailed customization breakdown.

### 👨‍💼 Admin / Kitchen Console Features
- [x] **Dedicated Staff Login**: Separate `/admin-login` entry preventing standard signup privilege escalation.
- [x] **Inventory Dashboard**: Live stock management for Bases, Sauces, Cheeses, and Vegetables.
- [x] **Atomic Stock Decrement**: Placing an order automatically deducts all component ingredients; out-of-stock items reject order creation.
- [x] **Manual Stock & Threshold Adjustments**: Admin can replenish inventory and configure custom low-stock thresholds.
- [x] **Automated Low-Stock Alerts**: Instant notification triggered when any ingredient falls below threshold.
- [x] **Scheduled Inventory Audits**: Background cron job (`node-cron`) auditing stock levels every 15 minutes.
- [x] **Order Management Panel**: Real-time view of incoming orders and status updater.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TanStack Router / Start, Tailwind CSS v4, Lucide Icons, Sonner |
| **Backend API** | Node.js, Express.js (`server/index.js`) |
| **Database** | MongoDB Atlas / Mongoose (`User`, `Ingredient`, `Order`, `Pizza` models) |
| **Authentication** | JWT (`jsonwebtoken`), Google OAuth (`@react-oauth/google` / `google-auth-library`), `bcryptjs` |
| **Payments** | Razorpay Test Mode Gateway (`razorpay` SDK + `checkout.js` modal) |
| **Scheduled Jobs** | `node-cron` |
| **Email Services** | `nodemailer` (SMTP Gmail) |

---

## 🏗 System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Frontend                        │
│   (React 19 + TanStack Router + Tailwind CSS v4 on Vercel)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / OAuth
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express Backend                   │
│  ├── Auth Routes (JWT, Register, Login, Google OAuth)       │
│  ├── Pizza & Ingredient Routes (Catalogue & Stock Mgmt)     │
│  ├── Order Routes (Atomic Stock Decrement & Tracking)       │
│  └── Payment Routes (Razorpay Order Creation & Verification)│
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────────┐ ┌───────────┐ ┌──────────────────────┐
│    MongoDB Atlas     │ │ Razorpay  │ │  Background Workers  │
│  (Users, Orders,     │ │ Test Mode │ │  ├── node-cron       │
│   Ingredients, Stock)│ │ Gateway   │ │  └── nodemailer SMTP │
└──────────────────────┘ └───────────┘ └──────────────────────┘
```

---

## 🔑 Default Credentials for Evaluation

### Admin Account
- **URL**: [https://pizza-seven-virid.vercel.app/admin-login](https://pizza-seven-virid.vercel.app/admin-login)
- **Email**: `admin@pizzahub.com`
- **Password**: `Admin@123456`

### Customer Account
- **Option 1**: Click **"Sign in with Google"** on the [Sign In page](https://pizza-seven-virid.vercel.app/auth).
- **Option 2**: Register any new account with your email.

### Razorpay Test Mode Payment Details
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date (e.g., `12/28`)
- **CVV**: `123`
- **OTP**: Any 6 digits (e.g., `123456`)

---

## 🚀 Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/AKHIL200705/PIZZA.git
cd PIZZA
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret"
ADMIN_EMAIL="admin@pizzahub.com"

RAZORPAY_KEY_ID="rzp_test_TaEOgKzOb6ODmx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
VITE_RAZORPAY_KEY_ID="rzp_test_TaEOgKzOb6ODmx"

GOOGLE_CLIENT_ID="513278132086-oph50arjcimdqb5c4a6jjqmflo0a1gg6.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="513278132086-oph50arjcimdqb5c4a6jjqmflo0a1gg6.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
```

### 4. Start the servers
```bash
# Terminal 1: Start Express backend
npm run server

# Terminal 2: Start Vite frontend
npm run dev
```

- Frontend runs on **`http://localhost:8080`**
- Backend API runs on **`http://localhost:5000`**

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer account & send verification email | Public |
| `GET` | `/api/auth/verify-email` | Verify email address via token | Public |
| `POST` | `/api/auth/login` | Authenticate customer & issue JWT | Public |
| `POST` | `/api/auth/google-login` | Sign in with Google OAuth ID Token | Public |
| `POST` | `/api/auth/admin/login` | Separate administrator authentication | Admin |
| `GET` | `/api/pizzas` | Fetch signature pizza catalogue | Public |
| `GET` | `/api/ingredients` | Fetch all bases, sauces, cheeses, and veggies with stock | Public |
| `POST` | `/api/payment/create-order` | Generate Razorpay order ID | Protected |
| `POST` | `/api/payment/verify-payment` | Verify Razorpay HMAC signature | Protected |
| `POST` | `/api/orders` | Place order with atomic ingredient decrement | Protected |
| `GET` | `/api/orders/:id` | Get live order details & delivery status | Public/Protected |
| `GET` | `/api/orders/user/:id` | Fetch customer order history | Protected |
| `GET` | `/api/orders/admin/all` | Fetch all kitchen orders | Admin |
| `PATCH`| `/api/orders/admin/:id/status`| Advance order status (kitchen/delivery/delivered) | Admin |
| `PATCH`| `/api/ingredients/:id` | Update ingredient stock quantity or low-stock threshold | Admin |
