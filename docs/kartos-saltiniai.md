# Modelių kartų lentelė – šaltiniai (A-37, Analitikas, 2026-09-22)

Failas: `backend/duomenys/kartos.json`. Raktas `MARKĖ|BAZĖ` – tas pats kaip `regitra-modeliai.json` → `modelis`, tik tarpas po markės pakeistas į `|` (K-33 raktai).
Metai – gamybos (modelio) metai, `iki: null` – gaminama dabar. Ribų persidengimas leidžiamas: kartos keitėsi per metus, o Europoje dažnai skirtingai nei JAV.

## Apimtis
- **184 raktai.** Iš Regitros top 300 padengti 184, top 100 – 91. Tai 78,3 % Lietuvos M1 parko.
- Etapas 1 (A-37): top 100. Etapas 2 (A-39): vietos 101–300.
- **Top 100 sąmoningai praleisti:**
  - CITROEN C4 – vienas raktas apima C4 ir C4 Picasso, o jų kartos skirtingos;
  - TOYOTA LAND – Land Cruiser ir Prado viename rakte;
  - LAND ROVER RANGE – Range Rover, Sport ir Evoque viename rakte;
  - HYUNDAI I – i20/i30/i40 viename rakte;
  - FORD TRANSIT – per daug variantų;
  - VOLVO V50, PEUGEOT 307, TOYOTA VERSO, SEAT ALTEA – po vieną kartą, rodyti nėra ką.

- **101–300 vietose praleista 116 raktų.** Dvi priežastys:
  - vienos kartos modeliai – rodyti nėra ką (pvz. Karoq, Yeti, Kamiq, Antara, 407, XC40, Tesla Model 3/Y, Q8, ID. šeima);
  - raktas, kuriame susimaišę keli modeliai arba kodai neaiškūs (pvz. VW T, VW NEW, VW KOMBI, AUDI 8D, FORD GRAND, FORD TOURNEO, FORD FUSION, KIA BL, MERCEDES AMG, CHRYSLER GRAND, DODGE GRAND, SUZUKI GRAND, MITSUBISHI SPACE, BMW 2 (F22/F45/F44), Opel variantų raktai ASTRA-G-*, VECTRA-C-*).
- Mercedes GLE / GL / GLS kodai – SUV versijų (kupė C292/C167 atskirai neišskirti).

## Kodų taisyklė
- Kodas rašomas tik tada, kai jis įprastas rinkoje:
  - BMW E/F/G;
  - Mercedes W/X;
  - VW/Audi/Seat/Škoda tipų kodai ir B/C platformos;
  - Toyota/Lexus E/XA/XP/XW/AX/AL;
  - Nissan J/T/F/E/N;
  - Kia/Hyundai;
  - Subaru;
  - Mazda;
  - Honda Jazz;
  - Porsche;
  - Jeep;
  - Opel raidės;
  - Ford Mk.
- Kitais atvejais – „N karta“ (Volvo, Renault, Dacia, Peugeot, Citroën, Honda CR-V/Civic/Accord, Mitsubishi, Saab, naujausios Tiguan/Q5/Q3/Superb/Kodiaq kartos).
- Škoda Octavia: rinkoje įprasti A5/A7/A8; pirmajai kartai – „1 karta“ (A4 pavadinimas mažai naudojamas).
- Peugeot 308 ir Citroën Berlingo T9/P5, M49/B9 kodai Wikipedijoje nepatvirtinti → pakeisti kartos numeriais.

## Šaltiniai pagal markę
Anglų Wikipedia straipsniai apie kiekvieną modelį (skiltys „First/Second… generation“ su kodu ir gamybos metais):
- **VW:** Volkswagen Golf, Passat, Polo, Touran, Tiguan, Sharan, Caddy, Transporter, Touareg, Jetta.
- **Audi:** Audi A3, A4, A5, A6, 80, 100, Q3, Q5, Q7.
- **BMW:** BMW 1/3/5/7 Series, X1, X3, X5 (+ BMW chassis codes list).
- **Mercedes-Benz:** Mercedes-Benz A/B/C/E/S-Class, M-Class, GLC.
- **Toyota/Lexus:** Toyota Corolla (E110–E210), RAV4, Avensis, Yaris, Auris, Prius, C-HR; Lexus RX, NX.
- **Škoda/Seat:** Škoda Octavia, Superb, Fabia, Kodiaq; SEAT Leon, Ibiza, Alhambra.
- **Opel:** Opel Astra, Zafira, Vectra, Insignia, Meriva, Corsa, Vivaro, Mokka.
- **Ford:** Ford Focus, Fiesta, Mondeo, Galaxy, S-Max, Kuga, C-Max.
- **Volvo:** Volvo XC60, XC90, XC70, V70, V60, V40, S60, S80.
- **Nissan:** Nissan Qashqai, X-Trail, Juke, Almera, Note.
- **Renault/Dacia/Peugeot/Citroën:** Renault Mégane, Clio, Laguna, Espace, Trafic; Dacia Duster; Peugeot 308, 508, 2008, 3008, 5008; Citroën C3, C5, Berlingo.
- **Kia/Hyundai:** Kia Sportage, Ceed, Sorento; Hyundai Tucson, Santa Fe.
- **Honda:** Honda Civic, CR-V, Accord, Jazz.
- **Etapas 2 papildomai:** Mazda 2/3/5/323/626; BMW X4/X6/4/6 Series; Audi A7/A8/allroad; Mercedes CLA/CLS/CLK/GLA/GLE/GL/GLS/Vito/V-Class/Sprinter; Mini Hatch; Nissan Primera/Micra/Leaf/Murano/Patrol; Toyota Camry/Aygo/Highlander/Sienna; Kia Niro; Hyundai Kona/i20; Land Rover Freelander/Discovery; Subaru Impreza/XV; SEAT Toledo/Córdoba; Ford Mustang/Edge; Jeep Cherokee/Compass; Lexus IS/GS; Fiat Punto; VW Crafter; Porsche 911/Panamera; Jaguar XF; Chrysler Voyager/Town & Country; Renault Captur/Scénic/Kangoo/Master/Koleos; Peugeot Partner/208/Expert; Citroën Jumper; Dacia Sandero; Honda HR-V; Opel Omega; Saab 9-5; Mitsubishi Pajero.
- **Subaru/Mazda/Mitsubishi/Jeep/Porsche/Saab:** Subaru Forester, Legacy, Outback; Mazda6, CX-5; Mitsubishi Outlander; Jeep Grand Cherokee; Porsche Cayenne; Saab 9-3.

Patikrinta tiesiogiai 2026-09-22: Peugeot 308, Citroën Berlingo, Kia Ceed, VW Tiguan, Škoda Octavia. Kiti kodai sudaryti pagal tuos pačius straipsnius, jų tiesiogiai neperskaičiau. Klaidą pranešti Analitikui – taisoma failo generatoriuje (ne ranka JSON).

## Atnaujinimas (`atn`, v2.10.6)
Laukas `atn` – metai, kai pradėtas gaminti atnaujintas kartos variantas (BMW – LCI, kitur – facelift). Faktas, ne vertinimas. Užpildyta: BMW 1, 3, 4, 5, 6, 7, X1, X3, X4, X5, X6 (Klaudijus, gamintojo pranešimai / Wikipedia generacijų straipsniai). Kitoms markėms pildo Analitikas generatoriuje (`ATN` žodynas).


## Atnaujinimai (`atn`) – A-41, 2026-09-23

`atn` – metai, kai Europai pradėtas gaminti atnaujintas kartos variantas. Žymimi tik atnaujinimai su nauja išvaizda ir (ar) įranga, kurie keičia kainą. Modelio metų smulkmenos nežymimos.
- **Iš viso:** 97 raktai, 187 kartos.
- **Kai kartos atnaujintos du kartus**, žymimas didesnis atnaujinimas:
  - Touran 1T – 2010 (ne 2006);
  - Caddy 2K – 2015;
  - Avensis T270 – 2015;
  - Yaris XP130 – 2017;
  - Mégane 3 – 2014;
  - Mazda6 GJ – 2018.

**BMW (Klaudijaus užpildyta) – patikrinta.** Visi 8 prašyti metai sutampa:
- E46 2001-09, E90/E91 2008-09 (Wikipedia „BMW 3 Series (E90)“), F30 2015-07, G20 2022-07 (Wikipedia „BMW 3 Series (G20)“);
- G30 2020-07, G05 2023-03 (Wikipedia „BMW X5 (G05)“), G01 2021-06, F48 2019-07.

Pastaba: E92/E93 kupė ir kabrioleto LCI – 2010 m. (vėliau nei sedano). Lentelėje vienas skaičius visai kartai, todėl kupė 2008–2009 bus priskirtas atnaujintiems.

**Tiesiogiai patikrinta Wikipedijoje:**
- Mercedes-Benz E-Class (W212) – 2013;
- Volkswagen Golf Mk7 – pristatyta 2016-11, gamyba 2017.

Kiti metai sudaryti pagal tų pačių modelių Wikipedia straipsnių skiltis „Facelift“, ir jų tiesiogiai neperskaičiau.

**Pavadinimai rinkoje:**
- BMW – LCI;
- Mercedes – Vokietijoje MOPF, bet Lietuvos skelbimuose retas;
- VW – „Golf 7.5“, „Golf 8.5“, „Passat B5.5“ (skelbimuose dažni);
- Audi – „B8.5“ retai;
- Lietuvoje dažniausiai – „restailingas“ / „facelift“.

Rekomendacija: rodyti „facelift“ (BMW – „LCI“), Golf ir Passat B5 papildomai „7.5 / 8.5 / B5.5“.

`atnVardas` (v2.10.6, A-41): rinkoje įprastas atnaujinto varianto vardas vietoj „<kodas> facelift“ – VW Golf Mk7 → Mk7.5, Mk8 → Mk8.5, Passat B5 → B5.5 (generatoriaus žodynas `ATN_VARDAS`).


## Atnaujinimo mėnuo (`atnMen`) – A-44, 2026-09-23

**Kas tai.** `atnMen` – atnaujinto varianto **pardavimų pradžios mėnuo Vokietijoje**, ne gamybos pradžia.
- Tikrų gamybos pradžios mėnesių viešai beveik nėra: iš 64 patikrintų atvejų rasti tik 4 (Passat B5 2000-10, Sharan 7M 2000-05, W212 2013-03, X3 G01 2021-09).
- Registracijos logikai pardavimų pradžia tinka geriau: pirmosios atnaujinto varianto registracijos vyksta nuo jos.

**Šaltiniai.**
- ADAC autokatalogas (adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/…/*-facelift) – ankstyviausias atnaujinto varianto versijos pradžios mėnuo.
- de.wikipedia generacijų straipsniai (BMW_E70, BMW_F25, BMW_G01, VW_Passat_B5, VW_Golf_VIII, Mercedes-Benz_Baureihe_211/212/213/203/204/205, Opel_Astra_J/K, Opel_Zafira_B, Ford_Focus_II, Renault_Mégane_II/III, Škoda_Octavia_II, VW_Tiguan_I, VW_Touran_I, VW_Sharan_I, Audi_A6_C5/C7, Audi_A4_B8).
- Toyota Europe newsroom (Corolla 2010).

**BMW patikra (Klaudijaus reikšmės).**
- Sutampa 15 iš 18.
- Pataisyta:
  - X5 E70 9 → **6** (pardavimai 2010-06);
  - X3 F25 4 → **6**;
  - X3 G01 7 → **8** (pardavimai 2021-08; de.wiki gamybą nurodo nuo 2021-09 – šaltiniai nesutaria).
- E60 3 – tik pristatymas 2007-03, pardavimų data nenurodyta (tikėtina).

**Metai pakeisti pagal pardavimų pradžią** (atnaujinimas pristatytas metais anksčiau):
- Octavia A5 2008 → **2009** (01);
- RAV4 XA40 2015 → **2016** (01);
- Corolla E210 2022 → **2023** (02).

**Prastesni duomenys:**
- Prius XW50 2019-02 – ADAC atskiro atnaujinimo įrašo neturi, imta pagal naujas kainoraščio versijas;
- Mercedes W205 2018-07 – data gali būti tik įkraunamo hibrido.

**Apimtis.** 35 modeliai, 77 kartos (visi top 30 su `atn` + BMW).
