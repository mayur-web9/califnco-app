import { db, auth } from "../config/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "https://califnco-app.onrender.com";

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Retail: Request Razorpay payment order from server (server recomputes total)
export async function createRetailPaymentOrder({ userId, items }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SERVER_URL}/payment/create-order`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userId, items })
  });
  const data = await res.json();
  if (!res.ok || !data.orderId) {
    throw new Error(data.error || "Failed to create payment order");
  }
  return data;
}

// 2. Retail: Verify Razorpay signature and create confirmed order on server
export async function verifyPaymentAndCreateOrder({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  userId,
  items,
  address
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      items,
      address
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Payment verification failed");
  }
  return data;
}

// 3. Wholesale: Place dealer bulk order via server (checks dealer approval & wholesale prices)
export async function placeBulkOrder({ userId, items, address }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userId, items, address })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to place bulk order");
  }
  return data;
}

// 4. Query orders for a user (Retail or Bulk)
export async function fetchUserOrders(userId) {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    // Fallback if composite index is pending
    const qFallback = query(collection(db, "orders"), where("userId", "==", userId));
    const snap = await getDocs(qFallback);
    const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    orders.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
    return orders;
  }
}

export const getUserOrders = fetchUserOrders;

