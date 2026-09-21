// otomoto-skelbimas.test.js — otomoto SKELBIMO puslapio struktūra (Z-94).
//
//     node backend/testai/otomoto-skelbimas.test.js
//
// Tinklo nekviečia. DUOMENYS: tikras skelbimas 6150710642 (BMW X5, 2026-09-22),
// __NEXT_DATA__ → advert, sutrumpintas (20 parametrų, 2 įrangos grupės po 4).
const path = require('path');
const O = require(path.join(__dirname, '..', 'otomoto.js'));
let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));

const advert = {
  id: '6150710642', title: 'BMW X5 xDrive30d mHEV M Sport sport', createdAt: '2026-09-21T13:55:27Z',
  price: { value: '346424', currency: 'PLN' },
  details: [
    { key: 'make', label: 'Marka pojazdu', value: 'BMW' }, { key: 'model', label: 'Model pojazdu', value: 'X5' },
    { key: 'year', label: 'Rok produkcji', value: '2026' }, { key: 'fuel_type', label: 'Rodzaj paliwa', value: 'Diesel' },
    { key: 'engine_power', label: 'Moc', value: '298 KM' }, { key: 'mileage', label: 'Przebieg', value: '1 km' },
    { key: 'no_accident', label: 'Bezwypadkowy', value: 'Tak' }, { key: 'vin', label: 'VIN', value: 'WBA11111111111111' },
    { key: 'empty', label: 'Tuščias', value: '' },
  ],
  equipment: [
    { label: 'Audio i multimedia', values: [{ label: 'Android Auto' }, { label: 'Radio' }] },
    { label: 'Komfort i dodatki', values: [{ label: 'Klimatyzacja automatyczna' }] },
    { label: 'Tuščia', values: [] },
  ],
  description: '<p><b><strong>OFEROWANY SAMOCHÓD:</strong></b></p><p>- BMW X5</p><p>────────────────</p><p><br></p><p>Zadzwoń <span id="hiddenPhoneNumber" phoneNumber="H8I">123 456</span> teraz</p><ul><li>Gwarancja</li></ul>',
  seller: { type: 'PROFESSIONAL', name: 'Otomoto Lease Premium', location: { city: 'Warszawa', region: '', country: 'Polska' } },
  images: { photos: [{ url: 'https://ireland.apollo.olxcdn.com/v1/files/a/image' }, { url: 'https://ireland.apollo.olxcdn.com/v1/files/b/image' }] },
};
const html = '<html><body><h1>x</h1><script id="__NEXT_DATA__" type="application/json">'
  + JSON.stringify({ props: { pageProps: { advert } } }) + '</script></body></html>';

console.log('\n1. Struktūra');
const p = O.otomotoSkelbimoLaukai(html);
t('rasta', p.rasta === true, p.rasta);
t('parametrai pagal lenkišką etiketę', p.parametrai['Przebieg'] === '1 km' && p.parametrai['Moc'] === '298 KM', p.parametrai);
t('tušti parametrai praleisti', !('Tuščias' in p.parametrai), p.parametrai);
t('įranga grupėmis, tuščia grupė praleista', p.iranga.length === 2 && p.iranga[0].items.join() === 'Android Auto,Radio', p.iranga);
t('VIN iš detalių', p.vinPilnas === 'WBA11111111111111', p.vinPilnas);
t('pardavėjas - įmonė', p.pardavejoInfo.privatus === false && p.pardavejoInfo.vardas === 'Otomoto Lease Premium', p.pardavejoInfo);
t('vieta be tuščio regiono', p.vieta === 'Warszawa', p.vieta);
t('nuotraukos', p.photos.length === 2, p.photos);
t('kaina PLN', p.kaina.suma === 346424 && p.kaina.valiuta === 'PLN', p.kaina);

console.log('\n2. Aprašymas');
t('HTML žymės pašalintos', !/<[a-z]/i.test(p.aprasymas), p.aprasymas);
t('paslėptas telefonas neįsiskverbė', !p.aprasymas.includes('123 456'), p.aprasymas);
t('brūkšnių linija pašalinta', !p.aprasymas.includes('────'), p.aprasymas);
t('<li> → •', p.aprasymas.includes('• Gwarancja'), p.aprasymas);

console.log('\n3. Be __NEXT_DATA__');
const n = O.otomotoSkelbimoLaukai('<html></html>');
t('rasta:false, parametrai {} (scrapeSingleListing nelūžta)', n.rasta === false && Object.keys(n.parametrai).length === 0, n);
t('sugadintas JSON → rasta:false', O.otomotoSkelbimoLaukai('<script id="__NEXT_DATA__">{blogai</script>').rasta === false);

console.log('\n' + (bl ? '✗ ' + bl + ' klaidos iš ' + (ok + bl) : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
