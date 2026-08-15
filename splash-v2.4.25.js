(() => {
  function mostrarApp(){
    const splash=document.getElementById('rage-splash');
    const dashboard=document.getElementById('dashboard-screen');
    const login=document.getElementById('login-screen');

    if(login) login.classList.remove('active');
    if(dashboard) dashboard.classList.add('active');

    if(typeof mostrarSeccion==='function'){
      try{ mostrarSeccion('resumen'); }catch(_){ }
    }

    if(splash){
      setTimeout(()=>{
        splash.classList.add('is-hidden');
        setTimeout(()=>splash.remove(),450);
      },900);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mostrarApp,{once:true});
  }else{
    mostrarApp();
  }
})();
