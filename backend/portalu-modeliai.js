// portalu-modeliai.js — modelio vardo vertimas į kiekvieno portalo adresą.
//
// KODĖL ŠIS FAILAS YRA (pamatuota 2026-11-26, PATIKRA-2026-11-26.md §2).
// Sąsajos modelio reikšmės yra autoplius formato („5", „X5", „C Klasė"). Iki šiol
// `buildAutoscout24Url`, `buildOtomotoUrl` ir `buildAutogidasUrl` tą eilutę kėlė į
// adresą ŽALIĄ. Tik `mobilede.js` turėjo vertimo lentelę. Pasekmės, pamatuotos
// gyvai per `/api/quick-count`:
//
//   AS24  „BMW 5"           = 17 558  ← tiek pat, kiek „BMW be modelio"
//   AS24  „BMW 5-series"    =    645     t.y. modelio filtras IGNORUOJAMAS
//   OT    „BMW 5"           =      0  ← Lenkija tyliai iškrenta
//   OT    „BMW seria-5"     =    562
//   AS24  „Mercedes C Klasė"= 206 489 ← visi Mercedes (lietuviška raidė + tarpas)
//   AS24  „c-class"         =  26 935
//   OT    „c-klasa"         =    379  (o „klasa-c" = 17 658, t.y. visi)
//
// Rinkos mediana „BMW 5" buvo skaičiuojama iš VISŲ BMW – X5, 1 serijos, M.
// Tai ir tikroji klaidos Nr. 55 priežastis: v2.28.1 `modelio-atitikimas.js`
// išmeta ne tuos REZULTATUS, bet užklausa vis tiek prašė visų BMW.
//
// DU PRINCIPAI:
//
// 1. Į lentelę rašom TIK tai, kas pamatuota portale. Nespėjam. Kiekvienas
//    žemiau esantis slug'as patikrintas `/api/quick-count` užklausa, ir
//    patikros skaičius įrašytas komentare.
//
// 2. Kai markė lentelėje YRA, o modelio joje nėra – grąžinam `rastas: false`
//    ir kvietėjas to portalo NESKENUOJA. Tylus nukritimas į „visa markė" yra
//    blogiau nei portalo praleidimas: jis atrodo kaip rezultatas, kainuoja
//    kreditus ir sugadina medianą. Markėms, kurių lentelėje nėra, elgiamės kaip
//    anksčiau (eilutė perduodama kaip yra) – jiems tai veikia ir regresijos nėra.
'use strict';

// Patikrinta 2026-11-26. Skaičius = kiek skelbimų portalas grąžino su tuo slug'u
// (be metų filtro), kai „be modelio" grąžindavo 176 349 (AS24) / 17 658 (OT).
const SLUGAI = {
  autoscout24: {
    BMW: {
      '1': '1-series',   // 24 211
      '2': '2-series',   // 14 505
      '3': '3-series',   // 28 355
      '4': '4-series',   //  8 071
      '5': '5-series',   // 18 443
      '6': '6-series',   //  1 337
      '7': '7-series',   //  2 262
      '8': '8-series',   //    517
      // X1…X7, Z4 sąmoningai NERAŠOMI: jų sąsajos vardas portale veikia
      // (patikrinta – „X5" grąžina X5, ne visus BMW), tad eina kaip yra.
      // „M" – slug'o nerandu, tad `rastas: false` ir portalas praleidžiamas.
    },
    'Mercedes-Benz': {
      'A Klasė':   'a-class',  // 24 154
      'B Klasė':   'b-class',  // 10 026
      'C Klasė':   'c-class',  // 26 935
      'E Klasė':   'e-class',  // 18 643
      'S Klasė':   's-class',  //  4 597
      'CLA Klasė': 'cla',      // 15 576
      'ML Klasė':  'm-class',  //  1 520  („ml-class" = 206 489, t.y. visi)
      // GLA, GLC, GLE, Vito, Sprinter – veikia kaip yra.
    },
  },
  otomoto: {
    BMW: {
      '1': 'seria-1',   // 1 784
      '2': 'seria-2',   //   718
      '3': 'seria-3',   // 4 053
      '4': 'seria-4',   //   775
      '5': 'seria-5',   // 3 496
      '6': 'seria-6',   //   165
      '7': 'seria-7',   //   712
      '8': 'seria-8',   //   118
    },
    'Mercedes-Benz': {
      'A Klasė': 'a-klasa',  // 1 283
      'B Klasė': 'b-klasa',  //   617
      'C Klasė': 'c-klasa',  //   379
      'E Klasė': 'e-klasa',  // 2 405
      'S Klasė': 's-klasa',  //   982
      // CLA ir ML: „cla" ir „ml-klasa" abu grąžino 17 658 = visi Mercedes,
      // t.y. slug'as ne tas. Teisingo nerandu, tad NERAŠOM – geriau praleisti
      // portalą, nei nuskaityti visus Mercedes ir pavadinti tai CLA rinka.
    },
  },
  // autogidas: `f_model_14[0]=<vardas>` – lentelė dar nepamatuota. „BMW 5"
  // grąžina 0, nors AG BMW be modelio = 247, tad problema ta pati. Kol nėra
  // pamatuotų vardų, nerašom nieko: markės lentelės nėra, tad elgiamės kaip
  // anksčiau ir nieko nesulaužom.
};

// Markės, kurių modelio sąrašas lentelėje laikomas IŠSAMIU: joms nežinomas
// modelis reiškia „neskenuojam", o ne „skenuojam viską".
function markeLenteleje(portalas, marke) {
  const p = SLUGAI[portalas];
  return !!(p && marke && p[marke]);
}

// Grąžina { slug, rastas }.
//   rastas: true  – naudok `slug` (jis gali būti ir tas pats sąsajos vardas)
//   rastas: false – markė lentelėje yra, modelio nėra → portalo NESKENUOK
function slug(portalas, marke, modelis) {
  if (!modelis) return { slug: null, rastas: true };       // be modelio – visa markė, sąmoningai
  if (!markeLenteleje(portalas, marke)) return { slug: modelis, rastas: true };
  const lent = SLUGAI[portalas][marke];
  const v = lent[modelis];
  if (v) return { slug: v, rastas: true };
  // Markė lentelėje, modelio nėra. Jei modelis NĖRA iš tų, kuriems vertimo
  // reikia (pvz. „X5"), jis veikia kaip yra. Atskiriam pagal tai, ar sąsajos
  // vardas yra vien skaičius / vien raidė / turi „Klasė" – tokie portale
  // tikrai neveikia (pamatuota).
  const reikiaVertimo = /^[0-9]{1,3}$/.test(modelis) || /^[A-Z]$/.test(modelis) || /klas/i.test(modelis);
  if (reikiaVertimo) return { slug: null, rastas: false };
  return { slug: modelis, rastas: true };
}

module.exports = { SLUGAI, slug, markeLenteleje };
