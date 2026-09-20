# Kodavimo gairės · CarTriige

Galioja visam kodui: `backend/`, `frontend/`, `tools/`.
Produkto ir dizaino taisyklės – `CLAUDE.md`. Čia – kaip rašoma ir kaip tikrinama.

---

## 1. Prieš rašant

1. `pasikeitimai/BUSENA.md` – kieno dabar ėjimas.
2. `pasikeitimai/ZURNALAS.md` nuo paskutinio savo įrašo.
3. Klaidų sąrašas (`node tools/klaidos.js` arba `/admin.html?tekstas=1`) – gal tai jau pranešta.
4. **Paieška prieš rašymą:** ar tokia funkcija/klasė/raktas jau yra? `grep -rn "<vardas>" frontend backend`.

Naujas kodas, kuris dubliuoja esamą, yra ne pridėjimas, o **antras taisymo taškas**.

---

## 2. Vienas šaltinis kiekvienam dalykui

| Dalykas | Vienintelė vieta |
|---|---|
| Versija | `frontend/versijos.js` |
| Spalva, šriftas, tarpas, radiusas | `ct-dizainas.css` `:root` |
| Mygtukas | `ct-mygtukai.css` + `ct-btn` klasė |
| Kainos kreditais | `backend/planai.js` `KAINOS` |
| Rezultato kortelė | `ctKortele(c, x)` `index.html` |
| Žetonas ir sesija | **turi tapti** `frontend/ct-sesija.js` (žr. `AUDITAS-SESIJOS.md`) |

**Taisyklė:** jei tą patį skaičiuoja ar saugo dvi vietos, jos anksčiau ar vėliau nesutaps. `detail.html` savas `ctScore()` rodė 5.8 ten, kur kortelė rodė 7.8 – tas pats automobilis, du skaičiai.

---

## 3. Klaidų tvarkymas

**`catch`, kuris tik `console.error`, yra ne apsauga, o užmaskavimas.**

- Jei veiksmas **privalo** pavykti (įrašymas į diską, žetono patikra) – nesėkmė rodoma ten, kur žiūri žmogus, ne Railway žurnale.
- Kiekvienas naujas `try/catch` atsako į klausimą: *ką naudotojas pamatys, jei čia nepavyks?* Jei atsakymas „nieko" – tai klaida, ne sprendimas.
- Diagnostikai skirtas maršrutas (`/admin/atsarga`) turi rodyti **būseną**, ne tik skaičius: ar failas yra, koks dydis, ar katalogas persistentinis.

Kaina už šios taisyklės nesilaikymą jau sumokėta: `fs` nebuvo `require`'intas `server.js`, septynios vietos tyliai nieko nedarė, keturi naudotojų pranešimai dingo (v1.60.0).

---

## 4. Frontend

- **Jokių kietai įrašytų spalvų, šriftų, radiusų.** Tik `var(--…)`. `style="` leidžiamas tik išdėstymui (`display`, `width`, `grid-*`, `position`).
- **Naujas komponentas:** pirma klasė, tada CSS `ct-priedai.css`. Ne inline.
- **Klasės pridedamos, ne keičiamos:** `class="dp-tab ct-tab"`. Seni vardai yra JS kabliukai.
- **`onclick` atributas be funkcijos yra tyli klaida.** Po kiekvieno didesnio perdarymo: `cd frontend && python3 ../tools/onclick-patikra.py`.
- **`innerHTML` su serverio ar portalo duomenimis – tik per `ctEsc()`.** Pavadinimas, pardavėjo vardas, vieta ateina iš svetimo puslapio.
- **Saugykla:** naujas `localStorage` raktas pradedamas `ct_`, aprašomas `AUDITAS-SESIJOS.md` lentelėje ir turi dydžio ribą. Neribotai augantis raktas anksčiau ar vėliau meta `QuotaExceededError` – ir visas puslapis nustoja veikti.
- **Kiekvienas `localStorage` kvietimas apgaubtas `try/catch`** (privatus langas, išjungti slapukai).

---

## 5. Backend

- **Kaina, riba ir teisė – tik serveryje.** Klientas siunčia veiksmą, ne kiekį.
- **Prepared statements visada** (`db.prepare(...).run(?)`). Eilutės į SQL nekonkatenuojamos niekada.
- **Kūno riba nustatoma maršrutui, ne globaliai**, ir platesnis analizatorius registruojamas PRIEŠ bendrąjį.
- **Pinigų / kreditų operacijos – `db.transaction()`.** Ne todėl, kad šiandien yra lenktynės, o todėl, kad kitas `await` jas sukurs.
- **Async Express maršrutas be `try/catch` palieka užklausą kaboti.** Naudojamas `asyncRoute()` apvalkalas (`auth.js`).
- **Ribos nuo pirmos dienos:** kiekvienas sąrašas diske turi maksimalų įrašų skaičių ir valymą. Neribotas augimas jau buvo trijose vietose.
- **Įrašymas į diską – per „dirty" vėliavą, niekada cikle.**

---

## 6. Testai ir sargai

| Sargas | Komanda | Ką saugo |
|---|---|---|
| Dizainas | `node backend/testai/dizainas.test.js` | Inline stiliai, `:root` blokai, prijungimo tvarka |
| Mygtukai | `node backend/testai/mygtukai.test.js` | Aukščiai, radiusai, šriftų dydžiai (reikia peržiūros serverio) |
| autogidas | `node backend/testai/autogidas.test.js` | 29 patikros su tikru HTML |
| `onclick` | `python3 tools/onclick-patikra.py` | Neegzistuojančios funkcijos |
| Tokenai | `python3 tools/tokenu-patikra.py` | Sulūžę ir dubliuoti tokenų ryšiai |

**Sargai neleidžia skolai AUGTI:** esama skola užfiksuota kaip riba, testas krenta tik kai skaičius pakyla. **Sutvarkius dalį – riba nuleidžiama tame pačiame commit'e.** Ribos kėlimas yra sąmoningas sprendimas, rašomas žurnale.

**Naujas puslapis privalo būti įtrauktas į visų sargų sąrašus.** (Šiandien `admin.html` nėra `dizainas.test.js` sąraše – todėl jo skola nematoma.)

---

## 7. Po pakeitimo – privaloma seka

1. `frontend/versijos.js` – naujas įrašas viršuje (`Y` = funkcija, `Z` = pataisymas), pakeitimai naudotojo kalba.
2. Playwright regresija: 1400 px ir 390 px, **0 JS klaidų konsolėje**.
3. Sargai iš 6 skyriaus – tie, kuriuos pakeitimas liečia.
4. Klaidų sąrašo būsenos: ką ši versija ištaiso → `laukia-patikros` su eilute `KA PATIKRINTI:`.
5. Jei rašyta į `ZURNALAS.md` arba `BUSENA.md` – atsakyme Lukui atskira eilutė: **„Parašykit dizaineriui: Patikrink žurnalą"**.
6. `git push origin main` vykdo **tik Lukas**, PowerShell'e, atskiromis eilutėmis.

---

## 8. Penkios tylių klaidų formos

Šios klaidos neduoda nei ekrano, nei žurnalo įrašo – jos tiesiog laukia:

1. **Negyvas tokenas** – `var(--x)`, kurio niekas neapibrėžė. Elementas gauna numatytąją reikšmę ir atrodo „beveik gerai".
2. **Negyva klasė** – CSS taisyklė selektoriui, kurio HTML'e nėra.
3. **Gyvas vardas be aprašymo** – klasė yra, CSS jai nėra.
4. **`onclick` be funkcijos** – `ReferenceError` konsolėje, kurios niekas nežiūri; naudotojui mygtukas tiesiog negyvas.
5. **Buvo teisinga, kol aplinka buvo kitokia** – kodas rėmėsi tuo, ką ką tik perėmė kitas sluoksnis.

Pirmas keturias randam klausdami *„kas dar to nenaudoja?"*.
Penktą – tik klausdami *„kas rėmėsi tuo, ką ką tik pakeičiau?"*. Po kiekvieno skyriaus, kuris **perima** elementą iš kito valdymo, peržiūrimas ne naujas kodas, o senas, kuris tam elementui tarnavo.
