// puslapiai.test.js — „visi puslapiai" ir kainos stabdis (v2.15.0).
//     node backend/testai/puslapiai.test.js
const fs = require('fs'), path = require('path');
const kaina = require('../paieskos-kaina');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'index.html'), 'utf8');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

// ── Sąmata ──────────────────────────────────────────────────────────────────
T(kaina.samata(['autoplius'], 1).kr === 10, 'autoplius 1 psl. = 10 kr.');
T(kaina.samata(['mobilede'], 1).kr === 1, 'mobile.de 1 psl. = 1 kr.');
T(kaina.samata(['autoplius', 'autogidas'], 3).kr === 60, 'du LT portalai, 3 psl. = 60 kr. (dabartinė paieška)');
T(kaina.samata(['autoplius', 'autogidas', 'autoscout24', 'otomoto', 'mobilede'], 3).kr === 69, 'visi penki, 3 psl. = 69 kr.');
T(kaina.samata(['autoplius'], 0).kr === 10, 'nulis puslapių skaičiuojamas kaip vienas');
T(kaina.samata([], 5).kr === 0, 'be portalų – 0 kr.');

// Portalo riba: mobile.de po 100-o puslapio negrąžina nieko, tad ir sąmatoje
// jo puslapių negali būti daugiau (kitaip „visi" rodytų kainą už nebūtus psl.).
T(kaina.samata(['mobilede'], 200).puslapiu === 200, 'prašyta reikšmė lieka matoma');
T(kaina.samata(['mobilede'], 200).eilutes[0].puslapiu === 100, 'mobile.de eilutėje – ne daugiau 100 psl.');

// ── Kiek telpa į ribą ───────────────────────────────────────────────────────
T(kaina.telpaPuslapiu(['autoplius', 'autogidas', 'autoscout24', 'otomoto', 'mobilede'], 200) === 8, 'penki portalai, riba 200 kr. → 8 psl.');
T(kaina.telpaPuslapiu(['autoplius'], 200) === 20, 'vienas LT portalas, riba 200 kr. → 20 psl.');
T(kaina.telpaPuslapiu(['mobilede'], 200) === 50, 'mobile.de – iki „visų" ribos (50)');
T(kaina.telpaPuslapiu(['autoplius', 'autogidas'], 5) === 1, 'labai maža riba – bent vienas puslapis');
T(kaina.samata(['autoplius', 'autogidas', 'autoscout24', 'otomoto', 'mobilede'], kaina.telpaPuslapiu(['autoplius', 'autogidas', 'autoscout24', 'otomoto', 'mobilede'], 200)).kr <= 200, 'pasiūlytas kiekis TELPA į ribą');

// ── Serveris ────────────────────────────────────────────────────────────────
T(/const visiPuslapiai = String\(filters\.maxPages \|\| ''\)\.toLowerCase\(\) === 'visi'/.test(src), 'serveris supranta maxPages="visi"');
T(/kaina\.VISI_PUSLAPIAI/.test(src), 'riba imama iš paieskos-kaina, ne iš skaičiaus vietoje');
T(!/,\s*1\),\s*10\);/.test(src), 'senoji 10 puslapių riba nuimta');
T(/process\.env\.PAIESKOS_RIBA_KR \|\| '200'/.test(src), 'stabdžio suma – Railway kintamasis, numatyta 200 kr.');
T(/perbrangu: true/.test(src), 'viršijus ribą grąžinamas „perbrangu"');
T(/!filters\.patvirtinta && !arAdminas/.test(src), 'patvirtinta paieška ir adminas stabdžio nemato');
T(/runSearchJob\(jobId, req\.body, planai\.arAdmin\(req\.user\)\)/.test(src), 'admino požymis perduodamas į darbą');
T(/k !== 'patvirtinta'/.test(src), 'patvirtinimas neįeina į talpyklos raktą');

// ── Priekinė dalis ──────────────────────────────────────────────────────────
T(/<option value="visi">/.test(html), 'sąraše yra „Visi"');
T(/<option value="10">/.test(html) && /<option value="20">/.test(html), 'sąraše yra 10 ir 20');
T(/patvirtinta: !!window\._ctPatvirtinta/.test(html), 'patvirtinimas siunčiamas su filtrais');
T(/window\._ctPatvirtinta = false;/.test(html), 'patvirtinimas galioja tik vienai paieškai');
T(/function ctPerbranguLangas\(r\)/.test(html), 'yra „per didelė paieška" langas');
T(/class="ct-portals" style="--cols:3"/.test(html), 'langas naudoja dizaino sistemos `.ct-portals` (46 sk.)');
T(/<b data-k="pra\\u0161yta">/.test(html) && /<b data-k="galima">/.test(html), 'skaičiai turi `data-k` – telefone jie virsta etiketėmis');

// Stabdžio sustabdyta paieška negali nurašyti vartotojo paieškos iš plano.
const planai = fs.readFileSync(path.join(__dirname, '..', 'planai.js'), 'utf8');
T(/function grazintiPaieska\(userId\)/.test(planai), 'planai.js moka grąžinti paiešką');
T(/if \(r\.perbrangu\) planai\.grazintiPaieska\(userId\)/.test(src), 'nepaleista paieška grąžinama į plano limitą');
T(/busena: r\.perbrangu \? 'nepaleista'/.test(src), 'žurnale tokia paieška pažymima „nepaleista"');
T(!/ kr\.<\/b>/.test(html.slice(html.indexOf('function ctPerbranguLangas'), html.indexOf('function ctPerbranguLangas') + 4000)), 'lange nerodomi ScraperAPI kreditai');

// ── Kiekis prieš paiešką (Luko prašymas 09-24) ───────────────────────
T(/<span id="ct-kiekis" hidden/.test(html), 'yra vieta kiekiui prie mygtuko, iš pradžių paslėpta');
T(/function ctKiekioImti\(\)/.test(html), 'yra kiekio skaičiavimo funkcija');
T(/setTimeout\(ctKiekioImti, 900\)/.test(html), 'skaičiuojama tik praėjus 0,9 s po paskutinio pakeitimo');
T(/_ctKiekPodelis\[raktas\]/.test(html), 'tie patys filtrai antrą kartą imami iš atminties');
T(/'portal-autoplius', 'portal-autogidas'/.test(html), 'portalų varnelės taip pat perskaičiuoja kiekį');
T(!/DOMContentLoaded', function \(\) \{\s*ctKiekioImti/.test(html), 'įkeliant puslapį kiekis NESKAIČIUOJAMAS (kreditai)');

console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
