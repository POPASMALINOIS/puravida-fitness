(() => {
  function hoyISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function instalarControlPagoAlta() {
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
      <span class="alta-pago-switch" aria-hidden="true"></span>
      <span class="alta-pago-copy">
        <strong>Pagado</strong>
        <small>Registrar la cuota inicial como cobrada</small>
      </span>`;
    wrap.appendChild(label);
  }

  function resetPagoAlta() {
    const check = document.getElementById('clientePagadoAlta');
    if (check) check.checked = false;
  }

  const agregarOriginal = window.agregarCliente;
  if (typeof agregarOriginal === 'function') {
    window.agregarCliente = function() {
      const check = document.getElementById('clientePagadoAlta');
      const pagado = !!check?.checked;
      const cuota = document.getElementById('clienteCuota')?.value || '0';
      const fechaAlta = document.getElementById('clienteFechaAlta')?.value || hoyISO();
      const cantidadAntes = Array.isArray(clientes) ? clientes.length : 0;

      const result = agregarOriginal.apply(this, arguments);

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

      resetPagoAlta();
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', instalarControlPagoAlta);
  instalarControlPagoAlta();
})();