import { db } from "../config/firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from "firebase/firestore";

export async function createServiceBooking({ userId, userName, phone, address, issue }) {
  const ref = await addDoc(collection(db, "services"), {
    userId,
    userName,
    phone,
    address,
    issue,
    status: "pending",
    notes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function getUserServiceBookings(userId) {
  try {
    const snap = await getDocs(
      query(collection(db, "services"), where("userId", "==", userId), orderBy("createdAt", "desc"))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // If composite index is pending/missing, query by userId and sort in memory
    const snap = await getDocs(
      query(collection(db, "services"), where("userId", "==", userId))
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
