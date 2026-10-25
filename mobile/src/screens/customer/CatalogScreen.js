import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image, Animated
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getProducts } from "../../services/productService";
import { CATEGORIES } from "../../constants/categories";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";
import ProductCard from "../../components/ProductCard";
import colors from "../../constants/colors";
import { SkeletonCatalogHeader, SkeletonProductGrid } from "../../components/Skeleton";
import { getProductImageSource } from "../../constants/productImages";

export default function CatalogScreen({ navigation }) {
  const { profile } = useAuth();
  const { theme, isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const listRef = useRef(null);

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
        p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, search, activeCategory]);

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <SkeletonCatalogHeader />
        <SkeletonProductGrid count={6} />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={s.headerContent}>
      {/* 1. Top Bar Greeting (Screen 7) */}
      <View style={[s.topBar, { backgroundColor: isDark ? theme.card : "#0a2540" }]}>
        <View style={{ flex: 1 }}>
          <View style={s.greetingRow}>
            <Text style={s.greetingName}>
              Hello, {profile?.name ? profile.name.split(" ")[0] : "Mayur"}
            </Text>
            <Text style={s.greetingCrown}>👑</Text>
          </View>
          <Text style={s.greetingSub}>Pure Water, Better Life</Text>
        </View>

        <View style={s.topBarActions}>
          <TouchableOpacity
            style={s.topBarIconBtn}
            onPress={() => navigation.navigate("Orders")}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="notifications-none" size={22} color="#ffffff" />
            <View style={s.badgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.topBarIconBtn, s.logoutBtn]}
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
            accessibilityLabel="Sign Out"
          >
            <MaterialIcons name="logout" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Gradient Banner: "Clean Water for a Healthier You" (Screen 7) */}
      <View style={[s.heroBanner, { backgroundColor: isDark ? "#0f2338" : "#0a2540" }]}>
        <View style={s.heroLeft}>
          <View style={s.heroBadge}>
            <MaterialIcons name="verified" size={13} color="#00b4d8" />
            <Text style={s.heroBadgeText}>CALIFNCO SMART TECH</Text>
          </View>
          <Text style={s.heroTitle}>Clean Water{"\n"}for a Healthier You</Text>
          <Text style={s.heroSub}>Advanced RO + UV + UF Filtration</Text>
        </View>
        <View style={s.heroPurifierThumb}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80" }}
            style={s.heroPurifierImg}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 3. 4-Item Quick Action Navigation (Screen 7) */}
      <View style={s.quickNavRow}>
        <TouchableOpacity
          style={s.quickNavItem}
          onPress={() => {
            setActiveCategory("All");
            setSearch("");
          }}
          activeOpacity={0.8}
        >
          <View style={[s.quickNavCircle, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="storefront" size={24} color="#00b4d8" />
          </View>
          <Text style={[s.quickNavLabel, { color: theme.text }]}>Catalog</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.quickNavItem}
          onPress={() => navigation.navigate("Orders")}
          activeOpacity={0.8}
        >
          <View style={[s.quickNavCircle, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="receipt-long" size={24} color="#00b4d8" />
          </View>
          <Text style={[s.quickNavLabel, { color: theme.text }]}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.quickNavItem}
          onPress={() => navigation.navigate("Service")}
          activeOpacity={0.8}
        >
          <View style={[s.quickNavCircle, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="handyman" size={24} color="#00b4d8" />
          </View>
          <Text style={[s.quickNavLabel, { color: theme.text }]}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.quickNavItem}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          <View style={[s.quickNavCircle, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="person-outline" size={24} color="#00b4d8" />
          </View>
          <Text style={[s.quickNavLabel, { color: theme.text }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & Filter (Screen 8) */}
      <View style={[s.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <MaterialIcons name="search" size={22} color={colors.textMuted} style={s.searchIcon} />
        <TextInput
          style={[s.search, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")} style={s.clearBtn}>
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.filterBtn}
            onPress={() => {
              const nextIndex = (CATEGORIES.findIndex(c => c.id === activeCategory) + 1) % CATEGORIES.length;
              setActiveCategory(CATEGORIES[nextIndex].id);
            }}
          >
            <MaterialIcons name="tune" size={20} color="#00b4d8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 6. Category Filter Chips (Screen 8) */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        contentContainerStyle={s.catList}
        renderItem={({ item }) => {
          const isActive = activeCategory === item.id;
          return (
            <TouchableOpacity
              style={[
                s.catChip,
                { backgroundColor: isActive ? "#00b4d8" : (isDark ? theme.card : "#ffffff") },
                { borderColor: isActive ? "#00b4d8" : (isDark ? theme.border : "#e2e8f0") }
              ]}
              onPress={() => setActiveCategory(item.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  s.catText,
                  { color: isActive ? "#ffffff" : theme.textSecondary, fontWeight: isActive ? "800" : "600" }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* 7. Results count */}
      <View style={s.countRow}>
        <Text style={[s.countText, { color: theme.textMuted }]}>
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} available
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={filtered}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialIcons name="remove-shopping-cart" size={48} color="#94a3b8" />
            <Text style={[s.emptyTitle, { color: theme.text }]}>No products found</Text>
            <Text style={[s.emptySub, { color: theme.textSecondary }]}>
              Try adjusting your search query or switching categories.
            </Text>
            <TouchableOpacity
              style={s.emptyResetBtn}
              onPress={() => {
                setSearch("");
                setActiveCategory("All");
              }}
            >
              <Text style={s.emptyResetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
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
  container: { flex: 1 },
  headerContent: { paddingBottom: 8 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  greetingName: { fontSize: 20, fontWeight: "900", color: "#ffffff", letterSpacing: -0.3 },
  greetingCrown: { fontSize: 18 },
  greetingSub: { fontSize: 13, color: "rgba(255, 255, 255, 0.75)", marginTop: 2, fontWeight: "500" },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  badgeDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00b4d8",
  },
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#00b4d8",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 180, 216, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: { color: "#00b4d8", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "#ffffff", lineHeight: 26, letterSpacing: -0.2 },
  heroSub: { fontSize: 12, color: "rgba(255, 255, 255, 0.75)", marginTop: 6, fontWeight: "500" },
  heroPurifierThumb: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroPurifierImg: { width: "90%", height: "90%" },
  quickNavRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
  },
  quickNavItem: { alignItems: "center", minWidth: 64 },
  quickNavCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  quickNavLabel: { fontSize: 12, fontWeight: "700" },
  promoCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  promoTitle: { fontSize: 15, fontWeight: "800", marginBottom: 3 },
  promoDesc: { fontSize: 12, lineHeight: 16, marginBottom: 12 },
  promoBtn: {
    backgroundColor: "#00b4d8",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  promoBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  promoImg: { width: 72, height: 72, borderRadius: 14, marginLeft: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearBtn: { padding: 4 },
  filterBtn: { padding: 4 },
  catList: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 18,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  catText: { fontSize: 13, includeFontPadding: false },
  countRow: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  countText: { fontSize: 12, fontWeight: "600" },
  grid: { paddingHorizontal: 8, paddingBottom: 32 },
  row: { justifyContent: "space-between" },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "800", marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  emptyResetBtn: { backgroundColor: "#00b4d8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyResetBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
