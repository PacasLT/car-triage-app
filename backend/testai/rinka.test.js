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

fs.rmSync(kat, { recursive: true, force: true });
console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + patikru : '✓ ' + patikru + '/' + patikru + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
