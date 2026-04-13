
// ==========================================
// IMPORTACIÓN DE AUTH (adaptar según tu estructura)
// ==========================================
import { fetchWithAuth } from './authGuard.js';

// ==========================================
// ESTADO GLOBAL
// ==========================================
const state = {
    pedidos: [],
    mesas: [],
    vistaActual: 'pedidos',
    filtroActual: 'todos'
};

// ==========================================
// 1. CARGAR PEDIDOS LISTOS
// ==========================================
async function cargarPedidos() {
    const container = document.getElementById('container-pedidos');
    mostrarLoader(container, 'Cargando pedidos...');

    try {
        const response = await fetchWithAuth('/api/mozo/listos');

        if (!response.ok) throw new Error('Error al cargar pedidos');

        const pedidos = await response.json();
        state.pedidos = pedidos;

        actualizarStats(pedidos);
        renderizarPedidos(pedidos);

    } catch (error) {
        console.error('Error cargando pedidos:', error);
        mostrarError(container, 'Error al cargar pedidos. Intenta nuevamente.');
        mostrarToast('Error al cargar pedidos', 'error');
    }
}

// ==========================================
// 2. RENDERIZAR PEDIDOS
// ==========================================
function renderizarPedidos(pedidos) {
    const container = document.getElementById('container-pedidos');

    // Aplicar filtro
    let pedidosFiltrados = pedidos;
    if (state.filtroActual !== 'todos') {
        pedidosFiltrados = pedidos.filter(p =>
            p.TIPO_ENTREGA.toLowerCase() === state.filtroActual
        );
    }

    if (pedidosFiltrados.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <i class="fas fa-inbox text-4xl mb-3 opacity-30"></i>
                        <p>No hay pedidos ${state.filtroActual !== 'todos' ? 'de este tipo' : 'listos'}</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = pedidosFiltrados.map(pedido => crearCardPedido(pedido)).join('');
}

function crearCardPedido(pedido) {
    const tipoClass = pedido.TIPO_ENTREGA.toLowerCase();
    const hora = new Date(pedido.FECHA_HORA).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determinar botón de acción según tipo y estado
    let botonAccion = '';

    if (pedido.ID_ESTADO === 3) { // Listo
        if (pedido.ID_TIPO_ENTREGA === 2) { // Delivery
            botonAccion = `
                        <button onclick="procesarPedido(${pedido.ID_PEDIDO}, ${pedido.ID_TIPO_ENTREGA})" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                            <i class="fas fa-motorcycle"></i>
                            Enviar Delivery
                        </button>
                    `;
        } else {
            // Local o Recojo
            botonAccion = `
                        <button onclick="procesarPedido(${pedido.ID_PEDIDO}, ${pedido.ID_TIPO_ENTREGA})" 
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                            <i class="fas fa-check"></i>
                            Entregar
                        </button>
                    `;
        }
    } else if (pedido.ID_ESTADO === 5) { // En camino (solo delivery)
        botonAccion = `
                    <button onclick="confirmarEntrega(${pedido.ID_PEDIDO})" 
                            class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors animate-pulse-soft">
                        <i class="fas fa-check-double"></i>
                        Confirmar Entrega
                    </button>
                `;
    }

    // Icono según tipo
    const iconoTipo = {
        'Local': 'fa-utensils',
        'Delivery': 'fa-motorcycle',
        'Recojo': 'fa-store'
    };

    const colorTipo = {
        'Local': 'text-green-600 bg-green-50',
        'Delivery': 'text-blue-600 bg-blue-50',
        'Recojo': 'text-amber-600 bg-amber-50'
    };

    return `
                <div class="pedido-card ${tipoClass} bg-white rounded-xl p-5 shadow-sm border border-gray-200 animate-slide-in">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        <!-- Info Principal -->
                        <div class="flex items-start gap-4">
                            <div class="w-14 h-14 rounded-xl ${colorTipo[pedido.TIPO_ENTREGA]} flex items-center justify-center flex-shrink-0">
                                <i class="fas ${iconoTipo[pedido.TIPO_ENTREGA]} text-2xl"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="font-display text-2xl text-gray-800">PEDIDO #${pedido.ID_PEDIDO}</h3>
                                    <span class="px-2 py-1 rounded-full text-xs font-bold ${colorTipo[pedido.TIPO_ENTREGA]} border border-current opacity-60">
                                        ${pedido.TIPO_ENTREGA.toUpperCase()}
                                    </span>
                                </div>
                                <div class="flex items-center gap-4 text-sm text-gray-500">
                                    <span class="flex items-center gap-1">
                                        <i class="far fa-clock"></i>
                                        ${hora}
                                    </span>
                                    ${pedido.NUMERO_MESA ? `
                                        <span class="flex items-center gap-1 text-green-600 font-medium">
                                            <i class="fas fa-chair"></i>
                                            Mesa ${pedido.NUMERO_MESA}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div class="flex items-center gap-3 min-w-[200px]">
                            ${botonAccion}
                        </div>
                    </div>
                </div>
            `;
}

// ==========================================
// 3. PROCESAR PEDIDO
// ==========================================
async function procesarPedido(idPedido, tipoEntrega) {
    const btn = event.currentTarget;
    const textoOriginal = btn.innerHTML;

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<div class="loader border-white border-t-transparent w-5 h-5 mr-2"></div> Procesando...';

    try {
        const response = await fetchWithAuth(`/api/mozo/${idPedido}/procesar`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error('Error al procesar pedido');

        const data = await response.json();

        if (data.success) {
            const mensaje = tipoEntrega === 2 ? 'Pedido en camino' : 'Pedido entregado';
            mostrarToast(mensaje, 'success');
            await cargarPedidos(); // Recargar lista
        }

    } catch (error) {
        console.error('Error procesando pedido:', error);
        mostrarToast('Error al procesar pedido', 'error');
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

// ==========================================
// 4. CONFIRMAR ENTREGA (Delivery)
// ==========================================
async function confirmarEntrega(idPedido) {
    const btn = event.currentTarget;
    const textoOriginal = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<div class="loader border-white border-t-transparent w-5 h-5 mr-2"></div> Confirmando...';

    try {
        const response = await fetchWithAuth(`/api/mozo/${idPedido}/entregado`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error('Error al confirmar entrega');

        const data = await response.json();

        if (data.success) {
            mostrarToast('Entrega confirmada correctamente', 'success');
            await cargarPedidos();
        }

    } catch (error) {
        console.error('Error confirmando entrega:', error);
        mostrarToast('Error al confirmar entrega', 'error');
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

// ==========================================
// 5. CARGAR MESAS
// ==========================================
async function cargarMesas() {
    const container = document.getElementById('grid-mesas');
    mostrarLoader(container, 'Cargando mesas...');

    try {
        const response = await fetchWithAuth('/api/mozo/mesas');

        if (!response.ok) throw new Error('Error al cargar mesas');

        const mesas = await response.json();
        state.mesas = mesas;

        renderizarMesas(mesas);

    } catch (error) {
        console.error('Error cargando mesas:', error);
        mostrarError(container, 'Error al cargar mesas');
        mostrarToast('Error al cargar mesas', 'error');
    }
}

// ==========================================
// 6. RENDERIZAR MESAS
// ==========================================
function renderizarMesas(mesas) {
    const container = document.getElementById('grid-mesas');

    container.innerHTML = mesas.map(mesa => {
        const estaDisponible = mesa.ESTADO === 'Disponible';
        const numeroFormateado = mesa.NUMERO.toString().padStart(2, '0');

        return `
                    <div class="bg-white rounded-xl p-5 shadow-sm border-2 ${estaDisponible ? 'border-green-200' : 'border-red-200'} transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-full ${estaDisponible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center font-display text-xl">
                                ${numeroFormateado}
                            </div>
                            <div class="toggle-switch ${estaDisponible ? 'active' : ''}" 
                                 onclick="toggleMesa(${mesa.ID_MESA}, ${mesa.ID_ESTADO})"
                                 id="toggle-mesa-${mesa.ID_MESA}">
                            </div>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">Mesa ${mesa.NUMERO}</h3>
                            <p class="text-sm ${estaDisponible ? 'text-green-600' : 'text-red-600'} font-medium">
                                ${estaDisponible ? 'Disponible' : 'Ocupado'}
                            </p>
                        </div>
                    </div>
                `;
    }).join('');
}

// ==========================================
// 7. TOGGLE MESA (Cambio optimista)
// ==========================================
async function toggleMesa(idMesa, estadoActual) {
    const toggle = document.getElementById(`toggle-mesa-${idMesa}`);
    const nuevoEstado = estadoActual === 1 ? 2 : 1; // 1=Disponible, 2=Ocupado

    // Cambio optimista: actualizar UI inmediatamente
    toggle.classList.toggle('active');

    // Actualizar texto localmente
    const card = toggle.closest('.bg-white');
    const estadoTexto = card.querySelector('p');
    const numeroCircle = card.querySelector('.rounded-full');

    if (nuevoEstado === 1) { // Disponible
        estadoTexto.textContent = 'Disponible';
        estadoTexto.className = 'text-sm text-green-600 font-medium';
        numeroCircle.className = 'w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-display text-xl';
        card.classList.remove('border-red-200');
        card.classList.add('border-green-200');
    } else { // Ocupado
        estadoTexto.textContent = 'Ocupado';
        estadoTexto.className = 'text-sm text-red-600 font-medium';
        numeroCircle.className = 'w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-display text-xl';
        card.classList.remove('border-green-200');
        card.classList.add('border-red-200');
    }

    try {
        const response = await fetchWithAuth(`/api/mozo/mesas/${idMesa}/toggle`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) throw new Error('Error al actualizar mesa');

        const data = await response.json();

        if (data.success) {
            mostrarToast(`Mesa ${nuevoEstado === 1 ? 'activada' : 'desactivada'}`, 'success');
            // Actualizar cache local
            const mesa = state.mesas.find(m => m.ID_MESA === idMesa);
            if (mesa) {
                mesa.ID_ESTADO = nuevoEstado;
                mesa.ESTADO = nuevoEstado === 1 ? 'Disponible' : 'Ocupado';
            }
        } else {
            throw new Error('Respuesta no exitosa');
        }

    } catch (error) {
        console.error('Error toggle mesa:', error);
        // Revertir cambios optimistas
        toggle.classList.toggle('active');
        mostrarToast('Error al actualizar mesa', 'error');
        // Recargar para sincronizar
        cargarMesas();
    }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function actualizarStats(pedidos) {
    const listos = pedidos.filter(p => p.ID_ESTADO === 3).length;
    const camino = pedidos.filter(p => p.ID_ESTADO === 5).length;
    const local = pedidos.filter(p => p.ID_TIPO_ENTREGA === 1).length;
    const delivery = pedidos.filter(p => p.ID_TIPO_ENTREGA === 2).length;

    document.getElementById('stat-listos').textContent = listos;
    document.getElementById('stat-camino').textContent = camino;
    document.getElementById('stat-local').textContent = local;
    document.getElementById('stat-delivery').textContent = delivery;
}

function filtrarPedidos(filtro) {
    state.filtroActual = filtro;

    // Actualizar botones
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        if (btn.dataset.filtro === filtro) {
            btn.classList.add('bg-mozo-blue', 'text-white');
            btn.classList.remove('bg-gray-100', 'text-gray-700');
        } else {
            btn.classList.remove('bg-mozo-blue', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        }
    });

    renderizarPedidos(state.pedidos);
}

function cambiarVista(vista) {
    state.vistaActual = vista;

    const vistaPedidos = document.getElementById('vista-pedidos');
    const vistaMesas = document.getElementById('vista-mesas');
    const btnPedidos = document.getElementById('btn-vista-pedidos');
    const btnMesas = document.getElementById('btn-vista-mesas');

    if (vista === 'pedidos') {
        vistaPedidos.classList.remove('hidden');
        vistaMesas.classList.add('hidden');
        btnPedidos.classList.add('bg-mozo-blue');
        btnPedidos.classList.remove('bg-gray-700');
        btnMesas.classList.remove('bg-mozo-blue');
        btnMesas.classList.add('bg-gray-700');
        cargarPedidos();
    } else {
        vistaPedidos.classList.add('hidden');
        vistaMesas.classList.remove('hidden');
        btnMesas.classList.add('bg-mozo-blue');
        btnMesas.classList.remove('bg-gray-700');
        btnPedidos.classList.remove('bg-mozo-blue');
        btnPedidos.classList.add('bg-gray-700');
        cargarMesas();
    }
}

function mostrarLoader(container, mensaje) {
    container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="loader mx-auto mb-4"></div>
                    <p>${mensaje}</p>
                </div>
            `;
}

function mostrarError(container, mensaje) {
    container.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                    <p>${mensaje}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
}

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const config = {
        success: { bg: 'bg-green-600', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-600', icon: 'fa-exclamation-circle' },
        warning: { bg: 'bg-amber-600', icon: 'fa-exclamation-triangle' },
        info: { bg: 'bg-blue-600', icon: 'fa-info-circle' }
    };

    toast.className = `toast ${config[tipo].bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`;
    toast.innerHTML = `
                <i class="fas ${config[tipo].icon} text-xl"></i>
                <span class="font-medium">${mensaje}</span>
            `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'login.html';
}

// ==========================================
// EXPONER FUNCIONES GLOBALES
// ==========================================
window.procesarPedido = procesarPedido;
window.confirmarEntrega = confirmarEntrega;
window.toggleMesa = toggleMesa;
window.filtrarPedidos = filtrarPedidos;
window.cambiarVista = cambiarVista;
window.cargarPedidos = cargarPedidos;
window.logout = logout;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();

    // Auto-refresh cada 30 segundos
    setInterval(() => {
        if (state.vistaActual === 'pedidos') {
            cargarPedidos();
        }
    }, 30000);
});
