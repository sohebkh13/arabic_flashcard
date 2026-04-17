import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ArabicTextProps extends TextProps {
  size?: "small" | "medium" | "large" | "hero";
  color?: string;
}

export function ArabicText({ size = "medium", color, style, children, ...props }: ArabicTextProps) {
  const colors = useColors();
  const fontSize = size === "small" ? 18 : size === "medium" ? 26 : size === "large" ? 36 : 52;

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize,
          color: color || colors.foreground,
          lineHeight: fontSize * 1.6,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "System",
    textAlign: "right",
    writingDirection: "rtl",
    letterSpacing: 0.5,
  },
});
