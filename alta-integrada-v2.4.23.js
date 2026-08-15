(() => {
  function scrollTopApp(){
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    window.scrollTo(0,0);
    const main=document.querySelector('.main-panel');
    if(main) main.scrollTop=0;
  }

  function ensureAltaSection(){
    const main=document.querySelector('.main-panel');
    if(!main) return null;

    let section=document.getElementById('alta-cliente-integrada-section');
    if(!section){
      section=document.createElement('section');
      section.id='alta-cliente-integrada-section';
      section.className='alta-cliente-integrada';
      section.style.display='none';
      main.appendChild(section);
    }

    const legacy=document.getElementById('alta-screen');
    if(legacy && !section.dataset.mounted){
      Array.from(legacy.children).forEach(child=>section.appendChild(child));
      section.dataset.mounted='1';
    }
    return section;
  }

  function mostrarAltaIntegrada(){
    const section=ensureAltaSection();
    if(!section) return;

    if(typeof cambiarPantalla==='function') cambiarPantalla('dashboard-screen');

    document.querySelectorAll('.main-panel > section').forEach(s=>{
      s.style.display=s.id==='alta-cliente-integrada-section'?'block':'none';
    });

    const titulo=document.getElementById('tituloPanel');
    const subtitulo=document.getElementById('subtituloPanel');
    if(titulo) titulo.textContent='Nuevo cliente';
    if(subtitulo) subtitulo.textContent='Alta y configuración inicial';

    document.querySelectorAll('.sidebar nav button').forEach(btn=>btn.classList.remove('nav-active'));
    document.getElementById('nav-clientes')?.classList.add('nav-active');

    scrollTopApp();
    requestAnimationFrame(scrollTopApp);
  }

  const cambiarAnterior=window.cambiarPantalla;
  if(typeof cambiarAnterior==='function'){
    window.cambiarPantalla=function(pantalla){
      if(pantalla==='alta-screen'){
        ensureAltaSection();
        mostrarAltaIntegrada();
        return;
      }
      const alta=document.getElementById('alta-cliente-integrada-section');
      if(alta) alta.style.display='none';
      return cambiarAnterior.apply(this,arguments);
    };
  }

  const mostrarSeccionAnterior=window.mostrarSeccion;
  if(typeof mostrarSeccionAnterior==='function'){
    window.mostrarSeccion=function(seccion){
      const alta=document.getElementById('alta-cliente-integrada-section');
      if(alta) alta.style.display='none';
      const result=mostrarSeccionAnterior.apply(this,arguments);
      scrollTopApp();
      requestAnimationFrame(scrollTopApp);
      return result;
    };
  }

  const volverAnterior=window.volverDashboard;
  window.volverDashboard=function(){
    const alta=document.getElementById('alta-cliente-integrada-section');
    if(alta && alta.style.display!=='none'){
      alta.style.display='none';
      if(typeof cambiarAnterior==='function') cambiarAnterior('dashboard-screen');
      if(typeof window.mostrarSeccion==='function') window.mostrarSeccion('clientes');
      return;
    }
    if(typeof volverAnterior==='function') return volverAnterior.apply(this,arguments);
  };

  document.addEventListener('DOMContentLoaded',ensureAltaSection);
  ensureAltaSection();
})();