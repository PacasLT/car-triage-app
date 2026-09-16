// cache.js
// Atmintines talpykla. Duomenys ikelti VIENKARTI i atmintine paleidus serveri -
// nereikia skaityti failo kiekvienam getCached/setCached kvietimui (greiciau).
// Failas naudojamas tik islikimui tarp serverio perkrovimu.

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'cache.json');

const PAGE_TTL_MS = 120 * 60 * 1000;       // 2 val - puslapiu nuskaitymas
const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 val - detali analize
const SEARCH_TTL_MS = 20 * 60 * 1000;       // 20 min - tos pacios filtru paieskos talpykla

// --- PAGRINDINĖ ATMINTINĖ (ikeliam VIENKARTI paleidus) ---
let _cache = (() => {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); }
  catch { return { pages: {}, analysis: {} }; }
})();

function saveCache() {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(_cache, null, 2)); }
  catch (err) { console.error('Nepavyko issaugoti talpyklos:', err.message); }
}

function getCached(namespace, key, ttlMs) {
  const entry = _cache[namespace] && _cache[namespace][key];
  if (!entry) return null;
  if (Date.now() - entry.time > ttlMs) return null;
  return entry.data;
}

function setCached(namespace, key, data) {
  if (!_cache[namespace]) _cache[namespace] = {};
  _cache[namespace][key] = { time: Date.now(), data };
  saveCache();
}

function cacheAgeMinutes(namespace, key) {
  const entry = _cache[namespace] && _cache[namespace][key];
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
const HISTORY_FILE = path.join(__dirname, 'market-history.json');
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
const LISTING_TIMELINE_FILE = path.join(__dirname, 'listing-timeline.json');

let _listingTimeline = (() => {
  try { return JSON.parse(fs.readFileSync(LISTING_TIMELINE_FILE, 'utf-8')); }
  catch { return {}; }
})();

function saveListingTimeline() {
  try { fs.writeFileSync(LISTING_TIMELINE_FILE, JSON.stringify(_listingTimeline)); }
  catch (err) { console.error('Nepavyko išsaugoti timeline:', err.message); }
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

module.exports = {
  getCached, setCached, cacheAgeMinutes, PAGE_TTL_MS, ANALYSIS_TTL_MS,
  getSearchCached, setSearchCached,
  addToHistory, getHistoryForModel,
  recordListingSnapshot, getListingTimeline, buildListingTimelineText,
};
