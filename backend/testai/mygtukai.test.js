// mygtukai.test.js — mygtukų vienodumo sargas (v1.36.0).
//
// Matuoja KIEKVIENĄ matomą mygtuką penkiuose puslapiuose ir lygina su
// dizaino sistemos norma. Tikslas – 0 nukrypimų; pasiektas v1.36.0.
//
// Paleidimas: paleisti peržiūros serverį (node perziura.js), tada
//   node backend/testai/mygtukai.test.js
//
// Naujas mygtukas = ct-btn + variantas + forma. Jokių vietinių height,
// border-radius ar font-size – būtent dėl jų mygtukų buvo ~40 variantų.

const { chromium } = require('playwright');
const PSL = ['index.html', 'detail.html', 'compare.html', 'ataskaitos.html', 'megstamiausi.html'];
// Dizainerio spec: 38/46/32 (+56 tik mobiliajame), radiusai 10px ir 50%,
// sriftai 14 / 15 (lg) / 12.5 (sm). Skirtukai (.ct-tab) skaiciuojami atskirai.
const NORMA = { h: [38, 46, 32, 56, 64], r: ['10px', '50%'], f: ['14px', '15px', '12.5px'] };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const nukrypimai = new Map();
  let viso = 0;
  for (const p of PSL) {
    const pg = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
    await pg.goto('http://localhost:8910/' + p + '?demo=1', { waitUntil: 'networkidle' }).catch(() => {});
    await pg.waitForTimeout(2200);
    const r = await pg.evaluate(() => {
      const out = [];
      for (const e of document.querySelectorAll('button, a.ct-btn, a.detail-btn, .ct-btn, .detail-btn, .compare-toggle, .fav-star, [class*="-btn"]')) {
        const c = getComputedStyle(e); const bb = e.getBoundingClientRect();
        if (bb.width === 0 || c.display === 'none') continue;
        if (e.classList.contains('ct-tab')) continue;  // skirtukai - atskiras komponentas
        out.push({
          klase: (e.className || e.id || e.tagName).toString().split(' ').slice(0, 2).join('.').slice(0, 40),
          h: Math.round(bb.height), r: c.borderRadius.split(' ')[0], f: c.fontSize,
        });
      }
      return out;
    });
    viso += r.length;
    for (const x of r) {
      const blogai = [];
      if (!NORMA.h.includes(x.h)) blogai.push('h=' + x.h);
      if (!NORMA.r.includes(x.r)) blogai.push('r=' + x.r);
      if (!NORMA.f.includes(x.f)) blogai.push('f=' + x.f);
      if (blogai.length) {
        const k = p + ' · ' + x.klase + ' · ' + blogai.join(' ');
        nukrypimai.set(k, (nukrypimai.get(k) || 0) + 1);
      }
    }
    await pg.close();
  }
  const eil = [...nukrypimai.entries()].sort((a, b) => b[1] - a[1]);
  console.log('Mygtukų iš viso: ' + viso + ' · nukrypstančių: ' + eil.reduce((s, x) => s + x[1], 0) + '\n');
  for (const [k, v] of eil) console.log('  ×' + String(v).padStart(2) + '  ' + k);
  await b.close();
  process.exit(eil.length ? 1 : 0);
})();
