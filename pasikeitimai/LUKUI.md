# Lukui · 2026-10-16 (v2.20.0 gyva)

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min.

## Leidimai
- Nieko nelaukia. v2.17.0 → v2.20.0 išsiųstos, visos deploy SUCCESS.

## Dizaineris – uždaryta, nieko nelaukia
66 / 67 (Errata 17) / 68 paketai įdiegti. Du jo klausimai atsakyti ir priimti:
pristatymo dienos – rėžiu (DE 5–7, PL 3–5, EU 7–10, LT 0); tuščios rinkos tekstas –
„be ridos ribos čia būtų 7" (nemokamai iš `hardRejectReasons`).
Jo maketai perdaryti su tavo skaičiais; Octavia sutampa su mūsų skaičiavimu.

## Luko sprendimai 2026-10-16 (vakare)

- **Planų ribos (nuorodų per parą)** – nekeičiam nieko, grįšim vėliau.
- **−3 % nuolaida** – lieka, bet Lukas duos atsiliepimą po patikros. Priminimas nustatytas **2026-10-17**.
- **Kodo darbai** – **laukiam, kol dizaineris užbaigs `dz-nuoroda`.** Markupo kol kas nepradedam.

## Kas vyksta dabar

| Kas | Pas ką | Būsena |
|---|---|---|
| `dz-nuoroda` paketas | **Dizaineris** | Išsiųsta 10-16. Laukiam. |
| Perpardavėjo rodinio markupas | Klaudijus | **Laukia** Luko ženklo (po dizainerio). |
| −3 % patikra produkcijoje | **Lukas** | Priminimas 10-17. |
| Planų ribos | — | Atidėta Luko sprendimu. |

CSS (66 + 68 paketai) įdiegtas, bet **dar niekur nenaudojamas** – ekrane jo nematyti,
kol nepadarytas markupas.

## Sprendimai, kurių laukiu
| Nr. | Kas | Ko reikia |
|---|---|---|
| KL-1016-NUOLAIDA | −3 % nuo LT medianos | **Laukia tavo patikros** – kaip tikrinti, žr. žemiau. Priminimas 10-17. |
| ~~KL-1016-NUORODA~~ | Nuorodos analizė | **Taip, darom.** Užduotis dizaineriui išsiųsta (`UZDUOTIS-NUORODA.md`). |
| ~~Planų ribos~~ | Nuorodų per parą | **Atidėta** – grįšim vėliau. |
| FN-0922-1600/1700 B | `planai.js` kainodara | **Vienintelis darbas, blokuojantis pilotus.** Siūlau daryti PO perpardavėjo peržiūros. |
| FN-0922-1310 | ScraperAPI Startup 149 $ | Be jo radaras ir užsakymų sekimas netelpa į fondą. |
| KL-1006-RADARAS | Radaras | Tas pats planuoklis kaip užsakymų sekimui – verta daryti kartu. |

## Kas padaryta šiandien (v2.17.0 → v2.20.0)
- Kaina lyginama su **savo šalies rinka** (LT/DE/EU/PL), ne su mišiniu. Vokiškas skelbimas nebeatrodo kaip radinys vien dėl rinkos skirtumo (−27 % → −5 %).
- **≈ Kaina Lietuvoje**: tikri kaštai iš viešų šaltinių + **taršos mokestis** (EV/PHEV 0 €, 3 l dyzelis ~200 €).
- **Didžiausia pirkimo kaina** – marža 10 %, paruošimas 350 €. Octavia: max 15 543 €, „telpa +1 043", pelnas 2 679 €, ROI 17 %.
- Rasta ir ištaisyta klaida: nauji laukai nepasiekdavo ekrano (baltasis sąrašas serveryje).
- Dizaino tokenų skola: **0 sulūžusių, 0 negyvų** – pirmą kartą.
- Sargai 22 žali (buvo 20), trys nauji: `rinkos`, `tarsos-mokestis`, `max-pirkimo`.

## PATIKRA: ar skaičiai teisingi (Lukui, ~15 min.)

Reikia ne „ar gražiai atrodo", o **ar skaičiais galima pasitikėti**. Trys žingsniai.

### 1. Paleisk paiešką modelio, kurį pažįsti (5 min.)

Rinkis tokį, kurio LT kainas žinai iš galvos. Pvz. Skoda Octavia Combi 2,0 TDI, 2023–2025.
Portalai: **autoplius + autogidas + mobile.de** (be jų trijų nebus ką lyginti).

Ko žiūrėti kortelėje:

| Laukas | Ką turi rodyti | Kada blogai |
|---|---|---|
| Antraštė | „LIETUVOS RINKA" prie LT skelbimo, „VOKIETIJOS RINKA" prie vokiško | jei visur „RINKOS VIDURKIS" – rinkų skaidymas neveikia |
| Mediana | LT mediana panaši į tai, ką matai autoplius pats | jei nukrypsta >10 % – pasakyk, kokia tavo |
| ≈ LIETUVOJE | tik prie užsienio skelbimų; užvedus matosi sudėtis | jei prie LT skelbimo – klaida |

### 2. Patikrink DIDŽIAUSIĄ PIRKIMO KAINĄ – svarbiausia (5 min.)

Išsirink vieną vokišką skelbimą ir paklausk savęs vieno klausimo:

> **„Ar aš realiai eičiau derėtis su šituo skaičiumi?"**

- Jei **per aukšta** (pirkčiau už tiek ir praloščiau) → nuolaida per maža, reikia daugiau nei 3 %.
- Jei **per žema** (už tiek niekas neparduotų, praleisčiau gerus auto) → 3 % per daug.
- Jei **maždaug tai, su kuo eitum** → 3 % geras.

Tai vienintelis klausimas, į kurį negaliu atsakyti pats – jis apie tavo rinką, ne apie formulę.

### 3. Tikriausias testas: neseniai parduotas auto (5 min.)

Jei turi auto, kurį **neseniai pardavei** ir žinai tikrą sumą:

1. Paleisk paiešką to modelio ir metų.
2. Pažiūrėk, kokią **LT medianą** rodo.
3. Suskaičiuok `mediana × 0,97` – tai mūsų „pardavimo kaina".
4. Palygink su tuo, už kiek **tikrai** pardavei.

| Rezultatas | Ką reiškia |
|---|---|
| Sutampa ±3 % | 3 % teisingi, nieko nekeičiam |
| Mes rodom **per daug** | nuolaidą didinam (5 %? 7 %?) |
| Mes rodom **per mažai** | nuolaidą mažinam arba nuimam |

**Ką man parašyti:** modelis, metai, mūsų rodoma mediana, ir už kiek realiai pardavei.
Iš trijų tokių pavyzdžių nustatysiu tikslų procentą, ne spėjimą.

Keitimas – viena eilutė (`PARDAVIMO_NUOLAIDA`), tad nebijok pasakyti, kad ne taip.
