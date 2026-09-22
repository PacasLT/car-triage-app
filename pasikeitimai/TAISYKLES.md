# Darbo taisyklės · CarTriige (v2, 2026-09-22)

Pilnas planas ir „kodėl": Claude projektas „Cartriide" → `claude/DARBO-SISTEMA.md`.
Čia — tai, ką kiekvienas dalyvis turi žinoti dirbdamas.

## Dalyviai

| Kas | Kur dirba | Mato | Rašo |
|---|---|---|---|
| **Lukas** | visur | `LUKUI.md`, `/admin.html` | sprendimus, Veikia/Neveikia, push leidimą |
| **Klaudijus** | Cowork „CarTriige Kodavimas" | visą repo, Railway, naršyklę | **vienintelis rašo repo** ir commit'ina |
| **Dizaineris** | Claude Design | aplanką `Downloads\cartriige-dizaineriui` (`frontend/` + `pasikeitimai/` kopijos, atnaujinamos po kiekvieno commit'o) — tik skaito | tik paketus zip'u |
| **Analitikas** | Cowork „Informacijos ir duomenų bazės kūrimas" | visą repo aplanką | skriptus `tools/`, suvestines, `docs/` — **be commit'o** |
| **Finansininkas** | Cowork „Išlaidos, savikaina ir skaičiavimai" | Claude projektą | `claude/SAVIKAINA.md` projekte |
| **Plėtra** | Cowork „Plėtra, papildomos paslaugos ir pardavimai" | Claude projektą | `claude/PLETRA.md` projekte |

Verslo sesijos repo nerašo ir kodo neskaito. Faktus joms (ką produktas moka,
kiek kainuoja) Klaudijus laiko projekte: `claude/GALIMYBES.md`,
`claude/SAVIKAINA-DUOMENYS.md`.

## Kreipimasis į Luką (privaloma visiems)

Pilnai – projekte `claude/LUKUI-TAISYKLE.md`. Trumpai:
- Klausimas / sprendimas / nuomonė / patikra / leidimas Lukui → punktas **„Luko eilėje“**
  (https://claude.ai/artifact/KfPvoTLDL83GtRYHobaXtu): įrašai pats (`ArtifactData`) arba, jei negali,
  atsakymo gale `▶ LUKUI` blokas.
- Kiekvienas atsakymas baigiasi „Lukui: nieko nereikia.“ / „Lukui: įrašiau <ID>“ / `▶ LUKUI` / `▶ PERDUOTI → <kam>` blokas.
- Žinutė kitam nariui – tik `▶ PERDUOTI → <kam>` antraštė, o **pats tekstas – kodo bloke** (```), kad Lukas nukopijuotų vienu „Copy“ be jokio kito teksto.

## Pirmas veiksmas kiekvienoje sesijoje

1. `pasikeitimai/BUSENA.md` — kieno ėjimas. Ieškok savo vardo.
2. `pasikeitimai/ZURNALAS.md` — nuo paskutinio savo įrašo žemyn (senesni — `archyvas/`).
3. Dirbti. Klaudijus baigęs atnaujina `BUSENA.md`, `LUKUI.md`, žurnalą.

## Failai

| Failas | Kas rašo | Kam |
|---|---|---|
| `BUSENA.md` | Klaudijus | Tik ATVIRI punktai, sugrupuoti pagal ėjimą. Uždarytas → išimamas (lieka žurnale). |
| `LUKUI.md` | Klaudijus | Viskas, ko laukia Lukas. Perrašomas po kiekvieno leidimo. |
| `ZURNALAS.md` | Klaudijus | Klausimai, atsakymai, įdiegimai. Tik pridedama į galą. Senesni → `archyvas/`. |
| `archyvas/` | Klaudijus | Uždaryti žurnalo įrašai. Neredaguojami. |
| `matavimai/` | Klaudijus | Ekranvaizdžiai ir skaičiai, į kuriuos rodo žurnalas. |
| `is-dizainerio/NN-tema/` | Dizaineris (per Luką) | Paketai. Ne git'e. |

## Srautai

**Dizainerio paketas.** Dizaineris → zip → Lukas persiunčia Klaudijui →
Klaudijus (skill `cartriige-dizainerio-paketas`): išpakuoja į `is-dizainerio/NN-tema/`,
grep'ina kiekvieną selektorių realiame faile, diegia, matuoja, `ZURNALAS-PRIDETI.md`
→ žurnalo galas (žodžiai nekeičiami), `BUSENA-EILUTES.md` → `BUSENA.md`, versija,
veidrodis. Paketas, besiremiantis neįdiegtu, laukia.

Paketo forma:
```
is-dizainerio/NN-tema/
    *.css                    ← skyriai / pakeitimai
    PASTABOS.md              ← kas, kodėl, ką pamatuoti
    ZURNALAS-PRIDETI.md      ← į žurnalo galą
    BUSENA-EILUTES.md        ← į BUSENA.md
```

**Analitiko darbas.** Naršyklė tik parsisiunčia — **tik į `Downloads`**, niekada
į repo aplanką (945 MB, BDAR). Skaičiuoja skriptas (`tools/regitra-suvestine.py`,
vienkartiniams Python + DuckDB). Pasikartojantis skaičiavimas = skriptas `tools/` +
suvestinė failu. Baigęs — parašo Klaudijui (per Luką), kokius failus pakeitė;
Klaudijus paleidžia `regitra.test` ir commit'ina. Eilučių lygio duomenų nesaugom.

**Klaida (`/admin.html`).** `rasta` → `patvirtinta` → `tvarkoma` → `laukia-patikros`
(su „KĄ PATIKRINTI:") → Lukas **Veikia** / **Neveikia**. Reikia Luko sprendimo →
`laukia-sprendimo`. Laukia paketo → `laukia-dizainerio`. Ne klaida → `neaktualu`.

**Verslo sprendimas → produktas.** Finansininkas / Plėtra → savo dokumentas →
Klaudijus įrašo į `LUKUI.md` „Sprendimai" → Lukas „taip" → Klaudijus įgyvendina.

## Žurnalo įrašo forma

Klausimas `K-nn`, atsakymas `A-nn` (tas pats numeris). Klaudijaus įrašai `Z-nn`,
dizainerio `D-nn`.

```
## K-07 · 2026-09-18 · Klaudijus → Dizaineriui · LAUKIA ATSAKYMO
**Klausimas:** vienas sakinys, atsakomas taip/ne arba vienu vardu.
**Kodėl klausiu:** kas lūžta arba neaišku.
**Ką jau padariau:** laikina atsvara / pamatuota tai ir tai.
**Failai:** pasikeitimai/matavimai/xxx.png
```

Būsenos: `LAUKIA ATSAKYMO`, `UŽDARYTA`, `ATIDĖTA`.

## Dizaino sprendimas klausiamas iškart

Jei pakeitimui reikia dizaino sprendimo (spalva, vardas, komponentas),
Klaudijus nespėlioja: `K-nn` žurnale + matavimas `matavimai/`. Jei darbas negali
stovėti — laikina atsvara `ct-priedai.css` (numeruotas blokas su „Dizaineriui:"
eilute), niekada dizainerio failuose.

## Ko niekada nedarom

- Dizaineris neredaguoja `frontend/` / `backend/` (ir negali) — tik paketai.
- Klaudijus neredaguoja `ct-dizainas.css`, `ct-mygtukai.css` — išskyrus paketo
  įdiegimą arba dizainerio aiškiai paprašytą vietą (įrašoma žurnale).
- Niekas neredaguoja svetimo žurnalo įrašo — klysta, rašomas naujas.
- Žali duomenys (zip, csv) repo aplanke — niekada.
- Slapti raktai (`ANTHROPIC_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`, `INVITE_CODES`,
  `SCRAPER_API_KEY`) — niekur, išskyrus Railway Variables.
