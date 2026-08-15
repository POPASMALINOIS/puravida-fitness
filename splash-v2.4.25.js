(() => {
  function cargarModuloFacturas(){
    if(!document.querySelector('link[data-rage-facturas]')){
      const css=document.createElement('link');
      css.rel='stylesheet';css.href='facturas-v2.4.29.css?v=2.4.29';css.dataset.rageFacturas='1';document.head.appendChild(css);
    }
    if(!document.querySelector('script[data-rage-facturas]')){
      const js=document.createElement('script');
      js.src='facturas-v2.4.29.js?v=2.4.29';js.dataset.rageFacturas='1';document.body.appendChild(js);
    }
  }

  function montarPesa(){
    const loader=document.querySelector('.rage-splash-loader');
    if(!loader) return;
    loader.innerHTML=`
      <svg class="rage-dumbbell-svg" viewBox="0 0 120 48" role="img" aria-label="Cargando">
        <defs>
          <clipPath id="rageDumbbellClip">
            <rect x="4" y="15" width="10" height="18" rx="2"/>
            <rect x="14" y="10" width="12" height="28" rx="2"/>
            <rect x="26" y="19" width="68" height="10" rx="3"/>
            <rect x="94" y="10" width="12" height="28" rx="2"/>
            <rect x="106" y="15" width="10" height="18" rx="2"/>
          </clipPath>
        </defs>
        <g class="rage-dumbbell-base">
          <rect x="4" y="15" width="10" height="18" rx="2"/>
          <rect x="14" y="10" width="12" height="28" rx="2"/>
          <rect x="26" y="19" width="68" height="10" rx="3"/>
          <rect x="94" y="10" width="12" height="28" rx="2"/>
          <rect x="106" y="15" width="10" height="18" rx="2"/>
        </g>
        <rect class="rage-dumbbell-fill" x="0" y="0" width="120" height="48" fill="#F15A24" clip-path="url(#rageDumbbellClip)"/>
        <g class="rage-dumbbell-outline">
          <rect x="4" y="15" width="10" height="18" rx="2"/>
          <rect x="14" y="10" width="12" height="28" rx="2"/>
          <rect x="26" y="19" width="68" height="10" rx="3"/>
          <rect x="94" y="10" width="12" height="28" rx="2"/>
          <rect x="106" y="15" width="10" height="18" rx="2"/>
        </g>
      </svg>`;
  }

  function mostrarApp(){
    const splash=document.getElementById('rage-splash');
    const dashboard=document.getElementById('dashboard-screen');
    const login=document.getElementById('login-screen');

    cargarModuloFacturas();
    montarPesa();
    if(login) login.classList.remove('active');
    if(dashboard) dashboard.classList.add('active');

    if(typeof mostrarSeccion==='function'){
      try{ mostrarSeccion('resumen'); }catch(_){ }
    }

    if(splash){
      setTimeout(()=>{
        splash.classList.add('is-hidden');
        setTimeout(()=>splash.remove(),500);
      },5000);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mostrarApp,{once:true});
  }else{
    mostrarApp();
  }
})();
