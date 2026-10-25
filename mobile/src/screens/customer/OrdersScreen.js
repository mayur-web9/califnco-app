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

export default function OrdersScreen({ navigation }) {
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
          title="My Purchases & Orders"
          subtitle="Official tax invoices & warranty records"
          badgeText="💧 RETAIL ORDERS"
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
        title="My Purchases & Orders"
        subtitle="Official tax invoices & warranty records"
        badgeText="💧 RETAIL ORDERS"
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
              <MaterialIcons name="receipt-long" size={48} color="#00b4d8" />
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>
              {activeFilter === "All" ? "No purchases yet" : `No ${activeFilter.toLowerCase()} orders`}
            </Text>
            <Text style={[s.emptyBody, { color: theme.textMuted }]}>
              Your orders with tax invoice & warranty will be tracked here.
            </Text>
            <TouchableOpacity
              style={s.shopBtn}
              onPress={() => navigation.navigate("Catalog")}
              activeOpacity={0.85}
            >
              <MaterialIcons name="shopping-bag" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={s.shopBtnText}>Explore Purifiers</Text>
            </TouchableOpacity>
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
                      Order #{item.id.slice(-6).toUpperCase()}
                    </Text>
                    <View style={[s.typeChip, { backgroundColor: item.type === "bulk" ? "rgba(37, 99, 235, 0.12)" : "rgba(16, 185, 129, 0.12)" }]}>
                      <Text style={[s.typeText, { color: item.type === "bulk" ? "#2563eb" : "#10b981" }]}>
                        {item.type === "bulk" ? "WHOLESALE" : "RETAIL"}
                      </Text>
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
                {item.items?.slice(0, 2).map((i, idx) => (
                  <View key={idx} style={s.itemRow}>
                    <Text style={[s.itemName, { color: theme.text }]} numberOfLines={1}>
                      • {i.name}
                    </Text>
                    <Text style={[s.itemQtyPrice, { color: theme.textMuted }]}>
                      x{i.qty} ({formatPrice(i.price * i.qty)})
                    </Text>
                  </View>
                ))}
                {item.items?.length > 2 && (
                  <Text style={[s.moreItems, { color: theme.textMuted }]}>
                    +{item.items.length - 2} more item{item.items.length - 2 !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>

              <View style={[s.cardFooter, { borderTopColor: theme.border }]}>
                <View>
                  <Text style={[s.totalLabel, { color: theme.textMuted }]}>Total Amount</Text>
                  <Text style={s.totalValue}>{formatPrice(item.total)}</Text>
                </View>

                <TouchableOpacity
                  style={s.viewInvoiceBtn}
                  onPress={() => handleOpenInvoice(item)}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="receipt" size={16} color="#00b4d8" style={{ marginRight: 6 }} />
                  <Text style={s.viewInvoiceBtnText}>Tax Invoice</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Invoice / Receipt Modal */}
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
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  itemQtyPrice: {
    fontSize: 12.5,
  },
  moreItems: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
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
  viewInvoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 180, 216, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 180, 216, 0.3)",
  },
  viewInvoiceBtnText: {
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
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 13,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  shopBtnText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "800",
  },
});
