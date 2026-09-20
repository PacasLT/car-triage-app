// migracija.test.js — A-4 migracijos sargas (v1.98.0).
//
// Tikrina DU dalykus, ir antrasis svarbesnis: kad migracija, radusi dvi
// paskyras, kurios skiriasi TIK registru, NEDARYTU NIEKO ir nesugadintu
// duomenu. Ji suveiks pries tikra duomenu baze per artimiausia deploy'a.
//
//     cd backend && node testai/migracija.test.js

const path = require('path'), fs = require('fs');
const Database = require('better-sqlite3'), bcrypt = require('bcryptjs');
let blogai = 0;
const T = (s, ok, d) => { if (!ok) blogai++; console.log((ok?'  ok   ':'BLOGAI ')+s+(d!==undefined?('  ['+JSON.stringify(d)+']'):'')); };

function paruosti(db_, irasai) {
  if (fs.existsSync(db_)) fs.unlinkSync(db_);
  const d = new Database(db_);
  d.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`);
  irasai.forEach(e => d.prepare('INSERT INTO users (email,hashed_password) VALUES (?,?)').run(e, bcrypt.hashSync('x'.repeat(10), 10)));
  d.close();
}
function paleisti(db_) {
  const f = path.join(__dirname, 'auth-' + Math.random().toString(36).slice(2) + '.js');
  fs.copyFileSync(path.join(__dirname,'..','auth.js'), f);
  process.env.DB_PATH = db_; process.env.JWT_SECRET='x'.repeat(40); process.env.INVITE_CODES='T';
  const zurnalas = [];
  const se = console.error, sl = console.log;
  console.error = (...a)=>zurnalas.push(a.join(' ')); console.log = (...a)=>zurnalas.push(a.join(' '));
  let A = null, klaida = null;
  try { A = require(f); } catch (e) { klaida = e.message; }
  console.error = se; console.log = sl;
  fs.unlinkSync(f);
  return { A, zurnalas, klaida };
}

console.log('\n-- 1. Svarus atvejis: mixed case irasai normalizuojami --');
let p = path.join(__dirname,'m1.db');
paruosti(p, ['Lukas@Pavyzdys.LT', 'kitas@pavyzdys.lt', '  Treti@X.lt  '.trim()]);
let r = paleisti(p);
let d = new Database(p);
let visi = d.prepare('SELECT email FROM users ORDER BY id').all().map(x=>x.email);
T('visi el. pastai mazosiomis', visi.every(e=>e===e.toLowerCase()), visi);
T('indeksas users_email_nocase sukurtas',
  !!d.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='users_email_nocase'").get());
try { d.prepare('INSERT INTO users (email,hashed_password) VALUES (?,?)').run('LUKAS@pavyzdys.lt','x');
  T('dublikatas kitu registru ATMETAMAS', false, 'ideta!'); }
catch(e) { T('dublikatas kitu registru ATMETAMAS', /UNIQUE/i.test(e.message), e.message.slice(0,40)); }
d.close();

console.log('\n-- 2. Pavojingas atvejis: dvi paskyros skiriasi TIK registru --');
p = path.join(__dirname,'m2.db');
paruosti(p, ['Lukas@Pavyzdys.LT', 'lukas@pavyzdys.lt']);
r = paleisti(p);
T('serveris NENUKRENTA', r.klaida === null, r.klaida);
d = new Database(p);
visi = d.prepare('SELECT email FROM users ORDER BY id').all().map(x=>x.email);
T('NE VIENAS irasas nepakeistas', visi.includes('Lukas@Pavyzdys.LT') && visi.includes('lukas@pavyzdys.lt'), visi);
T('abi paskyros islikusios (niekas nedingo)', visi.length === 2, visi.length);
T('indeksas NESUKURTAS (butu sunaikines viena)',
  !d.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='users_email_nocase'").get());
T('i zurnala irasytas ispejimas', r.zurnalas.some(x=>/A-4.*NEMIGRUOTA/.test(x)),
  (r.zurnalas.find(x=>/A-4/.test(x))||'').slice(0,60));
d.close();

console.log('\n' + (blogai ? 'KLAIDU: ' + blogai : 'VISI PRAEJO'));
process.exit(blogai?1:0);
