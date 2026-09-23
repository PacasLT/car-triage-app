/* ── ct-sesija.js ─────────────────────────────────────────────────────────
   VIENINTELIS žetono ir sesijos šaltinis. Įdedamas PIRMAS, prieš visus kitus
   skriptus, visuose šešiuose puslapiuose.

   Kodėl atsirado (docs/revizija-2026-09-20.md A-1…A-3, A-7):

   A-1  `/auth/me` sąsajoje nebuvo kviečiamas NĖ KARTO. „Prisijungęs" reiškė
        tik tai, kad `localStorage` yra raktas. Žetonas galioja 72 h; jam
        pasibaigus avataras toliau rodo prisijungusį, o kiekviena užklausa
        grįžta 401. Naudotojui tai atrodo kaip „pakibo".
   A-2  401 buvo apdorojamas keturiais skirtingais būdais, o `detail.html` ir
        `compare.html` — niekaip: puslapis likdavo tuščias su besisukančiu
        ratuku.
   A-3  Žetoną skaitė 23 vietos dešimtyje failų.
   A-7  Atsijungiant buvo valomi tik `ct_token` ir `ct_email`. Rezultatai,
        analizių podėlis ir paieškų istorija likdavo — kitas žmogus tame
        pačiame kompiuteryje matydavo svetimus duomenis.

   PATIKSLINIMAS revizijai: ji rašė, kad `auth_frontend.js` prideda
   `Authorization` tik `/api`, `/analyze`, `/scrape`. Tai netiesa ir blogiau:
   `API_BASE` yra tuščia eilutė, tad `url.startsWith(API_BASE)` visada
   `true` — antraštė kabinta prie KIEKVIENO fetch'o su tekstiniu adresu,
   įskaitant svetimus. Šiandien svetimų kvietimų nėra, tad žala tik galima,
   bet čia tai uždaroma: antraštė dedama tik savo kilmei.
   ──────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  if (window.ctSesija) return;          // įdėtas du kartus — antras nieko nedaro

  var ZETONAS = 'ct_token';
  var PASTAS = 'ct_email';

  /* Valomi atsijungiant ir pasibaigus sesijai (A-7). Sąrašas rašomas ranka:
     `localStorage.clear()` nuvalytų ir tai, kas ne mūsų. */
  var VALOMI = [
    'ct_token', 'ct_email', 'ct_detail', 'ct_last_results',
    'ct_compare_list', 'ct_compare_pending_list', 'ct_compare_result',
    'carTriageFavorites', 'carTriageAnalysisCache', 'carTriageSearchHistory'
  ];

  function imti(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function deti(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function trinti(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ── Ar adresas mūsų? ──────────────────────────────────────────────────
     Santykinis („/api/…", "detail.html") – visada mūsų. Absoliutus – tik jei
     ta pati kilmė. Tai ir yra vieta, kurioje anksčiau žetonas keliaudavo bet
     kur. */
  function savas(url) {
    if (typeof url !== 'string') return false;
    if (url.charAt(0) === '/' || !/^[a-z][a-z0-9+.-]*:/i.test(url)) return true;
    try { return new URL(url, location.href).origin === location.origin; }
    catch (e) { return false; }
  }

  /* `/auth/login` ir `/auth/register` grąžina 401 esant neteisingam
     slaptažodžiui. Tai NE pasibaigusi sesija, ir jų negalima gaudyti. */
  function autentifikacijosKelias(url) {
    try { return new URL(url, location.href).pathname.indexOf('/auth/') === 0; }
    catch (e) { return false; }
  }

  var vykstaBaigimas = false;

  var S = {
    vartotojas: null,          // /auth/me atsakymas, kai patikra praėjo

    zetonas: function () { return imti(ZETONAS); },
    elPastas: function () { return imti(PASTAS); },
    prisijunges: function () { return !!imti(ZETONAS); },

    nustatyti: function (t, pastas) {
      deti(ZETONAS, t);
      if (pastas) deti(PASTAS, pastas);
    },

    isvalyti: function () { VALOMI.forEach(trinti); S.vartotojas = null; },

    /* Antraštės API kvietimui. Puslapiai, kurie jas susirinkdavo patys. */
    antraste: function (papildomos) {
      var h = papildomos ? Object.assign({}, papildomos) : {};
      var t = imti(ZETONAS);
      if (t) h.Authorization = 'Bearer ' + t;
      return h;
    },

    /* ── Vienas 401 kelias visiems šešiems puslapiams (A-2) ─────────────
       Anksčiau: index – modalas, ataskaitos/mėgstamiausi – savas tekstas,
       admin – melagingas „Reikia administratoriaus teisių", detail ir
       compare – nieko. */
    baigesi: function (priezastis) {
      if (vykstaBaigimas) return;
      vykstaBaigimas = true;
      S.isvalyti();
      try { window.dispatchEvent(new CustomEvent('ct-sesija-baigesi', { detail: { priezastis: priezastis || 'nezinoma' } })); } catch (e) {}

      /* index.html turi savo prisijungimo modalą — jis geresnis už mūsų
         pranešimą, nes leidžia prisijungti nepaliekant puslapio. */
      if (typeof window.showAuthModal === 'function') {
        try { window.showAuthModal(); vykstaBaigimas = false; return; } catch (e) {}
      }
      S.pranesimas();
    },

    /* Pranešimas puslapiams, kurie modalo neturi. Piešiamas paties modulio,
       kad `detail.html` ir `compare.html` nebeliktų tušti. */
    pranesimas: function () {
      if (document.getElementById('ct-sesija-uzdanga')) return;
      var d = document.createElement('div');
      d.id = 'ct-sesija-uzdanga';
      d.setAttribute('role', 'alertdialog');
      d.setAttribute('aria-label', 'Sesija baigėsi');
      d.innerHTML =
        '<div class="ct-sesija-kort">' +
        '<b>Sesija baigėsi</b>' +
        '<p>Saugumo sumetimais prisijungimas galioja ribotą laiką. Prisijunkite iš naujo — atidaryti puslapiai neprarandami.</p>' +
        '<a class="ct-btn ct-btn-primary" href="index.html">Prisijungti iš naujo</a>' +
        '</div>';
      var st = document.createElement('style');
      st.textContent =
        '#ct-sesija-uzdanga{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;' +
        'background:rgba(7, 11, 22,.72);backdrop-filter:blur(2px);padding:16px}' +
        '#ct-sesija-uzdanga .ct-sesija-kort{max-width:380px;width:100%;box-sizing:border-box;' +
        'background:var(--bg-surface,#12151F);border:1px solid var(--border,#252A38);' +
        'border-radius:var(--radius-lg,14px);padding:20px;text-align:center;' +
        'font-family:var(--font,system-ui,sans-serif);color:var(--text-primary,#E8EAF0)}' +
        '#ct-sesija-uzdanga b{display:block;font-size:17px;margin-bottom:8px}' +
        '#ct-sesija-uzdanga p{margin:0 0 16px;font-size:13.5px;line-height:1.5;' +
        'color:var(--text-secondary,#A8AFC0)}' +
        '#ct-sesija-uzdanga a{display:inline-block;text-decoration:none}';
      (document.body || document.documentElement).appendChild(st);
      (document.body || document.documentElement).appendChild(d);
    },

    /* ── Paleidimo patikra (A-1) ───────────────────────────────────────
       Vienintelis dalykas, kuris atsako į klausimą „ar žetonas dar gyvas".
       Tinklo klaida NĖRA pasibaigusi sesija: be interneto neatjungiam. */
    patikra: function () {
      var t = imti(ZETONAS);
      if (!t) return Promise.resolve(null);
      return fetch('/auth/me', { headers: { Authorization: 'Bearer ' + t } })
        .then(function (r) {
          if (r.status === 401 || r.status === 403) { S.baigesi('pasibaige'); return null; }
          if (!r.ok) return null;
          return r.json();
        })
        .then(function (v) {
          if (v) { S.vartotojas = v; if (v.email) deti(PASTAS, v.email); }
          return v;
        })
        .catch(function () { return null; });   // tinklas – ne sesija
    },

    atsijungti: function () { S.isvalyti(); location.reload(); }
  };

  window.ctSesija = S;

  /* ── fetch apvalkalas ─────────────────────────────────────────────────
     Dvi pareigos: pridėti antraštę TIK savo kilmei ir pagauti 401 vienoje
     vietoje. Apvyniojama vieną kartą — `auth_frontend.js` savo apvalkalą
     atidavė čia. */
  var pirminis = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    opts = opts || {};
    var t = imti(ZETONAS);
    var mūsų = savas(url);
    if (t && mūsų && !autentifikacijosKelias(url)) {
      var h = opts.headers || {};
      var turi = (typeof Headers !== 'undefined' && h instanceof Headers) ? h.has('Authorization') : !!(h.Authorization || h.authorization);
      if (!turi) {
        opts = Object.assign({}, opts);
        opts.headers = (typeof Headers !== 'undefined' && h instanceof Headers)
          ? (h.append('Authorization', 'Bearer ' + t), h)
          : Object.assign({}, h, { Authorization: 'Bearer ' + t });
      }
    }
    return pirminis(url, opts).then(function (r) {
      if (r.status === 401 && t && mūsų && !autentifikacijosKelias(url)) S.baigesi('401');
      return r;
    });
  };

  /* Patikra paleidžiama pati. Fone – puslapis nelaukia jos. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { S.patikra(); });
  } else {
    S.patikra();
  }
})();
