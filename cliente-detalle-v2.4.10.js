(() => {
  function scrollTopApp() {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    const main = document.querySelector('.main-panel');
    if (main) main.scrollTop = 0;
  }

  function ensureDetalleSection() {
    const main = document.querySelector('.main-panel');
    if (!main) return null;

    let section = document.getElementById('cliente-detalle-section');
    if (!section) {
      section = document.createElement('section');
      section.id = 'cliente-detalle-section';
      section.style.display = 'none';
      section.innerHTML = `
        <div class="cliente-detail-toolbar">
          <button class="cliente-detail-back" type="button" onclick="volverAClientesRage()">← Clientes</button>
          <div class="cliente-detail-copy">
            <span class="section-kicker">FICHA DE CLIENTE</span>
            <strong id="clienteDetalleNombre">Cliente</strong>
          </div>
        </div>
        <div id="clienteDetalleMount"></div>`;
      main.appendChild(section);
    }
    return section;
  }

  function mostrarSoloDetalle(id) {
    const section = ensureDetalleSection();
    if (!section) return;

    document.querySelectorAll('.main-panel > section').forEach(s => {
      s.style.display = s.id === 'cliente-detalle-section' ? 'block' : 'none';
    });

    const ficha = document.getElementById('clienteFicha');
    const mount = document.getElementById('clienteDetalleMount');
    if (ficha && mount && ficha.parentElement !== mount) mount.appendChild(ficha);

    const cliente = (window.clientes || (typeof clientes !== 'undefined' ? clientes : [])).find(c => Number(c.id) === Number(id));
    const nombre = document.getElementById('clienteDetalleNombre');
    if (nombre) nombre.textContent = cliente?.nombre || 'Cliente';

    const titulo = document.getElementById('tituloPanel');
    const subtitulo = document.getElementById('subtituloPanel');
    if (titulo) titulo.textContent = cliente?.nombre || 'Cliente';
    if (subtitulo) subtitulo.textContent = 'Ficha, mesociclos, mediciones, pagos y sesiones';

    document.querySelectorAll('.sidebar nav button').forEach(btn => btn.classList.remove('nav-active'));
    document.getElementById('nav-clientes')?.classList.add('nav-active');

    if (typeof cambiarPantalla === 'function') cambiarPantalla('dashboard-screen');
    scrollTopApp();
    requestAnimationFrame(scrollTopApp);
  }

  const verFichaAnterior = window.verFichaCliente;
  window.verFichaCliente = function(id) {
    const result = verFichaAnterior(id);
    mostrarSoloDetalle(id);
    return result;
  };

  const mostrarSeccionAnterior = window.mostrarSeccion;
  window.mostrarSeccion = function(seccion) {
    const detalle = document.getElementById('cliente-detalle-section');
    if (detalle) detalle.style.display = 'none';
    const result = mostrarSeccionAnterior(seccion);
    scrollTopApp();
    requestAnimationFrame(scrollTopApp);
    return result;
  };

  window.volverAClientesRage = function() {
    if (typeof cambiarPantalla === 'function') cambiarPantalla('dashboard-screen');
    window.mostrarSeccion('clientes');
  };

  document.addEventListener('DOMContentLoaded', ensureDetalleSection);
  ensureDetalleSection();
})();