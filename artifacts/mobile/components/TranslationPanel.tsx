import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ArabicText } from "@/components/ArabicText";
import { MicButton } from "@/components/MicButton";
import { detectAndTranslate } from "@/lib/deepl";
import { useColors } from "@/hooks/useColors";

interface TranslationPanelProps {
  initialText?: string;
  onSaveFlashcard?: (arabic: string, english: string) => void;
  compact?: boolean;
}

export function TranslationPanel({ initialText = "", onSaveFlashcard, compact = false }: TranslationPanelProps) {
  const colors = useColors();
  const [inputText, setInputText] = useState(initialText);
  const [translation, setTranslation] = useState("");
  const [direction, setDirection] = useState<"ar_to_en" | "en_to_ar">("ar_to_en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTranslate() {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await detectAndTranslate(inputText.trim());
      setTranslation(result.translatedText);
      setDirection(result.direction);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError((e as Error).message || "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!translation) return;
    const arabic = direction === "ar_to_en" ? inputText : translation;
    const english = direction === "ar_to_en" ? translation : inputText;
    onSaveFlashcard?.(arabic, english);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const isArabicInput = /[\u0600-\u06FF]/.test(inputText);

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {isArabicInput ? (
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="اكتب كلمة عربية..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.arabicInput, { color: colors.foreground }]}
            textAlign="right"
            multiline
            returnKeyType="done"
          />
        ) : (
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type Arabic or English..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            multiline
            returnKeyType="done"
          />
        )}
        <View style={styles.inputActions}>
          <MicButton
            size={36}
            onTranscription={(text) => setInputText(text)}
            onError={(err) => setError(err)}
          />
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.translateBtn,
          { backgroundColor: colors.primary, opacity: loading || !inputText.trim() ? 0.6 : 1 },
        ]}
        onPress={handleTranslate}
        disabled={loading || !inputText.trim()}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <>
            <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
            <Text style={[styles.translateBtnText, { color: colors.primaryForeground }]}>Translate</Text>
          </>
        )}
      </TouchableOpacity>

      {translation ? (
        <View style={[styles.resultBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {direction === "ar_to_en" ? (
            <Text style={[styles.resultText, { color: colors.foreground }]}>{translation}</Text>
          ) : (
            <ArabicText size="medium" color={colors.foreground}>{translation}</ArabicText>
          )}

          {onSaveFlashcard ? (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.success || "#4caf7d" }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Feather name="bookmark" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Save as Flashcard</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  inputRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 80,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  arabicInput: {
    fontSize: 22,
    lineHeight: 36,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputActions: {
    paddingTop: 4,
  },
  translateBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  translateBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  resultBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  resultText: {
    fontSize: 18,
    lineHeight: 28,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
});
