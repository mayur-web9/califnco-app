import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { logout } from "../../services/authService";
import colors from "../../constants/colors";

export default function PendingApprovalScreen() {
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
        You will be notified once your account is approved. This usually takes 1 business day.
      </Text>
      <View style={s.infoBox}>
        <Text style={s.infoText}>What happens next?</Text>
        <Text style={s.infoItem}>• Admin reviews your application</Text>
        <Text style={s.infoItem}>• You receive a push notification on approval</Text>
        <Text style={s.infoItem}>• Wholesale prices become visible immediately</Text>
      </View>
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 32 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 12 },
  body: { fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  infoBox: { width: "100%", backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 28, borderLeftWidth: 4, borderLeftColor: colors.accent },
  infoText: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
  infoItem: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  logoutBtn: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  logoutText: { fontSize: 15, color: colors.textSecondary, fontWeight: "600" }
});
