# Užduotis dizaineriui · dz-nuoroda

**Data:** 2026-10-16 · **Nuo:** Klaudijus · **Veidrodis:** v2.20.0
**Dydis:** mažas – du nauji elementai, visa kita jau yra

---

## Kam tai

Realus perpardavėjo rytas: **kažkas atsiuntė nuorodą** – klientas, pažįstamas, grupė.
Reikia atsakymo per minutę: *verta ar ne, ir už kiek pirkti*.

Šiandien tam reikia paleisti visą paiešką – per lėta ir per brangu vienam skelbimui.
Nauja funkcija: **įklijuoji nuorodą → gauni pilną analizę**, be jokios paieškos.

Tai ir yra kasdienio įpročio kabliukas: įrankis, kurį atsidarai ne todėl, kad planavai,
o todėl, kad prireikė.

---

## Kas jau yra ir nekeičiama

- **Pinigų blokas** – jūsų `54 sk. .ct-money` iš 68 paketo. Tas pats MAX / ≈LT / pelnas,
  ta pati `.is-key.is-cap` „iki" elgsena.
- **Skelbimo analizės langas** – egzistuoja nuo seniai (nuotraukos, defektai, VIN, rizika).
- **Tušti ekranai** – `.ct-state`.
- **Modelio apžvalga ir klausimų laukas** – veikia.

Tad prašom tik **dviejų naujų dalykų**.

---

## 1. Įvesties laukas

```
┌──────────────────────────────────────────────────┐
│  Įklijuok skelbimo nuorodą                       │
│  ┌────────────────────────────────────────────┐  │
│  │ https://suchen.mobile.de/...               │  │
│  └────────────────────────────────────────────┘  │
│                              [ Analizuoti ]      │
│  autoplius · autogidas · autoscout24 ·           │
│  otomoto · mobile.de                             │
└──────────────────────────────────────────────────┘
```

**Klausimas jums – kur jis gyvena?** Trys variantai, ir mes neturim stipraus favorito:

- **a)** paieškos puslapio viršuje, virš filtrų – antras, siauresnis įėjimas;
- **b)** atskiras puslapis `/nuoroda.html`;
- **c)** nuolatinis siauras laukas antraštėje, visuose puslapiuose.

Mūsų linkimas į **a)**: perpardavėjas atsidaro tą patį puslapį dėl abiejų priežasčių, o
atskiro puslapio niekas neranda. Bet jei matot kitaip – jūsų sprendimas.

**Būsenos, kurių reikia laukui:**

| Būsena | Kada | Ką rodom |
|---|---|---|
| tuščias | pradinė | pavyzdys ir penki portalų vardai |
| netinkamas | ne nuoroda | „Čia ne nuoroda" |
| svetimas portalas | pvz. ebay | „Šito portalo neskaitom. Veikia: …" |
| dirba | 10–20 s | **būtina** – nuskaitymas ir AI užtrunka |
| kartota | tas pats URL tą dieną | „Analizuota prieš 2 val." + rezultatas iškart, 0 kreditų |

Laukimo būsena svarbi: 10–20 sekundžių be nieko atrodo kaip lūžis. Ar progreso juosta,
ar žingsniai („skaitom skelbimą… lyginam su rinka… vertinam"), ar kas nors trečia – jums.

---

## 2. „Rinka nepatikslinta" – naujas, su mokama išeitimi

Čia vienintelė tikrai nauja dizaino problema.

Pinigų skaičiai (MAX, pelnas, ROI) remiasi į **Lietuvos** tos kartos medianą. Jei mūsų
archyve tokių skelbimų per mažai, mes **neskaičiuojam** – rodyti skaičių iš vokiškos kainos
būtų melas.

Bet yra išeitis: galim nuskenuoti tą modelį dabar, už **25 kreditus**, ir po ~20 s skaičiai
atsiras. Tad reikia būsenos, kurioje:

- pinigų blokas yra matomas, bet **neaktyvus** (ne paslėptas – žmogus turi matyti, ko jam trūksta);
- paaiškinta **kodėl** („Lietuvoje tokių radom tik 2");
- vienas mygtukas su **aiškia kaina**: „Patikslinti rinką · 25 kr.";
- po paspaudimo – ta pati laukimo būsena, tada skaičiai užsipildo.

Svarbu: **niekada tyliai neišleidžiam kreditų.** Kaina mygtuke, ne po juo.

Visa kita analizėje (nuotraukos, defektai, rizika, apžiūros sąrašas) rodoma normaliai –
jie nepriklauso nuo rinkos.

---

## 3. Telefonas

Tas pats klausimas kaip lentelėje: žmogus stovi prie automobilio arba sėdi autobuse ir
gavo nuorodą. Laukas turi būti pasiekiamas viena ranka, mygtukas ≥44 px, o rezultate
pirmas ekranas – pinigai, ne nuotraukos.

---

## Ko NEreikia

- Naujo pinigų bloko – `.ct-money` tinka.
- Naujos analizės kortelės – esama veikia.
- Istorijos ar sąrašo įklijuotų nuorodų – kol kas ne.

---

## Ką pamatuoti

1280 ir 390: laukas, laukimo būsena, „rinka nepatikslinta" su mygtuku, ir normalus
rezultatas su pilnais skaičiais.
