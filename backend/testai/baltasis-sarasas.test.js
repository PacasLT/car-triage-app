// Sargas: baltojo saraso spastai.
//
// KODEL SIS FAILAS YRA. `allListingsBase` (server.js) yra BALTASIS SARASAS -
// laukas, kurio jame nera, iki sasajos nenukeliauja, net jei `enriched` ji turi.
// Tie patys spastai per ta pati vieta suveike SEPTYNIS kartus:
//   v2.18.1 rinka/kaina · v2.23.1 dienosRinkoje · v2.25.0 pigumas
//   v2.27.7 (Z-177) · v2.28.4 (Z-182) · v2.29.0 (Z-184) · v2.29.1 (Z-185)
// ir astuntas - auditas 2026-10-28: `baloKomponentai` ir 9 kiti laukai, del
// kuriu „Kiti skelbimai" rode kita bala, nei apskaiciavo serveris.
//
// Sis sargas nebeleidzia pridèti lauko, kuri frontendas SKAITO, bet baltasis
// sarasas nepraleidzia. Jis tyčia nelyginamas su visu `enriched` - dalis lauku
// sąmoningai nesaugoma (zr. `rinka.NESAUGOMA`).
const fs = require('fs');
const path = require('path');

const SAKNIS = path.join(__dirname, '..', '..');
const srv = fs.readFileSync(path.join(SAKNIS, 'backend', 'server.js'), 'utf8');

// Baltojo saraso laukai
const nuo = srv.indexOf('const allListingsBase');
if (nuo < 0) throw new Error('nerastas allListingsBase');
const blokas = srv.slice(nuo, srv.indexOf('}));', nuo));
// Ne `^\s*` - keli laukai rasomi vienoje eileje (`kuras: l.kuras, turiVin: l.turiVin`),
// ir anksciau toks sargas butu praleides visus, isskyrus pirma eiles lauka.
const BALTAS = new Set([...blokas.matchAll(/(?:^|[,{]\s*|\s)([A-Za-z_][\w]*)\s*:/gm)].map((m) => m[1]));

// Laukai, kuriuos frontendas skaito nuo skelbimo objekto (`c.` arba `l.`)
const fe = ['index.html', 'detail.html', 'compare.html', 'megstamiausi.html', 'perpardavejas.js']
  .map((f) => { try { return fs.readFileSync(path.join(SAKNIS, 'frontend', f), 'utf8'); } catch (e) { return ''; } })
  .join('\n');

// Tikrinam konkrecius laukus, kurie jau buvo pamesti arba kuriuos balas naudoja.
// Sarasas aiskus ir trumpas sąmoningai: platus regex gaudo melingus radinius.
const PRIVALOMI = [
  'qualityScore', 'baloKomponentai', 'diffPct', 'ridaDiffPct', 'ridaMedian',
  'turiVin', 'turiIstorijosAtaskaita', 'garantijosTipas', 'yraVerslas',
  'marketMedian', 'marketCount', 'kainuKreive', 'pigumas', 'dienosRinkoje',
  'rinka', 'kainaLt', 'rinkosGrupe', 'kartos', 'regitra',
];

let klaidu = 0;
for (const laukas of PRIVALOMI) {
  if (!BALTAS.has(laukas)) {
    console.error(`✗ BALTASIS SARASAS: frontendas naudoja \`${laukas}\`, bet allListingsBase jo nepraleidzia`);
    klaidu++;
  }
}

// `ctScore` atsargine formule: jei `baloKomponentai` nepraleistas, ji skaiciuoja
// is nieko (istorija visada 5,0, rida 6,5). Tikrinam, kad VISI jos skaitomi
// laukai butu baltajame sarase - kitaip atsargine formule tyliai meluoja.
const ATSARGINE = ['diffPct', 'ridaDiffPct', 'turiVin', 'turiIstorijosAtaskaita', 'garantijosTipas', 'yraVerslas'];
for (const laukas of ATSARGINE) {
  if (!BALTAS.has(laukas)) {
    console.error(`✗ ctScore atsargine formule skaito \`${laukas}\`, o baltasis sarasas jo neduoda`);
    klaidu++;
  }
}

// Ar frontendas tikrai skaito tai, ka sargas gina (kad sargas nesenetu tyliai)
for (const laukas of ['baloKomponentai', 'ridaDiffPct', 'garantijosTipas', 'yraVerslas']) {
  if (!new RegExp(`[.\\['"]${laukas}\\b`).test(fe)) {
    console.error(`✗ sargas gina \`${laukas}\`, bet frontendas jo nebeskaito - sarasa reikia atnaujinti`);
    klaidu++;
  }
}

if (klaidu) { console.error(`\n${klaidu} klaida(os)`); process.exit(1); }
console.log('✓ baltasis-sarasas: ' + (PRIVALOMI.length + ATSARGINE.length + 4) + ' patikros');
