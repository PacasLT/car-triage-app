// modelio-atitikimas.test.js — Luko klaida Nr.55 (v2.28.1).
//
//     node backend/testai/modelio-atitikimas.test.js
//
// Kodėl sargas: tai filtras, kuris sprendžia, ką vartotojas pamatys po APMOKĖTO
// nuskaitymo. Jo klaida nekrenta – ji tyliai parodo ne tą automobilį arba tyliai
// išmeta teisingą. Produkcijoje 2026-10-19 poeilės filtras iš 961 autoscout24
// skelbimo „paliko" 446, ir tarp jų buvo X1, X3 ir X5, nors prašyta BMW 5.
const M = require('../modelio-atitikimas');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── Nr.55: BMW 5 neturi grąžinti X1 / X3 / X5 ───────────────────────────────
{
  const t = M.tikrintuvas('BMW', '5');
  const laukti = [
    ['BMW 520', true], ['BMW 520d', true], ['BMW 530', true], ['BMW 530e', true],
    ['BMW 518', true], ['BMW 525 xDrive', true], ['BMW 530 Gran Turismo', true],
    ['5 serija', true], ['BMW 5', true],
    ['BMW X5', false], ['X5', false], ['BMW X5 xDrive30d', false],
    ['BMW X3', false], ['BMW X1', false], ['BMW X6', false],
    ['BMW 320', false], ['BMW 320d', false], ['BMW 350', false],
    ['BMW 118i', false], ['BMW M5', false],
  ];
  laukti.forEach(([mod, tiks]) => {
    T(t({ modelis: mod }) === tiks, 'BMW 5 ← „' + mod + '": ' + (tiks ? 'tinka' : 'NEtinka'));
  });
}

// ── Senoji poeilė būtų praleidusi – įrodymas, kad skalė pakito ──────────────
{
  const t = M.tikrintuvas('BMW', '5');
  const poeile = (mod) => String(mod).toLowerCase().includes('5');
  const apgauleX5 = 'BMW X5';
  T(poeile(apgauleX5) === true && t({ modelis: apgauleX5 }) === false,
    'poeilė „X5" praleisdavo, raktas – nebe (tai ir buvo Nr.55)');
  // rawText praktiškai visada turi „5" – todėl jo nebenaudojam
  const rawText = 'BMW X3 xDrive20d, 2015 m., 150 kW, 15 500 €';
  T(rawText.toLowerCase().includes('5') === true,
    'rawText su „2015/150 kW/15 500" turi „5" – poeilė praleisdavo viską');
  T(t({ modelis: 'BMW X3', rawText }) === false, 'su rawText X3 vis tiek neįeina');
}

// ── TIKRAS Nr.55 skelbimas, kurį Lukas pamatė (autoscout24, 2026-10-19) ────
{
  const t = M.tikrintuvas('BMW', '5');
  const tikras = {
    modelis: 'BMW X1',
    pavadinimas: 'BMW X1 1.5 xDrive25e M-Sport , Navigatie, M-sportpakket,',
    rawText: 'BMW X1 1.5 xDrive25e M-Sport 2023 42 282 km Benzinas / elektra Automatine 37 900 EUR',
  };
  T(t(tikras) === false, 'tikras Nr.55 skelbimas (BMW X1 1.5) nebeįeina į BMW 5 paiešką');
  T(t({ pavadinimas: tikras.pavadinimas }) === false, 'ir tik iš antraštės – nebeįeina');
  // Kodėl jis įeidavo: „1.5" antraštėje ir „37 900" kainoje turi „5"
  const sena = (l) => (l.modelis || '').toLowerCase().includes('5') || (l.rawText || '').toLowerCase().includes('5');
  T(sena(tikras) === true, 'senoji poeilė jį praleisdavo – dėl „1.5" ir „37 900"');
  // Jis buvo palygintas su BMW 5 mediana („−18 % žemiau Vakarų Europos rinkos")
  T(t({ modelis: 'BMW X1', rawText: '45980' }) === false, 'X1 nebepatenka į BMW 5 medianą');
}

// ── Kiti modeliai: raktas turi būti tikslus, ne „prasideda taip pat" ────────
{
  const x5 = M.tikrintuvas('BMW', 'X5');
  T(x5({ modelis: 'BMW X5 xDrive40i' }) === true, 'X5 ← „X5 xDrive40i"');
  T(x5({ modelis: 'BMW X5 M' }) === true, 'X5 ← „X5 M" (tas pats raktas)');
  T(x5({ modelis: 'BMW X6' }) === false, 'X5 ← „X6": ne');
  T(x5({ modelis: 'BMW 525' }) === false, 'X5 ← „525": ne');

  const a4 = M.tikrintuvas('Audi', 'A4');
  T(a4({ modelis: 'Audi A4 Avant' }) === true, 'A4 ← „A4 Avant"');
  T(a4({ modelis: 'Audi A4 Allroad' }) === true, 'A4 ← „A4 Allroad" (raktas A4)');
  T(a4({ modelis: 'Audi A6' }) === false, 'A4 ← „A6": ne');
  T(a4({ modelis: 'Audi A3' }) === false, 'A4 ← „A3": ne');

  const okt = M.tikrintuvas('Skoda', 'Octavia');
  T(okt({ modelis: 'Skoda Octavia Combi' }) === true, 'Octavia ← „Octavia Combi"');
  T(okt({ modelis: 'Skoda Superb' }) === false, 'Octavia ← „Superb": ne');

  // Mercedes klasės: „C 220 CDI" raktas yra C, ne C220
  const c = M.tikrintuvas('Mercedes-Benz', 'C klasė');
  T(c({ modelis: 'Mercedes-Benz C 220 CDI' }) === true, 'C klasė ← „C 220 CDI"');
  T(c({ modelis: 'Mercedes-Benz E 220' }) === false, 'C klasė ← „E 220": ne');
}

// ── Kai modelio neprašyta arba raktas neapibrėžtas – nefiltruojam ───────────
{
  T(M.tikrintuvas('BMW', null)({ modelis: 'BMW X5' }) === true, 'be modelio – praleidžiam viską');
  T(M.tikrintuvas('BMW', '')({ modelis: 'BMW X5' }) === true, 'tuščias modelis – praleidžiam');
  // „X serija" nesako, ar X1, ar X5 – `baziniModelis` grąžina null
  const xs = M.tikrintuvas('BMW', 'X serija');
  T(xs({ modelis: 'BMW X1' }) === true && xs({ modelis: 'BMW 520' }) === true,
    'neapibrėžtas raktas („X serija") – nefiltruojam, o ne išmetam viską');
}

// ── Skelbimas be `modelis` lauko: antraštė žodžio riba ──────────────────────
{
  const t = M.tikrintuvas('BMW', '5');
  T(t({ pavadinimas: 'BMW 5 serija, 2019, dyzelinas' }) === true, 'antraštė „BMW 5 serija"');
  T(t({ title: 'BMW 520d Touring' }) === true, 'antraštė „BMW 520d" (raktas iš jos)');
  T(t({ pavadinimas: 'BMW X5 40d, 2019' }) === false, 'antraštė „BMW X5" – ne');
  // Niekada neišmetam to, ko nustatyti neįmanoma – už nuskaitymą jau sumokėta
  T(t({}) === true, 'be modelio ir be antraštės – NEIŠMETAM');
  T(t({ modelis: null, pavadinimas: '' }) === true, 'tušti laukai – NEIŠMETAM');
  T(t(null) === false, 'null skelbimas nenukrenta');
}

// ── Žodžio riba su lietuviškomis raidėmis ──────────────────────────────────
{
  const z = M.zodzioRiba;
  T(z('5', 'BMW 5 serija') === true, '„5" yra atskiras žodis');
  T(z('5', 'BMW 525') === false, '„5" nėra atskiras žodis „525" viduje');
  T(z('5', 'BMW X5') === false, '„X5" – ne');
  T(z('5', '2015 metai') === false, '„2015" – ne');
  T(z('5', '150 kW') === false, '„150" – ne');
  T(z('A4', 'Audi A4, 2020') === true, '„A4" su kableliu');
  T(z('A4', 'Audi A4L') === false, '„A4L" – ne');
  T(z('C', 'Mercedes C klasė') === true, 'lietuviška raidė už ribos netrukdo');
  T(z('Octavia', 'ŠKODA OCTAVIA RS') === true, 'registras nesvarbus');
  T(z('', 'bet kas') === false, 'tuščia frazė – false');
  T(z('5', '') === false, 'tuščias tekstas – false');
  T(z('A.4', 'Audi A.4') === true, 'taškas frazėje neinterpretuojamas kaip regex');
  T(z('(5)', 'BMW (5) serija') === true, 'skliaustai frazėje nenulaužia regex');
}

console.log('\nmodelio-atitikimas: ' + (n - klaidu) + '/' + n + ' ok' + (klaidu ? ', ' + klaidu + ' BLOGAI' : ''));
process.exit(klaidu ? 1 : 0);
