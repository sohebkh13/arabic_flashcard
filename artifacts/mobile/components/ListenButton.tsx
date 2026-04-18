import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ListenButtonProps {
  text: string;
  language: "ar" | "en";
  size?: number;
}

export function ListenButton({ text, language, size = 20 }: ListenButtonProps) {
  const colors = useColors();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePress = async () => {
    if (!text) return;
    
    // Always stop any ongoing speech first so we can reliably replay
    await Speech.stop();
    setIsPlaying(true);
    
    // Configure voice based on language
    // AR for Arabic, en-US for English. iOS/Android handle these automatically.
    const langCode = language === "ar" ? "ar-SA" : "en-US";
    
    Speech.speak(text, {
      language: langCode,
      rate: language === "ar" ? 0.8 : 1.0, // Arabic sounds slightly better when slightly slower
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={!text} style={{ opacity: text ? 1 : 0.5, padding: 4 }}>
      {isPlaying ? (
        <Feather name="square" size={size} color={colors.primary} />
      ) : (
        <Feather name="volume-2" size={size} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}
