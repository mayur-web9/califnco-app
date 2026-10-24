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
            onPress={() => navigation.navigate("Cart")}
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
            navigation.navigate("Cart");
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
