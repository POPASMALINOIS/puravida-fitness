let clientes = [];
let clienteActual = null;

document.addEventListener("DOMContentLoaded", function () {
  cargarClientes();
  actualizarResumen();
  actualizarSelectorClientes();
  renderCalendarioGeneral();
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
    actualizarSelectorClientes();
    renderCalendarioGeneral();
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
  actualizarSelectorClientes();
  renderCalendarioGeneral();
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
  const bono = parseInt(document.getElementById("clienteBono").value) || 0;
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
    bonoTotal: bono,
    bonoDisponible: bono,
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
  document.getElementById("clienteBono").value = "";
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

  const hoy = new Date().toISOString().split("T")[0];
  let clasesHoy = 0;

  clientes.forEach(cliente => {
    clasesHoy += cliente.clases.filter(clase => clase.fecha === hoy).length;
  });

  document.getElementById("clasesHoy").textContent = clasesHoy;
}

function actualizarSelectorClientes() {
  const select = document.getElementById("calendarioClienteSelect");

  if (!select) return;

  select.innerHTML = "";

  clientes.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente.id;
    option.textContent = cliente.nombre;
    select.appendChild(option);
  });
}

function agendarClaseGeneral() {
  const clienteId = parseInt(document.getElementById("calendarioClienteSelect").value);
  const fecha = document.getElementById("generalClaseFecha").value;
  const hora = document.getElementById("generalClaseHora").value;

  if (!clienteId || !fecha || !hora) {
    alert("Completa todos los campos.");
    return;
  }

  const cliente = clientes.find(c => c.id === clienteId);

  if (!cliente) return;

  cliente.clases.push({
    id: Date.now(),
    fecha,
    hora,
    estado: "Programada"
  });

  guardarClientes();
  volverDashboard();
}

function agendarClaseCliente() {
  const fecha = document.getElementById("claseFecha").value;
  const hora = document.getElementById("claseHora").value;

  if (!fecha || !hora) {
    alert("Completa fecha y hora.");
    return;
  }

  clienteActual.clases.push({
    id: Date.now(),
    fecha,
    hora,
    estado: "Programada"
  });

  guardarClientes();
  verFichaCliente(clienteActual.id);
}

function renderCalendarioGeneral() {
  const calendario = document.getElementById("calendarioGeneral");

  if (!calendario) return;

  calendario.innerHTML = "";

  let clases = [];

  clientes.forEach(cliente => {
    cliente.clases.forEach(clase => {
      clases.push({
        cliente: cliente.nombre,
        fecha: clase.fecha,
        hora: clase.hora,
        estado: clase.estado
      });
    });
  });

  clases.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

  if (clases.length === 0) {
    calendario.innerHTML = "<p>No hay clases programadas.</p>";
    return;
  }

  clases.forEach(clase => {
    const div = document.createElement("div");
    div.className = "calendario-item";

    div.innerHTML = `
      <strong>${clase.fecha} - ${clase.hora}</strong><br>
      Cliente: ${clase.cliente}<br>
      Estado: ${clase.estado}
    `;

    calendario.appendChild(div);
  });
}

function verFichaCliente(id) {
  clienteActual = clientes.find(cliente => cliente.id === id);

  if (!clienteActual) return;

  const ficha = document.getElementById("clienteFicha");

  let clasesHtml = "";

  if (clienteActual.clases.length === 0) {
    clasesHtml = "<p>No hay clases programadas.</p>";
  } else {
    clienteActual.clases.forEach(clase => {
      clasesHtml += `
        <div class="calendario-item">
          <strong>${clase.fecha} - ${clase.hora}</strong><br>
          Estado: ${clase.estado}
        </div>
      `;
    });
  }

  ficha.innerHTML = `
    <div class="ficha-card">
      <h2>${clienteActual.nombre}</h2>
      <p>📞 ${clienteActual.telefono}</p>
      <p>📧 ${clienteActual.email || "Sin email"}</p>
      <p>🎟️ Bono: ${clienteActual.bonoDisponible}/${clienteActual.bonoTotal}</p>
      <p>📌 Estado: ${clienteActual.estado}</p>
    </div>

    <div class="ficha-card">
      <h2>Calendario de clases</h2>

      <input type="date" id="claseFecha">
      <input type="time" id="claseHora">

      <button class="ficha-btn" onclick="agendarClaseCliente()">Guardar clase</button>

      <div>${clasesHtml}</div>
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
        <span class="cliente-sub">${cliente.estado}</span>
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
