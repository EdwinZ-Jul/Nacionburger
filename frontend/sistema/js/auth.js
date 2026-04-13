import { decodeToken, isTokenExpired, redirectByRole } from './authGuard.js';

// Exponer el callback globalmente para que Google pueda ejecutarlo
window.handleCredentialResponse = async function(response) {
  try {
    // Mandamos el token de Google a nuestra nueva ruta
    const res = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });

    const data = await res.json();

    if (!res.ok) {
       alert(data.error || 'Autenticación denegada');
       return;
    }

    // Inicio de sesión exitoso
    sessionStorage.setItem("token", data.token);
   
    // Aprovechamos tu función nativa que ya funciona perfecto:
    redirectByRole(data.usuario.rol);


  } catch (error) {
    console.error(error);
    alert('Error al acceder con Google');
  }
}


//REGISTRO — escucha el form interno del panel registro
document.getElementById('form-register-inner')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombres = document.getElementById('nombres').value;
  const apellidos = document.getElementById('apellidos').value;
  const dni = document.getElementById('dni').value;
  const telefono = document.getElementById('telefono').value;
  const email = document.getElementById('email').value;
  const usuario = document.getElementById('usuario').value;
  const contrasena = document.getElementById('contrasena').value;

  try {
    const response = await fetch('/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombres, apellidos, dni, telefono, email, usuario, contrasena })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Registro exitoso');
      document.getElementById('form-register-inner').reset();
      document.getElementById('btn-show-login')?.click();
    } else {
      alert('Error: ' + (data?.error || 'No se pudo registrar'));
    }
  } catch (error) {
    console.error('Error al registrar:', error);
    alert('Error en la petición');
  }
});

//LOGIN
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('form-login')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const usuario = document.getElementById('login-usuario').value;
    const contrasena = document.getElementById('login-contrasena').value;
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena })
    });
    const data = await response.json();
    if (!data.token) {
      alert('Credenciales incorrectas');
      return;
    }
    //Guardamos SOLO el token
    sessionStorage.setItem("token", data.token);
    //Decodificamos
    const payload = decodeToken(data.token);
    //Verificamos expiración inmediatamente
    if (isTokenExpired(payload)) {
      sessionStorage.removeItem("token");
      alert("Sesión expirada");
      return;
    }
    //Redirigimos según rol
    redirectByRole(payload.rol);
  });

  //PASO 1: Verificar email y enviar código
  let recoveryEmail = "";

  document.getElementById('form-email')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    recoveryEmail = document.getElementById('forgot-email').value;

    await fetch('/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recoveryEmail })
    });

    alert("Código enviado");

    document.getElementById('form-email').style.display = 'none';
    document.getElementById('form-code').style.display = 'flex';
  });

  //PASO 2: Verificar código
  document.getElementById('form-code')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('forgot-code').value;

    const res = await fetch('/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recoveryEmail, code })
    });

    if (!res.ok) {
      alert("Código incorrecto");
      return;
    }

    alert("Código correcto");

    document.getElementById('form-code').style.display = 'none';
    document.getElementById('form-password').style.display = 'flex';
  });

  //PASO 3: Cambiar contraseña
  document.getElementById('form-password')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const contrasena = document.getElementById('new-password').value;

    const res = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recoveryEmail, contrasena })
    });

    if (!res.ok) {
      alert("Error al cambiar contraseña");
      return;
    }

    alert("Contraseña actualizada");

    document.getElementById('form-password').style.display = 'none';
    document.getElementById('form-login').style.display = 'flex';
  });
});