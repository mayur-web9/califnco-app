import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch, Share, Platform, Modal, Linking
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { logout } from "../../services/authService";
import Skeleton from "../../components/Skeleton";
import colors from "../../constants/colors";

export default function ProfileScreen({ navigation }) {
  const { profile, refreshProfile } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // Role booleans
  const userRole = (profile?.role || "Customer").toLowerCase().trim();
  const isAdmin = userRole === "admin";
  const isDealer = userRole === "dealer";
  const isCustomer = !isAdmin && !isDealer;

  // Active Modals
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  // Notifications Toggles
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyService, setNotifyService] = useState(true);
  const [notifyOffers, setNotifyOffers] = useState(false);

  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    line1: profile?.address?.line1 || "",
    city: profile?.address?.city || "",
    state: profile?.address?.state || "",
    pincode: profile?.address?.pincode || ""
  });

  const referralCode = isDealer
    ? `CALIF-DLR-${(profile?.name || "PARTNER").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase()}${String(profile?.uid || "777").slice(-3).toUpperCase()}`
    : `CALIF-VIP-${(profile?.name || "RETAIL").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase()}${String(profile?.uid || "892").slice(-3).toUpperCase()}`;

  // Safe Role-Based Orders Navigation
  function handleNavigateToOrders() {
    if (isAdmin) {
      navigation?.navigate ? navigation.navigate("AdminOrders") : null;
    } else if (isDealer) {
      navigation?.navigate ? navigation.navigate("DealerOrders") : null;
    } else {
      navigation?.navigate ? navigation.navigate("Orders") : null;
    }
  }

  async function handleShareReferral() {
    try {
      const shareMsg = isDealer
        ? `🤝 Join the Califnco B2B Authorized Dealer Network! Use Partner Referral Code: ${referralCode} to get 5% wholesale discounts on your first 3 bulk orders!\n\nAccess here: https://califnco-app.onrender.com`
        : `💧 Drink clean, pure water! Use my referral code ${referralCode} to get ₹500 off your Califnco smart RO purifier or filter maintenance booking!\n\nJoin here: https://califnco-app.onrender.com`;

      await Share.share({
        message: shareMsg,
        title: isDealer ? "Califnco B2B Dealer Referral" : "Califnco ₹500 Referral Reward",
      });
    } catch (_) {}
  }

  function handleCopyReferral() {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    Alert.alert(
      "Code Copied! 🎉",
      isDealer
        ? `Dealer Partner Code "${referralCode}" copied. Share with appliance stores to earn 5% wholesale commissions.`
        : `Customer referral code "${referralCode}" copied. Share with friends to earn ₹500 store credit.`
    );
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: {
          line1: form.line1.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim()
        }
      });
      await refreshProfile();
      setEditing(false);
      setAddressModalVisible(false);
      Alert.alert("Saved", "Your details have been updated successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out from your Califnco account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => logout() }
    ]);
  }

  if (!profile) {
    return (
      <ScrollView style={[s.container, { backgroundColor: theme.background }]} contentContainerStyle={s.content}>
        <View style={[s.avatarWrap, { backgroundColor: isDark ? theme.card : "#0a2540", alignItems: "center" }]}>
          <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
          <Skeleton width={140} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={18} borderRadius={10} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={14} borderRadius={6} />
        </View>
        <View style={{ padding: 16, gap: 14 }}>
          <Skeleton width="100%" height={80} borderRadius={14} />
          <Skeleton width="100%" height={160} borderRadius={14} />
        </View>
      </ScrollView>
    );
  }

  const initials = (profile?.name || "Califnco User")
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.background }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* 1. Circular Avatar Profile Hero */}
      <View style={[s.avatarWrap, { backgroundColor: isDark ? theme.card : "#0a2540" }]}>
        <View style={s.avatarRing}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        </View>
        <Text style={s.profileName}>{profile?.name || "Califnco Member"}</Text>
        <Text style={s.profileEmail}>{profile?.email || "user@califnco.com"}</Text>

        <View style={s.roleBadgeRow}>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>
              {isAdmin ? "👑 EXECUTIVE ADMIN" : isDealer ? "🏷️ WHOLESALE DEALER" : "💧 RETAIL CONSUMER"}
            </Text>
          </View>
          {isDealer && (
            <View style={[s.roleBadge, { backgroundColor: profile?.dealerStatus === "approved" ? "#dcfce7" : "#fef3c7" }]}>
              <Text style={[s.roleText, { color: profile?.dealerStatus === "approved" ? "#16a34a" : "#b45309" }]}>
                {profile?.dealerStatus === "approved" ? "✓ APPROVED PARTNER" : "⏳ PENDING REVIEW"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Role-Based Feature Cards (Quick Hubs) */}
      {isAdmin ? (
        /* ADMIN EXECUTIVE OPERATIONS HUB */
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={s.sectionHeaderRow}>
            <View style={[s.sectionIconWrap, { backgroundColor: "rgba(0, 180, 216, 0.15)" }]}>
              <MaterialIcons name="admin-panel-settings" size={20} color="#00b4d8" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.cardTitle, { color: theme.text }]}>Executive Management Hub</Text>
              <Text style={[s.sectionSubtext, { color: theme.textMuted }]}>System telemetry & operational controls</Text>
            </View>
          </View>

          <View style={s.adminGrid}>
            <TouchableOpacity
              style={[s.adminTile, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border }]}
              onPress={() => navigation?.navigate ? navigation.navigate("AdminOrders") : null}
            >
              <MaterialIcons name="local-shipping" size={22} color="#0284c7" />
              <Text style={[s.adminTileTitle, { color: theme.text }]}>Fulfillment</Text>
              <Text style={[s.adminTileSub, { color: theme.textMuted }]}>Dispatch Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.adminTile, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border }]}
              onPress={() => navigation?.navigate ? navigation.navigate("AdminProducts") : null}
            >
              <MaterialIcons name="inventory" size={22} color="#10b981" />
              <Text style={[s.adminTileTitle, { color: theme.text }]}>Catalog & Stock</Text>
              <Text style={[s.adminTileSub, { color: theme.textMuted }]}>Manage Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.adminTile, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border }]}
              onPress={() => navigation?.navigate ? navigation.navigate("AdminDealers") : null}
            >
              <MaterialIcons name="badge" size={22} color="#f59e0b" />
              <Text style={[s.adminTileTitle, { color: theme.text }]}>Dealers</Text>
              <Text style={[s.adminTileSub, { color: theme.textMuted }]}>Verify Partners</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.adminTile, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: theme.border }]}
              onPress={() => navigation?.navigate ? navigation.navigate("AdminDashboard") : null}
            >
              <MaterialIcons name="insights" size={22} color="#8b5cf6" />
              <Text style={[s.adminTileTitle, { color: theme.text }]}>Analytics</Text>
              <Text style={[s.adminTileSub, { color: theme.textMuted }]}>Sales & Growth</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isDealer ? (
        /* DEALER REFERRAL & B2B COMMISSION CARD */
        <View style={[s.card, s.referralCard, { backgroundColor: isDark ? "#0c2340" : "#eff6ff", borderColor: isDark ? "#1e40af" : "#bfdbfe" }]}>
          <View style={s.referralHeader}>
            <View style={[s.referralIconWrap, { backgroundColor: isDark ? "#1e293b" : "#dbeafe" }]}>
              <MaterialIcons name="store" size={24} color="#0284c7" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.referralTitle, { color: isDark ? "#f8fafc" : "#1e3a8a" }]}>Dealer Partner Referral</Text>
              <Text style={[s.referralSubtitle, { color: isDark ? "#94a3b8" : "#1e40af" }]}>
                Refer appliance retailers or regional technicians. Earn 5% wholesale commission on their first 3 bulk orders!
              </Text>
            </View>
          </View>

          <View style={[s.codeBox, { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#334155" : "#cbd5e1" }]}>
            <View>
              <Text style={[s.codeLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>B2B PARTNER CODE</Text>
              <Text style={[s.codeText, { color: isDark ? "#38bdf8" : "#0284c7" }]}>{referralCode}</Text>
            </View>
            <TouchableOpacity style={[s.copyBtn, { backgroundColor: isDark ? "#1e293b" : "#e0f2fe" }]} onPress={handleCopyReferral} activeOpacity={0.75}>
              <MaterialIcons name={copiedCode ? "check" : "content-copy"} size={16} color={isDark ? "#38bdf8" : "#0369a1"} />
              <Text style={[s.copyBtnText, { color: isDark ? "#38bdf8" : "#0369a1" }]}>{copiedCode ? "Copied" : "Copy"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.referralActions}>
            <TouchableOpacity style={[s.shareInviteBtn, { backgroundColor: "#0284c7" }]} onPress={handleShareReferral} activeOpacity={0.8}>
              <MaterialIcons name="share" size={17} color="#ffffff" />
              <Text style={s.shareInviteBtnText}>Share Dealer Invite Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* CUSTOMER REFER & EARN ₹500 CARD */
        <View style={[s.card, s.referralCard, { backgroundColor: isDark ? "#0c2340" : "#f0fdf4", borderColor: isDark ? "#1e40af" : "#bbf7d0" }]}>
          <View style={s.referralHeader}>
            <View style={[s.referralIconWrap, { backgroundColor: isDark ? "#1e293b" : "#dcfce7" }]}>
              <MaterialIcons name="card-giftcard" size={24} color={isDark ? "#38bdf8" : "#16a34a"} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.referralTitle, { color: isDark ? "#f8fafc" : "#14532d" }]}>Refer & Earn ₹500</Text>
              <Text style={[s.referralSubtitle, { color: isDark ? "#94a3b8" : "#166534" }]}>
                Give friends ₹500 off. Get ₹500 store credits on their first purifier purchase.
              </Text>
            </View>
          </View>

          <View style={[s.codeBox, { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#334155" : "#cbd5e1" }]}>
            <View>
              <Text style={[s.codeLabel, { color: isDark ? "#94a3b8" : "#64748b" }]}>YOUR INVITE CODE</Text>
              <Text style={[s.codeText, { color: isDark ? "#38bdf8" : "#0284c7" }]}>{referralCode}</Text>
            </View>
            <TouchableOpacity style={[s.copyBtn, { backgroundColor: isDark ? "#1e293b" : "#e0f2fe" }]} onPress={handleCopyReferral} activeOpacity={0.75}>
              <MaterialIcons name={copiedCode ? "check" : "content-copy"} size={16} color={isDark ? "#38bdf8" : "#0369a1"} />
              <Text style={[s.copyBtnText, { color: isDark ? "#38bdf8" : "#0369a1" }]}>{copiedCode ? "Copied" : "Copy"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.referralActions}>
            <TouchableOpacity style={[s.shareInviteBtn, { backgroundColor: "#00b4d8" }]} onPress={handleShareReferral} activeOpacity={0.8}>
              <MaterialIcons name="share" size={17} color="#ffffff" />
              <Text style={s.shareInviteBtnText}>Share Invite Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Role-Tailored Interactive Menu Card */}
      <View style={[s.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* 1. Orders / Invoices */}
        <TouchableOpacity
          style={s.menuRow}
          onPress={handleNavigateToOrders}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="receipt-long" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>
            {isAdmin ? "Fulfillment Orders & Dispatches" : isDealer ? "B2B Purchase Invoices" : "My Orders & Tracking"}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        {/* 2. Customer Service Shortcut (Only for Customer) */}
        {isCustomer && (
          <>
            <TouchableOpacity
              style={s.menuRow}
              onPress={() => navigation?.navigate ? navigation.navigate("Service") : null}
              activeOpacity={0.7}
            >
              <View style={s.menuIconWrap}>
                <MaterialIcons name="handyman" size={20} color="#00b4d8" />
              </View>
              <Text style={[s.menuTitle, { color: theme.text }]}>Book Maintenance & Repair</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={[s.menuDivider, { backgroundColor: theme.border }]} />
          </>
        )}

        {/* 3. Delivery / Warehouse Addresses */}
        <TouchableOpacity
          style={s.menuRow}
          onPress={() => setAddressModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="location-on" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>
            {isDealer ? "Warehouse & Delivery Address" : "Delivery Addresses"}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        {/* 4. Payment Methods / Terms */}
        <TouchableOpacity
          style={s.menuRow}
          onPress={() => setPaymentModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="payment" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>
            {isAdmin ? "Payment Gateway Status" : isDealer ? "B2B Credit Line & Terms" : "Payment Methods & UPI"}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        {/* 5. Notifications Hub */}
        <TouchableOpacity
          style={s.menuRow}
          onPress={() => setNotificationsModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="notifications-none" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>
            {isAdmin ? "System Alerts & Logs" : "Notifications & Preferences"}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        {/* 6. Help & Support */}
        <TouchableOpacity
          style={s.menuRow}
          onPress={() => setSupportModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="headset-mic" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>
            {isAdmin ? "Technical Operations Support" : isDealer ? "Dealer Priority Desk" : "Help & Customer Support"}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[s.menuDivider, { backgroundColor: theme.border }]} />

        {/* 7. About Us */}
        <TouchableOpacity
          style={s.menuRow}
          onPress={() => setAboutModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={s.menuIconWrap}>
            <MaterialIcons name="info-outline" size={20} color="#00b4d8" />
          </View>
          <Text style={[s.menuTitle, { color: theme.text }]}>About Califnco</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 4. Theme Preference Card */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.themeRow}>
          <View style={s.themeInfo}>
            <View style={s.themeTitleRow}>
              <MaterialIcons
                name={isDark ? "dark-mode" : "light-mode"}
                size={22}
                color="#00b4d8"
              />
              <Text style={[s.cardTitle, { color: theme.text, marginLeft: 8 }]}>Theme</Text>
            </View>
            <Text style={[s.themeSubtext, { color: theme.textSecondary }]}>
              {isDark ? "Dark Mode (Obsidian Navy)" : "Light Mode (Day Ocean)"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#cbd5e1", true: "#00b4d8" }}
            thumbColor={isDark ? "#ffffff" : "#f8fafc"}
          />
        </View>
      </View>

      {/* 5. Personal Details Form Toggle */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={[s.cardTitle, { color: theme.text }]}>Account Information</Text>
            <Text style={[s.themeSubtext, { color: theme.textSecondary }]}>Manage your name, phone and default address</Text>
          </View>
          <TouchableOpacity
            style={[s.editToggleBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e0f2fe" }]}
            onPress={() => setEditing(!editing)}
          >
            <MaterialIcons name={editing ? "close" : "edit"} size={16} color="#00b4d8" />
            <Text style={{ color: "#00b4d8", fontWeight: "700", fontSize: 12, marginLeft: 4 }}>
              {editing ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={{ marginTop: 14 }}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Full Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={form.name}
              onChangeText={v => set("name", v)}
            />

            <Text style={[s.label, { color: theme.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={form.phone}
              onChangeText={v => set("phone", v)}
              keyboardType="phone-pad"
            />

            <Text style={[s.label, { color: theme.textSecondary }]}>Address (Line 1)</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={form.line1}
              onChangeText={v => set("line1", v)}
              placeholder="Street / Flat no."
              placeholderTextColor={theme.textMuted}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: theme.textSecondary }]}>City</Text>
                <TextInput
                  style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  value={form.city}
                  onChangeText={v => set("city", v)}
                  placeholder="City"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: theme.textSecondary }]}>Pincode</Text>
                <TextInput
                  style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  value={form.pincode}
                  onChangeText={v => set("pincode", v)}
                  keyboardType="numeric"
                  placeholder="560103"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={s.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>{profile?.name || "Member"}</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{profile?.phone || "No phone added"}</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
              {[profile?.address?.line1, profile?.address?.city, profile?.address?.state, profile?.address?.pincode].filter(Boolean).join(", ") || "No address saved"}
            </Text>
          </View>
        )}
      </View>

      {/* 6. Sign Out Button */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <MaterialIcons name="logout" size={18} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* ======================================================== */}
      {/* MODAL 1: Delivery / Warehouse Addresses Manager */}
      {/* ======================================================== */}
      <Modal visible={addressModalVisible} transparent animationType="slide" onRequestClose={() => setAddressModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.card }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="location-on" size={24} color="#00b4d8" />
                <Text style={[s.modalTitle, { color: theme.text, marginLeft: 8 }]}>
                  {isDealer ? "Warehouse & Supply Address" : "Delivery Addresses"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <View style={[s.savedAddressCard, { borderColor: "#00b4d8", backgroundColor: isDark ? "rgba(0,180,216,0.08)" : "#f0f9ff" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons name="home" size={18} color="#00b4d8" />
                    <Text style={{ fontSize: 14, fontWeight: "800", color: theme.text, marginLeft: 6 }}>
                      {isDealer ? "Primary Warehouse & Hub" : "Default Home Delivery"}
                    </Text>
                  </View>
                  <View style={s.defaultBadge}>
                    <Text style={s.defaultBadgeText}>DEFAULT</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, color: theme.text, fontWeight: "600" }}>{form.name || profile?.name}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{form.phone || profile?.phone}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                  {[form.line1 || profile?.address?.line1, form.city || profile?.address?.city, form.state || profile?.address?.state, form.pincode || profile?.address?.pincode].filter(Boolean).join(", ") || "No address configured yet. Use the inputs below to add."}
                </Text>
              </View>

              <Text style={[s.label, { color: theme.text, marginTop: 14 }]}>Update Street / Flat / Unit</Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={form.line1}
                onChangeText={v => set("line1", v)}
                placeholder="Flat 402, Green Glen Apartments..."
                placeholderTextColor={theme.textMuted}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: theme.text }]}>City</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    value={form.city}
                    onChangeText={v => set("city", v)}
                    placeholder="Bengaluru"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: theme.text }]}>Pincode</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    value={form.pincode}
                    onChangeText={v => set("pincode", v)}
                    keyboardType="numeric"
                    placeholder="560103"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.saveBtn, { marginTop: 10 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save Primary Address</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: Role-Tailored Payment Methods & Terms */}
      {/* ======================================================== */}
      <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.card }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="payment" size={24} color="#00b4d8" />
                <Text style={[s.modalTitle, { color: theme.text, marginLeft: 8 }]}>
                  {isAdmin ? "Payment Infrastructure" : isDealer ? "B2B Credit & Terms" : "Payment Methods"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {isAdmin ? (
                /* ADMIN GATEWAY TELEMETRY */
                <View>
                  <View style={[s.infoBox, { borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.08)" }]}>
                    <MaterialIcons name="check-circle" size={20} color="#10b981" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontWeight: "700", color: "#10b981" }}>Razorpay Gateway Connected</Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                        Key ID: rzp_test_TrHrkbqyzMD5i0 • Verified HMAC SHA-256 signatures
                      </Text>
                    </View>
                  </View>
                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <Text style={[s.payTitle, { color: theme.text }]}>Automated Settlement Schedule</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>T+1 Direct bank transfer to Califnco Commercial Account</Text>
                  </View>
                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <Text style={[s.payTitle, { color: theme.text }]}>Supported Consumer Rails</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>UPI (GPay/PhonePe), Credit & Debit Cards, Netbanking, COD</Text>
                  </View>
                </View>
              ) : isDealer ? (
                /* DEALER B2B CREDIT TERMS */
                <View>
                  <View style={[s.infoBox, { borderColor: "#0284c7", backgroundColor: "rgba(2, 132, 199, 0.08)" }]}>
                    <MaterialIcons name="account-balance-wallet" size={20} color="#0284c7" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontWeight: "800", color: "#0284c7" }}>Approved Credit Line: ₹5,00,000</Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                        Payment Terms: Net-30 Days on certified GST e-invoices
                      </Text>
                    </View>
                  </View>
                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <Text style={[s.payTitle, { color: theme.text }]}>🏛️ NEFT / RTGS Bank Transfer</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                      A/C: Califnco Water Systems Pvt Ltd{"\n"}HDFC Bank Current A/C: 50200088921132{"\n"}IFSC: HDFC0001092
                    </Text>
                  </View>
                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <Text style={[s.payTitle, { color: theme.text }]}>💳 Instant Online Payment</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                      Supported for zero-fee instant supply dispatches via Razorpay B2B Portal.
                    </Text>
                  </View>
                </View>
              ) : (
                /* CUSTOMER PAYMENT METHODS */
                <View>
                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons name="qr-code-scanner" size={20} color="#00b4d8" />
                      <Text style={[s.payTitle, { color: theme.text, marginLeft: 8 }]}>UPI (Google Pay, PhonePe, Paytm)</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      Instant contactless checkout with UPI auto-verify.
                    </Text>
                  </View>

                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons name="credit-card" size={20} color="#00b4d8" />
                      <Text style={[s.payTitle, { color: theme.text, marginLeft: 8 }]}>Credit & Debit Cards</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      Visa, Mastercard, RuPay, Maestro supported with 256-bit encryption.
                    </Text>
                  </View>

                  <View style={[s.payMethodItem, { borderColor: theme.border }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons name="local-atm" size={20} color="#10b981" />
                      <Text style={[s.payTitle, { color: theme.text, marginLeft: 8 }]}>Cash on Delivery (COD)</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      Pay verified Califnco technician upon doorstep purifier installation.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: Notifications Hub */}
      {/* ======================================================== */}
      <Modal visible={notificationsModalVisible} transparent animationType="slide" onRequestClose={() => setNotificationsModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.card }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="notifications-active" size={24} color="#00b4d8" />
                <Text style={[s.modalTitle, { color: theme.text, marginLeft: 8 }]}>Notifications Hub</Text>
              </View>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={[s.label, { color: theme.text, marginBottom: 8 }]}>Preferences</Text>
              <View style={[s.toggleRow, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.toggleTitle, { color: theme.text }]}>Order Tracking & Status</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Live dispatch & delivery push alerts</Text>
                </View>
                <Switch value={notifyOrders} onValueChange={setNotifyOrders} trackColor={{ false: "#cbd5e1", true: "#00b4d8" }} />
              </View>

              <View style={[s.toggleRow, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.toggleTitle, { color: theme.text }]}>Technician & Service Alerts</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Scheduled visit arrivals and filter reminders</Text>
                </View>
                <Switch value={notifyService} onValueChange={setNotifyService} trackColor={{ false: "#cbd5e1", true: "#00b4d8" }} />
              </View>

              <View style={[s.toggleRow, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.toggleTitle, { color: theme.text }]}>Exclusive Offers & Rewards</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Promotions and referral bonuses</Text>
                </View>
                <Switch value={notifyOffers} onValueChange={setNotifyOffers} trackColor={{ false: "#cbd5e1", true: "#00b4d8" }} />
              </View>

              <Text style={[s.label, { color: theme.text, marginTop: 16, marginBottom: 8 }]}>Recent Alerts</Text>
              <View style={[s.recentNotice, { borderColor: theme.border, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }]}>
                <MaterialIcons name="verified" size={18} color="#10b981" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text }}>Profile Verified</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>Welcome to Califnco Water Systems mobile ecosystem.</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: Role-Tailored Help & Support */}
      {/* ======================================================== */}
      <Modal visible={supportModalVisible} transparent animationType="slide" onRequestClose={() => setSupportModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.card }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="headset-mic" size={24} color="#00b4d8" />
                <Text style={[s.modalTitle, { color: theme.text, marginLeft: 8 }]}>
                  {isAdmin ? "System Operations Desk" : isDealer ? "Dealer Priority Line" : "Customer Support"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <TouchableOpacity
                style={[s.supportBtn, { backgroundColor: "#0284c7" }]}
                onPress={() => Linking.openURL("tel:18002679000")}
              >
                <MaterialIcons name="call" size={20} color="#fff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.supportBtnTitle}>Toll-Free Helpline: 1800-267-9000</Text>
                  <Text style={s.supportBtnSub}>Available 24x7 for purifiers & water quality</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.supportBtn, { backgroundColor: "#10b981", marginTop: 10 }]}
                onPress={() => Linking.openURL("https://wa.me/919876543210")}
              >
                <MaterialIcons name="chat" size={20} color="#fff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.supportBtnTitle}>WhatsApp Instant Support</Text>
                  <Text style={s.supportBtnSub}>Chat with certified service technicians</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.supportBtn, { backgroundColor: "#0f172a", marginTop: 10 }]}
                onPress={() => Linking.openURL("mailto:support@califnco.com")}
              >
                <MaterialIcons name="mail-outline" size={20} color="#fff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.supportBtnTitle}>Email: support@califnco.com</Text>
                  <Text style={s.supportBtnSub}>Direct executive support ticketing</Text>
                </View>
              </TouchableOpacity>

              {isCustomer && (
                <TouchableOpacity
                  style={[s.serviceShortcutBtn, { borderColor: "#00b4d8" }]}
                  onPress={() => {
                    setSupportModalVisible(false);
                    navigation?.navigate ? navigation.navigate("Service") : null;
                  }}
                >
                  <MaterialIcons name="handyman" size={20} color="#00b4d8" />
                  <Text style={{ color: "#00b4d8", fontWeight: "800", marginLeft: 8 }}>
                    Book Technician Doorstep Visit
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: About Califnco */}
      {/* ======================================================== */}
      <Modal visible={aboutModalVisible} transparent animationType="slide" onRequestClose={() => setAboutModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.card }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name="water-drop" size={24} color="#00b4d8" />
                <Text style={[s.modalTitle, { color: theme.text, marginLeft: 8 }]}>About Califnco</Text>
              </View>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#00b4d8" }}>Pure Water, Better Life</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 19 }}>
                Califnco Water Systems is a leader in advanced residential and commercial multi-stage RO, UV, and UF water purification technology.
              </Text>

              <View style={{ marginTop: 14 }}>
                <View style={s.certRow}>
                  <MaterialIcons name="verified" size={16} color="#10b981" />
                  <Text style={[s.certText, { color: theme.text }]}>ISO 9001:2015 Quality Management Certified</Text>
                </View>
                <View style={s.certRow}>
                  <MaterialIcons name="verified" size={16} color="#10b981" />
                  <Text style={[s.certText, { color: theme.text }]}>NSF/ANSI 58 Standard Filtration Membranes</Text>
                </View>
                <View style={s.certRow}>
                  <MaterialIcons name="verified" size={16} color="#10b981" />
                  <Text style={[s.certText, { color: theme.text }]}>Water Quality Association (WQA) Gold Seal</Text>
                </View>
              </View>

              <View style={[s.versionCard, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderColor: theme.border }]}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text }}>Califnco Mobile App</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>Version 1.0.0 (Release Build) • Production Ready</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  avatarWrap: { alignItems: "center", paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: "#00b4d8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#0d2b4d",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 26, fontWeight: "900", color: "#00b4d8", letterSpacing: 1 },
  profileName: { fontSize: 22, fontWeight: "900", color: "#ffffff", letterSpacing: -0.3, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "rgba(255, 255, 255, 0.75)", marginBottom: 10 },
  roleBadgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  roleBadge: { backgroundColor: "rgba(0, 180, 216, 0.18)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { color: "#00b4d8", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  // Role Operations Hub
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  sectionSubtext: { fontSize: 11, marginTop: 2 },
  adminGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  adminTile: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  adminTileTitle: { fontSize: 13, fontWeight: "800", marginTop: 8 },
  adminTileSub: { fontSize: 11, marginTop: 2 },

  // Menu Card
  menuCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4 },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 180, 216, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  menuDivider: { height: 1, marginHorizontal: 4 },

  card: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, padding: 18, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  themeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  themeInfo: { flex: 1, paddingRight: 12 },
  themeTitleRow: { flexDirection: "row", alignItems: "center" },
  themeSubtext: { fontSize: 12, marginTop: 4 },
  referralCard: { borderWidth: 1.5 },
  referralHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  referralIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  referralTitle: { fontSize: 16, fontWeight: "800" },
  referralSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  codeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  codeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  codeText: { fontSize: 16, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { fontSize: 12, fontWeight: "700" },
  referralActions: { marginBottom: 4 },
  shareInviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 25 },
  shareInviteBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  cardTitle: { fontSize: 15, fontWeight: "800" },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  editToggleBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  saveBtn: { backgroundColor: "#00b4d8", borderRadius: 25, height: 46, alignItems: "center", justifyContent: "center", marginTop: 6 },
  saveText: { color: "#fff", fontWeight: "800" },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderRadius: 25,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { fontWeight: "800", fontSize: 15, color: "#ef4444" },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 37, 64, 0.65)",
    justifyContent: "flex-end"
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  savedAddressCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  defaultBadge: { backgroundColor: "#00b4d8", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  infoBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  payMethodItem: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  payTitle: { fontSize: 13, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  toggleTitle: { fontSize: 13, fontWeight: "700" },
  recentNotice: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  supportBtn: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14 },
  supportBtnTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  supportBtnSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  serviceShortcutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 25, height: 46, marginTop: 14 },
  certRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  certText: { fontSize: 12, fontWeight: "600", marginLeft: 8 },
  versionCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 14 }
});
