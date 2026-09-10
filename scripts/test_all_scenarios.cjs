const crypto = require("crypto");
const io = require("socket.io-client");
require("dotenv").config();

const BASE_URL = "http://localhost:5000";

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log("====================================================");
  console.log("RUNNING COMPLETE OASIS INFOBYTE 7-SCENARIO TEST SUITE");
  console.log("====================================================\n");

  let results = {};

  // ----------------------------------------------------
  // TEST 1: Register -> Verify Email -> Login -> Build Pizza -> Order -> Payment -> Inventory Deducted
  // ----------------------------------------------------
  console.log(">>> TEST 1: User Registration, Verification, Order & Atomic Inventory Deduction");
  const testUserEmail = `oasis_candidate_${Date.now()}@example.com`;
  const testUserPassword = "TestPassword@123";

  // 1. Register
  const regRes = await api("/api/auth/register", {
    method: "POST",
    body: { name: "Oasis Candidate", email: testUserEmail, password: testUserPassword },
  });
  console.log(`- Registration status: HTTP ${regRes.status} (${regRes.data?.message})`);

  // 2. Unverified login check
  const unverifiedLogin = await api("/api/auth/login", {
    method: "POST",
    body: { email: testUserEmail, password: testUserPassword },
  });
  console.log(
    `- Unverified login rejection: ${unverifiedLogin.status === 403 ? "PASS (HTTP 403 Forbidden)" : "FAIL"}`,
  );

  // 3. Verify email using token returned in development
  const verifyToken = regRes.data?.verificationToken;
  const verRes = await api(`/api/auth/verify-email?token=${verifyToken}`);
  console.log(`- Verify email status: HTTP ${verRes.status} (${verRes.data?.message})`);

  // 4. Login after verification
  const loginRes = await api("/api/auth/login", {
    method: "POST",
    body: { email: testUserEmail, password: testUserPassword },
  });
  const userToken = loginRes.data?.token;
  const userId = loginRes.data?.user?.id;
  console.log(
    `- Post-verification login: ${loginRes.status === 200 ? "SUCCESS" : "FAIL"} (User: ${loginRes.data?.user?.name})`,
  );

  // 5. Check baseline inventory of Thin Crust
  const invBaselineRes = await api("/api/ingredients");
  const thinCrust = invBaselineRes.data?.find((i) => i.name.toLowerCase().includes("thin"));
  const baselineQty = thinCrust?.stock_qty || 0;
  console.log(`- Baseline '${thinCrust?.name}' stock: ${baselineQty}`);

  // 6. Create Razorpay order
  const rpOrderRes = await api("/api/payment/create-order", {
    method: "POST",
    body: { amount: 450 },
  });
  console.log(
    `- Razorpay order creation: ${rpOrderRes.status === 200 ? "SUCCESS" : "FAIL"} (id: ${rpOrderRes.data?.id})`,
  );

  // 7. Generate valid test HMAC-SHA256 signature
  const rpKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const testPaymentId = "pay_test_" + Date.now();
  let validSignature = "mock_valid_signature";
  if (rpKeySecret) {
    const signaturePayload = `${rpOrderRes.data?.id}|${testPaymentId}`;
    validSignature = crypto
      .createHmac("sha256", rpKeySecret)
      .update(signaturePayload)
      .digest("hex");
  }

  // 8. Confirm Order with signature and custom pizza items
  const orderRes = await api("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      customer_name: "Oasis Candidate",
      phone: "9876543210",
      address: "42 Oasis Avenue, Sector 5, City",
      user_id: userId,
      payment_id: testPaymentId,
      razorpay_order_id: rpOrderRes.data?.id,
      razorpay_signature: validSignature,
      items: [
        {
          name: "Custom Pizza Deluxe",
          quantity: 1,
          unit_price: 450,
          details: {
            base: thinCrust ? thinCrust.name : "Thin Crust",
            sauce: "Classic Tomato Sauce",
            cheese: "Mozzarella",
            veggies: ["Bell Peppers", "Mushrooms"],
          },
        },
      ],
    },
  });

  console.log(
    `- Order creation & payment confirmation: HTTP ${orderRes.status} (Order ID: ${orderRes.data?.orderId})`,
  );

  // 9. Verify inventory decremented
  const invAfterRes = await api("/api/ingredients");
  const thinCrustAfter = invAfterRes.data?.find((i) => i.name.toLowerCase().includes("thin"));
  console.log(
    `- '${thinCrustAfter?.name}' stock after order: ${thinCrustAfter?.stock_qty} (Decremented by 1: ${baselineQty - 1 === thinCrustAfter?.stock_qty})`,
  );

  results["TEST 1"] =
    orderRes.status === 201 && baselineQty - 1 === thinCrustAfter?.stock_qty ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 1: ${results["TEST 1"]}\n`);

  const createdOrderId = orderRes.data?.orderId;

  // ----------------------------------------------------
  // TEST 2: Admin Login, Inventory & Threshold Management
  // ----------------------------------------------------
  console.log(">>> TEST 2: Admin Login & Inventory Management");
  const adminLoginRes = await api("/api/auth/admin/login", {
    method: "POST",
    body: { email: "admin@pizzahub.com", password: "Admin@123456" },
  });
  const adminToken = adminLoginRes.data?.token;
  console.log(
    `- Admin login status: HTTP ${adminLoginRes.status} (Role: ${adminLoginRes.data?.user?.role})`,
  );

  // Update threshold and stock via PATCH /api/ingredients/:id
  let thresholdUpdateOk = false;
  let stockUpdateOk = false;
  if (thinCrustAfter) {
    const updateThresh = await api(`/api/ingredients/${thinCrustAfter._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { low_stock_threshold: 15 },
    });
    console.log(
      `- Update threshold to 15: HTTP ${updateThresh.status} (New threshold: ${updateThresh.data?.ingredient?.low_stock_threshold})`,
    );
    thresholdUpdateOk = updateThresh.status === 200;

    const updateStock = await api(`/api/ingredients/${thinCrustAfter._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { stock_qty: 60 },
    });
    console.log(
      `- Update quantity to 60: HTTP ${updateStock.status} (New stock: ${updateStock.data?.ingredient?.stock_qty})`,
    );
    stockUpdateOk = updateStock.status === 200;
  }
  results["TEST 2"] =
    adminLoginRes.status === 200 && thresholdUpdateOk && stockUpdateOk ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 2: ${results["TEST 2"]}\n`);

  // ----------------------------------------------------
  // TEST 3: Order Status Progression & Socket.IO Real-time updates
  // ----------------------------------------------------
  console.log(">>> TEST 3: Order Status Progression & Real-Time Socket Updates");
  let socketReceivedEvent = false;
  let socketLastStatus = null;

  const socket = io(BASE_URL, { transports: ["websocket"] });
  await new Promise((resolve) => {
    socket.on("connect", () => {
      console.log(`- Socket connected: ${socket.id}`);
      socket.emit("join_order", createdOrderId);
      resolve();
    });
  });

  socket.on("order:status_updated", (payload) => {
    console.log(`  [Socket Event Received] Order ${payload.orderId} status: "${payload.status}"`);
    socketReceivedEvent = true;
    socketLastStatus = payload.status;
  });

  const statuses = ["In Kitchen", "Sent to Delivery", "Delivered"];
  let statusTransitionOk = true;

  for (const st of statuses) {
    const updateRes = await api(`/api/orders/admin/${createdOrderId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: st },
    });
    if (updateRes.status !== 200) {
      statusTransitionOk = false;
      console.log(
        `- Transition to '${st}' failed: HTTP ${updateRes.status} (${updateRes.data?.message})`,
      );
    } else {
      console.log(`- Transitioned order status to: '${st}'`);
    }
    // Allow brief time for socket event propagation
    await new Promise((r) => setTimeout(r, 200));
  }

  socket.disconnect();
  results["TEST 3"] = statusTransitionOk && socketReceivedEvent ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 3: ${results["TEST 3"]}\n`);

  // ----------------------------------------------------
  // TEST 4: Attempt order with insufficient inventory
  // ----------------------------------------------------
  console.log(">>> TEST 4: Attempt Order With Insufficient Inventory");
  const allInv = await api("/api/ingredients");
  const testIng = allInv.data?.[0];
  await api(`/api/ingredients/${testIng._id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { stock_qty: 0 },
  });

  const excessiveOrder = await api("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      customer_name: "Tester",
      phone: "9876543210",
      address: "Test Address",
      payment_id: "pay_test_excessive",
      items: [
        {
          name: "Custom Pizza",
          quantity: 5,
          unit_price: 300,
          details: {
            base: testIng.name,
            sauce: "Classic Tomato Sauce",
            cheese: "Mozzarella",
            veggies: [],
          },
        },
      ],
    },
  });
  console.log(
    `- Insufficient inventory order response: HTTP ${excessiveOrder.status} (${excessiveOrder.data?.message})`,
  );

  // Verify stock remained 0 and never became negative
  const invCheck = await api("/api/ingredients");
  const postCheckIng = invCheck.data?.find((i) => i._id === testIng._id);
  console.log(
    `- Stock remaining: ${postCheckIng?.stock_qty} (Negative prevented: ${postCheckIng?.stock_qty >= 0})`,
  );

  // Restock for future tests
  await api(`/api/ingredients/${testIng._id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { stock_qty: 50 },
  });

  results["TEST 4"] =
    excessiveOrder.status === 400 && postCheckIng?.stock_qty >= 0 ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 4: ${results["TEST 4"]}\n`);

  // ----------------------------------------------------
  // TEST 5: Attempt Admin API using normal user JWT
  // ----------------------------------------------------
  console.log(">>> TEST 5: Role-Based Authorization Security");
  const adminApiAttempt = await api("/api/orders/admin/all", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(
    `- Normal user accessing /api/orders/admin/all: HTTP ${adminApiAttempt.status} (${adminApiAttempt.data?.message})`,
  );

  const adminInvAttempt = await api(`/api/ingredients/${testIng._id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${userToken}` },
    body: { stock_qty: 999 },
  });
  console.log(
    `- Normal user updating inventory: HTTP ${adminInvAttempt.status} (${adminInvAttempt.data?.message})`,
  );

  results["TEST 5"] =
    adminApiAttempt.status === 403 && adminInvAttempt.status === 403 ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 5: ${results["TEST 5"]}\n`);

  // ----------------------------------------------------
  // TEST 6: Invalid Razorpay Signature Verification
  // ----------------------------------------------------
  console.log(">>> TEST 6: Cryptographic Razorpay Signature Rejection");
  const forgedPayment = await api("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      customer_name: "Tester",
      phone: "9876543210",
      address: "Test Address",
      payment_id: "pay_fake_456",
      razorpay_order_id: "order_fake_123",
      razorpay_signature: "forged_invalid_signature_hash_xyz",
      items: [
        {
          name: "Custom Pizza",
          quantity: 1,
          unit_price: 300,
          details: {
            base: "Thin Crust",
            sauce: "Classic Tomato Sauce",
            cheese: "Mozzarella",
            veggies: [],
          },
        },
      ],
    },
  });
  console.log(
    `- Forged signature order response: HTTP ${forgedPayment.status} (${forgedPayment.data?.message})`,
  );
  results["TEST 6"] = forgedPayment.status === 400 ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 6: ${results["TEST 6"]}\n`);

  // ----------------------------------------------------
  // TEST 7: Failed Payment -> No Permanent Inventory Deduction
  // ----------------------------------------------------
  console.log(">>> TEST 7: Payment Failure Safety Check");
  const invPreFail = await api("/api/ingredients");
  const cheesePre = invPreFail.data?.find((i) => i.name.toLowerCase().includes("mozzarella"));
  const cheeseQtyPre = cheesePre?.stock_qty || 0;

  const failedAttempt = await api("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      customer_name: "Fail Test",
      phone: "9876543210",
      address: "Fail Address",
      payment_id: "pay_unpaid",
      razorpay_order_id: "order_unpaid",
      razorpay_signature: "tampered_or_invalid",
      items: [
        {
          name: "Custom Pizza",
          quantity: 10,
          unit_price: 2000,
          details: {
            cheese: cheesePre?.name,
          },
        },
      ],
    },
  });

  const invPostFail = await api("/api/ingredients");
  const cheesePost = invPostFail.data?.find((i) => i.name.toLowerCase().includes("mozzarella"));
  console.log(`- Pre-attempt cheese quantity: ${cheeseQtyPre}`);
  console.log(`- Post-attempt cheese quantity: ${cheesePost?.stock_qty}`);
  console.log(`- Stock unchanged on payment failure: ${cheeseQtyPre === cheesePost?.stock_qty}`);

  results["TEST 7"] =
    failedAttempt.status === 400 && cheeseQtyPre === cheesePost?.stock_qty ? "PASS" : "FAIL";
  console.log(`>>> RESULT TEST 7: ${results["TEST 7"]}\n`);

  // Summary
  console.log("====================================================");
  console.log("ALL OASIS TEST RESULTS:");
  console.log(JSON.stringify(results, null, 2));
  console.log("====================================================");

  process.exit(Object.values(results).every((r) => r === "PASS") ? 0 : 1);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
