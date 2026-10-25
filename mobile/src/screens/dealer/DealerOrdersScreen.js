import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { getUserOrders } from "../../services/orderService";
import { formatPrice, formatDate, statusColor } from "../../utils/formatPrice";
import ScreenHeader from "../../components/ScreenHeader";
import { SkeletonOrderList } from "../../components/Skeleton";
import InvoicePreviewModal from "../../components/InvoicePreviewModal";

const STATUS_FILTERS = ["All", "Confirmed", "Dispatched", "Delivered"];

export default function DealerOrdersScreen() {
  const { profile } = useAuth();
  const { theme, isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
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

  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") return orders;
    return orders.filter(
      o => (o.status || "confirmed").toLowerCase() === activeFilter.toLowerCase()
    );
  }, [orders, activeFilter]);

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title="B2B Purchase Invoices"
          subtitle="Track wholesale orders, dispatches & GST invoices"
          badgeText="🏷️ WHOLESALE INVOICES"
          badgeIcon="receipt"
        />
        <View style={{ padding: 16 }}>
          <SkeletonOrderList count={4} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="B2B Purchase Invoices"
        subtitle="Track wholesale orders, dispatches & GST invoices"
        badgeText="🏷️ WHOLESALE INVOICES"
        badgeIcon="receipt"
        rightAction={
          <TouchableOpacity
            style={s.headerRefreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* Filter Chips Bar */}
      <View style={[s.filterBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {STATUS_FILTERS.map(f => {
            const active = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  s.filterChip,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
                  active && { backgroundColor: isDark ? theme.accent : "#0a2540" }
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    s.filterChipText,
                    { color: theme.textMuted },
                    active && { color: "#ffffff", fontWeight: "800" }
                  ]}
                >
                  {f} {f === "All" ? `(${orders.length})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00b4d8" />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIconWrap, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
              <MaterialIcons name="inventory" size={48} color="#00b4d8" />
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>
              {activeFilter === "All" ? "No wholesale orders yet" : `No ${activeFilter.toLowerCase()} orders`}
            </Text>
            <Text style={[s.emptyBody, { color: theme.textMuted }]}>
              Bulk purchase orders and GST invoices will be recorded here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = statusColor(item.status);
          return (
            <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={s.cardHeader}>
                <View>
                  <View style={s.orderIdRow}>
                    <Text style={[s.orderId, { color: theme.text }]}>
                      Invoice #{item.id.slice(-6).toUpperCase()}
                    </Text>
                    <View style={[s.typeChip, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
                      <Text style={[s.typeText, { color: "#2563eb" }]}>B2B WHOLESALE</Text>
                    </View>
                  </View>
                  <Text style={[s.date, { color: theme.textMuted }]}>{formatDate(item.createdAt)}</Text>
                </View>

                <View style={[s.statusChip, { backgroundColor: color + "20", borderColor: color + "40" }]}>
                  <View style={[s.statusDot, { backgroundColor: color }]} />
                  <Text style={[s.statusText, { color }]}>{(item.status || "confirmed").toUpperCase()}</Text>
                </View>
              </View>

              <View style={[s.divider, { backgroundColor: theme.border }]} />

              <View style={s.itemsSection}>
                {item.items?.map((it, idx) => (
                  <View key={idx} style={s.itemRow}>
                    <Text style={[s.itemName, { color: theme.text }]} numberOfLines={1}>
                      • {it.name}
                    </Text>
                    <Text style={[s.itemDetail, { color: theme.textMuted }]}>
                      {it.qty} pcs @ {formatPrice(it.price)} = {formatPrice(it.price * it.qty)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[s.cardFooter, { borderTopColor: theme.border }]}>
                <View>
                  <Text style={[s.totalLabel, { color: theme.textMuted }]}>Invoice Total (incl. GST)</Text>
                  <Text style={s.totalValue}>{formatPrice(item.total)}</Text>
                </View>

                <TouchableOpacity
                  style={s.invoiceBtn}
                  onPress={() => handleOpenInvoice(item)}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="receipt" size={16} color="#00b4d8" style={{ marginRight: 6 }} />
                  <Text style={s.invoiceBtnText}>GST Invoice</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <InvoicePreviewModal
        key={selectedOrder?.id || "dealer-invoice"}
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
  filterChipText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  list: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
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
  typeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  statusChip: {
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
  divider: {
    height: 1,
    marginVertical: 12,
  },
  itemsSection: {
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  itemDetail: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#00b4d8",
    marginTop: 2,
  },
  invoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 180, 216, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 180, 216, 0.3)",
  },
  invoiceBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#00b4d8",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
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
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13.5,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
});
