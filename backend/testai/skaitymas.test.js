// skaitymas.test.js — kortelių nuskaitymo sargas (v2.4.2).
//
//     node backend/testai/skaitymas.test.js
//
// Reikia: cheerio. Tinklo nekviečia.
//
// Kortelės sudarytos iš TIKROS autoplius struktūros (skelbimas A32292708,
// paimtas naršyklėje 2026-09-21) ir tikrų parametrų iš to paties puslapio
// (PHEV A32314474 „160 000 km" + „86 km", EV A32315368 „5 900 km" + „679 km").
// Kiekviena kortelė gaudo po vieną klaidą, rastą archyvo audite (Z-66).

const fs = require('fs'), path = require('path');
const cheerio = require('cheerio');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
function imk(vardas) {
  const i = src.indexOf('function ' + vardas + '(');
  if (i < 0) throw new Error('Nerasta funkcija: ' + vardas);
  let g = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') g++;
    else if (src[k] === '}') { g--; if (!g) return src.slice(i, k + 1); }
  }
}
const ribos = 'const MIN_REALI_KAINA = 4500; const SENAS_METAI = new Date().getFullYear() - 10; const SENAS_RIDA = 200000;';
const konst = (src.match(/const AUTOGIDAS_PARAM = \{[\s\S]*?\n\};/) || [''])[0];
const kodas = ribos + konst + ['extractField', 'kainosPatikra', 'autopliusAmzius', 'extractAutopliusStructured', 'extractAutogidasListings'].map(imk).join('\n')
  + '\nreturn { extractAutopliusStructured, extractAutogidasListings };';
const { extractAutopliusStructured: AP, extractAutogidasListings: AG } = new Function('cheerio', 'URL', kodas)(cheerio, URL);

let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));

const apKortele = ({ id, kainosHtml, param, data = '2020-12' }) => `
<a href="https://autoplius.lt/skelbimai/bmw-x5-${id}.html" class="announcement-item">
 <div class="announcement-content"><div class="announcement-body">
  <div class="announcement-body-heading">
   <div class="announcement-title-container">
    <div class="announcement-title">BMW X5</div>
    <div class="announcement-title-parameters"><div class="announcement-parameters has-logo">
      <span>${data}</span><span>Visureigis / Krosoveris</span></div></div>
   </div>
   <div class="pricing-container"><div class="announcement-pricing-info"><strong>${kainosHtml}</strong></div></div>
  </div>
  <div class="announcement-parameters-block"><div class="announcement-parameters has-logo">
   ${param.map((p) => '<span>' + p + '</span>').join('')}
  </div></div>
 </div></div>
</a>`;

console.log('\n1. autoplius · nuolaidos kortelė (A32292708) ───────────────');
{
  const html = apKortele({ id: 32292708, data: '2026-01',
    kainosHtml: '<span class="promotion"><span class="promo-price">92 000 €</span></span><span class="strike"><span>117 843 €</span></span>',
    param: ['Dyzelinas / elektra', 'Automatinė', '3.0 l., 219 kW', '10 km', 'Kaunas'] });
  const [l] = AP(html);
  t('kaina 92 000, ne 92 000 117 843', l.kaina === 92000, l.kaina);
  t('sena kaina 117 843 išsaugota atskirai', l.senaKaina === 117843, l.senaKaina);
}

console.log('\n2. autoplius · įkraunamas hibridas (A32314474) ────────────');
{
  const [l] = AP(apKortele({ id: 32314474, kainosHtml: '43 900 €',
    param: ['Benzinas / elektra', 'Automatinė', '3.0 l., 290 kW', '160 000 km', '86 km', 'Vilnius'] }));
  t('rida 160 000, ne 86 (elektrinis nuotolis)', l.rida === 160000, l.rida);
  t('elektrinis nuotolis 86 atskirame lauke', l.elektrosNuotolis === 86, l.elektrosNuotolis);
  t('miestas Vilnius', l.miestas === 'Vilnius', l.miestas);
  t('galia 290, tūris 3.0', l.galia === 290 && l.variklioTuris === 3, [l.galia, l.variklioTuris]);
}

console.log('\n3. autoplius · elektromobilis (A32315368) ─────────────────');
{
  const [l] = AP(apKortele({ id: 32315368, data: '2026-04', kainosHtml: '89 900 €',
    param: ['Elektra, 84 kWh', 'Automatinė', '345 kW', '5 900 km', '679 km', 'Klaipėda'] }));
  t('kuras „Elektra", be baterijos', l.kuras === 'Elektra', l.kuras);
  t('baterija 84 kWh atskirai', l.baterijaKwh === 84, l.baterijaKwh);
  t('rida 5 900, ne 679', l.rida === 5900, l.rida);
  t('nuotolis 679', l.elektrosNuotolis === 679, l.elektrosNuotolis);
  t('variklio tūrio nėra (null, ne 0)', l.variklioTuris == null, l.variklioTuris);
}

console.log('\n4. autoplius · įprasta kortelė nepakito ──────────────────');
{
  const [l] = AP(apKortele({ id: 32314668, data: '2019-07', kainosHtml: '52 000 €',
    param: ['Benzinas', 'Automatinė', '4.4 l., 390 kW', '155 177 km', 'Alytus'] }));
  t('kaina, rida, kuras, miestas', l.kaina === 52000 && l.rida === 155177 && l.kuras === 'Benzinas' && l.miestas === 'Alytus',
    [l.kaina, l.rida, l.kuras, l.miestas]);
  t('nuotolio ir senos kainos nėra', l.elektrosNuotolis == null && l.senaKaina == null, [l.elektrosNuotolis, l.senaKaina]);
}

const agKortele = ({ href, title, kaina, param }) => `
<article class="list-item-new" data-price="${kaina}">
  <a class="item-link" href="${href}"></a>
  <h2 class="item-title">${title}</h2>
  ${param.map((p) => '<span class="parameter-value">' + p + '</span>').join('')}
</article>`;

console.log('\n5. autogidas · reklama antraštėje vietoj modelio ───────────');
{
  const [l] = AG(agKortele({ href: '/skelbimas/bmw-x3-2020-m-visureigis-0139922097.html', title: 'BMW Kelio ženklų atpažinimo sistem', kaina: 32000,
    param: ['2020 m.', 'Dyzelinas', '84 237 km', 'Automatinė', '2.0 L / 140 kW', 'Užsienyje', '5 000 km / 3 mėn.'] }), 'https://autogidas.lt/');
  t('modelis iš adreso: „BMW X3"', l.modelis === 'BMW X3', l.modelis);
  t('„Užsienyje" - ne miestas, o požymis', l.miestas == null && l.uzsienyje === true, [l.miestas, l.uzsienyje]);
  t('garantijos „5 000 km / 3 mėn." nepateko į ridą', l.rida === 84237, l.rida);
}

console.log('\n6. autogidas · teisinga antraštė nekeičiama ──────────────');
{
  const [a] = AG(agKortele({ href: '/skelbimas/bmw-i4-2024-m-hecbekas-0139941978.html', title: 'BMW i4', kaina: 41000,
    param: ['2024 m.', 'Elektra', '65 000 km', 'Užsienyje'] }), 'https://autogidas.lt/');
  t('„BMW i4" lieka', a.modelis === 'BMW i4', a.modelis);
  const [b] = AG(agKortele({ href: '/skelbimas/mercedes-benz-e-klase-2021-m-sedanas-0139000001.html', title: 'Mercedes-Benz E 220', kaina: 35000,
    param: ['2021 m.', 'Dyzelinas', '120 000 km', 'Automatinė', 'Vilnius'] }), 'https://autogidas.lt/');
  t('„Mercedes-Benz E 220" lieka (brūkšnys markėje)', b.modelis === 'Mercedes-Benz E 220', b.modelis);
  t('Vilnius yra miestas', b.miestas === 'Vilnius' && !b.uzsienyje, [b.miestas, b.uzsienyje]);
}

console.log('\n' + (bl ? '✗ ' + bl + ' klaidos, ' + ok + ' praėjo' : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
