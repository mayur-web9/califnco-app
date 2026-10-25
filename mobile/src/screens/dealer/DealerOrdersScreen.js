import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { getUserOrders } from "../../services/orderService";
import { formatPrice, formatDate, statusColor } from "../../utils/formatPrice";
import colors from "../../constants/colors";

import { SkeletonOrderList } from "../../components/Skeleton";
import InvoicePreviewModal from "../../components/InvoicePreviewModal";

export default function DealerOrdersScreen() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await getUserOrders(profile.uid);
    setOrders(data);
  }, [profile]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleOpenInvoice(order) {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: 16 }}>
          <Text style={s.headerTitle}>Wholesale Purchase Invoices</Text>
          <Text style={s.headerSubtitle}>Loading verified B2B orders...</Text>
        </View>
        <SkeletonOrderList count={4} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.headerTitle}>Wholesale Purchase Invoices</Text>
            <Text style={s.headerSubtitle}>Track your B2B supply orders, dispatches & invoices</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyTitle}>No wholesale orders yet</Text>
            <Text style={s.emptyBody}>Placed bulk purchase orders will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.orderId}>Invoice #{item.id.slice(-6).toUpperCase()}</Text>
                <Text style={s.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[s.typeChip, { backgroundColor: item.type === "retail" ? "#f0fdf4" : "#eff6ff" }]}>
                  <Text style={[s.typeText, { color: item.type === "retail" ? "#16a34a" : "#2563eb" }]}>
                    {item.type === "retail" ? "RETAIL" : "BULK"}
                  </Text>
                </View>
                <View style={[s.statusChip, { backgroundColor: statusColor(item.status) + "22" }]}>
                  <Text style={[s.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
            </View>

            <View style={s.divider} />

            {item.items?.map((it, idx) => (
              <View key={idx} style={s.itemRow}>
                <Text style={s.itemName} numberOfLines={1}>{it.name}</Text>
                <Text style={s.itemDetail}>
                  {it.qty} pcs @ {formatPrice(it.price)} = {formatPrice(it.price * it.qty)}
                </Text>
              </View>
            ))}

            <View style={s.cardFooter}>
              <View>
                <Text style={s.totalLabel}>Invoice Total (incl. GST)</Text>
                <Text style={s.totalValue}>{formatPrice(item.total)}</Text>
              </View>

              <TouchableOpacity
                style={s.invoiceBtn}
                onPress={() => handleOpenInvoice(item)}
                activeOpacity={0.75}
              >
                <Text style={s.invoiceBtnText}>View Receipt 🧾</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <InvoicePreviewModal
        visible={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={selectedOrder}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontWeight: "700", color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { marginBottom: 6 },
  itemName: { fontSize: 13, fontWeight: "600", color: colors.text },
  itemDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border
  },
  totalLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  totalValue: { fontSize: 16, fontWeight: "900", color: colors.primary },
  invoiceBtn: {
    backgroundColor: "#0a2540",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  invoiceBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 6 },
  emptyBody: { fontSize: 14, color: colors.textSecondary }
});
