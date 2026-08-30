(() => {
  if (window.RageRecurrenciasVersion) return;

  const VERSION = '2.4.47';
  const MODAL_ID = 'rageRecurringModal';
  const MAX_DAYS = 730;
  let activeClientId = null;
  let pendingClientId = null;
  let viewportTimers = [];

  const clientesLista = () => {
    try { return Array.isArray(clientes) ? clientes : []; }
    catch (_) { return []; }
  };

  const entrenadoresLista = () => {
    try { return Array.isArray(entrenadores) ? entrenadores : []; }
    catch (_) { return []; }
  };

  const clientePorId = id => clientesLista().find(cliente => Number(cliente.id) === Number(id));
  const entrenadorPorId = id => entrenadoresLista().find(entrenador => Number(entrenador.id) === Number(id));

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function guardar() {
    if (typeof guardarDatos === 'function') guardarDatos();
  }

  function hoyISO() {
    const fecha = new Date();
    return fechaISO(fecha);
  }

  function parseFechaISO(value) {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function fechaISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function fechaES(value) {
    try { return typeof formatearFechaES === 'function' ? formatearFechaES(value) : value; }
    catch (_) { return value || ''; }
  }

  function sumarDias(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function sumarMeses(date, months) {
    const result = new Date(date);
    const originalDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
  }

  function diaSemanaISO(date) {
    const day = date.getDay();
    return day === 0 ? 7 : day;
  }

  function minutosHora(value) {
    const [hours, minutes] = String(value || '').split(':').map(Number);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : NaN;
  }

  function entrenadorAsignadoId(cliente) {
    const id = Number(cliente?.entrenadorAsignadoId || 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function entrenadorPredeterminado(cliente) {
    const assigned = entrenadorPorId(entrenadorAsignadoId(cliente));
    if (assigned) return assigned;
    return entrenadoresLista().find(entrenador => entrenador.estado === 'Activo') || entrenadoresLista()[0] || null;
  }

  function opcionesEntrenadores(selectedId) {
    const selected = Number(selectedId || 0);
    const list = entrenadoresLista().filter(entrenador => entrenador.estado === 'Activo' || Number(entrenador.id) === selected);
    return list.map(entrenador => `
      <option value="${Number(entrenador.id)}" ${Number(entrenador.id) === selected ? 'selected' : ''}>
        ${esc(entrenador.nombre)}${entrenador.estado && entrenador.estado !== 'Activo' ? ` · ${esc(entrenador.estado)}` : ''}
      </option>`).join('');
  }

  function cerrarModal() {
    document.getElementById(MODAL_ID)?.remove();
    document.documentElement.classList.remove('rage-recurring-open', 'rage-recurring-keyboard');
    viewportTimers.forEach(clearTimeout);
    viewportTimers = [];
  }

  function actualizarViewport() {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight || 700);
    const top = Math.max(0, Math.round(viewport?.offsetTop || 0));
    document.documentElement.style.setProperty('--rage-recurring-vh', `${Math.max(250, height)}px`);
    document.documentElement.style.setProperty('--rage-recurring-top', `${top}px`);
  }

  function revelarCampo(field) {
    if (!field?.closest?.(`#${MODAL_ID}`)) return;
    document.documentElement.classList.add('rage-recurring-keyboard');
    const body = field.closest('.rage-recurring-shell')?.querySelector('.rage-recurring-body');
    if (!body) return;
    const block = field.closest('.rage-recurring-field, .rage-recurring-days, .rage-recurring-period') || field;
    const bodyRect = body.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const target = body.scrollTop + blockRect.top - bodyRect.top - 14;
    body.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });

    setTimeout(() => {
      const rect = field.getBoundingClientRect();
      const safeBottom = Math.max(230, (window.visualViewport?.height || window.innerHeight) * 0.52);
      if (rect.bottom > safeBottom) body.scrollBy({ top: rect.bottom - safeBottom + 40, behavior: 'smooth' });
    }, 100);
  }

  function programarRevelado(field) {
    viewportTimers.forEach(clearTimeout);
    viewportTimers = [50, 160, 320, 560, 850].map(delay => setTimeout(() => {
      actualizarViewport();
      revelarCampo(field);
    }, delay));
  }

  function diasSeleccionados(modal) {
    return [...modal.querySelectorAll('[data-rage-recurring-day]:checked')].map(input => Number(input.value));
  }

  function fechaFinDesdeFormulario(modal, startDate) {
    const mode = modal.querySelector('#rageRecurringPeriodMode')?.value || 'weeks';
    if (mode === 'until') return parseFechaISO(modal.querySelector('#rageRecurringUntil')?.value);

    const amount = Math.max(1, Math.min(104, Math.trunc(Number(modal.querySelector('#rageRecurringPeriodAmount')?.value || 1))));
    if (mode === 'months') return sumarDias(sumarMeses(startDate, amount), -1);
    return sumarDias(startDate, amount * 7 - 1);
  }

  function fechasCandidatas(modal) {
    const start = parseFechaISO(modal.querySelector('#rageRecurringStart')?.value);
    const end = start ? fechaFinDesdeFormulario(modal, start) : null;
    const days = new Set(diasSeleccionados(modal));
    if (!start || !end || end < start || !days.size) return [];

    const result = [];
    for (let date = new Date(start), index = 0; date <= end && index <= MAX_DAYS; date = sumarDias(date, 1), index += 1) {
      if (days.has(diaSemanaISO(date))) result.push(fechaISO(date));
    }
    return result;
  }

  function actualizarResumenModal(modal) {
    const output = modal.querySelector('#rageRecurringPreview');
    if (!output) return;
    const dates = fechasCandidatas(modal);
    const start = modal.querySelector('#rageRecurringStart')?.value;
    const endDate = start ? fechaFinDesdeFormulario(modal, parseFechaISO(start)) : null;
    if (!dates.length || !start || !endDate) {
      output.textContent = 'Selecciona al menos un día y un periodo válido.';
      return;
    }
    output.innerHTML = `<strong>${dates.length} sesión${dates.length === 1 ? '' : 'es'}</strong> entre ${esc(fechaES(start))} y ${esc(fechaES(fechaISO(endDate)))}.`;
  }

  function conflictoEntrenador({ trainerId, date, hour, duration, ignoreClientId = null, ignoreSessionId = null }) {
    const start = minutosHora(hour);
    const end = start + Number(duration || 60);
    for (const client of clientesLista()) {
      for (const session of (client.clases || [])) {
        if (Number(client.id) === Number(ignoreClientId) && Number(session.id) === Number(ignoreSessionId)) continue;
        if (session.fecha !== date) continue;
        if (session.estado === 'Cancelada' || session.estado === 'Cancelada excepcional') continue;
        if (Number(session.entrenadorId || 0) !== Number(trainerId)) continue;
        const otherStart = minutosHora(session.hora);
        const otherDuration = Number(session.duracion || client.bonoDuracion || 60);
        if (start < otherStart + otherDuration && end > otherStart) return { client, session };
      }
    }
    return null;
  }

  function sesionDuplicada(cliente, date, hour) {
    return (cliente.clases || []).some(session =>
      session.fecha === date && session.hora === hour &&
      session.estado !== 'Cancelada' && session.estado !== 'Cancelada excepcional'
    );
  }

  function mostrarToast(message, type = 'ok') {
    document.querySelector('.rage-recurring-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = `rage-recurring-toast is-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => toast.classList.remove('is-visible'), 2600);
    setTimeout(() => toast.remove(), 2950);
  }

  function crearSerie(modal, sourceSession = null) {
    const clientId = Number(modal.dataset.clientId || 0);
    const cliente = clientePorId(clientId);
    const trainerId = Number(modal.querySelector('#rageRecurringTrainer')?.value || 0);
    const trainer = entrenadorPorId(trainerId);
    const hour = modal.querySelector('#rageRecurringHour')?.value;
    const startValue = modal.querySelector('#rageRecurringStart')?.value;
    const dates = fechasCandidatas(modal);
    const days = diasSeleccionados(modal);
    const duration = Number(sourceSession?.duracion || cliente?.bonoDuracion || 60);
    const modality = sourceSession?.modalidad || cliente?.bonoModalidad || 'Individual';

    if (!cliente || !trainer || !hour || !startValue) {
      alert('Selecciona cliente, fecha, hora y entrenador.');
      return;
    }
    if (!dates.length) {
      alert('Selecciona al menos un día y un periodo válido.');
      return;
    }

    const startMinutes = minutosHora(hour);
    if (!Number.isFinite(startMinutes) || startMinutes < 6 * 60 || startMinutes + duration > 24 * 60) {
      alert('La sesión debe quedar comprendida entre las 06:00 y las 24:00.');
      return;
    }
    if (dates.length > 366) {
      alert('La serie es demasiado extensa. Limítala a un máximo de 366 sesiones.');
      return;
    }

    const seriesId = `RAGE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const end = fechaFinDesdeFormulario(modal, parseFechaISO(startValue));
    let created = 0;
    let duplicates = 0;
    let conflicts = 0;
    const conflictNames = new Set();
    const idBase = Date.now();

    dates.forEach((date, index) => {
      if (sesionDuplicada(cliente, date, hour)) {
        duplicates += 1;
        return;
      }

      const conflict = conflictoEntrenador({ trainerId, date, hour, duration });
      if (conflict) {
        conflicts += 1;
        conflictNames.add(`${fechaES(date)} · ${conflict.client.nombre}`);
        return;
      }

      cliente.clases = Array.isArray(cliente.clases) ? cliente.clases : [];
      cliente.clases.push({
        id: idBase + index + 1,
        fecha: date,
        hora: hour,
        estado: 'Programada',
        duracion: String(duration),
        modalidad: modality,
        entrenadorId: trainer.id,
        entrenadorNombre: trainer.nombre,
        entrenadorColor: trainer.color,
        consumida: false,
        serieId,
        serieTipo: 'semanal',
        serieInicio: startValue,
        serieFin: fechaISO(end),
        serieDias: [...days],
        serieCreadaEn: new Date().toISOString()
      });
      created += 1;
    });

    if (!created) {
      const detail = [
        conflicts ? `${conflicts} por conflicto de entrenador` : '',
        duplicates ? `${duplicates} porque ya existían` : ''
      ].filter(Boolean).join(' y ');
      alert(`No se ha creado ninguna sesión${detail ? `: ${detail}` : '.'}`);
      return;
    }

    guardar();
    if (typeof procesarBonosAutomaticamente === 'function') procesarBonosAutomaticamente();
    if (typeof verificarEstadoBonos === 'function') verificarEstadoBonos();
    if (typeof actualizarResumen === 'function') actualizarResumen();
    if (typeof renderAgendaDia === 'function') renderAgendaDia();
    if (typeof renderCalendarioSemanal === 'function') renderCalendarioSemanal();
    if (typeof renderClientes === 'function') renderClientes();
    if (activeClientId === cliente.id && typeof verFichaCliente === 'function') verFichaCliente(cliente.id);

    cerrarModal();
    const extras = [
      conflicts ? `${conflicts} omitida${conflicts === 1 ? '' : 's'} por conflicto` : '',
      duplicates ? `${duplicates} ya existente${duplicates === 1 ? '' : 's'}` : ''
    ].filter(Boolean);
    mostrarToast(`${created} sesión${created === 1 ? '' : 'es'} creada${created === 1 ? '' : 's'}${extras.length ? ` · ${extras.join(' · ')}` : ''}`, conflicts ? 'warning' : 'ok');

    if (conflicts && conflictNames.size) {
      console.info('Sesiones recurrentes omitidas por conflicto:', [...conflictNames]);
    }
  }

  function abrirModal(options = {}) {
    const clientId = Number(options.clientId || 0);
    const cliente = clientePorId(clientId);
    if (!cliente) {
      alert('Selecciona un cliente antes de crear una programación recurrente.');
      return;
    }

    const sourceSession = options.sessionId
      ? (cliente.clases || []).find(session => Number(session.id) === Number(options.sessionId))
      : null;
    const start = sourceSession?.fecha || options.date || hoyISO();
    const startDate = parseFechaISO(start) || parseFechaISO(hoyISO());
    const hour = sourceSession?.hora || options.hour || '09:00';
    const trainer = entrenadorPorId(sourceSession?.entrenadorId || options.trainerId) || entrenadorPredeterminado(cliente);
    if (!trainer) {
      alert('Primero debes crear al menos un entrenador.');
      return;
    }

    cerrarModal();
    const selectedDay = diaSemanaISO(startDate);
    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'rage-recurring-overlay';
    overlay.dataset.clientId = String(cliente.id);
    overlay.innerHTML = `
      <div class="rage-recurring-backdrop"></div>
      <section class="rage-recurring-shell" role="dialog" aria-modal="true" aria-label="Programación recurrente">
        <header class="rage-recurring-head">
          <div>
            <span>AGENDA RECURRENTE</span>
            <h3>Programar varias sesiones</h3>
            <p>${esc(cliente.nombre)} · ${esc(sourceSession ? 'Duplicar desde una sesión existente' : 'Nueva serie de sesiones')}</p>
          </div>
          <button class="rage-recurring-close" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="rage-recurring-body">
          <div class="rage-recurring-client-card">
            <div><small>CLIENTE</small><strong>${esc(cliente.nombre)}</strong></div>
            <div><small>BONO ACTUAL</small><strong>${esc(cliente.bonoDisponible ?? 0)}/${esc(cliente.bonoTotal ?? 0)} · ${esc(cliente.bonoDuracion || 60)} min</strong></div>
          </div>

          ${sourceSession ? `<p class="rage-recurring-info">La sesión original del ${esc(fechaES(sourceSession.fecha))} a las ${esc(sourceSession.hora)} se mantiene. Si coincide con la serie, la aplicación no la duplicará.</p>` : ''}

          <div class="rage-recurring-grid">
            <label class="rage-recurring-field"><span>Fecha de inicio</span><input id="rageRecurringStart" type="date" value="${esc(start)}"></label>
            <label class="rage-recurring-field"><span>Hora fija</span><input id="rageRecurringHour" type="time" step="1800" value="${esc(hour)}"></label>
            <label class="rage-recurring-field full"><span>Entrenador</span><select id="rageRecurringTrainer">${opcionesEntrenadores(trainer.id)}</select><small>Se aplicará a toda la serie; cada cita podrá modificarse después.</small></label>
          </div>

          <section class="rage-recurring-days">
            <div class="rage-recurring-section-head"><div><span>DÍAS DE LA SEMANA</span><strong>Elige uno o varios días</strong></div><div class="rage-recurring-shortcuts"><button type="button" data-rage-days="weekdays">L–V</button><button type="button" data-rage-days="all">Todos</button><button type="button" data-rage-days="clear">Limpiar</button></div></div>
            <div class="rage-recurring-day-grid">
              ${[['1','Lun'],['2','Mar'],['3','Mié'],['4','Jue'],['5','Vie'],['6','Sáb'],['7','Dom']].map(([value,label]) => `
                <label><input type="checkbox" data-rage-recurring-day value="${value}" ${Number(value) === selectedDay ? 'checked' : ''}><span>${label}</span></label>`).join('')}
            </div>
          </section>

          <section class="rage-recurring-period">
            <div class="rage-recurring-section-head"><div><span>DURACIÓN DE LA SERIE</span><strong>Semanas, meses o fecha final</strong></div></div>
            <div class="rage-recurring-period-grid">
              <label class="rage-recurring-field"><span>Tipo</span><select id="rageRecurringPeriodMode"><option value="weeks">Semanas</option><option value="months">Meses</option><option value="until">Hasta una fecha</option></select></label>
              <label class="rage-recurring-field" id="rageRecurringAmountField"><span>Cantidad</span><input id="rageRecurringPeriodAmount" type="number" min="1" max="104" step="1" value="8"></label>
              <label class="rage-recurring-field" id="rageRecurringUntilField" hidden><span>Fecha final</span><input id="rageRecurringUntil" type="date" value="${esc(fechaISO(sumarDias(startDate, 55)))}"></label>
            </div>
            <div class="rage-recurring-presets"><button type="button" data-rage-preset="4w">4 semanas</button><button type="button" data-rage-preset="8w">8 semanas</button><button type="button" data-rage-preset="3m">3 meses</button><button type="button" data-rage-preset="6m">6 meses</button></div>
          </section>

          <div id="rageRecurringPreview" class="rage-recurring-preview"></div>
          <p class="rage-recurring-legal">Cada fecha se guardará como una sesión independiente. Después podrás arrastrarla, cancelarla, eliminarla o cambiarle el entrenador sin afectar a las demás.</p>
          <div class="rage-recurring-keyboard-space" aria-hidden="true"></div>
        </div>
        <footer class="rage-recurring-foot"><button class="rage-recurring-cancel" type="button">Cancelar</button><button class="rage-recurring-save" type="button">Crear sesiones</button></footer>
      </section>`;

    document.body.appendChild(overlay);
    document.documentElement.classList.add('rage-recurring-open');
    actualizarViewport();

    const close = cerrarModal;
    overlay.querySelector('.rage-recurring-backdrop').onclick = close;
    overlay.querySelector('.rage-recurring-close').onclick = close;
    overlay.querySelector('.rage-recurring-cancel').onclick = close;
    overlay.querySelector('.rage-recurring-save').onclick = () => crearSerie(overlay, sourceSession);

    const mode = overlay.querySelector('#rageRecurringPeriodMode');
    const amountField = overlay.querySelector('#rageRecurringAmountField');
    const untilField = overlay.querySelector('#rageRecurringUntilField');
    const updateMode = () => {
      const until = mode.value === 'until';
      amountField.hidden = until;
      untilField.hidden = !until;
      actualizarResumenModal(overlay);
    };
    mode.onchange = updateMode;

    overlay.querySelectorAll('input, select').forEach(field => field.addEventListener('input', () => actualizarResumenModal(overlay)));
    overlay.querySelectorAll('[data-rage-days]').forEach(button => button.onclick = () => {
      const action = button.dataset.rageDays;
      overlay.querySelectorAll('[data-rage-recurring-day]').forEach(input => {
        const day = Number(input.value);
        input.checked = action === 'all' || (action === 'weekdays' && day <= 5);
        if (action === 'clear') input.checked = false;
      });
      actualizarResumenModal(overlay);
    });
    overlay.querySelectorAll('[data-rage-preset]').forEach(button => button.onclick = () => {
      const preset = button.dataset.ragePreset;
      if (preset.endsWith('w')) {
        mode.value = 'weeks';
        overlay.querySelector('#rageRecurringPeriodAmount').value = preset.replace('w','');
      } else {
        mode.value = 'months';
        overlay.querySelector('#rageRecurringPeriodAmount').value = preset.replace('m','');
      }
      updateMode();
    });

    actualizarResumenModal(overlay);
  }

  window.abrirRecurrenciaRage = function (clientId, sessionId = null, options = {}) {
    abrirModal({ ...options, clientId, sessionId });
  };

  function extraerIdsSesion(row) {
    const buttons = [...row.querySelectorAll('button[onclick]')];
    const button = buttons.find(item => /cancelarClase(?:Excepcional)?\s*\(/.test(item.getAttribute('onclick') || ''));
    const match = (button?.getAttribute('onclick') || '').match(/cancelarClase(?:Excepcional)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    return match ? { clientId: Number(match[1]), sessionId: Number(match[2]) } : null;
  }

  function decorarSesiones() {
    document.querySelectorAll('#agendaDiaLista .agenda-item, #clienteFicha .agenda-item').forEach(row => {
      const actions = row.querySelector('.acciones');
      if (!actions || actions.querySelector('.rage-repeat-session')) return;
      const ids = extraerIdsSesion(row);
      if (!ids) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rage-repeat-session';
      button.textContent = 'Repetir';
      button.onclick = () => abrirModal(ids);
      actions.insertBefore(button, actions.firstChild);
    });
  }

  function instalarBotonCliente(clientId) {
    const toolbar = document.querySelector('#cliente-detalle-section .cliente-detail-toolbar');
    if (!toolbar) return;
    let actions = toolbar.querySelector('.cliente-detail-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'cliente-detail-actions';
      toolbar.appendChild(actions);
    }
    let button = actions.querySelector('.rage-recurring-client-button');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'rage-recurring-client-button';
      button.textContent = '+ Sesiones recurrentes';
      actions.appendChild(button);
    }
    button.onclick = () => abrirModal({ clientId });
  }

  function instalarBotonAgenda() {
    const form = document.querySelector('#agenda-dia-integrada-section .session-form, #dia-screen .session-form');
    if (!form || form.querySelector('.rage-recurring-agenda-button')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rage-recurring-agenda-button';
    button.textContent = 'Programar varias sesiones';
    button.onclick = () => {
      const clientId = Number(document.getElementById('diaClienteSelect')?.value || 0);
      const date = (() => { try { return fechaDiaSeleccionado || hoyISO(); } catch (_) { return hoyISO(); } })();
      const hour = document.getElementById('diaClaseHora')?.value || '09:00';
      const trainerId = Number(document.getElementById('diaEntrenadorSelect')?.value || 0) || undefined;
      abrirModal({ clientId, date, hour, trainerId });
    };
    form.appendChild(button);
  }

  function instalarBotonModalCliente() {
    const modal = document.querySelector('.cliente-session-backdrop');
    const foot = modal?.querySelector('.cliente-session-foot');
    if (!modal || !foot || foot.querySelector('.rage-recurring-session-modal')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rage-recurring-session-modal';
    button.textContent = 'Programar varias';
    button.onclick = () => {
      const clientId = pendingClientId || activeClientId;
      const date = modal.querySelector('#clienteSesionFecha')?.value || hoyISO();
      const hour = modal.querySelector('#clienteSesionHora')?.value || '09:00';
      const trainerId = Number(modal.querySelector('#clienteSesionEntrenador')?.value || 0) || undefined;
      modal.remove();
      abrirModal({ clientId, date, hour, trainerId });
    };
    foot.insertBefore(button, foot.querySelector('.cliente-session-save') || null);
  }

  ['abrirSesionCliente', 'abrirSesionDesdeCliente'].forEach(name => {
    const previous = window[name];
    if (typeof previous !== 'function') return;
    window[name] = function (clientId) {
      pendingClientId = Number(clientId) || null;
      const result = previous.apply(this, arguments);
      requestAnimationFrame(instalarBotonModalCliente);
      setTimeout(instalarBotonModalCliente, 40);
      return result;
    };
  });

  const renderAgendaPrevious = window.renderAgendaDia;
  if (typeof renderAgendaPrevious === 'function') {
    window.renderAgendaDia = function () {
      const result = renderAgendaPrevious.apply(this, arguments);
      requestAnimationFrame(() => { decorarSesiones(); instalarBotonAgenda(); });
      setTimeout(() => { decorarSesiones(); instalarBotonAgenda(); }, 40);
      return result;
    };
  }

  const viewClientPrevious = window.verFichaCliente;
  if (typeof viewClientPrevious === 'function') {
    window.verFichaCliente = function (clientId) {
      activeClientId = Number(clientId) || null;
      const result = viewClientPrevious.apply(this, arguments);
      requestAnimationFrame(() => { instalarBotonCliente(clientId); decorarSesiones(); });
      setTimeout(() => { instalarBotonCliente(clientId); decorarSesiones(); }, 60);
      setTimeout(() => { instalarBotonCliente(clientId); decorarSesiones(); }, 160);
      return result;
    };
  }

  document.addEventListener('focusin', event => {
    const field = event.target;
    if (!field.matches?.(`#${MODAL_ID} input, #${MODAL_ID} select, #${MODAL_ID} textarea`)) return;
    programarRevelado(field);
  }, true);

  document.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!document.activeElement?.closest?.(`#${MODAL_ID}`)) document.documentElement.classList.remove('rage-recurring-keyboard');
    }, 250);
  }, true);

  window.visualViewport?.addEventListener('resize', () => {
    actualizarViewport();
    const field = document.activeElement;
    if (field?.closest?.(`#${MODAL_ID}`)) programarRevelado(field);
  }, { passive: true });
  window.visualViewport?.addEventListener('scroll', actualizarViewport, { passive: true });
  window.addEventListener('resize', actualizarViewport, { passive: true });

  const observer = new MutationObserver(() => {
    instalarBotonAgenda();
    instalarBotonModalCliente();
    decorarSesiones();
    if (activeClientId) instalarBotonCliente(activeClientId);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  function setup() {
    instalarBotonAgenda();
    instalarBotonModalCliente();
    decorarSesiones();
    actualizarViewport();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();

  window.RageRecurrenciasVersion = VERSION;
})();