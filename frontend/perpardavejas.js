/* perpardavejas.js — tankios lentelės rodinys (66 + 68 paketai).
 *
 * KODĖL REŽIMAS, O NE ATSKIRAS PUSLAPIS (atsakymas į PERPARDAVEJO-APLINKA §5):
 * `index.html` yra 7 600 eilučių su filtrais, paieška, sesija ir pranešimais.
 * Atskiras puslapis reikštų visa tai dublikuoti, o du vienodi puslapiai
 * neišvengiamai išsiskiria. Todėl lentelė yra tos pačios paieškos KITAS
 * RODINYS: tie patys duomenys, kitas piešimas.
 *
 * Įsijungia per `window.renderCandidateCards` – tą patį kabliuką, kurį jau
 * naudoja kitos rodinio pataisos.
 */
(function () {
  'use strict';

  var LS = 'ct_perp_rodinys';
  var LS_MARZA = 'ct_perp_marza';
  var busena = { rodinys: 'korteles', marza: 0.10, bukle: 'visi', rikiavimas: 'pelnas', kryptis: 'desc', pazymeti: {} };

  try {
    var r = localStorage.getItem(LS); if (r) busena.rodinys = r;
    var m = parseFloat(localStorage.getItem(LS_MARZA)); if (m > 0) busena.marza = m;
  } catch (e) { /* privatus langas – lieka numatytosios */ }

  // ── Pagalbinės ────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function eur(v) {
    if (v == null || !isFinite(v)) return '—';
    return Math.round(v).toLocaleString('lt-LT').replace(/,/g, ' ') + ' €';
  }
  function km(v) { return v == null ? '—' : Math.round(v).toLocaleString('lt-LT').replace(/,/g, ' ') + ' km'; }

  // MAX perskaičiuojamas naršyklėje: serveris atsiuntė `pardavimas`, `kastai`
  // ir `tarsa`, o formulėje skelbimo kainos nėra – tad maržos jungiklis veikia
  // be jokio naujo užklausimo ir be kreditų.
  function maxPrieMarzos(c, marza) {
    var mp = c.maxPirkimo;
    if (!mp || !mp.pardavimas) return null;
    var max = Math.round(mp.pardavimas / (1 + marza) - (mp.kastai || 0) - (mp.tarsa || 0));
    return max > 0 ? max : null;
  }
  function pelnasPrie(c) {
    return (c.pelnoMath && isFinite(c.pelnoMath.pelnas)) ? c.pelnoMath : null;
  }

  // Likvidumas – Regitros apyvarta. Ribos NE iš lubų: jos jau nustatytos
  // `backend/regitra.js` RIBOS pagal imties kvartilius (P25 12,9 %, P75 26,4 %).
  function likvidumas(c) {
    var a = c.regitra && isFinite(c.regitra.apyv_pct) ? c.regitra.apyv_pct : null;
    if (a == null) return { lygis: null, zodis: 'nėra duomenų', apyv: null };
    if (a >= 26) return { lygis: 3, zodis: 'greitas', apyv: a };
    if (a <= 13) return { lygis: 1, zodis: 'lėtas', apyv: a };
    return { lygis: 2, zodis: 'vidutinis', apyv: a };
  }

  // Būklė. mobile.de / otomoto / autoscout24 turi struktūrinį žalos lauką;
  // autoplius ir autogidas – tik tekstą, todėl ten tai SPĖJIMAS, ir rodinys
  // tai pasako atskira žyma (dizainerio 52 sk.: tvirta vs punktyras).
  var STRUKTURINIAI = { mobilede: 1, otomoto: 1, autoscout24: 1 };
  function bukle(c) {
    var def = (c.galimiDefektai || []).length > 0;
    var zala = !!c.itariamaZala;
    if (!def && !zala) return null;
    var strukt = !!STRUKTURINIAI[c.source] && def;
    return strukt
      ? { reiksme: 'dauztas', saltinis: 'portalas', tekstas: 'Daužtas' }
      : { reiksme: 'dauztas', saltinis: 'aprasymas', tekstas: '~ daužtas?' };
  }

  function telpaBuklei(c) {
    if (busena.bukle === 'visi') return true;
    var b = bukle(c);
    return busena.bukle === 'dauzti' ? !!b : !b;
  }

  // ── Juosta ────────────────────────────────────────────────────────────────
  function seg(etikete, reiksmes, dabar, atgal) {
    var h = '<span class="ct-dt-seg-l">' + esc(etikete) + '</span><div class="ct-seg" role="radiogroup" aria-label="' + esc(etikete) + '">';
    reiksmes.forEach(function (r) {
      h += '<button type="button" role="radio" aria-checked="' + (r.v === dabar ? 'true' : 'false')
        + '" data-v="' + esc(r.v) + '">' + esc(r.t) + '</button>';
    });
    return h + '</div>';
  }

  function juosta(kiek) {
    return '<div class="ct-dt-bar">'
      + seg('Būklė', [{ v: 'tvarkingi', t: 'Tik tvarkingi' }, { v: 'dauzti', t: 'Daužti / su defektais' }, { v: 'visi', t: 'Visi' }], busena.bukle)
      + seg('Marža', [{ v: '0.1', t: '10 %' }, { v: '0.15', t: '15 %' }, { v: '0.2', t: '20 %' }], String(busena.marza))
      + '<span class="ct-bukle-legend"><span class="ct-bukle is-portal">Daužtas</span> pažymėta portale'
      + '<span class="ct-bukle is-guess">~ daužtas?</span> spėjama iš aprašymo</span>'
      + '<span class="ct-dt-count">' + kiek + ' skelb.</span>'
      + '</div>';
  }

  // ── Eilutė ────────────────────────────────────────────────────────────────
  var STULPELIAI = '44px minmax(260px,1fr) 136px 158px 92px 58px 112px 70px';

  function antraste() {
    function b(kl, t, po, rikis) {
      return '<button class="' + kl + '" data-sort="' + rikis + '" aria-sort="'
        + (busena.rikiavimas === rikis ? (busena.kryptis === 'desc' ? 'descending' : 'ascending') : 'none')
        + '">' + t + '<small>' + po + '</small></button>';
    }
    return '<div class="ct-dtable-h">'
      + '<span class="ct-dt-sel"></span>'
      + '<span>Automobilis<small>rizika · rida · vieta</small></span>'
      + b('is-key is-num', 'Max pirkimo', 'marža ' + Math.round(busena.marza * 100) + ' %', 'max')
      + b('is-num', '≈ Lietuvoje', 'kaštai + tarša', 'kainaLt')
      + b('is-num', 'Pelnas', 'po kaštų', 'pelnas')
      + b('is-num', 'ROI', '%', 'roi')
      + '<span>Likvidumas<small>Regitra</small></span>'
      + b('is-num', 'Kabo', 'dienų', 'kabo')
      + '</div>';
  }

  function eilute(c, i) {
    var max = maxPrieMarzos(c, busena.marza);
    var mp = c.maxPirkimo || {};
    var riba = !!mp.riba;
    var pl = pelnasPrie(c);
    var lk = likvidumas(c);
    var bk = bukle(c);
    var der = (max != null && isFinite(c.kaina)) ? (max - c.kaina) : null;
    var klt = c.kainaLt;
    var pazymeta = !!busena.pazymeti[c.url];

    var maxVidus = max == null
      ? '<b class="ct-dt-unk">— — —</b><small>laukia rinkos</small>'
      : '<b>' + (riba ? '<i>iki</i> ' : '') + eur(max) + '</b>'
        + (der == null ? '' : '<small class="' + (der >= 0 ? 'is-ok' : 'is-deal') + '">'
          + (der >= 0 ? 'telpa · +' + Math.round(der) : 'derėtis −' + Math.abs(Math.round(der))) + '</small>');

    var ltVidus = klt
      ? '<b>≈ ' + eur(klt.viso) + '</b><small>' + Math.round(klt.kaina) + ' + ' + klt.kastai.viso
        + (klt.tarsa.tikslumas === 'nezinoma'
          ? ' + <span class="ct-dt-unk">tarša ?</span>'
          : (klt.tarsa.vidurkis > 0 ? ' + ~' + klt.tarsa.vidurkis : ' + 0 tarša')) + '</small>'
      : '<b>' + eur(c.kaina) + '</b><small>Lietuvoje</small>';

    var pav = esc(c.pavadinimas || c.modelis || '—');
    var meta = [c.metai, km(c.rida),
      (c.ridaDiffPct != null ? (c.ridaDiffPct > 0 ? '+' : '') + c.ridaDiffPct + ' % ridos' : null),
      (c.miestas || c.vieta || null)].filter(Boolean).join(' · ');

    return '<div class="ct-dtable-r" data-url="' + esc(c.url) + '" aria-selected="' + (pazymeta ? 'true' : 'false') + '">'
      + '<span class="ct-dt-sel"><input type="checkbox" aria-label="Žymėti"' + (pazymeta ? ' checked' : '') + '></span>'
      + '<a class="ct-dt-car" href="' + esc(c.url) + '" target="_blank" rel="noopener">'
      + (c.photo ? '<img src="' + esc(c.photo) + '" alt="" loading="lazy">' : '<span class="ct-dt-ph"></span>')
      + '<span class="ct-dt-car-t"><span>' + pav + '</span>'
      + '<span class="ct-dt-meta">'
      + (bk ? '<span class="ct-bukle ' + (bk.saltinis === 'portalas' ? 'is-portal' : 'is-guess') + '">' + esc(bk.tekstas) + '</span>' : '')
      + '<span>' + esc(meta) + '</span></span></span></a>'
      + '<span class="is-key is-num' + (riba ? ' is-cap' : '') + '" data-k="max pirkimo">' + maxVidus + '</span>'
      + '<span class="is-num" data-k="≈ lietuvoje">' + ltVidus + '</span>'
      + '<span class="is-num" data-k="pelnas">' + (pl ? '<b>' + (pl.pelnas >= 0 ? '+' : '') + eur(pl.pelnas) + '</b>' : '<b>—</b>') + '</span>'
      + '<span class="is-num" data-m="hide"><b>' + (pl ? pl.roi + ' %' : '—') + '</b></span>'
      + '<span data-m="hide"><span class="ct-dt-liq"' + (lk.lygis ? ' data-l="' + lk.lygis + '"' : '')
      + '><i></i><i></i><i></i></span><span>' + esc(lk.zodis) + (lk.apyv ? ' ' + lk.apyv + ' %' : '') + '</span></span>'
      + '<span class="is-num' + (c.dienosRinkoje >= 45 ? ' is-lever' : '') + '" data-m="hide"><b>'
      + (c.dienosRinkoje != null ? c.dienosRinkoje : '—') + '</b>'
      + (c.dienosRinkoje >= 45 ? '<small>svertas</small>' : '') + '</span>'
      + '</div>';
  }

  // ── Rikiavimas ────────────────────────────────────────────────────────────
  function reiksme(c, raktas) {
    switch (raktas) {
      case 'max': return maxPrieMarzos(c, busena.marza);
      case 'kainaLt': return c.kainaLt ? c.kainaLt.viso : c.kaina;
      case 'pelnas': return c.pelnoMath ? c.pelnoMath.pelnas : null;
      case 'roi': return c.pelnoMath ? c.pelnoMath.roi : null;
      case 'kabo': return c.dienosRinkoje;
      default: return null;
    }
  }
  function rikiuoti(sar) {
    var k = busena.rikiavimas, zb = busena.kryptis === 'desc' ? -1 : 1;
    return sar.slice().sort(function (a, b) {
      var x = reiksme(a, k), y = reiksme(b, k);
      if (x == null && y == null) return 0;
      if (x == null) return 1;          // tušti visada apačioje, abiem kryptim
      if (y == null) return -1;
      return (x - y) * zb;
    });
  }

  // ── Piešimas ──────────────────────────────────────────────────────────────
  function piesti(sarasas, kur) {
    var matomi = rikiuoti(sarasas.filter(telpaBuklei));
    var h = juosta(matomi.length);
    if (!matomi.length) {
      h += '<div class="ct-state"><div class="ct-state-ic">∅</div><h3>Pagal šiuos filtrus progų nėra</h3>'
        + '<p>Iš ' + sarasas.length + ' rastų skelbimų nė vienas neatitinka būklės filtro.</p></div>';
      kur.innerHTML = h;
      prijungti(kur, sarasas);
      return;
    }
    h += '<div class="ct-dtable-wrap"><div class="ct-dtable" style="--cols: ' + STULPELIAI + '">'
      + antraste() + matomi.map(eilute).join('') + '</div></div>';
    kur.innerHTML = h;
    prijungti(kur, sarasas);
  }

  function prijungti(kur, sarasas) {
    kur.querySelectorAll('.ct-seg').forEach(function (s) {
      s.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-v]'); if (!b) return;
        var v = b.getAttribute('data-v');
        if (s.getAttribute('aria-label') === 'Marža') {
          busena.marza = parseFloat(v);
          try { localStorage.setItem(LS_MARZA, v); } catch (err) {}
        } else { busena.bukle = v; }
        piesti(sarasas, kur);
      });
    });
    kur.querySelectorAll('.ct-dtable-h [data-sort]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (busena.rikiavimas === k) busena.kryptis = busena.kryptis === 'desc' ? 'asc' : 'desc';
        else { busena.rikiavimas = k; busena.kryptis = 'desc'; }
        piesti(sarasas, kur);
      });
    });
    kur.querySelectorAll('.ct-dtable-r input[type=checkbox]').forEach(function (i) {
      i.addEventListener('change', function () {
        var eil = i.closest('.ct-dtable-r'), u = eil.getAttribute('data-url');
        busena.pazymeti[u] = i.checked;
        eil.setAttribute('aria-selected', i.checked ? 'true' : 'false');
      });
    });
  }

  // ── Rodinio jungiklis ─────────────────────────────────────────────────────
  function jungiklis(kur, sarasas, korteles) {
    var d = document.createElement('div');
    d.className = 'ct-dt-switch';
    d.innerHTML = seg('Rodinys', [{ v: 'korteles', t: 'Kortelės' }, { v: 'lentele', t: 'Lentelė' }], busena.rodinys);
    kur.parentNode.insertBefore(d, kur);
    d.querySelector('.ct-seg').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]'); if (!b) return;
      busena.rodinys = b.getAttribute('data-v');
      try { localStorage.setItem(LS, busena.rodinys); } catch (err) {}
      d.querySelectorAll('button[data-v]').forEach(function (x) {
        x.setAttribute('aria-checked', x === b ? 'true' : 'false');
      });
      if (busena.rodinys === 'lentele') piesti(sarasas, kur); else korteles();
    });
  }

  // ── Įsijungimas ───────────────────────────────────────────────────────────
  // index.html turi SENESNĮ apvalkalą, kuris kortelių piešėją pasiima į
  // `window.__ct_renderCards` ir kviečia jį TIESIOGIAI rikiuojant. Jei
  // perrašytume tik `renderCandidateCards`, rikiavimas apeitų mūsų rodinį ir
  // lentelė virstų kortelėmis. Todėl perrašom abu vardus.
  var senas = window.__ct_renderCards || window.renderCandidateCards;
  window.renderCandidateCards = function (candidates, results) {
    var sarasas = candidates || [];
    function korteles() { if (senas) senas.call(window, sarasas, results); }
    // jungiklis dedamas vieną kartą, virš rezultatų konteinerio
    if (results && !results.__ctPerpJungiklis) {
      results.__ctPerpJungiklis = true;
      try { jungiklis(results, sarasas, korteles); } catch (e) { /* jungiklis nebūtinas */ }
    }
    if (busena.rodinys === 'lentele' && results) { piesti(sarasas, results); return; }
    korteles();
  };
  if (window.__ct_renderCards) window.__ct_renderCards = window.renderCandidateCards;
})();
