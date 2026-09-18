# Būsena · atnaujinta 2026-09-18, v1.75.0

Perrašyta iš žurnalo (Z-19, D-15), ne iš atminties.

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-09 | 25 sk. šonas netelpa ties 1280×720 | **Dizaineris** | 746 px turinio prie 599 px ribos. Trys keliai žurnale (Z-19 p. 4, K-09). Kol kas veikia `ct-priedai.css` 9 blokas. |
| D-16 | 13 paketas · vartotojo ekranas | **Klaudijus** | Naujo CSS nereikia. Reikia: `created_at` `visiVartotojai()` sąraše + `PLANAI` objektas naršyklei. Svarbiausia — patvirtinimo kortelė visiems trims planams. |
| D-03 | Skelbimo puslapio 3 dalis | **Dizaineris** | Paketas 07 rezervuotas. Uždaro Nr. 9, 10, 18. |
| V-05 | Daužtų skelbimų kortelė | **Klaudijus** | `.risk-banner` aprašytas dukart `index.html` (219 ir 1050). |
| V-07 | Atmesti skelbimai (Nr. 2) | **Klaudijus** | Laukia nuotraukos peržiūros; galimai uždarytas 25 sk. |
| L-01 | Nr. 15 · BMW X4 lizingas | **Lukas** | Kokią sumą kortelė rodo — 739 ar 4749. |
| L-04 | `/admin/atsarga` rezultatas | **Lukas** | Puppeteer sprendimas; priminimas 09-19 11:30 UTC. |
| L-05 | `KLAIDU_RAKTAS` rotacija | **Lukas** | Priminimas 09-19 13:15 UTC. |

## Kas uždaryta paskutiniu metu

- v1.75.0 — 25 sk. `.ct-shell` įdiegtas; `.container.is-wide`; `ERRATA-header-h` (65/69/97 pamatuoti ir sutampa)
- Z-19 — rasta, ko 30 sk. nepalietė: `.ct3-search-inner`, `.ct3-search-tabs`, `.ct3-portals-row`, `.ct3-search-bottom` (386 px h. slinkimo šone)
- D-15 — 13 paketas atsiųstas; plano keitimas rodys šalutinį poveikį skaičiais
- v1.74.0 — ERRATA-2: `ct-mygtukai.css` 422–428 pakeista; 11 paketo A blokas ištrintas
- v1.73.0 — 12 paketas: 30 sk. v2, 31 sk. `.ct-field`, `:root` auditas
- A-12 / A-13 — 30 sk. pamatuotas (C variantas), 31 sk. `.ct-field`

## Kur kas guli

- Dizainerio failai: `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css`
- `frontend/ct-priedai.css` — **1, 2** (seni), **7, 8** (mūsų, NETRINTI),
  **9** (vienintelė laikina atsvara, laukia `K-09`)
- Generuojami puslapiai: `frontend/admin.html` ← `tools/mk-admin.py`
- Versija ir istorija: `frontend/versijos.js` — **vienintelė vieta**
- Visos projekto taisyklės: `CLAUDE.md`

## Atviri matavimai

1. **13 paketas** — 1280×720 šonas su `.ct-sidenav`; 390 px žurnalo lentelė
   (šeši stulpeliai, ties `A-05` riba); patvirtinimo kortelė visiems trims planams.
2. `--text-on-light` penkiose vietose — jokio vizualaus pokyčio neturi būti.
3. Lietimo planšetė 768 / 1024 px po ERRATA-2 — mygtukai su užrašais,
   `min-height 44`, be fiksuoto pločio.
