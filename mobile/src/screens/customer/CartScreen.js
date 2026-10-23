import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/formatPrice";
import colors from "../../constants/colors";

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart();

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>🛒</Text>
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.emptyBody}>Browse the catalog and add some products.</Text>
        <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate("Catalog")}>
          <Text style={s.shopBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={i => i.productId}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.item}>
            <Image source={{ uri: item.imageUrl }} style={s.thumb} resizeMode="cover" />
            <View style={s.details}>
              <Text style={s.name} numberOfLines={2}>{item.name}</Text>
              <Text style={s.unitPrice}>{formatPrice(item.price)} each</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.productId, item.qty - 1)}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qty}>{item.qty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.productId, item.qty + 1)}>
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.right}>
              <Text style={s.lineTotal}>{formatPrice(item.price * item.qty)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.productId)}>
                <Text style={s.removeBtn}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity onPress={() => Alert.alert("Clear Cart", "Remove all items?", [
            { text: "Cancel" }, { text: "Clear", style: "destructive", onPress: clearCart }
          ])}>
            <Text style={s.clearAll}>Clear all items</Text>
          </TouchableOpacity>
        }
      />

      <View style={s.summary}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>{count} item{count !== 1 ? "s" : ""}</Text>
          <Text style={s.summaryTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity style={s.checkoutBtn} onPress={() => navigation.navigate("Checkout")}>
          <Text style={s.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24 },
  shopBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  shopBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  item: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 14, padding: 12, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  thumb: { width: 76, height: 76, borderRadius: 10, backgroundColor: colors.border },
  details: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text, lineHeight: 20, marginBottom: 4 },
  unitPrice: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  qty: { fontSize: 15, fontWeight: "700", color: colors.text, minWidth: 24, textAlign: "center" },
  right: { alignItems: "flex-end", justifyContent: "space-between" },
  lineTotal: { fontSize: 15, fontWeight: "800", color: colors.primary },
  removeBtn: { fontSize: 20 },
  clearAll: { textAlign: "center", color: colors.error, fontSize: 14, padding: 12, fontWeight: "600" },
  summary: { backgroundColor: colors.card, padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
  summaryTotal: { fontSize: 20, fontWeight: "900", color: colors.text },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
