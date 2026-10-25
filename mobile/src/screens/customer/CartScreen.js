import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { formatPrice } from "../../utils/formatPrice";
import { getProductImageSource } from "../../constants/productImages";
import ScreenHeader from "../../components/ScreenHeader";
import colors from "../../constants/colors";

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart();
  const { theme, isDark } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Shopping Cart"
        subtitle={items.length > 0 ? `${count} item${count > 1 ? "s" : ""} selected • Free express shipping` : "Your cart is currently empty"}
        badgeText="🛒 CHECKOUT READY"
        rightAction={
          items.length > 0 ? (
            <TouchableOpacity
              style={s.headerClearBtn}
              onPress={() => Alert.alert("Clear Cart", "Remove all items from your cart?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: clearCart }
              ])}
              activeOpacity={0.75}
            >
              <MaterialIcons name="delete-sweep" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : null
        }
      />

      {items.length === 0 ? (
        <View style={s.emptyContainer}>
          <View style={[s.emptyIllustrationWrap, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="shopping-cart" size={54} color="#00b4d8" />
            <View style={s.dropletBadge}>
              <MaterialIcons name="water-drop" size={18} color="#ffffff" />
            </View>
          </View>

          <Text style={[s.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
          <Text style={[s.emptyBody, { color: theme.textMuted }]}>
            Explore our advanced RO purifiers, UV systems & replacement filter cartridges.
          </Text>

          <TouchableOpacity
            style={s.browseBtn}
            onPress={() => navigation.navigate("Catalog")}
            activeOpacity={0.85}
          >
            <MaterialIcons name="shopping-bag" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={s.browseBtnText}>Explore Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
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

                  {/* Quantity Stepper */}
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

          {/* Order Summary Bottom Sheet */}
          <View style={[s.summarySheet, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: theme.textMuted }]}>Subtotal</Text>
              <Text style={[s.summaryVal, { color: theme.text }]}>{formatPrice(total)}</Text>
            </View>

            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: theme.textMuted }]}>Doorstep Delivery</Text>
              <Text style={s.freeDeliveryBadge}>FREE</Text>
            </View>

            <View style={[s.divider, { backgroundColor: theme.border }]} />

            <View style={[s.summaryRow, { marginBottom: 14 }]}>
              <Text style={[s.totalLabel, { color: theme.text }]}>Total Amount</Text>
              <Text style={s.totalVal}>{formatPrice(total)}</Text>
            </View>

            <TouchableOpacity
              style={s.checkoutBtn}
              onPress={() => navigation.navigate("Checkout")}
              activeOpacity={0.85}
            >
              <MaterialIcons name="lock" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={s.checkoutBtnText}>Proceed to Secure Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerClearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
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
    width: 80,
    height: 80,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "900",
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },
  qtyStepperBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyStepperBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  clearAllBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "700",
  },
  summarySheet: {
    borderTopWidth: 1,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  summaryVal: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  freeDeliveryBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  totalVal: {
    fontSize: 22,
    fontWeight: "900",
    color: "#00b4d8",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00b4d8",
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIllustrationWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  dropletBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00b4d8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    paddingHorizontal: 26,
    paddingVertical: 13,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  browseBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
