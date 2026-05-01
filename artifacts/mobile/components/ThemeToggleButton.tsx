import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export function ThemeToggleButton() {
  const colors = useColors();
  const { resolvedTheme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = resolvedTheme === "dark";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: Math.max(insets.top + 10, 12),
          right: 14,
        },
      ]}
    >
      <Pressable
        onPress={() => void toggleTheme()}
        accessibilityRole="button"
        accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={[
          styles.button,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.background,
          },
        ]}
      >
        <Feather name={isDark ? "sun" : "moon"} size={15} color={colors.foreground} />
        <Text style={[styles.label, { color: colors.foreground }]}>
          {isDark ? "Light" : "Dark"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 999,
    elevation: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});