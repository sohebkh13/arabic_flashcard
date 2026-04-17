import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
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
  const [newDeckDialect, setNewDeckDialect] = useState<"MSA" | "Egyptian">("MSA");
  const [creating, setCreating] = useState(false);

  const totalDue = Object.values(dueByDeck).reduce((a, b) => a + b, 0);

  async function handleCreateDeck() {
    if (!newDeckName.trim()) return;
    setCreating(true);
    await createDeck(newDeckName.trim(), newDeckDialect);
    setCreating(false);
    setModalVisible(false);
    setNewDeckName("");
    setNewDeckDialect("MSA");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 60;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

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
            onPress={() => setModalVisible(true)}
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Deck</Text>

            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="Deck name (e.g. Verbs)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
              autoFocus
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Dialect</Text>
            <View style={styles.dialectRow}>
              {(["MSA", "Egyptian"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dialectOption,
                    {
                      borderColor: newDeckDialect === d ? colors.primary : colors.border,
                      backgroundColor: newDeckDialect === d ? colors.primary + "22" : colors.secondary,
                    },
                  ]}
                  onPress={() => setNewDeckDialect(d)}
                >
                  <Text style={[styles.dialectOptionText, { color: newDeckDialect === d ? colors.primary : colors.mutedForeground }]}>
                    {d === "MSA" ? "Modern Standard" : "Egyptian"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary, opacity: !newDeckName.trim() ? 0.5 : 1 }]}
              onPress={handleCreateDeck}
              disabled={!newDeckName.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Create Deck</Text>
              )}
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
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  totalDueBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  totalDueText: {
    fontSize: 13,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dialectRow: {
    flexDirection: "row",
    gap: 12,
  },
  dialectOption: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: "center",
  },
  dialectOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  createBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
