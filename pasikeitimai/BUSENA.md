# Būsena · atnaujinta 2026-09-21, v1.97.0 (v1.96.0 gyva produkcijoje)

Perrašyta iš žurnalo (Z-21, D-18), ne iš atminties.

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-27 | Nr. 40 · portalų mygtukas ir statistikos juosta | **Dizaineris** | `K-22` diagnozuotas: du nesusiję kaltininkai, 56 px (≥1180) ir 182 px (<1180). Atsvaros `ct-priedai.css` 13 ir 14 blokuose — perimkit, ir ištrinsiu. Z-48. |
| K-26b | Šonas 644 prie ribos 599 | **Dizaineris** | `K-26` uždarytas 33 paketu (visi šeši laukai 101 px), bet trys diapazonai per eilutę kainavo +112. Viršija tik 1280×720. Jūsų 1 variantas pamatuotas — neveikia. Z-46. |
| K-25 | Nr. 37 · `#portal-selector` | **Dizaineris** | Niekada nebuvo dizaino sistemoje. |
| K-24 | Nr. 38 · „Daugiau filtrų" prie „Ieškoti" | **Dizaineris** | Lukas taip nori, bet tai griauna `.ct-fld-act` 12-tą langelį. Jūsų ėjimas. |
| A-11 | `--focus-offset` | **Dizaineris** | Vienintelis likęs negyvas tokenas; pasiliekat kartu su PT-02. |
| K-18 | Portalu skydas 187 px vietoj 240 | **Dizaineris** | `max-width: calc(100% - 12px)` skaičiuojamas nuo `.ct3-portal-wrap`, ne nuo stulpelio. Veikia, bet siauriau nei rašėte. |
| K-14 | Nr. 24 · šoninės panelės dizainas | **Dizaineris** | Be detalių; galiu atsiųsti matavimus ir ekranvaizdžius. |
| K-15 | Nr. 27 · hero tekstas | **Dizaineris** | Lukas prašo pašalinti `.ct3-hero-content`. 26 sk. dalis — neliečiu be atsakymo. |
| K-12 | Nr. 26 · portalų sąrašas šone | **Dizaineris** | `right: 0` siaurame stulpelyje duoda −32 px. Atsvara `ct-priedai.css` 9 bloke, pamatuota. |
| D-03 | Skelbimo puslapio 3 dalis | **Lukas** | Ar grąžinam šešis skydelius? Iš 27 pranešimų nė vienas nebuvo apie jų turinį. |
| K-17 | Nr. 29 · prioriteto spalvos | **Dizaineris** | `.ct-flag` (21 sk.) be spalvų – taškas prieš užrašą `ct-priedai.css` 10 bloke. |
| K-16 | Nr. 28 · antraštės dešinė | **Dizaineris** | `.ct3-header-right` sulipęs prie logotipo, ne prie krašto (239×42 ties 893,27). |
| Nr. 39, 30, 33, 24 + 36, 35, 34, 28, 23 | Laukia jūsų patikros | **Lukas** | **Devyni**. v1.95.0 gyva; pamatuota tiesiai produkcijoje 1280×720. |
| Nr. 20, 21 | dpTab ir FAB | **Lukas** | v1.76.0 gyva — patikrinti. |
| Nr. 25, 26 | Dekoracija ir portalų sąrašas | **Lukas** | Ištaisyta v1.77.0 — patikrinti po push'o. |
| Nr. 19, 2, 16, 15 | Seni pranešimai | **Lukas / Klaudijus** | Nr. 15 laukia Luko sumos; Nr. 16 laukia dizainerio mobile varianto. |
| L-04 / L-05 | `/admin/atsarga`, rakto rotacija | **Lukas** | Priminimai 09-19 11:30 ir 13:15 UTC. |

## Kas uždaryta paskutiniu metu

- v1.97.0 — **Nr. 40 / `K-22`**: šonas turėjo paslėptą horizontalų slinkimą su **dviem nesusijusiais** kaltininkais — `#portal-toggle-btn` 56 px (≥1180) ir `.ct3-stats-driven` 182 px (<1180, mano skola nuo 25 sk.). Abu uždaryti, liko 20 px sąmoningo 7 bloko triuko. **Laukia push'o.**

- v1.96.0 — **revizijos 1 eilė**: naujas `frontend/ct-sesija.js`, vienas žetono ir 401 šaltinis visuose šešiuose puslapiuose (`A-1`, `A-2`, `A-3`, `A-7`). `C-2` sargas įdėtas į `fetchListingPage`, ne į vieną maršrutą — 14 bandymų. Sargai `23/24 → 26/26` (`B-2`, `B-3`). **Laukia push'o.**

- v1.95.0 — **33 paketas**: `K-26` uždarytas, visi šeši diapazono laukai 24/36 → **101 px**, nieko neapkirpta. Trečioji taisyklė įdiegta siauriau: atsiųsta būtų nuėmusi išskleidimo rodyklę nuo KURO, PAVARŲ ir RATŲ. Naujas `K-26b`.

- v1.94.0 — **32 paketas**: 30 sk. sujungtas (`I-01` dublikatų nebėra), 8 negyvi tokenai ištrinti (`I-04` 10 → 1), `--text-on-light` pritaikytas 4 vietose. **RADINYS: šone `#marke` ir `#modelis` buvo 0 px ir nepaspaudžiami** — juosta 484 → 532 px (riba 599). Naujas `K-26`.
- v1.93.0 — Nr. 30 avataras: `index.html` turėjo likusią `ct-btn-sm`, 32x32 vietoj 38x38. Visi penki puslapiai suvienodinti.

- v1.81.0 — **D-16 padarytas**: vartotojo ekranas, patvirtinimo kortelė pamatuota visais 9 perėjimais; `created_at` ir `PLANAI` jau buvo
- v1.80.0 — komentarai prie pranešimų (būsena keičiasi pati); `K-16` antraštės tarpiklis (Nr. 28, 30); 32 sk. kortelės telefone (Nr. 16); Nr. 14 pamatuota
- v1.79.0 — `K-13` dvi būsenos: filtrai į šoną tik po paieškos; `K-12` perėjo į 30 sk.; `ct-priedai.css` 9 blokas ištrintas
- v1.78.0 — Nr. 29 (prioritetas su spalvomis), Nr. 22 (admin sąrašas atsinaujina grįžus į skirtuką); nauja taisyklė: klaidų sąrašas → užduotys
- v1.77.0 — Nr. 25 (dekoracinė „Search across Europe" juosta ištrinta), Nr. 26 (portalų sąrašas nebeiškrenta už stulpelio); `K-10` perimta į 30 sk.
- v1.76.0 — Nr. 20 (`dpTab` grąžinta), Nr. 21 (FAB virš širdelės); 30 sk. v3, šonas 746 → 540 px
- v1.75.0 — 25 sk. `.ct-shell`, `.container.is-wide`, `ERRATA-header-h`
- **Radinys:** `.ct3-portals-row` buvo dekoracija (0 valdiklių), ne filtras — `A-14` 2.1 taikytas ne tam elementui

## Kur kas guli

- Dizainerio failai: `frontend/ct-dizainas.css`, `frontend/ct-mygtukai.css`
- `frontend/ct-priedai.css` — **1, 2** (seni), **7, 8** (mūsų, NETRINTI),
  **10** (`K-17`) – vienintelė laikina atsvara
- Patikros: `tools/onclick-patikra.py`, `tools/klaidos.js`
- Užduotys dizaineriui: `pasikeitimai/UZDUOTYS-DIZAINERIUI.md` (perrašoma iš gyvo sąrašo)
- Versija: `frontend/versijos.js` — **vienintelė vieta**

## Atviri matavimai

1. **13 paketas** — patvirtinimo kortelė visiems trims planams; 390 px žurnalo lentelė.
2. `--text-on-light` penkiose vietose — jokio vizualaus pokyčio neturi būti.
