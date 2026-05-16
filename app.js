function login() {
  const usuario = document.getElementById("usuario").value;
  const password = document.getElementById("password").value;

  if (usuario && password) {
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("dashboard-screen").classList.add("active");
  } else {
    alert("Introduce usuario y contraseña.");
  }
}

function logout() {
  document.getElementById("dashboard-screen").classList.remove("active");
  document.getElementById("login-screen").classList.add("active");
}

function mostrarModulo(modulo) {
  alert("Módulo " + modulo + " en desarrollo.");
}
