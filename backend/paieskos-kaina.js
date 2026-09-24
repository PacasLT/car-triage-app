// backend/paieskos-kaina.js — kiek ScraperAPI kreditų kainuos paieška (v2.15.0).
//
// KODĖL ATSKIRAS FAILAS: nuo v2.15.0 vartotojas gali pasirinkti „visus
// puslapius", tad kaina nebėra beveik pastovi (3 psl. ≈ 60 kr.), o priklauso
// nuo pasirinkimo. Skaičiavimas turi būti vienoje vietoje ir patikrinamas
// testu — server.js jį naudoja DU kartus: sąmatai prieš paiešką ir stabdžiui.
//
// Įkainiai pamatuoti ScraperAPI ataskaitoje (2026-09-21, SAVIKAINA §7):
// LT portalai eina per apsaugą ir kainuoja 10 kr. už puslapį, užsienio — 1 kr.
// (render=false). Retas render pakartojimas (tuščias puslapis) čia
// neskaičiuojamas: jis nutinka < 5 % atvejų ir sąmatą darytų baugesnę, nei yra.
const PAIESKOS_KREDITAI = { autoplius: 10, autogidas: 10, autoscout24: 1, otomoto: 1, mobilede: 1 };
const KREDITAS_EUR = 0.000425;            // Hobby planas, SAVIKAINA §3

// Portalo riba: toliau jis paprasčiausiai negrąžina skelbimų (mobile.de
// pamatuota 2026-09-21). Sąmatoje tai svarbu — kitaip „visi puslapiai"
// parodytų kainą už puslapius, kurių niekada nebus.
const PORTALU_RIBA = { mobilede: 100 };

// „Visi puslapiai" nėra begalybė: 50 psl. × 20 skelbimų = 1 000 vienam
// portalui. Realiai sąrašas baigiasi anksčiau ir skenavimas sustoja pats.
const VISI_PUSLAPIAI = 50;

function kainaPortalui(portalas) {
  return PAIESKOS_KREDITAI[portalas] || 1;
}

function puslapiuPortalui(portalas, puslapiu) {
  const r = PORTALU_RIBA[portalas];
  return r ? Math.min(puslapiu, r) : puslapiu;
}

// samata(['autoplius','mobilede'], 5) -> { kr: 55, eilutes: [...] }
function samata(portalai, puslapiu) {
  const p = Math.max(1, parseInt(puslapiu, 10) || 1);
  const eilutes = (portalai || []).map((portalas) => {
    const psl = puslapiuPortalui(portalas, p);
    return { portalas, puslapiu: psl, kr: psl * kainaPortalui(portalas) };
  });
  return { eilutes, kr: eilutes.reduce((s, e) => s + e.kr, 0), puslapiu: p };
}

// Kiek puslapių telpa į ribą. Grąžina bent 1 — paieška be nė vieno puslapio
// neturi prasmės, o vieno puslapio kaina visada mažesnė už stabdžio ribą.
function telpaPuslapiu(portalai, riba) {
  const r = Math.max(0, parseInt(riba, 10) || 0);
  if (!portalai || !portalai.length) return 1;
  for (let p = 1; p <= VISI_PUSLAPIAI; p++) {
    if (samata(portalai, p + 1).kr > r) return p;
  }
  return VISI_PUSLAPIAI;
}

function eurais(kr) {
  return Math.round(kr * KREDITAS_EUR * 100) / 100;
}

module.exports = { PAIESKOS_KREDITAI, PORTALU_RIBA, VISI_PUSLAPIAI, KREDITAS_EUR, kainaPortalui, samata, telpaPuslapiu, eurais };
