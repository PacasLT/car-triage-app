// tarsos-mokestis.test.js — registracijos („taršos") mokesčio įvertis (v2.18.0).
//
//     node backend/testai/tarsos-mokestis.test.js
//
// Kodėl svarbu: tai vienintelis parsivežimo kaštas, kuris tarp dviejų vienodos
// kainos automobilių skiriasi šimtais eurų. Jei jis skaičiuojamas neteisingai,
// „kiek kainuos Lietuvoje" meluoja būtent ten, kur sprendžiamas pelnas.

const path = require('path');
const T = require(path.join(__dirname, '..', 'tarsos-mokestis.js'));
const R = require(path.join(__dirname, '..', 'rinkos.js'));
let klaidu = 0, n = 0;
const t = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

console.log('\n── 1. Riba: iki 130 g/km mokesčio nėra ───────────────────');
t(T.RIBA === 130, 'riba 130 g/km');
t(T.mokestisPagalCO2(130, 'Benzinas') === 0, '130 g → 0 €');
t(T.mokestisPagalCO2(95, 'Benzinas') === 0, '95 g → 0 €');
t(T.mokestisPagalCO2(131, 'Benzinas') > 0, '131 g → jau yra mokestis');

console.log('\n── 2. Atskaitos taškas: 141 g benzinas = 43,26 € (2026) ──');
const a141 = T.mokestisPagalCO2(141, 'Benzinas');
t(a141 >= 40 && a141 <= 47, 'gaunam ' + a141 + ' € – telpa į ±3 € nuo viešo 43,26 €');

console.log('\n── 3. Viešai skelbiami rėžiai ────────────────────────────');
const b170 = T.mokestisPagalCO2(170, 'Benzinas');
const b210 = T.mokestisPagalCO2(210, 'Benzinas');
const b250 = T.mokestisPagalCO2(250, 'Benzinas');
t(b170 > a141, '170 g (' + b170 + ' €) > 141 g (' + a141 + ' €)');
t(b210 > b170 && b250 > b210, 'auga su CO₂: ' + b170 + ' → ' + b210 + ' → ' + b250 + ' €');
t(b250 >= 600, 'ties 250 g jau ≥ 600 € (atitinka viešą rėžį)');
t(T.mokestisPagalCO2(200, 'Dyzelinas') > T.mokestisPagalCO2(200, 'Benzinas'),
  'dyzelinis apmokestinamas aukščiau nei benzininis esant tam pačiam CO₂');

console.log('\n── 4. Nulinis mokestis – tik kai žinom tikrai ────────────');
t(T.ivertinti({ kuras: 'Elektra' }).vidurkis === 0, 'Elektra → 0 €');
t(T.ivertinti({ kuras: 'Vandenilis' }).vidurkis === 0, 'Vandenilis → 0 €');
const phev = T.ivertinti({ kuras: 'Benzinas / elektra', variklioTuris: 2998 });
t(phev.vidurkis === 0 && phev.tikslumas === 'tikslus', 'Įkraunamas hibridas → 0 €, net su 3 l varikliu');
t(T.ivertinti({ kuras: 'Benzinas / dujos', variklioTuris: 1600 }).vidurkis !== 0,
  'Benzinas/dujos NĖRA nulinis – tai ne įkraunamas hibridas');

console.log('\n── 5. Be CO₂ – rėžis, ne išgalvotas taškas ───────────────');
const d30 = T.ivertinti({ kuras: 'Dyzelinas', variklioTuris: 2993 });
t(d30.tikslumas === 'apytikslis', '3,0 l dyzelis – pažymėta kaip apytikslis');
t(d30.nuo < d30.iki, 'grąžinamas rėžis ' + d30.nuo + '–' + d30.iki + ' €, ne vienas skaičius');
t(d30.vidurkis > 0, 'vidurkis ' + d30.vidurkis + ' € naudojamas sumai');
t(/cm³/.test(d30.paaiskinimas), 'paaiškinta, iš ko įvertinta');
const nezinoma = T.ivertinti({ kuras: 'Benzinas' });
t(nezinoma.tikslumas === 'nezinoma' && nezinoma.vidurkis === null,
  'be variklio tūrio – „nezinoma", o ne spėjimas');

console.log('\n── 6. Didelis dyzelis brangesnis nei mažas ───────────────');
const d20 = T.ivertinti({ kuras: 'Dyzelinas', variklioTuris: 1968 });
t(d20.vidurkis < d30.vidurkis, '2,0 l (' + d20.vidurkis + ' €) pigiau nei 3,0 l (' + d30.vidurkis + ' €)');

console.log('\n── 7. Kaina Lietuvoje – mokestis įeina į sumą ────────────');
const kl = R.kainaLietuvoje(14500, 'DE', { kuras: 'Dyzelinas', variklioTuris: 1968 });
t(kl.kastai.viso === 850, 'DE parsivežimas 850 € (450+20+30+350, paruošimas – Luko skaičius)');
t(kl.viso === 14500 + kl.kastai.viso + kl.tarsa.vidurkis, 'suma = kaina + kaštai + taršos vidurkis = ' + kl.viso + ' €');
const klEv = R.kainaLietuvoje(14500, 'DE', { kuras: 'Elektra' });
t(klEv.viso === 14500 + 850, 'elektrinis – be taršos mokesčio (' + klEv.viso + ' €)');
t(klEv.viso < kl.viso, 'elektrinis pigiau parsivežti nei dyzelinis – būtent dėl mokesčio');
const klLt = R.kainaLietuvoje(14500, 'LT', { kuras: 'Dyzelinas', variklioTuris: 1968 });
t(klLt.kastai.transportas === 0 && klLt.kastai.ta === 0, 'LT: be transporto ir be TA');
t(R.KASTAI.PL.transportas < R.KASTAI.DE.transportas, 'PL transportas pigesnis nei DE');
t(R.KASTAI.EU.transportas > R.KASTAI.DE.transportas, 'Vak. Europa brangesnė nei DE');
t((R.NEISKAICIUOTA || []).indexOf('PVM') >= 0, 'PVM įvardintas kaip NEįskaičiuotas');

console.log('\n── Rezultatas ────────────────────────────────────────────');
console.log(klaidu === 0 ? `Visi ${n} patikrinimai praėjo.` : `${klaidu} iš ${n} KRENTA.`);
process.exit(klaidu === 0 ? 0 : 1);
