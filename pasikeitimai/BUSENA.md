# Būsena · 2026-09-22 · v2.7.2 gyva

Tik **atviri** punktai. Uždaryti — `ZURNALAS.md` / `archyvas/`. Kas laukia Luko — `LUKUI.md`.
Klaidos gyvena `/admin.html` (šiuo metu 6 atviros, visos — Luko ėjimas).

## Klaudijus

| Nr. | Kas | Trumpai |
|---|---|---|
| Darbo sistema | DARBO-SISTEMA v2, fazė A | Vykdoma. Kol nebaigta — produkto darbai stovi (Luko sprendimas). |
| TA integracija | `docs/UZDUOTIS-ta-integracija.md` | Analitiko paruošta užduotis (TA rida 99 % vs Regitra 17 %). Po fazės C. |
| `.ct-std-card` matavimas | prieš 46b | `.ct-std-card` vs `.ct-top-card`: fonas, rėmelis, radiusas, paraštė (dizainerio prašymas, D-41). |
| Nr. 42 pabaiga | `#sort-bar` iš ct-dizainas.css 609 ir 623 sąrašų | Dizaineris leido daryti Klaudijui. Kartu trinti 16 bloką. |

## Dizaineris

| Nr. | Kas | Trumpai |
|---|---|---|
| Prieiga | `Downloads\cartriige-dizaineriui` | Tikros kopijos (junction'ai neveikė). Patikra: `ct-priedai.css` eil. sk. + ši pirma eilutė. |
| 46b | 4 benamiai vardai: `.ct-sort`, `.ct-std-card`, `.dp-desine`, `.ct-papf` + „Kaip vertiname?" eilutė `#dp-panel` | 46 atšauktas (D-41). **48 Errata 7 gautas, laukia 46b** — diegiami kartu. Įdiegus trinami priedų 16, 17, 18, 20 blokai ir senos `.ct-std-card` taisyklės (index 1337 tik 3 savybės, 1534 „BŪTINA", 2173, compare.html, **ct-bendras.css**; 2144–2151 neliesti). |
| `#search-btn` | 5-as ID mygtukas | Gradientas / švytėjimas / `:disabled` sistemoje ar vientisas CTA? Z-93. |
| Kiti vardai | `.ct-btn-accent` (priedų 5), `.ct-regitra` (15), `.mg-atn-busena` (12), `.ct3-portal-ico` | Dizaineris pažadėjo kitame pakete. |
| Tab žiedas | `--focus-offset` (43 pk.) | Vizualiai nepatikrinta — laukia Luko. |

## Analitikas

| Nr. | Kas | Trumpai |
|---|---|---|
| TA | Pilna `ta-modeliai.json` iš ~12,2 mln. įrašų (`tools/ta-suvestine.py`) | Parsisiuntimas `tools/ta-parsisiuntimas.py` vyksta (Klaudijus). Repo dabar – bandomasis X5 failas: **necommit'inti**, kol Analitikas neperrašys pilnu. Duomenys iki 2025-05-28. |
| K-33 | Registro raktų logika (`BMW 5ER`, `530`, `SERIE`…) | `modelis_dalys()` + pergeneruotas `regitra-modeliai.json` — diegiam vienu commit'u. |
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
| 12 | mėgstamiausių būsenos eilutė | kitas paketas (`.mg-atn-busena`) |
| 15 | Regitros punktai | kitas paketas (`.ct-regitra`) |
| 16 | `#sort-bar` kaukė | Nr. 42 pabaiga (Klaudijus) |
| 17, 18, 20 | `.ct-std-card`, `.dp-desine`, `.ct-papf` | 46b |

## Kur kas guli

- Taisyklės: `TAISYKLES.md` · Planas: projektas „Cartriide" → `claude/DARBO-SISTEMA.md`
- Versija: `frontend/versijos.js` — vienintelė vieta
- Dizainerio veidrodis: `tools/veidrodis-dizaineriui.ps1` (po kiekvieno commit'o)
- Filtrų plėtra: `FILTRAI-PASIULYMAS.md` · Regitros galimybės: `REGITRA-GALIMYBES.md`
