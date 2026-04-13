import { fetchWithAuth, protectRoute } from './authGuard.js';

//Protejemos Ruta
protectRoute('cajero');

// ==========================================
// ESTADO GLOBAL
// ==========================================
const state = {
    pagosPendientes: [],
    pagosRealizados: [],
    pagoSeleccionado: null,
    filtroMetodo: 'todos',
    tabActual: 'pendientes'
};

// ==========================================
// 1. CARGAR PAGOS PENDIENTES (EFECTIVO)
// ==========================================
async function cargarPagosPendientes() {
    const container = document.getElementById('lista-pendientes');
    mostrarLoader(container, 'Cargando pagos pendientes...');

    try {
        const response = await fetchWithAuth('/api/cajero/pagos/pendientes/efectivo');

        if (!response.ok) throw new Error('Error al cargar pagos pendientes');

        const pagos = await response.json();
        state.pagosPendientes = pagos;

        renderizarPagosPendientes(pagos);
        actualizarResumenPendientes(pagos);

    } catch (error) {
        console.error('Error:', error);
        mostrarError(container, 'Error al cargar pagos pendientes');
        mostrarToast('Error de conexión', 'error');
    }
}

// ==========================================
// 2. RENDERIZAR PAGOS PENDIENTES
// ==========================================
function renderizarPagosPendientes(pagos) {
    const container = document.getElementById('lista-pendientes');

    if (pagos.length === 0) {
        container.innerHTML = `
                    <div class="p-12 text-center text-gray-400">
                        <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                            <i class="fas fa-check-double text-emerald-500 text-3xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-600 mb-1">¡Todo al día!</h3>
                        <p>No hay pagos pendientes en efectivo</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = pagos.map((pago, index) => `
                <div class="pago-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in" style="animation-delay: ${index * 0.05}s">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span class="font-display text-2xl text-amber-700">#${pago.ID_PEDIDO}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">EFECTIVO</span>
                                <span class="text-xs text-gray-400">ID Pago: ${pago.ID_PAGO}</span>
                            </div>
                            <p class="text-3xl font-display text-gray-800 display-monto">
                                S/ ${formatearMonto(pago.MONTO_TOTAL)}
                            </p>
                        </div>
                    </div>
                    
                    <button onclick="abrirModalPago(${pago.ID_PAGO})" 
                            class="group bg-cajero-green hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 min-w-[160px]">
                        <span>Cobrar</span>
                        <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            `).join('');
}

// ==========================================
// 3. CARGAR PAGOS REALIZADOS (HISTORIAL)
// ==========================================
async function cargarPagosRealizados() {
    try {
        const response = await fetchWithAuth('/api/cajero/pagos/realizados');

        if (!response.ok) throw new Error('Error al cargar historial');

        const pagos = await response.json();
        state.pagosRealizados = pagos;

        renderizarPagosRealizados(pagos);

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar historial', 'error');
    }
}

// ==========================================
// 4. RENDERIZAR PAGOS REALIZADOS
// ==========================================
function renderizarPagosRealizados(pagos) {
    const tbody = document.getElementById('tabla-realizados');
    const empty = document.getElementById('empty-realizados');

    // Aplicar filtros
    let filtrados = pagos;
    if (state.filtroMetodo !== 'todos') {
        filtrados = pagos.filter(p => p.METODO_PAGO === state.filtroMetodo);
    }

    if (filtrados.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    tbody.innerHTML = filtrados.map(pago => {
        const fecha = new Date(pago.FECHA_PAGO).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const iconoMetodo = {
            'Efectivo': 'fa-money-bill-wave text-green-600 bg-green-100',
            'Tarjeta': 'fa-credit-card text-blue-600 bg-blue-100',
            'Billetera': 'fa-wallet text-purple-600 bg-purple-100'
        };

        return `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-mono font-bold text-gray-700">#${pago.NUMERO_PAGO}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-bold text-gray-800">#${pago.ID_PEDIDO}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg ${iconoMetodo[pago.METODO_PAGO]?.split(' ').slice(2).join(' ') || 'bg-gray-100'} flex items-center justify-center">
                                    <i class="fas ${iconoMetodo[pago.METODO_PAGO]?.split(' ')[0] || 'fa-receipt'} text-sm"></i>
                                </div>
                                <span class="text-sm font-medium text-gray-700">${pago.METODO_PAGO}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="text-lg font-bold text-gray-800 display-monto">
                                S/ ${formatearMonto(pago.MONTO_TOTAL)}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${fecha}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                <i class="fas fa-check mr-1"></i>Completado
                            </span>
                        </td>
                    </tr>
                `;
    }).join('');
}

// ==========================================
// 5. ABRIR MODAL DE PAGO
// ==========================================
function abrirModalPago(idPago) {
    const pago = state.pagosPendientes.find(p => p.ID_PAGO === idPago);
    if (!pago) return;

    state.pagoSeleccionado = pago;

    // Resetear modal
    document.getElementById('modal-total').textContent = `S/ ${formatearMonto(pago.MONTO_TOTAL)}`;
    document.getElementById('modal-pedido-id').textContent = pago.ID_PEDIDO.toString().padStart(3, '0');
    document.getElementById('input-recibido').value = '';
    document.getElementById('monto-vuelto').textContent = 'S/ 0.00';
    document.getElementById('monto-vuelto').className = 'text-3xl font-display text-gray-400 display-monto';
    document.getElementById('container-vuelto').className = 'p-4 rounded-2xl border-2 transition-all duration-300 bg-gray-50 border-gray-200';
    document.getElementById('mensaje-error').classList.add('hidden');

    // Deshabilitar botón confirmar
    const btnConfirmar = document.getElementById('btn-confirmar');
    btnConfirmar.disabled = true;
    btnConfirmar.className = 'w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 cursor-not-allowed';

    // Mostrar modal
    document.getElementById('modal-cobro').classList.remove('hidden');

    // Focus en input
    setTimeout(() => document.getElementById('input-recibido').focus(), 100);
}

// ==========================================
// 6. CALCULAR VUELTO EN TIEMPO REAL
// ==========================================
function calcularVuelto() {
    if (!state.pagoSeleccionado) return;

    const inputRecibido = document.getElementById('input-recibido');
    const montoTotal = state.pagoSeleccionado.MONTO_TOTAL;
    const montoRecibido = parseFloat(inputRecibido.value) || 0;
    const vuelto = montoRecibido - montoTotal;

    const containerVuelto = document.getElementById('container-vuelto');
    const montoVuelto = document.getElementById('monto-vuelto');
    const mensajeError = document.getElementById('mensaje-error');
    const btnConfirmar = document.getElementById('btn-confirmar');

    if (montoRecibido <= 0) {
        // Estado inicial
        montoVuelto.textContent = 'S/ 0.00';
        montoVuelto.className = 'text-3xl font-display text-gray-400 display-monto';
        containerVuelto.className = 'p-4 rounded-2xl border-2 transition-all duration-300 bg-gray-50 border-gray-200';
        mensajeError.classList.add('hidden');
        deshabilitarBoton(btnConfirmar);
        return;
    }

    if (vuelto < 0) {
        // Monto insuficiente
        const faltante = Math.abs(vuelto);
        montoVuelto.textContent = `Faltan S/ ${formatearMonto(faltante)}`;
        montoVuelto.className = 'text-2xl font-display text-danger display-monto';
        containerVuelto.className = 'p-4 rounded-2xl border-2 transition-all duration-300 bg-red-50 border-red-200 animate-shake';
        mensajeError.classList.remove('hidden');
        deshabilitarBoton(btnConfirmar);
    } else {
        // Vuelto correcto
        montoVuelto.textContent = `S/ ${formatearMonto(vuelto)}`;
        montoVuelto.className = 'text-3xl font-display text-emerald-600 display-monto';
        containerVuelto.className = 'p-4 rounded-2xl border-2 transition-all duration-300 bg-emerald-50 border-emerald-300';
        mensajeError.classList.add('hidden');
        habilitarBoton(btnConfirmar);
    }
}

function deshabilitarBoton(btn) {
    btn.disabled = true;
    btn.className = 'w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 cursor-not-allowed';
}

function habilitarBoton(btn) {
    btn.disabled = false;
    btn.className = 'w-full py-4 bg-cajero-green hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200';
}

// ==========================================
// 7. CONFIRMAR PAGO
// ==========================================
async function confirmarPago() {
    if (!state.pagoSeleccionado) return;

    const btnConfirmar = document.getElementById('btn-confirmar');
    const textoOriginal = btnConfirmar.innerHTML;

    // Loading state
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<div class="loader border-white border-t-transparent w-5 h-5 mr-2"></div> Procesando...';

    try {
        const response = await fetchWithAuth(`/api/cajero/pagos/${state.pagoSeleccionado.ID_PAGO}/cobrar`, {
            method: 'PUT'
        });

        if (!response.ok) throw new Error('Error al procesar pago');

        const data = await response.json();

        if (data.success) {
            // Actualizar último cobro en UI
            const ahora = new Date();
            document.getElementById('ultimo-cobro').textContent =
                `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
            document.getElementById('ultimo-monto').textContent =
                `S/ ${formatearMonto(state.pagoSeleccionado.MONTO_TOTAL)}`;

            mostrarToast('¡Pago registrado correctamente!', 'success');
            cerrarModal();

            // Recargar listas
            await cargarPagosPendientes();
            await cargarPagosRealizados();
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al procesar el pago', 'error');
        btnConfirmar.innerHTML = textoOriginal;
        btnConfirmar.disabled = false;
    }
}

// ==========================================
// FUNCIONES AUXILIARES DEL MODAL
// ==========================================
function agregarDigito(digito) {
    const input = document.getElementById('input-recibido');
    const currentValue = input.value;

    if (digito === '.' && currentValue.includes('.')) return;
    if (currentValue.replace('.', '').length >= 8) return;

    input.value = currentValue + digito;
    calcularVuelto();
}

function limpiarInput() {
    document.getElementById('input-recibido').value = '';
    calcularVuelto();
}

function usarMontoExacto() {
    if (!state.pagoSeleccionado) return;
    document.getElementById('input-recibido').value = state.pagoSeleccionado.MONTO_TOTAL;
    calcularVuelto();
}

function cerrarModal() {
    document.getElementById('modal-cobro').classList.add('hidden');
    state.pagoSeleccionado = null;
}

// ==========================================
// FUNCIONES DE UI/UX
// ==========================================
function cambiarTab(tab) {
    state.tabActual = tab;

    const vistaPendientes = document.getElementById('vista-pendientes');
    const vistaRealizados = document.getElementById('vista-realizados');
    const btnPendientes = document.getElementById('tab-pendientes');
    const btnRealizados = document.getElementById('tab-realizados');

    if (tab === 'pendientes') {
        vistaPendientes.classList.remove('hidden');
        vistaRealizados.classList.add('hidden');
        btnPendientes.className = 'px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 bg-cajero-green text-white shadow-md';
        btnRealizados.className = 'px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 text-gray-600 hover:bg-gray-50';
        cargarPagosPendientes();
    } else {
        vistaPendientes.classList.add('hidden');
        vistaRealizados.classList.remove('hidden');
        btnRealizados.className = 'px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 bg-cajero-green text-white shadow-md';
        btnPendientes.className = 'px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 text-gray-600 hover:bg-gray-50';
        cargarPagosRealizados();
    }
}

function filtrarPorMetodo(metodo) {
    state.filtroMetodo = metodo;

    document.querySelectorAll('.filtro-metodo').forEach(btn => {
        if (btn.dataset.metodo === metodo) {
            btn.classList.add('bg-cajero-green', 'text-white');
            btn.classList.remove('bg-gray-100', 'text-gray-700');
        } else {
            btn.classList.remove('bg-cajero-green', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        }
    });

    renderizarPagosRealizados(state.pagosRealizados);
}

function filtrarPagosRealizados(busqueda) {
    const termino = busqueda.toLowerCase();
    const filtrados = state.pagosRealizados.filter(p =>
        p.ID_PEDIDO.toString().includes(termino) ||
        p.NUMERO_PAGO.toString().includes(termino)
    );
    renderizarPagosRealizados(filtrados);
}

function actualizarResumenPendientes(pagos) {
    const total = pagos.reduce((sum, p) => sum + p.MONTO_TOTAL, 0);

    document.getElementById('total-pendientes').textContent = pagos.length;
    document.getElementById('monto-total-pendiente').textContent = `S/ ${formatearMonto(total)}`;

    // Actualizar badge
    const badge = document.getElementById('badge-pendientes');
    badge.textContent = pagos.length;
    badge.classList.toggle('hidden', pagos.length === 0);
}

function formatearMonto(monto) {
    return parseFloat(monto).toFixed(2);
}

function mostrarLoader(container, mensaje) {
    container.innerHTML = `
                <div class="p-12 text-center text-gray-400">
                    <div class="loader mx-auto mb-4"></div>
                    <p>${mensaje}</p>
                </div>
            `;
}

function mostrarError(container, mensaje) {
    container.innerHTML = `
                <div class="p-12 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                    <p>${mensaje}</p>
                    <button onclick="cargarPagosPendientes()" class="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
}

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const config = {
        success: { bg: 'bg-emerald-600', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-600', icon: 'fa-exclamation-circle' },
        warning: { bg: 'bg-amber-600', icon: 'fa-exclamation-triangle' }
    };

    toast.className = `toast ${config[tipo].bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`;
    toast.innerHTML = `
                <i class="fas ${config[tipo].icon} text-xl"></i>
                <span class="font-medium">${mensaje}</span>
            `;

    container.appendChild(toast);
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
window.cargarPagosPendientes = cargarPagosPendientes;
window.cargarPagosRealizados = cargarPagosRealizados;
window.abrirModalPago = abrirModalPago;
window.calcularVuelto = calcularVuelto;
window.confirmarPago = confirmarPago;
window.agregarDigito = agregarDigito;
window.limpiarInput = limpiarInput;
window.usarMontoExacto = usarMontoExacto;
window.cerrarModal = cerrarModal;
window.cambiarTab = cambiarTab;
window.filtrarPorMetodo = filtrarPorMetodo;
window.filtrarPagosRealizados = filtrarPagosRealizados;
window.logout = logout;

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    cargarPagosPendientes();

    // Auto-refresh cada 30 segundos si está en pestaña de pendientes
    setInterval(() => {
        if (state.tabActual === 'pendientes' && !document.getElementById('modal-cobro').classList.contains('hidden') === false) {
            cargarPagosPendientes();
        }
    }, 30000);

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
});
