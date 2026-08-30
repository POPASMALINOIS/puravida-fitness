(() => {
  function configurarEmail() {
    const email = document.getElementById('clienteEmail');
    if (!email) return;
    email.type = 'text';
    email.setAttribute('inputmode', 'email');
    email.setAttribute('autocomplete', 'email');
    email.setAttribute('autocapitalize', 'none');
    email.setAttribute('spellcheck', 'false');
    email.style.textTransform = 'none';
  }

  // Evita que el conversor global a mayúsculas altere el email.
  document.addEventListener('input', event => {
    if (event.target && event.target.id === 'clienteEmail') {
      event.stopImmediatePropagation();
    }
  }, true);

  window.convertirInputsMayusculas = function () {
    document.querySelectorAll("#alta-screen input[type='text']:not(#clienteEmail), #alta-cliente-integrada-section input[type='text']:not(#clienteEmail), #alta-screen textarea, #alta-cliente-integrada-section textarea").forEach(input => {
      if (input.dataset.rageUppercaseBound === '1') return;
      input.dataset.rageUppercaseBound = '1';
      input.addEventListener('input', function () {
        const inicio = this.selectionStart;
        const fin = this.selectionEnd;
        this.value = this.value.toUpperCase();
        if (typeof inicio === 'number' && typeof fin === 'number') {
          try { this.setSelectionRange(inicio, fin); } catch (_) {}
        }
      });
    });
    configurarEmail();
  };

  configurarEmail();
  const observer = new MutationObserver(configurarEmail);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  function listaClientes() {
    try { return Array.isArray(clientes) ? clientes : []; }
    catch (_) { return []; }
  }

  function ejecutarSeguro(fn) {
    try { if (typeof fn === 'function') fn(); } catch (error) { console.error(error); }
  }

  function refrescarTrasEliminar(clienteId) {
    ejecutarSeguro(() => guardarDatos());
    ejecutarSeguro(() => verificarEstadoBonos());
    ejecutarSeguro(() => actualizarResumen());
    ejecutarSeguro(() => renderAgendaDia());
    ejecutarSeguro(() => renderCalendarioSemanal());
    ejecutarSeguro(() => renderClientes());

    // Refuerzo porque algunas vistas integradas se repintan al final del ciclo del navegador.
    requestAnimationFrame(() => {
      ejecutarSeguro(() => renderAgendaDia());
      ejecutarSeguro(() => renderCalendarioSemanal());
    });
    setTimeout(() => {
      ejecutarSeguro(() => renderAgendaDia());
      ejecutarSeguro(() => renderCalendarioSemanal());
    }, 40);

    try {
      if (clienteActual && Number(clienteActual.id) === Number(clienteId) && typeof verFichaCliente === 'function') {
        verFichaCliente(clienteId);
      }
    } catch (_) {}
  }

  function localizarSesion(clienteId, claseId) {
    const cliente = listaClientes().find(c => Number(c.id) === Number(clienteId));
    if (!cliente || !Array.isArray(cliente.clases)) return null;
    const indice = cliente.clases.findIndex(c => Number(c.id) === Number(claseId));
    if (indice < 0) return null;
    return { cliente, clase: cliente.clases[indice], indice };
  }

  function eliminarSesion(clienteId, claseId, modo) {
    const encontrada = localizarSesion(clienteId, claseId);
    if (!encontrada) {
      // Aunque el dato ya no exista, limpiamos cualquier resto visual.
      refrescarTrasEliminar(clienteId);
      return;
    }

    const { cliente, clase, indice } = encontrada;

    if (modo === 'cancelar') {
      if (!confirm('¿Cancelar esta sesión? La sesión contabilizará en el bono y se eliminará de la agenda.')) return;

      // Cancelación normal: cuenta una sesión. Si aún no se había descontado, se descuenta ahora.
      if (!clase.consumida && Number(cliente.bonoDisponible) > 0) {
        cliente.bonoDisponible = Number(cliente.bonoDisponible) - 1;
      }
    } else {
      if (!confirm('¿Cancelar excepcionalmente esta sesión? Se devolverá al bono si estaba contabilizada y se eliminará de la agenda.')) return;

      // Cancelación excepcional: si ya estaba contabilizada, devuelve una sesión.
      if (clase.consumida && Number(cliente.bonoDisponible) < Number(cliente.bonoTotal)) {
        cliente.bonoDisponible = Number(cliente.bonoDisponible) + 1;
      }
    }

    // Mutación sobre el mismo array: evita que cualquier vista conserve una referencia antigua.
    cliente.clases.splice(indice, 1);
    refrescarTrasEliminar(clienteId);
  }

  // Protección adicional: una sesión cancelada nunca se representa.
  const obtenerClasesOriginal = window.obtenerClasesPorFecha;
  if (typeof obtenerClasesOriginal === 'function') {
    window.obtenerClasesPorFecha = function (fechaISO) {
      return obtenerClasesOriginal(fechaISO).filter(clase =>
        clase.estado !== 'Cancelada' && clase.estado !== 'Cancelada excepcional'
      );
    };
  }

  window.cancelarClase = function (clienteId, claseId) {
    eliminarSesion(clienteId, claseId, 'cancelar');
  };

  window.cancelarClaseExcepcional = function (clienteId, claseId) {
    eliminarSesion(clienteId, claseId, 'excepcional');
  };

  // Intercepta los botones antes del onclick antiguo para garantizar que siempre se use esta lógica.
  document.addEventListener('click', event => {
    const boton = event.target.closest('button[onclick*="cancelarClaseExcepcional("], button[onclick*="cancelarClase("]');
    if (!boton) return;

    const codigo = boton.getAttribute('onclick') || '';
    const excepcional = codigo.includes('cancelarClaseExcepcional(');
    const coincidencia = codigo.match(/cancelarClase(?:Excepcional)?\s*\(\s*([^,]+)\s*,\s*([^\)]+)\s*\)/);
    if (!coincidencia) return;

    const clienteId = Number(String(coincidencia[1]).replace(/[^0-9.-]/g, ''));
    const claseId = Number(String(coincidencia[2]).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(clienteId) || !Number.isFinite(claseId)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    eliminarSesion(clienteId, claseId, excepcional ? 'excepcional' : 'cancelar');
  }, true);

  function limpiarCancelacionesAntiguas() {
    let cambio = false;
    listaClientes().forEach(cliente => {
      if (!Array.isArray(cliente.clases)) return;
      const antes = cliente.clases.length;
      cliente.clases = cliente.clases.filter(clase =>
        clase.estado !== 'Cancelada' && clase.estado !== 'Cancelada excepcional'
      );
      if (cliente.clases.length !== antes) cambio = true;
    });
    if (cambio) {
      ejecutarSeguro(() => guardarDatos());
      ejecutarSeguro(() => renderCalendarioSemanal());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.convertirInputsMayusculas();
      limpiarCancelacionesAntiguas();
    }, { once: true });
  } else {
    window.convertirInputsMayusculas();
    limpiarCancelacionesAntiguas();
  }
})();

/* Cargador operativo v2.4.46. Se mantiene aquí para que llegue también a las PWA ya instaladas. */
(() => {
  function loadOperativaV246() {
    if (!document.querySelector('link[data-rage-operativa-v246]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'operativa-v2.4.46.css?v=2.4.46';
      link.dataset.rageOperativaV246 = '1';
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[data-rage-operativa-v246]')) {
      const script = document.createElement('script');
      script.src = 'operativa-v2.4.46.js?v=2.4.46';
      script.dataset.rageOperativaV246 = '1';
      script.async = false;
      document.head.appendChild(script);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOperativaV246, { once: true });
  } else {
    loadOperativaV246();
  }
})();