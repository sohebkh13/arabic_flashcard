import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  Deck,
  Flashcard,
  deleteCard,
  deleteDeck,
  getDueCards,
  getCards,
  getDecks,
  moveCard,
  saveCard,
  saveDeck,
  updateCard,
  updateDeck,
} from "@/lib/storage";

interface AppContextValue {
  decks: Deck[];
  cards: Flashcard[];
  dueByDeck: Record<string, number>;
  loading: boolean;
  refreshAll: () => Promise<void>;
  createDeck: (name: string, dialect: "MSA" | "Egyptian") => Promise<Deck>;
  editDeck: (id: string, name: string, dialect: "MSA" | "Egyptian") => Promise<void>;
  removeDeck: (id: string) => Promise<void>;
  createCard: (card: Omit<Flashcard, "id" | "createdAt" | "interval" | "repetitions" | "easeFactor" | "dueDate">) => Promise<Flashcard>;
  editCard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  transferCard: (cardId: string, targetDeckId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueByDeck, setDueByDeck] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [d, c, due] = await Promise.all([
      getDecks(),
      getCards(),
      getDueCards(),
    ]);
    setDecks(d);
    setCards(c);
    const map: Record<string, number> = {};
    for (const card of due) {
      map[card.deckId] = (map[card.deckId] || 0) + 1;
    }
    setDueByDeck(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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

  const createCard = useCallback(async (card: Omit<Flashcard, "id" | "createdAt" | "interval" | "repetitions" | "easeFactor" | "dueDate">) => {
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

  return (
    <AppContext.Provider
      value={{
        decks,
        cards,
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
