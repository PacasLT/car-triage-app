// server.js
// Car Triage App - web interfeisas automobiliu arbitrazo paieskai.
// Priima filtrus is formos, sukuria paieskos URL abiem portalams, nuskaito,
// analizuoja su Claude, grazina rezultatus i naryklo.

require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Anthropic = require('@anthropic-ai/sdk');
const cache = require('./cache');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5';

// ============ SCRAPING (ta pati logika kaip triage.js) ============

async function fetchWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  );
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  const html = await page.content();
  await browser.close();
  return html;
}

async function fetchSearchPage(url) {
  const cached = cache.getCached('pages', url, cache.PAGE_TTL_MS);
  if (cached) {
    console.log(`  (talpykla: ${url.slice(0, 60)}...)`);
    return cached;
  }

  const SCRAPER_KEY = process.env.SCRAPER_API_KEY;
  let html;

  // 1. ScraperAPI (jei raktas nurodytas)
  if (SCRAPER_KEY) {
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}&render=false`;
      console.log(`  ScraperAPI: ${url.slice(0, 60)}...`);
      const response = await axios.get(scraperUrl, { timeout: 60000 });
      if (response.status === 200 && response.data && response.data.length > 500) {
        html = response.data;
        console.log(`  ScraperAPI OK (${html.length} simboliu)`);
      }
    } catch (err) {
      console.log(`  ScraperAPI klaida: ${err.message}`);
    }
  }

  // 2. Tiesioginis axios (atsarginis)
  if (!html) {
    const origin = new URL(url).origin;
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'lt-LT,lt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': `${origin}/`,
        },
        timeout: 30000,
        validateStatus: (s) => s < 500,
      });
      if (response.status === 200) html = response.data;
    } catch (err) {
      // tesiame prie Puppeteer
    }
  }

  // 3. Puppeteer (paskutinis variantas)
  if (!html) html = await fetchWithPuppeteer(url);

  cache.setCached('pages', url, html);
  return html;
}

// Specialiai skelbimo puslapiui - naudoja render=true, kad gautume JS-renderinta HTML
// (galeriją, lazy-loaded nuotraukų src). Brangiau ScraperAPI kreditais, bet tik TOP 5.
async function fetchListingPage(url) {
  const cached = cache.getCached('pages', url, cache.PAGE_TTL_MS);
  if (cached) {
    console.log(`  (talpykla: ${url.slice(0, 60)}...)`);
    return cached;
  }

  const SCRAPER_KEY = process.env.SCRAPER_API_KEY;
  let html;

  // render=true galerijos JS ivykdymui
  if (SCRAPER_KEY) {
    try {
      const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}&render=true`;
      console.log(`  ScraperAPI (render=true): ${url.slice(0, 60)}...`);
      const response = await axios.get(scraperUrl, { timeout: 90000 });
      if (response.status === 200 && response.data && response.data.length > 500) {
        html = response.data;
        console.log(`  ScraperAPI OK (${html.length} simboliu)`);
      }
    } catch (err) {
      console.log(`  ScraperAPI render=true klaida: ${err.message}`);
    }
  }

  // Atsarginis: Puppeteer (jei ScraperAPI neprieinamas)
  if (!html) html = await fetchWithPuppeteer(url);
  // Paskutinis atsarginis: paprasta uzklasa
  if (!html) html = await fetchSearchPage(url);

  cache.setCached('pages', url, html);
  return html;
}

function extractField(text, regex) {
  const m = text.match(regex);
  if (!m) return null;
  return parseInt(m[1].replace(/\s/g, ''), 10);
}

// "20 000 km arba 1 metu garantija" - tai GARANTIJOS salygos, NE automobilio rida.
// Realios ridos skaicius paprastai eina TOLIAU tekste, be "arba"/"garantij"/"mėn" saloia.
function extractRida(text) {
  const regex = /(\d[\d\s]{2,7})\s?km/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = Math.max(0, match.index - 15);
    const end = Math.min(text.length, match.index + match[0].length + 25);
    const context = text.slice(start, end).toLowerCase();
    if (context.includes('garantij') || context.includes('arba') || context.includes('mėn')) continue;
    return parseInt(match[1].replace(/\s/g, ''), 10);
  }
  return null;
}

function extractListingBlocksAutoplius(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, iframe, noscript').remove();
  const blocks = [];
  const selector = 'article, [class*="announcement"], [class*="listing-item"], [class*="offer-item"], [class*="AdCard"]';
  $(selector).each(function () {
    const el = $(this);
    const text = el.text().replace(/\s+/g, ' ').trim();
    if (text.length < 20) return;
    let href = el.find('a[href*="/skelbimai/"]').first().attr('href');
    if (!href) href = el.attr('href');
    if (href && !href.startsWith('http')) href = 'https://autoplius.lt' + href;
    const photo = el.find('img').first().attr('src') || el.find('img').first().attr('data-src') || null;
    if (href && href.includes('/skelbimai/')) {
      blocks.push({ text: text.slice(0, 600), url: href, photo });
    }
  });
  const seen = new Set();
  return blocks.filter((b) => (seen.has(b.url) ? false : (seen.add(b.url), true)));
}

function parseListingFields(text) {
  // "NNNN € + PVM" reiskia, kad nurodyta kaina yra BE PVM - pirkejas is tikruju
  // moka kaina + 21% PVM. Vertiname VISADA galutine suma SU PVM.
  const plusPvmMatch = text.match(/(\d[\d\s]{2,7})\s?€\s*\+\s*PVM/i);
  let kaina, kainaBaze = null, pvmPastaba = null;
  if (plusPvmMatch) {
    kainaBaze = parseInt(plusPvmMatch[1].replace(/\s/g, ''), 10);
    kaina = Math.round(kainaBaze * 1.21);
    pvmPastaba = `Skelbime nurodyta ${kainaBaze}€ + PVM = ${kaina}€ su PVM (vertinama su PVM kaina)`;
  } else {
    kaina = extractField(text, /(\d[\d\s]{2,7})\s?€/);
  }

  const rida = extractRida(text);
  const metaiMatch = text.match(/\b(19|20)\d{2}\b/);
  const metai = metaiMatch ? parseInt(metaiMatch[0], 10) : null;
  const kainaBePvm = extractField(text, /(\d[\d\s]{2,7})\s?€\s*be\s*PVM/i);
  const turiLizingoOpcija = /€\s*\/\s*\d+\s*mėn/i.test(text) || /\d+\s*€\s*\/\s*mėn/i.test(text);

  // Variklio turis (litrais) ir galia (kW) - svarbus kainos rodiklis (galingesnis variklis =
  // brangesnis automobilis), tad istraukiame ji struktūrizuotai, ne palieka vien AI tekste.
  const engineMatch = text.match(/(\d[.,]\d)\s?l\.?,?\s*(\d+)\s?kW/i);
  const variklioTuris = engineMatch ? parseFloat(engineMatch[1].replace(',', '.')) : null;
  const galia = engineMatch ? parseInt(engineMatch[2], 10) : null;

  const kainaPos = text.search(/\d[\d\s]{2,7}\s?€/);
  let prefix = kainaPos > -1 ? text.slice(0, kainaPos) : text.slice(0, 100);
  prefix = prefix.replace(/^\d*\s*(Rezervuota|Atnaujintas|Atnaujinta|Prieš\s+\d+\s+val\.?)\s*/i, '');
  prefix = prefix.replace(/^\d+\s+/, '');
  const isModelToken = (tok) => /^[A-Za-zĀ-Žā-žÀ-ÿ]/.test(tok) || /^\d{1,3}$/.test(tok);
  const tokens = prefix.trim().split(/\s+/).filter(Boolean);
  const modelTokens = [];
  for (const tok of tokens) {
    if (modelTokens.length >= 3) break;
    if (isModelToken(tok)) modelTokens.push(tok);
    else break;
  }
  const modelis = modelTokens.length > 0 ? modelTokens.join(' ') : 'Nezinomas';

// Dazniausiai pasitaikancios "pardavejo" frazes, kurios skamba nuraminancziai, bet
// realiai nieko konkretaus nepatvirtina arba gali slepti problema. Naudojame kaip
// papildoma konteksta AI analizei - PROFESIONALIU tonu, ne kaip pokstus.
const SELLER_PHRASES = [
  { re: /nedaužt\w*,?\s*tik\s*dažyt\w*/i, note: 'Dažymas dažnai reiškia buvusį kėbulo remontą - net jei formaliai "nedaužta", verta patikrinti dažų sluoksnio storį matuokliu' },
  { re: /(sėdi\s*ir\s*važiuoji|sėsk\s*ir\s*važiuok)/i, note: 'Bendra frazė be konkrečios techninės informacijos' },
  { re: /nieko\s*nereikia\s*(daryti|investuoti)/i, note: 'Bendras teiginys - paprašykite konkretaus apžiūros/diagnostikos rezultato, ne žodinio patvirtinimo' },
  { re: /(variklis|dėžė|pavaros?)\s*(dirba\s*)?(kaip\s*laikrodis|idealiai|puikiai)/i, note: 'Subjektyvus įvertinimas be diagnostikos duomenų' },
  { re: /visa\s*serviso\s*istorija/i, note: 'Nurodoma serviso istorija be konkrečių įrašų - paprašykite realių dokumentų/kvitų' },
  { re: /(tik\s*)?(vien\w*|nedidel\w*)\s*(kosmetik\w*|smulkm\w*)/i, note: '"Tik kosmetika" - verta pamatyti nuotraukas/apžiūrėti gyvai, nes terminas subjektyvus' },
  { re: /rida\s*(tikra|garantuota)/i, note: 'Ridos tikslumą patikimiausia patvirtina VIN/serviso knygelės įrašai, ne žodinis teiginys' },
];

function detectSellerPhrases(text) {
  const found = [];
  for (const { re, note } of SELLER_PHRASES) {
    const m = text.match(re);
    if (m) found.push({ phrase: m[0], note });
  }
  return found;
}

const defektuZodziai = ['daužtas', 'degęs', 'skendęs', 'defekt', 'krušos', 'po avarijos', 'remontuot', 'korozij', 'rūdž'];
  const galimiDefektai = defektuZodziai.filter((z) => text.toLowerCase().includes(z));

  const turiIstorijosAtaskaita = /Patikrinta istorija|Autoistorija\.lt ATASKAITA/i.test(text);
  const turiGarantija = /GARANTIJA/i.test(text);
  const garantijosTipas = /GAMINTOJO GARANTIJA/i.test(text) ? 'gamintojo'
    : /PARDAVĖJO GARANTIJA/i.test(text) ? 'pardavėjo'
    : turiGarantija ? 'nenurodyta_kokia' : null;
  const yraVerslas = /Visi partnerio pasiūlymai/i.test(text);

  const kuroTipuSarasas = ['Dyzelinas / elektra', 'Benzinas / elektra / dujos', 'Benzinas / elektra',
    'Benzinas / dujos', 'Dyzelinas', 'Benzinas', 'Elektra', 'Bioetanolis'];
  const kurasMatch = kuroTipuSarasas.find((k) => text.includes(k));
  const pavaraiMatch = /Automatinė/i.test(text) ? 'Automatinė' : /Mechaninė/i.test(text) ? 'Mechaninė' : null;
  const turiVin = /\bvin\b/i.test(text);
  // JAV kilme + didele nuolaida gali reiksti, kad rodoma kaina yra tik AUKCIONO PRADINE
  // kaina (be gabenimo, muitu, remonto isliadu) - ne galutine kaina Lietuvoje.
  const galimasJavImportas = /\bJAV\b/.test(text) || /aukcion/i.test(text);

  let reitingas = null, atsiliepimuSkaicius = null;
  const reitingoMatch = text.match(/(\d\.\d)\s*Atsiliepimai\s*\((\d+)\)/i);
  if (reitingoMatch) { reitingas = parseFloat(reitingoMatch[1]); atsiliepimuSkaicius = parseInt(reitingoMatch[2], 10); }

  return {
    kaina, kainaBaze, pvmPastaba, kainaBePvm, turiLizingoOpcija, rida, metai, modelis, galimiDefektai,
    kuras: kurasMatch || null, pavarai: pavaraiMatch, turiVin, galimasJavImportas, galia, variklioTuris,
    turiIstorijosAtaskaita, turiGarantija, garantijosTipas, yraVerslas,
    reitingas, atsiliepimuSkaicius, rawText: text.slice(0, 200),
  };
}

// Nuskaito AutoScout24 skelbimus is __NEXT_DATA__ JSON bloko - patikimiau nei CSS selektoriai.
function extractAutoscout24Listings(html) {
  const $ = cheerio.load(html);
  const scriptContent = $('#__NEXT_DATA__').html();
  if (!scriptContent) return [];
  let data;
  try {
    data = JSON.parse(scriptContent);
  } catch {
    return [];
  }
  const listings = (data.props && data.props.pageProps && data.props.pageProps.listings) || [];
  const FUEL_MAP = { Gasoline: 'Benzinas', Petrol: 'Benzinas', Diesel: 'Dyzelinas', Electric: 'Elektra', Hybrid: 'Hibridas' };
  const GEARBOX_MAP = { Automatic: 'Automatinė', Manual: 'Mechaninė' };

  return listings.map((item) => {
    const kaina = item.price && item.price.priceRaw ? Math.round(item.price.priceRaw) : null;
    const ridaStr = item.tracking && item.tracking.mileage;
    const rida = ridaStr ? parseInt(ridaStr, 10) : null;
    const fregMatch = ((item.tracking && item.tracking.firstRegistration) || '').match(/(\d{4})/);
    const metai = fregMatch ? parseInt(fregMatch[1], 10) : null;
    const modelis = item.vehicle ? `${item.vehicle.make || ''} ${item.vehicle.model || item.vehicle.modelGroup || ''}`.trim() : '';
    const fuelRaw = item.vehicle && item.vehicle.fuel;
    const kuras = FUEL_MAP[fuelRaw] || fuelRaw || null;
    const pavarai = GEARBOX_MAP[item.vehicle && item.vehicle.transmission] || null;
    const photos = (item.images || []).slice(0, 12);
    const photo = photos[0] || null;
    const yraVerslas = !!(item.seller && item.seller.type === 'Dealer');
    const pardavejas = (item.seller && item.seller.companyName) || null;
    const reitingas = (item.ratings && item.ratings.ratingsStars) || null;
    const atsiliepimuSkaicius = (item.ratings && item.ratings.ratingsCount) || null;
    const url = item.url ? `https://www.autoscout24.com${item.url}` : null;
    const trimText = (item.vehicle && item.vehicle.modelVersionInput) || '';
    const rawText = `${item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : ''} ${trimText}`.trim().slice(0, 200);

    // Variklio galia (kW) is vehicleDetails masyvo ("290 kW (394 hp)"), turis (l) is cm3.
    const powerEntry = (item.vehicleDetails || []).find((d) => d.iconName === 'speedometer');
    const powerMatch = powerEntry && powerEntry.data.match(/(\d+)\s?kW/i);
    const galia = powerMatch ? parseInt(powerMatch[1], 10) : null;
    const ccStr = item.vehicle && item.vehicle.engineDisplacementInCCM;
    const ccMatch = ccStr && ccStr.match(/([\d,]+)/);
    const variklioTuris = ccMatch ? Math.round(parseInt(ccMatch[1].replace(/,/g, ''), 10) / 100) / 10 : null;

    return {
      kaina, kainaBaze: null, pvmPastaba: null, kainaBePvm: null, turiLizingoOpcija: false,
      rida, metai, modelis, galimiDefektai: [],
      kuras, pavarai, turiVin: false, galimasJavImportas: false,
      turiIstorijosAtaskaita: false, turiGarantija: false, garantijosTipas: null, yraVerslas, pardavejas,
      galia, variklioTuris,
      reitingas, atsiliepimuSkaicius,
      rawText, url, photo, photos,
    };
  }).filter((l) => l.url && l.kaina);
}

// Bendras skelbimu skaicius (numberOfResults) - patikimas, nes tiesiai is JSON.
function extractAutoscout24TotalCount(html) {
  try {
    const $ = cheerio.load(html);
    const scriptContent = $('#__NEXT_DATA__').html();
    const data = JSON.parse(scriptContent);
    const n = data.props.pageProps.numberOfResults;
    return typeof n === 'number' ? { count: n, exact: true } : null;
  } catch {
    return null;
  }
}

function extractAutogidasListings(html, originUrl) {
  const $ = cheerio.load(html);
  const origin = new URL(originUrl).origin;
  const results = [];
  $('article.list-item-new, .list-item-new').each(function () {
    const el = $(this);
    const cardText = el.text().replace(/\s+/g, ' ').trim();
    const priceAttr = el.attr('data-price');
    let kaina = priceAttr ? Math.round(parseFloat(priceAttr)) : null;
    if (!kaina) return;

    // "+ PVM" - data-price gali buti BE PVM kaina, patikrinam ir perskaiciuojam su PVM.
    let kainaBaze = null, pvmPastaba = null;
    const plusPvmMatch = cardText.match(new RegExp(`${kaina}\\s?€\\s*\\+\\s*PVM`, 'i'));
    if (plusPvmMatch) {
      kainaBaze = kaina;
      kaina = Math.round(kainaBaze * 1.21);
      pvmPastaba = `Skelbime nurodyta ${kainaBaze}€ + PVM = ${kaina}€ su PVM (vertinama su PVM kaina)`;
    }

    let href = el.find('a.item-link').first().attr('href') || '';
    if (href && !href.startsWith('http')) href = origin + (href.startsWith('/') ? href : '/' + href);
    if (!href) return;
    const modelis = el.find('h2.item-title').first().text().replace(/\s+/g, ' ').trim()
      || el.find('a.item-link').first().attr('title') || 'Nezinomas';
    const params = [];
    el.find('span.parameter-value').each(function () { params.push($(this).text().replace(/\s+/g, ' ').trim()); });
    let metai = null, rida = null, kuras = null, pavarai = null, galia = null, variklioTuris = null;
    const kuroTipuSarasas = ['Dyzelinas / elektra', 'Benzinas / elektra / dujos', 'Benzinas / elektra',
      'Benzinas / dujos', 'Dyzelinas', 'Benzinas', 'Elektra', 'Bioetanolis'];
    for (const p of params) {
      const yearMatch = p.match(/\b(19|20)\d{2}\b/);
      if (yearMatch && !metai) metai = parseInt(yearMatch[0], 10);
      if (/km/i.test(p) && !/mėn/i.test(p) && !rida) rida = extractField(p, /(\d[\d\s]{2,7})\s?km/);
      if (!kuras && kuroTipuSarasas.includes(p)) kuras = p;
      if (!pavarai && (p === 'Automatinė' || p === 'Mechaninė')) pavarai = p;
      const ccMatch = p.match(/(\d[\d\s]{2,5})\s?cm³/i);
      if (ccMatch && !variklioTuris) variklioTuris = Math.round(parseInt(ccMatch[1].replace(/\s/g, ''), 10) / 100) / 10;
      const kwMatch = p.match(/(\d+)\s?kW/i);
      if (kwMatch && !galia) galia = parseInt(kwMatch[1], 10);
    }
    const turiGarantija = el.find('.guarantee-badge, [data-badge="Garantija"]').length > 0;
    const galimasJavImportas = /\bJAV\b/.test(cardText);
    const turiVin = el.find('.vin-badge, .vin-code, [data-badge*="VIN"]').length > 0;
    const yraVerslas = el.find('.business-logo, .company-name').length > 0;
    const turiLizingoOpcija = el.find('.financing-price').length > 0;
    const photo = el.find('img.js-image').first().attr('src')
      || el.find('.thumbs img').first().attr('data-src')
      || el.find('img').first().attr('src') || null;

    results.push({
      kaina, kainaBaze, pvmPastaba, kainaBePvm: null, turiLizingoOpcija, rida, metai, modelis, galimiDefektai: [],
      galimasJavImportas,
      kuras, pavarai, turiVin, galia, variklioTuris,
      turiIstorijosAtaskaita: turiVin, turiGarantija,
      garantijosTipas: turiGarantija ? 'nenurodyta_kokia' : null, yraVerslas,
      reitingas: null, atsiliepimuSkaicius: null,
      rawText: `${modelis} ${kaina}€ ${params.join(', ')}`.slice(0, 200),
      url: href, photo,
    });
  });
  return results;
}

async function fetchAllPages(baseUrl, maxPages, onProgress) {
  const allListings = [];
  const seenUrls = new Set();
  const isAutogidas = baseUrl.includes('autogidas.lt');
  const isAutoscout = baseUrl.includes('autoscout24.com');
  const isOtomoto = baseUrl.includes('otomoto.pl');
  const pageParam = (isAutogidas || isAutoscout || isOtomoto) ? 'page' : 'page_nr';
  for (let page = 1; page <= maxPages; page++) {
    const resolveStep = onProgress ? onProgress(page) : null;
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${pageParam}=${page}`;
    let html;
    try {
      html = await fetchSearchPage(pageUrl);
    } catch (err) {
      if (resolveStep) resolveStep();
      break;
    }
    const newItems = isAutogidas ? extractAutogidasListings(html, pageUrl)
      : isAutoscout ? extractAutoscout24Listings(html)
      : isOtomoto ? extractOtomotoListings(html)
      : extractListingBlocksAutoplius(html);
    const filtered = newItems.filter((b) => !seenUrls.has(b.url));
    if (resolveStep) resolveStep();
    if (filtered.length === 0) break;
    filtered.forEach((b) => seenUrls.add(b.url));
    allListings.push(...filtered);
  }
  const format = (isAutogidas || isAutoscout || isOtomoto) ? 'parsed' : 'raw';
  return { listings: allListings, format };
}

// Tas pats pardavejas gali ikelti TA PATI automobili i abu portalus.
// Aptinkame pagal: modelis + metai + rida (+-300km del galimo atnaujinimo) + kuras + pavarai.
// Paliekame VIENA irasa (pigesne kaina) pagrindiniam sarasui, bet prisimename abi nuorodas/kainas.
function mergeDuplicatesAcrossPortals(listings) {
  const used = new Set();
  const merged = [];
  for (let i = 0; i < listings.length; i++) {
    if (used.has(i)) continue;
    const a = listings[i];
    let group = [a];
    for (let j = i + 1; j < listings.length; j++) {
      if (used.has(j)) continue;
      const b = listings[j];
      if (a.source === b.source) continue; // duplikatai domina tik TARP skirtingu portalu
      if (a.modelis !== b.modelis) continue;
      if (!a.metai || !b.metai || a.metai !== b.metai) continue;
      if (!a.rida || !b.rida || Math.abs(a.rida - b.rida) > 300) continue;
      if (a.kuras && b.kuras && a.kuras !== b.kuras) continue;
      if (a.pavarai && b.pavarai && a.pavarai !== b.pavarai) continue;
      group.push(b);
      used.add(j);
    }
    if (group.length > 1) {
      group.sort((x, y) => (x.kaina || Infinity) - (y.kaina || Infinity));
      const primary = { ...group[0] };
      primary.kryzminiaiSkelbimai = group.slice(1).map((g) => ({ source: g.source, url: g.url, kaina: g.kaina }));
      merged.push(primary);
    } else {
      merged.push(a);
    }
    used.add(i);
  }
  return merged;
}

function computeMarketMedians(parsedListings) {
  const byModel = {};
  const ridaByModel = {};
  parsedListings.forEach((l) => {
    if (l.kaina) {
      if (!byModel[l.modelis]) byModel[l.modelis] = [];
      byModel[l.modelis].push(l.kaina);
    }
    if (l.rida) {
      if (!ridaByModel[l.modelis]) ridaByModel[l.modelis] = [];
      ridaByModel[l.modelis].push(l.rida);
    }
  });
  const medians = {};
  for (const [model, prices] of Object.entries(byModel)) {
    const sorted = [...prices].sort((a, b) => a - b);
    const ridaSorted = (ridaByModel[model] || []).sort((a, b) => a - b);
    medians[model] = {
      median: sorted[Math.floor(sorted.length / 2)],
      count: sorted.length,
      ridaMedian: ridaSorted.length > 0 ? ridaSorted[Math.floor(ridaSorted.length / 2)] : null,
      ridaCount: ridaSorted.length,
    };
  }
  return medians;
}

async function generateShortComment(listing, diffPct) {
  const turiDefektu = listing.galimiDefektai.length > 0;
  const kontekstas = turiDefektu
    ? `Tekste PAMINETI galimi defektai: ${listing.galimiDefektai.join(', ')}.`
    : `Tekste NEPAMINETA defektu - nuokrypis neaiskus.`;
  const pasitikejimoSignalai = [
    listing.yraVerslas ? 'verslas/dealeris' : 'privatus asmuo',
    listing.turiIstorijosAtaskaita ? 'patikrinta istorija' : 'neturi istorijos ataskaitos',
    listing.garantijosTipas ? `garantija (${listing.garantijosTipas})` : 'be garantijos',
  ].join('; ');
  const pvmKontekstas = listing.pvmPastaba
    ? `${listing.pvmPastaba} - naudok SU PVM kaina savo vertinime, nespelioke apie PVM.`
    : listing.kainaBePvm
    ? `Skelbime taip pat yra ${listing.kainaBePvm}€ be PVM/Eksportui kaina - tai NE ta kaina, kuria mokėtų privatus pirkėjas, nespelioke apie tai.`
    : '';
  const stiprusNuokrypis = diffPct >= 39
    ? `SVARBU: ${diffPct}% nuolaida yra LABAI didele (>=39%). Statistiskai toks nuokrypis DAZNIAUSIAI reiskia, kad automobilis yra dauztas, turi paslepta defekta, arba reikalaus reiksmingu investiciju/tvarkymo - net jei tekste to nepamineta. Savo pastaboje AISKIAI persperk pirkeja apie sita rizika, nesvarbu, kokie kiti pasitikejimo signalai yra.`
    : '';
  const formatRidaDiff = (pct) => (pct >= 100 ? `${(pct / 100 + 1).toFixed(1)} karto` : `${pct}%`);
  const ridaKontekstas = listing.ridaDiffPct !== null
    ? listing.ridaDiffPct >= 20
      ? `RIDA: sio automobilio rida (${listing.rida} km) yra ${formatRidaDiff(listing.ridaDiffPct)} AUKSTESNE nei ${listing.modelis} imties vidurkis (${listing.ridaMedian} km). Didele rida reiskia daugiau nusidevejimo (variklis, pavaru deze, salonas, pakaba) - atsizvelk i tai vertindamas rizika, remdamasis bendromis ziniomis apie dideles ridos automobiliu problemas.`
      : listing.ridaDiffPct <= -20
      ? `RIDA: sio automobilio rida (${listing.rida} km) yra ${Math.abs(listing.ridaDiffPct)}% ZEMESNE nei ${listing.modelis} imties vidurkis (${listing.ridaMedian} km) - tai privalumas, mazesnis nusidevejimas.`
      : `RIDA: sio automobilio rida (${listing.rida} km) yra artima ${listing.modelis} imties vidurkiui (${listing.ridaMedian} km) - nieko neiprasto.`
    : '';
  const kryzminisKontekstas = listing.kryzminiaiSkelbimai && listing.kryzminiaiSkelbimai.length > 0
    ? `SVARBU: sis pat automobilis taip pat rastas kitame portale (${listing.kryzminiaiSkelbimai.map((k) => `${k.source} uz ${k.kaina}€`).join(', ')}) - tai reiskia pardavejas skelbia keliose vietose, tai NORMALU, ne rizikos zenklas.`
    : '';
  const javKontekstas = listing.galimasJavImportas && diffPct >= 39
    ? `SVARBU: automobilis greiciausiai JAV kilmes/importas. Kai kaina itin zema IR automobilis is JAV, kaina GALI buti tik aukciono PRADINE kaina (bid), NE galutine kaina - realiai pirkejui priedo prisideda pervezimas, muitas, PVM ir galimas remontas (jei pazeistas), kas gali sudaryti keleta tukstanciu eur papildomai. Butinai paminek sita nuansą.`
    : '';
  const prompt = `Automobilio skelbimas: "${listing.rawText}"
Kaina ${diffPct}% zemesne nei ${listing.modelis} vidurkis (${listing.marketCount} skelbimu imtis).
${kontekstas}
Pasitikejimo signalai: ${pasitikejimoSignalai}
${pvmKontekstas}
${stiprusNuokrypis}
${ridaKontekstas}
${kryzminisKontekstas}
${javKontekstas}

Jei naudinga, GALI atlikti web paieska del zinomu gedimu sitam modeliui/metams, arba del tipiniu
problemu, kylanciu tokiai ridai (pvz. kada tikimasi diržo/grandinės keitimo, pakabos susidevėjimo ir pan.).
Parasyk VIENA trumpa (max 28 zodziu) pastaba lietuviskai, atsizvelgdamas i VISA turima informacija,
iskaitant rida. Grazink TIK ta sakini.`;
  try {
    const response = await anthropic.messages.create({
      model: MODEL, max_tokens: 800,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
      messages: [{ role: 'user', content: prompt }],
    });
    const result = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    return result || `${diffPct}% zemiau vidurkio`;
  } catch (err) {
    console.error('generateShortComment KLAIDA:', err.message);
    return `${diffPct}% zemiau vidurkio (${listing.marketMedian} EUR, imtis ${listing.marketCount})`;
  }
}

// ============ URL SUDARYMAS PAGAL FILTRUS ============

function buildAutopliusUrl(filters) {
  const q = encodeURIComponent(`${filters.marke || ''} ${filters.modelis || ''}`.trim());
  let url = `https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2`;
  if (q) url += `&qt=${q}`;
  if (filters.metaiNuo) url += `&make_date_from=${filters.metaiNuo}`;
  if (filters.metaiIki) url += `&make_date_to=${filters.metaiIki}`;
  if (filters.kainaNuo) url += `&price_from=${filters.kainaNuo}`;
  if (filters.kainaIki) url += `&price_to=${filters.kainaIki}`;
  if (filters.ridaIki) url += `&kilometrage_to=${filters.ridaIki}`;
  if (filters.pavaru_deze === 'Automatinė') url += `&gearbox_id=38`;
  if (filters.pavaru_deze === 'Mechaninė') url += `&gearbox_id=37`;
  return url;
}

function buildAutogidasUrl(filters) {
  const params = [];
  if (filters.marke) params.push(`f_1[0]=${encodeURIComponent(filters.marke)}`);
  if (filters.modelis) params.push(`f_model_14[0]=${encodeURIComponent(filters.modelis)}`);
  if (filters.metaiNuo) params.push(`f_41=${filters.metaiNuo}`);
  if (filters.metaiIki) params.push(`f_42=${filters.metaiIki}`);
  if (filters.kainaNuo) params.push(`f_215=${filters.kainaNuo}`);
  if (filters.kainaIki) params.push(`f_216=${filters.kainaIki}`);
  if (filters.ridaIki) params.push(`f_66=${filters.ridaIki}`);
  if (filters.pavaru_deze) params.push(`f_10=${encodeURIComponent(filters.pavaru_deze)}`);
  return `https://autogidas.lt/skelbimai/automobiliai/?${params.join('&')}`;
}

// AutoScout24.com - tarptautinis portalas (Vokietija/Belgija/Prancuzija ir kt.), naudingas
// palyginti kainas su uzsienio rinka. Puslapio duomenys ateina svariame JSON bloke
// (__NEXT_DATA__), ne per CSS selektorius - todel patikimesnis nei kiti du portalai.
function buildAutoscout24Url(filters) {
  const marke = (filters.marke || '').toLowerCase().trim().replace(/\s+/g, '-');
  const modelis = (filters.modelis || '').toLowerCase().trim().replace(/\s+/g, '-');
  let url = `https://www.autoscout24.com/lst/${marke}`;
  if (modelis) url += `/${modelis}`;
  const params = ['sort=standard', 'desc=0', 'atype=C', 'cy=D,A,B,E,F,I,L,NL'];
  if (filters.metaiNuo) params.push(`fregfrom=${filters.metaiNuo}`);
  if (filters.metaiIki) params.push(`fregto=${filters.metaiIki}`);
  if (filters.kainaNuo) params.push(`pricefrom=${filters.kainaNuo}`);
  if (filters.kainaIki) params.push(`priceto=${filters.kainaIki}`);
  return `${url}?${params.join('&')}`;
}

// ============ OTOMOTO.PL (Lenkija) ============
// Lenkijos populiariausias automobiliu portalas. Kainos PLN, automatiskai konvertuojamos i EUR.
// Duomenys saugomi __NEXT_DATA__ JSON bloke (Next.js SSR), viduje urqlState raktu kaip JSON eilute.
const PLN_EUR_RATE = 4.25; // apytiksis kursas, atnaujinkite jei reikia

function buildOtomotoUrl(filters) {
  const marke = (filters.marke || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const modelis = (filters.modelis || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let url = `https://www.otomoto.pl/osobowe`;
  if (marke) url += `/${marke}`;
  if (marke && modelis) url += `/${modelis}`;
  const params = ['search[order]=filter_float_price:asc'];
  // Kaina EUR -> PLN konversija
  if (filters.kainaNuo) params.push(`search[filter_float_price:from]=${Math.floor(parseInt(filters.kainaNuo, 10) * PLN_EUR_RATE)}`);
  if (filters.kainaIki) params.push(`search[filter_float_price:to]=${Math.ceil(parseInt(filters.kainaIki, 10) * PLN_EUR_RATE)}`);
  if (filters.metaiNuo) params.push(`search[filter_float_year:from]=${filters.metaiNuo}`);
  if (filters.metaiIki) params.push(`search[filter_float_year:to]=${filters.metaiIki}`);
  if (filters.ridaIki) params.push(`search[filter_float_mileage:to]=${filters.ridaIki}`);
  if (filters.pavaru_deze) {
    const g = filters.pavaru_deze === 'Automatinė' ? 'automatic' : filters.pavaru_deze === 'Mechaninė' ? 'manual' : null;
    if (g) params.push(`search[filter_enum_gearbox][0]=${g}`);
  }
  return `${url}?${params.join('&')}`;
}

function extractOtomotoListings(html) {
  try {
    const $ = cheerio.load(html);
    const scriptContent = $('#__NEXT_DATA__').html();
    if (!scriptContent) return [];
    const data = JSON.parse(scriptContent);
    const urqlState = (data.props && data.props.pageProps && data.props.pageProps.urqlState) || {};
    // Ieskome rakto, kurio duomenyse yra advertSearch
    let edges = [];
    for (const key of Object.keys(urqlState)) {
      const entry = urqlState[key];
      if (!entry || !entry.data) continue;
      let parsed;
      try { parsed = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data; } catch { continue; }
      if (parsed && parsed.advertSearch && parsed.advertSearch.edges) {
        edges = parsed.advertSearch.edges;
        break;
      }
    }
    const FUEL_MAP = { petrol: 'Benzinas', diesel: 'Dyzelinas', electric: 'Elektra', hybrid: 'Hibridas', lpg: 'Dujos', cng: 'Dujos' };
    const GEAR_MAP = { automatic: 'Automatinė', manual: 'Mechaninė', 'semi-automatic': 'Automatinė' };

    return edges.map(({ node: item }) => {
      if (!item) return null;
      const priceRaw = item.price && item.price.amount && item.price.amount.units;
      const kainaPlN = priceRaw ? parseInt(priceRaw, 10) : null;
      const kaina = kainaPlN ? Math.round(kainaPlN / PLN_EUR_RATE) : null;

      const params = item.parameters || [];
      const getParam = (id) => { const p = params.find((x) => x.key === id); return p ? p.value : null; };

      const metai = getParam('year') ? parseInt(getParam('year'), 10) : null;
      const ridaStr = getParam('mileage');
      const rida = ridaStr ? parseInt(ridaStr.replace(/\D/g, ''), 10) : null;
      const fuelRaw = getParam('fuel_type');
      const kuras = FUEL_MAP[fuelRaw] || fuelRaw || null;
      const gearRaw = getParam('gearbox');
      const pavarai = GEAR_MAP[gearRaw] || null;
      const ccStr = getParam('engine_capacity');
      const variklioTuris = ccStr ? Math.round(parseInt(ccStr.replace(/\D/g, ''), 10) / 100) / 10 : null;
      const powerStr = getParam('engine_power');
      const powerMatch = powerStr && powerStr.match(/(\d+)\s*KM/i);
      // Lenkijoje galia KM (arklio jegos) -> kW (1 KM ≈ 0.7355 kW)
      const galia = powerMatch ? Math.round(parseInt(powerMatch[1], 10) * 0.7355) : null;

      const make = getParam('make') || '';
      const model = getParam('model') || '';
      const modelis = `${make} ${model}`.trim() || (item.title || '').trim();
      const url = item.url ? (item.url.startsWith('http') ? item.url : `https://www.otomoto.pl${item.url}`) : null;
      const photo = (item.thumbnail && (item.thumbnail.x2 || item.thumbnail.x1)) || null;
      // Otomoto kartais turi photos[] masyva tiesiai paieškos rezultatuose
      const photosArr = (item.photos || []).map((p) => (p && (p.url || p.large || p.src || '')).split('?')[0]).filter(Boolean);
      const photos = photosArr.length > 0 ? photosArr : (photo ? [photo] : []);

      return {
        kaina, kainaBaze: null, pvmPastaba: null, kainaBePvm: null, turiLizingoOpcija: false,
        rida, metai, modelis, galimiDefektai: [],
        kuras, pavarai, turiVin: false, galimasJavImportas: false,
        turiIstorijosAtaskaita: false, turiGarantija: false, garantijosTipas: null,
        yraVerslas: false, pardavejas: null,
        galia, variklioTuris,
        reitingas: null, atsiliepimuSkaicius: null,
        rawText: `${modelis} ${kaina}€ (${kainaPlN} PLN) ${metai || ''} ${rida || ''} km`.trim().slice(0, 200),
        url, photo, photos,
      };
    }).filter((l) => l && l.url && l.kaina);
  } catch (err) {
    console.error('extractOtomotoListings klaida:', err.message);
    return [];
  }
}

function extractOtomotoTotalCount(html) {
  try {
    const $ = cheerio.load(html);
    const scriptContent = $('#__NEXT_DATA__').html();
    if (!scriptContent) return null;
    const data = JSON.parse(scriptContent);
    const urqlState = (data.props && data.props.pageProps && data.props.pageProps.urqlState) || {};
    for (const key of Object.keys(urqlState)) {
      const entry = urqlState[key];
      if (!entry || !entry.data) continue;
      let parsed;
      try { parsed = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data; } catch { continue; }
      if (parsed && parsed.advertSearch && typeof parsed.advertSearch.totalCount === 'number') {
        return { count: parsed.advertSearch.totalCount, exact: true };
      }
    }
    return null;
  } catch { return null; }
}

// ============ GREITAS KIEKIO PATIKRINIMAS (be AI, be pilnos analizes) ============
// Nuskaito TIK 1 puslapi is kiekvieno portalo (naudoja ta pati 30 min talpykla),
// ir isskiria bendra rastu skelbimu skaiciu, kuri patys portalai rodo. Jokio AI
// kvietimo, tad tai beveik nemokama - ir "susildo" talpykla tolimesnei pilnai paieskai.
function extractTotalCount(html, isAutogidas) {
  const $ = cheerio.load(html);

  // 1) autoplius.lt rodo skaiciu H1 antrastes skliaustuose, pvz. "Bmw f13, Naudoti automobiliai (4)"
  const h1Text = $('h1').first().text().replace(/\s+/g, ' ').trim();
  const h1Match = h1Text.match(/\((\d[\d\s]*)\)\s*$/);
  if (h1Match) return { count: parseInt(h1Match[1].replace(/\s/g, ''), 10), exact: true };

  // 2) Atsarginis bendras tekstinis paieska ("X skelbimu"/"X rezultatu")
  const text = $('body').text().replace(/\s+/g, ' ');
  const snippet = text.slice(0, 4000);
  const textMatch = snippet.match(/(\d[\d\s]{0,6})\s*(?:skelbim\w*|rezultat\w*)/i);
  if (textMatch) return { count: parseInt(textMatch[1].replace(/\s/g, ''), 10), exact: true };

  // 3) Jei nepavyko rasti bendro skaiciaus tekste - paskaiciuojam, kiek REALIAI radome
  // siame (1-ame) puslapyje kaip minimalu, apytiksli ivertinima ("bent X").
  const listings = isAutogidas ? extractAutogidasListings(html, 'https://autogidas.lt/') : extractListingBlocksAutoplius(html);
  if (listings.length > 0) return { count: listings.length, exact: false };

  return null;
}

app.post('/api/quick-count', async (req, res) => {
  try {
    const filters = req.body;
    const autopliusUrl = buildAutopliusUrl(filters);
    const autogidasUrl = buildAutogidasUrl(filters);
    const autoscoutUrl = buildAutoscout24Url(filters);
    const otomotoUrl = buildOtomotoUrl(filters);
    const [autopliusHtml, autogidasHtml, autoscoutHtml, otomotoHtml] = await Promise.all([
      fetchSearchPage(autopliusUrl).catch(() => null),
      fetchSearchPage(autogidasUrl).catch(() => null),
      fetchSearchPage(autoscoutUrl).catch(() => null),
      fetchSearchPage(otomotoUrl).catch(() => null),
    ]);
    res.json({
      autoplius: autopliusHtml ? extractTotalCount(autopliusHtml, false) : null,
      autogidas: autogidasHtml ? extractTotalCount(autogidasHtml, true) : null,
      autoscout24: autoscoutHtml ? extractAutoscout24TotalCount(autoscoutHtml) : null,
      otomoto: otomotoHtml ? extractOtomotoTotalCount(otomotoHtml) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ FONO DARBO (JOB) SISTEMA - kad frontend galetu rodyti progresa ============

const jobs = {}; // { jobId: { status, log: [], result, error } }

function newJob() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  jobs[id] = { status: 'running', log: [], result: null, error: null };
  return id;
}

function logJob(id, msg) {
  if (jobs[id]) {
    jobs[id].log.push(msg);
    console.log(`[${id}] ${msg}`);
  }
}

// Kol vyksta ilgas foninis darbas (pvz. detali analize su web paieska), realaus progreso
// tarpiniu tasku neturime - todel rodome besikeiciancias, tikroves neiskraipacias
// busenos zinutes VIETOJE (perrasome paskutine eilute, ne prideame naujas), kad
// laukimas atrodytu "gyvas", panasiai kaip mygtuku busenos frontende.
function startFakeProgress(jobId, messages, intervalMs = 2200) {
  if (!jobs[jobId]) return () => {};
  logJob(jobId, messages[0]);
  const idx = jobs[jobId].log.length - 1;
  let i = 0;
  const timer = setInterval(() => {
    i = (i + 1) % messages.length;
    if (jobs[jobId] && jobs[jobId].log[idx] !== undefined) {
      jobs[jobId].log[idx] = messages[i];
    }
  }, intervalMs);
  return () => clearInterval(timer);
}

// Vienkartinis zingsnis: parasom "pradzios" zinute, graziname funkcija, kuria pakvietus
// TA PATI eilute (ta pati pozicija zurnale) pakeiciama i "baigta" zinute. Taip frontend
// visada tiksliai zino, kurie zingsniai realiai dar vyksta, o kurie jau baigti - net kai
// keli zingsniai vyksta lygiagreciai.
function logJobStep(jobId, startMsg) {
  logJob(jobId, startMsg);
  const idx = jobs[jobId] ? jobs[jobId].log.length - 1 : -1;
  return (doneMsg) => {
    if (jobs[jobId] && jobs[jobId].log[idx] !== undefined) {
      jobs[jobId].log[idx] = doneMsg;
    }
  };
}

// Kokybes balas - ne vien % nuolaida, bet ir pasitikejimo signalai. Taip "geriausias"
// pasiulymas nera tiesiog didziausia nuolaida, o realiai maziausiai rizikingas geras sandoris.
function computeQualityScore(l) {
  let score = l.diffPct;
  if (l.turiIstorijosAtaskaita) score += 15;
  if (l.turiGarantija) score += 15;
  if (l.yraVerslas) score += 8;
  if (l.reitingas && l.reitingas >= 4.5) score += 10;
  if (l.galimiDefektai.length > 0) score -= 40;
  if (!l.turiIstorijosAtaskaita && !l.turiGarantija && !l.yraVerslas) score -= 10; // visiskai "aklas" pirkimas
  // >=39% nuolaida statistiskai daznai reiskia dauzta/su defektu automobili - net jei kiti
  // signalai geri, tokie pasiulymai neturi pretenduoti i pacius pirmus rikiavimo vietas.
  if (l.diffPct >= 39) score -= 20;
  // JAV kilmes + didele nuolaida = kaina gali buti tik aukciono pradine kaina, be pervezimo/
  // muitu/remonto kastu - papildoma bauda, kad tokie skelbimai patektu ZEMIAU tikru pasiulymu.
  if (l.galimasJavImportas && l.diffPct >= 39) score -= 15;
  // Rida virs imties vidurkio = daugiau nusidevejimo (variklis, salonas) - mazina balus.
  // Rida gerokai zemiau vidurkio = privalumas, pridedam.
  if (l.ridaDiffPct !== null) {
    if (l.ridaDiffPct >= 40) score -= 15;
    else if (l.ridaDiffPct >= 20) score -= 8;
    else if (l.ridaDiffPct <= -20) score += 8;
  }
  return Math.round(score);
}

function hashFilters(f) {
  const keys = Object.keys(f).filter((k) => f[k] != null && f[k] !== '' && !(Array.isArray(f[k]) && f[k].length === 0)).sort();
  const normalized = {};
  for (const k of keys) {
    normalized[k] = Array.isArray(f[k]) ? [...f[k]].sort().join(',') : String(f[k]);
  }
  return JSON.stringify(normalized);
}

async function runSearchJob(jobId, filters) {
  try {
    // Jei ta pati paieska per 20 min - grazinam is talpyklos nedarydam is naujo skenuojant
    const filterHash = hashFilters(filters);
    const cachedSearch = cache.getSearchCached(filterHash);
    if (cachedSearch) {
      logJob(jobId, '\u26a1 Rezultatai i\u0161 talpyklos \u2014 ta pati paie\u0161ka < 20 min. Taupome laik\u0105!');
      jobs[jobId].result = cachedSearch;
      jobs[jobId].status = 'done';
      return;
    }

    const requestedPages = parseInt(filters.maxPages, 10);
    const maxPages = Math.min(Math.max(requestedPages || parseInt(process.env.MAX_PAGES || '3', 10), 1), 10);
    const modelQuery = (filters.modelis || '').toLowerCase().trim();
    const selectedPortals = Array.isArray(filters.portals) && filters.portals.length > 0
      ? filters.portals
      : ['autoplius', 'autogidas']; // atsarginis variantas - jei nenurodyta, tikrinam abu
    const allUrls = [
      { key: 'autoplius', url: buildAutopliusUrl(filters), site: 'autoplius.lt' },
      { key: 'autogidas', url: buildAutogidasUrl(filters), site: 'autogidas.lt' },
      { key: 'autoscout24', url: buildAutoscout24Url(filters), site: 'autoscout24.com' },
      { key: 'otomoto', url: buildOtomotoUrl(filters), site: 'otomoto.pl' },
    ];
    const urls = allUrls.filter((u) => selectedPortals.includes(u.key));

    if (urls.length === 0) {
      logJob(jobId, '⚠ Nepasirinktas joks portalas.');
      jobs[jobId].status = 'done';
      jobs[jobId].result = { totalScanned: 0, rawFoundCount: 0, medians: {}, candidates: [], allListings: [] };
      return;
    }

    let parsed = [];
    const siteResults = await Promise.all(urls.map(async ({ url, site }) => {
      const resolveSite = logJobStep(jobId, `🔎 Žvalgomės po ${site}...`);
      const { listings: rawListings, format } = await fetchAllPages(url, maxPages, (p) =>
        logJobStep(jobId, `📄 Verčiame ${site} ${p} puslapį...`).bind(null, `✅ ${site} ${p} puslapis nuskaitytas`)
      );
      let siteParsed = format === 'parsed' ? rawListings : rawListings.map((l) => ({ ...parseListingFields(l.text), url: l.url, photo: l.photo }));
      if (format !== 'parsed' && modelQuery) {
        siteParsed = siteParsed.filter((l) =>
          l.modelis.toLowerCase().includes(modelQuery) || l.rawText.toLowerCase().includes(modelQuery)
        );
      }
      siteParsed.forEach((l) => (l.source = site));
      resolveSite(`✅ ${site}: rasta ${siteParsed.length} skelbimų.`);
      return siteParsed;
    }));
    parsed = siteResults.flat();

    const metaiNuo = parseInt(filters.metaiNuo, 10) || null;
    const metaiIki = parseInt(filters.metaiIki, 10) || null;
    const kainaNuo = parseInt(filters.kainaNuo, 10) || null;
    const kainaIki = parseInt(filters.kainaIki, 10) || null;
    const ridaIki = parseInt(filters.ridaIki, 10) || null;

    const rawFoundCount = parsed.length;
    parsed = parsed.filter((l) => {
      if (metaiNuo && l.metai && l.metai < metaiNuo) return false;
      if (metaiIki && l.metai && l.metai > metaiIki) return false;
      if (kainaNuo && l.kaina && l.kaina < kainaNuo) return false;
      if (kainaIki && l.kaina && l.kaina > kainaIki) return false;
      if (ridaIki && l.rida && l.rida > ridaIki) return false;
      if (filters.pavaru_deze && l.pavarai && l.pavarai !== filters.pavaru_deze) return false;
      return true;
    });
    logJob(jobId, `🧹 ${rawFoundCount} rasta pagal markę/modelį → ${parsed.length} atitinka jūsų kainos/metų/ridos filtrus`);

    const beforeDedup = parsed.length;
    parsed = mergeDuplicatesAcrossPortals(parsed);
    if (beforeDedup !== parsed.length) {
      logJob(jobId, `🔗 Sujungta ${beforeDedup - parsed.length} kryžminių skelbimų (tas pats auto abiejuose portaluose)`);
    }

    logJob(jobId, '📚 Papildome ankstesnių paieškų archyvu...');
    const modelsInSearch = [...new Set(parsed.map((l) => l.modelis))];
    let combinedForMedians = [...parsed];
    let historyAddedCount = 0;
    for (const model of modelsInSearch) {
      const hist = cache.getHistoryForModel(model);
      const currentUrls = new Set(parsed.filter((l) => l.modelis === model).map((l) => l.url));
      const fromHistory = hist.filter((h) => !currentUrls.has(h.url)).map((h) => ({ modelis: model, kaina: h.kaina, rida: h.rida }));
      combinedForMedians = combinedForMedians.concat(fromHistory);
      historyAddedCount += fromHistory.length;
    }
    if (historyAddedCount > 0) {
      logJob(jobId, `   +${historyAddedCount} skelbimų iš archyvo (ankstesnės paieškos) – tikslesni vidurkiai`);
    }

    logJob(jobId, '🧮 Skaičiuojame rinkos vidurkius...');
    const medians = computeMarketMedians(combinedForMedians);
    cache.addToHistory(parsed); // issaugom sitos paieskos duomenis ateities paieskoms
    const THRESHOLD_PCT = 12;
    // Papildomus laukus (diffPct, ridaDiffPct ir t.t.) skaiciuojame VISIEMS nuskaitytiems
    // skelbimams, ne tik kandidatams - reikalinga, kad galetume paaiskinti, kodel
    // konkretus skelbimas NEPATEKO i "verti demesio" sarasa.
    const enriched = parsed.map((l) => {
      const marketData = l.modelis ? medians[l.modelis] : null;
      const hasReliableMarket = marketData && marketData.count >= 3;
      let diffPct = null, ridaDiffPct = null;
      if (l.kaina && hasReliableMarket) {
        diffPct = Math.round(((marketData.median - l.kaina) / marketData.median) * 100);
      }
      if (l.rida && marketData && marketData.ridaMedian && marketData.ridaCount >= 3) {
        ridaDiffPct = Math.round(((l.rida - marketData.ridaMedian) / marketData.ridaMedian) * 100);
      }
      return {
        ...l, diffPct, ridaDiffPct,
        marketCount: marketData ? marketData.count : 0,
        marketMedian: marketData ? marketData.median : null,
        ridaMedian: marketData ? marketData.ridaMedian : null,
      };
    });

    let candidates = enriched.filter((l) => l.diffPct !== null && l.diffPct >= THRESHOLD_PCT);
    candidates.forEach((c) => (c.qualityScore = computeQualityScore(c)));
    candidates.sort((a, b) => b.qualityScore - a.qualityScore);
    candidates = candidates.slice(0, 15);
    const candidateUrls = new Set(candidates.map((c) => c.url));

    // Kiekvienam NEATRINKTAM skelbimui paruosiame iki 3 konkreciu priezasciu, kodel jis
    // nepateko i "verti demesio" sarasa - vien is jau apskaiciuotu skaiciu, be jokiu AI kvietimu.
    function explainRejection(l) {
      const reasons = [];
      if (!l.kaina) {
        reasons.push('Skelbime nenurodyta aiški kaina – negalima patikimai palyginti su rinka.');
      } else if (l.marketCount < 3) {
        reasons.push(`Per mažai panašių skelbimų (rasta tik ${l.marketCount}) šiam modeliui – neužtenka patikimam rinkos vidurkiui.`);
      } else if (l.diffPct < 0) {
        reasons.push(`Kaina ${Math.abs(l.diffPct)}% AUKŠTESNĖ nei rinkos vidurkis (${l.marketMedian}€) – brangiau nei įprasta.`);
      } else if (l.diffPct < THRESHOLD_PCT) {
        reasons.push(`Kaina tik ${l.diffPct}% žemesnė nei rinkos vidurkis (${l.marketMedian}€) – reikia bent ${THRESHOLD_PCT}%, kad patektų į "vertus dėmesio".`);
      } else if (!candidateUrls.has(l.url)) {
        reasons.push(`Nuolaida ${l.diffPct}% atitiko ribą, bet kokybės balas žemesnis nei kitų TOP 15 pasiūlymų šioje paieškoje.`);
      }
      if (l.ridaDiffPct !== null && l.ridaDiffPct >= 30) {
        reasons.push(`Rida ${l.ridaDiffPct}% aukštesnė nei imties vidurkis (${l.ridaMedian} km) – daugiau nusidėvėjimo.`);
      }
      if (l.galimiDefektai && l.galimiDefektai.length > 0) {
        reasons.push(`Skelbime paminėti galimi defektai: ${l.galimiDefektai.join(', ')}.`);
      }
      if (!l.turiIstorijosAtaskaita && !l.turiGarantija && !l.yraVerslas) {
        reasons.push('Nėra istorijos ataskaitos, garantijos ar verslo pardavėjo signalo – "aklas" pirkimas.');
      }
      return reasons.slice(0, 3);
    }

    logJob(jobId, `🤖 Claude apmąsto ${candidates.length} geriausius pasiūlymus (lygiagrečiai)...`);
    await Promise.all(candidates.map(async (c, i) => {
      const pct = Math.round(((i + 1) / candidates.length) * 100);
      const commentKey = `${c.url}::${c.kaina}::${c.diffPct}`;
      const cachedComment = cache.getCached('shortComment', commentKey, cache.PAGE_TTL_MS);
      if (cachedComment) {
        logJob(jobId, `   ✅ ${c.source} ${c.modelis} ${c.kaina}€ (talpykla)`);
        c.comment = cachedComment;
      } else {
        c.comment = await generateShortComment(c, c.diffPct);
        cache.setCached('shortComment', commentKey, c.comment);
        logJob(jobId, `   ✅ ${c.source} ${c.modelis} ${c.kaina}€`);
      }
    }));

    // TOP 5 geriausius (pagal kokybes balo rikiavima) is karto isanalizuojame issamiai -
    // vartotojui nereikia paspausti mygtuko, kad matytu pilna vaizda geriausiems variantams.
    // Visi TOP 5 analizuojami LYGIAGRECIAI (ne vienas po kito) - tai ilgiausiai trunkantis
    // zingsnis (web paieska kiekvienam), tad lygiagretumas duoda didziausia pagreitejima.
    const TOP_N_DEEP = 5;
    const topSlice = candidates.slice(0, TOP_N_DEEP);
    logJob(jobId, `🔬 Ruošiame detalią apžvalgą TOP ${topSlice.length} pasiūlymams (lygiagrečiai)...`);
    await Promise.all(topSlice.map(async (c, i) => {
      const label = `[${i + 1}/${TOP_N_DEEP}] ${c.modelis} ${c.kaina}€`;
      try {
        const cachedDeep = cache.getCached('analysis', c.url, cache.ANALYSIS_TTL_MS);
        if (cachedDeep) {
          logJob(jobId, `   ✅ ${label} - rasta talpykloje`);
          c.deepAnalysis = cachedDeep.analysis;
          c.vin = cachedDeep.vin;
          c.pardavejas = cachedDeep.pardavejas;
          c.photos = cachedDeep.photos;
        } else {
          const stopFake = startFakeProgress(jobId, [
            `   🔍 ${label} - skaitau pilną skelbimo aprašymą...`,
            `   🔧 ${label} - renku techninę specifikaciją...`,
            `   💰 ${label} - vertinu pelno potencialą...`,
            `   🔑 ${label} - renku VIN ir pardavėjo duomenis...`,
            `   ⚖️ ${label} - sudarau privalumų/rizikų sąrašą...`,
          ]);
          try {
            const { title, fullText, photo: detailPhoto, photos: detailPhotos, vin, pardavejas } = await scrapeSingleListing(c.url);
            const marketContext = { kaina: c.kaina, marketMedian: c.marketMedian, marketCount: c.marketCount, diffPct: c.diffPct, modelis: c.modelis, galia: c.galia, variklioTuris: c.variklioTuris };
            const analysis = await generateDeepAnalysis(title, fullText, detailPhotos, marketContext);
            c.deepAnalysis = analysis;
            c.vin = vin;
            c.pardavejas = pardavejas || c.pardavejas;
            c.photos = detailPhotos;
            cache.setCached('analysis', c.url, { title, photo: detailPhoto, photos: detailPhotos, analysis, vin, pardavejas });
          } finally {
            stopFake();
          }
          logJob(jobId, `   ✅ ${label} - apžvalga paruošta`);
        }
      } catch (err) {
        logJob(jobId, `   ⚠ Nepavyko atlikti detalios apžvalgos: ${err.message}`);
      }
    }));

    logJob(jobId, '🎉 Baigta!');
    jobs[jobId].status = 'done';
    // Visi nuskaityti skelbimai (ne tik "verti demesio") - kad vartotojas galetu pats pasiziureti.
    const allListings = enriched.map((l) => ({
      modelis: l.modelis, kaina: l.kaina, metai: l.metai, rida: l.rida,
      kuras: l.kuras, pavarai: l.pavarai, turiVin: l.turiVin, galia: l.galia, variklioTuris: l.variklioTuris,
      photo: l.photo, url: l.url, source: l.source, kryzminiaiSkelbimai: l.kryzminiaiSkelbimai || null,
      isCandidate: candidateUrls.has(l.url), pardavejas: l.pardavejas || null,
      rejectionReasons: candidateUrls.has(l.url) ? [] : explainRejection(l),
      diffPct: l.diffPct, marketMedian: l.marketMedian, marketCount: l.marketCount,
    })).sort((a, b) => (a.kaina || 0) - (b.kaina || 0));

    const searchResult = { totalScanned: parsed.length, rawFoundCount, medians, candidates, allListings };
    cache.setSearchCached(filterHash, searchResult);
    jobs[jobId].result = searchResult;
  } catch (err) {
    console.error(err);
    logJob(jobId, `❌ Klaida: ${err.message}`);
    jobs[jobId].status = 'error';
    jobs[jobId].error = err.message;
  }
}

// ============ DETALI VIENO SKELBIMO ANALIZE ============

// Pasalina finansavimo skaiciuokles "triuksma" (pasikartojancius menesiu pasirinkimus,
// paskolos salygu tekstus), kuris uzima daug vietos ir stumia realiai svarbu turini toliau.
function cleanFinancingNoise(text) {
  return text
    .replace(/(?:\d+\s*mėn\.\s*){4,}/gi, ' ')
    .replace(/Pasirinkite paskolos sumą:?/gi, '')
    .replace(/Pasirinkite mėnesio įmoką:?/gi, '')
    .replace(/Gaukite paskolos pasiūlymą\s*(Atsakymas iš karto)?/gi, '')
    .replace(/Su likutine verte/gi, '')
    .replace(/0% pradinis įnašas/gi, '')
    .replace(/Nereikia įkeisti automobilio/gi, '')
    .replace(/Nebūtinas KASKO draudimas/gi, '')
    .replace(/Norėdami įsigyti automobilį išsimokėtinai[^.]*\./gi, '')
    .replace(/Galite grąžinti anksčiau nei paskolos terminas[^.]*\./gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function scrapeSingleListing(url) {
  const html = await fetchListingPage(url);
  const $ = cheerio.load(html);

  // Meta zymos (keywords/description) DAZNAI jau turi svaru, struktura faktu santrauka
  // (Pirma registracija, Rida, Variklis, Defektai ir t.t.) - be lizingo triuksmo.
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
  const metaDescription = $('meta[name="description"]').attr('content') || '';

  $('script, style, nav, footer, header, iframe, noscript').remove();
  const title = $('h1').first().text().replace(/\s+/g, ' ').trim();
  let bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  bodyText = cleanFinancingNoise(bodyText).slice(0, 12000);

  const fullText = [
    metaKeywords ? `[STRUKTŪRIZUOTI FAKTAI IŠ SKELBIMO]: ${metaKeywords}` : '',
    metaDescription ? `[SKELBIMO SANTRAUKA]: ${metaDescription}` : '',
    `[PILNAS PUSLAPIO TEKSTAS]: ${bodyText}`,
  ].filter(Boolean).join('\n\n');

  const NON_CAR_IMAGE_KEYWORDS = ['logo', 'avatar', 'icon', 'placeholder', 'map', 'pin', 'default', 'staticmap', 'sprite', 'banner', 'ad-', '/ads/'];
  const CAR_CDN_PATTERNS = ['img.autogidas.lt', 'autogidas.lt', 'autoplius-img', 'autoplius.lt', 'pictures.autoscout24.net', 'ireland.apollo.olxcdn', 'otomoto', 'img-sc24', 'static.autogidas', 'cf.autogidas', 'carsdata', 'img.gumtree', 'cars.img'];
  const SELLER_INFO_SELECTOR = '[class*="seller" i], [class*="dealer" i], [class*="partner" i], [class*="advertiser" i], [class*="agent" i], [class*="contact" i], [class*="profile" i]';

  function isCarCdnUrl(src) {
    if (!src) return false;
    const s = src.toLowerCase();
    return CAR_CDN_PATTERNS.some((p) => s.includes(p));
  }

  const photosSet = new Set();

  // 1. img tagai - tikriname src, data-src, data-lazy-src, data-original, data-large-src
  const IMG_ATTRS = ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-large-src', 'data-image', 'data-zoom-image', 'data-full', 'data-hi-res'];
  $('img, source').each(function () {
    const el = $(this);
    if (el.closest(SELLER_INFO_SELECTOR).length > 0) return;
    const w = parseInt(el.attr('width'), 10);
    const h = parseInt(el.attr('height'), 10);
    if (w && h && Math.abs(w - h) < 10 && w < 160) return; // maža ikona
    for (const attr of IMG_ATTRS) {
      const val = el.attr(attr) || '';
      if (isCarCdnUrl(val) && !NON_CAR_IMAGE_KEYWORDS.some((kw) => val.toLowerCase().includes(kw))) {
        photosSet.add(val.split('?')[0]); // be query params
      }
    }
  });

  // 2. JSON-LD structured data (dazniausiai turi pilna nuotrauku sarasa)
  $('script[type="application/ld+json"]').each(function () {
    try {
      const data = JSON.parse($(this).html());
      const imgs = data.image || data.photo || (data['@graph'] && data['@graph'].flatMap((g) => g.image || g.photo || [])) || [];
      const arr = Array.isArray(imgs) ? imgs : [imgs];
      arr.forEach((img) => {
        const url = typeof img === 'string' ? img : (img && img.url);
        if (url && isCarCdnUrl(url) && !NON_CAR_IMAGE_KEYWORDS.some((kw) => url.toLowerCase().includes(kw))) {
          photosSet.add(url.split('?')[0]);
        }
      });
    } catch {}
  });

  // 3. __NEXT_DATA__ (autoscout24, otomoto - Next.js SSR, cia pilna galerija)
  const nextDataEl = $('#__NEXT_DATA__');
  if (nextDataEl.length) {
    try {
      const nextData = JSON.parse(nextDataEl.html());
      // Autoscout24: props.pageProps.listingDetails.images[]
      const as24imgs = (nextData.props && nextData.props.pageProps && nextData.props.pageProps.listingDetails && nextData.props.pageProps.listingDetails.images) || [];
      as24imgs.forEach((img) => {
        const u = (typeof img === 'string' ? img : (img && (img.src || img.url || img.uri || '')));
        if (u && isCarCdnUrl(u)) photosSet.add(u.split('?')[0]);
      });
      // Otomoto: urqlState -> advertDetails -> photos[]
      const urqlState = (nextData.props && nextData.props.pageProps && nextData.props.pageProps.urqlState) || {};
      for (const key of Object.keys(urqlState)) {
        try {
          const entry = urqlState[key];
          const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
          const advert = d && (d.advert || d.advertDetails || (d.advertSearch && d.advertSearch.edges && d.advertSearch.edges[0] && d.advertSearch.edges[0].node));
          const photosArr = (advert && (advert.photos || advert.images || advert.gallery)) || [];
          photosArr.forEach((p) => {
            const u = typeof p === 'string' ? p : (p && (p.url || p.large || p.src || ''));
            if (u) photosSet.add(u.split('?')[0]);
          });
        } catch {}
      }
    } catch {}
  }

  // 4. Inline script'ai - ieskome masyvų su CDN URL (autogidas.lt naudoja JS galeriją)
  if (photosSet.size < 3) {
    $('script:not([src])').each(function () {
      const txt = $(this).html() || '';
      const matches = txt.match(/["'](https?:\/\/[^"']*(?:img\.autogidas\.lt|autoplius-img|pictures\.autoscout24\.net|ireland\.apollo\.olxcdn|otomoto)[^"']*\.(jpe?g|png|webp)[^"']*)/gi) || [];
      matches.forEach((m) => {
        const u = m.replace(/^["']|["']$/g, '').split('?')[0];
        if (!NON_CAR_IMAGE_KEYWORDS.some((kw) => u.toLowerCase().includes(kw))) photosSet.add(u);
      });
    });
  }

  const photos = [...photosSet].slice(0, 15);
  const photo = photos[0] || null;

  // VIN kodas - standartinis formatas: 17 simboliu, be I/O/Q raidziu. Isskiriame atskirai,
  // kad garantuotai rodytume ji vartotojui, net jei AI savo atsakyme jo nepamintu tiksliai.
  const vinMatch = fullText.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  const vin = vinMatch ? vinMatch[0] : null;

  // Pardavejo/dilerio pavadinimas - dazniausiai eina tiesiai pries "Tapatybe patvirtinta"
  // zyma (verslo pardavejams), pvz "AK AUTO Tapatybe patvirtinta" arba "MOLLER AUTO... Tapatybe patvirtinta".
  const sellerMatch = fullText.match(/([A-ZŠČŽĄĘĖĮŲŪ][A-Za-zŠčČžŽąĄęĘėĖįĮųŲūŪ0-9\s,.\-]{2,60}?)\s*Tapatybė patvirtinta/);
  const pardavejas = sellerMatch ? sellerMatch[1].trim() : null;

  return { title, fullText, photo, photos, vin, pardavejas };
}

// ============ VIN ISTORIJOS PAIESKA INTERNETE ============
// VIN kodas yra vieso pobudzio transporto priemones identifikatorius (ne asmens duomenys) -
// jo paieska viesai prieinamuose JAV aukcionu/istorijos puslapiuose yra teisota ir naudinga,
// ypac kai automobilis pazymetas kaip dauztas/importuotas is JAV.
// ============ PARDAVEJO/DILERIO INFORMACIJOS PAIESKA ============
// Imones pavadinimas ir vieai prieinama registro/atsiliepimu informacija (pvz. rekvizitai.vz.lt)
// yra viesi verslo duomenys - naudinga patikrinti dilerio patikimuma pries perkant.
async function searchSellerInfo(pardavejas, listingUrl) {
  const isInternational = listingUrl && (
    listingUrl.includes('autoscout24') || listingUrl.includes('otomoto.pl') ||
    listingUrl.includes('mobile.de') || listingUrl.includes('olx.pl')
  );
  const prompt = isInternational
    ? `Search the web for information about this car dealer/company: "${pardavejas}"

Search Google, TrustPilot, AutoScout24 dealer reviews, and any country-specific business registry.
Look for: company address and location, how long they have been in business, customer reviews and reputation, any complaints or disputes.

Return ONLY JSON (no markdown):
{
  "rasta": true/false,
  "imones_pavadinimas": "full official company name if found, or null",
  "veiklos_trukme": "since when they operate, or null",
  "atsiliepimu_santrauka": "summary of reviews/reputation (include rating if found), or null",
  "ispejimai": "if negative reviews/complaints/disputes found - briefly, or null",
  "nuoroda": "URL to review page or registry if found, or null"
}`
    : `Atlik web paieska apie si automobiliu pardavimo diler/imone Lietuvoje: "${pardavejas}"

Ieskok viesai prieinamos informacijos: imones registro duomenu (pvz. rekvizitai.vz.lt,
rekvizitai.lt), veiklos trukmes, atsiliepimu/reputacijos, ar buvo teistu gincu ar
skundu, finansiniu rodikliu jei viesai prieinami.

Grazink TIK JSON (be markdown):
{
  "rasta": true/false,
  "imones_pavadinimas": "pilnas oficialus pavadinimas jei rastas, arba null",
  "veiklos_trukme": "nuo kada veikia, arba null",
  "atsiliepimu_santrauka": "bendras atsiliepimu/reputacijos vaizdas, arba null",
  "ispejimai": "jei rasta neigiamu atsiliepimu/skundu/gincu - trumpai, arba null",
  "nuoroda": "URL i registro/atsiliepimu puslapi jei radai, arba null"
}`;
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
    messages: [{ role: 'user', content: prompt }],
  });
  const rawText = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    return { rasta: false, imones_pavadinimas: null, veiklos_trukme: null, atsiliepimu_santrauka: null, ispejimai: null, nuoroda: null };
  }
}

async function searchVinHistory(vin) {
  const prompt = `Atlik web paieska del sio automobilio VIN kodo: ${vin}

Ieskok viesai prieinamos informacijos apie sio konkretaus VIN automobili JAV aukcionu
svetainese (Copart, IAAI, Bidmotors, Salvage Bid, ir panasiuose), automobiliu istorijos
patikros puslapiuose - zalos apraso, aukciono pardavimo kainos, busenos, papildomu nuotrauku.

Grazink TIK JSON (be markdown):
{
  "rasta": true/false,
  "saltinis": "svetaines pavadinimas jei rasta, arba null",
  "zalos_aprasas": "kas rasta apie zala/busena is saltinio, arba null",
  "aukciono_kaina": "kaina jei rasta (su valiuta), arba null",
  "papildoma_info": "kita svarbi info - vieta, pardavejo tipas, data - arba null",
  "nuoroda": "URL i konkretu puslapi jei radai, arba null"
}`;
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
    messages: [{ role: 'user', content: prompt }],
  });
  const rawText = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    return { rasta: false, saltinis: null, zalos_aprasas: null, aukciono_kaina: null, papildoma_info: null, nuoroda: null };
  }
}

// Parsisiuncia nuotrauka ir paverciam base64, kad galetume ja prisegti prie Claude
// pranesimo (vaizdo analizei). Klaidos atveju grazina null - viena nepavykusi
// nuotrauka neturi sutrukdyti visos analizes.
async function downloadImageAsBase64(url) {
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const contentType = (resp.headers['content-type'] || 'image/jpeg').split(';')[0];
    if (!contentType.startsWith('image/')) return null;
    return { data: Buffer.from(resp.data).toString('base64'), media_type: contentType };
  } catch {
    return null;
  }
}

async function generateDeepAnalysis(title, fullText, photos, marketContext) {
  // Siunčiame iki 12 nuotraukų AI - vizuali automobilio būklės analizė visada naudinga.
  let imageBlocks = [];
  if (photos && photos.length > 0) {
    const downloaded = await Promise.all(photos.slice(0, 12).map(downloadImageAsBase64));
    imageBlocks = downloaded.filter(Boolean).map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.media_type, data: img.data },
    }));
  }

  const photoInstructions = imageBlocks.length > 0
    ? `\n\nPRIE SIO PRANESIMO PRISEGTOS ${imageBlocks.length} SKELBIMO NUOTRAUKOS. ATIDZIAI
PERZIUREK visas nuotraukas ir "nuotrauku_pastebejimai" lauke apraszyk: bendra automobilio
bukle (puiki/gera/vidutine/prasta), spalva, matomas detales ir SVARBIAUSIA - ar matomos
kokios zalos (subraizymai, iprovimai, korozija, nelygu lakaviams, neatitinkancios tarpes tarp
detaliu, sulauzyta plastika, sudauzyta bamperiai/zibintai ir pan.). Remkis TIK tuo, ka tikrai
matai nuotraukose. Jei zalos nepastebi, aprasyk bendra gera bukle.`
    : '';

  const engineNote = marketContext && (marketContext.galia || marketContext.variklioTuris)
    ? ` Sio konkretaus automobilio variklis: ${marketContext.variklioTuris ? marketContext.variklioTuris + 'L' : ''}${marketContext.galia ? ' ' + marketContext.galia + 'kW' : ''} - SVARBU: rinkos vidurkis skaiciuotas VISIEMS to modelio variantams kartu, o galingesni/silpnesni varikliai realiai kainuoja skirtingai (galingesnis = brangesnis). Atsizvelk i tai vertindamas, ar si kaina tikrai zema/auksta KONKRECIAM variantui, ne tik modeliui bendrai.`
    : '';
  const marketContextText = marketContext && marketContext.marketMedian
    ? `\n\nRINKOS DUOMENYS (musu sistemos apskaiciuoti, PATIKIMI): sio skelbimo kaina ${marketContext.kaina}€,
${marketContext.modelis || 'sio modelio'} rinkos vidurkis ${marketContext.marketMedian}€ (remiantis ${marketContext.marketCount || '?'} panasiu skelbimu imtimi),
t.y. si kaina yra ${marketContext.diffPct}% ${marketContext.diffPct >= 0 ? 'ZEMESNE' : 'AUKSTESNE'} nei vidurkis.${engineNote}`
    : '\n\nRinkos vidurkio duomenu sitam skelbimui neturime - jei reikia, remkis bendromis ziniomis/web paieska apie tipine sio modelio/metu kaina.';

  const prompt = `Automobilio skelbimo puslapio turinys:
Pavadinimas: ${title}
Turinys: ${fullText}
${marketContextText}

Tu esi automobiliu pirkimo ekspertas, dirbantis flipping/perpardavimo verslui. Isanalizuok
si skelbima ISSAMIAI remdamasis TIK sitame tekste esancia informacija - NEISGALVOK faktu,
kuriu tekste nera. Jei tekste yra "[STRUKTŪRIZUOTI FAKTAI IŠ SKELBIMO]" blokas - tai
PATIKIMIAUSIAS saltinis technine specifikacijai (variklis, kW, rida, defektai ir t.t.),
naudok ji pirmiausia. "[PILNAS PUSLAPIO TEKSTAS]" duoda papildoma konteksta (aprasyma,
irangos sarasa, pardavejo info) - PANAUDOK VISA sia informacija, ne tik pirmus sakinius.
Jei skelbime nurodyta konkreti verta irangos (oda, navigacija, kamera, sildomos
sedynes ir pan.), TAI paminek kaip privaluma su konkreciais pavadinimais, ne bendrai.
SVARBU - FINANSINIAI ASPEKTAI: jei tekste yra paminetas GALIMAS PVM SUSIGRAZINIMAS
(pvz. "PVM susigrazinimas", "galima susigrazinti PVM", "pirkti ant imones" ir panasios
fraze) - TAI BUTINAI paminek "privalumai" sarase KAIP ATSKIRA PUNKTA, net jei del to
reiketu praleisti kita, maziau svarbu punkta - tai reali finansine nauda verslo pirkejui
(gali reiksti apie 21% efektyvia nuolaida), ir niekada neturi buti praleista.
${photoInstructions}

PAPILDOMA UZDUOTIS - PELNO POTENCIALO VERTINIMAS ("perikupo_radaras" lauke):
Ivertink, AR VERTA si automobili PIRKTI SIA KAINA IR PERPARDUOTI SU PELNU - galimai
po smulkaus remonto/tvarkymo, valymo, ar tiesiog gerensniu nuotrauku ir teisingesnio
pateikimo. Atsizvelk i: kainos skirtuma nuo rinkos vidurkio, aprasytus/matomus defektus
ir jų tikėtiną tvarkymo kaina, papildomas islaidas (PVM, muitas, transportavimas, jei
JAV/aukciono kilmes), ir REALU galima pardavimo kainos intervala PO sutvarkymo (remkis
rinkos vidurkiu tam modeliui). Buk ATSARGUS ir REALISTISKAS - jei rizika (nezinoma zala,
JAV kilme be VIN, trukstama istorija) yra didele, tai MAZINA pelno potenciala, nesvarbu
koks kainos skirtumas nuo vidurkio.

Jei manai, kad naudinga, GALI atlikti web paieska del zinomu sio modelio/metu/varianto
gedimu ar tipiniu problemu.

Grazink TIK JSON (be markdown), sia struktura. "privalumai"/"rizikos" ir kt. sarasuose
MAKSIMUM 4 punktai, kiekvienas punktas trumpas (max 15 zodziu). SVARBU DEL JSON FORMATO:
jei tekste reikia cituoti kokia fraze ar terminą, naudok VIENGUBAS kabutes (') arba
lietuviskas kabutes („ ") vietoj dvigubu ("), nes dvigubos kabutes teksto viduje sugadina
JSON struktura ir sukelia klaida:
{
  "verdiktas": "1-2 sakiniai bendra isvada",
  "technine_specifikacija": "trumpai: variklis (l/kW), pavaru deze, kebulas - is teksto, arba null jei nera",
  "irangos_akcentai": ["konkretus vertingas irangos punktas is teksto, pvz. 'Oda salonas'", "..."],
  "privalumai": ["konkretus privalumas is teksto", "..."],
  "rizikos": ["konkreti rizika/nezinomas dalykas", "..."],
  "ka_patikrinti_gyvai": ["konkretus patikrinimo punktas", "..."],
  "klausimai_pardavejui": ["konkretus klausimas", "..."],
  "derybu_patarimas": "1-2 sakiniai, kaip derėtis del kainos remiantis rastais trukumais",
  "perikupo_radaras": {
    "pelno_potencialas": "aukstas" arba "vidutinis" arba "zemas" arba "neverta",
    "procentas": skaicius 0-100 (grubus bendras pelno potencialo ivertinimas),
    "paaiskinimas": "1-2 sakiniai kodel toks vertinimas",
    "numatoma_investicija": "apytiksle suma remontui/tvarkymui, arba null jei nera pagrindo vertinti",
    "numatomas_pardavimo_diapazonas": "apytikslis € intervalas PO sutvarkymo, arba null"
  },
  "nuotrauku_pastebejimai": ${imageBlocks.length > 0 ? '["konkretus matomas pazeidimas nuotraukoje", "..."] (arba ["Nuotraukose akivaizdzios zalos nepastebeta"] jei nieko nerandi)' : 'null'}
}`;

  const messageContent = imageBlocks.length > 0
    ? [{ type: 'text', text: prompt }, ...imageBlocks]
    : prompt;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: imageBlocks.length > 0 ? 4500 : 3800,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
    messages: [{ role: 'user', content: messageContent }],
  });
  const rawText = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(match ? match[0] : cleaned);
  } catch (err) {
    console.error('generateDeepAnalysis JSON klaida, stop_reason:', response.stop_reason, 'ilgis:', rawText.length, 'nuotrauku:', imageBlocks.length);
    // Atsarginis planas - be web paieskos, be nuotrauku instrukciju (jos butu klaidinancios,
    // nes siame bandyme nuotraukos NEsiuciamos), trumpesnis atsakymas, mazesne tikimybe nutrukti
    try {
      const retryPrompt = prompt
        .replace(photoInstructions, '')
        .replace(/,\s*\n\s*"nuotrauku_pastebejimai":[^\n]*\n?/, '\n');
      const retryResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2600,
        messages: [{ role: 'user', content: retryPrompt }],
      });
      const retryText = retryResponse.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const retryCleaned = retryText.replace(/```json|```/g, '').trim();
      const retryMatch = retryCleaned.match(/\{[\s\S]*\}/);
      return JSON.parse(retryMatch ? retryMatch[0] : retryCleaned);
    } catch (retryErr) {
      console.error('generateDeepAnalysis atsarginis bandymas irgi nepavyko:', retryErr.message);
      // Niekada nemetame klaidos toliau - grazinam minimalu, bet valida objekta,
      // kad visas paieskos procesas netruktu del vieno nepavykusio skelbimo.
      return {
        verdiktas: 'Automatinė analizė nepavyko šiam skelbimui - patikrinkite jį rankiniu būdu paspaudę "Žiūrėti skelbimą".',
        technine_specifikacija: null,
        irangos_akcentai: [],
        privalumai: [],
        rizikos: [],
        ka_patikrinti_gyvai: [],
        klausimai_pardavejui: [],
        derybu_patarimas: null,
        perikupo_radaras: null,
        nuotrauku_pastebejimai: null,
      };
    }
  }
}

// ============ API ============

app.post('/api/search-start', (req, res) => {
  const jobId = newJob();
  runSearchJob(jobId, req.body);
  res.json({ jobId });
});

app.get('/api/search-status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Nerasta' });
  res.json(job);
});

app.post('/api/analyze-single', async (req, res) => {
  try {
    const { url, force, kaina, marketMedian, marketCount, diffPct, modelis, pardavejas: knownPardavejas, galia, variklioTuris } = req.body;
    if (!url) return res.status(400).json({ error: 'Trūksta URL' });

    if (!force) {
      const cached = cache.getCached('analysis', url, cache.ANALYSIS_TTL_MS);
      if (cached) {
        const ageMin = cache.cacheAgeMinutes('analysis', url);
        return res.json({ ...cached, cached: true, cacheAgeMinutes: ageMin });
      }
    }

    const { title, fullText, photo, photos, vin, pardavejas } = await scrapeSingleListing(url);
    const marketContext = marketMedian ? { kaina, marketMedian, marketCount, diffPct, modelis, galia, variklioTuris } : null;
    const analysis = await generateDeepAnalysis(title, fullText, photos, marketContext);
    const result = { title, photo, photos, analysis, vin, pardavejas: pardavejas || knownPardavejas || null };
    cache.setCached('analysis', url, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vin-lookup', async (req, res) => {
  try {
    const { vin, force } = req.body;
    if (!vin || vin.length !== 17) return res.status(400).json({ error: 'Neteisingas VIN kodas (turi būti 17 simbolių)' });

    if (!force) {
      const cached = cache.getCached('vin', vin, cache.ANALYSIS_TTL_MS);
      if (cached) {
        const ageMin = cache.cacheAgeMinutes('vin', vin);
        return res.json({ ...cached, cached: true, cacheAgeMinutes: ageMin });
      }
    }

    const result = await searchVinHistory(vin);
    cache.setCached('vin', vin, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seller-lookup', async (req, res) => {
  try {
    const { pardavejas, force, listingUrl } = req.body;
    if (!pardavejas) return res.status(400).json({ error: 'Trūksta pardavėjo pavadinimo' });

    if (!force) {
      const cached = cache.getCached('seller', pardavejas, cache.ANALYSIS_TTL_MS);
      if (cached) {
        const ageMin = cache.cacheAgeMinutes('seller', pardavejas);
        return res.json({ ...cached, cached: true, cacheAgeMinutes: ageMin });
      }
    }

    const result = await searchSellerInfo(pardavejas, listingUrl);
    cache.setCached('seller', pardavejas, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ FAVORITU BUSENOS TIKRINIMAS ============
// Pakartotinai nuskaito skelbimo puslapi, kad patikrintu, ar kaina pasikeite,
// ar skelbimas rezervuotas, ar visai pasalintas (parduotas/nebeegzistuoja).
async function checkFavoriteStatus(url) {
  try {
    const html = await fetchSearchPage(url);
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, iframe, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const topText = bodyText.slice(0, 1500);

    if (/skelbimas (nerastas|nebeaktyvus)|puslapis nerastas|straipsnis nerastas|404/i.test(topText)) {
      return { status: 'removed' };
    }
    const isReserved = /rezervuota/i.test(topText);
    const priceMatch = bodyText.match(/(\d[\d\s]{2,7})\s?€/);
    const currentPrice = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : null;
    if (!currentPrice) {
      return { status: 'removed' };
    }
    return { status: isReserved ? 'reserved' : 'active', currentPrice };
  } catch (err) {
    return { status: 'removed' };
  }
}

app.post('/api/check-favorite', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Trūksta URL' });
    const result = await checkFavoriteStatus(url);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Car Triage App veikia: http://localhost:${PORT}`));
