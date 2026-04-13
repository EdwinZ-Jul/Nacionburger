// js/demoControl.js  — Controlador de UI para demo.html (pago)
import {
  getMesasDisponibles,
  getDistritos,
  getProvincias,
  mostrarResumenPedido,
  crearPedidoEfectivo,
  crearPedidoCheckoutPro
} from './fechtPago.js';

const UIController = {
  state: {
    tipoEntrega:          null,
    metodoPago:           null,
    mesaSeleccionada:     null,
    billeteraSeleccionada: null,
    datosDelivery:        {}
  },

  init() {
    this.bindEvents();
    mostrarResumenPedido();
    this.setupEntregaEvents();
  },

  bindEvents() {
    document.getElementById('card-number')?.addEventListener('input', e => {
      e.target.value = this.formatCardNumber(e.target.value);
    });
    document.getElementById('card-expiry')?.addEventListener('input', e => {
      e.target.value = this.formatExpiry(e.target.value);
    });
    document.getElementById('terminos')?.addEventListener('change', e => {
      document.getElementById('btn-pagar').disabled = !e.target.checked;
    });
  },

  formatCardNumber: v => v.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ').trim(),
  formatExpiry:     v => v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1/$2').substr(0,5),

  mostrarSeccionTipoEntrega(tipo) {
    ['seccion-mesas','seccion-delivery','seccion-recojo'].forEach(id => {
      document.getElementById(id)?.classList.add('section-hidden');
      document.getElementById(id)?.classList.remove('section-visible');
    });

    if (tipo === 'local') {
      document.getElementById('seccion-mesas').classList.replace('section-hidden','section-visible');
      this.cargarMesas();
    } else if (tipo === 'delivery') {
      document.getElementById('seccion-delivery').classList.replace('section-hidden','section-visible');
      this.cargarProvincias();
    } else if (tipo === 'recojo') {
      document.getElementById('seccion-recojo').classList.replace('section-hidden','section-visible');
    }

    ['step-metodo-pago','step-confirmacion'].forEach(id => {
      document.getElementById(id)?.classList.replace('section-hidden','section-visible');
    });

    this.renderizarMetodosPago(tipo);
  },

  setupEntregaEvents() {
    document.querySelectorAll('.tipo-entrega-card').forEach(card => {
      card.addEventListener('click', () => this.mostrarSeccionTipoEntrega(card.dataset.tipo));
    });
  },

  renderizarMetodosPago(tipo) {
    const container = document.getElementById('metodos-pago-container');
    container.innerHTML = '';

    // id_modalidad: 1=Efectivo, 2=Tarjeta, 3=Yape, 4=Plin
    const metodos = {
      local: [
        { id:'efectivo',  id_modalidad:1, nombre:'Efectivo',         icono:'fa-money-bill-wave', color:'text-green-600',  bg:'bg-green-50' },
        { id:'tarjeta',   id_modalidad:2, nombre:'Tarjeta',          icono:'fa-credit-card',     color:'text-blue-600',   bg:'bg-blue-50' },
        { id:'yape',      id_modalidad:3, nombre:'Yape',             icono:'fa-mobile-alt',      color:'text-purple-600', bg:'bg-purple-50' },
        { id:'plin',      id_modalidad:4, nombre:'Plin',             icono:'fa-mobile-alt',      color:'text-green-700',  bg:'bg-green-100' }
      ],
      delivery: [
        { id:'tarjeta',   id_modalidad:2, nombre:'Tarjeta',          icono:'fa-credit-card',     color:'text-blue-600',   bg:'bg-blue-50' },
        { id:'yape',      id_modalidad:3, nombre:'Yape',             icono:'fa-mobile-alt',      color:'text-purple-600', bg:'bg-purple-50' },
        { id:'plin',      id_modalidad:4, nombre:'Plin',             icono:'fa-mobile-alt',      color:'text-green-700',  bg:'bg-green-100' }
      ],
      recojo: [
        { id:'tarjeta',   id_modalidad:2, nombre:'Tarjeta',          icono:'fa-credit-card',     color:'text-blue-600',   bg:'bg-blue-50' },
        { id:'yape',      id_modalidad:3, nombre:'Yape',             icono:'fa-mobile-alt',      color:'text-purple-600', bg:'bg-purple-50' },
        { id:'plin',      id_modalidad:4, nombre:'Plin',             icono:'fa-mobile-alt',      color:'text-green-700',  bg:'bg-green-100' }
      ]
    };

    (metodos[tipo] || []).forEach(m => {
      const div = document.createElement('div');
      div.className = 'payment-card border-2 border-gray-200 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-burger-red';
      div.id = `metodo-${m.id}`;
      div.dataset.modalidad = m.id_modalidad;
      div.onclick = () => this.seleccionarMetodoPago(m.id, m.id_modalidad);
      div.innerHTML = `
        <div class="w-16 h-16 ${m.bg} rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="fas ${m.icono} ${m.color} text-2xl"></i>
        </div>
        <h3 class="font-bold text-lg">${m.nombre}</h3>
      `;
      container.appendChild(div);
    });
  },

  seleccionarMetodoPago(metodo, id_modalidad) {
    this.state.metodoPago    = metodo;
    this.state.id_modalidad  = id_modalidad;

    document.querySelectorAll('.payment-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`metodo-${metodo}`)?.classList.add('selected');

    // Ocultar todos los formularios
    ['form-tarjeta','form-billetera','form-efectivo'].forEach(id => {
      document.getElementById(id)?.classList.add('section-hidden');
      document.getElementById(id)?.classList.remove('section-visible');
    });

    // Mostrar el correspondiente
    const formMap = { tarjeta:'form-tarjeta', yape:'form-billetera', plin:'form-billetera', efectivo:'form-efectivo' };
    const formId  = formMap[metodo];
    if (formId) {
      document.getElementById(formId)?.classList.replace('section-hidden','section-visible');
      // Mostrar nombre de billetera si aplica
      if (metodo === 'yape' || metodo === 'plin') {
        const info = document.getElementById('billetera-seleccionada-info');
        if (info) info.classList.remove('section-hidden');
        const nb = document.getElementById('nombre-billetera');
        if (nb) nb.textContent = metodo.toUpperCase();
      }
    }

    // Actualizar mensaje de billetera
    if (metodo === 'yape' || metodo === 'plin') {
      this.state.billeteraSeleccionada = metodo;
    }
  },

  async cargarMesas() {
    const container = document.getElementById('mesas-container');
    container.innerHTML = '<div class="col-span-full text-center py-4"><div class="spinner mx-auto mb-2"></div>Cargando disponibilidad...</div>';
    try {
      const mesas = await getMesasDisponibles();
      container.innerHTML = '';
      mesas.forEach(mesa => {
        const disponible = mesa.ID_ESTADO === 1;
        const div = document.createElement('div');
        div.className = `p-4 rounded-xl border-2 text-center transition-all ${disponible ? 'border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer' : 'border-red-200 bg-red-50 opacity-50 cursor-not-allowed'}`;
        div.onclick = () => { if (disponible) this.seleccionarMesa(mesa.ID_MESA, div); };
        div.innerHTML = `
          <i class="fas fa-chair text-2xl mb-1 ${disponible ? 'text-green-600' : 'text-red-400'}"></i>
          <div class="font-bold text-sm">Mesa ${mesa.NUMERO}</div>
          <div class="text-xs ${disponible ? 'text-green-600' : 'text-red-500'}">${disponible ? 'Disponible' : 'Ocupada'}</div>
        `;
        container.appendChild(div);
      });
    } catch {
      container.innerHTML = '<div class="col-span-full text-center text-red-500">Error al cargar mesas.</div>';
    }
  },

  seleccionarMesa(mesaId, element) {
    this.state.mesaSeleccionada = mesaId;
    document.querySelectorAll('#mesas-container > div').forEach(el => {
      if (!el.classList.contains('opacity-50')) el.classList.remove('mesa-selected');
    });
    element.classList.add('mesa-selected');
  },

  async cargarProvincias() {
    const select = document.getElementById('provincia-select');
    select.innerHTML = '<option value="">Cargando...</option>';
    try {
      const provincias = await getProvincias();
      select.innerHTML = '<option value="">Selecciona provincia</option>';
      provincias.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nombre;
        select.appendChild(opt);
      });
    } catch {
      select.innerHTML = '<option value="">Error al cargar</option>';
    }
  },

  async cargarDistritos() {
    const provinciaId  = document.getElementById('provincia-select').value;
    const distritoSel  = document.getElementById('distrito-select');
    if (!provinciaId) {
      distritoSel.disabled = true;
      distritoSel.innerHTML = '<option value="">Primero selecciona provincia</option>';
      return;
    }
    distritoSel.disabled  = false;
    distritoSel.innerHTML = '<option value="">Cargando...</option>';
    try {
      const distritos = await getDistritos(provinciaId);
      distritoSel.innerHTML = '<option value="">Selecciona distrito</option>';
      distritos.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.nombre;
        opt.dataset.costo = d.costo_delivery;
        distritoSel.appendChild(opt);
      });
    } catch {
      distritoSel.innerHTML = '<option value="">Error al cargar</option>';
    }
  },

  validarFormulario() {
    const e = [];
    if (!this.state.tipoEntrega) { e.push('Selecciona un tipo de entrega'); return e; }
    if (this.state.tipoEntrega === 'local' && !this.state.mesaSeleccionada)  e.push('Selecciona una mesa');
    if (this.state.tipoEntrega === 'delivery') {
      if (!document.getElementById('provincia-select').value)    e.push('Selecciona una provincia');
      if (!document.getElementById('distrito-select').value)     e.push('Selecciona un distrito');
      if (!document.getElementById('direccion-input').value.trim()) e.push('Ingresa tu dirección');
      if (!document.getElementById('telefono-input').value.trim())  e.push('Ingresa un teléfono');
    }
    if (this.state.tipoEntrega === 'recojo') {
      if (!document.getElementById('recoge-nombre').value.trim())   e.push('Ingresa el nombre de quien recoge');
      if (!document.getElementById('recoge-telefono').value.trim()) e.push('Ingresa un teléfono');
    }
    if (!this.state.metodoPago) e.push('Selecciona un método de pago');
    return e;
  },

  getItemsPedido() {
    return (JSON.parse(sessionStorage.getItem('carrito')) || []).map(i => ({
      id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio
    }));
  },

  getTotal() {
    const txt = document.getElementById('total-pagar')?.textContent || '0';
    const m = txt.match(/(\d+\.?\d*)/);
    return m ? parseFloat(m[0]) : 0;
  },

  mostrarResumenFinal() {
    const container = document.getElementById('resumen-pedido-completo');
    if (!container) return;
    const tipo   = this.state.tipoEntrega;
    const metodo = this.state.metodoPago;
    const total  = this.getTotal();

    const metodoLabel = { efectivo:'Efectivo', tarjeta:'Tarjeta (MercadoPago)', yape:'Yape (MercadoPago)', plin:'Plin (MercadoPago)' };
    let html = `<div class="space-y-3 text-sm">
      <div class="flex justify-between border-b pb-2"><span class="text-gray-600">Tipo entrega:</span><span class="font-bold capitalize">${tipo}</span></div>`;

    if (tipo === 'local')    html += `<div class="flex justify-between border-b pb-2"><span class="text-gray-600">Mesa:</span><span class="font-bold">Mesa ${this.state.mesaSeleccionada}</span></div>`;
    if (tipo === 'delivery') html += `<div class="flex justify-between border-b pb-2"><span class="text-gray-600">Dirección:</span><span class="font-bold text-right">${document.getElementById('direccion-input')?.value}</span></div>`;
    if (tipo === 'recojo')   html += `<div class="flex justify-between border-b pb-2"><span class="text-gray-600">Recoge:</span><span class="font-bold">${document.getElementById('recoge-nombre')?.value}</span></div>`;

    html += `<div class="flex justify-between border-b pb-2"><span class="text-gray-600">Método:</span><span class="font-bold">${metodoLabel[metodo] || metodo}</span></div>
      <div class="flex justify-between pt-2 text-lg"><span class="font-bold">TOTAL:</span><span class="font-bold text-burger-red">S/. ${total.toFixed(2)}</span></div>
    </div>`;
    container.innerHTML = html;
  }
};

// ─── FUNCIONES GLOBALES EXPUESTAS AL HTML ─────────────────────────────────────

function selectTipoEntrega(tipo) {
  UIController.state.tipoEntrega = tipo;
  document.querySelectorAll('.tipo-entrega-card').forEach(el => {
    el.classList.toggle('active', el.dataset.tipo === tipo);
  });
  UIController.mostrarSeccionTipoEntrega(tipo);
}

function cargarDistritos() {
  UIController.cargarDistritos();
  document.getElementById('distrito-select').addEventListener('change', function() {
    const costo = parseInt(this.options[this.selectedIndex]?.dataset?.costo || 0);
    const subtotalTxt = document.getElementById('subtotal').textContent;
    const subtotal    = parseFloat(subtotalTxt.replace(/[^0-9.]/g,'')) || 0;
    document.getElementById('costo-delivery').textContent = `S/. ${costo.toFixed(2)}`;
    document.getElementById('total-pagar').textContent    = `S/. ${(subtotal + costo).toFixed(2)}`;
  });
}

function selectBilletera(billetera) {
  UIController.selectBilletera?.(billetera);
}

async function procesarPago() {
  const errores = UIController.validarFormulario();
  if (errores.length > 0) {
    alert('Por favor corrige los siguientes errores:\n\n• ' + errores.join('\n• '));
    return;
  }

  UIController.mostrarResumenFinal();

  const btn           = document.getElementById('btn-pagar');
  const textoOriginal = document.getElementById('texto-btn-pagar').textContent;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner border-white border-t-transparent w-5 h-5 mr-2 inline-block"></div> Procesando...';

  try {
    const tipo     = UIController.state.tipoEntrega;
    const metodo   = UIController.state.metodoPago;
    const items    = UIController.getItemsPedido();
    const total    = UIController.getTotal();
    const modalidad = UIController.state.id_modalidad; // 1=Efectivo,2=Tarjeta,3=Yape,4=Plin

    // ── EFECTIVO (solo local) ───────────────────────────────────────────────
    if (tipo === 'local' && metodo === 'efectivo') {
      const productos = items.map(i => ({ id_producto: i.id, cantidad: i.cantidad }));
      const resultado = await crearPedidoEfectivo(UIController.state.mesaSeleccionada, productos);
      sessionStorage.removeItem('carrito');
      sessionStorage.removeItem('resumenPedido');
      alert(`✅ Pedido creado. Acércate a caja para pagar.\nNº Pedido: ${resultado.id_pedido}`);
      window.location.href = 'pedido.html';
      return;
    }

    // ── CHECKOUT PRO (Tarjeta / Yape / Plin) ───────────────────────────────
    const payload = {
      productos:       items.map(i => ({ id_producto: i.id, cantidad: i.cantidad })),
      id_mesa:         UIController.state.mesaSeleccionada || null,
      id_tipo_entrega: tipo === 'local' ? 1 : tipo === 'delivery' ? 2 : 3,
      id_modalidad:    modalidad,
      direccion:       document.getElementById('direccion-input')?.value || null,
      id_distrito:     document.getElementById('distrito-select')?.value  || null
    };

    const respuesta = await crearPedidoCheckoutPro(payload);

    // Guardar referencia por si regresa el usuario
    sessionStorage.setItem('mp_ref', respuesta.external_ref);

    // Redirigir a Mercado Pago
    const url = respuesta.sandbox_init_point || respuesta.init_point;
    if (!url) throw new Error('No se recibió URL de pago de MercadoPago');

    sessionStorage.removeItem('carrito');
    sessionStorage.removeItem('resumenPedido');
    window.location.href = url;

  } catch (error) {
    console.error('Error procesarPago:', error);
    alert('❌ Error al procesar el pago: ' + error.message);
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-lock"></i> ${textoOriginal}`;
  }
}

document.addEventListener('DOMContentLoaded', () => UIController.init());

// Exponer al HTML
window.selectTipoEntrega = selectTipoEntrega;
window.cargarDistritos   = cargarDistritos;
window.selectBilletera   = selectBilletera;
window.procesarPago      = procesarPago;