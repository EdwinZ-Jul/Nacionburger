import { fetchWithAuth } from './authGuard.js';

// gestionEmpleados.js
export async function cargarGestionEmpleados() {
  const contenido = document.getElementById("admin-contenido");
  contenido.innerHTML = `
    <div class="gestion-container">
      <h2>Gestión de Empleados</h2>
      <button id="btnNuevoEmpleado" class="btn-primario">+ Nuevo Empleado</button>
      <button id="btnGestionHorarios" class="btn-secundario">
      ⚙️ Gestionar Horarios
      </button>

      <table class="tabla-empleados">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Horario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tablaEmpleadosBody">
          <tr>
            <td colspan="9" class="loading">Cargando empleados...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para nuevo empleado -->
    <div id="modalNuevoEmpleado" class="modal" style="display:none;">
      <div class="modal-content">
        <span id="cerrarModal" class="cerrar">&times;</span>
        <h3>Agregar Nuevo Empleado</h3>
        <form id="formNuevoEmpleado">
          <label>Nombres: <input type="text" name="nombres" required></label>
          <label>Apellidos: <input type="text" name="apellidos" required></label>
          <label>DNI: <input type="text" name="dni" maxlength="8" required></label>
          <label>Teléfono: <input type="text" name="telefono" required></label>
          <label>Email: <input type="email" name="email" required></label>
          <label>Usuario: <input type="text" name="usuario" required></label>
          <label>Contraseña: <input type="password" name="contrasena" required></label>
          <label>Cargo:
            <select name="idCargo" required>
              <option value="">Seleccione...</option>
            </select>
          </label>
          <label>Horario:
            <select name="idHorario" required>
              <option value="">Seleccione...</option>
            </select>
          </label>
          <button type="submit" class="btn-primario">Guardar</button>
        </form>
        <div id="formMensaje" style="color:red; margin-top:10px;"></div>
      </div>
    </div>

    <!-- 🔥 MODAL HORARIOS -->
<div id="modalHorarios" class="modal" style="display:none;">
  <div class="modal-content" style="width: 600px;">
    <span id="cerrarModalHorarios" class="cerrar">&times;</span>

    <h3>Gestión de Horarios</h3>

    <button id="btnNuevoHorario" class="btn-primario">
      + Nuevo Horario
    </button>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Inicio</th>
          <th>Fin</th>
          <th>Acciones</th>
        </tr>
       </thead>
        <tbody id="tablaHorarios"></tbody>
      </table>
    </div>
  </div>
  `;

  async function cargarEmpleados() {
    const tbody = document.getElementById("tablaEmpleadosBody");
    tbody.innerHTML = `<tr><td colspan="9" class="loading">Cargando empleados...</td></tr>`;
    try {
      const res = await fetchWithAuth('/api/empleados/listar-empleados');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const empleados = await res.json();

      tbody.innerHTML = "";
      if (!empleados || empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="no-data">No hay empleados registrados.</td></tr>`;
        return;
      }

      empleados.forEach(emp => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${emp.ID_TRABAJADOR}</td>
          <td>${emp.NOMBRES}</td>
          <td>${emp.APELLIDOS}</td>
          <td>${emp.DNI}</td>
          <td>${emp.TELEFONO}</td>
          <td>${emp.EMAIL}</td>
          <td>${emp.CARGO || 'Sin cargo'}</td>
          <td>${emp.HORA_INICIO} - ${emp.HORA_FIN}</td>
          <td>
            <button class="btn-editar" data-id="${emp.ID_TRABAJADOR}">✏</button>
            <button class="btn-eliminar" data-id="${emp.ID_TRABAJADOR}">🗑</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error("Error cargando empleados:", error);
      tbody.innerHTML = `<tr><td colspan="9" class="error">Error cargando empleados.</td></tr>`;
    }
  }

  await cargarEmpleados();

  // Manejo modal y formulario
  const modal = document.getElementById("modalNuevoEmpleado");
  const btnNuevo = document.getElementById("btnNuevoEmpleado");
  const btnCerrar = document.getElementById("cerrarModal");
  const form = document.getElementById("formNuevoEmpleado");
  const mensaje = document.getElementById("formMensaje");

  btnNuevo.addEventListener("click", async () => {
    mensaje.textContent = "";
    form.reset();

    // Cargar cargos
    try {
      const resCargos = await fetchWithAuth('/api/empleados/cargos');
      if (!resCargos.ok) throw new Error(`HTTP ${resCargos.status}`);
      const cargos = await resCargos.json();
      const selectCargo = form.elements['idCargo'];
      selectCargo.innerHTML = `<option value="">Seleccione...</option>`;
      cargos.forEach(c => {
        const option = document.createElement('option');
        option.value = c.ID_CARGO;
        option.textContent = c.DESCRIPCION;
        selectCargo.appendChild(option);
      });
    } catch (e) {
      console.error("Error cargando cargos:", e);
      mensaje.textContent = "No se pudo cargar la lista de cargos.";
      return;
    }

    // Cargar horarios
    try {
      const resHorarios = await fetchWithAuth('/api/empleados/horarios');
      if (!resHorarios.ok) throw new Error(`HTTP ${resHorarios.status}`);
      const horarios = await resHorarios.json();
      const selectHorario = form.elements['idHorario'];
      selectHorario.innerHTML = `<option value="">Seleccione...</option>`;
      horarios.forEach(h => {
        const option = document.createElement('option');
        option.value = h.ID_HORARIO;
        option.textContent = `${h.HORA_INICIO} - ${h.HORA_FIN}`;
        selectHorario.appendChild(option);
      });
    } catch (e) {
      console.error("Error cargando horarios:", e);
      mensaje.textContent = "No se pudo cargar la lista de horarios.";
      return;
    }

    modal.style.display = "flex";
  });

  btnCerrar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  });

  // Eventos para botones de acción
  document.getElementById("tablaEmpleadosBody").addEventListener("click", async (e) => {
    const id = e.target.dataset.id;

    // ELIMINAR
    if (e.target.classList.contains("btn-eliminar")) {
      if (confirm("¿Seguro que quieres eliminar este empleado?")) {
        try {
          const res = await fetchWithAuth(`/api/empleados/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          alert(data.mensaje || "Empleado eliminado correctamente");
          await cargarEmpleados();
        } catch (err) {
          console.error("Error eliminando empleado:", err);
          alert("Error eliminando empleado");
        }
      }
    }

    // EDITAR
    if (e.target.classList.contains("btn-editar")) {
      try {
        // Obtener datos del empleado
        const resEmp = await fetchWithAuth(`/api/empleados/${id}`);
        if (!resEmp.ok) throw new Error(`HTTP ${resEmp.status}`);
        const emp = await resEmp.json();

        // Abrir modal y precargar datos
        mensaje.textContent = "";
        modal.style.display = "block";

        // Cargar lista de cargos
        const resCargos = await fetchWithAuth('/api/empleados/cargos');
        const cargos = await resCargos.json();
        const selectCargo = form.elements['idCargo'];
        selectCargo.innerHTML = `<option value="">Seleccione...</option>`;
        cargos.forEach(c => {
          const option = document.createElement('option');
          option.value = c.ID_CARGO;
          option.textContent = c.DESCRIPCION;
          if (c.ID_CARGO === emp.ID_CARGO) option.selected = true;
          selectCargo.appendChild(option);
        });

        // Cargar lista de horarios
        const resHorarios = await fetchWithAuth('/api/empleados/horarios');
        const horarios = await resHorarios.json();
        const selectHorario = form.elements['idHorario'];
        selectHorario.innerHTML = `<option value="">Seleccione...</option>`;
        horarios.forEach(h => {
          const option = document.createElement('option');
          option.value = h.ID_HORARIO;
          option.textContent = `${h.HORA_INICIO} - ${h.HORA_FIN}`;
          if (h.ID_HORARIO === emp.ID_HORARIO) option.selected = true;
          selectHorario.appendChild(option);
        });

        // Precargar campos
        form.elements['nombres'].value = emp.NOMBRES;
        form.elements['apellidos'].value = emp.APELLIDOS;
        form.elements['dni'].value = emp.DNI;
        form.elements['telefono'].value = emp.TELEFONO;
        form.elements['email'].value = emp.EMAIL;
        form.elements['usuario'].value = emp.USUARIO;
        form.elements['contrasena'].value = ""; // vacío por seguridad

        // Marcar que es edición
        form.dataset.editingId = id;

      } catch (err) {
        console.error("Error cargando empleado para editar:", err);
        alert("No se pudo cargar la información del empleado.");
      }
    }
  });

  // Modificar submit para que maneje edición o creación
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.textContent = "";

    const formData = {
      nombres: form.elements['nombres'].value.trim(),
      apellidos: form.elements['apellidos'].value.trim(),
      dni: form.elements['dni'].value.trim(),
      telefono: form.elements['telefono'].value.trim(),
      email: form.elements['email'].value.trim(),
      usuario: form.elements['usuario'].value.trim(),
      contrasena: form.elements['contrasena'].value.trim(),
      idCargo: parseInt(form.elements['idCargo'].value),
      idHorario: parseInt(form.elements['idHorario'].value),
    };

    const idEdicion = form.dataset.editingId;
    const method = idEdicion ? "PUT" : "POST";
    const url = idEdicion ? `/api/empleados/${idEdicion}` : `/api/empleados/crear-empleado`;

    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      alert(data.mensaje || (idEdicion ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente'));
      modal.style.display = "none";
      delete form.dataset.editingId; // limpiar modo edición
      await cargarEmpleados();
    } catch (err) {
      console.error("Error guardando empleado:", err);
      mensaje.textContent = "Error al guardar empleado.";
    }
  });

  async function cargarHorarios() {
    const tbody = document.getElementById("tablaHorarios");

    const res = await fetchWithAuth("/api/empleados/horarios");
    const horarios = await res.json();

    tbody.innerHTML = "";

    horarios.forEach(h => {
      tbody.innerHTML += `
      <tr>
        <td>${h.ID_HORARIO}</td>
        <td>${h.HORA_INICIO}</td>
        <td>${h.HORA_FIN}</td>
        <td>
          <button onclick="editarHorario(${h.ID_HORARIO}, '${h.HORA_INICIO}', '${h.HORA_FIN}')">✏</button>
          <button onclick="eliminarHorario(${h.ID_HORARIO})">🗑</button>
        </td>
      </tr>
    `;
    });
  }

  const btnHorarios = document.getElementById("btnGestionHorarios");
  const modalHorarios = document.getElementById("modalHorarios");
  const cerrarHorarios = document.getElementById("cerrarModalHorarios");

  btnHorarios.addEventListener("click", async () => {
    modalHorarios.style.display = "flex";
    await cargarHorarios();
  });

  cerrarHorarios.addEventListener("click", () => {
    modalHorarios.style.display = "none";
  });

  //Nuvo horario
  document.getElementById("btnNuevoHorario").addEventListener("click", async () => {

    const inicio = prompt("Hora inicio (HH:mm)");
    const fin = prompt("Hora fin (HH:mm)");

    if (!inicio || !fin) return;

    await fetchWithAuth("/api/empleados/crear-horario", {
      method: "POST",
      body: JSON.stringify({
        hora_inicio: inicio,
        hora_fin: fin
      })
    });

    await cargarHorarios();
  });

  //Eliminar horario
  window.eliminarHorario = async function (id) {
    if (!confirm("¿Eliminar horario?")) return;

    await fetchWithAuth(`/api/empleados/eliminar-horario/${id}`, {
      method: "DELETE"
    });

    await cargarHorarios();
  };

  //Editar Horario
  window.editarHorario = async function (id, inicio, fin) {
    const nuevoInicio = prompt("Nueva hora inicio:", inicio);
    const nuevoFin = prompt("Nueva hora fin:", fin);
    if (!nuevoInicio || !nuevoFin) return;
    await fetchWithAuth(`/api/empleados/actualizar-horario/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        hora_inicio: nuevoInicio,
        hora_fin: nuevoFin
      })
    });
    await cargarHorarios();
  };
}
