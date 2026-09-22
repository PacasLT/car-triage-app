# Regitra ir TA – ką turim ir ką rodom (Nr. 46, papildyta 2026-09-22 po K-33)

**Kas nusprendžia, ką rodyti:** `backend/regitra.js`, funkcija `punktai()`.
Ribas nustatė analitikas (A-29/A-30/A-32) pagal kvartilius, ne ranka.
Taisyklė: punktas rodomas **tik kai tai žinia** – „rida įprasta" ar „vidutinis
likvidumas" nerodomi. Balo (CarTriige įvertinimo) registras **nekeičia**.

Šaltiniai:
- **Regitra** – atviri TP parko duomenys, **957 modeliai** (po K-33 raktų pataisos; buvo 1 343), duomenys iki 2026-06. `regitra-modeliai.json`.
- **TA** – TRANSEKSTA apžiūros (data.gov.lt 2721, CC BY 4.0), 12,2 mln. įrašų, 2 150 795 automobiliai, 1 000 modelių, duomenys 2015-01 – 2025-05. `ta-modeliai.json`.

## Rodoma dabar (5 punktai, kai suveikia)

| Punktas | Kada rodomas | Pavyzdys |
|---|---|---|
| LIKVIDUMAS 🟢 | ≥ 26 % modelių per metus keičia savininką | „LT rinkoje 28 % per metus keičia savininką – judrus modelis" |
| LIKVIDUMAS 🟡 | ≤ 13 % | „…tik 11 % – lėtas pardavimas" |
| RIDOS NORMA 🟡 | km/metus mažiau nei 10 % tokio pat amžiaus modelių | „…mediana 17 323 km/metus. Paklauskite dėl serviso istorijos" |
| RETUMAS 🟡 | registruota < 300 | „Lietuvoje registruoti tik 136" |
| NURAŠYMAI 🟡 | auto ≥ 12 m. ir > 40 % 15+ m. nebeleidžiami eisme | „48,7 % … nebeleidžiami eisme" |
| KURAS 🟡 | skelbimo kuras ≤ 15 % modelio parko (`RIBOS.kuroMazuma`) | „tik 8 % šio modelio yra hibridas" |

## Duomenys, kurių turim, bet NErodom

| Duomuo | BMW X5 pavyzdys | Galimas punktas |
|---|---|---|
| Parko dydis | 12 250 | „Lietuvoje 11 878 tokių – plati detalių ir meistrų rinka" |
| Importas per 12 mėn. | 1 064 | „Per metus įvežta 1 021" |
| Importo tendencija (36 mėn.) | 51 → 89 per mėn. | „Įvežimas auga (+74 % per 3 m.)" |
| Kilmės šalys | DEU 487, BEL 95, NLD 81 | „Dažniausiai vežami iš Vokietijos" + ar skelbimo šalis tipinė |
| Kuro pasiskirstymas | dyzelis 69 %, benz. 14 %, PHEV 8 % | (dabar tik kai kuras retas) |
| Pavarų dėžė | **nenustatyta (NTST) 75 %**, automatinė 24 % | ~~„Mechaninė – tik 24 %"~~ – ankstesnė eilutė klaidinga, žr. žemiau |
| Kėbulas | universalas 89 % | panašiai kaip dėžė |
| Rida parke | mediana 221 085 km | „Ši rida mažesnė nei 75 % LT X5" |
| Senų (15+ m.) dalis | 42,1 % | amžiaus kontekstas |

## Kiekvieno punkto vertė ir rizika (Analitikas, 2026-09-22)

**Kaip skaityta „vertė".** Skelbimų duomenų analitikas nemato (BDAR), todėl vertė = kokia
**Lietuvos M1 parko dalis** (iš 1 876 309) priklauso modeliams, kurių skelbimai punktą gautų.
Tai skelbimų srauto aproksimacija: skelbimuose modelių proporcijos panašios į parko.
Punktai, kurie priklauso nuo paties skelbimo (rida, kuras, amžius), parodo **galimybę**, ne dažnį.

**Balas.** Visi žemiau esantys Regitros ir TA punktai CarTriige balo **nekeičia** – tik tekstas.

### A. Regitra – rodoma dabar

| Punktas | Šaltinis | Išmatuota vertė | Klaidingo signalo rizika | Balas |
|---|---|---|---|---|
| LIKVIDUMAS 🟢 | Regitra | 116 modelių, 13,1 % parko (Tiguan, Prius, Q5, C-HR, X3) | Taksi ir nuomos parkai (Prius) didina savininkų kaitą – „judrus" dalinai reiškia „daug perparduodamų taksi" | nekeičia |
| LIKVIDUMAS 🟡 | Regitra | 109 modeliai, 17,2 % (Astra, Avensis, Zafira, Sharan, Audi 80) | Seni modeliai keičia savininką retai, nes jie jau „galutiniuose" rankose – 🟡 gali atspindėti amžių, ne paklausą | nekeičia |
| RIDOS NORMA 🟡 | Regitra | juosta yra 66–76 % parko (4–20 m.), 0–3 m. tik 41 % | Rida užfiksuota registruojant (dažnai įvežant) – norma patempta žemyn. Corolla 4–6 m.: 77 įrašai, P10 4 296 km/m. – realiai atsukta rida praslystų | nekeičia |
| RETUMAS 🟡 | Regitra | 519 modelių, bet tik 2,9 % parko | Po K-33 retų raktų mažiau, bet neapibrėžtas raktas (pvz. „BMW X") → ⚪ „nėra suvestinėje", ne „retas" – teisinga | nekeičia |
| NURAŠYMAI 🟡 | Regitra | 236 modeliai, 12,4 % parko; tik skelbimams ≥ 12 m. | Išregistravimas ≠ gedimas: dalis išvežti eksportui (Focus, Audi 80) | nekeičia |
| KURAS 🟡 | Regitra | 697 modeliai (80,8 % parko) turi bent vieną kurą ≤ 15 % | Parke retas kuras ≠ retas skelbimuose (EV/PHEV daug naujų skelbimų, parke mažai) | nekeičia |

### B. Regitra – turim, nerodom

| Punktas | Šaltinis | Išmatuota vertė | Klaidingo signalo rizika | Balas |
|---|---|---|---|---|
| Importo tendencija | Regitra | 154 modeliai turi ≥ 10 įvež./mėn.; suveiktų (+50 % / −33 % per 3 m.) **47 modeliams, 7,7 % parko** – beveik vien EV (ID 296 %, Enyaq, EQE, Spring) | Augimas iš žemo pagrindo (Spring 13 → 123). Formuluotė „kaina gali kristi" – prognozė, jos rašyti negalima; tik faktas „įvežimas auga" | nekeičia |
| Pavarų dėžė | Regitra | **Nenaudotina.** 78 % reikšmių „NTST" (nenustatyta); mechaninių visame parke tik ~17 900 | Parašytume „mechaninė retas" apie modelį, kurio mechaninės tiesiog neužpildytos. Siūlymas iš pirmos versijos **atšaukiamas** | — |
| Kilmės šalis | Regitra | 308 modeliai (84,7 % parko) turi ≥ 30 įvež./m.; 252 iš jų pirma šalis DEU | Beveik visada „Vokietija" – tai ne žinia. Vertinga tik priešingu atveju (JAV, žr. TA) | nekeičia |
| Kėbulas | Regitra | 214 modelių (38 % parko) turi kėbulą ≤ 15 % | Kėbulas skelbimuose dažnai klaidingai pažymėtas (universalas/hečbekas) | nekeičia |
| Rida parke (bendra) | Regitra | rida_n ≥ 100 – 264 modeliai, 86,3 % parko | **Nerodyti.** Sudėti procentiliai apverčia verdiktą (A-30: 3 m. X5 „žemiau P10" bendrame, P90 savo juostoje) | — |
| Parko dydis, senų dalis | Regitra | visi | Ne žinia – pagal taisyklę nerodoma, išskyrus RETUMAS | — |

### C. TA – nauja (dar nerodoma niekur)

| Punktas | Šaltinis | Išmatuota vertė | Klaidingo signalo rizika | Balas |
|---|---|---|---|---|
| RIDOS NORMA iš TA juostų | TA | juosta (n ≥ 100) turi **82–87 % parko** (0–20 m.); prieš Regitrą **prideda 9–12 p. p.** 7–15 m. juostose ir **+40 p. p.** 0–3 m. Imtys šimtus kartų didesnės (Corolla 4–6 m.: 6 188 vs 77) | Rida matuojama apžiūroje, ne įvežant – norma tikslesnė, bet: ridą, atsuktą **prieš** įvežimą, TA taip pat įskaito. Taksi parkai kelia normą (Prius) → daugiau 🟡 sąžiningiems privatiems. Duomenys iki 2025-05 | nekeičia |
| BŪKLĖ TA pagal amžių | TA | 171 modelis (**24,7 % parko**) bent vienoje juostoje neišlaiko ≥ 10 p. p. dažniau nei visų modelių vidurkis (n ≥ 300); daugiausia 4–12 m. juostose | Didžiausi nuokrypiai – **JAV importas** (Chrysler Town 67,5 %, Buick Encore 64,2 %, Nissan Rogue 63,6 % prieš 20,5 % bazę 0–3 m.) – tai kilmės ir remonto po avarijos ženklas, ne modelio. Jauni visureigiai krenta dažniau, seni – rečiau (juostos susikerta). Formuluotė tik „šio amžiaus X pirmos TA Lietuvoje neišlaiko N % (visų modelių vidurkis M %)", niekada „nepatikimas" | nekeičia |
| Atsukimų dažnis modeliui | TA | 242 modeliai su ≥ 1 000 aut. su 2+ apžiūromis: P10–P90 **0,3–2,7 %** | Modeliai skiriasi mažai; išsiskiriantys (Audi 80 9,5 %, Prius 6,4 %, Sprinter 6,8 %) – seni skaitikliai, taksi, prietaisų keitimai. Artėja prie draudžiamos „rida atsukta". **Nerodyti modelio lygiu** | — |
| Nusinulinimų dalis | TA | P90 < 2 %; išskirtiniai seni modeliai (Escort 7,9 %) | Tik ⚪ ženklui „ridos norma nepatikima" senų modelių juostose, ne vartotojui | — |

TA ir Regitros raktai po K-33 sutampa 843 modeliams (94,6 % parko). 157 TA modeliai Regitroje neturi rakto – seni, išregistruoti (Rover 216, Daewoo Matiz); įtakos nėra.

## Siūlau pirmus (3)

1. **RIDOS NORMA iš TA juostų** (Regitra – atsarga). Ne naujas punktas, o esamo tikslesnis šaltinis: +9–12 p. p. parko 7–15 m. juostose, imtys šimtus kartų didesnės, rida matuota ne įvežimo momentu. Mažiausia rizika, nes tekstas ir 🟡 logika nesikeičia.
2. **BŪKLĖ TA pagal amžių 🟡** – tik kai skelbimo amžiaus juostoje modelis neišlaiko ≥ 10 p. p. dažniau nei bazė ir n ≥ 300. Gautų ~¼ parko modelių. Būtina: palyginimas su bazine toje pačioje juostoje ir atribucija „Šaltinis: TRANSEKSTA, CC BY 4.0".
3. **Importo tendencija** – tik faktas be prognozės, tik kai ≥ 10 įvež./mėn. ir pokytis ≥ +50 % / ≤ −33 %. Mažai (7,7 % parko), bet klaidingo signalo rizika mažiausia.

Pirmos versijos siūlymai **pavarų dėžė** ir **kilmės šalis** – atšaukti (dėžė: 78 % nenustatyta; kilmė: beveik visada Vokietija).

## Klausimas Lukui

Kuriuos punktus įgyvendinam? Atsakymas – Luko eilėje, KL-NR46: numeriai iš „Siūlau pirmus" arba kitas sąrašas.
