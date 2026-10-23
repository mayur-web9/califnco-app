import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Configure how incoming notifications are presented when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers device for FCM / Expo Push Notifications and saves token to users/{uid}.fcmToken
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<string|null>} - The registered push token
 */
export async function registerForPushNotificationsAsync(userId) {
  let token = null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Califnco Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00b4d8",
        sound: "default"
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[FCM] Push notification permissions not granted.");
        return null;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId ??
          "c0a650c0-157a-49d9-a232-318ed74a7a62";

        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId
        });
        token = pushTokenData?.data;
      } catch (expoErr) {
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken?.data;
        } catch (deviceErr) {
          console.log("[FCM] Running in Expo Go sandbox — using fallback token");
          token = `ExponentPushToken[dev_${userId.slice(0, 8)}]`;
        }
      }
    } else {
      // Simulator/Emulator dev fallback: generate identifiable dev token
      token = `ExponentPushToken[dev_${userId.slice(0, 8)}]`;
      console.log("[FCM] Running in simulator/emulator environment. Using dev token:", token);
    }

    if (token && userId) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date().toISOString()
      });
      console.log(`[FCM] Registered token for user ${userId}:`, token);
    }
  } catch (err) {
    console.warn("[FCM] Error in registerForPushNotificationsAsync:", err.message);
  }

  return token;
}
