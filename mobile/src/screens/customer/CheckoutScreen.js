import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Modal
} from "react-native";
import { WebView } from "react-native-webview";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { formatPrice } from "../../utils/formatPrice";
import { auth } from "../../config/firebase";
import colors from "../../constants/colors";
import SuccessModal from "../../components/SuccessModal";
import InvoicePreviewModal from "../../components/InvoicePreviewModal";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";

export default function CheckoutScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const { profile } = useAuth();

  const [address, setAddress] = useState({
    line1: profile?.address?.line1 || "",
    city: profile?.address?.city || "",
    state: profile?.address?.state || "",
    pincode: profile?.address?.pincode || ""
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [searchingAddr, setSearchingAddr] = useState(false);

  // Modals & Order Receipt
  const [checkoutData, setCheckoutData] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  function setAddr(field, value) {
    setAddress(prev => ({ ...prev, [field]: value }));
  }

  function validateAddress() {
    if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.pincode.trim()) {
      Alert.alert("Error", "Please fill in the complete delivery address.");
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      Alert.alert("Error", "Please enter a valid 6-digit Indian PIN code.");
      return false;
    }
    return true;
  }

  // Address lookup triggered strictly on user button tap (Nominatim usage compliant)
  async function handleSearchAddress() {
    if (!addressQuery.trim() || addressQuery.trim().length < 3) {
      Alert.alert("Address Search", "Enter at least 3 characters (e.g., 'Indiranagar Bangalore')");
      return;
    }

    setSearchingAddr(true);
    try {
      const res = await fetch(`${SERVER_URL}/address/search?q=${encodeURIComponent(addressQuery.trim())}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert("No Results", "No matching addresses found. Please enter manually.");
        return;
      }

      const match = data[0];
      setAddress({
        line1: match.line1 || match.displayName.split(",")[0] || "",
        city: match.city || "Bengaluru",
        state: match.state || "Karnataka",
        pincode: match.pincode || address.pincode
      });
      Alert.alert("Address Populated", `Selected: ${match.displayName.slice(0, 70)}...`);
    } catch (err) {
      Alert.alert("Lookup Notice", "Could not reach address lookup. You can enter your address manually.");
    } finally {
      setSearchingAddr(false);
    }
  }

  // Step 1: Request order creation from server (server recomputes total from products/)
  async function startRazorpayPayment() {
    if (items.length === 0) {
      Alert.alert("Your Cart is Empty", "Please browse our catalog and add purifiers or cartridges to checkout.");
      return;
    }
    if (!validateAddress()) return;
    setLoading(true);
    setStatusMsg("Connecting to server (waking up cloud instance if idle)...");

    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 45000); // 45s timeout for Render free tier wake-up

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${SERVER_URL}/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          userId: profile.uid,
          items: items.map(i => ({ productId: i.productId, qty: i.qty }))
        })
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.orderId) {
        throw new Error(data.error || "Could not initialize payment order.");
      }

      setCheckoutData(data);
      setShowWebView(true);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        Alert.alert("Server Notice", "Server is taking longer to respond. You can use 'Fast Test Checkout' below to complete your order immediately.");
      } else {
        Alert.alert("Payment Initialization Failed", `${err.message}\n\nYou can use 'Fast Test Checkout' to place this order directly.`);
      }
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  }

  // Step 2: Handle message posted back from Razorpay Checkout WebView
  async function handleWebViewMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === "DISMISSED") {
        setShowWebView(false);
        setCheckoutData(null);
        Alert.alert("Payment Cancelled", "Transaction was cancelled by user.");
        return;
      }

      if (msg.type === "FAILED") {
        setShowWebView(false);
        setCheckoutData(null);
        Alert.alert("Payment Failed", msg.error || "Payment failed or cancelled.");
        return;
      }

      if (msg.type === "SUCCESS") {
        setShowWebView(false);
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = msg.payload || {};
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          Alert.alert("Payment Verification Error", "Payment was not signed by Razorpay. Order was not created.");
          return;
        }
        await verifyAndSaveOrder(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      }
    } catch (err) {
      console.warn("WebView message parse error:", err);
    }
  }

  // Step 3: Server verifies signature and creates order in Firestore
  async function verifyAndSaveOrder(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    setLoading(true);
    setStatusMsg("Verifying signature with server & generating order...");

    try {
      const token = await auth.currentUser?.getIdToken();
      const currentItems = [...items];
      const currentTotal = total;
      const response = await fetch(`${SERVER_URL}/payment/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          userId: profile.uid,
          items: currentItems.map(i => ({ productId: i.productId, qty: i.qty })),
          address
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Payment signature verification failed.");
      }

      const createdOrder = {
        id: data.orderId,
        total: data.total || currentTotal,
        items: currentItems,
        address,
        status: "confirmed",
        createdAt: new Date(),
        paymentId: razorpay_payment_id
      };

      clearCart();
      setCheckoutData(null);
      setConfirmedOrder(createdOrder);
      setSuccessModalVisible(true);
    } catch (err) {
      Alert.alert("Verification Error", err.message);
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  }

  // HTML to inject inside the Razorpay Checkout WebView
  function renderCheckoutHtml() {
    if (!checkoutData) return "";
    const cleanPhone = (profile?.phone || "9876543210").replace(/[^0-9]/g, "").slice(-10) || "9876543210";
    const rzpKey = (checkoutData.keyId && checkoutData.keyId !== "rzp_test_placeholder") ? checkoutData.keyId : "rzp_test_TrHrkbqyzMD5i0";
    const isLiveOrderId = checkoutData.orderId && !checkoutData.orderId.startsWith("order_test_") && !checkoutData.orderId.startsWith("order_demo_");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #0a2540; color: #ffffff; display: flex; flex-direction: column;
              align-items: center; justify-content: center; min-height: 95vh; text-align: center;
            }
            .card {
              background: #ffffff; color: #0a2540; border-radius: 20px; padding: 24px;
              width: 100%; max-width: 400px; box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            }
            .badge {
              display: inline-block; background: #e0f2fe; color: #0284c7; font-size: 12px;
              font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;
            }
            h2 { margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #0a2540; }
            .order-id { font-size: 13px; color: #64748b; margin-bottom: 14px; word-break: break-all; }
            .amount-box {
              background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
              padding: 16px; margin-bottom: 20px;
            }
            .amount-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .amount-val { font-size: 26px; font-weight: 900; color: #00b4d8; margin-top: 4px; }
            .btn {
              background: #00b4d8; color: #ffffff; border: none; padding: 15px 20px;
              border-radius: 12px; font-size: 15px; font-weight: 700; width: 100%; cursor: pointer;
              margin-bottom: 10px; transition: transform 0.1s;
            }
            .btn:active { transform: scale(0.98); }
            .btn-sim { background: #0a2540; color: #ffffff; }
            .btn-cancel { background: transparent; color: #94a3b8; margin-bottom: 0; }
            .hint { font-size: 12px; color: #94a3b8; margin-top: 10px; line-height: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">🔒 Razorpay Gateway</span>
            <h2>Complete Payment</h2>
            <div class="order-id">Ref: ${checkoutData.orderId}</div>

            <div class="amount-box">
              <div class="amount-label">Total Payable</div>
              <div class="amount-val">Rs. ${(checkoutData.amount / 100).toLocaleString('en-IN')}</div>
            </div>

            <button class="btn" onclick="openRazorpay()">💳 Pay with Razorpay Gateway</button>
            <button class="btn btn-cancel" onclick="cancelCheckout()">Cancel and Return</button>
            <div class="hint">Razorpay Sandbox: Enter test card or UPI details to complete payment.</div>
          </div>

          <script>
            function openRazorpay() {
              var options = {
                key: "${rzpKey}",
                amount: "${checkoutData.amount}",
                currency: "INR",
                name: "Califnco Water Purifiers",
                description: "Order #${(checkoutData.orderId || '').slice(-6).toUpperCase()}",
                prefill: {
                  name: "${profile?.name || 'Customer'}",
                  email: "${profile?.email || 'customer@test.com'}",
                  contact: "${cleanPhone}"
                },
                theme: { color: "#0a2540" },
                handler: function(response) {
                  if (!response || !response.razorpay_signature) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: "FAILED",
                      error: "Payment was not signed by Razorpay."
                    }));
                    return;
                  }
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "SUCCESS",
                    payload: {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    }
                  }));
                },
                modal: {
                  ondismiss: function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DISMISSED" }));
                  }
                }
              };

              ${isLiveOrderId ? `options.order_id = "${checkoutData.orderId}";` : ''}

              try {
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function(resp) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "FAILED",
                    error: resp.error.description || "Payment failed or cancelled."
                  }));
                });
                rzp.open();
              } catch(e) {
                alert("Notice: " + e.message);
              }
            }

            function cancelCheckout() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DISMISSED" }));
            }
          </script>
        </body>
      </html>
    `;
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      {/* Address search box */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Delivery Address</Text>
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            value={addressQuery}
            onChangeText={setAddressQuery}
            placeholder="Search locality / landmark..."
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={s.searchBtn} onPress={handleSearchAddress} disabled={searchingAddr}>
            {searchingAddr ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.searchBtnText}>Lookup</Text>}
          </TouchableOpacity>
        </View>

        <TextInput style={s.input} value={address.line1} onChangeText={v => setAddr("line1", v)} placeholder="Street address, flat/house no." placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={address.city} onChangeText={v => setAddr("city", v)} placeholder="City" placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={address.state} onChangeText={v => setAddr("state", v)} placeholder="State" placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={address.pincode} onChangeText={v => setAddr("pincode", v)} placeholder="6-digit PIN code" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={6} />
      </View>

      {/* Order Summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Order Summary</Text>
        {items.map(i => (
          <View key={i.productId} style={s.orderRow}>
            <Text style={s.orderItem} numberOfLines={1}>{i.name} x{i.qty}</Text>
            <Text style={s.orderItemPrice}>{formatPrice(i.price * i.qty)}</Text>
          </View>
        ))}
        <View style={s.divider} />
        <View style={s.orderRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      {/* Payment Security Notice */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Payment Options</Text>
        <View style={s.payBadge}>
          <Text style={s.payBadgeText}>🔒 Razorpay Gateway (Test & Live Mode)</Text>
        </View>
        <Text style={s.payNote}>
          Order totals are verified server-side against the product catalog. Signatures are verified via HMAC SHA256 before order confirmation.
        </Text>
      </View>

      {statusMsg ? (
        <View style={s.statusBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.statusBannerText}>{statusMsg}</Text>
        </View>
      ) : null}

      <View style={s.footer}>
        <TouchableOpacity style={s.placeBtn} onPress={startRazorpayPayment} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.placeBtnText}>Proceed to Pay {formatPrice(total)}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Razorpay WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <View style={{ flex: 1, backgroundColor: "#0a2540" }}>
          <View style={s.modalHeader}>
            <Text style={s.modalHeaderTitle}>Razorpay Secure Payment</Text>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            originWhitelist={["*"]}
            source={{
              html: renderCheckoutHtml(),
              baseUrl: "https://califnco-app.onrender.com"
            }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            style={{ flex: 1 }}
          />
        </View>
      </Modal>

      {/* Animated Order Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="Order Placed Successfully! 💧"
        subtitle="Your payment has been verified. A receipt has been issued and technician assigned."
        referenceNumber={confirmedOrder?.id}
        referenceLabel="Order Reference"
        primaryBtnText="View Printed Receipt 🧾"
        onPrimaryPress={() => {
          setSuccessModalVisible(false);
          setInvoiceModalVisible(true);
        }}
        secondaryBtnText="View All Orders"
        onSecondaryPress={() => {
          setSuccessModalVisible(false);
          navigation.navigate("Orders");
        }}
        iconName="check-circle"
        iconColor="#10b981"
      />

      {/* Animated Printed Receipt Component Modal */}
      <InvoicePreviewModal
        visible={invoiceModalVisible}
        onClose={() => {
          setInvoiceModalVisible(false);
          navigation.navigate("Orders");
        }}
        order={confirmedOrder}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { backgroundColor: colors.card, margin: 16, borderRadius: 14, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, fontSize: 14, color: colors.text, backgroundColor: colors.background },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, marginBottom: 12, backgroundColor: colors.background },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  orderItem: { flex: 1, fontSize: 14, color: colors.textSecondary, marginRight: 8 },
  orderItemPrice: { fontSize: 14, fontWeight: "600", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 20, fontWeight: "900", color: colors.primary },
  payBadge: { backgroundColor: "#f0fdf4", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#bbf7d0", marginBottom: 10 },
  payBadgeText: { fontSize: 14, fontWeight: "700", color: colors.success },
  payNote: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  statusBanner: { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: "#eff6ff", borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  statusBannerText: { fontSize: 13, color: colors.primary, flex: 1 },
  footer: { padding: 16, paddingBottom: 32 },
  placeBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 18, alignItems: "center" },
  placeBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  testPlaceBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12, padding: 15, alignItems: "center", marginTop: 12 },
  testPlaceBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  modalHeader: { height: 56, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  modalHeaderTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalClose: { color: "#fff", fontSize: 22, fontWeight: "700", padding: 6 }
});
