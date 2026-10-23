import React, { useState } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated
} from "react-native";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/formatPrice";
import colors from "../../constants/colors";

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    Alert.alert("Added to cart", `${product.name} x${qty} added to your cart.`);
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.imageUrl }} style={s.image} resizeMode="cover" />

        <View style={s.body}>
          <Text style={s.category}>{product.category}</Text>
          <Text style={s.name}>{product.name}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>{formatPrice(product.price)}</Text>
            <View style={s.ratingRow}>
              <Text style={s.star}>★</Text>
              <Text style={s.rating}>{product.rating?.toFixed(1)} ({product.reviewCount} reviews)</Text>
            </View>
          </View>

          <View style={s.stockRow}>
            <View style={[s.stockDot, { backgroundColor: product.stock > 0 ? colors.success : colors.error }]} />
            <Text style={s.stockText}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</Text>
          </View>

          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.description}>{product.description}</Text>

          <Text style={s.sectionTitle}>Quantity</Text>
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
              <Text style={s.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.qtyVal}>{qty}</Text>
            <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => q + 1)}>
              <Text style={s.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.subtotal}>Subtotal: {formatPrice(product.price * qty)}</Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.cartBtn} onPress={handleAddToCart} disabled={product.stock === 0}>
          <Text style={s.cartBtnText}>{added ? "Added ✓" : "Add to Cart"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.buyBtn}
          onPress={() => {
            addItem(product, qty);
            navigation.navigate("Cart");
          }}
          disabled={product.stock === 0}
        >
          <Text style={s.buyBtnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", height: 280, backgroundColor: colors.border },
  body: { padding: 20 },
  category: { fontSize: 12, fontWeight: "700", color: colors.accent, textTransform: "uppercase", marginBottom: 4 },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, lineHeight: 30, marginBottom: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  price: { fontSize: 24, fontWeight: "900", color: colors.primary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { color: "#f59e0b", fontSize: 16 },
  rating: { fontSize: 13, color: colors.textSecondary },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, color: colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8, marginTop: 8 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 20, color: "#fff", fontWeight: "700" },
  qtyVal: { fontSize: 18, fontWeight: "700", color: colors.text, minWidth: 32, textAlign: "center" },
  subtotal: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 20 },
  footer: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  cartBtn: { flex: 1, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, padding: 14, alignItems: "center" },
  cartBtnText: { fontSize: 15, fontWeight: "700", color: colors.primary },
  buyBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: "center" },
  buyBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" }
});
