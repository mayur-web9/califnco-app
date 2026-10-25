// Direct 1-to-1 mapping of all 52 unique product IDs to their dedicated photography asset
const LOCAL_PRODUCT_IMAGES = {
  // Purifiers (12 unique products)
  prod_purifier_01: require("../../assets/products/prod_purifier_01.jpg"),
  prod_purifier_02: require("../../assets/products/prod_purifier_02.jpg"),
  prod_purifier_03: require("../../assets/products/prod_purifier_03.jpg"),
  prod_purifier_04: require("../../assets/products/prod_purifier_04.jpg"),
  prod_purifier_05: require("../../assets/products/prod_purifier_05.jpg"),
  prod_purifier_06: require("../../assets/products/prod_purifier_06.jpg"),
  prod_purifier_07: require("../../assets/products/prod_purifier_07.jpg"),
  prod_purifier_08: require("../../assets/products/prod_purifier_08.jpg"),
  prod_purifier_09: require("../../assets/products/prod_purifier_09.jpg"),
  prod_purifier_10: require("../../assets/products/prod_purifier_10.jpg"),
  prod_purifier_11: require("../../assets/products/prod_purifier_11.jpg"),
  prod_purifier_12: require("../../assets/products/prod_purifier_12.jpg"),

  // Dispensers (10 unique products)
  prod_dispenser_01: require("../../assets/products/prod_dispenser_01.jpg"),
  prod_dispenser_02: require("../../assets/products/prod_dispenser_02.jpg"),
  prod_dispenser_03: require("../../assets/products/prod_dispenser_03.jpg"),
  prod_dispenser_04: require("../../assets/products/prod_dispenser_04.jpg"),
  prod_dispenser_05: require("../../assets/products/prod_dispenser_05.jpg"),
  prod_dispenser_06: require("../../assets/products/prod_dispenser_06.jpg"),
  prod_dispenser_07: require("../../assets/products/prod_dispenser_07.jpg"),
  prod_dispenser_08: require("../../assets/products/prod_dispenser_08.jpg"),
  prod_dispenser_09: require("../../assets/products/prod_dispenser_09.jpg"),
  prod_dispenser_10: require("../../assets/products/prod_dispenser_10.jpg"),

  // Pumps (10 unique products)
  prod_pump_01: require("../../assets/products/prod_pump_01.jpg"),
  prod_pump_02: require("../../assets/products/prod_pump_02.jpg"),
  prod_pump_03: require("../../assets/products/prod_pump_03.jpg"),
  prod_pump_04: require("../../assets/products/prod_pump_04.jpg"),
  prod_pump_05: require("../../assets/products/prod_pump_05.jpg"),
  prod_pump_06: require("../../assets/products/prod_pump_06.jpg"),
  prod_pump_07: require("../../assets/products/prod_pump_07.jpg"),
  prod_pump_08: require("../../assets/products/prod_pump_08.jpg"),
  prod_pump_09: require("../../assets/products/prod_pump_09.jpg"),
  prod_pump_10: require("../../assets/products/prod_pump_10.jpg"),

  // Filters (10 unique products)
  prod_filter_01: require("../../assets/products/prod_filter_01.jpg"),
  prod_filter_02: require("../../assets/products/prod_filter_02.jpg"),
  prod_filter_03: require("../../assets/products/prod_filter_03.jpg"),
  prod_filter_04: require("../../assets/products/prod_filter_04.jpg"),
  prod_filter_05: require("../../assets/products/prod_filter_05.jpg"),
  prod_filter_06: require("../../assets/products/prod_filter_06.jpg"),
  prod_filter_07: require("../../assets/products/prod_filter_07.jpg"),
  prod_filter_08: require("../../assets/products/prod_filter_08.jpg"),
  prod_filter_09: require("../../assets/products/prod_filter_09.jpg"),
  prod_filter_10: require("../../assets/products/prod_filter_10.jpg"),

  // Spares (10 unique products)
  prod_spare_01: require("../../assets/products/prod_spare_01.jpg"),
  prod_spare_02: require("../../assets/products/prod_spare_02.jpg"),
  prod_spare_03: require("../../assets/products/prod_spare_03.jpg"),
  prod_spare_04: require("../../assets/products/prod_spare_04.jpg"),
  prod_spare_05: require("../../assets/products/prod_spare_05.jpg"),
  prod_spare_06: require("../../assets/products/prod_spare_06.jpg"),
  prod_spare_07: require("../../assets/products/prod_spare_07.jpg"),
  prod_spare_08: require("../../assets/products/prod_spare_08.jpg"),
  prod_spare_09: require("../../assets/products/prod_spare_09.jpg"),
  prod_spare_10: require("../../assets/products/prod_spare_10.jpg")
};

const CATEGORY_FALLBACKS = {
  Purifier: require("../../assets/products/prod_purifier_01.jpg"),
  Dispenser: require("../../assets/products/prod_dispenser_01.jpg"),
  Pump: require("../../assets/products/prod_pump_01.jpg"),
  Filter: require("../../assets/products/prod_filter_01.jpg"),
  Spare: require("../../assets/products/prod_spare_06.jpg")
};

let CLOUDINARY_IMAGES = {};
try {
  CLOUDINARY_IMAGES = require("./cloudinaryImages.json");
} catch (e) {}

/**
 * Returns a reliable Image source object (Cloudinary hosted URL with local asset fallback)
 * @param {object} product - Product model from Firestore
 * @returns {ImageSourcePropType}
 */
export function getProductImageSource(product) {
  if (!product) return CATEGORY_FALLBACKS.Purifier;

  // 1. Live Cloudinary hosted URL from product document
  if (product.imageUrl && typeof product.imageUrl === "string" && product.imageUrl.startsWith("http")) {
    return { uri: product.imageUrl };
  }

  // 2. Cloudinary hosted URL from mapping
  if (product.id && CLOUDINARY_IMAGES[product.id]) {
    return { uri: CLOUDINARY_IMAGES[product.id] };
  }

  // 3. Exact unique local high-resolution match by product ID
  if (product.id && LOCAL_PRODUCT_IMAGES[product.id]) {
    return LOCAL_PRODUCT_IMAGES[product.id];
  }

  // 4. Category fallback
  if (product.category && CATEGORY_FALLBACKS[product.category]) {
    return CATEGORY_FALLBACKS[product.category];
  }

  return CATEGORY_FALLBACKS.Purifier;
}
