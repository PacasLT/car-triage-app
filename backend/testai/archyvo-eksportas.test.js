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

try { fs.rmSync(kat, { recursive: true, force: true }); } catch (e) { /* aplinka gali neleisti trinti */ }

console.log('\n' + (klaidu ? klaidu + ' KRENTA' : 'visi ' + n + ' prajo'));
process.exit(klaidu ? 1 : 0);
