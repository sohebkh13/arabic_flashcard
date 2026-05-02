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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { convertRomanizedToArabic, isLikelyRomanizedArabic } from "@/lib/deepl";

import { CopyButton } from "@/components/CopyButton";
import { ListenButton } from "@/components/ListenButton";
import { MicButton } from "@/components/MicButton";

interface CustomFieldDraft {
  id: string;
  name: string;
  value: string;
}

function createDraftField(): CustomFieldDraft {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    name: "",
    value: "",
  };
}

export default function CreateCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ arabic?: string; english?: string; deckId?: string }>();
  const { decks, createCard, createDeck } = useApp();

  const [arabic, setArabic] = useState(params.arabic || "");
  const [english, setEnglish] = useState(params.english || "");
  const [newDeckName, setNewDeckName] = useState("");
  const [context, setContext] = useState("");
  const [grammarNotes, setGrammarNotes] = useState("");
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState(params.deckId || (decks[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [normalizingArabic, setNormalizingArabic] = useState(false);
  const [micError, setMicError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSave() {
    if (!arabic.trim() || !english.trim() || !selectedDeckId) return;
    setSaving(true);
    try {
      const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
      let arabicValue = arabic.trim();
      if (isLikelyRomanizedArabic(arabicValue)) {
        arabicValue = await convertRomanizedToArabic(arabicValue);
        setArabic(arabicValue);
      }

      const normalizedCustomFields = customFields
        .map((field) => ({
          id: field.id,
          name: field.name.trim(),
          value: field.value.trim(),
        }))
        .filter((field) => field.name.length > 0 && field.value.length > 0);

      await createCard({
        arabic: arabicValue,
        english: english.trim(),
        context: context.trim(),
        grammarNotes: grammarNotes.trim(),
        dialect: selectedDeck?.dialect || "MSA",
        customFields: normalizedCustomFields,
        deckId: selectedDeckId,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleNormalizeArabicInput() {
    if (!isLikelyRomanizedArabic(arabic)) return;
    setNormalizingArabic(true);
    setMicError("");
    try {
      const normalized = await convertRomanizedToArabic(arabic);
      setArabic(normalized);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setMicError((e as Error).message || "Could not convert to Arabic script");
    } finally {
      setNormalizingArabic(false);
    }
  }

  async function handleArabicMic(text: string) {
    setMicError("");
    if (!isLikelyRomanizedArabic(text)) {
      setArabic(text);
      return;
    }

    setNormalizingArabic(true);
    try {
      const normalized = await convertRomanizedToArabic(text);
      setArabic(normalized);
    } catch {
      setArabic(text);
      setMicError("Voice text captured. Tap the type icon to convert transliteration into Arabic script.");
    } finally {
      setNormalizingArabic(false);
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

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Arabic Word *</Text>
            <View style={styles.labelActions}>
              <CopyButton text={arabic} size={15} />
              <ListenButton text={arabic} language="ar" size={16} />
              {isLikelyRomanizedArabic(arabic) && (
                <TouchableOpacity
                  onPress={handleNormalizeArabicInput}
                  style={styles.iconBtn}
                  disabled={normalizingArabic}
                >
                  {normalizingArabic ? (
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                  ) : (
                    <Feather name="type" size={16} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              )}
              <MicButton
                size={28}
                language="ar"
                onTranscription={handleArabicMic}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
          <TextInput
            value={arabic}
            onChangeText={setArabic}
            placeholder="الكلمة العربية"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.arabicInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            textAlign="right"
          />
          {micError ? (
            <Text style={[styles.micError, { color: colors.destructive }]}>{micError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>English Translation *</Text>
            <View style={styles.labelActions}>
              <CopyButton text={english} size={15} />
              <ListenButton text={english} language="en" size={16} />
              <MicButton
                size={28}
                language="en"
                onTranscription={(text) => {
                  setMicError("");
                  setEnglish(text);
                }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
          <TextInput
            value={english}
            onChangeText={setEnglish}
            placeholder="English translation"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Context Sentence (optional)</Text>
            <View style={styles.labelActions}>
              <CopyButton text={context} size={15} />
              <MicButton
                size={28}
                language="en"
                onTranscription={(text) => {
                  setMicError("");
                  setContext(text);
                }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
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
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Grammar Notes (optional)</Text>
            <View style={styles.labelActions}>
              <CopyButton text={grammarNotes} size={15} />
              <MicButton
                size={28}
                language="en"
                onTranscription={(text) => {
                  setMicError("");
                  setGrammarNotes(text);
                }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
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
          </View>
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
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Grammar Notes (optional)</Text>
            <View style={styles.labelActions}>
              <CopyButton text={grammarNotes} size={15} />
              <MicButton
                size={28}
                language={userLanguage}
                onTranscription={(text) => {
                  setMicError("");
                  setGrammarNotes(text);
                }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
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
          <View style={styles.dynamicHeaderRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Extra Fields</Text>
            <TouchableOpacity
              style={[styles.addFieldBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setCustomFields((prev) => [...prev, createDraftField()])}
            >
              <Feather name="plus" size={14} color={colors.foreground} />
              <Text style={[styles.addFieldText, { color: colors.foreground }]}>Add field</Text>
            </TouchableOpacity>
          </View>

          {customFields.length === 0 ? (
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Add custom fields to match imported deck structures.</Text>
          ) : null}

          {customFields.map((field, index) => (
            <View key={field.id} style={[styles.customFieldBox, { borderColor: colors.border, backgroundColor: colors.card }]}> 
              <View style={styles.customFieldTitleRow}>
                <Text style={[styles.customFieldTitle, { color: colors.mutedForeground }]}>Field {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCustomFields((prev) => prev.filter((item) => item.id !== field.id));
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <TextInput
                value={field.name}
                onChangeText={(text) => {
                  setCustomFields((prev) =>
                    prev.map((item) => (item.id === field.id ? { ...item, name: text } : item))
                  );
                }}
                placeholder="Field name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.compactInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              />
              <TextInput
                value={field.value}
                onChangeText={(text) => {
                  setCustomFields((prev) =>
                    prev.map((item) => (item.id === field.id ? { ...item, value: text } : item))
                  );
                }}
                placeholder="Field value"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.multiInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
                multiline
                numberOfLines={3}
              />
            </View>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Deck *</Text>
          {decks.length > 0 && (
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
                  }}
                >
                  <Text style={[styles.deckOptionText, { color: selectedDeckId === deck.id ? colors.primary : colors.foreground }]}>
                    {deck.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={[styles.newDeckRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="Or create new deck..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.newDeckInput, { color: colors.foreground }]}
            />
            {newDeckName.trim().length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  const deck = await createDeck(newDeckName.trim(), "MSA");
                  setNewDeckName("");
                  setSelectedDeckId(deck.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.createDeckBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={16} color={colors.primaryForeground} />
                <Text style={[styles.createDeckBtnText, { color: colors.primaryForeground }]}>Create</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
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
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  iconBtn: { padding: 4 },
  micError: { fontSize: 12, lineHeight: 18 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  arabicInput: { fontSize: 22, textAlign: "right", writingDirection: "rtl", lineHeight: 34 },
  multiInput: { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  compactInput: { minHeight: 44 },
  dynamicHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addFieldBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addFieldText: { fontSize: 13, fontWeight: "600" },
  helperText: { fontSize: 12, lineHeight: 18 },
  customFieldBox: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 8 },
  customFieldTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  customFieldTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
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
  noDeckText: { fontSize: 14, lineHeight: 22 },
  newDeckRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 4,
  },
  newDeckInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
  },
  createDeckBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createDeckBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
