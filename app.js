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
  actualizarResumen();
  renderCalendarioSemanal();
  renderClientes();
  renderEntrenadores();
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
    mostrarSeccion("clientes");
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

  document.getElementById(id).classList.add("active");
}

function mostrarSeccion(seccion) {
  document.getElementById("clientes-section").style.display = seccion === "clientes" ? "block" : "none";
  document.getElementById("entrenadores-section").style.display = seccion === "entrenadores" ? "block" : "none";

  document.querySelectorAll(".sidebar nav button").forEach(btn => btn.classList.remove("nav-active"));

  if (seccion === "clientes") {
    document.getElementById("nav-clientes").classList.add("nav-active");
    document.getElementById("tituloPanel").textContent = "Clientes";
    document.getElementById("subtituloPanel").textContent = "Planificación, bonos y seguimiento";
    actualizarResumen();
    renderCalendarioSemanal();
    renderClientes();
  }

  if (seccion === "entrenadores") {
    document.getElementById("nav-entrenadores").classList.add("nav-active");
    document.getElementById("tituloPanel").textContent = "Entrenadores";
    document.getElementById("subtituloPanel").textContent = "Colores, agenda y asignación de clases";
    renderEntrenadores();
  }
}

function volverDashboard() {
  cambiarPantalla("dashboard-screen");
  mostrarSeccion("clientes");
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
    pagos: []
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
  document.getElementById("entrenadorColor").value = "#2563eb";

  guardarDatos();
  renderEntrenadores();
  renderCalendarioSemanal();
}

function eliminarEntrenador(id) {
  if (!confirm("¿Eliminar este entrenador? Las clases ya creadas conservarán su color y nombre.")) return;

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
        <span class="cliente-nombre">${entrenador.nombre}</span>
        <span class="cliente-sub">Color fijo</span>
      </div>

      <div>
        <span class="color-dot" style="background:${entrenador.color}"></span>
      </div>

      <div><span class="estado-activo">${entrenador.estado}</span></div>

      <div>${contarClasesEntrenador(entrenador.id)}</div>

      <div class="acciones">
        <button class="eliminar-btn" onclick="eliminarEntrenador(${entrenador.id})">Borrar</button>
      </div>
    `;

    lista.appendChild(div);
  });
}

function actualizarResumen() {
  document.getElementById("totalClientes").textContent = clientes.length;
  document.getElementById("clientesActivos").textContent = clientes.filter(c => c.estado === "Activo").length;
  document.getElementById("bonosBajos").textContent = clientes.filter(c => c.bonoDisponible <= 2).length;

  const hoy = obtenerFechaISO(new Date());
  let clasesHoy = 0;

  clientes.forEach(cliente => {
    clasesHoy += cliente.clases.filter(clase => clase.fecha === hoy).length;
  });

  document.getElementById("clasesHoy").textContent = clasesHoy;
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

  tituloMes.textContent = `${formatearFechaES(obtenerFechaISO(lunes))} - ${formatearFechaES(obtenerFechaISO(domingo))}`;

  const horas = [];

  for (let h = 6; h <= 23; h++) {
    horas.push(String(h).padStart(2, "0") + ":00");
  }

  const contenedor = document.createElement("div");
  contenedor.className = "week-calendar";

  const cabecera = document.createElement("div");
  cabecera.className = "week-header";
  cabecera.innerHTML = `<div class="week-hour-label"></div>`;

  const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const fechaISO = obtenerFechaISO(fecha);

    cabecera.innerHTML += `
      <div class="week-day-header" onclick="abrirAgendaDia('${fechaISO}')">
        <span>${nombresDias[i]}</span>
        <strong>${fecha.getDate()}</strong>
      </div>
    `;
  }

  contenedor.appendChild(cabecera);

  horas.forEach(hora => {
    const fila = document.createElement("div");
    fila.className = "week-row";
    fila.innerHTML = `<div class="week-hour">${hora}</div>`;

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const fechaISO = obtenerFechaISO(fecha);

      const clasesHora = obtenerClasesPorFecha(fechaISO).filter(clase =>
        clase.hora && clase.hora.startsWith(hora.substring(0, 2))
      );

      let eventosHtml = "";

      clasesHora.forEach(clase => {
        eventosHtml += `
          <div class="week-event" style="background:${clase.entrenadorColor}" onclick="event.stopPropagation(); verFichaCliente(${clase.clienteId})">
            <strong>${clase.hora}</strong>
            <span>${clase.clienteNombre}</span>
            <small>${clase.entrenadorNombre}</small>
          </div>
        `;
      });

      fila.innerHTML += `
        <div class="week-cell" onclick="abrirAgendaDia('${fechaISO}', '${hora}')">
          ${eventosHtml}
        </div>
      `;
    }

    contenedor.appendChild(fila);
  });

  calendario.appendChild(contenedor);
}

function abrirAgendaDia(fechaISO, horaPreseleccionada = "") {
  fechaDiaSeleccionado = fechaISO;

  document.getElementById("tituloDia").textContent = `Agenda ${formatearFechaES(fechaISO)}`;
  document.getElementById("subtituloDia").textContent = horaPreseleccionada
    ? `Nueva clase a las ${horaPreseleccionada}`
    : "Planificación diaria de clases";

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

  document.getElementById("diaClaseHora").value = "";

  actualizarResumen();
  renderAgendaDia();
}

function eliminarClase(clienteId, claseId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  if (!confirm("¿Eliminar esta clase?")) return;

  cliente.clases = cliente.clases.filter(clase => clase.id !== claseId);

  guardarDatos();
  actualizarResumen();
  renderAgendaDia();

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
    lista.innerHTML = "<p>No hay clases programadas para este día.</p>";
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

function verFichaCliente(id) {
  clienteActual = clientes.find(cliente => cliente.id === id);

  if (!clienteActual) return;

  const ficha = document.getElementById("clienteFicha");

  let clasesHtml = "";

  const clasesOrdenadas = [...clienteActual.clases].sort((a, b) =>
    `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
  );

  if (clasesOrdenadas.length === 0) {
    clasesHtml = "<p>No hay clases programadas.</p>";
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
          <button class="eliminar-btn" onclick="eliminarClase(${clienteActual.id}, ${clase.id})">Borrar</button>
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
      <p>💳 Cuota: ${clienteActual.cuota || "0"} €</p>
      <p>🎟️ Bono: ${clienteActual.bonoDisponible}/${clienteActual.bonoTotal}</p>
      <p>⏱️ Duración: ${clienteActual.bonoDuracion} min</p>
      <p>👥 Modalidad: ${clienteActual.bonoModalidad}</p>
      <p>📌 Estado: ${clienteActual.estado}</p>
      <p>📝 ${clienteActual.observaciones || "Sin observaciones"}</p>
    </div>

    <div class="ficha-card">
      <h2>Clases programadas</h2>
      ${clasesHtml}
    </div>

    <div class="ficha-card">
      <h2>Rutinas</h2>
      <p>${clienteActual.rutinas.length} registradas</p>
    </div>

    <div class="ficha-card">
      <h2>Controles físicos</h2>
      <p>${clienteActual.controles.length} registros</p>
    </div>

    <div class="ficha-card">
      <h2>Pagos</h2>
      <p>${clienteActual.pagos.length} registros</p>
    </div>

    <div class="ficha-card">
      <h2>Recordatorios</h2>
      <button class="ficha-btn" onclick="enviarRecordatorioClase()">Recordatorio clase</button>
      <button class="ficha-btn" onclick="enviarRecordatorioPago()">Recordatorio pago</button>
    </div>
  `;

  cambiarPantalla("ficha-screen");
}

function enviarRecordatorioClase() {
  if (!clienteActual.email) {
    alert("Cliente sin email registrado.");
    return;
  }

  window.location.href = `mailto:${clienteActual.email}?subject=Recordatorio de clase&body=Hola ${clienteActual.nombre}, te recordamos tu próxima clase en PuraVida Fitness.`;
}

function enviarRecordatorioPago() {
  if (!clienteActual.email) {
    alert("Cliente sin email registrado.");
    return;
  }

  window.location.href = `mailto:${clienteActual.email}?subject=Recordatorio de pago&body=Hola ${clienteActual.nombre}, te recordamos tu próximo pago o renovación de bono en PuraVida Fitness.`;
}

function renderClientes() {
  const lista = document.getElementById("clientesLista");
  const buscadorInput = document.getElementById("buscadorClientes");
  const buscador = buscadorInput ? buscadorInput.value.toLowerCase() : "";

  if (!lista) return;

  lista.innerHTML = "";

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(buscador) ||
    cliente.telefono.includes(buscador)
  );

  if (clientesFiltrados.length === 0) {
    lista.innerHTML = `<div class="cliente-row">No hay clientes encontrados.</div>`;
    return;
  }

  clientesFiltrados.forEach(cliente => {
    const estadoClass = cliente.estado === "Activo" ? "estado-activo" : "estado-inactivo";

    const div = document.createElement("div");
    div.className = "cliente-row";

    div.innerHTML = `
      <div>
        <span class="cliente-nombre">${cliente.nombre}</span>
        <span class="cliente-sub">${cliente.bonoDuracion || "-"} min · ${cliente.bonoModalidad || "-"}</span>
      </div>

      <div>${cliente.telefono}</div>

      <div>${cliente.bonoDisponible}/${cliente.bonoTotal}</div>

      <div><span class="${estadoClass}">${cliente.estado}</span></div>

      <div class="acciones">
        <button class="ver-btn" onclick="verFichaCliente(${cliente.id})">Ver</button>
        <button class="eliminar-btn" onclick="eliminarCliente(${cliente.id})">Borrar</button>
      </div>
    `;

    lista.appendChild(div);
  });
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
  renderAgendaDia();

  if (clienteActual && clienteActual.id === clienteId) {
    verFichaCliente(clienteId);
  }
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
  renderAgendaDia();

  if (clienteActual && clienteActual.id === clienteId) {
    verFichaCliente(clienteId);
  }
}
function cancelarClaseExcepcional(clienteId, claseId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  const clase = cliente.clases.find(c => c.id === claseId);

  if (!clase) return;

  if (!confirm("¿Cancelar excepcionalmente esta clase y devolver la sesión al bono?")) return;

  if (clase.consumida && cliente.bonoDisponible < cliente.bonoTotal) {
    cliente.bonoDisponible += 1;
  }

  clase.estado = "Cancelada excepcional";
  clase.consumida = false;

  guardarDatos();
  actualizarResumen();
  renderAgendaDia();

  if (clienteActual && clienteActual.id === clienteId) {
    verFichaCliente(clienteId);
  }
}
