import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Deck {
  id: string;
  name: string;
  dialect: "MSA" | "Egyptian";
  createdAt: number;
  updatedAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  arabic: string;
  english: string;
  context: string;
  grammarNotes: string;
  dialect: "MSA" | "Egyptian";
  customFields: CustomField[];
  createdAt: number;
  updatedAt: number;
  // SM-2 fields
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: number;
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
}

export interface Collection {
  id: string;
  name: string;
  deckIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  version: 1;
  exportedAt: number;
  decks: Deck[];
  cards: Flashcard[];
  collections?: Collection[];
}

const DECKS_KEY = "arabic_flashcards_decks";
const CARDS_KEY = "arabic_flashcards_cards";
const COLLECTIONS_KEY = "arabic_flashcards_collections";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function normalizeCustomFields(raw: unknown): CustomField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const name = typeof item?.name === "string" ? item.name : "";
      const value = typeof item?.value === "string" ? item.value : "";
      return {
        id: typeof item?.id === "string" ? item.id : generateId(),
        name,
        value,
      };
    })
    .filter((field) => field.name.trim().length > 0 || field.value.trim().length > 0);
}

function normalizeDeck(raw: unknown): Deck {
  const item = (raw || {}) as Partial<Deck>;
  const createdAt = typeof item.createdAt === "number" ? item.createdAt : Date.now();
  return {
    id: typeof item.id === "string" ? item.id : generateId(),
    name: typeof item.name === "string" ? item.name : "",
    dialect: item.dialect === "Egyptian" ? "Egyptian" : "MSA",
    createdAt,
    updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : createdAt,
  };
}

function normalizeCollection(raw: unknown): Collection {
  const item = (raw || {}) as Partial<Collection>;
  const createdAt = typeof item.createdAt === "number" ? item.createdAt : Date.now();
  const deckIds = Array.isArray(item.deckIds) ? item.deckIds.filter((id) => typeof id === "string") : [];
  return {
    id: typeof item.id === "string" ? item.id : generateId(),
    name: typeof item.name === "string" ? item.name : "",
    deckIds,
    createdAt,
    updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : createdAt,
  };
}

function normalizeCard(raw: unknown): Flashcard {
  const item = (raw || {}) as Partial<Flashcard>;
  const createdAt = typeof item.createdAt === "number" ? item.createdAt : Date.now();
  const now = Date.now();
  return {
    id: typeof item.id === "string" ? item.id : generateId(),
    deckId: typeof item.deckId === "string" ? item.deckId : "",
    arabic: typeof item.arabic === "string" ? item.arabic : "",
    english: typeof item.english === "string" ? item.english : "",
    context: typeof item.context === "string" ? item.context : "",
    grammarNotes: typeof item.grammarNotes === "string" ? item.grammarNotes : "",
    dialect: item.dialect === "Egyptian" ? "Egyptian" : "MSA",
    customFields: normalizeCustomFields(item.customFields),
    createdAt,
    updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : createdAt,
    interval: typeof item.interval === "number" ? item.interval : 0,
    repetitions: typeof item.repetitions === "number" ? item.repetitions : 0,
    easeFactor: typeof item.easeFactor === "number" ? item.easeFactor : 2.5,
    dueDate: typeof item.dueDate === "number" ? item.dueDate : now,
  };
}

export async function getDecks(): Promise<Deck[]> {
  try {
    const raw = await AsyncStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeDeck(item));
  } catch {
    return [];
  }
}

export async function saveDeck(deck: Omit<Deck, "id" | "createdAt" | "updatedAt">): Promise<Deck> {
  const decks = await getDecks();
  const now = Date.now();
  const newDeck: Deck = {
    ...deck,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  decks.push(newDeck);
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  return newDeck;
}

export async function updateDeck(id: string, updates: Partial<Omit<Deck, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const decks = await getDecks();
  const idx = decks.findIndex((d) => d.id === id);
  if (idx >= 0) {
    decks[idx] = { ...decks[idx], ...updates, updatedAt: Date.now() };
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeCard(item));
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

export async function saveCard(card: Omit<Flashcard, "id" | "createdAt" | "updatedAt" | "interval" | "repetitions" | "easeFactor" | "dueDate">): Promise<Flashcard> {
  const cards = await getCards();
  const now = Date.now();
  const newCard: Flashcard = {
    ...card,
    customFields: normalizeCustomFields(card.customFields),
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: now,
  };
  cards.push(newCard);
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  return newCard;
}

export async function updateCard(id: string, updates: Partial<Flashcard>): Promise<void> {
  const cards = await getCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx >= 0) {
    const nextCard: Flashcard = { ...cards[idx], ...updates, updatedAt: Date.now() };
    if ("customFields" in updates) {
      nextCard.customFields = normalizeCustomFields(updates.customFields);
    }
    cards[idx] = nextCard;
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
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeCollection(item));
  } catch {
    return [];
  }
}

export async function saveCollection(collection: Omit<Collection, "id" | "createdAt" | "updatedAt">): Promise<Collection> {
  const collections = await getCollections();
  const now = Date.now();
  const newCollection: Collection = {
    ...collection,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  collections.push(newCollection);
  await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  return newCollection;
}

export async function updateCollection(id: string, updates: Partial<Omit<Collection, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const collections = await getCollections();
  const idx = collections.findIndex((c) => c.id === id);
  if (idx >= 0) {
    collections[idx] = { ...collections[idx], ...updates, updatedAt: Date.now() };
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }
}

export async function deleteCollection(id: string): Promise<void> {
  const collections = await getCollections();
  const filtered = collections.filter((c) => c.id !== id);
  await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filtered));
}

export async function addDeckToCollection(collectionId: string, deckId: string): Promise<void> {
  const collections = await getCollections();
  const idx = collections.findIndex((c) => c.id === collectionId);
  if (idx >= 0) {
    const deckIds = new Set(collections[idx].deckIds);
    deckIds.add(deckId);
    collections[idx] = { ...collections[idx], deckIds: Array.from(deckIds), updatedAt: Date.now() };
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }
}

export async function removeDeckFromCollection(collectionId: string, deckId: string): Promise<void> {
  const collections = await getCollections();
  const idx = collections.findIndex((c) => c.id === collectionId);
  if (idx >= 0) {
    collections[idx] = { ...collections[idx], deckIds: collections[idx].deckIds.filter((id) => id !== deckId), updatedAt: Date.now() };
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }
}

export async function getDecksInCollection(collectionId: string): Promise<Deck[]> {
  const collections = await getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return [];
  const decks = await getDecks();
  return decks.filter((d) => collection.deckIds.includes(d.id));
}

export async function buildBackup(deckId?: string, collectionId?: string): Promise<BackupData> {
  const decks = await getDecks();
  const cards = await getCards();
  const collections = await getCollections();

  if (collectionId) {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) {
      return {
        version: 1,
        exportedAt: Date.now(),
        decks: [],
        cards: [],
        collections: [],
      };
    }
    return {
      version: 1,
      exportedAt: Date.now(),
      decks: decks.filter((d) => collection.deckIds.includes(d.id)),
      cards: cards.filter((c) => collection.deckIds.includes(c.deckId)),
      collections: [collection],
    };
  }

  if (deckId) {
    const selectedDeck = decks.find((deck) => deck.id === deckId);
    if (!selectedDeck) {
      return {
        version: 1,
        exportedAt: Date.now(),
        decks: [],
        cards: [],
      };
    }

    return {
      version: 1,
      exportedAt: Date.now(),
      decks: [selectedDeck],
      cards: cards.filter((card) => card.deckId === deckId),
    };
  }

  return {
    version: 1,
    exportedAt: Date.now(),
    decks,
    cards,
    collections,
  };
}

function normalizeBackupData(raw: unknown): BackupData {
  const parsed = (raw || {}) as Partial<BackupData>;
  return {
    version: 1,
    exportedAt: typeof parsed.exportedAt === "number" ? parsed.exportedAt : Date.now(),
    decks: Array.isArray(parsed.decks) ? parsed.decks.map((deck) => normalizeDeck(deck)) : [],
    cards: Array.isArray(parsed.cards) ? parsed.cards.map((card) => normalizeCard(card)) : [],
    collections: Array.isArray(parsed.collections) ? parsed.collections.map((col) => normalizeCollection(col)) : [],
  };
}

export async function importBackup(raw: unknown): Promise<{ importedDecks: number; importedCards: number; importedCollections: number }> {
  const data = normalizeBackupData(raw);
  if (data.decks.length === 0) {
    return { importedDecks: 0, importedCards: 0, importedCollections: 0 };
  }

  const currentDecks = await getDecks();
  const currentCards = await getCards();
  const currentCollections = await getCollections();

  const deckIdMap = new Map<string, string>();
  const importedDecks: Deck[] = data.decks.map((deck) => {
    const newId = generateId();
    deckIdMap.set(deck.id, newId);
    return {
      ...deck,
      id: newId,
      createdAt: deck.createdAt || Date.now(),
      updatedAt: deck.updatedAt || deck.createdAt || Date.now(),
    };
  });

  const importedCards: Flashcard[] = data.cards
    .map((card) => {
      const mappedDeckId = deckIdMap.get(card.deckId);
      if (!mappedDeckId) return null;
      return {
        ...card,
        id: generateId(),
        deckId: mappedDeckId,
        createdAt: card.createdAt || Date.now(),
        updatedAt: card.updatedAt || card.createdAt || Date.now(),
      };
    })
    .filter((card): card is Flashcard => Boolean(card));

  const importedCollections: Collection[] = (data.collections || [])
    .map((collection) => {
      return {
        ...collection,
        id: generateId(),
        deckIds: collection.deckIds
          .map((oldId) => deckIdMap.get(oldId))
          .filter((id): id is string => Boolean(id)),
        createdAt: collection.createdAt || Date.now(),
        updatedAt: collection.updatedAt || collection.createdAt || Date.now(),
      };
    })
    .filter((col) => col.deckIds.length > 0);

  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify([...currentDecks, ...importedDecks]));
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify([...currentCards, ...importedCards]));
  if (importedCollections.length > 0) {
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify([...currentCollections, ...importedCollections]));
  }

  return { importedDecks: importedDecks.length, importedCards: importedCards.length, importedCollections: importedCollections.length };
}
