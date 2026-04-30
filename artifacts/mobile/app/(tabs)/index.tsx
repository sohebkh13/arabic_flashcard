import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import {
  buildBackupFilename,
  exportTextToFile,
  ExportFormat,
  pickJsonFileText,
} from "@/lib/backup-file";
import { backupToCsv, backupToTxt } from "@/lib/export-formats";

const ALL_DECKS_EXPORT_ID = "__all__";

function formatShortDate(ts: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { decks, cards, dueByDeck, loading, createDeck, exportBackup, importBackupData } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedExportDeckId, setSelectedExportDeckId] = useState<string>(ALL_DECKS_EXPORT_ID);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>("json");
  const [creating, setCreating] = useState(false);
  const [busyTransfer, setBusyTransfer] = useState(false);

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

  function openExportModal() {
    setSelectedExportDeckId(ALL_DECKS_EXPORT_ID);
    setSelectedExportFormat("json");
    setExportModalVisible(true);
  }

  async function handleConfirmExport() {
    try {
      setBusyTransfer(true);
      const deckId = selectedExportDeckId === ALL_DECKS_EXPORT_ID ? undefined : selectedExportDeckId;
      const payload = await exportBackup(deckId);
      const selectedDeck = deckId ? decks.find((deck) => deck.id === deckId) : undefined;

      let content = JSON.stringify(payload, null, 2);
      if (selectedExportFormat === "csv") {
        content = backupToCsv(payload);
      } else if (selectedExportFormat === "txt") {
        content = backupToTxt(payload);
      }

      const filename = buildBackupFilename(
        deckId ? "deck" : "all",
        selectedExportFormat,
        selectedDeck?.name
      );
      await exportTextToFile(content, filename, selectedExportFormat);
      setExportModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Export failed", (error as Error).message || "Could not export backup");
    } finally {
      setBusyTransfer(false);
    }
  }

  async function runImport() {
    try {
      setBusyTransfer(true);
      const text = await pickJsonFileText();
      if (!text) return;
      const parsed = JSON.parse(text);
      const result = await importBackupData(parsed);
      Alert.alert("Import complete", `Imported ${result.importedDecks} deck(s) and ${result.importedCards} card(s).`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Import failed", (error as Error).message || "Could not import backup file");
    } finally {
      setBusyTransfer(false);
    }
  }

  function handleImportRequest() {
    runImport();
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
          <TouchableOpacity onPress={handleImportRequest} activeOpacity={0.8} disabled={busyTransfer}>
            <View style={styles.actionButtonWrap}>
              <View style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                {busyTransfer ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Feather name="upload" size={16} color={colors.mutedForeground} />
                )}
              </View>
              <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Import</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={openExportModal} activeOpacity={0.8} disabled={busyTransfer}>
            <View style={styles.actionButtonWrap}>
              <View style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                <Feather name="download" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Export</Text>
            </View>
          </TouchableOpacity>
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
          renderItem={({ item }) => {
            const deckCards = cards.filter((card) => card.deckId === item.id);
            const latestCardUpdatedAt = deckCards.reduce(
              (max, card) => Math.max(max, card.updatedAt || card.createdAt || 0),
              0
            );
            const lastUpdated = Math.max(item.updatedAt || item.createdAt || 0, latestCardUpdatedAt);

            return (
              <DeckCard
                deck={item}
                cardCount={deckCards.length}
                dueCount={dueByDeck[item.id] || 0}
                addedLabel={formatShortDate(item.createdAt)}
                updatedLabel={formatShortDate(lastUpdated)}
              />
            );
          }}
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

      {/* Export Modal */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.kvFlex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setExportModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Export Decks</Text>

            <View style={styles.exportSection}>
              <Text style={[styles.exportSectionTitle, { color: colors.mutedForeground }]}>Select Deck</Text>
              <View style={styles.exportOptionsList}>
                <TouchableOpacity
                  style={[
                    styles.exportOption,
                    {
                      borderColor: selectedExportDeckId === ALL_DECKS_EXPORT_ID ? colors.primary : colors.border,
                      backgroundColor: selectedExportDeckId === ALL_DECKS_EXPORT_ID ? colors.primary + "22" : colors.secondary,
                    },
                  ]}
                  onPress={() => setSelectedExportDeckId(ALL_DECKS_EXPORT_ID)}
                >
                  <Text style={{ color: selectedExportDeckId === ALL_DECKS_EXPORT_ID ? colors.primary : colors.foreground }}>All Decks</Text>
                </TouchableOpacity>
                {decks.map((deck) => (
                  <TouchableOpacity
                    key={deck.id}
                    style={[
                      styles.exportOption,
                      {
                        borderColor: selectedExportDeckId === deck.id ? colors.primary : colors.border,
                        backgroundColor: selectedExportDeckId === deck.id ? colors.primary + "22" : colors.secondary,
                      },
                    ]}
                    onPress={() => setSelectedExportDeckId(deck.id)}
                  >
                    <Text style={{ color: selectedExportDeckId === deck.id ? colors.primary : colors.foreground }} numberOfLines={1}>{deck.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.exportSection}>
              <Text style={[styles.exportSectionTitle, { color: colors.mutedForeground }]}>File Type</Text>
              <View style={styles.formatRow}>
                {(["json", "csv", "txt"] as const).map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.formatChip,
                      {
                        borderColor: selectedExportFormat === format ? colors.primary : colors.border,
                        backgroundColor: selectedExportFormat === format ? colors.primary + "22" : colors.secondary,
                      },
                    ]}
                    onPress={() => setSelectedExportFormat(format)}
                  >
                    <Text style={{ color: selectedExportFormat === format ? colors.primary : colors.foreground, fontWeight: "700" }}>
                      {format.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setExportModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary, opacity: busyTransfer ? 0.6 : 1 }]}
                onPress={handleConfirmExport}
                disabled={busyTransfer}
              >
                {busyTransfer ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Export</Text>
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
  actionButtonWrap: { alignItems: "center", gap: 4 },
  actionLabel: { fontSize: 10, fontWeight: "600" },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  exportSection: { gap: 8 },
  exportSectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  exportOptionsList: { gap: 8, maxHeight: 180 },
  exportOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formatRow: { flexDirection: "row", gap: 10 },
  formatChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
});
