# Atsakymai į 8 klausimus · išmatuota 2026-09-21

Visi skaičiai – iš žalio `Atviri_TP_parko_duomenys.zip` (2026-07-03), **viso failo**, 2 468 363 eilutės. Suvestinė ir `tools/regitra-suvestine.py` atnaujinti į **v2**.

---

## 1. Ridos įrašų skaičius — teisingas jūsų, ne specifikacijos

| Aibė | Su rida | Viso | Dalis |
|---|---|---|---|
| Visos eilutės | 359 219 | 2 468 363 | 14,6 % |
| **Tik M1** | 321 584 | 1 876 309 | **17,1 %** |
| M1, ne nuasmeninti, 1 000–1,5 mln. km | 303 651 | 1 827 324 | 16,6 % |
| Patenka į suvestinę (modeliai ≥ 30 vnt.) | **300 544** | | |

**300 544 teisingas.** Spėjimas pataikė: 14,6 % buvo viso failo rodiklis, o lengviesiems rida pildoma geriau nei sunkvežimiams ir priekaboms. Mano klaida buvo aritmetinė — visų eilučių procentą padauginau iš M1 kiekio, t. y. skaitiklis ir vardiklis iš skirtingų aibių. Ta pati forma, kaip ir su nuasmenintais prieš savaitę. Specifikacija ištaisyta.

---

## 2. Kvartiliai — pridėti

`rida_kv` ir `kmmet_kv`, abu `[P10, P25, P50, P75, P90]`, rodomi kai `n ≥ 20`.

```
BMW X5      rida    [77 115, 154 205, 219 392, 266 993, 305 061]  n=2218
            km/met  [11 132,  13 798,  17 323,  21 544,  26 373]
VW Passat   rida   [136 715, 182 832, 226 605, 266 643, 308 643]  n=11844
            km/met  [10 901,  13 581,  17 500,  22 648,  30 304]
```

Formuluotė kortelėje dabar gali būti konkreti:

> „180 000 km — patenka tarp 25 % mažiausiai važiavusių šio modelio Lietuvoje (2 218 registracijų)."

Tai **tas pats faktas, bet patikrinamas**, ir jis nereikalauja iš žmogaus mintinai versti procentų. Riba 🟡 punktui siūlau perkelti nuo „< 60 % normos" prie **„žemiau P10"** — P10 yra pati imtis, o ne mūsų pasirinktas koeficientas.

---

## 3. `PIRM_REG_DATA_LT` — prielaida patvirtinta

| Patikra | Rezultatas |
|---|---|
| Užpildyta | 1 813 363 (96,6 % M1) |
| **`PASKUTINES_REG_DATA` vėlesnė už ją** | **1 081 832 (59,7 %)** ← lemiamas |
| Lygi `PASKUTINES_REG_DATA` | 731 520 (40,3 %) |
| Lygi `PIRM_REG_DATA` (gimę LT) | 312 175 (17,2 %) |
| Ankstesnė už `PIRM_REG_DATA` (klaida) | 3 (0,00 %) |
| Datų rėžis | **1974 – 2026** |

**Neperrašoma.** 59,7 % automobilių po įvežimo turėjo bent vieną vėlesnę operaciją, ir įvežimo data išliko. Jei laukas būtų atnaujinamas, tas skaičius būtų ~0, o seniausios datos nesiektų 1974 m. (iki 2000 m. – 1 761 įrašas, 2000–2009 – 188 109). Importo sezoniškumo planas stovi tvirtai.

**Bet viena pataisa:** 17,2 % įrašų `PIRM_REG_DATA_LT == PIRM_REG_DATA` — tai Lietuvoje pirmą kartą registruoti automobiliai, **ne importas**. v2 juos išskiria: į importo statistiką patenka tik tie, kur `PIRM_REG_DATA_LT > PIRM_REG_DATA`. Dėl to `imp12` skaičiai sumažėjo ir dabar reiškia tikrą įvežimą.

---

## 4. `PASKUTINES_REG_DATA` erozija — išmatuota, sezoniškumui netinka

Mėnesiniai kiekiai atgal (100 % = 2026-05):

| Atgal | Mėnuo | Kiekis | Lieka |
|---|---|---|---|
| 0 | 2026-05 | 38 943 | 100 % |
| 12 | 2025-05 | 25 817 | **68 %** |
| 24 | 2024-05 | 20 825 | **55 %** |
| 36 | 2023-05 | 16 393 | **43 %** |
| 42 | 2023-01 | 11 785 | **31 %** |

Pirmais metais prarandama ~30 %, per trejus – beveik 60 %. Ir erozija netolygi: 2026-04 rodo 112 %, 2026-02 – 62 %, tad mėnesio efektas ir erozija susimaišę neatskiriamai.

**Išvada: savininkų kaitos sezoniškumo iš šio lauko neimam visai.** Ne „su išlyga" – tiesiog ne, nes mėnesio svyravimo nuo erozijos atskirti negalima.

Kam lieka tinkamas: **12 mėn. indeksui modeliams lyginti**. Erozija per 12 mėn. langą visiems modeliams vienoda, tad `apyv_pct` santykiai tarp modelių galioja. Absoliutus skaičius – ne.

**Ir čia radau klaidą veikiančioje versijoje:** 12 mėn. langas buvo skaičiuojamas nuo `today()`, o duomenys baigiasi 2026-06-30. Realiai langas dengė ~9,3 mėn. ir visus rodiklius sistemingai mažino. v2 langą ima **nuo duomenų pabaigos** ir dalinio paskutinio mėnesio neįtraukia: `2025-06 .. 2026-05`. Skaičiai pasikeitė juntamai:

| Modelis | v1 `apyv_pct` | **v2** |
|---|---|---|
| Porsche Cayenne | 27,0 % | **31,7 %** |
| Škoda Karoq | – | **29,2 %** |
| BMW X5 | 22,1 % | **25,8 %** |
| VW Passat | 11,4 % | **13,8 %** |

---

## 5. Importas pagal mėnesį × modelį — pridėta

`imp_men` – **36 mėnesių** masyvas, seniausias pirmas; ašis faile `menesiu_asis` (`2023-06 … 2026-05`). Dedama modeliams nuo 300 vnt. (512 modelių). Failas: 237 KB → **680 KB**.

Sezoniškumas (visi modeliai, vidurkis per mėnesį, nuokrypis nuo metų vidurkio):

| Mėn. | 01 | 02 | 03 | **04** | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | −17 % | −15 % | +4 % | **+23 %** | +17 % | −1 % | +7 % | +4 % | −3 % | +6 % | −11 % | −15 % |

**40 procentinių punktų amplitudė tarp balandžio ir sausio.** Modelio lygiu matosi ir tendencija: BMW X5 įvežimas augo nuo ~45/mėn. 2023 m. iki 85–112/mėn. dabar.

---

## 6. Kuras / dėžė / kėbulas — pridėta

`degalai`, `deze`, `kebulas` — kiekvienas kaip `[[reikšmė, procentai], …]` plius `_n` (iš kiek įrašų skaičiuota).

```
BMW X5      Dyzelinas 68 %, Benzinas 14 %, Benzinas/Elektra 8 %   n=11 871
            NTST 76 %, ATMTCT 24 %                                n= 6 668
            Universalas 89 %, Sedanas 10 %                        n= 5 091
Cayenne     Benzinas 51 %, Dyzelinas 29 %, Benzinas/Elektra 15 %  n= 3 307
Passat      Dyzelinas 82 %, Benzinas 13 %, Benzinas/Dujos 4 %     n=81 198
Karoq       Benzinas 64 %, Dyzelinas 36 %                         n= 3 601
```

**Kėbului naudojamas `KEB_PAVADINIMAS`, ne `KEB_KODAS`.** Kodas užpildytas 100 %, bet jo reikšmė daugumoje eilučių yra `---`; prasmę neša tik žodinis pavadinimas (45,5 %). Pirmas bandymas su `KEB_KODAS` grąžino tuščius sąrašus — tiksliai ta „100 % užpildyta, bet be turinio" forma, kurios verta saugotis ir kituose laukuose.

Sąsajoje rodyti tik kai `_n / parkas ≥ 0,5` — dėžė daugeliui modelių to nepasiekia (37,4 % vidutiniškai).

---

## 7. Amžiaus pjūvis — pridėta, ir jis apverčia išvadas

Nauji laukai: `senu_n`, `senu_dalis_pct`, `neleid15_pct` (rodomas kai `senu_n ≥ 30`).

| Modelis | 15+ m. dalis | Bendras `neleid_pct` | **Tarp 15+ metų** |
|---|---|---|---|
| Škoda Karoq | 0,0 % | 1,0 % | – |
| Volvo XC60 | 34,4 % | 2,4 % | **2,5 %** |
| Toyota Corolla | 65,0 % | 9,5 % | **13,3 %** |
| BMW X5 | 40,6 % | 11,6 % | **16,7 %** |
| Porsche Cayenne | 16,9 % | 8,7 % | **18,3 %** |
| VW Golf | 75,1 % | 30,3 % | **36,7 %** |
| VW Passat | 74,2 % | 31,0 % | **39,6 %** |
| BMW 530 | 92,6 % | 41,9 % | **43,5 %** |
| Mazda 323 | 92,1 % | 82,1 % | **83,3 %** |

Diagnozė buvo tiksli. Pagal bendrą skaičių Cayenne (8,7 %) atrodo patvaresnis už X5 (11,6 %) — pjūvis rodo atvirkščiai (18,3 % prieš 16,7 %), nes Cayenne parkas tiesiog jaunesnis. Karoq 1,0 % nereiškia nieko: tokio amžiaus Karoq dar nėra nė vieno.

`neleid_pct` sąsajoje nenaudoti. Kodo pusėje siūlau palikti lauką, bet punktą statyti tik ant `neleid15_pct`.

---

## 8. Likvidumo riba — dokumento klaida, ne kodo

Kodas laikėsi ribos teisingai. Klaida buvo mano pavyzdyje: BMW 530 su 12,1 % (dabar 13,2 %) į „žemiau 12 %" nepatenka ir niekada nepateko.

Pasiskirstymas po v2 pataisymo (512 modelių, parkas ≥ 300):

| P5 | P10 | P25 | P50 | P75 | P90 | P95 |
|---|---|---|---|---|---|---|
| 4,0 % | 7,6 % | **12,9 %** | 18,4 % | **26,4 %** | 34,9 % | 40,0 % |

Siūlau ribas rišti prie kvartilių, ne prie apvalių skaičių:

- **≥ 26 %** → 🟢 „judrus" (viršutinis ketvirtis)
- 13–26 % → punkto nėra
- **≤ 13 %** → 🟡 „lėtas" (apatinis ketvirtis)

Tikri lėtieji: Opel Sintra 0,6 %, Mazda MPV 0,8 %, Opel Vectra-B-Caravan 1,0 %, Citroën Xantia 1,3 %. Visi 25+ metų.

BMW 530 lėtumą rodo ne apyvartumas, o nurašymai — 43,5 % tarp 15+ metų. Jam turi suveikti 4.4 punktas, ne 4.1.

---

## Ką reikia pakeisti `backend/regitra.js` pusėje

Nauji laukai: `rida_kv`, `kmmet_kv`, `kmmet_n`, `senu_n`, `senu_dalis_pct`, `neleid15_pct`, `degalai`/`degalai_n`, `deze`/`deze_n`, `kebulas`/`kebulas_n`, `imp_men`.
Nauji failo lygio: `versija: 2`, `duomenu_pabaiga`, `langas_12men`, `menesiu_asis`.

1. Likvidumo ribos: **26 / 13** vietoj 20 / 12.
2. Nurašymų punktas: `neleid15_pct` vietoj `neleid_pct`, su `senu_n ≥ 30` sąlyga.
3. Ridos punktas: percentilis iš `rida_kv` vietoj santykio su mediana.
4. Naujas punktas: kuro pasiskirstymas, kai `degalai_n / parkas ≥ 0,5`.
5. `GET /admin/atsarga` → pridėti `duomenu_pabaiga` ir `langas_12men`, kad matytųsi, kokį laikotarpį rodo skaičiai.
6. `regitra.test.js` fiktūros atsinaujina (skaičiai pasikeitė dėl 12 mėn. lango pataisymo) — **tai laukiamas kritimas, ne regresija**.

Normalizavimas nekeistas, tad `modelis_dalys()` ↔ `baziniModelis()` pora lieka sutampanti.
