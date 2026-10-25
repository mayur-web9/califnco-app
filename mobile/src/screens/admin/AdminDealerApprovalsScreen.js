import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useTheme } from "../../hooks/useTheme";
import ScreenHeader from "../../components/ScreenHeader";

export default function AdminDealerApprovalsScreen() {
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "approved"
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDealers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["Dealer", "dealer"])
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setDealers(list);
    } catch (err) {
      console.warn("Error fetching dealers:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleUpdateStatus = (dealer, newStatus) => {
    const actionName = newStatus === "approved" ? "Approve" : "Reject";
    Alert.alert(
      `${actionName} Dealer Application?`,
      `Are you sure you want to set ${dealer.displayName || dealer.name || dealer.email} to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionName,
          style: newStatus === "approved" ? "default" : "destructive",
          onPress: async () => {
            setUpdatingId(dealer.uid);
            try {
              await updateDoc(doc(db, "users", dealer.uid), {
                dealerStatus: newStatus,
                reviewedAt: serverTimestamp()
              });
              Alert.alert("Success", `Dealer application marked as ${newStatus}.`);
              fetchDealers();
            } catch (err) {
              Alert.alert("Update Failed", err.message);
            } finally {
              setUpdatingId(null);
            }
          }
        }
      ]
    );
  };

  const filtered = dealers.filter(d => {
    const status = (d.dealerStatus || "pending").toLowerCase();
    return activeTab === "pending" ? status === "pending" : status === "approved";
  });

  const pendingCount = dealers.filter(d => (d.dealerStatus || "pending").toLowerCase() === "pending").length;
  const approvedCount = dealers.filter(d => (d.dealerStatus || "").toLowerCase() === "approved").length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Dealer Applications"
        subtitle="Verify trade credentials & wholesale access"
        badgeText="👑 DEALER LICENSES"
        badgeIcon="badge"
        rightAction={
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={() => {
              setRefreshing(true);
              fetchDealers();
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* Modern Pill Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.tabPillContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }]}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === "pending" && { backgroundColor: isDark ? theme.accent : "#0a2540" }]}
            onPress={() => setActiveTab("pending")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="hourglass-top"
              size={15}
              color={activeTab === "pending" ? "#ffffff" : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabPillText,
                { color: activeTab === "pending" ? "#ffffff" : theme.textMuted },
                activeTab === "pending" && { fontWeight: "800" }
              ]}
            >
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === "approved" && { backgroundColor: isDark ? theme.accent : "#0a2540" }]}
            onPress={() => setActiveTab("approved")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="verified"
              size={15}
              color={activeTab === "approved" ? "#ffffff" : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabPillText,
                { color: activeTab === "approved" ? "#ffffff" : theme.textMuted },
                activeTab === "approved" && { fontWeight: "800" }
              ]}
            >
              Approved ({approvedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#00b4d8" />
          <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading dealer applications...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "#162a45" : "#e0f2fe" }]}>
            <MaterialIcons name="done-all" size={48} color="#00b4d8" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {activeTab === "pending" ? "No Pending Applications" : "No Approved Partners Yet"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {activeTab === "pending"
              ? "All commercial dealer accounts have been evaluated."
              : "Review pending applications above to activate wholesale partner accounts."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.uid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDealers();
              }}
              tintColor="#00b4d8"
            />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View style={[styles.dealerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.dealerHeader}>
                <View style={[styles.avatar, { backgroundColor: activeTab === "pending" ? "rgba(217, 119, 6, 0.12)" : "rgba(16, 185, 129, 0.12)" }]}>
                  <MaterialIcons
                    name={activeTab === "pending" ? "storefront" : "verified"}
                    size={24}
                    color={activeTab === "pending" ? "#d97706" : "#10b981"}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.dealerName, { color: theme.text }]}>
                    {item.displayName || item.name || "Commercial Dealer"}
                  </Text>
                  <Text style={[styles.dealerEmail, { color: theme.textMuted }]}>{item.email}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: activeTab === "pending" ? "rgba(217, 119, 6, 0.12)" : "rgba(16, 185, 129, 0.12)" }]}>
                  <Text style={[styles.statusChipText, { color: activeTab === "pending" ? "#d97706" : "#10b981" }]}>
                    {activeTab === "pending" ? "PENDING" : "APPROVED"}
                  </Text>
                </View>
              </View>

              <View style={[styles.detailsBox, { borderTopColor: theme.border }]}>
                {item.phone && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="phone" size={15} color="#00b4d8" />
                    <Text style={[styles.detailText, { color: theme.text }]}>{item.phone}</Text>
                  </View>
                )}
                {item.address?.line1 ? (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="place" size={15} color="#00b4d8" />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {item.address.line1}, {item.address.city || ""}, {item.address.state || ""} {item.address.pincode || ""}
                    </Text>
                  </View>
                ) : null}
              </View>

              {activeTab === "pending" && (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.rejectBtn]}
                    disabled={updatingId === item.uid}
                    onPress={() => handleUpdateStatus(item, "rejected")}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="close" size={16} color="#dc2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.approveBtn]}
                    disabled={updatingId === item.uid}
                    onPress={() => handleUpdateStatus(item, "approved")}
                    activeOpacity={0.8}
                  >
                    {updatingId === item.uid ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={16} color="#fff" />
                        <Text style={styles.approveBtnText}>Approve B2B Partner</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  dealerCard: {
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
  dealerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dealerName: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  dealerEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  detailsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12.5,
    marginLeft: 8,
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
  },
  rejectBtn: {
    backgroundColor: "#fee2e2",
  },
  rejectBtnText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  approveBtn: {
    backgroundColor: "#16a34a",
  },
  approveBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
});
