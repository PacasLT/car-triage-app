// backend/otomoto.js — otomoto.pl SKELBIMO puslapio struktūra (v2.6.8, Z-94).
//
// Iki šiol otomoto skelbimas AI analizei ėjo tik kaip „pilnas puslapio tekstas":
// parametrai, įranga ir aprašymas buvo sumaišyti su meniu, reklama ir finansavimu.
// Puslapis yra Next.js SSR - `#__NEXT_DATA__` → props.pageProps.advert turi viską
// struktūriškai (patikrinta naršyklėje 2026-09-22, skelbimas 6150710642).
//
// Grąžina tą pačią formą, kaip `autopliusSkelbimoLaukai()` server.js - kad
// scrapeSingleListing() nereikėtų trečio kelio.

function beHtml(s) {
  return String(s || '')
    .replace(/<span[^>]*hiddenPhoneNumber[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/<li[^>]*>/gi, '\n• ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[─━]{5,}/g, '')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

function advertIsHtml(html) {
  const m = String(html || '').match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    const nd = JSON.parse(m[1]);
    return (nd && nd.props && nd.props.pageProps && nd.props.pageProps.advert) || null;
  } catch (e) { return null; }
}

function otomotoSkelbimoLaukai(html) {
  const tuscia = { rasta: false, pardavejoInfo: null, vinPilnas: null, vinPref: null, vinPaslėptas: false, istNuoroda: null, parametrai: {} };
  const ad = advertIsHtml(html);
  if (!ad) return tuscia;

  const parametrai = {};
  (ad.details || []).forEach((d) => {
    if (d && d.label && d.value != null && d.value !== '') parametrai[d.label] = String(d.value);
  });
  const iranga = (ad.equipment || []).map((g) => ({
    skiltis: g.label || null,
    items: (g.values || []).map((v) => v && v.label).filter(Boolean),
  })).filter((g) => g.items.length);

  const s = ad.seller || {};
  const loc = s.location || {};
  const vieta = [loc.city, loc.region].filter(Boolean).join(', ') || null;
  const vinD = (ad.details || []).find((d) => d && d.key === 'vin');
  const vin = vinD && /^[A-HJ-NPR-Z0-9]{17}$/i.test(String(vinD.value)) ? String(vinD.value).toUpperCase() : null;

  return {
    rasta: true,
    id: ad.id ? String(ad.id) : null,
    title: ad.title || null,
    parametrai,
    iranga,
    aprasymas: beHtml(ad.description).slice(0, 4000) || null,
    vieta,
    salis: loc.country || null,
    pardavejoInfo: {
      privatus: s.type ? s.type !== 'PROFESSIONAL' : null,
      vardas: s.name || null,
      vieta,
    },
    photos: ((ad.images && ad.images.photos) || []).map((p) => p && p.url).filter(Boolean),
    ikelta: ad.createdAt || null,
    kaina: ad.price && ad.price.value ? { suma: Number(ad.price.value), valiuta: ad.price.currency || 'PLN' } : null,
    vinPilnas: vin, vinPref: null, vinPaslėptas: false, istNuoroda: null,
  };
}

module.exports = { otomotoSkelbimoLaukai, beHtml };
