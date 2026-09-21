# Filtrų plėtra – autoplius ir mobile.de palyginimas (2026-09-22)

Šaltiniai: autoplius.lt/paieska/naudoti-automobiliai (171 laukas formoje),
mobile.de detali paieška (270 laukų). Peržiūrėta naršyklėje, formų laukų vardai – iš DOM.

## Ką turim dabar

11 laukų: markė, modelis, metai, kaina, rida iki, kuras, pavarų dėžė, varantieji ratai,
galia, puslapių kiekis, portalai. „Daugiau filtrų": be JAV, tik su VIN, tik su istorija,
be defektų, be vairo dešinėje, tik Lietuvoje (dauguma – tik autoplius/autogidas).

## A. Duomenys, kuriuos JAU turim, bet nefiltruojam (0 kreditų, filtruojam patys)

| Filtras | Iš kur turim | Portalai |
|---|---|---|
| Pardavėjas: privatus / įmonė | `yraVerslas`, `pardavejoInfo.privatus`, DB `verslas` | visi 5 |
| Skelbimo amžius („ne senesni nei 1/3/7/14 d.") | `ikeltaLaikas`, `ikeltaTekstas`, mobile.de `ikelta` | visi 5 |
| Garantija | `turiGarantija`, `garantijosTipas`, DB `garantija` | as24, otomoto, mobile.de, autogidas |
| Šalis / miestas | `vieta`, `miestas`, `salis` | visi |
| Kėbulo tipas | DB `kebulas` (autoplius, autogidas) | dalis |
| Variklio tūris | `variklioTuris` | visi |
| Neįtraukti aukcionų / JAV | `aukcionas`, `galimasJavImportas` | autoplius, autogidas |
| Kaina žemiau rinkos ≥ X % | `diffPct` (mūsų skaičiavimas) | visi |
| Minimalus CarTriige balas | `qualityScore` | visi |
| Portalo kainos vertinimas („gera kaina") | mobile.de `kainosVertinimas`, as24 `portaloKainosVertinimas` | mobile.de, as24 |
| Tik su lizingo galimybe / be | `turiLizingoOpcija` | as24, otomoto, mobile.de |

## B. Portalų filtrai, kurių dar nesiunčiam (sutaupo kreditų – nuskaitoma mažiau)

| Filtras | autoplius | mobile.de | Pastaba |
|---|---|---|---|
| Kėbulo tipas | `body_type_id[]` (10) | `category` (OffRoad, EstateCar, Limousine…) | otomoto/as24 irgi turi |
| Pardavėjas | `is_partner` (Privatus/Verslas) | `seller_type` (DEALER/FSBO) | |
| Įdėta per paskutines N d. | `older_not` (1,3,7,14,30,60) | „Inserat online seit" (1,3,7,14) | tinka „naujausi" režimui |
| Aukcionai | `auction` (tik/neįtraukti) | – | |
| Variklio tūris nuo-iki | `engine_capacity_from/to` | `cubic_capacity` | |
| Spalva | `color_id[]` (10) | `exterior_colour` (13) + metallic | |
| Sėdimos vietos / durys | `number_of_seats_id[]`, `number_of_doors_id` | `seats`, `door` | 7 vietos SUV pirkėjams |
| Euro klasė | `euro_id` | `emission_class` | |
| Savininkų skaičius | – | `previous_owners` (iki 1–4) | tik mobile.de |
| TA / HU galioja | `technical_passport` | `general_inspection` (3–18 mėn.) | |
| Serviso knygelė | `f26` | `FULL_SERVICE_HISTORY` | |
| Nerūkyta | – | `NONSMOKER_VEHICLE` | |
| Elektromobiliams | baterija, nuotolis, jungtys | – | tik jei rodysim EV |

## C. Įranga (autoplius ~100 `fNN` žymų, mobile.de ~80)

Bendros abiem, dažniausiai klausiamos: odinis salonas, navigacija, kablys, panoraminis
stogas, šildomos sėdynės, adaptyvus kruizas, 360° kamera, pneumatinė pakaba,
LED/Matrix žibintai, beraktė sistema, Apple CarPlay/Android Auto.
Dalį galim filtruoti ir patys – AI jau ištraukia įrangą pilnoje apžvalgoje, bet paieškos
sąraše įrangos neturim, todėl čia – tik per portalų filtrus.

## Siūlomas pirmas paketas (sprendžia Lukas)

1. **Pardavėjas** (privatus / įmonė / visi) – portale + mūsų duomenyse.
2. **Įdėta per paskutines N dienų** – portale (autoplius, mobile.de) + patys kitiems.
3. **Kėbulo tipas** – portale.
4. **Kaina žemiau rinkos ≥ X %** ir **min. CarTriige balas** – rezultatų filtras (be kreditų).
5. **Garantija**, **neįtraukti aukcionų** – į „Daugiau filtrų".
6. Įranga – vėliau, atskiras dizaino klausimas (daug žymų).
