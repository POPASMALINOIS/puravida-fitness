(() => {
  if (window.RageRecurrenciasFixV249) return;
  window.RageRecurrenciasFixV249 = true;

  const VERSION = '2.4.49';
  const MODAL_ID = 'rageRecurringModal';
  const MAX_DAYS = 730;
  const MAX_SESSIONS = 366;
  const HOUR_START = 6 * 60;
  const HOUR_END = 24 * 60;
  let suppressSyntheticClickUntil = 0;

  const clientesLista = () => {
    try { return Array.isArray(clientes) ? clientes : []; }
    catch (_) { return []; }
  };

  const entrenadoresLista = () => {
    try { return Array.isArray(entrenadores) ? entrenadores : []; }
    catch (_) { return []; }
  };

  const clientePorId = id => clientesLista().find(cliente => Number(cliente?.id) === Number(id));
  const entrenadorPorId = id => entrenadoresLista().find(entrenador => Number(entrenador?.id) === Number(id));

  function sesionesCliente(cliente) {
    return Array.isArray(cliente?.clases) ? cliente.clases.filter(Boolean) : [];
  }

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
    return sesionesCliente(cliente).find(session =>
      session && session.fecha === date && session.hora === hour &&
      session.estado !== 'Cancelada' && session.estado !== 'Cancelada excepcional'
    ) || null;
  }

  function sesionDuplicada(cliente, date, hour) {
    return sesionesCliente(cliente).some(session =>
      session && session.fecha === date && session.hora === hour &&
      session.estado !== 'Cancelada' && session.estado !== 'Cancelada excepcional'
    );
  }

  function conflictoEntrenador({ trainerId, date, hour, duration }) {
    const start = minutosHora(hour);
    const end = start + Number(duration || 60);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

    for (const client of clientesLista()) {
      for (const session of sesionesCliente(client)) {
        if (!session || typeof session !== 'object') continue;
        if (session.fecha !== date) continue;
        if (session.estado === 'Cancelada' || session.estado === 'Cancelada excepcional') continue;
        if (Number(session.entrenadorId || 0) !== Number(trainerId)) continue;

        const otherStart = minutosHora(session.hora);
        const otherDuration = Number(session.duracion || client?.bonoDuracion || 60);
        if (!Number.isFinite(otherStart) || !Number.isFinite(otherDuration)) continue;
        if (start < otherStart + otherDuration && end > otherStart) return { client, session };
      }
    }
    return null;
  }

  function ejecutarSeguro(callback) {
    try { if (typeof callback === 'function') callback(); }
    catch (error) { console.error('[Rage recurrentes] Actualización visual:', error); }
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

  function stringifySeguro(value) {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') return String(item);
      if (typeof item === 'function' || typeof item === 'symbol') return undefined;
      if (item && typeof item === 'object') {
        if (typeof Node !== 'undefined' && item instanceof Node) return undefined;
        if (seen.has(item)) return undefined;
        seen.add(item);
      }
      return item;
    });
  }

  function payloadCompactado() {
    const serialized = stringifySeguro(clientesLista());
    if (!serialized) throw new Error('No se ha podido preparar la información de los clientes.');
    const payload = JSON.parse(serialized);

    payload.forEach(client => {
      if (!Array.isArray(client.clases)) client.clases = [];
      if (!Array.isArray(client.seriesRecurrentes)) client.seriesRecurrentes = [];

      const registered = new Set(client.seriesRecurrentes.map(series => String(series?.id || '')));
      client.clases.forEach(session => {
        if (!session || typeof session !== 'object' || !session.serieId) return;
        const seriesId = String(session.serieId);
        if (!registered.has(seriesId)) {
          client.seriesRecurrentes.push({
            id: seriesId,
            tipo: session.serieTipo || 'semanal',
            inicio: session.serieInicio || session.fecha || '',
            fin: session.serieFin || session.fecha || '',
            dias: Array.isArray(session.serieDias) ? [...session.serieDias] : [],
            hora: session.hora || '',
            entrenadorId: session.entrenadorId || null,
            creadaEn: session.serieCreadaEn || ''
          });
          registered.add(seriesId);
        }
        delete session.serieInicio;
        delete session.serieFin;
        delete session.serieDias;
        delete session.serieCreadaEn;
      });
    });

    return payload;
  }

  function esErrorCuota(error) {
    return !!error && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 || error.code === 1014 ||
      /quota|almacenamiento|storage/i.test(String(error.message || ''))
    );
  }

  function persistirClientes(expectedClientId, expectedSessionIds) {
    if (!window.localStorage) throw new Error('El almacenamiento local no está disponible.');

    let serialized = stringifySeguro(clientesLista());
    if (!serialized) throw new Error('No se ha podido serializar la base de clientes.');

    try {
      localStorage.setItem('clientes', serialized);
    } catch (firstError) {
      if (!esErrorCuota(firstError)) throw firstError;
      const compact = payloadCompactado();
      serialized = stringifySeguro(compact);
      localStorage.setItem('clientes', serialized);
    }

    const storedRaw = localStorage.getItem('clientes');
    if (!storedRaw) throw new Error('El navegador no ha confirmado el guardado.');
    const storedClients = JSON.parse(storedRaw);
    if (!Array.isArray(storedClients)) throw new Error('La copia guardada no contiene una lista válida de clientes.');

    const storedClient = storedClients.find(client => Number(client?.id) === Number(expectedClientId));
    if (!storedClient || !Array.isArray(storedClient.clases)) {
      throw new Error('No se ha encontrado el cliente en la copia guardada.');
    }

    const storedIds = new Set(storedClient.clases.map(session => String(session?.id || '')));
    const missing = expectedSessionIds.filter(id => !storedIds.has(String(id)));
    if (missing.length) throw new Error(`Faltan ${missing.length} sesiones en la comprobación del guardado.`);
  }

  function mensajeErrorGuardado(error) {
    if (esErrorCuota(error)) {
      return 'No se han podido guardar las sesiones porque el almacenamiento de esta tablet está lleno. Cierra el aviso y exporta una copia antes de liberar datos.';
    }
    const detail = String(error?.message || error?.name || 'Error desconocido').trim();
    return `No se han podido guardar las sesiones recurrentes. Detalle: ${detail}`;
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
    let cliente = null;
    let createdSessions = [];
    let seriesRecord = null;

    try {
      const clientId = Number(modal.dataset.clientId || 0);
      cliente = clientePorId(clientId);
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
      if (!Number.isFinite(startMinutes) || !Number.isFinite(duration) || duration <= 0 || startMinutes < HOUR_START || startMinutes + duration > HOUR_END) {
        alert('La sesión debe quedar comprendida entre las 06:00 y las 24:00.');
        return;
      }

      if (!Array.isArray(cliente.clases)) cliente.clases = [];
      if (!Array.isArray(cliente.seriesRecurrentes)) cliente.seriesRecurrentes = [];

      const seriesId = `RAGE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const usedIds = new Set(cliente.clases.map(session => Number(session?.id)).filter(Number.isFinite));
      let nextId = Date.now();
      const newId = () => {
        while (usedIds.has(nextId)) nextId += 1;
        const id = nextId;
        usedIds.add(id);
        nextId += 1;
        return id;
      };

      let duplicates = 0;
      let conflicts = 0;

      dates.forEach(date => {
        if (sesionDuplicada(cliente, date, hour)) {
          duplicates += 1;
          return;
        }

        const conflict = conflictoEntrenador({ trainerId, date, hour, duration });
        if (conflict) {
          conflicts += 1;
          return;
        }

        createdSessions.push({
          id: newId(),
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
          serieTipo: 'semanal'
        });
      });

      if (!createdSessions.length) {
        const reasons = [
          conflicts ? `${conflicts} con el horario del entrenador ocupado` : '',
          duplicates ? `${duplicates} porque ya existían` : ''
        ].filter(Boolean).join(' y ');
        alert(`No se ha creado ninguna sesión${reasons ? `: ${reasons}` : '.'}`);
        return;
      }

      seriesRecord = {
        id: seriesId,
        tipo: 'semanal',
        inicio: startValue,
        fin: fechaISO(endDate),
        dias: [...days],
        hora,
        entrenadorId: trainer.id,
        duracion: String(duration),
        modalidad,
        creadaEn: new Date().toISOString()
      };

      cliente.clases.push(...createdSessions);
      cliente.seriesRecurrentes.push(seriesRecord);

      try {
        persistirClientes(cliente.id, createdSessions.map(session => session.id));
      } catch (storageError) {
        const createdIds = new Set(createdSessions.map(session => String(session.id)));
        cliente.clases = cliente.clases.filter(session => !createdIds.has(String(session?.id)));
        cliente.seriesRecurrentes = cliente.seriesRecurrentes.filter(series => String(series?.id) !== String(seriesRecord?.id));
        throw storageError;
      }

      completed = true;
      cerrarModal();
      refrescarDespuesDeGuardar(cliente);

      const extras = [
        conflicts ? `${conflicts} omitida${conflicts === 1 ? '' : 's'} por conflicto` : '',
        duplicates ? `${duplicates} ya existente${duplicates === 1 ? '' : 's'}` : ''
      ].filter(Boolean);
      mostrarToast(
        `${createdSessions.length} sesión${createdSessions.length === 1 ? '' : 'es'} creada${createdSessions.length === 1 ? '' : 's'}${extras.length ? ` · ${extras.join(' · ')}` : ''}`,
        conflicts ? 'warning' : 'ok'
      );
    } catch (error) {
      console.error('[Rage recurrentes] Error al crear sesiones:', error);
      alert(mensajeErrorGuardado(error));
    } finally {
      if (!completed) restaurarBoton(modal, button, originalText);
    }
  }

  function prepararModal(modal) {
    if (!modal) return;
    const saveButton = modal.querySelector('.rage-recurring-save');
    const footer = modal.querySelector('.rage-recurring-foot');
    if (footer) footer.setAttribute('aria-label', 'Acciones de programación recurrente');
    if (!saveButton || saveButton.dataset.rageFixV249 === '1') return;

    saveButton.dataset.rageFixV249 = '1';
    saveButton.type = 'button';
    saveButton.onclick = null;
    saveButton.removeAttribute('onclick');
    saveButton.setAttribute('touch-action', 'manipulation');
  }

  function activarDesdeEvento(event) {
    const button = event.target.closest?.(`#${MODAL_ID} .rage-recurring-save`);
    if (!button) return false;
    const modal = button.closest(`#${MODAL_ID}`);
    if (!modal || button.disabled) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    crearSerieSegura(modal, button);
    return true;
  }

  document.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    const handled = activarDesdeEvento(event);
    if (handled) suppressSyntheticClickUntil = Date.now() + 1000;
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest?.(`#${MODAL_ID} .rage-recurring-save`);
    if (!button) return;
    if (Date.now() < suppressSyntheticClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    activarDesdeEvento(event);
  }, true);

  const observer = new MutationObserver(() => prepararModal(document.getElementById(MODAL_ID)));
  observer.observe(document.documentElement, { childList: true, subtree: true });

  prepararModal(document.getElementById(MODAL_ID));
  window.RageRecurrenciasFixVersion = VERSION;
})();