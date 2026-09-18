# Dizaineriui · kur kas guli ir kaip rašoma

Šitas failas yra jūsų pradžios taškas. Jei sesija nauja — perskaitykit jį,
tada `BUSENA.md`, tada `ZURNALAS.md`. Daugiau nieko klausti nereikia.

## Jūsų failai — juos redaguojat tik jūs

| Failas | Kas jame |
|---|---|
| `frontend/ct-dizainas.css` | Dizaino sistema. Skyriai numeruoti (1–22b). Tokenai `:root` viršuje. |
| `frontend/ct-mygtukai.css` | Mygtukų komponentas. Atskiras failas, nes taisyklių daug ir jos griežtos. |

Mes į juos nerašom niekada. Jei radom klaidą — ne taisom, o matuojam ir
klausiam žurnale (`K-nn`).

## Mūsų failai — į juos nerašot

| Failas | Kodėl jūsų nėra |
|---|---|
| `frontend/ct-priedai.css` | Laikinos atsvaros jūsų taisyklėms. Kai perimat — mes ištrinam. |
| `frontend/*.html` | Ten gyvena JS. Klasių vardai yra ir selektoriai — pervadinus lūžta funkcijos. |
| `frontend/ct-bendras.js`, `versijos.js` | Bendra logika ir versijų istorija. |
| `backend/` | Serveris. |

## Kaip atkeliauja jūsų pakeitimai

Paketą (zip arba pavieniai failai) padedat/padeda Lukas į
`pasikeitimai/is-dizainerio/`. Mes iš ten pasiimam, patikrinam ir įdiegiam.
Į `frontend/` nieko nekopijuojat patys — kitaip nepatikrintas failas atsiduria
produkcijoje.

Prie paketo — įrašas žurnale: ką pakeitėt ir kuriuos skyrius.

## Atsvaros ir kaip jos dingsta

Kai jūsų taisyklė ko nors neapima, o darbas negali laukti, mes dedam **laikiną
atsvarą** į `ct-priedai.css` su komentaru:

```css
/* ATŠAUKIMAS: ištrinti, kai dizaineris perims. */
```

`ct-priedai.css` antraštėje yra sąrašas „Perimta ir ištrinta" — ten matosi visa
istorija. Kai perimat pas save, parašot žurnale, ir mes ištrinam tą bloką tą
pačią dieną. Šiandien atsvarų yra trys: 1, 2 ir 6 blokai.

## Versija — viena vieta

`frontend/versijos.js`, sąrašo **viršuje**. Po kiekvieno pakeitimo pridedam
įrašą (versija, data, pavadinimas, pakeitimai žmogaus kalba). Antraštės ženklas
ir „Versijų istorija" langas generuojami iš to sąrašo. Jūs čia nerašot — bet
galit remtis versijos numeriu, kai klausiat „ar jau įdiegta?".

## Ką galit patikrinti patys, neklausdami

- `frontend/ct-ikonos.html` — visos piktogramos vienoje vietoje.
- `pasikeitimai/matavimai/` — mūsų ekranvaizdžiai ir skaičiai.
- `CLAUDE.md` — visos projekto taisyklės, tarp jų „Dizaino taisyklės" ir
  lentelė „Kur dar yra tas pats?" su pasikartojančiomis klaidomis.

## Vienas prašymas

Kai atsiunčiat naują skyrių, parašykit **vieną principą**, iš kurio jis išplaukia
— kaip 22 sk. („administravimas naudoja tą pačią sistemą, bet tankiau").
Iš principo galima spręsti naujus atvejus; iš taisyklių sąrašo — ne.
