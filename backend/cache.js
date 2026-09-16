// cache.js
// Paprasta failine talpykla. Issaugo duomenis i JSON faila, kad:
// 1) nereiketu kaskart is naujo scrapinti tu paciu paieskos puslapiu (trumpas TTL)
// 2) detalios skelbimo analizes islikty tarp serverio perkrovimu (ilgas TTL)

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'cache.json');

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return { pages: {}, analysis: {} };
  }
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('Nepavyko issaugoti talpyklos:', err.message);
  }
}

const PAGE_TTL_MS = 120 * 60 * 1000; // 2 val - visas nuskaitymas tik kas 2h
const ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 val - detali analize ilgiau aktuali

function getCached(namespace, key, ttlMs) {
  const cache = loadCache();
  const entry = cache[namespace] && cache[namespace][key];
  if (!entry) return null;
  if (Date.now() - entry.time > ttlMs) return null;
  return entry.data;
}

function setCached(namespace, key, data) {
  const cache = loadCache();
  if (!cache[namespace]) cache[namespace] = {};
  cache[namespace][key] = { time: Date.now(), data };
  saveCache(cache);
}

function cacheAgeMinutes(namespace, key) {
  const cache = loadCache();
  const entry = cache[namespace] && cache[namespace][key];
  if (!entry) return null;
  return Math.round((Date.now() - entry.time) / 60000);
}

// ============ ISTORINIS RINKOS DUOMENU KAUPIMAS ============
// Kuo daugiau kartu naudojama sistema, tuo daugiau skelbimu sukaupiama istorijoje -
// tai duoda tikslesnius kainos/ridos vidurkius net jei viena konkreti paieska rado mazai.
const HISTORY_FILE = path.join(__dirname, 'market-history.json');
const MAX_HISTORY_PER_MODEL = 300;

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return {}; // { [modelis]: [{ kaina, rida, metai, url, time }] }
  }
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
  } catch (err) {
    console.error('Nepavyko issaugoti istorijos:', err.message);
  }
}

function addToHistory(listings) {
  const history = loadHistory();
  for (const l of listings) {
    if (!l.kaina || !l.modelis) continue;
    if (!history[l.modelis]) history[l.modelis] = [];
    const arr = history[l.modelis];
    const existingIdx = arr.findIndex((e) => e.url === l.url);
    const entry = { url: l.url, kaina: l.kaina, rida: l.rida, metai: l.metai, time: Date.now() };
    if (existingIdx >= 0) arr[existingIdx] = entry;
    else arr.push(entry);
    if (arr.length > MAX_HISTORY_PER_MODEL) arr.splice(0, arr.length - MAX_HISTORY_PER_MODEL);
  }
  saveHistory(history);
}

function getHistoryForModel(modelis) {
  const history = loadHistory();
  return history[modelis] || [];
}


// ============ SKELBIMŲ KAINOS/RIDOS ISTORIJA (per URL) ============
// Kiekvieną kartą aptikus skelbimą – išsaugome kainą ir ridą su laiku.
// Leidžia AI analizei pamatyti ar kaina buvo mažinta, ar rida kinta.
const LISTING_TIMELINE_FILE = path.join(__dirname, 'listing-timeline.json');

function loadListingTimeline() {
  try { return JSON.parse(fs.readFileSync(LISTING_TIMELINE_FILE, 'utf-8')); }
  catch { return {}; }
}

function saveListingTimeline(data) {
  try { fs.writeFileSync(LISTING_TIMELINE_FILE, JSON.stringify(data)); }
  catch (err) { console.error('Nepavyko išsaugoti timeline:', err.message); }
}

function recordListingSnapshot(url, kaina, rida) {
  if (!url || !kaina) return;
  const data = loadListingTimeline();
  if (!data[url]) data[url] = [];
  const arr = data[url];
  const now = Date.now();
  // Nesaugome jei per 30min jau yra įrašas su ta pačia kaina
  const recent = arr[arr.length - 1];
  if (recent && recent.kaina === kaina && (now - recent.t) < 30 * 60 * 1000) return;
  arr.push({ t: now, k: kaina, r: rida || null });
  // Laikome iki 60 snapshot'ų per URL
  if (arr.length > 60) arr.splice(0, arr.length - 60);
  saveListingTimeline(data);
}

function getListingTimeline(url) {
  if (!url) return [];
  const data = loadListingTimeline();
  return data[url] || [];
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
  addToHistory, getHistoryForModel,
};
