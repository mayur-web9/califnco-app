import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { formatPrice } from "../../utils/formatPrice";
import { getProductImageSource } from "../../constants/productImages";
import colors from "../../constants/colors";

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart();
  const { theme, isDark } = useTheme();

  // Screen 17: Empty Cart State
  if (items.length === 0) {
    return (
      <View style={[s.emptyContainer, { backgroundColor: theme.background }]}>
        <View style={[s.emptyIllustrationWrap, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
          <MaterialIcons name="shopping-cart" size={54} color="#00b4d8" />
          <View style={s.dropletBadge}>
            <MaterialIcons name="water-drop" size={18} color="#ffffff" />
          </View>
        </View>

        <Text style={[s.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
        <Text style={[s.emptyBody, { color: theme.textSecondary }]}>
          Browse our catalog and add some products.
        </Text>

        <TouchableOpacity
          style={s.browseBtn}
          onPress={() => navigation.navigate("Catalog")}
          activeOpacity={0.85}
        >
          <Text style={s.browseBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Screen 10: Cart Listing & Order Summary
  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={items}
        keyExtractor={i => i.productId}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[s.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[s.thumbWrap, { backgroundColor: isDark ? "#162a45" : "#f1f5f9" }]}>
              <Image source={getProductImageSource(item)} style={s.thumb} resizeMode="contain" />
            </View>

            <View style={s.itemDetails}>
              <Text style={[s.itemName, { color: theme.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[s.itemPrice, { color: "#00b4d8" }]}>
                {formatPrice(item.price)}
              </Text>

              {/* Quantity Pill Stepper (Screen 10) */}
              <View style={[s.qtyPill, { backgroundColor: isDark ? "#162a45" : "#f8fafc", borderColor: isDark ? theme.border : "#e2e8f0" }]}>
                <TouchableOpacity
                  style={s.qtyStepperBtn}
                  onPress={() => updateQty(item.productId, item.qty - 1)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.qtyStepperBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[s.qtyVal, { color: theme.text }]}>{item.qty}</Text>
                <TouchableOpacity
                  style={s.qtyStepperBtn}
                  onPress={() => updateQty(item.productId, item.qty + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.qtyStepperBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => removeItem(item.productId)}
              activeOpacity={0.7}
              accessibilityLabel="Remove item"
            >
              <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={s.clearAllBtn}
            onPress={() => Alert.alert("Clear Cart", "Remove all items from your cart?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart }
            ])}
          >
            <Text style={s.clearAllText}>Clear All Items</Text>
          </TouchableOpacity>
        }
      />

      {/* Screen 10: Order Summary Bottom Sheet */}
      <View style={[s.summarySheet, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={s.summaryRow}>
          <Text style={[s.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
          <Text style={[s.summaryVal, { color: theme.text }]}>{formatPrice(total)}</Text>
        </View>

        <View style={s.summaryRow}>
          <Text style={[s.summaryLabel, { color: theme.textSecondary }]}>Delivery Fee</Text>
          <Text style={[s.freeDeliveryBadge]}>₹ 0 (Free)</Text>
        </View>

        <View style={[s.divider, { backgroundColor: theme.border }]} />

        <View style={[s.summaryRow, { marginBottom: 16 }]}>
          <Text style={[s.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[s.totalVal, { color: "#00b4d8" }]}>{formatPrice(total)}</Text>
        </View>

        <TouchableOpacity
          style={s.checkoutBtn}
          onPress={() => navigation.navigate("Checkout")}
          activeOpacity={0.85}
        >
          <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: { width: "85%", height: "85%" },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "800", lineHeight: 18, marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: "900", marginBottom: 8 },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyStepperBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  qtyStepperBtnText: { fontSize: 16, fontWeight: "800" },
  qtyVal: { fontSize: 13, fontWeight: "800", minWidth: 26, textAlign: "center" },
  deleteBtn: { padding: 8 },
  clearAllBtn: { alignItems: "center", paddingVertical: 14 },
  clearAllText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
  summarySheet: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryVal: { fontSize: 14, fontWeight: "700" },
  freeDeliveryBadge: { fontSize: 13, fontWeight: "800", color: "#10b981" },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "900" },
  totalVal: { fontSize: 22, fontWeight: "900" },
  checkoutBtn: {
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00b4d8",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },

  // Screen 17: Empty State
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIllustrationWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 20,
  },
  dropletBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00b4d8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  emptyTitle: { fontSize: 20, fontWeight: "900", marginBottom: 8, letterSpacing: -0.2 },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  browseBtn: {
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  browseBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});
