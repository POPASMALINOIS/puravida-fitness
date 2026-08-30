(() => {
  if (window.RageRecurrenciasLoaderV247) return;
  window.RageRecurrenciasLoaderV247 = true;

  function loadCss() {
    if (document.querySelector('link[data-rage-recurrencias-v247]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'recurrencias-v2.4.47.css?v=2.4.47';
    link.dataset.rageRecurrenciasV247 = '1';
    document.head.appendChild(link);
  }

  function loadScript() {
    if (window.RageRecurrenciasVersion || document.querySelector('script[data-rage-recurrencias-v247]')) return;
    const script = document.createElement('script');
    script.src = 'recurrencias-v2.4.47.js?v=2.4.47';
    script.async = false;
    script.dataset.rageRecurrenciasV247 = '1';
    document.head.appendChild(script);
  }

  function waitForOperativa(attempt = 0) {
    if (window.RageOperativa || attempt >= 160) {
      loadScript();
      return;
    }
    setTimeout(() => waitForOperativa(attempt + 1), 25);
  }

  function start() {
    loadCss();
    waitForOperativa();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();