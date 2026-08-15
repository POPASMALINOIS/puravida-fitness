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

  document.addEventListener('DOMContentLoaded',ensureAgendaSection);
  ensureAgendaSection();
})();