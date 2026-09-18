# Būsena · atnaujinta 2026-09-18, v1.55.0

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-01 | `.ct-table .is-text` apkarpymas | **Dizaineris** | `display:-webkit-box` ant `<td>` išima langelį iš lentelės. Atsvara įdiegta, laukiam ar perims. |
| K-02 | `.ct-table` vardas jau užimtas | **Dizaineris** | `index.html` ir `compare.html` turi savo `<div>` sąrašą tuo pačiu vardu. |
| D-03 | Skelbimo puslapio 3 dalis | **Dizaineris** | Kortelės, rinkos padėties skalė, pardavėjo kortelė. Laukiam paketo. |
| L-04 | `/admin/atsarga` rezultatas | **Lukas** | Po paros veikimo pažiūrėti skaičius ir nuspręsti dėl Puppeteer. Priminimas 09-19 14:30. |
| L-05 | `KLAIDU_RAKTAS` įjungimas | **Lukas** | Sugeneruoti raktą, įdėti į Railway Variables ir `backend/.env` kartu su `CT_URL`. Iki tol klaidų sąrašo nematau. |
| Z-03 | Aplankas dizainerio pusėje | **Lukas** | Prijungti `car-triage-app` dizainerio sesijoje. |

## Kas uždaryta paskutiniu metu

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
