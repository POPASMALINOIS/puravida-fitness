(() => {
  if (window.RageParejasV253) return;
  window.RageParejasV253 = true;

  const VERSION = '2.4.53';
  const list = () => { try { return Array.isArray(clientes) ? clientes : []; } catch (_) { return []; } };
  const byId = id => list().find(c => Number(c?.id) === Number(id));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensurePersonArrays(p) {
    if (!p) return;
    if (!Array.isArray(p.mesociclos)) p.mesociclos = [];
    if (!Array.isArray(p.mediciones)) p.mediciones = [];
  }

  function newPersonId(c, order) {
    return `PERSONA-${c.id}-${order}-${Date.now()}`;
  }

  function syncActiveTracking(c) {
    if (!c || !Array.isArray(c.personas) || !c.personas.length) return;
    const active = c.personas.find(p => String(p.id) === String(c.seguimientoPersonaActivaId)) || c.personas[0];
    ensurePersonArrays(active);
    if (Array.isArray(c.mesociclos)) active.mesociclos = c.mesociclos;
    if (Array.isArray(c.mediciones)) active.mediciones = c.mediciones;
  }

  function activatePerson(c, personId) {
    if (!c || !Array.isArray(c.personas) || !c.personas.length) return null;
    syncActiveTracking(c);
    const person = c.personas.find(p => String(p.id) === String(personId)) || c.personas[0];
    ensurePersonArrays(person);
    c.seguimientoPersonaActivaId = person.id;
    c.mesociclos = person.mesociclos;
    c.mediciones = person.mediciones;
    c.controles = person.mediciones;
    return person;
  }

  function normalizeClient(c) {
    if (!c) return false;
    let changed = false;
    if (!Array.isArray(c.personas) || !c.personas.length) {
      c.personas = [{
        id: newPersonId(c, 1),
        nombre: c.nombre || '',
        telefono: c.telefono || '',
        email: c.email || '',
        fechaAlta: c.fechaAlta || '',
        observaciones: c.observaciones || '',
        mesociclos: Array.isArray(c.mesociclos) ? c.mesociclos : [],
        mediciones: Array.isArray(c.mediciones) ? c.mediciones : (Array.isArray(c.controles) ? c.controles : [])
      }];
      c.seguimientoPersonaActivaId = c.personas[0].id;
      changed = true;
    }
    c.personas.forEach(ensurePersonArrays);
    if (!c.personas.some(p => String(p.id) === String(c.seguimientoPersonaActivaId))) {
      c.seguimientoPersonaActivaId = c.personas[0].id;
      changed = true;
    }

    if (c.bonoModalidad === 'Pareja' && c.personas.length >= 2) {
      const name = c.personas.slice(0, 2).map(p => p.nombre).filter(Boolean).join(' / ');
      if (name && c.nombre !== name) { c.nombre = name; changed = true; }
    } else if (c.bonoModalidad !== 'Pareja' && c.personas[0]?.nombre) {
      const p = c.personas[0];
      if (c.nombre !== p.nombre) { c.nombre = p.nombre; changed = true; }
      c.telefono = p.telefono || '';
      c.email = p.email || '';
      c.fechaAlta = p.fechaAlta || '';
      c.observaciones = p.observaciones || '';
    }
    activatePerson(c, c.seguimientoPersonaActivaId);
    return changed;
  }

  const savePrevious = window.guardarDatos;
  if (typeof savePrevious === 'function') {
    window.guardarDatos = function () {
      list().forEach(c => {
        normalizeClient(c);
        syncActiveTracking(c);
        if (c.personas?.length === 1) {
          const p = c.personas[0];
          p.nombre = c.nombre || p.nombre;
          p.telefono = c.telefono || '';
          p.email = c.email || '';
          p.fechaAlta = c.fechaAlta || '';
          p.observaciones = c.observaciones || '';
        }
      });
      return savePrevious.apply(this, arguments);
    };
  }

  function ensurePairFields() {
    const mode = document.getElementById('clienteBonoModalidad');
    if (!mode) return;
    const grid = mode.closest('.form-grid');
    if (!grid) return;

    let block = document.getElementById('ragePairSecondPerson');
    if (!block) {
      block = document.createElement('section');
      block.id = 'ragePairSecondPerson';
      block.className = 'rage-pair-second-person';
      block.innerHTML = `
        <div class="rage-pair-form-head"><div><span>PERSONA 2</span><strong>Segundo integrante de la pareja</strong><small>El bono y todas las clases serán comunes. Su seguimiento será independiente.</small></div></div>
        <div class="rage-pair-form-grid">
          <label><span>Nombre completo *</span><input id="pareja2Nombre" type="text" autocomplete="off"></label>
          <label><span>Teléfono</span><input id="pareja2Telefono" type="tel" inputmode="tel"></label>
          <label><span>Email</span><input id="pareja2Email" type="text" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false"></label>
          <label><span>Fecha de alta</span><input id="pareja2FechaAlta" type="date"></label>
          <label class="full"><span>Observaciones personales</span><textarea id="pareja2Observaciones" rows="2"></textarea></label>
        </div>`;
      grid.insertAdjacentElement('afterend', block);
    }

    const toggle = () => {
      block.hidden = mode.value !== 'Pareja';
      const card = grid.closest('.alta-card, .form-surface, .card');
      if (card) card.classList.toggle('rage-is-pair', mode.value === 'Pareja');
    };
    if (mode.dataset.ragePairBound !== '1') {
      mode.dataset.ragePairBound = '1';
      mode.addEventListener('change', toggle);
    }
    toggle();
  }

  const addPrevious = window.agregarCliente;
  if (typeof addPrevious === 'function') {
    window.agregarCliente = function () {
      ensurePairFields();
      const mode = document.getElementById('clienteBonoModalidad')?.value || 'Individual';
      const primary = {
        nombre: document.getElementById('clienteNombre')?.value.trim() || '',
        telefono: document.getElementById('clienteTelefono')?.value.trim() || '',
        email: document.getElementById('clienteEmail')?.value.trim() || '',
        fechaAlta: document.getElementById('clienteFechaAlta')?.value || '',
        observaciones: document.getElementById('clienteObservaciones')?.value.trim() || ''
      };
      const second = {
        nombre: document.getElementById('pareja2Nombre')?.value.trim() || '',
        telefono: document.getElementById('pareja2Telefono')?.value.trim() || '',
        email: document.getElementById('pareja2Email')?.value.trim() || '',
        fechaAlta: document.getElementById('pareja2FechaAlta')?.value || primary.fechaAlta,
        observaciones: document.getElementById('pareja2Observaciones')?.value.trim() || ''
      };
      if (mode === 'Pareja' && !second.nombre) {
        alert('Introduce el nombre de la segunda persona de la pareja.');
        return;
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
      if (mode === 'Pareja') {
        created.personas.push({ id: newPersonId(created, 2), ...second, mesociclos: [], mediciones: [] });
        created.nombre = `${p1.nombre} / ${second.nombre}`;
      } else {
        created.nombre = p1.nombre;
      }
      created.telefono = p1.telefono;
      created.email = p1.email;
      created.fechaAlta = p1.fechaAlta;
      created.observaciones = p1.observaciones;
      created.seguimientoPersonaActivaId = p1.id;
      activatePerson(created, p1.id);
      if (typeof window.guardarDatos === 'function') window.guardarDatos();
      if (typeof renderClientes === 'function') renderClientes();

      ['pareja2Nombre','pareja2Telefono','pareja2Email','pareja2FechaAlta','pareja2Observaciones'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      return result;
    };
  }

  function closeEditor() { document.getElementById('ragePairEditor')?.remove(); }

  function openPeopleEditor(c) {
    normalizeClient(c);
    const p1 = c.personas[0];
    const p2 = c.personas[1] || { id: newPersonId(c, 2), nombre:'', telefono:'', email:'', fechaAlta:p1.fechaAlta || '', observaciones:'', mesociclos:[], mediciones:[] };
    closeEditor();
    const wrap = document.createElement('div');
    wrap.id = 'ragePairEditor';
    wrap.className = 'rage-pair-editor-wrap';
    wrap.innerHTML = `
      <div class="rage-pair-editor-backdrop"></div>
      <section class="rage-pair-editor" role="dialog" aria-modal="true">
        <header><div><span>BONO EN PAREJA</span><h3>Datos de las dos personas</h3><p>El bono, pagos y agenda son comunes; mesociclos, mediciones y planes son individuales.</p></div><button type="button" class="rage-pair-editor-close">×</button></header>
        <div class="rage-pair-editor-body">
          ${personForm('p1', 'PERSONA 1', p1)}
          ${personForm('p2', 'PERSONA 2', p2)}
        </div>
        <footer><button type="button" class="rage-pair-editor-cancel">Cancelar</button><button type="button" class="rage-pair-editor-save">Guardar personas</button></footer>
      </section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.rage-pair-editor-backdrop').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-close').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-cancel').onclick = closeEditor;
    wrap.querySelector('.rage-pair-editor-save').onclick = () => {
      const read = prefix => ({
        nombre: document.getElementById(`${prefix}Name`).value.trim(),
        telefono: document.getElementById(`${prefix}Phone`).value.trim(),
        email: document.getElementById(`${prefix}Email`).value.trim(),
        fechaAlta: document.getElementById(`${prefix}Date`).value,
        observaciones: document.getElementById(`${prefix}Notes`).value.trim()
      });
      const a = read('p1'), b = read('p2');
      if (!a.nombre || (c.bonoModalidad === 'Pareja' && !b.nombre)) {
        alert('El nombre de las dos personas es obligatorio para un bono en pareja.'); return;
      }
      Object.assign(p1, a); ensurePersonArrays(p1);
      Object.assign(p2, b); ensurePersonArrays(p2);
      c.personas = c.bonoModalidad === 'Pareja' ? [p1, p2] : [p1];
      c.nombre = c.bonoModalidad === 'Pareja' ? `${p1.nombre} / ${p2.nombre}` : p1.nombre;
      c.telefono = p1.telefono; c.email = p1.email; c.fechaAlta = p1.fechaAlta;
      if (!c.personas.some(p => String(p.id) === String(c.seguimientoPersonaActivaId))) c.seguimientoPersonaActivaId = p1.id;
      activatePerson(c, c.seguimientoPersonaActivaId);
      if (typeof window.guardarDatos === 'function') window.guardarDatos();
      closeEditor();
      if (typeof verFichaCliente === 'function') verFichaCliente(c.id);
    };
  }

  function personForm(prefix, label, p) {
    return `<section class="rage-person-edit-card"><div class="rage-person-edit-title"><span>${label}</span><strong>${esc(p.nombre || 'Sin completar')}</strong></div><div class="rage-person-edit-grid">
      <label><span>Nombre completo *</span><input id="${prefix}Name" type="text" value="${esc(p.nombre)}"></label>
      <label><span>Teléfono</span><input id="${prefix}Phone" type="tel" inputmode="tel" value="${esc(p.telefono)}"></label>
      <label><span>Email</span><input id="${prefix}Email" type="text" inputmode="email" value="${esc(p.email)}"></label>
      <label><span>Fecha de alta</span><input id="${prefix}Date" type="date" value="${esc(p.fechaAlta)}"></label>
      <label class="full"><span>Observaciones personales</span><textarea id="${prefix}Notes" rows="2">${esc(p.observaciones)}</textarea></label>
    </div></section>`;
  }

  window.editarPersonasParejaRage = id => { const c = byId(id); if (c) openPeopleEditor(c); };
  window.seleccionarPersonaParejaRage = function (clientId, personId) {
    const c = byId(clientId); if (!c) return;
    activatePerson(c, personId);
    if (typeof window.guardarDatos === 'function') window.guardarDatos();
    if (typeof verFichaCliente === 'function') verFichaCliente(c.id);
  };

  const editPrevious = window.editarClienteRage;
  if (typeof editPrevious === 'function') {
    window.editarClienteRage = function (id) {
      const c = byId(id); if (!c) return;
      normalizeClient(c);
      if (c.bonoModalidad === 'Pareja') return openPeopleEditor(c);
      return editPrevious.apply(this, arguments);
    };
  }

  function decorateClient(c) {
    const ficha = document.getElementById('clienteFicha');
    if (!ficha || !c) return;
    normalizeClient(c);

    ficha.querySelector('#ragePairPeople')?.remove();
    ficha.querySelectorAll('[data-rage-pair-hidden="1"]').forEach(el => { el.style.display = ''; delete el.dataset.ragePairHidden; });
    if (c.bonoModalidad !== 'Pareja') return;

    const active = c.personas.find(p => String(p.id) === String(c.seguimientoPersonaActivaId)) || c.personas[0];
    const block = document.createElement('section');
    block.id = 'ragePairPeople';
    block.className = 'rage-pair-people';
    block.innerHTML = `
      <div class="rage-pair-people-head"><div><span>BONO EN PAREJA</span><h2>${esc(c.nombre)}</h2><p>Comparten ${esc(c.bonoDisponible)}/${esc(c.bonoTotal)} sesiones, agenda y pagos. El seguimiento deportivo es individual.</p></div><button type="button" onclick="editarPersonasParejaRage(${Number(c.id)})">Editar personas</button></div>
      <div class="rage-pair-person-grid">
        ${c.personas.slice(0,2).map((p,i)=>`<button type="button" class="rage-pair-person ${String(p.id)===String(active?.id)?'active':''}" onclick="seleccionarPersonaParejaRage(${Number(c.id)},'${esc(p.id)}')"><span>PERSONA ${i+1}</span><strong>${esc(p.nombre || 'Sin completar')}</strong><small>${esc(p.telefono || 'Sin teléfono')}${p.email?` · ${esc(p.email)}`:''}</small><em>${p.mesociclos.length} mesociclo${p.mesociclos.length===1?'':'s'} · ${p.mediciones.length} medición${p.mediciones.length===1?'':'es'}</em></button>`).join('')}
        ${c.personas.length < 2 ? `<button type="button" class="rage-pair-person missing" onclick="editarPersonasParejaRage(${Number(c.id)})"><span>PERSONA 2</span><strong>Completar segunda persona</strong><small>Necesaria para la ficha de pareja</small></button>` : ''}
      </div>`;
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
      if (p) p.textContent = 'Mesociclos, mediciones y plan de ejercicios propios de esta persona.';
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
    ensurePairFields();
    if (changed && typeof window.guardarDatos === 'function') window.guardarDatos();
  }

  const observer = new MutationObserver(() => ensurePairFields());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeAll, { once:true });
  else normalizeAll();

  window.RageParejas = { version: VERSION, normalize: normalizeAll };
})();
