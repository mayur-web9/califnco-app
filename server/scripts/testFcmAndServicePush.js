// Test suite for FCM Token Registration and Server Push Notification Triggers
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { db, admin } = require("../firebaseAdmin");

const { fork } = require("child_process");
const SERVER_URL = "http://localhost:3001";
let serverProcess = null;

const clientApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID
});
const clientAuth = getAuth(clientApp);

async function ensureServer() {
  try {
    const res = await fetch(`${SERVER_URL}/health`);
    if (res.ok) return;
  } catch (e) {
    console.log("Spawning Califnco server instance for FCM tests...");
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

async function runFcmTests() {
  console.log("==================================================");
  console.log("      FCM PUSH NOTIFICATION INTEGRATION SUITE     ");
  console.log("==================================================\n");

  await ensureServer();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Authenticate users
  console.log("1. Authenticating Admin and Customer users...");
  const adminCred = await signInWithEmailAndPassword(clientAuth, "admin@test.com", "Admin@123456");
  const adminToken = await adminCred.user.getIdToken();
  const adminUid = adminCred.user.uid;

  const custCred = await signInWithEmailAndPassword(clientAuth, "customer@test.com", "Customer@123456");
  const custToken = await custCred.user.getIdToken();
  const custUid = custCred.user.uid;

  assert(adminToken && custToken, "Successfully generated ID tokens for Admin and Customer");

  // 2. Test Mobile Device FCM Token Registration in Firestore users/{uid}
  console.log("\n2. Testing FCM Device Token Registration in Firestore...");
  const sampleFcmToken = "ExponentPushToken[mock_test_token_9999]";
  await db.collection("users").doc(custUid).update({
    fcmToken: sampleFcmToken,
    fcmTokenUpdatedAt: new Date().toISOString()
  });

  const updatedUserSnap = await db.collection("users").doc(custUid).get();
  assert(updatedUserSnap.data()?.fcmToken === sampleFcmToken, `users/${custUid}.fcmToken persisted correctly in Firestore`);

  // 3. Test Order Status Update via PATCH /orders/:id/status
  console.log("\n3. Testing PATCH /orders/:id/status (triggers FCM + Email/SMS)...");
  // Create a temporary order for testing
  const testOrderRef = await db.collection("orders").add({
    userId: custUid,
    type: "retail",
    status: "confirmed",
    total: 14999,
    items: [{ productId: "prod_purifier_01", qty: 1, price: 14999 }],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const orderStatusRes = await fetch(`${SERVER_URL}/orders/${testOrderRef.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: "out_for_delivery" })
  });

  const orderStatusData = await orderStatusRes.json();
  assert(orderStatusRes.status === 200, "PATCH /orders/:id/status returned 200 OK");
  assert(orderStatusData.success === true && orderStatusData.status === "out_for_delivery", "Order status successfully updated to 'out_for_delivery'");

  const verifiedOrderDoc = await testOrderRef.get();
  assert(verifiedOrderDoc.data().status === "out_for_delivery", "Firestore order document updated to 'out_for_delivery'");

  // 4. Test Service Request Status Update via PATCH /services/:id/status
  console.log("\n4. Testing PATCH /services/:id/status (triggers FCM)...");
  const testServiceRef = await db.collection("services").add({
    userId: custUid,
    userName: "Mayur Customer",
    phone: "+919876543210",
    issue: "Filter replacement requested",
    status: "pending",
    notes: "",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const serviceStatusRes = await fetch(`${SERVER_URL}/services/${testServiceRef.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: "assigned",
      notes: "Technician Ramesh assigned for 4:00 PM visit"
    })
  });

  const serviceStatusData = await serviceStatusRes.json();
  assert(serviceStatusRes.status === 200, "PATCH /services/:id/status returned 200 OK");
  assert(serviceStatusData.success === true && serviceStatusData.status === "assigned", "Service status successfully updated to 'assigned'");

  const verifiedServiceDoc = await testServiceRef.get();
  assert(verifiedServiceDoc.data().status === "assigned", "Firestore service ticket status updated to 'assigned'");
  assert(verifiedServiceDoc.data().notes.includes("Ramesh"), "Technician notes saved in service ticket");

  // Cleanup test docs
  await testOrderRef.delete();
  await testServiceRef.delete();

  if (serverProcess) {
    serverProcess.kill();
  }

  console.log("\n==================================================");
  console.log(`       FCM TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runFcmTests().catch(err => {
  if (serverProcess) {
    serverProcess.kill();
  }
  console.error("Test execution failed:", err);
  process.exit(1);
});
