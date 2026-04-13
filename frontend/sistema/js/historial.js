
// ==========================================
// IMPORTACIÓN DE AUTH
// ==========================================
import { fetchWithAuth } from './authGuard.js';

// ==========================================
// ESTADO GLOBAL
// ==========================================
const state = {
    pedidos: [],
    filtroActual: 'todos',
    pedidoSeleccionado: null
};

// ==========================================
// 1. CARGAR PEDIDOS DEL CLIENTE
// ==========================================
async function cargarPedidos() {
    const container = document.getElementById('lista-pedidos');
    const emptyState = document.getElementById('empty-state');

    // Mostrar loader
    container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16">
                    <div class="loader mb-4"></div>
                    <p class="text-gray-500">Cargando tus pedidos...</p>
                </div>
            `;
    emptyState.classList.add('hidden');

    try {
        const response = await fetchWithAuth('/api/cliente/pedidos');

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Error al cargar pedidos');
        }

        const pedidos = await response.json();
        state.pedidos = pedidos;

        if (pedidos.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            renderizarPedidos(pedidos);
        }

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
                    <div class="text-center py-16">
                        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 mb-2">Error al cargar</h3>
                        <p class="text-gray-500 mb-4">No pudimos obtener tu historial de pedidos</p>
                        <button onclick="cargarPedidos()" class="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors">
                            Intentar nuevamente
                        </button>
                    </div>
                `;
        mostrarToast('Error de conexión', 'error');
    }
}

// ==========================================
// 2. RENDERIZAR LISTA DE PEDIDOS
// ==========================================
function renderizarPedidos(pedidos) {
    const container = document.getElementById('lista-pedidos');

    // Aplicar filtro
    let pedidosFiltrados = pedidos;
    if (state.filtroActual !== 'todos') {
        pedidosFiltrados = pedidos.filter(p => p.ESTADO === state.filtroActual.toLowerCase());
    }

    if (pedidosFiltrados.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-12">
                        <p class="text-gray-500">No hay pedidos ${state.filtroActual !== 'todos' ? 'en este estado' : ''}</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = pedidosFiltrados.map((pedido, index) => {
        const { color, icono, bg } = getEstadoConfig(pedido.ESTADO);
        const fecha = formatearFecha(pedido.FECHA_HORA);

        return `
                    <div class="pedido-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-slide-up cursor-pointer" 
                         style="animation-delay: ${index * 0.05}s"
                         onclick="abrirDetallePedido(${pedido.ID_PEDIDO})">
                        
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl ${bg} flex items-center justify-center">
                                    <i class="fas ${icono} ${color} text-lg"></i>
                                </div>
                                <div>
                                    <h3 class="font-display text-xl text-gray-800">Pedido #${pedido.ID_PEDIDO}</h3>
                                    <p class="text-xs text-gray-500">${fecha}</p>
                                </div>
                            </div>
                            <span class="status-badge px-3 py-1 rounded-full text-xs font-bold ${bg} ${color} border border-current border-opacity-30">
                                ${pedido.ESTADO}
                            </span>
                        </div>

                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <i class="fas ${getIconoEntrega(pedido.TIPO_ENTREGA)} text-gray-400"></i>
                                <span>${pedido.TIPO_ENTREGA}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="font-display text-2xl text-gray-800">S/ ${formatearMoneda(pedido.TOTAL)}</span>
                                <button class="w-8 h-8 rounded-full bg-gray-100 hover:bg-brand-red hover:text-white flex items-center justify-center transition-colors">
                                    <i class="fas fa-chevron-right text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');
}

// ==========================================
// 3. OBTENER CONFIGURACIÓN VISUAL POR ESTADO
// ==========================================
function getEstadoConfig(estado) {
    const configs = {
        'pendiente': {
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            icono: 'fa-clock',
            progress: 25
        },
        'en preparación': {
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            icono: 'fa-fire',
            progress: 50
        },
        'listo': {
            color: 'text-green-600',
            bg: 'bg-green-100',
            icono: 'fa-check-circle',
            progress: 75
        },
        'en camino': { 
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            icono: 'fa-motorcycle',
            progress: 90
        },
        'entregado': {
            color: 'text-gray-600',
            bg: 'bg-gray-100',
            icono: 'fa-check-double',
            progress: 100
        }
    };
    return configs[estado] || configs['Pendiente'];
}

function getIconoEntrega(tipo) {
    switch (tipo) {
        case 'Local':
            return 'fa-utensils';
        case 'Recojo en tienda':
            return 'fa-box';
        case 'Delivery':
            return 'fa-motorcycle';
        default:
            return 'fa-receipt';
    }
}
// ==========================================
// 4. ABRIR DETALLE DE PEDIDO (MODAL)
// ==========================================
async function abrirDetallePedido(idPedido) {
    const modal = document.getElementById('modal-detalle');
    const productosContainer = document.getElementById('modal-productos');

    // Mostrar modal con loading
    modal.classList.remove('hidden');
    productosContainer.innerHTML = `
                <div class="flex justify-center py-8">
                    <div class="loader"></div>
                </div>
            `;

    try {
        const response = await fetchWithAuth(`/api/cliente/pedidos/${idPedido}`);

        if (!response.ok) throw new Error('Error al cargar detalle');

        const detalle = await response.json();
        renderizarDetallePedido(detalle);

    } catch (error) {
        console.error('Error:', error);
        productosContainer.innerHTML = `
                    <div class="text-center py-8 text-red-500">
                        <i class="fas fa-exclamation-circle text-3xl mb-2"></i>
                        <p>Error al cargar detalle</p>
                    </div>
                `;
    }
}

// ==========================================
// 5. RENDERIZAR DETALLE EN MODAL
// ==========================================
function renderizarDetallePedido(detalle) {
    if (!detalle || detalle.length === 0) return;

    const pedido = detalle.pedido; // Información general en primera fila
    const productos = detalle.productos;
    
    // Configuración visual según estado
    const config = getEstadoConfig(pedido.ESTADO);

    // Actualizar header
    document.getElementById('modal-id').textContent = pedido.ID_PEDIDO.toString().padStart(3, '0');
    document.getElementById('modal-fecha').textContent = formatearFecha(pedido.FECHA_HORA);

    // Actualizar estado
    const estadoBadge = document.getElementById('modal-estado');
    estadoBadge.textContent = pedido.ESTADO.toUpperCase();
    estadoBadge.className = `status-badge px-4 py-2 rounded-full text-sm font-bold ${config.bg} ${config.color} border border-current border-opacity-30`;

    // Actualizar progress bar
    document.getElementById('progress-bar').style.width = `${config.progress}%`;

    // Renderizar productos
    const productosHTML = productos.map(item => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <span class="font-bold text-brand-red text-sm">${item.CANTIDAD}x</span>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800 text-sm">${item.PRODUCTO}</p>
                            <p class="text-xs text-gray-500">S/ ${formatearMoneda(item.PRECIO_UNITARIO)} c/u</p>
                        </div>
                    </div>
                    <span class="font-bold text-gray-800">S/ ${formatearMoneda(item.CANTIDAD * item.PRECIO_UNITARIO)}</span>
                </div>
            `).join('');

    document.getElementById('modal-productos').innerHTML = productosHTML;

    // Calcular y mostrar totales
    const subtotal = productos.reduce((sum, item) => sum + (item.CANTIDAD * item.PRECIO_UNITARIO), 0);
    const delivery = pedido.TOTAL - subtotal;

    document.getElementById('modal-subtotal').textContent = `S/ ${formatearMoneda(subtotal)}`;
    document.getElementById('modal-delivery').textContent = delivery > 0 ? `S/ ${formatearMoneda(delivery)}` : 'Gratis';
    document.getElementById('modal-total').textContent = `S/ ${formatearMoneda(pedido.TOTAL)}`;
}

// ==========================================
// 6. FORMATEAR FECHA
// ==========================================
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    const opciones = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return fecha.toLocaleDateString('es-ES', opciones).replace(',', ' -');
}

// ==========================================
// 7. FORMATEAR MONEDA
// ==========================================
function formatearMoneda(monto) {
    return parseFloat(monto).toFixed(2);
}

// ==========================================
// 8. FILTRAR PEDIDOS
// ==========================================
function filtrarPedidos(filtro) {
    state.filtroActual = filtro;

    // Actualizar botones
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        if (btn.dataset.filtro === filtro) {
            btn.classList.add('bg-brand-red', 'text-white', 'shadow-md', 'shadow-red-200');
            btn.classList.remove('bg-white', 'text-gray-600', 'border', 'border-gray-200');
        } else {
            btn.classList.remove('bg-brand-red', 'text-white', 'shadow-md', 'shadow-red-200');
            btn.classList.add('bg-white', 'text-gray-600', 'border', 'border-gray-200');
        }
    });

    renderizarPedidos(state.pedidos);
}

// ==========================================
// 9. CERRAR MODAL
// ==========================================
function cerrarModal() {
    document.getElementById('modal-detalle').classList.add('hidden');
}

// ==========================================
// 10. MOSTRAR TOAST
// ==========================================
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const config = {
        success: { bg: 'bg-emerald-600', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-600', icon: 'fa-exclamation-circle' },
        info: { bg: 'bg-blue-600', icon: 'fa-info-circle' }
    };

    toast.className = `${config[tipo].bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
                <i class="fas ${config[tipo].icon} text-xl"></i>
                <span class="font-medium">${mensaje}</span>
            `;

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.remove('translate-x-full'), 10);

    // Auto-eliminar
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// EXPONER FUNCIONES GLOBALES
// ==========================================
window.cargarPedidos = cargarPedidos;
window.renderizarPedidos = renderizarPedidos;
window.abrirDetallePedido = abrirDetallePedido;
window.renderizarDetallePedido = renderizarDetallePedido;
window.filtrarPedidos = filtrarPedidos;
window.cerrarModal = cerrarModal;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
});
