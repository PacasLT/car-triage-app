// auth.js — JWT + invite code authentication for CarTriige (Node.js/Express)
// Reikia: npm install jsonwebtoken bcryptjs better-sqlite3

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// PATAISYTA: buvo skaitomas tik JWT_SECRET_KEY, todel Railway nustatytas
// JWT_SECRET buvo tyliai ignoruojamas ir veikdavo kode irasyta atsargine
// reiksme - o ji yra viesa, t.y. bet kas galejo pasigaminti galiojanti zetona.
const SECRET_KEY = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || null;
if (!SECRET_KEY || SECRET_KEY.length < 32) {
  console.error('');
  console.error('  ============================================================');
  console.error('  [SAUGUMAS] JWT_SECRET nenustatytas arba trumpesnis nei 32 simboliai.');
  console.error('  Kol taip yra, prisijungimo zetonus gali pasigaminti bet kas.');
  console.error('  Nustatykite JWT_SECRET Railway Variables ir perkraukite.');
  console.error('  ============================================================');
  console.error('');
}
const VEIKIANTIS_SECRET = SECRET_KEY || require('crypto').randomBytes(48).toString('hex');
const TOKEN_EXPIRE = '72h';
// DB kelio parinkimas, atsparus praleistam kintamajam.
// Prioritetas: DB_PATH env -> primountintas /data Volume -> konteinerio vidus.
// Be sio "kritimo i /data" uzmirsus nustatyti DB_PATH visi vartotojai dingsta
// po kiekvieno deploy'aus, o priezastis is issores atrodo kaip "neteisingas slaptazodis".
function parinktiDbKelia() {
  if (process.env.DB_PATH) return { kelias: process.env.DB_PATH, saltinis: 'DB_PATH env' };
  try {
    fs.accessSync('/data', fs.constants.W_OK);
    return { kelias: '/data/users.db', saltinis: 'aptiktas /data Volume (DB_PATH nenurodytas)' };
  } catch (e) {}
  return { kelias: path.join(__dirname, 'users.db'), saltinis: 'konteinerio vidus – NEPERSISTENTINIS' };
}
const _dbPasirinkimas = parinktiDbKelia();
const DB_PATH = _dbPasirinkimas.kelias;

// Invite kodai is Railway env var: INVITE_CODES=CARTRIAGE2024,DRAUGAS01
// v1.46.0 SAUGUMAS: atsargines reiksmes NEBERA. Anksciau cia buvo 'CARTRIAGE2024' -
// viešas kodas, gulejes GitHub'e. Jei Railway kintamasis kada nors dingtu (nauja
// aplinka, klaida perkeliant), registracija tyliai atsivertu bet kam, kas ta koda
// skaite. Dabar: nera kintamojo -> registracija uzdaryta, ir tai matosi konsoleje.
const INVITE_CODES = new Set(
  (process.env.INVITE_CODES || '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean)
);
if (!INVITE_CODES.size) {
  console.error('[SAUGUMAS] INVITE_CODES nenustatytas - registracija uzdaryta.');
  console.error('            Nustatykite INVITE_CODES Railway Variables.');
}

// ── DB ─────────────────────────────────────────────────────────────────────
// Ensure the directory for DB_PATH exists (needed when using Railway Volumes)
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// --- DIAGNOSTIKA: be sios eilutes neimanoma pasakyti, ar DB tikrai gula ant
// persistentinio Railway Volume, ar i konteinerio vidu, kuris dingsta po kiekvieno deploy'aus.
(function logDbDiagnostiką() {
  const kat = path.dirname(DB_PATH);
  let bylosDydis = null, buvoPries = false;
  try { const st = fs.statSync(DB_PATH); bylosDydis = st.size; buvoPries = true; } catch (e) {}
  let rasomas = true;
  try { fs.accessSync(kat, fs.constants.W_OK); } catch (e) { rasomas = false; }
  console.log('[DB] kelias           :', DB_PATH, '(' + _dbPasirinkimas.saltinis + ')');
  console.log('[DB] katalogas rasomas:', rasomas);
  console.log('[DB] byla egzistavo   :', buvoPries, buvoPries ? `(${bylosDydis} baitu)` : '(kuriama nauja - vartotojai bus prarasti!)');
  if (!DB_PATH.startsWith('/data')) {
    console.log('[DB] ⚠ DEMESIO: DB nera po /data - po kiekvieno deploy\'aus vartotojai DINGS.');
    console.log('[DB] ⚠ Railway: prijunkite Volume su mount path /data (ir, jei norite, DB_PATH=/data/users.db)');
  }
})();

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);
// ── A-4 (revizija 2026-09-20) · el. pasto registras ─────────────────────────
// `email TEXT UNIQUE` SQLite'e yra REGISTRUI JAUTRUS. Tad `Lukas@x.lt` ir
// `lukas@x.lt` buvo du skirtingi vartotojai, o `SELECT ... WHERE email = ?`
// nerasdavo paskyros, jei zmogus rase kitaip nei registruodamasis. Simptomas:
// „Neteisingas el. pastas arba slaptazodis" su TEISINGU slaptazodziu.
//
// `planai.js:54` administratoriu tikrino per `toLowerCase()` - t.y. viena
// puse jau buvo normalizuota, kita ne. Kaip visada, nesutampa ten, kur du
// saltiniai.
function normEmail(e) {
  return String(e == null ? '' : e).trim().toLowerCase();
}

// Vienkartine migracija: esamus irasus i mazasias raides.
// SAUGIKLIS: jei dvi paskyros skiriasi TIK registru, sulieti ju negalim - tai
// du skirtingi zmones arba du skirtingi kreditu likuciai. Tada nedarom nieko
// ir rekiam i zurnala, kad butu matoma.
(function migruotiElPastus() {
  try {
    const dubliai = db.prepare(
      'SELECT LOWER(email) AS maz, COUNT(*) AS n FROM users GROUP BY LOWER(email) HAVING n > 1'
    ).all();
    if (dubliai.length) {
      console.error('');
      console.error('  [A-4] NEMIGRUOTA: rasti el. pastai, kurie skiriasi tik registru:');
      dubliai.forEach((d) => console.error('        ' + d.maz + ' - ' + d.n + ' paskyros'));
      console.error('        Sulieti automatiskai negalima. Sutvarkykite rankomis.');
      console.error('');
      return;
    }
    const r = db.prepare("UPDATE users SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email))").run();
    if (r.changes) console.log('[A-4] El. pastu normalizuota:', r.changes);
  } catch (e) {
    console.error('[A-4] migracija nepavyko:', e.message);
  }
})();

// Unikalumas nuo siol NEPRIKLAUSO nuo registro. Jei indeksas nesusikuria,
// vadinasi virsuje buvo dubliu - klaida jau isspausdinta, o darbas tesiasi.
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_email_nocase ON users(email COLLATE NOCASE)');
} catch (e) {
  console.error('[A-4] users_email_nocase indeksas nesukurtas:', e.message);
}

// Planai ir kreditai – atskiras modulis, dirba su ta pačia DB
const planai = require('./planai');
planai.prijungti(db);
const duomenys = require('./vartotojo-duomenys');
duomenys.prijungti(db);
// v2.11.0: paieškų žurnalas, plano užklausos, slaptažodis, eksportas
const paskyra = require('./paskyra');
paskyra.prijungti(db);

function getUserByEmail(email) {
  // COLLATE NOCASE - kad rastu ir tuos irasus, kurie i migracija nepateko
  // (pvz. jei ji buvo praleista del dubliu).
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(normEmail(email));
}

function createUser(email, hashedPassword) {
  db.prepare('INSERT INTO users (email, hashed_password) VALUES (?, ?)').run(normEmail(email), hashedPassword);
  console.log('[DB] Sukurtas vartotojas:', email, '| is viso:', vartotojuSkaicius());
}

function vartotojuSkaicius() {
  try { return db.prepare('SELECT COUNT(*) AS n FROM users').get().n; } catch (e) { return -1; }
}

// ── JWT ────────────────────────────────────────────────────────────────────
function createToken(email) {
  return jwt.sign({ sub: email }, VEIKIANTIS_SECRET, { expiresIn: TOKEN_EXPIRE });
}

function verifyToken(token) {
  try {
    // algorithms pririsam samoningai: be jo bibliotekai leidziama priimti ir kitus
    // algoritmus, o tai yra klaida, kuri niekada nepasirodo testuose.
    const payload = jwt.verify(token, VEIKIANTIS_SECRET, { algorithms: ['HS256'] });
    return payload.sub;
  } catch {
    return null;
  }
}

// ── Middleware: apsaugoti endpoint'us ──────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Neprisijungta' });
  }
  const email = verifyToken(authHeader.slice(7));
  if (!email) return res.status(401).json({ detail: 'Negaliojantis token' });

  const user = getUserByEmail(email);
  if (!user || !user.is_active) return res.status(401).json({ detail: 'Vartotojas nerastas' });

  req.user = user;
  next();
}

// ── C-1 (revizija) · prisijungimo bandymu riba ──────────────────────────────
// `POST /auth/login` prieme NERIBOTA bandymu skaiciu. Vienintele riba visame
// serveryje buvo `/api/klaida` (5 / 10 min). Registracija uzdaryta pakvietimo
// kodu - tai mazina rizika, bet neapsaugo JAU EGZISTUOJANCIU paskyru.
//
// Skaiciuojami TIK NEPAVYKE bandymai. Sekmingas prisijungimas skaitliuka
// israso - kad zmogus, kuris tiesiog apsiriko, nebutu baudziamas iki lango
// pabaigos.
//
// RAKTAI: `ip` ir `ip+elpastas`. Rakto „vien el. pastas" NERA, ir tai
// samoningas sprendimas: su juo bet kas, zinantis svetima adresa, penkiais
// klaidingais bandymais uzrakintu tos paskyros savininka 15 minuciu. Tai butu
// ne apsauga, o paruostas budas kenkti. Pamatuota testuose: pirmoji redakcija
// turejo bent el. pasto rakta, ir tada TEISINGAS slaptazodis is svaraus IP
// grizdavo 429.
//
// Ka tai palieka atvira, sakau atvirai: paskirstyta ataka is daugelio IP po
// kelis bandymus i ta pacia paskyra sio sargo neuzklius. Tam reiketu arba
// paskyros uzrakto (tada grizta kenkimo kelias), arba delsos, kuri auga su
// kiekvienu bandymu. Registracija uzdaryta pakvietimo kodu, tad realiausia
// grėsmė yra vieno saltinio bandymai - juos si riba sustabdo.
const PRISIJUNGIMO_RIBA = { kiek: 5, langasMs: 15 * 60 * 1000 };
const _prisijungimoBandymai = new Map();

function ipIsUzklausos(req) {
  return String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || 'nezinomas';
}

function bandymuLikutis(raktas, dabar) {
  const laikai = (_prisijungimoBandymai.get(raktas) || []).filter((t) => dabar - t < PRISIJUNGIMO_RIBA.langasMs);
  if (laikai.length) _prisijungimoBandymai.set(raktas, laikai); else _prisijungimoBandymai.delete(raktas);
  return laikai;
}

function zymetiNepavykusi(raktai, dabar) {
  raktai.forEach((r) => {
    const laikai = bandymuLikutis(r, dabar);
    laikai.push(dabar);
    _prisijungimoBandymai.set(r, laikai);
  });
}

function isvalytiBandymus(raktai) {
  raktai.forEach((r) => _prisijungimoBandymai.delete(r));
}

// Zemelapis auga tik nuo nepavykusiu bandymu, bet be valymo jis butu amzinas.
setInterval(() => {
  const dabar = Date.now();
  for (const [r, laikai] of _prisijungimoBandymai) {
    const gyvi = laikai.filter((t) => dabar - t < PRISIJUNGIMO_RIBA.langasMs);
    if (gyvi.length) _prisijungimoBandymai.set(r, gyvi); else _prisijungimoBandymai.delete(r);
  }
}, 10 * 60 * 1000).unref();

// C-4 · laiko kanalas. Neegzistuojanciam el. pastui atsakymas grizdavo IS
// KARTO, egzistuojanciam - po `bcrypt.compare`. Skirtumas ismatuojamas, ir jis
// pasako, kurie adresai registruoti. Lyginam su fiktyvia maisa, kad abu keliai
// truktu panasiai.
//
// RAUNDAI: fiktyvi maisa TURI buti to paties brangumo, kaip saugomos. Pirmoji
// sio pakeitimo redakcija to nepadare - naujoms registracijoms pakeliau i 12,
// o fiktyvia palikau 10, ir bcrypt kaina auga dvigubai su kiekvienu raundu.
// Testas parode 310 ms prie 78 ms: laiko kanalas ne dingo, o PASIDARE
// RYSKESNIS, ir butent del taisymo, kuris ta kanala turejo uzdaryti.
const BCRYPT_RAUNDAI = 12;
const TUSCIA_MAISA = bcrypt.hashSync('tusciaslaptazodis', BCRYPT_RAUNDAI);

// ── Route handler'iai ──────────────────────────────────────────────────────
async function handleRegister(req, res) {
  const { email, password, invite_code } = req.body || {};
  if (!email || !password || !invite_code)
    return res.status(400).json({ detail: 'Trūksta laukų' });
  if (typeof email !== 'string' || typeof password !== 'string' || typeof invite_code !== 'string')
    return res.status(400).json({ detail: 'Netinkamas laukų formatas' });

  if (!INVITE_CODES.has(invite_code.toUpperCase()))
    return res.status(403).json({ detail: 'Neteisingas invite kodas' });

  // A-4: nuo cia visur tik normalizuotas adresas - ir patikroje, ir zetone,
  // ir atsakyme. Anksciau zetonas nesdavo tai, ka zmogus iraso.
  const elPastas = normEmail(email);
  if (!elPastas.includes('@'))
    return res.status(400).json({ detail: 'Netinkamas el. pašto adresas' });

  if (getUserByEmail(elPastas))
    return res.status(400).json({ detail: 'Šis el. paštas jau užregistruotas' });

  if (password.length < 8)
    return res.status(400).json({ detail: 'Slaptažodis turi būti bent 8 simboliai' });

  const hashedPassword = await bcrypt.hash(password, BCRYPT_RAUNDAI);
  try { createUser(elPastas, hashedPassword); }
  catch (e) {
    if (/UNIQUE/i.test(String(e.message))) return res.status(400).json({ detail: 'Šis el. paštas jau užregistruotas' });
    throw e;
  }

  const token = createToken(elPastas);
  res.json({ access_token: token, token_type: 'bearer', email: elPastas });
}

async function handleLogin(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ detail: 'Trūksta laukų' });

  const elPastas = normEmail(email);          // A-4
  const dabar = Date.now();
  const ip = ipIsUzklausos(req);
  const raktai = ['ip:' + ip, 'ip+el:' + ip + '|' + elPastas];

  // C-1: tikrinam PRIES bcrypt - kitaip riba kainuotu tiek pat, kiek bandymas.
  const virsijo = raktai.find((r) => bandymuLikutis(r, dabar).length >= PRISIJUNGIMO_RIBA.kiek);
  if (virsijo) {
    return res.status(429).json({
      detail: 'Per daug nepavykusių bandymų. Pabandykite po 15 minučių.',
    });
  }

  const user = getUserByEmail(elPastas);

  // C-4: lyginam visada - ir tada, kai vartotojo nera. Be sito atsakymo laikas
  // pasako, ar adresas registruotas.
  const sutampa = await bcrypt.compare(password, user ? user.hashed_password : TUSCIA_MAISA);

  if (!user || !sutampa) {
    zymetiNepavykusi(raktai, dabar);
    return res.status(401).json({ detail: 'Neteisingas el. paštas arba slaptažodis' });
  }

  if (!user.is_active)
    return res.status(403).json({ detail: 'Paskyra užblokuota' });

  isvalytiBandymus(raktai);

  // Seni slaptazodziai issaugoti su 10 raundu. Be perrasymo jie tokie ir liktu
  // amzinai, O SVARBIAU - ju patikra truktu trumpiau uz fiktyvia, ir laiko
  // kanalas atsirastu atvirkscias: „greitas atsakymas = registruotas".
  // Perrasom TIK prisijungus teisingai, nes tik tada turim atvira slaptazodi.
  try {
    if (bcrypt.getRounds(user.hashed_password) < BCRYPT_RAUNDAI) {
      const nauja = await bcrypt.hash(password, BCRYPT_RAUNDAI);
      db.prepare('UPDATE users SET hashed_password = ? WHERE id = ?').run(nauja, user.id);
    }
  } catch (e) {
    console.error('[C-4] maisos perrasymas nepavyko:', e.message);
  }

  // TS §5.1: paskutinio prisijungimo laikas – eksportui (BDAR 15 str.)
  try { db.prepare('UPDATE users SET paskutinis_prisijungimas = ? WHERE id = ?').run(Date.now(), user.id); } catch (e) {}
  const token = createToken(user.email);
  res.json({ access_token: token, token_type: 'bearer', email: user.email });
}

function handleMe(req, res) {
  let busena = null;
  try { busena = planai.busena(req.user); } catch (e) { console.error('[PLANAI] busena:', e.message); }
  res.json({ email: req.user.email, created_at: req.user.created_at, isAdmin: planai.arAdmin(req.user), planas: busena });
}

// ── Eksportas ──────────────────────────────────────────────────────────────
console.log('[DB] Vartotoju duomenu bazeje:', (function () {
  try { return db.prepare('SELECT COUNT(*) AS n FROM users').get().n; } catch (e) { return 'nepavyko suskaiciuoti'; }
})());

// Async marsrutai be try/catch palikdavo uzklausa kaboti (Express 4 negaudo promise'u)
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch((e) => {
  console.error('[AUTH] klaida:', e.message);
  if (!res.headersSent) res.status(500).json({ detail: 'Vidinė klaida' });
});

module.exports = {
  verifyToken,   // v1.49.0: klaidu pranesimams - kas pranese, jei zetonas galioja
  requireAuth, handleMe, planai, duomenys, paskyra,
  handleRegister: asyncRoute(handleRegister),
  handleLogin: asyncRoute(handleLogin),
};
