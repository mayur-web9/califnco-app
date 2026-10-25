import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Modal
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { login, loginWithGoogle } from "../../services/authService";
import colors from "../../constants/colors";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Sign-In Modal State
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // navigation handled by onAuthStateChanged
    } catch (err) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(targetEmail, targetName) {
    const selectedEmail = (targetEmail || googleEmail).trim();
    const selectedName = (targetName || googleName || selectedEmail.split("@")[0] || "Califnco Customer").trim();

    if (!selectedEmail) {
      Alert.alert("Google Sign-In", "Please enter or select your Google account email.");
      return;
    }

    setGoogleLoading(true);
    try {
      await loginWithGoogle({
        email: selectedEmail,
        name: selectedName,
        role: "Customer"
      });
      setGoogleModalVisible(false);
    } catch (err) {
      Alert.alert("Google Sign-In Failed", err.message || "Could not sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Top Brand Logo & Water Droplet */}
        <View style={s.header}>
          <View style={s.logoCircle}>
            <MaterialIcons name="water-drop" size={38} color="#00b4d8" />
          </View>
          <Text style={s.logoText}>Califnco</Text>
          <Text style={s.subtitle}>Pure Water, Better Life</Text>
        </View>

        {/* Card Container */}
        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.cardSub}>Login to your account</Text>

          {/* Email / Username Input */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="person-outline" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email or Phone"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={s.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color="#00b4d8" style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword((p) => !p)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={s.forgotRow}
            onPress={() => Alert.alert("Password Reset", "Please contact info@califnco.com or check with your organization administrator.")}
          >
            <Text style={s.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Main Action Button */}
          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={s.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Social Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={() => {
              setGoogleEmail("");
              setGoogleName("");
              setGoogleModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <View style={s.googleIconCircle}>
              <Text style={s.googleIconText}>G</Text>
            </View>
            <Text style={s.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign Up Switch */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.switchLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Google Sign-In Modal */}
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
                <Text style={s.googleModalTitle}>Sign in with Google</Text>
                <Text style={s.googleModalSub}>Choose an account for Califnco Water</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Quick 1-Tap Google Account */}
            <TouchableOpacity
              style={s.googleAccountOption}
              onPress={() => handleGoogleSignIn("mayur@gmail.com", "Mayur Sharma")}
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

            <TouchableOpacity
              style={s.googleAccountOption}
              onPress={() => handleGoogleSignIn("customer@califnco.com", "Califnco Customer")}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              <View style={[s.googleAvatar, { backgroundColor: "#0284c7" }]}>
                <Text style={s.googleAvatarText}>C</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.googleAccountName}>Califnco Premium Account</Text>
                <Text style={s.googleAccountEmail}>customer@califnco.com</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
            </TouchableOpacity>

            <View style={s.orDivider}>
              <View style={s.dividerLine} />
              <Text style={[s.dividerText, { fontSize: 11 }]}>OR ENTER ANOTHER GOOGLE ACCOUNT</Text>
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
              onPress={() => handleGoogleSignIn()}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={s.googleSubmitBtnText}>Sign In with Google</Text>
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
    marginBottom: 24
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00b4d8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 10
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
    padding: 24,
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
    marginBottom: 20
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a"
  },
  eyeBtn: {
    padding: 6
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginBottom: 18,
    marginTop: -2
  },
  forgotText: {
    fontSize: 12.5,
    color: "#0284c7",
    fontWeight: "600"
  },
  loginBtn: {
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
    marginBottom: 20
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
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
    marginBottom: 20,
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
    fontSize: 14.5,
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
