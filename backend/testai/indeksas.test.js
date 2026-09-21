// indeksas.test.js — `rastiTaPatiAuto` antrinis indeksas (revizija 3 p., v2.5.4).
//
//     node backend/testai/indeksas.test.js
//
// Tinklo nekviečia, dirba laikiname kataloge.
//
// Sargas lygina INDEKSO atsakymą su PILNU perėjimu (senu būdu) per visus
// įrašus - po įkėlimo, po naujų įrašų, po rakto pasikeitimo (VIN) ir po
// senų įrašų valymo. Jei kas nors kada nors pakeis `raktas` kitoje vietoje ir
// pamirš indeksą - šitas testas tai pagaus.

const fs = require('fs'), os = require('os'), path = require('path');
const kat = fs.mkdtempSync(path.join(os.tmpdir(), 'indeksas-'));
process.env.DATA_DIR = kat;

// Pradinis failas: 2 tas pats auto (fp), 1 kitas, 1 senas dingęs (valymas turi ištrinti).
const DIENA = 86400000, dabar = Date.now();
const fp = 'fp:bmw x5|2020|Dyzelinas|Automatinė|195|3';
fs.writeFileSync(path.join(kat, 'listing-lifecycle.json'), JSON.stringify({
  'https://a.lt/1': { pirmaMatytas: dabar - 10 * DIENA, paskutinMatytas: dabar, modelis: 'BMW X5', raktas: fp },
  'https://a.lt/2': { pirmaMatytas: dabar - 5 * DIENA, paskutinMatytas: dabar, modelis: 'BMW X5', raktas: fp },
  'https://a.lt/3': { pirmaMatytas: dabar - 5 * DIENA, paskutinMatytas: dabar, modelis: 'BMW X3', raktas: 'fp:bmw x3|2020|?|?|?|?' },
  'https://a.lt/senas': { pirmaMatytas: dabar - 400 * DIENA, paskutinMatytas: dabar - 300 * DIENA, dingo: dabar - 300 * DIENA, modelis: 'BMW X5', raktas: fp },
}));

const se = console.log; console.log = () => {};
const C = require(path.join(__dirname, '..', 'cache.js'));
console.log = se;

let ok = 0, bl = 0;
const t = (pav, c, info) => (c ? (ok++, console.log('  ✓ ' + pav)) : (bl++, console.log('  ✗ ' + pav + ' → ' + JSON.stringify(info))));
const urls = (r) => r.map((x) => x.url).sort();
// Senas būdas - pilnas perėjimas per viešą gyvavimo ciklo sąrašą.
const pilnas = (url) => {
  const visi = JSON.parse(fs.readFileSync(path.join(kat, 'listing-lifecycle.json'), 'utf-8'));
  return visi;
};

console.log('\n1. Po įkėlimo ir pirmo valymo ────────────────────────────');
t('1 randa 2 (ne save)', JSON.stringify(urls(C.rastiTaPatiAuto('https://a.lt/1'))) === JSON.stringify(['https://a.lt/2']), C.rastiTaPatiAuto('https://a.lt/1'));
t('senas dingęs ištrintas valymo IR iš indekso', !urls(C.rastiTaPatiAuto('https://a.lt/1')).includes('https://a.lt/senas'), urls(C.rastiTaPatiAuto('https://a.lt/1')));
t('X3 atskiras - nieko', C.rastiTaPatiAuto('https://a.lt/3').length === 0);
t('nežinomas url - tuščias', C.rastiTaPatiAuto('https://nera.lt/x').length === 0);

console.log('\n2. Nauji įrašai per zymetiMatyta ──────────────────────────');
const x5 = { modelis: 'bmw x5', metai: 2020, kuras: 'Dyzelinas', pavarai: 'Automatinė', galia: 195, variklioTuris: 3 };
C.zymetiMatyta(Object.assign({ url: 'https://b.lt/4', kaina: 40000 }, x5));
t('naujas tas pats auto matomas iš seno', urls(C.rastiTaPatiAuto('https://a.lt/1')).includes('https://b.lt/4'), urls(C.rastiTaPatiAuto('https://a.lt/1')));
t('ir atvirkščiai', JSON.stringify(urls(C.rastiTaPatiAuto('https://b.lt/4'))) === JSON.stringify(['https://a.lt/1', 'https://a.lt/2']), urls(C.rastiTaPatiAuto('https://b.lt/4')));

console.log('\n3. Raktas pasikeičia (atsirado VIN) ──────────────────────');
C.zymetiMatyta(Object.assign({ url: 'https://b.lt/4' }, x5), { vin: 'WBA11111111111111' });
t('b.lt/4 išėjo iš fp grupės', !urls(C.rastiTaPatiAuto('https://a.lt/1')).includes('https://b.lt/4'), urls(C.rastiTaPatiAuto('https://a.lt/1')));
C.zymetiMatyta(Object.assign({ url: 'https://c.lt/5' }, x5), { vin: 'WBA11111111111111' });
t('tas pats VIN kitame skelbime randamas', JSON.stringify(urls(C.rastiTaPatiAuto('https://c.lt/5'))) === JSON.stringify(['https://b.lt/4']), urls(C.rastiTaPatiAuto('https://c.lt/5')));
t('VIN sutapimas pažymėtas patikimu', C.rastiTaPatiAuto('https://c.lt/5')[0].patikimas === true);

console.log('\n4. Indeksas = pilnas perėjimas visiems įrašams ───────────');
{
  C.saveLifecycle();
  const visi = pilnas();
  let nesutampa = 0;
  for (const u of Object.keys(visi)) {
    const e = visi[u];
    const senas = !e || !e.raktas ? [] : Object.keys(visi).filter((v) => v !== u && visi[v] && visi[v].raktas === e.raktas).sort();
    const naujas = urls(C.rastiTaPatiAuto(u));
    if (JSON.stringify(senas) !== JSON.stringify(naujas)) nesutampa++;
  }
  t('visiems ' + Object.keys(visi).length + ' įrašams indeksas duoda tą patį kaip pilnas perėjimas', nesutampa === 0, nesutampa);
}

fs.rmSync(kat, { recursive: true, force: true });
console.log('\n' + (bl ? '✗ ' + bl + ' klaidos iš ' + (ok + bl) : '✓ ' + ok + '/' + ok + ' patikrų praėjo'));
process.exit(bl ? 1 : 0);
