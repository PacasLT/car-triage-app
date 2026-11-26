// Sargas: archyvo skelbimai į medianą tik tame pačiame rėžyje.
// Pamatuotas atvejis, dėl kurio šis failas yra – PATIKRA-2026-11-26.md §3:
// „BMW 5, 2024+" paieška, o mediana 21 950 € ir ridos mediana 221 000 km,
// nes į ją lipo 2010–2023 m. 540-ieji iš archyvo.
const r = require('../archyvo-rezis.js');

let k = 0;
const ok = (sal, pav) => { if (!sal) { console.error('✗ ' + pav); k++; } };

// ── 1. Tikrasis atvejis ──────────────────────────────────────────────────────
const f2024 = { metaiNuo: '2024' };
ok(r.telpa({ metai: 2024, rida: 34300, kaina: 59900 }, f2024) === true, '2024 m. telpa į 2024+');
ok(r.telpa({ metai: 2019, rida: 221000, kaina: 21950 }, f2024) === false, '2019 m. NETELPA į 2024+');
ok(r.telpa({ metai: 2023, rida: 90000 }, f2024) === false, '2023 m. netelpa į 2024+ (riba griežta)');
ok(r.telpa({ metai: 2026 }, f2024) === true, '2026 m. telpa į 2024+');

// ── 2. Metų neturintis įrašas ────────────────────────────────────────────────
ok(r.telpa({ rida: 50000 }, f2024) === false, 'be metų + metų rėžis = neimam');
ok(r.telpa({ metai: null }, f2024) === false, 'metai null + rėžis = neimam');
ok(r.telpa({ metai: '' }, f2024) === false, 'metai tuščia eilutė + rėžis = neimam');
ok(r.telpa({ rida: 50000 }, {}) === true, 'be metų ir BE rėžio = imam');

// ── 3. Metai kaip eilutė (taip juos grąžina archyvas) ────────────────────────
ok(r.telpa({ metai: '2024' }, f2024) === true, 'metai eilute „2024" telpa');
ok(r.telpa({ metai: '2019' }, f2024) === false, 'metai eilute „2019" netelpa');

// ── 4. Abi ribos ─────────────────────────────────────────────────────────────
const f1820 = { metaiNuo: '2018', metaiIki: '2020' };
ok(r.telpa({ metai: 2018 }, f1820) === true, '2018 telpa į 2018-2020');
ok(r.telpa({ metai: 2020 }, f1820) === true, '2020 telpa į 2018-2020');
ok(r.telpa({ metai: 2017 }, f1820) === false, '2017 netelpa');
ok(r.telpa({ metai: 2021 }, f1820) === false, '2021 netelpa');
ok(r.telpa({ metai: 2019 }, { metaiIki: '2020' }) === true, 'tik virsutine riba');

// ── 5. Rida ──────────────────────────────────────────────────────────────────
ok(r.telpa({ metai: 2024, rida: 90000 }, { ridaIki: '100000' }) === true, 'rida po ribos telpa');
ok(r.telpa({ metai: 2024, rida: 120000 }, { ridaIki: '100000' }) === false, 'rida virs ribos netelpa');
ok(r.telpa({ metai: 2024 }, { ridaIki: '100000' }) === true, 'be ridos + ridos riba = IMAM (kitaip prarastume per daug imties)');
ok(r.telpa({ metai: 2024, rida: 100000 }, { ridaIki: '100000' }) === true, 'rida lygi ribai telpa');

// ── 6. Be filtru nieko neismetam ─────────────────────────────────────────────
ok(r.telpa({ metai: 2005, rida: 400000 }, {}) === true, 'be filtru - viskas telpa');
ok(r.telpa({ metai: 2005 }, null) === true, 'filtrai null - telpa');

// ── 7. filtruoti() ───────────────────────────────────────────────────────────
const sar = [
  { metai: 2024, kaina: 59900 }, { metai: 2019, kaina: 21950 },
  { metai: 2025, kaina: 62000 }, { kaina: 30000 }, { metai: 2010, kaina: 9000 },
];
const fr = r.filtruoti(sar, f2024);
ok(fr.imti.length === 2, 'filtruoti: imam 2 is 5 (gauta ' + fr.imti.length + ')');
ok(fr.atmesta === 3, 'filtruoti: atmesta 3 (gauta ' + fr.atmesta + ')');
ok(r.filtruoti(sar, {}).imti.length === 5, 'filtruoti be rezio: visi 5');
ok(r.filtruoti(null, f2024).imti.length === 0, 'filtruoti(null) nesugriuva');

// ── 8. SVARBIAUSIA: ar mediana pasikeicia taip, kaip tikimes ─────────────────
// Senas elgesys: visi 21 skelbimas -> mediana apie 21 950.
// Naujas: tik 2024+ -> mediana apie 59 900.
const senas = [{ metai: 2024, kaina: 59900 }].concat(
  Array.from({ length: 20 }, (_, i) => ({ metai: 2015 + (i % 8), kaina: 18000 + i * 400 })));
const med = (a) => { const v = a.map((x) => x.kaina).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
ok(med(senas) < 30000, 'be filtro mediana per maza (gauta ' + med(senas) + ')');
const nauj = r.filtruoti(senas, f2024).imti;
ok(nauj.length === 1 && med(nauj) === 59900, 'su filtru mediana 59 900 (gauta ' + med(nauj) + ')');

if (k) { console.error('\n' + k + ' klaida(os)'); process.exit(1); }
console.log('✓ archyvo-rezis: 29 patikros');
