(() => {
  if (window.RageGruposV254) return;
  window.RageGruposV254 = true;

  const VERSION = '2.4.54';
  const list = () => { try { return Array.isArray(clientes) ? clientes : []; } catch (_) { return []; } };
  const byId = id => list().find(c => Number(c?.id) === Number(id));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isGroup = mode => mode === 'Pareja' || mode === 'Trío';
  const memberLimit = mode => mode === 'Trío' ? 3 : mode === 'Pareja' ? 2 : 1;
  const modeLabel = mode => mode === 'Trío' ? 'TRÍO' : mode === 'Pareja' ? 'PAREJA' : 'INDIVIDUAL';

  function ensurePersonArrays(person) {
    if (!person) return;
    if (!Array.isArray(person.mesociclos)) person.mesociclos = [];
    if (!Array.isArray(person.mediciones)) person.mediciones = [];
  }

  function newPersonId(client, order) {
    return `PERSONA-${client.id}-${order}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  }

  function blankPerson(client, order, baseDate = '') {
    return {
      id: newPersonId(client, order),
      nombre: '', telefono: '', email: '', fechaAlta: baseDate || '', observaciones: '',
      mesociclos: [], mediciones: []
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
        nombre: client.nombre || '', telefono: client.telefono || '', email: client.email || '',
        fechaAlta: client.fechaAlta || '', observaciones: client.observaciones || '',
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
      const p = client.personas[0];
      client.telefono = p.telefono || '';
      client.email = p.email || '';
      client.fechaAlta = p.fechaAlta || '';
      client.observaciones = p.observaciones || '';
    }
    const before = client.nombre;
    updateDisplayName(client);
    if (before !== client.nombre) changed = true;
    activatePerson(client, client.seguimientoPersonaActivaId);
    return changed;
  }

  const savePrevious = window.guardarDatos;
  if (typeof savePrevious === 'function') {
    window.guardarDatos = function () {
      list().forEach(client => {
        normalizeClient(client);
        syncActiveTracking(client);
        if (!isGroup(client.bonoModalidad) && client.personas?.[0]) {
          const p = client.personas[0];
          p.nombre = client.nombre || p.nombre;
          p.telefono = client.telefono || '';
          p.email = client.email || '';
          p.fechaAlta = client.fechaAlta || '';
          p.observaciones = client.observaciones || '';
        }
        updateDisplayName(client);
      });
      return savePrevious.apply(this, arguments);
    };
  }

  function ensureModeOption(select) {
    if (!select) return;
    if (![...select.options].some(o => o.value === 'Trío')) {
      const option = document.createElement('option');
      option.value = 'Trío';
      option.textContent = 'Trío';
      select.appendChild(option);
    }
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
        block.hidden = Number(block.dataset.rageMemberBlock) > limit;
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
      for (let i = 2; i <= limit; i++) {
        if (!extra[i - 2].nombre) {
          alert(`Introduce el nombre de la persona ${i} del ${mode.toLowerCase()}.`);
          return;
        }
      }

      const before = new Set(list().map(c => String(c.id)));
      const result = addPrevious.apply(this, arguments);
      const created = list().find(c => !before.has(String(c.id)));
      if (!created) return result;

      const p1 = {
        id: newPersonId(created, 1), ...primary,
        mesociclos: Array.isArray(created.mesociclos) ? created.mesociclos : [],
        mediciones: Array.isArray(created.mediciones) ? created.mediciones : (Array.isArray(created.controles) ? created.controles : [])
      };
      created.personas = [p1];
      for (let order = 2; order <= limit; order++) {
        created.personas.push({ id: newPersonId(created, order), ...extra[order - 2], mesociclos: [], mediciones: [] });
      }
      created.telefono = p1.telefono;
      created.email = p1.email;
      created.fechaAlta = p1.fechaAlta;
      created.observaciones = p1.observaciones;
      created.seguimientoPersonaActivaId = p1.id;
      updateDisplayName(created);
      activatePerson(created, p1.id);
      if (typeof window.guardarDatos === 'function') window.guardarDatos();
      if (typeof renderClientes === 'function') renderClientes();

      for (let order = 2; order <= 3; order++) {
        ['Nombre','Telefono','Email','FechaAlta','Observaciones'].forEach(suffix => {
          const el = document.getElementById(`grupo${order}${suffix}`); if (el) el.value = '';
        });
      }
      return result;
    };
  }

  function closeEditor() { document.getElementById('ragePairEditor')?.remove(); }

  function personForm(prefix, label, p) {
    return `<section class="rage-person-edit-card"><div class="rage-person-edit-title"><span>${label}</span><strong>${esc(p.nombre || 'Sin completar')}</strong></div><div class="rage-person-edit-grid">
      <label><span>Nombre completo *</span><input id="${prefix}Name" type="text" value="${esc(p.nombre)}"></label>
      <label><span>Teléfono</span><input id="${prefix}Phone" type="tel" inputmode="tel" value="${esc(p.telefono)}"></label>
      <label><span>Email</span><input id="${prefix}Email" type="text" inputmode="email" value="${esc(p.email)}"></label>
      <label><span>Fecha de alta</span><input id="${prefix}Date" type="date" value="${esc(p.fechaAlta)}"></label>
      <label class="full"><span>Observaciones personales</span><textarea id="${prefix}Notes" rows="2">${esc(p.observaciones)}</textarea></label>
    </div></section>`;
  }

  function openPeopleEditor(client) {
    normalizeClient(client);
    const limit = memberLimit(client.bonoModalidad);
    if (limit === 1) return;
    const people = [];
    for (let i = 0; i < limit; i++) people.push(client.personas[i] || blankPerson(client, i + 1, client.personas[0]?.fechaAlta || ''));

    closeEditor();
    const wrap = document.createElement('div');
    wrap.id = 'ragePairEditor';
    wrap.className = 'rage-pair-editor-wrap';
    wrap.innerHTML = `
      <div class="rage-pair-editor-backdrop"></div>
      <section class="rage-pair-editor" role="dialog" aria-modal="true">
        <header><div><span>BONO EN ${modeLabel(client.bonoModalidad)}</span><h3>Datos de ${limit === 2 ? 'las dos' : 'las tres'} personas</h3><p>El bono, pagos y agenda son comunes; mesociclos, mediciones y planes son individuales.</p></div><button type="button" class="rage-pair-editor-close">×</button></header>
        <div class="rage-pair-editor-body ${limit === 3 ? 'rage-three-members' : ''}">
          ${people.map((p,i) => personForm(`gp${i+1}`, `PERSONA ${i+1}`, p)).join('')}
        </div>
        <footer><button type="button" class="rage-pair-editor-cancel">Cancelar</button><button type="button" class="rage-pair-editor-save">Guardar personas</button></footer>
      </section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.rage-pair-editor-backdrop').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-close').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-cancel').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-save').onclick = () => {
      const values = people.map((p,i) => {
        const prefix = `gp${i+1}`;
        return { person:p, data:{
          nombre: document.getElementById(`${prefix}Name`).value.trim(),
          telefono: document.getElementById(`${prefix}Phone`).value.trim(),
          email: document.getElementById(`${prefix}Email`).value.trim(),
          fechaAlta: document.getElementById(`${prefix}Date`).value,
          observaciones: document.getElementById(`${prefix}Notes`).value.trim()
        }};
      });
      if (values.some(v => !v.data.nombre)) {
        alert(`El nombre de ${limit === 2 ? 'las dos' : 'las tres'} personas es obligatorio.`);
        return;
      }
      values.forEach(({person,data}) => { Object.assign(person,data); ensurePersonArrays(person); });
      client.personas = values.map(v => v.person);
      const p1 = client.personas[0];
      client.telefono = p1.telefono || '';
      client.email = p1.email || '';
      client.fechaAlta = p1.fechaAlta || '';
      if (!client.personas.some(p => String(p.id) === String(client.seguimientoPersonaActivaId))) client.seguimientoPersonaActivaId = p1.id;
      updateDisplayName(client);
      activatePerson(client, client.seguimientoPersonaActivaId);
      if (typeof window.guardarDatos === 'function') window.guardarDatos();
      closeEditor();
      if (typeof verFichaCliente === 'function') verFichaCliente(client.id);
    };
  }

  window.editarPersonasGrupoRage = id => { const c = byId(id); if (c) openPeopleEditor(c); };
  window.editarPersonasParejaRage = window.editarPersonasGrupoRage;
  window.seleccionarPersonaGrupoRage = function (clientId, personId) {
    const c = byId(clientId); if (!c) return;
    activatePerson(c, personId);
    if (typeof window.guardarDatos === 'function') window.guardarDatos();
    if (typeof verFichaCliente === 'function') verFichaCliente(c.id);
  };
  window.seleccionarPersonaParejaRage = window.seleccionarPersonaGrupoRage;

  const editPrevious = window.editarClienteRage;
  if (typeof editPrevious === 'function') {
    window.editarClienteRage = function (id) {
      const c = byId(id); if (!c) return;
      normalizeClient(c);
      if (isGroup(c.bonoModalidad)) return openPeopleEditor(c);
      return editPrevious.apply(this, arguments);
    };
  }

  const bonoPrevious = window.cambiarBonoRage;
  if (typeof bonoPrevious === 'function') {
    window.cambiarBonoRage = function (id) {
      const c = byId(id);
      const oldMode = c?.bonoModalidad || 'Individual';
      const result = bonoPrevious.apply(this, arguments);
      const select = document.getElementById('ebMode');
      ensureModeOption(select);
      if (select) select.value = oldMode;
      const saveButton = document.querySelector('#rage-client-editor .rage-editor-save');
      if (saveButton && c && !saveButton.dataset.rageGroupWrapped) {
        saveButton.dataset.rageGroupWrapped = '1';
        const originalSave = saveButton.onclick;
        saveButton.onclick = function () {
          const nextMode = select?.value || 'Individual';
          const limit = memberLimit(nextMode);
          const populated = (c.personas || []).filter(p => p?.nombre?.trim()).length;
          if (populated > limit) {
            alert(`Esta ficha tiene ${populated} personas. La modalidad ${nextMode} admite ${limit}. No se cambiará para evitar perder datos.`);
            return;
          }
          const r = originalSave?.apply(this, arguments);
          setTimeout(() => {
            normalizeClient(c);
            if (isGroup(c.bonoModalidad) && (c.personas || []).length < memberLimit(c.bonoModalidad)) openPeopleEditor(c);
          }, 0);
          return r;
        };
      }
      return result;
    };
  }

  function decorateClient(c) {
    const ficha = document.getElementById('clienteFicha');
    if (!ficha || !c) return;
    normalizeClient(c);

    ficha.querySelector('#ragePairPeople')?.remove();
    ficha.querySelectorAll('[data-rage-pair-hidden="1"]').forEach(el => { el.style.display = ''; delete el.dataset.ragePairHidden; });
    if (!isGroup(c.bonoModalidad)) return;

    const limit = memberLimit(c.bonoModalidad);
    const active = c.personas.find(p => String(p.id) === String(c.seguimientoPersonaActivaId)) || c.personas[0];
    const block = document.createElement('section');
    block.id = 'ragePairPeople';
    block.className = `rage-pair-people ${limit === 3 ? 'rage-trio-people' : ''}`;
    const peopleCards = [];
    for (let i = 0; i < limit; i++) {
      const p = c.personas[i];
      if (p) {
        peopleCards.push(`<button type="button" class="rage-pair-person ${String(p.id)===String(active?.id)?'active':''}" onclick="seleccionarPersonaGrupoRage(${Number(c.id)},'${esc(p.id)}')"><span>PERSONA ${i+1}</span><strong>${esc(p.nombre || 'Sin completar')}</strong><small>${esc(p.telefono || 'Sin teléfono')}${p.email?` · ${esc(p.email)}`:''}</small><em>${p.mesociclos.length} mesociclo${p.mesociclos.length===1?'':'s'} · ${p.mediciones.length} medición${p.mediciones.length===1?'':'es'}</em></button>`);
      } else {
        peopleCards.push(`<button type="button" class="rage-pair-person missing" onclick="editarPersonasGrupoRage(${Number(c.id)})"><span>PERSONA ${i+1}</span><strong>Completar persona</strong><small>Necesaria para la ficha de ${c.bonoModalidad.toLowerCase()}</small></button>`);
      }
    }
    block.innerHTML = `
      <div class="rage-pair-people-head"><div><span>BONO EN ${modeLabel(c.bonoModalidad)}</span><h2>${esc(c.nombre)}</h2><p>Comparten ${esc(c.bonoDisponible)}/${esc(c.bonoTotal)} sesiones, agenda y pagos. El seguimiento deportivo es individual para cada persona.</p></div><button type="button" onclick="editarPersonasGrupoRage(${Number(c.id)})">Editar personas</button></div>
      <div class="rage-pair-person-grid ${limit === 3 ? 'rage-three-members' : ''}">${peopleCards.join('')}</div>`;
    ficha.prepend(block);

    const legacyCards = [...ficha.querySelectorAll(':scope > .ficha-card')];
    if (legacyCards[0]) { legacyCards[0].style.display = 'none'; legacyCards[0].dataset.ragePairHidden = '1'; }
    legacyCards.forEach(card => {
      const title = card.querySelector('h2')?.textContent.trim().toLowerCase();
      if (title === 'observaciones') { card.style.display = 'none'; card.dataset.ragePairHidden = '1'; }
    });

    const tracking = document.getElementById('clienteTrackingRage');
    if (tracking && active) {
      const h2 = tracking.querySelector('.tracking-head h2');
      const p = tracking.querySelector('.tracking-head p');
      if (h2) h2.textContent = `Seguimiento de ${active.nombre}`;
      if (p) p.textContent = 'Mesociclos, mediciones, tablas opcionales y plan de ejercicios propios de esta persona.';
    }
  }

  const viewPrevious = window.verFichaCliente;
  if (typeof viewPrevious === 'function') {
    window.verFichaCliente = function (id) {
      const c = byId(id);
      if (c) normalizeClient(c);
      const result = viewPrevious.apply(this, arguments);
      requestAnimationFrame(() => decorateClient(c));
      setTimeout(() => decorateClient(c), 50);
      setTimeout(() => decorateClient(c), 160);
      return result;
    };
  }

  function normalizeAll() {
    let changed = false;
    list().forEach(c => { if (normalizeClient(c)) changed = true; });
    ensureGroupFields();
    if (changed && typeof window.guardarDatos === 'function') window.guardarDatos();
  }

  const observer = new MutationObserver(() => ensureGroupFields());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeAll, { once:true });
  else normalizeAll();

  window.RageGrupos = { version: VERSION, normalize: normalizeAll, memberLimit };
})();
