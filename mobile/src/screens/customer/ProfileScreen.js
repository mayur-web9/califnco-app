import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Share, Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";
import Skeleton from "../../components/Skeleton";
import colors from "../../constants/colors";

export default function ProfileScreen({ navigation }) {
  const { profile, refreshProfile } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    line1: profile?.address?.line1 || "",
    city: profile?.address?.city || "",
    state: profile?.address?.state || "",
    pincode: profile?.address?.pincode || ""
  });

  const referralCode = profile?.referralCode || `CALIF-${(profile?.name || "VIP").replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase()}${String(profile?.uid || "892").slice(-3).toUpperCase()}`;

  async function handleShareReferral() {
    try {
      await Share.share({
        message: `💧 Drink clean, pure water! Use my referral code ${referralCode} to get ₹500 off your Califnco smart RO purifier or filter maintenance booking!\n\nJoin here: https://califnco-app.onrender.com`,
        title: "Califnco ₹500 Referral Reward",
      });
    } catch (_) {}
  }

  function handleCopyReferral() {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    Alert.alert("Code Copied! 🎉", `Referral code "${referralCode}" copied. Share with friends to earn ₹500 per successful order.`);
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: {
          line1: form.line1.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim()
        }
      });
      await refreshProfile();
      setEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => logout() }
    ]);
  }

  if (!profile) {
    return (
      <ScrollView style={[s.container, { backgroundColor: theme.background }]} contentContainerStyle={s.content}>
        <View style={[s.avatarWrap, { backgroundColor: isDark ? theme.card : "#0a2540", alignItems: "center" }]}>
          <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
          <Skeleton width={140} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={18} borderRadius={10} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={14} borderRadius={6} />
        </View>
        <View style={{ padding: 16, gap: 14 }}>
          <Skeleton width="100%" height={80} borderRadius={14} />
          <Skeleton width="100%" height={160} borderRadius={14} />
        </View>
      </ScrollView>
    );
  }

  const initials = (profile?.name || "Mayur Patil")
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.background }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* 1. Circular Avatar Profile Hero (Screen 13) */}
      <View style={[s.avatarWrap, { backgroundColor: isDark ? theme.card : "#0a2540" }]}>
        <View style={s.avatarRing}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        </View>
        <Text style={s.profileName}>{profile?.name || "Mayur Patil"}</Text>
        <Text style={s.profileEmail}>{profile?.email || "mayur@example.com"}</Text>

        <View style={s.roleBadgeRow}>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>
              {profile?.role === "Admin" ? "👑 EXECUTIVE ADMIN" : profile?.role === "Dealer" ? "🏷️ WHOLESALE DEALER" : "💧 RETAIL CONSUMER"}
            </Text>
          </View>
          {profile?.role === "Dealer" && (
            <View style={[s.roleBadge, { backgroundColor: profile?.dealerStatus === "approved" ? "#dcfce7" : "#fef3c7" }]}>
              <Text style={[s.roleText, { color: profile?.dealerStatus === "approved" ? "#16a34a" : "#b45309" }]}>
                {profile?.dealerStatus === "approved" ? "✓ APPROVED PARTNER" : "⏳ PENDING REVIEW"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Menu Navigation Items List (Screen 13) */}
      <View style={[s.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={s.menuRow}
          onPress={() => navigation?.navigate ? navigation.navigate("Orders") : null}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="receipt-long" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>My Orders</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          style={s.menuRow}
          onPress={() => setEditing(!editing)}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="location-on" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>Delivery Addresses</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          style={s.menuRow}
          onPress={() => Alert.alert("Payment Methods", "Califnco supports UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards, and Cash on Delivery.")}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="payment" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>Payment Methods</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          style={s.menuRow}
          onPress={() => Alert.alert("Notifications", "You are subscribed to push notifications for live order updates, technician dispatches, and seasonal offers.")}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="notifications-none" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          style={s.menuRow}
          onPress={() => Alert.alert("Help & Support", "Califnco 24/7 Helpline: 1800-267-9000\nEmail: support@califnco.com\nTechnician Support: 9:00 AM - 8:00 PM IST")}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="headset-mic" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>Help & Support</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          style={s.menuRow}
          onPress={() => Alert.alert("About Califnco", "Califnco: Pure Water, Better Life.\nLeading provider of multi-stage RO, UV & UF smart purifiers with door-step IoT maintenance.\nApp Version 1.0.0")}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="info-outline" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>About Us</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 3. Settings Card: Theme Preference / Dark Mode (Screen 20) */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.themeRow}>
          <View style={s.themeInfo}>
            <View style={s.themeTitleRow}>
              <MaterialIcons
                name={isDark ? "dark-mode" : "light-mode"}
                size={22}
                color="#00b4d8"
              />
              <Text style={[s.cardTitle, { color: theme.text, marginLeft: 8 }]}>Theme</Text>
            </View>
            <Text style={[s.themeSubtext, { color: theme.textSecondary }]}>
              {isDark ? "Dark Mode (Obsidian Navy)" : "Light Mode (Day Ocean)"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#cbd5e1", true: "#00b4d8" }}
            thumbColor={isDark ? "#ffffff" : "#f8fafc"}
          />
        </View>
      </View>

      {/* 4. Referral & Rewards Program Card */}
      <View style={[s.card, s.referralCard, { backgroundColor: isDark ? "#0c2340" : "#f0fdf4", borderColor: isDark ? "#1e40af" : "#bbf7d0" }]}>
        <View style={s.referralHeader}>
          <View style={[s.referralIconWrap, { backgroundColor: isDark ? "#1e293b" : "#dcfce7" }]}>
            <MaterialIcons name="card-giftcard" size={24} color={isDark ? "#38bdf8" : "#16a34a"} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.referralTitle, { color: isDark ? "#f8fafc" : "#14532d" }]}>Refer & Earn ₹500</Text>
            <Text style={[s.referralSubtitle, { color: isDark ? "#94a3b8" : "#166534" }]}>
              Give friends ₹500 off. Get ₹500 store credits on their first order.
            </Text>
          </View>
        </View>

        {/* Code Box */}
        <View style={[s.codeBox, { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#334155" : "#cbd5e1" }]}>
          <View>
            <Text style={[s.codeLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>YOUR INVITE CODE</Text>
            <Text style={[s.codeText, { color: isDark ? "#38bdf8" : "#0284c7" }]}>{referralCode}</Text>
          </View>
          <TouchableOpacity style={[s.copyBtn, { backgroundColor: isDark ? "#1e293b" : "#e0f2fe" }]} onPress={handleCopyReferral} activeOpacity={0.75}>
            <MaterialIcons name={copiedCode ? "check" : "content-copy"} size={16} color={isDark ? "#38bdf8" : "#0369a1"} />
            <Text style={[s.copyBtnText, { color: isDark ? "#38bdf8" : "#0369a1" }]}>{copiedCode ? "Copied" : "Copy"}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        <View style={s.referralActions}>
          <TouchableOpacity style={[s.shareInviteBtn, { backgroundColor: "#00b4d8" }]} onPress={handleShareReferral} activeOpacity={0.8}>
            <MaterialIcons name="share" size={17} color="#ffffff" />
            <Text style={s.shareInviteBtnText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Address Details Form (Editable on Demand) */}
      {editing && (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: theme.text }]}>Edit Personal Details</Text>
          </View>

          <Text style={[s.label, { color: theme.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.name}
            onChangeText={v => set("name", v)}
          />

          <Text style={[s.label, { color: theme.textSecondary }]}>Phone</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.phone}
            onChangeText={v => set("phone", v)}
            keyboardType="phone-pad"
          />

          <Text style={[s.label, { color: theme.textSecondary }]}>Address</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.line1}
            onChangeText={v => set("line1", v)}
            placeholder="Street / Flat no."
            placeholderTextColor={theme.textMuted}
          />
          <TextInput
            style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.city}
            onChangeText={v => set("city", v)}
            placeholder="City"
            placeholderTextColor={theme.textMuted}
          />
          <TextInput
            style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.state}
            onChangeText={v => set("state", v)}
            placeholder="State"
            placeholderTextColor={theme.textMuted}
          />
          <TextInput
            style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.pincode}
            onChangeText={v => set("pincode", v)}
            placeholder="Pincode"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
          />

          <View style={s.editActions}>
            <TouchableOpacity style={[s.cancelBtn, { borderColor: theme.border }]} onPress={() => setEditing(false)}>
              <Text style={[s.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 6. Sign Out Button */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <MaterialIcons name="logout" size={18} color="#ef4444" style={{ marginRight: 6 }} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  avatarWrap: { alignItems: "center", paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: "#00b4d8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#0d2b4d",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 26, fontWeight: "900", color: "#00b4d8", letterSpacing: 1 },
  profileName: { fontSize: 22, fontWeight: "900", color: "#ffffff", letterSpacing: -0.3, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "rgba(255, 255, 255, 0.75)", marginBottom: 10 },
  roleBadgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  roleBadge: { backgroundColor: "rgba(0, 180, 216, 0.18)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { color: "#00b4d8", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  // Screen 13 Menu Card
  menuCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4 },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 180, 216, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  menuDivider: { height: 1, marginHorizontal: 4 },

  card: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, padding: 18, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  themeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  themeInfo: { flex: 1, paddingRight: 12 },
  themeTitleRow: { flexDirection: "row", alignItems: "center" },
  themeSubtext: { fontSize: 12, marginTop: 4 },
  referralCard: { borderWidth: 1.5 },
  referralHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  referralIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  referralTitle: { fontSize: 16, fontWeight: "800" },
  referralSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  codeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  codeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  codeText: { fontSize: 16, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { fontSize: 12, fontWeight: "700" },
  referralActions: { marginBottom: 4 },
  shareInviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 25 },
  shareInviteBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  editActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 25, height: 46, alignItems: "center", justifyContent: "center" },
  cancelText: { fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: "#00b4d8", borderRadius: 25, height: 46, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontWeight: "800" },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderRadius: 25,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { fontWeight: "800", fontSize: 15, color: "#ef4444" }
});
