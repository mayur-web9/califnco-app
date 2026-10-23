const { admin, db, auth } = require("../firebaseAdmin");

const products = [
  // --- Category: Purifier (12 items) ---
  {
    id: "prod_purifier_01",
    name: "AquaPure Copper+ Alkaline RO Water Purifier",
    description: "Multi-stage RO + UV + UF purification enriched with copper and alkaline minerals. 8-liter storage capacity with LED display indicators.",
    category: "Purifier",
    price: 14999,
    wholesalePrice: 9800,
    minQty: 5,
    stock: 45,
    rating: 4.8,
    reviewCount: 142,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_02",
    name: "HydroShield Wall-Mounted UV+UF Purifier",
    description: "Compact wall-hung water purifier ideal for municipal water supply. Chemical-free purification with stainless steel UV chamber.",
    category: "Purifier",
    price: 8499,
    wholesalePrice: 5600,
    minQty: 5,
    stock: 60,
    rating: 4.6,
    reviewCount: 98,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_03",
    name: "Under-Sink Compact RO System 15LPH",
    description: "Hidden under-counter RO purifier with brushed chrome faucet and 10L pressurized expansion tank. Zero countertop clutter.",
    category: "Purifier",
    price: 18999,
    wholesalePrice: 12500,
    minQty: 3,
    stock: 28,
    rating: 4.9,
    reviewCount: 74,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_undersink.jpg"
  },
  {
    id: "prod_purifier_04",
    name: "Califnco Smart Touchscreen RO Purifier",
    description: "IoT-enabled smart purifier with real-time TDS display, filter life monitoring, and auto leak detection. 10-stage purification.",
    category: "Purifier",
    price: 21999,
    wholesalePrice: 14800,
    minQty: 3,
    stock: 32,
    rating: 4.9,
    reviewCount: 215,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_05",
    name: "ProClean Commercial 50 LPH RO Plant",
    description: "High-capacity dual membrane RO system designed for offices, cafes, and clinics. Delivers up to 50 liters purified water per hour.",
    category: "Purifier",
    price: 34999,
    wholesalePrice: 24500,
    minQty: 2,
    stock: 15,
    rating: 4.7,
    reviewCount: 46,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_undersink.jpg"
  },
  {
    id: "prod_purifier_06",
    name: "PureFlow Gravity Non-Electric UF Purifier",
    description: "Zero-electricity gravity water filter with 20L storage. Removes bacteria, cysts, and suspended solids without power.",
    category: "Purifier",
    price: 3299,
    wholesalePrice: 2100,
    minQty: 10,
    stock: 85,
    rating: 4.4,
    reviewCount: 180,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_07",
    name: "EcoSaver Zero Water Waste RO Purifier",
    description: "Advanced recovery RO technology saves up to 70% water compared to standard purifiers. Includes mineralizer cartridge.",
    category: "Purifier",
    price: 16999,
    wholesalePrice: 11200,
    minQty: 4,
    stock: 40,
    rating: 4.8,
    reviewCount: 110,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_08",
    name: "AeroPure Stainless Steel Tank RO Purifier",
    description: "Heavy-duty 304 food-grade stainless steel storage tank prevents bacterial biofilm growth. 9L capacity with UV LED in-tank sterilizer.",
    category: "Purifier",
    price: 19499,
    wholesalePrice: 13200,
    minQty: 3,
    stock: 22,
    rating: 4.9,
    reviewCount: 88,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_09",
    name: "AquaCompact Tabletop Portable RO",
    description: "Plug-and-play countertop RO machine with instant hot and ambient water dispensing. No plumbing installation required.",
    category: "Purifier",
    price: 13999,
    wholesalePrice: 9400,
    minQty: 5,
    stock: 35,
    rating: 4.6,
    reviewCount: 65,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_10",
    name: "MaxiClear 25 LPH Light Commercial RO",
    description: "Reliable 25 liters-per-hour purification unit for small offices and retail shops. Dual booster pump architecture.",
    category: "Purifier",
    price: 24999,
    wholesalePrice: 17200,
    minQty: 2,
    stock: 18,
    rating: 4.7,
    reviewCount: 39,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_undersink.jpg"
  },
  {
    id: "prod_purifier_11",
    name: "BioMineral Zinc+Copper Wall RO Unit",
    description: "Infuses essential zinc and copper micro-nutrients while eliminating 99.9% of heavy metals and dissolved impurities.",
    category: "Purifier",
    price: 15499,
    wholesalePrice: 10400,
    minQty: 5,
    stock: 50,
    rating: 4.7,
    reviewCount: 130,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },
  {
    id: "prod_purifier_12",
    name: "AquaShield Alkaline Booster RO + Active Carbon",
    description: "Maintains optimal pH between 7.5 and 8.5 with Japanese active carbon block and DuPont Filmtec membrane.",
    category: "Purifier",
    price: 17499,
    wholesalePrice: 11800,
    minQty: 4,
    stock: 29,
    rating: 4.8,
    reviewCount: 92,
    imageUrl: "https://califnco-app.onrender.com/public/products/purifier_wall.jpg"
  },

  // --- Category: Dispenser (10 items) ---
  {
    id: "prod_dispenser_01",
    name: "Polaris Bottom-Loading Hot & Cold Dispenser",
    description: "Effortless bottom loading bottle design. Provides hot (90°C), cold (10°C), and ambient drinking water with child safety lock.",
    category: "Dispenser",
    price: 12499,
    wholesalePrice: 8500,
    minQty: 4,
    stock: 30,
    rating: 4.7,
    reviewCount: 85,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_02",
    name: "AquaDesk Top-Loading Countertop Dispenser",
    description: "Space-saving compact tabletop dispenser for homes and small conference rooms. Quiet compressor cooling.",
    category: "Dispenser",
    price: 6999,
    wholesalePrice: 4700,
    minQty: 6,
    stock: 45,
    rating: 4.5,
    reviewCount: 62,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_03",
    name: "Directline Bottleless RO Water Dispenser",
    description: "Connects directly to tap line with built-in 4-stage RO purification. Eliminates 20-liter water jug deliveries.",
    category: "Dispenser",
    price: 24999,
    wholesalePrice: 17500,
    minQty: 2,
    stock: 14,
    rating: 4.9,
    reviewCount: 41,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_04",
    name: "TouchFree Sensor Handsfree Dispenser",
    description: "Infrared touchless motion sensors for hygienic operation in hospitals and corporate cafeterias. Prevents cross-contamination.",
    category: "Dispenser",
    price: 15999,
    wholesalePrice: 10900,
    minQty: 3,
    stock: 25,
    rating: 4.8,
    reviewCount: 53,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_05",
    name: "ThermoPro Instant Electric Kettle Dispenser",
    description: "Instant boiling water in 3 seconds with digital temperature presets (45°C, 65°C, 85°C, 100°C) for green tea, baby formula, coffee.",
    category: "Dispenser",
    price: 5499,
    wholesalePrice: 3600,
    minQty: 8,
    stock: 70,
    rating: 4.6,
    reviewCount: 118,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_06",
    name: "SparkFlow Carbonated Soda & Water Dispenser",
    description: "Premium countertop dispenser serving chilled still, ambient, and sparkling water on tap with quick-swap CO2 cylinder.",
    category: "Dispenser",
    price: 28999,
    wholesalePrice: 19800,
    minQty: 2,
    stock: 12,
    rating: 4.9,
    reviewCount: 37,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_07",
    name: "FrostWave Heavy-Duty Office Water Cooler",
    description: "Dual stainless steel faucets with high cooling capacity (20L/hr). Built for factory floors, gyms, and large staff areas.",
    category: "Dispenser",
    price: 19999,
    wholesalePrice: 13900,
    minQty: 3,
    stock: 20,
    rating: 4.7,
    reviewCount: 49,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_08",
    name: "SlimLine Tabletop Automatic Dispenser",
    description: "Ultra-slim 18cm footprint with hidden push buttons and night-light illumination. Energy Star rated compressor.",
    category: "Dispenser",
    price: 8999,
    wholesalePrice: 6100,
    minQty: 5,
    stock: 38,
    rating: 4.5,
    reviewCount: 72,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_09",
    name: "SafeGuard Child-Lock Warm & Cold Dispenser",
    description: "Child-proof hot spout with dual electronic push paddles and easy removable drip tray. Antibacterial coating.",
    category: "Dispenser",
    price: 10499,
    wholesalePrice: 7200,
    minQty: 4,
    stock: 33,
    rating: 4.6,
    reviewCount: 64,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },
  {
    id: "prod_dispenser_10",
    name: "AquaBar Commercial Freestanding RO Cooler",
    description: "Direct-inlet 3-temperature commercial cooler with internal 5-stage filtration and UV storage circulation.",
    category: "Dispenser",
    price: 32499,
    wholesalePrice: 22800,
    minQty: 2,
    stock: 10,
    rating: 4.8,
    reviewCount: 29,
    imageUrl: "https://califnco-app.onrender.com/public/products/dispenser_cooler.jpg"
  },

  // --- Category: Pump (10 items) ---
  {
    id: "prod_pump_01",
    name: "HydroDrive 75 GPD Domestic RO Booster Pump",
    description: "Standard 24V DC booster pump delivering 100-125 PSI for residential RO membranes. Low vibration and silent operation.",
    category: "Pump",
    price: 1899,
    wholesalePrice: 1150,
    minQty: 10,
    stock: 120,
    rating: 4.7,
    reviewCount: 310,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_02",
    name: "TorqueFlow 100 GPD Heavy-Duty RO Pump",
    description: "High-pressure diaphragm booster pump rated 130 PSI with 1.8 LPM open flow rate. 100% copper winding motor.",
    category: "Pump",
    price: 2399,
    wholesalePrice: 1480,
    minQty: 10,
    stock: 95,
    rating: 4.8,
    reviewCount: 204,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_03",
    name: "ForceMax 150 GPD Commercial Diaphragm Pump",
    description: "Heavy-duty 36V DC pump designed for 150 GPD commercial filtration units. Long-life ceramic bearings.",
    category: "Pump",
    price: 3499,
    wholesalePrice: 2200,
    minQty: 5,
    stock: 65,
    rating: 4.9,
    reviewCount: 88,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_04",
    name: "Self-Priming Low-Pressure Suction RO Pump",
    description: "Works seamlessly even with zero inlet water pressure from overhead tanks. Self-primes up to 2 meters suction lift.",
    category: "Pump",
    price: 2799,
    wholesalePrice: 1750,
    minQty: 8,
    stock: 75,
    rating: 4.6,
    reviewCount: 145,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_05",
    name: "WhisperQuiet 24V Ultra-Silent RO Pump",
    description: "Sound-damped rubber mount isolation body with patented silent rotor. Noise level below 35 dB.",
    category: "Pump",
    price: 2199,
    wholesalePrice: 1390,
    minQty: 10,
    stock: 80,
    rating: 4.8,
    reviewCount: 167,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_06",
    name: "HighPressure 300 GPD Industrial Rotary Pump",
    description: "Twin-head 48V rotary vane pump engineered for light industrial RO plants up to 300 GPD capacity.",
    category: "Pump",
    price: 5999,
    wholesalePrice: 3950,
    minQty: 3,
    stock: 30,
    rating: 4.9,
    reviewCount: 42,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_07",
    name: "SolarPower DC 12V/24V Submersible RO Pump",
    description: "Compatible with solar photovoltaic off-grid setups. Brushless DC motor with 10,000+ hours lifespan.",
    category: "Pump",
    price: 3899,
    wholesalePrice: 2500,
    minQty: 5,
    stock: 40,
    rating: 4.7,
    reviewCount: 56,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_08",
    name: "AutoCut Smart Pressure Switch Integrated Pump",
    description: "Built-in auto shutoff sensor stops the pump immediately when the storage tank is full. Prevents dry run.",
    category: "Pump",
    price: 2699,
    wholesalePrice: 1690,
    minQty: 8,
    stock: 60,
    rating: 4.6,
    reviewCount: 91,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_09",
    name: "PowerBoost 50 GPD Economy RO Pump",
    description: "Budget-friendly durable replacement pump for standard 50-75 GPD water purifiers. Universal fit brackets.",
    category: "Pump",
    price: 1599,
    wholesalePrice: 980,
    minQty: 12,
    stock: 140,
    rating: 4.4,
    reviewCount: 220,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },
  {
    id: "prod_pump_10",
    name: "DualHead 200 GPD Restaurant Grade Pump",
    description: "Twin-stage diaphragm pump delivering high stability under continuous 12-hour commercial duty cycles.",
    category: "Pump",
    price: 4499,
    wholesalePrice: 2900,
    minQty: 4,
    stock: 35,
    rating: 4.8,
    reviewCount: 63,
    imageUrl: "https://califnco-app.onrender.com/public/products/pump_booster.jpg"
  },

  // --- Category: Filter (10 items) ---
  {
    id: "prod_filter_01",
    name: "Spun Polypropylene 5-Micron Sediment Filter",
    description: "Thermal bonded 100% pure polypropylene fiber removes sand, silt, rust, and suspended dirt particles before RO stage.",
    category: "Filter",
    price: 249,
    wholesalePrice: 85,
    minQty: 25,
    stock: 400,
    rating: 4.8,
    reviewCount: 520,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_02",
    name: "Granular Activated Carbon (GAC) Filter Cartridge",
    description: "Premium coconut shell activated carbon removes chlorine, volatile organic compounds (VOCs), and foul odors.",
    category: "Filter",
    price: 499,
    wholesalePrice: 220,
    minQty: 20,
    stock: 250,
    rating: 4.7,
    reviewCount: 310,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_03",
    name: "Carbon Block (CTO) High-Density Extruded Filter",
    description: "10-inch extruded carbon block for secondary organic chemical and residual chlorine polishing. NSF certified.",
    category: "Filter",
    price: 549,
    wholesalePrice: 260,
    minQty: 20,
    stock: 210,
    rating: 4.8,
    reviewCount: 275,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_04",
    name: "80 GPD Thin Film Composite (TFC) RO Membrane",
    description: "0.0001 micron filtration membrane removes heavy metals, arsenic, fluorides, and dissolved salts up to 2500 TDS.",
    category: "Filter",
    price: 1899,
    wholesalePrice: 950,
    minQty: 10,
    stock: 180,
    rating: 4.9,
    reviewCount: 412,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_membrane.jpg"
  },
  {
    id: "prod_filter_05",
    name: "Silver-Impregnated Post Carbon Taste Enhancer",
    description: "Inline bacteriostatic post carbon filter restores the natural sweet crisp taste to purified tank water.",
    category: "Filter",
    price: 449,
    wholesalePrice: 190,
    minQty: 20,
    stock: 320,
    rating: 4.8,
    reviewCount: 198,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_06",
    name: "BioAlkaline Mineral Balancer Cartridge (pH 8+)",
    description: "Replenishes essential calcium, magnesium, potassium, and sodium minerals back into pure RO water.",
    category: "Filter",
    price: 799,
    wholesalePrice: 380,
    minQty: 15,
    stock: 160,
    rating: 4.9,
    reviewCount: 240,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_07",
    name: "Ultra-Filtration (UF) Hollow Fiber Membrane 0.01 Micron",
    description: "Physical barrier removes suspended colloids and microscopic pathogens without discarding any waste water.",
    category: "Filter",
    price: 699,
    wholesalePrice: 310,
    minQty: 15,
    stock: 190,
    rating: 4.6,
    reviewCount: 155,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_membrane.jpg"
  },
  {
    id: "prod_filter_08",
    name: "Anti-Scalant Polyphosphate Pre-Filter Cartridge",
    description: "Sequestrates hard calcium and magnesium ions to prevent scaling on RO membranes in high-borewell areas.",
    category: "Filter",
    price: 599,
    wholesalePrice: 280,
    minQty: 15,
    stock: 140,
    rating: 4.5,
    reviewCount: 88,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_09",
    name: "Iron & Heavy Metal Removal Catalytic Media Filter",
    description: "Birm & manganese greensand media oxidizes and filters dissolved iron rust and yellow water from borewells.",
    category: "Filter",
    price: 999,
    wholesalePrice: 520,
    minQty: 10,
    stock: 110,
    rating: 4.7,
    reviewCount: 76,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_cartridge.jpg"
  },
  {
    id: "prod_filter_10",
    name: "100 GPD High-Rejection Vontron RO Membrane",
    description: "Industrial-grade thin-film element with 98% stabilized salt rejection rate for tough groundwater.",
    category: "Filter",
    price: 2299,
    wholesalePrice: 1200,
    minQty: 10,
    stock: 130,
    rating: 4.8,
    reviewCount: 185,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_membrane.jpg"
  },

  // --- Category: Spare (10 items) ---
  {
    id: "prod_spare_01",
    name: "Solid Brass Feed Water Diverter Valve & Adapter",
    description: "Heavy solid brass chrome plated tee adapter with 1/4 inch quick ball valve for sink tap connection.",
    category: "Spare",
    price: 349,
    wholesalePrice: 140,
    minQty: 25,
    stock: 300,
    rating: 4.7,
    reviewCount: 160,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_valve.jpg"
  },
  {
    id: "prod_spare_02",
    name: "Electronic Solenoid Valve (SV) 24V DC 1/4 Inch",
    description: "Normally closed automatic water shutoff valve. Cuts water flow instantly when power or purification stops.",
    category: "Spare",
    price: 499,
    wholesalePrice: 220,
    minQty: 20,
    stock: 220,
    rating: 4.8,
    reviewCount: 290,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_valve.jpg"
  },
  {
    id: "prod_spare_03",
    name: "Low Pressure Switch (LPS) Auto Dry-Run Protector",
    description: "Detects water stoppage in input line and powers down the booster pump to prevent burnout.",
    category: "Spare",
    price: 299,
    wholesalePrice: 110,
    minQty: 30,
    stock: 280,
    rating: 4.6,
    reviewCount: 140,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_valve.jpg"
  },
  {
    id: "prod_spare_04",
    name: "High Pressure Switch (HPS) Tank-Full Sensor",
    description: "1/4-inch push-fit microswitch trips when storage pressure reaches 35-40 PSI.",
    category: "Spare",
    price: 299,
    wholesalePrice: 110,
    minQty: 30,
    stock: 270,
    rating: 4.6,
    reviewCount: 155,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_valve.jpg"
  },
  {
    id: "prod_spare_05",
    name: "RO Waste Water Flow Restrictor (FR-450)",
    description: "Calibrated 450 cc/min capillary restrictor maintains essential membrane back-pressure.",
    category: "Spare",
    price: 149,
    wholesalePrice: 45,
    minQty: 50,
    stock: 500,
    rating: 4.8,
    reviewCount: 380,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_fittings.jpg"
  },
  {
    id: "prod_spare_06",
    name: "10-Inch Transparent Pre-Filter Housing with Wrench",
    description: "Thick food-grade poly-carbonate casing with 1/4-inch brass threaded ports and leak-proof O-ring seal.",
    category: "Spare",
    price: 899,
    wholesalePrice: 420,
    minQty: 10,
    stock: 130,
    rating: 4.7,
    reviewCount: 175,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_housing.jpg"
  },
  {
    id: "prod_spare_07",
    name: "11W Philips UV Sterilizer Lamp with Quartz Glass Sleeve",
    description: "UV-C germicidal lamp tube destroys 99.99% DNA structure of viruses and bacteria. 9000 hour rated life.",
    category: "Spare",
    price: 699,
    wholesalePrice: 320,
    minQty: 15,
    stock: 190,
    rating: 4.9,
    reviewCount: 210,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_uv.jpg"
  },
  {
    id: "prod_spare_08",
    name: "Digital TDS Water Quality Tester Meter (0-9990 PPM)",
    description: "Handheld digital meter with LCD display and temperature sensor to check drinking water purity.",
    category: "Spare",
    price: 499,
    wholesalePrice: 210,
    minQty: 20,
    stock: 260,
    rating: 4.8,
    reviewCount: 430,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_tds.jpg"
  },
  {
    id: "prod_spare_09",
    name: "Quick-Connect Push-Fit Elbow & Tee Fittings Kit (12 Pcs)",
    description: "POM food grade 1/4-inch push fittings with stainless steel lock teeth. Zero tools required.",
    category: "Spare",
    price: 399,
    wholesalePrice: 160,
    minQty: 25,
    stock: 350,
    rating: 4.7,
    reviewCount: 220,
    imageUrl: "https://califnco-app.onrender.com/public/products/spare_fittings.jpg"
  },
  {
    id: "prod_spare_10",
    name: "Food-Grade 1812 RO Membrane Housing Vessel",
    description: "Seamless injection molded polypropylene pressure housing tested up to 300 PSI burst resistance.",
    category: "Spare",
    price: 599,
    wholesalePrice: 270,
    minQty: 15,
    stock: 170,
    rating: 4.8,
    reviewCount: 165,
    imageUrl: "https://califnco-app.onrender.com/public/products/filter_membrane.jpg"
  }
];

const testUsers = [
  {
    email: "customer@test.com",
    password: "Customer@123456",
    displayName: "Ananya Sharma",
    phone: "+919876543210",
    role: "Customer",
    dealerStatus: null,
    address: {
      line1: "Flat 402, Green Glen Apartments, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103"
    }
  },
  {
    email: "dealer@test.com",
    password: "Dealer@123456",
    displayName: "Rajesh Water Solutions (Approved)",
    phone: "+919811223344",
    role: "Dealer",
    dealerStatus: "approved",
    address: {
      line1: "Shop 12, Industrial Area Phase 2",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411018"
    }
  },
  {
    email: "dealer.pending@test.com",
    password: "Dealer@123456",
    displayName: "Kiran Enterprises (Pending Approval)",
    phone: "+919844556677",
    role: "Dealer",
    dealerStatus: "pending",
    address: {
      line1: "Shop 4, Gandhi Chowk",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001"
    }
  },
  {
    email: "admin@test.com",
    password: "Admin@123456",
    displayName: "Califnco Admin Desk",
    phone: "+919900011222",
    role: "Admin",
    dealerStatus: null,
    address: {
      line1: "Califnco HQ, Tech Park",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560100"
    }
  }
];

async function seed() {
  console.log("Starting Califnco Firestore & Auth Seed Process...");

  // 1. Seed Products and Wholesale collections
  console.log(`\nSeeding ${products.length} products into 'products' and 'wholesale' collections...`);
  const batchSize = 20;
  for (let i = 0; i < products.length; i += batchSize) {
    const chunk = products.slice(i, i + batchSize);
    const batch = db.batch();

    for (const item of chunk) {
      const { wholesalePrice, minQty, ...productDoc } = item;

      // products/{productId} doc (Public)
      const productRef = db.collection("products").doc(item.id);
      batch.set(productRef, {
        ...productDoc,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // wholesale/{productId} doc (Restricted to approved dealers & admin)
      const wholesaleRef = db.collection("wholesale").doc(item.id);
      batch.set(wholesaleRef, {
        productId: item.id,
        price: wholesalePrice,
        minQty: minQty,
        productName: item.name,
        category: item.category,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`Committed chunk ${i + 1} to ${Math.min(i + batchSize, products.length)}`);
  }
  console.log("All 52 products and wholesale prices successfully seeded!");

  // 2. Seed Test Users into Firebase Auth and Firestore users/{uid}
  console.log("\nSeeding test users into Firebase Auth & Firestore...");
  for (const user of testUsers) {
    let uid;
    try {
      const existing = await auth.getUserByEmail(user.email);
      uid = existing.uid;
      console.log(`User ${user.email} already exists in Auth (UID: ${uid})`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        const created = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          phoneNumber: user.phone
        });
        uid = created.uid;
        console.log(`Created Auth user: ${user.email} (UID: ${uid})`);
      } else {
        throw err;
      }
    }

    // Set custom claims if admin or approved dealer (optional boost)
    await auth.setCustomUserClaims(uid, {
      role: user.role,
      dealerStatus: user.dealerStatus
    });

    // Write Firestore users/{uid} doc
    await db.collection("users").doc(uid).set({
      uid: uid,
      email: user.email,
      name: user.displayName,
      phone: user.phone,
      role: user.role,
      dealerStatus: user.dealerStatus,
      address: user.address,
      fcmToken: "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Updated Firestore document for users/${uid} [role: ${user.role}, dealerStatus: ${user.dealerStatus}]`);
  }

  // 3. Initialize automation state doc
  const automationRef = db.collection("automation").doc("state");
  const autoDoc = await automationRef.get();
  if (!autoDoc.exists) {
    await automationRef.set({
      lastPostedProductId: products[0].id,
      lastPostedAt: admin.firestore.FieldValue.serverTimestamp(),
      postCount: 0
    });
    console.log("Initialized automation/state document.");
  }

  console.log("\nCalifnco seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});
