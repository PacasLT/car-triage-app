/* ── auth_frontend.js ─────────────────────────────────────────────────────
   Įdėti į index.html prieš </body> arba į atskirą <script> bloką.
   Veikia kartu su auth modalau (kurį sukuria design Claude).
   ──────────────────────────────────────────────────────────────────────── */

const API_BASE = window.API_BASE || '';   // jei reikia, pakeisk į Railway URL

/* ── Token valdymas ────────────────────────────────────────────────────── */
const CT_TOKEN_KEY = 'ct_token';
const CT_EMAIL_KEY = 'ct_email';

function ctGetToken()  { try { return localStorage.getItem(CT_TOKEN_KEY); } catch(e) { return null; } }
function ctSetToken(t, email) {
  try { localStorage.setItem(CT_TOKEN_KEY, t); localStorage.setItem(CT_EMAIL_KEY, email); } catch(e) {}
}
function ctClearToken() {
  try { localStorage.removeItem(CT_TOKEN_KEY); localStorage.removeItem(CT_EMAIL_KEY); } catch(e) {}
}
function ctGetEmail()  { try { return localStorage.getItem(CT_EMAIL_KEY); } catch(e) { return null; } }

/* ── API skambučiai (naudoja design Claude modal) ──────────────────────── */
window.authAPI = {
  async login(email, password) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Prisijungimo klaida');
    ctSetToken(data.access_token, data.email);
    return data;
  },

  async register(email, password, invite_code) {
    const r = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, invite_code })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Registracijos klaida');
    ctSetToken(data.access_token, data.email);
    return data;
  },

  logout() {
    ctClearToken();
    window.location.reload();
  },

  isLoggedIn() { return !!ctGetToken(); },
  getEmail()   { return ctGetEmail(); }
};

/* ── Auth header visiem fetch'ams ──────────────────────────────────────── */
// Pataisyti esamus API skambučius — pridėti token header
const _origFetch = window.fetch.bind(window);
window.fetch = function(url, opts = {}) {
  const token = ctGetToken();
  if (token && typeof url === 'string' && (url.startsWith(API_BASE) || url.startsWith('/api') || url.startsWith('/analyze') || url.startsWith('/scrape'))) {
    opts.headers = { ...(opts.headers || {}), 'Authorization': `Bearer ${token}` };
  }
  return _origFetch(url, opts);
};

/* ── Puslapio apsauga ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!authAPI.isLoggedIn()) {
    // Rodyti auth modalą — design Claude sukuria `window.showAuthModal()`
    if (typeof window.showAuthModal === 'function') {
      window.showAuthModal();
    }
    return;
  }

  // Vartotojas prisijungęs — rodyti email header'e
  const emailEl = document.getElementById('ct-user-email');
  if (emailEl) emailEl.textContent = authAPI.getEmail();

  const logoutBtn = document.getElementById('ct-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', authAPI.logout);
});
