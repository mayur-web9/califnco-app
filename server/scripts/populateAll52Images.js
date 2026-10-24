const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const ARTIFACT_DIR = "C:/Users/royal/.gemini/antigravity-ide/brain/df3d166e-7429-4e93-b5d3-97a8ca5c5042";
const MOBILE_DEST = path.resolve(__dirname, "../../mobile/assets/products");
const SERVER_DEST = path.resolve(__dirname, "../public/products");

fs.mkdirSync(MOBILE_DEST, { recursive: true });
fs.mkdirSync(SERVER_DEST, { recursive: true });

// 1. High-Resolution locally generated studio photos (24 items)
const LOCAL_STUDIO_MAP = {
  prod_purifier_01: "ro_water_purifier_1792775196884.jpg",
  prod_purifier_03: "undersink_ro_system_1792775359403.jpg",
  prod_dispenser_01: "water_dispenser_1792775215808.jpg",
  prod_dispenser_02: "dispenser_top_load_1792823006900.jpg",
  prod_dispenser_04: "touchfree_sensor_dispenser_1792823251764.jpg",
  prod_dispenser_05: "instant_kettle_dispenser_1792823196076.jpg",
  prod_dispenser_06: "sparkling_water_dispenser_1792823291122.jpg",
  prod_dispenser_07: "office_water_cooler_1792823221097.jpg",
  prod_dispenser_08: "slimline_desktop_dispenser_1792823328213.jpg",
  prod_dispenser_09: "child_lock_dispenser_1792823358501.jpg",
  prod_pump_01: "ro_booster_pump_1792775169287.jpg",
  prod_filter_01: "water_filter_cartridges_1792775234756.jpg",
  prod_filter_04: "ro_membrane_element_1792775258250.jpg",
  prod_filter_06: "bioalkaline_mineral_cartridge_1792823115458.jpg",
  prod_filter_08: "antiscalant_filter_cartridge_1792823139674.jpg",
  prod_filter_10: "vontron_100gpd_membrane_1792823166913.jpg",
  prod_spare_02: "solenoid_valve_spare_1792775337713.jpg",
  prod_spare_03: "low_pressure_switch_1792823038890.jpg",
  prod_spare_05: "flow_restrictor_fr450_1792823063713.jpg",
  prod_spare_06: "transparent_filter_housing_1792775278958.jpg",
  prod_spare_07: "uv_sterilizer_lamp_1792775296525.jpg",
  prod_spare_08: "tds_water_tester_1792775318530.jpg",
  prod_spare_09: "ro_fittings_kit_1792775379427.jpg",
  prod_spare_10: "membrane_housing_vessel_1792823089930.jpg"
};

// 2. Exact Commons File Titles for remaining 28 products
const COMMONS_FILE_MAP = {
  prod_purifier_02: "File:Aquaguard Water Purifier RO Enhanced - Snap 2581.JPG",
  prod_purifier_04: "File:Aquaguard Water Purifier RO Enhanced - Snap 2583.JPG",
  prod_purifier_05: "File:A 1000 liter reverse osmosis plant for commercial use.jpg",
  prod_purifier_06: "File:Ceramic water filter.jpg",
  prod_purifier_07: "File:Reverse Osmosis System.jpg",
  prod_purifier_08: "File:BELE Water Purifier.jpg",
  prod_purifier_09: "File:Toray Torayvino SX705T 1.jpg",
  prod_purifier_10: "File:Reverse Osmosis Plant.JPG",
  prod_purifier_11: "File:Aquaguard Water Purifier RO Enhanced - Snap 2582.JPG",
  prod_purifier_12: "File:Aquaguard Water Purifier RO Enhanced - Snap 2584.JPG",

  prod_dispenser_03: "File:Water Dispenser Kaercher WPD.jpg",
  prod_dispenser_10: "File:Water-dispenser-aqua-clara.jpg",

  prod_pump_02: "File:Water pump 2.jpg",
  prod_pump_03: "File:Water pump 5.jpg",
  prod_pump_04: "File:Jet pump.jpg",
  prod_pump_05: "File:Kitashinano Country Forest and Cultural Park Nakano Pumping Station water pump and electric motor 1.jpg",
  prod_pump_06: "File:Kitashinano Country Forest and Cultural Park Nakano Pumping Station water pump and electric motor 2.jpg",
  prod_pump_07: "File:Submersible pump 0.75HP.jpg",
  prod_pump_08: "File:Water pump 1-2.jpg",
  prod_pump_09: "File:Dieselpump Preem Avesta.jpg",
  prod_pump_10: "File:Water pump, Vienna ( 1060223).jpg",

  prod_filter_02: "File:Carbon water filter.jpg",
  prod_filter_03: "File:Torayvino.filterl.new.jpg",
  prod_filter_05: "File:Toray Torayvino STC.TJ.jpg",
  prod_filter_07: "File:Reverse osmosis membrane element layers.jpg",
  prod_filter_09: "File:CeramicWaterFilter.jpg",

  prod_spare_01: "File:Tap-jig-torneira.JPG",
  prod_spare_04: "File:Tensioschalter.png"
};

function getCommonsImageUrl(fileTitle) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
    https.get(apiUrl, { headers: { "User-Agent": "CalifncoApp/1.0 (https://califnco.com; contact@califnco.com)" } }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const page = Object.values(json.query?.pages || {})[0];
          const imgUrl = page?.imageinfo?.[0]?.url;
          if (imgUrl) resolve(imgUrl);
          else reject(new Error(`No image URL found for ${fileTitle}`));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function downloadWithCurl(url, destPath) {
  const ua = "CalifncoApp/1.0 (https://califnco.com; contact@califnco.com)";
  execSync(`curl.exe -s -L "${url}" -H "User-Agent: ${ua}" -o "${destPath}"`, { timeout: 35000 });
}

async function populateAll() {
  console.log("=== POPULATING ALL 52 DEDICATED PRODUCT IMAGES ===");

  // Step 1: Copy the 24 local studio images
  for (const [prodId, artifactFile] of Object.entries(LOCAL_STUDIO_MAP)) {
    const srcPath = path.join(ARTIFACT_DIR, artifactFile);
    const mobTarget = path.join(MOBILE_DEST, `${prodId}.jpg`);
    const srvTarget = path.join(SERVER_DEST, `${prodId}.jpg`);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, mobTarget);
      fs.copyFileSync(srcPath, srvTarget);
      const sizeKb = (fs.statSync(mobTarget).size / 1024).toFixed(1);
      console.log(`[STUDIO] ${prodId} <- ${artifactFile} (${sizeKb} KB)`);
    } else {
      console.warn(`[MISSING LOCAL STUDIO] ${srcPath}`);
    }
  }

  // Step 2: Download remaining 28 images via official Commons API + curl
  for (const [prodId, fileTitle] of Object.entries(COMMONS_FILE_MAP)) {
    const mobTarget = path.join(MOBILE_DEST, `${prodId}.jpg`);
    const srvTarget = path.join(SERVER_DEST, `${prodId}.jpg`);

    try {
      const liveUrl = await getCommonsImageUrl(fileTitle);
      console.log(`[FETCHING] ${prodId} <- ${fileTitle}`);
      downloadWithCurl(liveUrl, mobTarget);
      if (fs.existsSync(mobTarget) && fs.statSync(mobTarget).size > 1000) {
        fs.copyFileSync(mobTarget, srvTarget);
        const sizeKb = (fs.statSync(mobTarget).size / 1024).toFixed(1);
        console.log(`[SUCCESS] ${prodId} saved (${sizeKb} KB)`);
      } else {
        console.error(`[EMPTY] ${prodId} was 0 bytes`);
      }
    } catch (err) {
      console.error(`[FAILED] ${prodId}:`, err.message);
    }
  }

  // Step 3: Verification
  let totalValid = 0;
  const missing = [];
  const checkList = [
    ...Array.from({ length: 12 }, (_, i) => `prod_purifier_${String(i + 1).padStart(2, "0")}`),
    ...Array.from({ length: 10 }, (_, i) => `prod_dispenser_${String(i + 1).padStart(2, "0")}`),
    ...Array.from({ length: 10 }, (_, i) => `prod_pump_${String(i + 1).padStart(2, "0")}`),
    ...Array.from({ length: 10 }, (_, i) => `prod_filter_${String(i + 1).padStart(2, "0")}`),
    ...Array.from({ length: 10 }, (_, i) => `prod_spare_${String(i + 1).padStart(2, "0")}`),
  ];

  for (const id of checkList) {
    const p = path.join(MOBILE_DEST, `${id}.jpg`);
    if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
      totalValid++;
    } else {
      missing.push(id);
    }
  }

  console.log(`\n============================================`);
  console.log(`TOTAL UNIQUE VERIFIED IMAGES: ${totalValid} / 52`);
  if (missing.length === 0) {
    console.log(`ALL 52 PRODUCTS HAVE 100% UNIQUE DEDICATED IMAGES!`);
  } else {
    console.warn(`Missing:`, missing);
  }
  console.log(`============================================\n`);
}

populateAll().catch(e => {
  console.error(e);
  process.exit(1);
});
