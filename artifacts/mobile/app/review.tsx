import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArabicText } from "@/components/ArabicText";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Flashcard } from "@/lib/storage";
import { ReviewGrade, sm2Review } from "@/lib/sm2";
import { ListenButton } from "@/components/ListenButton";

export default function ReviewScreen() {
  const { deckId, mode } = useLocalSearchParams<{ deckId: string; mode?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cards, editCard } = useApp();

  const targetCards = cards.filter((c) => {
    if (deckId && c.deckId !== deckId) return false;
    if (mode === "revision") return true;
    return c.dueDate <= Date.now();
  });

  const [queue] = useState<Flashcard[]>(() => {
    const arr = [...targetCards];
    if (mode === "revision") {
      // Shuffle for revision practice
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    return arr;
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const flipProgress = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flipProgress.value < 0.5 ? 1 : 0,
    transform: [{ rotateX: `${flipProgress.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flipProgress.value >= 0.5 ? 1 : 0,
    transform: [{ rotateX: `${(flipProgress.value - 1) * 180}deg` }],
  }));

  const current = queue[currentIdx];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleFlip() {
    if (flipped) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowBack(true);
    flipProgress.value = withTiming(1, { duration: 350 });
    setFlipped(true);
  }

  async function handleGrade(grade: ReviewGrade) {
    if (!current) return;
    const updated = sm2Review(current, grade);
    await editCard(current.id, updated);
    Haptics.impactAsync(
      grade === 2
        ? Haptics.ImpactFeedbackStyle.Light
        : grade === 1
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy
    );

    flipProgress.value = 0;
    setFlipped(false);
    setShowBack(false);
    setReviewed((r) => r + 1);

    if (currentIdx + 1 >= queue.length) {
      setDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  if (queue.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Feather name="check-circle" size={56} color={colors.success || "#4caf7d"} />
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>
            {mode === "revision" ? "Deck is empty" : "All caught up!"}
          </Text>
          <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
            {mode === "revision" 
              ? "Add some cards to this deck to start revising."
              : "No cards due for review right now."}
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Back to Decks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Feather name="award" size={64} color={colors.primary} />
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Session Complete!</Text>
          <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
            Reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Back to Deck</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.progress, { color: colors.mutedForeground }]}>
          {currentIdx + 1} / {queue.length}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${((currentIdx) / queue.length) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={[styles.cardArea, { paddingBottom: bottomPad + 20 }]}>
        <TouchableOpacity
          style={[styles.flipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleFlip}
          activeOpacity={0.92}
        >
          {/* Conditionally render front or back to avoid absolute positioning collapse on native */}
          {!showBack ? (
            <Animated.View style={[styles.cardFace, frontStyle]}>
              <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap to reveal</Text>
              <ArabicText size="hero" color={colors.foreground}>
                {current?.arabic}
              </ArabicText>
              <View style={styles.listenWrapFront}>
                <ListenButton text={current?.arabic} language="ar" size={24} />
              </View>
              <View style={[styles.dialectPill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.dialectPillText, { color: colors.mutedForeground }]}>
                  {current?.dialect}
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.cardFace, backStyle]}>
              <View style={styles.backHeader}>
                <Text style={[styles.arabicSmall, { color: colors.mutedForeground }]}>
                  {current?.arabic}
                </Text>
                <ListenButton text={current?.arabic} language="ar" size={16} />
              </View>
              <View style={styles.backMain}>
                <Text style={[styles.englishMain, { color: colors.foreground }]}>
                  {current?.english}
                </Text>
                <ListenButton text={current?.english} language="en" size={20} />
              </View>
              {current?.grammarNotes ? (
                <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.notesLabel, { color: colors.mutedForeground }]}>Grammar</Text>
                  <Text style={[styles.notesText, { color: colors.foreground }]}>{current.grammarNotes}</Text>
                </View>
              ) : null}
              {current?.context ? (
                <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.notesLabel, { color: colors.mutedForeground }]}>Context</Text>
                  <Text style={[styles.notesText, { color: colors.foreground }]}>{current.context}</Text>
                </View>
              ) : null}
              {(current?.customFields || []).map((field) => (
                <View key={field.id} style={[styles.notesBox, { backgroundColor: colors.secondary }]}> 
                  <Text style={[styles.notesLabel, { color: colors.mutedForeground }]}>{field.name}</Text>
                  <Text style={[styles.notesText, { color: colors.foreground }]}>{field.value}</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </TouchableOpacity>

        {flipped && (
          <View style={styles.gradeRow}>
            <TouchableOpacity
              style={[styles.gradeBtn, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}
              onPress={() => handleGrade(0)}
            >
              <Feather name="refresh-cw" size={18} color={colors.destructive} />
              <Text style={[styles.gradeBtnText, { color: colors.destructive }]}>Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gradeBtn, { backgroundColor: colors.warning + "22", borderColor: colors.warning }]}
              onPress={() => handleGrade(1)}
            >
              <Feather name="minus" size={18} color={colors.warning} />
              <Text style={[styles.gradeBtnText, { color: colors.warning }]}>Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gradeBtn, { backgroundColor: (colors.success || "#4caf7d") + "22", borderColor: colors.success || "#4caf7d" }]}
              onPress={() => handleGrade(2)}
            >
              <Feather name="check" size={18} color={colors.success || "#4caf7d"} />
              <Text style={[styles.gradeBtnText, { color: colors.success || "#4caf7d" }]}>Easy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  placeholder: { width: 22 },
  progress: { fontSize: 15, fontWeight: "600" },
  progressBar: {
    height: 3,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  cardArea: {
    flex: 1,
    padding: 20,
    gap: 20,
    justifyContent: "center",
  },
  flipCard: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardFace: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  tapHint: { fontSize: 13, fontWeight: "500" },
  dialectPill: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dialectPillText: { fontSize: 12, fontWeight: "600" },
  listenWrapFront: { marginTop: -4 },
  backHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  backMain: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  arabicSmall: { fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  englishMain: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  notesBox: { borderRadius: 10, padding: 12, alignSelf: "stretch", gap: 4 },
  notesLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  notesText: { fontSize: 14, lineHeight: 20 },
  gradeRow: { flexDirection: "row", gap: 12 },
  gradeBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  gradeBtnText: { fontSize: 13, fontWeight: "700" },
  doneTitle: { fontSize: 26, fontWeight: "800" },
  doneText: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  doneBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  doneBtnText: { fontSize: 16, fontWeight: "700" },
});
