// ct-bendras.js — bendros funkcijos atskiriems puslapiams (mėgstamiausi, ataskaitos)
window.ctToken = function () { try { return localStorage.getItem('ct_token'); } catch (e) { return null; } };
window.ctApi = function (kelias, params) {
  const p = Object.assign({}, params || {});
  const h = Object.assign({}, p.headers || {});
  const t = window.ctToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  if (p.body && !h['Content-Type']) h['Content-Type'] = 'application/json';
  p.headers = h;
  return fetch(kelias, p);
};
window.ctEsc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
};
window.ctLaikas = function (ts) {
  const d = new Date(ts), skirt = Date.now() - ts;
  if (skirt < 60e3) return 'ką tik';
  if (skirt < 3600e3) return 'prieš ' + Math.round(skirt / 60e3) + ' min';
  if (skirt < 86400e3) return 'prieš ' + Math.round(skirt / 3600e3) + ' val';
  if (skirt < 2 * 86400e3) return 'vakar';
  if (skirt < 30 * 86400e3) return 'prieš ' + Math.round(skirt / 86400e3) + ' d.';
  return d.toLocaleDateString('lt-LT');
};
// Plano zenklelis antrasteje
(async function () {
  const el = document.getElementById('ct-planas-btn-text'), btn = document.getElementById('ct-planas-btn');
  if (!el || !ctToken()) { if (btn) btn.style.display = 'none'; return; }
  try {
    const r = await ctApi('/api/planas'); if (!r.ok) return;
    const b = await r.json(); const kr = b.kreditai.viso;
    el.innerHTML = ctEsc(b.planoPavadinimas) + ' <span class="ct-pl-kr ' + (kr <= 0 ? 'nulis' : kr <= 2 ? 'maza' : '') + '">' + kr + ' kr</span>';
  } catch (e) {}
})();
