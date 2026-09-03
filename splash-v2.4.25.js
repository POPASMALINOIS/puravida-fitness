(() => {
  const HOTFIX_VERSION = '2.4.57';
  let appShown = false;
  let tariffLoaded = false;

  function cargarModuloFacturas() {
    if (!document.querySelector('link[data-rage-facturas]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'facturas-v2.4.29.css?v=2.4.57';
      css.dataset.rageFacturas = '1';
      document.head.appendChild(css);
    }
    if (!document.querySelector('script[data-rage-facturas]')) {
      const js = document.createElement('script');
      js.src = 'facturas-v2.4.29.js?v=2.4.57';
      js.dataset.rageFacturas = '1';
      document.body.appendChild(js);
    }
  }

  function cargarModuloTarifas() {
    if (tariffLoaded || window.RageTarifasV255) return;
    tariffLoaded = true;
    if (!document.querySelector('link[data-rage-tarifas-v255]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'tarifas-v2.4.55.css?v=2.4.57';
      css.dataset.rageTarifasV255 = '1';
      document.head.appendChild(css);
    }
    if (!document.querySelector('script[data-rage-tarifas-v255]')) {
      const js = document.createElement('script');
      js.src = 'tarifas-v2.4.55.js?v=2.4.57';
      js.dataset.rageTarifasV255 = '1';
      js.async = true;
      document.body.appendChild(js);
    }
  }

  function montarPesa() {
    const loader = document.querySelector('.rage-splash-loader');
    if (!loader || loader.dataset.rageBuilt === '1') return;
    loader.dataset.rageBuilt = '1';
    loader.innerHTML = `
      <svg class="rage-dumbbell-svg" viewBox="0 0 120 48" role="img" aria-label="Cargando">
        <defs><clipPath id="rageDumbbellClip">
          <rect x="4" y="15" width="10" height="18" rx="2"/><rect x="14" y="10" width="12" height="28" rx="2"/><rect x="26" y="19" width="68" height="10" rx="3"/><rect x="94" y="10" width="12" height="28" rx="2"/><rect x="106" y="15" width="10" height="18" rx="2"/>
        </clipPath></defs>
        <g class="rage-dumbbell-base"><rect x="4" y="15" width="10" height="18" rx="2"/><rect x="14" y="10" width="12" height="28" rx="2"/><rect x="26" y="19" width="68" height="10" rx="3"/><rect x="94" y="10" width="12" height="28" rx="2"/><rect x="106" y="15" width="10" height="18" rx="2"/></g>
        <rect class="rage-dumbbell-fill" x="0" y="0" width="120" height="48" fill="#F15A24" clip-path="url(#rageDumbbellClip)"/>
        <g class="rage-dumbbell-outline"><rect x="4" y="15" width="10" height="18" rx="2"/><rect x="14" y="10" width="12" height="28" rx="2"/><rect x="26" y="19" width="68" height="10" rx="3"/><rect x="94" y="10" width="12" height="28" rx="2"/><rect x="106" y="15" width="10" height="18" rx="2"/></g>
      </svg>`;
  }

  function quitarSplash(inmediato = false) {
    if (typeof window.__rageForceReveal === 'function') {
      window.__rageForceReveal();
      return;
    }
    const splash = document.getElementById('rage-splash');
    if (!splash) return;
    splash.classList.add('is-hidden');
    splash.style.opacity = '0';
    splash.style.visibility = 'hidden';
    splash.style.pointerEvents = 'none';
    setTimeout(() => splash.remove(), inmediato ? 80 : 450);
  }

  function activarDashboard() {
    const dashboard = document.getElementById('dashboard-screen');
    const login = document.getElementById('login-screen');
    if (login) login.classList.remove('active');
    if (dashboard) dashboard.classList.add('active');
    if (typeof mostrarSeccion === 'function') {
      try { mostrarSeccion('resumen'); }
      catch (error) { console.error('[Rage] Error al mostrar resumen:', error); }
    }
  }

  function mostrarApp() {
    if (appShown) return;
    appShown = true;
    try { cargarModuloFacturas(); } catch (error) { console.error('[Rage] Facturas:', error); }
    try { montarPesa(); } catch (error) { console.error('[Rage] Splash:', error); }
    try { activarDashboard(); } catch (error) { console.error('[Rage] Dashboard:', error); }

    setTimeout(() => {
      quitarSplash(false);
      setTimeout(() => {
        try { cargarModuloTarifas(); }
        catch (error) { console.error('[Rage] Tarifas:', error); }
      }, 700);
    }, 5000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`service-worker.js?v=${HOTFIX_VERSION}`).catch(error =>
        console.warn('[Rage] Service worker:', error)
      );
    }
  }

  /* Segundo seguro, independiente de DOMContentLoaded. */
  setTimeout(() => {
    try { activarDashboard(); } catch (_) {}
    quitarSplash(true);
    setTimeout(() => { try { cargarModuloTarifas(); } catch (_) {} }, 400);
  }, 6800);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrarApp, { once: true });
  else mostrarApp();
})();
