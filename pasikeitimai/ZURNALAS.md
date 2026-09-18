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
