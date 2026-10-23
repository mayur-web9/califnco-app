import { auth, db } from "../config/firebase";
import { registerForPushNotificationsAsync } from "./notificationHelper";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Register a new user and create their Firestore profile
export async function register({ email, password, name, phone, role }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await updateProfile(cred.user, { displayName: name });

  const userDoc = {
    uid,
    email,
    name,
    phone,
    role,
    dealerStatus: role === "Dealer" ? "pending" : null,
    address: { line1: "", city: "", state: "", pincode: "" },
    fcmToken: "",
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", uid), userDoc);
  return { uid, ...userDoc };
}

// Sign in and return the Firestore user doc
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("User profile not found. Please contact support.");
  
  // Register push notification token on login
  registerForPushNotificationsAsync(uid).catch(e => console.warn("Push token registration error:", e.message));

  return { uid, ...snap.data() };
}

export async function logout() {
  await signOut(auth);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}
