#!/usr/bin/env node
// tools/klaidos.js - klaidu pranesimu sarasas is produkcijos i terminala.
//
// Kam: klaidu sarasa turi matyti ne tik zmogus narsykleje, bet ir Claude, kuris
// tas klaidas taiso. Per ekranvaizdzius keliauja tekstas, o dingsta butent tai,
// kas brangiausia - selektoriai, nepavykusios uzklausos ir paspaudimu seka.
//
// Naudojimas:
//   node tools/klaidos.js              visos atviros, trumpai
//   node tools/klaidos.js 12           vienas pranesimas su visa diagnostika
//   node tools/klaidos.js 12 tvarkoma  busenos keitimas
//   node tools/klaidos.js --visi       ir uzdarytos
//   node tools/klaidos.js --atsarga    nuskaitymo keliu matavimai
//
// Paslaptys: `backend/.env`, laukai CT_URL ir KLAIDU_RAKTAS. Raktas niekada
// nespausdinamas ir niekada nededamas i adresa - tik antrasteje.

const fs = require('fs');
const path = require('path');

const ENV = path.join(__dirname, '..', 'backend', '.env');
function skaitytiEnv() {
  let t = '';
  try { t = fs.readFileSync(ENV, 'utf8'); }
  catch (e) { mirti('Nerandu backend/.env. Jame turi buti CT_URL ir KLAIDU_RAKTAS.'); }
  const o = {};
  t.split(/\r?\n/).forEach((eil) => {
    const m = eil.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  return o;
}
function mirti(z) { console.error('\n  ' + z + '\n'); process.exit(1); }

const env = skaitytiEnv();
const URL_ = (env.CT_URL || '').replace(/\/+$/, '');
const RAKTAS = env.KLAIDU_RAKTAS || '';
if (!URL_) mirti('backend/.env truksta CT_URL (pvz. CT_URL=https://mano-app.up.railway.app)');
if (RAKTAS.length < 32) mirti('backend/.env truksta KLAIDU_RAKTAS arba jis trumpesnis nei 32 simboliai.');

async function kviesti(kelias, metodas, kunas) {
  const r = await fetch(URL_ + kelias, {
    method: metodas || 'GET',
    headers: Object.assign({ 'X-Klaidu-Raktas': RAKTAS }, kunas ? { 'Content-Type': 'application/json' } : {}),
    body: kunas ? JSON.stringify(kunas) : undefined,
  });
  const t = await r.text();
  if (r.status === 401) mirti('401. Raktas nesutampa su tuo, kuris Railway Variables, arba serveris dar neperkrautas.');
  if (!r.ok) mirti('HTTP ' + r.status + ': ' + t.slice(0, 200));
  try { return JSON.parse(t); } catch (e) { mirti('Atsakymas ne JSON: ' + t.slice(0, 200)); }
}

const laikas = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ');
const ZENKLAS = { blokuoja: '!!', trukdo: '! ', smulkme: '  ' };

function trumpai(d) {
  console.log('\n  ' + URL_);
  console.log('  Is viso ' + d.viso + ' | atviru ' + d.atviru + ' | laukia jusu ' + d.lauksiaJusu + '\n');
  if (!d.irasai.length) return console.log('  (tuscia)\n');
  d.irasai.forEach((k) => {
    console.log('  ' + (ZENKLAS[k.svarba] || '  ') + ' #' + k.nr + '  ' + laikas(k.laikas)
      + '  ' + String(k.busena).padEnd(16) + k.kategorija + (k.kartojasi ? ' (kartojasi)' : ''));
    console.log('        ' + k.tekstas.replace(/\s+/g, ' ').slice(0, 96));
    if (k.turejoRodyti) console.log('        turejo rodyti: ' + k.turejoRodyti.slice(0, 96));
  });
  console.log('\n  Detales: node tools/klaidos.js <nr>\n');
}

function vienas(k) {
  const g = k.diagnostika || {};
  console.log('\n  #' + k.nr + '  ' + k.busena + '  ' + k.svarba + '  ' + k.kategorija
    + (k.kartojasi ? '  KARTOJASI' : ''));
  console.log('  ' + laikas(k.laikas) + '  ' + (k.kas || 'neprisijunges') + (k.foto ? '  [su nuotrauka]' : ''));
  console.log('\n  ' + k.tekstas);
  if (k.turejoRodyti) console.log('\n  Turejo rodyti: ' + k.turejoRodyti);
  console.log('\n  ' + (g.puslapis || '?') + '  v' + (g.versija || '?')
    + '  ' + ((g.ekranas || {}).plotis || '?') + 'x' + ((g.ekranas || {}).aukstis || '?')
    + '  ' + (g.planas || '?'));
  if (g.narsykle) console.log('  ' + String(g.narsykle).slice(0, 110));
  if ((g.veiksmai || []).length) {
    console.log('\n  Ka spaude pries tai:');
    g.veiksmai.forEach((v) => console.log('    ' + String(v.tekstas || '').padEnd(22) + (v.elementas || '')));
  }
  if ((g.klaidos || []).length) {
    console.log('\n  JS klaidos:');
    g.klaidos.forEach((x) => console.log('    ' + x.zinute + (x.failas ? '   (' + x.failas + ':' + x.eilute + ')' : '')));
  }
  if ((g.uzklausos || []).length) {
    console.log('\n  Nepavykusios uzklausos:');
    g.uzklausos.forEach((x) => console.log('    ' + x.kodas + '  ' + x.adresas));
  }
  if ((k.istorija || []).length) console.log('\n  Kelias: ' + k.istorija.map((x) => x.busena).join(' -> '));
  if (k.foto) console.log('\n  Nuotrauka: ' + URL_ + '/admin/klaidos/' + k.nr + '/foto  (reikia antrastes)');
  console.log('');
}

(async () => {
  const a = process.argv.slice(2);
  if (a[0] === '--atsarga') return console.log(JSON.stringify(await kviesti('/admin/atsarga'), null, 1));
  if (a[0] === '--visi') return trumpai(await kviesti('/admin/klaidos?visi=1&trumpai=1'));
  if (/^\d+$/.test(a[0] || '')) {
    if (a[1]) {
      const r = await kviesti('/admin/klaidos/' + a[0] + '/busena', 'POST',
        { busena: a[1], pastaba: a.slice(2).join(' ') || null });
      return console.log('\n  #' + r.nr + ' -> ' + r.busena + '   (' + r.kelias + ')   atviru: ' + r.atviru + '\n');
    }
    const d = await kviesti('/admin/klaidos?visi=1');
    const k = d.irasai.find((x) => x.nr === parseInt(a[0], 10));
    return k ? vienas(k) : mirti('Nr. ' + a[0] + ' nerastas.');
  }
  trumpai(await kviesti('/admin/klaidos?trumpai=1'));
})();
