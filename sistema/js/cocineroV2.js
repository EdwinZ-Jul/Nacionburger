
// Importar fetchWithAuth (asumiendo que está en authGuard.js)
import { fetchWithAuth, protectRoute} from './authGuard.js';

protectRoute('cocinero'); // Asegura que solo los cocineros puedan acceder a esta página

// Estado global
let pedidoSeleccionado = null;
let productosCache = [];
let vistaActual = 'pedidos';

// Referencias DOM
const btnLogout = document.getElementById("btnLogout");
const btnRefresh = document.getElementById("btnRefresh");
const listPendiente = document.getElementById("list-pendiente");
const listPreparacion = document.getElementById("list-en_preparacion");
const listListo = document.getElementById("list-listo");

// Modal
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalPedidoId = document.getElementById("modalPedidoId");
const modalPedidoEstado = document.getElementById("modalPedidoEstado");
const modalPedidoFecha = document.getElementById("modalPedidoFecha");
const modalPedidoOrigen = document.getElementById("modalPedidoOrigen");
const modalItems = document.getElementById("modalItems");
const modalActions = document.getElementById("modalActions");
const modalNotas = document.getElementById("modalNotas");
const modalNotasTexto = document.getElementById("modalNotasTexto");

// Event Listeners principales
btnLogout.addEventListener("click", () => {
    alert("Deseas cerrar sesión?");
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "pedido.html";
});

btnRefresh.addEventListener("click", () => {
    if (vistaActual === 'pedidos') {
        cargarPedidos();
        showToast('Pedidos actualizados', 'success');
    } else {
        cargarProductos();
        showToast('Productos actualizados', 'success');
    }
});

modalClose.addEventListener("click", cerrarModal);
modalBackdrop.addEventListener("click", cerrarModal);

// Toggle entre vistas
window.toggleVista = function (vista) {
    vistaActual = vista;

    const vistaPedidos = document.getElementById('vista-pedidos');
    const vistaProductos = document.getElementById('vista-productos');
    const btnPedidos = document.getElementById('btn-vista-pedidos');
    const btnProductos = document.getElementById('btn-vista-productos');

    if (vista === 'pedidos') {
        vistaPedidos.classList.remove('section-hidden');
        vistaProductos.classList.add('section-hidden');
        btnPedidos.classList.add('bg-burger-red', 'text-white');
        btnPedidos.classList.remove('bg-gray-800', 'text-gray-300');
        btnProductos.classList.remove('bg-burger-red', 'text-white');
        btnProductos.classList.add('bg-gray-800', 'text-gray-300');
        cargarPedidos();
    } else {
        vistaPedidos.classList.add('section-hidden');
        vistaProductos.classList.remove('section-hidden');
        btnProductos.classList.add('bg-burger-red', 'text-white');
        btnProductos.classList.remove('bg-gray-800', 'text-gray-300');
        btnPedidos.classList.remove('bg-burger-red', 'text-white');
        btnPedidos.classList.add('bg-gray-800', 'text-gray-300');
        cargarProductos();
    }
};

// ==========================================
// FUNCIONES DE PEDIDOS (Tu código adaptado)
// ==========================================

async function cargarPedidos() {
    try {
        // Loading state
        [listPendiente, listPreparacion, listListo].forEach(list => {
            list.innerHTML = '<div class="flex justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burger-red"></div></div>';
        });

        const [pendRes, prepRes, listRes] = await Promise.all([
            fetchWithAuth("/api/cocinero/pendientes"),
            fetchWithAuth("/api/cocinero/en-preparacion"),
            fetchWithAuth("/api/cocinero/listos"),
        ]);

        const pendientes = await pendRes.json();
        const enPreparacion = await prepRes.json();
        const listos = await listRes.json();

        // Actualizar contadores
        document.getElementById('count-pendientes').textContent = pendientes.length;
        document.getElementById('count-preparacion').textContent = enPreparacion.length;
        document.getElementById('count-listos').textContent = listos.length;

        document.getElementById('label-pendientes').textContent = `${pendientes.length} pedidos`;
        document.getElementById('label-preparacion').textContent = `${enPreparacion.length} pedidos`;
        document.getElementById('label-listos').textContent = `${listos.length} pedidos`;

        // Renderizar listas
        listPendiente.innerHTML = pendientes.length ? '' : '<div class="text-center py-8 text-gray-500"><i class="fas fa-inbox text-4xl mb-2 opacity-30"></i><p class="text-sm">No hay pedidos pendientes</p></div>';
        listPreparacion.innerHTML = enPreparacion.length ? '' : '<div class="text-center py-8 text-gray-500"><i class="fas fa-fire text-4xl mb-2 opacity-30"></i><p class="text-sm">No hay pedidos en preparación</p></div>';
        listListo.innerHTML = listos.length ? '' : '<div class="text-center py-8 text-gray-500"><i class="fas fa-check-double text-4xl mb-2 opacity-30"></i><p class="text-sm">No hay pedidos listos</p></div>';

        pendientes.forEach(p => renderCard(p, listPendiente, 'pendiente'));
        enPreparacion.forEach(p => renderCard(p, listPreparacion, 'preparacion'));
        listos.forEach(p => renderCard(p, listListo, 'listo'));

    } catch (err) {
        console.error("Error cargando pedidos:", err);
        showToast('Error al cargar pedidos', 'error');
    }
}

function renderCard(pedido, container, tipo) {
    const card = document.createElement("div");
    card.className = `pedido-card ${tipo} bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600`;

    const hora = new Date(pedido.FECHA_HORA).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.FECHA_HORA);

    let icono = tipo === 'pendiente' ? 'fa-clock text-yellow-500' :
        tipo === 'preparacion' ? 'fa-fire text-blue-400' : 'fa-check text-green-400';

    let badgeColor = tipo === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
        tipo === 'preparacion' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400';

    card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="font-display text-xl text-white">#${pedido.ID_PEDIDO}</span>
                    <span class="text-xs ${badgeColor} px-2 py-1 rounded-full font-bold">${hora}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <i class="fas ${pedido.NUMERO_MESA ? 'fa-utensils' : 'fa-motorcycle'}"></i>
                    <span>${pedido.NUMERO_MESA ? `Mesa ${pedido.NUMERO_MESA}` : 'Delivery'}</span>
                </div>
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                    <span class="text-xs text-gray-500 timer">${tiempoTranscurrido}</span>
                    <i class="fas ${icono}"></i>
                </div>
            `;

    card.addEventListener("click", () => abrirModal(pedido.ID_PEDIDO));
    container.appendChild(card);
}

function calcularTiempoTranscurrido(fecha) {
    const diff = Math.floor((new Date() - new Date(fecha)) / 1000 / 60);
    if (diff < 60) return `${diff}m`;
    const horas = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${horas}h ${mins}m`;
}

async function abrirModal(idPedido) {
    try {
        const res = await fetchWithAuth(`/api/cocinero/${idPedido}/detalles`);
        const detalles = await res.json();
        if (!detalles.length) return;

        const pedido = detalles[0];
        pedidoSeleccionado = pedido;

        modalPedidoId.textContent = pedido.ID_PEDIDO;
        modalPedidoEstado.textContent = pedido.ESTADO;
        modalPedidoFecha.textContent = new Date(pedido.FECHA_HORA).toLocaleString('es-ES');
        modalPedidoOrigen.textContent = pedido.NUMERO_MESA ? `Mesa ${pedido.NUMERO_MESA}` : 'Delivery';

        // Color del badge según estado
        const estadoColors = {
            'PENDIENTE': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'EN PREPARACION': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'LISTO': 'bg-green-500/20 text-green-400 border-green-500/30'
        };
        modalPedidoEstado.className = `px-3 py-1 rounded-full text-xs font-bold border ${estadoColors[pedido.ESTADO] || 'bg-gray-500/20 text-gray-400'}`;

        // Items
        modalItems.innerHTML = detalles.map(d => `
                    <div class="flex justify-between items-center bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                                <span class="font-bold text-burger-gold">${d.CANTIDAD}x</span>
                            </div>
                            <div>
                                <p class="font-semibold text-white">${d.NOMBRE_PLATILLO}</p>
                                <p class="text-xs text-gray-400">S/ ${d.PRECIO_UNITARIO} c/u</p>
                            </div>
                        </div>
                        <span class="font-bold text-white">S/ ${(d.PRECIO_UNITARIO * d.CANTIDAD).toFixed(2)}</span>
                    </div>
                `).join("");

        // Notas (si existen)
        if (pedido.NOTAS) {
            modalNotas.classList.remove('hidden');
            modalNotasTexto.textContent = pedido.NOTAS;
        } else {
            modalNotas.classList.add('hidden');
        }

        // Acciones según estado
        modalActions.innerHTML = '';
        if (pedido.ID_ESTADO === 1) {
            crearBotonAccion("Iniciar Preparación", "en-preparacion", "bg-blue-600 hover:bg-blue-700", "fa-fire");
        } else if (pedido.ID_ESTADO === 2) {
            crearBotonAccion("Marcar como Listo", "listo", "bg-green-600 hover:bg-green-700", "fa-check");
        } else {
            modalActions.innerHTML = '<span class="text-gray-500 text-sm italic">Este pedido ya está listo para entregar</span>';
        }

        modal.classList.remove("hidden");
    } catch (err) {
        console.error("Error cargando detalles:", err);
        showToast('Error al cargar detalles', 'error');
    }
}

function crearBotonAccion(texto, nuevoEstado, colorClass, icono) {
    const btn = document.createElement("button");
    btn.className = `${colorClass} text-white px-6 py-3 rounded-lg font-bold flex-1 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]`;
    btn.innerHTML = `<i class="fas ${icono}"></i> ${texto}`;

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Procesando...';

        try {
            await fetchWithAuth(`/api/cocinero/${pedidoSeleccionado.ID_PEDIDO}/${nuevoEstado}`, {
                method: "PUT"
            });

            showToast(`Pedido #${pedidoSeleccionado.ID_PEDIDO} actualizado`, 'success');
            cerrarModal();
            cargarPedidos();
        } catch (err) {
            console.error("Error actualizando estado:", err);
            showToast('Error al actualizar estado', 'error');
            btn.disabled = false;
            btn.innerHTML = `<i class="fas ${icono}"></i> ${texto}`;
        }
    });

    modalActions.appendChild(btn);

    // Botón cancelar
    const btnCancelar = document.createElement("button");
    btnCancelar.className = "px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors";
    btnCancelar.textContent = "Cerrar";
    btnCancelar.onclick = cerrarModal;
    modalActions.appendChild(btnCancelar);
}

function cerrarModal() {
    modal.classList.add("hidden");
    pedidoSeleccionado = null;
}

// ==========================================
// FUNCIONES DE PRODUCTOS (NUEVO)
// ==========================================

async function cargarProductos() {
    const grid = document.getElementById('grid-productos');
    grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-burger-red mb-4"></div><p class="text-gray-500">Cargando productos...</p></div>';

    try {
        /*
        ENDPOINTS QUE NECESITAS CREAR EN TU BACKEND:
        
        1. GET /api/cocinero/productos
           - Retorna todos los platillos con: ID_PLATILLO, NOMBRE, DESCRIPCION, PRECIO, ESTADO (1=activo, 2=desactivado), IMAGEN_URL, CATEGORIA
        
        2. PUT /api/cocinero/productos/:id/toggle
           - Body: { estado: 1 | 2 }
           - Retorna: { success: true, nuevo_estado: 1 | 2 }
           - Cambia el estado del platillo (activo/desactivado)
        */

        // Simulación mientras creas el endpoint:
            const res = await fetchWithAuth("/api/cocinero/productos");
            const productos = await res.json();


        productosCache = productos;
        renderizarProductos(productos);

    } catch (err) {
        console.error("Error cargando productos:", err);
        document.getElementById('grid-productos').innerHTML =
            '<div class="col-span-full text-center py-12 text-red-400"><i class="fas fa-exclamation-triangle text-4xl mb-2"></i><p>Error al cargar productos</p></div>';
    }
}

function renderizarProductos(productos) {
    const grid = document.getElementById('grid-productos');

    if (productos.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-box-open text-4xl mb-2 opacity-30"></i><p>No hay productos para mostrar</p></div>';
        return;
    }

    grid.innerHTML = productos.map(p => {
        const estaActivo = p.ESTADO === 1;
        const imagen = (p.IMAGEN && p.CARPETA)? `/images/${p.CARPETA}/${p.IMAGEN}`:`https://ui-avatars.com/api/?name=${encodeURIComponent(p.NOMBRE_PLATILLO)}&background=D92626&color=fff&size=128`;

        return `
                    <div class="bg-gray-800 rounded-xl border ${estaActivo ? 'border-gray-700' : 'border-red-900/50 opacity-60'} overflow-hidden group hover:border-gray-600 transition-all">
                        <div class="relative h-32 overflow-hidden">
                            <img src="${imagen}" alt="${p.NOMBRE_PLATILLO}" class="w-full h-full object-cover ${estaActivo ? '' : 'grayscale'}">
                            <div class="absolute top-2 right-2">
                                <span class="px-2 py-1 rounded-full text-xs font-bold ${estaActivo ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                                    ${estaActivo ? 'ACTIVO' : 'DESACTIVADO'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="font-bold text-white text-lg leading-tight">${p.NOMBRE_PLATILLO}</h3>
                                    <p class="text-xs text-burger-gold font-semibold">${p.CATEGORIA}</p>
                                </div>
                                <span class="font-display text-xl text-white">S/ ${(p.PRECIO).toFixed(1)}</span>
                            </div>
                            
                            <p class="text-gray-400 text-sm mb-4 line-clamp-2">${p.DESCRIPCION}</p>
                            
                            <div class="flex items-center justify-between pt-3 border-t border-gray-700">
                                <span class="text-xs text-gray-500">Mostrar en menú</span>
                                <div class="toggle-switch ${estaActivo ? 'active' : ''}" 
                                     onclick="toggleProducto(${p.ID_PLATILLO}, ${p.ESTADO})"
                                     id="toggle-${p.ID_PLATILLO}">
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');
}

window.filtrarProductos = function (filtro) {
    let filtrados = productosCache;

    if (filtro === 'activos') {
        filtrados = productosCache.filter(p => p.ESTADO === 1);
    } else if (filtro === 'inactivos') {
        filtrados = productosCache.filter(p => p.ESTADO === 2);
    }

    renderizarProductos(filtrados);
};

window.toggleProducto = async function (id, estadoActual) {
    const nuevoEstado = estadoActual === 1 ? 2 : 1;
    const toggle = document.getElementById(`toggle-${id}`);

    // Optimistic UI
    toggle.classList.toggle('active');

    try {
        
        /*CONSUMO DEL ENDPOINT (descomentar cuando crees el backend):*/
        
        const res = await fetchWithAuth(`/api/cocinero/productos/${id}/toggle`, {
            method: "PUT",
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        const data = await res.json();
        
        if (!data.success) throw new Error('Error al actualizar');
        

        // Simulación (eliminar cuando tengas el endpoint):
        await new Promise(r => setTimeout(r, 500));

        // Actualizar cache
        const producto = productosCache.find(p => p.ID_PLATILLO === id);
        if (producto) producto.ESTADO = nuevoEstado;

        // Re-renderizar para mostrar cambios completos
        renderizarProductos(productosCache);

        showToast(
            nuevoEstado === 1 ? 'Producto activado' : 'Producto desactivado',
            nuevoEstado === 1 ? 'success' : 'warning'
        );

    } catch (err) {
        console.error("Error toggle producto:", err);
        // Revertir UI
        toggle.classList.toggle('active');
        showToast('Error al cambiar estado', 'error');
    }
};

// ==========================================
// UTILIDADES
// ==========================================

function showToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const colors = {
        success: 'bg-green-600 border-green-500',
        error: 'bg-red-600 border-red-500',
        warning: 'bg-yellow-600 border-yellow-500',
        info: 'bg-blue-600 border-blue-500'
    };

    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.className = `${colors[tipo]} border text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in min-w-[300px]`;
    toast.innerHTML = `
                <i class="fas ${iconos[tipo]} text-xl"></i>
                <span class="font-medium">${mensaje}</span>
            `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Inicialización
cargarPedidos();
setInterval(() => {
    if (vistaActual === 'pedidos') cargarPedidos();
}, 10000); // Auto-refresh cada 10 segundos