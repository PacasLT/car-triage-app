# mobile.de — bandymas ir sprendimo medžiaga (2026-09-21)

Būsena: **kodas ir testai paruošti, į serverį nekelta.** Į bendrą paiešką
mobile.de neįjungtas — tik bandymo maršrutas `/admin/pavyzdys?portalas=mobilede`.

## 1. Kas jau žinoma (pamatuota naršyklėje, nemokamai)

| | |
|---|---|
| Tiesioginė užklausa be naršyklės | **403** (Akamai apsauga) |
| Kur duomenys | Pačiame HTML (Next.js RSC `searchResults` JSON) — **render nereikia** |
| Skelbimų puslapyje | 20 + iki 4 reklaminių (topOfPage / topInCategory, atmetami) |
| **Riba** | **100 puslapių = 2000 skelbimų vienai paieškai** (101-as grąžina 0) |
| Laukai | kaina (su PVM), rida, pirma registracija, kW, cm³, kuras, dėžė, miestas, šalis, pardavėjas/privatus, pardavėjo reitingas, **mobile.de kainos vertinimas** (GOOD_PRICE ir t. t.), lizingas, naujas/naudotas |
| Nėra paieškoje | nuotraukų, pavadinimo teksto, VIN — tik skelbimo puslapyje |
| Dydis | ~1,3 MB vienas puslapis |

Rinkos dydis (Vokietija, 2026-09-21): BMW nuo 2019 — **71 108**; BMW X5 nuo 2019 — 4 468;
Audi A6 — 9 493; VW Golf — 25 952; Mercedes E klasė — 7 913.

Visi 13 kodo sugeneruotų adresų patikrinti tikrame puslapyje: kiekvienas
filtras veikia (kuras, dėžė, kaina, rida, modelis, serija), sumos sutampa
(dyzelinas 29 478 + dyzelino hibridai 2 295 = 31 777 su filtru „dyzelis").

## 2. Variantai

| Variantas | Kaina | Ar praeis pro Akamai | Integracija |
|---|---|---|---|
| **A. ScraperAPI standartinis** | 1 kr./psl. | **Nežinoma** — reikia 1 bandymo | Paruošta |
| **B. ScraperAPI premium** | 10 kr./psl. | Tikėtina | Paruošta |
| **C. ScraperAPI ultra premium** | 30 kr./psl. | Labiausiai tikėtina | Paruošta (tik mokamam planui) |
| D. Apify „mobile.de scraper" | ~$9,99/mėn. + ~$0,3 / 1000 skelbimų | Jų rūpestis | Naujas servisas, naujas raktas, ~1 d. darbo |
| E. Oficialus mobile.de API | — | — | Tik prekiautojams su sutartimi; mums netinka |

## 3. Kiek kainuotų (kreditai ScraperAPI)

| Paieška | Puslapių | A (1) | B (10) | C (30) |
|---|---|---|---|---|
| Vienas vartotojo paieškos puslapis | 1 | 1 | 10 | 30 |
| BMW X5 nuo 2019, visi | ~224 | 224 | 2 240 | 6 720 |
| BMW nuo 2019, visa Vokietija* | ~3 560 | 3 560 | 35 600 | 106 800 |

\* Viršija 2000 ribą — reikia skaidyti pagal modelius (tas pats puslapių skaičius, daugiau užklausų).
Likutis dabar ~14 000 iš 100 000 per mėnesį.

## 4. Bandymas (reikia push'o ir ~41 kredito)

Trys užklausos, po vieną kiekvienu būdu, BMW X5 nuo 2019, 1 puslapis:

```
/admin/pavyzdys?portalas=mobilede&budas=standartinis&modelis=X5   ~1 kr.
/admin/pavyzdys?portalas=mobilede&budas=premium&modelis=X5        ~10 kr.
/admin/pavyzdys?portalas=mobilede&budas=ultra&modelis=X5          ~30 kr.
```

Kiekvienas atsakymas praneša: HTTP būseną, **tikrą kainą iš ScraperAPI antraštės
`sa-credit-cost`**, ar atpažinta Akamai blokavimo puslapis, kiek skelbimų
perskaityta ir du pavyzdžius. Atsarginio kelio (axios/Puppeteer) nėra —
„pavyko" reiškia, kad pavyko būtent per ScraperAPI.

Jei A praeina — imam A (10–30 kartų pigiau). Jei ne, bet B praeina — B tik
tiksliniams paieškoms (ne visos rinkos). Jei tik C — svarstom D (Apify).

## 5. Failai

- `backend/mobilede.js` — adresas, markių/modelių ID (BMW, Audi, VW, Mercedes), skaitytuvas
- `backend/testai/mobilede.test.js` — 41 patikra; duomenys — tikri 5 skelbimai
- `backend/server.js` — `/admin/pavyzdys` šaka `portalas=mobilede`
