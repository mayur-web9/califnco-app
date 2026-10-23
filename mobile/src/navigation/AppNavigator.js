import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import colors from "../constants/colors";

// Auth screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Customer screens
import CatalogScreen from "../screens/customer/CatalogScreen";
import ProductDetailScreen from "../screens/customer/ProductDetailScreen";
import CartScreen from "../screens/customer/CartScreen";
import CheckoutScreen from "../screens/customer/CheckoutScreen";
import OrdersScreen from "../screens/customer/OrdersScreen";
import ServiceBookingScreen from "../screens/customer/ServiceBookingScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";

// Dealer screens
import DealerCatalogScreen from "../screens/dealer/DealerCatalogScreen";
import DealerOrdersScreen from "../screens/dealer/DealerOrdersScreen";

// Shared
import PendingApprovalScreen from "../screens/shared/PendingApprovalScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CartTabIcon({ color, size }) {
  const { count } = useCart();
  return (
    <View>
      <MaterialIcons name="shopping-cart" size={size} color={color} />
      {count > 0 && (
        <View style={{ position: "absolute", top: -4, right: -6, backgroundColor: colors.accent, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </View>
  );
}

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, paddingBottom: 4 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" }
      })}
    >
      <Tab.Screen
        name="Catalog"
        component={CatalogStack}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />, tabBarLabel: "Catalog" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={{ headerShown: false, tabBarIcon: CartTabIcon, tabBarLabel: "Cart" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} />, tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceBookingScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialIcons name="build" size={size} color={color} />, tabBarLabel: "Service" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />, tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="CatalogList" component={CatalogScreen} options={{ title: "💧 Califnco" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={({ route }) => ({ title: route.params?.product?.name?.split(" ").slice(0, 3).join(" ") + "..." || "Product" })} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ title: "Cart" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </Stack.Navigator>
  );
}

function DealerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <Tab.Screen
        name="DealerCatalog"
        component={DealerCatalogScreen}
        options={{ title: "Wholesale Catalog", tabBarIcon: ({ color, size }) => <MaterialIcons name="storefront" size={size} color={color} />, tabBarLabel: "Catalog" }}
      />
      <Tab.Screen
        name="DealerOrders"
        component={DealerOrdersScreen}
        options={{ title: "My Orders", tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} />, tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="DealerProfile"
        component={ProfileScreen}
        options={{ title: "Profile", headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />, tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  function renderRoot() {
    if (!user || !profile) return <AuthStack />;
    if (profile.role === "Dealer" && profile.dealerStatus === "pending") return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      </Stack.Navigator>
    );
    if (profile.role === "Dealer" && profile.dealerStatus === "approved") return <DealerTabs />;
    // Customer or Admin (admin uses admin-web, but if they log in to mobile they see customer view)
    return <CustomerTabs />;
  }

  return (
    <NavigationContainer>
      {renderRoot()}
    </NavigationContainer>
  );
}
