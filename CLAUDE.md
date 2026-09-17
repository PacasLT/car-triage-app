# CarTriige – taisyklės Claude

## Versijavimas (privaloma po KIEKVIENO atnaujinimo)

1. `frontend/versijos.js` – į `CT_VERSIJOS` sąrašo **viršų** pridėti naują įrašą:
   `{ versija: 'X.Y.Z', data: 'YYYY-MM-DD' (šios dienos), pavadinimas: '…', pakeitimai: ['…', '…'] }`.
   - `Y` keliamas už naują funkciją, `Z` – už pataisymus.
   - Pakeitimai rašomi vartotojo kalba (ką jis pamatys), ne techniniais terminais.
2. Versijos numeris antraštėje (`#app-version`) ir langas „Versijų istorija“ generuojami automatiškai iš šio sąrašo – daugiau niekur versijos rankiniu būdu nekeisti.
3. Commit žinutėje paminėti versiją, pvz. `v1.18.0: …`.

## Portalų nuskaitymas

- autoplius: markė/modelis per `backend/autoplius-ids.js` ID (`make_id[97]=1308`), ne `qt=` tekstą; rikiavimas `order_by=3&order_direction=DESC` (naujausi viršuje).
- Sąrašo puslapis nuskaitomas struktūriškai (`extractAutopliusStructured`) iš `a.announcement-item` klasių, ne regexais iš teksto; tekstinis parseris paliktas kaip atsarginis.
- `badge-rise` = MOKAMAS iškėlimas į viršų (ne kokybės ženklas), `badge-new` = kada įkeltas.
- Kaina < `MIN_REALI_KAINA` (4000 €): jei yra lizingo `data-amount` – imama reali kaina; jei ne – skelbimas žymimas „Patikrinkite kainą“, neįtraukiamas į medianą ir keliauja į „Kiti skelbimai“.
- ID lentelė atnaujinama fone kartą per 30 d. iš `/skelbimai/paieska?...type=make_combo` (1 ScraperAPI kreditas).
- Sąrašo puslapyje ĮRANGOS NĖRA – TOP `GILINTI_TOP` (8) skelbimų puslapiai atidaromi paieškos metu (`scrapeSingleListing`, be AI) ir iš jų imama įranga, VIN, vieta, pardavėjas.
- „Dingo iš portalo“ žymima TIK jei: skelbimas telpa į paieškos filtrus, jo nėra **antrą** kartą iš eilės (`cache.zymetiNerasta`) ir paieška nebuvo nukirsta puslapių limito. Nepavykęs nuskaitymas ≠ dingęs skelbimas.

## AI sąnaudos (įeinantys tokenai – 96 % sąskaitos)

- `DEEP_INSTRUKCIJOS` – statinė promptų dalis su `cache_control: ephemeral`. **Nekeisti be reikalo**: kiekvienas pakeitimas panaikina podėlį.
- `TEKSTO_RIBA` (4 000 simb.) – žalio puslapio teksto riba; struktūriniai laukai eina pirmi, todėl daugiau nereikia.
- `ANALIZES_PODELIS_MS` (7 d.) – ta pati analizė negeneruojama iš naujo, nebent pasikeitė kaina (`analizesPodelis(url, kaina)`).
- Nuotraukos brangiausios (~1 400 tokenų viena): `DEEP_FOTO_KIEKIS` = 6.

## Vizualinis standartas (nuotraukų AI) – privaloma

> **MATOME → APRAŠOME. ĮTARIAME → ĮSPĖJAME. NEŽINOME → NEIŠGALVOJAME.**

- `backend/nuotrauku-analize.js` yra **įrodymų sluoksnis** (evidence layer), ne teisėjas: jis tik aprašo, kas matoma, su nuotraukos numeriu. Verdiktą daro gilioji analizė.
- Lygiai: `matoma` (🟢, privalo turėti nuotraukos numerį) · `galimas` (🟡, su `kodel_neaisku`) · trūkstamas rakursas = neįvertinta sritis.
- **Draudžiama** rašyti: „daužtas / nedaužtas“, „be avarijų“, „rida atsukta“, „variklis tvarkingas“, „originali / gamyklinė komplektacija“, „patvirtina / įrodo / garantuoja“. Tai tikrina `DRAUDZIAMA` sąrašas **kode**, ne tik promptas – radus, pastebėjimas nuleidžiamas į 🟡 ir teiginys iškerpamas.
- Du atskiri rodikliai: **Visual Condition** (būklė tik iš to, kas įvertinta) ir **Visual Confidence** (kiek apskritai galima įvertinti; skaičiuojama kode iš rakursų ir nuotraukų kokybės, niekada neklausiama modelio).
- Trūkstamas rakursas **nemažina** automobilio balo – jis virsta klausimu pardavėjui.
- Įranga: du nepriklausomi šaltiniai (nuotrauka + skelbimo sąrašas) = 🟢; vienas = 🟡 su prierašu, kad gamyklinė komplektacija nepatvirtinta.
- Gilioji analizė nuotraukų nebegauna – ji gauna `tekstasAnalizei()` rezultatą (`VIZUALUS_SLUOKSNIS=0` grąžina seną elgesį).

## VIN

- `/api/vin-check` – **nemokamas**: `backend/vin-tikrinimas.js` (WMI, šalis, modelio metai, kontrolinis skaitmuo) + nemokama NHTSA vPIC + sutapimas su skelbimu + ar tą VIN jau matėme.
- `/api/vin-lookup` – mokamas (1 kr): AI web paieška aukcionų/žalų istorijai.

## Saugumas

- `ANTHROPIC_API_KEY`, `SCRAPER_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`, `INVITE_CODES` – tik Railway Variables, **niekada į kodą ar GitHub**.
- `backend/.env` – niekada į GitHub.
- `git push origin main` vykdo **tik Lukas** PowerShell'e; Claude niekada nepushina.
- Windows PowerShell: `&&` neveikia – git komandos rašomos atskiromis eilutėmis.

## Darbo eiga

- Prieš rašant į įrenginį – Playwright regresija (web 1400 px ir tel 390 px), 0 JS klaidų.
- Į įrenginį rašoma per naują `/mnt/user-data/outputs/vN/` kelią, po įrašymo tikrinamas md5.
- `git status` tik su `--no-optional-locks` (kitaip lieka `.git/index.lock`).
- Serveryje niekada nekviesti mokamų maršrutų (analyze, vin, seller, compare) testavimui – tik GET.

## Struktūra

- `backend/server.js` – Express API, scraping, AI; `planai.js` – planai/kreditai; `vartotojo-duomenys.js` – mėgstamiausi/ataskaitos; `auth.js` – JWT; `cache.js` – podėlis.
- `frontend/index.html` – pagrindinis (monolitas); `detail.html`, `compare.html`, `megstamiausi.html`, `ataskaitos.html`; bendri `ct-bendras.css/js`, `versijos.js` (versijų istorija), `megstami-meniu.js` (širdutė antraštėje su mėgstamiausių sąrašu), `paskyra-meniu.js` (paskyros meniu po profilio mygtuku).
