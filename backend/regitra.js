// backend/regitra.js — Lietuvos registro (Regitra) parko suvestinė.
//
// Specifikacija: docs/regitra-panaudojimas.md · Užduotis:
// docs/UZDUOTIS-regitra-integracija.md
//
// 237 KB įkeliami paleidžiant ir laikomi atmintyje. SQLite čia nereikia: tai
// ketvirtinis STATINIS duomuo, keliaujantis su deploy'umi, ne kintanti būsena.
//
// KĄ ŠIS MODULIS DARO IR KO NE:
//   daro  - suveda skelbimo markę ir modelį į bazinį modelį, atiduoda parko
//           suvestinę ir tris žinojimo lygių punktus.
//   NEdaro - nekeičia balo. Nė vienas punktas nepatenka į `computeTriageScore`.
//            Tai kontekstas, o ne įvertis.

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
// Taisant vieną - taisyti abi.
//
// Tai tiksliai ta pati klaidos forma, kaip `ctScore()` ir `diffPct` ženklas:
// viena logika dviejose vietose, kuri tyliai išsiskiria. Skirtumas tas, kad
// čia ji išsiskirtų NEMATOMAI - raktas tiesiog nerastų įrašo, ir vietoj
// skaičių atsirastų ⚪. Todėl `testai/regitra.test.js` tikrina raktus prieš
// TIKRUS duomenis, ne prieš prielaidą.
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
  while (dal.length && mkZodziai.has(dal[0])) dal.shift();   // TOYOTA + TOYOTA RAV4
  if (!dal.length) return null;
  return mkn + ' ' + dal[0];                                  // 'X5 XDRIVE30D' -> 'BMW X5'
}

let LENT = new Map();
let META = null;

function ikelti() {
  try {
    const p = path.join(__dirname, 'duomenys', 'regitra-modeliai.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    LENT = new Map(d.modeliai.map((m) => [m.modelis, m]));
    META = { sugeneruota: d.sugeneruota, modeliu: d.modeliu, saltinis: d.saltinis || null };
    console.log('[REGITRA] ikelta:', d.modeliu, 'modeliu, duomenys', d.sugeneruota);
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
const RIBOS = {
  apyvJudrus: 20,        // >= 20 %  -> 🟢
  apyvLetas: 12,         // <  12 %  -> 🟡   (12-20 % nieko nesako - punkto nera)
  ridosSantykis: 0.6,    // <  0.6   -> 🟡
  ridaMinN: 20,          // maziau registraciju - mediana beprasme
  parkasRetas: 300,      // <  300   -> 🟡
  neleidRiba: 30,        // >  30 %  -> 🟡
};

// ── Uždrausti žodžiai · ta pati taisyklė, kaip nuotraukų analizėje ───────────
// Šie punktai yra KLAUSIMAS PARDAVĖJUI, ne verdiktas. Registro suvestinė
// nežino nieko apie konkretų automobilį - ji žino tik, kas įprasta modeliui.
//
// Sąrašas gyvena KODE, ne tik prompte: tekstus čia rašo ne modelis, o šis
// failas, tad vienintelis būdas jiems atsirasti - kad kas nors juos čia
// įrašytų. `tikrintiTeksta` yra sargas prieš būtent tai.
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

// Lygiai sutampa su sąsajos klasėmis `ct-k-confirmed` / `ct-k-signal` /
// `ct-k-unknown` - tai ta pati žinojimo lygių sistema, ne nauja.
const LYGIS = { PATVIRTINTA: 'confirmed', SIGNALAS: 'signal', NEZINOMA: 'unknown' };

function punktas(lygis, k, tekstas) {
  const bloga = tikrintiTeksta(tekstas);
  if (bloga) {
    // Nemetam klaidos i naudotoja - nutildom punkta ir rekiam i zurnala.
    console.error('[REGITRA] punktas nutildytas (' + bloga + '):', tekstas);
    return null;
  }
  return { lygis, k, tekstas };
}

// ── Trys punktai ─────────────────────────────────────────────────────────────
// `c` - skelbimas: { marke, modelis, metai, rida }.
// Grąžina masyvą punktų arba tuščią masyvą. Balo nekeičia niekada.
function punktai(c) {
  if (!c) return [];
  const r = kontekstas(c.marke, c.modelis);

  // Modelio lentelėje nėra arba jis nuasmenintas (2,61 % M1 įrašų - būtent
  // reti ir brangūs). Vienas ⚪, ne trys tokie patys: kartojimas nieko neprideda.
  if (!r) {
    if (!META) return [];   // duomenys neikelti - tyla, o ne melagingas ⚪
    return [punktas(LYGIS.NEZINOMA, 'LT REGISTRAS',
      'Šio modelio Lietuvos registro suvestinėje nėra – reti modeliai duomenyse nuasmeninami')].filter(Boolean);
  }

  const out = [];

  // 3.1 Likvidumas. 🟢 pagrįstas: tai suskaičiuotas faktas iš 1,88 mln. įrašų.
  if (r.apyv_pct >= RIBOS.apyvJudrus) {
    out.push(punktas(LYGIS.PATVIRTINTA, 'LIKVIDUMAS',
      'LT rinkoje ' + r.apyv_pct + ' % per metus keičia savininką – judrus modelis'));
  } else if (r.apyv_pct < RIBOS.apyvLetas) {
    out.push(punktas(LYGIS.SIGNALAS, 'LIKVIDUMAS',
      'LT rinkoje tik ' + r.apyv_pct + ' % per metus keičia savininką – lėtas pardavimas'));
  }
  // 12-20 % - punkto nėra sąmoningai: intervalas nieko nesako.

  // 3.2 Ridos norma. Amžius - iš PIRMOS REGISTRACIJOS metų (`GAMYBOS_METAI`
  // užpildyta 5 %, todėl jo neimam niekada).
  const metai = parseInt(c.metai, 10);
  const rida = parseFloat(c.rida);
  const amzius = metai ? (new Date().getFullYear() - metai) : null;

  if (!r.kmmet_med || !r.rida_n || r.rida_n < RIBOS.ridaMinN) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Per mažai registracijų su rida, kad mediana ką nors reikštų'));
  } else if (!amzius || amzius < 1 || !rida) {
    out.push(punktas(LYGIS.NEZINOMA, 'RIDOS NORMA',
      'Nepakanka duomenų palyginti (reikia metų ir ridos)'));
  } else {
    const laukiama = r.kmmet_med * amzius;
    const santykis = rida / laukiama;
    if (santykis < RIBOS.ridosSantykis) {
      const proc = Math.round((1 - santykis) * 100);
      out.push(punktas(LYGIS.SIGNALAS, 'RIDOS NORMA',
        'Rida ' + proc + ' % mažesnė nei įprasta šiam modeliui Lietuvoje (mediana '
        + r.kmmet_med.toLocaleString('lt-LT').replace(/,/g, ' ') + ' km/metus, '
        + r.rida_n.toLocaleString('lt-LT').replace(/,/g, ' ') + ' registracijų). '
        + 'Paklauskite pardavėjo dėl serviso istorijos.'));
    }
    // Kitais atvejais punkto nėra: „rida normali" nėra žinia.
  }

  // 3.3 Retumas ir nurašymai.
  if (r.parkas < RIBOS.parkasRetas) {
    out.push(punktas(LYGIS.SIGNALAS, 'RETUMAS',
      'Lietuvoje registruoti tik ' + r.parkas + ' – siauras pirkėjų ratas'));
  }
  if (r.neleid_pct > RIBOS.neleidRiba) {
    out.push(punktas(LYGIS.SIGNALAS, 'NURAŠYMAI',
      r.neleid_pct + ' % šio modelio Lietuvoje nebeleidžiami eisme'));
  }

  return out.filter(Boolean);
}

module.exports = {
  ikelti, kontekstas, punktai,
  baziniModelis, markeNorm, tikrintiTeksta,
  RIBOS, LYGIS, DRAUDZIAMA,
  meta: () => META,
};
