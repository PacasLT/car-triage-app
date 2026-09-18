// cache.js
// Atmintines talpykla. Duomenys ikelti VIENKARTI i atmintine paleidus serveri -
// nereikia skaityti failo kiekvienam getCached/setCached kvietimui (greiciau).
// Failas naudojamas tik islikimui tarp serverio perkrovimu.

const fs = require('fs');
const path = require('path');

// Kaupyklos turi guleti ant persistentinio disko, kitaip kiekvienas deploy'us
// istrina visa sukaupta rinkos archyva ir kaupimas netenka prasmes.
// Ta pati logika kaip auth.js: DATA_DIR env -> primountintas /data -> konteineris.
function parinktiDuomenuKatalogą() {
  if (process.env.DATA_DIR) return { kelias: process.env.DATA_DIR, saltinis: 'DATA_DIR env' };
  try {
    fs.accessSync('/data', fs.constants.W_OK);
    return { kelias: '/data', saltinis: 'aptiktas /data Volume' };
  } catch (e) {}
  return { kelias: __dirname, saltinis: 'konteinerio vidus – NEPERSISTENTINIS' };
}
const _dk = parinktiDuomenuKatalogą();
const DATA_DIR = _dk.kelias;
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}

const CACHE_FILE = path.join(DATA_DIR, 'cache.json');

const PAGE_TTL_MS = 120 * 60 * 1000;       // 2 val - puslapiu nuskaitymas
const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 val - detali analize
const SEARCH_TTL_MS = 20 * 60 * 1000;       // 20 min - tos pacios filtru paieskos talpykla

// --- PAGRINDINĖ ATMINTINĖ (ikeliam VIENKARTI paleidus) ---
// PATAISYTA (Railway OOM): 'pages' erdveje buvo saugomas PILNAS skelbimu HTML
// (po 0,3-1 MB), jis niekada nebuvo trinamas ir kartu su visu podeliu rasomas
// i cache.json. Failas augo iki simtu MB, o paleidziant jis visas parsinamas
// i atminti (JSON.parse) ir paskui vel stringifinamas - to uztenka, kad
// konteineris nukristu is atminties. Dabar HTML gyvena TIK atmintyje, su
// griezta riba, ir i diska nepatenka niekada.
const PAGES_MAX = parseInt(process.env.PAGES_MAX || '120', 10);
// Riba baitais svarbesne uz iraso skaiciu: 120 puslapiu po 1 MB butu 120 MB,
// o Railway konteineris turi vos kelis simtus.
const PAGES_MAX_BYTES = parseInt(process.env.PAGES_MAX_MB || '40', 10) * 1024 * 1024;
const _pages = new Map(); // url -> { time, data }
let _pagesBytes = 0;
let _reikiaPerrasyti = false;

let _cache = (() => {
  try {
    const is = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    if (is && is.pages) {
      const kiek = Object.keys(is.pages).length;
      if (kiek) {
        console.log(`[KAUPYKLOS] issaugoti ${kiek} HTML puslapiai ismetami is failo (nebesaugomi diske)`);
        _reikiaPerrasyti = true;
      }
      delete is.pages;
    }
    return is || { analysis: {} };
  } catch { return { analysis: {} }; }
})();

// PATAISYTA: anksciau kiekvienas setCached() sinchroniskai perrasydavo VISA
// podeli su formatavimu. Per viena paieska tai ~86 rasymai po keliasdesimt MB -
// serveris tuo metu neatsakydavo i jokias kitas uzklausas (progreso juosta
// atrodydavo uzsalusi). Dabar: TTL valymas, be formatavimo, ne dazniau kaip
// karta per 3 s, ir butinai isaugom procesui uzsidarant.
let _cacheDirty = false;
let _cacheTimer = null;

function valytiPasenusius() {
  const dabar = Date.now();
  const ribos = { analysis: ANALYSIS_TTL_MS, shortComment: ANALYSIS_TTL_MS };
  for (const ns of Object.keys(_cache)) {
    const ttl = ribos[ns];
    if (!ttl || !_cache[ns]) continue;
    for (const k of Object.keys(_cache[ns])) {
      const e = _cache[ns][k];
      if (!e || !e.time || (dabar - e.time) > ttl) delete _cache[ns][k];
    }
  }
}

function saveCacheNow() {
  _cacheDirty = false;
  if (_cacheTimer) { clearTimeout(_cacheTimer); _cacheTimer = null; }
  try {
    valytiPasenusius();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(_cache));
  } catch (err) { console.error('Nepavyko issaugoti talpyklos:', err.message); }
}

function saveCache() {
  _cacheDirty = true;
  if (_cacheTimer) return;
  _cacheTimer = setTimeout(() => { _cacheTimer = null; if (_cacheDirty) saveCacheNow(); }, 3000);
}

process.on('beforeExit', () => { if (_cacheDirty) saveCacheNow(); if (typeof saveLifecycle === 'function') saveLifecycle(); });
process.on('SIGTERM', () => { if (_cacheDirty) saveCacheNow(); if (typeof saveLifecycle === 'function') saveLifecycle(); process.exit(0); });

valytiPasenusius();
// Jei is failo ismetem HTML puslapius, perrasom ji NEDELSIANT - kitaip senas
// keliasdesimties MB failas liktu diske ir vel butu parsinamas kito paleidimo metu.
if (_reikiaPerrasyti) {
  try {
    const priesTai = fs.existsSync(CACHE_FILE) ? fs.statSync(CACHE_FILE).size : 0;
    saveCacheNow();
    const poTo = fs.statSync(CACHE_FILE).size;
    console.log(`[KAUPYKLOS] cache.json: ${(priesTai / 1048576).toFixed(1)} MB -> ${(poTo / 1048576).toFixed(2)} MB`);
  } catch (e) { console.error('[KAUPYKLOS] nepavyko perrasyti:', e.message); }
}

function getCached(namespace, key, ttlMs) {
  if (namespace === 'pages') {
    const e = _pages.get(key);
    if (!e) return null;
    if (Date.now() - e.time > ttlMs) { _pagesBytes -= e.bytes; _pages.delete(key); return null; }
    _pages.delete(key); _pages.set(key, e); // LRU: perkeliam i gala
    return e.data;
  }
  const entry = _cache[namespace] && _cache[namespace][key];
  if (!entry) return null;
  if (Date.now() - entry.time > ttlMs) return null;
  return entry.data;
}

function setCached(namespace, key, data) {
  if (namespace === 'pages') {
    const senas = _pages.get(key);
    if (senas) { _pagesBytes -= senas.bytes; _pages.delete(key); }
    const bytes = typeof data === 'string' ? data.length : 0;
    _pages.set(key, { time: Date.now(), data, bytes });
    _pagesBytes += bytes;
    while (_pages.size > PAGES_MAX || _pagesBytes > PAGES_MAX_BYTES) {
      const seniausias = _pages.keys().next().value;
      if (seniausias === undefined) break;
      const e = _pages.get(seniausias);
      _pagesBytes -= (e && e.bytes) || 0;
      _pages.delete(seniausias);
      if (_pages.size === 0) { _pagesBytes = 0; break; }
    }
    return; // i diska nerasom
  }
  if (!_cache[namespace]) _cache[namespace] = {};
  _cache[namespace][key] = { time: Date.now(), data };
  saveCache();
}

function cacheAgeMinutes(namespace, key) {
  const entry = (namespace === 'pages') ? _pages.get(key) : (_cache[namespace] && _cache[namespace][key]);
  if (!entry) return null;
  return Math.round((Date.now() - entry.time) / 60000);
}

// --- PAIESKOS REZULTATU ATMINTINĖ (tik atmintyje, 20 min TTL) ---
// Ta pati paieska (tie patys filtrai) grazinama is talpyklos be jokio skenuojimo.
const _searchCache = new Map(); // filterHash -> { time, data }

function getSearchCached(filterHash) {
  const entry = _searchCache.get(filterHash);
  if (!entry) return null;
  if (Date.now() - entry.time > SEARCH_TTL_MS) { _searchCache.delete(filterHash); return null; }
  return entry.data;
}

function setSearchCached(filterHash, data) {
  _searchCache.set(filterHash, { time: Date.now(), data });
}

// ============ ISTORINIS RINKOS DUOMENU KAUPIMAS ============
const HISTORY_FILE = path.join(DATA_DIR, 'market-history.json');
const MAX_HISTORY_PER_MODEL = 1000;

let _history = (() => {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')); }
  catch { return {}; }
})();

function saveHistory() {
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(_history)); }
  catch (err) { console.error('Nepavyko issaugoti istorijos:', err.message); }
}

function addToHistory(listings) {
  for (const l of listings) {
    if (!l.kaina || !l.modelis) continue;
    if (!_history[l.modelis]) _history[l.modelis] = [];
    const arr = _history[l.modelis];
    const existingIdx = arr.findIndex((e) => e.url === l.url);
    const entry = { url: l.url, kaina: l.kaina, rida: l.rida, metai: l.metai, kuras: l.kuras || null, galia: l.galia || null, pavarai: l.pavarai || null, variklioTuris: l.variklioTuris || null, time: Date.now() };
    if (existingIdx >= 0) arr[existingIdx] = entry;
    else arr.push(entry);
    if (arr.length > MAX_HISTORY_PER_MODEL) arr.splice(0, arr.length - MAX_HISTORY_PER_MODEL);
  }
  saveHistory();
}

function getHistoryForModel(modelis) {
  return _history[modelis] || [];
}

// ============ SKELBIMŲ KAINOS/RIDOS ISTORIJA (per URL) ============
const LISTING_TIMELINE_FILE = path.join(DATA_DIR, 'listing-timeline.json');

let _listingTimeline = (() => {
  try { return JSON.parse(fs.readFileSync(LISTING_TIMELINE_FILE, 'utf-8')); }
  catch { return {}; }
})();

// v1.46.0: dirty veliava, kaip saveLifecycle.
// Buvo: recordListingSnapshot() kvietesi si sinchroniska VISO failo perrasyma
// kiekvienam skelbimui, o server.js ji kviecia cikle - 60-100 pilnu irasymu per
// viena paieska. Kol jie vyksta, Node nedaro nieko kito: serveris neatsako.
// Tai TA PATI klaida, kuri jau buvo rasta ir istaisyta setCached (zr. komentara
// ties _cacheDirty). Cia ji buvo likusi.
let _timelineDirty = false;

function saveListingTimeline(iskart) {
  if (!iskart) { _timelineDirty = true; return; }
  if (!_timelineDirty) return;
  try {
    fs.writeFileSync(LISTING_TIMELINE_FILE, JSON.stringify(_listingTimeline));
    _timelineDirty = false;
  } catch (err) { console.error('Nepavyko išsaugoti timeline:', err.message); }
}

function recordListingSnapshot(url, kaina, rida) {
  if (!url || !kaina) return;
  if (!_listingTimeline[url]) _listingTimeline[url] = [];
  const arr = _listingTimeline[url];
  const now = Date.now();
  const recent = arr[arr.length - 1];
  if (recent && recent.kaina === kaina && (now - recent.t) < 30 * 60 * 1000) return;
  arr.push({ t: now, k: kaina, r: rida || null });
  if (arr.length > 60) arr.splice(0, arr.length - 60);
  saveListingTimeline();
}

function getListingTimeline(url) {
  if (!url) return [];
  return _listingTimeline[url] || [];
}

function buildListingTimelineText(url) {
  const tl = getListingTimeline(url);
  if (tl.length < 2) return null;
  const fmt = (t) => {
    const d = Math.round((Date.now() - t) / 86400000);
    return d === 0 ? 'šiandien' : d === 1 ? 'vakar' : `prieš ${d}d`;
  };
  const first = tl[0];
  const last = tl[tl.length - 1];
  const prev = tl.length > 1 ? tl[tl.length - 2] : null;
  let lines = [];
  lines.push(`Pirmas stebėjimas (${fmt(first.t)}): kaina ${first.k}€${first.r ? ', rida ' + first.r + ' km' : ''}`);
  if (prev && prev !== first) {
    lines.push(`Ankstesnis stebėjimas (${fmt(prev.t)}): kaina ${prev.k}€${prev.r ? ', rida ' + prev.r + ' km' : ''}`);
  }
  lines.push(`Paskutinis stebėjimas (${fmt(last.t)}): kaina ${last.k}€${last.r ? ', rida ' + last.r + ' km' : ''}`);
  const priceDiff = last.k - first.k;
  if (priceDiff < 0) lines.push(`KAINA MAŽINTA: ${priceDiff}€ (nuo ${first.k}€ iki ${last.k}€) - gali rodyti, kad niekas nepirkė, yra problema arba yra vietos deryboms`);
  if (priceDiff > 0) lines.push(`KAINA DIDINTA: +${priceDiff}€ - neįprasta, gali rodyti klaidą arba pakeitė skelbimą`);
  if (last.r && first.r && last.r - first.r > 500) lines.push(`RIDA PADIDĖJO: ${last.r - first.r} km (nuo ${first.r} iki ${last.r}) - skelbimas senas, auto vis dar naudojamas`);
  return lines.join('\n');
}

// ============ SKELBIMO GYVAVIMO CIKLAS ============
// Kada skelbimas pirma karta pastebetas, kada matytas paskutini karta ir kada dingo.
// Is to gaunam: kiek dienu kabo, per kiek laiko modelis parduodamas, ar jau parduotas.
const LIFECYCLE_FILE = path.join(DATA_DIR, 'listing-lifecycle.json');

let _lifecycle = (() => {
  try { return JSON.parse(fs.readFileSync(LIFECYCLE_FILE, 'utf-8')); }
  catch { return {}; }
})();
let _lifecycleDirty = false;

function saveLifecycle() {
  // v1.46.0: timeline irasomas kartu - server.js kviecia saveLifecycle() po
  // kiekvieno ciklo, tad atskiro kvietimo prideti nereikia ir pamirsti negalima.
  saveListingTimeline(true);
  if (!_lifecycleDirty) return;
  try { fs.writeFileSync(LIFECYCLE_FILE, JSON.stringify(_lifecycle)); _lifecycleDirty = false; }
  catch (err) { console.error('Nepavyko issaugoti gyvavimo ciklo:', err.message); }
}

// ---- AUTOMOBILIO TAPATYBE ----
// Kas NESIKEICIA, kai tas pats automobilis parduodamas is naujo: modelis, metai,
// variklis, kuras, deze. Kaina, rida ir pardavejas keiciasi - todel i rakta neieina.
// VIN, kai ji turim, yra absoliutus raktas.
function tapatybesRaktas(l, vin) {
  if (vin) return 'vin:' + String(vin).toUpperCase();
  if (!l || !l.modelis || !l.metai) return null;
  return 'fp:' + [
    String(l.modelis).toLowerCase().trim(),
    l.metai,
    l.kuras || '?',
    l.pavarai || '?',
    l.galia || '?',
    l.variklioTuris || '?',
  ].join('|');
}

// Pazymim, kad skelbimas MATYTAS. Kvieciama kiekvienos paieskos metu.
function zymetiMatyta(l, papildoma) {
  if (!l || !l.url) return;
  const now = Date.now();
  const vin = (papildoma && papildoma.vin) || (l.vin || null);
  const pardavejas = (papildoma && papildoma.pardavejas) || l.pardavejas || null;
  const raktas = tapatybesRaktas(l, vin);
  const e = _lifecycle[l.url];
  if (!e) {
    _lifecycle[l.url] = {
      pirmaMatytas: now, paskutinMatytas: now, kartuMatytas: 1,
      modelis: l.modelis || null, metai: l.metai || null,
      pirmaKaina: l.kaina || null, dabartineKaina: l.kaina || null,
      pirmaRida: l.rida || null, dabartineRida: l.rida || null,
      saltinis: l.source || null, dingo: null,
      vin: vin || null, pardavejas: pardavejas || null, raktas: raktas || null,
    };
  } else {
    e.paskutinMatytas = now;
    e.kartuMatytas = (e.kartuMatytas || 0) + 1;
    if (e.dingo) e.dingo = null; // vel atsirado - matyt buvo laikinai nuimtas
    e.praleista = 0;               // v1.23.0: skelbimas vel matomas - skaitliukas is naujo
    if (!e.modelis && l.modelis) e.modelis = l.modelis;
    if (!e.pirmaKaina && l.kaina) e.pirmaKaina = l.kaina;
    if (!e.pirmaRida && l.rida) e.pirmaRida = l.rida;
    if (l.kaina) e.dabartineKaina = l.kaina;
    if (l.rida) e.dabartineRida = l.rida;
    if (vin && !e.vin) e.vin = vin;
    if (pardavejas && !e.pardavejas) e.pardavejas = pardavejas;
    // VIN gali atsirasti veliau (pvz. nuskaicius is nuotraukos) - tada raktas tikslinamas
    if (raktas && e.raktas !== raktas) e.raktas = raktas;
  }
  _lifecycleDirty = true;
}

// Randa KITUS skelbimus, kurie greiciausiai yra tas pats automobilis.
// Grazina tik tuos, kurie turi ta pati tapatybes rakta ir kita URL.
function rastiTaPatiAuto(url) {
  const sis = _lifecycle[url];
  if (!sis || !sis.raktas) return [];
  const kiti = [];
  Object.keys(_lifecycle).forEach((u) => {
    if (u === url) return;
    const e = _lifecycle[u];
    if (!e || e.raktas !== sis.raktas) return;
    kiti.push({
      url: u,
      modelis: e.modelis, pardavejas: e.pardavejas || null, saltinis: e.saltinis || null,
      pirmaKaina: e.pirmaKaina, dabartineKaina: e.dabartineKaina,
      pirmaRida: e.pirmaRida, dabartineRida: e.dabartineRida,
      pirmaMatytas: e.pirmaMatytas, paskutinMatytas: e.paskutinMatytas, dingo: e.dingo,
      patikimas: sis.raktas.startsWith('vin:'), // VIN sutapimas = garantija
    });
  });
  return kiti.sort((a, b) => a.pirmaMatytas - b.pirmaMatytas);
}

// v1.23.0: ar musu sistema jau mate si VIN? Jei tas pats VIN buvo kitame skelbime,
// tai vertinga informacija pirkejui (pvz. automobilis grazintas i rinka, keitesi pardavejas).
function rastiPagalVin(vin) {
  const v = String(vin || '').toUpperCase();
  if (v.length !== 17) return [];
  return Object.entries(_lifecycle)
    .filter(([, e]) => e && e.vin && String(e.vin).toUpperCase() === v)
    .map(([url, e]) => ({
      url,
      modelis: e.modelis || null,
      pardavejas: e.pardavejas || null,
      pirmaMatytas: e.pirmaMatytas || null,
      paskutinMatytas: e.paskutinMatytas || null,
      pirmaKaina: e.pirmaKaina || null,
      dabartineKaina: e.dabartineKaina || null,
      dingo: e.dingo || null,
    }))
    .sort((a, b) => (a.pirmaMatytas || 0) - (b.pirmaMatytas || 0));
}

// v1.23.0 vienkartinis valymas: senoji logika zymejo "dingo" jau po pirmo praleidimo,
// todel dalis dar gyvu skelbimu pazymeti klaidingai. Isvalom tuos, kurie neturi
// praleidimu skaitliuko - jei skelbimas is tikruju dingo, tai paaiskes per kita tikrinima.
function valytiSenusDingo() {
  let isvalyta = 0;
  Object.values(_lifecycle).forEach((e) => {
    if (e && e.dingo && e.praleista == null) { e.dingo = null; isvalyta++; }
  });
  if (isvalyta) { _lifecycleDirty = true; saveLifecycle(); }
  return isvalyta;
}

// v1.23.0: skelbimas nerastas siuo kartu. Grazina, kiek kartu is eiles jo nebuvo.
// "Dingo" zymim tik po antro praleidimo - vienas praleidimas daznai reiskia tik tai,
// kad skelbimas nepateko i sios paieskos imti.
function zymetiNerasta(url) {
  const e = _lifecycle[url];
  if (!e) return 0;
  e.praleista = (e.praleista || 0) + 1;
  _lifecycleDirty = true;
  return e.praleista;
}

// Pazymim, kad skelbimo nebera (404 arba dingo is rezultatu) - tikriausiai parduotas.
function zymetiDingusi(url) {
  const e = _lifecycle[url];
  if (!e || e.dingo) return null;
  e.dingo = Date.now();
  _lifecycleDirty = true;
  const dienos = Math.round((e.dingo - e.pirmaMatytas) / 86400000);
  return { url, dienosRinkoje: dienos, modelis: e.modelis };
}

function gautiGyvavimoCikla(url) {
  const e = _lifecycle[url];
  if (!e) return null;
  const now = Date.now();
  return {
    pirmaMatytas: e.pirmaMatytas,
    paskutinMatytas: e.paskutinMatytas,
    dienosRinkoje: Math.round(((e.dingo || now) - e.pirmaMatytas) / 86400000),
    dienosNuoPaskutinio: Math.round((now - e.paskutinMatytas) / 86400000),
    kartuMatytas: e.kartuMatytas || 1,
    dingo: e.dingo || null,
    pirmaKaina: e.pirmaKaina || null,
    dabartineKaina: e.dabartineKaina || null,
    pirmaRida: e.pirmaRida || null,
    dabartineRida: e.dabartineRida || null,
    pardavejas: e.pardavejas || null,
    vin: e.vin || null,
    raktas: e.raktas || null,
  };
}

// Vidutinis modelio pardavimo greitis - is skelbimu, kurie jau dingo.
function modelioPardavimoGreitis(modelis) {
  const parduoti = Object.values(_lifecycle).filter((e) => e.modelis === modelis && e.dingo);
  if (parduoti.length < 3) return null;
  const dienos = parduoti.map((e) => Math.round((e.dingo - e.pirmaMatytas) / 86400000)).sort((a, b) => a - b);
  return {
    imtis: dienos.length,
    medianaDienu: dienos[Math.floor(dienos.length / 2)],
    greiciausias: dienos[0],
    leciausias: dienos[dienos.length - 1],
  };
}

// ============ SEZONISKUMAS IR KAINU TENDENCIJA ============
// Skaiciuojama is sukauptos rinkos istorijos: kainu mediana pagal menesi
// ir kryptis (brangsta / pinga) lyginant seniausius ir naujausius irasus.
function modelioTendencijos(modelis) {
  const irasai = (_history[modelis] || []).filter((e) => e.kaina && e.time);
  if (irasai.length < 8) return null;

  const pagalMenesi = {};
  irasai.forEach((e) => {
    const d = new Date(e.time);
    const raktas = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    (pagalMenesi[raktas] = pagalMenesi[raktas] || []).push(e.kaina);
  });
  const menesiai = Object.keys(pagalMenesi).sort().map((m) => {
    const arr = pagalMenesi[m].slice().sort((a, b) => a - b);
    return { menuo: m, mediana: arr[Math.floor(arr.length / 2)], imtis: arr.length };
  }).filter((m) => m.imtis >= 3);

  let kryptis = null;
  if (menesiai.length >= 2) {
    const pirmas = menesiai[0], paskutinis = menesiai[menesiai.length - 1];
    const pokytis = Math.round(((paskutinis.mediana - pirmas.mediana) / pirmas.mediana) * 100);
    kryptis = {
      procentai: pokytis,
      nuo: pirmas.menuo, iki: paskutinis.menuo,
      nuoKainos: pirmas.mediana, ikiKainos: paskutinis.mediana,
      kryptis: pokytis > 2 ? 'brangsta' : pokytis < -2 ? 'pinga' : 'stabili',
    };
  }
  return { menesiai, kryptis, visoIrasu: irasai.length };
}

// ============ SEKAMI SKELBIMAI ============
// Isaugoti skelbimai lieka narsykleje, bet frontend praneša serveriui, kuriuos URL
// verta sekti. Serveris juos kartą per parą pertikrina ir kaupia istorija.
const WATCH_FILE = path.join(DATA_DIR, 'watchlist.json');

let _watch = (() => {
  try { return JSON.parse(fs.readFileSync(WATCH_FILE, 'utf-8')); }
  catch { return {}; }
})();

function saveWatch() {
  try { fs.writeFileSync(WATCH_FILE, JSON.stringify(_watch)); }
  catch (err) { console.error('Nepavyko issaugoti sekimo saraso:', err.message); }
}

function pridetiSekimui(urls, meta) {
  let nauji = 0;
  (urls || []).forEach((u) => {
    if (!u) return;
    if (!_watch[u]) { _watch[u] = { pridetas: Date.now(), tikrinta: null, meta: meta && meta[u] ? meta[u] : null }; nauji++; }
    else _watch[u].paskutinisPrasymas = Date.now();
  });
  if (nauji) saveWatch();
  return nauji;
}

function sekamiUrlai() { return Object.keys(_watch); }

function zymetiPatikrinta(url) {
  if (_watch[url]) { _watch[url].tikrinta = Date.now(); saveWatch(); }
}

// Sekimo saraso valymas: jei skelbimo niekas neprase 30 dienu - metam lauk.
function valytiSekimoSarasa() {
  const riba = Date.now() - 30 * 86400000;
  let pasalinta = 0;
  Object.keys(_watch).forEach((u) => {
    const w = _watch[u];
    const paskutinis = w.paskutinisPrasymas || w.pridetas;
    if (paskutinis < riba) { delete _watch[u]; pasalinta++; }
  });
  if (pasalinta) saveWatch();
  return pasalinta;
}

console.log('[KAUPYKLOS] katalogas:', DATA_DIR, '(' + _dk.saltinis + ')');
console.log('[KAUPYKLOS] rinkos istorija:', Object.keys(_history).length, 'modeliu ·',
  'gyvavimo ciklas:', Object.keys(_lifecycle).length, 'skelbimu ·',
  'sekama:', Object.keys(_watch).length);

// ============ SENU IRASU VALYMAS ============
// v1.46.0. Iki siol _lifecycle ir _listingTimeline nieko NETRINDAVO: kiekvienas
// kada nors matytas skelbimas likdavo amzinai, o abu failai pilnai ikeliami i
// atminti paleidziant ir pilnai perrasomi kiekvieno issaugojimo metu.
//
// Tai ta pati spraga, kuri jau nuverte konteineri per cache.json 'pages' erdve.
// Skirtumas tik tas, kad cia augimas letesnis, tad problema pasirodo ne is karto.
//
// Ka trinam: TIK tai, kas ir dingo, ir sena. Gyvas skelbimas neliecziamas,
// nesvarbu kiek jam metu - jo kainos istorija yra produktas.
const VALYMO_RIBA_MS = parseInt(process.env.VALYMO_DIENOS || '180', 10) * 86400000;

function valytiSenusIrasus() {
  const riba = Date.now() - VALYMO_RIBA_MS;
  let istrintaCiklu = 0, istrintaLiniju = 0;

  for (const url of Object.keys(_lifecycle)) {
    const e = _lifecycle[url];
    if (!e) { delete _lifecycle[url]; istrintaCiklu++; continue; }
    // Butinos abi salygos: pazymetas dinges IR seniai nematytas.
    const dinges = !!e.dingo;
    const seniai = (e.paskutinMatytas || e.pirmaMatytas || 0) < riba;
    if (dinges && seniai) { delete _lifecycle[url]; istrintaCiklu++; }
  }

  // Timeline be gyvavimo ciklo yra nasta be prasmes - jo niekas nebeperskaitys.
  for (const url of Object.keys(_listingTimeline)) {
    if (!_lifecycle[url]) { delete _listingTimeline[url]; istrintaLiniju++; }
  }

  if (istrintaCiklu) _lifecycleDirty = true;
  if (istrintaLiniju) _timelineDirty = true;
  if (istrintaCiklu || istrintaLiniju) saveLifecycle();

  return { ciklai: istrintaCiklu, linijos: istrintaLiniju,
           likoCiklu: Object.keys(_lifecycle).length,
           likoLiniju: Object.keys(_listingTimeline).length };
}

// Paleidziant ir kas para. Be intervalo failas augtu tol, kol serveris neperkraunamas.
(function pirmasValymas() {
  try {
    const r = valytiSenusIrasus();
    console.log(`[VALYMAS] gyvavimo ciklas: -${r.ciklai} (liko ${r.likoCiklu}), timeline: -${r.linijos} (liko ${r.likoLiniju})`);
  } catch (e) { console.error('[VALYMAS] nepavyko:', e.message); }
})();
const _valymoTaimeris = setInterval(() => {
  try {
    const r = valytiSenusIrasus();
    if (r.ciklai || r.linijos) console.log(`[VALYMAS] gyvavimo ciklas: -${r.ciklai}, timeline: -${r.linijos}`);
  } catch (e) { console.error('[VALYMAS] nepavyko:', e.message); }
}, 24 * 60 * 60 * 1000);
if (_valymoTaimeris.unref) _valymoTaimeris.unref();

module.exports = {
  puslapiuPodelis: () => ({ irasu: _pages.size, mb: +(_pagesBytes / 1048576).toFixed(1) }),
  getCached, setCached, cacheAgeMinutes, PAGE_TTL_MS, ANALYSIS_TTL_MS,
  zymetiNerasta, valytiSenusDingo, rastiPagalVin,
  getSearchCached, setSearchCached,
  addToHistory, getHistoryForModel,
  recordListingSnapshot, getListingTimeline, buildListingTimelineText,
  zymetiMatyta, zymetiDingusi, gautiGyvavimoCikla, modelioPardavimoGreitis, saveLifecycle,
  tapatybesRaktas, rastiTaPatiAuto,
  modelioTendencijos,
  pridetiSekimui, sekamiUrlai, zymetiPatikrinta, valytiSekimoSarasa,
  valytiSenusIrasus,
  DATA_DIR,
};
