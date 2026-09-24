// mediana.test.js — atspari rinkos mediana (Nr. 43).
//
//     node backend/testai/mediana.test.js
//
// Priklausomybių nereikia. Skaičiai – TIKRI, iš archyvo (2026-09-21):
// 2023+ benzininiai BMW X5, autoplius + autogidas, 23 skelbimai.

const path = require('path');
const M = require(path.join(__dirname, '..', 'rinkos-mediana.js'));
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

const X5 = [14000, 21600, 22200, 23000, 24500, 31500, 51900, 52900, 60000, 62700, 66899, 73491,
  73491, 73900, 76500, 77500, 84999, 87560, 92771, 92771, 93492, 93492, 99900];
const pries = [...X5].sort((a, b) => a - b)[Math.floor(X5.length / 2)];

console.log('\n── 1. Tikra imtis: X5 2023+ benzinas ─────────────────────');
const r = M.atspariMediana(X5);
T(pries === 73491, 'senoji mediana 73 491 (atkartota)');
T(r.median > pries, 'naujoji mediana didesnė: ' + r.median);
T(r.atmesta === 5, 'atmesta 5 kainos po 29 396 (0,4 × medianos): ' + r.atmesta);
const skirtumasSenas = Math.round((92771 - pries) / pries * 100);
const skirtumasNaujas = Math.round((92771 - r.median) / r.median * 100);
T(skirtumasSenas >= 26 && skirtumasNaujas < skirtumasSenas,
  '92 771 € skelbimas: +' + skirtumasSenas + ' % → +' + skirtumasNaujas + ' % (Luko „+30 %" mažėja)');

console.log('\n── 2. Absoliutūs rėmai ────────────────────────────────────');
const a = M.atspariMediana([30000, 31000, 32000, 33000, 35000, 92000117843, 900]);
T(a.median === 32000 && a.atmesta === 2, '92 mlrd. (absoliutus rėmas) ir 900 € (santykinis) neįeina: mediana ' + a.median);
// Riba, kurią verta žinoti: 900 € praeina absoliutų rėmą (500 €), o santykinis
// taikomas tik nuo 5 kainų. Mažoje imtyje tokia kaina lieka - tyčia.
const mazas = M.atspariMediana([30000, 32000, 35000, 900]);
T(mazas.atmesta === 0 && mazas.count === 4, 'imtis 4 su 900 €: santykinio rėmo nėra, kaina lieka (žinoma riba)');

console.log('\n── 3. Maža imtis — santykinių rėmų nėra ──────────────────');
const m = M.atspariMediana([5000, 20000, 21000]);
T(m.median === 20000 && m.count === 3 && m.atmesta === 0, 'imtis 3: niekas neatmetama (pirminė mediana nepatikima)');

console.log('\n── 4. Sveika imtis nepaliečiama ──────────────────────────');
const sv = M.atspariMediana([40000, 42000, 45000, 47000, 50000, 52000, 55000]);
T(sv.atmesta === 0 && sv.median === 47000, 'be išskirčių: nieko neatmesta, mediana 47 000');

console.log('\n── 5. computeMarketMedians — ta pati sąsaja ──────────────');
const l = X5.map((k, i) => ({ modelis: 'BMW X5', kaina: k, rida: 20000 + i * 1000 }));
l.push({ modelis: 'BMW X5', kaina: 5500, kainosIspejimas: { tipas: 'lizingo-imoka' } });
const cm = M.computeMarketMedians(l)['BMW X5'];
T(cm.median === r.median && cm.count === r.count, 'mediana ir imtis sutampa su atspariMediana');
T(cm.ridaMedian > 0 && cm.ridaCount === 23, 'rida skaičiuojama kaip anksčiau (23)');
T(['median', 'count', 'ridaMedian', 'ridaCount'].every((k) => k in cm), 'visi seni laukai yra');

console.log('\n── v2.10.6: kartos fazės grupė ────────────────────────────');
{
  const L = [];
  [60000, 62000, 63000, 64000, 65000, 66000].forEach((k) => L.push({ modelis: 'X5', kaina: k, rinkosGrupe: 'G05' }));
  [85000, 87000, 88000, 90000, 92000].forEach((k) => L.push({ modelis: 'X5', kaina: k, rinkosGrupe: 'G05 LCI' }));
  L.push({ modelis: 'X5', kaina: 75000 }); // atnaujinimo metai – be grupės
  const md = M.computeMarketMedians(L).X5;
  T(md.grupes['G05 LCI'].median === 88000 && md.grupes['G05 LCI'].count === 5, 'G05 LCI grupės mediana 88 000 (5)');
  T(md.grupes['G05'].count === 6, 'G05 grupėje 6');
  const lyg = M.lyginimoMediana(md, 'G05 LCI');
  T(lyg.grupe === 'G05 LCI' && lyg.median === 88000, 'LCI skelbimas lyginamas su LCI mediana, ne su visu modeliu (' + md.median + ')');
  const d = Math.round((88000 - 85000) / 88000 * 100), dSenas = Math.round((md.median - 85000) / md.median * 100);
  T(dSenas < 0 && d > 0, '85 000 € LCI: vs visas modelis ' + dSenas + ' % (atrodo brangus) → vs LCI +' + d + ' % pigiau');
  const maza = M.computeMarketMedians(L.slice(0, 4).concat([{ modelis: 'X5', kaina: 90000, rinkosGrupe: 'G05 LCI' }])).X5;
  T(M.lyginimoMediana(maza, 'G05 LCI').grupe === null, 'grupėje < 5 → lyginama su visu modeliu');
  T(M.lyginimoMediana(md, null).median === md.median, 'be grupės → modelio mediana');
  // A-41: pirmenybės tvarka – fazė, tada visa karta
  const L2 = [60000, 61000, 62000, 88000, 89000, 90000].map((k, i) => ({ modelis: 'X5', kaina: k, rinkosGrupes: i < 3 ? ['G05 iki LCI', 'G05 visa karta'] : ['G05 LCI', 'G05 visa karta'] }));
  const md2 = M.computeMarketMedians(L2).X5;
  const l2 = M.lyginimoMediana(md2, ['G05 LCI', 'G05 visa karta']);
  T(l2.grupe === 'G05 visa karta' && l2.count === 6, 'LCI grupėje < 5 → visa karta (6)');
  T(M.lyginimoMediana(md2, ['G05 visa karta']).grupe === 'G05 visa karta', 'atnaujinimo metai → visa karta');
}


// AN-0923-NAUJAS: „naujas" grupei užtenka 3 kainų, kitoms – 5.
{
  const md = { median: 20000, count: 40, grupes: {
    naujas: { median: 31000, count: 3 },
    'G05 LCI': { median: 26000, count: 3 },
  } };
  const n = M.lyginimoMediana(md, ['naujas', 'G05 visa karta']);
  T(n.grupe === 'naujas' && n.median === 31000, 'naujas: 3 kainų užtenka');
  const k = M.lyginimoMediana(md, ['G05 LCI', 'G05 visa karta']);
  T(k.grupe === null && k.median === 20000, 'kitoms grupėms 3 kainų per mažai – lieka viso modelio mediana');
  T(M.MIN_NAUJU_GRUPEI === 3 && M.MIN_GRUPEI === 5, 'ribos: naujas 3, kitos 5');
}

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
