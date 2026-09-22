# UŽDUOTIS · TA duomenų integracija

Paruošta 2026-09-22, analitiko sesija. Viskas čia **išmatuota gyvai**, ne spėta.

**Perskaityti pirma:**
1. `docs/ta-pilotas-2026-09-22.md` — 8 modelių rezultatai, spąstai.
2. `docs/ATSAKYMAI-regitra-2026-09-21.md` — A-30 (kodėl tik amžiaus juostos), A-32 (atsarga 7–15 m.), A-33 (raktų defektai).
3. `docs/regitra-panaudojimas.md` — žinojimo lygiai, BDAR riba.

---

## 0. Ką darom ir kodėl

Regitros `RIDA` užpildyta tik 17 % ir fiksuojama vieną kartą — registruojant. TA rinkinyje rida užpildyta **99,4–99,9 %**, fiksuojama **kas 1–2 metus**, ir kiekvienoje amžiaus juostoje populiariems modeliams yra **tūkstančiai** įrašų vietoj dešimčių.

Trys dalykai iš TA:

| Kas | Vertė | Kur naudojama |
|---|---|---|
| Ridos norma pagal modelį ir amžių | **didelė** | pakeičia Regitrą kaip pirminis šaltinis ridos punktui |
| TA neišlaikymas pagal modelį ir amžių | **didelė** | naujas punktas „būklė šiame amžiuje" |
| Ridos sumažėjimas tarp apžiūrų | maža | tik saugom; sąsajoje kol kas nerodom |

---

## 1. Faktai apie šaltinį

| | |
|---|---|
| Rinkinys | data.gov.lt 2721, TRANSEKSTA, **CC BY 4.0** |
| API | `https://get.data.gov.lt/datasets/gov/transeksta/ctadb/Apziura` |
| Įrašų iš viso | 15 829 696 |
| **M1 + M1G** | **12 212 462** (iš jų M1G 491 985) |
| Automobilių (įvertis) | ~2,5 mln. (≈ 4,8 apžiūros vienam) |
| Atnaujinama | kas savaitę |

### Sintaksė — patikrinta

```
?count()                                   kiekis           (/:count NEVEIKIA)
?tp_klase.startswith("M1")                 M1 ir M1G
?sort(tp_id)                               veikia, tvarka išlieka per puslapius
&limit(10000)                              puslapis
&page("<_page.next>")                      kitas puslapis
```

**Pagrindinė užklausa įrankiui:**
```
?tp_klase.startswith("M1")&sort(tp_id)&limit(10000)
```

Patikrinta: du iš eilės puslapiai rūšiuoti viduje ir per ribą (`00371e8e56ef0e8` → `0037269aee81f21`). **Vieno automobilio įrašai gali persiskirti per puslapio ribą** — įrankis turi tai valdyti (žr. 2 sk.).

Greitis: ~4 s puslapiui su rūšiavimu. 1 222 puslapiai → **~90 min**.

### Tinklas

- **Nei debesies konteineris, nei įrenginio apvalkalas `get.data.gov.lt` nepasiekia** (tinklo politika, 403).
- Iš Claude pasiekiama **tik per naršyklės polangį** — svetainė leista šiame kompiuteryje. Tinka bandymams (`javascript_tool` + `fetch` iš puslapio konteksto; vienas modelis — iki minutės).
- **Pilnas paleidimas — Luko kompiuteryje**, jo PowerShell, kur tinklas normalus.

### Serveris lūžta, jei skubini

Be pauzių antras paleidimas gavo **HTTP 500** penkiuose modeliuose. Su **300 ms pauze tarp puslapių** ir pakartojimu po `429/500/502/503/504` (3 s → 6 s → 12 s → 24 s → 48 s) — 2,2 mln. įrašų be nė vienos klaidos.

---

## 2. SPĄSTAI — trys, visi jau kainavę

**1. Visureigiai yra M1G.** `tp_klase == "M1"` išmeta 43,5 % X5, 35,3 % Q5, 27,4 % XC60. Taip gautas „jauni premium visureigiai TA neišlaiko 40–52 %" — tikras skaičius **28–30 %**. Filtras tik `startswith("M1")`.

Regitroje tas pats kitaip: `KATEGORIJA_KLASE` = `M1` visiems, „G" tik `KATEGORIJA_PILNAI`. Regitros suvestinė **nenukentėjo** (patikrinta). Bet kas perkelia filtrą iš vieno rinkinio į kitą — turi tai žinoti.

**2. Skaitiklio keitimas nėra atsukimas.** Senų Golf'ų „atsukimų" buvo 3,8 % — iš jų pusė yra skaitiklio keitimai ar persivertimai (vėlesnė rida < 20 % buvusios). Atskyrus — Golf lygus kitiems. Klasifikuoti **dviem grupėm** (žr. 3 sk.).

**3. Skaitiklis ir vardiklis iš skirtingų aibių.** Analitiko sesija šią klaidą padarė **tris kartus** (ridos užpildymas, nuasmeninti, M1 filtras). Kiekvienas procentas — skaitiklis ir vardiklis iš **tos pačios** aibės. Priėmimo testas 6 sk. tai tikrina.

---

## 3. Įrankis `tools/ta-suvestine.js`

Node ≥ 18, įmontuotas `fetch`, **be priklausomybių**. Node jau yra Luko kompiuteryje; Python nebūtinas.

### Srautas — po vieną automobilį

```
buferis = []                                  // dabartinio tp_id įrašai
kiekvienam puslapiui:
  kiekvienam įrašui:
    jei įrašas.tp_id != buferis.tp_id:
      apdorokAutomobilį(buferis); buferis = []
    buferis.push(įrašas)
  // NEapdorot buferio puslapio gale — kitas puslapis gali tęsti tą patį tp_id
pabaigoje: apdorokAutomobilį(buferis)
```

Atmintis pastovi: viename buferyje — vieno automobilio įrašai.

### `apdorokAutomobilį`

1. Raktas: **`baziniModelis(tp_marke, tp_modelis)` iš `backend/regitra.js`** — `require`, NE kopija. Kitaip normalizavimas gyventų **trijose** vietose (Python generatorius, backend, šis įrankis). Jei A-33 pataisymai (`SERIE`/`REIHE`, bare `X`) jau įdiegti — TA juos gauna automatiškai.
2. Praleisti, jei raktas `null` arba markė be raidžių (pirmas imties įrašas buvo `tp_marke: "021-11-254"` — priekaba).
3. Įrašus su `tp_rida_km > 1000` ir datomis surūšiuoti pagal `ta_savaites_data`.
4. Kiekvienam įrašui: `amžius = data − tp_pag_metai`, juosta `0-3 / 4-6 / 7-9 / 10-12 / 13-15 / 16-20 / 21-40` (tos pačios kaip Regitroje).
   - `rida / amžius` → modelio×juostos histograma (žr. žemiau), jei `amžius > 0,5`.
   - Jei `ta_tipas == "Techninė apžiūra"` (pirminė, ne pakartotinė) → modelio×juostos skaitikliai: viso, `ar_ta_islaikyta === false`.
   - **Tas pats į bazinę eilutę „visi modeliai"** — ji reikalinga būklės punktui (4.2).
5. Ridos pokyčiai tarp gretimų apžiūrų, jei automobilis turi ≥ 2:
   - `sumažėjo > 10 000 km` IR `nauja ≥ 0,2 × buvusi` → **atsukimas**
   - `nauja < 0,2 × buvusi` → **nusinulinimas** (skaitiklio keitimas, persivertimas, įvedimo klaida)
   - Atskirai skaičiuoti atsukimus automobiliams, kurių paskutinė apžiūra < 20 m.

### Procentiliai be 12 mln. skaičių atmintyje

Histograma kiekvienam modelio×juostos langeliui: **250 km/metus žingsnis, 0–100 000** (400 langelių, `Uint32Array`). P10/P25/P50/P75/P90 iš kaupiamosios sumos. Paklaida ≤ 125 km — toli žemiau bet kokios produkto ribos.

### Atsparumas

- 300 ms pauzė tarp puslapių; pakartojimai kaip 1 sk.
- **Kontrolinis taškas kas 50 puslapių** (`tools/.ta-busena.json`: paskutinis `page` žetonas + agregatai + buferis). Paleidus iš naujo — tęsia. 90 min. paleidimas Windows kompiuteryje **nutrūks** anksčiau ar vėliau.
- `.ta-busena.json` → `.gitignore`.
- Eiga į konsolę: `puslapis 412/1222 · 4 120 000 įrašų · ETA 58 min`.

### Rezultatas: `backend/duomenys/ta-modeliai.json`

```json
{
  "versija": 1,
  "saltinis": "TRANSEKSTA, Transporto priemonių techninės apžiūros duomenys (data.gov.lt 2721)",
  "licencija": "CC BY 4.0",
  "sugeneruota": "2026-09-22",
  "laikotarpis": ["2015-01-04", "2026-09-20"],
  "irasu": 12212462,
  "automobiliu": 2512000,
  "bazine": {
    "neislaike_juostos": { "10-12": [412000, 36.1] }
  },
  "modeliai": [
    {
      "modelis": "BMW X5",
      "automobiliu": 11953,
      "apziuru": 62488,
      "kmmet_juostos":     { "10-12": [9762, 13965, 16800, 20689, 24100, 27746] },
      "neislaike_juostos": { "10-12": [7458, 35.3] },
      "su_2_apziuromis": 11800,
      "atsukimas_pct": 1.9,
      "atsukimas_iki20_pct": 1.5,
      "nulinimas_pct": 0.2
    }
  ]
}
```

- `kmmet_juostos`: `[n, P10, P25, P50, P75, P90]` — **tas pats formatas kaip Regitros** `kmmet_juostos`, kad backend'as skaitytų abu viena funkcija.
- Juosta įrašoma tik kai `n ≥ 50`. Modelis — tik kai `automobiliu ≥ 30`.
- **Jokių eilučių lygio duomenų** (`tp_id`, `tp_vin_nr`, stotys, savivaldybės) — tik agregatai.

Tikėtinas dydis: 300–600 KB.

---

## 4. Integracija į produktą

### 4.1 Ridos punktas — TA tampa pirminiu šaltiniu

Paieškos tvarka (A-30 ir A-32 logika, šaltiniai sustatyti pagal patikimumą):

```
1. TA juosta modeliui (n ≥ 50)                      → naudojam
2. Regitros juosta (n ≥ 50)                          → naudojam
3. Regitros sudėtinis, TIK 7–15 m., kmmet_n ≥ 100    → naudojam (A-32)
4. kitaip                                            → ⚪
```

Taisyklė ta pati: skelbimo `rida / amžius` < juostos **P10** → 🟡 klausimas pardavėjui. Niekada „atsukta".

**Papildoma sąlyga:** jei modelio `nulinimas_pct ≥ 1,0` — **21–40 m. juostos nenaudoti** (⚪). Senų Golf'ų 21+ m. P10 yra 2 948 km/metus — tą juostą užteršia skaitiklių keitimai.

### 4.2 Būklės punktas — naujas

**Formuluotė — būklė, ne patikimumas:**

> „Šio amžiaus Škoda Octavia Lietuvoje TA neišlaiko 52 % — daugiau nei vidutiniškai (45 %)."

Draudžiama: „nepatikimas", „patikimas", „dažnai genda". TA fiksuoja dėvėjimąsi (stabdžiai, važiuoklė, žibintai, korozija), ne variklius — „patikima" Corolla krenta beveik kaip Golf. **Šiuos žodžius įrašyti į `DRAUDZIAMA` kode.**

**Visada su palyginimu** su `bazine.neislaike_juostos` tos pačios juostos. Vieno modelio skaičius be palyginimo nieko nesako.

**Tik toje pačioje amžiaus juostoje.** Pilotas parodė, kad linijos susikerta: jauni visureigiai (4–9 m.) krenta dažniau už sedanus, seni (13+ m.) — rečiau. Vieno skaičiaus modeliui nėra.

**Ribos — pasiūlymas, galutinės po pilno paleidimo:**
- ≥ 8 p. p. geriau už bazinę → 🟢
- ≥ 8 p. p. blogiau → 🟡
- kitaip → punkto nėra
- juostos nėra → ⚪

Po pilno paleidimo pažiūrėti skirtumų nuo bazinės pasiskirstymą ir, jei reikia, rišti prie kvartilių — kaip likvidumo (A-8).

### 4.3 Ridos sumažėjimas

Sąsajoje **kol kas nerodom.** Iki 20 m. visi 8 modeliai telpa į 0,4–1,5 % — modelius tai skiria silpnai. Duomenys lieka faile.

### 4.4 Atribucija — privaloma

CC BY 4.0 reikalauja nurodyti šaltinį. Kur rodomas TA pagrįstas punktas (`title` arba trečias lygis) ir puslapio poraštėje:

> Šaltinis: TRANSEKSTA, techninės apžiūros duomenys · CC BY 4.0

### 4.5 `/admin/atsarga`

Pridėti `ta: { sugeneruota, laikotarpis, modeliu }` — kaip Regitrai.

---

## 5. Sprendimai Lukui

| Nr. | Klausimas | Numatytasis, jei neatsako |
|---|---|---|
| K-TA-1 | Būklės punktas — kortelėje ar tik skelbimo puslapyje? Kortelės `whyReasons` riba 3, laikas jau užima slotą. | Tik skelbimo puslapyje ir trečiame lygyje |
| K-TA-2 | Paleidimo dažnis | Kas ketvirtį, kartu su Regitra |

---

## 6. Priėmimo testai

Palyginti su pilotu (2026-09-22). TA atnaujinamas kas savaitę, o pilotas modelius rinko per `contains`, tad leistina paklaida **±5 %** (procentams — **±1,5 p. p.**).

| Tikrinama | Laukiama | Jei ne — tikėtina priežastis |
|---|---|---|
| `BMW X5` automobilių | ≈ 11 953 | **≈ 6 800 → M1G filtras sugedęs** |
| `BMW X5` km/met 10–12 P50 | ≈ 20 689 | |
| `BMW X5` neišlaikė 13–15 | ≈ 40,8 % | |
| `VW PASSAT` km/met 4–6 P50 | ≈ 29 055 | |
| `TOYOTA COROLLA` km/met 4–6 P50 | ≈ 15 203 | |
| `VW GOLF` `nulinimas_pct` | ≈ 2,0 % | ≈ 0 → nusinulinimai neatskirti |
| `VW GOLF` `atsukimas_pct` | ≈ 1,9 % | ≈ 3,8 → nusinulinimai įskaityti į atsukimus |
| `SKODA OCTAVIA` neišlaikė 13–15 | ≈ 52,1 % | |
| Visi procentai | vardiklis = to paties modelio×juostos pirminės apžiūros | skaitiklis ir vardiklis iš skirtingų aibių |
| Raktai | kiekvienas TA raktas, esantis ir Regitroje, sutampa | normalizavimas nukopijuotas, ne `require` |

Sargas: `node backend/testai/ta.test.js` — su šiomis patikromis prieš sugeneruotą failą.

---

## 7. Ko NEdaryti

- **Nekviesti TA API iš Railway serverio.** Tik įrankis Luko kompiuteryje, rezultatas keliauja su deploy'umi — kaip Regitra.
- **Nekopijuoti normalizavimo** — `require('../backend/regitra.js')`.
- **Nenaudoti `select()`** — pagal ataskaitą dingsta `_page.next`.
- **Nesaugoti eilučių lygio duomenų** niekur.
- **Neskubinti serverio** — 300 ms pauzė nėra pasirinkimas.
- Nesakyti „patikimas / nepatikimas", „atsukta rida".

---

## 8. Lukui — kaip paleisti

Kai įrankis bus parašytas, PowerShell'e:

```powershell
cd C:\Users\lukas\Downloads\car-triage-app
node tools\ta-suvestine.js
```

Trunka **~1,5 val.** Jei nutrūks — paleisti tą pačią komandą, tęs nuo kontrolinio taško. Baigus — commit'inti `backend/duomenys/ta-modeliai.json`.

---

## 9. Baigus

1. `frontend/versijos.js` — naujas įrašas, naudotojo kalba.
2. `CLAUDE.md` — skyrius „TA duomenys" su 2 sk. spąstais ir 7 sk. draudimais.
3. Playwright regresija 1400 / 390 px, 0 JS klaidų.
4. `ta.test.js` + `regitra.test.js` + esami sargai.
5. Klaidų sąrašo būsenos.

---

## 10. KL-NR46 galutinės ribos (A-34, Analitikas, 2026-09-22)

Lukas pasirinko variantą A (AN-0922-1133). Tai trys punktai. Ribos pamatuotos pilname `ta-modeliai.json` (md5 d5d7a409…) ir **pakeičia** §4.1–4.2 pasiūlymus.

### 10.1 RIDOS NORMA – TA pirminis šaltinis (keičia §4.1)

```
1. TA juosta modeliui, n ≥ 100 (ne 50)             → naudojam, žymim „TA"
2. Regitros juosta (n ≥ 50)                         → naudojam
3. Regitros sudėtinis, TIK 7–15 m., kmmet_n ≥ 100   → naudojam (A-32)
4. kitaip                                           → ⚪
```

- Kodėl n ≥ 100: TA juostų su n ≥ 50 yra 3 617, su n ≥ 100 – 3 038. Parko aprėptis beveik ta pati (82–87 %), o P10 stabilesnis. TA `n` = apžiūrų skaičius, ne automobilių.
- Jei `nulinimas_pct ≥ 1,0`, 21–40 m. juosta → ⚪. Tai liečia 210 modelių (Golf, Prius, Polo, Transporter…).
- 🟡 taisyklė, tekstas ir draudžiami žodžiai nesikeičia. Prie TA juostos pridėti atribuciją §4.4.
- Pavyzdys: Corolla, 4–6 m. Regitroje P10 = 4 296 (n 77), TA P10 = 7 782 (n 6 188). Skelbimas su 6 000 km/metus: su Regitra – be punkto, su TA – 🟡.

### 10.2 BŪKLĖ TA – tik 🟡 (keičia §4.2)

- Sąlyga: skelbimo amžiaus juostoje `n ≥ 300` ir `pct − bazine[juosta] ≥ 10` p. p. → 🟡.
- **🟢 nerodom.** Lukas patvirtino tik įspėjimą. „Geriau už vidurkį" prie modelio skaitytųsi kaip „patikimas" (draudžiama).
- **0–3 m. juostos nenaudoti.** Lietuvoje nauji automobiliai pirmą TA eina tik po kelerių metų, tad 0–3 m. pirminės apžiūros yra beveik vien įvežtų automobilių. Būtent ten didžiausi nuokrypiai (Audi A4 31,5 %, BMW 3 34,7 %, Prius 50,2 % prieš 20,5 % bazę) – tai importo ženklas, ne modelio būklė.
- Mastas: iš 1 811 modelio×juostos porų (n ≥ 300) ribą ≥ +10 p. p. peržengia 291 (16 %). Pasiskirstymas: P50 +1,8, P75 +7,2, P90 +12,3.
- Tekstas: „Šio amžiaus ({nuo}–{iki} m.) {modelis} pirmos techninės apžiūros Lietuvoje neišlaiko {pct} % – daugiau nei vidutiniškai ({bazė} %)." + atribucija §4.4.
- Pavyzdžiai: Renault Megane 10–12 m. 54,0 % (bazė 43,5 %); Kia Sportage 10–12 m. 53,7 %; Volvo XC90 7–9 m. 43,4 % (bazė 32,6 %); Toyota Prius 4–6 m. 35,8 % (bazė 23,4 %).
- Vieta: pagal K-TA-1 numatytąjį – skelbimo puslapyje ir trečiame lygyje, ne kortelėje.
- Ribojimas: TA duomenys baigiasi 2025-05. Skelbimo amžių skaičiuojam nuo šiandien, todėl juosta gali pasislinkti ~1 metais. Tai priimtina.

### 10.3 IMPORTO TENDENCIJA – iš Regitros, 🟢 (nauja)

- Duomenys: `regitra-modeliai.json` → `imp_men` (36 mėn., 2023-06…2026-05). `a0 = sum(imp_men[0:12])`, `a1 = sum(imp_men[24:36])`.
- Sąlyga: `a1 ≥ 120` ir `a0 > 0`, ir (`(a1−a0)/a0 ≥ +50 %` arba `≤ −33 %`).
- Lygis 🟢 PATVIRTINTA – tai suskaičiuotas faktas. Spalva reiškia žinojimo lygį, ne gera/bloga.
- Tekstas: „Įvežimas į Lietuvą per 3 metus {išaugo / sumažėjo} {N} % ({a0/12} → {a1/12} per mėn.)". **Jokios prognozės** („kaina kris", „vertė kris") – įrašyti į `DRAUDZIAMA`, jei dar nėra.
- Mastas: tinkami 154 modeliai, suveikia 47 (7,7 % parko), daugiausia elektromobiliai. Pavyzdžiai: VW ID 186 → 737 per metus (+296 %), Škoda Enyaq 36 → 172, Mazda 6 225 → 142 (−37 %).

### 10.4 Testai (`regitra.test` / `ta.test`)

| Atvejis | Laukiama |
|---|---|
| Toyota Corolla, 5 m., 30 000 km | 🟡 RIDOS NORMA iš TA (6 000 < 7 782) |
| BMW X5, 5 m., 100 000 km | be ridos punkto (20 000 > TA P10 11 367) |
| VW Golf, 25 m., 50 000 km | ⚪ RIDOS NORMA (nulinimas ≥ 1,0) |
| Renault Megane, 11 m. | 🟡 BŪKLĖ 54,0 % / 43,5 % |
| BMW 3, 2 m. | BŪKLĖS nėra (0–3 m. juosta nenaudojama) |
| VW ID, bet kokie metai | 🟢 IMPORTO TENDENCIJA +296 % |
| VW Passat | IMPORTO TENDENCIJOS nėra (pokytis tarp ribų) |
