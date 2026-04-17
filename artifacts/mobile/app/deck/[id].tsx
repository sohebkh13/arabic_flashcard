import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
    await editDeck(deck!.id, editName.trim(), deck!.dialect);
    setEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleDeleteCard(card: Flashcard) {
    Alert.alert("Delete Card", `Delete "${card.arabic}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeCard(card.id) },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.deckName, { color: colors.foreground }]} numberOfLines={1}>
          {deck.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => { setEditName(deck.name); setEditModal(true); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit-2" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{deckCards.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cards</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: dueCount > 0 ? colors.primary : colors.foreground }]}>{dueCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Due</Text>
        </View>
      </View>

      {/* Review banner */}
      {dueCount > 0 && (
        <TouchableOpacity
          style={[styles.reviewBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: "/review", params: { deckId: id } })}
          activeOpacity={0.85}
        >
          <Feather name="zap" size={18} color={colors.primaryForeground} />
          <Text style={[styles.reviewBannerText, { color: colors.primaryForeground }]}>
            {dueCount} card{dueCount !== 1 ? "s" : ""} due — start review
          </Text>
          <Feather name="chevron-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}

      {/* Card list */}
      <FlatList
        data={deckCards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="book-open" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cards yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Translate a word and tap "Save as Flashcard"
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
              <Text style={[styles.arabicWord, { color: colors.foreground }]} numberOfLines={1}>
                {item.arabic}
              </Text>
              <Text style={[styles.englishWord, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.english}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteCardBtn}
              onPress={() => handleDeleteCard(item)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 20 }]}
        onPress={() => router.push({ pathname: "/create-card", params: { deckId: id } })}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Edit Deck Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView
          style={styles.kvFlex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setEditModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Rename Deck</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleEditSave}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !editName.trim() ? 0.5 : 1 }]}
                onPress={handleEditSave}
                disabled={!editName.trim()}
              >
                <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 2 },
  deckName: { flex: 1, fontSize: 18, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 18 },
  statsRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: StyleSheet.hairlineWidth },
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
  cardMain: { flex: 1, gap: 4 },
  arabicWord: { fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  englishWord: { fontSize: 13 },
  deleteCardBtn: { padding: 4 },
  emptyState: { alignItems: "center", gap: 10, paddingTop: 40, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  fab: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  // Modal
  kvFlex: { flex: 1, justifyContent: "flex-end" },
  modalDismiss: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700" },
});
