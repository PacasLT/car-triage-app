// nuotrauku-analize.js — CarTriige vizualinis standartas (v1.24.0).
//
// TAISYKLĖ, kuria remiasi visas šis modulis:
//   MATOME → APRAŠOME. ĮTARIAME → ĮSPĖJAME. NEŽINOME → NEIŠGALVOJAME.
//
// Nuotraukų AI yra ĮRODYMŲ SLUOKSNIS (evidence layer), o ne automobilio teisėjas.
// Jis grąžina tik tai, kas matoma, su nuotraukos numeriu, o verdiktą iš to daro
// kitas sluoksnis (gili analizė) kartu su rinkos, istorijos ir įrangos duomenimis.
//
// Kodėl daug logikos yra ČIA, o ne prompte: promptas gali būti „pamirštas“, o
// kodas – ne. Todėl lygį (matoma/galimas/neįmanoma), formuluotes ir pasitikėjimo
// procentą galutinai nustato šios funkcijos, o ne modelis.

const LYGIAI = { MATOMA: 'matoma', GALIMAS: 'galimas', NEIMANOMA: 'neimanoma' };

// Rakursai. Privalomi sveria daugiau - dugno ar variklio nuotrauka skelbimuose
// yra retenybė, todėl jos nebuvimas negali „nuskandinti“ įvertinimo.
const RAKURSAI = {
  priekis: { svoris: 12, privalomas: true, pav: 'priekis' },
  galas: { svoris: 12, privalomas: true, pav: 'galas' },
  kaire: { svoris: 12, privalomas: true, pav: 'kairė pusė' },
  desine: { svoris: 12, privalomas: true, pav: 'dešinė pusė' },
  salonas: { svoris: 12, privalomas: true, pav: 'salonas' },
  skydelis: { svoris: 12, privalomas: true, pav: 'prietaisų skydelis' },
  variklis: { svoris: 5, privalomas: false, pav: 'variklio skyrius' },
  ratai: { svoris: 5, privalomas: false, pav: 'ratai iš arti' },
  bagazine: { svoris: 5, privalomas: false, pav: 'bagažinė' },
  dugnas: { svoris: 5, privalomas: false, pav: 'dugnas' },
  servisas: { svoris: 5, privalomas: false, pav: 'serviso knyga / dokumentai' },
  vinLipdukas: { svoris: 5, privalomas: false, pav: 'VIN lipdukas' },
};

// Frazės, kurių vizualinis sluoksnis NETURI teisės pasakyti. Radus - pastebėjimas
// nuleidžiamas į „galimas“ ir perrašomas. Sąrašas apima ir teigiamas, ir neigiamas
// išvadas: „nedaužtas“ yra lygiai toks pat neįrodomas teiginys kaip „daužtas“.
// Lietuviskos raides JS \b riboje neveikia (\b remiasi ASCII), todel visus tekstus
// tikrinam "nuasmenintus": ą→a, ė→e, ų→u ir t.t. Ilgis nesikeicia, todel radus
// atitikmeni galima tiksliai iskirpti ta pacia vieta is originalaus teksto.
const RAIDES = { 'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
                 'Ą': 'A', 'Č': 'C', 'Ę': 'E', 'Ė': 'E', 'Į': 'I', 'Š': 'S', 'Ų': 'U', 'Ū': 'U', 'Ž': 'Z' };
function nuasmeninti(t) { return String(t || '').replace(/[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/g, function (c) { return RAIDES[c]; }); }

const DRAUDZIAMA = [
  { re: /\bne\s?dauztas\b|\bnedauztas\b|\bbuvo dauztas\b|\bdauztas\b|\bdauzta\b/i, kodel: 'avarijos faktas iš nuotraukos nenustatomas' },
  { re: /\bbe avariju\b|\bneavarin\w*/i, kodel: 'avarijų nebuvimas iš nuotraukos nenustatomas' },
  // v2.0.0: praplesta. Regitros ridos punktas yra KLAUSIMAS pardavejui, ne
  // verdiktas, ir tos pacios formuluotes negali atsirasti nei cia, nei ten.
  // `backend/regitra.js` turi SAVA saraso kopija - jo tekstus rasom mes patys,
  // tad tikrinam juos gamybos vietoje, ne cia.
  { re: /\batsukt\w*\b|\bsukt\w*\s+rid\w*\b|\brid\w*\s+sukt\w*\b|\bsuklastot\w*\b/i, kodel: 'ridos klastojimas iš nuotraukos nenustatomas' },
  { re: /\bneatitinka\s+tikrov\w*\b/i, kodel: 'nuotrauka nezino, kas yra tikrove' },
  { re: /\bvariklis\s+(tvarkingas|sveikas|geros bukles)\b/i, kodel: 'variklio būklė iš nuotraukos nenustatoma' },
  { re: /\boriginali?\s+komplektacija\b|\bgamyklin\w*\s+(versija|komplektacija)\b/i, kodel: 'gamyklinė komplektacija patvirtinama tik pagal VIN' },
  { re: /\bpatvirtina\b|\bpatvirtinta\b|\birodo\b|\bgarantuoja\b/i, kodel: 'nuotrauka nieko nepatvirtina' },
  { re: /\bnera\s+jokios\s+zalos\b|\bzalu\s+nera\b|\bbe\s+zalos\b/i, kodel: 'žalos nebuvimas iš nuotraukos neįrodomas' },
  { re: /\bservisuotas\b|\bprizi[uū]retas\b|\bprizuretas\b/i, kodel: 'priežiūros istorija iš nuotraukos nematoma' },
];

// Statinė instrukcija - ji nesikeičia, todėl siunčiama su cache_control.
const EVIDENCE_INSTRUKCIJA = `Tu esi automobilio skelbimo NUOTRAUKU TIKRINTOJAS. Tavo vienintele uzduotis -
APRASYTI, KAS MATOMA nuotraukose. Tu NESI automobilio teisejas: verdikta pagal tavo
pastebejimus vėliau daro kita sistemos dalis.

TRYS PAGRINDINES TAISYKLES:
1. MATOME -> APRASOME. Kiekvienas pastebejimas privalo nurodyti KONKRECIOS nuotraukos
   numeri ir vieta automobilyje. Be numerio pastebejimas negalioja.
2. ITARIAME -> ISPEJAME. Jei kazkas panasu, bet nuotrauka neleidzia isitikinti (kampas,
   sesely, atspindys, maza raiska) - lygis "galimas", ir PARASYK, kodel neaisku.
3. NEZINOME -> NEISGALVOJAME. Ko nuotraukose nesimato, to nera. Trukstamas rakursas nera
   automobilio truksmas - tai tiesiog neivertinta sritis.

NIEKADA NERASYK siu isvadu (ju is nuotraukos nustatyti NEIMANOMA):
- "automobilis buvo dauztas" arba "nedauztas" / "be avariju"
- "rida atsukta"
- "variklis tvarkingas"
- "originali / gamykline komplektacija"
- "patvirtina", "irodo", "garantuoja"
Vietoj to rasyk, kas MATOMA: "matomas skirtingas dazu atspalvis ant galinio kairio sparno".

IRANGA: rasyk tik tai, kas fiziskai matoma ("matomos Harman Kardon garsiakalbio groteles"),
ir NIEKADA nerasyk, kad tai gamykline komplektacija. Zenkliukas ant kebulo rodo tik zenkliuka,
ne versija.

RIDA: salono nusidevejimas gali buti SIGNALAS, bet niekada nera ridos irodymas.

KA KONKRECIAI TIKRINTI kiekvienoje nuotraukoje:
- kebulo ibrezimai, ilenkimai, rudys, itrukes lakas
- skirtingi dazu atspalviai tarp gretimu detaliu
- neiprasti paneliu tarpai (durys, sparnai, kapotas, bagaznes dangtis)
- zibintu / bamperiu neatitikimai (skirtingas atspalvis, rasos, kitokia detale)
- ankstesnio remonto pozymiai (dazu dulkes ant tarpiniu, nelygus pavirsius, kitokia tekstura)
- ratlankiu ibrezimai ir padangu bukle / protektorius / skirtingos padangos
- salono nusidevejimas: vairo apvija, pedalu gumos, sedynes soninis atramas, blizgesys
- variklio skyrius: matomi nuotekiai, nesvarumai, nauja/sena detale salia senu
- prietaisu skydelis: ispejamosios lemputes, rodoma rida, klaidu pranesimai
- aftermarket modifikacijos (ne gamykliniai ratlankiai, ismetimo sistema, tiuningas)
- ar visose nuotraukose TAS PATS automobilis (numeriai, ratlankiai, salonas, aplinka)
- nuotrauku kokybe: tamsios, neryskios, is katalogo (stock), dublikatai, svetimi vandens zenklai

Grazink TIK JSON (be markdown):
{
  "padengimas": {"priekis":true/false,"galas":...,"kaire":...,"desine":...,"salonas":...,
                 "skydelis":...,"variklis":...,"ratai":...,"bagazine":...,"dugnas":...,
                 "servisas":...,"vinLipdukas":...},
  "pastebejimai": [
    {"lygis":"matoma" arba "galimas",
     "nuotrauka": numeris,
     "vieta":"kur automobilyje",
     "kategorija":"kebulas|dazai|tarpai|zibintai|remontas|ratai|salonas|variklis|skydelis|modifikacija|iranga|neatitikimas|kokybe",
     "tekstas":"ka matai - faktas, be isvadu",
     "kodel_neaisku":"tik jei lygis=galimas, kodel negalima isitikinti",
     "klausimas":"konkretus klausimas pardavejui arba null",
     "patikrinti_gyvai":"ka patikrinti apziuros metu arba null"}
  ],
  "iranga_matoma": [{"pavadinimas":"...","nuotrauka":numeris}],
  "rida_skydelyje": skaicius arba null,
  "ispejamosios_lemputes": ["..."] arba [],
  "vin_nuotraukoje": "17 simboliu VIN, jei ISKAITOMAS, kitaip null",
  "vin_vieta": "kur pamatytas arba null",
  "kokybe": {"tamsios": skaicius, "neryskios": skaicius, "dublikatai": skaicius,
             "stock": true/false, "svetimas_vandens_zenklas": true/false,
             "tas_pats_automobilis": true/false},
  "santrauka": "1-2 sakiniai: kas apskritai matyti ir ko truksta"
}`;

// ── Formuluočių sargas ─────────────────────────────────────────────────────
// Post-processing, kuris neleidžia modeliui peržengti standarto net jei jis
// „pamiršo“ instrukciją.
function sutvarkytiPastebejima(p, nuotraukuKiekis) {
  if (!p || !p.tekstas) return null;
  const nr = parseInt(p.nuotrauka, 10);
  const turiNumeri = nr >= 1 && nr <= nuotraukuKiekis;
  let lygis = p.lygis === LYGIAI.MATOMA ? LYGIAI.MATOMA : LYGIAI.GALIMAS;
  let tekstas = String(p.tekstas).trim();
  const pastabos = [];

  // 1. „Matoma“ be nuotraukos numerio negalioja - nuleidžiam į „galimas“.
  if (lygis === LYGIAI.MATOMA && !turiNumeri) {
    lygis = LYGIAI.GALIMAS;
    pastabos.push('nenurodyta konkreti nuotrauka');
  }
  // 2. Uždraustos frazės - nuleidžiam, teiginį iškerpam ir pasakom, kodėl.
  for (let i = 0; i < DRAUDZIAMA.length; i++) {
    const d = DRAUDZIAMA[i];
    let saugiklis = 0;
    let m = d.re.exec(nuasmeninti(tekstas));
    while (m && saugiklis++ < 5) {
      lygis = LYGIAI.GALIMAS;
      if (pastabos.indexOf(d.kodel) === -1) pastabos.push(d.kodel);
      tekstas = (tekstas.slice(0, m.index) + tekstas.slice(m.index + m[0].length));
      m = d.re.exec(nuasmeninti(tekstas));
    }
  }
  if (pastabos.length) {
    tekstas = tekstas.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/^[\s,.;:–-]+/, '').trim();
    if (tekstas.length < 12) tekstas = 'Nuotraukoje matomas požymis, kurio patvirtinti negalima';
    tekstas += ' — neteiktinas teiginys pašalintas (' + pastabos.join('; ') + ').';
  }
  return {
    lygis,
    nuotrauka: turiNumeri ? nr : null,
    vieta: p.vieta ? String(p.vieta).slice(0, 80) : null,
    kategorija: p.kategorija ? String(p.kategorija).slice(0, 24) : 'kita',
    tekstas: tekstas.slice(0, 400),
    kodelNeaisku: p.kodel_neaisku ? String(p.kodel_neaisku).slice(0, 200) : null,
    klausimas: p.klausimas ? String(p.klausimas).slice(0, 200) : null,
    patikrintiGyvai: p.patikrinti_gyvai ? String(p.patikrinti_gyvai).slice(0, 200) : null,
  };
}

// ── Visual Confidence: KIEK automobilio apskritai galima įvertinti ─────────
// Tai NĖRA automobilio gerumas. Tai mūsų galimybių matas.
function skaiciuotiPasitikejima(padengimas, kokybe, nuotraukuKiekis) {
  const p = padengimas || {};
  let taskai = 0, maxPrivalomu = 0, turimuPrivalomu = 0;
  Object.keys(RAKURSAI).forEach((k) => {
    const r = RAKURSAI[k];
    if (r.privalomas) maxPrivalomu++;
    if (p[k]) { taskai += r.svoris; if (r.privalomas) turimuPrivalomu++; }
  });
  let proc = Math.min(100, taskai);
  // Mažas nuotraukų kiekis riboja net ir „gerą“ padengimą
  if (nuotraukuKiekis < 4) proc = Math.min(proc, 45);
  else if (nuotraukuKiekis < 7) proc = Math.min(proc, 75);
  const k = kokybe || {};
  proc -= Math.min(15, (k.tamsios || 0) * 4 + (k.neryskios || 0) * 4 + (k.dublikatai || 0) * 3);
  if (k.stock) proc -= 25;                       // katalogo nuotraukos nieko nesako apie ŠĮ auto
  if (k.tas_pats_automobilis === false) proc -= 20;
  proc = Math.max(0, Math.min(100, Math.round(proc)));
  const truksta = Object.keys(RAKURSAI).filter((x) => RAKURSAI[x].privalomas && !p[x]).map((x) => RAKURSAI[x].pav);
  return { procentai: proc, privalomuMatoma: turimuPrivalomu, privalomuViso: maxPrivalomu, truksta };
}

// ── Visual Condition: būklė TIK iš to, ką pavyko įvertinti ─────────────────
// Trūkstamas rakursas čia nedalyvauja - jis mažina Visual Confidence, o ne būklę.
function skaiciuotiBukle(pastebejimai) {
  const list = pastebejimai || [];
  const matomi = list.filter((x) => x.lygis === LYGIAI.MATOMA && x.kategorija !== 'kokybe' && x.kategorija !== 'iranga');
  const galimi = list.filter((x) => x.lygis === LYGIAI.GALIMAS && x.kategorija !== 'kokybe' && x.kategorija !== 'iranga');
  const SUNKU = /remont|tarp|atspalv|rud|nuot[eė]k|itr[uū]k|įtrūk|deformac|skirting/i;
  let balas = 100;
  matomi.forEach((x) => { balas -= SUNKU.test(x.tekstas + ' ' + (x.kategorija || '')) ? 12 : 6; });
  galimi.forEach((x) => { balas -= SUNKU.test(x.tekstas + ' ' + (x.kategorija || '')) ? 5 : 3; });
  return {
    balas: Math.max(0, Math.min(100, Math.round(balas))),
    matomuDefektu: matomi.length,
    galimuSignalu: galimi.length,
  };
}

// ── Kryžminis įrangos patvirtinimas ───────────────────────────────────────
// Du nepriklausomi šaltiniai (nuotrauka + skelbimo įrangos sąrašas) = „matoma“.
// Vienas šaltinis = „galimas“. Niekada nerašom „gamyklinė“.
function patvirtintiIranga(irangaMatoma, irangosSarasas) {
  const sar = [];
  (irangosSarasas || []).forEach((g) => {
    if (Array.isArray(g)) sar.push.apply(sar, g);
    else if (g && Array.isArray(g.items)) sar.push.apply(sar, g.items);
    else if (typeof g === 'string') sar.push(g);
  });
  const norm = (t) => String(t || '').toLowerCase().replace(/[^a-ząčęėįšųūž0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();
  const sarNorm = sar.map(norm);
  return (irangaMatoma || []).map((x) => {
    const pav = typeof x === 'string' ? x : (x && x.pavadinimas) || '';
    const n = norm(pav);
    // Sutapimas tikrinamas ABIEM kryptimis: nuotraukoje matomas pavadinimas daznai
    // ilgesnis ("Harman Kardon garsiakalbio groteles") nei skelbimo sarase ("Harman Kardon").
    const zodziai = n.split(' ').filter((w) => w.length > 3);
    const sutampa = !!n && sarNorm.some((s) => {
      if (!s) return false;
      if (s.includes(n) || n.includes(s)) return true;
      const sz = s.split(' ').filter((w) => w.length > 3);
      if (sz.length && sz.every((w) => n.includes(w))) return true;
      return zodziai.length > 0 && zodziai.every((w) => s.includes(w));
    });
    return {
      pavadinimas: String(pav).slice(0, 80),
      nuotrauka: (x && x.nuotrauka) || null,
      lygis: sutampa ? LYGIAI.MATOMA : LYGIAI.GALIMAS,
      saltiniai: sutampa ? ['nuotrauka', 'skelbimo įrangos sąrašas'] : ['nuotrauka'],
      pastaba: sutampa
        ? 'Matoma nuotraukoje ir nurodyta skelbimo įrangos sąraše.'
        : 'Matoma tik nuotraukoje. Gamyklinė komplektacija nepatvirtinta.',
    };
  });
}

// ── Prieštaravimai tarp šaltinių ──────────────────────────────────────────
// Įdomiausia ne tai, ką matome, o kur skelbimas ir nuotraukos nesutaria.
function rastiPrieštaravimus(pastebejimai, aprasymas, ridaSkelbime, ridaSkydelyje) {
  const out = [];
  const apr = String(aprasymas || '').toLowerCase();
  const matomiDefektai = (pastebejimai || []).filter((x) => x.lygis === LYGIAI.MATOMA
    && ['kebulas', 'dazai', 'tarpai', 'zibintai', 'remontas', 'ratai'].indexOf(x.kategorija) !== -1);
  if (matomiDefektai.length && /(be defekt|defekt[ųu] n[ėe]ra|idealios b[ūu]kl[ėe]s|kaip naujas|be [įi]br[ėe]žim)/.test(apr)) {
    out.push({
      svarba: 'auksta',
      tekstas: 'Skelbime rašoma, kad defektų nėra, o nuotraukose matomi ' + matomiDefektai.length
        + ' pastebėjim' + (matomiDefektai.length === 1 ? 'as' : 'ai') + ' (nuotr. '
        + matomiDefektai.map((x) => '#' + (x.nuotrauka || '?')).join(', ') + ').',
    });
  }
  if (ridaSkelbime && ridaSkydelyje && Math.abs(ridaSkelbime - ridaSkydelyje) > Math.max(2000, ridaSkelbime * 0.03)) {
    out.push({
      svarba: 'auksta',
      tekstas: 'Skelbime nurodyta ' + ridaSkelbime.toLocaleString('lt-LT') + ' km, o prietaisų skydelio nuotraukoje matoma ~'
        + ridaSkydelyje.toLocaleString('lt-LT') + ' km. Paklauskite pardavėjo, kuri reikšmė teisinga.',
    });
  }
  const nesutampa = (pastebejimai || []).filter((x) => x.kategorija === 'neatitikimas');
  nesutampa.forEach((x) => out.push({ svarba: x.lygis === LYGIAI.MATOMA ? 'auksta' : 'vidutine', tekstas: x.tekstas }));
  return out;
}

// ── Pagrindinė funkcija ───────────────────────────────────────────────────
// anthropic ir modelis perduodami is isores, kad modulį butu galima testuoti be tinklo.
async function analizuoti(opts) {
  const { anthropic, model, nuotraukos, parsisiusta, kontekstas } = opts || {};
  const maxFoto = opts.maxFoto || 10;
  const sarasas = (nuotraukos || []).slice(0, maxFoto);
  const turim = sarasas.map((u, i) => ({ u, i, img: (parsisiusta || {})[u] })).filter((x) => x.img);
  if (turim.length < 2) return null;

  const content = [{ type: 'text', text: EVIDENCE_INSTRUKCIJA, cache_control: { type: 'ephemeral' } }];
  turim.forEach((x, k) => {
    content.push({ type: 'text', text: 'Nuotrauka #' + (k + 1) + ':' });
    content.push({ type: 'image', source: { type: 'base64', media_type: x.img.media_type, data: x.img.data } });
  });
  const kont = kontekstas || {};
  content.push({
    type: 'text',
    text: 'Skelbimo duomenys (naudok TIK palyginimui, ne kaip tai, ką matai): '
      + [kont.modelis, kont.metai ? kont.metai + ' m.' : null, kont.rida ? kont.rida + ' km' : null].filter(Boolean).join(', ')
      + '. Nuotraukų iš viso: ' + turim.length + '.',
  });

  const resp = await anthropic.messages.create({
    model: model, max_tokens: 2000,
    messages: [{ role: 'user', content }],
  });
  const raw = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const m = raw.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j;
  try { j = JSON.parse(m[0]); } catch (e) { return null; }
  return apdoroti(j, turim.map((x) => x.u), kontekstas);
}

// Modelio atsakymą paverčiam mūsų standarto struktūra (naudojama ir testuose).
function apdoroti(j, nuotrauku, kontekstas) {
  const urls = nuotrauku || [];
  const kiek = urls.length;
  const pastebejimai = (Array.isArray(j.pastebejimai) ? j.pastebejimai : [])
    .map((p) => sutvarkytiPastebejima(p, kiek)).filter(Boolean).slice(0, 20);
  pastebejimai.forEach((p) => { p.nuotraukosUrl = p.nuotrauka ? (urls[p.nuotrauka - 1] || null) : null; });

  const pasitikejimas = skaiciuotiPasitikejima(j.padengimas, j.kokybe, kiek);
  const bukle = skaiciuotiBukle(pastebejimai);
  const iranga = patvirtintiIranga(j.iranga_matoma, (kontekstas || {}).irangosSarasas);
  const ridaSkydelyje = j.rida_skydelyje && !isNaN(j.rida_skydelyje) ? parseInt(j.rida_skydelyje, 10) : null;
  const prieštaravimai = rastiPrieštaravimus(pastebejimai, (kontekstas || {}).aprasymas, (kontekstas || {}).rida, ridaSkydelyje);

  return {
    pasitikejimas, bukle, pastebejimai, iranga, prieštaravimai,
    padengimas: j.padengimas || {},
    kokybe: j.kokybe || {},
    ridaSkydelyje,
    ispejamosiosLemputes: Array.isArray(j.ispejamosios_lemputes) ? j.ispejamosios_lemputes.slice(0, 6) : [],
    vinNuotraukoje: typeof j.vin_nuotraukoje === 'string' && /^[A-HJ-NPR-Z0-9]{17}$/.test(j.vin_nuotraukoje.toUpperCase())
      ? j.vin_nuotraukoje.toUpperCase() : null,
    vinVieta: j.vin_vieta || null,
    santrauka: j.santrauka ? String(j.santrauka).slice(0, 300) : null,
    nuotraukuKiekis: kiek,
  };
}

// Tekstas, kurį gauna gilioji analizė VIETOJ nuotraukų. Dėl to Sonnet'ui
// nebereikia siųsti paveikslėlių - didžiausias likęs įeinančių tokenų gabalas.
function tekstasAnalizei(v) {
  if (!v) return '';
  const eil = [];
  eil.push(`[VIZUALINIS PATIKRINIMAS] Peržiūrėta ${v.nuotraukuKiekis} nuotraukų. `
    + `Vizualinis pasitikėjimas ${v.pasitikejimas.procentai}% (matomi ${v.pasitikejimas.privalomuMatoma}/${v.pasitikejimas.privalomuViso} privalomi rakursai`
    + (v.pasitikejimas.truksta.length ? `, trūksta: ${v.pasitikejimas.truksta.join(', ')}` : '') + '). '
    + `Vizualinė būklė ${v.bukle.balas}/100 (${v.bukle.matomuDefektu} aiškiai matomi, ${v.bukle.galimuSignalu} galimi signalai).`);
  if (v.santrauka) eil.push('Santrauka: ' + v.santrauka);
  v.pastebejimai.forEach((p) => {
    eil.push(`- [${p.lygis === 'matoma' ? 'MATOMA' : 'GALIMAS SIGNALAS'}] nuotr. #${p.nuotrauka || '?'}${p.vieta ? ', ' + p.vieta : ''}: ${p.tekstas}`
      + (p.kodelNeaisku ? ` (neaišku: ${p.kodelNeaisku})` : ''));
  });
  if (v.iranga.length) {
    eil.push('Matoma įranga: ' + v.iranga.map((x) => x.pavadinimas + (x.lygis === 'matoma' ? ' (patvirtinta ir skelbimo sąraše)' : ' (tik nuotraukoje)')).join('; '));
  }
  if (v.ridaSkydelyje) eil.push('Prietaisų skydelyje matoma rida: ~' + v.ridaSkydelyje + ' km.');
  if (v.ispejamosiosLemputes.length) eil.push('Įspėjamosios lemputės skydelyje: ' + v.ispejamosiosLemputes.join(', ') + '.');
  v.prieštaravimai.forEach((p) => eil.push('- [PRIEŠTARAVIMAS] ' + p.tekstas));
  eil.push('SVARBU: tai TIK tai, kas matoma nuotraukose. Nedaryk iš to išvadų apie avarijas, ridos tikrumą ar '
    + 'gamyklinę komplektaciją. Trūkstamas rakursas NĖRA automobilio trūkumas – tai neįvertinta sritis, '
    + 'kurią paversk klausimu pardavėjui arba patikrinimo punktu.');
  return eil.join('\n');
}

module.exports = {
  LYGIAI, RAKURSAI, DRAUDZIAMA, EVIDENCE_INSTRUKCIJA,
  analizuoti, apdoroti, tekstasAnalizei,
  sutvarkytiPastebejima, skaiciuotiPasitikejima, skaiciuotiBukle,
  patvirtintiIranga, rastiPrieštaravimus,
};
