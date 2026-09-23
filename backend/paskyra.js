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

    -- TS §5.1: vienas eksportas per 24 val.
    CREATE TABLE IF NOT EXISTS eksporto_zurnalas (
      user_id INTEGER PRIMARY KEY,
      paskutinis INTEGER NOT NULL,
      kartu INTEGER NOT NULL DEFAULT 1
    );
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
// Admin: visų vartotojų paieškos (Finansininkui – tikri ScraperAPI skaičiai; admin zonai).
function visosPaieskos(kiek, nuo) {
  return db.prepare(`SELECT p.*, u.email FROM paieskos_zurnalas p JOIN users u ON u.id = p.user_id
    ORDER BY p.laikas DESC LIMIT ? OFFSET ?`).all(Math.min(kiek || 100, 1000), nuo || 0)
    .map((r) => Object.assign(isPaieskos(r), { email: r.email }));
}
function paieskuSantrauka() {
  const r = db.prepare(`SELECT COUNT(*) AS viso,
      SUM(CASE WHEN kr_apytiksliai = 0 THEN 1 ELSE 0 END) AS tikslus,
      SUM(scraper_kr) AS kr_viso,
      MIN(laikas) AS nuo, MAX(laikas) AS iki FROM paieskos_zurnalas`).get();
  return r || null;
}

function paieskuSkaicius(userId) {
  return db.prepare('SELECT COUNT(*) AS n FROM paieskos_zurnalas WHERE user_id = ?').get(userId).n;
}

// Admin: kiek ScraperAPI kreditų per N d. sunaudojo kiekvienas vartotojas
// (56b vartotojų lentelės stulpelis „API kr. 30 d.").
function apiKrPagalVartotoja(dienu) {
  const nuo = Date.now() - (parseInt(dienu, 10) || 30) * 24 * 60 * 60 * 1000;
  const r = {};
  db.prepare(`SELECT user_id, SUM(scraper_kr) AS kr, MAX(kr_apytiksliai) AS apytiksliai
    FROM paieskos_zurnalas WHERE laikas >= ? AND user_id != 0 GROUP BY user_id`).all(nuo)
    .forEach((x) => { r[x.user_id] = { kr: x.kr || 0, apytiksliai: !!x.apytiksliai }; });
  return r;
}

// ── Admin suvestinė (56b) ───────────────────────────────────────────────────
// Vienas objektas admin zonos pirmam ekranui. Laukų vardai fiksuoti – pagal
// juos Dizaineris rašo lenteles (56b paketas).
function adminSuvestine(dienu, planoVardas) {
  const d = Math.min(Math.max(parseInt(dienu, 10) || 30, 1), 365);
  const iki = Date.now(), nuo = iki - d * 24 * 60 * 60 * 1000;
  const diena = (ms) => new Date(ms).toISOString().slice(0, 10);
  const eil = db.prepare('SELECT * FROM paieskos_zurnalas WHERE laikas >= ? ORDER BY laikas').all(nuo);

  const serija = [];
  const pagalDiena = {};
  for (let i = d - 1; i >= 0; i--) {
    const k = diena(iki - i * 24 * 60 * 60 * 1000);
    pagalDiena[k] = { diena: k, paieskos: 0, vartotojai: 0, scraperKr: 0, _v: new Set() };
    serija.push(pagalDiena[k]);
  }
  const modeliai = {}, portalai = {};
  let krViso = 0;
  eil.forEach((r) => {
    const k = pagalDiena[diena(r.laikas)];
    if (k) { k.paieskos++; k.scraperKr += r.scraper_kr || 0; if (r.user_id) k._v.add(r.user_id); }
    krViso += r.scraper_kr || 0;
    const mr = (r.marke || '—') + (r.modelis ? ' ' + r.modelis : '');
    (modeliai[mr] = modeliai[mr] || { marke: r.marke || null, modelis: r.modelis || null, paieskos: 0 }).paieskos++;
    let pl = []; try { pl = JSON.parse(r.portalai || '[]'); } catch (e) {}
    pl.forEach((x) => { (portalai[x] = portalai[x] || { portalas: x, paieskos: 0 }).paieskos++; });
  });
  serija.forEach((x) => { x.vartotojai = x._v.size; delete x._v; });
  const dalis = (n, viso) => (viso ? Math.round((n / viso) * 1000) / 10 : 0);
  const portaluViso = Object.values(portalai).reduce((a, b) => a + b.paieskos, 0);

  const men = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const u = db.prepare('SELECT id, plan, created_at, paskutinis_prisijungimas FROM users').all();
  const aktyvusId = new Set(eil.filter((r) => r.laikas >= men && r.user_id).map((r) => r.user_id));
  const planai = {};
  u.forEach((x) => {
    const k = x.plan || 'trial';
    const g = (planai[k] = planai[k] || { planas: k, pavadinimas: (planoVardas && planoVardas(k)) || k, kiek: 0, aktyvus: 0 });
    g.kiek++;
    if (aktyvusId.has(x.id)) g.aktyvus++;
  });
  const naujiMen = u.filter((x) => x.created_at && new Date(x.created_at).getTime() >= men).length;
  const aktyvusMen = aktyvusId.size;

  return {
    laikotarpis: { nuo: diena(nuo), iki: diena(iki), dienu: d },
    serija,
    topModeliai: Object.values(modeliai).sort((a, b) => b.paieskos - a.paieskos).slice(0, 10)
      .map((x) => Object.assign({}, x, { dalisProc: dalis(x.paieskos, eil.length) })),
    portalai: Object.values(portalai).sort((a, b) => b.paieskos - a.paieskos)
      .map((x) => Object.assign({}, x, { dalisProc: dalis(x.paieskos, portaluViso) })),
    vartotojai: { viso: u.length, naujiMen, aktyvusMen, pagalPlana: Object.values(planai).sort((a, b) => b.kiek - a.kiek) },
    paieskos: {
      viso: eil.length, krViso,
      krVidutiniskai: eil.length ? Math.round(krViso / eil.length) : 0,
      tikslus: eil.filter((r) => !r.kr_apytiksliai).length,
    },
  };
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

async function patikrintiSlaptazodi(userId, slaptazodis) {
  const u = db.prepare('SELECT hashed_password FROM users WHERE id = ?').get(userId);
  if (!u) throw Object.assign(new Error('Paskyra nerasta'), { kodas: 404 });
  const ok = await bcrypt.compare(String(slaptazodis || ''), u.hashed_password);
  if (!ok) throw Object.assign(new Error('Slaptažodis neteisingas'), { kodas: 400 });
  return true;
}

// ── Eksportas (BDAR 15/20 str.) ─────────────────────────────────────────────
// TS §5.1: viršuje paaiškinimas ir nuoroda į privatumo politiką; įtraukta
// registracijos data, paskutinis prisijungimas, plano ir kreditų priskyrimo
// istorija ir vartotojo klaidų pranešimai (juos priduria server.js – jie
// gyvena JSON faile, ne DB). Slaptažodžio maiša NEĮTRAUKIAMA niekada.
const EKSPORTO_TARPAS_MS = 24 * 60 * 60 * 1000;

function arGalimaEksportuoti(userId) {
  const r = db.prepare('SELECT paskutinis FROM eksporto_zurnalas WHERE user_id = ?').get(userId);
  if (!r) return { galima: true, kitas: null };
  const kitas = r.paskutinis + EKSPORTO_TARPAS_MS;
  return { galima: Date.now() >= kitas, kitas };
}
function zymetiEksporta(userId) {
  db.prepare(`INSERT INTO eksporto_zurnalas (user_id, paskutinis, kartu) VALUES (?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET paskutinis = excluded.paskutinis, kartu = kartu + 1`).run(userId, Date.now());
}

function eksportas(userId, papildomai) {
  const u = db.prepare(`SELECT id, email, created_at, paskutinis_prisijungimas, plan, plan_iki,
    kreditai_plano, kreditai_pirkti, paieskos_menesi, paieskos_viso FROM users WHERE id = ?`).get(userId) || {};
  const q = (sql) => { try { return db.prepare(sql).all(userId); } catch (e) { return []; } };
  const kredituZurnalas = q('SELECT laikas, veiksmas, raktas, kiekis, likutis_po, pastaba FROM kreditu_zurnalas WHERE user_id = ? ORDER BY laikas');
  return {
    apie: {
      kas: 'CarTriige – visi duomenys, kuriuos saugome apie jūsų paskyrą (BDAR 15 ir 20 str.).',
      sugeneruota: new Date().toISOString(),
      slaptazodis: 'Slaptažodis saugomas tik kaip neatkuriama maiša ir į eksportą neįtraukiamas.',
      privatumoPolitika: process.env.PRIVATUMO_NUORODA || null,
      klausimai: process.env.DUOMENU_KONTAKTAS || null,
    },
    paskyra: {
      email: u.email, sukurta: u.created_at, paskutinisPrisijungimas: u.paskutinis_prisijungimas,
      planas: u.plan, planIki: u.plan_iki,
      kreditai: { plano: u.kreditai_plano, pirkti: u.kreditai_pirkti },
      paieskos: { menesi: u.paieskos_menesi, viso: u.paieskos_viso },
    },
    // Plano ir kreditų priskyrimai (TS §5.1 b) – tas pats žurnalas, atrinkti įrašai
    planoIstorija: kredituZurnalas.filter((x) => x.veiksmas === 'planas' || x.veiksmas === 'admin'),
    kredituZurnalas,
    paieskos: q('SELECT * FROM paieskos_zurnalas WHERE user_id = ? ORDER BY laikas').map(isPaieskos),
    megstamiausi: q('SELECT * FROM megstamiausi WHERE user_id = ? ORDER BY prideta'),
    ataskaitos: q('SELECT id, tipas, raktas, pavadinimas, santrauka, laikas, duomenys FROM ataskaitos WHERE user_id = ? ORDER BY laikas')
      .map((a) => { let d = null; try { d = JSON.parse(a.duomenys); } catch (e) {} return Object.assign({}, a, { duomenys: d }); }),
    uzklausos: q('SELECT laikas, tipas, kas, busena, atsakyta FROM paskyros_uzklausos WHERE user_id = ? ORDER BY laikas'),
    klaiduPranesimai: (papildomai && papildomai.klaidos) || [],
  };
}

// ── Paskyros ištrynimas: 7 d. užšaldymas (TS-0922-1900, Luko sprendimas) ────
// Vartotojas pažymi paskyrą trynimui; 7 dienas gali persigalvoti (prisijungęs
// mato likusį laiką ir mygtuką „Atšaukti“). Po 7 d. automatinis valymas ištrina.
const UZSALDYMAS_MS = 7 * 24 * 60 * 60 * 1000;

async function pazymetiTrynimui(userId, slaptazodis) {
  await patikrintiSlaptazodi(userId, slaptazodis);
  const dabar = Date.now();
  db.prepare('UPDATE users SET trynimo_data = ? WHERE id = ?').run(dabar, userId);
  return { pazymeta: dabar, ivyks: dabar + UZSALDYMAS_MS };
}
function atsauktiTrynima(userId) {
  return db.prepare('UPDATE users SET trynimo_data = NULL WHERE id = ?').run(userId).changes > 0;
}
function trynimoBusena(userId) {
  const u = db.prepare('SELECT trynimo_data FROM users WHERE id = ?').get(userId);
  if (!u || !u.trynimo_data) return null;
  return { pazymeta: u.trynimo_data, ivyks: u.trynimo_data + UZSALDYMAS_MS };
}
function laukiantysIstrynimo(dabar) {
  const riba = (dabar || Date.now()) - UZSALDYMAS_MS;
  return db.prepare('SELECT id, email FROM users WHERE trynimo_data IS NOT NULL AND trynimo_data <= ?').all(riba);
}

// ── Paskyros ištrynimas (TS §5.2) ───────────────────────────────────────────
// Trinam: users, megstamiausi, ataskaitos, eksporto žurnalą. Nuasmeninam:
// kreditų žurnalą, paieškų žurnalą, plano užklausas (user_id = 0 – apskaitai
// ir savikainai skaičiai lieka, žmogus nebeatpažįstamas). rinka.db neliečiam.
// Klaidų pranešimus (el. paštas, IP, ekranvaizdis) tvarko server.js.
function istrintiPaskyra(userId) {
  const rez = { istrinta: {}, nuasmeninta: {} };
  const tx = db.transaction(() => {
    rez.nuasmeninta.kreditu_zurnalas = db.prepare('UPDATE kreditu_zurnalas SET user_id = 0, pastaba = NULL WHERE user_id = ?').run(userId).changes;
    rez.nuasmeninta.paieskos_zurnalas = db.prepare('UPDATE paieskos_zurnalas SET user_id = 0 WHERE user_id = ?').run(userId).changes;
    rez.nuasmeninta.paskyros_uzklausos = db.prepare('UPDATE paskyros_uzklausos SET user_id = 0, pastaba = NULL WHERE user_id = ?').run(userId).changes;
    rez.istrinta.megstamiausi = db.prepare('DELETE FROM megstamiausi WHERE user_id = ?').run(userId).changes;
    rez.istrinta.ataskaitos = db.prepare('DELETE FROM ataskaitos WHERE user_id = ?').run(userId).changes;
    rez.istrinta.eksporto_zurnalas = db.prepare('DELETE FROM eksporto_zurnalas WHERE user_id = ?').run(userId).changes;
    rez.istrinta.users = db.prepare('DELETE FROM users WHERE id = ?').run(userId).changes;
  });
  tx();
  return rez;
}

// ── Automatinis valymas (TS §5.3) ───────────────────────────────────────────
// Paieškų ir kreditų žurnalas – 12 mėn., po to nuasmeninama (user_id = 0).
// Klaidų pranešimai (12 mėn.) ir rinka.db (24 mėn.) tvarkomi kitur.
const METAI_MS = 365 * 24 * 60 * 60 * 1000;
function valymas(dabar) {
  const riba = (dabar || Date.now()) - METAI_MS;
  const p = db.prepare('UPDATE paieskos_zurnalas SET user_id = 0 WHERE user_id != 0 AND laikas < ?').run(riba).changes;
  const k = db.prepare('UPDATE kreditu_zurnalas SET user_id = 0, pastaba = NULL WHERE user_id != 0 AND laikas < ?').run(riba).changes;
  if (p || k) console.log(`[PASKYRA] valymas (12 mėn.): nuasmeninta paieškų ${p}, kreditų įrašų ${k}`);
  return { paieskos: p, kreditai: k };
}

module.exports = {
  prijungti, irasytiPaieska, paieskos, paieskuSkaicius, visosPaieskos, paieskuSantrauka,
  adminSuvestine, apiKrPagalVartotoja,
  naujaUzklausa, manoUzklausos, visosUzklausos, uzklausa, uzdarytiUzklausa,
  keistiSlaptazodi, patikrintiSlaptazodi, eksportas, arGalimaEksportuoti, zymetiEksporta,
  pazymetiTrynimui, atsauktiTrynima, trynimoBusena, laukiantysIstrynimo,
  istrintiPaskyra, valymas, UZKL_TIPAI, EKSPORTO_TARPAS_MS, UZSALDYMAS_MS,
};
