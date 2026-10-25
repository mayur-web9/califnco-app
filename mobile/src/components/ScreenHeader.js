import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

export default function ScreenHeader({
  title,
  subtitle,
  badgeText,
  badgeIcon = "verified",
  badgeColor = "#00b4d8",
  onBack,
  rightAction,
}) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[s.headerWrap, { backgroundColor: isDark ? "#0f172a" : "#0a2540" }]}>
      <View style={s.topRow}>
        <View style={s.leftCol}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="arrow-back-ios" size={18} color="#ffffff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ) : (
            <View style={s.brandLogoIcon}>
              <MaterialIcons name="water-drop" size={20} color="#00b4d8" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            {badgeText ? (
              <View style={[s.badgePill, { backgroundColor: "rgba(0, 180, 216, 0.18)" }]}>
                {badgeIcon ? <MaterialIcons name={badgeIcon} size={11} color={badgeColor} style={{ marginRight: 4 }} /> : null}
                <Text style={[s.badgeText, { color: badgeColor }]}>{badgeText.toUpperCase()}</Text>
              </View>
            ) : null}
            <Text style={s.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>

        {rightAction ? (
          <View style={s.rightCol}>{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headerWrap: {
    paddingTop: Platform.OS === "ios" ? 48 : 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  brandLogoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 180, 216, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 2,
  },
  rightCol: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
});
