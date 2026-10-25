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
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Password rules validation
  const pwd = form.password;
  const hasMinLength = pwd.length >= 9;
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const isMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields including Confirm Password.");
      return;
    }

    if (!hasMinLength) {
      Alert.alert("Password Too Short", "Password must be at least 9 characters in length.");
      return;
    }

    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
      Alert.alert("Password Incomplete", "Password must contain uppercase, lowercase, number, and a special character.");
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
      // AuthProvider handles onAuthStateChanged
    } catch (err) {
      Alert.alert("Registration failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Top Brand Logo */}
        <View style={s.header}>
          <View style={s.logoCircle}>
            <MaterialIcons name="water-drop" size={38} color="#00b4d8" />
          </View>
          <Text style={s.logoText}>Califnco</Text>
          <Text style={s.subtitle}>Pure Water, Better Life</Text>
        </View>

        {/* Card Container */}
        <View style={s.card}>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.cardSub}>Join us for clean and healthy water</Text>

          {/* Full Name */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="person-outline" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={form.name}
              onChangeText={(v) => set("name", v)}
              placeholder="Full Name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Email or Phone */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="mail-outline" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={form.email}
              onChangeText={(v) => set("email", v)}
              placeholder="Email Address"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="phone-android" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={form.phone}
              onChangeText={(v) => set("phone", v)}
              placeholder="Phone Number (+91...)"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={form.password}
              onChangeText={(v) => set("password", v)}
              placeholder="Create strong password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword((p) => !p)}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={form.confirmPassword}
              onChangeText={(v) => set("confirmPassword", v)}
              placeholder="Confirm password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirmPassword((p) => !p)}>
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* Password Validation Checklist */}
          {form.password.length > 0 && (
            <View style={s.reqContainer}>
              <View style={s.reqGrid}>
                <Text style={[s.reqBadge, hasMinLength ? s.reqPass : s.reqFail]}>
                  {hasMinLength ? "✓" : "○"} 9+ chars
                </Text>
                <Text style={[s.reqBadge, hasUpper ? s.reqPass : s.reqFail]}>
                  {hasUpper ? "✓" : "○"} Uppercase
                </Text>
                <Text style={[s.reqBadge, hasLower ? s.reqPass : s.reqFail]}>
                  {hasLower ? "✓" : "○"} Lowercase
                </Text>
                <Text style={[s.reqBadge, hasNumber ? s.reqPass : s.reqFail]}>
                  {hasNumber ? "✓" : "○"} Number
                </Text>
                <Text style={[s.reqBadge, hasSpecial ? s.reqPass : s.reqFail]}>
                  {hasSpecial ? "✓" : "○"} Symbol
                </Text>
                {form.confirmPassword.length > 0 && (
                  <Text style={[s.reqBadge, isMatch ? s.reqPass : s.reqFail]}>
                    {isMatch ? "✓ Matches" : "✗ Mismatch"}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Role Selection */}
          <Text style={s.roleLabel}>Account Type</Text>
          <View style={s.roleRow}>
            {["Customer", "Dealer"].map((r) => {
              const active = form.role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[s.roleBtn, active && s.roleBtnActive]}
                  onPress={() => set("role", r)}
                >
                  <MaterialIcons
                    name={r === "Customer" ? "person" : "storefront"}
                    size={16}
                    color={active ? "#ffffff" : "#64748b"}
                  />
                  <Text style={[s.roleBtnText, active && s.roleBtnTextActive]}>
                    {r === "Customer" ? "Retail Customer" : "Wholesale Dealer"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={s.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={s.registerBtnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Social Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Social Icons */}
          <View style={s.socialRow}>
            <TouchableOpacity
              style={s.socialBtn}
              onPress={() => Alert.alert("Google Sign-In", "Google OAuth will connect with your Google Workspace account.")}
            >
              <Text style={s.socialG}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.socialBtn}
              onPress={() => Alert.alert("Apple Sign-In", "Apple ID authentication available on iOS devices.")}
            >
              <MaterialIcons name="apple" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Switch to Login */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.switchLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#f0f9ff"
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingTop: 36,
    paddingBottom: 36
  },
  header: {
    alignItems: "center",
    marginBottom: 20
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00b4d8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8
  },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0a2540",
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 13,
    color: "#0284c7",
    fontWeight: "600",
    marginTop: 2
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#00b4d8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 180, 216, 0.15)"
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0a2540",
    marginBottom: 4
  },
  cardSub: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 50
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: "#0f172a"
  },
  eyeBtn: {
    padding: 6
  },
  reqContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  reqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  reqBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  reqPass: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    fontWeight: "700"
  },
  reqFail: {
    backgroundColor: "#f1f5f9",
    color: "#94a3b8"
  },
  roleLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc"
  },
  roleBtnActive: {
    backgroundColor: "#0a2540",
    borderColor: "#0a2540"
  },
  roleBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748b"
  },
  roleBtnTextActive: {
    color: "#ffffff"
  },
  registerBtn: {
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00b4d8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 18
  },
  registerBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0"
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: "#94a3b8"
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  socialG: {
    fontSize: 19,
    fontWeight: "800",
    color: "#ea4335"
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  switchText: {
    fontSize: 13.5,
    color: "#64748b"
  },
  switchLink: {
    fontSize: 13.5,
    color: "#0284c7",
    fontWeight: "800"
  }
});
