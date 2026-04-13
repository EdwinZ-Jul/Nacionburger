import { fetchWithAuth } from './authGuard.js';

export async function cargarGestionProductos() {
    const contenido = document.getElementById('admin-contenido');
    contenido.innerHTML = `
        <h2>Gestión de Productos</h2>

        <form id="form-nuevo-producto" enctype="multipart/form-data">
            <div class="form-group">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" required>
            </div>
            <div class="form-group">
                <label for="precio">Precio (S/):</label>
                <input type="number" step="0.01" id="precio" required>
            </div>
            <div class="form-group">
                <label for="descripcion">Descripción:</label>
                <textarea id="descripcion" rows="2" required></textarea>
            </div>
            <div class="form-group">
                <label for="categoria">Categoría:</label>
                <select id="categoria" required>
                    <option value="" disabled selected>Seleccione una categoría</option>
                </select>
            </div>
            <div class="form-group">
                <label for="imagen">Imagen:</label>
                <input type="file" id="imagen" accept="image/*" required>
            </div>
            <button type="submit" id="btnAgregarProducto">Agregar Producto</button>
        </form>

        <div class="form-group">
            <label for="buscador">Buscar producto:</label>
            <input type="text" id="buscador" placeholder="Escribe para buscar por nombre...">
        </div>

        <table id="tabla-productos">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Imagen</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="body-productos"></tbody>
        </table>

        <!-- Modal editar producto -->
        <div id="modal-editar-producto" class="modal" style="display:none;">
            <div class="modal-content">
                <span id="cerrar-modal-editar" class="cerrar">&times;</span>
                <h3>Editar Producto</h3>
                <form id="form-editar-producto" enctype="multipart/form-data">
                    <input type="hidden" id="editar-id">
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" id="editar-nombre" required>
                    </div>
                    <div class="form-group">
                        <label>Precio (S/):</label>
                        <input type="number" step="0.01" id="editar-precio" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea id="editar-descripcion" rows="2" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Categoría:</label>
                        <select id="editar-categoria" required>
                            <option value="" disabled>Seleccione una categoría</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Nueva imagen (opcional):</label>
                        <input type="file" id="editar-imagen" accept="image/*">
                    </div>
                    <button type="submit" class="btn-primario" style="width:100%;margin-top:8px;">Guardar cambios</button>
                    <div id="editar-mensaje" style="color:#e06060;margin-top:8px;font-size:0.85rem;"></div>
                </form>
            </div>
        </div>
    `;

    // ── Cargar categorías en ambos selects ──────────────────────────────
    let categorias = [];
    try {
        const resCat = await fetchWithAuth('/api/admin/productos/categorias');
        if (resCat) {
            categorias = await resCat.json();
            const opts = categorias.map(c =>
                `<option value="${c.ID_CATEGORIA}">${c.DESCRIPCION}</option>`
            ).join('');
            document.getElementById('categoria').innerHTML =
                `<option value="" disabled selected>Seleccione una categoría</option>${opts}`;
            document.getElementById('editar-categoria').innerHTML =
                `<option value="" disabled>Seleccione una categoría</option>${opts}`;
        }
    } catch (e) {
        console.error('Error al cargar categorías:', e);
    }

    // ── Función: renderizar tabla ────────────────────────────────────────
    async function cargarTabla() {
        const cuerpo = document.getElementById('body-productos');
        cuerpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9a8a84;padding:20px;">Cargando...</td></tr>';
        try {
            const res = await fetchWithAuth('/api/admin/productos/listar-productos');
            if (!res) return;
            const productos = await res.json();
            if (!Array.isArray(productos)) return;

            cuerpo.innerHTML = '';
            if (productos.length === 0) {
                cuerpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9a8a84;padding:20px;">No hay productos registrados.</td></tr>';
                return;
            }

            productos.forEach(p => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${p.NOMBRE}</td>
                    <td>S/ ${Number(p.PRECIO).toFixed(2)}</td>
                    <td>${p.DESCRIPCION}</td>
                    <td>${p.CATEGORIA}</td>
                    <td><img src="/images/${p.CARPETA}/${p.IMAGEN}" width="60" height="60" alt="${p.NOMBRE}" style="border-radius:8px;object-fit:cover;"></td>
                    <td>
                        <button class="btn-actualizar"
                            data-id="${p.ID_PLATILLO}"
                            data-nombre="${p.NOMBRE}"
                            data-precio="${p.PRECIO}"
                            data-descripcion="${p.DESCRIPCION}"
                            data-categoria="${p.ID_CATEGORIA || ''}">✏ Editar</button>
                        <button class="btn-eliminar" data-id="${p.ID_PLATILLO}">🗑 Eliminar</button>
                    </td>
                `;
                cuerpo.appendChild(fila);
            });
        } catch (err) {
            console.error('Error al cargar productos:', err);
        }
    }

    await cargarTabla();

    // ── Agregar producto ─────────────────────────────────────────────────
    document.getElementById('btnAgregarProducto').addEventListener('click', async (e) => {
        e.preventDefault();
        const nombre      = document.getElementById('nombre').value.trim();
        const precio      = document.getElementById('precio').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const categoriaId = document.getElementById('categoria').value;
        const imagen      = document.getElementById('imagen').files[0];

        if (!nombre || !precio || !descripcion || !categoriaId || !imagen) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        const formData = new FormData();
        formData.append('nombre',      nombre);
        formData.append('precio',      precio);
        formData.append('descripcion', descripcion);
        formData.append('idCategoria', categoriaId);
        formData.append('imagen',      imagen);

        try {
            const res = await fetchWithAuth('/api/admin/productos', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                alert(data.mensaje);
                document.getElementById('form-nuevo-producto').reset();
                await cargarTabla();
            } else {
                alert(data.error || 'Error al registrar el producto.');
            }
        } catch (err) {
            console.error('Error al registrar:', err);
            alert('Error al conectar con el servidor.');
        }
    });

    // ── Buscador ─────────────────────────────────────────────────────────
    document.getElementById('buscador').addEventListener('input', function () {
        const filtro = this.value.toLowerCase();
        document.querySelectorAll('#body-productos tr').forEach(fila => {
            const nombre = fila.querySelector('td')?.textContent.toLowerCase() || '';
            fila.style.display = nombre.includes(filtro) ? '' : 'none';
        });
    });

    // ── Modal editar ─────────────────────────────────────────────────────
    const modalEditar  = document.getElementById('modal-editar-producto');
    const cerrarEditar = document.getElementById('cerrar-modal-editar');

    cerrarEditar.addEventListener('click', () => { modalEditar.style.display = 'none'; });
    window.addEventListener('click', e => { if (e.target === modalEditar) modalEditar.style.display = 'none'; });

    // ── Delegación de eventos: tabla ─────────────────────────────────────
    document.getElementById('body-productos').addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;

        // EDITAR
        if (btn.classList.contains('btn-actualizar')) {
            document.getElementById('editar-id').value          = id;
            document.getElementById('editar-nombre').value      = btn.dataset.nombre;
            document.getElementById('editar-precio').value      = btn.dataset.precio;
            document.getElementById('editar-descripcion').value = btn.dataset.descripcion;
            document.getElementById('editar-imagen').value      = ''; // limpiar input file
            document.getElementById('editar-mensaje').textContent = '';

            // Seleccionar categoría actual
            const sel = document.getElementById('editar-categoria');
            sel.value = btn.dataset.categoria;

            modalEditar.style.display = 'flex';
        }

        // ELIMINAR
        if (btn.classList.contains('btn-eliminar')) {
            if (!confirm('¿Seguro que quieres eliminar este producto? También se borrará la imagen.')) return;
            try {
                const res  = await fetchWithAuth(`/api/admin/productos/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                    alert(data.mensaje);
                    await cargarTabla();
                } else {
                    alert(data.error || 'Error al eliminar.');
                }
            } catch (err) {
                console.error('Error al eliminar:', err);
                alert('Error al conectar con el servidor.');
            }
        }
    });

    // ── Submit editar ────────────────────────────────────────────────────
    document.getElementById('form-editar-producto').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id          = document.getElementById('editar-id').value;
        const nombre      = document.getElementById('editar-nombre').value.trim();
        const precio      = document.getElementById('editar-precio').value;
        const descripcion = document.getElementById('editar-descripcion').value.trim();
        const categoriaId = document.getElementById('editar-categoria').value;
        const imagenFile  = document.getElementById('editar-imagen').files[0];
        const msg         = document.getElementById('editar-mensaje');

        if (!nombre || !precio || !descripcion || !categoriaId) {
            msg.textContent = 'Completa todos los campos obligatorios.';
            return;
        }

        const formData = new FormData();
        formData.append('nombre',      nombre);
        formData.append('precio',      precio);
        formData.append('descripcion', descripcion);
        formData.append('idCategoria', categoriaId);
        if (imagenFile) formData.append('imagen', imagenFile);

        try {
            const res  = await fetchWithAuth(`/api/admin/productos/${id}`, { method: 'PUT', body: formData });
            const data = await res.json();
            if (res.ok) {
                alert(data.mensaje);
                modalEditar.style.display = 'none';
                await cargarTabla();
            } else {
                msg.textContent = data.error || 'Error al actualizar.';
            }
        } catch (err) {
            console.error('Error al actualizar:', err);
            msg.textContent = 'Error al conectar con el servidor.';
        }
    });
}