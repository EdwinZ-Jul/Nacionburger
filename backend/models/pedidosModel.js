// models/pedidosModel.js
const { poolPromise, sql } = require('../db');

// ─── MESAS ───────────────────────────────────────────────────────────────────

async function obtenerMesasDisponibles() {
  const pool = await poolPromise;
  const result = await pool.request().query(`SELECT * FROM Mesas`);
  return result.recordset;
}

async function validarMesaDisponible(id_mesa) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id_mesa', sql.Int, id_mesa)
    .query(`SELECT ID_ESTADO FROM Mesas WHERE ID_MESA = @id_mesa`);
  if (result.recordset.length === 0) throw new Error('La mesa no existe');
  if (result.recordset[0].ID_ESTADO !== 1) throw new Error('La mesa no está disponible');
  return true;
}

// ─── MÉTODOS DE PAGO ─────────────────────────────────────────────────────────

async function obtenerMetodosPago() {
  const pool = await poolPromise;
  const result = await pool.request().query(`SELECT * FROM Modalidades_Pago`);
  return result.recordset;
}

// ─── VALIDACIÓN PRODUCTOS ────────────────────────────────────────────────────

async function validarProductosDisponibles(productos) {
  const pool = await poolPromise;
  for (const item of productos) {
    const result = await pool.request()
      .input('id', sql.Int, item.id_producto || item.id)
      .query(`SELECT ID_PLATILLO FROM Carta WHERE ID_PLATILLO = @id AND ID_ESTADO = 1`);
    if (result.recordset.length === 0) {
      throw new Error(`Producto ID ${item.id_producto || item.id} no disponible`);
    }
    if ((item.cantidad || 0) <= 0) throw new Error('Cantidad inválida');
  }
  return true;
}

// ─── CABECERA PEDIDO ─────────────────────────────────────────────────────────

async function crearPedido(transaction, { id_cliente, id_mesa, id_tipo_entrega = 1 }) {
  const request = new sql.Request(transaction);
  const result = await request
    .input('id_cliente',      sql.Int, id_cliente)
    .input('id_mesa',         sql.Int, id_mesa)
    .input('id_tipo_entrega', sql.Int, id_tipo_entrega)
    .query(`
      INSERT INTO Pedidos (ID_CLIENTE, ID_MESA, ID_ESTADO, ID_TIPO_ENTREGA)
      OUTPUT INSERTED.ID_PEDIDO
      VALUES (@id_cliente, @id_mesa, 1, @id_tipo_entrega)
    `);
  return result.recordset[0].ID_PEDIDO;
}

// ─── DETALLE PEDIDO ──────────────────────────────────────────────────────────
// Fix: crea un nuevo Request por cada producto para evitar error de parámetros duplicados

async function crearDetallePedido(transaction, id_pedido, productos) {
  for (const item of productos) {
    const request = new sql.Request(transaction); // ← nuevo Request por iteración
    await request
      .input('id_pedido',   sql.Int,          id_pedido)
      .input('id_platillo', sql.Int,          item.id)
      .input('cantidad',    sql.Int,          item.cantidad)
      .input('precio',      sql.Decimal(10,2), item.precio)
      .input('descuento',   sql.Decimal(5,2),  item.descuento || 0)
      .query(`
        INSERT INTO Detalle_Pedidos (ID_PEDIDO, ID_PLATILLO, CANTIDAD, PRECIO_UNITARIO, DESCUENTO_APLICADO)
        VALUES (@id_pedido, @id_platillo, @cantidad, @precio, @descuento)
      `);
  }
}

// ─── PAGO ────────────────────────────────────────────────────────────────────

async function crearPago(transaction, id_pedido, total, id_modalidad = 1, id_estado_pago = 1) {
  const request = new sql.Request(transaction);
  const result = await request
    .input('id_pedido',      sql.Int,          id_pedido)
    .input('id_modalidad',   sql.Int,          id_modalidad)
    .input('id_estado_pago', sql.Int,          id_estado_pago)
    .input('monto_total',    sql.Decimal(10,2), total)
    .query(`
      INSERT INTO Pagos (ID_PEDIDO, ID_MODALIDAD, ID_ESTADO_PAGO, MONTO_TOTAL, FECHA_PAGO)
      OUTPUT INSERTED.ID_PAGO
      VALUES (@id_pedido, @id_modalidad, @id_estado_pago, @monto_total, NULL)
    `);
  return result.recordset[0].ID_PAGO;
}

async function confirmarPago(id_pedido, id_modalidad, monto) {
  const pool = await poolPromise;
  await pool.request()
    .input('id_pedido',    sql.Int,          id_pedido)
    .input('id_modalidad', sql.Int,          id_modalidad)
    .input('monto',        sql.Decimal(10,2), monto)
    .query(`
      UPDATE Pagos
      SET ID_ESTADO_PAGO = 2, FECHA_PAGO = GETDATE(), MONTO_TOTAL = @monto
      WHERE ID_PEDIDO = @id_pedido AND ID_MODALIDAD = @id_modalidad
    `);
}

// ─── MESA ────────────────────────────────────────────────────────────────────

async function actualizarMesaOcupada(transaction, id_mesa) {
  const request = new sql.Request(transaction);
  const result = await request
    .input('id_mesa', sql.Int, id_mesa)
    .query(`UPDATE Mesas SET ID_ESTADO = 2 WHERE ID_MESA = @id_mesa`);
  if (result.rowsAffected[0] === 0) throw new Error('No se pudo actualizar la mesa');
  return true;
}

// ─── DELIVERY ────────────────────────────────────────────────────────────────

async function crearRegistroDelivery(transaction, { id_pedido, direccion, id_distrito }) {
  const request = new sql.Request(transaction);
  await request
    .input('id_pedido',  sql.Int,          id_pedido)
    .input('direccion',  sql.VarChar(200), direccion)
    .input('id_distrito',sql.Int,          id_distrito)
    .query(`
      INSERT INTO Delivery (ID_PEDIDO, DIRECCION_ENTREGA, ESTADO_ENVIO, ID_DISTRITO)
      VALUES (@id_pedido, @direccion, 'Pendiente', @id_distrito)
    `);
}

// ─── REFERENCIA EXTERNA (Checkout Pro) ───────────────────────────────────────

/**
 * Genera una referencia externa única para MP: "pedido_TEMP_<timestamp>"
 * Se actualiza luego con el ID real del pedido creado
 */
function generarReferenciaExterna(prefijo = 'TEMP') {
  return `NB_${prefijo}_${Date.now()}`;
}

module.exports = {
  obtenerMesasDisponibles,
  obtenerMetodosPago,
  validarMesaDisponible,
  validarProductosDisponibles,
  crearPedido,
  crearDetallePedido,
  crearPago,
  confirmarPago,
  actualizarMesaOcupada,
  crearRegistroDelivery,
  generarReferenciaExterna
};
