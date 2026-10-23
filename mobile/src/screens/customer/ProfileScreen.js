import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/authService";
import colors from "../../constants/colors";

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    line1: profile?.address?.line1 || "",
    city: profile?.address?.city || "",
    state: profile?.address?.state || "",
    pincode: profile?.address?.pincode || ""
  });

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

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Avatar */}
      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile?.name?.charAt(0).toUpperCase() || "U"}</Text>
        </View>
        <Text style={s.name}>{profile?.name}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>{profile?.role}</Text>
        </View>
        <Text style={s.email}>{profile?.email}</Text>
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Profile Info</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={s.editBtn}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={s.label}>Full Name</Text>
        <TextInput style={s.input} value={form.name} onChangeText={v => set("name", v)} editable={editing} />

        <Text style={s.label}>Phone</Text>
        <TextInput style={s.input} value={form.phone} onChangeText={v => set("phone", v)} editable={editing} keyboardType="phone-pad" />

        <Text style={s.label}>Address</Text>
        <TextInput style={s.input} value={form.line1} onChangeText={v => set("line1", v)} editable={editing} placeholder="Street / Flat no." placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={form.city} onChangeText={v => set("city", v)} editable={editing} placeholder="City" placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={form.state} onChangeText={v => set("state", v)} editable={editing} placeholder="State" placeholderTextColor={colors.textMuted} />
        <TextInput style={s.input} value={form.pincode} onChangeText={v => set("pincode", v)} editable={editing} placeholder="Pincode" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />

        {editing && (
          <View style={s.editActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  avatarWrap: { alignItems: "center", paddingVertical: 28, backgroundColor: colors.primary },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#fff" },
  name: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 6 },
  roleBadge: { backgroundColor: colors.accent + "33", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 6 },
  roleText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  email: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  card: { backgroundColor: colors.card, margin: 16, borderRadius: 14, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  editBtn: { color: colors.accent, fontWeight: "700", fontSize: 14 },
  label: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: colors.text, marginBottom: 12, backgroundColor: colors.background
  },
  editActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" },
  cancelText: { fontWeight: "600", color: colors.textSecondary },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700" },
  logoutBtn: { margin: 16, borderWidth: 1.5, borderColor: colors.error + "66", borderRadius: 12, padding: 14, alignItems: "center" },
  logoutText: { color: colors.error, fontWeight: "700", fontSize: 15 }
});
