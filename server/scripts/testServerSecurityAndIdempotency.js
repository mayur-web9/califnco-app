// Comprehensive Verification for Server Authentication, Idempotency & Transactional Stock Decrement
const { fork } = require("child_process");
const path = require("path");
const crypto = require("crypto");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { admin, db } = require("../firebaseAdmin");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SERVER_URL = "http://localhost:3001";
let serverProcess = null;

// Initialize Firebase Client SDK to obtain authentic ID tokens for testing
const clientApp = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCvENhVhJc7CqRMNVWiZwFpG-R0c9vRqVU",
  authDomain: "gen-lang-client-0022579334.firebaseapp.com",
  projectId: "gen-lang-client-0022579334"
});
const clientAuth = getAuth(clientApp);

async function ensureServer() {
  try {
    const res = await fetch(`${SERVER_URL}/health`);
    if (res.ok) return;
  } catch (e) {
    console.log("Spawning local Califnco server instance on port 3001...");
    serverProcess = fork(path.resolve(__dirname, "../index.js"), [], { stdio: "ignore" });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 250));
      try {
        const res = await fetch(`${SERVER_URL}/health`);
        if (res.ok) {
          console.log("Server ready.\n");
          return;
        }
      } catch (err) {}
    }
  }
}

async function runSecurityAndIdempotencyTests() {
  console.log("=========================================================");
  console.log("   SERVER AUTH, IDEMPOTENCY & TRANSACTION TEST SUITE    ");
  console.log("=========================================================\n");

  await ensureServer();

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Obtain real Firebase ID Tokens for test accounts
  console.log("1. Authenticating test users with Firebase Auth for ID tokens...");
  const custCred = await signInWithEmailAndPassword(clientAuth, "customer@test.com", "Customer@123456");
  const customerToken = await custCred.user.getIdToken();

  const pendingDealerCred = await signInWithEmailAndPassword(clientAuth, "dealer.pending@test.com", "Dealer@123456");
  const pendingDealerToken = await pendingDealerCred.user.getIdToken();

  const approvedDealerCred = await signInWithEmailAndPassword(clientAuth, "dealer@test.com", "Dealer@123456");
  const approvedDealerToken = await approvedDealerCred.user.getIdToken();

  assert(customerToken.length > 50, "Generated valid ID token for Customer");
  assert(pendingDealerToken.length > 50, "Generated valid ID token for Pending Dealer");
  assert(approvedDealerToken.length > 50, "Generated valid ID token for Approved Dealer");

  // 2. ID Token Verification on Protected Routes (401 without token)
  console.log("\n2. Testing 401 Unauthorized when Authorization header is missing...");

  const res1 = await fetch(`${SERVER_URL}/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ productId: "prod_purifier_01", qty: 1 }] })
  });
  assert(res1.status === 401, "POST /payment/create-order returns 401 without Bearer token");

  const res2 = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ razorpay_order_id: "ord_1", razorpay_payment_id: "pay_1", items: [] })
  });
  assert(res2.status === 401, "POST /payment/verify returns 401 without Bearer token");

  const res3 = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ productId: "prod_purifier_01", qty: 5 }] })
  });
  assert(res3.status === 401, "POST /orders/bulk returns 401 without Bearer token");

  const res4 = await fetch(`${SERVER_URL}/notifications/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "some_user", title: "Test", body: "Hello" })
  });
  assert(res4.status === 401, "POST /notifications/send returns 401 without Bearer token");

  const res5 = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer invalid_token_xyz" },
    body: JSON.stringify({ items: [{ productId: "prod_purifier_01", qty: 5 }] })
  });
  assert(res5.status === 401, "POST /orders/bulk returns 401 when token is invalid or expired");

  // 3. Customer role blocked on /orders/bulk (403 Forbidden)
  console.log("\n3. Testing 403 Forbidden on /orders/bulk for non-dealers...");

  const bulkCustomerRes = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      items: [{ productId: "prod_purifier_01", qty: 5 }]
    })
  });
  assert(bulkCustomerRes.status === 403, "POST /orders/bulk returns 403 Forbidden for Customer");

  const bulkPendingRes = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${pendingDealerToken}`
    },
    body: JSON.stringify({
      items: [{ productId: "prod_purifier_01", qty: 5 }]
    })
  });
  assert(bulkPendingRes.status === 403, "POST /orders/bulk returns 403 Forbidden for Pending Dealer");

  // 4. Approved Dealer successfully places bulk order
  console.log("\n4. Testing Approved Dealer on /orders/bulk...");
  const bulkApprovedRes = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${approvedDealerToken}`
    },
    body: JSON.stringify({
      items: [{ productId: "prod_purifier_01", qty: 5 }],
      address: { line1: "Dealer Hub", city: "Bengaluru", state: "KA", pincode: "560001" }
    })
  });
  const bulkApprovedData = await bulkApprovedRes.json();
  assert(bulkApprovedRes.status === 200, "POST /orders/bulk returns 200 OK for Approved Dealer");
  assert(bulkApprovedData.success === true, "Bulk order response has success: true");
  assert(bulkApprovedData.type === "bulk", "Bulk order type is 'bulk'");

  // 5. Idempotent /payment/verify
  console.log("\n5. Testing Idempotent /payment/verify...");
  const uniquePayId = `pay_idempotent_${Date.now()}`;
  const mockOrderId = `order_${Date.now()}`;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder";

  const validSig = crypto
    .createHmac("sha256", razorpaySecret)
    .update(`${mockOrderId}|${uniquePayId}`)
    .digest("hex");

  // First call to /payment/verify
  const verify1 = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: mockOrderId,
      razorpay_payment_id: uniquePayId,
      razorpay_signature: validSig,
      items: [{ productId: "prod_purifier_02", qty: 1 }],
      address: { line1: "123 Indiranagar", city: "Bengaluru", state: "KA", pincode: "560038" }
    })
  });
  const verifyData1 = await verify1.json();
  assert(verify1.status === 200, "First /payment/verify returns 200 OK");
  assert(verifyData1.success === true, "First verification succeeds and returns orderId");
  const firstOrderId = verifyData1.orderId;

  // Measure product stock immediately after first order
  const prodDocSnap = await db.collection("products").doc("prod_purifier_02").get();
  const stockAfterFirst = Number(prodDocSnap.data().stock);

  // SECOND call to /payment/verify with the EXACT SAME razorpay_payment_id
  const verify2 = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: mockOrderId,
      razorpay_payment_id: uniquePayId,
      razorpay_signature: validSig,
      items: [{ productId: "prod_purifier_02", qty: 1 }],
      address: { line1: "123 Indiranagar", city: "Bengaluru", state: "KA", pincode: "560038" }
    })
  });
  const verifyData2 = await verify2.json();
  assert(verify2.status === 200, "Duplicate /payment/verify returns 200 OK");
  assert(verifyData2.isDuplicate === true, "Response indicates idempotent duplicate handling (isDuplicate: true)");
  assert(verifyData2.orderId === firstOrderId, "Duplicate verification returns the exact same orderId");

  // Verify stock was NOT decremented again
  const prodDocSnap2 = await db.collection("products").doc("prod_purifier_02").get();
  const stockAfterSecond = Number(prodDocSnap2.data().stock);
  assert(stockAfterSecond === stockAfterFirst, `Stock remains exactly ${stockAfterSecond} (not decremented twice)`);

  // Verify strictly one order document was created in Firestore for this paymentId
  const orderCountSnap = await db.collection("orders").where("paymentId", "==", uniquePayId).get();
  assert(orderCountSnap.size === 1, "Firestore has exactly 1 order document for this paymentId");

  // 6. Stock Decrement inside Firestore Transaction
  console.log("\n6. Testing Stock Decrement inside Firestore Transaction...");
  const targetProdId = "prod_purifier_03";
  const initialSnap = await db.collection("products").doc(targetProdId).get();
  const initialStock = Number(initialSnap.data().stock);

  const txPayId = `pay_tx_${Date.now()}`;
  const txOrderId = `order_tx_${Date.now()}`;
  const txSig = crypto
    .createHmac("sha256", razorpaySecret)
    .update(`${txOrderId}|${txPayId}`)
    .digest("hex");

  const txRes = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: txOrderId,
      razorpay_payment_id: txPayId,
      razorpay_signature: txSig,
      items: [{ productId: targetProdId, qty: 2 }],
      address: { line1: "Test St", city: "Bengaluru", state: "KA", pincode: "560001" }
    })
  });
  const txData = await txRes.json();
  assert(txRes.status === 200, "Transaction order placement succeeded with 200 OK");

  const afterSnap = await db.collection("products").doc(targetProdId).get();
  const afterStock = Number(afterSnap.data().stock);
  assert(afterStock === initialStock - 2, `Stock decremented atomically in transaction: ${initialStock} -> ${afterStock}`);

  // 7. Transaction Rollback when requesting more than available stock
  console.log("\n7. Testing Transaction Rejection & Rollback on Insufficient Stock...");
  const excessivePayId = `pay_excess_${Date.now()}`;
  const excessiveOrderId = `order_excess_${Date.now()}`;
  const excessiveSig = crypto
    .createHmac("sha256", razorpaySecret)
    .update(`${excessiveOrderId}|${excessivePayId}`)
    .digest("hex");

  const excessiveRes = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: excessiveOrderId,
      razorpay_payment_id: excessivePayId,
      razorpay_signature: excessiveSig,
      items: [{ productId: targetProdId, qty: 999999 }], // Exceeds available stock
      address: { line1: "Test St", city: "Bengaluru", state: "KA", pincode: "560001" }
    })
  });
  assert(excessiveRes.status === 500, "Excessive quantity rejected by transaction (500 Error)");

  const unchangedSnap = await db.collection("products").doc(targetProdId).get();
  assert(Number(unchangedSnap.data().stock) === afterStock, `Stock remains untouched after rollback: ${afterStock}`);

  const noOrderSnap = await db.collection("orders").where("paymentId", "==", excessivePayId).get();
  assert(noOrderSnap.empty, "No order was created for the aborted transaction");

  console.log("\n=========================================================");
  console.log(`   SECURITY & IDEMPOTENCY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================");

  if (serverProcess) {
    serverProcess.kill();
  }

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runSecurityAndIdempotencyTests().catch(err => {
  if (serverProcess) serverProcess.kill();
  console.error("Test execution failed:", err);
  process.exit(1);
});
