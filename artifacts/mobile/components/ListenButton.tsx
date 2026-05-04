import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useState, useRef, useEffect } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ListenButtonProps {
  text: string;
  language: "ar" | "en";
  size?: number;
}

function useWebSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const getVoices = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  };

  const findVoice = (langCode: string) => {
    const voices = getVoices();
    if (!voices.length) return null;

    const langPrefix = langCode.split("-")[0].toLowerCase();

    // Exact match first
    let voice = voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase());
    if (voice) return voice;

    // Language prefix match
    voice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (voice) return voice;

    // For Arabic, try any voice that mentions "arabic" or "ar" in name
    if (langPrefix === "ar") {
      voice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("arabic") ||
          v.name.toLowerCase().includes("عرب") ||
          v.lang.toLowerCase().includes("ar")
      );
    }

    return voice || null;
  };

  const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve([]);
        return;
      }
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
        resolve(voices);
        return;
      }
      const handler = () => {
        const loaded = window.speechSynthesis.getVoices();
        voicesRef.current = loaded;
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(loaded);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      // Some browsers (old Safari) don't fire voiceschanged; force a timeout
      setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(window.speechSynthesis.getVoices());
      }, 2000);
    });
  };

  const speak = async (text: string, langCode: string, rate: number, onDone: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const voices = await loadVoices();
    console.log("[TTS] Available voices count:", voices.length);
    console.log("[TTS] Arabic voices:", voices.filter((v) => v.lang.toLowerCase().startsWith("ar")).map((v) => `${v.name} (${v.lang})`));

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate;
    utterance.onend = onDone;
    utterance.onerror = (err) => {
      console.error("[TTS] utterance error:", err);
      onDone();
    };

    const voice = findVoice(langCode);
    if (voice) {
      console.log("[TTS] Selected voice:", voice.name, voice.lang);
      utterance.voice = voice;
    } else {
      console.warn("[TTS] No voice found for", langCode, "— falling back to default. Arabic may not pronounce correctly.");
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Force load voices (Chrome lazily loads them)
      voicesRef.current = window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        stop();
      };
    }
    return () => {
      stop();
    };
  }, []);

  return { speak, stop };
}

export function ListenButton({ text, language, size = 20 }: ListenButtonProps) {
  const colors = useColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const webSpeech = useWebSpeech();

  const handlePress = async () => {
    if (!text) return;

    const langCode = language === "ar" ? "ar-SA" : "en-US";
    const rate = language === "ar" ? 0.8 : 1.0;

    if (Platform.OS === "web") {
      webSpeech.stop();
      setIsPlaying(true);
      await webSpeech.speak(text, langCode, rate, () => setIsPlaying(false));
    } else {
      // Native: use expo-speech
      await Speech.stop();
      setIsPlaying(true);
      Speech.speak(text, {
        language: langCode,
        rate,
        onDone: () => setIsPlaying(false),
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
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
