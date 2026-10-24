import React, { useState } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, SafeAreaView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import PrintedReceipt from "./PrintedReceipt";
import colors from "../constants/colors";

const SAMPLE_SUCCESS = {
  theme: "success",
  title: "Califnco Water Purifiers",
  subtitle: "B2C Retail Purchase & Warranty Receipt",
  invoiceId: "CF-RET-90412",
  amount: 24999,
  currency: "INR",
  date: new Date().toISOString(),
  status: "paid",
  payer: {
    name: "Ananya Sharma",
    method: "Razorpay / Cards",
    last4: "8842",
  },
  items: [
    { name: "Califnco Smart Copper RO 10L", qty: 1, price: 21999 },
    { name: "Bio-Alkaline Mineral Cartridge", qty: 1, price: 3000 },
  ],
  verificationCode: "CALIF-AUTH-90412-V2",
};

const SAMPLE_NEUTRAL = {
  theme: "neutral",
  title: "Califnco B2B Wholesale",
  subtitle: "Tier-1 Dealer Wholesale Invoice",
  invoiceId: "CF-WHL-33108",
  amount: 142500,
  currency: "INR",
  date: new Date(Date.now() - 86400000).toISOString(),
  status: "confirmed",
  payer: {
    name: "Rajesh Water Solutions",
    method: "B2B Netbanking / IMPS",
    last4: "1098",
  },
  items: [
    { name: "Califnco Alkaline Under-Sink RO", qty: 10, price: 12500 },
    { name: "Sediment Filter Cartridge Pack", qty: 25, price: 700 },
  ],
  verificationCode: "CALIF-B2B-AUTH-33108",
};

export default function InvoicePreviewModal({
  visible,
  onClose,
  order = null, // Optional real order data
}) {
  const [activeTab, setActiveTab] = useState(order ? "current" : "sample1");
  const [reducedMotion, setReducedMotion] = useState(false);

  // Map real order if provided
  let realInvoiceData = null;
  if (order) {
    realInvoiceData = {
      theme: order.type === "bulk" ? "neutral" : "success",
      title: order.type === "bulk" ? "Califnco B2B Wholesale" : "Califnco Water Purifiers",
      subtitle: order.type === "bulk" ? "Wholesale Order Invoice" : "Retail Purchase & Installation Receipt",
      invoiceId: order.id || `ORD-${Date.now().toString().slice(-6)}`,
      amount: order.total || 0,
      currency: "INR",
      date: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
      status: order.status === "confirmed" ? "confirmed" : order.status === "delivered" ? "paid" : "pending",
      payer: {
        name: order.address?.name || "Verified Customer",
        method: order.type === "bulk" ? "B2B Wholesale Invoice" : (order.paymentId ? "Razorpay Gateway" : "Online"),
        last4: order.paymentId ? order.paymentId.slice(-4) : "4242",
      },
      items: order.items || [],
      verificationCode: `CF-${(order.id || "ORD").slice(-8).toUpperCase()}-AUTH`,
    };
  }

  const currentData =
    activeTab === "current" && realInvoiceData
      ? realInvoiceData
      : activeTab === "sample1"
      ? SAMPLE_SUCCESS
      : SAMPLE_NEUTRAL;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.topTitle}>🧾 Animated Receipt Printer</Text>
              <TouchableOpacity
                style={[styles.motionBadge, reducedMotion && styles.motionBadgeActive]}
                onPress={() => setReducedMotion((p) => !p)}
              >
                <Text style={styles.motionBadgeText}>
                  {reducedMotion ? "Motion: Off" : "Motion: On"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector to cycle demo samples or view current order */}
          <View style={styles.tabSelector}>
            {realInvoiceData && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "current" && styles.tabBtnActive]}
                onPress={() => setActiveTab("current")}
              >
                <Text style={[styles.tabBtnText, activeTab === "current" && styles.tabBtnTextActive]}>
                  Current Order
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "sample1" && styles.tabBtnActive]}
              onPress={() => setActiveTab("sample1")}
            >
              <Text style={[styles.tabBtnText, activeTab === "sample1" && styles.tabBtnTextActive]}>
                Demo: Gold (Retail)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "sample2" && styles.tabBtnActive]}
              onPress={() => setActiveTab("sample2")}
            >
              <Text style={[styles.tabBtnText, activeTab === "sample2" && styles.tabBtnTextActive]}>
                Demo: Slate (B2B)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Printable Receipt Component */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <PrintedReceipt
              key={`${activeTab}-${currentData.invoiceId}-${reducedMotion}`}
              theme={currentData.theme}
              title={currentData.title}
              subtitle={currentData.subtitle}
              invoiceId={currentData.invoiceId}
              amount={currentData.amount}
              currency={currentData.currency}
              date={currentData.date}
              status={currentData.status}
              payer={currentData.payer}
              items={currentData.items}
              verificationCode={currentData.verificationCode}
              reducedMotion={reducedMotion}
              onClose={onClose}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 37, 64, 0.94)",
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  motionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  motionBadgeActive: {
    backgroundColor: "#f59e0b",
  },
  motionBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  closeIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tabSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  tabBtnActive: {
    backgroundColor: "#00b4d8",
    borderColor: "#38bdf8",
  },
  tabBtnText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: "center",
  },
});
