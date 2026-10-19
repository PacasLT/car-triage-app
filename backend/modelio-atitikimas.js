// backend/modelio-atitikimas.js — ar portalo grąžintas skelbimas TIKRAI yra to
// modelio, kurio prašė vartotojas.
//
// v2.28.1 (Luko klaida Nr.55: „Paleidus BMW 5 paieska gavome ir x1/x3 ir x5").
//
// Iki šiol filtras buvo poeilė:
//     (l.modelis || '').toLowerCase().includes(modelQuery)
//  || (l.rawText || '').toLowerCase().includes(modelQuery)
//
// Su trumpu skaitiniu modeliu tai beveik nieko neatfiltruoja: „X5", „525" ir
// „350" visi turi „5", o `rawText` turi „5" praktiškai visada – 2015 metai,
// 150 kW, 15 500 €. Produkcijos žurnalas 2026-10-19:
//
//     autoscout24.com: modelio filtras portale nesuveikė – is 961 skelbimų
//     tik 446 yra „5". Atfiltravom patys.
//
// Tie 446 buvo atrinkti ta pačia poeile, tad tarp jų liko X1, X3 ir X5 – būtent
// tai Lukas ir pamatė. Mokėjom už 961 puslapį, panaudojom 446, ir dalis jų ne to
// modelio.
//
// Dabar lyginam RAKTĄ: `regitra.baziniModelis` paverčia „520d" → „BMW 5",
// „X5 xDrive30d" → „BMW X5", „E 220 CDI" → „MERCEDES E". Ta pati funkcija, kuria
// lyginam medianą ir kainos kreivę, su savo sargu (`regitra.test.js`).
//
// Ko SĄMONINGAI nedarom: neišmetam skelbimo, kurio modelio nustatyti neįmanoma
// (nėra nei `modelis`, nei antraštės). Už jį jau sumokėta, o spėjimu išmesti
// teisingą skelbimą kainuoja daugiau nei parodyti vieną netinkamą.

const regitra = require('./regitra');

// Žodžio riba su lietuviškomis raidėmis: `\b` jų nelaiko žodžio dalimi, tad
// „BMW 5" sutaptų su „serija5", o „Ė" lūžtų. Naudojam aiškią neraidės/neskaitmens
// ribą su Unicode klasėmis.
function zodzioRiba(fraze, tekstas) {
  if (!fraze || !tekstas) return false;
  const esc = String(fraze).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return new RegExp('(^|[^\\p{L}\\p{N}])' + esc + '([^\\p{L}\\p{N}]|$)', 'iu').test(String(tekstas));
  } catch (e) {
    return String(tekstas).toLowerCase().includes(String(fraze).toLowerCase());
  }
}

// Grąžina funkciją (skelbimas) → ar tinka. Kai modelio neprašyta arba raktas
// neapibrėžtas (BMW „X serija" nesako, ar X1, ar X5), praleidžiam viską.
function tikrintuvas(marke, modelis) {
  const norimas = modelis ? regitra.baziniModelis(marke, modelis) : null;
  if (!norimas) return () => true;
  return (l) => {
    if (!l) return false;
    const turi = regitra.baziniModelis(marke, l.modelis);
    if (turi) return turi === norimas;
    const antraste = l.pavadinimas || l.title || '';
    if (!antraste) return true;
    // Antrastei ta pati funkcija: „BMW 520d Touring" -> „BMW 5". Tik jei ir iz
    // antrastes rakto nustatyti nepavyksta, tikrinam zodzio riba.
    const isAntrastes = regitra.baziniModelis(marke, antraste);
    if (isAntrastes) return isAntrastes === norimas;
    return zodzioRiba(norimas, antraste) || zodzioRiba(modelis, antraste);
  };
}

module.exports = { tikrintuvas, zodzioRiba };
