const { fork } = require("child_process");
const http = require("http");
const crypto = require("crypto");
const { db, auth } = require("../firebaseAdmin");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SERVER_URL = "http://localhost:3001";
let spawnedServer = null;

async function ensureServerRunning() {
  try {
    const res = await fetch(`${SERVER_URL}/health`);
    if (res.ok) return;
  } catch (e) {
    // Server is not running, spawn it
    console.log("Starting Califnco server instance for integration tests...");
    spawnedServer = fork(path.resolve(__dirname, "../index.js"), [], {
      stdio: "ignore"
    });
    // Wait up to 5 seconds for health
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

async function postJson(endpoint, data) {
  const url = `${SERVER_URL}${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  // 2. Fetch test users
  const custAuth = await auth.getUserByEmail("customer@test.com");
  const approvedDealerAuth = await auth.getUserByEmail("dealer@test.com");
  const pendingDealerAuth = await auth.getUserByEmail("dealer.pending@test.com");

  // 3. Retail: Server-Side Price Recomputation
  console.log("\n2. Testing /payment/create-order (Tamper-Proof Price Recomputation)...");
  // Client only sends productId and qty — NO total
  const createOrderRes = await postJson("/payment/create-order", {
    userId: custAuth.uid,
    items: [
      { productId: "prod_purifier_01", qty: 2 } // 14999 * 2 = 29998
    ]
  });

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
    userId: custAuth.uid,
    items: [{ productId: "prod_purifier_01", qty: 2 }],
    address: { line1: "123 Main St", city: "Bengaluru", state: "KA", pincode: "560001" }
  });
  assert(invalidVerify.status === 400, "Invalid signature rejected with 400 Bad Request");

  // B) Valid signature test
  const validVerify = await postJson("/payment/verify", {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSignature,
    userId: custAuth.uid,
    items: [{ productId: "prod_purifier_01", qty: 2 }],
    address: { line1: "123 Main St", city: "Bengaluru", state: "KA", pincode: "560001" }
  });

  assert(validVerify.status === 200, "Valid signature accepted with 200 OK");
  assert(validVerify.data.success === true, "Verification returned success: true");
  assert(validVerify.data.status === "confirmed", "Order created with status: 'confirmed'");
  assert(validVerify.data.orderId.length > 0, `Order created in Firestore via Admin SDK: ${validVerify.data.orderId}`);

  // Query Firestore directly to confirm order exists with verified values
  const verifiedOrderDoc = await db.collection("orders").doc(validVerify.data.orderId).get();
  assert(verifiedOrderDoc.exists, "Order document exists in Firestore");
  assert(verifiedOrderDoc.data().total === 29998, "Order total in Firestore is server-computed Rs. 29998");
  assert(verifiedOrderDoc.data().paymentId === paymentId, "Order contains verified paymentId");
  assert(verifiedOrderDoc.data().type === "retail", "Order type is 'retail'");

  // 5. Dealer Bulk Orders: POST /orders/bulk
  console.log("\n4. Testing /orders/bulk (Dealer Bulk Order Flow)...");

  // A) Customer tries to place bulk order -> 403 Forbidden
  const custBulk = await postJson("/orders/bulk", {
    userId: custAuth.uid,
    items: [{ productId: "prod_purifier_01", qty: 10 }]
  });
  assert(custBulk.status === 403, "Non-dealer blocked with 403 Forbidden on /orders/bulk");

  // B) Pending dealer tries to place bulk order -> 403 Forbidden
  const pendingBulk = await postJson("/orders/bulk", {
    userId: pendingDealerAuth.uid,
    items: [{ productId: "prod_purifier_01", qty: 10 }]
  });
  assert(pendingBulk.status === 403, "Pending dealer blocked with 403 Forbidden on /orders/bulk");

  // C) Approved dealer tries to order below minQty -> 400 Bad Request
  // prod_purifier_01 minQty is 5
  const belowMinBulk = await postJson("/orders/bulk", {
    userId: approvedDealerAuth.uid,
    items: [{ productId: "prod_purifier_01", qty: 2 }]
  });
  assert(belowMinBulk.status === 400, "Below minQty rejected with 400 Bad Request");

  // D) Approved dealer orders >= minQty -> 200 OK with server-computed wholesale total
  // prod_purifier_01 wholesale price is 9800 * 5 = 49000
  const validBulk = await postJson("/orders/bulk", {
    userId: approvedDealerAuth.uid,
    items: [{ productId: "prod_purifier_01", qty: 5 }],
    address: { line1: "Dealer Warehouse", city: "Bengaluru", state: "KA", pincode: "560001" }
  });

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

