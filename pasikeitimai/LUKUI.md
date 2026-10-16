# Lukui · 2026-10-16 (v2.20.0 gyva)

Viskas, ko laukia tavęs. Kiekvienas punktas ≤ 1 min.

## Leidimai
- Nieko nelaukia. v2.17.0 → v2.20.0 išsiųstos, visos deploy SUCCESS.

## Dizaineris – uždaryta, nieko nelaukia
66 / 67 (Errata 17) / 68 paketai įdiegti. Du jo klausimai atsakyti ir priimti:
pristatymo dienos – rėžiu (DE 5–7, PL 3–5, EU 7–10, LT 0); tuščios rinkos tekstas –
„be ridos ribos čia būtų 7" (nemokamai iš `hardRejectReasons`).
Jo maketai perdaryti su tavo skaičiais; Octavia sutampa su mūsų skaičiavimu.

## Dabar viskas stovi ant MANĘS – vienas darbas

| Darbas | Laikas | Kas po jo atsiranda |
|---|---|---|
| **Perpardavėjo rodinio markupas** | ~2 d. | Visas 66+68 paketų dizainas tampa matomas: tanki lentelė, trys rinkos, būklės filtras, pirkimo sąrašas. Kartu ir `admin.html` → `.ct-dtable`. |

Iki tol CSS yra įdiegtas, bet **niekur nenaudojamas** – ekrane tu jo nematai.

## Sprendimai, kurių laukiu
| Nr. | Kas | Ko reikia |
|---|---|---|
| KL-1016-NUOLAIDA | −3 % nuo LT medianos | Veikia, bet tavo nepatvirtinta. Octavia max 15 543 € (be nuolaidos ~16 100 €). Palikti 3 %? |
| KL-1016-NUORODA | Nuorodos analizė | Įklijuoji linką → pilna analizė. ~2,5 d. Darom? Ir kiek nuorodų per parą pagal planą (siūlau Pro 10, Verslas 50). |
| FN-0922-1600/1700 B | `planai.js` kainodara | **Vienintelis darbas, blokuojantis pilotus.** Siūlau daryti PO perpardavėjo peržiūros. |
| FN-0922-1310 | ScraperAPI Startup 149 $ | Be jo radaras ir užsakymų sekimas netelpa į fondą. |
| KL-1006-RADARAS | Radaras | Tas pats planuoklis kaip užsakymų sekimui – verta daryti kartu. |

## Kas padaryta šiandien (v2.17.0 → v2.20.0)
- Kaina lyginama su **savo šalies rinka** (LT/DE/EU/PL), ne su mišiniu. Vokiškas skelbimas nebeatrodo kaip radinys vien dėl rinkos skirtumo (−27 % → −5 %).
- **≈ Kaina Lietuvoje**: tikri kaštai iš viešų šaltinių + **taršos mokestis** (EV/PHEV 0 €, 3 l dyzelis ~200 €).
- **Didžiausia pirkimo kaina** – marža 10 %, paruošimas 350 €. Octavia: max 15 543 €, „telpa +1 043", pelnas 2 679 €, ROI 17 %.
- Rasta ir ištaisyta klaida: nauji laukai nepasiekdavo ekrano (baltasis sąrašas serveryje).
- Dizaino tokenų skola: **0 sulūžusių, 0 negyvų** – pirmą kartą.
- Sargai 22 žali (buvo 20), trys nauji: `rinkos`, `tarsos-mokestis`, `max-pirkimo`.

## Patikra produkcijoje
| Kas | Kur | Ką pamatysi |
|---|---|---|
| Rinkos antraštė | paieška su DE/PL | „VOKIETIJOS RINKA" vietoj „RINKOS VIDURKIS" |
| ≈ Lietuvoje | užsienio skelbimas | suma; užvedus – kaina + transportas + registracija + TA + paruošimas + tarša |
| Nuolaidos dydis | vokiškas skelbimas | procentas turi būti MAŽESNIS nei anksčiau |
