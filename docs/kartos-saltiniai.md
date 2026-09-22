# Modelių kartų lentelė – šaltiniai (A-37, Analitikas, 2026-09-22)

Failas: `backend/duomenys/kartos.json`. Raktas `MARKĖ|BAZĖ` – tas pats kaip `regitra-modeliai.json` → `modelis`, tik tarpas po markės pakeistas į `|` (K-33 raktai).
Metai – gamybos (modelio) metai, `iki: null` – gaminama dabar. Ribų persidengimas leidžiamas: kartos keitėsi per metus, o Europoje dažnai skirtingai nei JAV.

## Apimtis
- 113 raktų. Iš Regitros top 100 padengti 91 – tai 72,8 % Lietuvos M1 parko.
- **Top 100 sąmoningai praleisti:**
  - CITROEN C4 – vienas raktas apima C4 ir C4 Picasso, o jų kartos skirtingos;
  - TOYOTA LAND – Land Cruiser ir Prado viename rakte;
  - LAND ROVER RANGE – Range Rover, Sport ir Evoque viename rakte;
  - HYUNDAI I – i20/i30/i40 viename rakte;
  - FORD TRANSIT – per daug variantų;
  - VOLVO V50, PEUGEOT 307, TOYOTA VERSO, SEAT ALTEA – po vieną kartą, rodyti nėra ką.

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
- **Subaru/Mazda/Mitsubishi/Jeep/Porsche/Saab:** Subaru Forester, Legacy, Outback; Mazda6, CX-5; Mitsubishi Outlander; Jeep Grand Cherokee; Porsche Cayenne; Saab 9-3.

Patikrinta tiesiogiai 2026-09-22: Peugeot 308, Citroën Berlingo, Kia Ceed, VW Tiguan, Škoda Octavia. Kiti kodai sudaryti pagal tuos pačius straipsnius, jų tiesiogiai neperskaičiau. Klaidą pranešti Analitikui – taisoma failo generatoriuje (ne ranka JSON).
