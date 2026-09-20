# Regitros parko duomenys · ką iš jų darome

Specifikacija. Visi skaičiai čia – **išmatuoti**, ne spėti.

---

## Kas jau padaryta (2026-09-21) — PERSKAITYTI PRIEŠ IMANTIS

- Metaduomenys (`Metaduomenys-v_41.xlsx`) perskaityti, abu lapai.
- Visas failas `Atviri_TP_parko_duomenys.zip` (2026-07-03) nuskenuotas: **2 468 363 eilutės, iš jų 1 876 309 lengvieji (M1)**. Skenavimas trunka ~35 s.
- Užpildymas išmatuotas **visam failui**, ne imčiai.
- Vardų normalizavimas išspręstas dviem lygiais (žr. 3 skyrių).
- Įrankis parašytas: `tools/regitra-suvestine.py`.
- **Dar NEPADARYTA:** integracija į `server.js`, rodymas sąsajoje, ketvirčio atnaujinimo priminimas.

**Įspėjimas iš patirties:** pirmas matavimas buvo daromas iš 300 000 eilučių imties ir davė klaidingus skaičius (`RIDA` 1,5 % vietoj 14,6 %), nes failas **nėra atsitiktinės tvarkos**. Bet kokį naują lauką matuoti tik visame faile.

---

## 1. Šaltinis

- Imama tiesiai iš `regitra.lt` (data.gov.lt veidrodis pasenęs nuo 2023 III ketv.).
- Reikia failo **„Atviri įregistruotų kelių transporto priemonių parko duomenys"** (visas parkas). Atskiras juridinių asmenų failas turi savo vertę (įmonių ir lizingo automobiliai, su `PAVADINIMAS` ir `KODAS`), bet tai atskiras darbas.
- Atnaujinama **kas ketvirtį**. Archyvuoti senų ketvirčių **nebūtina** – `PIRM_REG_DATA_LT` neša visą importo istoriją viename faile.
- Žalias CSV yra 945 MB. Jis **niekada** nepatenka nei į repo, nei į `/data`. Į produkciją keliauja tik suvestinė (~350 KB).

---

## 2. Kas duomenyse gyva, o kas ne

| Laukas | Užpildyta | Verdiktas |
|---|---|---|
| `MARKE`, `KOMERCINIS_PAV` | 100 % | naudojam |
| `PASKUTINES_REG_DATA` | 100 % | naudojam – **apyvartumas** |
| `DAE_STATUSAS` | 100 % | naudojam – nurašymo signalas |
| `SPALVA`, `KEB_KODAS` | 100 % | atsargoje |
| `SAVIVALDYBE` | 99,6 % | atsargoje (BDAR – žr. 6 sk.) |
| `PIRM_REG_DATA_LT` | 97,1 % | naudojam – **importas** |
| `NUOSAVA_MASE` | 94,8 % | atsargoje |
| `PIRM_REG_DATA` | 91,0 % | naudojam – amžius |
| `DEGALAI` / `GALIA` / `DARBINIS_TURIS` | 88,9 / 86,7 / 86,6 % | naudojam – versijos atitikimas |
| `KILMES_SALIS` | 65,5 % | naudojam **tik kaip dalį**, ne kaip skaičių |
| `KEB_PAVADINIMAS` | 45,5 % | per reta |
| `PAVARU_DEZES_TIPAS` | 37,4 % | per reta |
| `RIDA` | 17,1 % (M1) | **naudojam** – žr. žemiau |
| `TERSALU_LYGIS` | 10,9 % | per reta |
| `MODELIO_METAI` / `GAMYBOS_METAI` | 6,1 / 5,0 % | **negyva** – metus imam iš `PIRM_REG_DATA` |

**`RIDA` užpildymas priklauso nuo to, ką skaičiuoji** (išmatuota 2026-09-21, visas failas):

| Aibė | Su rida | Viso | Dalis |
|---|---|---|---|
| Visos eilutės | 359 219 | 2 468 363 | 14,6 % |
| **Tik M1** | **321 584** | **1 876 309** | **17,1 %** |
| M1, ne nuasmeninti, 1 000–1,5 mln. km | 303 651 | 1 827 324 | 16,6 % |
| Patenka į suvestinę (modeliai ≥ 30 vnt.) | **300 544** | | |

Suvestinės skaičius **300 544 yra teisingas**. Ankstesnė „~274 000" prognozė buvo klaidinga: visų eilučių užpildymo rodiklis (14,6 %) buvo padaugintas iš M1 kiekio, t. y. skaitiklis ir vardiklis iš skirtingų aibių. Lengviesiems rida pildoma geriau nei sunkvežimiams ir priekaboms.

Populiariems modeliams duomenų su kaupu: BMW X5 – 2 218 įrašų, Audi Q5 – 2 414, VW Passat – 11 844. Riba medianai: **20 įrašų**; mažiau – ⚪ „per mažai duomenų".

**Svarbi `RIDA` savybė:** tai rida **registracijos operacijos metu**, ne šiandien. Todėl absoliuti mediana šališka (Porsche Macan – 32 693 km, nes tai neseniai atvežti automobiliai). Patikimas rodiklis yra **km per metus** = `RIDA / (PASKUTINES_REG_DATA − PIRM_REG_DATA)`, nes jis dalijamas iš amžiaus.

---

## 3. Vardų problema – pirmas darbas prieš bet ką

Registre tas pats automobilis rašomas keliais būdais:

- markė pakartota modelio lauke: `TOYOTA` + `TOYOTA RAV4`;
- sena ir nauja rašyba: `VW PASSAT` (48 514) ir `VOLKSWAGEN. VW PASSAT` (18 639);
- variantas įrašytas į modelį: `X5 3 0D`, `X5 XDRIVE30D`, `X5 XDRIVE40D`, `X5`.

**Neapjungus BMW X5 parkas atrodo 2 499. Iš tikrųjų – 11 878, išbarstyti po 140 rašybos variantų.** Bet kuri funkcija be normalizavimo rodytų penkis kartus mažesnius skaičius.

Sprendimas – **du lygiai**, `tools/regitra-suvestine.py` funkcijoje `modelis_dalys()`:

- **bazinis modelis** (`BMW X5`) – parkui, apyvartumui, importui, ridos normoms;
- **pilnas variantas** (`X5 XDRIVE30D`) – tikslesniam skelbimo atitikimui, kai jo prireiks.

Ta pati normalizavimo funkcija turi atsirasti ir JS pusėje, kad skelbimo pavadinimas būtų suvedamas į tą patį bazinį modelį. **Jei kada nors taisai normalizavimą – taisyk abiejose vietose.** Tai tiksliai ta forma klaidos, kuri jau buvo su `ctScore()` ir `diffPct` ženklu.

Pastaba: senoji rašyba koreliuoja su registracijos epocha (`VW PASSAT` – 31 % neleidžiamų eisme, `VOLKSWAGEN. VW PASSAT` – 5,9 %). Sujungti būtina, bet pats variantas neša informaciją ir gali praversti vėliau.

---

## 4. Keturios funkcijos, kurios iš to gimsta

### 4.1 Likvidumas — „kiek mėnesių pinigai stovės kieme"

`apyv_pct` = kiek procentų viso LT parko per 12 mėn. turėjo registracijos operaciją.

**Ribos remiasi išmatuotu pasiskirstymu** (512 modelių, parkas ≥ 300, v2 duomenys):

| P5 | P10 | P25 | P50 | P75 | P90 | P95 |
|---|---|---|---|---|---|---|
| 4,0 % | 7,6 % | **12,9 %** | 18,4 % | **26,4 %** | 34,9 % | 40,0 % |

| Reikšmė | Lygis | Reikšmė žmogui |
|---|---|---|
| ≥ 26 % (viršutinis ketvirtis) | 🟢 | judrus modelis |
| 13–26 % | – | punkto nėra |
| ≤ 13 % (apatinis ketvirtis) | 🟡 | lėtas pardavimas |

| Modelis | Parkas | Apyvartumas |
|---|---|---|
| Porsche Cayenne | 3 310 | 31,7 % 🟢 |
| Škoda Karoq | 3 601 | 29,2 % 🟢 |
| BMW X5 | 11 878 | 25,8 % |
| Volvo XC60 | 21 917 | 22,7 % |
| VW Passat | 81 447 | 13,8 % |
| BMW 530 | 3 403 | 13,2 % |
| Opel Sintra | 348 | 0,6 % 🟡 |

**Pastaba dėl BMW 530:** ankstesnėje versijoje jis buvo pateiktas kaip kanoninis „lėto" pavyzdys, nors su 13,2 % į ribą nepatenka. Tai buvo dokumento klaida, ne kodo – kodas laikėsi ribos teisingai. 530 lėtumą rodo ne apyvartumas, o **nurašymai** (41,9 % neleidžiami eisme). Tikri lėtieji yra Opel Sintra, Mazda MPV, Citroën Xantia – t. y. 25+ metų modeliai.

### 4.2 Ridos norma — klausimas, ne kaltinimas

Mediana km/metus pagal modelį (išmatuota): VW Passat 17 500 · Audi A6 17 405 · BMW X5 17 323 · Audi Q5 18 831 · Toyota Yaris 11 564 · Volvo XC60 20 795.

Skelbimo rida lyginama su `amžius × kmmet_med`. Jei skelbime **mažiau nei 60 % normos** – punktas 🟡:

> „Rida 40 % mažesnė nei įprasta šiam modeliui Lietuvoje (2 218 registracijų mediana – 17 300 km/metus). Paklauskite pardavėjo dėl serviso istorijos."

**Griežtai draudžiama** rašyti „rida atsukta" – tai jau yra `DRAUDZIAMA` sąraše ir čia galioja lygiai taip pat. Tai signalas, ne verdiktas. Ir jis niekada nemažina balo – virsta klausimu pardavėjui.

### 4.3 Importo srautas ir kryptis

Į Lietuvą įvežta M1 pagal metus: 2019 – 132 052 · 2020 – 110 616 · 2023 – 119 979 · 2024 – 132 046 · **2025 – 144 542 (rekordas)** · 2026 iki rugsėjo – 87 616.

Per paskutinius 12 mėn.: **Vokietija 55,2 %**, Nyderlandai 12,8 %, Belgija 9,8 %, Suomija 7,8 %, Danija 6,5 %, Švedija 3,5 %.

Modelio lygiu tai atsako į klausimą „iš kur perka tie, kurie perka tą patį, ką ir aš": BMW X5 – DEU 384, BEL 92, NLD 64. Audi Q5 – DEU 381, **FIN 109**, BEL 84 (Suomija Q5 atveju netikėtai stipri – tai kryptis, kurios konkurentai nežiūri).

`KILMES_SALIS` užpildyta 65,5 %, todėl rodom **procentinį pasiskirstymą**, niekada absoliutų skaičių.

### 4.4 Retumas ir nurašymai

`parkas < 300` → 🟡 „Lietuvoje registruoti tik N – siauras pirkėjų ratas, ilgesnis pardavimas".

**`neleid15_pct > 30 %`** → 🟡 „N % šio modelio, kuriems 15+ metų, nebeleidžiami eisme". Rodom tik kai `senu_n ≥ 30`; kitaip ⚪.

**`neleid_pct` vienas yra AMŽIAUS, ne patvarumo matas – sąsajoje nenaudoti.** Išmatuota:

| Modelis | 15+ m. dalis | Bendras `neleid_pct` | **Tarp 15+ metų** |
|---|---|---|---|
| Škoda Karoq | 0,0 % | 1,0 % | – (senų nėra) |
| Volvo XC60 | 34,4 % | 2,4 % | **2,5 %** |
| Toyota Corolla | 65,0 % | 9,5 % | **13,3 %** |
| BMW X5 | 40,6 % | 11,6 % | **16,7 %** |
| Porsche Cayenne | 16,9 % | 8,7 % | **18,3 %** |
| VW Golf | 75,1 % | 30,3 % | **36,7 %** |
| Mazda 323 | 92,1 % | 82,1 % | **83,3 %** |

Amžiaus pjūvis apverčia išvadą: pagal bendrą skaičių Cayenne (8,7 %) atrodo patvaresnis už X5 (11,6 %), o tarp 15+ metų mašinų yra atvirkščiai – 18,3 % prieš 16,7 %. Karoq 1,0 % nereiškia nieko: tokio amžiaus Karoq tiesiog dar nėra.

---

## 5. Duomenų failas ir įrankis

```bash
python3 tools/regitra-suvestine.py ~/Downloads/Atviri_TP_parko_duomenys.zip
```

- Rezultatas: `backend/duomenys/regitra-modeliai.json` – **1 343 baziniai modeliai** (nuo 30 vnt.), ~350 KB. Telpa į repo ir keliauja su deploy'umi – tai ketvirtinis statinis duomuo, ne kintanti būsena, todėl `/data` jam nereikia.
- Įrankis krenta su aiškia žinute, jei Regitra pakeistų stulpelių pavadinimus.
- Pakartotinis paleidimas su nauju zip perrašo failą.

---

## 6. BDAR riba

Saugom **tik suvestines pagal modelį**. Eilutės lygio duomenys nesaugomi niekur ir niekada: `VALD_GIM_DAT_INT` + `SAVIVALDYBE` + retas modelis kartu identifikuoja konkretų žmogų. Todėl `SAVIVALDYBE` ir valdytojo laukai į suvestinę neįtraukti, nors faile jie yra.

---

## 7. Ribos — ko iš šių duomenų NEBUS

- **Konkretaus automobilio patikrinti negalima.** Nėra nei VIN, nei numerio – tai suvestiniai duomenys. Tam reikia oficialios mokamos Regitros paslaugos.
- **Dalis įrašų nuasmeninti:** visame faile – 4,29 % (105 893 eilutės), tarp lengvųjų M1 – **2,61 % (48 985)**. Markė pakeičiama į „Nuasmeninta", kai markė+modelis+savivaldybė unikalūs. Dingsta būtent reti ir brangūs automobiliai. Egzotikos skaičiai bus per maži, ne tikri; tokiems modeliams rodom ⚪, o ne mažą skaičių.
- **Apyvartumas nėra pardavimai.** `PASKUTINES_REG_DATA` yra bet kokia registracijos operacija – savininko keitimas, duomenų taisymas, išregistravimas. Rodiklis tinka **lyginti modelius tarpusavyje**, bet neturi būti vadinamas „parduota per metus".
- **Sandorių duomenys (TPSAIS) netinka** – juose nėra nei markės, nei modelio, nei metų (patikrinta gyvai 2026-09-18). Apyvartumą duoda būtent parko failas.

---

## 8. Kas toliau

1. `server.js`: įkelti `regitra-modeliai.json` paleidžiant, normalizavimo funkcija JS pusėje, maršrutas `GET /api/rinkos-kontekstas?modelis=`.
2. Kortelė ir skelbimo puslapis: likvidumo punktas, ridos normos punktas, retumo įspėjimas – visi trys žinojimo lygių sistemoje.
3. Ketvirčio priminimas: Regitra skelbia naują failą – vienas paleidimas ir commit.
4. Vėliau: juridinių asmenų failas (kurios įmonės laiko kurių modelių parkus).
