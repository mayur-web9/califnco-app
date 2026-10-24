import React, { useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";
import { formatPrice } from "../utils/formatPrice";
import { getProductImageSource } from "../constants/productImages";
import { useCart } from "../hooks/useCart";

export default function ProductCard({ product, onPress, price = null, badge = null }) {
  const displayPrice = price ?? product.price;
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;
  const floatAnimY = useRef(new Animated.Value(0)).current;
  const floatAnimOpacity = useRef(new Animated.Value(0)).current;

  const handleQuickAdd = (e) => {
    e?.stopPropagation?.();
    addItem(product, 1, displayPrice);
    setJustAdded(true);

    // Spring button animation
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.78, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 3, tension: 45, useNativeDriver: true }),
    ]).start();

    // Floating +1 animation
    floatAnimY.setValue(0);
    floatAnimOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(floatAnimY, { toValue: -28, duration: 600, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(floatAnimOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();

    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}

      {/* Floating +1 feedback badge */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.floatingPlus,
          {
            transform: [{ translateY: floatAnimY }],
            opacity: floatAnimOpacity,
          },
        ]}
      >
        <Text style={s.floatingPlusText}>+1</Text>
      </Animated.View>

      <View style={s.imageContainer}>
        <Image
          source={getProductImageSource(product)}
          style={s.image}
          resizeMode="contain"
        />
      </View>
      <View style={s.body}>
        <View style={s.categoryRow}>
          <Text style={s.category}>{product.category}</Text>
          {product.stock <= 10 && product.stock > 0 && (
            <Text style={s.lowStock}>Only {product.stock} left</Text>
          )}
        </View>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        <View style={s.footer}>
          <View>
            <Text style={s.price}>{formatPrice(displayPrice)}</Text>
            <View style={s.ratingRow}>
              <Text style={s.star}>★</Text>
              <Text style={s.rating}>{product.rating ? Number(product.rating).toFixed(1) : "4.8"}</Text>
            </View>
          </View>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[s.quickAddBtn, justAdded && s.quickAddBtnSuccess]}
              onPress={handleQuickAdd}
              disabled={product.stock === 0}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={justAdded ? "check" : "add-shopping-cart"}
                size={16}
                color="#ffffff"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
}


const s = StyleSheet.create({
  card: {
    flex: 0.48,
    backgroundColor: colors.card,
    borderRadius: 14,
    margin: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)"
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  imageContainer: {
    width: "100%",
    height: 145,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  body: {
    padding: 10,
    flex: 1,
    justifyContent: "space-between"
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  category: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  lowStock: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#e11d48"
  },
  name: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 17,
    minHeight: 52,
    marginBottom: 6
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)"
  },
  price: {
    fontSize: 14.5,
    fontWeight: "900",
    color: colors.primary
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2
  },
  star: {
    color: "#d97706",
    fontSize: 11
  },
  rating: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "700"
  },
  quickAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  quickAddBtnSuccess: {
    backgroundColor: "#10b981"
  },
  floatingPlus: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4
  },
  floatingPlusText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  }
});
