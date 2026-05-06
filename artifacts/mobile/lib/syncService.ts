import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCards, getCollections, getDecks } from "./storage";
import type { Collection, Deck, Flashcard } from "./storage";
import { getCardsKey, getCollectionsKey, getDecksKey } from "./storage-keys";

interface SyncPayload {
  decks: Deck[];
  cards: Flashcard[];
  collections: Collection[];
}

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

async function apiFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function mergeById<T extends { id: string; updatedAt: number }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export async function pullFromServer(token: string): Promise<void> {
  const serverData = await apiFetch<SyncPayload>("/api/sync", token);

  const [localDecks, localCards, localCollections] = await Promise.all([
    getDecks(),
    getCards(),
    getCollections(),
  ]);

  const mergedDecks = mergeById(localDecks, serverData.decks);
  const mergedCards = mergeById(localCards, serverData.cards);
  const mergedCollections = mergeById(localCollections, serverData.collections);

  await Promise.all([
    AsyncStorage.setItem(getDecksKey(), JSON.stringify(mergedDecks)),
    AsyncStorage.setItem(getCardsKey(), JSON.stringify(mergedCards)),
    AsyncStorage.setItem(getCollectionsKey(), JSON.stringify(mergedCollections)),
  ]);
}

export async function pushToServer(token: string): Promise<void> {
  const [decks, cards, collections] = await Promise.all([
    getDecks(),
    getCards(),
    getCollections(),
  ]);
  await apiFetch("/api/sync", token, {
    method: "PUT",
    body: JSON.stringify({ decks, cards, collections }),
  });
}
