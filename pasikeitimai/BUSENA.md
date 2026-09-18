# Būsena · atnaujinta 2026-09-18, v1.60.0

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-03 | `.ct-kv` vardas irgi užimtas | **Dizaineris** | Senasis `.ct-kv` = eilutė, naujas = konteineris. Pamatuota: trys eilutės sugultų į vieną (y 27/27/27). 24 sk. sustabdytas. |
| K-05 | Administravimo panelės maketas | **Dizaineris** | Karkasas geras; keturi klausimai: tikri skaičiai, moderavimo eilė, atskira antraštė, 880 px kortelės. Užduotys – `UZDUOTYS-ADMIN.md`. |
| K-04 | Maketas už 1240 px ir po 385 px | **Dizaineris** | Du vartotojo pranešimai per valandą: 3152 px – 976 px tuščios; 385 px – nuotrauka apkarpyta. Plius tuščia `.ct3-nav`. |
| V-07 | Atmesti skelbimai (pranesimas Nr.2) | **Klaudijus** | Laukia nuotraukos perziuros. |
| K-06 | `compare.html` be bendros antrastes | **Dizaineris** | Turi `.ct3-header` CSS, bet neturi markupo. |
| V-05 | Daužtų skelbimų kortelė | **Klaudijus** | `.risk-banner` aprašytas dukart `index.html` (219 ir 1050). Tiriama. |
| D-03 | Skelbimo puslapio 3 dalis | **Dizaineris** | Kortelės, rinkos padėties skalė, pardavėjo kortelė. Laukiam paketo 07. |
| L-04 | `/admin/atsarga` rezultatas | **Lukas** | Po paros veikimo pažiūrėti skaičius ir nuspręsti dėl Puppeteer. Priminimas 09-19 14:30. |

## Kas uždaryta paskutiniu metu

- v1.64.0 - pranesimas Nr.3 uzdarytas: ispletus nebesikartoja zenkliukai (patikrintos abi sakos, 0 dubliu)
- v1.63.0 - 09 paketas: `.ct-specs`, hero, meniu juosta; aktyvios nuorodos klaida istaisyta
- v1.60.0 — **`fs` nebuvo įreikalautas `server.js`**: pranešimai niekada nebuvo rašomi į diską. Ištaisyta, patikrinta perkrovimu
- v1.60.0 — `/admin/atsarga` rodo, kur guli duomenys; `/data` Volume patvirtintas kaip persistentinis
- v1.59.0 — „Atkurti / Patikrinti užklausas / Kopijuoti" prie kiekvieno pranešimo
- v1.58.0 — neišsiųstas pranešimas nebedingsta
- v1.57.0 — rodinys „Viskas tekstu"
- v1.56.0 — A-01 įdiegtas: 23 sk. `.ct-clamp`, 22 sk. 1630 eil., `ct-priedai.css` 6 blokas ištrintas (0 px, 0 JS klaidų)
- Z-03 — `car-triage-app` prijungtas dizainerio sesijoje, perdavinėjimas ranka baigtas
- v1.55.0 — klaidų sąrašas pasiekiamas raktu (`tools/klaidos.js`), be trynimo ir be vartotojų
- v1.54.0 — 22 sk. (lentelės ir tuščios būsenos) įdiegtas, patikrintas, 0 JS klaidų
- v1.54.0 — `.ct-report-fab` perimtas dizainerio, atsvara ištrinta
- v1.54.0 — 413 „Užklausa per didelė" ištaisyta (maršruto kūno riba + nuotraukos mažinimas naršyklėje)
- v1.53.0 — administravimo puslapis
- v1.52.0 — `diffPct` ženklas skelbimo puslapio rinkos skiltyje

## Kur kas guli

- Dizainerio failai: `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css`
- Laikinos atsvaros: `frontend/ct-priedai.css` (blokai 1, 2, 6)
- Generuojami puslapiai: `frontend/admin.html` ← `tools/mk-admin.py`
- Versija ir istorija: `frontend/versijos.js` — **vienintelė vieta**
- Visos projekto taisyklės: `CLAUDE.md`
