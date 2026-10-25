import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getProducts, getWholesalePrices } from "../../services/productService";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";
import { placeBulkOrder } from "../../services/orderService";
import ProductCard from "../../components/ProductCard";
import ScreenHeader from "../../components/ScreenHeader";
import { SkeletonCatalogHeader, SkeletonProductGrid } from "../../components/Skeleton";
import { formatPrice } from "../../utils/formatPrice";
import colors from "../../constants/colors";

export default function DealerCatalogScreen({ navigation }) {
  const { profile } = useAuth();
  const { theme, isDark } = useTheme();
  const { addItem, count } = useCart();
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

  function handleAddToCart() {
    if (!selectedProduct) return;
    const wholesaleInfo = wholesaleMap[selectedProduct.id];
    const unitPrice = wholesaleInfo?.price || selectedProduct.price;
    const minQty = wholesaleInfo?.minQty || 1;

    if (orderQty < minQty) {
      Alert.alert("Minimum Order Quantity", `Wholesale minimum is ${minQty} units.`);
      return;
    }

    addItem(selectedProduct, orderQty, unitPrice);
    setSelectedProduct(null);
    Alert.alert(
      "Added to Wholesale Cart! 🛒",
      `${orderQty}x ${selectedProduct.name} added at wholesale price ${formatPrice(unitPrice)}/unit.`,
      [
        { text: "Continue Shopping" },
        { text: "View Cart", onPress: () => navigation.navigate("DealerCart") }
      ]
    );
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
      const resData = await placeBulkOrder({
        userId: profile.uid,
        items: [{
          productId: selectedProduct.id,
          qty: orderQty
        }],
        address: profile.address || { line1: "Dealer Store", city: "Bengaluru", state: "KA", pincode: "560001" }
      });

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
      <View style={s.container}>
        <View style={s.banner}>
          <Text style={s.bannerTitle}>🏢 B2B Wholesale Portal</Text>
          <Text style={s.bannerSub}>Tier-1 Verified Dealer Pricing Enabled</Text>
        </View>
        <SkeletonCatalogHeader />
        <SkeletonProductGrid count={6} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      {/* Screen Header */}
      <ScreenHeader
        title="Wholesale Catalog"
        subtitle="Tier-1 wholesale pricing & factory direct supply"
        badgeText="🏷️ VERIFIED B2B DEALER"
        badgeIcon="verified"
        rightAction={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={s.headerCartBtn}
              onPress={() => navigation.navigate("DealerCart")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shopping-cart" size={18} color="#ffffff" />
              {count > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{count > 9 ? "9+" : count}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.headerLogoutBtn}
              onPress={() => {
                Alert.alert(
                  "Sign Out",
                  "Are you sure you want to sign out from your B2B account?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign Out", style: "destructive", onPress: () => logout() }
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={17} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

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
      <View style={s.catContainer}>
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
              activeOpacity={0.75}
            >
              <Text style={[s.catText, activeCategory === item.id && s.catTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

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
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
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
                  style={s.cartModalBtn}
                  onPress={handleAddToCart}
                  disabled={placingOrder}
                >
                  <MaterialIcons name="add-shopping-cart" size={17} color={colors.primary} />
                  <Text style={s.cartModalText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.confirmBtn}
                  onPress={handlePlaceWholesaleOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.confirmText}>Direct Order</Text>
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
  banner: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  bannerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dealerRoleBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4, marginBottom: 6 },
  dealerRoleText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  headerCartBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", position: "relative" },
  headerLogoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.75)", alignItems: "center", justifyContent: "center" },
  cartBadge: { position: "absolute", top: -2, right: -4, backgroundColor: colors.accent, borderRadius: 9, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 1.5, borderColor: "#0a2540" },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
    margin: 14, borderRadius: 12, paddingHorizontal: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 16, color: colors.textMuted, paddingLeft: 8 },
  catContainer: {
    height: 46,
    marginBottom: 6,
  },
  catList: {
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 2,
  },
  catText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  catTextActive: {
    color: colors.textOnPrimary,
  },
  countText: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted
  },
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
  modalActions: { flexDirection: "row", gap: 8, marginTop: 18 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.textSecondary, fontWeight: "700", fontSize: 13 },
  cartModalBtn: { flex: 1.4, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: "rgba(10,37,64,0.05)", borderRadius: 10, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  cartModalText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  confirmBtn: { flex: 1.4, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 13 }
});
