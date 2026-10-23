const http = require("http");

// Start server in child process or test logic directly
const { admin, db } = require("../firebaseAdmin");

async function testAutomationLogic() {
  console.log("--- Testing Automation State & Catalog Rotation ---");

  const stateRef = db.collection("automation").doc("state");
  const stateBefore = (await stateRef.get()).data();
  console.log("Current automation state:", stateBefore);

  const productsSnap = await db.collection("products").get();
  const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  allProducts.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`Total products in catalog: ${allProducts.length}`);

  let lastPostedId = stateBefore?.lastPostedProductId;
  let nextIndex = 0;
  if (lastPostedId) {
    const idx = allProducts.findIndex(p => p.id === lastPostedId);
    if (idx !== -1) {
      nextIndex = (idx + 1) % allProducts.length;
    }
  }

  const nextProduct = allProducts[nextIndex];
  console.log(`\nNext Product to be featured: [${nextProduct.id}] ${nextProduct.name}`);
  console.log(`Category: ${nextProduct.category} | Price: Rs. ${nextProduct.price}`);
  console.log(`Image URL: ${nextProduct.imageUrl}`);

  // Test state advance
  await stateRef.set({
    lastPostedProductId: nextProduct.id,
    lastPostedAt: admin.firestore.FieldValue.serverTimestamp(),
    postCount: (stateBefore?.postCount || 0) + 1
  }, { merge: true });

  const stateAfter = (await stateRef.get()).data();
  console.log("\nUpdated automation state:", {
    lastPostedProductId: stateAfter.lastPostedProductId,
    postCount: stateAfter.postCount
  });

  if (stateAfter.lastPostedProductId === nextProduct.id && stateAfter.postCount === (stateBefore?.postCount || 0) + 1) {
    console.log("\nPASS: Automation state rotation successfully verified!");
    process.exit(0);
  } else {
    console.error("\nFAIL: State mismatch");
    process.exit(1);
  }
}

testAutomationLogic().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
