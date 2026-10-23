import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../constants/colors";
import { formatPrice } from "../utils/formatPrice";

export default function ProductCard({ product, onPress, price = null, badge = null }) {
  const displayPrice = price ?? product.price;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
      <Image source={{ uri: product.imageUrl }} style={s.image} resizeMode="cover" />
      <View style={s.body}>
        <Text style={s.category}>{product.category}</Text>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        <View style={s.footer}>
          <Text style={s.price}>{formatPrice(displayPrice)}</Text>
          <View style={s.ratingRow}>
            <Text style={s.star}>★</Text>
            <Text style={s.rating}>{product.rating?.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 0.48, backgroundColor: colors.card, borderRadius: 14,
    margin: 6, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4
  },
  badge: {
    position: "absolute", top: 10, left: 10, zIndex: 1,
    backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  image: { width: "100%", height: 140, backgroundColor: colors.border },
  body: { padding: 10 },
  category: { fontSize: 11, fontWeight: "600", color: colors.accent, textTransform: "uppercase", marginBottom: 3 },
  name: { fontSize: 13, fontWeight: "700", color: colors.text, lineHeight: 18, marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 14, fontWeight: "800", color: colors.primary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  star: { color: "#f59e0b", fontSize: 12 },
  rating: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" }
});
