// backend/kainu-kreive.js — kainos prognozė pagal amžių, ridą, galią ir kurą.
//
// v2.28.0. Iki šiol skelbimas buvo lyginamas su to paties modelio kainų mediana
// (`rinkos-mediana.js`). Mediana nežino nei amžiaus, nei ridos, todėl tas pats
// skaičius buvo taikomas 2012 m. automobiliui su 300 000 km ir 2022 m. su
// 40 000 km. Analitikas pamatavo, kiek kiekvienas būdas klysta (vidutinė
// absoliuti paklaida nuo prašomos kainos, 14 modelių, 2026-10-19 skerspjūvis):
//
//   viena modelio mediana ........ 54,5 %
//   mediana pagal modelį ir metus  17,7 %  (įvertinta pačiuose duomenyse)
//   kainos kreivė ................ 16,6 %  (kryžminė patikra)
//
// Perskaičiavau koeficientus savo eksporte: paklaida sutampa iki 1,6 proc. p.
// visiems 14 modelių, o prieš vieną medianą kreivė laimi visur (VW Touran
// 18,6 % vs 81,0 %). Todėl kreivė rodoma kaip PADĖTIS tarp panašių, o ne kaip
// „žemiau rinkos" procentas.
//
// SVARBU – ko šis modulis NEKEIČIA: triažo balo, 12/15 % slenksčių, filtro
// „žemiau rinkos", `itariamaZala` ir `maxPirkimo`. Visi jie toliau remiasi
// mediana. Kreivė kol kas yra atskiras, geriau pagrįstas rodiklis; jos
// perkėlimas į balą būtų atskiras Luko sprendimas.
//
// Koeficientų failas: duomenys/kainu-kreives.json (analitiko, md5
// e8a331fe579a233ffd08a3bd93881c58). Tai PRAŠOMOS, ne sandorio kainos, ir
// vienos dienos pjūvis. Rinka juda ~+10 %/metus, tad failas perskaičiuojamas
// kas ketvirtį su nauju skerspjūvio skenavimu.

const fs = require('fs');
const path = require('path');

const FAILAS = path.join(__dirname, 'duomenys', 'kainu-kreives.json');

// Kuro reikšmės portaluose rašomos didžiąja ir su tarpais („Benzinas / elektra"),
// o koeficientų raktai – mažosiomis ir be tarpų („k_benzinas/elektra").
// Nepadengti kurai (elektra, benzinas/dujos) priedo negauna – jiems modelis
// koeficiento neturi, tad jie vertinami kaip bazinis kuras.
const LEIDZIAMI = new Set(['dyzelinas', 'benzinas', 'benzinas/elektra', 'benzinas/dujos', 'dyzelinas/elektra', 'elektra']);

function normKuras(k) {
  if (!k) return '';
  let s = String(k).toLowerCase().trim();
  s = s.replace(/\s*\([^)]*\)\s*/g, '');          // „(plug-in)"
  s = s.replace(/\s*\/\s*/g, '/');
  // Ne ASCII simbolis klaseje neveikia patikimai, todel riba ASCII simboliais:
  // gamtines dujos rasomos ir su ilgosiomis, ir be ju.
  s = s.replace(/gamtin[^/]*dujos/g, 'dujos');
  return LEIDZIAMI.has(s) ? s : '';
}

let _duom = null;
let _klaida = null;
function duomenys() {
  if (_duom || _klaida) return _duom;
  try {
    _duom = JSON.parse(fs.readFileSync(FAILAS, 'utf8'));
  } catch (e) {
    _klaida = e;
    console.warn('[KREIVE] nepavyko ikelti ' + FAILAS + ': ' + e.message);
    _duom = null;
  }
  return _duom;
}

function kreive(raktas) {
  const d = duomenys();
  if (!d || !d.modeliai || !raktas) return null;
  return d.modeliai[String(raktas).toUpperCase()] || null;
}

function versija() {
  const d = duomenys();
  return d ? { versija: d.versija, sugeneruota: d.sugeneruota, modeliu: Object.keys(d.modeliai || {}).length } : null;
}

// log(prognoze) = const + amz×amžius + lr×log(rida) + galia×(galia/100) + kuro priedas
function prognoze(m, amzius, rida, galia, kuras) {
  const k = m.koef;
  let lp = k.const + k.amz * amzius + k.lr * Math.log(rida) + k.galia * (galia / 100);
  const kk = k['k_' + kuras];
  if (Number.isFinite(kk)) lp += kk;
  return Math.exp(lp);
}

// Padėtis tarp panašių. `likutis_q` – likučių kvantiliai LOG skalėje
// [P10, P25, P50, P75, P90], tad lyginam log(kaina/prognozė), ne (kaina/prognozė − 1):
// prie ±0,29 tas skirtumas jau ~4 %, ir riba suveiktų ne ten, kur turi.
const PADETYS = [
  { kodas: 'labai-pigus', q: 0, zyma: 'pigesnis nei 90 %', tonas: 'good' },
  { kodas: 'pigus',       q: 1, zyma: 'pigesnis nei 75 %', tonas: 'good' },
  { kodas: 'atitinka',    q: null, zyma: 'kaina atitinka lygį', tonas: 'neutral' },
  { kodas: 'brangus',     q: 3, zyma: 'brangesnis nei 75 %', tonas: 'warn' },
  { kodas: 'labai-brangus', q: 4, zyma: 'brangesnis nei 90 %', tonas: 'warn' },
];

function padetis(logSkirtumas, q) {
  if (!Array.isArray(q) || q.length < 5) return null;
  if (logSkirtumas <= q[0]) return PADETYS[0];
  if (logSkirtumas <= q[1]) return PADETYS[1];
  if (logSkirtumas >= q[4]) return PADETYS[4];
  if (logSkirtumas >= q[3]) return PADETYS[3];
  return PADETYS[2];
}

// Grąžina null, kai rodyti negalima (modelio nėra faile, duomenų nėra, arba
// reikšmės už imties ribų – ten kreivė ekstrapoliuoja ir klysta nenuspėjamai).
// `priezastis` grąžinama atskirai, kad sąsaja galėtų pasakyti, KODĖL nėra.
function ivertinti(o) {
  const dabar = o.dabar || new Date().getFullYear();
  const raktas = o.raktas || null;
  if (!raktas) return { ok: false, priezastis: 'nera-rakto' };
  const m = kreive(raktas);
  if (!m) return { ok: false, priezastis: 'modelio-nera' };
  if (o.kainosIspejimas) return { ok: false, priezastis: 'kainos-ispejimas' };

  // Number(null) === 0, o 0 yra „baigtinis" skaičius – tad tušti laukai pirma
  // paverčiami NaN. Be šio žingsnio skelbimas be metų gautų amžių „2026" ir
  // prognozę, pagrįstą niekuo.
  const sk = (x) => (x == null || x === '' ? NaN : Number(x));
  const kaina = sk(o.kaina);
  const rida = sk(o.rida);
  const galia = sk(o.galia);
  const metai = sk(o.metai);
  if (!Number.isFinite(kaina) || kaina <= 0) return { ok: false, priezastis: 'nera-kainos' };
  if (!Number.isFinite(metai)) return { ok: false, priezastis: 'nera-metu' };
  if (!Number.isFinite(rida) || rida < 1000) return { ok: false, priezastis: 'nera-ridos' };
  if (!Number.isFinite(galia) || galia <= 0) return { ok: false, priezastis: 'nera-galios' };

  const amzius = dabar - metai;
  const g = m.galioja || {};
  const uzRibu = [];
  if (g.amzius && (amzius < g.amzius[0] || amzius > g.amzius[1])) uzRibu.push('amzius');
  if (g.rida && (rida < g.rida[0] || rida > g.rida[1])) uzRibu.push('rida');
  if (g.galia && (galia < g.galia[0] || galia > g.galia[1])) uzRibu.push('galia');
  if (uzRibu.length) return { ok: false, priezastis: 'uz-ribu', uzRibu };

  const kuras = normKuras(o.kuras);
  const p = prognoze(m, amzius, rida, galia, kuras);
  if (!Number.isFinite(p) || p <= 0) return { ok: false, priezastis: 'skaiciavimo-klaida' };

  const skirtumas = kaina / p - 1;
  const pad = padetis(Math.log(kaina / p), m.likutis_q);
  if (!pad) return { ok: false, priezastis: 'nera-kvantiliu' };

  const modelioVardas = String(raktas).toUpperCase();
  const tekstas = pad.kodas === 'atitinka'
    ? 'Kaina atitinka tokio amžiaus ir ridos ' + modelioVardas + ' lygį.'
    : pad.zyma.charAt(0).toUpperCase() + pad.zyma.slice(1)
      + ' nei tokio pat amžiaus ir ridos ' + modelioVardas + '.';

  return {
    ok: true,
    raktas: modelioVardas,
    prognoze: Math.round(p),
    skirtumas: Math.round(skirtumas * 1000) / 10,     // procentais, vienas skaitmuo po taško
    padetis: pad.kodas,
    zyma: pad.zyma,
    tonas: pad.tonas,
    tekstas,
    n: m.n || null,
    maePct: m.mae_pct || null,
    mediana: m.mediana_kaina || null,
    // Paklaida 11–21 % pagal modelį yra skelbimų sklaida, ne modelio klaida –
    // rodom ją kartu su prognoze, kad skaičius nebūtų suprastas kaip tiksli vertė.
    rezis: (m.mae_pct && Number.isFinite(p))
      ? [Math.round(p * (1 - m.mae_pct / 100)), Math.round(p * (1 + m.mae_pct / 100))]
      : null,
    lygis: 'patvirtinta',
  };
}

module.exports = { ivertinti, prognoze, padetis, normKuras, kreive, versija, LEIDZIAMI, PADETYS, FAILAS };
