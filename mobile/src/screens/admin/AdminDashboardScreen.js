import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Linking
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";

export default function AdminDashboardScreen({ navigation }) {
  const { profile } = useAuth();
  const { theme, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingDealers: 0,
    approvedDealers: 0,
    activeTickets: 0
  });

  const loadMetrics = async () => {
    try {
      // 1. Orders and Revenue
      const ordersSnap = await getDocs(collection(db, "orders"));
      let rev = 0;
      ordersSnap.forEach(d => {
        const o = d.data();
        rev += (o.total || o.amount || 0);
      });

      // 2. Pending Dealers
      const pendingDealersSnap = await getDocs(
        query(collection(db, "users"), where("role", "in", ["Dealer", "dealer"]), where("dealerStatus", "==", "pending"))
      );

      // 3. Approved Dealers
      const approvedDealersSnap = await getDocs(
        query(collection(db, "users"), where("role", "in", ["Dealer", "dealer"]), where("dealerStatus", "==", "approved"))
      );

      // 4. Service tickets
      let activeTicketsCount = 0;
      try {
        const ticketsSnap = await getDocs(collection(db, "service_requests"));
        activeTicketsCount = ticketsSnap.docs.length;
      } catch (e) {}

      setStats({
        totalOrders: ordersSnap.docs.length,
        totalRevenue: rev,
        pendingDealers: pendingDealersSnap.docs.length,
        approvedDealers: approvedDealersSnap.docs.length,
        activeTickets: activeTicketsCount
      });
    } catch (err) {
      console.warn("Error fetching admin metrics:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
    >
      {/* Header Banner */}
      <View style={[styles.headerCard, { backgroundColor: theme.primary }]}>
        <View style={styles.badgeRow}>
          <View style={styles.adminRoleBadge}>
            <MaterialIcons name="security" size={14} color="#fff" />
            <Text style={styles.adminRoleText}>EXECUTIVE ADMIN</Text>
          </View>
          <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
            <MaterialIcons name="logout" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{profile?.name || "System Administrator"}</Text>
        <Text style={styles.headerSubtitle}>{profile?.email || "admin@test.com"}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading operations telemetry...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Action Alert Banner if Dealers Pending */}
          {stats.pendingDealers > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => navigation.navigate("AdminDealers")}
            >
              <MaterialIcons name="warning" size={24} color="#b45309" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.alertTitle}>Action Required: {stats.pendingDealers} Dealer Application(s)</Text>
                <Text style={styles.alertText}>Review wholesale applicant credentials to grant catalog access.</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#b45309" />
            </TouchableOpacity>
          )}

          {/* Metric Tiles */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Operations Overview</Text>
          <View style={styles.grid}>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]}>
                <MaterialIcons name="currency-rupee" size={22} color="#2563eb" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{stats.totalRevenue.toLocaleString("en-IN")}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gross Volume</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: "#f0fdf4" }]}>
                <MaterialIcons name="receipt-long" size={22} color="#16a34a" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalOrders}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Orders</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: "#fffbeb" }]}>
                <MaterialIcons name="person-add" size={22} color="#d97706" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingDealers}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Pending Dealers</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: "#faf5ff" }]}>
                <MaterialIcons name="verified" size={22} color="#9333ea" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.approvedDealers}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Active Partners</Text>
            </View>
          </View>

          {/* Quick Management Shortcuts */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Administrative Controls</Text>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate("AdminDealers")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#eff6ff" }]}>
              <MaterialIcons name="badge" size={24} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.actionRowTitle, { color: theme.text }]}>Dealer Verification & Approval</Text>
              <Text style={[styles.actionRowDesc, { color: theme.textMuted }]}>Review applicant shops, verify GST and grant B2B wholesale access.</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate("AdminOrders")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#f0fdf4" }]}>
              <MaterialIcons name="local-shipping" size={24} color="#15803d" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.actionRowTitle, { color: theme.text }]}>Order Fulfillment Manager</Text>
              <Text style={[styles.actionRowDesc, { color: theme.textMuted }]}>Track retail and bulk orders; dispatch shipments and update status.</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL("https://califnco-app-phi.vercel.app")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#fff7ed" }]}>
              <MaterialIcons name="open-in-browser" size={24} color="#c2410c" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.actionRowTitle, { color: theme.text }]}>Open Full Vercel Admin Portal</Text>
              <Text style={[styles.actionRowDesc, { color: theme.textMuted }]}>califnco-app-phi.vercel.app (Inventory management & detailed analytics)</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color="#c2410c" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: {
    padding: 20,
    paddingTop: 36,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  adminRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  adminRoleText: { color: "#fff", fontSize: 11, fontWeight: "800", marginLeft: 4, letterSpacing: 0.5 },
  logoutBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 12 },
  headerSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  loadingBox: { padding: 40, alignItems: "center" },
  content: { padding: 16 },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16
  },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#92400e" },
  alertText: { fontSize: 12, color: "#b45309", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10
  },
  actionIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionRowTitle: { fontSize: 14, fontWeight: "700" },
  actionRowDesc: { fontSize: 11, marginTop: 2, lineHeight: 16 }
});
