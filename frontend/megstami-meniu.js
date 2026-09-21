// megstami-meniu.js — širdutė antraštėje su mėgstamiausių skaičiumi ir iškleidžiamu sąrašu.
// Įterpiama prieš profilio mygtuką (.ct3-avatar). Sąrašas: iš naršyklės iš karto,
// iš serverio (su skelbimo istorija: kada pastebėtas, kada tikrintas, kainos pokytis) – kai prisijungta.
//
// Naudojimas kituose skriptuose:
//   ctMegstami.sarasas()        – dabartinis sąrašas
//   ctMegstami.atnaujinti(list) – įrašyti naują sąrašą (po ♥ paspaudimo)
//   ctMegstami.perkrauti()      – iš naujo parsisiųsti iš serverio
//   įvykis document 'ct:megstami' { detail: { sarasas } } – kai sąrašas pasikeičia
(function () {
  var KEY = 'carTriageFavorites';
  var _sarasas = [], _atidaryta = false, _hoverT = null, _isServerio = false;
  var _busena = ''; // v1.23.1: paskutinio „Atnaujinti visus" rezultato tekstas (islieka perpiesus sarasa)

  function token() { try { return localStorage.getItem('ct_token'); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function eur(n) { return n == null || isNaN(n) ? '–' : Number(n).toLocaleString('lt-LT').replace(/,/g, ' ') + ' €'; }
  function skirt(n) { return (n > 0 ? '+' : '−') + Math.abs(Math.round(n)).toLocaleString('lt-LT').replace(/,/g, ' ') + ' €'; }
  function data(ts) { if (!ts) return null; var d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pries(ts) {
    if (!ts) return null;
    var s = Date.now() - ts;
    if (s < 60e3) return 'ką tik';
    if (s < 3600e3) return 'prieš ' + Math.round(s / 60e3) + ' min';
    if (s < 86400e3) return 'prieš ' + Math.round(s / 3600e3) + ' val.';
    if (s < 2 * 86400e3) return 'vakar';
    if (s < 30 * 86400e3) return 'prieš ' + Math.round(s / 86400e3) + ' d.';
    return data(ts);
  }
  function vietiniai() {
    try { var raw = JSON.parse(localStorage.getItem(KEY) || '[]'); return (Array.isArray(raw) ? raw : []).map(function (f) { return typeof f === 'string' ? { url: f } : f; }).filter(function (f) { return f && typeof f === 'object' && f.url; }); }
    catch (e) { return []; }
  }
  function irasyti(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  var CSS = ''
    + '.ct-meg-wrap{position:relative;flex:none}'
    + '.ct-meg-btn{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--border-light,rgba(255,255,255,.12));background:var(--bg-elevated,#1a1e2a);color:var(--text-secondary,#c9cbd3);display:grid;place-items:center;cursor:pointer;padding:0;transition:color .15s,border-color .15s}'
    + '.ct-meg-btn:hover,.ct-meg-btn.open{color:var(--accent-light);border-color:var(--accent-border)}'
    + '.ct-meg-btn.yra svg{fill:var(--accent-light);stroke:var(--accent-light)}'
    + '.ct-meg-btn.yra{color:var(--accent-light)}'
    + '.ct-meg-kiek{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--accent-light);color:#fff;font:700 10px/18px var(--font-mono,monospace);text-align:center;border:2px solid var(--bg-base,#0a0c12);box-sizing:content-box;display:none}'
    + '.ct-meg-btn.yra .ct-meg-kiek{display:block}'
    + '.ct-meg-dd{position:absolute;right:0;top:calc(100% + 10px);width:400px;max-width:calc(100vw - 24px);background:var(--bg-surface,#12151e);border:1px solid var(--border-light,rgba(255,255,255,.12));border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.55);z-index:1500;display:none;overflow:hidden}'
    + '.ct-meg-dd.open{display:block}'
    + '.ct-meg-head{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));font:700 13px var(--font,sans-serif);color:var(--text-primary,#fff)}'
    + '.ct-meg-head small{font:600 10px/1 var(--font-mono,monospace);color:var(--accent-light);background:var(--accent-dim);border:1px solid var(--accent-border);padding:4px 7px;border-radius:6px}'
    + '.ct-meg-head a{margin-left:auto;font:500 12px var(--font,sans-serif);color:var(--accent-light,#a99cff);text-decoration:none}'
    + '.ct-meg-head a:hover{text-decoration:underline}'
    + '.ct-meg-head button.ct-meg-atn{margin-left:auto;font:600 11px var(--font,sans-serif);color:var(--accent-light,#a99cff);background:var(--accent-dim,rgba(124,92,255,.12));border:1px solid var(--accent-border,rgba(124,92,255,.35));padding:5px 9px;border-radius:8px;cursor:pointer}'
    + '.ct-meg-head button.ct-meg-atn:hover{background:var(--accent,#7c5cff);color:#fff}'
    + '.ct-meg-head button.ct-meg-atn[disabled]{opacity:.55;cursor:default}'
    + '.ct-meg-head a.ct-meg-visi{margin-left:0}'
    + '.ct-meg-busena{padding:9px 13px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));font:400 11.5px/1.5 var(--font,sans-serif);color:var(--text-muted,#aaa)}'
    + '.ct-meg-list{max-height:min(62vh,520px);overflow-y:auto}'
    + '.ct-meg-eil{display:grid;grid-template-columns:64px 1fr 26px;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border,rgba(255,255,255,.08));cursor:pointer;align-items:start}'
    + '.ct-meg-eil:last-child{border-bottom:none}'
    + '.ct-meg-eil:hover{background:rgba(255,255,255,.03)}'
    + '.ct-meg-ph{width:64px;height:48px;border-radius:7px;background:#141822;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.08))}'
    + '.ct-meg-ph img{width:100%;height:100%;object-fit:cover;display:block}'
    + '.ct-meg-info{min-width:0}'
    + '.ct-meg-pav{font:600 13px/1.25 var(--font,sans-serif);color:var(--text-primary,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.ct-meg-pav span{font:500 9px/1 var(--font-mono,monospace);color:var(--text-dim,#777);margin-left:6px;letter-spacing:.06em;text-transform:uppercase}'
    + '.ct-meg-kaina{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:3px;font:700 13px var(--font-mono,monospace);color:var(--text-primary,#fff)}'
    + '.ct-meg-chip{font:600 10px/1 var(--font-mono,monospace);padding:3px 6px;border-radius:5px;background:var(--bg-elevated,#1a1e2a);border:1px solid var(--border,rgba(255,255,255,.08));color:var(--text-muted,#aaa)}'
    + '.ct-meg-chip.gerai{color:var(--success,#3ddc97);background:var(--success-dim,rgba(61,220,151,.12));border-color:var(--success-border,rgba(61,220,151,.3))}'
    + '.ct-meg-chip.blogai{color:var(--danger,#ff6b6b);background:var(--danger-dim,rgba(255,107,107,.12));border-color:var(--danger-border,rgba(255,107,107,.3))}'
    + '.ct-meg-chip.demesio{color:var(--warning,#ffb454);background:var(--warning-dim,rgba(255,180,84,.12));border-color:var(--warning-border,rgba(255,180,84,.3))}'
    + '.ct-meg-meta{margin-top:4px;font:400 10.5px/1.5 var(--font,sans-serif);color:var(--text-dim,#777)}'
    + '.ct-meg-meta b{color:var(--text-muted,#aaa);font-weight:500}'
    + '.ct-meg-x{width:26px;height:26px;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--text-dim,#777);cursor:pointer;font-size:13px;display:grid;place-items:center;padding:0}'
    + '.ct-meg-x:hover{color:var(--danger,#ff6b6b);border-color:var(--danger-border,rgba(255,107,107,.3));background:var(--danger-dim,rgba(255,107,107,.12))}'
    + '.ct-meg-tuscia{padding:28px 16px;text-align:center;font:400 12.5px/1.6 var(--font,sans-serif);color:var(--text-muted,#aaa)}'
    + '.ct-meg-tuscia b{display:block;color:var(--text-primary,#fff);font-size:14px;margin-bottom:4px}'
    + '.ct-meg-foot{padding:9px 14px;border-top:1px solid var(--border,rgba(255,255,255,.08));font:400 11px var(--font,sans-serif);color:var(--text-dim,#777)}'
    + '@media (max-width:640px){.ct-meg-btn{width:44px;height:44px}.ct-meg-dd{position:fixed;left:12px;right:12px;top:66px;width:auto;max-width:none}.ct-meg-list{max-height:calc(100vh - 150px)}}';

  function ikonaSirdis(w) { return '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>'; }

  function sukurti() {
    if (document.getElementById('ct-meg-wrap')) return;
    if (!document.getElementById('ct-meg-css')) { var st = document.createElement('style'); st.id = 'ct-meg-css'; st.textContent = CSS; document.head.appendChild(st); }
    var avatar = document.querySelector('.ct3-header-right .ct3-avatar') || document.querySelector('.ct3-avatar');
    var host = avatar ? avatar.parentElement : document.querySelector('.ct3-header-right');
    if (!host) return;
    var wrap = document.createElement('div'); wrap.className = 'ct-meg-wrap'; wrap.id = 'ct-meg-wrap';
    wrap.innerHTML = '<button class="ct-meg-btn" id="ct-meg-btn" type="button" title="Mėgstamiausi" aria-haspopup="true" aria-expanded="false">' + ikonaSirdis(18) + '<span class="ct-meg-kiek" id="ct-meg-kiek">0</span></button>'
      + '<div class="ct-meg-dd" id="ct-meg-dd" role="menu"></div>';
    if (avatar) host.insertBefore(wrap, avatar); else host.appendChild(wrap);
    var btn = wrap.querySelector('#ct-meg-btn');
    // v1.71.0 (pranesimas Nr.6): pele valdomame irenginyje uzvedimas JAU atidaro
    // sarasa, tad paspaudimas ta pati darbą darydavo antra karta - ir atrodydavo,
    // kad sirdele "dingsta" (is tikruju uzsidarydavo tai, ka uzvedimas atidare).
    // Dabar paspaudimas veda i pilna sarasa, o uzvedimas lieka greitai perziurai.
    //
    // Liecianciame irenginyje uzvedimo NERA, tad ten paspaudimas privalo atidaryti
    // sarasa - kitaip iskleidziamasis tampa nepasiekiamas. Nuoroda i pilna sarasa
    // ten lieka pacioje iskleidziamoje dalyje ("Visi -->").
    var _peleValdomas = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (_peleValdomas) { window.location.href = 'megstamiausi.html'; return; }
      if (_atidaryta) uzdaryti(); else atidaryti();
    });
    if (_peleValdomas) {
      btn.title = 'Mėgstamiausi – užveskite peržiūrai, paspauskite visam sąrašui';
    }
    // Pele: uzvedus atsidaro, nuvedus - uzsidaro (tik irenginiuose su pele)
    if (_peleValdomas) {
      wrap.addEventListener('mouseenter', function () { clearTimeout(_hoverT); _hoverT = setTimeout(atidaryti, 120); });
      wrap.addEventListener('mouseleave', function () { clearTimeout(_hoverT); _hoverT = setTimeout(uzdaryti, 260); });
    }
    document.addEventListener('click', function (e) { if (_atidaryta && !wrap.contains(e.target)) uzdaryti(); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && _atidaryta) uzdaryti(); });
  }

  function atidaryti() {
    var dd = document.getElementById('ct-meg-dd'), btn = document.getElementById('ct-meg-btn'); if (!dd) return;
    piestiSarasa(); dd.classList.add('open'); btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); _atidaryta = true;
    // v1.25.0 PATAISYTA: pirmas uzvedimas rodydavo tik vietinius (arba tuscia) sarasa,
    // nes serverio duomenys ateidavo veliau. Dabar uzsakom juos is karto ir perpiesiam.
    if (!_isServerio && token()) {
      perkrauti().then(function () { if (_atidaryta) piestiSarasa(); });
    }
  }
  function uzdaryti() {
    var dd = document.getElementById('ct-meg-dd'), btn = document.getElementById('ct-meg-btn'); if (!dd) return;
    dd.classList.remove('open'); btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); _atidaryta = false;
  }

  function piestiZenkleli() {
    var btn = document.getElementById('ct-meg-btn'), k = document.getElementById('ct-meg-kiek'); if (!btn) return;
    var n = _sarasas.length;
    k.textContent = n > 99 ? '99+' : n;
    btn.classList.toggle('yra', n > 0);
    btn.title = n ? 'Mėgstamiausi: ' + n : 'Mėgstamiausi';
  }

  // Pokyciu zenkleliai is serverio istorijos (istorija: pastebetas, paskutinisPatikrinimas, dingo, kainosPokytis, nuoIssaugojimo)
  function pokyciai(f) {
    var h = f.istorija || {}, chips = [];
    if (h.dingo) chips.push('<span class="ct-meg-chip blogai" title="Šio skelbimo nebematome portale jau kelis patikrinimus iš eilės – tikėtina, parduotas. Verta atidaryti skelbimą ir įsitikinti.">Nebematome portale ' + esc(pries(h.dingo)) + '</span>');
    var nuo = h.nuoIssaugojimo != null ? h.nuoIssaugojimo : 0;
    if (nuo && Math.abs(nuo) >= 50) chips.push('<span class="ct-meg-chip ' + (nuo < 0 ? 'gerai' : 'demesio') + '" title="Kainos pokytis nuo tada, kai išsaugojote">' + skirt(nuo) + ' nuo išsaugojimo</span>');
    else if (h.kainosPokytis && Math.abs(h.kainosPokytis) >= 50) chips.push('<span class="ct-meg-chip ' + (h.kainosPokytis < 0 ? 'gerai' : 'demesio') + '" title="Kainos pokytis nuo tada, kai skelbimas pastebėtas rinkoje">' + skirt(h.kainosPokytis) + (h.mazinimuKartai > 1 ? ' · ' + h.mazinimuKartai + '× mažinta' : '') + '</span>');
    if (h.ridosPokytis && h.ridosPokytis > 500) chips.push('<span class="ct-meg-chip demesio">rida +' + Math.round(h.ridosPokytis).toLocaleString('lt-LT').replace(/,/g, ' ') + ' km</span>');
    return chips.join('');
  }
  function meta(f) {
    var h = f.istorija || {}, d = [];
    if (f.savedAt) d.push('Išsaugota <b>' + esc(pries(f.savedAt)) + '</b>');
    if (h.pastebetas) d.push('rinkoje nuo <b>' + esc(data(h.pastebetas)) + '</b>' + (h.dienosRinkoje != null ? ' (' + h.dienosRinkoje + ' d.)' : ''));
    if (h.paskutinisPatikrinimas) d.push('tikrinta <b>' + esc(pries(h.paskutinisPatikrinimas)) + '</b>');
    return d.join(' · ');
  }

  function piestiSarasa() {
    var dd = document.getElementById('ct-meg-dd'); if (!dd) return;
    var n = _sarasas.length;
    // v1.23.1: mygtukas, kuris vienu paspaudimu pertikrina VISU issaugotu skelbimu
    // busena ir kaina portale (papildoma paslauga, 1 kreditas uz visa sarasa per para).
    var html = '<div class="ct-meg-head">' + ikonaSirdis(14) + ' Mėgstamiausi <small>' + n + '</small>'
      + (n ? '<button type="button" class="ct-meg-atn" id="ct-meg-atn" title="Iš naujo patikriname kiekvieno išsaugoto skelbimo kainą ir būseną portale. 1 kreditas už visą sąrašą (kartą per parą).">↻ Atnaujinti visus · 1 kr</button>' : '')
      + '<a class="ct-meg-visi" href="megstamiausi.html" style="margin-left:' + (n ? '10px' : 'auto') + '">Visi →</a></div>'
      + '<div class="ct-meg-busena" id="ct-meg-busena" style="display:' + (_busena ? '' : 'none') + '">' + (_busena || '') + '</div>';
    if (!n) {
      html += '<div class="ct-meg-tuscia"><b>Dar nieko neišsaugota</b>Paspauskite ♥ ant skelbimo kortelės arba detalioje apžvalgoje.</div>';
    } else {
      html += '<div class="ct-meg-list">' + _sarasas.slice(0, 40).map(function (f, i) {
        var h = f.istorija || {};
        var kaina = h.dabartineKaina && h.dabartineKaina !== f.kaina ? h.dabartineKaina : f.kaina;
        return '<div class="ct-meg-eil" data-i="' + i + '" role="menuitem" tabindex="0">'
          + '<div class="ct-meg-ph">' + (f.photo ? '<img src="' + esc(f.photo) + '" alt="" loading="lazy">' : '') + '</div>'
          + '<div class="ct-meg-info"><div class="ct-meg-pav">' + esc(f.modelis || 'Skelbimas') + (f.source ? '<span>' + esc(f.source) + '</span>' : '') + '</div>'
          + '<div class="ct-meg-kaina">' + eur(kaina) + (kaina !== f.kaina && f.kaina ? '<span class="ct-meg-chip" title="Kaina, kai išsaugojote">buvo ' + eur(f.kaina) + '</span>' : '') + pokyciai(f) + '</div>'
          + '<div class="ct-meg-meta">' + meta(f) + '</div></div>'
          + '<button class="ct-meg-x" type="button" title="Pašalinti iš mėgstamiausių" data-x="' + i + '">✕</button>'
          + '</div>';
      }).join('') + '</div>';
      if (n > 40) html += '<div class="ct-meg-foot">Rodoma 40 iš ' + n + ' – <a href="megstamiausi.html" style="color:var(--accent-light)">visas sąrašas</a></div>';
    }
    if (!token()) html += '<div class="ct-meg-foot">Prisijunkite, kad mėgstamiausi būtų saugomi prie paskyros ir matytųsi iš kitų įrenginių.</div>';
    dd.innerHTML = html;
    dd.querySelectorAll('.ct-meg-eil').forEach(function (el) {
      el.addEventListener('click', function (e) { if (e.target.closest('.ct-meg-x')) return; atidarytiSkelbima(_sarasas[+el.dataset.i]); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') atidarytiSkelbima(_sarasas[+el.dataset.i]); });
    });
    dd.querySelectorAll('.ct-meg-x').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); salinti(_sarasas[+b.dataset.x].url); });
    });
    var atn = dd.querySelector('#ct-meg-atn');
    if (atn) atn.addEventListener('click', function (e) { e.stopPropagation(); atnaujintiVisus(atn, false); });
  }

  // v1.23.1 PAPILDOMA PASLAUGA: pertikrinam visus issaugotus skelbimus portale -
  // ar kaina pasikeite, ar rezervuota, ar dar skelbiama. 1 kreditas uz visa sarasa.
  // v1.25.0: patvirtinimas rodomas PACIAME lange (narsykles „says" langas atrode svetimas)
  function atnaujintiVisus(btn, patvirtinta) {
    if (!token()) { if (typeof window.showAuthModal === 'function') window.showAuthModal(); return; }
    // v2.5.1 (Nr. 33): puslapio mygtukas (#mg-atn) rašo į puslapio #mg-busena;
    // meniu mygtukas - į meniu #ct-meg-busena. Anksčiau abu ieškojo tik meniu
    // elemento, o jo puslapyje nėra, kol meniu uždarytas → `return` be jokio ženklo.
    var bus = (btn && btn.id === 'mg-atn' && document.getElementById('mg-busena')) || document.getElementById('ct-meg-busena');
    if (!patvirtinta) {
      if (!bus) { if (window.confirm('Patikrinti visų išsaugotų skelbimų kainą ir būseną? 1 kreditas už visą sąrašą.')) atnaujintiVisus(btn, true); return; }
      bus.style.display = '';
      bus.innerHTML = '<div style="color:var(--text-secondary,#c9cbd3)">Patikrinsime visų išsaugotų skelbimų kainą ir būseną portale.</div>'
        + '<div style="margin-top:4px;color:var(--text-dim,#777)">1 kreditas už visą sąrašą · kartą per parą, kitos patikros tą pačią dieną nemokamos.</div>'
        + '<div style="display:flex;gap:7px;margin-top:9px">'
        + '<button type="button" id="ct-meg-taip" style="padding:6px 12px;border-radius:8px;border:none;background:var(--accent,#7c5cff);color:#fff;font:600 11.5px var(--font,sans-serif);cursor:pointer">Taip, tikrinti</button>'
        + '<button type="button" id="ct-meg-ne" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.12));background:transparent;color:var(--text-secondary,#c9cbd3);font:600 11.5px var(--font,sans-serif);cursor:pointer">Atšaukti</button>'
        + '</div>';
      var taip = document.getElementById('ct-meg-taip'), ne = document.getElementById('ct-meg-ne');
      if (taip) taip.addEventListener('click', function (e) { e.stopPropagation(); atnaujintiVisus(btn, true); });
      if (ne) ne.addEventListener('click', function (e) { e.stopPropagation(); _busena = ''; bus.style.display = 'none'; bus.innerHTML = ''; });
      return;
    }
    btn.disabled = true; btn.textContent = '↻ Tikriname…';
    if (bus) { bus.style.display = ''; bus.textContent = 'Tikriname skelbimus portale – tai gali užtrukti iki minutės…'; }
    fetch('/api/megstamiausi/atnaujinti', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (res) {
        btn.disabled = false; btn.textContent = '↻ Atnaujinti visus · 1 kr';
        if (!res.ok) {
          if (bus) bus.textContent = res.status === 402
            ? 'Nepakanka kreditų – papildykite skiltyje „Planas ir kreditai".'
            : ((res.j && res.j.error) || 'Nepavyko atnaujinti.');
          return;
        }
        var j = res.j || {};
        var d = (j.pokyciai || []);
        {
          _busena = '<b style="color:var(--text-primary,#fff)">Patikrinta ' + (j.patikrinta || 0) + ' skelbim' + ((j.patikrinta === 1) ? 'as' : 'ai') + '</b>'
            + (d.length
              ? '<br>' + d.slice(0, 6).map(function (p) {
                  var sp = p.tipas === 'kaina-mazeja' ? 'var(--success,#3ddc97)' : p.tipas === 'dingo' ? '#ff6b6b' : 'var(--text-secondary,#c9cbd3)';
                  return '<span style="color:' + sp + '">• ' + esc(p.tekstas) + '</span>';
                }).join('<br>')
              : '<br>Pokyčių nerasta – kainos ir būsenos tokios pačios.')
            + (j.nepavyko ? '<br><span style="color:var(--text-dim,#777)">' + j.nepavyko + ' skelbimo šį kartą nepavyko perskaityti</span>' : '')
            + (j.ribojama ? '<br><span style="color:var(--text-dim,#777)">Tikrinama iki ' + j.ribojama + ' naujausių</span>' : '');
          if (bus) { bus.style.display = ''; bus.innerHTML = _busena; }
        }
        if (typeof window.ctMegstami === 'object' && window.ctMegstami.perkrauti) window.ctMegstami.perkrauti();
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = '↻ Atnaujinti visus · 1 kr';
        if (bus) bus.textContent = 'Nepavyko susisiekti su serveriu.';
      });
  }

  function atidarytiSkelbima(f) {
    if (!f) return;
    try { localStorage.setItem('ct_detail', JSON.stringify({ c: f, analysis: null, photos: f.photo ? [f.photo] : [] })); } catch (e) {}
    location.href = 'detail.html';
  }

  function pranesti() { try { document.dispatchEvent(new CustomEvent('ct:megstami', { detail: { sarasas: _sarasas } })); } catch (e) {} }

  function nustatyti(list, isServerio) {
    _sarasas = (list || []).filter(function (f) { return f && f.url; });
    if (isServerio) _isServerio = true;
    irasyti(_sarasas);
    piestiZenkleli();
    if (_atidaryta) piestiSarasa();
    pranesti();
  }

  function salinti(url) {
    nustatyti(_sarasas.filter(function (f) { return f.url !== url; }));
    if (token()) {
      fetch('/api/megstamiausi', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }, body: JSON.stringify({ url: url }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && Array.isArray(d.sarasas)) nustatyti(d.sarasas, true); })
        .catch(function () {});
    }
  }

  var _kraunama = null;
  function perkrauti() {
    if (!token()) { nustatyti(vietiniai()); return Promise.resolve(_sarasas); }
    if (_kraunama) return _kraunama;
    _kraunama = fetch('/api/megstamiausi', { headers: { 'Authorization': 'Bearer ' + token() } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && Array.isArray(d.sarasas)) {
          // vietiniai, kuriu serveris neturi (issaugoti neprisijungus) - paliekam sarase; index.html juos nusiuncia
          var serv = new Set(d.sarasas.map(function (x) { return x.url; }));
          var lik = vietiniai().filter(function (v) { return !serv.has(v.url); });
          nustatyti(d.sarasas.concat(lik), true);
        }
        return _sarasas;
      })
      .catch(function () { return _sarasas; })
      .finally(function () { _kraunama = null; });
    return _kraunama;
  }

  window.ctMegstami = {
    sarasas: function () { return _sarasas.slice(); },
    atnaujinti: function (list) { nustatyti(Array.isArray(list) ? list : vietiniai()); },
    perkrauti: perkrauti,
    atidaryti: atidaryti, uzdaryti: uzdaryti,
    // v1.85.0 (Nr. 33): „Atnaujinti visus" gyveno TIK antrastes iskleidziamame
    // meniu, tad pacioje megstamiausiu skiltyje jo nebuvo - zmogus, atsidares
    // sarasa, mygtuko nerasdavo. Funkcija atiduodama i isore, kad puslapis
    // galetu turėti savo mygtuka ir nereiktu antros tos pacios realizacijos.
    atnaujintiVisus: function (btn) { atnaujintiVisus(btn || document.getElementById('mg-atn'), false); },
    yra: function (url) { return _sarasas.some(function (f) { return f.url === url; }); },
  };

  function paleisti() {
    sukurti();
    _sarasas = vietiniai(); piestiZenkleli();
    setTimeout(perkrauti, 300);
    window.addEventListener('storage', function (e) { if (e.key === KEY) { _sarasas = vietiniai(); piestiZenkleli(); if (_atidaryta) piestiSarasa(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paleisti); else paleisti();
})();
