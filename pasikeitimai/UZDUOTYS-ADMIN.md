# Administravimo panelė · maketas ir užduotys

Dizainerio maketas (2026-09-18) sudėliotas pagal šoninį meniu su keturiomis
grupėmis. Šis failas sugretina kiekvieną maketo dalį su tuo, kas **realiai yra**
serveryje, ir paverčia skirtumą užduotimis.

## Tikrovė šiandien (2026-09-18, produkcija)

| Maketas rodo | Realiai yra |
|---|---|
| 8 412 aktyvių vartotojų | **1** |
| 1 284 nauji skelbimai / 24 h | skelbimai **saugomi**, bet nauji per parą neskaičiuojami |
| 128 moderavimo eilėje | moderavimo sąvokos **nėra** |
| 3 942 VIN užklausos / 24 h | VIN kvietimai fiksuojami kreditų žurnale |
| 37 AI įverčių apeliacijos | apeliacijų **nėra** |
| — | 5 klaidų pranešimai, 57 paieškos iš viso |

Tai nėra priekaištas maketui — iš išorės to nematyti. Bet nuo to priklauso, ką
statome: **dėžutė be duomenų yra ne tuščia būsena, o melas.** Pilna panelė su
prasimanytais skaičiais atrodytų veikianti ir slėptų, kad produkto ten nėra.

Žymėjimas: **[YRA]** veikia · **[SĄSAJA]** backend'as yra, trūksta tik ekrano ·
**[+BACK]** reikia nedidelio serverio priedo · **[NAUJA]** tikras naujas darbas ·
**[NĖRA]** funkcijos produkte nėra visai.

---

## APŽVALGA

- **Darbastalis** — **[+BACK]** Suvestinė iš to, kas jau yra: atviri pranešimai,
  nuskaitymo šaltinių būklė, vartotojų skaičius, paieškų per parą. Be
  prasimanytų KPI — keturios tikros plytelės vertingesnės už penkias gražias.
- **Ataskaitos** — **[SĄSAJA]** `/api/ataskaitos` jau yra; trūksta admin rodinio.

## TURINYS

- **Skelbimai / moderavimo eilė** — **[+BACK]**, ne [NAUJA]. **Pataisymas:
  skelbimus SAUGOME.** `listing-lifecycle.json` laiko kiekvieną kada nors matytą
  skelbimą: pirmą ir paskutinį matymą, kiek kartų matytas, modelį, metus,
  pirmą ir dabartinę kainą, pirmą ir dabartinę ridą, šaltinį, VIN, pardavėją,
  tapatybės raktą ir `dingo` žymą. `listing-timeline.json` – iki 60 kainos ir
  ridos momentų kiekvienam.

  Ko **nesaugom** – triažo rezultatų: `qualityScore`, `triageLevel`,
  `kainosIspejimas`, `itariamaZala`. Jie skaičiuojami per paiešką ir gyvena
  podėlyje su galiojimo laiku. Būtent jų ir reikia maketo stulpeliui „SIGNALAI".

  Todėl darbas yra **pridėti kelis laukus prie jau rašomo įrašo**, ne sukurti
  saugyklą. `irasytiGyvavimoCikla` kviečiamas kiekvienai paieškai — ten pat
  įrašyti ir signalus. Eilė tada yra užklausa į tai, kas jau diske.
  Kad atsirastų eilė, reikia juos rašyti į DB su būsena. **Bet pusė turinio jau
  skaičiuojama:** `qualityScore`, `triageLevel`, `kainosIspejimas` (lizingo
  įmoka), `itariamaZala` (per didelė nuolaida), `rizikosBusena`. Maketo stulpelis
  „SIGNALAI" beveik tiksliai atitinka tai, ką jau turim – tik niekur nekaupiam.
- **VIN užklausos** — **[+BACK]** Kvietimai fiksuojami kreditų žurnale
  (`veiksmas: 'vin'`). Reikia bendro sąrašo, ne po vieną vartotoją.
- **AI įverčiai** — **[+BACK]** Tas pats šaltinis (`veiksmas: 'analize'`).
  „Apeliacijų" sąvokos nėra – siūlau pervadinti į „AI analizės".
- **Palyginimai** — **[+BACK]** Tas pats (`veiksmas: 'palyginimas'`).

## ŽMONĖS

- **Vartotojai** — **[YRA]** sąrašas rodomas; **[SĄSAJA]** trūksta redagavimo:
  - **Plano keitimas** · `POST /admin/planas` `{email, planas, iki}` —
    **svarbiausias darbas visoje panelėje.** Visas pajamų modelis remiasi tuo,
    kad planus skiriate rankomis, o šiandien tai įmanoma tik komandine eilute.
  - **Kreditų pridėjimas** · `POST /admin/kreditai` `{email, kiekis, pastaba}`
  - **Vartotojo žurnalas** · `GET /admin/zurnalas?userId=` — atsako „kur nuėjo
    jo kreditai", dažniausias palaikymo klausimas.
- **Planai ir mokėjimai** — planai **[SĄSAJA]**, mokėjimai **[NĖRA]**: Stripe
  neprijungtas, tai sąmoningas sprendimas kol neaišku, kas perka.
- **Pagalbos užklausos** — **[YRA]** tai yra dabartinis klaidų sąrašas. Siūlau
  taip ir vadinti, o ne kurti antrą tokį patį langą.

## SISTEMA

- **Duomenų šaltiniai** — **[SĄSAJA]** `/admin/atsarga` jau grąžina skaitiklius
  kiekvienam keliui (talpykla / scraperapi / axios / puppeteer). Būsenos
  „VEIKIA / VĖLUOJA / KLAIDA" — **[+BACK]**, reikia laiko ir klaidų dažnio.
  **Maketo šaltiniai, kurių nėra:** mobile.de (blokuoja Akamai), Regitra API,
  draudimo partneris. Tikri keturi: autoplius, autogidas, autoscout24, otomoto.
- **Žurnalas** — **[+BACK]** kreditų žurnalas yra, bendro veiksmų žurnalo nėra.
- **Komanda** — **[NĖRA]** sistema vieno vartotojo, rolių nėra.

## Viršutinė juosta

- **Paieška „VIN, valst. nr. arba skelbimo ID"** — VIN **[+BACK]**;
  **valst. nr. [NĖRA]** – niekur nerenkamas; skelbimo ID **[NAUJA]**, nes
  skelbimai nesaugomi.
- **„SISTEMA VEIKIA"** — **[+BACK]** iš šaltinių būklės.

---

## Siūloma eilė

1. **Plano keitimas, kreditai, vartotojo žurnalas** — trys [SĄSAJA] darbai,
   didžiausia nauda, backend'as jau yra.
2. **Šoninis meniu ir darbastalis** iš tikrų duomenų — maketo karkasas be tuščių
   dėžučių.
3. **Duomenų šaltinių būklė** — pusė jau yra `/admin/atsarga`.
4. **VIN / analizės / palyginimai iš žurnalo** — vienas priedas, trys ekranai.
5. **Moderavimo eilė** — signalų įrašymas į gyvavimo ciklą, tada eilė yra užklausa. Mažiau darbo, nei atrodė iš pradžių.
