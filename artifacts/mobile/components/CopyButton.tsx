import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CopyButtonProps {
  text: string;
  size?: number;
  onCopied?: () => void;
}

export function CopyButton({ text, size = 16, onCopied }: CopyButtonProps) {
  const colors = useColors();

  async function handleCopy() {
    const value = text.trim();
    if (!value) return;
    await Clipboard.setStringAsync(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCopied?.();
  }

  return (
    <TouchableOpacity
      onPress={handleCopy}
      style={{ padding: 6, opacity: text.trim() ? 1 : 0.45, minWidth: 32, height: 32, alignItems: "center", justifyContent: "center" }}
      disabled={!text.trim()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel="Copy text"
    >
      <Feather name="copy" size={size} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
