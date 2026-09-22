// backend/regitra.js — Lietuvos registro (Regitra) parko suvestinė.
//
// Specifikacija: docs/regitra-panaudojimas.md
// Matavimai:     docs/ATSAKYMAI-regitra-2026-09-21.md
//
// 700 KB įkeliami paleidžiant ir laikomi atmintyje. SQLite nereikia: tai
// ketvirtinis STATINIS duomuo, keliaujantis su deploy'umi, ne kintanti būsena.
//
// KĄ DARO IR KO NE:
//   daro  - suveda skelbimo markę ir modelį į bazinį modelį, atiduoda parko
//           suvestinę ir žinojimo lygių punktus.
//   NEdaro - nekeičia balo. Nė vienas punktas nepatenka į `computeTriageScore`.

const fs = require('fs');
const path = require('path');

// K-33 (2026-09-22, Analitikas). Pakeičia backend/regitra.js nuo eilutės
// `const MARKES = {` iki eilutės PRIEŠ `let LENT = new Map();` (visą bloką, įskaitant
// seną SVARBU komentarą, markeNorm ir baziniModelis).

const MARKES = {
  'VOLKSWAGEN. VW': 'VW', 'VOLKSWAGEN': 'VW',
  'MERCEDES-BENZ': 'MERCEDES', 'MERCEDES BENZ': 'MERCEDES',
  'LAND-ROVER': 'LAND ROVER',
};

// ── v3 (K-33, 2026-09-22) ──────────────────────────────────────────────────
// Registras markę rašo gamintojo dokumento forma. Išmatuota M1 parke:
//   'VOLKSWAGEN-VW' 19 513 · 'BAYER.MOT.WERKE-BMW' 3 821 · 'BMW AG' 994 ·
//   'SKODA (CZ)' 631 · 'OPEL OPEL' 293 · 'ADAM OPEL GMBH' 156 · 'FORD (D)' 1 035 ...
// Iki v3 kiekviena tokia forma buvo ATSKIRA markė, t. y. atskiras raktas.
// SVARBU: MARKES, IMONES_ZODZIAI, VIENAZODES, UZPILDAI ir markeNorm/baziniModelis turi
// ATITIKTI tools/regitra-suvestine.py marke_norm()/modelis_dalys(). Patikrinta 2026-09-22:
// 38 214 tikrų registro + TA porų, 0 nesutapimų. testai/regitra.test.js tikrina raktus.
const IMONES_ZODZIAI = new Set(['AG', 'GMBH', 'LTD', 'LIMITED', 'SPA', 'NV', 'SA', 'CO', 'INC', 'CORP',
  'CORPORATION', 'MOTOR', 'MOTORS', 'EUROPE', 'AUTOMOBILES', 'AUTOMOBILE',
  'AUTO', 'GROUP', 'MEM', 'ADAM', 'W', 'THE', 'OF', 'CAR', 'UK']);
const VIENAZODES = new Set(['AUDI', 'OPEL', 'TOYOTA', 'SKODA', 'VOLVO', 'FORD', 'PEUGEOT', 'RENAULT',
  'CITROEN', 'NISSAN', 'HYUNDAI', 'KIA', 'MAZDA', 'HONDA', 'SEAT', 'FIAT', 'LEXUS',
  'PORSCHE', 'MITSUBISHI', 'SUBARU', 'SUZUKI', 'DACIA', 'JEEP', 'MINI', 'CHEVROLET',
  'CHRYSLER', 'DODGE', 'TESLA', 'CUPRA', 'SAAB', 'SMART', 'LANCIA', 'INFINITI']);

function markeNorm(mk) {
  const m = String(mk == null ? '' : mk).trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(MARKES, m)) return MARKES[m];
  const z = m.replace(/\([^)]*\)/g, ' ').split(/[\s.,/()\-]+/).filter(Boolean);
  if (!z.length) return m.replace(/\./g, ' ').trim();
  if (z.includes('VW') || z.some((x) => x.includes('WAGEN'))) return 'VW';
  if (z.includes('BMW') || z.includes('BAYER') || z.join('') === 'BMW') return 'BMW';
  if (z.some((x) => x.startsWith('MERCEDES') || x.startsWith('MERSEDES')) || z.includes('BENZ') || z.some((x) => x.startsWith('DAIMLER'))) return 'MERCEDES';
  if ((z[0] === 'LAND' && z[1] === 'ROVER') || z[0] === 'LANDROVER') return 'LAND ROVER';
  let liko = [];
  for (const x of z) {
    if (IMONES_ZODZIAI.has(x) || (liko.length && liko[liko.length - 1] === x)) continue;
    liko.push(x);
  }
  if (!liko.length) liko = z;
  if (VIENAZODES.has(liko[0])) return liko[0];
  return liko.join(' ');
}

// Užpildomieji žodžiai modelio lauke: 'SERIE 3', '3ER REIHE', 'CLASSE E', '5-SERIE'.
const UZPILDAI = new Set(['REIHE', 'SERIE', 'SERIES', 'SERIJA', 'KLASSE', 'KLASE', 'CLASS', 'CLASSE', 'KLASA']);
const BRUKS_UZPILDAS = /^([A-Z0-9]{1,3})-(?:REIHE|SERIE|SERIES|SERIJA|KLASSE|KLASE|CLASS|CLASSE|KLASA)$/;

// ('BMW', 'X5 XDRIVE30D') → 'BMW X5'; ('BMW', '320D') → 'BMW 3'.
// null - raktas NEAPIBRĖŽTAS (BMW 'X REIHE' nesako, ar X1, ar X5; modelis '-').
function baziniModelis(marke, modelis) {
  const mkn = markeNorm(marke);
  const mkZodziai = new Set(mkn.split(/\s+/));
  const dal = String(modelis == null ? '' : modelis).trim().toUpperCase()
    .replace(/\./g, ' ')
    .split(/[\s,/;]+/).filter(Boolean);
  while (dal.length && (mkZodziai.has(dal[0]) || markeNorm(dal[0]) === mkn)) dal.shift();
  const out = [];
  for (let x of dal) {
    const m = x.match(BRUKS_UZPILDAS);
    if (m) x = m[1];
    x = x.replace(/^(\d)ER$/, '$1');                            // 3ER → 3
    if (UZPILDAI.has(x) || !/[A-Z0-9]/.test(x)) continue;
    out.push(x);
  }
  if (!out.length) return null;
  let b = out[0];
  if (mkn === 'BMW') {
    const m = b.match(/^(\d)\d\d[A-Z]*$/);                      // 320D, 530E, 118I → serija
    if (m) b = m[1];
    else if (['X', 'Z', 'M', 'I'].includes(b) && out.length > 1 && /^\d$/.test(out[1])) b = b + out[1];
    if (['X', 'Z', 'M', 'I'].includes(b)) return null;          // 'X REIHE' - nežinia kuris
  } else if (mkn === 'TESLA') {
    const m = out.join(' ').match(/^(?:MODEL\s*)?([3SXY])(?![A-Z]{2})/);   // 'MODEL 3', 'MODEL3', 'S85', 'MODEL S100D'
    if (m) b = 'MODEL ' + m[1];                                 // ne visos Teslos viename rakte 'MODEL'
  } else if (mkn === 'MERCEDES') {
    const m = b.match(/^([A-Z]{1,3})\d{2,3}[A-Z]*$/);           // C220, E320CDI, ML350 → klasė
    if (m) b = m[1];
  }
  return mkn + ' ' + b;
}

let LENT = new Map();
let META = null;
// v2.10.0 (A-34): TA apžiūrų suvestinė (TRANSEKSTA, data.gov.lt 2721, CC BY 4.0).
let TA = new Map();
let TA_META = null;
let TA_BAZE = null;

function ikeltiTA() {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'duomenys', 'ta-modeliai.json'), 'utf8'));
    TA = new Map(d.modeliai.map((m) => [m.modelis, m]));
    TA_BAZE = (d.bazine && d.bazine.neislaike_juostos) || null;
    TA_META = { sugeneruota: d.sugeneruota, laikotarpis: d.laikotarpis || null, modeliu: d.modeliai.length };
    console.log('[TA] ikelta:', TA_META.modeliu, 'modeliu · laikotarpis', TA_META.laikotarpis);
  } catch (e) {
    console.error('[TA] NEPAVYKO ikelti:', e.message, '- TA punktai isjungti');
    TA = new Map(); TA_META = null; TA_BAZE = null;
  }
  return TA_META;
}

function ikelti() {
  ikeltiTA();
  try {
    const p = path.join(__dirname, 'duomenys', 'regitra-modeliai.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    LENT = new Map(d.modeliai.map((m) => [m.modelis, m]));
    ZINOMOS = new Set();
    META = {
      sugeneruota: d.sugeneruota,
      modeliu: d.modeliu,
      saltinis: d.saltinis || null,
      // v2: BE SIU DVIEJU skaiciai neturi laiko. Ju truko v1, ir butent todel
      // 12 men. langas tyliai dengė 9,3 menesio - zr. ATSAKYMAI 8 sk.
      duomenuPabaiga: d.duomenu_pabaiga || null,
      langas12men: d.langas_12men || null,
      versija: d.versija || 1,
    };
    console.log('[REGITRA] ikelta:', d.modeliu, 'modeliu · duomenys iki',
      d.duomenu_pabaiga, '· 12 men. langas', d.langas_12men);
  } catch (e) {
    // NE tylus catch. Jei failo nera, funkcija turi DINGTI MATOMAI, o ne rodyti
    // nulius: „parkas 0" atrodo kaip atsakymas, o yra klaida.
    console.error('[REGITRA] NEPAVYKO ikelti:', e.message, '- rinkos kontekstas isjungtas');
    LENT = new Map();
    META = null;
  }
  return META;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELBIMO PUSĖ (v2.5.6, Z-85). Registro raktams netaikoma - Python poros
// nekeičia. Iki v2.5.6 skelbimai `marke` lauko NETURĖJO (jį turi tik filtrai),
// o `modelis` ateina pilnas („BMW X5", „Mercedes-Benz E 220"). Tad
// kontekstas(undefined, 'BMW X5') → raktas „ BMW" → KIEKVIENAS skelbimas gavo
// ⚪ „modelio registre nėra". Čia suvedam abu atvejus į (markė, modelis).
// ─────────────────────────────────────────────────────────────────────────────
const beDiakritiku = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const DAUGIAZODES = ['MERCEDES-BENZ', 'MERCEDES BENZ', 'LAND ROVER', 'LAND-ROVER', 'ALFA ROMEO',
  'ASTON MARTIN', 'ROLLS-ROYCE', 'LYNK & CO', 'GREAT WALL', 'SSANG YONG'];
// „Klasa E" (otomoto), „E klasė" (autogidas), „E-Klasse" (mobile.de) → „E"
const KLASE = /^(?:KLASA|CLASSE|CLASS|KLASSE)\s+([A-Z]{1,3})\b|^([A-Z]{1,3})[\s-]*(?:KLASE|KLASSE|CLASSE|CLASS)\b/;

let ZINOMOS = new Set();
function zinomosMarkes() {
  if (!ZINOMOS.size) for (const k of LENT.keys()) ZINOMOS.add(k.split(' ')[0]);
  return ZINOMOS;
}

function paruosti(marke, modelis) {
  let mk = beDiakritiku(marke).trim().toUpperCase();
  let mo = beDiakritiku(modelis).trim().toUpperCase().replace(/\s+/g, ' ');
  const pirma = DAUGIAZODES.find((x) => mo.startsWith(x + ' '))
    || (zinomosMarkes().has(markeNorm(mo.split(' ')[0])) && mo.includes(' ') ? mo.split(' ')[0] : null);
  if (mk && mo.startsWith(mk + ' ')) mo = mo.slice(mk.length).trim();
  else if (pirma) { mk = pirma; mo = mo.slice(pirma.length).trim(); }
  if (markeNorm(mk) === 'MERCEDES') {
    const k = mo.match(KLASE);
    if (k) mo = (k[1] || k[2]) + mo.slice(k[0].length);
  }
  return [mk, mo];
}

function kontekstas(marke, modelis) {
  const [mk, mo] = paruosti(marke, modelis);
  const k = baziniModelis(mk, mo);
  if (!k) return null;
  return LENT.get(k) || null;
}

function taKontekstas(marke, modelis) {
  const [mk, mo] = paruosti(marke, modelis);
  const k = baziniModelis(mk, mo);
  return k ? (TA.get(k) || null) : null;
}

// Atribucija - CC BY 4.0 reikalauja. Metai iš failo, niekada „naujausi" (A-33).
function taSaltinis() {
  const l = TA_META && TA_META.laikotarpis;
  const iki = l && l[1] ? String(l[1]).slice(0, 7) : '';
  return '(Šaltinis: TRANSEKSTA, techninės apžiūros duomenys' + (iki ? ' iki ' + iki : '') + ' · CC BY 4.0)';
}

// ── Ribos ────────────────────────────────────────────────────────────────────
// Visos RISTOS PRIE IMTIES KVARTILIU, ne prie apvaliu skaiciu. Tai analitiko
// principas is `ATSAKYMAI` 8 sk., ir jis reiskia, kad riba pati pasako, kiek
// modeliu i ja pateks: virsutinis arba apatinis ketvirtis.
const RIBOS = {
  // 512 modeliu (parkas >= 300): P25 = 12,9 %, P75 = 26,4 %.
  apyvJudrus: 26,        // >= 26 %  -> 🟢  (133 modeliai)
  apyvLetas: 13,         // <= 13 %  -> 🟡  (129 modeliai)

  parkasRetas: 300,      // < 300    -> 🟡

  // A-29 (analitikas, 2026-09-21): 393 modeliai (senu_n >= 30, parkas >= 300),
  // P50 = 27,9 %, P75 = 45,5 %. Ties 40 % suveiktu 124 (31,6 %) - todel
  // riba viena pati netinka; atranka daro AMZIAUS VARTAI (>= 12 m.), ne riba.
  // Suveikia tik nuleidus iki 40: Focus 42,6, Sharan 41,7, BMW 525 48,7,
  // BMW 530 43,5 - kas antras ju 15+ m. egzempliorius nebevažiuoja.
  neleid15Riba: 40,      // > 40 %   -> 🟡
  senuMinN: 30,
  nurasymuAmzius: 12,    // skelbimo automobiliui turi buti bent tiek metu

  // A-30: ridos norma - TIK amziaus juostoje (`kmmet_juostos`, >= 50 irasu).
  // Juostas turi 254 modeliai is 1 343, bet tai 84,8 % parko.
  //
  // A-32: kai juostos nera, sudetinis `kmmet_kv` leidziamas TIK 7-15 metu
  // lange. Analitiko simuliacija (246 338 irasai): klaidingai pazymetu
  // 7-9 0,4 %, 10-12 0,1 %, 13-15 0,5 %, bet 16-20 jau 5,8 %, o 21+ - 23,7 %.
  // Uz 15 metu sudetinis P10 pakyla VIRS juostos, t. y. kaltintu be pagrindo.
  // Jaunoms (0-6) irgi ne: ten 1,3-3,3 %.
  atsargaNuo: 7,
  atsargaIki: 15,
  atsargaMinN: 100,      // P10 is 25 irasu svyruoja -24 .. +21 % (Audi A6 16-20)

  kuroMazuma: 15,        // <= 15 %  -> 🟡  siauras pirkeju ratas

  // A-34 (Analitikas, 2026-09-22, UZDUOTIS-ta-integracija.md §10)
  taJuostaMinN: 100,     // TA juosta pirmesnė už Regitros, kai apžiūrų >= 100
  taNulinimas: 1.0,      // nulinimas_pct >= 1,0 -> 21-40 m. ridos norma ⚪
  buklesMinN: 300,       // BŪKLĖ: juostoje >= 300 apžiūrų
  buklesPP: 10,          // ir >= +10 p. p. virš bazinės -> 🟡 (🟢 nerodom)
  importoMinA1: 120,     // IMPORTAS: paskutinių 12 mėn. >= 120
  importoAugo: 50,       // >= +50 %
  importoKrito: -33,     // <= -33 %
};

// ── Uždrausti žodžiai · ta pati taisyklė, kaip nuotraukų analizėje ───────────
// Šie punktai yra KLAUSIMAS PARDAVĖJUI, ne verdiktas. Registro suvestinė
// nežino nieko apie konkretų automobilį - ji žino, kas įprasta modeliui.
const DRAUDZIAMA = [
  { re: /\batsukt\w*\b/i, kodel: 'ridos klastojimas iš suvestinės nenustatomas' },
  { re: /\bsukt\w*\s+rid\w*\b|\brid\w*\s+sukt\w*\b/i, kodel: 'ridos klastojimas iš suvestinės nenustatomas' },
  { re: /\bsuklastot\w*\b/i, kodel: 'klastojimas iš suvestinės nenustatomas' },
  { re: /\bneatitinka\s+tikrov\w*\b/i, kodel: 'suvestinė nežino šio automobilio' },
  { re: /\bmeluoj\w*\b|\bapgaul\w*\b/i, kodel: 'suvestinė nieko neįtaria' },
  // A-34: TA fiksuoja dėvėjimąsi, ne patikimumą; importas - faktas, ne prognozė.
  { re: /\b(ne)?patikim\w*\b/i, kodel: 'TA matuoja būklę, ne patikimumą' },
  { re: /\bdažnai\s+gend\w*\b|\bdaznai\s+gend\w*\b/i, kodel: 'TA matuoja būklę, ne gedimus' },
  { re: /\b(kaina|vertė|verte)\s+(kris|sumažės|sumazes|augs)\w*\b/i, kodel: 'registras neprognozuoja kainų' },
];

function tikrintiTeksta(t) {
  for (const d of DRAUDZIAMA) if (d.re.test(String(t))) return d.kodel;
  return null;
}

const LYGIS = { PATVIRTINTA: 'confirmed', SIGNALAS: 'signal', NEZINOMA: 'unknown' };

function punktas(lygis, k, tekstas) {
  const bloga = tikrintiTeksta(tekstas);
  if (bloga) {
    console.error('[REGITRA] punktas nutildytas (' + bloga + '):', tekstas);
    return null;
  }
  return { lygis, k, tekstas };
}

const proc1 = (v) => Number(v).toFixed(1).replace('.', ',');
// „RENAULT MEGANE" -> „Renault Megane", bet „BMW X5", „VW ID" lieka.
const graziVardas = (s) => String(s || '').split(' ').map((w) => (/^[A-Z]{4,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w)).join(' ');
const sk = (v) => Number(v).toLocaleString('lt-LT').replace(/,/g, ' ');

// ── Kuro vardų suvedimas ─────────────────────────────────────────────────────
// Skaitytuvas gamina „Benzinas / elektra", „Hibridas", „Dyzelinas"; Regitra -
// „Benzinas/Elektra", „Dyzelinas". Be suvedimo punktas tyliai nedirbtu, ir
// niekas to nepastebetu - todel `regitra.test.js` tikrina VISA musu zodyna.
function kuroRaktas(s) {
  let t = String(s == null ? '' : s).toLowerCase().trim()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');
  if (t === 'hibridas' || t === 'hybrid') t = 'benzinas/elektra';
  if (t === 'elektrinis') t = 'elektra';
  if (t === 'dyzelis') t = 'dyzelinas';
  return t;
}

function kuroDalis(r, kuras) {
  if (!r || !r.degalai || !r.degalai.length) return null;
  const k = kuroRaktas(kuras);
  if (!k) return null;
  for (const [vardas, proc] of r.degalai) if (kuroRaktas(vardas) === k) return proc;
  return null;   // nera tarp trijų didziausiu - dalies NEZINOM, tad ir nesakom
}

// ── Punktai ──────────────────────────────────────────────────────────────────
// `c` - skelbimas: { marke, modelis, metai, rida, kuras }.
// Amziaus juosta is `kmmet_juostos` (raktai '0-3', '4-6', ..., '21-40').
// Nera juostos (maziau 50 irasu) -> null, ir sasaja rodo ⚪, ne spejima.
function juostaIs(juostos, amzius, minN) {
  for (const k of Object.keys(juostos || {})) {
    const [nuo, iki] = k.split('-').map(Number);
    if (amzius >= nuo && amzius <= iki) {
      const v = juostos[k];
      if (minN && !(v && v[0] >= minN)) return null;
      return { raktas: k, v, nuo, iki, pavadinimas: nuo + '–' + iki + ' metų' };
    }
  }
  return null;
}

// K-34 (A-36): kuras - antra TA ridos normos dimensija. Modelio juosta = daugumos
// kuro norma: pagal modelio P10 žemiau patenka benzininių 23,0 %, dyzelinių 5,9 %
// (turėtų būti 10 %). BMW 3 16-20 m.: benzininių 36,8 %, dyzelinių 3,5 %.
// Tvarka 4+ m.: TA to paties kuro juosta (n >= 100) -> jei kuras žinomas, bet
// savo juostos nėra, o kito kuro yra - { beKuro: true } (⚪, modelio norma būtų
// kito kuro) -> TA modelio juosta -> Regitros juosta -> atsarga 7-15 m. -> null.
// 0-3 m. - tik Regitros juosta (K-39). Regitros juostos kuro neskiria.
const KURO_KILMININKAS = {
  'dyzelinas': 'dyzelinių', 'benzinas': 'benzininių', 'benzinas/dujos': 'benzinu ir dujomis varomų',
  'benzinas/elektra': 'hibridinių', 'dyzelinas/elektra': 'dyzelinių hibridinių', 'elektra': 'elektrinių',
};

function amziausJuosta(r, amzius, ta, kuras) {
  if (amzius == null) return null;
  if (ta && ta.nulinimas_pct != null && ta.nulinimas_pct >= RIBOS.taNulinimas && amzius >= 21) {
    return { blokuota: true };
  }
  // K-39 (A-34 §10.5): TA 0-3 m. juosta ridos normai NEnaudojama - ten beveik
  // vien įvežti automobiliai, rida užfiksuota įvežant (TA 0-3 P10 < 4-6 P10
  // 264 iš 273 modelių). 0-3 m. skelbimui - tik Regitros juosta arba ⚪.
  if (ta && amzius >= 4) {
    // Tik žinomi kuro raktai. Neatpažintas skelbimo kuras („Benzinas / etanolis",
    // kita kalba) -> modelio juosta, kaip iki K-34, o ne ⚪.
    const k = kuroRaktas(kuras);
    const kj = ta.kmmet_kuras || null;
    if (k && kj && KURO_KILMININKAS[k]) {
      const jk = juostaIs(kj[k], amzius, RIBOS.taJuostaMinN);
      if (jk) return Object.assign(jk, { ta: true, kuras: k });
      const kitas = Object.keys(kj).some((f) => f !== k && juostaIs(kj[f], amzius, RIBOS.taJuostaMinN));
      if (kitas) return { beKuro: true, kuras: k };
    }
    const j = juostaIs(ta.kmmet_juostos, amzius, RIBOS.taJuostaMinN);
    if (j) return Object.assign(j, { ta: true });
  }
  if (!r) return null;
  const j = juostaIs(r.kmmet_juostos, amzius, 0);
  if (j) return j;
  // A-32 atsarga: tik 7-15 m. lange ir tik su pakankama imtimi.
  if (amzius >= RIBOS.atsargaNuo && amzius <= RIBOS.atsargaIki
      && Array.isArray(r.kmmet_kv) && r.kmmet_n >= RIBOS.atsargaMinN) {
    const kv = r.kmmet_kv;                                    // [P10, P25, P50, P75, P90]
    return { raktas: 'atsarga', v: [r.kmmet_n, kv[0], kv[1], kv[2], kv[3], kv[4]],
      pavadinimas: 'visų amžių', atsarga: true };
  }
  return null;
}

function punktai(c) {
  if (!c) return [];
  const r = kontekstas(c.marke, c.modelis);
  const ta = taKontekstas(c.marke, c.modelis);

  if (!r) {
    if (!META) return [];
    if (!paruosti(c.marke, c.modelis)[0]) return [];   // markė nežinoma („Nezinomas") - ne registro žinia   // duomenys neikelti - tyla, o ne melagingas ⚪
    return [punktas(LYGIS.NEZINOMA, 'LT REGISTRAS',
      'Šio modelio Lietuvos registro suvestinėje nėra – reti modeliai duomenyse nuasmeninami')].filter(Boolean);
  }

  const out = [];

  // 1. Likvidumas. 🟢 pagristas: tai suskaiciuotas faktas, ne prognoze.
  if (r.apyv_pct >= RIBOS.apyvJudrus) {
    out.push(punktas(LYGIS.PATVIRTINTA, 'LIKVIDUMAS',
      'LT rinkoje ' + r.apyv_pct + ' % per metus keičia savininką – judrus modelis'));
  } else if (r.apyv_pct <= RIBOS.apyvLetas) {
    out.push(punktas(LYGIS.SIGNALAS, 'LIKVIDUMAS',
      'LT rinkoje tik ' + r.apyv_pct + ' % per metus keičia savininką – lėtas pardavimas'));
  }

  // 2. Ridos norma · km/metus TOS PACIOS AMZIAUS JUOSTOS viduje (A-30).
  //
  // Sudeti procentiliai (`rida_kv`, `kmmet_kv`) konkreciam skelbimui NETINKA:
  // km per metus krinta su amziumi monotoniskai (X5 21 851 -> 12 430,
  // Passat 46 774 -> 11 333). Pamatuota: 3 m. X5 su 100 000 km pagal sudeta
  // `rida_kv` butu „zemiau P10", o savo juostoje jis ties P90 - verdiktas
  // APSIVERCIA. Vieno bendro amziaus koeficiento irgi neuztenka (Passat
  // 0-3 m. -49 %, XC60 +18-22 %).
  //
  // RIBA, kuria butina zinoti: rida uzfiksuota REGISTRACIJOS operacijos metu,
  // Lietuvoje daznai - ivezant, t. y. butent tada, kai ji atsukama. Norma
  // pati patempta zemyn, tad testas KONSERVATYVUS: dali tikru atveju praleis,
  // bet be pagrindo nekaltins. Tokios krypties klaidos ir norim.
  const metai = parseInt(c.metai, 10);
  const rida = parseFloat(c.rida);
  const amzius = metai ? (new Date().getFullYear() - metai) : null;
  const juosta = amziausJuosta(r, amzius, ta, c.kuras);

  if (!amzius || amzius < 1 || !rida) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Nepakanka duomenų palyginti (reikia metų ir ridos)'));
  } else if (juosta && juosta.blokuota) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Tokio amžiaus šio modelio ridos duomenis iškraipo dažni skaitiklių keitimai – palyginti nėra su kuo'));
  } else if (juosta && juosta.beKuro) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Tokio amžiaus ' + (KURO_KILMININKAS[juosta.kuras] || 'tokio kuro') + ' šio modelio automobilių '
      + 'per mažai, o bendrą normą lemia kitas kuras – palyginti nėra su kuo'));
  } else if (!juosta) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Registre per mažai tokio amžiaus šio modelio automobilių su rida, kad būtų su kuo palyginti'));
  } else {
    const kmMet = rida / amzius;
    const [n, p10, , p50] = juosta.v;   // [n, P10, P25, P50, P75, P90]
    if (kmMet < p10) {
      out.push(punktas(LYGIS.SIGNALAS, 'RIDOS NORMA',
        sk(Math.round(kmMet)) + ' km per metus – patenka tarp 10 % mažiausiai '
        + 'važiavusių ' + juosta.pavadinimas + ' šio modelio '
        + (juosta.kuras && KURO_KILMININKAS[juosta.kuras] ? KURO_KILMININKAS[juosta.kuras] + ' ' : '')
        + 'automobilių Lietuvoje ('
        + sk(n) + (juosta.ta ? ' techninių apžiūrų' : ' registracijų') + ', mediana ' + sk(p50) + ' km/metus). '
        + 'Paklauskite pardavėjo dėl serviso istorijos.'
        + (juosta.ta ? ' ' + taSaltinis() : '')));
    }
    // Virs P10 punkto nera: „rida iprasta" nera zinia.
  }

  // 3. Retumas.
  if (r.parkas < RIBOS.parkasRetas) {
    out.push(punktas(LYGIS.SIGNALAS, 'RETUMAS',
      'Lietuvoje registruoti tik ' + sk(r.parkas) + ' – siauras pirkėjų ratas'));
  }

  // 4. Nurasymai · TIK tarp 15+ metu automobiliu, ir TIK seniems skelbimams.
  //
  // Bendras `neleid_pct` yra AMZIAUS matas, ne patvarumo: Skoda Karoq 1,0 %
  // nereiskia nieko, nes tokio amziaus Karoq nera nė vieno. Pjuvis apverčia
  // isvadas - Cayenne bendras 8,7 % atrodo geriau uz X5 11,6 %, o tarp 15+
  // metu yra atvirksciai (18,3 % pries 16,7 %).
  //
  // AMZIAUS VARTAI, kuriu nebuvo nei specifikacijoje, nei atsakymuose:
  // statistika apie 15+ metu automobilius NIEKO nesako apie trejų metų
  // masina. Rodyti ja 2023 m. X5 pirkejui reikstu atsakyti i klausima, kurio
  // jis neuzdave, ir dar prasta naujiena apie svetima automobili. Todel
  // punktas suveikia tik tada, kai PATS skelbimas artėja i ta amziaus grupe.
  if (amzius != null && amzius >= RIBOS.nurasymuAmzius
      && r.senu_n >= RIBOS.senuMinN && r.neleid15_pct != null
      && r.neleid15_pct > RIBOS.neleid15Riba) {
    out.push(punktas(LYGIS.SIGNALAS, 'NURAŠYMAI',
      r.neleid15_pct + ' % šio modelio 15+ metų automobilių Lietuvoje nebeleidžiami eisme'));
  }

  // 5. Kuras. Tik kai musu dalis TIKRAI maza - tada tai pasakymas apie
  //    busima pardavima, ne apie automobili.
  const dalis = kuroDalis(r, c.kuras);
  if (dalis != null && dalis <= RIBOS.kuroMazuma) {
    out.push(punktas(LYGIS.SIGNALAS, 'KURAS',
      'Lietuvoje tik ' + dalis + ' % šio modelio yra ' + String(c.kuras).toLowerCase()
      + ' – siauresnis pirkėjų ratas perparduodant'));
  }

  // 6. BŪKLĖ TA (A-34 §10.2) · tik 🟡, tik toje pačioje amžiaus juostoje,
  //    0-3 m. NE (ten beveik vien įvežti - importo ženklas, ne būklė).
  if (ta && TA_BAZE && amzius != null && amzius >= 4) {
    const bj = juostaIs(ta.neislaike_juostos, amzius, RIBOS.buklesMinN);
    const bz = bj && TA_BAZE[bj.raktas];
    if (bj && bz && (bj.v[1] - bz[1]) >= RIBOS.buklesPP) {
      out.push(punktas(LYGIS.SIGNALAS, 'BŪKLĖ',
        'Šio amžiaus (' + bj.nuo + '–' + bj.iki + ' m.) ' + graziVardas(ta.modelis) + ' pirmos techninės apžiūros Lietuvoje neišlaiko '
        + proc1(bj.v[1]) + ' % – daugiau nei vidutiniškai (' + proc1(bz[1]) + ' %). '
        + taSaltinis()));
    }
  }

  // 7. IMPORTO TENDENCIJA (A-34 §10.3) · Regitra imp_men, 🟢 faktas, be prognozės.
  if (r && Array.isArray(r.imp_men) && r.imp_men.length >= 36) {
    const a0 = r.imp_men.slice(0, 12).reduce((x, y) => x + y, 0);
    const a1 = r.imp_men.slice(-12).reduce((x, y) => x + y, 0);
    if (a1 >= RIBOS.importoMinA1 && a0 > 0) {
      const pok = Math.round((a1 - a0) / a0 * 100);
      if (pok >= RIBOS.importoAugo || pok <= RIBOS.importoKrito) {
        out.push(punktas(LYGIS.PATVIRTINTA, 'IMPORTAS',
          'Įvežimas į Lietuvą per 3 metus ' + (pok > 0 ? 'išaugo ' : 'sumažėjo ') + Math.abs(pok) + ' % ('
          + sk(Math.round(a0 / 12)) + ' → ' + sk(Math.round(a1 / 12)) + ' per mėn.)'));
      }
    }
  }

  return out.filter(Boolean);
}

module.exports = {
  ikelti, kontekstas, punktai,
  baziniModelis, markeNorm, paruosti, tikrintiTeksta, kuroRaktas, kuroDalis, amziausJuosta,
  RIBOS, LYGIS, DRAUDZIAMA, KURO_KILMININKAS,
  meta: () => META,
  taMeta: () => TA_META, taKontekstas,
};
