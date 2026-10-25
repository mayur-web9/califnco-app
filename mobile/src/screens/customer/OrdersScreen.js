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

export default function OrdersScreen({ navigation }) {
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

  function handleOpenDemo() {
    setSelectedOrder(null);
    setShowInvoiceModal(true);
  }

  if (loading) {
    return (
      <View style={s.container}>
        <SkeletonOrderList count={4} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Top Banner */}
      <View style={s.topBanner}>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>My Purchases & Warranties</Text>
          <Text style={s.bannerSub}>Official tax invoices & warranty records</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptyBody}>Your orders will appear here after checkout.</Text>
            <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate("Catalog")}>
              <Text style={s.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                <Text style={s.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[s.typeChip, { backgroundColor: item.type === "bulk" ? "#eff6ff" : "#f0fdf4" }]}>
                  <Text style={[s.typeText, { color: item.type === "bulk" ? "#2563eb" : "#16a34a" }]}>
                    {item.type === "bulk" ? "BULK" : "RETAIL"}
                  </Text>
                </View>
                <View style={[s.statusChip, { backgroundColor: statusColor(item.status) + "22" }]}>
                  <Text style={[s.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
            </View>

            <View style={s.divider} />

            {item.items?.slice(0, 2).map(i => (
              <Text key={i.productId} style={s.itemRow} numberOfLines={1}>
                {i.name} x{i.qty} — {formatPrice(i.price * i.qty)}
              </Text>
            ))}
            {item.items?.length > 2 && (
              <Text style={s.moreItems}>+{item.items.length - 2} more item{item.items.length - 2 !== 1 ? "s" : ""}</Text>
            )}

            <View style={s.cardFooter}>
              <View>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalValue}>{formatPrice(item.total)}</Text>
              </View>

              <TouchableOpacity
                style={s.viewInvoiceBtn}
                onPress={() => handleOpenInvoice(item)}
                activeOpacity={0.75}
              >
                <Text style={s.viewInvoiceBtnText}>Print Receipt 🧾</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Animated Printed Receipt Modal */}
      <InvoicePreviewModal
        key={selectedOrder?.id || "invoice-modal"}
        visible={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  demoReceiptBtn: {
    backgroundColor: "#0a2540",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#00b4d8",
  },
  demoReceiptBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontWeight: "800", color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  moreItems: { fontSize: 12, color: colors.textMuted, marginBottom: 4, fontStyle: "italic" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  totalValue: { fontSize: 17, fontWeight: "900", color: "#00b4d8" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 64 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24 },
  shopBtn: { backgroundColor: "#00b4d8", borderRadius: 25, paddingHorizontal: 28, paddingVertical: 14, shadowColor: "#00b4d8", shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  shopBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  viewInvoiceBtn: {
    backgroundColor: "rgba(0, 180, 216, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 180, 216, 0.3)",
  },
  viewInvoiceBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00b4d8",
  },
});
