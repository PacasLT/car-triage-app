// backend/mobilede-stabdis.js — kada mobile.de laikom neprieinamu VISAM portalui,
// o kada kaltas tik vienas skelbimas.
//
// v2.28.2 (Luko klaida Nr.52, antras sluoksnis).
//
// Pamatuota produkcijoje 2026-10-19 18:09–18:12, viename paieškos žingsnyje:
//
//   [MOBILEDE-SKELBIMAS] standartinis -> 200 824418 simb. kaina=1 RASTA
//   [MOBILEDE-SKELBIMAS] standartinis -> 200 584680 simb. kaina=1 RASTA
//   [MOBILEDE-SKELBIMAS] standartinis -> 500 208 simb. kaina=0 ne
//   [MOBILEDE-SKELBIMAS] render       -> 500 208 simb. kaina=0 ne
//   [MOBILEDE-SKELBIMAS] premium      -> 500 208 simb. kaina=0 ne
//
// Du skelbimai perskaityti puikiai, po vieną kreditą. Trečias – ScraperAPI 500
// visais trimis būdais. Ir po to VISAS mobile.de buvo išjungtas 6 valandoms,
// nors portalas veikė. Tą Lukas ir pamatė: 14:24 „(apsauga)", 14:29
// „(patikrinta neseniai)" – antrasis pranešimas buvo pirmojo pasekmė.
//
// Skirtumas, kurio iki šiol nedarėm:
//   200, bet skelbimo nerandam → iššūkio puslapis → portalas TIKRAI blokuoja
//   ne 200 (500 / 404)         → tas skelbimas neprieinamas → portalas niekuo dėtas
//
// Vienas negyvas skelbimas negali išjungti portalo šešioms valandoms.

// bandymai: [{ status, rasta }] – po vieną kiekvienam būdui.
// Grąžina { pavyko, kodas, stabdyti, priezastis }.
function verdiktas(bandymai) {
  const b = Array.isArray(bandymai) ? bandymai : [];
  if (b.some((x) => x && x.status === 200 && x.rasta)) {
    return { pavyko: true, kodas: null, stabdyti: false, priezastis: 'perskaityta' };
  }
  if (b.some((x) => x && x.status === 200)) {
    // Puslapis atiduotas, bet skelbimo jame nėra – iššūkis / apsauga.
    return { pavyko: false, kodas: 'MOBILEDE_NEPRIEINAMA', stabdyti: true, priezastis: 'issukio puslapis' };
  }
  // Nė vieno 200: 500, 404, timeout. Tai šito skelbimo (arba ScraperAPI) bėda.
  return { pavyko: false, kodas: 'SKELBIMAS_NERASTAS', stabdyti: false, priezastis: 'skelbimas neprieinamas' };
}

module.exports = { verdiktas };
