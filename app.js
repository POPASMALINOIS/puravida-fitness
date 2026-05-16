let clientes = [];

document.addEventListener("DOMContentLoaded", function () {
  cargarClientes();
  renderClientes();
});

function cargarClientes() {
  const datosGuardados = localStorage.getItem("clientes");

  if (datosGuardados) {
    clientes = JSON.parse(datosGuardados);
  } else {
    clientes = [];
  }
}

function guardarClientes() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  if (usuario && password) {
    cambiarPantalla("dashboard-screen");
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

function mostrarModulo(modulo) {
  if (modulo === "clientes") {
    cargarClientes();
    renderClientes();
    cambiarPantalla("clientes-screen");
  } else {
    alert("Módulo " + modulo + " en desarrollo.");
  }
}

function volverDashboard() {
  cambiarPantalla("dashboard-screen");
}

function agregarCliente() {
  const nombre = document.getElementById("clienteNombre").value.trim();
  const telefono = document.getElementById("clienteTelefono").value.trim();
  const fechaAlta = document.getElementById("clienteFechaAlta").value;
  const cuota = document.getElementById("clienteCuota").value;
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
    fechaAlta,
    cuota,
    estado,
    observaciones
  });

  guardarClientes();

  document.getElementById("clienteNombre").value = "";
  document.getElementById("clienteTelefono").value = "";
  document.getElementById("clienteFechaAlta").value = "";
  document.getElementById("clienteCuota").value = "";
  document.getElementById("clienteEstado").value = "Activo";
  document.getElementById("clienteObservaciones").value = "";

  renderClientes();

  alert("Cliente guardado correctamente.");
}

function eliminarCliente(id) {
  if (!confirm("¿Eliminar este cliente?")) return;

  clientes = clientes.filter(cliente => cliente.id !== id);

  guardarClientes();
  renderClientes();
}

function renderClientes() {
  const lista = document.getElementById("clientesLista");

  if (!lista) return;

  lista.innerHTML = "";

  if (clientes.length === 0) {
    lista.innerHTML = "<p>No hay clientes guardados.</p>";
    return;
  }

  clientes.forEach(cliente => {
    const div = document.createElement("div");
    div.className = "cliente-item";

    div.innerHTML = `
      <strong>${cliente.nombre}</strong>
      <span>📞 ${cliente.telefono}</span><br>
      <span>📅 Alta: ${cliente.fechaAlta || "No indicada"}</span><br>
      <span>💳 Cuota: ${cliente.cuota || "0"} €</span><br>
      <span>📌 Estado: ${cliente.estado}</span><br>
      <span>📝 ${cliente.observaciones || "Sin observaciones"}</span>
      <button class="eliminar-btn" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
    `;

    lista.appendChild(div);
  });
}
