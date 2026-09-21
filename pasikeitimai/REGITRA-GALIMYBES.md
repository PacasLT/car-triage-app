# Regitra – ką turim ir ką rodom (Nr. 46, 2026-09-22)

**Kas nusprendžia, ką rodyti:** `backend/regitra.js`, funkcija `punktai()`.
Ribas nustatė analitikas (A-29/A-30/A-32) pagal kvartilius, ne ranka.
Taisyklė: punktas rodomas **tik kai tai žinia** – „rida įprasta" ar „vidutinis
likvidumas" nerodomi. Balo (CarTriige įvertinimo) registras **nekeičia**.

Šaltinis: Regitros atviri TP parko duomenys, 1 343 modeliai, duomenys iki 2026-06.

## Rodoma dabar (5 punktai, kai suveikia)

| Punktas | Kada rodomas | Pavyzdys |
|---|---|---|
| LIKVIDUMAS 🟢 | ≥ 26 % modelių per metus keičia savininką | „LT rinkoje 28 % per metus keičia savininką – judrus modelis" |
| LIKVIDUMAS 🟡 | ≤ 13 % | „…tik 11 % – lėtas pardavimas" |
| RIDOS NORMA 🟡 | km/metus mažiau nei 10 % tokio pat amžiaus modelių | „…mediana 17 323 km/metus. Paklauskite dėl serviso istorijos" |
| RETUMAS 🟡 | registruota < 300 | „Lietuvoje registruoti tik 136" |
| NURAŠYMAI 🟡 | auto ≥ 12 m. ir > 40 % 15+ m. nebeleidžiami eisme | „48,7 % … nebeleidžiami eisme" |
| KURAS 🟡 | skelbimo kuras ≤ 10 % modelio parko | „tik 8 % šio modelio yra hibridas" |

## Duomenys, kurių turim, bet NErodom

| Duomuo | BMW X5 pavyzdys | Galimas punktas |
|---|---|---|
| Parko dydis | 11 878 | „Lietuvoje 11 878 tokių – plati detalių ir meistrų rinka" |
| Importas per 12 mėn. | 1 021 | „Per metus įvežta 1 021" |
| Importo tendencija (36 mėn.) | 57 → 104 per mėn. | „Įvežimas auga (+80 % per 3 m.) – kaina gali kristi" |
| Kilmės šalys | DEU 461, BEL 95, NLD 81 | „Dažniausiai vežami iš Vokietijos" + ar skelbimo šalis tipinė |
| Kuro pasiskirstymas | dyzelis 68 %, benz. 14 %, PHEV 8 % | (dabar tik kai kuras retas) |
| Pavarų dėžė | automatinė 76 % | „Mechaninė – tik 24 % – siauresnis pirkėjų ratas" |
| Kėbulas | universalas 89 % | panašiai kaip dėžė |
| Rida parke | mediana 219 392 km | „Ši rida mažesnė nei 75 % LT X5" |
| Senų (15+ m.) dalis | 40,6 % | amžiaus kontekstas |

## Klausimas Lukui

Kurie iš „nerodomų" verti vietos skelbimo puslapyje? Siūlau pradėti nuo trijų:
**importo tendencija**, **pavarų dėžė** (kaip kuras) ir **kilmės šalis**.
Atsakymas pranešime Nr. 46: sąrašas arba „visi" / „nieko".
