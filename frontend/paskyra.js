// paskyra.js — v2.11.0 „Mano paskyra“ (47 sk., 56a paketas).
// Duomenys: /api/paskyra, /api/planas/zurnalas, /api/paskyra/paieskos,
// /api/megstamiausi, /api/ataskaitos. Veiksmai: užklausa planui / kreditams
// (KL-PASKYRA-PLANAS), slaptažodžio keitimas, duomenų eksportas.
// Paskyros trynimo nėra – laukia Teisininko (ts-paskyra).
(function () {
  'use strict';
  var root = document.getElementById('acct');
  var esc = window.ctEsc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var RODYTI = 3, KRED_RODYTI = 5;

  var PORT = {
    autoplius: ['AP', '#19b86a', 'autoplius.lt'], autogidas: ['AG', '#2D6FCA', 'autogidas.lt'],
    autoscout24: ['AS', '#F06A00', 'autoscout24'], otomoto: ['OT', '#C0392B', 'otomoto.pl'], mobilede: ['MD', '#1F4E8C', 'mobile.de'],
  };
  var VEIKSMAI = {
    analize: 'Greita apžvalga', analizePilna: 'Pilna apžvalga', vin: 'VIN patikra', pardavejas: 'Pardavėjo patikra',
    palyginimas: 'Palyginimas', megstamiuAtnaujinimas: 'Mėgstamiausių atnaujinimas', admin: 'Priskirta kreditų',
    planas: 'Plano kreditai', menuo: 'Mėnesio kreditai', grazinimas: 'Grąžinta',
  };
  var ATASK_TIPAI = { analize: 'Apžvalga', palyginimas: 'Palyginimas', vin: 'VIN', pardavejas: 'Pardavėjas' };
  // paieškos užklausos raktas -> index.html adreso raktas (ctUrlIFiltrus)
  var URL_RAKTAI = { marke: 'marke', modelis: 'modelis', pavaru_deze: 'deze', kuras: 'kuras', metaiNuo: 'metai_nuo', metaiIki: 'metai_iki',
    ridaIki: 'rida_iki', kainaNuo: 'kaina_nuo', kainaIki: 'kaina_iki', maxPages: 'psl', kebulas: 'kebulas', pardavejas: 'pardavejas',
    idetaDienos: 'ideta', zemiauRinkos: 'zemiau', minBalas: 'balas' };

  function ic(id) { return '<span class="acct-ic"><svg class="ct-i"><use href="#' + id + '"/></svg></span>'; }
  function d2(n) { return String(n).padStart(2, '0'); }
  function data(ts, laikas) {
    if (!ts) return '–';
    var d = new Date(typeof ts === 'string' && !/T|Z/.test(ts) ? ts.replace(' ', 'T') + 'Z' : ts);
    if (isNaN(d)) return String(ts).slice(0, 10);
    var s = d.getFullYear() + '-' + d2(d.getMonth() + 1) + '-' + d2(d.getDate());
    return laikas ? s + ' ' + d2(d.getHours()) + ':' + d2(d.getMinutes()) : s;
  }
  function sk(n) { return n == null ? '–' : Number(n).toLocaleString('lt-LT').replace(/[\s, ]/g, ' '); }
  function eur(x) { return String(x).replace('.', ','); }
  function portIco(p) {
    var x = PORT[p]; if (!x) return '';
    return '<svg class="ct3-portal-ico" viewBox="0 0 32 32" width="26" height="26" role="img" aria-label="' + x[2] + '"><rect width="32" height="32" rx="7" fill="' + x[1] + '"/><text x="16" y="21" font-family="system-ui,sans-serif" font-weight="800" font-size="12" fill="#fff" text-anchor="middle">' + x[0] + '</text></svg>';
  }
  function portalasIsUrl(u) {
    u = String(u || '');
    if (/autoplius/.test(u)) return 'autoplius'; if (/autogidas/.test(u)) return 'autogidas';
    if (/autoscout24/.test(u)) return 'autoscout24'; if (/otomoto/.test(u)) return 'otomoto'; if (/mobile\.de/.test(u)) return 'mobilede';
    return null;
  }
  function klaida(t) { root.innerHTML = '<div class="ct-card"><div class="ct-state"><p><b>' + esc(t) + '</b></p><p><a href="index.html">Į paiešką →</a></p></div></div>'; }
  function json(r) { if (r.status === 401) throw new Error('Sesija baigėsi – prisijunkite iš naujo'); return r.json(); }

  if (!window.ctToken || !ctToken()) { klaida('Prisijunkite – paskyra matoma tik prisijungus'); return; }

  Promise.all([
    ctApi('/api/paskyra').then(json),
    ctApi('/api/planas/zurnalas').then(json).catch(function () { return { irasai: [] }; }),
    ctApi('/api/paskyra/paieskos?kiek=50').then(json).catch(function () { return { sarasas: [], viso: 0 }; }),
    ctApi('/api/megstamiausi').then(json).catch(function () { return { sarasas: [] }; }),
    ctApi('/api/ataskaitos').then(json).catch(function () { return { sarasas: [] }; }),
  ]).then(function (v) {
    if (v[0] && v[0].error) throw new Error(v[0].error);
    piesti(v[0], v[1].irasai || [], v[2], v[3].sarasas || [], v[4].sarasas || []);
  }).catch(function (e) { klaida(e.message || 'Nepavyko įkelti paskyros'); });

  // ── Piešimas ──────────────────────────────────────────────────────────────
  function piesti(p, kred, pai, meg, ata) {
    var pl = p.planas || {};
    root.innerHTML = '<div class="acct-top">' + planoKortele(pl, p.uzklausos || []) + likucioKortele(pl) + '</div>'
      + kredituKortele(kred)
      + paieskuKortele(pai.sarasas || [], pai.viso || 0)
      + megKortele(meg)
      + ataKortele(ata)
      + nustatymuKortele(p);
    susieti(pl);
  }

  function uzklVardas(u) { return u.tipas === 'planas' ? (u.kas === 'business' ? 'Verslas' : 'Pro') : u.kas + ' kreditų'; }
  function planoKortele(pl, uzkl) {
    var laukia = uzkl.filter(function (u) { return u.busena === 'laukia'; });
    var kaina = pl.planoKaina ? eur(pl.planoKaina) + ' € / mėn.' : 'nemokamas';
    var iki = pl.planIki ? '<div class="acct-plan-d"><svg class="ct-i" style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:6px"><use href="#i-kalendorius"/></svg>' + (pl.pasibaiges ? 'Baigėsi ' : 'Galioja iki ') + esc(pl.planIki) + '</div>' : '';
    var lauk = laukia.length ? '<div class="acct-msg" id="acct-lauk">Laukia patvirtinimo: ' + laukia.map(uzklVardas).map(esc).join(', ') + '</div>' : '<div class="acct-msg" id="acct-lauk" hidden></div>';
    return '<div class="ct-card acct-plan"><div class="acct-h">' + ic('i-planai') + '<span class="acct-k">Planas</span></div>'
      + '<div class="acct-plan-n">' + esc(pl.planoPavadinimas || '–') + '</div>'
      + '<div class="acct-plan-p">' + esc(kaina) + '</div>' + iki
      + '<button type="button" class="ct-btn ct-btn-primary" id="acct-keisti">Keisti planą / Pirkti kreditų <span aria-hidden="true">→</span></button>' + lauk + '</div>';
  }

  function likucioKortele(pl) {
    var k = pl.kreditai || {}, ps = pl.paieskos || {};
    var lim;
    if (ps.riba == null) {
      // Verslui juostos nėra: juosta be galo yra melas (47 sk.)
      lim = '<div class="acct-bal-lim"><div class="acct-bal-lim-h"><span>Paieškos šį mėnesį</span><b class="acct-num">' + sk(ps.menesi) + '</b></div><div class="acct-bal-s">Be ribos</div></div>';
    } else {
      var naud = ps.ribosTipas === 'viso' ? (ps.viso || 0) : (ps.menesi || 0);
      var proc = Math.min(100, Math.round(naud / Math.max(1, ps.riba) * 100));
      var d = new Date(), atn = d.getMonth() === 11 ? (d.getFullYear() + 1) + '-01-01' : d.getFullYear() + '-' + d2(d.getMonth() + 2) + '-01';
      lim = '<div class="acct-bal-lim"><div class="acct-bal-lim-h"><span>' + (ps.ribosTipas === 'viso' ? 'Bandomosios paieškos' : 'Paieškos šį mėnesį') + '</span><b class="acct-num">' + sk(naud) + ' iš ' + sk(ps.riba) + '</b></div>'
        + '<div class="ct-bar" role="progressbar" aria-label="Panaudotos paieškos" aria-valuemin="0" aria-valuemax="' + ps.riba + '" aria-valuenow="' + naud + '"><span style="width:' + proc + '%"></span></div>'
        + '<div class="acct-bal-s">' + (ps.ribosTipas === 'viso' ? 'Bandomasis planas neatsinaujina' : 'Atsinaujina ' + atn) + '</div></div>';
    }
    return '<div class="ct-card acct-bal"><div class="acct-h">' + ic('i-kreditai') + '<span class="acct-k">Likutis</span></div>'
      + '<div class="acct-bal-n">' + sk(k.viso) + '<small>kreditai</small></div>'
      + '<div class="acct-bal-s">' + sk(k.plano) + ' iš plano · ' + sk(k.pirkti) + ' pirkti</div>'
      + '<div class="acct-bal-rows">' + lim + '</div></div>';
  }

  function kredituKortele(kred) {
    var h = '<div class="ct-card" id="acct-kred"><div class="acct-h">' + ic('i-istorija') + '<span>Kreditų istorija</span><span class="acct-n">' + (kred.length ? Math.min(KRED_RODYTI, kred.length) + ' iš ' + kred.length : '') + '</span></div>';
    if (!kred.length) return h + '<div class="ct-state"><p>Kreditų dar nenaudojote.</p></div></div>';
    var eil = kred.map(function (r, i) {
      var t = VEIKSMAI[r.veiksmas] || r.veiksmas;
      return '<tr' + (i >= KRED_RODYTI ? ' hidden' : '') + '><td class="acct-num" style="text-align:left">' + data(r.laikas, true) + '</td><td>' + esc(t) + '</td>'
        + '<td class="acct-num' + (r.kiekis > 0 ? ' acct-plus' : '') + '">' + (r.kiekis > 0 ? '+' : r.kiekis < 0 ? '−' : '') + sk(Math.abs(r.kiekis)) + '</td><td class="acct-num">' + sk(r.likutis_po) + '</td></tr>';
    }).join('');
    return h + '<div class="ct-table-w"><table class="ct-table"><thead><tr><th>DATA</th><th>VEIKSMAS</th><th style="text-align:right">± KIEKIS</th><th style="text-align:right">LIKUTIS PO</th></tr></thead><tbody>' + eil + '</tbody></table></div>'
      + (kred.length > KRED_RODYTI ? '<div class="acct-more"><button type="button" class="ct-btn ct-btn-sm" data-daugiau="acct-kred">Rodyti daugiau</button></div>' : '') + '</div>';
  }

  function paieskosUrl(f) {
    var q = new URLSearchParams();
    Object.keys(URL_RAKTAI).forEach(function (k) { if (f[k] != null && f[k] !== '') q.set(URL_RAKTAI[k], f[k]); });
    if (Array.isArray(f.portals) && f.portals.length) q.set('portalai', f.portals.join(','));
    return 'index.html' + (q.toString() ? '?' + q.toString() : '');
  }
  function daugiau(id, n, zod) {
    if (n <= RODYTI) return '';
    return '<div class="acct-more"><button type="button" class="ct-btn ct-btn-sm" data-daugiau="' + id + '">Rodyti daugiau</button><span data-kiek>' + zod + ' ' + RODYTI + ' iš ' + n + '</span></div>';
  }
  function paieskuKortele(sar, viso) {
    var h = '<div class="ct-card" id="acct-pai"><div class="acct-h">' + ic('i-ieskoti') + '<span>Paieškų istorija</span><span class="acct-n">' + (viso ? viso + ' paieškos' : '') + '</span></div>';
    if (!sar.length) return h + '<div class="ct-state"><p>Dar neieškojote. Paieškos čia atsiras nuo v2.11.0.</p><p><a class="ct-btn ct-btn-sm" href="index.html">Į paiešką</a></p></div></div>';
    var eil = sar.map(function (s, i) {
      var pav = [s.marke, s.modelis].filter(Boolean).join(' ') || 'Visi automobiliai';
      var metai = s.metaiNuo || s.metaiIki ? (s.metaiNuo || '…') + '–' + (s.metaiIki || '…') : '';
      return '<div class="acct-row"' + (i >= RODYTI ? ' hidden' : '') + '><div class="acct-row-t"><div>' + esc(pav) + '</div><div>' + data(s.laikas, true) + (metai ? ' · ' + esc(metai) : '') + (s.busena === 'error' ? ' · nepavyko' : '') + '</div></div>'
        + '<div class="acct-portals">' + (s.portalai || []).map(portIco).join('') + '</div>'
        + '<div class="acct-row-v">' + (s.rasta != null ? sk(s.rasta) + '<small>RASTA</small>' : '–') + '</div>'
        + '<a class="ct-btn ct-btn-sm" href="' + esc(paieskosUrl(s.filtrai || {})) + '"><svg class="ct-i"><use href="#i-ieskoti"/></svg>Kartoti</a></div>';
    }).join('');
    return h + eil + daugiau('acct-pai', sar.length, 'rodomos') + '</div>';
  }
  function megKortele(meg) {
    var h = '<div class="ct-card" id="acct-meg"><div class="acct-h">' + ic('i-issaugoti') + '<span>Mėgstamiausi</span><span class="acct-n">' + (meg.length ? meg.length + ' išsaugoti' : '') + '</span></div>';
    if (!meg.length) return h + '<div class="ct-state"><p>Dar nieko neišsaugota. Paieškos rezultatuose paspauskite ♥.</p></div></div>';
    var eil = meg.map(function (f, i) {
      var p = portalasIsUrl(f.url) || f.source;
      var pav = [f.modelis, f.metai].filter(Boolean).join(' · ');
      var sub = [PORT[p] ? PORT[p][2] : '', f.rida ? sk(f.rida) + ' km' : '', f.prideta ? 'pridėta ' + data(f.prideta).slice(5) : ''].filter(Boolean).join(' · ');
      return '<div class="acct-row"' + (i >= RODYTI ? ' hidden' : '') + '><span class="acct-ic">' + (PORT[p] ? '<span class="acct-badge">' + PORT[p][0] + '</span>' : '<svg class="ct-i"><use href="#i-skelbimas"/></svg>') + '</span>'
        + '<div class="acct-row-t"><div>' + esc(pav || 'Skelbimas') + '</div><div>' + esc(sub) + '</div></div>'
        + '<div class="acct-row-v">' + (f.kaina ? sk(f.kaina) + ' €' : '') + '</div>'
        + '<a class="ct-btn ct-btn-sm" href="' + esc(f.url) + '" target="_blank" rel="noopener">Atidaryti</a></div>';
    }).join('');
    return h + eil + daugiau('acct-meg', meg.length, 'rodomi') + '</div>';
  }
  function ataKortele(ata) {
    var h = '<div class="ct-card" id="acct-ata"><div class="acct-h">' + ic('i-apzvalga') + '<span>Ataskaitos</span><span class="acct-n">' + (ata.length ? ata.length + ' ataskaitos' : '') + '</span></div>';
    if (!ata.length) return h + '<div class="ct-state"><p>Ataskaitų dar nėra – jos atsiranda po pilnos apžvalgos, VIN ar palyginimo.</p></div></div>';
    var eil = ata.map(function (a, i) {
      var tip = ATASK_TIPAI[a.tipas] || a.tipas || '';
      return '<div class="acct-row"' + (i >= RODYTI ? ' hidden' : '') + '><span class="acct-ic"><span class="acct-badge">' + esc(tip.slice(0, 3).toUpperCase()) + '</span></span>'
        + '<div class="acct-row-t"><div>' + esc(a.pavadinimas || tip || 'Ataskaita') + '</div><div>' + data(a.laikas, true) + ' · ' + esc(tip) + '</div></div>'
        + '<a class="ct-btn ct-btn-sm" href="ataskaitos.html' + (a.tipas ? '?tipas=' + encodeURIComponent(a.tipas) : '') + '#at-' + a.id + '">Atidaryti</a></div>';
    }).join('');
    return h + eil + daugiau('acct-ata', ata.length, 'rodomos') + '</div>';
  }
  function nustatymuKortele(p) {
    return '<div class="ct-card"><div class="acct-h">' + ic('i-filtrai') + '<span>Nustatymai</span></div><div class="acct-set">'
      + '<div class="acct-set-r">' + ic('i-pastas') + '<div class="acct-set-l"><div class="acct-set-k">El. paštas</div><div class="acct-set-v">' + esc(p.email) + '</div></div></div>'
      + '<div class="acct-set-r">' + ic('i-slaptazodis') + '<div class="acct-set-l"><div class="acct-set-k">Slaptažodis</div><div class="acct-set-v">••••••••</div>'
      + '<form class="acct-set-f" id="acct-slapt" hidden>'
      + '<input type="password" name="dabartinis" placeholder="Dabartinis slaptažodis" aria-label="Dabartinis slaptažodis" autocomplete="current-password" required>'
      + '<input type="password" name="naujas" placeholder="Naujas slaptažodis (bent 8 simboliai)" aria-label="Naujas slaptažodis" autocomplete="new-password" minlength="8" required>'
      + '<input type="password" name="naujas2" placeholder="Pakartokite naują" aria-label="Pakartokite naują slaptažodį" autocomplete="new-password" minlength="8" required>'
      + '<button type="submit" class="ct-btn ct-btn-primary">Išsaugoti</button><div class="acct-msg" id="acct-slapt-msg" role="status"></div></form></div>'
      + '<button type="button" class="ct-btn" id="acct-slapt-btn" aria-expanded="false" aria-controls="acct-slapt">Keisti</button></div>'
      + '<div class="acct-set-r">' + ic('i-atsisiusti') + '<div class="acct-set-l"><div class="acct-set-k">Mano duomenys</div><div class="acct-set-v">Paieškos, kreditai, mėgstamiausi, ataskaitos (JSON)</div></div>'
      + '<button type="button" class="ct-btn" id="acct-eksp">Atsisiųsti</button></div>'
      + '</div></div>';
  }

  // ── Veiksmai ──────────────────────────────────────────────────────────────
  function susieti(pl) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-daugiau]');
      if (!b) return;
      var kort = document.getElementById(b.getAttribute('data-daugiau'));
      var sl = kort.querySelectorAll('.acct-row[hidden], tr[hidden]');
      for (var i = 0; i < sl.length && i < 10; i++) sl[i].hidden = false;
      var viso = kort.querySelectorAll('.acct-row, tbody tr').length, matoma = viso - kort.querySelectorAll('.acct-row[hidden], tr[hidden]').length;
      var s = kort.querySelector('[data-kiek]'); if (s) s.textContent = s.textContent.replace(/\d+ iš/, matoma + ' iš');
      if (b.getAttribute('data-daugiau') === 'acct-kred') { var n = kort.querySelector('.acct-n'); if (n) n.textContent = matoma + ' iš ' + viso; }
      if (matoma >= viso) b.remove();
    });
    var sb = document.getElementById('acct-slapt-btn'), f = document.getElementById('acct-slapt');
    sb.addEventListener('click', function () { f.hidden = !f.hidden; sb.setAttribute('aria-expanded', String(!f.hidden)); if (!f.hidden) f.dabartinis.focus(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = document.getElementById('acct-slapt-msg');
      if (f.naujas.value !== f.naujas2.value) { m.className = 'acct-msg is-err'; m.textContent = 'Nauji slaptažodžiai nesutampa'; return; }
      m.className = 'acct-msg'; m.textContent = 'Keičiama…';
      ctApi('/api/paskyra/slaptazodis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dabartinis: f.dabartinis.value, naujas: f.naujas.value }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Nepavyko'); }); })
        .then(function () { f.reset(); m.className = 'acct-msg is-ok'; m.textContent = 'Slaptažodis pakeistas'; })
        .catch(function (er) { m.className = 'acct-msg is-err'; m.textContent = er.message; });
    });
    document.getElementById('acct-eksp').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      ctApi('/api/paskyra/eksportas').then(function (r) { if (!r.ok) throw new Error(); return r.blob(); }).then(function (b) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'cartriige-mano-duomenys.json';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      }).catch(function () { alert('Nepavyko paruošti duomenų'); }).then(function () { btn.disabled = false; });
    });
    document.getElementById('acct-keisti').addEventListener('click', function () { planuLangas(pl); });
  }

  function planuLangas(pl) {
    var P = pl.planai || {}, pk = pl.paketai || [];
    var opt = function (tipas, kas, pav, apr) { return '<button type="button" class="acct-opt" data-tipas="' + tipas + '" data-kas="' + kas + '"><b>' + esc(pav) + '</b><span>' + esc(apr) + '</span></button>'; };
    var planai = ['pro', 'business'].filter(function (k) { return P[k] && k !== pl.planas; }).map(function (k) {
      var x = P[k];
      return opt('planas', k, x.pavadinimas + ' · ' + eur(x.kaina) + ' €/mėn.',
        (x.paieskosMen ? x.paieskosMen + ' paieškų/mėn.' : 'paieškos be ribos') + ' · ' + x.kreditaiMen + ' kreditų/mėn.');
    }).join('');
    var paketai = pk.map(function (x) { return opt('kreditai', String(x.kreditai), x.kreditai + ' kreditų · ' + eur(x.kaina) + ' €', 'vienkartinis paketas'); }).join('');
    var w = document.createElement('div');
    w.className = 'ct-modal-scrim';
    w.innerHTML = '<div class="ct-modal" role="dialog" aria-modal="true" aria-labelledby="acct-m-t">'
      + '<button type="button" class="ct-modal-x" aria-label="Uždaryti">✕</button>'
      + '<div class="ct-modal-h"><span class="ct-modal-t" id="acct-m-t">Keisti planą / Pirkti kreditų</span>'
      + '<span class="ct-modal-d">Mokėjimo kortele kol kas nėra. Pasirinkite – gausite sąskaitą, o planą ar kreditus priskirsime rankiniu būdu.</span></div>'
      + '<div class="ct-modal-b">' + (planai ? '<div class="acct-opt-k">Planai</div><div class="acct-opts">' + planai + '</div>' : '')
      + '<div class="acct-opt-k">Kreditų paketai</div><div class="acct-opts">' + paketai + '</div><div class="acct-msg" id="acct-m-msg" role="status"></div></div>'
      + '<div class="ct-modal-f"><button type="button" class="ct-modal-cancel">Uždaryti</button></div></div>';
    document.body.appendChild(w);
    var esck = function (e) { if (e.key === 'Escape') uzd(); };
    var uzd = function () { w.remove(); document.removeEventListener('keydown', esck); document.getElementById('acct-keisti').focus(); };
    document.addEventListener('keydown', esck);
    w.addEventListener('click', function (e) {
      if (e.target === w || e.target.closest('.ct-modal-x, .ct-modal-cancel')) return uzd();
      var o = e.target.closest('.acct-opt'); if (!o) return;
      var m = document.getElementById('acct-m-msg'); m.className = 'acct-msg'; m.textContent = 'Siunčiama…';
      ctApi('/api/paskyra/uzklausa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipas: o.getAttribute('data-tipas'), kas: o.getAttribute('data-kas') }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Nepavyko'); return j; }); })
        .then(function (j) {
          m.className = 'acct-msg is-ok';
          m.textContent = j.jau ? 'Ši užklausa jau pateikta – laukia patvirtinimo.' : 'Užklausa pateikta. Susisieksime dėl sąskaitos; patvirtinus planas ar kreditai atsiras paskyroje.';
          var l = document.getElementById('acct-lauk'); if (l && !j.jau) { l.hidden = false; l.textContent = (l.textContent ? l.textContent + ', ' : 'Laukia patvirtinimo: ') + o.querySelector('b').textContent.split(' · ')[0]; }
        })
        .catch(function (er) { m.className = 'acct-msg is-err'; m.textContent = er.message; });
    });
    var pirmas = w.querySelector('.acct-opt'); if (pirmas) pirmas.focus();
  }
})();
