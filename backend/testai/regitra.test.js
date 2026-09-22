// regitra.test.js — Regitros integracijos sargas · duomenų v2.
//
//     node backend/testai/regitra.test.js
//
// Priklausomybių nereikia: modulis skaito JSON ir skaičiuoja.
//
// KAM ŠIS SARGAS: `backend/regitra.js` ir `tools/regitra-suvestine.py` turi tą
// pačią normalizavimo logiką dviem kalbomis. Jei jos išsiskirs, niekas
// nesulūš garsiai — raktas tiesiog nerastų įrašo, ir vietoj skaičių tyliai
// atsirastų ⚪. Todėl raktai tikrinami prieš TIKRUS duomenis.

const path = require('path');
const R = require(path.join(__dirname, '..', 'regitra.js'));

let klaidu = 0, patikru = 0;
const ok = (s) => { patikru++; console.log('  ok   ' + s); };
const blogai = (s) => { patikru++; klaidu++; console.log('  BLOGAI ' + s); };
const T = (salyga, s) => (salyga ? ok(s) : blogai(s));
const lygu = (gauta, laukta, s) =>
  T(JSON.stringify(gauta) === JSON.stringify(laukta),
    s + '  [gauta ' + JSON.stringify(gauta) + ', laukta ' + JSON.stringify(laukta) + ']');

const meta = R.ikelti();

console.log('\n── 0. Duomenys · v2 ────────────────────────────────────────');
T(!!meta, 'JSON įkeltas');
T(meta && meta.versija === 2, 'duomenų versija 2 (' + (meta && meta.versija) + ')');
T(meta && meta.modeliu >= 900, 'modelių bent 900 – po K-33 raktų sujungimo 957 (' + (meta && meta.modeliu) + ')');
// BE SIU DVIEJU skaiciai neturi laiko - butent ju truko v1, ir 12 men. langas
// tyliai dengė 9,3 menesio.
T(!!(meta && meta.duomenuPabaiga), 'yra duomenų pabaiga: ' + (meta && meta.duomenuPabaiga));
T(!!(meta && meta.langas12men), 'yra 12 mėn. langas: ' + (meta && meta.langas12men));

console.log('\n── 1. Normalizavimas · turi atitikti regitra-suvestine.py ──');
lygu(R.baziniModelis('BMW', 'X5 XDRIVE30D'), 'BMW X5', "baziniModelis('BMW','X5 XDRIVE30D')");
lygu(R.baziniModelis('VOLKSWAGEN. VW', 'VW PASSAT'), 'VW PASSAT', "baziniModelis('VOLKSWAGEN. VW','VW PASSAT')");
lygu(R.baziniModelis('TOYOTA', 'TOYOTA RAV4'), 'TOYOTA RAV4', "baziniModelis('TOYOTA','TOYOTA RAV4')");
lygu(R.markeNorm('MERCEDES-BENZ'), 'MERCEDES', "markeNorm('MERCEDES-BENZ')");
lygu(R.markeNorm('LAND-ROVER'), 'LAND ROVER', "markeNorm('LAND-ROVER')");
lygu(R.baziniModelis('BMW', ''), null, 'tuščias modelis → null');
lygu(R.baziniModelis('TOYOTA', 'TOYOTA'), null, 'modelis = vien markė → null');
lygu(R.baziniModelis(null, null), null, 'null įvestis → null (nekrenta)');

console.log('\n── 2. Kontekstas · tikri v2 skaičiai ───────────────────────');
const x5 = R.kontekstas('BMW', 'X5');
lygu(x5 && x5.parkas, 12250, "kontekstas('BMW','X5').parkas");
lygu(x5 && x5.apyv_pct, 25.7, "apyv_pct = 25,7  (v1 rodė 22,1 — 12 mėn. lango klaida; K-33 raktai)");
lygu(x5 && x5.kmmet_med, 17245, "kontekstas('BMW','X5').kmmet_med");
lygu(x5 && x5.neleid15_pct, 16.5, "kontekstas('BMW','X5').neleid15_pct");
T(R.kontekstas('NĖRATOKIOS', 'NIEKO') === null, 'nežinomas modelis → null, ne klaida');
T(R.kontekstas('BMW', 'X5 XDRIVE40D') === x5, 'variantas veda į tą patį bazinį įrašą');
T(Array.isArray(x5.kmmet_kv) && x5.kmmet_kv.length === 5, 'kmmet_kv yra [P10..P90]');
T(x5.kmmet_kv.every((v, i, a) => i === 0 || v >= a[i - 1]), 'kvartiliai didėja');

console.log('\n── 3. Punktai · likvidumas (ribos 26 / 13 = P75 / P25) ─────');
const rasti = (c, k) => R.punktai(c).filter((p) => p.k === k);
let p = rasti({ marke: 'PORSCHE', modelis: 'CAYENNE' }, 'LIKVIDUMAS');
T(p.length === 1 && p[0].lygis === R.LYGIS.PATVIRTINTA, 'Porsche Cayenne (31,7 %) → 🟢 judrus');
// ATSAKYMU 8 sk. rasyta, kad 530 „letuma rodo ne apyvartumas, o nurasymai" -
// ir kodas su tuo sutinka: 13,2 % > 13 % ribos, tad punkto nera. Bet tame
// paciame skyriuje 530 pateiktas kaip letojo pavyzdys. Antra karta ta pati
// forma: dokumento pavyzdys ir dokumento riba nesutaria.
T(rasti({ marke: 'BMW', modelis: '530' }, 'LIKVIDUMAS').length === 0,
  'BMW 530 (13,2 %) → likvidumo punkto NĖRA (riba ≤ 13)');
p = rasti({ marke: 'VW', modelis: 'PASSAT' }, 'LIKVIDUMAS');
T(p.length === 0, 'VW Passat (13,8 %) → punkto nėra');
T(rasti({ marke: 'OPEL', modelis: 'SINTRA' }, 'LIKVIDUMAS').length === 1,
  'Opel Sintra (0,6 %) → 🟡 tikrai lėtas');
T(rasti({ marke: 'BMW', modelis: 'X5' }, 'LIKVIDUMAS').length === 0,
  'BMW X5 (25,8 %) → punkto nėra (0,2 p. p. iki ribos)');

console.log('\n── 4. Ridos percentilis · TIK km/metus, NE absoliuti rida ──');
const METAI = new Date().getFullYear();
// Lemiamas testas. Absoliuti rida uzfiksuota registracijos metu, tad jos
// pasiskirstyme guli ir ka tik ivezti jauni automobiliai. Naudojant `rida_kv`,
// visiskai NORMALUS 2-4 metu X5 nukristu zemiau P10 ir gautu klaidinga 🟡.
[2, 3, 4, 5, 10].forEach((a) => {
  const rida = Math.round(x5.kmmet_med * a);   // vaziuoja TIKSLIAI mediana
  const q = rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - a, rida }, 'RIDOS NORMA');
  T(q.length === 0, a + ' m. X5, rida tiksliai pagal medianą (' + rida + ' km) → punkto NĖRA');
});
// A-30: palyginimas TIK savo amžiaus juostoje. Jauni X5 važinėja mažai
// (0-3 m. P10 = 6 393 km/met), todėl 3 m. su 20 000 km (6 667/met) jau NĖRA
// įtartinas - anksčiau, pagal sudėtą kmmet_kv (P10 11 132), buvo 🟡.
lygu(R.amziausJuosta(x5, 3) && R.amziausJuosta(x5, 3).raktas, '0-3', 'amziausJuosta(X5, 3) → 0-3');
lygu(R.amziausJuosta(x5, 12) && R.amziausJuosta(x5, 12).raktas, '10-12', 'amziausJuosta(X5, 12) → 10-12');
lygu(R.amziausJuosta(x5, 41), null, 'už paskutinės juostos → null');
T(rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 3, rida: 20000 }, 'RIDOS NORMA').length === 0,
  '3 m. X5 su 20 000 km → punkto NĖRA (savo juostoje virš P10)');
// Lemiamas A-30 atvejis: 3 m. X5 su 100 000 km pagal sudėtą rida_kv būtų
// „žemiau P10", o savo juostoje jis ties P90. Punkto būti negali.
T(rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 3, rida: 100000 }, 'RIDOS NORMA').length === 0,
  '3 m. X5 su 100 000 km → punkto NĖRA (juostoje ties P90, ne P10)');
// Priešinga kryptis: 12 m. X5 su 140 000 km (11 667/met) sudėtame kmmet_kv
// buvo virš P10 (11 132) ir praslysdavo; savo juostoje (P10 13 374) - žemiau.
T(rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 12, rida: 140000 }, 'RIDOS NORMA').length === 1,
  '12 m. X5 su 140 000 km → 🟡 (juostoje žemiau P10; sudėtas pjūvis to nematė)');
p = rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 3, rida: 15000 }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.SIGNALAS, '3 m. X5 su 15 000 km → 🟡 (tikrai mažai ir juostoje)');
T(p.length === 1 && /0–3 metų/.test(p[0].tekstas), 'tekste pasakyta, su kuria amžiaus juosta lyginta');
T(p.length === 1 && /10 %/.test(p[0].tekstas), 'tekste sakoma „tarp 10 % mažiausiai važiavusių"');
T(p.length === 1 && /Paklauskite/.test(p[0].tekstas), 'tekstas baigiasi KLAUSIMU pardavėjui');
p = rasti({ marke: 'BMW', modelis: 'X5', metai: null, rida: 60000 }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.NEZINOMA, 'be metų → ⚪, ne tyla');
p = rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 10, rida: null }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.NEZINOMA, 'be ridos → ⚪, ne tyla');

// A-32 · atsarga, kai juostos nėra: TIK 7-15 m. ir tik kai kmmet_n >= 100.
// K-33: BMW 320 dabar = BMW 3 su visomis juostomis. Atsargos pavyzdys - SUBARU OUTBACK (kmmet_n 119, juostų nėra).
const b320 = R.kontekstas('SUBARU', 'OUTBACK');
lygu(R.amziausJuosta(b320, 10) && R.amziausJuosta(b320, 10).raktas, 'atsarga', 'SUBARU OUTBACK (juostų nėra), 10 m. → atsarga');
T(R.amziausJuosta(b320, 10).v[1] === b320.kmmet_kv[0], 'atsargos P10 = sudėtinio kmmet_kv P10');
lygu(R.amziausJuosta(b320, 6), null, '6 m. → atsargos NĖRA (jaunoms sudėtinis klysta 1,3-3,3 %)');
lygu(R.amziausJuosta(b320, 16), null, '16 m. → atsargos NĖRA (16-20 klaidingai žymėtų 5,8 %, 21+ – 23,7 %)');
lygu(R.amziausJuosta(R.kontekstas('KIA', 'CEED'), 10), null, 'mažos imties modelis KIA CEED (kmmet_n 84 < 100) → atsargos nėra');
p = rasti({ marke: 'SUBARU', modelis: 'OUTBACK', metai: METAI - 10, rida: 60000 }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.SIGNALAS, 'SUBARU OUTBACK, 10 m., 6 000 km/met → 🟡 per atsargą');
T(p.length === 1 && /visų amžių/.test(p[0].tekstas), 'tekste pasakyta, kad lyginta su visų amžių imtimi');
T(rasti({ marke: 'SUBARU', modelis: 'OUTBACK', metai: METAI - 16, rida: 60000 }, 'RIDOS NORMA')[0].lygis === R.LYGIS.NEZINOMA,
  'tas pats modelis 16 m. → ⚪, ne spėjimas');

console.log('\n── 5. Nurašymai · 15+ pjūvis, riba 40, amžiaus vartai 12 (A-29) ─');
T(rasti({ marke: 'OPEL', modelis: 'VECTRA', metai: METAI - 18 }, 'NURAŠYMAI').length === 1,
  'OPEL VECTRA (51,4 % tarp 15+), 18 m. → 🟡 (riba 40; K-33: BMW 5 dabar 28,2)');
T(rasti({ marke: 'FORD', modelis: 'FOCUS', metai: METAI - 17 }, 'NURAŠYMAI').length === 1,
  'Ford Focus (42,6 %), 17 m. → 🟡 (analitiko pavyzdys)');
T(rasti({ marke: 'FORD', modelis: 'FOCUS', metai: METAI - 5 }, 'NURAŠYMAI').length === 0,
  'tas pats Focus, bet 5 m. → punkto NĖRA (vartai daro atranką, ne riba)');
p = rasti({ marke: 'MAZDA', modelis: '323', metai: METAI - 20 }, 'NURAŠYMAI');
T(p.length === 1, 'Mazda 323 (83,3 %), 20 m. skelbimas → 🟡');
// AMZIAUS VARTAI: ta pati statistika 3 metu masinai nieko nesako.
T(rasti({ marke: 'MAZDA', modelis: '323', metai: METAI - 3 }, 'NURAŠYMAI').length === 0,
  'tas pats modelis, bet 3 m. skelbimas → punkto NĖRA (15+ statistika ne apie jį)');
T(rasti({ marke: 'MAZDA', modelis: '323', metai: METAI - 11 }, 'NURAŠYMAI').length === 0,
  '11 m. skelbimas → punkto nėra (vartai 12)');
T(rasti({ marke: 'MAZDA', modelis: '323', metai: METAI - 12 }, 'NURAŠYMAI').length === 1,
  '12 m. skelbimas → punktas yra (vartai atsidaro)');
T(rasti({ marke: 'MAZDA', modelis: '323' }, 'NURAŠYMAI').length === 0,
  'be metų → punkto nėra (amžiaus nežinom, tad ir nesakom)');
T(p.length === 1 && /15\+/.test(p[0].tekstas), 'tekste pasakyta, kad tai 15+ metų pjūvis');
T(rasti({ marke: 'SKODA', modelis: 'KAROQ', metai: METAI - 10 }, 'NURAŠYMAI').length === 0,
  'Škoda Karoq → punkto nėra (senų nėra, o 1,0 % nereikštų nieko)');
T(rasti({ marke: 'PORSCHE', modelis: 'CAYENNE', metai: METAI - 16 }, 'NURAŠYMAI').length === 0,
  'Cayenne (18,3 %) → punkto nėra');

console.log('\n── 6. Kuras · mūsų žodynas TURI suvestis į Regitros ─────────');
// Be sito punktas tyliai nedirbtu, ir niekas to nepastebetu.
lygu(R.kuroRaktas('Benzinas / elektra'), 'benzinas/elektra', "kuroRaktas('Benzinas / elektra')");
lygu(R.kuroRaktas('Hibridas'), 'benzinas/elektra', "kuroRaktas('Hibridas')");
lygu(R.kuroRaktas('Elektrinis'), 'elektra', "kuroRaktas('Elektrinis')");
lygu(R.kuroRaktas('dyzelis'), 'dyzelinas', "kuroRaktas('dyzelis')");
T(R.kuroDalis(x5, 'Dyzelinas') === 69, 'BMW X5 · Dyzelinas → 69 %');
T(R.kuroDalis(x5, 'Benzinas') === 14, 'BMW X5 · Benzinas → 14 %');
T(R.kuroDalis(x5, 'Bioetanolis') === null, 'nėra tarp trijų didžiausių → null, o ne 0');
p = rasti({ marke: 'BMW', modelis: 'X5', kuras: 'Benzinas' }, 'KURAS');
T(p.length === 1 && p[0].lygis === R.LYGIS.SIGNALAS, 'X5 benzininis (14 %) → 🟡 siauresnis ratas');
T(rasti({ marke: 'BMW', modelis: 'X5', kuras: 'Dyzelinas' }, 'KURAS').length === 0,
  'X5 dyzelinis (68 %) → punkto nėra');
T(rasti({ marke: 'BMW', modelis: 'X5', kuras: 'Bioetanolis' }, 'KURAS').length === 0,
  'nesuvestas kuras → punkto nėra (o ne melagingas 0 %)');

console.log('\n── 7. Nežinomas modelis → ⚪, niekada „0" ──────────────────');
const nz = R.punktai({ marke: 'NĖRATOKIOS', modelis: 'NIEKO', metai: METAI - 5, rida: 100000 });
T(nz.length === 1 && nz[0].lygis === R.LYGIS.NEZINOMA, 'vienas ⚪ punktas');
T(!nz.some((q) => /\b0\b/.test(q.tekstas)), 'tekste nėra nulio');

console.log('\n── 8. Balo nekeičia ir žodžių nevartoja ────────────────────');
const visi = []
  .concat(R.punktai({ marke: 'BMW', modelis: 'X5', metai: METAI - 12, rida: 40000, kuras: 'Benzinas' }))
  .concat(R.punktai({ marke: 'BMW', modelis: '530', metai: METAI - 15, rida: 50000, kuras: 'Dyzelinas' }))
  .concat(R.punktai({ marke: 'MAZDA', modelis: '323', metai: METAI - 20, rida: 300000, kuras: 'Benzinas' }));
T(visi.length > 0, 'punktų sugeneruota: ' + visi.length);
T(visi.every((q) => !R.tikrintiTeksta(q.tekstas)), 'nė viename tekste nėra uždraustų žodžių');
T(visi.every((q) => q.lygis && q.k && q.tekstas), 'kiekvienas punktas turi lygį, vardą ir tekstą');
T(visi.every((q) => !('balas' in q) && !('score' in q)), 'punktai neneša balo lauko');
[' rida atsukta ', 'RIDA ATSUKTA', 'suklastota rida', 'neatitinka tikrovės', 'pardavėjas meluoja']
  .forEach((t) => T(!!R.tikrintiTeksta(t), 'uždraustas tekstas pagaunamas: „' + t.trim() + '"'));
T(!R.tikrintiTeksta('Paklauskite pardavėjo dėl serviso istorijos.'), 'leistinas tekstas praeina');

console.log('\n── 9. Failo nėra → serveris pakyla, punktų nėra ────────────');
(() => {
  const fs = require('fs');
  const tikras = path.join(__dirname, '..', 'duomenys', 'regitra-modeliai.json');
  const atsarga = tikras + '.testas-atsarga';
  fs.renameSync(tikras, atsarga);
  try {
    const se = console.error; const zurnalas = [];
    console.error = (...a) => zurnalas.push(a.join(' '));
    const m = R.ikelti();
    console.error = se;
    T(m === null, 'meta() → null (funkcija dingsta matomai)');
    T(R.kontekstas('BMW', 'X5') === null, 'konteksto nėra');
    lygu(R.punktai({ marke: 'BMW', modelis: 'X5' }), [], 'punktų nėra (tyla, ne melagingas ⚪)');
    T(zurnalas.some((z) => /NEPAVYKO ikelti/.test(z)), 'į žurnalą įrašyta klaida');
  } finally {
    fs.renameSync(atsarga, tikras);
    R.ikelti();
  }
})();

console.log('\n── Skelbimo pusė: markė modelyje (Z-85 regresija) ─────────');
// Iki v2.5.6 skelbimai `marke` neturėjo → kiekvienas gavo ⚪ „registre nėra".
{
  const atv = [
    [undefined, 'BMW X5', 'BMW X5'], [undefined, 'Mercedes-Benz E 220', 'MERCEDES E'],
    [undefined, 'Volkswagen Golf', 'VW GOLF'], [undefined, 'Škoda Octavia', 'SKODA OCTAVIA'],
    [undefined, 'Land Rover Range Rover Sport', 'LAND ROVER RANGE'], [undefined, 'bmw x5', 'BMW X5'],
    ['BMW', 'X5', 'BMW X5'], ['Mercedes-Benz', 'Mercedes-Benz Klasa E', 'MERCEDES E'],
    ['Mercedes-Benz', 'E klasė', 'MERCEDES E'], ['Mercedes-Benz', 'E-Klasse', 'MERCEDES E'],
    ['BMW', 'Audi A6', 'AUDI A6'],
  ];
  for (const [mk, mo, laukta] of atv) {
    const r = R.kontekstas(mk, mo);
    lygu(r && r.modelis, laukta, 'kontekstas(' + mk + ', "' + mo + '")');
  }
  const p = R.punktai({ modelis: 'BMW X5', metai: 2019, rida: 150000 });
  T(!p.some((x) => x.k === 'LT REGISTRAS'), 'skelbimas be `marke` NEgauna ⚪ „registre nėra"');
  lygu(R.punktai({ modelis: 'Nezinomas' }), [], '„Nezinomas" → jokio punkto (ne ⚪)');
}

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + patikru : '✓ ' + patikru + '/' + patikru + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
