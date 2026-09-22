// paskyra.test.js — v2.11.0: paieškų žurnalas, užklausos, slaptažodis, eksportas.
//     node backend/testai/paskyra.test.js
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const P = require(path.join(__dirname, '..', 'paskyra.js'));
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

const db = new Database(':memory:');
db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, hashed_password TEXT, created_at TEXT, plan TEXT, plan_iki TEXT,
  kreditai_plano INTEGER, kreditai_pirkti INTEGER, paieskos_menesi INTEGER, paieskos_viso INTEGER);
  CREATE TABLE kreditu_zurnalas (user_id INTEGER, laikas INTEGER, veiksmas TEXT, raktas TEXT, kiekis INTEGER, likutis_po INTEGER, pastaba TEXT);
  CREATE TABLE megstamiausi (user_id INTEGER, url TEXT, prideta INTEGER);
  CREATE TABLE ataskaitos (id INTEGER PRIMARY KEY, user_id INTEGER, tipas TEXT, raktas TEXT, pavadinimas TEXT, santrauka TEXT, laikas INTEGER, duomenys TEXT);`);
db.prepare('INSERT INTO users (id, email, hashed_password) VALUES (1, ?, ?)').run('a@b.lt', bcrypt.hashSync('senas-slapt', 4));
db.prepare('INSERT INTO users (id, email, hashed_password) VALUES (2, ?, ?)').run('c@d.lt', bcrypt.hashSync('x', 4));
P.prijungti(db);

(async () => {
  console.log('\nPaieškų žurnalas');
  P.irasytiPaieska(1, { marke: 'BMW', modelis: 'X5', metaiNuo: '2019', metaiIki: '2024', portals: ['autoplius', 'blogas', 'otomoto'], kuras: 'dyzelinas', obj: { a: 1 } },
    { busena: 'done', rasta: 240, kandidatai: 60, scraperKr: 12, trukmeMs: 9000 });
  P.irasytiPaieska(2, { marke: 'Audi' }, { busena: 'done', rasta: 5 });
  const s = P.paieskos(1);
  T(s.length === 1 && s[0].marke === 'BMW' && s[0].metaiNuo === 2019, 'įrašyta ir grąžinta tik savo');
  T(s[0].portalai.join(',') === 'autoplius,otomoto', 'nežinomi portalai atmesti');
  T(s[0].filtrai.kuras === 'dyzelinas' && !('obj' in s[0].filtrai), 'filtrai kartojimui be objektų');
  T(s[0].rasta === 240 && s[0].scraperKr === 12, 'rasta ir kreditai');
  T(P.paieskuSkaicius(1) === 1, 'skaičius');

  console.log('\nAdmin paieškų žurnalas (Finansininkui)');
  const visos = P.visosPaieskos(10);
  T(visos.length === 2 && visos[0].email && visos.some((x) => x.email === 'c@d.lt'), 'admin mato visų vartotojų paieškas su el. paštu');
  const sant = P.paieskuSantrauka();
  T(sant.viso === 2 && sant.kr_viso === 12, 'santrauka: 2 paieškos, 12 ScraperAPI kr.');
  T(sant.tikslus === 2, 'pažymėta, kiek įrašų su tiksliu kreditų skaičiumi');

  console.log('\nUžklausos');
  const u1 = P.naujaUzklausa(1, 'planas', 'pro');
  T(u1.id && !u1.jau, 'nauja užklausa');
  T(P.naujaUzklausa(1, 'planas', 'pro').jau === true, 'ta pati – nesidubliuoja');
  let klaida = null; try { P.naujaUzklausa(1, 'planas', 'admin'); } catch (e) { klaida = e.message; }
  T(!!klaida, 'neleistinas planas atmetamas');
  T(P.visosUzklausos('laukia').length === 1 && P.visosUzklausos('laukia')[0].email === 'a@b.lt', 'admin mato su el. paštu');
  T(P.uzdarytiUzklausa(u1.id, 'priskirta', 'admin@x') && !P.uzdarytiUzklausa(u1.id, 'atmesta', 'admin@x'), 'uždaroma vieną kartą');

  console.log('\nSlaptažodis');
  klaida = null; try { await P.keistiSlaptazodi(1, 'blogas', 'naujas-slapt'); } catch (e) { klaida = e; }
  T(klaida && klaida.kodas === 400, 'blogas dabartinis → 400');
  klaida = null; try { await P.keistiSlaptazodi(1, 'senas-slapt', 'trump'); } catch (e) { klaida = e; }
  T(klaida && klaida.kodas === 400, 'per trumpas → 400');
  await P.keistiSlaptazodi(1, 'senas-slapt', 'naujas-slapt');
  T(bcrypt.compareSync('naujas-slapt', db.prepare('SELECT hashed_password h FROM users WHERE id=1').get().h), 'pakeistas');

  console.log('\nEksportas');
  const e = P.eksportas(1);
  T(e.paskyra.email === 'a@b.lt' && !('hashed_password' in e.paskyra), 'be slaptažodžio maišos');
  T(e.paieskos.length === 1 && e.uzklausos.length === 1, 'paieškos ir užklausos – tik savo');

  console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
  process.exit(klaidu ? 1 : 0);
})();
