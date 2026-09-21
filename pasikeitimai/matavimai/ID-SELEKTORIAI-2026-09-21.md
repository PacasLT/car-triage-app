# ID selektoriai su vizualinėmis savybėmis — `frontend/index.html`

Dizainerio prašymas D-37 §3. Suskaičiuota scenarijumi (komentarai išmesti),
ne ranka. 2026-09-21, v2.5.5.

**Iš viso: 155 taisyklės, 55 ID.** Spalvų kodai atributų selektoriuose
(`[style*="#1a1d24"]` ir pan.) — ne ID, neįskaičiuoti. Iš 155 taisyklių
**22** liečia žemiau esančius 5 mygtukus.

## Kur ID tikrai muša sistemą — 5 elementai

Tik čia elementas **turi ir ID taisyklę, ir sistemos klasę** (`ct-dizainas.css`).
Kitur (50 ID) elementai sistemos klasių neturi — ID yra vienintelis stilius,
tad nėra ką nugalėti.

| ID | Sistemos klasės | index.html eil. | Ką ID perrašo |
|---|---|---|---|
| `#search-btn` | `ct3-search-btn ct-btn ct-btn-primary` | 175–177, 367, 1452 | grid-column, padding, background, color, border, radius, šriftas, shadow, hover/disabled |
| `#ct-planas-btn` | `ct3-premium-btn ct-btn` | 1394, 1401, 6857, 6866 | padding, height, font-size, gap — **su `!important`** |
| `#deep-compare-btn` | `ct-btn ct-btn-primary` | 1736, 1742–1743 | visa išvaizda, hover/disabled — **su `!important`** |
| `#portal-toggle-btn` | `ct3-marketplaces-btn ct-btn ct-btn-quiet` | 1814 | `.active` būsenos fonas, spalva, rėmelis |
| `#compare-btn` | `ct-btn` | 309, 351, 1110, 1492 | fonas, radius, šriftas, height, padding |

Visi penki — **mygtukai**. `#search-btn` 175 eil. yra didžiausia: ji
senesnė už `.ct-btn-primary` ir dubliuoja beveik viską, ką sistema duoda.

## Kiti 50 ID (be sistemos klasių)

Grupės: paieškos progresas ir žurnalas (`#log-*`, `#search-progress-*`,
`#ct-log-steps` — 42 taisyklės), palyginimas (`#compare-*`, `#deep-compare-*`
— 32, iš jų dalis — mygtukai viršuje), tinder (`#tinder-*` — 15), `#lightbox*` (7), portalų skydas
(`#portal-selector`, `#portal-backdrop` — 7), `#sort-bar`/`#sort-select` (10),
planų modalas `#ct-pl-*` (4), kiti pavieniai (`#status`, `#toast-container`,
`#ct-auth-overlay`, `#ct-logout-btn`, `#ct-history-dropdown`,
`#favorites-panel`, `#all-listings*`, `#toggle-all-btn`, `#results`).

Trys iš jų dizaineris jau stiliuoja pats per ID ct-dizainas.css'e:
`#sort-bar`, `#sort-select`, `#portal-selector` — ten konfliktas būtų tarp
dviejų ID, laimi vėlesnis failas.

## Pasiūlymas (nieko nedarau be jūsų žodžio)

Penki mygtukai → ID taisyklėse palikti tik **išdėstymą** (grid-column,
margin), o išvaizdą (fonas, spalva, radius, šriftas, shadow, `!important`)
išimti ir leisti `.ct-btn-*` dirbti. Prieš tai — kiekvienam pamatuoti
prieš/po, nes kai kurie (pvz. `#ct-planas-btn` 44 px telefone, v1.65.0)
turi priežastį.
