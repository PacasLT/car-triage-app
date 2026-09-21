# Užduotys dizaineriui · iš klaidų sąrašo

Sugeneruota **2026-09-21, v2.2.1 gyva** (v2.3.0 paruošta), iš gyvo
`/admin/klaidos` (43 pranešimai, 22 atviri). Perrašyta visa iš sąrašo, ne iš
atminties.

Kiekviena eilutė: **Nr. · ką parašė Lukas · selektorius · ką pamatavau · ko reikia.**

---

## Laukia JŪSŲ ėjimo

| Nr. | Lukas | Elementas | Pamatuota (2026-09-21) | Ko reikia |
|---|---|---|---|---|
| **41** | „Markė ir Modelis turi būti iškeltas iš filtro box paties, kaip metai ir kaina. O NUSTATYTA 4 turėtų būti Pavadinimas lentelės filtrų" | `.ct-fld.is-inline` | 1280 px: penki laukai eina per visą eilutę (marke, modelis, metai, kaina, galia), bet etiketę VIDUJE neša tik marke ir modelis. 390 px: nė vienas laukas nėra platus (visi 151 px), o etiketė vis tiek viduje | `K-31`, trys keliai aprašyti `Z-53`. **Jūsų ėjimas nuo 09-20** |
| **39** | „Filtruose nerodo iconų ir markė bei modelis neteisingoje vietoje pačiame filtre" | `.ct-fld.is-inline > .ct-fld-k` | **Ta pati priežastis, kaip 41.** `ct-dizainas.css:2657` slepia visą raktą: `display: none`. Pamatuota 1280 ir 390 px — marke/modelis piktograma **0 px**, visų kitų laukų **10 px** | Sutvarkius `is-inline`, piktogramos grįžta pačios. Atskiros užduoties nėra — **41 uždaro abu** |
| **40** | „Paspaudus Kiti like skelbimai pabėga dizainas, suspaudžia į kairę" | `.ct3-stats-bar` | Šoninis stulpelis **persislenka horizontaliai**: 1280 px `scrollWidth 1260 / clientWidth 1240`, 1920 px **1740 / 1560**. Kaltininkas vienas: `.ct3-stats-bar` yra ŠONE, bet platus per visą langą (1920 px stulpelyje, kurio plotis 1560) | **`K-34`** žemiau. Luko ekranvaizdyje matosi horizontali slinkties juosta po šonu |
| **35** | „Ieškoti automobilių iš čia galime pašalinti, istoriją perkelti šalia daugiau filtrų su identišku dizainu mygtuko" | `.ct3-hero-content` | Sena `K-15` tema | Laukia jūsų skaičiaus (hero → juosta) |
| **34** | „Filtrus sudėjai ne taip, mes padarėme kad būtų lygiai dvi eilės po 6 filtrus" | `.ct-fld-act` | 1280 px: 11 laukų po 180 px + veiksmų langelis | Susiję su `K-24` („Daugiau filtrų" prie „Ieškoti") |
| **30** | „Headeris skiriasi index puslapyje" | `.ct3-header-right` | `K-16`: blokas limpa prie logotipo, ne prie krašto | Jūsų ėjimas |
| **28** | „Vartotojo ženkliukas ir širdelė turi būti dešiniajame kampe" | `.ct3-header-right` | Ta pati `K-16` | Jūsų ėjimas |
| **24** | „Reikia patobulinti filtro šoninio dizainą" | `.ct-shell-side` | Šonas 540 px, telpa nuo 1180 px; ties 1280×720 buvo 644 prie ribos 599 (`K-26b`) | Jūsų ėjimas |
| **23** | „Index puslapyje filtrų dizainas turi būti kitoks, šitas variantas tik jau atfiltravus" | `#filters` | Prieš paiešką laukas 180 px su kortelės fonu; po — 119 px be fono | Jūsų ėjimas |
| **33** | „Mėgstamiausių sąraše įsijungus į linką neberodo atnaujinti mygtuko" | `megstamiausi.html` | Nepamatuota | Pasakykit, ar tai jūsų sritis, ar mūsų JS |

---

## Atviri klausimai jums (kartoju, nes nė vienas neatsakytas)

| Nr. | Klausimas | Nuo kada |
|---|---|---|
| `K-34` | **NAUJAS.** `.ct3-stats-bar` šoniniame stulpelyje platesnė už patį stulpelį (1920 vs 1560). Ar juosta apskritai turi būti šone? Jei taip — ji turi laikytis stulpelio, ne lango | 09-21 |
| `K-31` | Nr. 41 · `is-inline` etiketės ir `NUSTATYTA` juosta | 09-20 |
| `K-26b` | Šonas 644 prie ribos 599 (1280×720). Jūsų 1 variantas pamatuotas — neveikia | 09-19 |
| `K-25` | Nr. 37 · `#portal-selector` niekada nebuvo dizaino sistemoje | 09-19 |
| `K-24` | Nr. 38 · „Daugiau filtrų" prie „Ieškoti" griauna `.ct-fld-act` 12-tą langelį | 09-19 |
| `K-18` | Portalų skydas 187 px vietoj 240 | 09-18 |
| `K-17` | Nr. 29 · `.ct-flag` be spalvų (21 sk.) | 09-18 |
| `K-16` | Nr. 28, 30 · antraštės dešinė | 09-18 |
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
