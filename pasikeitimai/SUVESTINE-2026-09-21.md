# Suvestinė · 2026-09-21 · kur esam ir ką planuoti rytojui

Parašyta iš gyvų šaltinių, ne iš atminties: `/admin/klaidos` (43 pranešimai),
`/admin/rinka`, ScraperAPI paskyra, `git log`, `BUSENA.md`.

Produkcijoje: **v2.3.1** (`car-triage-app-production.up.railway.app`).
Archyve: **2 484** BMW skelbimai. ScraperAPI: **85 826 / 100 000**,
liko **14 174**.

---

## 1. KAS PADARYTA ŠIANDIEN

| Versija | Kas | Būsena |
|---|---|---|
| v2.2.0 | **Skelbimų archyvas** `rinka.db` (SQLite ant `/data`), tapatybė per portalo numerį, kainų istorija tik pasikeitus, dingimas po dviejų pilnų skenavimų. Sargas 24/24 | Gyva |
| v2.2.0 | **Atominis JSON įrašymas** visiems 6 duomenų failams — anksčiau nutrūkęs rašymas tyliai ištrindavo visą archyvą | Gyva |
| v2.2.1 | **Automatinis sekimas išjungtas** (`SEKIMAS_AUTO=1` įjungia) | Gyva |
| v2.3.0 | **Regitra A-29 / A-30 / A-32**: ridos norma tik amžiaus juostoje, atsarga 7–15 m. su `kmmet_n ≥ 100`, nurašymai 40 % + vartai 12 m. Sargas 88/88 | Gyva |
| v2.3.1 | **35 paketas**: etiketė virš dėžutės visur (34e), šonas atšaukia pilno pločio triuką (35b), `ct-priedai.css` 7 blokas ištrintas. Sargas 26/26 | Deploy'inta |
| — | **Bandomasis skenavimas**: autoplius 79 psl. / 1 576 skelbimai, autogidas 46 psl. / 908. Abu pasiekė sąrašo galą | Padaryta |
| — | **Railway ir Windows-MCP prijungti**: skaitau produkcijos logus, push'inu pats | Veikia |
| — | Ištrintas **dublikatas Railway projektas** (deployinosi su kiekvienu push'u) | Padaryta |

### Trys pamokos, įrašytos į `CLAUDE.md`

1. **Matavimas ne toje būsenoje, kurioje gyvena klaida** (`Z-59`) — `K-34`
   matavau be `is-split`; įrankis atsakė, nors klausimas jam netaikomas.
2. **Atsvara, pasikartojanti laike** (`D-33`) — 7 blokas ir `K-34` faile
   niekada nebuvo matomi kaip pora.
3. Dizainerio `D-32`: **vardas, valdantis daugiau, nei sako** (`is-inline`
   valdė plotį, etiketę IR piktogramos matomumą).

---

## 2. KĄ ESAME PAŽADĖJĘ, BET DAR NEPADARĖME

### 2.1 Kreditai — svarbiausia

Pamatuota iš ScraperAPI domenų ataskaitos:

```
autoplius.lt / autogidas.lt      10 kreditų už užklausą  (20 su render)
autoscout24 / otomoto            10 SU render, 1 BE render
```

- **Neužbaigta:** patikrinti, ar otomoto ir autoscout24 veikia **be
  `render=true`**. Kaina 2 kreditai, galima nauda ~10 kartų (per savaitę tie
  du portalai suvalgė ~23 000 kreditų).
- **Neužbaigta:** kas kviečia autoplius su `render=true` (228 užklausos,
  4 600 kreditų).
- **Neužbaigta:** kreditų sargas — skenavimas turi pats sustoti, kai
  paskyroje lieka mažiau už N.
- **Neužbaigta:** `autoplius-ids` atnaujinimas per kiekvieną startą, kol
  kartojasi „FinnCart nerastas" (1 užklausa = 10 kreditų per deploy'ų).

### 2.2 Du nauji Luko pranešimai — priežastys rastos, taisymo NĖRA

- **Nr. 42** „neveikia rūšiuoti mygtukas": meniu veikia, bet rūšiavimas
  pritaikomas tik 8 viršutinėms kortelėms — ilgas „Kiti skelbimai" sąrašas
  visada rikiuojamas pagal balą. Pakeliui: `index.html:1483` taisyklės
  `.ct-sort` / `.ct-sort-menu` rašytos klasėms, kurių elementai neturi.
- **Nr. 43** „rinkos kaina iškreipta": 2023+ metų X5 imtyje 6 iš 23 kainų
  yra 14–31 tūkst. (lizingo įmokos, dalys, daužti). Visos praėjo kainų
  patikrą, tad krenta į medianą. Archyve yra ir X5 už 92 mlrd. €, 2023 m. 320
  už 900 €, 2026 m. 525 už 2 600 €.

### 2.3 Analitikas — `A-33` laukia jo failo

Jis paruoš `modelis_dalys()` porą ir pergeneruotą `regitra-modeliai.json`
(`SERIE`/`REIHE` valymas, neapibrėžti raktai, jungimas pagal šeimą + kurą).
**Diegiam vienu commit'u** su `baziniModelis()`, kitaip raktai tyliai nustotų
pataikyti. Nuo manęs jam nuėjo klausimas: ar kuro žodynas jo, ar mūsų.

### 2.4 Dizaineris — `K-35` ir `K-26b`

- `K-35`: 35b taisyklė be sąlygos — juosta prarado pilną plotį ir prieš
  paiešką (1280 px: 1280 → 1240). Pataisa su `.is-split` pamatuota, laukiu
  jo sprendimo.
- `K-26b`: šonas **660 px** prie ribos 599, viršija **61 px**. Jis žadėjo
  grąžinti diapazonus prie `B+D`.
- Neatsakyti nuo 09-18: `K-25`, `K-24`, `K-18`, `K-17`, `K-16`, `K-15`,
  `K-14`, `K-12`, `A-11`.

### 2.5 Tavo patikra — devyni pranešimai

`laukia-patikros`: **35, 34, 33, 30, 28, 24, 23** ir nauji **39, 40, 41**
(pastarieji trys sutvarkyti v2.3.1 — reikia tik pažiūrėti).

---

## 3. KO DAR IŠ VISO NEPRADĖJOME

| Darbas | Kodėl svarbu | Kas trukdo |
|---|---|---|
| **Visų portalų skenavimas** | Dėl to ir kūrėm archyvą | Kreditai: vienas pilnas LT perėjimas ≈ 34 000, o liko 14 174 |
| **Sekimą pakeisti archyvo skenavimu** | Paieškos puslapis duoda 20 skelbimų už tą pačią kainą, kaip sekimas — 1 | Nepradėta |
| **Archyvo panaudojimas sąsajoje** | Šiandien archyvas tik kaupia; vartotojas iš jo dar negauna nieko (kiek dienų kabo, ar kaina mažinta, kiek tokių rinkoje) | Nepradėta |
| **Kainų valymas archyve** | Absurdiškos kainos griauna vidurkius (žr. Nr. 43) | Nepradėta |
| **Revizijos likučiai** | `A-5`, `A-6`, `A-8`, `B-1`, `B-4`, `B-6`, `B-7`, `C-3`, `C-5` | Nepradėta |
| **Atsarginė `/data` kopija** | 2 484 skelbimai + vartotojai gyvena viename Railway diske | Nepradėta |

---

## 4. SIŪLOMAS RYTOJAUS PLANAS

### Rytas · pigu ir greita (be kreditų, ~2 val.)

1. **Tavo patikra**: devyni pranešimai produkcijoje, pradedant nuo 39, 40, 41.
2. **Nr. 42 taisymas**: rūšiavimas pritaikomas ir „Kitiems skelbimams".
3. **Nr. 43 taisymas**: atspari mediana (išmesti kainas, kelis kartus
   nutolusias nuo medianos) + akivaizdžiai nerealios sumos jauniems
   automobiliams.
4. Tuo pačiu push'u — kreditų sargas ir `autoplius-ids` sustabdymas.

### Vidurdienis · kreditų tyrimas (kaina ~5 kreditai)

5. Patikrinti otomoto ir autoscout24 **be render**. Jei veikia — tai
   didžiausias vienas sutaupymas, kokį turim.
6. Rasti, kas kviečia autoplius su render.

### Popietė · priklauso nuo kitų

7. Jei atėjo analitiko failas — diegiam `A-33` vienu commit'u ir paleidžiam
   sargą prieš push'ą.
8. Jei atėjo dizainerio `35c` / `B+D` — diegiam ir matuojam šoną.

### Sprendimas, kurį turi priimti TU

**Ar didinam ScraperAPI planą?** Su 14 174 kreditų pilno LT skenavimo
(~34 000) nepadarysim. Variantai: (a) didinti planą, (b) skenuoti tik BMW ir
dar kelias markes, (c) pirma sutaupyti (render'io tyrimas) ir tada spręsti.
Mano siūlymas — (c), nes jis kainuoja 5 kreditus ir gali pakeisti visą
skaičiavimą.

---

## 5. Kas paleista fone

- **Priminimas 10:00** — grįžti prie viso portalų skenavimo su sąrašu iš
  `Z-55`.
- Automatinis sekimas **išjungtas** — kreditai nejuda, kol niekas nesinaudoja
  programa.
