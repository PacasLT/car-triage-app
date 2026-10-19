// mobilede-stabdis.test.js — kada stabdom VISĄ mobile.de (v2.28.2, Nr.52).
//
//     node backend/testai/mobilede-stabdis.test.js
//
// Kodėl sargas: 6 val. stabdis yra brangus sprendimas – jis išjungia portalą
// visiems vartotojams. Produkcijoje 2026-10-19 jį uždėjo VIENAS negyvas
// skelbimas, nors tą pačią minutę du kiti buvo perskaityti puikiai. Klaida
// nekrenta: ji tiesiog tyliai atima portalą šešioms valandoms ir tada dar
// pasako vartotojui, kad „portalas blokuoja", nors portalas veikia.
const S = require('../mobilede-stabdis');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── Tikras 2026-10-19 atvejis: trys budai, visi ScraperAPI 500 ─────────────
{
  const v = S.verdiktas([{ status: 500, rasta: false }, { status: 500, rasta: false }, { status: 500, rasta: false }]);
  T(v.pavyko === false, 'neperskaityta');
  T(v.stabdyti === false, 'VISO PORTALO NESTABDOM – kaltas vienas skelbimas');
  T(v.kodas === 'SKELBIMAS_NERASTAS', 'kodas: skelbimas nerastas, ne portalo apsauga');
}

// ── Tikras blokavimas: 200, bet skelbimo puslapyje nėra ────────────────────
{
  const v = S.verdiktas([{ status: 200, rasta: false }, { status: 200, rasta: false }, { status: 200, rasta: false }]);
  T(v.stabdyti === true, '200 be skelbimo – iššūkio puslapis, stabdom');
  T(v.kodas === 'MOBILEDE_NEPRIEINAMA', 'kodas: portalas neprieinamas');
}
{
  // Mišrus: vienas budas gavo iššūkį, kiti nukrito – vis tiek blokavimas
  const v = S.verdiktas([{ status: 500, rasta: false }, { status: 200, rasta: false }, { status: 0, rasta: false }]);
  T(v.stabdyti === true, 'nors vienas 200 be skelbimo – laikom blokavimu');
}

// ── Pavyko ─────────────────────────────────────────────────────────────────
{
  const v = S.verdiktas([{ status: 500, rasta: false }, { status: 200, rasta: true }]);
  T(v.pavyko === true && v.stabdyti === false, 'antras bandymas pavyko – nestabdom');
  T(v.kodas === null, 'kodo nėra');
  const v2 = S.verdiktas([{ status: 200, rasta: true }]);
  T(v2.pavyko === true, 'pirmas bandymas pavyko');
}

// ── Timeout / tinklo klaida (status 0) ─────────────────────────────────────
{
  const v = S.verdiktas([{ status: 0, rasta: false }, { status: 0, rasta: false }, { status: 0, rasta: false }]);
  T(v.stabdyti === false, 'vien laiko limitai – portalo nestabdom');
  T(v.kodas === 'SKELBIMAS_NERASTAS', 'timeout = šito skelbimo bėda');
}
{
  const v = S.verdiktas([{ status: 404, rasta: false }]);
  T(v.stabdyti === false && v.kodas === 'SKELBIMAS_NERASTAS', '404 – skelbimo nebėra, portalas veikia');
}

// ── Kraštiniai ─────────────────────────────────────────────────────────────
T(S.verdiktas([]).stabdyti === false, 'tuščias sąrašas nestabdo portalo');
T(S.verdiktas(null).kodas === 'SKELBIMAS_NERASTAS', 'null nenukrenta');
T(S.verdiktas([null, undefined]).stabdyti === false, 'šiukšlės sąraše nenukrenta');
T(typeof S.verdiktas([{ status: 500 }]).priezastis === 'string', 'priežastis visada tekstas (žurnalui)');

// ── Taisyklė, kurią saugom ─────────────────────────────────────────────────
{
  // Stabdis gali atsirasti TIK tada, kai buvo bent vienas 200 be skelbimo.
  const atvejai = [
    [[{ status: 500, rasta: false }], false],
    [[{ status: 502, rasta: false }, { status: 503, rasta: false }], false],
    [[{ status: 0, rasta: false }, { status: 404, rasta: false }], false],
    [[{ status: 200, rasta: false }], true],
    [[{ status: 200, rasta: true }], false],
  ];
  let blogu = 0;
  atvejai.forEach(([b, laukiama]) => { if (S.verdiktas(b).stabdyti !== laukiama) blogu++; });
  T(blogu === 0, 'stabdis atsiranda tik po 200 be skelbimo (' + atvejai.length + ' atvejai)');
}

console.log('\nmobilede-stabdis: ' + (n - klaidu) + '/' + n + ' ok' + (klaidu ? ', ' + klaidu + ' BLOGAI' : ''));
process.exit(klaidu ? 1 : 0);
