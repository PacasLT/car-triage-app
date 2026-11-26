// archyvo-rezis.js — archyvo skelbimai į medianą tik tame pačiame rėžyje.
//
// KODĖL (pamatuota 2026-11-26, PATIKRA-2026-11-26.md §3).
// `server.js` medianas skaičiuoja iš dabartinės paieškos PLIUS archyvo
// (`cache.getHistoryForModel`). Archyvas buvo imamas BE jokio filtro, nors
// paieška turėjo metų rėžį. Pamatuotas atvejis, paieška „BMW 5, 2024+":
//
//   šioje paieškoje BMW 540 buvo VIENAS skelbimas: 2024 m., 34 300 km, 59 900 €
//   o mediana sakė:  21 950 €  ·  n = 21  ·  ridos mediana 221 000 km
//
// Tai 2010–2023 m. 540-ieji iš spalio skenavimų. Pasekmė tiesioginė: bet kuriam
// 2024 m. BMW 540 rinkos mediana būtų 21 950 € vietoj ~59 900, tad „žemiau
// rinkos %" ir MAX PIRKIMO KAINA – svarbiausias perpardavėjo skaičius – būtų
// apie tris kartus neteisingi. 520/530/550 imtys didelės, todėl ten tai
// nesimatė: klaida matosi tik ten, kur archyvo seni skelbimai sudaro didžią dalį.
//
// SPRENDIMAS: archyvo įrašui taikom TUOS PAČIUS rėžius, kuriuos vartotojas
// nurodė paieškai. Jei įrašas rėžio neatitinka – jo į medianą neimam.
//
// Metų NETURINTIS įrašas, kai metų rėžis nurodytas, IŠMETAMAS. Negalim
// patikrinti, ar jis telpa, o spėjimo nerašom (ta pati taisyklė kaip v2.29.1
// kartų grupėse: prie ribos geriau tuščia, nei spėta).
'use strict';

const sk = (x) => (x == null || x === '' ? NaN : Number(x));

function telpa(irasas, filtrai) {
  const f = filtrai || {};
  const metaiNuo = sk(f.metaiNuo), metaiIki = sk(f.metaiIki), ridaIki = sk(f.ridaIki);
  const arMetuRezis = Number.isFinite(metaiNuo) || Number.isFinite(metaiIki);

  if (arMetuRezis) {
    const m = sk(irasas && irasas.metai);
    if (!Number.isFinite(m)) return false;                  // nežinom – neimam
    if (Number.isFinite(metaiNuo) && m < metaiNuo) return false;
    if (Number.isFinite(metaiIki) && m > metaiIki) return false;
  }

  // Rida: ribojam tik iš viršaus, ir tik kai vartotojas ribą nurodė. Ridos
  // NETURINTIS įrašas lieka – rida dažnai nenurodyta ir dėl to prarastume
  // per daug imties, o kainai ji turi mažesnę įtaką nei metai.
  if (Number.isFinite(ridaIki)) {
    const r = sk(irasas && irasas.rida);
    if (Number.isFinite(r) && r > ridaIki) return false;
  }

  return true;
}

// Patogumas kvietėjui: grąžina { imti, atmesta }
function filtruoti(sarasas, filtrai) {
  const imti = [], visi = sarasas || [];
  for (const x of visi) if (telpa(x, filtrai)) imti.push(x);
  return { imti, atmesta: visi.length - imti.length };
}

module.exports = { telpa, filtruoti };
