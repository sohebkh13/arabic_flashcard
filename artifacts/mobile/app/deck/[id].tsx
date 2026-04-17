import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
import { Flashcard } from "@/lib/storage";

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { decks, cards, dueByDeck, removeDeck, editDeck, removeCard } = useApp();

  const deck = decks.find((d) => d.id === id);
  const deckCards = useMemo(() => cards.filter((c) => c.deckId === id), [cards, id]);
  const dueCount = dueByDeck[id || ""] || 0;

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(deck?.name || "");
  const [editDialect, setEditDialect] = useState<"MSA" | "Egyptian">(deck?.dialect || "MSA");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!deck) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Deck not found</Text>
      </View>
    );
  }

  async function handleDelete() {
    Alert.alert(
      "Delete Deck",
      `Delete "${deck!.name}" and all its cards? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeDeck(deck!.id);
            router.back();
          },
        },
      ]
    );
  }

  async function handleEditSave() {
    if (!editName.trim()) return;
    await editDeck(deck!.id, editName.trim(), editDialect);
    setEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleDeleteCard(card: Flashcard) {
    Alert.alert("Delete Card", `Delete "${card.arabic}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeCard(card.id),
      },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.deckName, { color: colors.foreground }]} numberOfLines={1}>
            {deck.name}
          </Text>
          <Text style={[styles.deckDialect, { color: colors.mutedForeground }]}>{deck.dialect}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { setEditName(deck.name); setEditDialect(deck.dialect); setEditModal(true); }}>
            <Feather name="edit-2" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {dueCount > 0 && (
        <TouchableOpacity
          style={[styles.reviewBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: "/review", params: { deckId: id } })}
          activeOpacity={0.85}
        >
          <Feather name="zap" size={18} color={colors.primaryForeground} />
          <Text style={[styles.reviewBannerText, { color: colors.primaryForeground }]}>
            {dueCount} card{dueCount !== 1 ? "s" : ""} due for review
          </Text>
          <Feather name="chevron-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}

      <FlatList
        data={deckCards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Feather name="book-open" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cards yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add flashcards from the Translate tab
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cardItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/card/[id]", params: { id: item.id } })}
            activeOpacity={0.8}
          >
            <View style={styles.cardMain}>
              <Text
                style={[styles.arabicWord, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.arabic}
              </Text>
              <Text style={[styles.englishWord, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.english}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteCardBtn}
              onPress={() => handleDeleteCard(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 20 }]}
        onPress={() => router.push({ pathname: "/create-card", params: { deckId: id } })}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setEditModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Deck</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
              autoFocus
            />
            <View style={styles.dialectRow}>
              {(["MSA", "Egyptian"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dialectOption,
                    {
                      borderColor: editDialect === d ? colors.primary : colors.border,
                      backgroundColor: editDialect === d ? colors.primary + "22" : colors.secondary,
                    },
                  ]}
                  onPress={() => setEditDialect(d)}
                >
                  <Text style={[styles.dialectOptionText, { color: editDialect === d ? colors.primary : colors.mutedForeground }]}>
                    {d === "MSA" ? "Modern Standard" : "Egyptian"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleEditSave}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { paddingBottom: 2 },
  headerCenter: { flex: 1 },
  deckName: { fontSize: 18, fontWeight: "700" },
  deckDialect: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 16, paddingBottom: 2 },
  reviewBanner: {
    margin: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewBannerText: { flex: 1, fontSize: 15, fontWeight: "600" },
  cardItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardMain: { flex: 1, gap: 3 },
  arabicWord: { fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  englishWord: { fontSize: 14 },
  deleteCardBtn: { padding: 4 },
  fab: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalDismiss: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 24, paddingBottom: 40, gap: 14 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  dialectRow: { flexDirection: "row", gap: 12 },
  dialectOption: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 12, alignItems: "center" },
  dialectOptionText: { fontSize: 14, fontWeight: "600" },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
