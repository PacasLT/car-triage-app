// kartos-etikete.test.js — kartos ribų tekstas (v2.28.1, Luko klaida Nr.51).
//
//     node backend/testai/kartos-etikete.test.js
//
// Kodėl sargas: Lukas pranešė „LCI iki dabar o ne pre facelift modelis. Jo jau
// nebegamina". Sąsaja rodė „G05 (2018–dabar, LCI nuo 2023)". Abu skaičiai
// teisingi atskirai, bet kartu jie sako netiesą: atrodo, kad PRADINIS variantas
// gaminamas iki šiol. Tokia klaida nekrenta – ji tiesiog meluoja apie automobilį,
// kurio kaina ir statistika nuo fazės priklauso.
const r = require('../regitra');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };
const e = r.kartosEtikete;

// ── Luko atvejis: BMW X5 G05 ───────────────────────────────────────────────
{
  const x = e(2018, null, 2023, 'LCI');
  T(x === '2018–2023, LCI 2023–dabar', 'G05: „' + x + '"');
  T(!/2018–dabar/.test(x), 'nebėra „2018–dabar" šalia „LCI nuo 2023" (tai ir buvo Nr.51)');
  T(/LCI 2023–dabar/.test(x), 'pasakyta, kad DABAR gaminamas LCI');
}

// ── Pasibaigusi karta ──────────────────────────────────────────────────────
T(e(2010, 2017, 2013, 'LCI') === '2010–2013, LCI 2013–2017', 'F10: pradinė 2010–2013, LCI 2013–2017');
T(e(2003, 2010, 2007, 'facelift') === '2003–2007, facelift 2007–2010', 'kitas atnaujinimo pavadinimas');

// ── Be atnaujinimo – nieko nepridedam ──────────────────────────────────────
T(e(2019, null, null, null) === '2019–dabar', 'be atnaujinimo, tebegaminama');
T(e(2012, 2018, null, null) === '2012–2018', 'be atnaujinimo, pasibaigusi');

// ── Kraštiniai atvejai ─────────────────────────────────────────────────────
T(e(2018, null, 2018, 'LCI') === '2018–dabar, LCI nuo 2018', 'atnaujinimas pirmais metais – senoji forma');
T(e(2018, null, 2015, 'LCI') === '2018–dabar, LCI nuo 2015', 'atnaujinimas anksčiau nei pradžia – nesugalvojam ribos');
T(typeof e(2018, null, 2023, null) === 'string', 'be atnaujinimo pavadinimo nenukrenta');
T(e(2018, null, 2023, null) === '2018–2023', 'be pavadinimo – tik pradinės ribos');

// ── Tekstas niekada nesako dviejų dalykų vienu metu ────────────────────────
{
  let blogu = 0;
  const atvejai = [[2018, null, 2023], [2010, 2017, 2013], [2015, null, 2019], [2008, 2014, 2011]];
  atvejai.forEach(([a, b, c]) => {
    const t = e(a, b, c, 'LCI');
    // Jei yra LCI su savo rėžiu, pradinė dalis NEGALI baigtis „dabar"
    if (/LCI \d{4}–/.test(t) && new RegExp('^' + a + '–dabar').test(t)) blogu++;
  });
  T(blogu === 0, 'nė vienu atveju pradinė dalis nesibaigia „dabar", kai LCI turi savo rėžį');
}

// ── kartosIntervalui grąžina etiketę ───────────────────────────────────────
{
  r.ikelti();
  const k = r.kartosIntervalui('BMW', 'X5', 2015, 2026);
  T(Array.isArray(k) && k.length > 0, 'BMW X5 kartos randamos (' + k.length + ')');
  T(k.every((g) => typeof g.etikete === 'string' && g.etikete.length > 3), 'visos kartos turi etiketę');
  const g05 = k.find((g) => g.kodas === 'G05');
  if (g05) {
    T(/^2018–/.test(g05.etikete), 'G05 etiketė prasideda 2018: „' + g05.etikete + '"');
    T(!/^2018–dabar,/.test(g05.etikete), 'G05 nebėra „2018–dabar, ..."');
  } else { T(true, 'G05 šiame rinkinyje nėra – praleidžiam'); }
}

console.log('\nkartos-etikete: ' + (n - klaidu) + '/' + n + ' ok' + (klaidu ? ', ' + klaidu + ' BLOGAI' : ''));
process.exit(klaidu ? 1 : 0);
