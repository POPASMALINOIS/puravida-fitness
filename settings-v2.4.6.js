(function(){
  const KEY='rageTrainingSettings';
  const defaults={
    centroNombre:'Rage Training',centroTelefono:'',centroEmail:'',centroDireccion:'',
    bonoUmbral:2,pagosDiaLimite:5,densidad:'normal',reducirMovimiento:false
  };
  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {...defaults}}}
  function save(v){localStorage.setItem(KEY,JSON.stringify(v));return v}
  let cfg=load();
  function apply(){
    document.documentElement.classList.toggle('density-compact',cfg.densidad==='compacta');
    document.documentElement.classList.toggle('reduce-motion',!!cfg.reducirMovimiento);
  }
  function top(){document.documentElement.scrollTop=0;document.body.scrollTop=0;window.scrollTo(0,0);const m=document.querySelector('.main-panel');if(m)m.scrollTop=0}
  function inject(){
    const main=document.querySelector('.main-panel'); if(!main||document.getElementById('ajustes-section'))return;
    const s=document.createElement('section'); s.id='ajustes-section';
    s.innerHTML=`
      <div class="section-heading"><div><span class="section-kicker">CONFIGURACIÓN</span><h2>Ajustes</h2><p>Preferencias del centro, reglas de gestión y copias de seguridad.</p></div></div>
      <div class="settings-grid">
        <article class="settings-card"><div class="settings-card-head"><div><span class="section-kicker">CENTRO</span><h3>Datos del centro</h3><p>Información general para futuras fichas, informes y exportaciones.</p></div><span class="settings-icon">⌂</span></div><div class="settings-fields">
          <div class="settings-field full"><label>Nombre del centro</label><input id="setCentroNombre" type="text"></div>
          <div class="settings-field"><label>Teléfono</label><input id="setCentroTelefono" type="tel"></div>
          <div class="settings-field"><label>Email</label><input id="setCentroEmail" type="email"></div>
          <div class="settings-field full"><label>Dirección</label><input id="setCentroDireccion" type="text"></div>
        </div></article>
        <article class="settings-card"><div class="settings-card-head"><div><span class="section-kicker">REGLAS</span><h3>Bonos y pagos</h3><p>Define cuándo debe aparecer una alerta dentro de la gestión diaria.</p></div><span class="settings-icon">◒</span></div><div class="settings-fields">
          <div class="settings-field"><label>Bono crítico cuando quedan</label><select id="setBonoUmbral"><option value="1">1 sesión</option><option value="2">2 sesiones</option><option value="3">3 sesiones</option><option value="4">4 sesiones</option></select></div>
          <div class="settings-field"><label>Pago pendiente desde el día</label><select id="setPagosDiaLimite">${Array.from({length:15},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></div>
        </div><div class="settings-help">Estos valores se aplican a Bonos críticos y al estado de pagos de los clientes.</div></article>
        <article class="settings-card"><div class="settings-card-head"><div><span class="section-kicker">INTERFAZ</span><h3>Visualización</h3><p>Ajustes locales para este dispositivo.</p></div><span class="settings-icon">◫</span></div>
          <div class="settings-toggle-row"><div class="settings-toggle-copy"><strong>Vista compacta</strong><span>Reduce ligeramente la altura de listas y tarjetas.</span></div><label class="settings-toggle"><input id="setCompacta" type="checkbox"><span class="settings-toggle-ui"></span></label></div>
          <div class="settings-toggle-row"><div class="settings-toggle-copy"><strong>Reducir animaciones</strong><span>Desactiva transiciones para una respuesta más directa.</span></div><label class="settings-toggle"><input id="setMovimiento" type="checkbox"><span class="settings-toggle-ui"></span></label></div>
        </article>
        <article class="settings-card"><div class="settings-card-head"><div><span class="section-kicker">DATOS</span><h3>Copias de seguridad</h3><p>Exporta o restaura todos los datos guardados por la aplicación.</p></div><span class="settings-icon">⇩</span></div>
          <div class="settings-actions"><button class="settings-btn primary" onclick="exportarBackupRage()">Exportar copia</button><button class="settings-btn" onclick="document.getElementById('importBackupRage').click()">Importar copia</button><button class="settings-btn danger" onclick="reiniciarDatosRage()">Borrar datos</button></div><input class="settings-file" id="importBackupRage" type="file" accept="application/json"><div id="settingsStatus" class="settings-status"></div>
        </article>
        <article class="settings-card settings-wide"><div class="settings-card-head"><div><span class="section-kicker">APLICACIÓN</span><h3>Información</h3><p>Estado de esta versión de trabajo.</p></div><span class="settings-icon">i</span></div><div class="settings-version"><div><strong>Rage Training</strong><span> · PWA instalada / navegador</span></div><span>v2.4.6</span></div><div class="settings-actions"><button class="settings-btn primary" onclick="guardarAjustesRage()">Guardar ajustes</button><button class="settings-btn" onclick="restaurarAjustesRage()">Restaurar valores</button></div></article>
      </div>`;
    main.appendChild(s);
    document.getElementById('importBackupRage').addEventListener('change',importarBackupRage);
  }
  function fill(){cfg=load(); const q=id=>document.getElementById(id); if(!q('setCentroNombre'))return;
    q('setCentroNombre').value=cfg.centroNombre||'';q('setCentroTelefono').value=cfg.centroTelefono||'';q('setCentroEmail').value=cfg.centroEmail||'';q('setCentroDireccion').value=cfg.centroDireccion||'';q('setBonoUmbral').value=String(cfg.bonoUmbral||2);q('setPagosDiaLimite').value=String(cfg.pagosDiaLimite||5);q('setCompacta').checked=cfg.densidad==='compacta';q('setMovimiento').checked=!!cfg.reducirMovimiento;apply();
  }
  function status(t,err){const e=document.getElementById('settingsStatus');if(e){e.textContent=t;e.style.color=err?'#ff8796':'#72e6a0'}}
  window.guardarAjustesRage=function(){
    cfg={centroNombre:document.getElementById('setCentroNombre').value.trim()||'Rage Training',centroTelefono:document.getElementById('setCentroTelefono').value.trim(),centroEmail:document.getElementById('setCentroEmail').value.trim(),centroDireccion:document.getElementById('setCentroDireccion').value.trim(),bonoUmbral:parseInt(document.getElementById('setBonoUmbral').value)||2,pagosDiaLimite:parseInt(document.getElementById('setPagosDiaLimite').value)||5,densidad:document.getElementById('setCompacta').checked?'compacta':'normal',reducirMovimiento:document.getElementById('setMovimiento').checked};save(cfg);apply();try{verificarEstadoBonos();verificarPagosPendientes();actualizarResumen()}catch(e){}status('Ajustes guardados.');
  };
  window.restaurarAjustesRage=function(){cfg={...defaults};save(cfg);fill();try{verificarEstadoBonos();verificarPagosPendientes();actualizarResumen()}catch(e){}status('Valores restaurados.');};
  window.exportarBackupRage=function(){const data={version:'2.4.6',fecha:new Date().toISOString(),clientes:JSON.parse(localStorage.getItem('clientes')||'[]'),entrenadores:JSON.parse(localStorage.getItem('entrenadores')||'[]'),ajustes:load()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rage-training-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status('Copia exportada correctamente.');};
  window.importarBackupRage=function(ev){const file=ev.target.files&&ev.target.files[0];if(!file)return;const r=new FileReader();r.onload=function(){try{const d=JSON.parse(r.result);if(!Array.isArray(d.clientes)||!Array.isArray(d.entrenadores))throw new Error('Formato no válido');localStorage.setItem('clientes',JSON.stringify(d.clientes));localStorage.setItem('entrenadores',JSON.stringify(d.entrenadores));if(d.ajustes)localStorage.setItem(KEY,JSON.stringify(Object.assign({},defaults,d.ajustes)));alert('Copia restaurada correctamente. La aplicación se recargará.');location.reload();}catch(e){status('No se ha podido importar la copia.',true)}};r.readAsText(file);};
  window.reiniciarDatosRage=function(){const ok=prompt('Esta acción borra clientes, entrenadores y ajustes de este dispositivo. Escribe BORRAR para continuar.');if(ok!=='BORRAR')return;localStorage.removeItem('clientes');localStorage.removeItem('entrenadores');localStorage.removeItem(KEY);alert('Datos eliminados. La aplicación se recargará.');location.reload();};
  const originalMostrar=window.mostrarSeccion;
  window.mostrarSeccion=function(seccion){
    if(seccion!=='ajustes')return originalMostrar(seccion);
    ['resumen-section','clientes-section','clientes-bonos-section','entrenadores-section','pagos-section','ajustes-section'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display=id==='ajustes-section'?'block':'none'});
    document.querySelectorAll('.sidebar nav button').forEach(b=>b.classList.remove('nav-active'));
    const btn=[...document.querySelectorAll('.sidebar nav button')].find(b=>(b.getAttribute('onclick')||'').includes("'ajustes'"));if(btn)btn.classList.add('nav-active');
    const t=document.getElementById('tituloPanel'),st=document.getElementById('subtituloPanel');if(t)t.textContent='Ajustes';if(st)st.textContent='Configuración, datos y preferencias de la aplicación';fill();top();requestAnimationFrame(top);setTimeout(top,30);
  };
  const origBonos=window.verificarEstadoBonos;
  window.verificarEstadoBonos=function(){cfg=load();try{clientes.forEach(c=>{if(c.bonoDisponible<=0)c.bonoEstado='Agotado';else if(c.bonoDisponible<=Number(cfg.bonoUmbral||2))c.bonoEstado='Bajo';else c.bonoEstado='Activo'});guardarDatos();}catch(e){if(origBonos)origBonos()}};
  const origPagos=window.verificarPagosPendientes;
  window.verificarPagosPendientes=function(){cfg=load();try{const hoy=new Date(),dia=hoy.getDate(),lim=Number(cfg.pagosDiaLimite||5);clientes.forEach(c=>{if(!c.pagos)c.pagos=[];const existe=c.pagos.find(p=>{const f=new Date(p.fecha);return f.getMonth()===hoy.getMonth()&&f.getFullYear()===hoy.getFullYear()});c.pagoPendiente=!existe&&dia>lim});guardarDatos();}catch(e){if(origPagos)origPagos()}};
  inject();apply();
})();
