import { fetchWithAuth } from './authGuard.js';

async function cargarPerfil() {
    try {
        const res = await fetchWithAuth("/api/cliente/perfil");
        const data = await res.json();

        document.getElementById("nombre").textContent = `${data.NOMBRES} ${data.APELLIDOS}`;
        document.getElementById("dni").textContent = data.DNI || "No registrado";
        document.getElementById("telefono").textContent = data.TELEFONO || "No registrado";
        document.getElementById("email").textContent = data.EMAIL;

    } catch (error) {
        console.error("Error cargando perfil:", error);
    }
}

cargarPerfil();