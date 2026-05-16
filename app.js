let clientes = [];
let clienteActual = null;

document.addEventListener("DOMContentLoaded", function () {
  cargarClientes();
  actualizarResumen();
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
    cambiarPantalla("clientes-screen");
    actualizarResumen();
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

function volverClientes() {
  cambiarPantalla("clientes-screen");
  actualizarResumen();
  renderClientes();
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
  volverClientes();
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
  actualizarResumen();
  renderClientes();
}

function actualizarResumen() {
  document.getElementById("totalClientes").textContent = clientes.length;

  const activos = clientes.filter(c => c.estado === "Activo").length;
  document.getElementById("clientesActivos").textContent = activos;

  const bonosBajos = clientes.filter(c => c.bonoDisponible <= 2).length;
  document.getElementById("bonosBajos").textContent = bonosBajos;
}

function verFichaCliente(id) {
  clienteActual = clientes.find(cliente => cliente.id === id);

  if (!clienteActual) return;

  const ficha = document.getElementById("clienteFicha");

  ficha.innerHTML = `
    <div class="ficha-card">
      <h2>${clienteActual.nombre}</h2>
      <p>📞 ${clienteActual.telefono}</p>
      <p>📧 ${clienteActual.email || "Sin email"}</p>
      <p>📅 Alta: ${clienteActual.fechaAlta || "No indicada"}</p>
      <p>💳 Cuota: ${clienteActual.cuota || "0"} €</p>
      <p>🎟️ Bono: ${clienteActual.bonoDisponible}/${clienteActual.bonoTotal}</p>
      <p>📌 Estado: ${clienteActual.estado}</p>
      <p>📝 ${clienteActual.observaciones || "Sin observaciones"}</p>
    </div>

    <div class="ficha-card">
      <h2>Rutinas</h2>
      <p>${clienteActual.rutinas.length} registradas</p>
    </div>

    <div class="ficha-card">
      <h2>Clases</h2>
      <p>${clienteActual.clases.length} programadas</p>
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
  const buscador = document.getElementById("buscadorClientes").value.toLowerCase();

  if (!lista) return;

  lista.innerHTML = "";

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(buscador) ||
    cliente.telefono.includes(buscador)
  );

  if (clientesFiltrados.length === 0) {
    lista.innerHTML = "<p>No hay clientes encontrados.</p>";
    return;
  }

  clientesFiltrados.forEach(cliente => {
    const div = document.createElement("div");
    div.className = "cliente-item";

    div.innerHTML = `
      <strong>${cliente.nombre}</strong>
      <span>📞 ${cliente.telefono}</span><br>
      <span>🎟️ Bono: ${cliente.bonoDisponible}/${cliente.bonoTotal}</span><br>
      <span>📌 ${cliente.estado}</span>
      <button class="ficha-btn" onclick="verFichaCliente(${cliente.id})">Ver ficha</button>
      <button class="eliminar-btn" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
    `;

    lista.appendChild(div);
  });
}
