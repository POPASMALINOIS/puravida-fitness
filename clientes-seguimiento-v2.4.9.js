(() => {
  const VERSION = '2.4.9';

  function ensureArrays(cliente) {
    if (!cliente) return;
    if (!Array.isArray(cliente.mesociclos)) cliente.mesociclos = [];
    if (!Array.isArray(cliente.mediciones)) {
      cliente.mediciones = Array.isArray(cliente.controles) ? cliente.controles : [];
    }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function fmtFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    try { return typeof formatearFechaES === 'function' ? formatearFechaES(fecha) : fecha; }
    catch (_) { return fecha; }
  }

  function diasTexto(dias = []) {
    const map = {lunes:'Lun',martes:'Mar',miercoles:'Mié',jueves:'Jue',viernes:'Vie',sabado:'Sáb',domingo:'Dom'};
    return dias.length ? dias.map(d => map[d] || d).join(' · ') : 'Sin días marcados';
  }

  function guardar() {
    if (typeof guardarDatos === 'function') guardarDatos();
  }

  function getCliente(id) {
    return (window.clientes || clientes || []).find(c => Number(c.id) === Number(id));
  }

  function renderMesociclos(cliente) {
    ensureArrays(cliente);
    if (!cliente.mesociclos.length) {
      return '<div class="tracking-empty">Todavía no hay mesociclos creados para este cliente.</div>';
    }
    return [...cliente.mesociclos].sort((a,b)=>(b.id||0)-(a.id||0)).map((m, idx) => `
      <article class="meso-item">
        <div class="meso-top">
          <div><span class="meso-label">MESOCICLO ${m.numero || (cliente.mesociclos.length - idx)}</span><h4>${esc(m.objetivo || 'Sin objetivo')}</h4></div>
          <div class="meso-actions"><button onclick="editarMesocicloRage(${cliente.id},${m.id})">Editar</button><button class="danger" onclick="eliminarMesocicloRage(${cliente.id},${m.id})">Borrar</button></div>
        </div>
        <div class="meso-meta">
          <span><strong>Duración</strong>${esc(m.duracion || 'No indicada')}</span>
          <span><strong>Lesiones / patologías</strong>${esc(m.lesiones || 'Ninguna')}</span>
          <span><strong>Planificación semanal</strong>${esc(diasTexto(m.dias))}</span>
        </div>
        ${m.comentarios ? `<p class="meso-comment">${esc(m.comentarios)}</p>` : ''}
      </article>`).join('');
  }

  function renderMediciones(cliente) {
    ensureArrays(cliente);
    if (!cliente.mediciones.length) {
      return '<div class="tracking-empty">Todavía no hay mediciones registradas.</div>';
    }
    return [...cliente.mediciones].sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||''))).map(m => `
      <article class="measurement-item">
        <div class="measurement-date"><strong>${fmtFecha(m.fecha)}</strong><span>${esc(m.observaciones || '')}</span></div>
        <div class="measurement-grid">
          <span><small>Peso</small><strong>${m.peso !== '' && m.peso != null ? esc(m.peso)+' kg' : '—'}</strong></span>
          <span><small>Grasa</small><strong>${m.grasa !== '' && m.grasa != null ? esc(m.grasa)+' %' : '—'}</strong></span>
          <span><small>Músculo</small><strong>${m.musculo !== '' && m.musculo != null ? esc(m.musculo)+' %' : '—'}</strong></span>
          <span><small>Hidratación</small><strong>${m.hidratacion !== '' && m.hidratacion != null ? esc(m.hidratacion)+' %' : '—'}</strong></span>
          <span><small>Plicometría</small><strong>${m.plicometria !== '' && m.plicometria != null ? esc(m.plicometria)+' %' : '—'}</strong></span>
        </div>
        <div class="measurement-actions"><button onclick="editarMedicionRage(${cliente.id},${m.id})">Editar</button><button class="danger" onclick="eliminarMedicionRage(${cliente.id},${m.id})">Borrar</button></div>
      </article>`).join('');
  }

  function injectClienteTracking(cliente) {
    const ficha = document.getElementById('clienteFicha');
    if (!ficha || !cliente) return;
    ensureArrays(cliente);

    const existing = document.getElementById('clienteTrackingRage');
    if (existing) existing.remove();

    const block = document.createElement('section');
    block.id = 'clienteTrackingRage';
    block.className = 'cliente-tracking';
    block.innerHTML = `
      <div class="tracking-head">
        <div><span class="section-kicker">PLANIFICACIÓN Y EVOLUCIÓN</span><h2>Seguimiento del cliente</h2><p>Mesociclos de trabajo y evolución de mediciones en una sola ficha.</p></div>
      </div>
      <div class="tracking-tabs">
        <button class="active" data-track-tab="mesociclos" onclick="cambiarTrackingTabRage('mesociclos')">Mesociclos <span>${cliente.mesociclos.length}</span></button>
        <button data-track-tab="mediciones" onclick="cambiarTrackingTabRage('mediciones')">Mediciones <span>${cliente.mediciones.length}</span></button>
      </div>
      <div id="trackMesociclos" class="tracking-pane active">
        <div class="tracking-pane-head"><div><h3>Mesociclos</h3><p>Bloques de planificación específicos de este cliente.</p></div><button class="tracking-add" onclick="nuevoMesocicloRage(${cliente.id})">+ Añadir mesociclo</button></div>
        <div id="mesociclosListaRage">${renderMesociclos(cliente)}</div>
      </div>
      <div id="trackMediciones" class="tracking-pane">
        <div class="tracking-pane-head"><div><h3>Mediciones</h3><p>Histórico de composición corporal y evolución.</p></div><button class="tracking-add" onclick="nuevaMedicionRage(${cliente.id})">+ Añadir medición</button></div>
        <div id="medicionesListaRage">${renderMediciones(cliente)}</div>
      </div>`;

    ficha.prepend(block);
  }

  window.cambiarTrackingTabRage = function(tab) {
    document.querySelectorAll('[data-track-tab]').forEach(b => b.classList.toggle('active', b.dataset.trackTab === tab));
    const meso = document.getElementById('trackMesociclos');
    const med = document.getElementById('trackMediciones');
    if (meso) meso.classList.toggle('active', tab === 'mesociclos');
    if (med) med.classList.toggle('active', tab === 'mediciones');
  };

  function modal(title, body, onSave) {
    document.getElementById('rageTrackingModal')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'rageTrackingModal';
    wrap.className = 'tracking-modal-backdrop';
    wrap.innerHTML = `<div class="tracking-modal"><div class="tracking-modal-head"><div><span class="section-kicker">CLIENTE</span><h3>${esc(title)}</h3></div><button type="button" onclick="cerrarTrackingModalRage()">×</button></div><div class="tracking-modal-body">${body}</div><div class="tracking-modal-actions"><button class="secondary" type="button" onclick="cerrarTrackingModalRage()">Cancelar</button><button class="primary" id="trackingModalSave" type="button">Guardar</button></div></div>`;
    document.body.appendChild(wrap);
    document.getElementById('trackingModalSave').onclick = onSave;
  }
  window.cerrarTrackingModalRage = () => document.getElementById('rageTrackingModal')?.remove();

  function mesoForm(data = {}) {
    const dias = new Set(data.dias || []);
    const day = (key,label) => `<label class="day-check"><input type="checkbox" value="${key}" ${dias.has(key)?'checked':''}><span>${label}</span></label>`;
    return `
      <label class="tracking-field full"><span>Objetivo</span><textarea id="mesoObjetivo" rows="3" placeholder="Objetivo principal del mesociclo">${esc(data.objetivo || '')}</textarea></label>
      <div class="tracking-form-grid"><label class="tracking-field"><span>Duración</span><input id="mesoDuracion" type="text" placeholder="Ej. Mayo y junio" value="${esc(data.duracion || '')}"></label><label class="tracking-field"><span>Lesiones o patologías</span><input id="mesoLesiones" type="text" placeholder="Ninguna / detalle" value="${esc(data.lesiones || '')}"></label></div>
      <div class="tracking-field full"><span>Planificación semanal</span><div id="mesoDias" class="week-picker">${day('lunes','Lun')}${day('martes','Mar')}${day('miercoles','Mié')}${day('jueves','Jue')}${day('viernes','Vie')}${day('sabado','Sáb')}${day('domingo','Dom')}</div></div>
      <label class="tracking-field full"><span>Comentarios / observaciones</span><textarea id="mesoComentarios" rows="3" placeholder="Notas de planificación, progresión, carrera, trabajo de core...">${esc(data.comentarios || '')}</textarea></label>`;
  }

  window.nuevoMesocicloRage = function(clienteId) {
    const cliente = getCliente(clienteId); if (!cliente) return; ensureArrays(cliente);
    modal('Nuevo mesociclo', mesoForm(), () => saveMeso(cliente, null));
  };
  window.editarMesocicloRage = function(clienteId,id) {
    const cliente = getCliente(clienteId); if (!cliente) return; ensureArrays(cliente);
    const data = cliente.mesociclos.find(m=>Number(m.id)===Number(id)); if (!data) return;
    modal('Editar mesociclo', mesoForm(data), () => saveMeso(cliente, id));
  };
  function saveMeso(cliente,id) {
    const objetivo=document.getElementById('mesoObjetivo').value.trim();
    if (!objetivo) { alert('Indica el objetivo del mesociclo.'); return; }
    const dias=[...document.querySelectorAll('#mesoDias input:checked')].map(i=>i.value);
    const item={id:id||Date.now(),numero:id?(cliente.mesociclos.find(m=>Number(m.id)===Number(id))?.numero):(cliente.mesociclos.length+1),objetivo,duracion:document.getElementById('mesoDuracion').value.trim(),lesiones:document.getElementById('mesoLesiones').value.trim(),dias,comentarios:document.getElementById('mesoComentarios').value.trim()};
    if (id) cliente.mesociclos = cliente.mesociclos.map(m=>Number(m.id)===Number(id)?item:m); else cliente.mesociclos.push(item);
    guardar(); cerrarTrackingModalRage(); window.verFichaCliente(cliente.id);
  }
  window.eliminarMesocicloRage = function(clienteId,id) {
    const cliente=getCliente(clienteId); if(!cliente||!confirm('¿Eliminar este mesociclo?'))return; ensureArrays(cliente);
    cliente.mesociclos=cliente.mesociclos.filter(m=>Number(m.id)!==Number(id)); guardar(); window.verFichaCliente(cliente.id);
  };

  function medicionForm(data={}) {
    const num=(id,label,value,unit)=>`<label class="tracking-field"><span>${label}</span><div class="unit-input"><input id="${id}" type="number" step="0.1" inputmode="decimal" value="${esc(value ?? '')}"><small>${unit}</small></div></label>`;
    return `<div class="tracking-form-grid"><label class="tracking-field"><span>Fecha</span><input id="medFecha" type="date" value="${esc(data.fecha || (typeof obtenerFechaISO==='function'?obtenerFechaISO(new Date()):''))}"></label>${num('medPeso','Peso',data.peso,'kg')}${num('medGrasa','Grasa',data.grasa,'%')}${num('medMusculo','Músculo',data.musculo,'%')}${num('medHidratacion','Hidratación',data.hidratacion,'%')}${num('medPlicometria','Plicometría',data.plicometria,'%')}</div><label class="tracking-field full"><span>Observaciones / objetivo</span><textarea id="medObservaciones" rows="3" placeholder="Objetivo, evolución o comentario de esta medición">${esc(data.observaciones || '')}</textarea></label>`;
  }
  window.nuevaMedicionRage=function(clienteId){const c=getCliente(clienteId);if(!c)return;ensureArrays(c);modal('Nueva medición',medicionForm(),()=>saveMed(c,null));};
  window.editarMedicionRage=function(clienteId,id){const c=getCliente(clienteId);if(!c)return;ensureArrays(c);const d=c.mediciones.find(m=>Number(m.id)===Number(id));if(!d)return;modal('Editar medición',medicionForm(d),()=>saveMed(c,id));};
  function saveMed(c,id){
    const fecha=document.getElementById('medFecha').value;if(!fecha){alert('Selecciona una fecha.');return;}
    const val=id=>document.getElementById(id).value;
    const item={id:id||Date.now(),fecha,peso:val('medPeso'),grasa:val('medGrasa'),musculo:val('medMusculo'),hidratacion:val('medHidratacion'),plicometria:val('medPlicometria'),observaciones:document.getElementById('medObservaciones').value.trim()};
    if(id)c.mediciones=c.mediciones.map(m=>Number(m.id)===Number(id)?item:m);else c.mediciones.push(item);
    guardar();cerrarTrackingModalRage();window.verFichaCliente(c.id);setTimeout(()=>cambiarTrackingTabRage('mediciones'),0);
  }
  window.eliminarMedicionRage=function(clienteId,id){const c=getCliente(clienteId);if(!c||!confirm('¿Eliminar esta medición?'))return;ensureArrays(c);c.mediciones=c.mediciones.filter(m=>Number(m.id)!==Number(id));guardar();window.verFichaCliente(c.id);setTimeout(()=>cambiarTrackingTabRage('mediciones'),0);};

  function ensureMedicionesSection(){
    const main=document.querySelector('.main-panel'); if(!main)return null;
    let sec=document.getElementById('mediciones-section');
    if(!sec){sec=document.createElement('section');sec.id='mediciones-section';sec.style.display='none';main.appendChild(sec);} return sec;
  }
  function renderMedicionesGlobal(){
    const sec=ensureMedicionesSection();if(!sec)return;
    const list=(window.clientes||clientes||[]).map(c=>{ensureArrays(c);const last=[...c.mediciones].sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];return `<div class="measurement-client-row"><div><strong>${esc(c.nombre)}</strong><span>${last?`Última: ${fmtFecha(last.fecha)}`:'Sin mediciones'}</span></div><div>${last?`${esc(last.peso||'—')} kg · ${esc(last.grasa||'—')}% grasa`:'—'}</div><button onclick="verFichaCliente(${c.id});setTimeout(()=>cambiarTrackingTabRage('mediciones'),0)">Ver mediciones</button></div>`}).join('');
    sec.innerHTML=`<div class="section-heading"><div><span class="section-kicker">EVOLUCIÓN</span><h2>Mediciones</h2><p>Control corporal y evolución histórica por cliente.</p></div></div><div class="measurement-global-list">${list||'<div class="tracking-empty">No hay clientes registrados.</div>'}</div>`;
  }

  const verFichaOriginal=window.verFichaCliente;
  window.verFichaCliente=function(id){
    const result=verFichaOriginal(id);
    const c=getCliente(id); if(c){ensureArrays(c);guardar();injectClienteTracking(c);} return result;
  };

  const mostrarOriginal=window.mostrarSeccion;
  window.mostrarSeccion=function(seccion){
    const med=ensureMedicionesSection();
    if(seccion==='controles'||seccion==='mediciones'){
      document.querySelectorAll('.main-panel > section').forEach(s=>{if(s.id!=='mediciones-section')s.style.display='none'});
      if(med){med.style.display='block';renderMedicionesGlobal();}
      document.querySelectorAll('.sidebar nav button').forEach(b=>b.classList.remove('nav-active'));
      const nav=[...document.querySelectorAll('.sidebar nav button')].find(b=>(b.getAttribute('onclick')||'').includes("'controles'"));if(nav)nav.classList.add('nav-active');
      const t=document.getElementById('tituloPanel'),st=document.getElementById('subtituloPanel');if(t)t.textContent='Mediciones';if(st)st.textContent='Evolución y composición corporal de clientes';
      window.scrollTo(0,0);return;
    }
    if(med)med.style.display='none';
    return mostrarOriginal(seccion);
  };

  function renameNav(){
    const nav=[...document.querySelectorAll('.sidebar nav button')].find(b=>(b.getAttribute('onclick')||'').includes("'controles'"));
    if(nav){const spans=nav.querySelectorAll('span');if(spans.length>1)spans[1].textContent='Mediciones';else nav.textContent='Mediciones';}
  }

  document.addEventListener('DOMContentLoaded',()=>{renameNav();ensureMedicionesSection();(window.clientes||clientes||[]).forEach(ensureArrays);guardar();});
  renameNav();
})();