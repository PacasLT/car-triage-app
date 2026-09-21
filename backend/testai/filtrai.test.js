// filtrai.test.js — ar tavo filtrai pasiekia VISUS portalus (v2.4.3).
//
//     node backend/testai/filtrai.test.js            sargas
//     node backend/testai/filtrai.test.js --adresai  + pavyzdiniai adresai rankinei patikrai
//
// Reikia: cheerio (ne), tinklo nereikia. Kodai portaluose patikrinti gyvai
// 2026-09-21 (Z-67); šis sargas saugo, kad jie nepasikeistų tyliai.
//
// KAM: autogido kuro filtras metų metus nepasiekdavo portalo (raktai
// „dyzelis" vs „Dyzelinas"), o autoscout24 ir otomoto kuro filtro negaudavo
// visai. Niekas nekrenta - tiesiog mokam už nereikalingus puslapius ir
// išmetam juos patys. Tokią klaidą randa tik sargas, kuris žiūri į ADRESĄ.

const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
function imk(v) {
  const i = src.indexOf('function ' + v + '(');
  if (i < 0) throw new Error('Nerasta: ' + v);
  let g = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') g++; else if (src[k] === '}') { g--; if (!g) return src.slice(i, k + 1); }
  }
}
const blokas = (re) => (src.match(re) || [''])[0];
const kodas = [
  blokas(/const KURO_FILTRAS = \{[\s\S]*?\n\};/),
  blokas(/const AUTOPLIUS_FUEL_IDS = \{[\s\S]*?\n\};/),
  blokas(/const AUTOGIDAS_PARAM = \{[\s\S]*?\n\};/),
  blokas(/const PLN_EUR_RATE = [^;]+;/),
  blokas(/const PLN_KURSAS = \{[^\n]*\};/),
  ...['kurasAtitinka', 'buildAutopliusUrl', 'buildAutogidasUrl', 'buildAutoscout24Url', 'buildOtomotoUrl'].map(imk),
  'return { kurasAtitinka, buildAutopliusUrl, buildAutogidasUrl, buildAutoscout24Url, buildOtomotoUrl };',
].join('\n');
const autopliusIds = require(path.join(__dirname, '..', 'autoplius-ids.js'));
const F = new Function('autopliusIds', kodas)(autopliusIds);

let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));
const d = (u) => decodeURIComponent(u);

console.log('\n1. KURAS pasiekia kiekvieną portalą ───────────────────────');
const lauk = {
  autoplius: { dyzelis: ['[32]=32', '[17378]=17378'], benzinas: ['[30]=30', '[36]=36', '[31]=31'], hibridas: ['[36]=36', '[17378]=17378'], elektra: ['[35]=35'] },
  autogidas: { dyzelis: ['f_2[1]=Dyzelinas', 'f_2[8]=Dyzelinas/Elektra', 'f_2[9]=Dyzelinas/Elektra (Plug-in)'],
    benzinas: ['f_2[2]=Benzinas', 'f_2[4]=Benzinas/Elektra'], hibridas: ['f_2[4]=Benzinas/Elektra', 'f_2[8]=Dyzelinas/Elektra', 'f_2[9]=Dyzelinas/Elektra (Plug-in)'],
    elektra: ['f_2[7]=Elektra'] },
  autoscout24: { dyzelis: ['fuel=D,3'], benzinas: ['fuel=B,2,L'], hibridas: ['fuel=2,3'], elektra: ['fuel=E'] },
  otomoto: { dyzelis: ['fuel_type][0]=diesel'], benzinas: ['fuel_type][0]=petrol'], hibridas: ['fuel_type][0]=hybrid', 'fuel_type][1]=plugin-hybrid'], elektra: ['fuel_type][0]=electric'] },
};
const kurti = { autoplius: F.buildAutopliusUrl, autogidas: F.buildAutogidasUrl, autoscout24: F.buildAutoscout24Url, otomoto: F.buildOtomotoUrl };
for (const [portalas, kurai] of Object.entries(lauk)) {
  for (const [kuras, dalys] of Object.entries(kurai)) {
    const u = d(kurti[portalas]({ marke: 'BMW', metaiNuo: 2019, kuras }));
    t(portalas + ' · ' + kuras, dalys.every((x) => u.includes(x)), u);
  }
}
t('hibridas autogide NEįtraukia gryno benzino', !d(F.buildAutogidasUrl({ marke: 'BMW', kuras: 'hibridas' })).includes('=Benzinas&'));
t('elektra autoplius NEįtraukia hibridų', !d(F.buildAutopliusUrl({ marke: 'BMW', kuras: 'elektra' })).includes('[36]'));

console.log('\n2. PAVARŲ DĖŽĖ ir RIDA ─────────────────────────────────────');
const auto = { marke: 'BMW', pavaru_deze: 'Automatinė', ridaIki: 100000 };
t('autoplius: gearbox_id=38, kilometrage_to', /gearbox_id=38/.test(F.buildAutopliusUrl(auto)) && /kilometrage_to=100000/.test(F.buildAutopliusUrl(auto)));
t('autogidas: f_10=Automatinė, f_66', d(F.buildAutogidasUrl(auto)).includes('f_10=Automatinė') && /f_66=100000/.test(F.buildAutogidasUrl(auto)));
t('autoscout24: gear=A,S (su pusiau automatine), kmto', /gear=A,S/.test(F.buildAutoscout24Url(auto)) && /kmto=100000/.test(F.buildAutoscout24Url(auto)), F.buildAutoscout24Url(auto));
t('autoscout24: mechaninė = gear=M', /gear=M(&|$)/.test(F.buildAutoscout24Url({ marke: 'BMW', pavaru_deze: 'Mechaninė' })));
t('otomoto: gearbox automatic, mileage:to', d(F.buildOtomotoUrl(auto)).includes('filter_enum_gearbox][0]=automatic') && d(F.buildOtomotoUrl(auto)).includes('filter_float_mileage:to]=100000'));

console.log('\n3. Be kuro filtro - kuro parametro nėra ────────────────────');
const be = { marke: 'BMW', metaiNuo: 2019 };
t('nė vienas portalas nededa kuro', !/fuel_id|f_2\[|fuel=|fuel_type/.test(d(Object.values(kurti).map((f) => f(be)).join(' '))));

console.log('\n4. kurasAtitinka - visų portalų rašyba ─────────────────────');
const K = F.kurasAtitinka;
const atv = [
  ['Benzinas / elektra', 'hibridas', true], ['Benzinas/Elektra', 'hibridas', true], ['Benzinas/Elektra (Plug-in)', 'hibridas', true],
  ['Dyzelinas / elektra', 'hibridas', true], ['Dyzelinas/Elektra (Plug-in)', 'hibridas', true], ['Hibridas', 'hibridas', true],
  ['Benzinas', 'hibridas', false], ['Elektra', 'hibridas', false],
  ['Dyzelinas / elektra', 'dyzelis', true], ['Benzinas / elektra', 'dyzelis', false],
  ['Benzinas / elektra', 'benzinas', true], ['Benzinas / dujos', 'benzinas', true],
  ['Elektra', 'elektra', true], ['Benzinas / elektra', 'elektra', false],
];
for (const [k, f, laukta] of atv) t('„' + k + '" ~ ' + f + ' → ' + laukta, K(k, f) === laukta, K(k, f));

if (process.argv.includes('--adresai')) {
  console.log('\n── PAVYZDINIAI ADRESAI RANKINEI PATIKRAI ──────────────────');
  const bandymai = [
    ['BMW nuo 2019, visi kurai', { marke: 'BMW', metaiNuo: 2019 }],
    ['BMW nuo 2019, HIBRIDAS', { marke: 'BMW', metaiNuo: 2019, kuras: 'hibridas' }],
    ['BMW nuo 2019, DYZELINAS', { marke: 'BMW', metaiNuo: 2019, kuras: 'dyzelis' }],
    ['BMW nuo 2019, ELEKTRA', { marke: 'BMW', metaiNuo: 2019, kuras: 'elektra' }],
    ['BMW X5 2020–2023, dyzelinas, automatinė, iki 150 000 km, 30–60 tūkst. €',
      { marke: 'BMW', modelis: 'X5', metaiNuo: 2020, metaiIki: 2023, kuras: 'dyzelis', pavaru_deze: 'Automatinė', ridaIki: 150000, kainaNuo: 30000, kainaIki: 60000 }],
  ];
  for (const [pav, f] of bandymai) {
    console.log('\n### ' + pav);
    for (const [p, fn] of Object.entries(kurti)) console.log('- ' + p + ': ' + fn(f));
  }
}

console.log('\n9. RIKIAVIMAS: visur naujausi viršuje (Z-78, patikrinta portaluose) ─');
{
  const MD = require(path.join(__dirname, '..', 'mobilede.js'));
  const f = { marke: 'BMW', metaiNuo: 2019 };
  // Kiekviena reikšmė patikrinta portalo rikiavimo sąraše 2026-09-21:
  // autoplius „Naujausi viršuje", autogidas „Naujausi viršuje", autoscout24
  // „Latest offers first", otomoto (createdAt mažėja), mobile.de „Inserate (neueste zuerst)".
  t('autoplius order_by=3 DESC', d(F.buildAutopliusUrl(f)).includes('order_by=3&order_direction=DESC'), F.buildAutopliusUrl(f));
  t('autogidas f_50=naujausi_asc', d(F.buildAutogidasUrl(f)).includes('f_50=naujausi_asc'), F.buildAutogidasUrl(f));
  t('autoscout24 sort=age&desc=1 (ne standard)', d(F.buildAutoscout24Url(f)).includes('sort=age&desc=1') && !d(F.buildAutoscout24Url(f)).includes('sort=standard'), F.buildAutoscout24Url(f));
  t('otomoto created_at_first:desc (ne pigiausi)', d(F.buildOtomotoUrl(f)).includes('search[order]=created_at_first:desc') && !d(F.buildOtomotoUrl(f)).includes('price:asc'), F.buildOtomotoUrl(f));
  t('mobile.de sb=doc&od=down be jokio parametro', d(MD.buildMobileDeUrl(f)).includes('sb=doc&od=down'), MD.buildMobileDeUrl(f));
}

console.log('\n' + (bl ? '✗ ' + bl + ' klaidos, ' + ok + ' praėjo' : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
