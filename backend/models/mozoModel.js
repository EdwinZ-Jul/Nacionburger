const { poolPromise, sql } = require('../db');

//Obtener Pedidos Listos
async function obtenerPedidosListos() {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        P.ID_PEDIDO,
        P.FECHA_HORA,
        P.ID_ESTADO,
        P.ID_TIPO_ENTREGA,
        T.DESCRIPCION AS TIPO_ENTREGA,
        M.NUMERO AS NUMERO_MESA
      FROM Pedidos P
      LEFT JOIN Mesas M ON P.ID_MESA = M.ID_MESA
      INNER JOIN Tipos_Entrega T ON P.ID_TIPO_ENTREGA = T.ID_TIPO_ENTREGA
      WHERE P.ID_ESTADO = 3
      ORDER BY P.FECHA_HORA ASC
    `);

    return result.recordset;

  } catch (error) {
    console.error("Error obtenerPedidosListos:", error);
    throw error;
  }
}

async function actualizarEstadoPedidoMozo(idPedido, nuevoEstado) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idPedido", sql.Int, idPedido)
      .input("estado", sql.Int, nuevoEstado)
      .query(`
        UPDATE Pedidos
        SET ID_ESTADO = @estado
        WHERE ID_PEDIDO = @idPedido
      `);

    return result.rowsAffected[0] > 0;

  } catch (error) {
    console.error("Error actualizarEstadoPedidoMozo:", error);
    throw error;
  }
}

async function obtenerTipoEntregaPedido(idPedido) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("idPedido", sql.Int, idPedido)
      .query(`
        SELECT ID_TIPO_ENTREGA
        FROM Pedidos
        WHERE ID_PEDIDO = @idPedido
      `);

    return result.recordset[0];

  } catch (error) {
    console.error("Error obtenerTipoEntregaPedido:", error);
    throw error;
  }
}

async function obtenerMesas() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT 
      M.ID_MESA,
      M.NUMERO,
      M.ID_ESTADO,
      E.DESCRIPCION AS ESTADO
    FROM Mesas M
    INNER JOIN Estados_Mesa E ON M.ID_ESTADO = E.ID_ESTADO
  `);

  return result.recordset;
}

async function cambiarEstadoMesa(idMesa, estado) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("idMesa", sql.Int, idMesa)
    .input("estado", sql.Int, estado)
    .query(`
      UPDATE Mesas
      SET ID_ESTADO = @estado
      WHERE ID_MESA = @idMesa
    `);

  return result.rowsAffected[0] > 0;
}

module.exports = {
    obtenerPedidosListos,
    actualizarEstadoPedidoMozo,
    obtenerTipoEntregaPedido,
    obtenerMesas,
    cambiarEstadoMesa
}