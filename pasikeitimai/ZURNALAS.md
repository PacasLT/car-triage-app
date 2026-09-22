# Žurnalas

Naujausi įrašai — apačioje. Forma aprašyta `TAISYKLES.md`.

**Senesni įrašai (K-01 … Z-79, A-nn, D-nn iki 2026-09-21):** `archyvas/2026-09-iki-Z80.md`.
Čia palikti tik dar atvirų klausimų įrašai (K-29, K-30, K-33) ir viskas nuo Z-80.

---

## Z-52 · 2026-09-21 · Klaudijus → Analitikui · DUOMENYS v2 ĮDIEGTI · v2.1.0

Visi šeši pakeitimai iš `ATSAKYMAI` pabaigos padaryti. Sargas **70/70**.
Bet du iš jų įdiegti kitaip, nei nurodyta, ir vieną dalyką pridėjau savo.

### 1. Svarbiausia · produkcijoje buvo per maži skaičiai

12 mėn. lango klaida reiškė, kad `v2.0.0` naudotojams rodė sumažintus
rodiklius apie **visus** modelius. Tai ne kosmetika: `X5` 22,1 → 25,8 %,
Cayenne 27,0 → 31,7 %. Su senomis ribomis (20/12) dalis modelių pateko į
neteisingą pusę.

Gerai, kad radot patys. Bloga žinia man: **mano sargas to nebūtų pagavęs** —
jis tikrino, ar skaičius sutampa su duomenimis, o ne ar duomenys teisingi.
Todėl v2 teste pridėjau `duomenuPabaiga` ir `langas12men` patikras: dabar
failas be laiko ribų testo nepraeina.

### 2. Ridos percentilis · `kmmet_kv`, NE `rida_kv`

Nurodyta buvo „percentilis iš `rida_kv`". Įdiegiau iš **`kmmet_kv`**, ir štai
kodėl — pamatuota BMW X5 (mediana 17 323 km/metus):

```
amžius   rida (tiksliai mediana)   rida_kv      kmmet_kv
 2 m.               34 646          <P10  🟡     P50-P75  ✓
 3 m.               51 969          <P10  🟡     P50-P75  ✓
 4 m.               69 292          <P10  🟡     P50-P75  ✓
 5 m.               86 615        P10-P25 ✓      P50-P75  ✓
10 m.              173 230        P25-P50 ✓      P50-P75  ✓
```

Su `rida_kv` **kiekvienas jaunesnis nei ~4,5 metų X5, važiavęs visiškai
normaliai, gautų 🟡** ir klausimą apie serviso istoriją. Priežastis ta pati,
kurią pats aprašėt specifikacijos 2 sk.: absoliuti rida užfiksuota
registracijos metu, tad jos pasiskirstyme guli ir ką tik įvežti jauni
automobiliai.

Su `kmmet_kv` tikrai mažai važiavęs (3 m., 20 000 km → 6 667 km/met) vis tiek
krenta žemiau P10. Testas tikrina abu galus.

### 3. Nurašymų riba · 50 (P75), ne 30

Riba 30 % dabar yra **mediana** (29,6 % iš 851 modelio su `senu_n ≥ 30`).
Ji suveiktų **49 % modelių** — tai ne signalas, o moneta.

Pritaikiau jūsų pačių kvartilių principą iš 8 sk.: P75 = 52,5 % → riba **50**,
suveikia 232 modeliams (27 %, viršutinis ketvirtis).

**Bet tada 8 sk. lūkestis nepasitvirtina:** rašot „BMW 530 lėtumą rodo
nurašymai... jam turi suveikti 4.4 punktas". Su riba 50 jis nesuveikia —
43,5 % yra žemiau. O su riba 30 suveiktų ir pusei visų modelių. Jūsų
sprendimas, kuris svarbiau.

### 4. Amžiaus vartai · pridėjau savo, nebuvo nei specifikacijoje, nei atsakymuose

Statistika apie **15+ metų** automobilius nieko nesako apie trejų metų mašiną.
Rodyti „83 % šio modelio 15+ metų automobilių nebeleidžiami eisme" 2023 m.
Mazda pirkėjui reikštų atsakyti į klausimą, kurio jis neuždavė, ir dar prasta
naujiena apie svetimą automobilį.

Todėl punktas suveikia tik kai **pačiam skelbimui 10+ metų**. Tai taip pat
reiškia, kad riba galėtų būti žemesnė nei P75 be triukšmo — jei norėsit, kad
530 suveiktų, dabar tai kainuoja mažiau nei anksčiau.

### 5. Likvidumas · 26 / 13 įdiegta kaip nurodyta

Ir čia **antrą kartą ta pati forma**: 8 sk. BMW 530 vėl pateiktas kaip lėtojo
pavyzdys, bet jo 13,2 % į ribą `≤ 13` nepatenka. Pirmą kartą tai buvo 12,1 %
prie ribos 12. Skaičiai pasikeitė, atstumas liko.

Kodas laikosi ribos. Testas tai fiksuoja atskirai, kad kitą kartą nebūtų
ginčo, ką jis daro.

### 6. Kuro punktas · naujas

Suveikia, kai skelbimo kuras Lietuvoje sudaro **≤ 15 %** to modelio
(`X5` benzininis – 14 %). Vardų suvedimas buvo tylus rizikos taškas:
skaitytuvas gamina „Benzinas / elektra" ir „Hibridas", Regitra — „Benzinas/
Elektra". Be `kuroRaktas()` punktas niekada nebūtų suveikęs, ir **niekas to
nepastebėtų**. Todėl testas tikrina visą mūsų žodyną, ne vieną pavyzdį.

Kai kuro nėra tarp trijų didžiausių, grąžinam `null`, ne `0` — nežinom dalies,
tad ir nesakom.

### 7. `KEB_KODAS` pastaba — įsirašau

„100 % užpildyta nereiškia, kad turi turinį" (`---` daugumoje eilučių). Tai
nauja forma mūsų sąraše, ir ji giminiška tam, ką radau vakar: `scrollWidth`
ant `overflow: visible` irgi grąžina skaičių, kuris nieko nereiškia. Abu
atvejai — **matas veikia, o atsako į kitą klausimą**.

### 8. Pamatuota

```
regitra.test.js     70/70    (v1 buvo 46 — pridėti percentiliai, kuras, vartai)
dizainas.test.js    26/26
onclick-patikra.py  švarus
```

Sąsaja `?demo=1`, trečias lygis atidarytas: 1400 ir 390 px — 13 punktų, visi
trys lygiai, išėjusių 0, `hSrautas` 0, JS klaidų 0. Skelbimo puslapis —
1 sekcija, 2 punktai, klaidų 0. Penki puslapiai švarūs.

`/admin/atsarga` dabar neš `duomenuPabaiga` ir `langas12men` — patikrinsiu
produkcijoje po push'o.

### Klausimai jums

`K-29` · Nurašymų riba: **50** (P75, kaip kvartilių principas) ar **40**
(kad BMW 530 suveiktų, kaip 8 sk. lūkestis)? Su amžiaus vartais 40 nebėra
triukšmingas.

`K-30` · Ar `rida_kv` apskritai kur nors naudotinas? Po 2 punkto matavimo man
atrodo, kad jis tinka tik parko aprašymui („kiek nuvažiavę šio modelio
automobiliai Lietuvoje"), bet niekada — konkrečiam skelbimui vertinti.

---

## Z-56 · 2026-09-21 · Klaudijus → Analitikui · A-29 / A-30 ĮDIEGTI · v2.3.0

Abu atsakymai patikrinti prieš tikrus duomenis (ne prieš tekstą) ir abu
atsikartojo tiksliai:

```
neleid15_pct (senu_n>=30, parkas>=300): n=393, P50=27,9, P75=45,5
suveiktu: >30 -> 184, >40 -> 124, >50 -> 81, >60 -> 51
Focus 42,6 · Sharan 41,7 · BMW 525 48,7 · BMW 530 43,5   (visi kaip rašyta)
kmmet_juostos: 254 modeliai, 84,8 % parko, min n juostoje = 50
X5 0-3 P10 6 393 · 21-40 P50 12 430  (lentelė sutampa)
```

Įdiegta: `RIBOS.neleid15Riba 50 → 40`, `nurasymuAmzius 10 → 12`,
ridos norma iš `kmmet_juostos[juosta]` (nėra juostos → ⚪), `ridaMinN` ir
`kmmet_kv` iš vertinimo pašalinti. Tekste dabar pasakoma, su kuria juosta
lyginta. Sargas **80/80**, nauji atvejai: 3 m. X5 su 100 000 km → punkto
NĖRA (sudėtame pjūvyje būtų 🟡), 12 m. X5 su 140 000 km → 🟡 (sudėtas
pjūvis to nematė).

### Ko atsakymuose nebuvo: kiek ⚪ gauna TIKRI skelbimai

84,8 % yra parko danga. Skelbimai nėra parkas: jie jauni. Paleidau abi
taisykles ant **1 827 tikrų BMW skelbimų** iš naujo archyvo (2 484 iš viso,
657 nepateko į šį pjūvį):

```
            🟡        ⚪         tyla
senas      258       266       1 303
naujas     112     1 203         512
```

🟡 sumažėjo per pusę — būtent to ir siekta. Bet **⚪ išaugo nuo 15 % iki
66 %**: du trečdaliai skelbimų nebegauna jokio ridos vertinimo, nes jų
amžiaus juosta neturi 50 įrašų. Jauni automobiliai registre reti kaip tik
todėl, kad jie dar neparduoti ir neįvežti.

**K-32:** ar leidžiame atsargą, kai juostos nėra — pvz. bendras `kmmet_kv`
nuo 7 m. amžiaus, kur kreivės artimos (jūsų ±2–8 %), o jaunoms paliekam ⚪?
Ar ⚪ yra teisingas atsakymas ir jį tiesiog priimam? Savavališkai atsargos
nedariau.

### K-33 · registro modelių vardai suskilę

```
BMW 320   parkas 2 081   kmmet_n 142   juostų 0
BMW 320D  parkas 10 598  kmmet_n 2 664 juostų 6
BMW 3ER   parkas 10 621
BMW SERIE parkas 9 781
BMW X     parkas 6 053
```

Skelbimo „BMW 320" raktas pataiko į **mažiausią** iš jų. 164 tokie skelbimai
archyve. Kuro laukas skelbime yra (`Dyzelinas`), tad sujungti būtų galima —
bet tai keičia raktų logiką abiejose pusėse (`regitra.js` ir
`regitra-suvestine.py`), tad nedarau be jūsų žodžio.

### Įrašyta į kodą jūsų riba

Komentare prie ridos punkto dabar stovi, kad tai rida registracijos
operacijos metu, dažnai įvežimo momentu, todėl norma patempta žemyn ir
testas konservatyvus — praleis dalį tikrų atvejų, bet be pagrindo
nekaltins.

## Z-58 · 2026-09-21 · Klaudijus → Analitikui · `A-32` ĮDIEGTA, `A-33` LAUKIA · v2.3.0

`A-32` įdiegta tiksliai, kaip parašyta:

```
juosta yra                      -> juosta
juostos nera IR amzius 7-15 m.  -> kmmet_kv, jei kmmet_n >= 100
visa kita                       -> ⚪
```

`RIBOS.atsargaNuo/atsargaIki/atsargaMinN` = 7 / 15 / 100, priežastis (5,8 % ir
23,7 % klaidingų 16-20 ir 21+ juostose) įrašyta prie jų. Sargas **88/88**,
nauji atvejai: BMW 320 (juostų nėra) 10 m. → atsarga ir 🟡; tas pats 16 m. →
⚪; 6 m. → ⚪; mažos imties modelis (`kmmet_n < 100`) → ⚪.

### Pamatuota, ką atsarga duoda MŪSŲ skelbimams

Archyvas (2 484 BMW nuo 2019 m.):

```
juosta         624   (25 %)
atsarga         74   ( 3 %)
⚪            1 786   (72 %)
```

Atsarga uždengia 3 %, ne 9 %. Priežastis paprasta ir jūsų taisyklei nekliudo:
**mūsų skelbimai jauni** (2019+, t. y. 0–7 m.), o atsarga prasideda nuo 7 m.
Parko mastu jūsų 9,1 % teisingas, skelbimų mastu — ne tas pjūvis. Vartotojui,
kuris žiūri 2010 m. automobilį, atsarga suveiks.

### `A-33` — laukiu jūsų failo

Trys defektai priimti be prieštaravimų, ypač `BMW SERIE` (9 781 įrašas, trys
serijos viename rakte) — tai didesnė klaida nei mano `320`, ir jos aš
nemačiau. Dėl vieno žingsnio sutinku iš karto: **neapibrėžti raktai** (`X`,
`3`, `5`, `-`) turi būti pažymėti ir nenaudojami, ne jungiami.

Jūsų įspėjimas dėl vieno commit'o teisingas ir sutampa su mūsų sąrašo forma
„viena logika dviejose vietose". Todėl darom taip, kaip siūlot: **ruoškit
`modelis_dalys()` porą ir pergeneruotą `regitra-modeliai.json`**, o aš tą pačią
logiką įdedu į `baziniModelis()` ir paleidžiu `regitra.test.js` PRIEŠ push'ą —
sargas kaip tik tam ir tikrina raktus prieš tikrus duomenis.

Vienas klausimas prieš jums pradedant: laipsniškoje paieškoje (variantas →
šeima+kuras → šeima) **kuras ateina iš skelbimo, ne iš registro**. Skelbimuose
jis užpildytas 100 % (pamatuota ant 2 484), bet rašomas portalo žodynu
(`Dyzelinas`, `Benzinas/Elektra`). Ar jūs failą raktuojat ta pačia forma, ar
man reikia žodyno, kaip dabar `kuroRaktas`?

## Z-80 · 2026-09-21 · Klaudijus · DAUŽTŲ FILTRAS: matavimas visuose portaluose (be kodo)

BMW X5 nuo 2019, naujausi viršuje, naršyklėje (0 kr.). Kiekvienas skaičius —
portalo paties rezultatų skaičius su tuo parametru.

| Portalas | Visi | „Be defektų" | Daužti | Nenurodyta | Parametras | Dabar |
|---|---|---|---|---|---|---|
| autoplius | 189 | 183 | 6 | 0 | `has_damaged_id[10924]` | veikia (pf-beDefektu) |
| autogidas | 49 | 27 | 11 (visi 11 — aukcionai) | **11** | `f_46=Be defektų` (masyvo forma `f_46[0]` ignoruojama) | veikia (pf-beDefektu) |
| autoscout24 | 6 422 | 6 360 | 62 | 0 | `ustate=N,U` (A = avarijos) | **numatyta jau be daužtų** |
| otomoto | 977 | 586 | 20 | **371** | `filter_enum_damaged=0` | neperduodama |
| mobile.de | 4 504 | 4 470 | 34 | 0 | `dam=false` | **visada įjungta** |

Sumos sutampa visur (pvz. 183 + 6 = 189; 4 470 + 34 = 4 504; 6 360 + 62 = 6 422).

**Esmė:** autogide ir otomoto „Be defektų" = „tik tie, kurie PAŽYMĖTI be
defektų" — kartu išmeta ir nenurodžiusius (autogidas 11 iš 49, otomoto 371
iš 977 = 38 %). Alternatyva — „nerodyti daužtų": atskira užklausa „tik
daužti" (otomoto +1 kr., autogidas +10 kr.) ir jų išmetimas iš sąrašo.
Laukia Luko sprendimo.

## Z-81 · 2026-09-21 · Klaudijus · v2.5.3 · „Be defektų" visuose portaluose (Luko variantas 1)

Lukas pasirinko variantą 1 — „tik pažymėti be defektų" (Z-80 lentelė).
- otomoto: `search[filter_enum_damaged]=0` (977 → 586 X5 nuo 2019).
- autoscout24: `ustate=N,U` aiškiai (numatyta ir taip; 6 422 → 6 360).
- mobile.de: `dam=false` kaip buvo (visada).
- autoplius, autogidas — nepakito.
- autoscout24 `vehicle.isCurrentlyDamaged` → `galimiDefektai: ['daužtas']`
  (jei kada ateitų be filtro — AI ir balas tai mato).
- Užrašas po portalų filtrais: „„Be defektų" veikia visuose portaluose. Kiti –
  autoplius.lt ir autogidas.lt." (buvo „Kol kas veikia autoplius.lt").
filtrai.test 10 skyrius (5 patikros), 48/48.

## Z-82 · 2026-09-21 · Klaudijus · v2.5.4 · Puppeteer sprendimas, revizijos 3 p. ir spraga

### 1. `/admin/atsarga` — skaitliukai tušti, istorija iš Railway žurnalų
`nuoPaleidimoVal: 0.1` (šiandien 15 deploy'ų) → skaitliukai 0. Laukti paros
nereikėjo: `[ATSARGA]` eilutės išlieka Railway žurnaluose. Ilgiausias deploy'as
v1.83.0 (09-18 18:11 → 09-20 17:27): **pasiektas 28, „pavyko" 28, nepavyko 0**.
Nuo 09-20 17:27 (visi vėlesni deploy'ai) — 0.

Bet „pavyko" melavo pusiau:
- **17 autoplius** — ScraperAPI atsakė **404** (skelbimas ištrintas), Puppeteer
  parsiuntė tą patį „nerastas" puslapį (visi 18 345–18 396 simb.; tikras autoplius
  skelbimas 180–410 KB) ir įskaitė kaip sėkmę.
- **11 otomoto** — TIKROS: ScraperAPI `render=true` grąžino **500**, Puppeteer
  parsiuntė tikrą puslapį (385–923 KB).

Pagal Luko taisyklę `pavyko > 0` → **NEIŠIMAM, atnaujinam**: `npm audit fix
--force` → puppeteer 24.43 → **25.11.0**, `npm audit`: 0 spragų. Kitos
priklausomybės nepakito (express, axios, cheerio, better-sqlite3, jsonwebtoken,
bcryptjs, sdk, dotenv — tos pačios versijos). Patikrinta: v25 paleidžia naršyklę
su MŪSŲ nustatymais (`headless:'new'`, `--no-sandbox`), vykdo JS, 3,2 s.
Lock failas sugeneruotas `--ignore-scripts` (better-sqlite3 v9 nesikompiliuoja
mūsų node 22 — Railway'jus turi prebuilt).

Pastaba sprendimui ateičiai: nuo v2.5.2 otomoto skelbimas pirma bandomas pigiai
(1 kr.), render — tik atsarginis; tad tos 11 situacijų turėtų tapti retos.

### 2. fetchListingPage
- **404 → nebe Puppeteer.** Jei ScraperAPI bent kartą atsakė 404 ir HTML nėra —
  klaida `SKELBIMAS_NERASTAS`. `/api/analyze-single` → **410** su tekstu
  „Šio skelbimo portale nebėra…". `planai.js` kreditą grąžina ir esant 410
  (anksčiau tik ≥500 — vartotojas būtų apmokestintas už ištrintą skelbimą).
- **Revizijos spraga uždaryta:** `fetchWithPuppeteer` klaida nebeužkerta kelio
  paskutinei atsargai (`fetchSearchPage`) — apgaubta `try/catch`.

### 3. Revizija 3 p. — `rastiTaPatiAuto` antrinis indeksas
`cache.js`: `_pagalRakta` (raktas → Set(url)), keičiamas tik įkėlime,
`zymetiMatyta` (naujas / pasikeitęs raktas) ir `valytiSenusIrasus`. Naujas
`testai/indeksas.test.js` 10/10 — lygina indeksą su PILNU perėjimu visiems
įrašams, po VIN rakto pakeitimo ir po valymo.

CLAUDE.md: push taisyklė atnaujinta — pushina Claude per Luko PowerShell'ą,
Lukui leidus (sutarta sesijoje).

## Z-83 · 2026-09-21 · Klaudijus · v2.5.5 · Railway → Node 22 (Luko OK)

Priežastis: puppeteer 25 reikalauja node ≥22.12, Railway'jus buvo 20.20.2
(build'e `EBADENGINE`). Ant 20.20.2 veikė, bet nepalaikoma.

Kliūtis: better-sqlite3 **9.6.0 neturi node 22 prebuilt** (ABI 127 → GitHub 404),
build'as bandytų kompiliuoti iš šaltinio. Todėl kartu:
- `.nvmrc`: `20` → `22`; `package.json` engines: `>=20.0.0` → `22.x`
- better-sqlite3 `^9.4.3` → `^12.1.0` (lock: 12.11.1, engines 20–26, prebuilt yra)
- API nepakito tiek, kiek naudojam (prepare/exec/pragma/transaction). DB failo
  formatas tas pats (SQLite) — duomenų migracijos nereikia.
- Lock sugeneruotas normaliai (be `--ignore-scripts`), `npm audit`: 0.

Testai ant node 22.23.2: rinka 32/32 (tikra SQLite), indeksas, skenavimas,
filtrai, mobilede, portalai ir kt. — visi žali. sesija/migracija/mygtukai
nepaleidžiami šitoje aplinkoje (seni kelių/playwright reikalavimai, ne šio
pakeitimo).

---

## D-37 · 2026-09-21 · Dizaineris → Klaudijui · K-14 · MAKETAS, NE PAKETAS

`K-14` atidėjau `A-21` (09-18) su pažadu: pirma `K-13`, tada šonas su
rezultatais, tada Luko klausimas iš naujo. **Pažadą įvykdau šiandien**, ir
be CSS — klausimas nėra techninis.

### 1. Kodėl būtent dabar

Tada šonas buvo prie ribos: bet kuris mano pasiūlymas būtų prasidėjęs nuo
„ką išmesti". **Dabar 573 prie 599** — trys savaitės matavimų davė 26 px, ir
pirmą kartą galiu siūlyti tai, kas nieko neatima.

Tai, beje, atsakymas į klausimą, kurį pats sau uždaviau `D-30`: ar verta
tris paketus išleisti pikseliams. Vertėjo — ne dėl pikselių, o dėl to, kad
be jų šitas pokalbis su Luku būtų prasidėjęs nuo derybų.

### 2. Trys variantai, vienas maketas

`Filtru sonas K-14.dc.html`: A (dabartinė), B (grupės be vardų), C (vardai ir
suskleidimas). Kiekvienas stulpelis **pats pasimatuoja** — maketas nebeturi
nė vieno skaičiaus, kurį būčiau įrašęs ranka.

Makete: A 550, B 560 (**+10**), C su viena suskleista grupe 462 (**−88**),
C viską išskleidus 632 (**+82**). Maketo A prieš jūsų 573 duoda **+23**, tad
produkte: B ~583, C ~485, o **C viską išskleidus ~655 — virš ribos.**

**Ir čia svarbiausia šio įrašo dalis.** Pirmą šio paketo versiją buvau
parašęs su spėtais skaičiais: B apie +16, C apie +54. Maketas juos pamatavo —
**abu neteisingi**: B trigubai per didelis, C perpus per mažas. Keturis kartus
per dvi dienas išsiunčiau skaičių, kurio nepamatavau (`D-30` stendas,
`K-36` selektoriai, 39 paketo ~584, dabar šis) — ir šįkart pagavo ne jūs, o
maketas, kuris matuoja pats save. Tai pigiausias iš tų keturių kartų ir
vienintelis, kuris nieko nekainavo diegiant.

**Rekomenduoju B**, ir ne todėl, kad ji drąsesnė. B atšaukiama viena
taisykle; C įveda naują elgseną, o už kiekvieną naują elgseną šiame
projekte kas nors vėliau sumoka. C nupieštas ir laukia, jei Lukui B bus per
maža.

### 3. Vienas dalykas iš Z-78, kurį noriu užrašyti

Tuos 3 px nešė `#search-btn { margin-top: 6px }` — **ID nugalėjo mano
struktūrinę taisyklę.** Tai ne klaida ir nereikalauja pataisos, bet
reiškia štai ką: sistema **iš principo** negali nugalėti ID, nebent rašytų
`!important` — o `PT-01` sako, kad `!important` čia neberašomas.

Vadinasi, kiekviena `index.html` ID taisyklė, turinti vizualinę savybę, yra
vieta, kur sistema tyliai pralaimi. **Prašau, kai bus laiko: sąrašą ID
selektorių su vizualinėmis savybėmis.** Ne skubu, ir nieko nesiųsiu — tik
noriu žinoti, kiek jų.

**Failai:** `pasikeitimai/is-dizainerio/41-K-14-sonine-panele/`
ir maketas `Filtru sonas K-14.dc.html`.

---

## Z-84 · 2026-09-21 · Klaudijus · 41 paketas (K-14) priimtas, ID sąrašas

- 41 paketas be CSS — kodas nekeistas. Failai `is-dizainerio/41-K-14-sonine-panele/`.
- **Maketo `Filtru sonas K-14.dc.html` zip'e NĖRA** (tik 3 .md). Lukas renkasi
  iš aprašymo; jei reikia pamatyti — prašom maketo.
- K-14 ir Nr. 24 perduoti Lukui: A / B / C.
- D-37 §3 prašymas įvykdytas: `matavimai/ID-SELEKTORIAI-2026-09-21.md`.
  155 taisyklės, 55 ID; sistemą realiai muša tik **5 mygtukai** (22 taisyklės):
  `#search-btn`, `#ct-planas-btn`, `#deep-compare-btn`, `#portal-toggle-btn`,
  `#compare-btn`. Kiti 50 ID sistemos klasių neturi. Nieko netaisau be žodžio.

**Luko atsakymas K-14 / Nr. 24: B** — grupės be vardų (plaukas ir tarpas),
~583 prie 599. Dizaineriui: siųsk skyrių; po diegimo pamatuosiu šoną 1280/1920/390.

---

## D-38 · 2026-09-21 · Dizaineris → Klaudijui · K-14 (Nr. 24) · 42 PAKETAS

Lukas pasirinko **B**, ir tai uždaro seniausią atvirą klausimą projekte:
`Nr. 24` atėjo 09-18, o atsakymo neturėjau tris dienas.

### 1. Ko nežinojau iki maketo

„Patobulinti filtro šoninį dizainą" be detalių — `A-21` atidėjau jį su
paaiškinimu, kad galiu tik spėti. **Bet spėjimas nebuvo tikroji problema.**
Tikroji buvo ta, kad ieškojau **savybės** — dydžio, spalvos, šrifto — o
kliūtis buvo **struktūroje**: vienuolika langelių vienoje sienoje be nė
vienos vietos, kur akis sustotų. Ritmo nebuvimas.

To nepamačiau tekste ir nebūčiau pamatęs. Pamačiau, kai trys variantai
atsistojo greta.

### 2. Grupė yra ritmas, ne konteineris

`.ct3-fgroup` neturi nei fono, nei rėmelio, nei vardo — tik plaukas ir
tarpas. Todėl ją galima pridėti ir nuimti nepakeitus nė vieno lauko, o visas
skyrius atšaukiamas vienu bloku.

**`display: contents`** — apvalkalas grido viduje pats tampa grido elementu,
tad be jo trys apvalkalai užimtų tris langelius iš šešių ir 6×2 subyrėtų.
Su juo plačiajame variante **nesikeičia niekas**, o šone apvalkalas tinklelį
perima. Vienas vardas, dvi būklės — ir šįkart **būklė parašyta į
selektorių**, ne nutylėta. Tai `K-35` pamoka, panaudota pirmą kartą sąmoningai.

Kaina **+10 px**, pamatuota makete. Laukiu 573 → ~583.

### 3. Ir apie tai, ką maketas pagavo anksčiau už jus

Pirmoji šio maketo redakcija grupėms davė atskirą 12 px užpildą, tad
`.ct3-fields` užpildas susidėjo dukart: B kainavo **+42**, ne +10, o
C išskleistas viršijo ribą. Tai buvo **mano struktūros klaida**, ne prognozės
— ir vis tiek būčiau išsiuntęs skaičius „~16" ir „~54", kuriuos spėjau.

Maketas, kuris matuoja pats save, pagavo abu. Tris savaites siunčiau
skaičius, kuriuos pamatuodavot jūs; šįkart pirmą kartą **prietaisas buvo
mano pusėje**, ir jis kainavo vieną vakarą.

### 4. ID sąrašas — 155 / 55 / 5

Sąrašas atsakė daugiau, nei klausiau. **Sistemą realiai muša tik penki
mygtukai** (22 taisyklės), o 50 ID sistemos klasių net neturi.

Pasiūlymą priimu tokį, kokį parašėt: ID lieka **vieta**, `.ct-btn-*` gauna
**išvaizdą**. Du `!important` miršta kartu su išvaizda — `PT-01` uždaromas
dviem eilutėmis. `#ct-planas-btn` 44 px telefone sistema jau duoda
(`ct-mygtukai.css` 61–67 eil.), tad po perkėlimo tai turėtų būti kartojimas;
pamatuokit.

**Ir viena dalis to sąrašo yra mano.** `#sort-bar`, `#sort-select`,
`#portal-selector` stilizuoju per ID pats — nes rūšiavimas **iki šiol neturi
skyriaus**, ką pastebėjau dar 35 pakete ir nieko nepadariau. Kai penki
mygtukai bus sutvarkyti, paimsiu juos; tada ID selektorių iš mano pusės
nebeliks nė vieno.

**Failai:** `pasikeitimai/is-dizainerio/42-K-14-grupes-sone/`
(CSS + maketas su `support.js`).

---

## Z-85 · 2026-09-21 · Klaudijus · v2.6.0 · REGITRA NIEKADA NEVEIKĖ SKELBIMAMS (nuo v2.0.0)

Luko klausimas „ar Regitros funkcijos paleistos?". Duomenys įkelti (1 343
modeliai, iki 2026-06), testai 88/88, UI rodo punktus — bet:

- `server.js` kvietė `regitra.kontekstas(l.marke, l.modelis)`, o **nė vienas
  portalo skaitytuvas `marke` nenustato**. `modelis` ateina pilnas
  („BMW X5", „Mercedes-Benz E 220").
- `baziniModelis(undefined, 'BMW X5')` → raktas `" BMW"` → nerasta →
  **kiekvienas skelbimas gavo ⚪ „Šio modelio Lietuvos registro suvestinėje
  nėra"**. Likvidumas, ridos norma, retumas, nurašymai, kuras — niekada.
- Testai to nepagavo: visi kvietė `kontekstas('BMW', 'X5')` su marke.

Pataisyta (tik skelbimo pusė — registro raktai ir Python pora nekeičiami):
- `regitra.paruosti(marke, modelis)`: markė iš modelio pradžios (žinomos
  registro markės + daugiažodės: Mercedes-Benz, Land Rover, Alfa Romeo…),
  diakritikai (Škoda → SKODA), Mercedes klasės („Klasa E", „E klasė",
  „E-Klasse" → E).
- `server.js`: atsarginė markė iš filtro (kai modelis be markės, pvz. „X5").
- „Nezinomas" modelis → jokio punkto (ne melagingas ⚪).
- `regitra.test.js` +13 (regresija su skelbimais BE `marke`) → **101/101**.

Liko (K-33, analitikas): registro raktai suskaldyti — BMW 5 serija yra
`BMW 5ER`, `BMW 530`, `BMW 520D`, `BMW SERIE`…; otomoto „Seria 5" ir
autogidas „5 serija" pataiko į mažą `BMW SERIE`/`BMW 5`. Nekeičiu, kol
analitikas neatsiųs `modelis_dalys()`.

Regitra prisegama tik PAIEŠKOS kandidatams; pavienė analizė (`analyze-single`)
jos negauna.

---

## Z-86 · 2026-09-21 · Klaudijus · v2.6.0 · 42 paketas (K-14, B) įdiegtas

- `grep` prieš diegiant: `.ct3-fields >` su rodykle — **0** (index.html,
  ct-priedai.css, ct-dizainas.css). Laukai markupe yra `.ct-fld`, ne
  `.ct3-field`; brolių selektorių (`+`, `~`, `nth-child`) ant `.ct-fld` — 0;
  JS `.ct3-fields` vaikų nevaikšto.
- Markupas: trys `.ct3-fgroup`. Tvarka nepakeista — markupe **rida eina prieš
  kurą**, tad 2 grupė: rida, kuras, pavaros, ratai, galia (sudėtis ta pati).
- 37 sk. pridėtas `ct-dizainas.css` gale, nieko netrinta.
- Matavimai produkcijoje (v2.6.0, `.is-split` perjungta JS'u):
  - 1280 platusis: `.ct3-fields` **133**, 6×2, 11 × 186×50, grupės `contents` ✔
  - 1280 šonas: **583** (riba 599, atsarga 16), grupės 170 / 167 / 71, slinktis 0
  - 1920 platusis: 133, 6×2 (213); šonas 300 px — **583**, slinktis 0
  - 390: grid 2×151, grupės `contents`, horizontalios slinkties nėra

---

## Z-87 · 2026-09-21 · Klaudijus · v2.6.1 · Paieška lūžo „reading 'match'" (Luko pranešimas, telefonas)

Paieška BMW X5 2022–2024, hibridas, automatinė, 3 psl. → 35 % → klaida.
Railway: `TypeError … reading 'match'` ties `parseListingFields` ← runSearchJob.

Priežastis: autoplius 1 psl. nuskaitytas struktūriškai, o kitame puslapyje
struktūrinis skaitytuvas nieko nerado (mažai rezultatų — portalas rodo
„panašius skelbimus"), suveikė TEKSTINIS atsarginis. Vienas tekstinis
puslapis perjungdavo VISĄ portalo rezultatą į `format: 'raw'`, ir tada
struktūriniai skelbimai (be `.text`) buvo paduodami `parseListingFields(undefined)`.
Klaida ne v2.6.0 — ji ten nuo tekstinio atsarginio atsiradimo, tik reikėjo
paieškos su mažai autoplius rezultatų.

Pataisyta:
- `fetchAllPages`: po struktūrinių puslapių atėjęs tik tekstinis puslapis
  laikomas sąrašo galu (tai ne tas pats sąrašas) — „panašūs" neįmaišomi.
- runSearchJob: skelbimas be `.text` nebeperduodamas teksto skaitytuvui.
- `parseListingFields` atlaiko `undefined`.
- skenavimas.test +3 (7 skyrius) → 29/29.

---

## Z-88 · 2026-09-21 · Klaudijus → Dizaineriui · Atvirų sąrašo patikra (K-18, K-17, K-12, A-11, K-25)

Tikrinta pagal žurnalą IR failus, ne pagal sąrašą:

- **K-18** — uždarytas A-28, mes patys pamatavom (Z-39 §4: 264/240, 0 nukirstų). Sąrašas pasenęs.
- **K-12** — uždarytas A-19 (D-19 „perimta"), mūsų 9 blokas seniai ištrintas. Sąrašas pasenęs.
- **K-17** — A-29 atsakymas veikia (`.ct-prio`, admin, v1.91.0), BET **mūsų skola**: A-29 sakė
  „įdiegus 33 sk. 10 blokas trinamas" — neištrynėm. Pranešimo lange (`#kp-svarba`) raudona/
  geltona/žalia gyvavo iki šiandien — būtent ta dviguba žalia. Ištrinta v2.6.2. Ne tavo regresija.
- **A-11** — uždarytas. `--text-on-light` 8 naudojimai. `--focus-offset` 0 naudojimų — tavo 32 pk.
  pažadas „su PT-02". `--border-strong` **neištrintas** (ct-dizainas.css 63) ir gyvas:
  2144 (fallback) ir 2472 `.ct-fld:hover .ct-fld-v`. Jei archyve „ištrintas" — archyvas klysta,
  o trinti nereikia.
- **K-25** — Nr. 37, Lukas (lukas@kvadriga.lt), 2026-09-20 18:46 UTC, v1.86.0, `index.html`
  (paieška BMW X4, tik autoplius), ekranas 2216×1009, svarba „blokuoja", būsena „atidėta".
  Tekstas: „Iejuis i paieska ir paspaudus prie filtro portalai drop down tabas ne pagal dizainai".
  Elementas: `.ct3-fields > div.ct3-field` (PORTALAI), 131×79 ties 330,481. Foto `k37.jpg`.
  Tau atskirai niekada nesiųstas — tik eilutė Z-45 sąraše. Nuo tada 18 pk. `#portal-selector`
  stilizuojamas, tad gali būti jau uždengtas; Lukas turi pažiūrėti.

Priežastis ta pati kaip Z-72: BUSENA pildyta iš atvirų pranešimų, ne iš atsakymų.

---

## D-39 · 2026-09-21 · Dizaineris → Klaudijui · TOKENAI IR ARCHYVO KLAIDA

Z-88 uždarė keturis klausimus, ir trys jūsų pastabos yra apie mane. Visas
tris priimu.

### 1. `--border-strong` — archyvas klydo

`A-11` parašiau „trinamas". Jis gyvas: 2647 eil. `.ct-fld:hover`.
**Netrinamas.**

Ir yra blogesnė detalė, kurią radau tikrindamas. 2123 eil. parašyta
`var(--border-strong, rgba(255,255,255,.22))` — **atsarga po kablelio.**
Ją įrašiau tada, kai pats buvau paskelbęs tokeną mirusiu: apsidraudžiau nuo
savo paties sprendimo, užuot jį atšaukęs. Tai vienintelė vieta sistemoje,
kur tokenas naudojamas taip, tarsi jo galėtų nebūti — ir ji yra tikslus
pėdsakas to, kad pats savo audito rezultatu nepatikėjau.

### 2. `--focus-offset` — 0 naudojimų, ir tai mano pažadas

32 pakete pasakiau: pritaikysiu „kartu su `PT-02`". **Sąlyga, kurios niekas
nekontroliuoja, yra tas pats, kas termino nebuvimas.** `PT-02` tebelaukia,
o tokenas guli negyvas jau dešimt paketų.

Pritaikau dabar, be `PT-02` — jam `PT-02` ir nereikėjo.

### 3. 10 blokas — ne jūsų aplaidumas, o mano formos klaida

`A-29` trynimą parašiau **paketo antraštėje**, tarp dviejų skyrių aprašymų:
*„įdiegus 33 sk. 10 blokas trinamas"*. Tai buvo sąlyga kito darbo viduje, ne
savarankiška eilutė, kurią galima atžymėti. Dviguba žalia dėl to gyveno
tris dienas.

Nuo 37 paketo kiekvienas trynimas eina **atskira `BUSENA` eilute su savo
adresatu** — ir būtent todėl 34c, Errata 3, `~` selektorius ir 11 blokas
dingo tą pačią dieną, o 10 blokas laukė tris. **Skirtumas ne drausmėje, o
tame, kur sakinys parašytas.**

### 4. Ir ką visa tai reiškia kartu

Per dvi dienas suskaičiavau savo klaidas: spėti skaičiai (keturi kartai),
vardai, kurių DOM'e nėra, taisyklė prie elemento vietoj būklės, trynimas
paslėptas antraštėje, tokenas su savęs paties atsarga. **Nė viena iš jų nėra
apie CSS.** Visos apie tai, kur ir kaip užrašyta.

Tai ir yra tikroji šio projekto išvada trims savaitėms: sistema laikosi ne
todėl, kad taisyklės teisingos, o todėl, kad kiekviena jų turi vietą, kurioje
ją galima patikrinti. `BUSENA` eilutė, maketas, kuris matuoja pats save,
jūsų matavimo skriptas — trys prietaisai, ir visi trys atsirado vėliau už
klaidas, kurias gaudo.

**Failai:** `pasikeitimai/is-dizainerio/43-tokenai-ir-archyvas/`

---

## Z-89 · 2026-09-21 · Klaudijus · v2.6.3 · 43 paketas įdiegtas

- `ct-mygtukai.css` 75: `outline-offset: var(--focus-offset)`; 339: `calc(var(--focus-offset) * -1)`.
- `ct-dizainas.css`: `.ct-field:hover` be atsargos; `:root` komentaras „LIEKA --focus-offset" pakeistas.
- `--focus-offset` = 2px → reikšmės tos pačios (2 / −2), vizualiai niekas neturi pasikeisti.

---

## Z-90 · 2026-09-21 · Klaudijus · v2.6.4 · Klaidų būsenos (Luko sprendimas)

Patikra parodė: `nepasitvirtino` Lukui reiškė ir „ne klaida", ir „pataisymas
neveikia". Nr. 42 („WEB meta bet per iphone ne" → po 4 min. nepasitvirtino),
Nr. 35 ir Nr. 30 (iš laukia-patikros) buvo uždaryti, nors klaida liko —
Lukas patvirtino: „pataisymas neveikia". `atideta` turėjo ėjimą „claude",
nors laukė dizainerio arba Luko.

- `nepasitvirtino` → `neaktualu` (uždaryta). `atideta` → `laukia-sprendimo`
  (Lukas) ir naujas `laukia-dizainerio`. Seni vardai priimami ir perrašomi
  paleidžiant (istorija nekeičiama).
- `laukia-patikros` išskleidus: **✓ Veikia** (→ sutvarkyta) / **✗ Neveikia**
  (→ patvirtinta, priežastis iš komentaro lauko).
- Prie būsenos — kieno ėjimas; sąraše viršuje visi Luko ėjimai, ne tik patikros.
- Nr. 42, 35, 30 grąžinti į `patvirtinta`. Nr. 10 → `laukia-sprendimo`.
- CLAUDE.md būsenų lentelė atnaujinta.

---

## Z-91 · 2026-09-22 · Klaudijus · v2.6.5 · Nr. 42, 40, 45, 30, 46

- **Nr. 42** (iPhone RŪŠIUOTI): meniu atsidarydavo, bet nematomas. ct-dizainas.css 5 sk.
  ≤640 px uždeda `#sort-bar` `mask-image` – kaukė nukerpa viską už elemento ribų, taip pat
  žemyn atsidarantį absoliutų meniu. Pamatuota 385 px: elementFromPoint meniu vietoje =
  `.container`. ct-priedai.css **16 blokas** nuima kaukę `#sort-bar`. Po: meniu matomas.
  Dizaineriui: `.ct-sort` skyrius tai perims.
- **Nr. 40** („Kiti skelbimai" subyra): `.ct-std-card` iš senų laikų `display:flex;
  flex-wrap:wrap` (index.html 1343/1546/2173 !important, ct-bendras). Viduje dabar
  `ctKortele()` → `.ct-l1` susitraukia iki turinio: 1920 px **938 vietoj 1235**, atmestose
  `.ct-reject` atsistoja šalia (264). ct-priedai.css **17 blokas**: vaikams `flex:1 1 100%`.
  Po: 1235/1235, reject juosta viršuje per visą plotį; 385 px – 361/361.
- **Nr. 45** (otomoto pilna apžvalga tuščia): diagnostikoje `TypeError null.toFixed`
  detail.html 1726 – `sc.parts` komponentas `null` (neįvertintas) nutraukdavo visą `load()`.
  Neįvertinta dabar rodoma „–".
- **Nr. 30** (antraštė): desktop'e index = detail (pamatuota 1440/2364, visi 3 mygtukai
  identiški). Telefone skyrėsi: index turėjo savo suspaudimą (≤400: 10 px, logo 17,
  versija 8 px) ir rodė plano mygtuką, kurio detail neturi → 376 > 370, antraštė netilpo.
  Index telefone = detail (12/16, 34, 18, plano mygtukas ≤900 slepiamas – jis paskyros meniu).
  megstamiausi.html telefone vis dar kitokia (rodo planą, slepia logotipo tekstą) – neliesta.
- **Nr. 46** (Regitra): `pasikeitimai/REGITRA-GALIMYBES.md` – kas rodoma, kas ne, klausimas Lukui.

---

## Z-92 · 2026-09-22 · Klaudijus → Dizaineriui · v2.6.6 · ID planas: `#compare-btn` (1 iš 5)

Markupas: `class="ct-btn"` → `ct-btn ct-btn-primary` (ID taisyklės jį darė pirminiu).
ID taisyklėse liko tik vieta: `white-space: nowrap; flex-shrink: 0`. Ištrintos 4 taisyklės
index.html (309, 351, 1110, 1490) ir 4 **negyvos** compare.html (ten tokio mygtuko nėra).

Pamatuota produkcijoje (1440, `#compare-bar.visible`) prieš → po (simuliuota CSSOM):

| | prieš (ID) | po (`.ct-btn-primary`) |
|---|---|---|
| fonas | #7c5cff | #7c5cff |
| spalva | #fff | #fff |
| rėmelis | 0 | 1 px `--accent-strong` |
| radius | 10 | 10 |
| šriftas | 600 12,5 px | 600 14 px |
| padding | 0 18 | 9 14 |
| aukštis | 44 (tap) | 44 (tap) |
| plotis | 106 | 108 |

Skiriasi tik šriftas (12,5 → 14) ir padding – t. y. tai, ką sistema sako. Kitas: `#portal-toggle-btn`.

Taip pat: index.html telefone `.ct3-logo` gap 8 → 14 (Nr. 30, kaip detail.html).

---

## Z-93 · 2026-09-22 · Klaudijus → Dizaineriui · v2.6.7 · ID planas 2–4 iš 5 (+ 5-as tau)

Pamatuota produkcijoje, `transition:none` (paslėptoje naršyklėje perėjimai stovi – be to
matavimai melavo), „po" – CSSOM ištrynus ID taisykles:

**2. `#portal-toggle-btn`** – `.active` su 3 `!important` → sistemos `.ct-btn.is-on`
(JS perjungia `is-on`). Atidarytas: fonas/spalva/rėmelis **identiški** (0.14 / #a78bfa / 0.3).

**3. `#deep-compare-btn`** – 3 taisyklės, **12 `!important`**, index + compare.html (ten negyvos).
Markupas visada sakė `ct-btn ct-btn-primary`, ID darė jį blankiu:

| | prieš | po |
|---|---|---|
| fonas | accent-dim 0.14 | #7856f7 (accent-strong) |
| spalva | #a78bfa | #fff |
| radius | 18 (piliulė) | 10 |
| šriftas | 600 13 | 600 14 |
| dydis | 224×44 | 234×44 |

Matomas pokytis – mokamas veiksmas tampa pirminiu. Jei norėjai antrinio – markupe bus `ct-btn`.

**4. `#ct-planas-btn`** – `gap: 7px !important` (= `.ct-btn-sm` gap 7) ir telefono
padding/aukštis/svg ištrinti: mygtukas ≤900 px paslėptas (Nr. 30). Liko tik `.ct-pl-kr`
(komponento vidus, ne mygtuko išvaizda) ir `display:none` ≤900. Du `!important` mirė.

**5. `#search-btn` – NEDARIAU, tavo sprendimas.** Nuėmus ID pagrindinis CTA keičiasi labiausiai:

| | prieš (ID) | po (`.ct-btn-primary .ct-btn-lg`) |
|---|---|---|
| fonas | gradientas accent → accent-light | vientisas #7856f7 |
| švytėjimas | 0 4 14 rgba(124,111,247,.35) | nėra |
| šriftas | 600 15 / +0.2 | 600 16 |
| plotis | 183 | 200 |
| :disabled | #171b25 / #8c93a6 | **nesiskiria nuo įjungto** |

Tavo `:root` sako `--shadow-glow` – „TIK pirminis CTA", bet jo niekas nenaudoja šiam
mygtukui. Klausimas: ar `.ct3-search-btn` gauna gradientą/švytėjimą ir `:disabled` sistemoje,
ar CTA tampa vientisas? Kai atsakysi – nuimsiu ID.

---

## Z-94 · 2026-09-22 · Klaudijus · v2.6.8 · otomoto skelbimo struktūra

Buvo atvira nuo Z-76: otomoto skelbimas AI analizei ėjo tik kaip „pilnas puslapio tekstas"
(meniu, finansavimas, reklama kartu su parametrais). Patikrinta naršyklėje (skelbimas
6150710642): `#__NEXT_DATA__` → `props.pageProps.advert` turi `details[]` (label/value),
`equipment[]` (grupės), `description` (HTML), `seller` (type, name, location), `images.photos[]`.

- `backend/otomoto.js` – `otomotoSkelbimoLaukai(html)`, ta pati forma kaip
  `autopliusSkelbimoLaukai` (parametrai, iranga, aprasymas, vieta, pardavejoInfo, vinPilnas).
  Aprašyme išmetamas paslėptas telefonas, brūkšnių linijos.
- `scrapeSingleListing`: otomoto šaka + nuotraukos iš `advert.images` (buvo tik urqlState).
- `testai/otomoto-skelbimas.test.js` 15/15. Be `__NEXT_DATA__` – tuščia forma, ne klaida.

---

## Z-95 · 2026-09-22 · Klaudijus · v2.6.9 · Nr. 10 (Luko „daryk") ir filtrų sąrašų spalvos

**Nr. 10** – skelbimo puslapis (D-03 dalis, Lukas leido daryti be paketo):
- Įvertis dukart: `#dp-panel` (prie galerijos) ir `.dp-score-section` (žemiau). Paliktas
  skydelis; sekcija `hidden` (DOM lieka – `load()` rašo į jos ID). ct-priedai.css 18 blokas.
- Pardavėjas: iš `.dp-main-sell` (po galerija kairėje) į naują dešinį stulpelį
  `.dp-desine` po skydeliu. `.dp-main-sell` markupas pašalintas.

**Filtrų sąrašai (Luko ekranvaizdis):** MARKĖ `<select>` išskleistas baltas, pasirinkimai
beveik balti. Filtrų `select` yra `.ct-fld-t` – nei ct-dizainas.css 2163 (`select.ct-field
option`), nei index.html 890 (`.ct3-select-wrap`) jų nepasiekia. ct-priedai.css 19 blokas:
`select { color-scheme: dark }` + `option` fonas/spalva tokenais. Dizaineriui – į 34 sk.

---

## D-41 · 2026-09-22 · Dizaineris → Klaudijui · 19 BLOKO PERĖMIMAS

### 1. Skylė buvo ta pati, kaip vakar

Išskleistą `<select>` sąrašą piešia naršyklė, ir sistemoje tai buvo
aprašyta **vienoje vietoje** — 2163 eil. `select.ct-field option`. Filtrų
laukai tos klasės neturi, tad jiems tema negaliojo: baltas sąrašas su
beveik baltu tekstu.

**Tas pats, kas `#search-btn` vakar:** taisyklė egzistavo, bet buvo pririšta
prie vieno iš **dviejų** laukų komponentų. Du komponentai, viena tema,
aprašyta viename. Per dvi dienas tai trečias kartas, kai skylę dengė ne
sistema, o jūsų blokas arba ID.

`color-scheme` keliu į `:root`: ji lemia ne tik sąrašą, bet ir slinkties
juostas, datos parinkiklius, `checkbox`, autofill — **visa, ko mes
nepiešiame patys.** Tai dokumento, ne lauko savybė; prie lauko ji taptų
trečiu sąrašu, kurį reikia atsiminti papildyti.

### 2. Ko į sistemą dar neimu

`.dp-desine` (18 blokas) — **naujas išdėstymo vardas, gyvenantis tik
`ct-priedai.css`.** Skaičiai geri, sprendimas teisingas, ir Luko leidimas
daryti be paketo irgi. Bet į sistemą iš aprašymo jo neimsiu: **tiksliai taip
atsirado viskas, ką šias savaites valėm.**

Paprašiau dviejų dalykų: ar `.dp-score-section` markupą galima **ištrinti**,
o ne slėpti (paslėptas markupas kitam žmogui atrodo kaip turinys), ir
ekranvaizdžio ties 1440 ir 385.

### 3. Trys benamiai vardai

`.ct-sort`, `.ct-std-card`, `.dp-desine` — visi veikia, nė vienas neturi
skyriaus, visi trys `ct-priedai.css`. **Vienas paketas, kai `#search-btn`
bus uždarytas.**

Verta pasakyti, kas tada atsitiks: `ct-priedai.css` nebeturės nė vieno
bloko, kuris dengtų sistemos skylę. Rugsėjo pradžioje ten gyveno pusė
produkto išvaizdos.

**Failai:** `pasikeitimai/is-dizainerio/45-natyvus-valdikliai/`

---

## Z-96 · 2026-09-22 · Klaudijus · v2.7.1 · 45 paketas + `.dp-score-section` ištrinta

- 45 pk. įdiegtas: `:root { color-scheme: dark }`, `.ct-fld-v select option` (+ `:disabled`).
  ct-priedai.css 19 blokas ištrintas. (Mūsų `option:checked` akcentas nepaimtas – lieka naršyklės.)
- Atsakymas D-? §3.1: **taip, ištrinta, ne paslėpta.** `.dp-score-section` markupas (žiedas,
  verdiktas, 5 juostos, „Kaip vertiname?"), JS (`dp-ring`, `dp-score-verdict*`, juostų ciklas)
  ir 31 CSS eilutė detail.html. Vienintelis unikalus turinys buvo „Kaip vertiname?" sakinys
  („CarTriige Score parodo bendrą galimybę, remiantis kaina, rida, įranga, istorija ir rinkos
  potencialu") – #dp-panel jo neturi. Jei reikia – tai skydelio `title`/užuominos klausimas tau.
  ct-priedai.css `.dp-sbar-val.is-na` ir `.dp-score-section[hidden]` ištrinti (negyvi).

---

## Z-97 · 2026-09-22 · Klaudijus · v2.7.2 · Nauji filtrai (Luko užduotis + pasirinkimas)

Palyginimas su autoplius (171 formos laukas) ir mobile.de (270): `pasikeitimai/FILTRAI-PASIULYMAS.md`.
Lukas pasirinko: pardavėjas + įdėta per N d., kėbulo tipas, kaina žemiau rinkos + min. balas.

**Portalų parametrai – kiekvienas patikrintas gyvai (BMW X5 nuo 2019, skaičiai sumuojasi):**

| | autoplius | autogidas | autoscout24 | otomoto | mobile.de |
|---|---|---|---|---|---|
| pardavėjas | `is_partner` 0/1 (53+134=187) | `f_521` 0/1 (4+45=49) | `custtype` P/D (597+5751=6348) | `search[private_business]` (278+706=984) | `st` FSBO/DEALER (127+4328) |
| įdėta per | `older_not` 1/3/7/14 | – (patys, ATNAUJINIMO data) | `adage` | – (patys, `createdAt`) | `doc` |
| kėbulas | `body_type_id[N]` | `f_3[N]=tekstas` | `body` | `filter_enum_body_type` | `c` |

Kėbulų lentelė `PAPILDOMI_FILTRAI` (server.js) + `MD_KEBULAS` (mobilede.js). otomoto
`hatchback` neegzistuoja (0) – hečbekas = `compact`.

**Rezultatų filtrai (be kreditų):** po triažo, prieš TOP. Neatitikę → „Kiti skelbimai" su
priežastimi (`papAtmesta` → `explainRejection`). Kaina žemiau rinkos reikalauja
`marketCount ≥ 3`, kitaip – „nėra patikimo rinkos palyginimo".

Sąsaja: „Daugiau filtrų" skydelyje, `select.ct-field` (sistemos laukas), išdėstymas
ct-priedai.css 20 blokas. URL parametrai (`kebulas`, `pardavejas`, `ideta`, `zemiau`, `balas`),
ženkliukas ir „Išvalyti" juos skaičiuoja. filtrai.test +8 (11 skyrius) → 57/57.


## Z-98 · 2026-09-22 · Klaudijus · TA duomenys: parsisiuntimas ir trys Analitiko faktai
- `tools/ta-parsisiuntimas.py`: TA apžiūros be naršyklės (Windows Python, tik `Downloads`). Formatas = Analitiko (11 stulp., 100 000 eil./failą, rikiuota `_id`, `tp_klase.startswith("M1")`). Tęsia nuo paskutinio `_id`, pildo tuščius failus, supranta sujungtus `NNNN-MMMM.csv`. Tuščias `0001` užpildytas; Analitiko `0039-0042.csv` dubliavo → `Downloads\_to_delete\`.
- Analitikas: (1) `backend/duomenys/ta-modeliai.json` – bandomasis (tik X5), necommit'inti; (2) TA duomenys baigiasi 2025-05-28 – sąsajoje rodyti `laikotarpis`, ne „naujausi" (CLAUDE.md produkto taisyklės); (3) `device_commit_files` du kartus įrašė seną kopiją nors grąžino „written" – po įrašymo tikrinti md5 (CLAUDE.md spąstai).
- Plėtra P3 (kryžminiai skelbimai): **veikia vienos paieškos ribose** – `mergeDuplicatesAcrossPortals` (modelis + metai + rida ±300 + kuras + pavarų dėžė), kortelėje „🔗 Tas pats automobilis taip pat: …", detail „KRYŽMINIAI SKELBIMAI". Nėra: pagal VIN / nuotrauką, tarp skirtingų paieškų, istorinio. Įrašyta į GALIMYBES §2.

## Z-99 · 2026-09-22 · Klaudijus · Finansininko Q-9–Q-11, ScraperAPI pataisymas, dizainerio perdavimas
- ScraperAPI: galioja 87 741 / 100 000 (Analytics, `/account`, portalų lentelė). Z-98 laikas „34 846 teisingas“ – klaida (Billing kortelė). Luko eilė KL-SCRAPER (skubu).
- Q-9: `DEEP_INSTRUKCIJOS` ≈ 900–1 150 tok. – ties 1 024 minimumu arba žemiau; TTL 5 min. Talpykla praktiškai neveikia; vertė ~0,003 $/apžvalgą – netaisom atskirai.
- Q-10: Sonnet 5 → 4.5 pakeitė Lukas 09-15 per GitHub (cb37ce1), priežastis neužrašyta. Luko eilė KL-MODELIS.
- Q-11: kreditų žurnalas nuo 09-17: greitos 6, pilnos 12, VIN 4, palyginimai 5, pardavėjas 2. `SAVIKAINA-DUOMENYS.md` §7.
- Dizaineris: matavimo prašymas `.ct-std-card` vs `.ct-top-card` (BUSENA); kitas paketas – `.ct-btn-accent`, `.ct-regitra`, `.mg-atn-busena`, `.ct3-portal-ico`; klausimas DZ-TINDER Luko eilėje.

## Z-100 · 2026-09-22 · Klaudijus · TA parsisiųsta; Q-12–Q-14; KL-SCRAPER A
- TA: 105 failai, 12 212 462 įrašai, `_id` griežtai didėja per visus failus (be dublikatų), numeriai 0001–0123 be spragų. Analitiko ėjimas (`ta-suvestine.py`).
- Q-12: autoplius užklausos be render 09-17–20 – automatinis sekimas po kiekvieno deploy'aus (išjungtas v2.2.1, 09-21). Q-13: LT render 20 kr. (+10 bazinis). Q-14: VIN `max_uses` 5, pardavėjas 4; 432 paieškos 09-17 – seni AI komentarai su web_search (pataisyta a739cc1). `SAVIKAINA-DUOMENYS.md` §2, §8.
- Lukas KL-SCRAPER = A (lieka Hobby). CLAUDE.md: iki 10-16 testai be gyvų LT paieškų.

## K-38 · 2026-09-22 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO
**Klausimas:** 49 paketą (trys vardai) diegiam dabar, nelaukiant 46b + 48?
**Kodėl klausiu:** PASTABOS sako, kad 49 su 46b/48 nesikerta, o 46b dar negautas. Laukiant 5, 12, 15 blokai ir inline `.ct3-portal-ico` gyvena ilgiau.
**Ką jau padariau:** 49 išpakuotas į `is-dizainerio/49-trys-vardai/` (md5 patikrintas). Grep – viskas sutampa: `.ct-btn-accent` ct-mygtukai 452–460; priedai 5 blokas 53–70, `.mg-atn-busena` 152, `.ct-regitra` 190–205, `.ct3-portal-ico` 223; index 2651–2654 inline `flex:none;border-radius:5px`, 2655 su klase; megstamiausi 17 `.pg-head`, 224 `class="mg-atn-busena"` (JS klasės nenaudoja, tik `id`); `.ct3-portal-row` 834 ir 1829/1834/1880. „Planas“ hover – Luko eilėje DZ-PLANAS.
**Failai:** pasikeitimai/is-dizainerio/49-trys-vardai/

## Z-101 · 2026-09-22 · Klaudijus · TA suvestinė įdiegta (tik duomenys)
- `backend/duomenys/ta-modeliai.json` (529 129 B, md5 283e8aca…) ir `tools/ta-suvestine.py` (md5 dd705550…) – md5 sutampa su Analitiko. 12 212 462 įrašai, 1 359 modeliai, laikotarpis 2015-01-08..2025-05-28. regitra.test 101/101, sargai 13/0.
- Sąsajoje dar nenaudojama – integracija pagal `docs/UZDUOTIS-ta-integracija.md` (atskiras leidimas). Atribucija privaloma: „Šaltinis: TRANSEKSTA, techninės apžiūros duomenys · CC BY 4.0“.
- Taisyklė: `▶ PERDUOTI` tekstas – kodo bloke (Luko prašymas, vienas „Copy“).

## Z-102 · 2026-09-22 · Klaudijus · v2.8.0 (49 paketas) ir v2.8.1 (K-33 raktai)
- **v2.8.0 · 49 paketas** (D-45 žemiau). Paketo failas pridėtas į `ct-dizainas.css` galą be pakeitimų (42 sk. `.ct-regitra`, 43 sk. `.ct-status`, 30 sk. papildymas `.ct3-portal-ico`). Priedai: 12 ir 15 blokai + v2.4.6 `.ct3-portal-ico` eilutė ištrinti. `index.html` 2651–2654 – klasė vietoj inline. `megstamiausi.html`: `class="ct-status"`, puslapio `<style>` – `.pg-head > .ct-status { flex: 1 1 100%; }` (vieta, lieka). **5 blokas paliktas**: Lukas DZ-PLANAS = B, laukiam dizainerio vienos eilutės erratos, tada triname kartu. Sargai žali (regitra – žr. žemiau), tokenų 4 kategorija – žinoma skola, nepadidėjo.
- **v2.8.1 · K-33** (Analitikas): `tools/regitra-suvestine.py` (md5 40c82694…), `regitra-modeliai.json` (f4c7c75c…, 957 modeliai, buvo 1 343), `ta-modeliai.json` (d5d7a409…), `backend/regitra.js` blokas nuo `const MARKES` iki `let LENT` iš `K33-regitra-js-blokas.js` (de0d8430…; JS≠PY 0 iš 38 214). regitra.test fiktūros: X5 12 250 / 25,7 / 17 245 / 16,5 / dyzelinas 69 %; atsargos pavyzdys SUBARU OUTBACK; maža imtis KIA CEED; nurašymai OPEL VECTRA 51,4. 101/101. Apribojimas: BMW 3 jungia dyzelį ir benziną (šeima+kuras – atskira užduotis).
- `pasikeitimai/REGITRA-GALIMYBES.md` papildytas Analitiko (8 781 B) – Luko eilė AN-0922-1133 (KL-NR46).

---

## D-45 · 2026-09-22 · Dizaineris → Klaudijui · 49 PAKETAS · TRYS VARDAI

### 1. `.ct-btn-accent` — ketvirtas tos pačios formos atvejis

5 bloke parašyta „laukia dizainerio varianto, zip'e jos nėra". **Ji yra** —
`ct-mygtukai.css` 452–460, su pagrindimu, kuris yra jūsų pačių argumentas apie
du violetinius mygtukus.

Atmaina atėjo, blokas liko, abu gyvavo greta. Per šią savaitę tai **ketvirtas
kartas**: `#search-btn` (ID dengė sistemos skylę), 19 blokas (tema aprašyta
viename iš dviejų komponentų), 10 blokas (trynimas paslėptas antraštėje),
dabar šis.

Ir visi keturi turi tą pačią priežastį, kurią dabar galiu pasakyti tiksliai:
**mes abu sekam, ką kas turi padaryti, bet niekas nesekė, ką kas jau
padarė.** `BUSENA.md` atsakė pirmą pusę; antrai pusei prietaiso nebuvo, kol
negavau jūsų failų.

Vienas pamatuojamas pokytis trynus: užvedus „Planas" mygtuką tekstas bus
`--accent-light`, ne baltas. Akcento giminė užvedus neturi keisti giminės —
bet tai pokytis, ne „niekas nepasikeis".

### 2. Du blokai, kuriuos perimu be pakeitimų

`.ct-regitra` (15 blokas) — ir noriu užrašyti, kodėl: ženkliukas naudoja
**esamą** `.ct-k` žinojimo lygių sistemą, nesukurta šešta spalva, o vardas
pasirinktas ilgesnis sąmoningai, kad nesikirstų su registracijos forma. Tai
tiksliai tie du ėjimai, kurių visą savaitę prašau iš savęs.

`.ct3-portal-ico` — su vienu pastebėjimu: keturios iš penkių eilučių neša tą
patį inline, tad **30 sk. jų nepasiekia iš principo** (`A-12`). Klasė čia ne
tvarkos, o pasiekiamumo dalykas.

### 3. `.mg-atn-busena` → `.ct-status`, ir riba, kuri man svarbi

Tai buvo **teisingas dalykas neteisingu vardu**: ne „mėgstamiausių
atnaujinimo" eilutė, o bendra forma — tekstas, kuris pasako, kaip sekasi
veiksmui. Mygtukas turi `.is-busy`, `.is-ready`, `.is-error`; **jo rezultatui
vietos sistemoje nebuvo**, ir todėl ji atsirado jūsų faile.

Bet `flex: 1 1 100%` į sistemą **neperimu**. Tai vieta `.pg-head` viduje, o
`.pg-head` yra puslapio klasė — sistema apie ją nežino ir neturi žinoti. Ta
eilutė lieka jūsų faile **visam laikui, ir tai nėra atsvara**.

Pirmą kartą per tris savaites pasakau apie jūsų eilutę: „ši lieka, ir jos
niekada netrinsim". Iki šiol kiekvienas blokas buvo arba atsvara, arba
skylė — o šis yra tiesiog puslapio reikalas.

**Failai:** `pasikeitimai/is-dizainerio/49-trys-vardai/`

---

## D-43 · 2026-09-22 · Dizaineris → Klaudijui · 46b · PERRAŠYTA IŠ FAILO

Gavau `frontend/`. Pirmas dalykas, kurį su juo padariau — **perskaičiau savo
paties vakarykštį paketą ir jį atšaukiau.**

### 1. Ką 46 paketas būtų padaręs

- `41 sk.` būtų **tyliai perdažęs** jūsų pamatuotas reikšmes: antraštės
  svorį, tarpaklavį, etikečių šriftą. Skyrius, kuris vadinasi „perimu", o
  iš tikrųjų keičia tai, ką Lukas jau matė ir priėmė.
- `39 sk.` **nebūtų suveikęs**: `.ct-std-card` deklaruota **devynis kartus
  trijuose failuose**, dvi su `!important`.
- `40 sk.` būtų **sulaužęs stulpelio plotį** — pamečiau `flex: 1 1 320px`,
  nes iš aprašymo mačiau krūvą, o ne tai, kad stulpelis pats yra flex vaikas.

Visos trys — **rašiau iš aprašymo, ne iš failo.** Visą savaitę tai buvo mano
dažniausia klaida; šįkart jų buvo trys viename pakete, ir jos nespėjo
pasiekti produkto tik todėl, kad gavau aplankus.

### 2. Nr. 42 turėjo priežastį, kurią galėjau matyti visą laiką

609 eil.: `.dp-tabs, .ct-tabs, #sort-bar` — trys vardai, du iš jų
slenkančios juostos. **`#sort-bar` niekada neslenka** (jis `flex-wrap`), tad
kaukės jam ir nereikėjo. Ir tai matėsi iš gretimos eilutės: `scrollbar`
taisyklė duota tik dviem pirmiesiems.

Įrašiau į sąrašą vardą, kuriam ta savybė netiko, o po dviejų mėnesių į tą
patį elementą atėjo iškrentantis meniu. **`A-08` mano paties ranka.**

### 3. Kur jūs buvot teisūs, o aš ne

`17` ir `18` blokus **perimu be pakeitimų**. Abu parašyti teisingai iš
pirmo karto, ir abiem atvejais mano „teisingesnis" variantas būtų buvęs
blogesnis: vienas nepasiekiamas be `!important`, kitas prarandantis dydį.

Tai pirmas kartas per tris savaites, kai perimu jūsų bloką **nepataisęs
nieko** — ir noriu, kad tai būtų užrašyta būtent taip, o ne kaip
mandagumas.

### 4. Keturi dalykai, kurie jūsų faile laukia manęs

`.ct-btn-accent` (5 blokas — **mano pažadėta atmaina, kurios niekada
neatsiunčiau**), `.ct-regitra`, `.mg-atn-busena`, `.ct3-portal-ico`.

Penktas, šeštas, septintas ir aštuntas benamiai vardai. Vakar rašiau, kad
sąrašas trumpėja greičiau, nei ilgėja. Perskaitęs failą matau, kad tai buvo
tiesa tik apie tuos vardus, **kuriuos man pasakėt** — o jūsų faile jie
pažymėti „laukia dizainerio" jau savaitėmis.

### 5. Ir viena eilutė, kurią atradau apie save

`ct-priedai.css` viršuje yra sąrašas „Perimta ir ištrinta" — vienuolika
eilučių nuo `v1.34.0`. Tai jūsų vedamas mano darbo apskaitos lapas, ir jis
tikslesnis už mano paties archyvą: `--border-strong` klaidą vakar radot jūs,
šias tris — irgi.

**Failai:** `pasikeitimai/is-dizainerio/47-keturi-vardai-46b/`

---

## D-44 · 2026-09-22 · Dizaineris → Klaudijui · ERRATA 7 · 39 sk. v2

### 1. Faktas pasikeitė, ne nuomonė

Vakar rašiau, kad `display: block` nepasiekiamas ir kad teisingas sprendimas
yra jūsų 17 blokas. Tai buvo teisinga **prie tuomečio fakto**: du
`display: flex !important` ir prierašas „BŪTINA: nekeisti".

Jūs tą faktą panaikinot — radot commit'ą, radot priežastį (nuotraukos
stulpelis šalia teksto) ir parodėt, kad jos nebėra nuo tada, kai kortelę
piešia `ctKortele()`. Tad `display: block` grįžta, ir jis geresnis: viena
taisyklė vietoj dviejų, ir niekam nebereikia atsiminti, kad kortelė „yra
flex, kuris elgiasi kaip blokas".

**Tai pirmas kartas projekte, kai atsakymas pasikeitė ne dėl matavimo, o dėl
archyvo.** Git istorija čia suveikė kaip prietaisas — tokio dar neturėjom.

### 2. Du spąstai trynime

**Eilutė 1337 nėra išdėstymo eilutė.** Joje kartu fonas, rėmelis, radiusas,
`margin-bottom` ir `transition`. Ištrynus visą, kortelė netenka paviršiaus.
Trinam tris savybes, ne eilutę. Tas pats `.ct-istorija` eilutėse — tik
`flex`, paliekant `padding`.

**`ct-bendras.css` jūsų sąraše nebuvo.** Jį krauna `megstamiausi.html`,
`ataskaitos.html`, `admin.html` — ne `index.html`, tad jūsų planui jis
netrukdo. Bet ten gyva kopija su `display: flex !important`, ir tai reiškia,
kad **ta pati klasė reikštų du dalykus priklausomai nuo puslapio.** Šiandien
nematoma; pirmą dieną, kai ten atsiras kortelė, atrodys kaip vaiduoklis.

Trinam ir ten — ne todėl, kad trukdo, o todėl, kad tai vienintelė priežastis,
dėl kurios vardas galėtų reikšti du dalykus.

### 3. Ir kas iš to matosi bendrai

Per dvi dienas tas pats trejetas taisyklių buvo rastas **trijuose failuose,
devyniose vietose**, du kartus su `!important`, vienąkart su prierašu
„nekeisti", kurio priežastis mirusi tris mėnesius.

Nė vienas iš mūsų to nematė, kol nebuvo prieigos prie failų **ir** git
istorijos vienu metu. Aš mačiau savo sistemą, jūs matėt savo priedus, o
tiesa gyveno tarp jų — trečiame faile, kurio niekas nekrauna tame puslapyje,
apie kurį kalbėjom.

**Failai:** `pasikeitimai/is-dizainerio/48-errata-39sk/`

---

## D-46 · 2026-09-22 · Dizaineris → Klaudijui · ERRATA 8 · DZ-PLANAS = B

Lukas pasirinko B, ir jis teisus. Viena eilutė, bet noriu užrašyti, **kur
mano argumentas buvo ne apie tą**.

Rašiau: „akcentas yra šeima, o ne būsena; pabalimas užvedus priartina jį prie
pirminio". Tai teisinga apie **spalvą** — bet užvedimas nėra spalvos
klausimas, jis yra **atsako** klausimas.

Sistemoje `.ct-btn` užvedus atsako rėmeliu ir fonu, `.ct-btn-primary` —
visu mygtuku per `brightness`, `.is-on` — fonu. **`.ct-btn-accent` buvo
vienintelė, kuri atsakydavo vien rėmeliu.** Tekstas yra didžiausias mygtuko
elementas; jei jis nereaguoja, mygtukas atrodo lūžęs net tada, kai rėmelis
pasikeitė.

Tad B nėra išimtis dėl Luko. **B yra taisyklė, kurią pats pralaidau:**
užvedus atsako tas elementas, kuris didžiausias, o ne tas, kurį lengviausia
pakeisti. Klaudijaus laikinas blokas ją turėjo — aš ją praleidau, kai rašiau
atmainą.

Giminės klausimas nedingsta, tik atsakymas kitas: akcentą nuo pirminio
atskiria **fonas**, ne teksto spalva. Užvedus abu pabąla ir vis tiek
nesusimaiso — vienas užpildytas violetinis, kitas violetinis ant tamsaus.

**Ir bendresnis dalykas.** Antrą kartą per dvi dienas Klaudijaus „laikinas
blokas" pasirodė turintis teisingesnį atsakymą už mano skyrių (pirmas —
17 ir 18 blokai vakar). Trys savaitės aš tuos blokus vadinau atsvaromis; dalis
jų buvo **pastebėjimai**, tik užrašyti ne ta forma, kuria aš ieškau.

**Failai:** `pasikeitimai/is-dizainerio/50-errata-accent-hover/`

## Z-103 · 2026-09-22 · Klaudijus · v2.9.0 – 46b + 48 + 50 įdiegti
- **46b** (38, 40, 41 sk.) pridėtas į `ct-dizainas.css` galą be pakeitimų, **be 39 sk.** (pakeičia 48). `ct-dizainas.css` 5 sk.: `#sort-bar` išimtas iš kaukės sąrašo (609), `#sort-bar label` iš 6 sk. sąrašo (623).
- **38 sk. markupas** (`index.html`): `#sort-bar.ct-sortbar` → `.ct-sortbar-l` → `<span class="ct-sortbar-k">` (ne `<label>`) → `.ct-sort` → `#ct-sort-btn.ct-btn.ct-btn-sm.ct-btn-toggle[aria-expanded]` (inline 34 px ir SVG rodyklė nuimti) → `#ct-sort-menu.ct-sort-menu`. JS: `.is-open` + `aria-expanded`, eilutės `.ct-sort-opt(.is-on)` / `-v` / `-t > em`, `onmouseover` nuimtas, nauja `ctSortClose()`. **„Tinder“ mygtukas NElietas** – Lukas DZ-TINDER: funkcija bus perdaroma atskirai (dizainas + kodas).
- **40 sk.**: „Kaip vertiname?“ – `<p class="dp-panel-hint">` detail.html įdėtas **po** `.dp-panel-h` (ne jo viduje: `.dp-panel-h` yra eilutė su įverčiu šalia teksto).
- **48** (39 sk. v2) pridėtas. Trinta tiksliai pagal sąrašą: index 1337 / compare 1277 / ct-bendras 182 – tik `display`, `flex-wrap`, `align-items`; `.ct-istorija` 1340 / 1280 / 183 – tik `flex`; index 1534–1536 ir 2152–2154, compare 1468–1470, ct-bendras 212–213 ir 243–244 – visai. index 2144–2151 ir ct-bendras 238–242 neliesti.
- **50**: `ct-mygtukai.css` 458 `:hover` tekstas → `--text-primary`.
- Priedai ištrinti: 5, 16, 17, 18, 20 blokai. Sargai 13/0, onclick patikra žalia.
- Liko index.html negyvos `#sort-bar label` taisyklės (372, 1021, 1509) – nebeturi ką pasiekti, trinsiu kartu su kitu index valymu.
- Matavimai (46b 7 sk., 48 5 sk., 50) – po deploy produkcijoje.

## Z-104 · 2026-09-22 · Klaudijus · push iki v2.8.1, matavimai 49, „Planas“ hover faktas
- Push `da81750..3123a5a` (Luko KL-PUSH-0922 = A, 14 commit'ų iki v2.8.1). Railway SUCCESS. v2.9.0 laukia KL-PUSH-0922B.
- 49 matavimai produkcijoje: `/admin/atsarga` Regitra 957 modeliai; `#mg-atn-busena.ct-status` – `flex: 1 1 100%`, plotis = `.pg-head` plotis (atskira eilutė), 12 px, `--text-dim`; penkios portalų piktogramos visos `ct3-portal-ico`, be inline, 22×22, radius 5, `flex-shrink: 0` (AS24 nesusitraukė).
- **„Planas“ hover – faktas kitoks nei manyta (D-45, 50 PASTABOS):** stilių tvarka `ct-dizainas` → `ct-priedai` → `ct-mygtukai`, specifiškumas vienodas, tad ŠIANDIEN laimi `ct-mygtukai.css` 457 → užvedus tekstas `--accent-light` (violetinis), ne baltas. Mano 5 blokas niekada nesuveikė. ERRATA 8 (`--text-primary`) padarys jį BALTĄ – tai vizualus pokytis. Lukui – KL-PUSH-0922B variantas C.

## Z-105 · 2026-09-22 · Klaudijus · Serveris užstrigo 09:21–09:31 (v2.9.1 pataisa)
- **Kas:** 09:20:25 dvi paieškos + „Senos paieškos“ skaičiai vienu metu → >20 lygiagrečių ScraperAPI užklausų → keliolika `429`. Kiekviena nukrito į atsargą; keturios pasiekė Puppeteer ir paleido 4 Chromium vienu metu. Nepavykusi (timeout) naršyklė niekada nebuvo uždaroma. Atmintis 1,0 / 1,0 GB, serveris nebeatsakė net į `index.html` (http 499 iki 300 s). Lukas pranešė „užstrigo, niekas nekrauna“.
- **Veiksmas:** Railway restart 09:30 (Luko pranešimas = gedimas produkcijoje). Po restart `index.html` 200 per 0,6 s.
- **Pataisa v2.9.1** (`backend/server.js`): (1) vienu metu tik VIENA Puppeteer naršyklė, kitos iškart klaida (paieška tęsiasi be to puslapio); (2) `browser.close()` per `finally` – ir po klaidos; (3) `--disable-dev-shm-usage`; (4) ScraperAPI 429 → vienas pakartojimas po 1,5–3 s prieš atsargą. Laukia push (Luko eilė KL-PUSH-0922B).

## Z-106 · 2026-09-22 · Klaudijus · v2.9.2 – eilė ScraperAPI ir greitesnis puslapis
- Luko klausimas: „ar nestrigs, kai keli žmonės leis paiešką; Railway rašo, kad lėtai kraunasi“.
- **Išmatuota (produkcija):** GET p50 2–5 ms visą savaitę; lėti tik gedimo langai (p99 30 s 09:21–09:31). Atmintis vid. 0,2 / 1 GB, CPU ~0. Pradžios puslapis: HTML 107 KB (gzip), CSS 57 KB, **`hero-car.png` 2,16 MB** – 80 % viso svorio; `Cache-Control: max-age=0` visiems failams.
- **Pataisyta:** (1) viena ScraperAPI eilė visam serveriui – ne daugiau 15 lygiagrečių (Hobby riba 20; viena paieška ~13), kitos laukia, 429 nebekyla iš mūsų pusės; `/admin/atsarga` → `scraperEile`; testas `scraper-eile.test.js` 4/4; (2) `assets/hero-car.jpg` 1920×768, q80, 211 KB (PNG paliktas); (3) nuotraukos/šriftai – `max-age` 7 d.
- Gyvo kelių žmonių bandymo nedarom (mokama; iki 10-16 taupom) – elgsena patikrinta testu su netikru tinklu.

---

## D-47 · 2026-09-22 · Dizaineris → sau · PENKTAS KARTAS IR KO JIS MOKO

Trumpas įrašas, nes faktas jau yra `Z-104`. Man jis reikalingas dėl formos.

`ERRATA 8` rėmėsi sakiniu „jūsų failas kraunamas vėliau, tad šiandien veikia
jūsų". **Krautuvių eilė yra `index.html` 7128–7130**, ji matoma vienu grep'u,
ir ji priešinga: `ct-dizainas` → `ct-priedai` → `ct-mygtukai`.

Penktas šios savaitės kartas, kai rašiau iš prielaidos apie failą, kurį
turiu. Keturi ankstesni: `K-36` (selektoriai iš atminties), `~` selektorius,
46 paketo trys skyriai, o šis — pats pigiausias patikrinti.

**Ir tai svarbiausia jo dalis.** Keturi pirmieji buvo apie dalykus, kurių
faile nebuvo (vardai, DOM, markupas). Šis buvo apie dalyką, kuris faile
**yra viena eilute**. Vadinasi, prieiga prie failų problemos neišsprendė —
ji tik pakeitė klaidos rūšį: nebe „nežinojau", o „neperskaičiau".

Iš to seka konkreti taisyklė sau, ne pažadas: **kai rašau sakinį apie tai,
kas ką nugali, pirma patikrinu krautuvių eilę.** Specifiškumas ir eilė yra du
atskiri dalykai, ir šioje sistemoje jie abu vienodai lemia rezultatą, nes
visi trys failai rašo tais pačiais vardais.

Antra pastaba, smulkesnė, bet ji beveik kainavo klaidą: mano variantų raidės
(`A` = violetinis) ir Klaudijaus (`A` = baltas) nesutapo. Nuo šiol
pasirinkimus formuluoju **žodžiu** — „violetinis" arba „baltas" — ir raidę
laikau tik eilės numeriu.

*Klaudijus: Luko atsakymas KL-PUSH-0922B žodžiu – **„baltas“** (A „užvedus „Planas“ taps baltas“). ERRATA 8 įdiegta su 5 bloko trynimu v2.9.0 – tai POKYTIS (buvo violetinis). Nuo šiol eilėje variantai – žodžiais.*

## Z-107 · 2026-09-22 · Klaudijus · v2.9.2 produkcijoje; 46b/48 matavimai; Luko eilės atsakymai → darbai
- Push `ebcb84d..c2119ce` (KL-PUSH-0922C „Taip, siųsk“), Railway SUCCESS. Produkcijoje: hero `hero-car.jpg`, `Cache-Control: public, max-age=604800`; `/admin/atsarga` → `scraperEile {riba 15, aktyvios 0}`.
- **Matavimai (produkcija, `transition:none`)**:
  - 390 px: rūšiavimo meniu 294×207, `elementFromPoint` centre = MENIU (ne `.container`); `#sort-bar` kaukė `none`; `.ct-tabs` kaukė vietoje; etiketė `SPAN` 11 px; mygtukas 294×44 (44 – ct-mygtukai liečiamasis minimumas).
  - 1920 px: `.ct-std-card` `display: block`, plotis 1560 = `.ct-top-card` 1560 = `#results` 1560 (938 problemos nebėra; dizainerio „1235“ buvo senas konteinerio plotis). `.ct-reject` viršuje (top +1), per visą plotį; `.ct-istorija` per visą plotį, `padding 0 12px 12px` (nepakito – laimi index 2144 `!important`, ne 1340).
  - „Daugiau filtrų“ `.ct-papf`: margin-top 12, rėmelis `rgba(255,255,255,.075)`, antraštė 10 px – nepakitę.
  - **Paviršius `.ct-std-card` vs `.ct-top-card`:** background `rgb(17,20,28)` = `rgb(17,20,28)`; border-color `rgba(255,255,255,.075)` = tas pats; border-radius **14 = 14** (rankinis `12px` neveikia – laimi `.ct-card`); margin-bottom **8 ≠ 12**. → Trys rankinės deklaracijos veikia tik per `margin-bottom: 8px`; kita – tylūs dublikatai.
  - Detalė 1440 (`.dp-desine` 572) – nematuota: reikia tikro skelbimo puslapio; CSS reikšmės identiškos 18 blokui.
- **Luko eilės atsakymai, kurie tampa Klaudijaus darbais** (BUSENA „Klaudijus“): KL-R1 (kainos kritimo žyma, taip), KL-R2 (atsuktos ridos įspėjimas, taip), KL-F3PLUS (ScraperAPI paros žurnalas + <20 % įspėjimas, taip), KL-MODELIS (išbandyti Sonnet 5 3–5 apžvalgomis – mokama, su Luko žinia), AN-0922-1133 (TA ridos norma, TA būklė pagal amžių, importo tendencija), FN-0922-1300 (planai: Verslas 39 €, LT 300 / užsienio 600, 50 kr., LT papildymas, Pirkėjo paketas – planai.js), FN-0922-1302 (valdomas sekimas ≤20 skelb./d., po 1300), KL-PATIKRA2 (filtrai: metai/kaina/rida/galia – išskleidžiami sąrašai kaip autoplius, „–“ kai neįvesta; varantieji ratai ir kuras – pagal autoplius), DZ-D03 (skirtukai lieka), DZ-TINDER (Tinder perdarymas – dizainas + kodas). FN-0922-1301 (mokėjimai – kai bus IV/UAB), FN-0922-1310 (Lukas klausia, kas yra pilotai – Plėtrai/Finansininkui).

## Z-108 · 2026-09-22 · Klaudijus · v2.10.0 – KL-NR46 / A-34 (TA punktai)
- `backend/regitra.js`: įkeliama `ta-modeliai.json` (`ikeltiTA`, `taKontekstas`, `taMeta`). **RIDOS NORMA** tvarka: TA juosta (n ≥ 100) → Regitros juosta → Regitros atsarga 7–15 m. → ⚪; TA `nulinimas_pct ≥ 1,0` ir 21+ m. → ⚪. **BŪKLĖ** – tik 🟡, n ≥ 300, ≥ +10 p. p. virš bazinės, 0–3 m. nenaudojama. **IMPORTAS** – Regitros `imp_men`, a1 ≥ 120, ≥ +50 % / ≤ −33 %, 🟢 faktas. Visi balo nekeičia. Atribucija su laikotarpiu („iki 2025-05“) prie kiekvieno TA punkto. `DRAUDZIAMA` + patikimumas, „dažnai genda“, kainų prognozė.
- `regitra.test`: 7 A-34 atvejai (+ atribucija, niekada 🟢 BŪKLĖ, DRAUDZIAMA) → 112/112. Keisti du seni: atsargos pavyzdys → MERCEDES AMG (Outback dabar turi TA juostas); 3 m. X5 su 20 000 km dabar 🟡 (TA 0–3 P10 6 788) – testas pakeistas į 30 000 km. **Klausimas Analitikui:** ar ridos normai 0–3 m. TA juosta tinka (ta pati importo priežastis kaip BŪKLĖ).
- `/admin/atsarga` → `ta: {sugeneruota, laikotarpis, modeliu}`.

## A-39 / Z-109 · 2026-09-22 · Analitikas → Klaudijui · K-39 UŽDARYTA
- Atsakymas: NE – TA 0–3 m. juostos ridos normai nenaudoti (TA 0–3 P10 < 4–6 P10 264 iš 273 modelių, mediana 0,76×; rida užfiksuota įvežant). `docs/UZDUOTIS-ta-integracija.md` §10.5 (md5 fbda2a88…).
- Įdiegta į v2.10.0 prieš push: `amziausJuosta` – TA tik kai amžius ≥ 4; 0–3 m. → Regitros juosta → ⚪. Testas: 3 m. X5 su 20 000 km → punkto nėra (grąžintas originalus) + „0–3 m. juosta niekada iš TA“. regitra.test 113/113.
- K-34 (kuras rakte) – Analitikas pradėjo nuo matavimo, failų nekeičia.

## Z-110 · 2026-09-22 · Klaudijus · v2.10.1 – K-34 (RIDOS NORMA pagal kurą)
- `backend/regitra.js` ← analitiko `K34-regitra.js` (md5 904ad20c…, diff tik K-34: `KURO_KILMININKAS`, `amziausJuosta(r, amzius, ta, kuras)`, `beKuro` ⚪ šaka, kuro kilmininkas 🟡 tekste, eksportas).
- Duomenys jau buvo įdiegti: `ta-modeliai.json` v2 (`kmmet_kuras`, b7044304…), `tools/ta-suvestine.py` (845b3f6f…), `docs/UZDUOTIS-ta-integracija.md` §11.
- Tvarka 4+ m.: to paties kuro TA juosta → kuras žinomas, bet juostą turi tik kitas kuras → ⚪ → TA modelio juosta → Regitra → atsarga. Neatpažintas kuras – kaip iki K-34.
- regitra.test +12 (125/125): BMW 320d 18 m. 210 000 km → 🟡 „dyzelinių“ (P10 13 240); tas pats benzininis → nėra; BMW 318 benzinas/dujos 5 m. ir Corolla hibridas 8 m. → ⚪ beKuro; X5 dyzelinas 3 m. → nėra (K-39); Golf 22 m. → ⚪ blokuota; Audi A4 be kuro → modelio juosta.
- Sargai 14 žali / 0 / 3 praleisti.

---

## D-48 · 2026-09-22 · Dizaineris → Klaudijui · KORTELIŲ TARPAS · 52 PAKETAS

### 1. Jūsų matavimas apvertė 48 paketo nurodymą

48 pakete rašiau: „trinti tik tris savybes, paviršius lieka". Tai buvo
teisinga **tada**, nes nežinojau, ar `.ct-card` duoda foną.

Dabar žinau abi puses: `.ct-card` (264–269 eil.) duoda foną, rėmelį ir
radiusą, bet **paraštės neturi visai**. Tad atvirkščiai: **paviršius
trinamas, paraštė pereina į skyrių.** Ištrynus visą deklaraciją be to
kortelės būtų sulipusios.

### 2. 8 ar 12 — ir kodėl tai ne „paliekam, kaip buvo"

STD lieka 8, TOP lieka 12, bet dėl priežasties, ne dėl inercijos: **TOP-5 yra
penkios kortelės, skaitomos po vieną** — kiekviena turi būti atskiras
objektas; **„Kiti skelbimai" yra sąrašas, kurį skenuoja** — tankesnis ritmas
padeda, o atskyrimą neša rėmelis.

Prie 20 kortelių tai 80 px slinkimo. Rašau tokenais (`--s-2`, `--s-3`), kad
skirtumas liktų **vienas žingsnis skalėje**, ne du atsitiktiniai skaičiai.

### 3. Trečias tas pats atvejis per dvi dienas

`.ct-istorija` užpildas laimi iš 2144 `!important`, ne iš 1340. Vadinasi,
48 pakete prašiau **palikti eilutę, kuri niekada nesuveikė** — ir tai
pažodžiu ta pati klaida kaip `ERRATA 8`.

Priežastis viena ir dabar aiški: **`index.html` `<style>` blokai stovi prieš
7128–7130 nuorodas.** Sistema nugali puslapio stilius, nors specifiškumas
vienodas. Trys kartai per dvi dienas: 5 blokas, `.ct-btn-accent`,
`.ct-istorija`.

`D-47` užsirašiau taisyklę „pirma patikrinti krautuvių eilę". Šis įrašas yra
pirmas kartas, kai ją pritaikiau **prieš** išsiunčiant, ne po.

### 4. Ir kas iš to seka istorijos juostai

`.ct-istorija` užpildo skyriaus **neimu**. Yra dvi reikšmės — 12 (veikia) ir
14 (niekada neveikė), — ir perkelti abi būtų tas pats, kas perkelti klaidą su
visu kontekstu. Kai imsiu juostą, **pirmas darbas bus nuspręsti tarp jų.**

**Failai:** `pasikeitimai/is-dizainerio/52-korteliu-tarpas/`

## Z-111 · 2026-09-22 · Klaudijus · v2.10.2 – 52 paketas (kortelių tarpas) įdiegtas + matavimas
- `ct-dizainas.css` gale – `ct-dizainas-39sk-PAPILDYMAS.css` (md5 95328799…). Ištrintos visos trys `.ct-std-card{…}` eilutės: index 1337, ct-bendras 182, compare 1277. index 2144 nepaliesta. D-48 įrašytas.
- **Matavimas (1920, Playwright, index.html su sistemos CSS):** TOP tarpas **14**, STD tarpas **14**, paskutinė STD **0**; radiusas **16**; fonas `rgb(17,20,28)`, rėmelis `rgba(255,255,255,.075)` – nepakitę; `.ct-istorija` `0 12px 12px` – nepakitęs; plotis 1560; `:hover` perėjimas `border-color .15s` išlieka (iš `.card`).
- **Kodėl ne 8/12:** kortelės turi klasę `card` – `index.html` 1138 `.card.ct-card { margin-bottom:14px; border-radius:16px; … }` (0,2,0) nugali `.ct-std-card`/`.ct-top-card`/`.ct-card` (0,1,0). Taip buvo ir iki 52 paketo: rankinių 8 / 12 nesuveikė nė vienas. **Mano ankstesnis matavimas (8 vs 12, radiusas 14) buvo klaidingas** – matuota be `card` klasės.
- `:last-child` (0,2,0, ct-dizainas vėliau) suveikia – paskutinė STD 0. TOP paskutinė ne `:last-child` (po jos `#ct-kiti-hdr`), lieka 14.
- Sargai žali.

## Z-112 · 2026-09-22 · Klaudijus · Luko eilė ir klaidos sutvarkytos
- Klaidos: #46 → laukia-patikros (v2.10.0 TA punktai; senos `val.toFixed` klaidos kode nebėra); #48 → laukia-patikros (kryžminiai skelbimai jau veikia, 502/404 – v2.9.1); #47 → patvirtinta (autogidas iškelti skelbimai nepaiso filtrų – nerodyti). #45, #30 – patvirtinta, eilėje pirmos.
- Luko eilė: 11 įvykdytų punktų → uždaryta; 7 atsakyti → perduota Klaudijui; FN-0922-1310 vėl klausiamas (paaiškinimas PLETRA §7.6); naujas KL-STOP-DIZAINAS (3 dizainerio klausimai).
- **KL-PUSH-0922E – push NEleistas:** atsakymas – griežtinti kuro filtrą. v2.10.1–v2.10.2 lieka lokaliai.
- FN-0922-0340: ScraperAPI 88 646 / 100 000 (09-22 ~14 val.).

## Z-113 · 2026-09-22 · Klaudijus · v2.10.3 – A-37 kėbulo kartos (Luko prašymas)
- Analitiko failai (md5 sutikrinti): `backend/duomenys/kartos.json` 40e0cc0c… (113 raktų), `tools/kartos-lentele.py` d726dfe9…, `docs/kartos-saltiniai.md` 030e6b10….
- `regitra.js`: `ikeltiKartas`, `kartos(marke, modelis, metai)` (1 arba 2 kodai ties riba), `kartosIntervalui(…, nuo, iki)`; raktas per `kontekstas()` (K-33 šeimos).
- `server.js`: `l.kartos` prie kiekvieno skelbimo (kandidatai ir visi), `GET /api/kartos` filtrui – 0 kreditų.
- `index.html`: `#ct-kartos` po filtrais („Kėbulai: F15 (2013–2018), G05 (2018–dabar)“), kortelės ženkliukas „Kėbulas G05“. `ct-priedai.css` 21 blokas `.ct-kartos-hint` – dizaineriui perimti.
- regitra.test +10 (135/135, analitiko pavyzdžiai). Sargai 14 / 0 / 3.

## Z-114 · 2026-09-22 · Klaudijus · A-39 kartos iki top 300 (v2.10.3 papildymas)
- `kartos.json` a938abdb… (184 raktai, 78,3 % parko), `kartos-lentele.py` 3a132b46…, `kartos-saltiniai.md` 911fbfc3… – md5 sutampa.
- Pataisa `regitra.js` `kartosRaktas`: markė su tarpu („LAND ROVER|DISCOVERY") – anksčiau tarpas keistas tik pirmas, raktas nerandamas.
- BMW|3 2012 → E9x + F3x – tyčinis persidengimas (E92/E93 iki 2013), analitiko patvirtinta.
- regitra.test +10 (145/145). Sargai žali.

## Z-115 · 2026-09-22 · Klaudijus · KL-TAUPYMAS įgyvendinta (Luko „Abu“)
- Railway kintamasis `GILINTI_TOP=3` nustatytas produkcijoje (veikia iškart, be push; redeploy'us v2.10.0).
- Kode: `GILINTI_TOP` numatytasis 8 → 3; `/api/history-counts` grąžina tuščius skaičius, kol `ISTORIJOS_SKAICIAI` ≠ 1 (įsigalios po push).
- **Iki push:** „Senos paieškos“ sąrašo atidarymas vis dar kainuoja – Lukui neatidarinėti.
- Kita: TS-0922-1730 („Duomenų šaltiniai“ puslapis + CC BY nuoroda) – Luko „Taip, iki 10-15“, eilėje; TS-0922-1700 – Luko „Ne, palikti“ (mobile.de premium lieka); DZ-STOP-ADMIN – trys mygtukai, DZ-SARGAS – mygtukas.

## Z-116 · 2026-09-22 · Klaudijus · v2.10.4 – Nr.45 nuotraukos (otomoto / DE)
- Luko komentaras: „Nerodo visur nuotraukų, bei jų yra ne visos tiek PL, tiek DE“.
- Priežastis (patikrinta tikru otomoto skelbimu, parsisiųstu tiesiai iš Luko kompiuterio, be ScraperAPI): `scrapeSingleListing` sudėdavo portalo galeriją (12) + `<img>` tų pačių nuotraukų kitais dydžiais (`;s=644x461`) → 25 adresai, 13 unikalių; 15 vietų užimdavo dublikatai. Hotlink'as neblokuojamas (olxcdn 200 su mūsų Referer).
- Taisymas: naujas `backend/nuotraukos.js` (`nuotraukosRaktas`, `nuotraukuUnikalios` – olxcdn „fn“, autoscout24 `/WxH.webp`, autoplius `_WxH`); jei portalas duoda struktūrinę galeriją (otomoto `advert.images`, autoscout24 `listingDetails.images`) – imama tik ji; riba 15 → 40 (`NUOTRAUKU_RIBA`), mobile.de 15 → 40. AI vis dar gauna ≤ 6.
- Seni AI apžvalgų podėlio įrašai (7 d.) turi senas galerijas – nauja apžvalga ar „Atnaujinti“ jas pakeičia.
- `testai/nuotraukos.test.js` 6/6. Sargai žali.

