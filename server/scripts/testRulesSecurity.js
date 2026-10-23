// Rigorous Client-Side Firestore Security Rules Test Suite
// Uses client SDK to verify that security rules ACTUALLY BLOCK unauthorized reads/writes
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, signOut } = require("firebase/auth");
const {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, getDocs, addDoc, query, where, limit
} = require("firebase/firestore");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../mobile/.env") });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig, "rules-client-test");
const auth = getAuth(app);
const db = getFirestore(app);

async function runRulesTests() {
  console.log("=================================================");
  console.log("   FIRESTORE SECURITY RULES CLIENT TEST SUITE");
  console.log("   (Verifies rules ACTUALLY REJECT unauthorized ops)");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  async function expectSuccess(fn, testName) {
    try {
      await fn();
      console.log(`  [PASS] ALLOWED: ${testName}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] UNEXPECTED REJECTION: ${testName} (${err.message})`);
      failed++;
    }
  }

  async function expectDenied(fn, testName) {
    try {
      await fn();
      console.error(`  [FAIL] ILLEGAL ACCESS WAS PERMITTED: ${testName}`);
      failed++;
    } catch (err) {
      if (err.code === "permission-denied" || err.message.includes("permission-denied") || err.message.includes("Missing or insufficient permissions")) {
        console.log(`  [PASS] BLOCKED AS EXPECTED: ${testName}`);
        passed++;
      } else {
        console.error(`  [FAIL] UNEXPECTED ERROR TYPE: ${testName} (${err.code || err.message})`);
        failed++;
      }
    }
  }

  // Ensure logged out
  await signOut(auth);

  // --- SECTION 1: Unauthenticated Guest ---
  console.log("1. Testing Unauthenticated Guest Permissions...");
  await expectSuccess(async () => {
    const q = query(collection(db, "products"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Catalog empty");
  }, "Guest CAN read public products catalog");

  await expectDenied(async () => {
    await getDocs(collection(db, "wholesale"));
  }, "Guest CANNOT read wholesale pricing collection");

  await expectDenied(async () => {
    await getDoc(doc(db, "wholesale", "prod_purifier_01"));
  }, "Guest CANNOT read single wholesale document");

  await expectDenied(async () => {
    await addDoc(collection(db, "orders"), {
      userId: "fake_guest_user",
      status: "pending",
      total: 100
    });
  }, "Guest CANNOT create an order");

  // --- SECTION 2: Authenticated Customer ---
  console.log("\n2. Testing Customer Role Enforcement (customer@test.com)...");
  const custCred = await signInWithEmailAndPassword(auth, "customer@test.com", "Customer@123456");
  const customerUid = custCred.user.uid;

  await expectDenied(async () => {
    await getDocs(collection(db, "wholesale"));
  }, "Customer CANNOT read wholesale collection");

  await expectDenied(async () => {
    await getDoc(doc(db, "wholesale", "prod_purifier_01"));
  }, "Customer CANNOT read single wholesale document");

  await expectDenied(async () => {
    // Attempt privilege escalation: modify own role to Admin
    await updateDoc(doc(db, "users", customerUid), {
      role: "Admin"
    });
  }, "Customer CANNOT escalate own role to Admin");

  await expectDenied(async () => {
    // Attempt privilege escalation: modify own dealerStatus to approved
    await updateDoc(doc(db, "users", customerUid), {
      dealerStatus: "approved"
    });
  }, "Customer CANNOT approve their own dealer status");

  await expectSuccess(async () => {
    // Legitimate profile update: modify phone / name
    await updateDoc(doc(db, "users", customerUid), {
      phone: "+919876543210"
    });
  }, "Customer CAN update their own non-privileged profile fields (phone)");

  // Order security enforcement for Customer
  console.log("\n3. Testing Order Creation Constraints (Customer)...");
  await expectDenied(async () => {
    // Customer attempts to create an order marked 'delivered'
    await addDoc(collection(db, "orders"), {
      userId: customerUid,
      status: "delivered",
      total: 100,
      paymentId: ""
    });
  }, "Customer CANNOT forge order with status == 'delivered'");

  await expectDenied(async () => {
    // Customer attempts to self-certify a paymentId
    await addDoc(collection(db, "orders"), {
      userId: customerUid,
      status: "pending",
      paymentId: "fake_forged_payment_id",
      total: 100
    });
  }, "Customer CANNOT forge order with pre-filled paymentId");

  await expectDenied(async () => {
    // Customer attempts to order at wholesale/bulk type
    await addDoc(collection(db, "orders"), {
      userId: customerUid,
      type: "wholesale",
      status: "pending",
      paymentId: "",
      total: 100
    });
  }, "Customer CANNOT create an order with type == 'wholesale'");

  await expectDenied(async () => {
    // Customer attempts to create order for someone else
    await addDoc(collection(db, "orders"), {
      userId: "some_other_victim_uid",
      type: "retail",
      status: "pending",
      paymentId: "",
      total: 100
    });
  }, "Customer CANNOT create order on behalf of another user");

  await expectDenied(async () => {
    // Client attempts direct order creation (blocked by allow create: if false)
    await addDoc(collection(db, "orders"), {
      userId: customerUid,
      type: "retail",
      status: "pending",
      paymentId: "",
      items: [{ productId: "prod_purifier_01", name: "AquaPure", price: 14999, qty: 1 }],
      total: 14999,
      address: { line1: "Test St", city: "Bengaluru", state: "KA", pincode: "560001" },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }, "Customer CANNOT create any order directly from client (all orders must be created by server)");

  // Service Booking security enforcement
  console.log("\n4. Testing Service Booking Constraints...");
  await expectDenied(async () => {
    await addDoc(collection(db, "services"), {
      userId: customerUid,
      status: "completed",
      issue: "Filter check"
    });
  }, "Customer CANNOT forge service booking with status == 'completed'");

  await expectSuccess(async () => {
    await addDoc(collection(db, "services"), {
      userId: customerUid,
      status: "pending",
      userName: "Ananya",
      phone: "+919876543210",
      address: "Bengaluru",
      issue: "Need routine filter inspection",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }, "Customer CAN create legitimate service booking (status == 'pending', own uid)");

  // --- SECTION 5: Pending Dealer ---
  console.log("\n5. Testing Pending Dealer Role (dealer.pending@test.com)...");
  await signOut(auth);
  const pendingCred = await signInWithEmailAndPassword(auth, "dealer.pending@test.com", "Dealer@123456");

  await expectDenied(async () => {
    await getDocs(collection(db, "wholesale"));
  }, "Pending Dealer CANNOT read wholesale catalog");

  await expectDenied(async () => {
    await addDoc(collection(db, "orders"), {
      userId: pendingCred.user.uid,
      type: "bulk",
      status: "pending",
      paymentId: "",
      total: 5000
    });
  }, "Pending Dealer CANNOT place bulk orders directly");

  // --- SECTION 6: Approved Dealer ---
  console.log("\n6. Testing Approved Dealer Role (dealer@test.com)...");
  await signOut(auth);
  const approvedCred = await signInWithEmailAndPassword(auth, "dealer@test.com", "Dealer@123456");

  await expectSuccess(async () => {
    const q = query(collection(db, "wholesale"), limit(3));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Wholesale catalog query returned 0 docs");
  }, "Approved Dealer CAN read wholesale collection");

  await expectDenied(async () => {
    // Even an approved dealer cannot bypass server order creation
    await addDoc(collection(db, "orders"), {
      userId: approvedCred.user.uid,
      type: "bulk",
      status: "pending",
      paymentId: "",
      items: [{ productId: "prod_purifier_01", name: "AquaPure", price: 9800, qty: 5 }],
      total: 49000,
      address: { line1: "Dealer Store", city: "Bengaluru", state: "KA", pincode: "560001" },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }, "Approved Dealer CANNOT create orders directly from client (must use POST /orders/bulk)");

  await signOut(auth);

  console.log("\n=================================================");
  console.log(`   SECURITY RULES RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRulesTests().catch(err => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
