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

const PAGE_TTL_MS = 30 * 60 * 1000; // 30 min - paieskos puslapiu sarasas keiciasi greitai
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

module.exports = {
  getCached, setCached, cacheAgeMinutes, PAGE_TTL_MS, ANALYSIS_TTL_MS,
  addToHistory, getHistoryForModel,
};
