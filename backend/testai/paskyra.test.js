// paskyra.test.js — v2.11.5: paieškų žurnalas, užklausos, slaptažodis, eksportas,
//     eksporto riba, paskyros ištrynimas, automatinis valymas (TS §5).
//     node backend/testai/paskyra.test.js
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const P = require(path.join(__dirname, '..', 'paskyra.js'));
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };

const db = new Database(':memory:');
db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, hashed_password TEXT, created_at TEXT, plan TEXT, plan_iki TEXT,
  kreditai_plano INTEGER, kreditai_pirkti INTEGER, paieskos_menesi INTEGER, paieskos_viso INTEGER, paskutinis_prisijungimas INTEGER, trynimo_data INTEGER);
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

  console.log('\nSlaptažodžio patikra (prieš ištrynimą)');
  klaida = null; try { await P.patikrintiSlaptazodi(1, 'blogas'); } catch (er) { klaida = er; }
  T(klaida && klaida.kodas === 400, 'blogas slaptažodis → 400');
  T(await P.patikrintiSlaptazodi(1, 'naujas-slapt'), 'teisingas praeina');

  console.log('\nEksportas');
  db.prepare("UPDATE users SET created_at = '2026-01-05', paskutinis_prisijungimas = 1758500000000 WHERE id = 1").run();
  db.prepare("INSERT INTO kreditu_zurnalas (user_id, laikas, veiksmas, raktas, kiekis, likutis_po, pastaba) VALUES (1, ?, 'planas', 'pro', 100, 100, 'admin')").run(Date.now());
  db.prepare("INSERT INTO kreditu_zurnalas (user_id, laikas, veiksmas, raktas, kiekis, likutis_po, pastaba) VALUES (1, ?, 'paieska', 'bmw', -3, 97, NULL)").run(Date.now());
  const e = P.eksportas(1, { klaidos: [{ nr: 7, tekstas: 'neveikia' }] });
  T(e.paskyra.email === 'a@b.lt' && !('hashed_password' in e.paskyra), 'be slaptažodžio maišos');
  T(e.paieskos.length === 1 && e.uzklausos.length === 1, 'paieškos ir užklausos – tik savo');
  T(!!e.apie && /BDAR/.test(e.apie.kas) && 'privatumoPolitika' in e.apie, 'TS §5.1 c: paaiškinimas ir nuoroda į politiką');
  T(e.paskyra.sukurta === '2026-01-05' && e.paskyra.paskutinisPrisijungimas === 1758500000000, 'TS §5.1 b: registracija ir paskutinis prisijungimas');
  T(e.planoIstorija.length === 1 && e.kredituZurnalas.length === 2, 'plano istorija atskirai, visas kreditų žurnalas');
  T(e.klaiduPranesimai.length === 1 && e.klaiduPranesimai[0].nr === 7, 'TS §5.1 a: vartotojo klaidų pranešimai');

  console.log('\nEksporto riba (1 per 24 val.)');
  T(P.arGalimaEksportuoti(1).galima === true, 'pirmas kartas – galima');
  P.zymetiEksporta(1);
  const rib = P.arGalimaEksportuoti(1);
  T(rib.galima === false && rib.kitas > Date.now(), 'antras iš karto – negalima, rodo kada');
  T(P.arGalimaEksportuoti(2).galima === true, 'kito vartotojo riba nepaliesta');
  db.prepare('UPDATE eksporto_zurnalas SET paskutinis = ? WHERE user_id = 1').run(Date.now() - P.EKSPORTO_TARPAS_MS - 1000);
  T(P.arGalimaEksportuoti(1).galima === true, 'po 24 val. – vėl galima');

  console.log('\nAutomatinis valymas (12 mėn.)');
  db.prepare("INSERT INTO paieskos_zurnalas (user_id, laikas, marke, busena) VALUES (1, ?, 'Seat', 'done')").run(Date.now() - 400 * 24 * 3600 * 1000);
  const v = P.valymas();
  T(v.paieskos === 1 && P.paieskos(1).length === 1, 'senesnė nei 12 mėn. paieška nuasmeninta, naujesnė lieka');
  T(db.prepare('SELECT COUNT(*) c FROM paieskos_zurnalas WHERE user_id = 0').get().c === 1, 'nuasmeninta į user_id = 0, įrašas neištrintas');

  console.log('\n7 d. užšaldymas (TS-0922-1900)');
  T(P.trynimoBusena(1) === null, 'iš pradžių nepažymėta');
  klaida = null; try { await P.pazymetiTrynimui(1, 'blogas'); } catch (er) { klaida = er; }
  T(klaida && klaida.kodas === 400, 'be teisingo slaptažodžio nepažymima');
  const pz = await P.pazymetiTrynimui(1, 'naujas-slapt');
  T(pz.ivyks - pz.pazymeta === P.UZSALDYMAS_MS && P.UZSALDYMAS_MS === 7 * 24 * 3600 * 1000, 'ištrinama po 7 d.');
  T(P.trynimoBusena(1).ivyks === pz.ivyks, 'būsena rodoma paskyroje');
  T(P.laukiantysIstrynimo().length === 0, 'iškart netrinama');
  T(P.atsauktiTrynima(1) && P.trynimoBusena(1) === null, 'galima persigalvoti');
  await P.pazymetiTrynimui(1, 'naujas-slapt');
  db.prepare('UPDATE users SET trynimo_data = ? WHERE id = 1').run(Date.now() - P.UZSALDYMAS_MS - 1000);
  const lauk = P.laukiantysIstrynimo();
  T(lauk.length === 1 && lauk[0].id === 1 && lauk[0].email === 'a@b.lt', 'po 7 d. patenka į trynimo sąrašą');

  console.log('\nPaskyros ištrynimas (TS §5.2)');
  db.prepare("INSERT INTO megstamiausi (user_id, url, prideta) VALUES (1, 'x', 1)").run();
  const rez = P.istrintiPaskyra(1);
  T(rez.istrinta.users === 1 && rez.istrinta.megstamiausi === 1, 'paskyra ir mėgstamiausi ištrinti');
  T(rez.nuasmeninta.paieskos_zurnalas === 1 && rez.nuasmeninta.kreditu_zurnalas === 2, 'žurnalai nuasmeninti, ne ištrinti');
  T(db.prepare('SELECT COUNT(*) c FROM users WHERE id = 1').get().c === 0, 'users įrašo nebėra');
  T(db.prepare('SELECT COUNT(*) c FROM paieskos_zurnalas').get().c === 3, 'apskaitai skaičiai lieka');
  T(db.prepare('SELECT COUNT(*) c FROM paskyros_uzklausos WHERE user_id = 1').get().c === 0, 'užklausos nebesusietos su žmogumi');
  T(db.prepare('SELECT COUNT(*) c FROM eksporto_zurnalas WHERE user_id = 1').get().c === 0, 'eksporto žurnalas ištrintas');
  T(P.paieskos(2).length === 1, 'kito vartotojo duomenys nepaliesti');

  console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
  process.exit(klaidu ? 1 : 0);
})();
