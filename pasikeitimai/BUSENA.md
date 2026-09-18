# Būsena · atnaujinta 2026-09-18, v1.56.0

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-03 | `.ct-kv` vardas irgi užimtas | **Dizaineris** | Senasis `.ct-kv` = eilutė, naujas = konteineris. Pamatuota: trys eilutės sugultų į vieną (y 27/27/27). 24 sk. sustabdytas. |
| D-03 | Skelbimo puslapio 3 dalis | **Dizaineris** | Kortelės, rinkos padėties skalė, pardavėjo kortelė. Laukiam paketo 07. |
| L-04 | `/admin/atsarga` rezultatas | **Lukas** | Po paros veikimo pažiūrėti skaičius ir nuspręsti dėl Puppeteer. Priminimas 09-19 14:30. |
| L-05 | `KLAIDU_RAKTAS` įjungimas | **Lukas** | Sugeneruoti raktą, įdėti į Railway Variables ir `backend/.env` kartu su `CT_URL`. Iki tol klaidų sąrašo nematau. |

## Kas uždaryta paskutiniu metu

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
