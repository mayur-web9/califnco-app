import { db } from "../config/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";

// 1. Retail: Request Razorpay payment order from server (server recomputes total)
export async function createRetailPaymentOrder({ userId, items }) {
  const res = await fetch(`${SERVER_URL}/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${SERVER_URL}/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${SERVER_URL}/orders/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, items, address })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to place bulk order");
  }
  return data;
}

// 4. Fetch orders for current user (allowed by Firestore security rules: resource.data.userId == request.auth.uid)
export async function getUserOrders(userId) {
  try {
    const snap = await getDocs(
      query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // If composite index is pending/building, query by userId and sort in memory
    const snap = await getDocs(
      query(collection(db, "orders"), where("userId", "==", userId))
    );
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const timeA = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
      const timeB = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
      return timeB - timeA;
    });
    return list;
  }
}
