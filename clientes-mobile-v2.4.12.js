(() => {
  function addQuickButtons(){
    document.querySelectorAll('#clientesLista .cliente-row, #clientesBonosLista .cliente-row').forEach(row=>{
      const actions=row.querySelector('.acciones');
      const ver=actions?.querySelector('.ver-btn');
      if(!actions||!ver||actions.querySelector('.quick-measure-btn')) return;
      const onclick=ver.getAttribute('onclick')||'';
      const match=onclick.match(/verFichaCliente\((\d+)\)/);
      if(!match) return;
      const id=Number(match[1]);
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='quick-measure-btn';
      btn.textContent='Medición';
      btn.onclick=()=>{
        if(typeof window.verFichaCliente==='function') window.verFichaCliente(id);
        setTimeout(()=>{
          if(typeof window.cambiarTrackingTabRage==='function') window.cambiarTrackingTabRage('mediciones');
          const target=document.getElementById('trackMediciones');
          if(target) target.scrollIntoView({block:'start',behavior:'smooth'});
        },60);
      };
      actions.insertBefore(btn, actions.querySelector('.eliminar-btn'));
    });
  }

  const originalRenderClientes=window.renderClientes;
  if(typeof originalRenderClientes==='function'){
    window.renderClientes=function(){
      const r=originalRenderClientes.apply(this,arguments);
      addQuickButtons();
      return r;
    };
  }
  const originalRenderBonos=window.renderClientesBonos;
  if(typeof originalRenderBonos==='function'){
    window.renderClientesBonos=function(){
      const r=originalRenderBonos.apply(this,arguments);
      addQuickButtons();
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(addQuickButtons,0));
  setTimeout(addQuickButtons,100);
})();
