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

  if (!nombre || !telefono) {
    alert("Completa todos los campos.");
    return;
  }

  clientes.push({
    id: Date.now(),
    nombre: nombre,
    telefono: telefono
  });

  guardarClientes();

  document.getElementById("clienteNombre").value = "";
  document.getElementById("clienteTelefono").value = "";

  renderClientes();

  alert("Cliente guardado correctamente.");
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
      <span>${cliente.telefono}</span>
    `;

    lista.appendChild(div);
  });
}
