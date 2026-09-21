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

---

# A-29 · Nurašymų riba: 40, bet klausimas ne tas

`neleid15_pct` pasiskirstymas (393 modeliai, `senu_n ≥ 30`, parkas ≥ 300):

| P10 | P25 | P50 | P75 | P80 | P90 |
|---|---|---|---|---|---|
| 5,9 % | 13,1 % | 27,9 % | **45,5 %** | 50,8 % | 66,1 % |

| Riba | Suveiktų modelių |
|---|---|
| 30 % | 184 (46,8 %) |
| **40 %** | **124 (31,6 %)** |
| 50 % | 81 (20,6 %) |
| 60 % | 51 (13,0 %) |

**Trumpas atsakymas: 40.** Bet svarbesnis dalykas yra tai, kad riba viena pati klausimo neišsprendžia.

Štai kas suveiktų **tik** nuleidus iki 40:

| Modelis | Parkas | 15+ m. dalis | `neleid15_pct` |
|---|---|---|---|
| Ford Focus | 17 729 | 73,3 % | 42,6 % |
| VW Sharan | 14 742 | 89,6 % | 41,7 % |
| Ford Galaxy | 12 950 | 93,1 % | 41,5 % |
| Opel Zafira-A | 7 411 | 99,9 % | 46,2 % |
| Peugeot 307 | 6 852 | 99,5 % | 41,8 % |
| Mazda 6 | 4 729 | 69,7 % | 46,2 % |
| BMW 525 | 4 118 | 93,4 % | 48,7 % |
| Renault Clio | 3 569 | 56,9 % | 47,0 % |
| BMW 530 | 3 403 | 92,6 % | 43,5 % |

Nė vienas nėra triukšmas: kas antras jų 15+ metų egzempliorius realiai nebevažiuoja. Žmogui, žiūrinčiam 2008 m. Ford Focus, tai tikra informacija.

**Bet 31,6 % modelių reiškia, kad ženklelį gautų maždaug kas trečias skelbimas** – o įspėjimas, kuris rodomas trečdaliui, nustoja būti įspėjimu. Tai ta pati logika, dėl kurios administravime atsisakyta raudono fono skuboms.

**Todėl riba turi eiti kartu su antra sąlyga: punktas rodomas tik kai PATS skelbimo automobilis yra senas** (siūlau ≥ 12 metų). Kitaip 2021 m. Škodai rodytume, kaip laikosi 15+ metų Škodos – atsakymą į klausimą, kurio niekas neuždavė.

Su ta sąlyga 40 nėra triukšmingas, nes auditorija jau susiaurinta iki tų, kam tai aktualu. Be jos net 50 būtų triukšmas jauniems automobiliams.

Jei norima ribą rišti prie imties, kaip padaryta su likvidumu, tikslus P75 yra **45,5 %** – tada visos trys produkto ribos būtų kvartilinės ir savaime paaiškinamos. Man 40 + amžiaus vartai atrodo geriau, nes riba apvalesnė, o atranką daro vartai.

---

# A-30 · `rida_kv` konkrečiam skelbimui NETINKA

**Atsakymas: tik parkui aprašyti.** Konkrečiam skelbimui vertinti sudėti procentiliai duoda **atvirkščią** verdiktą jauniems automobiliams.

Įrodymas – BMW X5 (n = 1 717):

| Amžius | n | Rida P10 | P50 | P90 | km/metus P10 | P50 | P90 |
|---|---|---|---|---|---|---|---|
| 0–3 m. | 63 | 7 859 | 64 740 | **107 483** | 6 393 | 21 851 | 31 627 |
| 4–6 m. | 173 | 46 416 | 120 706 | 206 832 | 8 573 | 23 440 | 34 685 |
| 7–9 m. | 222 | 82 627 | 197 304 | 278 754 | 10 018 | 22 493 | 31 164 |
| 10–12 m. | 310 | 154 333 | 227 161 | 287 074 | 13 374 | 19 308 | 25 475 |
| 13–15 m. | 446 | 188 555 | 254 331 | 323 390 | 13 080 | 17 395 | 22 333 |
| 16–20 m. | 409 | 191 085 | 263 871 | 344 094 | 10 259 | 14 669 | 19 418 |
| 21+ m. | 94 | 218 692 | 275 298 | 348 356 | 9 894 | **12 430** | 16 419 |
| **SUDĖTI** | 1 717 | **104 569** | 236 186 | 317 000 | 11 132 | 17 323 | 26 373 |

Trejų metų X5 su 100 000 km pagal sudėtus procentilius patenka **žemiau P10** (104 569) – t. y. gautų 🟡 „rida įtartinai maža". Savo amžiaus juostoje tas pats automobilis yra **ties P90** (107 483), t. y. tarp daugiausiai važiavusių. Verdiktas apsiverčia į priešingą.

**Ir `kmmet_kv` sudėti irgi netinka**, nors atrodo saugesni: km per metus krinta monotoniškai su amžiumi – X5 nuo 21 851 (0–3 m.) iki 12 430 (21+ m.), −43 %. VW Passat dar ryškiau: 46 774 → 11 333, keturgubas skirtumas.

**Ar užtenka vieno bendro amžiaus koeficiento?** Patikrinau: bendra kreivė (visi M1, n = 283 903) padauginta iš modelio bendros medianos duoda ±2–8 % tikslumą 7+ metų juostoms, bet lūžta jaunoms: VW Passat 0–3 m. **−49 %**, Audi A6 **−20 %**, Volvo XC60 sistemingai +18–22 % visose senose juostose (nes jo parkas jaunas, tad bendra mediana per aukšta). Vienas koeficientas netinka.

## Kas padaryta

Įrankis v2 dabar rašo `kmmet_juostos` – **vienintelį pjūvį, tinkamą konkrečiam skelbimui**:

```json
"kmmet_juostos": { "10-12": [310, 13374, 16732, 19308, 22721, 25475] }
//                          n    P10    P25    P50    P75    P90
```

Juosta įrašoma tik turint **≥ 50 įrašų**; kitaip jos nėra ir sąsajoje rodom ⚪, ne spėjimą. Dangos matavimas: juostas turi 254 modeliai iš 1 343, **bet tai 84,8 % viso parko** – ilgoji uodega yra reti modeliai, kurių ir taip nevertintume. Failas 680 → **741 KB**.

## Kaip naudoti

1. Amžius = skelbimo metai − pirmos registracijos metai.
2. Juosta pagal amžių → `kmmet_juostos[juosta]`. Nėra juostos → ⚪, punkto nerodom.
3. `skelbimo_rida / amžius` lyginam su tos juostos P10/P25.
4. Žemiau P10 → 🟡 klausimas pardavėjui. Tarp P10 ir P25 – punkto nėra.

## Riba, kurią būtina įrašyti į dokumentą

Šis skaičius yra rida **registracijos operacijos metu**, o Lietuvoje tai dažniausiai įvežimo momentas – tiksliai tas momentas, prieš kurį rida ir yra atsukama. Vadinasi lyginame įtartiną skelbimą su populiacija, kurioje irgi yra atsuktų ridų.

Tai daro testą **konservatyvų**: tikra atsukta rida gali atrodyti normali, nes „norma" pati patempta žemyn. Klaidingų kaltinimų kryptimi jis neklysta – tik praleidžia dalį tikrų atvejų. Būtent tokios krypties klaidą ir norim, bet pasakyti tai reikia atvirai, o ne leisti galvoti, kad P10 yra švarus etalonas.

---

# A-32 · Atsargą leidžiam, bet langas 7–15 metų, ne 7+

Gerai, kad nedarėte savavališkai – **mano „±2–8 %" buvo apie medianas, o punktas remiasi P10 uodega, ir ji elgiasi kitaip.**

Simuliacija: paimti tik tie įrašai, kuriems juosta **yra**, ir palyginta, kiek kartų sudėtinis P10 duotų kitą verdiktą nei juostos P10. 246 338 įrašai.

| Juosta | Įrašų | Klaidingai pažymėta | Praleista | Klaidų iš viso |
|---|---|---|---|---|
| 0–3 m. | 3 295 | **3,3 %** | 1,7 % | 5,1 % |
| 4–6 m. | 17 372 | 1,3 % | 2,6 % | 3,9 % |
| **7–9 m.** | 38 321 | **0,4 %** | 3,5 % | 4,0 % |
| **10–12 m.** | 61 889 | **0,1 %** | 4,8 % | 4,8 % |
| **13–15 m.** | 57 398 | **0,5 %** | 3,4 % | 4,0 % |
| 16–20 m. | 57 382 | **5,8 %** | 0,3 % | 6,1 % |
| 21+ m. | 10 681 | **23,7 %** | 0,0 % | 23,7 % |

**Riba yra ne ties 7, o ties 15 metų.** Nuo 16 m. sudėtinis P10 pakyla virš juostos P10, ir kas ketvirtas 21+ metų automobilis gautų 🟡 be jokio pagrindo. Tai tiksliai ta klaidos kryptis, kurios negalima leisti – kaltinimas be pagrindo.

7–15 metų lange atvirkščiai: klaidingai pažymima **0,1–0,5 %**, o visa likusi klaida yra **praleidimas** (3,4–4,8 %). Tai ta pati konservatyvi kryptis, kurią jau sąmoningai priėmėm dėl atsuktų ridų etalone. Vadinasi atsarga ten beveik nemokama.

**Antra sąlyga – imties dydis.** Sudėtinių `n ≥ 20` neužtenka: P10 iš 25 atsitiktinių įrašų svyruoja **−24 % … +21 %** (tikrinta su Audi A6 16–20 m. juosta, kur tikras P10 = 10 690, o iš 25 įrašų gaunasi 8 091–12 894). Atsargai siūlau reikalauti **`kmmet_n ≥ 100`**.

## Sprendimas

```
juosta yra                      → naudojam juostą
juostos nėra IR amžius 7–15 m.  → sudėtinis kmmet_kv, jei kmmet_n >= 100
visais kitais atvejais          → ⚪
```

Taigi ⚪ yra teisingas atsakymas **0–6 ir 16+ metams**, o 7–15 m. – ne. Nauda: atsargos reikėtų 347 modeliams, o tai **9,1 % parko** – danga pakiltų nuo 84,8 % iki ~94 %.

Į failą įrašyti nieko nereikia: `kmmet_kv` ir `kmmet_n` jau yra.

---

# A-33 · Taip, jungiam – bet ne pagal variklio kodą, o pagal šeimą + kurą

Ir svarbiausia: **BMW 320 nėra didžiausia šios srities problema.** Pažiūrėjus į tikrus registro vardus matosi trys atskiri defektai.

## Defektas 1 – užpildomieji žodžiai (didesnis už 320)

| Tikras `KOMERCINIS_PAV` | Kiek | Dabartinis raktas |
|---|---|---|
| `3ER REIHE` | 10 491 | BMW 3ER |
| `5ER REIHE` | 9 149 | BMW 5ER |
| `SERIE 3` | 2 443 | **BMW SERIE** |
| `SERIE 5` | 2 156 | **BMW SERIE** |
| `SERIE X` | 3 503 | **BMW SERIE** |
| `X REIHE` | 5 918 | **BMW X** |

`BMW SERIE` (9 781) yra **trys skirtingos serijos viename rakte**, nes ėmėm pirmą žodį, o pirmas žodis yra „SERIE". Tai blogiau nei 320 atvejis ir galioja nepriklausomai nuo jo.

Taisymas: prieš imant pirmą žodį išmesti `REIHE`, `SERIE`, `SERIES`, `KLASSE`, `CLASS`; `3ER` → `3`.

## Defektas 2 – vardai, kurie apskritai nieko nesako

`X REIHE` (5 918) reiškia tiesiog „X serija" – registras nenurodo, ar tai X1, ar X5. Tokių vienaženklių raktų BMW turi 7 672 įrašus (**4,9 % visų BMW**): `X`, `5`, `7`, `3`, `1`, `M`, `Z`, ir net `-` (328).

Šitų **sujungti su niekuo negalima** – juose sumaišyti skirtingi automobiliai. Siūlau juos ne jungti, o **pažymėti `neapibreztas: true` ir niekada nenaudoti**, lygiai kaip „Nuasmeninta". Geriau ⚪ nei X1 statistika, parodyta prie X5.

## Defektas 3 – 320 prieš 320D (jūsų klausimas)

Išmatavau, ar 3 serijos variantus apskritai galima jungti. **Toje pačioje amžiaus juostoje – taip, jei kuras tas pats:**

| Variantas | 10–12 m. P10 | 13–15 m. P10 | 16–20 m. P10 |
|---|---|---|---|
| **Visa 3 serija** | 14 313 | 12 493 | 9 997 |
| 3ER/SERIE | 14 469 | 12 806 | 10 618 |
| 320D | 14 475 | 12 575 | 9 974 |
| 318D | 14 122 | 11 994 | 10 806 |
| 330D | 14 313 | 13 075 | 11 256 |
| 316D | 13 823 | – | – |
| **320I** (benzinas) | – | – | **8 111 (−19 %)** |
| **320ED** (hibridas) | **18 325 (+28 %)** | – | – |

Dyzeliniai variantai tarpusavyje skiriasi **±2–5 %** – jungti saugu. Bet benzininis 320I yra 19 % žemiau, o hibridas 320ED 28 % aukščiau šeimos vidurkio.

**Vadinasi jūsų nuojauta teisinga, tik ašis kita: skiria ne variklio kodas, o kuras.** Jungti reikia pagal **(šeima, kuras)**, o ne bandyti „320 → 320D".

## Siūloma raktų logika

Vietoj vieno rakto – **šeima plius variantas**, ir paieška krenta laipsniais:

```js
// 1. uzpildomieji zodziai lauk, 3ER -> 3
const FILLER = new Set(['REIHE','SERIE','SERIES','KLASSE','CLASS']);
// 2. seima:
//    X5 / X 5 / Z4  -> raide + skaicius    (X5 yra sava seima, ne „X")
//    320 / 320D     -> pirmas skaitmuo     (3 serija)
//    GOLF / PASSAT  -> pats zodis
// 3. neapibrezti (bare „X", „3", „-") -> neapibreztas: true, nenaudojam
```

Paieškos tvarka skelbimui:

```
1. tikslus variantas (BMW 320D)                → jei yra ir turi duomenu
2. seima + kuras     (BMW 3 · Dyzelinas)       → siulomas numatytasis
3. seima             (BMW 3)                   → tik parkui/likvidumui, NE ridai
4. nieko                                       → ⚪
```

Ridos punktui 3 žingsnio neužtenka, nes būtent kuras ir skiria; likvidumui ir retumui – visiškai tinka, ten kuro skirtumas nesvarbus.

## Įspėjimas dėl diegimo

Raktų logika gyvena dviejose vietose, todėl **`modelis_dalys()`, `baziniModelis()` ir pergeneruotas `regitra-modeliai.json` turi keliauti VIENU commit'u**. Jei duomenys su naujais raktais pateks į produkciją prie senos JS – visi raktai nustos pataikyti ir punktai tyliai dings. `regitra.test.js` tai pagaus tik jei jis paleidžiamas prieš push'ą.

Dėl šios priežasties duomenų **nepergeneravau** – tai jūsų commit'as. Pasakykit, ir paruošiu `modelis_dalys()` bei `baziniModelis()` porą kartu su pergeneruotu failu, kad viskas sugultų vienu žingsniu.
