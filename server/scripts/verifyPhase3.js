const { fork } = require("child_process");
const http = require("http");
const crypto = require("crypto");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { db, auth } = require("../firebaseAdmin");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SERVER_URL = "http://localhost:3001";
let spawnedServer = null;

// Client auth for generating ID tokens
const clientApp = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCvENhVhJc7CqRMNVWiZwFpG-R0c9vRqVU",
  authDomain: "gen-lang-client-0022579334.firebaseapp.com",
  projectId: "gen-lang-client-0022579334"
});
const clientAuth = getAuth(clientApp);

async function ensureServerRunning() {
  try {
    const res = await fetch(`${SERVER_URL}/health`);
    if (res.ok) return;
  } catch (e) {
    console.log("Starting Califnco server instance for integration tests...");
    spawnedServer = fork(path.resolve(__dirname, "../index.js"), [], {
      stdio: "ignore"
    });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 250));
      try {
        const res = await fetch(`${SERVER_URL}/health`);
        if (res.ok) {
          console.log("Server instance is ready.\n");
          return;
        }
      } catch (err) {}
    }
  }
}

async function postJson(endpoint, data, token) {
  const url = `${SERVER_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return { status: res.status, data: json };
}

async function getJson(endpoint) {
  const url = `${SERVER_URL}${endpoint}`;
  const res = await fetch(url);
  const json = await res.json();
  return { status: res.status, data: json };
}

async function runTests() {
  console.log("==========================================");
  console.log("   PHASE 3 SERVER INTEGRATION TEST SUITE");
  console.log("==========================================\n");

  await ensureServerRunning();

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Health check
  console.log("1. Testing Server Health Endpoint...");
  const health = await getJson("/health");
  assert(health.status === 200 && health.data.status === "ok", "GET /health returns status: ok");

  // 2. Fetch test users and generate ID tokens
  const custCred = await signInWithEmailAndPassword(clientAuth, "customer@test.com", "Customer@123456");
  const custToken = await custCred.user.getIdToken();

  const approvedCred = await signInWithEmailAndPassword(clientAuth, "dealer@test.com", "Dealer@123456");
  const approvedDealerToken = await approvedCred.user.getIdToken();

  const pendingCred = await signInWithEmailAndPassword(clientAuth, "dealer.pending@test.com", "Dealer@123456");
  const pendingDealerToken = await pendingCred.user.getIdToken();

  // 3. Retail: Server-Side Price Recomputation
  console.log("\n2. Testing /payment/create-order (Tamper-Proof Price Recomputation)...");
  const createOrderRes = await postJson("/payment/create-order", {
    items: [
      { productId: "prod_purifier_01", qty: 2 } // 14999 * 2 = 29998
    ]
  }, custToken);

  assert(createOrderRes.status === 200, "POST /payment/create-order responded with 200 OK");
  assert(createOrderRes.data.orderId.length > 0, `Generated Razorpay Order ID: ${createOrderRes.data.orderId}`);
  assert(createOrderRes.data.totalRupees === 29998, `Server computed correct total: Rs. ${createOrderRes.data.totalRupees} (expected Rs. 29998)`);
  assert(createOrderRes.data.amount === 2999800, `Amount in paise matches: ${createOrderRes.data.amount} paise`);

  // 4. Retail: Payment Verification & Server Order Creation
  console.log("\n3. Testing /payment/verify (HMAC SHA256 Signature & Order Creation)...");
  const orderId = createOrderRes.data.orderId;
  const paymentId = "pay_test_" + Date.now();
  const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder";

  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // A) Invalid signature test
  const invalidVerify = await postJson("/payment/verify", {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: "forged_invalid_signature_xyz",
    items: [{ productId: "prod_purifier_01", qty: 2 }],
    address: { line1: "123 Main St", city: "Bengaluru", state: "KA", pincode: "560001" }
  }, custToken);
  assert(invalidVerify.status === 400, "Invalid signature rejected with 400 Bad Request");

  // B) Valid signature test
  const validVerify = await postJson("/payment/verify", {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSignature,
    items: [{ productId: "prod_purifier_01", qty: 2 }],
    address: { line1: "123 Main St", city: "Bengaluru", state: "KA", pincode: "560001" }
  }, custToken);

  assert(validVerify.status === 200, "Valid signature accepted with 200 OK");
  assert(validVerify.data.success === true, "Verification returned success: true");
  assert(validVerify.data.status === "confirmed", "Order created with status: 'confirmed'");
  assert(validVerify.data.orderId.length > 0, `Order created in Firestore via Admin SDK: ${validVerify.data.orderId}`);

  // C) Verify order exists in Firestore with correct server-computed values
  const savedOrderDoc = await db.collection("orders").doc(validVerify.data.orderId).get();
  assert(savedOrderDoc.exists, "Order document exists in Firestore");
  assert(savedOrderDoc.data().total === 29998, `Order total in Firestore is server-computed Rs. ${savedOrderDoc.data().total}`);
  assert(savedOrderDoc.data().paymentId === paymentId, "Order contains verified paymentId");
  assert(savedOrderDoc.data().type === "retail", "Order type is 'retail'");

  // 5. Dealer Bulk Orders
  console.log("\n4. Testing /orders/bulk (Dealer Bulk Order Flow)...");

  // A) Non-dealer customer should be blocked with 403 Forbidden
  const custBulk = await postJson("/orders/bulk", {
    items: [{ productId: "prod_purifier_01", qty: 5 }]
  }, custToken);
  assert(custBulk.status === 403, "Non-dealer blocked with 403 Forbidden on /orders/bulk");

  // B) Pending dealer should be blocked with 403 Forbidden
  const pendingBulk = await postJson("/orders/bulk", {
    items: [{ productId: "prod_purifier_01", qty: 5 }]
  }, pendingDealerToken);
  assert(pendingBulk.status === 403, "Pending dealer blocked with 403 Forbidden on /orders/bulk");

  // C) Approved dealer below minQty should be rejected with 400
  const belowMinQtyBulk = await postJson("/orders/bulk", {
    items: [{ productId: "prod_purifier_01", qty: 2 }] // minQty is 5
  }, approvedDealerToken);
  assert(belowMinQtyBulk.status === 400, "Below minQty rejected with 400 Bad Request");

  // D) Approved dealer with valid quantity -> Success
  const validBulk = await postJson("/orders/bulk", {
    items: [{ productId: "prod_purifier_01", qty: 5 }],
    address: { line1: "Dealer Warehouse", city: "Bengaluru", state: "KA", pincode: "560001" }
  }, approvedDealerToken);

  assert(validBulk.status === 200, "Approved dealer bulk order accepted with 200 OK");
  assert(validBulk.data.success === true, "Bulk order returned success: true");
  assert(validBulk.data.type === "bulk", "Bulk order type is standardized as 'bulk'");
  assert(validBulk.data.total === 49000, `Bulk total computed from wholesale/ catalog: Rs. ${validBulk.data.total} (expected 49000)`);

  const bulkDoc = await db.collection("orders").doc(validBulk.data.orderId).get();
  assert(bulkDoc.exists, "Bulk order document exists in Firestore");
  assert(bulkDoc.data().type === "bulk", "Order type in Firestore is 'bulk'");

  // 6. Address Search
  console.log("\n5. Testing /address/search (Nominatim Proxy with User-Agent)...");
  const addrRes = await getJson("/address/search?q=Indiranagar");
  assert(addrRes.status === 200, "GET /address/search returned 200 OK");
  assert(Array.isArray(addrRes.data), "Returned array of address suggestions");

  console.log("\n==========================================");
  console.log(`   PHASE 3 SERVER TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (spawnedServer) {
    spawnedServer.kill();
  }

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(err => {
  if (spawnedServer) {
    spawnedServer.kill();
  }
  console.error("Test execution failed:", err);
  process.exit(1);
});
