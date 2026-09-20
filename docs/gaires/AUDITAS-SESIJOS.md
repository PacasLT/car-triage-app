# Sesijų ir prisijungimo auditas · playbook

Į ką atsako: **kodėl prisijungimas kartais „pakimba"**, kur laikomas žetonas, kas nutinka, kai jis nustoja galioti, ir kaip turi veikti „Prisiminti mane" bei automatinis atjungimas.

---

## 1. Simptomas ir jo anatomija

> „Neleidžia prisijungti, nors rodo, kad prisijungęs. Perlogini – ir viskas gerai."

Tai ne atsitiktinumas, o **numatytas dabartinės sandaros elgesys**. Sesijos „prisijungęs" požymis yra vienas dalykas – **ar `localStorage` yra raktas `ct_token`**. Ar tas žetonas dar galioja, nežino niekas, kol kokia nors užklausa negrįžta su 401.

Todėl egzistuoja tarpinė būsena, kurioje:

- antraštė rodo avatarą su akcento rėmeliu = „prisijungęs";
- paskyros meniu atsidaro;
- bet kiekviena API užklausa grįžta 401;
- puslapis, kuris 401 neapdoroja, lieka tuščias arba su besisukančiu ratuku – **tai ir yra „pakibimas"**.

Perlogini → naujas žetonas → viskas veikia. Simptomas dingsta, priežastis lieka.

**Keturios priežastys, dėl kurių žetonas nustoja galioti, o sąsaja to nesužino:**

| Priežastis | Kaip atrodo naudotojui |
|---|---|
| Suėjo `TOKEN_EXPIRE` (72 h) | Po 3 dienų „viskas pakibo" |
| Serveris paleistas be `JWT_SECRET` → naujas atsitiktinis raktas | Po kiekvieno deploy'aus visi atjungiami |
| DB ne ant `/data` Volume → vartotojų lentelė nauja | „Neteisingas slaptažodis" tam, kuris tikrai teisingas |
| El. paštas kita raidžių registro forma | Registracija pavyko, prisijungimas – ne |

---

## 2. Patikros

```bash
cd frontend
grep -rn "ct_token" *.html *.js | wc -l        # kiek vietų skaito žetoną
grep -rn "401" *.html *.js                     # kurie puslapiai jį apdoroja
grep -rn "/auth/me" *.html *.js                # ar sąsaja apskritai tikrina galiojimą
grep -rn "localStorage.setItem" *.html *.js    # kas dar guli saugykloje
```

**Trys klausimai, į kuriuos turi būti atsakyta „taip":**

1. Ar yra **viena** vieta, kuri skaito ir rašo žetoną?
2. Ar puslapis **paleidimo metu** patikrina žetono galiojimą serveryje?
3. Ar **kiekvienas** 401 iš bet kurio puslapio baigiasi ta pačia elgsena: išvalyti → pasakyti „sesija baigėsi" → parodyti prisijungimo langą?

Serverio pusė:

```bash
cd backend
grep -n "TOKEN_EXPIRE\|expiresIn\|JWT_SECRET" auth.js
grep -n "lower(email)\|toLowerCase" auth.js planai.js   # registro normalizavimas
grep -rn "rate\|limit" server.js | grep -i "login\|auth" # bandymų riba
```

Produkcijos pusė (`/admin/atsarga`, nemokama):

- `saugykla.persistentinis` – jei `false`, duomenys dingsta po kiekvieno deploy'aus;
- Railway žurnale `[DB] kelias` ir `[DB] byla egzistavo` – jei `false`, vartotojai ką tik prarasti;
- `[SAUGUMAS] JWT_SECRET nenustatytas` – kiekvienas paleidimas atjungia visus.

---

## 3. Kaip turi veikti · tikslinė sandara

### 3.1 Vienas modulis

`frontend/ct-sesija.js`, prijungiamas **pirmas** visuose puslapiuose (prieš `klaidu-pranesimas.js`), pakeičia visus 23 tiesioginius `localStorage.getItem('ct_token')` kvietimus.

Viešas API:

```js
ctSesija.zetonas()          // eilutė arba null
ctSesija.email()
ctSesija.prisijunges()      // tik vietinis patikrinimas, sinchroninis
ctSesija.patikrinti()       // async: /auth/me, grąžina vartotoją arba null
ctSesija.prisijungti(email, slaptazodis, prisiminti)
ctSesija.atsijungti(priezastis)   // 'pats' | 'baige' | 'neveiklumas'
ctSesija.uzklausa(url, opts)      // fetch + Authorization + 401 apdorojimas
```

**Viena taisyklė:** joks kitas failas nebeliečia `localStorage` žetono raktų.

### 3.2 Paleidimo patikra (išsprendžia „pakibimą")

```
Puslapis kraunasi
  ├─ žetono nėra           → prisijungimo langas
  └─ žetonas yra
       ├─ rodom sąsają „optimistiškai" (kad nemirksėtų)
       └─ fone GET /auth/me
            ├─ 200  → sąsaja patvirtinta, planas ir kreditai atnaujinti
            └─ 401  → išvalyti, „Sesija baigėsi", prisijungimo langas
```

Tai vienintelis pakeitimas, po kurio „rodo prisijungęs, bet neleidžia" tampa neįmanomas: būsena patvirtinama per pirmą sekundę, ne per pirmą nepavykusį veiksmą.

### 3.3 Vienas 401 apdorojimas visiems

`ct-sesija.js` apgaubia `fetch`: kiekvienas 401 iš `/api`, `/auth`, `/admin` →

1. išvalo saugyklą,
2. siunčia `window.dispatchEvent(new CustomEvent('ct:sesija-baige'))`,
3. rodo tą patį pranešimą **visuose** puslapiuose: „Sesija baigėsi – prisijunkite iš naujo."

Šiandien to nėra: `detail.html` ir `compare.html` 401 neapdoroja **nė karto**, `index.html` – tik paieškos sraute, `ataskaitos.html` ir `megstamiausi.html` – savo tekstu. Keturios skirtingos elgsenos tam pačiam įvykiui.

### 3.4 „Prisiminti mane"

Žymimasis langelis prisijungimo lange, numatytai **įjungtas** (šis produktas atidaromas kasdien).

| Pasirinkimas | Kur laikomas žetonas | Kiek galioja | Kada atjungia |
|---|---|---|---|
| Prisiminti | `localStorage` | 30 d. (absoliuti riba) | Suėjus 30 d. arba neveikus 14 d. |
| Neprisiminti | `sessionStorage` | iki skirtuko uždarymo | Uždarius skirtuką arba neveikus 30 min. |

Svarbu: **nežymėtas langelis turi tikrai reikšti „nelikti"** – todėl `sessionStorage`, ne `localStorage` su trumpesniu terminu. Bendrame kompiuteryje tai vienintelis variantas, kuris nemeluoja.

### 3.5 Automatinis atjungimas po X laiko

Du laikmačiai, abu tikrinami serveryje, sąsajoje – tik rodomi:

- **Neveiklumo riba** (`idle`): 30 min. be veiksmo (neprisiminus) / 14 d. (prisiminus). Veiksmu laikomas API kvietimas, ne pelės judesys.
- **Absoliuti riba**: 30 d. nuo prisijungimo, neatnaujinama. Po jos – prisijungimas iš naujo visada.

Likus **2 min.** iki neveiklumo ribos – pranešimas su mygtuku „Likti prisijungus"; paspaudus siunčiama `/auth/atnaujinti`. Be įspėjimo automatinis atjungimas atrodo kaip klaida – ta pati „pakibimo" patirtis, tik su nauja priežastimi.

Atsijungus dėl neveiklumo – pranešimas `Atsijungėme dėl 30 min. neveiklumo`, ne tyla.

### 3.6 Serverio pusė

| Dabar | Turi būti |
|---|---|
| Vienas žetonas, 72 h | **Prieigos** žetonas 30 min. + **atnaujinimo** žetonas |
| `localStorage` | Atnaujinimo žetonas – `httpOnly; Secure; SameSite=Strict` slapuke |
| Nėra atšaukimo | Atnaujinimo žetonai DB lentelėje, su `atsaukta` lauku |
| Be sukimo | Rotacija: kiekvienas atnaujinimas išduoda naują ir panaikina seną |
| Be bandymų ribos | 5 nepavykę bandymai per 15 min. iš IP + paskyros vėlinimas |
| `email` registro jautrus | `email.trim().toLowerCase()` **abiejose** pusėse + `COLLATE NOCASE` |

Atnaujinimo žetonas `httpOnly` slapuke yra vienintelis būdas, kuriuo XSS nepavagia sesijos. Su `SameSite=Strict` CSRF apsauga ateina pati, nes atnaujinimo maršrutas yra vienintelis, kuris slapuku remiasi.

---

## 4. Diegimo eiliškumas

**1 etapas – „pakibimas" (didžiausia nauda, mažiausia rizika).**
`ct-sesija.js` su `/auth/me` paleidimo patikra ir vienu 401 apdorojimu. Backend nekeičiamas. Po šio etapo simptomas dingsta.

**2 etapas – „Prisiminti mane" ir neveiklumo riba.**
`sessionStorage` / `localStorage` pasirinkimas, du laikmačiai, įspėjimas prieš atjungiant. Backend: `TOKEN_EXPIRE` pagal pasirinkimą, `/auth/atnaujinti` maršrutas.

**3 etapas – atnaujinimo žetonas slapuke.**
Lentelė DB, rotacija, atšaukimas, „atsijungti visur". Prie jo einama tik tada, kai 1 ir 2 gyvi produkcijoje.

**Nepriklausomai nuo etapų, tą pačią dieną:** el. pašto normalizavimas ir prisijungimo bandymų riba. Abu maži, abu taiso tikras klaidas.

---

## 5. Priėmimo testai

Kiekvienas – rankomis arba Playwright'u, po kiekvieno etapo:

1. Prisijungti → uždaryti naršyklę → atidaryti. **Prisiminus** – prisijungęs; **neprisiminus** – prisijungimo langas.
2. Prisijungti → `localStorage` žetoną pakeisti į šiukšles → perkrauti. Turi parodyti „Sesija baigėsi" per **< 2 s**, ne tuščią puslapį.
3. Tas pats `detail.html`, `compare.html`, `ataskaitos.html`, `megstamiausi.html`, `admin.html` – **elgsena ta pati visuose**.
4. Palikti atvirą 31 min. (neprisiminus) → įspėjimas 29-tą min., atjungimas 30-tą, aiškus pranešimas.
5. Paspausti „Likti prisijungus" → laikmatis pradedamas iš naujo, veiksmas nepertrauktas.
6. Registracija `Lukas@x.lt` → prisijungimas `lukas@x.lt`. Turi pavykti.
7. 6 neteisingi slaptažodžiai iš eilės → 6-tas grąžina 429, ne 401.
8. Du skirtukai: atsijungus viename, antras per 5 s parodo prisijungimo langą (`storage` įvykis – jau prijungtas `index.html`, reikia visuose).
9. Privatus langas / išjungta saugykla → puslapis veikia, rodo prisijungimo langą, nemeta klaidos konsolėje.
10. Deploy metu: perkrovus serverį su tuo pačiu `JWT_SECRET` – niekas neatjungiamas.

---

## 6. Saugyklos inventorius

Kiekvienas `localStorage` raktas turi turėti eilutę šioje lentelėje. Rakto be eilutės būti negali.

| Raktas | Kas | Riba | Valomas atsijungiant |
|---|---|---|---|
| `ct_token` | JWT | – | **taip** |
| `ct_email` | rodymui antraštėje | – | **taip** |
| `ct_compare_list` | palyginimo sąrašas | ? | ? |
| `ct_compare_pending_list` | tarpinė palyginimo būsena | ? | ? |
| `ct_compare_result` | palyginimo rezultatas | ? | ? |
| `ct_detail` | perduodama kortelė į `detail.html` | ? | ? |
| `ct_last_results` | paskutiniai paieškos rezultatai | ? | ? |
| `carTriageFavorites` | mėgstamiausi (senas vardas) | ? | ? |
| `carTriageAnalysisCache` | analizių podėlis | ? | **taip** |
| `carTriageSearchHistory` | paieškų istorija | ? | ? |

**Trys radiniai, matomi jau iš lentelės:** vardų sistemos dvi (`ct_*` ir `carTriage*`); atsijungiant valomi tik du raktai – kito žmogaus rezultatai, mėgstamiausi ir analizės lieka tame pačiame kompiuteryje; ribų nenustatyta nė vienam – `ct_last_results` auga tiek, kiek grąžino paieška, ir `QuotaExceededError` sulaužo ne tą vietą, kurioje buvo įrašyta.
