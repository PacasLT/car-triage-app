# CarTriige – taisyklės Claude (v2, 2026-09-22)

Tik taisyklės. „Kodėl" ir istorija – `docs/pamokos.md` (senasis CLAUDE.md, nepakeistas).
Darbo sistema ir rolės – `pasikeitimai/TAISYKLES.md`; pilnas planas – Claude projektas „Cartriide".

## Pirmas veiksmas sesijoje
1. `pasikeitimai/BUSENA.md` – kas atvira ir kieno ėjimas. 2. `pasikeitimai/LUKUI.md`. 3. `ZURNALAS.md` pabaiga.
Prieš keičiant sritį – `grep -n "## " docs/pamokos.md` ir perskaityti tos srities skyrių.

## Kreipimasis į Luką
Klausimai / sprendimai / leidimai – „Luko eilė“ (https://claude.ai/artifact/KfPvoTLDL83GtRYHobaXtu, `ArtifactData` → `klausimai`), forma – projekte `claude/LUKUI-TAISYKLE.md`. Kiekvieno atsakymo gale: „Lukui: …“ arba `▶ LUKUI` / `▶ PERDUOTI → <kam>` blokas.

## Procedūros (skills)
- Po KIEKVIENO kodo pakeitimo → skill **`cartriige-leidimas`** (sargai, versija, žurnalas, klaidų būsenos, BUSENA/LUKUI, commit, push, deploy patikra, veidrodis).
- Atėjo dizainerio zip → skill **`cartriige-dizainerio-paketas`**.
- Klaidų sąrašo peržiūra → skill **`cartriige-klaidos`**.

## Versija
- Vienintelė vieta: `frontend/versijos.js`, naujas įrašas sąrašo VIRŠUJE, šios dienos data. `Y` – funkcija, `Z` – pataisymas. Pakeitimai vartotojo kalba. Commit žinutė prasideda `vX.Y.Z:`.

## Git, push, saugumas
- `git` vykdo Claude **per Luko PowerShell'ą** (Windows-MCP), komandos atskiromis eilutėmis (`&&` neveikia). **Jokio `git` iš `device_bash`** (`.git/index.lock`).
- `git push origin main` – **tik Lukui leidus** kiekvieną kartą. Commit'o gale – Co-Authored-By ir Claude-Session eilutės.
- Raktai (`ANTHROPIC_API_KEY`, `SCRAPER_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`, `INVITE_CODES`, `KLAIDU_RAKTAS`) – tik Railway Variables. `backend/.env` – niekada į git. Raktai niekada adrese (tik antraštėje).
- Žali duomenys (`*.zip`, `*.csv`, registro 945 MB) – niekada repo aplanke; tik suvestinės `backend/duomenys/*.json`.
- **Iki 2026-10-16 (ScraperAPI ciklas, Luko sprendimas KL-SCRAPER A):** kūrimo testai tik su įrašytu HTML (`backend/testai/`) arba užsienio portalais (1 kr./psl.). Gyvų autoplius/autogidas paieškų ir skenavimų testavimui – ne. Tas pats skelbimas LT su render = 30 kr.
- Serveryje testavimui **niekada nekviesti mokamų maršrutų** (analyze, vin-lookup, seller, compare, paieška) – tik GET ir nemokami. Jokių didelių skenavimų be Luko OK.
- Produkcija: Railway MCP (žurnalai, deploy'ai – tik skaityti; jokių restart/redeploy be Luko), naršyklės `seed` skirtukas (prisijungęs, žetonas `localStorage.ct_token`).

## Failų nuosavybė
- `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css` – **dizainerio**. Keičiami tik diegiant paketą arba jo aiškiai paprašytą vietą (įrašoma žurnale).
- Mūsų papildymai – `frontend/ct-priedai.css`, numeruotais blokais su „Dizaineriui:" eilute. Blokų sąrašas – `BUSENA.md`.
- `frontend/admin.html` generuojamas: `cd frontend && python3 ../tools/mk-admin.py`. Šablone JS viduje NEgalima `\n` ir `\'` (naudoti `String.fromCharCode(10)`, `&quot;`); po generavimo `node --check` ištrauktam skriptui.
- Rinkos/registro duomenys – Analitikas rašo `tools/`, `docs/`, `backend/duomenys/`; commit'ina Claude po `regitra.test`.

## Dizaino taisyklės naujam kodui
1. Spalva, šriftas, tarpas, radiusas – tik `var(--…)`. 2. Naujas tokenas – tik dizainerio `:root` (klausti). 3. `style="` – tik išdėstymui, niekada spalvai/šriftui/rėmeliui. 4. Naujas komponentas – klasė, ne inline. 5. Įspėjimų nekeisti į kategoriškesnius. 6. Neįvertinta ⚪ niekada neatrodo kaip 0 ar klaida.
- Mygtukas = `ct-btn` + variantas (`-primary`, `-accent`, `-quiet`, `-go`) + forma (`-sm`, `-lg`, `-icon`, `-round`). Jokio vietinio `height`/`border-radius`/`font-size`. Būsena „įjungta" – `.is-on`. Pirminis – vienas sprendimo paviršiuje.
- ID taisyklė = tik vieta; išvaizda – sistemos klasės. `!important` nerašyti.
- Naikinantis veiksmas – niekada veiksmų eilėje (kortelės dešinysis viršus, `#i-pasalinti`).
- Kortelę keisti TIK `ctKortele(c, x)` (`index.html`) – ją naudoja TOP, eilutės ir atmestos.
- Dizaino sprendimo reikia (spalva, vardas, komponentas) → `K-nn` žurnale + matavimas `pasikeitimai/matavimai/`; jei negali laukti – laikinas `ct-priedai.css` blokas.
- Antrą kartą rašant tą patį į `ct-priedai.css` – klausti dizainerio klasės, ne rašyti.

## Matavimas (privaloma prieš sakant „veikia")
- Regresija 1400/1280 px ir 390 px, 0 JS klaidų. Matuoti **produkcijoje po deploy'aus**, ne tik vietoje.
- Matuoti ne tik ar telpa, bet ir **ar yra**: plotis > 0, `elementFromPoint` centre grąžina patį elementą.
- Įsitikinti, kad elementas YRA toje būsenoje, kurioje gyvena klaida (`.is-split`, medija, atidarytas meniu) – ir užrašyti ją šalia skaičiaus.
- `scrollWidth > clientWidth` prasminga tik kai `overflow` ≠ `visible`. `height` pralaimi `min-height`.
- Paslėptoje naršyklėje – `*{transition:none!important}` prieš matuojant spalvas/dydžius.
- Tas pats elementas keliuose puslapiuose – matas yra PALYGINIMAS tarp jų.
- Kaukė (`mask-image`), `overflow`, `transform` ant tėvo kerpa absoliučius vaikus (meniu).
- Po kiekvieno didesnio perdarymo: `cd frontend && python3 ../tools/onclick-patikra.py`.

## Žinomi spąstai (nekeisti atgal)
- `device_commit_files` gali grąžinti „written", bet įrašyti SENĄ kopiją (Analitikas, 2026-09-22, du kartus). Po kiekvieno įrašymo – `md5sum` įrenginyje ir palyginti su šaltiniu.
- `html, body { overflow-x: clip }` – ne `hidden` (sulaužo sticky antraštę).
- ⚪ juosta: `background-color`, ne `background` (nutrintų dryžius); klasės `is-unrated`, `is-unrated-val`.
- `ct-dizainas.css` prijungtas PASKUTINIS prieš `</body>` (po jo `ct-priedai.css`, `ct-mygtukai.css`); `<style>` blokų yra ir po `</head>`.
- JS kabliai (`#dp-*`, `.dp-tab`, `#sort-select`) – vardus pridedam, senų nepervadinam.
- Python paieškoje įtraukos šablonas yra substringas – uždarymą rasti pagal balansą, ne tarpus.
- `.ct-std-card` senas `flex-wrap` (index 1343/1534/2173, ct-bendras) – laukia 46b; iki tol ct-priedai 17 blokas.

## Ištaisius – „Kur dar yra tas pats?"
Kiekvieną kartą ištaisius klaidą – ieškoti to paties rašto visame kode (visi puslapiai, `ct-bendras.css`, `compare.html` kopijos, JS injektuojami stiliai). Pavyzdžiai – `docs/pamokos.md` lentelė.

## Kodas
- `catch`, kuris tik `console.error`, nėra apsauga. Privalomas veiksmas (įrašymas į diską) nesėkmę rodo ten, kur žmogus žiūri.
- Failų rašymas – tik per dirty vėliavą / `cache.rasytiSaugiai` (atominis). Niekada viso failo cikle.
- Kreditų kainos – tik serveryje (`planai.js` `KAINOS`); `nurasyti`/`prideti` – `db.transaction()`. 5xx ir 410 grąžina kreditą.
- AI: `DEEP_INSTRUKCIJOS` su `cache_control` – nekeisti be reikalo. `TEKSTO_RIBA` 4 000, `DEEP_FOTO_KIEKIS` 6, podėlis 7 d.

## Produkto taisyklės
- Kaina lyginama **tik su PVM** („50 000 € + PVM" → `kaina` 60 500). `kainaBePvm` į medianą neįtraukiama.
- `diffPct` **teigiamas = pigiau** už rinką. Kortelėje rinka rodoma nuo 8 skelbimų (`CT_RINKOS_MIN`), mediana skaičiuojama nuo 5. `ZALOS_RIBA_PCT` 49 → „GALIMAI DAUŽTAS", balas ≤ 60.
- Vizualinis standartas: MATOME → APRAŠOME, ĮTARIAME → ĮSPĖJAME, NEŽINOME → NEIŠGALVOJAME. Draudžiami žodžiai tikrinami kode (`DRAUDZIAMA`). Trūkstamas rakursas balo nemažina.
- TA (data.gov.lt 2721) duomenys baigiasi **2025-05-28**, nors skelbiama „kas savaitę". Sąsajoje niekada „naujausi duomenys" – rodyti laikotarpį iš suvestinės `laikotarpis` lauko. Atnaujinimas – tik kai leidėjas atnaujins.
- Regitros punktai balo nekeičia. Svetimų VIN dekoderių automatiškai neskaitom (robots.txt).
- „Dingo iš portalo" – tik antrą kartą iš eilės nerastas, telpantis į filtrus, nenukirstoje paieškoje.

## Portalai (visi rikiuojami: naujausi viršuje)
- autoplius – ID per `autoplius-ids.js`, `order_by=3&order_direction=DESC`, 10 kr./psl.
- autogidas – markė/modelis tekstu, `f_50=naujausi_asc`, 10 kr./psl.; `data-updated` = ATNAUJINIMO laikas.
- autoscout24 – `sort=age&desc=1`, 1 kr. · otomoto – `created_at_first:desc`, PLN pagal ECB, 1 kr. · mobile.de – `sb=doc&od=down`, `dam=false`, riba 100 psl., 1 kr.
- Kiekvienas filtro parametras tikrinamas gyvai portale ir fiksuojamas `filtrai.test.js`. Kodai – `server.js` `KURO_FILTRAS`, `PAPILDOMI_FILTRAI`, `mobilede.js`.
- Atsargos grandinė: talpykla → ScraperAPI → axios → Puppeteer; statistika `GET /admin/atsarga`.

## Sargai
- Visi: `bash tools/sargai.sh` (migracija, sesija, mygtukai praleidžiami be aplinkos). Prieš kiekvieną commit'ą – žali.
- `python3 tools/tokenu-patikra.py` (4 kategorija – žinoma skola: negyvi `:root` blokai index/compare/ct-bendras).
- Ribos `dizainas.test.js` – tik mažėja; pakelti ribą = sąmoningas sprendimas žurnale.

## Klaidų būsenos (`/admin.html`, gyvena produkcijoje)
`rasta` → `patvirtinta` → `tvarkoma` → `laukia-patikros` (pastaba baigiasi „KĄ PATIKRINTI:") → Lukas Veikia/Neveikia. `laukia-sprendimo` (klausimas pastaboje), `laukia-dizainerio` (kurio paketo), `neaktualu` (kodėl). Keičiama `POST /admin/klaidos/:nr/busena`; push'as jų nekeičia.

## Struktūra
- `backend/server.js` (API, nuskaitymas, AI), `planai.js`, `auth.js`, `cache.js`, `rinka.js` (SQLite archyvas), `regitra.js`, `mobilede.js`, `otomoto.js`, `testai/`.
- `frontend/index.html` (monolitas), `detail.html`, `compare.html`, `megstamiausi.html`, `ataskaitos.html`, `admin.html` (generuojamas); `ct-dizainas.css`, `ct-mygtukai.css`, `ct-priedai.css`, `ct-bendras.css/js`, `versijos.js`.
- `pasikeitimai/` – BUSENA, LUKUI, ZURNALAS (+ `archyvas/`), TAISYKLES, `matavimai/`, `is-dizainerio/` (ne git'e).
- `tools/` – `sargai.sh`, `veidrodis-dizaineriui.ps1`, `mk-admin.py`, `onclick-patikra.py`, `tokenu-patikra.py`, `regitra-suvestine.py`, `klaidos.js`.
- `docs/` – `pamokos.md`, `gaires/` (auditų vadovai), revizijos, Regitros ir TA užduotys.
