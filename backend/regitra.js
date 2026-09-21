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

const MARKES = {
  'VOLKSWAGEN. VW': 'VW', 'VOLKSWAGEN': 'VW',
  'MERCEDES-BENZ': 'MERCEDES', 'MERCEDES BENZ': 'MERCEDES',
  'LAND-ROVER': 'LAND ROVER',
};

// ─────────────────────────────────────────────────────────────────────────────
// SVARBU: `markeNorm` ir `baziniModelis` turi ATITIKTI
// `tools/regitra-suvestine.py` funkcijas `marke_norm()` ir `modelis_dalys()`.
// Taisant vieną - taisyti abi. Įrankio v2 normalizavimo nekeitė, tad pora
// tebesutampa; `testai/regitra.test.js` tikrina raktus prieš TIKRUS duomenis.
// ─────────────────────────────────────────────────────────────────────────────
function markeNorm(mk) {
  const m = String(mk == null ? '' : mk).trim().toUpperCase();
  return MARKES[m] || m.replace(/\./g, ' ').trim();
}

function baziniModelis(marke, modelis) {
  const mkn = markeNorm(marke);
  const mkZodziai = new Set(mkn.split(/\s+/));
  const dal = String(modelis == null ? '' : modelis).trim().toUpperCase()
    .replace(/\./g, ' ')
    .split(/[\s,/]+/).filter(Boolean);
  while (dal.length && mkZodziai.has(dal[0])) dal.shift();
  if (!dal.length) return null;
  return mkn + ' ' + dal[0];
}

let LENT = new Map();
let META = null;

function ikelti() {
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
function amziausJuosta(r, amzius) {
  if (!r || amzius == null) return null;
  for (const k of Object.keys(r.kmmet_juostos || {})) {
    const [nuo, iki] = k.split('-').map(Number);
    if (amzius >= nuo && amzius <= iki) {
      return { raktas: k, v: r.kmmet_juostos[k], pavadinimas: nuo + '–' + iki + ' metų' };
    }
  }
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
  const juosta = amziausJuosta(r, amzius);

  if (!amzius || amzius < 1 || !rida) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Nepakanka duomenų palyginti (reikia metų ir ridos)'));
  } else if (!juosta) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Registre per mažai tokio amžiaus šio modelio automobilių su rida, kad būtų su kuo palyginti'));
  } else {
    const kmMet = rida / amzius;
    const [n, p10, , p50] = juosta.v;   // [n, P10, P25, P50, P75, P90]
    if (kmMet < p10) {
      out.push(punktas(LYGIS.SIGNALAS, 'RIDOS NORMA',
        sk(Math.round(kmMet)) + ' km per metus – patenka tarp 10 % mažiausiai '
        + 'važiavusių ' + juosta.pavadinimas + ' šio modelio automobilių Lietuvoje ('
        + sk(n) + ' registracijų, mediana ' + sk(p50) + ' km/metus). '
        + 'Paklauskite pardavėjo dėl serviso istorijos.'));
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

  return out.filter(Boolean);
}

module.exports = {
  ikelti, kontekstas, punktai,
  baziniModelis, markeNorm, paruosti, tikrintiTeksta, kuroRaktas, kuroDalis, amziausJuosta,
  RIBOS, LYGIS, DRAUDZIAMA,
  meta: () => META,
};
