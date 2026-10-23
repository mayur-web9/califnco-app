import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Configure how incoming notifications are presented when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
  const safeId = typeof userId === "string" && userId ? userId.slice(0, 8) : "guest";

  try {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === "expo";

    if (Platform.OS === "android" && !isExpoGo) {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Califnco Notifications",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#00b4d8",
        });
      } catch (chanErr) {
        // Suppress channel setup exception
      }
    }

    if (Device.isDevice && !isExpoGo) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
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
          token = `ExponentPushToken[dev_${safeId}]`;
        }
      }
    } else {
      // Expo Go sandbox / Simulator dev fallback: generate identifiable dev token
      token = `ExponentPushToken[dev_${safeId}]`;
    }

    if (token && userId) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString()
        });
      } catch (docErr) {
        // Ignore if user doc not yet created
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  return token;
}
