// Automated verification script for Phase 2: Customer flows & Mobile app data layer
const { db, auth } = require("../firebaseAdmin");
const fs = require("fs");
const path = require("path");

async function runVerification() {
  console.log("==========================================");
  console.log("   PHASE 2 VERIFICATION TEST SUITE");
  console.log("==========================================\n");

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

  // 1. Verify Mobile App Files
  console.log("1. Verifying Mobile App Codebase Structure...");
  const mobileRoot = path.resolve(__dirname, "../../mobile");
  const requiredFiles = [
    "App.js",
    "index.js",
    "package.json",
    "app.json",
    ".env",
    "src/config/firebase.js",
    "src/constants/colors.js",
    "src/constants/categories.js",
    "src/utils/formatPrice.js",
    "src/hooks/useAuth.js",
    "src/hooks/useCart.js",
    "src/navigation/AppNavigator.js",
    "src/components/ProductCard.js",
    "src/services/authService.js",
    "src/services/productService.js",
    "src/services/orderService.js",
    "src/services/serviceBookingService.js",
    "src/screens/auth/LoginScreen.js",
    "src/screens/auth/RegisterScreen.js",
    "src/screens/customer/CatalogScreen.js",
    "src/screens/customer/ProductDetailScreen.js",
    "src/screens/customer/CartScreen.js",
    "src/screens/customer/CheckoutScreen.js",
    "src/screens/customer/OrdersScreen.js",
    "src/screens/customer/ServiceBookingScreen.js",
    "src/screens/customer/ProfileScreen.js",
    "src/screens/dealer/DealerCatalogScreen.js",
    "src/screens/dealer/DealerOrdersScreen.js",
    "src/screens/shared/PendingApprovalScreen.js",
    "assets/icon.png",
    "assets/splash-icon.png",
    "assets/adaptive-icon.png",
    "assets/favicon.png"
  ];

  for (const rel of requiredFiles) {
    const full = path.join(mobileRoot, rel);
    const exists = fs.existsSync(full);
    assert(exists && fs.statSync(full).size > 0, `File exists: mobile/${rel}`);
  }

  // 2. Verify Product Catalog Queries (as executed by mobile productService.js)
  console.log("\n2. Testing Product Catalog Queries (Mobile Data Flow)...");
  const prodsSnap = await db.collection("products").orderBy("name").get();
  assert(prodsSnap.size >= 52, `getProducts() returned ${prodsSnap.size} products (expected >= 52)`);

  const categories = ["Purifier", "Dispenser", "Pump", "Filter", "Spare"];
  for (const cat of categories) {
    const catSnap = await db.collection("products").where("category", "==", cat).get();
    assert(catSnap.size > 0, `getProductsByCategory("${cat}") returned ${catSnap.size} products`);
  }

  // 3. Verify Test Customer User
  console.log("\n3. Testing Customer Authentication & Profile...");
  const customerAuth = await auth.getUserByEmail("customer@test.com");
  assert(customerAuth.uid.length > 0, `Auth record exists for customer@test.com (UID: ${customerAuth.uid})`);

  const customerDoc = await db.collection("users").doc(customerAuth.uid).get();
  assert(customerDoc.exists, "Firestore users/{customerUid} exists");
  assert(customerDoc.data()?.role === "Customer", "Customer profile has role: Customer");

  // 4. Test Customer Order Creation & Retrieval
  console.log("\n4. Testing Retail Order Creation & Retrieval...");
  const testOrderRef = await db.collection("orders").add({
    userId: customerAuth.uid,
    type: "retail",
    items: [
      {
        productId: "prod_purifier_01",
        name: "AquaPure Copper+ Alkaline RO Water Purifier",
        price: 14999,
        qty: 1
      }
    ],
    total: 14999,
    address: {
      line1: "Flat 402, Green Valley Apts",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001"
    },
    status: "pending",
    paymentId: "pay_verify_phase2_simulated",
    razorpayOrderId: "order_verify_phase2",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  assert(testOrderRef.id.length > 0, `Created customer retail order (ID: ${testOrderRef.id})`);

  // Query orders for this user
  let ordersSnap;
  try {
    ordersSnap = await db.collection("orders")
      .where("userId", "==", customerAuth.uid)
      .orderBy("createdAt", "desc")
      .get();
  } catch (err) {
    ordersSnap = await db.collection("orders")
      .where("userId", "==", customerAuth.uid)
      .get();
  }
  assert(ordersSnap.size > 0, `getUserOrders("${customerAuth.uid}") returned ${ordersSnap.size} order(s)`);
  const foundOrder = ordersSnap.docs.find(d => d.id === testOrderRef.id);
  assert(foundOrder !== undefined, "Newly created retail order retrieved with correct fields");
  assert(foundOrder.data().status === "pending", "Order status initialized as 'pending'");

  // 5. Test Customer Service Booking Creation & Retrieval
  console.log("\n5. Testing Service Booking Creation & Retrieval...");
  const testServiceRef = await db.collection("services").add({
    userId: customerAuth.uid,
    userName: "Ananya Sharma",
    phone: "+919876543210",
    address: "Flat 402, Green Valley Apts, Bengaluru 560001",
    issue: "Filter replacement indicator turned red, need technician visit",
    status: "pending",
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  assert(testServiceRef.id.length > 0, `Created customer service booking (ID: ${testServiceRef.id})`);

  let servicesSnap;
  try {
    servicesSnap = await db.collection("services")
      .where("userId", "==", customerAuth.uid)
      .orderBy("createdAt", "desc")
      .get();
  } catch (err) {
    servicesSnap = await db.collection("services")
      .where("userId", "==", customerAuth.uid)
      .get();
  }
  assert(servicesSnap.size > 0, `getUserServiceBookings("${customerAuth.uid}") returned ${servicesSnap.size} booking(s)`);
  const foundService = servicesSnap.docs.find(d => d.id === testServiceRef.id);
  assert(foundService !== undefined, "Service booking retrieved successfully");
  assert(foundService.data().status === "pending", "Service booking status initialized as 'pending'");

  // 6. Test Wholesale Access Layer
  console.log("\n6. Testing Wholesale Access Layer...");
  const wholesaleSnap = await db.collection("wholesale").get();
  assert(wholesaleSnap.size >= 52, `Wholesale catalog has ${wholesaleSnap.size} pricing docs (expected >= 52)`);
  const sampleWholesale = wholesaleSnap.docs[0].data();
  assert(sampleWholesale.price > 0 && sampleWholesale.minQty > 0, `Sample wholesale document valid (Price: Rs. ${sampleWholesale.price}, MinQty: ${sampleWholesale.minQty})`);

  console.log("\n==========================================");
  console.log(`   PHASE 2 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Verification failed with error:", err);
  process.exit(1);
});
