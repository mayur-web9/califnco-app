import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../constants/colors";
import { formatPrice } from "../utils/formatPrice";
import { getProductImageSource } from "../constants/productImages";

export default function ProductCard({ product, onPress, price = null, badge = null }) {
  const displayPrice = price ?? product.price;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
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
        <Text style={s.name} numberOfLines={3}>{product.name}</Text>
        <View style={s.footer}>
          <Text style={s.price}>{formatPrice(displayPrice)}</Text>
          <View style={s.ratingRow}>
            <Text style={s.star}>★</Text>
            <Text style={s.rating}>{product.rating ? Number(product.rating).toFixed(1) : "4.8"}</Text>
          </View>
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
  }
});
