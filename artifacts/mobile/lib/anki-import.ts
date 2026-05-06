import { BackupData, Flashcard, Deck } from "./storage";

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function arabicScore(text: string): number {
  let n = 0;
  for (const ch of text) if (ARABIC_RE.test(ch)) n++;
  return n;
}

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/?(ul|ol|p|div|tr|td|th|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanCell(raw: string, html: boolean): string {
  let s = raw;
  s = s.replace(/\[sound:[^\]]*\]/gi, "").replace(/\[[^\]]*\]/g, (m) =>
    m.startsWith("[anki:") ? "" : m
  );
  if (html) s = stripHtml(s);
  return s.trim();
}

function guessSeparator(sampleLines: string[]): string {
  const candidates: [string, number][] = [
    ["\t", 0],
    [";", 0],
    [",", 0],
    ["|", 0],
  ];
  for (const line of sampleLines) {
    for (const c of candidates) {
      c[1] += line.split(c[0]).length - 1;
    }
  }
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates[0][1] > 0 ? candidates[0][0] : "\t";
}

// RFC 4180 compliant parser: handles quoted fields with embedded newlines and "" escapes.
function parseRfc4180(content: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"' && field === "") {
        inQuotes = true;
        i++;
      } else if (content.slice(i, i + sep.length) === sep) {
        row.push(field);
        field = "";
        i += sep.length;
      } else if (ch === "\r" && content[i + 1] === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i += 2;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function detectColumns(
  dataRows: string[][],
  maxCols: number,
  headerCols: string[] | null
): { frontCol: number; backCol: number } {
  const scores = new Array(maxCols).fill(0);
  const sample = dataRows.slice(0, 300);
  for (const row of sample) {
    for (let i = 0; i < row.length; i++) {
      scores[i] += arabicScore(row[i] || "");
    }
  }

  const maxScore = Math.max(...scores);
  let frontCol = maxScore > 0 ? scores.indexOf(maxScore) : 0;
  let backCol = frontCol === 0 ? 1 : 0;

  if (headerCols) {
    const frontKeys = ["arabic", "arab", "front", "word", "term", "question", "الكلمة", "عربي"];
    const backKeys = ["english", "translation", "meaning", "back", "definition", "answer", "gloss", "ترجمة"];

    let hFront = -1;
    let hBack = -1;
    for (let i = 0; i < headerCols.length; i++) {
      const h = headerCols[i].toLowerCase();
      if (hFront === -1 && frontKeys.some((k) => h.includes(k))) hFront = i;
      if (hBack === -1 && backKeys.some((k) => h.includes(k))) hBack = i;
    }
    if (hFront !== -1) frontCol = hFront;
    if (hBack !== -1) backCol = hBack;
  }

  return { frontCol, backCol };
}

export function parseAnkiTxt(content: string, deckName: string): BackupData {
  const allLines = content.split(/\r?\n/);
  const now = Date.now();

  let separator = "";
  let hasHtml = true;
  let deckColMeta = -1;

  // Extract metadata from leading # lines only
  let dataStartIdx = 0;
  for (let i = 0; i < allLines.length; i++) {
    const trimmed = allLines[i].trim();
    if (!trimmed) {
      dataStartIdx = i + 1;
      continue;
    }
    if (trimmed.startsWith("#")) {
      const meta = trimmed.slice(1).trim();
      const lc = meta.toLowerCase();
      if (lc.startsWith("separator:")) {
        const val = lc.slice("separator:".length).trim();
        if (val === "tab") separator = "\t";
        else if (val === "comma") separator = ",";
        else if (val === "semicolon") separator = ";";
        else if (val === "pipe") separator = "|";
        else separator = val;
      } else if (lc.startsWith("html:")) {
        hasHtml = lc.slice("html:".length).trim() === "true";
      } else if (lc.startsWith("deck column:")) {
        const n = parseInt(meta.slice("deck column:".length).trim(), 10);
        if (!isNaN(n)) deckColMeta = n - 1;
      }
      dataStartIdx = i + 1;
    } else {
      break;
    }
  }

  // Rebuild the data section and guess separator from raw lines if needed
  if (!separator) {
    const sampleLines = allLines.slice(dataStartIdx).filter((l) => l.trim()).slice(0, 20);
    separator = guessSeparator(sampleLines);
  }

  // Join remaining lines back and parse with RFC 4180 to handle multi-line quoted fields
  const dataContent = allLines.slice(dataStartIdx).join("\n");
  const allRows = parseRfc4180(dataContent, separator).filter((r) =>
    r.some((c) => c.trim())
  );
  const maxCols = allRows.length > 0 ? Math.max(...allRows.map((r) => r.length)) : 0;

  if (allRows.length === 0) {
    const deck: Deck = { id: makeId(), name: deckName, dialect: "MSA", createdAt: now, updatedAt: now };
    return { version: 1, exportedAt: now, decks: [deck], cards: [] };
  }

  // Detect optional header row
  let headerCols: string[] | null = null;
  let dataRows = allRows;
  const firstRow = allRows[0];
  const firstRowArabic = firstRow.reduce((a, cell) => a + arabicScore(cell), 0);

  if (firstRowArabic === 0 && firstRow.length >= 2) {
    const looksLikeHeader = firstRow.every((cell) => {
      const t = cell.trim();
      return t.length < 60 && /^[\w\s\-_.()[\]]+$/i.test(t);
    });
    if (looksLikeHeader) {
      headerCols = firstRow.map((h) => h.trim());
      dataRows = allRows.slice(1);
    }
  }

  const { frontCol, backCol } = detectColumns(dataRows, maxCols, headerCols);

  const extraIndices: number[] = [];
  for (let i = 0; i < maxCols; i++) {
    if (i !== frontCol && i !== backCol && i !== deckColMeta) {
      extraIndices.push(i);
    }
  }
  const extraNames: string[] = extraIndices.map((i) => {
    if (headerCols && i < headerCols.length) return headerCols[i];
    return `field${i + 1}`;
  });

  const deckMap = new Map<string, Deck>();
  const getOrCreate = (name: string): Deck => {
    const key = name.trim() || deckName;
    if (!deckMap.has(key)) {
      deckMap.set(key, { id: makeId(), name: key, dialect: "MSA", createdAt: now, updatedAt: now });
    }
    return deckMap.get(key)!;
  };
  getOrCreate(deckName);

  const cards: Flashcard[] = [];

  for (const row of dataRows) {
    const frontVal = cleanCell(row[frontCol] || "", hasHtml);
    const backVal = cleanCell(row[backCol] || "", hasHtml);

    if (!frontVal && !backVal) continue;

    let cardDeck: Deck;
    if (deckColMeta >= 0 && row[deckColMeta]) {
      cardDeck = getOrCreate(cleanCell(row[deckColMeta], hasHtml) || deckName);
    } else {
      cardDeck = deckMap.get(deckName)!;
    }

    const customFields = extraIndices
      .map((colIdx, i) => {
        const val = cleanCell(row[colIdx] || "", hasHtml);
        if (!val) return null;
        return { id: makeId(), name: extraNames[i], value: val };
      })
      .filter((f): f is { id: string; name: string; value: string } => f !== null);

    cards.push({
      id: makeId(),
      deckId: cardDeck.id,
      front: frontVal || backVal,
      back: backVal || frontVal,
      context: "",
      grammarNotes: "",
      dialect: "MSA",
      customFields,
      createdAt: now,
      updatedAt: now,
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: now,
    });
  }

  return {
    version: 1,
    exportedAt: now,
    decks: Array.from(deckMap.values()),
    cards,
  };
}
