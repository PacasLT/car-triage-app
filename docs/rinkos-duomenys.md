# CarTriige – rinkos duomenų modulis

> Pataisyta versija. Originalą parašė žmogus, nematęs mūsų kodo: jame buvo
> Postgres schemos (mes naudojame SQLite), o 3 etapas jau padarytas v1.23.0.
> Regitros duomenys patikrinti gyvai 2026-09-18 – išvados 4 skyriuje.
>
> **Prieš imantis bet kurio etapo perskaityti „Kas jau padaryta".**

---

## Kas jau padaryta (nedaryti iš naujo)

| Sritis | Kur kode | Būklė |
|---|---|---|
| Skelbimo momentinės kopijos | `cache.js` · `recordListingSnapshot(url, kaina, rida)`, `getListingTimeline(url)` | veikia |
| Gyvavimo ciklas | `cache.js` · `gautiGyvavimoCikla(url)` – `dienosRinkoje`, `kartuMatytas`, `pirmaKaina`, `dabartineKaina`, `mazinimuKartai`, `ridosPokytis` | veikia |
| „Dingo iš portalo" | `cache.js` · `_watch`, `zymetiNerasta` ≥ 2 iš eilės + filtrų suderinamumas + puslapių limito apsauga | veikia |
| Rinkos mediana | `server.js` · `marketMedian`, `marketCount`, rodoma tik kai `marketCount >= 5` | veikia |
| Modelio tendencijos | `cache.js` · `modelioPardavimoGreitis(modelis)`, `modelioTendencijos(modelis)` | veikia |
| Dienos rinkoje kortelėje | `index.html` · `ctLaikoPunktas(c)`, backend `dienosNuo(ikeltaLaikas)` | v1.33.0 |
| Kryžminiai skelbimai | `server.js` · `kryzminiaiSkelbimai` | veikia |
| **VIN validacija ir WMI** | `backend/vin-tikrinimas.js` – 17 simbolių, be I/O/Q, kontrolinis skaitmuo, WMI ~90 markių, modelio metai, NHTSA vPIC, neatitikimai su skelbimu | **PADARYTA v1.23.0** |
| Gamyklinė komplektacija | `backend/komplektacija.js` – dekoderių nuorodos pagal markę, build sheet sulyginimas | veikia |

**Originalo 3 etapas (VIN tikrinimas) išbrauktas visai** – jis padarytas.

---

## Kur duomenys saugomi šiandien

Ne Postgres. Naudojame **SQLite** (`better-sqlite3`) ir **JSON failus** ant Railway Volume:

```
/data/users.db               SQLite – vartotojai, kreditai, planai (auth.js, planai.js)
/data/cache.json             puslapių ir analizių podėlis
/data/market-history.json    rinkos istorija, MAX_HISTORY_PER_MODEL = 1000
/data/listing-timeline.json  kainų ir ridos momentinės kopijos
```

**Tai ir yra tikroji 1 etapo problema.** Funkcijas turime, bet jos remiasi JSON
failais, kurie:

- kraunami į atmintį visi iš karto;
- neužklausiami (nėra `WHERE make = ? AND year BETWEEN ? AND ?`);
- jau dabar karpomi (`MAX_HISTORY_PER_MODEL = 1000`), t. y. duomenys prarandami.

Todėl 1 etapas perrašomas ne kaip „sukurti istoriją", o kaip **„perkelti istoriją
į SQLite"**.

---

## 1 etapas – JSON → SQLite (PRIORITETAS)

Be šito 2 ir 4 etapai neveiks. Jokių naujų funkcijų – tik pamatas.

```sql
-- Vienas įrašas vienam skelbimui
CREATE TABLE IF NOT EXISTS skelbimai (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  portalas         TEXT NOT NULL,     -- autoplius | autogidas | autoscout24 | otomoto
  portalo_id       TEXT NOT NULL,     -- iš URL
  url              TEXT,
  vin              TEXT,
  marke            TEXT,
  modelis          TEXT,
  modelis_norm     TEXT,              -- žr. „Normalizavimas"
  metai            INTEGER,
  kuras            TEXT,
  pavarai          TEXT,
  kebulas          TEXT,
  galia_kw         INTEGER,
  defektai         INTEGER,           -- 0/1, SQLite neturi BOOLEAN
  salis            TEXT,
  ikelta_portale   INTEGER,           -- unix ms, iš ikeltaLaikas
  pirma_matyta     INTEGER NOT NULL,
  paskutini_matyta INTEGER NOT NULL,
  busena           TEXT NOT NULL DEFAULT 'aktyvus',  -- aktyvus | dingo
  dingo_kada       INTEGER,
  UNIQUE (portalas, portalo_id)
);

-- Naujas įrašas TIK kai kaina arba rida pasikeitė
CREATE TABLE IF NOT EXISTS skelbimu_momentai (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  skelbimas   INTEGER NOT NULL REFERENCES skelbimai(id) ON DELETE CASCADE,
  kaina_eur   INTEGER,
  rida_km     INTEGER,
  matyta      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skelbimai_vin   ON skelbimai (vin);
CREATE INDEX IF NOT EXISTS idx_skelbimai_modelis ON skelbimai (marke, modelis_norm, metai);
CREATE INDEX IF NOT EXISTS idx_skelbimai_busena ON skelbimai (busena, paskutini_matyta);
CREATE INDEX IF NOT EXISTS idx_momentai        ON skelbimu_momentai (skelbimas, matyta);
```

### Darbai

1. Migracija: `listing-timeline.json` ir `market-history.json` turinys vienkartiniu
   skriptu perkeliamas į lenteles. **Senų failų netrinti**, kol nepatvirtinta.
2. `cache.js` funkcijos (`recordListingSnapshot`, `getListingTimeline`,
   `gautiGyvavimoCikla`) perrašomos ant SQLite, **API nesikeičia** – tada
   `server.js` ir frontend liečiami minimaliai.
3. PLN kainos (otomoto) konvertuojamos į EUR nuskaitymo dienos kursu, saugoma EUR.
4. „Dingo" logika lieka ta pati (dvi nesėkmės iš eilės + filtrų suderinamumas) –
   ji jau teisinga, tik persikelia į SQL.

### Ko dar nerodome, nors duomenis turime

- **Kainos istorijos grafikas** skelbimo puslapyje (`laikoJuosta` jau grąžinama).
- **„↓ 1 500 € per 9 d."** žyma (turime `pirmaKaina`, `dabartineKaina`, datas).

Tai 1b darbas, atskiras leidimas.

### market_stats podėlis

```sql
CREATE TABLE IF NOT EXISTS rinkos_statistika (
  marke        TEXT,
  modelis_norm TEXT,
  metai        INTEGER,
  ridos_juosta TEXT,        -- '0-50k' | '50-100k' | ...
  defektai     INTEGER,
  salis        TEXT,
  mediana_eur  INTEGER,
  imtis        INTEGER,
  vid_dienu_rinkoje REAL,
  skaiciuota   INTEGER,
  PRIMARY KEY (marke, modelis_norm, metai, ridos_juosta, defektai, salis)
);
```

Perskaičiuoti kartą per parą, ne kiekvienai užklausai. Taisyklės, kurios jau
galioja ir lieka: mediana (ne vidurkis), imtis ≥ 5, rodomas imties dydis.

---

## 2 etapas – Rizikos signalai iš savų duomenų

### Ridos atsukimas
Tas pats VIN vėliau su **mažesne** rida → raudona žyma su abiem reikšmėmis ir
datomis. Tolerancija < 1 000 km (rašybos klaidos). Duomenis turime
(`ridosPokytis`), trūksta tik VIN indekso ir žymos.

### pHash – įvertinti prieš darant
Originalas siūlo pirmos nuotraukos perceptual hash, kad atpažintume tą patį auto
be VIN. Tai reikštų **kiekvienos** nuskaitytos nuotraukos parsisiuntimą ir
apdorojimą. Prie kelių tūkstančių skelbimų per paiešką tai rimtas kaštas laiko ir
Railway resursų.

Prieš darant išmatuoti: kiek skelbimų neturi VIN, ir kiek iš jų realiai kartojasi
portaluose. Jei kryžminiai skelbimai su VIN jau pagauna 80 % atvejų, pHash
neatsiperka.

---

## 3 etapas – PADARYTA

`backend/vin-tikrinimas.js`, v1.23.0. Neliesti.

---

## 4 etapas – Regitra: patikrinta gyvai 2026-09-18

### Svarbiausia išvada: sandorių duomenys NETINKA

`https://data.gov.lt/datasets/2812/` (TPSAIS, „Transporto priemonių sandorių
duomenys") **neturi markės, modelio, metų ar VIN**. Rinkinio aprašas:

> „pseudonimizuoti dokumento identifikatoriaus ir išorinio rakto (…), sandorio
> pobūdį nurodanti dokumento rūšis, dokumento išdavimo data, sandorio šalis,
> suma, valiuta, atsiskaitymo būdo bei įrašo modifikavimo laikas."

Tame pačiame puslapyje 2026-02-09 paliktas naudotojo komentaras prašo pridėti
būtent tai, ko trūksta: „Arba bent būtų pateikiama kokia transporto priemonė,
markė, modelis, metai perkama/parduodama."

**Vadinasi „sandorių per mėn.: 85" pagal modelį iš atvirų duomenų neįmanoma.**
Idėja apie paklausos rodiklį iš sandorių – atkrenta, kol Regitra nepakeis
rinkinio.

### Kas VEIKIA: parko duomenys

`Atviri_TP_parko_duomenys.zip` turi laukus `MARKĖ` ir `KOMERCINIS_PAV`, tad
**„LT registruota: 1 240 vnt." yra įmanoma.**

Teisingi adresai (originale buvo klaidingi – `/atvduom/` neegzistuoja):

```
https://www.regitra.lt/wp-content/uploads/failai/Atviri_TP_parko_duomenys.zip
https://www.regitra.lt/wp-content/uploads/failai/Atviri_JTP_parko_duomenys.zip
```

Atnaujinimo dažnis (svarbu cron'ui):

- parkas – **kas ketvirtį**, per 10 d. d. pasibaigus ketvirčiui (ne kas mėnesį);
- juridinių asmenų parkas – kas mėnesį, per 10 d. d.

`data.gov.lt` veidrodis pasenęs (naudotojo komentaras: paskutiniai duomenys
2023 m. III ketv.). **Imti tiesiai iš regitra.lt.**

### Normalizavimas – patvirtinta problema

Regitra oficialiai atsakė, kad duomenų netransformuoja:

> „naujų transporto priemonių atitikties liudijime [MARKE] – FIAT,
> [KOMERCINIS_PAV] – FIAT 500, tuo tarpu naudotos (…) gali būti nurodyta
> [MARKE] – FIAT, [KOMERCINIS_PAV] – 500. Abiem atvejais duomenys yra teisingi."

T. y. tas pats modelis tame pačiame faile yra dviem pavidalais. `FIAT 500` = 1031
įrašas, `500` = 31 įrašas. Be `normalizuotiModeli(marke, modelis)`, veikiančio
**ir skelbimams, ir Regitrai**, duomenys nesusijungs.

Pradėti nuo dažniausių markių: BMW, VW, Audi, Mercedes, Toyota, Porsche.

### Ką realiai gauname

```sql
CREATE TABLE IF NOT EXISTS regitros_parkas (
  laikotarpis  TEXT,        -- '2026-Q2'
  marke        TEXT,
  modelis_norm TEXT,
  metai        INTEGER,
  kuras        TEXT,
  kiekis       INTEGER,
  PRIMARY KEY (laikotarpis, marke, modelis_norm, metai, kuras)
);
```

Naudojimas: „LT registruota 1 240 vnt." → retas / dažnas modelis. Tai **likvidumo
užuomina, ne paklausos matas** – formuluoti atsargiai, pagal mūsų vizualinį
standartą. „Retas modelis LT" yra 🟡 (spėjimas apie pardavimo greitį), ne 🟢.

Žalio failo **nesaugoti**, tik agregatus. Apdoroti srautu – failas > 1 mln. eilučių.

### Verdiktas

4 etapas sumažėja maždaug per pusę: registracijų skaičius – taip, sandorių
skaičius – ne. Vis tiek verta, bet ne pirmas ir ne antras.

---

## 5 etapas – carVertical (VĖLIAU)

Nekodinti, kol nėra sutarties. Paruošti tik sąsają `VinReportProvider.getReport(vin)`,
kad tiekėją būtų galima pakeisti. Integruoti į esamą kreditų sistemą
(`planai.js`): nurašyti kreditą, kešuoti ataskaitą pagal VIN 30 d., nepavykus –
grąžinti kreditą (mechanizmas jau yra – `res.on('finish')` su 5xx).

---

## Siūloma eilės tvarka

1. **1a** – JSON → SQLite. Pamatas, be naujų funkcijų.
2. **1b** – kainos istorijos grafikas ir „↓ 1 500 € per 9 d." (duomenis jau turime).
3. **2a** – ridos atsukimo žyma pagal VIN.
4. **4** – Regitros parko importas + normalizavimas.
5. **2b** – pHash, tik jei matavimas parodė, kad VIN nepakanka.
6. **5** – carVertical, kai bus sutartis.

Kiekvienas – atskiras leidimas su versijos įrašu `frontend/versijos.js`, kaip
reikalauja `CLAUDE.md`.

---

## Priėmimo kriterijai

- [ ] **1a**: po kelių paieškų `skelbimai` ir `skelbimu_momentai` pildosi;
      `gautiGyvavimoCikla()` grąžina tą patį, ką grąžindavo iš JSON; seni JSON
      failai nebeskaitomi, bet dar nesunaikinti.
- [ ] **1b**: kainos pokytis matomas skelbimo puslapyje; mediana rodoma tik kai
      imtis ≥ 5, kartu rodomas imties dydis.
- [ ] **2a**: testinis atvejis su sumažėjusia rida pažymimas; skirtumas < 1 000 km
      ignoruojamas.
- [ ] **4**: mėnesinis (ketvirtinis) importas veikia srautu, neviršija Railway
      atminties, `regitros_parkas` užpildyta, `normalizuotiModeli()` sujungia
      „FIAT 500" ir „500".
- [ ] Visuose etapuose: `node backend/testai/dizainas.test.js` praeina, nauji
      UI elementai naudoja `var(--…)`, o ne kietai įrašytas spalvas.
