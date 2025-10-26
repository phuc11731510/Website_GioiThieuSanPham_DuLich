(function () {
  const STORAGE_KEY = 'foxel_lang';

  function resolveValue(el, str) {
    if (!str) return;
    if (el.placeholder !== undefined && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      el.placeholder = str;
      if (el.type === 'button' || el.type === 'submit') {
        el.value = str;
      }
      return;
    }
    el.textContent = str;
  }

  function applyLanguage(lang) {
    const dict = (window.FOXEL_LANG_DATA && window.FOXEL_LANG_DATA[lang]) || null;
    if (!dict) return;
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-lang-key]').forEach((el) => {
      const key = el.getAttribute('data-lang-key');
      if (!key) return;
      const value = dict[key];
      if (value !== undefined) resolveValue(el, value);
    });
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.warn('Unable to persist language preference', err);
    }
  }

  window.setLanguage = function setLanguage(lang) {
    if (!window.FOXEL_LANG_DATA || !window.FOXEL_LANG_DATA[lang]) return;
    applyLanguage(lang);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const saved = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (err) {
        return null;
      }
    })();
    const initial = saved && window.FOXEL_LANG_DATA && window.FOXEL_LANG_DATA[saved] ? saved : 'vi';
    applyLanguage(initial);
  });
})();
