import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity,
  Dimensions, ScrollView, Platform, Share, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";
import { formatPrice, formatDate } from "../utils/formatPrice";

// Safe import of expo-print and expo-sharing
let Print = null;
let Sharing = null;
try {
  Print = require("expo-print");
  Sharing = require("expo-sharing");
} catch (e) {
  // Graceful fallback for non-native web environments
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RECEIPT_WIDTH = Math.min(320, SCREEN_WIDTH - 48);

// Confetti Particle Component
function ConfettiParticle({ index, active }) {
  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;
  const animRotate = useRef(new Animated.Value(0)).current;

  const confettiColors = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4", "#eab308"];
  const color = confettiColors[index % confettiColors.length];
  const isCircle = index % 2 === 0;

  useEffect(() => {
    if (!active) {
      animY.setValue(0);
      animX.setValue(0);
      animScale.setValue(0);
      animOpacity.setValue(1);
      return;
    }

    const angle = (index / 20) * Math.PI * 2;
    const distance = 40 + Math.random() * 85;
    const targetX = Math.cos(angle) * distance;
    const targetY = 30 + Math.sin(angle) * 70;

    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(animX, {
        toValue: targetX,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animY, {
        toValue: targetY,
        duration: 900,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(animRotate, {
        toValue: (Math.random() - 0.5) * 6,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          borderRadius: isCircle ? 6 : 2,
          width: isCircle ? 8 : 10,
          height: isCircle ? 8 : 6,
          opacity: animOpacity,
          transform: [
            { translateX: animX },
            { translateY: animY },
            { scale: animScale },
            {
              rotate: animRotate.interpolate({
                inputRange: [-3, 3],
                outputRange: ["-180deg", "180deg"],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/**
 * PrintedReceipt Component
 * Reusable, data-driven animated receipt printer component
 */
export default function PrintedReceipt({
  theme = "success", // "success" | "neutral"
  title = "Califnco Water Purifiers",
  subtitle = "Order Receipt & Warranty Certificate",
  invoiceId = "INV-89421",
  amount = 18999,
  currency = "INR",
  date = new Date().toISOString(),
  status = "paid", // "paid" | "confirmed" | "pending" | "failed"
  payer = {
    name: "Customer",
    method: "UPI / Card",
    last4: "4242",
  },
  items = [],
  verificationCode = "CF-992-AUTH-8821",
  reducedMotion = false,
  onComplete,
  onClose,
}) {
  const [printStage, setPrintStage] = useState(reducedMotion ? "finished" : "idle");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);

  // Animation values
  const slotOpacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const ledBlink = useRef(new Animated.Value(1)).current;
  const paperTranslateY = useRef(new Animated.Value(reducedMotion ? 0 : -380)).current;
  const paperTilt = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  const isSuccess = theme === "success";

  // Printer slot colors based on theme
  const slotGradient = isSuccess
    ? {
        bg: "#d97706",
        border: "#f59e0b",
        accent: "#fbbf24",
        glow: "rgba(245, 158, 11, 0.4)",
        led: "#22c55e",
      }
    : {
        bg: "#334155",
        border: "#64748b",
        accent: "#94a3b8",
        glow: "rgba(100, 116, 139, 0.3)",
        led: "#38bdf8",
      };

  function runPrintSequence() {
    if (reducedMotion) {
      slotOpacity.setValue(1);
      paperTranslateY.setValue(0);
      contentFade.setValue(1);
      setPrintStage("finished");
      if (onComplete) onComplete();
      return;
    }

    // Reset
    setIsRetracting(false);
    setShowConfetti(false);
    slotOpacity.setValue(0);
    paperTranslateY.setValue(-380);
    contentFade.setValue(0);
    setPrintStage("slot_enter");

    // 1. LED Blinks and slot appears (200ms)
    Animated.parallel([
      Animated.timing(slotOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ledBlink, { toValue: 0.2, duration: 150, useNativeDriver: true }),
          Animated.timing(ledBlink, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        { iterations: 4 }
      ),
    ]).start(() => {
      // 2. Receipt prints out (slides down smoothly with ease-out, 1500ms)
      setPrintStage("printing");
      Animated.parallel([
        Animated.timing(paperTranslateY, {
          toValue: 0,
          duration: 1600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 1400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPrintStage("finished");
        // 3. Fire confetti burst for success theme
        if (isSuccess && (status === "paid" || status === "confirmed")) {
          setShowConfetti(true);
        }

        // 4. Subtle idle paper spring sway
        Animated.sequence([
          Animated.spring(paperTilt, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(paperTilt, {
            toValue: 0,
            friction: 5,
            tension: 30,
            useNativeDriver: true,
          }),
        ]).start();

        if (onComplete) onComplete();
      });
    });
  }

  // Trigger print sequence on mount
  useEffect(() => {
    runPrintSequence();
  }, [invoiceId]);

  // Replay transition
  function handleReplay() {
    setIsRetracting(true);
    setShowConfetti(false);
    Animated.timing(paperTranslateY, {
      toValue: -380,
      duration: 500,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      runPrintSequence();
    });
  }

  // Generate and Download PDF Invoice via native Print Spooler (supports direct "Save as PDF" & WiFi printing)
  async function handleDownloadPdf() {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Califnco Invoice #${invoiceId}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              max-width: 480px;
              margin: auto;
              padding: 24px;
              color: #1e293b;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #cbd5e1;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }
            .logo {
              font-size: 26px;
              font-weight: 900;
              color: #0a2540;
              letter-spacing: -0.5px;
            }
            .sub {
              font-size: 13px;
              color: #64748b;
              margin-top: 4px;
              font-weight: 600;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 13px;
            }
            .label {
              color: #64748b;
              font-weight: 600;
            }
            .val {
              font-weight: 700;
              color: #0f172a;
            }
            .val-mono {
              font-family: monospace;
              font-weight: 700;
              color: #0a2540;
            }
            .amount {
              font-size: 24px;
              font-weight: 900;
              color: #00b4d8;
              text-align: right;
              margin: 12px 0;
            }
            .status {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              background: #dcfce7;
              color: #15803d;
            }
            .items {
              margin: 16px 0;
              border-top: 1px dashed #cbd5e1;
              border-bottom: 1px dashed #cbd5e1;
              padding: 12px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
              font-size: 13px;
            }
            .footer {
              text-align: center;
              margin-top: 24px;
              font-size: 11px;
              color: #94a3b8;
              letter-spacing: 0.5px;
              line-height: 1.6;
            }
            .barcode {
              font-family: monospace;
              font-size: 18px;
              letter-spacing: 4px;
              font-weight: 900;
              margin: 12px 0 6px 0;
              color: #0a2540;
            }
            .stamp {
              border: 2px solid #10b981;
              color: #10b981;
              font-weight: 800;
              text-transform: uppercase;
              padding: 4px 8px;
              border-radius: 4px;
              display: inline-block;
              font-size: 11px;
              letter-spacing: 1px;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">💧 CALIFNCO</div>
            <div class="sub">${title}</div>
            <div class="sub">${subtitle}</div>
          </div>
          <div class="row">
            <span class="label">Invoice ID:</span>
            <span class="val-mono">#${invoiceId}</span>
          </div>
          <div class="row">
            <span class="label">Date & Time:</span>
            <span class="val">${formatDate(date)}</span>
          </div>
          <div class="row">
            <span class="label">Payer:</span>
            <span class="val">${payer?.name || "Customer"}</span>
          </div>
          <div class="row">
            <span class="label">Payment Mode:</span>
            <span class="val">${payer?.method || "Razorpay Verified"} (${payer?.last4 ? `•••• ${payer.last4}` : "Instant"})</span>
          </div>
          <div class="items">
            ${
              items && items.length > 0
                ? items
                    .map(
                      (item) => `
              <div class="item-row">
                <span><strong>${item.name}</strong> × ${item.qty}</span>
                <span>Rs. ${Number(item.price * item.qty).toLocaleString("en-IN")}</span>
              </div>`
                    )
                    .join("")
                : `<div class="item-row"><span>Standard Purifier / Product Order</span><span>Rs. ${Number(amount).toLocaleString("en-IN")}</span></div>`
            }
          </div>
          <div class="row" style="align-items: center;">
            <span class="status">${status.toUpperCase()}</span>
            <div class="amount">Rs. ${Number(amount).toLocaleString("en-IN")}</div>
          </div>
          <div class="footer">
            <div class="barcode">|| | ||| || |||| | ||||| | |||</div>
            <div>VERIFICATION: <strong>${verificationCode}</strong></div>
            <div><span class="stamp">VERIFIED OFFICIAL INVOICE</span></div>
            <div style="margin-top: 8px;">SCAN TO VERIFY AUTHENTICITY • PURE WATER DELIVERED</div>
          </div>
        </body>
      </html>
    `;

    try {
      if (Print && typeof Print.printAsync === "function") {
        // Direct native Android/iOS print spooler with "Save as PDF" download option
        await Print.printAsync({ html: htmlContent });
        return;
      }

      // Fallback: If printAsync is not available on this platform, try printToFileAsync + sharing
      if (Print && typeof Print.printToFileAsync === "function") {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        if (Sharing && typeof Sharing.isAvailableAsync === "function" && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
          return;
        }
      }

      // Secondary fallback: React Native Share
      await handleShareText();
    } catch (err) {
      const isCancelled =
        err?.message?.toLowerCase().includes("cancel") ||
        err?.message?.toLowerCase().includes("dismiss");
      if (!isCancelled) {
        console.warn("Invoice print notice:", err?.message);
        Alert.alert(
          "Download Invoice",
          "Unable to launch native print service on this device. Would you like to share the invoice text summary instead?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Share Summary", onPress: handleShareText },
          ]
        );
      }
    }
  }

  // Quick share invoice summary
  async function handleShareText() {
    try {
      await Share.share({
        message: `💧 Califnco Official Invoice #${invoiceId}\nAmount: Rs. ${Number(amount).toLocaleString("en-IN")}\nStatus: ${status.toUpperCase()}\nDate: ${formatDate(date)}\nCustomer: ${payer?.name || "Customer"}\nAuth Verification: ${verificationCode}\n\nCalifnco Pure Water Delivered.`,
        title: `Invoice #${invoiceId}`,
      });
    } catch (err) {
      console.warn("Share notice:", err?.message);
    }
  }

  // Pill style based on status
  const statusColorMap = {
    paid: { bg: "#dcfce7", text: "#15803d", label: "Paid in Full ✓" },
    confirmed: { bg: "#e0f2fe", text: "#0369a1", label: "Confirmed ✓" },
    pending: { bg: "#fef3c7", text: "#b45309", label: "Processing ⏳" },
    failed: { bg: "#fee2e2", text: "#b91c1c", label: "Payment Failed ✗" },
  };
  const currentStatus = statusColorMap[status] || statusColorMap.confirmed;

  return (
    <View style={styles.outerContainer}>
      {/* Action Toolbar Header */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={handleReplay} activeOpacity={0.75}>
          <MaterialIcons name="replay" size={17} color="#fff" />
          <Text style={styles.toolBtnText}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolBtn, styles.toolBtnPrimary]} onPress={handleDownloadPdf} activeOpacity={0.75}>
          <MaterialIcons name="download" size={18} color="#fff" />
          <Text style={styles.toolBtnText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={handleShareText} activeOpacity={0.75}>
          <MaterialIcons name="share" size={17} color="#fff" />
          <Text style={styles.toolBtnText}>Share</Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Printer Unit Wrapper */}
      <View style={[styles.printerRig, { width: RECEIPT_WIDTH + 20 }]}>
        {/* 1. Printer Slot Bar */}
        <Animated.View
          style={[
            styles.printerSlot,
            {
              backgroundColor: slotGradient.bg,
              borderColor: slotGradient.border,
              opacity: slotOpacity,
            },
          ]}
        >
          {/* Metallic Highlight Bar */}
          <View style={[styles.slotHighlight, { backgroundColor: slotGradient.accent }]} />

          {/* Slot Title / Branding */}
          <View style={styles.slotBranding}>
            <MaterialIcons name="print" size={15} color="#ffffff" style={{ opacity: 0.9 }} />
            <Text style={styles.slotBrandingText}>CALIFNCO RECEIPT FEED</Text>
          </View>

          {/* Status LED */}
          <Animated.View
            style={[
              styles.led,
              {
                backgroundColor: slotGradient.led,
                opacity: ledBlink,
                shadowColor: slotGradient.led,
              },
            ]}
          />

          {/* The Output Slit (Dark inset where receipt emerges) */}
          <View style={styles.slit} />
        </Animated.View>

        {/* Confetti Explosion Source (Centered directly under the slit) */}
        <View style={styles.confettiEmitter}>
          {Array.from({ length: 24 }).map((_, i) => (
            <ConfettiParticle key={`confetti-${i}`} index={i} active={showConfetti} />
          ))}
        </View>

        {/* 2. Clipping Mask Window for Receipt Feed */}
        <View style={[styles.paperFeedWindow, { width: RECEIPT_WIDTH }]}>
          <Animated.View
            style={[
              styles.receiptPaper,
              {
                width: RECEIPT_WIDTH,
                transform: [
                  { translateY: paperTranslateY },
                  {
                    rotate: paperTilt.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ["-1.5deg", "0deg", "1.5deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View style={{ opacity: contentFade, flex: 1 }}>
              {/* Header Badge */}
              <View style={styles.header}>
                <View style={[styles.badgeIcon, { backgroundColor: isSuccess ? "#00b4d8" : "#475569" }]}>
                  <Text style={styles.badgeEmoji}>💧</Text>
                </View>
                <Text style={styles.receiptTitle}>{title}</Text>
                <Text style={styles.receiptSubtitle}>{subtitle}</Text>
              </View>

              {/* Dashed Tear Line with Notches */}
              <View style={styles.tearLineWrap}>
                <View style={[styles.tearNotch, styles.tearNotchLeft]} />
                <View style={styles.dashedBorder} />
                <View style={[styles.tearNotch, styles.tearNotchRight]} />
              </View>

              {/* Details Two-Column Grid */}
              <View style={styles.detailsGrid}>
                {/* Left Column */}
                <View style={styles.colLeft}>
                  <Text style={styles.metaLabel}>ORDER / INVOICE</Text>
                  <Text style={styles.metaValueMono}>#{invoiceId.slice(-8).toUpperCase()}</Text>

                  <Text style={[styles.metaLabel, { marginTop: 10 }]}>DATE & TIME</Text>
                  <Text style={styles.metaValue}>{formatDate(date)}</Text>
                </View>

                {/* Right Column */}
                <View style={styles.colRight}>
                  <View style={[styles.statusPill, { backgroundColor: currentStatus.bg }]}>
                    <Text style={[styles.statusPillText, { color: currentStatus.text }]}>
                      {currentStatus.label}
                    </Text>
                  </View>
                  <Text style={styles.amountTotal}>{formatPrice(amount)}</Text>
                </View>
              </View>

              {/* Items Breakdown */}
              {items && items.length > 0 && (
                <View style={styles.itemsBox}>
                  {items.map((it, idx) => (
                    <View key={`item-${idx}`} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {it.name} <Text style={{ color: colors.textMuted }}>x{it.qty}</Text>
                      </Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(it.price * it.qty)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Payment Method Chip */}
              <View style={styles.paymentChip}>
                <MaterialIcons name="credit-card" size={18} color="#475569" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.payerName} numberOfLines={1}>
                    {payer?.name || "Customer"}
                  </Text>
                  <Text style={styles.payerMethod}>
                    {payer?.method || "Card / UPI"} •••• {payer?.last4 || "4242"}
                  </Text>
                </View>
                <MaterialIcons name="verified" size={16} color="#16a34a" />
              </View>

              {/* Footer with Monospace Barcode */}
              <View style={styles.footer}>
                <Text style={styles.barcodeLines}>||| | || |||| | ||||| | || ||| | ||||</Text>
                <Text style={styles.barcodeCode}>{verificationCode}</Text>
                <Text style={styles.caption}>SCAN TO VERIFY AUTHENTICITY</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  toolBtnPrimary: {
    backgroundColor: "#00b4d8",
    borderColor: "#38bdf8",
  },
  toolBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  closeBtn: {
    marginLeft: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 6,
    borderRadius: 20,
  },
  printerRig: {
    alignItems: "center",
    position: "relative",
  },
  printerSlot: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    position: "relative",
  },
  slotHighlight: {
    position: "absolute",
    top: 4,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 2,
    opacity: 0.7,
  },
  slotBranding: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slotBrandingText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  led: {
    position: "absolute",
    right: 16,
    top: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  slit: {
    position: "absolute",
    bottom: -1,
    left: 12,
    right: 12,
    height: 5,
    backgroundColor: "#090d16",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#020617",
  },
  confettiEmitter: {
    position: "absolute",
    top: 45,
    alignSelf: "center",
    width: 2,
    height: 2,
    zIndex: 20,
  },
  confettiPiece: {
    position: "absolute",
  },
  paperFeedWindow: {
    overflow: "hidden",
    alignItems: "center",
    marginTop: -4,
    paddingTop: 4,
    paddingBottom: 20,
  },
  receiptPaper: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  receiptSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    textAlign: "center",
  },
  tearLineWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -20,
    marginVertical: 14,
    position: "relative",
  },
  dashedBorder: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  tearNotch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0a2540", // blends with modal backdrop
  },
  tearNotchLeft: {
    marginLeft: -8,
  },
  tearNotchRight: {
    marginRight: -8,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  colLeft: {
    flex: 1,
  },
  colRight: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 2,
  },
  metaValueMono: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  amountTotal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0a2540",
  },
  itemsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  payerName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
  },
  payerMethod: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    color: "#64748b",
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  barcodeLines: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 15,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: 2,
  },
  barcodeCode: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  caption: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
