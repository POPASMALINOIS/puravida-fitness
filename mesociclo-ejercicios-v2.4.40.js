(() => {
  const VERSION = '2.4.40';

  function clientesLista() {
    try { return Array.isArray(clientes) ? clientes : []; }
    catch (_) { return []; }
  }

  function clientePorId(id) {
    return clientesLista().find(c => Number(c.id) === Number(id));
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function guardar() {
    if (typeof guardarDatos === 'function') guardarDatos();
  }

  function normalizarMesociclo(mesociclo) {
    if (!mesociclo) return;
    if (!Array.isArray(mesociclo.ejercicios)) mesociclo.ejercicios = [];
    if (typeof mesociclo.tablaEjerciciosActiva !== 'boolean') {
      mesociclo.tablaEjerciciosActiva = mesociclo.ejercicios.length > 0;
    }
  }

  function datalistsHtml() {
    return `
      <datalist id="ragePesosSugeridos">
        <option value="Sin peso"></option><option value="Peso corporal"></option>
        <option value="2,5 kg"></option><option value="5 kg"></option><option value="7,5 kg"></option>
        <option value="10 kg"></option><option value="12,5 kg"></option><option value="15 kg"></option>
        <option value="20 kg"></option><option value="25 kg"></option><option value="30 kg"></option>
        <option value="35 kg"></option><option value="40 kg"></option><option value="50 kg"></option>
        <option value="60 kg"></option><option value="70 kg"></option><option value="75 kg"></option>
      </datalist>
      <datalist id="rageRepesSugeridas">
        <option value="5"></option><option value="8"></option><option value="10"></option>
        <option value="12"></option><option value="15"></option><option value="20"></option>
        <option value="3 x 8"></option><option value="3 x 10"></option><option value="3 x 12"></option>
        <option value="4 x 8"></option><option value="4 x 10"></option><option value="Al fallo"></option>
      </datalist>`;
  }

  function filaEditorHtml(data = {}, index = 0) {
    return `
      <div class="meso-exercise-edit-row" data-exercise-row>
        <div class="meso-exercise-row-number" aria-hidden="true">${index + 1}</div>
        <label class="meso-exercise-cell exercise-name">
          <span>Ejercicio</span>
          <input class="meso-exercise-name" type="text" placeholder="Escribe el ejercicio" value="${esc(data.ejercicio || '')}">
        </label>
        <label class="meso-exercise-cell exercise-weight">
          <span>Peso</span>
          <input class="meso-exercise-weight" type="text" list="ragePesosSugeridos" placeholder="Ej. 12,5 kg" value="${esc(data.peso || '')}">
        </label>
        <label class="meso-exercise-cell exercise-reps">
          <span>Repes</span>
          <input class="meso-exercise-reps" type="text" list="rageRepesSugeridas" placeholder="Ej. 10 o 3 x 12" value="${esc(data.repes || '')}">
        </label>
        <label class="meso-exercise-cell exercise-notes">
          <span>Notas</span>
          <textarea class="meso-exercise-notes" rows="2" placeholder="Técnica, molestias, ayuda, progresión...">${esc(data.notas || '')}</textarea>
        </label>
        <button class="meso-exercise-remove" type="button" aria-label="Eliminar ejercicio" title="Eliminar ejercicio">×</button>
      </div>`;
  }

  function renumerarFilas(contenedor) {
    [...contenedor.querySelectorAll('[data-exercise-row]')].forEach((fila, index) => {
      const numero = fila.querySelector('.meso-exercise-row-number');
      if (numero) numero.textContent = String(index + 1);
    });
  }

  function agregarFila(contenedor, data = {}) {
    const template = document.createElement('template');
    const total = contenedor.querySelectorAll('[data-exercise-row]').length;
    template.innerHTML = filaEditorHtml(data, total).trim();
    const fila = template.content.firstElementChild;
    contenedor.appendChild(fila);
    fila.querySelector('.meso-exercise-remove').onclick = () => {
      fila.remove();
      renumerarFilas(contenedor);
    };
    fila.querySelector('.meso-exercise-name')?.focus();
    return fila;
  }

  function leerFilas() {
    return [...document.querySelectorAll('#mesoExerciseRows [data-exercise-row]')]
      .map(fila => ({
        id: Number(fila.dataset.exerciseId) || Date.now() + Math.floor(Math.random() * 100000),
        ejercicio: fila.querySelector('.meso-exercise-name')?.value.trim() || '',
        peso: fila.querySelector('.meso-exercise-weight')?.value.trim() || '',
        repes: fila.querySelector('.meso-exercise-reps')?.value.trim() || '',
        notas: fila.querySelector('.meso-exercise-notes')?.value.trim() || ''
      }))
      .filter(item => item.ejercicio || item.peso || item.repes || item.notas);
  }

  function montarEditor(clienteId, mesocicloId = null) {
    const cliente = clientePorId(clienteId);
    const modal = document.getElementById('rageTrackingModal');
    const body = modal?.querySelector('.tracking-modal-body');
    const saveButton = document.getElementById('trackingModalSave');
    if (!cliente || !modal || !body || !saveButton || body.querySelector('#mesoExerciseEditor')) return;

    const mesociclo = mesocicloId == null
      ? null
      : (cliente.mesociclos || []).find(m => Number(m.id) === Number(mesocicloId));
    if (mesociclo) normalizarMesociclo(mesociclo);

    const activo = !!mesociclo?.tablaEjerciciosActiva;
    const filas = activo && mesociclo?.ejercicios?.length ? mesociclo.ejercicios : [];

    const section = document.createElement('section');
    section.id = 'mesoExerciseEditor';
    section.className = 'meso-exercise-editor';
    section.innerHTML = `
      <div class="meso-exercise-editor-head">
        <label class="meso-exercise-toggle">
          <input id="mesoExerciseEnabled" type="checkbox" ${activo ? 'checked' : ''}>
          <span class="meso-exercise-toggle-ui"></span>
          <span><strong>Incluir tabla de ejercicios</strong><small>Opcional. Úsala solo cuando este mesociclo necesite trabajo detallado.</small></span>
        </label>
      </div>
      <div id="mesoExercisePanel" class="meso-exercise-panel" ${activo ? '' : 'hidden'}>
        <div class="meso-exercise-copy">
          <div><h4>Ejercicios del mesociclo</h4><p>Las columnas son fijas; puedes añadir tantas filas como necesites y escribir valores libres.</p></div>
          <button id="mesoExerciseAdd" type="button">+ Añadir ejercicio</button>
        </div>
        <div class="meso-exercise-desktop-head" aria-hidden="true">
          <span>#</span><span>Ejercicios</span><span>Peso</span><span>Repes</span><span>Notas</span><span></span>
        </div>
        <div id="mesoExerciseRows" class="meso-exercise-rows"></div>
        ${datalistsHtml()}
      </div>`;
    body.appendChild(section);

    const enabled = section.querySelector('#mesoExerciseEnabled');
    const panel = section.querySelector('#mesoExercisePanel');
    const rows = section.querySelector('#mesoExerciseRows');
    const addButton = section.querySelector('#mesoExerciseAdd');

    enabled.onchange = () => {
      panel.hidden = !enabled.checked;
      if (enabled.checked && !rows.children.length) agregarFila(rows);
    };
    addButton.onclick = () => agregarFila(rows);

    if (filas.length) {
      filas.forEach(item => {
        const fila = agregarFila(rows, item);
        fila.dataset.exerciseId = String(item.id || '');
      });
    } else if (activo) {
      agregarFila(rows);
    }

    const onSaveOriginal = saveButton.onclick;
    const idsAntes = new Set((cliente.mesociclos || []).map(m => Number(m.id)));

    saveButton.onclick = event => {
      const incluirTabla = enabled.checked;
      const ejercicios = leerFilas();

      if (incluirTabla && ejercicios.length === 0) {
        alert('Añade al menos una fila a la tabla de ejercicios o desactiva la tabla.');
        return;
      }

      if (typeof onSaveOriginal === 'function') onSaveOriginal.call(saveButton, event);

      setTimeout(() => {
        // Si el modal sigue abierto, el formulario principal no superó su validación.
        if (document.getElementById('rageTrackingModal')) return;

        let destino = null;
        if (mesocicloId != null) {
          destino = (cliente.mesociclos || []).find(m => Number(m.id) === Number(mesocicloId));
        } else {
          destino = [...(cliente.mesociclos || [])]
            .filter(m => !idsAntes.has(Number(m.id)))
            .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0]
            || [...(cliente.mesociclos || [])].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
        }

        if (!destino) return;
        destino.tablaEjerciciosActiva = incluirTabla;
        destino.ejercicios = incluirTabla ? ejercicios : [];
        guardar();

        if (typeof verFichaCliente === 'function') verFichaCliente(cliente.id);
        setTimeout(() => {
          if (typeof cambiarTrackingTabRage === 'function') cambiarTrackingTabRage('mesociclos');
        }, 0);
      }, 0);
    };
  }

  function tablaMesocicloHtml(mesociclo) {
    normalizarMesociclo(mesociclo);
    const filas = mesociclo.tablaEjerciciosActiva
      ? mesociclo.ejercicios.filter(item => item.ejercicio || item.peso || item.repes || item.notas)
      : [];
    if (!filas.length) return '';

    return `
      <section class="meso-exercise-display">
        <div class="meso-exercise-display-title">
          <div><span>PLAN DE EJERCICIOS</span><strong>${filas.length} ejercicio${filas.length === 1 ? '' : 's'}</strong></div>
        </div>
        <div class="meso-exercise-table-wrap">
          <table class="meso-exercise-table">
            <thead><tr><th>Ejercicios</th><th>Peso</th><th>Repes</th><th>Notas</th></tr></thead>
            <tbody>${filas.map(item => `
              <tr>
                <td data-label="Ejercicio"><strong>${esc(item.ejercicio || '—')}</strong></td>
                <td data-label="Peso">${esc(item.peso || '—')}</td>
                <td data-label="Repes">${esc(item.repes || '—')}</td>
                <td data-label="Notas">${esc(item.notas || '—')}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      </section>`;
  }

  function inyectarTablas(clienteId) {
    const cliente = clientePorId(clienteId);
    const lista = document.getElementById('mesociclosListaRage');
    if (!cliente || !lista) return;

    const mesociclos = [...(cliente.mesociclos || [])]
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    const cards = [...lista.querySelectorAll('.meso-item')];

    cards.forEach((card, index) => {
      card.querySelector('.meso-exercise-display')?.remove();
      const mesociclo = mesociclos[index];
      if (!mesociclo) return;
      const html = tablaMesocicloHtml(mesociclo);
      if (!html) return;
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      card.appendChild(template.content.firstElementChild);
    });
  }

  const nuevoAnterior = window.nuevoMesocicloRage;
  if (typeof nuevoAnterior === 'function') {
    window.nuevoMesocicloRage = function (clienteId) {
      const result = nuevoAnterior.apply(this, arguments);
      requestAnimationFrame(() => montarEditor(clienteId, null));
      setTimeout(() => montarEditor(clienteId, null), 30);
      return result;
    };
  }

  const editarAnterior = window.editarMesocicloRage;
  if (typeof editarAnterior === 'function') {
    window.editarMesocicloRage = function (clienteId, mesocicloId) {
      const result = editarAnterior.apply(this, arguments);
      requestAnimationFrame(() => montarEditor(clienteId, mesocicloId));
      setTimeout(() => montarEditor(clienteId, mesocicloId), 30);
      return result;
    };
  }

  const verFichaAnterior = window.verFichaCliente;
  if (typeof verFichaAnterior === 'function') {
    window.verFichaCliente = function (clienteId) {
      const result = verFichaAnterior.apply(this, arguments);
      requestAnimationFrame(() => inyectarTablas(clienteId));
      setTimeout(() => inyectarTablas(clienteId), 40);
      setTimeout(() => inyectarTablas(clienteId), 120);
      return result;
    };
  }

  // Normaliza datos existentes sin activar tablas en mesociclos antiguos.
  clientesLista().forEach(cliente => {
    (cliente.mesociclos || []).forEach(normalizarMesociclo);
  });

  window.RageMesocicloEjerciciosVersion = VERSION;
})();