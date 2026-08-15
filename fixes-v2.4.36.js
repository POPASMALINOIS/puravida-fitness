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

  // Una sesión cancelada nunca debe mostrarse como programada en calendario/agenda.
  const obtenerClasesOriginal = window.obtenerClasesPorFecha;
  if (typeof obtenerClasesOriginal === 'function') {
    window.obtenerClasesPorFecha = function (fechaISO) {
      return obtenerClasesOriginal(fechaISO).filter(clase =>
        clase.estado !== 'Cancelada' && clase.estado !== 'Cancelada excepcional'
      );
    };
  }

  // La cancelación excepcional devuelve el bono si procede y elimina la reserva de la agenda.
  window.cancelarClaseExcepcional = function (clienteId, claseId) {
    const cliente = (typeof clientes !== 'undefined' ? clientes : []).find(c => Number(c.id) === Number(clienteId));
    if (!cliente) return;

    const clase = (cliente.clases || []).find(c => Number(c.id) === Number(claseId));
    if (!clase) return;

    if (!confirm('¿Cancelar excepcionalmente esta sesión y devolver la sesión al bono?')) return;

    if (clase.consumida && Number(cliente.bonoDisponible) < Number(cliente.bonoTotal)) {
      cliente.bonoDisponible = Number(cliente.bonoDisponible) + 1;
    }

    cliente.clases = (cliente.clases || []).filter(c => Number(c.id) !== Number(claseId));

    if (typeof guardarDatos === 'function') guardarDatos();
    if (typeof verificarEstadoBonos === 'function') verificarEstadoBonos();
    if (typeof actualizarResumen === 'function') actualizarResumen();
    if (typeof renderAgendaDia === 'function') renderAgendaDia();
    if (typeof renderCalendarioSemanal === 'function') renderCalendarioSemanal();
    if (typeof renderClientes === 'function') renderClientes();

    if (typeof clienteActual !== 'undefined' && clienteActual && Number(clienteActual.id) === Number(clienteId) && typeof verFichaCliente === 'function') {
      verFichaCliente(clienteId);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.convertirInputsMayusculas(), { once: true });
  } else {
    window.convertirInputsMayusculas();
  }
})();