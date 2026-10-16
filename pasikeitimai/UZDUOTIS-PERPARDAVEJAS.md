# Užduotis dizaineriui · dz-perpardavejas

**Data:** 2026-10-16 · **Nuo:** Klaudijus · **Veidrodis:** v2.18.0 (atnaujintas)
**Ankstesni, vis dar laukiantys:** DZ-FILTRAI (09-23), DZ-LENTELE

---

## Kas pasikeitė produkte (kontekstas, 1 min.)

Luko sprendimas 10-16: **CarTriige nuo šiol skirtas tik perpardavėjams** ir tiems, kas ieško
automobilio kitam žmogui. Ne pirkėjui sau.

Tai keičia pagrindinį kortelės klausimą:

| Buvo | Tampa |
|---|---|
| „Ar šis automobilis geras?" | **„Kiek iš jo uždirbsiu ir už kiek galiu pirkti?"** |

Techniškai pamatas jau padėtas (v2.17.0–v2.18.0): kaina lyginama su savo šalies rinka
(LT / DE / EU / PL atskirai), ir skaičiuojama apytikslė kaina Lietuvoje su parsivežimu bei
taršos mokesčiu. Tų duomenų kortelėje dabar yra, bet jie sudėti į seną hierarchiją.

---

## 1. Tankios lentelės komponentas (pagrindinis darbas)

Perpardavėjas lygina 20–40 variantų vienu metu. Korteles jis skaito tik tada, kai jau atrinko.

Ko prašom:

- **20–40 eilučių ekrane**, rikiavimas paspaudus stulpelio antraštę, lipni antraštė
- Skaičiai `tabular-nums`, kad stulpelis būtų lyginamas akimis
- Eilutė – nuoroda į skelbimą; pažymėjimas (checkbox) partijų veiksmams
- **Pavyzdys sistemoje jau yra:** `.adm-users` admin zonoje (48 sk., `display: contents`,
  be `<table>`). **Klausimas tau:** ar jis tampa bendru komponentu, ar perpardavėjui darom
  atskirą? Mums tinka abu, bet sprendimas tavo.

### Stulpelių hierarchija (nuo svarbiausio)

```
MAX PIRKIMO KAINA   ← svarbiausias skaičius visame produkte
≈ KAINA LIETUVOJE   ← kaina + parsivežimas + taršos mokestis
PELNAS PO KAŠTŲ
ROI %
LIKVIDUMAS         ← per kiek parduosi (Regitros apyvarta)
KABO DIENŲ         ← derybų svertas
rida vs norma · rizika · komplektacija   ← smulkiau
```

**Max pirkimo kaina** yra naujas ir svarbiausias: nurodai norimą maržą, ir rodom, daugiausia
kiek gali mokėti, kad ta marža liktų po visų kaštų. Tai skaičius, su kuriuo žmogus eina
derėtis. Jis turi rėžti akį.

**Klausimas tau:** kaip rodomas tas vienas svarbiausias skaičius lentelėje, kur visi stulpeliai
vienodo svorio? Spalva, svoris, fonas, ar atskiras pirmas stulpelis?

---

## 2. Trijų rinkų rodinys

Viena paieška → **trys atskiri sąrašai**, po vieną kiekvienai rinkai:

```
🇱🇹 LIETUVA          🇩🇪 VOKIETIJA        🇵🇱 LENKIJA
geriausi            geriausi            geriausi
galutinė kaina      + parsivežimas      + parsivežimas
```

Po jais – **verdiktas per rinkas**, viena eilutė:

> Pigiausias nusileidęs: **DE** 41 340 € prieš geriausią LT 43 900 €.
> Skirtumas 2 560 €, bet +9 dienos.

**Klausimai tau:**
- Trys skiltys greta, ar skirtukai (tabs)? 1400 px telpa trys, 390 px – ne.
- Kaip atrodo rinka, kurioje nieko nerasta?
- Ar verdiktas yra juosta viršuje, ar po sąrašais?

---

## 3. Kortelės hierarchijos perdarymas

Dabartinėje kortelėje (`.ct-*` blokas) viršuje stovi rizikos juosta ir nuotrauka. Perpardavėjui
viršuje turi stovėti pinigai.

- **Nuimti iš viršaus:** didelę „Rizika: 🟢 žema" juostą – ji lieka, bet eilutėje prie kitų
  požymių
- **Nuotrauka:** perpardavėjui užtenka vienos miniatiūros – jis vis tiek atidarys skelbimą.
  Ar mažinam, ar paliekam?
- **Rinkos blokas** (`.ct-market`) jau turi naujas eilutes: „VOKIETIJOS RINKA" vietoj „RINKOS
  VIDURKIS" ir „≈ LIETUVOJE". Dabar jos sudėtos į esamas klases
  (`.ct-market-row/-k/-v`) **be naujo CSS** – tavo failų neliečiau. Jei norisi kitaip, tai
  tavo sprendimas.

---

## 4. Būklės filtras į pagrindinę juostą

Perpardavėjui **daužtas automobilis dažnai yra prekė, ne įspėjimas**. Todėl trijų reikšmių
jungiklis keliasi iš „daugiau filtrų" į pagrindinę juostą:

```
○ tik tvarkingi    ○ tik daužti / su defektais    ● visi
```

Niuansas, kurį reikia parodyti vizualiai: mobile.de, otomoto ir autoscout24 turi **struktūrinį**
žalos lauką, o autoplius ir autogidas – tik tekstą aprašyme. Todėl skelbimas žymimas arba
**„pažymėta portale"**, arba **„spėjama iš aprašymo"**. Reikia dviejų skirtingo svorio žymų.

---

## 5. Būsenos ir tušti ekranai

- **Pirkimo sąrašo būsenos:** stebiu · skambinau · derybos · nupirkta · praleista
- **Įrankių juosta:** filtrai, partijų veiksmai (žymėti kelis), eksportas
- **Telefonas 390 px:** kas lieka iš lentelės? Perpardavėjas tikrina telefonu stovėdamas prie
  automobilio – tai realus naudojimo atvejis, ne kraštinis
- **Tušti ekranai:** nėra progų pagal kriterijus; pirkimo sąrašas tuščias; rinkoje nieko nerasta

---

## 6. Kas atšaukiama

**DZ-TINDER nebedaromas.** Braukomi auto vienas po kito yra pirkėjo sau pramoga.
Perpardavėjas lygina dvidešimt variantų lentelėje. Jei jau pradėta – stabdyk.

---

## 7. Failai ir ribos

| Failas | Kam |
|---|---|
| `frontend/ct-dizainas.css` | 46 sk. `.ct-portals`, 48 sk. `.adm-users` (lentelės pavyzdys) |
| `frontend/admin.html` | lentelės markupas, kaip ji atrodo gyvai |
| `frontend/index.html` | `.ct-market` blokas su naujomis eilutėmis |

Dizainerio failų (`ct-dizainas.css`, `ct-mygtukai.css`, `ct-ikonos.html`) nekeičiu – jie tavo.
Veidrodis `Downloads\cartriige-dizaineriui` atnaujintas iki **v2.18.0**.

Žinoma skola, jei kliūtų: `--shadow-1` naudojamas, bet neapibrėžtas; `--k-unknown` ir
`--shadow-3` apibrėžti, bet nenaudojami.

---

## 8. Ko iš tavęs laukiam

Vieno paketo, kuriame:

1. tankios lentelės komponentas (ir atsakymas, ar jis bendras su `.adm-users`),
2. trijų rinkų išdėstymas 1400 ir 390 px,
3. perdaryta kortelės hierarchija,
4. būklės filtro jungiklis + dvi žymos,
5. būsenų žymos ir tušti ekranai.

Jei kuri nors dalis per didelė vienam paketui – pasakyk, kurią dalini, ir darom per du.
