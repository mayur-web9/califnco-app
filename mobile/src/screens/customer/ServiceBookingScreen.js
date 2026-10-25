import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, FlatList, RefreshControl
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { createServiceBooking, getUserServiceBookings } from "../../services/serviceBookingService";
import { formatDate, statusColor } from "../../utils/formatPrice";
import ScreenHeader from "../../components/ScreenHeader";
import { SkeletonServiceItem } from "../../components/Skeleton";
import SuccessModal from "../../components/SuccessModal";

export default function ServiceBookingScreen() {
  const { profile } = useAuth();
  const { theme, isDark } = useTheme();
  const [tab, setTab] = useState("new"); // "new" | "history"
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState("");
  const [form, setForm] = useState({
    phone: profile?.phone || "",
    address: profile?.address ? `${profile.address.line1}, ${profile.address.city}` : "",
    issue: ""
  });

  const loadBookings = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await getUserServiceBookings(profile.uid);
      setBookings(data);
    } catch (err) {
      console.warn("Failed to fetch bookings:", err.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (tab === "history") loadBookings();
  }, [tab, loadBookings]);

  async function handleSubmit() {
    if (!form.phone.trim() || !form.address.trim() || !form.issue.trim()) {
      Alert.alert("Missing Details", "Please fill in contact phone, address, and issue description.");
      return;
    }
    setLoading(true);
    try {
      const result = await createServiceBooking({
        userId: profile.uid,
        userName: profile.name || "Customer",
        phone: form.phone.trim(),
        address: form.address.trim(),
        issue: form.issue.trim()
      });
      const ticketId = result?.id || `SRV-${Date.now().toString().slice(-6)}`;
      setSubmittedTicketId(ticketId);
      setForm(f => ({ ...f, issue: "" }));
      setSuccessModalVisible(true);
    } catch (err) {
      Alert.alert("Booking Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Service & Maintenance"
        subtitle="Doorstep filter replacement & water care"
        badgeText="💧 RETAIL SERVICE"
        badgeIcon="build"
        rightAction={
          <View style={s.headerBadgeWrap}>
            <MaterialIcons name="support-agent" size={20} color="#00b4d8" />
          </View>
        }
      />

      {/* Modern Pill Switcher */}
      <View style={[s.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[s.tabPillContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }]}>
          <TouchableOpacity
            style={[s.tabPill, tab === "new" && { backgroundColor: isDark ? theme.accent : "#0a2540" }]}
            onPress={() => setTab("new")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={16}
              color={tab === "new" ? "#ffffff" : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[s.tabPillText, { color: tab === "new" ? "#ffffff" : theme.textMuted }, tab === "new" && { fontWeight: "800" }]}>
              Request Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tabPill, tab === "history" && { backgroundColor: isDark ? theme.accent : "#0a2540" }]}
            onPress={() => setTab("history")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="history"
              size={16}
              color={tab === "history" ? "#ffffff" : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[s.tabPillText, { color: tab === "history" ? "#ffffff" : theme.textMuted }, tab === "history" && { fontWeight: "800" }]}>
              My Requests {bookings.length > 0 ? `(${bookings.length})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === "new" ? (
        <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
          <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={s.cardHeaderRow}>
              <View style={s.cardIconWrap}>
                <MaterialIcons name="water-damage" size={20} color="#00b4d8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: theme.text }]}>Schedule a Visit</Text>
                <Text style={[s.cardSubtitle, { color: theme.textMuted }]}>
                  Certified Califnco technician will service your RO purifier
                </Text>
              </View>
            </View>

            <View style={[s.divider, { backgroundColor: theme.border }]} />

            {/* Phone */}
            <Text style={[s.label, { color: theme.text }]}>Contact Phone Number *</Text>
            <View style={[s.inputWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border }]}>
              <MaterialIcons name="phone" size={18} color="#00b4d8" style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                value={form.phone}
                onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                placeholder="+91 98765 43210"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Address */}
            <Text style={[s.label, { color: theme.text, marginTop: 14 }]}>Service Address *</Text>
            <View style={[s.inputWrap, s.multilineWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border }]}>
              <MaterialIcons name="location-on" size={18} color="#00b4d8" style={[s.inputIcon, { marginTop: 12 }]} />
              <TextInput
                style={[s.input, s.multilineInput, { color: theme.text }]}
                value={form.address}
                onChangeText={v => setForm(f => ({ ...f, address: v }))}
                placeholder="House/Flat No., Apartment, Street, City & Pincode"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Issue Description */}
            <Text style={[s.label, { color: theme.text, marginTop: 14 }]}>Describe Issue or Service Needed *</Text>
            <View style={[s.inputWrap, s.multilineWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border, height: 110 }]}>
              <MaterialIcons name="edit-note" size={20} color="#00b4d8" style={[s.inputIcon, { marginTop: 12 }]} />
              <TextInput
                style={[s.input, s.multilineInput, { color: theme.text, height: 95 }]}
                value={form.issue}
                onChangeText={v => setForm(f => ({ ...f, issue: v }))}
                placeholder="e.g. Water taste issue, filter replacement needed, membrane flashing light, low water pressure..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* SLA notice */}
            <View style={s.slaBox}>
              <MaterialIcons name="bolt" size={16} color="#00b4d8" style={{ marginRight: 6 }} />
              <Text style={s.slaText}>Same-day visit guaranteed for bookings before 2:00 PM</Text>
            </View>

            <TouchableOpacity
              style={s.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="calendar-month" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={s.submitText}>Confirm Booking Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonServiceItem />
          <SkeletonServiceItem />
          <SkeletonServiceItem />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadBookings();
                setRefreshing(false);
              }}
              tintColor="#00b4d8"
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIconWrap, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
                <MaterialIcons name="handyman" size={48} color="#00b4d8" />
              </View>
              <Text style={[s.emptyTitle, { color: theme.text }]}>No service requests yet</Text>
              <Text style={[s.emptyBody, { color: theme.textMuted }]}>
                Your scheduled filter replacements and doorstep service visits will be tracked here.
              </Text>
              <TouchableOpacity
                style={s.bookFirstBtn}
                onPress={() => setTab("new")}
                activeOpacity={0.85}
              >
                <Text style={s.bookFirstBtnText}>Book Your First Service</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const color = statusColor(item.status);
            return (
              <View style={[s.bookingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={s.bookingHeader}>
                  <View>
                    <Text style={[s.bookingId, { color: theme.text }]}>
                      Ticket #{item.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={[s.bookingDate, { color: theme.textMuted }]}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[s.statusChip, { backgroundColor: color + "20", borderColor: color + "40" }]}>
                    <View style={[s.statusDot, { backgroundColor: color }]} />
                    <Text style={[s.statusText, { color }]}>{(item.status || "pending").toUpperCase()}</Text>
                  </View>
                </View>

                <View style={[s.divider, { backgroundColor: theme.border }]} />

                <Text style={[s.bookingIssue, { color: theme.text }]}>{item.issue}</Text>

                {item.address ? (
                  <View style={s.addressRow}>
                    <MaterialIcons name="location-on" size={14} color={theme.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[s.addressText, { color: theme.textMuted }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                ) : null}

                {item.notes ? (
                  <View style={s.notesBox}>
                    <MaterialIcons name="info" size={14} color="#00b4d8" style={{ marginRight: 6 }} />
                    <Text style={s.bookingNotes}>Technician Update: {item.notes}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="Service Visit Booked! 🛠️"
        subtitle="Your request has been registered. Our certified technician will contact you within 24 hours to schedule the doorstep visit."
        referenceNumber={submittedTicketId}
        referenceLabel="Service Ticket ID"
        primaryBtnText="View My Bookings"
        onPrimaryPress={() => {
          setSuccessModalVisible(false);
          setTab("history");
        }}
        secondaryBtnText="Done"
        onSecondaryPress={() => setSuccessModalVisible(false)}
        iconName="engineering"
        iconColor="#0284c7"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerBadgeWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 180, 216, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabPillContainer: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 20,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  formScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 180, 216, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  multilineWrap: {
    alignItems: "flex-start",
    height: 70,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  multilineInput: {
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  slaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 180, 216, 0.08)",
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  slaText: {
    fontSize: 12,
    color: "#00b4d8",
    fontWeight: "600",
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00b4d8",
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  list: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  bookingCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookingId: {
    fontSize: 15,
    fontWeight: "800",
  },
  bookingDate: {
    fontSize: 12,
    marginTop: 2,
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
  bookingIssue: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    flex: 1,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 180, 216, 0.08)",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  bookingNotes: {
    fontSize: 12,
    color: "#00b4d8",
    fontWeight: "600",
    flex: 1,
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
  bookFirstBtn: {
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  bookFirstBtnText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "800",
  },
});
