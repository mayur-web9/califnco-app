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
    margin: 16, marginBottom: 12, borderRadius: 12, paddingHorizontal: 14,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 3
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 16, color: colors.textMuted, paddingLeft: 8 },
  catContainer: {
    height: 46,
    marginBottom: 6,
  },
  catList: {
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted
  },
  grid: { paddingHorizontal: 8, paddingBottom: 24 },
  row: { justifyContent: "space-between" },
  empty: { alignItems: "center", paddingTop: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary }
});
