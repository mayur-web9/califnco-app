import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { logout } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import ScreenHeader from "../../components/ScreenHeader";

export default function PendingApprovalScreen() {
  const { profile, refreshProfile } = useAuth();
  const { theme, isDark } = useTheme();
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
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Dealer Verification"
        subtitle="Wholesale commercial tier evaluation"
        badgeText="⏳ APPLICATION PENDING"
        badgeIcon="hourglass-top"
        badgeColor="#d97706"
        rightAction={
          <TouchableOpacity style={s.headerLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={17} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.centerCard}>
          <View style={[s.iconWrap, { backgroundColor: isDark ? "rgba(217, 119, 6, 0.18)" : "#fef3c7" }]}>
            <MaterialIcons name="hourglass-top" size={44} color="#d97706" />
          </View>
          <Text style={[s.title, { color: theme.text }]}>Commercial Verification Underway</Text>
          <Text style={[s.body, { color: theme.textMuted }]}>
            Your B2B trade account registration has been submitted and is undergoing credential verification by the Califnco operations team.
          </Text>
        </View>

        {/* 4-Step Verification Stepper */}
        <View style={[s.stepperBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[s.stepperTitle, { color: theme.text }]}>Activation Roadmap</Text>

          <View style={s.stepRow}>
            <MaterialIcons name="check-circle" size={20} color="#16a34a" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.stepName, { color: theme.text }]}>1. Account Registered</Text>
              <Text style={[s.stepDesc, { color: theme.textMuted }]}>Profile and business credentials recorded.</Text>
            </View>
          </View>

          <View style={s.stepRow}>
            <MaterialIcons name="radio-button-checked" size={20} color="#d97706" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.stepName, { color: theme.text }]}>2. Admin Review (Current Step)</Text>
              <Text style={[s.stepDesc, { color: theme.textMuted }]}>Verifying store territory, trade license, and GST.</Text>
            </View>
          </View>

          <View style={s.stepRow}>
            <MaterialIcons name="radio-button-unchecked" size={20} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.stepName, { color: theme.text }]}>3. Wholesale Pricing Tier Unlocked</Text>
              <Text style={[s.stepDesc, { color: theme.textMuted }]}>Access 20% to 35% commercial margin on full catalog.</Text>
            </View>
          </View>

          <View style={[s.stepRow, { marginBottom: 0 }]}>
            <MaterialIcons name="radio-button-unchecked" size={20} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.stepName, { color: theme.text }]}>4. Bulk Consignment Dispatch</Text>
              <Text style={[s.stepDesc, { color: theme.textMuted }]}>Place wholesale pallet consignments with tax invoices.</Text>
            </View>
          </View>
        </View>

        {/* Submitted Details Card */}
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[s.cardHeader, { color: "#00b4d8" }]}>Business Details On File</Text>
          <Text style={[s.cardItem, { color: theme.text }]}>
            <Text style={{ fontWeight: "700" }}>Business Name: </Text>
            {profile?.displayName || profile?.name || "Commercial Dealer"}
          </Text>
          <Text style={[s.cardItem, { color: theme.text }]}>
            <Text style={{ fontWeight: "700" }}>Email: </Text>
            {profile?.email || "dealer.pending@test.com"}
          </Text>
          {profile?.phone && (
            <Text style={[s.cardItem, { color: theme.text }]}>
              <Text style={{ fontWeight: "700" }}>Phone: </Text>
              {profile.phone}
            </Text>
          )}
          {profile?.address?.line1 && (
            <Text style={[s.cardItem, { color: theme.text }]}>
              <Text style={{ fontWeight: "700" }}>Location: </Text>
              {profile.address.line1}, {profile.address.city || ""}
            </Text>
          )}
        </View>

        <TouchableOpacity style={s.checkBtn} onPress={handleCheckStatus} disabled={checking} activeOpacity={0.85}>
          {checking ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={s.checkBtnText}>Check Approval Status</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  centerCard: {
    alignItems: "center",
    paddingVertical: 14,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  stepperBox: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepName: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardItem: {
    fontSize: 12.5,
    marginBottom: 6,
    lineHeight: 18,
  },
  checkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00b4d8",
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  checkBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
