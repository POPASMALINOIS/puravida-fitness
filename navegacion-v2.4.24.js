(() => {
  function ocultarVistasIntegradas() {
    [
      'alta-cliente-integrada-section',
      'agenda-dia-integrada-section',
      'cliente-detalle-section'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  const mostrarAnterior = window.mostrarSeccion;
  if (typeof mostrarAnterior === 'function') {
    window.mostrarSeccion = function(seccion) {
      ocultarVistasIntegradas();
      const result = mostrarAnterior.apply(this, arguments);
      // Algunos wrappers anteriores vuelven a tocar displays; reforzamos al final del ciclo.
      requestAnimationFrame(ocultarVistasIntegradas);
      setTimeout(ocultarVistasIntegradas, 0);
      return result;
    };
  }

  document.addEventListener('click', e => {
    const boton = e.target.closest('.sidebar nav button');
    if (!boton) return;
    // El propio botón ejecutará mostrarSeccion; esto evita restos visuales antes del render.
    ocultarVistasIntegradas();
  }, true);
})();