import { BackupData, Flashcard } from "@/lib/storage";

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function normalizeValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function collectCustomFieldColumns(cards: Flashcard[]): string[] {
  const names = new Set<string>();
  for (const card of cards) {
    for (const field of card.customFields || []) {
      const key = field.name.trim();
      if (key) names.add(key);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function buildRows(data: BackupData): { headers: string[]; rows: string[][] } {
  const deckNameMap = new Map(data.decks.map((deck) => [deck.id, deck.name]));
  const deckDialectMap = new Map(data.decks.map((deck) => [deck.id, deck.dialect]));
  const customColumns = collectCustomFieldColumns(data.cards);

  const headers = [
    "deck",
    "deck_dialect",
    "arabic",
    "english",
    "context",
    "grammar_notes",
    "card_dialect",
    "created_at",
    "updated_at",
    "due_date",
    "interval",
    "repetitions",
    "ease_factor",
    ...customColumns.map((name) => `custom:${name}`),
  ];

  const rows = data.cards.map((card) => {
    const customMap = new Map((card.customFields || []).map((field) => [field.name.trim(), field.value]));
    return [
      deckNameMap.get(card.deckId) || "",
      deckDialectMap.get(card.deckId) || "",
      normalizeValue(card.arabic),
      normalizeValue(card.english),
      normalizeValue(card.context),
      normalizeValue(card.grammarNotes),
      normalizeValue(card.dialect),
      normalizeValue(card.createdAt),
      normalizeValue(card.updatedAt),
      normalizeValue(card.dueDate),
      normalizeValue(card.interval),
      normalizeValue(card.repetitions),
      normalizeValue(card.easeFactor),
      ...customColumns.map((name) => normalizeValue(customMap.get(name) || "")),
    ];
  });

  return { headers, rows };
}

export function backupToCsv(data: BackupData): string {
  const { headers, rows } = buildRows(data);
  const lines = [headers.map((v) => csvEscape(v)).join(",")];
  for (const row of rows) {
    lines.push(row.map((v) => csvEscape(v)).join(","));
  }
  return lines.join("\n");
}

export function backupToTxt(data: BackupData): string {
  const { headers, rows } = buildRows(data);
  const lines = [headers.join("\t")];
  for (const row of rows) {
    lines.push(row.map((v) => normalizeValue(v).replace(/\t/g, " ")).join("\t"));
  }
  return lines.join("\n");
}
