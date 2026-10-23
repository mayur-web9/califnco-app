import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal
} from "react-native";
import { getProducts, getWholesalePrices } from "../../services/productService";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { createOrder } from "../../services/orderService";
import ProductCard from "../../components/ProductCard";
import { formatPrice } from "../../utils/formatPrice";
import colors from "../../constants/colors";

export default function DealerCatalogScreen({ navigation }) {
  const { profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [wholesaleMap, setWholesaleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Quick Order Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    Promise.all([getProducts(), getWholesalePrices()])
      .then(([prods, wholesale]) => {
        setProducts(prods);
        setWholesaleMap(wholesale);
      })
      .catch(err => {
        Alert.alert("Error loading wholesale catalog", err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "All") {
      list = list.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, activeCategory]);

  function openOrderModal(product) {
    const wholesaleInfo = wholesaleMap[product.id];
    const minQty = wholesaleInfo?.minQty || 1;
    setSelectedProduct(product);
    setOrderQty(minQty);
  }

  async function handlePlaceWholesaleOrder() {
    if (!selectedProduct) return;
    const wholesaleInfo = wholesaleMap[selectedProduct.id];
    const unitPrice = wholesaleInfo?.price || selectedProduct.price;
    const minQty = wholesaleInfo?.minQty || 1;

    if (orderQty < minQty) {
      Alert.alert("Minimum Order Quantity", `The minimum quantity for wholesale pricing on this item is ${minQty} units.`);
      return;
    }

    setPlacingOrder(true);
    try {
      const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";
      const response = await fetch(`${SERVER_URL}/orders/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.uid,
          items: [{
            productId: selectedProduct.id,
            qty: orderQty
          }],
          address: profile.address || { line1: "Dealer Store", city: "Bengaluru", state: "KA", pincode: "560001" }
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to place bulk order");
      }

      setSelectedProduct(null);
      Alert.alert(
        "Bulk Order Placed! 📦",
        `Order confirmed for ${orderQty} units of ${selectedProduct.name} at ${formatPrice(resData.total)}. Invoice #${resData.orderId.slice(-6).toUpperCase()} generated. View under 'My Orders'.`
      );
    } catch (err) {
      Alert.alert("Order failed", err.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Banner */}
      <View style={s.banner}>
        <Text style={s.bannerTitle}>🏢 B2B Wholesale Portal</Text>
        <Text style={s.bannerSub}>Tier-1 Verified Dealer Pricing Enabled</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search wholesale products..."
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={s.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        contentContainerStyle={s.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.catChip, activeCategory === item.id && s.catChipActive]}
            onPress={() => setActiveCategory(item.id)}
          >
            <Text style={[s.catText, activeCategory === item.id && s.catTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product count */}
      <Text style={s.countText}>
        {filtered.length} wholesale item{filtered.length !== 1 ? "s" : ""} available
      </Text>

      {/* Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const wholesale = wholesaleMap[item.id];
          const wholesalePrice = wholesale?.price || item.price;
          const minQty = wholesale?.minQty || 1;

          return (
            <ProductCard
              product={item}
              price={wholesalePrice}
              badge={`Min ${minQty}`}
              onPress={() => openOrderModal(item)}
            />
          );
        }}
      />

      {/* Quick Wholesale Order Modal */}
      {selectedProduct && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Wholesale Bulk Order</Text>
              <Text style={s.modalProdName}>{selectedProduct.name}</Text>

              {(() => {
                const ws = wholesaleMap[selectedProduct.id];
                const unitPrice = ws?.price || selectedProduct.price;
                const minQty = ws?.minQty || 1;
                const total = unitPrice * orderQty;

                return (
                  <View style={{ marginVertical: 12 }}>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Retail Price:</Text>
                      <Text style={[s.infoVal, { textDecorationLine: "line-through", color: colors.textMuted }]}>
                        {formatPrice(selectedProduct.price)}
                      </Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Wholesale Price:</Text>
                      <Text style={[s.infoVal, { color: colors.primary, fontWeight: "800" }]}>
                        {formatPrice(unitPrice)} / unit
                      </Text>
                    </View>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Minimum Order:</Text>
                      <Text style={s.infoVal}>{minQty} units</Text>
                    </View>

                    <Text style={[s.infoLabel, { marginTop: 14, marginBottom: 6 }]}>Order Quantity</Text>
                    <View style={s.qtyRow}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => setOrderQty(q => Math.max(minQty, q - 1))}
                      >
                        <Text style={s.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qtyVal}>{orderQty}</Text>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => setOrderQty(q => q + 1)}
                      >
                        <Text style={s.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={s.totalBox}>
                      <Text style={s.totalLabel}>Total Wholesale Amount:</Text>
                      <Text style={s.totalVal}>{formatPrice(total)}</Text>
                    </View>
                  </View>
                );
              })()}

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => setSelectedProduct(null)}
                  disabled={placingOrder}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.confirmBtn}
                  onPress={handlePlaceWholesaleOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.confirmText}>Place Bulk Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  banner: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12 },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  bannerSub: { fontSize: 12, color: colors.accent, marginTop: 2 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
    margin: 14, borderRadius: 12, paddingHorizontal: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 16, color: colors.textMuted, paddingLeft: 8 },
  catList: { paddingHorizontal: 14, paddingBottom: 6, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  catTextActive: { color: colors.textOnPrimary },
  countText: { paddingHorizontal: 14, paddingBottom: 4, fontSize: 12, color: colors.textMuted },
  grid: { paddingHorizontal: 8, paddingBottom: 24 },
  row: { justifyContent: "space-between" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  modalProdName: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoVal: { fontSize: 14, fontWeight: "600", color: colors.text },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 },
  qtyBtn: { width: 38, height: 38, borderRadius: 8, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  qtyVal: { fontSize: 18, fontWeight: "700", color: colors.text, minWidth: 36, textAlign: "center" },
  totalBox: { backgroundColor: colors.background, padding: 12, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  totalVal: { fontSize: 18, fontWeight: "800", color: colors.primary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 18 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: "center" },
  cancelText: { color: colors.textSecondary, fontWeight: "700" },
  confirmBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "700" }
});
