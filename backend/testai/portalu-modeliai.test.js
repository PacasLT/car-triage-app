// Sargas: modelio vardo vertimas į portalo adresą.
//
// Kiekvienas žemiau esantis atvejis atitinka PAMATUOTĄ skaičių
// (PATIKRA-2026-11-26.md §2). Sargas gina tris dalykus:
//   1. pamatuoti slug'ai nepasikeis tyliai;
//   2. modelis, kurio nežinom, NEPRALEIDZIAMAS kaip „visa markė";
//   3. markės, kurių lentelėje nėra, elgiasi kaip anksčiau (be regresijos).
const m = require('../portalu-modeliai.js');
const fs = require('fs');
const path = require('path');

let k = 0;
const ok = (sal, pav) => { if (!sal) { console.error('✗ ' + pav); k++; } };
const sl = (p, mk, mo) => m.slug(p, mk, mo);

// ── 1. autoscout24 · BMW serijos (pamatuota: be vertimo visos = 17 558) ──────
const AS_BMW = { '1': '1-series', '2': '2-series', '3': '3-series', '4': '4-series',
                 '5': '5-series', '6': '6-series', '7': '7-series', '8': '8-series' };
for (const [ui, slug] of Object.entries(AS_BMW)) {
  const r = sl('autoscout24', 'BMW', ui);
  ok(r.rastas === true && r.slug === slug, `AS24 BMW ${ui} -> ${slug} (gauta ${r.slug})`);
}

// ── 2. autoscout24 · Mercedes klasės (be vertimo visos = 206 489) ────────────
const AS_MB = { 'A Klasė': 'a-class', 'B Klasė': 'b-class', 'C Klasė': 'c-class',
                'E Klasė': 'e-class', 'S Klasė': 's-class', 'CLA Klasė': 'cla',
                'ML Klasė': 'm-class' };
for (const [ui, slug] of Object.entries(AS_MB)) {
  const r = sl('autoscout24', 'Mercedes-Benz', ui);
  ok(r.rastas === true && r.slug === slug, `AS24 MB "${ui}" -> ${slug} (gauta ${r.slug})`);
}
// „ml-class" buvo PATIKRINTAS ir grąžino 206 489 = visi Mercedes. Jei kada nors
// atsirastų lentelėje, tai būtų regresija.
ok(sl('autoscout24', 'Mercedes-Benz', 'ML Klasė').slug !== 'ml-class',
  'AS24 ML NEGALI buti „ml-class" - pamatuota, kad grazina visus Mercedes');

// ── 3. otomoto · BMW (be vertimo visos = 0, Lenkija tyliai iskrisdavo) ───────
for (let i = 1; i <= 8; i++) {
  const r = sl('otomoto', 'BMW', String(i));
  ok(r.rastas === true && r.slug === 'seria-' + i, `OT BMW ${i} -> seria-${i} (gauta ${r.slug})`);
}

// ── 4. otomoto · Mercedes: „c-klasa", NE „klasa-c" ──────────────────────────
const OT_MB = { 'A Klasė': 'a-klasa', 'B Klasė': 'b-klasa', 'C Klasė': 'c-klasa',
                'E Klasė': 'e-klasa', 'S Klasė': 's-klasa' };
for (const [ui, slug] of Object.entries(OT_MB)) {
  const r = sl('otomoto', 'Mercedes-Benz', ui);
  ok(r.rastas === true && r.slug === slug, `OT MB "${ui}" -> ${slug} (gauta ${r.slug})`);
}
ok(sl('otomoto', 'Mercedes-Benz', 'C Klasė').slug !== 'klasa-c',
  'OT C Klase NEGALI buti „klasa-c" - pamatuota 17 658 = visi Mercedes');

// ── 5. Nezinomas modelis zinomoje markeje -> portalas PRALEIDZIAMAS ─────────
for (const [p, mk, mo] of [['otomoto', 'Mercedes-Benz', 'CLA Klasė'],
                           ['otomoto', 'Mercedes-Benz', 'ML Klasė'],
                           ['autoscout24', 'BMW', 'M']]) {
  const r = sl(p, mk, mo);
  ok(r.rastas === false && r.slug === null,
    `${p} ${mk} "${mo}" -> rastas:false (gauta ${JSON.stringify(r)})`);
}

// ── 6. BE REGRESIJOS: kas veike, veikia toliau ───────────────────────────────
// Sie buvo PAMATUOTI: sasajos vardas = teisingas slug'as (dabar == kandidatas).
const veike = [
  ['autoscout24', 'BMW', 'X5'], ['autoscout24', 'BMW', 'X3'], ['autoscout24', 'BMW', 'Z4'],
  ['autoscout24', 'Porsche', '911'], ['otomoto', 'Porsche', '911'],
  ['autoscout24', 'Peugeot', '208'], ['otomoto', 'Peugeot', '508'],
  ['autoscout24', 'Mazda', '3'], ['otomoto', 'Fiat', '500'],
  ['autoscout24', 'Mercedes-Benz', 'GLC'], ['autoscout24', 'Audi', 'A4'],
  ['otomoto', 'Volkswagen', 'Golf'], ['autoscout24', 'Skoda', 'Octavia'],
];
for (const [p, mk, mo] of veike) {
  const r = sl(p, mk, mo);
  ok(r.rastas === true && r.slug === mo, `${p} ${mk} ${mo} eina kaip yra (gauta ${JSON.stringify(r)})`);
}

// ── 7. autogidas lenteles dar nera -> viskas eina kaip anksciau ─────────────
ok(sl('autogidas', 'BMW', '5').rastas === true && sl('autogidas', 'BMW', '5').slug === '5',
  'autogidas kol kas be lenteles - be regresijos');

// ── 8. Krastiniai atvejai ───────────────────────────────────────────────────
ok(sl('autoscout24', 'BMW', '').rastas === true, 'be modelio - visa marke, samoningai');
ok(sl('autoscout24', 'BMW', null).slug === null, 'modelis null - null');
ok(sl('autoscout24', null, '5').slug === '5', 'marke null - eilute kaip yra');
ok(sl('nezinomas-portalas', 'BMW', '5').slug === '5', 'nezinomas portalas - kaip yra');

// ── 9. Ar server.js tikrai NAUDOJA si moduli ────────────────────────────────
// Be sios patikros kazkas galetu ismesti iskvietima, o sargas liktu zalias.
const srv = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
ok(/require\('\.\/portalu-modeliai'\)/.test(srv), 'server.js prijungia portalu-modeliai');
for (const f of ['buildAutoscout24Url', 'buildOtomotoUrl']) {
  const nuo = srv.indexOf('function ' + f);
  ok(nuo > 0, f + ' egzistuoja');
  const blokas = srv.slice(nuo, nuo + 1400);
  ok(/portaluModeliai\.slug\(/.test(blokas), f + ' naudoja portaluModeliai.slug()');
}
ok(/praleisti\.push\(p\)/.test(srv), 'server.js praleidzia portala, kai modelis nezinomas');

if (k) { console.error('\n' + k + ' klaida(os)'); process.exit(1); }
console.log('✓ portalu-modeliai: 56 patikros');
