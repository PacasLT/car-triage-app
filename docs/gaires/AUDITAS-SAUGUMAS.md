# Saugumo auditas · playbook

Remiasi OWASP Session Management ir Authentication rekomendacijomis bei ASVS lygiu 1–2. Pritaikyta CarTriige sandarai: Express + JWT + SQLite, statika iš to paties serverio, Railway.

Paleidžiamas prieš kiekvieną viešą paleidimą ir kas mėnesį.

---

## 1. Paslaptys

```bash
cd backend
grep -rn "sk-ant\|sk-\|password\|secret\|api_key" --include="*.js" . | grep -v "process.env" | head
git log --oneline -20 -- backend/.env      # ar kada nors buvo pridėtas
cat ../.gitignore | grep -n "env"
```

- `ANTHROPIC_API_KEY`, `SCRAPER_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`, `INVITE_CODES`, `KLAIDU_RAKTAS` – **tik** Railway Variables.
- Kode neturi būti **jokios atsarginės reikšmės**. Nėra kintamojo → funkcija uždaryta ir tai matosi konsolėje. (Šis principas jau taikytas `INVITE_CODES` ir `JWT_SECRET`.)
- Paslaptis niekada nekeliauja adreso parametru – tik antraštėje. URL patenka į serverio žurnalus, naršyklės istoriją ir `Referer`.
- **Rotacija:** raktas, kuris kada nors buvo pokalbyje, ekranvaizdyje ar žurnale, laikomas nutekėjusiu ir keičiamas.

---

## 2. Autentifikacija

| Patikra | Reikalavimas | Kaip patikrinti |
|---|---|---|
| Slaptažodžio maiša | bcrypt ≥ 12 raundų (dabar 10) | `grep -n "bcrypt.hash" backend/auth.js` |
| Minimalus ilgis | ≥ 8 simboliai, be sudėtingumo reikalavimų, bet su žinomų slaptažodžių patikra | `auth.js` `handleRegister` |
| Bandymų riba | 5 / 15 min. iš IP **ir** pagal paskyrą | `grep -rn "limit" backend/server.js` |
| Vienodas atsakymas | „Neteisingas el. paštas arba slaptažodis" abiem atvejais ✔ | `handleLogin` |
| Laiko kanalas | `bcrypt.compare` vykdomas ir tada, kai vartotojo nėra | `handleLogin` – **dabar ne**: neegzistuojantis el. paštas atsako greičiau ir tai išduoda, kurie adresai registruoti |
| El. pašto formatas | tikrinamas ir normalizuojamas (`trim().toLowerCase()`) | **dabar ne** |
| Algoritmas pririštas | `algorithms: ['HS256']` ✔ | `verifyToken` |

---

## 3. Sesijos

Detaliai – `AUDITAS-SESIJOS.md`. Saugumo minimumas:

- prieigos žetonas trumpalaikis (≤ 30 min.), atnaujinimo – `httpOnly; Secure; SameSite=Strict` slapuke;
- yra ir neveiklumo, ir absoliuti riba;
- atsijungimas **serveryje** panaikina atnaujinimo žetoną (dabar atsijungimas yra tik `localStorage.removeItem` – pavogtas žetonas galioja iki 72 h);
- žetono turinyje nėra nieko slapto (`sub: email` ✔ – bet el. paštas matomas bet kam, kas atidarys naršyklės saugyklą).

---

## 4. HTTP antraštės

Šiandien nėra nė vienos. Minimumas (`helmet` arba rankomis):

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:   ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:    ["'self'", 'data:', 'https:'],        // portalų nuotraukos
      scriptSrc: ["'self'", "'unsafe-inline'"],        // kol yra inline <script>
      connectSrc:["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

`'unsafe-inline'` skripte yra nuolaida monolitui – ji pašalinama tada, kai inline `<script>` blokai iškeliami į failus. Tai verta įrašyti kaip skolą, ne nutylėti.

Papildomai: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` be kameros/mikrofono/geolokacijos.

---

## 5. Įvesties tikrinimas ir XSS

```bash
cd frontend
grep -rn "innerHTML" *.html *.js | wc -l
grep -rn "innerHTML" *.html *.js | grep -v "ctEsc" | head -30
```

- Kiekviena reikšmė iš portalo (pavadinimas, pardavėjas, vieta, komentaras) ir iš AI atsakymo – **tik per `ctEsc()`**.
- `ctEsc` apibrėžtas dviejose vietose (`ct-bendras.js` ir vietoje `detail.html`) – patikrinti, ar abi versijos identiškos.
- Serveryje: kiekvienas `req.body` laukas tikrinamas pagal tipą prieš naudojimą (`typeof x === 'string'`), ilgis ribojamas.
- URL, gaunamas iš kliento ir perduodamas nuskaitymui, tikrinamas pagal **leidžiamų portalų sąrašą** – kitaip serveris tampa atvira nuskaitymo tarnyba (SSRF): `grep -n "new URL(" backend/server.js`.

---

## 6. Prieigos teisės

```bash
grep -n "app\.\(get\|post\|delete\)" backend/server.js | grep -v requireAuth | grep -v klaiduPrieiga
```

Kiekvienas maršrutas be `requireAuth` turi turėti **užrašytą priežastį**. Šiandien tokia yra viena – `POST /api/klaida` (pranešti apie klaidą reikia būtent tada, kai neveikia prisijungimas), su savo IP riba.

- Admin maršrutai: `requireAuth` **ir** `reikalautiAdmin`.
- `KLAIDU_RAKTAS` neatrakina `DELETE`, `/admin/vartotojai`, `/admin/planas`, `/admin/kreditai` ✔.
- Objekto savininko patikra: ar `GET /api/ataskaitos/:id` tikrina, kad ataskaita priklauso `req.user`? (IDOR – dažniausia praleidžiama klaida.)

---

## 7. Duomenys ir saugykla

- SQL – tik `db.prepare()` su `?` ✔.
- `/data` – ar tikrai Railway Volume: `GET /admin/atsarga` → `saugykla.persistentinis`.
- Kiekvienas diske laikomas sąrašas turi ribą ir valymą (klaidų žurnalas 200 ✔, timeline 60 ✔, market-history 1000 ✔).
- Asmens duomenys: klaidų žurnale rašomi `localStorage` **raktų vardai, ne reikšmės** ✔ – patikrinama po kiekvieno `klaidu-pranesimas.js` pakeitimo.
- Atsarginė kopija: `users.db` kopijavimo tvarka. Šiandien jos nėra – prarasta DB reiškia prarastus klientus.

---

## 8. Priklausomybės

```bash
npm audit --omit=dev
npm outdated
```

- `puppeteer` yra didžiausia ir rizikingiausia priklausomybė. Prieš ją atnaujinant – `GET /admin/atsarga` statistika: jei `pasiektas: 0` arba `pavyko: 0`, ji **išimama**, o ne atnaujinama.
- `express` 4.x – patikrinti, ar nėra aktyvių CVE; 5.x migracija planuojama atskirai.
- Kritinės CVE taisomos per 7 d., aukštos – per 30.

---

## 9. Suvestinė

Kiekvienas auditas baigiasi trimis skaičiais:

- **kiek patikrų atlikta / kiek praėjo**;
- **kiek radinių pagal sunkumą** (kritinis / rimtas / smulkus);
- **kiek radinių atidėta ir iki kada**.

Kritinis radinys – toks, kuris leidžia svetimam pasiekti duomenis arba pinigus. Jis taisomas prieš kitą deploy'ų, ne po jo.

---

## Šaltiniai

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP ASVS – sesijos neveiklumo riba](https://owasp-aasvs.readthedocs.io/en/latest/requirement-3.3.html)
- [NIST SP 800-63B – sesijų valdymas](https://pages.nist.gov/800-63-4/sp800-63b/session)
- [JWT saugumo praktikos: saugojimas, galiojimas, rotacija](https://skycloak.io/blog/jwt-best-practices-developers/)
- [Slapukai ar localStorage JWT autentifikacijai](https://blog.openreplay.com/cookies-vs-localstorage-jwt-auth/)
