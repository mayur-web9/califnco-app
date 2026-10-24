import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { register } from "../../services/authService";
import colors from "../../constants/colors";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Customer"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Password rules validation
  const pwd = form.password;
  const hasMinLength = pwd.length >= 9;
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const isMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const isPasswordValid = hasMinLength && hasLower && hasUpper && hasNumber && hasSpecial;

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields including Confirm Password.");
      return;
    }

    if (!hasMinLength) {
      Alert.alert("Password Too Short", "Password must be at least 9 characters in length.");
      return;
    }

    if (!hasLower) {
      Alert.alert("Password Incomplete", "Password must contain at least 1 lowercase letter (a-z).");
      return;
    }

    if (!hasUpper) {
      Alert.alert("Password Incomplete", "Password must contain at least 1 uppercase letter (A-Z).");
      return;
    }

    if (!hasNumber) {
      Alert.alert("Password Incomplete", "Password must contain at least 1 number (0-9).");
      return;
    }

    if (!hasSpecial) {
      Alert.alert("Password Incomplete", "Password must contain at least 1 special character / symbol (e.g. @, #, $, %, !).");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Password Mismatch", "Password and Confirm Password do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role
      });
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
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={v => set("name", v)}
            placeholder="Ananya Sharma"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={form.email}
            onChangeText={v => set("email", v)}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Phone</Text>
          <TextInput
            style={s.input}
            value={form.phone}
            onChangeText={v => set("phone", v)}
            placeholder="+919876543210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={s.label}>Password</Text>
          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              value={form.password}
              onChangeText={v => set("password", v)}
              placeholder="At least 9 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword(p => !p)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Confirm Password</Text>
          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              value={form.confirmPassword}
              onChangeText={v => set("confirmPassword", v)}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowConfirmPassword(p => !p)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements Checklist */}
          <View style={s.reqContainer}>
            <Text style={s.reqHeader}>Password Requirements:</Text>
            <View style={s.reqRow}>
              <Text style={[s.reqBadge, hasMinLength ? s.reqPass : s.reqFail]}>
                {hasMinLength ? "✓" : "○"} At least 9 characters ({pwd.length}/9)
              </Text>
            </View>
            <View style={s.reqGrid}>
              <Text style={[s.reqBadge, hasLower ? s.reqPass : s.reqFail]}>
                {hasLower ? "✓" : "○"} 1 lowercase (a-z)
              </Text>
              <Text style={[s.reqBadge, hasUpper ? s.reqPass : s.reqFail]}>
                {hasUpper ? "✓" : "○"} 1 uppercase (A-Z)
              </Text>
              <Text style={[s.reqBadge, hasNumber ? s.reqPass : s.reqFail]}>
                {hasNumber ? "✓" : "○"} 1 number (0-9)
              </Text>
              <Text style={[s.reqBadge, hasSpecial ? s.reqPass : s.reqFail]}>
                {hasSpecial ? "✓" : "○"} 1 special char (@$!%*?)
              </Text>
            </View>
            {form.confirmPassword.length > 0 && (
              <Text style={[s.reqBadge, isMatch ? s.reqPass : s.reqFail, { marginTop: 6 }]}>
                {isMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </Text>
            )}
          </View>

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

          <TouchableOpacity
            style={[s.button, (!isPasswordValid || !isMatch) && s.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
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
  header: { alignItems: "center", marginBottom: 28 },
  logo: { fontSize: 36, fontWeight: "800", color: colors.textOnPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: colors.accent, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, marginBottom: 14, backgroundColor: colors.background },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginBottom: 14
  },
  passwordInput: {
    flex: 1,
    padding: 13,
    fontSize: 15,
    color: colors.text
  },
  eyeBtn: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  reqContainer: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16
  },
  reqHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6
  },
  reqRow: {
    marginBottom: 4
  },
  reqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  reqBadge: {
    fontSize: 12,
    fontWeight: "600"
  },
  reqPass: {
    color: "#16a34a"
  },
  reqFail: {
    color: "#94a3b8"
  },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  roleBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  roleBtnText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  roleBtnTextActive: { color: colors.textOnPrimary },
  note: { fontSize: 12, color: colors.warning, marginBottom: 16, lineHeight: 18 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8, marginBottom: 16 },
  buttonDisabled: { opacity: 0.75 },
  buttonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: "700" },
  link: { textAlign: "center", color: colors.textSecondary, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: "600" }
});
