import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from "react-native";
import { register } from "../../services/authService";
import colors from "../../constants/colors";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "Customer" });
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
      // AuthProvider picks up onAuthStateChanged automatically
    } catch (err) {
      Alert.alert("Registration failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>💧 Califnco</Text>
          <Text style={s.subtitle}>Pure Water, Delivered</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Create Account</Text>

          <Text style={s.label}>Full Name</Text>
          <TextInput style={s.input} value={form.name} onChangeText={v => set("name", v)} placeholder="Ananya Sharma" placeholderTextColor={colors.textMuted} />

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={form.email} onChangeText={v => set("email", v)} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={form.phone} onChangeText={v => set("phone", v)} placeholder="+919876543210" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={form.password} onChangeText={v => set("password", v)} placeholder="Min. 6 characters" placeholderTextColor={colors.textMuted} secureTextEntry />

          <Text style={s.label}>Register as</Text>
          <View style={s.roleRow}>
            {["Customer", "Dealer"].map(r => (
              <TouchableOpacity
                key={r}
                style={[s.roleBtn, form.role === r && s.roleBtnActive]}
                onPress={() => set("role", r)}
              >
                <Text style={[s.roleBtnText, form.role === r && s.roleBtnTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.role === "Dealer" && (
            <Text style={s.note}>
              Dealer accounts require admin approval before you can see wholesale prices.
            </Text>
          )}

          <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={s.link}>Already have an account? <Text style={s.linkAccent}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: "800", color: colors.textOnPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: colors.accent, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 28, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 15, color: colors.text, marginBottom: 16, backgroundColor: colors.background },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  roleBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  roleBtnText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  roleBtnTextActive: { color: colors.textOnPrimary },
  note: { fontSize: 12, color: colors.warning, marginBottom: 16, lineHeight: 18 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8, marginBottom: 16 },
  buttonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: "700" },
  link: { textAlign: "center", color: colors.textSecondary, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: "600" }
});
