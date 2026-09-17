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
const { requireAuth, handleRegister, handleLogin, handleMe } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Auth endpoints ────────────────────────────────────────────────────────
app.post('/auth/register', handleRegister);
app.post('/auth/login', handleLogin);
app.get('/auth/me', requireAuth, handleMe);

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
  const needsRender = /otomoto\.pl|autoscout24\./i.test(url);
  if (SCRAPER_KEY) {
    try {
      const renderParam = needsRender ? 'true' : 'false';
      const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}&render=${renderParam}`;
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

// Ar skelbimo kuras atitinka vartotojo pasirinkta filtra.
// Filtro reiksmes ateina is frontend'o: dyzelis | benzinas | hibridas | elektra.
// Skelbimuose kuras buna ivairiu formu: "Dyzelinas", "Benzinas / elektra", "Hibridas", "Elektra"...
function kurasAtitinka(kuras, filtras) {
  if (!filtras) return true;
  if (!kuras) return true; // nezinomas kuras - nefiltruojam, kad neismestume gero skelbimo
  const k = String(kuras).toLowerCase();
  if (filtras === 'dyzelis')  return k.includes('dyzelin');
  if (filtras === 'benzinas') return k.includes('benzin');
  if (filtras === 'hibridas') return k.includes('hibrid') || (k.includes('elektra') && (k.includes('benzin') || k.includes('dyzelin')));
  if (filtras === 'elektra')  return k === 'elektra' || k.includes('elektrin');
  return true;
}

// ============ URL SUDARYMAS PAGAL FILTRUS ============

// Autoplius kuro ID (patikrinta gyvai paieskos formoje):
const AUTOPLIUS_FUEL_IDS = {
  benzinas: [30, 36, 31],       // Benzinas, Benzinas/elektra, Benzinas/dujos
  dyzelis: [32, 17378],         // Dyzelinas, Dyzelinas/elektra
  hibridas: [36, 17378],        // Benzinas/elektra, Dyzelinas/elektra
  elektra: [35],                // Elektra
};

function buildAutopliusUrl(filters) {
  const q = encodeURIComponent(`${filters.marke || ''} ${filters.modelis || ''}`.trim());
  let url = `https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2`;
  if (q) url += `&qt=${q}`;
  if (filters.metaiNuo) url += `&make_date_from=${filters.metaiNuo}`;
  if (filters.metaiIki) url += `&make_date_to=${filters.metaiIki}`;
  // DEMESIO: autoplius neturi price_from/price_to - teisingi laukai yra sell_price_*.
  // Su neteisingais pavadinimais kainos filtras buvo tyliai ignoruojamas.
  if (filters.kainaNuo) url += `&sell_price_from=${filters.kainaNuo}`;
  if (filters.kainaIki) url += `&sell_price_to=${filters.kainaIki}`;
  if (filters.ridaIki) url += `&kilometrage_to=${filters.ridaIki}`;
  if (filters.pavaru_deze === 'Automatinė') url += `&gearbox_id=38`;
  if (filters.pavaru_deze === 'Mechaninė') url += `&gearbox_id=37`;
  const fuelIds = AUTOPLIUS_FUEL_IDS[filters.kuras];
  if (fuelIds) fuelIds.forEach((id) => { url += `&fuel_id%5B${id}%5D=${id}`; });
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

app.post('/api/quick-count', requireAuth, async (req, res) => {
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
// mode: 'reseller' | 'personal' | 'browse'
// ============ CARTRIIGE TRIAGE ENGINE ============
// Tikslas: ne grazinti skelbimus, atitinkancius filtrus, o ivertinti kiekviena
// skelbima rinkos kontekste ir pasakyti, kuris vertas demesio ir KODEL.
//
// Kiekvienas komponentas grazina 0..100 arba null, kai duomenu tiesiog nera.
// Null komponento svoris perskirstomas likusiems (o ne skaiciuojamas kaip nulis),
// todel skelbimas nebaudziamas uz tai, ko portale nera. Kiek balo remiasi
// tikrais duomenimis, parodo atskiras DATA CONFIDENCE komponentas.

const TRIAGE_WEIGHTS = {
  // Numatytieji svoriai (is viso 100)
  default:  { price: 30, mileage: 15, condition: 20, history: 10, equipment: 10, seller: 5, demand: 5, listing: 5 },
  browse:   { price: 30, mileage: 15, condition: 20, history: 10, equipment: 10, seller: 5, demand: 5, listing: 5 },
  // Perpardavejui svarbiausia marza, suvaldoma rizika ir kaip greitai parduosi
  reseller: { price: 40, mileage: 15, condition: 18, history: 7, equipment: 5, seller: 5, demand: 7, listing: 3 },
  // Sau perkant svarbiausia bukle, rida ir istorija, o ne didziausia nuolaida
  personal: { price: 18, mileage: 18, condition: 25, history: 15, equipment: 12, seller: 6, demand: 3, listing: 3 },
};

const TRIAGE_LEVELS = [
  { min: 85, key: 'top',      label: 'TOP GALIMYBĖ',           color: '#7fd88f', bg: '#2d4a35' },
  { min: 75, key: 'strong',   label: 'LABAI VERTA ANALIZUOTI', color: '#a8d88f', bg: '#2f452e' },
  { min: 65, key: 'good',     label: 'VERTA ANALIZUOTI',       color: '#cfd88f', bg: '#41442b' },
  { min: 55, key: 'check',    label: 'REIKIA PATIKRINTI',      color: '#f0c674', bg: '#4a3b2d' },
  { min: 45, key: 'weak',     label: 'SILPNESNIS PASIŪLYMAS',  color: '#e0a06a', bg: '#4a352a' },
  { min: 0,  key: 'rejected', label: 'ATMESTI',                color: '#e07a6a', bg: '#4a2d2d' },
];

function triageLevel(score) {
  return TRIAGE_LEVELS.find((t) => score >= t.min) || TRIAGE_LEVELS[TRIAGE_LEVELS.length - 1];
}

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));

// --- 1. PRICE VS MARKET (25%) ---
// Nuolaida verciama i skale taip, kad ITARTINAI didele nuolaida bala MAZINTU:
// -30% brangiau -> 0, rinkos kaina -> 40, -20% pigiau -> ~92, -45% pigiau -> ~45.
function scorePrice(l) {
  if (l.diffPct === null || l.diffPct === undefined) return null;
  if (!l.marketCount || l.marketCount < 3) return null; // nepatikima rinka - komponento nenaudojam
  const d = l.diffPct;
  let s;
  if (d <= -25) s = 5;
  else if (d < 0) s = 5 + (d + 25) * (40 / 25);        // -25..0  -> 5..45
  else if (d <= 10) s = 45 + d * 2.8;                   // 0..10   -> 45..73
  else if (d <= 18) s = 73 + (d - 10) * 2.1;            // 10..18  -> 73..90  (sveikas sandoris)
  else if (d <= 25) s = 90 + (d - 18) * 0.29;           // 18..25  -> 90..92  (pikas)
  // Nuo ~25% prasideda itarimu zona: tokia nuolaida trejus metus turinciam
  // automobiliui daznai reiskia zala, aukciona arba nutyleta informacija.
  else if (d <= 35) s = 92 - (d - 25) * 2.4;            // 25..35  -> 92..68
  else if (d <= 50) s = 68 - (d - 35) * 1.9;            // 35..50  -> 68..40
  else s = Math.max(25, 40 - (d - 50) * 1.5);
  return clamp100(s);
}

// --- 2. MILEAGE (15%) ---
function scoreMileage(l) {
  if (l.ridaDiffPct !== null && l.ridaDiffPct !== undefined) {
    return clamp100(60 - l.ridaDiffPct * 0.9);
  }
  if (l.rida && l.metai) {
    const amzius = Math.max(1, new Date().getFullYear() - l.metai);
    const kmPerMetus = l.rida / amzius;
    return clamp100(115 - kmPerMetus * 0.003); // 10k/m -> 85, 15k/m -> 70, 25k/m -> 40
  }
  return null;
}

// --- 3. HISTORY / VIN (20%) ---
// Istorijos NEBUVIMAS yra informacija, ne duomenu trukumas - todel niekada null.
// UNKNOWN != BAD: jei skelbime nera JOKIU istorijos signalu, komponentas grazina null
// ir jo svoris persiskirsto kitiems. Uz tai, ko pardavejas tiesiog nenurode, nebaudziam -
// tik aiskiai pasakom vartotojui, kad sios dalies ivertinti negalejom.
function scoreHistory(l) {
  if (!l.turiIstorijosAtaskaita && !l.turiVin && !l.turiGarantija) return null;
  let s = 45;
  if (l.turiIstorijosAtaskaita) s += 30;
  if (l.turiVin) s += 18;
  if (l.turiGarantija) {
    s += l.garantijosTipas === 'gamintojo' ? 22 : l.garantijosTipas === 'pardavejo' ? 14 : 8;
  }
  return clamp100(s);
}

// --- 4. CONDITION / RISK (15%) ---
function scoreCondition(l) {
  // UNKNOWN = neutralu. Baze auksta todel, kad neigiamu irodymu NERASTA;
  // balas krenta tik nuo PATVIRTINTU neigiamu signalu, ne nuo tylos skelbime.
  let s = 88;
  const def = l.galimiDefektai || [];
  const sunkus = def.filter((d) => /dauž|degę|skend|po avarijos|korozij/i.test(d));
  s -= sunkus.length * 30;
  s -= (def.length - sunkus.length) * 12;
  if (l.galimasJavImportas) s -= 15;
  const frazes = l.pardavejoFrazes || [];
  s -= Math.min(15, frazes.length * 5);
  return clamp100(s);
}

// --- 5. EQUIPMENT (10%) ---
// Komplektacija matoma tik pilnai nuskaitytame skelbime. Kol jos nera - null.
function scoreEquipment(l) {
  const eq = l.komplektacija || (l.deepAnalysis && l.deepAnalysis.komplektacija);
  if (!eq || !eq.length) return null; // UNKNOWN -> issikrenta, o ne "iranga 2/10"
  return clamp100(68 + Math.min(30, eq.length * 3));
}

// --- 6. SELLER (5%) ---
function scoreSeller(l) {
  if (!l.yraVerslas && !l.reitingas && !l.pardavejas) return null; // UNKNOWN -> issikrenta is skaiciavimo
  let s = l.yraVerslas ? 75 : 58;
  if (l.reitingas) {
    s += (l.reitingas - 4) * 20;
    if (l.atsiliepimuSkaicius && l.atsiliepimuSkaicius < 5) s -= 10;
  }
  return clamp100(s);
}

// --- 7. LISTING QUALITY (5%) ---
function scoreListing(l) {
  const nuotr = (l.photos && l.photos.length) || 0;
  const aprIlgis = ((l.deepAnalysis && l.deepAnalysis.aprasymas) || l.aprasymas || '').length;
  if (!nuotr && !aprIlgis) return null;
  let s = 48;
  if (nuotr) s += Math.min(32, nuotr * 3);
  if (aprIlgis) s += Math.min(20, aprIlgis / 40);
  return clamp100(s);
}

// --- 8. PAKLAUSA / LIKVIDUMAS (5%) ---
// Kiek sio modelio skelbimu sukasi rinkoje: daugiau panasiu pasiulymu reiskia
// aiskesne kaina ir lengviau parduodama masina. Be imties - null.
function scoreDemand(l) {
  const n = l.marketCount || 0;
  if (n < 3) return null;
  if (n >= 25) return 90;
  if (n >= 15) return 78;
  if (n >= 8) return 66;
  if (n >= 5) return 55;
  return 45;
}

// --- DUOMENU PATIKIMUMAS (informacinis, i bala NEIeina) ---
function scoreConfidence(l) {
  // Matuoja, kiek sprendimui svarbios informacijos realiai PATIKRINOME,
  // o ne kiek komponentu pavyko suskaiciuoti. Truksta informacijos ->
  // krenta PATIKIMUMAS, o ne galimybes balas.
  let s = 0;
  // Baziniai faktai (kaina, metai, rida, kuras, deze) - be ju nera ka lyginti
  if (l.kaina && l.metai && l.rida) s += 20;
  // Kiek patikima palyginamoji rinkos kaina
  if (l.marketCount >= 15) s += 25;
  else if (l.marketCount >= 8) s += 20;
  else if (l.marketCount >= 3) s += 12;
  if (l.turiVin) s += 18;
  if (l.turiIstorijosAtaskaita) s += 20;
  if (l.turiGarantija) s += 7;
  const eq = l.komplektacija || (l.deepAnalysis && l.deepAnalysis.komplektacija);
  if (eq && eq.length >= 6) s += 12;
  else if (eq && eq.length) s += 6;
  if (l.yraVerslas || l.pardavejas) s += 8;
  if (l.photos && l.photos.length >= 8) s += 6;
  else if (l.photos && l.photos.length) s += 3;
  // Tas pats auto rastas keliuose portaluose = nepriklausomi saltiniai
  if (l.kryzminiaiSkelbimai && l.kryzminiaiSkelbimai.length) s += 6;
  return clamp100(s);
}

// ---- HARD REJECTION RULES ----
// Skelbimas, atitinkantis bent viena taisykle, NIEKADA nerodomas kaip TOP,
// bet lieka matomas su aiskiai ivardyta priezastimi.
function checkHardRejections(l, filters) {
  const r = [];
  // Narsymo rezime skelbimai, neatitinkantys vartotojo filtru, nera ismetami -
  // jie parodomi su konkrecia priezastimi, kuris rezis nesutapo.
  if (l.hardRejectReasons && l.hardRejectReasons.length) {
    r.push('Neatitinka jūsų paieškos filtrų: ' + l.hardRejectReasons.join('; ') + '.');
  }
  const def = l.galimiDefektai || [];
  const struktur = def.filter((d) => /dauž|po avarijos|skend|degę/i.test(d));
  if (struktur.length) {
    r.push('Skelbime nurodyta reikšminga žala (' + struktur.join(', ') + ')' +
      (l.diffPct !== null && l.diffPct < 20 ? ', o kaina tik ' + l.diffPct + '% žemiau rinkos – rizika nėra pakankamai kompensuojama.' : ' – reikia gyvos apžiūros ir diagnostikos.'));
  }
  if (l.rida != null && l.metai) {
    const amzius = new Date().getFullYear() - l.metai;
    if (amzius >= 3 && l.rida < 1000) r.push('Ridos neatitikimas: ' + l.metai + ' m. automobilis su vos ' + l.rida + ' km.');
    if (l.rida > 900000) r.push('Neištikėtina rida: ' + l.rida + ' km – tikėtina klaida skelbime.');
  }
  if (filters && filters.marke && l.modelis && !String(l.modelis).toLowerCase().includes(String(filters.marke).toLowerCase())) {
    r.push('Skelbimas neatitinka pasirinktos markės (' + filters.marke + '): rasta "' + l.modelis + '".');
  }
  if (l.kaina && l.marketMedian && l.marketCount >= 3 && l.kaina < l.marketMedian * 0.12) {
    r.push('Kaina ' + l.kaina + '€ visiškai nesuderinama su šio modelio rinka (' + l.marketMedian + '€) – greičiausiai nurodyta lizingo įmoka arba dalies kaina, ne automobilio kaina.');
  } else if (l.diffPct !== null && l.diffPct >= 60 && l.marketCount >= 3) {
    r.push('Kaina ' + l.diffPct + '% žemiau rinkos – toks skirtumas paprastai reiškia žalos, aukciono pradinę kainą arba klaidą, ne sandorį.');
  }
  if (l.galimasJavImportas && l.diffPct !== null && l.diffPct >= 35) {
    r.push('JAV aukciono požymiai kartu su ' + l.diffPct + '% „nuolaida“ – tikėtina, kad rodoma pradinė aukciono kaina be gabenimo, muitų ir remonto.');
  }
  return r;
}

// ---- HISTORY STATUS: VERIFIED / PARTIALLY VERIFIED / NOT VERIFIED / ISSUE FOUND ----
function istorijosBusena(l) {
  const ridosProblema = l.rida != null && l.metai &&
    ((new Date().getFullYear() - l.metai) >= 3 && l.rida < 1000);
  const rimtaZala = (l.galimiDefektai || []).some((d) => /dauž|po avarijos|skend|degę/i.test(d));
  if (ridosProblema || rimtaZala) return { key: 'ISSUE_FOUND', emoji: '🔴', label: 'Rasta istorijos problema' };
  if (l.turiIstorijosAtaskaita) return { key: 'VERIFIED', emoji: '🟢', label: 'Istorija patikrinta' };
  if (l.turiVin) return { key: 'PARTIALLY_VERIFIED', emoji: '🟡', label: 'Istorija dalinai patikrinta' };
  return { key: 'NOT_VERIFIED', emoji: '⚪', label: 'Istorija nepatikrinta' };
}

// ---- EQUIPMENT STATUS ----
function irangosBusena(l) {
  const eq = l.komplektacija || (l.deepAnalysis && l.deepAnalysis.komplektacija);
  if (!eq || !eq.length) return { key: 'UNKNOWN', label: 'Įranga: Nepakankamai duomenų' };
  if (eq.length < 6) return { key: 'PARTIAL', label: 'Įranga: Dalinai nustatyta' };
  return { key: 'VERIFIED', label: 'Įranga: Patikrinta' };
}

// ---- RISK: UNKNOWN = neutralu, o ne bloga ----
function rizikosBusena(l) {
  const def = l.galimiDefektai || [];
  const sunkus = def.filter((d) => /dauž|degę|skend|po avarijos/i.test(d));
  const ridosProblema = l.rida != null && l.metai &&
    ((new Date().getFullYear() - l.metai) >= 3 && l.rida < 1000);
  if (sunkus.length || ridosProblema) {
    return { key: 'CRITICAL', emoji: '🔴', label: 'Kritinė – patvirtinti rimti neigiami signalai' };
  }
  if (def.length || (l.galimasJavImportas && l.diffPct !== null && l.diffPct >= 35)) {
    return { key: 'RISK', emoji: '🟠', label: 'Didelė – rasta problemos požymių' };
  }
  // Nepaaiskinta didele nuolaida pati savaime yra signalas: skelbime apie zala
  // neparasyta, bet tokia kaina be priezasties nebuna.
  if (l.diffPct !== null && l.marketCount >= 3 && l.diffPct >= 28) {
    return { key: 'RISK', emoji: '🟠', label: 'Didelė – kaina gerokai žemiau rinkos be paaiškinimo' };
  }
  if (!l.turiVin && !l.turiIstorijosAtaskaita) {
    return { key: 'WARNING', emoji: '🟡', label: 'Vidutinė – reikia patikrinti istoriją' };
  }
  return { key: 'LOW', emoji: '🟢', label: 'Žema – neigiamų signalų nerasta' };
}

function rizikosLygis(conditionScore) {
  if (conditionScore === null || conditionScore === undefined) return 'nežinoma';
  if (conditionScore >= 70) return 'žema';
  if (conditionScore >= 45) return 'vidutinė';
  return 'aukšta';
}

// ---- "KODEL SIS AUTO?" ----
// Kiekviena eilute kyla is konkretaus balo komponento ar duomens, ne is AI nuomones.
function buildWhyReasons(l, k) {
  const r = [];
  if (l.diffPct !== null && l.marketCount >= 3) {
    if (l.diffPct >= 3) r.push('−' + l.diffPct + '% žemiau rinkos (' + l.marketMedian + '€, imtis ' + l.marketCount + ')');
    else if (l.diffPct <= -3) r.push('+' + Math.abs(l.diffPct) + '% virš rinkos (' + l.marketMedian + '€)');
    else r.push('Kaina atitinka rinką (' + l.marketMedian + '€)');
  } else {
    r.push('Rinkos kaina nenustatyta – per maža panašių skelbimų imtis');
  }
  if (k.mileage !== null) {
    if (k.mileage >= 72) r.push('Maža rida savo metams');
    else if (k.mileage <= 32) r.push('Didelė rida');
  }
  if (l.turiIstorijosAtaskaita) r.push('Yra istorijos ataskaita');
  else if (l.turiVin) r.push('Nurodytas VIN');
  // VIN/istorijos nebuvimas NEminimas kaip minusas – jis atsiduria "neįvertinta" sąraše.
  if (l.turiGarantija) r.push(l.garantijosTipas === 'gamintojo' ? 'Gamintojo garantija' : l.garantijosTipas === 'pardavejo' ? 'Pardavėjo garantija' : 'Nurodyta garantija');
  if ((l.galimiDefektai || []).length) r.push('Skelbime minimi defektai: ' + l.galimiDefektai.join(', '));
  else if (l.diffPct !== null && l.marketCount >= 3 && l.diffPct >= 28) {
    r.push('⚠ ' + l.diffPct + '% žemiau rinkos be paaiškinimo skelbime – tokia kaina dažniausiai reiškia žalą, aukcioną arba nutylėtą informaciją. Būtina apžiūra ir istorijos patikra.');
  }
  if (l.yraVerslas) r.push('Verslo pardavėjas');
  if (k.demand !== null && k.demand >= 70) r.push('Likvidus modelis – rinkoje daug panašių pasiūlymų');
  // Rizika imama is tos pacios busenu masinos, kuria rodo kortele -
  // kitaip sarasas prastu "Rizika: zema", kai virsuje svyti oranzinis ispejimas.
  const rb = rizikosBusena(l);
  r.push('Rizika: ' + rb.emoji + ' ' + rb.label);
  return r.slice(0, 6);
}

// ---- Pagrindinis ivertinimas ----
function computeTriageScore(l, mode, filters) {
  const w = TRIAGE_WEIGHTS[mode] || TRIAGE_WEIGHTS.default;
  const k = {
    price: scorePrice(l),
    mileage: scoreMileage(l),
    condition: scoreCondition(l),
    history: scoreHistory(l),
    equipment: scoreEquipment(l),
    seller: scoreSeller(l),
    demand: scoreDemand(l),
    listing: scoreListing(l),
  };
  const confidence = scoreConfidence(l);

  // UNKNOWN != BAD: null komponentas neduoda nulio - jo svoris persiskirsto
  // likusiems, tad balas rodo tik tai, ka realiai imanoma ivertinti.
  let sumW = 0, sum = 0;
  Object.keys(k).forEach((key) => {
    if (k[key] === null || k[key] === undefined || !w[key]) return;
    sum += k[key] * w[key];
    sumW += w[key];
  });
  let score = sumW ? Math.round(sum / sumW) : 0;

  // Ko ivertinti negalejome - apie tai vartotoja informuojam atvirai.
  const KOMP_PAVADINIMAI = {
    price: 'kaina vs rinka', mileage: 'rida', condition: 'būklė / rizika',
    history: 'VIN / istorija', equipment: 'įranga', seller: 'pardavėjas',
    demand: 'paklausa rinkoje', listing: 'skelbimo kokybė',
  };
  const neivertinta = Object.keys(k)
    .filter((key) => w[key] && (k[key] === null || k[key] === undefined))
    .map((key) => KOMP_PAVADINIMAI[key]);

  const rejections = checkHardRejections(l, filters);
  if (rejections.length) score = Math.min(score, 44); // atmestas niekada netampa TOP

  const level = triageLevel(score);
  return {
    score,
    breakdown: k,
    weights: w,
    neivertinta,
    istorija: istorijosBusena(l),
    iranga: irangosBusena(l),
    rizikosBusena: rizikosBusena(l),
    level: level.key,
    levelLabel: level.label,
    levelColor: level.color,
    levelBg: level.bg,
    confidence,
    rizika: rizikosLygis(k.condition),
    rejections,
    why: rejections.length ? rejections.slice(0, 3) : buildWhyReasons(l, k),
  };
}

// ---- Perpardavejo skaiciavimai ----
// Specifikacija: pelno neskaiciuojam, kai truksta duomenu - tada aiskiai tai pasakom.
function computeResaleMath(l) {
  if (!l.kaina || !l.marketMedian || l.marketCount < 3) {
    return { galima: false, zinute: 'Trūksta duomenų pelno potencialui apskaičiuoti.' };
  }
  const pirkimoKaina = l.kaina;
  const numatomaPardavimo = l.marketMedian;
  const bendraInvesticija = pirkimoKaina; // transporto/remonto duomenu portale nera
  const potencialusPelnas = numatomaPardavimo - bendraInvesticija;
  const roi = Math.round((potencialusPelnas / bendraInvesticija) * 100);
  return {
    galima: true,
    pirkimoKaina,
    bendraInvesticija,
    numatomaPardavimo,
    potencialusPelnas,
    roi,
    pastaba: 'Neskaičiuota: transportas, remontas ir kitos įsigijimo išlaidos – šių duomenų skelbime nėra.',
  };
}

// Anthropic API klaidos i loga turi patekti zmogiskai, o ne kaip zalias JSON,
// ir kartotis ne 7 kartus is eiles, o viena karta per paieska.
const _aiKlaiduZymos = new Set();

function aiKlaidosZinute(err) {
  const t = String((err && err.message) || err);
  if (/credit balance is too low|insufficient.*credit|billing/i.test(t)) {
    return { raktas: 'kreditai', tekstas: 'Anthropic API kreditai pasibaigę – detalios apžvalgos neveiks, kol nepapildysite balanso (console.anthropic.com → Plans & Billing). Paieška ir vertinimas veikia toliau.' };
  }
  if (/401|unauthorized|invalid x-api-key|authentication/i.test(t)) {
    return { raktas: 'raktas', tekstas: 'Anthropic API raktas netinkamas arba atšauktas – patikrinkite ANTHROPIC_API_KEY Railway kintamuosiuose.' };
  }
  if (/429|rate.?limit/i.test(t)) {
    return { raktas: 'limitas', tekstas: 'Pasiektas Anthropic API užklausų limitas – dalis detalių apžvalgų praleista. Pabandykite po kelių minučių.' };
  }
  if (/529|overloaded/i.test(t)) {
    return { raktas: 'apkrova', tekstas: 'Anthropic API šiuo metu perkrauta – dalis detalių apžvalgų praleista.' };
  }
  return null;
}

function computeQualityScore(l, mode) {
  if (mode === 'reseller') {
    // Tikslas: perpardavinėti – svarbiausia kaina vs rinka ir greitai parduodami kriterijai
    let score = l.diffPct * 2; // kaina yra viskas
    if (l.galimiDefektai.length > 0) score -= 60; // defektai = didelė rizika pelningumui
    if (l.galimasJavImportas && l.diffPct >= 39) score -= 20;
    if (l.diffPct >= 39) score -= 10; // perdaug pigu = įtartina
    if (l.ridaDiffPct !== null) {
      if (l.ridaDiffPct >= 50) score -= 20; // labai daug rida = sunku parduoti
      else if (l.ridaDiffPct >= 30) score -= 10;
      else if (l.ridaDiffPct <= -20) score += 10; // maža rida = geras perpardavimas
    }
    if (l.turiIstorijosAtaskaita) score += 10; // istorija = lengviau parduoti
    if (l.yraVerslas) score += 5; // verslo pardavėjas = mažesnė rizika
    return Math.round(score);
  }

  if (mode === 'personal') {
    // Tikslas: sau – balansas tarp kainos, ridos, komplektacijos, patikimumo
    let score = (l.diffPct || 0) * 0.7; // kaina svarbu bet ne vienintelis kriterijus
    if (l.turiIstorijosAtaskaita) score += 20; // patikimumas svarbiausia
    if (l.turiGarantija) score += 18;
    if (l.yraVerslas) score += 10;
    if (l.reitingas && l.reitingas >= 4.5) score += 12;
    if (l.galimiDefektai.length > 0) score -= 50;
    if (!l.turiIstorijosAtaskaita && !l.turiGarantija && !l.yraVerslas) score -= 15;
    if (l.diffPct >= 39) score -= 15; // perdaug pigu = įtartina
    if (l.galimasJavImportas && l.diffPct >= 39) score -= 20;
    if (l.ridaDiffPct !== null) {
      if (l.ridaDiffPct >= 40) score -= 20; // daug rida = daugiau remonto
      else if (l.ridaDiffPct >= 20) score -= 10;
      else if (l.ridaDiffPct <= -30) score += 15; // nedidelė rida = ilgesnis tarnavimas
      else if (l.ridaDiffPct <= -15) score += 8;
    }
    return Math.round(score);
  }

  // Numatytasis (originalus) režimas
  let score = l.diffPct;
  if (l.turiIstorijosAtaskaita) score += 15;
  if (l.turiGarantija) score += 15;
  if (l.yraVerslas) score += 8;
  if (l.reitingas && l.reitingas >= 4.5) score += 10;
  if (l.galimiDefektai.length > 0) score -= 40;
  if (!l.turiIstorijosAtaskaita && !l.turiGarantija && !l.yraVerslas) score -= 10;
  if (l.diffPct >= 39) score -= 20;
  if (l.galimasJavImportas && l.diffPct >= 39) score -= 15;
  if (l.ridaDiffPct !== null) {
    if (l.ridaDiffPct >= 40) score -= 15;
    else if (l.ridaDiffPct >= 20) score -= 8;
    else if (l.ridaDiffPct <= -20) score += 8;
  }
  return Math.round(score);
}

// Keiciant triage varikli ar filtru logika BUTINA pakelti sita numeri - kitaip
// 20 min. podelis grazins sena rezultata be nauju lauku ir atrodys, kad nieko neveikia.
const SEARCH_ENGINE_VERSION = 'triage-v3';

function hashFilters(f) {
  const keys = Object.keys(f).filter((k) => f[k] != null && f[k] !== '' && !(Array.isArray(f[k]) && f[k].length === 0)).sort();
  const normalized = { __v: SEARCH_ENGINE_VERSION };
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
    // Rinkos mediana turi remtis VISAIS to modelio skelbimais, ne tik tais, kurie
    // telpa i vartotojo biudzeta - kitaip "nuolaida nuo rinkos" yra uzdaras ratas
    // (filtruoji 22-35k, mediana irgi 22-35k, skirtumas ~0). Todel portalams
    // siunciam marke/modeli/metus/kura/deze, bet NE kainos rezi; kaina taikoma
    // vietoje, jau atrenkant kandidatus.
    const scanFilters = { ...filters };
    delete scanFilters.kainaNuo;
    delete scanFilters.kainaIki;
    const allUrls = [
      { key: 'autoplius', url: buildAutopliusUrl(scanFilters), site: 'autoplius.lt' },
      { key: 'autogidas', url: buildAutogidasUrl(scanFilters), site: 'autogidas.lt' },
      { key: 'autoscout24', url: buildAutoscout24Url(scanFilters), site: 'autoscout24.com' },
      { key: 'otomoto', url: buildOtomotoUrl(scanFilters), site: 'otomoto.pl' },
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
    const hardRejected = [];
    parsed = parsed.filter((l) => {
      const why = [];
      if (metaiNuo && l.metai && l.metai < metaiNuo) why.push('Metai ' + l.metai + ' < ' + metaiNuo);
      if (metaiIki && l.metai && l.metai > metaiIki) why.push('Metai ' + l.metai + ' > ' + metaiIki);
      if (kainaNuo && l.kaina && l.kaina < kainaNuo) why.push('Kaina ' + l.kaina + '\u20ac < ' + kainaNuo + '\u20ac');
      if (kainaIki && l.kaina && l.kaina > kainaIki) why.push('Kaina ' + l.kaina + '\u20ac > ' + kainaIki + '\u20ac');
      if (ridaIki && l.rida && l.rida > ridaIki) why.push('Rida ' + l.rida + ' km > ' + ridaIki + ' km');
      if (filters.pavaru_deze && l.pavarai && l.pavarai !== filters.pavaru_deze) why.push('Pavaru deze: ' + l.pavarai + ', reikia ' + filters.pavaru_deze);
      if (filters.kuras && !kurasAtitinka(l.kuras, filters.kuras)) why.push('Kuras: ' + (l.kuras || 'nenurodytas') + ', reikia ' + filters.kuras);
      if (why.length) { l.hardRejectReasons = why; hardRejected.push(l); return false; }
      return true;
    });
    logJob(jobId, `🧹 ${rawFoundCount} rasta pagal markę/modelį → ${parsed.length} atitinka jūsų kainos/metų/ridos filtrus`);

    // ---- DIAGNOSTIKA: kodel skelbimai atkrito ir ar kainos nuskaitytos teisingai ----
    if (hardRejected.length) {
      const pagalPriezasti = {};
      hardRejected.forEach((l) => {
        const kategorija = l.hardRejectReasons[0].split(' ')[0];
        pagalPriezasti[kategorija] = (pagalPriezasti[kategorija] || 0) + 1;
      });
      logJob(jobId, '\u{1F50E} Atmesta filtrais: ' + hardRejected.length + ' \u2014 ' +
        Object.keys(pagalPriezasti).map((k) => k + ': ' + pagalPriezasti[k]).join(', '));
      hardRejected.slice(0, 8).forEach((l) => logJob(jobId,
        '   \u2022 ' + (l.modelis || '?') + ' | ' + (l.kaina || '?') + '\u20ac | ' + (l.metai || '?') +
        ' | ' + (l.rida || '?') + ' km | ' + (l.kuras || '?') + ' | ' + (l.pavarai || '?') +
        ' \u2192 ' + l.hardRejectReasons.join('; ')));
    }
    const visosKainos = parsed.concat(hardRejected).map((l) => l.kaina).filter(Boolean).sort((a, b) => a - b);
    if (visosKainos.length) {
      logJob(jobId, '\u{1F4B6} Nuskaitytos kainos (n=' + visosKainos.length + '): min ' + visosKainos[0] +
        '\u20ac \u00b7 mediana ' + visosKainos[Math.floor(visosKainos.length / 2)] +
        '\u20ac \u00b7 max ' + visosKainos[visosKainos.length - 1] + '\u20ac');
      const itartinaiPigus = visosKainos.filter((k) => k < 2000).length;
      if (itartinaiPigus > 0) {
        logJob(jobId, '   \u26a0\ufe0f ' + itartinaiPigus + ' skelbim\u0173 kaina <2000\u20ac \u2013 galimai nuskaityta lizingo \u012fmoka, ne automobilio kaina!');
      }
    }

    // "Narsyti viska" reiskia BUTENT viska: filtro neatitinkantys skelbimai lieka
    // sarase, tik pazymeti ir nustumti i ATMESTI grupe su konkrecia priezastimi.
    // Griezta atranka taikoma tik CarTriige analizes rezime.
    if ((filters.searchMode === 'browse') && hardRejected.length) {
      logJob(jobId, '📋 Naršymo režimas: ' + hardRejected.length + ' filtro neatitinkančių skelbimų paliekami sąraše su priežastimis.');
      parsed = parsed.concat(hardRejected.splice(0, hardRejected.length));
    }

    const beforeDedup = parsed.length;
    parsed = mergeDuplicatesAcrossPortals(parsed);
    if (beforeDedup !== parsed.length) {
      logJob(jobId, `🔗 Sujungta ${beforeDedup - parsed.length} kryžminių skelbimų (tas pats auto abiejuose portaluose)`);
    }

    logJob(jobId, '📚 Papildome ankstesnių paieškų archyvu...');
    const modelsInSearch = [...new Set([...parsed, ...hardRejected].map((l) => l.modelis))];
    // I rinkos imti iteina ir tie skelbimai, kuriuos atmete vartotojo biudzeto/filtru
    // rezis - jie vis tiek yra tos pacios rinkos dalis ir be ju mediana butu i sali.
    let combinedForMedians = [...parsed, ...hardRejected];
    let historyAddedCount = 0;
    for (const model of modelsInSearch) {
      const hist = cache.getHistoryForModel(model);
      const currentUrls = new Set([...parsed, ...hardRejected].filter((l) => l.modelis === model).map((l) => l.url));
      const fromHistory = hist.filter((h) => !currentUrls.has(h.url)).map((h) => ({ modelis: model, kaina: h.kaina, rida: h.rida }));
      combinedForMedians = combinedForMedians.concat(fromHistory);
      historyAddedCount += fromHistory.length;
    }
    if (historyAddedCount > 0) {
      logJob(jobId, `   +${historyAddedCount} skelbimų iš archyvo (ankstesnės paieškos) – tikslesni vidurkiai`);
    }

    logJob(jobId, '🧮 Skaičiuojame rinkos vidurkius...');
    const medians = computeMarketMedians(combinedForMedians);
    // Kaupiam VISUS nuskaitytus skelbimus - kuo daugiau istorijos, tuo tikslesnes
    // busimos medianos ir balai jau matytiems modeliams.
    cache.addToHistory([...parsed, ...hardRejected]);

    // Kiekvienam matytam skelbimui fiksuojam kainos/ridos momentini vaizda ir
    // gyvavimo cikla. Is to veliau gaunam "kaina mazinta", "kabo 3 savaites",
    // "dingo - tikriausiai parduotas" ir modelio pardavimo greiti.
    const visiMatyti = [...parsed, ...hardRejected];
    visiMatyti.forEach((l) => {
      cache.zymetiMatyta(l);
      if (l.kaina) cache.recordListingSnapshot(l.url, l.kaina, l.rida || null);
    });
    cache.saveLifecycle();

    // Skelbimai, kuriuos anksciau mateme sioje paieskoje, bet dabar ju nebera -
    // greiciausiai parduoti arba nuimti.
    const dabartiniai = new Set(visiMatyti.map((l) => l.url));
    const dingusieji = [];
    visiMatyti.forEach(() => {});
    (function aptiktiDingusius() {
      const modeliai = new Set(visiMatyti.map((l) => l.modelis).filter(Boolean));
      modeliai.forEach((m) => {
        cache.getHistoryForModel(m).forEach((h) => {
          // Tikrinam tik tuos, kuriuos mateme per pastarasias 14 dienu
          if (!h.url || dabartiniai.has(h.url)) return;
          if (Date.now() - h.time > 14 * 86400000) return;
          const d = cache.zymetiDingusi(h.url);
          if (d) dingusieji.push(d);
        });
      });
      cache.saveLifecycle();
    })();
    if (dingusieji.length) {
      logJob(jobId, `📤 ${dingusieji.length} anksčiau matyti skelbimai dingo iš rezultatų – tikėtina, parduoti.`);
    }
    // Palikti tik du rezimai: 'default' (CarTriige analize) ir 'browse' (visi skelbimai).
    const searchMode = filters.searchMode === 'browse' ? 'browse' : 'default';

    // Slenkstis pagal rezima:
    // reseller: 15% – tik tikros nuolaidos, galima perpardavineti
    // personal: 5%  – net nedidelė nuolaida gali reikšti gerą sandorį su gera komplektacija
    // browse:   0%  – visi skelbimai, jokio filtravimo
    // default:  12%
    const THRESHOLD_PCT = searchMode === 'reseller' ? 15 : searchMode === 'personal' ? 5 : searchMode === 'browse' ? -999 : 12;
    // Triage nebeisbraukia skelbimu - rodom placiai, o eiliskuma lemia balas.
    const MAX_CANDIDATES = searchMode === 'browse' ? 999 : 60;

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

    // TRIAGE: kiekvienas skelbimas ivertinamas ir suklasifikuojamas. Nebraukiam
    // agresyviai - net silpni pasiulymai lieka matomi su savo lygiu ir priezastimis,
    // o vartotojas mato surikiuota sarasa nuo geriausios galimybes zemyn.
    enriched.forEach((l) => {
      const t = computeTriageScore(l, searchMode, filters);
      l.triage = t;
      l.qualityScore = t.score;       // suderinamumas su esamu frontend'u
      l.triageLevel = t.level;
      l.triageLabel = t.levelLabel;
      l.triageColor = t.levelColor;
      l.triageBg = t.levelBg;
      l.whyReasons = t.why;
      l.rizika = t.rizika;
      l.pasitikejimas = t.confidence;      // DATA CONFIDENCE - atskiras nuo balo
      l.rizikosBusena = t.rizikosBusena;   // RISK - atskiras nuo balo
      l.istorijosBusena = t.istorija;
      l.irangosBusena = t.iranga;
      l.neivertinta = t.neivertinta;
      l.baloKomponentai = t.breakdown;
      l.hardRejections = t.rejections;
      if (searchMode === 'reseller') l.resaleMath = computeResaleMath(l);
    });

    let candidates = enriched.slice().sort((a, b) => b.qualityScore - a.qualityScore);
    candidates = candidates.slice(0, MAX_CANDIDATES);

    const pagalLygi = {};
    candidates.forEach((c) => { pagalLygi[c.triageLabel] = (pagalLygi[c.triageLabel] || 0) + 1; });
    logJob(jobId, '\u{1F3AF} Triage: ' + Object.keys(pagalLygi).map((k) => k + ' ' + pagalLygi[k]).join(' \u00b7 '));
    const candidateUrls = new Set(candidates.map((c) => c.url));

    function explainRejection(l) {
      const reasons = [];
      if (!l.kaina) {
        reasons.push('Skelbime nenurodyta aiški kaina – negalima patikimai palyginti su rinka.');
      } else if (l.marketCount < 3) {
        reasons.push(`Per mažai panašių skelbimų (rasta tik ${l.marketCount}) šiam modeliui – neužtenka patikimam rinkos vidurkiui.`);
      } else if (l.diffPct < 0) {
        const modeNote = searchMode === 'reseller' ? ` Perpardavinėjimui netinka.` : '';
        reasons.push(`Kaina ${Math.abs(l.diffPct)}% AUKŠTESNĖ nei rinkos vidurkis (${l.marketMedian}€) – brangiau nei įprasta.${modeNote}`);
      } else if (l.diffPct < THRESHOLD_PCT) {
        const modeLabel = searchMode === 'reseller' ? 'perpardavinėjimui reikia bent 15%' : searchMode === 'personal' ? 'reikia bent 5%' : `reikia bent ${THRESHOLD_PCT}%`;
        reasons.push(`Kaina tik ${l.diffPct}% žemesnė nei rinkos vidurkis (${l.marketMedian}€) – ${modeLabel}.`);
      } else if (!candidateUrls.has(l.url)) {
        reasons.push(`Nuolaida ${l.diffPct}% atitiko ribą, bet kokybės balas žemesnis nei kitų TOP pasiūlymų šioje paieškoje.`);
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

    // NARSYMO rezimas = tik nuskrapinti ir ivertinti pagal turimus duomenis.
    // Jokiu AI komentaru ir jokios gilios analizes - vartotojas prase tik sarasa,
    // o kiekviena gili apzvalga yra atskira apmokama uzklausa.
    if (searchMode === 'browse') {
      logJob(jobId, `📋 Naršymo režimas: rodomi ${candidates.length} skelbimai su vertinimu, be AI apžvalgų (jas galima užsakyti atskirai kiekvienam skelbimui).`);
    } else {

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
    const TOP_N_DEEP = 7;
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
            const analysis = await generateDeepAnalysis(title, fullText, detailPhotos, marketContext, c.url);
            c.deepAnalysis = analysis;
            c.vin = vin;
            c.pardavejas = pardavejas || c.pardavejas;
            c.photos = detailPhotos;
            const vinInfo = sujungtiVin(vin, analysis);
            c.vin = vinInfo.vin;
            c.vinSaltinis = vinInfo.vinSaltinis;
            c.vinIsNuotraukos = vinInfo.vinIsNuotraukos;
            if (vinInfo.vin && !c.turiVin) c.turiVin = true; // VIN rastas - istorijos komponentas pagerėja
            cache.setCached('analysis', c.url, {
              title, photo: detailPhoto, photos: detailPhotos, analysis,
              vin: vinInfo.vin, vinSaltinis: vinInfo.vinSaltinis, vinIsNuotraukos: vinInfo.vinIsNuotraukos,
              pardavejas,
            });
          } finally {
            stopFake();
          }
          logJob(jobId, `   ✅ ${label} - apžvalga paruošta`);
        }
      } catch (err) {
        const aiKl = aiKlaidosZinute(err);
        if (aiKl) {
          // Ta pacia sistemine klaida rasom viena karta, o ne prie kiekvieno skelbimo.
          const zyma = jobId + ':' + aiKl.raktas;
          if (!_aiKlaiduZymos.has(zyma)) {
            _aiKlaiduZymos.add(zyma);
            logJob(jobId, `   ⚠ ${aiKl.tekstas}`);
          }
        } else {
          logJob(jobId, `   ⚠ Nepavyko atlikti detalios apžvalgos: ${String(err.message).slice(0, 160)}`);
        }
      }
    }));

    } // <- narsymo rezimo saka baigiasi cia: AI komentarai ir gili analize praleisti

    logJob(jobId, '🎉 Baigta!');
    jobs[jobId].status = 'done';
    // Visi nuskaityti skelbimai (ne tik "verti demesio") - kad vartotojas galetu pats pasiziureti.
    const allListingsBase = enriched.map((l) => ({
      modelis: l.modelis, kaina: l.kaina, metai: l.metai, rida: l.rida,
      kuras: l.kuras, pavarai: l.pavarai, turiVin: l.turiVin, galia: l.galia, variklioTuris: l.variklioTuris,
      photo: l.photo, url: l.url, source: l.source, kryzminiaiSkelbimai: l.kryzminiaiSkelbimai || null,
      isCandidate: candidateUrls.has(l.url), pardavejas: l.pardavejas || null,
      rejectionReasons: (l.hardRejections && l.hardRejections.length)
        ? l.hardRejections
        : (candidateUrls.has(l.url) ? [] : explainRejection(l)),
      qualityScore: l.qualityScore,
      triageLevel: l.triageLevel, triageLabel: l.triageLabel,
      triageColor: l.triageColor, triageBg: l.triageBg,
      whyReasons: l.whyReasons, rizika: l.rizika, pasitikejimas: l.pasitikejimas,
      rizikosBusena: l.rizikosBusena, istorijosBusena: l.istorijosBusena,
      irangosBusena: l.irangosBusena, neivertinta: l.neivertinta,
      diffPct: l.diffPct, marketMedian: l.marketMedian, marketCount: l.marketCount,
    }));

    // Skelbimai, kuriuos atmete kietasis filtras (kaina/metai/rida/deze/kuras).
    // Anksciau jie dingdavo cia pat ir vartotojas ju niekada nepamatydavo - dabar
    // grazinami su konkrecia priezastimi, kad matytusi VISI rasti skelbimai.
    const filtruAtmesti = hardRejected.map((l) => ({
      modelis: l.modelis, kaina: l.kaina, metai: l.metai, rida: l.rida,
      kuras: l.kuras, pavarai: l.pavarai, turiVin: l.turiVin, galia: l.galia, variklioTuris: l.variklioTuris,
      photo: l.photo, url: l.url, source: l.source, kryzminiaiSkelbimai: null,
      isCandidate: false, filteredOut: true, pardavejas: l.pardavejas || null,
      qualityScore: null, triageLevel: null, triageLabel: null,
      whyReasons: null, rizika: null, pasitikejimas: null,
      rejectionReasons: ['Neatitinka j\u016bs\u0173 paie\u0161kos filtr\u0173: ' + l.hardRejectReasons.join('; ') + '.'],
      diffPct: null, marketMedian: null, marketCount: 0,
    }));

    const allListings = allListingsBase.concat(filtruAtmesti)
      .sort((a, b) => (a.kaina || 0) - (b.kaina || 0));

    // Rinkos santrauka: leidzia tuscia rezultata paaiskinti konkreciai -
    // "tokiu automobiliu uz sia kaina rinkoje nera", o ne tiesiog "nieko nerasta".
    const visosRastosKainos = [...parsed, ...hardRejected].map((l) => l.kaina)
      .filter((k) => k && k > 2000).sort((a, b) => a - b);
    const rinkosSantrauka = visosRastosKainos.length ? {
      n: visosRastosKainos.length,
      minKaina: visosRastosKainos[0],
      maxKaina: visosRastosKainos[visosRastosKainos.length - 1],
      mediana: visosRastosKainos[Math.floor(visosRastosKainos.length / 2)],
      vartotojoNuo: parseInt(filters.kainaNuo, 10) || null,
      vartotojoIki: parseInt(filters.kainaIki, 10) || null,
      // Kiek rastu skelbimu telpa BUTENT i kainos rezi - taip atskiriam,
      // ar kalta kaina, ar kiti filtrai (kuras, deze, metai).
      kiekTelpaIKaina: visosRastosKainos.filter((k) =>
        (!filters.kainaNuo || k >= parseInt(filters.kainaNuo, 10)) &&
        (!filters.kainaIki || k <= parseInt(filters.kainaIki, 10))).length,
    } : null;

    const searchResult = { totalScanned: parsed.length, rawFoundCount, hardRejectedCount: hardRejected.length, medians, candidates, allListings, searchMode, rinkosSantrauka };
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
    const buf = Buffer.from(resp.data);

    // Per maža (<2KB) - greičiausiai klaidos puslapis, ne nuotrauka
    if (buf.length < 2048) return null;

    // Magic bytes validacija - patikriname ar tai tikrai paveikslėlis
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const isPng  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const isGif  = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
    const isWebp = buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;

    let media_type;
    if (isJpeg)      media_type = 'image/jpeg';
    else if (isPng)  media_type = 'image/png';
    else if (isGif)  media_type = 'image/gif';
    else if (isWebp) media_type = 'image/webp';
    else return null; // HTML, AVIF, ar kitas nepalaikomas formatas

    return { data: buf.toString('base64'), media_type };
  } catch {
    return null;
  }
}

async function generateDeepAnalysis(title, fullText, photos, marketContext, skelbimoUrl) {
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
matai nuotraukose. Jei zalos nepastebi, aprasyk bendra gera bukle.

ATSKIRA SVARBI UZDUOTIS - VIN KODAS NUOTRAUKOSE: pardavejai daznai idea nuotrauka
gamyklinio lipduko (dazniausiai ant vairuotojo duru stakto), VIN plokstele po priekiniu
stiklu, registracijos liudijimo ar serviso knygeles. Atidziai perziuk VISAS nuotraukas ir
jei kur nors ISKAITOMAS 17 simboliu VIN kodas - nuskaityk ji TIKSLIAI, simbolis po simbolio.
VIN yra 17 simboliu, sudarytas tik is skaiciu ir raidziu, kuriose NEBUNA raidziu I, O ir Q.
Jei abejoji bent vienu simboliu arba kodas neiskaitomas - grazink null, o ne spek.
Taip pat nurodyk, kurioje vietoje ji pamatei (pvz. 'duru lipdukas', 'po priekiniu stiklu',
'registracijos dokumentas').`
    : '';

  const engineNote = marketContext && (marketContext.galia || marketContext.variklioTuris)
    ? ` Sio konkretaus automobilio variklis: ${marketContext.variklioTuris ? marketContext.variklioTuris + 'L' : ''}${marketContext.galia ? ' ' + marketContext.galia + 'kW' : ''} - SVARBU: rinkos vidurkis skaiciuotas VISIEMS to modelio variantams kartu, o galingesni/silpnesni varikliai realiai kainuoja skirtingai (galingesnis = brangesnis). Atsizvelk i tai vertindamas, ar si kaina tikrai zema/auksta KONKRECIAM variantui, ne tik modeliui bendrai.`
    : '';
  const marketContextText = marketContext && marketContext.marketMedian
    ? `\n\nRINKOS DUOMENYS (musu sistemos apskaiciuoti, PATIKIMI): sio skelbimo kaina ${marketContext.kaina}€,
${marketContext.modelis || 'sio modelio'} rinkos vidurkis ${marketContext.marketMedian}€ (remiantis ${marketContext.marketCount || '?'} panasiu skelbimu imtimi),
t.y. si kaina yra ${marketContext.diffPct}% ${marketContext.diffPct >= 0 ? 'ZEMESNE' : 'AUKSTESNE'} nei vidurkis.${engineNote}`
    : '\n\nRinkos vidurkio duomenu sitam skelbimui neturime - jei reikia, remkis bendromis ziniomis/web paieska apie tipine sio modelio/metu kaina.';

  // Sukaupta SIO skelbimo istorija: kainos mazinimai, ridos pokyciai, kiek kabo.
  // Tai stipriausias derybu argumentas, kokis apskritai imanomas.
  let istorijosTekstas = '';
  if (skelbimoUrl) {
    const kaita = cache.buildListingTimelineText(skelbimoUrl);
    const ciklas = cache.gautiGyvavimoCikla(skelbimoUrl);
    const dalys = [];
    if (ciklas) {
      dalys.push(`Si skelbima musu sistema pirma karta pastebejo pries ${ciklas.dienosRinkoje} d. ir mate ji ${ciklas.kartuMatytas} k.`);
      if (ciklas.dienosRinkoje >= 30) dalys.push('SKELBIMAS KABO ILGIAU NEI MENESI - tai reiskia, kad uz sia kaina niekas neperka. Yra vietos deryboms arba yra priezastis, kodel neperka.');
      else if (ciklas.dienosRinkoje >= 14) dalys.push('Skelbimas kabo jau dvi savaites.');
    }
    if (kaita) dalys.push(kaita);
    if (dalys.length) {
      istorijosTekstas = `\n\nSIO SKELBIMO ISTORIJA (musu sistemos sukaupta, PATIKIMA):\n${dalys.join('\n')}\n` +
        `Butinai atsizvelk i sia istorija vertindamas ir ypac formuluodamas derybu argumentus.`;
    }
  }

  const prompt = `Automobilio skelbimo puslapio turinys:
Pavadinimas: ${title}
Turinys: ${fullText}
${marketContextText}${istorijosTekstas}

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
  "nuotrauku_pastebejimai": ${imageBlocks.length > 0 ? '["konkretus matomas pazeidimas nuotraukoje", "..."] (arba ["Nuotraukose akivaizdzios zalos nepastebeta"] jei nieko nerandi)' : 'null'},
  "vin_is_nuotraukos": ${imageBlocks.length > 0 ? '"17 simboliu VIN kodas, jei ISKAITOMAS nuotraukoje, kitu atveju null"' : 'null'},
  "vin_nuotraukos_vieta": ${imageBlocks.length > 0 ? '"kur pamatytas, pvz. duru lipdukas, arba null"' : 'null'}
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

app.post('/api/search-start', requireAuth, (req, res) => {
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
    const analysis = await generateDeepAnalysis(title, fullText, photos, marketContext, url);
    const vinInfo = sujungtiVin(vin, analysis);
    const result = {
      title, photo, photos, analysis,
      vin: vinInfo.vin, vinSaltinis: vinInfo.vinSaltinis, vinIsNuotraukos: vinInfo.vinIsNuotraukos,
      pardavejas: pardavejas || knownPardavejas || null,
    };
    cache.setCached('analysis', url, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ GILUS DVIEJU/TRIJU AUTO PALYGINIMAS ============
// Kiekvienam automobiliui atliekamas PILNAS nuskaitymas (skelbimo tekstas, visos
// nuotraukos, VIN, pardavejas) + gili analize, o tada Claude paraso savo verdikta
// LYGINDAMAS juos tarpusavyje - ne kiekviena atskirai.

async function paruostiPilnaProfili(url, kontekstas) {
  const cached = cache.getCached('analysis', url, cache.ANALYSIS_TTL_MS);
  if (cached && cached.analysis) {
    return { url, ...cached, isPodelio: true };
  }
  const { title, fullText, photo, photos, vin, pardavejas } = await scrapeSingleListing(url);
  const analysis = await generateDeepAnalysis(title, fullText, photos, kontekstas || null, url);
  const vinInfo = sujungtiVin(vin, analysis);
  const result = {
    title, photo, photos, analysis,
    vin: vinInfo.vin, vinSaltinis: vinInfo.vinSaltinis, vinIsNuotraukos: vinInfo.vinIsNuotraukos,
    pardavejas: pardavejas || null,
  };
  cache.setCached('analysis', url, result);
  return { url, ...result, isPodelio: false };
}

// Suglaudintas profilis promptui - be nereikalingu lauku, kad tilptu i konteksta.
function profilioSantrauka(p, meta, indeksas) {
  const a = p.analysis || {};
  const ts = a.technine_specifikacija || {};
  const eil = [];
  eil.push(`--- AUTOMOBILIS ${indeksas} ---`);
  eil.push(`Pavadinimas: ${p.title || meta.modelis || 'nezinomas'}`);
  if (meta.kaina) eil.push(`Kaina: ${meta.kaina} EUR`);
  if (meta.marketMedian) eil.push(`Rinkos mediana: ${meta.marketMedian} EUR (imtis ${meta.marketCount || '?'}), skirtumas ${meta.diffPct != null ? meta.diffPct + '%' : 'nezinomas'}`);
  if (meta.metai) eil.push(`Metai: ${meta.metai}`);
  if (meta.rida) eil.push(`Rida: ${meta.rida} km`);
  if (ts.kuras || meta.kuras) eil.push(`Kuras: ${ts.kuras || meta.kuras}`);
  if (ts.galia || meta.galia) eil.push(`Galia: ${ts.galia || meta.galia}`);
  if (ts.variklio_turis || meta.variklioTuris) eil.push(`Variklis: ${ts.variklio_turis || meta.variklioTuris}`);
  if (ts.pavaru_deze || meta.pavarai) eil.push(`Pavaru deze: ${ts.pavaru_deze || meta.pavarai}`);
  eil.push(`VIN: ${p.vin ? 'nurodytas' : 'nenurodytas'}`);
  eil.push(`Pardavejas: ${p.pardavejas || 'nezinomas'}`);
  eil.push(`Nuotrauku isanalizuota: ${(p.photos || []).length}`);
  if (a.verdiktas) eil.push(`Analizes verdiktas: ${a.verdiktas}`);
  if ((a.privalumai || []).length) eil.push(`Privalumai: ${a.privalumai.join('; ')}`);
  if ((a.ka_patikrinti_gyvai || []).length) eil.push(`Ka patikrinti: ${a.ka_patikrinti_gyvai.join('; ')}`);
  if ((a.irangos_akcentai || []).length) eil.push(`Iranga: ${a.irangos_akcentai.join('; ')}`);
  if ((a.nuotrauku_pastebejimai || []).length) eil.push(`Pastebejimai nuotraukose: ${a.nuotrauku_pastebejimai.join('; ')}`);
  if ((a.rizikos || []).length) eil.push(`Rizikos: ${a.rizikos.join('; ')}`);
  if (a.derybu_argumentai) eil.push(`Derybu argumentai: ${Array.isArray(a.derybu_argumentai) ? a.derybu_argumentai.join('; ') : a.derybu_argumentai}`);
  return eil.join('\n');
}

async function generuotiPalyginimoVerdikta(profiliai, metaSarasas) {
  const santraukos = profiliai.map((p, i) => profilioSantrauka(p, metaSarasas[i] || {}, i + 1)).join('\n\n');
  const prompt = `Esi patyres automobiliu vertintojas. Zemiau - ${profiliai.length} realiu skelbimu duomenys,
surinkti nuskaitant pilnus skelbimus ir isanalizavus visas nuotraukas.

${santraukos}

Palygink SIUOS automobilius TARPUSAVYJE ir pateik savo nuomone. Remkis TIK aukstciau pateiktais duomenimis -
nieko neprasimanyk. Jei kazko duomenyse nera, aiskiai pasakyk "duomenu nera", o ne spek.

Grazink TIK JSON (be markdown, be paaiskinimu aplink), tokios strukturos:
{
  "laimetojas": <automobilio numeris 1..${profiliai.length}, arba null jei duomenu nepakanka>,
  "laimetojo_pagrindimas": "<2-3 sakiniai, kodel butent sis. Konkretus skaiciai, ne bendros frazes>",
  "trumpas_verdiktas": "<1 sakinys - esme vienu sakiniu>",
  "palyginimas_pagal_kriterijus": [
    { "kriterijus": "Kaina vs rinka", "auto1": "<vertinimas>", "auto2": "<vertinimas>"${profiliai.length > 2 ? ', "auto3": "<vertinimas>"' : ''}, "pranasesnis": <1..${profiliai.length} arba null> },
    { "kriterijus": "Rida ir nusidevejimas", ... },
    { "kriterijus": "Technine bukle ir rizikos", ... },
    { "kriterijus": "Iranga ir komplektacija", ... },
    { "kriterijus": "Istorija ir skaidrumas", ... }
  ],
  "kam_kuris_tinka": [
    { "auto": 1, "kam": "<kokiam pirkejui butent sis tinka geriausiai>" },
    { "auto": 2, "kam": "<...>" }
  ],
  "ka_butina_patikrinti": ["<konkretus veiksmas pries perkant>", "..."],
  "issaugojimai": "<ka verta zinoti pries apsisprendziant - rizikos, kurios gali pakeisti sprendima>"
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });
  const tekstas = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const svarus = tekstas.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(svarus);
  } catch (e) {
    const m = svarus.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
    return { trumpas_verdiktas: svarus.slice(0, 400), laimetojas: null, palyginimas_pagal_kriterijus: [] };
  }
}

app.post('/api/compare-deep', requireAuth, async (req, res) => {
  const { autos } = req.body; // [{url, kaina, marketMedian, marketCount, diffPct, modelis, metai, rida, ...}]
  if (!Array.isArray(autos) || autos.length < 2) {
    return res.status(400).json({ error: 'Palyginimui reikia bent dvieju automobiliu.' });
  }
  if (autos.length > 3) {
    return res.status(400).json({ error: 'Vienu metu galima lyginti daugiausia tris automobilius.' });
  }
  try {
    // Abu (ar visi trys) nuskaitomi LYGIAGRECIAI - tai ilgiausiai trunkantis zingsnis.
    const profiliai = await Promise.all(autos.map((a) => paruostiPilnaProfili(a.url, {
      kaina: a.kaina, marketMedian: a.marketMedian, marketCount: a.marketCount,
      diffPct: a.diffPct, modelis: a.modelis, galia: a.galia, variklioTuris: a.variklioTuris,
    })));
    const verdiktas = await generuotiPalyginimoVerdikta(profiliai, autos);
    res.json({
      profiliai: profiliai.map((p, i) => ({
        url: p.url, title: p.title, photos: p.photos || [], vin: p.vin || null,
        pardavejas: p.pardavejas || null, analysis: p.analysis || null,
        isPodelio: p.isPodelio, meta: autos[i],
      })),
      verdiktas,
    });
  } catch (err) {
    console.error('compare-deep KLAIDA:', err);
    const aiKl = typeof aiKlaidosZinute === 'function' ? aiKlaidosZinute(err) : null;
    res.status(500).json({ error: aiKl ? aiKl.tekstas : String(err.message).slice(0, 200) });
  }
});

// VIN formato patikra: 17 simboliu, be I, O, Q. Neleidziam i sistema patekti
// blogai nuskaitytam kodui - geriau nerodyti nieko, nei rodyti klaidinga VIN.
// Sujungia VIN is skelbimo teksto ir is nuotraukos. Tekstas turi pirmenybe,
// bet kai jo nera, VIN is nuotraukos yra pilnavertis radinys - tik aiskiai
// pazymim saltini, kad vartotojas zinotu, is kur jis atsirado.
function sujungtiVin(vinIsTeksto, analysis) {
  if (vinIsTeksto) {
    return { vin: normalizuotiVin(vinIsTeksto), vinSaltinis: 'skelbimo tekstas', vinIsNuotraukos: false };
  }
  const isNuotr = analysis && analysis.vin_is_nuotraukos;
  if (arGaliojantisVin(isNuotr)) {
    return {
      vin: normalizuotiVin(isNuotr),
      vinSaltinis: (analysis.vin_nuotraukos_vieta || 'skelbimo nuotrauka'),
      vinIsNuotraukos: true,
    };
  }
  return { vin: null, vinSaltinis: null, vinIsNuotraukos: false };
}

function arGaliojantisVin(v) {
  if (!v || typeof v !== 'string') return false;
  const svarus = v.trim().toUpperCase().replace(/\s/g, '');
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(svarus);
}

function normalizuotiVin(v) {
  return String(v || '').trim().toUpperCase().replace(/\s/g, '');
}

// ============ AUTO ISTORIJOS SEKIMAS ============
// Atskira funkcija, nesusieta su megstamiausiais: sistema kaupia istorija apie
// KIEKVIENA kada nors matyta skelbima, o vartotojas gali paprasyti ja parodyti
// arba itraukti skelbima i kasdien tikrinamu sarasa.

// Suformuoja zmogui skaitoma istorijos santrauka + pastabas, kodel verta ziureti.
function sudarytiIstorijosSantrauka(url) {
  const ciklas = cache.gautiGyvavimoCikla(url);
  const laikoJuosta = cache.getListingTimeline(url);
  if (!ciklas && (!laikoJuosta || !laikoJuosta.length)) return null;

  const pastabos = [];
  let kainuPokytis = null;

  if (laikoJuosta && laikoJuosta.length >= 2) {
    const pirmas = laikoJuosta[0];
    const paskutinis = laikoJuosta[laikoJuosta.length - 1];
    const skirtumas = paskutinis.k - pirmas.k;
    const mazinimai = laikoJuosta.filter((t, i) => i > 0 && t.k < laikoJuosta[i - 1].k).length;
    kainuPokytis = {
      pradine: pirmas.k, dabartine: paskutinis.k, skirtumas,
      procentai: Math.round((skirtumas / pirmas.k) * 100),
      mazinimuKartai: mazinimai,
    };
    if (skirtumas < 0) {
      pastabos.push({
        tipas: 'kaina-mazinta', svarba: 'auksta',
        tekstas: `Kaina sumažinta ${Math.abs(skirtumas)}€ (nuo ${pirmas.k}€ iki ${paskutinis.k}€)` +
          (mazinimai > 1 ? `, jau ${mazinimai} kartus` : '') + '.',
        kodel: mazinimai > 1
          ? 'Kartotinis mažinimas rodo, kad pardavėjas skuba arba už šią kainą niekas neperka – stipri pozicija deryboms.'
          : 'Pardavėjas jau nusileido – tikėtina, kad nusileis dar.',
      });
    } else if (skirtumas > 0) {
      pastabos.push({
        tipas: 'kaina-didinta', svarba: 'vidutine',
        tekstas: `Kaina pakelta +${skirtumas}€.`,
        kodel: 'Neįprasta. Gali būti, kad skelbimas atnaujintas arba anksčiau buvo klaida.',
      });
    }
    const ridosPokytis = (paskutinis.r && pirmas.r) ? paskutinis.r - pirmas.r : 0;
    if (ridosPokytis > 500) {
      pastabos.push({
        tipas: 'rida-auga', svarba: 'vidutine',
        tekstas: `Rida padidėjo ${ridosPokytis} km (nuo ${pirmas.r} iki ${paskutinis.r} km).`,
        kodel: 'Automobilis vis dar naudojamas kasdien – tikrinkite, ar skelbime nurodyta rida atnaujinta.',
      });
    }
  }

  if (ciklas) {
    if (ciklas.dingo) {
      pastabos.push({
        tipas: 'dingo', svarba: 'auksta',
        tekstas: `Skelbimas dingo iš portalo po ${ciklas.dienosRinkoje} d.`,
        kodel: 'Tikėtina, kad automobilis parduotas arba nuimtas. Jei domino – jo greičiausiai nebėra.',
      });
    } else if (ciklas.dienosRinkoje >= 45) {
      pastabos.push({
        tipas: 'ilgai-kabo', svarba: 'auksta',
        tekstas: `Skelbimas rinkoje jau ${ciklas.dienosRinkoje} d.`,
        kodel: 'Ilgiau nei pusantro mėnesio be pirkėjo. Arba kaina per didelė, arba yra priežastis, kurios skelbime nematyti – verta klausti tiesiai.',
      });
    } else if (ciklas.dienosRinkoje >= 21) {
      pastabos.push({
        tipas: 'kabo', svarba: 'vidutine',
        tekstas: `Skelbimas rinkoje ${ciklas.dienosRinkoje} d.`,
        kodel: 'Trys savaitės be pirkėjo – yra vietos deryboms.',
      });
    } else if (ciklas.dienosRinkoje <= 2) {
      pastabos.push({
        tipas: 'sviezias', svarba: 'vidutine',
        tekstas: 'Skelbimas visai šviežias.',
        kodel: 'Geri pasiūlymai išgraibstomi per kelias dienas – jei tinka, nedelskite.',
      });
    }
  }

  return { url, ciklas, laikoJuosta: laikoJuosta || [], kainuPokytis, pastabos };
}

// Vieno skelbimo istorija
app.get('/api/listing-history', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Trūksta url parametro' });
  const santrauka = sudarytiIstorijosSantrauka(url);
  if (!santrauka) return res.json({ turimeDuomenu: false });
  res.json({ turimeDuomenu: true, ...santrauka });
});

// Modelio tendencijos ir sezoniskumas
app.get('/api/model-trends', (req, res) => {
  const modelis = req.query.modelis;
  if (!modelis) return res.status(400).json({ error: 'Trūksta modelis parametro' });
  res.json({
    modelis,
    tendencijos: cache.modelioTendencijos(modelis),
    pardavimoGreitis: cache.modelioPardavimoGreitis(modelis),
  });
});

// Frontend praneša, kuriuos skelbimus verta sekti (išsaugoti lieka naršyklėje)
app.post('/api/watch', (req, res) => {
  const { urls, meta } = req.body || {};
  if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls turi būti masyvas' });
  const nauji = cache.pridetiSekimui(urls.slice(0, 200), meta || null);
  res.json({ sekama: cache.sekamiUrlai().length, nauji });
});

// Kas pasikeitė nurodytiems skelbimams
app.post('/api/listing-changes', (req, res) => {
  const { urls } = req.body || {};
  if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls turi būti masyvas' });
  cache.pridetiSekimui(urls.slice(0, 200), null); // kartu itraukiam i sekima
  const rezultatai = urls.slice(0, 200).map((u) => sudarytiIstorijosSantrauka(u)).filter(Boolean);
  const suPokyciais = rezultatai.filter((r) => r.pastabos.some((p) => p.svarba === 'auksta'));
  res.json({ skelbimai: rezultatai, pokyciuSkaicius: suPokyciais.length });
});

// ---- KASDIENIS SEKAMU SKELBIMU TIKRINIMAS ----
// Kartą per parą pertikrinam sekamus skelbimus: ar kaina/rida pasikeitė, ar dar gyvas.
let _tikrinimasVyksta = false;

async function tikrintiSekamus() {
  if (_tikrinimasVyksta) return;
  _tikrinimasVyksta = true;
  const pasalinta = cache.valytiSekimoSarasa();
  const urls = cache.sekamiUrlai();
  console.log(`[SEKIMAS] Pradedam kasdienį tikrinimą: ${urls.length} skelbimų (pašalinta pasenusių: ${pasalinta})`);
  let pokyciu = 0, dingusiu = 0, klaidu = 0;

  for (const url of urls) {
    try {
      const { fullText, kaina, rida } = await patikrintiViena(url);
      if (fullText === null) {
        const d = cache.zymetiDingusi(url);
        if (d) { dingusiu++; console.log(`[SEKIMAS] Dingo: ${url} (kabojo ${d.dienosRinkoje} d.)`); }
      } else {
        cache.zymetiMatyta({ url, kaina, rida });
        if (kaina) {
          const priesTai = cache.getListingTimeline(url);
          const paskutine = priesTai.length ? priesTai[priesTai.length - 1].k : null;
          cache.recordListingSnapshot(url, kaina, rida);
          if (paskutine && paskutine !== kaina) {
            pokyciu++;
            console.log(`[SEKIMAS] Kainos pokytis: ${url} ${paskutine}€ -> ${kaina}€`);
          }
        }
      }
      cache.zymetiPatikrinta(url);
    } catch (e) {
      klaidu++;
    }
    await new Promise((r) => setTimeout(r, 1500)); // svelnus tempas portalams
  }
  cache.saveLifecycle();
  console.log(`[SEKIMAS] Baigta. Kainos pokyčių: ${pokyciu}, dingo: ${dingusiu}, klaidų: ${klaidu}`);
  _tikrinimasVyksta = false;
}

// Nuskaito viena skelbima ir istraukia kaina/rida. Grazina fullText=null, jei skelbimo nebera.
async function patikrintiViena(url) {
  try {
    const { fullText } = await scrapeSingleListing(url);
    if (!fullText || fullText.length < 200) return { fullText: null, kaina: null, rida: null };
    const kainaMatch = fullText.match(/(\d[\d\s]{3,8})\s*€/);
    const ridaMatch = fullText.match(/(\d[\d\s]{2,8})\s*km/i);
    const kaina = kainaMatch ? parseInt(kainaMatch[1].replace(/\s/g, ''), 10) : null;
    const rida = ridaMatch ? parseInt(ridaMatch[1].replace(/\s/g, ''), 10) : null;
    return { fullText, kaina: kaina && kaina > 300 ? kaina : null, rida };
  } catch (e) {
    if (/404|not found|nerast/i.test(String(e.message))) return { fullText: null, kaina: null, rida: null };
    throw e;
  }
}

// Paleidziam kas 24 val. Pirmas tikrinimas - po 10 min nuo starto, kad netrukdytu paleidimui.
const SEKIMO_INTERVALAS_MS = 24 * 60 * 60 * 1000;
setTimeout(() => {
  tikrintiSekamus().catch((e) => console.error('[SEKIMAS] klaida:', e.message));
  setInterval(() => {
    tikrintiSekamus().catch((e) => console.error('[SEKIMAS] klaida:', e.message));
  }, SEKIMO_INTERVALAS_MS);
}, 10 * 60 * 1000);

// Rankinis paleidimas (naudinga testuojant)
app.post('/api/run-tracking', requireAuth, (req, res) => {
  tikrintiSekamus().catch((e) => console.error('[SEKIMAS] klaida:', e.message));
  res.json({ paleista: true, sekama: cache.sekamiUrlai().length });
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
