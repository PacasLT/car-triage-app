// mobilede.js — mobile.de (Vokietija) paieškos adresas ir skelbimų skaitymas.
//
// BŪSENA: BANDYMAS. Į bendrą paiešką dar neįjungta — tik /admin/pavyzdys.
//
// Kas pamatuota 2026-09-21 tikroje naršyklėje (Luko kompiuteris, ne ScraperAPI):
//   - Tiesioginė užklausa be naršyklės (PowerShell) → 403 (Akamai).
//   - Puslapis ateina iš serverio (Next.js RSC) — skelbimai yra HTML'e kaip
//     JSON `searchResults`, JavaScript vykdyti NEREIKIA (render nebūtinas).
//   - 20 skelbimų puslapyje + iki 4 reklaminių (topOfPage / topInCategory).
//   - GRIEŽTA RIBA: 100 puslapių = 2000 skelbimų vienai paieškai. 101-as
//     puslapis grąžina 0. Didesnėms paieškoms reikia skaidyti (modelis, kaina).
//   - `ms` galioja tik PIRMAS: dvi markės ar du modeliai vienoje užklausoje
//     neveikia (antrasis tyliai ignoruojamas).
//   - Nežinomas parametras (pvz. ft=HYBRID_PLUGIN) tyliai ignoruojamas —
//     rezultatų skaičius nesikeičia. Todėl testuose tikrinam SKAIČIŲ, ne 200.
//
// Parametrai (patikrinti, BMW nuo 2019, visi rezultatų skaičiai tos dienos):
//   ms=3500            BMW                         71 108
//   ms=3500;49         BMW X5 (modelis)             4 467
//   ms=3500;;21        BMW 3 serija (grupė)         9 285
//   fr=2019:           pirma registracija nuo 2019
//   ft=DIESEL          29 478   ft=HYBRID_DIESEL 2 295   abu kartu 31 773 (suma ✔)
//   ft=PETROL 27 467 · ft=HYBRID 7 116 · ft=ELECTRICITY 4 627 · ft=LPG 1
//   tr=AUTOMATIC_GEAR 68 178 · tr=SEMIAUTOMATIC_GEAR 74 · abu 68 252 (suma ✔)
//   ml=:150000 rida iki · p=:30000 kaina iki · pageNumber=N · dam=false be daužtų

'use strict';

const MOBILEDE_MARKES = {
  'Abarth': 140, 'Alfa Romeo': 900, 'ALPINA': 1100, 'Aston Martin': 1700, 'Audi': 1900,
  'Bentley': 3100, 'BMW': 3500, 'BYD': 31953, 'Cadillac': 4700, 'Chevrolet': 5600,
  'Chrysler': 5700, 'Citroën': 5900, 'Citroen': 5900, 'Cupra': 3, 'Dacia': 6600,
  'Dodge': 7700, 'DS Automobiles': 235, 'Ferrari': 8600, 'Fiat': 8800, 'Ford': 9000,
  'Genesis': 270, 'Honda': 11000, 'Hyundai': 11600, 'Infiniti': 11650, 'Iveco': 12100,
  'Jaguar': 12400, 'Jeep': 12600, 'Kia': 13200, 'Lamborghini': 14600, 'Lancia': 14700,
  'Land Rover': 14800, 'Lexus': 15200, 'Lynk&Co': 31934, 'Maserati': 16600, 'Mazda': 16800,
  'Mercedes-Benz': 17200, 'Mercedes': 17200, 'MG': 17300, 'MINI': 17500, 'Mitsubishi': 17700,
  'Nissan': 18700, 'Opel': 19000, 'Peugeot': 19300, 'Polestar': 4, 'Porsche': 20100,
  'Renault': 20700, 'Rolls-Royce': 21600, 'Saab': 21800, 'Seat': 22500, 'Skoda': 22900,
  'Smart': 23000, 'Ssangyong': 23100, 'Subaru': 23500, 'Suzuki': 23600, 'Tesla': 135,
  'Toyota': 24100, 'Volkswagen': 25200, 'VW': 25200, 'Volvo': 25100,
};

// Modelių ID — iš /consumer/api/search/reference-data/models/<markė> (2026-09-21).
// `grupes` naudojamos per `ms=<markė>;;<grupė>`, `modeliai` per `ms=<markė>;<modelis>`.
// Tos pačios markės grupių ir modelių numeriai gali sutapti (Mercedes A-Class
// grupė 4 ir modelis A 160 = 4) — todėl laikomi atskirai.
const MOBILEDE_MODELIAI = {
  BMW: {
    grupes: { '1': 20, '2': 55, '3': 21, '4': 53, '5': 22, '6': 23, '7': 24, M: 25, X: 26, Z: 27 },
    modeliai: {
      '116': 2, '118': 3, '120': 4, '218': 90, '220': 84, '318': 9, '320': 10, '330': 15, '340': 118,
      '420': 80, '430': 83, '440': 120, '520': 17, '530': 22, '540': 24, '630': 28, '640': 68,
      '730': 35, '740': 38, '750': 40, '840': 42,
      i3: 79, i4: 330, i5: 341, i7: 336, i8: 89, iX: 331, iX1: 337, iX2: 346, iX3: 329,
      M2: 117, M3: 45, M4: 93, M5: 46, M8: 154, M340d: 342, M340i: 152, M550: 86,
      X1: 6, X2: 129, X3: 48, 'X3 M': 145, X4: 92, 'X4 M': 146, X5: 49, 'X5 M': 53, X6: 60,
      'X6 M': 62, X7: 143, XM: 338, Z4: 52,
    },
  },
  Audi: {
    grupes: {},
    modeliai: {
      A1: 25, A3: 8, A4: 9, 'A4 Allroad': 33, A5: 31, A6: 10, 'A6 Allroad': 12, 'A6 e-tron': 66,
      A7: 34, A8: 11, 'e-tron': 50, 'e-tron GT': 58, Q2: 45, Q3: 37, 'Q4 e-tron': 61, Q5: 32,
      'Q6 e-tron': 63, Q7: 15, Q8: 46, 'Q8 e-tron': 65, R8: 29, RS3: 36, RS4: 27, RS5: 17,
      RS6: 28, RS7: 40, RSQ3: 41, RSQ8: 55, S3: 19, S4: 20, S5: 30, S6: 21, S7: 38, S8: 22,
      SQ5: 39, SQ7: 44, SQ8: 54, TT: 23,
    },
  },
  Volkswagen: {
    grupes: { Golf: 29, Passat: 37 },
    modeliai: {
      Amarok: 5, Arteon: 64, Caddy: 9, Crafter: 3, Golf: 14, 'Golf Sportsvan': 40,
      'ID.3': 81, 'ID.4': 82, 'ID.5': 93, 'ID.7': 97, 'ID. Buzz': 94, Passat: 25,
      'Passat Variant': 63, Polo: 27, Sharan: 30, Taigo: 86, 'T-Cross': 75, Tiguan: 54,
      'Tiguan Allspace': 66, Touareg: 36, Touran: 37, 'T-Roc': 65, 'up!': 11,
    },
  },
  'Mercedes-Benz': {
    grupes: { A: 4, B: 5, C: 6, CLA: 45, CLS: 10, E: 11, G: 12, GLA: 54, GLB: 66, GLC: 59,
      GLE: 58, GLS: 60, S: 16, V: 19 },
    modeliai: { EQA: 346, EQB: 350, EQC: 322, EQE: 352, 'EQE SUV': 358, EQS: 351, 'EQS SUV': 359,
      Sprinter: 116, Vito: 125 },
  },
};
MOBILEDE_MODELIAI.VW = MOBILEDE_MODELIAI.Volkswagen;
MOBILEDE_MODELIAI.Mercedes = MOBILEDE_MODELIAI['Mercedes-Benz'];

// Mūsų kuro semantika (ta pati kaip KURO_FILTRAS server.js):
// dyzelis = dyzelinas + dyzelino hibridai; benzinas = benzinas + benzino hibridai
// + dujos; hibridas = visi hibridai; elektra = tik elektra.
const MOBILEDE_KURAS = {
  dyzelis: ['DIESEL', 'HYBRID_DIESEL'],
  benzinas: ['PETROL', 'HYBRID', 'LPG', 'CNG'],
  hibridas: ['HYBRID', 'HYBRID_DIESEL'],
  elektra: ['ELECTRICITY'],
};

// Modelio paieška: tikslus modelis → `;<id>`, serija („3", „X", „3 serija",
// „3er", „X Series") → `;;<grupė>`. Nerastas → null (paieška tik pagal markę,
// ir tai grąžinama kaip `modelisNerastas`, kad kvietėjas žinotų).
function mobileDeModelis(marke, modelis) {
  const m = MOBILEDE_MODELIAI[marke];
  if (!m || !modelis) return null;
  let t = String(modelis).trim();
  const ieskoti = (obj, k) => {
    const raktas = Object.keys(obj).find((x) => x.toLowerCase() === k.toLowerCase());
    return raktas ? obj[raktas] : null;
  };
  const tikslus = ieskoti(m.modeliai, t);
  if (tikslus) return { modelis: tikslus };
  const serija = t.replace(/\s*(serija|series|er|class|klasė|klase|-class)$/i, '').trim();
  const grupe = ieskoti(m.grupes, serija);
  if (grupe) return { grupe };
  return null;
}

// opts.info = true → { url, modelisNerastas } vietoj eilutės.
function buildMobileDeUrl(filters, puslapis, opts) {
  filters = filters || {};
  const params = ['isSearchRequest=true', 's=Car', 'vc=Car', 'dam=false'];
  let modelisNerastas = false;
  const markesId = MOBILEDE_MARKES[filters.marke];
  // v2.4.6: nurodyta, bet nežinoma markė → null. Be `ms` mobile.de grąžintų
  // VISĄ Vokietijos rinką (~1,4 mln.), ir mes mokėtume už svetimus skelbimus.
  if (filters.marke && !markesId) return opts && opts.info ? { url: null, markeNezinoma: true } : null;
  if (markesId) {
    const mod = mobileDeModelis(filters.marke, filters.modelis);
    if (mod && mod.modelis) params.push(`ms=${markesId}%3B${mod.modelis}`);
    else if (mod && mod.grupe) params.push(`ms=${markesId}%3B%3B${mod.grupe}`);
    else { params.push(`ms=${markesId}`); if (filters.modelis) modelisNerastas = true; }
  }
  const nuoIki = (a, b) => `${a || ''}%3A${b || ''}`;
  if (filters.metaiNuo || filters.metaiIki) params.push(`fr=${nuoIki(filters.metaiNuo, filters.metaiIki)}`);
  if (filters.kainaNuo || filters.kainaIki) params.push(`p=${nuoIki(filters.kainaNuo, filters.kainaIki)}`);
  if (filters.ridaIki) params.push(`ml=${nuoIki('', filters.ridaIki)}`);
  (MOBILEDE_KURAS[filters.kuras] || []).forEach((k) => params.push(`ft=${k}`));
  if (filters.pavaru_deze === 'Automatinė') params.push('tr=AUTOMATIC_GEAR', 'tr=SEMIAUTOMATIC_GEAR');
  if (filters.pavaru_deze === 'Mechaninė') params.push('tr=MANUAL_GEAR');
  // v2.5.1 (Z-78): VISADA naujausi viršuje („Inserate (neueste zuerst)",
  // patikrinta portale), kaip kituose portaluose. Numatytasis mobile.de
  // „Standard-Sortierung" yra personalizuotas - serveris ir naršyklė tame
  // pačiame puslapyje matė skirtingus skelbimus (Z-76).
  if (filters.rikiuoti === 'pigiausi') params.push('sb=p', 'od=up');
  else params.push('sb=doc', 'od=down');
  if (puslapis && puslapis > 1) params.push(`pageNumber=${puslapis}`);
  const url = `https://suchen.mobile.de/fahrzeuge/search.html?${params.join('&')}`;
  return opts && opts.info ? { url, modelisNerastas } : url;
}

// ── Skaitymas ──────────────────────────────────────────────────────────────
// Next.js RSC: duomenys eina `<script>self.__next_f.push([1,"..."])</script>`
// gabalais. JSON gali būti perskeltas per kelis gabalus, todėl pirmiausia
// visi gabalai iškoduojami ir sujungiami, tik tada ieškoma `searchResults`.
function mobileDeRsc(html) {
  const re = /<script[^>]*>\s*self\.__next_f\.push\((\[[\s\S]*?\])\)\s*<\/script>/g;
  let m, dalys = [];
  while ((m = re.exec(html))) {
    try { const a = JSON.parse(m[1]); if (a[0] === 1 && typeof a[1] === 'string') dalys.push(a[1]); } catch (e) { /* ne tas */ }
  }
  return dalys.join('');
}

function objektasNuo(tekstas, pradzia) {
  // Skliaustų balansas su kabutėmis ir kaitos simboliais.
  let gylis = 0;
  for (let i = pradzia; i < tekstas.length; i++) {
    const c = tekstas[i];
    if (c === '"') { i++; while (i < tekstas.length && tekstas[i] !== '"') { if (tekstas[i] === '\\') i++; i++; } continue; }
    if (c === '{') gylis++;
    else if (c === '}') { gylis--; if (gylis === 0) return tekstas.slice(pradzia, i + 1); }
  }
  return null;
}

function mobileDePaieska(html) {
  if (!html || typeof html !== 'string') return null;
  const rsc = mobileDeRsc(html);
  const zyme = '"searchResults":{';
  const i = rsc.indexOf(zyme);
  if (i < 0) return null;
  const txt = objektasNuo(rsc, i + zyme.length - 1);
  if (!txt) return null;
  try { return JSON.parse(txt); } catch (e) { return null; }
}

const MD_KURAS = {
  'Benzin': 'Benzinas', 'Diesel': 'Dyzelinas', 'Elektro': 'Elektra',
  'Hybrid (Benzin/Elektro)': 'Benzinas / elektra', 'Hybrid (Diesel/Elektro)': 'Dyzelinas / elektra',
  'Autogas (LPG)': 'Benzinas / dujos', 'Erdgas (CNG)': 'Benzinas / dujos',
};
const MD_DEZE = { 'Automatik': 'Automatinė', 'Halbautomatik': 'Automatinė', 'Schaltgetriebe': 'Mechaninė' };
const REKLAMA = { topOfPage: true, topInCategory: true };

const skaicius = (s) => {
  if (s === undefined || s === null) return null;
  const d = String(s).replace(/[^\d]/g, '');
  return d ? parseInt(d, 10) : null;
};

function mobileDeSkelbimas(item) {
  const a = item.attr || {};
  const make = (item.make && item.make.localized) || '';
  const model = (item.model && item.model.localized) || '';
  const frM = String(a.fr || '').match(/(\d{4})/);
  const metai = frM ? parseInt(frM[1], 10) : (a.yc ? parseInt(a.yc, 10) : null);
  const kwM = String(a.pw || '').match(/(\d+)\s*kW/);
  const cc = skaicius(a.cc);
  const kaina = item.price && item.price.grs && typeof item.price.grs.amount === 'number'
    ? Math.round(item.price.grs.amount) : null;
  const naujas = !!item.isConditionNew || a.con === 'Neuwagen';
  const kontaktas = item.contact || {};
  return {
    kaina, kainaBaze: null, pvmPastaba: null, kainaBePvm: null,
    turiLizingoOpcija: !!item.leasingRate,
    lizingoSuma: item.leasingRate && item.leasingRate.netRate ? Math.round(item.leasingRate.netRate) : null,
    rida: skaicius(a.ml),
    metai,
    modelis: `${make} ${model}`.trim(),
    galimiDefektai: [],
    kuras: MD_KURAS[a.ft] || a.ft || null,
    pavarai: MD_DEZE[a.tr] || null,
    turiVin: false, galimasJavImportas: false, turiIstorijosAtaskaita: false,
    turiGarantija: false, garantijosTipas: null,
    yraVerslas: kontaktas.enumType === 'DEALER',
    pardavejas: null,
    galia: kwM ? parseInt(kwM[1], 10) : null,
    variklioTuris: cc ? Math.round(cc / 100) / 10 : null,
    reitingas: kontaktas.rating ? kontaktas.rating.score : null,
    atsiliepimuSkaicius: kontaktas.rating ? kontaktas.rating.count : null,
    miestas: a.loc || null,
    salis: a.cn || null,
    naujas,
    reklama: !!REKLAMA[item.type],
    skelbimoTipas: item.type || null,
    portaloKainosVertinimas: (item.priceRating && item.priceRating.rating) || null,
    kategorija: item.category || null,
    rawText: `${make} ${model} ${item.category || ''}`.trim().slice(0, 200),
    url: item.id ? `https://suchen.mobile.de/fahrzeuge/details.html?id=${item.id}` : null,
    photo: null, photos: [],
  };
}

// Grąžina { viso, puslapis, skelbimai, reklamu }. Reklaminiai (topOfPage,
// topInCategory) į `skelbimai` NEįeina: jie kartojasi kituose puslapiuose ir
// nepaklūsta rikiavimui. Paryškinti (eyecatcher) - tikri paieškos rezultatai.
function extractMobileDe(html) {
  const sr = mobileDePaieska(html);
  if (!sr) return { viso: null, puslapis: null, skelbimai: [], reklamu: 0, rasta: false };
  const visi = (sr.listings || []).map(mobileDeSkelbimas);
  const skelbimai = visi.filter((l) => !l.reklama && l.url && l.kaina);
  return {
    viso: typeof sr.numResultsTotal === 'number' ? sr.numResultsTotal : null,
    puslapis: sr.pageNumber || null,
    skelbimai,
    reklamu: visi.length - visi.filter((l) => !l.reklama).length,
    rasta: true,
  };
}

const MOBILEDE_PUSLAPIU_RIBA = 100;   // 100 x 20 = 2000 - daugiau portalas neduoda

module.exports = {
  MOBILEDE_MARKES, MOBILEDE_MODELIAI, MOBILEDE_KURAS, MOBILEDE_PUSLAPIU_RIBA,
  buildMobileDeUrl, mobileDeModelis, extractMobileDe, mobileDePaieska, mobileDeSkelbimas,
};

// ── Skelbimo puslapis (v2.4.7) ─────────────────────────────────────────────
// Pamatuota 2026-09-21 tikroje naršyklėje (details.html?id=461901295):
// RSC eilutėje `"eventScope":"page-vip","listing":{...}` - attributes[]
// (tag/label/value), features[] (įranga), images[] (uri be https), contact
// (pardavėjas, reitingas, adresas, koordinatės), priceRating.thresholdLabels
// (mobile.de kainų ribos), created (unix s), htmlDescription: "$41" - nuoroda į
// atskirą RSC gabalą `41:T<hex baitų ilgis>,<html>`.
//
// Be naršyklės (fetch) tas pats adresas grąžina 2,5 KB JS iššūkį - jį
// atpažįstam kaip `rasta:false`, ne kaip tuščią skelbimą.

function rscTekstas(rsc, nuoroda) {
  // "$41" → ieškom eilutės pradžios "41:T<hex>,"; ilgis - UTF-8 BAITAIS.
  const m = /^\$([0-9a-z]+)$/i.exec(String(nuoroda || ''));
  if (!m) return typeof nuoroda === 'string' ? nuoroda : null;
  const re = new RegExp('(?:^|\\n)' + m[1] + ':T([0-9a-f]+),');
  const r = re.exec(rsc);
  if (!r) return null;
  const pradzia = r.index + r[0].length;
  const baitu = parseInt(r[1], 16);
  const buf = Buffer.from(rsc.slice(pradzia, pradzia + baitu + 16), 'utf8');
  return buf.slice(0, baitu).toString('utf8');
}

function htmlITeksta(h) {
  if (!h) return '';
  return String(h)
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(li|p|div|ul)>/gi, '\n').replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const nuotrauka = (uri) => (uri ? (uri.startsWith('http') ? uri : 'https://' + uri) + '?rule=mo-1024.jpg' : null);

function mobileDeSkelbimoPuslapis(html) {
  if (!html || typeof html !== 'string') return { rasta: false };
  const rsc = mobileDeRsc(html);
  const zyme = '"eventScope":"page-vip","listing":{';
  const i = rsc.indexOf(zyme);
  if (i < 0) return { rasta: false, issukis: html.length < 10000 };
  const txt = objektasNuo(rsc, i + zyme.length - 1);
  let L;
  try { L = JSON.parse(txt); } catch (e) { return { rasta: false }; }

  const parametrai = {};
  (L.attributes || []).forEach((a) => {
    if (!a || !a.label) return;
    parametrai[a.label] = Array.isArray(a.value) ? a.value.join(', ') : String(a.value);
  });
  const pagalTag = {};
  (L.attributes || []).forEach((a) => { if (a && a.tag) pagalTag[a.tag] = Array.isArray(a.value) ? a.value.join(', ') : String(a.value); });

  const c = L.contact || {};
  const privatus = c.enumType === 'PRIVATE' || c.enumType === 'FSBO';
  const vieta = [c.address2, c.country].filter(Boolean).join(', ').replace(/^DE-/, '') || null;
  const aprasymas = htmlITeksta(rscTekstas(rsc, L.htmlDescription));
  const photos = (L.images || []).map((x) => nuotrauka(x && x.uri)).filter(Boolean).slice(0, 15);
  const pr = L.priceRating || {};
  const kainosRibos = (pr.thresholdLabels || []).map((s) => parseInt(String(s).replace(/[^\d]/g, ''), 10)).filter(Number.isFinite);

  return {
    rasta: true,
    id: L.id != null ? String(L.id) : null,
    title: L.title || null,
    kaina: L.price && L.price.grs ? L.price.grs.amount : null,
    parametrai,
    iranga: (L.features || []).length ? [{ skiltis: 'Ausstattung', items: L.features.slice() }] : [],
    aprasymas: aprasymas || null,
    photos,
    photo: photos[0] || null,
    pardavejoInfo: {
      privatus,
      vardas: privatus ? null : (c.name || null),
      lygis: c.rating && c.rating.score != null ? `${c.rating.score}/5 (${c.rating.totalCount || c.rating.count || 0} atsil.)` : null,
      vieta,
      nuo: c.withMobileSince || null,
    },
    vieta,
    koordinates: c.latLong && c.latLong.lat != null ? { lat: c.latLong.lat, lon: c.latLong.lon } : null,
    ikelta: L.created ? new Date(L.created * 1000).toISOString() : null,
    atnaujinta: L.renewed ? new Date(L.renewed * 1000).toISOString() : null,
    kainosVertinimas: pr.rating || null,
    kainosRibos,
    busena: pagalTag.damageCondition || null,          // „Gebrauchtfahrzeug" / „Unfallfahrzeug" ...
    tu: pagalTag.hu || null,                             // HU (TA) - „Neu" arba mėn./metai
    kba: L.kba || null,
    carfax: !!L.carfaxEligible,
  };
}

// Tekstas AI analizei - ta pati forma kaip scrapeSingleListing kitiems portalams.
function mobileDeAnalizesTekstas(p) {
  if (!p || !p.rasta) return '';
  const par = Object.entries(p.parametrai).map(([k, v]) => `${k}: ${v}`).join('; ');
  const ir = p.iranga.length ? p.iranga[0].items.join(', ') : '';
  const pard = p.pardavejoInfo;
  return [
    par ? `[TECHNINIAI DUOMENYS IŠ SKELBIMO LENTELĖS (mobile.de, vokiškai)]: ${par}` : '',
    ir ? `[ĮRANGA IR KOMPLEKTACIJA (pilnas sąrašas iš skelbimo)]: ${ir}` : '',
    p.vieta ? `[AUTOMOBILIO VIETA]: ${p.vieta}` : '',
    `[PARDAVĖJAS]: ${pard.privatus ? 'privatus asmuo' : (pard.vardas || 'nenurodytas')}${pard.lygis ? ' (' + pard.lygis + ')' : ''}${pard.nuo ? ', ' + pard.nuo : ''}`,
    p.kainosRibos.length ? `[MOBILE.DE KAINŲ RIBOS ŠIAM AUTOMOBILIUI]: ${p.kainosRibos.join(' / ')} € (vertinimas: ${p.kainosVertinimas || '-'})` : '',
    p.ikelta ? `[SKELBIMAS ĮKELTAS]: ${p.ikelta.slice(0, 10)}` : '',
    p.aprasymas ? `[PARDAVĖJO APRAŠYMAS]: ${p.aprasymas}` : '',
  ].filter(Boolean).join('\n\n');
}

module.exports.mobileDeSkelbimoPuslapis = mobileDeSkelbimoPuslapis;
module.exports.mobileDeAnalizesTekstas = mobileDeAnalizesTekstas;
module.exports.rscTekstas = rscTekstas;
