// klaidu-atsakai.test.js — kurios klaidos NĖRA serverio klaidos (v2.28.1).
//
//     node backend/testai/klaidu-atsakai.test.js
//
// Kodėl sargas: Luko klaida Nr.52. Įklijavus mobile.de nuorodą vartotojas gavo
// HTTP 500 su tekstu „mobile.de skelbimo puslapis neprieinamas (apsauga)" –
// techniniu, ir atrodančiu kaip mūsų avarija. Du dalykai, kurie čia gali tyliai
// sulūžti: (1) kodas vėl pradės grįžti kaip 500; (2) statusas nukris žemiau 500
// ir NEBEGRĄŽINS kredito (`planai.js`: grąžina kai >=500 arba 410), o tekstas
// vartotojui vis tiek sakys „kreditų nenurašėme" – tai būtų meluojantis tekstas.
const K = require('../klaidu-atsakai');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };
const a = (kodas, message) => K.atsakas(Object.assign(new Error(message || 'x'), kodas ? { kodas } : {}));

// ── mobile.de apsauga: ne 500, bet vis tiek grąžina kreditą ────────────────
{
  const r = a('MOBILEDE_NEPRIEINAMA', 'mobile.de skelbimo puslapis neprieinamas (apsauga)');
  T(r.status === 503, 'MOBILEDE_NEPRIEINAMA → 503, ne 500 (gauta: ' + r.status + ')');
  T(r.status >= 500, 'statusas >= 500, tad planai.js grąžina kreditą');
  T(r.kunas.laikina === true, 'pažymėta kaip laikina');
  T(r.kunas.portalas === 'mobile.de', 'pasakyta, kuris portalas');
  T(/nenurašėme/.test(r.kunas.error), 'pasakyta, kad kreditų nenurašėme');
  T(/autoplius/.test(r.kunas.error) && /autogidas/.test(r.kunas.error),
    'pasakyta, ką galima daryti vietoj to');
  T(!/skelbimo puslapis neprieinamas/.test(r.kunas.error),
    'vidinis techninis tekstas nebepersiduoda vartotojui');
  T(!/Error|undefined|null/.test(r.kunas.error), 'be techninių žodžių');
  T(r.kunas.kodas === 'MOBILEDE_NEPRIEINAMA', 'kodas grąžinamas sąsajai');
}
{
  const r = a('MOBILEDE_ISJUNGTA');
  T(r.status === 503 && r.kunas.laikina === true, 'MOBILEDE_ISJUNGTA → 503, laikina');
  T(/nenurašėme/.test(r.kunas.error), 'ir čia pasakyta apie kreditus');
}

// ── Ištrintas skelbimas: 410, ne laikina ───────────────────────────────────
{
  const r = a('SKELBIMAS_NERASTAS');
  T(r.status === 410, 'SKELBIMAS_NERASTAS → 410');
  T(r.kunas.laikina === undefined, 'ne laikina – skelbimo tikrai nebėra');
  T(/parduotas|ištrintas/.test(r.kunas.error), 'pasakyta, kodėl');
  T(r.status === 410, 'planai.js grąžina kreditą ir esant 410');
}

// ── Neleistinas portalas: vartotojo įvesties klaida, 400 ───────────────────
{
  const r = a('PORTALAS_NELEIDZIAMAS');
  T(r.status === 400, 'PORTALAS_NELEIDZIAMAS → 400');
  T(r.status < 500 && r.status !== 410, 'kreditas NEgrąžinamas – nieko nenuskaitėm');
  T(/autoplius/.test(r.kunas.error), 'išvardinti palaikomi portalai');
}

// ── Nežinoma klaida: 500 ir trumpas tekstas ────────────────────────────────
{
  const r = a(null, 'Cannot read properties of undefined (reading "kaina")');
  T(r.status === 500, 'nežinomas kodas → 500');
  T(r.kunas.kodas === null, 'kodo nėra');
  T(r.kunas.error.length <= 200, 'tekstas nukirptas iki 200 simbolių');
  const ilgas = a(null, 'x'.repeat(500));
  T(ilgas.kunas.error.length === 200, 'labai ilgas tekstas nukirptas');
  T(a('NEZINOMAS_KODAS').status === 500, 'neatpažintas kodas → 500');
  T(K.atsakas(null).status === 500 && typeof K.atsakas(null).kunas.error === 'string',
    'null klaida nenukrenta');
  T(K.atsakas({}).status === 500, 'tuščias objektas nenukrenta');
}

// ── Visi žinomi kodai turi tekstą ir prasmingą statusą ─────────────────────
{
  let ok = 0;
  const kodai = Object.keys(K.ZINOMI);
  kodai.forEach((kd) => {
    const r = a(kd);
    const geras = typeof r.kunas.error === 'string' && r.kunas.error.length > 20
      && r.status >= 400 && r.status < 600
      && !/^[a-z_]+$/.test(r.kunas.error);
    if (geras) ok++; else console.log('      ↳ ' + kd + ': ' + JSON.stringify(r));
    // Laikina busena privalo grazinti kredita - kitaip tekstas apie kreditus melas
    if (r.kunas.laikina) {
      const g = r.status >= 500 || r.status === 410;
      if (!g) { console.log('      ↳ ' + kd + ' laikina, bet kreditas negrąžinamas!'); ok--; }
    }
  });
  T(ok === kodai.length, 'visi ' + kodai.length + ' žinomi kodai turi žmogišką tekstą (gauta: ' + ok + ')');
  T(kodai.every((kd) => !/kreditų nenurašėme/i.test(K.ZINOMI[kd].error) || K.ZINOMI[kd].status >= 500
    || K.ZINOMI[kd].status === 410), 'nė vienas tekstas nemeluoja apie kreditus');
}

console.log('\nklaidu-atsakai: ' + (n - klaidu) + '/' + n + ' ok' + (klaidu ? ', ' + klaidu + ' BLOGAI' : ''));
process.exit(klaidu ? 1 : 0);
