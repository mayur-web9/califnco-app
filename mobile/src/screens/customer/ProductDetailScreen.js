import React, { useState } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal, Dimensions, StatusBar
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { formatPrice } from "../../utils/formatPrice";
import { getProductImageSource } from "../../constants/productImages";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem } = useCart();
  const { theme, isDark } = useTheme();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);

  function handleAddToCart() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    Alert.alert("Added to cart", `${product.name} x${qty} added to your cart.`);
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image with Tap-to-Zoom Indicator */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setZoomVisible(true)}
          style={[s.imageWrapper, { backgroundColor: theme.cardElevated }]}
        >
          <Image source={getProductImageSource(product)} style={s.image} resizeMode="contain" />
          <View style={s.zoomHintBadge}>
            <MaterialIcons name="zoom-in" size={16} color="#fff" />
            <Text style={s.zoomHintText}>Tap to Zoom</Text>
          </View>
        </TouchableOpacity>

        <View style={s.body}>
          <Text style={[s.category, { color: theme.accent }]}>{product.category}</Text>
          <Text style={[s.name, { color: theme.text }]}>{product.name}</Text>

          <View style={s.priceRow}>
            <Text style={[s.price, { color: theme.primary }]}>{formatPrice(product.price)}</Text>
            <View style={s.ratingRow}>
              <Text style={s.star}>★</Text>
              <Text style={[s.rating, { color: theme.textSecondary }]}>
                {product.rating?.toFixed(1) || "4.8"} ({product.reviewCount || 12} reviews)
              </Text>
            </View>
          </View>

          <View style={s.stockRow}>
            <View style={[s.stockDot, { backgroundColor: product.stock > 0 ? theme.success : theme.error }]} />
            <Text style={[s.stockText, { color: theme.textSecondary }]}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </Text>
          </View>

          <Text style={[s.sectionTitle, { color: theme.text }]}>Description</Text>
          <Text style={[s.description, { color: theme.textSecondary }]}>{product.description}</Text>

          <Text style={[s.sectionTitle, { color: theme.text }]}>Quantity</Text>
          <View style={s.qtyRow}>
            <TouchableOpacity
              style={[s.qtyBtn, { backgroundColor: theme.primary }]}
              onPress={() => setQty(q => Math.max(1, q - 1))}
            >
              <Text style={[s.qtyBtnText, { color: theme.textOnPrimary }]}>−</Text>
            </TouchableOpacity>
            <Text style={[s.qtyVal, { color: theme.text }]}>{qty}</Text>
            <TouchableOpacity
              style={[s.qtyBtn, { backgroundColor: theme.primary }]}
              onPress={() => setQty(q => q + 1)}
            >
              <Text style={[s.qtyBtnText, { color: theme.textOnPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.subtotal, { color: theme.text }]}>
            Subtotal: {formatPrice(product.price * qty)}
          </Text>
        </View>
      </ScrollView>

      {/* Pinch-to-Zoom Fullscreen Modal */}
      <Modal
        visible={zoomVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}
      >
        <View style={s.modalOverlay}>
          <StatusBar hidden />
          <View style={s.modalHeader}>
            <View style={s.modalPinchTip}>
              <MaterialIcons name="pinch" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={s.modalPinchText}>Pinch to Zoom (up to 4x)</Text>
            </View>
            <TouchableOpacity
              style={s.modalCloseBtn}
              onPress={() => setZoomVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.zoomScrollView}
            contentContainerStyle={s.zoomScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom={true}
          >
            <Image
              source={getProductImageSource(product)}
              style={s.fullZoomImage}
              resizeMode="contain"
            />
          </ScrollView>

          <View style={s.modalFooter}>
            <Text style={s.modalProductName} numberOfLines={1}>{product.name}</Text>
            <Text style={s.modalCategoryText}>{product.category}</Text>
          </View>
        </View>
      </Modal>

      {/* Bottom Action Footer */}
      <View style={[s.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[s.cartBtn, { borderColor: theme.primary }]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Text style={[s.cartBtnText, { color: theme.primary }]}>
            {added ? "Added ✓" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.buyBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            addItem(product, qty);
            navigation.navigate("Cart");
          }}
          disabled={product.stock === 0}
        >
          <Text style={[s.buyBtnText, { color: theme.textOnPrimary }]}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { width: "100%", height: 320, position: "relative", justifyContent: "center", alignItems: "center" },
  image: { width: "90%", height: "90%" },
  zoomHintBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 37, 64, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  zoomHintText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  body: { padding: 20 },
  category: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  name: { fontSize: 22, fontWeight: "800", lineHeight: 30, marginBottom: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  price: { fontSize: 24, fontWeight: "900" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { color: "#f59e0b", fontSize: 16 },
  rating: { fontSize: 13 },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, marginTop: 8 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 20, fontWeight: "700" },
  qtyVal: { fontSize: 18, fontWeight: "700", minWidth: 32, textAlign: "center" },
  subtotal: { fontSize: 16, fontWeight: "700", marginBottom: 20 },
  footer: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1 },
  cartBtn: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 14, alignItems: "center" },
  cartBtnText: { fontSize: 15, fontWeight: "700" },
  buyBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  buyBtnText: { fontSize: 15, fontWeight: "700" },

  // Modal zoom styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    justifyContent: "space-between"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 45,
    paddingHorizontal: 20,
    zIndex: 10
  },
  modalPinchTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  modalPinchText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500"
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center"
  },
  zoomScrollView: {
    flex: 1
  },
  zoomScrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  fullZoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: "center"
  },
  modalProductName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center"
  },
  modalCategoryText: {
    color: "#00b4d8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase"
  }
});
