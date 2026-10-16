// max-pirkimo.test.js — didžiausia pirkimo kaina (v2.20.0).
//
//     node backend/testai/max-pirkimo.test.js
//
// Tai svarbiausias skaičius perpardavėjo rodinyje: su kuriuo einama derėtis.
// Jei jis klaidingas, klysta visas sprendimas, todėl tikrinam ir formulės
// tapatybę (ROI = marža), ir visus atsisakymo atvejus.

const path = require('path');
const M = require(path.join(__dirname, '..', 'max-pirkimo.js'));
const R = require(path.join(__dirname, '..', 'rinkos.js'));
let klaidu = 0, n = 0;
const t = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

console.log('\n── 1. Luko skaičiai (2026-10-16) ─────────────────────────');
t(M.MARZA_NUMATYTA === 0.10, 'numatyta marža 10 %');
t(R.KASTAI.DE.paruosimas === 350, 'paruošimas 350 €');
t(R.KASTAI.DE.viso === undefined, 'KASTAI lentelėje `viso` neskaičiuojamas – jį duoda kastai()');
t(R.kastai('DE').viso === 450 + 20 + 30 + 350, 'DE parsivežimas 850 € (450+20+30+350)');

console.log('\n── 2. Formulės tapatybė: ROI = marža ─────────────────────');
[0.10, 0.15, 0.20].forEach((m) => {
  const r = M.skaiciuoti({ ltMediana: 20000, kastai: 850, tarsa: 100, marza: m });
  const p = M.pelnas({ kaina: r.max, ltMediana: 20000, kastai: 850, tarsa: 100 });
  const skirtumas = Math.abs(p.roi - m * 100);
  t(skirtumas <= 1, 'marža ' + (m * 100) + ' % → perkant už max ROI = ' + p.roi + ' % (±1 dėl apvalinimo)');
});

console.log('\n── 3. Didesnė marža = mažesnė max kaina ──────────────────');
const m10 = M.skaiciuoti({ ltMediana: 20000, kastai: 850, tarsa: 100, marza: 0.10 });
const m20 = M.skaiciuoti({ ltMediana: 20000, kastai: 850, tarsa: 100, marza: 0.20 });
t(m10.max > m20.max, '10 % leidžia mokėti ' + m10.max + ' €, 20 % tik ' + m20.max + ' €');
t(M.MARZOS.join(',') === '0.1,0.15,0.2', 'jungiklio reikšmės 10 / 15 / 20 % (dizainerio juosta)');

console.log('\n── 4. Atsargos nuolaida nuo LT medianos ──────────────────');
t(M.PARDAVIMO_NUOLAIDA === 0.03, 'nuolaida 3 %');
t(M.pardavimoKaina(20000) === 19400, '20 000 € mediana → 19 400 € pardavimo kaina');
t(M.pardavimoKaina(0) === null && M.pardavimoKaina(null) === null, 'be medianos – null');

console.log('\n── 5. Kada NESKAIČIUOJAM (svarbiausia dalis) ─────────────');
const beLt = M.skaiciuoti({ ltMediana: null, kastai: 850, tarsa: 100 });
t(beLt.max === null, 'nėra LT medianos – max null, ne skaičius iš vokiškos kainos');
t(/Lietuvos/.test(beLt.priezastis), 'nurodyta priežastis: ' + beLt.priezastis);
const brangus = M.skaiciuoti({ ltMediana: 900, kastai: 850, tarsa: 100 });
t(brangus.max === null, 'kai kaštai suvalgo visą maržą – max null, ne neigiamas skaičius');

console.log('\n── 6. Viršutinė riba, kai tarša nežinoma (Errata 17) ─────');
const tikslus = M.skaiciuoti({ ltMediana: 20000, kastai: 850, tarsa: 100, tarsosTikslumas: 'apytikslis' });
const riba = M.skaiciuoti({ ltMediana: 20000, kastai: 850, tarsa: 0, tarsosTikslumas: 'nezinoma' });
t(tikslus.riba === false, 'tarša įvertinta – paprastas skaičius');
t(riba.riba === true, 'tarša nežinoma – riba:true, rodinys rašo „iki …" (.is-key.is-cap)');

console.log('\n── 7. „telpa" ir „derėtis" ───────────────────────────────');
const d1 = M.derybos(14500, 15443);
const d2 = M.derybos(16000, 15443);
t(d1.busena === 'telpa' && d1.skirtumas === 943, d1.tekstas);
t(d2.busena === 'derybos' && d2.skirtumas === -557, d2.tekstas);
t(M.derybos(null, 15443) === null, 'be kainos – null');

console.log('\n── 8. Tikras pavyzdys: DE Octavia 2,0 TDI ────────────────');
const klt = R.kainaLietuvoje(14500, 'DE', { kuras: 'Dyzelinas', variklioTuris: 1968 });
const mp = M.skaiciuoti({ ltMediana: 18550, kastai: klt.kastai.viso, tarsa: klt.tarsa.vidurkis,
  tarsosTikslumas: klt.tarsa.tikslumas });
const pl = M.pelnas({ kaina: 14500, ltMediana: 18550, kastai: klt.kastai.viso, tarsa: klt.tarsa.vidurkis });
t(mp.max > 14500, 'max ' + mp.max + ' € > skelbimo 14 500 € – verta pirkti');
t(pl.pelnas > 0 && pl.roi > 10, 'pelnas ' + pl.pelnas + ' €, ROI ' + pl.roi + ' %');
t(M.derybos(14500, mp.max).busena === 'telpa', 'rodinyje: ' + M.derybos(14500, mp.max).tekstas);

console.log('\n── Rezultatas ────────────────────────────────────────────');
console.log(klaidu === 0 ? `Visi ${n} patikrinimai praėjo.` : `${klaidu} iš ${n} KRENTA.`);
process.exit(klaidu === 0 ? 0 : 1);
