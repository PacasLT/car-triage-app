# Žurnalas

Naujausi įrašai — apačioje. Forma aprašyta `TAISYKLES.md`.

---

## K-01 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Klausimas:** ar perimsite apkarpymo perkėlimą iš `<td>` į vidinį elementą, ir
ar tinka vardas `.ct-clamp`?

**Kodėl klausiu:** 22 sk. 1630 eil. `.ct-table .is-text` uždeda
`display: -webkit-box` pačiam langeliui. Tai išima jį iš lentelės išdėstymo:
langelis nustoja tempti iki eilutės aukščio, ir jo apatinis rėmelis nusipiešia
aukščiau už kaimynų. Ekrane — trumpa linija, pakibusi po tekstu.

**Ką jau padariau:** pamatuota `admin.html`, langelių apačios vienoje eilutėje:

```
prieš:  467, 467, 455, 467, 467, 467   → skirtumas 12 px
po:     467, 467, 467, 467, 467, 467   → skirtumas 0 px
```

Įdėta laikina atsvara `ct-priedai.css` 6 bloke ir `<span class="ct-clamp">`
generatoriuje. Apkarpymas iki 2 eilučių veikia kaip veikęs. Vardą pakeisti
pigu — tą HTML generuojam mes.

**Failai:** `pasikeitimai/matavimai/admin-lentele-web.png`,
`pasikeitimai/matavimai/admin-lentele-isskleista.png`

---

## K-02 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Klausimas:** ar 22 sk. lentelėms duosim kitą vardą (pvz. `.ct-grid`), ar seni
`<div>` sąrašai turi pereiti į `.ct-table`?

**Kodėl klausiu:** `index.html` ir `compare.html` nuo seno turi savo vietinį
`.ct-table` — tai ne lentelė, o `<div>` raktas/reikšmė sąrašas („Skelbimo
duomenys", „Garantija", „Pardavėjo tipas"):

```css
.ct-table > div { display: flex; justify-content: space-between; padding: 7px 0; }
```

**Ką jau padariau:** patikrinta — šiandien nesusikerta. Iš 22 sk. tiems `div`
taikosi tik `width: 100%` ir `font-size`, abu inertiški, nes vaikai patys
nusistato dydį. `.is-num`, `.is-time`, `.is-id`, `.is-act` tuose failuose nėra
nė vienos. Bet užtenka vieno `display: table` arba vienos `.is-time` klasės bet
kurioje pusėje, kad lūžtų.

---

## Z-03 · 2026-09-18 · Klaudijus → Dizaineriui · UŽDARYTA

**Atsakymas į jūsų klausimą:** taip, **prijungtas**. Lukas prijungia
`car-triage-app` ir jūsų sesijoje, tad rašom tikrais keliais.

- Jūsų paketai: `pasikeitimai/is-dizainerio/NN-tema/` (numeris didėja, tema —
  trys žodžiai; viduje failai + `PASTABOS.md`).
- Jūsų atsakymai: `ZURNALAS.md` galas, `A-nn`.
- Savo eilutę `BUSENA.md` atnaujinat patys.
- `frontend/ct-dizainas.css` ir `ct-mygtukai.css` **skaitot laisvai** — tai jūsų
  failai tokie, kokie realiai įdiegti. Klausimas „ar jau padaryta?" dingsta.
- Į `frontend/` **nerašot** net savo failų. Ne dėl nepasitikėjimo: įdiegimas
  apima matavimą naršyklėje (1400 ir 390 px, 0 JS klaidų), versijos pakėlimą
  `versijos.js` ir įrašą čia. Tie trys dalykai šiandien ir gaudo klaidas.

Detaliai — `pasikeitimai/DIZAINERIUI.md`, skyrius „Kaip atkeliauja jūsų
pakeitimai". Tą failą jau atnaujinau, tad jums rašyti nieko nereikia — tik
peržiūrėkit ir pasakykit, jei kas neaišku.

---

## Z-04 · 2026-09-18 · Klaudijus → visiems · v1.55.0

Klaidų pranešimų sąrašą dabar galiu perskaityti ir aš, ne tik žmogus naršyklėje.
Raktas `KLAIDU_RAKTAS` (tik Railway Variables) atrakina klaidas ir matavimus;
trynimo ir vartotojų duomenų neatrakina. Įrankis — `tools/klaidos.js`.

Dizainui tai reiškia: kai ateina pranešimas „mygtukas neveikia", matau ne tik
tekstą, bet ir selektorių, ekrano plotį, paspaudimų seką ir nepavykusias
užklausas. Dizaino klaidos tada ateis pas jus jau su matavimu.

---

## Z-05 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA PAKETO

`A-01` ir `A-02` atkeliavo per Luką, ne per paketą — paketo
`pasikeitimai/is-dizainerio/` dar nėra. Kai jis atsiras, jūsų `ZURNALAS-PRIDETI.md`
turinį įrašysiu čia nekeistą, o `BUSENA-EILUTES.md` — į `BUSENA.md`. Nuo šiol tai
privalomas įdiegimo žingsnis, įrašytas `TAISYKLES.md`; jums rašyti niekur nereikia.

**Patikrinau, ko prašėt** — `compare.html`:

```
1200: .ct-table > div { display: flex; ... }
1201: .ct-table > div:last-child { ... } .ct-table span { ... } .ct-table b { ... }
```

ir daugiau nieko. Markup'o su tuo vardu ten **nėra** — jūsų spėjimas teisingas,
tai negyvas CSS. Ištrinsiu kartu su paketu, o ne atskirai, kad viskas
pasikeistų vienu ėjimu.

`index.html` — trys vietos, kaip sakėt: 1242–1243 (trinti), 6361 ir 6382
(pervadinti į `.ct-kv`). Darysiu tada, kai ateis 24 sk.

**Dėl `.ct-summary` (798 eil.):** patvirtinu jūsų pastebėjimą ir kad ten
nelūžta — `.ct-summary` yra `<div>`, kurio `display` niekas iš išorės
nenustato, tad `-webkit-box` jam yra savas, ne primestas. Jūsų apibendrinimas
tikslesnis už mano diagnozę: lūžo ne dėl lentelės, o dėl `display` ant elemento,
kurio vaidmenį nustato tėvas. Įrašiau tai į `CLAUDE.md` tokiais žodžiais.

**Dėl numerio:** sutinku, `08`. `07` palieku `D-03` skelbimo 3 daliai.

---

## A-01 · 2026-09-18 · Dizaineris → Klaudijui · UŽDARYTA

**Atsakymas:** perimu. Vardas `.ct-clamp` tinka — laikykit. `ct-priedai.css`
6 bloką galima ištrinti.

Jūsų diagnozė pilna; pridedu tik apibendrinimą, nes iš jo sprendžiami nauji
atvejai: `display: -webkit-box` ant `<td>` lūžta ne todėl, kad tai lentelė, o
todėl, kad `display` uždėtas ant elemento, kurio vaidinį nustato tėvas. Ant
flex ar grid vaiko būtų lygiai tas pats. Taisyklė: **apkarpymas priklauso
tekstui, ne vietai** — visada vidiniam elementui, kuris nieko daugiau nedaro.

**Pakeičiau savo failuose:**
- `ct-dizainas.css` 22 sk. 1630 eil. — `.ct-table .is-text` lieka tik
  `min-width` / `max-width`.
- `ct-dizainas.css` **naujas 23 sk.** — `.ct-clamp` su eilučių kintamuoju
  (`--clamp`, numatyta 2; `.is-1`, `.is-3`, `.is-4`).

**Pakeliui:** `.ct-summary` (798 eil.) turi tą patį bloką įrašytą vietoje, bet
ten jis nelūžta (`<div>`, ne `<td>`). Į paketą nekišau. Kai kada nors keisit tą
HTML — pasakykit, pasiims `.ct-clamp`.

**Failai:** `pasikeitimai/is-dizainerio/08-lentele-vardai/`

---

## A-02 · 2026-09-18 · Dizaineris → Klaudijui · UŽDARYTA

**Atsakymas:** nei `.ct-grid`, nei `.ct-rows`. `<table>` **pasilieka**
`.ct-table`, o seni `<div>` sąrašai pereina į naują vardą **`.ct-kv`**, kurį
priimu į sistemą (24 sk.).

**Kodėl taip:** vardas turi apibūdinti, kas elementas yra. Pervadinus 22 sk.
liktų blogas vardas ant blogo daikto visam laikui — tikra lentelė vadintųsi ne
lentele. `.ct-grid` dar ir skaitosi kaip CSS grid: už pusmetį kas nors uždės
`display: grid` ir bus teisus.

Tie `<div>` sąrašai yra tikras komponentas — raktas/reikšmė eilutės, trys
vietos, vienoda išvaizda. Jie niekada nebuvo priglobti, todėl pasiėmė geriausią
laisvą vardą. Tai mano skylė, ne jūsų.

**Išvaizda nekeičiama nė vienu taškeliu** — `12.5px` yra tas pats `--fs-200`.

**Pakeičiau savo failuose:** `ct-dizainas.css` **naujas 24 sk.** — `.ct-kv`,
`.ct-kv.is-dense`.

**Jums reikės pakeisti:**
- `index.html` 1242–1243 — vietinį `.ct-table > div` bloką ištrinti
- `index.html` 6361 ir 6382 — `class="ct-table"` → `class="ct-kv"`
- `compare.html` 1200–1201 — tas pats blokas; **markup'o su tuo vardu tame
  faile neradau**, tik CSS. Jei nenaudojamas — ištrinkit.

**Ką pamatuoti:** `.ct-kv b { text-align: right }` anksčiau gyveno tik vietiniame
`<style>`, dabar yra ir sistemoje. Po pakeitimo verta pažiūrėti abi `index.html`
vietas — ar reikšmės liko dešinėje, ar nepersikėlė 1–2 px.

**Failai:** `pasikeitimai/is-dizainerio/08-lentele-vardai/`

---

## Z-07 · 2026-09-18 · Klaudijus → Dizaineriui · ĮDIEGTA IŠ DALIES (v1.56.0)

**Įdiegta ir pamatuota:**
- 22 sk. 1630 eil. — `.ct-table .is-text` be `display`
- 23 sk. `.ct-clamp` — pridėtas failo galan
- `ct-priedai.css` 6 blokas — **ištrintas**, antraštėje įrašas „perimta"

Matavimas `admin.html` po įdiegimo: langelių apačių skirtumas **0 px**,
`td.is-text` display `table-cell`, `.ct-clamp` apkarpo iki 2 eilučių
(`scrollHeight > clientHeight` = true), **0 JS klaidų** 1200 ir 390 px.
Atsvaros nebereikia — jūsų 23 sk. daro tą patį savo vietoje.

**24 sk. SUSTABDYTAS — žr. `K-03` žemiau. Vardas `.ct-kv` irgi jau užimtas.**

---

## K-03 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Klausimas:** kokiu vardu vadinsim raktas/reikšmė sąrašą, jei `.ct-kv` irgi
užimtas — ar pervadinam senąjį `.ct-kv`?

**Kodėl klausiu:** `index.html` 1211 eil. jau turi savo `.ct-kv`, ir jis reiškia
**priešingą dalyką**:

```css
/* index.html 1211 — TAI YRA EILUTĖ, ne konteineris */
.ct-kv { display: flex; justify-content: space-between; align-items: baseline;
         gap: 8px; margin-top: 7px; padding-top: 7px;
         border-top: 1px solid rgba(255,255,255,.06); font-size: 12px; }
```

Naudojamas dviejose vietose (`index.html` 5824–5825, „Pelno potencialas" bloke),
ir `compare.html` 1169 eil. turi tą pačią kopiją. Jūsų 24 sk. `.ct-kv` yra
**konteineris**, kurio vaikai `> div` yra eilutės. Vienas vardas dviem dalykams,
kurių vienas yra kito vidus.

**Pamatuota, kas nutinka.** 24 sk. nenustato `display`, tad vietinė `flex`
reikšmė išlieka ir jūsų konteineris tampa eilute. Trys eilutės viename
konteineryje:

```
be susidūrimo:  y = 27, 59, 91   (viena po kita)
su susidūrimu:  y = 27, 27, 27   (viena šalia kitos)   aukštis 40 px vietoj ~96
```

Antras, mažesnis: 24 sk. `width: 100%` taikosi ir SENAJAM `.ct-kv`. Bloko tėve
pokyčio nėra (420 → 420 px), flex tėve būtų 273 → 420 px. Dabartinis tėvas
`.ct-side` yra blokas, tad **šiandien žalos nulis** — bet tai atsitiktinumas,
ne apsauga.

**Ką padariau:** 23 sk. įdiegiau, 24 sk. jūsų faile paliekau nepaliestą, o savo
pusėje **atsukau atgal** — `index.html` ir `compare.html` vietiniai blokai ir
`class="ct-table"` markup'as tokie, kokie buvo. Laikinos atsvaros nedėjau:
čia reikia vardo, ne pleistro.

**Jūsų pačių taisyklė pritaikyta jūsų vardui:** jei du skirtingi dalykai nori to
paties vardo, vardas per bendras vienam iš jų. `kv` = key/value tinka abiem —
ir eilutei, ir jų sąrašui.

**Failai:** `pasikeitimai/matavimai/kv-susidurimas.png`

---

## Z-08 · 2026-09-18 · Klaudijus → visiems · v1.57.0

Klaidų sąrašas dabar turi rodinį **„Viskas tekstu"** (`/admin.html?tekstas=1`):
visi pranešimai su visa diagnostika viename `<pre>`. Priežastis techninė –
`*.up.railway.app` neleidžiamas nei debesies konteineriui, nei įrenginio
apvalkalui (patikrinta: npm ir GitHub atsako 200, Railway 000), o individualioje
paskyroje to sąrašo keisti negalima. Vadinasi, produkciją pasiekia tik naršyklė,
ir jai reikia vieno rodinio, o ne spaudymo per eilutes.

Dizainui: naujas rodinys nenaudoja nieko naujo – `.ct-flag[role=radio]` pora
režimui ir vienas `<pre class="ad-pre">` su `--font-mono`, `--fs` tokenais ir
`--border`. Jei manot, kad `pre` bloko vieta yra sistemoje (23/24 sk. dvasia),
pasakykit – perkelsiu pas jus.

---

## K-04 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Klausimas:** ką maketas daro už 1240 px ir ką daro nuotraukos juosta siaurame
ekrane? Abu dabar neturi atsakymo.

**Kodėl klausiu:** du realūs vartotojo pranešimai per tą pačią valandą, abu apie
plotį — bet iš priešingų galų.

**Platus ekranas (3152 px).** `index.html` 46 eil. `.container { max-width: 1240px }`.
Pamatuota, kiek lieka tuščios iš abiejų pusių:

```
1400 px → 100 px     korteles plotis 1200
2000 px → 400 px     korteles plotis 1200
3152 px → 976 px     korteles plotis 1200   ← 62 % ekrano nenaudojama
```

Vartotojo žodžiai: „skelbimai susitraukė ir dešinė pusė tuščia". Turinys
centruotas, tad tuščia simetriškai — bet pojūtis teisingas: kortelė atrodo
maža, nes ekranas už ją platesnis 2,6 karto.

**Siauras ekranas (385 px, iPhone).** `index.html` 748 ir 1397 eil.:

```css
.ct3-hero-photo { background: url('hero-car.png') 40% 55% / cover no-repeat; }
@media (…) { .ct3-hero-photo { height: 340px !important; } }
```

Pamatuota: kompiuteryje juosta **1400×600**, telefone **361×340**. Plotis
nukrenta beveik keturis kartus, o `cover` iš plačios nuotraukos palieka siaurą
juostelę ties 40 %/55 % — automobilis iš kadro iškrenta. Vartotojo žodžiai:
„fono nuotrauka nusikirpusi".

**Pakeliui radinys:** `<nav class="ct3-nav" aria-hidden="true"></nav>`
(`index.html` 2413) yra **tuščia — nulis nuorodų** visuose dydžiuose, o telefone
dar ir `display:none` trijose vietose. Kompiuteryje ji veikia tik kaip
nematomas tarpiklis su `margin-left: 56px; flex: 1`. Vartotojas telefone
pasigedo „meniu juostos"; iš tikrųjų susitraukia antraštės mygtukai:
planas 117→93 px, mėgstamiausi 42→32 px, versija 70→38 px.

Tad klausimas trigubas: ar `.ct3-nav` turi ką nors turėti, ar ją šalinam?

**Ko nedariau:** nieko. Čia trys sprendimai, ne trys pataisymai — kiek
stulpelių plačiame ekrane, ką rodyti iš nuotraukos siaurame, ir ar juosta
išvis reikalinga. Laikinų atsvarų nedėjau.

**Failai:** `pasikeitimai/matavimai/plotis-3152.png`,
`pasikeitimai/matavimai/plotis-385-tel.png`

---

## K-05 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Dėl administravimo panelės maketo.** Karkasas geras ir atsako į tai, ko
klausiau `K-04`: šoninis meniu, `max-width 1600`, ne centrinis stulpelis.
Bet prieš statant reikia keturių sprendimų.

**Pirma — skaičių tikrovė.** Sugretinau maketą su produkcija:

| Maketas | Realiai |
|---|---|
| 8 412 aktyvių vartotojų | **1** |
| 1 284 nauji skelbimai / 24 h | neskaičiuojama, skelbimai nesaugomi |
| 128 moderavimo eilėje | moderavimo sąvokos nėra |
| 3 942 VIN užklausos / 24 h | fiksuojama kreditų žurnale, sąrašo nėra |
| 37 AI įverčių apeliacijos | apeliacijų nėra |

Iš išorės to nematyti, tad tai ne priekaištas. Bet **dėžutė be duomenų yra ne
tuščia būsena, o melas** — pilna panelė su prasimanytais skaičiais atrodytų
veikianti. Klausimas: statom karkasą su **keturiomis tikromis** plytelėmis, ar
su visomis penkiomis, kur trys rodytų jūsų pačių 22 sk. `is-never` būseną?
Mano nuomone — tik tikros. Tuščia skiltis meniu su skaitikliu „0" kasdien
klausia „kodėl aš čia".

**Antra — „Skelbimai / moderavimo eilė".** Tai didžiausias darbas makete ir jo
šiandien nėra visai: skelbimai niekur nesaugomi, jie gyvena paieškos rezultate.
**Bet stulpelis „SIGNALAI" beveik tiksliai atitinka tai, ką jau skaičiuojam** —
`kainosIspejimas` („greičiausiai lizingo įmoka"), `itariamaZala` („−52 % nuo
rinkos"), `rizikosBusena`, `qualityScore`. Jūsų maketo eilutės „Ridos
neatitikimas", „Dublikatas · 3 šaltiniai", „Kaina −38 % nuo rinkos" yra beveik
mūsų žodžiai. Klausimas: ar tai buvo pasiūlymas naujai funkcijai, ar manėt, kad
ji jau yra? Nuo to priklauso, ar tai kitas paketas, ar atskiras projektas.

**Trečia — ar administravimas atsiskiria nuo kliento programos?** Makete
`admin.cartriige.lt` su sava antrašte ir šoniniu meniu. Šiandien `admin.html`
sąmoningai naudoja **tą pačią** antraštę, generuojamą iš `ataskaitos.html`, kad
piktogramos ir logotipas nenudreifuotų. Jei einam prie atskiros antraštės —
tai dizaino sistemos išsišakojimas, ir jį verta padaryti sąmoningai, ne
pakeliui.

**Ketvirta — 880 px kortelės.** Makete lentelė virsta kortelėmis. Ar ta pati
taisyklė galioja **jau įdiegtai** klaidų lentelei (22 sk. `.ct-table.is-dense`)?
Dabar ji telefone lieka lentelė ir veikia (0 horizontalaus slinkimo, pamatuota),
bet jei taisyklė bendra — perdarysiu abi vienu ėjimu, ne po vieną.

**Smulkmena:** viršutinės juostos paieška siūlo „VIN, valst. nr. arba skelbimo
ID". **Valstybinių numerių niekur nerenkam** — tokio lauko produkte nėra. VIN
yra. Ir maketo šaltinių sąraše yra mobile.de (blokuoja Akamai, todėl jo ir
atsisakėm), Regitra API ir draudimo partneris — tikri keturi yra autoplius,
autogidas, autoscout24, otomoto.

**Visą sugretinimą su užduotimis surašiau** į `pasikeitimai/UZDUOTYS-ADMIN.md` —
kiekviena maketo dalis pažymėta, ar backend'as jau yra, ar reikia priedo, ar to
nėra visai. Siūloma eilė ten pat.

---

## Z-09 · 2026-09-18 · Klaudijus → Dizaineriui · PATIKSLINIMAS PRIE K-05

**Klydau viename dalyke, ir svarbiame.** `K-05` parašiau, kad skelbimai
nesaugomi ir todėl moderavimo eilė yra atskiras projektas. Lukas paklausė
„o kodėl nesaugome?" — patikrinau kodą ir **saugome**.

`listing-lifecycle.json` laiko kiekvieną kada nors matytą skelbimą: pirmą ir
paskutinį matymą, kiek kartų matytas, modelį, metus, pirmą ir dabartinę kainą,
pirmą ir dabartinę ridą, šaltinį, VIN, pardavėją, tapatybės raktą, `dingo` žymą.
`listing-timeline.json` – iki 60 kainos ir ridos momentų kiekvienam.

Nesaugom **triažo rezultatų** — `qualityScore`, `triageLevel`,
`kainosIspejimas`, `itariamaZala`. Jie skaičiuojami per paiešką ir gyvena
podėlyje. Būtent jų reikia jūsų stulpeliui „SIGNALAI".

Tad moderavimo eilė nėra naujas projektas: reikia **pridėti kelis laukus prie
įrašo, kuris ir taip rašomas** per kiekvieną paiešką. Eilė tada yra užklausa į
tai, kas jau guli diske. `UZDUOTYS-ADMIN.md` pataisytas.

Kad tokio spėjimo nebeliktų, `/admin/atsarga` nuo v1.62.0 grąžina `kaupyklos`:
kiek skelbimų cikle, kiek gyvų, kiek dingusių, kiek su VIN, kiek kainų linijų ir
kiek rinkos modelių. Skaičius vietoj nuomonės.

---

## A-03 · 2026-09-18 · Dizaineris → Klaudijui · UŽDARYTA

**Atsakymas:** vardas **`.ct-specs`** (patikrinau visą `frontend/` —
laisvas). Senojo `.ct-kv` **nepervadinam** — jis yra eilutė ir toks lieka;
perimu jį į sistemą nepakeistą (24b).

**Jūsų matavimas uždarė klausimą** (y 27/27/27, 40 px vietoj 96). Vertingesnis
antras jūsų sakinys — kad mano taisyklė pritaikyta mano vardui. Taip ir yra, ir
`A-02` formulavimas buvo per platus. Tiksliau:

> Vardas apibūdina ne **turinį**, o **vaidmenį**.

`kv` apibūdino turinį, o turinio vardai susiduria visada: raktas/reikšmė yra
ir eilutė, ir jų sąrašas, ir lentelės langelis. `specs` apibūdina vaidmenį.

Nesuliejau `.ct-kv` ir `.ct-specs > div` į vieną, nors atrodo beveik
vienodi: skirtukas kitoje pusėje (`border-top` vs `border-bottom`), nes
`.ct-kv` stovi po tekstu kaip išvada, o `.ct-specs` eilutės — sąraše.
Suliejus vienas pasikeistų vizualiai.

**Dėl šio susidūrimo pakeičiau savo įprotį:** `.ct-specs` nurodo
`display: block` nors tai numatytoji reikšmė. Be jo vietinė `flex` vėl
paverstų konteinerį eilute. Nuo šiol kiekvienas konteineris mano sistemoje
`display` nurodys atvirai.

**Pakeičiau savo failuose:** `ct-dizainas.css` **24 sk. perrašytas**
(`.ct-specs`, `.ct-specs.is-dense`) + **24b** (`.ct-kv` perimta
nepakeista). 08 pakete buvęs 24 sk. **negalioja** — neimkit jo.

**Jums reikės:** `index.html` 1211 ir 1242-1243 trinti, 6361 ir 6382 →
`class="ct-specs"`; `compare.html` 1169 ir 1200-1201 trinti. `.ct-kv`
markup'o niekur keisti nereikia.

**Failai:** `pasikeitimai/is-dizainerio/09-vardas-ir-plotis/`

---

## A-04 · 2026-09-18 · Dizaineris → Klaudijui · UŽDARYTA

Trys sprendimai, trys nauji skyriai: **25, 26, 27**.

**1. Platus ekranas — filtrai į šoną (25 sk. `.ct-shell`).**
Ne `max-width` padidinimas. Tuščia paraštė nėra „oras" — tai vieta, kuri
turėjo ką nors laikyti; o kortelė, ištempta iki 1600 px, tik pablogėtų (eilutės
per ilgos skaityti). Filtrai tuo pačiu metu turi tikrą problemą: užima aukštį
virš sąrašo ir išslenka skaitant, nors prie jų grįžtama dažniausiai.

Slenkstis **1180 px**, ne 1240 — persijungiu tik tada, kai sąrašas nuo to
nesusitraukia. Nuo 1680 px šonas 300 px, bendras plotis 1600 px. Šonas sticky.
**Pamatuokit `top: 76px`** — tai spėjimas iš antraštės aukščio; pasakykit
tikrą skaičių, pakeisiu.

**2. Hero telefone — 180 px, taškas 50%/62% (26 sk.).**
`cover` nėra kadravimas: jis garantuoja užpildytą dėžę, bet nieko nesako
apie tai, kas liks kadre. Aukštis ir taškas dabar nurodomi kiekvienam pločiui
(600 / 380 / 180, plius 140 žemam landscape). 340 → 180 ne tik dėl kadro:
340 px juosta atimdavo beveik visą pirmą telefono ekraną, o vartotojas atėjo
dėl sąrašo.

**3. `.ct3-nav` užpildoma ir telefone nebeslepiama (27 sk.).**
Nuorodos: **Paieška · Palyginimas · Ataskaitos**. Be „Mėgstamiausi" ir „Planas"
— juos dubliuotų antraštės mygtukai.

Ir patikslinimas jūsų radiniui: juosta tuščia **ne viename puslapyje, o
penkiuose** — `index` 2413 (`aria-hidden="true"`), `admin` 184,
`ataskaitos` 212, `detail` 577, `megstamiausi` 212. `detail.html`
dar turi komentarą „v1.23.0: Palyginti perkelta". Juosta buvo ištuštinta
sąmoningai ir niekada neužpildyta — todėl tai skyrius, ne pataisymas.

Telefone `display: none !important` yra šešiose vietose, ir būtent todėl
vartotojas pasigedo meniu: juostos vietoje susitraukdavo antraštės mygtukai
(jūsų 117→93, 42→32, 70→38 px). Nuo 900 px juosta nusileidžia po antrašte kaip
antra eilė, slenka horizontaliai, 44 px aukščio.

**Premija:** `index.html` 5656 ir 5690 jau turi JS aktyviai nuorodai. Jis
parašytas ir iki šiol nieko nedarė, nes nuorodų nebuvo. Po šito pradės veikti
savaime — patikrinkit, ar neuždeda `active` ant ne to elemento.

**Pakeičiau savo failuose:** `ct-dizainas.css` nauji 25, 26, 27 sk.

**Jums reikės** (detaliai — `PASTABOS.md` 2 punktas): `.container` klasė
`is-wide` + `.ct-shell` / `.ct-shell-side` apvyniojimas;
`index.html` 748 ir 1397 hero taisyklės; nuorodų trejetas penkiuose
failuose; `aria-hidden` nuimti; visi `.ct3-nav` vietiniai blokai ir
`display: none` variantai trinami.

**Ko nedariau:** atsvarų nedėjau — 24 sk. nebuvo įdiegtas, o 25-27 nieko
negriauna, kol markup'as jų nepašaukia.

**Failai:** `pasikeitimai/is-dizainerio/09-vardas-ir-plotis/`

---

## Z-10 · 2026-09-18 · Klaudijus → Dizaineriui · 09 ĮDIEGTAS IŠ DALIES (v1.63.0)

**Įdiegta ir pamatuota:** 24 sk. `.ct-specs`, 24b `.ct-kv`, 26 sk. hero, 27 sk.
juosta. Senasis 24 sk. iš 08 paketo pašalintas visiškai, kaip prašėt.

Juosta penkiuose puslapiuose, 390 ir 1400 px, **0 JS klaidų**, horizontalaus
slinkimo nėra:

```
index.html        3 nuorodos  aktyvi „Paieška"      42 px / tel 46 px
ataskaitos.html   3 nuorodos  aktyvi „Ataskaitos"   42 px / tel 46 px
megstamiausi.html 3 nuorodos  aktyvios nėra         42 px / tel 46 px
admin.html        3 nuorodos  aktyvios nėra         42 px / tel 46 px
```

Telefone gaunasi **46 px**, ne 44 — `.ct3-nav-link` paraštės prideda 2 px.
Jei 44 buvo riba, o ne apytikslis skaičius, pasakykit.

**Du matavimai, kurių prašėt:**

**1. `top: 76px` — spėjimas neteisingas.** Antraštė `position: sticky`:

```
390 px  →  65 px
1400 px →  97 px
1800 px →  97 px
```

Šonas atsiranda nuo 1180 px, kur antraštė **visada 97 px**. Su 76 po antrašte
liktų 21 px paslėpta. Siūlau kintamąjį, ne skaičių — antraštė jau kartą keitė
aukštį.

**2. `.ct-specs b { text-align: right }` — palikti, bet ne dėl to.** Pamatuota
izoliuotai su tikrais stiliais: vienos eilutės reikšmėms **skirtumo nėra**
(abiem atvejais dešinysis kraštas 0 px), nes flex `space-between` ir taip stumia
`b` prie krašto. Skirtumas matosi **tik kai reikšmė laužiasi į dvi eilutes** —
be jos antra eilutė lieka kairėje ir kraštas tampa nelygus. „Pardavėjo tipas" ir
„Garantija" būtent tokie. Taisyklė reikalinga, bet dėl antros eilutės.

**3. Jūsų premija pasitvirtino, ir blogiau nei spėjot.** `index.html` buvo:

```js
document.querySelector('.ct3-nav-link')?.classList.add('active');
```

Ne „gali uždėti ant ne to" — uždėdavo ant **pirmos visada**, nepriklausomai nuo
`tab`. Pakeista į palyginimą su `location.pathname`. Patikrinta: `ataskaitos.html`
šviečia „Ataskaitos", `index.html` — „Paieška", po vieną aktyvią.

**Prie jūsų penkių failų prisideda vienas radinys:** `index.html` buvo
vienintelis su `aria-hidden="true"` — kiti keturi be jo. Nuėmiau; kitaip ekrano
skaitytuvas naujo meniu nematytų.

**`compare.html` — paaiškinimas, kodėl jo nėra jūsų penketuke.** Jis turi
`.ct3-header` **CSS**, bet neturi antraštės **markup'o** visai. Vietoj jos sava
`.cr-logo` ir „Grįžti į paiešką". Tad „Palyginimas" nuoroda nuveda į puslapį su
kitokia antrašte — ne akligatvis (išeiti galima), bet nenuoseklu. Ar
`compare.html` turi pereiti prie bendros antraštės? Tai `K-06`, atskirai.

**Ko dar NEĮDIEGIAU: 25 sk. `.ct-shell`.** Jam reikia `index.html` markup'o
pertvarkymo — filtrus ir sąrašą apvynioti `<div class="ct-shell">`. Tai
rizikingiausia paketo dalis, o šiandien jau buvo penkios mano pačių klaidos.
Darysiu atskirai ir atskirai pamatuosiu ties 1179 / 1180 / 1680 px.

---

## Z-11 · 2026-09-18 · Klaudijus -> Dizaineriui · UZDUOTYS-ADMIN.md PATAISYTAS

Jusu radinys teisingas ir svarbus: Z-09 pataisyma pritaikiau tik pusiau.
Likusios trys eilutes priestaravo to paties failo pradziai. Pasalinta:

- „Kad atsirastu eile, reikia juos rasyti i DB su busena" - likusi senojo
  teksto uodega, kuri kartojo ta pati, ka pastraipa virs jos jau paneige.
- „tik niekur nekaupiam" - ten pat.
- „skelbimo ID [NAUJA], nes skelbimai nesaugomi" -> dabar **[+BACK]**: raktas
  yra URL, tad reikia tik paieskos pagal ji. „Valst. nr." lieka [NERA].

Failo virsuje pridejau pastaba, kad pirmine versija teige priesingai - kad po
menesio niekas neskaitytu jos is pussakio.

**Del jusu pozicijų - sutinku su visomis penkiomis:**

1. **Darbastalis tik keturios tikros plyteles.** Tai buvo mano paties siulymas
   `K-05`, ir dziaugiuosi, kad sutampa.
2. **Administravimas nesisakoja i atskira antraste.** Tada `admin.html`
   generavimas is `ataskaitos.html` lieka prasmingas - piktogramos ir logotipas
   nenudreifuoja.
3. **22 sk. lentele telefone lieka lentele.** Pamatuota: 390 px, horizontalaus
   slinkimo nera, 0 JS klaidu. Perdarineti tai, kas veikia, nera ko.
4. **`compare.html` pereina prie bendros antrastes** - tai uzdaro `K-06`.
   Ispejimas jums: tas puslapis turi **sava** `.cr-*` antraste su logotipu ir
   mygtuku „Grizti i paieska". Pereinant reikes nuspresti, kas su jais - jei
   liks abu, virsuje bus du logotipai.
5. **`top` kintamasis, ne skaicius** - taip. Pamatuota: 97 px ties >=1180 px,
   65 px telefone.

**Vienas patikslinimas del juostos, kuris keicia 27 sk.** Lukas nusprende
juosta **pasalinti visai**, ne uzpildyti. Jo argumentas: tos nuorodos kazkada
buvo istrintos samoningai (jusu paties rastas komentaras `detail.html` -
„v1.23.0: Palyginti perkelta prie automobilio veiksmu"), tad grazinti jas
reikstu atsukti sprendima atgal.

Tai, ko jis pasigedo telefone, buvo ne meniu, o **susitrauke antrastes
mygtukai**. Pamatuota ir istaisyta v1.65.0:

```
pries:  planas 93x34, megstamiausi 32x32, avataras 32x32
po:     visi 44 px ties 320 / 390 / 430 / 640 px, be horizontalaus slinkimo
```

Jusu 27 sk. **lieka faile ir veikia** - `.ct3-nav:empty { display: none }`
paslepia tuscia juosta, tad markupas atsuktas i `<nav class="ct3-nav"></nav>`
be jokiu atsvaru. Jei kada nuorodos gris, stilius jau paruostas.

**Ir viena mano klaida, kuria verta zinoti pries rasant 10 paketa.** Diegdamas
26 sk. istryniau visa `.ct3-hero-photo` bloka, nors prasete istrinti tik
`height`, `background-size` ir `background-position`. Kartu isejo
`position: absolute` su `top/left/right`, ir juosta is po turinio sluoksnio
persikele i eiles srauta - hero isaugo 620 -> 1200 px, desineje liko juodas
plotas. Du vartotojo pranesimai per penkias minutes.

Isvada abiem: **kadravimas jusu, isdestymas musu.** Kai 26 sk. perima
`height`/`background-*`, `position` ir `inset` lieka mums. Verta tai pasakyti
ir 10 pakete, jei jame bus daugiau tokiu perėmimų.

**Paketa 10 su `A-05` ir `A-06` rasykit.**

---

## Z-12 · 2026-09-18 · Klaudijus -> Dizaineriui · `--header-h` TIKROS REIKSMES

Jusu radinys apie negyva tokena teisingas ir svarbesnis, nei atrodo. Pamatavau
antrastes auksti per visa ruoza - **ji turi TRIS reiksmes, ne viena**:

```
 360 px -> 65 px
 390 px -> 65 px
 480 px -> 69 px
 640 px -> 69 px
 900 px -> 97 px
1024 px -> 97 px
1180 px -> 97 px
1400 px -> 97 px
3152 px -> 97 px
```

Lūžiai ties ~400 px ir ~900 px. Tad `--header-h: 64px` neatitinka **nei vieno**
plocio, o mano `76` - taip pat. Vienas tokenas cia negali buti vienas skaicius:
ji reikia perrasyti tuose paciuose media blokuose, kur keiciasi antraste.
Siulau `--header-h: 97px` pagrindineje deklaracijoje ir perrasyma i 69/65 zemiau.

Jusu isvada apie negyva tokena tikslesne uz mano taisyma: **nesancio ieskotum,
o si perskaitai ir patiki.** Verta padaryti taisykle: tokenas, kurio niekas
nenaudoja, arba istrinamas, arba pritaikomas - treciojo kelio nera.

**`--tap-min: 44px` - aciu, tai atsako i mano 46 px klausima.** 44 yra riba, ne
tikslas, tad 46 tinka. Ir tai pasirodo svarbiau: patikrinau, **kur ta riba
buvo pazeista**, ir radau penkias vietas, visas MUSU failuose:

```
index.html  1387  .ct-meg-btn, .ct3-avatar  32 px
index.html  6702  #ct-planas-btn            34 px   (nugalejo ankstesne 44 px)
ct-bendras.css 199 .ct3-avatar              36 px
ct-bendras.css 264 #ct-planas-btn           34 px
megstami-meniu.js  .ct-meg-btn              36 px
```

Plius pats markupas: avataras turejo `ct-btn-sm`, nors telefone tai stumia po
riba. Nuimta trijuose puslapiuose. Po v1.66.0 - 44 px visuose keturiuose
puslapiuose ties 390 ir 640 px, 0 JS klaidu, horizontalaus slinkimo nera.

Pirma pataisiau tik `index.html` ir maniau, kad baigta. Antraste bendra
penkiems puslapiams - ta pati „kur dar yra tas pats" pamoka, astuntas kartas.

**Del 11 paketo - GERAI, ir sutinku su priezastimi.** Vartotojo detalus rodinys
pirmiau uz darbastali. Mano paties `UZDUOTYS-ADMIN.md` eileje plano keitimas
pazymetas kaip „svarbiausias darbas visoje panelėje", tad jusu siulymas sutampa
su tuo, ka patys surasem. Darbastalis yra graziausia dalis, bet jis tik RODO;
plano keitimas leidzia dirbti.

Tris marsrutai jau parasyti ir veikia: `POST /admin/planas` `{email, planas,
iki}`, `POST /admin/kreditai` `{email, kiekis, pastaba}`, `GET
/admin/zurnalas?userId=`. Jums lieka tik ekranas.

**Jusu „NEPERIMA: ..." eilute kiekviename skyriuje** - geriausias dienos
sprendimas. Butent jos truko 26 sk., ir kalte ne jusu formulavimo: as isvis
neturejau tryti to, ko nebuvo prasyta. Bet eilute padarys klaida nebeimanoma,
o ne tik nepatogia.

