const { db } = require("../firebaseAdmin");

const SERVER_BASE = "https://califnco-app.onrender.com/public/products";

// Map every single product ID to its own unique server URL
const PRODUCT_IMAGE_MAP = {
  // Purifiers (12)
  prod_purifier_01: `${SERVER_BASE}/prod_purifier_01.jpg`,
  prod_purifier_02: `${SERVER_BASE}/prod_purifier_02.jpg`,
  prod_purifier_03: `${SERVER_BASE}/prod_purifier_03.jpg`,
  prod_purifier_04: `${SERVER_BASE}/prod_purifier_04.jpg`,
  prod_purifier_05: `${SERVER_BASE}/prod_purifier_05.jpg`,
  prod_purifier_06: `${SERVER_BASE}/prod_purifier_06.jpg`,
  prod_purifier_07: `${SERVER_BASE}/prod_purifier_07.jpg`,
  prod_purifier_08: `${SERVER_BASE}/prod_purifier_08.jpg`,
  prod_purifier_09: `${SERVER_BASE}/prod_purifier_09.jpg`,
  prod_purifier_10: `${SERVER_BASE}/prod_purifier_10.jpg`,
  prod_purifier_11: `${SERVER_BASE}/prod_purifier_11.jpg`,
  prod_purifier_12: `${SERVER_BASE}/prod_purifier_12.jpg`,

  // Dispensers (10)
  prod_dispenser_01: `${SERVER_BASE}/prod_dispenser_01.jpg`,
  prod_dispenser_02: `${SERVER_BASE}/prod_dispenser_02.jpg`,
  prod_dispenser_03: `${SERVER_BASE}/prod_dispenser_03.jpg`,
  prod_dispenser_04: `${SERVER_BASE}/prod_dispenser_04.jpg`,
  prod_dispenser_05: `${SERVER_BASE}/prod_dispenser_05.jpg`,
  prod_dispenser_06: `${SERVER_BASE}/prod_dispenser_06.jpg`,
  prod_dispenser_07: `${SERVER_BASE}/prod_dispenser_07.jpg`,
  prod_dispenser_08: `${SERVER_BASE}/prod_dispenser_08.jpg`,
  prod_dispenser_09: `${SERVER_BASE}/prod_dispenser_09.jpg`,
  prod_dispenser_10: `${SERVER_BASE}/prod_dispenser_10.jpg`,

  // Pumps (10)
  prod_pump_01: `${SERVER_BASE}/prod_pump_01.jpg`,
  prod_pump_02: `${SERVER_BASE}/prod_pump_02.jpg`,
  prod_pump_03: `${SERVER_BASE}/prod_pump_03.jpg`,
  prod_pump_04: `${SERVER_BASE}/prod_pump_04.jpg`,
  prod_pump_05: `${SERVER_BASE}/prod_pump_05.jpg`,
  prod_pump_06: `${SERVER_BASE}/prod_pump_06.jpg`,
  prod_pump_07: `${SERVER_BASE}/prod_pump_07.jpg`,
  prod_pump_08: `${SERVER_BASE}/prod_pump_08.jpg`,
  prod_pump_09: `${SERVER_BASE}/prod_pump_09.jpg`,
  prod_pump_10: `${SERVER_BASE}/prod_pump_10.jpg`,

  // Filters (10)
  prod_filter_01: `${SERVER_BASE}/prod_filter_01.jpg`,
  prod_filter_02: `${SERVER_BASE}/prod_filter_02.jpg`,
  prod_filter_03: `${SERVER_BASE}/prod_filter_03.jpg`,
  prod_filter_04: `${SERVER_BASE}/prod_filter_04.jpg`,
  prod_filter_05: `${SERVER_BASE}/prod_filter_05.jpg`,
  prod_filter_06: `${SERVER_BASE}/prod_filter_06.jpg`,
  prod_filter_07: `${SERVER_BASE}/prod_filter_07.jpg`,
  prod_filter_08: `${SERVER_BASE}/prod_filter_08.jpg`,
  prod_filter_09: `${SERVER_BASE}/prod_filter_09.jpg`,
  prod_filter_10: `${SERVER_BASE}/prod_filter_10.jpg`,

  // Spares (10)
  prod_spare_01: `${SERVER_BASE}/prod_spare_01.jpg`,
  prod_spare_02: `${SERVER_BASE}/prod_spare_02.jpg`,
  prod_spare_03: `${SERVER_BASE}/prod_spare_03.jpg`,
  prod_spare_04: `${SERVER_BASE}/prod_spare_04.jpg`,
  prod_spare_05: `${SERVER_BASE}/prod_spare_05.jpg`,
  prod_spare_06: `${SERVER_BASE}/prod_spare_06.jpg`,
  prod_spare_07: `${SERVER_BASE}/prod_spare_07.jpg`,
  prod_spare_08: `${SERVER_BASE}/prod_spare_08.jpg`,
  prod_spare_09: `${SERVER_BASE}/prod_spare_09.jpg`,
  prod_spare_10: `${SERVER_BASE}/prod_spare_10.jpg`
};

async function updateFirestoreImages() {
  console.log("Updating all 52 product images in Firestore with 100% unique URLs...");
  let count = 0;
  const batch = db.batch();

  for (const [id, imageUrl] of Object.entries(PRODUCT_IMAGE_MAP)) {
    const ref = db.collection("products").doc(id);
    batch.update(ref, { imageUrl });
    count++;
  }

  await batch.commit();
  console.log(`Successfully updated ${count} products in Firestore with unique dedicated URLs.`);
  process.exit(0);
}

updateFirestoreImages().catch(err => {
  console.error("Firestore image update failed:", err);
  process.exit(1);
});
