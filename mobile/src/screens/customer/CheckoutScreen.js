import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { createOrder } from "../../services/orderService";
import { formatPrice } from "../../utils/formatPrice";
import colors from "../../constants/colors";

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

  function setAddr(field, value) {
    setAddress(prev => ({ ...prev, [field]: value }));
  }

  function validateAddress() {
    if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.pincode.trim()) {
      Alert.alert("Error", "Please fill in the complete delivery address.");
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      Alert.alert("Error", "Please enter a valid 6-digit pincode.");
      return false;
    }
    return true;
  }

  async function handleRazorpayCheckout() {
    if (!validateAddress()) return;
    setLoading(true);

    try {
      // 1. Create Razorpay order via server
      const response = await fetch(`${SERVER_URL}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR" })
      });
      const data = await response.json();

      if (!data.orderId) throw new Error("Could not create payment order. Please try again.");

      // 2. In real app we open Razorpay RN SDK here.
      // For the demo we simulate a successful payment response.
      Alert.alert(
        "Razorpay Checkout (Test Mode)",
        `Order ID: ${data.orderId}\nAmount: ${formatPrice(total)}\n\nIn the APK this opens the Razorpay payment sheet. Simulating success now.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Simulate Payment",
            onPress: () => completePurchase(data.orderId, "pay_test_simulated_" + Date.now())
          }
        ]
      );
    } catch (err) {
      Alert.alert("Payment Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function completePurchase(razorpayOrderId, paymentId) {
    setLoading(true);
    try {
      await createOrder({
        userId: profile.uid,
        type: "retail",
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          imageUrl: i.imageUrl,
          price: i.price,
          qty: i.qty
        })),
        total,
        address,
        razorpayOrderId,
        paymentId
      });

      clearCart();
      Alert.alert(
        "Order Placed!",
        "Your order has been placed successfully. You will receive a confirmation shortly.",
        [{ text: "View Orders", onPress: () => navigation.navigate("Orders") }]
      );
    } catch (err) {
      Alert.alert("Error", "Order could not be saved: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.section}>
        <Text style={s.sectionTitle}>Delivery Address</Text>
        <TextInput style={s.input} value={address.line1} onChangeText={v => setAddr("line1", v)} placeholder="Street address, flat/house no." placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={address.city} onChangeText={v => setAddr("city", v)} placeholder="City" placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={address.state} onChangeText={v => setAddr("state", v)} placeholder="State" placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={address.pincode} onChangeText={v => setAddr("pincode", v)} placeholder="6-digit pincode" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={6} />
      </View>

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

      <View style={s.section}>
        <Text style={s.sectionTitle}>Payment</Text>
        <View style={s.payBadge}>
          <Text style={s.payBadgeText}>🔒 Razorpay — Test Mode</Text>
        </View>
        <Text style={s.payNote}>
          Use test card 4111 1111 1111 1111 with any future expiry and any CVV.
        </Text>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.placeBtn} onPress={handleRazorpayCheckout} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.placeBtnText}>Pay {formatPrice(total)}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { backgroundColor: colors.card, margin: 16, borderRadius: 14, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },
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
  footer: { padding: 16, paddingBottom: 32 },
  placeBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 18, alignItems: "center" },
  placeBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" }
});
