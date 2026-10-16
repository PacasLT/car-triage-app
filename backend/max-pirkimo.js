// backend/max-pirkimo.js — DIDŽIAUSIA PIRKIMO KAINA.
//
// Svarbiausias skaičius visame perpardavėjo rodinyje: su kuriuo žmogus eina
// derėtis. Ne „kiek auto vertas", o „daugiausia kiek galiu mokėti, kad man
// liktų marža".
//
// FORMULĖ (dizainerio pasiūlyta, mūsų patikrinta 2026-10-16):
//
//     max = pardavimasLT / (1 + marža) − kaštai − tarša
//
// Ji duoda tiksliai ROI = marža nuo INVESTUOTŲ pinigų:
//     investicija = max + kaštai + tarša = pardavimasLT / (1 + marža)
//     pelnas      = pardavimasLT − investicija = S·m / (1 + m)
//     ROI         = pelnas / investicija = m                      ✓
//
// TRYS TAISYKLĖS, be kurių skaičius meluotų:
//
// 1. `pardavimasLT` – TOS PAČIOS KARTOS **Lietuvos** rinkos mediana, ne visų
//    portalų mišinys (v2.17.0). Jei patikimos LT medianos nėra, max
//    NESKAIČIUOJAMAS – grąžinam `null` ir priežastį. Geriau nerodyti, nei
//    rodyti skaičių, kuris remiasi į vokišką kainą.
//
// 2. Niekas realiai neparduoda už medianą. Į pardavimo kainą įvedama
//    atsargos nuolaida (`PARDAVIMO_NUOLAIDA`), kad max būtų konservatyvus.
//
// 3. Kai taršos mokesčio tiksliai nežinom (CO₂ skelbime nėra), max nebėra
//    tikslus – jis VIRŠUTINĖ RIBA. Grąžinam `riba: true`, ir rodinys rašo
//    „iki …" (dizainerio `.is-key.is-cap`, Errata 17).

// Luko sprendimas 2026-10-16: siekiama marža – iki 10 %.
const MARZA_NUMATYTA = 0.10;
const MARZOS = [0.10, 0.15, 0.20];

// Atsargos nuolaida nuo LT medianos. Kol Lukas nepatikslino – 3 %.
const PARDAVIMO_NUOLAIDA = 0.03;

function pardavimoKaina(ltMediana) {
  if (!Number.isFinite(ltMediana) || ltMediana <= 0) return null;
  return Math.round(ltMediana * (1 - PARDAVIMO_NUOLAIDA));
}

// skaiciuoti({ ltMediana: 18550, kastai: 850, tarsa: 65, marza: 0.10 })
//   -> { max, pardavimas, investicija, marza, riba, ... }
function skaiciuoti({ ltMediana, kastai, tarsa, tarsosTikslumas, marza } = {}) {
  const m = Number.isFinite(marza) && marza > 0 ? marza : MARZA_NUMATYTA;
  const pardavimas = pardavimoKaina(ltMediana);
  if (pardavimas === null) {
    return { max: null, priezastis: 'Nėra patikimos Lietuvos rinkos medianos šiai kartai.', marza: m };
  }
  const k = Number.isFinite(kastai) ? kastai : 0;
  const t = Number.isFinite(tarsa) ? tarsa : 0;
  const investicija = pardavimas / (1 + m);
  const max = Math.round(investicija - k - t);
  if (max <= 0) {
    return { max: null, priezastis: 'Po kaštų ir mokesčių šiai maržai vietos nelieka.', marza: m, pardavimas };
  }
  return {
    max,
    pardavimas,
    investicija: Math.round(investicija),
    kastai: k,
    tarsa: t,
    marza: m,
    // Taršos tiksliai nežinom -> max yra viršutinė riba, ne tikslus skaičius.
    riba: tarsosTikslumas === 'nezinoma',
    nuolaida: PARDAVIMO_NUOLAIDA,
  };
}

// Pelnas ir ROI prie TIKROS skelbimo kainos (ne prie max).
function pelnas({ kaina, ltMediana, kastai, tarsa } = {}) {
  const pardavimas = pardavimoKaina(ltMediana);
  if (pardavimas === null || !Number.isFinite(kaina) || kaina <= 0) return null;
  const investicija = kaina + (Number.isFinite(kastai) ? kastai : 0) + (Number.isFinite(tarsa) ? tarsa : 0);
  const p = Math.round(pardavimas - investicija);
  return { pelnas: p, investicija: Math.round(investicija), roi: Math.round((p / investicija) * 100), pardavimas };
}

// „telpa · +750" arba „derėtis −650" (dizainerio 66 pk.)
function derybos(kaina, max) {
  if (!Number.isFinite(kaina) || !Number.isFinite(max)) return null;
  const sk = max - kaina;
  return sk >= 0
    ? { busena: 'telpa', skirtumas: sk, tekstas: 'telpa · +' + sk }
    : { busena: 'derybos', skirtumas: sk, tekstas: 'derėtis −' + Math.abs(sk) };
}

module.exports = { MARZA_NUMATYTA, MARZOS, PARDAVIMO_NUOLAIDA, pardavimoKaina, skaiciuoti, pelnas, derybos };
