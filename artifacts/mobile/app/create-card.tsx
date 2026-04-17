import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CreateCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ arabic?: string; english?: string; deckId?: string }>();
  const { decks, createCard } = useApp();

  const [arabic, setArabic] = useState(params.arabic || "");
  const [english, setEnglish] = useState(params.english || "");
  const [context, setContext] = useState("");
  const [grammarNotes, setGrammarNotes] = useState("");
  const [dialect, setDialect] = useState<"MSA" | "Egyptian">("MSA");
  const [selectedDeckId, setSelectedDeckId] = useState(params.deckId || (decks[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSave() {
    if (!arabic.trim() || !english.trim() || !selectedDeckId) return;
    setSaving(true);
    try {
      await createCard({
        arabic: arabic.trim(),
        english: english.trim(),
        context: context.trim(),
        grammarNotes: grammarNotes.trim(),
        dialect,
        deckId: selectedDeckId,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const canSave = arabic.trim() && english.trim() && selectedDeckId;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Flashcard</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave || saving}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.saveText, { color: canSave ? colors.primary : colors.mutedForeground }]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Arabic Word *</Text>
          <TextInput
            value={arabic}
            onChangeText={setArabic}
            placeholder="الكلمة العربية"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.arabicInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            textAlign="right"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>English Translation *</Text>
          <TextInput
            value={english}
            onChangeText={setEnglish}
            placeholder="English translation"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Context Sentence (optional)</Text>
          <TextInput
            value={context}
            onChangeText={setContext}
            placeholder="Example sentence using this word..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.multiInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Grammar Notes (optional)</Text>
          <TextInput
            value={grammarNotes}
            onChangeText={setGrammarNotes}
            placeholder="Verb form, gender, plural, etc."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.multiInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Dialect</Text>
          <View style={styles.row}>
            {(["MSA", "Egyptian"] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  {
                    borderColor: dialect === d ? colors.primary : colors.border,
                    backgroundColor: dialect === d ? colors.primary + "22" : colors.card,
                  },
                ]}
                onPress={() => setDialect(d)}
              >
                <Text style={[styles.chipText, { color: dialect === d ? colors.primary : colors.mutedForeground }]}>
                  {d === "MSA" ? "Modern Standard" : "Egyptian"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Deck *</Text>
          {decks.length === 0 ? (
            <Text style={[styles.noDeckText, { color: colors.mutedForeground }]}>
              No decks yet. Go back and create one first.
            </Text>
          ) : (
            <View style={styles.deckList}>
              {decks.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  style={[
                    styles.deckOption,
                    {
                      borderColor: selectedDeckId === deck.id ? colors.primary : colors.border,
                      backgroundColor: selectedDeckId === deck.id ? colors.primary + "22" : colors.card,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDeckId(deck.id);
                    setDialect(deck.dialect);
                  }}
                >
                  <Text style={[styles.deckOptionText, { color: selectedDeckId === deck.id ? colors.primary : colors.foreground }]}>
                    {deck.name}
                  </Text>
                  <Text style={[styles.deckDialect, { color: colors.mutedForeground }]}>{deck.dialect}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveText: { fontSize: 16, fontWeight: "700" },
  content: { padding: 20, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  arabicInput: { fontSize: 22, textAlign: "right", writingDirection: "rtl", lineHeight: 34 },
  multiInput: { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  row: { flexDirection: "row", gap: 12 },
  chip: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: "center" },
  chipText: { fontSize: 13, fontWeight: "600" },
  deckList: { gap: 8 },
  deckOption: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deckOptionText: { fontSize: 15, fontWeight: "600" },
  deckDialect: { fontSize: 12 },
  noDeckText: { fontSize: 14, lineHeight: 22 },
});
