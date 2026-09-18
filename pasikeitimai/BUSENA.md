# Būsena · atnaujinta 2026-09-18, v1.72.0

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| D-11 | 11 paketo ERRATA-2 | **Klaudijus** | Pakeičia `ct-mygtukai-PRIDETI.css`: 422-428 eil. pakeitimas + tik-aukštis `pointer: coarse`. Įdiegus trinami `ct-priedai.css` 7 ir 8 blokai. |
| D-12 | 12 paketas + ERRATA-30sk-tankis | **Klaudijus** | 30 sk. antra redakcija (pamatuota: 527 px, telpa visur), 31 sk. `.ct-field` (Z-15), `:root` auditas. Reikia `.is-wide` klasės keturiems laukams. |
| D-09 | 25 sk. `.ct-shell` įdiegimas | **Klaudijus** | Nebeblokuojamas — 30 sk. v2 yra ta trūkstama dalis. Imti `ERRATA-header-h.md` (97/69/65). Uždaro V-14 (Nr.14). |
| D-13 | Vartotojo detalus rodinys | **Dizaineris** | **13 paketas, ir tik jis** — susitarta Z-14. Planas, kreditai, žurnalas. |
| D-03 | Skelbimo puslapio 3 dalis | **Dizaineris** | Kortelės, rinkos padėties skalė, pardavėjo kortelė. Paketas 07 rezervuotas. |
| V-05 | Daužtų skelbimų kortelė | **Klaudijus** | `.risk-banner` aprašytas dukart `index.html` (219 ir 1050). |
| V-07 | Atmesti skelbimai (Nr.2) | **Klaudijus** | Laukia nuotraukos peržiūros. |
| L-04 | `/admin/atsarga` rezultatas | **Lukas** | Po paros pažiūrėti skaičius, nuspręsti dėl Puppeteer. |

**Iškelta kaip atsakyta** (buvo klaidingai grąžinta į lentelę, žr. D-14):
K-03 → A-03 · K-04 → A-04 · K-05 → A-05 · K-06 → A-06 · K-07 → A-08 ·
K-08 → A-10 + A-12. Visi UŽDARYTA, atsakymai žurnale.

## Kas uždaryta paskutiniu metu

- A-12 — 30 sk. pamatuotas: A 829 / B 643 / **C 527** px; du tankio žingsniai, sulankstomų grupių nereikia
- A-13 — 31 sk. `.ct-field`: sistemoje jo nebuvo, tik `.ct-field-k` ir `.ct-field-err`
- v1.68.0 — pranešimo langas: kategorijos į `<select>`, „o ko tikėjotės" prie devynių, automatinis skelbimo laukas
- v1.67.0 — 11 paketas; A ir B blokai pataisyti per ERRATA-2 (specifika (0,3,0) vs (0,4,0); plotis be užrašo paslėpimo)
- v1.66.0 — `--tap-min` pažeidimai penkiose vietose ištaisyti; `.ct-report-fab` 37×32 → 44×44
- v1.65.0 — hero regresija ištaisyta; meniu juosta pašalinta Luko sprendimu, 27 sk. lieka su `:empty`
- v1.63.0 — 09 paketas: `.ct-specs`, hero, juosta; aktyvios nuorodos klaida ištaisyta
- v1.56.0 — A-01: 23 sk. `.ct-clamp`, `ct-priedai.css` 6 blokas ištrintas

## Kur kas guli

- Dizainerio failai: `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css`
- Laikinos atsvaros: `frontend/ct-priedai.css` — **blokai 1, 2, 7, 8**
  (6 ištrintas v1.56.0; 7 ir 8 atsirado v1.67.0 ir trinami įdiegus ERRATA-2)
- Generuojami puslapiai: `frontend/admin.html` ← `tools/mk-admin.py`
- Versija ir istorija: `frontend/versijos.js` — **vienintelė vieta**
- Visos projekto taisyklės: `CLAUDE.md`

## Atviri matavimai

1. **1280×720** — 30 sk. v2 tikroje panelėje. Maketas duoda 527 prie ribos 599.
2. Lietimo planšetė 768 / 1024 px po ERRATA-2 — mygtukai su užrašais, `min-height 44`, **be** fiksuoto 44 px pločio.
3. Pelė 1024 / 1400 px — turi likti `140×38 150×38 106×38`, nepakeista.
4. `--text-on-light` penkiose vietose — **jokio vizualaus pokyčio neturi būti**; jei matosi, viena vieta nebuvo `#0A0C12`.
