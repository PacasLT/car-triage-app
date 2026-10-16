// backend/tarsos-mokestis.js — LR transporto priemonių registracijos („taršos")
// mokesčio ĮVERTIS. Ne oficialus skaičiavimas.
//
// KODĖL REIKIA: parsivežant auto į Lietuvą šis mokestis yra vienintelis
// kaštas, kuris skiriasi šimtais eurų tarp dviejų vienodos kainos automobilių.
// Elektrinis ir įkraunamas hibridas moka 0 €, 3 l dyzelinis visureigis –
// kelis šimtus. Be šios eilutės rinkų palyginimas („kiek kainuos Lietuvoje")
// iškreiptas būtent ten, kur sprendžiamas pelnas.
//
// KODĖL ĮVERTIS, O NE TIKSLUS SKAIČIUS: portalų skelbimuose CO₂ lauko NĖRA
// (patikrinta visuose penkiuose skaitytuvuose, 2026-10-16). Turime tik kurą,
// variklio tūrį ir galią. Iš jų CO₂ galima tik įvertinti rėžiu, ne tašku,
// todėl grąžinam „nuo–iki", o į sumą imam vidurkį. Tikslų skaičių duoda tik
// Regitros skaičiuoklė pagal konkretų VIN.
//
// FAKTAI, KURIAIS REMIAMASI (2026-10-16):
//   • mokestis taikomas tik lengviesiems (M1), kurių CO₂ > 130 g/km;
//   • tarifai indeksuojami kasmet pagal VKI; 2026 m. benzininis su 141 g/km
//     moka 43,26 € (f-1.lt, 2026) – tai mūsų atskaitos taškas;
//   • apytiksliai rėžiai: 131–170 g ≈ 30–130 €, 171–210 ≈ 130–300 €,
//     211–250 ≈ 300–600 €, virš 250 – daugiau nei 600 € (supirkimasaz.lt);
//   • elektra ir vandenilis – 0 €; įkraunami hibridai praktiškai visada
//     ≤ 50 g/km, tad irgi 0 €;
//   • mokamas registruojant Lietuvoje IR kiekvieną kartą keičiantis valdytojui.
//     Perpardavėjui tai reiškia, kad jį sumoka ir jis, ir jo pirkėjas.

const RIBA = 130;               // iki šios ribos mokesčio nėra
const SALTINIS = 'Įvertis pagal viešai skelbiamus 2026 m. tarifus. Tikslią sumą pagal VIN duoda Regitros skaičiuoklė.';

// Laiptuota funkcija, suderinta su žinomu tašku (141 g → 43,26 €) ir viršutiniais rėžiais.
function mokestisPagalCO2(co2, kuras) {
  if (!Number.isFinite(co2) || co2 <= RIBA) return 0;
  let s;
  if (co2 <= 170) s = 3.9 * (co2 - 130);
  else if (co2 <= 210) s = 156 + 5.0 * (co2 - 170);
  else if (co2 <= 250) s = 356 + 7.0 * (co2 - 210);
  else s = 636 + 10.0 * (co2 - 250);
  // Dyzeliniai apmokestinami šiek tiek aukščiau (NOx ir kietosios dalelės).
  // Koeficientas – prielaida, ne įstatymo skaičius.
  if (/dyzel/i.test(kuras || '')) s *= 1.1;
  return Math.round(s);
}

// Nulinis mokestis – kai tai žinom tikrai, o ne spėjam.
function nulinis(kuras) {
  const k = String(kuras || '').toLowerCase();
  if (/vandenil/.test(k)) return 'vandenilis';
  if (/elektra/.test(k) && !/benzin|dyzel|dujos/.test(k)) return 'elektra';
  // Įkraunami hibridai (benzinas/elektra, dyzelinas/elektra) – WLTP CO₂
  // beveik visada ≤ 50 g/km, tad mokesčio nėra.
  if (/elektra/.test(k) && /benzin|dyzel/.test(k)) return 'ikraunamas hibridas';
  return null;
}

// CO₂ rėžiai pagal kurą ir variklio tūrį – kai tikro CO₂ neturime.
// Skaičiai parinkti pagal tipinius WLTP duomenis, sąmoningai platūs.
const REZIAI = [
  { kuras: /dyzel/i, iki: 2000, co2: [120, 160] },
  { kuras: /dyzel/i, iki: 3000, co2: [150, 200] },
  { kuras: /dyzel/i, iki: 1e9, co2: [190, 250] },
  { kuras: /benzin|dujos|bioetanol/i, iki: 1500, co2: [120, 150] },
  { kuras: /benzin|dujos|bioetanol/i, iki: 2000, co2: [140, 180] },
  { kuras: /benzin|dujos|bioetanol/i, iki: 3000, co2: [170, 230] },
  { kuras: /benzin|dujos|bioetanol/i, iki: 1e9, co2: [220, 300] },
];

function rezisPagalSpecifikacija(kuras, variklioTuris) {
  const t = Number.isFinite(variklioTuris) && variklioTuris > 0 ? variklioTuris : null;
  if (!t || !kuras) return null;
  for (const r of REZIAI) if (r.kuras.test(kuras) && t <= r.iki) return r.co2;
  return null;
}

// ivertinti({ kuras: 'Dyzelinas', variklioTuris: 2993 })
//   -> { nuo: 283, iki: 673, vidurkis: 478, tikslumas: 'apytikslis', ... }
// ivertinti({ kuras: 'Benzinas', co2: 141 })
//   -> { nuo: 43, iki: 43, vidurkis: 43, tikslumas: 'tikslus', ... }
function ivertinti({ kuras, variklioTuris, co2 } = {}) {
  const nul = nulinis(kuras);
  if (nul) {
    return {
      nuo: 0, iki: 0, vidurkis: 0, tikslumas: 'tikslus',
      paaiskinimas: 'Mokesčio nėra (' + nul + ').', saltinis: SALTINIS,
    };
  }
  if (Number.isFinite(co2) && co2 > 0) {
    const s = mokestisPagalCO2(co2, kuras);
    return {
      nuo: s, iki: s, vidurkis: s, tikslumas: 'tikslus',
      paaiskinimas: 'Pagal nurodytą ' + co2 + ' g/km.', saltinis: SALTINIS,
    };
  }
  const rez = rezisPagalSpecifikacija(kuras, variklioTuris);
  if (!rez) {
    return {
      nuo: null, iki: null, vidurkis: null, tikslumas: 'nezinoma',
      paaiskinimas: 'Trūksta CO₂, kuro arba variklio tūrio – mokesčio neskaičiuojam.',
      saltinis: SALTINIS,
    };
  }
  const nuo = mokestisPagalCO2(rez[0], kuras);
  const iki = mokestisPagalCO2(rez[1], kuras);
  return {
    nuo, iki, vidurkis: Math.round((nuo + iki) / 2), tikslumas: 'apytikslis',
    paaiskinimas: 'CO₂ skelbime nenurodytas; įvertinta pagal kurą ir ' + variklioTuris
      + ' cm³ (' + rez[0] + '–' + rez[1] + ' g/km).',
    saltinis: SALTINIS,
  };
}

module.exports = { RIBA, mokestisPagalCO2, nulinis, ivertinti };
