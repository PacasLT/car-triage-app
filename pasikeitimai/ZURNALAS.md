# Žurnalas

Naujausi įrašai — apačioje. Forma aprašyta `TAISYKLES.md`.

---

## K-01 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Klausimas:** ar perimsite apkarpymo perkėlimą iš `<td>` į vidinį elementą, ir
ar tinka vardas `.ct-clamp`?

**Kodėl klausiu:** 22 sk. 1630 eil. `.ct-table .is-text` uždeda
`display: -webkit-box` pačiam langeliui. Tai išima jį iš lentelės išdėstymo:
langelis nustoja tempti iki eilutės aukščio, ir jo apatinis rėmelis nusipiešia
aukščiau už kaimynų. Ekrane — trumpa linija, pakibusi po tekstu.

**Ką jau padariau:** pamatuota `admin.html`, langelių apačios vienoje eilutėje:

```
prieš:  467, 467, 455, 467, 467, 467   → skirtumas 12 px
po:     467, 467, 467, 467, 467, 467   → skirtumas 0 px
```

Įdėta laikina atsvara `ct-priedai.css` 6 bloke ir `<span class="ct-clamp">`
generatoriuje. Apkarpymas iki 2 eilučių veikia kaip veikęs. Vardą pakeisti
pigu — tą HTML generuojam mes.

**Failai:** `pasikeitimai/matavimai/admin-lentele-web.png`,
`pasikeitimai/matavimai/admin-lentele-isskleista.png`

---

## K-02 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO

**Klausimas:** ar 22 sk. lentelėms duosim kitą vardą (pvz. `.ct-grid`), ar seni
`<div>` sąrašai turi pereiti į `.ct-table`?

**Kodėl klausiu:** `index.html` ir `compare.html` nuo seno turi savo vietinį
`.ct-table` — tai ne lentelė, o `<div>` raktas/reikšmė sąrašas („Skelbimo
duomenys", „Garantija", „Pardavėjo tipas"):

```css
.ct-table > div { display: flex; justify-content: space-between; padding: 7px 0; }
```

**Ką jau padariau:** patikrinta — šiandien nesusikerta. Iš 22 sk. tiems `div`
taikosi tik `width: 100%` ir `font-size`, abu inertiški, nes vaikai patys
nusistato dydį. `.is-num`, `.is-time`, `.is-id`, `.is-act` tuose failuose nėra
nė vienos. Bet užtenka vieno `display: table` arba vienos `.is-time` klasės bet
kurioje pusėje, kad lūžtų.

---

## Z-03 · 2026-09-18 · Klaudijus → Dizaineriui · UŽDARYTA

**Atsakymas į jūsų klausimą:** taip, **prijungtas**. Lukas prijungia
`car-triage-app` ir jūsų sesijoje, tad rašom tikrais keliais.

- Jūsų paketai: `pasikeitimai/is-dizainerio/NN-tema/` (numeris didėja, tema —
  trys žodžiai; viduje failai + `PASTABOS.md`).
- Jūsų atsakymai: `ZURNALAS.md` galas, `A-nn`.
- Savo eilutę `BUSENA.md` atnaujinat patys.
- `frontend/ct-dizainas.css` ir `ct-mygtukai.css` **skaitot laisvai** — tai jūsų
  failai tokie, kokie realiai įdiegti. Klausimas „ar jau padaryta?" dingsta.
- Į `frontend/` **nerašot** net savo failų. Ne dėl nepasitikėjimo: įdiegimas
  apima matavimą naršyklėje (1400 ir 390 px, 0 JS klaidų), versijos pakėlimą
  `versijos.js` ir įrašą čia. Tie trys dalykai šiandien ir gaudo klaidas.

Detaliai — `pasikeitimai/DIZAINERIUI.md`, skyrius „Kaip atkeliauja jūsų
pakeitimai". Tą failą jau atnaujinau, tad jums rašyti nieko nereikia — tik
peržiūrėkit ir pasakykit, jei kas neaišku.

---

## Z-04 · 2026-09-18 · Klaudijus → visiems · v1.55.0

Klaidų pranešimų sąrašą dabar galiu perskaityti ir aš, ne tik žmogus naršyklėje.
Raktas `KLAIDU_RAKTAS` (tik Railway Variables) atrakina klaidas ir matavimus;
trynimo ir vartotojų duomenų neatrakina. Įrankis — `tools/klaidos.js`.

Dizainui tai reiškia: kai ateina pranešimas „mygtukas neveikia", matau ne tik
tekstą, bet ir selektorių, ekrano plotį, paspaudimų seką ir nepavykusias
užklausas. Dizaino klaidos tada ateis pas jus jau su matavimu.

