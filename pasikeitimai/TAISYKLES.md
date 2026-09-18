# Bendras kanalas · CarTriige

Čia susirašinėja du Claude: **Dizaineris** (dizaino sistema) ir **Klaudijus**
(kodas, backend, matavimai). Lukas nieko neperrašinėja ir nieko nesiunčia —
kiekvienas skaito iš ten, kur kitas baigė.

## Pirmas veiksmas kiekvienoje sesijoje

1. Perskaityti `pasikeitimai/BUSENA.md` — ten parašyta, kieno dabar ėjimas.
2. Perskaityti `pasikeitimai/ZURNALAS.md` nuo paskutinio savo įrašo žemyn.
3. Dirbti. Baigus — atnaujinti `BUSENA.md` ir pridėti įrašą į `ZURNALAS.md`.

Nereikia klausti Luko „ką perduoti?" — įrašas žurnale IR YRA perdavimas.

## Failai

| Failas | Kas rašo | Kam |
|---|---|---|
| `BUSENA.md` | abu | Viena lentelė: kas atidaryta, kieno ėjimas. Perrašoma, ne pildoma. |
| `ZURNALAS.md` | abu | Klausimai ir atsakymai. **Tik pridedama į galą**, senų įrašų netrinam. |
| `matavimai/` | Klaudijus | Ekranvaizdžiai ir skaičiai, į kuriuos rodo žurnalo įrašai. |
| `is-dizainerio/` | Lukas arba Dizaineris | Čia atkeliauja dizainerio paketai. Lukas tik išpakuoja zip'ą čia — daugiau nieko. |

## Žurnalo įrašo forma

Klausimas gauna numerį `K-nn`, atsakymas — tą patį numerį su `A-nn`.

```
## K-07 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO
**Klausimas:** vienas sakinys, į kurį galima atsakyti taip/ne arba vienu vardu.
**Kodėl klausiu:** kas lūžta arba kas neaišku, jei neatsakysim.
**Ką jau padariau:** laikina atsvara / niekas / pamatuota tai ir tai.
**Failai:** pasikeitimai/matavimai/xxx.png
```

```
## A-07 · 2026-09-19 · Dizaineris → Klaudijui · UŽDARYTA
**Atsakymas:** ...
**Pakeičiau savo failuose:** ct-dizainas.css 22 sk., 1630 eil.
```

Būsenos: `LAUKIA ATSAKYMO`, `UŽDARYTA`, `ATIDĖTA`. Nieko daugiau.

## Taisyklė: dizaino sprendimas klausiamas iškart

Jei koks nors pakeitimas reikalauja **dizaino sprendimo** — naujos spalvos,
naujo vardo, naujo komponento, pasirinkimo tarp dviejų išvaizdų — Klaudijus
neatidėlioja ir nespėlioja. Tą pačią akimirką:

1. Suformuluoja klausimą `K-nn` žurnale.
2. Įdeda matavimą arba ekranvaizdį į `matavimai/`, kad būtų ką pamatyti.
3. Jei darbas negali sustoti — įdeda **laikiną atsvarą** į `ct-priedai.css`
   su komentaru `ATŠAUKIMAS: ištrinti, kai dizaineris perims`, ir tai pasako
   žurnale. Atsvara niekada nekeliauja į dizainerio failus.

Taip dizaineris gauna klausimą su įrodymu, o ne prašymą „pažiūrėk".

## Ko niekada nedarom

- Dizaineris **neredaguoja** `ct-priedai.css`, `frontend/*.html`, `backend/`.
- Klaudijus **neredaguoja** `ct-dizainas.css`, `ct-mygtukai.css`.
- Niekas neredaguoja svetimo žurnalo įrašo. Klysta — rašomas naujas.
- Slapti raktai (`ANTHROPIC_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`,
  `INVITE_CODES`, `SCRAPER_API_KEY`) čia nerašomi niekada.
