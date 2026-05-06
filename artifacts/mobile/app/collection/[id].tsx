import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeckCard } from "@/components/DeckCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { collections, decks, cards, dueByDeck, addDeckToCollectionMut, removeCollection, removeDeck } = useApp();

  const collection = collections.find((item) => item.id === id);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const collectionDecks = useMemo(() => {
    if (!collection) return [];
    return decks.filter((deck) => collection.deckIds.includes(deck.id));
  }, [collection, decks]);

  const availableDecks = useMemo(() => {
    if (!collection) return [];
    return decks.filter((deck) => !collection.deckIds.includes(deck.id));
  }, [collection, decks]);

  const collectionCards = useMemo(() => {
    if (!collection) return [];
    return cards.filter((card) => collection.deckIds.includes(card.deckId));
  }, [collection, cards]);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 16 : insets.bottom;

  if (!collection) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Collection not found</Text>
      </View>
    );
  }

  async function handleAddDeck(deckId: string) {
    try {
      setBusy(true);
      await addDeckToCollectionMut(collection.id, deckId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Could not add deck", (error as Error).message || "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteKeepDecks() {
    setDeleteModalVisible(false);
    setBusy(true);
    try {
      await removeCollection(collection.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteWithDecks() {
    setDeleteModalVisible(false);
    setBusy(true);
    try {
      for (const deck of collectionDecks) {
        await removeDeck(deck.id);
      }
      await removeCollection(collection.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.headerBadge, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="folder" size={14} color={colors.primary} />
            <Text style={[styles.headerBadgeText, { color: colors.primary }]}>Collection</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {collectionDecks.length} deck{collectionDecks.length !== 1 ? "s" : ""} · {collectionCards.length} card{collectionCards.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setDeleteModalVisible(true)}
            style={[styles.headerBtn, { backgroundColor: colors.destructive + "15" }]}
            disabled={busy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAddModalVisible(true)}
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}
            disabled={busy}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={collectionDecks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="folder-plus" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No decks in this collection yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add an existing deck using the plus button above.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const deckCards = cards.filter((card) => card.deckId === item.id);
          const latestCardUpdatedAt = deckCards.reduce(
            (max, card) => Math.max(max, card.updatedAt || card.createdAt || 0),
            0,
          );
          const lastUpdated = Math.max(item.updatedAt || item.createdAt || 0, latestCardUpdatedAt);
          return (
            <DeckCard
              deck={item}
              cardCount={deckCards.length}
              dueCount={dueByDeck[item.id] || 0}
              addedLabel={new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              updatedLabel={new Date(lastUpdated).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Deck Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView style={styles.kvFlex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setAddModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add deck to collection</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Choose a deck to include in this collection.</Text>
            <View style={styles.deckList}>
              {availableDecks.length === 0 ? (
                <View style={styles.noDecksWrap}>
                  <Text style={[styles.noDecksText, { color: colors.mutedForeground }]}>No available decks right now.</Text>
                </View>
              ) : (
                availableDecks.map((deck) => (
                  <Pressable
                    key={deck.id}
                    style={[styles.deckRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => { void handleAddDeck(deck.id); }}
                    disabled={busy}
                  >
                    <View style={styles.deckRowMain}>
                      <Text style={[styles.deckRowTitle, { color: colors.foreground }]} numberOfLines={1}>{deck.name}</Text>
                      <Text style={[styles.deckRowSub, { color: colors.mutedForeground }]}>{deck.dialect}</Text>
                    </View>
                    <Feather name="plus-circle" size={18} color={colors.primary} />
                  </Pressable>
                ))
              )}
            </View>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setAddModalVisible(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Collection Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.alertIconWrap, { backgroundColor: colors.destructive + "18" }]}>
              <Feather name="trash-2" size={22} color={colors.destructive} />
            </View>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>
              Delete "{collection.name}"?
            </Text>
            {collectionDecks.length > 0 ? (
              <Text style={[styles.alertMsg, { color: colors.mutedForeground }]}>
                This collection has {collectionDecks.length} deck{collectionDecks.length !== 1 ? "s" : ""}. What should happen to them?
              </Text>
            ) : (
              <Text style={[styles.alertMsg, { color: colors.mutedForeground }]}>
                The collection will be permanently removed. This cannot be undone.
              </Text>
            )}

            {collectionDecks.length > 0 ? (
              <>
                <TouchableOpacity
                  style={[styles.alertBtn, { backgroundColor: colors.destructive }]}
                  onPress={handleDeleteWithDecks}
                >
                  <Feather name="trash-2" size={15} color="#fff" />
                  <Text style={[styles.alertBtnText, { color: "#fff" }]}>
                    Delete Collection & All Decks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.alertBtn, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={handleDeleteKeepDecks}
                >
                  <Feather name="folder-minus" size={15} color={colors.foreground} />
                  <Text style={[styles.alertBtnText, { color: colors.foreground }]}>
                    Remove Collection, Keep Decks
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.alertBtn, { backgroundColor: colors.destructive }]}
                onPress={handleDeleteKeepDecks}
              >
                <Feather name="trash-2" size={15} color="#fff" />
                <Text style={[styles.alertBtnText, { color: "#fff" }]}>Delete Collection</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setDeleteModalVisible(false)}>
              <Text style={[styles.alertCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitleWrap: { flex: 1, gap: 4 },
  headerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  headerSubtitle: { fontSize: 13, fontWeight: "500" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 30, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  kvFlex: { flex: 1, justifyContent: "flex-end" },
  modalDismiss: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    paddingBottom: 30,
    gap: 14,
    maxHeight: "80%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalSubtitle: { fontSize: 13, lineHeight: 18 },
  deckList: { gap: 10 },
  noDecksWrap: { paddingVertical: 12 },
  noDecksText: { fontSize: 14 },
  deckRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deckRowMain: { flex: 1, gap: 2, paddingRight: 10 },
  deckRowTitle: { fontSize: 15, fontWeight: "700" },
  deckRowSub: { fontSize: 12, fontWeight: "600" },
  cancelBtn: { marginTop: 2, borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  /* Delete alert modal */
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  alertBox: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  alertIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  alertTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  alertMsg: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  alertBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  alertBtnText: { fontSize: 15, fontWeight: "700" },
  alertCancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  alertCancelText: { fontSize: 14, fontWeight: "600" },
});
