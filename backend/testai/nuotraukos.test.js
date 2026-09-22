// nuotraukos.test.js — Nr.45: galerijos dedublikavimas (v2.10.4). Tinklo nekviečia.
const path = require('path');
const N = require(path.join(__dirname, '..', 'nuotraukos.js'));
let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));
const jwt = (fn) => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ fn })).toString('base64url') + '.parasas';
const olx = (fn, dydis) => 'https://ireland.apollo.olxcdn.com/v1/files/' + jwt(fn) + '/image' + (dydis ? ';s=' + dydis : '');

t('olxcdn: tas pats failas skirtingais dydžiais – vienas raktas',
  N.nuotraukosRaktas(olx('abc-OTOMOTOPL')) === N.nuotraukosRaktas(olx('abc-OTOMOTOPL', '644x461')));
t('olxcdn: skirtingi failai – skirtingi raktai',
  N.nuotraukosRaktas(olx('abc-OTOMOTOPL')) !== N.nuotraukosRaktas(olx('xyz-OTOMOTOPL')));
t('autoscout24: /250x188.webp ir /720x540.webp – vienas raktas',
  N.nuotraukosRaktas('https://p.autoscout24.net/listing-images/a_b.jpg/250x188.webp') === N.nuotraukosRaktas('https://p.autoscout24.net/listing-images/a_b.jpg/720x540.webp'));
t('autoplius: _720x480 ir _1280x960 – vienas raktas',
  N.nuotraukosRaktas('https://autoplius-img.dgn.lt/ann_1_2/foto_720x480.jpg') === N.nuotraukosRaktas('https://autoplius-img.dgn.lt/ann_1_2/foto_1280x960.jpg'));
const sar = [olx('a'), olx('b'), olx('a', '644x461'), olx('c', '148x110'), olx('b', '148x110'), olx('c')];
const u = N.nuotraukuUnikalios(sar);
t('6 adresai (3 nuotraukos × 2 dydžiai) → 3, pirmasis dydis paliekamas', u.length === 3 && u[0] === sar[0] && u[2] === sar[3], u.length);
t('tušti praleidžiami', N.nuotraukuUnikalios(['', null, olx('a')]).length === 1);

console.log('\n' + (bl ? '✗ ' + bl + ' klaidos iš ' + (ok + bl) : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
