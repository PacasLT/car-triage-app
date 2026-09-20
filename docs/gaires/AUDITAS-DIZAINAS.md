# Dizaino auditas · playbook

Į ką atsako: **ar visuose šešiuose puslapiuose galioja tos pačios taisyklės** – tokenai, šriftai, mygtukai – ir kur jos išsiskyrė.

Puslapiai: `index.html`, `detail.html`, `compare.html`, `ataskaitos.html`, `megstamiausi.html`, `admin.html`.
`admin.html` yra **generuojamas** (`tools/mk-admin.py`) – radinys taisomas šablone, ne faile.

---

## 0. Paleidimas

```bash
cd frontend
node ../backend/testai/dizainas.test.js
python3 ../tools/tokenu-patikra.py
python3 ../tools/onclick-patikra.py
# mygtukams reikia veikiančio peržiūros serverio:
node ../backend/testai/mygtukai.test.js
```

Sargas krenta → radinys jau rastas, eik į 6 skyrių.
Visi sargai žali → tai dar ne švara, o tik „skola neaugo". Toliau – rankinės patikros.

---

## 1. Tokenai ir jų ryšiai

`python3 tools/tokenu-patikra.py` atsako į keturis klausimus:

| Patikra | Kodėl svarbu | Riba |
|---|---|---|
| **Naudojami, bet neapibrėžti** | `var(--x)` be apibrėžimo – elementas tyliai gauna atsarginę reikšmę | **0** (išimtis: JS per `style.setProperty()` nustatomi tokenai – surašomi į `ZINOMOS-ISIMTYS` sąrašą įrankyje) |
| **Apibrėžti, bet nenaudojami** | Negyvas tokenas; dizaineris nežino, kad jo nebereikia | mažėja kas paketą |
| **Apibrėžti keliose vietose** | Du šaltiniai tai pačiai spalvai | tik `ct-dizainas.css` |
| **Reikšmių skirtumai** | Tas pats vardas, kitos spalvos – matoma tik jei sutriktų failų eilė | **0** |

**Svarbiausias iš jų – ketvirtas.** Kol `ct-dizainas.css` prijungtas paskutinis, jis laimi ir viskas atrodo gerai. Bet tai reiškia, kad puslapis turi **dvi paletes**, ir antroji pasirodo tada, kai:

- tinklas neatiduoda `ct-dizainas.css` (naudotojas mato seną paletę ir praneša „spalvos keistos");
- puslapis piešiamas iki `</body>` (senoji paletė matoma kraunantis – FOUC);
- kas nors nukopijuoja `<style>` bloką į naują puslapį.

Patikra rankomis, jei įrankio nėra po ranka:

```bash
cd frontend
grep -n ":root" *.html *.css                        # kiek dar gyvų :root blokų
grep -rn "var(--" *.html *.css *.js | wc -l         # kiek ryšių iš viso
```

---

## 2. Šriftai

```bash
cd frontend
grep -n "fonts.googleapis.com/css2" *.html          # visuose 6 ir su tais pačiais svoriais?
grep -n "</head>" *.html                            # ar nuoroda <head> PRADŽIOJE?
grep -rn "font-family:" *.html *.css *.js | grep -v "var(--font"
grep -rn "font:.*px" *.html *.js | grep -v "var(--font" | wc -l
```

Ko ieškom:

- šrifto nuoroda **visuose** puslapiuose, tie patys svoriai (`400;500;600;700` + mono `400;500;600`);
- nuoroda **prieš** CSS, ne po šimtų eilučių stiliaus – kitaip puslapis pirmas 200 ms piešiamas sisteminiu šriftu;
- `font-family` be `var(--font)` – tik `inherit` yra leistinas;
- `font: 700 14px var(--font)` gerai, `font: 700 14px Archivo` – radinys.

---

## 3. Mygtukai

```bash
node backend/testai/mygtukai.test.js     # matuoja visus matomus mygtukus
```

Sistema leidžia **tris aukščius, du radiusus, tris šriftų dydžius**:

| Aukštis | Kam |
|---|---|
| 38 px | įprastas |
| 46 px | `.ct-btn-lg`, `.ct-tab` |
| 32 px | `.ct-btn-sm`, `.ct-seg` |
| 56 / 64 px | **tik** `@media (max-width: 640px)` |

Kiekvienas kitoks skaičius yra nukrypimas ir turi būti sąraše su priežastimi.

**Trys papildomi klausimai, kurių testas neuždavė:**

1. **Ar tas pats veiksmas visur vadinasi vienodai?** „Detali apžvalga →" ir „Pilna apžvalga · 2 kr" buvo tas pats veiksmas dviem vardais. Tai blogiau nei skirtingas dydis – naudotojas nežino, ar tai tas pats dalykas.
2. **Ar veiksmų eilė ta pati?** `[išorinė nuoroda] [išskleidimas] [palyginimas] ⟵tarpas⟶ [pirminis]`. Sudėtis gali skirtis, eilė – ne.
3. **Ar naikinantis veiksmas stovi atskirai?** Niekada ne veiksmų eilėje – kortelės dešinysis viršus.

**Matas yra PALYGINIMAS, ne absoliutus skaičius.** 32 px mygtukas yra visiškai tvarkingas mygtukas – tik ne tas, jei tas pats elementas kitame puslapyje 38 px. Todėl tas pats elementas visada matuojamas visuose puslapiuose, kur jis yra.

---

## 4. Dubliavimasis tarp puslapių

```bash
cd frontend
# ta pati klasė apibrėžta keliuose failuose
grep -rhno "^\s*\.[a-z][a-zA-Z0-9_-]*\s*{" *.html *.css | sed 's/.*\(\.[a-zA-Z0-9_-]*\).*/\1/' | sort | uniq -c | sort -rn | head -30
# <style> blokų eilė monolituose
grep -n "<style" index.html detail.html compare.html
# JS, kuris injektuoja stilius
grep -rn "head.appendChild\|head.prepend\|insertAdjacentHTML.*style" *.js
```

Ko ieškom:

- **to paties klasės vardo dviem skirtingiems dalykams.** `.ct-table` yra ir `<table>`, ir raktas/reikšmė `<div>` sąrašas; `.ct-kv` – ir eilutė, ir jos konteineris. Šiandien nekenkia, bet pridėjus `display:table` bet kurioje pusėje – lūš.
- **`<style>` blokų eilės**: vėlesnis nugali ankstesnį prie tos pačios specifikos. `index.html` mobilųjį bloką perrašo keturi blokai po jo – tai žinoma skola.
- **JS injektuoto CSS**: `megstami-meniu.js`, `paskyra-meniu.js`, `versijos.js` įdeda visą komponento CSS per `head.appendChild()`. Jie visada nugalės failinį CSS, nes yra vėliausi. Galutinis sprendimas – išvaizdos deklaracijas iš jų ištrinti.

---

## 5. Specifikos konfliktai

Kai elementas „dingo" arba dydis neklauso:

1. **Pirma žiūrima dizainerio 12 skyriaus `!important` taisyklių**, ne savo CSS.
2. Tikrinama, ar `height` nekovoja su `min-height` – **`min-height` laimi**. Matuojamas pats dydis, ne tik ar telpa: **0 px slinkimo nereiškia, kad dydis teisingas.**
3. Tikrinama, ar `display` neuždėtas elementui, kurio vaidmenį nustato tėvas (`<td>`, flex vaikas). Apkarpymas priklauso vidiniam `<span>`, ne langeliui.
4. Tikrinamas inline `style=""` – jis nugali bet kurį dizainerio failą. Du kartus tas pats radinys: `#more-filters` ir jo vidinis `<div>`.
5. Atsvara rašoma **tik** `ct-priedai.css`, su komentaru `ATŠAUKIMAS: ištrinti, kai dizaineris perims` ir įrašu žurnale.

---

## 6. Radinys → užduotis

Kiekvienas radinys gauna eilutę:

> **Nr. · ką matė naudotojas · elemento selektorius · MATAVIMAS · ko reikia · krūva**

Trys krūvos:

- **mano** – galiu ištaisyti pats (atsvara, klasė, JS);
- **dizainerio** – reikia jo skyriaus sprendimo (naujas tokenas, nauja spalva, naujas komponentas) → `pasikeitimai/UZDUOTYS-DIZAINERIUI.md` + `K-nn` klausimas žurnale + ekranvaizdis į `pasikeitimai/matavimai/`;
- **Luko** – reikia produkto sprendimo, sumos ar patikros produkcijoje.

**Grupuojama pagal šaknines priežastis, ne po vieną.** Keturi pločio pranešimai buvo viena `max-width` eilutė.

Dizaino sprendimo klausiama **tą pačią akimirką**, ne po darbo: vienas sakinys `K-nn`, matavimas kaip įrodymas, ir laikina atsvara, jei darbas negali sustoti.
