import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useTheme } from "../../hooks/useTheme";

export default function AdminOrdersScreen() {
  const { theme } = useTheme();

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
      {/* Filter Row */}
      <View style={[styles.filterBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.filterChip, filter === "all" && [styles.activeChip, { backgroundColor: theme.primary }]]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.chipText, { color: filter === "all" ? "#fff" : theme.textMuted }]}>
            All ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "retail" && [styles.activeChip, { backgroundColor: theme.primary }]]}
          onPress={() => setFilter("retail")}
        >
          <Text style={[styles.chipText, { color: filter === "retail" ? "#fff" : theme.textMuted }]}>
            Retail Consumer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "bulk" && [styles.activeChip, { backgroundColor: theme.primary }]]}
          onPress={() => setFilter("bulk")}
        >
          <Text style={[styles.chipText, { color: filter === "bulk" ? "#fff" : theme.textMuted }]}>
            B2B Wholesale Bulk
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading operations order stream...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialIcons name="receipt-long" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Orders Found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Orders placed in the mobile app will sync here immediately.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isBulk = item.type === "bulk" || item.orderType === "bulk" || (item.items && item.items.some(i => i.isBulk || i.bulkQty));
            const statusColor = item.status === "delivered" ? "#16a34a" : item.status === "dispatched" ? "#2563eb" : "#d97706";

            return (
              <View style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.orderTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.orderId, { color: theme.text }]}>
                        #{item.id.slice(-8).toUpperCase()}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: isBulk ? "#fef3c7" : "#eff6ff" }]}>
                        <Text style={[styles.typeBadgeText, { color: isBulk ? "#b45309" : "#1d4ed8" }]}>
                          {isBulk ? "WHOLESALE BULK" : "RETAIL"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.customerEmail, { color: theme.textMuted }]}>
                      {item.customerEmail || item.userName || "Customer Order"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
                    onPress={() => handleUpdateStatus(item)}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {(item.status || "confirmed").toUpperCase()} ▾
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Items Summary */}
                <View style={[styles.itemsSummary, { borderColor: theme.border }]}>
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
                    <Text style={[styles.totalValue, { color: theme.text }]}>
                      ₹{(item.total || item.amount || 0).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.updateBtn, { backgroundColor: theme.primary }]}
                    disabled={updatingId === item.id}
                    onPress={() => handleUpdateStatus(item)}
                  >
                    {updatingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="edit" size={14} color="#fff" />
                        <Text style={styles.updateBtnText}>Update Status</Text>
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
  filterBar: { flexDirection: "row", padding: 6, margin: 16, marginBottom: 0, borderRadius: 10, borderWidth: 1 },
  filterChip: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeChip: {},
  chipText: { fontSize: 11, fontWeight: "700" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 12 },
  emptySubtitle: { fontSize: 12, textAlign: "center", marginTop: 4 },
  orderCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  orderTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontWeight: "800" },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  typeBadgeText: { fontSize: 9, fontWeight: "800" },
  customerEmail: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "800" },
  itemsSummary: { marginVertical: 10, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1 },
  itemLine: { fontSize: 12, lineHeight: 18 },
  orderBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 10 },
  totalValue: { fontSize: 16, fontWeight: "800" },
  updateBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  updateBtnText: { color: "#fff", fontSize: 11, fontWeight: "700", marginLeft: 4 }
});
