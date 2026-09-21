// planai.js — narystės planai ir kreditai
//
// Trys būsenos: 'trial' (registracija, 1 paieška, 1 kreditas), 'pro' (€9,90),
// 'business' (€39). Mokėjimų nėra – planus ir kreditus priskiria administratorius.
//
// Kreditai dviejų rūšių:
//   kreditai_plano  – atsinaujina kas mėnesį iki plano ribos, nurašomi pirmiausia
//   kreditai_pirkti – nupirkti atskirai, niekada nesibaigia
//
// Nurašoma TIK už realiai atliktą darbą: tas pats vartotojas, tas pats objektas
// (skelbimo URL, VIN, pardavėjas) per 24 val. – nemokamai. Jei serveris grąžina
// 5xx – kreditai grąžinami automatiškai.

const PLANAI = {
  trial: {
    pavadinimas: 'Bandomasis', kaina: 0,
    paieskosMen: null, paieskosViso: 1,   // 1 paieška iš viso, ne per mėnesį
    kreditaiMen: 1,
  },
  pro: {
    pavadinimas: 'Pro', kaina: 9.90,
    paieskosMen: 100, paieskosViso: null,
    kreditaiMen: 15,
  },
  business: {
    pavadinimas: 'Verslas', kaina: 39,
    paieskosMen: null, paieskosViso: null,  // neribota
    kreditaiMen: 100,
  },
};

const KAINOS = {
  analize: 1,      // GREITA apžvalga: skelbimo tekstas, kaina, rizikos (be nuotraukų AI)
  analizePilna: 2, // PILNA apžvalga: + vizualinis nuotraukų patikrinimas, pardavėjas, VIN, įranga
  vin: 1,          // VIN istorijos paieška
  pardavejas: 1,   // pardavėjo patikra
  palyginimas: 2,  // gilus 2–3 auto palyginimas
  megstamiuAtnaujinimas: 1, // v1.23.1: visu megstamiausiu busenos/kainos pertikrinimas
};

const PAKETAI = [
  { kreditai: 10, kaina: 4.90 },
  { kreditai: 50, kaina: 19 },
];

const NEMOKAMAS_PAKARTOJIMAS_MS = 24 * 60 * 60 * 1000;

let db = null;
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
);
function arAdmin(user) {
  if (!user) return false;
  return !!user.is_admin || ADMIN_EMAILS.has(String(user.email || '').toLowerCase());
}

function prijungti(database) {
  db = database;
  // Migracija – stulpeliai pridedami tik jei jų dar nėra
  const esami = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
  const nauji = [
    ['plan', "TEXT DEFAULT 'trial'"],
    ['plan_iki', 'TEXT'],
    ['kreditai_plano', 'INTEGER DEFAULT 1'],
    ['kreditai_pirkti', 'INTEGER DEFAULT 0'],
    ['paieskos_menesi', 'INTEGER DEFAULT 0'],
    ['paieskos_viso', 'INTEGER DEFAULT 0'],
    ['menuo', 'TEXT'],
    ['is_admin', 'INTEGER DEFAULT 0'],
  ];
  let prideta = 0;
  nauji.forEach(([stulpelis, tipas]) => {
    if (!esami.has(stulpelis)) { db.exec(`ALTER TABLE users ADD COLUMN ${stulpelis} ${tipas}`); prideta++; }
  });
  db.exec(`
    CREATE TABLE IF NOT EXISTS kreditu_zurnalas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      laikas INTEGER NOT NULL,
      veiksmas TEXT NOT NULL,
      raktas TEXT,
      kiekis INTEGER NOT NULL,
      likutis_po INTEGER NOT NULL,
      pastaba TEXT
    );
    CREATE INDEX IF NOT EXISTS kz_user_laikas ON kreditu_zurnalas(user_id, laikas);
    CREATE INDEX IF NOT EXISTS kz_raktas ON kreditu_zurnalas(user_id, veiksmas, raktas);
  `);
  // Administratoriai iš env: ADMIN_EMAILS=lukas@x.lt,kitas@y.lt
  const adminai = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (adminai.length) {
    const st = db.prepare('UPDATE users SET is_admin = 1 WHERE lower(email) = ?');
    adminai.forEach((e) => st.run(e));
  }
  console.log(`[PLANAI] paruošta (nauji stulpeliai: ${prideta}, administratoriai: ${adminai.length || 'nenustatyti – ADMIN_EMAILS env'})`);
}

function siandienMenuo() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function planasAktyvus(user) {
  if (!user.plan || user.plan === 'trial') return false;
  if (!PLANAI[user.plan]) return false;
  if (user.plan_iki && new Date(user.plan_iki).getTime() < Date.now()) return false;
  return true;
}

// Efektyvus planas: pasibaigęs pro/business elgiasi kaip trial, bet pirkti kreditai lieka
function efektyvusPlanas(user) {
  return planasAktyvus(user) ? user.plan : 'trial';
}

// Mėnesio pradžioje atstatom plano kreditus ir paieškų skaitiklį
function atnaujintiMenesi(user) {
  const men = siandienMenuo();
  if (user.menuo === men) return user;
  const planas = efektyvusPlanas(user);
  const kreditai = planas === 'trial' ? Math.min(user.kreditai_plano || 0, PLANAI.trial.kreditaiMen) : PLANAI[planas].kreditaiMen;
  db.prepare('UPDATE users SET menuo = ?, paieskos_menesi = 0, kreditai_plano = ? WHERE id = ?')
    .run(men, kreditai, user.id);
  return gautiVartotoja(user.id);
}

function gautiVartotoja(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function busena(userIn) {
  const user = atnaujintiMenesi(userIn);
  const planas = efektyvusPlanas(user);
  const p = PLANAI[planas];
  const plano = user.kreditai_plano || 0, pirkti = user.kreditai_pirkti || 0;
  let paieskuLiko = null;
  if (p.paieskosViso != null) paieskuLiko = Math.max(0, p.paieskosViso - (user.paieskos_viso || 0));
  else if (p.paieskosMen != null) paieskuLiko = Math.max(0, p.paieskosMen - (user.paieskos_menesi || 0));
  return {
    planas, planoPavadinimas: p.pavadinimas, planoKaina: p.kaina,
    planIki: user.plan_iki || null,
    pasibaiges: !!(user.plan && user.plan !== 'trial' && !planasAktyvus(user)),
    kreditai: { plano, pirkti, viso: plano + pirkti, menesioRiba: p.kreditaiMen },
    paieskos: {
      menesi: user.paieskos_menesi || 0, viso: user.paieskos_viso || 0,
      riba: p.paieskosViso != null ? p.paieskosViso : p.paieskosMen,   // null = neribota
      ribosTipas: p.paieskosViso != null ? 'viso' : (p.paieskosMen != null ? 'menesi' : 'neribota'),
      liko: paieskuLiko,
    },
    kainos: KAINOS, paketai: PAKETAI, planai: PLANAI,
    isAdmin: arAdmin(user),
  };
}

// ── Paieškų riba ───────────────────────────────────────────────────────────
function reikalautiPaieskos() {
  return function (req, res, next) {
    try {
      const b = busena(req.user);
      if (b.paieskos.liko !== null && b.paieskos.liko <= 0) {
        const zin = b.planas === 'trial'
          ? 'Bandomoji paieška išnaudota. Pasirinkite planą, kad ieškotumėte toliau.'
          : `Šio mėnesio paieškų riba (${b.paieskos.riba}) pasiekta.`;
        return res.status(402).json({ error: zin, priezastis: 'paieskos', busena: b });
      }
      db.prepare('UPDATE users SET paieskos_menesi = paieskos_menesi + 1, paieskos_viso = paieskos_viso + 1 WHERE id = ?')
        .run(req.user.id);
      req.planoBusena = b;
      next();
    } catch (e) {
      console.error('[PLANAI] paieškos ribos klaida:', e.message);
      next();  // planų klaida niekada neturi sustabdyti paieškos
    }
  };
}

// ── Plano lygio reikalavimas (pvz. sekimas tik Verslo planui) ──────────────
const LYGIAI = { trial: 0, pro: 1, business: 2 };
function reikalautiPlano(minPlanas) {
  return function (req, res, next) {
    try {
      const b = busena(req.user);
      if ((LYGIAI[b.planas] || 0) < (LYGIAI[minPlanas] || 0)) {
        return res.status(402).json({
          error: `Ši funkcija įtraukta į „${PLANAI[minPlanas].pavadinimas}" planą.`,
          priezastis: 'planas', reikia: minPlanas, busena: b,
        });
      }
      next();
    } catch (e) { console.error('[PLANAI] plano lygio klaida:', e.message); next(); }
  };
}

// ── Kreditai ───────────────────────────────────────────────────────────────
function nesenaiMoketa(userId, veiksmas, raktas) {
  if (!raktas) return false;
  const nuo = Date.now() - NEMOKAMAS_PAKARTOJIMAS_MS;
  const moketa = db.prepare(
    'SELECT COUNT(*) AS n FROM kreditu_zurnalas WHERE user_id = ? AND veiksmas = ? AND raktas = ? AND kiekis < 0 AND laikas > ?'
  ).get(userId, veiksmas, raktas, nuo).n;
  const grazinta = db.prepare(
    'SELECT COUNT(*) AS n FROM kreditu_zurnalas WHERE user_id = ? AND veiksmas = ? AND raktas = ? AND kiekis > 0 AND laikas > ?'
  ).get(userId, veiksmas + '-grazinta', raktas, nuo).n;
  return moketa > grazinta;   // buvo sumoketa ir NEgrazinta -> pakartojimas nemokamas
}

// v1.46.0: apvilkta db.transaction().
// Iki siol tarp skaitymo (gautiVartotoja) ir rasymo (UPDATE) nebuvo jokio barjero.
// Veike tik todel, kad better-sqlite3 sinchroninis, o Node vienagijis - niekas
// neisiterpia. Bet tai netycine apsauga: uztektu vienam zmogui idėti `await`
// (pvz. loga i isorine sistema), ir atsirastu dviguba nurasymo spraga, kurios
// testuose nesimatytu. Transakcija padaro apsauga sąmoninga.
const _nurasytiTx = (userId, kiekis, veiksmas, raktas, pastaba) => {
  const u = gautiVartotoja(userId);
  let plano = u.kreditai_plano || 0, pirkti = u.kreditai_pirkti || 0;
  if (plano + pirkti < kiekis) return null;
  const isPlano = Math.min(plano, kiekis);
  plano -= isPlano; pirkti -= (kiekis - isPlano);
  db.prepare('UPDATE users SET kreditai_plano = ?, kreditai_pirkti = ? WHERE id = ?').run(plano, pirkti, userId);
  db.prepare('INSERT INTO kreditu_zurnalas (user_id, laikas, veiksmas, raktas, kiekis, likutis_po, pastaba) VALUES (?,?,?,?,?,?,?)')
    .run(userId, Date.now(), veiksmas, raktas || null, -kiekis, plano + pirkti, pastaba || null);
  return plano + pirkti;
};
let _nurasytiVykdyk = null;
const nurasyti = (userId, kiekis, veiksmas, raktas, pastaba) => {
  if (!_nurasytiVykdyk) _nurasytiVykdyk = db.transaction(_nurasytiTx);
  return _nurasytiVykdyk(userId, kiekis, veiksmas, raktas, pastaba);
};

const _pridetiTx = (userId, kiekis, veiksmas, raktas, pastaba, iPlano) => {
  const u = gautiVartotoja(userId);
  const stulpelis = iPlano ? 'kreditai_plano' : 'kreditai_pirkti';
  db.prepare(`UPDATE users SET ${stulpelis} = ${stulpelis} + ? WHERE id = ?`).run(kiekis, userId);
  const likutis = (u.kreditai_plano || 0) + (u.kreditai_pirkti || 0) + kiekis;
  db.prepare('INSERT INTO kreditu_zurnalas (user_id, laikas, veiksmas, raktas, kiekis, likutis_po, pastaba) VALUES (?,?,?,?,?,?,?)')
    .run(userId, Date.now(), veiksmas, raktas || null, kiekis, likutis, pastaba || null);
  return likutis;
};
let _pridetiVykdyk = null;
const prideti = (userId, kiekis, veiksmas, raktas, pastaba, iPlano) => {
  if (!_pridetiVykdyk) _pridetiVykdyk = db.transaction(_pridetiTx);
  return _pridetiVykdyk(userId, kiekis, veiksmas, raktas, pastaba, iPlano);
};

// Middleware: patikrina likutį, nurašo; jei serveris grąžina 5xx – grąžina.
// raktasFn(req) grąžina objekto raktą (URL, VIN...) – tas pats raktas per 24 val. nemokamas.
function reikalautiKreditu(veiksmas, raktasFn) {
  const kaina = KAINOS[veiksmas];
  if (kaina == null) throw new Error('Nežinomas veiksmas: ' + veiksmas);
  return function (req, res, next) {
    let raktas = null;
    try { raktas = raktasFn ? raktasFn(req) : null; } catch (e) {}
    try {
      atnaujintiMenesi(req.user);
      if (nesenaiMoketa(req.user.id, veiksmas, raktas)) {
        req.kreditai = { veiksmas, kaina: 0, nemokamai: true };
        return next();
      }
      const likutis = nurasyti(req.user.id, kaina, veiksmas, raktas, null);
      if (likutis === null) {
        const b = busena(req.user);
        return res.status(402).json({
          error: `Nepakanka kreditų: reikia ${kaina}, turite ${b.kreditai.viso}.`,
          priezastis: 'kreditai', reikia: kaina, busena: b,
        });
      }
      req.kreditai = { veiksmas, kaina, likutis };
      res.setHeader('X-Kreditai-Likutis', String(likutis));
      // Grąžinam, jei nepavyko serverio pusėje
      res.on('finish', () => {
        // v2.5.4: 410 = skelbimas portale ištrintas - ne vartotojo kaltė, grąžinam.
        if (res.statusCode >= 500 || res.statusCode === 410) {
          try { prideti(req.user.id, kaina, veiksmas + '-grazinta', raktas, 'serverio klaida ' + res.statusCode, false); }
          catch (e) { console.error('[PLANAI] grąžinimo klaida:', e.message); }
        }
      });
      next();
    } catch (e) {
      console.error('[PLANAI] kreditų klaida:', e.message);
      res.status(500).json({ error: 'Kreditų sistemos klaida' });
    }
  };
}

// ── Administravimas ────────────────────────────────────────────────────────
function reikalautiAdmin(req, res, next) {
  if (!arAdmin(req.user)) return res.status(403).json({ error: 'Tik administratoriui' });
  next();
}

function visiVartotojai() {
  return db.prepare(`
    SELECT id, email, plan, plan_iki, kreditai_plano, kreditai_pirkti, paieskos_menesi, paieskos_viso,
           is_active, is_admin, created_at
    FROM users ORDER BY created_at DESC
  `).all().map((u) => ({ ...u, busena: busena(u) }));
}

function nustatytiPlana(email, planas, iki, adminEmail) {
  if (!PLANAI[planas]) throw new Error('Nežinomas planas: ' + planas);
  const u = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(String(email).toLowerCase());
  if (!u) throw new Error('Vartotojas nerastas: ' + email);
  let planIki = null;
  if (planas !== 'trial') {
    planIki = iki ? new Date(iki) : new Date(Date.now() + 30 * 86400000);
    if (isNaN(planIki.getTime())) throw new Error('Netinkama data: ' + iki);
    planIki = planIki.toISOString().slice(0, 10);
  }
  // Naujas planas -> pilnas mėnesio kreditų kiekis iš karto
  db.prepare('UPDATE users SET plan = ?, plan_iki = ?, kreditai_plano = ?, paieskos_menesi = 0, menuo = ? WHERE id = ?')
    .run(planas, planIki, PLANAI[planas].kreditaiMen, siandienMenuo(), u.id);
  db.prepare('INSERT INTO kreditu_zurnalas (user_id, laikas, veiksmas, raktas, kiekis, likutis_po, pastaba) VALUES (?,?,?,?,?,?,?)')
    .run(u.id, Date.now(), 'planas', planas, 0, PLANAI[planas].kreditaiMen + (u.kreditai_pirkti || 0), `planas ${planas} iki ${planIki || '–'} (${adminEmail})`);
  return busena(gautiVartotoja(u.id));
}

function pridetiKreditu(email, kiekis, pastaba, adminEmail) {
  kiekis = parseInt(kiekis, 10);
  if (!kiekis || kiekis < -1000 || kiekis > 1000) throw new Error('Kiekis turi būti nuo -1000 iki 1000');
  const u = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(String(email).toLowerCase());
  if (!u) throw new Error('Vartotojas nerastas: ' + email);
  prideti(u.id, kiekis, 'admin', null, `${pastaba || 'rankinis'} (${adminEmail})`, false);
  return busena(gautiVartotoja(u.id));
}

function zurnalas(userId, kiek) {
  return db.prepare('SELECT laikas, veiksmas, raktas, kiekis, likutis_po, pastaba FROM kreditu_zurnalas WHERE user_id = ? ORDER BY laikas DESC LIMIT ?')
    .all(userId, kiek || 50);
}

module.exports = {
  PLANAI, KAINOS, PAKETAI, arAdmin,
  prijungti, busena, reikalautiPaieskos, reikalautiKreditu, reikalautiPlano,
  reikalautiAdmin, visiVartotojai, nustatytiPlana, pridetiKreditu, zurnalas,
};
