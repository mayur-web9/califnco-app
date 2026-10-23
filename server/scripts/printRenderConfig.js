// Helper script to display Render deployment environment variables
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

console.log("==================================================================");
console.log("             CALIFNCO RENDER DEPLOYMENT HELPER                    ");
console.log("==================================================================\n");

const keyPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (fs.existsSync(keyPath)) {
  const content = fs.readFileSync(keyPath, "utf8");
  const base64 = Buffer.from(content).toString("base64");

  console.log("To resolve the Render deployment error, you have 2 easy options:\n");
  console.log("------------------------------------------------------------------");
  console.log("OPTION 1 (Recommended): Add Secret File in Render");
  console.log("------------------------------------------------------------------");
  console.log("1. Open Render Dashboard -> Your Service -> 'Environment'");
  console.log("2. Scroll down to 'Secret Files' and click 'Add Secret File'");
  console.log("3. Set Filename: serviceAccountKey.json");
  console.log("4. Paste the full JSON content from your server/serviceAccountKey.json file.");
  console.log("5. Click 'Save Changes'.\n");

  console.log("------------------------------------------------------------------");
  console.log("OPTION 2: Set Environment Variable FIREBASE_SERVICE_ACCOUNT_BASE64");
  console.log("------------------------------------------------------------------");
  console.log("In Render Dashboard -> Environment -> Add Environment Variable:");
  console.log("  Key:   FIREBASE_SERVICE_ACCOUNT_BASE64");
  console.log(`  Value: ${base64}\n`);
} else {
  console.log("Notice: server/serviceAccountKey.json was not found locally.");
}

console.log("------------------------------------------------------------------");
console.log("Standard Environment Variables for Render:");
console.log("------------------------------------------------------------------");
console.log(`NODE_ENV=production`);
console.log(`PORT=3001`);
console.log(`FIREBASE_PROJECT_ID=${process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0022579334"}`);
console.log(`RAZORPAY_KEY_ID=${process.env.RAZORPAY_KEY_ID || ""}`);
console.log(`RAZORPAY_KEY_SECRET=${process.env.RAZORPAY_KEY_SECRET || ""}`);
if (process.env.BREVO_API_KEY) console.log(`BREVO_API_KEY=${process.env.BREVO_API_KEY}`);
if (process.env.TEXTBEE_API_KEY) console.log(`TEXTBEE_API_KEY=${process.env.TEXTBEE_API_KEY}`);
if (process.env.TEXTBEE_DEVICE_ID) console.log(`TEXTBEE_DEVICE_ID=${process.env.TEXTBEE_DEVICE_ID}`);
console.log("==================================================================\n");
