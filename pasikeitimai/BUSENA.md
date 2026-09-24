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
| Stabdis | Kiekis portaluose + kaina + stabdis + Stop | **Dalis padaryta v2.15.0:** puslapių pasirinkimas iki „visų“ + kainos riba (`PAIESKOS_RIBA_KR`, 200 kr.) su langu „per didelė paieška“. Liko: Stop mygtukas (KL-STOP), kiekis portaluose prieš paiešką (DZ-LENTELE) ir admin kreditų rodinys pagal vartotoją (KL-F3PLUS). |
| Modelio apžvalga | „Analizuoti modelį“ (Luko prašymas 09-24) | **Padaryta v2.16.0:** mygtukas po paieškos, Regitros/TA/mūsų kainų istorijos skaičiai + AI su web paieška, 2 kr., talpykla 30 d. Liko: gyva patikra produkcijoje ir dizainerio langas (inline stiliai). |
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
| 56a paskyra | Įdiegta (v2.11.0) | 47 sk., Errata 9, akcentas mėlynas (tokenai). Ranka rašyta violetinė liko ~60 vietų (Z-124). |
| 57 paketas | Įdiegta (v2.11.0) | Sprite 6, `[hidden]`, C1, C2. K-57a `.ct-bar` 1260 currentColor; K-57b ct-bendras `:root` 1–23. C3 – VIOLETINE-GREP.md. |
| `48 sk.` admin | Įdiegta (v2.12.1) | `.pg-adm`, `.adm-*`. Skirtukai — esami `.ct-tabs`. Markupas ir JS — Klaudijaus (suvestinė, vartotojai, užklausos). |
| `49 sk.` Nr. 30 | Įdiegta (v2.12.1) | `.ct-hdr-plan` + `.ct-avatar` šešiuose puslapiuose; JS deda `is-low` (<5) / `is-zero` (0) ant `<u>`. |
| 1 sk. komentarai | Įdiegta (v2.12.1) | Violetinė → mėlyna, 3,7 / 5,2, `--shadow-panel` gyvas nuo 58 pk. |
| Užsakymas ≠ serveris | Dizaineriui | „7 d.“, „AI apžvalgos“, „paskutinis aktyvumas“ — laukų nėra. DZ-SUVESTINE laukia Luko. |
| ~~K-60~~ | `.adm-chart > span[style*="--v:0"]` | Pagauna ir `--v:0.345` — visi stulpeliai tapdavo pilki 2 px. Apeita: reikšmės rašomos be nulio priekyje (`--v:.345`). |
| ~~K-61~~ | `.adm-share` po Erratos 12 | Bazėje `align-items: center` (grid), Errata perjungia į `flex-direction: column` jo nenuėmusi — juosta 0 px. Priedų 22 blokas. |
| ~~K-62~~ | `.adm-users` 3 ir 7 stulpeliai | `2026-10-19` mono 12 px netelpa į 92 px: eilutė 68 px vietoj 52. Priedų 23 blokas (tik ≥641 px). |
| ~~K-63~~ | `.adm-fund-scale` telefone | **Uždaryta** (Errata 14, v2.13.2). Visi keturi K-60…K-63 uždaryti. |
| 60 navy | Įdiegta (v2.13.0) | Devyni `:root` tokenai; Erratos lokalus blokas ištrintas. 43 ranka rašytos vietos pakeistos, 0 lopų po matavimo. |
| K-64 | `.ct-fld-x` per `--bg-base` | **Uždaryta** (Errata 13, v2.13.1). |
| `:root` dubliai | Ištrinti (v2.13.1) | index ×2, compare ×2, detail ×1. `--bg-card` buvo vienintelis niekur nenaudotas tokenas. |

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
| ~~1~~ | `.ct-card .ct-photo img` / `.ct-thumbs img` | **Ištrintas** (v2.13.5). Matavimas su tikru markupu: pokyčių nėra. |
| ~~2~~ | `.ct-l3 > .ct-istorija` | **Perimta į 39 sk.** (Errata 16, v2.13.4). |
| ~~K-65~~ | `.ct-photo` pervadinimas | **Atšauktas** – tikrasis markupas jau atitinka sistemos 1 sk. struktūrą. Mano klaida: skaičiau `index.html` CSS, ne JS piešiamą markupą. |
| 8 | `#more-filters` iš inline | NETRINTI (mūsų) |

Blokai 3–7, 9–23 jau ištrinti. Gyvų taisyklių faile – 7 (trys blokai).



## Kur kas guli

- Taisyklės: `TAISYKLES.md` · Planas: projektas „Cartriide" → `claude/DARBO-SISTEMA.md`
- Versija: `frontend/versijos.js` — vienintelė vieta
- Dizainerio veidrodis: `tools/veidrodis-dizaineriui.ps1` (po kiekvieno commit'o)
- Filtrų plėtra: `FILTRAI-PASIULYMAS.md` · Regitros galimybės: `REGITRA-GALIMYBES.md`
