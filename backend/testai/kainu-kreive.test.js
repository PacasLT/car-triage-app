// kainu-kreive.test.js — kainos prognozė pagal amžių, ridą, galią, kurą (v2.28.0).
//
//     node backend/testai/kainu-kreive.test.js
//
// Kodėl sargas: čia trys vietos, kur klaida nekrenta, o tyliai meluoja vartotojui
// pinigais:
//   (1) KURO NORMALIZACIJA. Portalai rašo „Benzinas / elektra", koeficientų raktas
//       yra „k_benzinas/elektra". Nesutapus priedas tyliai neprisideda ir prognozė
//       pasislenka – niekas nenukrenta.
//   (2) LOG vs PROCENTAI. `likutis_q` yra likučių kvantiliai LOG skalėje. Jei
//       lygintume (kaina/prognozė − 1), prie ±0,29 riba suveiktų ne ten, kur turi,
//       ir „pigesnis nei 90 %" atsirastų skelbimams, kurie tokie nėra.
//   (3) GALIOJIMO RIBOS. Už imties ribų kreivė ekstrapoliuoja. Jei riba neveikia,
//       20 metų automobiliui būtų parodyta prognozė, pagrįsta 1–16 metų imtimi.
const K = require('../kainu-kreive');
const fs = require('fs');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── Failas ir jo forma ──────────────────────────────────────────────────────
T(fs.existsSync(K.FAILAS), 'koeficientų failas yra vietoje');
const v = K.versija();
T(!!v && v.modeliu === 14, 'faile 14 modelių (gauta: ' + (v ? v.modeliu : 'nėra') + ')');
const m = K.kreive('BMW X5');
T(!!m, 'BMW X5 kreivė randama');
T(!!K.kreive('bmw x5'), 'raktas nejautrus registrui');
T(K.kreive('OPEL ASTRA') === null, 'nežinomo modelio nespėliojam');
['n', 'r2', 'mae_pct', 'baze_kuras', 'koef', 'likutis_q', 'sigma', 'galioja', 'mediana_kaina']
  .forEach((f) => T(m[f] !== undefined, 'BMW X5 turi lauką „' + f + '"'));
T(Array.isArray(m.likutis_q) && m.likutis_q.length === 5, 'likutis_q – penki kvantiliai');
T(m.likutis_q.every((x, i, a) => i === 0 || a[i - 1] <= x), 'kvantiliai didėjantys');

// ── (1) Kuro normalizacija ──────────────────────────────────────────────────
const nk = K.normKuras;
T(nk('Dyzelinas') === 'dyzelinas', 'didžioji raidė');
T(nk('Benzinas / elektra') === 'benzinas/elektra', 'tarpai aplink brūkšnį nupjaunami');
T(nk('Benzinas / elektra (plug-in)') === 'benzinas/elektra', 'skliaustai nupjaunami');
T(nk('Benzinas / gamtinės dujos') === 'benzinas/dujos', 'gamtinės dujos → dujos');
T(nk('Benzinas / dujos') === 'benzinas/dujos', 'dujos');
T(nk('Benzinas / elektra / dujos') === '', 'trijų kurų kombinacijos nėra sąraše – bazinis');
T(nk('') === '' && nk(null) === '', 'tuščias kuras nenukrenta');
T(K.LEIDZIAMI.has('elektra'), 'elektra yra leidžiamų sąraše');
// Kuro priedas TIKRAI pakeičia prognozę – jei raktas nesutaptų, šis testas krenta.
const be = K.prognoze(m, 5, 150000, 190, '');
const su = K.prognoze(m, 5, 150000, 190, 'benzinas');
T(Number.isFinite(be) && Number.isFinite(su) && Math.abs(su - be) > 1,
  'kuro priedas pakeičia prognozę (be: ' + Math.round(be) + ' €, benzinas: ' + Math.round(su) + ' €)');

// ── (2) Padėtis skaičiuojama log skalėje ────────────────────────────────────
const q = [-0.30, -0.12, 0.01, 0.14, 0.29];
T(K.padetis(-0.35, q).kodas === 'labai-pigus', 'žemiau P10 → pigesnis nei 90 %');
T(K.padetis(-0.30, q).kodas === 'labai-pigus', 'lygiai P10 įeina į P10 grupę');
T(K.padetis(-0.20, q).kodas === 'pigus', 'tarp P10 ir P25 → pigesnis nei 75 %');
T(K.padetis(0.00, q).kodas === 'atitinka', 'vidurys → atitinka lygį');
T(K.padetis(0.20, q).kodas === 'brangus', 'tarp P75 ir P90 → brangesnis nei 75 %');
T(K.padetis(0.35, q).kodas === 'labai-brangus', 'virš P90 → brangesnis nei 90 %');
T(K.padetis(0.1, null) === null, 'be kvantilių – nieko nerodom');
// Riba turi suveikti LOG skalėje. Kaina = prognozė × exp(-0,30) yra lygiai P10:
// procentais tai −25,9 %, ne −30 %. Jei kodas lygintų procentus, čia gautume
// „pigus", ne „labai-pigus" – tyliai per aukšta riba.
{
  const pr = K.prognoze(m, 5, 150000, 190, 'dyzelinas');
  // Kaina -23 % nuo prognozes. LOG skaleje log(0,77) = -0,261 <= P10 (-0,244)
  // -> pigesnis nei 90 %. Procentu skaleje -23 % > -24,4 % -> butu tik
  // pigesnis nei 75 %. Sis skelbimas atskiria dvi skales.
  const r = K.ivertinti({ raktas: 'BMW X5', metai: 2021, dabar: 2026, rida: 150000, galia: 190,
    kuras: 'Dyzelinas', kaina: pr * 0.77 });
  T(r.ok && r.padetis === 'labai-pigus',
    'kaina -23 % → pigesnis nei 90 % (log skalė, ne procentai; gauta: ' + (r.padetis || r.priezastis) + ')');
  const pct = Math.round((Math.exp(m.likutis_q[0]) - 1) * 1000) / 10;
  T(Math.abs(pct - m.likutis_q[0] * 100) > 2,
    'log ir procentai prie P10 skiriasi (' + pct + ' % vs ' + (m.likutis_q[0] * 100).toFixed(1) + ') – todėl skalė svarbi');
}

// ── (3) Galiojimo ribos ─────────────────────────────────────────────────────
const bazė = { raktas: 'BMW X5', metai: 2021, dabar: 2026, rida: 150000, galia: 190, kuras: 'Dyzelinas', kaina: 30000 };
const r0 = K.ivertinti(bazė);
T(r0.ok === true, 'normalus skelbimas įvertinamas');
T(r0.prognoze > 0 && Number.isFinite(r0.prognoze), 'prognozė yra skaičius: ' + r0.prognoze + ' €');
T(r0.lygis === 'patvirtinta', 'lygis – patvirtinta (suskaičiuotas faktas, ne spėjimas)');
T(Array.isArray(r0.rezis) && r0.rezis[0] < r0.prognoze && r0.rezis[1] > r0.prognoze, 'rėžis apgaubia prognozę');
T(r0.n === m.n && r0.maePct === m.mae_pct, 'imtis ir paklaida grąžinamos vartotojui');
const gl = m.galioja;
T(K.ivertinti(Object.assign({}, bazė, { metai: 2026 - (gl.amzius[1] + 3) })).priezastis === 'uz-ribu', 'per senas → už ribų');
T(K.ivertinti(Object.assign({}, bazė, { rida: gl.rida[1] + 50000 })).priezastis === 'uz-ribu', 'per didelė rida → už ribų');
T(K.ivertinti(Object.assign({}, bazė, { galia: gl.galia[1] + 100 })).priezastis === 'uz-ribu', 'per didelė galia → už ribų');
T((K.ivertinti(Object.assign({}, bazė, { rida: gl.rida[1] + 50000 })).uzRibu || []).includes('rida'), 'pasakoma, KURI reikšmė už ribų');

// ── Kada nerodom (analitiko 5 skyrius) ──────────────────────────────────────
T(K.ivertinti(Object.assign({}, bazė, { raktas: 'OPEL ASTRA' })).priezastis === 'modelio-nera', 'modelio nėra faile');
T(K.ivertinti(Object.assign({}, bazė, { raktas: null })).priezastis === 'nera-rakto', 'be rakto');
T(K.ivertinti(Object.assign({}, bazė, { rida: 500 })).priezastis === 'nera-ridos', 'rida < 1 000 km');
T(K.ivertinti(Object.assign({}, bazė, { rida: null })).priezastis === 'nera-ridos', 'ridos nėra');
T(K.ivertinti(Object.assign({}, bazė, { galia: null })).priezastis === 'nera-galios', 'galios nėra');
T(K.ivertinti(Object.assign({}, bazė, { metai: null })).priezastis === 'nera-metu', 'metų nėra');
T(K.ivertinti(Object.assign({}, bazė, { kaina: null })).priezastis === 'nera-kainos', 'kainos nėra');
T(K.ivertinti(Object.assign({}, bazė, { kainosIspejimas: { tekstas: 'lizingo įmoka' } })).priezastis === 'kainos-ispejimas',
  'lizingo įmoka – neskaičiuojam (ta pati riba kaip medianoje)');
T(K.ivertinti(Object.assign({}, bazė, { kaina: 0 })).ok !== true, 'nulinė kaina nenukrenta');

// ── Kryptis: pigesnis skelbimas negali atrodyti brangesnis ──────────────────
{
  const a = K.ivertinti(Object.assign({}, bazė, { kaina: 20000 }));
  const b = K.ivertinti(Object.assign({}, bazė, { kaina: 70000 }));
  T(a.skirtumas < b.skirtumas, 'didesnė kaina → didesnis skirtumas');
  T(a.ok && b.ok && ['labai-pigus', 'pigus'].includes(a.padetis) && ['brangus', 'labai-brangus'].includes(b.padetis),
    '20 000 € pigus, 70 000 € brangus tam pačiam automobiliui');
  // Didesnė rida turi MAŽINTI prognozę, didesnė galia – didinti.
  const d1 = K.ivertinti(Object.assign({}, bazė, { rida: 100000 })).prognoze;
  const d2 = K.ivertinti(Object.assign({}, bazė, { rida: 250000 })).prognoze;
  T(d1 > d2, 'didesnė rida → mažesnė prognozė (' + d1 + ' > ' + d2 + ')');
  const g1 = K.ivertinti(Object.assign({}, bazė, { galia: 170 })).prognoze;
  const g2 = K.ivertinti(Object.assign({}, bazė, { galia: 300 })).prognoze;
  T(g2 > g1, 'didesnė galia → didesnė prognozė (' + g2 + ' > ' + g1 + ')');
  const m1 = K.ivertinti(Object.assign({}, bazė, { metai: 2018 })).prognoze;
  const m2 = K.ivertinti(Object.assign({}, bazė, { metai: 2023 })).prognoze;
  T(m2 > m1, 'jaunesnis → didesnė prognozė (' + m2 + ' > ' + m1 + ')');
}

// ── Tekstas, kurį pamatys žmogus ────────────────────────────────────────────
{
  const r = K.ivertinti(Object.assign({}, bazė, { kaina: 20000 }));
  T(/amžiaus ir ridos/.test(r.tekstas), 'tekste pasakyta, SU KUO lyginta');
  T(!/prognozuojam|tikėtina ateityje|bus/i.test(r.tekstas), 'be prognozių apie ateitį');
  T(r.tekstas === r.tekstas.trim() && r.tekstas.length < 160, 'tekstas trumpas ir be tarpų galuose');
  T(/^[A-ZĄČĘĖĮŠŲŪŽ]/.test(r.tekstas), 'tekstas pradedamas didžiąja');
}

// ── Visi 14 modelių paskaičiuoja ────────────────────────────────────────────
{
  const d = JSON.parse(fs.readFileSync(K.FAILAS, 'utf8'));
  let ok = 0;
  for (const [rk, mm] of Object.entries(d.modeliai)) {
    const amz = Math.round((mm.galioja.amzius[0] + mm.galioja.amzius[1]) / 2);
    const rid = Math.round((mm.galioja.rida[0] + mm.galioja.rida[1]) / 2);
    const gal = Math.round((mm.galioja.galia[0] + mm.galioja.galia[1]) / 2);
    const r = K.ivertinti({ raktas: rk, metai: 2026 - amz, dabar: 2026, rida: rid, galia: gal,
      kuras: mm.baze_kuras, kaina: mm.mediana_kaina });
    if (r.ok && r.prognoze > 500 && r.prognoze < 200000) ok++;
    else console.log('      ↳ ' + rk + ': ' + JSON.stringify(r));
  }
  T(ok === 14, 'visi 14 modelių duoda prasmingą prognozę (gauta: ' + ok + ')');
}

console.log('\nkainu-kreive: ' + (n - klaidu) + '/' + n + ' ok' + (klaidu ? ', ' + klaidu + ' BLOGAI' : ''));
process.exit(klaidu ? 1 : 0);
