(() => {
  function configurarEmail() {
    ['clienteEmail','pareja2Email'].forEach(id => {
      const email = document.getElementById(id);
      if (!email) return;
      email.type = 'text';
      email.setAttribute('inputmode', 'email');
      email.setAttribute('autocomplete', 'email');
      email.setAttribute('autocapitalize', 'none');
      email.setAttribute('spellcheck', 'false');
      email.style.textTransform = 'none';
    });
  }

  document.addEventListener('input', event => {
    if (event.target && (event.target.id === 'clienteEmail' || event.target.id === 'pareja2Email')) event.stopImmediatePropagation();
  }, true);

  window.convertirInputsMayusculas = function () {
    document.querySelectorAll("#alta-screen input[type='text']:not(#clienteEmail):not(#pareja2Email), #alta-cliente-integrada-section input[type='text']:not(#clienteEmail):not(#pareja2Email), #alta-screen textarea, #alta-cliente-integrada-section textarea").forEach(input => {
      if (input.dataset.rageUppercaseBound === '1') return;
      input.dataset.rageUppercaseBound = '1';
      input.addEventListener('input', function () {
        const inicio = this.selectionStart, fin = this.selectionEnd;
        this.value = this.value.toUpperCase();
        if (typeof inicio === 'number' && typeof fin === 'number') { try { this.setSelectionRange(inicio, fin); } catch (_) {} }
      });
    });
    configurarEmail();
  };

  configurarEmail();
  const observer = new MutationObserver(configurarEmail);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  function listaClientes(){try{return Array.isArray(clientes)?clientes:[]}catch(_){return[]}}
  function ejecutarSeguro(fn){try{if(typeof fn==='function')fn()}catch(error){console.error(error)}}
  function refrescarTrasEliminar(clienteId){ejecutarSeguro(()=>guardarDatos());ejecutarSeguro(()=>verificarEstadoBonos());ejecutarSeguro(()=>actualizarResumen());ejecutarSeguro(()=>renderAgendaDia());ejecutarSeguro(()=>renderCalendarioSemanal());ejecutarSeguro(()=>renderClientes());requestAnimationFrame(()=>{ejecutarSeguro(()=>renderAgendaDia());ejecutarSeguro(()=>renderCalendarioSemanal())});setTimeout(()=>{ejecutarSeguro(()=>renderAgendaDia());ejecutarSeguro(()=>renderCalendarioSemanal())},40);try{if(clienteActual&&Number(clienteActual.id)===Number(clienteId)&&typeof verFichaCliente==='function')verFichaCliente(clienteId)}catch(_){}}
  function localizarSesion(clienteId,claseId){const cliente=listaClientes().find(c=>Number(c.id)===Number(clienteId));if(!cliente||!Array.isArray(cliente.clases))return null;const indice=cliente.clases.findIndex(c=>Number(c.id)===Number(claseId));return indice<0?null:{cliente,clase:cliente.clases[indice],indice}}
  function horasHastaSesion(clase){if(!clase?.fecha||!clase?.hora)return NaN;const fecha=new Date(`${clase.fecha}T${clase.hora}:00`);return Number.isNaN(fecha.getTime())?NaN:(fecha.getTime()-Date.now())/3600000}

  function eliminarSesion(clienteId,claseId,modo){const encontrada=localizarSesion(clienteId,claseId);if(!encontrada){refrescarTrasEliminar(clienteId);return}const{cliente,clase,indice}=encontrada;if(modo==='cancelar'){const horas=horasHastaSesion(clase);const penaliza=!Number.isFinite(horas)||horas<=12;const mensaje=penaliza?'¿Cancelar esta sesión? Quedan 12 horas o menos para el inicio, por lo que la sesión se descontará del bono y se eliminará de la agenda.':'¿Cancelar esta sesión? Quedan más de 12 horas para el inicio, por lo que NO se descontará ninguna sesión del bono.';if(!confirm(mensaje))return;if(penaliza){if(!clase.consumida&&Number(cliente.bonoDisponible)>0)cliente.bonoDisponible=Number(cliente.bonoDisponible)-1}else if(clase.consumida&&Number(cliente.bonoDisponible)<Number(cliente.bonoTotal)){cliente.bonoDisponible=Number(cliente.bonoDisponible)+1}}else{if(!confirm('¿Cancelar excepcionalmente esta sesión? Se devolverá al bono si estaba contabilizada y se eliminará de la agenda.'))return;if(clase.consumida&&Number(cliente.bonoDisponible)<Number(cliente.bonoTotal))cliente.bonoDisponible=Number(cliente.bonoDisponible)+1}cliente.clases.splice(indice,1);refrescarTrasEliminar(clienteId)}

  const obtenerClasesOriginal=window.obtenerClasesPorFecha;if(typeof obtenerClasesOriginal==='function')window.obtenerClasesPorFecha=function(fechaISO){return obtenerClasesOriginal(fechaISO).filter(clase=>clase.estado!=='Cancelada'&&clase.estado!=='Cancelada excepcional')};
  window.cancelarClase=(clienteId,claseId)=>eliminarSesion(clienteId,claseId,'cancelar');
  window.cancelarClaseExcepcional=(clienteId,claseId)=>eliminarSesion(clienteId,claseId,'excepcional');

  document.addEventListener('click',event=>{const boton=event.target.closest('button[onclick*="cancelarClaseExcepcional("], button[onclick*="cancelarClase("]');if(!boton)return;const codigo=boton.getAttribute('onclick')||'',excepcional=codigo.includes('cancelarClaseExcepcional('),coincidencia=codigo.match(/cancelarClase(?:Excepcional)?\s*\(\s*([^,]+)\s*,\s*([^\)]+)\s*\)/);if(!coincidencia)return;const clienteId=Number(String(coincidencia[1]).replace(/[^0-9.-]/g,'')),claseId=Number(String(coincidencia[2]).replace(/[^0-9.-]/g,''));if(!Number.isFinite(clienteId)||!Number.isFinite(claseId))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();eliminarSesion(clienteId,claseId,excepcional?'excepcional':'cancelar')},true);

  function limpiarCancelacionesAntiguas(){let cambio=false;listaClientes().forEach(cliente=>{if(!Array.isArray(cliente.clases))return;const antes=cliente.clases.length;cliente.clases=cliente.clases.filter(clase=>clase.estado!=='Cancelada'&&clase.estado!=='Cancelada excepcional');if(cliente.clases.length!==antes)cambio=true});if(cambio){ejecutarSeguro(()=>guardarDatos());ejecutarSeguro(()=>renderCalendarioSemanal())}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{window.convertirInputsMayusculas();limpiarCancelacionesAntiguas()},{once:true});else{window.convertirInputsMayusculas();limpiarCancelacionesAntiguas()}
})();

(() => {
  function loadOperativaV246(){if(!document.querySelector('link[data-rage-operativa-v246]')){const link=document.createElement('link');link.rel='stylesheet';link.href='operativa-v2.4.46.css?v=2.4.46';link.dataset.rageOperativaV246='1';document.head.appendChild(link)}if(!document.querySelector('script[data-rage-operativa-v246]')){const script=document.createElement('script');script.src='operativa-v2.4.46.js?v=2.4.46';script.dataset.rageOperativaV246='1';script.async=false;document.head.appendChild(script)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadOperativaV246,{once:true});else loadOperativaV246();
})();