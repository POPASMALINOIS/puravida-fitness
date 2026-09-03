(() => {
  if (window.RageNavegacionV257) return;
  window.RageNavegacionV257 = true;

  function ocultarVistasIntegradas() {
    [
      'alta-cliente-integrada-section',
      'agenda-dia-integrada-section',
      'cliente-detalle-section'
    ].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });
  }

  const mostrarAnterior = window.mostrarSeccion;
  if (typeof mostrarAnterior === 'function') {
    window.mostrarSeccion = function (seccion) {
      ocultarVistasIntegradas();
      const result = mostrarAnterior.apply(this, arguments);
      requestAnimationFrame(ocultarVistasIntegradas);
      setTimeout(ocultarVistasIntegradas, 0);
      return result;
    };
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.sidebar nav button');
    if (button) ocultarVistasIntegradas();
  }, true);

  /* fixes-v2.4.36.js se carga una sola vez desde index.html. */
})();
