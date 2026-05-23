let clientes = [];
let clienteActual = null;
let fechaCalendario = new Date();
let fechaDiaSeleccionado = null;

let entrenadores = [];

const entrenadoresIniciales = [
  { id: 1, nombre: "Entrenador 1", color: "#2563eb", estado: "Activo" },
  { id: 2, nombre: "Entrenador 2", color: "#9333ea", estado: "Activo" },
  { id: 3, nombre: "Entrenador 3", color: "#16a34a", estado: "Activo" },
  { id: 4, nombre: "Entrenador 4", color: "#ea580c", estado: "Activo" }
];

document.addEventListener("DOMContentLoaded", function () {
  cargarDatos();
  procesarBonosAutomaticamente();
  verificarPagosPendientes();
  verificarEstadoBonos();
  actualizarResumen();
  renderCalendarioSemanal();
  renderClientes();
  renderEntrenadores();
  convertirInputsMayusculas();
});

function cargarDatos() {
  clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  entrenadores = JSON.parse(localStorage.getItem("entrenadores")) || entrenadoresIniciales;

  clientes.forEach(cliente => {
    cliente.bonoTotal = cliente.bonoTotal || cliente.bonoDisponible || 0;
    cliente.bonoDisponible = cliente.bonoDisponible ?? cliente.bonoTotal;
    cliente.bonoDuracion = cliente.bonoDuracion || "60";
    cliente.bonoModalidad = cliente.bonoModalidad || "Individual";
    cliente.clases = cliente.clases || [];
    cliente.rutinas = cliente.rutinas || [];
    cliente.controles = cliente.controles || [];
    cliente.pagos = cliente.pagos || [];
  });

  guardarDatos();
}

function guardarDatos() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
  localStorage.setItem("entrenadores", JSON.stringify(entrenadores));
}

function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  if (usuario && password) {
    cambiarPantalla("dashboard-screen");
    mostrarSeccion("resumen");
  } else {
    alert("Introduce usuario y contraseña.");
  }
}

function logout() {
  cambiarPantalla("login-screen");
}

function cambiarPantalla(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const pantalla = document.getElementById(id);
  if (pantalla) pantalla.classList.add("active");
}

function mostrarSeccion(seccion) {
  const resumenSection = document.getElementById("resumen-section");
  const clientesSection = document.getElementById("clientes-section");
  const bonosSection = document.getElementById("clientes-bonos-section");
  const entrenadoresSection = document.getElementById("entrenadores-section");
  const pagosSection = document.getElementById("pagos-section");

  if (resumenSection) resumenSection.style.display = seccion === "resumen" ? "block" : "none";
  if (clientesSection) clientesSection.style.display = seccion === "clientes" ? "block" : "none";
  if (bonosSection) bonosSection.style.display = seccion === "clientes-bonos" ? "block" : "none";
  if (entrenadoresSection) entrenadoresSection.style.display = seccion === "entrenadores" ? "block" : "none";
  if (pagosSection) pagosSection.style.display = seccion === "pagos" ? "block" : "none";

  document.querySelectorAll(".sidebar nav button").forEach(btn =>
    btn.classList.remove("nav-active")
  );

  if (seccion === "resumen") {
    document.getElementById("nav-resumen").classList.add("nav-active");
    document.getElementById("tituloPanel").textContent = "Resumen";
    document.getElementById("subtituloPanel").textContent = "KPIs, agenda y seguimiento general";

    actualizarResumen();
    renderCalendarioSemanal();
  }

  else if (seccion === "clientes") {
    document.getElementById("nav-clientes").classList.add("nav-active");
    document.getElementById("tituloPanel").textContent = "Clientes";
    document.getElementById("subtituloPanel").textContent = "Base de datos completa de clientes";

    renderClientes();
  }

  else if (seccion === "clientes-bonos") {
    document.getElementById("nav-bonos").classList.add("nav-active");
    document.getElementById("tituloPanel").textContent = "Bonos críticos";
    document.getElementById("subtituloPanel").textContent = "Clientes con bonos bajos o agotados";

    verificarEstadoBonos();
    renderClientesBonos();
  }

  else if (seccion === "entrenadores") {
    document.getElementById("nav-entrenadores").classList.add("nav-active");
    document.getElementById("tituloPanel").textContent = "Entrenadores";
    document.getElementById("subtituloPanel").textContent = "Colores, agenda y asignación";

    renderEntrenadores();
  }

  else if (seccion === "pagos") {
    document.getElementById("tituloPanel").textContent = "Pagos";
    document.getElementById("subtituloPanel").textContent = "Control financiero y seguimiento de cobros";

    renderPagos();
  }

  else {
    alert("Módulo " + seccion + " en desarrollo.");
    mostrarSeccion("resumen");
  }
}

function volverDashboard() {
  cambiarPantalla("dashboard-screen");
  mostrarSeccion("resumen");
}

function agregarCliente() {
  const nombre = document.getElementById("clienteNombre").value.trim();
  const telefono = document.getElementById("clienteTelefono").value.trim();
  const email = document.getElementById("clienteEmail").value.trim();
  const fechaAlta = document.getElementById("clienteFechaAlta").value;
  const cuota = document.getElementById("clienteCuota").value;
  const bonoTotal = parseInt(document.getElementById("clienteBonoTotal").value);
  const bonoDuracion = document.getElementById("clienteBonoDuracion").value;
  const bonoModalidad = document.getElementById("clienteBonoModalidad").value;
  const estado = document.getElementById("clienteEstado").value;
  const observaciones = document.getElementById("clienteObservaciones").value.trim();

  if (!nombre || !telefono) {
    alert("Completa al menos nombre y teléfono.");
    return;
  }

  clientes.push({
    id: Date.now(),
    nombre,
    telefono,
    email,
    fechaAlta,
    cuota,
    bonoTotal,
    bonoDisponible: bonoTotal,
    bonoDuracion,
    bonoModalidad,
    estado,
    observaciones,
    rutinas: [],
    clases: [],
    controles: [],
    pagos: [],
    pagoPendiente: false,
    bonoEstado: "Activo"
  });

  guardarDatos();
  limpiarFormularioCliente();
  volverDashboard();
}

function limpiarFormularioCliente() {
  document.getElementById("clienteNombre").value = "";
  document.getElementById("clienteTelefono").value = "";
  document.getElementById("clienteEmail").value = "";
  document.getElementById("clienteFechaAlta").value = "";
  document.getElementById("clienteCuota").value = "";
  document.getElementById("clienteBonoTotal").value = "5";
  document.getElementById("clienteBonoDuracion").value = "30";
  document.getElementById("clienteBonoModalidad").value = "Individual";
  document.getElementById("clienteEstado").value = "Activo";
  document.getElementById("clienteObservaciones").value = "";
}

function eliminarCliente(id) {
  if (!confirm("¿Eliminar este cliente?")) return;

  clientes = clientes.filter(cliente => cliente.id !== id);
  guardarDatos();
  volverDashboard();
}

function agregarEntrenador() {
  const nombre = document.getElementById("entrenadorNombre").value.trim();
  const color = document.getElementById("entrenadorColor").value;

  if (!nombre) {
    alert("Introduce el nombre del entrenador.");
    return;
  }

  entrenadores.push({
    id: Date.now(),
    nombre,
    color,
    estado: "Activo"
  });

  document.getElementById("entrenadorNombre").value = "";
  document.getElementById("entrenadorColor").value = "#F15A24";

  guardarDatos();
  renderEntrenadores();
  renderCalendarioSemanal();
}

function eliminarEntrenador(id) {
  if (!confirm("¿Eliminar este entrenador? Las sesiones ya creadas conservarán su color y nombre.")) return;

  entrenadores = entrenadores.filter(entrenador => entrenador.id !== id);
  guardarDatos();
  renderEntrenadores();
}

function contarClasesEntrenador(id) {
  let total = 0;

  clientes.forEach(cliente => {
    total += cliente.clases.filter(clase => parseInt(clase.entrenadorId) === parseInt(id)).length;
  });

  return total;
}

function renderEntrenadores() {
  const lista = document.getElementById("entrenadoresLista");

  if (!lista) return;

  lista.innerHTML = "";

  if (entrenadores.length === 0) {
    lista.innerHTML = `<div class="entrenador-row">No hay entrenadores registrados.</div>`;
    return;
  }

  entrenadores.forEach(entrenador => {
    const div = document.createElement("div");
    div.className = "entrenador-row";

    div.innerHTML = `
      <div>
        <strong>${entrenador.nombre}</strong>
        <span class="cliente-sub">Color fijo</span>
      </div>

      <div>
        <span class="color-dot" style="background:${entrenador.color};"></span>
      </div>

      <div>
        <span class="estado-activo">${entrenador.estado}</span>
      </div>

      <div>
        ${contarClasesEntrenador(entrenador.id)}
      </div>

      <div class="acciones">
        <button class="eliminar-btn" onclick="eliminarEntrenador(${entrenador.id})">Borrar</button>
      </div>
    `;

    lista.appendChild(div);
  });
}

function actualizarResumen() {
  verificarPagosPendientes();
  verificarEstadoBonos();

  document.getElementById("totalClientes").textContent = clientes.length;

  document.getElementById("clientesActivos").textContent =
    clientes.filter(c => c.estado === "Activo").length;

  document.getElementById("bonosBajos").textContent =
    clientes.filter(c => c.bonoEstado === "Bajo" || c.bonoEstado === "Agotado").length;

  document.getElementById("clasesHoy").textContent =
    clientes.reduce((total, cliente) => {
      return total + cliente.clases.filter(clase =>
        clase.fecha === obtenerFechaISO(new Date())
      ).length;
    }, 0);
}

function verificarPagosPendientes() {
  const hoy = new Date();
  const diaActual = hoy.getDate();

  clientes.forEach(cliente => {
    if (!cliente.pagos) cliente.pagos = [];

    const pagoMesActual = cliente.pagos.find(p => {
      const fechaPago = new Date(p.fecha);
      return (
        fechaPago.getMonth() === hoy.getMonth() &&
        fechaPago.getFullYear() === hoy.getFullYear()
      );
    });

    cliente.pagoPendiente = !pagoMesActual && diaActual > 5;
  });

  guardarDatos();
}

function verificarEstadoBonos() {
  clientes.forEach(cliente => {
    if (cliente.bonoDisponible <= 0) {
      cliente.bonoEstado = "Agotado";
    } else if (cliente.bonoDisponible <= 2) {
      cliente.bonoEstado = "Bajo";
    } else {
      cliente.bonoEstado = "Activo";
    }
  });

  guardarDatos();
}

function obtenerFechaISO(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatearFechaES(fechaISO) {
  const [year, month, day] = fechaISO.split("-");
  return `${day}/${month}/${year}`;
}

function obtenerLunesSemana(fecha) {
  const nuevaFecha = new Date(fecha);
  const dia = nuevaFecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;
  nuevaFecha.setDate(nuevaFecha.getDate() + diferencia);
  nuevaFecha.setHours(0, 0, 0, 0);
  return nuevaFecha;
}

function cambiarMes(direccion) {
  fechaCalendario.setDate(fechaCalendario.getDate() + direccion * 7);
  renderCalendarioSemanal();
}

function irMesActual() {
  fechaCalendario = new Date();
  renderCalendarioSemanal();
}

function obtenerEntrenador(id) {
  return entrenadores.find(e => parseInt(e.id) === parseInt(id)) || entrenadores[0] || {
    id: 0,
    nombre: "Sin entrenador",
    color: "#64748b"
  };
}

function obtenerClasesPorFecha(fechaISO) {
  let clases = [];

  clientes.forEach(cliente => {
    cliente.clases.forEach(clase => {
      if (clase.fecha === fechaISO) {
        const entrenador = obtenerEntrenador(clase.entrenadorId);

        clases.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          telefono: cliente.telefono,
          bonoDisponible: cliente.bonoDisponible,
          bonoTotal: cliente.bonoTotal,
          bonoDuracion: cliente.bonoDuracion,
          bonoModalidad: cliente.bonoModalidad,
          entrenadorNombre: clase.entrenadorNombre || entrenador.nombre,
          entrenadorColor: clase.entrenadorColor || entrenador.color,
          ...clase
        });
      }
    });
  });

  clases.sort((a, b) => a.hora.localeCompare(b.hora));

  return clases;
}

function renderCalendarioSemanal() {
  const calendario = document.getElementById("calendarioMensual");
  const tituloMes = document.getElementById("tituloMes");

  if (!calendario || !tituloMes) return;

  calendario.innerHTML = "";
  calendario.className = "calendar-grid semana-grid";

  const lunes = obtenerLunesSemana(fechaCalendario);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  tituloMes.textContent =
    `${formatearFechaES(obtenerFechaISO(lunes))} - ${formatearFechaES(obtenerFechaISO(domingo))}`;

  const slotHeight = 42;
  const horaInicio = 6;
  const horaFin = 24;
  const totalSlots = (horaFin - horaInicio) * 2;
  const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const contenedor = document.createElement("div");
  contenedor.className = "week-calendar-fixed";

  let headerHtml = `<div class="week-header-fixed"><div></div>`;

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const fechaISO = obtenerFechaISO(fecha);

    headerHtml += `
      <div class="week-day-header-fixed" onclick="abrirAgendaDia('${fechaISO}')">
        <span>${nombresDias[i]}</span>
        <strong>${fecha.getDate()}</strong>
      </div>
    `;
  }

  headerHtml += `</div>`;

  let bodyHtml = `<div class="week-body-fixed">`;

  bodyHtml += `<div class="week-hours-fixed">`;

  for (let slot = 0; slot < totalSlots; slot++) {
    const hora = horaInicio + Math.floor(slot / 2);
    const minutos = slot % 2 === 0 ? "00" : "30";
    const tramo = `${String(hora).padStart(2, "0")}:${minutos}`;

    bodyHtml += `
      <div class="week-hour-fixed" style="height:${slotHeight}px;">
        ${tramo}
      </div>
    `;
  }

  bodyHtml += `</div>`;

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);

    const fechaISO = obtenerFechaISO(fecha);
    const clasesDia = obtenerClasesPorFecha(fechaISO);

    const eventos = clasesDia
      .filter(clase => clase.hora)
      .map(clase => {
        const [hora, minutos] = clase.hora.split(":").map(Number);
        const inicio = ((hora - horaInicio) * 60) + minutos;
        const duracion = parseInt(clase.duracion || clase.bonoDuracion || "60");
        const fin = inicio + duracion;

        return {
          ...clase,
          inicio,
          fin,
          duracion,
          columna: 0,
          totalColumnas: 1
        };
      })
      .filter(evento => evento.inicio >= 0 && evento.inicio < (horaFin - horaInicio) * 60)
      .sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);

    const grupos = [];

    eventos.forEach(evento => {
      let grupoEncontrado = null;

      for (const grupo of grupos) {
        const solapaConGrupo = grupo.some(e =>
          evento.inicio < e.fin && evento.fin > e.inicio
        );

        if (solapaConGrupo) {
          grupoEncontrado = grupo;
          break;
        }
      }

      if (grupoEncontrado) {
        grupoEncontrado.push(evento);
      } else {
        grupos.push([evento]);
      }
    });

    grupos.forEach(grupo => {
      const columnas = [];

      grupo.forEach(evento => {
        let colocado = false;

        for (let c = 0; c < columnas.length; c++) {
          const puedeIr = columnas[c].every(e =>
            evento.inicio >= e.fin || evento.fin <= e.inicio
          );

          if (puedeIr) {
            columnas[c].push(evento);
            evento.columna = c;
            colocado = true;
            break;
          }
        }

        if (!colocado) {
          columnas.push([evento]);
          evento.columna = columnas.length - 1;
        }
      });

      grupo.forEach(evento => {
        evento.totalColumnas = columnas.length;
      });
    });

    bodyHtml += `
      <div 
        class="week-day-column-fixed" 
        style="height:${totalSlots * slotHeight}px;"
      >
    `;

    for (let slot = 0; slot < totalSlots; slot++) {
      const hora = horaInicio + Math.floor(slot / 2);
      const minutos = slot % 2 === 0 ? "00" : "30";
      const tramo = `${String(hora).padStart(2, "0")}:${minutos}`;
      const top = slot * slotHeight;

      bodyHtml += `
        <div 
          class="week-slot-fixed"
          style="
            top:${top}px;
            height:${slotHeight}px;
          "
          onclick="abrirAgendaDia('${fechaISO}', '${tramo}')"
        ></div>
      `;
    }

    eventos.forEach(clase => {
      const top = (clase.inicio / 30) * slotHeight;
      const height = ((clase.duracion / 30) * slotHeight) - 6;

      const ancho = 100 / clase.totalColumnas;
      const left = clase.columna * ancho;

      bodyHtml += `
        <div 
          class="week-event-fixed"
          style="
            top:${top + 3}px;
            height:${height}px;
            left:calc(${left}% + 3px);
            width:calc(${ancho}% - 6px);
            right:auto;
            background:${clase.entrenadorColor};
          "
          onclick="event.stopPropagation(); abrirAgendaDia('${fechaISO}', '${clase.hora}')"
          ondblclick="event.stopPropagation(); verFichaCliente(${clase.clienteId})"
        >
          <span class="evento-nombre">${clase.clienteNombre}</span>
        </div>
      `;
    });

    bodyHtml += `</div>`;
  }

  bodyHtml += `</div>`;

  contenedor.innerHTML = headerHtml + bodyHtml;
  calendario.appendChild(contenedor);
}

function abrirAgendaDia(fechaISO, horaPreseleccionada = "") {
  fechaDiaSeleccionado = fechaISO;

  document.getElementById("tituloDia").textContent = `Agenda ${formatearFechaES(fechaISO)}`;
  document.getElementById("subtituloDia").textContent = horaPreseleccionada
    ? `Nueva sesión a las ${horaPreseleccionada}`
    : "Planificación diaria de sesiones";

  prepararFormularioAgendaDia();

  const horaInput = document.getElementById("diaClaseHora");
  if (horaInput && horaPreseleccionada) {
    horaInput.value = horaPreseleccionada;
  }

  renderAgendaDia();

  cambiarPantalla("dia-screen");
}

function prepararFormularioAgendaDia() {
  actualizarSelectorDiaClientes();
  crearSelectorEntrenadoresAgenda();
}

function actualizarSelectorDiaClientes() {
  const select = document.getElementById("diaClienteSelect");

  if (!select) return;

  select.innerHTML = "";

  if (clientes.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No hay clientes";
    select.appendChild(option);
    return;
  }

  clientes.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente.id;
    option.textContent = `${cliente.nombre} · Bono ${cliente.bonoDisponible}/${cliente.bonoTotal}`;
    select.appendChild(option);
  });
}

function crearSelectorEntrenadoresAgenda() {
  let select = document.getElementById("diaEntrenadorSelect");
  const horaInput = document.getElementById("diaClaseHora");

  if (!horaInput) return;

  if (!select) {
    select = document.createElement("select");
    select.id = "diaEntrenadorSelect";
    horaInput.insertAdjacentElement("afterend", select);
  }

  select.innerHTML = "";

  entrenadores
    .filter(entrenador => entrenador.estado === "Activo")
    .forEach(entrenador => {
      const option = document.createElement("option");
      option.value = entrenador.id;
      option.textContent = entrenador.nombre;
      select.appendChild(option);
    });
}

function agendarClaseDia() {
  const clienteId = parseInt(document.getElementById("diaClienteSelect").value);
  const hora = document.getElementById("diaClaseHora").value;
  const entrenadorId = parseInt(document.getElementById("diaEntrenadorSelect").value);
  const entrenador = obtenerEntrenador(entrenadorId);

  if (!fechaDiaSeleccionado || !clienteId || !hora || !entrenadorId) {
    alert("Selecciona cliente, hora y entrenador.");
    return;
  }

  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) {
    alert("Cliente no encontrado.");
    return;
  }

  const duracionNueva = parseInt(cliente.bonoDuracion || "60");
  const inicioNueva = convertirHoraAMinutos(hora);
  const finNueva = inicioNueva + duracionNueva;

  let haySolapeMismoEntrenador = false;
  let claseSolapada = null;

  clientes.forEach(c => {
    c.clases.forEach(clase => {
      if (clase.fecha !== fechaDiaSeleccionado) return;
      if (clase.estado === "Cancelada" || clase.estado === "Cancelada excepcional") return;

      const mismoEntrenador = parseInt(clase.entrenadorId) === entrenadorId;
      if (!mismoEntrenador) return;

      const duracionExistente = parseInt(clase.duracion || c.bonoDuracion || "60");
      const inicioExistente = convertirHoraAMinutos(clase.hora);
      const finExistente = inicioExistente + duracionExistente;

      if (inicioNueva < finExistente && finNueva > inicioExistente) {
        haySolapeMismoEntrenador = true;
        claseSolapada = {
          cliente: c.nombre,
          hora: clase.hora,
          duracion: duracionExistente,
          entrenador: clase.entrenadorNombre || entrenador.nombre
        };
      }
    });
  });

  if (haySolapeMismoEntrenador) {
    alert(
      "No se puede reservar. Ese entrenador ya tiene una sesión en esa franja:\n\n" +
      claseSolapada.cliente + " · " +
      claseSolapada.hora + " · " +
      claseSolapada.duracion + " min · " +
      claseSolapada.entrenador
    );
    return;
  }

  cliente.clases.push({
    id: Date.now(),
    fecha: fechaDiaSeleccionado,
    hora,
    estado: "Programada",
    duracion: cliente.bonoDuracion,
    modalidad: cliente.bonoModalidad,
    entrenadorId: entrenador.id,
    entrenadorNombre: entrenador.nombre,
    entrenadorColor: entrenador.color,
    consumida: false
  });

  guardarDatos();

  procesarBonosAutomaticamente();
  verificarEstadoBonos();

  document.getElementById("diaClaseHora").value = "";

  actualizarResumen();
  renderAgendaDia();
  renderCalendarioSemanal();
  renderClientes();
}

function eliminarClase(clienteId, claseId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  if (!confirm("¿Eliminar esta sesión?")) return;

  cliente.clases = cliente.clases.filter(clase => clase.id !== claseId);

  guardarDatos();
  actualizarResumen();
  renderAgendaDia();
  renderCalendarioSemanal();

  if (clienteActual && clienteActual.id === clienteId) {
    verFichaCliente(clienteId);
  }
}

function cancelarClase(clienteId, claseId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  const clase = cliente.clases.find(c => c.id === claseId);

  if (!clase) return;

  const ahora = new Date();
  const fechaClase = new Date(`${clase.fecha}T${clase.hora}:00`);
  const diferenciaHoras = (fechaClase - ahora) / (1000 * 60 * 60);

  if (diferenciaHoras <= 12) {
    alert("No se puede cancelar con menos de 12 horas.");
    return;
  }

  clase.estado = "Cancelada";

  guardarDatos();
  actualizarResumen();
  renderAgendaDia();
  renderCalendarioSemanal();

  if (clienteActual && clienteActual.id === clienteId) {
    verFichaCliente(clienteId);
  }
}

function cancelarClaseExcepcional(clienteId, claseId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  const clase = cliente.clases.find(c => c.id === claseId);

  if (!clase) return;

  if (!confirm("¿Cancelar excepcionalmente esta sesión y devolver la sesión al bono?")) return;

  if (clase.consumida && cliente.bonoDisponible < cliente.bonoTotal) {
    cliente.bonoDisponible += 1;
  }

  clase.estado = "Cancelada excepcional";
  clase.consumida = false;

  guardarDatos();
  verificarEstadoBonos();
  actualizarResumen();
  renderAgendaDia();
  renderCalendarioSemanal();
  renderClientes();

  if (clienteActual && clienteActual.id === clienteId) {
    verFichaCliente(clienteId);
  }
}

function renderAgendaDia() {
  const lista = document.getElementById("agendaDiaLista");

  if (!lista) return;

  const clases = obtenerClasesPorFecha(fechaDiaSeleccionado);

  lista.innerHTML = "";

  if (clases.length === 0) {
    lista.innerHTML = "<p>No hay sesiones programadas para este día.</p>";
    return;
  }

  clases.forEach(clase => {
    const div = document.createElement("div");
    div.className = "agenda-item";
    div.style.borderLeft = `6px solid ${clase.entrenadorColor}`;

    div.innerHTML = `
      <div class="agenda-hora">${clase.hora}</div>

      <div class="agenda-cliente">
        <strong>${clase.clienteNombre}</strong>
        <span>${clase.duracion || clase.bonoDuracion} min · ${clase.modalidad || clase.bonoModalidad}</span>
        <span>Entrenador: ${clase.entrenadorNombre}</span>
        <span>Estado: ${clase.estado}</span>
        <span>Bono: ${clase.bonoDisponible}/${clase.bonoTotal}</span>
      </div>

      <div class="acciones">
        <button class="ver-btn" onclick="cancelarClase(${clase.clienteId}, ${clase.id})">Cancelar</button>
        <button class="ficha-btn" onclick="cancelarClaseExcepcional(${clase.clienteId}, ${clase.id})">Excepcional</button>
        <button class="eliminar-btn" onclick="eliminarClase(${clase.clienteId}, ${clase.id})">Borrar</button>
      </div>
    `;

    lista.appendChild(div);
  });
}

function renderClientes() {
  const lista = document.getElementById("clientesLista");
  const buscadorInput = document.getElementById("buscadorClientes");
  const buscador = buscadorInput ? buscadorInput.value.toLowerCase() : "";

  if (!lista) return;

  lista.innerHTML = "";

  verificarEstadoBonos();

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(buscador) ||
    cliente.telefono.includes(buscador)
  );

  if (clientesFiltrados.length === 0) {
    lista.innerHTML = `<div class="cliente-row">No hay clientes encontrados.</div>`;
    return;
  }

  clientesFiltrados.forEach(cliente => {
    lista.appendChild(crearFilaCliente(cliente, true));
  });
}

function renderClientesBonos() {
  const lista = document.getElementById("clientesBonosLista");

  if (!lista) return;

  lista.innerHTML = "";

  verificarEstadoBonos();

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.bonoEstado === "Bajo" || cliente.bonoEstado === "Agotado"
  );

  if (clientesFiltrados.length === 0) {
    lista.innerHTML = `<div class="cliente-row">No hay clientes con bonos bajos o agotados.</div>`;
    return;
  }

  clientesFiltrados.forEach(cliente => {
    lista.appendChild(crearFilaCliente(cliente, false));
  });
}

function crearFilaCliente(cliente, permitirBorrar) {
  const estadoClass = cliente.estado === "Activo" ? "estado-activo" : "estado-inactivo";

  let bonoAviso = "";

  if (cliente.bonoEstado === "Agotado") {
    bonoAviso = " · Bono agotado";
  } else if (cliente.bonoEstado === "Bajo") {
    bonoAviso = " · Bono bajo";
  }

  const div = document.createElement("div");
  div.className = "cliente-row";

  div.innerHTML = `
    <div>
      <strong>${cliente.nombre}</strong>
      <span class="cliente-sub">${cliente.bonoDuracion || "-"} min · ${cliente.bonoModalidad || "-"}</span>
    </div>

    <div>${cliente.telefono}</div>

    <div><strong>${cliente.bonoDisponible}/${cliente.bonoTotal}</strong></div>

    <div>
      <span class="${estadoClass}">
        ${cliente.estado}${bonoAviso}
      </span>
    </div>

    <div class="acciones">
      <button class="ver-btn" onclick="verFichaCliente(${cliente.id})">Ver</button>
      ${permitirBorrar ? `<button class="eliminar-btn" onclick="eliminarCliente(${cliente.id})">Borrar</button>` : ""}
    </div>
  `;

  return div;
}

function filtrarClientesBonos() {
  mostrarSeccion("clientes-bonos");
}

function mostrarSesionesHoy() {
  const hoy = obtenerFechaISO(new Date());
  abrirAgendaDia(hoy);
}

function verFichaCliente(id) {
  clienteActual = clientes.find(cliente => cliente.id === id);

  if (!clienteActual) return;

  const ficha = document.getElementById("clienteFicha");

  const pagosOrdenados = [...(clienteActual.pagos || [])].sort((a, b) =>
    `${b.fecha}`.localeCompare(`${a.fecha}`)
  );

  const ultimoPago = pagosOrdenados.length > 0 ? pagosOrdenados[0] : null;

  let pagosHtml = "";

  if (pagosOrdenados.length === 0) {
    pagosHtml = "<p>No hay pagos registrados.</p>";
  } else {
    pagosHtml = pagosOrdenados.map(pago => `
      <div class="agenda-item">
        <div class="agenda-hora">${formatearFechaES(pago.fecha)}</div>
        <div class="agenda-cliente">
          <strong>${pago.concepto || "Pago"}</strong>
          <span>Importe: ${pago.importe || 0} €</span>
        </div>
      </div>
    `).join("");
  }

  const clasesOrdenadas = [...clienteActual.clases].sort((a, b) =>
    `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
  );

  let clasesHtml = "";

  if (clasesOrdenadas.length === 0) {
    clasesHtml = "<p>No hay sesiones programadas.</p>";
  } else {
    clasesOrdenadas.forEach(clase => {
      const entrenador = obtenerEntrenador(clase.entrenadorId);

      clasesHtml += `
        <div class="agenda-item" style="border-left: 6px solid ${clase.entrenadorColor || entrenador.color}">
          <div class="agenda-hora">${clase.hora}</div>

          <div class="agenda-cliente">
            <strong>${formatearFechaES(clase.fecha)}</strong>
            <span>${clase.duracion || clienteActual.bonoDuracion} min · ${clase.modalidad || clienteActual.bonoModalidad}</span>
            <span>Entrenador: ${clase.entrenadorNombre || entrenador.nombre}</span>
            <span>Estado: ${clase.estado}</span>
          </div>

          <div class="acciones">
            <button class="ver-btn" onclick="cancelarClase(${clienteActual.id}, ${clase.id})">Cancelar</button>
            <button class="ficha-btn" onclick="cancelarClaseExcepcional(${clienteActual.id}, ${clase.id})">Excepcional</button>
            <button class="eliminar-btn" onclick="eliminarClase(${clienteActual.id}, ${clase.id})">Borrar</button>
          </div>
        </div>
      `;
    });
  }

  ficha.innerHTML = `
    <div class="ficha-card">
      <h2>${clienteActual.nombre}</h2>
      <p>📞 ${clienteActual.telefono}</p>
      <p>📧 ${clienteActual.email || "Sin email"}</p>
      <p>📅 Alta: ${clienteActual.fechaAlta || "No indicada"}</p>
      <p>📌 Estado: ${clienteActual.estado}</p>
    </div>

    <div class="ficha-card">
      <h2>Bono</h2>
      <p>🎟️ ${clienteActual.bonoDisponible}/${clienteActual.bonoTotal} sesiones</p>
      <p><strong>Estado bono:</strong> ${
        clienteActual.bonoEstado === "Agotado"
          ? '<span style="color:#f87171;">Agotado</span>'
          : clienteActual.bonoEstado === "Bajo"
          ? '<span style="color:#facc15;">Bono bajo</span>'
          : '<span style="color:#F15A24;">Activo</span>'
      }</p>
      <p>⏱️ ${clienteActual.bonoDuracion} min</p>
      <p>👥 ${clienteActual.bonoModalidad}</p>
      <p>💳 Cuota: ${clienteActual.cuota || "0"} €</p>
    </div>

    <div class="ficha-card">
      <h2>Pagos</h2>
      <p><strong>Estado:</strong> ${
        clienteActual.pagoPendiente
          ? '<span style="color:#f87171;">Pago pendiente</span>'
          : '<span style="color:#F15A24;">Al corriente</span>'
      }</p>

      <p><strong>Último pago:</strong> ${
        ultimoPago
          ? `${formatearFechaES(ultimoPago.fecha)} · ${ultimoPago.importe} €`
          : "Sin pagos registrados"
      }</p>

      <button class="ficha-btn" onclick="registrarPagoCliente(${clienteActual.id})">
        Registrar pago
      </button>

      <div class="historial-pagos">
        ${pagosHtml}
      </div>
    </div>

    <div class="ficha-card">
      <h2>Observaciones</h2>
      <p>${clienteActual.observaciones || "Sin observaciones"}</p>
    </div>

    <div class="ficha-card">
      <h2>Sesiones programadas</h2>
      ${clasesHtml}
    </div>

    <div class="ficha-card">
      <h2>Recordatorios</h2>
      <button class="ficha-btn" onclick="enviarRecordatorioClase()">Recordatorio sesión</button>
      <button class="ficha-btn" onclick="enviarRecordatorioPago()">Recordatorio pago</button>
    </div>
  `;

  cambiarPantalla("ficha-screen");
}

function registrarPagoCliente(clienteId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  if (!cliente.pagos) cliente.pagos = [];

  const importe = prompt("Introduce el importe pagado:", cliente.cuota || "0");

  if (importe === null) return;

  const concepto = prompt("Concepto del pago:", "Cuota / bono mensual");

  if (concepto === null) return;

  cliente.pagos.push({
    id: Date.now(),
    fecha: obtenerFechaISO(new Date()),
    importe: importe,
    concepto: concepto
  });

  cliente.pagoPendiente = false;

  guardarDatos();
  actualizarResumen();
  verFichaCliente(clienteId);
}

function procesarBonosAutomaticamente() {
  const ahora = new Date();

  clientes.forEach(cliente => {
    cliente.clases.forEach(clase => {
      if (clase.estado !== "Programada" || clase.consumida) return;

      const fechaClase = new Date(`${clase.fecha}T${clase.hora}:00`);
      const diferenciaHoras = (fechaClase - ahora) / (1000 * 60 * 60);

      if (diferenciaHoras <= 12) {
        if (cliente.bonoDisponible > 0) {
          cliente.bonoDisponible -= 1;
        }

        clase.estado = "Consumida";
        clase.consumida = true;
      }
    });
  });

  guardarDatos();
}

function enviarRecordatorioClase() {
  if (!clienteActual.email) {
    alert("Cliente sin email registrado.");
    return;
  }

  window.location.href = `mailto:${clienteActual.email}?subject=Recordatorio de sesión&body=Hola ${clienteActual.nombre}, te recordamos tu próxima sesión en Rage Training.`;
}

function enviarRecordatorioPago() {
  if (!clienteActual.email) {
    alert("Cliente sin email registrado.");
    return;
  }

  window.location.href = `mailto:${clienteActual.email}?subject=Recordatorio de pago&body=Hola ${clienteActual.nombre}, te recordamos tu próximo pago o renovación de bono en Rage Training.`;
}

function convertirHoraAMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function convertirInputsMayusculas() {
  document.querySelectorAll(
    "#alta-screen input[type='text'], #alta-screen input[type='email'], #alta-screen textarea"
  ).forEach(input => {
    input.addEventListener("input", function () {
      const inicio = this.selectionStart;
      const fin = this.selectionEnd;

      this.value = this.value.toUpperCase();

      this.setSelectionRange(inicio, fin);
    });
  });
}

function renderPagos() {
  let pagosSection = document.getElementById("pagos-section");
  const mainPanel = document.querySelector(".main-panel");

  if (!pagosSection) {
    pagosSection = document.createElement("section");
    pagosSection.id = "pagos-section";
    mainPanel.appendChild(pagosSection);
  } else if (pagosSection.parentElement !== mainPanel) {
    mainPanel.appendChild(pagosSection);
  }

  pagosSection.style.display = "block";

  const datosClientes = Array.isArray(clientes) && clientes.length
    ? clientes
    : JSON.parse(localStorage.getItem("clientes")) || [];

  pagosSection.innerHTML = `
    <section class="toolbar">
      <input type="text" id="buscadorPagos" placeholder="Buscar cliente...">
    </section>

    <section class="tabla-clientes">
      <div class="tabla-header">
        <span>Cliente</span>
        <span>Estado</span>
        <span>Último pago</span>
        <span>Importe</span>
        <span>Acciones</span>
      </div>

      <div id="pagosLista"></div>
    </section>
  `;

  const lista = document.getElementById("pagosLista");

  if (!datosClientes.length) {
    lista.innerHTML = `<div class="cliente-row">No hay clientes registrados.</div>`;
    return;
  }

  datosClientes.forEach(cliente => {
    const ultimoPago = cliente.pagos && cliente.pagos.length
      ? [...cliente.pagos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
      : null;

    const div = document.createElement("div");
    div.className = "cliente-row";

    div.innerHTML = `
      <div><strong>${cliente.nombre}</strong></div>
      <div>${cliente.pagoPendiente ? "Pendiente" : "Al corriente"}</div>
      <div>${ultimoPago ? formatearFechaES(ultimoPago.fecha) : "-"}</div>
      <div>${ultimoPago ? ultimoPago.importe + " €" : (cliente.cuota || "0") + " €"}</div>
      <div class="acciones">
        <button class="ver-btn" onclick="verFichaCliente(${cliente.id})">Ver</button>
        <button class="ficha-btn" onclick="registrarPagoCliente(${cliente.id})">Registrar</button>
      </div>
    `;

    lista.appendChild(div);
  });
}

function asegurarSeccionPagos() {
  let pagosSection = document.getElementById("pagos-section");

  if (!pagosSection) {
    const mainPanel = document.querySelector(".main-panel");

    pagosSection = document.createElement("section");
    pagosSection.id = "pagos-section";
    pagosSection.style.display = "none";

    mainPanel.appendChild(pagosSection);
  }

  return pagosSection;
}
