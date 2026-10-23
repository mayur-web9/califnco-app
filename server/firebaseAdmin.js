const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

let serviceAccount;
try {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
  serviceAccount = require(path.resolve(__dirname, keyPath));
} catch (err) {
  console.error("Failed to load Firebase service account key:", err.message);
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
