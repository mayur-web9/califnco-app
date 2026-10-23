import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, FlatList, RefreshControl
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { createServiceBooking, getUserServiceBookings } from "../../services/serviceBookingService";
import { formatDate, statusColor } from "../../utils/formatPrice";
import colors from "../../constants/colors";

export default function ServiceBookingScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState("new"); // "new" | "history"
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    phone: profile?.phone || "",
    address: profile?.address ? `${profile.address.line1}, ${profile.address.city}` : "",
    issue: ""
  });

  const loadBookings = useCallback(async () => {
    if (!profile) return;
    const data = await getUserServiceBookings(profile.uid);
    setBookings(data);
  }, [profile]);

  useEffect(() => {
    if (tab === "history") loadBookings().finally(() => setLoading(false));
  }, [tab, loadBookings]);

  async function handleSubmit() {
    if (!form.phone.trim() || !form.address.trim() || !form.issue.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await createServiceBooking({
        userId: profile.uid,
        userName: profile.name,
        phone: form.phone.trim(),
        address: form.address.trim(),
        issue: form.issue.trim()
      });
      setForm(f => ({ ...f, issue: "" }));
      Alert.alert("Booking Submitted", "Your service request has been received. Our team will contact you within 24 hours.");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      {/* Tab switcher */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === "new" && s.tabActive]} onPress={() => setTab("new")}>
          <Text style={[s.tabText, tab === "new" && s.tabTextActive]}>Book Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "history" && s.tabActive]} onPress={() => setTab("history")}>
          <Text style={[s.tabText, tab === "history" && s.tabTextActive]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      {tab === "new" ? (
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.cardTitle}>Request a Service Visit</Text>
            <Text style={s.label}>Contact Number</Text>
            <TextInput style={s.input} value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="+919876543210" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />

            <Text style={s.label}>Service Address</Text>
            <TextInput style={[s.input, s.multiline]} value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Full address with pincode" placeholderTextColor={colors.textMuted} multiline numberOfLines={2} />

            <Text style={s.label}>Describe the Issue</Text>
            <TextInput style={[s.input, s.multiline, { height: 100 }]} value={form.issue} onChangeText={v => setForm(f => ({ ...f, issue: v }))} placeholder="e.g. Water purifier not dispensing water, making noise, filter change needed..." placeholderTextColor={colors.textMuted} multiline numberOfLines={4} />

            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadBookings(); setRefreshing(false); }} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔧</Text>
              <Text style={s.emptyTitle}>No service bookings yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.bookingCard}>
              <View style={s.bookingHeader}>
                <Text style={s.bookingId}>#{item.id.slice(-6).toUpperCase()}</Text>
                <View style={[s.statusChip, { backgroundColor: statusColor(item.status) + "22" }]}>
                  <Text style={[s.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.bookingIssue} numberOfLines={2}>{item.issue}</Text>
              <Text style={s.bookingDate}>{formatDate(item.createdAt)}</Text>
              {item.notes ? <Text style={s.bookingNotes}>Admin note: {item.notes}</Text> : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: "row", backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  form: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, marginBottom: 14, backgroundColor: colors.background },
  multiline: { textAlignVertical: "top" },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", paddingTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: colors.textSecondary },
  bookingCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  bookingId: { fontSize: 13, fontWeight: "700", color: colors.text },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  bookingIssue: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  bookingDate: { fontSize: 12, color: colors.textMuted },
  bookingNotes: { fontSize: 12, color: colors.accent, marginTop: 6, fontStyle: "italic" }
});
