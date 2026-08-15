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

  /* v2.4.21 · Registrar la cuota como pagada al crear el cliente */
  function instalarPagoAlta() {
    const cuota = document.getElementById('clienteCuota');
    if (!cuota || document.getElementById('clientePagadoAlta')) return;

    const wrap = document.createElement('div');
    wrap.className = 'alta-cuota-pago';
    cuota.parentNode.insertBefore(wrap, cuota);
    wrap.appendChild(cuota);

    const label = document.createElement('label');
    label.className = 'alta-pago-toggle';
    label.innerHTML = `
      <input type="checkbox" id="clientePagadoAlta">
      <span class="alta-pago-switch"></span>
      <span class="alta-pago-copy"><strong>Pagado</strong><small>Registrar cuota inicial</small></span>`;
    wrap.appendChild(label);
  }

  function instalarEstilosPagoAlta() {
    if (document.getElementById('alta-pago-inline-style')) return;
    const style = document.createElement('style');
    style.id = 'alta-pago-inline-style';
    style.textContent = `
      .alta-cuota-pago{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:stretch;min-width:0}.alta-cuota-pago>#clienteCuota{margin:0;min-width:0}.alta-pago-toggle{display:flex!important;align-items:center;gap:9px;margin:0!important;padding:0 12px;min-height:48px;border:1px solid rgba(148,163,184,.16);border-radius:10px;background:#0c1728;cursor:pointer;white-space:nowrap}.alta-pago-toggle input{position:absolute;opacity:0;pointer-events:none}.alta-pago-switch{position:relative;display:block;width:36px;height:20px;flex:0 0 36px;border-radius:999px;background:#25344a;transition:.18s}.alta-pago-switch:after{content:'';position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:.18s}.alta-pago-toggle input:checked+.alta-pago-switch{background:#F15A24}.alta-pago-toggle input:checked+.alta-pago-switch:after{transform:translateX(16px)}.alta-pago-copy{display:flex;flex-direction:column;line-height:1.1}.alta-pago-copy strong{font-size:12px;color:#f8fafc}.alta-pago-copy small{margin-top:3px;font-size:9px;color:#8ea0b8}@media(max-width:900px){.alta-cuota-pago{grid-template-columns:minmax(0,1fr)}.alta-pago-toggle{width:100%;min-width:0;padding:10px 12px;white-space:normal}.alta-pago-copy small{font-size:10px}}`;
    document.head.appendChild(style);
  }

  const agregarClienteAnterior = window.agregarCliente;
  if (typeof agregarClienteAnterior === 'function') {
    window.agregarCliente = function() {
      const pagado = !!document.getElementById('clientePagadoAlta')?.checked;
      const cuota = document.getElementById('clienteCuota')?.value || '0';
      const fechaAlta = document.getElementById('clienteFechaAlta')?.value || hoyISO();
      const cantidadAntes = Array.isArray(clientes) ? clientes.length : 0;

      const result = agregarClienteAnterior.apply(this, arguments);

      if (pagado && Array.isArray(clientes) && clientes.length > cantidadAntes) {
        const cliente = clientes[clientes.length - 1];
        cliente.pagos = Array.isArray(cliente.pagos) ? cliente.pagos : [];
        cliente.pagos.push({
          id: Date.now(),
          fecha: fechaAlta,
          importe: cuota,
          concepto: 'Cuota inicial / alta'
        });
        cliente.pagoPendiente = false;
        if (typeof guardarDatos === 'function') guardarDatos();
        if (typeof actualizarResumen === 'function') actualizarResumen();
      }

      const check = document.getElementById('clientePagadoAlta');
      if (check) check.checked = false;
      return result;
    };
  }

  instalarEstilosPagoAlta();
  document.addEventListener('DOMContentLoaded', instalarPagoAlta);
  instalarPagoAlta();
})();