// rinkos.test.js — rinka (šalis) ir kaina Lietuvoje (v2.17.0, A punktas).
//
//     node backend/testai/rinkos.test.js
//
// Kodėl šis testas: iki v2.17.0 mediana buvo skaičiuojama iš visų penkių
// portalų kartu, todėl vokiškas skelbimas visada atrodė „žemiau rinkos" vien
// dėl to, kad Vokietijoje pigiau. Čia tikrinam, kad to nebeliktų.

const path = require('path');
const R = require(path.join(__dirname, '..', 'rinkos.js'));
const M = require(path.join(__dirname, '..', 'rinkos-mediana.js'));
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

console.log('\n── 1. Portalas → rinka ───────────────────────────────────');
T(R.rinkaPagalPortala('autoplius') === 'LT', 'autoplius → LT');
T(R.rinkaPagalPortala('autogidas') === 'LT', 'autogidas → LT');
T(R.rinkaPagalPortala('mobilede') === 'DE', 'mobilede → DE');
T(R.rinkaPagalPortala('otomoto') === 'PL', 'otomoto → PL');
// autoscout24 adresas prašo cy=D,A,B,E,F,I,L,NL – aštuonios šalys, ne viena.
T(R.rinkaPagalPortala('autoscout24') === 'EU', 'autoscout24 → EU (mišri Vak. Europa, ne DE)');
T(R.rinkaPagalPortala('nezinomas') === null, 'nežinomas portalas → null, ne spėjimas');

console.log('\n── 2. Apytikslė kaina Lietuvoje ──────────────────────────');
const de = R.kainaLietuvoje(42000, 'DE');
T(de.viso === 42000 + de.kastai.viso, 'DE: kaina + kaštai = ' + de.viso + ' €');
T(de.apytiksle === true, 'pažymėta kaip apytikslė – rodinys privalo rašyti „≈"');
T(de.neiskaiciuota.length >= 3, 'įvardinta, ko NĖRA sumoje: ' + de.neiskaiciuota.join(', '));
const lt = R.kainaLietuvoje(42000, 'LT');
T(lt.kastai.transportas === 0, 'LT: transportas 0 €');
T(lt.viso > 42000, 'LT: paruošimas vis tiek kainuoja (' + lt.viso + ' €)');
T(R.kainaLietuvoje(0, 'DE') === null, 'be kainos – null, o ne išgalvotas skaičius');
T(R.kainaLietuvoje(42000, null) === null, 'be rinkos – null');
const pl = R.kainaLietuvoje(42000, 'PL');
T(pl.viso < de.viso, 'PL parsivežimas pigesnis nei iš DE (' + pl.viso + ' < ' + de.viso + ')');

console.log('\n── 3. Mediana atskirai pagal rinką ───────────────────────');
// Tikra situacija: tas pats X5, Vokietijoje ~42 000 €, Lietuvoje ~57 000 €.
const mk = (src, kaina) => ({ modelis: 'X5', source: src, kaina, rinkosGrupes: ['G05'] });
const sar = [];
for (let i = 0; i < 8; i++) sar.push(mk('mobilede', 40000 + i * 500));
for (let i = 0; i < 8; i++) sar.push(mk('autoplius', 55000 + i * 500));
const med = M.computeMarketMedians(sar);
T(Object.keys(med.X5.rinkos).sort().join(',') === 'DE,LT', 'atskiros DE ir LT medianos');

const lygDe = M.lyginimoMediana(med.X5, ['G05'], 'DE');
const lygLt = M.lyginimoMediana(med.X5, ['G05'], 'LT');
const lygMisr = M.lyginimoMediana(med.X5, ['G05']);
T(lygDe.rinka === 'DE' && lygDe.median < 45000, 'DE skelbimas lyginamas su DE mediana ' + lygDe.median);
T(lygLt.rinka === 'LT' && lygLt.median > 55000, 'LT skelbimas lyginamas su LT mediana ' + lygLt.median);
T(lygMisr.rinka === null, 'be rinkos – senas elgesys, mišri mediana ' + lygMisr.median);

// Esminis dalykas: 40 000 € vokiškas skelbimas nebeatrodo kaip radinys.
const pigus = 40000;
const senas = Math.round((lygMisr.median - pigus) / lygMisr.median * 100);
const naujas = Math.round((lygDe.median - pigus) / lygDe.median * 100);
T(senas >= 25, 'SENAS skaičiavimas rodė −' + senas + '% („radinys")');
T(naujas < 10, 'NAUJAS rodo −' + naujas + '% – tai tik normali DE kaina');
T(naujas < senas, 'netikra nuolaida dingo: −' + senas + '% → −' + naujas + '%');

console.log('\n── 4. Maža imtis – krentam atgal, ne meluojam ────────────');
const mazi = [mk('otomoto', 39000), mk('otomoto', 40000)];
for (let i = 0; i < 8; i++) mazi.push(mk('autoplius', 55000 + i * 500));
const med2 = M.computeMarketMedians(mazi);
const lygPl = M.lyginimoMediana(med2.X5, ['G05'], 'PL');
T(lygPl.rinka === null, 'PL imtis per maža (2) – grąžinam rinka:null, kad rodinys to neteigtų');
T(lygPl.count >= 5, 'bet mediana vis tiek yra – iš platesnės imties (' + lygPl.count + ')');

console.log('\n── 5. K-72: `source` yra DOMENAS, ne trumpasis vardas ────');
// Kodėl sargas: v2.17.0–v2.23.0 produkcijoje VISA rinkos dalis buvo negyva,
// nes `server.js` rašo `l.source = site`, kur `site` yra „autoplius.lt",
// o `PORTALO_RINKA` raktai buvo trumpieji vardai. Mano pavyzdžiuose `source`
// buvo trumpasis vardas, tad sargai rodė žalią, o žmogus matė tuščius
// stulpelius. Todėl šis sargas ima TIKRAS eilutes iš `server.js`, ne mano
// rankomis surašytas – kitaip ta pati klaida grįš nepastebėta.
{
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const blokas = (src.match(/const allUrls = \[[\s\S]*?\n    \];/) || [''])[0];
  const site = [...blokas.matchAll(/site:\s*'([^']+)'/g)].map((m) => m[1]);
  T(site.length === 5, 'server.js allUrls turi 5 portalus (rasta ' + site.length + ')');
  for (const sv of site) {
    T(R.rinkaPagalPortala(sv) !== null, '`' + sv + '` → ' + R.rinkaPagalPortala(sv));
  }
  T(/l\.source = site;/.test(src), 'server.js tebededa `l.source = site` (domeną) – sargas tikrina tą pačią formą');
  // Kaina Lietuvoje privalo susiskaičiuoti su TOMIS PAČIOMIS eilutėmis
  const klt = R.kainaLietuvoje(28450, R.rinkaPagalPortala('autoscout24.com'), { kuras: 'Benzinas', variklioTuris: 1.5 });
  T(klt !== null, 'kainaLietuvoje su domenu „autoscout24.com" nebegrąžina null');
  T(klt && klt.kastai.viso > 0, 'ir kaštai > 0 (' + (klt ? klt.kastai.viso : '-') + ' €)');
}

console.log('\n── Rezultatas ────────────────────────────────────────────');
console.log(klaidu === 0 ? `Visi ${n} patikrinimai praėjo.` : `${klaidu} iš ${n} KRENTA.`);
process.exit(klaidu === 0 ? 0 : 1);
