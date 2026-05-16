let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

function login() {
  const usuario = document.getElementById("usuario").value;
  const password = document.getElementById("password").value;

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
    cambiarPantalla("clientes-screen");
  } else {
    alert("Módulo " + modulo + " en desarrollo.");
  }
}

function volverDashboard() {
  cambiarPantalla("dashboard-screen");
}

function agregarCliente() {
  const nombre = document.getElementById("clienteNombre").value;
  const telefono = document.getElementById("clienteTelefono").value;

  if (!nombre || !telefono) {
    alert("Completa todos los campos.");
    return;
  }

  clientes.push({ nombre, telefono });

  localStorage.setItem("clientes", JSON.stringify(clientes));

  document.getElementById("clienteNombre").value = "";
  document.getElementById("clienteTelefono").value = "";

  renderClientes();
}

function renderClientes() {
  const lista = document.getElementById("clientesLista");

  lista.innerHTML = "";

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

window.onload = function() {
  renderClientes();
};
