import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  ready: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_KEY = "arabic_flashcards_theme_mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    readStoredThemeMode().then((storedMode) => {
      if (!mounted) return;
      if (storedMode) {
        setThemeModeState(storedMode);
      }
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedTheme: ResolvedTheme =
    themeMode === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await writeStoredThemeMode(mode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    await setThemeMode(nextMode);
  }, [resolvedTheme, setThemeMode]);

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, ready, setThemeMode, toggleTheme }),
    [themeMode, resolvedTheme, ready, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}