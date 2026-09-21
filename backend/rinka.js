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
      dingo           INTEGER
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
  // Skenavimas, kurį nutraukė perkrovimas, liktų „vyksta" amžinai.
  const pakibe = db.prepare(`UPDATE skenavimai SET busena='nutraukta', priezastis='serveris perkrautas', pabaiga=?
                             WHERE busena='vyksta'`).run(Date.now()).changes;
  const n = db.prepare('SELECT COUNT(*) c FROM skelbimai').get().c;
  console.log('[RINKA] ' + DB_KELIAS + ' · skelbimu: ' + n + (pakibe ? ' · nutrauktu skenavimu: ' + pakibe : ''));
  return { kelias: DB_KELIAS, skelbimu: n };
}

// ── Tapatybė ─────────────────────────────────────────────────────────────────
function skelbimoId(portalas, url) {
  const m = String(url || '').match(/-(\d{5,})\.html(?:[?#].*)?$/);
  if (m) return portalas + ':' + m[1].replace(/^0+/, '');
  return url ? portalas + ':' + String(url) : null;
}

const sk = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
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
function pradeti({ portalas, marke, metaiNuo, url }) {
  const r = db.prepare(`INSERT INTO skenavimai (portalas, marke, metai_nuo, url, pradzia, busena)
                        VALUES (?, ?, ?, ?, ?, 'vyksta')`).run(portalas, marke || null, metaiNuo || null, url || null, Date.now());
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
     pirma_matytas, paskut_matytas)
    VALUES (@id, @portalas, @url, @marke, @modelis, @metai, @menuo, @kuras, @pavarai, @kebulas, @galia, @variklio_turis, @miestas,
     @verslas, @turi_vin, @garantija, @kaina, @rida, @kainos_ispejimas, @ikelta_laikas, @photo, @kita,
     @laikas, @laikas)`);
  const atnaujinti = db.prepare(`UPDATE skelbimai SET
      url=@url, modelis=COALESCE(@modelis, modelis), metai=COALESCE(@metai, metai), menuo=COALESCE(@menuo, menuo),
      kuras=COALESCE(@kuras, kuras), pavarai=COALESCE(@pavarai, pavarai), kebulas=COALESCE(@kebulas, kebulas),
      galia=COALESCE(@galia, galia), variklio_turis=COALESCE(@variklio_turis, variklio_turis),
      miestas=COALESCE(@miestas, miestas), verslas=COALESCE(@verslas, verslas), turi_vin=COALESCE(@turi_vin, turi_vin),
      garantija=COALESCE(@garantija, garantija), kaina=COALESCE(@kaina, kaina), rida=COALESCE(@rida, rida),
      kainos_ispejimas=@kainos_ispejimas, ikelta_laikas=COALESCE(@ikelta_laikas, ikelta_laikas),
      photo=COALESCE(@photo, photo), kita=COALESCE(@kita, kita),
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
        metai: sv(l.metai), menuo: sv(l.menuo), kuras: tx(l.kuras), pavarai: tx(l.pavarai), kebulas: tx(l.kebulas),
        galia: sv(l.galia), variklio_turis: sk(l.variklioTuris), miestas: tx(l.miestas),
        verslas: bl(l.yraVerslas), turi_vin: bl(l.turiVin), garantija: bl(l.turiGarantija),
        kaina: sv(l.kaina), rida: sv(l.rida),
        kainos_ispejimas: l.kainosIspejimas ? JSON.stringify(l.kainosIspejimas) : null,
        ikelta_laikas: sv(l.ikeltaLaikas), photo: tx(l.photo), kita: kitiLaukai(l), laikas: dabar,
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
    const apr = `portalas=? AND dingo IS NULL AND paskut_matytas < ?
                 AND (? IS NULL OR marke=?) AND (? IS NULL OR metai >= ?)`;
    const arg = [s.portalas, s.pradzia, s.marke, s.marke, s.metai_nuo, s.metai_nuo];
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
    populiariausi: q(`SELECT modelis, COUNT(*) n, CAST(AVG(kaina) AS INT) vidKaina FROM skelbimai
                      WHERE dingo IS NULL GROUP BY modelis ORDER BY n DESC LIMIT 15`),
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

module.exports = {
  ikelti, skelbimoId, pradeti, vykstantis, irasytiPuslapi, baigti, suvestine, eilutes, NESAUGOMA,
  _db: () => db,
};
