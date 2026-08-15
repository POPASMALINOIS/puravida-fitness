(() => {
  const VERSION = '2.4.10';

  function ensureDetailSection() {
    const main = document.querySelector('.main-panel');
    const ficha = document.getElementById('clienteFicha');
    if (!main || !ficha) return null;

    let section = document.getElementById('cliente-detail-section');
    if (!section) {
      section = document.createElement('section');
      section.id = 'cliente-detail-section';
      section.style.display = 'none';
      section.innerHTML = `
        <div class="client-detail-topbar">
          <div>
            <span class="section-kicker">CLIENTE</span>
            <h2 id="clientDetailTitle">Ficha completa</h2>
            <p>Datos, bono, pagos, mesociclos, mediciones y sesiones.</p>
          </div>
          <button class="client-detail-back" type="button" onclick="volverAClientesRage()">← Volver a clientes</button>
        </div>
        <div id="clienteDetailMount"></div>`;
      main.appendChild(section);
    }

    const mount = section.querySelector('#clienteDetailMount');
    if (mount && ficha.parentElement !== mount) mount.appendChild(ficha);
    return section;
  }

  function hideMainSections(exceptId) {
    document.querySelectorAll('.main-panel > section').forEach(section => {
      section.style.display = section.id === exceptId ? 'block' : 'none';
    });
  }

  function activateClientesNav() {
    document.querySelectorAll('.sidebar nav button').forEach(btn => btn.classList.remove('nav-active'));
    const nav = document.getElementById('nav-clientes');
    if (nav) nav.classList.add('nav-active');
  }

  function top() {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    const main = document.querySelector('.main-panel');
    if (main) main.scrollTop = 0;
  }

  window.volverAClientesRage = function () {
    if (typeof cambiarPantalla === 'function') cambiarPantalla('dashboard-screen');
    if (typeof mostrarSeccion === 'function') mostrarSeccion('clientes');
    top();
  };

  const verFichaAnterior = window.verFichaCliente;
  if (typeof verFichaAnterior === 'function') {
    window.verFichaCliente = function (id) {
      ensureDetailSection();
      const result = verFichaAnterior(id);

      // verFichaCliente original abre una pantalla independiente. Volvemos al dashboard
      // para conservar siempre la barra lateral/isla inferior y mostramos la ficha dentro de él.
      if (typeof cambiarPantalla === 'function') cambiarPantalla('dashboard-screen');
      const detail = ensureDetailSection();
      hideMainSections('cliente-detail-section');
      if (detail) detail.style.display = 'block';

      activateClientesNav();
      const titulo = document.getElementById('tituloPanel');
      const subtitulo = document.getElementById('subtituloPanel');
      if (titulo) titulo.textContent = 'Cliente';
      if (subtitulo) subtitulo.textContent = 'Ficha, planificación y evolución';

      const name = document.querySelector('#clienteFicha .ficha-card h2')?.textContent?.trim();
      const detailTitle = document.getElementById('clientDetailTitle');
      if (detailTitle) detailTitle.textContent = name || 'Ficha completa';

      top();
      requestAnimationFrame(top);
      return result;
    };
  }

  const mostrarAnterior = window.mostrarSeccion;
  if (typeof mostrarAnterior === 'function') {
    window.mostrarSeccion = function (seccion) {
      const detail = document.getElementById('cliente-detail-section');
      if (detail) detail.style.display = 'none';
      if (typeof cambiarPantalla === 'function') cambiarPantalla('dashboard-screen');
      return mostrarAnterior(seccion);
    };
  }

  document.addEventListener('DOMContentLoaded', ensureDetailSection);
  ensureDetailSection();
})();