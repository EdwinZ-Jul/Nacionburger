// js/gestionPromociones.js
import { fetchWithAuth } from './authGuard.js';

export function cargarGestionPromociones() {
  const contenido = document.getElementById('admin-contenido');
  document.getElementById('admin-page-title').textContent = 'Gestión de Promociones';

  contenido.innerHTML = `
    <div class="promo-modulo">
      <!-- TOOLBAR -->
      <div class="promo-toolbar">
        <div class="promo-toolbar-left">
          <input type="text" id="promo-buscar" placeholder="🔍 Buscar promoción..." class="promo-input-search">
          <select id="promo-filtro-estado" class="promo-select">
            <option value="">Todos los estados</option>
            <option value="Activa">Activas</option>
            <option value="Próxima">Próximas</option>
            <option value="Expirada">Expiradas</option>
          </select>
        </div>
        <button class="promo-btn promo-btn-primary" onclick="abrirModalPromocion()">
          ＋ Nueva Promoción
        </button>
      </div>

      <!-- STATS RÁPIDAS -->
      <div class="promo-stats-row" id="promo-stats"></div>

      <!-- TABLA -->
      <div class="promo-table-wrapper">
        <table class="promo-table" id="promo-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="promo-tbody">
            <tr><td colspan="7" class="promo-loading">⏳ Cargando...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR/EDITAR -->
      <div class="promo-modal-overlay" id="promo-modal" style="display:none">
        <div class="promo-modal">
          <div class="promo-modal-header">
            <h3 id="promo-modal-titulo">Nueva Promoción</h3>
            <button class="promo-modal-close" onclick="cerrarModalPromocion()">✕</button>
          </div>
          <div class="promo-modal-body">
            <input type="hidden" id="promo-id-edit">
            <div class="promo-form-grid">
              <div class="promo-form-group promo-col-2">
                <label>Descripción *</label>
                <input type="text" id="promo-desc" placeholder="Ej: 2x1 en hamburguesas los martes" class="promo-input">
              </div>
              <div class="promo-form-group">
                <label>Descuento (%) *</label>
                <input type="number" id="promo-descuento" min="0" max="100" step="0.01" placeholder="Ej: 20.00" class="promo-input">
              </div>
              <div class="promo-form-group">
                <label>Fecha de Inicio *</label>
                <input type="date" id="promo-fecha-inicio" class="promo-input">
              </div>
              <div class="promo-form-group">
                <label>Fecha de Fin *</label>
                <input type="date" id="promo-fecha-fin" class="promo-input">
              </div>
              <div class="promo-form-group promo-col-2">
                <label>Productos incluidos</label>
                <div id="promo-productos-selector" class="promo-productos-grid">
                  <span style="color:#888">Cargando productos...</span>
                </div>
              </div>
            </div>
          </div>
          <div class="promo-modal-footer">
            <button class="promo-btn promo-btn-secondary" onclick="cerrarModalPromocion()">Cancelar</button>
            <button class="promo-btn promo-btn-primary"  onclick="guardarPromocion()">💾 Guardar</button>
          </div>
        </div>
      </div>

      <!-- MODAL CONFIRMAR ELIMINAR -->
      <div class="promo-modal-overlay" id="promo-modal-confirm" style="display:none">
        <div class="promo-modal promo-modal-sm">
          <div class="promo-modal-header">
            <h3>⚠️ Confirmar eliminación</h3>
          </div>
          <div class="promo-modal-body">
            <p>¿Estás seguro de que deseas eliminar esta promoción? Esta acción no se puede deshacer.</p>
          </div>
          <div class="promo-modal-footer">
            <button class="promo-btn promo-btn-secondary" onclick="cerrarConfirm()">Cancelar</button>
            <button class="promo-btn promo-btn-danger"    id="btn-confirm-eliminar">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  cargarPromociones();
  cargarProductosSelector();
  configurarFiltros();

  // Exponer funciones al scope global (onclick en HTML)
  window.abrirModalPromocion   = abrirModalPromocion;
  window.cerrarModalPromocion  = cerrarModalPromocion;
  window.guardarPromocion      = guardarPromocion;
  window.editarPromocion       = editarPromocion;
  window.confirmarEliminar     = confirmarEliminar;
  window.cerrarConfirm         = () => { document.getElementById('promo-modal-confirm').style.display='none'; };
}

// ─── CARGAR TABLA ─────────────────────────────────────────────────────────────
let _promocionesData = [];

async function cargarPromociones() {
  try {
    const res  = await fetchWithAuth('/api/admin/promociones');
    const data = await res.json();
    _promocionesData = data;
    renderTabla(data);
    renderStats(data);
  } catch (err) {
    document.getElementById('promo-tbody').innerHTML =
      '<tr><td colspan="7" style="color:red;text-align:center">❌ Error al cargar promociones</td></tr>';
  }
}

function renderTabla(data) {
  const tbody = document.getElementById('promo-tbody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="promo-loading">Sin promociones registradas</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td class="promo-id">#${p.ID_PROMOCION}</td>
      <td><strong>${p.DESCRIPCION}</strong></td>
      <td><span class="promo-badge-descuento">${p.DESCUENTO}%</span></td>
      <td class="promo-fechas">
        <span>${formatFecha(p.FECHA_INICIO)}</span>
        <span class="promo-arrow">→</span>
        <span>${formatFecha(p.FECHA_FIN)}</span>
      </td>
      <td class="promo-productos-cell">${p.PRODUCTOS || '—'}</td>
      <td><span class="promo-estado promo-estado-${p.ESTADO.toLowerCase().replace('ó','o')}">${p.ESTADO}</span></td>
      <td class="promo-acciones">
        <button class="promo-btn-icon promo-btn-edit" onclick="editarPromocion(${p.ID_PROMOCION})" title="Editar">✏️</button>
        <button class="promo-btn-icon promo-btn-del"  onclick="confirmarEliminar(${p.ID_PROMOCION})" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function renderStats(data) {
  const stats = document.getElementById('promo-stats');
  const activas  = data.filter(p => p.ESTADO === 'Activa').length;
  const proximas = data.filter(p => p.ESTADO === 'Próxima').length;
  const expiradas= data.filter(p => p.ESTADO === 'Expirada').length;
  stats.innerHTML = `
    <div class="promo-stat-card promo-stat-green"><span class="promo-stat-num">${activas}</span><span>Activas</span></div>
    <div class="promo-stat-card promo-stat-blue"><span class="promo-stat-num">${proximas}</span><span>Próximas</span></div>
    <div class="promo-stat-card promo-stat-gray"><span class="promo-stat-num">${expiradas}</span><span>Expiradas</span></div>
    <div class="promo-stat-card promo-stat-orange"><span class="promo-stat-num">${data.length}</span><span>Total</span></div>
  `;
}

function configurarFiltros() {
  document.getElementById('promo-buscar').addEventListener('input', filtrar);
  document.getElementById('promo-filtro-estado').addEventListener('change', filtrar);
}

function filtrar() {
  const texto  = document.getElementById('promo-buscar').value.toLowerCase();
  const estado = document.getElementById('promo-filtro-estado').value;
  const filtrado = _promocionesData.filter(p => {
    const matchTexto  = p.DESCRIPCION.toLowerCase().includes(texto);
    const matchEstado = !estado || p.ESTADO === estado;
    return matchTexto && matchEstado;
  });
  renderTabla(filtrado);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function abrirModalPromocion() {
  document.getElementById('promo-id-edit').value      = '';
  document.getElementById('promo-modal-titulo').textContent = 'Nueva Promoción';
  document.getElementById('promo-desc').value         = '';
  document.getElementById('promo-descuento').value    = '';
  document.getElementById('promo-fecha-inicio').value = '';
  document.getElementById('promo-fecha-fin').value    = '';
  document.querySelectorAll('.promo-producto-check').forEach(cb => cb.checked = false);
  document.getElementById('promo-modal').style.display = 'flex';
}

function cerrarModalPromocion() {
  document.getElementById('promo-modal').style.display = 'none';
}

async function editarPromocion(id) {
  try {
    const res  = await fetchWithAuth(`/api/admin/promociones/${id}`);
    const data = await res.json();
    const p    = data.promocion;

    document.getElementById('promo-id-edit').value          = p.ID_PROMOCION;
    document.getElementById('promo-modal-titulo').textContent = 'Editar Promoción';
    document.getElementById('promo-desc').value             = p.DESCRIPCION;
    document.getElementById('promo-descuento').value        = p.DESCUENTO;
    document.getElementById('promo-fecha-inicio').value     = p.FECHA_INICIO?.split('T')[0] || '';
    document.getElementById('promo-fecha-fin').value        = p.FECHA_FIN?.split('T')[0] || '';

    const idsProductos = (data.productos || []).map(prod => prod.ID_PLATILLO);
    document.querySelectorAll('.promo-producto-check').forEach(cb => {
      cb.checked = idsProductos.includes(Number(cb.value));
    });

    document.getElementById('promo-modal').style.display = 'flex';
  } catch (err) {
    alert('Error al cargar la promoción');
  }
}

async function guardarPromocion() {
  const id           = document.getElementById('promo-id-edit').value;
  const descripcion  = document.getElementById('promo-desc').value.trim();
  const descuento    = parseFloat(document.getElementById('promo-descuento').value);
  const fecha_inicio = document.getElementById('promo-fecha-inicio').value;
  const fecha_fin    = document.getElementById('promo-fecha-fin').value;
  const productos    = [...document.querySelectorAll('.promo-producto-check:checked')].map(cb => Number(cb.value));

  if (!descripcion || isNaN(descuento) || !fecha_inicio || !fecha_fin) {
    alert('Por favor completa todos los campos obligatorios (*)');
    return;
  }
  if (new Date(fecha_fin) < new Date(fecha_inicio)) {
    alert('La fecha de fin debe ser posterior a la de inicio');
    return;
  }

  const body = { descripcion, descuento, fecha_inicio, fecha_fin, productos };
  const url  = id ? `/api/admin/promociones/${id}` : '/api/admin/promociones';
  const met  = id ? 'PUT' : 'POST';

  try {
    const res  = await fetchWithAuth(url, { method: met, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');
    cerrarModalPromocion();
    const msg = id ? 'Promoción actualizada ✓' : 'Promoción creada ✓';
    mostrarToast(msg, 'success');
    cargarPromociones();
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

function confirmarEliminar(id) {
  const modal = document.getElementById('promo-modal-confirm');
  modal.style.display = 'flex';
  document.getElementById('btn-confirm-eliminar').onclick = async () => {
    try {
      const res = await fetchWithAuth(`/api/admin/promociones/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      modal.style.display = 'none';
      mostrarToast('Promoción eliminada ✓', 'success');
      cargarPromociones();
    } catch (err) {
      alert('❌ Error al eliminar: ' + err.message);
    }
  };
}

// ─── SELECTOR DE PRODUCTOS ────────────────────────────────────────────────────
async function cargarProductosSelector() {
  try {
    const res  = await fetchWithAuth('/api/admin/promociones/productos');
    const data = await res.json();
    const container = document.getElementById('promo-productos-selector');
    if (!data.length) { container.innerHTML = '<span style="color:#888">No hay productos activos</span>'; return; }
    container.innerHTML = data.map(p => `
      <label class="promo-producto-item">
        <input type="checkbox" class="promo-producto-check" value="${p.ID_PLATILLO}">
        <span class="promo-producto-nombre">${p.NOMBRE}</span>
        <span class="promo-producto-precio">S/.${Number(p.PRECIO).toFixed(2)}</span>
        <span class="promo-producto-cat">${p.CATEGORIA}</span>
      </label>
    `).join('');
  } catch {
    document.getElementById('promo-productos-selector').innerHTML = '<span style="color:red">Error al cargar</span>';
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}

function mostrarToast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.className = `promo-toast promo-toast-${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
