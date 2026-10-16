// backend/rinkos-mediana.js — rinkos mediana, atspari netikroms kainoms.
//
// v2.4.0 (Nr. 43). Iki šiol mediana buvo skaičiuojama iš VISŲ kainų, išskyrus
// tas, kurias pažymėjo `kainosPatikra`. Pamatuota archyve (2026-09-21): 2023+
// benzininių X5 imtyje 6 iš 23 kainų buvo 14–31 tūkst. € — lizingo įmokos,
// dalys, daužti. Nė viena nebuvo pažymėta. Mediana nukrito, ir normalūs
// skelbimai rodėsi „+30 % virš rinkos". Archyve rasta ir X5 už 92 mlrd. €.
//
// Mediana pati savaime atspari KELIOMS išskirtims, bet ne ketvirtadaliui imties.
// Todėl du žingsniai:
//   1) absoliutūs rėmai: kaina < 500 € arba > 1 500 000 € — ne automobilio kaina;
//   2) santykiniai rėmai nuo pirminės medianos: < 0,4× arba > 2,5× — į medianą
//      neįeina. Pats skelbimas NEIŠMETAMAS: jis toliau rodomas ir lyginamas su
//      švaria mediana (tad jo nuolaida tampa matoma, o ne paslėpta).
//
// Kodėl 0,4 ir 2,5: X5 pavyzdyje 0,4 × 73 491 = 29 396 — atkerta penkias iš
// šešių netikrų kainų, o normalus 5 metų skirtumas modelio viduje retai
// peržengia 2,5 karto. Rėmai taikomi tik kai imtyje ≥ 5 kainos: mažoje imtyje
// pirminė mediana pati nepatikima, ir ji atkirstų teisingas kainas.

const { rinkaPagalPortala } = require('./rinkos');

const MIN_KAINA = 500;
const MAX_KAINA = 1500000;
const APACIA = 0.4;
const VIRSUS = 2.5;
const MIN_IMTIS_REMAMS = 5;

const med = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

// Grąžina { median, count, atmesta } — `atmesta` = kiek kainų į medianą neįėjo.
function atspariMediana(kainos) {
  const tinkamos = (kainos || []).filter((k) => Number.isFinite(k) && k >= MIN_KAINA && k <= MAX_KAINA);
  let atmesta = (kainos || []).length - tinkamos.length;
  if (tinkamos.length < MIN_IMTIS_REMAMS) {
    return { median: med(tinkamos), count: tinkamos.length, atmesta };
  }
  const m0 = med(tinkamos);
  const svarios = tinkamos.filter((k) => k >= m0 * APACIA && k <= m0 * VIRSUS);
  atmesta += tinkamos.length - svarios.length;
  return { median: med(svarios), count: svarios.length, atmesta };
}

// Ta pati sąsaja, kaip buvusi `computeMarketMedians` server.js — kvietėjai nekeičiami.
// v2.10.6: jei skelbimas turi `rinkosGrupe` (kartos fazė, pvz. „G05 LCI"), kaina
// papildomai skaičiuojama ir grupės medianai: medians[modelis].grupes[grupe].
function computeMarketMedians(parsedListings) {
  const byModel = {};
  const ridaByModel = {};
  const byGrupe = {};
  // v2.17.0 (A punktas): ta pati kaina papildomai renkama ir pagal rinką (LT/DE/EU/PL),
  // kad skelbimas būtų lyginamas su SAVO rinka, o ne su visų penkių portalų mišiniu.
  const byRinka = {};
  const byRinkaGrupe = {};
  (parsedListings || []).forEach((l) => {
    // Lizingo įmokos ir klaidingai įvestos sumos, kurias jau pažymėjo kainosPatikra
    if (l.kaina && !l.kainosIspejimas) {
      (byModel[l.modelis] = byModel[l.modelis] || []).push(l.kaina);
      const gr = l.rinkosGrupes || (l.rinkosGrupe ? [l.rinkosGrupe] : []);
      if (gr.length) {
        const g = (byGrupe[l.modelis] = byGrupe[l.modelis] || {});
        gr.forEach((x) => (g[x] = g[x] || []).push(l.kaina));
      }
      const rinka = l.rinka || rinkaPagalPortala(l.source || l.portalas);
      if (rinka) {
        const r = (byRinka[l.modelis] = byRinka[l.modelis] || {});
        (r[rinka] = r[rinka] || []).push(l.kaina);
        if (gr.length) {
          const rg = (byRinkaGrupe[l.modelis] = byRinkaGrupe[l.modelis] || {});
          const rgr = (rg[rinka] = rg[rinka] || {});
          gr.forEach((x) => (rgr[x] = rgr[x] || []).push(l.kaina));
        }
      }
    }
    if (l.rida) (ridaByModel[l.modelis] = ridaByModel[l.modelis] || []).push(l.rida);
  });
  const medians = {};
  for (const [model, prices] of Object.entries(byModel)) {
    const k = atspariMediana(prices);
    const r = ridaByModel[model] || [];
    const grupes = {};
    for (const [gr, kainos] of Object.entries(byGrupe[model] || {})) {
      const gm = atspariMediana(kainos);
      grupes[gr] = { median: gm.median, count: gm.count };
    }
    const rinkos = {};
    for (const [rk, kainos] of Object.entries(byRinka[model] || {})) {
      const rm = atspariMediana(kainos);
      const rgrupes = {};
      for (const [gr, gk] of Object.entries((byRinkaGrupe[model] || {})[rk] || {})) {
        const gm = atspariMediana(gk);
        rgrupes[gr] = { median: gm.median, count: gm.count };
      }
      rinkos[rk] = { median: rm.median, count: rm.count, grupes: rgrupes };
    }
    medians[model] = {
      median: k.median,
      count: k.count,
      atmesta: k.atmesta,
      ridaMedian: r.length ? med(r) : null,
      ridaCount: r.length,
      grupes,
      rinkos,
    };
  }
  return medians;
}

// Kuria mediana lyginti skelbimą: pirma grupė (pirmenybės tvarka: fazė, visa
// karta), kurioje ≥ MIN_GRUPEI kainų, kitaip – viso modelio. `grupes` – masyvas
// arba viena eilutė. Grąžina { median, count, grupe|null }.
const MIN_GRUPEI = 5;
// AN-0923-NAUJAS: naujų automobilių rinkoje visada mažiau, tad „naujas" grupei
// užtenka 3 kainų – kitaip ji beveik niekada nesusidarydavo ir naujas auto vis
// tiek buvo lyginamas su naudotais.
const MIN_NAUJU_GRUPEI = 3;
function grupesRiba(gr) { return gr === 'naujas' ? MIN_NAUJU_GRUPEI : MIN_GRUPEI; }

// v2.17.0 (A punktas): pirmenybė SAVO rinkai. Eiliškumas – nuo tiksliausio prie
// bendriausio, kiekvieną kartą reikalaujant pakankamos imties:
//   1) ta pati rinka + ta pati kartos fazė  (tiksliausia: „G05 LCI Vokietijoje")
//   2) ta pati rinka                        („X5 Vokietijoje")
//   3) kartos fazė, visos rinkos            (kaip iki šiol)
//   4) visas modelis, visos rinkos          (kaip iki šiol)
// Jei savos rinkos imtis per maža, krentam žemyn, bet grąžiname `rinka: null`,
// kad rodinys galėtų sąžiningai parašyti, su kuo lyginta.
const MIN_RINKAI = 5;

function lyginimoMediana(marketData, grupes, rinka) {
  if (!marketData) return null;
  const sar = Array.isArray(grupes) ? grupes : (grupes ? [grupes] : []);
  const r = rinka && marketData.rinkos ? marketData.rinkos[rinka] : null;
  if (r) {
    for (const gr of sar) {
      const g = r.grupes ? r.grupes[gr] : null;
      if (g && g.count >= grupesRiba(gr) && g.median) {
        return { median: g.median, count: g.count, grupe: gr, rinka };
      }
    }
    if (r.median && r.count >= MIN_RINKAI) {
      return { median: r.median, count: r.count, grupe: null, rinka };
    }
  }
  for (const gr of sar) {
    const g = marketData.grupes ? marketData.grupes[gr] : null;
    if (g && g.count >= grupesRiba(gr) && g.median) return { median: g.median, count: g.count, grupe: gr, rinka: null };
  }
  return { median: marketData.median, count: marketData.count, grupe: null, rinka: null };
}

module.exports = { atspariMediana, computeMarketMedians, lyginimoMediana, MIN_GRUPEI, MIN_NAUJU_GRUPEI, MIN_RINKAI, RIBOS: { MIN_KAINA, MAX_KAINA, APACIA, VIRSUS, MIN_IMTIS_REMAMS } };
