# Užduotys dizaineriui · iš klaidų sąrašo

Sugeneruota **2026-09-21, v2.2.1 gyva** (v2.3.0 paruošta), iš gyvo
`/admin/klaidos` (43 pranešimai, 22 atviri). Perrašyta visa iš sąrašo, ne iš
atminties.

Kiekviena eilutė: **Nr. · ką parašė Lukas · selektorius · ką pamatavau · ko reikia.**

> **Pataisa 2026-09-21 vakare (Z-72):** išimtos eilutės Nr. 28, 30, 39, 40, 41 — visos uždarytos. Nr. 28 ir 30 čia buvo pažymėtos „Jūsų ėjimas", nors `K-16` uždarytas dar v1.80.0; jos laukė **Luko patikros**, ne dizainerio. Likusios eilutės neperžiūrėtos iš naujo.

---

## Laukia JŪSŲ ėjimo

| Nr. | Lukas | Elementas | Pamatuota (2026-09-21) | Ko reikia |
|---|---|---|---|---|
| **35** | „Ieškoti automobilių iš čia galime pašalinti, istoriją perkelti šalia daugiau filtrų su identišku dizainu mygtuko" | `.ct3-hero-content` | Sena `K-15` tema | Laukia jūsų skaičiaus (hero → juosta) |
| **34** | „Filtrus sudėjai ne taip, mes padarėme kad būtų lygiai dvi eilės po 6 filtrus" | `.ct-fld-act` | 1280 px: 11 laukų po 180 px + veiksmų langelis | Susiję su `K-24` („Daugiau filtrų" prie „Ieškoti") |
| **24** | „Reikia patobulinti filtro šoninio dizainą" | `.ct-shell-side` | Šonas 540 px, telpa nuo 1180 px; ties 1280×720 buvo 644 prie ribos 599 (`K-26b`) | Jūsų ėjimas |
| **23** | „Index puslapyje filtrų dizainas turi būti kitoks, šitas variantas tik jau atfiltravus" | `#filters` | Prieš paiešką laukas 180 px su kortelės fonu; po — 119 px be fono | Jūsų ėjimas |
| **33** | „Mėgstamiausių sąraše įsijungus į linką neberodo atnaujinti mygtuko" | `megstamiausi.html` | Nepamatuota | Pasakykit, ar tai jūsų sritis, ar mūsų JS |

---

## Atviri klausimai jums (kartoju, nes nė vienas neatsakytas)

| Nr. | Klausimas | Nuo kada |
|---|---|---|
| ~~`K-34`~~ | Uždaryta 35/37 paketais; Nr. 40 — klaidingas matavimas (Z-68) | — |
| ~~`K-31`~~ | Uždaryta 35 paketu (34e), Nr. 39 ir 41 — Z-62 | — |
| ~~`K-26b`~~ | Uždaryta 37 paketu: šonas 536 prie 599 (Z-69) | — |
| `K-25` | Nr. 37 · `#portal-selector` niekada nebuvo dizaino sistemoje | 09-19 |
| `K-24` | Nr. 38 · „Daugiau filtrų" prie „Ieškoti" griauna `.ct-fld-act` 12-tą langelį | 09-19 |
| `K-18` | Portalų skydas 187 px vietoj 240 | 09-18 |
| `K-17` | Nr. 29 · `.ct-flag` be spalvų (21 sk.) | 09-18 |
| ~~`K-16`~~ | Uždaryta **17 paketu (A-25, v1.80.0, Z-24)**. Šiame sąraše liko per klaidą — žr. Z-72 | — |
| `K-15` | Nr. 27, 35 · hero tekstas | 09-18 |
| `K-14` | Nr. 24 · šoninės panelės dizainas | 09-18 |
| `K-12` | Nr. 26 · portalų sąrašas šone | 09-18 |
| `A-11` | `--focus-offset` — vienintelis likęs negyvas tokenas | 09-18 |

---

## Kas pasikeitė nuo praėjusio jūsų paketo (34)

- **v2.0.0–v2.3.0** — Lietuvos registro punktai skelbimuose. Nauja klasė
  `.ct-regitra*` (`ct-priedai.css` 15 blokas) — perimkit, jei norit. Žinojimo
  lygių klasės tos pačios: `ct-k-confirmed` / `ct-k-signal` / `ct-k-unknown`.
- **v2.2.0** — skelbimų archyvas, tik serveryje. Sąsajos nekeitė.
- `ct-priedai.css` 13 ir 14 blokai **ištrinti** (34 paketas juos uždarė).

## Ko iš jūsų NEprašom

Nr. 42 (rūšiavimas nepersirikiuoja „Kituose skelbimuose") ir Nr. 43 (rinkos
mediana iškreipta) yra mūsų JS ir serveris. Ten pat ir negyva taisyklė
`index.html:1483` — `.ct-sort` / `.ct-sort-menu` rašyta klasėms, o elementai
turi tik `id`. Taisom patys, jums rodom tik dėl formos: tai ketvirtas kartas,
kai taisyklė rašoma selektoriui, kurio puslapyje nėra.
