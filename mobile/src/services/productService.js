import { db } from "../config/firebase";
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit } from "firebase/firestore";

// Fetch all products (public)
export async function getProducts() {
  const snap = await getDocs(query(collection(db, "products"), orderBy("name")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Fetch products by category
export async function getProductsByCategory(category) {
  if (category === "All") return getProducts();
  const snap = await getDocs(
    query(collection(db, "products"), where("category", "==", category), orderBy("name"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Fetch a single product
export async function getProduct(productId) {
  const snap = await getDoc(doc(db, "products", productId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Fetch wholesale prices (only for approved dealers/admins — Firestore rules enforce this)
export async function getWholesalePrices() {
  const snap = await getDocs(collection(db, "wholesale"));
  const map = {};
  snap.docs.forEach(d => { map[d.id] = d.data(); });
  return map;
}
