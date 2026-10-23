import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { getUserOrders } from "../../services/orderService";
import { formatPrice, formatDate, statusColor } from "../../utils/formatPrice";
import colors from "../../constants/colors";

export default function OrdersScreen({ navigation }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      style={s.container}
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
            <View style={[s.statusChip, { backgroundColor: statusColor(item.status) + "22" }]}>
              <Text style={[s.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
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
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{formatPrice(item.total)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontWeight: "700", color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  moreItems: { fontSize: 12, color: colors.textMuted, marginBottom: 4, fontStyle: "italic" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  totalValue: { fontSize: 16, fontWeight: "800", color: colors.primary },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 64 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24 },
  shopBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  shopBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" }
});
