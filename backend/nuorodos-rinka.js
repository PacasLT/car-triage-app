// nuorodos-rinka.js — rinkos mediana įklijuotai nuorodai (v2.26.0).
//
// Problema, kurią šis modulis sprendžia (claude/NUORODOS-ANALIZE.md §3):
// `/api/analyze-single` rinkos skaičius iki šiol GAUDAVO iš kortelės – t. y. iš
// prieš tai vykusios paieškos. Įklijavus plikę nuorodą jų nėra, tad analizė
// prarasdavo būtent tą dalį, dėl kurios perpardavėjas ją ir atsidarė: ar kaina
// gera ir už kiek galima pirkti.
//
// Luko sprendimas eilėje buvo variantas C: PIRMA mūsų archyvas (0 kreditų), o
// mini skenavimas – tik jei imtis per maža, ir tik paspaudus. Čia – archyvo
// dalis: `rinka.db` jau turi `portalas`, `marke`, `modelis`, `metai`, `kaina`.
//
// DVI RIBOS, kurių negalima praleisti:
//   1) Mediana skaičiuojama PAGAL RINKĄ (K-72 pamoka): vokiškas automobilis
//      prieš Lietuvos medianą atrodo pigus vien dėl rinkos skirtumo, ne dėl
//      progos. Todėl lyginam su to paties portalo rinka, o Lietuvos medianą
//      laikom ATSKIRAI – ji reikalinga MAX pirkimo kainai.
//   2) Imtis < 5 nėra mediana, o viena kaina su trupmena. Tada nerodom skaičiaus
//      ir pasakom, kad imtis per maža – niekada nerodom netikros nuolaidos.

const { atspariMediana } = require('./rinkos-mediana');
const { rinkaPagalPortala } = require('./rinkos');

// 8, ne 5: tiek pat reikalauja ir skelbimo puslapis (`detail.html`
// CT_RINKOS_MIN = 8, Luko sprendimas AN-0923-RIBA-B). Jei cia butu 5, mediana
// butu suskaiciuota, o puslapis vis tiek rasytu „per mazai duomenu" - ir
// vartotojas matytu dvi skirtingas tiesas viename ekrane.
const MIN_IMTIS = 8;
const METU_LANGAS = 1;        // ±1 metai: 2019 ir 2021 Octavia dar ta pati karta

// ── Markė ir modelis iš skelbimo antraštės ─────────────────────────────────
// Archyve `marke` ir `modelis` yra tokie, kokius įrašė paieška („BMW", „X5"),
// o antraštė atrodo kaip „BMW X5 xDrive30d, 2018, 3.0 l dyzelinas". Todėl
// renkam ILGIAUSIĄ atitikmenį iš žinomo katalogo: „Land Rover" prieš „Land",
// „A4 Allroad" prieš „A4". Nežinomo nespėliojam – geriau neatpažinti, nei
// palyginti su kito modelio kainomis.
// Kaip zmones ir portalai rasо markes kitaip, nei jos vadinasi kataloge.
// Trumpas sarasas: tik tai, ka tikrai matom skelbimu antrastese.
const ALIASAI = {
  'vw': 'Volkswagen', 'volkswagen': 'Volkswagen',
  'merc': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz', 'mercedes benz': 'Mercedes-Benz',
  'range rover': 'Land Rover', 'landrover': 'Land Rover',
  'skoda': 'Skoda', 'škoda': 'Skoda',
  'citroen': 'Citroen', 'citroën': 'Citroen',
  'alfa romeo': 'Alfa Romeo', 'ds': 'DS',
};

function atpazinti(antraste, katalogas) {
  const t = ' ' + String(antraste || '').toLowerCase().replace(/[^a-z0-9ąčęėįšųūž ]+/gi, ' ').replace(/\s+/g, ' ') + ' ';
  const k = katalogas || {};
  let marke = null;
  Object.keys(k).forEach((m) => {
    if (t.indexOf(' ' + m.toLowerCase() + ' ') !== -1 && (!marke || m.length > marke.length)) marke = m;
  });
  if (!marke) {
    // Alias ieskom tik tada, kai tikro vardo nera - „Mercedes-Benz" nugali „mercedes".
    let rastas = null;
    Object.keys(ALIASAI).forEach((a) => {
      if (t.indexOf(' ' + a + ' ') !== -1 && (!rastas || a.length > rastas.length)) rastas = a;
    });
    if (rastas && k[ALIASAI[rastas]]) marke = ALIASAI[rastas];
  }
  if (!marke) return { marke: null, modelis: null };
  let modelis = null;
  (k[marke] || []).forEach((m) => {
    if (t.indexOf(' ' + String(m).toLowerCase() + ' ') !== -1 && (!modelis || String(m).length > String(modelis).length)) modelis = m;
  });
  return { marke, modelis };
}

// ── Kontekstas iš archyvo eilučių ──────────────────────────────────────────
// `eilutes` – [{ portalas, kaina, metai }]. Filtravimą pagal metus darom čia,
// kad SQL liktų paprastas, o taisyklė – matuojama sargu.
function kontekstas(eilutes, opts) {
  const o = opts || {};
  const rinka = o.rinka || null;
  const metai = Number.isFinite(o.metai) ? o.metai : null;
  const langas = Number.isFinite(o.metuLangas) ? o.metuLangas : METU_LANGAS;

  const tinka = (e) => e && Number.isFinite(e.kaina)
    && (metai == null || !Number.isFinite(e.metai) || Math.abs(e.metai - metai) <= langas);

  const pagalRinka = {};
  (eilutes || []).filter(tinka).forEach((e) => {
    const r = e.rinka || rinkaPagalPortala(e.portalas);
    if (!r) return;
    (pagalRinka[r] = pagalRinka[r] || []).push(e.kaina);
  });

  const skaiciuok = (sar) => {
    const m = atspariMediana(sar || []);
    return (m.count >= MIN_IMTIS) ? m : { median: null, count: m.count, atmesta: m.atmesta };
  };

  const sava = rinka ? skaiciuok(pagalRinka[rinka]) : { median: null, count: 0 };
  const lt = skaiciuok(pagalRinka.LT);
  const kaina = Number.isFinite(o.kaina) ? o.kaina : null;

  return {
    saltinis: 'archyvas',
    rinka,
    median: sava.median,
    count: sava.count,
    // Lietuvos mediana atskirai: MAX pirkimo kaina remiasi TIK ja (v2.20.0).
    ltMediana: lt.median,
    ltCount: lt.count,
    diffPct: (sava.median && kaina) ? Math.round(((sava.median - kaina) / sava.median) * 100) : null,
    patikima: sava.median != null,
    // Kiek radom iš viso – kad galėtume pasakyti „radom 3, reikia 5", o ne tylėti.
    rastaPagalRinkas: Object.keys(pagalRinka).reduce((a, r) => (a[r] = pagalRinka[r].length, a), {}),
    minImtis: MIN_IMTIS,
  };
}

// Vienas sakinys žmogui. Niekada nesako „nėra duomenų" – sako, kiek radom.
function zinute(k) {
  if (!k) return null;
  if (k.patikima) return null;
  const viso = Object.keys(k.rastaPagalRinkas || {}).reduce((s, r) => s + k.rastaPagalRinkas[r], 0);
  if (!viso) return 'Šio modelio mūsų archyve dar neturim – rinkos kainos neskaičiuojam.';
  const savoj = (k.rastaPagalRinkas || {})[k.rinka] || 0;
  return 'Archyve radom ' + savoj + ' panaš' + (savoj === 1 ? 'ų' : 'ius') + ' skelbim'
    + (savoj === 1 ? 'ą' : 'us') + ' šioje rinkoje, o patikimai medianai reikia ' + k.minImtis
    + '. Rinkos kainos nerodom, kad nerodytume netikros nuolaidos.';
}

// ── Kaina ir metai is skelbimo puslapio teksto ─────────────────────────────
// Paieskoje kaina ateina is SARASO puslapio, tad vienam skelbimui jos niekas
// netraukdavo. Iklijuotai nuorodai ji butina: be kainos nera nei nuolaidos, nei
// MAX pirkimo kainos.
//
// Pavojus zinomas ir senas: lizingo imoka („nuo 149 EUR/men.") atrodo kaip
// kaina. Todel taisykles trys:
//   1) atmetam viska, kas stovi salia imokos / men. / lizingo / „nuo";
//   2) atmetam ne automobilio sumas (< 300 arba > 500 000 EUR);
//   3) iš likusiu renkam DAZNIAUSIA skaiciu, ne pirma: tikra kaina skelbime
//      pakartojama kelis kartus (antrasteje, meta zymoje, kainos bloke), o
//      triuksmas buna vienkartinis. Lygiosios - didesne suma.
const IMOKOS = /(m[eė]n|imok|įmok|lizing|rata|monatl|miesi|\/\s*mo\b|per\s+m[eė]n|nuo)/i;

// v2.28.4 (Luko rasta klaida): sumos, kurios TIKRAI nėra prašoma kaina, nors
// stovi su „€". Pamatuota su mobile.de BMW 530e Touring: skelbime 28 000 €, o
// mes parodėm 57 200 €. Analizės tekste yra eilutė
// „[MOBILE.DE KAINŲ RIBOS ŠIAM AUTOMOBILIUI]: … €" (portalo kainų vertinimo
// slenksčiai) ir vokiškas „Neupreis" – naujo automobilio kaina. Abu yra eurai,
// abu didesni už prašomą sumą, ir lygiosiose laimėdavo didžiausias.
const PLN_ATSARGINIS = 4.25;   // tik kai kvietejas kurso neperdave
const NE_KAINA = /(rib[oų]s|neupreis|neuprei|listenpreis|uvp|nauja\s+kaina|naujo\s+kaina|bruttolistenpreis)/i;

function kainaIsTeksto(tekstas, kursasPLN) {
  const t = String(tekstas || '');
  // Skaicius: arba tukstanciai su tarpu/tasku („43 500", „43.500"), arba 3-6
  // skaitmenu seka. Lookbehind neleidzia prisijungti prie priekyje stovincio
  // skaiciaus: be jo „Octavia 2021, 18 900 EUR" susirinkdavo i „202118900",
  // tas butu atmestas kaip per didelis, o TIKRA kaina likdavo nepamatyta.
  // v2.28.5. Tris formas reikia gaudyti, nes portalai raso skirtingai:
  //   „25 900 EUR" (LT)   „28.000 EUR" (DE)   „EUR 28,000" / „28,000 EUR" (EN)
  // Kablelis kaip tukstanciu skyriklis imamas TIK kai po jo lygiai trys
  // skaitmenys - kitaip „1,5 l" taptu kaina. Valiuta gali stoveti ir PRIES
  // suma (autoscout24 angliskai: „EUR 28,000"), ir po jos.
  const VAL = '€|EUR\\b|eur\\b|PLN\\b|pln\\b|zł|zl\\b';
  const SK = '\\d{1,3}(?:[\\s.,]\\d{3})+|\\d{3,6}';
  const re = new RegExp('(?<![\\d.,])(?:(' + VAL + ')\\s*(' + SK + ')|(' + SK + ')\\s*(' + VAL + '))', 'g');
  const sk = {};
  let m;
  while ((m = re.exec(t)) !== null) {
    const valiuta = (m[1] || m[4] || '').toLowerCase();
    const skaicius = m[2] || m[3];
    const pries = t.slice(Math.max(0, m.index - 30), m.index);
    const po = t.slice(m.index + m[0].length, m.index + m[0].length + 10);
    // Pries sumą tikrinam placiau („įmoka nuo 149 EUR"), PO jos - tik tai, kas
    // prilipe („/men.", „per men."). Platus „po" langas atmesdavo ir tikrą kainą,
    // kai tolimesnis sakinys buvo apie lizingą: „18 900 EUR, įmoka nuo 199 EUR".
    if (IMOKOS.test(pries) || /^\s*(\/|per\s|\s)*\s*(m[eė]n|mo\b|monatl|miesi)/i.test(po)) continue;
    // Platesnis langas atgal: antraštė „[... KAINŲ RIBOS ...]" gali būti toliau
    // nei 30 simbolių prieš pačią sumą, kai ribų yra kelios.
    if (NE_KAINA.test(t.slice(Math.max(0, m.index - 90), m.index))) continue;
    let v = parseInt(String(skaicius).replace(/[\s.,]/g, ''), 10);
    if (!Number.isFinite(v)) continue;
    // Zloto suma verciama i eurus: be to otomoto „119 900 PLN" arba liktu
    // nepastebeta, arba butu parodyta kaip 119 900 EUR.
    const zlotai = /pln|zł|zl/.test(valiuta);
    if (zlotai) v = Math.round(v / (Number.isFinite(+kursasPLN) && +kursasPLN > 0 ? +kursasPLN : PLN_ATSARGINIS));
    if (v < 300 || v > 500000) continue;
    sk[v] = (sk[v] || 0) + 1;
  }
  const raktai = Object.keys(sk).map(Number);
  if (!raktai.length) return null;
  raktai.sort((a, b) => (sk[b] - sk[a]) || (b - a));
  return raktai[0];
}

// Metai: pirma - skelbimo lentele („Pirma registracija: 2018-05"), tada antraste.
// Ateities metu neimam: „2027" antrasteje yra garantijos data, ne gamybos.
function metaiIsTeksto(tekstas, siandienMetai) {
  const t = String(tekstas || '');
  // Virsus - SIE metai, ne kiti: „Garantija iki 2027" skelbimuose pasitaiko
  // dazniau nei 2027 m. gamybos naudotas automobilis.
  const virsus = (siandienMetai || new Date().getFullYear());
  const reg = t.match(/(?:pirma\s+registracija|registracija|Erstzulassung|rok produkcji)[^0-9]{0,12}((?:19|20)\d\d)/i);
  if (reg && +reg[1] >= 1950 && +reg[1] <= virsus) return +reg[1];
  const visi = (t.match(/\b(19[5-9]\d|20[0-4]\d)\b/g) || []).map(Number).filter((y) => y >= 1950 && y <= virsus);
  if (!visi.length) return null;
  // Dazniausi metai, lygiosios - naujesni (modelio metai skelbime kartojasi).
  const sk = {};
  visi.forEach((y) => { sk[y] = (sk[y] || 0) + 1; });
  const r = Object.keys(sk).map(Number).sort((a, b) => (sk[b] - sk[a]) || (b - a));
  return r[0];
}

// Kuri kaina laikom skelbimo kaina. Eiliškumas svarbus: užklausos (iš kortelės)
// → portalo struktūrinis laukas → spėjimas iš teksto. Tekstas yra PASKUTINIS,
// nes jame būna ir kainų ribų, ir naujo auto kainos, ir lizingo įmokų.
function kainaSkelbimui({ isUzklausos, isPortalo, tekstas, kursasPLN } = {}) {
  const sk = (x) => (Number.isFinite(+x) && +x > 0 ? +x : null);
  return sk(isUzklausos) || kainaIEur(isPortalo, kursasPLN) || kainaIsTeksto(tekstas, kursasPLN) || null;
}

// Portalo struktūrinis laukas būna arba skaičius (mobile.de, eurai), arba
// { suma, valiuta } (otomoto, zlotai). Suvedam į eurus vienoje vietoje.
function kainaIEur(x, kursasPLN) {
  if (x == null) return null;
  const kursas = Number.isFinite(+kursasPLN) && +kursasPLN > 0 ? +kursasPLN : PLN_ATSARGINIS;
  if (typeof x === 'object') {
    const suma = +x.suma;
    if (!Number.isFinite(suma) || suma <= 0) return null;
    const val = String(x.valiuta || 'EUR').toUpperCase();
    if (val === 'PLN' || val === 'ZL') return Math.round(suma / kursas);
    return Math.round(suma);
  }
  return Number.isFinite(+x) && +x > 0 ? Math.round(+x) : null;
}

module.exports = { MIN_IMTIS, METU_LANGAS, ALIASAI, atpazinti, kontekstas, zinute, kainaIsTeksto, metaiIsTeksto, kainaSkelbimui, kainaIEur, NE_KAINA, PLN_ATSARGINIS };
