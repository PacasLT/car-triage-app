// skenavimas.test.js — fetchAllPages: kuris skaitytuvas skaito kurį portalą.
//
//     node backend/testai/skenavimas.test.js
//
// Tinklo nekviečia, kreditų nekainuoja.
//
// KAM ŠIS SARGAS (Z-74): v2.4.1 į fetchAllPages pridėtas render bandymas
// atsitiktinai prisegė autoplius skaitytuvą kaip `else` prie NAUJO `if`.
// Rezultatas: autogido, autoscout24 ir otomoto skelbimai buvo perrašomi
// autoplius skaitytuvo išvestimi. Paieška veikė, klaidų nebuvo — tik tų trijų
// portalų rezultatuose nebeliko. Nė vienas testas to nepagavo, nes nė vienas
// nekvietė fetchAllPages.
//
// Čia kiekvienas skaitytuvas pakeistas „žyme" — grąžina skelbimą su savo vardu.
// Taip tikrinama TIK tai, kuris skaitytuvas pasiekė kurį portalą, ne HTML.

const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
function imk(v) {
  let i = src.indexOf('async function ' + v + '(');
  if (i < 0) i = src.indexOf('function ' + v + '(');
  if (i < 0) throw new Error('Nerasta: ' + v);
  let g = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') g++; else if (src[k] === '}') { g--; if (!g) return src.slice(i, k + 1); }
  }
}
const blokas = (re) => { const m = src.match(re); if (!m) throw new Error('Nerasta: ' + re); return m[0]; };

let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));

// Žymės vietoj skaitytuvų. `tuscias` - kuriems portalams grąžinti 0.
const kurti = (tuscias, puslapiuKiekis) => {
  const zyme = (vardas) => (html, url) => {
    const p = (html.match(/p=(\d+)/) || [0, '1'])[1];
    if (tuscias.includes(vardas) || +p > (puslapiuKiekis || 99)) return [];
    return [{ url: vardas + '-' + p + '-' + (html.includes('render') ? 'R' : 'N'), skaitytuvas: vardas }];
  };
  const kodas = [
    blokas(/const PUSLAPIO_PARAM = \{[^\n]*\};/),
    blokas(/const PUSLAPIU_RIBA = \{[^\n]*\};/),
    imk('paieskosPortalas'), imk('skaitytiPaieskosPuslapi'), imk('fetchAllPages'),
    'return { fetchAllPages, paieskosPortalas };',
  ].join('\n');
  const Z = {
    extractAutogidasListings: zyme('autogidas'), extractAutoscout24Listings: zyme('autoscout24'),
    extractOtomotoListings: zyme('otomoto'), extractAutopliusStructured: zyme('autoplius'),
    extractListingBlocksAutoplius: () => [],
    mobilede: { extractMobileDe: (h) => ({ skelbimai: zyme('mobilede')(h) }) },
  };
  return new Function(...Object.keys(Z), 'fetchSearchPage', kodas)(...Object.values(Z), null);
};
// Netikras gavėjas: HTML'e įrašo puslapio numerį ir ar prašyta render.
const kvietimai = [];
const gauti = async (url, opts) => {
  kvietimai.push(url + (opts && opts.render ? ' [render]' : ''));
  const p = (url.match(/(?:page_nr|page|pageNumber)=(\d+)/) || [0, '1'])[1];
  return 'p=' + p + (opts && opts.render ? ' render' : '');
};

const ADRESAI = {
  autoplius: 'https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2',
  autogidas: 'https://autogidas.lt/skelbimai/automobiliai/?f_1[0]=BMW',
  autoscout24: 'https://www.autoscout24.com/lst/bmw?sort=age&desc=1',
  otomoto: 'https://www.otomoto.pl/osobowe/bmw?search[order]=x',
  mobilede: 'https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=3500',
};

(async () => {
  console.log('\n1. Kiekvieną portalą skaito JO skaitytuvas (Z-74 regresija) ─');
  const F = kurti([], 3);
  for (const [portalas, url] of Object.entries(ADRESAI)) {
    const r = await F.fetchAllPages(url, 2, null, null, gauti);
    const kas = [...new Set(r.listings.map((l) => l.skaitytuvas))];
    t(portalas + ' → ' + kas.join(','), kas.length === 1 && kas[0] === portalas && r.listings.length === 2, r.listings);
    t(portalas + ' formatas parsed', r.format === 'parsed', r.format);
  }

  console.log('\n2. Puslapio parametras ─────────────────────────────────────');
  const lauk = { autoplius: 'page_nr=2', autogidas: 'page=2', autoscout24: 'page=2', otomoto: 'page=2', mobilede: 'pageNumber=2' };
  for (const [portalas, url] of Object.entries(ADRESAI)) {
    kvietimai.length = 0;
    await F.fetchAllPages(url, 2, null, null, gauti);
    t(portalas + ': ' + lauk[portalas], kvietimai[1] && kvietimai[1].endsWith(lauk[portalas]), kvietimai);
  }

  console.log('\n3. Pabaiga ─────────────────────────────────────────────────');
  let r = await F.fetchAllPages(ADRESAI.autogidas, 10, null, null, gauti);
  t('3 puslapiai, 4-as tuščias → galas', r.pabaiga === 'galas' && r.listings.length === 3, r.pabaiga);
  r = await F.fetchAllPages(ADRESAI.autogidas, 2, null, null, gauti);
  t('riba 2 → riba', r.pabaiga === 'riba', r.pabaiga);
  const Fbe = kurti(['autogidas']);
  r = await Fbe.fetchAllPages(ADRESAI.autogidas, 5, null, null, gauti);
  t('pirmas tuščias → „pirmas puslapis tuscias" (ne galas)', r.pabaiga === 'pirmas puslapis tuscias', r.pabaiga);

  console.log('\n4. mobile.de riba 100 puslapių ─────────────────────────────');
  const Fdaug = kurti([], 500);
  kvietimai.length = 0;
  r = await Fdaug.fetchAllPages(ADRESAI.mobilede, 400, null, null, gauti);
  t('400 prašyta → 100 užklausų', kvietimai.length === 100, kvietimai.length);
  t('pabaiga „riba: portalas daugiau neduoda" (archyvas nelaiko pilnu)', r.pabaiga === 'riba: portalas daugiau neduoda', r.pabaiga);
  kvietimai.length = 0;
  r = await Fdaug.fetchAllPages(ADRESAI.autogidas, 120, null, null, gauti);
  t('kitiems portalams riba netaikoma (120)', kvietimai.length === 120, kvietimai.length);

  console.log('\n5. Render bandymas - tik autoscout24/otomoto ir tik tuščiam ─');
  const Ftus = kurti(['autoscout24', 'autogidas', 'mobilede']);
  kvietimai.length = 0;
  await Ftus.fetchAllPages(ADRESAI.autoscout24, 3, null, null, gauti);
  t('autoscout24 tuščias → vienas bandymas su render', kvietimai.filter((k) => k.includes('[render]')).length === 1, kvietimai);
  for (const p of ['autogidas', 'mobilede']) {
    kvietimai.length = 0;
    await Ftus.fetchAllPages(ADRESAI[p], 3, null, null, gauti);
    t(p + ' tuščias → render NEBANDOMAS (brangu, nereikia)', !kvietimai.some((k) => k.includes('[render]')), kvietimai);
  }
  kvietimai.length = 0;
  await F.fetchAllPages(ADRESAI.otomoto, 2, null, null, gauti);
  t('otomoto su skelbimais → render nebandomas', !kvietimai.some((k) => k.includes('[render]')), kvietimai);

  console.log('\n6. onPage „stop" (kreditų sargas) ──────────────────────────');
  r = await F.fetchAllPages(ADRESAI.mobilede, 10, null, async (s, p) => (p === 2 ? 'stop' : null), gauti);
  t('sustoja po 2 psl., pabaiga „sargas: kreditai"', r.listings.length === 2 && r.pabaiga === 'sargas: kreditai', r);

  console.log('\n' + (bl ? '✗ ' + bl + ' klaidos iš ' + (ok + bl) : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
  process.exit(bl ? 1 : 0);
})();
