// mobilede-skelbimas.test.js — mobile.de SKELBIMO puslapio skaitytuvas.
//
//     node backend/testai/mobilede-skelbimas.test.js
//
// Tinklo nekviečia, kreditų nekainuoja.
//
// DUOMENYS: tikras skelbimas 461901295 (BMW X6, Automobile Trier), nukopijuotas
// iš naršyklės 2026-09-21. Sutrumpinta: 31 atributas → 12, 63 įrangos punktai
// → 10, 28 nuotraukos → 3, aprašymas → pirma pastraipa ir paskutinė eilutė
// (su ✅ ☎️ ⏰ - daugiabaičiai simboliai TYČIA, nes aprašymo ilgis RSC'e
// nurodytas BAITAIS, ne simboliais). Laukų vardai ir formatai nepakeisti.

const path = require('path');
const MD = require(path.join(__dirname, '..', 'mobilede.js'));

let klaidu = 0, patikru = 0;
const T = (salyga, s) => { patikru++; if (salyga) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };
const lygu = (g, l, s) => T(JSON.stringify(g) === JSON.stringify(l), s + '  [gauta ' + JSON.stringify(g) + ', laukta ' + JSON.stringify(l) + ']');

const L = {
  attributes: [
    { label: 'Fahrzeugzustand', tag: 'damageCondition', value: 'Gebrauchtfahrzeug' },
    { label: 'Kategorie', tag: 'category', value: 'SUV/Geländewagen/Pickup' },
    { label: 'Baureihe', tag: 'modelRange', value: 'F16' },
    { label: 'Kilometerstand', tag: 'mileage', value: '93.000 km' },
    { label: 'Hubraum', tag: 'cubicCapacity', value: '2.993 cm³' },
    { label: 'Leistung', tag: 'power', value: '190 kW (258 PS)' },
    { label: 'Kraftstoffart', tag: 'fuel', value: 'Diesel' },
    { label: 'Kraftstoffverbrauch', tag: 'envkv.consumptionDetails.fuel', value: ['7,0 l/100km (kombiniert)'], footnoteIndices: [0] },
    { label: 'Getriebe', tag: 'transmission', value: 'Automatik' },
    { label: 'Erstzulassung', tag: 'firstRegistration', value: '06/2019' },
    { label: 'HU', tag: 'hu', value: 'Neu' },
    { label: 'Farbe', tag: 'color', value: 'Schwarz Metallic' },
  ],
  shortTitle: 'BMW X6', subTitle: 'xDrive 30 d*Garantie*Navi*Voll*', isNew: false, isConditionNew: false,
  contact: {
    type: 'Händler', country: 'DE', enumType: 'DEALER', name: 'Automobile Trier',
    address1: 'Auf Bowert 19', address2: 'DE-54340 Bekond',
    latLong: { lat: 49.8525298, lon: 6.800917399999999 },
    withMobileSince: 'Bei mobile.de seit 13.02.2012',
    rating: { count: 60, totalCount: 419, score: 4.9, scoreLocalized: '4,9' },
  },
  created: 1785419873, modified: 1789484292, renewed: 1787826022,
  make: { id: '3500', localized: 'BMW' }, model: { id: '60', localized: 'X6' },
  images: [
    { uri: 'img.classistatic.de/api/v1/mo-prod/images/99/99e3bbc9-05a5-4eae-936f-37a79602e100' },
    { uri: 'img.classistatic.de/api/v1/mo-prod/images/1f/1fa64d3e-965d-448d-b871-a2d87c135e5e' },
    { uri: 'img.classistatic.de/api/v1/mo-prod/images/07/07ad50dd-74da-4e8d-9268-d6aa93c588f3' },
  ],
  features: ['Abgedunkelte Scheiben', 'ABS', 'Allradantrieb', 'Head-Up Display', 'Navigationssystem',
    'Scheckheftgepflegt', 'Sitzheizung', 'Totwinkel-Assistent', 'Verkehrszeichenerkennung', 'Zentralverriegelung'],
  highlights: ['Garantie', 'Finanzierung', 'Inzahlungnahme'],
  priceRating: { rating: 'REASONABLE_PRICE', ratingLabel: 'Fairer Preis',
    thresholdLabels: ['24.900 €', '32.400 €', '34.900 €', '38.800 €', '41.700 €', '46.300 €'], vehiclePriceOffset: 2 },
  title: 'BMW X6 xDrive 30 d*Garantie*Navi*Voll*',
  url: 'https://suchen.mobile.de/auto-inserat/bmw-x6-xdrive-30-d-garantie-navi-voll-bekond/461901295.html',
  id: 461901295,
  price: { grs: { amount: 34990, currency: 'EUR', localized: '34.990 €' }, type: 'FIXED' },
  kba: { hsn: '0005', tsn: 'BTJ' },
  htmlDescription: '$41', carfaxEligible: true,
};
const DESC = '<b>Angeboten wird ein sehr gepflegter Bmw X6 , der sich sowohl technisch als auch optisch in einem sehr guten Zustand befindet. Die Übergabe erfolgt mit neuer Hauptuntersuchung (HU/TÜV) und frisch durchgeführtem Service.<br><br>✅SERVICE</b><ul><li>Finanzierung zu Top-Konditionen</li><li>Gewährleistung 12 Monate inklusive</li></ul><b>☎️✅ Telefon/Whatsapp:</b><br>+49 6502 9990030<br><br><b>⏰ Unsere Öffnungszeiten:</b><br>www.automobile-trier.de<br>';
const baitu = Buffer.byteLength(DESC, 'utf8');
const rsc = '1e:[["$","$L26",null,{"eventScope":"page-vip","listing":' + JSON.stringify(L) + '}]]\n'
  + '41:T' + baitu.toString(16) + ',' + DESC + '42:["$","div",null,{}]\n';
const html = '<html><body><script>self.__next_f.push(' + JSON.stringify([1, rsc.slice(0, 900)]) + ')</script>'
  + '<script>self.__next_f.push(' + JSON.stringify([1, rsc.slice(900)]) + ')</script></body></html>';

console.log('\n── 1. Skaitymas ────────────────────────────────────────────');
const p = MD.mobileDeSkelbimoPuslapis(html);
T(p.rasta, 'listing rastas (RSC perskeltas į du gabalus)');
lygu([p.id, p.kaina, p.title], ['461901295', 34990, 'BMW X6 xDrive 30 d*Garantie*Navi*Voll*'], 'id, kaina, pavadinimas');
lygu(p.parametrai['Kilometerstand'], '93.000 km', 'parametrai pagal vokišką etiketę');
lygu(p.parametrai['Kraftstoffverbrauch'], '7,0 l/100km (kombiniert)', 'masyvo reikšmė sujungta');
lygu(p.iranga[0].items.length, 10, 'įranga - visi punktai');
lygu(p.photos.length, 3, 'nuotraukos');
T(p.photos[0].startsWith('https://img.classistatic.de/') && p.photos[0].endsWith('?rule=mo-1024.jpg'), 'nuotraukos adresas su https ir dydžiu: ' + p.photos[0]);
lygu(p.pardavejoInfo, { privatus: false, vardas: 'Automobile Trier', lygis: '4.9/5 (419 atsil.)', vieta: '54340 Bekond, DE', nuo: 'Bei mobile.de seit 13.02.2012' }, 'pardavėjas');
lygu(p.kainosRibos, [24900, 32400, 34900, 38800, 41700, 46300], 'mobile.de kainų ribos');
lygu([p.kainosVertinimas, p.busena, p.tu], ['REASONABLE_PRICE', 'Gebrauchtfahrzeug', 'Neu'], 'vertinimas, būklė, HU');
lygu(p.ikelta, '2026-07-30T13:57:53.000Z', 'įkėlimo data iš created (unix s)');
lygu(p.koordinates, { lat: 49.8525298, lon: 6.800917399999999 }, 'koordinatės');

console.log('\n── 2. Aprašymas: ilgis BAITAIS ─────────────────────────────');
T(p.aprasymas && p.aprasymas.startsWith('Angeboten wird'), 'pradžia');
T(p.aprasymas.includes('• Finanzierung zu Top-Konditionen'), '<li> → „• "');
T(p.aprasymas.endsWith('www.automobile-trier.de'), 'pabaiga tiksli - nei nukirsta, nei su kitu RSC gabalu (' + p.aprasymas.slice(-30) + ')');
T(!p.aprasymas.includes('42:['), 'kitas RSC gabalas neįsiskverbė');
T(!/<[a-z]/i.test(p.aprasymas), 'HTML žymės pašalintos');
lygu(MD.rscTekstas('0:x\n7:T3,abc8:y', '$7'), 'abc', 'rscTekstas: paprastas');
lygu(MD.rscTekstas('7:T4,ąb', '$7'), 'ąb', 'rscTekstas: „ą" = 2 baitai');

console.log('\n── 3. Iššūkio puslapis ─────────────────────────────────────');
const issukis = '<!DOCTYPE html><html><body><script type="text/javascript" src="/JID-oFh2-U-a_unitQ/Jft3Q2OL/AwJeOn5fDQs/H2/1cUCwaBE86?v=2a98e62c"></script></body></html>';
lygu(MD.mobileDeSkelbimoPuslapis(issukis), { rasta: false, issukis: true }, 'JS iššūkis → rasta:false, issukis:true');
lygu(MD.mobileDeSkelbimoPuslapis('').rasta, false, 'tuščias');

console.log('\n── 4. Privatus pardavėjas ──────────────────────────────────');
const L2 = JSON.parse(JSON.stringify(L)); L2.contact = { enumType: 'PRIVATE', address2: 'DE-10115 Berlin', country: 'DE' }; L2.htmlDescription = null;
const h2 = '<script>self.__next_f.push(' + JSON.stringify([1, '1e:[{"eventScope":"page-vip","listing":' + JSON.stringify(L2) + '}]\n']) + ')</script>';
const p2 = MD.mobileDeSkelbimoPuslapis(h2);
lygu([p2.pardavejoInfo.privatus, p2.pardavejoInfo.vardas, p2.aprasymas], [true, null, null], 'privatus, be vardo, be aprašymo');

console.log('\n── 5. Tekstas AI analizei ──────────────────────────────────');
const t = MD.mobileDeAnalizesTekstas(p);
T(t.includes('[TECHNINIAI DUOMENYS') && t.includes('Kilometerstand: 93.000 km'), 'parametrai');
T(t.includes('[ĮRANGA') && t.includes('Head-Up Display'), 'įranga');
T(t.includes('[MOBILE.DE KAINŲ RIBOS') && t.includes('24900 / 32400'), 'kainų ribos');
T(t.includes('Automobile Trier (4.9/5'), 'pardavėjas su reitingu');
lygu(MD.mobileDeAnalizesTekstas({ rasta: false }), '', 'nerastas → tuščias tekstas');

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + patikru : '✓ ' + patikru + '/' + patikru + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
