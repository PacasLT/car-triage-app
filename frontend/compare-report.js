/* compare-report.js
   Gilaus palyginimo ataskaitos atvaizdavimas.
   Naudojamas DVIEJOSE vietose:
     - index.html  (palyginimo modale)
     - compare.html (atskirame ataskaitos puslapyje)
   Kodas laikomas ČIA, kad nereikėtų jo dubliuoti ir sinchronizuoti.
   Piešia į elementą su id="deep-compare-result".
*/

function ctEsc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ctRenderGilųPalyginimą(d) {
  const rez = document.getElementById('deep-compare-result');
  const v = d.verdiktas || {};
  const p = d.profiliai || [];
  const vardas = (i) => (p[i] && (p[i].meta && p[i].meta.modelis || p[i].title)) || ('Automobilis ' + (i + 1));
  let html = '';

  // ── Laimėtojas / verdiktas ──
  const hasWinner = v.laimetojas != null;
  html += '<div class="dc-section dc-winner' + (hasWinner ? '' : ' dc-no-winner') + '">';
  html += '<div class="dc-winner-label">';
  if (hasWinner) html += '<span>🏆</span> CARTRIIGE VERDIKTAS';
  else html += '<span style="opacity:.6">⚖️</span> CARTRIIGE VERDIKTAS';
  html += '</div>';
  if (hasWinner) {
    html += '<div class="dc-winner-name">' + ctEsc(vardas(v.laimetojas - 1)) + '</div>';
  }
  if (v.trumpas_verdiktas) html += '<div class="dc-winner-short">' + ctEsc(v.trumpas_verdiktas) + '</div>';
  if (v.laimetojo_pagrindimas) html += '<div class="dc-winner-long">' + ctEsc(v.laimetojo_pagrindimas) + '</div>';
  html += '</div>';

  // ── Palyginimas pagal kriterijus ──
  const kr = v.palyginimas_pagal_kriterijus || [];
  if (kr.length) {
    const cols = 'minmax(130px,1fr) repeat(' + p.length + ', minmax(0,1.4fr))';
    html += '<div class="dc-section"><div class="dc-crit-wrap"><div class="dc-crit-head" style="grid-template-columns:' + cols + '">'
      + '<div class="dc-crit-cell label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18M3 9h12M3 15h9"/></svg>Kriterijus</div>'
      + p.map((_, i) => '<div class="dc-crit-cell head-car">' + ctEsc(vardas(i)) + '</div>').join('')
      + '</div>';
    kr.forEach(function(row) {
      html += '<div class="dc-crit-row" style="grid-template-columns:' + cols + '">'
        + '<div class="dc-crit-cell label">' + ctEsc(row.kriterijus || '') + '</div>';
      for (let i = 0; i < p.length; i++) {
        const val = row['auto' + (i + 1)] || '–';
        const isWin = row.pranasesnis === (i + 1);
        html += '<div class="dc-crit-cell ' + (isWin ? 'win' : 'other') + '">'
          + (isWin ? '<span class="dc-win-tick">✓ </span>' : '') + ctEsc(val) + '</div>';
      }
      html += '</div>';
    });
    html += '</div></div>';
  }

  // ── Kam kuris tinka ──
  if ((v.kam_kuris_tinka || []).length) {
    html += '<div class="dc-section"><div style="font:700 9px/1 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style="flex:1;height:1px;background:var(--border)"></span>KAM KURIS TINKA<span style="flex:1;height:1px;background:var(--border)"></span></div><div class="dc-cards-row">'
      + v.kam_kuris_tinka.map(function(k) {
          const num = (k.auto || 1) - 1;
          return '<div class="dc-card"><div class="dc-card-label">' + ctEsc(vardas(num)) + '</div><div class="dc-card-text">' + ctEsc(k.kam || '') + '</div></div>';
        }).join('')
      + '</div></div>';
  }

  // ── Būtina patikrinti ──
  if ((v.ka_butina_patikrinti || []).length) {
    html += '<div class="dc-section dc-warn"><div class="dc-warn-label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>BŪTINA PATIKRINTI PRIEŠ PERKANT</div><ul class="dc-warn-list">'
      + v.ka_butina_patikrinti.map(x => '<li>' + ctEsc(x) + '</li>').join('')
      + '</ul></div>';
  }
  if (v.issaugojimai) {
    html += '<div class="dc-issaugojimai">' + ctEsc(v.issaugojimai) + '</div>';
  }

  // ── Profiliai ──
  if (p.length) {
    html += '<div class="dc-section"><div style="font:700 9px/1 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style="flex:1;height:1px;background:var(--border)"></span>SURINKTI DUOMENYS<span style="flex:1;height:1px;background:var(--border)"></span></div><div class="dc-cards-row">';
    p.forEach(function(prof, i) {
      const a = prof.analysis || {};
      const metaTags = [
        (prof.photos || []).length + ' nuotr.',
        'VIN ' + (prof.vin ? '✓' : '–'),
        prof.pardavejas || '',
        prof.isPodelio ? 'iš podėlio' : ''
      ].filter(Boolean).map(t => '<span>' + ctEsc(t) + '</span>').join('');
      const sublist = function(label, cls, arr) {
        if (!arr || !arr.length) return '';
        return '<div class="dc-sublist"><div class="dc-sublist-label ' + cls + '">' + label + '</div><ul>'
          + arr.slice(0, 5).map(x => '<li>' + ctEsc(x) + '</li>').join('')
          + '</ul></div>';
      };
      html += '<div class="dc-profile">'
        + '<div class="dc-profile-name">' + ctEsc(vardas(i)) + '</div>'
        + '<div class="dc-profile-meta">' + metaTags + '</div>'
        + (a.verdiktas ? '<div class="dc-profile-verdict">' + ctEsc(a.verdiktas) + '</div>' : '')
        + sublist('PRIVALUMAI', 'ok', a.privalumai)
        + sublist('KĄ PATIKRINTI', 'warn', a.ka_patikrinti_gyvai)
        + sublist('NUOTRAUKOS', 'orange', a.nuotrauku_pastebejimai)
        + sublist('ĮRANGA', 'purple', a.irangos_akcentai)
        + '</div>';
    });
    html += '</div></div>';
  }

  rez.innerHTML = html;
  rez.style.display = 'block';
  rez.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Abu puslapiai kviečia tą patį pavadinimą.
window.ctEsc = ctEsc;
window.ctRenderCompareReport = ctRenderGilųPalyginimą;
window.ctRenderGilųPalyginimą = ctRenderGilųPalyginimą;
