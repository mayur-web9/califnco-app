import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/hooks/useAuth";
import { CartProvider } from "./src/hooks/useCart";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
