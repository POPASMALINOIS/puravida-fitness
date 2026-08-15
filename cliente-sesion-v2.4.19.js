(() => {
  function getCliente(id) {
    try {
      return clientes.find(c => Number(c.id) === Number(id));
    } catch (_) {
      return null;
    }
  }

  function ensureBotonSesion(id) {
    const toolbar = document.querySelector('#cliente-detalle-section .cliente-detail-toolbar');
    if (!toolbar) return;

    let actions = toolbar.querySelector('.cliente-detail-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'cliente-detail-actions';
      toolbar.appendChild(actions);
    }

    let btn = actions.querySelector('.cliente-session-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cliente-session-btn';
      btn.textContent = '+ Añadir sesión';
      actions.appendChild(btn);
    }
    btn.onclick = () => abrirSesionCliente(id);
  }

  function hoyISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function abrirSesionCliente(id) {
    const cliente = getCliente(id);
    if (!cliente) return;

    document.querySelector('.cliente-session-backdrop')?.remove();

    const activos = (typeof entrenadores !== 'undefined' ? entrenadores : []).filter(e => e.estado === 'Activo');
    const opciones = activos.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');

    const backdrop = document.createElement('div');
    backdrop.className = 'cliente-session-backdrop';
    backdrop.innerHTML = `
      <div class="cliente-session-modal" role="dialog" aria-modal="true" aria-label="Añadir sesión">
        <div class="cliente-session-head">
          <div>
            <span class="section-kicker">AGENDA</span>
            <h3>Nueva sesión</h3>
            <p>${cliente.nombre}</p>
          </div>
          <button type="button" class="cliente-session-close" aria-label="Cerrar">×</button>
        </div>
        <div class="cliente-session-body">
          <label class="cliente-session-field">
            <span>Fecha</span>
            <input id="clienteSesionFecha" type="date" value="${hoyISO()}">
          </label>
          <label class="cliente-session-field">
            <span>Hora</span>
            <input id="clienteSesionHora" type="time" step="1800">
          </label>
          <label class="cliente-session-field full">
            <span>Entrenador</span>
            <select id="clienteSesionEntrenador">${opciones}</select>
          </label>
        </div>
        <div class="cliente-session-foot">
          <button type="button" class="cliente-session-cancel">Cancelar</button>
          <button type="button" class="cliente-session-save">Guardar sesión</button>
        </div>
      </div>`;

    document.body.appendChild(backdrop);

    const cerrar = () => backdrop.remove();
    backdrop.querySelector('.cliente-session-close').onclick = cerrar;
    backdrop.querySelector('.cliente-session-cancel').onclick = cerrar;
    backdrop.addEventListener('click', e => { if (e.target === backdrop) cerrar(); });

    backdrop.querySelector('.cliente-session-save').onclick = () => {
      const fecha = backdrop.querySelector('#clienteSesionFecha').value;
      const hora = backdrop.querySelector('#clienteSesionHora').value;
      const entrenadorId = backdrop.querySelector('#clienteSesionEntrenador').value;

      if (!fecha || !hora || !entrenadorId) {
        alert('Selecciona fecha, hora y entrenador.');
        return;
      }

      fechaDiaSeleccionado = fecha;
      prepararFormularioAgendaDia();

      const clienteSelect = document.getElementById('diaClienteSelect');
      const horaInput = document.getElementById('diaClaseHora');
      const entrenadorSelect = document.getElementById('diaEntrenadorSelect');

      if (!clienteSelect || !horaInput || !entrenadorSelect) {
        alert('No se ha podido preparar la agenda.');
        return;
      }

      clienteSelect.value = String(cliente.id);
      horaInput.value = hora;
      entrenadorSelect.value = String(entrenadorId);

      const before = cliente.clases.length;
      agendarClaseDia();
      const saved = cliente.clases.length > before;

      if (saved) {
        cerrar();
        if (typeof verFichaCliente === 'function') verFichaCliente(cliente.id);
      }
    };
  }

  window.abrirSesionCliente = abrirSesionCliente;

  const previous = window.verFichaCliente;
  if (typeof previous === 'function') {
    window.verFichaCliente = function(id) {
      const result = previous(id);
      requestAnimationFrame(() => ensureBotonSesion(id));
      setTimeout(() => ensureBotonSesion(id), 20);
      return result;
    };
  }
})();