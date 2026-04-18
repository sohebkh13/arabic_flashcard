import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
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

type WebSpeechRecognitionResultItem = { transcript: string };
type WebSpeechRecognitionResult = { 0: WebSpeechRecognitionResultItem };
type WebSpeechRecognitionResultList = {
  length: number;
  [index: number]: WebSpeechRecognitionResult;
};
type WebSpeechRecognitionEvent = {
  resultIndex: number;
  results: WebSpeechRecognitionResultList;
};
type WebSpeechRecognitionErrorEvent = {
  error:
    | "aborted"
    | "audio-capture"
    | "bad-grammar"
    | "language-not-supported"
    | "network"
    | "no-speech"
    | "not-allowed"
    | "service-not-allowed"
    | string;
};
type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;

function getWebSpeechRecognitionCtor(): WebSpeechRecognitionConstructor | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const webWindow = window as unknown as {
    SpeechRecognition?: WebSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
  };
  return webWindow.SpeechRecognition ?? webWindow.webkitSpeechRecognition ?? null;
}

function isBraveBrowser(): boolean {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { brave?: unknown };
  return typeof nav.brave !== "undefined";
}

function getSpeechErrorMessage(errorCode: string, braveBrowser: boolean): string {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked. Allow mic access in your browser site settings and try again.";
    case "audio-capture":
      return "No microphone was detected. Check your input device and browser mic permissions.";
    case "no-speech":
      return "No speech detected. Try again and speak right after tapping the mic.";
    case "network":
      if (braveBrowser) {
        return "Brave is blocking the browser speech service. Turn Shields OFF for localhost, then retry. If it still fails, use Chrome/Safari for mic input, or macOS Dictation (press Fn twice).";
      }
      return "Speech recognition service is unreachable. Check internet, disable VPN/ad-blockers for localhost, and try again.";
    case "language-not-supported":
      return "This browser does not support the selected recognition language.";
    default:
      return "Voice recognition failed. Try again or type instead.";
  }
}

function getRecognitionLanguageCandidates(language: "ar" | "en"): string[] {
  if (language === "ar") {
    // Browsers differ in which Arabic locale tags are accepted.
    return ["ar", "ar-SA", "ar-EG"];
  }
  return ["en-US", "en", "en-GB"];
}

export function MicButton({ onTranscription, onError, size = 48, language = "ar" }: MicButtonProps) {
  const colors = useColors();
  const [listening, setListening] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const recognizerRef = useRef<WebSpeechRecognition | null>(null);
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
  }, [listening, scale]);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    if (Platform.OS === "web") {
      const braveBrowser = isBraveBrowser();

      if (speechUnavailable && braveBrowser) {
        onError?.(
          "Voice input is currently unavailable in Brave on this device. Use Chrome/Safari for built-in speech recognition, or use macOS Dictation (press Fn twice)."
        );
        return;
      }

      const SpeechRecognitionCtor = getWebSpeechRecognitionCtor();
      if (!SpeechRecognitionCtor) {
        onError?.("Speech recognition is not supported in this browser. Use Chrome or Safari.");
        return;
      }

      if (listening) {
        recognizerRef.current?.stop();
        return;
      }

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const languageCandidates = getRecognitionLanguageCandidates(language);

        const startRecognition = (candidateIndex: number) => {
          const recognizer = new SpeechRecognitionCtor();
          recognizerRef.current = recognizer;

          recognizer.lang = languageCandidates[candidateIndex];
          recognizer.continuous = false;
          recognizer.interimResults = true;
          recognizer.maxAlternatives = 1;

          recognizer.onstart = () => {
            setListening(true);
          };

          recognizer.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
              const piece = event.results[i]?.[0]?.transcript?.trim();
              if (piece) transcript = piece;
            }
            if (transcript) {
              onTranscription(transcript);
            }
          };

          recognizer.onerror = (event) => {
            if (event.error === "aborted") return;

            const canRetryWithNextLocale =
              (event.error === "network" || event.error === "language-not-supported") &&
              candidateIndex < languageCandidates.length - 1;

            if (canRetryWithNextLocale) {
              if (recognizerRef.current === recognizer) {
                recognizerRef.current = null;
              }
              setListening(false);
              startRecognition(candidateIndex + 1);
              return;
            }

            setListening(false);
            if (recognizerRef.current === recognizer) {
              recognizerRef.current = null;
            }
            if (event.error === "network" && braveBrowser) {
              setSpeechUnavailable(true);
            }
              onError?.(getSpeechErrorMessage(event.error, isBraveBrowser()));
          };

          recognizer.onend = () => {
            setListening(false);
            if (recognizerRef.current === recognizer) {
              recognizerRef.current = null;
            }
          };

          recognizer.start();
        };

        startRecognition(0);
      } catch {
        setListening(false);
        recognizerRef.current = null;
        onError?.("Could not start voice recognition. Check microphone permission and try again.");
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
