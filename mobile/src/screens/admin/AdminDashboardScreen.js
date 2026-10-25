import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";
import ScreenHeader from "../../components/ScreenHeader";

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Executive Operations"
        subtitle="Real-time telemetry, orders & stock control"
        badgeText="👑 EXECUTIVE ADMIN"
        badgeIcon="security"
        rightAction={
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            onPress={() => {
              Alert.alert(
                "Sign Out",
                "Are you sure you want to sign out from the Admin Console?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign Out", style: "destructive", onPress: () => logout() }
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={17} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00b4d8" />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00b4d8" />
            <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading operations telemetry...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Action Alert Banner if Dealers Pending */}
            {stats.pendingDealers > 0 && (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={() => navigation.navigate("AdminDealers")}
                activeOpacity={0.85}
              >
                <View style={styles.alertIconWrap}>
                  <MaterialIcons name="notifications-active" size={22} color="#b45309" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.alertTitle}>
                    {stats.pendingDealers} Dealer Application{stats.pendingDealers > 1 ? "s" : ""} Pending
                  </Text>
                  <Text style={styles.alertText}>Review trade credentials to grant catalog wholesale tier.</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#b45309" />
              </TouchableOpacity>
            )}

            {/* Metric Tiles */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Operations Overview</Text>
            <View style={styles.grid}>
              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
                  <MaterialIcons name="currency-rupee" size={22} color="#2563eb" />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>₹{stats.totalRevenue.toLocaleString("en-IN")}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gross Volume</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                  <MaterialIcons name="receipt-long" size={22} color="#16a34a" />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalOrders}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Orders</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(217, 119, 6, 0.12)" }]}>
                  <MaterialIcons name="person-add" size={22} color="#d97706" />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingDealers}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Pending Dealers</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(147, 51, 234, 0.12)" }]}>
                  <MaterialIcons name="verified" size={22} color="#9333ea" />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.approvedDealers}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Active Partners</Text>
              </View>
            </View>

            {/* Quick Management Shortcuts */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 22 }]}>Administrative Controls</Text>

            <TouchableOpacity
              style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate("AdminProducts")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                <MaterialIcons name="inventory" size={22} color="#10b981" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.actionRowTitle, { color: theme.text }]}>Catalog & Stock Inventory</Text>
                <Text style={[styles.actionRowDesc, { color: theme.textMuted }]}>
                  Upload Cloudinary photos, adjust stock, edit B2B wholesale prices.
                </Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={15} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate("AdminDealers")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
                <MaterialIcons name="badge" size={22} color="#2563eb" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.actionRowTitle, { color: theme.text }]}>Dealer Verification & Licensure</Text>
                <Text style={[styles.actionRowDesc, { color: theme.textMuted }]}>
                  Review dealer applications, inspect GST documents & grant wholesale tier.
                </Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={15} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate("AdminOrders")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(0, 180, 216, 0.12)" }]}>
                <MaterialIcons name="local-shipping" size={22} color="#00b4d8" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.actionRowTitle, { color: theme.text }]}>Order Fulfillment Manager</Text>
                <Text style={[styles.actionRowDesc, { color: theme.textMuted }]}>
                  Dispatch retail consumer and wholesale bulk shipments.
                </Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={15} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 36,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  content: {
    padding: 16,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#d97706",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(217, 119, 6, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400e",
  },
  alertText: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRowTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  actionRowDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
});
