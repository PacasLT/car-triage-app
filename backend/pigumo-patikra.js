// pigumo-patikra.js — KODĖL šis skelbimas per pigus (v2.25.0).
//
// Luko sprendimas 10-19 („gerai darom", KL-1019-0030) – trys pakopos, kiekviena
// atsako tik tai, kam jos užtenka, ir pigesnė visada eina pirma:
//
//   1 pakopa   0 €        skelbimo TEKSTAS: ar priežastis jau parašyta
//   2 pakopa   ~0,002 €   Haiku + PIRMA miniatiūra: ar tekstas ir nuotrauka sutampa
//   3 pakopa   0,062 €    Sonnet + 6 nuotraukos: tikra būklė – TIK kai 2 pakopa
//                         sako „nepaaiškinta" (serveryje, su riba vienai paieškai)
//
// Pakopų eiliškumas yra visa šio modulio esmė: jei tekste parašyta „daužtas",
// nuotraukos nebereikia – priežastis jau žinoma ir pinigai nededami.
//
// GALIOJA TA PATI RIBA KAIP `nuotrauku-analize.js`:
//   MATOME → APRAŠOME. ĮTARIAME → ĮSPĖJAME. NEŽINOME → NEIŠGALVOJAME.
// Viena nuotrauka negali pasakyti, ar automobilis daužtas. Ji gali pasakyti,
// ar tai TAS automobilis, kuris aprašytas, ir ar matosi tai, kas rašoma.
// Uždraustų frazių sargas ir čia yra `nuotrauku-analize.js` sąrašas – vienas
// sąrašas visam produktui, kad dvi vietos nenueitų skirtingais keliais.

const { DRAUDZIAMA, nuasmeninti } = require('./nuotrauku-analize');

// ── Kainos (USD / 1 mln. tokenų) ───────────────────────────────────────────
// Reikia ne grožiui: 2 pakopa leidžiama tik tada, jei matuojam, kiek ji kainuoja.
// Kursas atsarginis – tikslumo iki cento čia nereikia, reikia eilės.
const KAINOS = {
  'claude-haiku-4-5':  { in: 1, out: 5 },
  'claude-sonnet-4-5': { in: 3, out: 15 },
  'claude-opus-4-5':   { in: 5, out: 25 },
};
const USD_EUR = 0.92;

function kainaEur(model, usage) {
  const k = KAINOS[model] || KAINOS['claude-haiku-4-5'];
  const i = (usage && usage.input_tokens) || 0;
  const o = (usage && usage.output_tokens) || 0;
  return ((i / 1e6) * k.in + (o / 1e6) * k.out) * USD_EUR;
}

// ── 1 PAKOPA · tekstas (0 €) ───────────────────────────────────────────────
// Skelbimo tekstas yra vienintelis šaltinis, kuriam LEIDŽIAMA pasakyti
// „daužtas": tai pardavėjo teiginys, ne mūsų išvada. Todėl čia frazės
// ieškomos tiesiai, o `lygis` visada „tekste" – cituojam, nevertinam.
// Portalai penki, tad ir žodžiai keturiomis kalbomis (LT, DE, PL, EN).
const TEKSTO_PRIEZASTYS = [
  { kodas: 'zala', pav: 'skelbime nurodyta žala',
    re: /\bdauzt\w*|\bdauzt\b|\bpo avarij\w*|\bapgadint\w*|\bunfall\w*|\bbeschadigt\w*|\bunfallschaden\b|\buszkodzon\w*|\bpowypadkow\w*|\bdamaged\b|\baccident\b|\bsalvage\b/i },
  { kodas: 'neveikia', pav: 'nurodytas techninis gedimas',
    re: /\bnevaziuoj\w*|\bneuzsiveda\b|\bvariklio defekt\w*|\bvariklis nedirb\w*|\bmotorschaden\b|\bgetriebeschaden\b|\bnicht fahrbereit\b|\bniesprawn\w*|\bsilnik do remontu\b|\bnot running\b|\bengine (fault|problem)\b/i },
  { kodas: 'dalimis', pav: 'parduodamas dalimis / kaip donoras',
    re: /\bdalimis\b|\bardomas\b|\bna czesci\b|\bersatzteilspender\b|\bersatzteiltrager\b|\bfor parts\b/i },
  { kodas: 'beTA', pav: 'be techninės apžiūros',
    re: /\bbe TA\b|\bTA neprav\w*|\bbe technines apziuros\b|\bohne tuv\b|\btuv neu nein\b|\bbez przegladu\b|\bno mot\b/i },
  { kodas: 'aukcionas', pav: 'aukciono / JAV automobilis',
    re: /\baukcion\w*|\bcopart\b|\biaai\b|\bauction\b|\bjav aukcion\w*|\bis amerik\w*|\bamerikos automobil\w*/i },
  { kodas: 'lizingas', pav: 'rodoma lizingo įmoka, ne kaina',
    re: /\blizing\w*|\bissimoketinai\b|\bimoka nuo\b|\bmen\. imoka\b|\bleasing\w*|\brate ab\b|\bmonatlich ab\b|\brata od\b/i },
  { kodas: 'eksportas', pav: 'kaina be PVM / eksportui',
    re: /\bbe pvm\b|\beksportui\b|\bexport price\b|\bnetto\b|\bexportpreis\b|\bcena netto\b/i },
  { kodas: 'rida', pav: 'rida nenurodyta arba kelia klausimų',
    re: /\brida nezinom\w*|\brida neaisk\w*|\bskaitliukas nedirb\w*|\btacho defekt\w*|\bprzebieg nieznany\b/i },
];

// Grąžina VISAS tekste rastas priežastis (viena nepaneigia kitos: „daužtas,
// parduodamas dalimis" yra du skirtingi faktai apie tą patį automobilį).
function tekstoPriezastys(listing) {
  const t = nuasmeninti([ (listing && listing.rawText) || '', (listing && listing.title) || '',
    ((listing && listing.galimiDefektai) || []).join(' ') ].join(' \n '));
  const out = [];
  TEKSTO_PRIEZASTYS.forEach((p) => { if (p.re.test(t)) out.push({ kodas: p.kodas, pav: p.pav }); });
  // Kryžminis skelbimas ta pačia kaina nėra priežastis, bet skelbimas kitame
  // portale PIGIAU – yra: pardavėjas pats parodė, kiek jis prašo iš tikrųjų.
  const kr = (listing && listing.kryzminiaiSkelbimai) || [];
  if (kr.some((k) => k && k.kaina && listing.kaina && k.kaina < listing.kaina * 0.9)) {
    out.push({ kodas: 'kryzminis', pav: 'tas pats automobilis kitame portale kita kaina' });
  }
  return out;
}

// ── Ar skelbimas apskritai „per pigus" ─────────────────────────────────────
// Tik nuo PATIKIMOS medianos. Plona imtis duoda netikras nuolaidas, o už
// kiekvieną netikrą nuolaidą mes sumokėtume tikrais pinigais.
function arPigus(l, riba, minImtis) {
  const r = Number.isFinite(riba) ? riba : 25;
  const m = Number.isFinite(minImtis) ? minImtis : 5;
  return !!l && l.diffPct != null && l.diffPct >= r && (l.marketCount || 0) >= m;
}

// ── 2 PAKOPA · instrukcija (statinė – kešuojama) ───────────────────────────
const INSTRUKCIJA = `Tu tikrini VIENA automobilio skelbimo nuotrauka ir skelbimo teksta. Uzduotis NE
ivertinti automobili, o atsakyti i du klausimus:
  1) ar nuotraukoje yra TAS automobilis, kuris aprasytas tekste;
  2) ar nuotraukoje MATOSI kas nors, kas paaiskina, kodel kaina zemesne uz rinka.

RIBOS, kuriu negalima perzengti:
- Viena nuotrauka NEGALI pasakyti, ar automobilis dauztas, ar rida tikra, ar variklis
  tvarkingas. NIEKADA taip nerasyk. Rasyk tik tai, kas MATOMA: "matomas kitas dazu
  atspalvis ant priekinio desinio sparno".
- Jei nesi tikras - rasyk "galimi", ne "matomi". Neaiskumas yra atsakymas, ne klaida.
- Ko nuotraukoje nesimato, to NEGALIMA laikyti nei pliusu, nei minusu.

Grazink TIK JSON (be markdown):
{
 "tas_pats": true/false,          // ar nuotraukoje tos pacios markes/klases/kebulo auto, kaip tekste
 "kebulas": "sedanas|universalas|hecbekas|visureigis|kupe|kabrioletas|vienatursis|pikapas|nezinoma",
 "rodoma": "ka rodo nuotrauka (pvz. visas auto is priekio kaires)",
 "matoma": ["iki 4 trumpu FAKTU, ka matai", "be isvadu"],
 "zalos_pozymiai": "nera|galimi|matomi",
 "nuotraukos_kokybe": "gera|tamsi|neryski|katalogo|ne_automobilis",
 "pigumo_priezastis": "zala|rida|komplektacija|modifikacija|kokybe|nepaaiskinta",
 "kodel": "vienas sakinys lietuviskai, kodel manai, kad kaina zemesne",
 "verta_pilnos": true/false       // ar verta uz 0,06 EUR atidaryti visas nuotraukas
}`;

const PRIEZASTYS_2 = ['zala', 'rida', 'komplektacija', 'modifikacija', 'kokybe', 'nepaaiskinta'];

// Priezasciu vardai zmogui. Stovi PRIES `apdoroti`, nes `const` nera keliamas
// i virsu (tik `function`) - apacioje jis buvo `ReferenceError` kviečiant.
const PAV = {
  zala: 'žala', rida: 'rida', komplektacija: 'komplektacija', modifikacija: 'pakeitimai',
  kokybe: 'nuotraukų kokybė', neatitinka: 'nuotrauka neatitinka aprašymo',
  ne_automobilis: 'nuotraukoje ne šis automobilis', nepaaiskinta: 'nepaaiškinta',
  neveikia: 'techninis gedimas', dalimis: 'parduodamas dalimis', beTA: 'be TA',
  aukcionas: 'aukcionas', lizingas: 'lizingo įmoka', eksportas: 'kaina be PVM',
  kryzminis: 'kita kaina kitame portale',
};

// Tas pats sargas kaip vizualiniame sluoksnyje: uzdrausta fraze iskerpama,
// o teiginys nuleidziamas i „galimas".
function nuplautiTeiginius(tekstas) {
  let t = String(tekstas || '').trim();
  const pastabos = [];
  for (let i = 0; i < DRAUDZIAMA.length; i++) {
    const d = DRAUDZIAMA[i];
    let saugiklis = 0;
    let m = d.re.exec(nuasmeninti(t));
    while (m && saugiklis++ < 5) {
      if (pastabos.indexOf(d.kodel) === -1) pastabos.push(d.kodel);
      t = t.slice(0, m.index) + t.slice(m.index + m[0].length);
      m = d.re.exec(nuasmeninti(t));
    }
  }
  if (pastabos.length) {
    t = t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/^[\s,.;:–-]+/, '').trim();
    if (t.length < 12) t = 'Nuotraukoje matomas požymis, kurio patvirtinti negalima';
    t += ' — neteiktinas teiginys pašalintas (' + pastabos.join('; ') + ').';
  }
  return t;
}

// Modelio atsakyma paverciam musu verdiktu. Atskira funkcija, kad sargai
// galetu tikrinti be tinklo.
function apdoroti(j, opts) {
  const o = opts || {};
  const tasPats = j.tas_pats === false ? false : (j.tas_pats === true ? true : null);
  const kokybe = ['gera', 'tamsi', 'neryski', 'katalogo', 'ne_automobilis'].indexOf(j.nuotraukos_kokybe) !== -1
    ? j.nuotraukos_kokybe : 'gera';
  const zalos = ['nera', 'galimi', 'matomi'].indexOf(j.zalos_pozymiai) !== -1 ? j.zalos_pozymiai : 'nera';
  let priezastis = PRIEZASTYS_2.indexOf(j.pigumo_priezastis) !== -1 ? j.pigumo_priezastis : 'nepaaiskinta';

  // Du atvejai nugali modelio atsakyma, nes jie svarbesni uz bet kuria priezasti:
  // nuotraukoje ne tas automobilis arba apskritai ne automobilis.
  if (kokybe === 'ne_automobilis') priezastis = 'ne_automobilis';
  else if (tasPats === false) priezastis = 'neatitinka';
  // Zala is vienos nuotraukos niekada nera „matoma" — tik pozymis.
  const lygis = priezastis === 'nepaaiskinta' ? 'nezinoma'
    : (zalos === 'matomi' && priezastis === 'zala') ? 'galimas'
    : (kokybe === 'ne_automobilis' || tasPats === false) ? 'matoma' : 'galimas';

  const matoma = (Array.isArray(j.matoma) ? j.matoma : []).slice(0, 4)
    .map((x) => nuplautiTeiginius(String(x).slice(0, 160))).filter((x) => x.length > 3);

  // „Verta pilnos" sprendziam MES, ne modelis: pilna analize turi prasme tik
  // tada, kai liko neatsakytas klausimas, o ne tada, kai modeliui smalsu.
  const reikiaPilnos = priezastis === 'nepaaiskinta' || priezastis === 'neatitinka'
    || zalos === 'galimi' || kokybe === 'neryski' || kokybe === 'tamsi' || kokybe === 'katalogo';

  return {
    pakopa: 2,
    priezastis,
    lygis,
    antraste: priezastis === 'nepaaiskinta' ? 'PRIEŽASTIS NESIMATO'
      : (priezastis === 'neatitinka' || priezastis === 'ne_automobilis') ? 'NUOTRAUKA NEATITINKA'
      : 'KODĖL PIGU',
    zyma: priezastis === 'nepaaiskinta' ? 'Pigu: nesimato'
      : (priezastis === 'neatitinka' || priezastis === 'ne_automobilis') ? 'Nuotr. ≠ aprašymas'
      : 'Pigu: ' + (PAV[priezastis] || priezastis),
    tasPats,
    kebulas: typeof j.kebulas === 'string' ? j.kebulas.slice(0, 20) : 'nezinoma',
    rodoma: j.rodoma ? String(j.rodoma).slice(0, 120) : null,
    matoma,
    zalosPozymiai: zalos,
    nuotraukosKokybe: kokybe,
    tekstas: nuplautiTeiginius(j.kodel || '').slice(0, 300)
      || (priezastis === 'nepaaiskinta'
        ? 'Nuotraukoje nesimato, kodėl kaina žemesnė už rinką – verta pilnos apžvalgos.'
        : null),
    reikiaPilnos,
    nuotraukosUrl: o.nuotraukosUrl || null,
  };
}

// ── 2 pakopos kvietimas ────────────────────────────────────────────────────
// `anthropic` ir `img` perduodami is isores: modulis testuojamas be tinklo ir
// be rakto, o nuotrauka parsiunciama serveryje (ScraperAPI kreditu nekainuoja).
async function patikra(opts) {
  const { anthropic, model, listing, img } = opts || {};
  if (!anthropic || !img || !img.data) return null;
  const l = listing || {};
  const content = [
    { type: 'text', text: INSTRUKCIJA, cache_control: { type: 'ephemeral' } },
    { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
    { type: 'text', text: 'Skelbimas: ' + [l.modelis, l.metai ? l.metai + ' m.' : null,
      l.rida ? l.rida + ' km' : null, l.kuras, l.kaina ? l.kaina + ' EUR' : null].filter(Boolean).join(', ')
      + '. Kaina ' + (l.diffPct != null ? l.diffPct + '% zemiau ' : 'nezinia kiek zemiau ')
      + (l.rinkosVardas || 'rinkos') + ' medianos (imtis ' + (l.marketCount || '?') + ').'
      + '\nSkelbimo tekstas: ' + String(l.rawText || '').slice(0, 1200) },
  ];
  const resp = await anthropic.messages.create({ model, max_tokens: 400, messages: [{ role: 'user', content }] });
  const raw = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const m = raw.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
  const usage = {
    in: (resp.usage && resp.usage.input_tokens) || 0,
    out: (resp.usage && resp.usage.output_tokens) || 0,
    eur: kainaEur(model, resp.usage), model,
  };
  if (!m) return { pakopa: 2, priezastis: 'nepaaiskinta', lygis: 'nezinoma', tekstas: null,
    matoma: [], reikiaPilnos: true, usage };
  let j;
  try { j = JSON.parse(m[0]); } catch (e) {
    return { pakopa: 2, priezastis: 'nepaaiskinta', lygis: 'nezinoma', tekstas: null,
      matoma: [], reikiaPilnos: true, usage };
  }
  const v = apdoroti(j, { nuotraukosUrl: opts.nuotraukosUrl });
  v.usage = usage;
  return v;
}

// ── 1 pakopos verdiktas (be AI) ────────────────────────────────────────────
function tekstoVerdiktas(priezastys) {
  if (!priezastys || !priezastys.length) return null;
  return {
    pakopa: 1,
    priezastis: priezastys[0].kodas,
    lygis: 'tekste',
    antraste: 'KODĖL PIGU',
    zyma: 'Pigu: ' + (PAV[priezastys[0].kodas] || priezastys[0].kodas),
    visos: priezastys.map((p) => p.kodas),
    tekstas: 'Kaina paaiškinta pačiame skelbime: ' + priezastys.map((p) => p.pav).join('; ') + '.',
    matoma: [],
    reikiaPilnos: false,
    usage: null,
  };
}

// Viena eilutė žmogui (kortelė, lentelė). Niekada nerašo kategoriškiau, nei
// leidžia pakopa: 1 pakopa cituoja skelbimą, 2 – kalba apie požymius.
function santrauka(v) {
  if (!v) return null;
  const p = PAV[v.priezastis] || v.priezastis;
  if (v.pakopa === 1) return 'Pigu – ' + p + ' (nurodyta skelbime)';
  if (v.priezastis === 'nepaaiskinta') return 'Pigu – priežastis nuotraukoje nesimato';
  return 'Pigu – ' + p + (v.lygis === 'galimas' ? ' (galimas požymis nuotraukoje)' : ' (matoma nuotraukoje)');
}

module.exports = {
  KAINOS, USD_EUR, kainaEur,
  TEKSTO_PRIEZASTYS, tekstoPriezastys, tekstoVerdiktas,
  arPigus, INSTRUKCIJA, PRIEZASTYS_2, nuplautiTeiginius, apdoroti, patikra,
  PAV, santrauka,
};
