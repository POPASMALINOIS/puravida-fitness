let clientes = [];
let clienteActual = null;
let fechaCalendario = new Date();
let fechaDiaSeleccionado = null;

document.addEventListener("DOMContentLoaded", function () {
  cargarClientes();
  actualizarResumen();
  renderCalendarioMensual();
  renderClientes();
});

function cargarClientes() {
  clientes = JSON.parse(localStorage.getItem("clientes")) || [];
}

function guardarClientes() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  if (usuario && password) {
    cambiarPantalla("dashboard-screen");
    actualizarResumen();
    renderCalendarioMensual();
    renderClientes();
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

function volverDashboard() {
  cambiarPantalla("dashboard-screen");
  actualizarResumen();
  renderCalendarioMensual();
  renderClientes();
}

function mostrarSeccion(seccion) {
  if (seccion !== "clientes") {
    alert("Módulo " + seccion + " en desarrollo.");
  }
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

  guardarClientes();
  limpiarFormulario();
  volverDashboard();
}

function limpiarFormulario() {
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
  guardarClientes();
  volverDashboard();
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

function cambiarMes(direccion) {
  fechaCalendario.setMonth(fechaCalendario.getMonth() + direccion);
  renderCalendarioMensual();
}

function irMesActual() {
  fechaCalendario = new Date();
  renderCalendarioMensual();
}

function obtenerClasesPorFecha(fechaISO) {
  let clases = [];

  clientes.forEach(cliente => {
    cliente.clases.forEach(clase => {
      if (clase.fecha === fechaISO) {
        clases.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          telefono: cliente.telefono,
          bonoDisponible: cliente.bonoDisponible,
          bonoTotal: cliente.bonoTotal,
          bonoDuracion: cliente.bonoDuracion,
          bonoModalidad: cliente.bonoModalidad,
          ...clase
        });
      }
    });
  });

  clases.sort((a, b) => a.hora.localeCompare(b.hora));

  return clases;
}

function renderCalendarioMensual() {
  const calendario = document.getElementById("calendarioMensual");
  const tituloMes = document.getElementById("tituloMes");

  if (!calendario || !tituloMes) return;

  calendario.innerHTML = "";

  const year = fechaCalendario.getFullYear();
  const month = fechaCalendario.getMonth();

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  tituloMes.textContent = `${nombresMeses[month]} ${year}`;

  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);

  let diaSemanaInicio = primerDiaMes.getDay();
  diaSemanaInicio = diaSemanaInicio === 0 ? 7 : diaSemanaInicio;

  for (let i = 1; i < diaSemanaInicio; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    calendario.appendChild(empty);
  }

  const hoyISO = obtenerFechaISO(new Date());

  for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia++) {
    const fecha = new Date(year, month, dia);
    const fechaISO = obtenerFechaISO(fecha);
    const clasesDia = obtenerClasesPorFecha(fechaISO);

    const div = document.createElement("div");
    div.className = "calendar-day";

    if (fechaISO === hoyISO) {
      div.classList.add("today");
    }

    div.onclick = function () {
      abrirAgendaDia(fechaISO);
    };

    div.innerHTML = `
      <div class="calendar-number">${dia}</div>
      ${clasesDia.length > 0 ? `<div class="calendar-count">${clasesDia.length} clases</div>` : ""}
    `;

    calendario.appendChild(div);
  }
}

function abrirAgendaDia(fechaISO) {
  fechaDiaSeleccionado = fechaISO;

  document.getElementById("tituloDia").textContent = `Agenda ${formatearFechaES(fechaISO)}`;
  document.getElementById("subtituloDia").textContent = "Planificación diaria de clases";

  actualizarSelectorDiaClientes();
  renderAgendaDia();

  cambiarPantalla("dia-screen");
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

function agendarClaseDia() {
  const clienteId = parseInt(document.getElementById("diaClienteSelect").value);
  const hora = document.getElementById("diaClaseHora").value;

  if (!fechaDiaSeleccionado || !clienteId || !hora) {
    alert("Selecciona cliente y hora.");
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
    consumida: false
  });

  guardarClientes();

  document.getElementById("diaClaseHora").value = "";

  actualizarResumen();
  renderAgendaDia();
}

function eliminarClase(clienteId, claseId) {
  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  if (!confirm("¿Eliminar esta clase?")) return;

  cliente.clases = cliente.clases.filter(clase => clase.id !== claseId);

  guardarClientes();
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

    div.innerHTML = `
      <div class="agenda-hora">${clase.hora}</div>

      <div class="agenda-cliente">
        <strong>${clase.clienteNombre}</strong>
        <span>${clase.duracion || clase.bonoDuracion} min · ${clase.modalidad || clase.bonoModalidad}</span>
        <span>Bono: ${clase.bonoDisponible}/${clase.bonoTotal}</span>
      </div>

      <button class="eliminar-btn" onclick="eliminarClase(${clase.clienteId}, ${clase.id})">Borrar</button>
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
      clasesHtml += `
        <div class="agenda-item">
          <div class="agenda-hora">${clase.hora}</div>
          <div class="agenda-cliente">
            <strong>${formatearFechaES(clase.fecha)}</strong>
            <span>${clase.duracion || clienteActual.bonoDuracion} min · ${clase.modalidad || clienteActual.bonoModalidad}</span>
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
