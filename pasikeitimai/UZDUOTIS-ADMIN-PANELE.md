# Užduotis dizaineriui · ADMIN PANELĖ pagal tai, kas TIKRAI yra

Parengta 2026-09-20, v1.88.0. Rašau pagal **gyvą kodą**, ne pagal atmintį:
maršrutai suskaičiuoti iš `backend/server.js`, lentelės — iš `auth.js`,
`planai.js`, `vartotojo-duomenys.js`.

Luko prašymas: panelė **pagal turimas funkcijas**, plius mano pasiūlymai, kas
dar verta pridėti. Dalinu į tris dalis pagal kainą, nes tai keičia, ką verta
projektuoti dabar.

---

## A DALIS · KAS JAU YRA — duomenys guli, panelės nėra

Šitiems nereikia nė vienos naujos backend'o eilutės. Sąrašas baigtinis, ir
kiekvienam nurodau, iš kur duomenys.

### A1 · Klaidų pranešimai — **padaryta, bet vertas antro žvilgsnio**
`GET /admin/klaidos` · `POST .../busena` · `.../komentaras` · `.../foto`

36 pranešimai, 7 būsenos, komentarų gija, nuotraukos, pilna diagnostika
(versija, ekrano plotis, naršyklė, paskutinės JS klaidos, nepavykusios
užklausos, paspaudimų seka). Veikia, bet sąrašas auga ir jau dabar sunku
atsakyti į klausimą „kas šiandien svarbiausia".

**Ko trūksta dizaine:** ne naujų laukų, o **prioriteto**. Pranešimas su
5 pasikartojimais ir pranešimas, parašytas vieną kartą, sąraše atrodo vienodai.

### A2 · Vartotojo ekranas — **padaryta v1.81.0**
`GET /admin/vartotojai` · `POST /admin/planas` · `POST /admin/kreditai` ·
`GET /admin/zurnalas?userId=`

Kreditai trijų rūšių atskirai, plano keitimas su poveikio kortele
(pamatuota visais 9 perėjimais), kreditų žurnalas.

### A3 · Nuskaitymo matavimai — **yra duomenys, nėra ekrano**
`GET /admin/atsarga`

Grąžina: katalogą, ar saugykla persistentinė, klaidų failo dydį, kaupyklų
sąrašą ir **Puppeteer skaitiklius** (`pasiektas`, `pavyko`, `nepavyko`).
Šiandien tai matosi tik kaip žalias JSON tekstas.

**Vertė:** tai vienintelis dalykas, atsakantis „ar nuskaitymas apskritai
veikia". Paskutinis matavimas: `pasiektas: 2, pavyko: 1` — t. y. **50 %**.
Tokį skaičių reikia matyti, ne ieškoti.

### A4 · Kreditų judėjimas — **lentelė yra, ekrano nėra**
`kreditu_zurnalas`: `laikas, veiksmas, raktas, kiekis, likutis_po, pastaba`

Šiandien matomas tik viename vartotojo ekrane. Bet tai **pajamų ir sąnaudų
žurnalas**: kiek analizių, kiek VIN patikrų, kiek grąžinta dėl serverio
klaidų, kiek nemokamų pakartojimų per 24 h.

**Vertė didžiausia iš visos A dalies:** `veiksmas` + `kiekis` pasako, kur
eina pinigai. Nemokamų pakartojimų dalis pasako, ar kainodara teisinga.

### A5 · Rinkos duomenys — **guli JSON'uose**
`cache.json`, `lifecycle`, `timeline` · 668 sekamų skelbimų

Yra: kainų istorija, skelbimų gyvavimo trukmė, modelių tendencijos
(`/api/model-trends`), pakeitimų sekimas (`/api/listing-changes`).

**Vienas skaičius, kurį verta parodyti iškart:** `suVin: 0` — nė vienas iš 668
sekamų skelbimų neturi VIN. Tai reiškia, kad VIN paieška šiandien nerastų nieko.
Tokie dalykai turi matytis panelėje, o ne išaiškėti po pusmečio.

---

## B DALIS · PIGU PRIDĖTI — duomenys yra, reikia kelių eilučių

Nė vienam iš šitų nereikia naujos lentelės ar išorinės paslaugos.

| # | Kas | Iš ko | Kodėl verta |
|---|---|---|---|
| B1 | **Šiandienos santrauka** — paieškų, analizių, kreditų, naujų vartotojų | `kreditu_zurnalas` + `users` | Vienas žvilgsnis vietoj trijų ekranų |
| B2 | **Klaidų prioritetas** — rikiavimas pagal `kartojasi` × `svarba` × amžių | jau įrašyta | A1 problema išsisprendžia be naujų duomenų |
| B3 | **Nuskaitymo sveikata** — `pavyko / pasiektas` % su spalva | `/admin/atsarga` | 50 % turi rėkti, o ne gulėti JSON'e |
| B4 | **Grąžinimų sąrašas** — visi `-grazinta` įrašai | `kreditu_zurnalas` | Kiekvienas grąžinimas = serverio klaida, kurios niekas nematė |
| B5 | **Nemokamų pakartojimų dalis** — `kiekis = 0` prieš visus | `kreditu_zurnalas` | Pasako, ar 24 h taisyklė neatiduoda per daug |
| B6 | **Vartotojai be veiksmų** — registravosi, bet 0 paieškų | `users` + žurnalas | Tiesioginis „kur nukrenta" rodiklis |
| B7 | **Versijų juosta** — kada kuri versija išėjo, kiek klaidų po jos | `versijos.js` + pranešimų `versija` | Matyti, ar leidimas ką nors sulaužė |

**B1–B3 duotų daugiausia už mažiausiai.** Jei reikia rinktis vieną — B3, nes
tai vienintelis dalykas, kuris gali tyliai neveikti ištisas savaites.

---

## C DALIS · BRANGU, BET VERTA — naujas kodas, nauji duomenys

Rašau, kad dizaineris žinotų, kur sistema gali augti, ir neprojektuotų į kampą.

### C1 · Skelbimų kokybės eilė *(vidutiniškai brangu)*
Skelbimai, kuriems CarTriige įvertinimas **nepatikimas**: mažai palyginimų
(`marketCount < 8`), prieštaringi duomenys, įtariama lizingo įmoka.
Reikia: eilės lentelės, sprendimo žurnalo, taisyklių.
**Vertė:** tai vienintelis būdas pagerinti algoritmą sistemingai. Šiandien
klaidos randamos tik tada, kai Lukas jas pamato.

### C2 · Šaltinių stebėjimas *(brangu)*
Kiekvieno portalo sveikata realiu laiku: ar atsako, koks vėlavimas, kiek
skelbimų per valandą, kada paskutinį kartą pavyko.
Reikia: periodinio tikrinimo, laiko eilutės saugyklos, ribų.
**Vertė:** portalo pasikeitęs HTML šiandien pastebimas tik tada, kai vartotojas
parašo, kad „nieko neranda".

### C3 · Pinigų ekranas *(brangu tik dėl Stripe)*
MRR, atsisakymai, vidutinė kreditų sąnaudos vienam vartotojui, pelningumas
vienai analizei (AI užklausos kaina vs kreditas).
**Vertė:** šiandien nežinom, ar viena analizė uždirba, ar kainuoja.
**Pastaba:** be Stripe dalis šito būtų melas — `A-05` 1 punktas.

### C4 · A/B ir kokybės matavimas *(brangiausia)*
Ar CarTriige balas koreliuoja su tuo, ką žmonės realiai perka; kiek atmestų
skelbimų buvo geri.
**Vertė:** vienintelis kelias nuo „atrodo protinga" iki „įrodyta".

---

## KO PRAŠAU IŠ DIZAINERIO

**Ne viso maketo.** Prašau sprendimo dėl **struktūros**:

1. **Kas yra pirmas ekranas?** Siūlau ne darbastalį su skaitikliais, o
   **„kas šiandien ne taip"** — nuskaitymo sveikata, nauji pranešimai,
   grąžinimai. Tuščias ekranas („viskas gerai") čia yra geras rezultatas,
   ne tuščia būsena.
2. **Kaip dera A ir B dalys?** Šiandien trys skirtukai (Klaidos, Matavimai,
   Vartotojai). Su B1–B7 jų būtų per daug.
3. **Ar telefonui reikia atskiro srauto?** Jūsų atsiųstas maketas
   („Būklė → Eilė → Sprendimas") siūlo taip. Su dabartinėmis funkcijomis
   telefone realiai reikia dviejų dalykų: **ar viskas gyva** ir **kas naujo
   pranešta**. Visa kita gali būti „atidaryti kompiuteryje".

**Ko NEPROJEKTUOTI** (nes duomenų nėra ir greitai nebus): moderavimo eilės su
priskyrimu, apeliacijų, `mobile.de`, VIN talpyklos rodiklio, šaltinių
vėlavimo sekundėmis. Tai C dalis, ir ji prasideda nuo backend'o, ne nuo
maketo.

Matavimus duosiu bet kuriam variantui — sakykit, ką matuoti.
