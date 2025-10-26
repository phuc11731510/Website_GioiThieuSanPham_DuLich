document.addEventListener('DOMContentLoaded', () => {
  try { initDark(); } catch {}
  try { backtotop(); } catch {}
  loadProducts().then(() => { try { initHome(); } catch {} });
});

function initDark() {
  const btn = document.getElementById('btnDark');
  if (!btn) return;
  const setTheme = (dark) => document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  let pref = localStorage.getItem('dm') === '1';
  setTheme(pref);
  btn.onclick = () => {
    pref = !pref;
    localStorage.setItem('dm', pref ? '1' : '0');
    setTheme(pref);
  };
}