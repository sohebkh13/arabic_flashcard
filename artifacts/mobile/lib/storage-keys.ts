// Storage key management with per-user scoping
// Guest users share a "guest" namespace; signed-in users get their own Clerk userId namespace

let _currentUserId = "guest";

export function setUserId(userId: string | null): void {
  _currentUserId = userId || "guest";
}

export function getUserId(): string {
  return _currentUserId;
}

export function isGuest(): boolean {
  return _currentUserId === "guest";
}

const PREFIX = "arabic_flashcards";

export const LEGACY_DECKS_KEY = `${PREFIX}_decks`;
export const LEGACY_CARDS_KEY = `${PREFIX}_cards`;
export const LEGACY_COLLECTIONS_KEY = `${PREFIX}_collections`;

export function getDecksKey(): string {
  return `${PREFIX}_${getUserId()}_decks`;
}

export function getCardsKey(): string {
  return `${PREFIX}_${getUserId()}_cards`;
}

export function getCollectionsKey(): string {
  return `${PREFIX}_${getUserId()}_collections`;
}

export function getGuestDecksKey(): string {
  return `${PREFIX}_guest_decks`;
}

export function getGuestCardsKey(): string {
  return `${PREFIX}_guest_cards`;
}

export function getGuestCollectionsKey(): string {
  return `${PREFIX}_guest_collections`;
}
