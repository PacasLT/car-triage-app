// paskyra-meniu.js — vartotojo meniu po profilio mygtuku (visuose puslapiuose).
// Rodo: el. paštą, planą ir kreditus, mėgstamiausius, ataskaitas, palyginimus,
// paieškų istoriją, planų langą, versiją ir atsijungimą.
(function () {
  var _atidaryta = false;
  function token() { try { return localStorage.getItem('ct_token'); } catch (e) { return null; } }
  function email() { try { return localStorage.getItem('ct_email') || ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function arIndex() { return /(^|\/)(index\.html)?$/.test(location.pathname); }
  function kelias(p) { return arIndex() ? p.replace(/^index\.html/, location.pathname.split('/').pop() || 'index.html') : p; }

  var CSS = ''
    + '#ct-pask{position:fixed;z-index:1700;top:64px;right:16px;width:300px;max-width:calc(100vw - 24px);background:var(--bg-surface,#12151e);border:1px solid var(--border-light,rgba(255,255,255,.12));border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);overflow:hidden;display:none}'
    + '#ct-pask.open{display:block}'
    + '.ct-pask-head{display:flex;align-items:center;gap:11px;padding:14px 14px 12px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}'
    + '.ct-pask-av{width:38px;height:38px;border-radius:50%;background:var(--accent,#7c5cff);color:#fff;display:grid;place-items:center;font:700 15px var(--font,sans-serif);flex:none}'
    + '.ct-pask-el{min-width:0;flex:1}'
    + '.ct-pask-el b{display:block;font:600 13px/1.3 var(--font,sans-serif);color:var(--text-primary,#fff);word-break:break-all}'
    + '.ct-pask-el small{display:flex;align-items:center;gap:6px;margin-top:3px;font:500 11px var(--font,sans-serif);color:var(--text-muted,#aaa)}'
    + '.ct-pask-pl{font:700 10px/1 var(--font-mono,monospace);color:var(--accent-light,#a99cff);background:var(--accent-dim,rgba(124,92,255,.12));border:1px solid var(--accent-border,rgba(124,92,255,.35));padding:3px 6px;border-radius:5px}'
    + '.ct-pask-pl.kr{color:var(--success,#3ddc97);background:var(--success-dim,rgba(61,220,151,.12));border-color:var(--success-border,rgba(61,220,151,.3))}'
    + '.ct-pask-pl.kr.nulis{color:var(--danger,#ff6b6b);background:var(--danger-dim,rgba(255,107,107,.12));border-color:var(--danger-border,rgba(255,107,107,.3))}'
    + '.ct-pask-list{padding:6px}'
    + '.ct-pask-it{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:9px;border:none;background:transparent;color:var(--text-secondary,#c9cbd3);font:500 13px var(--font,sans-serif);cursor:pointer;text-decoration:none;text-align:left}'
    + '.ct-pask-it:hover{background:var(--bg-elevated,#1a1e2a);color:var(--text-primary,#fff)}'
    + '.ct-pask-it .ic{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:var(--bg-elevated,#1a1e2a);border:1px solid var(--border,rgba(255,255,255,.08));flex:none;font-size:13px}'
    + '.ct-pask-it .ic svg{width:14px;height:14px}'
    + '.ct-pask-it .t{flex:1;min-width:0}'
    + '.ct-pask-it .t small{display:block;font:400 10.5px var(--font,sans-serif);color:var(--text-dim,#777);margin-top:1px}'
    + '.ct-pask-it .n{font:700 10px/1 var(--font-mono,monospace);color:var(--text-muted,#aaa);background:var(--bg-elevated,#1a1e2a);border:1px solid var(--border,rgba(255,255,255,.08));padding:4px 7px;border-radius:6px;min-width:22px;text-align:center}'
    + '.ct-pask-it .n.ac{color:var(--accent-light,#a99cff);background:var(--accent-dim,rgba(124,92,255,.12));border-color:var(--accent-border,rgba(124,92,255,.35))}'
    + '.ct-pask-it .n.sirdis{color:#ff5c8a;background:rgba(255,92,138,.14);border-color:rgba(255,92,138,.4)}'
    + '.ct-pask-sep{height:1px;background:var(--border,rgba(255,255,255,.08));margin:6px 4px}'
    + '.ct-pask-it.isjungti{color:var(--text-muted,#aaa)}'
    + '.ct-pask-it.isjungti:hover{color:var(--danger,#ff6b6b)}'
    + '.ct-pask-it.isjungti:hover .ic{border-color:var(--danger-border,rgba(255,107,107,.3));background:var(--danger-dim,rgba(255,107,107,.12))}'
    + '@media (max-width:640px){#ct-pask{top:58px;right:10px;left:10px;width:auto}}';

  var IK = {
    sirdis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    ataskaita: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    palyg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3v18M17 3v18M3 7h8M13 17h8"/></svg>',
    istorija: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    planas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M6 20V10l6-8 6 8v10"/></svg>',
    versija: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
    isjungti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };

  function uztikrinti() {
    if (!document.getElementById('ct-pask-css')) { var st = document.createElement('style'); st.id = 'ct-pask-css'; st.textContent = CSS; document.head.appendChild(st); }
    var m = document.getElementById('ct-pask');
    if (m) return m;
    m = document.createElement('div'); m.id = 'ct-pask'; m.setAttribute('role', 'menu');
    document.body.appendChild(m);
    document.addEventListener('click', function (e) {
      if (!_atidaryta) return;
      var av = document.querySelector('.ct3-avatar');
      if (!m.contains(e.target) && !(av && av.contains(e.target))) uzdaryti();
    }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && _atidaryta) uzdaryti(); });
    return m;
  }

  function eil(o) {
    var tag = o.href ? 'a' : 'button';
    return '<' + tag + ' class="ct-pask-it' + (o.cls ? ' ' + o.cls : '') + '"' + (o.href ? ' href="' + esc(o.href) + '"' : ' type="button"') + (o.onclick ? ' data-veiksmas="' + o.onclick + '"' : '') + ' role="menuitem">'
      + '<span class="ic">' + (IK[o.ik] || '') + '</span><span class="t">' + esc(o.t) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span>'
      + (o.n != null ? '<span class="n' + (o.ncls ? ' ' + o.ncls : '') + '">' + esc(o.n) + '</span>' : '') + '</' + tag + '>';
  }

  function piesti(m, d) {
    var el = email(), ini = el ? el[0].toUpperCase() : '?';
    var pl = d.planas;
    var planoHtml = pl ? '<span class="ct-pask-pl">' + esc(pl.planoPavadinimas || pl.planas || 'Planas') + '</span><span class="ct-pask-pl kr' + (pl.kreditai && pl.kreditai.viso <= 0 ? ' nulis' : '') + '">' + (pl.kreditai ? pl.kreditai.viso : '–') + ' kr</span>' : 'Prisijungęs';
    var dabartinis = d.palyginimoSarasas >= 2 ? ' · dabar lyginami ' + d.palyginimoSarasas : '';
    m.innerHTML = '<div class="ct-pask-head"><div class="ct-pask-av">' + esc(ini) + '</div><div class="ct-pask-el"><b>' + esc(el || 'Paskyra') + '</b><small>' + planoHtml + '</small></div></div>'
      + '<div class="ct-pask-list">'
      + eil({ ik: 'sirdis', t: 'Mėgstamiausi', sub: 'išsaugoti skelbimai, kainų pokyčiai', n: d.megstami, ncls: d.megstami ? 'sirdis' : '', href: 'megstamiausi.html' })
      + eil({ ik: 'ataskaita', t: 'Ataskaitos', sub: 'analizės, VIN, pardavėjai', n: d.ataskaitos, ncls: d.ataskaitos ? 'ac' : '', href: 'ataskaitos.html' })
      + eil({ ik: 'palyg', t: 'Palyginimai', sub: 'palyginimų ataskaitos' + dabartinis, n: d.palyginimai, ncls: d.palyginimai ? 'ac' : '', href: 'ataskaitos.html?tipas=palyginimas' })
      + (d.palyginimoSarasas >= 2 ? eil({ ik: 'palyg', t: 'Tęsti dabartinį palyginimą', sub: d.palyginimoSarasas + ' automobiliai sąraše', href: 'index.html?palyginimas=1' }) : '')
      + eil({ ik: 'istorija', t: 'Paieškų istorija', sub: 'senos paieškos, +N naujų', n: d.paieskos, href: 'index.html?tab=istorija' })
      + '<div class="ct-pask-sep"></div>'
      + eil({ ik: 'planas', t: 'Planas ir kreditai', sub: pl ? (pl.paieskos && pl.paieskos.liko != null ? 'paieškų liko: ' + pl.paieskos.liko : 'paieškos neribotos') : 'planai, kreditų paketai', onclick: 'planas' })
      + eil({ ik: 'versija', t: 'Versijų istorija', sub: window.CT_APP_VERSION ? 'dabartinė ' + window.CT_APP_VERSION : '', onclick: 'versija' })
      + '<div class="ct-pask-sep"></div>'
      + eil({ ik: 'isjungti', t: 'Atsijungti', cls: 'isjungti', onclick: 'atsijungti' })
      + '</div>';
    m.querySelectorAll('[data-veiksmas]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); var v = b.getAttribute('data-veiksmas'); uzdaryti();
        if (v === 'planas') { if (typeof window.ctPlanuModalas === 'function') window.ctPlanuModalas(); else location.href = 'index.html?planas=1'; }
        if (v === 'versija') { if (typeof window.ctVersijuModalas === 'function') window.ctVersijuModalas(); }
        if (v === 'atsijungti') {
          if (typeof window.ctLogout === 'function') return window.ctLogout();
          try { localStorage.removeItem('ct_token'); localStorage.removeItem('ct_email'); } catch (err) {}
          location.href = 'index.html';
        }
      });
    });
    // Prisijungusio vartotojo nuorodos i index.html - be perkrovimo, jei jau esam ten
    m.querySelectorAll('a.ct-pask-it').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var h = a.getAttribute('href');
        if (arIndex() && h === 'index.html?tab=istorija' && typeof window.ctNavTab === 'function') { e.preventDefault(); uzdaryti(); window.ctNavTab('istorija'); }
        else uzdaryti();
      });
    });
  }

  function duomenys() {
    var d = { megstami: 0, ataskaitos: 0, palyginimai: 0, paieskos: 0, palyginimoSarasas: 0, planas: window.ctPlanas || null };
    try { d.megstami = window.ctMegstami ? window.ctMegstami.sarasas().length : (JSON.parse(localStorage.getItem('carTriageFavorites') || '[]') || []).length; } catch (e) {}
    try { d.paieskos = (JSON.parse(localStorage.getItem('carTriageSearchHistory') || '[]') || []).length; } catch (e) {}
    try { d.palyginimoSarasas = (JSON.parse(localStorage.getItem('ct_compare_list') || '[]') || []).length; } catch (e) {}
    return d;
  }

  function atidaryti() {
    var m = uztikrinti();
    var d = duomenys();
    piesti(m, d);
    m.classList.add('open'); _atidaryta = true;
    var av = document.querySelector('.ct3-avatar'); if (av) av.setAttribute('aria-expanded', 'true');
    var h = { 'Authorization': 'Bearer ' + token() };
    // Skaiciai is serverio (viena lengva uzklausa kiekvienam)
    fetch('/api/ataskaitos', { headers: h }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !Array.isArray(j.sarasas) || !_atidaryta) return;
      d.ataskaitos = j.sarasas.length; d.palyginimai = j.sarasas.filter(function (a) { return a.tipas === 'palyginimas'; }).length;
      piesti(m, d);
    }).catch(function () {});
    if (!d.planas) fetch('/api/planas', { headers: h }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && _atidaryta) { d.planas = j; window.ctPlanas = window.ctPlanas || j; piesti(m, d); } }).catch(function () {});
  }
  function uzdaryti() {
    var m = document.getElementById('ct-pask'); if (!m) return;
    m.classList.remove('open'); _atidaryta = false;
    var av = document.querySelector('.ct3-avatar'); if (av) av.setAttribute('aria-expanded', 'false');
  }

  window.ctPaskyrosMeniu = function () {
    if (!token()) {
      if (typeof window.showAuthModal === 'function') return window.showAuthModal();
      return (location.href = 'index.html');
    }
    if (_atidaryta) uzdaryti(); else atidaryti();
  };
  window.ctPaskyrosMeniuUzdaryti = uzdaryti;

  // Kituose puslapiuose avataras yra <a href="index.html"> - paverciam meniu mygtuku
  function prijungti() {
    var av = document.querySelector('.ct3-avatar');
    if (!av) return;
    if (av.tagName === 'A' || (av.tagName === 'BUTTON' && !av.getAttribute('onclick'))) {
      av.addEventListener('click', function (e) { e.preventDefault(); window.ctPaskyrosMeniu(); });
      av.setAttribute('role', 'button'); av.setAttribute('aria-haspopup', 'true');
      if (token()) { av.style.borderColor = 'var(--accent)'; av.style.background = 'var(--accent-dim)'; av.style.color = 'var(--accent-light)'; av.title = email() || 'Paskyra'; }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prijungti); else prijungti();
})();
