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
import { translate } from "@/lib/deepl";
import { useColors } from "@/hooks/useColors";

interface TranslationPanelProps {
  initialText?: string;
  initialDirection?: "ar_to_en" | "en_to_ar";
  onSaveFlashcard?: (arabic: string, english: string) => void;
}

export function TranslationPanel({
  initialText = "",
  initialDirection = "ar_to_en",
  onSaveFlashcard,
}: TranslationPanelProps) {
  const colors = useColors();
  const [inputText, setInputText] = useState(initialText);
  const [translation, setTranslation] = useState("");
  const [direction, setDirection] = useState<"ar_to_en" | "en_to_ar">(initialDirection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isArabicMode = direction === "ar_to_en";
  const sourceLang = isArabicMode ? "Arabic" : "English";
  const targetLang = isArabicMode ? "English" : "Arabic";

  function handleSwapDirection() {
    const newDir: "ar_to_en" | "en_to_ar" = isArabicMode ? "en_to_ar" : "ar_to_en";
    setDirection(newDir);
    // Swap input and translation if there's already a result
    if (translation) {
      setInputText(translation);
      setTranslation(inputText);
    } else {
      setInputText("");
      setTranslation("");
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleTranslate() {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await translate(inputText.trim(), direction);
      setTranslation(result.translatedText);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError((e as Error).message || "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!translation) return;
    const arabic = isArabicMode ? inputText : translation;
    const english = isArabicMode ? translation : inputText;
    onSaveFlashcard?.(arabic, english);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={styles.container}>
      {/* Direction bar */}
      <View style={[styles.directionBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.langLabel}>
          <Text style={[styles.langText, { color: colors.foreground }]}>{sourceLang}</Text>
          {isArabicMode && <Text style={[styles.langSub, { color: colors.mutedForeground }]}>العربية</Text>}
        </View>
        <TouchableOpacity
          style={[styles.swapBtn, { backgroundColor: colors.primary }]}
          onPress={handleSwapDirection}
          activeOpacity={0.8}
        >
          <Feather name="repeat" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
        <View style={[styles.langLabel, { alignItems: "flex-end" }]}>
          <Text style={[styles.langText, { color: colors.foreground }]}>{targetLang}</Text>
          {!isArabicMode && <Text style={[styles.langSub, { color: colors.mutedForeground }]}>العربية</Text>}
        </View>
      </View>

      {/* Input */}
      <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={isArabicMode ? "اكتب كلمة عربية..." : "Type English word or phrase..."}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            isArabicMode && styles.arabicInput,
            { color: colors.foreground },
          ]}
          textAlign={isArabicMode ? "right" : "left"}
          multiline
          returnKeyType="done"
        />
        <View style={styles.inputActions}>
          <MicButton
            size={38}
            onTranscription={(text) => setInputText(text)}
            onError={(err) => setError(err)}
          />
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      {/* Translate button */}
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
            <Feather name="globe" size={16} color={colors.primaryForeground} />
            <Text style={[styles.translateBtnText, { color: colors.primaryForeground }]}>Translate</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Result */}
      {translation ? (
        <View style={[styles.resultBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {!isArabicMode ? (
            <ArabicText size="medium" color={colors.foreground}>{translation}</ArabicText>
          ) : (
            <Text style={[styles.resultText, { color: colors.foreground }]}>{translation}</Text>
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
  directionBar: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langLabel: {
    flex: 1,
    gap: 2,
  },
  langText: { fontSize: 15, fontWeight: "700" },
  langSub: { fontSize: 12 },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 90,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 60,
  },
  arabicInput: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputActions: { paddingTop: 4 },
  translateBtn: {
    borderRadius: 10,
    paddingVertical: 13,
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
    lineHeight: 20,
  },
});
