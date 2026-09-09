# PizzaHub — Full-Stack Pizza Delivery & Inventory Platform

> Oasis Infobyte Web Development & Designing Internship — Level 3, Task 1

## Overview

PizzaHub is a production-quality pizza delivery platform with a customer storefront,
a multi-step custom pizza builder, a simulated (test-mode) payment flow, live order
tracking, and a staff kitchen console with real inventory management.

## Problem statement

Small pizzerias lose money in two places: customers order items whose ingredients are
already out of stock, and staff have no live view of stock levels or order progress.

## Solution

Every order is placed through a single atomic database transaction that checks
ingredient stock, deducts it, creates the order, and clears the cart. If any ingredient
is short, the order is rejected with a clear message and nothing is deducted. Staff see
stock and orders live; customers see status changes the moment the kitchen makes them.

## Features

**Customer**
- Registration with validation, password rules and email verification
- Login, protected routes, persisted session
- Forgot password + reset password with expiring recovery links
- Menu of signature pizzas with images, ingredients, price and availability
- 4-step custom pizza builder (base → sauce → cheese → veggies) with live pricing
- Cart with quantity changes, removal, subtotal, delivery fee and total
- Order summary and confirmation before payment
- Test-mode payment sheet; a successful payment confirms the order
- Live order tracking: Order Received → In Kitchen → Sent to Delivery → Delivered
- Order history and editable profile

**Staff / Admin**
- Separate staff sign-in; a normal signup can never grant the admin role
- Dashboard: total orders, pending, completed, revenue, low-stock alerts
- Inventory for bases, sauces, cheeses and vegetables with adjustable stock and thresholds
- Automatic stock deduction on every confirmed order
- Order management with search, status filter, order details and status updates
- Customer directory

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TanStack Router / Start, Tailwind CSS v4 |
| Data | TanStack Query |
| Backend | Lovable Cloud (hosted Postgres + Auth + Realtime) |
| Auth | Email/password with JWT sessions, row-level security, separate `user_roles` table |
| Realtime | Postgres change streams over websockets |
| Payments | Simulated test-mode checkout (no real charges) |

### Note on the requested stack

The brief named Node/Express/MongoDB/Razorpay/Nodemailer/node-cron. This workspace runs
React + TanStack Start against hosted Postgres, so the equivalent capabilities are
implemented natively: SQL functions and row-level security replace Express controllers
and middleware, Postgres replaces MongoDB, JWT auth is handled by the platform's auth
service, and payment is a faithful test-mode simulation because Razorpay keys cannot be
used here. Low-stock email alerts are surfaced in the admin dashboard rather than mailed.

## Architecture

```text
React app (routes, components, hooks)
  └── TanStack Query
        └── Supabase JS client  ── JWT ──►  Postgres
                                             ├── row-level security policies
                                             ├── place_order()  (atomic stock check + deduct)
                                             ├── claim_admin()  (first staff bootstrap)
                                             └── realtime publication on orders
```

## Database structure

| Table | Purpose |
| --- | --- |
| `profiles` | Customer name, email, phone, address (created by signup trigger) |
| `user_roles` | Role grants (`admin` / `user`), kept separate from profiles for security |
| `ingredients` | Bases, sauces, cheeses, veggies with price, stock and low-stock threshold |
| `pizzas` | Signature pizzas with image, description, price, availability |
| `cart_items` | Per-user cart lines, including custom builds |
| `orders` | Customer details, totals, payment reference, status |
| `order_items` | Line items with the exact customisation stored as JSON |

## API overview

Data access is REST/RPC over the Postgres Data API, guarded by row-level security:

- `GET ingredients`, `GET pizzas` — public catalogue
- `GET/POST/PATCH/DELETE cart_items` — owner-scoped
- `POST rpc/place_order` — validates stock, deducts it, creates order + items, clears cart
- `GET orders`, `GET order_items` — owner-scoped; staff see all
- `PATCH orders` — staff only, drives live customer tracking
- `PATCH ingredients` — staff only, stock and threshold updates
- `POST rpc/claim_admin` — bootstraps the first staff account

## Pages

Public: Home, Menu, Login/Register, Forgot Password, Reset Password, Staff Login
Customer: Pizza Builder, Cart, Checkout, Order Tracking, My Orders, Profile
Admin: Dashboard, Orders, Inventory, Customers

## Installation

```bash
npm install      # or: bun install
npm run dev      # start the app
```

The app runs on http://localhost:8080.

## Environment variables

Backend credentials are injected automatically by the hosting platform; see
`.env.example` for the variable names. Never commit real credentials.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

## Test payments

Checkout opens a sandbox payment sheet. No card is charged and no card data is stored.
Confirming the sheet returns a fake payment reference (`pay_test_…`) which is saved on
the order, exactly mirroring a real gateway callback.

## Admin login setup

1. Register a normal account with the email you want to use for staff.
2. Go to `/admin-login` and sign in with it.
3. If no admin exists yet, use "Claim admin access" to become the first staff member.
4. Later staff must be granted the role by an existing admin.

## Screenshots

_Add screenshots of the home page, builder, tracking screen and admin dashboard here._

## Future improvements

- Transactional email for verification, receipts and low-stock alerts
- Scheduled reconciliation job for stock audits
- Delivery-partner app with GPS tracking
- Coupons, loyalty points and saved favourite builds
