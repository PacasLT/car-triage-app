# Užduotys dizaineriui · iš klaidų sąrašo

Sugeneruota **2026-09-18, v1.77.0**, iš gyvo `/admin/klaidos` sąrašo
(19 atvirų iš 29). Perrašoma visa iš sąrašo, ne iš atminties.

Kiekviena eilutė: **pranešimo numeris · ką parašė Lukas · elemento
selektorius · ką jau pamatavau · ko iš jūsų reikia.** Jei kur nors trūksta
matavimo — sakykit, pamatuosiu, tai pigiau už spėjimą.

---

## A grupė · šoninė filtrų panelė — **vienas sprendimas, trys pranešimai**

Visi trys iš v1.76.0, visi ties 2364 px. Tai ne trys defektai, o vienas
klausimas: **kas yra filtrų panelė ir kada ji siaura.**

| Nr. | Lukas | Elementas | Pamatuota |
|---|---|---|---|
| 23 | „Index puslapyje filtrų dizainas turi būti kitoks, šitas variantas turi būti tik jau atfiltravus su skelbimais" | `.ct-shell-side .ct3-fields` (298×377) | Tuščiame index puslapyje dešinysis stulpelis tuščias: 1236 px nieko |
| 24 | „Reikia patobulinti filtro šoninio dizainą" | – | Šonas 540 px, telpa nuo 1180 px, slinkimo 0 |
| 26 | „Nusikerpa tekstas renkantis portalą" | `#portal-selector` | Kairė **−32 px**, šono kairė 20 px → 52 px už stulpelio; `overflow:auto` jį nukerpa. Atsvara įdėta (`K-12`) |

**Ko reikia:** `K-13` — ar `.ct-shell` persijungia į du stulpelius **tik tada,
kai `#results` turi vaikų**? Markupe tai viena klasė, pasiruošęs diegti.
`K-14` — kas tiksliai netinka šone; galiu atsiųsti ekranvaizdžius ties
1280 / 1680 / 2364 px. `K-12` — portalų sąrašo vieta šone.

---

## B grupė · skelbimo puslapis — **užblokuota, kol neatsakys Lukas**

| Nr. | Lukas | Būsena |
|---|---|---|
| 9 | „Pardavėjo info turi būti kortelėje, o ne po nuotraukomis" | atidėta, laukia `D-03` |
| 10 | „Detail puslapyje dubliuojasi įvertinimai, išimk CarTriige, palik vieną" | atidėta, laukia `D-03` |
| 18 | „Boksai — info, AI analizė, tech info — slankioja į viršų ir apačią" | atidėta, laukia `D-03` |

**Kodėl užblokuota:** iki v1.76.0 šeši skirtukų skydeliai apskritai nebuvo
rodomi (`dpTab` neegzistavo). Iš 29 pranešimų **nė vienas** nebuvo apie jų
turinį. Lukas sprendžia: grįžta visi šeši, dalis, ar nė vienas. Tik po to
`D-03` turi prasmę.

---

## C grupė · antraštė ir hero

| Nr. | Lukas | Elementas | Ko reikia |
|---|---|---|---|
| 27 | „Pašalinam šitą tekstą" | `.ct3-hero-content` (1440×600) | `K-15` — hero lieka be teksto (tik nuotrauka) ar dingsta visas? Po v1.65.0 regresijos neliečiu be atsakymo |
| 28 | „Vartotojo ženkliukas ir širdelė su plano mygtuku turi būti gražiai dešinėje kampe, o ne prie headerio kairėje šalia" | `.ct3-header-inner > .ct3-header-right` (239×42, ties 893,27) | **`K-16`** — 27 sk. antraštė. Šiandien blokas sulipęs prie logotipo, ne prie dešinio krašto |

---

## D grupė · sąrašo plotis — laukia patikros, ne sprendimo

| Nr. | Lukas | Būsena |
|---|---|---|
| 2 | „Atmesta irgi pabėgę" | patvirtinta; galimai uždaryta 25 sk. |
| 19 | „Išfiltravus skelbimus liko apačioje susitraukę" | patvirtinta; galimai uždaryta 25 sk. |

**Ko reikia:** nieko, kol Lukas nepatikrins po v1.75–1.77. Jei liks — grįšim
su matavimu.

---

## E grupė · atskiri

| Nr. | Lukas | Kieno | Trumpai |
|---|---|---|---|
| 16 | „Admin panelė nėra mobile friendly" | **Dizaineris** | 7 stulpelių lentelė ties 390 px. Laukiam pilno varianto (Luko sprendimas) |
| 14 | „Loading baras negražiai atrodo, padarome jį į ilgį, kad nebūtų juodo fono šone" | **Dizaineris** | Atidėta; nepamatuota, galiu |

---

## Ne jūsų — kad matytumėt visą vaizdą

- **Nr. 29** (mano): pranešimo lange „kiek trukdo" keičiam į prioritetą —
  svarbu raudonas, vidutinis geltonas, mažiausiai svarbu žalias. Imsiu iš
  `.ct-k` žinojimo lygių, naujų spalvų nekursiu.
- **Nr. 22** (mano): admin sąrašas neatsinaujina po būsenos keitimo.
- **Nr. 20, 21** (Luko): ištaisyta v1.76.0, laukia patikros.
- **Nr. 15** (Luko): kokią sumą kortelė rodo BMW X4 — 739 ar 4749.
- **Nr. 6** (Luko): širdelė.
