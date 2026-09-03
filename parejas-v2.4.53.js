(() => {
  if (window.RageGruposV257) return;
  window.RageGruposV257 = true;

  const VERSION = '2.4.57';
  const list = () => { try { return Array.isArray(clientes) ? clientes : []; } catch (_) { return []; } };
  const byId = id => list().find(c => Number(c?.id) === Number(id));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isGroup = mode => mode === 'Pareja' || mode === 'Trío';
  const memberLimit = mode => mode === 'Trío' ? 3 : mode === 'Pareja' ? 2 : 1;
  const modeLabel = mode => mode === 'Trío' ? 'TRÍO' : mode === 'Pareja' ? 'PAREJA' : 'INDIVIDUAL';

  function save() {
    try { if (typeof guardarDatos === 'function') guardarDatos(); }
    catch (error) { console.error('[Rage] No se pudieron guardar los integrantes:', error); }
  }

  function ensurePersonArrays(person) {
    if (!person) return;
    if (!Array.isArray(person.mesociclos)) person.mesociclos = [];
    if (!Array.isArray(person.mediciones)) person.mediciones = [];
  }

  function newPersonId(client, order) {
    return `PERSONA-${client.id}-${order}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function blankPerson(client, order, baseDate = '') {
    return {
      id: newPersonId(client, order),
      nombre: '',
      telefono: '',
      email: '',
      fechaAlta: baseDate || '',
      observaciones: '',
      mesociclos: [],
      mediciones: []
    };
  }

  function syncActiveTracking(client) {
    if (!client || !Array.isArray(client.personas) || !client.personas.length) return;
    const active = client.personas.find(p => String(p.id) === String(client.seguimientoPersonaActivaId)) || client.personas[0];
    ensurePersonArrays(active);
    if (Array.isArray(client.mesociclos)) active.mesociclos = client.mesociclos;
    if (Array.isArray(client.mediciones)) active.mediciones = client.mediciones;
  }

  function activatePerson(client, personId) {
    if (!client || !Array.isArray(client.personas) || !client.personas.length) return null;
    syncActiveTracking(client);
    const person = client.personas.find(p => String(p.id) === String(personId)) || client.personas[0];
    ensurePersonArrays(person);
    client.seguimientoPersonaActivaId = person.id;
    client.mesociclos = person.mesociclos;
    client.mediciones = person.mediciones;
    client.controles = person.mediciones;
    return person;
  }

  function updateDisplayName(client) {
    if (!client) return;
    const limit = memberLimit(client.bonoModalidad);
    const names = (client.personas || []).slice(0, limit).map(p => p?.nombre?.trim()).filter(Boolean);
    if (isGroup(client.bonoModalidad)) {
      if (names.length) client.nombre = names.join(' / ');
    } else if (client.personas?.[0]?.nombre) {
      client.nombre = client.personas[0].nombre;
    }
  }

  function normalizeClient(client) {
    if (!client) return false;
    let changed = false;

    if (!Array.isArray(client.personas) || !client.personas.length) {
      client.personas = [{
        id: newPersonId(client, 1),
        nombre: client.nombre || '',
        telefono: client.telefono || '',
        email: client.email || '',
        fechaAlta: client.fechaAlta || '',
        observaciones: client.observaciones || '',
        mesociclos: Array.isArray(client.mesociclos) ? client.mesociclos : [],
        mediciones: Array.isArray(client.mediciones) ? client.mediciones : (Array.isArray(client.controles) ? client.controles : [])
      }];
      client.seguimientoPersonaActivaId = client.personas[0].id;
      changed = true;
    }

    client.personas.forEach(ensurePersonArrays);

    if (!client.personas.some(p => String(p.id) === String(client.seguimientoPersonaActivaId))) {
      client.seguimientoPersonaActivaId = client.personas[0].id;
      changed = true;
    }

    if (!isGroup(client.bonoModalidad)) {
      const person = client.personas[0];
      person.nombre = client.nombre || person.nombre || '';
      person.telefono = client.telefono ?? person.telefono ?? '';
      person.email = client.email ?? person.email ?? '';
      person.fechaAlta = client.fechaAlta ?? person.fechaAlta ?? '';
      person.observaciones = client.observaciones ?? person.observaciones ?? '';
      client.nombre = person.nombre;
      client.telefono = person.telefono;
      client.email = person.email;
      client.fechaAlta = person.fechaAlta;
      client.observaciones = person.observaciones;
    }

    const oldName = client.nombre;
    updateDisplayName(client);
    if (oldName !== client.nombre) changed = true;
    activatePerson(client, client.seguimientoPersonaActivaId);
    return changed;
  }

  function ensureModeOption(select) {
    if (!select || [...select.options].some(option => option.value === 'Trío')) return;
    const option = document.createElement('option');
    option.value = 'Trío';
    option.textContent = 'Trío';
    select.appendChild(option);
  }

  function personCreateBlock(order) {
    return `<section class="rage-pair-second-person" data-rage-member-block="${order}">
      <div class="rage-pair-form-head"><div><span>PERSONA ${order}</span><strong>${order === 2 ? 'Segundo' : 'Tercer'} integrante</strong><small>Comparte bono, pagos y todas las clases. Su seguimiento deportivo es independiente.</small></div></div>
      <div class="rage-pair-form-grid">
        <label><span>Nombre completo *</span><input id="grupo${order}Nombre" type="text" autocomplete="off"></label>
        <label><span>Teléfono</span><input id="grupo${order}Telefono" type="tel" inputmode="tel"></label>
        <label><span>Email</span><input id="grupo${order}Email" type="text" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false"></label>
        <label><span>Fecha de alta</span><input id="grupo${order}FechaAlta" type="date"></label>
        <label class="full"><span>Observaciones personales</span><textarea id="grupo${order}Observaciones" rows="2"></textarea></label>
      </div>
    </section>`;
  }

  function ensureGroupFields() {
    const mode = document.getElementById('clienteBonoModalidad');
    if (!mode) return;
    ensureModeOption(mode);
    const grid = mode.closest('.form-grid');
    if (!grid) return;

    let container = document.getElementById('rageGroupExtraPeople');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rageGroupExtraPeople';
      container.innerHTML = personCreateBlock(2) + personCreateBlock(3);
      grid.insertAdjacentElement('afterend', container);
    }

    const toggle = () => {
      const limit = memberLimit(mode.value);
      container.querySelectorAll('[data-rage-member-block]').forEach(block => {
        const shouldHide = Number(block.dataset.rageMemberBlock) > limit;
        if (block.hidden !== shouldHide) block.hidden = shouldHide;
      });
      const card = grid.closest('.alta-card, .form-surface, .card');
      if (card) {
        card.classList.toggle('rage-is-pair', mode.value === 'Pareja');
        card.classList.toggle('rage-is-trio', mode.value === 'Trío');
      }
    };

    if (mode.dataset.rageGroupBound !== '1') {
      mode.dataset.rageGroupBound = '1';
      mode.addEventListener('change', toggle);
    }
    toggle();
  }

  function readCreatePerson(order, fallbackDate = '') {
    return {
      nombre: document.getElementById(`grupo${order}Nombre`)?.value.trim() || '',
      telefono: document.getElementById(`grupo${order}Telefono`)?.value.trim() || '',
      email: document.getElementById(`grupo${order}Email`)?.value.trim() || '',
      fechaAlta: document.getElementById(`grupo${order}FechaAlta`)?.value || fallbackDate,
      observaciones: document.getElementById(`grupo${order}Observaciones`)?.value.trim() || ''
    };
  }

  const addPrevious = window.agregarCliente;
  if (typeof addPrevious === 'function') {
    window.agregarCliente = function () {
      ensureGroupFields();
      const mode = document.getElementById('clienteBonoModalidad')?.value || 'Individual';
      const limit = memberLimit(mode);
      const primary = {
        nombre: document.getElementById('clienteNombre')?.value.trim() || '',
        telefono: document.getElementById('clienteTelefono')?.value.trim() || '',
        email: document.getElementById('clienteEmail')?.value.trim() || '',
        fechaAlta: document.getElementById('clienteFechaAlta')?.value || '',
        observaciones: document.getElementById('clienteObservaciones')?.value.trim() || ''
      };
      const extra = [readCreatePerson(2, primary.fechaAlta), readCreatePerson(3, primary.fechaAlta)];

      for (let order = 2; order <= limit; order++) {
        if (!extra[order - 2].nombre) {
          alert(`Introduce el nombre de la persona ${order} del ${mode.toLowerCase()}.`);
          return;
        }
      }

      const before = new Set(list().map(client => String(client.id)));
      const result = addPrevious.apply(this, arguments);
      const created = list().find(client => !before.has(String(client.id)));
      if (!created) return result;

      const person1 = {
        id: newPersonId(created, 1),
        ...primary,
        mesociclos: Array.isArray(created.mesociclos) ? created.mesociclos : [],
        mediciones: Array.isArray(created.mediciones) ? created.mediciones : (Array.isArray(created.controles) ? created.controles : [])
      };
      created.personas = [person1];
      for (let order = 2; order <= limit; order++) {
        created.personas.push({ id: newPersonId(created, order), ...extra[order - 2], mesociclos: [], mediciones: [] });
      }
      created.telefono = person1.telefono;
      created.email = person1.email;
      created.fechaAlta = person1.fechaAlta;
      created.observaciones = person1.observaciones;
      created.seguimientoPersonaActivaId = person1.id;
      updateDisplayName(created);
      activatePerson(created, person1.id);
      save();
      try { if (typeof renderClientes === 'function') renderClientes(); } catch (_) {}

      for (let order = 2; order <= 3; order++) {
        ['Nombre', 'Telefono', 'Email', 'FechaAlta', 'Observaciones'].forEach(suffix => {
          const element = document.getElementById(`grupo${order}${suffix}`);
          if (element) element.value = '';
        });
      }
      return result;
    };
  }

  function closeEditor() {
    document.getElementById('ragePairEditor')?.remove();
  }

  function personForm(prefix, label, person) {
    return `<section class="rage-person-edit-card"><div class="rage-person-edit-title"><span>${label}</span><strong>${esc(person.nombre || 'Sin completar')}</strong></div><div class="rage-person-edit-grid">
      <label><span>Nombre completo *</span><input id="${prefix}Name" type="text" value="${esc(person.nombre)}"></label>
      <label><span>Teléfono</span><input id="${prefix}Phone" type="tel" inputmode="tel" value="${esc(person.telefono)}"></label>
      <label><span>Email</span><input id="${prefix}Email" type="text" inputmode="email" value="${esc(person.email)}"></label>
      <label><span>Fecha de alta</span><input id="${prefix}Date" type="date" value="${esc(person.fechaAlta)}"></label>
      <label class="full"><span>Observaciones personales</span><textarea id="${prefix}Notes" rows="2">${esc(person.observaciones)}</textarea></label>
    </div></section>`;
  }

  function openPeopleEditor(client) {
    normalizeClient(client);
    const limit = memberLimit(client.bonoModalidad);
    if (limit === 1) return;

    const people = [];
    for (let index = 0; index < limit; index++) {
      people.push(client.personas[index] || blankPerson(client, index + 1, client.personas[0]?.fechaAlta || ''));
    }

    closeEditor();
    const wrap = document.createElement('div');
    wrap.id = 'ragePairEditor';
    wrap.className = 'rage-pair-editor-wrap';
    wrap.innerHTML = `
      <div class="rage-pair-editor-backdrop"></div>
      <section class="rage-pair-editor" role="dialog" aria-modal="true">
        <header><div><span>BONO EN ${modeLabel(client.bonoModalidad)}</span><h3>Datos de ${limit === 2 ? 'las dos' : 'las tres'} personas</h3><p>El bono, pagos y agenda son comunes; mesociclos, mediciones y planes son individuales.</p></div><button type="button" class="rage-pair-editor-close">×</button></header>
        <div class="rage-pair-editor-body ${limit === 3 ? 'rage-three-members' : ''}">
          ${people.map((person, index) => personForm(`gp${index + 1}`, `PERSONA ${index + 1}`, person)).join('')}
        </div>
        <footer><button type="button" class="rage-pair-editor-cancel">Cancelar</button><button type="button" class="rage-pair-editor-save">Guardar personas</button></footer>
      </section>`;
    document.body.appendChild(wrap);

    wrap.querySelector('.rage-pair-editor-backdrop').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-close').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-cancel').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-save').onclick = () => {
      const values = people.map((person, index) => {
        const prefix = `gp${index + 1}`;
        return {
          person,
          data: {
            nombre: document.getElementById(`${prefix}Name`).value.trim(),
            telefono: document.getElementById(`${prefix}Phone`).value.trim(),
            email: document.getElementById(`${prefix}Email`).value.trim(),
            fechaAlta: document.getElementById(`${prefix}Date`).value,
            observaciones: document.getElementById(`${prefix}Notes`).value.trim()
          }
        };
      });

      if (values.some(item => !item.data.nombre)) {
        alert(`El nombre de ${limit === 2 ? 'las dos' : 'las tres'} personas es obligatorio.`);
        return;
      }

      values.forEach(({ person, data }) => {
        Object.assign(person, data);
        ensurePersonArrays(person);
      });
      client.personas = values.map(item => item.person);
      const person1 = client.personas[0];
      client.telefono = person1.telefono || '';
      client.email = person1.email || '';
      client.fechaAlta = person1.fechaAlta || '';
      if (!client.personas.some(person => String(person.id) === String(client.seguimientoPersonaActivaId))) {
        client.seguimientoPersonaActivaId = person1.id;
      }
      updateDisplayName(client);
      activatePerson(client, client.seguimientoPersonaActivaId);
      save();
      closeEditor();
      if (typeof verFichaCliente === 'function') verFichaCliente(client.id);
    };
  }

  window.editarPersonasGrupoRage = id => {
    const client = byId(id);
    if (client) openPeopleEditor(client);
  };
  window.editarPersonasParejaRage = window.editarPersonasGrupoRage;

  window.seleccionarPersonaGrupoRage = function (clientId, personId) {
    const client = byId(clientId);
    if (!client) return;
    activatePerson(client, personId);
    save();
    if (typeof verFichaCliente === 'function') verFichaCliente(client.id);
  };
  window.seleccionarPersonaParejaRage = window.seleccionarPersonaGrupoRage;

  const editPrevious = window.editarClienteRage;
  if (typeof editPrevious === 'function') {
    window.editarClienteRage = function (id) {
      const client = byId(id);
      if (!client) return;
      normalizeClient(client);
      if (isGroup(client.bonoModalidad)) return openPeopleEditor(client);
      const result = editPrevious.apply(this, arguments);
      const saveButton = document.querySelector('#rage-client-editor .rage-editor-save');
      if (saveButton && !saveButton.dataset.ragePersonSync) {
        saveButton.dataset.ragePersonSync = '1';
        const originalSave = saveButton.onclick;
        saveButton.onclick = function () {
          const response = originalSave?.apply(this, arguments);
          setTimeout(() => {
            normalizeClient(client);
            save();
          }, 0);
          return response;
        };
      }
      return result;
    };
  }

  const bonoPrevious = window.cambiarBonoRage;
  if (typeof bonoPrevious === 'function') {
    window.cambiarBonoRage = function (id) {
      const client = byId(id);
      const oldMode = client?.bonoModalidad || 'Individual';
      const result = bonoPrevious.apply(this, arguments);
      const select = document.getElementById('ebMode');
      ensureModeOption(select);
      if (select) select.value = oldMode;

      const saveButton = document.querySelector('#rage-client-editor .rage-editor-save');
      if (saveButton && client && !saveButton.dataset.rageGroupWrapped) {
        saveButton.dataset.rageGroupWrapped = '1';
        const originalSave = saveButton.onclick;
        saveButton.onclick = function () {
          const nextMode = select?.value || 'Individual';
          const limit = memberLimit(nextMode);
          const populated = (client.personas || []).filter(person => person?.nombre?.trim()).length;
          if (populated > limit) {
            alert(`Esta ficha tiene ${populated} personas. La modalidad ${nextMode} admite ${limit}. No se cambiará para evitar perder datos.`);
            return;
          }
          const response = originalSave?.apply(this, arguments);
          setTimeout(() => {
            normalizeClient(client);
            save();
            if (isGroup(client.bonoModalidad) && (client.personas || []).length < memberLimit(client.bonoModalidad)) {
              openPeopleEditor(client);
            }
          }, 0);
          return response;
        };
      }
      return result;
    };
  }

  function decorateClient(client) {
    const ficha = document.getElementById('clienteFicha');
    if (!ficha || !client) return;
    normalizeClient(client);

    ficha.querySelector('#ragePairPeople')?.remove();
    ficha.querySelectorAll('[data-rage-pair-hidden="1"]').forEach(element => {
      element.style.display = '';
      delete element.dataset.ragePairHidden;
    });
    if (!isGroup(client.bonoModalidad)) return;

    const limit = memberLimit(client.bonoModalidad);
    const active = client.personas.find(person => String(person.id) === String(client.seguimientoPersonaActivaId)) || client.personas[0];
    const cards = [];

    for (let index = 0; index < limit; index++) {
      const person = client.personas[index];
      if (person) {
        cards.push(`<button type="button" class="rage-pair-person ${String(person.id) === String(active?.id) ? 'active' : ''}" onclick="seleccionarPersonaGrupoRage(${Number(client.id)},'${esc(person.id)}')"><span>PERSONA ${index + 1}</span><strong>${esc(person.nombre || 'Sin completar')}</strong><small>${esc(person.telefono || 'Sin teléfono')}${person.email ? ` · ${esc(person.email)}` : ''}</small><em>${person.mesociclos.length} mesociclo${person.mesociclos.length === 1 ? '' : 's'} · ${person.mediciones.length} medición${person.mediciones.length === 1 ? '' : 'es'}</em></button>`);
      } else {
        cards.push(`<button type="button" class="rage-pair-person missing" onclick="editarPersonasGrupoRage(${Number(client.id)})"><span>PERSONA ${index + 1}</span><strong>Completar persona</strong><small>Necesaria para la ficha de ${client.bonoModalidad.toLowerCase()}</small></button>`);
      }
    }

    const block = document.createElement('section');
    block.id = 'ragePairPeople';
    block.className = `rage-pair-people ${limit === 3 ? 'rage-trio-people' : ''}`;
    block.innerHTML = `
      <div class="rage-pair-people-head"><div><span>BONO EN ${modeLabel(client.bonoModalidad)}</span><h2>${esc(client.nombre)}</h2><p>Comparten ${esc(client.bonoDisponible)}/${esc(client.bonoTotal)} sesiones, agenda y pagos. El seguimiento deportivo es individual para cada persona.</p></div><button type="button" onclick="editarPersonasGrupoRage(${Number(client.id)})">Editar personas</button></div>
      <div class="rage-pair-person-grid ${limit === 3 ? 'rage-three-members' : ''}">${cards.join('')}</div>`;
    ficha.prepend(block);

    const legacyCards = [...ficha.querySelectorAll(':scope > .ficha-card')];
    if (legacyCards[0]) {
      legacyCards[0].style.display = 'none';
      legacyCards[0].dataset.ragePairHidden = '1';
    }
    legacyCards.forEach(card => {
      const title = card.querySelector('h2')?.textContent.trim().toLowerCase();
      if (title === 'observaciones') {
        card.style.display = 'none';
        card.dataset.ragePairHidden = '1';
      }
    });

    const tracking = document.getElementById('clienteTrackingRage');
    if (tracking && active) {
      const heading = tracking.querySelector('.tracking-head h2');
      const description = tracking.querySelector('.tracking-head p');
      if (heading) heading.textContent = `Seguimiento de ${active.nombre}`;
      if (description) description.textContent = 'Mesociclos, mediciones, tablas opcionales y plan de ejercicios propios de esta persona.';
    }
  }

  const viewPrevious = window.verFichaCliente;
  if (typeof viewPrevious === 'function') {
    window.verFichaCliente = function (id) {
      const client = byId(id);
      if (client) normalizeClient(client);
      const result = viewPrevious.apply(this, arguments);
      requestAnimationFrame(() => decorateClient(client));
      setTimeout(() => decorateClient(client), 60);
      return result;
    };
  }

  const screenPrevious = window.cambiarPantalla;
  if (typeof screenPrevious === 'function') {
    window.cambiarPantalla = function (screenId) {
      const result = screenPrevious.apply(this, arguments);
      if (screenId === 'alta-screen') {
        requestAnimationFrame(ensureGroupFields);
        setTimeout(ensureGroupFields, 40);
      }
      return result;
    };
  }

  function normalizeAll() {
    let changed = false;
    list().forEach(client => { if (normalizeClient(client)) changed = true; });
    ensureGroupFields();
    if (changed) save();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeAll, { once: true });
  } else {
    normalizeAll();
  }

  window.RageGrupos = { version: VERSION, normalize: normalizeAll, memberLimit };
})();
