// backend/rinka.js — skelbimų archyvas (rinkos duomenų bazė).
//
//     /data/rinka.db  (SQLite, WAL)
//
// KODĖL ATSKIRAS FAILAS, O NE users.db: vartotojai ir rinka turi skirtingą
// vertę ir skirtingą augimą. Rinka auga tūkstančiais eilučių per skenavimą;
// jei ji sugestų ar ją tektų ištrinti, vartotojai neturi nukentėti.
//
// KODĖL NE JSON, KAIP market-history.json: JSON failas visas laikomas
// atmintyje ir visas perrašomas kiekvieną kartą. 2 500 skelbimų su dienos
// stebėjimais per metus - apie milijoną eilučių. SQLite rašo tik tai, kas
// pasikeitė, ir nutrūkus procesui failas nesugadinamas.
//
// TAPATYBĖ: skelbimas = portalas + portalo skelbimo numeris iš adreso
// (autoplius `...-28797115.html`, autogidas `...-0137877215.html`). Adresas
// gali keistis (portalas perrašo pavadinimo dalį), numeris - ne.
//
// DINGIMAS: skelbimas pažymimas dingusiu tik po DVIEJŲ iš eilės PILNŲ
// skenavimų, kuriuose jo nebuvo. Vieno nepakanka: rikiuojant „naujausi
// viršuje", skenavimo metu įkelti nauji skelbimai stumia sąrašą, ir vienas
// kitas skelbimas tarp puslapių praslysta. Nepilnas skenavimas (nutrūko,
// pasiekė puslapių ribą) dingimo nežymi niekada.
//
// Šis modulis NEKVIEČIA tinklo ir nekainuoja kreditų: jis tik rašo tai, ką
// atnešė server.js.

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
// v2.27.0: `l.source` yra DOMENAS („mobile.de"), o archyve portalas laikomas
// trumpuoju vardu. Vertimas gyvena VIENOJE vietoje - `rinkos.js` (K-72).
const { portaloRaktas } = require('./rinkos');

// Laukai, kurie į archyvą NEPATENKA, ir kodėl.
const NESAUGOMA = {
  turiLizingoOpcija: 'abiejuose portaluose visada true - tai portalo finansavimo valdiklis, ne skelbimo savybė (pamatuota 2026-09-21)',
  rawText: 'derinimo tekstas, ne duomuo',
  photos: 'saugom tik pirmą nuotrauką (photo); galerija kas dieną keičia adresus',
  ikeltaTekstas: 'žmogui skirtas „prieš 3 d." - saugom ikeltaLaikas',
};

let db = null;
let DB_KELIAS = null;

function ikelti(katalogas, failas) {
  DB_KELIAS = path.join(katalogas, failas || 'rinka.db');
  fs.mkdirSync(katalogas, { recursive: true });
  db = new Database(DB_KELIAS);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS skelbimai (
      id              TEXT PRIMARY KEY,          -- 'autoplius:28797115'
      portalas        TEXT NOT NULL,
      url             TEXT NOT NULL,
      marke           TEXT,
      modelis         TEXT,
      metai           INTEGER,
      menuo           INTEGER,
      kuras           TEXT,
      pavarai         TEXT,
      kebulas         TEXT,
      galia           INTEGER,
      variklio_turis  REAL,
      miestas         TEXT,
      verslas         INTEGER,
      turi_vin        INTEGER,
      garantija       INTEGER,
      kaina           INTEGER,
      rida            INTEGER,
      kainos_ispejimas TEXT,
      ikelta_laikas   INTEGER,                   -- portalo laikas (autogide - ATNAUJINIMO)
      photo           TEXT,
      kita            TEXT,                      -- likę analizatoriaus laukai JSON
      pirma_matytas   INTEGER NOT NULL,
      paskut_matytas  INTEGER NOT NULL,
      kartu_matytas   INTEGER NOT NULL DEFAULT 1,
      praleista       INTEGER NOT NULL DEFAULT 0,
      dingo           INTEGER,
      -- v2.27.0 (Analitiko prasymas): du laukai, kurie nieko nekainuoja - juos
      -- jau turim atmintyje nuskaitymo metu. teksto_ilgis - NE pats tekstas:
      -- aprasymo ilgis yra pozymis (trumpas skelbimas = maziau informacijos),
      -- o pats tekstas i archyva nerasomas (BDAR, NESAUGOMA.rawText).
      nuotrauku_sk    INTEGER,
      teksto_ilgis    INTEGER
    );
    CREATE INDEX IF NOT EXISTS sk_modelis ON skelbimai(marke, modelis, metai);
    CREATE INDEX IF NOT EXISTS sk_portalas ON skelbimai(portalas, dingo);

    -- Kainos ir ridos istorija: eilutė įrašoma tik kai kas nors PASIKEITĖ
    -- (ir pirmą kartą pamačius). Tas pats skelbimas kasdien neduplikuojamas.
    CREATE TABLE IF NOT EXISTS stebejimai (
      skelbimo_id TEXT NOT NULL,
      laikas      INTEGER NOT NULL,
      kaina       INTEGER,
      rida        INTEGER,
      skenavimas  INTEGER
    );
    CREATE INDEX IF NOT EXISTS st_id ON stebejimai(skelbimo_id, laikas);

    CREATE TABLE IF NOT EXISTS skenavimai (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      portalas    TEXT NOT NULL,
      marke       TEXT,
      -- v2.27.1: skenavimas gali buti ir VIENO MODELIO. Tada aprieptis siauresne,
      -- ir dingima galima zymeti TIK tarp to paties modelio skelbimu - kitaip
      -- „Tiguan" skenavimas paskelbtu dingusiais visus kitus VW.
      modelis     TEXT,
      metai_nuo   INTEGER,
      url         TEXT,
      pradzia     INTEGER NOT NULL,
      pabaiga     INTEGER,
      busena      TEXT NOT NULL,               -- vyksta | baigta | nutraukta | klaida
      pilnas      INTEGER NOT NULL DEFAULT 0,  -- pasiekė sąrašo galą
      priezastis  TEXT,                        -- kodėl sustojo
      puslapiu    INTEGER NOT NULL DEFAULT 0,
      skelbimu    INTEGER NOT NULL DEFAULT 0,
      nauju       INTEGER NOT NULL DEFAULT 0,
      pasikeite   INTEGER NOT NULL DEFAULT 0,
      dingo       INTEGER NOT NULL DEFAULT 0,
      kreditu     INTEGER
    );
  `);
  // Senoms bazems (Railway diske jau yra) - stulpeliai pridedami atskirai.
  // `CREATE TABLE IF NOT EXISTS` ju neprideda, o migraciju versiju cia nera:
  // uzklausa idempotentiska, klaida reiskia „jau yra".
  for (const st of ['nuotrauku_sk INTEGER', 'teksto_ilgis INTEGER']) {
    try { db.exec('ALTER TABLE skelbimai ADD COLUMN ' + st); } catch (e) { /* jau yra */ }
  }
  try { db.exec('ALTER TABLE skenavimai ADD COLUMN modelis TEXT'); } catch (e) { /* jau yra */ }
  taisytiSenusIrasus();
  // Skenavimas, kurį nutraukė perkrovimas, liktų „vyksta" amžinai.
  const pakibe = db.prepare(`UPDATE skenavimai SET busena='nutraukta', priezastis='serveris perkrautas', pabaiga=?
                             WHERE busena='vyksta'`).run(Date.now()).changes;
  const n = db.prepare('SELECT COUNT(*) c FROM skelbimai').get().c;
  console.log('[RINKA] ' + DB_KELIAS + ' · skelbimu: ' + n + (pakibe ? ' · nutrauktu skenavimu: ' + pakibe : ''));
  return { kelias: DB_KELIAS, skelbimu: n };
}

// ── v2.4.2 · įrašų, nuskaitytų su senomis klaidomis, taisymas ────────────────
// Archyvo auditas (Z-66) rado keturias nuskaitymo klaidas. Nuskaitymas
// pataisytas, bet 2 484 jau įrašytos eilutės liktų klaidingos iki kito
// skenavimo. Užklausos IDEMPOTENTIŠKOS - antrą kartą nieko nekeičia, tad
// leidžiamos kiekvieno starto metu, be jokios „migracijos versijos".
//
// Ko NEtaisom: tikros hibridų ridos atkurti negalim (įrašytas elektrinis
// nuotolis, ridos nėra) - tokiai eilutei rida tampa NULL, t. y. „nežinoma",
// o ne klaidinga. Kitas skenavimas ją užpildys (COALESCE).
function taisytiSenusIrasus() {
  const r = {};
  r.turis0 = db.prepare('UPDATE skelbimai SET variklio_turis=NULL WHERE variklio_turis=0').run().changes;
  r.nuotolisVietojRidos = db.prepare(`UPDATE skelbimai SET rida=NULL
      WHERE portalas='autoplius' AND rida IS NOT NULL AND rida < 1000 AND lower(kuras) LIKE '%elektra%'`).run().changes;
  r.nerealiKaina = db.prepare('UPDATE skelbimai SET kaina=NULL WHERE kaina > 1500000').run().changes;
  // Kuras - vienas žodynas (autoplius „Benzinas / elektra", autogidas „Benzinas/Elektra", „Elektra, 84 kWh")
  const kurai = db.prepare('SELECT DISTINCT kuras FROM skelbimai WHERE kuras IS NOT NULL').all().map((x) => x.kuras);
  const upd = db.prepare('UPDATE skelbimai SET kuras=? WHERE kuras=?');
  r.kuras = 0;
  for (const k of kurai) { const n = kuroNorm(k); if (n !== k) r.kuras += upd.run(n, k).changes; }
  // autogidas: reklama antraštėje - modelis iš adreso (ta pati taisyklė, kaip nuskaityme)
  const blogi = db.prepare(`SELECT id, url, modelis FROM skelbimai WHERE portalas='autogidas'`).all();
  const upM = db.prepare('UPDATE skelbimai SET modelis=? WHERE id=?');
  r.modelis = 0;
  for (const e of blogi) {
    const sl = (String(e.url).match(/\/skelbimas\/([a-z0-9-]+?)-\d{4}-m-/i) || [])[1];
    const pirmas = (String(e.modelis || '').split(' ')[0] || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!sl || !pirmas || !sl.startsWith(pirmas + '-')) continue;
    const mz = sl.slice(pirmas.length + 1).split('-')[0];
    if (mz && !String(e.modelis).toLowerCase().includes(mz)) { upM.run(String(e.modelis).split(' ')[0] + ' ' + mz.toUpperCase(), e.id); r.modelis++; }
  }
  const viso = Object.values(r).reduce((a, b) => a + b, 0);
  if (viso) console.log('[RINKA] pataisyti seni irasai:', JSON.stringify(r));
  return r;
}

// ── Tapatybė ─────────────────────────────────────────────────────────────────
function skelbimoId(portalas, url) {
  const m = String(url || '').match(/-(\d{5,})\.html(?:[?#].*)?$/);
  if (m) return portalas + ':' + m[1].replace(/^0+/, '');
  // v2.4.6: mobile.de - details.html?id=461901295
  const q = String(url || '').match(/[?&]id=(\d{5,})(?:&|#|$)/);
  if (q) return portalas + ':' + q[1];
  return url ? portalas + ':' + String(url) : null;
}

// v2.4.2: `Number(null)` yra 0, ne NaN - tad trūkstamas variklio tūris
// elektromobiliams buvo įrašomas kaip 0 (archyve 390 eilučių). null lieka null.
const sk = (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };

// v2.4.2: vienas kuro žodynas abiem portalams. autoplius rašo „Benzinas / elektra",
// autogidas - „Benzinas/Elektra"; statistika skilo į dvi grupes. Plius
// autoplius elektromobiliams prikabina bateriją („Elektra, 84 kWh").
function kuroNorm(k) {
  if (k == null || k === '') return null;
  const t = String(k).split(',')[0].trim().toLowerCase().replace(/\s*\/\s*/g, ' / ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const sv = (v) => (v == null || Number.isNaN(v) ? null : Math.round(Number(v)) || null);
const bl = (v) => (v === true ? 1 : v === false ? 0 : null);
const tx = (v) => (v == null || v === '' ? null : String(v));

// Stulpeliai, kuriuos turim atskirai; visa kita (be NESAUGOMA) - į `kita`.
const STULPELIAI = new Set(['url', 'modelis', 'metai', 'menuo', 'kuras', 'pavarai', 'kebulas', 'galia',
  'variklioTuris', 'miestas', 'yraVerslas', 'turiVin', 'turiGarantija', 'kaina', 'rida',
  'kainosIspejimas', 'ikeltaLaikas', 'photo', 'source']);

function kitiLaukai(l) {
  const o = {};
  for (const k of Object.keys(l)) {
    if (STULPELIAI.has(k) || NESAUGOMA[k]) continue;
    const v = l[k];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    o[k] = v;
  }
  return Object.keys(o).length ? JSON.stringify(o) : null;
}

// ── Skenavimas ───────────────────────────────────────────────────────────────
function pradeti({ portalas, marke, modelis, metaiNuo, url }) {
  const r = db.prepare(`INSERT INTO skenavimai (portalas, marke, modelis, metai_nuo, url, pradzia, busena)
                        VALUES (?, ?, ?, ?, ?, ?, 'vyksta')`)
    .run(portalas, marke || null, modelis || null, metaiNuo || null, url || null, Date.now());
  return Number(r.lastInsertRowid);
}

function vykstantis() {
  return db.prepare(`SELECT * FROM skenavimai WHERE busena='vyksta' ORDER BY id DESC LIMIT 1`).get() || null;
}

// Vienas puslapis -> į DB iš karto. Jei skenavimas nutrūks 60-ame puslapyje,
// pirmi 59 jau išsaugoti.
function irasytiPuslapi(skenavimoId, portalas, marke, listings) {
  const dabar = Date.now();
  const gauti = db.prepare('SELECT kaina, rida FROM skelbimai WHERE id=?');
  const naujas = db.prepare(`INSERT INTO skelbimai
    (id, portalas, url, marke, modelis, metai, menuo, kuras, pavarai, kebulas, galia, variklio_turis, miestas,
     verslas, turi_vin, garantija, kaina, rida, kainos_ispejimas, ikelta_laikas, photo, kita,
     nuotrauku_sk, teksto_ilgis, pirma_matytas, paskut_matytas)
    VALUES (@id, @portalas, @url, @marke, @modelis, @metai, @menuo, @kuras, @pavarai, @kebulas, @galia, @variklio_turis, @miestas,
     @verslas, @turi_vin, @garantija, @kaina, @rida, @kainos_ispejimas, @ikelta_laikas, @photo, @kita,
     @nuotrauku_sk, @teksto_ilgis, @laikas, @laikas)`);
  const atnaujinti = db.prepare(`UPDATE skelbimai SET
      url=@url, modelis=COALESCE(@modelis, modelis), metai=COALESCE(@metai, metai), menuo=COALESCE(@menuo, menuo),
      kuras=COALESCE(@kuras, kuras), pavarai=COALESCE(@pavarai, pavarai), kebulas=COALESCE(@kebulas, kebulas),
      galia=COALESCE(@galia, galia), variklio_turis=COALESCE(@variklio_turis, variklio_turis),
      miestas=COALESCE(@miestas, miestas), verslas=COALESCE(@verslas, verslas), turi_vin=COALESCE(@turi_vin, turi_vin),
      garantija=COALESCE(@garantija, garantija), kaina=COALESCE(@kaina, kaina), rida=COALESCE(@rida, rida),
      kainos_ispejimas=@kainos_ispejimas, ikelta_laikas=COALESCE(@ikelta_laikas, ikelta_laikas),
      photo=COALESCE(@photo, photo), kita=COALESCE(@kita, kita),
      nuotrauku_sk=COALESCE(@nuotrauku_sk, nuotrauku_sk), teksto_ilgis=COALESCE(@teksto_ilgis, teksto_ilgis),
      paskut_matytas=@laikas, kartu_matytas=kartu_matytas+1, praleista=0, dingo=NULL
    WHERE id=@id`);
  const stebejimas = db.prepare('INSERT INTO stebejimai (skelbimo_id, laikas, kaina, rida, skenavimas) VALUES (?, ?, ?, ?, ?)');

  let nauju = 0, pasikeite = 0, irasyta = 0;
  const tx_ = db.transaction((sarasas) => {
    for (const l of sarasas) {
      const id = skelbimoId(portalas, l.url);
      if (!id) continue;
      const e = {
        id, portalas, url: l.url, marke: tx(marke), modelis: tx(l.modelis),
        metai: sv(l.metai), menuo: sv(l.menuo), kuras: kuroNorm(l.kuras), pavarai: tx(l.pavarai), kebulas: tx(l.kebulas),
        galia: sv(l.galia), variklio_turis: sk(l.variklioTuris), miestas: tx(l.miestas),
        verslas: bl(l.yraVerslas), turi_vin: bl(l.turiVin), garantija: bl(l.turiGarantija),
        kaina: sv(l.kaina), rida: sv(l.rida),
        kainos_ispejimas: l.kainosIspejimas ? JSON.stringify(l.kainosIspejimas) : null,
        ikelta_laikas: sv(l.ikeltaLaikas), photo: tx(l.photo), kita: kitiLaukai(l), laikas: dabar,
        nuotrauku_sk: sv(Array.isArray(l.photos) ? l.photos.length : (l.photo ? 1 : null)),
        teksto_ilgis: sv(l.rawText ? String(l.rawText).length : null),
      };
      const buvo = gauti.get(id);
      if (!buvo) {
        naujas.run(e); nauju++;
        stebejimas.run(id, dabar, e.kaina, e.rida, skenavimoId);
      } else {
        atnaujinti.run(e);
        if ((e.kaina && e.kaina !== buvo.kaina) || (e.rida && e.rida !== buvo.rida)) {
          pasikeite++;
          stebejimas.run(id, dabar, e.kaina, e.rida, skenavimoId);
        }
      }
      irasyta++;
    }
  });
  tx_(listings || []);
  db.prepare(`UPDATE skenavimai SET puslapiu=puslapiu+1, skelbimu=skelbimu+?, nauju=nauju+?, pasikeite=pasikeite+?
              WHERE id=?`).run(irasyta, nauju, pasikeite, skenavimoId);
  return { irasyta, nauju, pasikeite };
}

// `pilnas` - ar skenavimas pasiekė sąrašo galą. Tik tada žymimas dingimas.
function baigti(skenavimoId, { pilnas, priezastis, kreditu, busena }) {
  const s = db.prepare('SELECT * FROM skenavimai WHERE id=?').get(skenavimoId);
  if (!s) return null;
  let dingo = 0;
  if (pilnas) {
    // Aprėptis - tai, ką šis skenavimas TURĖJO matyti: tas pats portalas,
    // markė, metai nuo. Kas aprėptyje, bet nematytas šiame skenavime -
    // praleista+1; antras kartas iš eilės - dingo.
    // v2.27.1: `modelis` - ketvirtas apriepties matmuo. Modelio skenavimas mato
    // tik savo modelio skelbimus, tad ir dingusiais gali skelbti tik juos.
    const apr = `portalas=? AND dingo IS NULL AND paskut_matytas < ?
                 AND (? IS NULL OR marke=?) AND (? IS NULL OR modelis=?) AND (? IS NULL OR metai >= ?)`;
    const arg = [s.portalas, s.pradzia, s.marke, s.marke, s.modelis || null, s.modelis || null,
      s.metai_nuo, s.metai_nuo];
    db.transaction(() => {
      db.prepare(`UPDATE skelbimai SET praleista=praleista+1 WHERE ${apr}`).run(...arg);
      dingo = db.prepare(`UPDATE skelbimai SET dingo=? WHERE praleista>=2 AND ${apr}`).run(Date.now(), ...arg).changes;
    })();
  }
  db.prepare(`UPDATE skenavimai SET pabaiga=?, busena=?, pilnas=?, priezastis=?, kreditu=?, dingo=? WHERE id=?`)
    .run(Date.now(), busena || (pilnas ? 'baigta' : 'nutraukta'), pilnas ? 1 : 0, priezastis || null,
      kreditu == null ? null : kreditu, dingo, skenavimoId);
  return db.prepare('SELECT * FROM skenavimai WHERE id=?').get(skenavimoId);
}

// ── Vartotojo paieška į archyvą (v2.27.0) ───────────────────────────────────
// Iki šiol archyvą pildė TIK admino skenavimas (`/admin/rinka/skenuoti`), o
// kiekviena vartotojo paieška savo duomenis išmesdavo: puslapiai jau nuskaityti
// ir APMOKĖTI, bet į istoriją nepatekdavo. Dėl to Analitikas ir neturėjo kainų
// istorijos, nors pinigai už tuos puslapius jau išleisti.
//
// Riba, kurios nepažeidžiam: paieška NĖRA aprėptis. Ji nuskaito tik tai, ko
// prašė vartotojas, todėl `pilnas = 0` ir dingimo NEŽYMIM - kitaip kas antras
// skelbimas „dingtų" vien dėl to, kad jo nebuvo šioje paieškoje.
function irasytiPaieskos(listings, marke) {
  if (!db) return null;
  const pagal = {};
  (listings || []).forEach((l) => {
    if (!l || !l.url) return;
    const p = portaloRaktas(l.source);
    if (!p) return;
    (pagal[p] = pagal[p] || []).push(l);
  });
  const rez = { portalu: 0, irasyta: 0, nauju: 0, pasikeite: 0 };
  Object.keys(pagal).forEach((p) => {
    let id = null;
    try {
      id = pradeti({ portalas: p, marke: marke || null, metaiNuo: null, url: 'vartotojo paieska' });
      const r = irasytiPuslapi(id, p, marke || null, pagal[p]);
      rez.portalu++; rez.irasyta += r.irasyta; rez.nauju += r.nauju; rez.pasikeite += r.pasikeite;
      baigti(id, { pilnas: false, priezastis: 'vartotojo paieska', kreditu: null, busena: 'baigta' });
    } catch (e) {
      if (id) { try { baigti(id, { pilnas: false, priezastis: 'klaida: ' + e.message, busena: 'klaida' }); } catch (e2) {} }
      console.error('[RINKA] paieskos irasymas (' + p + '):', e.message);
    }
  });
  return rez;
}

// ── Nuasmenintas eksportas analizei (v2.27.0) ───────────────────────────────
// Analitikas dirba su duomenimis, ne su skelbimais, todėl jam atiduodam
// MAŽIAU, nei turim: be `url`, be `photo`, be `kita` laisvo teksto ir be
// portalo ID. Skelbimo tapatybė - stabili maiša, kad `stebejimai` būtų galima
// sujungti su `skelbimai`, bet atgal į skelbimą nebūtų kelio.
//
// Druska yra PASTOVI (ne slaptas raktas): jos tikslas - ne apsauga nuo mūsų
// pačių, o kad dviejų eksportų eilutės sutaptų ir analizė būtų kartotina.
const EKSPORTO_DRUSKA = 'cartriige-eksportas-v1';
function maisa(id) {
  return require('crypto').createHash('sha256').update(EKSPORTO_DRUSKA + '|' + String(id)).digest('hex').slice(0, 16);
}
const D = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '');

// `kita` JSON - tik trys laukai, kurių prašė Analitikas (kartos). Visa kita
// lieka pas mus: laisvas tekstas eksporte yra rizika be naudos.
function kartosLaukai(kita) {
  let j = null;
  try { j = kita ? JSON.parse(kita) : null; } catch (e) { return { kodas: '', faze: '', grupe: '' }; }
  const k = (j && Array.isArray(j.kartos) && j.kartos[0]) || null;
  return {
    kodas: k && k.kodas ? String(k.kodas) : '',
    faze: k && k.lci === true ? 'atnaujinta' : (k && k.lci === false ? 'pradine' : ''),
    grupe: (j && j.rinkosGrupe) ? String(j.rinkosGrupe) : (k && k.grupe ? String(k.grupe) : ''),
  };
}

const CSV = (v) => {
  const t = v == null ? '' : String(v);
  return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
};

// `raktas` ir kartos metai ateina IS ISORES (server.js paduoda `regitra`), kad
// archyvas neprikluausytu nuo registro modulio - ir kad sarge butu galima
// paduoti paprasta stuba.
function eksportas({ ka, riba, raktas, kartos } = {}) {
  if (!db) return '';
  const r = Math.min(Math.max(parseInt(riba, 10) || 50000, 1), 200000);
  if (ka === 'stebejimai') {
    const eil = db.prepare(`SELECT skelbimo_id, laikas, kaina, rida FROM stebejimai ORDER BY skelbimo_id, laikas LIMIT ?`).all(r);
    const antr = ['id_maisa', 'data', 'kaina', 'rida'];
    return [antr.join(',')].concat(eil.map((e) => [maisa(e.skelbimo_id), D(e.laikas), e.kaina == null ? '' : e.kaina,
      e.rida == null ? '' : e.rida].map(CSV).join(','))).join('\n') + '\n';
  }
  const eil = db.prepare(`SELECT s.*,
      (SELECT COUNT(*) FROM stebejimai t WHERE t.skelbimo_id = s.id) AS stebejimu,
      (SELECT kaina FROM stebejimai t WHERE t.skelbimo_id = s.id ORDER BY t.laikas ASC LIMIT 1) AS pirma_kaina,
      (SELECT kaina FROM stebejimai t WHERE t.skelbimo_id = s.id ORDER BY t.laikas DESC LIMIT 1) AS paskut_kaina
    FROM skelbimai s ORDER BY s.pirma_matytas LIMIT ?`).all(r);
  const antr = ['id_maisa', 'portalas', 'marke', 'modelis', 'raktas', 'kartos_kodas', 'kartos_faze',
    'kartos_nuo', 'kartos_iki', 'atn_metai', 'rinkos_grupe',
    'metai', 'menuo', 'kuras', 'deze', 'kebulas', 'galia', 'variklio_turis', 'rida', 'kaina',
    'kainos_ispejimas', 'pardavejo_tipas', 'turi_vin', 'garantija', 'miestas', 'nuotrauku_sk', 'teksto_ilgis',
    'ikelta', 'pirmas_matymas', 'paskutinis_matymas', 'dingo_data', 'kartu_matytas', 'dienu_rinkoje',
    'stebejimu', 'pirma_kaina', 'paskut_kaina'];
  const eilutes_ = eil.map((s) => {
    const k = kartosLaukai(s.kita);
    const pab = s.dingo || s.paskut_matytas;
    const dienos = (s.pirma_matytas && pab) ? Math.round((pab - s.pirma_matytas) / 86400000) : '';
    const g = (typeof kartos === 'function' ? kartos(s.marke, s.modelis, s.metai) : null) || {};
    return [maisa(s.id), s.portalas, s.marke || '', s.modelis || '',
      (typeof raktas === 'function' ? raktas(s.marke, s.modelis) : null) || '',
      k.kodas || g.kodas || '', k.faze,
      g.nuo == null ? '' : g.nuo, g.iki == null ? '' : g.iki, g.atn == null ? '' : g.atn, k.grupe,
      s.metai == null ? '' : s.metai, s.menuo == null ? '' : s.menuo, s.kuras || '', s.pavarai || '',
      s.kebulas || '', s.galia == null ? '' : s.galia, s.variklio_turis == null ? '' : s.variklio_turis,
      s.rida == null ? '' : s.rida, s.kaina == null ? '' : s.kaina,
      s.kainos_ispejimas ? 1 : 0,
      // Pardavejo TIPAS, ne pardavejas: vardo, telefono ir nuorodos archyve nera.
      s.verslas == null ? '' : (s.verslas ? 'imone' : 'privatus'),
      s.turi_vin == null ? '' : s.turi_vin, s.garantija == null ? '' : s.garantija,
      s.miestas || '', s.nuotrauku_sk == null ? '' : s.nuotrauku_sk, s.teksto_ilgis == null ? '' : s.teksto_ilgis,
      D(s.ikelta_laikas), D(s.pirma_matytas), D(s.paskut_matytas), D(s.dingo),
      s.kartu_matytas, dienos, s.stebejimu, s.pirma_kaina == null ? '' : s.pirma_kaina,
      s.paskut_kaina == null ? '' : s.paskut_kaina].map(CSV).join(',');
  });
  return [antr.join(',')].concat(eilutes_).join('\n') + '\n';
}

// ── Suvestinė ────────────────────────────────────────────────────────────────
function suvestine() {
  if (!db) return { ikelta: false };
  let dydis = 0;
  for (const f of [DB_KELIAS, DB_KELIAS + '-wal']) { try { dydis += fs.statSync(f).size; } catch (e) {} }
  const q = (s, ...a) => db.prepare(s).all(...a);
  return {
    ikelta: true,
    kelias: DB_KELIAS,
    mb: +(dydis / 1048576).toFixed(2),
    skelbimu: db.prepare('SELECT COUNT(*) c FROM skelbimai').get().c,
    stebejimu: db.prepare('SELECT COUNT(*) c FROM stebejimai').get().c,
    pagalPortala: q(`SELECT portalas, COUNT(*) viso, SUM(dingo IS NULL) gyvu, SUM(dingo IS NOT NULL) dingusiu
                     FROM skelbimai GROUP BY portalas`),
    pagalMetus: q(`SELECT metai, COUNT(*) n FROM skelbimai WHERE dingo IS NULL GROUP BY metai ORDER BY metai DESC`),
    // Vidurkis tik is realiu kainu: be vieno X5 uz 92 mlrd. EUR jis buvo 386 mln. (Nr. 43)
    populiariausi: q(`SELECT modelis, COUNT(*) n,
                        CAST(AVG(CASE WHEN kaina BETWEEN 500 AND 1500000 AND kainos_ispejimas IS NULL THEN kaina END) AS INT) vidKaina
                      FROM skelbimai WHERE dingo IS NULL GROUP BY modelis ORDER BY n DESC LIMIT 15`),
    uzpildymas: db.prepare(`SELECT COUNT(*) n, SUM(kaina IS NOT NULL) kaina, SUM(rida IS NOT NULL) rida,
                     SUM(metai IS NOT NULL) metai, SUM(kuras IS NOT NULL) kuras, SUM(pavarai IS NOT NULL) pavarai,
                     SUM(galia IS NOT NULL) galia, SUM(variklio_turis IS NOT NULL) variklio_turis,
                     SUM(kebulas IS NOT NULL) kebulas, SUM(miestas IS NOT NULL) miestas,
                     SUM(ikelta_laikas IS NOT NULL) ikelta_laikas FROM skelbimai`).get(),
    skenavimai: q('SELECT * FROM skenavimai ORDER BY id DESC LIMIT 10'),
    nesaugoma: NESAUGOMA,
  };
}

// Glaustos eilutes analizei (pvz. kaip Regitros punktai elgiasi ant tikru
// skelbimu). Tik stulpeliai, be `kita` - kad atsakymas liktu mazas.
function eilutes({ portalas, gyvi, riba } = {}) {
  const r = Math.min(Math.max(parseInt(riba, 10) || 5000, 1), 20000);
  return db.prepare(`SELECT id, portalas, marke, modelis, metai, menuo, kuras, pavarai, kebulas, galia,
      variklio_turis, kaina, rida, verslas, kainos_ispejimas IS NOT NULL AS ispejimas,
      pirma_matytas, paskut_matytas, dingo
    FROM skelbimai WHERE (? IS NULL OR portalas=?) AND (? = 0 OR dingo IS NULL)
    ORDER BY id LIMIT ?`).all(portalas || null, portalas || null, gyvi ? 1 : 0, r);
}

// v2.26.0: kainos vienam modeliui - iklijuotos nuorodos rinkos medianai
// (`nuorodos-rinka.js`). Tik GYVI skelbimai ir tik be kainos ispejimo: lizingo
// imoka ar "parduota" kaina medianoje yra ta pati bėda, kuri Nr. 43 nukreipe
// visa rinka. `portalas` grazinamas, nes mediana skaiciuojama PAGAL RINKA.
function kainosModeliui({ marke, modelis, metaiNuo, metaiIki, riba } = {}) {
  if (!db || !marke) return [];
  const r = Math.min(Math.max(parseInt(riba, 10) || 400, 1), 2000);
  const n = (x) => String(x || '').trim().toLowerCase();
  return db.prepare(`SELECT portalas, kaina, metai, rida FROM skelbimai
    WHERE dingo IS NULL AND kaina IS NOT NULL AND kainos_ispejimas IS NULL
      AND LOWER(TRIM(marke)) = ?
      AND (? IS NULL OR LOWER(TRIM(modelis)) = ?)
      AND (? IS NULL OR metai >= ?) AND (? IS NULL OR metai <= ?)
    ORDER BY paskut_matytas DESC LIMIT ?`)
    .all(n(marke), modelis ? n(modelis) : null, modelis ? n(modelis) : null,
      metaiNuo || null, metaiNuo || null, metaiIki || null, metaiIki || null, r);
}

module.exports = {
  kuroNorm, taisytiSenusIrasus,
  ikelti, skelbimoId, pradeti, vykstantis, irasytiPuslapi, baigti, suvestine, eilutes,
  kainosModeliui, irasytiPaieskos, eksportas, kartosLaukai, NESAUGOMA,
  _db: () => db,
};
