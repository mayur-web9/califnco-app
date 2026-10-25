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

  // Sync activeTab whenever order changes
  useEffect(() => {
    if (order) {
      setActiveTab("current");
    }
  }, [order?.id, visible]);

  // Map real order if provided
  let realInvoiceData = null;
  if (order) {
    const isBulk = order.type === "bulk" || order.type === "wholesale";
    const formattedItems = (order.items || []).map((it, idx) => ({
      name: it.name || it.productName || it.productId || `Water Filtration Item #${idx + 1}`,
      qty: Number(it.qty || 1),
      price: Number(it.price || (order.total && (order.items || []).length === 1 ? order.total : 0))
    }));

    let orderDate = new Date().toISOString();
    if (order.createdAt?.toDate) {
      orderDate = order.createdAt.toDate().toISOString();
    } else if (order.createdAt?.seconds) {
      orderDate = new Date(order.createdAt.seconds * 1000).toISOString();
    } else if (typeof order.createdAt === "string") {
      orderDate = order.createdAt;
    }

    const shortId = (order.id || `ORD-${Date.now()}`).slice(-8).toUpperCase();

    realInvoiceData = {
      theme: isBulk ? "neutral" : "success",
      title: isBulk ? "Califnco B2B Wholesale" : "Califnco Water Purifiers",
      subtitle: isBulk ? "Wholesale Tax Invoice & Dispatch Manifest" : "Retail Purchase & Installation Receipt",
      invoiceId: order.id ? (order.id.startsWith("CF-") ? order.id : `CF-${shortId}`) : `CF-${shortId}`,
      amount: Number(order.total || order.amount || 0),
      currency: "INR",
      date: orderDate,
      status: (order.status || "confirmed").toLowerCase(),
      payer: {
        name: order.address?.name || order.userName || order.customerName || (isBulk ? "Verified Wholesale Partner" : "Retail Customer"),
        method: isBulk ? "B2B Netbanking / IMPS Verified" : (order.paymentId ? "Razorpay Gateway" : "Online Prepaid"),
        last4: order.paymentId ? order.paymentId.slice(-4) : "4242",
      },
      items: formattedItems,
      verificationCode: `CF-${shortId}-AUTH`,
    };
  }

  const currentData =
    order && realInvoiceData
      ? realInvoiceData
      : activeTab === "current" && realInvoiceData
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
              <Text style={styles.topTitle}>🧾 {order ? "Official Order Invoice" : "Receipt Printer"}</Text>
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

          {/* Tab Selector ONLY shown in standalone demo mode when no real order is active */}
          {!order && (
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "sample1" && styles.tabBtnActive]}
                onPress={() => setActiveTab("sample1")}
              >
                <Text style={[styles.tabBtnText, activeTab === "sample1" && styles.tabBtnTextActive]}>
                  Sample: Retail
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "sample2" && styles.tabBtnActive]}
                onPress={() => setActiveTab("sample2")}
              >
                <Text style={[styles.tabBtnText, activeTab === "sample2" && styles.tabBtnTextActive]}>
                  Sample: B2B Wholesale
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
