# TA duomenų pilotas · BMW X5 · 2026-09-22

Rinkinys: data.gov.lt 2721, „Transporto priemonių techninės apžiūros duomenys" (TRANSEKSTA, CC BY 4.0).
API: `https://get.data.gov.lt/datasets/gov/transeksta/ctadb/Apziura`

## Kas jau padaryta — PERSKAITYTI PRIEŠ IMANTIS

- Visas rinkinys: **15 829 696** apžiūrų įrašai (`?count()`).
- BMW X5 ištrauktas **visas**: 62 587 apžiūros, 8 puslapiai, 24 s.
- **Prieiga:** debesies konteineris ir įrenginio apvalkalas `get.data.gov.lt` nepasiekia (tinklo politika, 403). Veikia **tik per naršyklės polangį** programėlėje — Lukas leido svetainę 2026-09-22. Visa analizė vykdyta naršyklėje, į pokalbį grąžinta tik suvestinė.

## API sintaksė (patikrinta gyvai)

| Ką | Veikia | Neveikia |
|---|---|---|
| Kiekis | `?count()` | `/:count` → `UnknownRequestParameter` |
| Filtras | `?tp_marke="BMW"&tp_modelis.contains("X5")` | — |
| Pradžia | `?tp_modelis.startswith("X5")` | — |
| Puslapis | `&limit(10000)`, toliau `&page("<_page.next>")` | — |

`select()` nenaudoti — ataskaita teigia, kad tada dingsta `_page.next` (netikrinta, bet nereikėjo).

## Rezultatai

**Užpildymas (X5):** rida **100 %**, kuras 100 %, išvada 100 %, gamybos metai 97,7 %. Regitros `RIDA` M1 — tik 17,1 %.

**`tp_id` kartojasi.** 12 246 skirtingi automobiliai, iš jų tik 42 turi vieną apžiūrą. 2 260 turi 8 ir daugiau. Trajektorijos yra.

**Kryžminė patikra su Regitra:** TA 12 246 skirtingi X5, Regitros parke 11 878. Skirtumas tikėtinas — TA apima ir jau išregistruotus.

### Ridos sumažėjimas tarp apžiūrų

| Kriterijus | Automobilių | Dalis |
|---|---|---|
| Bet koks sumažėjimas | 3 809 | 31,3 % |
| **> 1 000 km** | **310** | **2,5 %** |
| **> 10 000 km** | **265** | **2,2 %** |

31 % yra triukšmas (smulkūs neatitikimai tarp įrašų), ne atsukimai. Prasmingas skaičius — **2,2–2,5 %**.

**SVARBU:** tai tik atsukimai **Lietuvoje, tarp apžiūrų**. Rida, atsukta **prieš įvežimą**, TA nematoma — trajektorija tiesiog tęsiasi nuo atsuktos reikšmės. Todėl TA **neišvalo** etalono nuo importo atsukimų. Patikrinta: pašalinus 2,5 % įtartinų automobilių, P10 pasikeičia < 0,5 %.

### Km per metus pagal amžių — TA prieš Regitrą

`rida / amžius`, visos apžiūros. `[n, P10, P50, P90]`:

| Juosta | TA | Regitra (`kmmet_juostos`) | TA P10 skirtumas |
|---|---|---|---|
| 0–3 m. | 2 100 · 6 714 · 17 682 · 39 715 | 63 · 6 393 · 21 851 · 31 627 | +5 % |
| 4–6 m. | 3 727 · 11 364 · 20 692 · 36 389 | 173 · 8 573 · 23 440 · 34 685 | **+33 %** |
| 7–9 m. | 6 581 · 13 415 · 22 168 · 31 451 | 222 · 10 018 · 22 493 · 31 164 | **+34 %** |
| 10–12 m. | 9 764 · 13 965 · 20 689 · 27 746 | 310 · 13 374 · 19 308 · 25 475 | +4 % |
| 13–15 m. | 15 122 · 13 451 · 18 661 · 24 569 | 446 · 13 080 · 17 395 · 22 333 | +3 % |
| 16–20 m. | 19 764 · 12 592 · 16 897 · 22 087 | 409 · 10 259 · 14 669 · 19 418 | **+23 %** |
| 21+ m. | 3 624 · 11 141 · 15 124 · 19 229 | 94 · 9 894 · 12 430 · 16 419 | +13 % |

Du dalykai:

1. **Imtis 20–50 kartų didesnė** kiekvienoje juostoje. Visos juostos turi ≥ 2 000 įrašų — ⚪ dėl mažos imties X5 atveju nebelieka nė vienoje.
2. **TA P10 visur aukštesnis**, trijose juostose 23–34 %. Suderinama su hipoteze, kad vienkartinis Regitros matavimas įvežant turi storesnę žemą uodegą. Bet gali lemti ir imčių skirtumas (TA sveria ilgai Lietuvoje važinėjančius automobilius). **Nepatvirtinta — hipotezė.**

### Metinė rida iš skirtumų tarp apžiūrų

Kiek X5 realiai nuvažiuoja per metus Lietuvoje: P50 nuo 19 959 (4–6 m.) iki 10 190 (21+ m.). Pasiskirstymas labai platus (P10 3,7–9,3 tūkst.). Tai atsako į kitą klausimą — kiek važinėja LT savininkai — ne į tai, ar skelbimo rida įtartina.

### TA neišlaikymas pagal amžių (tik pirminės apžiūros)

| Juosta | n | Neišlaikė | Dideli trūkumai |
|---|---|---|---|
| 0–3 m. | 1 903 | 27,8 % | 27,5 % |
| 4–6 m. | 3 164 | 25,6 % | 25,4 % |
| 7–9 m. | 5 424 | 26,6 % | 26,0 % |
| 10–12 m. | 7 460 | 35,3 % | 34,5 % |
| 13–15 m. | 10 863 | 40,8 % | 39,8 % |
| 16–20 m. | 13 131 | 49,3 % | 47,4 % |
| 21+ m. | 2 333 | 54,2 % | 51,9 % |

- **Neišlaikymą lemia amžius** — nuo 26 % iki 54 %. Rodiklis be amžiaus juostų matuotų amžių, ne patikimumą (ta pati klaida kaip `neleid_pct`).
- „Neišlaikė" ≈ „Dideli trūkumai" — praktiškai tas pats rodiklis.
- **0–3 m. krenta dažniau nei 4–6 m.** Hipotezė: jauni X5 į TA patenka daugiausia įvežami, ir dalis jų — po remonto. Tiesiogiai liečia verslo modelį (daužtų pirkimas). **Nepatvirtinta.**
- Vieno modelio skaičius be palyginimo nieko nesako. Reikia kelių modelių toje pačioje juostoje.

### Vardai

`X5` 20 649 · `X5 3.0D` 20 461 · `X5 XDRIVE30D` 3 896 · `BMW X5 3.0D` 1 420 · `BMW X5` 633 …

Ta pati forma kaip Regitroje (markė kartais pakartota, variantas modelyje). **Esamas `modelis_dalys()` visus suveda į `BMW X5`.** `SERIE`/`REIHE` formų tarp dažniausių nėra — bet tai vienas modelis, apibendrinti negalima.

Duomenyse yra ir rašybos klaidų: `ta_isvada` = „Nedideli **trukūmai**". Lyginti per `startswith`, ne tikslią reikšmę.

## Dvi pataisos ankstesniam vertinimui

1. **„TA išvalys etaloną nuo atsukimų" — tik iš dalies.** Matomi tik Lietuvoje atsukti (2,5 %), o jų pašalinimas P10 beveik nekeičia. Importo atsukimai TA taip pat nematomi.
2. **„Jaunų automobilių TA nebus" — neteisinga.** Įvežami naudoti automobiliai tikrinami registruojant, todėl X5 0–3 m. juostoje yra 2 100 įrašų. Trūksta tik naujų, Lietuvoje parduotų.

## Išvada

| Panaudojimas | Vertė | Kodėl |
|---|---|---|
| Ridos norma pagal amžių | **didelė** | 100 % užpildymas, 20–50× didesnė imtis, visos juostos |
| Patvarumas (TA neišlaikymas pagal amžių) | **didelė**, jei lyginama tarp modelių | tikra būklė, ne registracijos statusas |
| Atsukimų dažnis modeliui | vidutinė | savas išmatuotas faktas, bet tik Lietuvoje |
| Etalono valymas | maža | pašalinimas P10 nekeičia |

## Kas toliau

1. Tas pats kitiems 5–10 modeliams (Passat, Golf, A6, Q5, XC60, Corolla) — kad neišlaikymas turėtų su kuo lygintis.
2. Jei pasitvirtina — `tools/ta-suvestine.py`, kuris srautu agreguoja visus 15,8 mln. įrašų, nesaugodamas eilučių.
3. **Kur jį leisti:** naršyklės polangis tinka bandymams (vienas modelis — 24 s), bet ne 15,8 mln. eilučių. Mūsų apvalkalai API nepasiekia. Lieka Luko kompiuteris — vienas paleidimas kas ketvirtį, kaip `regitra-suvestine.py`.
4. Atribucija sąsajoje: „Šaltinis: TRANSEKSTA, CC BY 4.0".
