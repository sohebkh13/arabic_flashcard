import { bigint, index, integer, jsonb, pgTable, real, text } from "drizzle-orm/pg-core";

export interface CustomField {
  id: string;
  name: string;
  value: string;
}

export const decksTable = pgTable(
  "decks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    dialect: text("dialect").notNull().$type<"MSA" | "Egyptian">(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [index("decks_user_idx").on(t.userId)],
);

export const cardsTable = pgTable(
  "cards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    deckId: text("deck_id").notNull(),
    arabic: text("arabic").notNull().default(""),
    english: text("english").notNull().default(""),
    context: text("context").notNull().default(""),
    grammarNotes: text("grammar_notes").notNull().default(""),
    dialect: text("dialect").notNull().$type<"MSA" | "Egyptian">(),
    customFields: jsonb("custom_fields").$type<CustomField[]>().notNull().default([]),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    interval: integer("interval").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    easeFactor: real("ease_factor").notNull().default(2.5),
    dueDate: bigint("due_date", { mode: "number" }).notNull(),
  },
  (t) => [
    index("cards_user_idx").on(t.userId),
    index("cards_deck_idx").on(t.deckId),
  ],
);

export const collectionsTable = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    deckIds: jsonb("deck_ids").$type<string[]>().notNull().default([]),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [index("collections_user_idx").on(t.userId)],
);

export type DbDeck = typeof decksTable.$inferSelect;
export type DbCard = typeof cardsTable.$inferSelect;
export type DbCollection = typeof collectionsTable.$inferSelect;