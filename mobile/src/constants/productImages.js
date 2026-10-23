// Mapping of product IDs to local high-resolution product photography assets
const LOCAL_PRODUCT_IMAGES = {
  // Purifiers
  prod_purifier_01: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_02: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_03: require("../../assets/products/purifier_undersink.jpg"),
  prod_purifier_04: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_05: require("../../assets/products/purifier_undersink.jpg"),
  prod_purifier_06: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_07: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_08: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_09: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_10: require("../../assets/products/purifier_undersink.jpg"),
  prod_purifier_11: require("../../assets/products/purifier_wall.jpg"),
  prod_purifier_12: require("../../assets/products/purifier_wall.jpg"),

  // Dispensers
  prod_dispenser_01: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_02: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_03: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_04: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_05: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_06: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_07: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_08: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_09: require("../../assets/products/dispenser_cooler.jpg"),
  prod_dispenser_10: require("../../assets/products/dispenser_cooler.jpg"),

  // Pumps
  prod_pump_01: require("../../assets/products/pump_booster.jpg"),
  prod_pump_02: require("../../assets/products/pump_booster.jpg"),
  prod_pump_03: require("../../assets/products/pump_booster.jpg"),
  prod_pump_04: require("../../assets/products/pump_booster.jpg"),
  prod_pump_05: require("../../assets/products/pump_booster.jpg"),
  prod_pump_06: require("../../assets/products/pump_booster.jpg"),
  prod_pump_07: require("../../assets/products/pump_booster.jpg"),
  prod_pump_08: require("../../assets/products/pump_booster.jpg"),
  prod_pump_09: require("../../assets/products/pump_booster.jpg"),
  prod_pump_10: require("../../assets/products/pump_booster.jpg"),

  // Filters
  prod_filter_01: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_02: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_03: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_04: require("../../assets/products/filter_membrane.jpg"),
  prod_filter_05: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_06: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_07: require("../../assets/products/filter_membrane.jpg"),
  prod_filter_08: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_09: require("../../assets/products/filter_cartridge.jpg"),
  prod_filter_10: require("../../assets/products/filter_membrane.jpg"),

  // Spares
  prod_spare_01: require("../../assets/products/spare_valve.jpg"),
  prod_spare_02: require("../../assets/products/spare_valve.jpg"),
  prod_spare_03: require("../../assets/products/spare_valve.jpg"),
  prod_spare_04: require("../../assets/products/spare_valve.jpg"),
  prod_spare_05: require("../../assets/products/spare_fittings.jpg"),
  prod_spare_06: require("../../assets/products/spare_housing.jpg"),
  prod_spare_07: require("../../assets/products/spare_uv.jpg"),
  prod_spare_08: require("../../assets/products/spare_tds.jpg"),
  prod_spare_09: require("../../assets/products/spare_fittings.jpg"),
  prod_spare_10: require("../../assets/products/filter_membrane.jpg")
};

const CATEGORY_FALLBACKS = {
  Purifier: require("../../assets/products/purifier_wall.jpg"),
  Dispenser: require("../../assets/products/dispenser_cooler.jpg"),
  Pump: require("../../assets/products/pump_booster.jpg"),
  Filter: require("../../assets/products/filter_cartridge.jpg"),
  Spare: require("../../assets/products/spare_housing.jpg")
};

/**
 * Returns a reliable Image source object (local asset or remote URI)
 * @param {object} product - Product model from Firestore
 * @returns {ImageSourcePropType}
 */
export function getProductImageSource(product) {
  if (!product) return CATEGORY_FALLBACKS.Purifier;

  // 1. Direct local high-resolution match by product ID
  if (product.id && LOCAL_PRODUCT_IMAGES[product.id]) {
    return LOCAL_PRODUCT_IMAGES[product.id];
  }

  // 2. Remote valid URL if provided
  if (product.imageUrl && typeof product.imageUrl === "string" && product.imageUrl.startsWith("http")) {
    return { uri: product.imageUrl };
  }

  // 3. Fallback to category asset
  if (product.category && CATEGORY_FALLBACKS[product.category]) {
    return CATEGORY_FALLBACKS[product.category];
  }

  return CATEGORY_FALLBACKS.Purifier;
}
