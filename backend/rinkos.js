// backend/rinkos.js — rinka (šalis), iš kurios skelbimas, ir apytikslė kaina Lietuvoje.
//
// KODĖL (PERPARDAVEJO-APLINKA.md §1, §2 A punktas): iki šiol mediana buvo
// skaičiuojama iš VISŲ portalų kartu. „−18 % žemiau rinkos" vokiškam skelbimui
// reiškė tik tai, kad Vokietijoje pigiau nei Lietuvoje — ne kad radai gerą
// pasiūlymą. Ir atvirkščiai: geras LT skelbimas skendo, nes mediana patempta
// žemyn užsienio kainų. Nuo v2.17.0 kiekvienas skelbimas pirmiausia lyginamas
// su SAVO rinkos mediana.
//
// KODĖL autoscout24 nėra „DE": mūsų adresas prašo cy=D,A,B,E,F,I,L,NL —
// Vokietija, Austrija, Belgija, Ispanija, Prancūzija, Italija, Liuksemburgas,
// Nyderlandai. Tai mišri Vakarų Europos imtis, todėl ji turi savo rinką (EU),
// o ne dedama kartu su mobile.de.

const tarsosMokestis = require('./tarsos-mokestis');

const PORTALO_RINKA = {
  autoplius: 'LT',
  autogidas: 'LT',
  mobilede: 'DE',
  autoscout24: 'EU',
  otomoto: 'PL',
};

const RINKU_VARDAI = {
  LT: 'Lietuva',
  DE: 'Vokietija',
  EU: 'Vakarų Europa',
  PL: 'Lenkija',
};

// ---------------------------------------------------------------------------
// PARSIVEŽIMO KAŠTAI
//
// v2.18.0: skaičiai nebėra iš lubų – surinkti iš viešų LT rinkos šaltinių
// (2026-10-16). Vis tiek tai ORIENTYRAI: konkretus vežėjas, atstumas ir auto
// dydis keičia sumą, todėl visur rodom „≈".
//
//   transportas  atviru autovežiu, DE → LT 350–500 € (wheelstreet, 2026),
//                kitas vežėjas door-to-door „nuo 600 €" (veza.lt). Imam 450 €.
//                PL arčiau – įvertinta 300 €; Vakarų Europa toliau – 700 €.
//   registracija Regitra: pirmoji registracija (naudotas/įvežtas) 12,45 €
//                + valstybiniai numeriai 7,20 € ≈ 20 €. Lietuvoje pirktam
//                auto – tik valdytojo keitimas 11,30 €.
//   ta           LTSA maksimalūs 2026: benzinas 27,00 €, dyzelinas 31,10 €,
//                dujos 33,80 €. Imam 30 €. LT auto TA dažniausiai galioja.
//   paruosimas   plovimas, poliravimas, smulkūs trūkumai, nuotraukos.
//                Viešo šaltinio nėra – tai LUKO skaičius: 350 € (2026-10-16).
//
// NEĮSKAIČIUOTA sąmoningai: PVM (priklauso nuo pirkimo per įmonę ir sąskaitos
// tipo), remontas (priklauso nuo konkretaus auto) ir kelionė apžiūrėti
// (200–400 €, jei važiuojama patikrinti prieš perkant).
//
// Taršos (registracijos) mokestis NEBĖRA šiame sąraše – jis skaičiuojamas
// atskirai pagal kurą ir variklį (`tarsos-mokestis.js`), nes tarp dviejų
// vienodos kainos auto jis skiriasi šimtais eurų.
// ---------------------------------------------------------------------------
const KASTAI = {
  LT: { transportas: 0,   registracija: 11, ta: 0,  paruosimas: 350 },
  DE: { transportas: 450, registracija: 20, ta: 30, paruosimas: 350 },
  EU: { transportas: 700, registracija: 20, ta: 30, paruosimas: 350 },
  PL: { transportas: 300, registracija: 20, ta: 30, paruosimas: 350 },
};

const NEISKAICIUOTA = ['PVM', 'remontas', 'kelionė apžiūrėti'];

// Pristatymo trukmė dienomis – verdiktui „pigiau DE, bet +5–7 d." (68 pk.).
// Tokio lauko skelbimuose nėra; tai konstanta pagal vežėjų skelbiamus terminus
// (wheelstreet 2026: DE → LT 5–7 d., tranzitas per Lenkiją 3–4 d.).
// Rodom RĖŽIU, ne tašku – tiksliai niekas nežino.
const PRISTATYMAS = {
  LT: { nuo: 0, iki: 0 },
  DE: { nuo: 5, iki: 7 },
  EU: { nuo: 7, iki: 10 },
  PL: { nuo: 3, iki: 5 },
};

function pristatymas(rinka) {
  return PRISTATYMAS[rinka] || null;
}

// K-72 (v2.23.1): skelbime `l.source` yra DOMENAS – serveris rašo
// `l.source = site`, o `site` yra „autoplius.lt", „autoscout24.com",
// „mobile.de", „otomoto.pl", „autogidas.lt". `PORTALO_RINKA` raktai yra
// trumpieji vardai, tad nuo v2.17.0 ši funkcija PRODUKCIJOJE visada grąžino
// `null`: rinka nežinoma -> `kainaLietuvoje` -> null -> stulpelis „≈ Lietuvoje"
// rodė gryną skelbimo kainą, o MAX – „laukia rinkos". Sargai to nepagavo, nes
// mano pavyzdžiuose `source` buvo trumpasis vardas, kurio portalai neduoda.
// Priimam abi formas; `source` lieka domenas, nes jį sąsaja rodo žmogui.
const DOMENO_RAKTAS = {
  'autoplius.lt': 'autoplius',
  'autogidas.lt': 'autogidas',
  'mobile.de': 'mobilede',
  'autoscout24.com': 'autoscout24',
  'otomoto.pl': 'otomoto',
};
function portaloRaktas(portalas) {
  if (!portalas) return null;
  const s = String(portalas).toLowerCase().trim().replace(/^www\./, '');
  if (PORTALO_RINKA[s]) return s;
  if (DOMENO_RAKTAS[s]) return DOMENO_RAKTAS[s];
  // atsarga, jei domenas ateitų su keliu ar kitu TLD („autoscout24.de")
  for (const [dom, raktas] of Object.entries(DOMENO_RAKTAS)) {
    const vardas = dom.split('.')[0];
    if (s.startsWith(vardas)) return raktas;
  }
  return null;
}
function rinkaPagalPortala(portalas) {
  const k = portaloRaktas(portalas);
  return k ? PORTALO_RINKA[k] : null;
}

function rinkosVardas(rinka) {
  return RINKU_VARDAI[rinka] || rinka || null;
}

// kastai('DE') -> { transportas: 450, registracija: 20, ta: 30, paruosimas: 350, viso: 850 }
function kastai(rinka) {
  const k = KASTAI[rinka];
  if (!k) return null;
  return { ...k, viso: k.transportas + k.registracija + k.ta + k.paruosimas };
}

// Apytikslė kaina Lietuvoje: skelbimo kaina + parsivežimas + taršos mokestis.
// `auto` – { kuras, variklioTuris, co2 } iš skelbimo; jei jų nėra, taršos
// eilutė lieka su `tikslumas: 'nezinoma'` ir į sumą neįeina.
// Grąžina null, jei kainos ar rinkos nežinom – geriau nerodyti nieko, nei
// rodyti išgalvotą skaičių.
function kainaLietuvoje(kaina, rinka, auto) {
  const k = kastai(rinka);
  if (!Number.isFinite(kaina) || kaina <= 0 || !k) return null;
  const tarsa = tarsosMokestis.ivertinti(auto || {});
  const tarsosSuma = Number.isFinite(tarsa.vidurkis) ? tarsa.vidurkis : 0;
  return {
    kaina,
    rinka,
    rinkosVardas: rinkosVardas(rinka),
    kastai: k,
    tarsa,
    pristatymas: pristatymas(rinka),
    viso: kaina + k.viso + tarsosSuma,
    apytiksle: true,
    neiskaiciuota: NEISKAICIUOTA,
  };
}

module.exports = {
  PORTALO_RINKA, RINKU_VARDAI, KASTAI, NEISKAICIUOTA, PRISTATYMAS,
  portaloRaktas, rinkaPagalPortala, rinkosVardas, kastai, kainaLietuvoje, pristatymas,
};
