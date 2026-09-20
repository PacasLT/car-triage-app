// regitra.test.js — Regitros integracijos sargas.
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

console.log('\n── 0. Duomenys ─────────────────────────────────────────────');
T(!!meta, 'JSON įkeltas');
T(meta && meta.modeliu >= 1000, 'modelių bent 1000 (' + (meta && meta.modeliu) + ')');
console.log('       sugeneruota: ' + (meta && meta.sugeneruota));

console.log('\n── 1. Normalizavimas · turi atitikti regitra-suvestine.py ──');
lygu(R.baziniModelis('BMW', 'X5 XDRIVE30D'), 'BMW X5', "baziniModelis('BMW','X5 XDRIVE30D')");
lygu(R.baziniModelis('VOLKSWAGEN. VW', 'VW PASSAT'), 'VW PASSAT', "baziniModelis('VOLKSWAGEN. VW','VW PASSAT')");
lygu(R.baziniModelis('TOYOTA', 'TOYOTA RAV4'), 'TOYOTA RAV4', "baziniModelis('TOYOTA','TOYOTA RAV4')");
lygu(R.markeNorm('MERCEDES-BENZ'), 'MERCEDES', "markeNorm('MERCEDES-BENZ')");
lygu(R.markeNorm('LAND-ROVER'), 'LAND ROVER', "markeNorm('LAND-ROVER')");
lygu(R.baziniModelis('BMW', ''), null, 'tuščias modelis → null');
lygu(R.baziniModelis('TOYOTA', 'TOYOTA'), null, 'modelis = vien markė → null');
lygu(R.baziniModelis(null, null), null, 'null įvestis → null (nekrenta)');

console.log('\n── 2. Kontekstas · tikri skaičiai iš 2026-07-03 failo ──────');
const x5 = R.kontekstas('BMW', 'X5');
lygu(x5 && x5.parkas, 11878, "kontekstas('BMW','X5').parkas");
lygu(x5 && x5.apyv_pct, 22.1, "kontekstas('BMW','X5').apyv_pct");
lygu(x5 && x5.kmmet_med, 17323, "kontekstas('BMW','X5').kmmet_med");
const q5 = R.kontekstas('AUDI', 'Q5');
lygu(q5 && q5.kilme && q5.kilme[0], ['DEU', 381], "kontekstas('AUDI','Q5').kilme[0]");
lygu(R.kontekstas('BMW', '530').neleid_pct, 41.9, "kontekstas('BMW','530').neleid_pct");
lygu(R.kontekstas('NĖRATOKIOS', 'NIEKO'), null, 'nežinomas modelis → null, ne klaida');
T(R.kontekstas('BMW', 'X5 XDRIVE40D') === x5, 'variantas veda į tą patį bazinį įrašą');

console.log('\n── 3. Punktai · likvidumas ─────────────────────────────────');
const rasti = (c, k) => R.punktai(c).filter((p) => p.k === k);
let p = rasti({ marke: 'BMW', modelis: 'X5' }, 'LIKVIDUMAS');
T(p.length === 1 && p[0].lygis === R.LYGIS.PATVIRTINTA, 'BMW X5 (22,1 %) → 🟢 judrus');
p = rasti({ marke: 'VW', modelis: 'PASSAT' }, 'LIKVIDUMAS');
T(p.length === 1 && p[0].lygis === R.LYGIS.SIGNALAS, 'VW Passat (11,4 %) → 🟡 lėtas');
// RIBA YRA GRIEŽTA `< 12`, ir tai verta atskiros patikros.
// Specifikacijos 4.1 lentelėje BMW 530 (12,1 %) pateiktas kaip „lėto" pavyzdys,
// bet pati riba abiejose vietose parašyta „žemiau 12 %". 530 į ją nepatenka
// 0,1 procentinio punkto. Kodas laikosi RIBOS, ne pavyzdžio - jei Lukas
// nuspręs kitaip, keičiama `RIBOS.apyvLetas`, ir šis testas pasakys, kad
// elgsena pasikeitė.
T(rasti({ marke: 'BMW', modelis: '530' }, 'LIKVIDUMAS').length === 0,
  'BMW 530 (12,1 %) → likvidumo punkto NĖRA (riba griežta: < 12)');
T(rasti({ marke: 'HYUNDAI', modelis: 'SANTA' }, 'LIKVIDUMAS').length === 0,
  'lygiai 12,0 % → punkto nėra (riba neįskaitoma)');
p = rasti({ marke: 'VW', modelis: 'TOUAREG' }, 'LIKVIDUMAS');
T(p.length === 0, 'VW Touareg (18,6 %) → punkto NĖRA (12–20 % nieko nesako)');

console.log('\n── 4. Punktai · ridos norma ────────────────────────────────');
const METAI = new Date().getFullYear();
// BMW X5: mediana 17 323 km/metus. 10 metų → laukiama ~173 000.
p = rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 10, rida: 60000 }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.SIGNALAS, 'rida 60 000 prie laukiamų ~173 000 → 🟡');
T(p.length === 1 && /Paklauskite/.test(p[0].tekstas), 'tekstas baigiasi KLAUSIMU pardavėjui');
p = rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 10, rida: 170000 }, 'RIDOS NORMA');
T(p.length === 0, 'įprasta rida → punkto nėra („rida normali" nėra žinia)');
p = rasti({ marke: 'BMW', modelis: 'X5', metai: null, rida: 60000 }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.NEZINOMA, 'be metų → ⚪, ne tyla');
p = rasti({ marke: 'BMW', modelis: 'X5', metai: METAI - 10, rida: null }, 'RIDOS NORMA');
T(p.length === 1 && p[0].lygis === R.LYGIS.NEZINOMA, 'be ridos → ⚪, ne tyla');

console.log('\n── 5. Punktai · retumas ir nurašymai ───────────────────────');
p = rasti({ marke: 'BMW', modelis: '530' }, 'NURAŠYMAI');
T(p.length === 1 && /41\.9|41,9/.test(p[0].tekstas), 'BMW 530 (41,9 %) → 🟡 nurašymai');
p = rasti({ marke: 'BMW', modelis: 'X5' }, 'NURAŠYMAI');
T(p.length === 0, 'BMW X5 (11,6 %) → nurašymų punkto nėra');
T(rasti({ marke: 'AUDI', modelis: 'Q5' }, 'RETUMAS').length === 0, 'Audi Q5 (12 968) → retumo punkto nėra');

console.log('\n── 6. Nežinomas modelis → ⚪, niekada „0" ──────────────────');
const nz = R.punktai({ marke: 'NĖRATOKIOS', modelis: 'NIEKO', metai: METAI - 5, rida: 100000 });
T(nz.length === 1 && nz[0].lygis === R.LYGIS.NEZINOMA, 'vienas ⚪ punktas');
T(!nz.some((q) => /\b0\b/.test(q.tekstas)), 'tekste nėra nulio');

console.log('\n── 7. Balo nekeičia ir žodžių nevartoja ────────────────────');
const visi = []
  .concat(R.punktai({ marke: 'BMW', modelis: 'X5', metai: METAI - 12, rida: 40000 }))
  .concat(R.punktai({ marke: 'BMW', modelis: '530', metai: METAI - 15, rida: 50000 }))
  .concat(R.punktai({ marke: 'AUDI', modelis: 'Q5', metai: METAI - 8, rida: 30000 }));
T(visi.length > 0, 'punktų sugeneruota: ' + visi.length);
T(visi.every((q) => !R.tikrintiTeksta(q.tekstas)), 'nė viename tekste nėra uždraustų žodžių');
T(visi.every((q) => q.lygis && q.k && q.tekstas), 'kiekvienas punktas turi lygį, vardą ir tekstą');
T(visi.every((q) => !('balas' in q) && !('score' in q)), 'punktai neneša balo lauko');
[' rida atsukta ', 'RIDA ATSUKTA', 'suklastota rida', 'neatitinka tikrovės', 'pardavėjas meluoja']
  .forEach((t) => T(!!R.tikrintiTeksta(t), 'uždraustas tekstas pagaunamas: „' + t.trim() + '"'));
T(!R.tikrintiTeksta('Paklauskite pardavėjo dėl serviso istorijos.'), 'leistinas tekstas praeina');

console.log('\n── 8. Failo nėra → serveris pakyla, punktų nėra ────────────');
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

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + patikru : '✓ ' + patikru + '/' + patikru + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
