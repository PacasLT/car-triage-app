// vartotojo-duomenys.js — vartotojo išsaugoti skelbimai ir sugeneruotos ataskaitos
//
// Anksčiau mėgstamiausi gyveno tik naršyklės localStorage – kitame įrenginyje
// jų nebūdavo. Dabar viskas, ką vartotojas išsaugo ar už ką sumoka kreditais,
// guli DB prie jo paskyros ir pasiekiama iš bet kur.

let db = null;

function prijungti(database) {
  db = database;
  db.exec(`
    CREATE TABLE IF NOT EXISTS megstamiausi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      modelis TEXT, kaina INTEGER, metai INTEGER, rida INTEGER,
      kuras TEXT, pavarai TEXT, photo TEXT, source TEXT,
      diff_pct REAL, market_median INTEGER, quality_score INTEGER,
      pastaba TEXT,
      prideta INTEGER NOT NULL,
      UNIQUE(user_id, url)
    );
    CREATE INDEX IF NOT EXISTS meg_user ON megstamiausi(user_id, prideta);

    CREATE TABLE IF NOT EXISTS ataskaitos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tipas TEXT NOT NULL,            -- analize | palyginimas | vin | pardavejas
      raktas TEXT NOT NULL,           -- url / vin / pardavėjo pavadinimas / urlų raktas
      pavadinimas TEXT,
      santrauka TEXT,
      photo TEXT,
      duomenys TEXT NOT NULL,         -- JSON
      laikas INTEGER NOT NULL,
      UNIQUE(user_id, tipas, raktas)
    );
    CREATE INDEX IF NOT EXISTS ata_user ON ataskaitos(user_id, laikas);
  `);
  console.log('[DUOMENYS] mėgstamiausi ir ataskaitos paruošti');
}

// ── Mėgstamiausi ───────────────────────────────────────────────────────────
const MEG_LAUKAI = ['modelis', 'kaina', 'metai', 'rida', 'kuras', 'pavarai', 'photo', 'source', 'diff_pct', 'market_median', 'quality_score', 'pastaba'];

function megstamiausi(userId) {
  return db.prepare('SELECT * FROM megstamiausi WHERE user_id = ? ORDER BY prideta DESC').all(userId)
    .map(isEilutesMeg);
}

function isEilutesMeg(r) {
  return {
    url: r.url, modelis: r.modelis, kaina: r.kaina, metai: r.metai, rida: r.rida,
    kuras: r.kuras, pavarai: r.pavarai, photo: r.photo, source: r.source,
    diffPct: r.diff_pct, marketMedian: r.market_median, qualityScore: r.quality_score,
    pastaba: r.pastaba, savedAt: r.prideta,
  };
}

function pridetiMegstama(userId, s) {
  if (!s || !s.url) throw new Error('Trūksta url');
  const sk = (v) => (v === undefined || v === '' || v === null || Number.isNaN(Number(v))) ? null : Number(v);
  db.prepare(`
    INSERT INTO megstamiausi (user_id, url, modelis, kaina, metai, rida, kuras, pavarai, photo, source, diff_pct, market_median, quality_score, pastaba, prideta)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id, url) DO UPDATE SET
      modelis = COALESCE(excluded.modelis, modelis), kaina = COALESCE(excluded.kaina, kaina),
      metai = COALESCE(excluded.metai, metai), rida = COALESCE(excluded.rida, rida),
      kuras = COALESCE(excluded.kuras, kuras), pavarai = COALESCE(excluded.pavarai, pavarai),
      photo = COALESCE(excluded.photo, photo), source = COALESCE(excluded.source, source),
      diff_pct = COALESCE(excluded.diff_pct, diff_pct), market_median = COALESCE(excluded.market_median, market_median),
      quality_score = COALESCE(excluded.quality_score, quality_score)
  `).run(userId, String(s.url).slice(0, 1000), s.modelis ? String(s.modelis).slice(0, 200) : null,
    sk(s.kaina), sk(s.metai), sk(s.rida), s.kuras || null, s.pavarai || null,
    s.photo ? String(s.photo).slice(0, 2000) : null, s.source || null,
    sk(s.diffPct), sk(s.marketMedian), sk(s.qualityScore), s.pastaba ? String(s.pastaba).slice(0, 500) : null, Date.now());
  return megstamiausi(userId);
}

function pasalintiMegstama(userId, url) {
  db.prepare('DELETE FROM megstamiausi WHERE user_id = ? AND url = ?').run(userId, url);
  return megstamiausi(userId);
}

function arMegstamas(userId, url) {
  return !!db.prepare('SELECT 1 FROM megstamiausi WHERE user_id = ? AND url = ?').get(userId, url);
}

// ── Ataskaitos ─────────────────────────────────────────────────────────────
const MAX_ATASKAITU = 300;

function issaugotiAtaskaita(userId, tipas, raktas, pavadinimas, santrauka, photo, duomenys) {
  if (!userId || !tipas || !raktas) return null;
  try {
    const json = JSON.stringify(duomenys || {});
    if (json.length > 4 * 1024 * 1024) { console.warn('[DUOMENYS] ataskaita per didelė, nesaugoma:', tipas, raktas); return null; }
    db.prepare(`
      INSERT INTO ataskaitos (user_id, tipas, raktas, pavadinimas, santrauka, photo, duomenys, laikas)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id, tipas, raktas) DO UPDATE SET
        pavadinimas = excluded.pavadinimas, santrauka = excluded.santrauka,
        photo = COALESCE(excluded.photo, photo), duomenys = excluded.duomenys, laikas = excluded.laikas
    `).run(userId, tipas, String(raktas).slice(0, 1000),
      pavadinimas ? String(pavadinimas).slice(0, 300) : null,
      santrauka ? String(santrauka).slice(0, 600) : null,
      photo ? String(photo).slice(0, 2000) : null, json, Date.now());
    // Seniausias ismetam, kad lentele neaugtu be ribos
    const kiek = db.prepare('SELECT COUNT(*) AS n FROM ataskaitos WHERE user_id = ?').get(userId).n;
    if (kiek > MAX_ATASKAITU) {
      db.prepare('DELETE FROM ataskaitos WHERE id IN (SELECT id FROM ataskaitos WHERE user_id = ? ORDER BY laikas ASC LIMIT ?)')
        .run(userId, kiek - MAX_ATASKAITU);
    }
    return true;
  } catch (e) { console.error('[DUOMENYS] ataskaitos įrašymo klaida:', e.message); return null; }
}

function ataskaitos(userId, tipas) {
  const sql = 'SELECT id, tipas, raktas, pavadinimas, santrauka, photo, laikas, length(duomenys) AS dydis FROM ataskaitos WHERE user_id = ?'
    + (tipas ? ' AND tipas = ?' : '') + ' ORDER BY laikas DESC LIMIT 300';
  return (tipas ? db.prepare(sql).all(userId, tipas) : db.prepare(sql).all(userId));
}

function ataskaita(userId, id) {
  const r = db.prepare('SELECT * FROM ataskaitos WHERE user_id = ? AND id = ?').get(userId, id);
  if (!r) return null;
  let duomenys = null;
  try { duomenys = JSON.parse(r.duomenys); } catch (e) { duomenys = null; }
  return { id: r.id, tipas: r.tipas, raktas: r.raktas, pavadinimas: r.pavadinimas, santrauka: r.santrauka, photo: r.photo, laikas: r.laikas, duomenys };
}

function pasalintiAtaskaita(userId, id) {
  return db.prepare('DELETE FROM ataskaitos WHERE user_id = ? AND id = ?').run(userId, id).changes > 0;
}

module.exports = {
  prijungti,
  megstamiausi, pridetiMegstama, pasalintiMegstama, arMegstamas,
  issaugotiAtaskaita, ataskaitos, ataskaita, pasalintiAtaskaita,
};
