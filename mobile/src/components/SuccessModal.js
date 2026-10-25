import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Dimensions
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SuccessModal({
  visible,
  onClose,
  title = "Order Confirmed!",
  subtitle = "Your order has been placed and a technician has been assigned.",
  referenceNumber,
  referenceLabel = "Order Reference",
  primaryBtnText = "View Animated Receipt 🧾",
  onPrimaryPress,
  secondaryBtnText = "Continue",
  onSecondaryPress,
  iconName = "check-circle",
  iconColor = "#10b981",
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      slideAnim.setValue(60);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Glowing Animated Icon */}
          <View style={styles.iconRing}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: iconColor,
                },
              ]}
            />
            <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
              <MaterialIcons name={iconName} size={42} color="#ffffff" />
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Reference pill */}
          {referenceNumber && (
            <View style={styles.refContainer}>
              <Text style={styles.refLabel}>{referenceLabel}</Text>
              <Text style={styles.refCode}>#{referenceNumber.slice(-8).toUpperCase()}</Text>
            </View>
          )}

          {/* Primary Action Button */}
          {primaryBtnText && onPrimaryPress && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onPrimaryPress}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{primaryBtnText}</Text>
            </TouchableOpacity>
          )}

          {/* Secondary Action Button */}
          {secondaryBtnText && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onSecondaryPress || onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>{secondaryBtnText}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 37, 64, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: Math.min(360, SCREEN_WIDTH - 40),
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  iconRing: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  iconGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.35,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0a2540",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  refContainer: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refCode: {
    fontSize: 16,
    fontWeight: "900",
    color: "#00b4d8",
    letterSpacing: 1,
    marginTop: 2,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#00b4d8",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#00b4d8",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: "#00b4d8",
    fontSize: 14,
    fontWeight: "700",
  },
});
