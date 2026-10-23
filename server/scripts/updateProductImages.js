const { db } = require("../firebaseAdmin");

const SERVER_BASE = "https://califnco-app.onrender.com/public/products";

const PRODUCT_IMAGE_MAP = {
  // Purifiers
  prod_purifier_01: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_02: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_03: `${SERVER_BASE}/purifier_undersink.jpg`,
  prod_purifier_04: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_05: `${SERVER_BASE}/purifier_undersink.jpg`,
  prod_purifier_06: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_07: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_08: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_09: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_10: `${SERVER_BASE}/purifier_undersink.jpg`,
  prod_purifier_11: `${SERVER_BASE}/purifier_wall.jpg`,
  prod_purifier_12: `${SERVER_BASE}/purifier_wall.jpg`,

  // Dispensers
  prod_dispenser_01: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_02: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_03: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_04: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_05: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_06: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_07: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_08: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_09: `${SERVER_BASE}/dispenser_cooler.jpg`,
  prod_dispenser_10: `${SERVER_BASE}/dispenser_cooler.jpg`,

  // Pumps
  prod_pump_01: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_02: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_03: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_04: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_05: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_06: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_07: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_08: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_09: `${SERVER_BASE}/pump_booster.jpg`,
  prod_pump_10: `${SERVER_BASE}/pump_booster.jpg`,

  // Filters
  prod_filter_01: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_02: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_03: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_04: `${SERVER_BASE}/filter_membrane.jpg`,
  prod_filter_05: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_06: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_07: `${SERVER_BASE}/filter_membrane.jpg`,
  prod_filter_08: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_09: `${SERVER_BASE}/filter_cartridge.jpg`,
  prod_filter_10: `${SERVER_BASE}/filter_membrane.jpg`,

  // Spares
  prod_spare_01: `${SERVER_BASE}/spare_valve.jpg`,
  prod_spare_02: `${SERVER_BASE}/spare_valve.jpg`,
  prod_spare_03: `${SERVER_BASE}/spare_valve.jpg`,
  prod_spare_04: `${SERVER_BASE}/spare_valve.jpg`,
  prod_spare_05: `${SERVER_BASE}/spare_fittings.jpg`,
  prod_spare_06: `${SERVER_BASE}/spare_housing.jpg`,
  prod_spare_07: `${SERVER_BASE}/spare_uv.jpg`,
  prod_spare_08: `${SERVER_BASE}/spare_tds.jpg`,
  prod_spare_09: `${SERVER_BASE}/spare_fittings.jpg`,
  prod_spare_10: `${SERVER_BASE}/filter_membrane.jpg`
};

async function updateFirestoreImages() {
  console.log("Updating all product images in Firestore...");
  let count = 0;
  const batch = db.batch();

  for (const [id, imageUrl] of Object.entries(PRODUCT_IMAGE_MAP)) {
    const ref = db.collection("products").doc(id);
    batch.update(ref, { imageUrl });
    count++;
  }

  await batch.commit();
  console.log(`Successfully updated ${count} products in Firestore with matching high-res images.`);
  process.exit(0);
}

updateFirestoreImages().catch(err => {
  console.error("Firestore image update failed:", err);
  process.exit(1);
});
