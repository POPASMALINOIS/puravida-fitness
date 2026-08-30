(() => {
  if (window.RageRecurrenciasLoaderV248) return;
  window.RageRecurrenciasLoaderV248 = true;
  window.RageRecurrenciasLoaderV247 = true;

  function loadStyle(href, attribute) {
    if (document.querySelector(`link[${attribute}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(attribute, '1');
    document.head.appendChild(link);
  }

  function loadScript(src, attribute, onload) {
    const existing = document.querySelector(`script[${attribute}]`);
    if (existing) {
      if (typeof onload === 'function') {
        if (existing.dataset.rageLoaded === '1') onload();
        else existing.addEventListener('load', onload, { once: true });
      }
      return existing;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(attribute, '1');
    script.addEventListener('load', () => {
      script.dataset.rageLoaded = '1';
      if (typeof onload === 'function') onload();
    }, { once: true });
    document.head.appendChild(script);
    return script;
  }

  function loadFix() {
    loadStyle('recurrencias-fix-v2.4.48.css?v=2.4.48', 'data-rage-recurrencias-fix-v248');
    if (!window.RageRecurrenciasFixV248) {
      loadScript('recurrencias-fix-v2.4.48.js?v=2.4.48', 'data-rage-recurrencias-fix-v248');
    }
  }

  function loadCore() {
    loadStyle('recurrencias-v2.4.47.css?v=2.4.48', 'data-rage-recurrencias-v247');

    if (window.RageRecurrenciasVersion) {
      loadFix();
      return;
    }

    loadScript(
      'recurrencias-v2.4.47.js?v=2.4.48',
      'data-rage-recurrencias-v247',
      loadFix
    );
  }

  function waitForOperativa(attempt = 0) {
    if (window.RageOperativa || attempt >= 160) {
      loadCore();
      return;
    }
    setTimeout(() => waitForOperativa(attempt + 1), 25);
  }

  function start() {
    loadStyle('recurrencias-v2.4.47.css?v=2.4.48', 'data-rage-recurrencias-v247');
    loadStyle('recurrencias-fix-v2.4.48.css?v=2.4.48', 'data-rage-recurrencias-fix-v248');
    waitForOperativa();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
