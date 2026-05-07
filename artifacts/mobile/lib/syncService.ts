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
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} — ${body}`);
  }
  return res.json() as Promise<T>;
}

// Server is the authoritative source of what exists.
// Items only on the server are added (created on another device).
// Items on both: local wins only if strictly newer (unsynced local edit), otherwise server wins.
// Items only local are DROPPED — they were deleted on another device.
function serverWinsMerge<T extends { id: string; updatedAt: number }>(
  local: T[],
  remote: T[],
): T[] {
  const localMap = new Map<string, T>();
  for (const item of local) localMap.set(item.id, item);

  return remote.map((serverItem) => {
    const localItem = localMap.get(serverItem.id);
    return (localItem && localItem.updatedAt > serverItem.updatedAt) ? localItem : serverItem;
  });
}

export async function pullFromServer(token: string): Promise<void> {
  const serverData = await apiFetch<SyncPayload>("/api/sync", token);

  const [localDecks, localCards, localCollections] = await Promise.all([
    getDecks(),
    getCards(),
    getCollections(),
  ]);

  const mergedDecks = serverWinsMerge(localDecks, serverData.decks);
  const mergedCards = serverWinsMerge(localCards, serverData.cards);
  const mergedCollections = serverWinsMerge(localCollections, serverData.collections);

  await Promise.all([
    AsyncStorage.setItem(getDecksKey(), JSON.stringify(mergedDecks)),
    AsyncStorage.setItem(getCardsKey(), JSON.stringify(mergedCards)),
    AsyncStorage.setItem(getCollectionsKey(), JSON.stringify(mergedCollections)),
  ]);
}

export async function deleteDeckFromServer(id: string, token: string): Promise<void> {
  await apiFetch(`/api/sync/deck/${id}`, token, { method: "DELETE" });
}

export async function deleteDecksFromServer(ids: string[], token: string): Promise<void> {
  if (ids.length === 0) return;
  await apiFetch("/api/sync/decks", token, { method: "DELETE", body: JSON.stringify({ ids }) });
}

export async function deleteCollectionFromServer(id: string, token: string): Promise<void> {
  await apiFetch(`/api/sync/collection/${id}`, token, { method: "DELETE" });
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
