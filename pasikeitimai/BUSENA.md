# Būsena · 2026-09-22 · v2.10.0 gyva (v2.10.1–v2.10.3 laukia push)

Tik **atviri** punktai. Uždaryti — `ZURNALAS.md` / `archyvas/`. Kas laukia Luko — `LUKUI.md`.
Klaidos gyvena `/admin.html` (šiuo metu 6 atviros, visos — Luko ėjimas).

## Klaudijus

Eilė pagal Luko KL-PRIORITETAS (klaidos pirma), tada Luko 09-22 sprendimai.

| Nr. | Kas | Trumpai |
|---|---|---|
| Nr.45 | Otomoto pilna apžvalga be analizės ir nuotraukų | Luko „Neveikia“. Testuoti tik su įrašytu HTML (iki 10-16). |
| Nr.30 | Antraštė index ≠ mėgstamiausi | Luko „Neveikia“. |
| Nr.47 | Neatitinkantys filtrų (autogidas iškelti) rodomi „Kiti skelbimai“ | Nerodyti visai, rinkos kainai lieka. |
| Kuras | Griežtas kuro filtras (KL-PUSH-0922E) | Tik pasirinktas kuras; variantai: Dyzelinas, Benzinas, Benzinas/dujos, Benzinas/elektra, Elektra, Dyzelinas/elektra. Push v2.10.1–2 – po šito, su nauju leidimu. |
| 53 paketas | `card` klasė nuo apvalkalo (DZ-KORTELES: visi trys) | v2.11.0; prieš – JS `closest('.card')` / `.card` paieška. |
| Stabdis | Kiekis portaluose + kaina + stabdis + Stop | KL-STABDIS-SUMA (Finansininko ribos kreditais + fondo sargas + admin kreditų/likučio rodinys), KL-STABDIS-ADMIN (blokuoti + „tik naujausi už leistiną“), KL-STOP (sustabdyti ir rodyti rastus). Dizainas – laukia KL-STOP-DIZAINAS. Užsienio limitas nuimamas pirmas. |
| Teisininkas | KL-TEISININKAS: taip | Faktų dokumentas iš kodo, pirma žinutė, rolė DARBO-SISTEMA. |
| KL-PATIKRA2 | Filtrai kaip autoplius | Metai, kaina, rida, galia – sąrašai; neįvesta → „–“; varantieji ratai ir kuras – autoplius variantai. |
| FN-0922-1300 | Nauji planai `planai.js` + LT/užsienio paieškų skaidymas | Iki 10-15. |
| KL-R1 / KL-R2 | Kainos kritimo žyma; atsuktos ridos įspėjimas | Luko „taip“. 0 kreditų. |
| KL-F3PLUS | ScraperAPI paros žurnalas + <20 % įspėjimas | Luko „taip“; jungti su stabdžio admin rodiniu. |
| KL-MODELIS | Sonnet 5 bandymas 3–5 apžvalgomis | Mokama – su Luko žinia. |
| DZ-TINDER | „Tinder“ perdarymas | Dizainas + kodas. |

## Dizaineris

| Nr. | Kas | Trumpai |
|---|---|---|
| Prieiga | `Downloads\cartriige-dizaineriui` | Tikros kopijos (junction'ai neveikė). Patikra: `ct-priedai.css` eil. sk. + ši pirma eilutė. |
| `#search-btn` | 5-as ID mygtukas | Gradientas / švytėjimas / `:disabled` sistemoje ar vientisas CTA? Z-93. |
| Kiti vardai | `.ct-btn-accent` (priedų 5), `.ct-regitra` (15), `.mg-atn-busena` (12), `.ct3-portal-ico` | Dizaineris pažadėjo kitame pakete. |
| Tab žiedas | `--focus-offset` (43 pk.) | Vizualiai nepatikrinta — laukia Luko. |
| `.ct-istorija` užpildas | 12 (veikia, index 2144 `!important`) ar 14 (1340, niekada nesuveikė) | Dizaineris spręs, kai ims istorijos juostą (D-48). Iki tol 2144 neliečiama. |
| `.card.ct-card` (index 1138) | `margin-bottom:14px; border-radius:16px`, specifiškumas 0,2,0 | Nugali 52 paketo `--s-2`/`--s-3` ir `.ct-card` 14 – tikras tarpas TOP ir STD 14, radiusas 16 (Z-111). Dizaineris sprendžia, ar perimti. |
| `46 sk.` `.ct-portals` | Įdiegta CSS (v2.10.8) | Markupas (`--cols`, `data-k`) – su stabdžiu kartu su 54 paketu. K-55a: 352 px „Iš viso“ fonas lopais. |
| `.ct-modal` dubliai | Sutraukta (v2.10.8) | Pirmas blokas ištrintas, `.ct-modal-x` ir `overflow` perkelti. |
| 54 paketas | Laukia | Diegiama kartu su stabdžiu (`54-vykdymo-busena-v2.zip`). |
| Paskyra + admin zona | Užsakymas išsiųstas | Klaudijaus blokas 09-22 (per Luką). |

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
| 21 | `.ct-kartos-hint` (kėbulo kartos po filtrais) | dizaineris – perimti į sistemą |

## Kur kas guli

- Taisyklės: `TAISYKLES.md` · Planas: projektas „Cartriide" → `claude/DARBO-SISTEMA.md`
- Versija: `frontend/versijos.js` — vienintelė vieta
- Dizainerio veidrodis: `tools/veidrodis-dizaineriui.ps1` (po kiekvieno commit'o)
- Filtrų plėtra: `FILTRAI-PASIULYMAS.md` · Regitros galimybės: `REGITRA-GALIMYBES.md`
