import React, { useState, useRef } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Dimensions, StatusBar, Animated, Easing
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

  // Animation values for Add-to-Cart fly-to-cart effect
  const flyY = useRef(new Animated.Value(0)).current;
  const flyX = useRef(new Animated.Value(0)).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const flyOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const toastY = useRef(new Animated.Value(50)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  function handleAddToCart() {
    // 1. Add item to cart context
    addItem(product, qty);
    setAdded(true);
    setIsFlying(true);
    setShowToast(true);

    // 2. Button bounce spring animation
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1.0, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    // 3. Reset and trigger flying product thumbnail animation
    flyY.setValue(0);
    flyX.setValue(0);
    flyScale.setValue(1);
    flyOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(flyY, {
        toValue: SCREEN_HEIGHT * 0.58,
        duration: 700,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(flyX, {
        toValue: SCREEN_WIDTH * 0.15,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(flyScale, {
        toValue: 0.22,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(flyOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsFlying(false);
    });

    // 4. Slide-in Toast notification
    toastY.setValue(40);
    toastOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(toastY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Hide toast after 3 seconds
    setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowToast(false);
        setAdded(false);
      });
    }, 3000);
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
          {/* Category Pill */}
          <View style={s.categoryRow}>
            <View style={[s.categoryBadge, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
              <Text style={[s.categoryText, { color: "#00b4d8" }]}>{product.category}</Text>
            </View>
            <View style={s.ratingPill}>
              <Text style={s.star}>★</Text>
              <Text style={[s.ratingText, { color: theme.text }]}>
                {product.rating ? product.rating.toFixed(1) : "4.6"} ({product.reviewCount || 120} reviews)
              </Text>
            </View>
          </View>

          {/* Product Title */}
          <Text style={[s.name, { color: theme.text }]}>{product.name}</Text>

          {/* Price & Discount Row (Screen 9) */}
          <View style={s.priceContainer}>
            <Text style={[s.price, { color: "#00b4d8" }]}>{formatPrice(product.price)}</Text>
            <Text style={[s.originalPrice, { color: theme.textMuted }]}>
              {formatPrice(Math.round(product.price * 1.2))}
            </Text>
            <View style={s.discountBadge}>
              <Text style={s.discountText}>17% OFF</Text>
            </View>
          </View>

          {/* Feature Checklist (Screen 9) */}
          <View style={[s.featureBox, { backgroundColor: isDark ? theme.card : "#f8fafc", borderColor: isDark ? theme.border : "#e2e8f0" }]}>
            <View style={s.featureRow}>
              <View style={s.checkCircle}>
                <MaterialIcons name="check" size={14} color="#00b4d8" />
              </View>
              <Text style={[s.featureText, { color: theme.text }]}>
                {product.category === "Cartridges" ? "100% Food Grade Material" : "7 Stage Purification"}
              </Text>
            </View>
            <View style={s.featureRow}>
              <View style={s.checkCircle}>
                <MaterialIcons name="check" size={14} color="#00b4d8" />
              </View>
              <Text style={[s.featureText, { color: theme.text }]}>
                {product.category === "Cartridges" ? "High Dirt Holding Capacity" : "UV + UF Technology"}
              </Text>
            </View>
            <View style={s.featureRow}>
              <View style={s.checkCircle}>
                <MaterialIcons name="check" size={14} color="#00b4d8" />
              </View>
              <Text style={[s.featureText, { color: theme.text }]}>
                {product.category === "Cartridges" ? "Universal RO System Fit" : "Free Installation & Demo"}
              </Text>
            </View>
          </View>

          {/* Stock availability */}
          <View style={s.stockRow}>
            <View style={[s.stockDot, { backgroundColor: product.stock > 0 ? "#10b981" : "#ef4444" }]} />
            <Text style={[s.stockText, { color: theme.textSecondary }]}>
              {product.stock > 0 ? `${product.stock} units in stock` : "Currently out of stock"}
            </Text>
          </View>

          {/* Description */}
          <Text style={[s.sectionTitle, { color: theme.text }]}>Overview</Text>
          <Text style={[s.description, { color: theme.textSecondary }]}>{product.description}</Text>

          {/* Quantity Stepper Pill (Screen 9) */}
          <View style={s.qtySection}>
            <Text style={[s.qtyLabel, { color: theme.text }]}>Quantity</Text>
            <View style={[s.qtyPill, { backgroundColor: isDark ? "#162a45" : "#f1f5f9", borderColor: isDark ? theme.border : "#e2e8f0" }]}>
              <TouchableOpacity
                style={s.qtyStepperBtn}
                onPress={() => setQty(q => Math.max(1, q - 1))}
                activeOpacity={0.7}
              >
                <Text style={[s.qtyStepperBtnText, { color: theme.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[s.qtyVal, { color: theme.text }]}>{qty}</Text>
              <TouchableOpacity
                style={s.qtyStepperBtn}
                onPress={() => setQty(q => q + 1)}
                activeOpacity={0.7}
              >
                <Text style={[s.qtyStepperBtnText, { color: theme.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[s.subtotalCard, { backgroundColor: isDark ? "#0f2338" : "#e0f2fe" }]}>
            <Text style={[s.subtotalLabel, { color: isDark ? "#94a3b8" : "#0369a1" }]}>Total Order Value:</Text>
            <Text style={[s.subtotalVal, { color: isDark ? "#00b4d8" : "#0a2540" }]}>
              {formatPrice(product.price * qty)}
            </Text>
          </View>
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

      {/* Flying Product Thumbnail Effect */}
      {isFlying && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.flyingThumb,
            {
              transform: [
                { translateY: flyY },
                { translateX: flyX },
                { scale: flyScale }
              ],
              opacity: flyOpacity,
            }
          ]}
        >
          <Image
            source={getProductImageSource(product)}
            style={s.flyingThumbImage}
            resizeMode="contain"
          />
          <View style={s.flyingBadge}>
            <Text style={s.flyingBadgeText}>+{qty}</Text>
          </View>
        </Animated.View>
      )}

      {/* Floating Toast Notification */}
      {showToast && (
        <Animated.View
          style={[
            s.toastBanner,
            {
              transform: [{ translateY: toastY }],
              opacity: toastOpacity,
              backgroundColor: isDark ? "#0f172a" : "#0a2540",
            }
          ]}
        >
          <View style={s.toastLeft}>
            <View style={s.toastCheckIcon}>
              <MaterialIcons name="check" size={16} color="#fff" />
            </View>
            <View style={s.toastTextWrap}>
              <Text style={s.toastTitle}>Added to Cart!</Text>
              <Text style={s.toastSub} numberOfLines={1}>
                {product.name} (x{qty})
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.toastCartBtn}
            onPress={() => (navigation.getParent() || navigation).navigate("Cart")}
            activeOpacity={0.8}
          >
            <Text style={s.toastCartBtnText}>View Cart →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom Action Footer */}
      <View style={[s.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <Animated.View style={{ flex: 1, transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              s.cartBtn,
              {
                borderColor: theme.primary,
                backgroundColor: added ? theme.primary : "transparent"
              }
            ]}
            onPress={handleAddToCart}
            disabled={product.stock === 0}
            activeOpacity={0.85}
          >
            <Text style={[s.cartBtnText, { color: added ? theme.textOnPrimary : theme.primary }]}>
              {added ? "✓ Added" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity
          style={[s.buyBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            addItem(product, qty);
            (navigation.getParent() || navigation).navigate("Cart");
          }}
          disabled={product.stock === 0}
          activeOpacity={0.85}
        >
          <Text style={[s.buyBtnText, { color: theme.textOnPrimary }]}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flyingThumb: {
    position: "absolute",
    top: 100,
    left: SCREEN_WIDTH / 2 - 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    shadowColor: "#00b4d8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#00b4d8"
  },
  flyingThumbImage: {
    width: 76,
    height: 76,
    borderRadius: 38
  },
  flyingBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#10b981",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff"
  },
  flyingBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  toastBanner: {
    position: "absolute",
    bottom: 92,
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 998,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)"
  },
  toastLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10
  },
  toastCheckIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center"
  },
  toastTextWrap: {
    flex: 1
  },
  toastTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  toastSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1
  },
  toastCartBtn: {
    backgroundColor: "#00b4d8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  toastCartBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700"
  },
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
  categoryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(245, 158, 11, 0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  star: { color: "#f59e0b", fontSize: 14 },
  ratingText: { fontSize: 12, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "900", lineHeight: 28, marginBottom: 12, letterSpacing: -0.2 },
  priceContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  price: { fontSize: 26, fontWeight: "900" },
  originalPrice: { fontSize: 16, textDecorationLine: "line-through", fontWeight: "600" },
  discountBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#16a34a", fontSize: 11, fontWeight: "800" },
  featureBox: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10, marginBottom: 18 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0, 180, 216, 0.15)", alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 13, fontWeight: "600" },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 6, marginTop: 4 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  qtySection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  qtyLabel: { fontSize: 15, fontWeight: "800" },
  qtyPill: { flexDirection: "row", alignItems: "center", borderRadius: 25, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4 },
  qtyStepperBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  qtyStepperBtnText: { fontSize: 18, fontWeight: "800" },
  qtyVal: { fontSize: 16, fontWeight: "800", minWidth: 32, textAlign: "center" },
  subtotalCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 10 },
  subtotalLabel: { fontSize: 13, fontWeight: "600" },
  subtotalVal: { fontSize: 17, fontWeight: "900" },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1 },
  cartBtn: { flex: 1, borderWidth: 2, borderRadius: 25, height: 50, alignItems: "center", justifyContent: "center" },
  cartBtnText: { fontSize: 15, fontWeight: "800" },
  buyBtn: { flex: 1, borderRadius: 25, height: 50, alignItems: "center", justifyContent: "center" },
  buyBtnText: { fontSize: 15, fontWeight: "800" },

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
