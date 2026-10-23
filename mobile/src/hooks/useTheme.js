import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@califnco_theme_mode";

// Premium Light Palette
export const lightTheme = {
  isDark: false,
  primary: "#0a2540",       // deep navy
  primaryLight: "#1a3a5c",
  accent: "#00b4d8",        // bright cyan
  accentDark: "#0096c7",
  background: "#f5f7fa",
  card: "#ffffff",
  cardElevated: "#ffffff",
  border: "#e2e8f0",
  text: "#1a202c",
  textSecondary: "#64748b",
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
  accent: "#00b4d8",
  accentDark: "#0077b6",
  background: "#070d19",    // ultra-dark obsidian blue
  card: "#0f172a",          // slate 900
  cardElevated: "#1e293b",  // slate 800
  border: "#1e293b",
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load persisted theme preference
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === "dark") {
          setIsDark(true);
        } else if (savedMode === "light") {
          setIsDark(false);
        }
      })
      .catch((err) => console.warn("Could not load theme preference:", err.message));
  }, []);

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
