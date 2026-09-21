// portalai.test.js — paieškos kortelių skaitytuvai su TIKROMIS kortelėmis (Z-76).
//
//     node backend/testai/portalai.test.js
//
// Tinklo nekviečia, kreditų nekainuoja.
//
// DUOMENYS: kiekviena kortelė nukopijuota iš tikro portalo puslapio naršyklėje
// 2026-09-21 (BMW X5 nuo 2019, 2 puslapis). Sutrumpinta tik: <svg> turinys,
// <script>, autogido finansavimo paaiškinimo tekstas. Klasės ir struktūra -
// tokios, kokias grąžina portalas, ne tokios, kokias skaitytuvas tikisi.
//
// Ką gaudo: (1) autogido „Aukcionas" ženklas buvo nematomas - 9 iš 20 X5
// kortelių (AUTO4SALE, 2021 m. X5 už 7 000 €) ėjo į vidurkį ir TOP kaip pigūs;
// (2) autoplius „Parduota!" kortelė (23 000 €, be ridos) - tas pats;
// (3) otomoto galia 0 % (reguliarioji išraiška laukė „KM" `value` lauke, o jis
// ten tik skaičius), modelis mažosiomis („bmw x5"), vieta 0 %;
// (4) autoscout24 vieta 0 %.

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
const konst = [(src.match(/const AUTOGIDAS_PARAM = \{[\s\S]*?\n\};/) || [''])[0], (src.match(/const PLN_EUR_RATE = [^;]+;/) || [''])[0], (src.match(/const PLN_KURSAS = \{[^\n]*\};/) || [''])[0]].join('\n');
const kodas = ribos + konst + ['extractField', 'kainosPatikra', 'autopliusAmzius', 'extractAutopliusStructured', 'extractAutogidasListings',
  'extractOtomotoListings', 'extractAutoscout24Listings'].map(imk).join('\n')
  + '\nreturn { extractAutopliusStructured, extractAutogidasListings, extractOtomotoListings, extractAutoscout24Listings };';
const P = new Function('cheerio', 'URL', kodas)(cheerio, URL);

let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));

// ── autoplius: tikros kortelės 32131296 (įprasta) ir 32082892 („Parduota!") ──
const AP_OK = `<a href="https://autoplius.lt/skelbimai/bmw-x5-3-0-l-visureigis-krosoveris-2019-benzinas-32131296.html" class="announcement-item" target="_blank"> <div class="announcement-content"> <div class="announcement-media"> <div class="announcement-photo"> <img src="" data-src="https://autoplius-img.dgn.lt/ann_26_411593390/bmw-x5-3-0-l-visureigis-krosoveris-2019-benzinas.jpg" class="lazy-img"> <div class="announcement-bookmark-button " data-id="32131296" data-category-id="2"> </div> <div class="announcement-badges"> <div class="announcement-badge badge-rise">2</div> </div> </div> </div> <div class="announcement-body "> <div class="announcement-body-heading"> <div class="announcement-title-container"> <div class="announcement-title"> BMW X5 </div> <div class="announcement-title-parameters"> <div class="announcement-parameters "> <span>2019-01</span> <span>Visureigis / Krosoveris</span> </div> </div> </div> <div class="pricing-container has-loan-price"> <div class="announcement-pricing-info"> <strong> 35 000 € </strong> <div class="loan-information-container js-loan-information hidden" data-amount="35000" data-period="144" data-residual-value="true" data-platform="desktop" data-announcement-id="32131296" data-loan-type="leasing"> <div class="loan-payment-information"> <span class="js-apl-monthly-payment"></span> / <span class="js-term">144</span> mėn. </div> </div> </div> </div> </div> <div class="tags-payment-block"> <div class="announcement-tags tags-lg"> <div class="tag tag-vin" title="Nurodytas automobilio VIN numeris."> <span class="tag-text">vin</span> </div> </div> <div class="monthly-payment"> </div> </div> <div class="announcement-parameters-block"> <div class="announcement-parameters "> <span> Benzinas </span> <span>Automatinė</span> <span> 3.0 l., 250 kW </span> <span>99 200 km</span> <span>Vilnius</span> </div> </div> <div class="announcement-owner-container"> </div> </div> </div> </a>`;
const AP_SOLD = `<a href="https://autoplius.lt/skelbimai/bmw-x5-3-0-l-visureigis-krosoveris-2024-benzinas-32082892.html" class="announcement-item is-enhanced is-sold is-inactive is-gallery" target="_blank"> <div class="announcement-content"> <div class="announcement-media"> <div class="announcement-gallery js-announcement-gallery"> <div class="announcement-gallery-first-photo-container"> <img class="js-gallery-main-photo" src="https://autoplius-img.dgn.lt/ann_25_410972176/bmw-x5-3-0-l-visureigis-krosoveris-2024-benzinas.jpg" alt=""> <div class="announcement-bookmark-button " data-id="32082892" data-category-id="2"> </div> <div class="announcement-badges"> <div class="announcement-badge badge-sold">Parduota!</div> </div> </div> </div> </div> <div class="announcement-body "> <div class="announcement-body-heading"> <div class="announcement-title-container"> <div class="announcement-title"> BMW X5 </div> <div class="announcement-title-parameters"> <div class="announcement-parameters has-logo"> <span>2024</span> <span>Visureigis / Krosoveris</span> </div> </div> </div> <div class="pricing-container has-loan-price"> <div class="announcement-pricing-info"> <strong> 23 000 € </strong> <div class="loan-information-container js-loan-information hidden" data-amount="23000" data-period="144" data-residual-value="true" data-platform="desktop" data-announcement-id="32082892" data-loan-type="leasing"> <div class="loan-payment-information"> <span class="js-apl-monthly-payment"></span> / <span class="js-term">144</span> mėn. </div> </div> </div> </div> </div> <div class="tags-payment-block"> <div class="announcement-tags tags-lg"> </div> <div class="monthly-payment"> </div> </div> <div class="announcement-parameters-block"> <div class="announcement-parameters has-logo"> <span> Benzinas </span> <span>Automatinė</span> <span> 3.0 l., 280 kW </span> <span>Klaipėda</span> </div> </div> <div class="announcement-owner-container"> <div class="announcement-owner js-announcement-owner" data-url="https://autoplius.lt/auto4sale"> <div class="announcement-owner-link"> Visi partnerio pasiūlymai » </div> </div> </div> </div> </div> </a>`;

console.log('\n1. autoplius · „Parduota!" ─────────────────────────────────');
{
  const [a, b] = P.extractAutopliusStructured(AP_OK + AP_SOLD);
  t('įprasta: 35 000 €, 99 200 km, 2019, 250 kW, Vilnius', a.kaina === 35000 && a.rida === 99200 && a.metai === 2019 && a.galia === 250 && a.miestas === 'Vilnius', a);
  t('įprasta: parduota:false, be įspėjimo', a.parduota === false && !a.kainosIspejimas, { p: a.parduota, i: a.kainosIspejimas });
  t('„Parduota!": parduota:true', b.parduota === true, b.parduota);
  t('„Parduota!": kainosIspejimas tipas parduota (→ ne į vidurkį, ne į TOP)', b.kainosIspejimas && b.kainosIspejimas.tipas === 'parduota', b.kainosIspejimas);
}

// ── autogidas: tikros kortelės 0139716245 (Aukcionas) ir 0139751276 (VIN) ──
const agKortele = (kaina, id, params) => `<article id="cars-container" class="list-item-new" data-price="${kaina}.00" data-updated="1789541726"> <div class="article-item"> <a class="item-link " role="link" tabindex="0" href="/skelbimas/bmw-x5-2021-m-visureigis--krosoveris-${id}.html" title="BMW X5"> <div class="right"> <div class="image-content js-images-container "> <div class="ad-slideshow-container"> <div class="hide badge viewed-badge" data-badge="Žiūrėjote"></div> <div class="slideshow-wrapper"> <div class="slideshow-slide current"> <div class="image"> <img width="268" height="200" src="https://img.autogidas.lt/4_16_349397509/image.jpg" class="js-image" alt="BMW X5"> </div> </div> </div> </div> </div> <div class="description"> <div class="display-flex space-between card-title-wrapper"> <div class="title-wrapper"> <h2 class="item-title"> BMW X5 </h2> </div> <div class="item-price-content"> <div class="item-price"> ${kaina.toLocaleString('lt-LT').replace(/ /g, ' ')} € </div> <div class="gf-monthly-link no-print " data-gf-discount="0"> <span class="financing-price"> 100 €/mėn. </span> </div> </div> </div> <div class="parameters"> ${params} </div> <div class="business-logo display-flex "> <img loading="lazy" height="32" src="https://img.autogidas.lt/15_11_32767/1594757407.jpg" alt="AUTO4SALE"> <div class="dealer-text"> <span class="company-name">AUTO4SALE</span> <p>Patvirtintas partneris<span class="icon ico-trust-shield"></span></p> </div> </div> </div> </div> </a> </div> </article>`;
const AG_AUK = agKortele(7000, '0139716245', '<span class="parameter-value"> 2021 m. </span> <span class="parameter-value"> Benzinas </span> <span class="parameter-value"> 115 734 km </span> <span class="parameter-value"> Automatinė </span> <span class="parameter-value"> Klaipėda, Lietuva </span> <span class="parameter-value auction-badge">Aukcionas</span>');
const AG_VIN = agKortele(15300, '0139751276', '<span class="parameter-value"> 2021 m. </span> <span class="parameter-value"> Benzinas </span> <span class="parameter-value"> 84 409 km </span> <span class="parameter-value"> Automatinė </span> <span class="parameter-value"> 3.0 L </span> <span class="parameter-value"> Klaipėda, Lietuva </span> <div class="parameter-value vin-code"> <img src="https://static.autogidas.lt/static/img/ico/svg/vin-check.svg"> <span class="vin-code-text">VIN</span> </div>');

console.log('\n2. autogidas · „Aukcionas" ─────────────────────────────────');
{
  const [a, v] = P.extractAutogidasListings(AG_AUK + AG_VIN, 'https://autogidas.lt/skelbimai/automobiliai/');
  t('aukcionas: 7 000 €, 115 734 km, 2021, Klaipėda', a.kaina === 7000 && a.rida === 115734 && a.metai === 2021 && a.miestas === 'Klaipėda', a);
  t('aukcionas: aukcionas:true, galimasJavImportas:true', a.aukcionas === true && a.galimasJavImportas === true, { a: a.aukcionas, j: a.galimasJavImportas });
  t('aukcionas: kainosIspejimas tipas aukcionas', a.kainosIspejimas && a.kainosIspejimas.tipas === 'aukcionas', a.kainosIspejimas);
  t('„Aukcionas" ženklas nepavirto miestu ar kuru', a.miestas === 'Klaipėda' && a.kuras === 'Benzinas', { m: a.miestas, k: a.kuras });
  t('ne aukcionas (tas pats pardavėjas): be ženklo, be įspėjimo', v.aukcionas === false && !v.kainosIspejimas, { a: v.aukcionas, i: v.kainosIspejimas });
  t('ne aukcionas: 15 300 €, 3.0 L', v.kaina === 15300 && v.variklioTuris === 3, v);
}

// ── otomoto: tikras node ID6IbkoX iš __NEXT_DATA__ ───────────────────────
const OT_NODE = { id: '6146214049', title: 'BMW X5 xDrive40d mHEV sport', createdAt: '2026-09-08T09:52:36Z', shortDescription: 'X5 M-sport 40d',
  url: 'https://www.otomoto.pl/osobowe/oferta/bmw-x5-ID6IbkoX.html',
  location: { __typename: 'Location', city: { __typename: 'AdministrativeLevel', name: 'Łomża' }, region: { __typename: 'AdministrativeLevel', name: 'Podlaskie' } },
  price: { amount: { units: 139900, currencyCode: 'PLN' } },
  parameters: [
    { displayValue: 'BMW', key: 'make', label: 'make', value: 'bmw' },
    { displayValue: 'Diesel', key: 'fuel_type', label: 'fuel_type', value: 'diesel' },
    { displayValue: 'Automatyczna', key: 'gearbox', label: 'gearbox', value: 'automatic' },
    { displayValue: 'Polska', key: 'country_origin', label: 'country_origin', value: 'pl' },
    { displayValue: '71200 km', key: 'mileage', label: 'mileage', value: '71200' },
    { displayValue: '2993 cm3', key: 'engine_capacity', label: 'engine_capacity', value: '2993' },
    { displayValue: '340 KM', key: 'engine_power', label: 'engine_power', value: '340' },
    { displayValue: 'X5', key: 'model', label: 'model', value: 'x5' },
    { displayValue: 'xDrive40d mHEV sport', key: 'version', label: 'version', value: 'ver-xdrive40d-mhev-sport' },
    { displayValue: '2020', key: 'year', label: 'year', value: '2020' },
  ],
  thumbnail: { x1: 'https://ireland.apollo.olxcdn.com/v1/files/x/image;s=320x240' } };
const otHtml = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({ props: { pageProps: { urqlState: { k1: { data: JSON.stringify({ advertSearch: { edges: [{ node: OT_NODE }] } }) } } } } }) + '</script>';

console.log('\n3. otomoto ─────────────────────────────────────────────────');
{
  const [o] = P.extractOtomotoListings(otHtml);
  t('kaina 139 900 PLN → EUR pagal PLN_EUR_RATE', o.kaina === Math.round(139900 / (src.match(/const PLN_EUR_RATE = ([\d.]+)/) || [0, 4.25])[1]), o.kaina);
  t('modelis „BMW X5" (displayValue), ne „bmw x5"', o.modelis === 'BMW X5', o.modelis);
  t('galia 340 KM → 250 kW (buvo null: „KM" tik displayValue)', o.galia === 250, o.galia);
  t('miestas Łomża, vieta su regionu ir šalimi', o.miestas === 'Łomża' && o.vieta === 'Łomża, Podlaskie, Lenkija', { m: o.miestas, v: o.vieta });
  t('rida, metai, kuras, dėžė, tūris', o.rida === 71200 && o.metai === 2020 && o.kuras === 'Dyzelinas' && o.pavarai === 'Automatinė' && o.variklioTuris === 3, o);
}

// ── autoscout24: tikras listing ee423fa8 iš __NEXT_DATA__ ─────────────────
const AS_ITEM = { id: 'ee423fa8-d2c4-4d9c-bfb2-59480f37a090', images: ['https://prod.pictures.autoscout24.net/listing-images/ee423fa8-d2c4-4d9c-bfb2-59480f37a090_175225be-ed79-46de-8457-9569cfddef7c.jpg/250x188.webp'],
  price: { priceFormatted: '€ 39,900', isVatLabelLegallyRequired: false, priceRaw: 39900, isConditionalPrice: false },
  url: '/offers/bmw-x5-45e-hybrid-night-vision-full-option-electric-gasoline-grey-cat_ma13mo16406-ee423fa8-d2c4-4d9c-bfb2-59480f37a090',
  vehicle: { articleType: 'Car', type: 'Car', make: 'BMW', model: 'X5', modelGroup: 'X5', variant: 'X5', motorTypeName: '45e', modelId: 16406, modelVersionInput: '45e*HYBRID*NIGHT VISION*FULL OPTION*', offerType: 'U', transmission: 'Automatic', fuel: 'Electric/Gasoline', mileageInKm: '185,500 km', engineDisplacementInCCM: '2,998 cc' },
  location: { countryCode: 'BE', zip: '8890', city: 'Dadizele', street: 'Enkel op afspraak' },
  ratings: { ratingsCount: 35, ratingsStars: 5, ratingsEnabled: true }, seller: { type: 'Dealer', companyName: 'PerformAuto BV' },
  tracking: { firstRegistration: '04-2022', fuelType: '2', mileage: '185500', priceLabel: 'fair-price', price: '39900' },
  vehicleDetails: [{ data: '185,500 km', iconName: 'mileage_odometer' }, { data: '238 kW (324 hp)', iconName: 'speedometer' }] };
const asHtml = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({ props: { pageProps: { listings: [AS_ITEM] } } }) + '</script>';

console.log('\n4. autoscout24 ─────────────────────────────────────────────');
{
  const [s] = P.extractAutoscout24Listings(asHtml);
  t('39 900 €, 185 500 km, 2022, 238 kW, 3.0', s.kaina === 39900 && s.rida === 185500 && s.metai === 2022 && s.galia === 238 && s.variklioTuris === 3, s);
  t('kuras „Benzinas / elektra"', s.kuras === 'Benzinas / elektra', s.kuras);
  t('miestas Dadizele, šalis BE (buvo 0 %)', s.miestas === 'Dadizele' && s.salis === 'BE' && s.vieta === 'Dadizele, BE', { m: s.miestas, s: s.salis, v: s.vieta });
  t('pardavėjas, verslas, portalo kainos vertinimas', s.pardavejas === 'PerformAuto BV' && s.yraVerslas === true && s.portaloKainosVertinimas === 'fair-price', s);
}

console.log('\n' + (bl ? '✗ ' + bl + ' klaidos iš ' + (ok + bl) : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
