// kuras.test.js — daugiareikšmis kuro filtras (v2.23.0).
//
//     node backend/testai/kuras.test.js
//
// Kodėl sargas: kuro filtras vienu metu gyvena ŠEŠIOSE vietose – `kurasAtitinka`
// serveryje ir penkių portalų URL. Jei kuri nors jų liks vienareikšmė,
// vartotojas pažymės du kurus, o portalas grąžins tik vieną – ir to nesimatys
// niekur, išskyrus trūkstamus skelbimus.
const { kuroSarasas, kuroKodai } = require('../kuras');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── kuroSarasas ──────────────────────────────────────────────────────────────
T(kuroSarasas('').length === 0, 'tuscias -> []');
T(kuroSarasas(null).length === 0, 'null -> []');
T(kuroSarasas('benzinas').join('|') === 'benzinas', 'vienas');
T(kuroSarasas('benzinas,benzinas_elektra').join('|') === 'benzinas|benzinas_elektra', 'du');
T(kuroSarasas(' benzinas , elektra ').join('|') === 'benzinas|elektra', 'tarpai nuvalomi');
T(kuroSarasas('benzinas,,elektra').join('|') === 'benzinas|elektra', 'tusti praleidziami');
T(kuroSarasas(['benzinas', 'elektra']).join('|') === 'benzinas|elektra', 'masyvas irgi tinka');

// ── kuroKodai: be pasikartojimu ──────────────────────────────────────────────
const AP = { benzinas: [30], benzinas_elektra: [36], dyzelinas: [32], dyzelinas_elektra: [17378], hibridas: [36, 17378] };
T(kuroKodai('benzinas', AP).join(',') === '30', 'autoplius vienas kuras');
T(kuroKodai('benzinas,benzinas_elektra', AP).join(',') === '30,36', 'autoplius du kurai');
T(kuroKodai('benzinas_elektra,hibridas', AP).join(',') === '36,17378', 'be pasikartojimu (36 tik karta)');
T(kuroKodai('', AP).length === 0, 'tuscias -> jokiu kodu (portalas nefiltruoja)');
T(kuroKodai('nera_tokio', AP).length === 0, 'nezinomas raktas praleidziamas');

// ── as24 kableliu kodai ──────────────────────────────────────────────────────
const AS = { benzinas: 'B', benzinas_elektra: '2', benzinas_dujos: 'L,C', dyzelinas: 'D' };
const as24 = [...new Set(kuroKodai('benzinas,benzinas_dujos', AS).flatMap((v) => String(v).split(',')))];
T(as24.join(',') === 'B,L,C', 'as24 sujungia i viena `fuel=B,L,C`');

// ── autogidas poros [i, tekstas] ─────────────────────────────────────────────
const AG = { benzinas: [[2, 'Benzinas']], benzinas_elektra: [[4, 'Benzinas/Elektra'], [5, 'Benzinas/Elektra (Plug-in)']] };
const ag = kuroKodai('benzinas,benzinas_elektra', AG);
T(ag.length === 3 && ag[0][1] === 'Benzinas' && ag[2][0] === 5, 'autogidas poros sudedamos (3 poros)');

// ── kurasAtitinka: serverio pusė ─────────────────────────────────────────────
// Atkartojam serverio logika is server.js (ta pati taisykle, atskiras sargas).
const KURO_SENI = { dyzelis: ['dyzelinas', 'dyzelinas_elektra'], hibridas: ['benzinas_elektra', 'dyzelinas_elektra'] };
function kuroKategorija(kuras) {
  const k = String(kuras || '').toLowerCase();
  if (!k) return null;
  const el = /elektr|electric|hibrid|hybrid|hybryd/.test(k);
  const dyz = /dyzel|diesel/.test(k);
  const benz = /benzin|benzyn|petrol|gasoline/.test(k);
  const duj = /duj|lpg|cng|gaz|autogas|erdgas/.test(k);
  if (el && dyz) return 'dyzelinas_elektra';
  if (el && (benz || /hibrid|hybrid|hybryd/.test(k))) return 'benzinas_elektra';
  if (duj) return 'benzinas_dujos';
  if (dyz) return 'dyzelinas';
  if (benz) return 'benzinas';
  if (el) return 'elektra';
  return null;
}
function kurasAtitinka(kuras, filtras) {
  const pasirinkti = kuroSarasas(filtras);
  if (!pasirinkti.length) return true;
  if (!kuras) return true;
  const kat = kuroKategorija(kuras);
  if (!kat) return true;
  return pasirinkti.some((f) => (KURO_SENI[f] ? KURO_SENI[f].includes(kat) : kat === f));
}
const F = 'benzinas,benzinas_elektra';
T(kurasAtitinka('Benzinas', F), 'Benzinas telpa');
T(kurasAtitinka('Benzinas / elektra', F), 'Benzinas / elektra telpa');
T(kurasAtitinka('Hibridas', F), '„Hibridas" be kuro = benzino hibridas -> telpa');
T(!kurasAtitinka('Dyzelinas', F), 'Dyzelinas NETELPA');
T(!kurasAtitinka('Elektra', F), 'Elektra NETELPA');
T(!kurasAtitinka('Benzinas / dujos', F), 'Benzinas / dujos NETELPA (dujos - atskira)');
T(kurasAtitinka('Dyzelinas', ''), 'be filtro praeina viskas');
T(kurasAtitinka(null, F), 'nezinomas skelbimo kuras nefiltruojamas');
T(kurasAtitinka('Dyzelinas / elektra', 'dyzelis'), 'senas vardas „dyzelis" tebeveikia');

console.log('\n' + (klaidu ? klaidu + ' KRENTA' : 'visi ' + n + ' prajo'));
process.exit(klaidu ? 1 : 0);
