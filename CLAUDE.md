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

## autogidas.lt (v1.28.0, patikrinta gyvai)

- Markė/modelis siunčiami **tekstu** (`f_1[0]=BMW&f_model_14[0]=X5`) – portalas juos priima, ID lentelės nereikia.
- Filtrai: `f_41/f_42` metai · `f_215/f_216` kaina · `f_65/f_66` rida · `f_10` dėžė · `f_2[N]` kuras · `f_46=Be defektų` · `ac_3` su VIN · `ac_4` tik Lietuvoje · `ac_5` slėpti iš aukcionų · `f_50=naujausi_asc` rikiavimas · `page=N`.
- Kortelė (`article.list-item-new`): `data-price` = kaina, `data-updated` = UNIX laikas (tikslesnis nei autoplius!), `.parameter-value` eilė (metai, kuras, rida, dėžė, „3.0 L, 190 kW“, „Plungė, Lietuva“), `.parameter-value.level .up` = **mokamo iškėlimo lygis 1–6**, `.vin-badge`, `.new-badge`/`.badge` su „Prieš N“, `.financing-price` = mėnesinė įmoka.
- **Svarbu:** prieš kainos sveikatos patikrą iš teksto pašalinamas „NN €/mėn.“ – kitaip kiekvienas pigus skelbimas atrodytų kaip lizingo įmoka.
- Testas: `node backend/testai/autogidas.test.js` (29 patikros su tikru puslapio HTML).

## AI sąnaudos (įeinantys tokenai – 96 % sąskaitos)

- `DEEP_INSTRUKCIJOS` – statinė promptų dalis su `cache_control: ephemeral`. **Nekeisti be reikalo**: kiekvienas pakeitimas panaikina podėlį.
- `TEKSTO_RIBA` (4 000 simb.) – žalio puslapio teksto riba; struktūriniai laukai eina pirmi, todėl daugiau nereikia.
- `ANALIZES_PODELIS_MS` (7 d.) – ta pati analizė negeneruojama iš naujo, nebent pasikeitė kaina (`analizesPodelis(url, kaina)`).
- Nuotraukos brangiausios (~1 400 tokenų viena): `DEEP_FOTO_KIEKIS` = 6.

## Apžvalgos lygiai ir kainos signalai

- Du lygiai: `lygis: 'greita'` (KAINOS.analize = 1 kr, be nuotraukų AI ir be vizualinio sluoksnio) ir `lygis: 'pilna'` (KAINOS.analizePilna = 2 kr, viskas). Podėlio raktas: `url` (pilna) ir `url#greita`. Turint pilną, greita grąžinama iš jos nemokamai.
- `ZALOS_RIBA_PCT` (49 %): kaina tiek žemiau medianos (kai `marketCount >= 5`) → `itariamaZala`, kortelėje „GALIMAI DAUŽTAS“, o balas ribojamas iki 60, kad toks skelbimas netaptų TOP rekomendacija. Formuluotė – įspėjimas su priežastimis, ne teiginys.

## Kaina ir PVM

- Vertinama ir lyginama **tik galutinė kaina su PVM**. Jei skelbime „50 000 € + PVM“ – `kaina` = 60 500 €, `kainaBaze` = 50 000 €, o vartotojui rodoma „50 000 € + PVM = 60 500 € (galutinė)“.
- Jei skelbime PVM neišskirtas – rodoma tiesiog suma, jokių prierašų.
- „Be PVM / Eksportui“ kaina (`kainaBePvm`) nėra ta, kurią mokėtų privatus pirkėjas – į medianą ir balus neįtraukiama.

## Vizualinis standartas (nuotraukų AI) – privaloma

> **MATOME → APRAŠOME. ĮTARIAME → ĮSPĖJAME. NEŽINOME → NEIŠGALVOJAME.**

- `backend/nuotrauku-analize.js` yra **įrodymų sluoksnis** (evidence layer), ne teisėjas: jis tik aprašo, kas matoma, su nuotraukos numeriu. Verdiktą daro gilioji analizė.
- Lygiai: `matoma` (🟢, privalo turėti nuotraukos numerį) · `galimas` (🟡, su `kodel_neaisku`) · trūkstamas rakursas = neįvertinta sritis.
- **Draudžiama** rašyti: „daužtas / nedaužtas“, „be avarijų“, „rida atsukta“, „variklis tvarkingas“, „originali / gamyklinė komplektacija“, „patvirtina / įrodo / garantuoja“. Tai tikrina `DRAUDZIAMA` sąrašas **kode**, ne tik promptas – radus, pastebėjimas nuleidžiamas į 🟡 ir teiginys iškerpamas.
- Du atskiri rodikliai: **Visual Condition** (būklė tik iš to, kas įvertinta) ir **Visual Confidence** (kiek apskritai galima įvertinti; skaičiuojama kode iš rakursų ir nuotraukų kokybės, niekada neklausiama modelio).
- Trūkstamas rakursas **nemažina** automobilio balo – jis virsta klausimu pardavėjui.
- Įranga: du nepriklausomi šaltiniai (nuotrauka + skelbimo sąrašas) = 🟢; vienas = 🟡 su prierašu, kad gamyklinė komplektacija nepatvirtinta.
- Gilioji analizė nuotraukų nebegauna – ji gauna `tekstasAnalizei()` rezultatą (`VIZUALUS_SLUOKSNIS=0` grąžina seną elgesį).

## Gamyklinė komplektacija (build sheet)

- `backend/komplektacija.js`: `dekoderisPagalVin()` – markės dekoderio nuoroda (BMW/MINI → mdecoder.com su tiesiogine nuoroda, Mercedes → mbdecoder.com, VAG → auto.vin PR kodai, Porsche/JLR → vinanalytics, kita → 7zap).
- **Svetimų dekoderių NESKAITOME automatiškai** – `mdecoder.com/robots.txt` draudžia `/decode/`, `bimmer.work` – `/query.php`. Vartotojas atidaro pats ir įklijuoja sąrašą į `/api/build-sheet` (nemokama, be AI).
- `sulyginti()` grąžina tris grupes: `patvirtinta` (gamykla + skelbimas), `tikGamykloje` (derybų argumentas), `tikSkelbime` (klausimas pardavėjui). Bazinė įranga (ABS, ESP, ISOFIX…) į `tikSkelbime` neįtraukiama, kad nebūtų triukšmo.
- Formuluotė visada atsargi: neteigiame, kad pardavėjas meluoja – pavadinimai gali skirtis arba įranga sumontuota vėliau.

## VIN

- `/api/vin-check` – **nemokamas**: `backend/vin-tikrinimas.js` (WMI, šalis, modelio metai, kontrolinis skaitmuo) + nemokama NHTSA vPIC + sutapimas su skelbimu + ar tą VIN jau matėme.
- `/api/vin-lookup` – mokamas (1 kr): AI web paieška aukcionų/žalų istorijai.

## Dizaino sistema (v1.29.0) – KUR IEŠKOTI, JEI KAS NORS ATRODO NE TAIP

- `frontend/ct-dizainas.css` – vienintelis tokenų + komponentų failas. Prijungtas **paskutine eilute prieš `</body>`** visuose penkiuose puslapiuose (ne `<head>`, nes `<style>` blokų yra ir po `</head>`: `index.html` 6346 eil., `compare.html` 1824 eil. – iš head jis pralaimėtų).
- **ATJUNGIMAS (jei po deploy kas nors sulūžo):** ištrinti `<link rel="stylesheet" href="ct-dizainas.css">` eilutę iš to puslapio. Jokie seni stiliai nebuvo pakeisti ar ištrinti, tad puslapis grįžta į v1.28.0 išvaizdą iškart.
- `index.html` `<style>` blokų tikroji eilės tvarka: `<style>` (9) → `cartriige-v2` (628) → `ct-mobile-responsive` (1358) → `ct-compare-redesign` (1576) → `ct-korteles-v3` (2017) → `ct-hist-redesign` (2155) → `ct-planai-css` (6346). **Mobilųjį bloką perrašo keturi blokai po jo** – neišspręsta skola.
- Septyni mirę `:root` blokai (`index.html` 11 + 634, `compare.html` 13 + 593, `ct-bendras.css` 1 + 68, `detail.html` 11) palikti sąmoningai – `ct-dizainas.css` eina paskutinis, tad jo tokenai laimi. Trinti atskiru pakeitimu.
- ⚪ „neįvertinta“ juosta veikia tik todėl, kad `index.html` (~5801 eil.) `subBarsHtml` išduoda klases `is-unrated` ir `is-unrated-val`, o fonas rašomas `background-color` (ne `background`, kuris nutrintų dryžius). **Nekeisti atgal į `background`.**
- `--text-dim` pašviesinta iki `#7E8699`; mono etiketės ne mažesnės nei 11 px.
- `html, body { overflow-x: clip }` – ne `hidden`: `hidden` padaro `body` slinkimo konteineriu ir sulaužo `position: sticky` antraštę.
- Negyvi selektoriai jo faile (`.dp-score-num`, `.dp-spec-v`, `.dp-tab-bar`) – tokių klasių pas mus nėra, nieko nedaro.

## Rezultatu kortele (v1.30.0)

- **Vienas generatorius** `ctKortele(c, x)` `index.html` viduje – jį naudoja ir TOP, ir eilutės, ir atmestos kortelės. Anksčiau buvo du atskiri ~60 eilučių `innerHTML` blokai su inline stiliais; jei reikia keisti kortelę, keičiama TIK šitoje funkcijoje.
- Išvaizda – `ct-dizainas.css` 10 skyrius. Struktūra ir klasės pagal dizainerio `KORTELE-SABLONAS.md`.
- **Ženklo taisyklė:** mūsų `diffPct` **teigiamas = pigiau** už rinką (dizainerio šablone buvo atvirkščiai). `CT_DIFF_ITARTINA = 30` → raudona „PIGIAU · ĮTARTINAI“; `> 0` → žalia; `<= 0` → geltona „BRANGIAU“. Backend'o `ZALOS_RIBA_PCT = 49` lieka atskiras – jis įjungia „GALIMAI DAUŽTAS“ bloką ir riboja balą iki 60. Du skaičiai, dvi skirtingos reikšmės – tyčia.
- Ribojimai kode: `whyReasons` → 3, ženkliukai pirmame lygyje → 6, medalis → tik 1–3 vieta.
- Trečias lygis atidaromas `window.ctToggleL3(cardId, btn)`, ne hover.
- **Senos kortelės CSS taisyklės atribotos:** `.card img` → `.card:not(.ct-card) img` (5 vietose). Jos nustatydavo `height: 158px`/`180px` ir traiškydavo naujas miniatiūras. Netrinti – jas dar naudoja senesni blokai.
- `.ct-card .fav-star.ct-fav` pakeista iš `position: static` į `absolute` (širdutė dabar nuotraukos kampe), `.ct-thumbs` gavo `align-items: start` (kitaip tinklelio eilutė išsitempia ir `aspect-ratio` nustoja galioti).

## ct-dizainas.css 12 skyrius (gynybinis) – VIENA PAKEISTA EILUTE

- Dizainerio 12 skyriuje yra `.ct-photo > :not(img):not(.ct-medal):not(.fav-star) { display: none !important }`. Ji paslepdavo **nuotrauku perjungimo rodykles `.ct-nav`** ir uzrasa `.ct-photo-empty`. Pridetos dvi isimtys – jei gausim nauja failo versija is dizainerio, **si pataisa turi buti pritaikyta is naujo** (ieskoti `ct-nav):not(.ct-photo-empty`).
- Likusios 12 skyriaus taisykles musu build'e nieko nekeicia (patikrinta: nuotrauka 250 px, balas 32 px, miniatiuros 58x44 buvo teisingi ir be ju) – jos paliktos kaip apsauga.

## Paieskos zurnalas (v1.31.0)

- `#log-container` antrasteje yra `#ct-log-nums` – ji uzpildo `window.ctLogSkaiciai(rasta, atitiko, perkope)`, kviečiama is `renderCards` kartu su `ctRezultatuSantrauka`. `.is-key` tik ant `perkope`; `.is-zero` kai jis 0 (nulis zaliai atrodo kaip pasiekimas).
- Baigus paieska (`jobStatus === 'done'`) zurnalas suskleidziamas automatiskai. Vykdant lieka atviras – tai pagrindinis ekranas 30–90 s.
- `#log-container[data-state="done"]` remelis pakeistas is `--success-border` i `--border`. Zalias remelis reiske pasiekima, nors ten – neatitike skelbimai.
- Stiliai: `ct-dizainas.css` 13 skyrius (`.ct-log*`). Irasu lygiai `.is-pass` / `.is-skip` / `.is-fail` CSS'e paruosti, bet `#log-box` eiluciu dar nezymim – tai kitas zingsnis.

## Kortelės smulkmenos (v1.31.1)

- `.ct-photo-n` – nuotrauku skaitiklis; elementas turi id `<cardId>-photocount`, ji atnaujina `cyclePhoto()`. Stilius pridetas i `ct-dizainas.css` **musu** (dizainerio faile jo dar nera) ir `.ct-photo-n` iraytas i `.ct-photo > :not(...)` isimtis – gavus nauja jo failo versija abi vietas reikia pritaikyti is naujo.
- `ctPirmasSakinys()` – kortelėje rodom tik pirma `analysis.verdiktas` sakini (visas lieka `title` atribute). Su trim sakiniais kortele nustodavo buti skaitoma per 5 s.
- Eilutės kortelėse (`restCands`) dabar irgi nustatoma `window.__galleryStore[cardId + '-strip']` – be jo rodykles nieko nedarydavo.

## DIZAINO TAISYKLES (privaloma, nuo v1.32.0)

**Nuosavybe.** `frontend/ct-dizainas.css` yra DIZAINERIO failas – **niekada jo neredaguojame**. Nauja versija idedama vienu perrasymu. Viskas, ko mums reikia papildomai, eina i `frontend/ct-priedai.css`, prijungta iskart po jo.

**Sesios taisykles naujam kodui:**

1. Spalva, sriftas, tarpas, radiusas – **tik per `var(--…)`**. Kietai irasyta reiksme naujame kode yra klaida.
2. Naujas tokenas apibreziamas **tik `ct-dizainas.css` `:root`** bloke. Reikia naujo – tai uzduotis dizaineriui, ne vietinis sprendimas.
3. `style="` leidziamas **tik isdestymui** (`display`, `width`, `grid-*`, `position`). Niekada spalvai, sriftui ar remeliui.
4. Naujas komponentas: pirma klase, tada CSS. Ne inline.
5. Ispejimu tekstai nekeiciami i kategoriskesnius (galioja nuo v1.24.0).
6. Neivertinta ⚪ niekada neatrodo kaip nulis ar klaida (galioja nuo v1.29.0).

**Sargas:** `node backend/testai/dizainas.test.js` – 24 patikros. Jis neleidzia skolai AUGTI: esamas palikimas uzfiksuotas kaip riba, testas krenta tik kai skaicius pakyla. Sutvarkius dali skolos – **nuleiskite riba faile**. Ribos kelimas = samoningas sprendimas.

**Specifika.** Dizainerio 12 skyrius turi placiu `!important` taisykliu. Jei musu elementas dingsta – pirma pasiziurekite ju, ne savo CSS. Atsvara rasoma `ct-priedai.css` su komentaru, kiek specifikos reikia ir kodel.

**Ko dar laukiame is dizainerio:** `.ct-btn > i` (mygtuku piktogramu plyteles), `.ct-photo-n` perėmimas i 10 skyriu, `.chip` taisykles (ju 10 skyriuje nera visai).

## Laikas rinkoje kortelėje (v1.33.0)

- `dienosRinkoje` – **skaicius**, skaiciuojamas `dienosNuo(l.ikeltaLaikas)` `server.js` (ne `ikeltaTekstas`, kuris yra tekstas „Pries 5 val.").
- `ctLaikoPunktas(c)` `index.html`: rodo TIK kai `<= 2` arba `>= 30` dienu. 3–29 d. intervalas nieko nesako, tad punkto nera.
- **Lygiai skiriasi samoningai:** sviezias → 🟡 `is-signal` (skuba yra SPEJIMAS apie kitu pirkeju elgesi); uzsibuves → 🟢 (`dienosRinkoje` + kainos pokytis yra DU patvirtinti faktai). Nekeisti svieziam i 🟢 – sistema imtu meluoti apie tai, ka zino.
- Punktas **uzima slota**, ne prisideda ketvirtas: `why = whyReasons.slice(0, laikas ? 2 : 3)`. Trys lieka trys.
- Atskira `.ct-istorija` juosta po kortele panaikinta – blokas dabar segamas i `.ct-l3` (trecia lygi). Pastabos apie kainos pokycius ir ta pati pardaveja islieka.

## Rinkos duomenu modulis

- Specifikacija: `docs/rinkos-duomenys.md`. **Perskaityti „Kas jau padaryta" pries imantis** – originale buvo Postgres schemos (mes naudojam SQLite) ir VIN tikrinimas, kuris padarytas dar v1.23.0.
- Regitros sandoriu duomenys (TPSAIS) **NETURI markes/modelio/metu** – patikrinta gyvai 2026-09-18. „Sandoriu per men." pagal modeli is atviru duomenu neimanoma.
- Parko duomenys turi `MARKE` ir `KOMERCINIS_PAV`, atnaujinami **kas ketvirti**. Imti tiesiai is `regitra.lt/wp-content/uploads/failai/Atviri_TP_parko_duomenys.zip` (data.gov.lt veidrodis pasenes nuo 2023 III ketv.).

## Rinkos imtis (v1.35.0)

- `CT_RINKOS_MIN = 8` (`index.html`): kortelėje `diffPct` ir rinkos vidurkis rodomi **tik nuo 8 panasiu skelbimu**. Maziau – ⚪ „N – per mazai" (dizainerio `is-unrated-val` busena).
- Medianai **skaiciuoti** riba serveryje lieka 5 – keiciasi tik atvaizdavimas. Skaiciavimai (balas, `itariamaZala`) nepaliesti.
- Priezastis: is 6–7 skelbimu pozicija ir procentas pasikeicia vien todel, kad vienas skelbimas dingo. Skaicius skamba tiksliau, nei yra.
- Ta pati riba galios ir „Rinkos pozicijos" skalei skelbimo puslapyje.

## MYGTUKAI (v1.36.0) – vienas komponentas

- `frontend/ct-mygtukai.css` – dizainerio failas, **prijungtas PASKUTINIS** (po `ct-priedai.css`). Jo neredaguojame.
- `frontend/ct-ikonos.html` – 14 piktogramų SVG sprite, iterptas i kiekvieno puslapio `<body>` pradzia. Iskvietimas: `<i><svg class="ct-i"><use href="#i-apzvalga"></use></svg></i>`.
- **Klases PRIDETOS, ne pakeistos:** `class="dp-tab ct-tab"`. Seni vardai yra JS selektoriai (`querySelectorAll('.dp-tab')`, `getElementById`) – ju perrasymas sulauzytu elgsena. Po valymo jie nebeturi isvaizdos deklaraciju.
- **Trys aukščiai, du radiusai, trys šriftai** – ir daugiau neturi atsirasti:
  `38px` iprastas · `46px` `.ct-btn-lg` ir `.ct-tab` · `32px` `.ct-btn-sm` ir `.ct-seg` · `56/64px` **tik** `@media (max-width: 640px)`.
- **Sargas:** `node backend/testai/mygtukai.test.js` – matuoja visus matomus mygtukus penkiuose puslapiuose (reikia veikiančio peržiūros serverio). Skirtukai (`.ct-tab`) skaičiuojami atskirai – ju `border-radius: 0` nera nukrypimas.
- **Tikroji būklė (išmatuota v1.40.0): 166 mygtukai, 28 nukrypimai.** „0 nukrypimu" galiojo tik iki v1.36.1 atstatymo – tada grįžo senos vietinės taisyklės, o rankinis valymas dar nepadarytas. Likusi skola, šešios taisyklės:
  `ataskaitos.html` plikas `button` ir `.on` (`r=8px`) · `detail.html` `.dp-pr-btn`, `.dp-analize-greita`, `.dp-analize-cta` (`r=8/9px`, `f=12/13px`) · `.ct-meg-btn.yra` (`h=42/36px`, `f=13.33px`, `megstami-meniu.js`) · `.ct-btn-sm` (`h=34px`, `r=9px`) · `.ct3-premium-btn` telefone (`h=34px`, `f=12px`) · `.ct-ver-btn` telefone (`f=8px`, `versijos.js`).
- **Valymas tik rankomis, po vieną taisyklę.** `dizaino-juodrasciai/valyti-mygtukus.py` sugadino CSS v1.36.0 (regex per visą HTML nukirsdavo kaimynines taisykles) – jo nebenaudojame.
- Rodykle `.ct-btn-go` tik tada, kai po paspaudimo zmogus **atsiduria kitur**. `⇄ Palyginti` jos neturi. `.is-ready` busena: zenklelis dingsta, rodykle atsiranda.
- Naujas mygtukas = `ct-btn` + variantas + forma. **Jokiu vietiniu `height`/`border-radius`/`font-size`** – tai buvo priezastis, del kurios ju buvo ~40 skirtingu.
- `megstami-meniu.js`, `paskyra-meniu.js`, `versijos.js` injektuoja `<style>` su `document.head.appendChild()`. **`head.prepend()` bandytas v1.36.0 ir atmestas v1.37.0** – tie failai injektuoja visą komponento CSS, ne tik mygtukų, tad perkėlus į pradžią sugriuvo meniu. **Laikinas sprendimas**; galutinis – isvaizdos deklaracijas is tu failu istrinti.

## Veiksmų eilė telefone (v1.40.0)

- 390 px kortelėje apačioje: CTA per visą plotį viršuje, po juo **44 px** „Skelbimas", platus „Ženkliukai, įranga, vieta" ir **44 px** „Palyginti".
- Siaurieji (`.ct-btn-tight`) telefone numeta antraštę ir palieka piktogramą – tam reikia, kad tekstas būtų apvyniotas `<span>`.
- **Kodėl `ct-priedai.css` 4 blokas:** `ct-mygtukai.css` 420 eil. `.ct-actions > .ct-btn:not(.ct-btn-primary)` (0,3,0) nugali 423 eil. `.ct-actions > .ct-btn-tight` (0,2,0), tad 44 px niekada nepasiekdavo mygtuko, o platusis likdavo 124 px prie 147 px antraštės – tekstas užlipdavo ant kaimyno. Mūsų atsvara – ta pati taisyklė (0,4,0).
- **Ištrinti mūsų bloką**, kai dizaineris savo 420 eilutėje prašys `:not(.ct-btn-tight)`.

## Akcento šeima (v1.45.0)

- **Akcento šeimoje gali būti keli, pirminis – vienas.** `.ct-btn-primary` = pilnas akcentas; `.ct-btn-accent` = akcento rėmelis ir `--accent-dim` fonas.
- **„Pirminis – vienas per ekraną" taikoma SPRENDIMO paviršiui, ne langui.** Antraštė yra chrome – ji ta pati visuose penkiuose puslapiuose ir nekonkuruoja su „ką man daryti šiame puslapyje".
- **Bet `Pro · 13 kr` vis tiek nusileidžia:** jis ir `Pilna apžvalga · 2 kr` yra tos pačios rūšies veiksmai – abu prašo pinigų. Du violetiniai pirkimo mygtukai viename ekrane konkuruoja, ir pralaimi tas, kurio žmogui reikia dabar. Plius nuolat matomas pirminis tampa baldu.
- `ct3-premium-btn` visuose keturiuose puslapiuose: `ct-btn ct-btn-sm ct-btn-accent`.

## Akcentas ir žinojimo lygiai skelbimo puslapyje (v1.44.0)

- **Pirminis mygtukas puslapyje yra `Pilna apžvalga · 2 kr`.** `Žiūrėti skelbimą` buvo violetinis – vienintelis mygtukas, kuris IŠVEDA žmogų iš produkto, atrodė kaip pagrindinis veiksmas. Dabar jis antrinis su rodykle (`ct-btn ct-btn-go`), tekstas „Skelbimas" kaip visur.
- **`.dp-analize-greita` ir `.dp-analize-cta` – `.ct-btn` komponentas** su `<u>1 kr</u>` / `<u>2 kr</u>`. `\.dp-cta button` išvaizdos deklaracijos ištrintos: mygtukų skola 28 → 24.
- **Mėlyna varnelė (#5b8af5) ištrinta.** Paletėje tos spalvos nėra, ir ji skaitoma kaip socialinių tinklų „verifikuota". Patvirtintą faktą visame produkte žymi žalia (`--k-confirmed`), piešia `ct-dizainas.css` 19b.
- **„duomenys bus po analizės" = ⚪**, ne pilkas tekstas. Klasė `.dp-seller-pending`, tašką piešia 19b.
- **`is-destructive`** ant `.at-del-top` ir `.mg-del-top`: 19 sk. duoda paviršių ant `hover`/`focus-visible` ir raudoną tik tada, kai žmogus jau taiko. Tylus variantas be rėmelio lieka – rėmelis naikinančiam veiksmui duotų svorio, kurio jis neturi turėti.
- **`detail.html` neprijungia `ct-bendras.js`,** tad `ctEsc` ten apibrėžtas vietoje (šalia `fmt()`). Be jo viršaus blokas nutrūkdavo su „ctEsc is not defined".

## Skelbimo puslapis – galerija ir skydelis (v1.48.0, DALIS 2)

- `.dp-virsus` = `.dp-gallery` (`.dp-stage` + `.dp-strip`) šalia `.dp-panel`. Pardavėjo kortelė laikinai nužemyn (`.dp-main-sell`) – ji yra 3 dalies darbas.
- **ID palikti seni** (`dp-main-img`, `dp-thumbs`, `dp-photo-count`, `dp-nav-l/r`), pakeistos tik klasės. Ta pati taktika kaip su mygtukais: pridedam vardą, nelaužom JS kabliuko.
- **Juosta rodo VISAS nuotraukas** ir slenka; aktyvi gauna `.dp-thumb-active` **ir** `.is-active`. Buvo penkios su „+N" perdanga – šeštos nepamatydavai neatidaręs lightbox'o, o pastebėjimo taškams nelikdavo vietos.
- **Pastebėjimo taškai** (`.dp-thumb > i`) iš `vizualus.pastebejimai`; `nuotrauka` laukas skaičiuojamas **nuo 1**. Spalva ta pati kaip sąraše: `matoma` → `--k-confirmed`, `galimas` → `--k-signal`.
- **Greita vs pilna:** `window.__dpViz` nustatomas `load()` pradžioje, PRIEŠ piešiant. Greitu lygiu – 3 patikrinimo punktai plius ⚪ eilutė „dar N punktai / atsiveria su pilna apžvalga", CTA yra `Pilna apžvalga` + `<u>2 kr</u>`. Pilnu – visi punktai, CTA `Atsisiųsti PDF` su rodykle.

**RADINYS, ištaisytas čia:** `detail.html` turėjo SAVĄ `ctScore()`, kuri visai nežiūrėjo į `qualityScore` / `baloKomponentai` ir skaičiavo balą sena formule. Tas pats automobilis kortelėje rodė **7.8**, o skelbimo puslapyje **5.8**. Tai tiksliai ta pati klaida, kuri kortelėje jau buvo rasta ir ištaisyta („kortele rodydavo du skirtingus CarTriige skaicius") – tik čia liko. **Kur dar yra tas pats?** – klausimas, kurį verta užduoti kiekvieną kartą.

## Skelbimo puslapio viršus (v1.43.0, DETAIL-SABLONAS.md DALIS 1)

- Struktura: `.dp-crumbs` → `.dp-hero` (kairėje `.dp-hero-l` pavadinimas + `.dp-meta` + `.dp-chips`, dešinėje `.dp-hero-r` `.dp-price-row` + `.ct-market`) → rizikos juosta → `.dp-main`.
- **Vidurinio `.dp-info` stulpelio nebėra** – jo turinys perkeltas į `.dp-hero`. `.dp-main` dabar dviejų stulpelių: galerija + pardavėjas.
- **Kaina dešinėje, ne po pavadinimu:** šį puslapį atveria žmogus, kuris kortelėje kainą jau matė. Dešinysis stulpelis leidžia patvirtinti skaičių neperskaičius pavadinimo.
- **`diffPct` ženklas – MūSŲ konvencija:** teigiamas = pigiau už rinką. Dizainerio šablone atvirkščiai; ribos tos pačios kaip kortelėje (`>= 30` → `is-bad`, `> 0` → `is-good`, kitaip `is-warn`).
- **`marketCount < 8`:** `PANAŠIŲ SKELBIMŲ` rodo „– per mažai duomenų" su `.is-unrated-val`, o skirtumo blokas nerodomas VISAI. Aštuonių skelbimų vidurkis nėra rinkos duomenys.
- **`.ct-risk` virš viso turinio**, po `.dp-hero`, prieš galeriją – ne skirtuke.
- Seni `#dp-subtitle`, `#dp-market-row`, `#dp-specs`, `#dp-tags`, `addSpec()` nebenaudojami; jų CSS liko, ištrinti kartu su 2 dalimi.
- **DALIS 2 ir 3 dar nepadarytos:** galerija, įverčio skydelis, skirtukai, rinkos pozicijos skalė, pardavėjo kortelė.

## Mygtukų žodynas penkiuose puslapiuose (v1.42.0)

- **Tvarka fiksuota, sudėtis ne:** `[išorinė nuoroda] [išskleidimas] [palyginimas] ⟵tarpas⟶ [pirminis]`. Kiekvienas puslapis rodo tą poaibį, kuris jam turi prasmę, bet niekada nekeičia eilės ir niekada nepervadina to paties veiksmo.
- **Tas pats veiksmas visur vadinasi vienodai.** „Detali apžvalga →" mėgstamiausiuose ir „Pilna apžvalga · 2 kr" kortelėje buvo tas pats veiksmas dviem vardais – blogiau nei skirtingi dydžiai, nes žmogus nežino, ar tai tas pats dalykas.
- **Naikinantis veiksmas NIEKADA nestovi veiksmų eilėje.** Eilės gale jis atsidurtų prie pirminio mygtuko – prie to, į kurį žmogus taiko. Vieta: kortelės dešinysis viršus (`.at-del-top`, `.mg-del-top`), tylus ikoninis mygtukas su `#i-pasalinti`.
- **`#i-pasalinti` yra kryželis, ne šiukšlinė.** Šiukšlinė reikštų „ištrinti duomenis", o skelbimas tik nuimamas nuo sąrašo.
- **Padaryta:** `index` (Skelbimas · Daugiau N · Palyginti · Pilna apžvalga 2 kr) · `ataskaitos` (Atidaryti, be rodyklės) · `megstamiausi` (Skelbimas · Pilna apžvalga 2 kr) · palyginimo lentelės stulpelis (Skelbimas · Pašalinti).
- **Neturi `.ct-actions`:** `detail.html` (laukia perdarymo pagal `DETAIL-SABLONAS.md`; `dp-bc-btn` yra ANTRAŠTĖS veiksmai, jiems eilės taisyklės netaikomos) ir `compare.html` (gilios ataskaitos puslapis, ne sąrašas).
- **Mėgstamiausiuose nėra „Daugiau" ir „Palyginti"** – ten nėra trečiojo lygio ir nėra palyginimo mechanizmo. Dizainerio lentelė juos numato; reikia atsakymo, ar kurti.
- `ct-priedai.css` 4 blokas ištrintas: dizaineris įrašė `:not(.ct-btn-tight)` į savo 420 eilutę.

## Dizainerio 16–18f skyriai (v1.41.0)

- `ct-dizainas.css` pakeistas visas. Diff patikrintas prieš diegiant: **grynai papildomas**, +214 eilutės, nieko neištrinta. `ct-mygtukai.css` ir `ct-ikonos.html` atsiųsti nepakitę – jų nekeitėm.
- **16 sk.** dedamųjų juostos, miniatiūrų `alt` tekstas, širdutė. **17 sk.** telefone balas lieka, dedamosios į trečią lygį – tai PAKEIČIA mūsų `ct-priedai.css` 3 bloką (ištrintas). **18a–18f** kaina balta, verdiktas sakinio raide, `.ct-l2` ir `.ct-market` be dėžučių, kortelės tinklelis per visą plotį.
- **Keturi mygtukai** pagal `ct-mygtukai-snippet.html`: `Skelbimas` (siauras, rodyklė) · `Daugiau` + skaičius (išskleidžia) · `Palyginti` (siauras) · `Pilna apžvalga` + `2 kr` (pirminis).
- `ctToggleL3` keičia **tik `<span>` tekstą**. Buvęs `btn.textContent = ...` ištrindavo piktogramos plytelę ir ženklelį – mygtukas po pirmo paspaudimo nustodavo atitikti sistemą.
- **Trūksta `#i-zenkliukai`:** dizainerio `PERDUOTI-CLAUDE.md` §4 jo reikalauja, bet jo `ct-ikonos.html` faile tik 14 simbolių. Laikinai įdėjom savo žymės piktogramą į visus penkis puslapius – pakeisti, kai atsiųs savo.
- **Verdikto raidė:** backend siunčia `LABAI VERTA ANALIZUOTI`. Serveryje nekeičiam – `_sakinys()` mažina tik piešiant ir tik tada, kai visa vertė didžiosiomis.
- **Patikra (jo §5):** `node scratchpad/testas/sablonas.js` prie veikiančio peržiūros serverio. `index.html` grąžina `auksciai: [38]`, `rodykles: 1`, `zenkleliai: 2`, `pirminiai: 1`, `ikonos: 4`.
- **Dar nepadaryta:** `detail.html`, `compare.html`, `ataskaitos.html`, `megstamiausi.html` neturi `.ct-actions` bloko išvis – ten savi mygtukai (`mg-btn`, `at-btn`, `dp-bc-btn`). Vienodinimas reikalauja produkto sprendimo, ne CSS.
- **Rožinė (#ff5c8a) liko** `detail.html` (3 vietos), `megstamiausi.html`, `megstami-meniu.js` (4 vietos), `paskyra-meniu.js`. Kortelėje jos nebėra.

## Modelio filtro saugiklis (v1.39.0)

- Struktūriškai nuskaitant (`format === 'parsed'`) modelio tekstinis filtras NETAIKOMAS – pasitikima portalo URL. Taip specialiai, kad „Mercedes-Benz C 220" nebūtų išmestas ieškant „c klase".
- **Bet** jei daugiau nei **33 %** portalo grąžintų skelbimų neturi prašyto modelio, filtras portale nesuveikė: tada tekstinis filtras įjungiamas ir į žurnalą rašoma, kuris portalas suklydo.
- Priežastys, dėl kurių URL gali nebenešti modelio: pasenusi `autoplius-ids.js` lentelė `/data` Volume (atnaujinama kas 30 d.), pakeistas portalo parametras, tuščias `filters.modelis`.
- Patikrinta gyvai 2026-09-18: `f_model_14[0]=X4` (autogidas) ir `make_id[97]=22769` (autoplius) abu grąžina tik X4. Vadinasi lūžis buvo ne URL formoje.

## Atsarginiai nuskaitymo keliai ir jų matavimas (v1.47.0)

Grandinė `fetchSearchPage`: **talpykla → ScraperAPI → tiesioginis axios → Puppeteer**.
`fetchListingPage`: **talpykla → ScraperAPI `render=false` → ScraperAPI `render=true` → Puppeteer → `fetchSearchPage`**.

- Puppeteer pasiekiamas TIK kai nepavyko ir mokamas proxy, ir tiesioginis kreipimasis. Jo vertingumas – kitas tinklo kelias (Railway savo IP), ne kitas renderinimas.
- **Statistika: `GET /admin/atsarga`** (tik adminui, nemokama, be jokio išorinio kvietimo). Rodo, kuris šaltinis davė HTML, kiek kartų Puppeteer buvo pasiektas, kiek kartų pavyko, ir konkrečias klaidas. Skaitliukai atmintyje – po perkrovimo iš nulio.
- **Sprendimas priimamas iš to skaičiaus, ne iš nuomonės:** `pasiektas: 0` → Puppeteerį galima išimti be jokio praradimo. `pavyko: 0` prie `pasiektas > 0` → jis tik verčia vieną klaidą kita, išimti irgi. `pavyko > 0` → atsarginis kelias realiai veikia, tada tik atnaujinti iki v25 (`npm audit fix --force`).
- Konteineryje be Chromium klaida yra `Could not find Chrome (ver. ...)` – tai ir yra ta „viena klaida vietoj kitos".

**ŽINOMA SPRAGA, netaisyta sąmoningai iki matavimo pabaigos:** `fetchListingPage` paskutinė atsarga (`fetchSearchPage`) pasiekiama tik tada, kai Puppeteer grąžina tuščią reikšmę. Kai jis **meta klaidą** – o konteineryje be Chromium jis visada meta – klaida keliauja aukščiau ir paskutinė atsarga niekada nesuveikia.

## „Kur dar yra tas pats?" – trys kartai iš eilės

Ši praktika per vieną dieną rado tris klaidas, kurių nerado joks kitas būdas:

| Kas | Rasta ištaisyta vienoje vietoje | Liko kitoje |
|---|---|---|
| Sinchroninis viso failo įrašymas cikle | `setCached` (v1.36) | `saveListingTimeline` – ištaisyta v1.46.0 |
| Neribotas augimas | `cache.json` `pages` | `lifecycle` + `timeline` – v1.46.0 |
| Rožinė #ff5c8a | taisyta 4 kartus | **22 vietose** – v1.44.0 |
| Du skirtingi įverčiai | kortelė (komentaras kode!) | `detail.html` `ctScore` – v1.48.0 |
| `diffPct` ženklas | kortelė ir `.dp-hero` | `detail.html` rinkos skiltis – v1.52.0 |
| Python heredoc ėda `\` | `.join('\\n')` davė tikrą naujos eilutės simbolį | `\\'` atribute – ta pati klaida po 10 min, v1.54.0 |
| Tylus `try/catch` slepia klaidą | `fetchListingPage` atsarginis kelias nepasiekiamas | `fs` neįreikalautas `server.js` – 7 vietos tyliai nieko nedarė, v1.60.0 |
| Bendras klasės vardas | `.ct-table` – `<table>` ir `<div>` sąrašas | `.ct-kv` – eilutė ir jos konteineris, v1.56.0 |
| Inline `style=""` nugali dizainerio failą | `#more-filters` vidinis `<div>` – 30 sk. `.ct3-more-row` nieko nedarė | pats `#more-filters` – 30 sk. `.ct-shell-side #more-filters` irgi nieko nedarė, v1.75.0 |
| Pilno pločio triukas siaurame stulpelyje | `.ct3-search-panel` full-bleed (`ct-priedai.css` 7 blokas) | `.ct3-search-inner` `padding: 0 48px` – 23 % iš 276 px stulpelio, v1.75.0 |
| `onclick` kviecia funkcija, kurios nera | – | `dpTab` dingo per v1.43.0 perdarymus; septyni skirtukai `detail.html` tyliai metė `ReferenceError`, o skydeliai buvo pildomi ir niekada nerodomi. Patikrinta visuose 6 puslapiuose (`tools/onclick-patikra.py`) – daugiau nėra, v1.76.0 |
| `height` pralaimi pries `min-height` | `.ct3-hero` 620 px, nors 26 sk. duoda 220 | `.ct-tab` `min-height: 44px` ant 12-ojo langelio mygtuko - 30 vs 44 px. **0 px slinkimo nereiskia, kad dydis teisingas**: matuoti ir pati dydi, ne tik ar telpa, v1.86.0 |
| Taisymas nepasiekė visų kopijų | `Nr. 39` – piktogramos įdėtos tik į `ct-ikonos.html`, o kiekvienas puslapis neša savo rinkinio kopiją | `Nr. 30` – `v1.66.0` nuėmė `ct-btn-sm` nuo avataro, bet ne `index.html`: 32x32 vs 38x38 `detail.html`. **Kai tas pats elementas yra keliuose puslapiuose, matas turi būti PALYGINIMAS, ne absoliutus skaičius** – 32 px mygtukas yra visiškai tvarkingas mygtukas, tik ne tas. Nei srautas, nei JS klaidos to nerodo, v1.93.0 |
| Nulinis matmuo yra matmuo | `A-33` `scrollWidth` nepaauga apkirptam `<select>`; `Z-42` „13 px" reiškė tik „elementas yra" | `Z-45` – šone `#marke` ir `#modelis` buvo **0 x 40 px**, o `elementFromPoint` jų centre grąžino tėvą: ne siauri, o nepaspaudžiami. `sideScrollH` 484, `hSrautas` 0, JS klaidų 0 – visos lemputės žalios, du filtrai nematomi. **Matuoti ne tik ar telpa, bet ir AR YRA**: kiekvienam valdikliui plotis > 0, `elementFromPoint` grąžina jį patį, ir `scrollWidth <= clientWidth` su įrašyta reikšme, v1.94.0 |
| Stendas perrašo tai, ką testas nustatė | `Z-42` atlasas piešė piktogramas savo keliu, tad rodė jas gyvas tuo metu, kai produkte buvo tuščia | `Z-47` – `?demo=1` įrašo `ct_token='demo'` ir perrašė testo įdėtą „blogą" žetoną: trys sesijos scenarijai iš tiesų tikrino tą patį gerą žetoną tris kartus. Atrodė, kad naujas modulis neveikia. **Prieš tikint testo rezultatu – patikrinti, ar stendas nenustatė sąlygos už tave**, v1.96.0 |
| `scrollWidth > clientWidth` ant `overflow: visible` | `A-33` `scrollWidth` nepaauga apkirptam `<select>` | `Z-50` – statistikos juostoje po 34 paketo sąlyga galiojo 10 elementų vietoj 4, ir jau rašiau „pablogėjo". Patikrinus: `overflow` ten `visible`, aukščiai nepakitę, **už juostos neišeina niekas**. Matas buvo teisingas, tik atsakė į kitą klausimą. **Prieš vadinant tai klaida – patikrinti, ar elementas tikrai apkerpa** (`overflow` ≠ `visible`) ir ar kas nors išeina už tėvo, v1.99.0 |
| Pasikartojanti atsvara = trūkstamas skyrius | – | `Z-50` – `ct-priedai.css` 13 ir 14 blokai rašė tą patį trejetą (`overflow/text-overflow/white-space`) dviem vardais, nes sistemoje nebuvo vienaeilio apkarpymo. Trūkstamo dalyko neranda joks skriptas – tikrinti nėra ko. **Antrą kartą rašant tą patį į `ct-priedai.css` – neberašyti, o klausti dizainerio, ar tam neturi būti klasės**, v1.99.0 |
| Įtraukos šablonas yra substringas | – | Python'e ieškant `'        </div>'` (8 tarpai) radau `'          </div>'` (10 tarpų) vidurį – `#more-filters` užsidarė per anksti. Akimis nesimatė (skydelis `display:none`), pagavo matavimas: šonas 540 → 944 px. Uždarymą rasti pagal eilutės pradžią arba balansą, v1.77.0 |

**`onclick` klaida yra TYLI.** Atributas nieko nesako, kol nepaspaudi; paspaudus `ReferenceError` nukrenta į konsolę, kurios niekas nežiūri. Naudotojui atrodo, kad mygtukas tiesiog negyvas – Lukas tai aprašė kaip „paspaudžiu, niekas nesikeičia“ (Nr. 20). Todėl po kiekvieno didesnio perdarymo: `cd frontend && python3 ../tools/onclick-patikra.py`.

**Penktoji forma – buvo teisinga, kol aplinka buvo kitokia.** Pirmos keturios (negyvas tokenas, negyva klasė, gyvas vardas be aprašymo, `onclick` be funkcijos) buvo klaidingos visą laiką ir laukė, kol kas nors pažiūrės. `GALIA` vidinis `div` buvo teisingas, kol `.ct-fld` neperėmė lauko. **Negyvus randam klausdami „kas dar to nenaudoja“; šituos – tik klausdami „kas rėmėsi tuo, ką ką tik pakeičiau“.** Po kiekvieno skyriaus, kuris PERIMA elementą iš kito valdymo, peržiūrėti ne naują kodą, o seną, kuris tam elementui tarnavo.

**Taisyklė: kai kas nors ištaisoma, iškart paieškoti to paties raginio visame kode.** Dizainerio klausimas prieš 3 dalį („skalė greičiausiai turi savo medianą") pasitvirtino ne visai taip, kaip jis spėjo – mediana ta pati, bet **ženklas priešingas**: tas pats automobilis viršuje rodė „−12 %" žaliai, o rinkos skiltyje „+12 %" raudonai.

## Administravimo puslapis (v1.53.0, lentelės v1.54.0)

- `frontend/admin.html` – trys skiltys: **Klaidos**, **Matavimai** (`/admin/atsarga`), **Vartotojai**. Atidaromas tiesiogiai adresu, antraštėje nuorodos nėra sąmoningai.
- **Generuojamas, ne rašomas ranka:** `tools/mk-admin.py` paima sprite’ą ir antraštę iš `ataskaitos.html` ir įdeda į šabloną. Taip piktogramos ir antraštė lieka TIE PATYS, o ne kopija, kuri nudreifuos. Pakeitus – paleisti iš naujo iš `frontend/`.
- **Nieko naujo dizaine:** `.ct-tab`, `.ct-flag[role=radio]`, `.ct-btn`, `.ct-k`, `.chip`. Savas CSS tik išdėstymui (`.ad-*`).
- **Būsena perjungiama paspaudimu** – `.ct-flag` eilė po kiekvienu įrašu; `laukia-patikros` įrašas gauna akcento foną ir keliamas į viršų.
- **Trynimas klausia** (`confirm`) ir stovi dešiniajame viršuje, ne veiksmų eilėje – ta pati taisyklė kaip ataskaitose.
- **Duomenų lentelė (dizainerio 22 sk., v1.54.0):** `.ct-table.is-dense` – ta pati sistema kaip visur, tik tankiau. Būsena eilutėje yra `.ct-k` žinojimo lygis, ne atskira spalvų gama.
- **Skubi eilutė gauna liniją kairėje** (`.is-urgent`), NE raudoną foną: raudonas fonas sąraše rėkia ir tada, kai skubių yra pusė. Uždarytos eilutės prigesinamos (`.is-done`), ne slepiamos.
- **Eilutė išsiskleidžia** (`.ad-detales`) – diagnostika ir būsenų mygtukai po ja, ne atskirame lange. Vienu metu atidaryta viena.
- **Trys tuščios būsenos, ne viena:** `is-never` (dar nieko nebuvo – paaiškina, kaip atsiras), `is-good` (nėra ką taisyti – žalias ženklas), `is-filtered` (yra, bet paslėpta filtro – su mygtuku „Rodyti visas"). Viena bendra „Nieko nerasta" meluoja dviem atvejais iš trijų.
- **`display` ant elemento, kurio vaidmenį nustato tėvas (v1.54.0):** dizainerio apibendrinimas, tikslesnis už mano pirminę diagnozę – lūžo ne todėl, kad tai lentelė, o todėl, kad `display` buvo uždėtas ant `<td>`, kurio `display` priklauso tėvui. Ant flex vaiko būtų tas pats. `.ct-summary` (`ct-dizainas.css` 798 eil.) turi tą patį bloką, bet ten `<div>`, kurio `display` iš išorės niekas nenustato – todėl nelūžta.
- **Kaip tai atrodė (v1.54.0):** 22 sk. `.ct-table .is-text` uždėjo `display: -webkit-box` pačiam langeliui – jis nustojo tempti iki eilutės aukščio ir apatinis rėmelis nusipiešė 12 px aukščiau už kaimynų (matuota: apačios 467/467/**455**/467/467/467). Apkarpymas priklauso VIDINIAM `<span class="ct-clamp">`; perkėlus – 0 px. Atsvara `ct-priedai.css` 6 bloke.
- **`.ct-table` vardas dubliuojasi:** `index.html` ir `compare.html` jau turi savo vietinį `.ct-table` – tai NE lentelė, o `<div>` raktas/reikšmė sąrašas. Šiandien nekenkia (iš 22 sk. jiems taikosi tik `width:100%` ir `font-size`, abu inertiški), bet pridėjus `.is-time` ar `display:table` į bet kurią pusę – lūš. Tikrinta: tų klasių ten nėra nė vienos.
- **Generatoriaus spąstai:** `tools/mk-admin.py` šablonas yra Python trigubų kabučių eilutė, todėl JS viduje **negalima** nei `\n`, nei `\'` – abu virsta tikru simboliu ir sulaužo JS. Vietoj jų: `String.fromCharCode(10)` ir `&quot;` HTML esybė atributuose. Abi klaidos jau buvo padarytos – po kiekvieno generavimo `node --check` ištrauktam `<script>`.

## Klaidų pranešimai (v1.49.0)

- `frontend/klaidu-pranesimas.js`, prijungtas **anksti** (iš karto po sprite’o `<body>` pradžioje) visuose penkiuose puslapiuose – kitaip nespėtų pagauti klaidų, įvykusių kraunantis.
- Renka automatiškai: versiją, ekrano plotį ir tankį, naršyklę, planą ir kreditų likutį, **paskutines 20 JS klaidų** (`error` + `unhandledrejection`) ir **nepavykusias užklausas** į `/api|/auth|/admin` (`fetch` apvalkalas).
- **PRIVATUMAS:** į žurnalą raso `localStorage` RAKTŲ VARDUS, ne reikšmes. Žetonas ir el. paštas ten nepatenka – patikrinta testu (`arYraZetonasReiksme: false`).
- `POST /api/klaida` – **be autentifikacijos sąmoningai**: dažniausia vieta, kur reikia pranešti, yra pats prisijungimas. Vietoj to: **5 pranešimai per 10 min iš IP**, tekstas iki 2000 simbolių, nuotrauka iki 1,5 MB. Jei žetonas galioja – įrašom, kas pranešė.
- **Kūno riba yra maršruto, ne globali (v1.54.0):** `app.use(express.json())` be ribos reiškia 100 kB, ir nuotrauka grąžindavo 413 „Užklausa per didelė". Sprendimas – `app.use('/api/klaida', express.json({ limit: '6mb' }))` **PRIEŠ** globalų: `body-parser` nustato `req._body`, tad pirmas nugali. Naršyklėje nuotrauka dar ir sumažinama iki 1600 tšk. JPEG 0.78 (nepavykus – 0.55).
- **Ribos nuo pirmos dienos:** `/data/klaidu-zurnalas.json` laiko 200 naujausių; nuotraukos – atskirais failais `/data/klaidu-foto/`, trinamos kartu su įrašu. Į JSON nuotraukos NEDĖTI – žurnalas išsipustų.
- **Kas pranešime, išskyrus tekstą (v1.50.0):** `kategorija` (dizainas / negyvas / duomenys / kreditai / greitis / prisijungimas), `svarba` (blokuoja / trukdo / smulkme), `kartojasi`, `turejoRodyti` (tik prie „duomenys"), ir **`diagnostika.veiksmai`** – paskutiniai 12 paspaudimų su selektoriumi ir tekstu. Pastarasis yra vertingiausias: puslapyje 63 mygtukai, ir be jo „paspaudžiau, nieko neįvyko" yra neatsakomas.
- **Skaitymas:** `GET /admin/klaidos` rodo **tik nesutvarkytas**, surūkiuotas pagal svarbą. `?visi=1` – ir sutvarkytas, `?trumpai=1` – be diagnostikos, `?kategorija=` / `?svarba=` – filtrai. `GET /admin/klaidos/:nr/foto` – nuotrauka.
- **Būsenos (v1.51.0)** – kiekviena atsako, KIENO dabar ėjimas:

  | Būsena | Reikšmė | Ėjimas |
  |---|---|---|
  | `rasta` | pranešta, dar nežiūrėta | Claude |
  | `patvirtinta` | atkartota, matau tą patį | Claude |
  | `nepasitvirtino` | neatsikartoja arba jau buvo ištaisyta | uždaryta |
  | `tvarkoma` | dirbama | Claude |
  | `laukia-patikros` | pataisyta ir išleista | **Lukas** |
  | `sutvarkyta` | patvirtinta produkcijoje | uždaryta |
  | `atideta` | tikra, bet ne dabar | Claude |

- **Kodėl ne dvi:** iš šešių dizainerio radinių **penki nepasitvirtino** – jie jau buvo sutvarkyti. Tokio radinio nei ištrinsi (pamirši, kad buvo tikrintas), nei pažymėsi sutvarkytu (melas). Ir „pataisyta" NEREIŠKIA „veikia produkcijoje" – todėl `laukia-patikros` iš sąrašo nedingsta, kol Lukas nepatvirtina.
- **Keitimas:** `POST /admin/klaidos/:nr/busena` su `{ busena, pastaba, versija }`. Kiekvienas perjungimas įrašomas į `istorija` (kas, kada, versija, pastaba) – matosi visas kelias, ne tik galutinė buklė. Būtent to trūko, kai dizaineris klausė, ar jo radinys jau padarytas.
- **`DELETE /admin/klaidos/:nr`** – visiškas ištrynimas su nuotrauka. Sutvarkytos dingsta pačios, tad trinti reikia tik testinius įrašus.

## Tylus `try/catch` (v1.60.0) – brangiausia dienos pamoka

`server.js` **niekada neturėjo `require('fs')`**, nors `fs` naudojamas 7 vietose. Visos septynios apgaubtos `try/catch`, tad serveris nelūžo – jis TYLIAI nieko nedarė: klaidų žurnalas nebuvo rašomas į diską, nuotraukos neišsaugotos, katalogas nesukurtas. Keturi vartotojo pranešimai gyveno tik atmintyje ir dingo per pirmą perkrovimą.

- Klaida matėsi tik Railway žurnale: `[KLAIDOS] nepavyko issaugoti: fs is not defined`. Niekas jo neskaitė, nes niekas neturėjo priežasties.
- **Taisyklė: `catch`, kuris tik `console.error`, yra ne apsauga, o užmaskavimas.** Jei veiksmas privalo pavykti (įrašymas į diską), nesėkmė turi būti matoma TEN, kur žmogus žiūri – ne žurnale.
- Todėl `/admin/atsarga` dabar grąžina `saugykla`: katalogą, jo šaltinį, ar jis persistentinis, ar failas egzistuoja, jo dydį ir kiek įrašų atmintyje. Neatitikimas tarp `klaiduAtmintyje` ir `klaiduFailoDydis` iškart matomas.
- Patikrinta: po pataisymo failas 345 B, nuotrauka `k1.jpg`, 0 įrašymo klaidų, ir įrašas **išgyvena perkrovimą**.

## Klaidų sąrašas be naršyklės (v1.55.0)

Pranešimo mygtukas buvo pusiau bevertis, kol sąrašą matė tik žmogus: per ekranvaizdį keliauja tekstas, o dingsta būtent tai, dėl ko visa tai daryta – selektoriai, nepavykusios užklausos ir paspaudimų seka.

- **`KLAIDU_RAKTAS`** – tik Railway Variables ir vietinis `backend/.env`, **niekada į kodą ar GitHub**. Antraštė `X-Klaidu-Raktas`, niekada ne adreso parametras (patektų į serverio žurnalus).
- **Numatytoji būklė – išjungta:** nenustatytas arba trumpesnis nei 32 simboliai raktas reiškia, kad antraštė nepriimama visai, o į žurnalą rašomas įspėjimas. Palyginimas – `crypto.timingSafeEqual`, prieš tai patikrinus ilgį.
- **Ką raktas atrakina:** `GET /admin/klaidos`, `POST .../busena`, `POST .../sutvarkyta`, `GET .../foto`, `GET /admin/atsarga`. **Ko ne:** `DELETE` (negrįžtama, tad tik žmogus su žetonu), `/admin/vartotojai`, `/admin/planas`, `/admin/kreditai`.
- **Istorijoje matosi, kas keitė:** raktu padarytas įrašas gauna `kas: 'raktas'`, ne žmogaus el. paštą.
- **`/admin.html?tekstas=1` – rodinys „Viskas tekstu" (v1.57.0).** Visi pranešimai su visa diagnostika viename `<pre>`. Tai PAGRINDINIS kelias Claude'ui: `*.up.railway.app` nėra nei debesies konteinerio, nei įrenginio apvalkalo leidžiamų domenų sąraše (patikrinta: npm ir GitHub 200, Railway 000), o individualiose paskyrose to sąrašo keisti negalima. Todėl produkciją pasiekia tik naršyklė.
- **Naršyklės polangis prisijungia vieną kartą** ir sesija išlieka tarp pokalbių – nuo tada sąrašą atidaro pats Claude, be rakto ir be komandų.
- **`tools/klaidos.js`** – paleidžiama Luko kompiuteryje, skaito `backend/.env`. `node tools/klaidos.js` (atviros), `<nr>` (viena su visa diagnostika), `<nr> <busena> [pastaba]`, `--visi`, `--atsarga`. Raktas niekada nespausdinamas.
- Patikrinta: be antraštės 401, su blogu raktu 401, su trumpu raktu 401, trynimas raktu 401, `/admin/vartotojai` raktu 401, teisingas raktas 200.

## Duomenų sluoksnis (v1.46.0)

- **Trys JSON failai `/data`:** `market-history.json` (1000 įrašų modeliui), `listing-lifecycle.json`, `listing-timeline.json` (60 momentinių vaizdų URL'ui). Visi pilnai įkeliami į atmintį paleidžiant.
- **Valymas:** `cache.valytiSenusIrasus()` – paleidžiant ir kas parą. Trina TIK tuos, kurie **ir** pažymėti `dingo`, **ir** nematyti ilgiau nei `VALYMO_DIENOS` (180 pagal nutylėjimą). Gyvas skelbimas neliečiamas, kad ir koks senas – jo kainos istorija yra produktas. Timeline be gyvavimo ciklo trinamas kaip našta be prasmės.
- **Rašymas į diską – TIK per dirty vėliavą.** `saveListingTimeline()` be argumento tik pažymi, `saveLifecycle()` įrašo abu. Niekada nekvieskite įrašymo cikle: iki v1.46.0 `recordListingSnapshot` perrašinėjo VISĄ failą kiekvienam skelbimui – 80 sinchroninių įrašymų per paiešką, per kuriuos Node neatsakinėjo į nieko. **Ta pati klaida jau buvo `setCached` ir jau buvo taisyta ten** – tik ne čia.
- **Kai taisote tokią klaidą, iškart klauskite: kur dar yra tas pats?** Sinchroninis įrašymas cikle buvo dviejose vietose, neribotas augimas – trijose, rožinė spalva – 22-ose.

## Kreditai (v1.46.0)

- Kainos gyvena TIK serveryje (`planai.js` `KAINOS`), maršrutas pats pasako veiksmo pavadinimą. Klientas kiekio nesiunčia ir paveikti negali.
- `nurasyti` ir `prideti` apvilkti **`db.transaction()`**. Iki v1.46.0 jie veikė teisingai tik todėl, kad tarp skaitymo ir rašymo nėra `await` – neapgalvota apsauga, kurią būtų sulaužęs bet kas, įdėjęs ten logą į išorinę sistemą.
- **Išbandyta:** 5 kreditai → −2 (plano pirma) → tas pats URL per 24 val. nemokamas → −2 → 402 be balanso pokycio. 5xx atsakymas grąžina kreditą (`vin` / `vin-grazinta` žurnale).


## Saugumas

- `ANTHROPIC_API_KEY`, `SCRAPER_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`, `INVITE_CODES`, `KLAIDU_RAKTAS` – tik Railway Variables, **niekada į kodą ar GitHub**.
- `backend/.env` – niekada į GitHub.
- `git push origin main` vykdo **tik Lukas** PowerShell'e; Claude niekada nepushina.
- Windows PowerShell: `&&` neveikia – git komandos rašomos atskiromis eilutėmis.

## Darbo eiga

- Prieš rašant į įrenginį – Playwright regresija (web 1400 px ir tel 390 px), 0 JS klaidų.
- Į įrenginį rašoma per naują `/mnt/user-data/outputs/vN/` kelią, po įrašymo tikrinamas md5.
- **Jokios `git` komandos iš `device_bash`** – ji sukuria `.git/index.lock`, kurio tas pats apvalkalas negali ištrinti. `git` vykdo TIK Lukas PowerShell'e, atskiromis eilutėmis (`&&` neveikia).
- `git push origin main` vykdo **tik Lukas**. Claude niekada nepushina.
- Serveryje niekada nekviesti mokamų maršrutų (analyze, vin, seller, compare) testavimui – tik GET.

## Bendras kanalas su dizaineriu (v1.54.0)

Dviejų Claude sesijų susirašinėjimas gyvena `pasikeitimai/`, ne pokalbyje.
Lukas nieko neperrašinėja ir nesiunčia failų – kiekvienas skaito iš ten, kur kitas baigė.

- **Pirmas veiksmas kiekvienoje sesijoje:** `pasikeitimai/BUSENA.md` (kieno ėjimas), tada `pasikeitimai/ZURNALAS.md` nuo paskutinio savo įrašo.
- `TAISYKLES.md` – protokolas. `DIZAINERIUI.md` – dizainerio pradžios puslapis: kurie failai jo, kurie ne, kur atkeliauja jo paketai (`is-dizainerio/`), kaip dingsta atsvaros.
- `ZURNALAS.md` **tik pildomas į galą**. Klausimas `K-nn`, atsakymas `A-nn`, būsenos tik trys: `LAUKIA ATSAKYMO`, `UŽDARYTA`, `ATIDĖTA`.
- `matavimai/` – ekranvaizdžiai ir skaičiai, į kuriuos rodo žurnalo įrašai.
- Nebeklausti Luko „ką perduoti dizaineriui?" – **įrašas žurnale ir yra perdavimas.**

## Klaidų sąrašas – UŽDUOTYS, ne tik sąrašas (v1.77.0)

**Kaskart, kai nuskaitau klaidų sąrašą, tuo pačiu žingsniu padarau iš jo užduotis.**
Skaitymas be to yra pusė darbo: sąrašas pasako, kas blogai, bet nepasako, kas ką
daro toliau.

**Trys žingsniai, visada kartu:**

1. **Klasifikuoti kiekvieną atvirą pranešimą į tris krūvas** – **mano** (galiu
   ištaisyti pats), **dizainerio** (reikia jo skyriaus sprendimo), **Luko**
   (reikia jo sprendimo, sumos, nuotraukos ar patikros). Nesprendžiu už
   dizainerį jo skyriuose ir už Luką – jo produkte.

2. **Sugrupuoti pagal šaknines priežastis, ne po vieną.** Trys pranešimai apie
   tą patį elementą yra vienas klausimas, ne trys. Z-19 pavyzdys: keturi
   pločio pranešimai buvo viena `max-width` eilutė.

3. **Parašyti į `pasikeitimai/UZDUOTYS-DIZAINERIUI.md`** – perrašoma VISA iš
   sąrašo, niekada iš atminties (ta pati taisyklė kaip `BUSENA.md`). Kiekviena
   eilutė turi: **Nr. · ką parašė Lukas · elemento selektorių · ką jau
   pamatavau · ko iš jo reikia.** Pranešimas be matavimo yra nuomonė; su
   matavimu – užduotis. Jei matavimo nėra – pamatuoti PRIEŠ rašant, arba
   atvirai parašyti „nepamatuota, galiu".

**Ir Lukui pasakoma tuo pačiu atsakymu:** kiek naujų pranešimų, kiek kuriai
krūvai, ką imu pirma, ir kas laukia jo sprendimo. Ne „atnaujinau būsenas",
o skaičiai ir vardai.

**Kodėl tai ne biurokratija:** dizaineris klaidų sąrašo nemato – jis mato tik
tai, ką parašau į kanalą. Iki v1.77.0 jo pranešimai pas jį keliaudavo po vieną
ir tik tada, kai kažkas užkliūdavo; dėl to jis dirbo prie `D-03`, kurio ekranas
nuo v1.43.0 apskritai nebuvo rodomas.

## Po kiekvienos versijos – KLAIDŲ BŪSENOS (v1.69.0)

Versijos pakėlimas ir klaidų būsenos yra **vienas veiksmas, ne du**. Jei
versija pakelta, o būsenos ne, sąrašas meluoja: pranešimas atrodo atviras,
nors jau ištaisytas, ir kitą kartą prie jo grįžama be reikalo.

**Taisyklė: pakėlus versiją, tuoj pat pereinama per atvirus pranešimus ir:**

1. ką ši versija ištaiso → `laukia-patikros`, su pastaba ir versijos numeriu;
2. kas pasirodė neatkartojamas → `nepasitvirtino`, su paaiškinimu kodėl;
3. kas laukia dizainerio → `atideta`, nurodant, kurio paketo;
4. kas pradėtas → `tvarkoma`.

**Kiekviena `laukia-patikros` pastaba baigiasi eilute `KA PATIKRINTI:`** –
konkrečiai, ka Lukas turi pažiūrėti, kur ir kokiame plotyje. „Ar veikia" nėra
užduotis. Jei reikia jo pagalbos ar gilesnio patikrinimo (duomenų, kurių nematau,
konkretaus skelbimo, tikro įrenginio) – tai pasakoma toje pačioje pastaboje,
o ne tik pokalbyje, nes pokalbis dingsta, o pastaba lieka prie pranešimo.

**Ir Lukui atsakyme parodoma suvestinė** – kiek kurioje būsenoje ir kurie
numeriai laukia jo patikros. Push'inėdamas jis turi matyti ne tik versiją, bet
ir kur esame kartu.

Būsenos gyvena produkcijoje, ne repozitorijoje, tad jos keiciamos per
`/admin.html` arba `POST /admin/klaidos/:nr/busena` – push'as ju NEPAKEICIA.

## Zurnale parašyta – Lukui PASAKOMA (v1.65.0)

Kanalas `pasikeitimai/` yra **traukiamas, ne stumiamas**: dizaineris pranešimo
negauna. Jis skaito `BUSENA.md` ir `ZURNALAS.md` tik pradėdamas sesiją. Vadinasi,
įrašas žurnale pats savaime jo nepasiekia.

**Taisyklė: kaskart, kai į `ZURNALAS.md` arba `BUSENA.md` įrašomas naujas
dalykas, atsakymo pabaigoje Lukui pasakoma atskira eilute:**

> **Parašykit dizaineriui: „Patikrink žurnalą".**

Ne užuomina, ne „jis perskaitys" – tiesioginis nurodymas, ką padaryti dabar.
Be jo klausimas gali gulėti žurnale valandą, o abu laukia vienas kito.

Jei įrašo nebuvo – tos eilutės nerašom, kad ji neprarastų reikšmės.

## Dizaino sprendimas klausiamas IŠKART (v1.54.0)

Jei pakeitimas reikalauja dizaino sprendimo – naujos spalvos, naujo vardo, naujo komponento, pasirinkimo tarp dviejų išvaizdų – nespėliojam ir neatidedam. Tą pačią akimirką:

1. **Klausimas `K-nn` žurnale** – vienas sakinys, į kurį galima atsakyti taip/ne arba vienu vardu.
2. **Matavimas arba ekranvaizdis** į `pasikeitimai/matavimai/` – dizaineris turi gauti įrodymą, ne prašymą „pažiūrėk".
3. **Jei darbas negali sustoti** – laikina atsvara `ct-priedai.css` su `ATŠAUKIMAS: ištrinti, kai dizaineris perims`, ir tai pasakoma žurnale. Atsvara niekada nekeliauja į dizainerio failus.

Klausimas paruošiamas KARTU su darbu, ne po jo. Taip dizaineris niekada nelaukia, kol kas nors prisimins paklausti.

## Struktūra

- `backend/server.js` – Express API, scraping, AI; `planai.js` – planai/kreditai; `vartotojo-duomenys.js` – mėgstamiausi/ataskaitos; `auth.js` – JWT; `cache.js` – podėlis.
- `pasikeitimai/` – bendras kanalas su dizaineriu: `BUSENA.md`, `ZURNALAS.md`, `TAISYKLES.md`, `DIZAINERIUI.md`, `matavimai/`, `is-dizainerio/`.
- `tools/mk-admin.py` – generuoja `frontend/admin.html`. Paleidžiama iš `frontend/`.
- `frontend/index.html` – pagrindinis (monolitas); `detail.html`, `compare.html`, `megstamiausi.html`, `ataskaitos.html`; bendri `ct-bendras.css/js`, `versijos.js` (versijų istorija), `megstami-meniu.js` (širdutė antraštėje su mėgstamiausių sąrašu), `paskyra-meniu.js` (paskyros meniu po profilio mygtuku), `klaidu-pranesimas.js` (klaidų pranešimo mygtukas), `admin.html` (generuojamas).

## Auditų gairės (v1.94.0)

Produkto taisyklės gyvena šiame faile. **Kaip jas patikrinti – `docs/gaires/`:**

- `docs/gaires/PRADEK-CIA.md` – auditų vadovas ir paleidimo eilutė
- `docs/gaires/KODAVIMAS.md` – kaip rašomas naujas kodas (back + front)
- `docs/gaires/AUDITAS-DIZAINAS.md` – tokenai, šriftai, mygtukai, dubliavimasis tarp 6 puslapių
- `docs/gaires/AUDITAS-SESIJOS.md` – prisijungimas, žetonai, „Prisiminti mane", automatinis atjungimas
- `docs/gaires/AUDITAS-SAUGUMAS.md` – OWASP patikros, pritaikytos šiai sandarai

**Penktas sargas:** `python3 tools/tokenu-patikra.py` – sulūžę tokenų ryšiai, negyvi ir dubliuoti tokenai, **skirtingos reikšmės tam pačiam tokenui**. Krenta, kai yra 1 arba 4 kategorijos radinių.

Paskutinė revizija: `docs/revizija-2026-09-20.md` (21 radinys: 2 kritiniai, 9 rimti, 10 smulkių).
