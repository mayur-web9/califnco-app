import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useTheme } from "../../hooks/useTheme";
import { formatPrice, formatDate, statusColor } from "../../utils/formatPrice";
import ScreenHeader from "../../components/ScreenHeader";

export default function AdminOrdersScreen() {
  const { theme, isDark } = useTheme();

  const [filter, setFilter] = useState("all"); // "all" | "retail" | "bulk"
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list);
    } catch (err) {
      console.warn("Error fetching admin orders:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = (order) => {
    const statuses = ["confirmed", "dispatched", "delivered"];
    const current = (order.status || "confirmed").toLowerCase();

    Alert.alert(
      "Update Fulfillment Status",
      `Order: #${order.id.slice(-6).toUpperCase()}\nCurrent Status: ${current.toUpperCase()}`,
      [
        { text: "Cancel", style: "cancel" },
        ...statuses.map(st => ({
          text: `Mark as ${st.toUpperCase()}`,
          onPress: async () => {
            setUpdatingId(order.id);
            try {
              await updateDoc(doc(db, "orders", order.id), {
                status: st,
                updatedAt: serverTimestamp()
              });
              Alert.alert("Status Updated", `Order #${order.id.slice(-6).toUpperCase()} is now ${st.toUpperCase()}.`);
              fetchOrders();
            } catch (err) {
              Alert.alert("Update Failed", err.message);
            } finally {
              setUpdatingId(null);
            }
          }
        }))
      ]
    );
  };

  const filtered = orders.filter(o => {
    const isBulk = o.type === "bulk" || o.orderType === "bulk" || (o.items && o.items.some(i => i.isBulk || i.bulkQty));
    if (filter === "retail") return !isBulk;
    if (filter === "bulk") return isBulk;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Fulfillment Control"
        subtitle="Dispatch retail consumer orders & bulk consignments"
        badgeText="👑 ADMIN FULFILLMENT"
        badgeIcon="local-shipping"
        rightAction={
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={() => {
              setRefreshing(true);
              fetchOrders();
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* Filter Row */}
      <View style={[styles.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
              filter === "all" && { backgroundColor: isDark ? theme.accent : "#0a2540" }
            ]}
            onPress={() => setFilter("all")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                { color: theme.textMuted },
                filter === "all" && { color: "#ffffff", fontWeight: "800" }
              ]}
            >
              All ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
              filter === "retail" && { backgroundColor: isDark ? theme.accent : "#0a2540" }
            ]}
            onPress={() => setFilter("retail")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                { color: theme.textMuted },
                filter === "retail" && { color: "#ffffff", fontWeight: "800" }
              ]}
            >
              Retail Consumer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
              filter === "bulk" && { backgroundColor: isDark ? theme.accent : "#0a2540" }
            ]}
            onPress={() => setFilter("bulk")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                { color: theme.textMuted },
                filter === "bulk" && { color: "#ffffff", fontWeight: "800" }
              ]}
            >
              B2B Wholesale
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#00b4d8" />
          <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading operations order stream...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="receipt-long" size={48} color="#00b4d8" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Orders Found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Orders placed in the mobile app will sync here immediately.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              tintColor="#00b4d8"
            />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const isBulk = item.type === "bulk" || item.orderType === "bulk" || (item.items && item.items.some(i => i.isBulk || i.bulkQty));
            const color = statusColor(item.status);

            return (
              <View style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.orderTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.orderIdRow}>
                      <Text style={[styles.orderId, { color: theme.text }]}>
                        #{item.id.slice(-8).toUpperCase()}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: isBulk ? "rgba(37, 99, 235, 0.12)" : "rgba(16, 185, 129, 0.12)" }]}>
                        <Text style={[styles.typeBadgeText, { color: isBulk ? "#2563eb" : "#10b981" }]}>
                          {isBulk ? "B2B WHOLESALE" : "RETAIL"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.customerEmail, { color: theme.textMuted }]}>
                      {item.userName ? `${item.userName} • ` : ""}{item.customerEmail || item.phone || "Customer"}
                    </Text>
                    {item.createdAt ? (
                      <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: color + "20", borderColor: color + "40" }]}
                    onPress={() => handleUpdateStatus(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={[styles.statusText, { color }]}>
                      {(item.status || "confirmed").toUpperCase()} ▾
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Items Summary */}
                <View style={[styles.itemsSummary, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
                  {item.items && item.items.map((it, idx) => (
                    <Text key={idx} style={[styles.itemLine, { color: theme.text }]} numberOfLines={1}>
                      • {it.quantity || it.qty || 1}x {it.name || "Purifier Item"}
                    </Text>
                  ))}
                </View>

                {/* Total and Action */}
                <View style={styles.orderBottomRow}>
                  <View>
                    <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Order Value</Text>
                    <Text style={[styles.totalValue, { color: "#00b4d8" }]}>
                      {formatPrice(item.total || item.amount || 0)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.updateBtn}
                    disabled={updatingId === item.id}
                    onPress={() => handleUpdateStatus(item)}
                    activeOpacity={0.8}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="local-shipping" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.updateBtnText}>Dispatch / Status</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  orderCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  customerEmail: {
    fontSize: 12,
    marginTop: 3,
  },
  orderDate: {
    fontSize: 11.5,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  itemsSummary: {
    marginVertical: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 4,
  },
  itemLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  orderBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b4d8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  updateBtnText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "800",
  },
});
