import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { DeckCard } from "@/components/DeckCard";
import { FloatingBubble } from "@/components/FloatingBubble";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { decks, cards, dueByDeck, loading, createDeck } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [creating, setCreating] = useState(false);

  const totalDue = Object.values(dueByDeck).reduce((a, b) => a + b, 0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 60;

  function openModal() {
    setNewDeckName("");
    setModalVisible(true);
  }

  async function handleCreateDeck() {
    if (!newDeckName.trim()) return;
    setCreating(true);
    await createDeck(newDeckName.trim(), "MSA");
    setCreating(false);
    setModalVisible(false);
    setNewDeckName("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>مجموعاتي</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>My Decks</Text>
        </View>
        <View style={styles.headerRight}>
          {totalDue > 0 && (
            <View style={[styles.totalDueBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.totalDueText, { color: colors.primaryForeground }]}>
                {totalDue} due
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openModal}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : decks.length === 0 ? (
        <View style={styles.center}>
          <Feather name="layers" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No decks yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap + to create your first Arabic vocabulary deck
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={openModal}
          >
            <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Create First Deck</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad, gap: 12 }}
          renderItem={({ item }) => (
            <DeckCard
              deck={item}
              cardCount={cards.filter((c) => c.deckId === item.id).length}
              dueCount={dueByDeck[item.id] || 0}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {Platform.OS !== "web" && <FloatingBubble />}

      {/* New Deck Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.kvFlex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Handle bar */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Deck</Text>

            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="e.g. Verbs, Food, Travel..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.modalInput,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary },
              ]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateDeck}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createBtn,
                  { backgroundColor: colors.primary, opacity: !newDeckName.trim() ? 0.5 : 1 },
                ]}
                onPress={handleCreateDeck}
                disabled={!newDeckName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Create</Text>
                )}
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  totalDueBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  totalDueText: { fontSize: 13, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBtn: { marginTop: 8, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { fontSize: 15, fontWeight: "600" },
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
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  createBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  createBtnText: { fontSize: 15, fontWeight: "700" },
});
