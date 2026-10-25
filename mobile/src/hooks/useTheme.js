import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@califnco_theme_mode";

// Premium Light Palette
export const lightTheme = {
  isDark: false,
  primary: "#0a2540",       // deep navy
  primaryLight: "#1a3a5c",
  navyDeep: "#051b33",
  accent: "#00b4d8",        // bright cyan
  accentDark: "#0096c7",
  accentLight: "#e0f2fe",
  background: "#f8fafc",
  card: "#ffffff",
  cardElevated: "#ffffff",
  border: "#e2e8f0",
  cardBorder: "rgba(0, 180, 216, 0.12)",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  textOnPrimary: "#ffffff",
  headerBg: "#0a2540",
  headerText: "#ffffff",
  tabBarBg: "#ffffff",
  tabBarBorder: "#e2e8f0",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  inputBg: "#f8fafc",
  chipBg: "#e0f2fe",
  chipText: "#0369a1"
};

// Luxury Obsidian Dark Palette
export const darkTheme = {
  isDark: true,
  primary: "#00b4d8",       // vibrant cyan brand in dark
  primaryLight: "#48cae4",
  navyDeep: "#051b33",
  accent: "#00b4d8",
  accentDark: "#0077b6",
  accentLight: "rgba(0, 180, 216, 0.15)",
  background: "#070d19",    // ultra-dark obsidian blue
  card: "#0f172a",          // slate 900
  cardElevated: "#1e293b",  // slate 800
  border: "#1e293b",
  cardBorder: "rgba(0, 180, 216, 0.25)",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  textOnPrimary: "#070d19",
  headerBg: "#0f172a",
  headerText: "#f8fafc",
  tabBarBg: "#0f172a",
  tabBarBorder: "#1e293b",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#f87171",
  info: "#60a5fa",
  inputBg: "#1e293b",
  chipBg: "#0c4a6e",
  chipText: "#38bdf8"
};

const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {}
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    // Load persisted theme preference or default to systemScheme
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === "dark") {
          setIsDark(true);
        } else if (savedMode === "light") {
          setIsDark(false);
        } else {
          setIsDark(systemScheme === "dark");
        }
      })
      .catch((err) => console.warn("Could not load theme preference:", err.message));
  }, [systemScheme]);

  const toggleTheme = async () => {
    const nextMode = !isDark;
    setIsDark(nextMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode ? "dark" : "light");
    } catch (e) {
      console.warn("Could not save theme mode:", e.message);
    }
  };

  const setThemeMode = async (mode) => {
    const nextDark = mode === "dark";
    setIsDark(nextDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn("Could not save theme mode:", e.message);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
export default useTheme;
