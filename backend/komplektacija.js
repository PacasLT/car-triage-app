// komplektacija.js — gamyklinės komplektacijos (build sheet) sulyginimas (v1.26.0).
//
// KODĖL: mūsų vizualinis standartas draudžia iš nuotraukos teigti, kad įranga yra
// gamyklinė. Vienintelis šaltinis, kuris tai pasako, yra gamyklinis komplektacijos
// sąrašas pagal VIN. Automatiškai jo neimame (pvz. mdecoder.com robots.txt draudžia
// /decode/), todėl darome kitaip: nuvedame vartotoją į dekoderį, o jis įklijuoja
// sąrašą atgal pas mus. Toliau viską daro šis modulis - be AI, be kreditų.
//
// Rezultatas turi TRIS aiškias grupes:
//   patvirtinta   - yra ir gamykliniame sąraše, ir skelbime  → 🟢
//   tikGamykloje  - gamykloje yra, skelbime nepaminėta       → derybų argumentas
//   tikSkelbime   - skelbime deklaruota, gamykloje nerasta   → klausimas pardavėjui

// ── Dekoderiai pagal markę ────────────────────────────────────────────────
// `deepLink` naudojam TIK ten, kur patikrinta, kad VIN priimamas URL adrese.
// Kitur atidarom dekoderio puslapį, o VIN vartotojas įklijuoja pats.
const DEKODERIAI = [
  {
    markes: ['BMW', 'MINI', 'Rolls-Royce'],
    wmi: ['WBA', 'WBS', 'WBX', 'WBY', 'WBV', '4US', '5UX', '5YM', '5UM', 'WMW', 'WMZ', 'SCA', 'SCB'],
    pavadinimas: '///M Decoder',
    url: 'https://www.mdecoder.com/',
    deepLink: 'https://www.mdecoder.com/decode/{VIN}',
    duoda: 'gamyklinius SA kodus, spalvą, saloną, gamybos datą',
  },
  {
    markes: ['Mercedes-Benz', 'Mercedes', 'AMG', 'Smart'],
    wmi: ['WDB', 'WDC', 'WDD', 'W1K', 'W1N', 'W1V', 'WMX', '4JG', 'WME', 'WMB'],
    pavadinimas: 'MBDecoder',
    url: 'https://www.mbdecoder.com/',
    duoda: 'gamyklinę kortelę (Datacard): kodus, pakuotes, spalvą',
  },
  {
    markes: ['Volkswagen', 'Audi', 'Škoda', 'Skoda', 'SEAT', 'Cupra'],
    wmi: ['WVW', 'WV1', 'WV2', 'WVG', '1VW', '3VW', 'WAU', 'WA1', 'WUA', 'TRU', 'TMB', 'TMP', 'VSS', 'VSX', 'LSV'],
    pavadinimas: 'Auto.vin / Check-Your-Spec',
    url: 'https://www.auto.vin/en/supported-brands/volkswagen/option-code-decoder',
    duoda: 'PR kodus (gamyklinės opcijos)',
  },
  {
    markes: ['Porsche', 'Land Rover', 'Range Rover', 'Jaguar'],
    wmi: ['WP0', 'WP1', 'SAL', 'SAJ', 'SAD'],
    pavadinimas: 'VIN Analytics',
    url: 'https://vinanalytics.com/advanced-vin-decoder/',
    duoda: 'gamyklinį build sheet ir langų lipduką',
  },
];

// Universalus variantas markėms, kurioms atskiro dekoderio neturime.
const ATSARGINIS = {
  pavadinimas: '7zap (OEM katalogai pagal VIN)',
  url: 'https://7zap.com/en/vin-decoder/',
  duoda: 'gamyklinius duomenis iš OEM katalogo (apimtis priklauso nuo markės)',
  universalus: true,
};

function dekoderisPagalVin(vin, gamintojas) {
  const v = String(vin || '').toUpperCase();
  const wmi = v.slice(0, 3);
  const g = String(gamintojas || '').toLowerCase();
  const rastas = DEKODERIAI.find((d) =>
    (wmi && d.wmi.indexOf(wmi) !== -1) || (g && d.markes.some((m) => g.indexOf(m.toLowerCase()) !== -1)));
  const d = rastas || ATSARGINIS;
  const out = {
    pavadinimas: d.pavadinimas, url: d.url, duoda: d.duoda,
    universalus: !!d.universalus,
    // Kodėl ne automatiškai: svetainės to neleidžia arba negarantuoja - sąžiningai pasakom.
    pastaba: 'Sąrašą atidarysite patys – šių svetainių duomenų automatiškai neimame. Įklijuokite jį atgal ir sulyginsime su skelbimu.',
  };
  if (d.deepLink && /^[A-HJ-NPR-Z0-9]{17}$/.test(v)) out.nuoroda = d.deepLink.replace('{VIN}', v);
  else out.nuoroda = d.url;
  return out;
}

// ── Build sheet tekstas → kodai ir pavadinimai ───────────────────────────
// Formatai skiriasi: BMW „S337A Sportinis paketas M“, VAG „PR-Nr. 1BA“,
// Mercedes „P44 AMG Line“. Todėl imam pirmą tokeną kaip kodą, likutį - kaip pavadinimą.
const KODO_RE = /^(?:PR[-\s]?Nr\.?\s*)?([A-Z]?\d{2,4}[A-Z]?|[A-Z]\d[A-Z0-9]{1,2}|[0-9A-Z]{3})\b[\s.:\-–—]*(.*)$/i;

function parseBuildSheet(tekstas) {
  const eilutes = String(tekstas || '')
    .replace(/\r/g, '')
    .split(/\n|;|•|\s{4,}/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && x.length < 160);
  const out = [];
  const matyti = new Set();
  eilutes.forEach((eil) => {
    // antraštės ir šiukšlės
    if (/^(vin|model|modelis|serija|series|spalva|colou?r|data|date|gamykla|plant|variklis|engine)\b.{0,20}:?$/i.test(eil)) return;
    const m = eil.match(KODO_RE);
    let kodas = null, pavadinimas = eil;
    if (m && m[2] && m[2].trim().length > 2) { kodas = m[1].toUpperCase(); pavadinimas = m[2].trim(); }
    else if (m && (!m[2] || m[2].trim().length <= 2) && m[1].length >= 3 && /\d/.test(m[1])) { kodas = m[1].toUpperCase(); pavadinimas = ''; }
    pavadinimas = pavadinimas.replace(/^[\s.:\-–—]+/, '').trim();
    const raktas = (kodas || '') + '|' + pavadinimas.toLowerCase();
    if (matyti.has(raktas)) return;
    if (!kodas && pavadinimas.length < 3) return;
    matyti.add(raktas);
    if (out.length < 200) out.push({ kodas, pavadinimas });
  });
  return out;
}

// ── Sulyginimas su skelbimu ──────────────────────────────────────────────
const STOP = ['paketas', 'package', 'linija', 'line', 'sistema', 'system', 'komplektas'];

function norm(t) {
  return String(t || '').toLowerCase()
    .replace(/[ąàá]/g, 'a').replace(/[čç]/g, 'c').replace(/[ęėèé]/g, 'e').replace(/[įìí]/g, 'i')
    .replace(/[šş]/g, 's').replace(/[ųūùú]/g, 'u').replace(/[ž]/g, 'z').replace(/[öó]/g, 'o').replace(/[üú]/g, 'u')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function reiksmingiZodziai(t) {
  return norm(t).split(' ').filter((w) => w.length > 3 && STOP.indexOf(w) === -1);
}

function sutampa(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const za = reiksmingiZodziai(a), zb = reiksmingiZodziai(b);
  if (!za.length || !zb.length) return false;
  const maziau = za.length <= zb.length ? za : zb;
  const daugiau = za.length <= zb.length ? nb : na;
  return maziau.every((w) => daugiau.includes(w));
}

function irangosSarasoEilutes(irangosSarasas) {
  const sar = [];
  (irangosSarasas || []).forEach((g) => {
    if (Array.isArray(g)) sar.push.apply(sar, g);
    else if (g && Array.isArray(g.items)) sar.push.apply(sar, g.items);
    else if (typeof g === 'string') sar.push(g);
  });
  return sar.filter(Boolean);
}

function sulyginti(gamykliniai, irangosSarasas, aprasymas) {
  const skelbime = irangosSarasoEilutes(irangosSarasas);
  const apr = norm(aprasymas || '');
  const patvirtinta = [], tikGamykloje = [], tikSkelbime = [];
  const panaudoti = new Set();

  (gamykliniai || []).forEach((g) => {
    const pav = g.pavadinimas || '';
    if (!pav) { tikGamykloje.push(g); return; }
    const idx = skelbime.findIndex((s) => sutampa(pav, s));
    if (idx >= 0) {
      panaudoti.add(idx);
      patvirtinta.push({ kodas: g.kodas, pavadinimas: pav, skelbime: skelbime[idx], saltiniai: ['gamyklinis sąrašas', 'skelbimas'] });
    } else if (apr && reiksmingiZodziai(pav).length && reiksmingiZodziai(pav).every((w) => apr.includes(w))) {
      patvirtinta.push({ kodas: g.kodas, pavadinimas: pav, skelbime: 'pardavėjo aprašyme', saltiniai: ['gamyklinis sąrašas', 'aprašymas'] });
    } else {
      tikGamykloje.push({ kodas: g.kodas, pavadinimas: pav });
    }
  });

  skelbime.forEach((s, i) => {
    if (panaudoti.has(i)) return;
    // Bazinė įranga (ABS, ESP ir pan.) gamykliniuose sąrašuose dažnai nerašoma -
    // tokių nekeliam į įtarimus, kad nebūtų triukšmo.
    if (/\b(abs|esp|asr|esc|isofix|imobiliz|centrinis|servo|oro pagalv|airbag|el\.? lang)/i.test(s)) return;
    tikSkelbime.push({ pavadinimas: s });
  });

  return {
    patvirtinta,
    tikGamykloje,
    tikSkelbime: tikSkelbime.slice(0, 15),
    kiek: {
      gamykloje: (gamykliniai || []).length,
      skelbime: skelbime.length,
      patvirtinta: patvirtinta.length,
      tikGamykloje: tikGamykloje.length,
      tikSkelbime: tikSkelbime.length,
    },
    ispejimai: tikSkelbime.length
      ? [{
          svarba: tikSkelbime.length >= 3 ? 'auksta' : 'vidutine',
          tekstas: tikSkelbime.length + ' skelbime nurodytos įrangos pozicijos gamykliniame sąraše nerastos. '
            + 'Tai gali būti ir kitoks pavadinimas, ir vėliau sumontuota (ne gamyklinė) įranga – paklauskite pardavėjo.',
        }]
      : [],
  };
}

module.exports = { DEKODERIAI, ATSARGINIS, dekoderisPagalVin, parseBuildSheet, sulyginti, sutampa };
