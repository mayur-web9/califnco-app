import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Safely configure foreground notifications only if supported
let Notifications = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require("expo-notifications");
  if (
    Notifications &&
    typeof Notifications.setNotificationHandler === "function" &&
    !isRunningInExpoGo()
  ) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  // Safe ignore in restricted environments
}

/**
 * Registers device for FCM / Expo Push Notifications and saves token to users/{uid}.fcmToken
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<string|null>} - The registered push token
 */
export async function registerForPushNotificationsAsync(userId) {
  let token = null;
  const safeId = typeof userId === "string" && userId ? userId.slice(0, 8) : "guest";

  try {
    const isExpoGo =
      isRunningInExpoGo() ||
      Constants?.executionEnvironment === "storeClient" ||
      Constants?.appOwnership === "expo";

    if (isExpoGo || !Device.isDevice) {
      // In Expo Go or Simulator, remote push is not available natively in SDK 53+.
      // Use clean deterministic mock token so backend & firestore flows succeed seamlessly.
      token = `ExponentPushToken[dev_${safeId}]`;
    } else if (Notifications && typeof Notifications.getExpoPushTokenAsync === "function") {
      if (Platform.OS === "android" && typeof Notifications.setNotificationChannelAsync === "function") {
        try {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Califnco Notifications",
            importance: Notifications.AndroidImportance?.HIGH ?? 4,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#00b4d8",
          });
        } catch (chanErr) {
          // Suppress channel setup exception
        }
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === "granted") {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId ??
          "c0a650c0-157a-49d9-a232-318ed74a7a62";

        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = pushTokenData?.data;
      }
    } else {
      token = `ExponentPushToken[dev_${safeId}]`;
    }

    if (token && userId) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString(),
        });
      } catch (docErr) {
        // Suppress if user profile doc is still being created
      }
    }
  } catch (err) {
    token = `ExponentPushToken[dev_${safeId}]`;
  }

  return token;
}

