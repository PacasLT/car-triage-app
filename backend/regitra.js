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

function kontekstas(marke, modelis) {
  const k = baziniModelis(marke, modelis);
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

  // Ridos percentilis: zemiau P10 pagal MODELIO PACIOS imties pasiskirstyma.
  ridaMinN: 20,

  parkasRetas: 300,      // < 300    -> 🟡

  // 851 modelis su `senu_n >= 30`: mediana 29,6 %, P75 = 52,5 %.
  // 30 % butu SUVEIKE 49 % MODELIU - tai ne signalas, o moneta.
  neleid15Riba: 50,      // > 50 %   -> 🟡  (232 modeliai, virsutinis ketvirtis)
  senuMinN: 30,
  nurasymuAmzius: 10,    // skelbimo automobiliui turi buti bent tiek metu

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
function punktai(c) {
  if (!c) return [];
  const r = kontekstas(c.marke, c.modelis);

  if (!r) {
    if (!META) return [];   // duomenys neikelti - tyla, o ne melagingas ⚪
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

  // 2. Ridos norma · PERCENTILIS, ne santykis su mediana.
  //
  // Lyginam KM PER METUS su `kmmet_kv`, o NE absoliucia rida su `rida_kv`.
  // Absoliuti rida uzfiksuota registracijos operacijos metu, tad jos
  // pasiskirstyme guli ir ka tik ivezti jauni automobiliai. Pamatuota:
  // visiskai normalus 2-4 metu BMW X5 (mediana 17 323 km/met) patenka ZEMIAU
  // `rida_kv` P10 ir gautu klaidinga 🟡. Su `kmmet_kv` jis atsiduria P50-P75,
  // o tikrai mazai vazines (3 m., 20 000 km) - vis tiek zemiau P10.
  const metai = parseInt(c.metai, 10);
  const rida = parseFloat(c.rida);
  const amzius = metai ? (new Date().getFullYear() - metai) : null;
  const kv = r.kmmet_kv;

  if (!kv || !r.kmmet_n || r.kmmet_n < RIBOS.ridaMinN) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Per mažai registracijų su rida, kad pasiskirstymas ką nors reikštų'));
  } else if (!amzius || amzius < 1 || !rida) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Nepakanka duomenų palyginti (reikia metų ir ridos)'));
  } else {
    const kmMet = rida / amzius;
    if (kmMet < kv[0]) {           // kv = [P10, P25, P50, P75, P90]
      out.push(punktas(LYGIS.SIGNALAS, 'RIDOS NORMA',
        sk(Math.round(kmMet)) + ' km per metus – patenka tarp 10 % mažiausiai '
        + 'važiavusių šio modelio Lietuvoje (' + sk(r.kmmet_n) + ' registracijų, '
        + 'mediana ' + sk(kv[2]) + ' km/metus). Paklauskite pardavėjo dėl serviso istorijos.'));
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
  baziniModelis, markeNorm, tikrintiTeksta, kuroRaktas, kuroDalis,
  RIBOS, LYGIS, DRAUDZIAMA,
  meta: () => META,
};
