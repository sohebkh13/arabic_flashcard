import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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

const ARABIC_RE = /[؀-ۿ]/;
function hasArabic(text: string) { return ARABIC_RE.test(text); }

export default function CreateCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Accept both old (arabic/english) and new (front/back) params for backward compat
  const params = useLocalSearchParams<{ front?: string; back?: string; arabic?: string; english?: string; deckId?: string }>();
  const { decks, createCard, createDeck } = useApp();

  const [front, setFront] = useState(params.front || params.arabic || "");
  const [back, setBack] = useState(params.back || params.english || "");
  const [newDeckName, setNewDeckName] = useState("");
  const [context, setContext] = useState("");
  const [notes, setNotes] = useState("");
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(
    params.deckId ? [params.deckId] : []
  );
  const [saving, setSaving] = useState(false);
  const [micError, setMicError] = useState("");

  useEffect(() => {
    if (selectedDeckIds.length === 0 && decks.length > 0) {
      setSelectedDeckIds([decks[0].id]);
    }
  }, [decks]);

  useEffect(() => {
    if (params.front) setFront(params.front);
    else if (params.arabic) setFront(params.arabic);
    if (params.back) setBack(params.back);
    else if (params.english) setBack(params.english);
    if (params.deckId) setSelectedDeckIds([params.deckId]);
  }, [params.front, params.back, params.arabic, params.english, params.deckId]);

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function toggleDeck(deckId: string) {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
  }

  function resetForm() {
    setFront("");
    setBack("");
    setContext("");
    setNotes("");
    setCustomFields([]);
    setNewDeckName("");
    setMicError("");
    setSelectedDeckIds(decks[0] ? [decks[0].id] : []);
  }

  async function doSave() {
    const frontValue = front.trim();
    const normalizedCustomFields = customFields
      .map((field) => ({ id: field.id, name: field.name.trim(), value: field.value.trim() }))
      .filter((field) => field.name.length > 0 && field.value.length > 0);
    for (const deckId of selectedDeckIds) {
      const deck = decks.find((d) => d.id === deckId);
      await createCard({
        front: frontValue,
        back: back.trim(),
        context: context.trim(),
        grammarNotes: notes.trim(),
        dialect: deck?.dialect || "MSA",
        customFields: normalizedCustomFields,
        deckId,
      });
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await doSave();
      // back() returns to the deck page when coming from deck→create-card.
      // Fall back to home when opened directly via the tab bar (no deckId param).
      if (params.deckId) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await doSave();
      // Reset form fields but keep the deck selection for the next card
      setFront("");
      setBack("");
      setContext("");
      setNotes("");
      setCustomFields([]);
      setMicError("");
      setNewDeckName("");
    } finally {
      setSaving(false);
    }
  }

  function handleFrontMic(text: string) {
    setMicError("");
    setFront(text);
  }

  const canSave = front.trim() && back.trim() && selectedDeckIds.length > 0;
  const frontIsArabic = hasArabic(front);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            if (params.deckId) { router.back(); } else { router.replace("/(tabs)"); }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Card</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={handleSaveAndContinue}
            disabled={!canSave || saving}
            style={[styles.saveBtn, { backgroundColor: "transparent", borderColor: canSave ? colors.primary : colors.border }]}
          >
            <Text style={[styles.saveText, { color: canSave ? colors.primary : colors.mutedForeground }]}>Save +</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || saving}
            style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.secondary, borderColor: canSave ? colors.primary : colors.border }]}
          >
            {saving ? (
              <ActivityIndicator color={canSave ? colors.primaryForeground : colors.mutedForeground} size="small" />
            ) : (
              <Text style={[styles.saveText, { color: canSave ? colors.primaryForeground : colors.mutedForeground }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        {/* Front */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Front *</Text>
            <View style={styles.labelActions}>
              <CopyButton text={front} size={15} />
              <ListenButton text={front} language={frontIsArabic ? "ar" : "en"} size={16} />
              <MicButton
                size={28}
                language={frontIsArabic ? "ar" : "en"}
                onTranscription={handleFrontMic}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
          <TextInput
            value={front}
            onChangeText={setFront}
            placeholder="Term, word, question…"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              frontIsArabic && styles.rtlInput,
              { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground },
            ]}
            textAlign={frontIsArabic ? "right" : "left"}
          />
          {micError ? (
            <Text style={[styles.micError, { color: colors.destructive }]}>{micError}</Text>
          ) : null}
        </View>

        {/* Back */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Back *</Text>
            <View style={styles.labelActions}>
              <CopyButton text={back} size={15} />
              <ListenButton text={back} language="en" size={16} />
              <MicButton
                size={28}
                language="en"
                onTranscription={(text) => { setMicError(""); setBack(text); }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
          <TextInput
            value={back}
            onChangeText={setBack}
            placeholder="Definition, translation, answer…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
          />
        </View>

        {/* Context */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Context / Example (optional)</Text>
            <View style={styles.labelActions}>
              <CopyButton text={context} size={15} />
              <MicButton
                size={28}
                language="en"
                onTranscription={(text) => { setMicError(""); setContext(text); }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
          <TextInput
            value={context}
            onChangeText={setContext}
            placeholder="Use it in a sentence or give an example…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.multiInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
            <View style={styles.labelActions}>
              <CopyButton text={notes} size={15} />
              <MicButton
                size={28}
                language="en"
                onTranscription={(text) => { setMicError(""); setNotes(text); }}
                onError={(err) => setMicError(err)}
              />
            </View>
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Extra notes, hints, mnemonics…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.multiInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Extra fields */}
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

          {customFields.length === 0 && (
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Add extra fields to store additional data from imported decks.</Text>
          )}

          {customFields.map((field, index) => (
            <View key={field.id} style={[styles.customFieldBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={styles.customFieldTitleRow}>
                <Text style={[styles.customFieldTitle, { color: colors.mutedForeground }]}>Field {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => setCustomFields((prev) => prev.filter((item) => item.id !== field.id))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <TextInput
                value={field.name}
                onChangeText={(text) => setCustomFields((prev) => prev.map((item) => (item.id === field.id ? { ...item, name: text } : item)))}
                placeholder="Field name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.compactInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              />
              <TextInput
                value={field.value}
                onChangeText={(text) => setCustomFields((prev) => prev.map((item) => (item.id === field.id ? { ...item, value: text } : item)))}
                placeholder="Field value"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.multiInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
                multiline
                numberOfLines={3}
              />
            </View>
          ))}
        </View>

        {/* Deck selector */}
        <View style={styles.field}>
          <View style={styles.deckLabelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Deck *</Text>
            {selectedDeckIds.length > 1 && (
              <View style={[styles.multiDeckBadge, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.multiDeckBadgeText, { color: colors.primary }]}>
                  {selectedDeckIds.length} decks selected
                </Text>
              </View>
            )}
          </View>
          {decks.length > 0 && (
            <View style={styles.deckList}>
              {decks.map((deck) => {
                const selected = selectedDeckIds.includes(deck.id);
                return (
                  <TouchableOpacity
                    key={deck.id}
                    style={[
                      styles.deckOption,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary + "18" : colors.card,
                      },
                    ]}
                    onPress={() => toggleDeck(deck.id)}
                  >
                    <Text style={[styles.deckOptionText, { color: selected ? colors.primary : colors.foreground }]}>
                      {deck.name}
                    </Text>
                    <View style={[styles.deckCheckbox, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : "transparent" }]}>
                      {selected && <Feather name="check" size={12} color={colors.primaryForeground} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={[styles.newDeckRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="Or create new deck…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.newDeckInput, { color: colors.foreground }]}
            />
            {newDeckName.trim().length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  const deck = await createDeck(newDeckName.trim(), "MSA");
                  setNewDeckName("");
                  setSelectedDeckIds((prev) => [...prev, deck.id]);
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontSize: 15, fontWeight: "700" },
  content: { padding: 20, gap: 20 },
  field: { gap: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  iconBtn: { padding: 4 },
  micError: { fontSize: 12, lineHeight: 18 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  rtlInput: { fontSize: 22, writingDirection: "rtl", lineHeight: 34 },
  multiInput: { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  compactInput: { minHeight: 44 },
  dynamicHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addFieldBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addFieldText: { fontSize: 13, fontWeight: "600" },
  helperText: { fontSize: 12, lineHeight: 18 },
  customFieldBox: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 8 },
  customFieldTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  customFieldTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  deckLabelRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  multiDeckBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  multiDeckBadgeText: { fontSize: 11, fontWeight: "700" },
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
  deckOptionText: { fontSize: 15, fontWeight: "600", flex: 1 },
  deckCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  newDeckRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, marginTop: 4 },
  newDeckInput: { flex: 1, fontSize: 15, paddingVertical: 6 },
  createDeckBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  createDeckBtnText: { fontSize: 13, fontWeight: "700" },
});
