# Lukui · 2026-09-22

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min. Perrašo Klaudijus po kiekvieno leidimo.

## Leidimai
- Nieko nelaukia. A fazė išsiųsta 2026-09-22 (deploy SUCCESS).

## Perdavimai
- [ ] Claude Design → „+" → **Link local** → `Downloads\cartriige-dizaineriui` – jei dar nepadaryta. Dizainerio testas: 291 eil. + „# Būsena · 2026-09-22 · v2.7.2 gyva".
- [x] Fazė C: dizaineris, Plėtra, Finansininkas – praėjo. Analitikas – jo failai jau commit'inti (v2.1.0), `regitra.test` 101/101.
- [ ] Finansininko `SAVIKAINA.md` ir Plėtros `PLETRA.md` tekstą įklijuoti Klaudijui – jie projekto rašyti negali, įrašys Klaudijus.
- [ ] Plėtros rinkos duomenų specifikaciją (daryta Claude Code) persiųsti Klaudijui – sutikrins su Regitros darbu.
- [ ] Finansininkui: ScraperAPI plano kaina + atsinaujinimo data; ar esi PVM mokėtojas.

## ⚠ Skubu
- **ScraperAPI: panaudota 87 741 iš 100 000 (88 %).** Liko ~12 000 kr. ≈ 85–200 LT paieškų. Jei ciklas atsinaujina negreit – nepaleisti didelių skenavimų ir apsvarstyti papildymą.

## Sprendimai (vienu žodžiu)
| Nr. | Klausimas | Variantai |
|---|---|---|
| Nr. 46 | Regitra: ką dar rodyti prie skelbimų? Sąrašas `REGITRA-GALIMYBES.md`. Siūlau 3: importo tendencija, pavarų dėžė, kilmės šalis | „3" / „visi" / „nieko" / sąrašas |
| D-03 | Skelbimo puslapyje – grąžinam šešis skydelius (AI, tech, rizikos, VIN, rinka, pardavėjas) ar lieka skirtukai? | skydeliai / skirtukai |
| F-1 | Verslo planas „neribota“ → riba (pvz. 600 paieškų/mėn.) arba LT paieška skaičiuojama už 2 | riba / už 2 / palikti |
| F-2 | Pro 100 → 60 paieškų, arba LT paieška už 2 | 60 / už 2 / palikti |
| F-3 | Įspėjimas tau, kai ScraperAPI fondo lieka < 20 % (dabar jau 12 %) | taip / ne |
| Data plugin | Įjungti Analitiko sesijoje (be BigQuery/Snowflake)? Naudos nedaug. | taip / ne |

## Patikra produkcijoje
**admin: 5 laukia tavęs** → `/admin.html` (Nr. 40, 42, 45, 30, 10 – kiekviename „KĄ PATIKRINTI"). Veikia/Neveikia.

Be admin:
| Kas | Kur | Ką pažiūrėti |
|---|---|---|
| Nr. 37 portalų langas | paieška → „Portalai" | ar dar „ne pagal dizainą"; jei taip – vienas žodis: plotis / kraštas / spalva / šriftas |
| Nauji filtrai v2.7.2 | „Daugiau filtrų" | kėbulas, pardavėjas, įdėta per, kaina žemiau rinkos, balas – paieška su vienu iš jų |
| Tamsūs sąrašai | MARKĖ išskleisti | tamsus fonas, tekstas matomas |
| Tab žiedas | 1280 px, spaudinėk Tab | mygtukų rėmelis kaip anksčiau |
| Slinkties juostos, autofill | bet kur / prisijungimo el. paštas | tamsios, ne mėlynas fonas |
