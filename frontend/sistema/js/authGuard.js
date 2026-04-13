// DECODIFICAR TOKEN JWT
export function decodeToken(token) {
  return JSON.parse(atob(token.split('.')[1]));
}

// VERIFICAR SI EL TOKEN ESTÁ EXPIRADO
export function isTokenExpired(payload) {
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
}

// REDIRECCIÓN SEGÚN ROL (después del login)
export function redirectByRole(rol) {

  switch (rol) {
    case 'admin':
      window.location.href = 'vistaAdmin.html';
      break;

    case 'cliente':
      window.location.href = 'pedido.html';
      break;

    case 'mozo':
      window.location.href = 'vistaMozo.html';
      break;

    case 'cajero':
      window.location.href = 'vistaCajero.html';
      break;

    case 'cocinero':
      window.location.href = 'cocineroV2.html';
      break;

    default:
      logout();
  }
}

//  PROTEGER RUTAS
export function protectRoute(requiredRole) {

  const token = sessionStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return null;
  }

  const payload = decodeToken(token);

  if (isTokenExpired(payload)) {
    logout();
    return null;
  }

  if (payload.rol !== requiredRole) {
    logout();
    return null;
  }

  return payload; // 🔥 IMPORTANTE
}

// ⏳ AUTO LOGOUT CUANDO EXPIRE
export function startAutoLogout() {

  const token = sessionStorage.getItem("token");
  if (!token) return;

  const payload = decodeToken(token);

  const currentTime = Date.now() / 1000;
  const timeLeft = payload.exp - currentTime;

  if (timeLeft <= 0) {
    logout();
    return;
  }

  setTimeout(() => {
    logout();
  }, timeLeft * 1000);
}

// 🚪 CERRAR SESIÓN
export function logout() {
  sessionStorage.removeItem("token");
  alert("Tu sesión ha expirado");
  window.location.href = "login.html";
}

// FETCH CON AUTENTICACIÓN (para rutas protegidas)
export async function fetchWithAuth(url, options = {}) {

  const token = sessionStorage.getItem("token");

  // ⚠️ Si el body es FormData, NO ponemos Content-Type aquí.
  // El browser lo agrega automáticamente con el boundary correcto.
  // Si lo forzamos a 'application/json', el servidor crashea con multipart.
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    // Solo agregar Content-Type si NO es FormData
    ...(!isFormData && { "Content-Type": "application/json" })
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    logout();
    return null;
  }

  return response;
}

// OBTENER USUARIO DESDE TOKEN (para mostrar su nombre, rol)
/*export async function obtenerUsuarioDesdeToken() {
  const token = sessionStorage.getItem("token");
  if (!token) return null;
  const payload = token.split(".")[1];
  const decoded = JSON.parse(atob(payload));
  return decoded;
}*/
