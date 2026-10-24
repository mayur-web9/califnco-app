import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCvENhVhJc7CqRMNVWiZwFpG-R0c9vRqVU",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0022579334.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "gen-lang-client-0022579334",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0022579334.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "963648279936",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:963648279936:web:ee5b2393e929162e135d65"
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  try {
    app = getApp();
  } catch (_) {
    app = initializeApp(firebaseConfig);
  }
}

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  try {
    auth = getAuth(app);
  } catch (_) {
    auth = null;
  }
}

let db;
try {
  db = getFirestore(app);
} catch (e) {
  console.warn("Firestore init warning:", e?.message);
}

export { auth, db };
export default app;

