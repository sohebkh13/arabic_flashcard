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
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={!text} 
      style={{ opacity: text ? 1 : 0.5, padding: 6, minWidth: 32, height: 32, alignItems: "center", justifyContent: "center" }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.6}
    >
      {isPlaying ? (
        <Feather name="square" size={size} color={colors.primary} />
      ) : (
        <Feather name="volume-2" size={size} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}
