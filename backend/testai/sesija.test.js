// sesija.test.js — A-4, C-1, C-4 sargai (revizija 2026-09-20, v1.98.0).
//
// PALEIDIMAS: siems testams reikia backend priklausomybiu, kuriu repozitorijoje
// nera (serveris sukasi tik Railway). Paleidziama aplinkoje, kur jos yra:
//
//     cd backend && npm i jsonwebtoken bcryptjs better-sqlite3 && node testai/sesija.test.js
//
// Testas pats susikuria laikina DB (DB_PATH) - tikros neliecia.
// Trunka ~30 s: bcrypt 12 raundu yra brangus TYCIA.

process.env.DB_PATH = __dirname + "/.sesija-test.db";
process.env.JWT_SECRET = 'bandomasis-raktas-bent-32-simboliu-ilgio!!';
process.env.INVITE_CODES = 'TESTAS';
const A = require('./auth.js');

function req(body, ip) { return { body, headers: { 'x-forwarded-for': ip || '1.2.3.4' }, ip: ip || '1.2.3.4' }; }
function res() { const o = { code: 200, data: null };
  o.status = (c) => { o.code = c; return o; }; o.json = (d) => { o.data = d; return o; };
  o.headersSent = false; return o; }
const call = async (fn, body, ip) => { const r = res(); await fn(req(body, ip), r, () => {}); return r; };

(async () => {
  let blogai = 0;
  const T = (s, ok, det) => { if (!ok) blogai++; console.log((ok?'  ok   ':'BLOGAI ') + s + (det!==undefined?('  ['+JSON.stringify(det)+']'):'')); };

  console.log('\n-- A-4 el. pasto registras --');
  let r = await call(A.handleRegister, { email: '  Lukas@Pavyzdys.LT ', password: 'slaptas123', invite_code: 'TESTAS' });
  T('registracija su didziosiomis ir tarpais praeina', r.code === 200, r.data && r.data.email);
  T('atsakyme el. pastas normalizuotas', r.data && r.data.email === 'lukas@pavyzdys.lt', r.data && r.data.email);

  for (const v of ['lukas@pavyzdys.lt', 'LUKAS@PAVYZDYS.LT', ' Lukas@Pavyzdys.lt ']) {
    r = await call(A.handleLogin, { email: v, password: 'slaptas123' }, '9.9.9.' + Math.floor(Math.random()*250));
    T('prisijungimas su "' + v.trim() + '"', r.code === 200, r.code);
  }

  r = await call(A.handleRegister, { email: 'LUKAS@pavyzdys.lt', password: 'kitas12345', invite_code: 'TESTAS' });
  T('antra registracija tuo paciu adresu kitu registru ATMETAMA', r.code === 400, r.data);

  console.log('\n-- C-1 bandymu riba --');
  const IP = '5.5.5.5';
  for (let i = 1; i <= 5; i++) {
    r = await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'blogas' }, IP);
    T('nepavykes bandymas ' + i + ' -> 401', r.code === 401, r.code);
  }
  r = await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'blogas' }, IP);
  T('sestas -> 429', r.code === 429, r.data);
  r = await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'slaptas123' }, IP);
  T('teisingas slaptazodis uzblokuotam irgi -> 429', r.code === 429, r.code);

  r = await call(A.handleLogin, { email: 'kitas@pavyzdys.lt', password: 'betkoks' }, '6.6.6.6');
  T('kitas IP + kitas el. pastas nepaliestas -> 401', r.code === 401, r.code);
  r = await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'slaptas123' }, '6.6.6.7');
  T('SVARBIAUSIA: uzblokavus is 5.5.5.5, savininkas is kito IP prisijungia', r.code === 200, r.code);

  console.log('\n-- C-1 sekme israso skaitliuka --');
  const IP2 = '7.7.7.7';
  for (let i = 0; i < 4; i++) await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'blogas' }, IP2);
  r = await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'slaptas123' }, IP2);
  T('po 4 klaidu teisingas slaptazodis praeina', r.code === 200, r.code);
  for (let i = 0; i < 5; i++) r = await call(A.handleLogin, { email: 'lukas@pavyzdys.lt', password: 'blogas' }, IP2);
  T('skaitliukas isvalytas: penktas po sekmes dar 401', r.code === 401, r.code);

  console.log('\n-- C-4 laiko kanalas --');
  const matuok = async (el) => { const t = process.hrtime.bigint();
    await call(A.handleLogin, { email: el, password: 'blogas' }, '8.8.8.' + Math.floor(Math.random()*250));
    return Number(process.hrtime.bigint() - t) / 1e6; };
  const e = [], n = [];
  for (let i = 0; i < 6; i++) { e.push(await matuok('lukas@pavyzdys.lt')); n.push(await matuok('nera' + i + '@pavyzdys.lt')); }
  const vid = a => a.reduce((x,y)=>x+y,0)/a.length;
  const a = vid(e), b = vid(n), sk = Math.abs(a-b)/Math.max(a,b)*100;
  console.log('  esamas ' + a.toFixed(1) + ' ms   nesamas ' + b.toFixed(1) + ' ms   skirtumas ' + sk.toFixed(1) + ' %');
  T('skirtumas < 25 %', sk < 25, sk.toFixed(1) + '%');

  console.log('\n-- C-4 senas 10 raundu vartotojas --');
  const bcrypt = require('bcryptjs'), Database = require('better-sqlite3');
  const d = new Database(process.env.DB_PATH);
  d.prepare('INSERT INTO users (email, hashed_password) VALUES (?, ?)')
   .run('senas@pavyzdys.lt', bcrypt.hashSync('senas12345', 10));
  const raundaiPries = bcrypt.getRounds(d.prepare('SELECT hashed_password h FROM users WHERE email=?').get('senas@pavyzdys.lt').h);
  T('ideta paskyra su 10 raundu', raundaiPries === 10, raundaiPries);
  const e2 = [], n2 = [];
  for (let i = 0; i < 5; i++) { e2.push(await matuok('senas@pavyzdys.lt')); n2.push(await matuok('nerax' + i + '@pavyzdys.lt')); }
  const a2 = vid(e2), b2 = vid(n2), sk2 = Math.abs(a2-b2)/Math.max(a2,b2)*100;
  console.log('  PRIES perrasyma: senas ' + a2.toFixed(1) + ' ms   nesamas ' + b2.toFixed(1) + ' ms   skirtumas ' + sk2.toFixed(1) + ' %');
  r = await call(A.handleLogin, { email: 'senas@pavyzdys.lt', password: 'senas12345' }, '3.3.3.3');
  T('senas vartotojas prisijungia', r.code === 200, r.code);
  const raundaiPo = bcrypt.getRounds(d.prepare('SELECT hashed_password h FROM users WHERE email=?').get('senas@pavyzdys.lt').h);
  T('maisa perrasyta i 12 raundu', raundaiPo === 12, raundaiPo);
  r = await call(A.handleLogin, { email: 'senas@pavyzdys.lt', password: 'senas12345' }, '3.3.3.4');
  T('po perrasymo vis dar prisijungia tuo paciu slaptazodziu', r.code === 200, r.code);
  const e3 = [], n3 = [];
  for (let i = 0; i < 5; i++) { e3.push(await matuok('senas@pavyzdys.lt')); n3.push(await matuok('nerey' + i + '@pavyzdys.lt')); }
  const a3 = vid(e3), b3 = vid(n3), sk3 = Math.abs(a3-b3)/Math.max(a3,b3)*100;
  console.log('  PO perrasymo:    senas ' + a3.toFixed(1) + ' ms   nesamas ' + b3.toFixed(1) + ' ms   skirtumas ' + sk3.toFixed(1) + ' %');
  T('po perrasymo skirtumas < 25 %', sk3 < 25, sk3.toFixed(1) + '%');

  console.log('\n' + (blogai ? 'KLAIDU: ' + blogai : 'VISI PRAEJO'));
  process.exit(blogai ? 1 : 0);
})();
