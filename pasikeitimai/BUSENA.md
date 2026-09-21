# Būsena · atnaujinta 2026-09-21, v2.2.1 (v2.2.0 GYVA produkcijoje)

Perrašyta iš žurnalo (Z-21, D-18), ne iš atminties.

## Kieno dabar ėjimas

| Nr. | Kas | Kieno ėjimas | Trumpai |
|---|---|---|---|
| K-31 | Nr. 41 · `is-inline` etiketės ir `NUSTATYTA` juosta | **Dizaineris** | Penki langeliai platūs, tik du neša etiketę viduje — 33 paketo pasekmė. Telefone `is-inline` vardas jau neteisingas. Trys keliai, Z-53. |
| K-29 | Nurašymų riba: 50 (P75) ar 40 (kad BMW 530 suveiktų)? | **Analitikas** | Su amžiaus vartais 40 nebėra triukšmingas. Z-52. |
| K-30 | Ar `rida_kv` apskritai naudotinas skelbimui vertinti? | **Analitikas** | Pamatuota: normalus 2–4 m. X5 gautų klaidingą 🟡. Z-52. |
| ~~K-28~~ | ~~Likvidumo riba~~ | **Uždarytas** | Ribos perkeltos prie kvartilių: 26 / 13. |
| K-28-senas | Likvidumo riba: `< 12` ar `<= 12,1`? | **Lukas** | Specifikacijoje riba „žemiau 12 %", bet BMW 530 (12,1 %) pateiktas kaip „lėto" pavyzdys. Kodas laikosi ribos. Z-51. |
| ~~K-27~~ | ~~Nr. 40 · portalų mygtukas ir statistikos juosta~~ | **Uždarytas 34 paketu** | `K-22` diagnozuotas: du nesusiję kaltininkai, 56 px (≥1180) ir 182 px (<1180). Atsvaros `ct-priedai.css` 13 ir 14 blokuose — perimkit, ir ištrinsiu. Z-48. |
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
| Nr. 40, 39, 35, 34, 33, 30, 28, 24, 23 | Laukia jūsų patikros | **Lukas** | **Devyni**. v1.95.0 gyva; pamatuota tiesiai produkcijoje 1280×720. |
| Nr. 20, 21 | dpTab ir FAB | **Lukas** | v1.76.0 gyva — patikrinti. |
| Nr. 25, 26 | Dekoracija ir portalų sąrašas | **Lukas** | Ištaisyta v1.77.0 — patikrinti po push'o. |
| Nr. 19, 2, 16, 15 | Seni pranešimai | **Lukas / Klaudijus** | Nr. 15 laukia Luko sumos; Nr. 16 laukia dizainerio mobile varianto. |
| L-04 / L-05 | `/admin/atsarga`, rakto rotacija | **Lukas** | Priminimai 09-19 11:30 ir 13:15 UTC. |

## Kas uždaryta paskutiniu metu

- v2.2.1 — **Automatinis sekimas IŠJUNGTAS** (Z-55). ScraperAPI nurašo ~10 kreditų už autoplius/autogido puslapį, ne 1; sekimas (~300 skelbimų) = ~3 000 kreditų ir buvo paleidžiamas po KIEKVIENO deploy'aus. Liko ~14 500 iš 100 000. Įjungti: `SEKIMAS_AUTO=1`. **Kol kodas nesutvarkytas iki galo — jokių pilnų skenavimų.**

- v2.2.0 — **Skelbimų archyvas** (Z-54): `backend/rinka.js`, `/data/rinka.db` (SQLite, atskirai nuo `users.db`). `GET /admin/rinka` (suvestinė, disko failai, `?paskyra=1` — ScraperAPI likutis nemokamai), `POST /admin/rinka/skenuoti` (tik autoplius/autogidas, riba privaloma). Dingimas — tik po dviejų pilnų skenavimų. `turiLizingoOpcija` nesaugomas. Pakeliui: **atominis JSON įrašymas** (6 failai) — anksčiau nutrūkus rašymui visas archyvas tyliai virsdavo `{}`. Sargas `rinka.test.js` **24/24**. **Laukia push'o, tada bandomasis BMW nuo 2019.**

- v2.1.0 — **Regitros duomenys v2**: analitikas rado 12 mėn. lango klaidą (dengė 9,3 mėn.), tad v2.0.0 produkcijoje rodė **per mažus** skaičius. Įdiegta: ribos prie kvartilių (26/13), nurašymai tik 15+ pjūvyje, ridos percentilis, kuro punktas. **Du nurodymai pakeisti po matavimo** — `kmmet_kv` vietoj `rida_kv` ir riba 50 vietoj 30. Pridėti amžiaus vartai. Sargas **70/70**. Nauji `K-29`, `K-30`. **Laukia push'o.**

- v2.0.0 — **Regitros integracija**: `backend/regitra.js` (1 343 modeliai atmintyje), kontekstas prisegamas prie kandidatų, trys punktai žinojimo lygių sistemoje, `regitra.test.js` **46/46**. Produkto klausimas (4 sk.) — imtas numatytasis **1 variantas** (tik trečias lygis ir skelbimo puslapis). Naujas `K-28`. **Laukia push'o.**

- v1.99.0 — **34 paketas**: `K-27` uždarytas viena taisykle vietoj dviejų atsvarų. Naujas `23b` (`.ct-ell` — vienaeilio apkarpymo sistemoje nebuvo) ir `30b` (`min-width: 0` visam stulpeliui, `flex: none` ženklams). `ct-priedai.css` 13 ir 14 blokai **ištrinti**. Pakeliui pataisytos piktogramos, kurių niekas neieškojo: 4→14 px ties 1280, 10→14 telefone, 0→12 ties 1179.
- v1.98.0 — **revizijos 2 eilė**: `A-4` (el. pašto registras + migracija su saugikliu), `C-1` (bandymų riba `ip` ir `ip+elpaštas` — be paskyros užrakinimo), `C-4` (laiko kanalas + maišos perrašymas prisijungus). Nauji sargai `sesija.test.js`, `migracija.test.js`. **Laukia push'o.**

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
