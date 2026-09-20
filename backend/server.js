// server.js
// Car Triage App - web interfeisas automobiliu arbitrazo paieskai.
// Priima filtrus is formos, sukuria paieskos URL abiem portalams, nuskaito,
// analizuoja su Claude, grazina rezultatus i naryklo.

require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
// v1.60.0 KLAIDA: `fs` cia niekada nebuvo ireikalautas, nors naudojamas 7 vietose.
// Visos jos apgaubtos try/catch, todel serveris nelūžo - tik TYLIAI nieko nedare:
// klaidu zurnalas niekada nebuvo irasytas i diska, nuotraukos neissaugotos,
// katalogas nesukurtas. Keturi pranesimai gyveno TIK atmintyje ir dingo per
// pirma perkrovima. Klaida matesi tik Railway zurnale: „fs is not defined".
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Anthropic = require('@anthropic-ai/sdk');
const cache = require('./cache');
const autopliusIds = require('./autoplius-ids');
const vinTikrinimas = require('./vin-tikrinimas');
const nuotrAnalize = require('./nuotrauku-analize');
const komplektacija = require('./komplektacija');
const { requireAuth, handleRegister, handleLogin, handleMe, planai, duomenys, verifyToken } = require('./auth');

const app = express();
// v1.54.0 KLAIDA, rasta per pati pranesimo mygtuka: „Uzklausa per didele".
// app.use(express.json()) turi NUTYLETA 100 KB riba ir veikia PIRMAS - tad
// marsruto lygio express.json({limit:'3mb'}) prie /api/klaida niekada
// nespedavo suveikti: kunas jau buvo atmestas su 413. Ekrano nuotrauka
// base64 pavidalu yra ~33 % didesne uz faila, tad bet kokia normali
// nuotrauka virsydavo riba.
// Sprendimas: platesnis analizatorius TIK siam keliui ir PRIES bendraji.
// body-parser pazymi req._body, tad bendrasis po to praleidzia.
app.use('/api/klaida', express.json({ limit: '6mb' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Netinkamas JSON kune (pvz. plika eilute vietoj objekto) - tvarkingas 400,
// o ne stack trace loge ir HTML klaidos puslapis klientui.
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'Netinkamas užklausos formatas (laukiamas JSON objektas)' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Užklausa per didelė' });
  }
  next(err);
});

// ── Auth endpoints ────────────────────────────────────────────────────────
app.post('/auth/register', handleRegister);
app.post('/auth/login', handleLogin);
app.get('/auth/me', requireAuth, handleMe);

// ── Planai ir kreditai ──────────────────────────────────────────────────────
app.get('/api/planas', requireAuth, (req, res) => {
  try { res.json(planai.busena(req.user)); }
  catch (e) { res.status(500).json({ error: 'Nepavyko gauti plano' }); }
});
app.get('/api/planas/zurnalas', requireAuth, (req, res) => {
  try { res.json({ irasai: planai.zurnalas(req.user.id, 50) }); }
  catch (e) { res.status(500).json({ error: 'Nepavyko gauti žurnalo' }); }
});

// ── Mėgstamiausi (DB, prie paskyros) ────────────────────────────────────────
// Prie kiekvieno išsaugoto skelbimo pridedam jo istoriją iš gyvavimo ciklo ir kainų
// laiko juostos: kada pastebėtas rinkoje, kada paskutinį kartą tikrintas, ar dingo,
// kaip pasikeitė kaina nuo pastebėjimo ir nuo išsaugojimo momento.
function megstamiSuIstorija(sarasas) {
  return (sarasas || []).map((f) => {
    let c = null, tl = [];
    try { c = cache.gautiGyvavimoCikla(f.url); tl = cache.getListingTimeline(f.url) || []; } catch (e) {}
    if (!c && !tl.length) return f;
    const pirmasTl = tl[0] || null, paskTl = tl.length ? tl[tl.length - 1] : null;
    const pirmaKaina = (c && c.pirmaKaina) || (pirmasTl && pirmasTl.k) || null;
    const dabartineKaina = (c && c.dabartineKaina) || (paskTl && paskTl.k) || null;
    const mazinimuKartai = tl.filter((t, i) => i > 0 && t.k < tl[i - 1].k).length;
    const pirmaRida = (c && c.pirmaRida) || (pirmasTl && pirmasTl.r) || null;
    const dabartineRida = (c && c.dabartineRida) || (paskTl && paskTl.r) || null;
    return {
      ...f,
      istorija: {
        pastebetas: (c && c.pirmaMatytas) || (pirmasTl && pirmasTl.t) || null,
        paskutinisPatikrinimas: (c && c.paskutinMatytas) || (paskTl && paskTl.t) || null,
        dienosRinkoje: c ? c.dienosRinkoje : null,
        kartuMatytas: c ? c.kartuMatytas : null,
        dingo: (c && c.dingo) || null,
        pirmaKaina, dabartineKaina,
        kainosPokytis: (pirmaKaina && dabartineKaina) ? dabartineKaina - pirmaKaina : 0,
        nuoIssaugojimo: (f.kaina && dabartineKaina) ? dabartineKaina - f.kaina : 0,
        mazinimuKartai,
        ridosPokytis: (pirmaRida && dabartineRida) ? dabartineRida - pirmaRida : 0,
        laikoJuosta: tl.slice(-12),
      },
    };
  });
}
app.get('/api/megstamiausi', requireAuth, (req, res) => {
  try {
    const sarasas = duomenys.megstamiausi(req.user.id);
    // Mėgstamiausi lieka kasdieniame sekime (kad kaina, rida ir būsena būtų šviežios)
    try { cache.pridetiSekimui(sarasas.map((f) => f.url), null); } catch (e) {}
    res.json({ sarasas: megstamiSuIstorija(sarasas) });
  } catch (e) { res.status(500).json({ error: 'Nepavyko įkelti' }); }
});
app.post('/api/megstamiausi', requireAuth, (req, res) => {
  try {
    const sarasas = duomenys.pridetiMegstama(req.user.id, req.body || {});
    try { if (req.body && req.body.url) cache.pridetiSekimui([String(req.body.url)], null); } catch (e) {}
    res.json({ sarasas: megstamiSuIstorija(sarasas) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/megstamiausi', requireAuth, (req, res) => {
  try {
    const url = (req.body && req.body.url) || req.query.url;
    if (!url) return res.status(400).json({ error: 'Trūksta url' });
    res.json({ sarasas: megstamiSuIstorija(duomenys.pasalintiMegstama(req.user.id, url)) });
  } catch (e) { res.status(500).json({ error: 'Nepavyko pašalinti' }); }
});

// ── Ataskaitos (viskas, kas sugeneruota už kreditus) ─────────────────────────
app.get('/api/ataskaitos', requireAuth, (req, res) => {
  try { res.json({ sarasas: duomenys.ataskaitos(req.user.id, req.query.tipas || null) }); }
  catch (e) { res.status(500).json({ error: 'Nepavyko įkelti' }); }
});
app.get('/api/ataskaitos/:id', requireAuth, (req, res) => {
  try {
    const a = duomenys.ataskaita(req.user.id, parseInt(req.params.id, 10));
    if (!a) return res.status(404).json({ error: 'Nerasta' });
    res.json(a);
  } catch (e) { res.status(500).json({ error: 'Nepavyko įkelti' }); }
});
app.delete('/api/ataskaitos/:id', requireAuth, (req, res) => {
  try { res.json({ ok: duomenys.pasalintiAtaskaita(req.user.id, parseInt(req.params.id, 10)) }); }
  catch (e) { res.status(500).json({ error: 'Nepavyko pašalinti' }); }
});

// ── Administravimas (ADMIN_EMAILS env) ──────────────────────────────────────
app.get('/admin/vartotojai', requireAuth, planai.reikalautiAdmin, (req, res) => {
  try { res.json({ vartotojai: planai.visiVartotojai() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/admin/planas', requireAuth, planai.reikalautiAdmin, (req, res) => {
  try {
    const { email, planas, iki } = req.body || {};
    res.json({ ok: true, busena: planai.nustatytiPlana(email, planas, iki, req.user.email) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/admin/kreditai', requireAuth, planai.reikalautiAdmin, (req, res) => {
  try {
    const { email, kiekis, pastaba } = req.body || {};
    res.json({ ok: true, busena: planai.pridetiKreditu(email, kiekis, pastaba, req.user.email) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
// ── KLAIDU PRANESIMAI (v1.49.0) ─────────────────────────────────────────────
// Zmogus paspaudzia mygtuka bet kuriame puslapyje, paraso sakini, o narsykle
// prideda diagnostika: versija, ekrano plotis, paskutines JS klaidos ir
// nepavykusios uzklausos. Nuotrauka - pasirinktinai.
//
// AUTENTIFIKACIJOS NEREIKALAUJAM samoningai: dazniausia vieta, kur reikia
// pranesti, yra pats prisijungimas. Vietoj to - griezti dydzio ir tempo limitai.
//
// RIBOS NUO PIRMOS DIENOS: 200 naujausiu irasu, nuotraukos atskirais failais.
// Sioje sistemoje jau du kartus neribotas augimas buvo problema - nekartojam.
const KLAIDU_FAILAS = path.join(cache.DATA_DIR, 'klaidu-zurnalas.json');
const KLAIDU_FOTO_KAT = path.join(cache.DATA_DIR, 'klaidu-foto');
const KLAIDU_RIBA = 200;
const KLAIDOS_MAX_FOTO = 1.6 * 1024 * 1024;   // base64 su atsarga
const KLAIDOS_TEMPAS = { langasMs: 10 * 60 * 1000, kiek: 5 };
const _klaiduTempas = new Map();               // ip -> [laikai]

// v1.51.0. Kiekviena busena atsako i viena klausima: KIENO dabar ejimas.
// Dvieju („nauja / sutvarkyta") buvo per mazai: is sesiu dizainerio radiniu
// penki NEPASITVIRTINO - jie jau buvo sutvarkyti. Tokio radinio nei istrinsi
// (pamirsi, kad buvo tikrintas), nei pazymesi sutvarkytu (melas).
// Ir „pataisyta" NEREISKIA „veikia produkcijoje" - todel yra atskira
// „laukia-patikros", kuri is saraso nedingsta, kol Lukas nepatvirtina.
const KLAIDU_BUSENOS = {
  'rasta':            { uzdaryta: false, ejimas: 'claude' },
  'patvirtinta':      { uzdaryta: false, ejimas: 'claude' },
  'nepasitvirtino':   { uzdaryta: true,  ejimas: null },
  'tvarkoma':         { uzdaryta: false, ejimas: 'claude' },
  'laukia-patikros':  { uzdaryta: false, ejimas: 'lukas' },
  'sutvarkyta':       { uzdaryta: true,  ejimas: null },
  'atideta':          { uzdaryta: false, ejimas: 'claude' },
};

let _klaidos = (() => {
  try { return JSON.parse(fs.readFileSync(KLAIDU_FAILAS, 'utf-8')) || []; } catch { return []; }
})();
try { fs.mkdirSync(KLAIDU_FOTO_KAT, { recursive: true }); } catch (e) {}

function issaugotiKlaidas() {
  try { fs.writeFileSync(KLAIDU_FAILAS, JSON.stringify(_klaidos)); }
  catch (e) { console.error('[KLAIDOS] nepavyko issaugoti:', e.message); }
}

app.post('/api/klaida', (req, res) => {
  try {
    const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || 'nezinomas';
    const dabar = Date.now();
    const laikai = (_klaiduTempas.get(ip) || []).filter((t) => dabar - t < KLAIDOS_TEMPAS.langasMs);
    if (laikai.length >= KLAIDOS_TEMPAS.kiek) {
      return res.status(429).json({ error: 'Per daug pranesimu is eiles. Pabandykite po keliu minuciu.' });
    }
    laikai.push(dabar);
    _klaiduTempas.set(ip, laikai);

    const kunas = req.body || {};
    const tekstas = String(kunas.tekstas || '').trim().slice(0, 2000);
    if (tekstas.length < 5) return res.status(400).json({ error: 'Per trumpas aprasymas.' });

    const nr = (_klaidos.length ? (_klaidos[_klaidos.length - 1].nr || 0) : 0) + 1;

    // Nuotrauka i atskira faila - i JSON jos nededam, kitaip zurnalas issipustu.
    let fotoFailas = null;
    const foto = typeof kunas.foto === 'string' ? kunas.foto : null;
    if (foto && /^data:image\/(png|jpe?g|webp);base64,/.test(foto) && foto.length <= KLAIDOS_MAX_FOTO) {
      try {
        const pletinys = foto.slice(11, foto.indexOf(';')).replace('jpeg', 'jpg');
        const baitai = Buffer.from(foto.slice(foto.indexOf(',') + 1), 'base64');
        fotoFailas = `k${nr}.${pletinys}`;
        fs.writeFileSync(path.join(KLAIDU_FOTO_KAT, fotoFailas), baitai);
      } catch (e) { fotoFailas = null; }
    }

    // Kas pranese - tik jei zetonas galioja. Be jo pranesimas vis tiek priimamas.
    let kas = null;
    try {
      const h = String(req.headers.authorization || '');
      if (h.startsWith('Bearer ')) {
        const v = verifyToken(h.slice(7));
        if (v) kas = (typeof v === 'string' ? v : v.email) || null;
      }
    } catch (e) {}

    const KAT = ['dizainas', 'negyvas', 'duomenys', 'kreditai', 'greitis', 'prisijungimas'];
    const SV = ['blokuoja', 'trukdo', 'smulkme'];
    _klaidos.push({
      nr, laikas: dabar, kas, ip: ip.slice(0, 45),
      kategorija: KAT.indexOf(kunas.kategorija) >= 0 ? kunas.kategorija : 'kita',
      svarba: SV.indexOf(kunas.svarba) >= 0 ? kunas.svarba : 'trukdo',
      kartojasi: !!kunas.kartojasi,
      // v1.58.0: is narsykles eiles. Rodo, kad pranesimas veluoja - laikas
      // `laikas` yra GAVIMO, o ne ivykio. Be sios zymos diagnostika meluoja.
      // v1.69.0: trys laukai, kurie atsako i pirmus tris klausimus, kuriuos
      // sau uzduodu skaitydamas pranesima.
      perkrovus: !!kunas.perkrovus,
      kada: ['siandien','savaite','seniai'].indexOf(kunas.kada) >= 0 ? kunas.kada : null,
      vieta: (kunas.vieta && typeof kunas.vieta === 'object') ? {
        elementas: String(kunas.vieta.elementas || '').slice(0, 200),
        tekstas: String(kunas.vieta.tekstas || '').slice(0, 80),
        dydis: String(kunas.vieta.dydis || '').slice(0, 20),
        vieta: String(kunas.vieta.vieta || '').slice(0, 20),
      } : null,
      persiustas: !!kunas.persiustas,
      fotoNumesta: !!kunas.fotoNumesta,
      turejoRodyti: kunas.turejoRodyti ? String(kunas.turejoRodyti).slice(0, 500) : null,
      tekstas, foto: fotoFailas,
      diagnostika: kunas.diagnostika || null,
      busena: 'rasta',
      istorija: [{ laikas: dabar, busena: 'rasta', kas: kas || 'pranesejas' }],
    });
    if (_klaidos.length > KLAIDU_RIBA) {
      const ismetami = _klaidos.splice(0, _klaidos.length - KLAIDU_RIBA);
      ismetami.forEach((k) => {
        if (k.foto) { try { fs.unlinkSync(path.join(KLAIDU_FOTO_KAT, k.foto)); } catch (e) {} }
      });
    }
    issaugotiKlaidas();
    console.log(`[KLAIDOS] Nr.${nr} nuo ${kas || ip}: ${tekstas.slice(0, 80)}`);
    res.json({ ok: true, nr });
  } catch (e) {
    console.error('[KLAIDOS]', e.message);
    res.status(500).json({ error: 'Nepavyko priimti pranesimo.' });
  }
});

// ── v1.55.0: prieiga prie klaidu saraso be narsykles ─────────────────────────
// Kam: klaidu sarasa turi matyti ne tik zmogus narsykleje, bet ir Claude, kuris
// tas klaidas taiso. Kitaip pranesimas keliauja per ekranvaizdzius ir perrasyma,
// ir puse diagnostikos (selektoriai, uzklausos, veiksmu seka) pakeliui dingsta.
//
// Kaip: antraste `X-Klaidu-Raktas`, reiksme is `KLAIDU_RAKTAS` (TIK Railway
// Variables ir vietinis backend/.env, niekada i koda ar GitHub). Jei raktas
// nenustatytas arba trumpesnis nei 32 simboliai - antraste nepriimama visai,
// t. y. numatytoji bukle yra „isjungta", ne „silpna".
//
// Ko raktas NEGALI: istrinti iraso (DELETE lieka tik zetonui) ir prieiti prie
// vartotoju, planu ar kreditu. Tik klaidos ir matavimai.
const KLAIDU_RAKTAS = process.env.KLAIDU_RAKTAS || '';
if (KLAIDU_RAKTAS && KLAIDU_RAKTAS.length < 32) {
  console.warn('[KLAIDOS] KLAIDU_RAKTAS per trumpas (<32), antraste NEPRIIMAMA.');
}
function raktasSutampa(gautas) {
  if (!gautas || KLAIDU_RAKTAS.length < 32) return false;
  const a = Buffer.from(String(gautas));
  const b = Buffer.from(KLAIDU_RAKTAS);
  if (a.length !== b.length) return false;          // timingSafeEqual reikalauja vienodo ilgio
  return crypto.timingSafeEqual(a, b);
}
function klaiduPrieiga(req, res, next) {
  if (raktasSutampa(req.get('X-Klaidu-Raktas'))) {
    req.user = { email: 'raktas', tikRaktas: true };
    return next();
  }
  return requireAuth(req, res, (e) => (e ? next(e) : planai.reikalautiAdmin(req, res, next)));
}

// Sarasas man/administratoriui. GET, nemokamas.
app.get('/admin/klaidos', klaiduPrieiga, (req, res) => {
  const kiek = Math.min(parseInt(req.query.kiek, 10) || 50, KLAIDU_RIBA);
  const beDiag = req.query.trumpai === '1';
  const arUzdaryta = (k) => !!(KLAIDU_BUSENOS[k.busena] || {}).uzdaryta;

  // Pagal nutylejima rodom TIK atviras. ?visi=1 - viskas, ?busena= - konkreti.
  let sar = req.query.visi === '1' ? _klaidos.slice() : _klaidos.filter((k) => !arUzdaryta(k));
  if (req.query.busena) sar = sar.filter((k) => k.busena === req.query.busena);
  if (req.query.kategorija) sar = sar.filter((k) => k.kategorija === req.query.kategorija);
  if (req.query.svarba) sar = sar.filter((k) => k.svarba === req.query.svarba);

  // „laukia-patikros" visada virsuje: tai vienintele busena, kur laukiama Luko.
  const sv = { blokuoja: 0, trukdo: 1, smulkme: 2 };
  sar.sort((a, b) => {
    const la = a.busena === 'laukia-patikros' ? 0 : 1;
    const lb = b.busena === 'laukia-patikros' ? 0 : 1;
    return (la - lb) || (sv[a.svarba] - sv[b.svarba]) || (b.laikas - a.laikas);
  });

  const pagalBusena = {};
  _klaidos.forEach((k) => { pagalBusena[k.busena] = (pagalBusena[k.busena] || 0) + 1; });

  res.json({
    viso: _klaidos.length,
    atviru: _klaidos.filter((k) => !arUzdaryta(k)).length,
    lauksiaJusu: _klaidos.filter((k) => k.busena === 'laukia-patikros').length,
    pagalBusena,
    galimosBusenos: Object.keys(KLAIDU_BUSENOS),
    riba: KLAIDU_RIBA,
    irasai: sar.slice(0, kiek).map((k) => (beDiag
      ? { nr: k.nr, laikas: k.laikas, kas: k.kas, kategorija: k.kategorija, svarba: k.svarba,
          kartojasi: k.kartojasi, tekstas: k.tekstas, foto: !!k.foto, busena: k.busena,
          komentaru: (k.komentarai || []).length }
      : k)),
  });
});

// Busenos keitimas. Kiekvienas perjungimas iraso KAS, KADA, KOKIA VERSIJA ir
// PASTABA - taip matosi visas kelias, o ne tik galutine bukle. Butent to truko,
// kai dizaineris klause, ar jo radinys jau padarytas.
app.post('/admin/klaidos/:nr/busena', klaiduPrieiga, (req, res) => {
  const k = _klaidos.find((x) => x.nr === parseInt(req.params.nr, 10));
  if (!k) return res.status(404).json({ error: 'Nera' });
  const nauja = String((req.body && req.body.busena) || '').trim();
  if (!KLAIDU_BUSENOS[nauja]) {
    return res.status(400).json({ error: 'Nezinoma busena', galimos: Object.keys(KLAIDU_BUSENOS) });
  }
  const irasas = {
    laikas: Date.now(), busena: nauja, kas: req.user.email,
    pastaba: req.body && req.body.pastaba ? String(req.body.pastaba).slice(0, 300) : null,
    versija: req.body && req.body.versija ? String(req.body.versija).slice(0, 20) : null,
  };
  k.busena = nauja;
  (k.istorija = k.istorija || []).push(irasas);
  if (k.istorija.length > 20) k.istorija.splice(0, k.istorija.length - 20);
  issaugotiKlaidas();
  res.json({
    ok: true, nr: k.nr, busena: k.busena, kelias: k.istorija.map((x) => x.busena).join(' \u2192 '),
    atviru: _klaidos.filter((x) => !(KLAIDU_BUSENOS[x.busena] || {}).uzdaryta).length,
  });
});

// KOMENTARAI (v1.80.0). Lukas, tikrindamas pataisyma, dazniausiai turi ne
// nauja klaida, o TA PACIA su papildoma pastaba: „beveik, bet apacioje dar".
// Iki siol jam likdavo du blogi pasirinkimai - kurti antra pranesima (ir
// isskaidyti istorija) arba nerasyti nieko. Dabar rasoma i ta pati irasa.
//
// BUSENA KEICIASI PATI: jei irasas buvo `laukia-patikros` (t.y. mano ejimas
// jau buvo padarytas ir laukiau Luko), jo komentaras reiskia „neuzdaryta" -
// grazinam i `patvirtinta`, kad vel butu mano ejimas. Kitose busenose
// komentaras busenos nekeicia: ten ejimas ir taip ne Luko.
app.post('/admin/klaidos/:nr/komentaras', klaiduPrieiga, (req, res) => {
  const k = _klaidos.find((x) => x.nr === parseInt(req.params.nr, 10));
  if (!k) return res.status(404).json({ error: 'Nera' });
  const tekstas = String((req.body && req.body.tekstas) || '').trim();
  if (!tekstas) return res.status(400).json({ error: 'Tuscias komentaras' });

  const busenaPries = k.busena;
  (k.komentarai = k.komentarai || []).push({
    laikas: Date.now(),
    kas: req.user.email,
    tekstas: tekstas.slice(0, 2000),
    busena: busenaPries,
  });
  if (k.komentarai.length > 50) k.komentarai.splice(0, k.komentarai.length - 50);

  let pakeista = null;
  if (busenaPries === 'laukia-patikros') {
    k.busena = 'patvirtinta';
    pakeista = 'patvirtinta';
    (k.istorija = k.istorija || []).push({
      laikas: Date.now(), busena: 'patvirtinta', kas: req.user.email,
      pastaba: 'Komentaras tikrinant: ' + tekstas.slice(0, 200), versija: null,
    });
    if (k.istorija.length > 20) k.istorija.splice(0, k.istorija.length - 20);
  }
  issaugotiKlaidas();
  res.json({
    ok: true, nr: k.nr, busena: k.busena, busenaPakeista: pakeista,
    komentaru: k.komentarai.length,
    atviru: _klaidos.filter((x) => !(KLAIDU_BUSENOS[x.busena] || {}).uzdaryta).length,
  });
});

// Senasis kelias lieka kaip trumpinys - kad niekas nesulustu.
app.post('/admin/klaidos/:nr/sutvarkyta', klaiduPrieiga, (req, res) => {
  const k = _klaidos.find((x) => x.nr === parseInt(req.params.nr, 10));
  if (!k) return res.status(404).json({ error: 'Nera' });
  k.busena = 'sutvarkyta';
  (k.istorija = k.istorija || []).push({
    laikas: Date.now(), busena: 'sutvarkyta', kas: req.user.email,
    versija: req.body && req.body.versija ? String(req.body.versija).slice(0, 20) : null, pastaba: null,
  });
  issaugotiKlaidas();
  res.json({ ok: true, nr: k.nr, busena: k.busena,
    atviru: _klaidos.filter((x) => !(KLAIDU_BUSENOS[x.busena] || {}).uzdaryta).length });
});

// Visiskas istrynimas kartu su nuotrauka. Naudoti tada, kai iraso nebereikia
// visai - pvz. testinis pranesimas. Sutvarkytos klaidos is saraso dingsta
// pacios, tad trinti ju nebutina: tekstas pravercia, jei tas pats pasikartotu.
// TYCIA be `klaiduPrieiga`: trynimas negriztamas, tad tik zmogus su zetonu.
app.delete('/admin/klaidos/:nr', requireAuth, planai.reikalautiAdmin, (req, res) => {
  const i = _klaidos.findIndex((x) => x.nr === parseInt(req.params.nr, 10));
  if (i < 0) return res.status(404).json({ error: 'Nera' });
  const [k] = _klaidos.splice(i, 1);
  if (k.foto) { try { fs.unlinkSync(path.join(KLAIDU_FOTO_KAT, k.foto)); } catch (e) {} }
  issaugotiKlaidas();
  res.json({ ok: true, istrinta: k.nr, viso: _klaidos.length });
});

// Viena nuotrauka pagal numeri.
app.get('/admin/klaidos/:nr/foto', klaiduPrieiga, (req, res) => {
  const k = _klaidos.find((x) => x.nr === parseInt(req.params.nr, 10));
  if (!k || !k.foto) return res.status(404).json({ error: 'Nera' });
  res.sendFile(path.join(KLAIDU_FOTO_KAT, k.foto));
});

// v1.47.0: atsarginiu nuskaitymo keliu statistika. GET, nemokamas, tik adminui.
// Klausimas, i kuri atsako: ar Puppeteer produkcijoje kada nors suveikia.
// v1.60.0: kur GULI duomenys ir ar tai islieka po deploy'aus. Pridėta todel,
// kad keturi klaidu pranesimai dingo per deploy'u, o is israso nebuvo kaip
// pasakyti, ar tai Volume problema, ar kas kita. Spejimas cia netinka.
const saugykla = () => {
  let dydis = null, yra = false;
  try { const st = fs.statSync(KLAIDU_FAILAS); yra = true; dydis = st.size; } catch (e) {}
  return {
    katalogas: cache.DATA_DIR,
    saltinis: cache.DATA_SALTINIS,
    persistentinis: cache.DATA_PERSISTENTINIS,
    klaiduFailas: KLAIDU_FAILAS,
    klaiduFailasYra: yra,
    klaiduFailoDydis: dydis,
    klaiduAtmintyje: _klaidos.length,
    kaupyklos: (function () { try { return cache.kaupykluSuvestine(); } catch (e) { return null; } })(),
    ispejimas: cache.DATA_PERSISTENTINIS ? null
      : 'DUOMENYS KONTEINERIO VIDUJE - kiekvienas deploy juos istrina. Reikia Railway Volume ties /data arba DATA_DIR kintamojo.',
  };
};
app.get('/admin/atsarga', klaiduPrieiga, (req, res) => {
  const val = Math.round((Date.now() - ATSARGA.nuo) / 3600000 * 10) / 10;
  const p = ATSARGA.puppeteer;
  res.json(Object.assign({ saugykla: saugykla() }, {
    nuoPaleidimoVal: val,
    paieskosPuslapiai: ATSARGA.paieska,
    skelbimuPuslapiai: ATSARGA.skelbimas,
    puppeteer: p,
    isvada: p.pasiektas === 0
      ? 'Puppeteer nebuvo pasiektas ne karto - ScraperAPI ir axios uztenka.'
      : p.pavyko === 0
        ? 'Puppeteer pasiektas, bet NE KARTO nepavyko - jis tik verčia vieną klaidą kita.'
        : `Puppeteer pavyko ${p.pavyko} is ${p.pasiektas} kartu - atsarginis kelias realiai veikia.`,
  }));
});


app.get('/admin/zurnalas', requireAuth, planai.reikalautiAdmin, (req, res) => {
  try {
    const id = parseInt(req.query.userId, 10);
    if (!id) return res.status(400).json({ error: 'Trūksta userId' });
    res.json({ irasai: planai.zurnalas(id, 100) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5';
// Pigus modelis paprastoms uzduotims (vieno sakinio santrauka is paruosto konteksto)
const KOMENTARU_MODEL = process.env.KOMENTARU_MODEL || 'claude-haiku-4-5';
// Kiek nuotrauku siusti vizualinei analizei. Kiekviena ~1500 tokenu.
const DEEP_FOTO_KIEKIS = parseInt(process.env.DEEP_FOTO_KIEKIS || '6', 10);
// v1.23.0 SANAUDOS: struktūriniai skelbimo laukai (lentele, iranga, pardavejas, aprasymas)
// dabar eina PIRMI, todel zalio puslapio teksto nebereikia 12 000 simboliu - 4 000 uztenka
// kontekstui, o AI iejimo tokenu sumazeja maždaug per puse.
const TEKSTO_RIBA = parseInt(process.env.SKELBIMO_TEKSTO_RIBA || '4000', 10);
// Ta pati skelbima analizuojam is naujo tik jei praejo 7 d. arba pasikeite kaina.
const ANALIZES_PODELIS_MS = parseInt(process.env.ANALIZES_PODELIS_D || '7', 10) * 24 * 60 * 60 * 1000;
// Kiek geriausiu skelbimu papildomai atidarom paieskos metu (iranga, VIN, vieta).
const GILINTI_TOP = parseInt(process.env.GILINTI_TOP || '8', 10);

// ============ SCRAPING (ta pati logika kaip triage.js) ============

// ── ATSARGINIU KELIU MATAVIMAS (v1.47.0) ────────────────────────────────────
// Klausimas, kuri reikia atsakyti duomenimis, o ne nuomone: ar Puppeteer
// produkcijoje apskritai kada nors suveikia? Jis pasiekiamas TIK tada, kai
// nepavyko ir ScraperAPI, ir tiesioginis axios. Jei jis arba niekada
// nepasiekiamas, arba visada meta klaida (Railway image'e Chromium gali
// nebuti) - ji galima isimti kartu su 4 high lygio spragomis ir ~300 MB.
//
// Skaitliukai atmintyje, matomi per GET /admin/atsarga. Perkrovus - is nulio.
const ATSARGA = {
  nuo: Date.now(),
  paieska:   { talpykla: 0, scraperapi: 0, axios: 0, puppeteer: 0 },
  skelbimas: { talpykla: 0, scraperapi: 0, puppeteer: 0, atsarginis: 0 },
  puppeteer: { pasiektas: 0, pavyko: 0, nepavyko: 0, klaidos: {} },
};
function atsargaKlaida(zinute) {
  const k = String(zinute || '').slice(0, 120);
  ATSARGA.puppeteer.klaidos[k] = (ATSARGA.puppeteer.klaidos[k] || 0) + 1;
}

async function fetchWithPuppeteer(url) {
  ATSARGA.puppeteer.pasiektas++;
  console.log(`[ATSARGA] Puppeteer pasiektas (${ATSARGA.puppeteer.pasiektas} k.): ${url.slice(0, 70)}`);
  const pradzia = Date.now();
  try {
    const h = await _fetchWithPuppeteer(url);
    ATSARGA.puppeteer.pavyko++;
    console.log(`[ATSARGA] Puppeteer PAVYKO per ${Math.round((Date.now() - pradzia) / 1000)} s (${h ? h.length : 0} simboliu)`);
    return h;
  } catch (e) {
    ATSARGA.puppeteer.nepavyko++;
    atsargaKlaida(e && e.message);
    console.log(`[ATSARGA] Puppeteer NEPAVYKO per ${Math.round((Date.now() - pradzia) / 1000)} s: ${e && e.message}`);
    throw e;
  }
}

async function _fetchWithPuppeteer(url) {
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
    ATSARGA.paieska.talpykla++;
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
        ATSARGA.paieska.scraperapi++;
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
      if (response.status === 200) { html = response.data; ATSARGA.paieska.axios++; }
    } catch (err) {
      // tesiame prie Puppeteer
    }
  }

  // 3. Puppeteer (paskutinis variantas)
  if (!html) { html = await fetchWithPuppeteer(url); ATSARGA.paieska.puppeteer++; }

  cache.setCached('pages', url, html);
  return html;
}

// ── C-2 (revizija 2026-09-20): leidziamu portalu sarasas ──────────────────
// Iki siol `/api/analyze-single` (ir kiti keliai, einantys per
// scrapeSingleListing) imdavo `url` is kuno be jokios patikros ir perduodavo ji
// skaitytuvui. Prisijunges naudotojas galejo priversti serveri kreiptis i
// vidinius Railway adresus, o turinys grizdavo AI analizeje.
//
// Sargas dedamas NE i viena marsruta, o i `fetchListingPage` - pro ji eina
// VISI keliai (analyze-single, vin, pardavejas, palyginimas). Vienos vietos
// taisymas cia butu buves pusė darbo.
//
// Vidines uzklausos (buildAutopliusUrl ir kt.) eina per `fetchSearchPage` ir
// sio sargo neliecia.
const LEIDZIAMI_PORTALAI = [
  'autoplius.lt', 'autogidas.lt', 'autoscout24.com', 'otomoto.pl',
];

function portalasLeidziamas(url) {
  let h;
  try { h = new URL(String(url)).hostname.toLowerCase(); } catch (e) { return false; }
  if (h.charAt(h.length - 1) === '.') h = h.slice(0, -1);
  return LEIDZIAMI_PORTALAI.some((p) => h === p || h.endsWith('.' + p));
}

// Specialiai skelbimo puslapiui - naudoja render=true, kad gautume JS-renderinta HTML
// (galeriją, lazy-loaded nuotraukų src). Brangiau ScraperAPI kreditais, bet tik TOP 5.
async function fetchListingPage(url) {
  // C-2: pirma - ar adresas is leidziamo portalo. Tik protokolas http(s):
  // `file:`, `gopher:` ir panasus cia neturi ko veikti.
  const proto = (() => { try { return new URL(String(url)).protocol; } catch (e) { return null; } })();
  if ((proto !== 'http:' && proto !== 'https:') || !portalasLeidziamas(url)) {
    const e = new Error('Neleistinas portalas');
    e.kodas = 'PORTALAS_NELEIDZIAMAS';
    throw e;
  }

  // PATAISYTA: fetchSearchPage rase i ta pati rakta neatvaizduota HTML, todel
  // giliai analizei kartais atitekdavo puslapis be galerijos ir nuotrauku nebudavo.
  const cached = cache.getCached('pages', 'full:' + url, cache.PAGE_TTL_MS);
  if (cached) {
    ATSARGA.skelbimas.talpykla++;
    console.log(`  (talpykla: ${url.slice(0, 60)}...)`);
    return cached;
  }

  const SCRAPER_KEY = process.env.SCRAPER_API_KEY;
  let html;

  // PATAISYTA: anksciau VISADA render=true (~10 kreditu) - net LT portalams,
  // kuriu nuotrauku sarasas guli JSON-LD / inline <script> masyve ir JS jam
  // nereikalingas. Dabar: pirma bandom pigiai (1 kreditas), ir tik jei nuotrauku
  // pedsaku HTML'e nerandam - kartojam su render=true. Blogiausiu atveju
  // kaina ta pati kaip anksciau, geriausiu - 10 kartu mazesne.
  const turiNuotrauku = (h) => !!h && (
    /"contentUrl"|"image"\s*:|data-src=|og:image|thumbnail/i.test(h.slice(0, 400000))
  );
  const traukti = async (render) => {
    const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}&render=${render}`;
    console.log(`  ScraperAPI (render=${render}): ${url.slice(0, 60)}...`);
    const response = await axios.get(scraperUrl, { timeout: render === 'true' ? 90000 : 45000 });
    if (response.status === 200 && response.data && response.data.length > 500) return response.data;
    return null;
  };

  if (SCRAPER_KEY) {
    const visadaRender = /otomoto\.pl|autoscout24\./i.test(url);
    if (!visadaRender) {
      try {
        const pigus = await traukti('false');
        if (turiNuotrauku(pigus)) {
          html = pigus;
          console.log(`  ScraperAPI OK pigiuoju budu (${html.length} simboliu)`);
        } else if (pigus) {
          console.log('  Pigiajame HTML nuotrauku nerasta - kartojam su render=true');
        }
      } catch (err) {
        console.log(`  ScraperAPI render=false klaida: ${String(err.message).replace(SCRAPER_KEY, '***')}`);
      }
    }
    if (!html) {
      try {
        html = await traukti('true');
        if (html) console.log(`  ScraperAPI OK (${html.length} simboliu)`);
      } catch (err) {
        console.log(`  ScraperAPI render=true klaida: ${String(err.message).replace(SCRAPER_KEY, '***')}`);
      }
    }
  }

  if (html) ATSARGA.skelbimas.scraperapi++;

  // Atsarginis: Puppeteer (jei ScraperAPI neprieinamas)
  // ZINOMA SPRAGA (rasta v1.47.0, netaisyta samoningai iki matavimo pabaigos):
  // jei fetchWithPuppeteer META klaida, ji keliauja auksciau ir zemiau esanti
  // "paskutine atsarga" NIEKADA nepasiekiama. T. y. eilute po sios veikia tik
  // tada, kai Puppeteer grazina tuscia - o ne tada, kai jis luzta.
  if (!html) { html = await fetchWithPuppeteer(url); if (html) ATSARGA.skelbimas.puppeteer++; }
  // Paskutinis atsarginis: paprasta uzklasa
  if (!html) { html = await fetchSearchPage(url); if (html) ATSARGA.skelbimas.atsarginis++; }

  cache.setCached('pages', 'full:' + url, html);
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

// ── AUTOPLIUS: STRUKTURINIS SARASO NUSKAITYMAS ──────────────────────────────
// Anksciau skelbimas buvo verciamas i viena teksto eilute ir laukai traukiami regexais -
// modelis issikreipdavo ("10 Pries 18 val. BMW"), pasiskelbimo data ir mokamas iskelimas
// dingdavo, o 5 500 € kaina ir 5 500 €/men lizingo imoka atrodydavo vienodai.
// Dabar imame tiesiai is DOM: autoplius saraso kortele turi stabilias klases.

// "Prieš 18 val." / "Prieš 1 d." / "Prieš 25 min." -> laiko zyme (ms)
// v1.33.0: dienosRinkoje - SKAICIUS, ne tekstas. Kortelė pagal ji sprendzia,
// ar skelbimas „visai sviezias" (<=2 d.) ar „uzsibuves" (>=30 d.). Tekstinis
// ikeltaTekstas („Pries 5 val.") slenksciams netinka.
function dienosNuo(ms) {
  if (!ms || !Number.isFinite(ms)) return null;
  const d = Math.floor((Date.now() - ms) / 86400000);
  return d >= 0 && d < 3650 ? d : null;
}

function autopliusAmzius(tekstas) {
  if (!tekstas) return null;
  const m = String(tekstas).match(/Prieš\s+(\d+)\s*(min|val|d)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10), vnt = m[2].toLowerCase();
  const ms = vnt === 'min' ? n * 60000 : vnt === 'val' ? n * 3600000 : n * 86400000;
  return Date.now() - ms;
}

// Kaina, mazesne uz sia riba, realiai beveik niekada nera automobilio kaina:
// dazniausiai tai menesine lizingo imoka arba klaidingai ivesta suma (5 500 vietoj 55 000).
// Tokie skelbimai nedalyvauja rinkos medianos skaiciavime ir pazymimi vartotojui.
// v1.60.0: riba pakelta 4000 -> 4500 pagal klaidos pranesima Nr.1 (2026-09-18):
// pro 4000 prasprausdavo lizingo imokos, esancios tarp 4000 ir 4500 EUR.
const MIN_REALI_KAINA = parseInt(process.env.MIN_REALI_KAINA || '4500', 10);
// Sena, daug vaziuota masina realiai gali kainuoti maziau nei 4000 € - tai NE klaida.
// Itartina tik tada, kai tokia kaina rodoma palyginti naujam automobiliui.
const SENAS_METAI = new Date().getFullYear() - 10;
const SENAS_RIDA = 200000;

function kainosPatikra(kaina, tekstas, lizingoSuma, meta) {
  if (!kaina) return null;

  // v1.72.0 (pranesimas Nr.15). Tikras skelbimas, kuri atsiunte Lukas:
  // autoplius.lt/.../bmw-x4-...-31741763 rodo „739 € / men." ir „4749 €",
  // o AUTOMOBILIO kainos nerodo isvis. `.loan-information-container` ten nera,
  // tad `lizingoSuma` - null. Riba nepadeda: 4749 >= 4500, tad iki siol sis
  // skelbimas pro patikra praeidavo be jokios zymos.
  //
  // Todel svarbiausias pozymis yra ne DYDIS, o tai, kad pati kaina eina su
  // „/ men." salia. Tikrinam pirma, nepriklausomai nuo sumos.
  //
  // Kodel ne bet koks „/men." bloke: daugelis skelbimu rodo tikra kaina, o
  // salia siulo lizinga („nuo 429 €/men."). Tokie turi `turiLizingoOpcija`
  // ir NETURI buti zymimi. Todel ieskom butent TOS PACIOS sumos su „/ men.".
  if (tekstas) {
    var sk = String(kaina);
    var suTarpais = sk.replace(/\B(?=(\d{3})+(?!\d))/g, '[\\s ]?');
    var re = new RegExp(suTarpais + '\\s*€\\s*/\\s*m[eė]n', 'i');
    if (re.test(tekstas)) {
      return { tipas: 'lizingo-imoka',
        tekstas: `Rodoma ${kaina} € yra mėnesinė lizingo įmoka, ne automobilio kaina. Skelbime automobilio kaina nenurodyta – klauskite pardavėjo.` };
    }
  }

  if (kaina >= MIN_REALI_KAINA) return null;
  // autoplius lizingo blokas (data-amount) rodo AUTOMOBILIO kaina, ne imoka - jei sutampa, kaina tikra
  if (lizingoSuma && Math.abs(lizingoSuma - kaina) / kaina < 0.05) return null;
  if (lizingoSuma && lizingoSuma > kaina * 3) {
    return { tipas: 'lizingo-imoka', tekstas: `Rodoma ${kaina} € greičiausiai yra mėnesinė įmoka – skelbime nurodyta ${lizingoSuma} € automobilio kaina.` };
  }
  if (/\/\s*mėn|per\s*mėn|mėnesiui/i.test(tekstas || '')) {
    return { tipas: 'lizingo-imoka', tekstas: `Rodoma ${kaina} € yra mėnesinė lizingo įmoka, ne automobilio kaina.` };
  }
  const m = meta || {};
  if ((m.metai && m.metai <= SENAS_METAI) || (m.rida && m.rida >= SENAS_RIDA)) return null;
  return { tipas: 'itartinai-maza', tekstas: `Neįprastai maža kaina (${kaina} €) tokio amžiaus automobiliui – tikėtina lizingo įmoka arba klaidingai įvesta suma. Patikrinkite skelbime.` };
}

function extractAutopliusStructured(html) {
  const $ = cheerio.load(html);
  const listings = [];
  $('a.announcement-item').each(function () {
    const el = $(this);
    let url = el.attr('href') || '';
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://autoplius.lt' + url;
    if (!url.includes('/skelbimai/')) return;

    // Nuotraukos: "paprasti" skelbimai turi .announcement-photo, o dauguma (is-gallery) -
    // .announcement-gallery su keliomis nuotraukomis. Anksciau imtas tik pirmasis variantas,
    // todel 18 is 20 korteliu likdavo be nuotraukos.
    const foto = (im) => {
      let u = im.attr('src') || im.attr('data-src') || im.attr('data-original') || im.attr('data-lazy') || null;
      if (!u) { const ss = im.attr('srcset'); if (ss) u = ss.split(',')[0].trim().split(' ')[0]; }
      if (u && u.startsWith('//')) u = 'https:' + u;
      if (u && (/^data:|placeholder|blank\.|no-?photo|\.svg$/i.test(u))) u = null;
      return u;
    };
    const photos = [];
    el.find('.announcement-media img, .announcement-photo img, .announcement-gallery img').each(function () {
      const u = foto($(this));
      if (u && !photos.includes(u) && photos.length < 6) photos.push(u);
    });
    const photo = photos[0] || null;
    const modelis = el.find('.announcement-title').first().text().trim() || null;

    // Pirma parametru eilute: "2023-10", "Visureigis / Krosoveris"
    const virsus = el.find('.announcement-title-parameters .announcement-parameters span').map(function () { return $(this).text().trim(); }).get();
    const dataStr = virsus.find((t) => /^(19|20)\d{2}(-\d{2})?$/.test(t)) || null;
    const metai = dataStr ? parseInt(dataStr.slice(0, 4), 10) : null;
    const menuo = dataStr && dataStr.length > 4 ? parseInt(dataStr.slice(5, 7), 10) : null;
    const kebulas = virsus.find((t) => t !== dataStr) || null;

    // Antra eilute: kuras, deze, variklis, rida, miestas
    const apacia = el.find('.announcement-parameters-block .announcement-parameters span').map(function () { return $(this).text().replace(/\s+/g, ' ').trim(); }).get();
    let kuras = null, pavarai = null, variklioTuris = null, galia = null, rida = null, miestas = null;
    apacia.forEach((t) => {
      if (/^(Dyzelinas|Benzinas|Elektra|Bioetanolis|Vandenilis)/i.test(t)) kuras = t;
      else if (/^(Automatinė|Mechaninė)$/i.test(t)) pavarai = t;
      else if (/km$/i.test(t)) rida = parseInt(t.replace(/[^\d]/g, ''), 10) || null;
      else if (/kW/i.test(t)) {
        const tur = t.match(/(\d[.,]\d)\s*l/i); const kw = t.match(/(\d+)\s*kW/i);
        if (tur) variklioTuris = parseFloat(tur[1].replace(',', '.'));
        if (kw) galia = parseInt(kw[1], 10);
      } else if (t && !/^\d/.test(t)) miestas = t;
    });

    // Kaina; "+ PVM" ir "be PVM / Eksportui" pastabos
    const kainosBlokas = el.find('.pricing-container').text().replace(/\s+/g, ' ').trim();
    const kainaTxt = el.find('.announcement-pricing-info strong').first().text();
    let kaina = parseInt(String(kainaTxt).replace(/[^\d]/g, ''), 10) || null;
    let kainaBaze = null, pvmPastaba = null;
    if (/\+\s*PVM/i.test(kainosBlokas) && kaina) {
      kainaBaze = kaina; kaina = Math.round(kaina * 1.21);
      pvmPastaba = `Skelbime nurodyta ${kainaBaze}€ + PVM = ${kaina}€ su PVM (vertinama su PVM kaina)`;
    }
    const bePvmM = kainosBlokas.match(/(\d[\d\s]{2,7})\s?€\s*be\s*PVM/i);
    const kainaBePvm = bePvmM ? parseInt(bePvmM[1].replace(/\s/g, ''), 10) : null;
    const lizingoSuma = parseInt(el.find('.loan-information-container').attr('data-amount') || '', 10) || null;
    const turiLizingoOpcija = !!lizingoSuma || /\/\s*\d+\s*mėn/i.test(kainosBlokas);

    // Zenkleliai: badge-rise = MOKAMAS iskelimas i virsu, badge-new = kada ikeltas
    const iskeltas = parseInt(el.find('.badge-rise').first().text().trim(), 10) || null;
    const naujasTxt = el.find('.badge-new').first().text().trim() || null;
    const atnaujintas = el.find('.badge-updated').length > 0;
    const ikeltaLaikas = autopliusAmzius(naujasTxt);

    // Zymos po pavadinimu
    const tagai = el.find('.announcement-tags .tag').map(function () { return ($(this).attr('class') || '') + '|' + $(this).text().replace(/\s+/g, ' ').trim(); }).get();
    const turiTaga = (k) => tagai.some((t) => t.toLowerCase().includes(k));
    const turiIstorijosAtaskaita = turiTaga('tag-autoistorija') || el.find('.announcement-autoistorija-badge').length > 0;
    const turiVin = turiTaga('tag-vin');
    const garantijosTagas = tagai.find((t) => /garantij/i.test(t));
    const turiGarantija = !!garantijosTagas;
    const garantijosTipas = !garantijosTagas ? null
      : /gamintojo/i.test(garantijosTagas) ? 'gamintojo'
      : /pardavėjo/i.test(garantijosTagas) ? 'pardavėjo' : 'nenurodyta_kokia';

    // Pardavejas
    const savininkas = el.find('.announcement-owner-container').text().replace(/\s+/g, ' ').trim();
    const yraVerslas = /Visi partnerio pasiūlymai/i.test(savininkas);
    const reitM = savininkas.match(/(\d[.,]\d)\s*Atsiliepimai\s*\((\d+)\)/i);
    const reitingas = reitM ? parseFloat(reitM[1].replace(',', '.')) : null;
    const atsiliepimuSkaicius = reitM ? parseInt(reitM[2], 10) : null;

    const visasTekstas = el.text().replace(/\s+/g, ' ').trim();
    const defektuZodziai = ['daužtas', 'degęs', 'skendęs', 'defekt', 'krušos', 'po avarijos', 'remontuot', 'korozij', 'rūdž'];
    const galimiDefektai = defektuZodziai.filter((z) => visasTekstas.toLowerCase().includes(z));

    // Jei rodoma menesine imoka, o skelbime yra reali kaina (loan data-amount) - naudojam ja,
    // o vartotojui paliekam pastaba. Tik kai realios kainos nera - skelbimas zymimas itartinu.
    let ispejimas = kainosPatikra(kaina, kainosBlokas, lizingoSuma, { metai, rida }), kainosPastaba = null;
    if (ispejimas && ispejimas.tipas === 'lizingo-imoka' && lizingoSuma) {
      kainosPastaba = `Skelbime matoma ${kaina} € mėnesinė įmoka – naudojama reali kaina ${lizingoSuma} €`;
      kaina = lizingoSuma; ispejimas = null;
    }

    listings.push({
      url, photo, photos, modelis: modelis || 'Nezinomas',
      kaina, kainaBaze, pvmPastaba, kainaBePvm, turiLizingoOpcija, lizingoSuma, kainosPastaba,
      kainosIspejimas: ispejimas,
      metai, menuo, pirmaRegistracija: dataStr, kebulas, kuras, pavarai, variklioTuris, galia, rida, miestas,
      iskeltas, ikeltaLaikas, ikeltaTekstas: naujasTxt, atnaujintas,
      turiVin, turiIstorijosAtaskaita, turiGarantija, garantijosTipas, yraVerslas,
      reitingas, atsiliepimuSkaicius, galimiDefektai,
      galimasJavImportas: /\bJAV\b/.test(visasTekstas) || /aukcion/i.test(visasTekstas),
      rawText: visasTekstas.slice(0, 200),
    });
  });
  const seen = new Set();
  return listings.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
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

// v1.28.0: autogidas sarasas nuskaitomas taip pat kruopsciai kaip autoplius.
// Portalo kortele (patikrinta gyvai 2026-09) duoda daugiau, nei imdavom anksciau:
//   data-price    - kaina skaiciumi
//   data-updated  - UNIX laikas, kada skelbimas atnaujintas (autoplius tokio net neturi)
//   .is-highlighted - MOKAMAS iskelimas i virsu (ne kokybes zenklas)
//   .parameter-value - metai, kuras, rida, deze, "3.0 L, 190 kW", "Plunge, Lietuva"
//   .vin-badge, .new-badge ("Pries 6 min."), .financing-price
function extractAutogidasListings(html, originUrl) {
  const $ = cheerio.load(html);
  const origin = new URL(originUrl).origin;
  const results = [];
  $('article.list-item-new, .list-item-new').each(function () {
    const el = $(this);
    const cardText = el.text().replace(/\s+/g, ' ').trim();
    const priceAttr = el.attr('data-price');
    let kaina = priceAttr ? Math.round(parseFloat(priceAttr)) : null;
    if (!kaina) {
      const kainaTekste = el.find('.item-price').first().text().replace(/[^0-9]/g, '');
      kaina = kainaTekste ? parseInt(kainaTekste, 10) : null;
    }
    if (!kaina) return;

    // "+ PVM" - nurodyta kaina yra BE PVM, pirkejas moka +21%
    let kainaBaze = null, pvmPastaba = null;
    if (new RegExp(`${kaina}\\s?€\\s*\\+\\s*PVM`, 'i').test(cardText) || /\+\s*PVM/i.test(el.find('.item-price').text())) {
      kainaBaze = kaina;
      kaina = Math.round(kainaBaze * 1.21);
      pvmPastaba = `Skelbime nurodyta ${kainaBaze}€ + PVM = ${kaina}€ su PVM (vertinama su PVM kaina)`;
    }

    let href = el.find('a.item-link').first().attr('href') || '';
    if (href && !href.startsWith('http')) href = origin + (href.startsWith('/') ? href : '/' + href);
    if (!href) return;
    const modelis = el.find('h2.item-title').first().text().replace(/\s+/g, ' ').trim()
      || el.find('a.item-link').first().attr('title') || 'Nezinomas';

    // Parametrai eina tvarkinga eile, bet ne visi visada yra - todel atpazistam pagal turini
    const params = [];
    el.find('span.parameter-value').each(function () { params.push($(this).text().replace(/\s+/g, ' ').trim()); });
    let metai = null, rida = null, kuras = null, pavarai = null, galia = null, variklioTuris = null,
      miestas = null, vieta = null, menuo = null;
    // autogidas rašo ir su tarpais, ir be jų: "Benzinas / dujos" ir "Benzinas/Dujos"
    const kuroTipuSarasas = ['Dyzelinas / elektra', 'Dyzelinas/Elektra', 'Benzinas / elektra / dujos',
      'Benzinas/Elektra/Dujos', 'Benzinas / elektra', 'Benzinas/Elektra', 'Benzinas / dujos', 'Benzinas/Dujos',
      'Benzinas/Gamtinės dujos', 'Dyzelinas', 'Benzinas', 'Elektra', 'Bioetanolis', 'Dujos', 'Etanolis'];
    for (const p of params) {
      if (/^\d{1,2}$/.test(p)) continue;                       // portalo vidinis "level" skaicius
      const dataMatch = p.match(/^(\d{4})\s*m\.?\s*(\d{1,2})?\s*m?e?n?/i);
      if (dataMatch && !metai) { metai = parseInt(dataMatch[1], 10); if (dataMatch[2]) menuo = parseInt(dataMatch[2], 10); }
      else if (!metai) { const y = p.match(/\b(19|20)\d{2}\b/); if (y) metai = parseInt(y[0], 10); }
      if (/km/i.test(p) && !/mėn/i.test(p) && !rida) rida = extractField(p, /(\d[\d\s]{2,7})\s?km/);
      if (!kuras && kuroTipuSarasas.includes(p)) kuras = p;
      if (!pavarai && (p === 'Automatinė' || p === 'Mechaninė')) pavarai = p;
      const ccMatch = p.match(/(\d[\d\s]{2,5})\s?cm³/i);
      if (ccMatch && !variklioTuris) variklioTuris = Math.round(parseInt(ccMatch[1].replace(/\s/g, ''), 10) / 100) / 10;
      const lMatch = p.match(/(\d[.,]\d)\s*L/i);
      if (lMatch && !variklioTuris) variklioTuris = parseFloat(lMatch[1].replace(',', '.'));
      const kwMatch = p.match(/(\d+)\s?kW/i);
      if (kwMatch && !galia) galia = parseInt(kwMatch[1], 10);
      // "Plungė, Lietuva" arba "Vilnius"
      if (!vieta && /^[A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž-]+(,\s*[A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+)?$/.test(p)
        && !kuroTipuSarasas.includes(p) && p !== 'Automatinė' && p !== 'Mechaninė') {
        vieta = p; miestas = p.split(',')[0].trim();
      }
    }

    // Kada skelbimas atnaujintas - tikslus laikas is data-updated (retas dalykas portaluose)
    const updated = parseInt(el.attr('data-updated') || '', 10);
    const ikeltaLaikas = updated ? updated * 1000 : null;
    const laikoZenklas = el.find('.new-badge, .badge').filter(function () {
      return /prieš/i.test($(this).attr('data-badge') || $(this).text() || '');
    }).first();
    const ikeltaTekstas = (laikoZenklas.attr('data-badge') || laikoZenklas.text() || '').replace(/\s+/g, ' ').trim() || null;

    const turiGarantija = el.find('.guarantee-badge, [data-badge="Garantija"]').length > 0;
    const galimasJavImportas = /\bJAV\b/.test(cardText);
    const turiVin = el.find('.vin-badge, .vin-code, [data-badge*="VIN"]').length > 0;
    const yraVerslas = el.find('.business-logo, .company-name, .dealer-logo').length > 0;
    const turiLizingoOpcija = el.find('.financing-price').length > 0;
    // MOKAMAS iskelimas. autogidas rodo lygi skaiciumi (1-6) bloke .parameter-value.level
    // su antraste "Skelbimo iskelimo paslauga" - tai tas pats, kas autoplius badge-rise:
    // NE kokybes zenklas, o pozymis, kad skelbimas kabo ilgai ir yra keliamas uz pinigus.
    const lygioTekstas = el.find('.parameter-value.level .up').first().text().trim();
    const lygis = parseInt((lygioTekstas.match(/^\d{1,2}/) || [])[0], 10);
    const iskeltas = lygis > 0 ? lygis : (el.hasClass('is-highlighted') ? 1 : null);
    const photo = el.find('img.js-image').first().attr('src')
      || el.find('.thumbs img').first().attr('data-src')
      || el.find('img').first().attr('src') || null;
    const photos = [];
    el.find('.slideshow-slide img, img.js-image').each(function () {
      const u = $(this).attr('src') || $(this).attr('data-src');
      if (u && !photos.includes(u) && photos.length < 6) photos.push(u);
    });

    // Ta pati kainos sveikatos patikra kaip autoplius. SVARBU: autogidas prie KIEKVIENOS
    // kortelės rodo "NN €/mėn." finansavimo skaičiuoklę, todėl tą tekstą pašalinam - kitaip
    // kiekvienas pigus skelbimas būtų palaikytas lizingo įmoka. Tikra kaina ateina data-price.
    const svarusTekstas = cardText.replace(/\d[\d\s]*\s*€\s*\/\s*mėn\.?/gi, ' ');
    const kainosIspejimas = kainosPatikra(kaina, svarusTekstas, null, { metai, rida });

    results.push({
      kaina, kainaBaze, pvmPastaba, kainaBePvm: null, turiLizingoOpcija, rida, metai, menuo, modelis,
      galimiDefektai: [], galimasJavImportas, kainosIspejimas: kainosIspejimas || null,
      kuras, pavarai, turiVin, galia, variklioTuris, miestas, vieta,
      turiIstorijosAtaskaita: turiVin, turiGarantija,
      garantijosTipas: turiGarantija ? 'nenurodyta_kokia' : null, yraVerslas,
      reitingas: null, atsiliepimuSkaicius: null,
      ikeltaLaikas, ikeltaTekstas, iskeltas,
      rawText: `${modelis} ${kaina}€ ${params.join(', ')}`.slice(0, 200),
      url: href, photo, photos: photos.length ? photos : (photo ? [photo] : []),
    });
  });
  return results;
}

async function fetchAllPages(baseUrl, maxPages, onProgress) {
  let autopliusStruktura = false;
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
    let newItems;
    if (isAutogidas) newItems = extractAutogidasListings(html, pageUrl);
    else if (isAutoscout) newItems = extractAutoscout24Listings(html);
    else if (isOtomoto) newItems = extractOtomotoListings(html);
    else {
      // Pirma bandom struktūrinį (tikslūs laukai); jei autoplius pakeistų išdėstymą - senas tekstinis
      newItems = extractAutopliusStructured(html);
      if (newItems.length) autopliusStruktura = true;
      else { newItems = extractListingBlocksAutoplius(html); if (newItems.length) console.log('  [AUTOPLIUS] struktūrinis nuskaitymas nieko nerado - tekstinis atsarginis'); }
    }
    const filtered = newItems.filter((b) => !seenUrls.has(b.url));
    if (resolveStep) resolveStep();
    if (filtered.length === 0) break;
    filtered.forEach((b) => seenUrls.add(b.url));
    allListings.push(...filtered);
  }
  const format = (isAutogidas || isAutoscout || isOtomoto || autopliusStruktura) ? 'parsed' : 'raw';
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
    // Lizingo imokos ir klaidingai ivestos sumos (5 500 vietoj 55 000) griauna mediana - praleidziam
    if (l.kaina && !l.kainosIspejimas) {
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

Remkis zinomais siam modeliui/metams budingais gedimais ir tipinemis problemomis,
kylanciomis tokiai ridai (pvz. dirzo/grandines keitimas, pakabos susidevejimas).
Parasyk VIENA trumpa (max 28 zodziu) pastaba lietuviskai, atsizvelgdamas i VISA turima informacija,
iskaitant rida. Grazink TIK ta sakini.`;
  try {
    // PATAISYTA: buvo Sonnet + web_search (max_uses 2) + max_tokens 800 VIENAM
    // 28 zodziu sakiniui. Su iranki kontekstas persiunciamas is naujo kiekvienam
    // raundui, todel vienas komentaras kainuodavo ~$0.10, o 60 komentaru ~$6.
    // Modelio gedimu zinios yra bendros - paieskos tam nereikia.
    const response = await anthropic.messages.create({
      model: KOMENTARU_MODEL, max_tokens: 160,
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
  let url = `https://autoplius.lt/skelbimai/naudoti-automobiliai?category_id=2`;
  // PAKEISTA: markė/modelis per tikrus autoplius ID (make_id[97]=1308) vietoj teksto paieškos.
  // Teksto paieška „BMW X5“ grąžindavo ir X5 M, ir aksesuarus – mokėjome už jų nuskaitymą,
  // o paskui patys išmesdavome. Jei ID nežinomas – grįžtam prie senos teksto paieškos.
  const idDalis = autopliusIds.urlDalis(filters.marke, filters.modelis);
  if (idDalis) url += `&${idDalis}`;
  else {
    const q = encodeURIComponent(`${filters.marke || ''} ${filters.modelis || ''}`.trim());
    if (q) url += `&qt=${q}`;
  }
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
  // PRIDETA: papildomi autoplius filtrai - juos pritaiko PATS portalas, tad nuskaitom maziau siuksliu
  const P = autopliusIds.PARAMETRAI.zymimieji;
  if (filters.varantieji && autopliusIds.PARAMETRAI.varantieji[filters.varantieji]) {
    const v = autopliusIds.PARAMETRAI.varantieji[filters.varantieji];
    url += `&wheel_drive_id%5B${v}%5D=${v}`;
  }
  if (filters.beJav) url += `&${P.beJav}`;
  if (filters.tikSuVin) url += `&${P.tikSuVin}`;
  if (filters.tikSuIstorija) url += `&${P.tikSuIstorija}`;
  if (filters.beDefektu) url += `&${P.beDefektu}`;
  if (filters.beVairoDesineje) url += `&${P.beVairoDesineje}`;
  if (filters.tikLietuvoje) url += `&${P.tikLietuvoje}`;
  // PRIDETA: skaitom nuo NAUJAUSIO skelbimo. Numatytasis autoplius rikiavimas ("Aktualiausi")
  // i virsu kelia MOKAMAI iskeltus skelbimus, todel svieziausi pasiulymai nukrenta i 3-4 puslapi.
  url += `&${autopliusIds.PARAMETRAI.rikiavimas[filters.rikiavimas] || autopliusIds.PARAMETRAI.rikiavimas.naujausi}`;
  return url;
}

// v1.28.0: autogidas filtrai patikrinti gyvai (2026-09). Marke/modelis siunciami tekstu -
// portalas juos priima (skirtingai nei autoplius, ID lenteles nereikia). Rikiavimas f_50.
const AUTOGIDAS_PARAM = {
  // Kuro tipai: f_2[N] - indeksai is portalo formos
  kuras: {
    'Dyzelinas': 1, 'Benzinas': 2, 'Benzinas/Dujos': 3, 'Benzinas / dujos': 3,
    'Benzinas/Elektra': 4, 'Benzinas / elektra': 4, 'Hibridas': 4,
    'Benzinas/Elektra (Plug-in)': 5, 'Elektra': 7, 'Elektrinis': 7,
    'Dyzelinas/Elektra': 8, 'Dyzelinas / elektra': 8, 'Dujos': 10,
  },
  kebulas: {
    'Sedanas': 1, 'Hečbekas': 2, 'Universalas': 3, 'Visureigis': 4, 'Visureigis / Krosoveris': 4,
    'Vienatūris': 5, 'Coupe': 6, 'Kabrioletas': 7, 'Pikapas': 12,
  },
  rikiavimas: {
    naujausi: 'f_50=naujausi_asc',          // naujausi virsuje
    atnaujinti: 'f_50=atnaujinimo_laika_desc',
    pigiausi: 'f_50=kaina_asc',
    brangiausi: 'f_50=kaina_desc',
  },
};

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
  // v1.28.0 NAUJI filtrai - anksciau autogidas gaudavo tik puse vartotojo pasirinkimu
  const kuroId = filters.kuras ? AUTOGIDAS_PARAM.kuras[filters.kuras] : null;
  if (kuroId) params.push(`f_2[${kuroId}]=${kuroId}`);
  if (filters.beDefektu) params.push(`f_46=${encodeURIComponent('Be defektų')}`);
  if (filters.tikSuVin) params.push('ac_3=1');
  if (filters.tikLietuvoje) params.push('ac_4=1');
  if (filters.beJav) params.push('ac_5=1');            // slepti is aukcionu (JAV importas)
  params.push(AUTOGIDAS_PARAM.rikiavimas[filters.rikiavimas] || AUTOGIDAS_PARAM.rikiavimas.naujausi);
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
    // PATAISYTA: anksciau visada skenuoti visi 4 portalai (1+1+10+10 = 22 kreditai),
    // net kai vartotojas pasirinkes viena. Dabar - tik pasirinktieji.
    const leisti = (filters && filters.portals && filters.portals.length)
      ? filters.portals : ['autoplius', 'autogidas', 'autoscout24', 'otomoto'];
    const tuscias = Promise.resolve(null);
    const autopliusUrl = buildAutopliusUrl(filters);
    const autogidasUrl = buildAutogidasUrl(filters);
    const autoscoutUrl = buildAutoscout24Url(filters);
    const otomotoUrl = buildOtomotoUrl(filters);
    const [autopliusHtml, autogidasHtml, autoscoutHtml, otomotoHtml] = await Promise.all([
      leisti.includes('autoplius') ? fetchSearchPage(autopliusUrl).catch(() => null) : tuscias,
      leisti.includes('autogidas') ? fetchSearchPage(autogidasUrl).catch(() => null) : tuscias,
      leisti.includes('autoscout24') ? fetchSearchPage(autoscoutUrl).catch(() => null) : tuscias,
      leisti.includes('otomoto') ? fetchSearchPage(otomotoUrl).catch(() => null) : tuscias,
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

// ---- ISTORIJOS "+N NAUJU" SKAICIAI ----
// Kiekvienai issaugotai paieskai pasakom, kiek skelbimu joje yra DABAR ir
// kiek daugiau nei tada, kai ji buvo vykdyta. Skaiciuojam TIK tuos portalus,
// kuriuos ta paieska naudojo (dazniausiai viena) - kitaip vienas iskleidimas
// sudegintu po 4 kreditus kiekvienai eilutei. Puslapiai imami is to paties
// podelio kaip ir paieska, todel pakartotinis atidarymas nieko nekainuoja.
const ISTORIJOS_SKAICIU_PODELIS = new Map(); // raktas -> { kiek, laikas }
const ISTORIJOS_TTL_MS = 30 * 60 * 1000;

async function paieskosKiekis(filtraiIn) {
  // runSearchJob skenuoja BE kainos filtro, todel URL su kaina niekada
  // nepataikydavo i 'pages' podeli - salinam ta pati, kad podelis veiktu.
  const filters = { ...(filtraiIn || {}) };
  delete filters.kainaNuo;
  delete filters.kainaIki;
  const portalai = (filters.portals && filters.portals.length)
    ? filters.portals : ['autoplius'];
  const uzklausos = [];
  if (portalai.includes('autoplius')) {
    uzklausos.push(fetchSearchPage(buildAutopliusUrl(filters))
      .then((h) => (h ? extractTotalCount(h, false) : null)).catch(() => null));
  }
  if (portalai.includes('autogidas')) {
    uzklausos.push(fetchSearchPage(buildAutogidasUrl(filters))
      .then((h) => (h ? extractTotalCount(h, true) : null)).catch(() => null));
  }
  if (portalai.includes('autoscout24')) {
    uzklausos.push(fetchSearchPage(buildAutoscout24Url(filters))
      .then((h) => (h ? extractAutoscout24TotalCount(h) : null)).catch(() => null));
  }
  if (portalai.includes('otomoto')) {
    uzklausos.push(fetchSearchPage(buildOtomotoUrl(filters))
      .then((h) => (h ? extractOtomotoTotalCount(h) : null)).catch(() => null));
  }
  if (!uzklausos.length) return null;
  // extract*TotalCount grazina { count, exact }, ne skaiciu - anksciau filtras
  // atmesdavo viska ir funkcija visada grazindavo null.
  const reiksmes = (await Promise.all(uzklausos))
    .map((v) => (v && typeof v.count === 'number' ? v.count : (typeof v === 'number' ? v : null)))
    .filter((v) => v !== null);
  if (!reiksmes.length) return null;
  return reiksmes.reduce((a, b) => a + b, 0);
}

app.post('/api/history-counts', requireAuth, planai.reikalautiPlano('business'), async (req, res) => {
  try {
    const paieskos = (req.body && req.body.paieskos) || [];
    if (!Array.isArray(paieskos) || !paieskos.length) return res.json({ rezultatai: [] });
    // Ribojam, kad vienas iskleidimas negaletu paleisti begalo uzklausu
    const dirbsim = paieskos.slice(0, 10);
    const dabar = Date.now();

    const rezultatai = await Promise.all(dirbsim.map(async (p, i) => {
      const filtrai = p && p.filters;
      if (!filtrai) return { i, kiek: null, nauju: null };
      const raktas = JSON.stringify(filtrai);
      const isPodelio = ISTORIJOS_SKAICIU_PODELIS.get(raktas);
      let kiek;
      if (isPodelio && (dabar - isPodelio.laikas) < ISTORIJOS_TTL_MS) {
        kiek = isPodelio.kiek;
      } else {
        kiek = await paieskosKiekis(filtrai);
        if (kiek != null) ISTORIJOS_SKAICIU_PODELIS.set(raktas, { kiek, laikas: dabar });
      }
      // Buvo nezinoma -> naujuju skaiciaus pasakyti negalime (nezinoma != nulis)
      const buvo = (typeof p.buvo === 'number') ? p.buvo : null;
      const nauju = (kiek != null && buvo != null) ? Math.max(0, kiek - buvo) : null;
      return { i, kiek, nauju };
    }));

    res.json({ rezultatai });
  } catch (err) {
    console.error('history-counts KLAIDA:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ FONO DARBO (JOB) SISTEMA - kad frontend galetu rodyti progresa ============

const jobs = {}; // { jobId: { status, log: [], result, error } }

function valytiSenusJobus() {
  const riba = Date.now() - 60 * 60 * 1000;
  for (const k of Object.keys(jobs)) {
    if ((jobs[k].sukurta || 0) < riba) delete jobs[k];
  }
}

function newJob() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  valytiSenusJobus();
  jobs[id] = { sukurta: Date.now(), status: 'running', log: [], result: null, error: null };
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
  if (!eq || !eq.length) return { key: 'UNKNOWN', label: 'Įranga: Įvertinsime po analizės' };
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
      // Modelio filtras reikalingas tik kai portale ieskota TEKSTU. Kai autoplius ieskota
      // pagal tikrus ID, rezultatai jau tikslus - filtruoti tekstu butu klaidinga
      // ("Mercedes-Benz C 220" nesutampa su uzklausa "c klase").
      const tekstinePaieska = format !== 'parsed' || (site === 'autoplius.lt' && !autopliusIds.urlDalis(filters.marke, filters.modelis));
      if (tekstinePaieska && modelQuery) {
        siteParsed = siteParsed.filter((l) =>
          (l.modelis || '').toLowerCase().includes(modelQuery) || (l.rawText || '').toLowerCase().includes(modelQuery)
        );
      } else if (modelQuery && siteParsed.length >= 5) {
        // v1.39.0 SAUGIKLIS. Kai nuskaitom struktūriškai, pasitikim, kad portalo URL
        // jau atfiltravo modelį – ir tekstinio filtro nebetaikom. Bet jei URL modelio
        // NENUNESA (pasenusi ID lentelė, pakeistas portalo parametras), gaudavom visą
        // markę: „BMW X4" paieška grąžindavo BMW 520, X3, 320. Mokėjom už jų nuskaitymą
        // ir AI triažą, o paskui patys išmesdavom.
        //
        // Tikrinam rezultatą, ne prielaidą: jei daugiau nei trečdalis grąžintų skelbimų
        // nėra prašyto modelio, portalo filtras nesuveikė – įjungiam tekstinį ir sakom,
        // kuris portalas sulūžo.
        const sutampa = siteParsed.filter((l) =>
          (l.modelis || '').toLowerCase().includes(modelQuery) || (l.rawText || '').toLowerCase().includes(modelQuery)
        );
        const netinkamuDalis = 1 - (sutampa.length / siteParsed.length);
        if (netinkamuDalis > 0.33) {
          const pries = siteParsed.length;
          siteParsed = sutampa;
          logJob(jobId, `\u26a0 ${site}: modelio filtras portale nesuveikė \u2013 is ${pries} skelbimų tik ${sutampa.length} yra „${filters.modelis}". Atfiltravom patys.`);
        }
      }
      siteParsed.forEach((l) => (l.source = site));
      resolveSite(`✅ ${site}: rasta ${siteParsed.length} skelbimų.`);
      return siteParsed;
    }));
    parsed = siteResults.flat();
    // v1.23.0: jei bent vienas portalas atidave pilna puslapiu limita, matem tik dali
    // rezultatu - tada negalima teigti, kad anksciau matyti skelbimai "dingo".
    const pasiektasPuslapiuLimitas = siteResults.some((r) => r.length >= maxPages * 18);

    const metaiNuo = parseInt(filters.metaiNuo, 10) || null;
    const metaiIki = parseInt(filters.metaiIki, 10) || null;
    const kainaNuo = parseInt(filters.kainaNuo, 10) || null;
    const kainaIki = parseInt(filters.kainaIki, 10) || null;
    const ridaIki = parseInt(filters.ridaIki, 10) || null;

    const rawFoundCount = parsed.length;
    const hardRejected = [];
    parsed = parsed.filter((l) => {
      const why = [];
      // Lizingo imoka ar klaidingai ivesta suma neturi tapti "90% nuolaida" TOP sarase -
      // atskiriam ja i "Kiti skelbimai" su aiskiu paaiskinimu vartotojui.
      if (l.kainosIspejimas) why.push(l.kainosIspejimas.tekstas);
      if (metaiNuo && l.metai && l.metai < metaiNuo) why.push('Metai ' + l.metai + ' < ' + metaiNuo);
      if (metaiIki && l.metai && l.metai > metaiIki) why.push('Metai ' + l.metai + ' > ' + metaiIki);
      if (kainaNuo && l.kaina && l.kaina < kainaNuo) why.push('Kaina ' + l.kaina + '\u20ac < ' + kainaNuo + '\u20ac');
      if (kainaIki && l.kaina && l.kaina > kainaIki) why.push('Kaina ' + l.kaina + '\u20ac > ' + kainaIki + '\u20ac');
      if (ridaIki && l.rida && l.rida > ridaIki) why.push('Rida ' + l.rida + ' km > ' + ridaIki + ' km');
      if (filters.pavaru_deze && l.pavarai && l.pavarai !== filters.pavaru_deze) why.push('Pavaru deze: ' + l.pavarai + ', reikia ' + filters.pavaru_deze);
      if (filters.kuras && !kurasAtitinka(l.kuras, filters.kuras)) why.push('Kuras: ' + (l.kuras || 'nenurodytas') + ', reikia ' + filters.kuras);
      // v1.25.0: galia (kW) - svarbus vertinimo kriterijus, filtruojam vietoje,
      // nes portalu URL parametrai nevienodi. Skelbimai be nurodytos galios nemetami.
      const galiaNuo = parseInt(filters.galiaNuo, 10), galiaIki = parseInt(filters.galiaIki, 10);
      if (galiaNuo && l.galia && l.galia < galiaNuo) why.push('Galia ' + l.galia + ' kW < ' + galiaNuo + ' kW');
      if (galiaIki && l.galia && l.galia > galiaIki) why.push('Galia ' + l.galia + ' kW > ' + galiaIki + ' kW');
      if (why.length) { l.hardRejectReasons = why; hardRejected.push(l); return false; }
      return true;
    });
    logJob(jobId, `🧹 ${rawFoundCount} rasta pagal markę/modelį → ${parsed.length} atitinka jūsų kainos/metų/ridos filtrus`);
    const itartinos = hardRejected.filter((l) => l.kainosIspejimas);
    if (itartinos.length) logJob(jobId, `⚠️ ${itartinos.length} skelbimų kaina neatrodo tikra (lizingo įmoka ar klaida) – rasite juos „Kiti skelbimai“ su paaiškinimu`);

    // ---- DIAGNOSTIKA: kodel skelbimai atkrito ir ar kainos nuskaitytos teisingai ----
    if (hardRejected.length) {
      const pagalPriezasti = {};
      hardRejected.forEach((l) => {
        const kategorija = (l.kainosIspejimas ? 'Kaina(įtartina)' : l.hardRejectReasons[0].split(' ')[0]);
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
      cache.zymetiMatyta(l, { vin: l.vin || null, pardavejas: l.pardavejas || null });
      if (l.kaina) cache.recordListingSnapshot(l.url, l.kaina, l.rida || null);
    });
    cache.saveLifecycle();

    // Skelbimai, kuriuos anksciau mateme sioje paieskoje, bet dabar ju nebera -
    // greiciausiai parduoti arba nuimti.
    const dabartiniai = new Set(visiMatyti.map((l) => l.url));
    const dingusieji = [];
    // v1.23.0 PATAISYTA: anksciau skelbimas buvo zymimas "dingo" vien todel, kad jo nebuvo
    // SIOJE paieskoje. Bet kiekviena paieska turi savo filtrus, kainu rezius ir puslapiu
    // gyli - skelbimas galejo tiesiog nepatekti i sia imti. Dabar reikia TRIJU salygu:
    //  1) skelbimas telpa i sios paieskos filtrus (kaina, metai, rida, modelis),
    //  2) jo nera rezultatuose jau ANTRA karta is eiles,
    //  3) paieska nebuvo nutraukta puslapiu limito (kitaip visa uodega atrodo "dingusi").
    (function aptiktiDingusius() {
      if (pasiektasPuslapiuLimitas) return;
      const modeliai = new Set(visiMatyti.map((l) => l.modelis).filter(Boolean));
      const f = filters || {};
      const telpa = (h) => {
        if (f.kainaNuo && h.kaina && h.kaina < f.kainaNuo) return false;
        if (f.kainaIki && h.kaina && h.kaina > f.kainaIki) return false;
        if (f.metaiNuo && h.metai && h.metai < f.metaiNuo) return false;
        if (f.metaiIki && h.metai && h.metai > f.metaiIki) return false;
        if (f.ridaIki && h.rida && h.rida > f.ridaIki) return false;
        return true;
      };
      modeliai.forEach((m) => {
        cache.getHistoryForModel(m).forEach((h) => {
          if (!h.url || dabartiniai.has(h.url)) return;
          if (Date.now() - h.time > 14 * 86400000) return;
          if (!telpa(h)) return;
          const praleista = cache.zymetiNerasta(h.url);
          if (praleista < 2) return; // pirmas praleidimas - dar ne irodymas
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

    // v1.27.0: kaina pusiau mazesne uz rinkos vidurki beveik visada reiskia rimta
    // problema (dauztas, JAV aukcionas, techninis gedimas). Zymim atskirai ir
    // neleidziam tokiam skelbimui uzimti pirmos vietos rekomendacijose.
    const ZALOS_RIBA = parseInt(process.env.ZALOS_RIBA_PCT || '49', 10);
    enriched.forEach((l) => {
      if (l.diffPct != null && l.diffPct >= ZALOS_RIBA && l.marketCount >= 5 && !l.kainosIspejimas) {
        l.itariamaZala = {
          procentas: l.diffPct,
          tekstas: `Kaina ${l.diffPct}% žemiau rinkos vidurkio. Tokį skirtumą beveik visada lemia rimta priežastis – `
            + 'daužtas ar remontuotas kėbulas, JAV aukciono automobilis, techninis gedimas arba klaidinga kaina. '
            + 'Būtina istorijos ataskaita ir apžiūra vietoje.',
        };
      }
    });

    // v1.23.0: sarasO puslapyje irangos NERA - todel TOP skelbimams atidarom ju
    // puslapius (tik nuskaitymas, jokio AI) ir uzpildom iranga, VIN, vieta, pardaveja.
    // Puslapiai kesuojami, todel kartotinei paieskai jie nieko nebekainuoja.
    const gilinti = enriched
      .filter((l) => l.url && !l.komplektacija && !l.kainosIspejimas)
      .sort((a, b) => (b.diffPct == null ? -999 : b.diffPct) - (a.diffPct == null ? -999 : a.diffPct))
      .slice(0, GILINTI_TOP);
    if (gilinti.length) {
      logJob(jobId, `\u{1F50E} Atidarome ${gilinti.length} geriausi\u0173 skelbim\u0173 \u2013 renkame \u012frang\u0105, VIN ir viet\u0105...`);
      let papildyti = 0;
      await Promise.all(gilinti.map(async (l) => {
        try {
          const d = await scrapeSingleListing(l.url);
          const items = [];
          (d.iranga || []).forEach((g) => (g.items || []).forEach((it) => { if (items.length < 80 && it) items.push(it); }));
          if (items.length) l.komplektacija = items;
          if (d.vieta) l.vieta = d.vieta;
          if (d.aprasymas) l.aprasymas = d.aprasymas;
          if (d.vin) { l.vin = d.vin; l.turiVin = true; }
          else if (d.vinPaslėptas) l.vinPaslėptas = true;
          if (d.pardavejoInfo) {
            l.pardavejoInfo = d.pardavejoInfo;
            if (d.pardavejoInfo.vardas) { l.pardavejas = d.pardavejoInfo.vardas; l.yraVerslas = true; }
            else if (d.pardavejoInfo.privatus) l.yraVerslas = false;
          }
          if (d.photos && d.photos.length > ((l.photos || []).length)) l.photos = d.photos;
          if (d.skelbimoParametrai) {
            l.skelbimoParametrai = d.skelbimoParametrai;
            // v1.25.0: varantieji ratai matomi tik skelbimo lenteleje
            const vr = Object.keys(d.skelbimoParametrai).find((k) => /varant/i.test(k));
            if (vr) l.varantieji = d.skelbimoParametrai[vr];
          }
          papildyti++;
        } catch (e) { /* vienas nepavykes skelbimas nestabdo paieskos */ }
      }));
      logJob(jobId, `   \u2705 Papildyta ${papildyti} skelbim\u0173: \u012franga, VIN, vieta, pardav\u0117jas`);
    }

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
      // Itariamai zema kaina neleidzia skelbimui tapti TOP rekomendacija
      if (l.itariamaZala) {
        l.qualityScore = Math.min(l.qualityScore, 60);
        l.whyReasons = ['⚠ ' + l.itariamaZala.tekstas].concat(l.whyReasons || []).slice(0, 5);
      }
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
      // PATAISYTA: diffPct keisdavosi po kelis punktus kaskart, kai auga archyvas,
      // todel raktas visada skirdavosi ir podelis niekada nepataikydavo.
      const diffKibiras = (c.diffPct == null) ? 'x' : Math.round(c.diffPct / 5) * 5;
      const commentKey = `${c.url}::${c.kaina}::${diffKibiras}`;
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
    // PAKEISTA (planai ir kreditai): gili analize nebedaroma automatiskai -
    // tai buvo 87 % paieskos kainos ($0,46 is $0,53), o vartotojas atsidaro 1-3.
    // Dabar ji uz kredita, paspaudus. Jei analize JAU yra podelyje - prisegam
    // nemokamai, kad pakartotines paieskos nenuskurstu.
    // AUTO_DEEP_TOP env leidzia grazinti sena elgesi (pvz. 3) testavimui.
    const TOP_N_DEEP = parseInt(process.env.AUTO_DEEP_TOP || '0', 10);
    const topSlice = candidates.slice(0, Math.max(TOP_N_DEEP, 20));
    let isPodelio = 0;
    topSlice.forEach((c) => {
      const cachedDeep = analizesPodelis(c.url, c.kaina);
      if (cachedDeep && !c.deepAnalysis) {
        c.deepAnalysis = cachedDeep.analysis; c.vin = cachedDeep.vin;
        c.pardavejas = cachedDeep.pardavejas; c.photos = cachedDeep.photos;
        isPodelio++;
      }
    });
    if (isPodelio) logJob(jobId, `✅ ${isPodelio} skelbim${isPodelio === 1 ? 'ui' : 'ams'} detali apžvalga jau buvo paruošta – prisegta nemokamai`);
    const generuoti = candidates.slice(0, TOP_N_DEEP).filter((c) => !c.deepAnalysis);
    if (generuoti.length) logJob(jobId, `🔬 Ruošiame detalią apžvalgą TOP ${generuoti.length} pasiūlymams (lygiagrečiai)...`);
    await Promise.all(generuoti.map(async (c, i) => {
      const label = `[${i + 1}/${generuoti.length}] ${c.modelis} ${c.kaina}€`;
      try {
        {
          const stopFake = startFakeProgress(jobId, [
            `   🔍 ${label} - skaitau pilną skelbimo aprašymą...`,
            `   🔧 ${label} - renku techninę specifikaciją...`,
            `   💰 ${label} - vertinu pelno potencialą...`,
            `   🔑 ${label} - renku VIN ir pardavėjo duomenis...`,
            `   ⚖️ ${label} - sudarau privalumų/rizikų sąrašą...`,
          ]);
          try {
            const { title, fullText, photo: detailPhoto, photos: detailPhotos, vin, vinPrefiksas, pardavejas } = await scrapeSingleListing(c.url);
            const marketContext = { kaina: c.kaina, marketMedian: c.marketMedian, marketCount: c.marketCount, diffPct: c.diffPct, modelis: c.modelis, galia: c.galia, variklioTuris: c.variklioTuris };
            const analysis = await generateDeepAnalysis(title, fullText, detailPhotos, marketContext, c.url);
            c.deepAnalysis = analysis;
            c.vin = vin;
            c.pardavejas = pardavejas || c.pardavejas;
            c.photos = detailPhotos;
            const vinInfo = sujungtiVin(vin, analysis, vinPrefiksas);
            c.vin = vinInfo.vin;
            c.vinSaltinis = vinInfo.vinSaltinis;
            c.vinIsNuotraukos = vinInfo.vinIsNuotraukos;
            c.vinPrefiksas = vinInfo.vinPrefiksas;
            c.vinPatvirtintasPrefiksu = vinInfo.vinPatvirtintasPrefiksu;
            c.vinNesutapimas = vinInfo.vinNesutapimas;
            if (vinInfo.vin && !c.turiVin) c.turiVin = true; // VIN rastas - istorijos komponentas pagerėja
            cache.setCached('analysis', c.url, {
              title, photo: detailPhoto, photos: detailPhotos, analysis,
              vin: vinInfo.vin, vinSaltinis: vinInfo.vinSaltinis, vinIsNuotraukos: vinInfo.vinIsNuotraukos,
              vinPrefiksas: vinInfo.vinPrefiksas, vinPatvirtintasPrefiksu: vinInfo.vinPatvirtintasPrefiksu,
              vinNesutapimas: vinInfo.vinNesutapimas, pardavejas,
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
      pvmPastaba: l.pvmPastaba || null, kainaBaze: l.kainaBaze || null, varantieji: l.varantieji || null,
      itariamaZala: l.itariamaZala || null,
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
      // v1.25.0: PVM skaidymas - rodom, kad kaina yra galutine (su PVM)
      pvmPastaba: l.pvmPastaba || null, kainaBaze: l.kainaBaze || null, kainaBePvm: l.kainaBePvm || null,
      varantieji: l.varantieji || null, itariamaZala: l.itariamaZala || null,
      // v1.23.0: is atidaryto skelbimo puslapio - iranga, vieta ir pardavejas,
      // kad skelbimo puslapyje matytusi dar PRIES mokama analize
      irangosKiekis: (l.komplektacija || []).length || null, vieta: l.vieta || null,
      pardavejoInfo: l.pardavejoInfo || null, vinPaslėptas: !!l.vinPaslėptas, vin: l.vin || null,
      // PRIDETA: portalo ikelimo laikas, mokamas iskelimas, kainos pastaba/ispejimas, miestas, kebulas
      ikeltaTekstas: l.ikeltaTekstas || null, ikeltaLaikas: l.ikeltaLaikas || null, iskeltas: l.iskeltas || null,
      dienosRinkoje: dienosNuo(l.ikeltaLaikas),
      pirmaRegistracija: l.pirmaRegistracija || null, miestas: l.miestas || null, kebulas: l.kebulas || null,
      kainosPastaba: l.kainosPastaba || null, kainosIspejimas: l.kainosIspejimas || null,
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
      rejectionReasons: [l.kainosIspejimas
        ? l.kainosIspejimas.tekstas
        : 'Neatitinka j\u016bs\u0173 paie\u0161kos filtr\u0173: ' + l.hardRejectReasons.join('; ') + '.'],
      diffPct: null, marketMedian: null, marketCount: 0,
      ikeltaTekstas: l.ikeltaTekstas || null, ikeltaLaikas: l.ikeltaLaikas || null, iskeltas: l.iskeltas || null,
      dienosRinkoje: dienosNuo(l.ikeltaLaikas),
      pirmaRegistracija: l.pirmaRegistracija || null, miestas: l.miestas || null, kebulas: l.kebulas || null,
      kainosPastaba: l.kainosPastaba || null, kainosIspejimas: l.kainosIspejimas || null,
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

// Autoplius skelbimo puslapis turi tvarkingus laukus - imam juos tiesiogiai, o ne spejam is teksto.
// Anksciau pardavejas buvo gaudomas regexu is 12 000 simboliu teksto gabalo ir daznai nukrisdavo
// uz ribos ("Pardavėjas nenurodyta"), nors skelbime jis aiskiai nurodytas.
function autopliusSkelbimoLaukai($) {
  const t = (sel) => { const e = $(sel).first(); return e.length ? e.text().replace(/\s+/g, ' ').trim() : null; };
  const ci = $('.contact-info-container').first();
  let vardas = null, privatus = false;
  if (ci.length) {
    // Verslo pardavejo pavadinimas yra nuoroda i jo puslapi. PRIVATUS pardavejas nuorodos
    // neturi - anksciau tada buvo griebiamas bet koks tekstas is puslapio ("EUR gali buti
    // atliekami tik pavedimu..."), todel rodydavom nesamone vietoj "Privatus pardavėjas".
    vardas = ci.find('a[href*="/pardavejas"], a[href*="/salonas"], a[href*="/partner"]').first().text().replace(/\s+/g, ' ').trim() || null;
    if (!vardas) {
      vardas = ci.find('a').filter(function () {
        const x = $(this).text().replace(/\s+/g, ' ').trim();
        return x && x.length > 1 && x.length < 60 && !/Teirautis|Atsiliepimai|Rodyti|Dalintis|Spausdinti|Pranešti|€/i.test(x);
      }).first().text().replace(/\s+/g, ' ').trim() || null;
    }
    if (!vardas) vardas = ci.find('.seller-title, .contact-name, h2, h3').first().text().replace(/\s+/g, ' ').trim() || null;
    privatus = !vardas;
  }
  const reitTxt = t('.seller-rating-score');
  const atsTxt = t('.seller-rating-count');
  const vieta = t('.seller-contact-location') || t('.owner-location-content') || t('.sticky-announcement-location') || null;
  const pardavejoInfo = ci.length || vardas ? {
    vardas: vardas || null,
    privatus,                                               // true = fizinis asmuo, be imones pavadinimo
    lygis: t('.partner-award-level'),                       // pvz. "Platininis partneris"
    patvirtinta: $('.identity-badge.verified').length > 0,  // "Tapatybė patvirtinta"
    vieta,                                                  // "Kaunas, Lietuva" / "Rīga, Latvija"
    telefonas: t('.seller-phone-number'),
    reitingas: reitTxt ? parseFloat(reitTxt.replace(',', '.')) : null,
    atsiliepimu: atsTxt ? (parseInt((atsTxt.match(/\((\d+)\)/) || [])[1], 10) || null) : null,
  } : null;

  // IRANGA: .features-container > .feature-row (skiltis) > .feature-list > span.feature-item
  // Anksciau ju visai neimdavom - AI matydavo tik teksta, kuris daznai nukirstas, ir rasydavo
  // "Iranga - nepakankamai duomenu", nors skelbime isvardyta 60+ pozicijų.
  const iranga = [];
  $('.features-container .feature-row').each(function () {
    const skiltis = $(this).find('.feature-title, .feature-row-title, h3, h4').first().text().replace(/\s+/g, ' ').trim() || null;
    const items = $(this).find('.feature-item').map(function () { return $(this).text().replace(/\s+/g, ' ').trim(); }).get().filter(Boolean);
    if (items.length) iranga.push({ skiltis, items });
  });
  if (!iranga.length) {
    const visi = $('.feature-item').map(function () { return $(this).text().replace(/\s+/g, ' ').trim(); }).get().filter(Boolean);
    if (visi.length) iranga.push({ skiltis: null, items: visi });
  }
  const aprasymas = $('.announcement-description').first().text().replace(/\s+/g, ' ').trim().slice(0, 2500) || null;

  // VIN: autoplius neprisijungusiam rodo tik pradzia ir mygtuka "Rodyti"
  const vinEl = $('.vin-parameter').first();
  const vinTxt = vinEl.length ? vinEl.text().replace(/\s+/g, ' ').trim() : '';
  const vinPilnas = (vinTxt.match(/\b[A-HJ-NPR-Z0-9]{17}\b/) || [])[0] || null;
  const vinPref = !vinPilnas ? ((vinTxt.match(/\b([A-HJ-NPR-Z0-9]{5,16})\.{2,}/) || [])[1] || null) : null;
  const vinPaslėptas = !!vinEl.length && !vinPilnas;

  // Autoistorija.lt ataskaitos nuoroda (jei pardavejas ja pridejo)
  const istNuoroda = $('a.check-autoistorija').first().attr('href') || null;

  // Techniniai laukai: "Pirma registracija", "Rida", "Variklis", "Varantieji ratai"...
  const parametrai = {};
  $('.parameter-row').each(function () {
    const lbl = $(this).find('.parameter-label').first().text().replace(/\s+/g, ' ').trim();
    const val = $(this).find('.parameter-value').first().text().replace(/\s+/g, ' ').trim();
    if (lbl && val) parametrai[lbl] = val.slice(0, 120);
  });

  return { pardavejoInfo, vinPilnas, vinPref, vinPaslėptas, istNuoroda, parametrai, iranga, aprasymas, vieta };
}

async function scrapeSingleListing(url) {
  const html = await fetchListingPage(url);
  const $ = cheerio.load(html);
  // Strukturiniai laukai - PRIES isvalant script/nav, kad niekas nedingtu
  const struk = /autoplius\.lt/i.test(url) ? autopliusSkelbimoLaukai($) : { pardavejoInfo: null, vinPilnas: null, vinPref: null, vinPaslėptas: false, istNuoroda: null, parametrai: {} };

  // Meta zymos (keywords/description) DAZNAI jau turi svaru, struktura faktu santrauka
  // (Pirma registracija, Rida, Variklis, Defektai ir t.t.) - be lizingo triuksmo.
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
  const metaDescription = $('meta[name="description"]').attr('content') || '';

  $('script, style, nav, footer, header, iframe, noscript').remove();
  const title = $('h1').first().text().replace(/\s+/g, ' ').trim();
  let bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  bodyText = cleanFinancingNoise(bodyText).slice(0, TEKSTO_RIBA);

  // Strukturiniai laukai eina PIRMI - anksciau iranga ir techniniai parametrai likdavo
  // uz teksto ribos, todel AI rasydavo "nepakankamai duomenu".
  const parametruTekstas = Object.keys(struk.parametrai || {}).length
    ? Object.entries(struk.parametrai).map(([k, v]) => `${k}: ${v}`).join('; ') : '';
  const irangosTekstas = (struk.iranga || []).length
    ? struk.iranga.map((g) => (g.skiltis ? g.skiltis + ': ' : '') + g.items.join(', ')).join(' | ').slice(0, 3000) : '';
  const fullText = [
    parametruTekstas ? `[TECHNINIAI DUOMENYS IŠ SKELBIMO LENTELĖS]: ${parametruTekstas}` : '',
    irangosTekstas ? `[ĮRANGA IR KOMPLEKTACIJA (pilnas sąrašas iš skelbimo)]: ${irangosTekstas}` : '',
    struk.vieta ? `[AUTOMOBILIO VIETA]: ${struk.vieta}` : '',
    struk.pardavejoInfo ? `[PARDAVĖJAS]: ${struk.pardavejoInfo.privatus ? 'privatus asmuo' : (struk.pardavejoInfo.vardas || 'nenurodytas')}${struk.pardavejoInfo.lygis ? ' (' + struk.pardavejoInfo.lygis + ')' : ''}${struk.pardavejoInfo.vieta ? ', ' + struk.pardavejoInfo.vieta : ''}` : '',
    struk.aprasymas ? `[PARDAVĖJO APRAŠYMAS]: ${struk.aprasymas}` : '',
    metaKeywords ? `[STRUKTŪRIZUOTI FAKTAI IŠ SKELBIMO]: ${metaKeywords}` : '',
    metaDescription ? `[SKELBIMO SANTRAUKA]: ${metaDescription}` : '',
    `[PILNAS PUSLAPIO TEKSTAS]: ${bodyText}`,
  ].filter(Boolean).join('\n\n');

  const NON_CAR_IMAGE_KEYWORDS = ['logo', 'avatar', 'icon', 'placeholder', 'map', 'pin', 'default', 'staticmap', 'sprite', 'banner', 'ad-', '/ads/',
    'watermark', 'reklam', 'promo', 'baner', 'noimage', 'no-photo', 'nophoto', 'no_photo', '/static/', 'badge', 'label', '.svg', '.gif'];
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

  // Autoplius pilna VIN rodo TIK prisijungusiems - neprisijungusiam matoma tik pradzia,
  // pvz "WBATA610... Rodyti". Ta pradzia issaugom: ja galima panaudoti VIN'ui,
  // nuskaitytam is nuotraukos, patikrinti (jei pradzios sutampa - beveik garantija,
  // kad AI nuskaite teisingai).
  let vinPrefiksas = struk.vinPref ? struk.vinPref.toUpperCase() : null;
  if (!vinPrefiksas) {
    const prefMatch = fullText.match(/\b([A-HJ-NPR-Z0-9]{6,12})\.{3}\s*Rodyti/i)
      || fullText.match(/K\u0117bulo numeris \(VIN\)\s*([A-HJ-NPR-Z0-9]{6,12})\.{3}/i);
    if (prefMatch) vinPrefiksas = prefMatch[1].toUpperCase();
  }

  // Pardavejo/dilerio pavadinimas - dazniausiai eina tiesiai pries "Tapatybe patvirtinta"
  // zyma (verslo pardavejams), pvz "AK AUTO Tapatybe patvirtinta" arba "MOLLER AUTO... Tapatybe patvirtinta".
  const sellerMatch = fullText.match(/([A-ZŠČŽĄĘĖĮŲŪ][A-Za-zŠčČžŽąĄęĘėĖįĮųŲūŪ0-9\s,.\-]{2,60}?)\s*Tapatybė patvirtinta/);
  // Jei skelbime yra strukturinis pardavejo blokas, juo ir pasitikim: privatus pardavejas
  // neturi imones pavadinimo, ir tai NE priezastis rodyti atsitiktini teksto gabala.
  const pardavejas = struk.pardavejoInfo
    ? (struk.pardavejoInfo.vardas || null)
    : (sellerMatch ? sellerMatch[1].trim() : null);

  return { title, fullText, photo, photos, vin: struk.vinPilnas || vin, vinPrefiksas, pardavejas,
    pardavejoInfo: struk.pardavejoInfo, vinPaslėptas: struk.vinPaslėptas,
    istorijosNuoroda: struk.istNuoroda, skelbimoParametrai: struk.parametrai,
    iranga: struk.iranga, aprasymas: struk.aprasymas, vieta: struk.vieta };
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

async function searchVinHistory(vin, kontekstas) {
  // v1.23.1: prompte dabar ir EUROPINIAI saltiniai (ne tik JAV aukcionai) + aiskiai
  // prasom ivardyti, KUR ieskota. Anksciau europietiskam automobiliui atsakymas visada
  // buvo "rasta: false" ir vartotojas nesuprasdavo, ar patikrinimas apskritai ivyko.
  const kont = kontekstas && (kontekstas.modelis || kontekstas.metai)
    ? `\nPapildomas kontekstas is skelbimo: ${[kontekstas.modelis, kontekstas.metai].filter(Boolean).join(', ')}.` : '';
  const prompt = `Atlik web paieska del sio automobilio VIN kodo: ${vin}${kont}

Patikrink bent siuos saltinius (ieskok pagal VIN koda):
1. JAV aukcionai ir ju archyvai: Copart, IAAI, Bidmotors, SalvageBid, AutoBidMaster, Bid.Cars, CarsFromWest.
2. VIN istorijos agregatoriai: VINCheck.info, VinAudit, ClearVin, EpicVIN, Vindecoderz, Autoastat.
3. Skelbimu archyvai ir pardavimo istorija bet kurioje salyje (mobile.de, autoscout24, otomoto, autoplius, marktplaats, cars.com) - ar tas pats VIN buvo skelbtas anksciau ir uz kiek.
4. Gamintojo atsaukimai (recalls) pagal ta modeli ir metus.

Grazink TIK JSON (be markdown):
{
  "rasta": true/false,
  "saltinis": "svetaines pavadinimas jei rasta, arba null",
  "zalos_aprasas": "kas rasta apie zala/busena is saltinio, arba null",
  "aukciono_kaina": "kaina jei rasta (su valiuta), arba null",
  "papildoma_info": "kita svarbi info - vieta, pardavejo tipas, data, ankstesni skelbimai - arba null",
  "nuoroda": "URL i konkretu puslapi jei radai, arba null",
  "patikrinti_saltiniai": ["saltiniai, kuriuose realiai ieskojai", "..."],
  "isvada": "1-2 sakiniai lietuviskai, ka tai reiskia pirkejui (net jei nieko nerasta)"
}`;
  async function kviesti(suIrankiais) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      ...(suIrankiais ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }] } : {}),
      messages: [{ role: 'user', content: prompt }],
    });
    const rawText = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return { rawText, stop: response.stop_reason };
  }
  let tekstas = '', stop = null;
  try {
    ({ rawText: tekstas, stop } = await kviesti(true));
  } catch (e) {
    console.error('[VIN] web paieskos klaida:', e.message);
  }
  // Jei modelis grazino tik irankio kvietima ar tuscia teksta - pakartojam be irankiu,
  // kad vartotojas bent gautu paaiskinima, o ne tylu "rasta: false".
  if (!tekstas || !tekstas.trim()) {
    try { ({ rawText: tekstas, stop } = await kviesti(false)); } catch (e) { console.error('[VIN] antras bandymas:', e.message); }
  }
  const cleaned = String(tekstas || '').replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(match ? match[0] : cleaned);
    if (!Array.isArray(j.patikrinti_saltiniai) || !j.patikrinti_saltiniai.length) {
      j.patikrinti_saltiniai = ['Copart', 'IAAI', 'VIN istorijos agregatoriai', 'skelbimų archyvai'];
    }
    if (!j.isvada) {
      j.isvada = j.rasta
        ? 'Rasta viešų įrašų apie šį VIN – žr. žemiau.'
        : 'Viešuose šaltiniuose įrašų apie šį VIN nerasta. Tai reiškia, kad automobilis nebuvo parduotas JAV aukcione ir neturi viešai skelbtos žalos istorijos – bet tai nepakeičia oficialios Autoistorija.lt / CarVertical ataskaitos.';
    }
    return j;
  } catch {
    console.error('[VIN] nepavyko isparsinti atsakymo, stop_reason:', stop, 'ilgis:', cleaned.length);
    return {
      rasta: false, saltinis: null, zalos_aprasas: null, aukciono_kaina: null,
      papildoma_info: null, nuoroda: null,
      patikrinti_saltiniai: [],
      nepavyko: true,
      isvada: 'Šį kartą nepavyko įvykdyti viešos paieškos (šaltiniai neatsakė). Kreditas grąžinamas – bandykite dar kartą po kelių minučių.',
    };
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

// ---- NUOTRAUKU FILTRAS ----
// Pardavejai i galerija ideda reklamas, savo logotipus, "ius.lt" tipo grafikas. Tokiu
// nuotrauku nerodom ir neanalizuojam. Pigus Haiku vaizdo kvietimas su VISOMIS skelbimo
// nuotraukomis: grazina, kurios NERA sio automobilio nuotraukos, ir ar kuri nors is ju -
// pardavejo logotipas (ji prisegam prie pardavejo kortelės).
const NUOTRAUKU_FILTRAS = (process.env.NUOTRAUKU_FILTRAS || '1') !== '0';
// v1.24.0 VIZUALINIS STANDARTAS: nuotraukas perziuri atskiras pigus "evidence" sluoksnis
// (Haiku), kuris tik APRASO, kas matoma, su nuotrauku numeriais. Gili analize (Sonnet)
// gauna to sluoksnio TEKSTA vietoj paveiksleliu - todel perziurim daugiau nuotrauku, o
// brangaus modelio ieinanciu tokenu sumazeja.
const VIZUALUS_SLUOKSNIS = (process.env.VIZUALUS_SLUOKSNIS || '1') !== '0';
const VIZUALAUS_FOTO = parseInt(process.env.VIZUALAUS_FOTO || '10', 10);
const FILTRO_MAX_FOTO = 15;

async function klasifikuotiNuotraukas(photos) {
  const rez = { tinkamos: photos || [], atmestos: [], pardavejoLogo: null, parsisiusta: {} };
  if (!NUOTRAUKU_FILTRAS || !photos || photos.length < 2) return rez;
  try {
    const sarasas = photos.slice(0, FILTRO_MAX_FOTO);
    const parsisiusta = await Promise.all(sarasas.map(downloadImageAsBase64));
    sarasas.forEach((u, i) => { if (parsisiusta[i]) rez.parsisiusta[u] = parsisiusta[i]; });
    const turim = sarasas.map((u, i) => ({ u, i, img: parsisiusta[i] })).filter((x) => x.img);
    if (turim.length < 2) return rez;
    const content = [];
    turim.forEach((x, k) => {
      content.push({ type: 'text', text: `Nuotrauka #${k + 1}:` });
      content.push({ type: 'image', source: { type: 'base64', media_type: x.img.media_type, data: x.img.data } });
    });
    content.push({ type: 'text', text: `Tai automobilio pardavimo skelbimo galerija (${turim.length} nuotraukos, sunumeruotos #1..#${turim.length}).
Nustatyk, kurios nuotraukos NERA sio parduodamo automobilio nuotraukos: reklamos, logotipai, tekstiniai plakatai,
kainu lenteles, zemelapiai, kito automobilio ar salono reklamines nuotraukos, tuscios/klaidos nuotraukos.
Automobilio interjero, variklio, ratu, dokumentu, VIN lipduku, prietaisu skydelio nuotraukos YRA tinkamos.
Jei kuri nors nuotrauka yra PARDAVEJO (autosalono, imones) LOGOTIPAS - nurodyk jos numeri.
Atsakyk TIK JSON: {"netinkamos":[numeriai],"logotipas":numeris arba null}`});
    const response = await anthropic.messages.create({
      model: KOMENTARU_MODEL, max_tokens: 120,
      messages: [{ role: 'user', content }],
    });
    const raw = (response.content && response.content[0] && response.content[0].text) || '';
    const m = raw.match(/\{[\s\S]*\}/);
    const j = m ? JSON.parse(m[0]) : null;
    if (!j) return rez;
    const netinkamos = new Set((Array.isArray(j.netinkamos) ? j.netinkamos : []).map((n) => parseInt(n, 10)).filter((n) => n >= 1 && n <= turim.length));
    const logoNr = j.logotipas != null ? parseInt(j.logotipas, 10) : null;
    if (logoNr >= 1 && logoNr <= turim.length) { rez.pardavejoLogo = turim[logoNr - 1].u; netinkamos.add(logoNr); }
    // Saugiklis: jei "netinkamos" beveik visos - modelis suklydo, nefiltruojam
    if (netinkamos.size >= turim.length - 1 && turim.length > 2) return rez;
    const atmestiUrl = new Set([...netinkamos].map((n) => turim[n - 1].u));
    rez.atmestos = photos.filter((u) => atmestiUrl.has(u));
    rez.tinkamos = photos.filter((u) => !atmestiUrl.has(u));
    if (rez.atmestos.length) console.log(`[NUOTRAUKOS] atmesta ${rez.atmestos.length} ne automobilio nuotr.${rez.pardavejoLogo ? ' (viena - pardavejo logotipas)' : ''}`);
    return rez;
  } catch (e) {
    console.warn('[NUOTRAUKOS] filtras nepavyko:', e.message);
    return rez;
  }
}

// v1.23.0: statine dalis - kesuojama (cache_control), todel nekeisti be reikalo.
const DEEP_INSTRUKCIJOS = `Tu esi automobiliu pirkimo ekspertas, dirbantis flipping/perpardavimo verslui. Isanalizuok
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
  "nuotrauku_pastebejimai": ["konkretus matomas pazeidimas nuotraukoje", "..."] (arba ["Nuotraukose akivaizdzios zalos nepastebeta"]; jei nuotraukos NEPRISEGTOS - null),
  "vin_is_nuotraukos": "17 simboliu VIN kodas, jei ISKAITOMAS prisegtoje nuotraukoje, kitu atveju null",
  "vin_nuotraukos_vieta": "kur pamatytas, pvz. duru lipdukas, arba null"
}`;

async function generateDeepAnalysis(title, fullText, photos, marketContext, skelbimoUrl, preloaded, vizualus) {
  // v1.24.0: kai turim irodymu sluoksni, paveiksleliu cia NEBESIUNCIAM - vietoj ju eina
  // strukturizuotas tekstas "ka matome". Taip brangus modelis nebemoka uz vaizdus.
  const vizTekstas = vizualus ? nuotrAnalize.tekstasAnalizei(vizualus) : '';
  let imageBlocks = [];
  if (!vizualus && photos && photos.length > 0) {
    const downloaded = await Promise.all(photos.slice(0, DEEP_FOTO_KIEKIS).map((u) => (preloaded && preloaded[u]) ? Promise.resolve(preloaded[u]) : downloadImageAsBase64(u)));
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
    : (vizTekstas
      ? `\n\nNUOTRAUKOS NEPRISEGTOS. Vietoj ju gavai [VIZUALINIS PATIKRINIMAS] bloka - tai atskiro
nuotrauku tikrintojo isvados su nuotrauku numeriais. Remkis TIK juo: "nuotrauku_pastebejimai"
lauke perrasyk svarbiausius pastebejimus ir BUTINAI islaikyk ju lygi ("matoma" vs "galimas signalas").
NEDARYK is ju isvadu apie avarijas, ridos tikruma ar gamykline komplektacija. Trukstantis rakursas
nera automobilio truksmas - jis virsta klausimu pardavejui arba patikrinimo punktu.`
      : '');

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

  // v1.23.0 SANAUDOS: instrukcijos ir JSON schema yra VISADA tokios pacios, todel jos
  // siunciamos atskiru bloku su cache_control - Anthropic jas isikesuoja ir pakartotinis
  // ju skaitymas kainuoja ~10% iprastos kainos. Kintama dalis (skelbimo tekstas) - atskirai.
  const turinys = `Automobilio skelbimo puslapio turinys:
Pavadinimas: ${title}
Turinys: ${fullText}
${marketContextText}${istorijosTekstas}${vizTekstas ? '\n\n' + vizTekstas : ''}${photoInstructions}`;

  const prompt = `${DEEP_INSTRUKCIJOS}

${turinys}`;


  const messageContent = [
    { type: 'text', text: DEEP_INSTRUKCIJOS, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: turinys },
    ...imageBlocks,
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: imageBlocks.length > 0 ? 4500 : 3800,
    // PATAISYTA: web_search verte persiusti VISAS nuotraukas is naujo kiekvienam
      // iranki raundui (23k -> 31k -> 39k tokenu). Atsisakius - ~70% pigiau.
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
      const retryTurinys = turinys.replace(photoInstructions, '');
      const retryResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2600,
        messages: [{ role: 'user', content: [
          { type: 'text', text: DEEP_INSTRUKCIJOS, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: retryTurinys },
        ] }],
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

app.post('/api/search-start', requireAuth, planai.reikalautiPaieskos(), (req, res) => {
  const jobId = newJob();
  runSearchJob(jobId, req.body);
  res.json({ jobId });
});

app.get('/api/search-status/:jobId', requireAuth, (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Nerasta' });
  res.json(job);
});

// v1.23.0: podelis galioja 7 d., bet TIK jei skelbimo kaina nepasikeitusi - kitaip
// derybu patarimai ir kainos vertinimas butu pasene. Podelis bendras visiems vartotojams,
// todel to paties skelbimo AI analize antram vartotojui nieko nebekainuoja.
function analizesPodelis(url, kaina) {
  const c = cache.getCached('analysis', url, ANALIZES_PODELIS_MS);
  if (!c) return null;
  const sena = c.kaina || (c.marketContext && c.marketContext.kaina) || null;
  if (kaina && sena && Math.abs(sena - kaina) > Math.max(100, kaina * 0.01)) return null;
  return c;
}

// v1.27.0: DU LYGIAI. „greita" (1 kr) - tik skelbimo tekstas, kaina, rizikos, be nuotraukų AI.
// „pilna" (2 kr) - viskas: vizualinis nuotraukų patikrinimas, pardavėjas, VIN, įranga.
// Kreditų kaina parenkama pagal uzklausos lygi, todel middleware sukuriamas dinamiskai.
function kreditaiPagalLygi(req, res, next) {
  const pilna = !(req.body && req.body.lygis === 'greita');
  const veiksmas = pilna ? 'analizePilna' : 'analize';
  return planai.reikalautiKreditu(veiksmas, (r) => (r.body && r.body.url)
    ? String(r.body.url) + (pilna ? '#pilna' : '#greita') + (r.body.force ? '#force' + Date.now() : '')
    : null)(req, res, next);
}

app.post('/api/analyze-single', requireAuth, kreditaiPagalLygi, async (req, res) => {
  try {
    const { url, force, kaina, marketMedian, marketCount, diffPct, modelis, pardavejas: knownPardavejas, galia, variklioTuris } = req.body;
    if (!url) return res.status(400).json({ error: 'Trūksta URL' });
    // C-2: atsakom anksti ir aiskiai, kad naudotojas gautu priezasti, o ne 500.
    // Kreditai dar nenurasyti - kreditaiPagalLygi juos ima po sekmingo atsakymo.
    if (!portalasLeidziamas(url)) {
      return res.status(400).json({
        error: 'Nuoroda ne is palaikomo portalo',
        leidziami: LEIDZIAMI_PORTALAI,
      });
    }
    const pilna = req.body.lygis !== 'greita';
    const podelioRaktas = pilna ? url : url + '#greita';

    if (!force) {
      // Pilna analize tinka ir ten, kur uzsakyta greita - grazinam geresne nemokamai
      const cached = analizesPodelis(url, kaina) || (pilna ? null : analizesPodelis(podelioRaktas, kaina));
      if (cached) {
        const ageMin = cache.cacheAgeMinutes('analysis', url);
        issaugotiAnalizesAtaskaita(req, url, cached);
        return res.json({ ...cached, cached: true, cacheAgeMinutes: ageMin });
      }
    }

    const { title, fullText, photo: photo0, photos: photos0, vin, vinPrefiksas, pardavejas,
      pardavejoInfo, vinPaslėptas, istorijosNuoroda, skelbimoParametrai, iranga, aprasymas, vieta } = await scrapeSingleListing(url);
    const marketContext = marketMedian ? { kaina, marketMedian, marketCount, diffPct, modelis, galia, variklioTuris } : null;
    // Ne automobilio nuotraukos (reklamos, logotipai) - salin; pardavejo logotipas - prie pardavejo
    // Greitam lygiui nuotrauku AI nekvieciam - todel jis ir pigesnis
    const foto = pilna
      ? await klasifikuotiNuotraukas(photos0)
      : { tinkamos: photos0 || [], atmestos: [], pardavejoLogo: null, parsisiusta: {} };
    const photos = foto.tinkamos, photo = photos[0] || photo0;
    // v1.24.0: pirma - irodymu sluoksnis (ka matome), tik tada verdiktas (ka tai reiskia)
    let vizualus = null;
    if (pilna && VIZUALUS_SLUOKSNIS && photos.length >= 2) {
      try {
        vizualus = await nuotrAnalize.analizuoti({
          anthropic, model: KOMENTARU_MODEL, nuotraukos: photos, parsisiusta: foto.parsisiusta,
          maxFoto: VIZUALAUS_FOTO,
          kontekstas: { modelis, metai: req.body.metai, rida: req.body.rida, irangosSarasas: iranga, aprasymas },
        });
      } catch (e) { console.warn('[VIZUALAS] nepavyko:', e.message); }
    }
    const analysis = await generateDeepAnalysis(title, fullText, pilna ? photos : [], marketContext, url, foto.parsisiusta, vizualus);
    // Nuotrauku pastebejimai ir VIN is nuotraukos dabar ateina is irodymu sluoksnio
    if (vizualus) {
      if (!analysis.nuotrauku_pastebejimai || !analysis.nuotrauku_pastebejimai.length) {
        analysis.nuotrauku_pastebejimai = vizualus.pastebejimai.map((p) =>
          (p.lygis === 'matoma' ? '' : 'Galimas signalas: ') + p.tekstas + (p.nuotrauka ? ' (nuotr. #' + p.nuotrauka + ')' : ''));
      }
      if (!analysis.vin_is_nuotraukos && vizualus.vinNuotraukoje) {
        analysis.vin_is_nuotraukos = vizualus.vinNuotraukoje;
        analysis.vin_nuotraukos_vieta = vizualus.vinVieta;
      }
    }
    const vinInfo = sujungtiVin(vin, analysis, vinPrefiksas);
    const result = {
      title, photo, photos, analysis,
      pardavejoLogo: foto.pardavejoLogo || null, atmestuNuotrauku: foto.atmestos.length,
      vin: vinInfo.vin, vinSaltinis: vinInfo.vinSaltinis, vinIsNuotraukos: vinInfo.vinIsNuotraukos,
      vinPrefiksas: vinInfo.vinPrefiksas, vinPatvirtintasPrefiksu: vinInfo.vinPatvirtintasPrefiksu,
      vinNesutapimas: vinInfo.vinNesutapimas,
      pardavejas: pardavejas || knownPardavejas || null,
      pardavejoInfo: pardavejoInfo || null, vinPaslėptas: !!vinPaslėptas,
      istorijosNuoroda: istorijosNuoroda || null, skelbimoParametrai: skelbimoParametrai || null,
      iranga: iranga || null, aprasymas: aprasymas || null, vieta: vieta || null,
      kaina: kaina || null, // v1.23.0: pagal ja tikrinam, ar podelio analize dar aktuali
      vizualus: vizualus || null, // v1.24.0: irodymu sluoksnis (bukle, pasitikejimas, pastebejimai)
      lygis: pilna ? 'pilna' : 'greita',
    };
    cache.setCached('analysis', podelioRaktas, result);
    issaugotiAnalizesAtaskaita(req, url, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Kiekviena gili analize - i vartotojo ataskaitas (kartu su skelbimo duomenimis is uzklausos,
// kad ataskaita butu galima atidaryti detail.html be pakartotinio nuskaitymo)
function issaugotiAnalizesAtaskaita(req, url, rezultatas) {
  try {
    const b = req.body || {};
    const c = {
      url, kaina: b.kaina || null, marketMedian: b.marketMedian || null, marketCount: b.marketCount || null,
      diffPct: b.diffPct != null ? b.diffPct : null, modelis: b.modelis || rezultatas.title || null,
      galia: b.galia || null, variklioTuris: b.variklioTuris || null, metai: b.metai || null, rida: b.rida || null,
      kuras: b.kuras || null, pavarai: b.pavarai || null, source: b.source || null,
      photo: rezultatas.photo || b.photo || null, pardavejas: rezultatas.pardavejas || null, vin: rezultatas.vin || null,
    };
    const a = rezultatas.analysis || {};
    const pav = (b.modelis || rezultatas.title || url).toString().slice(0, 120) + (b.kaina ? ` · ${Number(b.kaina).toLocaleString('lt-LT')} €` : '');
    duomenys.issaugotiAtaskaita(req.user.id, 'analize', url, pav, a.verdiktas || null, c.photo,
      { c, analysis: rezultatas.analysis || null, photos: rezultatas.photos || [], vin: rezultatas.vin || null, pardavejas: rezultatas.pardavejas || null });
  } catch (e) { console.error('[DUOMENYS] analizės ataskaita:', e.message); }
}

// ============ GILUS DVIEJU/TRIJU AUTO PALYGINIMAS ============
// Kiekvienam automobiliui atliekamas PILNAS nuskaitymas (skelbimo tekstas, visos
// nuotraukos, VIN, pardavejas) + gili analize, o tada Claude paraso savo verdikta
// LYGINDAMAS juos tarpusavyje - ne kiekviena atskirai.

async function paruostiPilnaProfili(url, kontekstas) {
  const cached = analizesPodelis(url, kontekstas && kontekstas.kaina);
  if (cached && cached.analysis) {
    return { url, ...cached, isPodelio: true };
  }
  const { title, fullText, photo, photos, vin, vinPrefiksas, pardavejas } = await scrapeSingleListing(url);
  const analysis = await generateDeepAnalysis(title, fullText, photos, kontekstas || null, url);
  const vinInfo = sujungtiVin(vin, analysis, vinPrefiksas);
  const result = {
    title, photo, photos, analysis,
    vin: vinInfo.vin, vinSaltinis: vinInfo.vinSaltinis, vinIsNuotraukos: vinInfo.vinIsNuotraukos,
    vinPrefiksas: vinInfo.vinPrefiksas, vinPatvirtintasPrefiksu: vinInfo.vinPatvirtintasPrefiksu,
    pardavejas: pardavejas || null,
    kaina: (kontekstas && kontekstas.kaina) || null,
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

app.post('/api/compare-deep', requireAuth, planai.reikalautiKreditu('palyginimas', (r) => Array.isArray(r.body && r.body.autos) ? r.body.autos.map((a) => a && a.url).filter(Boolean).sort().join('|') : null), async (req, res) => {
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
    const atsakymas = {
      profiliai: profiliai.map((p, i) => ({
        url: p.url, title: p.title, photos: p.photos || [], vin: p.vin || null,
        pardavejas: p.pardavejas || null, analysis: p.analysis || null,
        isPodelio: p.isPodelio, meta: autos[i],
      })),
      verdiktas,
    };
    try {
      const raktas = autos.map((a) => a.url).filter(Boolean).sort().join('|');
      const pav = autos.map((a) => (a.modelis || 'Auto') + (a.kaina ? ` ${Number(a.kaina).toLocaleString('lt-LT')} €` : '')).join(' vs ');
      const sant = verdiktas && (verdiktas.trumpas_verdiktas || verdiktas.laimetojo_pagrindimas) || null;
      const foto = (atsakymas.profiliai.find((p) => p.photos && p.photos.length) || {}).photos;
      duomenys.issaugotiAtaskaita(req.user.id, 'palyginimas', raktas, pav, sant, foto ? foto[0] : null,
        { autos, rezultatas: atsakymas });
    } catch (e) { console.error('[DUOMENYS] palyginimo ataskaita:', e.message); }
    res.json(atsakymas);
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
function sujungtiVin(vinIsTeksto, analysis, vinPrefiksas) {
  if (vinIsTeksto) {
    return { vin: normalizuotiVin(vinIsTeksto), vinSaltinis: 'skelbimo tekstas', vinIsNuotraukos: false, vinPrefiksas: vinPrefiksas || null };
  }
  const isNuotr = analysis && analysis.vin_is_nuotraukos;
  if (arGaliojantisVin(isNuotr)) {
    const vin = normalizuotiVin(isNuotr);
    // Kryzmine patikra: jei portalas rodo VIN pradzia, ji turi sutapti su tuo,
    // ka AI nuskaite is nuotraukos. Nesutapimas reiskia, kad arba nuotraukoje
    // kito automobilio lipdukas, arba AI suklydo - tokio VIN geriau nerodyti.
    if (vinPrefiksas && !vin.startsWith(vinPrefiksas)) {
      return {
        vin: null, vinSaltinis: null, vinIsNuotraukos: false, vinPrefiksas,
        vinNesutapimas: `Nuotraukoje nuskaitytas ${vin} nesutampa su skelbime rodoma pradžia ${vinPrefiksas}…`,
      };
    }
    return {
      vin,
      vinSaltinis: (analysis.vin_nuotraukos_vieta || 'skelbimo nuotrauka'),
      vinIsNuotraukos: true,
      vinPatvirtintasPrefiksu: !!vinPrefiksas,
      vinPrefiksas: vinPrefiksas || null,
    };
  }
  return { vin: null, vinSaltinis: null, vinIsNuotraukos: false, vinPrefiksas: vinPrefiksas || null };
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

  // ---- TAS PATS AUTOMOBILIS KITUOSE SKELBIMUOSE ----
  // Sukaupta istorija leidzia atpazinti, kad tas pats auto jau buvo parduodamas:
  // to paties pardavejo is naujo, kito pardavejo kita kaina, arba - svarbiausia -
  // su DIDESNE rida nei nurodoma dabar.
  const taPatsAuto = cache.rastiTaPatiAuto(url) || [];
  const dabartinis = cache.gautiGyvavimoCikla(url);
  if (taPatsAuto.length) {
    const vinPatvirtinta = taPatsAuto[0].patikimas;
    // Be VIN tapatybes raktas yra tik modelis+metai+variklis+kuras+deze - pagal ji
    // sutampa VISI tos pacios komplektacijos automobiliai. Todel be VIN reikalaujam
    // papildomu irodymu: to paties pardavejo arba bent to paties skelbimo perkelimo.
    // Kitaip trys skirtingi 2023 m. X5 tampa "tuo paciu automobiliu".
    const pagrindas = vinPatvirtinta
      ? 'VIN sutapimas'
      : 'sutampa modelis, metai, variklis, kuras ir dėžė';
    const kaipVadinti = vinPatvirtinta ? 'Tas pats automobilis' : 'Labai panašus automobilis';

    taPatsAuto.forEach((kitas) => {
      const dienos = Math.round((Date.now() - (kitas.dingo || kitas.paskutinMatytas)) / 86400000);
      const tasPatsPardavejas = (kitas.pardavejas && dabartinis && dabartinis.pardavejas)
        ? kitas.pardavejas === dabartinis.pardavejas : null;

      // 1) RIDOS SUKTUMAS - stipriausias signalas, koki apskritai galima rasti
      const senaRida = kitas.dabartineRida || kitas.pirmaRida;
      const naujaRida = dabartinis && (dabartinis.dabartineRida || dabartinis.pirmaRida || null);
      // Kaltinimas ridos suktumu yra sunkus - keliam ji tik kai tapatybe tikrai zinoma
      if (senaRida && naujaRida && naujaRida < senaRida - 1000 && (vinPatvirtinta || tasPatsPardavejas === true)) {
        pastabos.push({
          tipas: 'ridos-suktumas', svarba: 'auksta',
          tekstas: `${kaipVadinti} anksčiau buvo skelbiamas su ${senaRida.toLocaleString('lt-LT')} km, dabar nurodyta ${naujaRida.toLocaleString('lt-LT')} km (${pagrindas}).`,
          kodel: 'Rida negali mažėti. Tai suktos ridos požymis – būtina VIN istorijos ataskaita ir serviso įrašų patikra prieš bet kokias derybas.',
        });
        return;
      }

      // 2) PERPARDUODAMAS - kitas pardavejas
      if (kitas.dingo && kitas.pardavejas && tasPatsPardavejas === false && vinPatvirtinta) {
        const senaKaina = kitas.dabartineKaina || kitas.pirmaKaina;
        const naujaKaina = dabartinis && dabartinis.pirmaKaina;
        const skirt = (senaKaina && naujaKaina) ? naujaKaina - senaKaina : null;
        pastabos.push({
          tipas: 'perparduodamas', svarba: 'auksta',
          tekstas: `Tą patį automobilį prieš ${dienos} d. pardavė ${kitas.pardavejas}` +
            (senaKaina ? ` už ${senaKaina.toLocaleString('lt-LT')} €` : '') + '.' +
            (skirt !== null ? ` Dabartinė kaina ${skirt >= 0 ? '+' : ''}${skirt.toLocaleString('lt-LT')} €.` : ''),
          kodel: skirt !== null && skirt > 0
            ? 'Automobilis perparduodamas su antkainiu. Paklauskite, kas buvo padaryta nuo tada – jei nieko, antkainis yra grynas perpardavėjo pelnas ir yra vietos deryboms.'
            : 'Automobilis jau keitė savininką neseniai. Verta išsiaiškinti, kodėl ankstesnis pirkėjas jo atsisakė.',
        });
        return;
      }

      // 3) TAS PATS PARDAVEJAS IKELE IS NAUJO - skelbimo amzius "atstatytas"
      if (kitas.dingo && tasPatsPardavejas === true) {
        const visoDienu = Math.round((Date.now() - kitas.pirmaMatytas) / 86400000);
        pastabos.push({
          tipas: 'ikeltas-is-naujo', svarba: 'auksta',
          tekstas: `Tas pats pardavėjas šį automobilį jau skelbė anksčiau – iš tikrųjų jis rinkoje apie ${visoDienu} d., ne ${dabartinis ? dabartinis.dienosRinkoje : '?'} d.`,
          kodel: 'Skelbimas nuimtas ir įkeltas iš naujo, todėl portale atrodo šviežias. Realiai už šią kainą niekas neperka jau ilgai – stipri pozicija deryboms.',
        });
        return;
      }

      // 4) TUO PAT METU SKELBIAMAS KITUR kita kaina
      // Reikalaujam arba VIN, arba to paties pardavejo, arba KITO portalo -
      // du skelbimai tame paciame portale su skirtingais pardavejais yra
      // tiesiog du skirtingi tos pacios komplektacijos automobiliai.
      const kitasPortalas = kitas.saltinis && dabartinis && dabartinis.saltinis
        && kitas.saltinis !== dabartinis.saltinis;
      if (!kitas.dingo && (vinPatvirtinta || tasPatsPardavejas === true || kitasPortalas)) {
        const senaKaina = kitas.dabartineKaina || kitas.pirmaKaina;
        const naujaKaina = dabartinis && dabartinis.pirmaKaina;
        if (senaKaina && naujaKaina && Math.abs(senaKaina - naujaKaina) > 200) {
          pastabos.push({
            tipas: 'kita-kaina-kitur', svarba: vinPatvirtinta ? 'auksta' : 'vidutine',
            tekstas: `${kaipVadinti} tuo pačiu metu skelbiamas ir ${kitas.saltinis || 'kitame portale'} už ${senaKaina.toLocaleString('lt-LT')} € (${pagrindas}).`,
            kodel: `Skirtumas ${Math.abs(senaKaina - naujaKaina).toLocaleString('lt-LT')} €. Derėkitės remdamiesi pigesniuoju skelbimu (${pagrindas}).`,
          });
        }
      }
    });
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
    } else if (ciklas.dienosRinkoje >= 21 && !pastabos.some((p) => p.tipas === 'ikeltas-is-naujo')) {
      pastabos.push({
        tipas: 'kabo', svarba: 'vidutine',
        tekstas: `Skelbimas rinkoje ${ciklas.dienosRinkoje} d.`,
        kodel: 'Trys savaitės be pirkėjo – yra vietos deryboms.',
      });
    } else if (ciklas.dienosRinkoje <= 2) {
      // "Šviežias" sakom TIK tada, kai tai tikrai naujas skelbimas. Jei aptikom,
      // kad tas pats auto jau buvo skelbiamas anksčiau, šviežumas yra apgaulingas
      // ir prieštarautų ką tik pridėtai pastabai.
      const jauBuvoSkelbiamas = pastabos.some((p) =>
        p.tipas === 'ikeltas-is-naujo' || p.tipas === 'perparduodamas' || p.tipas === 'ridos-suktumas');
      if (!jauBuvoSkelbiamas) {
        pastabos.push({
          tipas: 'sviezias', svarba: 'vidutine',
          tekstas: 'Skelbimas visai šviežias.',
          kodel: 'Geri pasiūlymai išgraibstomi per kelias dienas – jei tinka, nedelskite.',
        });
      }
    }
  }

  return { url, ciklas, laikoJuosta: laikoJuosta || [], kainuPokytis, pastabos };
}

// Tas pats automobilis, rastas KELIUOSE portaluose tos pacios paieskos metu.
// mergeDuplicatesAcrossPortals juos sulieja i viena, o likusius sudeda i
// kryzminiaiSkelbimai - iki siol jie niekur nebuvo rodomi.
function kryzminiuSkelbimuPastaba(kryzminiai, siKaina) {
  if (!kryzminiai || !kryzminiai.length) return null;
  const pigiausias = kryzminiai.slice().sort((a, b) => (a.kaina || Infinity) - (b.kaina || Infinity))[0];
  const skirt = (siKaina && pigiausias.kaina) ? pigiausias.kaina - siKaina : null;
  return {
    tipas: 'kituose-portaluose',
    svarba: (skirt !== null && skirt < -200) ? 'auksta' : 'vidutine',
    tekstas: kryzminiai.length === 1
      ? `Tas pats automobilis skelbiamas ir ${pigiausias.source}` + (pigiausias.kaina ? ` už ${pigiausias.kaina.toLocaleString('lt-LT')} €` : '') + '.'
      : `Tas pats automobilis skelbiamas dar ${kryzminiai.length} portaluose (pigiausiai ${pigiausias.source}` + (pigiausias.kaina ? ` už ${pigiausias.kaina.toLocaleString('lt-LT')} €` : '') + ').',
    kodel: (skirt !== null && skirt < -200)
      ? `Kitame portale ${Math.abs(skirt).toLocaleString('lt-LT')} € pigiau – pirkite ten arba naudokite tai kaip derybų argumentą.`
      : 'Tas pats pardavėjas skelbia keliose vietose. Kainos gali skirtis – patikrinkite abi.',
    nuorodos: kryzminiai.map((k) => ({ source: k.source, url: k.url, kaina: k.kaina })),
  };
}

// Vieno skelbimo istorija
app.get('/api/listing-history', requireAuth, (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Trūksta url parametro' });
  const santrauka = sudarytiIstorijosSantrauka(url);
  if (!santrauka) return res.json({ turimeDuomenu: false });
  res.json({ turimeDuomenu: true, ...santrauka });
});

// Modelio tendencijos ir sezoniskumas
app.get('/api/model-trends', requireAuth, (req, res) => {
  const modelis = req.query.modelis;
  if (!modelis) return res.status(400).json({ error: 'Trūksta modelis parametro' });
  res.json({
    modelis,
    tendencijos: cache.modelioTendencijos(modelis),
    pardavimoGreitis: cache.modelioPardavimoGreitis(modelis),
  });
});

// Frontend praneša, kuriuos skelbimus verta sekti (išsaugoti lieka naršyklėje)
app.post('/api/watch', requireAuth, planai.reikalautiPlano('business'), (req, res) => {
  const { urls, meta } = req.body || {};
  if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls turi būti masyvas' });
  const nauji = cache.pridetiSekimui(urls.slice(0, 200), meta || null);
  res.json({ sekama: cache.sekamiUrlai().length, nauji });
});

// Kas pasikeitė nurodytiems skelbimams
app.post('/api/listing-changes', requireAuth, (req, res) => {
  const { urls } = req.body || {};
  if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls turi būti masyvas' });
  cache.pridetiSekimui(urls.slice(0, 200), null); // kartu itraukiam i sekima
  const kryzminiai = (req.body && req.body.kryzminiai) || {}; // { url: [ {source,url,kaina} ] }
  const rezultatai = urls.slice(0, 200).map((u) => {
    const r = sudarytiIstorijosSantrauka(u);
    if (!r) return null;
    const kaina = (req.body.kainos && req.body.kainos[u]) || null;
    const kp = kryzminiuSkelbimuPastaba(kryzminiai[u], kaina);
    if (kp) r.pastabos.unshift(kp);
    return r;
  }).filter(Boolean);
  const suPokyciais = rezultatai.filter((r) => r.pastabos.some((p) => p.svarba === 'auksta'));
  res.json({ skelbimai: rezultatai, pokyciuSkaicius: suPokyciais.length });
});

// ---- KASDIENIS SEKAMU SKELBIMU TIKRINIMAS ----
// Kartą per parą pertikrinam sekamus skelbimus: ar kaina/rida pasikeitė, ar dar gyvas.
let _tikrinimasVyksta = false;

async function tikrintiSekamus() {
  if (_tikrinimasVyksta) return;
  _tikrinimasVyksta = true;
  try {
  const pasalinta = cache.valytiSekimoSarasa();
  const urls = cache.sekamiUrlai();
  console.log(`[SEKIMAS] Pradedam kasdienį tikrinimą: ${urls.length} skelbimų (pašalinta pasenusių: ${pasalinta})`);
  let pokyciu = 0, dingusiu = 0, klaidu = 0;

  for (const url of urls) {
    try {
      const { fullText, kaina, rida } = await patikrintiViena(url);
      if (fullText === null) {
        // v1.23.0 PATAISYTA: vienas nepavykes nuskaitymas (captcha, timeout, kitoks sablonas)
        // NERA irodymas, kad skelbimas pasalintas. Zymim tik po antro kartos is eiles.
        const praleista = cache.zymetiNerasta(url);
        if (praleista >= 2) {
          const d = cache.zymetiDingusi(url);
          if (d) { dingusiu++; console.log(`[SEKIMAS] Dingo: ${url} (kabojo ${d.dienosRinkoje} d.)`); }
        } else {
          klaidu++;
          console.log(`[SEKIMAS] Nepavyko perskaityti (${praleista} k.): ${url}`);
        }
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
  } finally {
    // PATAISYTA: be finally viena klaida (pvz. pilnas diskas) palikdavo veliava
    // true, ir kasdienis tikrinimas nebeveikdavo iki serverio perkrovimo.
    _tikrinimasVyksta = false;
  }
}

// Nuskaito viena skelbima ir istraukia kaina/rida. Grazina fullText=null, jei skelbimo nebera.
async function patikrintiViena(url) {
  try {
    // PATAISYTA: sekimui reikia TIK kainos ir ridos - dviem regex'ais is teksto.
    // Anksciau buvo kvieciamas pilnas scrapeSingleListing su render=true
    // (~10 kreditu). 200 sekamu skelbimu = 2000 kreditu KASDIEN. Dabar 200.
    const pigusHtml = await fetchSearchPage(url).catch(() => null);
    if (pigusHtml && pigusHtml.length > 500) {
      const t = cheerio.load(pigusHtml)('body').text().replace(/\s+/g, ' ');
      if (t.length > 200) {
        const km = t.match(/(\d[\d\s]{3,8})\s*€/);
        const kr = t.match(/(\d[\d\s]{2,8})\s*km/i);
        const kaina = km ? parseInt(km[1].replace(/\s/g, ''), 10) : null;
        const rida = kr ? parseInt(kr[1].replace(/\s/g, ''), 10) : null;
        if (kaina && kaina > 300) return { fullText: t, kaina, rida };
      }
    }
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

// v1.23.0 NEMOKAMAS pirminis VIN patikrinimas. Atsako i tai, kas uzkoduota paciame VIN
// (gamintojas, salis, modelio metai, kontrolinis skaitmuo), pasitikrina nemokamoje NHTSA
// bazeje ir palygina su skelbimo duomenimis. Kreditas nuskaitomas tik uz gilu
// /api/vin-lookup (aukcionu ir zalu istorija).
app.post('/api/vin-check', requireAuth, async (req, res) => {
  try {
    const { vin, metai, modelis, url } = req.body || {};
    const r = await vinTikrinimas.pilnasPatikrinimas(vin, { metai, modelis });
    if (!r.ok) return res.status(400).json(r);
    let matyta = [];
    try { matyta = cache.rastiPagalVin(r.vin).filter((m) => !url || m.url !== url); } catch (e) {}
    if (matyta.length) {
      r.pastabos.push({
        svarba: 'vidutine',
        tekstas: `Šį VIN mūsų sistema jau matė ${matyta.length} kitame skelbime – žemiau matote, kada ir už kiek jis buvo siūlomas.`,
      });
    }
    // v1.26.0: kur vartotojas gali pats pasiziureti GAMYKLINE komplektacija pagal VIN
    r.dekoderis = komplektacija.dekoderisPagalVin(r.vin, r.dekodavimas && r.dekodavimas.gamintojas);
    res.json({ ...r, matytaAnksciau: matyta });
  } catch (err) {
    console.error('[VIN-CHECK]', err.message);
    res.status(500).json({ error: 'Nepavyko patikrinti VIN' });
  }
});

// v1.26.0 NEMOKAMA: vartotojo ikliuotas gamyklinis komplektacijos sarasas sulyginamas
// su skelbimo iranga. Jokio AI, jokiu kreditu - tik tekstine analize musu puseje.
// Automatiskai svetimu dekoderiu NEnuskaitom (pvz. mdecoder.com robots.txt to draudzia).
app.post('/api/build-sheet', requireAuth, (req, res) => {
  try {
    const { tekstas, url } = req.body || {};
    if (!tekstas || String(tekstas).trim().length < 10) {
      return res.status(400).json({ error: 'Įklijuokite gamyklinės komplektacijos sąrašą' });
    }
    const gamykliniai = komplektacija.parseBuildSheet(tekstas);
    if (!gamykliniai.length) {
      return res.status(400).json({ error: 'Sąraše neradome nė vienos įrangos pozicijos – patikrinkite, ką nukopijavote' });
    }
    // Skelbimo iranga imam is jau padarytos analizes podelio (jei yra)
    let iranga = null, aprasymas = null;
    if (url) {
      const c = cache.getCached('analysis', url, ANALIZES_PODELIS_MS);
      if (c) { iranga = c.iranga || null; aprasymas = c.aprasymas || null; }
    }
    const rez = komplektacija.sulyginti(gamykliniai, iranga, aprasymas);
    res.json({ ...rez, beSkelbimoIrangos: !iranga });
  } catch (err) {
    console.error('[BUILD-SHEET]', err.message);
    res.status(500).json({ error: 'Nepavyko apdoroti sąrašo' });
  }
});

app.post('/api/vin-lookup', requireAuth, planai.reikalautiKreditu('vin', (r) => (r.body && r.body.vin) ? String(r.body.vin).toUpperCase() : null), async (req, res) => {
  try {
    const { vin, force } = req.body;
    if (!vin || vin.length !== 17) return res.status(400).json({ error: 'Neteisingas VIN kodas (turi būti 17 simbolių)' });

    if (!force) {
      const cached = cache.getCached('vin', vin, cache.ANALYSIS_TTL_MS);
      if (cached) {
        const ageMin = cache.cacheAgeMinutes('vin', vin);
        duomenys.issaugotiAtaskaita(req.user.id, 'vin', String(vin).toUpperCase(), 'VIN ' + String(vin).toUpperCase(), cached.santrauka || cached.zalos_aprasas || null, null, cached);
        return res.json({ ...cached, cached: true, cacheAgeMinutes: ageMin });
      }
    }

    const result = await searchVinHistory(vin, { modelis: req.body.modelis, metai: req.body.metai });
    if (result && result.nepavyko) {
      // v1.23.1: neveikusi paieska neturi kainuoti kredito. 5xx atsakymas ijungia
      // automatini kredito grazinima planai.reikalautiKreditu viduje.
      return res.status(503).json({ ...result, error: result.isvada });
    }
    cache.setCached('vin', vin, result);
    duomenys.issaugotiAtaskaita(req.user.id, 'vin', String(vin).toUpperCase(), 'VIN ' + String(vin).toUpperCase(), result.santrauka || result.zalos_aprasas || null, null, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seller-lookup', requireAuth, planai.reikalautiKreditu('pardavejas', (r) => (r.body && r.body.pardavejas) ? String(r.body.pardavejas).toLowerCase().trim() : null), async (req, res) => {
  try {
    const { pardavejas, force, listingUrl } = req.body;
    if (!pardavejas) return res.status(400).json({ error: 'Trūksta pardavėjo pavadinimo' });

    if (!force) {
      const cached = cache.getCached('seller', pardavejas, cache.ANALYSIS_TTL_MS);
      if (cached) {
        const ageMin = cache.cacheAgeMinutes('seller', pardavejas);
        duomenys.issaugotiAtaskaita(req.user.id, 'pardavejas', String(pardavejas).toLowerCase().trim(), 'Pardavėjas: ' + pardavejas, cached.santrauka || cached.reputacija || null, null, { pardavejas, listingUrl, rezultatas: cached });
        return res.json({ ...cached, cached: true, cacheAgeMinutes: ageMin });
      }
    }

    const result = await searchSellerInfo(pardavejas, listingUrl);
    cache.setCached('seller', pardavejas, result);
    duomenys.issaugotiAtaskaita(req.user.id, 'pardavejas', String(pardavejas).toLowerCase().trim(), 'Pardavėjas: ' + pardavejas, result.santrauka || result.reputacija || null, null, { pardavejas, listingUrl, rezultatas: result });
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

    if (/skelbimas (nerastas|nebeaktyvus|neaktyvus|pasibaig)|skelbimo nebera|puslapis nerastas|straipsnis nerastas|404 not found/i.test(topText)) {
      return { status: 'removed' };
    }
    const isReserved = /rezervuota/i.test(topText);
    // v1.23.0 PATAISYTA: kaina imama strukturiskai; jei jos nerandam (portalas grazino
    // captcha, kitoki sablona ar nuskaitymas nepavyko) - tai NEREISKIA, kad skelbimas
    // pasalintas. Tokiu atveju grazinam 'unknown' ir vartotojui nieko neteigiam.
    let currentPrice = null;
    const strukKaina = $('.announcement-pricing-info strong').first().text().replace(/[^0-9]/g, '');
    if (strukKaina) currentPrice = parseInt(strukKaina, 10);
    if (!currentPrice) {
      const priceMatch = bodyText.match(/(\d[\d\s\u00a0]{2,7})\s?€/);
      currentPrice = priceMatch ? parseInt(priceMatch[1].replace(/[\s\u00a0]/g, ''), 10) : null;
    }
    if (!currentPrice || currentPrice < 300) {
      return { status: 'unknown', priezastis: 'Nepavyko perskaityti kainos – skelbimo būsena nepatvirtinta' };
    }
    return { status: isReserved ? 'reserved' : 'active', currentPrice };
  } catch (err) {
    // PATAISYTA: tinklo klaida nera irodymas, kad skelbimas pasalintas.
    return { status: 'unknown', priezastis: 'Nepavyko patikrinti' };
  }
}

// v1.23.1 PAPILDOMA PASLAUGA: vienu paspaudimu pertikrinam VISUS megstamiausius -
// ar kaina pasikeite, ar rezervuota, ar dar skelbiama. 1 kreditas uz visa sarasa
// (per para tas pats vartotojas moka viena karta - raktas yra diena).
app.post('/api/megstamiausi/atnaujinti', requireAuth,
  planai.reikalautiKreditu('megstamiuAtnaujinimas', (r) => 'visi-' + new Date().toISOString().slice(0, 10)),
  async (req, res) => {
    try {
      const sarasas = duomenys.megstamiausi(req.user.id) || [];
      if (!sarasas.length) return res.json({ patikrinta: 0, pokyciai: [] });
      const RIBA = 25;
      const imtis = sarasas.slice(0, RIBA);
      const pokyciai = [];
      let nepavyko = 0;
      for (const f of imtis) {
        try {
          const b = await checkFavoriteStatus(f.url);
          if (b.status === 'unknown') { nepavyko++; continue; }
          if (b.status === 'removed') {
            const praleista = cache.zymetiNerasta(f.url);
            if (praleista >= 2) {
              cache.zymetiDingusi(f.url);
              pokyciai.push({ url: f.url, modelis: f.modelis || null, tipas: 'dingo', tekstas: 'Skelbimo nebematome portale' });
            }
            continue;
          }
          cache.zymetiMatyta({ url: f.url, kaina: b.currentPrice, modelis: f.modelis, metai: f.metai });
          const eile = cache.getListingTimeline(f.url) || [];
          const buvo = eile.length ? eile[eile.length - 1].k : (f.kaina || null);
          if (b.currentPrice) cache.recordListingSnapshot(f.url, b.currentPrice, null);
          if (buvo && b.currentPrice && buvo !== b.currentPrice) {
            pokyciai.push({
              url: f.url, modelis: f.modelis || null, tipas: b.currentPrice < buvo ? 'kaina-mazeja' : 'kaina-auga',
              sena: buvo, nauja: b.currentPrice,
              tekstas: `${f.modelis || 'Skelbimas'}: ${buvo} € → ${b.currentPrice} €`,
            });
          }
          if (b.status === 'reserved') {
            pokyciai.push({ url: f.url, modelis: f.modelis || null, tipas: 'rezervuota', tekstas: `${f.modelis || 'Skelbimas'}: pažymėtas kaip rezervuotas` });
          }
          cache.zymetiPatikrinta(f.url);
        } catch (e) { nepavyko++; }
      }
      cache.saveLifecycle();
      res.json({ patikrinta: imtis.length - nepavyko, nepavyko, viso: sarasas.length, ribojama: sarasas.length > RIBA ? RIBA : null, pokyciai });
    } catch (err) {
      console.error('[MEGSTAMIAUSI-ATNAUJINIMAS]', err.message);
      res.status(500).json({ error: 'Nepavyko atnaujinti' });
    }
  });

app.post('/api/check-favorite', requireAuth, async (req, res) => {
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

// Autoplius markiu/modeliu ID lentele: SEED veikia is karto, pilna parsisiunciama fone 1 k./men.
try {
  const isvalyta = cache.valytiSenusDingo();
  if (isvalyta) console.log(`[SEKIMAS] Isvalyta ${isvalyta} klaidingu "dingo" zymu (sena logika).`);
} catch (e) { console.error('[SEKIMAS] valymo klaida:', e.message); }
autopliusIds.prijungti(cache.DATA_DIR, (u) => fetchSearchPage(u));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Car Triage App veikia: http://localhost:${PORT}`));
