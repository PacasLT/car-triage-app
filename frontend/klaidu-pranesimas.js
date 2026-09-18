// klaidu-pranesimas.js — pranešimas apie klaidą iš bet kurio puslapio.
//
// KODĖL TAIP: ekrano nuotrauka parodo, KAIP atrodo, bet nepasako, KODĖL.
// Taisant vertingiausia tai, ko akis nemato — JS klaidos, įvykusios prieš tai,
// paskutiniai paspaudimai, versija, ekrano plotis. Todėl diagnostika renkama
// automatiškai, o žmogui lieka vienas sakinys „ką bandžiau padaryti".
//
// SVARBU: šis failas prijungiamas ANKSTI (<body> pradžioje), kad spėtų pagauti
// klaidas, įvykusias kraunantis puslapiui. Sąsaja piešiama po DOMContentLoaded.
//
// PRIVATUMAS: į žurnalą rašom localStorage RAKTŲ VARDUS, ne reikšmes.
// Žetonas, slaptažodis ir el. paštas ten nepatenka.
//
// DIZAINAS: v1.52.0 visa sąsaja perdaryta į dizaino sistemą — `.ct-modal*`
// (20 sk.), `.ct-flag[role=radio]` (21 sk.), `.ct-check`, `.ct-field-err`,
// `.ct-report-fab` (20b sk.). Savo CSS čia nebeliko nė vienos eilutės.

(function () {
  'use strict';
  if (window.__ctKlaidos) return;

  var RIBA = 20;
  var VEIKSMU_RIBA = 12;
  var _klaidos = [];
  var _uzklausos = [];
  var _veiksmai = [];
  var MAX_FOTO = 1.5 * 1024 * 1024;

  function ideti(sarasas, irasas, riba) {
    sarasas.push(irasas);
    var r = riba || RIBA;
    if (sarasas.length > r) sarasas.splice(0, sarasas.length - r);
  }

  // ── Kelias iki elemento ──────────────────────────────────────────────────
  // Vertingiausias vienas dalykas visame pranešime: KURIS mygtukas. Puslapyje
  // jų 63 — be šito klausimas „paspaudžiau ir nieko" yra neatsakomas.
  function kelias(el) {
    if (!el || !el.tagName) return null;
    var d = [];
    for (var e = el; e && e.tagName && d.length < 4; e = e.parentElement) {
      var v = e.tagName.toLowerCase();
      if (e.id) { d.unshift(v + '#' + e.id); break; }
      var kl = (e.className && e.className.toString ? e.className.toString() : '').trim().split(/\s+/)
        .filter(function (c) { return c && !/^(is-|ct-btn$)/.test(c); }).slice(0, 2).join('.');
      d.unshift(kl ? v + '.' + kl : v);
    }
    return d.join(' > ').slice(0, 140);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.ct-modal')) return;          // paties lango paspaudimai nedomina
    var v = t.closest('button, a, [onclick], input, select, .dp-tab, .ct-tab, .dp-thumb, .chip');
    if (!v) return;
    ideti(_veiksmai, {
      t: Date.now(),
      elementas: kelias(v),
      tekstas: (v.textContent || v.value || v.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      puslapis: location.pathname.split('/').pop(),
    }, VEIKSMU_RIBA);
  }, true);

  // ── Gaudyklės ─────────────────────────────────────────────────────────────
  window.addEventListener('error', function (e) {
    if (e && e.target && e.target !== window && e.target.tagName) {
      ideti(_uzklausos, { t: Date.now(), tipas: 'resursas',
        adresas: String(e.target.src || e.target.href || '').slice(0, 200) });
      return;
    }
    ideti(_klaidos, {
      t: Date.now(),
      zinute: String((e && e.message) || 'nežinoma klaida').slice(0, 300),
      failas: String((e && e.filename) || '').split('/').pop().slice(0, 80),
      eilute: (e && e.lineno) || null,
      stekas: String(((e && e.error && e.error.stack) || '')).split('\n').slice(0, 4).join(' | ').slice(0, 400),
    });
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    var p = e && e.reason;
    ideti(_klaidos, {
      t: Date.now(), tipas: 'promise',
      zinute: String((p && p.message) || p || 'neapdorotas atmetimas').slice(0, 300),
      stekas: String((p && p.stack) || '').split('\n').slice(0, 4).join(' | ').slice(0, 400),
    });
  });

  if (window.fetch) {
    var _fetch = window.fetch;
    window.fetch = function (input) {
      var adresas = typeof input === 'string' ? input : (input && input.url) || '';
      var pradzia = Date.now();
      return _fetch.apply(this, arguments).then(function (r) {
        if (!r.ok && /^\/(api|auth|admin)\//.test(adresas)) {
          ideti(_uzklausos, { t: pradzia, tipas: 'http', adresas: adresas.slice(0, 200),
            kodas: r.status, trukmeMs: Date.now() - pradzia });
        }
        return r;
      }).catch(function (err) {
        if (/^\/(api|auth|admin)\//.test(adresas)) {
          ideti(_uzklausos, { t: pradzia, tipas: 'tinklas', adresas: adresas.slice(0, 200),
            klaida: String(err && err.message).slice(0, 160), trukmeMs: Date.now() - pradzia });
        }
        throw err;
      });
    };
  }

  // ── Diagnostika ───────────────────────────────────────────────────────────
  function surinkti() {
    var v = null;
    try { v = (window.CT_VERSIJOS && window.CT_VERSIJOS[0] && window.CT_VERSIJOS[0].versija) || null; } catch (e) {}
    var planas = null;
    try {
      var p = window.__ctPlanas;
      if (p) planas = { planas: p.planas || null, kreditai: (p.kreditai && p.kreditai.viso) != null ? p.kreditai.viso : null };
    } catch (e) {}
    var raktai = [];
    try { for (var i = 0; i < localStorage.length; i++) raktai.push(localStorage.key(i)); } catch (e) {}
    return {
      puslapis: location.pathname.split('/').pop() || 'index.html',
      adresas: (location.pathname + location.search).slice(0, 400),
      versija: v,
      laikas: new Date().toISOString(),
      ekranas: { plotis: window.innerWidth, aukstis: window.innerHeight,
                 tankis: window.devicePixelRatio || 1, ekranoPlotis: (screen && screen.width) || null },
      narsykle: String(navigator.userAgent || '').slice(0, 220),
      kalba: navigator.language || null,
      planas: planas,
      saugyklosRaktai: raktai.slice(0, 30),   // VARDAI, ne reiksmes
      klaidos: _klaidos.slice(-10),
      uzklausos: _uzklausos.slice(-10),
      veiksmai: _veiksmai.slice(-12),
    };
  }
  window.__ctKlaidos = { surinkti: surinkti, sarasas: function () { return _klaidos.slice(); } };

  // ── Sąsaja ────────────────────────────────────────────────────────────────
  function ikona(v) { return '<i><svg class="ct-i"><use href="#' + v + '"></use></svg></i>'; }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var _foto = null, _kat = null, _svarba = 'trukdo';

  // Kategorijos sudėtos ne iš teorijos, o iš to, kas šioje sistemoje realiai lūžta.
  // Kiekviena nurodo, KURIAME sluoksnyje ieškoti — tai vienintelė jų prasmė.
  var KATEGORIJOS = [
    { k: 'dizainas',      t: 'Atrodo ne taip' },
    { k: 'negyvas',       t: 'Paspaudžiau — nieko neįvyko' },
    { k: 'duomenys',      t: 'Rodo neteisingą skaičių ar tekstą' },
    { k: 'kreditai',      t: 'Nusirašė kreditas, o rezultato nėra' },
    { k: 'greitis',       t: 'Ilgai užtrunka arba užstringa' },
    { k: 'prisijungimas', t: 'Neleidžia prisijungti' },
  ];
  var SVARBOS = [
    { k: 'blokuoja', t: 'Negaliu tęsti' },
    { k: 'trukdo',   t: 'Trukdo' },
    { k: 'smulkme',  t: 'Smulkmena' },
  ];

  function zenkliukai(id, sarasas, pasirinktas) {
    return '<div class="ct-flags" id="' + id + '" role="radiogroup">'
      + sarasas.map(function (x) {
          var on = x.k === pasirinktas;
          return '<button type="button" class="ct-flag" role="radio" data-k="' + x.k + '"'
            + ' aria-checked="' + (on ? 'true' : 'false') + '">' + esc(x.t) + '</button>';
        }).join('')
      + '</div>';
  }

  function atidaryti() {
    var d = surinkti();
    var scrim = document.createElement('div');
    scrim.className = 'ct-modal-scrim';
    scrim.innerHTML = ''
      + '<div class="ct-modal" role="dialog" aria-modal="true" aria-labelledby="kp-h">'
      + '<div class="ct-modal-h">'
      +   '<span class="ct-modal-t" id="kp-h">Pranešti apie klaidą</span>'
      +   '<span class="ct-modal-d">Parašykite, ką bandėte padaryti ir kas nutiko. Techninius duomenis pridėsime patys.</span>'
      + '</div>'
      + '<div class="ct-modal-b">'
      +   '<div class="ct-flag-group" id="kp-kat-g">'
      +     '<span class="ct-field-k">KOKIA TAI KLAIDA</span>'
      +     zenkliukai('kp-kat', KATEGORIJOS, null)
      +     '<span class="ct-field-err" id="kp-kat-err" hidden>Pasirinkite, kokia tai klaida.</span>'
      +   '</div>'
      +   '<div class="ct-flag-group">'
      +     '<span class="ct-field-k">KIEK TRUKDO</span>'
      +     zenkliukai('kp-svarba', SVARBOS, 'trukdo')
      +   '</div>'
      +   '<div class="ct-flag-group">'
      +     '<label class="ct-field-k" for="kp-tekstas">KAS NUTIKO</label>'
      +     '<textarea id="kp-tekstas" rows="3" placeholder="Pvz.: paspaudžiau „Pilna apžvalga“, langas liko tuščias ir kreditas nusirašė."></textarea>'
      +     '<span class="ct-field-err" id="kp-tekstas-err" hidden>Parašykite bent sakinį.</span>'
      +   '</div>'
      +   '<div id="kp-papildomas"></div>'
      +   '<label class="ct-check"><input type="checkbox" id="kp-kartojasi"><i></i><span>Taip jau buvo anksčiau</span></label>'
      +   '<div class="ct-flag-group">'
      +     '<span class="ct-field-k">EKRANO NUOTRAUKA (NEBŪTINA)</span>'
      +     '<div class="ct-flags">'
      +       '<button type="button" class="ct-btn ct-btn-sm" id="kp-prideti">' + ikona('i-nuotraukos') + '<span>Pridėti nuotrauką</span></button>'
      +       '<span id="kp-failo-vardas" class="ct-modal-d"></span>'
      +     '</div>'
      +     '<input type="file" id="kp-failas" accept="image/*" hidden>'
      +     '<div id="kp-perziura"></div>'
      +   '</div>'
      +   '<details><summary>Ką siųsime kartu (' + d.klaidos.length + ' klaidos, '
      +     d.uzklausos.length + ' nepavykusios užklausos, ' + d.veiksmai.length + ' paskutiniai veiksmai)</summary>'
      +     '<pre id="kp-diag-pre"></pre></details>'
      +   '<div class="ct-field-err" id="kp-zinia" hidden></div>'
      + '</div>'
      + '<div class="ct-modal-f">'
      +   '<button type="button" class="ct-btn ct-btn-primary" id="kp-siusti">' + ikona('i-siusti') + '<span>Siųsti</span></button>'
      +   '<button type="button" class="ct-modal-cancel" id="kp-atsaukti">Atšaukti</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(scrim);
    document.getElementById('kp-diag-pre').textContent = JSON.stringify(d, null, 1);

    var uzdaryti = function () {
      _foto = null; _kat = null; _svarba = 'trukdo';
      scrim.remove(); document.removeEventListener('keydown', esc2);
    };
    var esc2 = function (e) { if (e.key === 'Escape') uzdaryti(); };
    document.addEventListener('keydown', esc2);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) uzdaryti(); });
    document.getElementById('kp-atsaukti').onclick = uzdaryti;

    function rinktis(grupe, cb) {
      grupe.addEventListener('click', function (e) {
        var b = e.target.closest('.ct-flag'); if (!b) return;
        [].forEach.call(this.children, function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        cb(b.dataset.k);
      });
    }

    var papildomas = document.getElementById('kp-papildomas');
    rinktis(document.getElementById('kp-kat'), function (k) {
      _kat = k;
      document.getElementById('kp-kat-g').classList.remove('has-error');
      document.getElementById('kp-kat-err').hidden = true;
      // Klaidingo skaičiaus atveju lemiamas klausimas yra „o kiek turėjo būti".
      // Būtent taip radom, kad kortelė rodo 7.8, o skelbimo puslapis 5.8.
      papildomas.innerHTML = (k === 'duomenys')
        ? '<div class="ct-flag-group"><label class="ct-field-k" for="kp-turejo">O KĄ TURĖJO RODYTI?</label>'
          + '<textarea id="kp-turejo" rows="2" placeholder="Pvz.: kortelėje buvo 7.8, o čia rodo 5.8."></textarea></div>'
        : '';
    });
    rinktis(document.getElementById('kp-svarba'), function (k) { _svarba = k; });

    var inp = document.getElementById('kp-failas');
    document.getElementById('kp-prideti').onclick = function () { inp.click(); };
    function priimtiFaila(f, vardas) {
      if (!f) return;
      if (f.size > MAX_FOTO) {
        document.getElementById('kp-failo-vardas').textContent =
          'Per didelė (' + Math.round(f.size / 1048576 * 10) / 10 + ' MB). Riba 1,5 MB.';
        return;
      }
      var fr = new FileReader();
      fr.onload = function () {
        _foto = fr.result;
        document.getElementById('kp-failo-vardas').textContent = vardas;
        document.getElementById('kp-perziura').innerHTML =
          '<img src="' + _foto + '" alt="" style="max-width:100%;max-height:150px;border-radius:8px;border:1px solid var(--border);display:block;margin-top:8px">';
      };
      fr.readAsDataURL(f);
    }
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (f) priimtiFaila(f, f.name.slice(0, 40));
    };
    scrim.addEventListener('paste', function (e) {
      var it = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < it.length; i++) {
        if (it[i].type && it[i].type.indexOf('image') === 0) priimtiFaila(it[i].getAsFile(), 'įklijuota');
      }
    });

    document.getElementById('kp-siusti').onclick = function () {
      var btn = this;
      var tekstas = (document.getElementById('kp-tekstas').value || '').trim();
      var zin = document.getElementById('kp-zinia');
      zin.hidden = true;

      // Klaida rodoma PRIE grupės, kurios neatsakė, ne modalo apačioje.
      // Telefone tarp klausimo ir apačios yra ~1200 px — raudonas tekstas ten
      // nepasako, apie ką jis.
      if (!_kat) {
        var g = document.getElementById('kp-kat-g');
        g.classList.add('has-error');
        document.getElementById('kp-kat-err').hidden = false;
        g.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      var te = document.getElementById('kp-tekstas-err');
      if (tekstas.length < 5) {
        te.hidden = false;
        document.getElementById('kp-tekstas').focus();
        return;
      }
      te.hidden = true;

      btn.disabled = true;
      btn.querySelector('span').textContent = 'Siunčiame…';
      var antrastes = { 'Content-Type': 'application/json' };
      try { var z = localStorage.getItem('ct_token'); if (z) antrastes.Authorization = 'Bearer ' + z; } catch (e) {}
      fetch('/api/klaida', {
        method: 'POST', headers: antrastes,
        body: JSON.stringify({
          tekstas: tekstas.slice(0, 2000),
          kategorija: _kat,
          svarba: _svarba,
          kartojasi: !!document.getElementById('kp-kartojasi').checked,
          turejoRodyti: ((document.getElementById('kp-turejo') || {}).value || '').trim().slice(0, 500) || null,
          diagnostika: surinkti(),
          foto: _foto || null,
        }),
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) throw new Error((x.j && x.j.error) || 'nepavyko');
          zin.hidden = false;
          zin.style.color = 'var(--success)';
          zin.textContent = 'Ačiū. Pranešimas išsiųstas' + (x.j && x.j.nr ? ' (Nr. ' + x.j.nr + ')' : '') + '.';
          btn.querySelector('span').textContent = 'Išsiųsta';
          setTimeout(uzdaryti, 1600);
        })
        .catch(function (err) {
          zin.hidden = false;
          zin.style.color = '';
          zin.textContent = 'Nepavyko išsiųsti: ' + (err && err.message) + '. Pabandykite dar kartą.';
          btn.disabled = false;
          btn.querySelector('span').textContent = 'Siųsti';
        });
    };

    setTimeout(function () { var t = document.getElementById('kp-tekstas'); if (t) t.focus(); }, 30);
  }
  window.ctPranestiKlaida = atidaryti;

  function mygtukas() {
    if (document.getElementById('kp-mygtukas')) return;
    var b = document.createElement('button');
    b.id = 'kp-mygtukas';
    b.type = 'button';
    // NE ct-btn-quiet: plaukiojantis elementas negali būti be paviršiaus —
    // po juo slenka nežinomas turinys, ir ant nuotraukos jis išnyktų.
    b.className = 'ct-btn ct-btn-sm ct-report-fab';
    b.title = 'Pranešti apie klaidą';
    b.setAttribute('aria-label', 'Pranešti apie klaidą');
    b.innerHTML = ikona('i-pranesti') + '<span>Klaida</span>';
    b.onclick = atidaryti;
    document.body.appendChild(b);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mygtukas);
  else mygtukas();
})();
