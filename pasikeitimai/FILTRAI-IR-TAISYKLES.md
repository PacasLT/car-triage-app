# Filtrai, nuskaitomi laukai ir taisyklės · kaip yra KODE (2026-09-21, v2.4.3)

Surašyta iš `backend/server.js` ir `frontend/index.html`, ne iš atminties.
Kiekviena eilutė turi vietą kode, kad galėtum pasitikrinti pats.
Pažymėta **⚠** — ką radau rašydamas šį sąrašą ir kas dar netaisyta.

Kelias, kuriuo eina kiekvienas skelbimas:

```
1. Tavo filtrai -> portalo adresas          (ką portalas atrenka PATS - mes už tai mokam)
2. Portalo puslapis -> kortelių nuskaitymas (kokius laukus ištraukiam)
3. Kainos sveikatos patikra                 (lizingo įmoka? per maža kaina?)
4. Tavo filtrai dar kartą, MŪSŲ pusėje      (ko portalas nepatikrino)
5. Rinkos mediana ir nuolaida               (su kuo lyginam)
6. Kietieji atmetimai                       (niekada netampa TOP)
7. Balas ir lygis                           (TOP / verta / atmesti)
```

---

## 1. Tavo filtrai -> portalo adresas

| Tavo filtras | autoplius | autogidas | autoscout24 | otomoto |
|---|---|---|---|---|
| Markė | `make_id` (ID lentelė) | `f_1[0]=` tekstas | adreso kelias | adreso kelias |
| Modelis | `model_id` (ID lentelė; nežinomas -> tekstinė paieška) | `f_model_14[0]=` | adreso kelias | adreso kelias |
| Metai nuo / iki | `make_date_from/_to` | `f_41` / `f_42` | `fregfrom/fregto` | `filter_float_year` |
| Kaina nuo / iki | `sell_price_from/_to` | `f_215` / `f_216` | `pricefrom/priceto` | `filter_float_price` (PLN) |
| Rida iki | `kilometrage_to` | `f_66` | `kmto` (v2.4.3) | `filter_float_mileage:to` |
| Pavarų dėžė | `gearbox_id` 37/38 | `f_10=` tekstas | `gear=A,S` / `M` (v2.4.3) | `filter_enum_gearbox` |
| Kuras | `fuel_id[...]` | `f_2[N]=tekstas` (v2.4.3) | `fuel=` (v2.4.3) | `filter_enum_fuel_type` (v2.4.3) |
| Varantieji | `wheel_drive_id` | — | — | — |
| Be JAV / su VIN / su istorija / be defektų / tik LT | taip | dalis (`ac_3/4/5`, `f_46`) | — | — |
| Rikiavimas | naujausi viršuje | naujausi viršuje | standartinis | **pigiausi viršuje** |

Galia (kW) portalams **nesiunčiama** — tikrinama tik mūsų pusėje (4 žingsnis).

**Sutvarkyta v2.4.3 (Z-67).** Buvo: autogido kuro filtras niekada neveikė. Sąsaja siunčia `dyzelis` /
`benzinas` / `hibridas` / `elektra` (`index.html:2582`), o autogido žodynas
laukia `Dyzelinas` / `Benzinas` (`server.js` `AUTOGIDAS_PARAM.kuras`).
Raktai nesutampa -> `f_2[...]` į adresą nepatenka niekada. Autogidas grąžina
**visus kurus**, mes mokam už visus puslapius (10 kreditų puslapiui), o
netinkamus išmetam tik 4 žingsnyje. Numatytasis kuras sąsajoje — Dyzelinas, tad
tai liečia kone kiekvieną paiešką.

**⚠ otomoto rikiuoja „pigiausi viršuje".** Pirmi puslapiai — dalys, daužti,
lizingo įmokos. Medianai tai šališka imtis.

---

## 2. Kokius laukus ištraukiam iš kortelės

| Laukas | autoplius | autogidas | autoscout24 | otomoto |
|---|---|---|---|---|
| Kaina | ✔ (v2.4.2: `.promo-price`, sena atskirai) | ✔ `data-price` | ✔ | ✔ PLN -> EUR (**⚠ kursas ranka 4,25**) |
| + PVM / be PVM | ✔ (+21 %) | ✔ (+21 %) | — | — |
| Metai | ✔ + mėnuo | ✔ (mėnuo retai) | ✔ | ✔ |
| Rida | ✔ (v2.4.2: pirmas „km", ne nuotolis) | ✔ | ✔ | ✔ |
| Kuras | ✔ (v2.4.2: be baterijos) | ✔ | ✔ | ✔ |
| Pavarų dėžė | ✔ | ✔ | ✔ | ✔ |
| Variklio tūris | ✔ | ✔ | ✔ | — |
| Galia kW | ✔ | ✔ | ✔ | ✔ (iš AG × 0,7355) |
| Kėbulas | ✔ | — (kortelėje nėra) | — | — |
| Miestas | ✔ | ✔ (v2.4.2: „Užsienyje" – ne miestas) | — | — |
| Modelis | antraštė | antraštė (v2.4.2: iš adreso, jei reklama) | `make + model` | **⚠ „bmw seria-3"** |
| VIN / istorija / garantija / verslas | ✔ | ✔ | — | — |
| Iškeltas (mokamai) | ✔ | ✔ | — | — |
| Kada įkeltas | ✔ | ✔ (atnaujinimo laikas) | — | — |
| Lizingo suma | ✔ | — | — | — |
| JAV importo požymis | ✔ (tekste „JAV" / „aukcion") | ✔ | — | — |

Nesaugoma archyve: `turiLizingoOpcija` (visada true — portalo valdiklis),
`rawText`, `photos` (tik pirma), `ikeltaTekstas`.

---

## 3. Kainos sveikatos patikra (`kainosPatikra`)

| Sąlyga | Rezultatas |
|---|---|
| Ta pati suma skelbime su „/ mėn." | **lizingo įmoka** -> į „Kiti skelbimai" |
| Kaina < **4 500 €** ir lizingo suma > kaina × 3 | lizingo įmoka |
| Kaina < 4 500 € ir tekste „/mėn", „per mėn" | lizingo įmoka |
| Kaina < 4 500 €, automobilis **jaunesnis nei 10 m.** ir rida **< 200 000** | **įtartinai maža** |
| Kaina < 4 500 €, senas arba daug nuvažiavęs | laikoma tikra |

**⚠** Archyve yra 2023 m. 320 už 900 €, 2021 m. 120 už 2 200 €, 2026 m. 525
už 2 600 € — nė vienas nepažymėtas. Priežasties dar neradau (tikėtina, kad
`lizingoSuma ≈ kaina` sąlyga juos praleidžia). Atspari mediana (v2.4.0) juos
bent jau išmeta iš vidurkio.

---

## 4. Tavo filtrai MŪSŲ pusėje (antrą kartą)

Kas neatitinka — **neišmetama**, o perkeliama į „Kiti skelbimai" su priežastimi:

- kainos įspėjimas (3 žingsnis);
- metai nuo / iki, kaina nuo / iki, rida iki;
- pavarų dėžė;
- kuras (`kurasAtitinka`: hibridas = „hibrid" ARBA elektra + benzinas/dyzelinas);
- galia nuo / iki.

**Nežinomas laukas nefiltruojamas** — jei skelbime nėra kuro ar galios,
skelbimas neišmetamas.

**⚠ Rastas šalutinis v2.4.2 efektas:** iki šiol autoplius elektromobilio kuras
buvo „Elektra, 84 kWh", o `kurasAtitinka` tikrino `k === 'elektra'`. Filtruojant
„Elektrinis", **visi autoplius elektromobiliai su baterija būdavo atmetami**.
v2.4.2 kuro pataisymas tai sutvarko.

---

## 5. Rinkos mediana ir nuolaida

- Imtis: **ši paieška + ankstesnių paieškų istorija** tam pačiam modeliui
  (iki 1 000 įrašų modeliui), įskaitant atmestus pagal tavo biudžetą.
- Į medianą **neįeina**: kainos su įspėjimu; < 500 € ir > 1,5 mln. €; kai
  imtyje ≥ 5 — < 0,4× ir > 2,5× pirminės medianos (v2.4.0).
- Patikima mediana — kai imtyje **≥ 3**.
- Nuolaida `diffPct` = (mediana − kaina) / mediana.

---

## 6. Kietieji atmetimai (`checkHardRejections`) — balas ne daugiau 44

| Sąlyga | Tekstas vartotojui |
|---|---|
| Neatitinka tavo filtrų | „Neatitinka jūsų paieškos filtrų: …" |
| Defektuose „dauž", „po avarijos", „skend", „degę" | „reikšminga žala…" |
| Automobiliui ≥ 3 m. ir rida < 1 000 km | „Ridos neatitikimas" |
| Rida > 900 000 | „Neištikėtina rida" |
| Modelis nesutampa su pasirinkta marke | „neatitinka pasirinktos markės" |
| Kaina < 12 % medianos (imtis ≥ 3) | „visiškai nesuderinama su rinka" |
| Nuolaida ≥ 60 % (imtis ≥ 3) | „žala, aukcionas arba klaida" |
| JAV požymiai + nuolaida ≥ 35 % | „pradinė aukciono kaina" |

Papildomai: nuolaida ≥ **49 %** (`ZALOS_RIBA`, imtis ≥ 5) -> „galimai
daužtas", balas ne daugiau **60**.

**⚠ Rastas šalutinis v2.4.2 efektas:** „Ridos neatitikimas" su senu nuskaitymu
atmesdavo **kiekvieną ≥ 3 m. autoplius hibridą** — jo „rida" būdavo elektrinis
nuotolis (86 km < 1 000). Tai 260 archyvo skelbimų. v2.4.2 tai sutvarko.

---

## 7. Balas ir lygiai

Svoriai (numatytasis / perpardavimui / sau):

| Komponentas | numatytasis | perpardavimui | sau |
|---|---|---|---|
| Kaina vs rinka | 30 | 40 | 18 |
| Rida | 15 | 15 | 18 |
| Būklė / rizika | 20 | 18 | 25 |
| VIN / istorija | 10 | 7 | 15 |
| Įranga | 10 | 5 | 12 |
| Pardavėjas | 5 | 5 | 6 |
| Paklausa | 5 | 7 | 3 |
| Skelbimo kokybė | 5 | 3 | 3 |

**Nežinoma ≠ blogai:** jei komponento įvertinti negalim, jo svoris
perskirstomas kitiems, o vartotojui parašoma, ko neįvertinom.

| Balas | Lygis |
|---|---|
| ≥ 85 | TOP GALIMYBĖ |
| ≥ 75 | LABAI VERTA ANALIZUOTI |
| ≥ 65 | VERTA ANALIZUOTI |
| ≥ 55 | REIKIA PATIKRINTI |
| ≥ 45 | SILPNESNIS PASIŪLYMAS |
| < 45 | ATMESTI |

Lietuvos registro punktai (likvidumas, ridos norma, retumas, nurašymai, kuras)
**balo nekeičia** — tai kontekstas.

---

## Ką rašydamas radau ir kas netaisyta

| # | Kas | Kaina / poveikis | Būsena |
|---|---|---|---|
| 1 | Autogido kuro filtras nepasiekia portalo | kiekviena autogido paieška moka ir už kitų kurų puslapius | taisoma v2.4.3 |
| 2 | Hibridai atmetami kaip „Ridos neatitikimas" | 260 archyvo skelbimų, kiekvienoje paieškoje | taisoma v2.4.2 |
| 3 | EV su baterija atmetami filtruojant „Elektrinis" | visi autoplius EV | taisoma v2.4.2 |
| 4 | Mažos kainos (900 €, 2 200 €) nepažymimos | į „geriausius" gali patekti lizingo įmokos | **netaisyta**, priežastis neaiški |
| 5 | otomoto rikiuoja pigiausius viršuje | šališka imtis | **netaisyta** |
| 6 | otomoto PLN kursas ranka | kaina gali nukrypti kelis % | **netaisyta** |
| 7 | autoscout24 / otomoto be kuro filtro | mokam už nereikalingus puslapius | taisoma v2.4.3 |
