(() => {
  if (window.RageRecurrenciasLoaderV254) return;
  window.RageRecurrenciasLoaderV254 = true;
  window.RageRecurrenciasLoaderV252 = true;
  window.RageRecurrenciasLoaderV251 = true;
  window.RageRecurrenciasLoaderV250 = true;
  window.RageRecurrenciasLoaderV249 = true;
  window.RageRecurrenciasLoaderV248 = true;
  window.RageRecurrenciasLoaderV247 = true;

  window.RageRecurrenciasFixV249 = true;
  window.RageRecurrenciasFixV248 = true;
  window.RageRecurrenciasSaveV250 = true;

  function loadStyle(href, attribute) {
    let link = document.querySelector(`link[${attribute}]`);
    if (link) {
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      return link;
    }
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(attribute, '1');
    document.head.appendChild(link);
    return link;
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

  function loadSaveHandler() {
    if (window.RageRecurrenciasSaveV251) return;
    loadScript('recurrencias-save-v2.4.51.js?v=2.4.54', 'data-rage-recurrencias-save-v251');
  }

  function loadCalendarClientNavigation() {
    if (window.RageCalendarClientOpenV252) return;
    loadScript('calendar-client-open-v2.4.52.js?v=2.4.54', 'data-rage-calendar-client-open-v252');
  }

  function loadCore() {
    loadStyle('recurrencias-v2.4.47.css?v=2.4.54', 'data-rage-recurrencias-v247');
    loadStyle('recurrencias-fix-v2.4.48.css?v=2.4.54', 'data-rage-recurrencias-fix-v252');
    loadCalendarClientNavigation();
    if (window.RageRecurrenciasVersion) {
      loadSaveHandler();
      return;
    }
    loadScript('recurrencias-v2.4.47.js?v=2.4.54', 'data-rage-recurrencias-v247', loadSaveHandler);
  }

  function waitForOperativa(attempt = 0) {
    if (window.RageOperativa || attempt >= 160) {
      loadCore();
      return;
    }
    setTimeout(() => waitForOperativa(attempt + 1), 25);
  }

  function start() {
    loadStyle('recurrencias-v2.4.47.css?v=2.4.54', 'data-rage-recurrencias-v247');
    loadStyle('recurrencias-fix-v2.4.48.css?v=2.4.54', 'data-rage-recurrencias-fix-v252');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js?v=2.4.54').catch(error =>
        console.warn('[Rage] No se pudo actualizar el service worker:', error)
      );
    }
    waitForOperativa();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
