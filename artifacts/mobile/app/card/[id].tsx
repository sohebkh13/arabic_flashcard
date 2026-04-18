import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArabicText } from "@/components/ArabicText";
import { ListenButton } from "@/components/ListenButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cards, decks, editCard, removeCard, transferCard } = useApp();

  const card = cards.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);
  const [arabic, setArabic] = useState(card?.arabic || "");
  const [english, setEnglish] = useState(card?.english || "");
  const [context, setContext] = useState(card?.context || "");
  const [grammarNotes, setGrammarNotes] = useState(card?.grammarNotes || "");
  const [dialect, setDialect] = useState<"MSA" | "Egyptian">(card?.dialect || "MSA");
  const [moveModal, setMoveModal] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!card) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Card not found</Text>
      </View>
    );
  }

  const deck = decks.find((d) => d.id === card.deckId);
  const nextReview = new Date(card.dueDate).toLocaleDateString();

  async function handleSave() {
    await editCard(card!.id, { arabic, english, context, grammarNotes, dialect });
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleDelete() {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete this card? Cannot be undone.");
      if (confirmed) {
        await removeCard(card!.id);
        router.back();
      }
      return;
    }

    Alert.alert("Delete Card", "Delete this card? Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeCard(card!.id);
          router.back();
        },
      },
    ]);
  }

  async function handleMove(targetDeckId: string) {
    await transferCard(card!.id, targetDeckId);
    setMoveModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setMoveModal(true)}>
            <Feather name="move" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Feather name={editing ? "x" : "edit-2"} size={20} color={editing ? colors.destructive : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {editing ? (
          <>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Arabic</Text>
              <TextInput
                value={arabic}
                onChangeText={setArabic}
                style={[styles.input, styles.arabicInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                textAlign="right"
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>English</Text>
              <TextInput
                value={english}
                onChangeText={setEnglish}
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Context</Text>
              <TextInput
                value={context}
                onChangeText={setContext}
                style={[styles.input, styles.multi, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                multiline
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Grammar Notes</Text>
              <TextInput
                value={grammarNotes}
                onChangeText={setGrammarNotes}
                style={[styles.input, styles.multi, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                multiline
              />
            </View>
            <View style={styles.dialectRow}>
              {(["MSA", "Egyptian"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, { borderColor: dialect === d ? colors.primary : colors.border, backgroundColor: dialect === d ? colors.primary + "22" : colors.card }]}
                  onPress={() => setDialect(d)}
                >
                  <Text style={[styles.chipText, { color: dialect === d ? colors.primary : colors.mutedForeground }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.arabicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ArabicText size="hero" color={colors.foreground}>{card.arabic}</ArabicText>
              <View style={styles.listenWrap}>
                <ListenButton text={card.arabic} language="ar" size={24} />
              </View>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Translation</Text>
                <View style={styles.translationRow}>
                  <Text style={[styles.infoValue, styles.englishValue, { color: colors.foreground }]}>{card.english}</Text>
                  <ListenButton text={card.english} language="en" size={18} />
                </View>
              </View>
              {card.context ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Context</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{card.context}</Text>
                </View>
              ) : null}
              {card.grammarNotes ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Grammar</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{card.grammarNotes}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Deck</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{deck?.name || "—"}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Dialect</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{card.dialect}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Next Review</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{nextReview}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Repetitions</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{card.repetitions}</Text>
              </View>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <Modal visible={moveModal} transparent animationType="slide" onRequestClose={() => setMoveModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setMoveModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Move to Deck</Text>
            {decks.filter((d) => d.id !== card.deckId).map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.deckOption, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                onPress={() => handleMove(d.id)}
              >
                <Text style={[styles.deckOptionText, { color: colors.foreground }]}>{d.name}</Text>
                <Text style={[styles.deckDialectText, { color: colors.mutedForeground }]}>{d.dialect}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActions: { flexDirection: "row", gap: 18 },
  content: { padding: 20, gap: 16 },
  arabicCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", justifyContent: "center", minHeight: 160, gap: 12 },
  listenWrap: { marginTop: 4 },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow: { padding: 16, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(128,128,128,0.2)" },
  translationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 16, lineHeight: 24 },
  englishValue: { fontWeight: "600", fontSize: 18 },
  metaCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  metaRow: { padding: 14, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(128,128,128,0.2)" },
  metaLabel: { fontSize: 14 },
  metaValue: { fontSize: 14, fontWeight: "600" },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  arabicInput: { fontSize: 22, textAlign: "right", writingDirection: "rtl", lineHeight: 34 },
  multi: { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  dialectRow: { flexDirection: "row", gap: 12 },
  chip: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: "center" },
  chipText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalDismiss: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 24, paddingBottom: 40, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  deckOption: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deckOptionText: { fontSize: 15, fontWeight: "600" },
  deckDialectText: { fontSize: 12 },
});
