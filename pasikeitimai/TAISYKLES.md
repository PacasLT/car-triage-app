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
| `BUSENA.md` | Klaudijus | Viena lentelė: kas atidaryta, kieno ėjimas. Perrašoma, ne pildoma. |
| `ZURNALAS.md` | Klaudijus | Klausimai ir atsakymai. **Tik pridedama į galą**, senų įrašų netrinam. Dizainerio atsakymus perkelia Klaudijus iš paketo (žr. žemiau). |
| `matavimai/` | Klaudijus | Ekranvaizdžiai ir skaičiai, į kuriuos rodo žurnalo įrašai. |
| `is-dizainerio/NN-tema/` | Dizaineris | Jo paketai, kiekvienas savo aplanke su numeriu ir tema. Klaudijus įdiegia ir aplanką ištrina. |

## Dizaineris aplanką SKAITO, bet nerašo

Prijungtas aplankas jam yra tik skaitymui. Vadinasi, jis fiziškai negali nei
įrašyti `A-nn` į žurnalą, nei atnaujinti savo eilutės `BUSENA.md`. Todėl:

**Paketas yra vienintelis jo kanalas.** Kiekviename pakete jis palieka du
failus, o Klaudijus juos perkelia diegdamas — tai privalomas įdiegimo žingsnis,
ne malonė:

```
pasikeitimai/is-dizainerio/NN-tema/
    ct-dizainas.css
    PASTABOS.md              ← kas pakeista, kurie skyriai, koks principas
    ZURNALAS-PRIDETI.md      ← turinys keliauja į ZURNALAS.md galą
    BUSENA-EILUTES.md        ← eilutės, kurias Klaudijus įrašo į BUSENA.md
```

Klaudijaus įdiegimo žingsniai, iš eilės:
1. Perkelti `ZURNALAS-PRIDETI.md` turinį į `ZURNALAS.md` galą (tekstas
   nekeičiamas — tai jo žodžiai).
2. Įrašyti `BUSENA-EILUTES.md` eilutes į `BUSENA.md`.
3. Įdiegti failus į `frontend/`, pamatuoti naršyklėje (1400 ir 390 px, 0 JS klaidų).
4. Pakelti versiją `versijos.js`.
5. Ištrinti `NN-tema/` aplanką ir parašyti žurnale, ką įdiegė ir ką pamatavo.

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

## Kanalas yra traukiamas, ne stumiamas

Pranešimo niekas negauna. Abu skaito `BUSENA.md` ir `ZURNALAS.md` **pradėdami
sesiją**. Todėl įrašas pats savaime kito pusės nepasiekia.

Vienintelis rankinis žingsnis, kuris liko: kai kas nors įrašoma, Lukas parašo
kitai pusei **„Patikrink žurnalą"**. Vienas žodis, ne turinys.

Klaudijus **privalo** apie tai priminti kiekviename atsakyme, kuriame rašė į
žurnalą – atskira eilute, atsakymo gale. Be to priminimo klausimas gali guleti
valandą, o abi pusės lauks viena kitos.

## Ko niekada nedarom

- Dizaineris **neredaguoja** nieko `frontend/` ir `backend/` viduje — net savo
  `ct-dizainas.css`. Jo pakeitimai keliauja per `is-dizainerio/NN-tema/`, nes
  įdiegimas apima matavimą, versijos pakėlimą ir įrašą žurnale.
- Dizaineris **skaito** `frontend/` laisvai — ten jo failai tokie, kokie realiai
  įdiegti.
- Klaudijus **neredaguoja** `ct-dizainas.css`, `ct-mygtukai.css`.
- Niekas neredaguoja svetimo žurnalo įrašo. Klysta — rašomas naujas.
- Slapti raktai (`ANTHROPIC_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`,
  `INVITE_CODES`, `SCRAPER_API_KEY`) čia nerašomi niekada.
