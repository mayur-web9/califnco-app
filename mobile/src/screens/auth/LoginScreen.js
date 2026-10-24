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
      // navigation is handled by onAuthStateChanged in AppNavigator
    } catch (err) {
      Alert.alert("Login failed", err.message);
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
          <Text style={s.title}>Sign in</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Password</Text>
          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
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

          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={s.link}>Don't have an account? <Text style={s.linkAccent}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: "800", color: colors.textOnPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: colors.accent, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 20,
    padding: 28, shadowColor: "#000", shadowOpacity: 0.12,
    shadowRadius: 16, elevation: 8
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 14, fontSize: 15, color: colors.text, marginBottom: 16, backgroundColor: colors.background
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginBottom: 16
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: colors.text
  },
  eyeBtn: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: 16, alignItems: "center", marginTop: 4, marginBottom: 16
  },
  buttonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: "700" },
  link: { textAlign: "center", color: colors.textSecondary, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: "600" }
});
