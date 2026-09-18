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
