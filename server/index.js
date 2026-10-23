const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { admin, db } = require("./firebaseAdmin");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Razorpay client
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder";

let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} catch (err) {
  console.warn("Razorpay client initialization notice:", err.message);
}

// Middleware
app.use(cors());
app.use(express.json());

// 1. Health check endpoint (also used by clients to warm up sleeping Render instances)
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
app.post("/payment/create-order", async (req, res) => {
  try {
    const { items, userId } = req.body;

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
// Verifies HMAC SHA256 signature using RAZORPAY_KEY_SECRET, then creates order in Firestore
app.post("/payment/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      items,
      address
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !userId || !items) {
      return res.status(400).json({ error: "Missing required verification fields" });
    }

    // Verify HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // In production, signature MUST match. In simulated test mode with placeholder keys, allow matching test signature.
    const isSignatureValid =
      razorpay_signature === expectedSignature ||
      (razorpay_signature === "test_signature" && razorpayKeySecret === "rzp_test_secret_placeholder") ||
      (razorpayKeySecret === "rzp_test_secret_placeholder" && razorpay_signature.startsWith("pay_test_"));

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, error: "Invalid payment signature. Payment rejected." });
    }

    // Recompute total and line items from Firestore (tamper-proof)
    let total = 0;
    const verifiedItems = [];

    for (const item of items) {
      const prodDoc = await db.collection("products").doc(item.productId).get();
      if (prodDoc.exists) {
        const prod = prodDoc.data();
        const price = Number(prod.price);
        total += price * Number(item.qty);
        verifiedItems.push({
          productId: item.productId,
          name: prod.name,
          imageUrl: prod.imageUrl || "",
          price,
          qty: Number(item.qty)
        });
      }
    }

    // Server creates order using Admin SDK (bypasses allow create: if false)
    const orderDoc = {
      userId,
      type: "retail",
      status: "confirmed",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      items: verifiedItems,
      total,
      address: address || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const orderRef = await db.collection("orders").add(orderDoc);

    // Deduct stock for each purchased product
    for (const item of verifiedItems) {
      try {
        await db.collection("products").doc(item.productId).update({
          stock: admin.firestore.FieldValue.increment(-item.qty)
        });
      } catch (stockErr) {
        console.warn(`Failed to decrement stock for ${item.productId}:`, stockErr.message);
      }
    }

    // Send push notification if user has an FCM token registered
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      const fcmToken = userDoc.data()?.fcmToken;
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
    } catch (fcmErr) {
      // Non-critical: order is already saved
      console.warn("FCM delivery note:", fcmErr.message);
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
// Checks dealer approval status, enforces wholesale minQty, calculates from wholesale/ collection
app.post("/orders/bulk", async (req, res) => {
  try {
    const { userId, items, address } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing userId or items array" });
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

    // Server creates bulk order via Admin SDK
    const orderDoc = {
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
    };

    const orderRef = await db.collection("orders").add(orderDoc);

    // Deduct stock for each item
    for (const item of verifiedItems) {
      try {
        await db.collection("products").doc(item.productId).update({
          stock: admin.firestore.FieldValue.increment(-item.qty)
        });
      } catch (e) {}
    }

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

// 5. FCM Push Notification Delivery Endpoint
app.post("/notifications/send", async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: "Missing userId, title, or body" });
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
    res.status(500).json({ error: err.message || "Failed to send notification" });
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

