// paskyra.js — v2.11.0 „Mano paskyra“ (47 sk.) ir admin užklausos.
//
// Trys dalykai, kurių iki šiol nebuvo:
//   1) paieškų žurnalas – kas, kada, ko ieškojo, kiek rasta, kiek kainavo
//      ScraperAPI kreditais (iš ATSARGA skaitiklio; kelios paieškos vienu metu
//      dalinasi skaitikliu, tad skaičius apytikslis – `kr_apytiksliai`);
//   2) plano / kreditų užklausos (KL-PASKYRA-PLANAS: „Užklausa į admin zoną“) –
//      mokėjimų kortele dar nėra, planą priskiria administratorius;
//   3) slaptažodžio keitimas ir „Atsisiųsti mano duomenis“ (BDAR 15/20 str.).
// Paskyros ištrynimo ČIA NĖRA – laukia Teisininko atsakymo (ts-paskyra).

const bcrypt = require('bcryptjs');
let db = null;

const PORTALAI = ['autoplius', 'autogidas', 'autoscout24', 'otomoto', 'mobilede'];
const UZKL_TIPAI = { planas: ['pro', 'business'], kreditai: ['10', '50'] };

function prijungti(database) {
  db = database;
  db.exec(`
    CREATE TABLE IF NOT EXISTS paieskos_zurnalas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      laikas INTEGER NOT NULL,
      marke TEXT, modelis TEXT, metai_nuo INTEGER, metai_iki INTEGER,
      portalai TEXT,            -- JSON masyvas
      filtrai TEXT,             -- JSON (kartojimui), be kainų ribų nieko nekerpam
      busena TEXT,              -- done | error | talpykla
      rasta INTEGER,            -- nuskaityta skelbimų
      kandidatai INTEGER,
      scraper_kr INTEGER,       -- ScraperAPI užklausų skaičius (apytiksliai)
      kr_apytiksliai INTEGER DEFAULT 0,
      trukme_ms INTEGER
    );
    CREATE INDEX IF NOT EXISTS pz_user_laikas ON paieskos_zurnalas(user_id, laikas);
    CREATE INDEX IF NOT EXISTS pz_laikas ON paieskos_zurnalas(laikas);

    CREATE TABLE IF NOT EXISTS paskyros_uzklausos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      laikas INTEGER NOT NULL,
      tipas TEXT NOT NULL,      -- planas | kreditai
      kas TEXT NOT NULL,        -- pro | business | 10 | 50
      pastaba TEXT,
      busena TEXT NOT NULL DEFAULT 'laukia',   -- laukia | priskirta | atmesta
      admin TEXT, atsakyta INTEGER
    );
    CREATE INDEX IF NOT EXISTS pu_busena ON paskyros_uzklausos(busena, laikas);
  `);
  console.log('[PASKYRA] paieškų žurnalas ir užklausos paruošti');
}

// ── Paieškų žurnalas ────────────────────────────────────────────────────────
function irasytiPaieska(userId, f, rez) {
  try {
    f = f || {}; rez = rez || {};
    const portalai = (Array.isArray(f.portals) ? f.portals : ['autoplius', 'autogidas']).filter((p) => PORTALAI.includes(p));
    const filtrai = {};
    Object.keys(f).slice(0, 40).forEach((k) => {
      const v = f[k];
      if (v == null || v === '' || typeof v === 'object' && !Array.isArray(v)) return;
      filtrai[k] = Array.isArray(v) ? v.slice(0, 10).map((x) => String(x).slice(0, 40)) : String(v).slice(0, 80);
    });
    const int = (x) => { const n = parseInt(x, 10); return Number.isFinite(n) ? n : null; };
    db.prepare(`INSERT INTO paieskos_zurnalas (user_id, laikas, marke, modelis, metai_nuo, metai_iki, portalai, filtrai,
      busena, rasta, kandidatai, scraper_kr, kr_apytiksliai, trukme_ms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      userId, Date.now(), String(f.marke || '').slice(0, 40) || null, String(f.modelis || '').slice(0, 60) || null,
      int(f.metaiNuo), int(f.metaiIki), JSON.stringify(portalai), JSON.stringify(filtrai),
      rez.busena || null, int(rez.rasta), int(rez.kandidatai), int(rez.scraperKr), rez.apytiksliai ? 1 : 0, int(rez.trukmeMs));
  } catch (e) { console.error('[PASKYRA] paieškos įrašas:', e.message); }
}

function isPaieskos(r) {
  let portalai = [], filtrai = {};
  try { portalai = JSON.parse(r.portalai || '[]'); } catch (e) {}
  try { filtrai = JSON.parse(r.filtrai || '{}'); } catch (e) {}
  return {
    id: r.id, laikas: r.laikas, marke: r.marke, modelis: r.modelis, metaiNuo: r.metai_nuo, metaiIki: r.metai_iki,
    portalai, filtrai, busena: r.busena, rasta: r.rasta, kandidatai: r.kandidatai,
    scraperKr: r.scraper_kr, krApytiksliai: !!r.kr_apytiksliai, trukmeMs: r.trukme_ms,
  };
}
function paieskos(userId, kiek, nuo) {
  return db.prepare('SELECT * FROM paieskos_zurnalas WHERE user_id = ? ORDER BY laikas DESC LIMIT ? OFFSET ?')
    .all(userId, Math.min(kiek || 20, 200), nuo || 0).map(isPaieskos);
}
function paieskuSkaicius(userId) {
  return db.prepare('SELECT COUNT(*) AS n FROM paieskos_zurnalas WHERE user_id = ?').get(userId).n;
}

// ── Užklausos ───────────────────────────────────────────────────────────────
function naujaUzklausa(userId, tipas, kas, pastaba) {
  if (!UZKL_TIPAI[tipas] || !UZKL_TIPAI[tipas].includes(String(kas))) throw new Error('Neteisinga užklausa');
  const jau = db.prepare("SELECT id FROM paskyros_uzklausos WHERE user_id = ? AND busena = 'laukia' AND tipas = ? AND kas = ?").get(userId, tipas, String(kas));
  if (jau) return { id: jau.id, jau: true };
  const kiek = db.prepare("SELECT COUNT(*) AS n FROM paskyros_uzklausos WHERE user_id = ? AND busena = 'laukia'").get(userId).n;
  if (kiek >= 5) throw new Error('Jau yra 5 laukiančios užklausos');
  const r = db.prepare('INSERT INTO paskyros_uzklausos (user_id, laikas, tipas, kas, pastaba) VALUES (?,?,?,?,?)')
    .run(userId, Date.now(), tipas, String(kas), pastaba ? String(pastaba).slice(0, 300) : null);
  return { id: r.lastInsertRowid, jau: false };
}
function manoUzklausos(userId) {
  return db.prepare('SELECT id, laikas, tipas, kas, busena, atsakyta FROM paskyros_uzklausos WHERE user_id = ? ORDER BY laikas DESC LIMIT 20').all(userId);
}
function visosUzklausos(busena) {
  return db.prepare(`SELECT u.id, u.laikas, u.tipas, u.kas, u.pastaba, u.busena, u.admin, u.atsakyta, us.email
    FROM paskyros_uzklausos u JOIN users us ON us.id = u.user_id` + (busena ? ' WHERE u.busena = ?' : '') + ' ORDER BY u.laikas DESC LIMIT 200')
    .all(...(busena ? [busena] : []));
}
function uzklausa(id) {
  return db.prepare('SELECT u.*, us.email FROM paskyros_uzklausos u JOIN users us ON us.id = u.user_id WHERE u.id = ?').get(id);
}
function uzdarytiUzklausa(id, busena, adminEmail) {
  if (!['priskirta', 'atmesta'].includes(busena)) throw new Error('Neteisinga būsena');
  return db.prepare("UPDATE paskyros_uzklausos SET busena = ?, admin = ?, atsakyta = ? WHERE id = ? AND busena = 'laukia'")
    .run(busena, adminEmail || null, Date.now(), id).changes > 0;
}

// ── Slaptažodis ─────────────────────────────────────────────────────────────
async function keistiSlaptazodi(userId, dabartinis, naujas) {
  const u = db.prepare('SELECT hashed_password FROM users WHERE id = ?').get(userId);
  if (!u) throw Object.assign(new Error('Paskyra nerasta'), { kodas: 404 });
  if (typeof naujas !== 'string' || naujas.length < 8 || naujas.length > 200) throw Object.assign(new Error('Naujas slaptažodis – bent 8 simboliai'), { kodas: 400 });
  const ok = await bcrypt.compare(String(dabartinis || ''), u.hashed_password);
  if (!ok) throw Object.assign(new Error('Dabartinis slaptažodis neteisingas'), { kodas: 400 });
  const maisa = await bcrypt.hash(naujas, 12);
  db.prepare('UPDATE users SET hashed_password = ? WHERE id = ?').run(maisa, userId);
  return true;
}

// ── Eksportas (BDAR 15/20 str.) ─────────────────────────────────────────────
function eksportas(userId) {
  const u = db.prepare('SELECT id, email, created_at, plan, plan_iki, kreditai_plano, kreditai_pirkti, paieskos_menesi, paieskos_viso FROM users WHERE id = ?').get(userId) || {};
  const q = (sql) => { try { return db.prepare(sql).all(userId); } catch (e) { return []; } };
  return {
    sugeneruota: new Date().toISOString(),
    paaiskinimas: 'CarTriige: visi duomenys, kuriuos saugome apie jūsų paskyrą. Slaptažodis saugomas tik kaip neatkuriama maiša ir čia neįtrauktas.',
    paskyra: u,
    kredituZurnalas: q('SELECT laikas, veiksmas, raktas, kiekis, likutis_po, pastaba FROM kreditu_zurnalas WHERE user_id = ? ORDER BY laikas'),
    paieskos: q('SELECT * FROM paieskos_zurnalas WHERE user_id = ? ORDER BY laikas').map(isPaieskos),
    megstamiausi: q('SELECT * FROM megstamiausi WHERE user_id = ? ORDER BY prideta'),
    ataskaitos: q('SELECT id, tipas, raktas, pavadinimas, santrauka, laikas, duomenys FROM ataskaitos WHERE user_id = ? ORDER BY laikas')
      .map((a) => { let d = null; try { d = JSON.parse(a.duomenys); } catch (e) {} return Object.assign({}, a, { duomenys: d }); }),
    uzklausos: q('SELECT laikas, tipas, kas, busena, atsakyta FROM paskyros_uzklausos WHERE user_id = ? ORDER BY laikas'),
  };
}

module.exports = {
  prijungti, irasytiPaieska, paieskos, paieskuSkaicius,
  naujaUzklausa, manoUzklausos, visosUzklausos, uzklausa, uzdarytiUzklausa,
  keistiSlaptazodi, eksportas, UZKL_TIPAI,
};
