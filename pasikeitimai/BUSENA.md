# Būsena · 2026-09-22 · v2.7.2 gyva

Tik **atviri** punktai. Uždaryti — `ZURNALAS.md` / `archyvas/`. Kas laukia Luko — `LUKUI.md`.
Klaidos gyvena `/admin.html` (šiuo metu 6 atviros, visos — Luko ėjimas).

## Klaudijus

| Nr. | Kas | Trumpai |
|---|---|---|
| Darbo sistema | DARBO-SISTEMA v2, fazė A | Vykdoma. Kol nebaigta — produkto darbai stovi (Luko sprendimas). |
| TA integracija | `docs/UZDUOTIS-ta-integracija.md` | Analitiko paruošta užduotis (TA rida 99 % vs Regitra 17 %). Po fazės C. |

## Dizaineris

| Nr. | Kas | Trumpai |
|---|---|---|
| 46b+48+50 | v2.9.0 įdiegta lokaliai | Laukia push (Luko eilė KL-PUSH-0922) ir matavimų produkcijoje: rūšiavimo meniu 390, kaukė `.dp-tabs`/`.ct-tabs`, „Kiti skelbimai“ 1920 (1235 px, `.ct-reject` viršuje, paviršius nepakitęs), detalė 1440 (572), „Daugiau filtrų“ nepakitę, „Planas“ užvedus baltas. |
| `.ct-std-card` paviršius | kitam paketui | Matavimas `.ct-std-card` vs `.ct-top-card`: background, border-color, border-radius, margin-bottom (48 PASTABOS 4). |
| Prieiga | `Downloads\cartriige-dizaineriui` | Tikros kopijos (junction'ai neveikė). Patikra: `ct-priedai.css` eil. sk. + ši pirma eilutė. |
| `#search-btn` | 5-as ID mygtukas | Gradientas / švytėjimas / `:disabled` sistemoje ar vientisas CTA? Z-93. |
| Kiti vardai | `.ct-btn-accent` (priedų 5), `.ct-regitra` (15), `.mg-atn-busena` (12), `.ct3-portal-ico` | Dizaineris pažadėjo kitame pakete. |
| Tab žiedas | `--focus-offset` (43 pk.) | Vizualiai nepatikrinta — laukia Luko. |

## Analitikas

| Nr. | Kas | Trumpai |
|---|---|---|
| K-29 | Nurašymų riba 40 vs 50 | Su amžiaus vartais 40 nebėra triukšmingas. Z-52. |
| K-30 | Ar `rida_kv` naudotinas skelbimui | Normalus 2–4 m. X5 gautų klaidingą 🟡. Z-52. |

## Lukas

Žr. `LUKUI.md`.

## `ct-priedai.css` blokai (laikini, laukia dizainerio)

| Blokas | Kas | Perims |
|---|---|---|
| 1, 2 | senos kortelės taisyklės, `.ct-istorija` trečiame lygyje | 46b (`.ct-std-card`) |
| 5 | `.ct-btn-accent` | kitas paketas (dizainerio pažadėta atmaina) |
| 8 | `#more-filters` iš inline | NETRINTI (mūsų) |
| 16 | `#sort-bar` kaukė | Nr. 42 pabaiga (Klaudijus) |
| 17, 18, 20 | `.ct-std-card`, `.dp-desine`, `.ct-papf` | 46b |

## Kur kas guli

- Taisyklės: `TAISYKLES.md` · Planas: projektas „Cartriide" → `claude/DARBO-SISTEMA.md`
- Versija: `frontend/versijos.js` — vienintelė vieta
- Dizainerio veidrodis: `tools/veidrodis-dizaineriui.ps1` (po kiekvieno commit'o)
- Filtrų plėtra: `FILTRAI-PASIULYMAS.md` · Regitros galimybės: `REGITRA-GALIMYBES.md`
