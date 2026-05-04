import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { setUserId } from "@/lib/storage-keys";
import { migrateGuestDataToUser } from "@/lib/storage";
import {
  BackupData,
  Collection,
  Deck,
  Flashcard,
  addDeckToCollection,
  buildBackup,
  deleteCard,
  deleteCollection,
  deleteDeck,
  getDueCards,
  getCards,
  getCollections,
  getDecks,
  importBackup,
  moveCard,
  removeDeckFromCollection,
  saveCard,
  saveCollection,
  saveDeck,
  updateCard,
  updateCollection,
  updateDeck,
} from "@/lib/storage";

interface AppContextValue {
  decks: Deck[];
  cards: Flashcard[];
  collections: Collection[];
  dueByDeck: Record<string, number>;
  loading: boolean;
  refreshAll: () => Promise<void>;
  createDeck: (name: string, dialect: "MSA" | "Egyptian") => Promise<Deck>;
  editDeck: (id: string, name: string, dialect: "MSA" | "Egyptian") => Promise<void>;
  removeDeck: (id: string) => Promise<void>;
  createCard: (card: Omit<Flashcard, "id" | "createdAt" | "updatedAt" | "interval" | "repetitions" | "easeFactor" | "dueDate">) => Promise<Flashcard>;
  editCard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  transferCard: (cardId: string, targetDeckId: string) => Promise<void>;
  createCollection: (name: string) => Promise<Collection>;
  editCollection: (id: string, name: string) => Promise<void>;
  removeCollection: (id: string) => Promise<void>;
  addDeckToCollectionMut: (collectionId: string, deckId: string) => Promise<void>;
  removeDeckFromCollectionMut: (collectionId: string, deckId: string) => Promise<void>;
  exportBackup: (deckId?: string, collectionId?: string) => Promise<BackupData>;
  importBackupData: (raw: unknown) => Promise<{ importedDecks: number; importedCards: number; importedCollections: number }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dueByDeck, setDueByDeck] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [d, c, col, due] = await Promise.all([
      getDecks(),
      getCards(),
      getCollections(),
      getDueCards(),
    ]);
    setDecks(d);
    setCards(c);
    setCollections(col);
    const map: Record<string, number> = {};
    for (const card of due) {
      map[card.deckId] = (map[card.deckId] || 0) + 1;
    }
    setDueByDeck(map);
    setLoading(false);
  }, []);

  // Auth-aware data scoping: switch storage keys based on Clerk userId
  const { isSignedIn, userId, isLoaded } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const currentUserId = isSignedIn && userId ? userId : "guest";

    // Only act on actual auth state changes
    if (prevUserIdRef.current === currentUserId) return;

    // Immediately clear stale data so the old user's decks never flash on screen
    setDecks([]);
    setCards([]);
    setCollections([]);
    setDueByDeck({});
    setLoading(true);

    setUserId(currentUserId);

    // Guest (or first launch with null) → signed-in user: migrate guest data first
    const wasGuest = prevUserIdRef.current === "guest" || prevUserIdRef.current === null;
    if (wasGuest && currentUserId !== "guest") {
      migrateGuestDataToUser(currentUserId)
        .then(() => refreshAll())
        .catch((err) => {
          console.error("Guest data migration failed:", err);
          refreshAll();
        });
    } else {
      refreshAll();
    }

    prevUserIdRef.current = currentUserId;
  }, [isLoaded, isSignedIn, userId, refreshAll]);

  const createDeck = useCallback(async (name: string, dialect: "MSA" | "Egyptian") => {
    const deck = await saveDeck({ name, dialect });
    await refreshAll();
    return deck;
  }, [refreshAll]);

  const editDeck = useCallback(async (id: string, name: string, dialect: "MSA" | "Egyptian") => {
    await updateDeck(id, { name, dialect });
    await refreshAll();
  }, [refreshAll]);

  const removeDeck = useCallback(async (id: string) => {
    await deleteDeck(id);
    await refreshAll();
  }, [refreshAll]);

  const createCard = useCallback(async (card: Omit<Flashcard, "id" | "createdAt" | "updatedAt" | "interval" | "repetitions" | "easeFactor" | "dueDate">) => {
    const newCard = await saveCard(card);
    await refreshAll();
    return newCard;
  }, [refreshAll]);

  const editCard = useCallback(async (id: string, updates: Partial<Flashcard>) => {
    await updateCard(id, updates);
    await refreshAll();
  }, [refreshAll]);

  const removeCard = useCallback(async (id: string) => {
    await deleteCard(id);
    await refreshAll();
  }, [refreshAll]);

  const transferCard = useCallback(async (cardId: string, targetDeckId: string) => {
    await moveCard(cardId, targetDeckId);
    await refreshAll();
  }, [refreshAll]);

  const exportBackup = useCallback(async (deckId?: string, collectionId?: string) => {
    return buildBackup(deckId, collectionId);
  }, []);

  const importBackupData = useCallback(async (raw: unknown) => {
    const result = await importBackup(raw);
    await refreshAll();
    return result;
  }, [refreshAll]);

  const createCollection = useCallback(async (name: string) => {
    const collection = await saveCollection({ name, deckIds: [] });
    await refreshAll();
    return collection;
  }, [refreshAll]);

  const editCollection = useCallback(async (id: string, name: string) => {
    await updateCollection(id, { name });
    await refreshAll();
  }, [refreshAll]);

  const removeCollection = useCallback(async (id: string) => {
    await deleteCollection(id);
    await refreshAll();
  }, [refreshAll]);

  const addDeckToCollectionMut = useCallback(async (collectionId: string, deckId: string) => {
    await addDeckToCollection(collectionId, deckId);
    await refreshAll();
  }, [refreshAll]);

  const removeDeckFromCollectionMut = useCallback(async (collectionId: string, deckId: string) => {
    await removeDeckFromCollection(collectionId, deckId);
    await refreshAll();
  }, [refreshAll]);

  return (
    <AppContext.Provider
      value={{
        decks,
        cards,
        collections,
        dueByDeck,
        loading,
        refreshAll,
        createDeck,
        editDeck,
        removeDeck,
        createCard,
        editCard,
        removeCard,
        transferCard,
        createCollection,
        editCollection,
        removeCollection,
        addDeckToCollectionMut,
        removeDeckFromCollectionMut,
        exportBackup,
        importBackupData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
