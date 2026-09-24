// modelio-apzvalga.test.js — „Analizuoti modelį" (v2.16.0).
//     node backend/testai/modelio-apzvalga.test.js
const fs = require('fs'), path = require('path');
const m = require('../modelio-apzvalga');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const planai = fs.readFileSync(path.join(__dirname, '..', 'planai.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'index.html'), 'utf8');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

// Netikri „deps" – testas neturi liesti nei disko, nei tinklo, nei AI.
const deps = {
  regitra: {
    kontekstas: () => ({ parkas: 12250, variantu: 152, imp12: 1225, apyv_pct: 25.7,
      neleid_pct: 11.6, neleid15_pct: 16.5, senu_dalis_pct: 42.1, rida_med: 221085, kmmet_med: 17245 }),
    taKontekstas: () => ({ automobiliu: 12514, apziuru: 63908 }),
    kartosIntervalui: () => ['G05', 'F15'],
  },
  cache: {
    modelioTendencijos: () => ({ kryptis: { procentai: -7, nuo: '2026-03', iki: '2026-09', nuoKainos: 28000, ikiKainos: 26000, kryptis: 'pinga' },
      menesiai: [{ menuo: '2026-03', mediana: 28000, imtis: 9 }] }),
    modelioPardavimoGreitis: () => ({ imtis: 14, medianaDienu: 31, greiciausias: 4, leciausias: 92 }),
  },
};
const d = m.surinktiDuomenis({ marke: 'BMW', modelis: 'X5', metaiNuo: 2018, metaiIki: 2024,
  rinka: { rasta: 62, mediana: 27500, nuo: 19000, iki: 41000 } }, deps);

// ── Duomenų rinkimas ────────────────────────────────────────────────────────
T(d.lt.parkas === 12250, 'parkas paimamas iš Regitros');
T(d.lt.importoDalisPct === 10, 'importo dalis suskaičiuojama (1 225 iš 12 250 = 10 %)');
T(d.lt.taNeleistaPct === 11.6 && d.lt.taNeleista15Pct === 16.5, 'techninės apžiūros rodikliai perduodami abu');
T(d.kartos.join(',') === 'G05,F15', 'kartos imamos pagal metų intervalą');
T(d.kainuKryptis.kryptis === 'pinga', 'kainų kryptis iš mūsų istorijos');
T(d.pardavimoGreitis.medianaDienu === 31, 'pardavimo greitis iš mūsų istorijos');
T(d.rinka.rasta === 62, 'ką tik rastos paieškos santrauka keliauja kartu');
T(d.saltiniai.length === 3 && d.saltiniai.some((s) => /Regitra/.test(s)) && d.saltiniai.some((s) => /TRANSEKSTA/.test(s)),
  'šaltiniai išvardyti (Regitra, TRANSEKSTA, mūsų istorija)');

// Modelis be mūsų duomenų neturi lūžti – tiesiog mažiau faktų.
const tuscia = m.surinktiDuomenis({ marke: 'Nezinoma', modelis: 'XYZ' },
  { regitra: { kontekstas: () => null, taKontekstas: () => null, kartosIntervalui: () => [] },
    cache: { modelioTendencijos: () => null, modelioPardavimoGreitis: () => null } });
T(tuscia.lt === null && tuscia.saltiniai.length === 0, 'nežinomas modelis – be duomenų, bet be klaidos');

// ── Promptas ────────────────────────────────────────────────────────────────
const p = m.promptas(d);
T(/BMW X5/.test(p), 'prompte yra markė ir modelis');
T(/2018–2024 m\. laidos/.test(p), 'prompte yra metų intervalas');
T(/12250/.test(p) && /25\.7 %/.test(p), 'mūsų skaičiai perduodami AI');
T(/NEPERSKAIČIUOK/.test(p), 'AI aiškiai prašoma neperskaičiuoti mūsų skaičių');
T(/Ką tik radome 62 skelbimų/.test(p), 'paieškos rezultatas prompte');
T(/Grąžink TIK JSON/.test(p) && /"problemos"/.test(p) && /"ka_tikrinti"/.test(p), 'prašoma JSON su bėdomis ir patikrinimais');
T(/saltinis/.test(p), 'kiekvienai bėdai prašoma šaltinio');
T(!/Ką tik radome/.test(m.promptas(tuscia)), 'be paieškos duomenų tos eilutės nėra');

// ── Serveris ────────────────────────────────────────────────────────────────
T(/app\.post\('\/api\/modelio-apzvalga'/.test(src), 'yra /api/modelio-apzvalga');
T(src.indexOf("cache.getCached('modelis'") < src.indexOf("planai.reikalautiKreditu('modelioApzvalga'"),
  'talpykla tikrinama PRIEŠ kreditų nurašymą – už turimą atsakymą neimam nieko');
T(/cache\.setCached\('modelis'/.test(src), 'paruošta apžvalga išsaugoma talpykloje');
T(/max_uses: 5/.test(src) && /web_search/.test(src), 'AI leidžiama ieškoti internete');
T(/modelioApzvalga: 2/.test(planai), 'kaina – 2 kreditai');
T(/MODELIO_TTL_MS/.test(fs.readFileSync(path.join(__dirname, '..', 'cache.js'), 'utf8')), 'talpyklai nustatytas savas terminas (30 d.)');

// ── Priekinė dalis ──────────────────────────────────────────────────────────
T(/id="ct-modelio-btn"[^>]*hidden/.test(html), 'mygtukas yra ir iš pradžių paslėptas');
T(/b\.hidden = !\(f && f\.marke && f\.modelis\)/.test(html), 'mygtukas rodomas tik pasirinkus modelį');
T(/window\.ctPaskFiltrai = filters/.test(html), 'įsimenami paieškos filtrai');
T(/function ctModelioLangas\(r\)/.test(html), 'yra apžvalgos langas');
T(/resp\.status === 402/.test(html.slice(html.indexOf('ctModelioApzvalga = async'))), 'be kreditų atidaromas planų langas');
T(/'<div class="ct-modal" role="dialog" aria-modal="true" aria-labelledby="ct-apz-h">'\s*\n\s*\+ '<button type="button" class="ct-modal-x"/.test(html),
  'kryžiukas – tiesioginis `.ct-modal` vaikas (55 paketo taisyklė)');
T(/function ctApzPr\(n\)/.test(html) && /ctApzPr\(d\.lt\.apyvartaPct\)/.test(html), 'procentai rašomi su kableliu, ne tašku');

// ── Kainų diagrama pagal metus ──────────────────────────────────
// Funkcijos išimamos iš `index.html` ir paleidžiamos su netikra paieška – taip
// tikrinama pati skaičiavimo logika, ne tik tai, kad kodas egzistuoja.
const blokas = html.match(/function ctKainuPagalMetus\(\)[\s\S]*?\n}\n/);
const grafBlokas = html.match(/function ctKainuGrafikas\(eil\)[\s\S]*?\n}\n/);
T(!!blokas && !!grafBlokas, 'diagramos funkcijos rastos index.html');
const fake = { currentData: { allListings: [
  { url: 'a', metai: 2018, kaina: 20000 }, { url: 'b', metai: 2018, kaina: 24000 },
  { url: 'c', metai: 2019, kaina: 26000 }, { url: 'd', metai: 2019, kaina: 28000 }, { url: 'e', metai: 2019, kaina: 30000 },
  { url: 'f', metai: 2020, kaina: 33000 },                       // vieni metai su 1 skelbimu
  { url: 'g', metai: 1800, kaina: 5000 }, { url: 'h', metai: 1800, kaina: 6000 },  // nesąmoningi metai
  { url: 'j', metai: 2021, kaina: null }, { url: 'a', metai: 2018, kaina: 20000 }, // be kainos ir tas pats skelbimas antrą kartą
], candidates: [] } };
const F = new Function('window', blokas[0] + grafBlokas[0] + '; return { m: ctKainuPagalMetus, g: ctKainuGrafikas };')(fake);
const eil = F.m();
T(eil.length === 2, 'lieka tik metai su bent 2 skelbimais (2018 ir 2019)');
T(eil[0].metai === 2018 && eil[0].mediana === 24000 && eil[0].kiek === 2, '2018: mediana iš dviejų kainų, dublis neskaičiuojamas du kartus');
T(eil[1].mediana === 28000 && eil[1].kiek === 3, '2019: mediana iš trijų');
T(!eil.some((x) => x.metai === 1800), 'nesąmoningi metai išmetami');
const svg = F.g(eil);
T(/<svg /.test(svg) && /role="img"/.test(svg), 'diagrama – SVG su `role="img"`');
T((svg.match(/<title>/g) || []).length === 2, 'kiekvienas stulpelis turi užvedimo užrašą');
T(/30 000 |28 000/.test(svg.replace(/\u00a0/g, ' ')), 'užvedimo užraše – tikra suma');
T(F.g([{ metai: 2020, mediana: 100, kiek: 5 }]) === '', 'vieni metai – diagramos nepiešiam');
T(/fill="var\(--accent\)"/.test(svg), 'stulpeliai – dizaino sistemos spalva');
T(!/stroke=/.test(svg.replace(/stroke="var\(--border\)"/, '')), 'stulpeliai be rėmelių – skiria tarpas, ne linija');

// ── Papildomi klausimai ────────────────────────────────────────
T(/app\.post\('\/api\/modelio-klausimas'/.test(src), 'yra /api/modelio-klausimas');
T(/modelioKlausimas: 1/.test(planai), 'klausimas kainuoja 1 kreditą');
T(/modelioRaktas\(r\.body\) \+ '#' \+ String\(\(r\.body && r\.body\.klausimas\)/.test(src),
  'tas pats klausimas per parias – nemokamai (raktas su klausimu)');
T(/turimas\s*\?\s*JSON\.stringify\(\{ duomenys: turimas\.duomenys, apzvalga: turimas\.apzvalga \}\)/.test(src),
  'atsakymas remiasi jau paruošta apžvalga – iš naujo nieko nerenkam');
T(/id="ct-apz-kl"/.test(html) && /id="ct-apz-kl-btn"/.test(html), 'lange yra klausimo laukas ir mygtukas');
T(/e\.key === 'Enter'/.test(html.slice(html.indexOf('function ctModelioLangas'))), 'klausimą galima pateikti Enter klavišu');

// ── Klausimai prie konkretaus skelbimo (Lukas: „ir apžvalgos, ir skelbime") ──
const detail = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'detail.html'), 'utf8');
T(/app\.post\('\/api\/skelbimo-klausimas'/.test(src), 'yra /api/skelbimo-klausimas');
T(/async function aiKlausimas\(pav, kontekstas, klausimas, istorija\)/.test(src), 'abu klausimų galai naudoja tą patį atsakytoją');
T((src.match(/await aiKlausimas\(/g) || []).length === 2, 'atsakytojas kviečiamas iš dviejų vietų – modelio ir skelbimo');
T(/analizesPodelis\(url, b\.kaina\) \|\| cache\.getCached\('analysis'/.test(src),
  'skelbimo klausimas remiasi jau padaryta to skelbimo analize');
T(/suAnalize: !!analize/.test(src), 'atsakyme pasakoma, ar analizė buvo');
T(/id="dp-klaus-laukas"/.test(detail) && /id="dp-klaus-btn"/.test(detail), 'skelbimo puslapyje yra klausimo laukas');
T(/dpKlausimaiParuosti\(\);/.test(detail), 'laukas paruošiamas įkeliant skelbimą');
T(/Atsakyta iš skelbimo laukų/.test(detail), 'be analizės vartotojui pasakoma, kad atsakymas mažiau pagrįstas');
T(/skelbimo-klausimas/.test(detail), 'naršyklė kreipiasi į teisingą galą');

// ── Pokalbis, ne pavieniai klausimai (Luko prašymas) ────────────────────
T(/function pokalbioZinutes\(istorija\)/.test(src), 'istorija paruošiama atskira funkcija');
T(/POKALBIO_ZINUCIU = 8/.test(src) && /POKALBIO_ZENKLU = 1200/.test(src),
  'pokalbis apkarpomas – 8 žinutės, po 1 200 ženklų (kad ilgas pokalbis nebrangtų)');
T(/\.filter\(\(z\) => z && typeof z\.tekstas === 'string'/.test(src), 'iš naršyklės atėjusi istorija tikrinama');
T(/z\.role === 'user' \|\| z\.role === 'assistant'/.test(src), 'priimamos tik dvi rolės');
T(/pradzia\.concat\(pokalbioZinutes\(istorija\)/.test(src), 'kontekstas siunčiamas kartą, toliau – pokalbio žinutės');
T((src.match(/aiKlausimas\([^)]*b\.istorija\)/g) || []).length === 2, 'abu galai perduoda pokalbio istoriją');
T(/pokalbis\.push\(\{ role: 'user', tekstas: kl \}, \{ role: 'assistant', tekstas: a\.atsakymas \}\)/.test(html),
  'apžvalgos langas įsimena pokalbį');
T(/pokalbis\.push\(\{ role: 'user', tekstas: kl \}, \{ role: 'assistant', tekstas: a\.atsakymas \}\)/.test(detail),
  'skelbimo puslapis įsimena pokalbį');
T(/istorija: pokalbis\.slice\(-8\)/.test(html) && /istorija: pokalbis\.slice\(-8\)/.test(detail),
  'abi vietos siunčia tik paskutines žinutes');

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
