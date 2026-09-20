# UŽDUOTIS · Regitros duomenų integracija į serverį ir sąsają

Paruošta 2026-09-21. Specifikacija: `docs/regitra-panaudojimas.md` – **perskaityti pirma**, ypač 2, 3 ir 7 skyrius (kas gyva, vardų problema, ribos).

Duomenys jau yra: `backend/duomenys/regitra-modeliai.json` (1 343 baziniai modeliai, 237 KB, iš 2026-07-03 failo). Generatorius: `tools/regitra-suvestine.py`. **Žalio 945 MB CSV į repo ar `/data` nededam niekada.**

---

## 1. `backend/regitra.js` – naujas modulis

Įkeliamas paleidžiant, laikomas atmintyje (237 KB – jokio SQLite nereikia).

```js
// backend/regitra.js
const fs = require('fs');
const path = require('path');

const MARKES = {
  'VOLKSWAGEN. VW': 'VW', 'VOLKSWAGEN': 'VW',
  'MERCEDES-BENZ': 'MERCEDES', 'MERCEDES BENZ': 'MERCEDES',
  'LAND-ROVER': 'LAND ROVER',
};

// SVARBU: si funkcija turi ATITIKTI tools/regitra-suvestine.py modelis_dalys().
// Taisant viena - taisyti abi. Tai tiksliai ta pati klaidos forma, kaip ctScore()
// ir diffPct zenklas: viena logika dviejose vietose, kuri tyliai isiskiria.
function markeNorm(mk) {
  const m = String(mk || '').trim().toUpperCase();
  return MARKES[m] || m.replace(/\./g, ' ').trim();
}

function baziniModelis(marke, modelis) {
  const mkn = markeNorm(marke);
  const mkZodziai = new Set(mkn.split(/\s+/));
  let dal = String(modelis || '').trim().toUpperCase().replace(/\./g, ' ')
    .split(/[\s,/]+/).filter(Boolean);
  while (dal.length && mkZodziai.has(dal[0])) dal.shift();   // TOYOTA + TOYOTA RAV4
  if (!dal.length) return null;
  return mkn + ' ' + dal[0];                                  // 'X5 XDRIVE30D' -> 'BMW X5'
}

let LENT = new Map(), META = null;

function ikelti() {
  try {
    const p = path.join(__dirname, 'duomenys', 'regitra-modeliai.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    LENT = new Map(d.modeliai.map((m) => [m.modelis, m]));
    META = { sugeneruota: d.sugeneruota, modeliu: d.modeliu };
    console.log('[REGITRA] ikelta:', d.modeliu, 'modeliu, duomenys', d.sugeneruota);
  } catch (e) {
    // NE tylus catch: jei failo nera, funkcija turi DINGTI matomai, ne rodyti nulius.
    console.error('[REGITRA] NEPAVYKO ikelti:', e.message, '- rinkos kontekstas isjungtas');
    LENT = new Map(); META = null;
  }
}

function kontekstas(marke, modelis) {
  const k = baziniModelis(marke, modelis);
  if (!k) return null;
  return LENT.get(k) || null;
}

module.exports = { ikelti, kontekstas, baziniModelis, markeNorm, meta: () => META };
```

`server.js`: `require('./regitra').ikelti()` paleidžiant; `GET /admin/atsarga` atsakyme pridėti `regitra: regitra.meta()` – kad matytųsi, ar duomenys tikrai pakrauti ir kurio ketvirčio.

---

## 2. Kur prisegama

**Ne atskiras maršrutas klientui.** Kontekstas prisegamas serveryje ten, kur jau formuojami kandidatai – tada ir kortelė, ir skelbimo puslapis jį gauna nemokamai, be papildomos užklausos:

```js
c.regitra = regitra.kontekstas(c.marke, c.modelis) || null;
```

Jei vėliau prireiks atskirai – `GET /api/rinkos-kontekstas?marke=&modelis=`, `requireAuth`, nemokamas, be AI.

---

## 3. Trys punktai ir jų ribos

Visi trys – **žinojimo lygių sistemoje**, kaip visa kita produkte. Nė vienas **nekeičia balo**.

### 3.1 Likvidumas (`apyv_pct`)

| Reikšmė | Lygis | Tekstas |
|---|---|---|
| ≥ 20 % | 🟢 | „LT rinkoje 22 % per metus keičia savininką – judrus modelis" |
| 12–20 % | – | punkto nėra (intervalas nieko nesako) |
| < 12 % | 🟡 | „LT rinkoje tik 12 % per metus keičia savininką – lėtas pardavimas" |

🟢 pagrįstas: tai suskaičiuotas faktas iš 1,88 mln. įrašų, ne prognozė.

### 3.2 Ridos norma (`kmmet_med`, `rida_n`)

```
laukiama = kmmet_med × automobilio_amzius_metais
santykis = skelbimo_rida / laukiama
```

- `santykis < 0.6` → 🟡: „Rida N % mažesnė nei įprasta šiam modeliui Lietuvoje (mediana X km/metus, N registracijų). Paklauskite dėl serviso istorijos."
- kitais atvejais punkto nėra.
- `rida_n < 20` arba modelio nėra lentelėje → ⚪ „per mažai duomenų", **ne tyla**.

**DRAUDŽIAMA** rašyti „rida atsukta", „suktas", „neatitinka tikrovės". Įtraukti šiuos žodžius į esamą `DRAUDZIAMA` sąrašą **kode**, ne tik prompte – lygiai kaip nuotraukų analizėje. Tai klausimas pardavėjui, ne verdiktas.

**Amžių imti iš pirmos registracijos metų**, ne iš `GAMYBOS_METAI` (užpildyta tik 5 %).

### 3.3 Retumas ir nurašymai (`parkas`, `neleid_pct`)

- `parkas < 300` → 🟡 „Lietuvoje registruoti tik N – siauras pirkėjų ratas"
- `neleid_pct > 30` → 🟡 „N % šio modelio Lietuvoje nebeleidžiami eisme"
- modelio lentelėje nėra (arba nuasmenintas) → ⚪, **niekada ne „0"**. 2,61 % M1 įrašų nuasmeninti, ir tai būtent reti bei brangūs automobiliai.

---

## 4. Produkto sprendimas, kurio NEPRIIMU už Luką

Kortelėje `whyReasons` ribojamas iki **3**, ir laiko punktas jau **užima slotą** (`why = whyReasons.slice(0, laikas ? 2 : 3)`). Trys nauji punktai į tą pačią vietą netelpa.

Trys variantai:

1. Regitros punktai eina tik į **trečią lygį** (`.ct-l3`) ir į skelbimo puslapį – kortelė nesikeičia.
2. Likvidumas patenka į pirmą lygį ir užima slotą, kaip laikas; ridos ir retumo punktai – į trečią.
3. Pirmame lygyje leidžiami keturi punktai – bet tai jau dizainerio klausimas (`K-nn` žurnale).

**Numatytasis, jei atsakymo nėra: 1 variantas** – jis nieko nesulaužo ir yra grįžtamas.

---

## 5. Priėmimo testai

Su tikrais duomenimis iš `regitra-modeliai.json` (2026-07-03):

| Įvestis | Laukiama |
|---|---|
| `baziniModelis('BMW', 'X5 XDRIVE30D')` | `'BMW X5'` |
| `baziniModelis('VOLKSWAGEN. VW', 'VW PASSAT')` | `'VW PASSAT'` |
| `baziniModelis('TOYOTA', 'TOYOTA RAV4')` | `'TOYOTA RAV4'` |
| `kontekstas('BMW','X5').parkas` | `11878` |
| `kontekstas('BMW','X5').apyv_pct` | `22.1` |
| `kontekstas('BMW','X5').kmmet_med` | `17323` |
| `kontekstas('AUDI','Q5').kilme[0]` | `['DEU', 381]` |
| `kontekstas('BMW','530').neleid_pct` | `41.9` → 🟡 nurašymų punktas |
| Nežinomas modelis | `null` → ⚪, ne klaida |
| Failo nėra | Serveris pakyla, punktų nėra, konsolėje klaida |

Naujas sargas: `node backend/testai/regitra.test.js` su šiomis patikromis. Jos apsaugo būtent nuo to, kad JS ir Python normalizavimas išsiskirtų.

---

## 6. Ko šioje užduotyje NĖRA

- Juridinių asmenų failo (įmonių parkai) – atskiras darbas.
- Ketvirčio atnaujinimo automatikos – kol kas rankinis `tools/regitra-suvestine.py` paleidimas ir commit.
- Savivaldybių pjūvio – sąmoningai, dėl BDAR (žr. specifikacijos 6 sk.).
- Bet kokio eilutės lygio duomenų saugojimo – draudžiama.

---

## 7. Baigus

1. `frontend/versijos.js` – naujas įrašas, pakeitimai naudotojo kalba („Kortelėje matysite, kaip greitai šis modelis parduodamas Lietuvoje").
2. Playwright regresija 1400 / 390 px, 0 JS klaidų.
3. `node backend/testai/regitra.test.js` + esami sargai.
4. Klaidų sąrašo būsenos, jei kas nors uždaroma.
5. `GET /admin/atsarga` patikrinti, kad `regitra.sugeneruota` rodo teisingą datą produkcijoje.
