# Būsena · 2026-10-28 · v2.29.0 (laukia push; produkcijoje 2.28.2)

Tik **atviri** punktai. Uždaryti — `ZURNALAS.md` / `archyvas/`. Kas laukia Luko — `LUKUI.md`.
Klaidos gyvena `/admin.html`: **9 atviros**. Nr.51, 52, 55 ištaisytos v2.28.1 (laukia deploy → `laukia-patikros`); Nr.53 – ne klaida, mūsų įspėjimas eigos sąraše; Nr.54 ir Nr.45 lieka.

## Klaudijus

Eilė pagal Luko KL-PRIORITETAS (klaidos pirma), tada Luko 09-22 sprendimai.

| Nr. | Kas | Trumpai |
|---|---|---|
| Nr.45 | Otomoto pilna apžvalga be analizės ir nuotraukų | Luko „Neveikia“. Testuoti tik su įrašytu HTML (iki 10-16). |
| Nr.30 | Antraštė index ≠ mėgstamiausi | Luko „Neveikia“. |
| Nr.47 | Neatitinkantys filtrų (autogidas iškelti) rodomi „Kiti skelbimai“ | Nerodyti visai, rinkos kainai lieka. |
| ~~Kuras~~ | **Padaryta v2.23.0:** kuro filtras daugiareikšmis | Keli kurai vienu metu su varnelėmis (Luko prašymas 10-18). Griežta prasmė iš v2.10.5 nepakito. Papildomų kreditų nekainuoja – portalai kuro sąrašą priima viename URL. |
| K-72 | `source` = domenas, ne trumpasis vardas | **Pataisyta v2.23.1.** Nuo v2.17.0 `rinkaPagalPortala` produkcijoje visada grąžino null → „≈ Lietuvoje" be kaštų, MAX „laukia rinkos", daužti visada punktyru. Sargas dabar ima tikras `site` eilutes iš `server.js`. |
| K-72b | MAX „laukia rinkos" be modelio | Ne klaida: MAX reikia ≥5 to paties modelio LT skelbimų. Luko patikra su konkrečiu modeliu. |
| ~~K-23a~~ | `.ct-check` telefone 32 px | **Uždaryta** (Errata 19): dizaineris perėmė į 21 sk.; iš priedų 25 išimta. |
| ~~K-71a~~ | 52 sk. legenda telefone | **Uždaryta** (Errata 19): forma patvirtinta. |
| ~~Tinder mygtukas~~ | **Išimtas v2.24.0** (73 pk.) | Mygtukas, `startTinder()` ir CSS. `#tinder-view` markupas liko – atskiras darbas. |
| ~~Pigumo patikra~~ | **Padaryta v2.25.0:** kodėl skelbimas per pigus | Trys pakopos (Luko „gerai darom“ 10-19): 1) tekstas 0 €, 2) Haiku + 1 nuotrauka ~0,002 €, 3) pilna analizė 0,062 € – **išjungta**, kol Lukas nepamatys 2 pakopos kainos gyvoje paieškoje (`PIGUMO_PILNA=1`). Liko: Luko sprendimas dėl apimties (ar 2 pakopa visiems, ne tik per pigiems) ir ar įjungti 3 pakopą. |
| ~~Nuorodos analizė~~ | **Padaryta v2.26.0:** įklijuok nuorodą → pilna apžvalga | Laukas paieškos viršuje (56 sk.), rinkos mediana iš archyvo (0 kr.), pagal rinką, imtis ≥8. Liko: „patikslinti rinką (25 kr.)“ mygtukas, kai archyvo per mažai – sąmoningai atidėtas, kol Lukas pamatys, kaip dažnai archyvo pakanka. |
| K-76 | 56 sk. `.ct-link-msg` be `:not([hidden])` + kablelis `busy` selektoriuje | Priedų 27 blokas. Dizaineriui. |
| ~~Archyvas~~ | **Padaryta v2.27.0:** paieška pildo `rinka.db` | Iki šiol archyvą pildė tik admino skenavimas – paieškų duomenys dingdavo, nors puslapiai apmokėti. 0 papildomų kreditų. Nauji laukai `nuotrauku_sk`, `teksto_ilgis`; nuasmenintas CSV eksportas Analitikui. Atsakymai – `claude/ATSAKYMAI-DUOMENU-BAZE.md`. |
| Skenavimų eilė | **Padaryta v2.27.3** | `POST /admin/rinka/eile` – 30 skenavimų po vieną, su sąmata ir kreditų sargu kiekvienam žingsniui. Nieko nepaleista: laukia KL-1019-0400. |
| Kryptingi skenavimai | Analitiko 15 modelių planas | Modelio skenavimas padarytas (v2.27.1). Liko: pamatuoti skelbimų kiekius (300 kr.) ir Luko leidimas savaitiniam grafikui. |
| ~~Nr.55~~ | **Ištaisyta v2.28.1:** BMW 5 paieška grąžindavo X1/X3/X5 | Modelio filtras buvo poeilė: „X1 **1.5**“ ir kaina „37 900“ turi „5“, o `rawText` – visada. Dabar raktas per `baziniModelis`. Naujas `modelio-atitikimas.js`, sargas 61. |
| ~~Nr.52~~ | **Ištaisyta v2.28.1 + v2.28.2:** mobile.de nuoroda metė 500 | Žinoma portalo apsauga grąžindavo serverio klaidą su techniniu tekstu. Dabar 503 + žmogiškas paaiškinimas; kreditas grąžinamas. Naujas `klaidu-atsakai.js`, sargas 27. |
| ~~Nr.53~~ | **Ne klaida:** įspėjimas atrodė kaip klaida | Eigos sąraše mūsų pačių eilutė „modelio filtras portale nesuveikė“ su įspėjimo ženklu. Priežastis ta pati kaip Nr.55 – po v2.28.1 atsiras daug rečiau. |
| ~~Nr.51~~ | **Ištaisyta v2.28.1:** „G05 (2018–dabar, LCI nuo 2023)“ | Skaitėsi taip, lyg pradinis variantas vis dar gaminamas. Dabar „G05 (2018–2023, LCI 2023–dabar)“. `regitra.kartosEtikete`, sargas 16. |
| Nr.54 | Pereinamųjų metų kėbulas iškreipia kainą | **Dalinai:** v2.28.0 kreivė fazės nenaudoja, tad prognozė tvarkinga; mediana vis dar maišo. Pilnas sprendimas – Analitiko kartų pradžios mėnesiai. |
| KL-1019-0510 | Dvi identiškos paieškos lygiagrečiai | Žurnale 10-19 du darbai tuo pačiu metu skaitė tuos pačius 50 autoscout24 ir 23 mobile.de puslapius. Gali būti du langai, gali būti dvigubas siuntimas – nespėlioju. Siūlau sargą „ta pati paieška jau vykdoma“. **Luko sprendimas.** |
| ~~Kainos kreivė~~ | **Padaryta v2.28.0:** kaina lyginama su tokio pat amžiaus ir ridos auto | Luko „Darom“ 10-19. Analitiko koeficientai (14 modelių), paklaida 16,6 % vs 54,5 % vienai medianai; perskaičiuota savo eksporte, sutampa ≤1,6 proc. p. Rodoma skelbimo puslapyje. **Nekeičia** balo, 12/15 % slenksčių, filtro „žemiau rinkos“, `itariamaZala` ir MAX – jie toliau ant medianos. Liko: Luko sprendimas, ar kreivę kelti į balą ir į maržą; įklijuotos nuorodos kelias kreivės nerodo (nėra ridos). |
| Faceliflo priedas | Analitiko +5–7 % – **neįdėta** | Perskaičiavau: su laiko trendu 0 ± 3 proc. p., be trendo auga su langu (+6,2 → +18,7 %), placebo toje pačioje specifikacijoje irgi +9,6 %. Luko sprendimas: „tegul analitikas užbaigia“. Patikra – `claude/FACELIFTO-PATIKRA-2026-10-19.md`. |
| Pardavėjo tipas į maržą | +7,7 % (ne +9,0 %) | Luko „Gerai darom“ 10-19. Kodo dar nėra – eina kartu su `maxPirkimo` pataisa. |
| Archyvo valymas | 24 mėn. + mėnesio agregatas (Luko KL-1019-0315) | **Sprendimas yra, kodo dar nėra.** Pirma eilutė sueis 24 mėn. 2028-ais. Darysiu kartu su agregatų lentele (`modelis × karta × metai × rinka → mediana, imtis, mediana dienų iki dingimo`), kurios reikės „maržai ir laikui“. |
| „Marža ir laikas“ | Nemokama kortelės dalis (Luko KL-1019-0320) | Laukia archyvo istorijos: 3–6 mėn. nuo 10-19. |
| Archyvo terminas | Kiek laikom eilutes (TEISE.md R-02) | Siūlau: su `dingo` senesnės nei 24 mėn. – trinti, palikti mėnesio agregatą. **Luko sprendimas.** |
| K-73a | 59 sk. `small` netelpa į 136 px | Pamatuota: `guess` 120 px, `own` 153 px prieš 112 px vidų. Dizaineriui. |
| K-75 | `.ct-bukle` dabar neša dvi prasmes | Pigumo žyma įdėta į esamą 52 sk. komponentą (tvirta/punktyras prasmė sutampa). Eilutėje gali stovėti dvi žymos – telpa, bet dizaineris sprendžia, ar pigumui duoti savo vardą. |
| 53 paketas | `card` klasė nuo apvalkalo (DZ-KORTELES: visi trys) | v2.11.0; prieš – JS `closest('.card')` / `.card` paieška. |
| Stabdis | Kiekis portaluose + kaina + stabdis + Stop | **Dalis padaryta v2.15.0:** puslapių pasirinkimas iki „visų“ + kainos riba (`PAIESKOS_RIBA_KR`, 200 kr.) su langu „per didelė paieška“. Liko: Stop mygtukas (KL-STOP), kiekis portaluose prieš paiešką (DZ-LENTELE) ir admin kreditų rodinys pagal vartotoją (KL-F3PLUS). |
| Modelio apžvalga | „Analizuoti modelį“ (Luko prašymas 09-24) | **Padaryta v2.16.0:** mygtukas po paieškos, Regitros/TA/mūsų kainų istorijos skaičiai + AI su web paieška, 2 kr., talpykla 30 d. Liko: gyva patikra produkcijoje ir dizainerio langas (inline stiliai). |
| Teisininkas | KL-TEISININKAS: taip | Faktų dokumentas iš kodo, pirma žinutė, rolė DARBO-SISTEMA. |
| KL-PATIKRA2 | Filtrai kaip autoplius | Metai, kaina, rida, galia – sąrašai; neįvesta → „–“; varantieji ratai ir kuras – autoplius variantai. |
| FN-0922-1300 | Nauji planai `planai.js` + LT/užsienio paieškų skaidymas | Iki 10-15. |
| KL-R1 / KL-R2 | Kainos kritimo žyma; atsuktos ridos įspėjimas | Luko „taip“. 0 kreditų. |
| KL-F3PLUS | ScraperAPI paros žurnalas + <20 % įspėjimas | Luko „taip“; jungti su stabdžio admin rodiniu. |
| KL-MODELIS | Sonnet 5 bandymas 3–5 apžvalgomis | Mokama – su Luko žinia. |
| ~~DZ-TINDER~~ | Atšaukta 10-16 (Luko sprendimas „tik perpardavėjams“) | Dizaineris nepradėjo. |
| A punktas | Mediana atskirai pagal rinką | **Padaryta v2.17.0:** `backend/rinkos.js` + `rinkos-mediana.js` rinkos (LT/DE/EU/PL), kortelėje „VOKIETIJOS RINKA“ ir „≈ LIETUVOJE“. Liko: tikri Luko kaštų skaičiai ir taršos mokestis. |
| C punktas | Taršos (registracijos) mokestis | **Padaryta v2.18.0:** `backend/tarsos-mokestis.js` – rėžis pagal kurą ir variklio tūrį, nes CO₂ skelbimuose nėra. EV/PHEV 0 €. |
| KL-1016-KASTAI | Parsivežimo kaštai | **Primesta v2.18.0** iš viešų šaltinių: DE 450, PL 300, EU 700 €; Regitra 20 €; TA 30 €; paruošimas 250 €. Luko patikslinimas – kai turės tikrus vežėjų skaičius. |
| Užsakymas klientui | Trijų rinkų paieška su sekimu | Planas `claude/UZSAKYMAS-KLIENTUI.md`. 1 žingsnis (A+kaštai) padarytas v2.17–2.18; **2 žingsnis – rodinys, Luko „taip darom“, reikia dizainerio**; 3 – sekimas kartu su Radaru. |
| Tik perpardavėjams | Produkto peržiūra | Luko sprendimas 10-16: platforma tik perpardavėjams ir tiems, kas ieško auto kitiems. Reikia peržiūrėti, ką išmesti (asmeninio pirkėjo režimas, Tinder) ir pertvarkyti kliento kortelę. |

## Dizaineris

| Nr. | Kas | Trumpai |
|---|---|---|
| 66 … 71 pk. (su Erratomis 17, 18) | **Įdiegta v2.19.0 … v2.22.1** | 51 sk. `.ct-dtable`, 51b sk. `.ct-dtable-bar`, 52 sk. `.ct-bukle`/`.ct-seg`, `--shadow-1`. |
| ~~Priedų 24 blokas~~ | **Ištrintas v2.22.1** (71 pk.) | Dizaineris perėmė visus keturis vardus į 51b sk. Priedai 195 → 166 eil. |
| K-71a | 52 sk. legenda telefone | Telefono `display:none` (0,1,0) nebeveikė po 51b `:not([hidden])` (0,2,0) failo gale. Perkelta į 51b `@media` ta pačia forma; pamatuota 390 px abiem rodiniais. Dizaineriui – patvirtinti arba grąžinti savaip. |
| ~~K-66a~~ | `--dt-h` | **Uždaryta** (Errata 17): `:root`, atsarginė nuimta. |
| ~~K-66b~~ | `--neutral` | **Uždaryta** (Errata 17): `--neutral-dim`/`-border` perrašyti per jį 10 %/26 % – 0/255 skirtumas. Tokenų skola **0 + 0**. |
| K-66c | `.adm-users` → `.ct-dtable` | Atidėta į B dalį: `.ct-dtable` neperima 4 admino taisyklių. |
| ~~dz-perpardavejas B~~ | **Įdiegta v2.20.0** | 53 sk. `.ct-mkts`, 54 sk. `.ct-money`, 55 sk. `.ct-pipe`. |
| K-68a | `.adm-users` → `.ct-dtable` | Bendros klasės yra; liko `admin.html` markupas – su perpardavėjo rodiniu kartu. **Dizaineris sutiko.** |
| Dizaineris | **Nieko nelaukia** | 66/67/68/69 įdiegti; visi klausimai atsakyti. Nuorodos analizė: 1 kr. greita / 2 kr. pilna, trečia `cached` būsena „kaina pasikeitė". |
| Prieiga | `Downloads\cartriige-dizaineriui` | Tikros kopijos (junction'ai neveikė). Patikra: `ct-priedai.css` eil. sk. + ši pirma eilutė. |
| `#search-btn` | 5-as ID mygtukas | Gradientas / švytėjimas / `:disabled` sistemoje ar vientisas CTA? Z-93. |
| Kiti vardai | `.ct-btn-accent` (priedų 5), `.ct-regitra` (15), `.mg-atn-busena` (12), `.ct3-portal-ico` | Dizaineris pažadėjo kitame pakete. |
| Tab žiedas | `--focus-offset` (43 pk.) | Vizualiai nepatikrinta — laukia Luko. |
| `.ct-istorija` užpildas | 12 (veikia, index 2144 `!important`) ar 14 (1340, niekada nesuveikė) | Dizaineris spręs, kai ims istorijos juostą (D-48). Iki tol 2144 neliečiama. |
| `.card.ct-card` (index 1138) | `margin-bottom:14px; border-radius:16px`, specifiškumas 0,2,0 | Nugali 52 paketo `--s-2`/`--s-3` ir `.ct-card` 14 – tikras tarpas TOP ir STD 14, radiusas 16 (Z-111). Dizaineris sprendžia, ar perimti. |
| `46 sk.` `.ct-portals` | Įdiegta CSS (v2.10.8) | Markupas (`--cols`, `data-k`) – su stabdžiu kartu su 54 paketu. K-55a: 352 px „Iš viso“ fonas lopais. |
| `.ct-modal` dubliai | Sutraukta (v2.10.8) | Pirmas blokas ištrintas, `.ct-modal-x` ir `overflow` perkelti. |
| 54 paketas | Laukia | Diegiama kartu su stabdžiu (`54-vykdymo-busena-v2.zip`). |
| 56a paskyra | Įdiegta (v2.11.0) | 47 sk., Errata 9, akcentas mėlynas (tokenai). Ranka rašyta violetinė liko ~60 vietų (Z-124). |
| 57 paketas | Įdiegta (v2.11.0) | Sprite 6, `[hidden]`, C1, C2. K-57a `.ct-bar` 1260 currentColor; K-57b ct-bendras `:root` 1–23. C3 – VIOLETINE-GREP.md. |
| `48 sk.` admin | Įdiegta (v2.12.1) | `.pg-adm`, `.adm-*`. Skirtukai — esami `.ct-tabs`. Markupas ir JS — Klaudijaus (suvestinė, vartotojai, užklausos). |
| `49 sk.` Nr. 30 | Įdiegta (v2.12.1) | `.ct-hdr-plan` + `.ct-avatar` šešiuose puslapiuose; JS deda `is-low` (<5) / `is-zero` (0) ant `<u>`. |
| 1 sk. komentarai | Įdiegta (v2.12.1) | Violetinė → mėlyna, 3,7 / 5,2, `--shadow-panel` gyvas nuo 58 pk. |
| Užsakymas ≠ serveris | Dizaineriui | „7 d.“, „AI apžvalgos“, „paskutinis aktyvumas“ — laukų nėra. DZ-SUVESTINE laukia Luko. |
| ~~K-60~~ | `.adm-chart > span[style*="--v:0"]` | Pagauna ir `--v:0.345` — visi stulpeliai tapdavo pilki 2 px. Apeita: reikšmės rašomos be nulio priekyje (`--v:.345`). |
| ~~K-61~~ | `.adm-share` po Erratos 12 | Bazėje `align-items: center` (grid), Errata perjungia į `flex-direction: column` jo nenuėmusi — juosta 0 px. Priedų 22 blokas. |
| ~~K-62~~ | `.adm-users` 3 ir 7 stulpeliai | `2026-10-19` mono 12 px netelpa į 92 px: eilutė 68 px vietoj 52. Priedų 23 blokas (tik ≥641 px). |
| ~~K-63~~ | `.adm-fund-scale` telefone | **Uždaryta** (Errata 14, v2.13.2). Visi keturi K-60…K-63 uždaryti. |
| 60 navy | Įdiegta (v2.13.0) | Devyni `:root` tokenai; Erratos lokalus blokas ištrintas. 43 ranka rašytos vietos pakeistos, 0 lopų po matavimo. |
| K-64 | `.ct-fld-x` per `--bg-base` | **Uždaryta** (Errata 13, v2.13.1). |
| `:root` dubliai | Ištrinti (v2.13.1) | index ×2, compare ×2, detail ×1. `--bg-card` buvo vienintelis niekur nenaudotas tokenas. |

## Analitikas

| Nr. | Kas | Trumpai |
|---|---|---|
| K-29 | Nurašymų riba 40 vs 50 | Su amžiaus vartais 40 nebėra triukšmingas. Z-52. |
| K-30 | Ar `rida_kv` naudotinas skelbimui | Normalus 2–4 m. X5 gautų klaidingą 🟡. Z-52. |
| K-79 | `likutis_q` skalė | Dokumente `skirtumas = kaina/prognozė − 1`, bet kvantiliai log skalėje. Įdiegta per `log(kaina/prognozė)`. Patikslinti dokumentą. |
| K-80 | P75–P90 juostos nėra | Specifikacijoje keturios juostos iš penkių. Įdėjau „brangesnis nei 75 %“. |
| K-81 | `elektra` ir `benzinas/dujos` be koeficiento | Nė viename modelyje (archyve 330 ir 91 skelbimas) – vertinami kaip bazinis kuras. |

## Lukas

Žr. `LUKUI.md`.

## `ct-priedai.css` blokai (laikini, laukia dizainerio)

| Blokas | Kas | Perims |
|---|---|---|
| ~~1~~ | `.ct-card .ct-photo img` / `.ct-thumbs img` | **Ištrintas** (v2.13.5). Matavimas su tikru markupu: pokyčių nėra. |
| ~~2~~ | `.ct-l3 > .ct-istorija` | **Perimta į 39 sk.** (Errata 16, v2.13.4). |
| ~~K-65~~ | `.ct-photo` pervadinimas | **Atšauktas** – tikrasis markupas jau atitinka sistemos 1 sk. struktūrą. Mano klaida: skaičiau `index.html` CSS, ne JS piešiamą markupą. |
| 8 | `#more-filters` iš inline | NETRINTI (mūsų) |
| 26 | `.ct-dt-meta` telefone lūžta (pigumo žyma, K-75) | Dizaineris – arba į 51 sk., arba pigumui savas vardas |
| 27 | `.ct-link-msg[hidden]` (K-76) | Dizaineris – `:not([hidden])` į 56 sk. |

Blokai 3–7, 9–25 jau ištrinti. Gyvų taisyklių faile – **5**: `.ct3-more-panel`, `.ct3-more-row` (8 blokas), dvi 26 bloko telefono eilutės ir `.ct-link-msg[hidden]` (27).



## Kur kas guli

- Taisyklės: `TAISYKLES.md` · Planas: projektas „Cartriide" → `claude/DARBO-SISTEMA.md`
- Versija: `frontend/versijos.js` — vienintelė vieta
- Dizainerio veidrodis: `tools/veidrodis-dizaineriui.ps1` (po kiekvieno commit'o)
- Filtrų plėtra: `FILTRAI-PASIULYMAS.md` · Regitros galimybės: `REGITRA-GALIMYBES.md`
