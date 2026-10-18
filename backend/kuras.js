// kuras.js — kuro filtro reikšmių sąrašas.
//
// v2.23.0: kuro filtras tapo DAUGIAREIKŠMIS. Iki tol `filters.kuras` buvo
// vienas raktas („benzinas"); dabar tai gali būti keli, atskirti kableliu
// („benzinas,benzinas_elektra"). Perpardavėjui to reikia nuolat: benzininis
// ir benzinas/elektra jam yra ta pati lentyna, o dyzelinas – jau kita.
//
// SVARBU – tai NEKAINUOJA papildomų kreditų: visi penki portalai kuro filtrą
// priima kaip SĄRAŠĄ viename URL (autoplius `fuel_id[]`, autogidas `f_2[]`,
// autoscout24 `fuel=B,2`, otomoto `filter_enum_fuel_type[]`, mobile.de `ft=`).
// Daugiau pažymėtų kurų = tas pats vienas užklausimas portalui, tik platesnis.
//
// Modulis atskiras, nes tą pačią eilutę skaito ir `server.js`, ir `mobilede.js`.
'use strict';

function kuroSarasas(filtras) {
  if (Array.isArray(filtras)) filtras = filtras.join(',');
  return String(filtras || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Surenka portalo kodus visiems pažymėtiems kurams, be pasikartojimų.
// `zemelapis` – portalo lentelė (raktas -> kodas arba kodų masyvas).
function kuroKodai(filtras, zemelapis) {
  const matyti = new Set();
  const kodai = [];
  for (const k of kuroSarasas(filtras)) {
    const v = zemelapis[k];
    if (v == null) continue;
    for (const kodas of (Array.isArray(v) ? v : [v])) {
      const raktas = JSON.stringify(kodas);
      if (matyti.has(raktas)) continue;
      matyti.add(raktas);
      kodai.push(kodas);
    }
  }
  return kodai;
}

module.exports = { kuroSarasas, kuroKodai };
