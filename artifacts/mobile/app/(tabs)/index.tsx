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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeckCard } from "@/components/DeckCard";
import { CollectionCard } from "@/components/CollectionCard";
import { Header } from "@/components/Header";
import { AnimatedWelcomeMessage } from "@/components/AnimatedWelcomeMessage";
import { useApp } from "@/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import {
  buildBackupFilename,
  exportTextToFile,
  ExportFormat,
  pickImportFile,
} from "@/lib/backup-file";
import { backupToCsv, backupToTxt } from "@/lib/export-formats";
import { parseAnkiTxt } from "@/lib/anki-import";

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
  const { decks, cards, collections, dueByDeck, loading, createDeck, createCollection, exportBackup, importBackupData, purgeEmptyDecks, addDeckToCollectionMut } = useApp();

  const [seenLanding, setSeenLanding] = useState<boolean | null>(null);
  const [forceBrowseView, setForceBrowseView] = useState(false);

  // Read landing flag on mount
  React.useEffect(() => {
    AsyncStorage.getItem("tarjim_seen_landing")
      .then((v) => setSeenLanding(v === "true"))
      .catch(() => setSeenLanding(false));
  }, []);

const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckCollectionIds, setNewDeckCollectionIds] = useState<string[]>([]);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportMode, setExportMode] = useState<"deck" | "collection">("deck");
  const [selectedExportDeckId, setSelectedExportDeckId] = useState<string>(ALL_DECKS_EXPORT_ID);
  const [selectedExportCollectionId, setSelectedExportCollectionId] = useState<string>("");
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>("json");
  const [creating, setCreating] = useState(false);
  const [busyTransfer, setBusyTransfer] = useState(false);

  const totalDue = Object.values(dueByDeck).reduce((a, b) => a + b, 0);
  const totalCards = cards.length;

  const bottomPad = Platform.OS === "web" ? 64 : insets.bottom + 60;

  // Get decks not in any collection
  const deckIdsInCollections = new Set(collections.flatMap((c) => c.deckIds));
  const independentDecks = decks.filter((d) => !deckIdsInCollections.has(d.id));

  // Last activity per deck = max of deck timestamps and all its cards' timestamps
  function deckLastActivity(deckId: string): number {
    const d = decks.find((x) => x.id === deckId);
    const maxCard = cards
      .filter((c) => c.deckId === deckId)
      .reduce((m, c) => Math.max(m, c.updatedAt || c.createdAt || 0), 0);
    return Math.max(d?.updatedAt || 0, d?.createdAt || 0, maxCard);
  }

  const sortedCollections = [...collections].sort((a, b) => {
    const aAct = Math.max(a.updatedAt || a.createdAt || 0, ...a.deckIds.map(deckLastActivity));
    const bAct = Math.max(b.updatedAt || b.createdAt || 0, ...b.deckIds.map(deckLastActivity));
    return bAct - aAct;
  });

  const sortedIndependentDecks = [...independentDecks].sort(
    (a, b) => deckLastActivity(b.id) - deckLastActivity(a.id)
  );

  function openModal() {
    setNewDeckName("");
    setNewDeckCollectionIds([]);
    setModalVisible(true);
    AsyncStorage.setItem("tarjim_seen_landing", "true").catch(() => {});
    setSeenLanding(true);
  }

  function toggleNewDeckCollection(colId: string) {
    setNewDeckCollectionIds((prev) =>
      prev.includes(colId) ? prev.filter((x) => x !== colId) : [...prev, colId]
    );
  }

  function openCollectionModal() {
    setNewCollectionName("");
    setCollectionModalVisible(true);
    // Mark landing as seen when user starts creating a collection
    AsyncStorage.setItem("tarjim_seen_landing", "true").catch(() => {});
    setSeenLanding(true);
  }

  function handleBrowsePress() {
    AsyncStorage.setItem("tarjim_seen_landing", "true").catch(() => {});
    setSeenLanding(true);
    setForceBrowseView(true);
  }

  async function handleCreateDeck() {
    if (!newDeckName.trim()) return;
    setCreating(true);
    const newDeck = await createDeck(newDeckName.trim(), "MSA");
    for (const colId of newDeckCollectionIds) {
      await addDeckToCollectionMut(colId, newDeck.id);
    }
    setCreating(false);
    setModalVisible(false);
    setNewDeckName("");
    setNewDeckCollectionIds([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    await createCollection(newCollectionName.trim());
    setCreating(false);
    setCollectionModalVisible(false);
    setNewCollectionName("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function openExportModal() {
    setExportMode("deck");
    setSelectedExportDeckId(ALL_DECKS_EXPORT_ID);
    setSelectedExportFormat("json");
    setExportModalVisible(true);
  }

  async function handleConfirmExport() {
    try {
      setBusyTransfer(true);
      let payload;
      let filename;

      if (exportMode === "collection") {
        if (!selectedExportCollectionId) {
          Alert.alert("Error", "Please select a collection");
          return;
        }
        payload = await exportBackup(undefined, selectedExportCollectionId);
        const selectedCollection = collections.find((c) => c.id === selectedExportCollectionId);
        filename = buildBackupFilename("collection", selectedExportFormat, selectedCollection?.name);
      } else {
        const deckId = selectedExportDeckId === ALL_DECKS_EXPORT_ID ? undefined : selectedExportDeckId;
        payload = await exportBackup(deckId);
        const selectedDeck = deckId ? decks.find((deck) => deck.id === deckId) : undefined;
        filename = buildBackupFilename(deckId ? "deck" : "all", selectedExportFormat, selectedDeck?.name);
      }

      let content = JSON.stringify(payload, null, 2);
      if (selectedExportFormat === "csv") {
        content = backupToCsv(payload);
      } else if (selectedExportFormat === "txt") {
        content = backupToTxt(payload);
      }

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
    const file = await pickImportFile();
    if (!file) return;

    try {
      setBusyTransfer(true);

      let importPayload: unknown;
      const isJson = file.name.toLowerCase().endsWith(".json");

      if (isJson) {
        importPayload = JSON.parse(file.text);
      } else {
        // Try JSON first; if it fails, treat as Anki TXT/TSV
        try {
          importPayload = JSON.parse(file.text);
        } catch {
          const deckName = file.name.replace(/\.[^.]+$/, "").trim() || "Imported Deck";
          importPayload = parseAnkiTxt(file.text, deckName);
        }
      }

      const result = await importBackupData(importPayload);
      const parts = [`Imported ${result.importedDecks} deck(s)`, `${result.importedCards} card(s)`];
      if (result.importedCollections > 0) {
        parts.push(`${result.importedCollections} collection(s)`);
      }
      Alert.alert("Import complete", parts.join(", "));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AsyncStorage.setItem("tarjim_seen_landing", "true").catch(() => {});
      setSeenLanding(true);
    } catch (error) {
      Alert.alert("Import failed", (error as Error).message || "Could not import backup file");
    } finally {
      setBusyTransfer(false);
    }
  }

  function handleImportRequest() {
    runImport();
  }

  function handlePurgeEmpty() {
    const emptyCount = decks.filter((d) => !cards.some((c) => c.deckId === d.id)).length;
    if (emptyCount === 0) return;
    const msg = `Delete ${emptyCount} empty deck${emptyCount !== 1 ? "s" : ""}? This cannot be undone.`;
    const doDelete = async () => {
      const deleted = await purgeEmptyDecks();
      if (deleted > 0) Alert.alert("Done", `Removed ${deleted} empty deck${deleted !== 1 ? "s" : ""}.`);
    };
    if (Platform.OS === "web") {
      if (window.confirm(msg)) doDelete();
    } else {
      Alert.alert("Remove empty decks", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  }

  const emptyDeckCount = decks.filter((d) => !cards.some((c) => c.deckId === d.id)).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header 
        onProfilePress={() => router.push("/(tabs)/account")}
        onLogoPress={() => {
          setSeenLanding(false);
          setForceBrowseView(false);
        }}
      />

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <>
          {/* Landing Section (shown on first visit unless the user explicitly browses past it) */}
          {!forceBrowseView && (seenLanding === false || (decks.length === 0 && collections.length === 0)) ? (
            <ScrollView
              style={styles.fullScroll}
              contentContainerStyle={styles.fullScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <AnimatedWelcomeMessage />

              {/* Branding */}
              <View style={styles.brandingSection}>
                <View style={[styles.brandingIconWrap, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="bookmark" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.brandingTitle, { color: colors.foreground }]}>Tarjim</Text>
                <Text style={[styles.brandingText, { color: colors.mutedForeground }]}>
                  Learn anything with spaced repetition flashcards
                </Text>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                  onPress={openModal}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <Feather name="plus-circle" size={22} color={colors.primaryForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quickActionTitle, { color: colors.primaryForeground }]}>Create Deck</Text>
                    <Text style={[styles.quickActionSubtitle, { color: colors.primaryForeground + "CC" }]}>Start a new vocabulary deck</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.primaryForeground + "99"} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                  onPress={handleBrowsePress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="layers" size={22} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quickActionTitle, { color: colors.foreground }]}>Browse</Text>
                    <Text style={[styles.quickActionSubtitle, { color: colors.mutedForeground }]}>View decks & collections</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                  onPress={openCollectionModal}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="folder-plus" size={22} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quickActionTitle, { color: colors.foreground }]}>Create Collection</Text>
                    <Text style={[styles.quickActionSubtitle, { color: colors.mutedForeground }]}>Group related decks</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Stats Overview */}
              <View style={[styles.statsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{decks.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Decks</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{totalCards}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cards</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.destructive }]}>{totalDue}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Due</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.success }]}>{collections.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Collections</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  {emptyDeckCount > 0 && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}
                      onPress={handlePurgeEmpty}
                      disabled={busyTransfer}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={16} color={colors.destructive} />
                      <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Empty ({emptyDeckCount})</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={handleImportRequest}
                    disabled={busyTransfer}
                    activeOpacity={0.7}
                  >
                    {busyTransfer ? (
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                    ) : (
                      <>
                        <Feather name="upload" size={16} color={colors.mutedForeground} />
                        <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Import</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={openExportModal}
                    disabled={busyTransfer}
                    activeOpacity={0.7}
                  >
                    <Feather name="download" size={16} color={colors.mutedForeground} />
                    <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Export</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={openCollectionModal}
                    activeOpacity={0.8}
                  >
                    <Feather name="folder-plus" size={18} color={colors.primaryForeground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={openModal}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={20} color={colors.primaryForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Decks & Collections List */}
              <FlatList
                data={sortedIndependentDecks}
                keyExtractor={(d) => d.id}
                contentContainerStyle={{ padding: 16, paddingBottom: bottomPad, gap: 12 }}
                ListHeaderComponent={
                  <View style={{ gap: 16 }}>
                    {collections.length > 0 && (
                      <View style={{ gap: 10 }}>
                        <View style={styles.sectionHeader}>
                          <View>
                            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Collections</Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                              Grouped decks with shared topics
                            </Text>
                          </View>
                        </View>
                        <View style={{ gap: 10 }}>
                          {sortedCollections.map((collection) => {
                            const collectionDecks = decks.filter((deck) => collection.deckIds.includes(deck.id));
                            const collectionCards = cards.filter((card) => collection.deckIds.includes(card.deckId));
                            return (
                              <CollectionCard
                                key={collection.id}
                                collection={collection}
                                deckCount={collectionDecks.length}
                                cardCount={collectionCards.length}
                              />
                            );
                          })}
                        </View>
                      </View>
                    )}

                    <View style={styles.sectionHeader}>
                      <View>
                        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                          {collections.length > 0 ? "Independent Decks" : "Your Decks"}
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                          {collections.length > 0 ? "Decks not assigned to a collection" : "Tap a deck to review or edit"}
                        </Text>
                      </View>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  collections.length > 0 ? (
                    <View style={styles.center}>
                      <Feather name="folder" size={44} color={colors.mutedForeground} />
                      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No independent decks</Text>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        All decks are organized inside collections.
                      </Text>
                    </View>
                  ) : null
                }
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
            </View>
          )}
        </>
      )}

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

            {collections.length > 0 && (
              <View style={styles.newDeckCollSection}>
                <Text style={[styles.newDeckCollLabel, { color: colors.mutedForeground }]}>ADD TO COLLECTION</Text>
                <View style={styles.newDeckCollPills}>
                  {collections.map((col) => {
                    const active = newDeckCollectionIds.includes(col.id);
                    return (
                      <TouchableOpacity
                        key={col.id}
                        style={[
                          styles.collPill,
                          {
                            backgroundColor: active ? colors.primary + "22" : colors.secondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => toggleNewDeckCollection(col.id)}
                      >
                        <Feather name={active ? "check" : "plus"} size={12} color={active ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.collPillText, { color: active ? colors.primary : colors.foreground }]} numberOfLines={1}>
                          {col.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

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
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Export</Text>

            <View style={styles.exportSection}>
              <Text style={[styles.exportSectionTitle, { color: colors.mutedForeground }]}>Type</Text>
              <View style={styles.formatRow}>
                {(["deck", "collection"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.formatChip,
                      {
                        borderColor: exportMode === type ? colors.primary : colors.border,
                        backgroundColor: exportMode === type ? colors.primary + "22" : colors.secondary,
                      },
                    ]}
                    onPress={() => setExportMode(type)}
                    disabled={type === "collection" && collections.length === 0}
                  >
                    <Text style={{ color: exportMode === type ? colors.primary : colors.foreground, fontWeight: "700" }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {exportMode === "deck" ? (
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
                  {independentDecks.map((deck) => (
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
            ) : (
              <View style={styles.exportSection}>
                <Text style={[styles.exportSectionTitle, { color: colors.mutedForeground }]}>Select Collection</Text>
                <View style={styles.exportOptionsList}>
                  {collections.map((collection) => (
                    <TouchableOpacity
                      key={collection.id}
                      style={[
                        styles.exportOption,
                        {
                          borderColor: selectedExportCollectionId === collection.id ? colors.primary : colors.border,
                          backgroundColor: selectedExportCollectionId === collection.id ? colors.primary + "22" : colors.secondary,
                        },
                      ]}
                      onPress={() => setSelectedExportCollectionId(collection.id)}
                    >
                      <Text style={{ color: selectedExportCollectionId === collection.id ? colors.primary : colors.foreground }} numberOfLines={1}>
                        {collection.name} ({collection.deckIds.length} deck{collection.deckIds.length !== 1 ? "s" : ""})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

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

      {/* New Collection Modal */}
      <Modal
        visible={collectionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCollectionModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.kvFlex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setCollectionModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Collection</Text>

            <TextInput
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="e.g. Business Arabic, Travel Phrases..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.modalInput,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary },
              ]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateCollection}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setCollectionModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createBtn,
                  { backgroundColor: colors.primary, opacity: !newCollectionName.trim() ? 0.5 : 1 },
                ]}
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim() || creating}
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
  buttonGroup: { flexDirection: "row", gap: 8 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sectionHeader: { paddingTop: 4, gap: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { fontSize: 12, fontWeight: "500" },
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
  /* Landing page styles */
  fullScroll: { flex: 1 },
  fullScrollContent: { flexGrow: 1, paddingBottom: 40 },
  brandingSection: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
  },
  brandingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  brandingTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandingText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "80%",
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 32,
  },
  quickActionBtn: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  /* Stats styles */
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 44,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  newDeckCollSection: { gap: 8 },
  newDeckCollLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  newDeckCollPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  collPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  collPillText: { fontSize: 13, fontWeight: "600", maxWidth: 120 },
});
