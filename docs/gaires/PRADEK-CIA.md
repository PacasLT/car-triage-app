# Gairės · pradėk čia

Šis aplankas yra **auditų vadovas**, ne dar viena taisyklių kopija.
Produkto taisyklės gyvena `CLAUDE.md` – čia parašyta, **kaip jas patikrinti**.

## Keturi playbook'ai

| Failas | Į ką atsako | Kada paleidžiamas |
|---|---|---|
| `KODAVIMAS.md` | Kaip rašomas naujas kodas (back + front) | Prieš kiekvieną pakeitimą |
| `AUDITAS-DIZAINAS.md` | Ar visuose puslapiuose tie patys tokenai, šriftai, mygtukai | Po kiekvieno dizainerio paketo; kas 5 versijas |
| `AUDITAS-SESIJOS.md` | Prisijungimas, žetonai, „Prisiminti mane", automatinis atjungimas | Po bet kokio `auth.js` / `auth_frontend.js` pakeitimo; kas 10 versijų |
| `AUDITAS-SAUGUMAS.md` | OWASP patikros: paslaptys, ribos, antraštės, XSS, saugykla | Prieš kiekvieną viešą paleidimą; kas mėnesį |

## Kaip paleisti pilną auditą

Nukopijuok Claude Code sesijoje:

```
Atlik pilną CarTriige auditą pagal docs/gaires/.
Eiliškumas: AUDITAS-DIZAINAS.md → AUDITAS-SESIJOS.md → AUDITAS-SAUGUMAS.md.
Kiekvienam radiniui: failas, eilutė, MATAVIMAS (ne nuomonė), poveikis naudotojui, krūva (mano / dizainerio / Luko).
Rezultatą surašyk į docs/revizija-YYYY-MM-DD.md ir naujus radinius – į klaidų sąrašą per /admin.html.
Nieko netaisyk, kol nesuderinom prioritetų.
```

Vieno srities auditui – ta pati eilutė su vienu failu.

## Trys taisyklės, galiojančios visiems auditams

1. **Matavimas, ne nuomonė.** „Mygtukas atrodo mažas" nėra radinys. „34 px prieš sistemos 38 px, `ct-priedai.css` 12 eil." – radinys. Jei matavimo nėra, taip ir parašoma: „nepamatuota, galiu pamatuoti".
2. **„Kur dar yra tas pats?"** Radus klaidą, iškart ieškoma to paties rašinio visame kode. `CLAUDE.md` lentelė rodo: sinchroninis įrašymas cikle buvo 2 vietose, rožinė spalva – 22, du skirtingi įverčiai – 2. Vienos vietos taisymas yra pusė darbo.
3. **Radinys → užduotis.** Kiekvienas radinys gauna krūvą (**mano** / **dizainerio** / **Luko**) ir keliauja į klaidų sąrašą arba `pasikeitimai/UZDUOTYS-DIZAINERIUI.md`. Sąrašas be adresato yra sąrašas, ne darbas.

## Ko auditas NEDARO

- Netaiso be sutarimo. Radinių sąrašas pateikiamas pirma, taisoma po prioritetų.
- Neredaguoja `ct-dizainas.css` ir `ct-mygtukai.css` – tai dizainerio failai.
- Nekviečia mokamų maršrutų (`analyze`, `vin`, `seller`, `compare`) testavimui.
- Nevykdo `git` komandų – nei iš `device_bash`, nei kitaip.
