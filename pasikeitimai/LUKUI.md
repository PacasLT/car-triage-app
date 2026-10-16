# Lukui · 2026-10-16

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min. Perrašo Klaudijus po kiekvieno leidimo.

## Leidimai
- **v2.17.0 paruošta, laukia push.** Sargai 20 žali (`rinkos` 23/23), `migracija` krenta tik Klaudijaus aplinkoje (trynimo teisės), tavo PowerShell'yje turi praeiti.

## Sprendimai, kurių laukiu
| Nr. | Kas | Ko reikia iš tavęs |
|---|---|---|
| KL-1016-KASTAI | Parsivežimo kaštai | Transportas iš DE ir iš PL, registracija LT, TA, paruošimas pardavimui. Dabar įrašyti pradiniai orientyrai (DE 1 050 €, PL 800 €, EU 1 300 €) – jie rodomi su „≈“. |
| KL-1016-TARSA | Taršos mokestis | Ar darau `backend/tarsos-mokestis.js` iš viešos LR tvarkos (be jo rinkų palyginimas iškreiptas – PHEV 0 €, dyzelinis visureigis šimtai). |
| KL-1016-UZSAKYMAS | Užsakymas klientui | Planas `claude/UZSAKYMAS-KLIENTUI.md`. Ar einam prie 2 žingsnio (trijų rinkų rodinys)? Reikės ir dizainerio. |
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
