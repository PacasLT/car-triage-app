// nuoroda.test.js — įklijuota nuoroda → pilna analizė (v2.26.0).
//
//     node backend/testai/nuoroda.test.js
//
// Kodėl sargas: ši funkcija pirmą kartą rodo rinkos skaičius BE paieškos, t. y.
// iš archyvo. Dvi vietos, kur klaida nekrenta, o tyliai meluoja: (1) mediana
// suskaičiuota iš sumaišytų rinkų (K-72 pamoka – vokiškas auto prieš LT medianą
// atrodo pigus vien dėl rinkos); (2) kaina ištraukta iš lizingo įmokos.
const nr = require('../nuorodos-rinka');
const fs = require('fs');
const path = require('path');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── Markė ir modelis iš antraštės ───────────────────────────────────────────
const KAT = { 'BMW': ['X5', 'X6', '320', 'M5'], 'Audi': ['A4', 'A4 Allroad', 'A6'],
  'Volkswagen': ['Passat', 'Golf'], 'Land Rover': ['Discovery'], 'Skoda': ['Octavia'],
  'Mercedes-Benz': ['E 220'], 'Tesla': [] };
const a = (t) => nr.atpazinti(t, KAT);
T(a('BMW X5 xDrive30d, 2018, 3.0 l').marke === 'BMW', 'markė BMW');
T(a('BMW X5 xDrive30d, 2018').modelis === 'X5', 'modelis X5');
T(a('Audi A4 Allroad quattro 2020').modelis === 'A4 Allroad', 'ilgesnis modelis nugali („A4 Allroad“, ne „A4“)');
T(a('Land Rover Discovery 2019').marke === 'Land Rover', 'dviejų žodžių markė');
T(a('VW Passat Variant 2019').marke === 'Volkswagen', 'alias VW → Volkswagen');
T(a('VW Passat Variant 2019').modelis === 'Passat', 'alias nesugadina modelio');
T(a('Mercedes-Benz E 220 d').marke === 'Mercedes-Benz', 'tikras vardas nugali aliasą „mercedes“');
T(a('Tesla Model 3 2022').marke === 'Tesla' && a('Tesla Model 3 2022').modelis === null,
  'markė be modelių sąrašo: markė atpažįstama, modelis – ne');
T(a('Toks nesamas automobilis').marke === null, 'nežinomo nespėliojam');
T(a('').marke === null, 'tuščia antraštė nenukrenta');

// ── Kaina: lizingo įmoka NĖRA kaina ─────────────────────────────────────────
const k = nr.kainaIsTeksto;
T(k('BMW X5 2018 · 43 500 € Kaina: 43 500 € Lizingas nuo 489 EUR/mėn.') === 43500, 'kaina, ne įmoka');
T(k('Skoda Octavia 2021, 18 900 EUR, įmoka nuo 199 EUR per mėn.') === 18900,
  'kaina prieš įmoką tame pačiame sakinyje (lookbehind: „2021, 18 900“ nebesulimpa)');
T(k('Mėnesinė įmoka nuo 149 EUR/mėn.') === null, 'vien įmoka – kainos nėra');
T(k('Preis 24.900 EUR, Finanzierung ab 299 EUR monatlich') === 24900, 'DE: taškas kaip tūkstančių skyriklis');
T(k('Rida 120 000 km, kaina 15 900 €') === 15900, 'rida nepalaikoma kaina');
T(k('Kaina 250 € (dalys)') === null, 'per maža suma – ne automobilio kaina');

// ── v2.28.4: TIKRA Luko klaida – mobile.de BMW 530e Touring ────────────────
// Skelbime 28 000 €, o mes parodėme 57 200 €. Analizės tekste yra dvi sumos,
// kurios NĖRA prašoma kaina: vokiškas „Neupreis" (naujo auto kaina) ir eilutė
// „[MOBILE.DE KAINŲ RIBOS ŠIAM AUTOMOBILIUI]". Abi didesnės, o lygiosiose
// laimėdavo didžiausia. Kainos klaida yra brangiausia iš visų: ant jos stovi
// ir nuolaida, ir marža, ir MAX pirkimo kaina.
{
  const tekstas = '[TECHNINIAI DUOMENYS IŠ SKELBIMO LENTELĖS (mobile.de, vokiškai)]: '
    + 'Neupreis: 57.200 €; Kilometerstand: 43.000 km; Leistung: 220 kW (299 PS)\n\n'
    + '[MOBILE.DE KAINŲ RIBOS ŠIAM AUTOMOBILIUI]: 26.500 / 28.900 / 57.200 € (vertinimas: GOOD)';
  T(k(tekstas) !== 57200, 'kainų ribos ir „Neupreis" nebelaikomos kaina (gauta: ' + k(tekstas) + ')');
  // Portalo struktūrinis laukas turi nugalėti bet kokį spėjimą iš teksto
  T(nr.kainaSkelbimui({ isPortalo: 28000, tekstas }) === 28000, 'portalo kaina nugali tekstą');
  // Eiliškumas turi galioti ir tada, kai tekste yra visiškai tikėtina suma:
  // portalo struktūrinis laukas yra faktas, tekstas – spėjimas.
  T(nr.kainaSkelbimui({ isPortalo: 28000, tekstas: 'Kaina: 31 000 €' }) === 28000,
    'portalo laukas nugali ir tikėtiną sumą tekste');
  T(nr.kainaSkelbimui({ isUzklausos: 27000, isPortalo: 28000, tekstas: 'Kaina: 31 000 €' }) === 27000,
    'užklausa nugali abu');
  T(nr.kainaSkelbimui({ isUzklausos: 28000, isPortalo: 99999, tekstas }) === 28000,
    'užklausos kaina (iš kortelės) nugali portalo lauką');
  T(nr.kainaSkelbimui({ tekstas: 'Kaina: 28 000 €' }) === 28000, 'be portalo lauko – imam iš teksto');
  T(nr.kainaSkelbimui({ tekstas: 'be jokios sumos' }) === null, 'kai nieko nėra – null, o ne spėjimas');
  T(nr.kainaSkelbimui({ isPortalo: 0, tekstas: 'Kaina: 28 000 €' }) === 28000, 'nulinė portalo kaina nenugali');
  T(nr.kainaSkelbimui({ isPortalo: null, isUzklausos: null, tekstas: null }) === null, 'tušti įėjimai nenukrenta');
  T(nr.kainaSkelbimui() === null, 'be argumentų nenukrenta');
  // Vokiškas naujo auto kainos vardas kitais pavidalais
  T(k('Listenpreis 61.000 €') !== 61000, '„Listenpreis" – ne prašoma kaina');
  T(k('UVP: 59.900 €') !== 59900, '„UVP" – ne prašoma kaina');
  // Bet tikra kaina tame pačiame tekste vis tiek randama
  T(k('Preis: 28.000 € · Neupreis: 57.200 €') === 28000, 'tikra kaina randama šalia „Neupreis"');
}

// --- v2.28.5: visi penki portalai raso kaina skirtingai ---
// Patikrinta po Luko klausimo „ar kitu puslapiu kainas nuskaito graziai":
// autoscout24 angliskai raso „EUR 28,000" (valiuta PRIES suma, kablelis kaip
// tukstanciu skyriklis), otomoto - zlotais. Abiem atvejais senasis skaitytuvas
// grazindavo NULL, t. y. kainos nebuvo isvis.
{
  const kurs = 4.3;
  const p = (t) => nr.kainaIsTeksto(t, kurs);
  T(p('Kaina: 25 900 EUR Lizingas nuo 299 EUR/men.') === 25900, 'autoplius: tarpas kaip skyriklis');
  T(p('Audi A6 - 21 500 EUR - Rida 180 000 km') === 21500, 'autogidas: tas pats formatas');
  T(p('BMW 530e  EUR 28,000  Negotiable  from EUR 297 mth.') === 28000,
    'autoscout24 EN: valiuta PRIES suma, kablelis kaip tukstanciai');
  T(p('BMW 530e  28,000 EUR  from 297 EUR mth.') === 28000, 'autoscout24: kablelis ir valiuta po sumos');
  T(p('28.000 EUR VB ab 297 EUR mtl.') === 28000, 'autoscout24 DE: taskas kaip skyriklis');
  T(p('BMW seria 5  119 900 PLN  Przebieg 150 000 km') === Math.round(119900 / kurs),
    'otomoto: zlotai verciami i eurus (' + p('BMW seria 5  119 900 PLN') + ' EUR)');
  T(p('119 900 zl') === Math.round(119900 / kurs), 'otomoto: zenklas zl veikia kaip PLN');
  T(p('Preis: 28.000 EUR') === 28000, 'mobile.de formatas nepakito');
  T(p('Variklis 1,5 l benzinas, kaina 15 900 EUR') === 15900,
    'variklio turis 1,5 l nelaikomas tukstanciais');
  T(p('Rida 180 000 km') === null, 'rida be valiutos - ne kaina');
  T(p('Lizingas nuo 299 EUR/men.') === null, 'vien imoka - kainos nera');
  T(p('') === null && p(null) === null, 'tuscias tekstas nenukrenta');
  const beKurso = nr.kainaIsTeksto('119 900 PLN');
  T(beKurso > 20000 && beKurso < 35000, 'be perduoto kurso naudojamas atsarginis (' + beKurso + ' EUR)');
}

// --- Portalo strukturine kaina: skaicius arba { suma, valiuta } ---
{
  T(nr.kainaIEur(28000) === 28000, 'mobile.de: paprastas skaicius eurais');
  T(nr.kainaIEur({ suma: 119900, valiuta: 'PLN' }, 4.3) === Math.round(119900 / 4.3),
    'otomoto: { suma, valiuta } zlotais -> eurai');
  T(nr.kainaIEur({ suma: 28000, valiuta: 'EUR' }) === 28000, 'objektas eurais nekeiciamas');
  T(nr.kainaIEur({ suma: 28000 }) === 28000, 'be valiutos laikom eurais');
  T(nr.kainaIEur(null) === null && nr.kainaIEur({ suma: 0 }) === null, 'tuscia - null');
  T(nr.kainaIEur({ suma: 'x' }) === null, 'siuksle - null, o ne NaN');
  T(nr.kainaSkelbimui({ isPortalo: { suma: 119900, valiuta: 'PLN' }, tekstas: 'Kaina 99 999 EUR', kursasPLN: 4.3 })
    === Math.round(119900 / 4.3), 'otomoto strukturine kaina nugali teksta');
}

T(k('Kaina 1 200 000 €') === null, 'per didelė suma atmetama');
T(k('') === null && k(null) === null, 'tuščias tekstas');
// Dažniausias skaičius, ne pirmas
T(k('Nuolaida 2 000 €. Kaina 15 500 €. Galutinė kaina 15 500 €.') === 15500,
  'dažniausiai pakartotas skaičius ir yra kaina');

// ── Metai ───────────────────────────────────────────────────────────────────
T(nr.metaiIsTeksto('Pirma registracija: 2018-05, BMW X5', 2026) === 2018, 'metai iš registracijos lauko');
T(nr.metaiIsTeksto('Erstzulassung 03/2017 BMW', 2026) === 2017, 'DE Erstzulassung');
T(nr.metaiIsTeksto('Garantija iki 2027', 2026) === null, 'garantijos data nėra gamybos metai');
T(nr.metaiIsTeksto('BMW X5 2018 m., antras 2018', 2026) === 2018, 'dažniausi metai');

// ── Mediana PAGAL RINKĄ (K-72 pamoka) ───────────────────────────────────────
const eil = (portalas, kainos, metai) => kainos.map((kaina) => ({ portalas, kaina, metai: metai || 2020 }));
const DE = eil('mobilede', [20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000]);
const LT = eil('autoplius', [26000, 27000, 28000, 29000, 30000, 31000, 32000, 33000]);

let kt = nr.kontekstas(DE.concat(LT), { rinka: 'DE', metai: 2020, kaina: 19000 });
T(kt.median === 24000, 'vokiškas auto lyginamas su VOKIETIJOS mediana (24 000), ne su mišinio');
T(kt.ltMediana === 30000, 'Lietuvos mediana laikoma ATSKIRAI – MAX pirkimo kainai');
T(kt.count === 8 && kt.patikima === true, 'imtis 8 – patikima');
T(kt.diffPct === 21, 'nuolaida skaičiuojama nuo savos rinkos (19 000 prieš 24 000 = 21 %)');

kt = nr.kontekstas(DE.slice(0, 4).concat(LT), { rinka: 'DE', metai: 2020, kaina: 19000 });
T(kt.median === null && kt.patikima === false, '4 vokiški skelbimai – medianos NERODOM');
T(kt.diffPct === null, 'be medianos nėra ir nuolaidos – netikros nuolaidos nerodom');
T(kt.ltMediana === 30000, 'LT mediana vis tiek yra – MAX gali būti rodomas');
T(/radom 4 panašius/.test(nr.zinute(kt) || ''), 'žinutė pasako, kiek radom ir kiek reikia');
T(nr.zinute(nr.kontekstas([], { rinka: 'DE' })) === 'Šio modelio mūsų archyve dar neturim – rinkos kainos neskaičiuojam.',
  'tuščias archyvas gauna savo sakinį');
T(nr.zinute(nr.kontekstas(DE, { rinka: 'DE', metai: 2020, kaina: 19000 })) === null,
  'kai mediana patikima, žinutės nėra');

// Metų langas: 2015 m. kainos neturi dalyvauti 2020 m. medianoje
kt = nr.kontekstas(DE.concat(eil('mobilede', [5000, 5100, 5200, 5300, 5400, 5500], 2010)),
  { rinka: 'DE', metai: 2020, kaina: 19000 });
T(kt.count === 8, 'dešimt metų senesni skelbimai į medianą neįeina (±1 metai)');

// Portalas nežinomas – eilutė praleidžiama, o ne priskiriama ne tai rinkai
kt = nr.kontekstas(eil('nezinomas-portalas', [10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000]),
  { rinka: 'LT', metai: 2020, kaina: 9000 });
T(kt.median === null, 'nežinomo portalo kainos niekur neįskaitomos');

// Netikros kainos (lizingas archyve) – `atspariMediana` rėmai veikia ir čia
kt = nr.kontekstas(eil('autoplius', [200, 300, 29000, 30000, 31000, 32000, 33000, 34000, 35000, 36000]),
  { rinka: 'LT', metai: 2020, kaina: 25000 });
T(kt.median >= 29000, 'kelios absurdiškos kainos medianos nenuverčia');

// ── Serverio ir sąsajos pusė ────────────────────────────────────────────────
const srv = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
T(/rinkosKontekstas = Object\.assign/.test(srv), 'serveris surenka rinkos kontekstą pats');
T(/if \(!marketMedian\) \{/.test(srv), 'tik tada, kai skaičių užklausoje nėra (iš kortelės – nekeičiam)');
T(/rinkosKontekstas: rinkosKontekstas \|\| null,/.test(srv), 'kontekstas grąžinamas sąsajai');
T(/rinka\.kainosModeliui\(\{ marke: ident\.marke, modelis: ident\.modelis/.test(srv), 'archyvo užklausa pagal markę IR modelį');
T(/ident\.modelis\s*\n?\s*\? rinka\.kainosModeliui/.test(srv) || /ident\.modelis$/m.test(srv),
  'be atpažinto modelio archyvo neklausiam (markės mediana būtų modelių mišinys)');
const rdb = fs.readFileSync(path.join(__dirname, '..', 'rinka.js'), 'utf8');
T(/dingo IS NULL AND kaina IS NOT NULL AND kainos_ispejimas IS NULL/.test(rdb),
  'archyve imam tik gyvus ir tik be kainos įspėjimo');
T(/SELECT portalas, kaina, metai, rida FROM skelbimai/.test(rdb), 'portalas grąžinamas – be jo nėra rinkos');

const idx = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'index.html'), 'utf8');
T(/<form class="ct-link" id="ct-link"/.test(idx), 'nuorodos laukas yra puslapyje');
T(/data-state="empty"/.test(idx), 'būsena per `data-state` (56 sk.)');
T(/type="url" inputmode="url"/.test(idx), 'telefone – URL klaviatūra');
T(/id="ct-link-btn" disabled/.test(idx), 'mygtukas iš pradžių neaktyvus – analizė kainuoja kreditų');
T(/Analizuoti · 2 kr/.test(idx), 'kaina užrašyta ant mygtuko');
T(/function ctNuorodosPortalas/.test(idx), 'portalo atpazinimas yra');
T(['autoplius.lt', 'autogidas.lt', 'autoscout24.com', 'otomoto.pl', 'mobile.de']
  .every((d) => idx.includes("'" + d + "'")), 'atpažįstami visi penki portalai');
T(/ctNuorodosBusena\('foreign'/.test(idx), 'svetimas portalas gauna savo būseną, ne klaidą');
T(/localStorage\.setItem\('ct_detail'/.test(idx), 'rezultatas perduodamas skelbimo puslapiui');
// Inline stilių tikrinam TIK naujame bloke: senų `index.html` nuodėmių šis
// sargas neprižiūri, bet naujų neįsileidžiam.
const blokas = idx.slice(idx.indexOf('<form class="ct-link"'), idx.indexOf('<!-- SEARCH PANEL -->'));
T(blokas.length > 200, 'nuorodos bloka radom');
T(!/style="/.test(blokas), 'naujame bloke jokiu inline stiliu (dizaino taisykle 3)');
T(!/font-weight|color:/.test(idx.slice(idx.indexOf('function ctNuorodosZingsniai'), idx.indexOf('function ctPerbranguLangas'))),
  'nuorodos JS nerašo nei šrifto, nei spalvos');
const det = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'detail.html'), 'utf8');
T(/c\.rinkosZinute/.test(det), 'skelbimo puslapis pasako, KODĖL rinkos skaičiaus nėra');
T(/CT_RINKOS_MIN = 8/.test(det) && nr.MIN_IMTIS === 8,
  'archyvo riba (8) sutampa su puslapio riba – viename ekrane viena tiesa');

console.log('\n' + (klaidu ? klaidu + ' KRENTA' : 'visi ' + n + ' prajo'));
process.exit(klaidu ? 1 : 0);
