import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Deck {
  id: string;
  name: string;
  dialect: "MSA" | "Egyptian";
  createdAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  arabic: string;
  english: string;
  context: string;
  grammarNotes: string;
  dialect: "MSA" | "Egyptian";
  createdAt: number;
  // SM-2 fields
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: number;
}

const DECKS_KEY = "arabic_flashcards_decks";
const CARDS_KEY = "arabic_flashcards_cards";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getDecks(): Promise<Deck[]> {
  try {
    const raw = await AsyncStorage.getItem(DECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDeck(deck: Omit<Deck, "id" | "createdAt">): Promise<Deck> {
  const decks = await getDecks();
  const newDeck: Deck = {
    ...deck,
    id: generateId(),
    createdAt: Date.now(),
  };
  decks.push(newDeck);
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  return newDeck;
}

export async function updateDeck(id: string, updates: Partial<Omit<Deck, "id" | "createdAt">>): Promise<void> {
  const decks = await getDecks();
  const idx = decks.findIndex((d) => d.id === id);
  if (idx >= 0) {
    decks[idx] = { ...decks[idx], ...updates };
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  }
}

export async function deleteDeck(id: string): Promise<void> {
  const decks = await getDecks();
  const filtered = decks.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(filtered));
  // Also delete all cards in that deck
  const cards = await getCards();
  const filteredCards = cards.filter((c) => c.deckId !== id);
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
}

export async function getCards(): Promise<Flashcard[]> {
  try {
    const raw = await AsyncStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getCardsByDeck(deckId: string): Promise<Flashcard[]> {
  const cards = await getCards();
  return cards.filter((c) => c.deckId === deckId);
}

export async function getDueCards(deckId?: string): Promise<Flashcard[]> {
  const cards = await getCards();
  const now = Date.now();
  return cards.filter((c) => {
    if (deckId && c.deckId !== deckId) return false;
    return c.dueDate <= now;
  });
}

export async function saveCard(card: Omit<Flashcard, "id" | "createdAt" | "interval" | "repetitions" | "easeFactor" | "dueDate">): Promise<Flashcard> {
  const cards = await getCards();
  const newCard: Flashcard = {
    ...card,
    id: generateId(),
    createdAt: Date.now(),
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: Date.now(),
  };
  cards.push(newCard);
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  return newCard;
}

export async function updateCard(id: string, updates: Partial<Flashcard>): Promise<void> {
  const cards = await getCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx >= 0) {
    cards[idx] = { ...cards[idx], ...updates };
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
}

export async function deleteCard(id: string): Promise<void> {
  const cards = await getCards();
  const filtered = cards.filter((c) => c.id !== id);
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filtered));
}

export async function moveCard(cardId: string, targetDeckId: string): Promise<void> {
  const cards = await getCards();
  const decks = await getDecks();
  const targetDeck = decks.find((d) => d.id === targetDeckId);
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx >= 0 && targetDeck) {
    cards[idx] = {
      ...cards[idx],
      deckId: targetDeckId,
      dialect: targetDeck.dialect,
    };
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
}
