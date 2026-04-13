// controllers/pedidosController.js
const { poolPromise, sql } = require('../db');
const pedidosModel = require('../models/pedidosModel');
const { calcularResumenPedido } = require('../models/productoModel');
const { crearPreferenciaCheckoutPro, verificarPagoMP } = require('../models/MP_service');

// ──────────────────────────────────────────────────
// LISTAR MESAS
// ──────────────────────────────────────────────────
async function listarMesas(req, res) {
  try {
    const mesas = await pedidosModel.obtenerMesasDisponibles();
    res.json(mesas);
  } catch (error) {
    console.error('Error listarMesas:', error);
    res.status(500).json({ error: 'Error al obtener mesas disponibles' });
  }
}

// ──────────────────────────────────────────────────
// LISTAR MÉTODOS DE PAGO
// ──────────────────────────────────────────────────
async function listarMetodosPago(req, res) {
  try {
    const metodos = await pedidosModel.obtenerMetodosPago();
    res.json(metodos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métodos de pago' });
  }
}

// ──────────────────────────────────────────────────
// PEDIDO EFECTIVO (local)
// ──────────────────────────────────────────────────
const crearPedidoEfectivo = async (req, res) => {
  const { id_mesa, productos } = req.body;
  const id_cliente = req.user.cliente;

  if (!id_mesa || !productos || productos.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  let transaction;
  try {
    await pedidosModel.validarMesaDisponible(id_mesa);
    await pedidosModel.validarProductosDisponibles(productos);

    const resumen = await calcularResumenPedido(productos);

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const id_pedido = await pedidosModel.crearPedido(transaction, { id_cliente, id_mesa, id_tipo_entrega: 1 });
    await pedidosModel.crearDetallePedido(transaction, id_pedido, resumen.productos);
    await pedidosModel.crearPago(transaction, id_pedido, resumen.total, 1, 1); // efectivo, pendiente
    await pedidosModel.actualizarMesaOcupada(transaction, id_mesa);

    await transaction.commit();
    res.json({ message: 'Pedido creado correctamente', id_pedido, total: resumen.total });
  } catch (error) {
    console.error('Error crearPedidoEfectivo:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────
// CHECKOUT PRO — Tarjeta / Yape / Plin / MercadoPago
// ──────────────────────────────────────────────────
const crearPedidoCheckoutPro = async (req, res) => {
  const { productos, id_mesa, id_tipo_entrega, id_modalidad, direccion, id_distrito } = req.body;
  const id_cliente = req.user.cliente;
  const email      = req.user.email || req.user.usuario;

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: 'Productos requeridos' });
  }

  // Mapa de modalidad → métodos MP permitidos (null = todos)
  const metodosMP = {
    2: null,             // Tarjeta — todos los métodos
    3: ['wallet_purchase'],   // Yape (billetera digital en MP)
    4: ['wallet_purchase'],   // Plin
    5: null              // MercadoPago general
  };

  let transaction;
  try {
    // Validar disponibilidad antes de crear preferencia
    if (id_mesa) await pedidosModel.validarMesaDisponible(id_mesa);
    await pedidosModel.validarProductosDisponibles(productos);
    const resumen = await calcularResumenPedido(productos);

    // Crear referencia externa temporal
    const ext_ref = pedidosModel.generarReferenciaExterna('CP');

    // Crear preferencia en MP
    const metodosPago = metodosMP[id_modalidad] || null;
    const preferencia = await crearPreferenciaCheckoutPro({
      items: resumen.productos.map(p => ({
        id:          String(p.id),
        title:       p.nombre,
        quantity:    p.cantidad,
        unit_price:  Number(p.precio)
      })),
      email: email,
      external_ref: ext_ref,
      payment_methods: metodosPago
    });

    // Guardar datos temporales en sesión (se confirmarán por webhook)
    // Por ahora retornamos la URL de pago al frontend
    res.json({
      init_point:      preferencia.init_point,
      sandbox_init_point: preferencia.sandbox_init_point,
      preference_id:   preferencia.preference_id,
      external_ref:    ext_ref,
      total:           resumen.total
    });

  } catch (error) {
    console.error('Error crearPedidoCheckoutPro:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────
// WEBHOOK DE MERCADO PAGO
// ──────────────────────────────────────────────────
const webhookMP = async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('Webhook MP recibido:', type, data);

    if (type === 'payment' && data?.id) {
      const pagoInfo = await verificarPagoMP(data.id);
      console.log('Estado del pago:', pagoInfo);

      // Si el pago fue aprobado, actualizar en BD
      if (pagoInfo.status === 'approved') {
        console.log('Pago aprobado para:', pagoInfo.external_reference);
        // Aquí se podría buscar el pedido por external_reference y confirmar
        await pedidosModel.confirmarPago(
          null, // id_pedido (se necesita mapear desde external_ref)
          5,    // id_modalidad = MercadoPago
          pagoInfo.transaction_amount
        );
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error webhook MP:', error);
    res.status(500).send('Error');
  }
};

// ──────────────────────────────────────────────────
// PEDIDO DELIVERY (sin pago, se paga por MP webhook)
// ──────────────────────────────────────────────────
async function crearPedidoDelivery(req, res) {
  const { id_cliente, metodo_pago, total, productos, direccion, id_distrito } = req.body;

  if (!id_cliente || !metodo_pago || !total || !direccion || !id_distrito) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  let transaction;
  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const id_pedido = await pedidosModel.crearPedido(transaction, {
      id_cliente,
      id_mesa: null,
      id_tipo_entrega: 2 // delivery
    });

    if (productos && productos.length > 0) {
      const resumen = await calcularResumenPedido(productos);
      await pedidosModel.crearDetallePedido(transaction, id_pedido, resumen.productos);
    }

    await pedidosModel.crearPago(transaction, id_pedido, total, metodo_pago, 1);
    await pedidosModel.crearRegistroDelivery(transaction, { id_pedido, direccion, id_distrito });

    await transaction.commit();
    res.json({ message: 'Pedido con delivery registrado', id_pedido });
  } catch (error) {
    console.error('Error crearPedidoDelivery:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listarMesas,
  listarMetodosPago,
  crearPedidoEfectivo,
  crearPedidoCheckoutPro,
  crearPedidoDelivery,
  webhookMP
};
