# Lukui · 2026-10-19 · v2.28.0 (laukia push)

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min.

## Leidimai

| Kas | Ko reikia |
|---|---|
| **v2.28.0 push** | Atsakyk „push“. Sargai 28 žali, tokenai 0 + 0. |

## Patikra produkcijoje (po deploy, ~3 min.)

Atidaryk bet kurio **BMW 5, X3, X5, Audi A4/A6/Q5, VW Golf/Passat/Tiguan/Touran,
Škoda Octavia/Kodiaq, Toyota Corolla/RAV4** skelbimo pilną apžvalgą.

Rinkos bloke po „PANAŠIŲ SKELBIMŲ“ turi atsirasti trys naujos eilutės:

| Eilutė | Ką rodo |
|---|---|
| PROGNOZĖ | kiek turėtų kainuoti toks pat auto pagal amžių, ridą, galią, kurą |
| PADĖTIS | „pigesnis nei 90 %“ / „kaina atitinka lygį“ / „brangesnis nei 75 %“ |
| PAGRĮSTA | kiek skelbimų ir kokia paklaida (±11–21 % pagal modelį) |

**Vienas klausimas, į kurį tik tu gali atsakyti:** ar prognozė atitinka tai, ką
pats pasakytum apie tą auto? Jei ji sistemingai per aukšta arba per žema –
pasakyk modelį, metus, ridą ir savo skaičių. Koeficientai keičiami failu, be kodo.

Jei trijų eilučių nėra – normalu šiais atvejais: modelio nėra tarp 14; rida
tuščia arba < 1 000 km; amžius, rida ar galia už imties ribų; lizingo įmoka.
Tada lieka senasis vidurkis, kaip iki šiol.

## Sprendimai, kurių laukiu

| Nr. | Kas | Ko reikia |
|---|---|---|
| **KL-1019-0500** | Ar kainos kreivę kelti į **balą ir į maržą**? | Dabar ji tik rodoma. Balas, 12/15 % slenksčiai, filtras „žemiau rinkos“, „galimai daužtas“ ir MAX pirkimo kaina toliau remiasi senuoju vidurkiu. Perkėlimas patikslintų visus juos, bet pajudintų skaičius, kuriuos jau pažįsti. Mano siūlymas: pirma pasižiūrėk savaitę, kaip prognozė atitinka tavo nuojautą, tada keliam. |
| KL-1019-0215 | Nuorodos laukas gyvai + pigumo kainos log eilutė | Laukia nuo 10-19. |
| KL-1018-1935 | Remonto kaštų intervalai A/B/C/D | A 150–400, B 400–1 200, C 1 200–3 000, D 2 500–6 000 €. **Be jų MAX formulė stovi.** |
| KL-1019-0220 | „Patikslinti rinką 25 kr.“ mygtukas | Tavo atsakymas: „Pirma pažiūrėsiu, kiek kartų trūksta“. |
| KL-1016-NUOLAIDA | −3 % nuo LT medianos | Laukia tavo patikros nuo 10-16. |
| FN-0922-1600/1700 B | `planai.js` kainodara | Vienintelis darbas, blokuojantis pilotus. |

## Kas padaryta šiandien

- **Kainos kreivė (v2.28.0).** Kaina nebelyginama su vienu modelio vidurkiu – lyginama su tokio pat amžiaus, ridos, galios ir kuro automobiliu. Paklaida **16,6 %** vietoj **54,5 %**. Blogiausiai vidurkis klydo VW Touran (81 %), geriausiai veikia Kodiaq (11 %).
- **Analitiko skaičius perskaičiavau pats.** Kainos kreivės ir pardavėjo tipo radiniai pasitvirtino. **Faceliflo priedas +5–7 % – ne**: su laiko trendu jis 0 ± 3 proc. p., o be trendo auga su langu (+6,2 % → +18,7 %) ir net netikra riba duoda +9,6 %. Tavo sprendimu grąžinta analitikui užbaigti.
- **Pardavėjo tipas:** įmonės skelbimas +7,7 % (ne +9,0 %), garantija +9,2 %. VIN, nuotraukų skaičius ir teksto ilgis kainos neskiria – į produktą neeina.
- Naujas sargas 62 patikros; patikrintas tyčia sulaužant kodą tris kartus.
- Rasta ir ištaisyta klaida (K-78): skelbimas be metų būtų gavęs prognozę, pagrįstą niekuo – `Number(null)` yra nulis, o nulis atrodo kaip tikras skaičius.

## Kas laukia ne tavęs

| Kas | Pas ką |
|---|---|
| Kartų pradžios mėnesiai → kartos premija | Analitikas |
| Faceliflo priedo perskaičiavimas su trendu | Analitikas |
| K-73a, K-75, K-76 (priedų 26 ir 27 blokai) | Dizaineris |
