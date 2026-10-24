import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { logout } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { auth } from "../../config/firebase";
import colors from "../../constants/colors";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";

export default function PendingApprovalScreen() {
  const { profile, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [activating, setActivating] = useState(false);

  async function handleCheckStatus() {
    setChecking(true);
    try {
      await refreshProfile();
      Alert.alert("Status Refreshed", "If your account has been approved by admin, your wholesale portal will open automatically.");
    } catch (err) {
      Alert.alert("Notice", err.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleInstantActivateDemo() {
    setActivating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${SERVER_URL}/dealers/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId: profile?.uid })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not activate dealer account.");
      }
      await refreshProfile();
      Alert.alert("Dealer Mode Activated! ⚡", "Your dealer account is now approved. Entering the B2B Wholesale Portal.");
    } catch (err) {
      Alert.alert("Activation Notice", err.message);
    } finally {
      setActivating(false);
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
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Text style={s.icon}>⏳</Text>
      </View>
      <Text style={s.title}>Approval Pending</Text>
      <Text style={s.body}>
        Your dealer account has been registered and is awaiting admin approval.
        {"\n\n"}
        You will be notified once your account is approved. Wholesale prices and bulk ordering will activate immediately.
      </Text>

      <View style={s.infoBox}>
        <Text style={s.infoText}>What happens next?</Text>
        <Text style={s.infoItem}>• Admin reviews your dealer profile</Text>
        <Text style={s.infoItem}>• Tier-1 wholesale pricing unlocks across catalog</Text>
        <Text style={s.infoItem}>• Dedicated B2B bulk orders enabled</Text>
      </View>

      <TouchableOpacity style={s.checkBtn} onPress={handleCheckStatus} disabled={checking || activating}>
        {checking ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.checkBtnText}>Check Approval Status ⟳</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.demoBtn} onPress={handleInstantActivateDemo} disabled={checking || activating}>
        {activating ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={s.demoBtnText}>⚡ Instant Activate Dealer Mode (Demo/Test)</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 28 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  icon: { fontSize: 44 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 10 },
  body: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 22 },
  infoBox: { width: "100%", backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: colors.accent },
  infoText: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 8 },
  infoItem: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  checkBtn: { width: "100%", backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  checkBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  demoBtn: { width: "100%", backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 14 },
  demoBtnText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  logoutBtn: { paddingVertical: 10, paddingHorizontal: 24 },
  logoutText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" }
});
