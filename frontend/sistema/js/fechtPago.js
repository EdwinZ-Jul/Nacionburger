// js/fechtPago.js  — Capa de fetch hacia el backend (NO lógica UI)
import { fetchWithAuth, fetchApi } from './authGuard.js';

// ─── MESAS ────────────────────────────────────────────────────────────────────
export async function getMesasDisponibles() {
  try {
    const res = await fetchApi('/api/mesas');
    return await res.json();
  } catch (error) {
    console.error('Error getMesasDisponibles:', error);
    return [];
  }
}

// ─── PROVINCIAS (desde BD, ya no hardcodeado) ─────────────────────────────────
export async function getProvincias() {
  try {
    const res = await fetchApi('/api/provincias');
    if (!res.ok) throw new Error('Error al obtener provincias');
    const data = await res.json();
    // Normalizar para que el controlador de UI use .id y .nombre
    return data.map(p => ({ id: p.ID_PROVINCIA, nombre: p.NOMBRE }));
  } catch (error) {
    console.error('Error getProvincias:', error);
    return [];
  }
}

// ─── DISTRITOS por PROVINCIA (desde BD) ──────────────────────────────────────
export async function getDistritos(provinciaId) {
  try {
    const res = await fetchApi(`/api/provincias/${provinciaId}/distritos`);
    if (!res.ok) throw new Error('Error al obtener distritos');
    const data = await res.json();
    // Normalizar — el front usa .id, .nombre y .costo_delivery
    // costo_delivery por defecto 0 (la BD no lo tiene; se puede agregar luego)
    return data.map(d => ({
      id:             d.ID_DISTRITO,
      nombre:         d.NOMBRE,
      costo_delivery: 0   // puedes añadir columna COSTO_DELIVERY en la tabla Distritos
    }));
  } catch (error) {
    console.error('Error getDistritos:', error);
    return [];
  }
}

// ─── RESUMEN DEL PEDIDO (renderizar en demo.html) ────────────────────────────
export function mostrarResumenPedido() {
  const resumen = JSON.parse(sessionStorage.getItem('resumenPedido'));
  if (!resumen || !resumen.productos) {
    console.warn('No hay resumen en sessionStorage');
    return;
  }

  const contenedorItems = document.getElementById('items-pedido');
  const subtotalElement = document.getElementById('subtotal');
  const totalElement    = document.getElementById('total-pagar');
  if (!contenedorItems) return;

  contenedorItems.innerHTML = '';
  resumen.productos.forEach(p => {
    contenedorItems.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-4 py-2 border-b border-gray-100">
        <img src="${p.imagen || '/images/placeholder.jpg'}"
             alt="${p.nombre}"
             class="w-16 h-16 rounded-lg object-cover">
        <div class="flex-1">
          <h4 class="font-bold text-sm text-burger-dark">${p.nombre}</h4>
          <div class="flex justify-between items-center mt-1">
            <span class="text-sm font-bold text-burger-red">x${p.cantidad}</span>
            <span class="font-bold text-burger-dark">S/. ${(p.precio * p.cantidad).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `);
  });

  const subtotal = resumen.total || resumen.productos.reduce((a, p) => a + p.precio * p.cantidad, 0);
  subtotalElement.textContent = `S/. ${subtotal.toFixed(2)}`;
  totalElement.textContent    = `S/. ${subtotal.toFixed(2)}`;
}

// ─── PEDIDO EFECTIVO ──────────────────────────────────────────────────────────
export async function crearPedidoEfectivo(id_mesa, productos) {
  const response = await fetchWithAuth('/api/pedidos/tienda-efectivo', {
    method: 'POST',
    body: JSON.stringify({ id_mesa, productos })
  });
  if (!response) throw new Error('No autorizado o sesión expirada');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al crear pedido');
  return data;
}

// ─── CHECKOUT PRO (Tarjeta / Yape / Plin) ────────────────────────────────────
/**
 * Crea una preferencia de Checkout Pro y retorna la URL de redirección
 * @param {Object} payload - { productos, id_mesa, id_tipo_entrega, id_modalidad, direccion, id_distrito }
 * @returns {{ init_point, sandbox_init_point, preference_id, total }}
 */
export async function crearPedidoCheckoutPro(payload) {
  const response = await fetchWithAuth('/api/pedidos/checkout-pro', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response) throw new Error('No autorizado o sesión expirada');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al crear preferencia de pago');
  return data;
}
