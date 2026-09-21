// mobilede.test.js — mobile.de adreso ir skaitytuvo sargas.
//
//     node backend/testai/mobilede.test.js
//
// Tinklo nekviečia, kreditų nekainuoja.
//
// DUOMENYS: penki skelbimai nukopijuoti iš TIKRO mobile.de atsakymo
// (2026-09-21, BMW nuo 2019, dyzelis, 1 puslapis, 31 774 rezultatai) - laukų
// vardai, reikšmių formatai („93.000 km", „1.995 cm³", „06/2019") ir tipai
// (topOfPage / topInCategory / regular / eyecatcher) tikri. Sutrumpinta tik
// tiek: 20 skelbimų → 5, o RSC eilutė perskelta į DU <script> gabalus tyčia,
// nes tikrame puslapyje JSON gali būti perskeltas bet kurioje vietoje.
//
// Ko šis testas NEĮRODO: kad ScraperAPI grąžins tą patį HTML. Tai patikrins
// /admin/pavyzdys?portalas=mobilede (tikra užklausa, kainuoja kreditus).

const path = require('path');
const MD = require(path.join(__dirname, '..', 'mobilede.js'));

let klaidu = 0, patikru = 0;
const T = (salyga, s) => { patikru++; if (salyga) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };
const lygu = (g, l, s) => T(JSON.stringify(g) === JSON.stringify(l), s + '  [gauta ' + JSON.stringify(g) + ', laukta ' + JSON.stringify(l) + ']');

// ── Tikri skelbimai (sutrumpinti iki 5) ──────────────────────────────────────
const LISTINGS = [
  { id: 453772365, type: 'topOfPage', attr: { cn: 'DE', z: '72108', loc: 'Rottenburg am Neckar', fr: '01/2023', pw: '110 kW (150 PS)', ft: 'Diesel', ml: '62.399 km', cc: '1.995 cm³', tr: 'Automatik', gi: '01/2028', ecol: 'Weiß', eu: 'Deutsche Ausführung', door: '4/5', sc: '5', c: 'EstateCar', emc: 'Euro6d', pvo: '1', nw: '1.735 kg' },
    contact: { enumType: 'DEALER', phones: [{ uri: 'tel:+4974729379032' }], rating: { count: 67, score: 4.9 } },
    price: { grs: { amount: 27490 } }, priceRating: { rating: 'GOOD_PRICE' }, sellerId: 30080044,
    make: { localized: 'BMW' }, model: { localized: '318' }, numImages: 24, vc: 'Car', category: 'Kombi' },
  { id: 442984638, type: 'topInCategory', attr: { cn: 'DE', z: '44809', loc: 'Bochum', yc: '2025', pw: '219 kW (298 PS)', ft: 'Diesel', ml: '0 km', cc: '2.993 cm³', tr: 'Automatik', gi: 'Neu', con: 'Neuwagen', c: 'OffRoad' },
    contact: { enumType: 'DEALER', rating: { count: 10, score: 4.6 } },
    price: { grs: { amount: 87890 } }, priceRating: { rating: 'GOOD_PRICE' }, sellerId: 9270974,
    make: { localized: 'BMW' }, model: { localized: 'X5' }, vc: 'Car', category: 'SUV/Geländewagen/Pickup', isConditionNew: true,
    leasingRate: { type: 'COMMERCIAL', downPayment: 0, termOfContract: 36, annualMileage: 5000, netRate: 828.42, leasingFactor: 0.84 } },
  { id: 461901295, type: 'regular', attr: { cn: 'DE', z: '54340', loc: 'Bekond', fr: '06/2019', pw: '190 kW (258 PS)', ft: 'Diesel', ml: '93.000 km', cc: '2.993 cm³', tr: 'Automatik', gi: 'Neu', c: 'OffRoad', emc: 'Euro6' },
    contact: { enumType: 'DEALER', rating: { count: 60, score: 4.9 } },
    price: { grs: { amount: 34990 } }, priceRating: { rating: 'REASONABLE_PRICE' }, sellerId: 7151671,
    make: { localized: 'BMW' }, model: { localized: 'X6' }, vc: 'Car', category: 'SUV/Geländewagen/Pickup' },
  { id: 460768434, type: 'eyecatcher', attr: { cn: 'DE', z: '70825', loc: 'Korntal-Münchingen', fr: '07/2019', pw: '240 kW (326 PS)', ft: 'Diesel', ml: '100.247 km', cc: '2.993 cm³', tr: 'Automatik', c: 'OffRoad' },
    contact: { enumType: 'DEALER', rating: { count: 102, score: 4.4 } },
    price: { grs: { amount: 32470 } }, priceRating: { rating: 'GOOD_PRICE' }, sellerId: 22902123,
    make: { localized: 'BMW' }, model: { localized: 'X4 M40' }, vc: 'Car', category: 'SUV/Geländewagen/Pickup',
    nationalDelivery: { additionalInformation: 'Wir liefern das Auto kostenlos zu einem unserer Autohero-Abholstandorte {in} deiner Nähe. "Truck"', period: '1 Tag' } },
  { id: 44314758257856, type: 'regular', attr: { cn: 'DE', z: '49393', loc: 'Lohne', fr: '07/2019', pw: '190 kW (258 PS)', ft: 'Diesel', ml: '110.000 km', cc: '2.993 cm³', tr: 'Automatik', c: 'Limousine' },
    contact: { enumType: 'DEALER', rating: { count: 44, score: 4.6 } },
    price: { grs: { amount: 27990 } }, priceRating: { rating: 'GOOD_PRICE' }, sellerId: 1392517,
    make: { localized: 'BMW' }, model: { localized: '430' }, vc: 'Car', category: 'Limousine' },
];
// Pastaba: eyecatcher'io tekste pridėti `{in}` ir kabutės - tyčia, kad
// skliaustų skaičiuoklė būtų patikrinta su skliaustais ir kabutėmis EILUTĖSE.

const rsc = '1:"$Sreact.fragment"\n48:["$","$L4d",null,{"defaultSortParams":{"sb":"rel","od":"up"},"eventScope":"page-srp",'
  + '"searchResults":' + JSON.stringify({ numResultsTotal: 31774, listings: LISTINGS, searchId: '6399f499', pageNumber: 1 })
  + ',"kitas":{"a":1}}]\n';
const puse = Math.floor(rsc.length / 2);       // perskeliam per vidurį - kaip gali tikrovėje
const html = '<!DOCTYPE html><html><body><script>self.__next_f=self.__next_f||[]</script>'
  + '<script>self.__next_f.push([0])</script>'
  + '<script>self.__next_f.push(' + JSON.stringify([1, rsc.slice(0, puse)]) + ')</script>'
  + '<div>tarp</div>'
  + '<script>self.__next_f.push(' + JSON.stringify([1, rsc.slice(puse)]) + ')</script>'
  + '</body></html>';

console.log('\n── 1. Skaitymas ────────────────────────────────────────────');
const r = MD.extractMobileDe(html);
T(r.rasta, 'searchResults rastas per du perskeltus gabalus');
lygu([r.viso, r.puslapis], [31774, 1], 'viso / puslapis');
lygu(r.skelbimai.length, 3, 'reklaminiai (topOfPage, topInCategory) atmesti, lieka 3');
lygu(r.reklamu, 2, 'reklamų skaičius');
lygu(r.skelbimai.map((l) => l.skelbimoTipas), ['regular', 'eyecatcher', 'regular'], 'eyecatcher LIEKA - tai tikras rezultatas');

const x6 = r.skelbimai[0];
lygu([x6.kaina, x6.rida, x6.metai], [34990, 93000, 2019], 'X6: kaina, „93.000 km" → 93000, „06/2019" → 2019');
lygu([x6.modelis, x6.kuras, x6.pavarai], ['BMW X6', 'Dyzelinas', 'Automatinė'], 'modelis, kuras, dėžė');
lygu([x6.galia, x6.variklioTuris], [190, 3], '„190 kW (258 PS)" → 190, „2.993 cm³" → 3.0');
lygu([x6.miestas, x6.salis, x6.yraVerslas], ['Bekond', 'DE', true], 'miestas, šalis, verslas');
lygu(x6.url, 'https://suchen.mobile.de/fahrzeuge/details.html?id=461901295', 'adresas iš id');
lygu(x6.portaloKainosVertinimas, 'REASONABLE_PRICE', 'mobile.de kainos vertinimas išsaugomas');
lygu(r.skelbimai[2].url, 'https://suchen.mobile.de/fahrzeuge/details.html?id=44314758257856', 'ilgas (14 sk.) id nesugadintas');
lygu(r.skelbimai[1].modelis, 'BMW X4 M40', 'modelis su tarpu');

console.log('\n── 2. Naujas automobilis ir lizingas (reklaminis) ──────────');
const naujas = MD.mobileDeSkelbimas(LISTINGS[1]);
lygu([naujas.metai, naujas.rida, naujas.naujas], [2025, 0, true], 'be „fr" - metai iš „yc", rida 0, naujas');
lygu([naujas.turiLizingoOpcija, naujas.lizingoSuma], [true, 828], 'lizingas: netRate 828.42 → 828');
T(naujas.reklama, 'topInCategory pažymėtas kaip reklama');

console.log('\n── 3. Kuro ir dėžės pavadinimai ────────────────────────────');
const su = (o) => MD.mobileDeSkelbimas(Object.assign({}, LISTINGS[2], { attr: Object.assign({}, LISTINGS[2].attr, o) }));
lygu(su({ ft: 'Hybrid (Benzin/Elektro)' }).kuras, 'Benzinas / elektra', 'benzino hibridas - kaip rinka.kuroNorm');
lygu(su({ ft: 'Hybrid (Diesel/Elektro)' }).kuras, 'Dyzelinas / elektra', 'dyzelino hibridas');
lygu(su({ ft: 'Elektro' }).kuras, 'Elektra', 'elektra');
lygu(su({ ft: 'Autogas (LPG)' }).kuras, 'Benzinas / dujos', 'dujos');
lygu(su({ tr: 'Schaltgetriebe' }).pavarai, 'Mechaninė', 'mechaninė');
lygu(su({ tr: 'Halbautomatik' }).pavarai, 'Automatinė', 'pusiau automatinė = automatinė (kaip autoscout24)');

console.log('\n── 4. Sugadintas / kitoks puslapis ─────────────────────────');
lygu(MD.extractMobileDe('<html>Access Denied</html>').rasta, false, 'Akamai puslapis → rasta:false, ne klaida');
lygu(MD.extractMobileDe('').skelbimai.length, 0, 'tuščias → 0');
lygu(MD.extractMobileDe(null).rasta, false, 'null → rasta:false');

console.log('\n── 5. Adresas (parametrai patikrinti naršyklėje 2026-09-21) ─');
const u = (f, p) => MD.buildMobileDeUrl(f, p);
const turi = (url, ...dalys) => dalys.every((d) => url.includes(d));
T(turi(u({ marke: 'BMW', metaiNuo: 2019 }), 'ms=3500', 'fr=2019%3A', 'dam=false', 's=Car', 'vc=Car'), 'BMW nuo 2019');
T(turi(u({ marke: 'BMW', modelis: 'X5' }), 'ms=3500%3B49'), 'X5 → ms=3500;49 (tikslus modelis, 4 467)');
T(turi(u({ marke: 'BMW', modelis: '3 serija' }), 'ms=3500%3B%3B21'), '„3 serija" → grupė ;;21 (9 285)');
T(turi(u({ marke: 'BMW', modelis: 'x5' }), 'ms=3500%3B49'), 'didžiosios/mažosios raidės nesvarbu');
const nerastas = MD.buildMobileDeUrl({ marke: 'BMW', modelis: 'Nesamas' }, 1, { info: true });
T(nerastas.modelisNerastas && /ms=3500(&|$)/.test(nerastas.url), 'nežinomas modelis → tik markė + modelisNerastas:true');
T(!u({ marke: 'BMW', modelis: 'X5' }).includes('%3B%3B%3B'), 'NIEKADA ;;;tekstas - tai laisvo teksto paieška (X5 grąžintų ir 530)');
lygu((u({ marke: 'BMW', kuras: 'dyzelis' }).match(/ft=\w+/g)), ['ft=DIESEL', 'ft=HYBRID_DIESEL'], 'dyzelis = dyzelinas + dyzelino hibridai (29 478 + 2 295 = 31 773)');
lygu((u({ marke: 'BMW', kuras: 'benzinas' }).match(/ft=\w+/g)), ['ft=PETROL', 'ft=HYBRID', 'ft=LPG', 'ft=CNG'], 'benzinas = benzinas + hibridai + dujos');
lygu((u({ marke: 'BMW', kuras: 'hibridas' }).match(/ft=\w+/g)), ['ft=HYBRID', 'ft=HYBRID_DIESEL'], 'hibridas = abu hibridai');
lygu((u({ marke: 'BMW', kuras: 'elektra' }).match(/ft=\w+/g)), ['ft=ELECTRICITY'], 'elektra');
lygu((u({ marke: 'BMW', pavaru_deze: 'Automatinė' }).match(/tr=\w+/g)), ['tr=AUTOMATIC_GEAR', 'tr=SEMIAUTOMATIC_GEAR'], 'automatinė + pusiau (68 178 + 74 = 68 252)');
T(turi(u({ marke: 'BMW', kainaIki: 30000, ridaIki: 150000 }), 'p=%3A30000', 'ml=%3A150000'), 'kaina ir rida iki');
T(turi(u({ marke: 'BMW', kainaNuo: 5000, kainaIki: 30000 }), 'p=5000%3A30000'), 'kaina nuo-iki');
T(turi(u({ marke: 'BMW' }, 3), 'pageNumber=3') && !u({ marke: 'BMW' }, 1).includes('pageNumber'), 'puslapis: 1-as be parametro');
lygu((u({ marke: 'BMW', modelis: 'X5' }).match(/ms=/g) || []).length, 1, 'tik VIENAS ms (antrasis portale ignoruojamas)');
lygu(MD.MOBILEDE_PUSLAPIU_RIBA, 100, 'puslapių riba 100 (101-as grąžina 0)');
lygu(u({ marke: 'Nesama Markė' }), null, 'nežinoma markė → null (ne visa Vokietijos rinka)');
T(!/ms=/.test(u({})), 'be markės - be ms (tik kai markė visai nenurodyta)');
T(turi(u({ marke: 'BMW', rikiavimas: 'naujausi' }), 'sb=doc', 'od=down'), 'archyvui: naujausi viršuje (patikrinta naršyklėje)');

console.log('\n── 6. Archyvo tapatybė ─────────────────────────────────────');
{
  const R = require(path.join(__dirname, '..', 'rinka.js'));
  lygu(R.skelbimoId('mobilede', 'https://suchen.mobile.de/fahrzeuge/details.html?id=461901295'), 'mobilede:461901295', 'id iš ?id=');
  lygu(R.skelbimoId('mobilede', 'https://suchen.mobile.de/fahrzeuge/details.html?id=44314758257856&x=1'), 'mobilede:44314758257856', 'ilgas id + kiti parametrai');
  lygu(R.skelbimoId('autoplius', 'https://autoplius.lt/skelbimai/bmw-x5-28797115.html'), 'autoplius:28797115', 'autoplius nepakito');
}

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + patikru : '✓ ' + patikru + '/' + patikru + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
