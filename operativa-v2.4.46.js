(() => {
  const VERSION = '2.4.46';
  const FILTER_KEY = 'rageClientStatusFilterV246';
  const HOUR_START = 6 * 60;
  const HOUR_END = 24 * 60;
  const SLOT_MINUTES = 30;

  let clientFilter = loadClientFilter();
  let dragState = null;
  let clickSuppressedUntil = 0;
  let setupTimer = null;

  const clientList = () => {
    try { return Array.isArray(clientes) ? clientes : []; }
    catch (_) { return []; }
  };

  const trainerList = () => {
    try { return Array.isArray(entrenadores) ? entrenadores : []; }
    catch (_) { return []; }
  };

  const clientById = id => clientList().find(client => Number(client.id) === Number(id));
  const trainerById = id => trainerList().find(trainer => Number(trainer.id) === Number(id));

  function saveData() {
    if (typeof guardarDatos === 'function') guardarDatos();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function loadClientFilter() {
    const value = localStorage.getItem(FILTER_KEY);
    return ['todos', 'activos', 'inactivos'].includes(value) ? value : 'todos';
  }

  function assignedTrainerId(client) {
    const id = Number(client?.entrenadorAsignadoId || 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function assignedTrainerName(client) {
    const trainer = trainerById(assignedTrainerId(client));
    return trainer?.nombre || 'Sin entrenador asignado';
  }

  function trainerOptions(selectedId = null, includeInactive = true) {
    const selected = Number(selectedId || 0);
    const trainers = trainerList().filter(trainer => includeInactive || trainer.estado === 'Activo');
    return [
      '<option value="">Sin entrenador asignado</option>',
      ...trainers.map(trainer => {
        const state = trainer.estado && trainer.estado !== 'Activo' ? ` · ${trainer.estado}` : '';
        return `<option value="${Number(trainer.id)}" ${Number(trainer.id) === selected ? 'selected' : ''}>${escapeHtml(trainer.nombre)}${escapeHtml(state)}</option>`;
      })
    ].join('');
  }

  function normalizeClients() {
    let changed = false;
    clientList().forEach(client => {
      if (!Object.prototype.hasOwnProperty.call(client, 'entrenadorAsignadoId')) {
        client.entrenadorAsignadoId = null;
        changed = true;
      }
    });
    if (changed) saveData();
  }

  /* -------------------------------------------------------------------------- */
  /* Entrenador predeterminado del cliente                                      */
  /* -------------------------------------------------------------------------- */

  function ensureNewClientTrainerField() {
    const formGrid = document.querySelector('#alta-cliente-integrada-section .form-grid, #alta-screen .form-grid');
    if (!formGrid) return;

    let wrapper = document.getElementById('clienteEntrenadorAsignadoField');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'clienteEntrenadorAsignadoField';
      wrapper.className = 'labeled-field rage-client-trainer-field';
      wrapper.innerHTML = `
        <label for="clienteEntrenadorAsignado">Entrenador asignado</label>
        <select id="clienteEntrenadorAsignado"></select>`;

      const state = document.getElementById('clienteEstado');
      if (state?.parentElement === formGrid) state.insertAdjacentElement('afterend', wrapper);
      else formGrid.appendChild(wrapper);
    }

    const select = document.getElementById('clienteEntrenadorAsignado');
    if (!select) return;
    const current = select.value;
    const signature = trainerList().filter(trainer => trainer.estado === 'Activo')
      .map(trainer => `${trainer.id}:${trainer.nombre}:${trainer.estado}`)
      .join('|');
    if (select.dataset.rageTrainerOptions !== signature) {
      select.innerHTML = trainerOptions(current, false);
      select.dataset.rageTrainerOptions = signature;
      if (current && [...select.options].some(option => option.value === current)) select.value = current;
    }
  }

  const addClientPrevious = window.agregarCliente;
  if (typeof addClientPrevious === 'function') {
    window.agregarCliente = function () {
      ensureNewClientTrainerField();
      const selectedTrainer = Number(document.getElementById('clienteEntrenadorAsignado')?.value || 0) || null;
      const idsBefore = new Set(clientList().map(client => Number(client.id)));
      const result = addClientPrevious.apply(this, arguments);
      const created = clientList().find(client => !idsBefore.has(Number(client.id)));
      if (created) {
        created.entrenadorAsignadoId = selectedTrainer;
        saveData();
        if (typeof renderClientes === 'function') renderClientes();
      }
      const select = document.getElementById('clienteEntrenadorAsignado');
      if (select) select.value = '';
      return result;
    };
  }

  function augmentClientEditModal(clientId) {
    const client = clientById(clientId);
    const modal = document.getElementById('rage-client-editor');
    const body = modal?.querySelector('.rage-editor-body');
    const saveButton = modal?.querySelector('.rage-editor-save');
    if (!client || !body || !saveButton || body.querySelector('#ecTrainer')) return;

    const field = document.createElement('label');
    field.className = 'rage-editor-field full rage-editor-trainer-field';
    field.innerHTML = `
      <span>Entrenador asignado</span>
      <select id="ecTrainer">${trainerOptions(assignedTrainerId(client), true)}</select>
      <small>Se seleccionará automáticamente al crear nuevas sesiones, aunque podrá cambiarse en cada reserva.</small>`;

    const notes = body.querySelector('#ecNotes')?.closest('.rage-editor-field');
    if (notes) body.insertBefore(field, notes);
    else body.appendChild(field);

    const originalSave = saveButton.onclick;
    saveButton.onclick = function (event) {
      const previous = client.entrenadorAsignadoId ?? null;
      const selected = Number(document.getElementById('ecTrainer')?.value || 0) || null;
      client.entrenadorAsignadoId = selected;
      if (typeof originalSave === 'function') originalSave.call(this, event);

      if (document.getElementById('rage-client-editor')) {
        client.entrenadorAsignadoId = previous;
      } else {
        saveData();
        if (typeof verFichaCliente === 'function') verFichaCliente(client.id);
      }
    };
  }

  const editClientPrevious = window.editarClienteRage;
  if (typeof editClientPrevious === 'function') {
    window.editarClienteRage = function (clientId) {
      const result = editClientPrevious.apply(this, arguments);
      requestAnimationFrame(() => augmentClientEditModal(clientId));
      setTimeout(() => augmentClientEditModal(clientId), 40);
      return result;
    };
  }

  function setDefaultTrainerForAgenda(clientId = null) {
    const clientSelect = document.getElementById('diaClienteSelect');
    const trainerSelect = document.getElementById('diaEntrenadorSelect');
    if (!clientSelect || !trainerSelect) return;

    const client = clientById(clientId ?? clientSelect.value);
    const trainerId = assignedTrainerId(client);
    if (trainerId && [...trainerSelect.options].some(option => Number(option.value) === trainerId)) {
      trainerSelect.value = String(trainerId);
    }
  }

  function bindAgendaClientTrainer() {
    const clientSelect = document.getElementById('diaClienteSelect');
    if (!clientSelect) return;
    if (clientSelect.dataset.rageTrainerDefaultBound !== '1') {
      clientSelect.dataset.rageTrainerDefaultBound = '1';
      clientSelect.addEventListener('change', () => setDefaultTrainerForAgenda());
    }
    setDefaultTrainerForAgenda();
  }

  const prepareAgendaPrevious = window.prepararFormularioAgendaDia;
  if (typeof prepareAgendaPrevious === 'function') {
    window.prepararFormularioAgendaDia = function () {
      const result = prepareAgendaPrevious.apply(this, arguments);
      bindAgendaClientTrainer();
      return result;
    };
  }

  function selectTrainerInClientSession(clientId) {
    const client = clientById(clientId);
    const select = document.querySelector('.cliente-session-backdrop #clienteSesionEntrenador');
    const trainerId = assignedTrainerId(client);
    if (select && trainerId && [...select.options].some(option => Number(option.value) === trainerId)) {
      select.value = String(trainerId);
    }
  }

  function setCurrentClientSessionDefault() {
    const select = document.querySelector('.cliente-session-backdrop #clienteSesionEntrenador');
    if (!select || select.dataset.rageDefaultTrainerApplied === '1') return;
    let current = null;
    try { current = clienteActual || null; } catch (_) {}
    const trainerId = assignedTrainerId(current);
    if (trainerId && [...select.options].some(option => Number(option.value) === trainerId)) {
      select.value = String(trainerId);
    }
    select.dataset.rageDefaultTrainerApplied = '1';
  }

  ['abrirSesionCliente', 'abrirSesionDesdeCliente'].forEach(functionName => {
    const previous = window[functionName];
    if (typeof previous !== 'function') return;
    window[functionName] = function (clientId) {
      const result = previous.apply(this, arguments);
      requestAnimationFrame(() => selectTrainerInClientSession(clientId));
      setTimeout(() => selectTrainerInClientSession(clientId), 40);
      return result;
    };
  });

  function augmentClientPresentation(clientId) {
    const client = clientById(clientId);
    if (!client) return;

    const detail = document.getElementById('clienteFicha');
    const firstCard = detail?.querySelector('.ficha-card');
    if (firstCard) {
      let line = firstCard.querySelector('.rage-client-assigned-trainer');
      if (!line) {
        line = document.createElement('p');
        line.className = 'rage-client-assigned-trainer';
        firstCard.appendChild(line);
      }
      line.innerHTML = `🏋️ <strong>Entrenador:</strong> ${escapeHtml(assignedTrainerName(client))}`;
    }
  }

  const clientRowPrevious = window.crearFilaCliente;
  if (typeof clientRowPrevious === 'function') {
    window.crearFilaCliente = function (client) {
      const row = clientRowPrevious.apply(this, arguments);
      if (!row) return row;
      row.dataset.clientId = String(client.id);
      row.dataset.clientStatus = String(client.estado || '').toLowerCase();
      const sub = row.querySelector('.cliente-sub');
      if (sub) sub.textContent = `${sub.textContent} · ${assignedTrainerName(client)}`;
      return row;
    };
  }

  const viewClientPrevious = window.verFichaCliente;
  if (typeof viewClientPrevious === 'function') {
    window.verFichaCliente = function (clientId) {
      const result = viewClientPrevious.apply(this, arguments);
      requestAnimationFrame(() => augmentClientPresentation(clientId));
      setTimeout(() => augmentClientPresentation(clientId), 60);
      setTimeout(() => augmentClientPresentation(clientId), 160);
      return result;
    };
  }

  /* -------------------------------------------------------------------------- */
  /* Filtro Activos / Inactivos                                                 */
  /* -------------------------------------------------------------------------- */

  function filterCounts() {
    const active = clientList().filter(client => String(client.estado).toLowerCase() === 'activo').length;
    const inactive = clientList().filter(client => String(client.estado).toLowerCase() === 'inactivo').length;
    return { all: clientList().length, active, inactive };
  }

  function ensureClientFilters() {
    const toolbar = document.querySelector('#clientes-section .toolbar');
    if (!toolbar) return;

    let filters = toolbar.querySelector('.rage-client-status-filter');
    if (!filters) {
      filters = document.createElement('div');
      filters.className = 'rage-client-status-filter';
      filters.setAttribute('role', 'group');
      filters.setAttribute('aria-label', 'Filtrar clientes por estado');
      filters.innerHTML = `
        <button type="button" data-client-filter="todos">Todos <span>0</span></button>
        <button type="button" data-client-filter="activos">Activos <span>0</span></button>
        <button type="button" data-client-filter="inactivos">Inactivos <span>0</span></button>`;
      const addButton = toolbar.querySelector('.add-btn');
      toolbar.insertBefore(filters, addButton || null);

      filters.addEventListener('click', event => {
        const button = event.target.closest('[data-client-filter]');
        if (!button) return;
        clientFilter = button.dataset.clientFilter;
        localStorage.setItem(FILTER_KEY, clientFilter);
        if (typeof renderClientes === 'function') renderClientes();
      });
    }

    const counts = filterCounts();
    const values = { todos: counts.all, activos: counts.active, inactivos: counts.inactive };
    Object.entries(values).forEach(([key, value]) => {
      const badge = filters.querySelector(`[data-client-filter="${key}"] span`);
      if (badge && badge.textContent !== String(value)) badge.textContent = String(value);
    });
    filters.querySelectorAll('[data-client-filter]').forEach(button => {
      const active = button.dataset.clientFilter === clientFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  window.renderClientes = function () {
    const list = document.getElementById('clientesLista');
    const search = (document.getElementById('buscadorClientes')?.value || '').trim().toLowerCase();
    if (!list) return;

    ensureClientFilters();
    if (typeof verificarEstadoBonos === 'function') verificarEstadoBonos();

    const filtered = clientList().filter(client => {
      const status = String(client.estado || '').toLowerCase();
      const statusMatch = clientFilter === 'todos' ||
        (clientFilter === 'activos' && status === 'activo') ||
        (clientFilter === 'inactivos' && status === 'inactivo');
      const haystack = [client.nombre, client.telefono, client.email, assignedTrainerName(client)]
        .map(value => String(value || '').toLowerCase())
        .join(' ');
      return statusMatch && haystack.includes(search);
    });

    list.innerHTML = '';
    if (!filtered.length) {
      const labels = { todos: 'clientes', activos: 'clientes activos', inactivos: 'clientes inactivos' };
      list.innerHTML = `<div class="rage-client-filter-empty">No hay ${labels[clientFilter]} que coincidan con la búsqueda.</div>`;
      return;
    }

    filtered.forEach(client => list.appendChild(window.crearFilaCliente(client, true)));
  };

  /* -------------------------------------------------------------------------- */
  /* Arrastrar citas en el calendario                                           */
  /* -------------------------------------------------------------------------- */

  function minutesFromHour(hour) {
    const [hours, minutes] = String(hour || '').split(':').map(Number);
    return hours * 60 + minutes;
  }

  function hourFromSlot(slot) {
    const total = HOUR_START + slot * SLOT_MINUTES;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function currentSlotHeight() {
    const panel = document.querySelector('#resumen-section .calendario-panel');
    const cssValue = parseFloat(getComputedStyle(panel || document.documentElement).getPropertyValue('--rage-calendar-slot'));
    if (Number.isFinite(cssValue) && cssValue > 0) return cssValue;
    const slot = document.querySelector('#resumen-section .week-slot-fixed');
    return slot?.getBoundingClientRect().height || 42;
  }

  function identifyCalendarEvents() {
    const calendar = document.querySelector('#resumen-section .week-calendar-fixed');
    if (!calendar) return;

    const headers = [...calendar.querySelectorAll('.week-day-header-fixed')];
    const columns = [...calendar.querySelectorAll('.week-day-column-fixed')];
    headers.forEach((header, index) => {
      const match = (header.getAttribute('onclick') || '').match(/abrirAgendaDia\('([^']+)'/);
      if (columns[index] && match) columns[index].dataset.rageDate = match[1];
    });

    const used = new Set();
    calendar.querySelectorAll('.week-event-fixed').forEach(eventElement => {
      const clickCode = eventElement.getAttribute('onclick') || '';
      const doubleCode = eventElement.getAttribute('ondblclick') || '';
      const dateHour = clickCode.match(/abrirAgendaDia\('([^']+)'\s*,\s*'([^']+)'\)/);
      const clientMatch = doubleCode.match(/verFichaCliente\((\d+)\)/);
      if (!dateHour || !clientMatch) return;

      const client = clientById(Number(clientMatch[1]));
      if (!client) return;
      const session = (client.clases || []).find(item =>
        !used.has(`${client.id}:${item.id}`) && item.fecha === dateHour[1] && item.hora === dateHour[2]
      );
      if (!session) return;

      used.add(`${client.id}:${session.id}`);
      eventElement.dataset.rageClientId = String(client.id);
      eventElement.dataset.rageSessionId = String(session.id);
      eventElement.dataset.rageDate = session.fecha;
      eventElement.dataset.rageHour = session.hora;
      eventElement.dataset.rageDuration = String(Number(session.duracion || client.bonoDuracion || 60));
      eventElement.dataset.rageTrainerId = String(Number(session.entrenadorId || 0));
      eventElement.classList.add('rage-calendar-draggable');
      eventElement.setAttribute('title', `${client.nombre} · Mantén pulsado y arrastra para mover`);
      bindDraggableEvent(eventElement);
    });
  }

  function sessionRecord(clientId, sessionId) {
    const client = clientById(clientId);
    const session = (client?.clases || []).find(item => Number(item.id) === Number(sessionId));
    return client && session ? { client, session } : null;
  }

  function overlapAt(record, date, hour) {
    const trainerId = Number(record.session.entrenadorId || assignedTrainerId(record.client) || 0);
    if (!trainerId) return null;

    const start = minutesFromHour(hour);
    const duration = Number(record.session.duracion || record.client.bonoDuracion || 60);
    const end = start + duration;

    for (const client of clientList()) {
      for (const session of (client.clases || [])) {
        if (Number(client.id) === Number(record.client.id) && Number(session.id) === Number(record.session.id)) continue;
        if (session.fecha !== date) continue;
        if (session.estado === 'Cancelada' || session.estado === 'Cancelada excepcional') continue;
        if (Number(session.entrenadorId || 0) !== trainerId) continue;

        const otherStart = minutesFromHour(session.hora);
        const otherDuration = Number(session.duracion || client.bonoDuracion || 60);
        if (start < otherStart + otherDuration && end > otherStart) {
          return { client, session };
        }
      }
    }
    return null;
  }

  function showOperationToast(message, type = 'ok') {
    document.querySelector('.rage-operation-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = `rage-operation-toast is-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => toast.classList.remove('is-visible'), 1600);
    setTimeout(() => toast.remove(), 1900);
  }

  function createDragVisual(state) {
    const rect = state.element.getBoundingClientRect();
    const ghost = state.element.cloneNode(true);
    ghost.classList.add('rage-calendar-drag-ghost');
    ghost.removeAttribute('onclick');
    ghost.removeAttribute('ondblclick');
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: '1000000',
      pointerEvents: 'none',
      margin: '0',
      transform: 'none'
    });
    document.body.appendChild(ghost);

    const preview = document.createElement('div');
    preview.className = 'rage-calendar-drop-preview';
    document.body.appendChild(preview);

    state.ghost = ghost;
    state.preview = preview;
    state.offsetX = state.startX - rect.left;
    state.offsetSlots = Math.max(0, (state.startY - rect.top) / currentSlotHeight());
    state.element.classList.add('is-drag-source');
    document.documentElement.classList.add('rage-calendar-drag-active');
    try { state.element.setPointerCapture(state.pointerId); } catch (_) {}
    if (navigator.vibrate) navigator.vibrate(22);
  }

  function autoScrollCalendar(calendar, x, y) {
    const rect = calendar.getBoundingClientRect();
    const edge = 42;
    if (y < rect.top + edge) calendar.scrollTop -= 14;
    else if (y > rect.bottom - edge) calendar.scrollTop += 14;
    if (x < rect.left + edge) calendar.scrollLeft -= 16;
    else if (x > rect.right - edge) calendar.scrollLeft += 16;
  }

  function targetAtPointer(state, x, y) {
    const calendar = state.calendar;
    autoScrollCalendar(calendar, x, y);
    const element = document.elementFromPoint(x, y);
    const column = element?.closest?.('.week-day-column-fixed');
    if (!column || !calendar.contains(column)) return null;

    const date = column.dataset.rageDate;
    if (!date) return null;
    const slotHeight = currentSlotHeight();
    const rect = column.getBoundingClientRect();
    const duration = Number(state.record.session.duracion || state.record.client.bonoDuracion || 60);
    const durationSlots = Math.max(1, duration / SLOT_MINUTES);
    const maxStartSlot = Math.max(0, (HOUR_END - HOUR_START) / SLOT_MINUTES - durationSlots);
    const raw = ((y - rect.top) / slotHeight) - state.offsetSlots;
    const slot = Math.max(0, Math.min(maxStartSlot, Math.round(raw)));
    const hour = hourFromSlot(slot);
    const overlap = overlapAt(state.record, date, hour);

    return { column, date, hour, slot, slotHeight, durationSlots, overlap };
  }

  function updateDragVisual(state, x, y) {
    state.lastX = x;
    state.lastY = y;
    if (state.ghost) {
      state.ghost.style.left = `${x - state.offsetX}px`;
      state.ghost.style.top = `${y - state.offsetSlots * currentSlotHeight()}px`;
    }

    const target = targetAtPointer(state, x, y);
    state.target = target;
    if (!target || !state.preview) {
      if (state.preview) state.preview.style.display = 'none';
      return;
    }

    const rect = target.column.getBoundingClientRect();
    const top = rect.top + target.slot * target.slotHeight + 2;
    const height = Math.max(8, target.durationSlots * target.slotHeight - 4);
    Object.assign(state.preview.style, {
      display: 'block',
      left: `${rect.left + 3}px`,
      top: `${top}px`,
      width: `${Math.max(18, rect.width - 6)}px`,
      height: `${height}px`
    });
    state.preview.classList.toggle('is-invalid', !!target.overlap);
    state.preview.textContent = target.overlap ? 'Horario ocupado' : `${target.hour}`;
  }

  function activateDrag(state) {
    if (!state || state.active) return;
    state.active = true;
    clearTimeout(state.longPressTimer);
    createDragVisual(state);
    updateDragVisual(state, state.lastX, state.lastY);
  }

  function clearDrag(state) {
    if (!state) return;
    clearTimeout(state.longPressTimer);
    state.ghost?.remove();
    state.preview?.remove();
    state.element?.classList.remove('is-drag-source');
    document.documentElement.classList.remove('rage-calendar-drag-active');
    try { state.element?.releasePointerCapture(state.pointerId); } catch (_) {}
  }

  function finishDrag(state) {
    if (!state?.active) {
      clearDrag(state);
      return;
    }

    clickSuppressedUntil = Date.now() + 700;
    const target = state.target;
    const record = state.record;
    clearDrag(state);

    if (!target) {
      showOperationToast('No se ha movido la sesión', 'warning');
      return;
    }
    if (target.overlap) {
      showOperationToast(`Ese entrenador ya tiene una sesión con ${target.overlap.client.nombre}`, 'error');
      return;
    }
    if (record.session.fecha === target.date && record.session.hora === target.hour) return;

    record.session.fecha = target.date;
    record.session.hora = target.hour;
    saveData();
    if (typeof actualizarResumen === 'function') actualizarResumen();
    if (typeof renderCalendarioSemanal === 'function') renderCalendarioSemanal();
    showOperationToast(`Sesión movida al ${typeof formatearFechaES === 'function' ? formatearFechaES(target.date) : target.date} a las ${target.hour}`);
  }

  function bindDraggableEvent(element) {
    if (element.dataset.rageDragBound === '1') return;
    element.dataset.rageDragBound = '1';

    element.addEventListener('contextmenu', event => event.preventDefault());
    element.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    element.addEventListener('touchend', event => event.stopPropagation(), { passive: true });

    element.addEventListener('pointerdown', event => {
      if (event.button != null && event.button !== 0) return;
      const record = sessionRecord(element.dataset.rageClientId, element.dataset.rageSessionId);
      const calendar = element.closest('.week-calendar-fixed');
      if (!record || !calendar) return;

      dragState = {
        element,
        calendar,
        record,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        active: false,
        target: null,
        longPressTimer: null
      };

      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        dragState.longPressTimer = setTimeout(() => {
          if (dragState) activateDrag(dragState);
        }, 300);
      }
    });
  }

  document.addEventListener('pointermove', event => {
    const state = dragState;
    if (!state || event.pointerId !== state.pointerId) return;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);

    if (!state.active) {
      if (state.pointerType === 'mouse' && distance >= 5) activateDrag(state);
      else if ((state.pointerType === 'touch' || state.pointerType === 'pen') && distance >= 8) {
        activateDrag(state);
      }
    }

    if (state.active) {
      event.preventDefault();
      event.stopPropagation();
      updateDragVisual(state, event.clientX, event.clientY);
    }
  }, { passive: false, capture: true });

  document.addEventListener('pointerup', event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const state = dragState;
    dragState = null;
    finishDrag(state);
  }, true);

  document.addEventListener('pointercancel', event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const state = dragState;
    dragState = null;
    clearDrag(state);
  }, true);

  document.addEventListener('click', event => {
    if (Date.now() >= clickSuppressedUntil) return;
    if (!event.target.closest?.('.week-event-fixed')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  function setupCalendarOperations() {
    identifyCalendarEvents();
  }

  const calendarRenderPrevious = window.renderCalendarioSemanal;
  if (typeof calendarRenderPrevious === 'function') {
    window.renderCalendarioSemanal = function () {
      const result = calendarRenderPrevious.apply(this, arguments);
      requestAnimationFrame(setupCalendarOperations);
      setTimeout(setupCalendarOperations, 60);
      setTimeout(setupCalendarOperations, 180);
      return result;
    };
  }

  /* -------------------------------------------------------------------------- */
  /* Inicialización                                                             */
  /* -------------------------------------------------------------------------- */

  function setupAll() {
    normalizeClients();
    ensureNewClientTrainerField();
    ensureClientFilters();
    bindAgendaClientTrainer();
    setCurrentClientSessionDefault();
    setupCalendarOperations();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(setupTimer);
    setupTimer = setTimeout(setupAll, 20);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const trainerRenderPrevious = window.renderEntrenadores;
  if (typeof trainerRenderPrevious === 'function') {
    window.renderEntrenadores = function () {
      const result = trainerRenderPrevious.apply(this, arguments);
      ensureNewClientTrainerField();
      return result;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAll, { once: true });
  } else {
    setupAll();
  }

  window.RageOperativa = {
    version: VERSION,
    filterClients: value => {
      if (!['todos', 'activos', 'inactivos'].includes(value)) return;
      clientFilter = value;
      localStorage.setItem(FILTER_KEY, value);
      window.renderClientes();
    },
    refreshCalendarDrag: setupCalendarOperations
  };
})();