// v2.9.2 (Z-105): ScraperAPI eilė - niekada daugiau nei riba lygiagrečių užklausų.
// Tikras tinklas nenaudojamas: axios adapteris pakeičiamas netikru.
const path = require('path');
const fs = require('fs');
const axios = require('axios');
let ok = 0, bl = 0;
const T = (c, m) => { if (c) { ok++; console.log('  ok  ', m); } else { bl++; console.log('  BLOGAI', m); } };

// Ištraukiam eilės bloką iš server.js ir paleidžiam atskirai (serverio nekeliam).
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const a = src.indexOf('const SCRAPER_LYGIAGRECIAI'); const b = src.indexOf(');\n', src.indexOf('axios.interceptors.response.use', a)) + 3;
T(a > 0 && b > a, 'eilės blokas rastas server.js');
process.env.SCRAPER_LYGIAGRECIAI = '3';
new Function('axios', 'process', src.slice(a, b))(axios, process);

let dabar = 0, max = 0;
axios.defaults.adapter = async (cfg) => {
  dabar++; max = Math.max(max, dabar);
  await new Promise((r) => setTimeout(r, 30));
  dabar--;
  if (cfg.url.includes('KLAIDA')) { const e = new Error('429'); e.config = cfg; e.response = { status: 429 }; throw e; }
  return { data: 'x', status: 200, statusText: 'OK', headers: {}, config: cfg };
};
(async () => {
  const u = (i) => 'http://api.scraperapi.com?api_key=k&url=' + i + (i % 4 === 0 ? 'KLAIDA' : '');
  const r = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => axios.get(u(i))));
  T(max <= 3, 'lygiagrečių ne daugiau nei riba 3 (buvo ' + max + ')');
  T(r.filter((x) => x.status === 'fulfilled').length === 9 && r.filter((x) => x.status === 'rejected').length === 3, 'klaidos grąžina vietą eilėje (9 OK, 3 klaidos, niekas neužstrigo)');
  max = 0;
  await Promise.all(Array.from({ length: 6 }, () => axios.get('http://api.scraperapi.com/account?api_key=k')));
  T(max === 6, '/account į eilę neina (6 vienu metu)');
  console.log(bl ? '✗ ' + bl + ' klaidos' : '✓ ' + ok + '/' + ok + ' patikrų praėjo');
  process.exit(bl ? 1 : 0);
})();
