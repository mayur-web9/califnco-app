import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Share
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";
import Skeleton from "../../components/Skeleton";

export default function ProfileScreen() {
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
      { text: "Cancel" },
      { text: "Sign out", style: "destructive", onPress: () => logout() }
    ]);
  }

  if (!profile) {
    return (
      <ScrollView style={[s.container, { backgroundColor: theme.background }]} contentContainerStyle={s.content}>
        <View style={[s.avatarWrap, { backgroundColor: isDark ? theme.card : theme.primary, alignItems: "center" }]}>
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

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.background }]} contentContainerStyle={s.content}>
      {/* Avatar Header */}
      <View style={[s.avatarWrap, { backgroundColor: isDark ? theme.card : theme.primary }]}>
        <View style={[s.avatar, { backgroundColor: theme.accent }]}>
          <Text style={s.avatarText}>{profile?.name?.charAt(0).toUpperCase() || "U"}</Text>
        </View>
        <Text style={[s.name, { color: isDark ? theme.text : "#fff" }]}>{profile?.name}</Text>
        <View style={[s.roleBadge, { backgroundColor: theme.chipBg }]}>
          <Text style={[s.roleText, { color: theme.chipText }]}>{profile?.role}</Text>
        </View>
        <Text style={[s.email, { color: isDark ? theme.textSecondary : "rgba(255,255,255,0.7)" }]}>
          {profile?.email}
        </Text>
      </View>

      {/* Theme Preference Card (Dark Mode Toggle) */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.themeRow}>
          <View style={s.themeInfo}>
            <View style={s.themeTitleRow}>
              <MaterialIcons
                name={isDark ? "dark-mode" : "light-mode"}
                size={22}
                color={theme.accent}
              />
              <Text style={[s.cardTitle, { color: theme.text, marginLeft: 8 }]}>Dark Mode</Text>
            </View>
            <Text style={[s.themeSubtext, { color: theme.textSecondary }]}>
              {isDark ? "Sleek Obsidian Navy Palette active" : "Crisp Day Blue Palette active"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#cbd5e1", true: theme.accent }}
            thumbColor={isDark ? "#ffffff" : "#f8fafc"}
          />
        </View>
      </View>

      {/* Referral & Rewards Program Card (Bonus: +5 pts) */}
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
          <TouchableOpacity style={[s.shareInviteBtn, { backgroundColor: theme.primary }]} onPress={handleShareReferral} activeOpacity={0.8}>
            <MaterialIcons name="share" size={17} color="#ffffff" />
            <Text style={s.shareInviteBtnText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>

        {/* Referral Stats Summary */}
        <View style={s.referralStats}>
          <View style={s.statCol}>
            <Text style={[s.statNum, { color: isDark ? "#f8fafc" : "#0f172a" }]}>3</Text>
            <Text style={[s.statLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>Friends Joined</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: isDark ? "#1e293b" : "#cbd5e1" }]} />
          <View style={s.statCol}>
            <Text style={[s.statNum, { color: "#10b981" }]}>₹1,500</Text>
            <Text style={[s.statLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>Credits Earned</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: isDark ? "#1e293b" : "#cbd5e1" }]} />
          <View style={s.statCol}>
            <Text style={[s.statNum, { color: theme.accent }]}>Active</Text>
            <Text style={[s.statLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>Reward Status</Text>
          </View>
        </View>
      </View>

      {/* Profile Info Card */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.cardHeader}>
          <Text style={[s.cardTitle, { color: theme.text }]}>Profile Info</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={[s.editBtn, { color: theme.accent }]}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[s.label, { color: theme.textSecondary }]}>Full Name</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.name}
          onChangeText={v => set("name", v)}
          editable={editing}
        />

        <Text style={[s.label, { color: theme.textSecondary }]}>Phone</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.phone}
          onChangeText={v => set("phone", v)}
          editable={editing}
          keyboardType="phone-pad"
        />

        <Text style={[s.label, { color: theme.textSecondary }]}>Address</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.line1}
          onChangeText={v => set("line1", v)}
          editable={editing}
          placeholder="Street / Flat no."
          placeholderTextColor={theme.textMuted}
        />
        <TextInput
          style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.city}
          onChangeText={v => set("city", v)}
          editable={editing}
          placeholder="City"
          placeholderTextColor={theme.textMuted}
        />
        <TextInput
          style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.state}
          onChangeText={v => set("state", v)}
          editable={editing}
          placeholder="State"
          placeholderTextColor={theme.textMuted}
        />
        <TextInput
          style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.pincode}
          onChangeText={v => set("pincode", v)}
          editable={editing}
          placeholder="Pincode"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
        />

        {editing && (
          <View style={s.editActions}>
            <TouchableOpacity style={[s.cancelBtn, { borderColor: theme.border }]} onPress={() => setEditing(false)}>
              <Text style={[s.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.logoutBtn, { borderColor: theme.error + "66" }]} onPress={handleLogout}>
        <Text style={[s.logoutText, { color: theme.error }]}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  avatarWrap: { alignItems: "center", paddingVertical: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#fff" },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  roleBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 6 },
  roleText: { fontSize: 13, fontWeight: "700" },
  email: { fontSize: 13 },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 20, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  themeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  themeInfo: { flex: 1, paddingRight: 12 },
  themeTitleRow: { flexDirection: "row", alignItems: "center" },
  themeSubtext: { fontSize: 12, marginTop: 4 },
  referralCard: { borderWidth: 1.5 },
  referralHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  referralIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  referralTitle: { fontSize: 16, fontWeight: "800" },
  referralSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  codeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  codeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  codeText: { fontSize: 16, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { fontSize: 12, fontWeight: "700" },
  referralActions: { marginBottom: 12 },
  shareInviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10 },
  shareInviteBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  referralStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" },
  statCol: { alignItems: "center" },
  statNum: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 24 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  editBtn: { fontWeight: "700", fontSize: 14 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  editActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: "center" },
  cancelText: { fontWeight: "600" },
  saveBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700" },
  logoutBtn: { margin: 16, borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: "center" },
  logoutText: { fontWeight: "700", fontSize: 15 }
});
