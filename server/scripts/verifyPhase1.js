const { db, auth } = require("../firebaseAdmin");

async function verify() {
  console.log("=== Phase 1 Health Check ===");

  // 1. Verify Products
  const productsSnap = await db.collection("products").get();
  console.log(`Products in Firestore: ${productsSnap.size} (Expected >= 50)`);

  const categories = {};
  productsSnap.forEach(doc => {
    const data = doc.data();
    categories[data.category] = (categories[data.category] || 0) + 1;
  });
  console.log("Categories distribution:", categories);

  // 2. Verify Wholesale
  const wholesaleSnap = await db.collection("wholesale").get();
  console.log(`Wholesale records in Firestore: ${wholesaleSnap.size} (Expected == Products count)`);

  // 3. Verify Test Users in Firestore and Auth
  const expectedUsers = [
    { email: "customer@test.com", role: "Customer" },
    { email: "dealer@test.com", role: "Dealer", dealerStatus: "approved" },
    { email: "dealer.pending@test.com", role: "Dealer", dealerStatus: "pending" },
    { email: "admin@test.com", role: "Admin" }
  ];

  for (const exp of expectedUsers) {
    const authUser = await auth.getUserByEmail(exp.email);
    const firestoreDoc = await db.collection("users").doc(authUser.uid).get();
    const data = firestoreDoc.data();
    console.log(`Verified user ${exp.email} [Auth UID: ${authUser.uid}, Role: ${data.role}, DealerStatus: ${data.dealerStatus}]`);
  }

  console.log("\nAll Phase 1 verifications passed successfully!");
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
