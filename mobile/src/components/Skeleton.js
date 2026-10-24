import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import colors from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function Skeleton({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#e2e8f0",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonProductCard() {
  const cardWidth = (SCREEN_WIDTH - 48) / 2;
  return (
    <View style={[styles.productCard, { width: cardWidth }]}>
      <Skeleton width="100%" height={140} borderRadius={12} />
      <View style={{ padding: 10, gap: 8 }}>
        <Skeleton width="45%" height={14} borderRadius={6} />
        <Skeleton width="90%" height={16} borderRadius={6} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Skeleton width="50%" height={18} borderRadius={6} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonProductGrid({ count = 6 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={`skel-prod-${i}`} />
      ))}
    </View>
  );
}

export function SkeletonCatalogHeader() {
  return (
    <View style={styles.headerWrap}>
      <Skeleton width="100%" height={46} borderRadius={12} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`skel-chip-${i}`} width={i === 0 ? 50 : 80} height={34} borderRadius={20} />
        ))}
      </View>
    </View>
  );
}

export function SkeletonOrderItem() {
  return (
    <View style={styles.orderCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Skeleton width={110} height={18} borderRadius={6} />
        <Skeleton width={80} height={22} borderRadius={12} />
      </View>
      <Skeleton width="70%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={14} borderRadius={6} style={{ marginBottom: 14 }} />
      <View style={styles.divider} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <Skeleton width={80} height={14} borderRadius={6} />
        <Skeleton width={100} height={20} borderRadius={6} />
      </View>
    </View>
  );
}

export function SkeletonOrderList({ count = 4 }) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonOrderItem key={`skel-order-${i}`} />
      ))}
    </View>
  );
}

export function SkeletonServiceItem() {
  return (
    <View style={styles.orderCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Skeleton width={120} height={18} borderRadius={6} />
        <Skeleton width={75} height={22} borderRadius={12} />
      </View>
      <Skeleton width="85%" height={15} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} borderRadius={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
});

export default Skeleton;
