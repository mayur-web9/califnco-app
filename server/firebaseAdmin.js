const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

let serviceAccount = null;

try {
  // Option 1: Base64-encoded string (recommended for cloud hosts like Render to avoid multiline escaping issues)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(decoded);
  }
  // Option 2: Raw JSON string in environment variable
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  // Option 3: Individual environment variables
  else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0022579334",
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }
  // Option 4: Render Secret File (/etc/secrets/serviceAccountKey.json)
  else if (fs.existsSync("/etc/secrets/serviceAccountKey.json")) {
    const raw = fs.readFileSync("/etc/secrets/serviceAccountKey.json", "utf8");
    serviceAccount = JSON.parse(raw);
  }
  // Option 5: Custom path from FIREBASE_SERVICE_ACCOUNT_PATH
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const customPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(customPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(customPath, "utf8"));
    }
  }
  // Option 6: Default local file in server directory
  else if (fs.existsSync(path.resolve(__dirname, "serviceAccountKey.json"))) {
    serviceAccount = JSON.parse(fs.readFileSync(path.resolve(__dirname, "serviceAccountKey.json"), "utf8"));
  }
} catch (err) {
  console.error("Error parsing Firebase service account credentials:", err.message);
}

if (!serviceAccount) {
  console.error("\n==================================================================");
  console.error("FATAL ERROR: Firebase Service Account credentials not found!");
  console.error("To fix this on Render, choose one of these simple options:");
  console.error("Option A (Recommended): Add an Environment Variable in Render:");
  console.error("  Key:   FIREBASE_SERVICE_ACCOUNT_BASE64");
  console.error("  Value: (base64 string of your serviceAccountKey.json)");
  console.error("Option B: In Render Dashboard -> Environment -> Secret Files:");
  console.error("  Filename: serviceAccountKey.json");
  console.error("  Content:  (paste contents of server/serviceAccountKey.json)");
  console.error("==================================================================\n");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
