# Užduotys dizaineriui · iš klaidų sąrašo

Sugeneruota **2026-09-18, v1.80.0** (gyva), iš gyvo `/admin/klaidos`.
Perrašoma visa iš sąrašo, ne iš atminties.

Kiekviena eilutė: **Nr. · ką parašė Lukas · selektorius · ką pamatavau · ko reikia.**

---

## Laukia JŪSŲ

| Nr. | Lukas | Elementas | Pamatuota | Ko reikia |
|---|---|---|---|---|
| **27** | „Pašalinam šitą tekstą" | `.ct3-hero-content` | 390/768/1280+: turinys **340 / 600 / 600**, nuotrauka 180 / 380 / 600, sekcija 620 = 600 + 20 | **`K-15` ATSAKYTAS: Lukas pasirinko 2 kelą** – hero tampa juosta, panelė ant jos. Matavimai `Z-25`. Laukiu jūsų skaičiaus |
| **24** | „Reikia patobulinti filtro šoninio dizainą" | — | Šonas 540 px, telpa nuo 1180 px | Jūsų spėjimas (`A-21`), kad `K-13` tai uždaro. **Po push — Luko žvilgsnis** |
| **19** | „Išfiltravus skelbimus liko apačioje susitraukę" | — | Nepamatuota | Ar jau uždaryta 25 sk.? Galiu pamatuoti, jei pasakysit ką |
| **2** | „Atmesta irgi pabėgę" | — | Nepamatuota | Tas pats klausimas |
| **18** | „Detail puslapyje boksai slankioja" | — | — | Užblokuota `D-03` (šeši skydeliai) |
| **9** | „Pardavėjo info turi būti kortelėje" | — | — | Užblokuota `D-03` |
| **10** | „Dubliuojasi įvertinimai" | — | — | Užblokuota `D-03` |

---

## Uždaryta 17 pakete — patvirtinkit, kad supratau teisingai

| Nr. | Kas | Pamatuota |
|---|---|---|
| 28, 30 | Antraštės dešinysis blokas | 1400 px: 893 → **1141**; 390 px: mygtukai 93/44/44 |
| 16 | Admin lentelė telefone | 390 px: `tr` block, `td` flex, etiketės iš `data-stulpelis`, slinkimo 0 |
| 14 | Loading juosta | 2101 px: juosta **1236 px** = kortelės plotis, per visą stulpelį |

---

## Uždaryta 16 pakete

| Nr. | Kas | Pamatuota |
|---|---|---|
| 23 | Siauri filtrai tuščiame puslapyje | Prieš paiešką laukas 180 px su kortelės fonu; po — 119 px be fono |
| 26 | Portalų sąrašas nukerpamas | Kairė 13 px nuo šono, 0 nukirptų vardų (bet skydas 187, ne 240 — `K-18`) |
| 31 | „Filtro viršus negražiai sueina" | Keičiasi iš esmės su `K-13`; Luko patikra po push |

---

## Atviri klausimai jums

- **`K-18`** — `max-width: calc(100% - 12px)` skaičiuojamas nuo
  `.ct3-portal-wrap`, ne nuo stulpelio: skydas 187 px vietoj 240 px,
  dešinėje 76–100 px nepanaudota. Veikia, bet ne toks, kokį rašėt.
- **`K-17`** — prioriteto spalvos (`#kp-svarba` taškai). `ct-priedai.css`
  10 blokas — vienintelė likusi atsvara.
- **`D-03`** — laukia Luko sprendimo dėl šešių skydelių.

---

## Ne jūsų

- **Nr. 6, 15** — Luko (širdelė; BMW X4 suma).
- **Nr. 32** — dalis ištaisyta (antraštė 390 px), dalis laukia `K-15`.
