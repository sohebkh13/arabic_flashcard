// Vercel serverless function — implements the full sync API directly.
// Requires environment variables: DATABASE_URL, CLERK_SECRET_KEY

const { Pool } = require("pg");
const { verifyToken } = require("@clerk/backend");

// Lazy pool — reused across warm invocations, created on first request
let _pool;
function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
};

async function authenticate(req) {
  const auth = req.headers["authorization"] || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return payload.sub;
  } catch {
    return null;
  }
}

async function handleGet(userId, res) {
  const pool = getPool();
  const [decks, cards, collections] = await Promise.all([
    pool.query(
      `SELECT id, user_id as "userId", name, dialect,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM decks WHERE user_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT id, user_id as "userId", deck_id as "deckId",
              arabic as front, english as back,
              context, grammar_notes as "grammarNotes", dialect,
              custom_fields as "customFields",
              created_at as "createdAt", updated_at as "updatedAt",
              interval, repetitions, ease_factor as "easeFactor", due_date as "dueDate"
       FROM cards WHERE user_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT id, user_id as "userId", name, deck_ids as "deckIds",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM collections WHERE user_id = $1`,
      [userId],
    ),
  ]);
  res.status(200).json({ decks: decks.rows, cards: cards.rows, collections: collections.rows });
}

async function handlePut(userId, body, res) {
  const pool = getPool();
  const { decks = [], cards = [], collections = [] } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const d of decks) {
      await client.query(
        `INSERT INTO decks (id, user_id, name, dialect, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, user_id = EXCLUDED.user_id,
           dialect = EXCLUDED.dialect, updated_at = EXCLUDED.updated_at
         WHERE decks.updated_at < EXCLUDED.updated_at`,
        [d.id, userId, d.name, d.dialect, d.createdAt, d.updatedAt],
      );
    }

    for (const c of cards) {
      const arabic = c.front ?? c.arabic ?? "";
      const english = c.back ?? c.english ?? "";
      await client.query(
        `INSERT INTO cards (
           id, user_id, deck_id, arabic, english, context, grammar_notes,
           dialect, custom_fields, created_at, updated_at,
           interval, repetitions, ease_factor, due_date
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           user_id=EXCLUDED.user_id, deck_id=EXCLUDED.deck_id,
           arabic=EXCLUDED.arabic, english=EXCLUDED.english,
           context=EXCLUDED.context, grammar_notes=EXCLUDED.grammar_notes,
           dialect=EXCLUDED.dialect, custom_fields=EXCLUDED.custom_fields,
           updated_at=EXCLUDED.updated_at, interval=EXCLUDED.interval,
           repetitions=EXCLUDED.repetitions, ease_factor=EXCLUDED.ease_factor,
           due_date=EXCLUDED.due_date
         WHERE cards.updated_at < EXCLUDED.updated_at`,
        [
          c.id, userId, c.deckId, arabic, english,
          c.context ?? "", c.grammarNotes ?? "",
          c.dialect, JSON.stringify(c.customFields ?? []),
          c.createdAt, c.updatedAt,
          c.interval ?? 0, c.repetitions ?? 0, c.easeFactor ?? 2.5, c.dueDate ?? 0,
        ],
      );
    }

    for (const c of collections) {
      await client.query(
        `INSERT INTO collections (id, user_id, name, deck_ids, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, user_id=EXCLUDED.user_id,
           deck_ids=EXCLUDED.deck_ids, updated_at=EXCLUDED.updated_at
         WHERE collections.updated_at < EXCLUDED.updated_at`,
        [c.id, userId, c.name, JSON.stringify(c.deckIds ?? []), c.createdAt, c.updatedAt],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  res.status(200).json({ ok: true });
}

async function handleDeleteDeck(userId, id, res) {
  const pool = getPool();
  await Promise.all([
    pool.query("DELETE FROM decks WHERE id = $1 AND user_id = $2", [id, userId]),
    pool.query("DELETE FROM cards WHERE deck_id = $1 AND user_id = $2", [id, userId]),
  ]);
  res.status(200).json({ ok: true });
}

async function handleDeleteDecks(userId, ids, res) {
  if (!Array.isArray(ids) || ids.length === 0) { res.status(200).json({ ok: true }); return; }
  const pool = getPool();
  await Promise.all([
    pool.query("DELETE FROM decks WHERE id = ANY($1) AND user_id = $2", [ids, userId]),
    pool.query("DELETE FROM cards WHERE deck_id = ANY($1) AND user_id = $2", [ids, userId]),
  ]);
  res.status(200).json({ ok: true });
}

async function handleDeleteCollection(userId, id, res) {
  const pool = getPool();
  await pool.query("DELETE FROM collections WHERE id = $1 AND user_id = $2", [id, userId]);
  res.status(200).json({ ok: true });
}

async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS).end();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!process.env.DATABASE_URL || !process.env.CLERK_SECRET_KEY) {
    res.status(503).json({ error: "Server not configured. Set DATABASE_URL and CLERK_SECRET_KEY in Vercel." });
    return;
  }

  const userId = await authenticate(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid Authorization token" });
    return;
  }

  const url = req.url || "";

  try {
    if (req.method === "GET" && /^\/api\/sync\/?(\?.*)?$/.test(url)) {
      await handleGet(userId, res);
    } else if (req.method === "PUT" && /^\/api\/sync\/?(\?.*)?$/.test(url)) {
      await handlePut(userId, req.body, res);
    } else if (req.method === "DELETE" && /^\/api\/sync\/deck\/([^/?]+)/.test(url)) {
      const id = url.match(/^\/api\/sync\/deck\/([^/?]+)/)[1];
      await handleDeleteDeck(userId, id, res);
    } else if (req.method === "DELETE" && /^\/api\/sync\/decks\/?(\?.*)?$/.test(url)) {
      await handleDeleteDecks(userId, req.body?.ids, res);
    } else if (req.method === "DELETE" && /^\/api\/sync\/collection\/([^/?]+)/.test(url)) {
      const id = url.match(/^\/api\/sync\/collection\/([^/?]+)/)[1];
      await handleDeleteCollection(userId, id, res);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (err) {
    console.error("[sync]", req.method, url, err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Internal server error", detail: msg });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
