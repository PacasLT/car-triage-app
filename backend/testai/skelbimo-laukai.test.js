// skelbimo-laukai.test.js — rida, galia, metai, kuras iš portalo lentelės (v2.29.0).
//
//     node backend/testai/skelbimo-laukai.test.js
//
// Kodėl sargas: čia keturios kalbos ir penki portalai, ir kiekviena klaida yra
// tyli. Blogiausia – ne tuščias laukas (jį matyti), o TEISINGO PAVIDALO
// klaidinga reikšmė: „2,0 l" virtęs 20 litrų, „299 PS" įrašyti kaip 299 kW,
// arba „Hybrid (Benzin/Elektro)" tapęs „Elektra". Visi trys praeitų nepastebėti
// ir iškreiptų kainos kreivę bei taršos mokestį.
const L = require('../skelbimo-laukai');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── Tikros portalų lentelės ────────────────────────────────────────────────
const DE = { 'Kilometerstand': '43.000 km', 'Leistung': '220 kW (299 PS)',
  'Kraftstoff': 'Hybrid (Benzin/Elektro)', 'Erstzulassung': '03/2024',
  'Getriebe': 'Automatik', 'Hubraum': '1.998 cm³', 'Jahresfahrleistung': '15.000 km' };
const PL = { 'Przebieg': '150 000 km', 'Moc': '190 KM', 'Rodzaj paliwa': 'Diesel',
  'Rok produkcji': '2019', 'Pojemność skokowa': '1 995 cm3', 'Skrzynia biegów': 'Automatyczna' };
const LT = { 'Rida': '180 000 km', 'Galia': '140 kW (190 AG)', 'Kuro tipas': 'Dyzelinas',
  'Pagaminimo data': '2018-05', 'Variklis': '2.0 l', 'Pavarų dėžė': 'Automatinė' };
const EN = { 'Mileage': '43,000 km', 'Power': '220 kW (299 hp)', 'Fuel type': 'Petrol',
  'First registration': '03/2024', 'Gearbox': 'Automatic' };

{
  const d = L.laukai(DE);
  T(d.rida === 43000, 'mobile.de rida 43 000 (ne metinė rida 15 000!)');
  T(d.galia === 220, 'mobile.de galia 220 kW, ne 299');
  T(d.metai === 2024 && d.menuo === 3, 'mobile.de „03/2024" → 2024 m. 3 mėn.');
  T(d.kuras === 'Benzinas / elektra', 'mobile.de „Hybrid (Benzin/Elektro)" → Benzinas / elektra');
  T(d.variklioTuris === 2, 'mobile.de 1.998 cm³ → 2,0 l');
  T(d.deze === 'Automatik', 'mobile.de dėžė perduodama kaip yra');
}
{
  const d = L.laukai(PL);
  T(d.rida === 150000 && d.metai === 2019, 'otomoto rida ir metai');
  T(d.galia === 140, 'otomoto „190 KM" → 140 kW (KM lenkiškai yra arklio galios)');
  T(d.kuras === 'Dyzelinas', 'otomoto „Diesel" → Dyzelinas');
  T(d.variklioTuris === 2, 'otomoto 1 995 cm3 → 2,0 l');
}
{
  const d = L.laukai(LT);
  T(d.rida === 180000 && d.galia === 140, 'autoplius rida ir galia');
  T(d.metai === 2018 && d.menuo === 5, 'autoplius „2018-05"');
  T(d.kuras === 'Dyzelinas' && d.variklioTuris === 2, 'autoplius kuras ir tūris');
}
{
  const d = L.laukai(EN);
  T(d.rida === 43000, 'autoscout24 „43,000 km" (kablelis kaip tūkstančiai)');
  T(d.galia === 220 && d.metai === 2024 && d.menuo === 3, 'autoscout24 galia ir data');
  T(d.kuras === 'Benzinas', 'autoscout24 „Petrol" → Benzinas');
}

// ── Pavadinimo atpažinimas: tikslus sutapimas nugali ───────────────────────
T(L.reiksme({ 'Leistungsgewicht': '4,2 kg/PS', 'Leistung': '220 kW' }, L.LAUKAI.galia) === '220 kW',
  '„Leistung" nugali „Leistungsgewicht"');
T(L.reiksme({ 'Jahresfahrleistung': '15.000 km', 'Kilometerstand': '43.000 km' }, L.LAUKAI.rida) === '43.000 km',
  '„Kilometerstand" nugali „Jahresfahrleistung"');
T(L.reiksme({ 'Nieko tokio': 'x' }, L.LAUKAI.rida) === null, 'nežinomas pavadinimas – null');
T(L.reiksme(null, L.LAUKAI.rida) === null, 'be lentelės nenukrenta');

// ── Galia: kW pirmenybė, AG verčiami ───────────────────────────────────────
T(L.galia('220 kW (299 PS)') === 220, 'kW nugali PS');
T(L.galia('299 PS (220 kW)') === 220, 'kW nugali ir kai PS pirmas');
T(L.galia('299 hp') === Math.round(299 * 0.7355), 'vien AG – verčiam į kW');
T(L.galia('190 KM') === 140, 'lenkiškas KM – arklio galios');
T(L.galia('150 kW') === 150, 'vien kW');
T(L.galia('') === null && L.galia(null) === null, 'tuščia galia – null');
T(L.galia('5 kW') === null, 'per maža reikšmė atmetama');

// ── Skaičiai: skyrikliai ir dešimtainiai ───────────────────────────────────
T(L.rida('43.000 km') === 43000 && L.rida('43,000 km') === 43000 && L.rida('150 000 km') === 150000,
  'visi trys skyrikliai');
T(L.rida('12 km') === null, 'per maža rida – null');
T(L.rida('9 999 999 km') === null, 'neįmanoma rida – null');
T(L.turis('2,0 l') === 2 && L.turis('2.0') === 2, 'tūris „2,0 l" NEtampa 20');
T(L.turis('1 995 cm3') === 2 && L.turis('1998 cm³') === 2, 'kubiniai centimetrai → litrai');
T(L.turis('15 l') === null, 'neįmanomas tūris – null');

// ── Data ───────────────────────────────────────────────────────────────────
T(JSON.stringify(L.data('03/2024')) === JSON.stringify({ metai: 2024, menuo: 3 }), '03/2024');
T(JSON.stringify(L.data('2024-03')) === JSON.stringify({ metai: 2024, menuo: 3 }), '2024-03');
T(JSON.stringify(L.data('12.2019')) === JSON.stringify({ metai: 2019, menuo: 12 }), '12.2019');
T(L.data('2019').metai === 2019 && L.data('2019').menuo === null, 'vien metai – mėnesio nespėjam');
T(L.data('13/2024').menuo === null, '13-as mėnuo neegzistuoja – imam tik metus');
T(L.data('').metai === null, 'tuščia data – null');

// ── Niekada nespėjam ───────────────────────────────────────────────────────
{
  const tuscia = L.laukai({});
  T(Object.values(tuscia).every((v) => v === null), 'tuščia lentelė – visi laukai null');
  T(Object.values(L.laukai(null)).every((v) => v === null), 'null lentelė nenukrenta');
}

// ── Kuras: visi penki portalai į tuos pačius vardus ────────────────────────
{
  const laukta = [['Diesel', 'Dyzelinas'], ['Benzin', 'Benzinas'], ['Benzyna', 'Benzinas'],
    ['Petrol', 'Benzinas'], ['Gasoline', 'Benzinas'], ['Elektro', 'Elektra'], ['Electric', 'Elektra'],
    ['Hybrid (Benzin/Elektro)', 'Benzinas / elektra'], ['Plug-in Hybrid', 'Benzinas / elektra'],
    ['Diesel Hybrid', 'Dyzelinas / elektra'], ['LPG', 'Benzinas / dujos'], ['Dyzelinas', 'Dyzelinas'],
    ['Benzinas / elektra', 'Benzinas / elektra']];
  let bl = 0;
  laukta.forEach(([v, l]) => { if (L.kuras(v) !== l) { bl++; console.log('      ↳ ' + v + ' → ' + L.kuras(v) + ', laukta ' + l); } });
  T(bl === 0, 'visi ' + laukta.length + ' kuro pavadinimai suvedami teisingai');
  T(L.kuras('Nežinoma') === null, 'nežinomo kuro nespėjam');
  // Ir svarbiausia: rezultatas turi tikti kainos kreivei
  const kk = require('../kainu-kreive');
  const visi = [...new Set(laukta.map(([, l]) => l))];
  T(visi.every((v) => kk.normKuras(v) !== '' || v === 'Benzinas / dujos' || v === 'Elektra'),
    'kainos kreivė atpažįsta visus mūsų kuro vardus');
}

console.log('\nskelbimo-laukai: ' + (n - klaidu) + '/' + n + ' ok' + (klaidu ? ', ' + klaidu + ' BLOGAI' : ''));
process.exit(klaidu ? 1 : 0);
