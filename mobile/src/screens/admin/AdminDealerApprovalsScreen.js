import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useTheme } from "../../hooks/useTheme";

export default function AdminDealerApprovalsScreen() {
  const { theme } = useTheme();

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
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "pending" && [styles.activeTabBtn, { backgroundColor: theme.primary }]]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, { color: activeTab === "pending" ? "#fff" : theme.textMuted }]}>
            Pending Review ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "approved" && [styles.activeTabBtn, { backgroundColor: theme.primary }]]}
          onPress={() => setActiveTab("approved")}
        >
          <Text style={[styles.tabText, { color: activeTab === "approved" ? "#fff" : theme.textMuted }]}>
            Approved Partners ({approvedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading dealer applications...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialIcons name="done-all" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {activeTab === "pending" ? "No Pending Applications" : "No Approved Partners Yet"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {activeTab === "pending"
              ? "All dealer accounts are currently reviewed."
              : "Review pending applications to activate wholesale accounts."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.uid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDealers(); }} tintColor={theme.accent} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[styles.dealerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.dealerHeader}>
                <View style={[styles.avatar, { backgroundColor: activeTab === "pending" ? "#fef3c7" : "#dcfce7" }]}>
                  <MaterialIcons
                    name={activeTab === "pending" ? "storefront" : "verified"}
                    size={24}
                    color={activeTab === "pending" ? "#b45309" : "#16a34a"}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.dealerName, { color: theme.text }]}>
                    {item.displayName || item.name || "Commercial Dealer"}
                  </Text>
                  <Text style={[styles.dealerEmail, { color: theme.textMuted }]}>{item.email}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: activeTab === "pending" ? "#fffbeb" : "#f0fdf4" }]}>
                  <Text style={[styles.statusChipText, { color: activeTab === "pending" ? "#b45309" : "#16a34a" }]}>
                    {activeTab === "pending" ? "PENDING" : "APPROVED"}
                  </Text>
                </View>
              </View>

              <View style={[styles.detailsBox, { borderColor: theme.border }]}>
                {item.phone && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="phone" size={16} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.text }]}>{item.phone}</Text>
                  </View>
                )}
                {item.address?.line1 ? (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="place" size={16} color={theme.textMuted} />
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
                  >
                    <MaterialIcons name="close" size={16} color="#dc2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.approveBtn]}
                    disabled={updatingId === item.uid}
                    onPress={() => handleUpdateStatus(item, "approved")}
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
  tabBar: { flexDirection: "row", padding: 8, margin: 16, marginBottom: 0, borderRadius: 12, borderWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTabBtn: {},
  tabText: { fontSize: 13, fontWeight: "700" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 12 },
  emptySubtitle: { fontSize: 12, textAlign: "center", marginTop: 4, lineHeight: 18 },
  dealerCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  dealerHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dealerName: { fontSize: 15, fontWeight: "800" },
  dealerEmail: { fontSize: 12, marginTop: 2 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusChipText: { fontSize: 10, fontWeight: "800" },
  detailsBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  detailText: { fontSize: 12, marginLeft: 8, flex: 1 },
  actionButtonsRow: { flexDirection: "row", marginTop: 14, gap: 10 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8 },
  rejectBtn: { backgroundColor: "#fee2e2" },
  rejectBtnText: { color: "#dc2626", fontSize: 13, fontWeight: "700", marginLeft: 4 },
  approveBtn: { backgroundColor: "#16a34a" },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 4 }
});
