import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getProducts } from "../../services/productService";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/authService";
import ProductCard from "../../components/ProductCard";
import colors from "../../constants/colors";

import { SkeletonCatalogHeader, SkeletonProductGrid } from "../../components/Skeleton";

export default function CatalogScreen({ navigation }) {
  const { profile } = useAuth();
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
      <View style={s.container}>
        <SkeletonCatalogHeader />
        <SkeletonProductGrid count={6} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header Banner with User Greeting & Sign Out */}
      <View style={s.banner}>
        <View style={s.bannerTopRow}>
          <View style={{ flex: 1 }}>
            <View style={s.customerRoleBadge}>
              <MaterialIcons name="water-drop" size={13} color="#fff" />
              <Text style={s.customerRoleText}>RETAIL CONSUMER STORE</Text>
            </View>
            <Text style={s.bannerTitle}>{profile?.name ? `Hello, ${profile.name}` : "💧 Califnco Purifiers"}</Text>
            <Text style={s.bannerSub}>Pure, Safe & Mineral-Rich Drinking Water</Text>
          </View>

          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => {
              Alert.alert(
                "Sign Out",
                "Are you sure you want to sign out from your account?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign Out", style: "destructive", onPress: () => logout() }
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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
  banner: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  bannerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customerRoleBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4, marginBottom: 6 },
  customerRoleText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(239,68,68,0.85)", alignItems: "center", justifyContent: "center" },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  bannerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
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
