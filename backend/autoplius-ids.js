// autoplius-ids.js — autoplius.lt markių ir modelių ID lentelė.
//
// Iki šiol paieška ėjo per `qt=BMW X5` (teksto paiešką), todėl autoplius grąžindavo ir
// X5 M, ir aksesuarų skelbimus, o mes viską sijodavome patys – švaistomi ScraperAPI kreditai.
// Su tikrais ID (`make_id[97]=1308&make_id_list=97`) gaunami tik tikslūs skelbimai, be to
// vienoje užklausoje galima nurodyti kelis modelius (`1308_1322_29821`).
//
// Šaltinis: autoplius paieškos formos iframe'as
//   https://autoplius.lt/skelbimai/paieska?category_id=2&filter=makes&type=make_combo
// jame yra <select id="make_id_list"> (markės) ir `new FinnCart('make_id', {...})` (modeliai).
// Pilna lentelė (207 markių, ~3 900 modelių) parsisiunčiama per ScraperAPI kartą per 30 d.
// ir laikoma DATA_DIR/autoplius-ids.json. SEED žemiau – sąsajos markės/modeliai, kad
// paieška veiktų tiksliai net jei parsisiuntimas nepavyktų.

const fs = require('fs');
const path = require('path');

const SEED = {
  makes: { 'BMW': 97, 'Audi': 99, 'Volkswagen': 43, 'Mercedes-Benz': 67, 'Opel': 60, 'Ford': 85, 'Volvo': 42, 'Toyota': 44, 'Skoda': 48, 'Peugeot': 59, 'Nissan': 62, 'Hyundai': 82, 'Kia': 77, 'Renault': 54, 'Mazda': 68, 'Honda': 84, 'Porsche': 56, 'Lexus': 72, 'Land Rover': 73, 'Tesla': 19524, 'Mini': 64, 'Seat': 49, 'Citroen': 92, 'Dacia': 110, 'Jeep': 78, 'Mitsubishi': 63, 'Subaru': 46, 'Suzuki': 45, 'Fiat': 86, 'Jaguar': 79, 'Cupra': 28897 },
  models: {
    'BMW': { '1': 1318, '2': 19786, '3': 1319, '4': 18817, '5': 1313, '6': 1320, '7': 1315, '8': 1314, 'X1': 11132, 'X2': 27917, 'X3': 1317, 'X4': 22769, 'X5': 1308, 'X6': 1322, 'X7': 29821, 'Z4': 1305,
      // "M" sąsajoje reiškia visus M modelius: M3, M5, M4, M8, X3 M, X4 M, X5 M, X6 M
      'M': [1310, 1309, 24306, 30215, 30171, 28685, 16024, 16025] },
    'Audi': { 'A1': 16207, 'A3': 1341, 'A4': 1340, 'A5': 1354, 'A6': 1339, 'A7': 31880, 'A8': 1338, 'Q2': 25020, 'Q3': 16770, 'Q5': 10856, 'Q7': 1353, 'Q8': 28649 },
    'Volkswagen': { 'Golf': 193, 'Polo': 184, 'Passat': 186, 'Tiguan': 207, 'Touran': 178, 'T-Roc': 27847, 'T-Cross': 28987, 'Caddy': 198, 'Taigo': 31938, 'Touareg': 179, 'ID.4': 30569 },
    'Mercedes-Benz': { 'A Klasė': 686, 'B Klasė': 694, 'C Klasė': 685, 'E Klasė': 682, 'S Klasė': 679, 'CLA Klasė': 18761, 'GLA': 22807, 'GLC': 24684, 'GLE': 24587, 'ML Klasė': 11214, 'Vito': 674, 'Sprinter': 697 },
    'Opel': { 'Astra': 527, 'Corsa': 523, 'Insignia': 10870, 'Mokka': 17625, 'Zafira': 509, 'Meriva': 519, 'Grandland X': 27797, 'Vivaro': 535 },
    'Ford': { 'Focus': 1004, 'Fiesta': 1005, 'Kuga': 1039, 'Mondeo': 999, 'S-Max': 1036, 'Galaxy': 1002, 'Puma': 995, 'Mustang': 998, 'Transit': 1025 },
    'Volvo': { 'S60': 157, 'S80': 156, 'V40': 153, 'V50': 175, 'V60': 16685, 'V70': 152, 'XC40': 27863, 'XC60': 13523, 'XC70': 174, 'XC90': 150 },
    'Toyota': { 'Corolla': 253, 'Yaris': 208, 'Avensis': 263, 'Auris': 279, 'RAV4': 221, 'C-HR': 25143, 'Yaris Cross': 30771, 'Prius': 225, 'Land Cruiser': 239 },
    'Skoda': { 'Octavia': 336, 'Fabia': 339, 'Superb': 335, 'Kodiaq': 26089, 'Karoq': 27845, 'Scala': 29813 },
    'Peugeot': { '208': 17530, '308': 508, '508': 16860, '2008': 18702, '3008': 16187, '5008': 16027 },
    'Nissan': { 'Qashqai': 603, 'X-Trail': 547, 'Juke': 16655, 'Micra': 576, 'Leaf': 17252 },
    'Hyundai': { 'i30': 941, 'i20': 10874, 'Tucson': 938, 'Santa Fe': 918, 'Kona': 27859 },
    'Kia': { 'Ceed': 859, 'Sportage': 834, 'Sorento': 836, 'Rio': 840, 'Niro': 25121 },
    'Renault': { 'Clio': 418, 'Megane': 411, 'Kadjar': 22733, 'Scenic': 408, 'Captur': 18734 },
    'Mazda': { '3': 738, '6': 732, 'CX-5': 17610, 'CX-3': 24605, 'CX-30': 30125 },
    'Honda': { 'Civic': 979, 'CR-V': 977, 'Accord': 983, 'Jazz': 968 },
    'Porsche': { '911': 452, 'Cayenne': 445, 'Macan': 19867, 'Panamera': 15998, 'Taycan': 30135 },
  },
};

// Kiti autoplius filtrų parametrai (patikrinta paieškos formoje 2026-09-17):
const PARAMETRAI = {
  rikiavimas: {                       // order_by + order_direction
    aktualiausi: 'order_by=1&order_direction=ASC',
    atnaujinti: 'order_by=2&order_direction=DESC',
    naujausi: 'order_by=3&order_direction=DESC',
    seniausi: 'order_by=3&order_direction=ASC',
    pigiausi: 'order_by=4&order_direction=ASC',
    brangiausi: 'order_by=4&order_direction=DESC',
    naujausiMetai: 'order_by=6&order_direction=DESC',
  },
  kuras: { benzinas: [30], dyzelis: [32, 17378], hibridas: [36, 17378], elektra: [35],
    dyzelinas: [32], dyzelinas_elektra: [17378], benzinas_dujos: [31], benzinas_elektra: [36] },   // v2.10.5 griežti
  pavaruDeze: { 'Automatinė': 38, 'Mechaninė': 37 },
  varantieji: { priekiniai: 17363, galiniai: 17362, visi: 17364 },
  kebulas: { sedanas: 4, hecbekas: 2, universalas: 5, vienaturis: 6, visureigis: 7, kupe: 1, kabrioletas: 3, pikapas: 10 },
  zymimieji: {                        // musu filtro raktas -> autoplius parametras
    beJav: 'exclude_usa=1',
    tikSuVin: 'has_vin_code=1',
    tikSuIstorija: 'has_autoistorija=1',
    beDefektu: 'has_damaged_id%5B10924%5D=10924',
    tikDauzti: 'has_damaged_id%5B10925%5D=10925',
    beVairoDesineje: 'steering_wheel_id=10922',
    tikLietuvoje: 'cars_in_lithuania_only=1',
    suGarantija: 'warranty=1',
    galiojantiTa: 'technical_passport=1',
  },
  // Vilnius = 1 (fk_place_cities_id), Lietuva = 1 (fk_place_countries_id); kitų miestų ID dar nesurinkti
};

const MAKE_COMBO_URL = 'https://autoplius.lt/skelbimai/paieska?category_id=2&filter=makes&type=make_combo';
const ATNAUJINTI_PO_MS = 30 * 24 * 3600 * 1000;
const BANDYTI_PO_NESEKMES_MS = 7 * 24 * 60 * 60 * 1000;   // v2.4.0
let _bandymoFailas = null;

let _pilna = null;        // { makes: {id: name}, models: {makeId: {modelId: name}}, atnaujinta }
let _failas = null;

function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

// Išparsina make_combo HTML: markių <select> ir FinnCart JSON su modeliais
function isparsinti(html) {
  const makes = {};
  const sel = html.match(/<select[^>]*id="make_id_list"[^>]*>([\s\S]*?)<\/select>/i);
  if (sel) {
    const re = /<option[^>]*value="(\d+)"[^>]*>([^<]*)<\/option>/gi; let m;
    while ((m = re.exec(sel[1])) !== null) makes[m[1]] = m[2].trim();
  }
  const zyme = "new FinnCart('make_id',";
  const i = html.indexOf(zyme);
  if (i < 0) throw new Error('make_combo: FinnCart nerastas');
  let depth = 0, start = -1, j = i + zyme.length;
  for (; j < html.length; j++) {
    const ch = html[j];
    if (ch === '{') { if (start < 0) start = j; depth++; }
    else if (ch === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  const raw = JSON.parse(html.slice(start, j));
  const models = {};
  Object.keys(raw).forEach((mk) => {
    models[mk] = {};
    Object.keys(raw[mk]).forEach((k) => {
      if (k.startsWith('__')) return;                // serijų grupių antraštės
      models[mk][k.replace(/^_/, '')] = String(raw[mk][k]).trim();
    });
  });
  if (Object.keys(makes).length < 50 || Object.keys(models).length < 50) throw new Error('make_combo: per mažai duomenų');
  return { makes, models, atnaujinta: Date.now() };
}

function prijungti(dataDir, parsisiusti) {
  _failas = path.join(dataDir, 'autoplius-ids.json');
  try {
    if (fs.existsSync(_failas)) {
      _pilna = JSON.parse(fs.readFileSync(_failas, 'utf8'));
      console.log(`[AUTOPLIUS-ID] įkelta iš disko: ${Object.keys(_pilna.makes).length} markių, ${Object.values(_pilna.models).reduce((a, m) => a + Object.keys(m).length, 0)} modelių`);
    }
  } catch (e) { _pilna = null; console.warn('[AUTOPLIUS-ID] failas neįskaitomas:', e.message); }
  const pasenes = !_pilna || (Date.now() - (_pilna.atnaujinta || 0)) > ATNAUJINTI_PO_MS;
  // v2.4.0: NEPAVYKUSIO bandymo laikas irgi prisimenamas. Iki siol, kai
  // autoplius pakeite puslapi („make_combo: FinnCart nerastas"), failas
  // nebuvo atnaujinamas, lentele likdavo pasenusi, ir bandymas kartodavosi
  // KIEKVIENO starto metu - t. y. po kiekvieno push'o po 10 kreditu, be jokios
  // naudos. Dabar po nesekmes laukiam BANDYTI_PO_NESEKMES_MS.
  _bandymoFailas = path.join(dataDir, 'autoplius-ids-bandymas.json');
  let paskutineNesekme = 0;
  try { paskutineNesekme = JSON.parse(fs.readFileSync(_bandymoFailas, 'utf8')).t || 0; } catch (e) {}
  const neseniaiNepavyko = (Date.now() - paskutineNesekme) < BANDYTI_PO_NESEKMES_MS;
  if (pasenes && neseniaiNepavyko) {
    console.log('[AUTOPLIUS-ID] lentele pasenusi, bet paskutinis bandymas nepavyko pries '
      + Math.round((Date.now() - paskutineNesekme) / 3600000) + ' val. - kartosim po ' + Math.round(BANDYTI_PO_NESEKMES_MS / 86400000) + ' d.');
  }
  if (pasenes && !neseniaiNepavyko && typeof parsisiusti === 'function') {
    // Ne blokuojam paleidimo. Kaina: 1 puslapis (~10 kreditu) karta per menesi.
    setTimeout(() => atnaujinti(parsisiusti).catch(() => {}), 15000);
  }
}

async function atnaujinti(parsisiusti) {
  try {
    const html = await parsisiusti(MAKE_COMBO_URL);
    if (!html) throw new Error('tuščias atsakymas');
    const lentele = isparsinti(html);
    _pilna = lentele;
    try { fs.writeFileSync(_failas, JSON.stringify(lentele)); } catch (e) {}
    console.log(`[AUTOPLIUS-ID] atnaujinta: ${Object.keys(lentele.makes).length} markių, ${Object.values(lentele.models).reduce((a, m) => a + Object.keys(m).length, 0)} modelių`);
    return true;
  } catch (e) {
    console.warn('[AUTOPLIUS-ID] atnaujinti nepavyko (liekam su SEED):', e.message);
    try { if (_bandymoFailas) fs.writeFileSync(_bandymoFailas, JSON.stringify({ t: Date.now(), klaida: String(e.message).slice(0, 200) })); } catch (e2) {}
    return false;
  }
}

// Markės ID pagal pavadinimą (pilna lentelė -> seed)
function markesId(marke) {
  if (!marke) return null;
  const n = norm(marke);
  if (_pilna) { const id = Object.keys(_pilna.makes).find((k) => norm(_pilna.makes[k]) === n); if (id) return +id; }
  const s = Object.keys(SEED.makes).find((k) => norm(k) === n);
  return s ? SEED.makes[s] : null;
}

// Modelio (-ių) ID pagal markę ir sąsajos pavadinimą ("5" -> "5 serija", "A Klasė" -> "A klasė")
function modeliuIds(marke, modelis) {
  if (!marke || !modelis) return [];
  const seedM = SEED.models[Object.keys(SEED.models).find((k) => norm(k) === norm(marke))] || {};
  const seedK = Object.keys(seedM).find((k) => norm(k) === norm(modelis));
  if (seedK) return [].concat(seedM[seedK]);
  const mk = markesId(marke);
  if (!_pilna || !mk || !_pilna.models[mk]) return [];
  const mods = _pilna.models[mk], n = norm(modelis);
  const kand = [n, n + ' serija', n + ' klasė', n.replace(' klasė', ''), n.replace(/ serija$/, '')];
  for (const k of kand) {
    const id = Object.keys(mods).find((mid) => norm(mods[mid]) === k);
    if (id) return [+id];
  }
  return [];
}

// Grąžina URL gabalą su make_id/model_id, arba null jei markė nežinoma (tada – qt= tekstas)
function urlDalis(marke, modelis) {
  const mk = markesId(marke);
  if (!mk) return null;
  const ids = modeliuIds(marke, modelis);
  if (modelis && !ids.length) return null;       // modelis nežinomas – geriau tekstinė paieška
  return `make_id%5B${mk}%5D=${ids.length ? ids.join('_') : 0}&make_id_list=${mk}`;
}

function busena() {
  return { pilna: !!_pilna, atnaujinta: _pilna ? _pilna.atnaujinta : null,
    markiu: _pilna ? Object.keys(_pilna.makes).length : Object.keys(SEED.makes).length,
    modeliu: _pilna ? Object.values(_pilna.models).reduce((a, m) => a + Object.keys(m).length, 0) : Object.values(SEED.models).reduce((a, m) => a + Object.keys(m).length, 0) };
}

// Modelių sąrašas markei (sąsajai / indeksavimui)
function modeliai(marke) {
  const mk = markesId(marke);
  if (_pilna && mk && _pilna.models[mk]) return Object.keys(_pilna.models[mk]).map((id) => ({ id: +id, pavadinimas: _pilna.models[mk][id] })).filter((m) => m.pavadinimas !== '-kita-');
  const s = SEED.models[Object.keys(SEED.models).find((k) => norm(k) === norm(marke))] || {};
  return Object.keys(s).map((k) => ({ id: [].concat(s[k])[0], pavadinimas: k }));
}

module.exports = { SEED, PARAMETRAI, MAKE_COMBO_URL, prijungti, atnaujinti, isparsinti, markesId, modeliuIds, urlDalis, busena, modeliai };
