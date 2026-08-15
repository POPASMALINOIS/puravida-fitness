(() => {
  function scrollTopApp(){
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    window.scrollTo(0,0);
    const main=document.querySelector('.main-panel');
    if(main) main.scrollTop=0;
  }

  function ensureAgendaSection(){
    const main=document.querySelector('.main-panel');
    if(!main) return null;

    let section=document.getElementById('agenda-dia-integrada-section');
    if(!section){
      section=document.createElement('section');
      section.id='agenda-dia-integrada-section';
      section.className='agenda-dia-integrada';
      section.style.display='none';
      main.appendChild(section);
    }

    const legacy=document.getElementById('dia-screen');
    if(legacy && !section.dataset.mounted){
      Array.from(legacy.children).forEach(child=>section.appendChild(child));
      section.dataset.mounted='1';
    }
    return section;
  }

  function mostrarAgendaIntegrada(){
    const section=ensureAgendaSection();
    if(!section) return;

    if(typeof cambiarPantalla==='function') cambiarPantalla('dashboard-screen');

    document.querySelectorAll('.main-panel > section').forEach(s=>{
      s.style.display=s.id==='agenda-dia-integrada-section'?'block':'none';
    });

    const titulo=document.getElementById('tituloPanel');
    const subtitulo=document.getElementById('subtituloPanel');
    if(titulo) titulo.textContent='Agenda';
    if(subtitulo) subtitulo.textContent='Planificación diaria de sesiones';

    document.querySelectorAll('.sidebar nav button').forEach(btn=>btn.classList.remove('nav-active'));
    document.getElementById('nav-resumen')?.classList.add('nav-active');

    scrollTopApp();
    requestAnimationFrame(scrollTopApp);
  }

  const abrirAnterior=window.abrirAgendaDia;
  if(typeof abrirAnterior==='function'){
    window.abrirAgendaDia=function(){
      ensureAgendaSection();
      const result=abrirAnterior.apply(this,arguments);
      mostrarAgendaIntegrada();
      return result;
    };
  }

  const mostrarSeccionAnterior=window.mostrarSeccion;
  if(typeof mostrarSeccionAnterior==='function'){
    window.mostrarSeccion=function(seccion){
      const agenda=document.getElementById('agenda-dia-integrada-section');
      if(agenda) agenda.style.display='none';
      const result=mostrarSeccionAnterior.apply(this,arguments);
      scrollTopApp();
      requestAnimationFrame(scrollTopApp);
      return result;
    };
  }

  const volverAnterior=window.volverDashboard;
  window.volverDashboard=function(){
    const agenda=document.getElementById('agenda-dia-integrada-section');
    if(agenda) agenda.style.display='none';
    if(typeof cambiarPantalla==='function') cambiarPantalla('dashboard-screen');
    if(typeof window.mostrarSeccion==='function') window.mostrarSeccion('resumen');
    else if(typeof volverAnterior==='function') volverAnterior.apply(this,arguments);
  };

  function clientePorId(id){
    try{return clientes.find(c=>Number(c.id)===Number(id));}catch(_){return null;}
  }

  function hoyISO(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function ponerBotonSesionCliente(id){
    const toolbar=document.querySelector('#cliente-detalle-section .cliente-detail-toolbar');
    if(!toolbar) return;
    let actions=toolbar.querySelector('.cliente-detail-actions');
    if(!actions){actions=document.createElement('div');actions.className='cliente-detail-actions';toolbar.appendChild(actions);}
    let btn=actions.querySelector('.cliente-session-btn');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='cliente-session-btn';btn.textContent='+ Añadir sesión';actions.appendChild(btn);}
    btn.onclick=()=>abrirSesionDesdeCliente(id);
  }

  function abrirSesionDesdeCliente(id){
    const cliente=clientePorId(id);
    if(!cliente) return;
    document.querySelector('.cliente-session-backdrop')?.remove();
    const activos=(typeof entrenadores!=='undefined'?entrenadores:[]).filter(e=>e.estado==='Activo');
    const opciones=activos.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('');
    const fondo=document.createElement('div');
    fondo.className='cliente-session-backdrop';
    fondo.innerHTML=`<div class="cliente-session-modal" role="dialog" aria-modal="true"><div class="cliente-session-head"><div><span class="section-kicker">AGENDA</span><h3>Nueva sesión</h3><p>${cliente.nombre}</p></div><button type="button" class="cliente-session-close">×</button></div><div class="cliente-session-body"><label class="cliente-session-field"><span>Fecha</span><input id="clienteSesionFecha" type="date" value="${hoyISO()}"></label><label class="cliente-session-field"><span>Hora</span><input id="clienteSesionHora" type="time" step="1800"></label><label class="cliente-session-field full"><span>Entrenador</span><select id="clienteSesionEntrenador">${opciones}</select></label></div><div class="cliente-session-foot"><button type="button" class="cliente-session-cancel">Cancelar</button><button type="button" class="cliente-session-save">Guardar sesión</button></div></div>`;
    document.body.appendChild(fondo);
    const cerrar=()=>fondo.remove();
    fondo.querySelector('.cliente-session-close').onclick=cerrar;
    fondo.querySelector('.cliente-session-cancel').onclick=cerrar;
    fondo.addEventListener('click',e=>{if(e.target===fondo) cerrar();});
    fondo.querySelector('.cliente-session-save').onclick=()=>{
      const fecha=fondo.querySelector('#clienteSesionFecha').value;
      const hora=fondo.querySelector('#clienteSesionHora').value;
      const entrenadorId=fondo.querySelector('#clienteSesionEntrenador').value;
      if(!fecha||!hora||!entrenadorId){alert('Selecciona fecha, hora y entrenador.');return;}
      fechaDiaSeleccionado=fecha;
      prepararFormularioAgendaDia();
      const clienteSelect=document.getElementById('diaClienteSelect');
      const horaInput=document.getElementById('diaClaseHora');
      const entrenadorSelect=document.getElementById('diaEntrenadorSelect');
      if(!clienteSelect||!horaInput||!entrenadorSelect){alert('No se ha podido preparar la agenda.');return;}
      clienteSelect.value=String(cliente.id);
      horaInput.value=hora;
      entrenadorSelect.value=String(entrenadorId);
      const antes=cliente.clases.length;
      agendarClaseDia();
      if(cliente.clases.length>antes){cerrar();if(typeof verFichaCliente==='function') verFichaCliente(cliente.id);}
    };
  }

  window.abrirSesionDesdeCliente=abrirSesionDesdeCliente;
  const verFichaAnterior=window.verFichaCliente;
  if(typeof verFichaAnterior==='function'){
    window.verFichaCliente=function(id){
      const result=verFichaAnterior.apply(this,arguments);
      requestAnimationFrame(()=>ponerBotonSesionCliente(id));
      setTimeout(()=>ponerBotonSesionCliente(id),30);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded',ensureAgendaSection);
  ensureAgendaSection();
})();