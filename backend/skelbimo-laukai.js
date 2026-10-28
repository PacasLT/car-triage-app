// backend/skelbimo-laukai.js — rida, galia, metai, kuras iš skelbimo parametrų
// lentelės, kad ir kokia kalba ji būtų.
//
// v2.29.0 (KL-1021-0100). Luko nuotraukoje mobile.de skelbimas rodė tik „2024",
// be ridos, nors portale parašyta 43 000 km. Priežastis: `scrapeSingleListing`
// grąžina `skelbimoParametrai` – portalo lentelę su JO kalbos pavadinimais –
// bet niekas iš jos nieko neištraukdavo. Metai buvo spėjami iš teksto, rida ir
// galia likdavo tuščios, o be ridos neskaičiuojama ir kainos kreivė.
//
// Penki portalai, keturios kalbos:
//   autoplius / autogidas  lietuviškai  „Rida", „Galia", „Kuro tipas"
//   mobile.de              vokiškai     „Kilometerstand", „Leistung", „Kraftstoff"
//   otomoto                lenkiškai    „Przebieg", „Moc", „Rodzaj paliwa"
//   autoscout24            angliškai    „Mileage", „Power", „Fuel type"
//
// Kodėl ne viena bendra „rask skaičių su km" taisyklė: tame pačiame skelbime
// būna ir „Kilometerstand 43.000 km", ir „Jahresfahrleistung 15.000 km".
// Reikšmė imama tik iš lauko, kurio PAVADINIMAS atpažintas.

// Pavadinimai rašomi be diakritikų ir mažosiomis – `norm` juos tokius ir paverčia.
const LAUKAI = {
  rida:    ['rida', 'kilometrazas', 'kilometerstand', 'przebieg', 'mileage', 'odometer', 'km stand'],
  galia:   ['galia', 'leistung', 'moc', 'power', 'engine power', 'variklio galia'],
  metai:   ['pagaminimo data', 'pagaminimo metai', 'metai', 'erstzulassung', 'rok produkcji',
            'first registration', 'registration', 'pirmoji registracija', 'baujahr', 'zulassung'],
  kuras:   ['kuro tipas', 'kuras', 'kraftstoff', 'kraftstoffart', 'rodzaj paliwa', 'paliwo',
            'fuel type', 'fuel', 'degalai'],
  deze:    ['pavaru deze', 'pavaru dėžė', 'getriebe', 'getriebeart', 'skrzynia biegow',
            'gearbox', 'transmission'],
  turis:   ['variklio turis', 'variklis', 'hubraum', 'pojemnosc skokowa', 'engine size',
            'displacement', 'cubic capacity'],
};

function norm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // ė → e, ž → z, ł lieka
    .replace(/ł/g, 'l').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lauko reikšmė pagal pavadinimą. Pirmenybė TIKSLIAM sutapimui: „Leistung" turi
// nugalėti „Leistungsgewicht", o „Rida" – „Ridos patikra".
function reiksme(parametrai, raktai) {
  if (!parametrai) return null;
  const poros = Object.entries(parametrai).map(([k, v]) => [norm(k), v]);
  for (const r of raktai) {
    const t = poros.find(([k]) => k === r);
    if (t && t[1] != null && String(t[1]).trim()) return String(t[1]);
  }
  for (const r of raktai) {
    const t = poros.find(([k]) => k.startsWith(r + ' ') || k === r);
    if (t && t[1] != null && String(t[1]).trim()) return String(t[1]);
  }
  return null;
}

// „43.000 km" · „43,000 km" · „150 000 km" · „43000" → 43000
function skaicius(v) {
  if (v == null) return null;
  const m = String(v).match(/(\d[\d\s.,]*)/);
  if (!m) return null;
  // Skyrikliai nuimami tik kai po jų TRYS skaitmenys – kitaip „2,0" taptų 20.
  const sk = m[1].replace(/[\s.,](?=\d{3}\b)/g, '').replace(/[\s.,]/g, '.');
  const n = parseFloat(sk);
  return Number.isFinite(n) ? n : null;
}

function rida(v) {
  const n = skaicius(v);
  if (n == null) return null;
  const r = Math.round(n);
  return r >= 100 && r <= 1500000 ? r : null;
}

// „220 kW (299 PS)" · „299 PS (220 kW)" · „150 kW" · „299 hp" → kW.
// Kainos kreivės `galioja.galia` ribos yra kilovatais, tad AG verčiam.
function galia(v) {
  if (v == null) return null;
  const s = String(v);
  const kw = s.match(/(\d[\d\s.,]*)\s*kw/i);
  if (kw) { const n = skaicius(kw[1]); if (n && n >= 20 && n <= 1500) return Math.round(n); }
  const ag = s.match(/(\d[\d\s.,]*)\s*(ps|hp|ag|km\b|cv)/i);
  if (ag) { const n = skaicius(ag[1]); if (n && n >= 30 && n <= 2000) return Math.round(n * 0.7355); }
  const n = skaicius(s);
  return n && n >= 20 && n <= 1500 ? Math.round(n) : null;
}

// „03/2024" · „2024-03" · „2024" · „03.2024" · „2024 m. kovo mėn." → { metai, menuo }
function data(v) {
  if (v == null) return { metai: null, menuo: null };
  const s = String(v);
  let m = s.match(/(?:^|\D)(0?[1-9]|1[0-2])\s*[\/.\-]\s*((?:19|20)\d{2})(?!\d)/);
  if (m) return { metai: +m[2], menuo: +m[1] };
  m = s.match(/((?:19|20)\d{2})\s*[\/.\-]\s*(0?[1-9]|1[0-2])(?!\d)/);
  if (m) return { metai: +m[1], menuo: +m[2] };
  m = s.match(/(?:^|\D)((?:19|20)\d{2})(?!\d)/);
  if (m) return { metai: +m[1], menuo: null };
  return { metai: null, menuo: null };
}

// Portalų kuro pavadinimai → mūsų vardai (tokie patys, kokius rašo autoplius,
// nes jais remiasi ir kainos kreivė, ir taršos mokestis).
// EILES TVARKA SVARBI. „Hybrid (Benzin/Elektro)" turi tapti „Benzinas / elektra",
// o ne „Elektra" – todel mišrios poros tikrinamos PIRMA, o grynas elektra lieka
// paskutinis, kaip likutis. Pamatuota su tikra mobile.de reikšme.
const KURAS = [
  [/diesel.*elektr|dyzel.*elektr|elektr.*diesel|hybrid.*diesel|diesel.*hybrid/, 'Dyzelinas / elektra'],
  [/plug.?in|benzin.*elektr|elektr.*benzin|hybrid.*benzin|benzin.*hybrid|benzyna.*elektr|petrol.*electr|gasoline.*electr|hybrid.*petrol|petrol.*hybrid/, 'Benzinas / elektra'],
  [/dujos|lpg|autogas|cng|erdgas|gaz\b/, 'Benzinas / dujos'],
  [/dyzel|diesel|olej nap/, 'Dyzelinas'],
  [/benzin|petrol|gasoline|benzyna/, 'Benzinas'],
  [/hybrid|hibrid|hybryd/, 'Benzinas / elektra'],
  [/elektra|electric|elektro|elektryczny/, 'Elektra'],
];
function kuras(v) {
  if (v == null) return null;
  const s = norm(v);
  for (const [re, vardas] of KURAS) if (re.test(s)) return vardas;
  return null;
}

// „2,0 l" · „1995 cm3" · „2.0" → litrai
function turis(v) {
  const n = skaicius(v);
  if (n == null) return null;
  if (n > 100) return Math.round(n / 100) / 10;      // cm³
  return n >= 0.5 && n <= 9 ? Math.round(n * 10) / 10 : null;
}

// Pagrindinė: parametrų lentelė → mūsų laukai. Ko nėra – `null`, niekada nespėjam.
function laukai(parametrai) {
  const d = data(reiksme(parametrai, LAUKAI.metai));
  return {
    rida: rida(reiksme(parametrai, LAUKAI.rida)),
    galia: galia(reiksme(parametrai, LAUKAI.galia)),
    metai: d.metai,
    menuo: d.menuo,
    kuras: kuras(reiksme(parametrai, LAUKAI.kuras)),
    variklioTuris: turis(reiksme(parametrai, LAUKAI.turis)),
    deze: reiksme(parametrai, LAUKAI.deze) || null,
  };
}

module.exports = { laukai, reiksme, rida, galia, data, kuras, turis, norm, LAUKAI, KURAS };
