(() => {
  if (window.RageRecurrenciasFixV248) return;
  window.RageRecurrenciasFixV248 = true;

  const VERSION = '2.4.48';
  const MODAL_ID = 'rageRecurringModal';
  const MAX_DAYS = 730;
  const MAX_SESSIONS = 366;

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

  function parseFechaISO(value) {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    const result = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  function fechaISO(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
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

  function diasSeleccionados(modal) {
    return [...modal.querySelectorAll('[data-rage-recurring-day]:checked')]
      .map(input => Number(input.value))
      .filter(value => value >= 1 && value <= 7);
  }

  function fechaFinDesdeFormulario(modal, startDate) {
    if (!startDate) return null;
    const mode = modal.querySelector('#rageRecurringPeriodMode')?.value || 'weeks';
    if (mode === 'until') return parseFechaISO(modal.querySelector('#rageRecurringUntil')?.value);

    const rawAmount = Number(modal.querySelector('#rageRecurringPeriodAmount')?.value || 1);
    const amount = Math.max(1, Math.min(104, Math.trunc(Number.isFinite(rawAmount) ? rawAmount : 1)));
    if (mode === 'months') return sumarDias(sumarMeses(startDate, amount), -1);
    return sumarDias(startDate, amount * 7 - 1);
  }

  function fechasCandidatas(modal) {
    const start = parseFechaISO(modal.querySelector('#rageRecurringStart')?.value);
    const end = fechaFinDesdeFormulario(modal, start);
    const selectedDays = new Set(diasSeleccionados(modal));
    if (!start || !end || end < start || !selectedDays.size) return [];

    const dates = [];
    for (let date = new Date(start), guard = 0; date <= end && guard <= MAX_DAYS; date = sumarDias(date, 1), guard += 1) {
      if (selectedDays.has(diaSemanaISO(date))) dates.push(fechaISO(date));
    }
    return dates;
  }

  function sesionFuente(cliente, modal) {
    const date = modal.querySelector('#rageRecurringStart')?.value || '';
    const hour = modal.querySelector('#rageRecurringHour')?.value || '';
    return (cliente?.clases || []).find(session =>
      session.fecha === date && session.hora === hour &&
      session.estado !== 'Cancelada' && session.estado !== 'Cancelada excepcional'
    ) || null;
  }

  function sesionDuplicada(cliente, date, hour) {
    return (cliente.clases || []).some(session =>
      session.fecha === date && session.hora === hour &&
      session.estado !== 'Cancelada' && session.estado !== 'Cancelada excepcional'
    );
  }

  function conflictoEntrenador({ trainerId, date, hour, duration }) {
    const start = minutosHora(hour);
    const end = start + Number(duration || 60);

    for (const client of clientesLista()) {
      for (const session of (client.clases || [])) {
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

  function ejecutarSeguro(callback) {
    try { if (typeof callback === 'function') callback(); }
    catch (error) { console.error('[Rage recurrentes]', error); }
  }

  function cerrarModal() {
    document.getElementById(MODAL_ID)?.remove();
    document.documentElement.classList.remove('rage-recurring-open', 'rage-recurring-keyboard');
  }

  function mostrarToast(message, type = 'ok') {
    document.querySelector('.rage-recurring-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = `rage-recurring-toast is-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => toast.classList.remove('is-visible'), 2800);
    setTimeout(() => toast.remove(), 3150);
  }

  function restaurarBoton(modal, button, originalText) {
    if (!modal?.isConnected || !button) return;
    delete modal.dataset.rageSaving;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = originalText || 'Crear sesiones';
  }

  function refrescarDespuesDeGuardar(cliente) {
    requestAnimationFrame(() => {
      ejecutarSeguro(() => procesarBonosAutomaticamente());
      ejecutarSeguro(() => verificarEstadoBonos());
      ejecutarSeguro(() => actualizarResumen());
      ejecutarSeguro(() => renderAgendaDia());
      ejecutarSeguro(() => renderCalendarioSemanal());
      ejecutarSeguro(() => renderClientes());

      try {
        if (clienteActual && Number(clienteActual.id) === Number(cliente.id) && typeof verFichaCliente === 'function') {
          verFichaCliente(cliente.id);
        }
      } catch (_) {}
    });
  }

  function crearSerieSegura(modal, button) {
    if (!modal || modal.dataset.rageSaving === '1') return;

    const originalText = button?.textContent || 'Crear sesiones';
    modal.dataset.rageSaving = '1';
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Creando…';
    }

    let completed = false;

    try {
      const clientId = Number(modal.dataset.clientId || 0);
      const cliente = clientePorId(clientId);
      const trainerId = Number(modal.querySelector('#rageRecurringTrainer')?.value || 0);
      const trainer = entrenadorPorId(trainerId);
      const hour = modal.querySelector('#rageRecurringHour')?.value || '';
      const startValue = modal.querySelector('#rageRecurringStart')?.value || '';
      const startDate = parseFechaISO(startValue);
      const endDate = fechaFinDesdeFormulario(modal, startDate);
      const dates = fechasCandidatas(modal);
      const days = diasSeleccionados(modal);
      const sourceSession = sesionFuente(cliente, modal);
      const duration = Number(sourceSession?.duracion || cliente?.bonoDuracion || 60);
      const modality = sourceSession?.modalidad || cliente?.bonoModalidad || 'Individual';

      if (!cliente || !trainer || !hour || !startDate || !endDate) {
        alert('Selecciona correctamente cliente, fecha, hora, entrenador y duración de la serie.');
        return;
      }
      if (!days.length || !dates.length) {
        alert('Selecciona al menos un día de la semana y un periodo válido.');
        return;
      }
      if (dates.length > MAX_SESSIONS) {
        alert(`La serie contiene ${dates.length} sesiones. El máximo permitido es ${MAX_SESSIONS}.`);
        return;
      }

      const startMinutes = minutosHora(hour);
      if (!Number.isFinite(startMinutes) || startMinutes < 6 * 60 || startMinutes + duration > 24 * 60) {
        alert('La sesión debe quedar comprendida entre las 06:00 y las 24:00.');
        return;
      }

      cliente.clases = Array.isArray(cliente.clases) ? cliente.clases : [];

      const seriesId = `RAGE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const idBase = Date.now() * 1000;
      let created = 0;
      let duplicates = 0;
      let conflicts = 0;

      dates.forEach((date, index) => {
        if (sesionDuplicada(cliente, date, hour)) {
          duplicates += 1;
          return;
        }

        const conflict = conflictoEntrenador({ trainerId, date, hour, duration });
        if (conflict) {
          conflicts += 1;
          return;
        }

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
          serieFin: fechaISO(endDate),
          serieDias: [...days],
          serieCreadaEn: new Date().toISOString()
        });
        created += 1;
      });

      if (!created) {
        const reasons = [
          conflicts ? `${conflicts} con el horario del entrenador ocupado` : '',
          duplicates ? `${duplicates} porque ya existían` : ''
        ].filter(Boolean).join(' y ');
        alert(`No se ha creado ninguna sesión${reasons ? `: ${reasons}` : '.'}`);
        return;
      }

      if (typeof guardarDatos !== 'function') throw new Error('No está disponible el guardado de datos.');
      guardarDatos();

      completed = true;
      cerrarModal();
      refrescarDespuesDeGuardar(cliente);

      const extras = [
        conflicts ? `${conflicts} omitida${conflicts === 1 ? '' : 's'} por conflicto` : '',
        duplicates ? `${duplicates} ya existente${duplicates === 1 ? '' : 's'}` : ''
      ].filter(Boolean);
      mostrarToast(
        `${created} sesión${created === 1 ? '' : 'es'} creada${created === 1 ? '' : 's'}${extras.length ? ` · ${extras.join(' · ')}` : ''}`,
        conflicts ? 'warning' : 'ok'
      );
    } catch (error) {
      console.error('[Rage recurrentes] Error al crear sesiones:', error);
      alert('No se han podido guardar las sesiones recurrentes. Se ha evitado cerrar el formulario para que puedas revisarlo.');
    } finally {
      if (!completed) restaurarBoton(modal, button, originalText);
    }
  }

  function prepararModal(modal) {
    if (!modal || modal.dataset.rageFixV248 === '1') return;
    modal.dataset.rageFixV248 = '1';

    const footer = modal.querySelector('.rage-recurring-foot');
    const saveButton = modal.querySelector('.rage-recurring-save');
    if (footer) footer.setAttribute('aria-label', 'Acciones de programación recurrente');
    if (saveButton) {
      saveButton.type = 'button';
      saveButton.dataset.rageSafeSave = '1';
      saveButton.setAttribute('touch-action', 'manipulation');
    }
  }

  function activarDesdeEvento(event) {
    const button = event.target.closest?.(`#${MODAL_ID} .rage-recurring-save`);
    if (!button) return false;
    const modal = button.closest(`#${MODAL_ID}`);
    if (!modal) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    crearSerieSegura(modal, button);
    return true;
  }

  // En Android algunas PWA pierden el click al cerrar el teclado. Pointerup asegura la activación táctil.
  document.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    activarDesdeEvento(event);
  }, true);

  // Ratón, teclado y navegadores que sí generan click con normalidad.
  document.addEventListener('click', event => {
    activarDesdeEvento(event);
  }, true);

  const observer = new MutationObserver(() => {
    prepararModal(document.getElementById(MODAL_ID));
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  prepararModal(document.getElementById(MODAL_ID));
  window.RageRecurrenciasFixVersion = VERSION;
})();
