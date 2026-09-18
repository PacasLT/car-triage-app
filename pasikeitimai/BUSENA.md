# Būsena · atnaujinta 2026-09-18, v1.77.0

Perrašyta iš žurnalo (Z-21, D-18), ne iš atminties.

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-13 | Nr. 23 · siauri filtrai tuščiame index | **Dizaineris** | Luko sprendimas: šoninis variantas turi atsirasti tik SU rezultatais. `.ct-shell` persijungia kai `#results` turi vaikų? |
| K-14 | Nr. 24 · šoninės panelės dizainas | **Dizaineris** | Be detalių; galiu atsiųsti matavimus ir ekranvaizdžius. |
| K-15 | Nr. 27 · hero tekstas | **Dizaineris** | Lukas prašo pašalinti `.ct3-hero-content`. 26 sk. dalis — neliečiu be atsakymo. |
| K-12 | Nr. 26 · portalų sąrašas šone | **Dizaineris** | `right: 0` siaurame stulpelyje duoda −32 px. Atsvara `ct-priedai.css` 9 bloke, pamatuota. |
| D-03 | Skelbimo puslapio 3 dalis | **Lukas** | Ar grąžinam šešis skydelius? Iš 27 pranešimų nė vienas nebuvo apie jų turinį. |
| D-16 | 13 paketas · vartotojo ekranas | **Klaudijus** | Reikia: `created_at` `visiVartotojai()` sąraše + `PLANAI` naršyklei. |
| Nr. 22 | Admin sąrašas neatsinaujina | **Klaudijus** | Būsena pakeista telefone, web rodė seną. |
| Nr. 20, 21 | dpTab ir FAB | **Lukas** | v1.76.0 gyva — patikrinti. |
| Nr. 25, 26 | Dekoracija ir portalų sąrašas | **Lukas** | Ištaisyta v1.77.0 — patikrinti po push'o. |
| Nr. 19, 2, 16, 15 | Seni pranešimai | **Lukas / Klaudijus** | Nr. 15 laukia Luko sumos; Nr. 16 laukia dizainerio mobile varianto. |
| L-04 / L-05 | `/admin/atsarga`, rakto rotacija | **Lukas** | Priminimai 09-19 11:30 ir 13:15 UTC. |

## Kas uždaryta paskutiniu metu

- v1.77.0 — Nr. 25 (dekoracinė „Search across Europe" juosta ištrinta), Nr. 26 (portalų sąrašas nebeiškrenta už stulpelio); `K-10` perimta į 30 sk.
- v1.76.0 — Nr. 20 (`dpTab` grąžinta), Nr. 21 (FAB virš širdelės); 30 sk. v3, šonas 746 → 540 px
- v1.75.0 — 25 sk. `.ct-shell`, `.container.is-wide`, `ERRATA-header-h`
- **Radinys:** `.ct3-portals-row` buvo dekoracija (0 valdiklių), ne filtras — `A-14` 2.1 taikytas ne tam elementui

## Kur kas guli

- Dizainerio failai: `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css`
- `frontend/ct-priedai.css` — **1, 2** (seni), **7, 8** (mūsų, NETRINTI),
  **9** (vienintelė laikina atsvara, laukia `K-12`)
- Patikros: `tools/onclick-patikra.py`, `tools/klaidos.js`
- Versija: `frontend/versijos.js` — **vienintelė vieta**

## Atviri matavimai

1. **13 paketas** — patvirtinimo kortelė visiems trims planams; 390 px žurnalo lentelė.
2. `--text-on-light` penkiose vietose — jokio vizualaus pokyčio neturi būti.
