import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Modal
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { register, loginWithGoogle } from "../../services/authService";
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

  // Google Sign-Up Modal State
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleSignUp(targetEmail, targetName) {
    const selectedEmail = (targetEmail || googleEmail).trim();
    const selectedName = (targetName || googleName || form.name || selectedEmail.split("@")[0] || "Califnco Member").trim();

    if (!selectedEmail) {
      Alert.alert("Google Sign-Up", "Please enter or select your Google account email.");
      return;
    }

    setGoogleLoading(true);
    try {
      await loginWithGoogle({
        email: selectedEmail,
        name: selectedName,
        role: form.role || "Customer"
      });
      setGoogleModalVisible(false);
    } catch (err) {
      Alert.alert("Google Sign-Up Failed", err.message || "Could not sign up with Google.");
    } finally {
      setGoogleLoading(false);
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

          {/* Google Sign-Up Button */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={() => {
              setGoogleEmail(form.email || "");
              setGoogleName(form.name || "");
              setGoogleModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <View style={s.googleIconCircle}>
              <Text style={s.googleIconText}>G</Text>
            </View>
            <Text style={s.googleBtnText}>Continue with Google ({form.role})</Text>
          </TouchableOpacity>

          {/* Switch to Login */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.switchLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Google Sign-Up Modal */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.googleModalContent}>
            <View style={s.googleModalHeader}>
              <View style={s.googleHeaderBadge}>
                <Text style={s.googleHeaderG}>G</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.googleModalTitle}>Sign up with Google</Text>
                <Text style={s.googleModalSub}>Create your {form.role} account</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Quick 1-Tap Google Account */}
            <TouchableOpacity
              style={s.googleAccountOption}
              onPress={() => handleGoogleSignUp("mayur@gmail.com", "Mayur Sharma")}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              <View style={s.googleAvatar}>
                <Text style={s.googleAvatarText}>M</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.googleAccountName}>Mayur Sharma</Text>
                <Text style={s.googleAccountEmail}>mayur@gmail.com</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
            </TouchableOpacity>

            <View style={s.orDivider}>
              <View style={s.dividerLine} />
              <Text style={[s.dividerText, { fontSize: 11 }]}>OR ENTER YOUR GOOGLE ACCOUNT</Text>
              <View style={s.dividerLine} />
            </View>

            <TextInput
              style={s.googleInput}
              value={googleEmail}
              onChangeText={setGoogleEmail}
              placeholder="Your Google Email (e.g. name@gmail.com)"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[s.googleInput, { marginTop: 10 }]}
              value={googleName}
              onChangeText={setGoogleName}
              placeholder="Your Full Name (optional)"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={s.googleSubmitBtn}
              onPress={() => handleGoogleSignUp()}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={s.googleSubmitBtnText}>Sign Up with Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 25,
    height: 50,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ea4335"
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b"
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 37, 64, 0.65)",
    justifyContent: "flex-end"
  },
  googleModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28
  },
  googleModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 14
  },
  googleHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fee2e2"
  },
  googleHeaderG: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ea4335"
  },
  googleModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0a2540"
  },
  googleModalSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2
  },
  googleAccountOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    backgroundColor: "#f8fafc"
  },
  googleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ea4335",
    alignItems: "center",
    justifyContent: "center"
  },
  googleAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800"
  },
  googleAccountName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a"
  },
  googleAccountEmail: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14
  },
  googleInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc"
  },
  googleSubmitBtn: {
    backgroundColor: "#00b4d8",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16
  },
  googleSubmitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  }
});
