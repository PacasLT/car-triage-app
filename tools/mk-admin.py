# -*- coding: utf-8 -*-
# Sukuria frontend/admin.html is ataskaitos.html skeleto (sprite + antraste),
# kad piktogramos ir antraste butu TIE PATYS, o ne kopija ranka.
import io, re, sys

src = io.open('ataskaitos.html', encoding='utf-8').read()

sprite = re.search(r'<svg width="0" height="0".*?</svg>', src, re.S).group(0)
antraste = re.search(r'<header class="ct3-header">.*?</header>', src, re.S).group(0)
skriptai = re.findall(r'<script src="[^"]+"></script>', src)

STILIUS = u'''
body { background: var(--bg-base); color: var(--text-primary); font-family: var(--font); margin: 0; }
.pg { max-width: 1240px; margin: 0 auto; padding: 26px 16px 90px; }
.pg-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; flex-wrap: wrap; }
.pg-head h1 { margin: 0; font: 700 22px/1.2 var(--font); }
.pg-sub { color: var(--text-muted); font-size: 13px; margin: 0 0 18px; }

/* Skirtuku juosta - .ct-tab yra dizainerio, cia tik juosta */
.ad-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 16px; overflow-x: auto; }
.ad-tabs .ct-tab { border-bottom: 2px solid transparent; background: transparent; padding: 0 14px; white-space: nowrap; }
.ad-tabs .ct-tab.active { border-bottom-color: var(--accent); color: var(--accent-light); font-weight: 600; }

/* Santraukos plyteles */
.ad-sant { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 14px; }
.ad-plyt { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; }
.ad-plyt b { display: block; font: 700 22px/1 var(--font-mono); margin-bottom: 4px; }
.ad-plyt span { font: 500 9.5px/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); }
.ad-plyt.svarbu b { color: var(--accent-light); }

/* Isskleista eilute - viena celė per visa plotį */
.ad-detales { background: var(--bg-elevated); }
/* .chip gyvena ct-dizainas.css, kuris krauna VELIAU uz si <style>. Prie tos
   pacios specifikos jis nugalėtų, todel `.chip.ad-sena` - (0,2,0) vs (0,1,0). */
.chip.ad-sena { border-color: var(--warning-border); color: var(--warning); }
.ad-irankiai { display: flex; flex-wrap: wrap; gap: var(--s-2); align-items: center; margin: 12px 0 4px; }
.ad-irankiu-zinia { font: var(--fw-regular) 11.5px/1.5 var(--font-mono); color: var(--text-muted); }
.ad-pre { margin: 0; padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface); font: var(--fw-regular) 11.5px/1.6 var(--font-mono); color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; }
.ad-detales > td { padding: 14px 13px !important; }
.ad-pre { max-height: 260px; overflow: auto; padding: 10px 12px; border-radius: 8px; background: var(--bg-base); font: 400 11px/1.55 var(--font-mono); color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; margin: 8px 0 0; }
.ad-foto { max-width: 100%; max-height: 240px; border-radius: 8px; border: 1px solid var(--border); display: block; margin-top: 10px; }
.ad-kelias { font: 500 10.5px/1.6 var(--font-mono); color: var(--text-muted); }
.ad-turejo { font: 400 12.5px/1.5 var(--font); color: var(--text-secondary); border-left: 2px solid var(--accent-border); padding-left: 10px; margin: 8px 0; }
.ad-veiksmai { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
.ad-tr { cursor: pointer; }
'''

BODY = u'''
<div class="pg">
  <div class="pg-head"><h1>Administravimas</h1></div>
  <p class="pg-sub" id="ad-sub">Kraunama…</p>

  <div class="ad-tabs" id="ad-tabs" role="tablist">
    <button class="ct-tab active" data-t="klaidos" role="tab">Klaidos</button>
    <button class="ct-tab" data-t="matavimai" role="tab">Matavimai</button>
    <button class="ct-tab" data-t="vartotojai" role="tab">Vartotojai</button>
  </div>

  <div id="ad-turinys"></div>
</div>

<script>
(function () {
  'use strict';
  var BUSENOS = [
    { k: 'rasta',           t: 'Rasta' },
    { k: 'patvirtinta',     t: 'Patvirtinta' },
    { k: 'tvarkoma',        t: 'Tvarkoma' },
    { k: 'laukia-patikros', t: 'Laukia patikros' },
    { k: 'sutvarkyta',      t: 'Sutvarkyta' },
    { k: 'nepasitvirtino',  t: 'Nepasitvirtino' },
    { k: 'atideta',         t: 'Atidėta' }
  ];
  var KAT = {
    dizainas: 'Atrodo ne taip', negyvas: 'Nieko neįvyko', duomenys: 'Neteisingas skaičius',
    kreditai: 'Nusirašė kreditas', greitis: 'Užstringa', prisijungimas: 'Prisijungimas', kita: 'Kita'
  };
  var SVARBA = { blokuoja: 'Negaliu tęsti', trukdo: 'Trukdo', smulkme: 'Smulkmena' };

  var el = document.getElementById('ad-turinys');
  var sub = document.getElementById('ad-sub');
  var _rodyti = 'klaidos';
  var _visi = false;
  var _irasai = [];
  var _tekstas = /[?&]tekstas=1/.test(location.search);

  function zetonas() { try { return localStorage.getItem('ct_token') || ''; } catch (e) { return ''; } }
  function imti(kelias) {
    return fetch(kelias, { headers: { Authorization: 'Bearer ' + zetonas() } }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error('Reikia administratoriaus teisių');
      return r.json();
    });
  }
  function siusti(kelias, kunas, metodas) {
    return fetch(kelias, {
      method: metodas || 'POST',
      headers: { Authorization: 'Bearer ' + zetonas(), 'Content-Type': 'application/json' },
      body: kunas ? JSON.stringify(kunas) : undefined
    }).then(function (r) { return r.json(); });
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function laikas(ms) {
    if (!ms) return '—';
    var d = new Date(ms), p = function (x) { return String(x).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function ikona(v) { return '<i><svg class="ct-i"><use href="#' + v + '"></use></svg></i>'; }
  // 22b: tuscia nera klaida. Administravime ji daznai yra GERA naujiena.
  // is-good = nera ka taisyti, is-filtered = yra, bet ne siame vaizde, is-never = dar nieko nebuvo.
  function tuscia(rusis, antraste, tekstas, veiksmas) {
    var zenklas = { good: '\u2713', filtered: '\u2261', never: '\u00B7' }[rusis] || '\u00B7';
    return '<div class="ct-empty is-' + rusis + '"><i>' + zenklas + '</i>'
      + '<span class="ct-empty-t">' + esc(antraste) + '</span>'
      + '<span class="ct-empty-d">' + esc(tekstas) + '</span>'
      + (veiksmas || '') + '</div>';
  }

  // ── Klaidos ────────────────────────────────────────────────
  // 22 sk.: ta pati sistema, bet tankiau. Lentele, nes cia dirbama su 200 irasu,
  // ne su vienu automobiliu. Skubi eilute gauna LINIJA kaireje, ne raudona fona:
  // raudonas fonas 30 eiluciu sarase padaro visa ekrana signalu.
  var _isskleista = null;

  function busenosZenklas(b) {
    // Tie patys zinojimo lygiai, ne naujos spalvos.
    var lygis = (b === 'sutvarkyta' || b === 'nepasitvirtino') ? 'ct-k-confirmed'
      : (b === 'tvarkoma' || b === 'patvirtinta' || b === 'laukia-patikros') ? 'ct-k-signal'
      : 'ct-k-unknown';
    var t = (BUSENOS.filter(function (x) { return x.k === b; })[0] || {}).t || b;
    return '<span class="ct-k ' + lygis + '"><i></i>' + esc(t) + '</span>';
  }

  // v1.57.0: visas sarasas PLOKSCIU TEKSTU. Kam: taisytojas puslapio nemato taip,
  // kaip zmogus - jam reikia visko is karto, vienoje vietoje, be spaudymo. Adresu
  // ?tekstas=1 puslapis atsidaro tiesiai si rezimu.
  function tekstoIsklotine(d) {
    var NL = String.fromCharCode(10);
    var e = [];
    e.push('CARTRIIGE KLAIDOS  ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
    e.push('Is viso ' + d.viso + ' | atviru ' + d.atviru + ' | laukia jusu ' + d.lauksiaJusu);
    e.push('Pagal busena: ' + JSON.stringify(d.pagalBusena || {}));
    e.push('');
    d.irasai.forEach(function (k) {
      e.push('================================================================');
      e.push(tekstasVieno(k));
    });
    return e.join(NL);
  }

  // Vienas irasas tekstu - naudoja ir isklotine, ir mygtukas „Kopijuoti".
  function tekstasVieno(k) {
    var NL = String.fromCharCode(10);
    var e = [];
    (function () {
      var g = k.diagnostika || {}, ek = g.ekranas || {};
      e.push('#' + k.nr + '  ' + k.busena + '  svarba=' + k.svarba + '  kategorija=' + k.kategorija
        + (k.kartojasi ? '  KARTOJASI' : '') + (k.foto ? '  [NUOTRAUKA]' : '')
        + (k.persiustas ? '  [PERSIUSTAS IS EILES - laikas yra GAVIMO, ne ivykio]' : '')
        + (k.fotoNumesta ? '  [NUOTRAUKA NETILPO]' : ''));
      e.push(new Date(k.laikas).toISOString().slice(0, 16).replace('T', ' ') + '  ' + (k.kas || 'neprisijunges'));
      e.push('');
      e.push('TEKSTAS: ' + k.tekstas);
      if (k.turejoRodyti) e.push('TUREJO RODYTI: ' + k.turejoRodyti);
      e.push('');
      var dbr = dabartineVersija();
      var senesne = g.versija && dbr && versijaSkaicium(g.versija) < versijaSkaicium(dbr);
      e.push('PUSLAPIS: ' + (g.puslapis || '?') + '  v' + (g.versija || '?')
        + (senesne ? '  [PRANESTA v' + g.versija + ', DABAR v' + dbr + ' - galejo buti istaisyta]' : '')
        + '  ' + (ek.plotis || '?') + 'x' + (ek.aukstis || '?') + '@' + (ek.tankis || '?')
        + '  planas=' + ((g.planas || {}).planas || '?')
        + '  kreditai=' + ((g.planas || {}).kreditai == null ? '?' : g.planas.kreditai)
        + (g.nuoIkelimo != null ? '  po ' + Math.round(g.nuoIkelimo / 1000) + ' s nuo ikelimo' : '')
        + (g.tinklas ? '  tinklas=' + g.tinklas : ''));
      if (g.adresas) e.push('ADRESAS: ' + g.adresas);
      if (g.narsykle) e.push('NARSYKLE: ' + g.narsykle);
      if (g.saugyklosRaktai) e.push('SAUGYKLOS RAKTAI: ' + g.saugyklosRaktai.join(', '));
      if ((g.veiksmai || []).length) {
        e.push('');
        e.push('PASPAUDIMAI (paskutinis apacioje):');
        g.veiksmai.forEach(function (v) { e.push('   ' + (v.tekstas || '') + '   ' + (v.elementas || '')); });
      }
      if ((g.klaidos || []).length) {
        e.push('');
        e.push('JS KLAIDOS:');
        g.klaidos.forEach(function (x) {
          e.push('   ' + x.zinute + (x.failas ? '   (' + x.failas + ':' + x.eilute + ')' : ''));
          if (x.stekas) e.push('     ' + String(x.stekas).split(String.fromCharCode(10)).slice(0, 3).join(' | '));
        });
      }
      if ((g.uzklausos || []).length) {
        e.push('');
        e.push('NEPAVYKUSIOS UZKLAUSOS:');
        g.uzklausos.forEach(function (x) { e.push('   ' + x.kodas + '  ' + (x.tipas || '') + '  ' + x.adresas); });
      }
      if ((k.istorija || []).length) {
        e.push('');
        e.push('KELIAS: ' + k.istorija.map(function (x) { return x.busena; }).join(' -> '));
      }
      if (k.foto) e.push('NUOTRAUKA: /admin/klaidos/' + k.nr + '/foto');
    })();
    return e.join(NL);
  }

  window.adTekstas = function (v) {
    _tekstas = v;
    piestiKlaidas();
  };

  function piestiKlaidas() {
    el.innerHTML = '<div class="ct-empty is-never"><i>\u00B7</i><span class="ct-empty-t">Kraunama\u2026</span></div>';
    imti('/admin/klaidos' + (_visi ? '?visi=1' : '')).then(function (d) {
      _irasai = d.irasai || [];
      sub.textContent = 'I\u0161 viso ' + d.viso + ' \u00B7 atvir\u0173 ' + d.atviru + ' \u00B7 laukia j\u016Bs\u0173 ' + d.lauksiaJusu;
      var h = '<div class="ad-sant">'
        + '<div class="ad-plyt' + (d.lauksiaJusu ? ' svarbu' : '') + '"><b>' + d.lauksiaJusu + '</b><span>laukia j\u016Bs\u0173 patikros</span></div>'
        + '<div class="ad-plyt"><b>' + d.atviru + '</b><span>atvir\u0173</span></div>'
        + '<div class="ad-plyt"><b>' + d.viso + '</b><span>i\u0161 viso</span></div>'
        + '</div>'
        + '<div class="ct-flags" style="margin-bottom:14px">'
        +   '<button type="button" class="ct-flag" role="radio" aria-checked="' + (!_visi) + '" onclick="adVisi(false)">Tik atviros</button>'
        +   '<button type="button" class="ct-flag" role="radio" aria-checked="' + (!!_visi) + '" onclick="adVisi(true)">Visos</button>'
        + '</div>'
        + '<div class="ct-flags" style="margin-bottom:14px">'
        +   '<button type="button" class="ct-flag" role="radio" aria-checked="' + (!_tekstas) + '" onclick="adTekstas(false)">Lentel\u0117</button>'
        +   '<button type="button" class="ct-flag" role="radio" aria-checked="' + (!!_tekstas) + '" onclick="adTekstas(true)">Viskas tekstu</button>'
        + '</div>';

      if (_tekstas) {
        el.innerHTML = h + '<pre id="ad-tekstas" class="ad-pre"></pre>';
        document.getElementById('ad-tekstas').textContent = tekstoIsklotine(d);
        return;
      }

      if (!d.irasai.length) {
        el.innerHTML = h + (d.viso === 0
          ? tuscia('never', 'Prane\u0161im\u0173 dar n\u0117ra', 'Kai kas nors paspaus mygtuk\u0105 \u201EKlaida", prane\u0161imas atsiras \u010Dia.')
          : _visi
            ? tuscia('good', 'Tu\u0161\u010Dia', 'Nieko n\u0117ra rodyti.')
            : tuscia('good', 'Nauj\u0173 klaid\u0173 n\u0117ra',
                'Visi ' + d.viso + ' prane\u0161imai u\u017Edaryti \u2013 sutvarkyti arba nepasitvirtino.',
                '<div class="ct-empty-n"><button type="button" class="ct-btn ct-btn-sm" onclick="adVisi(true)"><span>Rodyti visas</span></button></div>'));
        return;
      }

      h += '<div class="ct-table-w"><table class="ct-table is-dense"><thead><tr>'
        + '<th class="is-num">NR.</th><th>KATEGORIJA</th><th>KLAIDA</th>'
        + '<th class="is-time">KADA</th><th>VERSIJA</th><th>B\u016aSENA</th><th class="is-act"></th>'
        + '</tr></thead><tbody>'
        + d.irasai.map(eilute).join('')
        + '</tbody></table></div>';
      el.innerHTML = h;
      uzkrautiFoto();
    }).catch(function (e) {
      el.innerHTML = tuscia('never', 'Nepavyko \u012Fkelti', e.message);
      sub.textContent = '';
    });
  }

  function eilute(k) {
    var skubu = k.svarba === 'blokuoja';
    var uzdaryta = k.busena === 'sutvarkyta' || k.busena === 'nepasitvirtino';
    var dg = k.diagnostika || {};
    var eil = '<tr class="ad-tr' + (skubu ? ' is-urgent' : '') + (uzdaryta ? ' is-done' : '') + '" onclick="adIsskleisti(' + k.nr + ')">'
      + '<td class="is-num">' + k.nr + '</td>'
      + '<td>' + esc(KAT[k.kategorija] || k.kategorija || '\u2014')
      +   (k.kartojasi ? ' <span class="chip">kartojasi</span>' : '') + '</td>'
      + '<td class="is-text"><span class="ct-clamp">' + esc(k.tekstas) + '</span></td>'
      + '<td class="is-time">' + laikas(k.laikas) + '</td>'
      + '<td class="is-time">' + versijosZyme(k) + '</td>'
      + '<td>' + busenosZenklas(k.busena) + '</td>'
      + '<td class="is-act">'
      +   '<button class="ct-btn ct-btn-quiet ct-btn-icon ct-btn-sm is-destructive" title="I\u0161trinti visi\u0161kai"'
      +     ' aria-label="I\u0161trinti prane\u0161im\u0105" onclick="event.stopPropagation();adTrinti(' + k.nr + ')">' + ikona('i-pasalinti') + '</button>'
      + '</td></tr>';
    if (_isskleista !== k.nr) return eil;

    var ek = dg.ekranas || {};
    return eil + '<tr class="ad-detales"><td colspan="7">'
      + '<div class="ad-meta ad-kelias">' + esc(k.kas || 'neprisijung\u0119s')
      +   (dg.puslapis ? ' \u00B7 ' + esc(dg.puslapis) : '')
      +   (dg.versija ? ' \u00B7 v' + esc(dg.versija) : '')
      +   (ek.plotis ? ' \u00B7 ' + ek.plotis + ' px' : '')
      +   ' \u00B7 ' + esc(SVARBA[k.svarba] || k.svarba || '') + '</div>'
      + (k.turejoRodyti ? '<div class="ad-turejo"><b>Tur\u0117jo rodyti:</b> ' + esc(k.turejoRodyti) + '</div>' : '')
      + (k.istorija && k.istorija.length > 1
          ? '<div class="ad-kelias">' + k.istorija.map(function (x) { return esc(x.busena); }).join(' \u2192 ') + '</div>' : '')
      + (k.foto ? '<img class="ad-foto" data-foto="' + k.nr + '" alt="" style="cursor:zoom-in">' : '')
      + ((dg.veiksmai || []).length
          ? '<details open><summary>K\u0105 spaud\u0117 prie\u0161 tai (' + dg.veiksmai.length + ')</summary><pre class="ad-pre">'
            + dg.veiksmai.map(function (v) { return esc((v.tekstas || '\u2014') + '   ' + (v.elementas || '')); }).join(String.fromCharCode(10))
            + '</pre></details>' : '')
      + '<details><summary>Visa diagnostika</summary><pre class="ad-pre">' + esc(JSON.stringify(dg, null, 1)) + '</pre></details>'
      + '<div class="ad-irankiai">'
      +   (dg.adresas
            ? '<button type="button" class="ct-btn ct-btn-sm" onclick="event.stopPropagation();adAtkurti(' + k.nr + ')">'
              + '<span>Atkurti ' + (ek.plotis ? ek.plotis + '\u00D7' + (ek.aukstis || '?') : '') + '</span></button>'
            : '')
      +   ((dg.uzklausos || []).length
            ? '<button type="button" class="ct-btn ct-btn-sm" onclick="event.stopPropagation();adTikrinti(' + k.nr + ')">'
              + '<span>Patikrinti u\u017Eklausas (' + dg.uzklausos.length + ')</span></button>'
            : '')
      +   '<button type="button" class="ct-btn ct-btn-sm" onclick="event.stopPropagation();adKopijuoti(' + k.nr + ')">'
      +     '<span>Kopijuoti</span></button>'
      +   '<span class="ad-irankiu-zinia" id="ad-iz-' + k.nr + '"></span>'
      + '</div>'
      + '<div class="ad-veiksmai">'
      +   BUSENOS.map(function (b) {
            return '<button type="button" class="ct-flag" role="radio" aria-checked="' + (b.k === k.busena)
              + '" onclick="event.stopPropagation();adBusena(' + k.nr + ', &quot;' + b.k + '&quot;)">' + b.t + '</button>';
          }).join('')
      + '</div></td></tr>';
  }

  // v1.65.0: prie kiekvieno pranesimo - versija, KURIOJE jis parasytas, ir ar ji
  // senesne uz dabartine. Pranesimas is v1.60.0, kai jau v1.65.0, gali buti jau
  // istaisytas - tai matyti is karto, o ne po atkurimo bandymo.
  function dabartineVersija() {
    try { return (window.CT_VERSIJOS && window.CT_VERSIJOS[0] && window.CT_VERSIJOS[0].versija) || null; }
    catch (e) { return null; }
  }
  function versijaSkaicium(v) {
    return String(v || '').split('.').map(function (x) { return parseInt(x, 10) || 0; })
      .reduce(function (a, x) { return a * 1000 + x; }, 0);
  }
  function versijosZyme(k) {
    var v = ((k.diagnostika || {}).versija) || null;
    if (!v) return '<span class="ad-meta">?</span>';
    var dbr = dabartineVersija();
    var sena = dbr && versijaSkaicium(v) < versijaSkaicium(dbr);
    return '<span class="chip' + (sena ? ' ad-sena' : '') + '">v' + esc(v)
      + (sena ? ' \u2192 v' + esc(dbr) : '') + '</span>';
  }

  function pagalNr(nr) { return (_irasai || []).filter(function (x) { return x.nr === nr; })[0]; }
  function zinia(nr, t) { var e = document.getElementById('ad-iz-' + nr); if (e) e.textContent = t; }

  // „Atkurti" — atidaro TA PATI adresa TOKIO PAT dydzio lange. Butent sito
  // truko: du siandienos dizaino pranesimai buvo apie plocius (3152 ir 385 px),
  // ir abu teko atkurti rankomis, spejant dydi.
  window.adAtkurti = function (nr) {
    var k = pagalNr(nr); if (!k) return;
    var g = k.diagnostika || {}, ek = g.ekranas || {};
    if (!g.adresas) return zinia(nr, 'Adreso pranesime nera.');
    var sav = ek.plotis ? 'width=' + Math.min(ek.plotis, screen.availWidth) + ',height=' + Math.min(ek.aukstis || 900, screen.availHeight) : '';
    window.open(g.adresas, '_blank', sav);
    zinia(nr, 'Atidaryta' + (sav ? ' ' + ek.plotis + '×' + ek.aukstis + ' px lange.' : '.'));
  };

  // Mokami marsrutai NIEKADA nekvieciami automatiskai - mygtukas, kviecianti
  // juos kas paspaudima, tyliai pravalgytu kreditus. Rodom su kaina, be kvietimo.
  var MOKAMI = /\/api\/(analyze-single|compare-deep|vin-lookup|seller-lookup|history-counts)/;

  window.adTikrinti = function (nr) {
    var k = pagalNr(nr); if (!k) return;
    var u = ((k.diagnostika || {}).uzklausos) || [];
    if (!u.length) return zinia(nr, 'Uzklausu pranesime nera.');
    zinia(nr, 'Tikrinama…');
    var eil = [], liko = u.length;
    u.forEach(function (x, i) {
      var buvo = x.kodas == null ? 'tinklas' : x.kodas;
      if (MOKAMI.test(x.adresas)) {
        eil[i] = x.adresas + '   buvo ' + buvo + '   — MOKAMAS, nekviesta';
        if (!--liko) baigti();
        return;
      }
      if (x.metodas && x.metodas.toUpperCase() !== 'GET') {
        eil[i] = x.adresas + '   buvo ' + buvo + '   — ' + x.metodas + ', nekartojama';
        if (!--liko) baigti();
        return;
      }
      var antr = {};
      try { var z = localStorage.getItem('ct_token'); if (z) antr.Authorization = 'Bearer ' + z; } catch (e) {}
      fetch(x.adresas, { headers: antr })
        .then(function (r) { eil[i] = x.adresas + '   buvo ' + buvo + '   dabar ' + r.status + (r.ok ? '  VEIKIA' : ''); })
        .catch(function () { eil[i] = x.adresas + '   buvo ' + buvo + '   dabar: nepavyko prisijungti'; })
        .then(function () { if (!--liko) baigti(); });
    });
    function baigti() {
      var el = document.getElementById('ad-tikr-' + nr);
      if (!el) {
        el = document.createElement('pre');
        el.className = 'ad-pre'; el.id = 'ad-tikr-' + nr;
        el.style.marginTop = '10px';
        var t = document.getElementById('ad-iz-' + nr);
        if (t && t.parentNode) t.parentNode.appendChild(el);
      }
      el.textContent = eil.join(String.fromCharCode(10));
      zinia(nr, '');
    }
  };

  window.adKopijuoti = function (nr) {
    var k = pagalNr(nr); if (!k) return;
    var t = tekstasVieno(k);
    var gerai = function () { zinia(nr, 'Nukopijuota.'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(gerai, function () { zinia(nr, 'Nepavyko — pasirinkite ranka.'); });
        return;
      }
    } catch (e) {}
    zinia(nr, 'Naršyklė neleidžia kopijuoti — naudokite „Viskas tekstu".');
  };

  // Nuotraukos negalima paduoti per <img src> - marsrutas reikalauja antrastes,
  // o <img> jos nesiuncia (patikrinta produkcijoje: 401). Todel paimam su
  // antraste ir paduodam kaip blob. Rakto i adresa nededam niekada.
  var _fotoUrl = {};
  function uzkrautiFoto() {
    document.querySelectorAll('img.ad-foto[data-foto]').forEach(function (img) {
      var nr = img.getAttribute('data-foto');
      if (_fotoUrl[nr]) { img.src = _fotoUrl[nr]; pridetiDidinima(img, nr); return; }
      var antr = {};
      try { var z = localStorage.getItem('ct_token'); if (z) antr.Authorization = 'Bearer ' + z; } catch (e) {}
      fetch('/admin/klaidos/' + nr + '/foto', { headers: antr })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (b) { _fotoUrl[nr] = URL.createObjectURL(b); img.src = _fotoUrl[nr]; pridetiDidinima(img, nr); })
        .catch(function (e) { img.replaceWith(Object.assign(document.createElement('div'),
          { className: 'ad-meta', textContent: 'Nuotraukos nepavyko uzkrauti (' + e.message + ')' })); });
    });
  }
  function pridetiDidinima(img, nr) {
    img.onclick = function (e) { e.stopPropagation(); window.open(_fotoUrl[nr], '_blank'); };
    img.title = 'Paspauskite, kad atidarytumete atskirame lange';
  }

  window.adIsskleisti = function (nr) { _isskleista = (_isskleista === nr ? null : nr); piestiKlaidas(); };
  window.adVisi = function (v) { _visi = v; _isskleista = null; piestiKlaidas(); };
  window.adBusena = function (nr, b) {
    var v = null;
    try { v = (window.CT_VERSIJOS && window.CT_VERSIJOS[0] && window.CT_VERSIJOS[0].versija) || null; } catch (e) {}
    siusti('/admin/klaidos/' + nr + '/busena', { busena: b, versija: v }).then(piestiKlaidas);
  };
  window.adTrinti = function (nr) {
    if (!window.confirm('I\u0161trinti prane\u0161im\u0105 Nr. ' + nr + ' visi\u0161kai? \u0160ito at\u0161aukti nebus galima.')) return;
    siusti('/admin/klaidos/' + nr, null, 'DELETE').then(piestiKlaidas);
  };

  // ── Matavimai ──────────────────────────────────────────────
  function lentele(pav, o) {
    var r = Object.keys(o).map(function (k) {
      return '<tr><td>' + esc(k) + '</td><td class="is-num">' + o[k] + '</td></tr>';
    }).join('');
    return '<h2 style="font:600 13px var(--font);margin:18px 0 8px">' + esc(pav) + '</h2>'
      + '<div class="ct-table-w"><table class="ct-table is-dense"><tbody>' + r + '</tbody></table></div>';
  }

  function piestiMatavimus() {
    el.innerHTML = '';
    imti('/admin/atsarga').then(function (d) {
      sub.textContent = 'Nuo paleidimo ' + d.nuoPaleidimoVal + ' val.';
      var p = d.puppeteer || {};
      el.innerHTML = '<div class="ad-sant">'
        + '<div class="ad-plyt"><b>' + (p.pasiektas || 0) + '</b><span>puppeteer pasiektas</span></div>'
        + '<div class="ad-plyt"><b>' + (p.pavyko || 0) + '</b><span>pavyko</span></div>'
        + '<div class="ad-plyt"><b>' + (p.nepavyko || 0) + '</b><span>nepavyko</span></div>'
        + '</div>'
        + '<div class="ct-table-w" style="padding:14px 16px;font:400 13.5px/1.55 var(--font)">' + esc(d.isvada) + '</div>'
        + lentele('Paie\u0161kos puslapiai', d.paieskosPuslapiai || {})
        + lentele('Skelbim\u0173 puslapiai', d.skelbimuPuslapiai || {})
        + (Object.keys(p.klaidos || {}).length ? lentele('Puppeteer klaidos', p.klaidos) : '');
    }).catch(function (e) { el.innerHTML = tuscia('never', 'Nepavyko \u012Fkelti', e.message); sub.textContent = ''; });
  }

  // ── Vartotojai ─────────────────────────────────────────
  function piestiVartotojus() {
    el.innerHTML = '';
    imti('/admin/vartotojai').then(function (d) {
      var v = d.vartotojai || [];
      sub.textContent = 'I\u0161 viso ' + v.length + ' vartotoj\u0173';
      if (!v.length) {
        el.innerHTML = tuscia('never', 'Vartotoj\u0173 n\u0117ra', 'Dar niekas neu\u017Esiregistravo.');
        return;
      }
      el.innerHTML = '<div class="ct-table-w"><table class="ct-table is-dense"><thead><tr>'
        + '<th>EL. PA\u0160TAS</th><th>PLANAS</th><th class="is-num">KREDITAI</th>'
        + '<th class="is-num">PAIE\u0160K\u0172</th><th class="is-time">NUO</th>'
        + '</tr></thead><tbody>'
        + v.map(function (u) {
            return '<tr><td class="is-id">' + esc(u.email || '\u2014') + '</td>'
              + '<td><span class="chip">' + esc(u.planas || 'trial') + '</span></td>'
              + '<td class="is-num">' + ((u.kreditai_plano || 0) + (u.kreditai_pirkti || 0)) + '</td>'
              + '<td class="is-num">' + (u.paieskos_viso != null ? u.paieskos_viso : '\u2014') + '</td>'
              + '<td class="is-time">' + (u.sukurta ? laikas(u.sukurta) : '\u2014') + '</td></tr>';
          }).join('')
        + '</tbody></table></div>';
    }).catch(function (e) { el.innerHTML = tuscia('never', 'Nepavyko \u012Fkelti', e.message); sub.textContent = ''; });
  }

  document.getElementById('ad-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.ct-tab'); if (!b) return;
    [].forEach.call(this.children, function (x) { x.classList.toggle('active', x === b); });
    _rodyti = b.dataset.t;
    if (_rodyti === 'klaidos') piestiKlaidas();
    else if (_rodyti === 'matavimai') piestiMatavimus();
    else piestiVartotojus();
  });

  if (!zetonas()) {
    el.innerHTML = tuscia('never', 'Reikia prisijungti', 'Šis puslapis skirtas administratoriui.');
    sub.textContent = '';
  } else {
    piestiKlaidas();
  }
})();
</script>
'''

out = (u'<!DOCTYPE html>\n<html lang="lt">\n<head>\n<meta charset="UTF-8">\n'
       u'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
       u'<title>Administravimas — CarTriige</title>\n'
       u'<link rel="preconnect" href="https://fonts.googleapis.com">\n'
       u'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
       u'<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
       u'<link rel="stylesheet" href="ct-bendras.css">\n<style>' + STILIUS + u'</style>\n</head>\n<body>\n'
       + sprite + u'\n\n<script src="klaidu-pranesimas.js"></script>\n\n'
       + antraste + u'\n' + BODY + u'\n'
       + u'<link rel="stylesheet" href="ct-dizainas.css">\n<link rel="stylesheet" href="ct-priedai.css">\n<link rel="stylesheet" href="ct-mygtukai.css">\n'
       + u'<script src="ct-bendras.js"></script>\n<script src="versijos.js"></script>\n'
         u'<script src="megstami-meniu.js"></script>\n<script src="paskyra-meniu.js"></script>\n'
       + u'</body>\n</html>\n')

io.open('admin.html', 'w', encoding='utf-8').write(out)
print('admin.html sukurtas:', len(out), 'simboliu')
