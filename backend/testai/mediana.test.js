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

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
