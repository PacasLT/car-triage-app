// backend/modelio-apzvalga.js — „Analizuoti modelį" (v2.16.0).
//
// Luko prašymas 09-24: po paieškos – mygtukas, kuris papasakoja apie PATĮ
// modelį: kartos, tipinės problemos, ką tikrinti, rinkos tendencijos.
//
// PRINCIPAS: skaičiai – mūsų, pasakojimas – AI.
// Viskas, ką galime suskaičiuoti patys (Regitra, techninė apžiūra, mūsų
// sukaupta kainų istorija, paieškos rezultatai), surenkama ČIA ir keliauja į
// atsakymą kaip FAKTAI su šaltiniu. AI gauna tuos pačius skaičius kaip
// kontekstą ir prideda tai, ko mūsų duomenyse nėra: kartas, žinomas gedimų
// vietas, ką tikrinti perkant. Taip skaičius negali „sugalvoti" modelis.
//
// Kodėl atskiras failas: duomenų rinkimas turi būti patikrinamas testu be
// tinklo ir be AI (`modelio-apzvalga.test`).

const METAI_DABAR = () => new Date().getFullYear();

function pr(x) { return x == null ? null : Math.round(x * 10) / 10; }

// ── 1. Mūsų duomenys ────────────────────────────────────────────────────────
// `deps` perduodamas iš server.js (regitra, cache) – kad testas galėtų paduoti
// savo, o modulis neužsikrautų viso serverio.
function surinktiDuomenis(uzklausa, deps) {
  const { marke, modelis } = uzklausa;
  const metaiNuo = parseInt(uzklausa.metaiNuo, 10) || null;
  const metaiIki = parseInt(uzklausa.metaiIki, 10) || null;
  const regitra = deps.regitra, cache = deps.cache;

  const reg = regitra.kontekstas(marke, modelis);
  const ta = regitra.taKontekstas(marke, modelis);
  const kartos = regitra.kartosIntervalui(marke, modelis, metaiNuo || 1990, metaiIki || METAI_DABAR());

  const pilnas = ((marke || '') + ' ' + (modelis || '')).trim();
  const tend = cache.modelioTendencijos ? cache.modelioTendencijos(pilnas) : null;
  const greitis = cache.modelioPardavimoGreitis ? cache.modelioPardavimoGreitis(pilnas) : null;

  const lt = reg ? {
    parkas: reg.parkas,
    variantu: reg.variantu,
    importuota12: reg.imp12,
    importoDalisPct: reg.parkas ? pr((reg.imp12 / reg.parkas) * 100) : null,
    apyvartaPct: reg.apyv_pct,
    taNeleistaPct: reg.neleid_pct,
    taNeleista15Pct: reg.neleid15_pct,
    senuDalisPct: reg.senu_dalis_pct,
    ridaMediana: reg.rida_med,
    kmPerMetusMediana: reg.kmmet_med,
  } : null;

  const taDuom = ta ? { automobiliu: ta.automobiliu, apziuru: ta.apziuru } : null;

  return {
    marke, modelis, metaiNuo, metaiIki,
    kartos,                 // ['G05', 'F15'] – iš mūsų kartų lentelės
    lt,                     // Regitra (CC BY 4.0)
    ta: taDuom,             // techninės apžiūros imtis
    kainuKryptis: tend && tend.kryptis ? tend.kryptis : null,
    kainuMenesiai: tend && tend.menesiai ? tend.menesiai.slice(-6) : null,
    pardavimoGreitis: greitis,
    rinka: uzklausa.rinka || null,   // ką tik rasta paieškoje (iš naršyklės)
    saltiniai: [
      reg ? 'Regitra, Lietuvos transporto priemonių registras (CC BY 4.0)' : null,
      ta ? 'TRANSEKSTA, techninės apžiūros duomenys (CC BY 4.0)' : null,
      tend || greitis ? 'CarTriige sukaupta skelbimų istorija' : null,
    ].filter(Boolean),
  };
}

// ── 2. Promptas ─────────────────────────────────────────────────────────────
// Skaičius duodam paruoštus ir prašom JŲ NEPERSKAIČIUOTI. Viskas, ko mūsų
// duomenyse nėra, turi ateiti iš web paieškos su įvardytu šaltiniu.
function promptas(d) {
  const pav = (d.marke + ' ' + d.modelis).trim();
  const laikotarpis = d.metaiNuo || d.metaiIki
    ? `${d.metaiNuo || '…'}–${d.metaiIki || '…'} m. laidos`
    : 'visos laidos';
  const mus = [];
  if (d.kartos && d.kartos.length) mus.push(`Kartos šiame laikotarpyje: ${d.kartos.join(', ')}.`);
  if (d.lt) {
    mus.push(`Lietuvos registre: ${d.lt.parkas} vnt.; per 12 mėn. importuota ${d.lt.importuota12}`
      + (d.lt.importoDalisPct != null ? ` (${d.lt.importoDalisPct} % parko)` : '')
      + `; savininką per metus keičia ${d.lt.apyvartaPct} %.`);
    mus.push(`Techninės apžiūros neišlaiko ${d.lt.taNeleistaPct} % (15 m. ir senesni – ${d.lt.taNeleista15Pct} %).`);
    mus.push(`Ridos mediana ${d.lt.ridaMediana} km, ${d.lt.kmPerMetusMediana} km per metus.`);
  }
  if (d.kainuKryptis) {
    mus.push(`Mūsų sukauptų skelbimų kainų mediana ${d.kainuKryptis.nuo} → ${d.kainuKryptis.iki}: `
      + `${d.kainuKryptis.nuoKainos} → ${d.kainuKryptis.ikiKainos} € (${d.kainuKryptis.procentai} %, ${d.kainuKryptis.kryptis}).`);
  }
  if (d.pardavimoGreitis) {
    mus.push(`Skelbimas parduodamas per ${d.pardavimoGreitis.medianaDienu} d. (mediana iš ${d.pardavimoGreitis.imtis} parduotų).`);
  }
  if (d.rinka && d.rinka.rasta) {
    mus.push(`Ką tik radome ${d.rinka.rasta} skelbimų`
      + (d.rinka.mediana ? `, kainos mediana ${d.rinka.mediana} €` : '')
      + (d.rinka.nuo && d.rinka.iki ? `, nuo ${d.rinka.nuo} iki ${d.rinka.iki} €` : '') + '.');
  }

  return `Parašyk apžvalgą apie automobilio modelį ${pav} (${laikotarpis}) pirkėjui Lietuvoje.

MŪSŲ DUOMENYS (jau suskaičiuoti – naudok juos, NEPERSKAIČIUOK ir nesugalvok kitų):
${mus.length ? mus.map((x) => '- ' + x).join('\n') : '- (šiam modeliui savo duomenų neturime)'}

Susirask internete tai, ko čia nėra: kartų ir variklių skirtumus (gamintojo ir Wikipedia duomenys),
dažniausias to modelio bėdas ir jų atsiradimo ribas (forumai, servisų puslapiai, atšaukimai),
ką būtina patikrinti perkant, eksploatacijos kaštus Lietuvoje (draudimas, detalės, servisas).
Kiekvienam teiginiui apie gedimus nurodyk, iš kur jis.

Rašyk lietuviškai, dalykiškai, be reklamos. Grąžink TIK JSON (be markdown):
{
  "santrauka": "3–4 sakiniai: kas tai per automobilis ir kam jis tinka",
  "kartos": [{"kodas": "G05", "metai": "2018–", "kas_pasikeite": "trumpai"}],
  "varikliai": [{"variklis": "3.0d", "ka_zinoti": "trumpai, kuo skiriasi patikimumu"}],
  "problemos": [{"kas": "kas genda", "kada": "nuo kokios ridos/metų", "kaina": "apytikslė remonto kaina €", "saltinis": "kur rasta"}],
  "ka_tikrinti": ["konkretūs patikrinimai apžiūros metu"],
  "eksploatacija": "kuras, servisas, detalių prieinamumas Lietuvoje – 2–3 sakiniai",
  "rinka_lt": "2–4 sakiniai apie LT rinką REMIANTIS mūsų duomenimis aukščiau",
  "kam_tinka": "kam šis modelis tinka ir kam ne – 2 sakiniai",
  "saltiniai": ["naudoti interneto šaltiniai"]
}`;
}

module.exports = { surinktiDuomenis, promptas };
