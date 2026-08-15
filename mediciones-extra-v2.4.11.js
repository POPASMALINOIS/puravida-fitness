(() => {
  const VERSION = '2.4.11';

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function getCliente(id) {
    const lista = (typeof clientes !== 'undefined' && Array.isArray(clientes)) ? clientes : [];
    return lista.find(c => Number(c.id) === Number(id));
  }

  function cerrar() {
    document.getElementById('rageMedicionExtraModal')?.remove();
  }
  window.cerrarMedicionExtraRage = cerrar;

  function filaExtra(extra = {}) {
    const row = document.createElement('div');
    row.className = 'med-extra-row';
    row.innerHTML = `
      <input class="med-extra-nombre" type="text" placeholder="Medición (ej. Cintura)" value="${esc(extra.nombre || '')}">
      <input class="med-extra-valor" type="number" step="0.1" inputmode="decimal" placeholder="Valor" value="${esc(extra.valor ?? '')}">
      <input class="med-extra-unidad" type="text" placeholder="Unidad" value="${esc(extra.unidad || 'cm')}">
      <button type="button" class="med-extra-delete" aria-label="Quitar medición">×</button>`;
    row.querySelector('.med-extra-delete').onclick = () => row.remove();
    return row;
  }

  window.agregarMedicionExtraRage = function(extra = {}) {
    const cont = document.getElementById('medExtrasContainer');
    if (cont) cont.appendChild(filaExtra(extra));
  };

  function abrirModal(cliente, medicion = null) {
    cerrar();
    const wrap = document.createElement('div');
    wrap.id = 'rageMedicionExtraModal';
    wrap.className = 'tracking-modal-backdrop';
    const hoy = typeof obtenerFechaISO === 'function' ? obtenerFechaISO(new Date()) : '';
    wrap.innerHTML = `
      <div class="tracking-modal med-extra-modal">
        <div class="tracking-modal-head">
          <div><span class="section-kicker">MEDICIONES</span><h3>${medicion ? 'Editar medición' : 'Nueva medición'}</h3><p>${esc(cliente.nombre)}</p></div>
          <button type="button" onclick="cerrarMedicionExtraRage()">×</button>
        </div>
        <div class="tracking-modal-body">
          <div class="tracking-form-grid">
            <label class="tracking-field"><span>Fecha</span><input id="mxFecha" type="date" value="${esc(medicion?.fecha || hoy)}"></label>
            <label class="tracking-field"><span>Peso</span><div class="unit-input"><input id="mxPeso" type="number" step="0.1" inputmode="decimal" value="${esc(medicion?.peso ?? '')}"><small>kg</small></div></label>
            <label class="tracking-field"><span>Grasa</span><div class="unit-input"><input id="mxGrasa" type="number" step="0.1" inputmode="decimal" value="${esc(medicion?.grasa ?? '')}"><small>%</small></div></label>
            <label class="tracking-field"><span>Músculo</span><div class="unit-input"><input id="mxMusculo" type="number" step="0.1" inputmode="decimal" value="${esc(medicion?.musculo ?? '')}"><small>%</small></div></label>
            <label class="tracking-field"><span>Hidratación</span><div class="unit-input"><input id="mxHidratacion" type="number" step="0.1" inputmode="decimal" value="${esc(medicion?.hidratacion ?? '')}"><small>%</small></div></label>
            <label class="tracking-field"><span>Plicometría</span><div class="unit-input"><input id="mxPlicometria" type="number" step="0.1" inputmode="decimal" value="${esc(medicion?.plicometria ?? '')}"><small>%</small></div></label>
          </div>

          <div class="med-extra-section">
            <div class="med-extra-section-head">
              <div><strong>Mediciones adicionales</strong><span>Contornos, perímetros o cualquier otro control.</span></div>
              <button type="button" class="tracking-add" onclick="agregarMedicionExtraRage()">+ Añadir medición</button>
            </div>
            <div id="medExtrasContainer" class="med-extras-container"></div>
          </div>

          <label class="tracking-field full"><span>Observaciones / objetivo</span><textarea id="mxObservaciones" rows="3" placeholder="Objetivo, evolución o comentario">${esc(medicion?.observaciones || '')}</textarea></label>
        </div>
        <div class="tracking-modal-actions">
          <button class="secondary" type="button" onclick="cerrarMedicionExtraRage()">Cancelar</button>
          <button class="primary" id="mxGuardar" type="button">Guardar</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    (Array.isArray(medicion?.extras) ? medicion.extras : []).forEach(extra => window.agregarMedicionExtraRage(extra));

    document.getElementById('mxGuardar').onclick = () => guardarMedicion(cliente, medicion?.id || null);
  }

  function guardarMedicion(cliente, id) {
    const fecha = document.getElementById('mxFecha')?.value;
    if (!fecha) { alert('Selecciona una fecha.'); return; }
    if (!Array.isArray(cliente.mediciones)) cliente.mediciones = [];

    const extras = [...document.querySelectorAll('#medExtrasContainer .med-extra-row')].map(row => ({
      nombre: row.querySelector('.med-extra-nombre')?.value.trim() || '',
      valor: row.querySelector('.med-extra-valor')?.value || '',
      unidad: row.querySelector('.med-extra-unidad')?.value.trim() || ''
    })).filter(x => x.nombre || x.valor || x.unidad);

    const val = id => document.getElementById(id)?.value || '';
    const item = {
      id: id || Date.now(),
      fecha,
      peso: val('mxPeso'),
      grasa: val('mxGrasa'),
      musculo: val('mxMusculo'),
      hidratacion: val('mxHidratacion'),
      plicometria: val('mxPlicometria'),
      extras,
      observaciones: document.getElementById('mxObservaciones')?.value.trim() || ''
    };

    if (id) cliente.mediciones = cliente.mediciones.map(m => Number(m.id) === Number(id) ? item : m);
    else cliente.mediciones.push(item);

    if (typeof guardarDatos === 'function') guardarDatos();
    cerrar();
    if (typeof verFichaCliente === 'function') verFichaCliente(cliente.id);
    setTimeout(() => {
      if (typeof cambiarTrackingTabRage === 'function') cambiarTrackingTabRage('mediciones');
      pintarExtras(cliente);
    }, 0);
  }

  window.nuevaMedicionRage = function(clienteId) {
    const cliente = getCliente(clienteId);
    if (!cliente) return;
    abrirModal(cliente, null);
  };

  window.editarMedicionRage = function(clienteId, medicionId) {
    const cliente = getCliente(clienteId);
    if (!cliente) return;
    const medicion = (cliente.mediciones || []).find(m => Number(m.id) === Number(medicionId));
    if (!medicion) return;
    abrirModal(cliente, medicion);
  };

  function pintarExtras(cliente) {
    const pane = document.getElementById('trackMediciones');
    if (!pane || !cliente || !Array.isArray(cliente.mediciones)) return;
    const items = [...pane.querySelectorAll('.measurement-item')];
    const ordenadas = [...cliente.mediciones].sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
    items.forEach((el, i) => {
      el.querySelector('.measurement-extras')?.remove();
      const extras = Array.isArray(ordenadas[i]?.extras) ? ordenadas[i].extras : [];
      if (!extras.length) return;
      const box = document.createElement('div');
      box.className = 'measurement-extras';
      box.innerHTML = extras.map(x => `<span><small>${esc(x.nombre || 'Extra')}</small><strong>${esc(x.valor || '—')}${x.unidad ? ' ' + esc(x.unidad) : ''}</strong></span>`).join('');
      const grid = el.querySelector('.measurement-grid');
      if (grid) grid.insertAdjacentElement('afterend', box); else el.appendChild(box);
    });
  }

  const verFichaAnterior = window.verFichaCliente;
  if (typeof verFichaAnterior === 'function') {
    window.verFichaCliente = function(id) {
      const result = verFichaAnterior(id);
      const cliente = getCliente(id);
      setTimeout(() => pintarExtras(cliente), 0);
      return result;
    };
  }
})();