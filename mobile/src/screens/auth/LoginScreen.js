import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { login } from "../../services/authService";
import colors from "../../constants/colors";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

          {/* Sign Up Switch */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.switchLink}>Sign Up</Text>
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
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 22
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 20,
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
