import { registerRootComponent } from "expo";
import App from "./App";

// Safeguard against unhandled native promise rejections (e.g. SDK notifications in Expo Go)
if (typeof global !== "undefined") {
  const originalHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    const msg = event?.reason?.message || String(event?.reason || "");
    if (
      msg.includes("Push notifications") ||
      msg.includes("expo-notifications") ||
      msg.includes("undefined is not a function")
    ) {
      // Suppress noisy native rejections in Expo Go
      return;
    }
    if (typeof originalHandler === "function") {
      originalHandler(event);
    }
  };
}

registerRootComponent(App);

