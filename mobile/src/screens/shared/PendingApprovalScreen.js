import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { logout } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import colors from "../../constants/colors";

export default function PendingApprovalScreen() {
  const { profile, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  async function handleCheckStatus() {
    setChecking(true);
    try {
      await refreshProfile();
      Alert.alert("Status Refreshed", "Your account status has been checked with the Califnco server.");
    } catch (err) {
      Alert.alert("Notice", err.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.iconWrap}>
        <MaterialIcons name="hourglass-top" size={44} color="#d97706" />
      </View>
      <Text style={s.title}>Wholesale Application Pending</Text>
      <Text style={s.body}>
        Your commercial B2B dealer registration has been submitted and is currently under review by the Califnco operations desk.
      </Text>

      {/* 4-Step Verification Stepper */}
      <View style={s.stepperBox}>
        <Text style={s.stepperTitle}>Verification & Activation Steps</Text>

        <View style={s.stepRow}>
          <MaterialIcons name="check-circle" size={20} color="#16a34a" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.stepName}>1. Account Registered</Text>
            <Text style={s.stepDesc}>Profile and credentials created in Califnco system.</Text>
          </View>
        </View>

        <View style={s.stepRow}>
          <MaterialIcons name="radio-button-checked" size={20} color="#d97706" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.stepName}>2. Admin Review (Current Step)</Text>
            <Text style={s.stepDesc}>Evaluating business details, regional territory, and GST.</Text>
          </View>
        </View>

        <View style={s.stepRow}>
          <MaterialIcons name="radio-button-unchecked" size={20} color="#9ca3af" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.stepName}>3. Wholesale Pricing Tier Unlocked</Text>
            <Text style={s.stepDesc}>20% to 35% discount margin applied to all 52 products.</Text>
          </View>
        </View>

        <View style={s.stepRow}>
          <MaterialIcons name="radio-button-unchecked" size={20} color="#9ca3af" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.stepName}>4. B2B Bulk Order Dispatch Access</Text>
            <Text style={s.stepDesc}>Place wholesale bulk consignments with credit terms.</Text>
          </View>
        </View>
      </View>

      {/* Submitted Details Card */}
      <View style={s.card}>
        <Text style={s.cardHeader}>Applicant Details on File</Text>
        <Text style={s.cardItem}><Text style={s.bold}>Business Name: </Text>{profile?.displayName || profile?.name || "Kiran Enterprises"}</Text>
        <Text style={s.cardItem}><Text style={s.bold}>Email: </Text>{profile?.email || "dealer.pending@test.com"}</Text>
        {profile?.phone && <Text style={s.cardItem}><Text style={s.bold}>Phone: </Text>{profile.phone}</Text>}
        {profile?.address?.line1 && (
          <Text style={s.cardItem}><Text style={s.bold}>Address: </Text>{profile.address.line1}, {profile.address.city || ""}</Text>
        )}
      </View>

      <TouchableOpacity style={s.checkBtn} onPress={handleCheckStatus} disabled={checking}>
        {checking ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.checkBtnText}>Refresh Approval Status ⟳</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, alignItems: "center", padding: 24, paddingTop: 40 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8, textAlign: "center" },
  body: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  stepperBox: { width: "100%", backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  stepperTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  stepName: { fontSize: 12, fontWeight: "700", color: colors.text },
  stepDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  card: { width: "100%", backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 8, textTransform: "uppercase" },
  cardItem: { fontSize: 12, color: colors.text, marginBottom: 4 },
  bold: { fontWeight: "700" },
  checkBtn: { width: "100%", backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  checkBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  logoutBtn: { paddingVertical: 10, paddingHorizontal: 24 },
  logoutText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" }
});
