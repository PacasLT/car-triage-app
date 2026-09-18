// dizainas.test.js — dizaino sistemos sargas.
//
// Kodėl jis yra: taisyklės, kurių niekas netikrina, po mėnesio nustoja galioti.
// Šis testas neleidžia dizaino skolai AUGTI. Esamas palikimas užfiksuotas kaip
// bazė (RIBOS); testas krenta tik tada, kai skaičius pakyla virš bazės.
//
// Paleidimas:  node backend/testai/dizainas.test.js
//
// Kai sutvarkote dalį skolos – SUMAŽINKITE ribą šitame faile. Taip skaičius
// gali tik mažėti. Ribos kėlimas = sąmoningas sprendimas, ne atsitiktinumas.

const fs = require('fs');
const path = require('path');

const FE = path.join(__dirname, '..', '..', 'frontend');
const F = (n) => fs.readFileSync(path.join(FE, n), 'utf8');

// ── Bazė: kiek dizaino skolos yra ŠIANDIEN. Tik mažinti. ────────────────────
const RIBOS = {
  'index.html':  { vaizdinisInline: 204, rootBlokai: 2 },
  'detail.html': { vaizdinisInline: 233, rootBlokai: 1 },
  'compare.html':      { vaizdinisInline: 17, rootBlokai: 2 },
  'ataskaitos.html':   { vaizdinisInline: 9,  rootBlokai: 0 },
  'megstamiausi.html': { vaizdinisInline: 0,  rootBlokai: 0 },
  'ct-bendras.css':    { vaizdinisInline: 0,  rootBlokai: 2 },
};

const VAIZDAS = /^(color|background|border|font|box-shadow|fill|stroke|text-transform|letter-spacing|filter|opacity)/;

let klaidu = 0, patikru = 0;
const ok  = (s) => { patikru++; console.log('  ok   ' + s); };
const blogai = (s) => { patikru++; klaidu++; console.log('  BLOGAI ' + s); };
const tikrink = (salyga, s) => (salyga ? ok(s) : blogai(s));

// ── 1. Inline stiliai, nešantys vaizdą ──────────────────────────────────────
// Išdėstymas (display, width, grid) inline yra leistinas. Spalva ir šriftas – ne:
// jų dizaino sistema nebepasiekia, ir jokia tokenų paletė jų nepakeis.
function vaizdiniaiInline(turinys) {
  let n = 0;
  for (const m of turinys.matchAll(/style="([^"]*)"/g)) {
    const savybes = m[1].split(';').map((p) => p.split(':')[0].trim().toLowerCase());
    if (savybes.some((p) => VAIZDAS.test(p))) n++;
  }
  return n;
}

console.log('\n── Inline stiliai su spalva/šriftu (tik mažėti) ──');
for (const [failas, riba] of Object.entries(RIBOS)) {
  if (riba.vaizdinisInline === 0 && !failas.endsWith('.html')) continue;
  const n = vaizdiniaiInline(F(failas));
  tikrink(n <= riba.vaizdinisInline,
    `${failas}: ${n} (riba ${riba.vaizdinisInline})` + (n < riba.vaizdinisInline ? ' ← sumažėjo, nuleiskite ribą' : ''));
}

// ── 2. Tokenai apibrėžiami TIK ct-dizainas.css ──────────────────────────────
console.log('\n── :root blokai (tokenai – tik ct-dizainas.css) ──');
for (const [failas, riba] of Object.entries(RIBOS)) {
  const n = (F(failas).match(/:root\s*\{/g) || []).length;
  tikrink(n <= riba.rootBlokai, `${failas}: ${n} :root (riba ${riba.rootBlokai})`);
}
tikrink((F('ct-dizainas.css').match(/:root\s*\{/g) || []).length >= 1,
  'ct-dizainas.css turi :root bloką');

// ── 3. ct-priedai.css disciplina ────────────────────────────────────────────
console.log('\n── ct-priedai.css ──');
const priedai = F('ct-priedai.css');
tikrink(!/:root\s*\{/.test(priedai), 'ct-priedai.css neapibrėžia tokenų');
{
  // Kietai įrašytos spalvos – be komentarų, kad #RRGGBB komentaro tekste neskaičiuotų.
  const beKomentaru = priedai.replace(/\/\*[\s\S]*?\*\//g, '');
  const kietos = beKomentaru.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g) || [];
  tikrink(kietos.length === 0, 'ct-priedai.css be kietai įrašytų spalvų' + (kietos.length ? ' — rasta: ' + kietos.join(', ') : ''));
}

// ── 4. Prijungimo tvarka: priedai PO dizaino ────────────────────────────────
console.log('\n── Prijungimo tvarka visuose puslapiuose ──');
for (const failas of ['index.html', 'detail.html', 'compare.html', 'ataskaitos.html', 'megstamiausi.html']) {
  const t = F(failas);
  // lastIndexOf, nes failuose yra komentarų, mininčių tuos pačius vardus
  const d = t.lastIndexOf('href="ct-dizainas.css"');
  const p = t.lastIndexOf('href="ct-priedai.css"');
  const body = t.lastIndexOf('</body>');
  tikrink(d > 0 && p > d && d > body - 4000,
    `${failas}: ct-dizainas.css → ct-priedai.css, abu prieš </body>`);
}

// ── 5. Produkto taisyklės, kurių dizainas negali panaikinti ─────────────────
// Šitie du dalykai yra produkto esmė, ne dekoracija. Jei kas nors juos
// „sutvarkys" dėl grožio, testas turi kristi.
console.log('\n── Produkto taisyklės ──');
const idx = F('index.html');
tikrink(/is-unrated/.test(idx), 'index.html vis dar žymi neįvertintus rodiklius (is-unrated)');
tikrink(/is-unrated-val/.test(idx), 'index.html vis dar žymi neįvertintas reikšmes (is-unrated-val)');
tikrink(/CT_DIFF_ITARTINA\s*=\s*30/.test(idx), 'įtartinos kainos riba tebėra 30 %');
tikrink(/GALIMAI DAUŽTAS/.test(idx), '„GALIMAI DAUŽTAS" įspėjimas nepašalintas');
const dz = F('ct-dizainas.css');
tikrink(/--k-unknown/.test(dz), 'trys žinojimo lygiai tebėra sistemoje (--k-unknown)');

// ── Išvada ──────────────────────────────────────────────────────────────────
console.log(`\n${klaidu ? '✗' : '✓'} ${patikru - klaidu}/${patikru} patikrų praėjo`);
if (klaidu) {
  console.log('\nKą daryti: naujas spalvas ir šriftus rašykite klasėmis, ne inline.');
  console.log('Naujas komponentas → ct-priedai.css. Naujas tokenas → užduotis dizaineriui.');
}
process.exit(klaidu ? 1 : 0);
