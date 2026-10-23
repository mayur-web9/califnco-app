import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from "react-native";
import { getProducts } from "../../services/productService";
import { CATEGORIES } from "../../constants/categories";
import ProductCard from "../../components/ProductCard";
import colors from "../../constants/colors";

export default function CatalogScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    getProducts()
      .then(setProducts)
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

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search purifiers, filters..."
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

      {/* Results count */}
      <Text style={s.countText}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</Text>

      {/* Product grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyText}>No products found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate("ProductDetail", { product: item })}
          />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
    margin: 16, borderRadius: 12, paddingHorizontal: 14,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 3
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 16, color: colors.textMuted, paddingLeft: 8 },
  catList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  catTextActive: { color: colors.textOnPrimary },
  countText: { paddingHorizontal: 16, paddingBottom: 4, fontSize: 13, color: colors.textMuted },
  grid: { paddingHorizontal: 8, paddingBottom: 24 },
  row: { justifyContent: "space-between" },
  empty: { alignItems: "center", paddingTop: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary }
});
