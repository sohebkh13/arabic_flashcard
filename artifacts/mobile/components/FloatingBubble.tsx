import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

interface FloatingBubbleProps {
  initialText?: string;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BUBBLE_SIZE = 56;

export function FloatingBubble({ initialText = "" }: FloatingBubbleProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bubblePos, setBubblePos] = useState({ x: SCREEN_W - BUBBLE_SIZE - 16, y: SCREEN_H * 0.45 });
  const posRef = useRef(bubblePos);

  const [popupVisible, setPopupVisible] = useState(false);
  const [inputText, setInputText] = useState(initialText);
  const [translation, setTranslation] = useState("");
  const [direction, setDirection] = useState<"ar_to_en" | "en_to_ar">("ar_to_en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(SCREEN_W - BUBBLE_SIZE, posRef.current.x + gestureState.dx));
        const newY = Math.max(insets.top + 8, Math.min(SCREEN_H - BUBBLE_SIZE - insets.bottom - 8, posRef.current.y + gestureState.dy));
        setBubblePos({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gestureState) => {
        const dist = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        const newX = Math.max(0, Math.min(SCREEN_W - BUBBLE_SIZE, posRef.current.x + gestureState.dx));
        const newY = Math.max(insets.top + 8, Math.min(SCREEN_H - BUBBLE_SIZE - insets.bottom - 8, posRef.current.y + gestureState.dy));
        // Snap to nearest edge
        const snapX = newX < SCREEN_W / 2 ? 8 : SCREEN_W - BUBBLE_SIZE - 8;
        posRef.current = { x: snapX, y: newY };
        setBubblePos({ x: snapX, y: newY });
        if (dist < 5) {
          // Treat as tap
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPopupVisible(true);
        }
      },
    })
  ).current;

  async function handleTranslate() {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await detectAndTranslate(inputText.trim());
      setTranslation(result.translatedText);
      setDirection(result.direction);
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
    setPopupVisible(false);
    setInputText("");
    setTranslation("");
    router.push({ pathname: "/create-card", params: { arabic, english } });
  }

  if (Platform.OS === "web") return null;

  const isArabicInput = /[\u0600-\u06FF]/.test(inputText);

  return (
    <>
      <View
        {...panResponder.panHandlers}
        style={[
          styles.bubble,
          {
            left: bubblePos.x,
            top: bubblePos.y,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Feather name="zap" size={26} color={colors.primaryForeground} />
      </View>

      <Modal
        visible={popupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPopupVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.dismissArea} onPress={() => setPopupVisible(false)} />
          <View style={[styles.popup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.popupHeader}>
              <Text style={[styles.popupTitle, { color: colors.foreground }]}>Quick Translate</Text>
              <TouchableOpacity onPress={() => setPopupVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={isArabicInput ? "اكتب كلمة..." : "Type a word..."}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  isArabicInput && styles.arabicInput,
                  { color: colors.foreground },
                ]}
                textAlign={isArabicInput ? "right" : "left"}
                autoFocus
                multiline={false}
              />
              <MicButton
                size={36}
                onTranscription={(t) => setInputText(t)}
                onError={(e) => setError(e)}
              />
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.translateBtn, { backgroundColor: colors.primary, opacity: loading || !inputText.trim() ? 0.6 : 1 }]}
              onPress={handleTranslate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Translate</Text>
              )}
            </TouchableOpacity>

            {translation ? (
              <View style={[styles.resultBox, { backgroundColor: colors.secondary }]}>
                {direction === "ar_to_en" ? (
                  <Text style={[styles.resultText, { color: colors.foreground }]}>{translation}</Text>
                ) : (
                  <ArabicText size="medium" color={colors.foreground}>{translation}</ArabicText>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.success || "#4caf7d" }]}
                  onPress={handleSave}
                >
                  <Feather name="bookmark" size={15} color="#fff" />
                  <Text style={styles.saveBtnText}>Save as Flashcard</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  popup: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  inputRow: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  arabicInput: {
    fontSize: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
  translateBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  resultBox: {
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  resultText: {
    fontSize: 18,
    lineHeight: 28,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
});
