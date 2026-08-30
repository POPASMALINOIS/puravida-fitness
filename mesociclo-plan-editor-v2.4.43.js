(() => {
  const VERSION = '2.4.43';
  const MODAL_ID = 'rageExercisePlanEditor';
  let activeClientId = null;
  let revealTimers = [];

  const clientesLista = () => {
    try { return Array.isArray(clientes) ? clientes : []; }
    catch (_) { return []; }
  };

  const clientePorId = id => clientesLista().find(c => Number(c.id) === Number(id));

  const mesocicloPorId = (cliente, id) =>
    (cliente?.mesociclos || []).find(m => Number(m.id) === Number(id));

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const guardar = () => {
    if (typeof guardarDatos === 'function') guardarDatos();
  };

  function datalistsHtml() {
    return `
      <datalist id="ragePlanWeightSuggestions">
        <option value="Sin peso"></option><option value="Peso corporal"></option>
        <option value="2,5 kg"></option><option value="5 kg"></option><option value="7,5 kg"></option>
        <option value="10 kg"></option><option value="12,5 kg"></option><option value="15 kg"></option>
        <option value="20 kg"></option><option value="25 kg"></option><option value="30 kg"></option>
        <option value="35 kg"></option><option value="40 kg"></option><option value="50 kg"></option>
        <option value="60 kg"></option><option value="70 kg"></option><option value="75 kg"></option>
      </datalist>
      <datalist id="ragePlanRepSuggestions">
        <option value="5"></option><option value="8"></option><option value="10"></option>
        <option value="12"></option><option value="15"></option><option value="20"></option>
        <option value="3 x 8"></option><option value="3 x 10"></option><option value="3 x 12"></option>
        <option value="4 x 8"></option><option value="4 x 10"></option><option value="Al fallo"></option>
      </datalist>`;
  }

  function filaHtml(data = {}, index = 0) {
    return `
      <article class="rage-plan-row" data-plan-row data-exercise-id="${esc(data.id || '')}">
        <div class="rage-plan-row-head">
          <span>Ejercicio ${index + 1}</span>
          <button class="rage-plan-remove" type="button" aria-label="Eliminar ejercicio">Eliminar</button>
        </div>
        <div class="rage-plan-row-grid">
          <label class="rage-plan-field full">
            <span>Ejercicio</span>
            <input class="rage-plan-name" type="text" autocomplete="off" placeholder="Escribe el ejercicio" value="${esc(data.ejercicio || '')}">
          </label>
          <label class="rage-plan-field">
            <span>Peso</span>
            <input class="rage-plan-weight" type="text" list="ragePlanWeightSuggestions" autocomplete="off" placeholder="Ej. 12,5 kg" value="${esc(data.peso || '')}">
          </label>
          <label class="rage-plan-field">
            <span>Repes</span>
            <input class="rage-plan-reps" type="text" list="ragePlanRepSuggestions" autocomplete="off" placeholder="Ej. 10 o 3 x 12" value="${esc(data.repes || '')}">
          </label>
          <label class="rage-plan-field full">
            <span>Notas</span>
            <textarea class="rage-plan-notes" rows="3" placeholder="Técnica, molestias, ayuda, progresión...">${esc(data.notas || '')}</textarea>
          </label>
        </div>
      </article>`;
  }

  function renumerar(container) {
    [...container.querySelectorAll('[data-plan-row]')].forEach((row, index) => {
      const label = row.querySelector('.rage-plan-row-head span');
      if (label) label.textContent = `Ejercicio ${index + 1}`;
    });
  }

  function bindFila(row, container) {
    row.querySelector('.rage-plan-remove')?.addEventListener('click', () => {
      const total = container.querySelectorAll('[data-plan-row]').length;
      if (total === 1) {
        row.querySelectorAll('input, textarea').forEach(field => { field.value = ''; });
        return;
      }
      row.remove();
      renumerar(container);
    });
  }

  function agregarFila(container, data = {}, focus = true) {
    const template = document.createElement('template');
    const index = container.querySelectorAll('[data-plan-row]').length;
    template.innerHTML = filaHtml(data, index).trim();
    const row = template.content.firstElementChild;
    container.appendChild(row);
    bindFila(row, container);
    if (focus) {
      requestAnimationFrame(() => {
        row.querySelector('.rage-plan-name')?.focus({ preventScroll: true });
        revelarCampo(row.querySelector('.rage-plan-name'));
      });
    }
    return row;
  }

  function leerFilas(container) {
    return [...container.querySelectorAll('[data-plan-row]')]
      .map(row => ({
        id: Number(row.dataset.exerciseId) || Date.now() + Math.floor(Math.random() * 100000),
        ejercicio: row.querySelector('.rage-plan-name')?.value.trim() || '',
        peso: row.querySelector('.rage-plan-weight')?.value.trim() || '',
        repes: row.querySelector('.rage-plan-reps')?.value.trim() || '',
        notas: row.querySelector('.rage-plan-notes')?.value.trim() || ''
      }))
      .filter(item => item.ejercicio || item.peso || item.repes || item.notas);
  }

  function cerrarEditor() {
    document.getElementById(MODAL_ID)?.remove();
    document.documentElement.classList.remove('rage-plan-editor-open', 'rage-plan-keyboard-active');
  }

  function refrescarFicha(clienteId) {
    guardar();
    cerrarEditor();
    if (typeof verFichaCliente === 'function') verFichaCliente(clienteId);
    setTimeout(() => {
      if (typeof cambiarTrackingTabRage === 'function') cambiarTrackingTabRage('mesociclos');
      instalarBotones(clienteId);
    }, 0);
  }

  function guardarPlan(clienteId, mesocicloId) {
    const cliente = clientePorId(clienteId);
    const mesociclo = mesocicloPorId(cliente, mesocicloId);
    const container = document.querySelector(`#${MODAL_ID} .rage-plan-rows`);
    if (!cliente || !mesociclo || !container) return;

    const ejercicios = leerFilas(container);
    if (!ejercicios.length) {
      if (!confirm('No hay ejercicios cumplimentados. ¿Quieres dejar este mesociclo sin tabla de ejercicios?')) return;
      mesociclo.tablaEjerciciosActiva = false;
      mesociclo.ejercicios = [];
    } else {
      mesociclo.tablaEjerciciosActiva = true;
      mesociclo.ejercicios = ejercicios;
    }

    refrescarFicha(cliente.id);
  }

  function abrirEditor(clienteId, mesocicloId) {
    const cliente = clientePorId(clienteId);
    const mesociclo = mesocicloPorId(cliente, mesocicloId);
    if (!cliente || !mesociclo) return;

    cerrarEditor();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'rage-plan-editor-overlay';
    overlay.innerHTML = `
      <div class="rage-plan-editor-backdrop"></div>
      <section class="rage-plan-editor-shell" role="dialog" aria-modal="true" aria-label="Editar plan de ejercicios">
        <header class="rage-plan-editor-head">
          <div>
            <span>PLAN DE EJERCICIOS</span>
            <h3>Editar ejercicios</h3>
            <p>${esc(cliente.nombre)} · ${esc(mesociclo.objetivo || 'Mesociclo')}</p>
          </div>
          <div class="rage-plan-head-actions">
            <button class="rage-plan-head-save" type="button">Guardar</button>
            <button class="rage-plan-close" type="button" aria-label="Cerrar">×</button>
          </div>
        </header>
        <div class="rage-plan-editor-toolbar">
          <p>Edita libremente ejercicios, peso, repeticiones y notas.</p>
          <button class="rage-plan-add" type="button">+ Añadir ejercicio</button>
        </div>
        <div class="rage-plan-editor-body">
          <div class="rage-plan-rows"></div>
          ${datalistsHtml()}
          <div class="rage-plan-keyboard-spacer" aria-hidden="true"></div>
        </div>
        <footer class="rage-plan-editor-foot">
          <button class="rage-plan-cancel" type="button">Cancelar</button>
          <button class="rage-plan-save" type="button">Guardar plan</button>
        </footer>
      </section>`;

    document.body.appendChild(overlay);
    document.documentElement.classList.add('rage-plan-editor-open');

    const rows = overlay.querySelector('.rage-plan-rows');
    const existentes = Array.isArray(mesociclo.ejercicios) ? mesociclo.ejercicios : [];
    if (existentes.length) existentes.forEach(item => agregarFila(rows, item, false));
    else agregarFila(rows, {}, false);

    const close = cerrarEditor;
    overlay.querySelector('.rage-plan-editor-backdrop').onclick = close;
    overlay.querySelector('.rage-plan-close').onclick = close;
    overlay.querySelector('.rage-plan-cancel').onclick = close;
    overlay.querySelector('.rage-plan-add').onclick = () => agregarFila(rows);
    overlay.querySelector('.rage-plan-head-save').onclick = () => guardarPlan(clienteId, mesocicloId);
    overlay.querySelector('.rage-plan-save').onclick = () => guardarPlan(clienteId, mesocicloId);

    requestAnimationFrame(actualizarAlturaEditor);
  }

  window.editarPlanEjerciciosRage = abrirEditor;

  function instalarBotones(clienteId) {
    const cliente = clientePorId(clienteId);
    const list = document.getElementById('mesociclosListaRage');
    if (!cliente || !list) return;

    const mesociclos = [...(cliente.mesociclos || [])]
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    const cards = [...list.querySelectorAll('.meso-item')];

    cards.forEach((card, index) => {
      const mesociclo = mesociclos[index];
      const display = card.querySelector('.meso-exercise-display');
      const title = display?.querySelector('.meso-exercise-display-title');
      if (!mesociclo || !display || !title) return;

      let button = title.querySelector('.rage-plan-edit-button');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'rage-plan-edit-button';
        button.textContent = 'Editar plan';
        title.appendChild(button);
      }
      button.onclick = () => abrirEditor(cliente.id, mesociclo.id);
    });
  }

  const verFichaAnterior = window.verFichaCliente;
  if (typeof verFichaAnterior === 'function') {
    window.verFichaCliente = function (clienteId) {
      activeClientId = clienteId;
      const result = verFichaAnterior.apply(this, arguments);
      requestAnimationFrame(() => instalarBotones(clienteId));
      setTimeout(() => instalarBotones(clienteId), 50);
      setTimeout(() => instalarBotones(clienteId), 160);
      return result;
    };
  }

  const observer = new MutationObserver(() => {
    if (activeClientId != null && document.getElementById('clienteTrackingRage')) {
      instalarBotones(activeClientId);
    }
    if (!document.getElementById(MODAL_ID) && !document.getElementById('rageTrackingModal')) {
      document.documentElement.classList.remove('rage-plan-keyboard-active');
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  function campoEditable(element) {
    return !!element && element.matches?.('input, textarea, select, [contenteditable="true"]');
  }

  function contenedorScroll(element) {
    if (element.closest?.(`#${MODAL_ID}`)) return element.closest('.rage-plan-editor-shell')?.querySelector('.rage-plan-editor-body');
    if (element.closest?.('#rageTrackingModal')) return element.closest('.tracking-modal')?.querySelector('.tracking-modal-body');
    return null;
  }

  function actualizarAlturaEditor() {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 600);
    const top = Math.max(0, Math.round(viewport?.offsetTop || 0));
    document.documentElement.style.setProperty('--rage-plan-viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--rage-plan-viewport-top', `${top}px`);
  }

  function revelarCampo(element) {
    if (!campoEditable(element)) return;
    const container = contenedorScroll(element);
    if (!container) return;

    document.documentElement.classList.add('rage-plan-keyboard-active');
    const row = element.closest('[data-plan-row], [data-exercise-row], .tracking-field') || element;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const target = container.scrollTop + rowRect.top - containerRect.top - 10;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });

    // El teclado flotante de Samsung no reduce el viewport. Forzamos el campo a la mitad superior.
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const safeBottom = Math.max(230, window.innerHeight * 0.48);
      if (rect.bottom > safeBottom) {
        container.scrollBy({ top: rect.bottom - safeBottom + 36, behavior: 'smooth' });
      }
    }, 80);
  }

  function programarRevelado(element) {
    revealTimers.forEach(clearTimeout);
    revealTimers = [0, 80, 180, 340, 620, 900].map(delay =>
      setTimeout(() => {
        actualizarAlturaEditor();
        revelarCampo(element);
      }, delay)
    );
  }

  document.addEventListener('focusin', event => {
    const target = event.target;
    if (!campoEditable(target)) return;
    if (!target.closest?.(`#${MODAL_ID}, #rageTrackingModal`)) return;
    programarRevelado(target);
  }, true);

  document.addEventListener('focusout', () => {
    setTimeout(() => {
      const active = document.activeElement;
      if (!active?.closest?.(`#${MODAL_ID}, #rageTrackingModal`)) {
        document.documentElement.classList.remove('rage-plan-keyboard-active');
      }
    }, 240);
  }, true);

  window.visualViewport?.addEventListener('resize', () => {
    actualizarAlturaEditor();
    const active = document.activeElement;
    if (active?.closest?.(`#${MODAL_ID}, #rageTrackingModal`)) programarRevelado(active);
  }, { passive: true });

  window.visualViewport?.addEventListener('scroll', actualizarAlturaEditor, { passive: true });
  window.addEventListener('resize', actualizarAlturaEditor, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(actualizarAlturaEditor, 100);
    setTimeout(actualizarAlturaEditor, 450);
  }, { passive: true });

  actualizarAlturaEditor();
  window.RagePlanEditorVersion = VERSION;
})();