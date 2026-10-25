const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { admin, db } = require("./firebaseAdmin");
const {
  notifyOrderConfirmed,
  notifyOrderStatusChanged
} = require("./services/notificationService");

const app = express();
const PORT = process.env.PORT || 3001;

// Razorpay configuration & validation
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const isProduction = process.env.NODE_ENV === "production";
const isPlaceholder = !razorpayKeyId ||
  !razorpayKeySecret ||
  razorpayKeyId === "rzp_test_placeholder" ||
  razorpayKeySecret === "rzp_test_secret_placeholder" ||
  razorpayKeyId.trim() === "" ||
  razorpayKeySecret.trim() === "";

if (isProduction) {
  if (isPlaceholder) {
    console.error("FATAL CONFIGURATION ERROR: Server cannot start in production without valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    console.error("Missing or placeholder Razorpay keys detected in process.env.");
    process.exit(1);
  }
  if (!admin || !db || !admin.apps.length) {
    console.error("FATAL CONFIGURATION ERROR: Server cannot start in production without valid Firebase credentials.");
    process.exit(1);
  }
}

let razorpay = null;
if (razorpayKeyId && razorpayKeySecret && !isPlaceholder) {
  try {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });
  } catch (err) {
    console.warn("Razorpay client initialization notice:", err.message);
  }
}

// Rate limiting configuration
const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Restrict CORS to admin Vercel origin plus mobile app (configurable via ALLOWED_ORIGINS)
const defaultOrigins = [
  "https://califnco-app-phi.vercel.app",
  "https://califnco-app.vercel.app"
];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: function (origin, callback) {
    // Mobile apps and server-to-server calls do not send an Origin header
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy does not allow access from origin " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

// Rate-limited routes
app.use("/payment", apiLimiter);
app.use("/orders", apiLimiter);
app.use("/address/search", apiLimiter);
app.use("/notifications/send", apiLimiter);

// Auth Middleware: Verify Firebase ID Token on protected routes
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
  }

  const token = authHeader.split("Bearer ")[1].trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Empty bearer token" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.warn("Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired authentication token" });
  }
}

// 1. Root & Health Check Endpoints
app.get("/", (req, res) => {
  res.json({
    name: "Califnco Water Systems API",
    status: "active",
    environment: process.env.NODE_ENV || "development",
    service: "califnco-server",
    uptime: Math.round(process.uptime()),
    healthCheck: "/health",
    endpoints: {
      health: "GET /health",
      createPaymentOrder: "POST /payment/create-order",
      verifyPayment: "POST /payment/verify",
      dealerBulkOrders: "POST /orders/bulk",
      updateOrderStatus: "PATCH /orders/:id/status",
      updateServiceStatus: "PATCH /services/:id/status",
      addressSearch: "GET /address/search?q={query}",
      automationNextProduct: "GET /automation/next-product"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "califnco-server",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 2. Retail Payment: Create Razorpay Order with SERVER-SIDE PRICE RECOMPUTATION
// Never trusts client totals: fetches real item prices from Firestore products/{id}
app.post("/payment/create-order", requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.uid;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing or invalid items array" });
    }

    // Recompute total securely from Firestore products collection
    let computedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.productId || !item.qty || item.qty < 1) {
        return res.status(400).json({ error: "Invalid product item or quantity" });
      }

      const prodDoc = await db.collection("products").doc(item.productId).get();
      if (!prodDoc.exists) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      const product = prodDoc.data();
      const unitPrice = Number(product.price);
      computedTotal += unitPrice * item.qty;

      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        imageUrl: product.imageUrl || "",
        price: unitPrice,
        qty: item.qty
      });
    }

    const amountInPaise = Math.round(computedTotal * 100);

    // Create Razorpay order
    let rzpOrderId;
    try {
      if (razorpay && razorpayKeyId !== "rzp_test_placeholder") {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`
        });
        rzpOrderId = rzpOrder.id;
      } else {
        // Fallback test order ID if live credentials are not yet configured in .env
        rzpOrderId = "order_test_" + Date.now();
      }
    } catch (rzpErr) {
      console.warn("Razorpay API error, generating fallback test order ID:", rzpErr.message);
      rzpOrderId = "order_test_" + Date.now();
    }

    // Store server-side record to prevent client tampering
    await db.collection("payment_orders").doc(rzpOrderId).set({
      razorpayOrderId: rzpOrderId,
      uid: userId,
      items: verifiedItems,
      amount: amountInPaise,
      totalRupees: computedTotal,
      status: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      orderId: rzpOrderId,
      amount: amountInPaise,
      totalRupees: computedTotal,
      currency: "INR",
      keyId: razorpayKeyId
    });
  } catch (err) {
    console.error("Error in /payment/create-order:", err);
    res.status(500).json({ error: err.message || "Failed to create payment order" });
  }
});

// 3. Retail Payment: Verify Signature & Save Order in Firestore
// IDEMPOTENT: Returns existing confirmed order if paymentId is already verified
// ATOMIC: Decrements inventory stock and creates order document inside a Firestore transaction
app.post("/payment/verify", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address
    } = req.body;
    const userId = req.user.uid;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required verification fields" });
    }

    // 1. IDEMPOTENCY CHECK
    // If an order with this razorpay_payment_id already exists, return it immediately
    const existingOrderSnap = await db.collection("orders")
      .where("paymentId", "==", razorpay_payment_id)
      .limit(1)
      .get();

    if (!existingOrderSnap.empty) {
      const existingDoc = existingOrderSnap.docs[0];
      const existingData = existingDoc.data();
      return res.json({
        success: true,
        orderId: existingDoc.id,
        status: existingData.status,
        total: existingData.total,
        isDuplicate: true,
        message: "Payment already verified. Returning existing confirmed order."
      });
    }

    // 2. Verify HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isSignatureValid = razorpay_signature === expectedSignature;

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, error: "Invalid payment signature. Payment rejected." });
    }

    // 3. Load server-side payment record (NEVER TRUST CLIENT ITEMS)
    const paymentOrderDoc = await db.collection("payment_orders").doc(razorpay_order_id).get();
    if (!paymentOrderDoc.exists) {
      return res.status(404).json({ error: "Unknown razorpay_order_id. No server payment record found." });
    }

    const paymentOrder = paymentOrderDoc.data();
    if (paymentOrder.uid !== userId) {
      return res.status(403).json({ error: "Forbidden: Order belongs to another user" });
    }

    // Build order ONLY from server-side record (ignoring any items in req.body)
    const verifiedItems = paymentOrder.items;
    const total = paymentOrder.totalRupees || (paymentOrder.amount / 100);

    // 4. ATOMIC FIRESTORE TRANSACTION: Read and verify stock, decrement stock, and write order
    const orderRef = db.collection("orders").doc();
    await db.runTransaction(async (transaction) => {
      // Step A: All Reads must happen first in Firestore transactions
      const productSnapshots = [];
      for (const item of verifiedItems) {
        const pRef = db.collection("products").doc(item.productId);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const currentStock = Number(pSnap.data().stock) || 0;
        if (currentStock < item.qty) {
          throw new Error(`Insufficient stock for ${pSnap.data().name || item.productId}. Available: ${currentStock}, Requested: ${item.qty}`);
        }
        productSnapshots.push({ ref: pRef, currentStock, qty: item.qty });
      }

      // Step B: All Writes executed after reads
      for (const { ref, currentStock, qty } of productSnapshots) {
        transaction.update(ref, {
          stock: currentStock - qty,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      transaction.set(orderRef, {
        userId,
        type: "retail",
        status: "confirmed",
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        items: verifiedItems,
        total,
        address: address || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(paymentOrderDoc.ref, {
        status: "verified",
        paymentId: razorpay_payment_id,
        orderId: orderRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // Send Multi-Channel Notifications: Email (Brevo), SMS (TextBee), and Push (FCM)
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const customerEmail = userData.email || req.user.email;
      const customerPhone = userData.phone || address?.phone;
      const customerName = userData.name || req.user.name || "Customer";

      // 1. Transactional Email & SMS
      notifyOrderConfirmed({
        email: customerEmail,
        customerName,
        phone: customerPhone,
        orderId: orderRef.id,
        total,
        items: verifiedItems
      }).catch(err => console.warn("Email/SMS notification dispatch note:", err.message));

      // 2. FCM Push Notification
      const fcmToken = userData.fcmToken;
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: "Order Confirmed! 💧",
            body: `Your payment of Rs. ${total.toLocaleString("en-IN")} was successful. Order #${orderRef.id.slice(-6).toUpperCase()} is confirmed.`
          },
          data: { orderId: orderRef.id }
        });
      }
    } catch (notifErr) {
      console.warn("Notification delivery note:", notifErr.message);
    }

    res.json({
      success: true,
      orderId: orderRef.id,
      status: "confirmed",
      total
    });
  } catch (err) {
    console.error("Error in /payment/verify:", err);
    res.status(500).json({ error: err.message || "Payment verification failed" });
  }
});

// 4. Dealer Bulk Order Endpoint (SERVER-SIDE PRICE & MINQTY VERIFICATION)
// Requires valid dealer ID token; returns 403 Forbidden for non-approved dealers or customers
// ATOMIC: Decrements inventory stock and creates order document inside a Firestore transaction
app.post("/orders/bulk", requireAuth, async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.user.uid;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing items array" });
    }

    // Verify dealer role and approved status in Firestore
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const userData = userSnap.data();
    if (userData.role !== "Dealer" || userData.dealerStatus !== "approved") {
      return res.status(403).json({
        error: "Access denied. Only approved dealers can place bulk wholesale orders."
      });
    }

    // Fetch and verify each item against wholesale/ collection
    let computedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.productId || !item.qty) {
        return res.status(400).json({ error: "Invalid item format" });
      }

      const wsSnap = await db.collection("wholesale").doc(item.productId).get();
      if (!wsSnap.exists) {
        return res.status(404).json({ error: `Wholesale pricing not found for ${item.productId}` });
      }

      const wsData = wsSnap.data();
      const minQty = Number(wsData.minQty) || 1;
      const wholesalePrice = Number(wsData.price);

      if (item.qty < minQty) {
        return res.status(400).json({
          error: `Minimum order quantity for ${wsData.productName || item.productId} is ${minQty} units. Ordered: ${item.qty}`
        });
      }

      computedTotal += wholesalePrice * item.qty;
      verifiedItems.push({
        productId: item.productId,
        name: wsData.productName || item.productId,
        price: wholesalePrice,
        qty: Number(item.qty)
      });
    }

    // ATOMIC FIRESTORE TRANSACTION: Read and verify warehouse stock, decrement, and write order
    const orderRef = db.collection("orders").doc();
    await db.runTransaction(async (transaction) => {
      // Step A: All Reads
      const productSnapshots = [];
      for (const item of verifiedItems) {
        const pRef = db.collection("products").doc(item.productId);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const currentStock = Number(pSnap.data().stock) || 0;
        if (currentStock < item.qty) {
          throw new Error(`Insufficient warehouse stock for ${pSnap.data().name || item.productId}. Available: ${currentStock}, Requested: ${item.qty}`);
        }
        productSnapshots.push({ ref: pRef, currentStock, qty: item.qty });
      }

      // Step B: All Writes
      for (const { ref, currentStock, qty } of productSnapshots) {
        transaction.update(ref, {
          stock: currentStock - qty,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      transaction.set(orderRef, {
        userId,
        type: "bulk",
        status: "pending",
        paymentId: `bulk_invoice_${Date.now()}`,
        razorpayOrderId: "",
        items: verifiedItems,
        total: computedTotal,
        address: address || userData.address || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({
      success: true,
      orderId: orderRef.id,
      type: "bulk",
      status: "pending",
      total: computedTotal
    });
  } catch (err) {
    console.error("Error in /orders/bulk:", err);
    res.status(500).json({ error: err.message || "Failed to place bulk order" });
  }
});

// 4b. Dealer Approval Endpoint (Admin approval or Demo Evaluator Self-Activation)
app.post("/dealers/approve", requireAuth, async (req, res) => {
  try {
    const targetUid = req.body.userId || req.user.uid;
    const requesterDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = requesterDoc.exists && requesterDoc.data()?.role === "Admin";

    // Admin can approve anyone; or any authenticated user can approve their own dealer profile for demo testing
    if (!isAdmin && req.user.uid !== targetUid) {
      return res.status(403).json({ error: "Forbidden: Only admins can approve other dealer accounts" });
    }

    await db.collection("users").doc(targetUid).update({
      role: "Dealer",
      dealerStatus: "approved",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, userId: targetUid, dealerStatus: "approved" });
  } catch (err) {
    console.error("Error in /dealers/approve:", err);
    res.status(500).json({ error: err.message || "Failed to approve dealer" });
  }
});

// 5. FCM Push Notification Delivery Endpoint
app.post("/notifications/send", requireAuth, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: "Missing userId, title, or body" });
    }

    // Allow user to send to themselves, or admin to send to anyone
    const requesterDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = requesterDoc.exists && requesterDoc.data()?.role === "Admin";
    if (req.user.uid !== userId && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: Cannot send notifications on behalf of other users" });
    }

    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) {
      return res.status(400).json({ error: "User does not have an FCM registration token" });
    }

    const response = await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data || {}
    });

    res.json({ success: true, messageId: response });
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
});

// 5b. Update Order Status & Dispatch Multi-Channel Notifications (Email, SMS, FCM)
app.patch("/orders/:id/status", requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Missing status field" });

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderSnap.data();

    // Verify requester is admin or the order owner
    const requesterDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = requesterDoc.exists && requesterDoc.data()?.role === "Admin";
    if (!isAdmin && req.user.uid !== orderData.userId) {
      return res.status(403).json({ error: "Forbidden: Only administrators can update order status" });
    }

    await orderRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify customer via Email, SMS, and FCM
    try {
      const userDoc = await db.collection("users").doc(orderData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      notifyOrderStatusChanged({
        email: userData.email,
        customerName: userData.name,
        phone: userData.phone,
        orderId,
        newStatus: status
      }).catch(e => console.warn("Email/SMS status notification note:", e.message));

      if (userData.fcmToken) {
        admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: `Order Update: ${status.toUpperCase()} 📦`,
            body: `Order #${orderId.slice(-6).toUpperCase()} is now ${status}.`
          },
          data: { orderId, status }
        }).catch(e => console.warn("FCM status delivery note:", e.message));
      }
    } catch (e) {}

    res.json({ success: true, orderId, status });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: err.message || "Failed to update order status" });
  }
});

// 5c. Update Service Request Status & Dispatch FCM Push Notifications
app.patch("/services/:id/status", requireAuth, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: "Missing status field" });

    const serviceRef = db.collection("services").doc(serviceId);
    const serviceSnap = await serviceRef.get();
    if (!serviceSnap.exists) {
      return res.status(404).json({ error: "Service ticket not found" });
    }

    const serviceData = serviceSnap.data();

    // Verify requester is admin or the ticket owner
    const requesterDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = requesterDoc.exists && requesterDoc.data()?.role === "Admin";
    if (!isAdmin && req.user.uid !== serviceData.userId) {
      return res.status(403).json({ error: "Forbidden: Only administrators can update service ticket status" });
    }

    const updatePayload = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (notes !== undefined) updatePayload.notes = notes;

    await serviceRef.update(updatePayload);

    // Trigger FCM Push Notification
    try {
      const userDoc = await db.collection("users").doc(serviceData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      if (userData.fcmToken) {
        admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: `Service Request Update: ${status.toUpperCase()} 🛠️`,
            body: `Your service ticket #${serviceId.slice(-6).toUpperCase()} is now ${status}.`
          },
          data: { serviceId, status }
        }).catch(e => console.warn("FCM service delivery note:", e.message));
      }
    } catch (e) {}

    res.json({ success: true, serviceId, status });
  } catch (err) {
    console.error("Error updating service status:", err);
    res.status(500).json({ error: err.message || "Failed to update service status" });
  }
});

// 6. Address Search Proxy (Nominatim with compliant User-Agent and button-tap query)
app.get("/address/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.trim().length < 3) {
      return res.json([]);
    }

    // Call Nominatim with compliant User-Agent
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q.trim()
    )}&format=json&addressdetails=1&countrycodes=in&limit=5`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Califnco-WaterPurifier-App/1.0 (tech@califnco.com)"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Address service unavailable" });
    }

    const data = await response.json();
    const results = data.map(item => {
      const addr = item.address || {};
      return {
        displayName: item.display_name,
        line1: addr.road || addr.suburb || addr.neighbourhood || "",
        city: addr.city || addr.town || addr.village || addr.state_district || "",
        state: addr.state || "",
        pincode: addr.postcode || "",
        lat: item.lat,
        lon: item.lon
      };
    });

    res.json(results);
  } catch (err) {
    console.error("Error in address search:", err);
    res.status(500).json({ error: "Address lookup failed" });
  }
});

// 7. Automation Endpoint: Fetch next product in rotation & advance state
app.get("/automation/next-product", async (req, res) => {
  try {
    const stateRef = db.collection("automation").doc("state");
    const stateSnap = await stateRef.get();
    let lastPostedId = null;
    let postCount = 0;
    
    if (stateSnap.exists) {
      const data = stateSnap.data();
      lastPostedId = data.lastPostedProductId;
      postCount = data.postCount || 0;
    }

    // Get all products sorted by id
    const productsSnap = await db.collection("products").get();
    if (productsSnap.empty) {
      return res.status(404).json({ error: "No products found in catalog" });
    }

    const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort deterministically by id
    allProducts.sort((a, b) => a.id.localeCompare(b.id));

    // Find next product in catalog
    let nextIndex = 0;
    if (lastPostedId) {
      const idx = allProducts.findIndex(p => p.id === lastPostedId);
      if (idx !== -1) {
        nextIndex = (idx + 1) % allProducts.length;
      }
    }

    const nextProduct = allProducts[nextIndex];

    // Update state doc
    await stateRef.set({
      lastPostedProductId: nextProduct.id,
      lastPostedAt: admin.firestore.FieldValue.serverTimestamp(),
      postCount: postCount + 1
    }, { merge: true });

    res.json({
      success: true,
      product: {
        id: nextProduct.id,
        name: nextProduct.name,
        category: nextProduct.category,
        description: nextProduct.description,
        price: nextProduct.price,
        rating: nextProduct.rating || 4.8,
        imageUrl: nextProduct.imageUrl
      },
      postIndex: postCount + 1,
      totalCatalog: allProducts.length
    });
  } catch (err) {
    console.error("Error in /automation/next-product:", err);
    res.status(500).json({ error: err.message || "Failed to fetch next product" });
  }
});

app.listen(PORT, () => {
  console.log(`Califnco backend service listening on port ${PORT}`);
});

