// auth.js — JWT + invite code authentication for CarTriige (Node.js/Express)
// Reikia: npm install jsonwebtoken bcryptjs better-sqlite3

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'PAKEISK_SITA_PRODUCTION!';
const TOKEN_EXPIRE = '72h';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'users.db');

// Invite kodai iš Railway env var: INVITE_CODES=CARTRIAGE2024,DRAUGAS01
const INVITE_CODES = new Set(
  (process.env.INVITE_CODES || 'CARTRIAGE2024')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean)
);

// ── DB ─────────────────────────────────────────────────────────────────────
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

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function createUser(email, hashedPassword) {
  db.prepare('INSERT INTO users (email, hashed_password) VALUES (?, ?)').run(email, hashedPassword);
}

// ── JWT ────────────────────────────────────────────────────────────────────
function createToken(email) {
  return jwt.sign({ sub: email }, SECRET_KEY, { expiresIn: TOKEN_EXPIRE });
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET_KEY);
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

// ── Route handler'iai ──────────────────────────────────────────────────────
async function handleRegister(req, res) {
  const { email, password, invite_code } = req.body;
  if (!email || !password || !invite_code)
    return res.status(400).json({ detail: 'Trūksta laukų' });

  if (!INVITE_CODES.has(invite_code.toUpperCase()))
    return res.status(403).json({ detail: 'Neteisingas invite kodas' });

  if (getUserByEmail(email))
    return res.status(400).json({ detail: 'Šis el. paštas jau užregistruotas' });

  if (password.length < 8)
    return res.status(400).json({ detail: 'Slaptažodis turi būti bent 8 simboliai' });

  const hashedPassword = await bcrypt.hash(password, 10);
  createUser(email, hashedPassword);

  const token = createToken(email);
  res.json({ access_token: token, token_type: 'bearer', email });
}

async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ detail: 'Trūksta laukų' });

  const user = getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.hashed_password)))
    return res.status(401).json({ detail: 'Neteisingas el. paštas arba slaptažodis' });

  if (!user.is_active)
    return res.status(403).json({ detail: 'Paskyra užblokuota' });

  const token = createToken(email);
  res.json({ access_token: token, token_type: 'bearer', email });
}

function handleMe(req, res) {
  res.json({ email: req.user.email, created_at: req.user.created_at });
}

// ── Eksportas ──────────────────────────────────────────────────────────────
module.exports = { requireAuth, handleRegister, handleLogin, handleMe };
