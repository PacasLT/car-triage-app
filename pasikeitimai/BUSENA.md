# Būsena · atnaujinta 2026-09-18, v1.76.0

Perrašyta iš žurnalo (Z-20, D-17), ne iš atminties.

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-10 | `.ct3-search-bottom-left` viena eilė | **Dizaineris** | Liko 58 px h. slinkimo po v3. Viena eilutė (`flex-wrap: wrap`), pamatuota 58 → 0. Šiandien `ct-priedai.css` 9 bloke. |
| K-11 | Portalai telefone paslėpti | **Dizaineris** | `index.html` `display:none` ties 480 ir 400 px — senesnė už perkėlimą. Jei portalai retas filtras, telefone jie nepasiekiami (`K-06` iš kitos pusės). Trinam? |
| D-16 | 13 paketas · vartotojo ekranas | **Klaudijus** | Naujo CSS nereikia. Reikia: `created_at` `visiVartotojai()` sąraše + `PLANAI` objektas naršyklei. Svarbiausia — patvirtinimo kortelė visiems trims planams. |
| D-03 | Skelbimo puslapio 3 dalis | **Dizaineris** | Paketas 07 rezervuotas. Uždaro Nr. 9, 10, 18. **Svarbu:** iki v1.76.0 tie skydeliai apskritai nebuvo rodomi (`dpTab` nebuvo apibrėžta). |
| V-05 | Daužtų skelbimų kortelė | **Klaudijus** | `.risk-banner` aprašytas dukart `index.html` (219 ir 1050). |
| Nr. 22 | Admin sąrašas neatsinaujina | **Klaudijus** | Būsena pakeista telefone, web rodė seną. Reikia peržiūrėti `mk-admin.py` atnaujinimą po POST. |
| Nr. 12, 19, 2 | Pločio pranešimai | **Lukas** | Patikrinti po v1.75.0 / v1.76.0 — filtrai šone, turinys iki 1600 px. |
| L-01 | Nr. 15 · BMW X4 lizingas | **Lukas** | Kokią sumą kortelė rodo — 739 ar 4749. |
| L-04 | `/admin/atsarga` rezultatas | **Lukas** | Puppeteer sprendimas; priminimas 09-19 11:30 UTC. |
| L-05 | `KLAIDU_RAKTAS` rotacija | **Lukas** | Priminimas 09-19 13:15 UTC. |

## Kas uždaryta paskutiniu metu

- v1.76.0 — 30 sk. v3: šonas 746 → **540 px**, telpa nuo 1180 px; skirtukai į rezultatų stulpelį, portalai į „Daugiau filtrų"
- v1.76.0 — **Nr. 20**: `dpTab` nebuvo apibrėžta — septyni skirtukai `detail.html` metė `ReferenceError`, matomas buvo tik AI skydelis
- v1.76.0 — **Nr. 21**: pranešimo mygtukas telefone gulėjo ant širdelės (390 px: FAB 675–719, širdelė 664–731)
- v1.75.0 — 25 sk. `.ct-shell`; `.container.is-wide`; `ERRATA-header-h` (65/69/97 pamatuoti)
- D-17 — dizaineris perėmė `.ct3-search-inner`, `.ct3-search-tabs`, `.ct3-portals-row`, `.ct3-search-bottom` į 30 sk.
- v1.74.0 — ERRATA-2: `ct-mygtukai.css` 422–428 pakeista

## Kur kas guli

- Dizainerio failai: `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css`
- `frontend/ct-priedai.css` — **1, 2** (seni), **7, 8** (mūsų, NETRINTI),
  **9** (vienintelė laikina atsvara, laukia `K-10`)
- Generuojami puslapiai: `frontend/admin.html` ← `tools/mk-admin.py`
- Patikros: `tools/onclick-patikra.py` (ar `onclick` funkcijos egzistuoja), `tools/klaidos.js`
- Versija ir istorija: `frontend/versijos.js` — **vienintelė vieta**
- Visos projekto taisyklės: `CLAUDE.md`

## Atviri matavimai

1. **13 paketas** — 1280×720 šonas su `.ct-sidenav`; 390 px žurnalo lentelė
   (šeši stulpeliai, ties `A-05` riba); patvirtinimo kortelė visiems trims planams.
2. `--text-on-light` penkiose vietose — jokio vizualaus pokyčio neturi būti.
3. Lietimo planšetė 768 / 1024 px po ERRATA-2.
