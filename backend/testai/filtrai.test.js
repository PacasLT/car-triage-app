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
  blokas(/const PAPILDOMI_FILTRAI = \{[\s\S]*?\n\};/),
  imk('papFiltras'),
  blokas(/const KURO_SENI = \{[\s\S]*?\n\};/),
  ...['kuroKategorija', 'kurasAtitinka', 'buildAutopliusUrl', 'buildAutogidasUrl', 'buildAutoscout24Url', 'buildOtomotoUrl'].map(imk),
  'return { kurasAtitinka, buildAutopliusUrl, buildAutogidasUrl, buildAutoscout24Url, buildOtomotoUrl };',
].join('\n');
const autopliusIds = require(path.join(__dirname, '..', 'autoplius-ids.js'));
const F = new Function('autopliusIds', kodas)(autopliusIds);

let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));
const d = (u) => decodeURIComponent(u);

console.log('\n1. KURAS pasiekia kiekvieną portalą ───────────────────────');
const lauk = {
  autoplius: { dyzelis: ['[32]=32', '[17378]=17378'], benzinas: ['[30]=30'], hibridas: ['[36]=36', '[17378]=17378'], elektra: ['[35]=35'] },
  autogidas: { dyzelis: ['f_2[1]=Dyzelinas', 'f_2[8]=Dyzelinas/Elektra', 'f_2[9]=Dyzelinas/Elektra (Plug-in)'],
    benzinas: ['f_2[2]=Benzinas'], hibridas: ['f_2[4]=Benzinas/Elektra', 'f_2[8]=Dyzelinas/Elektra', 'f_2[9]=Dyzelinas/Elektra (Plug-in)'],
    elektra: ['f_2[7]=Elektra'] },
  autoscout24: { dyzelis: ['fuel=D,3'], benzinas: ['fuel=B'], hibridas: ['fuel=2,3'], elektra: ['fuel=E'] },
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
  ['Benzinas / elektra', 'benzinas', false], ['Benzinas / dujos', 'benzinas', false], ['Benzinas', 'benzinas', true],
  ['Elektra', 'elektra', true], ['Benzinas / elektra', 'elektra', false],
];
for (const [k, f, laukta] of atv) t('„' + k + '" ~ ' + f + ' → ' + laukta, K(k, f) === laukta, K(k, f));

console.log('\n5. v2.10.5 GRIEŽTAS kuras (Luko 6 variantai) ──────────────');
const griezti = {
  autoplius: { dyzelinas: ['[32]=32'], dyzelinas_elektra: ['[17378]=17378'], benzinas_dujos: ['[31]=31'], benzinas_elektra: ['[36]=36'] },
  autogidas: { dyzelinas: ['f_2[1]=Dyzelinas'], dyzelinas_elektra: ['f_2[8]=Dyzelinas/Elektra'], benzinas_dujos: ['f_2[3]=Benzinas/Dujos'], benzinas_elektra: ['f_2[4]=Benzinas/Elektra'] },
  autoscout24: { dyzelinas: ['fuel=D'], dyzelinas_elektra: ['fuel=3'], benzinas_dujos: ['fuel=L,C'], benzinas_elektra: ['fuel=2'] },
  otomoto: { dyzelinas: ['fuel_type][0]=diesel'], benzinas_dujos: ['fuel_type][0]=petrol-lpg', 'fuel_type][1]=petrol-cng'], benzinas_elektra: ['fuel_type][0]=hybrid'] },
};
for (const [portalas, kurai] of Object.entries(griezti)) {
  for (const [kuras, dalys] of Object.entries(kurai)) {
    const u = d(kurti[portalas]({ marke: 'BMW', metaiNuo: 2019, kuras }));
    t(portalas + ' · ' + kuras, dalys.every((x) => u.includes(x)), u);
  }
}
t('autoscout24 benzinas be hibridų ir dujų', !/fuel=B,/.test(d(F.buildAutoscout24Url({ marke: 'BMW', kuras: 'benzinas' }))));
t('autoscout24 dyzelinas be hibridų', !/fuel=D,/.test(d(F.buildAutoscout24Url({ marke: 'BMW', kuras: 'dyzelinas' }))));
t('dyzelinas autoplius NEįtraukia dyzelino hibridų', !d(F.buildAutopliusUrl({ marke: 'BMW', kuras: 'dyzelinas' })).includes('[17378]'));
const gr = [
  ['Dyzelinas', 'dyzelinas', true], ['Dyzelinas / elektra', 'dyzelinas', false], ['Diesel', 'dyzelinas', true],
  ['Dyzelinas / elektra', 'dyzelinas_elektra', true], ['Dyzelinas/Elektra (Plug-in)', 'dyzelinas_elektra', true], ['Dyzelinas', 'dyzelinas_elektra', false],
  ['Benzinas / dujos', 'benzinas_dujos', true], ['Autogas (LPG)', 'benzinas_dujos', true], ['Benzinas', 'benzinas_dujos', false],
  ['Benzinas / elektra', 'benzinas_elektra', true], ['Hibridas', 'benzinas_elektra', true], ['Benzinas', 'benzinas_elektra', false],
  ['Elektra', 'elektra', true], ['Dyzelinas / elektra', 'elektra', false],
  ['', 'dyzelinas', true],
];
for (const [k, f, laukta] of gr) t('griežtai „' + k + '" ~ ' + f + ' → ' + laukta, K(k, f) === laukta, K(k, f));

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

console.log('\n10. „BE DEFEKTŲ" pasiekia kiekvieną portalą (Z-80/Z-81, skaičiai iš portalų) ─');
{
  const MD = require(path.join(__dirname, '..', 'mobilede.js'));
  const su = { marke: 'BMW', metaiNuo: 2019, beDefektu: true }, be = { marke: 'BMW', metaiNuo: 2019 };
  t('autoplius has_damaged_id[10924] (189 → 183)', d(F.buildAutopliusUrl(su)).includes('has_damaged_id[10924]=10924') && !d(F.buildAutopliusUrl(be)).includes('has_damaged_id'), F.buildAutopliusUrl(su));
  t('autogidas f_46=Be defektų, ne masyvo forma (49 → 27)', d(F.buildAutogidasUrl(su)).includes('f_46=Be defektų') && !d(F.buildAutogidasUrl(su)).includes('f_46['), F.buildAutogidasUrl(su));
  t('autoscout24 ustate=N,U (6 422 → 6 360)', d(F.buildAutoscout24Url(su)).includes('ustate=N,U') && !d(F.buildAutoscout24Url(be)).includes('ustate'), F.buildAutoscout24Url(su));
  t('otomoto filter_enum_damaged=0 (977 → 586)', d(F.buildOtomotoUrl(su)).includes('search[filter_enum_damaged]=0') && !d(F.buildOtomotoUrl(be)).includes('damaged'), F.buildOtomotoUrl(su));
  t('mobile.de dam=false visada (4 504 → 4 470)', d(MD.buildMobileDeUrl(su)).includes('dam=false') && d(MD.buildMobileDeUrl(be)).includes('dam=false'), MD.buildMobileDeUrl(su));
}

console.log('\n11. KĖBULAS, PARDAVĖJAS, ĮDĖTA PER (Z-97, skaičiai iš portalų 2026-09-22) ─');
{
  const MD = require(path.join(__dirname, '..', 'mobilede.js'));
  const f = { marke: 'BMW', modelis: 'X5', metaiNuo: 2019, kebulas: 'visureigis', pardavejas: 'privatus', idetaDienos: '7' };
  const be = { marke: 'BMW', modelis: 'X5', metaiNuo: 2019 };
  const ap = d(F.buildAutopliusUrl(f)), ag = d(F.buildAutogidasUrl(f)), as = d(F.buildAutoscout24Url(f)), ot = d(F.buildOtomotoUrl(f)), md = d(MD.buildMobileDeUrl(f));
  t('autoplius body_type_id[7], is_partner=0, older_not=7', ap.includes('body_type_id[7]=7') && ap.includes('is_partner=0') && ap.includes('older_not=7'), ap);
  t('autogidas f_3[4]=Visureigis / Krosoveris, f_521=0', ag.includes('f_3[4]=Visureigis / Krosoveris') && ag.includes('f_521=0'), ag);
  t('autoscout24 body=4, custtype=P, adage=7', as.includes('body=4') && as.includes('custtype=P') && as.includes('adage=7'), as);
  t('otomoto body suv, private_business=private', ot.includes('search[filter_enum_body_type][0]=suv') && ot.includes('search[private_business]=private'), ot);
  t('mobile.de c=OffRoad, st=FSBO, doc=7', md.includes('c=OffRoad') && md.includes('st=FSBO') && md.includes('doc=7'), md);
  const v = { ...be, pardavejas: 'verslas' };
  t('verslas: ap 1, ag 1, as D, oto business, md DEALER',
    d(F.buildAutopliusUrl(v)).includes('is_partner=1') && d(F.buildAutogidasUrl(v)).includes('f_521=1') && d(F.buildAutoscout24Url(v)).includes('custtype=D')
    && d(F.buildOtomotoUrl(v)).includes('private_business]=business') && d(MD.buildMobileDeUrl(v)).includes('st=DEALER'));
  const visi = [F.buildAutopliusUrl(be), F.buildAutogidasUrl(be), F.buildAutoscout24Url(be), F.buildOtomotoUrl(be), MD.buildMobileDeUrl(be)].map(d).join(' ');
  t('be filtrų - nė vieno naujo parametro', !/body_type_id|is_partner|older_not|f_3\[|f_521|[?&]body=|custtype|adage|body_type\]|private_business|[?&](c|st|doc)=/.test(visi), visi);
  const blogi = { ...be, kebulas: 'traktorius', pardavejas: 'x', idetaDienos: '5' };
  const bv = [F.buildAutopliusUrl(blogi), F.buildAutoscout24Url(blogi), MD.buildMobileDeUrl(blogi)].map(d).join(' ');
  t('nežinomos reikšmės nepatenka (5 d. nėra portaluose)', !/older_not|adage|[?&]doc=|body|is_partner|custtype|[?&]st=/.test(bv), bv);
  // Visi 7 kėbulai turi visus 5 kodus
  const K = ['sedanas', 'hecbekas', 'universalas', 'visureigis', 'vienaturis', 'kupe', 'kabrioletas'];
  t('7 kėbulai × 5 portalai', K.every((k) => { const x = { ...be, kebulas: k };
    return /body_type_id\[\d+\]/.test(d(F.buildAutopliusUrl(x))) && /f_3\[\d+\]=/.test(d(F.buildAutogidasUrl(x))) && /body=\d+/.test(d(F.buildAutoscout24Url(x)))
      && /filter_enum_body_type\]\[0\]=[a-z-]+/.test(d(F.buildOtomotoUrl(x))) && /c=[A-Za-z]+/.test(d(MD.buildMobileDeUrl(x))); }));
}

// Luko pranešimas 09-24: markių sąraše nebuvo Škodos. Priežastis – septynios
// ranka įrašytos `<option>` eilutės, nors paieška moka 31 markę. Ši patikra
// neleidžia abiem sąrašams vėl prasilenkti.
{
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'index.html'), 'utf8');
  const i = html.indexOf('id="marke"'), j = html.indexOf('</select>', i);
  const sel = [...html.slice(i, j).matchAll(/<option[^>]*>([^<]+)</g)].map((m) => m[1].trim())
    .filter((x) => x !== 'Visos markės');
  const seed = Object.keys(autopliusIds.SEED.makes);
  const truksta = seed.filter((m) => !sel.includes(m));
  const perteklius = sel.filter((m) => !seed.includes(m));
  t('markių sąraše yra Skoda', sel.includes('Skoda'));
  t('sąraše yra visos markės, kurių ID turim' + (truksta.length ? ' (trūksta: ' + truksta.join(', ') + ')' : ''), truksta.length === 0);
  t('sąraše nėra markių be autoplius ID' + (perteklius.length ? ' (be ID: ' + perteklius.join(', ') + ')' : ''), perteklius.length === 0);
  t('markių bent 30 (dabar ' + sel.length + ')', sel.length >= 30);
  // Kiekviena markė turi modelių sąrašą – kitaip lange lieka tik „Visi modeliai“.
  const bm = {};
  { const i2 = html.indexOf('const BRAND_MODELS = {'), j2 = html.indexOf('\n};', i2);
    // eslint-disable-next-line no-eval
    eval('Object.assign(bm, ' + html.slice(i2 + 'const BRAND_MODELS = '.length, j2 + 2) + ')'); }
  const beModeliu = sel.filter((m) => !bm[m] || !bm[m].length);
  t('visos markės turi modelių sąrašą' + (beModeliu.length ? ' (be jo: ' + beModeliu.join(', ') + ')' : ''), beModeliu.length === 0);
  t('modelių iš viso bent 200 (dabar ' + Object.values(bm).reduce((a, b) => a + b.length, 0) + ')',
    Object.values(bm).reduce((a, b) => a + b.length, 0) >= 200);
}

console.log('\n' + (bl ? '✗ ' + bl + ' klaidos, ' + ok + ' praėjo' : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
