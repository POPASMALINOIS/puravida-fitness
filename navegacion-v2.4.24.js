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
      requestAnimationFrame(ocultarVistasIntegradas);
      setTimeout(ocultarVistasIntegradas, 0);
      return result;
    };
  }

  document.addEventListener('click', e => {
    const boton = e.target.closest('.sidebar nav button');
    if (!boton) return;
    ocultarVistasIntegradas();
  }, true);

  // Parche funcional v2.4.36: email libre + cancelación excepcional limpia de agenda.
  if (!document.querySelector('script[data-rage-fixes-2436]')) {
    const s = document.createElement('script');
    s.src = 'fixes-v2.4.36.js?v=2.4.36';
    s.dataset.rageFixes2436 = '1';
    s.async = false;
    document.head.appendChild(s);
  }
})();