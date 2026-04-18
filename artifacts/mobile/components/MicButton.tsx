import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface MicButtonProps {
  onTranscription: (text: string) => void;
  onError?: (err: string) => void;
  size?: number;
  language?: "ar" | "en";
}

// Voice recognition via the device's native speech input.
// On Android, this uses the system SpeechRecognizer (Google Voice) built into Expo Go.
// No extra packages or native builds needed.
let SpeechRecognition: typeof window.SpeechRecognition | null = null;
if (Platform.OS === "web" && typeof window !== "undefined") {
  SpeechRecognition =
    (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition ||
    null;
}

export function MicButton({ onTranscription, onError, size = 48, language = "ar" }: MicButtonProps) {
  const colors = useColors();
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (listening) {
      scale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
    return () => {
      if (!listening && recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
    };
  }, [listening, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    if (Platform.OS === "web" && SpeechRecognition) {
      if (listening) {
        recognizerRef.current?.stop();
        setListening(false);
        return;
      }
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const recognizer = new SpeechRecognition!();
        recognizerRef.current = recognizer;
        // Force specific locale to ensure proper script (e.g., ar-SA for Arabic script instead of transliteration)
        recognizer.lang = language === "ar" ? "ar-SA" : "en-US";
        recognizer.interimResults = false;
        recognizer.maxAlternatives = 1;
        recognizer.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          onTranscription(transcript);
          setListening(false);
        };
        recognizer.onerror = () => {
          setListening(false);
          onError?.("Voice recognition failed. Try typing instead.");
        };
        recognizer.onend = () => setListening(false);
        recognizer.start();
        setListening(true);
      } catch {
        onError?.("Could not start voice recognition.");
      }
      return;
    }

    // On Android/iOS in Expo Go: native speech recognition requires EAS build.
    // Show a clear tip — users can still tap the mic key on their keyboard.
    Alert.alert(
      "Voice Input",
      "On your phone, tap the mic icon on the keyboard for voice input — it uses Google's built-in speech recognition.\n\nFull Whisper support (no internet needed) comes with a native build.",
      [{ text: "Got it" }]
    );
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: listening ? colors.destructive : colors.primary,
          },
        ]}
      >
        <Feather
          name={listening ? "square" : "mic"}
          size={size * 0.42}
          color={colors.primaryForeground}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
