// archyvo-eksportas.test.js — paieška į archyvą + nuasmenintas eksportas (v2.27.0).
//
//     node backend/testai/archyvo-eksportas.test.js
//
// Kodėl sargas: šis kelias išeina IŠ mūsų – eksportas keliauja Analitikui.
// Klaida čia nėra „neveikia", ji yra „atidavėm tai, ko neturėjom atiduoti".
// Todėl tikrinam ne tik tai, kas YRA eksporte, bet ir tai, ko jame NĖRA.
const os = require('os');
const path = require('path');
const fs = require('fs');
const rinka = require('../rinka');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

const kat = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-arch-'));
rinka.ikelti(kat, 'testas.db');

const skelbimas = (o) => Object.assign({
  url: 'https://autoplius.lt/skelbimai/x-' + (o.nr || 1) + '.html', source: 'autoplius.lt',
  modelis: 'X5', metai: 2019, menuo: 5, kuras: 'Dyzelinas', pavarai: 'Automatinė', kebulas: 'Visureigis',
  galia: 190, variklioTuris: 3.0, miestas: 'Vilnius', yraVerslas: true, turiVin: true, turiGarantija: false,
  kaina: 30000, rida: 120000, ikeltaLaikas: Date.now() - 86400000,
  photo: 'https://img/1.jpg', photos: ['https://img/1.jpg', 'https://img/2.jpg', 'https://img/3.jpg'],
  rawText: 'Labai geras automobilis, pirmas savininkas, telefonas 860000000',
  kartos: [{ kodas: 'G05', lci: false, grupe: 'G05' }], rinkosGrupe: 'G05',
}, o);

// ── Paieška rašo į archyvą ──────────────────────────────────────────────────
let r = rinka.irasytiPaieskos([skelbimas({ nr: 1 }), skelbimas({ nr: 2, kaina: 28000 })], 'BMW');
T(r.irasyta === 2 && r.nauju === 2, 'paieška įrašė du naujus skelbimus');
T(r.portalu === 1, 'vienas portalas – vienas skenavimo įrašas');

// Antra paieška su pakeista kaina – pokytis patenka į `stebejimai`
r = rinka.irasytiPaieskos([skelbimas({ nr: 1, kaina: 27500 })], 'BMW');
T(r.nauju === 0 && r.pasikeite === 1, 'pasikeitusi kaina užfiksuota, naujo įrašo nekuria');

// Mišrūs portalai (K-72: `source` yra domenas)
r = rinka.irasytiPaieskos([
  skelbimas({ nr: 3, source: 'mobile.de', url: 'https://suchen.mobile.de/auto-inserat/3' }),
  skelbimas({ nr: 4, source: 'otomoto.pl', url: 'https://otomoto.pl/oferta/4' }),
], 'BMW');
T(r.portalu === 2 && r.irasyta === 2, 'domenai paversti portalais (mobile.de, otomoto.pl)');
r = rinka.irasytiPaieskos([skelbimas({ nr: 5, source: 'nezinomas.xyz', url: 'https://nezinomas.xyz/5' })], 'BMW');
T(r.irasyta === 0, 'nežinomo portalo neįrašom – archyve portalas yra rinka');

const sv = rinka.suvestine();
T(sv.skelbimu === 4, 'archyve keturi skelbimai');
T(sv.skenavimai.every((s) => s.pilnas === 0), 'paieškos skenavimai NĖRA pilni – dingimo nežymim');
T(sv.skenavimai.every((s) => s.priezastis === 'vartotojo paieska'), 'skenavimo priežastis užrašyta');

// ── Eksportas: ko jame NĖRA ─────────────────────────────────────────────────
const csv = rinka.eksportas({});
const eil = csv.trim().split('\n');
const antr = eil[0].split(',');
T(eil.length === 5, 'eksporte antraštė + keturios eilutės');
T(!/autoplius\.lt\/skelbimai|suchen\.mobile\.de|otomoto\.pl\/oferta/.test(csv), 'URL eksporte NĖRA');
T(!/https?:\/\//.test(csv), 'jokių nuorodų – nė nuotraukų adresų');
T(!/860000000|pirmas savininkas/.test(csv), 'skelbimo teksto eksporte NĖRA (tik jo ilgis)');
T(!/autoplius:/.test(csv), 'portalo skelbimo ID eksporte NĖRA');
T(antr.indexOf('url') === -1 && antr.indexOf('photo') === -1 && antr.indexOf('kita') === -1,
  'stulpelių url / photo / kita nėra');
T(antr.indexOf('pardavejo_tipas') !== -1 && csv.includes('imone'),
  'pardavėjas yra tik TIPAS („imone“ / „privatus“)');

// ── Eksportas: kas jame YRA ─────────────────────────────────────────────────
['id_maisa', 'portalas', 'marke', 'modelis', 'kartos_kodas', 'kartos_faze', 'metai', 'menuo',
 'kuras', 'deze', 'galia', 'rida', 'kaina', 'nuotrauku_sk', 'teksto_ilgis',
 'pirmas_matymas', 'paskutinis_matymas', 'dingo_data', 'dienu_rinkoje', 'stebejimu',
 'pirma_kaina', 'paskut_kaina'].forEach((k) => {
  T(antr.indexOf(k) !== -1, 'stulpelis `' + k + '`');
});
const pirma = eil[1].split(',');
const v = (k) => pirma[antr.indexOf(k)];
T(/^[0-9a-f]{16}$/.test(v('id_maisa')), 'skelbimo tapatybė – 16 simbolių maiša');
T(v('kartos_kodas') === 'G05' && v('kartos_faze') === 'pradine', 'kartos laukai ištraukti iš `kita`');
T(v('nuotrauku_sk') === '3', 'nuotraukų skaičius (ne nuotraukos)');
T(+v('teksto_ilgis') > 20, 'teksto ilgis (ne tekstas)');
T(v('pirma_kaina') === '30000' && v('paskut_kaina') === '27500', 'kainos trajektorijos galai');
T(v('stebejimu') === '2', 'du stebėjimai – pirmas matymas ir pokytis');
T(/^\d{4}-\d{2}-\d{2}$/.test(v('pirmas_matymas')), 'datos ISO formatu, be laiko');
T(v('dingo_data') === '', 'gyvas skelbimas – dingimo datos nėra');

// Maiša stabili ir sujungiama su `stebejimai`
const st = rinka.eksportas({ ka: 'stebejimai' });
const stAntr = st.trim().split('\n')[0].split(',');
T(stAntr.join(',') === 'id_maisa,data,kaina,rida', 'stebėjimų eksporto stulpeliai');
T(st.includes(v('id_maisa')), 'ta pati maiša abiejose lentelėse – lenteles galima sujungti');
T(!/https?:\/\//.test(st), 'stebėjimuose irgi jokių nuorodų');
T(rinka.eksportas({}).split('\n')[1] === eil[1], 'maiša stabili tarp dviejų eksportų');

// Kableliai lauke nesulaužo CSV
rinka.irasytiPaieskos([skelbimas({ nr: 9, miestas: 'Vilnius, Fabijoniškės' })], 'BMW');
const csv2 = rinka.eksportas({});
T(/"Vilnius, Fabijoni/.test(csv2), 'kablelis lauke – reikšmė kabutėse');
T(csv2.trim().split('\n').every((x) => (x.match(/,/g) || []).length >= antr.length - 1),
  'nė viena eilutė neprarado stulpelių');

// ── Naujos eksporto skiltys (Analitiko prašymas): raktas ir kartos ribos ────
const csv3 = rinka.eksportas({
  raktas: (marke, modelis) => (marke && modelis ? marke.toUpperCase() + ' ' + modelis.toUpperCase() : null),
  kartos: (marke, modelis, metai) => (metai === 2019 ? { kodas: 'G05', nuo: 2018, iki: null, atn: 2023 } : null),
});
const a3 = csv3.trim().split('\n')[0].split(',');
const r3 = csv3.trim().split('\n')[1].split(',');
const v3 = (k) => r3[a3.indexOf(k)];
['raktas', 'kartos_nuo', 'kartos_iki', 'atn_metai'].forEach((k) => T(a3.indexOf(k) !== -1, 'stulpelis `' + k + '`'));
T(v3('raktas') === 'BMW X5', '`raktas` ateina iš išorės (regitra.baziniModelis)');
T(v3('kartos_nuo') === '2018' && v3('atn_metai') === '2023', 'kartos ribos ir facelift metai');
T(v3('kartos_iki') === '', 'neuždaryta karta – tuščias langelis, ne „null“');
T(rinka.eksportas({}).trim().split('\n')[0].split(',').length === a3.length,
  'be išorinių funkcijų stulpelių skaičius tas pats – tik tušti langeliai');

// ── Modelio skenavimas: dingimas neperžengia savo aprėpties (v2.27.1) ───────
const kitas = (nr, modelis) => skelbimas({ nr: 100 + nr, modelis,
  url: 'https://autoplius.lt/skelbimai/m-' + modelis + '-' + nr + '.html' });
rinka.irasytiPaieskos([kitas(1, 'X5'), kitas(2, 'X3')], 'BMW');
const gyvas = () => {
  const d = rinka._db();
  const q = (m) => d.prepare('SELECT dingo FROM skelbimai WHERE modelis=? AND url LIKE ?').all(m, '%/m-%');
  return { X5: q('X5').map((x) => x.dingo), X3: q('X3').map((x) => x.dingo) };
};
// Trumpa pauzė: aprėptis remiasi `paskut_matytas < skenavimo pradžia`, o testas
// rašo ir skenuoja per tą pačią milisekundę (tikrame gyvenime tarp jų – sekundės).
const pauze = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
pauze(5);
// Du PILNI X5 skenavimai, kuriuose X5 skelbimo nebėra
for (let i = 0; i < 2; i++) {
  const id = rinka.pradeti({ portalas: 'autoplius', marke: 'BMW', modelis: 'X5', metaiNuo: null, url: 'x' });
  rinka.baigti(id, { pilnas: true, priezastis: 'testas', busena: 'baigta' });
}
let g = gyvas();
T(g.X5.every((x) => x != null), 'X5 skelbimas pažymėtas dingusiu po dviejų pilnų X5 skenavimų');
T(g.X3.every((x) => x == null), 'X3 skelbimo tas skenavimas NEPALIETĖ – aprėptis yra modelis');

// Markės skenavimas (be modelio) mato visus – X3 dingsta tik po jo
pauze(5);
for (let i = 0; i < 2; i++) {
  const id = rinka.pradeti({ portalas: 'autoplius', marke: 'BMW', metaiNuo: null, url: 'x' });
  rinka.baigti(id, { pilnas: true, priezastis: 'testas', busena: 'baigta' });
}
g = gyvas();
T(g.X3.every((x) => x != null), 'markės skenavimas pažymi ir X3 – jo aprėptis platesnė');

// ── Metų rėžis: aprėptis neperžengia ir iš viršaus (v2.27.5) ───────────────
// Analitiko b variantas: didelį modelį skaidom į du skenavimus pagal metus.
// Be `metai_iki` aprėptyje 2010–2016 skenavimas paskelbtų dingusiais 2017+.
const su2017 = skelbimas({ nr: 300, metai: 2021, modelis: 'Golf',
  url: 'https://autoplius.lt/skelbimai/y-golf-2021.html' });
const su2013 = skelbimas({ nr: 301, metai: 2013, modelis: 'Golf',
  url: 'https://autoplius.lt/skelbimai/y-golf-2013.html' });
rinka.irasytiPaieskos([su2017, su2013], 'Volkswagen');
const golf = (metai) => rinka._db().prepare('SELECT dingo FROM skelbimai WHERE modelis=? AND metai=?').get('Golf', metai);
pauze(5);
for (let i = 0; i < 2; i++) {
  const id = rinka.pradeti({ portalas: 'autoplius', marke: 'Volkswagen', modelis: 'Golf',
    metaiNuo: 2010, metaiIki: 2016, url: 'x' });
  rinka.baigti(id, { pilnas: true, priezastis: 'testas', busena: 'baigta' });
}
T(golf(2013).dingo != null, '2010–2016 skenavimas pažymėjo 2013 m. skelbimą');
T(golf(2021).dingo == null, '…ir NEPALIETĖ 2021 m. skelbimo – aprėptis uždaryta ir iš viršaus');

// ── Skenavimų eksportas (v2.27.3, Analitiko §E) ────────────────────────────
const sk = rinka.eksportas({ ka: 'skenavimai' });
const skA = sk.trim().split('\n')[0].split(',');
T(skA.indexOf('kreditu') !== -1, 'skenavimų eksporte yra `kreditu` – pagal jį tikrinama kainos formulė');
['id', 'portalas', 'marke', 'modelis', 'skelbimu', 'puslapiu', 'pilnas', 'trukme_s'].forEach((k) => {
  T(skA.indexOf(k) !== -1, 'skenavimų stulpelis `' + k + '`');
});
T(skA.indexOf('url') === -1, 'skenavimo `url` neatiduodam – jame filtrai ir portalo vidinė struktūra');
T(sk.trim().split('\n').length > 1, 'bent vienas skenavimo įrašas');

// ── Serverio pusė: eilė nieko neapeina ─────────────────────────────────────
const srv = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
T(/async function pradetiSkenavima/.test(srv), 'vieno skenavimo paleidimas – viena funkcija');
T(/const r = await pradetiSkenavima\(/.test(srv), 'rankinis maršrutas naudoja ją');
T(/const r = await pradetiSkenavima\(d\)/.test(srv), 'eilė naudoja TĄ PAČIĄ funkciją – sargai neapeinami');
T(/Kreditu sargas: po skenavimo liktu maziau nei atsarga/.test(srv), 'kreditų sargas gyvena joje');
T(/_skenEile\.laukia\.unshift\(d\)/.test(srv), 'sargui sustabdžius, neįvykdytas darbas lieka eilėje');
T(/_skenEile\.stabdyti/.test(srv) && /eile\/stop/.test(srv), 'eilę galima sustabdyti');
T(/if \(_skenEile\.vykdoma \|\| _skenEile\.laukia\.length\)/.test(srv), 'dvi eilės vienu metu neprasideda');
T(/blogiausiuAtvejuKr/.test(srv), 'sąmata grąžinama IŠ KARTO, prieš pradedant');
// v2.27.6: darbų kiekis skaičiuojamas PRIEŠ paleidžiant vykdytoją
T(/const kiek = darbai\.length;\n    _eilesVykdytojas\(\);/.test(srv),
  'darbų kiekis paimamas prieš `_eilesVykdytojas()` – jis iškart nusiima pirmą darbą');
T(/res\.status\(202\)\.json\(\{ darbu: kiek,/.test(srv), '…ir atsakyme rodomas tas skaičius, ne gyvas masyvo ilgis');
// v2.27.4: portalas be modelio filtro – praleidžiam, neapeinam per tekstą
T(/portalas === 'autoplius' && !autopliusIds\.urlDalis\(marke, modelis\)/.test(srv),
  'autoplius be modelio ID – skenavimas nepradedamas');
T(/praleista: true/.test(srv), '…grąžinama kaip PRALEIDIMAS, ne klaida');
T(/if \(r\.praleista\)[\s\S]{0,260}continue;/.test(srv), 'praleidimas eilės nestabdo – kiti modeliai nesusiję');
T(/_skenEile\.praleisti\.push/.test(srv), 'praleisti įrašomi – Analitikas turi žinoti, ko nėra pjūvyje');
T(/parseInt\(b\.maxPuslapiu, 10\) \|\| 150/.test(srv),
  'eilės numatytoji puslapių riba 150 – pjūviui svarbu pasiekti sąrašo galą');
// v2.27.5: kiekvienas eilės elementas gali turėti savo metų rėžį ir ribą
T(/metaiNuo: m\.metaiNuo \|\| metaiNuo, metaiIki: m\.metaiIki \|\| null/.test(srv),
  'eilės elementas gali turėti savo metų rėžį');
T(/maxPuslapiu: Math\.min\(m\.maxPuslapiu \|\| maxPuslapiu, 400\)/.test(srv),
  '…ir savo puslapių ribą, neperžengiant 400');
T(/rikiavimas: 'naujausi'/.test(srv), 'skenavimo rikiavimas – naujausi (pagal skelbimo datą, ne kainą)');
T(skA.indexOf('metai_iki') !== -1, 'skenavimų eksporte matosi metų rėžio viršus');

try { fs.rmSync(kat, { recursive: true, force: true }); } catch (e) { /* aplinka gali neleisti trinti */ }

console.log('\n' + (klaidu ? klaidu + ' KRENTA' : 'visi ' + n + ' prajo'));
process.exit(klaidu ? 1 : 0);
