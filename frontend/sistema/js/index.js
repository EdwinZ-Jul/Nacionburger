document.addEventListener("DOMContentLoaded", () => {
  const loginForm    = document.getElementById("form-login");
  const registerForm = document.getElementById("form-register");

  const btnShowRegister = document.getElementById("btn-show-register");
  const btnShowLogin    = document.getElementById("btn-show-login");

  // Mostrar formulario de registro
  if (btnShowRegister) {
    btnShowRegister.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.style.display    = "none";
      registerForm.style.display = "flex";
    });
  }

  // Volver al login desde registro
  if (btnShowLogin) {
    btnShowLogin.addEventListener("click", (e) => {
      e.preventDefault();
      registerForm.style.display = "none";
      loginForm.style.display    = "flex";
    });
  }

  // Recuperar contraseña — paso 1: mostrar email form
  document.getElementById("btn-forgot")?.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    document.getElementById("form-email").style.display = "flex";
  });

  // Volver desde recuperar contraseña
  document.getElementById("back-login")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("form-email").style.display = "none";
    loginForm.style.display = "flex";
  });
});
