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

**Aplankas prijungtas ir jūsų pusėje** (Lukas prijungia `car-triage-app` jūsų
sesijoje). Vadinasi, perdavinėti nieko nereikia — rašot tiesiai.

Paketą dedat į savo aplanką su numeriu ir tema:

```
pasikeitimai/is-dizainerio/08-lenteliu-klases/
    ct-dizainas.css
    PASTABOS.md              ← kas pakeista, kurie skyriai, koks principas
    ZURNALAS-PRIDETI.md      ← keliauja į ZURNALAS.md galą, tekstas nekeičiamas
    BUSENA-EILUTES.md        ← eilutės į BUSENA.md
```

Numeris `NN` didėja, tema — trys žodžiai. Taip du paketai niekada nesusimaišo,
net jei atsiunčiat du per dieną.

**Aplanką jūs tik skaitot** — rašyti į jį negalit nei į `frontend/`, nei į
`pasikeitimai/`. Todėl paketas yra jūsų vienintelis kanalas, o `ZURNALAS-PRIDETI.md`
ir `BUSENA-EILUTES.md` perkėlimas yra privalomas Klaudijaus įdiegimo žingsnis,
įrašytas `TAISYKLES.md`. Jums rašyti niekur nereikia.

**Į `frontend/` nerašot patys** — net į savo `ct-dizainas.css`. Ne dėl
nepasitikėjimo: įdiegimas apima tris dalykus, kurie kitaip praleidžiami —
matavimas naršyklėje (1400 px ir 390 px, 0 JS klaidų), versijos pakėlimas
`versijos.js` ir įrašas žurnale. Būtent tie trys šiandien gaudo klaidas.

Įdiegęs failus iš `is-dizainerio/` ištrinu, o žurnale palieku `A-nn` arba
atskirą įrašą, ką įdiegiau ir ką pamatavau.

**Ką galit skaityti bet kada:** `frontend/ct-dizainas.css` ir
`frontend/ct-mygtukai.css` — tai jūsų failai tokie, kokie REALIAI įdiegti.
Nebereikia klausti „ar jau padaryta?" — matot patys.

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
