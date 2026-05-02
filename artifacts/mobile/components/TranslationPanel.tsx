import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ArabicText } from "@/components/ArabicText";
import { CopyButton } from "@/components/CopyButton";
import { ListenButton } from "@/components/ListenButton";
import { MicButton } from "@/components/MicButton";
import { convertRomanizedToArabic, isLikelyRomanizedArabic, translate, transliterateArabicToLatin } from "@/lib/deepl";
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
  const [romanizedTranslation, setRomanizedTranslation] = useState("");
  const [direction, setDirection] = useState<"ar_to_en" | "en_to_ar">(initialDirection);
  const [loading, setLoading] = useState(false);
  const [normalizingArabic, setNormalizingArabic] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const isArabicMode = direction === "ar_to_en";
  const sourceLang = isArabicMode ? "Arabic" : "English";
  const targetLang = isArabicMode ? "English" : "Arabic";

  useEffect(() => {
    const trimmed = inputText.trim();
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    if (!trimmed) {
      setTranslation("");
      setRomanizedTranslation("");
      setError("");
      setLoading(false);
      setNormalizingArabic(false);
      return () => controller.abort();
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError("");
        try {
          let sourceText = trimmed;
          if (isArabicMode && isLikelyRomanizedArabic(sourceText)) {
            setNormalizingArabic(true);
            sourceText = await convertRomanizedToArabic(sourceText, controller.signal);
          }

          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          const result = await translate(sourceText, direction, controller.signal);
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;

          setTranslation(result.translatedText);
          setRomanizedTranslation(isArabicMode ? transliterateArabicToLatin(result.translatedText) : "");
        } catch (e: unknown) {
          if ((e as Error).name === "AbortError") return;
          if (requestId !== requestIdRef.current) return;
          setTranslation("");
          setRomanizedTranslation("");
          setError((e as Error).message || "Translation failed");
        } finally {
          if (!controller.signal.aborted && requestId === requestIdRef.current) {
            setLoading(false);
            setNormalizingArabic(false);
          }
        }
      })();
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timeout);
      requestIdRef.current += 1;
    };
  }, [inputText, direction, isArabicMode]);

  function handleSwapDirection() {
    const newDir: "ar_to_en" | "en_to_ar" = isArabicMode ? "en_to_ar" : "ar_to_en";
    setDirection(newDir);
    if (translation) {
      setInputText(translation);
    } else {
      setInputText("");
    }
    setTranslation("");
    setRomanizedTranslation("");
    setError("");
    setLoading(false);
    setNormalizingArabic(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleClear() {
    setInputText("");
    setTranslation("");
    setRomanizedTranslation("");
    setError("");
    setLoading(false);
    setNormalizingArabic(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleNormalizeArabicInput() {
    if (!isArabicMode || !isLikelyRomanizedArabic(inputText)) return;
    setNormalizingArabic(true);
    setError("");
    try {
      const normalized = await convertRomanizedToArabic(inputText);
      setInputText(normalized);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError((e as Error).message || "Could not convert to Arabic script");
    } finally {
      setNormalizingArabic(false);
    }
  }

  async function handleArabicTranscription(text: string) {
    if (!text.trim()) return;
    setError("");
    if (!isArabicMode || !isLikelyRomanizedArabic(text)) {
      setInputText(text);
      return;
    }

    setNormalizingArabic(true);
    try {
      const normalized = await convertRomanizedToArabic(text);
      setInputText(normalized);
    } catch {
      setInputText(text);
      setError("Voice text captured. Tap convert to change transliteration into Arabic script.");
    } finally {
      setNormalizingArabic(false);
    }
  }

  function handleSave() {
    if (!translation) return;
    const arabic = isArabicMode ? inputText : translation;
    const english = isArabicMode ? translation : inputText;
    onSaveFlashcard?.(arabic, english);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const liveStatusText = loading ? "Translating live..." : "Live translation updates as you type.";

  return (
    <View style={styles.container}>
      {/* Direction bar */}
      <View style={[styles.directionBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.langLabel}>
          <Text style={[styles.langText, { color: colors.foreground }]}>{sourceLang}</Text>
          {isArabicMode && (
            <Text style={[styles.langSub, { color: colors.mutedForeground }]}>العربية</Text>
          )}
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
          {!isArabicMode && (
            <Text style={[styles.langSub, { color: colors.mutedForeground }]}>العربية</Text>
          )}
        </View>
      </View>

      <Text style={[styles.helperText, { color: colors.mutedForeground }]}>{liveStatusText}</Text>

      {/* Input box */}
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
          {inputText.length > 0 && (
            <TouchableOpacity 
              onPress={handleClear} 
              style={styles.clearBtn} 
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.6}
            >
              <Feather name="x-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {inputText.length > 0 && <CopyButton text={inputText} size={18} />}
          {inputText.length > 0 && (
            <ListenButton text={inputText} language={isArabicMode ? "ar" : "en"} size={18} />
          )}
          {isArabicMode && isLikelyRomanizedArabic(inputText) && (
            <TouchableOpacity
              onPress={handleNormalizeArabicInput}
              style={styles.transBtn}
              disabled={normalizingArabic}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.6}
            >
              {normalizingArabic ? (
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              ) : (
                <Feather name="type" size={17} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          )}
          <MicButton
            size={38}
            language={isArabicMode ? "ar" : "en"}
            onTranscription={(text) => {
              if (isArabicMode) {
                handleArabicTranscription(text);
              } else {
                setInputText(text);
              }
            }}
            onError={(err) => setError(err)}
          />
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      {/* Result */}
      {translation ? (
        <View style={[styles.resultBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.resultRow}>
            <View style={styles.resultTextWrap}>
              {!isArabicMode ? (
                <ArabicText size="medium" color={colors.foreground}>{translation}</ArabicText>
              ) : (
                <Text style={[styles.resultText, { color: colors.foreground }]}>{translation}</Text>
              )}
            </View>
            <View style={styles.resultActions}>
              <CopyButton text={translation} size={18} />
              <ListenButton text={translation} language={!isArabicMode ? "ar" : "en"} size={22} />
            </View>
          </View>

          {isArabicMode && romanizedTranslation ? (
            <Text style={[styles.romanizedText, { color: colors.mutedForeground }]}>{romanizedTranslation}</Text>
          ) : null}

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
  langLabel: { flex: 1, gap: 2 },
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
    gap: 8,
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
  inputActions: {
    paddingTop: 4,
    alignItems: "center",
    gap: 12,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  clearBtn: { 
    padding: 6,
    minWidth: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  transBtn: {
    padding: 6,
    minWidth: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  translateBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  translateBtnText: { fontSize: 15, fontWeight: "600" },
  resultBox: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 14 },
  resultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultTextWrap: { flex: 1, paddingRight: 10 },
  resultActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultText: { fontSize: 18, lineHeight: 28 },
  romanizedText: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  errorText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
