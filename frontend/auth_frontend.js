/* ── auth_frontend.js ─────────────────────────────────────────────────────
   Prisijungimo ir registracijos kvietimai. Žetono laikymas, antraštės ir 401
   NEBEGYVENA čia — jie perkelti į `ct-sesija.js` (revizija A-3: žetoną skaitė
   23 vietos dešimtyje failų).

   Kas iš čia išėjo ir kodėl:

   - `ctGetToken` / `ctSetToken` / `ctClearToken` / `ctGetEmail` liko kaip
     plonos nuorodos į `ctSesija`, nes jų vardais naudojasi senas kodas.
   - `fetch` apvalkalas IŠTRINTAS. Jis tikrino
     `url.startsWith(API_BASE) || url.startsWith('/api') || ...`, o
     `API_BASE` yra tuščia eilutė — tad pirmoji sąlyga visada teisinga ir
     `Authorization` keliaudavo su KIEKVIENU fetch'u, įskaitant svetimus
     adresus. `ct-sesija.js` deda antraštę tik savo kilmei.
   - `DOMContentLoaded` blokas neteko savo pirmos pusės: „ar prisijungęs"
     dabar sprendžia `ctSesija.patikra()` per `/auth/me`, o ne raktas
     `localStorage`.
   ──────────────────────────────────────────────────────────────────────── */

const API_BASE = window.API_BASE || '';

/* ── Žetonas: vienas šaltinis yra ct-sesija.js ─────────────────────────── */
function ctGetToken() { return window.ctSesija ? window.ctSesija.zetonas() : null; }
function ctSetToken(t, email) { if (window.ctSesija) window.ctSesija.nustatyti(t, email); }
function ctClearToken() { if (window.ctSesija) window.ctSesija.isvalyti(); }
function ctGetEmail() { return window.ctSesija ? window.ctSesija.elPastas() : null; }

/* ── API skambučiai ────────────────────────────────────────────────────── */
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
    if (window.ctSesija) { window.ctSesija.atsijungti(); return; }
    ctClearToken();
    window.location.reload();
  },

  isLoggedIn() { return !!ctGetToken(); },
  getEmail() { return ctGetEmail(); }
};

/* ── Puslapio paruošimas ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!authAPI.isLoggedIn()) {
    if (typeof window.showAuthModal === 'function') window.showAuthModal();
    return;
  }

  const emailEl = document.getElementById('ct-user-email');
  if (emailEl) emailEl.textContent = authAPI.getEmail();

  const logoutBtn = document.getElementById('ct-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', authAPI.logout);
});
