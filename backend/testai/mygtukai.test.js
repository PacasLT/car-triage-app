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
// Darbalaukis ir telefonas turi SKIRTINGAS normas: <=640px visi mygtukai
// kyla iki 44px (--tap-min), isskyrus .ct-btn-sm (antraste) ir .ct-btn-over
// (rodykles ant nuotraukos) - tie lieka 32/38, nes uzstotu turini.
const NORMA_WEB = { h: [38, 46, 32], r: ['10px', '50%'], f: ['14px', '15px', '12.5px'] };
// Telefone `.ct-btn` turi `min-height: 44px; height: auto` – tad turinys gali
// pastumti iki 45–48 px. Tai sąmoninga, todėl tikrinam ribą, ne tikslų skaičių.
const NORMA_TEL = { hMin: 44, hIsimtys: [32, 38], r: ['10px', '50%'], f: ['14px', '15px', '12.5px'] };
const PLOCIAI = [
  { n: 'web', w: 1400, h: 1000, norma: NORMA_WEB },
  { n: 'tel', w: 390, h: 844, norma: NORMA_TEL },
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const nukrypimai = new Map();
  let viso = 0;
  for (const { n: vardas, w, h, norma } of PLOCIAI) {
  const NORMA = norma;
  for (const p0 of PSL) {
    const p = vardas + ' ' + p0;
    const pg = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    await pg.goto('http://localhost:8910/' + p0 + '?demo=1', { waitUntil: 'networkidle' }).catch(() => {});
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
      const hOk = NORMA.h ? NORMA.h.includes(x.h)
        : (NORMA.hIsimtys.includes(x.h) || (x.h >= NORMA.hMin && x.h <= 64));
      if (!hOk) blogai.push('h=' + x.h);
      if (!NORMA.r.includes(x.r)) blogai.push('r=' + x.r);
      if (!NORMA.f.includes(x.f)) blogai.push('f=' + x.f);
      if (blogai.length) {
        const k = p + ' · ' + x.klase + ' · ' + blogai.join(' ');
        nukrypimai.set(k, (nukrypimai.get(k) || 0) + 1);
      }
    }
    await pg.close();
  }
  }
  const eil = [...nukrypimai.entries()].sort((a, b) => b[1] - a[1]);
  console.log('Mygtukų iš viso: ' + viso + ' · nukrypstančių: ' + eil.reduce((s, x) => s + x[1], 0) + '\n');
  for (const [k, v] of eil) console.log('  ×' + String(v).padStart(2) + '  ' + k);
  await b.close();
  process.exit(eil.length ? 1 : 0);
})();
