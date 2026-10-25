import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useTheme } from "../hooks/useTheme";

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

// Admin screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminDealerApprovalsScreen from "../screens/admin/AdminDealerApprovalsScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";

// Shared
import PendingApprovalScreen from "../screens/shared/PendingApprovalScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CartTabIcon({ color, size }) {
  const { count } = useCart();
  const { theme } = useTheme();
  return (
    <View>
      <MaterialIcons name="shopping-cart" size={size} color={color} />
      {count > 0 && (
        <View style={{ position: "absolute", top: -4, right: -6, backgroundColor: theme.accent, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </View>
  );
}

function CustomerTabs() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: isDark ? theme.accent : theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.tabBarBorder,
          paddingBottom: 4
        },
        headerStyle: { backgroundColor: theme.headerBg },
        headerTintColor: theme.headerText,
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
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} />, tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceBookingScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="build" size={size} color={color} />, tabBarLabel: "Service" }}
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
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.headerBg }, headerTintColor: theme.headerText, headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="CatalogList" component={CatalogScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product Details" }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.headerBg }, headerTintColor: theme.headerText, headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function DealerTabs() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDark ? theme.accent : theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.tabBarBorder
        },
        headerStyle: { backgroundColor: theme.headerBg },
        headerTintColor: theme.headerText,
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <Tab.Screen
        name="DealerCatalog"
        component={DealerCatalogScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="storefront" size={size} color={color} />, tabBarLabel: "Catalog" }}
      />
      <Tab.Screen
        name="DealerCart"
        component={CartStack}
        options={{ headerShown: false, tabBarIcon: CartTabIcon, tabBarLabel: "Cart" }}
      />
      <Tab.Screen
        name="DealerOrders"
        component={DealerOrdersScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" size={size} color={color} />, tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="DealerProfile"
        component={ProfileScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />, tabBarLabel: "Profile" }}
      />
      {/* Hidden aliases for nested/universal navigation safety */}
      <Tab.Screen
        name="Catalog"
        component={DealerCatalogScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" }, headerShown: false }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" }, headerShown: false }}
      />
      <Tab.Screen
        name="Orders"
        component={DealerOrdersScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" }, headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDark ? theme.accent : theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.tabBarBorder
        },
        headerStyle: { backgroundColor: theme.headerBg },
        headerTintColor: theme.headerText,
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />, tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="inventory" size={size} color={color} />, tabBarLabel: "Products" }}
      />
      <Tab.Screen
        name="AdminDealers"
        component={AdminDealerApprovalsScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="badge" size={size} color={color} />, tabBarLabel: "Dealers" }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="local-shipping" size={size} color={color} />, tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={ProfileScreen}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />, tabBarLabel: "Profile" }}
      />
      {/* Hidden aliases for nested/universal navigation safety */}
      <Tab.Screen
        name="Catalog"
        component={AdminProductsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" }, headerShown: false }}
      />
      <Tab.Screen
        name="Orders"
        component={AdminOrdersScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" }, headerShown: false }}
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
  const { theme, isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  function renderRoot() {
    if (!user || !profile) return <AuthStack />;

    const role = (profile.role || "").toLowerCase().trim();
    const dealerStatus = (profile.dealerStatus || "").toLowerCase().trim();

    // 1. Executive Admin Experience
    if (role === "admin") {
      return <AdminTabs />;
    }

    // 2. Dealer Experience
    if (role === "dealer") {
      if (dealerStatus === "pending" || !dealerStatus) {
        return (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
          </Stack.Navigator>
        );
      }
      return <DealerTabs />;
    }

    // 3. Retail Consumer Experience
    return <CustomerTabs />;
  }

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          primary: theme.primary
        }
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          primary: theme.primary
        }
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      {renderRoot()}
    </NavigationContainer>
  );
}
