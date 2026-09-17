# CarTriige – taisyklės Claude

## Versijavimas (privaloma po KIEKVIENO atnaujinimo)

1. `frontend/versijos.js` – į `CT_VERSIJOS` sąrašo **viršų** pridėti naują įrašą:
   `{ versija: 'X.Y.Z', data: 'YYYY-MM-DD' (šios dienos), pavadinimas: '…', pakeitimai: ['…', '…'] }`.
   - `Y` keliamas už naują funkciją, `Z` – už pataisymus.
   - Pakeitimai rašomi vartotojo kalba (ką jis pamatys), ne techniniais terminais.
2. Versijos numeris antraštėje (`#app-version`) ir langas „Versijų istorija“ generuojami automatiškai iš šio sąrašo – daugiau niekur versijos rankiniu būdu nekeisti.
3. Commit žinutėje paminėti versiją, pvz. `v1.18.0: …`.

## Saugumas

- `ANTHROPIC_API_KEY`, `SCRAPER_API_KEY`, `JWT_SECRET`, `ADMIN_EMAILS`, `INVITE_CODES` – tik Railway Variables, **niekada į kodą ar GitHub**.
- `backend/.env` – niekada į GitHub.
- `git push origin main` vykdo **tik Lukas** PowerShell'e; Claude niekada nepushina.
- Windows PowerShell: `&&` neveikia – git komandos rašomos atskiromis eilutėmis.

## Darbo eiga

- Prieš rašant į įrenginį – Playwright regresija (web 1400 px ir tel 390 px), 0 JS klaidų.
- Į įrenginį rašoma per naują `/mnt/user-data/outputs/vN/` kelią, po įrašymo tikrinamas md5.
- `git status` tik su `--no-optional-locks` (kitaip lieka `.git/index.lock`).
- Serveryje niekada nekviesti mokamų maršrutų (analyze, vin, seller, compare) testavimui – tik GET.

## Struktūra

- `backend/server.js` – Express API, scraping, AI; `planai.js` – planai/kreditai; `vartotojo-duomenys.js` – mėgstamiausi/ataskaitos; `auth.js` – JWT; `cache.js` – podėlis.
- `frontend/index.html` – pagrindinis (monolitas); `detail.html`, `compare.html`, `megstamiausi.html`, `ataskaitos.html`; bendri `ct-bendras.css/js`, `versijos.js` (versijų istorija), `megstami-meniu.js` (širdutė antraštėje su mėgstamiausių sąrašu).
