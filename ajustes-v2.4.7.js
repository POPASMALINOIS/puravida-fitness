(() => {
  const KEY = 'rageTrainingAjustes';
  const DEFAULTS = {
    centroNombre: 'Rage Training',
    bonoCritico: 2,
    diaPagoPendiente: 5,
    vistaCompacta: false,
    reducirAnimaciones: false
  };

  function cargarAjustes() {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function guardarAjustesData(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    aplicarPreferencias(data);
  }

  function aplicarPreferencias(data = cargarAjustes()) {
    document.documentElement.classList.toggle('rage-compact', !!data.vistaCompacta);
    document.documentElement.classList.toggle('rage-reduce-motion', !!data.reducirAnimaciones);
  }

  function scrollArriba() {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const main = document.querySelector('.main-panel');
    if (main) main.scrollTop = 0;
  }

  function crearSeccion() {
    if (document.getElementById('ajustes-section')) return;
    const main = document.querySelector('.main-panel');
    if (!main) return;

    const section = document.createElement('section');
    section.id = 'ajustes-section';
    section.style.display = 'none';
    section.innerHTML = `
      <div class="section-heading ajustes-heading">
        <div>
          <span class="section-kicker">CONFIGURACIÓN</span>
          <h2>Ajustes</h2>
          <p>Preferencias operativas, experiencia y seguridad de los datos.</p>
        </div>
        <span class="settings-version">v2.4.7</span>
      </div>

      <div class="settings-grid">
        <section class="settings-card">
          <div class="settings-card-head"><span class="settings-icon">R</span><div><h3>Centro</h3><p>Identidad básica de la aplicación.</p></div></div>
          <label class="settings-field"><span>Nombre del centro</span><input id="ajCentroNombre" type="text" autocomplete="organization"></label>
        </section>

        <section class="settings-card">
          <div class="settings-card-head"><span class="settings-icon">⚡</span><div><h3>Reglas automáticas</h3><p>Cuándo debe avisarte la aplicación.</p></div></div>
          <div class="settings-two-cols">
            <label class="settings-field"><span>Bono crítico desde</span><div class="settings-number"><input id="ajBonoCritico" type="number" min="0" max="20"><small>sesiones</small></div></label>
            <label class="settings-field"><span>Pago pendiente desde el día</span><div class="settings-number"><input id="ajDiaPago" type="number" min="1" max="28"><small>del mes</small></div></label>
          </div>
          <p class="settings-help">Estos valores afectan directamente a Bonos críticos y al estado de cobros.</p>
        </section>

        <section class="settings-card">
          <div class="settings-card-head"><span class="settings-icon">◫</span><div><h3>Experiencia</h3><p>Adapta la densidad visual a tu forma de trabajar.</p></div></div>
          <label class="settings-switch-row"><div><strong>Vista compacta</strong><span>Muestra más información ocupando menos altura.</span></div><input id="ajCompacta" type="checkbox"><i></i></label>
          <label class="settings-switch-row"><div><strong>Reducir animaciones</strong><span>Minimiza transiciones y efectos visuales.</span></div><input id="ajReducirAnim" type="checkbox"><i></i></label>
        </section>

        <section class="settings-card settings-card-data">
          <div class="settings-card-head"><span class="settings-icon">⇅</span><div><h3>Datos y copias</h3><p>Protege la información guardada en este dispositivo.</p></div></div>
          <div class="settings-actions">
            <button class="settings-btn" onclick="exportarCopiaRage()">Exportar copia</button>
            <button class="settings-btn" onclick="document.getElementById('ajImportFile').click()">Importar copia</button>
            <input id="ajImportFile" type="file" accept="application/json,.json" hidden>
          </div>
          <div class="settings-danger">
            <div><strong>Borrar todos los datos</strong><span>Elimina clientes, entrenadores y ajustes almacenados en este dispositivo.</span></div>
            <button onclick="borrarDatosRage()">Borrar datos</button>
          </div>
        </section>
      </div>

      <div class="settings-savebar">
        <div><strong>Preferencias locales</strong><span>Los cambios se guardan en este dispositivo.</span></div>
        <button onclick="guardarAjustesRage()">Guardar cambios</button>
      </div>`;
    main.appendChild(section);

    document.getElementById('ajImportFile')?.addEventListener('change', importarCopiaRage);
  }

  function rellenarFormulario() {
    const a = cargarAjustes();
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
    set('ajCentroNombre', a.centroNombre);
    set('ajBonoCritico', a.bonoCritico);
    set('ajDiaPago', a.diaPagoPendiente);
    const compacta = document.getElementById('ajCompacta');
    const anim = document.getElementById('ajReducirAnim');
    if (compacta) compacta.checked = !!a.vistaCompacta;
    if (anim) anim.checked = !!a.reducirAnimaciones;
  }

  window.guardarAjustesRage = function () {
    const bono = Math.max(0, Math.min(20, parseInt(document.getElementById('ajBonoCritico')?.value || '2', 10)));
    const dia = Math.max(1, Math.min(28, parseInt(document.getElementById('ajDiaPago')?.value || '5', 10)));
    const data = {
      centroNombre: (document.getElementById('ajCentroNombre')?.value || 'Rage Training').trim() || 'Rage Training',
      bonoCritico: bono,
      diaPagoPendiente: dia,
      vistaCompacta: !!document.getElementById('ajCompacta')?.checked,
      reducirAnimaciones: !!document.getElementById('ajReducirAnim')?.checked
    };
    guardarAjustesData(data);
    if (typeof verificarEstadoBonos === 'function') verificarEstadoBonos();
    if (typeof verificarPagosPendientes === 'function') verificarPagosPendientes();
    if (typeof actualizarResumen === 'function') actualizarResumen();
    const btn = document.querySelector('.settings-savebar button');
    if (btn) {
      const old = btn.textContent;
      btn.textContent = 'Guardado ✓';
      setTimeout(() => btn.textContent = old, 1200);
    }
  };

  window.exportarCopiaRage = function () {
    const backup = {
      app: 'Rage Training',
      version: '2.4.7',
      fecha: new Date().toISOString(),
      clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
      entrenadores: JSON.parse(localStorage.getItem('entrenadores') || '[]'),
      ajustes: cargarAjustes()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rage-training-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  window.importarCopiaRage = async function (event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.clientes) || !Array.isArray(data.entrenadores)) throw new Error('Formato no válido');
      if (!confirm('La importación sustituirá los datos actuales de clientes y entrenadores. ¿Continuar?')) return;
      localStorage.setItem('clientes', JSON.stringify(data.clientes));
      localStorage.setItem('entrenadores', JSON.stringify(data.entrenadores));
      if (data.ajustes) localStorage.setItem(KEY, JSON.stringify({ ...DEFAULTS, ...data.ajustes }));
      location.reload();
    } catch (_) {
      alert('No se ha podido importar la copia. Comprueba que el archivo pertenece a Rage Training.');
    } finally {
      event.target.value = '';
    }
  };

  window.borrarDatosRage = function () {
    const texto = prompt('Esta acción no se puede deshacer. Escribe BORRAR para eliminar todos los datos locales.');
    if (texto !== 'BORRAR') return;
    localStorage.removeItem('clientes');
    localStorage.removeItem('entrenadores');
    localStorage.removeItem(KEY);
    location.reload();
  };

  // Conecta los ajustes con las reglas reales de negocio de la app.
  if (typeof verificarEstadoBonos === 'function') {
    verificarEstadoBonos = function () {
      const limite = cargarAjustes().bonoCritico;
      clientes.forEach(cliente => {
        if (cliente.bonoDisponible <= 0) cliente.bonoEstado = 'Agotado';
        else if (cliente.bonoDisponible <= limite) cliente.bonoEstado = 'Bajo';
        else cliente.bonoEstado = 'Activo';
      });
      guardarDatos();
    };
  }

  if (typeof verificarPagosPendientes === 'function') {
    verificarPagosPendientes = function () {
      const hoy = new Date();
      const limite = cargarAjustes().diaPagoPendiente;
      clientes.forEach(cliente => {
        if (!cliente.pagos) cliente.pagos = [];
        const pagoMesActual = cliente.pagos.find(p => {
          const fechaPago = new Date(p.fecha);
          return fechaPago.getMonth() === hoy.getMonth() && fechaPago.getFullYear() === hoy.getFullYear();
        });
        cliente.pagoPendiente = !pagoMesActual && hoy.getDate() > limite;
      });
      guardarDatos();
    };
  }

  // Enrutador: intercepta únicamente Ajustes y deja intactos los demás módulos.
  const mostrarOriginal = window.mostrarSeccion;
  window.mostrarSeccion = function (seccion) {
    if (seccion !== 'ajustes') return mostrarOriginal(seccion);

    crearSeccion();
    ['resumen-section','clientes-section','clientes-bonos-section','entrenadores-section','pagos-section'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const ajustes = document.getElementById('ajustes-section');
    if (ajustes) ajustes.style.display = 'block';

    document.querySelectorAll('.sidebar nav button').forEach(btn => btn.classList.remove('nav-active'));
    const nav = [...document.querySelectorAll('.sidebar nav button')].find(btn => (btn.getAttribute('onclick') || '').includes("'ajustes'"));
    if (nav) nav.classList.add('nav-active');

    const titulo = document.getElementById('tituloPanel');
    const subtitulo = document.getElementById('subtituloPanel');
    if (titulo) titulo.textContent = 'Ajustes';
    if (subtitulo) subtitulo.textContent = 'Preferencias, automatizaciones y copias de seguridad';
    rellenarFormulario();
    scrollArriba();
    requestAnimationFrame(scrollArriba);
  };

  aplicarPreferencias();
  document.addEventListener('DOMContentLoaded', () => {
    crearSeccion();
    aplicarPreferencias();
  });
})();