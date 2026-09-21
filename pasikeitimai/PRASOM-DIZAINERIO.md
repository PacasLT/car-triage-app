# Prašom iš dizainerio · 2026-09-21, v2.3.0 gyva

Trumpas sąrašas, ko laukiu iš jūsų šiai dienai. Detalės — `ZURNALAS.md`
(`Z-57`, `Z-59`, `Z-61`), pilna klaidų lentelė — `UZDUOTYS-DIZAINERIUI.md`.

---

## 1. BŪTINA · 35 paketas (be jo stoviu)

`D-33` ir ankstesnis jūsų laiškas remiasi **`35b` skyriumi**, bet pas mus
paketo nėra:

```
pasikeitimai/is-dizainerio/
  32-30sk-sujungimas-ir-tokenai
  33-K-26-diapazonai
  34-K-27-susitraukimas
  36-zurnalo-irasas        <- gautas, CSS jame nėra
```

Patikrinta ir pačiame faile: `ct-dizainas.css` neturi nei `35b` skyriaus, nei
`.ct-shell > .ct-shell-side > *` taisyklės.

**Reikia pilno aplanko** `is-dizainerio/35-.../`:
`ct-dizainas.css`, `PASTABOS.md`, `ZURNALAS-PRIDETI.md`, `BUSENA-EILUTES.md`.

Kol jo nėra:
- `K-34` (Nr. 40) lieka atviras;
- `ct-priedai.css` **7 bloko NETRINU** — ištrynęs paliktumėm ir statistikos
  juostą, ir paieškos panelę be nieko;
- šono matavimo po 33 + 34e nedarau, nes matuoti dar nėra ko.

## 2. BŪTINA · `K-31` įgyvendinimas (Nr. 41 + Nr. 39)

Sprendimą pasirinkot — „etiketė virš dėžutės visiems" — bet CSS negavom.

Priminimas, kodėl tai vienas ėjimas dviem pranešimams: `ct-dizainas.css:2657`

```css
.ct-fld.is-inline > .ct-fld-k { display: none; }
```

slepia visą raktą, o rakte gyvena piktograma. Pamatuota 1280 ir 390 px:
marke/modelis piktograma **0 px**, visų kitų vienuolikos laukų **10 px**.

## 3. LAUKIA ATSAKYMO (ne failų)

| Klausimas | Apie ką | Nuo |
|---|---|---|
| `K-26b` | Šonas 644 px prie ribos 599 (1280x720); jūsų 1 variantas pamatuotas – neveikia | 09-19 |
| `K-25` | Nr. 37 · `#portal-selector` niekada nebuvo dizaino sistemoje | 09-19 |
| `K-24` | Nr. 38 · „Daugiau filtrų" prie „Ieškoti" griauna `.ct-fld-act` 12-tą langelį | 09-19 |
| `K-18` | Portalų skydas 187 px vietoj 240 | 09-18 |
| `K-17` | Nr. 29 · `.ct-flag` be spalvų (21 sk.) | 09-18 |
| `K-16` | Nr. 28, 30 · antraštės dešinė limpa prie logotipo | 09-18 |
| `K-15` | Nr. 27, 35 · hero tekstas | 09-18 |
| `K-14` | Nr. 24 · šoninės panelės dizainas | 09-18 |
| `K-12` | Nr. 26 · portalų sąrašas šone | 09-18 |
| `A-11` | `--focus-offset` – vienintelis likęs negyvas tokenas | 09-18 |

## 4. Ko iš jūsų NEPRAŠOM

Nr. 42 (rūšiavimas nepersirikiuoja „Kituose skelbimuose"), Nr. 43 (rinkos
mediana iškreipta netikromis kainomis) ir negyva `.ct-sort` / `.ct-sort-menu`
taisyklė `index.html:1483` — mūsų JS ir serveris.

## 5. Ką padarysiu gavęs 35

1. Įdiegsiu 35 + 35b kartu su `K-31` sprendimu.
2. Ištrinsiu `ct-priedai.css` 7 bloką (jūsų argumentas dėl specifikos
   patikrintas: jūsų taisyklė platesnė abiem ašimis).
3. Pamatuosiu šoną **po abiejų** (33 diapazonai + 34e), `is-split` būsenoje,
   1280x720 ir 1920x1080, ties `K-26b` riba (599 px), ir parašysiu, kiek liko
   atsargos.
4. Pakelsiu versiją, įrašysiu žurnalą, ir Nr. 41, 39, 40 keliaus Lukui
   patikrinti.
