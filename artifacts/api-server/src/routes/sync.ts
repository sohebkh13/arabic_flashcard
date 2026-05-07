import { cardsTable, collectionsTable, db, decksTable } from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import type { AuthedRequest } from "../middlewares/requireAuth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/sync", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  try {
    const [decks, dbCards, collections] = await Promise.all([
      db.select().from(decksTable).where(eq(decksTable.userId, userId)),
      db.select().from(cardsTable).where(eq(cardsTable.userId, userId)),
      db.select().from(collectionsTable).where(eq(collectionsTable.userId, userId)),
    ]);
    // DB stores arabic/english; client uses front/back
    const cards = dbCards.map(({ arabic, english, ...c }) => ({
      ...c,
      front: arabic,
      back: english,
    }));
    res.json({ decks, cards, collections });
  } catch (err) {
    console.error("[sync GET]", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to fetch sync data", detail: msg });
  }
});

router.put("/sync", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { decks = [], cards = [], collections = [] } = req.body as {
    decks: any[];
    cards: any[];
    collections: any[];
  };

  try {
    if (decks.length > 0) {
      await db
        .insert(decksTable)
        .values(decks.map((d) => ({ ...d, userId })))
        .onConflictDoUpdate({
          target: decksTable.id,
          set: {
            name: sql`excluded.name`,
            userId: sql`excluded.user_id`,
            dialect: sql`excluded.dialect`,
            updatedAt: sql`excluded.updated_at`,
          },
          setWhere: sql`${decksTable.updatedAt} < excluded.updated_at`,
        });
    }

    if (cards.length > 0) {
      await db
        .insert(cardsTable)
        .values(cards.map(({ front, back, ...c }: any) => ({
          ...c,
          // Client stores front/back; DB columns are arabic/english
          arabic: front ?? c.arabic ?? "",
          english: back ?? c.english ?? "",
          userId,
        })))
        .onConflictDoUpdate({
          target: cardsTable.id,
          set: {
            userId: sql`excluded.user_id`,
            deckId: sql`excluded.deck_id`,
            arabic: sql`excluded.arabic`,
            english: sql`excluded.english`,
            context: sql`excluded.context`,
            grammarNotes: sql`excluded.grammar_notes`,
            dialect: sql`excluded.dialect`,
            customFields: sql`excluded.custom_fields`,
            updatedAt: sql`excluded.updated_at`,
            interval: sql`excluded.interval`,
            repetitions: sql`excluded.repetitions`,
            easeFactor: sql`excluded.ease_factor`,
            dueDate: sql`excluded.due_date`,
          },
          setWhere: sql`${cardsTable.updatedAt} < excluded.updated_at`,
        });
    }

    if (collections.length > 0) {
      await db
        .insert(collectionsTable)
        .values(collections.map((c) => ({ ...c, userId })))
        .onConflictDoUpdate({
          target: collectionsTable.id,
          set: {
            name: sql`excluded.name`,
            userId: sql`excluded.user_id`,
            deckIds: sql`excluded.deck_ids`,
            updatedAt: sql`excluded.updated_at`,
          },
          setWhere: sql`${collectionsTable.updatedAt} < excluded.updated_at`,
        });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[sync PUT]", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to sync data", detail: msg });
  }
});

router.delete("/sync/deck/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  try {
    await Promise.all([
      db.delete(decksTable).where(and(eq(decksTable.id, id), eq(decksTable.userId, userId))),
      db.delete(cardsTable).where(and(eq(cardsTable.deckId, id), eq(cardsTable.userId, userId))),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[sync DELETE deck]", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to delete deck", detail: msg });
  }
});

router.delete("/sync/decks", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) { res.json({ ok: true }); return; }
  try {
    await Promise.all([
      db.delete(decksTable).where(and(inArray(decksTable.id, ids), eq(decksTable.userId, userId))),
      db.delete(cardsTable).where(and(inArray(cardsTable.deckId, ids), eq(cardsTable.userId, userId))),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[sync DELETE decks]", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to delete decks", detail: msg });
  }
});

router.delete("/sync/collection/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = req.params;
  try {
    await db.delete(collectionsTable).where(and(eq(collectionsTable.id, id), eq(collectionsTable.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[sync DELETE collection]", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to delete collection", detail: msg });
  }
});

export default router;
