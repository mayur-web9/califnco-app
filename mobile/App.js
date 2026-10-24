import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/hooks/useTheme";
import { AuthProvider } from "./src/hooks/useAuth";
import { CartProvider } from "./src/hooks/useCart";
import AppNavigator from "./src/navigation/AppNavigator";

class RootErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Application runtime error caught by boundary:", error?.message, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#0a2540", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>💧</Text>
          <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "900", marginBottom: 8, textAlign: "center" }}>
            Califnco Pure Water
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginBottom: 24, maxWidth: 300 }}>
            {this.state.error?.message || "An unexpected error occurred during startup."}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: "#00b4d8", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
            onPress={this.handleRestart}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}>Restart Application</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <MainApp />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
