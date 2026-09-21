# Lukui · 2026-09-22

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min. Perrašo Klaudijus po kiekvieno leidimo.

## Leidimai
- Nieko nelaukia. A fazė išsiųsta 2026-09-22 (deploy SUCCESS).

## Perdavimai
- [x] Fazė C praėjo visi. `PLETRA.md` projekte (įrašė Klaudijus), `SAVIKAINA.md` – Finansininkas pats.
- [ ] Finansininkui: Q-4–Q-7 atsakyta `SAVIKAINA-DUOMENYS.md` §6. Plano kaina, PVM – iš tavęs.

## ScraperAPI (nebe skubu)
- Sąskaita: Hobby 49 $, **34 846 / 100 000** šį ciklą, atsinaujina **10-16**, pasiekus ribą – sustoja (be automatinio brangesnio plano). Mūsų admin skaitliukas (87 741) klaidingas – taisymas F-3+.
- Tempas kūrimo savaitę ~5 800 kr./d. → jei nesumažės, riba ~10-03. Po savaitės pažiūrėk Usage dar kartą.

## Sprendimai (vienu žodžiu)
| Nr. | Klausimas | Variantai |
|---|---|---|
| Nr. 46 | Regitra: ką dar rodyti prie skelbimų? Sąrašas `REGITRA-GALIMYBES.md`. Siūlau 3: importo tendencija, pavarų dėžė, kilmės šalis | „3" / „visi" / „nieko" / sąrašas |
| D-03 | Skelbimo puslapyje – grąžinam šešis skydelius (AI, tech, rizikos, VIN, rinka, pardavėjas) ar lieka skirtukai? | skydeliai / skirtukai |
| F-1 | Verslo planas „neribota“ → riba (pvz. 600 paieškų/mėn.) arba LT paieška skaičiuojama už 2 | riba / už 2 / palikti |
| F-2 | Pro 100 → 60 paieškų, arba LT paieška už 2 | 60 / už 2 / palikti |
| F-3 | Įspėjimas tau, kai ScraperAPI fondo lieka < 20 % (dabar jau 12 %) | taip / ne |
| F-3+ | Sargas + paros ScraperAPI žurnalas diske (kiek kr. per dieną ir iš kur) + teisingas likučio skaitliukas. ~1 leidimas, 0 kr. | taip / ne |
| R-1 | Kainos istorija kortelėje: „↓ 1 500 € per 9 d.“ + mini grafikas. Duomenys jau renkami, 0 ScraperAPI kr. | taip / vėliau |
| R-2 | Ridos atsukimo žyma pagal VIN (tas pats VIN vėliau su mažesne rida). Duomenys yra, trūksta VIN indekso | taip / vėliau |
| P-1 | Plėtros tikslinės grupės A perpardavėjai (prioritetas), B pirkėjai, C vienkartiniai | taip / keisti |
| P-2 | Verslo planą kol kas duoti ne daugiau kaip 1–2 klientams (kol F-1 neišspręstas) | taip / ne |
| P-3 | Paprašyti carVertical / autoDNA B2B kainų (tik užklausa, jokio kodo) | taip / ne |
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
