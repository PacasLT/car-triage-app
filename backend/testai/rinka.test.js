// rinka.test.js — skelbimų archyvo sargas.
//
//     node backend/testai/rinka.test.js
//
// Reikia: npm i better-sqlite3. Tinklo nekviečia, kreditų nekainuoja:
// dirba laikiname kataloge su sugalvotais skelbimais.
//
// KAM ŠIS SARGAS: archyvo vertė - laiko eilutė. Dvi klaidos jos negrąžinamai
// sugadina ir abi tylios: (1) tas pats skelbimas įrašomas kaip naujas (tada
// „kiek dienų kabo" visada 0), (2) skelbimas pažymimas dingusiu, nors tik
// praslydo tarp puslapių (tada „parduota per 3 d." yra melas).

const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require(path.join(__dirname, '..', 'rinka.js'));

let klaidu = 0, patikru = 0;
const T = (salyga, s) => { patikru++; if (salyga) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };
const lygu = (g, l, s) => T(JSON.stringify(g) === JSON.stringify(l), s + '  [gauta ' + JSON.stringify(g) + ', laukta ' + JSON.stringify(l) + ']');

const kat = fs.mkdtempSync(path.join(os.tmpdir(), 'rinka-'));
const se = console.log; console.log = () => {};
R.ikelti(kat);
console.log = se;
const db = R._db();

const auto = (nr, o) => Object.assign({
  url: 'https://autoplius.lt/skelbimai/bmw-x5-3-0-l-visureigis-2022-dyzelinas-' + nr + '.html',
  modelis: 'BMW X5', metai: 2022, kaina: 50000, rida: 60000, kuras: 'Dyzelinas',
  turiLizingoOpcija: true, rawText: 'bla', photos: ['a', 'b'], lizingoSuma: 900,
}, o || {});
const skenuoti = (sarasai, pilnas) => {
  const id = R.pradeti({ portalas: 'autoplius', marke: 'BMW', metaiNuo: 2019 });
  sarasai.forEach((s) => R.irasytiPuslapi(id, 'autoplius', 'BMW', s));
  return R.baigti(id, { pilnas, priezastis: pilnas ? 'galas' : 'riba' });
};
const eil = (nr) => db.prepare('SELECT * FROM skelbimai WHERE id=?').get('autoplius:' + nr);
const steb = (nr) => db.prepare('SELECT COUNT(*) c FROM stebejimai WHERE skelbimo_id=?').get('autoplius:' + nr).c;

console.log('\n── 1. Tapatybė ─────────────────────────────────────────────');
lygu(R.skelbimoId('autoplius', 'https://autoplius.lt/skelbimai/bmw-x5-28797115.html'), 'autoplius:28797115', 'autoplius numeris');
lygu(R.skelbimoId('autogidas', 'https://autogidas.lt/skelbimas/bmw-x5-2014-m-visureigis--krosoveris-0137877215.html'), 'autogidas:137877215', 'autogidas: priekiniai nuliai nuimami');
lygu(R.skelbimoId('autoplius', 'https://autoplius.lt/skelbimai/kitas-pavadinimas-28797115.html?x=1'), 'autoplius:28797115', 'pervadintas adresas -> tas pats skelbimas');

console.log('\n── 2. Pirmas skenavimas ────────────────────────────────────');
let s = skenuoti([[auto(1000001), auto(1000002)], [auto(1000003)]], true);
lygu([s.puslapiu, s.skelbimu, s.nauju, s.pasikeite, s.dingo], [2, 3, 3, 0, 0], 'puslapiu/skelbimu/nauju/pasikeite/dingo');
T(eil(1000001) && eil(1000001).kaina === 50000 && eil(1000001).marke === 'BMW', 'įrašas su kaina ir marke');
lygu(steb(1000001), 1, 'pirmas stebėjimas įrašytas');
const kita = JSON.parse(eil(1000001).kita || '{}');
T(!('turiLizingoOpcija' in kita) && !('rawText' in kita) && !('photos' in kita), 'turiLizingoOpcija, rawText, photos NEsaugomi');
T(kita.lizingoSuma === 900, 'kiti analizatoriaus laukai išsaugomi (lizingoSuma)');

console.log('\n── 3. Antras skenavimas: tas pats, kaina pakito, vieno nėra ─');
s = skenuoti([[auto(1000001), auto(1000002, { kaina: 48000 })]], true);
lygu([s.nauju, s.pasikeite, s.dingo], [0, 1, 0], 'nauju 0 · pasikeite 1 · dingo 0 (vieno praleidimo neužtenka)');
lygu(db.prepare('SELECT COUNT(*) c FROM skelbimai').get().c, 3, 'eilučių vis dar 3 - nedubliuota');
lygu(eil(1000001).kartu_matytas, 2, 'kartu_matytas 2');
lygu(steb(1000001), 1, 'nepasikeitęs - naujo stebėjimo NĖRA');
lygu(steb(1000002), 2, 'kaina pakito - antras stebėjimas');
lygu([eil(1000003).praleista, eil(1000003).dingo], [1, null], 'nematytas: praleista 1, dar ne dingo');

console.log('\n── 4. Nepilnas skenavimas dingimo nežymi ───────────────────');
s = skenuoti([[auto(1000001)]], false);
lygu([s.busena, s.pilnas, s.dingo], ['nutraukta', 0, 0], 'nutraukta, ne pilnas, dingo 0');
lygu(eil(1000003).praleista, 1, 'praleista nepakilo');

console.log('\n── 5. Antras pilnas be jo -> dingo ─────────────────────────');
s = skenuoti([[auto(1000001), auto(1000002, { kaina: 48000 })]], true);
lygu(s.dingo, 1, 'dingo 1');
T(eil(1000003).dingo > 0, 'skelbimas 1000003 pažymėtas dingusiu');

console.log('\n── 6. Vėl atsirado -> gyvas ────────────────────────────────');
s = skenuoti([[auto(1000001), auto(1000002, { kaina: 48000 }), auto(1000003)]], true);
lygu([eil(1000003).dingo, eil(1000003).praleista], [null, 0], 'dingo nuimtas, praleista 0');

console.log('\n── 7. Aprėptis: senesni už metaiNuo nežymimi ───────────────');
{
  const id = R.pradeti({ portalas: 'autoplius', marke: 'BMW', metaiNuo: 2010 });
  R.irasytiPuslapi(id, 'autoplius', 'BMW', [auto(1000009, { metai: 2012 })]);
  R.baigti(id, { pilnas: true });
}
skenuoti([[auto(1000001), auto(1000002), auto(1000003)]], true);
skenuoti([[auto(1000001), auto(1000002), auto(1000003)]], true);
lygu([eil(1000009).praleista, eil(1000009).dingo], [0, null], '2012 m. skelbimas nuo-2019 skenavimuose neliestas');

console.log('\n── 8. Suvestinė ────────────────────────────────────────────');
const sv = R.suvestine();
T(sv.ikelta && sv.skelbimu === 4 && sv.stebejimu >= 5, 'skelbimu 4, stebejimu ' + sv.stebejimu);
T(sv.skenavimai.length > 0 && sv.nesaugoma.turiLizingoOpcija, 'skenavimu sarasas ir NESAUGOMA priežastys');

console.log('\n── 9. Perkrovimas vidury skenavimo ─────────────────────────');
R.pradeti({ portalas: 'autogidas', marke: 'BMW', metaiNuo: 2019 });
T(!!R.vykstantis(), 'yra vykstantis');
console.log = () => {};
R.ikelti(kat);
console.log = se;
T(!R.vykstantis(), 'po perkrovimo „vyksta" nelieka (pažymėta nutraukta)');

console.log('\n── 10. Senų įrašų taisymas (v2.4.2) ────────────────────────');
{
  const ins = db.prepare(`INSERT INTO skelbimai (id, portalas, url, marke, modelis, metai, kuras, kaina, rida, variklio_turis, pirma_matytas, paskut_matytas)
                          VALUES (?, ?, ?, 'BMW', ?, 2021, ?, ?, ?, ?, 1, 1)`);
  ins.run('autoplius:900001', 'autoplius', 'https://autoplius.lt/skelbimai/bmw-x5-900001.html', 'BMW X5', 'Benzinas / elektra', 43900, 86, 3);
  ins.run('autoplius:900002', 'autoplius', 'https://autoplius.lt/skelbimai/bmw-i4-900002.html', 'BMW i4', 'Elektra, 84 kWh', 89900, 679, 0);
  ins.run('autoplius:900003', 'autoplius', 'https://autoplius.lt/skelbimai/bmw-x5-900003.html', 'BMW X5', 'Dyzelinas / elektra', 92000117843, 10, 3);
  ins.run('autogidas:900004', 'autogidas', 'https://autogidas.lt/skelbimas/bmw-x3-2020-m-visureigis-0900004.html', 'BMW Kelio ženklų atpažinimo sistem', 'Benzinas/Elektra', 32000, 84237, 2);
  ins.run('autoplius:900005', 'autoplius', 'https://autoplius.lt/skelbimai/bmw-x5-900005.html', 'BMW X5', 'Dyzelinas', 60000, 10, 3);
  const r1 = R.taisytiSenusIrasus();
  const e = (id) => db.prepare('SELECT * FROM skelbimai WHERE id=?').get(id);
  T(e('autoplius:900001').rida === null, 'PHEV su „rida" 86 → NULL (nežinoma, ne klaidinga)');
  T(e('autoplius:900002').variklio_turis === null && e('autoplius:900002').kuras === 'Elektra', 'EV: tūris 0 → NULL, „Elektra, 84 kWh" → „Elektra"');
  T(e('autoplius:900003').kaina === null && e('autoplius:900003').rida === null, '92 mlrd. kaina → NULL; naujo PHEV 10 km → NULL');
  T(e('autogidas:900004').modelis === 'BMW X3' && e('autogidas:900004').kuras === 'Benzinas / elektra', 'autogidas: modelis iš adreso, kuras suvienodintas');
  T(e('autoplius:900005').rida === 10, 'NE hibridas su 10 km (naujas automobilis) — nepaliestas');
  const r2 = R.taisytiSenusIrasus();
  T(Object.values(r2).every((v) => v === 0), 'antras paleidimas nieko nekeičia (idempotentiška)');
  lygu(R.kuroNorm('Benzinas/Elektra'), 'Benzinas / elektra', 'kuroNorm autogido forma');
  lygu(R.kuroNorm('Elektra, 84 kWh'), 'Elektra', 'kuroNorm baterija nuimama');
}

fs.rmSync(kat, { recursive: true, force: true });
console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + patikru : '✓ ' + patikru + '/' + patikru + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
