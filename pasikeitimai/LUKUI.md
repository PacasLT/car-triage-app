# Lukui · 2026-10-16 (v2.18.0)

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min. Perrašo Klaudijus po kiekvieno leidimo.

## Leidimai
- **v2.18.0 paruošta, laukia push.** Sargai 21 žali (`rinkos` 23/23, `tarsos-mokestis` 27/27). `migracija` krenta abiejose aplinkose dėl `better-sqlite3` ABI – nesusiję su šiuo darbu.

## Sprendimai, kurių laukiu
| Nr. | Kas | Ko reikia iš tavęs |
|---|---|---|
| KL-1016-KASTAI | Parsivežimo kaštai – patikslinimas | Primesta iš viešų šaltinių (DE 450, PL 300, EU 700 € transportas; viso DE 750 €). Kai turėsi tikrus savo vežėjų ir paruošimo skaičius – pakeisiu vienoje vietoje (`backend/rinkos.js`). |
| KL-1016-PARUOSIMAS | Paruošimas 250 € | Vienintelis skaičius be viešo šaltinio. Kiek realiai kainuoja paruošti auto pardavimui? |
| KL-1016-UZSAKYMAS | Trijų rinkų rodinys | Tavo „taip darom“. ~2 d. + dizainerio paketas. Ar siunčiu dizaineriui užsakymą dabar? |
| KL-1016-PERPARDAVEJAMS | Tik perpardavėjams | Tavo „taip darome viską kaip perpardavinėtojams“. Paruošiu atskirą peržiūrą: ką išmesti ir kaip keičiasi kliento kortelė. |
| KL-1006-RADARAS | Radaras | Tas pats planuoklis kaip užsakymo sekimui – verta daryti kartu. |
| FN-0922-1310 | ScraperAPI Startup (149 $) | Be jo nei radaras, nei užsakymų sekimas netelpa į fondą. |
| FN-0922-1600/1700 B | `planai.js` kainodara | Vienintelis darbas, blokuojantis pilotus. |

## Perdavimai
- [ ] Finansininkui: Q-4–Q-7 atsakyta `SAVIKAINA-DUOMENYS.md` §6. Plano kaina, PVM – iš tavęs.
- [ ] Dizaineriui: `dz-perpardavejas` paketas (`PERPARDAVEJO-APLINKA.md` §7) – laukia tavo „siųsk“.

## Sprendimai ir klausimai → **Luko eilė**
https://claude.ai/artifact/KfPvoTLDL83GtRYHobaXtu – taisyklė `claude/LUKUI-TAISYKLE.md`.

## Patikra produkcijoje po v2.17.0
| Kas | Kur | Ką pažiūrėti |
|---|---|---|
| Rinkos antraštė | paieška su DE/PL portalais → kortelė | vietoj „RINKOS VIDURKIS“ turi rašyti „VOKIETIJOS RINKA“ / „LENKIJOS RINKA“ |
| ≈ Lietuvoje | ta pati kortelė, užsienio skelbimas | eilutė „≈ LIETUVOJE“ su suma; užvedus – iš ko sudėta |
| Nuolaidos dydis | tas pats vokiškas skelbimas | procentas turi SUMAŽĖTI, palyginus su anksčiau – tai ir yra pataisos esmė |
| LT skelbimai | tik autoplius/autogidas paieška | niekas nepasikeitė, „≈ Lietuvoje“ eilutės nėra |

## ⚠ ScraperAPI
- Likutis buvo **10 397 kr.** (09-24). Radaras ir užsakymų sekimas be Startup plano netelpa – **FN-0922-1310**.
